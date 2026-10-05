/* 경기 규칙 (룰렛 확률, 주자 진루, 점수, 이닝) */

const Engine = (() => {
  const R = Math.random;

  const SEG = {
    ball:   { label: '볼',       color: '#25A65B' },
    strike: { label: '스트라이크', color: '#F2B705' },
    foul:   { label: '파울',      color: '#7E8FA6' },
    inplay: { label: '타격!',     color: '#F26B1D' },
    walk:   { label: '볼넷',      color: '#25A65B' },
    so:     { label: '삼진',      color: '#E0A800' },
    ground: { label: '땅볼',      color: '#9C6B4E' },
    fly:    { label: '뜬공',      color: '#5F7186' },
    line:   { label: '직선타',    color: '#3E4C5E' },
    '1B':   { label: '안타',      color: '#2D8CF0' },
    '2B':   { label: '2루타',     color: '#7B4FE0' },
    '3B':   { label: '3루타',     color: '#E0459B' },
    HR:     { label: '홈런!',     color: '#E53935' },
  };
  const HITS = ['1B', '2B', '3B', 'HR'];

  const bat = G => (G.half === 0 ? 'away' : 'home');
  const fld = G => (G.half === 0 ? 'home' : 'away');
  const batter = G => { const s = bat(G); return G.teams[s].batters[G[s].idx]; };
  const nextBatter = G => { const s = bat(G); return G.teams[s].batters[(G[s].idx + 1) % 9]; };
  const pitcher = G => G.teams[fld(G)].pitcher;

  function snap(t, pIdx) {
    const n = t.pitchers.length;
    const pi = (((pIdx | 0) % n) + n) % n;
    return {
      id: t.id, name: t.name, short: t.short, call: t.call, color: t.color, color2: t.color2,
      batters: t.batters.map(b => ({ ...b })), pitcher: { ...t.pitchers[pi] }, pIdx: pi,
    };
  }

  function newGame(away, home, o = {}) {
    const innings = o.innings || 3, ctrl = o.ctrl || {}, pit = o.pit || {};
    const side = c => ({ idx: 0, cheers: 3, ctrl: c || 'human', runs: 0, hits: 0, line: [] });
    const G = {
      v: 2, innings, maxInnings: innings + 3, mode: o.mode || 'pitch',
      fav: o.fav || null, favLvl: o.favLvl | 0,          // 우리 팀 힘내기
      inning: 1, half: 0, outs: 0, balls: 0, strikes: 0, bases: [null, null, null], boost: false,
      teams: {
        away: snap(away, pit.away != null ? pit.away : away.rotation),
        home: snap(home, pit.home != null ? pit.home : home.rotation),
      },
      away: side(ctrl.away), home: side(ctrl.home),
      box: {}, pbox: {}, over: false, winner: null, recorded: false,
    };
    G.away.line.push(0);
    return G;
  }

  /* ---------- 룰렛 칸 (능력치에 따라 크기가 바뀜) ---------- */
  // 우리 팀 힘내기: 0 없음, 1 조금, 2 많이 (능력치에 더해짐)
  const FAV = [0, 0.4, 0.8];

  function mods(G) {
    const b = batter(G), p = pitcher(G);
    let c = b.contact - 3, pw = b.power - 3, s = p.stuff - 3;
    const k = G.fav ? FAV[G.favLvl] || 0 : 0;
    if (k && G.teams[bat(G)].id === G.fav) { c += k; pw += k; }
    if (k && G.teams[fld(G)].id === G.fav) s += k;
    return { c, p: pw, s, b: G.boost ? 1 : 0 };
  }
  const build = list => list.map(([k, w]) => ({ k, w: Math.max(0.8, w), label: SEG[k].label, color: SEG[k].color }));

  // 투구 룰렛: 볼 / 스트라이크 / 타격(파울 포함)
  function pitchSegs(G) {
    const { c, s, b } = mods(G);
    const ball = 33 - s, strike = 27 + 2 * s - 2 * c - 6 * b, hit = 19 + 21 + 2 * c - s + 7 * b;
    return build([
      ['ball', ball / 2], ['strike', strike / 2], ['inplay', hit / 2],
      ['ball', ball / 2], ['strike', strike / 2], ['inplay', hit / 2],
    ]);
  }

  // 공을 맞혔을 때 결과 (룰렛 없이 자동): 파울 + 타구 결과
  function contactSegs(G) {
    const { c, s, b } = mods(G);
    const inW = Math.max(4, 21 + 2 * c - s + 7 * b);
    const hs = hitSegs(G), H = hs.reduce((a, x) => a + x.w, 0);
    return [{ k: 'foul', w: 19, label: SEG.foul.label, color: SEG.foul.color }, ...hs.map(x => ({ ...x, w: (x.w / H) * inW }))];
  }

  function hitSegs(G) {
    const { c, p, s, b } = mods(G);
    const ground = 25 - c + 2 * s - 4 * b, fly = 21 - c + s - 3 * b, line = 8;
    const h1 = 25 + 3 * c - 2 * s + 3 * b, h2 = 8 + 1.5 * p + 2 * b, h3 = 2, hr = 5 + 2.5 * p - s + 2 * b;
    return build([
      ['ground', ground / 2], ['1B', h1 / 2], ['fly', fly / 2], ['2B', h2],
      ['ground', ground / 2], ['HR', hr], ['fly', fly / 2], ['1B', h1 / 2], ['line', line], ['3B', h3],
    ]);
  }

  function atbatSegs(G) {
    const { c, p, s, b } = mods(G);
    const walk = 9 - s, so = 20 + 3 * s - 3 * c - 6 * b, ground = 18 - c + s - 3 * b, fly = 15 - c + s - 2 * b, line = 5;
    const h1 = 19 + 3 * c - 2 * s + 3 * b, h2 = 6 + p + 2 * b, h3 = 1.5, hr = 4 + 2 * p - s + 2 * b;
    return build([
      ['so', so / 2], ['1B', h1 / 2], ['ground', ground / 2], ['walk', walk], ['fly', fly / 2], ['2B', h2],
      ['so', so / 2], ['HR', hr], ['ground', ground / 2], ['1B', h1 / 2], ['line', line], ['fly', fly / 2], ['3B', h3],
    ]);
  }

  function pick(segs) {
    let t = segs.reduce((a, x) => a + x.w, 0) * R();
    for (let i = 0; i < segs.length; i++) { t -= segs[i].w; if (t <= 0) return i; }
    return segs.length - 1;
  }

  /* ---------- 기록 ---------- */
  const bx = (G, pid) => G.box[pid] || (G.box[pid] = { pa: 0, ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, so: 0 });
  const px = (G, pid) => G.pbox[pid] || (G.pbox[pid] = { outs: 0, h: 0, r: 0, bb: 0, so: 0, hr: 0 });

  function result(G, type) {
    return {
      type, batterId: batter(G).id, side: bat(G), runs: [], rbi: 0, moves: [],
      balls: G.balls, strikes: G.strikes, outs: G.outs,
      paEnded: false, endHalf: false, over: false, walkoff: false,
    };
  }

  function scoreRun(G, r, pid, rbi) {
    const s = bat(G);
    G[s].runs++; G[s].line[G.inning - 1]++;
    bx(G, pid).r++; px(G, pitcher(G).id).r++;
    r.runs.push(pid); if (rbi) r.rbi++;
  }

  // 모든 주자 한 베이스씩 (앞 주자부터)
  function advanceAll(G, r, rbi) {
    const b = G.bases, nb = [null, null, null];
    for (let i = 2; i >= 0; i--) {
      if (!b[i]) continue;
      if (i === 2) { r.moves.push({ pid: b[i], from: 2, to: 3 }); scoreRun(G, r, b[i], rbi); }
      else { nb[i + 1] = b[i]; r.moves.push({ pid: b[i], from: i, to: i + 1 }); }
    }
    G.bases = nb;
  }

  function walk(G, r) {
    const b = G.bases, nb = [...b], id = batter(G).id;
    if (b[0]) {
      if (b[1]) {
        if (b[2]) { r.moves.push({ pid: b[2], from: 2, to: 3 }); scoreRun(G, r, b[2], true); }
        r.moves.push({ pid: b[1], from: 1, to: 2 }); nb[2] = b[1];
      }
      r.moves.push({ pid: b[0], from: 0, to: 1 }); nb[1] = b[0];
    }
    nb[0] = id; r.moves.push({ pid: id, from: -1, to: 0 });
    G.bases = nb;
    const B = bx(G, id); B.pa++; B.bb++; B.rbi += r.rbi;
    px(G, pitcher(G).id).bb++;
    r.type = 'walk'; r.paEnded = true;
  }

  function strikeout(G, r) {
    const id = batter(G).id, B = bx(G, id), P = px(G, pitcher(G).id);
    B.pa++; B.ab++; B.so++; P.so++; P.outs++; G.outs++;
    r.type = 'so'; r.paEnded = true;
  }

  function ballInPlay(G, r, k) {
    const id = batter(G).id, B = bx(G, id), P = px(G, pitcher(G).id);
    B.pa++; r.paEnded = true; r.type = k;

    if (HITS.includes(k)) {
      const n = { '1B': 1, '2B': 2, '3B': 3, HR: 4 }[k];
      B.ab++; B.h++; G[bat(G)].hits++; P.h++;
      if (k === '2B') B.d++; if (k === '3B') B.t++; if (k === 'HR') { B.hr++; P.hr++; }
      const b = G.bases, nb = [null, null, null];
      for (let i = 2; i >= 0; i--) {
        if (!b[i]) continue;
        let t = i + n;
        if (n === 1 && i === 1 && R() < 0.55) t = 3;            // 2루 주자 홈까지
        if (n === 1 && i === 0 && !nb[2] && R() < 0.2) t = 2;   // 1루 주자 3루까지
        if (n === 2 && i === 0 && R() < 0.4) t = 3;             // 1루 주자 홈까지
        if (t >= 3) { r.moves.push({ pid: b[i], from: i, to: 3 }); scoreRun(G, r, b[i], true); }
        else { nb[t] = b[i]; r.moves.push({ pid: b[i], from: i, to: t }); }
      }
      if (n === 4) { r.moves.push({ pid: id, from: -1, to: 3 }); scoreRun(G, r, id, true); }
      else { nb[n - 1] = id; r.moves.push({ pid: id, from: -1, to: n - 1 }); }
      G.bases = nb;
    } else {
      B.ab++;
      if (k === 'ground') {
        if (G.bases[0] && G.outs < 2 && R() < 0.45) {        // 병살타
          r.type = 'dp';
          const b = G.bases, nb = [null, null, null];
          r.moves.push({ pid: b[0], from: 0, to: 'out' });
          G.outs += 2; P.outs += 2;
          if (G.outs < 3) {
            if (b[2]) { r.moves.push({ pid: b[2], from: 2, to: 3 }); scoreRun(G, r, b[2], false); }
            if (b[1]) { nb[2] = b[1]; r.moves.push({ pid: b[1], from: 1, to: 2 }); }
          }
          G.bases = nb;
        } else {
          G.outs++; P.outs++;
          if (G.outs < 3 && G.bases.some(Boolean) && R() < 0.6) { r.adv = true; advanceAll(G, r, true); }
        }
      } else if (k === 'fly') {
        G.outs++; P.outs++;
        if (G.outs < 3 && G.bases[2] && R() < 0.6) {          // 희생플라이
          r.type = 'sf'; B.ab--;
          const runner = G.bases[2];
          r.moves.push({ pid: runner, from: 2, to: 3 }); scoreRun(G, r, runner, true);
          G.bases[2] = null;
          if (G.bases[1] && R() < 0.4) { G.bases[2] = G.bases[1]; G.bases[1] = null; r.moves.push({ pid: G.bases[2], from: 1, to: 2 }); }
        } else if (G.outs < 3 && G.bases[1] && !G.bases[2] && R() < 0.35) {
          G.bases[2] = G.bases[1]; G.bases[1] = null; r.adv = true;
          r.moves.push({ pid: G.bases[2], from: 1, to: 2 });
        }
      } else {                                                 // 직선타
        G.outs++; P.outs++;
      }
    }
    B.rbi += r.rbi;
  }

  /* ---------- 타석 끝, 이닝 끝, 경기 끝 ---------- */
  function endPA(G, r) {
    const B = bx(G, r.batterId); (B.log || (B.log = [])).push(r.type);
    r.balls = G.balls; r.strikes = G.strikes; r.outs = Math.min(3, G.outs);
    G.balls = 0; G.strikes = 0; G.boost = false;
    const s = bat(G); G[s].idx = (G[s].idx + 1) % 9;

    if (G.half === 1 && G.inning >= G.innings && G.home.runs > G.away.runs) {   // 끝내기
      G.over = true; G.winner = 'home'; r.over = true; r.walkoff = true; return;
    }
    if (G.outs >= 3) { r.endHalf = true; endHalf(G, r); }
  }

  function endHalf(G, r) {
    G.outs = 0; G.bases = [null, null, null]; G.balls = 0; G.strikes = 0; G.boost = false;
    const last = G.inning >= G.innings;
    if (G.half === 0) {
      if (last && G.home.runs > G.away.runs) { G.over = true; G.winner = 'home'; r.over = true; return; }
      G.half = 1; G.home.line.push(0);
    } else {
      if (last && G.away.runs !== G.home.runs) {
        G.over = true; G.winner = G.away.runs > G.home.runs ? 'away' : 'home'; r.over = true; return;
      }
      if (G.inning >= G.maxInnings) { G.over = true; G.winner = null; r.over = true; return; }
      G.inning++; G.half = 0; G.away.line.push(0);
    }
  }

  /* ---------- 공 하나 / 타구 / 타석 결과 ---------- */
  function applyPitch(G, k) {
    const r = result(G, k);
    if (k === 'ball') { G.balls++; if (G.balls >= 4) walk(G, r); }
    else if (k === 'strike') { G.strikes++; r.look = R() < 0.45; if (G.strikes >= 3) strikeout(G, r); }
    else if (k === 'foul') { if (G.strikes < 2) G.strikes++; }
    r.balls = G.balls; r.strikes = G.strikes; r.outs = G.outs;
    if (r.paEnded) endPA(G, r);
    return r;
  }

  function applyInplay(G, k) {
    const r = result(G, k);
    ballInPlay(G, r, k);
    endPA(G, r);
    return r;
  }

  function applyAtBat(G, k) {
    const r = result(G, k);
    if (k === 'walk') walk(G, r);
    else if (k === 'so') strikeout(G, r);
    else ballInPlay(G, r, k);
    endPA(G, r);
    return r;
  }

  /* ---------- 응원 ---------- */
  const canCheer = G => G[bat(G)].cheers > 0 && !G.boost;
  function useCheer(G) { if (!canCheer(G)) return false; G[bat(G)].cheers--; G.boost = true; return true; }
  function cpuCheer(G) {
    if (!canCheer(G)) return false;
    const risp = G.bases[1] || G.bases[2];
    const late = G.inning >= G.innings;
    return (risp && R() < 0.35) || (late && R() < 0.25);
  }

  /* ---------- 빠른 시뮬레이션 (다른 팀 경기) ---------- */
  // 공을 맞혔을 때: 파울이면 카운트만, 아니면 타구 결과
  function applyContact(G, k) {
    return k === 'foul' ? applyPitch(G, 'foul') : applyInplay(G, k);
  }

  function simulate(away, home, innings, o = {}) {
    const G = newGame(away, home, { innings, mode: 'pitch', ctrl: { away: 'cpu', home: 'cpu' }, fav: o.fav, favLvl: o.favLvl });
    let guard = 0;
    while (!G.over && guard++ < 5000) {
      if (cpuCheer(G)) useCheer(G);
      const segs = pitchSegs(G), k = segs[pick(segs)].k;
      if (k === 'inplay') { const cs = contactSegs(G); applyContact(G, cs[pick(cs)].k); }
      else applyPitch(G, k);
    }
    return G;
  }

  return {
    SEG, bat, fld, batter, nextBatter, pitcher, newGame,
    pitchSegs, hitSegs, contactSegs, atbatSegs, pick, applyContact,
    applyPitch, applyInplay, applyAtBat,
    canCheer, useCheer, cpuCheer, simulate,
  };
})();
