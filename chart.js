/* Diagrama de linhagens.
   As faixas vêm do dados.json; os marcadores são lidos da linha do tempo
   já montada na página, então os dois nunca saem de sincronia. */

window.montarDiagrama = function (faixas) {
  var chart = document.getElementById('chart');
  if (!chart || !faixas || !faixas.length) return;

  chart.innerHTML = '';

  var FROM = +chart.dataset.from;
  var TO = +chart.dataset.to;
  var still = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var pct = function (year) { return ((year - FROM) / (TO - FROM)) * 100; };

  /* marcos por faixa, com a cor da época a que pertencem */
  var marks = {};
  var inicios = [];

  Array.prototype.forEach.call(document.querySelectorAll('.era'), function (era, i) {
    var entradas = era.querySelectorAll('.entry');
    if (entradas.length) inicios.push(+entradas[0].dataset.year);

    Array.prototype.forEach.call(entradas, function (entry) {
      var faixa = entry.dataset.lane;
      if (!faixa) return;
      (marks[faixa] = marks[faixa] || []).push({
        year: +entry.dataset.year,
        label: entry.dataset.short,
        target: entry.id,
        color: 'var(--era-' + Math.min(i + 1, 6) + ')'
      });
    });
  });

  /* Rampa de matiz: uma âncora no primeiro ano de cada época. Uma faixa recebe
     todas elas posicionadas em relação ao seu início e fim, então o gradiente
     mostra as cores das épocas que ela atravessou. */
  function ramp(start, end) {
    var span = end - start || 1;
    return 'linear-gradient(90deg, ' + inicios.map(function (year, i) {
      return 'var(--era-' + Math.min(i + 1, 6) + ') ' +
             (((year - start) / span) * 100).toFixed(2) + '%';
    }).join(', ') + ')';
  }

  /* marcações de década, descartando as que colariam nas pontas do eixo */
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
  chart.appendChild(grid);

  var delay = 0;
  faixas.forEach(function (faixa) {
    var row = document.createElement('div');
    row.className = 'lane';

    var name = document.createElement('div');
    name.className = 'lane-name';
    name.textContent = faixa.nome;
    row.appendChild(name);

    var track = document.createElement('div');
    track.className = 'lane-track';

    var bar = document.createElement('div');
    bar.className = 'lane-bar';
    bar.style.left = pct(faixa.inicio) + '%';
    bar.style.width = (pct(faixa.fim) - pct(faixa.inicio)) + '%';
    bar.style.backgroundImage = ramp(faixa.inicio, faixa.fim);
    bar.style.animationDelay = delay + 'ms';
    track.appendChild(bar);

    (marks[faixa.id] || []).forEach(function (m) {
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

  var axis = document.createElement('div');
  axis.className = 'chart-axis';
  ticks.forEach(function (year) {
    var t = document.createElement('span');
    t.style.left = pct(year) + '%';
    t.textContent = year;
    axis.appendChild(t);
  });
  chart.appendChild(axis);

  if (!still) chart.dataset.animate = '1';

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

  var atual = null;

  chart.addEventListener('click', function (e) {
    var dot = e.target.closest('.mark');
    if (!dot) return;
    var entry = document.getElementById(dot.dataset.target);
    if (!entry) return;
    entry.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
    if (atual) atual.classList.remove('is-target');
    entry.classList.remove('is-target');
    void entry.offsetWidth;
    entry.classList.add('is-target');
    atual = entry;
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
};
