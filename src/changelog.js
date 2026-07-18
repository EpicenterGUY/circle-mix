/*
새 기능 또는 버그 수정 작업을 완료할 때:
1. CircleMixVersion.version을 올린다.
2. CircleMixChangelog 첫 번째 항목에 새 버전 로그를 추가한다.
3. 실제 적용 완료된 내용만 기록한다.
4. 기존 로그는 삭제하거나 수정하지 않는다.
*/
window.CircleMixChangelog = [
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
