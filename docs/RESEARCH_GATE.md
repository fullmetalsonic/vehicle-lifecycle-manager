# 사전조사 종료 판정 — 구현 인계 기준

2026-09-06 / 연구 데이터 v1.1

## 결론과 완료 범위

이 자료로 차량 등록, 관리항목 선택, 예방일정, 정비결과 기록, 교환회차, 공임 묶음, 주행거리 추정과 알림의 **앱 구현에 착수할 수 있다**. 개발자가 빈 부품수명이나 임의 달력값을 추가로 검색해서 채우도록 남기지 않는다.

대상은 개인 승용차의 내연기관·HEV·PHEV·BEV·LPG 관리이며 25년/50만km를 계획 기간으로 한다. 223개 항목 각각에 주기제안·출처조건·작업사건·상태보고 중 처리 경로가 있다. 부품별 실제 수리절차/호환성 인증이나 자동 고장진단 앱은 아니다. 이 경계는 정비 실행 시 필요한 차량·부품 정보와 앱 개발을 위한 사전조사를 구분하기 위한 것이다.

이전 v1.0의 “53개 주기 확정”은 출처가 없는 기간값까지 포함해 표현이 과했다. 이번에는 그중 **30개를 이전 값과 함께 전수 재감사**하고, 단순 완료 표시가 아니라 데이터를 수정했다.

## 실제로 보완한 내용

- 관리항목 222→223: 비상통신 eCall 백업배터리를 시동 배터리와 분리해 추가했다. 관리묶음은 기본48 / 예방98 / 장기47 / 편의30.
- 추가 원문14건과 새 적용사례32개를 저장했다. 기존 정확조건 사례20개를 합쳐 52개 조건부 사례를 코드로 읽을 수 있다. 사례 수는 차종 수 또는 전 차종 포괄률이 아니다.
- 출처 없는 달력주기는 삭제했다. 냉각수 최초/반복, Haldex 세대별 오일/필터, LPG 검사/교환, Toyota 청소 mile/Ryco 교환 km를 분리했다.
- 상태형 부품의 “규정 참조”는 개발자의 추가 웹조사 과제로 넘기지 않는다. 정비결과의 값·단위·해당 부품 한계값·출처·판정을 받는 입력 계약과 판정 연산을 확정했다. 한계값이 없으면 정상/불량을 지어내지 않고 정비사 판정 또는 상태기록으로 처리한다.
- 원문 없음/장착 모름/이력 미상에서도 등록·조회·기록은 동작한다. 근거가 없는 자동 교환 알림만 만들지 않으며 사용자는 직접 예방계획을 선택·수정할 수 있다.

## 출처 검토에서 달라진 대표 결과

