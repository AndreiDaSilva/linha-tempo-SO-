/* Leitura conforme o scroll.
   Cada marco acende quando é alcançado e o trilho vertical se preenche atrás dele.
   No topo da tela, um cursor percorre 1956-2026 na mesma escala do diagrama. */

window.ativarRolagem = function () {
  var entries = Array.prototype.slice.call(document.querySelectorAll('.entry'));
  var timeline = document.querySelector('.timeline');
  if (!entries.length || !timeline) return;

  /* guarda a época de cada marco, para o cursor trocar de cor junto */
  Array.prototype.forEach.call(document.querySelectorAll('.era'), function (era, i) {
    Array.prototype.forEach.call(era.querySelectorAll('.entry'), function (entry) {
      entry.dataset.era = i + 1;
    });
  });

  /* acende ao entrar na tela; uma vez lido, continua lido */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (x) {
        if (!x.isIntersecting) return;
        x.target.classList.add('is-read');
        io.unobserve(x.target);
      });
    }, { rootMargin: '0px 0px -22% 0px' });
    entries.forEach(function (entry) { io.observe(entry); });
  } else {
    entries.forEach(function (entry) { entry.classList.add('is-read'); });
  }

  var scrubber = document.querySelector('.scrubber');
  var fill = scrubber && scrubber.querySelector('.scrubber-fill');
  var label = scrubber && scrubber.querySelector('.scrubber-year');
  if (!fill || !label) return;

  var FROM = 1956, TO = 2026;
  var queued = false;

  function update() {
    queued = false;

    var line = window.innerHeight * 0.42;
    var active = null, next = null;

    for (var i = 0; i < entries.length; i++) {
      if (entries[i].getBoundingClientRect().top <= line) {
        active = entries[i];
      } else {
        next = entries[i];
        break;
      }
    }

    var visible = !!active && timeline.getBoundingClientRect().bottom > 0;
    scrubber.dataset.on = visible ? '1' : '0';
    if (!visible) return;

    /* entre dois marcos, interpola o ano pela distância percorrida */
    var year = +active.dataset.year;
    if (next) {
      var a = active.getBoundingClientRect().top;
      var b = next.getBoundingClientRect().top;
      var t = b === a ? 0 : (line - a) / (b - a);
      year += (+next.dataset.year - year) * Math.max(0, Math.min(1, t));
    }

    var pos = Math.max(0, Math.min(100, ((year - FROM) / (TO - FROM)) * 100));
    fill.style.width = pos + '%';
    label.style.left = Math.max(2.6, Math.min(97.4, pos)) + '%';
    label.textContent = active.dataset.year;
    scrubber.style.setProperty('--era', 'var(--era-' + active.dataset.era + ')');
  }

  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });

  window.addEventListener('resize', update);
  update();
};
