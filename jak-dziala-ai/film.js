// „Jak działa AI?” — 10 s, One-line Drawing. Cały film to jedna tablica punktów: pióro nie odrywa się od papieru.
import { clamp, lerp, seg, ss, eo, mulberry, vnoise, monotone, TAU } from '/core/lib.js';

const W = innerWidth, H = innerHeight, SX = W / 1920;           // projekt w układzie 1920×1080
const DUR = 10.0;
const PAPER = [244, 239, 228], INK = [29, 26, 23], ACCENT = [184, 67, 47];
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');

// ---------- geometria (świat = 1920×1080) ----------
const cat = (cx, cy, R, eL = 0, eR = 0) => {
  // od podbródka w prawo, zgodnie z ruchem wskazówek zegara; kończy w podbródku, jadąc w prawo
  const p = (x, y) => `${(cx + x * R).toFixed(1)} ${(cy + y * R).toFixed(1)}`;
  return [
    `C ${p(.6, 1)} ${p(1, .55)} ${p(1, .05)}`,
    `C ${p(1, -.3)} ${p(.85, -.5)} ${p(.78, -.62)}`,
    `L ${(cx + .72 * R + eR).toFixed(1)} ${(cy - 1.32 * R).toFixed(1)}`,
    `L ${p(.28, -.86)}`,
    `Q ${p(0, -.95)} ${p(-.28, -.86)}`,
    `L ${(cx - .72 * R + eL).toFixed(1)} ${(cy - 1.32 * R).toFixed(1)}`,
    `L ${p(-.78, -.62)}`,
    `C ${p(-.85, -.5)} ${p(-1, -.3)} ${p(-1, .05)}`,
    `C ${p(-1, .55)} ${p(-.6, 1)} ${p(0, 1)}`,
  ].join(' ');
};
const C1 = [260, 470, 62], C2 = [432, 482, 54], C3 = [604, 462, 70], BIG = [1490, 470, 150];
const chin = c => [c[0], c[1] + c[2]];
const N = { I1: [790, 360], I2: [790, 500], I3: [790, 640], H1: [960, 420], H2: [960, 590], O: [1120, 500] };
const swag = (a, b, d = 42) => `C ${a[0] + 40} ${a[1] + d} ${b[0] - 40} ${b[1] + d} ${b[0]} ${b[1]}`;
const L = k => `L ${N[k][0]} ${N[k][1]}`;
const NET = ['H2', 'I1', 'H1', 'I3', 'H2', 'O', 'H1', 'I2', 'H1', 'O'];   // obwód Eulera z I2 + powtórzenie I2→H1→O (niewidoczne)

// rozdziały: okno czasowe, kawałki ścieżki (z zatrzymaniem na końcu), „głos” linii
const START = [-520, 660];
const CH = [
  { id: 'entry', t0: -0.75, t1: 0.35, base: 5.2, pieces: [{ d: `C -300 690 ${chin(C1)[0] - 60} ${chin(C1)[1] + 50} ${chin(C1)[0]} ${chin(C1)[1]}` }] },
  { id: 'cat1', t0: 0.35, t1: 1.15, base: 5.0, pieces: [{ d: cat(...C1, -6, 4) }] },
  { id: 'c12', t0: 1.15, t1: 1.36, base: 5.0, pieces: [{ d: swag(chin(C1), chin(C2)) }] },
  { id: 'cat2', t0: 1.36, t1: 2.06, base: 5.0, pieces: [{ d: cat(...C2, 5, -3) }] },
  { id: 'c23', t0: 2.06, t1: 2.27, base: 5.0, pieces: [{ d: swag(chin(C2), chin(C3)) }] },
  { id: 'cat3', t0: 2.27, t1: 3.12, base: 5.0, pieces: [{ d: cat(...C3, -2, -8) }] },
  { id: 'tonet', t0: 3.12, t1: 3.5, base: 4.8, pieces: [{ d: `C ${chin(C3)[0] + 50} ${chin(C3)[1] + 45} ${N.I2[0] - 80} ${N.I2[1] + 30} ${N.I2[0]} ${N.I2[1]}`, hold: .14, node: 'I2' }] },
  { id: 'net', t0: 3.5, t1: 6.32, base: 4.4, pieces: NET.map((k, i) => ({ d: L(k), hold: i >= 7 ? .03 : .1, node: i >= 7 ? null : k })) },
  { id: 'tocat', t0: 6.32, t1: 6.78, base: 5.0, pieces: [{ d: `C 1210 520 1380 690 ${chin(BIG)[0]} ${chin(BIG)[1]}` }] },
  { id: 'big', t0: 6.78, t1: 8.86, base: 6.2, accent: true, pieces: [{ d: cat(...BIG, -10, 12) }] },
  { id: 'tail', t0: 8.86, t1: 9.3, base: 5.6, pieces: [{ d: `C 1550 660 1585 702 1606 728`, hold: 0 }] },
];
const T_STOP = 9.3;

