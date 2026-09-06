# 차량 생애주기 관리 앱

25년·50만 km 장기 운행을 돕는 Android **차량 노트**입니다. 정비 기록, 거리·기간 주기, 관리 묶음, 기기 내 영수증 OCR, 백업·복원과 알림을 제공합니다.

**[Android 앱 다운로드](https://github.com/fullmetalsonic/vehicle-lifecycle-manager/releases/latest)** · [설치·사용·개인정보 안내](docs/PUBLIC_RELEASE.md) · [배포 검증](docs/RELEASE_VERIFICATION.md)

자기 차량을 등록하는 빈 화면으로 시작합니다. 개발자의 차량·정비 원본·사진·개인값은 포함하지 않습니다. 기록은 기기에 보관하고, 영수증 인식 결과는 사용자가 확인한 뒤 저장합니다. 앱 위쪽 ‘앱 정보’에서 업데이트를 확인하거나 자동 확인을 끌 수 있습니다. 삭제·분실에 대비해 백업을 별도로 보관하세요.

## 확정한 범위

**사전조사 v1.1:** [종료 판정·보완 내역](docs/RESEARCH_GATE.md). 출처가 부족했던30개 기본값을 재감사하고 적용조건과 판정 계약을 확정했습니다. [223항목 기준표](docs/FINAL_MAINTENANCE_STANDARD.md), `data/implementation-contract.json`과 `data/implementation-rules.json`을 함께 구현 기준으로 사용합니다.

- 관리항목 223개: 기본 소모품·안전 48 / 주요 부품·예방정비 98 / 장기·정밀관리 47 / 차체·편의관리 30. 모든 차량에223개를 적용하지 않습니다. 비상통신 백업배터리는 시동 배터리와 분리했습니다.
- 주기 정책26개, 기존 조건부 사례20개+추가32개, 공용 기능 사례11개, 동시정비 묶음15개. 같은 변속기명·연료만으로 같은 주기를 적용하지 않습니다.
- 원문 거리·기간과 앱 선택 주기를 분리합니다. 교환거리 6만→5만, 12만→10만처럼 앞당길 수 있지만 더 짧은 공식 기한을 늦추지 않습니다.
- 실제 49,500 km 교환과 사용자 선택 50,000 km 정비회차를 함께 보존합니다. 기간은 실제 교환일부터 계산합니다.
- 납산/EFB/AGM/리튬계 보조배터리, 냉각회로, HEV 클러치 작동유 등을 구분합니다.

## 읽는 순서

최신 인계는 [사전조사 종료 판정](docs/RESEARCH_GATE.md)입니다. [이전22개 예방계획 검토](docs/RESEARCH_COMPLETION.md)와 [1차 보완 기록](docs/PREVENTIVE_SUPPLEMENT.md)은 조사 이력으로 보존하며 최신 교정값이 우선합니다.

1. [조사 결론과 제한](docs/RESEARCH.md)
2. [앱 동작 명세](docs/APP_SPEC.md)
3. [데이터 안내](docs/DATA_GUIDE.md)
4. [검증 및 인수인계](PROJECT_HANDOVER.md)

## 자료의 의미

사전조사는 공통 관리체계와 근거 있는 조건별 규칙을 정하는 범위입니다. 전 세계 모든 차량의 부품 수명, 정비 절차나 호환성을 검증한 데이터베이스가 아닙니다. 제조사 주기 / 공급사 권고 / 사용자 예방선택 / 상태·작업사건 기반 관리를 구별합니다. 출처 확인이 안 된 자료는 채택 근거에서 제외합니다.

자료 전체는 [출처대장](data/sources.json), 항목별 처리는 [관리항목](data/components.json)에 있습니다. 원문 매뉴얼·게시글 전체를 재배포하지 않습니다. 개인정보·실차 정비 원본·계정 인증정보는 포함하지 않습니다.

## 검증 재현

Node.js에서 `node tests/research-gate.cjs`, `node tests/launch-defaults.cjs`, `node tests/preventive.cjs`, `node tests/validate.cjs`로 연구 계약을, `node --test ui/*.test.mjs`로 앱 모델을 검사합니다. 실제 차량 안전성이나 모든 기기에서의 알림 도착을 보증하지는 않습니다. 앱 빌드 방법은 공개 배포 안내를 참조하세요.
