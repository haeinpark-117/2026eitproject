/**
 * LVLT (Korean version): storage and scoring backend (Google Apps Script)
 *
 * 1. Run setup() once. It creates the "LVLT Korean Online" spreadsheet inside the
 *    LVLT Drive folder, with Config, Key, Sessions, and Responses tabs.
 * 2. Deploy as a web app:  Execute as: Me    Who has access: Anyone
 *
 * The answer key lives only in the Key tab of the spreadsheet (never in the web page).
 * Every submission is scored against the Key tab. If you correct the Key tab later,
 * run rescoreAll() to recompute the Correct column and the session scores.
 */

const CONFIG = {
  FOLDER_ID: '1v4r-L8X59vD_MTVPIGXRzvodmwMIVOJO', // 2026 EIT Corpus Project/Instruments/Listening Vocabulary Levels Test (LVLT)
  SHEET_NAME: 'LVLT Korean Online',
  TIMEZONE: 'Asia/Seoul',
  FORM_VERSION: 'LVLT-KR draft 2026-11-05'
};

const PARTS = {
  1: { level: '1K', n: 24 }, 2: { level: '2K', n: 24 }, 3: { level: '3K', n: 24 },
  4: { level: '4K', n: 24 }, 5: { level: '5K', n: 24 }, 6: { level: 'AWL', n: 30 }
};

// Official LVLT Answer Key v.9 (McLean, Kramer, & Beglar, 2015). Used only by setup().
const SEED_KEY = {
  1: 'CAADBDCBAAACDADCCCCCBAAD', 2: 'ABDDDAACDDDDACACCDBADBCA', 3: 'DBCDAABAACCDDDAACAACCCDA',
  4: 'ADBDBBCADAABDAAACABCCCBD', 5: 'ADCDAAADBABBCADCBBACAACC', 6: 'BDACABBDBBAACACACCDBADDBCBCDDB'
};
const SEED_TARGETS = {
  1: ['time','stone','poor','drive','jump','shoe','test','nothing','cross','actual','any','far','game','cause','many','where','school','grow','flower','handle','camp','lake','past','round'],
  2: ['maintain','period','standard','basis','upset','drawer','pub','circle','pro','soldier','result','resist','lend','refuse','speech','pressure','refer','army','knee','rope','brand','seal','warn','reserve'],
  3: ['restore','compound','latter','pave','remedy','bacterium','behavior','fuel','silk','conceive','legend','impose','solution','celebrate','independence','tunnel','reward','review','mode','personnel','competent','devastate','constituent','weave'],
  4: ['patience','strap','weep','haunt','cube','peel','distress','depart','romance','ambition','dash','drown','originate','leaf','amateur','evacuate','exert','marble','diminish','sheriff','monarch','plunge','mourn','fragile'],
  5: ['scrub','dinosaur','nun','compost','miniature','crab','vocabulary','corpse','rove','divert','trench','technician','query','mug','static','slaughter','spider','circus','sofa','logo','commemorate','crook','volt','warfare'],
  6: ['concept','similar','item','component','compensate','professional','external','clause','migrate','priority','reverse','arbitrary','mutual','alternative','colleague','legal','site','institute','retain','phase','pursue','recover','diverse','hierarchy','distort','accumulate','abandon','rigid','notwithstanding','perspective']
};

const SESSION_HEADERS = [
  'Last saved (KST)', 'Session ID', 'Participant ID', 'RA', 'Started at (KST)', 'Form version',
  'Parts administered', 'P1 1K', 'P2 2K', 'P3 3K', 'P4 4K', 'P5 5K', 'P6 AWL',
  'Total correct', 'Total items', 'Completed', 'Incidents', 'Browser'
];
const RESPONSE_HEADERS = [
  'Saved at (KST)', 'Session ID', 'Participant ID', 'Part', 'Level', 'Item', 'Target',
  'Response', 'Key', 'Correct', 'RT from item onset (ms)', 'Changes'
];

