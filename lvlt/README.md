# LVLT (Korean version), online administration

Browser test page (GitHub Pages) with a Google Apps Script backend.
The answer key is kept only in the Google Sheet; responses are scored there.

Source test: McLean, S., Kramer, B., & Beglar, D. (2015). The creation and validation of a listening vocabulary levels test. *Language Teaching Research, 19*(6), 741–760. https://doi.org/10.1177/1362168814567889. Audio (LVLT.Audio.v.5) and items are used under CC BY-NC-SA; the Korean options come from `LVLT_Korean_Item_Bank_draft.xlsx` (2026-11-05).

## Deploy

1. Signed in as haeinpark@khu.ac.kr, open script.google.com and create a new project.
2. Replace the default code with `Code.gs` and save.
3. Select `setup` and click Run. Approve the permissions. The execution log shows the Sheet link. The Sheet ("LVLT Korean Online") is created in Drive > 2026 EIT Corpus Project > Instruments > Listening Vocabulary Levels Test (LVLT).
4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the URL ending in `/exec`.
5. In `index.html`, replace `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.

After editing `Code.gs`, use Deploy > Manage deployments > Edit > New version so the URL stays the same.

## The Sheet

| Tab | Content |
|---|---|
| Config | `active_parts` (e.g., `3,4,5,6` to drop 1K and 2K), `show_score` (yes/no), `form_version` |
| Key | Part, Level, Item, Target, Key (official Answer Key v.9). Edit here if a key changes, then run `rescoreAll()` |
| Sessions | One row per session: part scores, total correct, items given, completion, incidents |
| Responses | One row per item: response (A–D or blank), key, correct (1/0), RT from item onset (ms), number of changes. Long format for Rasch or IRT analysis |

Config changes take effect on the next page load; no redeployment is needed.

## Running a session

Use current Chrome or Edge on a computer with headphones.

1. The audio (about 28 MB) loads automatically when the page opens. The RA enters the participant ID, plays the sound check, and ticks the box.
2. The participant reads the instructions and example, then completes the two practice items (`audio/practice.mp3`). The recording announces the answers.
3. Each part plays once, without pausing, in the original timing. The current item is marked NOW; later items unlock as they are read; answers can be changed until the part ends. Keys a–d or 1–4 also answer the current item.
4. A 15-second break separates parts. Each part is saved as soon as it ends.
5. The final screen confirms saving. If saving fails, press 다시 저장, or download the backup JSON and send it to the PI.

Testing without saving: open the page with `?demo` (and optionally `&parts=3,6`).

## Timing

Item onsets (`SCHEDULE` in `index.html`) were detected from the audio files by silence detection (each item = number, word, sentence, then a pause) and checked against the spoken item numbers. They only control the NOW marker and the unlocking of items; they do not cut the audio.
