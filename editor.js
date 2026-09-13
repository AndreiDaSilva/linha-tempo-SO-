/* Edita o dados.json no navegador e devolve o arquivo pronto para baixar.
   Nada é gravado no servidor: o site é estático. */

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var status = $('status'), fallback = $('fallback'), grid = $('grid');
  var form = $('form'), erro = $('error'), toc = $('toc');

  var dados = null;
  var editando = null;   /* {ep: índice da época, mc: índice do marco} */
  var alteracoes = 0;

  function aviso(msg, tom) {
    status.innerHTML = msg;
    if (tom) status.dataset.tone = tom; else status.removeAttribute('data-tone');
  }

  /* ---------- carregamento ---------- */

  function adotar(texto) {
    var lido;
    try {
      lido = JSON.parse(texto);
    } catch (e) {
      return aviso('O arquivo não é um JSON válido: ' + e.message, 'erro');
    }
    if (!lido || !Array.isArray(lido.epocas) || !lido.epocas.length) {
      return aviso('Esse JSON não tem a lista <code>epocas</code>.', 'erro');
    }
    dados = lido;
    dados.faixas = dados.faixas || [];
    dados.epocas.forEach(function (e) { e.marcos = e.marcos || []; });
    ordenar();

    fallback.hidden = true;
    grid.hidden = false;
    preencherSelects();
    render();
    aviso(totalMarcos() + ' marcos carregados em ' + dados.epocas.length + ' épocas.');
  }

  fetch('dados.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(adotar)
    .catch(function () {
      aviso('Não foi possível ler o <code>dados.json</code> automaticamente.', 'erro');
      fallback.hidden = false;
    });

  $('file').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () { adotar(String(fr.result)); };
    fr.readAsText(f, 'utf-8');
  });

  /* ---------- estado ---------- */

  function ordenar() {
    dados.epocas.forEach(function (e) {
      e.marcos.sort(function (a, b) { return a.ano - b.ano; });
    });
    dados.epocas.sort(function (a, b) {
      var x = a.marcos.length ? a.marcos[0].ano : Infinity;
      var y = b.marcos.length ? b.marcos[0].ano : Infinity;
      return x - y;
    });
  }

  function totalMarcos() {
    return dados.epocas.reduce(function (n, e) { return n + e.marcos.length; }, 0);
  }

  function intervalo(epoca) {
    if (!epoca.marcos.length) return '—';
    var anos = epoca.marcos.map(function (m) { return +m.ano; });
    return Math.min.apply(null, anos) + '–' + Math.max.apply(null, anos);
  }

  /* época sugerida: a última cujo primeiro marco não passa do ano */
  function epocaDoAno(ano) {
    var escolhida = 0;
    dados.epocas.forEach(function (e, i) {
      if (e.marcos.length && e.marcos[0].ano <= ano) escolhida = i;
    });
    return escolhida;
  }

  function marcado() {
    alteracoes++;
    $('out-note').textContent = alteracoes === 1
      ? '1 alteração pendente. Baixe o arquivo para aplicá-la.'
      : alteracoes + ' alterações pendentes. Baixe o arquivo para aplicá-las.';
  }

  /* ---------- selects ---------- */

  function preencherSelects() {
    var faixa = $('f-lane');
    faixa.innerHTML = '';
    var nenhuma = document.createElement('option');
    nenhuma.value = '';
    nenhuma.textContent = 'Sem faixa (só na linha do tempo)';
    faixa.appendChild(nenhuma);
    dados.faixas.forEach(function (f) {
      var o = document.createElement('option');
      o.value = f.id;
      o.textContent = f.nome;
      faixa.appendChild(o);
    });
    preencherRecursos();
    preencherEpocas();
  }

  function preencherRecursos() {
    var caixa = $('f-recursos');
    caixa.innerHTML = '';
    (dados.recursos || []).forEach(function (r) {
      var rot = document.createElement('label');
      var inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.value = r.id;
      inp.name = 'recurso';
      rot.appendChild(inp);
      rot.appendChild(document.createTextNode(r.nome));
      caixa.appendChild(rot);
    });
  }

  function recursosMarcados() {
    return Array.prototype.filter.call(
      $('f-recursos').querySelectorAll('input'), function (i) { return i.checked; }
    ).map(function (i) { return i.value; });
  }

  function marcarRecursos(lista) {
    var tem = lista || [];
    Array.prototype.forEach.call($('f-recursos').querySelectorAll('input'), function (i) {
      i.checked = tem.indexOf(i.value) > -1;
    });
  }

  function preencherEpocas() {
    var sel = $('f-era'), antes = sel.value;
    sel.innerHTML = '';
    dados.epocas.forEach(function (e, i) {
      var o = document.createElement('option');
      o.value = i;
      o.textContent = intervalo(e) + '  ' + e.nome;
      sel.appendChild(o);
    });
    if (antes !== '' && sel.options[antes]) sel.value = antes;
  }

  /* ao digitar o ano, sugere a época — sem atropelar uma escolha manual */
  var epocaManual = false;
  $('f-era').addEventListener('change', function () { epocaManual = true; });
  $('f-year').addEventListener('input', function () {
    if (epocaManual || !dados) return;
    var y = parseInt(this.value, 10);
    if (!isNaN(y)) $('f-era').value = epocaDoAno(y);
  });

  /* ---------- lista ---------- */

  function botao(rotulo, classe, acao) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = classe;
    b.textContent = rotulo;
    b.addEventListener('click', acao);
    return b;
  }

  function render() {
    toc.innerHTML = '';
    $('count').textContent = totalMarcos() + ' marcos';

    dados.epocas.forEach(function (epoca, ei) {
      var cab = document.createElement('p');
      cab.className = 'toc-era';
      cab.style.setProperty('--era', 'var(--era-' + Math.min(ei + 1, 6) + ')');
      var anos = document.createElement('b');
      anos.textContent = intervalo(epoca);
      cab.appendChild(anos);
      cab.appendChild(document.createTextNode(epoca.nome));
      toc.appendChild(cab);

      var grupo = document.createElement('div');
      grupo.style.setProperty('--era', 'var(--era-' + Math.min(ei + 1, 6) + ')');

      if (!epoca.marcos.length) {
        var vazia = document.createElement('p');
        vazia.className = 'toc-vazia';
        vazia.textContent = 'Sem marcos.';
        grupo.appendChild(vazia);
      }

      epoca.marcos.forEach(function (marco, mi) {
        var li = document.createElement('div');
        li.className = 'toc-item';
        if (editando && editando.ep === ei && editando.mc === mi) li.dataset.state = 'editando';

        var b = document.createElement('b');
        b.textContent = marco.ano;

        var s = document.createElement('span');
        s.textContent = marco.titulo;

        var acoes = document.createElement('div');
        acoes.className = 'toc-acoes';
        acoes.appendChild(botao('Editar', 'mini', function () { editar(ei, mi); }));
        acoes.appendChild(botao('Remover', 'mini mini-perigo', function () { remover(ei, mi); }));

        li.appendChild(b);
        li.appendChild(s);
        li.appendChild(acoes);
        grupo.appendChild(li);
      });

      toc.appendChild(grupo);
    });
  }

  /* ---------- formulário ---------- */

  function limpar() {
    form.reset();
    marcarRecursos([]);
    editando = null;
    epocaManual = false;
    erro.hidden = true;
    $('form-title').textContent = 'Novo marco';
    $('submit').textContent = 'Acrescentar marco';
    $('cancel').hidden = true;
    render();
  }

  function editar(ei, mi) {
    var m = dados.epocas[ei].marcos[mi];
    editando = { ep: ei, mc: mi };
    epocaManual = true;
    $('f-year').value = m.ano;
    $('f-title').value = m.titulo;
    $('f-text').value = m.texto;
    $('f-era').value = ei;
    $('f-lane').value = m.faixa || '';
    marcarRecursos(m.recursos);
    $('f-short').value = m.curto && m.curto !== m.titulo ? m.curto : '';
    $('form-title').textContent = 'Editando ' + m.ano + ' — ' + m.titulo;
    $('submit').textContent = 'Salvar alterações';
    $('cancel').hidden = false;
    erro.hidden = true;
    render();
    $('f-year').focus();
  }

  function remover(ei, mi) {
    var m = dados.epocas[ei].marcos[mi];
    if (!window.confirm('Remover o marco de ' + m.ano + ', "' + m.titulo + '"?')) return;
    dados.epocas[ei].marcos.splice(mi, 1);
    if (editando && editando.ep === ei && editando.mc === mi) limpar();
    ordenar();
    preencherEpocas();
    marcado();
    render();
    aviso('Marco de ' + m.ano + ' removido. Restam ' + totalMarcos() + '.');
  }

  $('cancel').addEventListener('click', limpar);

  function falhar(msg) {
    erro.textContent = msg;
    erro.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    erro.hidden = true;

    var ano = parseInt($('f-year').value, 10);
    var titulo = $('f-title').value.trim();
    var texto = $('f-text').value.trim();
    var curto = $('f-short').value.trim() || titulo;
    /* o select é override: sem escolha explícita, a época vem do ano */
    var ei = epocaManual ? parseInt($('f-era').value, 10) : epocaDoAno(ano);

    if (isNaN(ano) || ano < 1940 || ano > 2100) return falhar('Informe um ano entre 1940 e 2100.');
    if (!titulo) return falhar('O título é obrigatório.');
    if (!texto) return falhar('A descrição é obrigatória.');
    if (isNaN(ei) || !dados.epocas[ei]) return falhar('Escolha uma época.');

    var marco = {
      ano: ano,
      titulo: titulo,
      texto: texto,
      faixa: $('f-lane').value,
      curto: curto.slice(0, 28),
      recursos: recursosMarcados()
    };

    var acao;
    if (editando) {
      dados.epocas[editando.ep].marcos.splice(editando.mc, 1);
      acao = 'atualizado';
    } else {
      acao = 'acrescentado';
    }
    dados.epocas[ei].marcos.push(marco);

    ordenar();
    preencherEpocas();
    marcado();
    limpar();
    aviso('Marco de ' + ano + ' ' + acao + ' em "' + dados.epocas[ei].nome + '". ' +
          'São ' + totalMarcos() + ' marcos.');
    $('f-year').focus();
  });

  /* ---------- saída ---------- */

  $('download').addEventListener('click', function () {
    if (!dados) return;
    var texto = JSON.stringify(dados, null, 2) + '\n';
    var blob = new Blob([texto], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'dados.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  window.addEventListener('beforeunload', function (e) {
    if (!alteracoes) return;
    e.preventDefault();
    e.returnValue = '';
  });
})();
