/* 그림: 야구선수, 팀 배지/로고 */

const Art = (() => {
  const escA = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function shade(hex, amt) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16); if (Number.isNaN(n)) return hex;
    const f = v => Math.max(0, Math.min(255, v + amt));
    return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // 귀여운 야구선수 (pose: 'bat' 타자, 'pitch' 투수, 'field' 수비수, 'run' 주자)
  function inner(team, num, pose) {
    const J = team.color || '#333', T = team.color2 || '#fff', J2 = shade(J, -25);
    const skin = '#FFDDBE', pants = '#F4F4F4', pl = '#CFCFCF';
    const n = String(num ?? '');
    const fs = n.length >= 2 ? 20 : 24;
    const letter = escA(String(team.short || '').slice(0, 2));

    const legs = `
      <ellipse cx="60" cy="153" rx="34" ry="5" fill="rgba(0,0,0,.22)"/>
      <rect x="45" y="104" width="13" height="42" rx="6" fill="${pants}" stroke="${pl}" stroke-width="1.5"/>
      <rect x="62" y="104" width="13" height="42" rx="6" fill="${pants}" stroke="${pl}" stroke-width="1.5"/>
      <rect x="45.5" y="128" width="12" height="11" fill="${J}"/>
      <rect x="62.5" y="128" width="12" height="11" fill="${J}"/>
      <ellipse cx="50" cy="148" rx="10" ry="5" fill="#222"/>
      <ellipse cx="70" cy="148" rx="10" ry="5" fill="#222"/>`;
    const body = `
      <rect x="37" y="64" width="46" height="48" rx="14" fill="${J}" stroke="${T}" stroke-width="3"/>
      <text x="60" y="97" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${fs}" fill="${T}">${escA(n)}</text>`;
    const face = `
      <circle cx="60" cy="42" r="23" fill="${skin}"/>
      <ellipse cx="52" cy="46" rx="2.9" ry="3.5" fill="#2a2a2a"/>
      <ellipse cx="68" cy="46" rx="2.9" ry="3.5" fill="#2a2a2a"/>
      <circle cx="53" cy="44.8" r="1" fill="#fff"/><circle cx="69" cy="44.8" r="1" fill="#fff"/>
      <ellipse cx="46" cy="53" rx="4" ry="2.5" fill="#FF8FA0" opacity=".55"/>
      <ellipse cx="74" cy="53" rx="4" ry="2.5" fill="#FF8FA0" opacity=".55"/>
      <path d="M54 54 Q60 60 66 54" stroke="#6b3d2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

    const cap = `
      <path d="M37 38 C37 22 47 17 60 17 C73 17 83 22 83 38 Z" fill="${J}"/>
      <ellipse cx="60" cy="38.5" rx="25" ry="4" fill="${J2}"/>
      <circle cx="60" cy="18" r="2.2" fill="${T}"/>
      <text x="60" y="33" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="10" fill="${T}">${letter}</text>`;
    const helmet = `
      <path d="M35 41 C35 21 47 15 60 15 C73 15 85 21 85 41 Z" fill="${J}" stroke="${T}" stroke-width="1.5"/>
      <ellipse cx="60" cy="41" rx="27" ry="4" fill="${J2}"/>
      <circle cx="84" cy="45" r="8" fill="${J}" stroke="${T}" stroke-width="1.5"/>
      <text x="60" y="34" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="11" fill="${T}">${letter}</text>`;
    const arm = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${J2}" stroke-width="10" stroke-linecap="round"/>`;
    const glove = (x, y) => `<circle cx="${x}" cy="${y}" r="12" fill="#8B5A2B"/><path d="M${x - 8} ${y - 2} Q${x} ${y - 9} ${x + 8} ${y - 2}" stroke="#5e3a17" stroke-width="2" fill="none"/>`;

    if (pose === 'pitch') {   // 투수: 공을 든 손을 높이
      return `${legs}${body}
        ${arm(41, 74, 28, 92)}${glove(25, 97)}
        ${arm(79, 72, 95, 42)}
        <circle cx="97" cy="36" r="5.5" fill="${skin}"/>
        <circle cx="100" cy="29" r="7" fill="#fff" stroke="#bbb"/>
        <path d="M95.5 25 Q98 29 95.5 33 M104.5 25 Q102 29 104.5 33" stroke="#E53935" stroke-width="1.3" fill="none"/>
        ${face}${cap}`;
    }
    if (pose === 'field') {   // 수비수: 글러브 들고 준비
      return `${legs}${body}
        ${arm(41, 76, 27, 90)}${glove(24, 94)}
        ${arm(79, 76, 93, 90)}<circle cx="95" cy="93" r="5.5" fill="${skin}"/>
        ${face}${cap}`;
    }
    if (pose === 'run') {     // 주자: 헬멧 쓰고 팔 흔들기
      return `${legs}${body}
        ${arm(41, 76, 28, 92)}<circle cx="26" cy="95" r="5.5" fill="${skin}"/>
        ${arm(79, 74, 92, 60)}<circle cx="94" cy="57" r="5.5" fill="${skin}"/>
        ${face}${helmet}`;
    }
    return `${legs}${body}
      <line x1="88" y1="66" x2="106" y2="14" stroke="#C68B4E" stroke-width="6.5" stroke-linecap="round"/>
      <line x1="97" y1="40" x2="106" y2="14" stroke="#B5773A" stroke-width="10" stroke-linecap="round"/>
      ${arm(40, 78, 84, 70)}${arm(80, 76, 86, 70)}
      <circle cx="87" cy="68" r="5.5" fill="${T}" stroke="${J2}" stroke-width="1.5"/>
      <circle cx="89" cy="62" r="5.5" fill="${T}" stroke="${J2}" stroke-width="1.5"/>
      ${face}${helmet}`;
  }

  // 독립 그림 (카드·라인업용)
  function player(team, num, pose = 'bat') {
    return `<svg class="player" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">${inner(team, num, pose)}</svg>`;
  }

  // 야구장 SVG 안에 넣는 그림: (0,0)이 발밑, 높이 h
  function figure(team, num, pose, h) {
    const w = h * 0.75;
    return `<svg x="${-w / 2}" y="${-h}" width="${w}" height="${h}" viewBox="0 0 120 160" overflow="visible">${inner(team, num, pose)}</svg>`;
  }

  function badge(team) {
    const s = String(team.short || team.name || '?');
    const fs = s.length <= 2 ? 36 : s.length === 3 ? 28 : 20;
    return `<svg class="badge" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="${team.color}" stroke="${team.color2}" stroke-width="6"/>
      <circle cx="50" cy="50" r="36" fill="none" stroke="${team.color2}" stroke-width="1.5" opacity=".5"/>
      <text x="50" y="52" text-anchor="middle" dominant-baseline="middle" font-family="Jua, Arial Black, sans-serif" font-weight="900" font-size="${fs}" fill="${team.color2}">${escA(s)}</text>
    </svg>`;
  }

  // 로고가 있으면 로고, 없거나 못 불러오면 배지
  function logo(team, size = 'md') {
    if (!team) return '';
    if (team.logo) {
      return `<span class="logo ${size} has-img"><img src="${escA(team.logo)}" alt="" onerror="this.parentNode.classList.add('broken')">${badge(team)}</span>`;
    }
    return `<span class="logo ${size}">${badge(team)}</span>`;
  }

  return { player, figure, logo, badge, shade };
})();
