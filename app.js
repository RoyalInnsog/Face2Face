/* =========================================================================
   Face2Face — motion + behaviour layer
   Libraries are self-hosted in /vendor (GSAP, ScrollTrigger, Lenis).
   Philosophy: every section has its OWN motion language. Everything degrades
   gracefully — if GSAP fails to load or the user prefers reduced motion, the
   site stays fully functional and fully visible.
   ========================================================================= */
(function () {
  "use strict";

  window.__f2fLoaded = true;   // signals the head failsafe that app.js is alive

  /* ---- Owner-editable config (single source of truth) ---- */
  var CONFIG = {
    phone: "+917232090008",                 // salon line (verified)
    whatsapp: "917232090008",               // wa.me digits
    address: "Near Jaipur Nursing Home, Swami Vivekananda Nagar, Suratgarh, Rajasthan 335804",
    // Coordinates from the verified Google listing
    lat: "29.3198806",
    lng: "73.9029289",
    // Instagram handle (TODO owner: confirm exact URL — handle is referenced in many places)
    instagram: "https://www.instagram.com/face2face_salon_academy",
    // Facebook (not independently verified via web search — owner to confirm)
    facebook: "https://www.facebook.com/face2facesalonsuratgarh",
    // Google Business profile / reviews (search-by-name link as graceful default)
    googleReviews: "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("Face2Face Salon Academy Suratgarh"),
    business: "Face2Face Salon & Academy",
    // Opening hours (minutes from midnight) — drives appointment-time validation.
    // Open daily 10:00 AM – 8:00 PM; last bookable slot 7:30 PM.
    hours: { openMin: 10 * 60, closeMin: 20 * 60, lastSlotMin: 19 * 60 + 30 }
  };

  var docEl = document.documentElement;
  var q  = function (s, c) { return (c || document).querySelector(s); };
  var qa = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduce  = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // ?reduced forces the no-motion path (handy for testing / low-power devices)
  if (/[?&]reduced/.test(location.search)) reduce = true;
  var isTouch = window.matchMedia && matchMedia("(hover: none), (pointer: coarse)").matches;
  var gsap = window.gsap;
  var ST   = window.ScrollTrigger;
  var hasGSAP = !!gsap;
  if (hasGSAP && ST) gsap.registerPlugin(ST);

  // Motion = GSAP available AND user is OK with motion.
  var motion = hasGSAP && !reduce;
  var lenis = null;

  /* deferred scripts run after DOM parse, so the DOM is ready here */
  init();

  function init() {
    wireContactLinks();
    wireNav();
    wireMap();
    wireBookingForm();
    wireActiveNav();
    wireScrollUI();
    buildReviews();
    buildGallery();

    if (!motion) {
      // No-motion fallback: clear intro, reveal everything, settle.
      docEl.classList.add("intro-done");
      revealAllStatic();
      return;
    }

    docEl.classList.add("gsap-ready");
    if (ST) ST.config({ ignoreMobileResize: true });
    if (!isTouch) initLenis();

    genericReveal();
    heroIntro();
    if (!isTouch) { heroParallax(); navIndicator(); magnetic(); }
    essentialsTilt();
    aboutScene();
    servicesScene();
    galleryScene();
    bookingScene();
    footerScene();

    // settle layout once everything (incl. fonts) is in
    window.addEventListener("load", function () { if (ST) ST.refresh(); });
    setTimeout(function () { if (ST) ST.refresh(); }, 400);
  }

  /* ===================================================================== */
  /*  Smooth scrolling (Lenis) + anchor handling                           */
  /* ===================================================================== */
  function initLenis() {
    if (typeof window.Lenis !== "function") return;
    lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
    if (ST) lenis.on("scroll", ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);

    // smooth anchor jumps
    qa('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id === "#" || id.length < 2) return;
        var target = document.getElementById(id.slice(1));
        if (!target) return;            // dead anchor → let the browser handle it normally
        e.preventDefault();
        lenis.scrollTo(target, { offset: -70, duration: 1.15 });
      });
    });
  }

  /* ===================================================================== */
  /*  Contact links                                                        */
  /* ===================================================================== */
  function wireContactLinks() {
    var tel = "tel:" + CONFIG.phone;
    var wa = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(
      "Hi Face2Face Salon & Academy, I'd like to enquire about your services."
    );
    [["phoneLink", tel], ["phoneLinkFoot", tel], ["callForm", tel],
     ["mCall", tel],
     ["fabWa", wa], ["mWa", wa], ["sWa", wa],
     ["essPhone", tel],
     ["sInsta", CONFIG.instagram], ["sFb", CONFIG.facebook],
     ["googleReviews", CONFIG.googleReviews]
    ].forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (el) el.setAttribute("href", p[1]);
    });
    // Every Instagram link/tile shares one source of truth.
    qa(".ig-link").forEach(function (el) { el.setAttribute("href", CONFIG.instagram); });
    // Keep the JSON-LD telephone in sync with CONFIG so one edit updates both.
    var ld = document.querySelector('script[type="application/ld+json"]');
    if (ld) { try { var d = JSON.parse(ld.textContent); d.telephone = CONFIG.phone; ld.textContent = JSON.stringify(d); } catch (e) {} }
  }

  /* ===================================================================== */
  /*  Navbar: hamburger drawer                                             */
  /* ===================================================================== */
  function wireNav() {
    var burger = q("#burger"), links = q("#navLinks"), scrim = q("#navScrim");
    if (!burger || !links) return;
    function close() {
      links.classList.remove("open"); scrim.classList.remove("show");
      document.body.classList.remove("nav-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
    }
    function open() {
      links.classList.add("open"); scrim.classList.add("show");
      document.body.classList.add("nav-open");
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Close menu");
    }
    burger.addEventListener("click", function () { links.classList.contains("open") ? close() : open(); });
    scrim.addEventListener("click", close);
    links.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ===================================================================== */
  /*  Map: reveal on load + graceful fallback                              */
  /* ===================================================================== */
  function wireMap() {
    var frame = q("#mapFrame"), open = q("#mapOpen");
    if (open) open.setAttribute("href",
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(CONFIG.address));
    if (frame) frame.addEventListener("load", function () { frame.classList.add("loaded"); });
  }

  /* ===================================================================== */
  /*  Active nav highlight (drives the gliding indicator too)              */
  /* ===================================================================== */
  var onActiveChange = null;
  function wireActiveNav() {
    var navLinks = qa("[data-nav]");
    var sections = qa("section[id], header[id]");
    if (!navLinks.length || !("IntersectionObserver" in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (l) {
          var on = l.getAttribute("data-nav") === e.target.id;
          l.classList.toggle("active", on);
          if (on && onActiveChange) onActiveChange(l);
        });
      });
    }, { threshold: 0.4 });
    sections.forEach(function (s) { obs.observe(s); });
  }

  /* ===================================================================== */
  /*  Scroll-driven chrome: progress bar, nav shrink, back-to-top          */
  /* ===================================================================== */
  function wireScrollUI() {
    var progress = q("#progress"), nav = q("#nav"), toTop = q("#toTop");
    var ticking = false;
    function update() {
      var st = window.scrollY || docEl.scrollTop;
      var h = docEl.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = (h > 0 ? (st / h) * 100 : 0) + "%";
      if (nav) nav.classList.toggle("scrolled", st > 40);
      if (toTop) toTop.classList.toggle("show", st > 600);
      ticking = false;
    }
    function onScroll() { if (!ticking) { requestAnimationFrame(update); ticking = true; } }
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    if (toTop) toTop.addEventListener("click", function () {
      if (lenis) lenis.scrollTo(0, { duration: 1.1 });
      else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* ===================================================================== */
  /*  Generic reveal — clip-wipe up, NOT a fade.                            */
  /*  Bespoke sections are claimed below.                                   */
  /* ===================================================================== */
  function claim(sel) { qa(sel).forEach(function (el) { el.classList.add("claimed"); }); }

  function revealAllStatic() { qa(".reveal").forEach(function (el) { el.classList.add("is-visible"); }); }

  function genericReveal() {
    // hand bespoke sections their elements first
    claim("#about .two.a > .reveal");
    claim("#about .story .reveal");
    claim(".two.b .reveal");
    claim(".svc");
    claim(".tile");
    claim(".rev-wrap");
    claim(".book-form");

    var els = qa(".reveal:not(.claimed)");
    if (!els.length || !ST) { els.forEach(function (e) { e.classList.add("is-visible"); }); return; }
    gsap.set(els, { opacity: 1, y: 28, clipPath: "inset(0 0 100% 0)" });
    ST.batch(els, {
      start: "top 90%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)",
          duration: 1.0, ease: "power3.out", stagger: 0.08, overwrite: true,
          onComplete: function () { batch.forEach(function (b) { b.style.clipPath = "none"; }); }
        });
      }
    });
  }

  /* ===================================================================== */
  /*  HERO — cinematic intro + multi-layer parallax                        */
  /* ===================================================================== */
  function heroIntro() {
    var intro = q("#intro");
    var lines = qa(".hero-title .h-line-in");
    var bits = qa(".hero-anim");

    gsap.set(lines, { yPercent: 110 });
    gsap.set(bits, { opacity: 0, y: 32 });

    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";

    var done = false;
    function openCurtain() { docEl.classList.add("intro-done"); document.body.style.overflow = ""; if (lenis) lenis.start(); }
    function finish() {                 // timer-based failsafe — never leave a black screen
      if (done) return; done = true;
      gsap.set(lines, { yPercent: 0 }); gsap.set(bits, { opacity: 1, y: 0 });
      openCurtain();
    }
    setTimeout(finish, 3200);

    var tl = gsap.timeline({ onComplete: function () { done = true; } });
    if (intro) {
      tl.to(".intro-line", { width: 320, duration: 0.7, ease: "power2.inOut" })
        .to(".intro-line", { opacity: 0, duration: 0.3 }, "+=0.05")
        .to(".intro-top", { yPercent: -100, duration: 0.95, ease: "power4.inOut" }, "<")
        .to(".intro-bottom", { yPercent: 100, duration: 0.95, ease: "power4.inOut" }, "<")
        .add(openCurtain, "-=0.15");
    }
    tl.to(lines, { yPercent: 0, duration: 1.2, ease: "power4.out", stagger: 0.14 }, intro ? "-=0.55" : 0)
      .to(bits, { opacity: 1, y: 0, duration: 0.95, ease: "power3.out", stagger: 0.14 }, "-=0.8");

    // Multi-layer scroll-driven depth in the hero
    if (ST) {
      gsap.to(".hero-media img", { yPercent: 14, scale: 1.02, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-orb",  { yPercent: 40, xPercent: -8, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-orb-2",{ yPercent: -30, xPercent: 12, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-glyph",  { yPercent: -20, rotation: 6, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-glyph.b",{ yPercent: 22, rotation: -4, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }
  }

  /* --- Hero mouse-based parallax: every layer moves independently --- */
  function heroParallax() {
    var hero = q(".hero");
    var media = q(".hero-media img");
    var orb1  = q(".hero-orb");
    var orb2  = q(".hero-orb-2");
    var glyph = q(".hero-glyph");
    var glyphB = q(".hero-glyph.b");
    var inner = q(".hero-inner");
    if (!hero || !media || !inner) return;

    // Apply base 3D settings
    gsap.set(hero, { perspective: 1400, transformStyle: "preserve-3d" });
    gsap.set(media.parentNode, { transformStyle: "preserve-3d", z: -150 });
    gsap.set(orb1, { z: -80 });
    gsap.set(orb2, { z: -60 });
    gsap.set(glyph, { z: 40, transformStyle: "preserve-3d" });
    gsap.set(glyphB, { z: 60, transformStyle: "preserve-3d" });
    gsap.set(inner, { z: 120, transformStyle: "preserve-3d" });

    // Set up quickTo functions for smooth interpolation
    var qmX = gsap.quickTo(media, "rotationX", { duration: 1.0, ease: "power3" });
    var qmY = gsap.quickTo(media, "rotationY", { duration: 1.0, ease: "power3" });

    var qiX = gsap.quickTo(inner, "rotationX", { duration: 0.8, ease: "power3" });
    var qiY = gsap.quickTo(inner, "rotationY", { duration: 0.8, ease: "power3" });

    var qgX = gsap.quickTo(glyph, "rotationX", { duration: 1.2, ease: "power3" });
    var qgY = gsap.quickTo(glyph, "rotationY", { duration: 1.2, ease: "power3" });

    var qgBX = gsap.quickTo(glyphB, "rotationX", { duration: 1.4, ease: "power3" });
    var qgBY = gsap.quickTo(glyphB, "rotationY", { duration: 1.4, ease: "power3" });

    var qm1 = gsap.quickTo(media, "x", { duration: 0.9, ease: "power3" });
    var qm2 = gsap.quickTo(media, "y", { duration: 0.9, ease: "power3" });
    var qo1 = gsap.quickTo(orb1, "x", { duration: 1.1, ease: "power3" });
    var qo2 = gsap.quickTo(orb1, "y", { duration: 1.1, ease: "power3" });
    var qo3 = gsap.quickTo(orb2, "x", { duration: 1.4, ease: "power3" });
    var qo4 = gsap.quickTo(orb2, "y", { duration: 1.4, ease: "power3" });
    var qg1 = gsap.quickTo(glyph, "x", { duration: 1.6, ease: "power3" });
    var qg2 = gsap.quickTo(glyph, "y", { duration: 1.6, ease: "power3" });
    var qg3 = gsap.quickTo(glyphB, "x", { duration: 1.8, ease: "power3" });
    var qg4 = gsap.quickTo(glyphB, "y", { duration: 1.8, ease: "power3" });
    var qi1 = gsap.quickTo(inner, "x", { duration: 1.0, ease: "power3" });
    var qi2 = gsap.quickTo(inner, "y", { duration: 1.0, ease: "power3" });

    hero.addEventListener("pointermove", function (e) {
      var cx = (e.clientX / window.innerWidth - 0.5);
      var cy = (e.clientY / window.innerHeight - 0.5);

      // Rotation angles (3D tilt)
      var rx = -cy * 12;
      var ry = cx * 12;

      qmX(rx * 0.5); qmY(ry * 0.5);
      qiX(rx * 1.2); qiY(ry * 1.2);
      qgX(rx * 0.8); qgY(ry * 0.8);
      qgBX(rx * 1.5); qgBY(ry * 1.5);

      // Mouse Parallax translations (layered depth)
      qm1(cx * 30);  qm2(cy * 20);
      qo1(cx * -50); qo2(cy * -35);
      qo3(cx * 35);  qo4(cy * 25);
      qg1(cx * -40); qg2(cy * -30);
      qg3(cx * 50);  qg4(cy * 25);
      qi1(cx * 15);  qi2(cy * 10);
    });

    hero.addEventListener("pointerleave", function () {
      qmX(0); qmY(0);
      qiX(0); qiY(0);
      qgX(0); qgY(0);
      qgBX(0); qgBY(0);

      qm1(0); qm2(0);
      qo1(0); qo2(0);
      qo3(0); qo4(0);
      qg1(0); qg2(0);
      qg3(0); qg4(0);
      qi1(0); qi2(0);
    });
  }

  /* ===================================================================== */
  /*  3D TILT — used on .svc, .feat, .acad, .essential, .ig-tile           */
  /*  Card surface tilts toward the cursor; child layers translate on Z    */
  /*  so the card content parallaxes against the surface (Apple-style).    */
  /* ===================================================================== */
  function attachTilt(el, opts) {
    opts = opts || {};
    var max = opts.max != null ? opts.max : 5;       // degrees
    var scale = opts.scale != null ? opts.scale : 1.015;
    var strong = !!opts.strong;

    function onEnter() {
      if (gsap) {
        gsap.killTweensOf(el);
      }
    }
    function onMove(e) {
      if (gsap) {
        gsap.killTweensOf(el);
      }
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;   // 0..1
      var py = (e.clientY - r.top) / r.height;
      var rx = (py - 0.5) * -2 * max;            // rotateX: looking up = tilt up
      var ry = (px - 0.5) *  2 * max;            // rotateY
      var tx = (px - 0.5) * (strong ? 14 : 10);
      var ty = (py - 0.5) * (strong ? 10 : 8);
      el.style.transform =
        "perspective(1200px) translate3d(" + tx + "px," + ty + "px, 30px) " +
        "rotateX(" + rx + "deg) rotateY(" + ry + "deg) scale(" + scale + ")";
    }
    function onLeave() {
      if (gsap && motion) {
        gsap.to(el, {
          transform: "perspective(1200px) translate3d(0px,0px,0px) rotateX(0deg) rotateY(0deg) scale(1)",
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
          onComplete: function () { el.style.transform = ""; }
        });
      } else {
        el.style.transform = "";
      }
    }
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
  }

  function essentialsTilt() {
    if (isTouch) return;
    qa("[data-tilt]").forEach(function (el) {
      attachTilt(el, { max: 4, depth: 12, scale: 1.012 });
    });
    qa("[data-tilt-strong]").forEach(function (el) {
      attachTilt(el, { max: 6, depth: 22, scale: 1.015, strong: true });
    });
  }

  /* ===================================================================== */
  /*  NAVIGATION — gliding gold indicator + magnetic buttons               */
  /* ===================================================================== */
  function navIndicator() {
    var wrap = q("#navLinks");
    if (!wrap || window.innerWidth <= 768) return;
    var ind = document.createElement("span");
    ind.className = "nav-ind";
    wrap.appendChild(ind);
    docEl.classList.add("nav-ind-on");
    var linkEls = qa("a[data-nav]", wrap);
    var current = q("a.active[data-nav]", wrap) || linkEls[0];

    function place(link, animate) {
      if (!link) return;
      var x = link.offsetLeft, w = link.offsetWidth;
      gsap.to(ind, { x: x, width: w, opacity: 1, duration: animate === false ? 0 : 0.5, ease: "power3.out" });
    }
    onActiveChange = function (link) { current = link; place(link); };
    linkEls.forEach(function (l) { l.addEventListener("mouseenter", function () { place(l); }); });
    wrap.addEventListener("mouseleave", function () { place(current); });
    setTimeout(function () { place(current, false); }, 100);
    window.addEventListener("resize", function () { place(current, false); });
  }

  function magnetic() {
    qa(".nav > .btn-cta, .hero-actions .pill").forEach(function (el) {
      var qx = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
      var qy = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.28);
        qy((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      el.addEventListener("pointerleave", function () { qx(0); qy(0); });
    });
  }

  /* ===================================================================== */
  /*  ABOUT — editorial: media clip-reveals, text settles.                  */
  /*  FEATURE block uses the OPPOSITE clip direction so they never repeat. */
  /* ===================================================================== */
  function aboutScene() {
    var wrapA = q("#about .two.a > .media-wrap");
    var wrapB = q(".two.b .media-wrap");

    buildMediaScene("#about .two.a", q("#about .media.portrait"),
      "inset(0 100% 0 0)", wrapA, qa("#about .story .reveal"), true);
    buildMediaScene(".two.b", q(".two.b .media.tall"),
      "inset(100% 0 0 0)", wrapB, qa(".two.b .story .reveal"), false);

    // Continuous 3D depth parallax scroll animation on the wrappers
    if (ST && motion) {
      if (wrapA) {
        gsap.fromTo(wrapA, 
          { z: -80, rotationY: -10, rotationX: 5 },
          { 
            z: 40, rotationY: 5, rotationX: -5, ease: "none",
            scrollTrigger: { trigger: "#about .two.a", start: "top bottom", end: "bottom top", scrub: true } 
          }
        );
      }
      if (wrapB) {
        gsap.fromTo(wrapB, 
          { z: -80, rotationY: 10, rotationX: 5 },
          { 
            z: 40, rotationY: -5, rotationX: -5, ease: "none",
            scrollTrigger: { trigger: ".two.b", start: "top bottom", end: "bottom top", scrub: true } 
          }
        );
      }
    }
  }

  function buildMediaScene(triggerSel, media, fromClip, mediaWrap, textEls, leftMedia) {
    if (!media || !ST) { if (mediaWrap) mediaWrap.classList.add("is-visible"); textEls.forEach(function (t) { t.classList.add("is-visible"); }); return; }
    // claimed text starts hidden
    gsap.set(textEls, { opacity: 0, y: 32 });
    var badge = q(".badge-wrap", mediaWrap);
    if (badge) gsap.set(badge, { opacity: 0, scale: 0.8, y: 10 });

    // gentle scale-in on the image so the reveal feels layered, not flat
    var img = q("img", media);
    if (img) gsap.set(img, { scale: 1.16 });

    var tl = gsap.timeline({ scrollTrigger: { trigger: triggerSel, start: "top 75%", once: true } });
    if (mediaWrap) tl.set(mediaWrap, { opacity: 1 }, 0);
    tl.fromTo(media, { clipPath: fromClip },
      { clipPath: "inset(0 0% 0 0)", duration: 1.1, ease: "power4.inOut" }, 0);
    if (img) tl.to(img, { scale: 1, duration: 1.4, ease: "power3.out" }, 0);
    if (badge) tl.to(badge, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: "back.out(1.7)" }, 0.6);
    tl.to(textEls, { opacity: 1, y: 0, duration: 0.95, ease: "power3.out", stagger: 0.14 }, 0.6);
  }

  /* ===================================================================== */
  /*  SERVICES — wipe from the left, gold rule draws, number flickers up.  */
  /*  + 3D tilt (set up in essentialsTilt).                                 */
  /* ===================================================================== */
  function servicesScene() {
    var cards = qa(".svc");
    if (!cards.length) return;

    cards.forEach(function (card) {
      // emerging arrow
      var go = document.createElement("span");
      go.className = "svc-go"; go.setAttribute("aria-hidden", "true"); go.textContent = "↗";
      card.appendChild(go);
      // cursor-follow light
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });

    if (!ST) return;
    cards.forEach(function (card) {
      var line = q(".topline", card);
      gsap.set(card, { opacity: 1, clipPath: "inset(0 100% 0 0)" });
      if (line) gsap.set(line, { scaleX: 0 });
      ST.create({
        trigger: card, start: "top 92%", once: true,
        onEnter: function () {
          var tl = gsap.timeline();
          tl.to(card, { clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power3.out",
            onComplete: function () { card.style.clipPath = "none"; } });
          if (line) tl.to(line, { scaleX: 1, duration: 0.6, ease: "power2.out",
            onComplete: function () { gsap.set(line, { scaleX: 0 }); } }, 0.18);
        }
      });
    });
  }

  /* ===================================================================== */
  /*  GALLERY — depth parallax + FLIP lightbox                              */
  /* ===================================================================== */
  function galleryScene() {
    var tiles = qa(".tile");
    if (!tiles.length || !ST) return;

    // Reveal: scale + clip pop, staggered
    tiles.forEach(function (t, i) {
      gsap.set(t, { opacity: 0, scale: 0.94, clipPath: "inset(8% 8% 8% 8%)" });
      ST.create({
        trigger: t, start: "top 92%", once: true,
        onEnter: function () {
          gsap.to(t, { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.9, ease: "power3.out", delay: (i % 3) * 0.1,
            onComplete: function () { t.style.clipPath = "none"; } });
        }
      });
      // gentle parallax drift (each tile a tiny bit different)
      var drift = (i % 2 === 0 ? 1 : -1) * 30;
      var img = q("img", t);
      if (img) {
        gsap.fromTo(img, { y: -drift * 0.6 }, { y: drift * 0.6, ease: "none",
          scrollTrigger: { trigger: t, start: "top bottom", end: "bottom top", scrub: true } });
      }
    });

    // cursor-follow 3D on tiles
    if (!isTouch) {
      tiles.forEach(function (tile) {
        var rect;
        tile.addEventListener("pointerenter", function () { rect = tile.getBoundingClientRect(); });
        tile.addEventListener("pointermove", function (e) {
          var r = tile.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          tile.style.transform =
            "perspective(1200px) rotateX(" + (-py * 4) + "deg) rotateY(" + (px * 4) + "deg) scale(1.015)";
        });
        tile.addEventListener("pointerleave", function () { tile.style.transform = ""; });
      });
    }
  }

  /* ===================================================================== */
  /*  GALLERY VIEWER (lightbox) — FLIP open/close from the exact tile      */
  /* ===================================================================== */
  function buildGallery() {
    var tiles = qa(".tile");
    var lb = q("#lightbox"), frame = q("#lbFrame"), cap = q("#lbCap");
    var closeBtn = q("#lbClose"), prevBtn = q("#lbPrev"), nextBtn = q("#lbNext");
    if (!tiles.length || !lb) return;
    var cur = 0, lastFocus = null;

    function fill(i) {
      cur = (i + tiles.length) % tiles.length;
      var tile = tiles[cur], caption = tile.getAttribute("data-cap") || "";
      var img = tile.querySelector("img");
      frame.innerHTML = "";
      if (img) {
        var c = img.cloneNode(true);
        c.alt = img.alt || caption;
        frame.appendChild(c);
      }
      else { var s = document.createElement("span"); s.className = "mono"; s.textContent = "F2F"; frame.appendChild(s); }
      cap.textContent = caption;
    }
    function openAt(i) {
      lastFocus = document.activeElement;
      fill(i);
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
      if (motion && gsap) {
        var first = tiles[cur].getBoundingClientRect();
        var last = frame.getBoundingClientRect();
        gsap.set(lb, { opacity: 0 });
        gsap.to(lb, { opacity: 1, duration: 0.35, ease: "power1.out" });
        gsap.fromTo(frame, {
          x: first.left - last.left, y: first.top - last.top,
          scaleX: first.width / last.width, scaleY: first.height / last.height,
          transformOrigin: "top left"
        }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.7, ease: "power3.out" });
        gsap.fromTo([cap, closeBtn, prevBtn, nextBtn], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.2 });
      }
      closeBtn.focus();
    }
    function close() {
      if (motion && gsap) {
        var first = tiles[cur].getBoundingClientRect();
        var last = frame.getBoundingClientRect();
        gsap.to([cap, closeBtn, prevBtn, nextBtn], { opacity: 0, duration: 0.2 });
        gsap.to(lb, { opacity: 0, duration: 0.5, delay: 0.05 });
        gsap.to(frame, {
          x: first.left - last.left, y: first.top - last.top,
          scaleX: first.width / last.width, scaleY: first.height / last.height,
          transformOrigin: "top left", duration: 0.55, ease: "power3.in",
          onComplete: finishClose
        });
      } else { finishClose(); }
    }
    function finishClose() {
      lb.classList.remove("open");
      lb.style.opacity = ""; if (frame) gsap && gsap.set(frame, { clearProps: "all" });
      document.body.style.overflow = "";
      if (lenis) lenis.start();
      if (lastFocus) lastFocus.focus();
    }
    function swap(i) {
      if (motion && gsap) {
        gsap.to(frame, { opacity: 0, scale: 0.97, duration: 0.2, onComplete: function () {
          fill(i); gsap.fromTo(frame, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" });
        } });
      } else { fill(i); }
    }

    tiles.forEach(function (t, i) { t.addEventListener("click", function () { openAt(i); }); });
    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { swap(cur - 1); });
    nextBtn.addEventListener("click", function () { swap(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") swap(cur - 1);
      else if (e.key === "ArrowRight") swap(cur + 1);
      else if (e.key === "Tab") {
        // focus trap — cycle only between the viewer's own controls
        var f = [closeBtn, prevBtn, nextBtn];
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        var ni = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i >= f.length - 1 ? 0 : i + 1);
        f[ni].focus();
      }
    });
  }

  /* ===================================================================== */
  /*  TESTIMONIALS — depth-stacked floating cards (not a carousel)         */
  /* ===================================================================== */
  function buildReviews() {
    var reviews = [
      { text: "Honestly the best salon experience I've had — and I've been to places in Jaipur. Calm, clean and the styling was perfect.", name: "Megha Sharma", role: "Regular Guest", initial: "M" },
      { text: "Did my bridal makeup here and I felt absolutely stunning. The team is so patient and talented. Forever grateful.", name: "Priya Meena", role: "Bride", initial: "P" },
      { text: "I joined the makeup academy and learned so much — the trainers are true professionals. I now take my own clients!", name: "Anjali Verma", role: "Academy Student", initial: "A" },
      { text: "The hair spa is pure relaxation. Quality products, spotless space and genuinely warm staff. Highly recommend.", name: "Sneha Gupta", role: "Skin & Spa", initial: "S" }
    ];
    var stage = q("#revStage"), dotsWrap = q("#revDots");
    var prev = q("#revPrev"), next = q("#revNext"), live = q("#revLive");
    if (!stage || !dotsWrap) return;
    var active = 0, timer = null, n = reviews.length;

    var slabs = reviews.map(function (r) {
      var el = document.createElement("article");
      el.className = "rev-slab";
      el.innerHTML =
        '<div class="rs-q" aria-hidden="true">“</div>' +
        '<div class="rs-stars" aria-hidden="true">★★★★★</div>' +
        '<p class="rs-text"></p>' +
        '<div class="rs-auth"><div class="rs-av"></div><div style="text-align:left">' +
        '<div class="rs-nm"></div><div class="rs-rl"></div></div></div>';
      q(".rs-text", el).textContent = r.text;
      q(".rs-av", el).textContent = r.initial;
      q(".rs-nm", el).textContent = r.name;
      q(".rs-rl", el).textContent = r.role;
      stage.appendChild(el);
      return el;
    });

    reviews.forEach(function (_, i) {
      var b = document.createElement("button");
      b.setAttribute("role", "tab"); b.setAttribute("aria-label", "Review " + (i + 1));
      b.addEventListener("click", function () { go(i, true); });
      dotsWrap.appendChild(b);
    });
    var dots = qa("button", dotsWrap);

    var POS = [
      { z: 5, y: 0,  depth: 0,   s: 1,    o: 1,    b: 0 },
      { z: 4, y: -28, depth: -90,  s: 0.93, o: 0.55, b: 1.2 },
      { z: 3, y: -52, depth: -180, s: 0.86, o: 0.22, b: 2.4 }
    ];
    function layout(animate) {
      slabs.forEach(function (el, i) {
        var r = (i - active + n) % n;
        var p = POS[r] || { z: 1, y: -68, depth: -260, s: 0.8, o: 0, b: 3.4 };
        
        if (animate && motion && gsap) {
          gsap.to(el, {
            y: p.y,
            z: p.depth,
            scale: p.s,
            opacity: p.o,
            filter: p.b ? "blur(" + p.b + "px)" : "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
            overwrite: "auto",
            onComplete: function () {
              el.style.zIndex = p.z;
            }
          });
        } else {
          if (gsap) gsap.killTweensOf(el);
          el.style.zIndex = p.z;
          el.style.opacity = p.o;
          el.style.filter = p.b ? "blur(" + p.b + "px)" : "none";
          el.style.transform = "translate3d(0," + p.y + "px," + p.depth + "px) scale(" + p.s + ")";
        }
        el.style.pointerEvents = r === 0 ? "auto" : "none";
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("on", i === active);
        d.setAttribute("aria-selected", i === active ? "true" : "false");
      });
      if (live) live.textContent = reviews[active].text + " — " + reviews[active].name;
    }
    function go(i, user) { active = (i + n) % n; layout(true); if (user) restart(); }
    function play() { if (reduce || timer) return; timer = setInterval(function () { go(active + 1); }, 6000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); play(); }

    prev.addEventListener("click", function () { go(active - 1, true); });
    next.addEventListener("click", function () { go(active + 1, true); });
    var wrap = q(".rev-wrap");
    if (wrap) {
      wrap.addEventListener("mouseenter", stop); wrap.addEventListener("mouseleave", play);
      wrap.addEventListener("focusin", stop); wrap.addEventListener("focusout", play);
    }
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : play(); });

    layout();
    play();
    // The reviews wrapper is "claimed" (excluded from the generic reveal batch) but has
    // no scroll scene of its own, so reveal it here — otherwise it stays at opacity:0.
    var rw = q(".rev-wrap"); if (rw) rw.classList.add("is-visible");
  }

  /* ===================================================================== */
  /*  BOOKING — golden rule draws, fields rise, success draws a gold tick  */
  /* ===================================================================== */
  function bookingScene() {
    var form = q("#bookForm");
    if (!form || !ST) { if (form) form.classList.add("is-visible"); return; }
    var line = q(".book-line", form);
    var fields = qa(".field", form);
    gsap.set(form, { opacity: 1 });
    if (line) gsap.set(line, { scaleX: 0 });
    gsap.set(fields, { opacity: 0, y: 26 });
    var sub = q(".submit-row", form), note = q(".form-note", form);
    if (sub) gsap.set([sub, note], { opacity: 0, y: 20 });

    ST.create({
      trigger: form, start: "top 80%", once: true,
      onEnter: function () {
        var tl = gsap.timeline();
        if (line) tl.to(line, { scaleX: 1, duration: 0.8, ease: "power2.inOut" });
        tl.to(fields, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, 0.25);
        if (sub) tl.to([sub, note], { opacity: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: 0.07 }, "-=0.2");
      }
    });
  }

  /* ===================================================================== */
  /*  BOOKING FORM — validates and builds a professional WhatsApp message */
  /* ===================================================================== */
  function wireBookingForm() {
    var form = q("#bookForm"), ok = q("#formOk");
    if (!form) return;

    function toISODate(d) {
      var m = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      return d.getFullYear() + "-" + m + "-" + day;
    }
    // Clamp the date picker to a sensible window: today → +1 year (blocks past dates natively).
    var dateInput = form.querySelector('[name="date"]');
    if (dateInput) {
      dateInput.min = toISODate(new Date());
      var maxD = new Date(); maxD.setFullYear(maxD.getFullYear() + 1);
      dateInput.max = toISODate(maxD);
    }

    // inject the gold confirmation tick
    if (ok && !q(".book-check", ok)) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "book-check");
      svg.setAttribute("viewBox", "0 0 52 52");
      svg.innerHTML = '<circle class="bc-c" cx="26" cy="26" r="24"></circle><path class="bc-p" d="M14 27 l8 8 l16 -16"></path>';
      ok.insertBefore(svg, ok.firstChild);
    }
    function setErr(nameAttr, msg) {
      var el = form.querySelector('[name="' + nameAttr + '"]');
      if (!el) return;
      var wrap = el.closest(".field");
      wrap.classList.add("invalid");
      el.setAttribute("aria-invalid", "true");
      var e = wrap.querySelector(".field-err");
      if (!e) {
        e = document.createElement("div");
        e.className = "field-err";
        e.id = "err-" + nameAttr;
        e.setAttribute("aria-live", "polite");
        wrap.appendChild(e);
      }
      e.textContent = msg;
      // Associate the message with the field so screen readers announce it.
      el.setAttribute("aria-describedby", e.id);
      function clr() {
        wrap.classList.remove("invalid");
        el.removeAttribute("aria-invalid");
        el.removeAttribute("aria-describedby");
        e.textContent = "";
        el.removeEventListener("input", clr);
        el.removeEventListener("change", clr);
      }
      el.addEventListener("input", clr);
      el.addEventListener("change", clr);
    }

    // Auto-format the date input to a friendly "Saturday, 12 July 2026" string
    function fmtDate(iso) {
      if (!iso) return "";
      var d = new Date(iso + "T00:00:00");
      if (isNaN(d.getTime())) return iso;
      try {
        return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      } catch (e) { return iso; }
    }
    function fmtTime(t) {
      if (!t) return "";
      // 24h "HH:MM" → 12h "h:MM AM/PM"
      var m = /^(\d{1,2}):(\d{2})$/.exec(t);
      if (!m) return t;
      var h = parseInt(m[1], 10), min = m[2];
      var ampm = h >= 12 ? "PM" : "AM";
      var h12 = h % 12; if (h12 === 0) h12 = 12;
      return h12 + ":" + min + " " + ampm;
    }
    function cleanHandle(s) {
      if (!s) return "";
      s = s.trim();
      if (s && s[0] !== "@") s = "@" + s;
      return s;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name     = (form.name.value || "").trim();
      var phone    = (form.phone.value || "").trim();
      var service  = form.service.value || "";
      var date     = (form.date.value || "").trim();
      var time     = (form.time.value || "").trim();
      var instagram = (form.instagram.value || "").trim();
      var notes    = (form.notes.value || "").trim();
      var valid = true;
      [["name", name, "Please enter your name"],
       ["phone", phone, "Please add a phone number we can reach you on"],
       ["service", service, "Please choose a service"]].forEach(function (f) {
        if (!f[1]) { setErr(f[0], f[2]); valid = false; }
      });
      if (valid && phone) {
        var cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
        var phoneRegex = /^(?:\+?91|0)?[6-9]\d{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
          setErr("phone", "Please enter a valid 10-digit mobile number");
          valid = false;
        }
      }

      // --- Date validation: must be a real date, never in the past. ---
      var pickedDate = null;
      if (date) {
        pickedDate = new Date(date + "T00:00:00");
        var today0 = new Date(); today0.setHours(0, 0, 0, 0);
        if (isNaN(pickedDate.getTime())) {
          setErr("date", "Please choose a valid date"); valid = false; pickedDate = null;
        } else if (pickedDate < today0) {
          setErr("date", "Please choose today or a future date"); valid = false;
        }
      }

      // --- Time validation: must fall within opening hours (and not in the past today). ---
      if (time) {
        var tm = /^(\d{1,2}):(\d{2})$/.exec(time);
        if (!tm) {
          setErr("time", "Please enter a valid time"); valid = false;
        } else {
          var mins = parseInt(tm[1], 10) * 60 + parseInt(tm[2], 10);
          if (mins < CONFIG.hours.openMin || mins > CONFIG.hours.lastSlotMin) {
            setErr("time", "We're open 10:00 AM – 8:00 PM (last slot 7:30 PM)"); valid = false;
          } else if (pickedDate) {
            var now = new Date();
            var isToday = pickedDate.getFullYear() === now.getFullYear() &&
                          pickedDate.getMonth() === now.getMonth() &&
                          pickedDate.getDate() === now.getDate();
            if (isToday && mins <= now.getHours() * 60 + now.getMinutes()) {
              setErr("time", "Please choose a time later than now"); valid = false;
            }
          }
        }
      }

      if (!valid) {
        var first = form.querySelector(".field.invalid [name]");
        if (first) first.focus();
        return;
      }

      // Build a professional, well-formatted WhatsApp message
      var lines = [];
      lines.push("Hello " + CONFIG.business + " 👋");
      lines.push("I'd like to request an appointment. Here are my details:");
      lines.push("");
      lines.push("• Name: " + name);
      lines.push("• Phone: " + phone);
      lines.push("• Service: " + service);
      if (date)  lines.push("• Preferred date: " + fmtDate(date));
      if (time)  lines.push("• Preferred time: " + fmtTime(time));
      if (instagram) lines.push("• Instagram: " + cleanHandle(instagram));
      if (notes) {
        lines.push("");
        lines.push("Additional notes:");
        lines.push(notes);
      }
      lines.push("");
      lines.push("Please confirm availability. Thank you!");

      var url = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(lines.join("\n"));

      // Open WhatsApp SYNCHRONOUSLY inside the click gesture so pop-up blockers
      // (Safari especially) never swallow it. Sever the opener for security
      // (reverse-tabnabbing), and fall back to a same-tab navigation if blocked.
      var waWin = window.open(url, "_blank");
      if (waWin) { try { waWin.opener = null; } catch (e) {} }
      else { location.href = url; }

      // Confirmation tick animates in parallel — the WhatsApp tab is already opening.
      if (ok) ok.classList.add("show");
      if (motion && gsap && ok) {
        gsap.fromTo(".bc-c", { strokeDashoffset: 166 }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" });
        gsap.fromTo(".bc-p", { strokeDashoffset: 48 },  { strokeDashoffset: 0, duration: 0.35, ease: "power2.out", delay: 0.45 });
      }
    });
  }

  /* ===================================================================== */
  /*  FOOTER — closing scene: ambient glow, drifting gold dust, logo draw  */
  /* ===================================================================== */
  function footerScene() {
    var footer = q(".footer"), glow = q(".foot-glow"), rule = q(".foot-underline");
    var canvas = q("#footParticles");
    if (!footer || !ST) return;

    if (glow) gsap.set(glow, { opacity: 0 });
    ST.create({
      trigger: footer, start: "top 80%", once: true,
      onEnter: function () {
        if (glow) gsap.to(glow, { opacity: 1, duration: 1.4, ease: "power2.out" });
        if (rule) gsap.fromTo(rule, { width: 0 }, { width: 220, duration: 1.2, ease: "power3.out", delay: 0.2 });
      }
    });

    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d"), parts = [], raf = null, running = false, W = 0, H = 0;
    function size() {
      var r = footer.getBoundingClientRect();
      W = canvas.width = r.width; H = canvas.height = r.height;
    }
    function spawn() {
      return { x: Math.random() * W, y: H + Math.random() * 40, r: Math.random() * 1.6 + 0.4,
        vy: -(Math.random() * 0.35 + 0.12), a: Math.random() * 0.5 + 0.2, t: Math.random() * Math.PI * 2 };
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.y += p.vy; p.t += 0.02; p.x += Math.sin(p.t) * 0.25;
        var fade = p.y < H * 0.35 ? Math.max(0, p.y / (H * 0.35)) : 1;
        ctx.beginPath();
        ctx.fillStyle = "rgba(178,58,72," + (p.a * fade) + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        if (p.y < -10) { var np = spawn(); p.x = np.x; p.y = np.y; p.r = np.r; p.vy = np.vy; p.a = np.a; }
      });
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running) return; running = true;
      var count = isTouch ? 12 : 32;   // lighter load on touch / low-power devices
      size(); if (!parts.length) for (var i = 0; i < count; i++) parts.push(spawn());
      gsap.to(canvas, { opacity: 1, duration: 1 });
      frame();
    }
    function stopRaf() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    ST.create({
      trigger: footer, start: "top bottom", end: "bottom top",
      onEnter: start, onEnterBack: start, onLeave: stopRaf, onLeaveBack: stopRaf
    });
    window.addEventListener("resize", function () { if (running) size(); });
  }
})();
