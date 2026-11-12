# 신분증·통장 사본 제출 (ID & Bank Info), online

Same design as `compensation/`. Page URL: https://haeinpark-117.github.io/2026eitproject/payment-docs/ Participants enter their name, attach a copy of their ID and of their bankbook, and agree to the personal information notice. Open with `?demo` to test without saving.

The page posts to its own Apps Script web app (Drive > 지급 서류 > 신분증·통장 사본 제출); `Code.gs` here is a copy of that script. Each submission saves two files:

- Drive > 지급 서류 > 신분증 사본: `<성명>_신분증_<yyyyMMdd-HHmmss>.<ext>`
- Drive > 지급 서류 > 통장 사본: `<성명>_통장_<yyyyMMdd-HHmmss>.<ext>`

and adds a row to 지급 서류 > 신분증·통장 사본 log, tab 제출 기록: submission time, submission ID, name, participant ID, ID copy link, bankbook copy link, consent.

Optional personal links: list participants (ID, name, email) in the 참여자 tab, run `generateTokens`, then `sendLinks` from the script editor. A link with `?t=<token>` ties the submission to that participant's row (file names get the participant ID prefix); `sendReminders` emails those who have not submitted.

Large JPG/PNG photos are reduced in the browser to 2000 px on the long side. Maximum file size is 5 MB.

After editing the script, copy the change into `Code.gs` here and redeploy with Deploy > Manage deployments > Edit > New version.

The uploaded files contain resident registration numbers and bank account numbers. After payment, run `trashAllFiles` and empty the Drive trash.
