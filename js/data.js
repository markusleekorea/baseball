/* 데이터 저장/불러오기 + 시즌 기록 */

const POSITIONS = ['포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수', '지명타자'];
const DEFAULT_POS = ['중견수', '2루수', '우익수', '1루수', '지명타자', '3루수', '좌익수', '포수', '유격수'];
const DEFAULT_BNUM = [1, 4, 7, 10, 25, 5, 8, 22, 6];
const DEFAULT_PNUM = [11, 18, 21, 30, 40];

// config.js 를 못 읽었을 때 쓰는 기본 팀
const FALLBACK_TEAMS = [
  { id: 'kt', name: 'kt wiz', short: 'KT', call: '케이티 위즈', color: '#1A1A1A', color2: '#ED1C24' },
  { id: 'lg', name: 'LG 트윈스', short: 'LG', call: '엘지 트윈스', color: '#C30452', color2: '#FFFFFF' },
  { id: 'doosan', name: '두산 베어스', short: '두산', call: '두산 베어스', color: '#131230', color2: '#FFFFFF' },
  { id: 'ssg', name: 'SSG 랜더스', short: 'SSG', call: '에스에스지 랜더스', color: '#CE0E2D', color2: '#FFD200' },
  { id: 'kiwoom', name: '키움 히어로즈', short: '키움', call: '키움 히어로즈', color: '#820024', color2: '#FFFFFF' },
  { id: 'kia', name: 'KIA 타이거즈', short: 'KIA', call: '기아 타이거즈', color: '#EA0029', color2: '#FFFFFF' },
  { id: 'samsung', name: '삼성 라이온즈', short: '삼성', call: '삼성 라이온즈', color: '#074CA1', color2: '#FFFFFF' },
  { id: 'lotte', name: '롯데 자이언츠', short: '롯데', call: '롯데 자이언츠', color: '#041E42', color2: '#FFFFFF' },
  { id: 'hanwha', name: '한화 이글스', short: '한화', call: '한화 이글스', color: '#FC4E00', color2: '#1A1A1A' },
  { id: 'nc', name: 'NC 다이노스', short: 'NC', call: '엔씨 다이노스', color: '#315288', color2: '#C7A079' },
];

const Store = {
  key: k => 'kbb.' + k,
  get(k, d) {
    try { const v = localStorage.getItem(this.key(k)); return v == null ? d : JSON.parse(v); }
    catch (e) { return d; }
  },
  set(k, v) {
    try { localStorage.setItem(this.key(k), JSON.stringify(v)); return true; }
    catch (e) { if (window.toast) toast('저장 공간이 부족해요. 로고 그림을 줄여 주세요.'); return false; }
  },
  del(k) { try { localStorage.removeItem(this.key(k)); } catch (e) {} },
};

const statVal = v => Math.min(5, Math.max(1, Math.round(+v || 3)));
function numOr(v, d) { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 && n <= 99 ? n : d; }
function strHash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function normTeam(raw) {
  const id = String(raw.id || ('team' + Math.random().toString(36).slice(2, 6)));
  const t = {
    id, name: String(raw.name || id), short: String(raw.short || raw.name || id), call: String(raw.call || raw.name || id),
    color: raw.color || '#333333', color2: raw.color2 || '#FFFFFF', logo: raw.logo || '', rotation: raw.rotation | 0,
  };
  const m = typeof raw.manager === 'string' ? { name: raw.manager } : (raw.manager || {});
  t.manager = { name: String(m.name || ''), num: m.num == null || m.num === '' ? '' : numOr(m.num, '') };
  const bs = Array.isArray(raw.batters) ? raw.batters : [];
  t.batters = Array.from({ length: 9 }, (_, i) => {
    let b = bs[i]; if (typeof b === 'string') b = { name: b }; b = b || {};
    return {
      id: b.id || `${id}-b${i}`, name: String(b.name || `타자${i + 1}`), num: numOr(b.num, DEFAULT_BNUM[i]),
      pos: POSITIONS.includes(b.pos) ? b.pos : DEFAULT_POS[i], power: statVal(b.power), contact: statVal(b.contact),
    };
  });
  const ps = Array.isArray(raw.pitchers) ? raw.pitchers : [];
  t.pitchers = Array.from({ length: 5 }, (_, i) => {
    let p = ps[i]; if (typeof p === 'string') p = { name: p }; p = p || {};
    return { id: p.id || `${id}-p${i}`, name: String(p.name || `투수${i + 1}`), num: numOr(p.num, DEFAULT_PNUM[i]), stuff: statVal(p.stuff) };
  });
  t.rotation = ((t.rotation % 5) + 5) % 5;
  return t;
}

