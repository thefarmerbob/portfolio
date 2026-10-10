/* Shared ladybug behaviour, used by every page that has a .ladybug element.
 *
 *  hover  — it opens its wings and flaps in place. The pointer is hit-tested by
 *           hand rather than with :hover so the ladybug can stay
 *           pointer-events:none and never steal hover or clicks from the scene.
 *  click  — it takes off, spirals toward the viewer flapping its wings, then a
 *           quote card fades in. Click anywhere or press Escape to send it back.
 */
(function () {
  'use strict';

  var QUOTE_DIR = 'svgs/movie-quotes/';
  var QUOTES = [
    '1.jpg',
    '2.jpg',
    '3.jpg',
    '4.jpg',
    '5.png',
    '6.jpg',
    '7.jpg',
    '8.png',
    '9.jpg',
    '10.jpg',
    '11.jpg',
    '12.png',
    '13.jpg',
    '14.jpg',
    '15.jpg',
    '16.jpg',
    '17.jpg',
    '18.jpg',
    '19.jpg',
    '20.jpg',
    '21.jpg',
    '22.png',
    '23.jpg',
    '24.jpg',
    '25.jpg',
    '26.jpg',
    '27.jpg',
    '28.jpg',
    '29.jpg',
    '30.jpg',
    '31.jpg',
    '32.jpg',
    '33.jpg',
    '34.jpg',
    '35.jpg',
    '36.jpg',
    '37.jpg',
    '38.jpg',
    '39.png',
    '40.jpg',
    '41.jpg',
    '42.jpg',
    '43.png',
    '44.jpg',
    '45.jpg',
    '46.jpg',
    '47.jpg',
    '48.png',
    '49.jpg'
  ];
  var GALLERY = 'quotes.html';
  var F1 = 'svgs/ladybug/ladybug-flap-1.svg';
  var F2 = 'svgs/ladybug/ladybug-flap-2.svg';

  /* Works through the whole folder in order rather than repeating one image.
     The position is kept in sessionStorage so it carries across pages within
     a visit, and falls back to a random start if storage is unavailable. */
  var STORE_KEY = 'ladybug-quote-index';
  var fallbackIndex = Math.floor(Math.random() * QUOTES.length);

  function quoteIndex() {
    var n;
    try { n = parseInt(sessionStorage.getItem(STORE_KEY), 10); } catch (e) { n = NaN; }
    if (isNaN(n)) n = fallbackIndex;
    return ((n % QUOTES.length) + QUOTES.length) % QUOTES.length;
  }
  function nextQuote() {
    var n = quoteIndex() + 1;
    fallbackIndex = n;
    try { sessionStorage.setItem(STORE_KEY, String(n)); } catch (e) {}
  }
  // Version token — bumped when the folder is renumbered, so a reused
  // filename cannot serve the previously cached picture.
  var V = '?v=4';
  function currentQuoteSrc() { return QUOTE_DIR + QUOTES[quoteIndex()] + V; }

  /* The two flap drawings sit at very different scales inside their own
     viewBoxes (frame 2's bug fills only ~37% of its canvas), so frame 2 is
     scaled up and offset to keep the bug the same size and centred. These
     numbers come from measuring the ink bounds of each file. */
  var F2_SCALE = 2.681, F2_DX = -0.6635, F2_DY = -0.7017;
  var F1_ASPECT = 44 / 40;

  /* An extra turn on the flapping frames while they stand in for the perched
     drawing, for bugs that sit at a different angle from the way the frames are
     drawn. The frames are already turned 180 deg to face the way the flight
     starts out; this goes on top of that, in the CSS sense, so negative is
     anticlockwise. ladybug-2 sits head-down-and-left rather than along the body
     like the others, so its wings come out a quarter turn off.

     This is a perched pose, not a flying one — once airborne the bug points
     along its own flight line like every other, so the turn eases off over the
     first moments of the flight rather than being carried through it. */
  var FLAP_ROT = { 'ladybug-2.svg': -90 };

  /* A standing turn on the airborne drawing. The flap frames are shared by
     every page, and their body sits a little off the axis the flight heading
     is measured along, so the bug looks like it is flying crabwise. This
     leans it back into line. Negative is anticlockwise, as in CSS. */
  var FLIGHT_ROT = -30;

  function spriteName(el) {
    var img = el.tagName === 'IMG' ? el : el.querySelector('img');
    var src = img && img.getAttribute('src');
    return src ? src.split('/').pop().split('?')[0] : '';
  }
  function rotOf(el) { return FLAP_ROT[spriteName(el)] || 0; }

  // Preload the flap frames and just the next quote — not the whole folder.
  [F1, F2, currentQuoteSrc()].forEach(function (src) { var i = new Image(); i.src = src; });

  var busy = false;      // a flight or card is in progress
  var hovering = false;

  function all() { return document.querySelectorAll('.ladybug'); }

  function over(el, x, y) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  /* Pages that scale <html> with CSS zoom (pants, chihiro, swe projects) report
     rects in visual pixels while transforms apply in the zoomed space. Work in
     layout pixels so the two agree. */
  function zoomOf() {
    var de = document.documentElement;
    return (de.getBoundingClientRect().width / (de.offsetWidth || 1)) || 1;
  }

  // Where a ladybug is, and how big, in layout pixels.
  function geom(el) {
    var r = el.getBoundingClientRect(), z = zoomOf();
    var w = r.width / z;
    return {
      w: w, h: w * F1_ASPECT, z: z,
      cx: (r.left + r.width / 2) / z,
      cy: (r.top + r.height / 2) / z
    };
  }

  /* The perched sprite is swapped for the flapping frames, so it has to vanish
     on the same frame they appear — any transition leaves a faded copy of it
     showing underneath. Set inline so no page rule can outrank it. */
  function hideNow(el) {
    el.style.transition = 'none';
    el.style.opacity = '0';
    void el.offsetWidth;              // commit before transitions resume
    el.style.transition = '';
  }
  function showNow(el) {
    el.style.transition = 'none';
    el.style.opacity = '';
    void el.offsetWidth;
    el.style.transition = '';
  }
  function fadeBackIn(el) {
    el.style.transition = 'opacity 0.45s ease';
    el.style.opacity = '';
    setTimeout(function () { el.style.transition = ''; }, 520);
  }

  /* A pair of stacked flap frames, sized so the bug lands at width `w`.
     Frame 2's drawing is much smaller inside its own viewBox, so it is scaled
     up and offset to keep the body the same size and in the same place. */
  function flapFrames(w) {
    var box = document.createElement('div');
    box.style.width = w + 'px';
    box.style.height = (w * F1_ASPECT) + 'px';

    var a = document.createElement('img');
    a.className = 'f1'; a.src = F1; a.alt = '';
    a.style.width = w + 'px';

    var b = document.createElement('img');
    b.className = 'f2'; b.src = F2; b.alt = '';
    b.style.width = (w * F2_SCALE) + 'px';
    b.style.left = (w * F2_DX) + 'px';
    b.style.top = (w * F2_DY) + 'px';

    box.appendChild(a);
    box.appendChild(b);
    return box;
  }

  // ── Hover: wings open and flap in place ──────────────────────────────
  var flapEl = null, flapOn = null, flapTimer = null, flapRaf = null;

  function startFlap(el) {
    var g = geom(el);
    flapOn = el;
    flapEl = flapFrames(g.w);
    flapEl.id = 'ladybug-hover-flap';
    document.body.appendChild(flapEl);
    hideNow(el);

    var rot = rotOf(el);
    var alt = false;
    flapTimer = setInterval(function () {
      alt = !alt;
      flapEl.classList.toggle('alt', alt);
    }, 60);

    // Stay glued to the ladybug even if the wall scrolls underneath it.
    // Placed synchronously first so it is never painted at the origin.
    (function track() {
      if (!flapEl) return;
      var t = geom(flapOn);
      // Turned 180° so the perched flap faces the same way as the flight does,
      // plus whatever extra turn this drawing asks for.
      flapEl.style.transform =
        'translate(' + (t.cx - t.w / 2) + 'px,' + (t.cy - t.h / 2) + 'px)' +
        ' rotate(' + (180 + rot) + 'deg)';
      flapRaf = requestAnimationFrame(track);
    })();
  }

  function stopFlap() {
    if (!flapEl) return;
    clearInterval(flapTimer);
    cancelAnimationFrame(flapRaf);
    flapEl.remove();
    flapEl = null;
    // Only un-hide if it isn't now airborne — the flight owns it from here.
    if (flapOn && !flapOn.classList.contains('flying')) showNow(flapOn);
    flapOn = null;
  }

  document.addEventListener('mousemove', function (e) {
    if (busy) return;
    var hit = null, list = all();
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.classList.contains('flying')) continue;
      if (over(el, e.clientX, e.clientY)) { hit = el; break; }
    }
    if (hit !== flapOn) {
      stopFlap();
      if (hit) startFlap(hit);
    }
    if (!!hit !== hovering) {
      hovering = !!hit;
      document.body.style.cursor = hit ? 'pointer' : '';
    }
  }, { passive: true });

  // Pointer left the window entirely — fold the wings back up.
  document.addEventListener('mouseleave', function () {
    if (busy) return;
    stopFlap();
    hovering = false;
    document.body.style.cursor = '';
  });

  // Capture phase: the ladybug is pointer-events:none, so the click would
  // otherwise land on whatever is underneath it.
  document.addEventListener('click', function (e) {
    if (busy) return;
    var list = all();
    for (var i = 0; i < list.length; i++) {
      if (!list[i].classList.contains('flying') && over(list[i], e.clientX, e.clientY)) {
        e.preventDefault();
        e.stopPropagation();
        fly(list[i]);
        return;
      }
    }
  }, true);

  function fly(el) {
    var g = geom(el);          // measured before the hover flap is torn down
    busy = true;
    hovering = false;
    document.body.style.cursor = '';

    // Mark it airborne first so tearing down the hover flap doesn't un-hide it.
    el.classList.add('flying');
    stopFlap();
    hideNow(el);

    var w = g.w, h = g.h, z = g.z;
    var vw = window.innerWidth / z;
    var vh = window.innerHeight / z;

    var box = flapFrames(w);
    box.id = 'ladybug-flier';
    document.body.appendChild(box);

    var sx = g.cx;
    var sy = g.cy;
    var MARGIN = 24;    // keep the flight this far inside the viewport

    /* The angle the drawing was being held at on the perch, and how much of the
       flight it takes to unwind — long enough not to snap on the first frame,
       short enough that the bug is flying properly well before it leaves. */
    var rot = rotOf(el);
    var TURN_OUT = 0.2;

    /* One unbroken arc off the perch and away past the left edge. It used to
       throw a full loop first, but a loop turns the sprite through all 360° —
       the bug ends up tumbling rather than flying, which is not what a ladybug
       does. Now it lifts off, climbs away and rides a slow swell out, and the
       heading only ever swings through a few degrees. */
    var EXIT_X = -(w * 3);                 // comfortably off the left edge

    var roomUp = sy - MARGIN, roomDown = vh - MARGIN - sy;

    /* It climbs away if there is room overhead, and drops away if there isn't —
       on the pages where it perches at the very top of the window, up is not an
       option. */
    var LIFT = Math.min(vh * 0.16, 130);
    var cruiseY = roomUp > roomDown ? sy - LIFT : sy + LIFT;
    cruiseY = Math.min(Math.max(cruiseY, MARGIN + 24), vh - MARGIN - 24);

    function smooth(u) { return u * u * (3 - 2 * u); }

    /* A ladybug does not carve waves through the air — it goes roughly where it
       is going, unsteadily. So the line is near enough straight: off the perch,
       a climb away, and out past the left edge. All the life is in a small
       unsteady bob — two slow beats at rates that don't divide into one another,
       so it never repeats and never reads as a wave. Half a body of sway in all,
       not tens of pixels. */
    var BOB = w * 0.5;

    /* The smooth flight line. Heading is read off this and this only — the
       wingbeat wobble below is deliberately kept out of it, because its
       derivative is far larger than the path's and would spin the sprite
       back and forth instead of pointing it where it is actually going. */
    function basePos(t) {
      /* Barely moving as it lets go, then gathering pace — the small constant
         term keeps a little sideways drift from the very first frame, so the
         heading has a direction to read instead of guessing at a standstill. */
      var travel = 0.08 * t + 0.92 * t * t;
      var s = smooth(t);
      return {
        x: sx - (sx - EXIT_X) * travel,
        y: sy + (cruiseY - sy) * s +
           (Math.sin(t * Math.PI * 2 * 1.3) * 0.6 +
            Math.sin(t * Math.PI * 2 * 2.1 + 1.1) * 0.4) * BOB * s
      };
    }

    /* Drawn position: the flight line plus a small wingbeat wobble. */
    function pos(t) {
      var p = basePos(t);
      return { x: p.x, y: p.y + Math.sin(t * Math.PI * 2 * 7) * 3 * (1 - t) };
    }

    var DUR = 2600, t0 = null, lastFlap = 0, alt = false;

    function place(t) {
      var p = pos(t);

      /* Point the body along its own flight line, so it banks through every
         turn instead of sliding sideways — that is what sells it as flight.
         The sprite's head is the end opposite the big dark mass, which is
         already its +X side, so the raw heading needs no offset.
         Taken straight off the smooth line, with no easing: any smoothing
         here shows up as the body pointing where it *was* going rather than
         where it is going, which reads as the spin being out of step. */
      var d = 0.008;
      var a = basePos(Math.max(0, t - d));
      var b = basePos(Math.min(1, t + d));
      var dx = b.x - a.x, dy = b.y - a.y;
      // 180 = heading left, which is where the flight ends up regardless.
      // The perched turn unwinds on top of that, so it leaves the perch at the
      // angle it was hovering at and swings into line as it goes.
      var turn = rot ? rot * (1 - smooth(Math.min(t / TURN_OUT, 1))) : 0;
      var heading = turn + FLIGHT_ROT +
        ((dx * dx + dy * dy) < 1e-6 ? 180 : Math.atan2(dy, dx) * 180 / Math.PI);

      /* A shudder either side of the moment it drops the paper — it should
         look like hard work. */
      var strain = 0;
      if (t > POOP_T - 0.14 && t < POOP_T + 0.1) {
        var s = (t - (POOP_T - 0.14)) / 0.24;
        strain = Math.sin(s * Math.PI * 7) * 13 * Math.sin(s * Math.PI);
      }

      box.style.transform =
        'translate(' + (p.x - w / 2) + 'px,' + (p.y - h / 2) + 'px)' +
        ' rotate(' + (heading + strain) + 'deg)';
      return heading;
    }

    place(0);   // sit exactly on the perched ladybug before the first frame

    var POOP_T = 0.58;          // how far into the flight it lets go
    var paper = null, paperT0 = 0;
    var PAPER_DUR = 1600;

    var heading = 180;   // last known, kept for after the bug has left

    function step(now) {
      if (t0 === null) t0 = now;
      var t = Math.min((now - t0) / DUR, 1);

      // The bug can finish and be removed while the paper is still settling.
      if (box) {
        heading = place(t);
        if (now - lastFlap > 55) {
          lastFlap = now;
          alt = !alt;
          box.classList.toggle('alt', alt);
        }
      }

      // Out it comes, from directly behind the bug.
      if (!paper && t >= POOP_T) {
        paper = dropPaper(el, z);
        paperT0 = now;
      }

      var paperDone = true;
      if (paper) {
        var pt = Math.min((now - paperT0) / PAPER_DUR, 1);
        // Feed it where the bug's rear is right now, so it stays attached
        // until it drops free.
        var bp = pos(Math.min(t, 1));
        var rad = heading * Math.PI / 180;
        paper.advance(
          pt,
          bp.x - Math.cos(rad) * w * 0.5,
          bp.y - Math.sin(rad) * w * 0.5,
          heading
        );
        paperDone = pt >= 1;
      }

      if (t >= 1 && box) { box.remove(); box = null; }

      if (t < 1 || !paperDone) requestAnimationFrame(step);
      else if (paper) paper.ready();
      else busy = false;
    }
    requestAnimationFrame(step);
  }

  /* The paper is squeezed out of the ladybug's rear at (bx, by), then flops
     and wobbles its way to the middle of the screen at full size. It is the
     same element throughout — it starts tiny and squashed rather than being
     swapped for a bigger one. */
  function dropPaper(el, z) {
    var ov = document.createElement('div');
    ov.id = 'ladybug-quote';

    var fig = document.createElement('figure');
    var img = document.createElement('img');
    img.src = currentQuoteSrc();
    img.alt = 'Movie quote';
    nextQuote();
    var cap = document.createElement('figcaption');
    var link = document.createElement('a');
    link.href = GALLERY;
    link.className = 'quote-all';
    link.textContent = 'see them all';
    // The overlay closes on any click, so this one must not bubble up to it.
    link.addEventListener('click', function (ev) { ev.stopPropagation(); });
    cap.appendChild(link);

    fig.appendChild(img);
    fig.appendChild(cap);
    ov.appendChild(fig);
    document.body.appendChild(ov);

    // Where the flex container parks it when it is done — everything is
    // animated as an offset from that resting spot.
    var fr = fig.getBoundingClientRect();
    var fx = (fr.left + fr.width / 2) / z;
    var fy = (fr.top + fr.height / 2) / z;

    var EXTRUDE = 0.32;   // fraction of the drop spent squeezing it out
    var bx = 0, by = 0, angle = 0;   // release point, tracked until it lets go

    function advance(p, rx, ry, rang) {
      var tx, ty, base, wob, rot;

      if (p < EXTRUDE) {
        /* Still coming out: it stays stuck to the ladybug's rear as it flies,
           pinched thin and only swelling — so you can see the thing being
           passed rather than it appearing in mid-air. */
        bx = rx; by = ry; angle = rang;
        var q = p / EXTRUDE;
        var eq = q * q * (3 - 2 * q);
        tx = bx - fx;
        ty = by - fy;
        base = 0.03 + 0.27 * eq;
        wob = 0.5 * (1 - eq);                        // pinched, easing off
        rot = angle + Math.sin(q * Math.PI * 3) * 8; // quivers with the effort
      } else {
        /* Free at last: flops out to the middle, overshooting and jiggling. */
        var u = (p - EXTRUDE) / (1 - EXTRUDE);
        var e = u < 1 ? 1 - Math.pow(1 - u, 3) * Math.cos(u * Math.PI * 1.1) : 1;
        tx = (bx - fx) * (1 - e);
        ty = (by - fy) * (1 - e) + Math.sin(u * Math.PI) * 70;   // sags on the way
        base = 0.3 + 0.7 * e;
        wob = Math.sin(u * Math.PI * 3.5) * 0.28 * (1 - u);
        rot = angle + (-1.8 - angle) * e + Math.sin(u * Math.PI * 4.5) * 26 * (1 - u);
      }

      fig.style.transform =
        'translate(' + tx + 'px,' + ty + 'px) rotate(' + rot + 'deg)' +
        ' scale(' + (base * (1 - wob)) + ',' + (base * (1 + wob)) + ')';
      if (p > 0.6) ov.classList.add('lit');
    }

    // Positioned by the caller on creation, before the first painted frame.

    function ready() {
      ov.classList.add('lit', 'ready');
      fig.style.transform = 'rotate(-1.8deg)';
      arm();
    }

    return { advance: advance, ready: ready };

    function arm() {

      function close() {
        document.removeEventListener('keydown', onKey, true);
        ov.classList.remove('lit');
        ov.style.opacity = '0';
        setTimeout(function () {
          ov.remove();
          el.classList.remove('flying');
          fadeBackIn(el);                  // eases back onto its perch
          busy = false;
        }, 450);
      }

      // While the card is up, keep the scene behind it from scrolling or walking.
      function onKey(ev) {
        if (ev.key === 'Escape') { ev.stopPropagation(); close(); return; }
        if (/^Arrow| $|^a$|^d$/.test(ev.key)) { ev.stopPropagation(); ev.preventDefault(); }
      }
      document.addEventListener('keydown', onKey, true);
      ov.addEventListener('wheel', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }, { passive: false });
      ov.addEventListener('click', close);
    }
  }
})();
