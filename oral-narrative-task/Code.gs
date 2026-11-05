/**
 * Oral Narrative Task: storage backend (Google Apps Script)
 *
 * Run setup() once, then deploy as a web app:
 *   Execute as: Me    Who has access: Anyone
 */

const CONFIG = {
  FOLDER_NAME: 'Oral Narrative Task Recordings',
  SHEET_NAME: 'Oral Narrative Task Log',
  TIMEZONE: 'Asia/Seoul',
  MAX_BYTES: 30 * 1024 * 1024,
  ALLOWED_MIME: ['audio/webm', 'audio/mp4', 'audio/ogg']
};

const HEADERS = [
  'Saved at (KST)', 'Session ID', 'Participant ID', 'RA', 'Started at (KST)',
  'Prep (s)', 'Planned speaking (s)', 'Actual speaking (s)', 'Ended early by RA',
  'Incident', 'Peak input level (0-1)', 'Audio format', 'Size (KB)',
  'File name', 'Drive link', 'Browser'
];

/** Run once from the editor. Creates the Drive folder and the log Sheet. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('FOLDER_ID')) {
    props.setProperty('FOLDER_ID', DriveApp.createFolder(CONFIG.FOLDER_NAME).getId());
  }
  if (!props.getProperty('SHEET_ID')) {
    const book = SpreadsheetApp.create(CONFIG.SHEET_NAME);
    const sheet = book.getSheets()[0];
    sheet.setName('Sessions');
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    props.setProperty('SHEET_ID', book.getId());
  }
  Logger.log('Folder: ' + DriveApp.getFolderById(props.getProperty('FOLDER_ID')).getUrl());
  Logger.log('Sheet: ' + SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getUrl());
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    if (params.action === 'check') {
      const pid = cleanParticipantId_(params.pid);
      const rows = sessionRows_();
      return json_({ ok: true, count: rows.filter(function (r) { return String(r[2]) === pid; }).length });
    }
    return json_({ ok: true, service: 'oral-narrative-task' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    const d = JSON.parse(e.postData.contents);
    const pid = cleanParticipantId_(d.participantId);
    const sessionId = String(d.sessionId || '');
    if (!/^[A-Za-z0-9-]{8,64}$/.test(sessionId)) throw new Error('Invalid session ID');

    const mime = String(d.mimeType || '').split(';')[0];
    if (CONFIG.ALLOWED_MIME.indexOf(mime) === -1) throw new Error('Unsupported audio format');

    const bytes = Utilities.base64Decode(String(d.audioBase64 || ''));
    if (!bytes.length) throw new Error('Empty recording');
    if (bytes.length > CONFIG.MAX_BYTES) throw new Error('Recording too large');

    lock.waitLock(30000);
    locked = true;

    // A retry after a lost response must not store the recording twice.
    const existing = sessionRows_().filter(function (r) { return String(r[1]) === sessionId; })[0];
    if (existing) return json_({ ok: true, duplicate: true, fileName: existing[13], url: existing[14] });

    const now = new Date();
    const stamp = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss');
    const ext = { 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg' }[mime];
    const fileName = 'ONT_' + pid + '_' + stamp + '.' + ext;

    const props = PropertiesService.getScriptProperties();
    const file = DriveApp.getFolderById(props.getProperty('FOLDER_ID'))
      .createFile(Utilities.newBlob(bytes, mime, fileName));

    sheet_().appendRow([
      Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
      sessionId, pid, safe_(d.raName), safe_(d.startedAt),
      Number(d.prepSeconds) || 0, Number(d.plannedSeconds) || 0, Number(d.actualSeconds) || 0,
      d.endedEarly ? 'yes' : 'no', safe_(d.incident), Number(d.peakLevel) || 0,
      safe_(d.mimeType), Math.round(bytes.length / 1024), fileName, file.getUrl(), safe_(d.userAgent)
    ]);

    return json_({ ok: true, fileName: fileName, url: file.getUrl() });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function sheet_() {
  return SpreadsheetApp
    .openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'))
    .getSheetByName('Sessions');
}

function sessionRows_() {
  const sheet = sheet_();
  const last = sheet.getLastRow();
  return last < 2 ? [] : sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
}

function cleanParticipantId_(value) {
  const pid = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(pid)) throw new Error('Invalid participant ID');
  return pid;
}

/** Stops free text from being read as a Sheet formula. */
function safe_(value) {
  const s = String(value == null ? '' : value).slice(0, 300);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