const DB = {
  teams: [], settings: {}, season: null, cfgError: false,

  init() {
    const cfg = window.GAME_CONFIG;
    this.cfgError = !cfg;
    const cfgTeams = () => ((cfg && Array.isArray(cfg.teams) && cfg.teams.length >= 2) ? cfg.teams : FALLBACK_TEAMS).map(normTeam);
    const hash = strHash(JSON.stringify(cfg || null));

    this.settings = Object.assign(
      { voice: true, sfx: true, bgm: true, rate: 1, innings: 3, mode: 'pitch', simOthers: true, myTeam: (cfg && cfg.myTeam) || 'kt', favBoost: 2, ver: 2 },
      Store.get('settings', {}));
    // 예전 설정을 쓰던 기기: '우리 팀 힘내기' 기본값을 '많이'로, 배경음 켜기
    if ((this.settings.ver | 0) < 2) { this.settings.favBoost = 2; this.settings.bgm = true; this.settings.ver = 2; }

    let teams = Store.get('teams', null);
    if (!Array.isArray(teams) || teams.length < 2) {
      teams = cfgTeams();
      Store.set('cfghash', hash);
    } else if (cfg && Store.get('cfghash', null) !== hash) {
      Store.set('cfghash', hash);
      if (confirm('config.js 설정 파일이 바뀌었어요.\n새 설정(선수 이름 등)을 적용할까요?\n\n※ 앱에서 직접 고친 팀·선수 정보는 설정 파일 내용으로 바뀌어요.\n   (앱에서 넣은 로고 사진은 그대로 둬요)')) {
        teams = this.mergeConfig(teams, cfgTeams());
      }
    }
    this.teams = teams.map(normTeam);
    if (!this.team(this.settings.myTeam)) this.settings.myTeam = this.teams[0].id;

    this.season = Store.get('season', null) || Season.blank();
    Season.ensure();
    this.saveTeams(); this.saveSettings(); this.saveSeason();
  },

  mergeConfig(old, fresh) {
    const om = Object.fromEntries(old.map(t => [t.id, t]));
    return fresh.map(t => {
      const o = om[t.id];
      if (o) {
        if (!t.logo && o.logo && String(o.logo).startsWith('data:')) t.logo = o.logo;
        t.rotation = o.rotation | 0;
      }
      return t;
    });
  },

  reloadConfig() {
    const cfg = window.GAME_CONFIG;
    const fresh = ((cfg && Array.isArray(cfg.teams) && cfg.teams.length >= 2) ? cfg.teams : FALLBACK_TEAMS).map(normTeam);
    this.teams = this.mergeConfig(this.teams, fresh);
    Store.set('cfghash', strHash(JSON.stringify(cfg || null)));
    Season.ensure();
    this.saveTeams(); this.saveSeason();
  },

  team(id) { return this.teams.find(t => t.id === id); },
  saveTeams() { Store.set('teams', this.teams); },
  saveSettings() { Store.set('settings', this.settings); },
  saveSeason() { Store.set('season', this.season); },
};

