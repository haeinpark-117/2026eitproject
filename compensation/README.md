# 교통비 지급 동의서 (Transportation Fee Payment Consent), online

Same design and backend as `icf/`. Page URL: https://haeinpark-117.github.io/2026eitproject/compensation/ The page posts to the same Apps Script web app with `form: 'fare'`; the code is the FARE section at the end of `icf/Code.gs`. Participants choose 한국어 or English, then enter their name, bank, and account number and answer the two confirmation items.

Each submission is saved as a PDF in Drive > 지급 서류 > 교통비지급동의서 PDF (`교통비지급동의서_<yyyyMMdd-HHmmss>_<성명>.pdf` or `PaymentAgreement_..._<name>.pdf`) and logged in 지급 서류 > 교통비 log (first tab): submission time, ID, name, bank, account number, ID/bankbook copy submitted (예/아니오), consent (동의/비동의), PDF link, form version, language.

Answering 아니오 or 동의하지 않습니다 does not block submission (as in the original Google Form); check the log.

The form text is in `FARE` in both `icf/Code.gs` and `compensation/index.html`. Edit both together. After editing `Code.gs`, redeploy with Deploy > Manage deployments > Edit > New version.

The log and PDFs contain bank account numbers. Delete account information after payment, as stated in the participant information sheet.
