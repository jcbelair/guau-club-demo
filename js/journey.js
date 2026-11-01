/* ============================================================
   Guau Country Club — recorrido 3D (three.js)
   Escena procedural: bosque, sendero, estaciones y un perro guía.
   Modelo: «German Shepard» por Quaternius (Poly Pizza), CC BY 3.0.
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';

const $ = (s, r = document) => r.querySelector(s);
const Q = new URLSearchParams(location.search);
const QA = Q.has('qa');
const LITE = Q.has('lite') || QA;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 900px)').matches;

/* ---------------- contenido ---------------- */
const MAIL = 'mailto:hola@guau.club?subject=' + encodeURIComponent('Agendar una visita a Guau Country Club');
const ST = [
  { id: 'bienvenida', pill: 'Bienvenida', u: 0.035,
    t: 'Bienvenidos a <em>Guau</em>', lead: 'Adiestrando ambos lados de la correa.',
    meta: 'Valle de Bravo · Estado de México', cta: 'Agendar una visita', href: MAIL },
  { id: 'adiestramiento', pill: 'Adiestramiento', u: 0.175,
    t: 'Adiestramiento', lead: 'En Guau te enseñamos cómo fortalecer el vínculo con tu perro con un proceso divertido y claro.',
    meta: 'Sesiones privadas · Niveles básico a avanzado', cta: 'Conocer el programa', href: MAIL },
  { id: 'hospedaje', pill: 'Hospedaje', u: 0.305,
    t: 'Hospedaje', lead: 'Siéntete en libertad: tu perro se divertirá en nuestro hospedaje, con rutinas de juego y descanso.',
    meta: 'Cabañas con terraza · Supervisión nocturna', cta: 'Reservar estancia', href: MAIL },
  { id: 'guarderia', pill: 'Guardería', u: 0.425,
    t: 'Guardería', lead: 'Un espacio para que tu perro se divierta y socialice mientras tú trabajas.',
    meta: 'Grupos por tamaño y energía · Personal capacitado', cta: 'Ver disponibilidad', href: MAIL },
  { id: 'bano', pill: 'Estética', u: 0.545,
    t: 'Estética <em>canina</em>', lead: 'Baño, corte de uñas y limpieza dental. Tu perro quedará limpio y contento.',
    meta: 'Productos suaves · Secado lento', cta: 'Agendar baño', href: MAIL },
  { id: 'restaurante', pill: 'Restaurante', u: 0.665,
    t: 'Restaurante <em>&amp;</em> Bar', lead: 'Prueba nuestros desayunos y comidas mientras tu perro aprende, con bar y música para tus amig@s.',
    meta: 'Terraza al jardín · Cocina de casa', cta: 'Reservar mesa', href: MAIL },
  { id: 'visita', pill: 'El mirador', u: 0.80,
    t: 'Visítanos', lead: '¡En cuanto nos visites, Guau! será tu primera expresión.',
    meta: 'El lago de Valle de Bravo al atardecer', cta: 'Cómo llegar', href: '#contacto' },
  { id: 'contacto', pill: 'Contacto', u: 0.955,
    t: 'Agenda tu <em>cita</em>', lead: 'Carretera San Mateo Acatitlán S/N, Col. San Mateo Acatitlán, CP 51200, Valle de Bravo.',
    meta: 'hola@guau.club · +52 5633 945903', cta: 'Escribir al club', href: MAIL },
];
const pad = n => String(n).padStart(2, '0');

/* ---------------- utilidades ---------------- */
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(hash(xi, yi), hash(xi + 1, yi), u),
    THREE.MathUtils.lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
}
function fbm(x, y, o = 4) { let a = 0, f = 1, s = .5; for (let i = 0; i < o; i++) { a += s * vnoise(x * f, y * f); f *= 2; s *= .5; } return a; }

function furNormal(size = 512) {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const n = x / size, m = y / size;
    h[y * size + x] = fbm(n * 26, m * 26, 3) * .6 + vnoise(n * 120, m * 26) * .4;
  }
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d'), im = ctx.createImageData(size, size);
  const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * 6, dy = (at(x, y + 1) - at(x, y - 1)) * 6;
    const l = Math.hypot(dx, dy, 1);
    const i = (y * size + x) * 4;
    im.data[i] = (-dx / l * .5 + .5) * 255;
    im.data[i + 1] = (-dy / l * .5 + .5) * 255;
    im.data[i + 2] = (1 / l * .5 + .5) * 255;
    im.data[i + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}
