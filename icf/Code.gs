/**
 * 2026 EIT Corpus Project: online informed consent (ICF) backend (Google Apps Script)
 *
 * 1. Run setup() once. It creates the "ICF log" spreadsheet inside the 연구참여동의서 folder.
 * 2. Deploy as a web app:  Execute as: Me    Who has access: Anyone
 *
 * Each submission is saved as a PDF (연구대상자 설명서 + 동의서) in the same folder,
 * logged in the spreadsheet, and returned to the page so the participant can download a copy.
 * If the participant enters an e-mail address, the PDF is also sent there.
 *
 * The consent text below must match icf/index.html. Edit both together.
 */

const CONFIG = {
  FOLDER_ID: '1z4h0XdTUIeGVPijLkWdRKJ7fo25q7AIi', // 2026 EIT Corpus Project/Instruments/연구참여동의서
  SHEET_NAME: 'ICF log',
  TIMEZONE: 'Asia/Seoul',
  EXPLAINER: '강지혜 / 이민서',
  SEND_COPY_EMAIL: true,
  FORM_VERSION: 'ICF 2026-11-05'
};

const YES = '예';
const NO = '아니오';

const STUDY = {
  title: '인공지능 기반 외국어 평가 진단 시스템 구축을 위한 EIT 응답 코퍼스 개발',
  meta: [
    ['연구 제목', '인공지능 기반 외국어 평가 진단 시스템 구축을 위한 EIT 응답 코퍼스 개발'],
    ['연구책임자', '박해인 / 경희대학교 응용영어통번역학과 부교수\n010-2779-1022 / haeinpark@khu.ac.kr'],
    ['동의담당자', '강지혜 / 경희대학교 응용영어통번역학과 석사과정\n이민서/경희대학교 응용영어통번역학과 학부과정'],
    ['연구기관', '경희대학교 서울캠퍼스'],
  ],
  intro: '이 연구는 한국인 성인 영어 학습자의 유도모방과제(Elicited Imitation Task, EIT) 수행에 영향을 미치는 요인을 알아보기 위한 것입니다. 아래 내용을 읽고 충분히 이해한 뒤 참여 여부를 결정해 주십시오. 참여는 자발적이며, 궁금한 점은 연구진에게 질문하실 수 있습니다.',
};

