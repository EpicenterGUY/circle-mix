/*
새 기능 또는 버그 수정 작업을 완료할 때:
1. CircleMixVersion.version을 올린다.
2. CircleMixChangelog 첫 번째 항목에 새 버전 로그를 추가한다.
3. 실제 적용 완료된 내용만 기록한다.
4. 기존 로그는 삭제하거나 수정하지 않는다.
*/
window.CircleMixChangelog = [
  {
    version: "0.9.11",
    date: "2026-07-19",
    title: "PC Pointer Lock Aim",
    summary: "PC 마우스 상대 입력과 에임 진단을 추가하면서 펜과 모바일의 절대좌표 입력을 유지",
    changes: [
      { category: "INPUT", text: "AUTO / ABSOLUTE / LOCKED PC AIM 모드와 0.50x~2.00x locked sensitivity를 추가" },
      { category: "AIM", text: "브라우저 경계에서도 계속 회전하는 Pointer Lock 상대 입력, 안전한 절대좌표 fallback 및 lock 해제 일시정지를 추가" },
      { category: "DEBUG", text: "F4 AIM DEBUG에서 raw, judgement, visual angle과 Pointer Lock 샘플 정보를 확인" },
      { category: "COMPATIBILITY", text: "펜과 모바일 touch AIM/ACTION/SCRATCH는 기존 절대좌표 및 pointer capture 흐름을 유지" }
    ]
  },
  {
    version: "0.9.10",
    date: "2026-07-19",
    title: "Direct Play Startup Fix",
    summary: "튜토리얼을 실행하지 않은 새 세션에서도 일반 곡이 독립적으로 게임 화면과 루프를 완전히 시작하도록 수정",
    changes: [
      { category: "GAMEPLAY", text: "일반 곡 시작이 게임 scene, clean HUD, overlay 정리, canvas resize, 스크롤 잠금과 RAF 시작을 튜토리얼 초기화 없이 직접 완료" },
      { category: "TEST", text: "새 데스크톱·모바일 세션과 튜토리얼 안내 응답 완료/미완료 상태에서 직접 곡 시작 화면 및 게임 루프를 브라우저 회귀 테스트로 검증" }
    ]
  },
  {
    version: "0.9.9",
    date: "2026-07-19",
    title: "Playfield Readability Polish",
    summary: "에임 팔과 TRACE 경로의 겹침을 줄이고 판정 위치와 노트를 더 선명하게 표시하도록 플레이 화면을 정리",
    changes: [
      { category: "PLAYFIELD", text: "에임 팔의 원호, 연결선, 끝점을 얇고 단순하게 정리하고 겹칠 때만 판정 외곽 링을 표시" },
      { category: "TRACE", text: "판정 tolerance와 분리된 전용 시각 폭으로 미래·지나간 경로와 현재 목표를 명확하게 렌더링" },
      { category: "TEST", text: "TRACE 시각 프로필과 판정 위치 마커의 렌더링 조건을 브라우저 회귀 테스트로 검증" }
    ]
  },
  {
    version: "0.9.8",
    date: "2026-07-19",
    title: "Event-Based Aim Input Stability",
    summary: "포인터 이벤트 기반 에임 처리와 회전 누적, 중앙 데드존 및 SWING/SCRATCH 입력 안정성을 개선",
    changes: [
      { category: "INPUT", text: "RAF가 아닌 pointer/coalesced event 샘플 단위로 에임과 각속도 처리" },
      { category: "AIM", text: "판정용 각도와 시각용 팔을 분리하고 Stabilizer OFF 직결 입력 유지" },
      { category: "ROTATION", text: "0° 경계와 360°/540°/720° 누적 회전, 중앙 데드존 rebase 처리" },
      { category: "JUDGEMENT", text: "SWING/SCRATCH의 판정창 이후 이동량과 홀드 이후 입력만 인정" },
      { category: "TEST", text: "PC/모바일, CW/CCW 대회전, 빠른 점프 및 입력 freshness 회귀 검증" }
    ]
  },
  {
    version: "0.9.7",
    date: "2026-07-18",
    title: "Tutorial Rapid Skip Hotfix",
    summary: "튜토리얼 빠른 SKIP 큐와 단계 전환 직렬화를 추가해 마지막 종합 연습 진입과 완료 처리를 안정화",
    changes: [
      { category: "Tutorial", text: "전환 중 SKIP을 유실하지 않도록 pending queue로 직렬 처리하고 완료 처리를 idempotent하게 정리" },
      { category: "Tutorial", text: "단계 이동 시 전체 플레이 세션 재시작을 피하고 단계별 chart, timer, 입력 상태만 정리" },
      { category: "Test", text: "PC/모바일 브라우저 회귀 테스트에 rapid skip, final step, final completion 검증을 추가" }
    ]
  },
  {
    version: "0.9.6",
    date: "2026-07-18",
    title: "PC Gameplay Loop Hotfix",
    summary: "PC 입력 회귀를 수정하면서 PR #73의 직접 조준·대칭 disengage·UI 위 포인터 추적을 유지",
    changes: [
      { category: "PC", text: "광범위한 updateArm 예외 억제를 제거하고 Aim Stabilizer OFF 기본값, OFF 직접 조준, CW/CCW 대칭 disengage, UI 위 포인터 추적을 유지" },
      { category: "PWA", text: "앱 버전과 앱 셸 cache-bust query를 갱신해 수정된 game.js가 기존 서비스 워커 캐시에 갇히지 않도록 정리" }
    ]
  },
  {
    version: "0.9.5",
    date: "2026-07-18",
    title: "Mobile PWA Update Log Hotfix",
    summary: "모바일 PWA 캐시 갱신과 일반 사용자 업데이트 로그 노출을 수정",
    changes: [
      { category: "PWA", text: "앱 버전과 앱 셸 cache-bust query를 갱신해 새 서비스 워커가 수정된 모바일 시작 화면 CSS를 제공" },
      { category: "UPDATE", text: "UPDATE LOG를 일반 기능으로 전환하고 새 버전 최초 타이틀 진입 시 한 번 자동 표시" },
      { category: "MOBILE", text: "업데이트 로그 overlay가 모바일 화면 안에서 카드 본문만 스크롤되도록 조정" }
    ]
  },
  {
    version: "0.9.4",
    date: "2026-07-18",
    title: "PWA Offline Download Port Fix",
    summary: "모바일 OFFLINE DATA 다운로드가 멈추지 않도록 MessageChannel 전달과 실패 정리를 수정",
    changes: [
      { category: "PWA", text: "OFFLINE_STATUS와 DOWNLOAD_OFFLINE 요청에서 MessagePort를 transfer list로 전달하고 서비스 워커는 event.ports[0]으로 응답" },
      { category: "PWA", text: "postMessage 예외, 상태 조회 timeout, 다운로드 완료·실패 시 포트와 진행 상태를 정리해 UI가 FAILED 또는 fallback으로 전환" },
      { category: "PWA", text: "OFFLINE DATA 버튼 중복 클릭으로 여러 다운로드 세션이 겹치지 않게 차단" }
    ]
  },
  {
    version: "0.9.3",
    date: "2026-07-18",
    title: "Mobile Play Regression Hotfix",
    summary: "모바일 AUTO 오디오 재시작, 전체화면 검은 화면, 게임 중 페이지 스크롤 문제를 수정",
    changes: [
      { category: "AUTO", text: "AUTO 상태 변경을 단일 함수로 통합하고 곡 선택 AUTO 버튼이 미리듣기와 화면 재렌더링을 재시작하지 않게 수정" },
      { category: "AUDIO", text: "미리듣기 세션 토큰과 단일 타이머 관리로 stale preview 재시작을 차단하고 모바일 디버그 오디오 카운터를 추가" },
      { category: "MOBILE", text: "전체화면 전환 lock, 안정 viewport resize, gameplay scroll lock으로 검은 화면과 플레이 중 페이지 스크롤을 방지" }
    ]
  },
  {
    version: "0.9.2",
    date: "2026-07-18",
    title: "Ghost Rule TRACE Entry Polish",
    summary: "Ghost Rule HARD/EXPERT/MASTER TRACE 진입 동선을 다듬어 짧은 간격의 반대편 시작과 급반전 패턴을 완화",
    changes: [
      { category: "CHART", text: "Ghost Rule HARD/EXPERT/MASTER에서 TRACE 시작점을 직전 포인터 종료 위치에 가깝게 회전해 순간 이동 요구를 제거" },
      { category: "TEST", text: "Ghost Rule TRACE 전환 audit를 추가해 severe start jump와 blind reverse jump 회귀를 검사" }
    ]
  },
  {
    version: "0.9.1",
    date: "2026-07-18",
    title: "PWA Install Icon Hotfix",
    summary: "Chromium 설치 판정을 위한 PNG 아이콘 manifest 등록과 INSTALL APP 안내 UI를 보강",
    changes: [
      { category: "PWA", text: "manifest에 192x192, 512x512, maskable 512 PNG 아이콘을 등록하고 Apple touch icon을 실제 PNG로 변경" },
      { category: "PWA", text: "standalone이 아닌 상태에서는 INSTALL APP 버튼을 표시하고 beforeinstallprompt 미수신 브라우저에는 수동 설치 안내를 제공" },
      { category: "DEBUG", text: "?pwaDebug=1에서만 서비스 워커, manifest, 설치 이벤트, UA, 온라인 상태 진단 패널을 표시" }
    ]
  },
  {
    version: "0.9.0",
    date: "2026-07-18",
    title: "Ghost Rule Built-in Track",
    summary: "Ghost Rule 내장곡과 HARD/EXPERT/MASTER bundle 채보, 곡별 오디오 및 오프라인 캐시를 추가",
    changes: [
      { category: "SONG", text: "src/charts/ghost-rule.js bundle을 source of truth로 Ghost Rule 메타데이터와 난이도를 등록" },
      { category: "CHART", text: "built-in 난이도 ID를 일반화하고 Ghost Rule raw notes를 런타임 노트로 변환" },
      { category: "PWA", text: "Ghost Rule chart JS, jacket, MP3를 OFFLINE DATA 필수 자산에 포함" }
    ]
  },
  {
    version: "0.8.4",
    date: "2026-07-18",
    title: "Mobile Control Layout Tools",
    summary: "모바일 ACTION/SCRATCH 레이아웃 편집, 설정 내보내기, 입력 점검 화면을 추가",
    changes: [
      { category: "MOBILE", text: "STANDARD, LEFT_HANDED, RIGHT_HANDED, CUSTOM 프리셋과 크기, 투명도, safe-area 정규화 좌표 저장을 추가" },
      { category: "UI", text: "PAUSE SETTINGS에서 전체 화면 모바일 레이아웃 편집 오버레이와 JSON 내보내기/초기화를 제공" },
      { category: "INPUT", text: "독립 모바일 입력 테스트 화면과 포인터 상태 기반 ACTION/SCRATCH 누름 피드백을 추가" }
    ]
  },
  {
    version: "0.8.3",
    date: "2026-07-18",
    title: "Offline Data Integrity Hotfix",
    summary: "OFFLINE DATA가 필수 앱 shell과 내장 재생 자산을 검증한 뒤에만 READY가 되도록 수정",
    changes: [
      { category: "OFFLINE", text: "서비스 워커가 APP shell과 내장 오프라인 필수 자산을 분리해 저장하고 누락 URL을 OFFLINE_FAILED/OFFLINE_STATUS로 보고" },
      { category: "OFFLINE", text: "OFFLINE_STATUS가 현재 버전 캐시의 모든 필수 URL을 검사해 READY, INCOMPLETE, UPDATE REQUIRED 상태를 구분" },
      { category: "AUDIO", text: "캐시된 완전한 오디오 200 응답에서 Range 요청을 206 Partial Content로 응답하는 경로를 추가" },
      { category: "PWA", text: "현재 SVG 아이콘만 유지하고 바이너리 아이콘 생성 없이 오프라인 상태 UI를 정리" }
    ]
  },
  {
    version: "0.8.2",
    date: "2026-07-18",
    title: "PWA Offline Install Pass",
    summary: "PWA 설치, 서비스 워커 오프라인 실행, 수동 업데이트 적용, Screen Wake Lock을 추가",
    changes: [
      { category: "PWA", text: "상대 경로 manifest, 앱 아이콘, 설치 버튼, 온라인/오프라인 상태 UI를 추가" },
      { category: "OFFLINE", text: "서비스 워커와 OFFLINE DATA 버튼으로 앱 shell과 내장 실행 데이터를 캐시에 저장" },
      { category: "UPDATE", text: "새 서비스 워커는 대기시키고 사용자가 메뉴에서 UPDATE를 눌렀을 때만 적용" },
      { category: "MOBILE", text: "게임 시작/재개 중 Screen Wake Lock을 요청하고 일시정지/결과/숨김 상태에서 해제" }
    ]
  },
  {
    version: "0.8.1",
    date: "2026-07-18",
    title: "Mobile Render Hot Path Optimization",
    summary: "모바일 플레이 중 HUD, DOM, 렌더링 노트 범위와 품질 강등 비용을 최적화",
    changes: [
      { category: "PERF", text: "frame 루프에서 정적 UI refresh, querySelector, innerHTML 갱신을 제거하고 라이브 HUD만 갱신" },
      { category: "RENDER", text: "정렬된 채보의 visible note window로 고스트, 레일, 노트 렌더 순회를 축소" },
      { category: "MOBILE", text: "모바일 품질별 DPR/이펙트 제한과 AUTO 모드 세션 임시 프레임 타임 강등, ?perf=1 측정 오버레이를 추가" }
    ]
  },
  {
    version: "0.8.0",
    date: "2026-07-18",
    title: "Mobile Standalone Play Pass",
    summary: "스마트폰 단독 플레이를 위한 듀얼 터치 입력, 모바일 HUD, DPR/효과 제한을 추가",
    changes: [
      { category: "INPUT", text: "모바일 AIM / ACTION / SCRATCH 포인터 역할을 분리하고 ACTION 버튼 전용 CUT·HOLD·SLIDE 흐름을 추가" },
      { category: "UI", text: "모바일 게임 화면에 safe area 대응 ACTION, SCRATCH, PAUSE 버튼과 가로 HUD 정리를 적용" },
      { category: "PERF", text: "모바일 렌더 DPR 품질 모드, HUD 갱신 제한, 시각 이펙트 배열 상한을 추가" }
    ]
  },
  {
    version: "0.7.5",
    date: "2026-07-18",
    title: "Tutorial 45° TRACE Intro",
    summary: "튜토리얼 10단계의 STATIC TRACE를 실제 45° TRACE 입문 단계로 교체",
    changes: [
      { category: "TUTORIAL", text: "튜토리얼 10단계의 STATIC TRACE를 실제 45° TRACE 입문 단계로 교체" }
    ]
  },
  {
    version: "0.7.4",
    date: "2026-07-18",
    title: "Tutorial STATIC TRACE Readability",
    summary: "튜토리얼 STATIC TRACE 목표와 진행 표시 가독성 개선",
    changes: [
      { category: "TUTORIAL", text: "튜토리얼 STATIC TRACE 목표와 진행 표시 가독성 개선" }
    ]
  },
  {
    version: "0.7.3",
    date: "2026-07-18",
    title: "Tutorial STATIC TRACE Render Fix",
    summary: "10단계 STATIC TRACE 진행 게이지 좌표 오류 수정",
    changes: [
      { category: "FIX", text: "10단계 STATIC TRACE 진행 게이지 좌표 오류 수정" }
    ]
  },
  {
    version: "0.7.2",
    date: "2026-07-17",
    title: "Input, Local Labels & ANiMA Slide Fixes",
    summary: "정적 리뷰에서 확인된 입력 중복, LOCAL 라벨, ANiMA 동일각 SLIDE 문제를 수정했습니다.",
    changes: [
      { category: "INPUT", text: "D키는 에임 전용으로 유지하고 F3만 디버그 오버레이를 토글하도록 수정" },
      { category: "CHART", text: "ANiMA osu! reference의 동일 시작/종료각 SLIDE를 HOLD로 안전 변환" },
      { category: "FIX", text: "START 후 곡 선택 난이도 계산에서 정의되지 않은 각도 함수 참조로 중단되던 오류 수정" },
      { category: "LOCAL", text: "LOCAL 난이도 라벨 출처를 공통화하고 곡 선택 사용자 메타데이터 HTML 안전 처리" },
      { category: "FIX", text: "모바일 탭과 포인터 이동 이벤트 중복 실행 방지" },
      { category: "DEBUG", text: "튜토리얼 TRACE→SWING 런타임 로그 출력 빈도 제한" }
    ]
  },
  {
    version: "0.7.1",
    date: "2026-07-18",
    title: "Tutorial TRACE Stability",
    summary: "튜토리얼 10단계 고정 TRACE와 17단계 TRACE 후 SWING 전환을 안정화했습니다.",
    changes: [
      { category: "TUTORIAL", text: "10단계 고정 TRACE 표시 및 공통 TRACE 판정 기반 유지 판정 수정" },
      { category: "TUTORIAL", text: "17단계 360° TRACE 완료 후 SWING을 새로 생성하도록 하위 phase 분리" },
      { category: "FIX", text: "튜토리얼 TRACE 움직임이 SWING 판정에 남던 오류 수정" }
    ]
  },
  {
    version: "0.7.0",
    date: "2026-07-18",
    title: "Version & Update Log",
    summary: "개발자 모드용 버전 표시와 정적 업데이트 로그를 추가했습니다.",
    changes: [
      { category: "NEW", text: "타이틀 화면에 단일 버전 정보 기반 표시 추가" },
      { category: "NEW", text: "개발자 모드에서만 UPDATE LOG 버튼 표시" },
      { category: "SYSTEM", text: "새 버전 최초 진입 시 최신 로그를 한 번 자동 표시" }
    ]
  },
  {
    version: "0.6.0",
    date: "2026-07-17",
    title: "Input & Scene Stability",
    summary: "게임 시작, 설정 복귀, 입력 안정성을 정리했습니다.",
    changes: [
      { category: "FIX", text: "PLAY 직후 타이틀로 돌아가는 장면 전환 오류 수정" },
      { category: "INPUT", text: "AIM STABILIZER OFF / LOW / MEDIUM 설정 추가" },
      { category: "UI", text: "SETTINGS RESUME과 EXIT TO TITLE 흐름 정리" },
      { category: "TUTORIAL", text: "튜토리얼 단계 전환과 SKIP STEP 입력 안정화" },
      { category: "TUTORIAL", text: "튜토리얼 TRACE 판정을 일반 플레이 TRACE 판정과 통일" }
    ]
  },
  {
    version: "0.5.0",
    date: "2026-07-16",
    title: "Chart & Playfield Polish",
    summary: "ANiMA 채보와 플레이 화면 가독성을 개선했습니다.",
    changes: [
      { category: "CHART", text: "ANiMA NORMAL osu! 기반 재채보 적용" },
      { category: "CHART", text: "ANiMA TECH osu! 기반 재채보 적용" },
      { category: "CHART", text: "NORMAL 단타를 8방향 기준으로 정리" },
      { category: "CHART", text: "TECH 단타를 16방향 기준으로 정리" },
      { category: "CHART", text: "SLIDE와 TRACE 자유각도 유지" },
      { category: "UI", text: "플레이필드 CLEAN 표시에서 보조 UI 정리" }
    ]
  },
  {
    version: "0.4.0",
    date: "2026-07-15",
    title: "Song Select & Results",
    summary: "곡 선택 상태와 결과 정보 표시를 분리했습니다.",
    changes: [
      { category: "SYSTEM", text: "LOCAL 곡 선택 상태와 BUILT-IN 선택 상태 분리" },
      { category: "FIX", text: "LOCAL 탭에서 내장 ANiMA 채보가 실행되던 흐름 차단" },
      { category: "UI", text: "RESULT 화면에 SCORE와 POWER 표시 추가" },
      { category: "SYSTEM", text: "곡별 SCORE 기록 저장 흐름 유지" }
    ]
  }
];
