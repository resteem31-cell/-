/**
 * 아나도 상담 신청 DB 수집 스크립트 (Google Apps Script)
 *
 * 설치 방법
 * 1. 구글 스프레드시트를 새로 만듭니다.
 * 2. 메뉴 [확장 프로그램] → [Apps Script] 를 엽니다.
 * 3. 기본 코드를 모두 지우고 이 파일 내용을 붙여넣은 뒤 저장합니다.
 * 4. [배포] → [새 배포] → 유형: 웹 앱
 *      - 실행 사용자: 나
 *      - 액세스 권한: 모든 사용자
 *    배포 후 표시되는 "웹 앱 URL"을 복사합니다.
 * 5. 홈페이지의 js/config.js 파일 SUBMIT_URL 에 그 주소를 붙여넣습니다.
 *
 * 신청이 들어오면 "상담신청" 시트에 한 줄씩 자동으로 쌓입니다.
 */

var SHEET_NAME = '상담신청';
var HEADERS = [
  '접수일시', '이름', '나이', '지역', '전화번호',
  '피부타입', '추천제품', '피부고민', '테스트 응답',
  '남기고 싶은 말', '개인정보 동의', '마케팅 수신 동의',
  '유입경로(utm_source)', '캠페인(utm_campaign)', '접속 페이지'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var p = (e && e.parameter) || {};

    // 스팸 방지용 숨김 칸이 채워져 있으면 저장하지 않습니다.
    if (p.website) return json_({ ok: true });

    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      clean_(p.name),
      clean_(p.age),
      clean_(p.region),
      "'" + clean_(p.phone), // 0으로 시작하는 번호가 숫자로 바뀌지 않도록
      clean_(p.skinType),
      clean_(p.recommended),
      clean_(p.concern),
      clean_(p.answers),
      clean_(p.message),
      p.privacy === 'Y' ? '동의' : '미동의',
      p.marketing === 'Y' ? '동의' : '미동의',
      clean_(p.utm_source),
      clean_(p.utm_campaign),
      clean_(p.page)
    ]);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, message: 'ANADO form endpoint' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#f3ece0');
  }
  return sheet;
}

// 수식 실행(=, +, -, @ 로 시작) 방지 및 길이 제한
function clean_(v) {
  v = String(v == null ? '' : v).slice(0, 2000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
