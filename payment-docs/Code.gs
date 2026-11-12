/**
 * 신분증·통장 사본 제출 (2026 EIT Project)
 * - 독립형 Apps Script. 위치: 지급 서류 폴더 > 신분증·통장 사본 제출
 * - 제출 페이지: https://haeinpark-117.github.io/2026eitproject/payment-docs/
 *   페이지가 이 웹앱(doPost)으로 파일을 보내고, 파일은 서류별 하위 폴더에 저장됩니다.
 *     지급 서류 > 신분증 사본 / 지급 서류 > 통장 사본
 * - 기록: 지급 서류 > 신분증·통장 사본 log
 *     "제출 기록" 탭: 모든 제출 (제출시각, 제출ID, 성명, 참여자ID, 파일 링크, 동의)
 *     "참여자" 탭: 개인별 링크(?t=토큰)를 메일로 보낼 때만 사용 (선택)
 * - 관리 작업은 편집기 상단에서 함수를 선택하고 [실행]을 누르십시오. 결과는 실행 로그에 표시됩니다.
 *     generateTokens   참여자 탭에서 토큰이 빈 행에 토큰 생성
 *     sendLinks        링크를 아직 받지 않은 참여자에게 개인별 제출 링크 발송
 *     sendReminders    개인별 링크를 받았지만 미제출인 참여자에게 리마인더 발송
 *     trashAllFiles    정산 완료 후 제출 파일 일괄 휴지통 이동
 * - 코드를 수정한 뒤에는 배포 > 배포 관리 > 편집 > 새 버전으로 다시 배포하십시오.
 */

const CONFIG = {
  FOLDERS: {
    idcard: '1kE-UKjc-WgLzFH3CZoA-UYewoHrfeywJ',   // 지급 서류 > 신분증 사본
    bank:   '1YEenUPS6PlsjxXYCsf9tB28DciPKDy2E'    // 지급 서류 > 통장 사본
  },
  SHEET_ID: '1pNcSc6-wUJ3wV28xkg1ee0oRxFS99MCHYv0jxAKt1zg',   // 지급 서류 > 신분증·통장 사본 log
  PAGE_URL: 'https://haeinpark-117.github.io/2026eitproject/payment-docs/',
  TIMEZONE: 'Asia/Seoul',
  STUDY_TITLE: '인공지능 기반 외국어 평가 진단 시스템 구축을 위한 EIT 응답 코퍼스 개발',
  RESEARCHER: '박해인 (경희대학교 응용영어통번역학과)',
  CONTACT_EMAIL: 'haeinpark@khu.ac.kr',
  DEADLINE: '[제출 기한]',
  MAX_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf']
};

const LOG_SHEET = '제출 기록';
const LOG_HEADERS = ['제출시각', '제출ID', '성명', '참여자ID', '신분증 사본', '통장 사본', '개인정보 동의'];
const PEOPLE_SHEET = '참여자';
const COL = { ID: 1, NAME: 2, EMAIL: 3, TOKEN: 4, ID_FILE: 5, BANK_FILE: 6, SUBMITTED: 7, LINK_SENT: 8, REMINDED: 9, TYPED_NAME: 10 };
const PEOPLE_HEADERS = ['참여자ID', '이름', '이메일', '토큰', '신분증 파일ID', '통장 파일ID', '제출완료시각', '링크발송시각', '리마인더발송시각', '입력 성명'];
const DOCS = {
  idcard: { label: '신분증', col: COL.ID_FILE },
  bank:   { label: '통장',   col: COL.BANK_FILE }
};

/* ───────────────────────── 웹앱 ───────────────────────── */

function doGet() {
  return json_({ ok: true, service: 'payment-docs' });
}

