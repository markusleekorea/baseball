/* 화면 + 경기 진행 */

/* ================= 공통 도우미 ================= */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const choice = a => a[Math.floor(Math.random() * a.length)];
const KNUM = ['', '원', '투', '쓰리'];

function josa(word, withBatchim, without) {
  const ch = String(word).trim().slice(-1).charCodeAt(0);
  if (ch < 0xac00 || ch > 0xd7a3) return word + without;
  return word + ((ch - 0xac00) % 28 ? withBatchim : without);
}
function avg(h, ab) { return ab ? (h / ab).toFixed(3).replace(/^0/, '') : '-'; }
function ipText(o) { o = o | 0; return `${Math.floor(o / 3)}${o % 3 ? ` ${o % 3}/3` : ''}`; }

function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400);
}

const Modal = {
  open(html) {
    let m = $('#modal');
    if (!m) { m = document.createElement('div'); m.id = 'modal'; document.body.appendChild(m); }
    m.innerHTML = `<div class="modal-card">${html}</div>`; m.classList.add('show');
  },
  close() { const m = $('#modal'); if (m) { m.classList.remove('show'); m.innerHTML = ''; } },
};

const Fx = {
  confetti(colors, n = 90) {
    const box = document.createElement('div'); box.className = 'confetti';
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.7 + 's';
      p.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
      p.style.setProperty('--dx', Math.random() * 240 - 120 + 'px');
      p.style.setProperty('--rot', Math.random() * 900 + 'deg');
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 4200);
  },
};

/* ================= 라우터 ================= */
const App = {
  screen: 'home', params: {}, setup: null, luSel: null,
  go(screen, params = {}) {
    if (this.screen === 'game' && screen !== 'game') Game.leave();
    this.screen = screen; this.params = params; this.luSel = null;
    render();
  },
};

function render() {
  const el = $('#app');
  el.innerHTML = Screens[App.screen](App.params);
  document.body.classList.toggle('ingame', App.screen === 'game');
  Sound.bgm(App.screen);
  if (Mount[App.screen]) Mount[App.screen](App.params);
}

const header = (title, back = 'home', extra = '', backParams = '') =>
  `<header class="bar">
     <button class="btn small ghost" data-act="go" data-to="${back}" ${backParams}>◀ 뒤로</button>
     <h2>${title}</h2><div class="bar-extra">${extra}</div>
   </header>`;

