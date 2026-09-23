/* =========================================================
   Safarnama — interactions & animations
   GSAP + ScrollTrigger + Lenis (bundled locally in js/vendor)
   Everything degrades gracefully: if a library fails to load,
   content is still fully visible and usable.
   ========================================================= */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var track = window.track || function () {};
  var lenis = null;

  doc.classList.remove('no-js');
  doc.classList.add('js');

  function safeSession(key, val) {
    try {
      if (val === undefined) return sessionStorage.getItem(key);
      sessionStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ---------- Image fallback: never show a broken image ---------- */
  function imgFailed(img) {
    img.style.visibility = 'hidden';
    if (img.parentElement) img.parentElement.classList.add('img-fallback');
  }
  $$('img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) imgFailed(img);
    else img.addEventListener('error', function () { imgFailed(img); }, { once: true });
  });

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Toast ---------- */
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.innerHTML = '<i></i><span></span>';
      document.body.appendChild(toastEl);
    }
    toastEl.querySelector('span').textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3600);
  }
  window.safarToast = toast;

  /* ---------- Word splitter (masked words) ---------- */
  function splitWords(el) {
    if (!el || el.dataset.split === 'done') return [];
    var words = [];
    var walk = function (node, parent) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var mask = document.createElement('span');
            mask.className = 'split-line';
            mask.style.display = 'inline-block';
            mask.style.verticalAlign = 'top';
            var w = document.createElement('span');
            w.className = 'split-word';
            w.textContent = p;
            mask.appendChild(w);
            frag.appendChild(mask);
            words.push(w);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child, child);
        }
      });
    };
    walk(el, el);
    el.dataset.split = 'done';
    return words;
  }

  /* ---------- Header behaviour ---------- */
  var header = $('.header');
  var lastY = 0;
  function onScrollHeader(y) {
    if (!header) return;
    header.classList.toggle('is-scrolled', y > 40);
    if (y > 400 && y > lastY + 4 && !doc.classList.contains('menu-open')) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 400) header.classList.remove('is-hidden');
    lastY = y;
  }

  /* ---------- Mobile menu ---------- */
  var toggle = $('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = doc.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
    $$('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        doc.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        if (lenis) lenis.start();
      });
    });
  }

  /* ---------- Back to top ---------- */
  var toTop = $('.to-top');
  var ring = toTop ? $('.ring circle', toTop) : null;
  function onScrollTop(y) {
    if (!toTop) return;
    toTop.classList.toggle('is-visible', y > 700);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (ring && max > 0) ring.style.strokeDashoffset = String(157 - (157 * Math.min(1, y / max)));
  }
  if (toTop) toTop.addEventListener('click', function () {
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function onScroll(y) { onScrollHeader(y); onScrollTop(y); }
  window.addEventListener('scroll', function () { if (!lenis) onScroll(window.scrollY); }, { passive: true });

  /* ---------- Journey accordion ---------- */
  var steps = $$('.step');
  var journeyImgs = $$('.journey__visual img');
  var journeyCaption = $('.journey__caption');
  var journeyIndex = 0;
  function openStep(i) {
    if (!steps.length) return;
    journeyIndex = (i + steps.length) % steps.length;
    steps.forEach(function (s, n) {
      var open = n === journeyIndex;
      s.classList.toggle('is-open', open);
      var btn = $('.step__head', s);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    journeyImgs.forEach(function (img, n) { img.classList.toggle('is-active', n === journeyIndex); });
    if (journeyCaption) {
      var s = steps[journeyIndex];
      $('small', journeyCaption).textContent = 'Step 0' + (journeyIndex + 1);
      $('p', journeyCaption).textContent = s.dataset.caption || '';
    }
  }
  steps.forEach(function (s, i) {
    var btn = $('.step__head', s);
    if (btn) btn.addEventListener('click', function () { openStep(i); });
  });
  $$('[data-journey]').forEach(function (b) {
    b.addEventListener('click', function () { openStep(journeyIndex + (b.dataset.journey === 'next' ? 1 : -1)); });
  });
  if (steps.length) openStep(0);

  /* ---------- Testimonials orbit ---------- */
  var reviews = $$('.orbit__avatar');
  var quote = $('.quote-card');
  var reviewIndex = 0, reviewTimer = null;
  function showReview(i, userAction) {
    if (!reviews.length || !quote) return;
    reviewIndex = (i + reviews.length) % reviews.length;
    var r = reviews[reviewIndex];
    reviews.forEach(function (a) { a.classList.toggle('is-active', a === r); });
    var bq = $('blockquote', quote), nm = $('[data-q-name]', quote), rl = $('[data-q-role]', quote), im = $('[data-q-img]', quote);
    var apply = function () {
      bq.textContent = r.dataset.quote;
      nm.textContent = r.dataset.name;
      rl.textContent = r.dataset.role;
      im.src = $('img', r).src;
      im.alt = r.dataset.name;
    };
    if (hasGSAP && !reduced) {
      gsap.timeline()
        .to([bq, $('.quote-card__who', quote)], { opacity: 0, y: 16, duration: 0.3, ease: 'power2.in', onComplete: apply })
        .to([bq, $('.quote-card__who', quote)], { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 });
    } else apply();
    if (userAction) restartReviews();
  }
  function restartReviews() {
    clearInterval(reviewTimer);
    reviewTimer = setInterval(function () { showReview(reviewIndex + 1); }, 5200);
  }
  reviews.forEach(function (a, i) { a.addEventListener('click', function () { showReview(i, true); }); });
  if (reviews.length) { showReview(0); restartReviews(); }

  function placeOrbit() {
    var orbit = $('.orbit');
    if (!orbit) return;
    var size = orbit.offsetWidth;
    reviews.forEach(function (a) {
      var ringR = parseFloat(a.dataset.ring || '0.5') * size;
      var ang = parseFloat(a.dataset.angle || '0') * Math.PI / 180;
      a.style.left = (size / 2 + Math.cos(ang) * ringR) + 'px';
      a.style.top = (size / 2 + Math.sin(ang) * ringR) + 'px';
    });
  }
  placeOrbit();
  window.addEventListener('resize', placeOrbit);

  /* ---------- Analytics: CTAs, cards, brochure, WhatsApp ---------- */
  $$('[data-cta]').forEach(function (el) {
    el.addEventListener('click', function () { track('cta_click', { cta_name: el.dataset.cta, cta_text: el.textContent.trim().slice(0, 60) }); });
  });
  $$('.dest-card[data-dest]').forEach(function (el) {
    el.addEventListener('click', function () { track('select_destination', { destination: el.dataset.dest, category: el.dataset.cat || '' }); });
  });
  $$('[data-brochure]').forEach(function (el) {
    el.addEventListener('click', function () {
      track('brochure_download', { file_name: 'safarnama-itinerary-guide.pdf', package_name: el.dataset.brochure });
      toast('Your itinerary guide is downloading ✦');
    });
  });
  $$('[data-whatsapp]').forEach(function (el) {
    el.addEventListener('click', function () { track('whatsapp_click', { location: el.dataset.whatsapp }); });
  });

  /* ---------- Hero search ---------- */
  var tabs = $$('.search-card .tab');
  var typeInput = $('#search-type');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
      t.classList.add('is-active');
      t.setAttribute('aria-pressed', 'true');
      if (typeInput) typeInput.value = t.dataset.type;
    });
  });
  var searchForm = $('#hero-search');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = ($('#search-where', searchForm).value || '').trim();
      var type = typeInput ? typeInput.value : 'all';
      var guests = $('#search-guests', searchForm).value;
      var url = 'destinations.html?q=' + encodeURIComponent(q) + '&type=' + encodeURIComponent(type) + '&guests=' + encodeURIComponent(guests);
      track('search', { search_term: q || '(any)', trip_type: type, guests: guests }, function () { go(url); });
    });
  }

  /* ---------- Newsletter ---------- */
  $$('.nl-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('input[type="email"]', form);
      var note = form.parentElement.querySelector('.nl-note');
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        if (note) { note.textContent = 'Please enter a valid email address.'; note.classList.remove('is-success'); }
        input.focus();
        return;
      }
      track('sign_up', { method: 'newsletter', form_location: form.dataset.location || 'footer' });
      if (note) { note.textContent = 'You’re in! Watch your inbox for travel deals ✦'; note.classList.add('is-success'); }
      toast('Subscribed! Welcome to the Safarnama family.');
      input.value = '';
    });
  });

  /* ---------- Plan My Trip (lead) form ---------- */
  var tripForm = $('#trip-form');
  if (tripForm) {
    var params = new URLSearchParams(location.search);
    var destSel = $('#trip-destination', tripForm);
    if (destSel && params.get('dest')) {
      var want = params.get('dest').toLowerCase();
      Array.prototype.forEach.call(destSel.options, function (o) { if (o.value.toLowerCase() === want) destSel.value = o.value; });
    }
    var pkgSel = $('#trip-package', tripForm);
    if (pkgSel && params.get('package')) pkgSel.value = params.get('package');

    tripForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('.form-error', tripForm);
      var name = $('#trip-name', tripForm).value.trim();
      var phone = $('#trip-phone', tripForm).value.replace(/\D/g, '');
      var email = $('#trip-email', tripForm).value.trim();
      if (name.length < 2) { err.textContent = 'Please tell us your name.'; return; }
      if (phone.length < 10) { err.textContent = 'Please enter a valid 10-digit phone number.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = 'Please enter a valid email address.'; return; }
      err.textContent = '';
      var btn = $('button[type="submit"]', tripForm);
      if (btn) { btn.disabled = true; btn.firstChild.textContent = 'Sending… '; }
      var dest = destSel ? destSel.value : '';
      var pkg = pkgSel ? pkgSel.value : '';
      var travellers = ($('#trip-travellers', tripForm) || {}).value || '';
      track('generate_lead', { form_name: 'plan_my_trip', destination: dest, package_name: pkg, travellers: travellers, currency: 'INR', value: 1 }, function () {
        go('thank-you.html?dest=' + encodeURIComponent(dest));
      });
    });
  }

  /* ---------- Destinations filter ---------- */
  var grid = $('.card-grid');
  if (grid) {
    var cards = $$('.dest-card', grid);
    var chips = $$('.chip');
    var searchInput = $('#dest-search');
    var note = $('.results-note');
    var empty = $('.empty-state');
    var p = new URLSearchParams(location.search);
    var state = { type: (p.get('type') || 'all').toLowerCase(), q: (p.get('q') || '').trim() };
    if (searchInput) searchInput.value = state.q;
    var apply = function (animate) {
      var q = state.q.toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var hay = (c.dataset.dest + ' ' + (c.dataset.region || '') + ' ' + c.dataset.cat).toLowerCase();
        var ok = (state.type === 'all' || c.dataset.cat.toLowerCase().indexOf(state.type) > -1) && (!q || hay.indexOf(q) > -1);
        c.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
      });
      chips.forEach(function (c) { c.classList.toggle('is-active', c.dataset.filter === state.type); });
      if (note) note.textContent = (state.q ? 'Showing ' + shown + ' result' + (shown === 1 ? '' : 's') + ' for “' + state.q + '”' : shown + ' destinations to explore');
      if (empty) empty.classList.toggle('is-visible', shown === 0);
      if (animate && hasGSAP && !reduced) {
        gsap.fromTo(cards.filter(function (c) { return !c.classList.contains('is-hidden'); }), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'power3.out', overwrite: true });
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        state.type = c.dataset.filter;
        apply(true);
        track('filter_used', { filter_type: 'category', filter_value: state.type });
      });
    });
    var t;
    if (searchInput) searchInput.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        state.q = searchInput.value.trim();
        apply(true);
        if (state.q.length > 2) track('search', { search_term: state.q, trip_type: state.type, source: 'destinations_page' });
      }, 350);
    });
    apply(false);
  }

  /* ---------- Thank-you page ---------- */
  var thanks = $('.thanks');
  if (thanks) {
    var d = new URLSearchParams(location.search).get('dest');
    var slot = $('[data-thanks-dest]');
    if (d && slot && d !== 'Not decided') slot.textContent = ' \u2014 your ' + d + ' trip request is in';
    var conf = $('.confetti');
    if (conf && !reduced) {
      var colors = ['#c9f158', '#0d1310', '#a8d630', '#f5b301', '#ffffff'];
      for (var i = 0; i < 70; i++) {
        var c = document.createElement('i');
        c.style.left = Math.random() * 100 + '%';
        c.style.background = colors[i % colors.length];
        c.style.animationDuration = (2.5 + Math.random() * 3) + 's';
        c.style.animationDelay = (Math.random() * 1.2) + 's';
        c.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
        conf.appendChild(c);
      }
    }
  }

  /* ---------- Page transitions ---------- */
  var curtain = $('.curtain');
  function go(url) {
    if (curtain && hasGSAP && !reduced) {
      gsap.set(curtain, { yPercent: 100 });
      gsap.to(curtain, { yPercent: 0, duration: 0.6, ease: 'power4.inOut', onComplete: function () { location.href = url; } });
      setTimeout(function () { location.href = url; }, 1200);
    } else location.href = url;
  }
  $$('a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download') || /^(mailto|tel|https?|javascript):/i.test(href)) return;
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      go(href);
    });
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && curtain && hasGSAP) gsap.set(curtain, { yPercent: 100 });
  });

  /* =========================================================
     Everything below needs GSAP — skip cleanly without it
     ========================================================= */
  if (!hasGSAP || reduced) {
    $$('[data-reveal], [data-img-reveal]').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; el.style.clipPath = 'none'; });
    var pre = $('.preloader');
    if (pre) pre.classList.add('is-done');
    $$('[data-count]').forEach(function (el) { el.textContent = el.dataset.count; });
    $$('.big-text .w').forEach(function (w) { w.style.opacity = 1; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  /* ---------- Smooth scroll ---------- */
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    lenis.on('scroll', function (e) { ScrollTrigger.update(); onScroll(e.scroll); });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -80, duration: 1.4 }); }
      });
    });
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer) {
    var cursor = $('.cursor'), dot = $('.cursor-dot');
    if (cursor && dot) {
      doc.classList.add('has-cursor');
      var label = $('span', cursor);
      gsap.set([cursor, dot], { xPercent: -50, yPercent: -50 });
      var cx = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3' });
      var cy = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3' });
      var dx = gsap.quickTo(dot, 'x', { duration: 0.1 });
      var dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
      window.addEventListener('mousemove', function (e) { cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY); });
      $$('[data-cursor]').forEach(function (el) {
        el.addEventListener('mouseenter', function () { label.textContent = el.dataset.cursor; cursor.classList.add('is-hover'); });
        el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); });
      });
      $$('a:not([data-cursor]), button:not([data-cursor])').forEach(function (el) {
        el.addEventListener('mouseenter', function () { cursor.classList.add('is-link'); });
        el.addEventListener('mouseleave', function () { cursor.classList.remove('is-link'); });
      });
    }

    /* Magnetic buttons */
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });

    /* 3D tilt */
    $$('[data-tilt]').forEach(function (el) {
      var rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
      var ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 12);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
      });
      el.addEventListener('mouseleave', function () { rx(0); ry(0); });
    });
  }

  /* ---------- Intro (preloader → hero) ---------- */
  var heroTitle = $('[data-hero-title]');
  var heroWords = splitWords(heroTitle);
  var heroImg = $('.hero__media img');
  var heroItems = $$('[data-hero-item]');

  function heroIntro() {
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (heroImg) tl.fromTo(heroImg, { scale: 1.35 }, { scale: 1, duration: 2.4, ease: 'power3.out' }, 0);
    if (heroWords.length) tl.fromTo(heroWords, { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.07 }, 0.15);
    if (heroItems.length) tl.fromTo(heroItems, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.12 }, 0.5);
    if (header) tl.fromTo(header, { yPercent: -120 }, { yPercent: 0, duration: 1.1, clearProps: 'transform' }, 0.3);
    return tl;
  }

  var preloader = $('.preloader');
  var firstVisit = !safeSession('safar_seen');
  if (preloader && firstVisit) {
    safeSession('safar_seen', '1');
    var letters = $$('.preloader__word span', preloader);
    var count = $('.preloader__count', preloader);
    var bar = $('.preloader__bar', preloader);
    var obj = { v: 0 };
    if (lenis) lenis.stop();
    var ptl = gsap.timeline();
    ptl.fromTo(letters, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: 'power4.out' })
      .fromTo($('.preloader__tag', preloader), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.4)
      .to(obj, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: function () { count.textContent = Math.round(obj.v); } }, 0)
      .to(bar, { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
      .to(letters, { yPercent: -110, duration: 0.6, stagger: 0.03, ease: 'power3.in' }, '+=0.1')
      .to(preloader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'power4.inOut', onComplete: function () { preloader.classList.add('is-done'); if (lenis) lenis.start(); } }, '-=0.2')
      .add(heroIntro(), '-=0.7');
  } else {
    if (preloader) preloader.classList.add('is-done');
    if (curtain) {
      gsap.set(curtain, { yPercent: 0 });
      gsap.to(curtain, { yPercent: -100, duration: 0.8, ease: 'power4.inOut', delay: 0.05 });
    }
    heroIntro();
  }

  /* ---------- Page hero titles (inner pages) ---------- */
  var pageTitle = $('[data-page-title]');
  if (pageTitle) {
    var pw = splitWords(pageTitle);
    gsap.fromTo(pw, { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.07, ease: 'power4.out', delay: 0.35 });
  }

  /* ---------- Hero parallax on scroll ---------- */
  $$('.hero, .page-hero').forEach(function (h) {
    var img = $('.hero__media img', h);
    var content = $('.hero__content, .page-hero .container', h);
    if (img) gsap.to(img, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: true } });
    if (content) gsap.to(content, { y: -80, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* ---------- Generic reveals ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    onEnter: function (els) {
      gsap.to(els, { opacity: 1, x: 0, y: 0, scale: 1, duration: 1.1, stagger: 0.1, ease: 'power3.out', overwrite: true });
    }
  });

  $$('[data-img-reveal]').forEach(function (el) {
    var img = $('img', el);
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } });
    tl.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'power4.inOut' });
    if (img) tl.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0);
  });

  /* Section titles: word rise */
  $$('[data-split]').forEach(function (el) {
    var w = splitWords(el);
    gsap.fromTo(w, { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.05, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* Scroll-scrubbed paragraph highlight */
  $$('.big-text').forEach(function (el) {
    var txt = el.textContent.trim().split(/\s+/);
    el.innerHTML = txt.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    gsap.to($$('.w', el), { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });

  /* ---------- Marquees react to scroll velocity ---------- */
  $$('.marquee__track').forEach(function (trackEl) {
    var dir = trackEl.dataset.dir === 'right' ? 1 : -1;
    var loop = gsap.fromTo(trackEl, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: 28, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      trigger: trackEl, start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var v = Math.min(Math.abs(self.getVelocity()) / 400, 5);
        gsap.to(loop, { timeScale: (1 + v) * (self.direction), duration: 0.3, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.3, overwrite: false });
      }
    });
  });

  /* ---------- Horizontal destinations ---------- */
  mm.add('(min-width: 761px)', function () {
    var section = $('.hscroll');
    var trackEl = section ? $('.hscroll__track', section) : null;
    if (!trackEl) return;
    var bar = $('.hscroll__progress i', section);
    var dist = function () { return Math.max(0, trackEl.scrollWidth - window.innerWidth); };
    var tween = gsap.to(trackEl, {
      x: function () { return -dist(); },
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: function () { return '+=' + dist(); },
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) { if (bar) gsap.set(bar, { scaleX: self.progress }); }
      }
    });
    $$('.dest-card', trackEl).forEach(function (card) {
      var img = $('img', card);
      if (img) gsap.fromTo(img, { xPercent: -8, scale: 1.2 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
  });

  /* ---------- Stat counters ---------- */
  $$('[data-count]').forEach(function (el) {
    var end = parseFloat(el.dataset.count);
    var dec = (el.dataset.count.split('.')[1] || '').length;
    var o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: function () {
        gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: function () {
          el.textContent = dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString('en-IN');
        } });
      }
    });
  });

  /* ---------- Parallax band ---------- */
  $$('.band').forEach(function (b) {
    var img = $('.band__media', b);
    var h = $('h2', b);
    if (img) gsap.fromTo(img, { yPercent: -12 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } });
    if (h) gsap.fromTo(h, { scale: 0.8, opacity: 0.3 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: b, start: 'top 85%', end: 'center center', scrub: true } });
    gsap.fromTo(b, { clipPath: 'inset(8% 6% 8% 6% round 32px)' }, { clipPath: 'inset(0% 0% 0% 0% round 32px)', ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'center center', scrub: true } });
  });

  /* ---------- Orbit rotation ---------- */
  var spin = $('.orbit__spin');
  if (spin) {
    var avatars = $$('.orbit__avatar', spin);
    gsap.to(spin, { rotation: 360, duration: 60, repeat: -1, ease: 'none' });
    gsap.to(avatars, { rotation: -360, duration: 60, repeat: -1, ease: 'none' });
    gsap.from(avatars, { scale: 0, duration: 0.9, stagger: 0.08, ease: 'back.out(2)', scrollTrigger: { trigger: '.orbit', start: 'top 80%' } });
  }

  /* ---------- Footer wordmark ---------- */
  var fw = $('.footer__word');
  if (fw) {
    gsap.fromTo($$('span', fw), { yPercent: 100 }, { yPercent: 0, duration: 1.2, stagger: 0.05, ease: 'power4.out', scrollTrigger: { trigger: fw, start: 'top 95%' } });
  }

  /* ---------- Journey auto-advance while in view ---------- */
  var jv = $('.journey');
  if (jv && steps.length) {
    var jt = null;
    ScrollTrigger.create({
      trigger: jv, start: 'top 70%', end: 'bottom 30%',
      onToggle: function (self) {
        clearInterval(jt);
        if (self.isActive) jt = setInterval(function () { openStep(journeyIndex + 1); }, 4500);
      }
    });
    steps.forEach(function (s) { s.addEventListener('click', function () { clearInterval(jt); }); });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); placeOrbit(); });
})();