// 각 절: paragraphs 는 문단 배열, list 는 글머리표 목록(선택), afterList 는 목록 뒤 문단(선택)
const INFO_SECTIONS = [
  {
    heading: '1. 연구 목적 및 절차',
    paragraphs: [
      'EIT는 들려주는 영어 문장을 듣고 따라 말하는 과제입니다. 본 연구는 듣기·말하기 능력, 작업기억, 과제 수행 전략, 영어 학습 배경 등이 EIT 수행과 어떤 관련이 있는지 분석합니다. 연구 결과는 학습자의 영어 능력을 여러 측면에서 진단하는 평가 도구 개발의 기초자료로 활용됩니다.',
      '참여자는 연구기간(2026년 8월~2028년 2월) 중 경희대학교 문과대학 212A 세미나실을 1회 방문하여 연구조원과 약 60~90분 동안 다음 과제를 수행합니다.',
    ],
    list: [
      '영어 듣기 과제',
      '유도모방과제(EIT) 30문항 및 과제 수행 전략 설문',
      '주어진 주제에 대한 영어 말하기 과제',
      '단어 능숙도 과제',
      '기본정보 및 영어 학습 배경 설문(공인영어시험 점수 포함)',
    ],
    afterList: [
      'EIT와 말하기 과제의 응답은 음성으로 녹음됩니다. 연구책임자는 자료 수집에 참여하거나 동석하지 않으며, 연구조원이 1:1로 진행합니다.',
    ],
  },
  {
    heading: '2. 참여 대상 및 모집',
    paragraphs: [
      '만 19세 이상의 한국인 성인 영어 학습자(대학생 및 일반 성인) 약 160명을 모집합니다. 다음에 해당하는 경우 참여할 수 없습니다: 만 19세 미만, 자발적으로 참여 여부를 결정하기 어려운 경우, 청각·발화·인지 기능의 제한으로 과제 수행이 어려운 경우.',
      '교내·온라인 게시판과 학과 이메일 등의 모집 공고를 보고 연구용 이메일 또는 온라인 신청 링크로 자발적으로 신청한 분 중에서 모집합니다. 모집과 동의 절차는 연구조원이 담당하며 연구책임자는 관여하지 않습니다. 참여 여부는 다른 사람에게 공개되지 않습니다.',
    ],
  },
  {
    heading: '3. 자발적 참여와 중단·철회',
    paragraphs: [
      '참여 여부는 전적으로 본인의 자유로운 선택입니다. 참여하지 않거나 도중에 중단해도 성적, 학사평가, 장학금 등에 불이익이나 차별이 없습니다. 참여 중 언제든지 휴식을 요청하거나 과제를 중단할 수 있으며, 이유를 밝힐 필요도 없습니다. 연구진 또는 생명윤리심의위원회가 안전이나 권익 보호를 위해 필요하다고 판단하면 연구가 중단될 수 있습니다. 본 동의서에 서명해도 법적 권리를 포기하는 것은 아닙니다.',
      '연구자료의 삭제를 원하시면 참여일로부터 14일 이내에 동의담당자에게 요청해 주십시오. 성명·연락처와 연구 코드의 연결표를 14일 후 삭제하므로, 그 이후에는 본인의 자료를 특정하거나 삭제하기 어렵습니다. 전사 자료가 공개 데이터 저장소에 공개된 후에는 회수하거나 삭제할 수 없습니다.',
    ],
  },
  {
    heading: '4. 예상되는 위험·이득 및 사례비',
    paragraphs: [
      '신체적 처치가 없는 최소위험 연구입니다. 과제 수행 중 가벼운 피로감이나 영어 과제에 따른 긴장감이 생길 수 있습니다. 불편하면 연구조원에게 알리고 휴식하거나 참여를 중단할 수 있습니다. 연구 참여로 얻는 직접적인 의료적·건강상의 이득은 없습니다. 모든 연구 절차를 마친 참여자에게 시간과 노력에 대한 사례비 20,000원을 계좌이체로 지급합니다. 연구 참여와 직접 관련된 신체적·정신적 손상이 발생하면 연구책임자가 확인하고 경희대학교 관련 규정에 따라 조치 및 보상을 처리합니다.',
    ],
  },
  {
    heading: '5. 수집 정보 및 개인정보 보호',
    paragraphs: [
      '연구를 위해 다음 정보를 수집합니다: 음성 녹음, 성별·연령대·모국어 배경, 영어 학습 배경, 공인영어시험 점수, 설문 응답, 성명·연락처(참여 확인 및 자료 삭제 요청 처리), 계좌정보(모든 과제 종료 후 사례비 지급). 주민등록번호와 건강정보 등 민감정보는 수집하지 않습니다.',
      '연구자료는 연구책임자의 관리 아래 이름 대신 무작위 고유 코드로 저장합니다. 성명·연락처와 코드를 연결하는 대응표는 연구자료와 분리해 암호화하여 보관하고, 동의담당자만 열람할 수 있습니다. 연구책임자는 이 대응표를 열람하지 않습니다. 음성 원본과 연구자료의 접근은 연구진으로 제한하며, 연구 결과를 발표할 때 개인을 식별할 수 있는 정보는 공개하지 않습니다. 다만 법령에 따라 필요한 경우 정보가 제공될 수 있습니다.',
      '설문은 연구실 내 기기에서 Google Forms로 수집하며, 개인을 직접 식별하는 정보나 계정 정보가 자동 수집되지 않도록 설정합니다. 응답은 참여 직후 내려받아 암호화된 저장장치에 옮기고 온라인 원본은 삭제합니다.',
    ],
  },
  {
    heading: '6. 자료 보관·폐기 및 공개',
    table: [
      ['성명·연락처 및 코드 대응표', '참여일로부터 14일간 보관한 뒤 복구할 수 없도록 삭제'],
      ['계좌정보', '사례비 지급 후 폐기. 회계 증빙 보관 의무가 있는 경우 관련 기간 경과 후 폐기'],
      ['음성 원본', '전사 내용 검수와 결과 검증을 위해 연구 종료 후 3년간 암호화 보관한 뒤 폐기. 외부 공개하지 않음'],
      ['서면 동의서', '연구자료와 분리해 잠금장치가 있는 보관함에 보관하고 연구 종료 후 3년 뒤 파쇄'],
    ],
    paragraphs: [
      '개인식별정보를 모두 제거한 EIT 응답 전사 자료는 관련 논문이 학술지에 게재된 후 공개 데이터 저장소에 공개할 예정입니다. 공개 이후에는 자료를 회수하거나 폐기할 수 없습니다. 공개 및 향후 다른 연구 목적의 2차 활용 여부는 동의서에서 각각 선택할 수 있습니다.',
    ],
  },
  {
    heading: '7. 문의',
    paragraphs: [
      '연구책임자: 박해인 haeinpark@khu.ac.kr\n참여자의 권리 및 연구 윤리 관련 문의: 경희대학교 서울캠퍼스 생명윤리심의위원회 02-961-2342',
    ],
  },
];

