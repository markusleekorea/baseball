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

  /* ----- 배경음: 경기장 관중 소리 (경기 중) ----- */
  let amb = null, unlocked = false;
  const bgmOn = () => unlocked && DB.settings.bgm && ac();

  // 짝짝 짝짝짝 박수
  function claps(vol = 0.05) {
    [0, 0.28, 0.84, 1.12, 1.4].forEach(p => {
      for (let k = 0; k < 4; k++) noise(0.05, { vol, freq: 1400 + Math.random() * 900, q: 1.2, at: p + k * 0.013 });
    });
  }

  function startAmbience() {
    if (amb || !bgmOn()) return;
    const c = ctx, t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.6;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 1.5);
    const lfo = c.createOscillator(); lfo.frequency.value = 0.12;
    const lg = c.createGain(); lg.gain.value = 0.015;
    lfo.connect(lg); lg.connect(g.gain);
    src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(master);
    src.start(); lfo.start();
    const timer = setInterval(() => { if (Math.random() < 0.45) claps(0.035); }, 7000);
    amb = { src, g, lfo, timer };
  }

  function stopAmbience() {
    if (!amb) return;
    const { src, g, lfo, timer } = amb, t = ctx.currentTime;
    clearInterval(timer);
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.5);
    src.stop(t + 0.6); lfo.stop(t + 0.6);
    amb = null;
  }

  /* ----- 배경음악: 메뉴 화면용 짧은 반복 곡 (작게) ----- */
  let mus = null;
  const MEL = [[76, 1], [79, 1], [84, 2], [83, 1], [79, 1], [81, 2], [77, 1], [81, 1], [79, 1], [76, 1], [74, 2], [67, 2],
    [76, 1], [79, 1], [84, 1], [88, 1], [86, 1], [84, 1], [81, 2], [77, 1], [76, 1], [74, 1], [79, 1], [72, 2], [0, 2]];
  const BASS = [48, 45, 41, 43, 48, 45, 43, 48];

  function startMusic() {
    if (mus || !bgmOn()) return;
    const c = ctx, beat = 60 / 108;
    const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(1, c.currentTime + 1.5); g.connect(master);
    const note = (midi, at, dur, type, vol) => {
      const o = c.createOscillator(), e = c.createGain();
      o.type = type; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      e.gain.setValueAtTime(0.0001, at); e.gain.exponentialRampToValueAtTime(vol, at + 0.02); e.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(e); e.connect(g); o.start(at); o.stop(at + dur + 0.05);
    };
    const s = { mt: c.currentTime + 0.2, mi: 0, bt: c.currentTime + 0.2, bi: 0 };
    const timer = setInterval(() => {
      const now = c.currentTime, until = now + 0.6;
      if (s.mt < now - 0.2) s.mt = now + 0.1;      // 화면을 잠깐 떠났다 와도 음이 몰리지 않게
      if (s.bt < now - 0.2) s.bt = now + 0.1;
      while (s.mt < until) {
        const [m, b] = MEL[s.mi % MEL.length];
        if (m) note(m, s.mt, b * beat * 0.85, 'triangle', 0.035);
        s.mt += b * beat; s.mi++;
      }
      while (s.bt < until) {
        const r = BASS[Math.floor(s.bi / 2) % BASS.length];
        note(r + (s.bi % 2 ? 12 : 0), s.bt, beat * 1.7, 'sine', 0.05);
        s.bt += 2 * beat; s.bi++;
      }
    }, 150);
    mus = { g, timer };
  }

  function stopMusic() {
    if (!mus) return;
    const { g, timer } = mus, t = ctx.currentTime;
    clearInterval(timer);
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.4);
    setTimeout(() => g.disconnect(), 700);
    mus = null;
  }

  return {
    unlock() { ac(); unlocked = true; },
    // 화면에 맞는 배경음: 경기 중 = 관중 소리, 그 밖 = 음악
    bgm(screen) {
      if (!DB.settings.bgm || !unlocked) { stopMusic(); stopAmbience(); return; }
      if (screen === 'game') { stopMusic(); startAmbience(); }
      else { stopAmbience(); startMusic(); }
    },
    claps() { if (on()) claps(0.07); },
    tap() { if (on()) tone(660, 0.05, { type: 'sine', vol: 0.05 }); },
    ding() { if (on()) { tone(1047, 0.18, { type: 'triangle', vol: 0.1 }); tone(1319, 0.3, { type: 'triangle', vol: 0.1, at: 0.12 }); } },
    inning() { if (on()) melody([[523, 1], [659, 1], [784, 2], [659, 1], [784, 3]], { type: 'triangle', vol: 0.07, gap: 0.12 }); },
    tick() { if (on()) tone(1800, 0.025, { type: 'square', vol: 0.035 }); },
    whoosh() { if (on()) noise(0.35, { vol: 0.12, freq: 900, q: 1.5, attack: 0.15 }); },
    mitt() { if (on()) { noise(0.09, { vol: 0.55, freq: 450, q: 0.8 }); tone(110, 0.09, { vol: 0.25 }); } },
    crack() {   // 딱! (나무 배트)
      if (!on()) return;
      noise(0.05, { vol: 0.8, freq: 2600, q: 0.6, type: 'highpass' });
      tone(1500, 0.06, { type: 'triangle', vol: 0.28, slide: 600 });
      tone(420, 0.09, { type: 'sine', vol: 0.2, slide: 260 });
    },
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
