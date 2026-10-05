/* 야구장 그림 (SVG 400 x 345) — 관중석, 외야, 내야, 베이스, 선수 위치, 타구 */

const Field = (() => {
  const W = 400, HGT = 345;
  const HOME = [200, 292];
  const R = 255;                      // 홈에서 외야 담장까지
  const rad = d => (d * Math.PI) / 180;
  const polar = (r, deg) => [HOME[0] + r * Math.sin(rad(deg)), HOME[1] - r * Math.cos(rad(deg))];

  // 베이스 (-1 = 타석, 0 = 1루, 1 = 2루, 2 = 3루, 3 = 홈)
  const BASE = { '-1': [200, 296], 0: [270, 226], 1: [200, 156], 2: [130, 226], 3: [200, 296] };

  // 수비 위치 (발밑 좌표)
  const POS = {
    '투수': [200, 236], '포수': [200, 332],
    '1루수': [292, 204], '2루수': [244, 174], '유격수': [156, 174], '3루수': [108, 204],
    '좌익수': [88, 124], '중견수': [200, 86], '우익수': [312, 124],
  };
  const BATTER = [174, 300];

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pickOf = arr => arr[Math.floor(Math.random() * arr.length)];

  // 페어 지역(부채꼴) 안인지
  function inFair(x, y, margin = 0) {
    const dx = x - HOME[0], dy = HOME[1] - y;
    const r = Math.hypot(dx, dy);
    const th = Math.abs(Math.atan2(dx, dy) * 180 / Math.PI);
    return dy > -margin && th <= 45 + margin / 4 && r <= R + margin;
  }

  // 고정 배경 (관중석·잔디·내야·라인)
  function background(colors) {
    const [lp, rp] = [polar(R, -45), polar(R, 45)];
    const fan = `M${HOME[0]} ${HOME[1]} L${lp[0]} ${lp[1]} A${R} ${R} 0 0 1 ${rp[0]} ${rp[1]} Z`;

    // 관중
    let crowd = '';
    const palette = [...colors, '#ffd84d', '#ffffff', '#ff8787', '#74c0fc', '#ffa94d', '#8ce99a'];
    for (let i = 0; i < 700; i++) {
      const x = rnd(0, W), y = rnd(0, HGT);
      if (inFair(x, y, 14) || y > 318) continue;
      crowd += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rnd(1.6, 2.6).toFixed(1)}" fill="${pickOf(palette)}" opacity="${rnd(.55, .95).toFixed(2)}"/>`;
    }

    // 잔디 줄무늬
    let stripes = '';
    for (let r = R, i = 0; r > 40; r -= 24, i++) {
      stripes += `<circle cx="${HOME[0]}" cy="${HOME[1]}" r="${r}" fill="${i % 2 ? '#3f9f50' : '#47ab58'}"/>`;
    }

    const [b1, b2, b3] = [BASE[0], BASE[1], BASE[2]];
    const base = (p, i) => `<rect id="f-base${i}" x="${p[0] - 5}" y="${p[1] - 5}" width="10" height="10" transform="rotate(45 ${p[0]} ${p[1]})" fill="#fff" stroke="#ccc" stroke-width="1"/>`;

    return `
      <defs><clipPath id="f-fan"><path d="${fan}"/></clipPath></defs>
      <rect x="0" y="0" width="${W}" height="${HGT}" fill="#162a4f"/>
      <rect x="0" y="318" width="${W}" height="${HGT - 318}" fill="#203a66"/>
      ${crowd}
      <g clip-path="url(#f-fan)">
        ${stripes}
        <circle cx="${HOME[0]}" cy="${HOME[1]}" r="${R}" fill="none" stroke="#b9875a" stroke-width="16"/>
        <circle cx="200" cy="222" r="92" fill="#c8945a"/>
        <path d="M200 280 L258 222 L200 166 L142 222 Z" fill="#46aa57"/>
      </g>
      <circle cx="${HOME[0]}" cy="${HOME[1] + 2}" r="20" fill="#c8945a"/>
      <path d="M${lp[0]} ${lp[1]} A${R} ${R} 0 0 1 ${rp[0]} ${rp[1]}" fill="none" stroke="#174a2a" stroke-width="5"/>
      <path d="M${lp[0]} ${lp[1]} A${R} ${R} 0 0 1 ${rp[0]} ${rp[1]}" fill="none" stroke="#ffd84d" stroke-width="1.5" transform="translate(0,-2.5)"/>
      <line x1="${HOME[0]}" y1="${HOME[1]}" x2="${lp[0]}" y2="${lp[1]}" stroke="#fff" stroke-width="1.6"/>
      <line x1="${HOME[0]}" y1="${HOME[1]}" x2="${rp[0]}" y2="${rp[1]}" stroke="#fff" stroke-width="1.6"/>
      <line x1="${lp[0]}" y1="${lp[1]}" x2="${lp[0]}" y2="${lp[1] - 26}" stroke="#ffd84d" stroke-width="2.5"/>
      <line x1="${rp[0]}" y1="${rp[1]}" x2="${rp[0]}" y2="${rp[1] - 26}" stroke="#ffd84d" stroke-width="2.5"/>
      <path d="M${b1[0]} ${b1[1]} L${b2[0]} ${b2[1]} L${b3[0]} ${b3[1]}" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="1"/>
      <circle cx="200" cy="228" r="10" fill="#d4a06a"/>
      <rect x="196" y="226.5" width="8" height="2.2" fill="#fff"/>
      <rect x="183" y="284" width="9" height="16" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="1"/>
      <rect x="208" y="284" width="9" height="16" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="1"/>
      ${base(b1, 0)}${base(b2, 1)}${base(b3, 2)}
      <path d="M195 291 L205 291 L205 295 L200 299 L195 295 Z" fill="#fff"/>`;
  }

  function label(text, y, cls = '') {
    return `<text class="fl ${cls}" x="0" y="${y}" text-anchor="middle">${esc(text)}</text>`;
  }

  // 수비수 9명 (지명타자 제외 + 투수)
  function fielders(T) {
    const used = {};
    let out = '';
    const put = (key, p, pose, h) => {
      const [x0, y0] = POS[key];
      const n = used[key] = (used[key] || 0) + 1;
      const x = x0 + (n - 1) * 16;
      out += `<g class="fielder" data-pos="${key}" data-x="${x}" data-y="${y0}" transform="translate(${x},${y0})">
        ${Art.figure(T, p.num, pose, h)}${label(p.name, 9)}</g>`;
    };
    T.batters.forEach(b => { if (POS[b.pos] && b.pos !== '투수') put(b.pos, b, 'field', b.pos === '포수' ? 32 : 40); });
    put('투수', T.pitcher, 'pitch', 42);
    return out;
  }

  function batter(T, b, boost) {
    const [x, y] = BATTER;
    return `<g transform="translate(${x},${y})">
      ${boost ? '<ellipse class="aura" cx="0" cy="-24" rx="25" ry="30"/>' : ''}
      ${Art.figure(T, b.num, 'bat', 48)}${label(b.name, 9, 'cur')}</g>`;
  }

  function runner(T, p, idx) {
    const [x, y] = BASE[idx];
    const w = Math.max(24, String(p.name).length * 8.5 + 8);
    return `<g class="runner" data-pid="${p.id}" transform="translate(${x},${y + 3})">
      <ellipse cx="0" cy="0" rx="11" ry="3.5" fill="rgba(255,216,77,.75)"/>
      ${Art.figure(T, p.num, 'run', 34)}
      <rect x="${-w / 2}" y="2" width="${w}" height="11" rx="5.5" fill="${T.color}" stroke="${T.color2}" stroke-width="1"/>
      <text class="rl" x="0" y="10.6" text-anchor="middle" fill="${T.color2}">${esc(p.name)}</text></g>`;
  }

  // 타구가 날아갈 곳
  function target(type) {
    const near = key => { const [x, y] = POS[key]; return [x + rnd(-6, 6), y - rnd(2, 8)]; };
    switch (type) {
      case 'foul': {
        if (Math.random() < 0.25) return { to: [rnd(150, 250), 338], arc: 45, ms: 550 };
        const side = Math.random() < 0.5 ? -1 : 1, y = rnd(150, 270);
        return { to: [200 + side * (292 - y) + side * rnd(16, 40), y], arc: rnd(40, 90), ms: 650 };
      }
      case 'ground': case 'dp': {
        const k = pickOf(type === 'dp' ? ['유격수', '2루수'] : ['1루수', '2루수', '유격수', '3루수', '투수']);
        return { to: near(k), arc: 0, ms: 550, pos: k };
      }
      case 'fly': case 'sf': {
        const k = pickOf(['좌익수', '중견수', '우익수']);
        return { to: near(k), arc: 130, ms: 1000, pos: k };
      }
      case 'line': {
        const k = pickOf(['1루수', '2루수', '유격수', '3루수', '좌익수', '중견수', '우익수']);
        return { to: near(k), arc: 12, ms: 450, pos: k };
      }
      case '1B': return { to: polar(rnd(130, 165), pickOf([rnd(-28, -21), rnd(-8, 8), rnd(21, 28)])), arc: 22, ms: 650 };
      case '2B': return { to: polar(rnd(215, 238), pickOf([rnd(-24, -12), rnd(12, 24), rnd(-44, -39), rnd(39, 44)])), arc: 60, ms: 850 };
      case '3B': return { to: polar(rnd(236, 247), pickOf([rnd(-44, -38), rnd(38, 44), rnd(-16, -10), rnd(10, 16)])), arc: 70, ms: 900 };
      case 'HR': return { to: polar(rnd(305, 330), rnd(-38, 38)), arc: 150, ms: 1300, hr: true };
    }
    return null;
  }

  return { W, HGT, HOME, BASE, POS, polar, background, fielders, batter, runner, target };
})();

// 간단한 애니메이션 도우미 (requestAnimationFrame + 안전장치)
function tween(ms, fn) {
  return new Promise(res => {
    let done = false;
    const t0 = performance.now();
    const fin = () => { if (!done) { done = true; fn(1); res(); } };
    const step = now => {
      if (done) return;
      const t = Math.min(1, (now - t0) / ms);
      fn(t);
      if (t < 1) requestAnimationFrame(step); else fin();
    };
    requestAnimationFrame(step);
    setTimeout(fin, ms + 400);
  });
}