// próbkowanie po długości łuku (SVG w przeglądarce)
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.style.position = 'absolute'; svg.style.width = svg.style.height = '0'; document.body.appendChild(svg);
const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path'); svg.appendChild(pathEl);
const STEP = 2;
const X = [START[0]], Y = [START[1]], T = [CH[0].t0], HOLD = [0], BASE = [CH[0].base], ACC = [0], CHI = [0];
const MARKS = [];                                    // zdarzenia dla dźwięku: węzły, koniec kota, czubek ucha
let cur = START.slice();
CH.forEach((ch, ci) => {
  const first = X.length;                            // indeks pierwszego punktu tego rozdziału
  const holdsAt = [];                                // [indeks, czas]
  for (const pc of ch.pieces) {
    pathEl.setAttribute('d', `M ${cur[0]} ${cur[1]} ${pc.d}`);
    const len = pathEl.getTotalLength(), n = Math.max(2, Math.ceil(len / STEP));
    for (let i = 1; i <= n; i++) {
      const q = pathEl.getPointAtLength(len * i / n);
      X.push(q.x); Y.push(q.y); HOLD.push(0); BASE.push(ch.base); ACC.push(ch.accent ? 1 : 0); CHI.push(ci);
    }
    cur = [X[X.length - 1], Y[Y.length - 1]];
    if (pc.hold) holdsAt.push([X.length - 1, pc.hold, pc.node]);
  }
  // czas: okno rozdziału, waga punktu = ds·(1 + K·zakręt), zakręty wygładzone
  const idx = []; for (let i = first; i < X.length; i++) idx.push(i);
  const turn = idx.map(i => {
    if (i < 2 || i + 1 >= X.length) return 0;
    const a = Math.atan2(Y[i] - Y[i - 1], X[i] - X[i - 1]), b = Math.atan2(Y[i + 1] - Y[i], X[i + 1] - X[i]);
    let d = Math.abs(b - a); if (d > Math.PI) d = TAU - d; return d;
  });
  const sm = turn.map((_, k) => { let s = 0, c = 0; for (let j = -6; j <= 6; j++) { const v = turn[k + j]; if (v !== undefined) { s += v * (1 - Math.abs(j) / 7); c += 1 - Math.abs(j) / 7; } } return s / c; });
  const wts = idx.map((i, k) => Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]) * (1 + 9 * sm[k]));
  const holdSum = holdsAt.reduce((s, h) => s + h[1], 0);
  const avail = ch.t1 - ch.t0 - holdSum, wsum = wts.reduce((a, b) => a + b, 0);
  let t = ch.t0;
  idx.forEach((i, k) => {
    t += wts[k] / wsum * avail; T[i] = t;
    const h = holdsAt.find(hh => hh[0] === i);
    if (h) { HOLD[i] = h[1]; if (h[2]) MARKS.push({ t, type: 'node', node: h[2] }); t += h[1]; }
  });
  if (ch.id.startsWith('cat')) MARKS.push({ t: ch.t1, type: 'cat', n: +ch.id[3] });
  if (ch.id === 'big') {
    // czubek prawego ucha = najwyższa nuta; pozostałe znaki frazy według ułamka łuku
    let best = first, bd = 1e9;
    const ear = [BIG[0] + .72 * BIG[2] + 12, BIG[1] - 1.32 * BIG[2]];
    for (const i of idx) { const d = Math.hypot(X[i] - ear[0], Y[i] - ear[1]); if (d < bd) { bd = d; best = i; } }
    MARKS.push({ t: T[best], type: 'ear' });
    [0, .14, .52, .64, .82, 1].forEach((f, k) => MARKS.push({ t: T[idx[Math.min(idx.length - 1, Math.round(f * (idx.length - 1)))]], type: 'phrase', k }));
  }
});
MARKS.push({ t: T_STOP, type: 'stop' });
const NPT = X.length;

