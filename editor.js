/* Monta um index.html atualizado com os marcos acrescentados.
   Trabalha sobre uma cópia do documento em memória: nada é gravado no servidor. */

(function () {
  var LANES_PADRAO = [
    { id: 'mainframe', name: 'Mainframes' },
    { id: 'unix',      name: 'UNIX e derivados' },
    { id: 'pc',        name: 'CP/M e MS-DOS' },
    { id: 'vms',       name: 'VMS' },
    { id: 'apple',     name: 'Apple' },
    { id: 'windows',   name: 'Windows' },
    { id: 'linux',     name: 'Linux' },
    { id: 'mobile',    name: 'Móveis e nuvem' }
  ];

  var UNI = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito',
             'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis',
             'dezessete', 'dezoito', 'dezenove'];
  var DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta',
             'oitenta', 'noventa'];

  function extenso(n) {
    if (n < 20) return UNI[n];
    if (n > 99) return String(n);
    var d = Math.floor(n / 10), u = n % 10;
    return DEZ[d] + (u ? ' e ' + UNI[u] : '');
  }

  function maiuscula(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* texto do usuário vira conteúdo, não marcação — só <i> passa */
  function texto(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/&lt;i&gt;/g, '<i>').replace(/&lt;\/i&gt;/g, '</i>');
  }

  function atributo(t) {
    return t.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var $ = function (id) { return document.getElementById(id); };
  var status = $('status'), fallback = $('fallback'), grid = $('grid');
  var form = $('form'), erro = $('error'), toc = $('toc'), out = $('out');
  var doc = null, novos = [], ultimoHTML = '';

  function aviso(msg, tom) {
    status.textContent = msg;
    if (tom) status.dataset.tone = tom; else status.removeAttribute('data-tone');
    status.hidden = false;
  }

  /* ---------- carregamento ---------- */

  function adotar(html) {
    doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc.querySelector('.entry') || !doc.querySelector('.era')) {
      aviso('Esse arquivo não parece ser o index.html da linha do tempo.', 'erro');
      return;
    }
    fallback.hidden = true;
    grid.hidden = false;
    aviso(marcos().length + ' marcos carregados. Preencha o formulário para acrescentar outro.');
    render();
  }

  fetch('index.html', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    })
    .then(adotar)
    .catch(function () {
      aviso('Não foi possível ler o index.html automaticamente.', 'erro');
      fallback.hidden = false;
    });

  $('file').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () { adotar(String(fr.result)); };
    fr.readAsText(f, 'utf-8');
  });

  /* faixas do diagrama: lidas do próprio chart.js, para não duplicar a lista */
  function preencherFaixas(lanes) {
    var sel = $('f-lane');
    sel.innerHTML = '';
    var vazio = document.createElement('option');
    vazio.value = '';
    vazio.textContent = 'Sem faixa (só na linha do tempo)';
    sel.appendChild(vazio);
    lanes.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l.id;
      o.textContent = l.name;
      sel.appendChild(o);
    });
  }

  fetch('chart.js', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
    .then(function (src) {
      var re = /\{\s*id:\s*'(\w+)',\s*name:\s*'([^']*)'/g, m, achadas = [];
      while ((m = re.exec(src))) achadas.push({ id: m[1], name: m[2] });
      preencherFaixas(achadas.length ? achadas : LANES_PADRAO);
    })
    .catch(function () { preencherFaixas(LANES_PADRAO); });

  /* ---------- leitura do documento ---------- */

  function eras() { return Array.prototype.slice.call(doc.querySelectorAll('.era')); }
  function marcos() { return Array.prototype.slice.call(doc.querySelectorAll('.entry')); }
  function marcosDe(era) { return Array.prototype.slice.call(era.querySelectorAll('.entry')); }
  function ano(e) { return +e.dataset.year; }

  /* a época é a última cujo primeiro marco não passa do ano informado */
  function eraDoAno(y) {
    var lista = eras(), escolhida = lista[0];
    lista.forEach(function (era) {
      var anos = marcosDe(era).map(ano);
      if (anos.length && Math.min.apply(null, anos) <= y) escolhida = era;
    });
    return escolhida;
  }

  function tituloEra(era) {
    var h = era.querySelector('.era-head h2');
    return h ? h.textContent.trim() : '';
  }

  function idLivre(y) {
    var base = 'a' + y, id = base, n = 2;
    while (doc.getElementById(id)) { id = base + '-' + n; n++; }
    return id;
  }

  /* ---------- montagem ---------- */

  function htmlDoMarco(d) {
    return '<article class="entry" id="' + d.id + '" data-year="' + d.year + '"' +
      (d.lane ? ' data-lane="' + d.lane + '"' : '') +
      ' data-short="' + atributo(d.short) + '">\n' +
      '        <p class="entry-year">' + d.year + '</p>\n' +
      '        <div class="entry-body">\n' +
      '          <h3>' + texto(d.title) + '</h3>\n' +
      '          <p>' + texto(d.text) + '</p>\n' +
      '        </div>\n' +
      '      </article>';
  }

  function acrescentar(d) {
    var era = eraDoAno(d.year);
    var html = htmlDoMarco(d);
    var seguinte = null;

    marcosDe(era).forEach(function (e) {
      if (!seguinte && ano(e) > d.year) seguinte = e;
    });

    if (seguinte) {
      seguinte.insertAdjacentHTML('beforebegin', html + '\n\n      ');
    } else {
      var lista = marcosDe(era);
      lista[lista.length - 1].insertAdjacentHTML('afterend', '\n\n      ' + html);
    }

    /* o intervalo do título da época passa a cobrir o novo marco */
    var anos = marcosDe(era).map(ano);
    var faixa = era.querySelector('.era-span');
    if (faixa) {
      faixa.textContent = Math.min.apply(null, anos) + '–' + Math.max.apply(null, anos);
    }

    /* contagem por extenso e intervalo geral */
    var todos = marcos().map(ano);
    var menor = Math.min.apply(null, todos), maior = Math.max.apply(null, todos);
    var total = todos.length;

    Array.prototype.forEach.call(doc.querySelectorAll('[data-count]'), function (el) {
      el.textContent = maiuscula(extenso(total));
    });
    var de = doc.querySelector('[data-from]'), ate = doc.querySelector('[data-to]');
    if (de) de.textContent = menor;
    if (ate) ate.textContent = maior;

    var chart = doc.getElementById('chart');
    if (chart) {
      chart.setAttribute('data-from', menor);
      chart.setAttribute('data-to', maior);
    }

    novos.push(d.id);
    ultimoHTML = html;
    return { era: tituloEra(era), fora: d.year < 1956 || d.year > 2026 };
  }

  /* ---------- lista ---------- */

  function linha(y, titulo, estado) {
    var li = document.createElement('div');
    li.className = 'toc-item';
    if (estado) li.dataset.state = estado;
    var b = document.createElement('b');
    b.textContent = y;
    var s = document.createElement('span');
    s.textContent = titulo;
    li.appendChild(b);
    li.appendChild(s);
    return li;
  }

  function render() {
    toc.innerHTML = '';
    var y = parseInt($('f-year').value, 10);
    var previa = !isNaN(y) && y >= 1940 && y <= 2100;
    var eraPrevia = previa ? eraDoAno(y) : null;
    var tituloPrevia = $('f-title').value.trim() || 'novo marco';

    eras().forEach(function (era, i) {
      var cab = document.createElement('p');
      cab.className = 'toc-era';
      cab.style.setProperty('--era', 'var(--era-' + (i + 1) + ')');
      cab.textContent = tituloEra(era);
      toc.appendChild(cab);

      var grupo = document.createElement('div');
      grupo.style.setProperty('--era', 'var(--era-' + (i + 1) + ')');

      var colocada = false;
      marcosDe(era).forEach(function (e) {
        if (previa && era === eraPrevia && !colocada && ano(e) > y) {
          grupo.appendChild(linha(y, tituloPrevia, 'previsto'));
          colocada = true;
        }
        var h3 = e.querySelector('h3');
        grupo.appendChild(linha(
          ano(e),
          h3 ? h3.textContent.trim() : '',
          novos.indexOf(e.id) > -1 ? 'novo' : ''
        ));
      });
      if (previa && era === eraPrevia && !colocada) {
        grupo.appendChild(linha(y, tituloPrevia, 'previsto'));
      }

      toc.appendChild(grupo);
    });
  }

  ['f-year', 'f-title'].forEach(function (id) {
    $(id).addEventListener('input', function () { if (doc) render(); });
  });

  /* ---------- envio ---------- */

  function falhar(msg) {
    erro.textContent = msg;
    erro.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    erro.hidden = true;

    var y = parseInt($('f-year').value, 10);
    var titulo = $('f-title').value.trim();
    var corpo = $('f-text').value.trim();
    var curto = $('f-short').value.trim() || titulo;

    if (isNaN(y) || y < 1940 || y > 2100) return falhar('Informe um ano entre 1940 e 2100.');
    if (!titulo) return falhar('O título é obrigatório.');
    if (!corpo) return falhar('A descrição é obrigatória.');

    var r = acrescentar({
      id: idLivre(y),
      year: y,
      lane: $('f-lane').value,
      short: curto.slice(0, 28),
      title: titulo,
      text: corpo
    });

    form.reset();
    render();

    out.hidden = false;
    $('snippet').textContent = ultimoHTML;
    $('out-note').textContent = novos.length === 1
      ? 'Um marco acrescentado, na época "' + r.era + '".'
      : novos.length + ' marcos acrescentados. O arquivo traz todos.';

    aviso('Marco de ' + y + ' acrescentado em "' + r.era + '". ' +
      (r.fora
        ? 'Atenção: o ano está fora de 1956-2026, então ajuste à mão a frase de abertura, que fala em setenta anos.'
        : 'Baixe o index.html ao lado quando terminar.'),
      r.fora ? 'erro' : '');

    $('f-year').focus();
  });

  $('download').addEventListener('click', function () {
    var html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML + '\n';
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  $('copy').addEventListener('click', function () {
    var btn = this;
    navigator.clipboard.writeText(ultimoHTML).then(function () {
      btn.textContent = 'Copiado';
      setTimeout(function () { btn.textContent = 'Copiar'; }, 1600);
    }, function () {
      btn.textContent = 'Não foi possível copiar';
    });
  });
})();
