/* =====================================================================
   ⚾ 우리집 프로야구 — 설정 파일 (config.js)
   ---------------------------------------------------------------------
   여기서 팀 이름, 선수 이름, 등번호, 포지션, 능력치, 로고를 정할 수 있어요.
   - 앱 안의 [팀 관리] 화면에서도 똑같이 고칠 수 있어요. (그 아이패드에만 저장돼요)
   - 이 파일을 고쳐서 GitHub에 다시 올리면, 앱을 열 때
     "설정 파일이 바뀌었어요. 적용할까요?" 하고 물어봐요.

   ▶ 타자 (batters) — 9명, 적은 순서가 타순이에요
        { name:'이름', num:등번호, pos:'포지션', power:파워(1~5), contact:정확도(1~5) }
        이름만 적어도 돼요 →  '홍길동'
        파워가 높으면 홈런·장타가, 정확도가 높으면 안타가 잘 나와요.

   ▶ 투수 (pitchers) — 선발 5명, 경기마다 순서대로 나와요
        { name:'이름', num:등번호, stuff:구위(1~5) }
        구위가 높으면 삼진·범타가 잘 나와요.

   ▶ 포지션: 포수, 1루수, 2루수, 3루수, 유격수, 좌익수, 중견수, 우익수, 지명타자

   ▶ 로고: logos 폴더에 그림 파일(png, jpg)을 넣고  logo:'logos/kt.png'  처럼 적어요.
           (앱의 [팀 관리] 화면에서 아이패드 사진으로 바로 넣을 수도 있어요)
           로고가 없으면 팀 색깔 동그라미 배지가 나와요.

   ▶ call: 음성 중계가 팀을 부를 때 읽는 이름이에요.
           영어(kt, LG)는 어색하게 읽힐 수 있어서 한글로 적어요.

   ▶ color: 유니폼 색, color2: 등번호·테두리 색
   ===================================================================== */

window.GAME_CONFIG = {
  myTeam: 'kt',   // 우리 팀 (첫 화면에 크게 나와요)

  teams: [
    {
      id: 'kt', name: 'kt wiz', short: 'KT', call: '케이티 위즈',
      color: '#1A1A1A', color2: '#ED1C24', logo: '',
      batters: [
        { name: '최원준', num: 1,  pos: '중견수',   power: 3, contact: 5 },
        { name: '김민혁', num: 4,  pos: '지명타자', power: 3, contact: 5 },
        { name: '안현민', num: 7,  pos: '우익수',   power: 5, contact: 4 },
        { name: '힐리어드', num: 10, pos: '좌익수', power: 5, contact: 4 },
        { name: '김현수', num: 25, pos: '1루수',    power: 4, contact: 5 },
        { name: '허경민', num: 5,  pos: '3루수',    power: 3, contact: 4 },
        { name: '류현인', num: 8,  pos: '2루수',    power: 3, contact: 4 },
        { name: '한승택', num: 22, pos: '포수',     power: 3, contact: 3 },
        { name: '장준원', num: 6,  pos: '유격수',   power: 3, contact: 3 },
      ],
      // ※ 다른 팀은 능력치가 전부 3이에요. kt는 그보다 높게 해 두었어요.
      //   앱의 [설정 → 우리 팀 힘내기]로 우리 팀을 더 세게 만들 수도 있어요.
      pitchers: [
        { name: '고영표', num: 11, stuff: 5 },
        { name: '배제성', num: 18, stuff: 4 },
        { name: '우규민', num: 21, stuff: 4 },
        { name: '스기모토', num: 30, stuff: 4 },
        { name: '박영현', num: 40, stuff: 4 },
      ],
    },

    // ── 나머지 팀들: 선수를 안 적으면 '타자1, 타자2…' 로 자동으로 채워져요 ──
    { id: 'lg',      name: 'LG 트윈스',     short: 'LG',  call: '엘지 트윈스',     color: '#C30452', color2: '#FFFFFF', logo: '' },
    { id: 'doosan',  name: '두산 베어스',   short: '두산', call: '두산 베어스',     color: '#131230', color2: '#FFFFFF', logo: '' },
    { id: 'ssg',     name: 'SSG 랜더스',    short: 'SSG', call: '에스에스지 랜더스', color: '#CE0E2D', color2: '#FFD200', logo: '' },
    { id: 'kiwoom',  name: '키움 히어로즈', short: '키움', call: '키움 히어로즈',   color: '#820024', color2: '#FFFFFF', logo: '' },
    { id: 'kia',     name: 'KIA 타이거즈',  short: 'KIA', call: '기아 타이거즈',   color: '#EA0029', color2: '#FFFFFF', logo: '' },
    { id: 'samsung', name: '삼성 라이온즈', short: '삼성', call: '삼성 라이온즈',   color: '#074CA1', color2: '#FFFFFF', logo: '' },
    { id: 'lotte',   name: '롯데 자이언츠', short: '롯데', call: '롯데 자이언츠',   color: '#041E42', color2: '#FFFFFF', logo: '' },
    { id: 'hanwha',  name: '한화 이글스',   short: '한화', call: '한화 이글스',     color: '#FC4E00', color2: '#1A1A1A', logo: '' },
    { id: 'nc',      name: 'NC 다이노스',   short: 'NC',  call: '엔씨 다이노스',   color: '#315288', color2: '#C7A079', logo: '' },
  ],
};