const CONSENT_INTRO = '아래 내용을 읽고 각 항목에 표시해 주십시오. 개인정보 수집·이용 및 음성 녹음은 연구 참여에 필요한 사항입니다. 전사 자료의 공개와 2차 활용은 각각 별도로 선택할 수 있으며, 해당 항목에 동의하지 않아도 연구 참여 자체에는 불이익이 없습니다.';

// mandatory: true 인 항목에 '아니오'가 있으면 '참여 불가'로 표시됩니다.
const CONSENT_ITEMS = [
  { key: 'c1', mandatory: true,  text: '나는 연구대상자 설명서를 읽고 연구 목적과 절차를 이해했으며, 질문할 기회를 갖고 충분한 답변을 받았습니다.' },
  { key: 'c2', mandatory: true,  text: '나는 연구 참여가 자발적이며, 참여하지 않거나 언제든지 중단해도 불이익이 없음을 이해했습니다.' },
  { key: 'c3', mandatory: true,  text: '나는 연구진, 연구기관 및 생명윤리심의위원회가 연구의 진행과 결과 확인을 위해 필요한 범위에서 비밀이 보장되는 나의 정보를 열람할 수 있음에 동의합니다.' },
  { key: 'c4', mandatory: true,  text: '나는 연구 수행을 위해 설명서에 기재된 개인정보를 수집·이용하는 데 동의합니다.' },
  { key: 'c5', mandatory: true,  text: '나는 EIT와 말하기 과제 수행 중 나의 음성이 녹음되고, 설명서에 기재된 기간 동안 보관되는 데 동의합니다.' },
  { key: 'c6', mandatory: false, text: '나는 개인식별정보를 제거한 EIT 응답 전사 자료가 학술 목적으로 공개 데이터 저장소에 공개되는 데 동의합니다. 공개 후에는 회수하거나 삭제할 수 없음을 이해합니다.' },
  { key: 'c7', mandatory: false, text: '나는 위 전사 자료가 향후 다른 연구 목적으로 2차 활용되는 데 동의합니다.' },
  { key: 'c8', mandatory: true,  text: '나는 서명한 동의서 사본을 받았으며, 연구 참여가 끝날 때까지 보관하겠습니다.' },
];

const PRIVACY_TABLE = [
  ['성명·연락처', '참여 확인 및 자료 삭제 요청 처리', '참여일로부터 14일'],
  ['계좌정보', '사례비 지급', '지급 후 폐기(회계 증빙 의무가 있는 경우 해당 기간 경과 후)'],
  ['음성 녹음', '응답 전사·채점·검증', '연구 종료 후 3년'],
];

const PRIVACY_NOTE = '※ 연구자료는 고유 코드로 관리하며, 음성 원본과 서면 동의서는 연구 종료 후 3년간 보관합니다. 성명·연락처와 코드의 연결표는 참여일로부터 14일 후 삭제되므로, 이후에는 개인 자료를 특정하여 삭제하기 어렵습니다.';

const FOOTER = '연구책임자 박해인: haeinpark@khu.ac.kr\n경희대학교 서울캠퍼스 생명윤리심의위원회(서울시 동대문구 경희대로 26): 02-961-2342';