/** Run once from the editor. Creates the spreadsheet in the LVLT folder. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SHEET_ID')) {
    const book = SpreadsheetApp.create(CONFIG.SHEET_NAME);
    DriveApp.getFileById(book.getId()).moveTo(DriveApp.getFolderById(CONFIG.FOLDER_ID));

    const cfg = book.getSheets()[0].setName('Config');
    cfg.getRange(1, 1, 4, 3).setValues([
      ['Setting', 'Value', 'Note'],
      ['active_parts', '1,2,3,4,5,6', 'Parts given, in order (1=1K ... 5=5K, 6=AWL). Example: 3,4,5,6'],
      ['show_score', 'no', 'yes = show the total on the final screen'],
      ['form_version', CONFIG.FORM_VERSION, 'Written to every session row']
    ]);
    cfg.getRange(1, 1, 1, 3).setFontWeight('bold');
    cfg.setColumnWidth(1, 140); cfg.setColumnWidth(2, 200); cfg.setColumnWidth(3, 420);

    const key = book.insertSheet('Key');
    const rows = [['Part', 'Level', 'Item', 'Target', 'Key']];
    Object.keys(PARTS).forEach(function (p) {
      for (let i = 0; i < PARTS[p].n; i++) {
        rows.push([Number(p), PARTS[p].level, i + 1, SEED_TARGETS[p][i], SEED_KEY[p].charAt(i)]);
      }
    });
    key.getRange(1, 1, rows.length, 5).setValues(rows);
    key.getRange(1, 1, 1, 5).setFontWeight('bold');
    key.setFrozenRows(1);

    const ses = book.insertSheet('Sessions');
    ses.getRange(1, 1, 1, SESSION_HEADERS.length).setValues([SESSION_HEADERS]).setFontWeight('bold');
    ses.setFrozenRows(1);

    const res = book.insertSheet('Responses');
    res.getRange(1, 1, 1, RESPONSE_HEADERS.length).setValues([RESPONSE_HEADERS]).setFontWeight('bold');
    res.setFrozenRows(1);

    props.setProperty('SHEET_ID', book.getId());
  }
  Logger.log('Sheet: ' + book_().getUrl());
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    if (params.action === 'config') {
      const c = config_();
      return json_({ ok: true, activeParts: c.activeParts, showScore: c.showScore, formVersion: c.formVersion });
    }
    if (params.action === 'check') {
      const pid = cleanId_(params.pid, 'participant ID');
      const n = rows_('Sessions', SESSION_HEADERS.length).filter(function (r) { return String(r[2]) === pid; }).length;
      return json_({ ok: true, count: n });
    }
    return json_({ ok: true, service: 'lvlt-korean' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

/**
 * Body (JSON, sent as text/plain): { sessionId, participantId, raName, startedAt,
 *   activeParts, part, answers: [{ item, choice, rtMs, changes }], incidents, final, userAgent }
 * One POST per part, plus a final POST ({ final: true, part: null }) at the end.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    const d = JSON.parse(e.postData.contents);
    const sessionId = cleanId_(d.sessionId, 'session ID');
    const pid = cleanId_(d.participantId, 'participant ID');
    const part = d.part == null ? null : Number(d.part);
    if (part !== null && !PARTS[part]) throw new Error('Invalid part');

    lock.waitLock(30000);
    locked = true;

    const now = new Date();
    const stamp = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const c = config_();
    let partScore = null;

    if (part !== null) {
      const res = sheet_('Responses');
      const already = rows_('Responses', RESPONSE_HEADERS.length).some(function (r) {
        return String(r[1]) === sessionId && Number(r[3]) === part;
      });
      if (!already) {
        const key = keyMap_();
        const byItem = {};
        (d.answers || []).forEach(function (a) { byItem[Number(a.item)] = a; });
        const out = [];
        partScore = 0;
        for (let i = 1; i <= PARTS[part].n; i++) {
          const a = byItem[i] || {};
          const choice = /^[ABCD]$/.test(String(a.choice || '')) ? String(a.choice) : '';
          const k = key[part + '-' + i] || { key: '', target: '' };
          const correct = choice !== '' && choice === k.key ? 1 : 0;
          partScore += correct;
          out.push([stamp, sessionId, pid, part, PARTS[part].level, i, k.target, choice, k.key, correct,
            a.rtMs == null ? '' : Math.round(Number(a.rtMs)) || 0, Number(a.changes) || 0]);
        }
        res.getRange(res.getLastRow() + 1, 1, out.length, RESPONSE_HEADERS.length).setValues(out);
      }
    }

    upsertSession_(sessionId, pid, d, stamp, c);
    const totals = sessionTotals_(sessionId);
    const reply = { ok: true, part: part, saved: true };
    if (d.final && c.showScore) reply.total = totals.correct + ' / ' + totals.items;
    return json_(reply);
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function upsertSession_(sessionId, pid, d, stamp, c) {
  const ses = sheet_('Sessions');
  const data = rows_('Sessions', SESSION_HEADERS.length);
  let rowIndex = -1;
  for (let i = 0; i < data.length; i++) if (String(data[i][1]) === sessionId) { rowIndex = i + 2; break; }
  if (rowIndex === -1) {
    rowIndex = ses.getLastRow() + 1;
    ses.getRange(rowIndex, 1, 1, 7).setValues([[stamp, sessionId, pid, safe_(d.raName), safe_(d.startedAt),
      c.formVersion, safe_((d.activeParts || []).join(','))]]);
    ses.getRange(rowIndex, 18).setValue(safe_(d.userAgent));
  }
  const t = sessionTotals_(sessionId);
  const partCells = [1, 2, 3, 4, 5, 6].map(function (p) { return t.byPart[p] == null ? '' : t.byPart[p]; });
  ses.getRange(rowIndex, 1).setValue(stamp);
  ses.getRange(rowIndex, 8, 1, 9).setValues([partCells.concat([t.correct, t.items, d.final ? 'yes' : 'no'])]);
  if (d.incidents && d.incidents.length) ses.getRange(rowIndex, 17).setValue(safe_(d.incidents.join(' | ')));
}

function sessionTotals_(sessionId) {
  const byPart = {};
  let correct = 0, items = 0;
  rows_('Responses', RESPONSE_HEADERS.length).forEach(function (r) {
    if (String(r[1]) !== sessionId) return;
    const p = Number(r[3]);
    byPart[p] = (byPart[p] || 0) + Number(r[9]);
    correct += Number(r[9]);
    items += 1;
  });
  return { byPart: byPart, correct: correct, items: items };
}

/** Run after editing the Key tab: recomputes Correct and all session scores. */
function rescoreAll() {
  const key = keyMap_();
  const res = sheet_('Responses');
  const data = rows_('Responses', RESPONSE_HEADERS.length);
  if (!data.length) return;
  const fixed = data.map(function (r) {
    const k = key[Number(r[3]) + '-' + Number(r[5])] || { key: '', target: '' };
    return [k.target, r[7], k.key, r[7] !== '' && r[7] === k.key ? 1 : 0];
  });
  res.getRange(2, 7, fixed.length, 4).setValues(fixed);
  const ses = sheet_('Sessions');
  rows_('Sessions', SESSION_HEADERS.length).forEach(function (r, i) {
    const t = sessionTotals_(String(r[1]));
    const cells = [1, 2, 3, 4, 5, 6].map(function (p) { return t.byPart[p] == null ? '' : t.byPart[p]; });
    ses.getRange(i + 2, 8, 1, 8).setValues([cells.concat([t.correct, t.items])]);
  });
}

