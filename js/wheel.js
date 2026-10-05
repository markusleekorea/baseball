/* 룰렛 (canvas) — 칸 크기 = 실제 확률 */

const TAU = Math.PI * 2;
const modT = a => ((a % TAU) + TAU) % TAU;

class Wheel {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.rot = 0; this.vel = 0; this.segs = []; this.arcs = [];
    this.mode = 'idle'; this.hi = -1; this.alive = true; this.running = false; this.last = 0;
    this.tick = this.tick.bind(this);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
  }

  destroy() { this.alive = false; this.ro.disconnect(); }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.cv.clientWidth, h = this.cv.clientHeight;
    if (!w || !h) return;
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr); this.dpr = dpr;
    this.draw();
  }

  setSegments(segs) {
    this.segs = segs;
    const tot = segs.reduce((a, s) => a + s.w, 0);
    let a = 0;
    this.arcs = segs.map(s => { const st = a; a += (s.w / tot) * TAU; return [st, a]; });
    this.hi = -1;
    this.draw();
  }

  segAt() {
    const th = modT(-Math.PI / 2 - this.rot);
    const i = this.arcs.findIndex(([a, b]) => th >= a && th < b);
    return i < 0 ? this.arcs.length - 1 : i;
  }

  run() {
    if (this.running) return;
    this.running = true; this.last = performance.now();
    requestAnimationFrame(this.tick);
  }

  spin() {
    this.mode = 'spin'; this.vel = 11 + Math.random() * 3; this.hi = -1;
    this.lastSeg = this.segAt();
    this.run();
  }

  // idx 칸에 멈추기 (속도를 이어받아 부드럽게 감속)
  stopAt(idx) {
    return new Promise(res => {
      const [a0, a1] = this.arcs[idx];
      const th = a0 + (a1 - a0) * (0.2 + Math.random() * 0.6);
      const target = modT(-Math.PI / 2 - th);
      let D = modT(target - modT(this.rot));
      if (D < Math.PI) D += TAU;          // 최소 반 바퀴는 더 돌고 멈춤
      const T = 1050;                     // 멈추는 데 약 1초
      let done = false;
      const fin = () => { if (!done) { done = true; res(idx); } };
      this.anim = { t0: performance.now(), from: this.rot, D, T, idx, res: fin };
      this.mode = 'stop';
      this.run();
      // 화면이 잠깐 가려져 애니메이션이 멈춰도 경기는 계속되게
      setTimeout(() => {
        if (done || !this.alive) return;
        this.rot = this.anim.from + D; this.mode = 'idle'; this.hi = idx; this.running = false;
        this.draw(); fin();
      }, T + 800);
    });
  }

  tick(now) {
    if (!this.alive) { this.running = false; return; }
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (this.mode === 'spin') this.rot += this.vel * dt;
    else if (this.mode === 'stop') {
      const a = this.anim, t = Math.min(1, (now - a.t0) / a.T);
      this.rot = a.from + a.D * (1 - Math.pow(1 - t, 3));
      if (t >= 1) {
        this.mode = 'idle'; this.hi = a.idx; this.running = false;
        this.draw(now); a.res(a.idx); return;
      }
    } else { this.running = false; return; }

    const s = this.segAt();
    if (s !== this.lastSeg) {
      this.lastSeg = s;
      if (now - (this.lastTick || 0) > 40) { this.lastTick = now; Sound.tick(); }
    }
    this.draw(now);
    requestAnimationFrame(this.tick);
  }

  draw(now = performance.now()) {
    const c = this.ctx, W = this.cv.width, H = this.cv.height, d = this.dpr || 1;
    if (!W || !H) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);

    const pm = 20 * d;
    const R = Math.min(W / 2, (H - pm) / 2) - 3 * d;
    const cx = W / 2, cy = pm + (H - pm) / 2 - 2 * d;
    const Ri = R * 0.88;

    // 테두리 + 전구
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fillStyle = '#16233f'; c.fill();
    c.lineWidth = 3 * d; c.strokeStyle = '#ffd84d'; c.stroke();
    const bulbs = 24, blink = Math.floor(now / 140);
    for (let i = 0; i < bulbs; i++) {
      const a = (i / bulbs) * TAU;
      const on = this.mode !== 'idle' ? (i + blink) % 2 === 0 : i % 2 === 0;
      c.beginPath(); c.arc(cx + Math.cos(a) * (R + Ri) / 2, cy + Math.sin(a) * (R + Ri) / 2, R * 0.025, 0, TAU);
      c.fillStyle = on ? '#fff6c2' : '#a08a3a'; c.fill();
    }

    // 칸
    this.segs.forEach((s, i) => {
      const [a0, a1] = this.arcs[i];
      const st = this.rot + a0, en = this.rot + a1;
      c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, Ri, st, en); c.closePath();
      c.fillStyle = s.color; c.fill();
      if (this.hi >= 0 && i !== this.hi) { c.fillStyle = 'rgba(10,20,40,.6)'; c.fill(); }
      c.lineWidth = 2 * d; c.strokeStyle = 'rgba(255,255,255,.9)'; c.stroke();

      const span = a1 - a0;
      let fs = Math.min(Ri * 0.15, span * Ri * 0.55);
      if (fs < 9 * d) return;
      c.save();
      const mid = (st + en) / 2;
      const left = Math.cos(mid) < 0;           // 왼쪽 절반은 글자가 뒤집히지 않게 반대로 돌림
      c.translate(cx, cy); c.rotate(left ? mid + Math.PI : mid);
      c.font = `${fs}px Jua, "Apple SD Gothic Neo", sans-serif`;
      const maxW = Ri * 0.66;
      const w = c.measureText(s.label).width;
      if (w > maxW) { fs *= maxW / w; c.font = `${fs}px Jua, "Apple SD Gothic Neo", sans-serif`; }
      const x = left ? -(Ri - 10 * d) : Ri - 10 * d;
      c.textAlign = left ? 'left' : 'right'; c.textBaseline = 'middle';
      c.lineWidth = 3 * d; c.strokeStyle = 'rgba(0,0,0,.35)';
      c.strokeText(s.label, x, 0);
      c.fillStyle = '#fff'; c.fillText(s.label, x, 0);
      c.restore();
    });

    // 당첨 칸 강조
    if (this.hi >= 0 && this.arcs[this.hi]) {
      const [a0, a1] = this.arcs[this.hi];
      c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, Ri, this.rot + a0, this.rot + a1); c.closePath();
      c.lineWidth = 6 * d; c.strokeStyle = '#fff'; c.stroke();
    }

    // 가운데 야구공
    const hr = Ri * 0.17;
    c.beginPath(); c.arc(cx, cy, hr, 0, TAU); c.fillStyle = '#fff'; c.fill();
    c.lineWidth = 2 * d; c.strokeStyle = '#ccc'; c.stroke();
    c.save(); c.translate(cx, cy); c.rotate(this.rot);
    c.strokeStyle = '#E53935'; c.lineWidth = 2 * d;
    c.beginPath(); c.arc(-hr * 1.25, 0, hr * 0.85, -0.75, 0.75); c.stroke();
    c.beginPath(); c.arc(hr * 1.25, 0, hr * 0.85, Math.PI - 0.75, Math.PI + 0.75); c.stroke();
    c.restore();

    // 위쪽 화살표
    const tipY = cy - Ri + 14 * d, topY = cy - R - 12 * d, hw = 15 * d;
    c.beginPath(); c.moveTo(cx - hw, topY); c.lineTo(cx + hw, topY); c.lineTo(cx, tipY); c.closePath();
    c.fillStyle = '#fff'; c.fill();
    c.lineWidth = 3 * d; c.strokeStyle = '#E53935'; c.stroke();
  }
}
