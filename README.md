# ANADO 아나도 홈페이지

40~60대 여성 고객을 위한 아나도 제품 소개 + 피부타입 테스트 + 상담 신청(DB 수집) 홈페이지입니다.
별도 빌드 없이 바로 열리는 정적 사이트입니다 (`index.html`).

## 구성
| 파일 | 내용 |
|---|---|
| `index.html` | 홈페이지 본문 (브랜드, 4단계 루틴, 제품 4종, 피부타입 테스트, 상담 신청서) |
| `css/style.css` | 디자인 (아이보리 · 골드 톤, 큰 글씨) |
| `js/main.js` | 피부타입 테스트, 신청서 검사·전송 |
| `js/config.js` | **신청서를 받을 메일 주소** |
| `assets/img/` | 제품 사진, 로고 |

## 상담 신청 메일 받기 (FormSubmit)
신청서를 제출하면 [FormSubmit](https://formsubmit.co) 을 통해 `js/config.js` 의 `NOTIFY_EMAIL`(resteem@naver.com)로 신청 내용이 표 형태로 발송됩니다. 구글 설정은 필요 없습니다.

1. 홈페이지에서 처음 한 번 신청하면, 신청서 위에 "메일 수신 인증이 필요합니다" 안내가 나오고 resteem@naver.com 으로 **FormSubmit 인증 메일**이 옵니다 (스팸함 확인).
2. 메일 안의 **Activate Form** 버튼을 누릅니다.
3. 다시 신청하면 "[아나도 상담신청] 이름 / 지역 / 나이" 제목의 메일이 도착합니다.

받는 주소를 바꾸려면 `js/config.js` 의 `NOTIFY_EMAIL` 만 고치고, 새 주소로 다시 인증하면 됩니다.

## 공개 전 확인할 것
- `index.html` 하단 푸터의 `[상호명]`, `[대표자명]`, `[사업자등록번호]`, `[주소]`, `[고객센터]` 를 실제 정보로 바꿔 주세요.
- 개인정보 수집·이용 동의 문구(보유 기간 등)가 실제 운영 방침과 맞는지 확인해 주세요.
- 제품 설명 문구는 상세페이지를 바탕으로 작성했습니다. 화장품 표시·광고 기준에 맞는지 최종 확인해 주세요.

## 사이트 공개 방법
GitHub 저장소 [Settings] → [Pages] 에서 이 브랜치의 루트(`/`)를 선택하면 무료로 공개됩니다.
Netlify 등에 폴더를 그대로 올려도 됩니다.

## Claude Code 도구
`.claude/skills/` 에 website-builder-setup, ui-ux-pro-max 스킬이 들어 있고, `.mcp.json` 에 21st.dev Magic 설정이 있습니다
(환경 변수 `TWENTY_FIRST_API_KEY` 필요).