const LOG_HEADERS = ['Submitted at (KST)', 'Submission ID', 'Name', 'Explainer']
  .concat(CONSENT_ITEMS.map(function (it, i) { return 'Item ' + (i + 1); }))
  .concat(['Eligible', 'PDF', 'Copy e-mailed', 'Form version']);

/** Run once from the editor. Creates the log spreadsheet in the consent folder. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID');
  if (!id) {
    const book = SpreadsheetApp.create(CONFIG.SHEET_NAME);
    DriveApp.getFileById(book.getId()).moveTo(DriveApp.getFolderById(CONFIG.FOLDER_ID));
    const sh = book.getSheets()[0].setName('log');
    sh.appendRow(LOG_HEADERS);
    sh.setFrozenRows(1);
    id = book.getId();
    props.setProperty('SHEET_ID', id);
  }
  Logger.log('Log sheet: ' + SpreadsheetApp.openById(id).getUrl());
  Logger.log('PDF folder: ' + DriveApp.getFolderById(CONFIG.FOLDER_ID).getUrl());
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(value) {
  const s = String(value == null ? '' : value).slice(0, 200);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    const name = String(d.name || '').trim();
    if (!d.submission_id || !name || d.sign !== true) return json_({ ok: false, error: 'missing fields' });
    const answers = {};
    for (let i = 0; i < CONSENT_ITEMS.length; i++) {
      const it = CONSENT_ITEMS[i];
      const a = d.answers && d.answers[it.key];
      if (a !== YES && a !== NO) return json_({ ok: false, error: 'missing ' + it.key });
      answers[it.key] = a;
    }
    const eligible = CONSENT_ITEMS.every(function (it) { return !it.mandatory || answers[it.key] === YES; });
    if (!eligible) return json_({ ok: false, error: 'mandatory items not agreed' });

    lock.waitLock(20000);
    const sh = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')).getSheetByName('log');
    const last = sh.getLastRow();
    if (last > 1) {
      const ids = sh.getRange(2, 2, last - 1, 1).getValues();
      for (let r = 0; r < ids.length; r++) {
        if (ids[r][0] === d.submission_id) return json_({ ok: true, duplicate: true });
      }
    }

    const data = { timestamp: new Date(), name: name, explainer: CONFIG.EXPLAINER, answers: answers };
    const stamp = Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss');
    const safeName = name.replace(/[\\/:*?"<>|]/g, '').slice(0, 30) || 'noname';
    const fileName = '동의서_' + stamp + '_' + safeName + '.pdf';
    const pdf = Utilities.newBlob(buildConsentHtml(data, true), 'text/html', 'consent.html')
      .getAs('application/pdf').setName(fileName);
    const file = DriveApp.getFolderById(CONFIG.FOLDER_ID).createFile(pdf);

    let mailed = '';
    const email = String(d.email || '').trim();
    if (CONFIG.SEND_COPY_EMAIL && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      try {
        MailApp.sendEmail({
          to: email,
          subject: '[연구 참여 동의서 사본] ' + STUDY.title,
          body: name + ' 님,\n\n연구 참여 동의서 사본을 첨부합니다. 연구 참여가 끝날 때까지 보관해 주십시오.\n\n' +
                '연구자료의 삭제를 원하시면 참여일로부터 14일 이내에 동의담당자에게 요청해 주십시오.\n\n' + FOOTER,
          attachments: [file.getBlob()]
        });
        mailed = 'yes';
      } catch (err) {
        mailed = 'failed: ' + err.message;
      }
    }

    sh.appendRow([Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'), d.submission_id,
      clean_(name), CONFIG.EXPLAINER]
      .concat(CONSENT_ITEMS.map(function (it) { return answers[it.key]; }))
      .concat(['yes', file.getUrl(), mailed, CONFIG.FORM_VERSION]));

    return json_({ ok: true, fileName: fileName, mailed: mailed, pdf: Utilities.base64Encode(file.getBlob().getBytes()) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/** Creates one sample PDF in the folder to check the layout (not logged). */
