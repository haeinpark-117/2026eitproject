# Oral Narrative Task

Browser task page (GitHub Pages) with a Google Apps Script storage backend.
Audio goes to a private Drive folder and each session is logged in a Google Sheet.

## Deploy

1. Signed in as haeinpark@khu.ac.kr, open script.google.com and create a new project.
2. Replace the default code with `Code.gs` and save.
3. Select `setup` and click Run. Approve the permissions. The execution log shows the Drive folder and Sheet links.
4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the URL ending in `/exec`.
5. In `index.html`, replace `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.
6. Create a GitHub repository, add `index.html`, then Settings > Pages > Deploy from branch > main, / (root).

After editing `Code.gs`, use Deploy > Manage deployments > Edit > New version so the URL stays the same.

## Running a session

Use current Chrome or Edge on a computer with a headset microphone.
The RA enters the participant code, checks the microphone, and continues to the instructions.
The participant clicks to begin; the 1-minute preparation and 2-minute recording then run automatically.
The RA stays on the page until the final screen confirms the saved file name.

## Files

Recordings are named `ONT_<participantID>_<yyyyMMdd-HHmmss>.webm`.
To convert to WAV for Praat: `ffmpeg -i input.webm -ar 16000 -ac 1 output.wav`
