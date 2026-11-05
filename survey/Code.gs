/**
 * 2026-2 EIT survey backend.
 * Bind this script to the response spreadsheet (Extensions > Apps Script),
 * then deploy as a web app: Execute as Me, Who has access Anyone.
 */
var SHEET_NAME = 'responses';

var COLUMNS = ['submitted_at', 'submission_id', 'lang', 'group', 'participant_id']
  .concat(['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','s13','s14','s15'])
  .concat(['strategy_other', 'gender', 'age', 'major', 'l1', 'l1_other',
    'start_age', 'study_years', 'abroad', 'stay_value', 'stay_unit', 'stay_months',
    'use_freq', 'self_speaking', 'self_listening', 'self_reading', 'self_writing',
    'test_toeic', 'test_toeic_speaking', 'test_toefl_ibt', 'test_ielts']);

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Stops respondent text from being evaluated as a spreadsheet formula. */
function clean_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  var s = String(value).slice(0, 5000);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var data = JSON.parse(e.postData.contents);
    if (!data.submission_id || !data.participant_id) {
      return json_({ ok: false, error: 'missing fields' });
    }
    lock.waitLock(20000);
    var sheet = getSheet_();
    var last = sheet.getLastRow();
    if (last > 1) {
      var ids = sheet.getRange(2, 2, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0] === data.submission_id) return json_({ ok: true, duplicate: true });
      }
    }
    var row = COLUMNS.map(function (c) {
      return c === 'submitted_at' ? new Date() : clean_(data[c]);
    });
    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/** Run once from the editor to create the sheet and approve permissions. */
function setup() {
  getSheet_();
}
