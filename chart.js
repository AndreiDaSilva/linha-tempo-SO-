/* Os dois diagramas da página, que compartilham o mesmo eixo de anos.

   "Linhagens" tem uma linha por família de sistemas; "Recursos", uma por
   capacidade. Em ambos, cada marcador é um marco da linha do tempo — lidos
   do HTML já montado, então os diagramas nunca saem de sincronia com o texto. */

(function () {
  var FROM, TO, inicios, still;

  function pct(year) { return ((year - FROM) / (TO - FROM)) * 100; }

  function contexto() {
    still = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    inicios = [];
    Array.prototype.forEach.call(document.querySelectorAll('.era'), function (era) {
      var e = era.querySelectorAll('.entry');
      if (e.length) inicios.push(+e[0].dataset.year);
    });
  }

  function marcosDaPagina() {
    return Array.prototype.map.call(document.querySelectorAll('.entry'), function (entry) {
      var era = entry.closest('.era');
      var i = Array.prototype.indexOf.call(document.querySelectorAll('.era'), era);
      return {
        el: entry,
        year: +entry.dataset.year,
        label: entry.dataset.short,
        target: entry.id,
        faixa: entry.dataset.lane || '',
        recursos: (entry.dataset.recursos || '').split(/\s+/).filter(Boolean),
        color: 'var(--era-' + Math.min(i + 1, 6) + ')'
      };
    });
  }

  /* Rampa de matiz: uma âncora no primeiro ano de cada época. Uma barra recebe
     todas elas posicionadas em relação ao seu início e fim, então o gradiente
     mostra as cores das épocas que ela atravessou. */
  function ramp(start, end) {
    var span = end - start || 1;
    return 'linear-gradient(90deg, ' + inicios.map(function (year, i) {
      return 'var(--era-' + Math.min(i + 1, 6) + ') ' +
             (((year - start) / span) * 100).toFixed(2) + '%';
    }).join(', ') + ')';
  }

  function desenhar(el, linhas) {
    el.innerHTML = '';

    var ticks = [FROM];
    for (var y = Math.ceil(FROM / 10) * 10; y < TO; y += 10) {
      if (y - FROM > 5 && TO - y > 5) ticks.push(y);
    }
    ticks.push(TO);

    var grid = document.createElement('div');
    grid.className = 'chart-grid';
    ticks.slice(1, -1).forEach(function (year) {
      var line = document.createElement('span');
      line.style.left = pct(year) + '%';
      grid.appendChild(line);
    });
    el.appendChild(grid);

    var delay = 0;
    linhas.forEach(function (linha) {
      var row = document.createElement('div');
      row.className = 'lane';

      var name = document.createElement('div');
      name.className = 'lane-name';
      name.textContent = linha.nome;
      row.appendChild(name);

      var track = document.createElement('div');
      track.className = 'lane-track';

      if (linha.fim > linha.inicio) {
        var bar = document.createElement('div');
        bar.className = 'lane-bar';
        bar.style.left = pct(linha.inicio) + '%';
        bar.style.width = (pct(linha.fim) - pct(linha.inicio)) + '%';
        bar.style.backgroundImage = ramp(linha.inicio, linha.fim);
        bar.style.animationDelay = delay + 'ms';
        track.appendChild(bar);
      }

      linha.marcas.forEach(function (m) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'mark';
        dot.style.left = pct(m.year) + '%';
        dot.style.color = m.color;
        dot.style.animationDelay = (delay + 380) + 'ms';
        dot.setAttribute('aria-label', m.year + ', ' + m.label + '. Ir para o marco.');
        dot.dataset.year = m.year;
        dot.dataset.label = m.label;
        dot.dataset.target = m.target;
        track.appendChild(dot);
      });

      row.appendChild(track);
      el.appendChild(row);
      delay += 70;
    });

    var axis = document.createElement('div');
    axis.className = 'chart-axis';
    ticks.forEach(function (year) {
      var t = document.createElement('span');
      t.style.left = pct(year) + '%';
      t.textContent = year;
      axis.appendChild(t);
    });
    el.appendChild(axis);

    if (!still) el.dataset.animate = '1';

    ligar(el);
  }

  function ligar(el) {
    var tip = document.createElement('div');
    tip.className = 'tip';
    el.appendChild(tip);

    function mostrar(dot) {
      tip.innerHTML = '';
      var y = document.createElement('b');
      y.textContent = dot.dataset.year;
      tip.appendChild(y);
      tip.appendChild(document.createTextNode(dot.dataset.label));
      var a = dot.getBoundingClientRect(), b = el.getBoundingClientRect();
      tip.style.left = (a.left - b.left + a.width / 2) + 'px';
      tip.style.top = (a.top - b.top) + 'px';
      tip.dataset.show = '1';
    }

    function esconder() { tip.dataset.show = '0'; }

    el.addEventListener('click', function (e) {
      var dot = e.target.closest('.mark');
      if (!dot) return;
      var entry = document.getElementById(dot.dataset.target);
      if (!entry) return;
      entry.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
      var antes = document.querySelector('.entry.is-target');
      if (antes) antes.classList.remove('is-target');
      entry.classList.remove('is-target');
      void entry.offsetWidth;
      entry.classList.add('is-target');
    });

    ['mouseover', 'focusin'].forEach(function (type) {
      el.addEventListener(type, function (e) {
        var dot = e.target.closest && e.target.closest('.mark');
        if (dot) mostrar(dot);
      });
    });

    ['mouseout', 'focusout'].forEach(function (type) {
      el.addEventListener(type, function (e) {
        if (e.target.closest && e.target.closest('.mark')) esconder();
      });
    });

    window.addEventListener('resize', esconder);
  }

  /* ---------- linhagens: uma linha por família ---------- */

  window.montarDiagrama = function (faixas) {
    var el = document.getElementById('chart');
    if (!el || !faixas || !faixas.length) return;

    FROM = +el.dataset.from;
    TO = +el.dataset.to;
    contexto();

    var marcos = marcosDaPagina();
    desenhar(el, faixas.map(function (f) {
      return {
        nome: f.nome,
        inicio: f.inicio,
        fim: f.fim,
        marcas: marcos.filter(function (m) { return m.faixa === f.id; })
      };
    }));
  };

  /* ---------- recursos: uma linha por capacidade ---------- */

  window.montarRecursos = function (recursos) {
    var el = document.getElementById('recursos');
    if (!el || !recursos || !recursos.length) return;

    FROM = +el.dataset.from;
    TO = +el.dataset.to;
    contexto();

    var marcos = marcosDaPagina();
    var linhas = [];

    recursos.forEach(function (r) {
      var marcas = marcos.filter(function (m) {
        return m.recursos.indexOf(r.id) > -1;
      });
      if (!marcas.length) return;
      /* a barra vai da estreia até o fim do período: nenhuma dessas
         capacidades deixou de ser usada depois que apareceu */
      var anos = marcas.map(function (m) { return m.year; });
      linhas.push({
        nome: r.nome,
        inicio: Math.min.apply(null, anos),
        fim: TO,
        marcas: marcas
      });
    });

    /* ordenadas pelo ano em que a capacidade apareceu */
    linhas.sort(function (a, b) { return a.inicio - b.inicio; });
    desenhar(el, linhas);
  };
})();