// akcent: płynne przejście na odcinku ~40 jednostek na obu końcach
for (let i = 0; i < NPT; i++) if (CH[CHI[i]].accent) ACC[i] = 1;
const ACCS = ACC.map((_, i) => { let s = 0, c = 0; for (let j = -20; j <= 20; j++) { const v = ACC[i + j]; if (v !== undefined) { s += v; c++; } } return s / c; });
// grubość „głosu” też przechodzi płynnie
const BASES = BASE.map((_, i) => { let s = 0, c = 0; for (let j = -15; j <= 15; j++) { const v = BASE[i + j]; if (v !== undefined) { s += v; c++; } } return s / c; });

// prędkość ruchu (bez zatrzymań) → nacisk
const V = new Float32Array(NPT);
for (let i = 1; i < NPT; i++) {
  const ds = Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]);
  const dt = Math.max(1e-4, T[i] - T[i - 1] - HOLD[i - 1]);
  V[i] = ds / dt;
}
V[0] = V[1];
const VS = Array.from(V, (_, i) => { let s = 0, c = 0; for (let j = -8; j <= 8; j++) { const v = V[i + j]; if (v !== undefined) { s += v; c++; } } return s / c; });
const PRESS = VS.map(v => 0.66 + 0.8 * Math.exp(-v / 300));

// pozycja stalówki w czasie t
function nibIndex(t) {
  if (t <= T[0]) return 0;
  if (t >= T[NPT - 1]) return NPT - 1;
  let lo = 0, hi = NPT - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= t) lo = m; else hi = m; }
  return lo;
}
function nib(t) {
  const i = nibIndex(t);
  if (i >= NPT - 1) return { i, f: 0, x: X[NPT - 1], y: Y[NPT - 1], v: 0 };
  const md = T[i + 1] - T[i] - HOLD[i];
  const f = clamp((t - T[i] - HOLD[i]) / Math.max(1e-4, md));
  const moving = t >= T[i] + HOLD[i];
  return { i, f, x: lerp(X[i], X[i + 1], f), y: lerp(Y[i], Y[i + 1], f), v: moving ? VS[i + 1] : 0 };
}

// ---------- kamera: kompozycja + podążanie za stalówką ----------
const KEYS = [ // t, cx, cy, zoom, follow, roll(°)
  [-1, 300, 470, 1.5, .45, 0], [0, 330, 472, 1.5, .45, 0], [3.0, 470, 480, 1.42, .4, 0], [3.7, 820, 500, 1.3, .3, -.8],
  [6.0, 975, 500, 1.3, .3, -.4], [6.9, 1380, 470, 1.2, .25, .6], [8.7, 1460, 468, 1.15, .2, .3],
  [9.45, 860, 486, .98, 0, 0], [10.5, 850, 486, .95, 0, 0],
];
const kf = c => monotone(KEYS.map(k => [k[0], k[c]]));
const KCX = kf(1), KCY = kf(2), KZ = kf(3), KF = kf(4), KR = kf(5);
function camera(t) {
  let fx = 0, fy = 0, n = 0;
  for (let k = 0; k <= 10; k++) { const p = nib(t - .55 + .95 * k / 10); fx += p.x; fy += p.y; n++; }
  fx /= n; fy /= n;
  const f = clamp(KF(t)), z = KZ(t);
  let cx = lerp(KCX(t), fx, f), cy = lerp(KCY(t), fy, f);
  if (t > .6 && t < T_STOP) {               // miękkie ograniczenie: stalówka w środkowych ~70 % kadru
    const p = nib(t), mx = .35 * 1920 / z, my = .35 * 1080 / z;
    const dx = p.x - cx, dy = p.y - cy;
    if (Math.abs(dx) > mx) cx += (Math.abs(dx) - mx) * Math.sign(dx);
    if (Math.abs(dy) > my) cy += (Math.abs(dy) - my) * Math.sign(dy);
  }
  return { cx, cy, z, roll: KR(t) * Math.PI / 180 };
}
function toScreen(cam, x, y) {
  const dx = (x - cam.cx) * cam.z, dy = (y - cam.cy) * cam.z, c = Math.cos(cam.roll), s = Math.sin(cam.roll);
  return [(960 + dx * c - dy * s) * SX, (540 + dx * s + dy * c) * SX];
}
function applyCam(g, cam) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(960 * SX, 540 * SX); g.rotate(cam.roll); g.scale(cam.z * SX, cam.z * SX); g.translate(-cam.cx, -cam.cy);
}

