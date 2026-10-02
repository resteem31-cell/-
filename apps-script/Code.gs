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
 * 신청이 들어오면 "상담신청" 시트에 한 줄씩 자동으로 쌓이고,
 * 아래 NOTIFY_EMAIL 주소로 알림 메일이 발송됩니다.
 * (처음 배포할 때 "메일 보내기" 권한 허용 창이 뜨면 허용해 주세요.)
 */

var SHEET_NAME = '상담신청';
var NOTIFY_EMAIL = 'resteem@naver.com'; // 신청 알림을 받을 메일 주소 (여러 개는 쉼표로 구분)
var HEADERS = [
  '접수일시', '이름', '나이', '지역', '전화번호',
  '피부 고민(선택)', '피부타입', '추천제품', '테스트 주요 고민', '테스트 응답',
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
      clean_(p.concerns),
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
    notify_(p);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function notify_(p) {
  if (!NOTIFY_EMAIL) return;
  var rows = [
    ['이름', p.name], ['나이', p.age], ['지역', p.region], ['전화번호', p.phone],
    ['피부 고민', p.concerns || '-'],
    ['피부타입 테스트', p.skinType + (p.concern ? ' (' + p.concern + ')' : '')],
    ['추천 제품', p.recommended || '-'],
    ['남기고 싶은 말', p.message || '-'],
    ['문자 수신 동의', p.marketing === 'Y' ? '동의' : '미동의'],
    ['유입 경로', [p.utm_source, p.utm_campaign].filter(Boolean).join(' / ') || '-']
  ];
  var text = rows.map(function (r) { return r[0] + ': ' + (r[1] || '') ; }).join('\n');
  var html = '<h2 style="font-family:serif;color:#8C6A35">아나도 상담 신청이 접수되었습니다</h2>' +
    '<table cellpadding="8" style="border-collapse:collapse;font-size:15px">' +
    rows.map(function (r) {
      return '<tr><th align="left" style="background:#F3EDE3;border:1px solid #E6DED2;white-space:nowrap">' + r[0] +
        '</th><td style="border:1px solid #E6DED2">' + esc_(r[1]) + '</td></tr>';
    }).join('') + '</table>';
  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: '[아나도 상담신청] ' + (p.name || '') + ' / ' + (p.region || '') + ' / ' + (p.age || '') + '세',
      body: text,
      htmlBody: html,
      name: 'ANADO 홈페이지'
    });
  } catch (err) {
    console.error(err); // 메일이 실패해도 시트 저장은 유지됩니다
  }
}

function esc_(v) {
  return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  }).replace(/\n/g, '<br>');
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
