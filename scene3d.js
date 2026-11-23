(function () {
  const canvas = document.getElementById("scene3d");
  if (!canvas || !window.THREE) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    canvas.remove();
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = canvas.parentElement;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 14;

  const PALETTES = {
    dark: { gold: 0xd29951, terra: 0xa85a48, line: 0xd1ab84, dots: 0xd1ab84, ambient: 0.45, dotsOpacity: 0.55 },
    light: { gold: 0xc08a45, terra: 0x81443b, line: 0x8f5a22, dots: 0x81443b, ambient: 0.9, dotsOpacity: 0.35 },
  };

  const goldMat = new THREE.MeshStandardMaterial({ metalness: 0.7, roughness: 0.3, flatShading: true });
  const terraMat = new THREE.MeshStandardMaterial({ metalness: 0.35, roughness: 0.5, flatShading: true });
  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5 });
  const dotsMat = new THREE.PointsMaterial({ size: 0.05, transparent: true, sizeAttenuation: true, depthWrite: false });

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const key = new THREE.DirectionalLight(0xfff1dd, 1.3);
  key.position.set(6, 8, 10);
  const rim = new THREE.PointLight(0xb5654f, 1.6, 40);
  rim.position.set(-8, -5, 6);
  scene.add(ambient, key, rim);

  const root = new THREE.Group();
  scene.add(root);

  const ico = new THREE.Group();
  ico.add(
    new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 0), goldMat),
    new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2, 1)), lineMat)
  );
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.26, 20, 60), terraMat);
  const octa = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.85, 0)), lineMat);
  const dodeca = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), goldMat);
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.42, 0.13, 90, 12), terraMat);

  // nx/ny: posição em coordenadas normalizadas da tela (-1 a 1)
  const items = [
    { obj: ico, nx: 0.9, ny: 0.62, s: 1, spin: [0.12, 0.18], amp: 0.22 },
    { obj: torus, nx: 0.22, ny: -0.9, s: 0.8, spin: [0.35, 0.2], amp: 0.18 },
    { obj: octa, nx: -0.86, ny: 0.66, s: 1, spin: [0.2, 0.3], amp: 0.15 },
    { obj: dodeca, nx: -0.5, ny: -0.82, s: 1, spin: [0.25, 0.15], amp: 0.2 },
    { obj: knot, nx: 0.62, ny: -0.86, s: 1, spin: [0.18, 0.28], amp: 0.16 },
  ];
  items.forEach((it, i) => {
    it.phase = i * 1.3;
    root.add(it.obj);
  });

  const COUNT = 260;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
  }
  const dotsGeo = new THREE.BufferGeometry();
  dotsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dots = new THREE.Points(dotsGeo, dotsMat);
  scene.add(dots);

  function applyTheme() {
    const p = PALETTES[document.documentElement.dataset.theme] || PALETTES.dark;
    goldMat.color.setHex(p.gold);
    terraMat.color.setHex(p.terra);
    lineMat.color.setHex(p.line);
    dotsMat.color.setHex(p.dots);
    dotsMat.opacity = p.dotsOpacity;
    ambient.intensity = p.ambient;
  }

  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * camera.aspect;
    const narrow = camera.aspect < 0.9;
    const scale = narrow ? 0.55 : Math.min(1, camera.aspect / 1.4 + 0.15);
    items.forEach((it) => {
      // No celular o texto ocupa a metade de baixo; só os objetos do topo ficam visíveis.
      it.obj.visible = !narrow || it.ny > 0;
      it.baseX = it.nx * halfW * (narrow ? 0.95 : 0.92);
      it.baseY = it.ny * halfH * 0.9;
      it.obj.scale.setScalar(it.s * scale);
      it.obj.position.set(it.baseX, it.baseY, 0);
    });
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    root.rotation.y = pointer.x * 0.18;
    root.rotation.x = pointer.y * 0.12;
    items.forEach((it) => {
      it.obj.rotation.x = t * it.spin[0] + it.phase;
      it.obj.rotation.y = t * it.spin[1] + it.phase;
      it.obj.position.y = it.baseY + Math.sin(t * 0.8 + it.phase) * it.amp;
    });
    dots.rotation.y = t * 0.015 + pointer.x * 0.05;
    renderer.render(scene, camera);
  }

  let visible = true;
  let rafId = null;
  function loop() {
    frame();
    rafId = requestAnimationFrame(loop);
  }
  function start() {
    if (reduced || rafId !== null || !visible || document.hidden) return;
    clock.start();
    loop();
  }
  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    visible ? start() : stop();
  }).observe(hero);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  window.addEventListener("resize", () => { layout(); if (reduced) frame(); });
  document.addEventListener("themechange", () => { applyTheme(); if (reduced) frame(); });

  applyTheme();
  layout();
  frame();
  start();

  if (window.gsap && !reduced) {
    items.forEach((it, i) => {
      gsap.from(it.obj.scale, { x: 0, y: 0, z: 0, duration: 1.4, delay: 0.4 + i * 0.12, ease: "back.out(1.6)" });
    });
    if (window.ScrollTrigger) {
      gsap.to(root.position, {
        y: 4, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(canvas, {
        opacity: 0.2, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
    }
  }
})();
