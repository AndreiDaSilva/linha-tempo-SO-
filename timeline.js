/* Monta a linha do tempo a partir do dados.json e liga o diagrama e a rolagem.
   Todo o conteúdo vive no JSON: esta página é só a casca. */

(function () {
  var alvo = document.getElementById('timeline');
  if (!alvo) return;

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

  /* o texto do JSON entra como conteúdo; só a ênfase em itálico passa como marcação */
  function formatar(t) {
    return String(t || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/&lt;i&gt;/g, '<i>').replace(/&lt;\/i&gt;/g, '</i>');
  }

  function atributo(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                          .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function falhar(msg) {
    alvo.innerHTML = '<p class="aviso">' + msg + '</p>';
  }

  function montar(dados) {
    var epocas = (dados.epocas || []).filter(function (e) {
      return e.marcos && e.marcos.length;
    });

    if (!epocas.length) return falhar('O <code>dados.json</code> não tem nenhum marco.');

    /* ordena por ano, para o arquivo poder ser editado à mão sem cuidado com a ordem */
    epocas.forEach(function (e) {
      e.marcos.sort(function (a, b) { return a.ano - b.ano; });
    });
    epocas.sort(function (a, b) { return a.marcos[0].ano - b.marcos[0].ano; });

    var anos = [];
    epocas.forEach(function (e) {
      e.marcos.forEach(function (m) { anos.push(+m.ano); });
    });
    var menor = Math.min.apply(null, anos), maior = Math.max.apply(null, anos);
    var total = anos.length;
    var ultimo = epocas[epocas.length - 1].marcos.length - 1;

    var usados = {};
    function id(ano) {
      var base = 'a' + ano, out = base, n = 2;
      while (usados[out]) { out = base + '-' + n; n++; }
      usados[out] = true;
      return out;
    }

    var html = epocas.map(function (epoca, i) {
      var cor = 'var(--era-' + Math.min(i + 1, 6) + ')';
      var faixaAnos = epoca.marcos.map(function (m) { return +m.ano; });
      var de = Math.min.apply(null, faixaAnos), ate = Math.max.apply(null, faixaAnos);

      var marcos = epoca.marcos.map(function (m, k) {
        var derradeiro = i === epocas.length - 1 && k === ultimo;
        return '' +
          '      <article class="entry' + (derradeiro ? ' entry-last' : '') + '"' +
          ' id="' + id(m.ano) + '" data-year="' + (+m.ano) + '"' +
          (m.faixa ? ' data-lane="' + atributo(m.faixa) + '"' : '') +
          ' data-short="' + atributo(m.curto || m.titulo) + '">\n' +
          '        <p class="entry-year">' + (+m.ano) + '</p>\n' +
          '        <div class="entry-body">\n' +
          '          <h3>' + formatar(m.titulo) + '</h3>\n' +
          '          <p>' + formatar(m.texto) + '</p>\n' +
          '        </div>\n' +
          '      </article>';
      }).join('\n\n');

      return '' +
        '  <section class="era" style="--era: ' + cor + '">\n' +
        '    <div class="era-head">\n' +
        '      <p class="era-span">' + de + '–' + ate + '</p>\n' +
        '      <h2>' + formatar(epoca.nome) + '</h2>\n' +
        '    </div>\n' +
        '    <div class="entries">\n' + marcos + '\n    </div>\n' +
        '  </section>';
    }).join('\n\n');

    alvo.innerHTML = html;

    Array.prototype.forEach.call(document.querySelectorAll('[data-count]'), function (el) {
      el.textContent = maiuscula(extenso(total));
    });
    var de = document.querySelector('[data-year-from]');
    var ate = document.querySelector('[data-year-to]');
    if (de) de.textContent = menor;
    if (ate) ate.textContent = maior;

    var chart = document.getElementById('chart');
    if (chart) {
      chart.setAttribute('data-from', menor);
      chart.setAttribute('data-to', maior);
    }

    if (window.montarDiagrama) window.montarDiagrama(dados.faixas || []);
    if (window.ativarRolagem) window.ativarRolagem();
  }

  fetch('dados.json', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(montar)
    .catch(function (e) {
      falhar(location.protocol === 'file:'
        ? 'Esta página lê o <code>dados.json</code>, e o navegador bloqueia essa leitura ' +
          'quando o arquivo é aberto direto do disco. Sirva a pasta com ' +
          '<code>python3 -m http.server</code> e acesse <code>http://localhost:8000</code>.'
        : 'Não foi possível carregar o <code>dados.json</code> (' + e.message + ').');
    });
})();