function radialTex(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner); g.addColorStop(.45, inner.replace('1)', '.45)')); g.addColorStop(1, outer);
  c.fillStyle = g; c.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function bladeTex() {
  const w = 128, h = 128, cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.clearRect(0, 0, w, h);
  for (let i = 0; i < 22; i++) {
    const x = 6 + Math.random() * (w - 12), hh = h * (.45 + Math.random() * .5), bw = 2 + Math.random() * 2.6;
    const lean = (Math.random() - .5) * 26;
    const g = c.createLinearGradient(0, h, 0, h - hh);
    g.addColorStop(0, 'rgba(58,78,38,.95)');
    g.addColorStop(.55, 'rgba(104,126,58,.95)');
    g.addColorStop(1, 'rgba(150,163,90,.85)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - bw, h);
    c.quadraticCurveTo(x - bw * .4 + lean * .4, h - hh * .62, x + lean, h - hh);
    c.quadraticCurveTo(x + bw * .4 + lean * .4, h - hh * .62, x + bw, h);
    c.closePath(); c.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function textTex(lines, w = 1400, h = 190, bg = '#12211a', fg = '#d9be86') {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.strokeStyle = fg; x.lineWidth = 3; x.strokeRect(12, 12, w - 24, h - 24);
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((l, i) => { x.font = l.f; x.fillText(l.t, w / 2, h * (i + 1) / (lines.length + 1)); });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function mergeGeoms(list) {
  const pos = [], nor = [], uv = [], idx = [];
  let off = 0;
  list.forEach(g => {
    const p = g.attributes.position.array, n = g.attributes.normal.array, u = g.attributes.uv.array;
    for (let i = 0; i < p.length; i++) pos.push(p[i]);
    for (let i = 0; i < n.length; i++) nor.push(n[i]);
    for (let i = 0; i < u.length; i++) uv.push(u[i]);
    const ix = g.index.array;
    for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off);
    off += p.length / 3;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}

/* ---------------- arranque ---------------- */
const section = $('#recorrido');
const canvasEl = $('#scene');
if (section && canvasEl) start();

function hasGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

async function start() {
  window.__stage = 'boot';
  if (!hasGL()) { $('#j-loader')?.classList.add('done'); document.body.classList.add('no-gl'); return; }

  const settle = () => new Promise(r => setTimeout(r, 0));
  const setProg = (p, txt) => {
    const b = $('#j-loadprog'); if (b) b.style.width = (p * 100) + '%';
    const m = $('.j-loadmark'); if (m && txt) m.textContent = txt;
  };

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: QA });
  renderer.setPixelRatio(LITE ? 1 : Math.min(devicePixelRatio || 1, mobile ? 1.6 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(mobile ? 52 : 40, 1, .1, 2400);
  const size = () => {
    const w = section.clientWidth || innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  size();

  /* --- cielo --- */
  const sunDir = new THREE.Vector3(-.52, .40, -.75).normalize();
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sun: { value: sunDir }, t: { value: 0 } },
    vertexShader: `varying vec3 vd;void main(){vd=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      varying vec3 vd; uniform vec3 sun; uniform float t;
      float h21(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
      float n2(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
        return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
      float fbm2(vec2 p){float a=0.,s=.5;for(int i=0;i<5;i++){a+=s*n2(p);p*=2.03;s*=.5;}return a;}
      void main(){
        float h=vd.y;
        vec3 top=vec3(.055,.105,.19), mid=vec3(.36,.30,.36), hor=vec3(1.02,.62,.36);
        vec3 c=mix(hor,mid,smoothstep(.0,.16,h));
        c=mix(c,top,smoothstep(.14,.72,h));
        if(h<0.)c=mix(hor,vec3(.32,.29,.28),smoothstep(0.,-.16,h));
        float s=max(dot(normalize(vd),sun),0.);
        c+=vec3(1.,.62,.32)*pow(s,7.)*.6+vec3(1.,.86,.66)*pow(s,220.)*2.2+vec3(1.,.95,.85)*pow(s,2200.)*6.;
        vec2 uv=vd.xz/max(.12,vd.y+.35)*.9+vec2(t*.004,t*.002);
        float cl=fbm2(uv*1.2), cl2=fbm2(uv*2.7+7.);
        float mask=smoothstep(.52,.86,cl*.75+cl2*.35)*smoothstep(.02,.3,h);
        vec3 cloud=mix(vec3(.98,.72,.55),vec3(1.,.9,.8),cl2);
        c=mix(c,cloud,mask*.5);
        gl_FragColor=vec4(c,1.);
      }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), skyMat);
  sky.frustumCulled = false; scene.add(sky);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(12, 32, 16), skyMat.clone()));
  scene.environment = pmrem.fromScene(envScene, .035).texture;
  scene.fog = new THREE.FogExp2(0xd3a685, .0072);

  const hemi = new THREE.HemisphereLight(0xffd7b0, 0x24382b, .5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffcf9b, 2.9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(LITE || mobile ? 1024 : 2048, LITE || mobile ? 1024 : 2048);
  const sc = sun.shadow.camera;
  sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 230;
  sun.shadow.bias = -.00035; sun.shadow.normalBias = .03; sun.shadow.radius = 2.4;
  scene.add(sun, sun.target);

  const glowTex = radialTex('rgba(255,247,232,1)', 'rgba(255,190,120,0)', 256);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd9a8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .85, fog: false }));
  sunGlow.scale.setScalar(210);
  sunGlow.position.copy(sunDir).multiplyScalar(760);
  scene.add(sunGlow);

  window.__stage = 'renderer';
  setProg(.1, 'Trazando el sendero…'); await settle();

  /* --- curva del sendero --- */
  const P = [[0, 46], [0, 30], [-7, 14], [-13, -4], [-6, -22], [8, -38], [12, -56], [2, -74], [-12, -88], [-20, -99], [-6, -104], [10, -102], [26, -104], [40, -100]];
  const curve = new THREE.CatmullRomCurve3(P.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
  curve.arcLengthDivisions = 700;
  const samples = curve.getSpacedPoints(700);
  const lakeZ = -114;

  /* --- campo de distancias al sendero --- */
  const GS = 4, GX0 = -260, GZ0 = -300, GW = 130, GH = 110;
  const df = new Float32Array(GW * GH).fill(999);
  for (let gz = 0; gz < GH; gz++) {
    for (let gx = 0; gx < GW; gx++) {
      const x = GX0 + gx * GS, z = GZ0 + gz * GS;
      let m = 1e9;
      for (let i = 0; i < samples.length; i += 2) {
        const dx = samples[i].x - x, dz = samples[i].z - z, d = dx * dx + dz * dz;
        if (d < m) m = d;
      }
      df[gz * GW + gx] = Math.sqrt(m);
    }
  }
  function pathDist(x, z) {
    const fx = (x - GX0) / GS, fz = (z - GZ0) / GS;
    if (fx < 0 || fz < 0 || fx >= GW - 1 || fz >= GH - 1) return 60;
    const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0;
    const a = df[z0 * GW + x0], b = df[z0 * GW + x0 + 1], c = df[(z0 + 1) * GW + x0], d = df[(z0 + 1) * GW + x0 + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  }
  function lakeAmt(x, z) { return smooth(lakeZ + 8, lakeZ - 6, z); }
  function H(x, z) {
    const pd = pathDist(x, z);
    const flat = smooth(4, 20, pd);
    let h = (fbm(x * .021 + 3, z * .021) * 7 - 2.6) * flat;
    h += smooth(70, 240, Math.abs(x)) * 16 * fbm(x * .009, z * .008);
    h += fbm(x * .09, z * .09) * .7 * flat;
    const la = lakeAmt(x, z);
    return h * (1 - la) + (-4.2) * la;
  }
  const ground = (x, z) => H(x, z);
  /* altura real de la malla del terreno (interpolación bilineal del grid) */
  function meshGround(x, z) {
    const TST = TS / seg, TX0 = -TS / 2, TZ0 = -(TS / 2) - 95;
    const fx = (x - TX0) / TST, fz = (z - TZ0) / TST;
    const x0 = Math.max(0, Math.min(seg - 1, Math.floor(fx)));
    const z0 = Math.max(0, Math.min(seg - 1, Math.floor(fz)));
    const tx = clamp(fx - x0), tz = clamp(fz - z0);
    const a = HG[z0 * N1 + x0], b = HG[z0 * N1 + x0 + 1], c = HG[(z0 + 1) * N1 + x0], d = HG[(z0 + 1) * N1 + x0 + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  }

  window.__stage = 'distfield';
  setProg(.22, 'Levantando el terreno…'); await settle();

  /* --- terreno --- */
  const seg = LITE ? 150 : mobile ? 180 : 260, TS = 620;
  const tg = new THREE.PlaneGeometry(TS, TS, seg, seg);
  tg.rotateX(-Math.PI / 2); tg.translate(0, 0, -95);
  const N1 = seg + 1, HG = new Float32Array(N1 * N1);
  const pos = tg.attributes.position, cols = new Float32Array(pos.count * 3);
  const grassA = new THREE.Color(0x38512c), grassB = new THREE.Color(0x6b7c3c), dirt = new THREE.Color(0xbda079);
  const edge = new THREE.Color(0x7d7248), sand = new THREE.Color(0xa8996f);
  const cc = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const pd = pathDist(x, z), h = H(x, z);
    pos.setY(i, h);
    HG[i] = h;
    cc.copy(grassA).lerp(grassB, fbm(x * .07, z * .07));
    cc.lerp(edge, (1 - smooth(1.6, 4.2, pd)) * .55);
    cc.lerp(dirt, (1 - smooth(1.0, 2.4, pd)) * .9);
    const la = lakeAmt(x, z);
    cc.lerp(sand, smooth(0, .3, la) * (1 - smooth(.5, .95, la)));
    cc.offsetHSL(0, 0, (fbm(x * .5, z * .5) - .5) * .03);
    cols.set([cc.r, cc.g, cc.b], i * 3);
    if (i % 9000 === 0) { setProg(.22 + .16 * i / pos.count); await settle(); }
  }
  tg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  tg.computeVertexNormals();
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, metalness: 0 }));
  terrain.receiveShadow = true;
  scene.add(terrain);

  /* --- sendero --- */
  {
    const N = 420, verts = [], uvs = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const nx = t.z, nz = -t.x;
      const w = 1.15 + vnoise(u * 26, 3) * .35;
      for (const s of [-1, 1]) {
        const x = p.x + nx * w * s, z = p.z + nz * w * s;
        verts.push(x, ground(x, z) + .05, z);
        uvs.push((s + 1) / 2, u * 26);
      }
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#b39a72'; cx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5200; i++) {
      const s = 1 + Math.random() * 3;
      cx.fillStyle = `rgba(${90 + Math.random() * 90},${72 + Math.random() * 70},${48 + Math.random() * 50},${.06 + Math.random() * .22})`;
      cx.fillRect(Math.random() * 256, Math.random() * 256, s, s);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const ribbon = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      map: tex, roughness: .97, metalness: 0, transparent: true, opacity: .97,
      polygonOffset: true, polygonOffsetFactor: -1
    }));
    ribbon.receiveShadow = true;
    scene.add(ribbon);
  }

  /* --- lago --- */
  const wnorm = (() => {
    const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const x = cv.getContext('2d'), im = x.createImageData(N, N);
    const hg = (i, j) => { let v = 0; for (let o = 1; o <= 4; o++) { const f = o * 2; v += Math.sin((i * f + j * f * .7) / N * Math.PI * 2 + o) / o + Math.cos((j * f * 1.3 - i * f * .4) / N * Math.PI * 2 + o * 2) / o; } return v; };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const dx = hg(i + 1, j) - hg(i - 1, j), dy = hg(i, j + 1) - hg(i, j - 1);
      const k = (j * N + i) * 4;
      im.data[k] = 128 + dx * 34; im.data[k + 1] = 128 + dy * 34; im.data[k + 2] = 255; im.data[k + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(70, 34); return t;
  })();
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1800, 900),
    new THREE.MeshPhysicalMaterial({
      color: 0x1d3c47, roughness: .11, metalness: .12, envMapIntensity: 1.7,
      clearcoat: 1, clearcoatRoughness: .04,
      normalMap: wnorm, normalScale: new THREE.Vector2(.28, .28),
      clearcoatNormalMap: wnorm, clearcoatNormalScale: new THREE.Vector2(.16, .16)
    }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -1.1, lakeZ - 380);
  scene.add(water);

  {
    const glit = new THREE.Mesh(new THREE.PlaneGeometry(70, 560),
      new THREE.MeshBasicMaterial({ map: radialTex('rgba(255,214,160,.95)', 'rgba(255,170,90,0)', 128), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .5, fog: false }));
    glit.rotation.x = -Math.PI / 2; glit.rotation.z = -.55;
    glit.position.set(-150, -.9, lakeZ - 300);
    scene.add(glit);
  }

  const boats = [];
  {
    const hullM = new THREE.MeshStandardMaterial({ color: 0xf5efe3, roughness: .45 });
    const sailM = new THREE.MeshStandardMaterial({ color: 0xfff8ec, roughness: .72, side: THREE.DoubleSide });
    const mastM = new THREE.MeshStandardMaterial({ color: 0x6b5a45, roughness: .8 });
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.CapsuleGeometry(.55, 3, 6, 14), hullM);
      hull.rotation.z = Math.PI / 2; hull.scale.set(1, 1, .55); hull.position.y = .1; b.add(hull);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 6), mastM); mast.position.y = 3.2; b.add(mast);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 5.4); sh.quadraticCurveTo(1.25, 2.5, 2.6, 0); sh.lineTo(0, 0);
      const sail = new THREE.Mesh(new THREE.ShapeGeometry(sh, 12), sailM); sail.position.set(.08, .5, 0); b.add(sail);
      const jib = new THREE.Shape(); jib.moveTo(0, 0); jib.lineTo(0, 4.4); jib.lineTo(-1.8, 0);
      const j = new THREE.Mesh(new THREE.ShapeGeometry(jib), sailM); j.position.set(-.1, .5, 0); b.add(j);
      b.position.set(-100 + hash(i, 4) * 200, -1.1, lakeZ - 40 - hash(i, 5) * 190);
      b.rotation.y = hash(i, 6) * 6;
      b.scale.setScalar(1 + hash(i, 7) * .6);
      b.userData.ph = i;
      scene.add(b); boats.push(b);
    }
  }

  {
    const mMat = new THREE.MeshStandardMaterial({ color: 0x3a4c41, roughness: 1 });
    for (let i = 0; i < 16; i++) {
      const g = new THREE.ConeGeometry(62 + hash(i, 1) * 72, 44 + hash(i, 2) * 76, 40, 8);
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
        const n = fbm(x * .03 + i, z * .03) * 13;
        p.setXYZ(k, x, y + (y > -20 ? n * .6 : 0), z);
      }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, mMat);
      const a = -Math.PI / 2 + (i / 15 - .5) * 2.5;
      const r = 440 + hash(i, 3) * 130;
      m.position.set(Math.cos(a) * r * 1.2, 6, lakeZ + Math.sin(a) * r * .7);
      scene.add(m);
    }
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x304436, roughness: 1 });
    for (let i = 0; i < 11; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14), hillMat);
      m.scale.set(72 + hash(i, 9) * 62, 17 + hash(i, 8) * 20, 42);
      m.position.set(-320 + i * 66, -8, lakeZ - 270 - hash(i, 7) * 46);
      scene.add(m);
    }
  }

  window.__stage = 'lake';
  setProg(.55, 'Plantando pinos…'); await settle();

  /* --- estaciones + pinos --- */
  const stations = ST.map(s => {
    const p = curve.getPointAt(s.u), t = curve.getTangentAt(s.u);
    return { p, t, n: new THREE.Vector3(t.z, 0, -t.x) };
  });
  const dummy = new THREE.Object3D();
  const treeCount = LITE ? 420 : mobile ? 620 : 1250;
  {
    const trunkG = new THREE.CylinderGeometry(.16, .28, 3, 8); trunkG.translate(0, 1.5, 0);
    const tiers = [[2.7, 4.4, 2.4], [2.05, 3.7, 4.3], [1.38, 3.1, 6.1], [.78, 2.3, 7.7]].map(([r, h, y]) => {
      const g = new THREE.ConeGeometry(r, h, 44, 8);
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const x = p.getX(k), z = p.getZ(k), yy = p.getY(k);
        if (yy < h / 2 - .01) {
          const a = Math.atan2(z, x), w = 1 + .06 * Math.sin(a * 9 + r * 3) + .03 * Math.sin(a * 23);
          p.setX(k, x * w); p.setZ(k, z * w);
          if (yy < -h / 2 + .01) p.setY(k, yy - .14 * (.5 + .5 * Math.sin(a * 9 + r * 3)));
        }
      }
      g.computeVertexNormals(); g.translate(0, y, 0); return g;
    });
    const trunkI = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: 0x4a3527, roughness: 1 }), treeCount);
    const leafM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .88 });
    const tierI = tiers.map(g => new THREE.InstancedMesh(g, leafM, treeCount));
    let placed = 0, tries = 0; const tc = new THREE.Color();
    while (placed < treeCount && tries < treeCount * 14) {
      tries++;
      const x = (Math.random() - .5) * (placed < treeCount * .62 ? 170 : 460);
      const z = 66 - Math.random() * (66 - lakeZ + 10);
      if (lakeAmt(x, z) > .04) continue;
      const pd = pathDist(x, z);
      if (pd < 7.4 + Math.random() * 3.5) continue;
      if (stations.some(s => Math.hypot(s.p.x + s.n.x * 8 - x, s.p.z + s.n.z * 8 - z) < 10 || Math.hypot(s.p.x - s.n.x * 8 - x, s.p.z - s.n.z * 8 - z) < 10)) continue;
      const y = H(x, z), s = .72 + Math.random() * 1.0;
      dummy.position.set(x, y - .25, z);
      dummy.rotation.set(0, Math.random() * 6.28, 0);
      dummy.scale.set(s, s * (.85 + Math.random() * .55), s);
      dummy.updateMatrix();
      trunkI.setMatrixAt(placed, dummy.matrix);
      tc.setHSL(.28 + Math.random() * .07, .32 + Math.random() * .18, .10 + Math.random() * .08);
      tierI.forEach(t => { t.setMatrixAt(placed, dummy.matrix); t.setColorAt(placed, tc); });
      placed++;
      if (placed % 260 === 0) { setProg(.55 + .12 * placed / treeCount); await settle(); }
    }
    [trunkI, ...tierI].forEach(m => { m.count = placed; m.castShadow = true; m.receiveShadow = true; scene.add(m); });
  }

  /* --- pasto --- */
  const windU = { value: 0 };
  {
    const bl = bladeTex();
    const p1 = new THREE.PlaneGeometry(.5, .62, 1, 1); p1.translate(0, .31, 0);
    const p2 = p1.clone(); p2.rotateY(Math.PI / 2);
    const g = mergeGeoms([p1, p2]);
    const m = new THREE.MeshStandardMaterial({ map: bl, alphaTest: .42, side: THREE.DoubleSide, roughness: .9, metalness: 0 });
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = windU;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 gp = instanceMatrix * vec4(0.,0.,0.,1.);
          float ph = gp.x*0.55 + gp.z*0.42;
          float k = pow(max(position.y,0.0), 1.4);
          transformed.x += sin(uTime*1.5 + ph) * 0.14 * k;
          transformed.z += cos(uTime*1.15 + ph*1.27) * 0.1 * k;
        #endif`);
    };
    const n = LITE ? 1200 : mobile ? 2400 : 6400;
    const inst = new THREE.InstancedMesh(g, m, n);
    const c2 = new THREE.Color();
    let k = 0, guard = 0;
    while (k < n && guard < n * 10) {
      guard++;
      const u = Math.random();
      const p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const off = (Math.random() < .5 ? -1 : 1) * (2.7 + Math.random() * 13);
      const x = p.x + t.z * off, z = p.z - t.x * off;
      if (lakeAmt(x, z) > .05) continue;
      dummy.position.set(x, H(x, z) - .05, z);
      const s = .45 + Math.random() * 1.15;
      dummy.scale.set(s * (.85 + Math.random() * .45), s, s);
      dummy.rotation.set(0, Math.random() * 6.28, 0);
      dummy.updateMatrix();
      inst.setMatrixAt(k, dummy.matrix);
      c2.setHSL(.2 + Math.random() * .09, .3 + Math.random() * .25, .34 + Math.random() * .14);
      inst.setColorAt(k, c2);
      k++;
    }
    inst.count = k;
    inst.frustumCulled = false;
    scene.add(inst);
  }

  /* --- rocas --- */
  {
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.5, 0), new THREE.MeshStandardMaterial({ color: 0x8b8578, roughness: .92 }), 150);
    for (let i = 0; i < 150; i++) {
      const u = Math.random(), p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const side = (Math.random() < .5 ? -1 : 1) * (2.6 + Math.random() * 4);
      const x = p.x + t.z * side, z = p.z - t.x * side;
      dummy.position.set(x, ground(x, z) - .1, z);
      dummy.scale.set(.3 + Math.random() * .8, .2 + Math.random() * .45, .3 + Math.random() * .7);
      dummy.rotation.set(Math.random(), Math.random() * 6, Math.random() * .4);
      dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);
  }

  window.__stage = 'trees';
  setProg(.72, 'Abriendo el club…'); await settle();

  /* --- materiales y ayudas --- */
  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .7, ...o });
  const stone = M(0xd9cfba, { roughness: .88 });
  const goldM = M(0xc9a86c, { metalness: .8, roughness: .32 });
  const greenM = M(0x16281e, { roughness: .55 });
  const woodM = M(0x7d5a3b, { roughness: .82 });
  const ivoryM = M(0xf3ecdd, { roughness: .62 });
  const add = (g, m, x, y, z, par) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; (par || scene).add(o); return o; };
  function place(i, side = 1, dist = 6) {
    const s = stations[i]; const g = new THREE.Group();
    const x = s.p.x + s.n.x * dist * side, z = s.p.z + s.n.z * dist * side;
    g.position.set(x, ground(x, z), z);
    g.rotation.y = Math.atan2(s.t.x, s.t.z);
    scene.add(g); return g;
  }

  /* 0 · portón */
  {
    const s = { p: curve.getPointAt(.062), t: curve.getTangentAt(.062) };
    const g = new THREE.Group();
    g.position.copy(s.p).setY(ground(s.p.x, s.p.z));
    g.rotation.y = Math.atan2(s.t.x, s.t.z);
    scene.add(g);
    [-2.9, 2.9].forEach(x => {
      add(new THREE.BoxGeometry(.85, 3.45, .85), stone, x, 1.72, 0, g);
      add(new THREE.BoxGeometry(1.05, .2, 1.05), stone, x, 3.52, 0, g);
      add(new THREE.SphereGeometry(.24, 22, 14), goldM, x, 3.78, 0, g);
      add(new THREE.BoxGeometry(1.1, .18, 1.1), stone, x, .09, 0, g);
    });
    add(new THREE.BoxGeometry(6.6, .78, .26), new THREE.MeshStandardMaterial({
      map: textTex([
        { t: 'GUAU COUNTRY CLUB', f: '500 92px "Cormorant Garamond", Georgia, serif' },
        { t: 'VALLE DE BRAVO · MÉXICO', f: '400 30px Inter, sans-serif' }
      ], 1400, 210),
      roughness: .55, metalness: .05
    }), 0, 2.62, 0, g);
    add(new THREE.BoxGeometry(6.75, .07, .34), goldM, 0, 2.2, 0, g);
    add(new THREE.BoxGeometry(6.75, .07, .34), goldM, 0, 3.04, 0, g);
    [-1, 1].forEach(sd => {
      const gg = new THREE.Group(); gg.position.set(sd * 2.35, 0, 0); gg.rotation.y = -sd * 1.45; g.add(gg);
      for (let k = 0; k < 7; k++) add(new THREE.CylinderGeometry(.028, .028, 2.35), greenM, -sd * (k * .3 + .15), 1.2, 0, gg);
      add(new THREE.BoxGeometry(2.5, .06, .06), goldM, -sd * 1.25, 2.28, 0, gg);
      add(new THREE.BoxGeometry(2.5, .06, .06), greenM, -sd * 1.25, .34, 0, gg);
    });
    [-2.9, 2.9].forEach(x => { const l = new THREE.PointLight(0xffc07a, 4, 9, 2); l.position.set(x, 3.1, .7); g.add(l); });
    const lm = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffc98a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    [-2.9, 2.9].forEach(x => { const sp = new THREE.Sprite(lm); sp.scale.setScalar(2.2); sp.position.set(x, 3.1, .7); g.add(sp); });
  }
  /* 1 · adiestramiento */
  {
    const g = place(1, -1, 6.6);
    for (let k = 0; k < 3; k++) {
      const z = -3.2 + k * 3.2;
      [-1, 1].forEach(x => add(new THREE.CylinderGeometry(.06, .06, 1.15), ivoryM, x, .58, z, g));
      const bar = add(new THREE.CylinderGeometry(.045, .045, 2, 14), goldM, 0, .38 + k * .22, z, g);
      bar.rotation.z = Math.PI / 2;
    }
    for (let k = 0; k < 6; k++) add(new THREE.CylinderGeometry(.035, .035, 1.25), k % 2 ? goldM : ivoryM, -3.2, .62, -3 + k * 1.1, g);
    const tf = new THREE.Group(); tf.position.set(3.1, 0, 0); g.add(tf);
    [-.85, .85].forEach(x => add(new THREE.CylinderGeometry(.06, .06, 2.3), greenM, x, 1.15, 0, tf));
    add(new THREE.TorusGeometry(.52, .1, 12, 36), M(0x242424, { roughness: .9 }), 0, 1.35, 0, tf);
  }
  /* 2 · hospedaje */
  {
    const g = place(2, -1, 8.4);
    add(new THREE.BoxGeometry(5.2, 2.7, 3.7), M(0x8b6c4c, { roughness: .86 }), 0, 1.35, 0, g);
    const roof = new THREE.Shape(); roof.moveTo(-3.1, 0); roof.lineTo(0, 2.2); roof.lineTo(3.1, 0); roof.lineTo(-3.1, 0);
    const rg = new THREE.ExtrudeGeometry(roof, { depth: 4.6, bevelEnabled: false }); rg.translate(0, 0, -2.3);
    add(rg, greenM, 0, 2.7, 0, g);
    const win = M(0xffd9a0, { emissive: 0xffb35c, emissiveIntensity: 1.9 });
    [-1.45, 1.45].forEach(x => add(new THREE.BoxGeometry(.92, .82, .05), win, x, 1.55, 1.86, g));
    add(new THREE.BoxGeometry(.92, 1.75, .06), greenM, 0, .88, 1.87, g);
    add(new THREE.BoxGeometry(5.7, .24, 1.5), woodM, 0, .12, 2.45, g);
    const pl = new THREE.PointLight(0xffb062, 4.5, 9, 2); pl.position.set(0, 1.7, 2.7); g.add(pl);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb877, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .55 }));
    sp.scale.setScalar(4.2); sp.position.set(0, 1.7, 2.4); g.add(sp);
  }
  /* 3 · guardería */
  {
    const g = place(3, -1, 7.2);
    for (let k = 0; k < 26; k++) {
      const a = k / 26 * Math.PI * 2;
      if (a > 4.2 && a < 5.2) continue;
      const pk = add(new THREE.BoxGeometry(.12, .82, .06), ivoryM, Math.cos(a) * 3.5, .41, Math.sin(a) * 3.5, g);
      pk.rotation.y = -a;
    }
    const rail = add(new THREE.TorusGeometry(3.5, .04, 8, 72), ivoryM, 0, .66, 0, g);
    rail.rotation.x = Math.PI / 2;
    [[.6, 0, 0xc9a86c], [-1, 1, 0xb5523b], [1.2, -1.4, 0xf3ecdd], [-1.5, -1, 0xc9a86c]].forEach(([x, z, col]) =>
      add(new THREE.SphereGeometry(.22, 22, 14), M(col, { roughness: .42 }), x, .22, z, g));
    const dh = new THREE.Group(); dh.position.set(-1.2, 0, 1.6); g.add(dh);
    add(new THREE.BoxGeometry(1.4, 1, 1.2), ivoryM, 0, .5, 0, dh);
    const r1 = add(new THREE.BoxGeometry(1.1, .08, 1.45), greenM, .38, 1.26, 0, dh); r1.rotation.z = -.6;
    const r2 = add(new THREE.BoxGeometry(1.1, .08, 1.45), greenM, -.38, 1.26, 0, dh); r2.rotation.z = .6;
  }
  /* 4 · estética */
  {
    const g = place(4, -1, 6.2);
    const tub = add(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .16, clearcoat: 1, side: THREE.DoubleSide }), 0, 1.05, 0, g);
    tub.scale.set(1.6, .8, .88);
    const rim = add(new THREE.TorusGeometry(1.02, .07, 10, 56), goldM, 0, 1.05, 0, g);
    rim.rotation.x = Math.PI / 2; rim.scale.set(1.58, .88, 1);
    [[-1, -.52], [1, -.52], [-1, .52], [1, .52]].forEach(([x, z]) => add(new THREE.SphereGeometry(.1, 10, 8), goldM, x, .1, z, g));
    const bub = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .04, transmission: .65, transparent: true, opacity: .62, iridescence: 1 });
    for (let k = 0; k < 20; k++) add(new THREE.SphereGeometry(.12 + Math.random() * .19, 14, 10), bub, (Math.random() - .5) * 2.4, 1.05 + Math.random() * .38, (Math.random() - .5) * 1.1, g);
    add(new THREE.CylinderGeometry(.03, .03, 1.5), goldM, 1.55, 1.45, 0, g);
    add(new THREE.CylinderGeometry(.5, .45, .9, 24), woodM, -1.9, .45, .4, g);
  }
  /* 5 · restaurante */
  {
    const g = place(5, 1, 7.6);
    g.position.y = Math.max(g.position.y, .12);
    add(new THREE.BoxGeometry(9.2, .3, 6.2), woodM, 0, .15, 0, g);
    for (let k = 0; k < 3; k++) {
      const x = -3 + k * 3;
      add(new THREE.CylinderGeometry(.58, .58, .05, 30), ivoryM, x, 1.02, 0, g);
      add(new THREE.CylinderGeometry(.05, .05, .72), goldM, x, .66, 0, g);
      add(new THREE.CylinderGeometry(.03, .03, 2.35), goldM, x, 1.42, 0, g);
      add(new THREE.ConeGeometry(1.32, .58, 22, 1, true), M(0xf3ecdd, { side: THREE.DoubleSide }), x, 2.62, 0, g);
      [-.85, .85].forEach(z => add(new THREE.BoxGeometry(.44, .5, .44), greenM, x, .55, z, g));
    }
    const bulbM = M(0xfff0c8, { emissive: 0xffc070, emissiveIntensity: 3.4 });
    for (let k = 0; k < 24; k++) {
      const t = k / 23;
      add(new THREE.SphereGeometry(.06, 8, 6), bulbM, -4.4 + t * 8.8, 3.2 - Math.sin(t * Math.PI) * .5, 2.95, g);
    }
    [-4.4, 4.4].forEach(x => add(new THREE.CylinderGeometry(.06, .06, 3.3), woodM, x, 1.65, 2.95, g));
    const pl = new THREE.PointLight(0xffc070, 7, 12, 2); pl.position.set(0, 2.7, 2); g.add(pl);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc98a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .5 }));
    sp.scale.set(7, 3.4, 1); sp.position.set(0, 2.9, 2.6); g.add(sp);
    add(new THREE.BoxGeometry(3, 1.1, .8), greenM, 0, .86, -2.5, g);
    add(new THREE.BoxGeometry(3.1, .06, .9), goldM, 0, 1.43, -2.5, g);
  }
  /* 6 · mirador */
  {
    const g = place(6, 1, 5.6);
    [-1.7, 1.7].forEach(x => {
      add(new THREE.BoxGeometry(2, .1, .62), woodM, x, .56, 0, g);
      add(new THREE.BoxGeometry(2, .5, .08), woodM, x, .86, -.31, g);
      [-.8, .8].forEach(dx => add(new THREE.BoxGeometry(.08, .52, .62), greenM, x + dx, .27, 0, g));
    });
    [-3.2, 3.2].forEach(x => {
      add(new THREE.CylinderGeometry(.06, .09, 2.5), greenM, x, 1.25, 0, g);
      add(new THREE.BoxGeometry(.36, .46, .36), M(0xfff0c8, { emissive: 0xffb35c, emissiveIntensity: 2.2 }), x, 2.62, 0, g);
      const c = add(new THREE.ConeGeometry(.3, .24, 4), goldM, x, 2.97, 0, g); c.rotation.y = Math.PI / 4;
      const l = new THREE.PointLight(0xffb35c, 3, 7, 2); l.position.set(x, 2.6, 0); g.add(l);
    });
  }
  /* 7 · señal */
  {
    const g = place(7, 1, 3.8);
    add(new THREE.CylinderGeometry(.12, .14, 4.1, 14), woodM, 0, 2.05, 0, g);
    add(new THREE.SphereGeometry(.17, 14, 10), goldM, 0, 4.2, 0, g);
    [['CONTACTO', 0x12211a, '#d9be86', 3.3, .3], ['VALLE DE BRAVO', 0xf3ecdd, '#12211a', 2.6, -.4], ['HOLA@GUAU.CLUB', 0x12211a, '#d9be86', 1.9, .15]]
      .forEach(([t, bgc, fg, y, rot]) => {
        const tex = textTex([{ t, f: '500 72px "Cormorant Garamond", Georgia, serif' }], 820, 160, '#' + bgc.toString(16).padStart(6, '0'), fg);
        const sh = new THREE.Shape();
        sh.moveTo(0, -.25); sh.lineTo(2.1, -.25); sh.lineTo(2.4, 0); sh.lineTo(2.1, .25); sh.lineTo(0, .25);
        const geo = new THREE.ExtrudeGeometry(sh, { depth: .08, bevelEnabled: false });
        geo.translate(-.1, 0, -.04);
        const uv = geo.attributes.uv, pp = geo.attributes.position;
        for (let k = 0; k < uv.count; k++) uv.setXY(k, (pp.getX(k) + .1) / 2.5, (pp.getY(k) + .25) / .5);
        const b = add(geo, [new THREE.MeshStandardMaterial({ map: tex, roughness: .6 }), M(bgc)], 0, y, 0, g);
        b.rotation.y = rot - Math.PI / 2;
      });
  }

  window.__stage = 'props';
  setProg(.86, 'Despertando al compañero…'); await settle();

  /* --- perro --- */
  const dogRoot = new THREE.Group();
  scene.add(dogRoot);
  const dogInner = new THREE.Group();
  dogRoot.add(dogInner);
  let mixer = null, walkA = null, idleA = null, dogReady = false;
  const dogShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.5), new THREE.MeshBasicMaterial({
    map: radialTex('rgba(0,0,0,.42)', 'rgba(0,0,0,0)', 128), transparent: true, depthWrite: false, opacity: .34
  }));
  dogShadow.rotation.x = -Math.PI / 2; dogShadow.renderOrder = 2;
  scene.add(dogShadow);

  try {
    const gltf = await new GLTFLoader().loadAsync('models/german-shepherd.glb');
    const model = gltf.scene;
    const furN = furNormal(512);
    model.traverse(o => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        const old = o.material;
        o.material = new THREE.MeshPhysicalMaterial({
          map: old.map || null, color: old.color ? old.color.clone() : new THREE.Color(0xffffff),
          roughness: .82, metalness: 0, sheen: .55, sheenRoughness: .62,
          sheenColor: new THREE.Color(0xdcb98f),
          normalMap: furN, normalScale: new THREE.Vector2(.5, .5)
        });
        if (old.map) { old.map.colorSpace = THREE.SRGBColorSpace; old.map.anisotropy = 8; old.map.needsUpdate = true; }
      }
    });
    // El GLB está modelado a escala métrica real; el bounding box de bind-pose
    // está "explotado" por el rig, así que no se escala por bbox.
    model.scale.setScalar(.95);
    model.position.y = -.02;
    dogInner.add(model);
    mixer = new THREE.AnimationMixer(model);
    const find = re => gltf.animations.find(a => re.test(a.name));
    walkA = mixer.clipAction(find(/^Walk$/) || find(/Walk/) || gltf.animations[0]);
    idleA = mixer.clipAction(find(/^Idle$/) || find(/Idle/) || gltf.animations[0]);
    [walkA, idleA].forEach(a => { a.play(); a.setEffectiveWeight(0); });
    idleA.setEffectiveWeight(1);
    dogReady = true; window.__dog = true;
  } catch (e) {
    window.__dogErr = String(e && e.message || e);
  }

  /* --- partículas --- */
  const points = (n, spread, color, size, height = 12) => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = Math.random(), pt = curve.getPointAt(u), t = curve.getTangentAt(u);
      const off = (Math.random() - .5) * spread;
      p[i * 3] = pt.x + t.z * off;
      p[i * 3 + 1] = ground(pt.x, pt.z) + .4 + Math.random() * height;
      p[i * 3 + 2] = pt.z - t.x * off;
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.PointsMaterial({
      size, map: radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)', 64),
      color, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    scene.add(pts);
    return { pts, seed };
  };
  const pollen = points(LITE ? 140 : mobile ? 260 : 620, 30, 0xfff0cf, .17, 5.5);
  const flies = points(LITE ? 40 : mobile ? 90 : 190, 26, 0xffd98a, .22, 3.4);

  const birds = [];
  {
    const bm = new THREE.MeshBasicMaterial({ color: 0x2b2b28, side: THREE.DoubleSide, transparent: true, opacity: .7 });
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      const w1 = new THREE.Mesh(new THREE.PlaneGeometry(.9, .18), bm);
      const w2 = new THREE.Mesh(new THREE.PlaneGeometry(.9, .18), bm);
      w1.position.x = -.45; w2.position.x = .45;
      g.add(w1, w2);
      g.userData = { ph: Math.random() * 6.28, r: 60 + Math.random() * 90, h: 38 + Math.random() * 40, sp: .12 + Math.random() * .12, w: w1, w2 };
      scene.add(g); birds.push(g);
    }
  }

  /* --- interfaz --- */
  const card = $('#j-card'), rail = $('#j-rail'), countEl = $('#j-count'), progEl = $('#j-prog'), hintEl = $('#j-hint');
  const goStation = n => {
    const top = section.offsetTop + (section.offsetHeight - innerHeight) * ((ST[n].u - .02) / .965);
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  };
  if (rail) {
    ST.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<i></i><span>${pad(i + 1)}</span>${s.pill}`;
      b.addEventListener('click', () => goStation(i));
      rail.appendChild(b);
    });
  }
  const btnList = $('#j-list');
  btnList && btnList.addEventListener('click', () => {
    $('#lista')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    btnList.setAttribute('aria-pressed', 'true');
  });

  let active = -1;
  function setActive(i) {
    if (i === active) return;
    active = i;
    const s = ST[i];
    [...(rail ? rail.children : [])].forEach((b, k) => {
      if (k === i) { b.setAttribute('aria-current', 'step'); b.scrollIntoView({ block: 'nearest' }); }
      else b.removeAttribute('aria-current');
    });
    if (countEl) countEl.textContent = `${pad(i + 1)} / ${pad(ST.length)}`;
    if (!card) return;
    card.classList.add('swap');
    setTimeout(() => {
      card.innerHTML = `
        <span class="j-num">Estación ${pad(i + 1)}</span>
        <h2>${s.t}</h2>
        <p class="j-lead">${s.lead}</p>
        <span class="j-rule"></span>
        <p class="j-meta">${s.meta}</p>
        <div class="j-act">
          <a class="btn btn-gold sm" href="${s.href}">${s.cta}</a>
          <button class="j-more" type="button" data-next="${(i + 1) % ST.length}">Siguiente estación →</button>
        </div>`;
      card.classList.remove('swap');
      card.querySelector('.j-more')?.addEventListener('click', ev => goStation(+ev.currentTarget.dataset.next));
    }, QA ? 0 : 240);
  }

  /* --- audio --- */
  let actx = null, master = null, chirpTimer = null;
  window.GuauAudio = (on) => {
    if (on && !actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination);
      const len = actx.sampleRate * 4, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
      let l = 0;
      for (let i = 0; i < len; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.2; }
      const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
      const g = actx.createGain(); g.gain.value = .55;
      src.connect(lp).connect(g).connect(master); src.start();
      const chirp = () => {
        if (!actx) return;
        const t = actx.currentTime, o = actx.createOscillator(), gg = actx.createGain();
        o.type = 'sine';
        const f0 = 2300 + Math.random() * 2000;
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f0 * 1.4, t + .07);
        o.frequency.exponentialRampToValueAtTime(f0 * .85, t + .17);
        gg.gain.setValueAtTime(0, t);
        gg.gain.linearRampToValueAtTime(.045, t + .02);
        gg.gain.linearRampToValueAtTime(0, t + .2);
        o.connect(gg).connect(master); o.start(t); o.stop(t + .22);
        chirpTimer = setTimeout(chirp, (Math.random() < .4 ? 260 : 1700 + Math.random() * 4200));
      };
      chirp();
    }
    if (actx) {
      actx.resume();
      master.gain.setTargetAtTime(on ? .55 : 0, actx.currentTime, .5);
      if (!on && chirpTimer) { clearTimeout(chirpTimer); chirpTimer = null; }
    }
  };

  /* --- cámara por estaciones --- */
  const CAMK = [
    { u: 0.00, back: 6.4, h: 2.3, side: 1.5, ahead: 2.6, lookY: .85, fov: 42 },
    { u: 0.09, back: 3.9, h: 1.55, side: 1.3, ahead: 1.7, lookY: .52, fov: 39 },
    { u: 0.30, back: 3.7, h: 1.5, side: 1.6, ahead: 1.6, lookY: .48, fov: 36 },
    { u: 0.50, back: 3.8, h: 1.5, side: .45, ahead: 1.6, lookY: .48, fov: 36 },
    { u: 0.66, back: 3.9, h: 1.55, side: -1.6, ahead: 1.7, lookY: .5, fov: 36 },
    { u: 0.82, back: 6.0, h: 2.2, side: -1.9, ahead: 3.2, lookY: .7, fov: 40 },
    { u: 1.00, back: 9.0, h: 3.8, side: -1.2, ahead: 6.0, lookY: .95, fov: 45 },
  ];
  function shot(u) {
    let a = CAMK[0], b = CAMK[CAMK.length - 1];
    for (let i = 0; i < CAMK.length - 1; i++) if (u >= CAMK[i].u && u <= CAMK[i + 1].u) { a = CAMK[i]; b = CAMK[i + 1]; break; }
    const k = b.u === a.u ? 0 : smooth(a.u, b.u, u);
    const o = {};
    for (const key of ['back', 'h', 'side', 'ahead', 'lookY', 'fov']) {
      let va = a[key], vb = b[key];
      if (mobile && (key === 'back' || key === 'h')) { va = Math.min(va, 5.4); vb = Math.min(vb, 5.4); }
      if (mobile && key === 'side') { va = Math.max(-1.7, Math.min(1.7, va)); vb = Math.max(-1.7, Math.min(1.7, vb)); }
      o[key] = va + (vb - va) * k;
    }
    return o;
  }

  /* --- bucle --- */
  let uS = ST[0].u, lastP = new THREE.Vector3(), speed = 0, phase = 0, first = true;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(),
    tmp = new THREE.Vector3(), look = new THREE.Vector3(), clock = new THREE.Clock();
  let visible = true, needsRender = true, prevP = -1;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { rootMargin: '250px' }).observe(section);

  function progress() {
    const r = section.getBoundingClientRect();
    const total = Math.max(1, section.offsetHeight - innerHeight);
    return clamp(-r.top / total);
  }
  function seekFromScroll() {
    const p = progress();
    const u = .02 + p * .965;
    if (first || QA) uS = u;
    else uS += (u - uS) * .18;
    if (p !== prevP) { needsRender = true; prevP = p; }
    if (progEl) progEl.style.width = (p * 100).toFixed(2) + '%';
    if (hintEl) hintEl.style.opacity = p > .015 ? 0 : 1;
  }

  function frame() {
    requestAnimationFrame(frame);
    try { tick(); } catch (e) { if (!window.__frameErr) window.__frameErr = String(e && e.stack || e); }
  }
  let frameN = 0;
  function tick() {
    const dt = Math.min(clock.getDelta(), .05), T = clock.elapsedTime;
    seekFromScroll();
    if (!visible) return;

    windU.value = T;
    skyMat.uniforms.t.value = T;

    const p = curve.getPointAt(uS), t = curve.getTangentAt(uS);
    const gy = meshGround(p.x, p.z);
    const moved = p.distanceTo(lastP); lastP.copy(p);
    const spd = clamp(moved / Math.max(dt, .001) / 6);
    speed += (spd - speed) * Math.min(1, dt * 5);
    phase += moved * 6.4;
    if (QA) { speed = .5; phase = uS * 620; }

    dogRoot.position.set(p.x, gy, p.z);
    dogRoot.rotation.y = Math.atan2(t.x, t.z);
    dogRoot.rotation.z = Math.sin(phase) * .012 * speed;
    if (dogReady && mixer) {
      const w = clamp(speed * 2.6);
      walkA.setEffectiveWeight(w);
      idleA.setEffectiveWeight(1 - w);
      walkA.timeScale = .55 + w * .8;
      mixer.update(QA ? .016 : dt);
    }
    dogShadow.position.set(p.x, gy + .015, p.z);
    dogShadow.scale.setScalar(1 + speed * .1);
    dogShadow.material.opacity = .34 - speed * .1;

    const side = tmp.set(t.z, 0, -t.x);
    const cam = shot(uS);
    const want = new THREE.Vector3().copy(p).addScaledVector(t, -cam.back).addScaledVector(side, cam.side);
    want.y = gy + cam.h;
    look.copy(p).addScaledVector(t, cam.ahead).addScaledVector(side, cam.side * -.42);
    look.y = gy + cam.lookY;
    const fovWant = mobile ? cam.fov + 10 : cam.fov;
    if (first || QA) { camPos.copy(want); camLook.copy(look); }
    else { camPos.lerp(want, Math.min(1, dt * 2.2)); camLook.lerp(look, Math.min(1, dt * 2.8)); }
    camera.position.copy(camPos);
    if (!QA) {
      camera.position.y += Math.sin(T * .7) * .012;
      camera.position.x += Math.sin(T * .43) * .01;
    }
    camera.fov += (fovWant - camera.fov) * Math.min(1, dt * 2);
    camera.updateProjectionMatrix();
    camera.lookAt(camLook);
    first = false;

    sun.position.copy(p).addScaledVector(sunDir, 110);
    sun.target.position.copy(p);
    sun.target.updateMatrixWorld();
    sunGlow.position.copy(camera.position).addScaledVector(sunDir, 620);

    wnorm.offset.set(T * .0035, T * .005);
    boats.forEach(b => {
      b.position.y = -1.1 + Math.sin(T * .8 + b.userData.ph) * .07;
      b.rotation.z = Math.sin(T * .6 + b.userData.ph) * .05;
    });

    const pa = pollen.pts.geometry.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const y = pa.getY(i) + dt * (.3 + pollen.seed[i] * .45);
      const gx = pa.getX(i), gz = pa.getZ(i);
      pa.setY(i, y > ground(gx, gz) + 7 ? ground(gx, gz) + .5 : y);
      pa.setX(i, gx + Math.sin(T * .6 + pollen.seed[i] * 9) * dt * .16);
    }
    pa.needsUpdate = true;
    flies.pts.material.opacity = .22 + Math.sin(T * .8) * .12;

    birds.forEach(b => {
      const d = b.userData;
      const a = T * d.sp + d.ph;
      b.position.set(Math.cos(a) * d.r + 10, d.h + Math.sin(a * 2) * 2, lakeZ + 40 + Math.sin(a) * 20);
      b.rotation.y = -a + Math.PI / 2;
      const f = Math.sin(T * 7 + d.ph) * .5;
      d.w.rotation.z = f; d.w2.rotation.z = -f;
    });

    let bi = 0, bd = 9;
    ST.forEach((s, i) => { const d = Math.abs(s.u - uS); if (d < bd) { bd = d; bi = i; } });
    setActive(bi);

    if (!QA || needsRender) { renderer.render(scene, camera); needsRender = false; }
  }

  addEventListener('resize', () => { size(); needsRender = true; });
  new ResizeObserver(() => { size(); needsRender = true; }).observe(section);

  setProg(1, 'Listo');
  $('#j-loader')?.classList.add('done');
  window.__stage = 'ready';
  window.__grab = () => { renderer.render(scene, camera); return canvasEl.toDataURL('image/png'); };
  window.__dbg = () => {
    const b = new THREE.Box3().setFromObject(dogRoot);
    const nd = new THREE.Vector3(dogRoot.position.x, dogRoot.position.y + .45, dogRoot.position.z).project(camera);
    return JSON.stringify({
      dog: dogRoot.position.toArray().map(v => +v.toFixed(2)),
      box: { min: b.min.toArray().map(v => +v.toFixed(2)), max: b.max.toArray().map(v => +v.toFixed(2)) },
      cam: camera.position.toArray().map(v => +v.toFixed(2)),
      ndc: [+nd.x.toFixed(2), +nd.y.toFixed(2), +nd.z.toFixed(2)],
      dogReady, u: +uS.toFixed(3), errs: window.__errs || []
    });
  };

  if (Q.has('t')) uS = .02 + clamp(parseFloat(Q.get('t')) || 0) * .965;
  if (QA) document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  window.__setActive = setActive;
  setActive(0);
  frame();
}
