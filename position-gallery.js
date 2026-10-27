/* DYPERE 3.0.4 | gallery repair 20261020. No answer storage is read or changed. */
(() => {
  'use strict';
  const data = document.getElementById('positionItems');
  if (!data) return;
  const items = JSON.parse(data.textContent);
  const stage = document.querySelector('.position-stage');
  const art = document.querySelector('.position-stage .art');
  const canvas = document.getElementById('positionCanvas');
  const empty = document.getElementById('artEmpty');
  const stateText = document.getElementById('imageMessage');
  const retry = document.getElementById('retryImage');
  const name = document.getElementById('name');
  const counter = document.getElementById('counter');
  const button = document.getElementById('draw');
  let picture = document.getElementById('picture');
  let pool = [], last = -1, failed = -1, busy = false, round = 1;

  // Uniform index selection, including at the boundary between two rounds.
  function randomIndex(length) {
    if (length < 2) return 0;
    if (globalThis.crypto && typeof crypto.getRandomValues === 'function') {
      const value = new Uint32Array(1);
      const ceiling = Math.floor(4294967296 / length) * length;
      do { crypto.getRandomValues(value); } while (value[0] >= ceiling);
      return value[0] % length;
    }
    return Math.floor(Math.random() * length);
  }

  // Decode off-screen. The old image and its name stay together until the new
  // image has actually loaded, avoiding empty cards and mismatched captions.
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image(800, 800);
      image.decoding = 'async';
      let done = false;
      function finish(error) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        image.onload = image.onerror = null;
        if (error) reject(error); else resolve(image);
      }
      const timer = setTimeout(() => finish(new Error('image-timeout')), 12000);
      image.onerror = () => finish(new Error('image-load-failed'));
      image.onload = async () => {
        try {
          if (!image.naturalWidth || !image.naturalHeight) throw new Error('empty-image');
          if (typeof image.decode === 'function') await image.decode();
          finish();
        } catch (error) { finish(error); }
      };
      image.src = url;
    });
  }

  function fitCanvas() {
    const style = getComputedStyle(art);
    const width = art.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = art.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const side = Math.max(1, Math.floor(Math.min(width, height)));
    canvas.style.setProperty('--art-size', side + 'px');
  }

  async function draw(retryFailed = false) {
    if (busy || !items.length) return;
    const newRound = !pool.length;
    const source = newRound ? items.map((_, index) => index) : pool;
    let options = source.filter(index => index !== last && index !== failed);
    if (!options.length) options = source.filter(index => index !== last);
    if (!options.length) options = source.slice();
    const choice = retryFailed && failed >= 0 && source.includes(failed)
      ? failed : options[randomIndex(options.length)];
    busy = true;
    button.disabled = retry.disabled = true;
    retry.hidden = true;
    art.setAttribute('aria-busy', 'true');
    stage.dataset.state = 'loading';
    button.textContent = 'Laster …';
    stateText.textContent = 'Laster bilde …';
    empty.hidden = false;
    empty.classList.toggle('over-picture', last >= 0);
    try {
      const loaded = await loadImage(items[choice].img);
      if (newRound) {
        if (last >= 0) round++;
        pool = source.slice();
      }
      pool.splice(pool.indexOf(choice), 1);
      last = choice;
      failed = -1;
      loaded.id = 'picture';
      loaded.alt = items[choice].name;
      loaded.hidden = false;
      loaded.dataset.item = String(choice + 1);
      picture.replaceWith(loaded);
      picture = loaded;
      canvas.classList.add('has-picture');
      empty.hidden = true;
      name.textContent = items[choice].name;
      counter.textContent = (items.length - pool.length) + ' av ' + items.length + ' · ' + pool.length + ' igjen';
      stage.dataset.state = 'ready';
      stage.dataset.round = String(round);
      stage.dataset.shown = String(items.length - pool.length);
      button.textContent = pool.length ? 'Trekk ny' : 'Trekk ny runde';
      canvas.classList.remove('image-enter');
      void canvas.offsetWidth;
      canvas.classList.add('image-enter');
    } catch (error) {
      failed = choice;
      stage.dataset.state = 'error';
      // Never count a failed image as seen or attach its name to the old image.
      stateText.textContent = 'Bildet kunne ikke lastes.';
      retry.hidden = false;
      button.textContent = 'Trekk en annen';
      console.warn('DYPERE: bilde ikke tilgjengelig:', items[choice].img, error.message);
    } finally {
      busy = false;
      button.disabled = retry.disabled = false;
      art.setAttribute('aria-busy', 'false');
      fitCanvas();
    }
  }

  button.addEventListener('click', () => draw());
  retry.addEventListener('click', () => draw(true));
  counter.textContent = '0 av ' + items.length + ' · ' + items.length + ' igjen';
  stage.dataset.state = 'empty';
  stage.dataset.shown = '0';
  stage.dataset.round = '1';
  // Merely opening the page does not draw a position.
  if ('ResizeObserver' in globalThis) new ResizeObserver(fitCanvas).observe(art);
  window.addEventListener('resize', fitCanvas);
  window.visualViewport?.addEventListener('resize', fitCanvas);
  document.fonts?.ready.then(fitCanvas);
  requestAnimationFrame(fitCanvas);
})();
