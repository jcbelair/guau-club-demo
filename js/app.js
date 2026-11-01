/* ============================================================
   Guau Country Club — capa de sitio
   ============================================================ */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Q = new URLSearchParams(location.search);
  const QA = Q.has('qa');

  /* ---------------- gate ---------------- */
  const gate = $('#gate'), gprog = $('#gate-prog'), gtxt = $('#gate-txt');
  let gp = 0;
  const gpTick = setInterval(() => {
    gp = Math.min(gp + 8 + Math.random() * 14, 92);
    if (gprog) gprog.style.width = gp + '%';
    if (gtxt) gtxt.textContent = gp > 55 ? 'Preparando el jardín…' : 'Abrimos el portón…';
  }, 220);
  function openGate() {
    clearInterval(gpTick);
    if (gprog) gprog.style.width = '100%';
    setTimeout(() => {
      gate && gate.classList.add('done');
      document.body.classList.remove('loading');
      revealScan();
  // red de seguridad: si un IO no dispara, mostramos lo que ya está en pantalla
  setTimeout(() => {
    $$('.reveal:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 1.1 && r.bottom > -80) el.classList.add('in');
    });
  }, 2600);
    }, QA ? 60 : 420);
  }
  addEventListener('load', () => setTimeout(openGate, QA ? 100 : 900));
  setTimeout(openGate, 5200); // nunca bloquear la página

  /* ---------------- nav ---------------- */
  const nav = $('#nav'), pt = $('#progress-top');
  let lastY = 0;
  function onScroll() {
    const y = scrollY;
    nav.classList.toggle('solid', y > innerHeight * 0.72);
    nav.classList.toggle('hide', y > innerHeight * 1.4 && y > lastY && !$('#nav-links').classList.contains('open'));
    lastY = y;
    const h = document.documentElement.scrollHeight - innerHeight;
    if (pt) pt.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger'), links = $('#nav-links');
  burger && burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('#nav-links a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open'); burger && burger.setAttribute('aria-expanded', 'false');
  }));

  /* ---------------- reveal ---------------- */
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  function revealScan() {
    $$('.reveal').forEach((el, i) => {
      el.style.transitionDelay = (Math.min(i, 6) * 60) + 'ms';
      if (reduce) el.classList.add('in'); else io.observe(el);
    });
  }
  revealScan();
  // red de seguridad: si un IO no dispara, mostramos lo que ya está en pantalla
  setTimeout(() => {
    $$('.reveal:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 1.1 && r.bottom > -80) el.classList.add('in');
    });
  }, 2600);

  /* ---------------- parallax ---------------- */
  const px = $$('[data-parallax]');
  if (!reduce && px.length) {
    let raf = null;
    const run = () => {
      raf = null;
      const vh = innerHeight;
      px.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const k = parseFloat(el.dataset.parallax) || 0.1;
        const d = (r.top + r.height / 2 - vh / 2) * -k;
        el.style.transform = `translate3d(0,${d.toFixed(1)}px,0)`;
      });
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true });
    run();
  }

  /* ---------------- servicios ---------------- */
  const WA = 'https://wa.me/525633945903';
  const tiers = [
    { n: 'I', t: 'Adiestramiento', img: 'img/sv-adiestramiento.jpg', d: 'Te enseñamos lo mejor para mantener una convivencia sana con tu perro. Sesiones privadas, niveles básico a avanzado y guardia y protección según raza y edad.', cta: 'Conocer el programa' },
    { n: 'II', t: 'Hospedaje', img: 'img/sv-hospedaje.jpg', d: 'Siéntete en libertad: tu perro se divertirá en nuestro hospedaje, con rutinas de juego, descanso y compañía durante toda su estancia.', cta: 'Reservar estancia' },
    { n: 'III', t: 'Guardería', img: 'img/sv-guarderia.jpg', d: 'Un espacio para que tu perro se divierta y socialice mientras tú trabajas, con supervisión permanente y grupos por tamaño y energía.', cta: 'Ver disponibilidad' },
    { n: 'IV', t: 'Estética canina', img: 'img/sv-bano.jpg', d: 'Baño, corte de uñas y limpieza dental con productos suaves. Tu perro quedará limpio, contento y con el pelaje como nuevo.', cta: 'Agendar baño' },
    { n: 'V', t: 'Restaurante & bar', img: 'img/sv-bar.jpg', d: 'Desayunos y comidas de casa mientras tu perro aprende, más servicio de bar y música para venir con tus amig@s.', cta: 'Ver la carta' },
    { n: 'VI', t: 'Alberca & recreo', img: 'img/sv-alberca.jpg', d: 'Nado supervisado, juegos de agility y tardes de jardín: el recreo que equilibra cualquier día de entrenamiento.', cta: 'Conocer el club' },
  ];
  const tiersBox = $('#tiers');
  if (tiersBox) {
    tiersBox.innerHTML = tiers.map(t => `
      <a class="tier reveal" href="mailto:hola@guau.club?subject=${encodeURIComponent('Información: ' + t.t)}">
        <div class="tier-media"><img src="${t.img}" alt="${t.t} en Guau Country Club" loading="lazy"><span class="tier-num">${t.n}</span></div>
        <div class="tier-body">
          <h3>${t.t}</h3>
          <p>${t.d}</p>
          <span class="link-arrow">${t.cta}</span>
        </div>
      </a>`).join('');
  }

  /* ---------------- testimonios ---------------- */
  const quotes = [
    { q: 'Nanok nos enseñó a quitar la ansiedad por separación y, mediante el entrenamiento, Mily y yo ahora tenemos un vínculo y podemos ir juntas a disfrutar lugares públicos.', a: 'Familia de Mily' },
    { q: 'Gracias a Valeria, Pedro y todo el equipo he podido entender más a Eusébio a través de los ejercicios de obediencia, guardia y protección.', a: 'Familia de Eusébio' },
    { q: 'Lucio ahora es un perrito equilibrado. Nos han enseñado que la educación y el tiempo que les brindas —jugando y entrenando— es tan importante como el amor.', a: 'Familia de Lucio' },
    { q: 'Canelo es más obediente y me han dado herramientas para mejorar la convivencia. Nanok Mascotas nos cambió la vida.', a: 'Familia de Canelo' },
  ];
  const qBox = $('#quotes');
  if (qBox) {
    qBox.innerHTML = quotes.map(t => `
      <figure class="quote reveal">
        <blockquote>${t.q}</blockquote>
        <figcaption>${t.a}</figcaption>
      </figure>`).join('');
  }

  /* ---------------- lista del recorrido ---------------- */
  const stations = [
    { n: '01', t: 'La entrada', d: 'El portón de hierro y piedra abre el camino: una vereda de tierra que atraviesa el bosque de pinos del club.' },
    { n: '02', t: 'La pista de adiestramiento', d: 'Vallas, conos y aros. Aquí se trabaja la obediencia con método positivo, en sesiones cortas y claras.' },
    { n: '03', t: 'Hospedaje', d: 'Cabañas de madera con terrazas donde tu perro descansa después de jugar, a la vista del personal toda la noche.' },
    { n: '04', t: 'Guardería', d: 'Un cercado de madera, juguetes y casetas: el espacio de socialización por grupos de tamaño y energía.' },
    { n: '05', t: 'Estética canina', d: 'La tina clásica con agua tibia, productos suaves y secado lento. Baño, uñas y limpieza dental.' },
    { n: '06', t: 'Restaurante & bar', d: 'Terraza de madera con mesas, sombrillas y luces: desayunos, comidas y bar para los humanos de la manada.' },
    { n: '07', t: 'El mirador', d: 'Bancas frente al lago de Valle de Bravo. El punto donde el recorrido se detiene y el paisaje hace el resto.' },
    { n: '08', t: 'Contacto', d: 'Señalización, teléfono y correo. Agenda tu visita: hola@guau.club · +52 5633 945903.' },
  ];
  const lBox = $('#lista-grid');
  if (lBox) {
    lBox.innerHTML = stations.map(s => `
      <article class="lista-item reveal">
        <span class="n">${s.n}</span>
        <h3>${s.t}</h3>
        <p>${s.d}</p>
      </article>`).join('');
  }

  /* ---------------- lightbox ---------------- */
  const lb = $('#lightbox'), lbImg = lb && lb.querySelector('img');
  $$('.m').forEach(b => b.addEventListener('click', () => {
    if (!lb) return;
    lbImg.src = b.dataset.full || b.querySelector('img').src;
    lb.hidden = false; requestAnimationFrame(() => lb.classList.add('open'));
  }));
  function closeLB() { if (!lb) return; lb.classList.remove('open'); setTimeout(() => { lb.hidden = true; }, 380); }
  lb && lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-close')) closeLB(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeLB(); });

  /* ---------------- sonido ---------------- */
  const snd = $('#sound');
  snd && snd.addEventListener('click', () => {
    const on = snd.getAttribute('aria-pressed') !== 'true';
    snd.setAttribute('aria-pressed', on);
    snd.style.background = on ? 'rgba(217,190,134,.16)' : '';
    if (window.GuauAudio) window.GuauAudio(on);
  });

  /* ---------------- compañero del cursor ---------------- */
  const fol = $('#follower'), dogT = $('#dogtoggle');
  if (dogT) {
    if (localStorage.getItem('guauDog') === 'emoji') { fol.classList.add('emoji'); dogT.textContent = 'Compañero del cursor: emoji'; dogT.setAttribute('aria-pressed', 'true'); }
    dogT.addEventListener('click', () => {
      const emoji = fol.classList.toggle('emoji');
      localStorage.setItem('guauDog', emoji ? 'emoji' : 'silueta');
      dogT.textContent = 'Compañero del cursor: ' + (emoji ? 'emoji' : 'silueta');
      dogT.setAttribute('aria-pressed', emoji);
    });
  }
  if (fol && !reduce && matchMedia('(hover:hover)').matches && !QA) {
    let lx = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('mousemove', e => {
      fol.classList.add('on');
      const dir = e.clientX < lx ? -1 : 1; lx = e.clientX;
      tx = e.clientX + 16; ty = e.clientY + 12;
      fol.dataset.dir = dir;
    }, { passive: true });
    document.addEventListener('mouseleave', () => fol.classList.remove('on'));
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      const d = +fol.dataset.dir || 1;
      fol.style.transform = `translate3d(${cx}px,${cy}px,0) scaleX(${d})`;
      requestAnimationFrame(loop);
    })();
    let t = null;
    addEventListener('mousemove', e => {
      fol.classList.add('moving');
      clearTimeout(t);
      t = setTimeout(() => fol.classList.remove('moving'), 420);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const dark = el && el.closest('.section:not(.band),.nav.solid,.foot,.journey');
      fol.classList.toggle('ondark', !!dark);
      fol.classList.toggle('gold', !!(el && el.closest('.band,.hero')));
    }, { passive: true });
  }

  /* ---------------- reloj discreto ---------------- */
  const clk = $('#clock');
  if (clk) {
    const tick = () => {
      const d = new Date();
      clk.textContent = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) + ' · Valle de Bravo';
    };
    tick(); setInterval(tick, 30000);
  }

  /* ---------------- teclado: navegación por anclas suave ---------------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', ev => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    ev.preventDefault();
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }));
})();