| 항목 | 이번 결론 | 직접 근거 |
|---|---|---|
| 점화플러그 | 니켈3만km, 백금·형식 미상 이리듐5만km 선택안. 임의24개월 제거. 재질·연료 조건을 확인 | [DENSO](https://www.denso-am.eu/news/20141211_spark-plug-replacement-all-you-need-to-know-from-the-experts-at-denso) |
| 냉각수 | 반복4만km가 공통이 아님. BDm·EV9의 반복3만km/24개월과 GN7의4만km/24개월을 별도 처리 | [Kia BDm](https://ownersmanual.kia.com/full_webhelp/BDm/2024/en_US/topics/t00605.html), [현대 GN7](https://ownersmanual.hyundai.com/full_webhelp/GN7/2023/ko_KR/id6b219dd157c.html) |
| AWD 커플링 | Haldex1/2세대 오일3만·필터5만km 선택안,4/5세대 오일36개월. 필터 시계는 따로 | [VW TPS](https://tps.trade/insider/all-systems-go-as-haldex-put-under-the-spotlight/) |
| LPG 필터 | ROTURN 방식별 교환주기, Prins 정비검사, GN7 연료/충진구필터 점검을 구별 | [ROTURN](https://www.roturn.com/faq), [Prins](https://www.prinsautogas.com/en/service-your-prins-system-ua-version-en) |
| HEV 배터리 필터 | Toyota 공보의2만mile 청소와 Ryco 제품의2만km 교환은 다른 작업 | [Toyota 공보](https://static.nhtsa.gov/odi/tsbs/2020/MC-10177773-9999.pdf), [Ryco](https://rycofilters.com.au/articles/ryco-battery-air-filters-for-toyota-hybrids) |
| 파워스티어링액 | 유압식 호환규격에서 공급사 예방5만km/24개월 선택안. EPS 제외 | [AMALIE](https://www.amalie.com/product/power-steering-fluid/) |
| 비상통신 배터리 | EV9 해당 장비48개월. 주배터리 교환으로 리셋되지 않음 | [Kia EV9 매뉴얼](https://www.kia.com/th/th/pdf/service/manual/Kia-Owners-Manual_EV9_EN.pdf) |

## 구현자가 사용하는 확정 계약

1. **차량 대분류:** 자유 차명+연료/전동화/변속기/구동/타이밍/배터리 구조. 대분류로 장착 가능 항목만 거른다. 정확 주기는 확인된 service_profile로 연결하며 차량명으로 추측하지 않는다.
2. **예방계획:** 주기 숫자, 원문 숫자, 출처등급, 사용자 선택을 별도 보관한다. 사용자 오일1만km/12개월·ATF5만km는 유지한다. 숫자 없는 상태형에도 사용자가 자기 예방주기를 추가할 수 있으며 제조사 표기로 바꾸지 않는다.
3. **측정 판정:** 단위가 같은 유한값과 출처가 붙은 한계값이 있을 때만 lt/lte/gt/gte/outside 비교. 다른 단위·미상 한계·뒤집힌 범위는 확인 필요. 계산상 한계 이내는 차량 전체 안전 판정이 아니다. DTC만으로 부품 불량을 확정하지 않는다.
4. **작업 시계:** 자산+작업별로 분리. 교환·청소·검사·보충은 서로 리셋하지 않는다. 펌프/필터/오일/좌우부품/냉각회로가 다르면 별도 자산이다. 최초/반복 전환도 해당 작업 완료 기준이다.
5. **알림·공임:** 최신3실측 예측,1천km OR30일,09시대,단계 중복방지. 공임은 같은 정비사건의 공통작업만 한 번 계상하고 이미 도래한 정비를 묶음 때문에 늦추지 않는다.

영수증은 확인 전 원장에 반영하지 않는다. 미인식 항목은 원문을 남기고 사용자 연결을 받는다. AI/OCR 제공자 선정, 서버 구축과 실제 사진 인식률은 구현/검증 작업이지 정비주기 추가조사 과제가 아니다.

## 자료와 확인 경로

- [223항목 기준표](FINAL_MAINTENANCE_STANDARD.md)
- [30개 이전값과 교정 이유·32개 새 규칙](../data/implementation-rules.json)
- [추가 출처14건](../data/implementation-sources.json)
- [입력·판정·일정·공임 계약](../data/implementation-contract.json)
- [검수 예제](../tests/research-gate.cjs), [판정 참조 코드](../tests/reference-engine.cjs)
- [기존 공임묶음15개](../data/labor-bundles.json), [예방계획22개](../data/preventive-planning.json)

## 종료 기준

| 기준 | 결과 |
|---|---|
| 카탈로그 전 항목에 동작 경로·자산 단위·미상 처리 존재 | PASS |
| 문제였던30개 값에 이전값·출처·채택/취소 이유 존재 | PASS |
| 출처조건 불일치/미확인 시 자동적용 차단 | PASS |
| 최초/반복·거리/날짜·작업별 리셋·mile/km 분리 | PASS |
| 기존 정책/예방계획과 신규 규칙의 연결 검사 | PASS |
| 관리묶음223개 중복/누락, 공개 민감패턴 검사 | PASS |
| 앱 빌드·모바일 화면·OCR·서버 알림·실차 안전 검증 | 미실행 — 앱 미구현 |

검사 명령: `node tests/research-gate.cjs`, `node tests/launch-defaults.cjs`, `node tests/preventive.cjs`, `node tests/validate.cjs`.

**정비기준을 다시 조사해야만 개발을 시작할 수 있는 미결 과제는 이 인계 범위에 없다.** 새로운 차량의 실제 부품규격·정비사 측정결과는 운영 중 입력받는다. 원문 개정이나 신규 기능으로 범위가 바뀌면 데이터 유지보수로 처리하며 이번 사전조사를 무기한 열어두지 않는다.