// ---------- papier (zakotwiczony w świecie) ----------
const PX0 = -900, PY0 = -400, PW = 3600, PH = 1900, PS = .5;   // tekstura w połowie rozdzielczości świata
const paper = document.createElement('canvas'); paper.width = PW * PS; paper.height = PH * PS;
{
  const g = paper.getContext('2d'), img = g.createImageData(paper.width, paper.height), d = img.data;
  const rnd = mulberry(1234);
  const n2 = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return lerp(lerp(h(ix, iy), h(ix + 1, iy), u), lerp(h(ix, iy + 1), h(ix + 1, iy + 1), u), v); };
  for (let y = 0; y < paper.height; y++) for (let x = 0; x < paper.width; x++) {
    const wx = x / PS, wy = y / PS;
    const m = (n2(wx / 260, wy / 260) - .5) * 7 + (n2(wx / 70, wy / 70) - .5) * 3.5 + (rnd() - .5) * 2.2;
    const k = (y * paper.width + x) * 4;
    d[k] = PAPER[0] + m; d[k + 1] = PAPER[1] + m * .95; d[k + 2] = PAPER[2] + m * .85; d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.lineCap = 'round';
  for (let i = 0; i < 2600; i++) {               // długie włókna
    const x = rnd() * paper.width, y = rnd() * paper.height, a = rnd() * TAU, l = (14 + rnd() * 40) * PS;
    g.strokeStyle = rnd() < .5 ? 'rgba(120,100,70,0.07)' : 'rgba(255,255,250,0.10)'; g.lineWidth = .6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .5) * l * .5, y + Math.sin(a + .5) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
}
// ziarno papieru na tuszu przy zbliżeniu
const tooth = document.createElement('canvas'); tooth.width = 512; tooth.height = 512;
{
  const g = tooth.getContext('2d'), rnd = mulberry(99);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(244,239,228,${.25 + rnd() * .35})`; g.fillRect(rnd() * 512, rnd() * 512, .8 + rnd() * 1.2, .8 + rnd() * 1.2); }
}
const toothPat = ctx.createPattern(tooth, 'repeat');

// ---------- tusz ----------
const bleed = document.createElement('canvas'); bleed.width = W; bleed.height = H;
const bctx = bleed.getContext('2d');
const mix = (a, b, f) => `rgb(${Math.round(lerp(a[0], b[0], f))},${Math.round(lerp(a[1], b[1], f))},${Math.round(lerp(a[2], b[2], f))})`;
const LEVELS = 8;

function ribbon(nb, wscale, cam) {
  // zwraca Path2D na poziom koloru: czworokąty segmentów + koła w przegubach, wszystkie zgodnie z ruchem wskazówek
  const paths = Array.from({ length: LEVELS + 1 }, () => new Path2D());
  const wz = Math.max(cam.z, 1.1) / cam.z;          // minimalna grubość przy odjeździe
  const last = nb.i, pts = [];
  for (let i = 0; i <= last; i++) pts.push([X[i], Y[i], i]);
  if (nb.i < NPT - 1 && nb.f > 0) pts.push([nb.x, nb.y, nb.i + 1]);
  const w = pts.map(([, , i]) => BASES[i] * PRESS[i] * (1 + .16 * (vnoise(i * .045) - .5)) * wscale * wz);
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1], [x1, y1, i1] = pts[k];
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const a = w[k - 1] / 2, b = w[k] / 2;
    const lvl = Math.round(ACCS[i1] * LEVELS), p = paths[lvl];
    let q = [[x0 + nx * a, y0 + ny * a], [x1 + nx * b, y1 + ny * b], [x1 - nx * b, y1 - ny * b], [x0 - nx * a, y0 - ny * a]];
    const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
    if (area < 0) q = q.reverse();
    p.moveTo(q[0][0], q[0][1]); for (let j = 1; j < 4; j++) p.lineTo(q[j][0], q[j][1]); p.closePath();
    if (k % 2 === 0 || k === pts.length - 1) { p.moveTo(x1 + b, y1); p.arc(x1, y1, b, 0, TAU, false); }
  }
  return paths;
}
function pools(t, wscale) {
  // kałuże tuszu tam, gdzie pióro stało (węzły sieci)
  const out = [];
  for (let i = 0; i < NPT; i++) if (HOLD[i] > 0 && t >= T[i]) {
    const g = eo(clamp((t - T[i]) / HOLD[i]));
    out.push([X[i], Y[i], BASES[i] * wscale * (.62 + .55 * g), ACCS[i]]);
  }
  return out;
}
function blot(g, t, cam, color) {
  if (t < T_STOP) return;
  const k = eo(seg(t, T_STOP, T_STOP + .7)), r = 3 + 8.5 * k, x = X[NPT - 1], y = Y[NPT - 1];
  const cy = y + r * .85;                            // brzuch kropli opada w dół, czubek przy stalówce
  const p = new Path2D();
  const a = Math.asin(clamp(r / Math.max(r * .85 + 2.5, r + .01)));
  p.moveTo(x, y - 2.5);
  p.lineTo(x + Math.cos(-Math.PI / 2 + a) * r, cy + Math.sin(-Math.PI / 2 + a) * r);
  p.arc(x, cy, r, -Math.PI / 2 + a, Math.PI * 1.5 - a, false);
  p.closePath();
  g.fillStyle = color; g.fill(p);
  g.strokeStyle = 'rgba(10,8,6,0.55)'; g.lineWidth = .9; g.beginPath(); g.arc(x, cy, r - .3, .15 * Math.PI, .85 * Math.PI); g.stroke();
}

// ---------- napisy (wpisywane jak linia) ----------
const SUBS = [
  { t0: .2, t1: 3.35, text: 'AI ogląda wiele przykładów' },
  { t0: 3.45, t1: 6.6, text: 'i szuka w nich wzorców.' },
  { t0: 6.7, t1: 9.95, text: 'Potem rozpoznaje coś nowego.' },
];
const FONT = `500 ${Math.round(68 * SX)}px Caveat`;
function subBox(s) { ctx.font = FONT; const w = ctx.measureText(s.text).width; const x = W / 2 - w / 2, y = 975 * SX; return { x0: x, y0: y - 56 * SX, x1: x + w, y1: y + 18 * SX, y, w }; }
function drawSubs(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const s of SUBS) {
    if (t < s.t0 || t > s.t1) continue;
    const b = subBox(s), wr = .2 + .017 * s.text.length;
    const prog = clamp((t - s.t0) / wr), fade = 1 - seg(t, s.t1 - .45, s.t1);
    ctx.save();
    ctx.beginPath(); ctx.rect(b.x0 - 30, b.y0 - 30, (b.w + 60) * prog + 1, b.y1 - b.y0 + 60); ctx.clip();
    ctx.font = FONT; ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = fade;
    ctx.shadowColor = 'rgba(244,239,228,1)'; ctx.shadowBlur = 22 * SX;
    ctx.strokeStyle = 'rgba(244,239,228,0.95)'; ctx.lineWidth = 18 * SX; ctx.lineJoin = 'round';
    ctx.strokeText(s.text, b.x0, b.y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(${INK.join(',')},0.84)`; ctx.fillText(s.text, b.x0, b.y);
    ctx.restore();
  }
}

