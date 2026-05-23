/* Engineer-mode boot animation. Loaded by BootSequence.astro only when the page
   is actually in engineer mode, so these terminal-styled strings never appear
   in the crawlable HTML document (AI scrapers were reading the inline version
   out of the shared markup and describing the site as a terminal/OS). */
(function () {
  var boot = document.getElementById('boot');
  if (!boot) return;

  var inner = document.createElement('div');
  inner.className = 'boot-inner';
  inner.id = 'boot-inner';
  boot.appendChild(inner);

  var skipBtn = document.createElement('button');
  skipBtn.className = 'skip';
  skipBtn.id = 'boot-skip';
  skipBtn.textContent = '[esc] skip ▸';
  boot.appendChild(skipBtn);

  var lines = [
    { t: 'OPERATOR BIOS v2.6.04 — © j.abraham systems', d: 60 },
    { t: '', d: 80 },
    { t: 'POST..................................... <span style="color:#7dff8a">[OK]</span>', d: 120 },
    { t: 'MEMORY 16384K  ........................... <span style="color:#7dff8a">[OK]</span>', d: 90 },
    { t: 'MOUNTING /operator/profile ............... <span style="color:#7dff8a">[OK]</span>', d: 120 },
    { t: 'LOADING posts/ ........................... <span style="color:#6ee7ff">[ONLINE]</span>', d: 140 },
    { t: 'LOADING terminal/ ........................ <span style="color:#6ee7ff">[ONLINE]</span>', d: 140 },
    { t: '', d: 80 },
    { t: '<span style="color:#f5b860">▸ session_id 0x42 · operator=jonathan · regions=au+us</span>', d: 200 },
    { t: '<span style="color:#7dff8a">▸ status: open_to_select_work</span>', d: 240 },
    { t: '', d: 60 },
    { t: '<span style="color:#b9b8ae">launching command_centre...</span>', d: 280 }
  ];

  var i = 0, killed = false;
  function step() {
    if (killed) return;
    if (i >= lines.length) { end(); return; }
    var ln = document.createElement('span');
    ln.className = 'boot-line show boot-flash';
    ln.innerHTML = lines[i].t || '&nbsp;';
    inner.appendChild(ln);
    i++;
    setTimeout(step, lines[i - 1].d);
  }
  function end() {
    sessionStorage.setItem('boot_seen', '1');
    boot.classList.add('gone');
    setTimeout(function () { boot.remove(); }, 400);
  }
  function skip() { killed = true; end(); }
  skipBtn.addEventListener('click', skip);
  function keyHandler(e) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      skip();
      document.removeEventListener('keydown', keyHandler);
    }
  }
  document.addEventListener('keydown', keyHandler);
  step();
})();
