(function () {
  const root = document.documentElement;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.getElementById("year").textContent = new Date().getFullYear();

  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  /* ---------- Tema ---------- */
  const themeBtn = document.getElementById("themeToggle");
  themeBtn.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    store("theme", next);
    document.dispatchEvent(new Event("themechange"));
  });

  /* ---------- Idioma ---------- */
  const EN = window.I18N_EN || {};
  const PT = {
    "meta.title": document.title,
    "meta.description": document.querySelector('meta[name="description"]').content,
    "aria.lang": document.getElementById("langToggle").getAttribute("aria-label"),
    "aria.theme": themeBtn.getAttribute("aria-label"),
  };
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    if (!(el.dataset.i18n in PT)) PT[el.dataset.i18n] = el.innerHTML;
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    PT[el.dataset.i18nAlt] = el.alt;
  });

  function setLang(lang) {
    const dict = lang === "en" ? EN : PT;
    const t = (k) => (k in dict ? dict[k] : PT[k]);
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.innerHTML = t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => (el.alt = t(el.dataset.i18nAlt)));
    document.title = t("meta.title");
    document.querySelector('meta[name="description"]').content = t("meta.description");
    document.getElementById("langToggle").setAttribute("aria-label", t("aria.lang"));
    themeBtn.setAttribute("aria-label", t("aria.theme"));
    root.lang = lang === "en" ? "en" : "pt-BR";
    store("lang", lang);
    if (hasGsap) ScrollTrigger.refresh();
  }

  document.getElementById("langToggle").addEventListener("click", () => {
    const next = root.lang === "en" ? "pt" : "en";
    if (hasGsap && !reduced) {
      const targets = ["main", ".nav__links", ".footer"];
      gsap.to(targets, {
        opacity: 0, duration: 0.18, ease: "power1.in",
        onComplete: () => {
          setLang(next);
          gsap.to(targets, { opacity: 1, duration: 0.3, ease: "power1.out" });
        },
      });
    } else {
      setLang(next);
    }
  });

  if (root.lang === "en") setLang("en");

  /* ---------- Animações ---------- */
  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.to("#progressBar", {
    scaleX: 1, ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true },
  });

  if (reduced) {
    gsap.set("#timelineFill", { scaleY: 1 });
    return;
  }

  document.querySelectorAll("[data-split]").forEach((line) => {
    const text = line.textContent;
    line.textContent = "";
    line.setAttribute("aria-hidden", "true");
    [...text].forEach((ch) => {
      const span = document.createElement("span");
      span.className = "char" + (ch === " " ? " char--space" : "");
      span.textContent = ch === " " ? " " : ch;
      line.appendChild(span);
    });
  });

  gsap.timeline({ defaults: { ease: "power4.out" } })
    .from(".eyebrow", { y: 16, opacity: 0, duration: 0.7 }, 0.1)
    .from(".hero__title .char", { yPercent: 115, opacity: 0, duration: 1, stagger: 0.028 }, 0.2)
    .from('[data-hero="photo"]', { y: 40, opacity: 0, rotationY: -18, duration: 1.4, ease: "expo.out" }, 0.35)
    .from('[data-hero="fade"]:not(.eyebrow)', { y: 22, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.85)
    .from(".portrait__badge", { x: -24, opacity: 0, duration: 0.8 }, 1.2)
    .from(".scroll-hint", { opacity: 0, duration: 0.6 }, 1.5);

  gsap.to(".scroll-hint span", { y: 14, opacity: 0.2, duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut" });

  gsap.to(".portrait img", {
    yPercent: 8, scale: 1.06, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const obj = { v: 0 };
    el.textContent = "0" + suffix;
    gsap.to(obj, {
      v: target, duration: 1.8, ease: "power2.out",
      onUpdate: () => (el.textContent = Math.round(obj.v) + suffix),
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 36, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
    gsap.from(group.children, {
      y: 34, opacity: 0, rotationX: -12, transformPerspective: 800, duration: 0.75, ease: "power3.out", stagger: 0.08,
      scrollTrigger: { trigger: group, start: "top 86%", once: true },
    });
  });

  gsap.to("#timelineFill", {
    scaleY: 1, ease: "none",
    scrollTrigger: { trigger: "#timeline", start: "top 70%", end: "bottom 70%", scrub: 0.4 },
  });

  gsap.utils.toArray("[data-job]").forEach((job) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: job, start: "top 86%", once: true } });
    tl.from(job.querySelector(".job__dot"), { scale: 0, duration: 0.4, ease: "back.out(3)" })
      .from(job.querySelector(".job__card"), { x: -40, opacity: 0, rotationY: 8, transformPerspective: 900, duration: 0.85, ease: "power3.out" }, "<0.05")
      .from(job.querySelectorAll(".job__list li"), { x: -12, opacity: 0, duration: 0.5, stagger: 0.07 }, "-=0.45");
  });

  gsap.from(".contact__links .btn", {
    y: 20, opacity: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.1,
    scrollTrigger: { trigger: ".contact__links", start: "top 92%", once: true },
  });

  /* ---------- Inclinação 3D com o mouse ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const isPortrait = el.classList.contains("portrait");
      const max = isPortrait ? 10 : 6;
      gsap.set(el, { transformPerspective: 900 });
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rx(-py * max);
        ry(px * max);
      });
      el.addEventListener("pointerleave", () => { rx(0); ry(0); });
    });
  }
})();