function testPdf() {
  const answers = {};
  CONSENT_ITEMS.forEach(function (it) { answers[it.key] = YES; });
  answers.c7 = NO;
  const data = { timestamp: new Date(), name: '테스트', explainer: CONFIG.EXPLAINER, answers: answers };
  const pdf = Utilities.newBlob(buildConsentHtml(data, true), 'text/html', 'consent.html')
    .getAs('application/pdf').setName('동의서_TEST.pdf');
  Logger.log(DriveApp.getFolderById(CONFIG.FOLDER_ID).createFile(pdf).getUrl());
}

/* ---------------------------------------------------------------- */
/* PDF layout                                                        */
/* ---------------------------------------------------------------- */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function buildConsentHtml(data, eligible) {
  const dateK = Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, 'yyyy년 MM월 dd일');
  const timeK = Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, 'HH:mm:ss');
  const css = `
    body { font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; font-size: 10pt; line-height: 1.55; color: #111; margin: 0; }
    h1 { font-size: 15pt; text-align: center; margin: 0 0 10pt; }
    h2 { font-size: 11.5pt; margin: 14pt 0 4pt; }
    .sub { text-align: center; font-weight: bold; margin-bottom: 10pt; }
    p { margin: 0 0 6pt; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 4pt 0 8pt; }
    td, th { border: 1px solid #555; padding: 4pt 6pt; vertical-align: top; }
    th, .k { background: #eee; font-weight: bold; }
    .k { width: 22%; }
    .ck { width: 12%; text-align: center; white-space: nowrap; }
    .on { font-weight: bold; }
    .off { color: #888; }
    .note { font-size: 9pt; }
    .foot { font-size: 9pt; margin-top: 10pt; }
    .pb { page-break-before: always; }
    .stamp { font-size: 8pt; color: #555; margin-top: 8pt; }
    ul { margin: 0 0 6pt 14pt; padding: 0; }
  `;

  let info = '';
  if (true) {
    info += '<h1>연구대상자 설명서</h1><table>';
    STUDY.meta.forEach(([k, v]) => { info += `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`; });
    info += `</table><p>${esc(STUDY.intro)}</p>`;
    INFO_SECTIONS.forEach(sec => {
      info += `<h2>${esc(sec.heading)}</h2>`;
      if (sec.table) {
        info += '<table>' + sec.table.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('') + '</table>';
      }
      (sec.paragraphs || []).forEach(p => { info += `<p>${esc(p)}</p>`; });
      if (sec.list) info += '<ul>' + sec.list.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>';
      (sec.afterList || []).forEach(p => { info += `<p>${esc(p)}</p>`; });
    });
  }

  const box = (ans, val) => ans === val ? `<span class="on">■ ${val}</span>` : `<span class="off">□ ${val}</span>`;
  let rows = '';
  CONSENT_ITEMS.forEach(it => {
    const a = data.answers[it.key];
    rows += `<tr><td>${esc(it.text)}</td><td class="ck">${box(a, YES)}</td><td class="ck">${box(a, NO)}</td></tr>`;
  });

  const priv = PRIVACY_TABLE.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');

  const consent = `
    <div class="${true ? 'pb' : ''}">
    <h1>연구대상자 동의서</h1>
    <div class="sub">${esc(STUDY.title)}</div>
    <p>${esc(CONSENT_INTRO)}</p>
    <table>${rows}</table>
    <h2>개인정보 수집 항목 및 보유기간</h2>
    <table><tr><th>수집 항목</th><th>수집 목적</th><th>보유기간</th></tr>${priv}</table>
    <p class="note">${esc(PRIVACY_NOTE)}</p>
    <h2>동의 확인</h2>
    <table>
      <tr><td class="k">연구대상자</td><td>성명: <b>${esc(data.name)}</b><br>서명: 성명 입력으로 갈음 (전자 동의)<br>서명일: ${dateK} (전자 제출 시각 ${timeK} KST)${eligible ? '' : '<br><b>※ 필수 동의 항목 중 \'아니오\' 응답 있음</b>'}</td></tr>
      <tr><td class="k">연구설명자</td><td>성명: <b>${esc(data.explainer)}</b><br>서명: 성명 입력으로 갈음 (전자 동의)</td></tr>
    </table>
    <p class="foot">${esc(FOOTER)}</p>
    </div>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>${info}${consent}</body></html>`;
}