/**
 * 요청 본문(JSON, text/plain):
 * { form:'docs', submission_id, token?, name, consent:true,
 *   files:{ idcard:{name,mimeType,data}, bank:{name,mimeType,data} } }   data는 base64
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.form !== 'docs') return json_({ ok: false, error: 'unknown form' });
    const name = String(d.name || '').trim().slice(0, 40);
    if (!d.submission_id || !name) return json_({ ok: false, error: 'missing fields' });
    if (d.consent !== true) return json_({ ok: false, error: 'consent required' });
    const files = d.files || {};
    if (!files.idcard || !files.bank) return json_({ ok: false, error: 'both files required' });
    const blobs = { idcard: toBlob_(files.idcard), bank: toBlob_(files.bank) };

    lock.waitLock(30000);
    const log = logSheet_();
    const last = log.getLastRow();
    if (last > 1) {
      const ids = log.getRange(2, 2, last - 1, 1).getValues();
      for (let r = 0; r < ids.length; r++) {
        if (ids[r][0] === d.submission_id) return json_({ ok: true, duplicate: true });
      }
    }

    const p = findByToken_(String(d.token || ''));
    const now = new Date();
    const stamp = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss');
    const prefix = p ? safe_(p.id) + '_' : '';
    const saved = {};
    Object.keys(DOCS).forEach(k => {
      const b = blobs[k];
      b.setName(prefix + safe_(name) + '_' + DOCS[k].label + '_' + stamp + b.getName());
      saved[k] = DriveApp.getFolderById(CONFIG.FOLDERS[k]).createFile(b);
    });

    if (p) {
      const sh = peopleSheet_();
      Object.keys(DOCS).forEach(k => {
        const oldId = sh.getRange(p.row, DOCS[k].col).getValue();
        if (oldId) { try { DriveApp.getFileById(oldId).setTrashed(true); } catch (err) { /* 무시 */ } }
        sh.getRange(p.row, DOCS[k].col).setValue(saved[k].getId());
      });
      sh.getRange(p.row, COL.TYPED_NAME).setValue(clean_(name));
      sh.getRange(p.row, COL.SUBMITTED).setValue(now);
    }

    log.appendRow([Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'), d.submission_id,
      clean_(name), p ? p.id : '', saved.idcard.getUrl(), saved.bank.getUrl(), '동의']);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (err) { /* 무시 */ }
  }
}

/* ───────────────────────── 관리 함수 (편집기에서 실행) ───────────────────────── */

function generateTokens() {
  const sh = peopleSheet_();
  const last = sh.getLastRow();
  if (last < 2) { console.log('참여자 행이 없습니다.'); return; }
  const rng = sh.getRange(2, 1, last - 1, COL.TOKEN);
  const vals = rng.getValues();
  let n = 0;
  vals.forEach(r => {
    if (r[COL.ID - 1] && !r[COL.TOKEN - 1]) {
      r[COL.TOKEN - 1] = Utilities.getUuid().replace(/-/g, '');
      n++;
    }
  });
  rng.setValues(vals);
  console.log(n + '명의 토큰을 생성했습니다.');
}

function sendLinks() {
  const sh = peopleSheet_();
  let n = 0;
  rows_().forEach(p => {
    if (!p.token || !p.email || p.linkSent) return;
    MailApp.sendEmail({
      to: p.email,
      subject: '[' + CONFIG.STUDY_TITLE + '] 사례비 지급 서류 제출 안내',
      htmlBody: mailBody_(p, false),
      name: CONFIG.RESEARCHER
    });
    sh.getRange(p.row, COL.LINK_SENT).setValue(new Date());
    n++;
  });
  console.log(n + '명에게 제출 링크를 발송했습니다. 남은 일일 발송 한도: ' + MailApp.getRemainingDailyQuota());
}

function sendReminders() {
  const sh = peopleSheet_();
  const targets = rows_().filter(p => p.token && p.email && p.linkSent && !p.submitted);
  targets.forEach(p => {
    MailApp.sendEmail({
      to: p.email,
      subject: '[' + CONFIG.STUDY_TITLE + '] 사례비 지급 서류 제출 요청 (재안내)',
      htmlBody: mailBody_(p, true),
      name: CONFIG.RESEARCHER
    });
    sh.getRange(p.row, COL.REMINDED).setValue(new Date());
  });
  console.log(targets.length + '명에게 리마인더를 발송했습니다.');
}

