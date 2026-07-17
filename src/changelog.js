/*
새 기능 또는 버그 수정 작업을 완료할 때:
1. CircleMixVersion.version을 올린다.
2. CircleMixChangelog 첫 번째 항목에 새 버전 로그를 추가한다.
3. 실제 적용 완료된 내용만 기록한다.
4. 기존 로그는 삭제하거나 수정하지 않는다.
*/
window.CircleMixChangelog = [
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
