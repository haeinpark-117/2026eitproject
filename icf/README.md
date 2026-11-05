# Informed consent (ICF), online

Consent page (GitHub Pages) with a Google Apps Script backend.
Participants read the 연구대상자 설명서, answer the eight consent items, and type their name in place of a signature. No copy is sent or offered to the participant.
Each submission is saved as a PDF (설명서 + 동의서) in Drive > 2026 EIT Corpus Project > Instruments > 연구참여동의서 > 동의서 PDF. The log Sheet (ICF log) stays in 연구참여동의서.

## Deploy

1. Signed in as haeinpark@khu.ac.kr, open script.google.com and create a new project.
2. Replace the default code with `Code.gs` and save.
3. Select `setup` and click Run. Approve the permissions. The execution log shows the links. The log Sheet ("ICF log") is created in the 연구참여동의서 folder.
4. Optional: run `testPdf` to create one sample PDF (`동의서_TEST.pdf`) in the 동의서 PDF folder and check the layout. Delete it afterwards.
5. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the URL ending in `/exec`.
6. In `index.html`, replace `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.

After editing `Code.gs`, use Deploy > Manage deployments > Edit > New version so the URL stays the same.

## What is saved

| Where | Content |
|---|---|
| PDF, `동의서_<yyyyMMdd-HHmmss>_<성명>.pdf` | 연구대상자 설명서 and 동의서 with the participant's answers, typed name, submission date and time (KST), and the explainers (강지혜 / 이민서) |
| ICF log, tab `log` | Submission time, ID, name, explainers, items 1–8 (예/아니오), PDF link |

## Running a session

1. The RA opens the page on the lab computer. Append `?demo` to test without saving.
2. The participant reads the 설명서 (page 1), answers items 1–8 (page 2), then types their name and ticks the confirmation box (page 3).
3. Items 1–5 and 8 are required for participation. If any of them is answered 아니오, the page stops and asks the participant to tell the RA; nothing is saved. Items 6 (공개) and 7 (2차 활용) are optional.
4. The final screen confirms the submission. Press 처음 화면으로 before the next participant.

## Editing the text

The consent text (`STUDY`, `INFO_SECTIONS`, `CONSENT_INTRO`, `CONSENT_ITEMS`, `PRIVACY_TABLE`, `PRIVACY_NOTE`, `FOOTER`) appears in both `Code.gs` (PDF) and `index.html` (page). Edit both together so the PDF matches what participants saw. The explainer names are `CONFIG.EXPLAINER` in both files.
