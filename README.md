# 🌐 해외영업 마케팅 에이전트 (Global Sales Agent)

잠재 거래처를 탐색하고 Gmail로 영업 이메일을 자동 발송하는 웹앱입니다.

## 주요 기능
- **거래처 탐색** — 키워드 + 국가로 Google/LinkedIn/Alibaba 등에서 잠재 거래처 검색
- **거래처 DB** — 거래처 관리(CRUD), 상태 추적, CSV 가져오기/내보내기
- **이메일 템플릿** — 변수 자동 치환(`{{company}}`, `{{contact}}` 등), 영문 기본 템플릿 제공
- **캠페인 발송** — 선택한 거래처에 Gmail 일괄 발송, 진행률·이력 자동 기록
- **다기기 동기화** — Google Apps Script + Google Sheets로 모든 기기에서 데이터 공유

## 기술 구조
- 프론트엔드: 순수 HTML/CSS/JS (빌드 불필요)
- 호스팅: GitHub Pages (무료)
- 백엔드: Google Apps Script (이메일 발송 + 데이터 저장)
- 데이터: Google Sheets (다기기 동기화) + localStorage (오프라인 폴백)

## 설정 방법
1. `settings.html`(⚙️ Gmail 설정)에서 Apps Script 코드를 복사
2. [script.google.com](https://script.google.com)에 새 프로젝트로 붙여넣고 웹 앱으로 배포
3. 배포 URL을 설정 페이지에 입력 → 이메일 발송 + 동기화 활성화

## 라이선스
개인/사내 업무용
