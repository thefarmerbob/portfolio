/* place.js — move, size and turn any drawing on any page.

   Press p. Every image on the page can then be dragged, scaled and rotated by
   hand; press p again to put the page back to normal.

   The adjustment is written to the CSS `translate`, `scale` and `rotate`
   properties rather than to `transform`. Those compose with `transform` instead
   of replacing it, so a sprite the page is already animating — the climber, the
   ladybug, the rat — keeps its animation and carries the adjustment on top of
   it. Nothing here is in px either: an offset is a share of the drawing's own
   size, so an adjustment holds at any window size or zoom, the way the rest of
   the site does.

   What you move is kept per page in this browser. Press c to copy it out in the
   form placements.js wants, and paste it in there to make it part of the site
   for everyone. */
(function () {
  'use strict';

  var PAGE  = location.pathname.split('/').pop() || 'index.html';
  var STORE = 'place:' + PAGE;
  var SEL   = 'img, svg, [data-place]';

  var STEP = {
    move: 0.5, moveBig: 5,      // per cent of the drawing's own width/height
    size: 0.02, sizeBig: 0.1,   // of its own size
    turn: 1, turnBig: 10        // degrees
  };

  // ── What has been adjusted ──────────────────────────────────────────────
  // Anything in placements.js is the site's own; anything in localStorage is
  // work in progress on this browser and wins while it is there.
  function baked() { return (window.PLACEMENTS && window.PLACEMENTS[PAGE]) || {}; }
  var edits = {};
  try { edits = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) {}

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(edits)); } catch (e) {}
  }
  function settled(key) { return edits[key] || baked()[key] || null; }
  function editable(key) {
    if (!edits[key]) {
      var b = baked()[key] || {};
      edits[key] = { tx: b.tx || 0, ty: b.ty || 0, s: b.s == null ? 1 : b.s, r: b.r || 0 };
    }
    return edits[key];
  }
  function plain(o) {
    return !o || (!o.tx && !o.ty && !o.r && (o.s == null || o.s === 1));
  }

  // ── Naming things ───────────────────────────────────────────────────────
  // A name has to survive a reload, so: whatever the page calls it, else its id,
  // else the file it draws with and which one of those it is.
  function fileOf(el) {
    if (el.tagName === 'IMG') {
      return (el.getAttribute('src') || 'image').split('?')[0].split('/').pop();
    }
    return el.tagName.toLowerCase();
  }
  function keyOf(el) {
    if (el.dataset && el.dataset.place) return el.dataset.place;
    if (el.id) return '#' + el.id;

    /* Counted inside the nearest thing that has an id rather than across the
       whole page, so a drawing keeps its name even as others come and go —
       and so a page that draws its own images, with the src filled in later,
       still names them somewhere recognisable. */
    var scope = el.parentElement && el.parentElement.closest('[id]');
    var file = fileOf(el);
    var all = (scope || document).querySelectorAll(SEL), n = 0;
    for (var i = 0; i < all.length; i++) {
      if (all[i] === el) break;
      if (fileOf(all[i]) === file) n++;
    }
    return (scope ? '#' + scope.id + ' ' : '') + file + '[' + n + ']';
  }

  // ── Putting them where they belong ──────────────────────────────────────
  function apply(el) {
    var o = settled(keyOf(el));
    if (!o) return;
    el.style.translate = (o.tx || 0) + '% ' + (o.ty || 0) + '%';
    el.style.rotate = (o.r || 0) + 'deg';
    el.style.scale = String(o.s == null ? 1 : o.s);
  }
  function clearStyle(el) { el.style.translate = ''; el.style.rotate = ''; el.style.scale = ''; }
  function applyAll() {
    var all = document.querySelectorAll(SEL);
    for (var i = 0; i < all.length; i++) apply(all[i]);
  }

  applyAll();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  }
  window.addEventListener('load', applyAll);

  // Pages draw plenty of themselves from script — the rat, the hole, the room's
  // furniture — so anything that turns up later gets its adjustment then.
  var queued = false;
  new MutationObserver(function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; applyAll(); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ── Placement mode ──────────────────────────────────────────────────────
  var on = false, sel = null, drag = null, panel = null, out = null, note = null;

  function build() {
    if (panel) return;

    var css = document.createElement('style');
    css.textContent =
      'html.place-on img, html.place-on svg, html.place-on [data-place]' +
        '{ outline: 1px dashed rgba(0,0,0,0.3); outline-offset: 1px; cursor: grab; }' +
      'html.place-on .place-sel { outline: 2px solid #c8536a !important; }' +
      '#place-panel { position: fixed; top: 0; right: 0; z-index: 2147483647;' +
        ' width: min(380px, 46vw); max-height: 100vh; overflow: auto;' +
        ' padding: 14px 16px 18px; display: none; flex-direction: column; gap: 9px;' +
        ' background: rgba(253,250,241,0.96); box-shadow: -6px 0 24px rgba(0,0,0,0.25);' +
        ' font: 11px/1.5 ui-monospace, Menlo, monospace; color: #24331c; }' +
      'html.place-on #place-panel { display: flex; }' +
      '#place-panel h2 { margin: 0; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; }' +
      '#place-panel .dim { color: rgba(36,51,28,0.6); }' +
      '#place-panel b { font-weight: 400; color: #24331c; }' +
      '#place-panel pre { margin: 0; padding: 9px; background: #efe9dc; overflow: auto;' +
        ' font: inherit; white-space: pre; user-select: text; max-height: 46vh; }' +
      '#place-panel .note { color: #7a5a2a; min-height: 1.5em; }';
    document.head.appendChild(css);

    panel = document.createElement('div');
    panel.id = 'place-panel';
    panel.innerHTML =
      '<h2>Placement · ' + PAGE + '</h2>' +
      '<div class="dim"><b>click</b> a drawing (again for the one behind) · <b>drag</b> to move<br>' +
      '<b>↑↓←→</b> nudge · ' +
      '<b>-</b> / <b>=</b> or <b>wheel</b> size · <b>,</b> / <b>.</b> turn · <b>shift</b> for bigger steps<br>' +
      '<b>0</b> reset this one · <b>r</b> reset the page · <b>c</b> copy · <b>p</b> done</div>' +
      '<div id="place-sel-line" class="dim">nothing picked</div>' +
      '<pre id="place-dump"></pre>' +
      '<div class="note" id="place-note"></div>';
    document.body.appendChild(panel);
    out = panel.querySelector('#place-dump');
    note = panel.querySelector('#place-note');
  }

  function report() {
    if (!panel) return;

    var line = panel.querySelector('#place-sel-line');
    if (sel) {
      var o = settled(keyOf(sel)) || { tx: 0, ty: 0, s: 1, r: 0 };
      line.innerHTML = '<b>' + keyOf(sel) + '</b> — moved ' + r1(o.tx) + '%, ' + r1(o.ty) +
        '% · size ' + r2(o.s == null ? 1 : o.s) + '× · turned ' + r1(o.r) + '°';
    } else {
      line.textContent = 'nothing picked';
    }

    var keys = Object.keys(edits).filter(function (k) { return !plain(edits[k]); }).sort();
    if (!keys.length) {
      out.textContent = '// nothing moved on this page yet';
      return;
    }
    var lines = keys.map(function (k) {
      var o = edits[k];
      return "  '" + k + "': { tx: " + r1(o.tx) + ", ty: " + r1(o.ty) +
             ", s: " + r2(o.s == null ? 1 : o.s) + ", r: " + r1(o.r) + " }";
    });
    out.textContent = "PLACEMENTS['" + PAGE + "'] = {\n" + lines.join(',\n') + "\n};";
  }

  function r1(v) { return Math.round((v || 0) * 10) / 10; }
  function r2(v) { return Math.round((v == null ? 1 : v) * 100) / 100; }

  function pick(el) {
    if (sel) sel.classList.remove('place-sel');
    sel = el;
    if (sel) sel.classList.add('place-sel');
    report();
  }

  function setOn(v) {
    on = v;
    build();
    document.documentElement.classList.toggle('place-on', on);
    if (on) {
      document.addEventListener('wheel', onWheel, { capture: true, passive: false });
      report();
      if (note) note.textContent = '';
    } else {
      document.removeEventListener('wheel', onWheel, { capture: true });
      pick(null);
    }
  }

  /* Drawings overlap, and an image catches a click anywhere in its box whether
     or not there is any ink there — the near side of the rat hole covers the far
     side entirely. So every drawing under the pointer is a candidate, and
     clicking the same spot again takes the next one down. */
  function target(e) {
    var stack = [];
    document.elementsFromPoint(e.clientX, e.clientY).forEach(function (el) {
      // The point may land on a path inside an inlined drawing, so climb to the
      // drawing itself rather than ignoring it.
      var hit = el.closest && el.closest(SEL);
      if (hit && !hit.closest('#place-panel') && stack.indexOf(hit) < 0) stack.push(hit);
    });
    if (!stack.length) return null;
    return stack[(stack.indexOf(sel) + 1) % stack.length];
  }

  // While placing, the page underneath should do nothing at all: no quote
  // opening, no link followed, no character walking.
  function swallow(e) { e.preventDefault(); e.stopPropagation(); }

  document.addEventListener('pointerdown', function (e) {
    if (!on) return;
    if (e.target.closest && e.target.closest('#place-panel')) return;
    var el = target(e);
    swallow(e);
    if (!el) return;
    pick(el);
    var o = editable(keyOf(el));
    drag = { el: el, o: o, x: e.clientX, y: e.clientY,
             w: el.offsetWidth || el.getBoundingClientRect().width || 1,
             h: el.offsetHeight || el.getBoundingClientRect().height || 1 };
  }, true);

  document.addEventListener('pointermove', function (e) {
    if (!on || !drag) return;
    swallow(e);
    drag.o.tx = r1(drag.o.tx + (e.clientX - drag.x) / drag.w * 100);
    drag.o.ty = r1(drag.o.ty + (e.clientY - drag.y) / drag.h * 100);
    drag.x = e.clientX;
    drag.y = e.clientY;
    apply(drag.el);
    report();
  }, true);

  document.addEventListener('pointerup', function (e) {
    if (!on) return;
    swallow(e);
    if (drag) { drag = null; save(); report(); }
  }, true);

  document.addEventListener('click', function (e) {
    if (!on) return;
    if (e.target.closest && e.target.closest('#place-panel')) return;
    swallow(e);
  }, true);

  function onWheel(e) {
    if (!on || !sel) return;
    swallow(e);
    var o = editable(keyOf(sel));
    var by = e.shiftKey ? STEP.sizeBig : STEP.size;
    o.s = Math.max(0.05, r2((o.s == null ? 1 : o.s) + (e.deltaY < 0 ? by : -by)));
    apply(sel);
    save();
    report();
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

    if (e.key === 'p' || e.key === 'P') { setOn(!on); swallow(e); return; }
    if (!on) return;

    if (e.key === 'Escape') { setOn(false); swallow(e); return; }

    if (e.key === 'c' || e.key === 'C') {
      var text = out.textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(
          function () { note.textContent = 'copied — paste it into placements.js'; },
          function () { note.textContent = 'no clipboard here — select the text above'; });
      } else { note.textContent = 'no clipboard here — select the text above'; }
      swallow(e);
      return;
    }

    if (e.key === 'r' || e.key === 'R') {
      edits = {};
      try { localStorage.removeItem(STORE); } catch (err) {}
      var all = document.querySelectorAll(SEL);
      for (var i = 0; i < all.length; i++) clearStyle(all[i]);
      applyAll();                       // back to whatever placements.js says
      note.textContent = 'page reset to the placements the site ships with';
      report();
      swallow(e);
      return;
    }

    if (!sel) return;
    var key = keyOf(sel), o = editable(key), touched = true;
    var move = e.shiftKey ? STEP.moveBig : STEP.move;
    var size = e.shiftKey ? STEP.sizeBig : STEP.size;
    var turn = e.shiftKey ? STEP.turnBig : STEP.turn;

    switch (e.key) {
      case 'ArrowLeft':  o.tx = r1(o.tx - move); break;
      case 'ArrowRight': o.tx = r1(o.tx + move); break;
      case 'ArrowUp':    o.ty = r1(o.ty - move); break;
      case 'ArrowDown':  o.ty = r1(o.ty + move); break;
      case '-': case '_': o.s = Math.max(0.05, r2((o.s == null ? 1 : o.s) - size)); break;
      case '=': case '+': o.s = r2((o.s == null ? 1 : o.s) + size); break;
      case ',': case '<': o.r = r1(o.r - turn); break;
      case '.': case '>': o.r = r1(o.r + turn); break;
      case '0': delete edits[key]; clearStyle(sel); break;
      default: touched = false;
    }
    if (!touched) return;

    apply(sel);
    save();
    report();
    swallow(e);
  }, true);
})();
