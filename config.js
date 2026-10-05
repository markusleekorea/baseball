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
  pin: '1015',    // 앱을 열 때 누르는 비밀번호 (숫자 4자리). ''로 비우면 잠금 없이 바로 열려요.

  teams: [
    {
      id: 'kt', name: 'kt wiz', short: 'KT', call: '케이티 위즈',
      manager: { name: '이강철', num: 71 },   // 감독
      color: '#1A1A1A', color2: '#ED1C24', logo: '',
      batters: [
        { name: '최원준', num: 3,  pos: '중견수',   power: 3, contact: 5 },
        { name: '김민혁', num: 53, pos: '지명타자', power: 3, contact: 5 },
        { name: '안현민', num: 23, pos: '우익수',   power: 5, contact: 4 },
        { name: '힐리어드', num: 34, pos: '좌익수', power: 5, contact: 4 },
        { name: '김현수', num: 10, pos: '1루수',    power: 4, contact: 5 },
        { name: '허경민', num: 13, pos: '3루수',    power: 3, contact: 4 },
        { name: '류현인', num: 9,  pos: '2루수',    power: 3, contact: 4 },
        { name: '한승택', num: 45, pos: '포수',     power: 3, contact: 3 },
        { name: '장준원', num: 56, pos: '유격수',   power: 3, contact: 3 },
      ],
      // ※ 다른 팀은 능력치가 전부 3이에요. kt는 그보다 높게 해 두었어요.
      //   앱의 [설정 → 우리 팀 힘내기]로 우리 팀을 더 세게 만들 수도 있어요.
      pitchers: [
        { name: '고영표', num: 1,  stuff: 5 },
        { name: '배제성', num: 19, stuff: 4 },
        { name: '우규민', num: 12, stuff: 4 },
        { name: '스기모토', num: 11, stuff: 4 },
        { name: '박영현', num: 60, stuff: 4 },
      ],
    },

    // ── 나머지 팀들 ──
    // 이름·등번호: KBO 공식 홈페이지 '선수 등록 현황' (2026.10.04 1군 등록 명단)
    // 타순·포지션은 대표적인 주전 라인업으로 골랐어요. 마음대로 바꿔도 돼요.
    // 능력치를 안 적으면 전부 ★3 이에요.
    {
      id: 'lg', name: 'LG 트윈스', short: 'LG', call: '엘지 트윈스', color: '#C30452', color2: '#FFFFFF', logo: '',
      manager: { name: '염경엽', num: 85 },   // 감독
      batters: [
        { name: '홍창기', num: 51, pos: '우익수' },
        { name: '신민재', num: 4,  pos: '2루수' },
        { name: '오스틴', num: 23, pos: '1루수' },
        { name: '문보경', num: 2,  pos: '3루수' },
        { name: '문성주', num: 8,  pos: '좌익수' },
        { name: '박동원', num: 27, pos: '포수' },
        { name: '오지환', num: 10, pos: '유격수' },
        { name: '이재원', num: 52, pos: '지명타자' },
        { name: '박해민', num: 17, pos: '중견수' },
      ],
      pitchers: [
        { name: '톨허스트', num: 30 }, { name: '임찬규', num: 1 }, { name: '손주영', num: 29 },
        { name: '케네디', num: 68 }, { name: '김윤식', num: 47 },
      ],
    },
    {
      id: 'doosan', name: '두산 베어스', short: '두산', call: '두산 베어스', color: '#131230', color2: '#FFFFFF', logo: '',
      manager: { name: '김원형', num: 70 },   // 감독
      batters: [
        { name: '정수빈', num: 31, pos: '중견수' },
        { name: '박찬호', num: 7,  pos: '유격수' },
        { name: '손아섭', num: 24, pos: '지명타자' },
        { name: '양의지', num: 25, pos: '포수' },
        { name: '양석환', num: 53, pos: '1루수' },
        { name: '세베리노', num: 36, pos: '3루수' },
        { name: '강승호', num: 23, pos: '2루수' },
        { name: '김민석', num: 2,  pos: '좌익수' },
        { name: '김대한', num: 32, pos: '우익수' },
      ],
      pitchers: [
        { name: '잭로그', num: 39 }, { name: '벤자민', num: 48 }, { name: '최승용', num: 28 },
        { name: '타카다', num: 12 }, { name: '최민석', num: 68 },
      ],
    },
    {
      id: 'ssg', name: 'SSG 랜더스', short: 'SSG', call: '에스에스지 랜더스', color: '#CE0E2D', color2: '#FFD200', logo: '',
      manager: { name: '이숭용', num: 71 },   // 감독
      batters: [
        { name: '박성한', num: 2,  pos: '유격수' },
        { name: '정준재', num: 3,  pos: '2루수' },
        { name: '최지훈', num: 54, pos: '중견수' },
        { name: '에레디아', num: 27, pos: '좌익수' },
        { name: '김재환', num: 32, pos: '지명타자' },
        { name: '한유섬', num: 35, pos: '우익수' },
        { name: '고명준', num: 18, pos: '1루수' },
        { name: '안상현', num: 10, pos: '3루수' },
        { name: '조형우', num: 20, pos: '포수' },
      ],
      pitchers: [
        { name: '타케다', num: 23 }, { name: '아빌라', num: 33 }, { name: '김건우', num: 39 },
        { name: '문승원', num: 42 }, { name: '전영준', num: 28 },
      ],
    },
    {
      id: 'kiwoom', name: '키움 히어로즈', short: '키움', call: '키움 히어로즈', color: '#820024', color2: '#FFFFFF', logo: '',
      manager: { name: '설종진', num: 81 },   // 감독
      batters: [
        { name: '어준서', num: 92, pos: '유격수' },
        { name: '히우라', num: 22, pos: '2루수' },
        { name: '안치홍', num: 9,  pos: '지명타자' },
        { name: '데이비슨', num: 34, pos: '1루수' },
        { name: '이형종', num: 36, pos: '우익수' },
        { name: '여동욱', num: 93, pos: '3루수' },
        { name: '임병욱', num: 17, pos: '중견수' },
        { name: '박찬혁', num: 43, pos: '좌익수' },
        { name: '김재현', num: 32, pos: '포수' },
      ],
      pitchers: [
        { name: '안우진', num: 41 }, { name: '유토', num: 48 }, { name: '김윤하', num: 19 },
        { name: '박준현', num: 18 }, { name: '박정훈', num: 94 },
      ],
    },
    {
      id: 'kia', name: 'KIA 타이거즈', short: 'KIA', call: '기아 타이거즈', color: '#EA0029', color2: '#FFFFFF', logo: '',
      manager: { name: '이범호', num: 71 },   // 감독
      batters: [
        { name: '김호령', num: 27, pos: '중견수' },
        { name: '김선빈', num: 3,  pos: '2루수' },
        { name: '김도영', num: 5,  pos: '3루수' },
        { name: '나성범', num: 47, pos: '우익수' },
        { name: '카스트로', num: 26, pos: '좌익수' },
        { name: '하주석', num: 30, pos: '유격수' },
        { name: '변우혁', num: 29, pos: '1루수' },
        { name: '한준수', num: 25, pos: '지명타자' },
        { name: '김태군', num: 42, pos: '포수' },
      ],
      pitchers: [
        { name: '네일', num: 40 }, { name: '올러', num: 33 }, { name: '양현종', num: 54 },
        { name: '이의리', num: 48 }, { name: '황동하', num: 41 },
      ],
    },
    {
      id: 'samsung', name: '삼성 라이온즈', short: '삼성', call: '삼성 라이온즈', color: '#074CA1', color2: '#FFFFFF', logo: '',
      manager: { name: '박진만', num: 70 },   // 감독
      batters: [
        { name: '김지찬', num: 58, pos: '중견수' },
        { name: '김성윤', num: 39, pos: '우익수' },
        { name: '구자욱', num: 5,  pos: '좌익수' },
        { name: '디아즈', num: 0,  pos: '1루수' },
        { name: '최형우', num: 34, pos: '지명타자' },
        { name: '김영웅', num: 30, pos: '3루수' },
        { name: '강민호', num: 47, pos: '포수' },
        { name: '이재현', num: 7,  pos: '유격수' },
        { name: '류지혁', num: 16, pos: '2루수' },
      ],
      pitchers: [
        { name: '후라도', num: 75 }, { name: '원태인', num: 18 }, { name: '페덱', num: 59 },
        { name: '최원태', num: 20 }, { name: '백정현', num: 29 },
      ],
    },
    {
      id: 'lotte', name: '롯데 자이언츠', short: '롯데', call: '롯데 자이언츠', color: '#041E42', color2: '#FFFFFF', logo: '',
      manager: { name: '김태형', num: 88 },   // 감독
      batters: [
        { name: '황성빈', num: 0,  pos: '중견수' },
        { name: '고승민', num: 2,  pos: '2루수' },
        { name: '윤동희', num: 91, pos: '우익수' },
        { name: '레이예스', num: 29, pos: '좌익수' },
        { name: '전준우', num: 8,  pos: '지명타자' },
        { name: '한동희', num: 25, pos: '3루수' },
        { name: '나승엽', num: 51, pos: '1루수' },
        { name: '유강남', num: 27, pos: '포수' },
        { name: '전민재', num: 13, pos: '유격수' },
      ],
      pitchers: [
        { name: '박세웅', num: 21 }, { name: '나균안', num: 43 }, { name: '이이무라', num: 39 },
        { name: '윤성빈', num: 55 }, { name: '김원중', num: 34 },
      ],
    },
    {
      id: 'hanwha', name: '한화 이글스', short: '한화', call: '한화 이글스', color: '#FC4E00', color2: '#1A1A1A', logo: '',
      manager: { name: '김경문', num: 74 },   // 감독
      batters: [
        { name: '이원석', num: 37, pos: '중견수' },
        { name: '문현빈', num: 51, pos: '좌익수' },
        { name: '페라자', num: 30, pos: '우익수' },
        { name: '노시환', num: 8,  pos: '3루수' },
        { name: '강백호', num: 50, pos: '지명타자' },
        { name: '김태연', num: 25, pos: '1루수' },
        { name: '정은원', num: 43, pos: '2루수' },
        { name: '최재훈', num: 13, pos: '포수' },
        { name: '심우준', num: 7,  pos: '유격수' },
      ],
      pitchers: [
        { name: '화이트', num: 24 }, { name: '짐머맨', num: 12 }, { name: '황준서', num: 29 },
        { name: '조동욱', num: 57 }, { name: '박준영', num: 68 },
      ],
    },
    {
      id: 'nc', name: 'NC 다이노스', short: 'NC', call: '엔씨 다이노스', color: '#315288', color2: '#C7A079', logo: '',
      manager: { name: '이호준', num: 27 },   // 감독
      batters: [
        { name: '박민우', num: 2,  pos: '2루수' },
        { name: '김주원', num: 7,  pos: '유격수' },
        { name: '블레인', num: 50, pos: '1루수' },
        { name: '권희동', num: 36, pos: '좌익수' },
        { name: '김휘집', num: 44, pos: '3루수' },
        { name: '김형준', num: 25, pos: '포수' },
        { name: '이우성', num: 55, pos: '우익수' },
        { name: '천재환', num: 23, pos: '중견수' },
        { name: '한재환', num: 35, pos: '지명타자' },
      ],
      pitchers: [
        { name: '클레빈저', num: 39 }, { name: '구창모', num: 59 }, { name: '토다', num: 11 },
        { name: '신영우', num: 43 }, { name: '이재학', num: 51 },
      ],
    },
  ],
};
