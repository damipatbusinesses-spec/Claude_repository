"""Dźwięk filmu „Jak działa AI?”: pióro po papierze (z prędkości stalówki) + solowa harfa pisana pod rysunek → out/mix.wav"""
import json, os, sys
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ['LIB']
sys.path.insert(0, LIB)
from core.audio import sfx as S
from core.audio import pluck as P

SR = S.SR
data = json.load(open(os.path.join(HERE, 'events.json')))
DUR, EV = data['dur'], data['ev']
n = int(round(DUR * SR)) + SR // 2
pen_bus = np.zeros((n, 2), np.float32)
mus_bus = np.zeros((n, 2), np.float32)
rng = np.random.default_rng(5)

# ---------- pióro: szum pasmowy, jaśniejszy przy szybkiej kresce, amplituda ∝ √prędkość, panorama za stalówką ----------
pen = sorted([e for e in EV if e['type'] == 'pen'], key=lambda e: e['t'])
pt = np.array([e['t'] for e in pen]); pv = np.array([e['v'] for e in pen]); pp = np.array([e['pan'] for e in pen])
tt = np.arange(n) / SR
v = np.interp(tt, pt, pv, right=0.0); pan = np.interp(tt, pt, pp)
amp = np.sqrt(np.clip(v, 0, None) / 600.0)
bright = np.clip(v / 1000.0, 0, 1)
base = rng.standard_normal(n).astype(np.float32)
dull, hi = S.bp(base, 500, 2200), S.bp(base, 2200, 7500)
scratch = (dull * (1 - .6 * bright) + hi * (.35 + .9 * bright)) * amp
# włókna papieru: krótkie trzaski, gęstość ∝ prędkość
ticks = np.zeros(n, np.float32)
lam = v / 45.0 / SR
for i in np.nonzero(rng.random(n) < lam)[0]:
    k = min(n - i, 96); ticks[i:i + k] += rng.standard_normal(k) * np.exp(-np.arange(k) / 18) * (.6 + .4 * rng.random())
ticks = S.hp(ticks, 2500)
mono = (scratch * .055 + ticks * .05).astype(np.float32)
l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
pen_bus[:, 0] += mono * l * 1.414; pen_bus[:, 1] += mono * r * 1.414

# mokre pęcznienie: plamki w węzłach (bardzo ciche) i kleks na końcu
def swell(d, v):
    x = S.lp(S.noise(d), 420) * np.sin(np.linspace(0, np.pi, int(round(d * SR)))) ** 1.5
    return (S.norm(x, .25) * v).astype(np.float32)
for e in EV:
    if e['type'] == 'node': S.add(pen_bus, swell(.18, .25), e['t'], 1.0, 0)
    if e['type'] == 'stop': S.add(pen_bus, swell(.7, .8), e['t'], 1.0, .25)

# ---------- harfa: jedna linia melodyczna ----------
def note(m, t, dur=None, vel=.7, pan=0.0, gain=1.0):
    S.add(mus_bus, P.pluck('harp', m, dur, vel), t, gain, pan)

cats = {e['n']: e['t'] for e in EV if e['type'] == 'cat'}
for k, m in zip((1, 2, 3), (72, 74, 76)):                 # C5 D5 E5: każdy przykład o krok wyżej
    if k in cats: note(m, cats[k] - .04, None, .62, -.35 + .15 * k)
penta = [67, 69, 72, 74, 76, 74, 72]                       # węzły: krótkie, ciche nuty
for i, e in enumerate([e for e in EV if e['type'] == 'node']):
    note(penta[i % len(penta)], e['t'], .25, .34, -.1 + .03 * i, .8)
phrase = sorted([e for e in EV if e['type'] == 'phrase'], key=lambda e: e['k'])
ear = next(e['t'] for e in EV if e['type'] == 'ear')
for e, m in zip(phrase, (72, 76, 79, 81, 79, 76)):         # wolna fraza nowego kota
    note(m, e['t'], .9, .55, .3, .95)
note(84, ear, None, .8, .35)                               # C6: najwyższa nuta na czubku ucha
stop = next(e['t'] for e in EV if e['type'] == 'stop')
for m, g in ((48, .7), (55, .6), (64, .55)):               # zatrzymanie: jeden długi akord wybrzmiewa do ciszy
    note(m, stop, None, .6, .15, g)

# krótki pogłos tylko dla muzyki (szum z zanikiem, ~0.9 s)
ir_n = int(.9 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / (.22 * SR)); ir = S.lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
from scipy.signal import fftconvolve
wet = np.stack([fftconvolve(mus_bus[:, c], ir)[:n] for c in range(2)], 1) * .22
mus = mus_bus + wet.astype(np.float32)

out = pen_bus * 1.0 + mus * 0.85
out = out[:int(round(DUR * SR))]
fade = int(.05 * SR); out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out = S.limit(out, .9) if out.ndim == 1 else np.stack([S.limit(out[:, c], .9) for c in range(2)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out.astype(np.float32), SR, subtype='FLOAT')
print('mix.wav', out.shape, 'peak', float(np.abs(out).max()), 'rms pen', float(np.sqrt((pen_bus ** 2).mean())), 'rms mus', float(np.sqrt((mus ** 2).mean())))
