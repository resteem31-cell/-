/**
 * 아나도 상담 신청 DB 수집 + 메일 알림 스크립트 (Google Apps Script)
 *
 * 설치 순서는 저장소의 README.md "상담 신청 메일·시트 연결" 을 따라 주세요.
 * 핵심만 요약하면:
 *   1) 구글 스프레드시트 → [확장 프로그램] → [Apps Script] 에 이 코드 전체를 붙여넣고 저장
 *   2) 위쪽 함수 선택 칸에서 testSetup 을 고르고 [실행] → 권한 허용
 *      → resteem@naver.com 으로 테스트 메일이 오고, 시트에 테스트 줄이 생기면 성공
 *   3) [배포] → [새 배포] → 웹 앱 / 실행 사용자: 나 / 액세스 권한: 모든 사용자
 *   4) 받은 웹 앱 URL 을 홈페이지 js/config.js 의 SUBMIT_URL 에 넣기
 *
 * 코드를 고친 뒤에는 [배포] → [배포 관리] → 연필 → 버전: "새 버전" → [배포] 를 해야 반영됩니다.
 */

var NOTIFY_EMAIL = 'resteem@naver.com'; // 신청 알림을 받을 메일 주소 (여러 개는 쉼표로 구분)
var SHEET_NAME = '상담신청';
var HEADERS = [
  '접수일시', '이름', '나이', '지역', '전화번호',
  '피부 고민(선택)', '피부타입', '추천제품', '테스트 주요 고민', '테스트 응답',
  '남기고 싶은 말', '개인정보 동의', '마케팅 수신 동의',
  '유입경로(utm_source)', '캠페인(utm_campaign)', '접속 페이지', '메일 발송'
];

/* ---------- 홈페이지에서 신청이 들어올 때 실행 ---------- */
function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.website) return json_({ ok: true }); // 스팸 방지용 숨김 칸이 채워지면 무시

  // 1) 메일 먼저 보냅니다 (시트에 문제가 있어도 메일은 받을 수 있도록)
  var mail = sendMail_(p);

  // 2) 시트에 저장
  var saved = 'ok';
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    getSheet_().appendRow([
      new Date(),
      clean_(p.name), clean_(p.age), clean_(p.region),
      "'" + clean_(p.phone), // 0으로 시작하는 번호가 숫자로 바뀌지 않도록
      clean_(p.concerns), clean_(p.skinType), clean_(p.recommended), clean_(p.concern), clean_(p.answers),
      clean_(p.message),
      p.privacy === 'Y' ? '동의' : '미동의',
      p.marketing === 'Y' ? '동의' : '미동의',
      clean_(p.utm_source), clean_(p.utm_campaign), clean_(p.page),
      mail === 'ok' ? '발송' : '실패: ' + mail
    ]);
  } catch (err) {
    saved = String(err);
    console.error('시트 저장 실패: ' + err);
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }

  return json_({ ok: mail === 'ok' || saved === 'ok', mail: mail, sheet: saved });
}

/* ---------- 브라우저로 웹 앱 주소를 열면 연결 상태를 보여줌 ---------- */
function doGet() {
  return json_({ ok: true, message: 'ANADO form endpoint', notify: NOTIFY_EMAIL });
}

/* ---------- 설치 확인용: 편집기에서 직접 실행하세요 ---------- */
function testSetup() {
  var sample = {
    name: '테스트', age: '50', region: '서울', phone: '010-0000-0000',
    concerns: '주름·탄력 저하', skinType: '건성 피부', concern: '주름·탄력 저하',
    recommended: '셀 텐션 캡슐 세럼', message: '설치 확인용 테스트입니다.',
    privacy: 'Y', marketing: 'N', utm_source: '', utm_campaign: '', page: 'testSetup'
  };
  var res = JSON.parse(doPost({ parameter: sample }).getContent());
  console.log('메일: ' + res.mail + ' / 시트: ' + res.sheet);
  console.log('남은 하루 메일 발송 가능 수: ' + MailApp.getRemainingDailyQuota());
  console.log('저장 시트 주소: ' + getSpreadsheet_().getUrl());
  if (res.mail !== 'ok') throw new Error('메일 발송 실패: ' + res.mail);
  if (res.sheet !== 'ok') throw new Error('시트 저장 실패: ' + res.sheet);
  console.log('✅ 설치 완료! ' + NOTIFY_EMAIL + ' 메일함(스팸함 포함)을 확인하세요.');
}

/* ---------- 내부 함수 ---------- */
function sendMail_(p) {
  if (!NOTIFY_EMAIL) return 'NOTIFY_EMAIL 비어 있음';
  var rows = [
    ['이름', p.name], ['나이', p.age], ['지역', p.region], ['전화번호', p.phone],
    ['피부 고민', p.concerns || '-'],
    ['피부타입 테스트', (p.skinType || '미응시') + (p.concern ? ' (' + p.concern + ')' : '')],
    ['추천 제품', p.recommended || '-'],
    ['남기고 싶은 말', p.message || '-'],
    ['문자 수신 동의', p.marketing === 'Y' ? '동의' : '미동의'],
    ['유입 경로', [p.utm_source, p.utm_campaign].filter(Boolean).join(' / ') || '-']
  ];
  var text = rows.map(function (r) { return r[0] + ': ' + (r[1] || ''); }).join('\n');
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
    return 'ok';
  } catch (err) {
    console.error('메일 발송 실패: ' + err);
    return String(err);
  }
}

// 스프레드시트에서 연 스크립트면 그 시트를, 아니면 "아나도 상담신청 DB" 시트를 새로 만들어 계속 사용합니다.
function getSpreadsheet_() {
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (ignore) {}
  if (ss) return ss;
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (ignore) {}
  }
  ss = SpreadsheetApp.create('아나도 상담신청 DB');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function getSheet_() {
  var ss = getSpreadsheet_();
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

function esc_(v) {
  return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  }).replace(/\n/g, '<br>');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