const Season = {
  blank() { return { day: 0, standings: {}, log: [], bat: {}, pit: {} }; },

  ensure() {
    const S = DB.season;
    S.standings = S.standings || {}; S.bat = S.bat || {}; S.pit = S.pit || {}; S.log = S.log || []; S.day = S.day | 0;
    DB.teams.forEach(t => { if (!S.standings[t.id]) S.standings[t.id] = { w: 0, l: 0, d: 0, rs: 0, ra: 0 }; });
  },

  table() {
    const S = DB.season;
    const rows = DB.teams.map(t => {
      const r = S.standings[t.id] || { w: 0, l: 0, d: 0, rs: 0, ra: 0 };
      return { id: t.id, team: t, ...r, g: r.w + r.l + r.d, pct: (r.w + r.l) ? r.w / (r.w + r.l) : 0 };
    });
    rows.sort((a, b) => b.pct - a.pct || b.w - a.w || (b.rs - b.ra) - (a.rs - a.ra));
    const top = rows[0];
    rows.forEach((r, i) => {
      r.gb = ((top.w - r.w) + (r.l - top.l)) / 2;
      r.rank = (i > 0 && r.pct === rows[i - 1].pct && r.w === rows[i - 1].w) ? rows[i - 1].rank : i + 1;
    });
    return rows;
  },

  recordGame(G) {
    const S = DB.season; this.ensure();
    const a = G.teams.away.id, h = G.teams.home.id, ar = G.away.runs, hr = G.home.runs;
    const A = S.standings[a], H = S.standings[h];
    A.rs += ar; A.ra += hr; H.rs += hr; H.ra += ar;
    if (G.winner === 'away') { A.w++; H.l++; } else if (G.winner === 'home') { H.w++; A.l++; } else { A.d++; H.d++; }

    for (const side of ['away', 'home']) {
      for (const b of G.teams[side].batters) {
        const x = G.box[b.id]; if (!x) continue;
        const s = S.bat[b.id] || (S.bat[b.id] = { g: 0, pa: 0, ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, so: 0 });
        s.g++; for (const k in x) if (typeof x[k] === 'number') s[k] = (s[k] || 0) + x[k];
      }
      const p = G.teams[side].pitcher, x = G.pbox[p.id] || {};   // 투수 기록
      const s = S.pit[p.id] || (S.pit[p.id] = { g: 0, w: 0, l: 0, outs: 0, h: 0, r: 0, bb: 0, so: 0, hr: 0 });
      s.g++; for (const k in x) s[k] = (s[k] || 0) + x[k];
      if (G.winner === side) s.w++; else if (G.winner) s.l++;
    }
    S.log.push({ day: S.day, a, h, as: ar, hs: hr });
    if (S.log.length > 400) S.log.splice(0, S.log.length - 400);
    G.recorded = true;
  },

  // 내 경기를 기록하고, 다른 팀 경기도 자동으로 진행
  playDay(G) {
    if (G.recorded) return G.others || [];
    const S = DB.season;
    S.day++;
    this.recordGame(G);
    this.rotateAfter(G.teams.away.id, G.teams.away.pIdx);
    this.rotateAfter(G.teams.home.id, G.teams.home.pIdx);
    const others = [];
    if (DB.settings.simOthers) {
      const ids = shuffle(DB.teams.map(t => t.id).filter(id => id !== G.teams.away.id && id !== G.teams.home.id));
      for (let i = 0; i + 1 < ids.length; i += 2) {
        const A = DB.team(ids[i]), H = DB.team(ids[i + 1]);
        const g = Engine.simulate(A, H, 9, { fav: DB.settings.myTeam, favLvl: DB.settings.favBoost });
        this.recordGame(g);
        this.rotateAfter(A.id, g.teams.away.pIdx);
        this.rotateAfter(H.id, g.teams.home.pIdx);
        others.push({ a: A.id, h: H.id, as: g.away.runs, hs: g.home.runs });
      }
    }
    G.others = others;
    DB.saveSeason(); DB.saveTeams();
    return others;
  },

  rotateAfter(id, usedIdx) {
    const t = DB.team(id); if (!t) return;
    t.rotation = ((usedIdx | 0) + 1) % t.pitchers.length;
  },
};
