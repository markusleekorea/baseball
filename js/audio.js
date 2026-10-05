/* 효과음 (Web Audio로 직접 만듦) + 음성 중계 (아이패드 음성) */

const Sound = (() => {
  let ctx = null, master = null, noiseBuf = null;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      const len = ctx.sampleRate * 2;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const on = () => DB.settings.sfx && ac();

  function tone(f, dur, { type = 'sine', vol = 0.2, at = 0, slide = 0 } = {}) {
    const c = ctx, t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, { vol = 0.3, freq = 1000, q = 1, type = 'bandpass', at = 0, attack = 0.005 } = {}) {
    const c = ctx, t = c.currentTime + at;
    const s = c.createBufferSource(); s.buffer = noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  function melody(notes, { type = 'square', vol = 0.07, gap = 0.13 } = {}) {
    let at = 0;
    for (const [f, len] of notes) { if (f) tone(f, len * gap * 1.6, { type, vol, at }); at += len * gap; }
  }

  return {
    unlock() { ac(); },
    tick() { if (on()) tone(1800, 0.025, { type: 'square', vol: 0.035 }); },
    whoosh() { if (on()) noise(0.35, { vol: 0.12, freq: 900, q: 1.5, attack: 0.15 }); },
    mitt() { if (on()) { noise(0.09, { vol: 0.55, freq: 450, q: 0.8 }); tone(110, 0.09, { vol: 0.25 }); } },
    crack() { if (on()) { noise(0.06, { vol: 0.9, freq: 2600, q: 0.6, type: 'highpass' }); tone(1300, 0.07, { type: 'triangle', vol: 0.3, slide: 500 }); } },
    foul() { if (on()) { noise(0.05, { vol: 0.5, freq: 2200, q: 0.6, type: 'highpass' }); } },
    out() { if (on()) tone(240, 0.3, { type: 'sawtooth', vol: 0.06, slide: 120 }); },
    cheer(len = 1.8, vol = 0.22) {
      if (!on()) return;
      noise(len, { vol, freq: 1300, q: 0.4, attack: 0.25 });
      noise(len, { vol: vol * 0.7, freq: 600, q: 0.5, attack: 0.35 });
    },
    // 빰빰빰빰~ 빰빰! (응원 나팔)
    charge() { if (on()) melody([[392, 1], [523, 1], [659, 1], [784, 2], [659, 1], [784, 4]], { type: 'square', vol: 0.06 }); },
    fanfare() { if (on()) melody([[523, 1], [659, 1], [784, 1], [1047, 2], [0, 1], [784, 1], [1047, 5]], { type: 'square', vol: 0.07 }); },
    sad() { if (on()) melody([[392, 2], [370, 2], [349, 2], [330, 5]], { type: 'triangle', vol: 0.12, gap: 0.16 }); },
  };
})();

const Voice = (() => {
  const ok = 'speechSynthesis' in window;
  let voice = null;

  function pickVoice() {
    if (!ok) return;
    const vs = speechSynthesis.getVoices();
    const ko = vs.filter(v => (v.lang || '').replace('_', '-').toLowerCase().startsWith('ko'));
    voice = ko.find(v => /yuna|유나|sora|siri/i.test(v.name)) || ko[0] || null;
  }
  if (ok) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  // 숫자를 한자어로 읽게 바꿈: "6번 타자" → "육번 타자", "2루타" → "이루타", "3 대 1" → "삼 대 일"
  const D = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  function sino(n) {
    if (n === 0) return '영';
    let s = '';
    const h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, u = n % 10;
    if (n >= 1000) return String(n);
    if (h) s += (h > 1 ? D[h] : '') + '백';
    if (t) s += (t > 1 ? D[t] : '') + '십';
    return s + D[u];
  }
  // 점수는 "두 점", "세 점"처럼 읽기
  const NATIVE = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  const readable = text => String(text)
    .replace(/(\d+)\s*점/g, (m, n) => (+n <= 10 ? NATIVE[+n] : sino(+n)) + ' 점')
    .replace(/\d+/g, m => sino(+m));

  function utter(text, opts) {
    const u = new SpeechSynthesisUtterance(readable(text));
    u.lang = 'ko-KR'; if (voice) u.voice = voice;
    u.rate = (DB.settings.rate || 1) * (opts.rate || 1);
    u.pitch = opts.pitch || 1.05; u.volume = 1;
    return u;
  }

  // 짧은 외침 ("볼!", "스트라이크!"): 기다리지 않고, 앞의 짧은 외침은 끊음
  function quick(text) {
    if (!DB.settings.voice || !ok || !text) return;
    try {
      if (speechSynthesis.speaking) { speechSynthesis.cancel(); setTimeout(() => speechSynthesis.speak(utter(text, { rate: 1.1 })), 60); }
      else speechSynthesis.speak(utter(text, { rate: 1.1 }));
    } catch (e) {}
  }

  function speak(text, opts = {}) {
    return new Promise(res => {
      if (!DB.settings.voice || !ok || !text) { setTimeout(res, opts.silent ?? 650); return; }
      const u = utter(text, opts);
      let done = false;
      const fin = () => { if (!done) { done = true; clearTimeout(tm); res(); } };
      u.onend = fin; u.onerror = fin;
      const tm = setTimeout(fin, 1800 + (text.length * 230) / u.rate);
      speechSynthesis.speak(u);
    });
  }

  return {
    speak, quick, readable,
    cancel() { if (ok) try { speechSynthesis.cancel(); } catch (e) {} },
    unlock() {
      if (!ok) return;
      try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
    },
  };
})();
