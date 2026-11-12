/**
 * 2026 EIT Corpus Project: online informed consent (ICF) backend (Google Apps Script)
 *
 * 1. Run setup() once. It creates the "ICF log" spreadsheet inside the 연구참여동의서 folder.
 * 2. Deploy as a web app:  Execute as: Me    Who has access: Anyone
 *
 * Each submission is saved as a PDF (설명서 + 동의서, in the language the participant chose)
 * in the 동의서 PDF subfolder and logged in the spreadsheet.
 *
 * CONTENT below must match icf/index.html. Edit both together.
 * The same web app also receives the 교통비 지급 동의서 (compensation/index.html); see the FARE section at the end.
 */

const CONFIG = {
  FOLDER_ID: '1z4h0XdTUIeGVPijLkWdRKJ7fo25q7AIi',     // 2026 EIT Corpus Project/Instruments/연구참여동의서 (ICF log)
  PDF_FOLDER_ID: '1B612rFqOpTrB-cKSReV_e3YXaSmKGJ4S', // 연구참여동의서/동의서 PDF
  SHEET_NAME: 'ICF log',
  TIMEZONE: 'Asia/Seoul',
  FORM_VERSION: 'ICF 2026-11-06 (ko/en)'
};

// Stored answer values (same in both languages; labels are localized in CONTENT[lang].L)
const YES = '예';
const NO = '아니오';

