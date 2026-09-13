/* Diagrama de linhagens.
   A fonte de dados é o próprio HTML: cada <article class="entry"> traz
   data-year, data-lane e data-short. Sem JavaScript, a linha do tempo
   continua completa; apenas o diagrama deixa de aparecer. */

(function () {
  var chart = document.getElementById('chart');
  if (!chart) return;

  var FROM = +chart.dataset.from;
  var TO   = +chart.dataset.to;

  var LANES = [
    { id: 'mainframe', name: 'Mainframes', start: 1956, end: 1972 },
    { id: 'unix',      name: 'UNIX e derivados',  start: 1969, end: 2026 },
    { id: 'pc',        name: 'CP/M e MS-DOS',     start: 1974, end: 1995 },
    { id: 'vms',       name: 'VMS',                start: 1977, end: 2000 },
    { id: 'apple',     name: 'Apple',             start: 1984, end: 2026 },
    { id: 'windows',   name: 'Windows',           start: 1985, end: 2026 },
    { id: 'linux',     name: 'Linux',             start: 1991, end: 2026 },
    { id: 'mobile',    name: 'Móveis e nuvem',    start: 2007, end: 2026 }
  ];

  var TICKS = [1956, 1970, 1980, 1990, 2000, 2010, 2020, 2026];

  /* Âncoras da rampa de matiz: o ano em que cada época começa.
     Uma faixa recebe um gradiente com todas elas, posicionadas em relação
     ao seu próprio início e fim — então mostra as cores das épocas que atravessou. */
  var RAMP = [1956, 1969, 1981, 1990, 2007, 2015];

  function ramp(start, end) {
    var span = end - start;
    var stops = RAMP.map(function (year, i) {
      return 'var(--era-' + (i + 1) + ') ' +
             (((year - start) / span) * 100).toFixed(2) + '%';
    });
    return 'linear-gradient(90deg, ' + stops.join(', ') + ')';
  }

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pct = function (year) { return ((year - FROM) / (TO - FROM)) * 100; };

  /* marcos, agrupados por faixa, com a cor da sua época */
  var marks = {};
  Array.prototype.forEach.call(document.querySelectorAll('.era'), function (era, i) {
    Array.prototype.forEach.call(era.querySelectorAll('.entry'), function (entry) {
      var lane = entry.dataset.lane;
      if (!lane) return;
      (marks[lane] = marks[lane] || []).push({
        year: +entry.dataset.year,
        label: entry.dataset.short,
        target: entry.id,
        color: 'var(--era-' + (i + 1) + ')'
      });
    });
  });

  /* linhas verticais de década */
  var grid = document.createElement('div');
  grid.className = 'chart-grid';
  TICKS.slice(1, -1).forEach(function (year) {
    var line = document.createElement('span');
    line.style.left = pct(year) + '%';
    grid.appendChild(line);
  });
  chart.appendChild(grid);

  /* faixas */
  var delay = 0;
  LANES.forEach(function (lane) {
    var row = document.createElement('div');
    row.className = 'lane';

    var name = document.createElement('div');
    name.className = 'lane-name';
    name.textContent = lane.name;
    row.appendChild(name);

    var track = document.createElement('div');
    track.className = 'lane-track';

    var bar = document.createElement('div');
    bar.className = 'lane-bar';
    bar.style.left = pct(lane.start) + '%';
    bar.style.width = (pct(lane.end) - pct(lane.start)) + '%';
    bar.style.backgroundImage = ramp(lane.start, lane.end);
    bar.style.animationDelay = delay + 'ms';
    track.appendChild(bar);

    (marks[lane.id] || []).forEach(function (m) {
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
    chart.appendChild(row);
    delay += 70;
  });

  /* eixo */
  var axis = document.createElement('div');
  axis.className = 'chart-axis';
  TICKS.forEach(function (year) {
    var t = document.createElement('span');
    t.style.left = pct(year) + '%';
    t.textContent = year;
    axis.appendChild(t);
  });
  chart.appendChild(axis);

  if (!still) chart.dataset.animate = '1';

  /* legenda flutuante */
  var tip = document.createElement('div');
  tip.className = 'tip';
  chart.appendChild(tip);

  function showTip(dot) {
    tip.innerHTML = '';
    var y = document.createElement('b');
    y.textContent = dot.dataset.year;
    tip.appendChild(y);
    tip.appendChild(document.createTextNode(dot.dataset.label));
    var a = dot.getBoundingClientRect(), b = chart.getBoundingClientRect();
    tip.style.left = (a.left - b.left + a.width / 2) + 'px';
    tip.style.top = (a.top - b.top) + 'px';
    tip.dataset.show = '1';
  }

  function hideTip() { tip.dataset.show = '0'; }

  var current = null;

  chart.addEventListener('click', function (e) {
    var dot = e.target.closest('.mark');
    if (!dot) return;
    var entry = document.getElementById(dot.dataset.target);
    if (!entry) return;
    entry.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
    if (current) current.classList.remove('is-target');
    entry.classList.remove('is-target');
    void entry.offsetWidth;
    entry.classList.add('is-target');
    current = entry;
  });

  ['mouseover', 'focusin'].forEach(function (type) {
    chart.addEventListener(type, function (e) {
      var dot = e.target.closest && e.target.closest('.mark');
      if (dot) showTip(dot);
    });
  });

  ['mouseout', 'focusout'].forEach(function (type) {
    chart.addEventListener(type, function (e) {
      if (e.target.closest && e.target.closest('.mark')) hideTip();
    });
  });

  window.addEventListener('resize', hideTip);
})();