// ---------- cień pióra ----------
function penShadow(t, cam) {
  const nb = nib(Math.min(t, T_STOP)), [sx, sy] = toScreen(cam, nb.x, nb.y);
  const lift = ss(seg(t, T_STOP + .25, DUR));        // pióro unosi się na końcu
  const off = 4 + 70 * lift, al = .2 * (1 - .75 * lift);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = `blur(${(9 + 18 * lift) * SX}px)`;
  ctx.fillStyle = `rgba(40,30,20,${al})`;
  const bx = sx + off * SX, by = sy + off * .5 * SX;
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 330 * SX, by - 150 * SX); ctx.lineTo(bx + 352 * SX, by - 112 * SX); ctx.closePath(); ctx.fill();
  ctx.filter = 'none';
  if (lift < .3) { ctx.fillStyle = `rgba(20,16,12,${.45 * (1 - lift / .3)})`; ctx.beginPath(); ctx.arc(sx, sy, 1.6 * SX, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ---------- klatka ----------
function render(t) {
  const cam = camera(t), nb = nib(Math.min(t, T_STOP));
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgb(${PAPER.join(',')})`; ctx.fillRect(0, 0, W, H);
  applyCam(ctx, cam); ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(paper, PX0, PY0, PW, PH);

  // rozlanie tuszu: ta sama wstęga, szersza, rozmyta, ~20 %
  const wide = ribbon(nb, 1.45, cam);
  bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, W, H); applyCam(bctx, cam);
  wide.forEach((p, l) => { bctx.fillStyle = mix(INK, ACCENT, l / LEVELS); bctx.fill(p); });
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = .2; ctx.filter = `blur(${2.4 * SX * cam.z}px)`; ctx.drawImage(bleed, 0, 0); ctx.restore();
  applyCam(ctx, cam);

  const rib = ribbon(nb, 1, cam);
  rib.forEach((p, l) => { ctx.fillStyle = mix(INK, ACCENT, l / LEVELS); ctx.fill(p); });
  for (const [x, y, r, a] of pools(t, 1)) { ctx.fillStyle = mix(INK, ACCENT, a); ctx.beginPath(); ctx.arc(x, y + r * .12, r, 0, TAU); ctx.fill(); }
  blot(ctx, t, cam, mix(INK, ACCENT, 0));

  // ząbki papieru na tuszu przy zbliżeniu
  if (cam.z > 1.05) {
    ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = clamp((cam.z - 1.05) * 2.5);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = toothPat; ctx.fillRect(0, 0, W, H); ctx.restore();
    // source-atop dotyka też papieru, który jest nieprzezroczysty, więc kropki są bardzo słabe i jasne — działa jak włókna
  }

  penShadow(t, cam);

  // winieta
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05);
  vg.addColorStop(0, 'rgba(70,50,30,0)'); vg.addColorStop(1, 'rgba(70,50,30,0.13)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

  drawSubs(t);
}

// ---------- zdarzenia dla dźwięku ----------
const EV = MARKS.filter(m => m.t >= 0 && m.t <= DUR).map(m => ({ ...m, t: +m.t.toFixed(4) }));
for (let t = 0; t <= DUR + 1e-9; t += 1 / 100) {
  const tt = +t.toFixed(3), cam = camera(tt), p = nib(Math.min(tt, T_STOP)), [sx] = toScreen(cam, p.x, p.y);
  EV.push({ t: tt, type: 'pen', v: tt < T_STOP ? +p.v.toFixed(1) : 0, pan: +clamp(sx / W * 2 - 1, -1, 1).toFixed(3), acc: +ACCS[p.i].toFixed(2) });
}

window.DUR = DUR;
window.EV = EV;
window.render = render;
window.TEXTS = t => SUBS.filter(s => t >= s.t0 && t <= s.t1).map((s, k) => { const b = subBox(s); return { id: 'sub' + SUBS.indexOf(s), text: s.text, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 }; });
window.__debug = { NPT, MARKS, T_STOP, total: T[NPT - 1] };
document.fonts.load(FONT, 'ąęśćłżóźń AI').then(() => document.fonts.ready).then(() => { render(0); window.READY = true; });
