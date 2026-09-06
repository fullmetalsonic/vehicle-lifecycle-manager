# 데이터 안내

모든 거리는 km, 기간은 개월이다. mile 원문은 `original_miles`와 환산값을 함께 보존한다. `null`은 공통 숫자를 설정하지 않았다는 뜻이며 무교환·0·무한수명이 아니다.

| 파일 | 내용 |
|---|---|
| components.json | 223개 항목, 적용조건·운영판정·진단 유발조건·정책/공임 연결 |
| policies.json | 26개 공통 정책 후보의 최종 판정, 원문과 선택 주기 |
| rule-variants.json | 20개 조건부 수치 사례. 실제 장착·시장·최신절차 확인 필수 |
| sources.json | 본문 확인/접근 실패 구별. 접근 실패 자료는 수치 채택 금지 |
| families.json | 25개 기능 분류. 동일 하드웨어 목록이 아님 |
| applications.json | 11개 공용 기능 적용 사례와 차이 |
| labor-bundles.json | 15개 공임 동시정비 묶음과 조건 |
| management-profiles.json | 4개 관리 묶음, 성향, 전체 항목의 소속 |
| batteries.json | 저전압 보조배터리 종류·필드·진단/교체 제한 |
| interval-rounding.json | 교환거리만 내림, 원문·기간 보존 |
| service-alignment.json | 실제거리와 선택회차 분리 및 계산 예제 |
| preventive-planning.json | 22개 예방계획: 참고범위·선택값·상담/교환·작업상속 |
| preventive-sources.json | 추가 출처 S52–S70. 공급사·제조사·정비업체 자료 구별 |
| research-closure.json | 초기 미결14개 검토 이력·기각이유와223항목 연결표 |
| launch-defaults.json | 적용정책223개: 주기29 / 사건29 / 상태140 / 구조별25 |
| implementation-sources.json | 추가 원문14건 R01~R14, 확인된 주장과 적용범위 |
| implementation-rules.json | 임의값30개 재감사 이력, 새 조건부 사례32개 |
| implementation-contract.json | 등록·정비보고·숫자판정·자산별 시계·공임·알림의 확정 계약 |

구현 진입점은 implementation-contract.json과launch-defaults.json이다. 구현 규칙은 implementation-rules.json을 함께 사용한다. 기존V01~V20은 tests/reference-engine.cjs의compileVariants처럼 service_profile을 명시적으로 연결한다. 과거 components.decision이나 종결표시만으로 주기를 생성하지 않는다. mode/default_action/criteria/subtype_rules/operational_contract를 함께 적용한다. review는 교환 또는 분해검사 기한이 아니다. 검사는 tests/research-gate.cjs로 재현한다.

`reference_range_km`의 상한 `null`은 상한 미제시다. 0km나 고정수명으로 해석하지 않는다. `inherit_target`은 해당 차량의 실제 선택값이 확인되어야 활성화하며 상속 순환을 허용하지 않는다. 수치가 없다는 이유로 교환기한을 생성하지 않는다.

추가 예방계획은 기존 정책을 자동 덮어쓰지 않는다. 기존 P18의 진단정책과 PR03의 선택형 예방교환은 목적이 다르며 사용자가 선택한 정책만 활성화한다. P21의 일률4년교환 기각은 PR07의 근거표시·선택형4년 계획을 금지하는 뜻이 아니다.

`research_decision_closed`는 숫자 후보의 채택/기각 결정을 마쳤다는 뜻이다. 해당 차량 적용 검증이나 개별 부품 수명 입증을 뜻하지 않는다. `automatic_application:false`는 그대로 유지해야 한다.

`policy_ids`가 비어 있어도 관리 제외가 아니다. 상태기반 부품은 진단·수리·견적·교환 이력을 관리한다. 항목의 `trigger`는 계통별 설계 지침을 포함하며 모든 문장이 개별 부품 원문으로 입증된 것은 아니다. 출처를 관련 진단 원리와 직접 숫자 근거로 구별해 표시해야 한다.

적용 판단 순서: 실제 장착 확인 → 연식/시장/제품·구조·조건 일치 → 원문 점검/청소/교환 구별 → 최초/반복 확인 → 선택 주기와 더 이른 원문 기한 비교. 맞는 규칙이 없으면 확인 필요로 보류하고 기한을 발명하지 않는다.

범용 자동추정 금지 대상은 제품별 벨트/변속기 구조, LPG 시스템, 액규격 호환성이다. 확인된 프로필은 해당 규칙으로, 그 외에는 사용자 일정/정비결과 입력으로 처리하도록 확정했다. 법정검사·리콜의 실시간 완전성 보장은 이번 부품관리 기준의 범위가 아니다. 앱 개발 중 임의 공통값을 채우는 조사 과제로 남기지 않는다.