// 감독 표시 (이름이 없으면 안 보임)
const mgrHTML = (t, cls) => (t && t.manager && t.manager.name
  ? `<div class="mgr ${cls}">🧢 감독 <b>${esc(t.manager.name)}</b>${t.manager.num !== '' && t.manager.num != null ? ` #${t.manager.num}` : ''}</div>` : '');

const stars = (kind, i, f, v) =>
  `<span class="stars">${[1, 2, 3, 4, 5].map(n =>
    `<b class="${n <= v ? 'on' : ''}" data-act="star" data-kind="${kind}" data-i="${i}" data-f="${f}" data-v="${n}">★</b>`).join('')}</span>`;

/* ================= 화면들 ================= */
const Screens = {
  /* ---------- 첫 화면 ---------- */
  home() {
    const my = DB.team(DB.settings.myTeam) || DB.teams[0];
    const row = Season.table().find(r => r.id === my.id);
    const saved = Game.loadSaved();
    const rec = row && row.g ? `${row.g}경기 ${row.w}승 ${row.l}패${row.d ? ` ${row.d}무` : ''} · <b>${row.rank}위</b>` : '시즌 첫 경기를 기다리는 중!';
    return `<div class="screen home" style="--tc:${my.color};--tc2:${my.color2}">
      <div class="home-hero">
        <div class="home-logo">${Art.logo(my, 'xl')}</div>
        <h1 class="title">우리집 프로야구</h1>
        <div class="home-team">${esc(my.name)} <span class="home-rec">${rec}</span></div>
      </div>
      <div class="home-menu">
        ${saved ? `<button class="btn big orange" data-act="resume">▶️ 하던 경기 이어하기</button>` : ''}
        <button class="btn big primary" data-act="go" data-to="setup">⚾ 경기하기</button>
        <div class="home-grid">
          <button class="btn mid" data-act="go" data-to="standings">🏆 순위표</button>
          <button class="btn mid" data-act="go" data-to="stats">📊 선수 기록</button>
          <button class="btn mid" data-act="go" data-to="teams">👕 팀·선수 관리</button>
          <button class="btn mid" data-act="go" data-to="settings">⚙️ 설정</button>
        </div>
      </div>
      ${DB.cfgError ? `<div class="warn">⚠️ config.js 파일을 읽지 못했어요. 쉼표·따옴표가 빠졌는지 확인해 주세요. (기본 팀으로 시작했어요)</div>` : ''}
    </div>`;
  },

  /* ---------- 경기 준비 ---------- */
  setup() {
    const S = setupState();
    const panel = side => {
      const t = DB.team(S[side]), p = t.pitchers[S.pit[side]];
      return `<div class="setup-panel" style="--tc:${t.color};--tc2:${t.color2}">
        <div class="sp-head">${side === 'away' ? '원정팀 (먼저 공격)' : '홈팀 (나중에 공격)'}</div>
        <div class="sp-team">${Art.logo(t, 'lg')}<div><div class="sp-name">${esc(t.name)}</div>${mgrHTML(t, 'sp-mgr')}</div></div>
        <div class="team-grid">${DB.teams.map(x =>
          `<button class="tg ${x.id === S[side] ? 'sel' : ''}" data-act="pickTeam" data-side="${side}" data-id="${x.id}">${Art.logo(x, 'sm')}</button>`).join('')}</div>
        <div class="seg wide">
          <button class="${S.ctrl[side] === 'human' ? 'on' : ''}" data-act="ctrl" data-side="${side}" data-v="human">🙋 사람이 쳐요</button>
          <button class="${S.ctrl[side] === 'cpu' ? 'on' : ''}" data-act="ctrl" data-side="${side}" data-v="cpu">🤖 컴퓨터</button>
        </div>
        <button class="btn sp-btn" data-act="cyclePitcher" data-side="${side}">⚾ 선발투수 <b>${esc(p.name)}</b> #${p.num} 🔄</button>
        <button class="btn sp-btn" data-act="go" data-to="lineup" data-team="${t.id}" data-back="setup">📋 타순 보기·바꾸기</button>
      </div>`;
    };
    const inn = DB.settings.innings, mode = DB.settings.mode;
    return `<div class="screen setup">${header('경기 준비')}
      <div class="setup-body">${panel('away')}<div class="vs">VS</div>${panel('home')}</div>
      <div class="setup-foot">
        <div class="opt"><span>이닝</span><div class="seg">${[3, 5, 9].map(n =>
          `<button class="${inn === n ? 'on' : ''}" data-act="innings" data-v="${n}">${n}회</button>`).join('')}</div></div>
        <div class="opt"><span>룰렛</span><div class="seg">
          <button class="${mode === 'pitch' ? 'on' : ''}" data-act="mode" data-v="pitch">공 하나씩</button>
          <button class="${mode === 'atbat' ? 'on' : ''}" data-act="mode" data-v="atbat">타석마다 (빨리)</button></div></div>
        <button class="btn huge primary" data-act="playball">⚾ 플레이볼!</button>
      </div>
    </div>`;
  },

  /* ---------- 경기 ---------- */
  game() {
    return `<div class="screen game">
      <div class="g-top">
        <button class="btn icon" data-act="gmenu">⏸</button>
        <div class="scoreboard" id="sb"></div>
        <div class="count" id="count"></div>
      </div>
      <div class="g-main">
        <aside class="lineup-panel" id="lineup"></aside>
        <div class="g-center">
          <div class="matchup" id="matchup"></div>
          <div class="field-wrap">
            <svg id="field" viewBox="0 0 400 345" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
              <g id="f-bg"></g><g id="f-fielders"></g><g id="f-runners"></g><g id="f-batter"></g>
              <g id="f-ball" opacity="0"><ellipse id="f-shadow" rx="3.5" ry="1.6" fill="rgba(0,0,0,.4)"/><circle id="f-bl" r="3.4" fill="#fff" stroke="#d33" stroke-width=".8"/></g>
            </svg>
            <div class="popup" id="popup"></div>
          </div>
        </div>
        <aside class="ctrl">
          <div class="wtitle" id="wtitle"></div>
          <div class="wheel-box"><canvas id="wheel"></canvas></div>
          <div class="ctrl-btns" id="btns"></div>
        </aside>
      </div>
      <div class="caption" id="caption"></div>
      <div class="overlay hidden" id="ov"></div>
    </div>`;
  },

  /* ---------- 타순 정하기 (아이용) ---------- */
  lineup({ team, back }) {
    const t = DB.team(team);
    const backTo = back || 'teamEdit';
    return `<div class="screen lineup" style="--tc:${t.color};--tc2:${t.color2}">
      ${header(`${Art.logo(t, 'xs')} ${esc(t.name)} 타순 정하기`, backTo, '', `data-team="${t.id}"`)}
      <p class="hint">${App.luSel == null ? '👆 자리를 바꿀 선수를 눌러요' : `👉 <b>${esc(t.batters[App.luSel].name)}</b> 선수랑 바꿀 선수를 눌러요`}</p>
      ${mgrHTML(t, 'lu-mgr')}
      <div class="lu-grid">${t.batters.map((b, i) => `
        <button class="lu-card ${App.luSel === i ? 'sel' : ''}" data-act="luTap" data-team="${t.id}" data-i="${i}">
          <div class="lu-ord">${i + 1}번</div>
          <div class="lu-fig">${Art.player(t, b.num, 'bat')}</div>
          <div class="lu-name">${esc(b.name)}</div>
          <div class="lu-pos">${b.pos} · #${b.num}</div>
        </button>`).join('')}</div>
    </div>`;
  },

  /* ---------- 팀 목록 ---------- */
  teams() {
    return `<div class="screen teams">${header('팀·선수 관리')}
      <p class="hint">팀을 눌러서 이름, 선수, 로고를 바꿔요.</p>
      <div class="team-tiles">${DB.teams.map(t => `
        <button class="team-tile" style="--tc:${t.color};--tc2:${t.color2}" data-act="go" data-to="teamEdit" data-team="${t.id}">
          ${Art.logo(t, 'lg')}<div class="tt-name">${esc(t.name)}</div>
          <div class="tt-sub">${t.id === DB.settings.myTeam ? '⭐ 우리 팀' : ''}</div>
        </button>`).join('')}</div>
    </div>`;
  },

  /* ---------- 팀 편집 (아빠용) ---------- */
  teamEdit({ team }) {
    const t = DB.team(team);
    const brow = (b, i) => `<tr>
      <td class="ord">${i + 1}</td>
      <td><input class="in name" value="${esc(b.name)}" maxlength="12" data-kind="b" data-i="${i}" data-f="name"></td>
      <td><input class="in num" type="number" inputmode="numeric" min="0" max="99" value="${b.num}" data-kind="b" data-i="${i}" data-f="num"></td>
      <td><select class="in" data-kind="b" data-i="${i}" data-f="pos">${POSITIONS.map(p => `<option ${p === b.pos ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
      <td>${stars('b', i, 'power', b.power)}</td>
      <td>${stars('b', i, 'contact', b.contact)}</td></tr>`;
    const prow = (p, i) => `<tr>
      <td class="ord">${i === t.rotation ? '▶' : i + 1}</td>
      <td><input class="in name" value="${esc(p.name)}" maxlength="12" data-kind="p" data-i="${i}" data-f="name"></td>
      <td><input class="in num" type="number" inputmode="numeric" min="0" max="99" value="${p.num}" data-kind="p" data-i="${i}" data-f="num"></td>
      <td>${stars('p', i, 'stuff', p.stuff)}</td></tr>`;
    return `<div class="screen edit" data-team="${t.id}">${header(`${esc(t.name)} 편집`, 'teams')}
      <div class="edit-body">
        <section class="panel edit-team">
          <div class="logo-box">${Art.logo(t, 'xl')}</div>
          <label class="btn small">📷 로고 사진 넣기<input type="file" accept="image/*" data-logo="${t.id}" hidden></label>
          ${t.logo ? `<button class="btn small ghost-dark" data-act="logoDel" data-team="${t.id}">로고 지우기</button>` : ''}
          <label class="fld">팀 이름<input class="in" value="${esc(t.name)}" maxlength="16" data-tf="name"></label>
          <label class="fld">짧은 이름 (전광판)<input class="in" value="${esc(t.short)}" maxlength="4" data-tf="short"></label>
          <label class="fld">감독 이름 · 번호
            <div class="row"><input class="in" value="${esc(t.manager.name)}" maxlength="12" data-tf="managerName"><input class="in num" type="number" inputmode="numeric" min="0" max="99" value="${t.manager.num}" data-tf="managerNum"></div></label>
          <label class="fld">중계에서 부르는 이름
            <div class="row"><input class="in" value="${esc(t.call)}" maxlength="16" data-tf="call"><button class="btn small" data-act="sayTeam" data-team="${t.id}">🔊</button></div></label>
          <div class="row colors">
            <label class="fld">유니폼 색<input type="color" value="${t.color}" data-tf="color"></label>
            <label class="fld">번호 색<input type="color" value="${t.color2}" data-tf="color2"></label>
            <div class="mini-fig">${Art.player(t, t.batters[0].num, 'bat')}</div>
          </div>
        </section>
        <section class="panel edit-players">
          <div class="panel-head"><h3>타자 (위에서부터 타순)</h3>
            <div class="row">
              <button class="btn small" data-act="go" data-to="lineup" data-team="${t.id}" data-back="teamEdit">👆 타순 바꾸기</button>
              <button class="btn small" data-act="bulk" data-team="${t.id}">📝 이름 한꺼번에 쓰기</button>
            </div></div>
          <table class="ptable"><thead><tr><th></th><th>이름</th><th>번호</th><th>포지션</th><th>파워</th><th>정확도</th></tr></thead>
            <tbody>${t.batters.map(brow).join('')}</tbody></table>
          <div class="panel-head"><h3>선발 투수 (▶ 다음 경기 선발)</h3></div>
          <table class="ptable"><thead><tr><th></th><th>이름</th><th>번호</th><th>구위</th></tr></thead>
            <tbody>${t.pitchers.map(prow).join('')}</tbody></table>
          <p class="small-note">파워 ★ 많을수록 홈런·장타, 정확도 ★ 많을수록 안타, 구위 ★ 많을수록 삼진·범타가 잘 나와요.</p>
        </section>
      </div>
    </div>`;
  },

  /* ---------- 순위표 ---------- */
  standings() {
    const rows = Season.table(), S = DB.season, my = DB.settings.myTeam;
    const days = [...new Set(S.log.map(g => g.day))].sort((a, b) => b - a).slice(0, 5);
    const T = id => DB.team(id) || { short: id, color: '#555', color2: '#fff' };
    return `<div class="screen standings">${header('🏆 순위표', 'home', `<button class="btn small ghost" data-act="resetSeason">시즌 새로 시작</button>`)}
      <div class="st-body">
        <section class="panel">
          <table class="table st">
            <thead><tr><th>순위</th><th class="l">팀</th><th>경기</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>게임차</th><th>득점</th><th>실점</th></tr></thead>
            <tbody>${rows.map(r => `<tr class="${r.id === my ? 'mine' : ''}">
              <td class="rank">${r.rank}</td>
              <td class="l team-cell">${Art.logo(r.team, 'xs')} ${esc(r.team.name)}</td>
              <td>${r.g}</td><td>${r.w}</td><td>${r.l}</td><td>${r.d}</td>
              <td>${r.w + r.l ? r.pct.toFixed(3).replace(/^0/, '') : '-'}</td><td>${r.gb === 0 ? '-' : r.gb.toFixed(1)}</td>
              <td>${r.rs}</td><td>${r.ra}</td></tr>`).join('')}</tbody>
          </table>
        </section>
        <section class="panel recent">
          <h3>최근 경기 결과</h3>
          ${days.length ? days.map(d => `<div class="day"><div class="day-h">${d}일째</div>${S.log.filter(g => g.day === d).map(g => `
            <div class="res">
              <span class="t ${g.as > g.hs ? 'win' : ''}">${Art.logo(T(g.a), 'xs')} ${esc(T(g.a).short)}</span>
              <b>${g.as} : ${g.hs}</b>
              <span class="t ${g.hs > g.as ? 'win' : ''}">${esc(T(g.h).short)} ${Art.logo(T(g.h), 'xs')}</span>
            </div>`).join('')}</div>`).join('') : '<p class="empty">아직 경기가 없어요</p>'}
        </section>
      </div>
    </div>`;
  },

  /* ---------- 선수 기록 ---------- */
  stats({ tab }) {
    const S = DB.season;
    tab = tab || 'leaders';
    const tabs = `<div class="tabs"><button class="${tab === 'leaders' ? 'on' : ''}" data-act="go" data-to="stats" data-tab="leaders">👑 1등 선수</button>${DB.teams.map(t =>
      `<button class="${tab === t.id ? 'on' : ''}" data-act="go" data-to="stats" data-tab="${t.id}">${Art.logo(t, 'xs')}</button>`).join('')}</div>`;
    let body = '';
    if (tab === 'leaders') {
      const bats = [], pits = [];
      DB.teams.forEach(t => {
        const rec = S.standings[t.id] || {}; const tg = (rec.w || 0) + (rec.l || 0) + (rec.d || 0);
        t.batters.forEach(b => { const s = S.bat[b.id]; if (s) bats.push({ b, t, s, tg }); });
        t.pitchers.forEach(p => { const s = S.pit[p.id]; if (s) pits.push({ p, t, s }); });
      });
      const board = (title, list, val, fmt = v => v) => `<div class="lb panel"><h3>${title}</h3>${list.length ? list.map((x, i) => `
        <div class="lb-row"><span class="lb-rank">${i + 1}</span>${Art.logo(x.t, 'xs')}<span class="lb-name">${esc((x.b || x.p).name)}</span><b>${fmt(val(x))}</b></div>`).join('') : '<p class="empty">기록 없음</p>'}</div>`;
      const top = (arr, f, n = 5) => arr.filter(x => f(x) > 0).sort((a, b) => f(b) - f(a)).slice(0, n);
      const qual = bats.filter(x => x.s.pa >= Math.max(3, x.tg * 2));
      body = `<div class="lb-grid">
        ${board('타율', qual.sort((a, b) => b.s.h / (b.s.ab || 1) - a.s.h / (a.s.ab || 1)).slice(0, 5), x => avg(x.s.h, x.s.ab))}
        ${board('홈런', top(bats, x => x.s.hr), x => x.s.hr)}
        ${board('타점', top(bats, x => x.s.rbi), x => x.s.rbi)}
        ${board('안타', top(bats, x => x.s.h), x => x.s.h)}
        ${board('다승', top(pits, x => x.s.w), x => x.s.w)}
        ${board('탈삼진', top(pits, x => x.s.so), x => x.s.so)}
      </div>`;
    } else {
      const t = DB.team(tab);
      const z = { g: 0, pa: 0, ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, so: 0 };
      const pz = { g: 0, w: 0, l: 0, outs: 0, h: 0, r: 0, bb: 0, so: 0, hr: 0 };
      body = `<section class="panel"><h3>${Art.logo(t, 'xs')} ${esc(t.name)} 타자</h3>
        <table class="table"><thead><tr><th>타순</th><th class="l">이름</th><th>경기</th><th>타수</th><th>안타</th><th>2루타</th><th>3루타</th><th>홈런</th><th>타점</th><th>득점</th><th>볼넷</th><th>삼진</th><th>타율</th></tr></thead>
        <tbody>${t.batters.map((b, i) => { const s = S.bat[b.id] || z; return `<tr><td>${i + 1}</td><td class="l">${esc(b.name)} <small>#${b.num}</small></td><td>${s.g}</td><td>${s.ab}</td><td>${s.h}</td><td>${s.d}</td><td>${s.t}</td><td>${s.hr}</td><td>${s.rbi}</td><td>${s.r}</td><td>${s.bb}</td><td>${s.so}</td><td><b>${avg(s.h, s.ab)}</b></td></tr>`; }).join('')}</tbody></table>
        <h3>투수</h3>
        <table class="table"><thead><tr><th class="l">이름</th><th>경기</th><th>승</th><th>패</th><th>이닝</th><th>피안타</th><th>실점</th><th>볼넷</th><th>삼진</th><th>평균자책</th></tr></thead>
        <tbody>${t.pitchers.map(p => { const s = S.pit[p.id] || pz; return `<tr><td class="l">${esc(p.name)} <small>#${p.num}</small></td><td>${s.g}</td><td>${s.w}</td><td>${s.l}</td><td>${ipText(s.outs)}</td><td>${s.h}</td><td>${s.r}</td><td>${s.bb}</td><td>${s.so}</td><td>${s.outs ? ((s.r * 27) / s.outs).toFixed(2) : '-'}</td></tr>`; }).join('')}</tbody></table>
      </section>`;
    }
    return `<div class="screen stats">${header('📊 선수 기록')}${tabs}<div class="stats-body">${body}</div></div>`;
  },

  /* ---------- 설정 ---------- */
  settings() {
    const s = DB.settings;
    const tog = (k, label) => `<div class="set-row"><span>${label}</span><button class="toggle ${s[k] ? 'on' : ''}" data-act="toggleSet" data-k="${k}"><i></i></button></div>`;
    return `<div class="screen settings">${header('⚙️ 설정')}
      <div class="set-body">
        <section class="panel">
          <h3>소리</h3>
          ${tog('voice', '🎙️ 음성 중계')}
          <div class="set-row"><span>말하기 빠르기</span>
            <div class="row"><input type="range" min="0.7" max="1.4" step="0.05" value="${s.rate}" data-set="rate"><button class="btn small" data-act="testVoice">🔊 들어보기</button></div></div>
          ${tog('sfx', '🎵 효과음')}
          ${tog('bgm', '🎶 배경음 (메뉴 음악 · 경기장 관중 소리)')}
          <p class="small-note">아이패드 옆 무음 스위치(또는 무음 모드)가 켜져 있으면 효과음이 안 들릴 수 있어요.</p>
        </section>
        <section class="panel">
          <h3>경기</h3>
          <div class="set-row"><span>⭐ 우리 팀</span><select class="in" data-set="myTeam">${DB.teams.map(t => `<option value="${t.id}" ${t.id === s.myTeam ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
          <div class="set-row"><span>💪 우리 팀 힘내기<br><small class="small-note">우리 팀이 더 잘 치고 잘 막아요</small></span>
            <div class="seg light">${[['없음', 0], ['조금', 1], ['많이', 2]].map(([l, v]) =>
              `<button class="${(s.favBoost | 0) === v ? 'on' : ''}" data-act="favBoost" data-v="${v}">${l}</button>`).join('')}</div></div>
          ${tog('simOthers', '🏟️ 다른 팀 경기도 자동으로 하기 (순위표)')}
        </section>
        <section class="panel">
          <h3>데이터</h3>
          <div class="btn-row">
            <button class="btn small" data-act="exportData">💾 백업 파일 저장</button>
            <label class="btn small">📂 백업 불러오기<input type="file" accept=".json,application/json" data-import hidden></label>
            <button class="btn small" data-act="reloadConfig">📄 config.js 다시 적용</button>
          </div>
          <div class="btn-row">
            <button class="btn small danger" data-act="resetSeason">시즌 기록 지우기</button>
            <button class="btn small danger" data-act="resetAll">모두 처음으로</button>
          </div>
        </section>
      </div>
    </div>`;
  },
};

const Mount = {
  game() { Game.mount(); },
};

function setupState() {
  if (!App.setup) {
    const my = DB.settings.myTeam;
    const opp = (DB.teams.find(t => t.id !== my) || DB.teams[1]).id;
    App.setup = { away: opp, home: my, ctrl: { away: 'human', home: 'human' }, pit: {}, day: -1 };
  }
  const S = App.setup;
  if (!DB.team(S.away)) S.away = DB.teams[0].id;
  if (!DB.team(S.home) || S.home === S.away) S.home = DB.teams.find(t => t.id !== S.away).id;
  if (S.day !== DB.season.day) {         // 경기가 끝나면 다음 선발로
    S.pit.away = DB.team(S.away).rotation; S.pit.home = DB.team(S.home).rotation; S.day = DB.season.day;
  }
  return S;
}

/* ================= 경기 진행 ================= */
const POS_SHORT = { '포수': '포수', '1루수': '1루', '2루수': '2루', '3루수': '3루', '유격수': '유격', '좌익수': '좌익', '중견수': '중견', '우익수': '우익', '지명타자': '지명' };
const CHIP = {
  '1B': ['안타', 'hit'], '2B': ['2루타', 'hit2'], '3B': ['3루타', 'hit2'], HR: ['홈런', 'hr'], walk: ['볼넷', 'bb'], so: ['삼진', 'k'],
  ground: ['땅볼', 'out'], fly: ['뜬공', 'out'], line: ['직선타', 'out'], dp: ['병살', 'out'], sf: ['희플', 'sf'],
};
const CONTACT = ['foul', 'ground', 'dp', 'fly', 'sf', 'line', '1B', '2B', '3B', 'HR'];

const Game = {
  G: null, phase: 'busy', wheel: null, segs: [], tok: 0, seq: 0, fresh: false, paused: false, luSide: null,

  loadSaved() { const g = Store.get('game', null); return g && !g.over ? g : null; },
  save() { if (this.G && !this.G.over) Store.set('game', this.G); },
  clearSaved() { Store.del('game'); },

  start(G, fresh) { this.G = G; this.fresh = fresh; this.save(); App.go('game'); },

  leave() {
    this.tok++; Voice.cancel();
    if (this.wheel) { this.wheel.destroy(); this.wheel = null; }
  },
  alive(t) { return t === this.tok && App.screen === 'game'; },

  // CPU 행동 예약 (일시정지·화면 이동하면 취소)
  later(fn, ms) {
    const t = this.tok, s = this.seq;
    const run = () => {
      if (!this.alive(t) || this.seq !== s) return;
      if (this.paused) { setTimeout(run, 400); return; }
      fn();
    };
    setTimeout(run, ms);
  },

  mount() {
    if (this.wheel) this.wheel.destroy();
    const t = ++this.tok;
    this.paused = false; this.phase = 'busy'; this.luSide = null;
    const A = this.G.teams.away, H = this.G.teams.home;
    $('#f-bg').innerHTML = Field.background([A.color, A.color2, H.color, H.color2]);
    this.wheel = new Wheel($('#wheel'));
    this.refreshAll();
    this.setIdleWheel();
    this.intro(t);
  },

  player(pid) {
    for (const s of ['away', 'home']) { const b = this.G.teams[s].batters.find(x => x.id === pid); if (b) return b; }
    return { id: pid, name: '', num: '' };
  },
  pname(pid) { return this.player(pid).name; },

  /* ----- 그리기 ----- */
  refreshAll() {
    this.renderScoreboard(); this.renderCount(); this.renderMatchup(); this.renderLineup();
    this.renderFielders(); this.renderBatter(); this.renderRunners();
    this.updateButtons(); this.renderWheelTitle();
  },

  renderScoreboard() {
    const G = this.G, n = Math.max(G.innings, G.inning), bs = Engine.bat(G);
    const row = side => {
      const T = G.teams[side], L = G[side].line;
      let cells = '';
      for (let i = 0; i < n; i++) {
        const v = L[i];
        const cur = !G.over && G.inning === i + 1 && bs === side;
        const x = G.over && side === 'home' && i === n - 1 && v === undefined && G.winner === 'home';
        cells += `<td class="${cur ? 'cur' : ''}">${v === undefined ? (x ? 'X' : '') : v}</td>`;
      }
      return `<tr><th class="tm">${Art.logo(DB.team(T.id) || T, 'xs')}<span>${esc(T.short)}</span></th>${cells}<td class="r">${G[side].runs}</td><td class="h">${G[side].hits}</td></tr>`;
    };
    $('#sb').innerHTML = `<table><thead><tr><th></th>${Array.from({ length: n }, (_, i) => `<th>${i + 1}</th>`).join('')}<th class="r">R</th><th class="h">H</th></tr></thead>
      <tbody>${row('away')}${row('home')}</tbody></table>`;
  },

  renderCount(b = this.G.balls, s = this.G.strikes, o = this.G.outs) {
    const G = this.G;
    const dots = (n, max, cls) => Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on ' + cls : ''}"></i>`).join('');
    $('#count').innerHTML = `<div class="inn">${G.inning}회 ${G.half ? '말' : '초'} <span>${G.half ? '▼' : '▲'}</span></div>
      <div class="crow"><span>B</span>${dots(b, 3, 'b')}</div>
      <div class="crow"><span>S</span>${dots(s, 2, 's')}</div>
      <div class="crow"><span>O</span>${dots(o, 2, 'o')}</div>`;
  },

  renderMatchup() {
    const G = this.G, bs = Engine.bat(G), fs = Engine.fld(G);
    const Tb = G.teams[bs], Tf = G.teams[fs], b = Engine.batter(G), p = Tf.pitcher;
    const x = G.box[b.id], px = G.pbox[p.id];
    const today = x && x.pa ? `오늘 ${x.ab}타수 ${x.h}안타${x.hr ? ` ${x.hr}홈런` : ''}${x.rbi ? ` ${x.rbi}타점` : ''}` : '오늘 첫 타석';
    const pline = px ? `${ipText(px.outs)}이닝 ${px.so}삼진 ${px.r}실점` : '오늘 선발 투수';
    $('#matchup').innerHTML = `
      <div class="mu bat ${G.boost ? 'boost' : ''}" style="--tc:${Tb.color};--tc2:${Tb.color2}">
        ${Art.logo(DB.team(Tb.id) || Tb, 'sm')}
        <div class="mu-t"><small>${G[bs].idx + 1}번 타자 · ${b.pos} · #${b.num}</small><b>${esc(b.name)}</b><span>${today}</span></div>
      </div>
      <div class="mu-vs">VS</div>
      <div class="mu pit" style="--tc:${Tf.color};--tc2:${Tf.color2}">
        <div class="mu-t"><small>투수 · #${p.num}</small><b>${esc(p.name)}</b><span>${pline}</span></div>
        ${Art.logo(DB.team(Tf.id) || Tf, 'sm')}
      </div>`;
  },

  renderLineup() {
    const G = this.G, bs = Engine.bat(G);
    const side = this.luSide || bs, T = G.teams[side], batting = side === bs;
    const onBase = {};
    if (batting) G.bases.forEach((pid, i) => { if (pid) onBase[pid] = i; });
    const rows = T.batters.map((b, i) => {
      const x = G.box[b.id], log = (x && x.log) || [];
      const cur = batting && !G.over && G[side].idx === i;
      return `<li class="${cur ? 'cur' : ''}">
        <span class="lo">${i + 1}</span>
        <div class="lm">
          <div class="ln"><b>${esc(b.name)}</b><small>${POS_SHORT[b.pos] || ''}</small>${onBase[b.id] != null ? `<em>${onBase[b.id] + 1}루</em>` : ''}</div>
          ${log.length ? `<div class="chips">${log.map(k => CHIP[k] ? `<i class="${CHIP[k][1]}">${CHIP[k][0]}</i>` : '').join('')}</div>` : ''}
        </div></li>`;
    }).join('');
    $('#lineup').innerHTML = `
      <button class="lp-head" data-act="luToggle" style="--tc:${T.color};--tc2:${T.color2}">
        ${Art.logo(DB.team(T.id) || T, 'xs')}<span>${esc(T.short)} 라인업</span><em>${batting ? '공격' : '수비'}🔄</em>
      </button>
      <ol class="lp-list">${rows}</ol>
      <div class="lp-pit">⚾ 투수 <b>${esc(T.pitcher.name)}</b> #${T.pitcher.num}</div>
      ${mgrHTML(T.manager && T.manager.name ? T : DB.team(T.id), 'lp-mgr')}`;
  },

  renderFielders() { $('#f-fielders').innerHTML = Field.fielders(this.G.teams[Engine.fld(this.G)]); },

  renderBatter() {
    const G = this.G;
    $('#f-batter').innerHTML = G.over ? '' : Field.batter(G.teams[Engine.bat(G)], Engine.batter(G), G.boost);
  },

  renderRunners() {
    const G = this.G, T = G.teams[Engine.bat(G)];
    $('#f-runners').innerHTML = G.bases.map((pid, i) => (pid ? Field.runner(T, this.player(pid), i) : '')).join('');
    for (let i = 0; i < 3; i++) {
      const b = $('#f-base' + i);
      if (b) { b.setAttribute('fill', G.bases[i] ? '#ffd84d' : '#fff'); b.setAttribute('stroke', G.bases[i] ? '#ff9f00' : '#ccc'); }
    }
  },

  updateButtons() {
    const G = this.G, el = $('#btns'); if (!G || !el) return;
    if (G.over) { el.innerHTML = ''; return; }
    const bs = Engine.bat(G), fs = Engine.fld(G), Tb = G.teams[bs], Tf = G.teams[fs];
    const ready = this.phase === 'ready', spinning = this.phase === 'spin';
    const tag = T => `<span class="btn-team" style="background:${T.color};color:${T.color2};border-color:${T.color2}">${esc(T.short)}</span>`;
    let h = `<div class="pitch-tag">${tag(Tf)} 투수 <b>${esc(Tf.pitcher.name)}</b> ${spinning ? '던졌다!' : ready ? '던질 준비…' : ''}</div>`;
    if (G[bs].ctrl === 'human') {
      const left = Engine.unlimitedCheer(G) ? '무제한 ♾️' : ('🔥'.repeat(G[bs].cheers) || '다 썼어요');
      h += `<button class="act stop ${spinning ? 'go' : ''}" data-act="stop" ${spinning ? '' : 'disabled'}>${tag(Tb)}🏏 멈춰!</button>`;
      h += `<button class="act cheer ${G.boost ? 'active' : ''}" data-act="cheer" ${(ready || spinning) && Engine.canCheer(G) ? '' : 'disabled'}>
        ${G.boost ? '🔥 응원 중!' : `📣 응원하기 <small>${left}</small>`}</button>`;
    } else h += `<div class="cpu-tag">${tag(Tb)} 🤖 컴퓨터 타자</div>`;
    el.innerHTML = h;
  },

  renderWheelTitle() {
    const G = this.G;
    $('#wtitle').innerHTML = `${G.mode === 'pitch' ? '투구 룰렛' : '타석 룰렛'}${G.boost ? ' <span class="boost-tag">🔥 응원 효과!</span>' : ''}`;
  },

  setIdleWheel() {
    const G = this.G;
    this.segs = G.mode === 'pitch' ? Engine.pitchSegs(G) : Engine.atbatSegs(G);
    if (this.wheel) this.wheel.setSegments(this.segs);
    this.renderWheelTitle();
  },

  setCaption(text) { const c = $('#caption'); if (c) c.textContent = text; },

  popup(text, cls = '') {
    const p = $('#popup'); if (!p) return;
    p.className = 'popup'; void p.offsetWidth;
    p.textContent = text; p.className = 'popup show ' + cls;
  },

  showOverlay(html, cls = '') { const o = $('#ov'); if (o) { o.className = 'overlay ' + cls; o.innerHTML = html; } },
  hideOverlay() { const o = $('#ov'); if (o) { o.className = 'overlay hidden'; o.innerHTML = ''; } },

  /* ----- 야구장 애니메이션 ----- */
  async flyBall(type) {
    const tg = Field.target(type);
    const ball = $('#f-ball'), bl = $('#f-bl'), sh = $('#f-shadow');
    if (!tg || !ball) return;
    const [x0, y0] = [200, 286], [x1, y1] = tg.to;
    ball.setAttribute('opacity', '1');
    await tween(tg.ms, t => {
      const e = tg.arc ? t : 1 - (1 - t) * (1 - t);
      const x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e, up = tg.arc * 4 * t * (1 - t);
      sh.setAttribute('cx', x); sh.setAttribute('cy', y);
      bl.setAttribute('cx', x); bl.setAttribute('cy', y - up); bl.setAttribute('r', 3.4 + up / 40);
      if (tg.hr) ball.setAttribute('opacity', String(1 - Math.max(0, (t - 0.75) / 0.25)));
    });
    if (tg.pos) this.fielderJump(tg.pos);
    setTimeout(() => { const b = $('#f-ball'); if (b) b.setAttribute('opacity', '0'); }, tg.hr ? 0 : 700);
  },

  fielderJump(pos) {
    const g = $(`#f-fielders [data-pos="${pos}"]`); if (!g) return;
    const x = +g.dataset.x, y = +g.dataset.y;
    tween(420, t => g.setAttribute('transform', `translate(${x},${y - 10 * Math.sin(Math.PI * t)})`));
  },

  async animateMoves(moves, T) {
    const layer = $('#f-runners');
    if (!layer || !moves.length) return;
    if (moves.some(m => m.from === -1)) $('#f-batter').innerHTML = '';
    const list = moves.map(m => {
      let el = layer.querySelector(`[data-pid="${m.pid}"]`);
      if (!el) {
        layer.insertAdjacentHTML('beforeend', Field.runner(T, this.player(m.pid), m.from));
        el = layer.lastElementChild;
      }
      return { m, el };
    });
    const fade = el => tween(300, t => el.setAttribute('opacity', String(1 - t)));
    const steps = m => (m.to === 'out' ? 1 : m.to - m.from);
    const max = Math.max(...moves.map(steps));
    for (let s = 1; s <= max; s++) {
      await Promise.all(list.map(({ m, el }) => {
        if (m.to === 'out') return s === 1 ? fade(el) : null;
        if (m.from + s > m.to) return null;
        const a = Field.BASE[m.from + s - 1], b = Field.BASE[m.from + s];
        return tween(340, t => el.setAttribute('transform', `translate(${a[0] + (b[0] - a[0]) * t},${a[1] + 3 + (b[1] - a[1]) * t})`))
          .then(() => (m.from + s === 3 ? fade(el) : null));
      }));
    }
  },

  /* ----- 진행 ----- */
  async intro(t) {
    const G = this.G, A = G.teams.away, H = G.teams.home;
    if (this.fresh) {
      this.fresh = false;
      this.showOverlay(`<div class="banner"><div class="b-vs">${Art.logo(DB.team(A.id) || A, 'xl')}<span>VS</span>${Art.logo(DB.team(H.id) || H, 'xl')}</div><div class="b-big">플레이볼!</div></div>`, 'banner-ov');
      Sound.cheer(2.5, 0.25); Sound.charge();
      await Voice.speak(`${A.call} 대 ${H.call}의 경기, 지금 시작합니다!`);
      if (!this.alive(t)) return;
      await sleep(300);
      this.hideOverlay();
      await this.halfBanner(t);
    } else {
      this.setCaption('경기를 이어서 합니다!');
      await Voice.speak('경기를 이어서 합니다!');
    }
    if (!this.alive(t)) return;
    await this.announceBatter(t);
    this.ready(t);
  },

  async halfBanner(t) {
    const G = this.G, T = G.teams[Engine.bat(G)];
    const txt = `${G.inning}회 ${G.half ? '말' : '초'}`;
    this.showOverlay(`<div class="banner"><div class="b-logo">${Art.logo(DB.team(T.id) || T, 'xl')}</div><div class="b-big">${txt}</div><div class="b-sub">${esc(T.name)} 공격</div></div>`, 'banner-ov');
    Sound.inning(); Sound.claps();
    this.setCaption(`${txt}, ${T.name} 공격`);
    let say = `${txt}, ${T.call} 공격입니다.`;
    if (G.inning > G.innings) say = `연장 ${say}`;
    else if (G.inning === G.innings && G.half === 1) say = `마지막 공격! ${say}`;
    await Voice.speak(say);
    if (!this.alive(t)) return;
    await sleep(200);
    this.hideOverlay();
  },

  async announceBatter(t) {
    const G = this.G, side = Engine.bat(G), b = Engine.batter(G);
    this.renderMatchup(); this.renderLineup(); this.renderBatter(); this.updateButtons();
    this.setCaption(`${G[side].idx + 1}번 타자 ${b.pos} ${b.name}`);
    await Voice.speak(`${G[side].idx + 1}번 타자, ${b.pos}, ${b.name}!`);
  },

  async ready(t) {
    if (!this.alive(t)) return;
    const G = this.G;
    this.phase = 'ready'; this.seq++;
    this.save();
    this.setIdleWheel(); this.updateButtons();
    // 투수는 항상 자동으로 던져요. 사람은 타자만 해요.
    let wait = G[Engine.bat(G)].ctrl === 'cpu' ? 500 + Math.random() * 400 : 750;
    if (G[Engine.bat(G)].ctrl === 'cpu' && Engine.cpuCheer(G)) { this.doCheer(); wait += 900; }
    this.later(() => this.throw(), wait);
  },

  throw() {
    if (this.phase !== 'ready') return;
    const G = this.G;
    this.phase = 'spin'; this.seq++;
    this.segs = G.mode === 'pitch' ? Engine.pitchSegs(G) : Engine.atbatSegs(G);
    this.wheel.setSegments(this.segs);
    this.wheel.spin();
    Sound.whoosh();
    this.setCaption(choice(['투수, 던졌습니다!', '와인드업… 던졌습니다!', '투구!']));
    this.updateButtons();
    if (G[Engine.bat(G)].ctrl === 'cpu') this.later(() => this.stop(), 600 + Math.random() * 500);
  },

  async stop() {
    if (this.phase !== 'spin') return;
    const t = this.tok, G = this.G;
    this.phase = 'busy'; this.seq++; this.updateButtons();
    const idx = Engine.pick(this.segs), k = this.segs[idx].k;
    await this.wheel.stopAt(idx);
    if (!this.alive(t)) return;
    let r;
    if (G.mode === 'atbat') r = Engine.applyAtBat(G, k);
    else if (k === 'inplay') { const cs = Engine.contactSegs(G); r = Engine.applyContact(G, cs[Engine.pick(cs)].k); }
    else r = Engine.applyPitch(G, k);
    await this.narrate(r, t);
  },

  // 응원: 룰렛이 도는 중에도 누를 수 있고, 경기를 멈추지 않아요
  cheer() {
    const G = this.G;
    if ((this.phase !== 'ready' && this.phase !== 'spin') || G[Engine.bat(G)].ctrl !== 'human' || !Engine.canCheer(G)) return;
    this.doCheer();
  },

  doCheer() {
    const G = this.G, side = Engine.bat(G), T = G.teams[side], b = Engine.batter(G);
    if (!Engine.useCheer(G)) return;
    Sound.charge(); Sound.cheer(2.6, 0.22);
    this.popup('📣 응원!', 'cheer');
    Fx.confetti([T.color, T.color2, '#ffd84d'], 50);
    if (this.phase === 'spin') {          // 돌고 있는 룰렛의 칸이 바로 커져요
      this.segs = G.mode === 'pitch' ? Engine.pitchSegs(G) : Engine.atbatSegs(G);
      this.wheel.setSegments(this.segs);
      this.renderWheelTitle();
    } else this.setIdleWheel();
    this.renderMatchup(); this.renderBatter(); this.updateButtons();
    this.setCaption(`${T.name} 응원! 힘내라 ${b.name}!`);
    Voice.speak(`힘내라, ${b.name}!`);
  },

  async narrate(r, t) {
    const G = this.G, T = G.teams[r.side], nm = this.pname(r.batterId);

    // 공을 맞혔으면 타구가 날아가는 모습 먼저
    if (CONTACT.includes(r.type)) {
      Sound.crack();
      await this.flyBall(r.type);
      if (!this.alive(t)) return;
    }

    // 볼·스트라이크·파울: 짧게 외치고 바로 다음 공
    if (r.type === 'ball' || r.type === 'strike' || r.type === 'foul') {
      const full = r.balls === 3 && r.strikes === 2;
      const word = r.type === 'ball' ? '볼!' : r.type === 'foul' ? '파울!' : r.look ? '스트라이크!' : '헛스윙!';
      if (r.type !== 'foul') Sound.mitt();
      this.popup(r.type === 'ball' ? '볼' : r.type === 'foul' ? '파울' : word, r.type);
      this.renderCount();
      const text = word + (full ? ' 풀카운트!' : '');
      this.setCaption(text);
      Voice.quick(text);
      await sleep(full ? 1100 : 650);
      return this.ready(t);
    }

    const say = [];
    let pop = '', cls = '';
    switch (r.type) {
      case 'walk': pop = '볼넷!'; cls = 'ball'; Sound.mitt();
        say.push(r.runs.length ? '볼넷! 밀어내기!' : `볼넷! ${nm}, 1루로 걸어 나갑니다.`); break;
      case 'so': pop = '삼진!'; cls = 'out'; Sound.mitt(); Sound.out();
        say.push(choice(['삼진! 스트라이크 아웃!', '헛스윙 삼진!', '삼진 아웃!'])); break;
      case '1B': pop = '안타!'; cls = 'hit'; Sound.cheer(1.6);
        say.push(choice([`안타! ${nm}, 안타!`, '깨끗한 안타!', `${nm}, 안타!`])); break;
      case '2B': pop = '2루타!'; cls = 'hit'; Sound.cheer(2);
        say.push(choice([`2루타! ${nm}의 2루타!`, '쭉쭉 뻗어갑니다, 2루타!'])); break;
      case '3B': pop = '3루타!!'; cls = 'hit'; Sound.cheer(2.4);
        say.push(choice(['3루타! 3루까지 달립니다!', `${nm}, 3루타!`])); break;
      case 'HR': {
        const n = r.runs.length;
        const kind = n === 4 ? '만루 홈런' : n === 3 ? '쓰리런 홈런' : n === 2 ? '투런 홈런' : '솔로 홈런';
        pop = n === 4 ? '만루 홈런!!!' : '홈런!!!'; cls = 'hr';
        Sound.fanfare(); Sound.cheer(3.5, 0.3);
        Fx.confetti([T.color, T.color2, '#ffd84d', '#ffffff'], 140);
        say.push(choice(['홈런! 홈런입니다!', '넘어갑니다! 홈런!', '담장을 넘깁니다! 홈런!']));
        say.push(`${nm}의 ${kind}!`);
        break;
      }
      case 'ground': pop = '땅볼 아웃'; cls = 'out';
        say.push(choice(['땅볼! 1루에서 아웃!', '내야 땅볼, 아웃!'])); break;
      case 'dp': pop = '병살타!'; cls = 'out'; Sound.out();
        say.push('병살타! 아웃 두 개!'); break;
      case 'fly': pop = '뜬공 아웃'; cls = 'out';
        say.push(choice(['뜬공, 잡았습니다! 아웃!', '외야 뜬공, 아웃!'])); break;
      case 'sf': pop = '희생플라이!'; cls = 'hit';
        say.push('희생플라이! 3루 주자 홈인!'); break;
      case 'line': pop = '직선타 아웃'; cls = 'out';
        say.push(choice(['직선타! 잡았습니다, 아웃!', '날카로운 타구, 잡혔어요!'])); break;
    }

    if (r.runs.length) {
      Sound.cheer(2.4, 0.28); Sound.ding();
      say.push(`${T.call} ${r.runs.length}점! ${G.away.runs} 대 ${G.home.runs}.`);
    }
    if (['so', 'ground', 'fly', 'line', 'dp', 'sf'].includes(r.type) && !r.endHalf && !r.over) {
      if (r.outs === 1) say.push('원 아웃.'); else if (r.outs === 2) say.push('투 아웃.');
    }
    if (r.walkoff) say.push(`끝내기! 끝내기입니다! ${T.call} 승리!`);
    else if (r.endHalf && !r.over) say.push('쓰리 아웃! 공수 교대!');

    this.popup(pop, cls);
    this.renderCount(r.balls, r.strikes, r.endHalf ? 3 : r.outs);
    this.renderScoreboard();
    const anim = this.animateMoves(r.moves, T);
    const text = say.join(' ');
    this.setCaption(text);
    await Voice.speak(text);
    if (!this.alive(t)) return;
    await anim;
    if (!this.alive(t)) return;

    if (r.over) return this.gameOver(r, t);
    if (r.endHalf) {
      await sleep(200);
      this.luSide = null;
      this.refreshAll();
      await this.halfBanner(t);
      if (!this.alive(t)) return;
    } else this.refreshAll();
    if (r.paEnded) await this.announceBatter(t);
    this.ready(t);
  },

  async gameOver(r, t) {
    const G = this.G;
    this.phase = 'over';
    this.clearSaved();
    const others = Season.playDay(G);
    this.refreshAll();

    const A = G.teams.away, H = G.teams.home, W = G.winner ? G.teams[G.winner] : null;
    // 오늘의 MVP
    let mvp = null, best = -1;
    for (const side of G.winner ? [G.winner] : ['away', 'home']) {
      for (const b of G.teams[side].batters) {
        const x = G.box[b.id]; if (!x) continue;
        const sc = x.h + x.d * 0.5 + x.t + x.hr * 2 + x.rbi + x.r * 0.5 + x.bb * 0.3;
        if (sc > best) { best = sc; mvp = { b, side, x }; }
      }
    }
    const T = id => DB.team(id) || { short: id, color: '#555', color2: '#fff' };
    const mvpLine = mvp ? `${mvp.x.ab}타수 ${mvp.x.h}안타${mvp.x.hr ? ` ${mvp.x.hr}홈런` : ''}${mvp.x.rbi ? ` ${mvp.x.rbi}타점` : ''}` : '';

    this.showOverlay(`<div class="go-card" style="--tc:${W ? W.color : '#555'};--tc2:${W ? W.color2 : '#fff'}">
      <div class="go-title">${r.walkoff ? '끝내기 승리!' : '경기 종료'}</div>
      <div class="go-score">
        <div class="go-t ${G.winner === 'away' ? 'win' : ''}">${Art.logo(DB.team(A.id) || A, 'lg')}<span>${esc(A.short)}</span></div>
        <div class="go-num">${G.away.runs} : ${G.home.runs}</div>
        <div class="go-t ${G.winner === 'home' ? 'win' : ''}">${Art.logo(DB.team(H.id) || H, 'lg')}<span>${esc(H.short)}</span></div>
      </div>
      <div class="go-win">${W ? `🎉 ${esc(W.name)} 승리! 🎉` : '🤝 무승부!'}</div>
      ${mvp ? `<div class="go-mvp"><div class="mvp-fig">${Art.player(G.teams[mvp.side], mvp.b.num, 'bat')}</div>
        <div><div class="mvp-tag">오늘의 MVP</div><div class="mvp-name">${esc(mvp.b.name)}</div><div class="mvp-line">${mvpLine}</div></div></div>` : ''}
      ${others.length ? `<div class="go-other"><div class="go-oh">다른 구장 소식</div>${others.map(g =>
        `<span>${esc(T(g.a).short)} ${g.as}:${g.hs} ${esc(T(g.h).short)}</span>`).join('')}</div>` : ''}
      <div class="go-btns">
        <button class="btn mid" data-act="go" data-to="home">🏠 처음으로</button>
        <button class="btn mid primary" data-act="rematch">🔁 한 번 더!</button>
        <button class="btn mid" data-act="go" data-to="standings">🏆 순위 보기</button>
      </div>
    </div>`, 'go-ov');

    if (W) { Sound.fanfare(); Sound.cheer(4, 0.3); Fx.confetti([W.color, W.color2, '#ffd84d', '#fff'], 160); }
    else Sound.sad();
    const lines = [];
    lines.push(W ? `경기 종료! ${G.away.runs} 대 ${G.home.runs}, ${W.call} 승리!` : `경기 종료! ${G.away.runs} 대 ${G.home.runs}, 무승부입니다!`);
    if (mvp) lines.push(`오늘의 MVP는 ${mvp.b.name} 선수입니다!`);
    for (const s of lines) { if (!this.alive(t)) return; this.setCaption(s); await Voice.speak(s); }
  },

  menu() {
    if (!this.G || this.G.over) return;
    this.paused = true;
    this.showOverlay(`<div class="menu-card">
      <h3>잠깐 멈춤</h3>
      <button class="btn big primary" data-act="gResume">▶️ 계속하기</button>
      <div class="row">
        <button class="btn mid" data-act="gToggle" data-k="voice">${DB.settings.voice ? '🎙️ 중계 끄기' : '🎙️ 중계 켜기'}</button>
        <button class="btn mid" data-act="gToggle" data-k="sfx">${DB.settings.sfx ? '🎵 효과음 끄기' : '🎵 효과음 켜기'}</button>
        <button class="btn mid" data-act="gToggle" data-k="bgm">${DB.settings.bgm ? '🎶 배경음 끄기' : '🎶 배경음 켜기'}</button>
      </div>
      <button class="btn mid" data-act="gLater">💾 나중에 이어하기 (처음 화면으로)</button>
      <button class="btn mid danger" data-act="gQuit">🗑️ 경기 그만하기 (기록 안 남아요)</button>
    </div>`, 'menu-ov');
  },
};

/* ================= 버튼 동작 ================= */
const Actions = {
  go(el) {
    const { act, to, ...p } = el.dataset;
    App.go(to, p);
  },
  resume() { const G = Game.loadSaved(); if (G) Game.start(G, false); },

  pickTeam(el) {
    const S = App.setup, side = el.dataset.side, other = side === 'away' ? 'home' : 'away';
    if (S[other] === el.dataset.id) { S[other] = S[side]; S.pit[other] = DB.team(S[other]).rotation; }
    S[side] = el.dataset.id; S.pit[side] = DB.team(S[side]).rotation;
    render();
  },
  ctrl(el) { App.setup.ctrl[el.dataset.side] = el.dataset.v; render(); },
  cyclePitcher(el) {
    const S = App.setup, s = el.dataset.side, t = DB.team(S[s]);
    S.pit[s] = (S.pit[s] + 1) % t.pitchers.length; render();
  },
  innings(el) { DB.settings.innings = +el.dataset.v; DB.saveSettings(); render(); },
  mode(el) { DB.settings.mode = el.dataset.v; DB.saveSettings(); render(); },
  playball() {
    const S = setupState();
    if (Game.loadSaved() && !confirm('이어서 할 수 있는 경기가 있어요.\n그 경기는 지우고 새 경기를 시작할까요?')) return;
    const G = Engine.newGame(DB.team(S.away), DB.team(S.home),
      { innings: DB.settings.innings, mode: DB.settings.mode, ctrl: { ...S.ctrl }, pit: { ...S.pit }, fav: DB.settings.myTeam, favLvl: DB.settings.favBoost });
    Game.start(G, true);
  },

  luToggle() {
    const G = Game.G; if (!G) return;
    const shown = Game.luSide || Engine.bat(G);
    const next = shown === 'away' ? 'home' : 'away';
    Game.luSide = next === Engine.bat(G) ? null : next;
    Game.renderLineup();
  },
  favBoost(el) { DB.settings.favBoost = +el.dataset.v; DB.saveSettings(); render(); },
  stop() { Game.stop(); },
  cheer() { Game.cheer(); },
  gmenu() { Game.menu(); },
  gResume() { Game.paused = false; Game.hideOverlay(); },
  gToggle(el) {
    const k = el.dataset.k; DB.settings[k] = !DB.settings[k]; DB.saveSettings();
    if (k === 'voice' && !DB.settings.voice) Voice.cancel();
    if (k === 'bgm') Sound.bgm('game');
    Game.menu();
  },
  gLater() { Game.save(); Game.paused = false; App.go('home'); },
  gQuit() {
    if (!confirm('경기를 그만할까요? 이 경기는 기록에 남지 않아요.')) return;
    Game.clearSaved(); Game.paused = false; App.go('home');
  },
  rematch() {
    const G = Game.G;
    const A = DB.team(G.teams.away.id), H = DB.team(G.teams.home.id);
    if (!A || !H) return App.go('setup');
    const NG = Engine.newGame(A, H, { innings: G.innings, mode: G.mode, ctrl: { away: G.away.ctrl, home: G.home.ctrl }, pit: { away: A.rotation, home: H.rotation }, fav: DB.settings.myTeam, favLvl: DB.settings.favBoost });
    Game.start(NG, true);
  },

  luTap(el) {
    const t = DB.team(el.dataset.team), i = +el.dataset.i;
    if (App.luSel == null) { App.luSel = i; Sound.tick(); }
    else if (App.luSel === i) App.luSel = null;
    else {
      const a = App.luSel;
      [t.batters[a], t.batters[i]] = [t.batters[i], t.batters[a]];
      DB.saveTeams(); App.luSel = null;
      Sound.mitt();
      Voice.speak(`${i + 1}번 타자 ${t.batters[i].name}, ${a + 1}번 타자 ${t.batters[a].name}`);
    }
    render();
  },

  star(el) {
    const t = DB.team($('.edit').dataset.team);
    const list = el.dataset.kind === 'b' ? t.batters : t.pitchers;
    const v = +el.dataset.v;
    list[+el.dataset.i][el.dataset.f] = v;
    DB.saveTeams();
    el.parentNode.querySelectorAll('b').forEach(b => b.classList.toggle('on', +b.dataset.v <= v));
  },

  sayTeam(el) { const t = DB.team(el.dataset.team); Voice.speak(`${t.call} 공격입니다!`); },

  logoDel(el) {
    const t = DB.team(el.dataset.team);
    if (!confirm('로고를 지울까요?')) return;
    t.logo = ''; DB.saveTeams(); render();
  },

  bulk(el) {
    const t = DB.team(el.dataset.team);
    Modal.open(`<h3>📝 이름 한꺼번에 쓰기 — ${esc(t.name)}</h3>
      <p class="small-note">한 줄에 한 명씩, <b>이름 등번호 포지션</b> 순서로 적어요. 번호랑 포지션은 빼도 돼요.<br>예) 홍길동 25 중견수</p>
      <div class="bulk">
        <label>타자 9명 (위에서부터 타순)<textarea id="bulkB" rows="9">${t.batters.map(b => `${b.name} ${b.num} ${b.pos}`).join('\n')}</textarea></label>
        <label>선발투수 5명<textarea id="bulkP" rows="5">${t.pitchers.map(p => `${p.name} ${p.num}`).join('\n')}</textarea></label>
      </div>
      <div class="btn-row right">
        <button class="btn small ghost-dark" data-act="modalClose">취소</button>
        <button class="btn small primary" data-act="bulkSave" data-team="${t.id}">저장</button>
      </div>`);
  },
  bulkSave(el) {
    const t = DB.team(el.dataset.team);
    const parse = line => {
      const out = { name: [] };
      line.trim().split(/\s+/).forEach(tok => {
        if (POSITIONS.includes(tok)) out.pos = tok;
        else if (/^#?\d{1,2}$/.test(tok) && out.name.length) out.num = +tok.replace('#', '');
        else out.name.push(tok);
      });
      out.name = out.name.join(' ');
      return out;
    };
    const lines = id => $(id).value.split('\n').map(s => s.trim()).filter(Boolean);
    lines('#bulkB').slice(0, 9).forEach((l, i) => {
      const x = parse(l), b = t.batters[i];
      if (x.name) b.name = x.name.slice(0, 12); if (x.num != null) b.num = x.num; if (x.pos) b.pos = x.pos;
    });
    lines('#bulkP').slice(0, 5).forEach((l, i) => {
      const x = parse(l), p = t.pitchers[i];
      if (x.name) p.name = x.name.slice(0, 12); if (x.num != null) p.num = x.num;
    });
    DB.saveTeams(); Modal.close(); render(); toast('저장했어요!');
  },
  modalClose() { Modal.close(); },

  toggleSet(el) { const k = el.dataset.k; DB.settings[k] = !DB.settings[k]; DB.saveSettings(); render(); },
  testVoice() { Voice.speak('4번 타자, 1루수, 홍길동! 쳤습니다! 홈런! 홈런입니다!'); },

  exportData() {
    const data = JSON.stringify({ app: 'kbb', v: 1, teams: DB.teams, settings: DB.settings, season: DB.season }, null, 1);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = `우리집야구_백업_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },
  reloadConfig() {
    if (!confirm('config.js 파일의 팀·선수 정보로 바꿀까요?\n(앱에서 넣은 로고 사진과 시즌 기록은 그대로 둬요)')) return;
    DB.reloadConfig(); toast('config.js를 다시 적용했어요'); render();
  },
  resetSeason() {
    if (!confirm('시즌 순위와 선수 기록을 모두 지우고 새 시즌을 시작할까요?')) return;
    DB.season = Season.blank(); Season.ensure(); DB.saveSeason(); toast('새 시즌 시작!'); render();
  },
  resetAll() {
    if (!confirm('팀·선수·기록·설정을 모두 처음 상태로 되돌릴까요?\n(되돌릴 수 없어요)')) return;
    ['teams', 'settings', 'season', 'game', 'cfghash'].forEach(k => Store.del(k));
    location.reload();
  },
};

/* ================= 입력 처리 ================= */
function onField(el) {
  if (el.dataset.set) {
    const k = el.dataset.set;
    DB.settings[k] = k === 'rate' ? +el.value : el.value;
    DB.saveSettings();
    if (k === 'myTeam') App.setup = null;
    return;
  }
  const t = DB.team($('.edit') && $('.edit').dataset.team); if (!t) return;
  if (el.dataset.tf === 'managerName' || el.dataset.tf === 'managerNum') {   // 감독은 비워도 돼요
    if (el.dataset.tf === 'managerName') t.manager.name = el.value.trim();
    else t.manager.num = el.value.trim() === '' ? '' : numOr(el.value, t.manager.num);
    DB.saveTeams();
    return;
  }
  if (el.dataset.tf) {
    const k = el.dataset.tf, v = el.value.trim();
    if (!v) { render(); return; }
    t[k] = v; DB.saveTeams();
    if (k === 'color' || k === 'color2' || k === 'short') render();
    return;
  }
  const list = el.dataset.kind === 'b' ? t.batters : t.pitchers;
  const p = list[+el.dataset.i], f = el.dataset.f;
  if (f === 'num') p.num = numOr(el.value, p.num);
  else if (f === 'name') p.name = el.value.trim() || p.name;
  else p[f] = el.value;
  DB.saveTeams();
}

function readLogo(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const S = 256, sc = Math.min(S / img.width, S / img.height, 1);
        const w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        res(c.toDataURL('image/png'));
      };
      img.onerror = rej; img.src = fr.result;
    };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}

async function onLogo(el) {
  const f = el.files && el.files[0]; if (!f) return;
  try {
    const t = DB.team(el.dataset.logo);
    t.logo = await readLogo(f);
    if (DB.saveTeams() !== false) toast('로고를 넣었어요!');
    render();
  } catch (e) { toast('그림을 읽지 못했어요'); }
}

function onImport(el) {
  const f = el.files && el.files[0]; if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const d = JSON.parse(fr.result);
      if (d.app !== 'kbb' || !Array.isArray(d.teams)) throw new Error('bad');
      if (!confirm('백업 파일로 바꿀까요? 지금 데이터는 덮어써져요.')) return;
      DB.teams = d.teams.map(normTeam); DB.settings = Object.assign(DB.settings, d.settings || {});
      DB.season = d.season || Season.blank(); Season.ensure();
      DB.saveTeams(); DB.saveSettings(); DB.saveSeason(); App.setup = null;
      toast('불러왔어요!'); render();
    } catch (e) { toast('백업 파일이 아니에요'); }
  };
  fr.readAsText(f);
}

/* ================= 시작 ================= */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = Actions[el.dataset.act];
  if (!['stop', 'cheer', 'star', 'luTap'].includes(el.dataset.act)) Sound.tap();
  if (fn) fn(el, e);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.matches('[data-logo]')) return onLogo(el);
  if (el.matches('[data-import]')) return onImport(el);
  if (el.dataset.f || el.dataset.tf || el.dataset.set) onField(el);
});
let unlocked = false;
document.addEventListener('pointerdown', () => {
  if (unlocked) return; unlocked = true;
  Sound.unlock(); Voice.unlock();
  Sound.bgm(App.screen);
}, { capture: true });
document.addEventListener('gesturestart', e => e.preventDefault());

DB.init();
render();
