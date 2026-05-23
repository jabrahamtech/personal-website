/* Engineer-mode status strip builder. Loaded by StatusStrip.astro; injects the
   strip only when engineer mode is active (initial load or a later toggle), so
   its terminal-styled labels ("STATUS open_to_select_work", "BUILD …") never
   appear in the crawlable HTML document. The build marker arrives via the
   mount's data-build attribute so it stays sourced from the .astro file. */
(function () {
  var host = document.getElementById('status-strip');
  if (!host) return;
  var buildSlug = host.dataset.build || '';

  function startClock() {
    var el = document.getElementById('ss-time');
    if (!el) return;
    function tick() {
      // AEST/AEDT — Australia/Melbourne; falls back to local if Intl is unavailable.
      try {
        el.textContent = new Intl.DateTimeFormat('en-AU', {
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Australia/Melbourne'
        }).format(new Date());
      } catch (e) {
        var d = new Date();
        el.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      }
    }
    // Tick now, then align to the next real minute boundary; 60s interval after.
    tick();
    var msToNextMinute = 60000 - (Date.now() % 60000);
    setTimeout(function () { tick(); setInterval(tick, 60000); }, msToNextMinute);
  }

  function build() {
    if (host.dataset.built) return;
    host.innerHTML =
      '<div class="wrap row">' +
        '<span class="cell live"><span class="dot"></span><b>MEL</b> <span id="ss-time">--:--</span><span class="suf">AEST</span></span>' +
        '<span class="cell"><b>STATUS</b> open_to_select_work</span>' +
        '<span class="cell ss-mob-hide"><b>REGIONS</b> AU + US</span>' +
        '<span class="cell ss-mob-hide"><b>BUILD</b> ' + buildSlug + '</span>' +
      '</div>';
    host.dataset.built = '1';
    startClock();
  }

  // Build on initial eng load, and whenever the user toggles into eng later.
  function maybeBuild() {
    if (document.body.classList.contains('mode-eng')) build();
  }
  maybeBuild();
  new MutationObserver(maybeBuild).observe(document.body, {
    attributes: true, attributeFilter: ['class']
  });
})();