/** 정산 완료 후에만 실행하십시오. 두 하위 폴더의 모든 파일을 휴지통으로 옮기고 참여자 탭의 파일ID 기록을 지웁니다. */
function trashAllFiles() {
  let n = 0;
  Object.keys(CONFIG.FOLDERS).forEach(k => {
    const it = DriveApp.getFolderById(CONFIG.FOLDERS[k]).getFiles();
    while (it.hasNext()) { it.next().setTrashed(true); n++; }
  });
  const sh = peopleSheet_();
  if (sh.getLastRow() > 1) sh.getRange(2, COL.ID_FILE, sh.getLastRow() - 1, 2).clearContent();
  console.log(n + '개 파일을 휴지통으로 옮겼습니다. 휴지통은 30일 후 자동 삭제되며, 즉시 삭제하려면 휴지통을 직접 비우십시오.');
}

/* ───────────────────────── 내부 함수 ───────────────────────── */

function toBlob_(f) {
  if (!f || CONFIG.ALLOWED_TYPES.indexOf(f.mimeType) < 0) throw new Error('JPG, PNG, HEIC, PDF 파일만 제출할 수 있습니다.');
  const bytes = Utilities.base64Decode(String(f.data || ''));
  if (!bytes.length) throw new Error('빈 파일입니다.');
  if (bytes.length > CONFIG.MAX_MB * 1024 * 1024) throw new Error('파일 크기는 ' + CONFIG.MAX_MB + 'MB 이하여야 합니다.');
  return Utilities.newBlob(bytes, f.mimeType, ext_(f.mimeType, f.name));   // 이름은 확장자만, 저장 시 앞부분을 붙임
}

function logSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sh = ss.getSheetByName(LOG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(LOG_SHEET, 0);
    sh.appendRow(LOG_HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function peopleSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sh = ss.getSheetByName(PEOPLE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(PEOPLE_SHEET);
    sh.appendRow(PEOPLE_HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_() {
  const sh = peopleSheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, PEOPLE_HEADERS.length).getValues().map((r, i) => ({
    row: i + 2,
    id: String(r[COL.ID - 1]).trim(),
    name: String(r[COL.NAME - 1]).trim(),
    email: String(r[COL.EMAIL - 1]).trim(),
    token: String(r[COL.TOKEN - 1]).trim(),
    submitted: r[COL.SUBMITTED - 1],
    linkSent: r[COL.LINK_SENT - 1]
  }));
}

function findByToken_(token) {
  if (!/^[0-9a-f]{32}$/.test(token)) return null;
  return rows_().find(p => p.token === token) || null;
}

function mailBody_(p, isReminder) {
  const link = CONFIG.PAGE_URL + '?t=' + p.token;
  const lead = isReminder
    ? '사례비 지급 서류가 아직 제출되지 않아 다시 안내드립니다.'
    : CONFIG.STUDY_TITLE + ' 연구에 참여해 주셔서 감사합니다.';
  return [
    '<p>' + esc_(p.name) + ' 님께,</p>',
    '<p>' + lead + '<br>참여 사례비 지급을 위해 아래 링크에서 <b>신분증 사본</b>과 <b>통장 사본</b>을 제출해 주시기 바랍니다.</p>',
    '<p><a href="' + link + '" style="display:inline-block;padding:10px 18px;background:#3840f3;color:#fff;text-decoration:none;border-radius:6px">서류 제출하기</a></p>',
    '<p>제출 기한: ' + CONFIG.DEADLINE + '</p>',
    '<ul>',
    '<li>이 링크는 ' + esc_(p.name) + ' 님 전용입니다. 다른 사람에게 공유하지 마십시오.</li>',
    '<li>제출하신 서류는 사례비 지급 목적으로만 사용됩니다.</li>',
    '</ul>',
    '<p>문의: ' + CONFIG.CONTACT_EMAIL + '</p>',
    '<p>' + CONFIG.RESEARCHER + '</p>'
  ].join('\n');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(value) {
  const s = String(value == null ? '' : value).slice(0, 200);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function ext_(mime, name) {
  const m = /\.[A-Za-z0-9]{2,5}$/.exec(name || '');
  if (m) return m[0].toLowerCase();
  return { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/heic': '.heic', 'image/heif': '.heif', 'application/pdf': '.pdf' }[mime] || '';
}

function safe_(s) {
  return String(s).replace(/[\\\/:*?"<>|]/g, '').slice(0, 40);
}

function esc_(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