const CONTENT = {
 "ko": {
  "STUDY": {
   "title": "인공지능 기반 외국어 평가 진단 시스템 구축을 위한 EIT 응답 코퍼스 개발",
   "meta": [
    [
     "연구 제목",
     "인공지능 기반 외국어 평가 진단 시스템 구축을 위한 EIT 응답 코퍼스 개발"
    ],
    [
     "연구책임자",
     "박해인 / 경희대학교 응용영어통번역학과 부교수\n010-2779-1022 / haeinpark@khu.ac.kr"
    ],
    [
     "동의담당자",
     "강지혜 / 경희대학교 응용영어통번역학과 석사과정\n이민서/경희대학교 응용영어통번역학과 학부과정"
    ],
    [
     "연구기관",
     "경희대학교 서울캠퍼스"
    ]
   ],
   "intro": "이 연구는 한국인 성인 영어 학습자의 유도모방과제(Elicited Imitation Task, EIT) 수행에 영향을 미치는 요인을 알아보기 위한 것입니다. 아래 내용을 읽고 충분히 이해한 뒤 참여 여부를 결정해 주십시오. 참여는 자발적이며, 궁금한 점은 연구진에게 질문하실 수 있습니다."
  },
  "INFO_SECTIONS": [
   {
    "heading": "1. 연구 목적 및 절차",
    "paragraphs": [
     "EIT는 들려주는 영어 문장을 듣고 따라 말하는 과제입니다. 본 연구는 듣기·말하기 능력, 작업기억, 과제 수행 전략, 영어 학습 배경 등이 EIT 수행과 어떤 관련이 있는지 분석합니다. 연구 결과는 학습자의 영어 능력을 여러 측면에서 진단하는 평가 도구 개발의 기초자료로 활용됩니다.",
     "참여자는 연구기간(2026년 8월~2028년 2월) 중 경희대학교 문과대학 212A 세미나실을 1회 방문하여 연구조원과 약 60~90분 동안 다음 과제를 수행합니다."
    ],
    "list": [
     "영어 듣기 과제",
     "유도모방과제(EIT) 30문항 및 과제 수행 전략 설문",
     "주어진 주제에 대한 영어 말하기 과제",
     "단어 능숙도 과제",
     "기본정보 및 영어 학습 배경 설문(공인영어시험 점수 포함)"
    ],
    "afterList": [
     "EIT와 말하기 과제의 응답은 음성으로 녹음됩니다. 연구책임자는 자료 수집에 참여하거나 동석하지 않으며, 연구조원이 1:1로 진행합니다."
    ]
   },
   {
    "heading": "2. 참여 대상 및 모집",
    "paragraphs": [
     "만 19세 이상의 한국인 성인 영어 학습자(대학생 및 일반 성인) 약 160명을 모집합니다. 다음에 해당하는 경우 참여할 수 없습니다: 만 19세 미만, 자발적으로 참여 여부를 결정하기 어려운 경우, 청각·발화·인지 기능의 제한으로 과제 수행이 어려운 경우.",
     "교내·온라인 게시판과 학과 이메일 등의 모집 공고를 보고 연구용 이메일 또는 온라인 신청 링크로 자발적으로 신청한 분 중에서 모집합니다. 모집과 동의 절차는 연구조원이 담당하며 연구책임자는 관여하지 않습니다. 참여 여부는 다른 사람에게 공개되지 않습니다."
    ]
   },
   {
    "heading": "3. 자발적 참여와 중단·철회",
    "paragraphs": [
     "참여 여부는 전적으로 본인의 자유로운 선택입니다. 참여하지 않거나 도중에 중단해도 성적, 학사평가, 장학금 등에 불이익이나 차별이 없습니다. 참여 중 언제든지 휴식을 요청하거나 과제를 중단할 수 있으며, 이유를 밝힐 필요도 없습니다. 연구진 또는 생명윤리심의위원회가 안전이나 권익 보호를 위해 필요하다고 판단하면 연구가 중단될 수 있습니다. 본 동의서에 서명해도 법적 권리를 포기하는 것은 아닙니다.",
     "연구자료의 삭제를 원하시면 참여일로부터 14일 이내에 동의담당자에게 요청해 주십시오. 성명·연락처와 연구 코드의 연결표를 14일 후 삭제하므로, 그 이후에는 본인의 자료를 특정하거나 삭제하기 어렵습니다. 전사 자료가 공개 데이터 저장소에 공개된 후에는 회수하거나 삭제할 수 없습니다."
    ]
   },
   {
    "heading": "4. 예상되는 위험·이득 및 사례비",
    "paragraphs": [
     "신체적 처치가 없는 최소위험 연구입니다. 과제 수행 중 가벼운 피로감이나 영어 과제에 따른 긴장감이 생길 수 있습니다. 불편하면 연구조원에게 알리고 휴식하거나 참여를 중단할 수 있습니다. 연구 참여로 얻는 직접적인 의료적·건강상의 이득은 없습니다. 모든 연구 절차를 마친 참여자에게 시간과 노력에 대한 사례비 20,000원을 계좌이체로 지급합니다. 연구 참여와 직접 관련된 신체적·정신적 손상이 발생하면 연구책임자가 확인하고 경희대학교 관련 규정에 따라 조치 및 보상을 처리합니다."
    ]
   },
   {
    "heading": "5. 수집 정보 및 개인정보 보호",
    "paragraphs": [
     "연구를 위해 다음 정보를 수집합니다: 음성 녹음, 성별·연령대·모국어 배경, 영어 학습 배경, 공인영어시험 점수, 설문 응답, 성명·연락처(참여 확인 및 자료 삭제 요청 처리), 계좌정보(모든 과제 종료 후 사례비 지급). 주민등록번호와 건강정보 등 민감정보는 수집하지 않습니다.",
     "연구자료는 연구책임자의 관리 아래 이름 대신 무작위 고유 코드로 저장합니다. 성명·연락처와 코드를 연결하는 대응표는 연구자료와 분리해 암호화하여 보관하고, 동의담당자만 열람할 수 있습니다. 연구책임자는 이 대응표를 열람하지 않습니다. 음성 원본과 연구자료의 접근은 연구진으로 제한하며, 연구 결과를 발표할 때 개인을 식별할 수 있는 정보는 공개하지 않습니다. 다만 법령에 따라 필요한 경우 정보가 제공될 수 있습니다.",
     "설문은 연구실 내 기기에서 Google Forms로 수집하며, 개인을 직접 식별하는 정보나 계정 정보가 자동 수집되지 않도록 설정합니다. 응답은 참여 직후 내려받아 암호화된 저장장치에 옮기고 온라인 원본은 삭제합니다."
    ]
   },
   {
    "heading": "6. 자료 보관·폐기 및 공개",
    "table": [
     [
      "성명·연락처 및 코드 대응표",
      "참여일로부터 14일간 보관한 뒤 복구할 수 없도록 삭제"
     ],
     [
      "계좌정보",
      "사례비 지급 후 폐기. 회계 증빙 보관 의무가 있는 경우 관련 기간 경과 후 폐기"
     ],
     [
      "음성 원본",
      "전사 내용 검수와 결과 검증을 위해 연구 종료 후 3년간 암호화 보관한 뒤 폐기. 외부 공개하지 않음"
     ],
     [
      "서면 동의서",
      "연구자료와 분리해 잠금장치가 있는 보관함에 보관하고 연구 종료 후 3년 뒤 파쇄"
     ]
    ],
    "paragraphs": [
     "개인식별정보를 모두 제거한 EIT 응답 전사 자료는 관련 논문이 학술지에 게재된 후 공개 데이터 저장소에 공개할 예정입니다. 공개 이후에는 자료를 회수하거나 폐기할 수 없습니다. 공개 및 향후 다른 연구 목적의 2차 활용 여부는 동의서에서 각각 선택할 수 있습니다."
    ]
   },
   {
    "heading": "7. 문의",
    "paragraphs": [
     "연구책임자: 박해인 haeinpark@khu.ac.kr\n참여자의 권리 및 연구 윤리 관련 문의: 경희대학교 서울캠퍼스 생명윤리심의위원회 02-961-2342"
    ]
   }
  ],
  "CONSENT_INTRO": "아래 내용을 읽고 각 항목에 표시해 주십시오. 개인정보 수집·이용 및 음성 녹음은 연구 참여에 필요한 사항입니다. 전사 자료의 공개와 2차 활용은 각각 별도로 선택할 수 있으며, 해당 항목에 동의하지 않아도 연구 참여 자체에는 불이익이 없습니다.",
  "CONSENT_ITEMS": [
   {
    "key": "c1",
    "mandatory": true,
    "text": "나는 연구대상자 설명서를 읽고 연구 목적과 절차를 이해했으며, 질문할 기회를 갖고 충분한 답변을 받았습니다."
   },
   {
    "key": "c2",
    "mandatory": true,
    "text": "나는 연구 참여가 자발적이며, 참여하지 않거나 언제든지 중단해도 불이익이 없음을 이해했습니다."
   },
   {
    "key": "c3",
    "mandatory": true,
    "text": "나는 연구진, 연구기관 및 생명윤리심의위원회가 연구의 진행과 결과 확인을 위해 필요한 범위에서 비밀이 보장되는 나의 정보를 열람할 수 있음에 동의합니다."
   },
   {
    "key": "c4",
    "mandatory": true,
    "text": "나는 연구 수행을 위해 설명서에 기재된 개인정보를 수집·이용하는 데 동의합니다."
   },
   {
    "key": "c5",
    "mandatory": true,
    "text": "나는 EIT와 말하기 과제 수행 중 나의 음성이 녹음되고, 설명서에 기재된 기간 동안 보관되는 데 동의합니다."
   },
   {
    "key": "c6",
    "mandatory": false,
    "text": "나는 개인식별정보를 제거한 EIT 응답 전사 자료가 학술 목적으로 공개 데이터 저장소에 공개되는 데 동의합니다. 공개 후에는 회수하거나 삭제할 수 없음을 이해합니다."
   },
   {
    "key": "c7",
    "mandatory": false,
    "text": "나는 위 전사 자료가 향후 다른 연구 목적으로 2차 활용되는 데 동의합니다."
   }
  ],
  "PRIVACY_TABLE": [
   [
    "성명·연락처",
    "참여 확인 및 자료 삭제 요청 처리",
    "참여일로부터 14일"
   ],
   [
    "계좌정보",
    "사례비 지급",
    "지급 후 폐기(회계 증빙 의무가 있는 경우 해당 기간 경과 후)"
   ],
   [
    "음성 녹음",
    "응답 전사·채점·검증",
    "연구 종료 후 3년"
   ]
  ],
  "PRIVACY_NOTE": "※ 연구자료는 고유 코드로 관리하며, 음성 원본과 서면 동의서는 연구 종료 후 3년간 보관합니다. 성명·연락처와 코드의 연결표는 참여일로부터 14일 후 삭제되므로, 이후에는 개인 자료를 특정하여 삭제하기 어렵습니다.",
  "FOOTER": "연구책임자 박해인: haeinpark@khu.ac.kr\n경희대학교 서울캠퍼스 생명윤리심의위원회(서울시 동대문구 경희대로 26): 02-961-2342",
  "EXPLAINER": "강지혜 / 이민서",
  "L": {
   "infoTitle": "연구대상자 설명서",
   "consentTitle": "연구대상자 동의서",
   "privacyTitle": "개인정보 수집 항목 및 보유기간",
   "privacyHead": [
    "수집 항목",
    "수집 목적",
    "보유기간"
   ],
   "confirmTitle": "동의 확인",
   "yes": "예",
   "no": "아니오",
   "participant": "연구대상자",
   "explainer": "연구설명자",
   "name": "성명",
   "signature": "서명: 성명 입력으로 갈음 (전자 동의)",
   "date": "서명일",
   "submitted": "전자 제출 시각",
   "refused": "※ 필수 동의 항목 중 '아니오' 응답 있음",
   "dateFmt": "yyyy년 MM월 dd일",
   "filePrefix": "동의서"
  }
 },
 "en": {
  "STUDY": {
   "title": "Development of an EIT Response Corpus for Building an AI-Based Foreign Language Assessment and Diagnostic System",
   "meta": [
    [
     "Study title",
     "Development of an EIT Response Corpus for Building an AI-Based Foreign Language Assessment and Diagnostic System"
    ],
    [
     "Principal investigator",
     "Hae In Park / Associate Professor, Department of Applied English Linguistics and Translation Studies, Kyung Hee University\n010-2779-1022 / haeinpark@khu.ac.kr"
    ],
    [
     "Persons obtaining consent",
     "Jihye Kang / M.A. student, Department of Applied English Linguistics and Translation Studies, Kyung Hee University\nMinseo Lee / Undergraduate student, Department of Applied English Linguistics and Translation Studies, Kyung Hee University"
    ],
    [
     "Institution",
     "Kyung Hee University, Seoul Campus"
    ]
   ],
   "intro": "This study investigates the factors that influence the performance of Korean adult learners of English on the elicited imitation task (EIT). Please read the information below and make sure you fully understand it before deciding whether to participate. Participation is voluntary, and you may ask the research team any questions you have."
  },
  "INFO_SECTIONS": [
   {
    "heading": "1. Purpose and Procedures",
    "paragraphs": [
     "The EIT is a task in which you listen to English sentences and repeat them. This study examines how listening and speaking ability, working memory, task-performance strategies, and English learning background relate to EIT performance. The findings will serve as foundational data for developing an assessment tool that diagnoses learners' English ability from multiple perspectives.",
     "During the study period (August 2026 to February 2028), participants will visit Seminar Room 212A, College of Humanities, Kyung Hee University, once and complete the following tasks with a research assistant over approximately 60 to 90 minutes."
    ],
    "list": [
     "English listening task",
     "Elicited imitation task (EIT; 30 items) and a questionnaire on task-performance strategies",
     "English speaking task on a given topic",
     "Vocabulary proficiency task",
     "Questionnaire on background information and English learning background (including standardized English test scores)"
    ],
    "afterList": [
     "Your responses to the EIT and the speaking task will be audio-recorded. The principal investigator will not take part in or be present during data collection; a research assistant will conduct the session one-on-one."
    ]
   },
   {
    "heading": "2. Eligibility and Recruitment",
    "paragraphs": [
     "Approximately 160 Korean adult learners of English aged 19 or older (university students and members of the general public) will be recruited. You may not participate if any of the following applies: you are under 19 years of age; it is difficult for you to decide voluntarily whether to participate; or limitations in hearing, speech, or cognitive function make it difficult for you to complete the tasks.",
     "Participants will be recruited from among those who voluntarily apply through the research email address or an online application link after seeing recruitment notices on campus and online bulletin boards, departmental email, and similar channels. Recruitment and the consent process are handled by research assistants, and the principal investigator is not involved. Whether you participate will not be disclosed to others."
    ]
   },
   {
    "heading": "3. Voluntary Participation, Discontinuation, and Withdrawal",
    "paragraphs": [
     "Whether to participate is entirely your own free choice. Declining to participate or stopping partway will not result in any disadvantage or discrimination with respect to grades, academic evaluation, scholarships, or the like. You may ask for a break or stop the tasks at any time during participation, and you do not need to give a reason. The study may be stopped if the research team or the Institutional Review Board determines that this is necessary to protect your safety or rights. Signing this consent form does not mean that you waive any of your legal rights.",
     "If you wish to have your research data deleted, please contact a person obtaining consent within 14 days of your participation. Because the key linking your name and contact information to your research code will be deleted after 14 days, it will be difficult to identify or delete your data after that point. Once the transcription data have been released to a public data repository, they cannot be retrieved or deleted."
    ]
   },
   {
    "heading": "4. Anticipated Risks, Benefits, and Compensation",
    "paragraphs": [
     "This is a minimal-risk study that involves no physical procedures. You may experience mild fatigue or tension associated with the English tasks while completing them. If you feel uncomfortable, please tell the research assistant; you may take a break or stop participating. There is no direct medical or health benefit from participating in this study. Participants who complete all study procedures will receive KRW 20,000 by bank transfer as compensation for their time and effort. If any physical or psychological injury directly related to participation occurs, the principal investigator will review it and handle treatment and compensation in accordance with the relevant regulations of Kyung Hee University."
    ]
   },
   {
    "heading": "5. Information Collected and Privacy Protection",
    "paragraphs": [
     "The following information will be collected for the study: audio recordings; gender, age group, and native language background; English learning background; standardized English test scores; questionnaire responses; name and contact information (to confirm participation and to process data deletion requests); and bank account information (to pay compensation after all tasks are completed). Sensitive information such as resident registration numbers and health information will not be collected.",
     "Under the management of the principal investigator, research data will be stored using a random unique code instead of your name. The key linking names and contact information to codes will be encrypted and stored separately from the research data, and only the persons obtaining consent will have access to it. The principal investigator will not access this key. Access to the original audio recordings and research data will be limited to the research team, and no information that could identify individuals will be disclosed when the findings are reported. However, information may be provided where required by law.",
     "Questionnaires will be completed in Google Forms on a device in the laboratory, which will be set up so that information directly identifying individuals and account information are not collected automatically. Responses will be downloaded immediately after participation and transferred to an encrypted storage device, and the online originals will be deleted."
    ]
   },
   {
    "heading": "6. Data Retention, Disposal, and Release",
    "table": [
     [
      "Name, contact information, and code key",
      "Retained for 14 days from the date of participation and then irreversibly deleted"
     ],
     [
      "Bank account information",
      "Disposed of after compensation is paid; where accounting records must be retained, disposed of after the relevant period has elapsed"
     ],
     [
      "Original audio recordings",
      "Stored with encryption for 3 years after the end of the study for review of transcriptions and verification of results, and then disposed of; not released externally"
     ],
     [
      "Written consent forms",
      "Stored in a locked cabinet separately from the research data and shredded 3 years after the end of the study"
     ]
    ],
    "paragraphs": [
     "EIT response transcriptions from which all personally identifiable information has been removed will be released to a public data repository after the related article is published in a journal. Once released, the data cannot be retrieved or destroyed. You may choose separately on the consent form whether to allow this release and secondary use for other research purposes in the future."
    ]
   },
   {
    "heading": "7. Contact",
    "paragraphs": [
     "Principal investigator: Hae In Park, haeinpark@khu.ac.kr\nQuestions about participants' rights and research ethics: Institutional Review Board, Kyung Hee University Seoul Campus, 02-961-2342"
    ]
   }
  ],
  "CONSENT_INTRO": "Please read the statements below and mark your response to each item. The collection and use of personal information and audio recording are required for participation in the study. You may choose separately whether to allow the release and the secondary use of the transcription data, and declining these items will not result in any disadvantage to your participation in the study.",
  "CONSENT_ITEMS": [
   {
    "key": "c1",
    "mandatory": true,
    "text": "I have read the participant information sheet and understand the purpose and procedures of the study. I have had the opportunity to ask questions and have received sufficient answers."
   },
   {
    "key": "c2",
    "mandatory": true,
    "text": "I understand that participation in the study is voluntary and that there will be no disadvantage if I do not participate or if I stop at any time."
   },
   {
    "key": "c3",
    "mandatory": true,
    "text": "I agree that the research team, the research institution, and the Institutional Review Board may access my confidential information to the extent necessary to monitor the conduct of the study and verify its results."
   },
   {
    "key": "c4",
    "mandatory": true,
    "text": "I agree to the collection and use of the personal information described in the information sheet for the purpose of conducting the study."
   },
   {
    "key": "c5",
    "mandatory": true,
    "text": "I agree that my voice will be recorded while I complete the EIT and the speaking task, and that the recordings will be retained for the period described in the information sheet."
   },
   {
    "key": "c6",
    "mandatory": false,
    "text": "I agree that EIT response transcriptions with personally identifiable information removed may be released to a public data repository for academic purposes. I understand that they cannot be retrieved or deleted after release."
   },
   {
    "key": "c7",
    "mandatory": false,
    "text": "I agree that the transcriptions above may be used secondarily for other research purposes in the future."
   }
  ],
  "PRIVACY_TABLE": [
   [
    "Name and contact information",
    "Confirming participation and processing data deletion requests",
    "14 days from the date of participation"
   ],
   [
    "Bank account information",
    "Payment of compensation",
    "Disposed of after payment (where accounting records must be retained, after the relevant period has elapsed)"
   ],
   [
    "Audio recordings",
    "Transcription, scoring, and verification of responses",
    "3 years after the end of the study"
   ]
  ],
  "PRIVACY_NOTE": "※ Research data are managed using unique codes, and original audio recordings and written consent forms are retained for 3 years after the end of the study. Because the key linking names and contact information to codes is deleted 14 days after participation, it will be difficult to identify and delete an individual's data after that point.",
  "FOOTER": "Principal investigator Hae In Park: haeinpark@khu.ac.kr\nInstitutional Review Board, Kyung Hee University Seoul Campus (26 Kyungheedae-ro, Dongdaemun-gu, Seoul): 02-961-2342",
  "EXPLAINER": "Jihye Kang / Minseo Lee",
  "L": {
   "infoTitle": "Participant Information Sheet",
   "consentTitle": "Participant Consent Form",
   "privacyTitle": "Personal Information Collected and Retention Periods",
   "privacyHead": [
    "Item",
    "Purpose",
    "Retention period"
   ],
   "confirmTitle": "Confirmation of Consent",
   "yes": "Yes",
   "no": "No",
   "participant": "Participant",
   "explainer": "Person obtaining consent",
   "name": "Name",
   "signature": "Signature: typed name in place of a signature (electronic consent)",
   "date": "Date",
   "submitted": "submitted at",
   "refused": "※ 'No' was answered for a required consent item",
   "dateFmt": "MMMM d, yyyy",
   "filePrefix": "Consent"
  }
 }
};