function keyMap_() {
  const m = {};
  rows_('Key', 5).forEach(function (r) {
    m[Number(r[0]) + '-' + Number(r[2])] = { target: String(r[3]), key: String(r[4]).trim().toUpperCase() };
  });
  return m;
}

function config_() {
  const vals = sheet_('Config').getDataRange().getValues();
  const m = {};
  vals.slice(1).forEach(function (r) { m[String(r[0]).trim()] = String(r[1]).trim(); });
  const active = String(m.active_parts || '1,2,3,4,5,6').split(/[\s,]+/)
    .map(Number).filter(function (p) { return PARTS[p]; });
  return {
    activeParts: active.length ? active : [1, 2, 3, 4, 5, 6],
    showScore: /^(yes|y|true|1)$/i.test(m.show_score || ''),
    formVersion: m.form_version || CONFIG.FORM_VERSION
  };
}

function book_() {
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
}
function sheet_(name) { return book_().getSheetByName(name); }
function rows_(name, width) {
  const s = sheet_(name);
  const last = s.getLastRow();
  return last < 2 ? [] : s.getRange(2, 1, last - 1, width).getValues();
}

function cleanId_(value, label) {
  const s = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(s)) throw new Error('Invalid ' + label);
  return s;
}

/** Stops free text from being read as a Sheet formula. */
function safe_(value) {
  const s = String(value == null ? '' : value).slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
