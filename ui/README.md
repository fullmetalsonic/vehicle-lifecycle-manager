# 차량 노트 공통 화면·모델

`ui/`는 Android와 로컬 미리보기에 사용하는 원본입니다. 현재 사용법·제약은 [공개 배포 안내](../docs/PUBLIC_RELEASE.md)를 참조하세요.

- `node ui/server.cjs`: 127.0.0.1:4178 웹 시안. 합성 예시이며 새로고침하면 초기화됩니다.
- `node scripts/build-mobile.cjs`: `dist-mobile/` 생성. 빈 차량 목록에서 시작하는 실제 저장 모드이며 예시 차량을 제거합니다.
- `VEHICLE_UI_MOBILE=1`, `VEHICLE_UI_PORT=4179` 환경변수로 같은 서버를 실행하면 실제 모드 브라우저 검증이 가능합니다. 브라우저는 IndexedDB, Android는 SQLite·전용 파일을 사용합니다.
- `npm run prepare:ocr`가 OCR 실행파일·언어모델을 설치된 의존성에서 준비합니다. OCR 사진은 외부 서버로 보내지 않습니다.
- `app-version.js`, `catalog-data.js`, `research-profiles.js`, `third-party.html`은 빌드 생성물입니다. 버전 원본은 Android build.gradle, 연구 원본은 `data/`입니다.

현재 통합 검사는 `scripts/verify-completion.cjs`, `scripts/verify-completion-edges.cjs`, `scripts/verify-polish.cjs`, `scripts/verify-release-ui.cjs`, `ui/verify-persistence.cjs`, `ui/verify-ocr.cjs`입니다. Playwright 설치 또는 `VEHICLE_PLAYWRIGHT_PATH` 설정이 필요합니다. 그 외 `verify-*`는 이전 시안별 검사이며 현재 통합 검사와 구분합니다.