const ITEMS = CONTENT.ko.CONSENT_ITEMS; // keys and required flags (identical in ko/en)

const LOG_HEADERS = ['Submitted at (KST)', 'Submission ID', 'Name', 'Explainer']
  .concat(ITEMS.map(function (it, i) { return 'Item ' + (i + 1); }))
  .concat(['Eligible', 'PDF', 'Form version', 'Language']);

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
  Logger.log('PDF folder: ' + DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID).getUrl());
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(value) {
  const s = String(value == null ? '' : value).slice(0, 200);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function makePdf_(data, eligible) {
  const C = CONTENT[data.lang];
  const stamp = Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss');
  const safeName = data.name.replace(/[\\/:*?"<>|]/g, '').slice(0, 30) || 'noname';
  const fileName = C.L.filePrefix + '_' + stamp + '_' + safeName + '.pdf';
  return Utilities.newBlob(buildConsentHtml(data, eligible), 'text/html', 'consent.html')
    .getAs('application/pdf').setName(fileName);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.form === 'fare') return farePost_(d);
    const lang = d.lang === 'en' ? 'en' : 'ko';
    const name = String(d.name || '').trim();
    if (!d.submission_id || !name || d.sign !== true) return json_({ ok: false, error: 'missing fields' });
    const answers = {};
    for (let i = 0; i < ITEMS.length; i++) {
      const a = d.answers && d.answers[ITEMS[i].key];
      if (a !== YES && a !== NO) return json_({ ok: false, error: 'missing ' + ITEMS[i].key });
      answers[ITEMS[i].key] = a;
    }
    const eligible = ITEMS.every(function (it) { return !it.mandatory || answers[it.key] === YES; });
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

    const data = { timestamp: new Date(), name: name, lang: lang, answers: answers };
    const file = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID).createFile(makePdf_(data, true));

    sh.appendRow([Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'), d.submission_id,
      clean_(name), CONTENT.ko.EXPLAINER]
      .concat(ITEMS.map(function (it) { return answers[it.key]; }))
      .concat(['yes', file.getUrl(), CONFIG.FORM_VERSION, lang]));

    return json_({ ok: true, fileName: file.getName() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/** Creates one Korean and one English sample PDF in the PDF folder (not logged). Delete them afterwards. */
function testPdf() {
  ['ko', 'en'].forEach(function (lang) {
    const answers = {};
    ITEMS.forEach(function (it) { answers[it.key] = YES; });
    answers.c7 = NO;
    const blob = makePdf_({ timestamp: new Date(), name: 'TEST', lang: lang, answers: answers }, true);
    Logger.log(DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID).createFile(blob).getUrl());
  });
}

/* ---------------------------------------------------------------- */
/* PDF layout                                                        */
/* ---------------------------------------------------------------- */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function buildConsentHtml(data, eligible) {
  const C = CONTENT[data.lang];
  const L = C.L;
  const dateS = Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, L.dateFmt);
  const timeS = Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, 'HH:mm:ss');
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
    .c-en { font-size: 9pt; line-height: 1.45; }
    .c-en td, .c-en th { padding: 3pt 5pt; }
    .c-en h2 { margin-top: 10pt; }
    .c-en h1 { font-size: 14pt; margin-bottom: 6pt; }
    .c-en .sub { margin-bottom: 6pt; }
    .c-en .foot { margin-top: 6pt; }
    ul { margin: 0 0 6pt 14pt; padding: 0; }
  `;

  let info = '<h1>' + esc(L.infoTitle) + '</h1><table>';
  C.STUDY.meta.forEach(function (m) { info += '<tr><td class="k">' + esc(m[0]) + '</td><td>' + esc(m[1]) + '</td></tr>'; });
  info += '</table><p>' + esc(C.STUDY.intro) + '</p>';
  C.INFO_SECTIONS.forEach(function (sec) {
    info += '<h2>' + esc(sec.heading) + '</h2>';
    if (sec.table) {
      info += '<table>' + sec.table.map(function (r) { return '<tr><td class="k">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>';
    }
    (sec.paragraphs || []).forEach(function (p) { info += '<p>' + esc(p) + '</p>'; });
    if (sec.list) info += '<ul>' + sec.list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    (sec.afterList || []).forEach(function (p) { info += '<p>' + esc(p) + '</p>'; });
  });

  function box(ans, val, label) {
    return ans === val ? '<span class="on">■ ' + esc(label) + '</span>' : '<span class="off">□ ' + esc(label) + '</span>';
  }
  let rows = '';
  C.CONSENT_ITEMS.forEach(function (it, i) {
    const a = data.answers[it.key];
    rows += '<tr><td>' + (i + 1) + '. ' + esc(it.text) + '</td><td class="ck">' + box(a, YES, L.yes) + '</td><td class="ck">' + box(a, NO, L.no) + '</td></tr>';
  });
  const priv = '<tr>' + L.privacyHead.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>' +
    C.PRIVACY_TABLE.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('');

  const consent =
    '<div class="pb c-' + data.lang + '"><h1>' + esc(L.consentTitle) + '</h1>' +
    '<div class="sub">' + esc(C.STUDY.title) + '</div>' +
    '<p>' + esc(C.CONSENT_INTRO) + '</p>' +
    '<table>' + rows + '</table>' +
    '<h2>' + esc(L.privacyTitle) + '</h2><table>' + priv + '</table>' +
    '<p class="note">' + esc(C.PRIVACY_NOTE) + '</p>' +
    '<h2>' + esc(L.confirmTitle) + '</h2><table>' +
    '<tr><td class="k">' + esc(L.participant) + '</td><td>' + esc(L.name) + ': <b>' + esc(data.name) + '</b><br>' + esc(L.signature) + '<br>' +
      esc(L.date) + ': ' + esc(dateS) + ' (' + esc(L.submitted) + ' ' + timeS + ' KST)' + (eligible ? '' : '<br><b>' + esc(L.refused) + '</b>') + '</td></tr>' +
    '<tr><td class="k">' + esc(L.explainer) + '</td><td>' + esc(L.name) + ': <b>' + esc(C.EXPLAINER) + '</b><br>' + esc(L.signature) + '</td></tr>' +
    '</table><p class="foot">' + esc(C.FOOTER) + '</p></div>';

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' + css + '</style></head><body>' + info + consent + '</body></html>';
}

/* ---------------------------------------------------------------- */
/* 교통비 지급 동의서 (compensation/index.html posts here with form: 'fare')  */
/* ---------------------------------------------------------------- */

const FARE_CONFIG = {
  PDF_FOLDER_ID: '12MrYjnlh8GyAZyl9WfaFEQenrNo1xhga',                 // 지급 서류/교통비지급동의서 PDF
  SHEET_ID: '1RLQvthVbD8Mqk5Qo4CVamExG3PI9QKQzqggJCvr0VAA',          // 지급 서류/교통비 log (first tab)
  FORM_VERSION: 'FARE 2026-11-12 (ko/en)'
};

// Stored values: q1 = 예/아니오, q2 = 동의/비동의 (same in both languages)
// FARE text must match compensation/index.html. Edit both together.
const FARE = {
 "ko": {
  "title": "교통비 지급 동의서",
  "notice": "교통비(20,000원)는 경희대학교 연구처를 통해 연구 참여일로부터 1-2주 후 지급될 예정입니다.",
  "name": "성명",
  "bank": "은행",
  "account": "계좌번호",
  "q1": "귀하는 신분증 및 통장 사본을 연구원에게 제출했습니까?",
  "q1yes": "예",
  "q1no": "아니오",
  "q2": "본인은 교통비를 수령하는데 필요한 개인정보 수집에 동의하며 상기 금액의 수령을 확인합니다.",
  "q2yes": "동의합니다",
  "q2no": "동의하지 않습니다 (교통비가 지급되지 않음)",
  "submitted": "제출 일시",
  "dateFmt": "yyyy년 MM월 dd일",
  "filePrefix": "교통비지급동의서"
 },
 "en": {
  "title": "Payment Agreement Form",
  "notice": "The transportation fee (KRW 20,000) will be paid through the Office of Research Affairs, Kyung Hee University, 1 to 2 weeks after the date of your participation.",
  "name": "Full name",
  "bank": "Bank",
  "account": "Account number",
  "q1": "Have you submitted copies of your ID and bankbook to the researcher?",
  "q1yes": "Yes",
  "q1no": "No",
  "q2": "I agree to the collection of the personal information required to receive the transportation fee, and I confirm receipt of the amount stated above.",
  "q2yes": "I agree",
  "q2no": "I do not agree (the transportation fee will not be paid)",
  "submitted": "Submitted",
  "dateFmt": "MMMM d, yyyy",
  "filePrefix": "PaymentAgreement"
 }
};

function farePost_(d) {
  const lang = d.lang === 'en' ? 'en' : 'ko';
  const name = String(d.name || '').trim();
  const bank = String(d.bank || '').trim();
  const account = String(d.account || '').replace(/[^0-9-]/g, '');
  if (!d.submission_id || !name || !bank || !account) return json_({ ok: false, error: 'missing fields' });
  if (['예', '아니오'].indexOf(d.q1) < 0 || ['동의', '비동의'].indexOf(d.q2) < 0) return json_({ ok: false, error: 'missing answers' });

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = SpreadsheetApp.openById(FARE_CONFIG.SHEET_ID).getSheets()[0];
    const last = sh.getLastRow();
    if (last > 1) {
      const ids = sh.getRange(2, 2, last - 1, 1).getValues();
      for (let r = 0; r < ids.length; r++) {
        if (ids[r][0] === d.submission_id) return json_({ ok: true, duplicate: true });
      }
    }
    const data = { timestamp: new Date(), lang: lang, name: name, bank: bank, account: account, q1: d.q1, q2: d.q2 };
    const T = FARE[lang];
    const stamp = Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss');
    const safeName = name.replace(/[\\/:*?"<>|]/g, '').slice(0, 30) || 'noname';
    const blob = Utilities.newBlob(buildFareHtml(data), 'text/html', 'fare.html')
      .getAs('application/pdf').setName(T.filePrefix + '_' + stamp + '_' + safeName + '.pdf');
    const file = DriveApp.getFolderById(FARE_CONFIG.PDF_FOLDER_ID).createFile(blob);
    sh.appendRow([Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'), d.submission_id,
      clean_(name), clean_(bank), "'" + account, d.q1, d.q2, file.getUrl(), FARE_CONFIG.FORM_VERSION, lang]);
    return json_({ ok: true, fileName: file.getName() });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/** Creates one Korean and one English sample 교통비 PDF (not logged). Delete them afterwards. */
function testFarePdf() {
  ['ko', 'en'].forEach(function (lang) {
    const blob = Utilities.newBlob(buildFareHtml({ timestamp: new Date(), lang: lang, name: 'TEST', bank: 'TEST', account: '000-000', q1: '예', q2: '동의' }), 'text/html', 'fare.html')
      .getAs('application/pdf').setName(FARE[lang].filePrefix + '_TEST.pdf');
    Logger.log(DriveApp.getFolderById(FARE_CONFIG.PDF_FOLDER_ID).createFile(blob).getUrl());
  });
}

function buildFareHtml(data) {
  const T = FARE[data.lang];
  const dateS = Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, T.dateFmt);
  const timeS = Utilities.formatDate(data.timestamp, CONFIG.TIMEZONE, 'HH:mm:ss');
  function box(on, label) { return on ? '<span class="on">■ ' + esc(label) + '</span>' : '<span class="off">□ ' + esc(label) + '</span>'; }
  const css = `
    body { font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; font-size: 10.5pt; line-height: 1.6; color: #111; margin: 0; }
    h1 { font-size: 16pt; text-align: center; margin: 0 0 6pt; }
    .sub { text-align: center; font-size: 9.5pt; color: #444; margin-bottom: 16pt; }
    .notice { border: 1px solid #555; background: #f3f3f3; padding: 8pt 10pt; margin-bottom: 14pt; }
    table { width: 100%; border-collapse: collapse; margin: 0 0 14pt; }
    td { border: 1px solid #555; padding: 6pt 8pt; vertical-align: top; }
    .k { width: 28%; background: #eee; font-weight: bold; }
    .on { font-weight: bold; }
    .off { color: #888; }
    .opts { margin-top: 4pt; }
    .opts span { display: inline-block; margin-right: 16pt; }
  `;
  const body =
    '<h1>' + esc(T.title) + '</h1>' +
    '<div class="sub">' + esc(CONTENT[data.lang].STUDY.title) + '</div>' +
    '<div class="notice">' + esc(T.notice) + '</div>' +
    '<table>' +
    '<tr><td class="k">' + esc(T.name) + '</td><td><b>' + esc(data.name) + '</b></td></tr>' +
    '<tr><td class="k">' + esc(T.bank) + '</td><td>' + esc(data.bank) + '</td></tr>' +
    '<tr><td class="k">' + esc(T.account) + '</td><td>' + esc(data.account) + '</td></tr>' +
    '</table>' +
    '<table>' +
    '<tr><td>' + esc(T.q1) + '<div class="opts">' + box(data.q1 === '예', T.q1yes) + box(data.q1 === '아니오', T.q1no) + '</div></td></tr>' +
    '<tr><td>' + esc(T.q2) + '<div class="opts">' + box(data.q2 === '동의', T.q2yes) + box(data.q2 === '비동의', T.q2no) + '</div></td></tr>' +
    '</table>' +
    '<p>' + esc(T.submitted) + ': ' + esc(dateS) + ' ' + timeS + ' (KST)</p>';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' + css + '</style></head><body>' + body + '</body></html>';
}
