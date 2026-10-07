# Website forms -> Google Sheet setup

The **Investors** form and the **Join Early Access** form on `index.html` send submissions
to a Google Sheet through a small Google Apps Script web app. No server or database is needed;
the site stays static on Cloudflare.

How it works: browser -> `script.js` (POST) -> Apps Script web app -> new row in the Sheet
(+ optional email notification). Each form writes to its own tab (`Investors`, `Early Access`),
created automatically on the first submission.

## One-time setup (~10 minutes)

1. **Create the Sheet.** In Google Drive (signed in to your Workspace account), create a new
   Google Sheet, e.g. `North Star - Website Leads`.
2. **Add the script.** In the Sheet: **Extensions > Apps Script**. Delete the sample code,
   paste in all of `google-apps-script/Code.gs`, and save.
3. **Set the notification email (optional).** In the editor, set
   `const NOTIFY_EMAIL = 'investors@yourdomain.com';` (a person or a Google Group).
   Set it only in the editor, not in this repo, so the address isn't published.
4. **Deploy.** Click **Deploy > New deployment** > gear icon > **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click **Deploy**, approve the permission prompts (Google may show
   "Google hasn't verified this app": choose *Advanced > Go to project*. That's expected
   for your own script). Copy the **Web app URL** (ends in `/exec`).
5. **Check it's live.** Open the Web app URL in a browser. You should see
   `{"ok":true,"status":"North Star form endpoint is running"}`.
6. **Connect the site.** In `script.js`, replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`
   with the Web app URL. Commit, push, and let Cloudflare deploy.
7. **Test.** Submit both forms on the live site and confirm rows appear in the Sheet
   (and the email arrives, if set).

## Good to know

- **"Anyone" not offered in step 4?** Your Workspace admin is restricting external access to
  Apps Script web apps. An admin can allow it in the Google Admin console (Drive and Docs
  sharing settings), or deploy the script from a personal Google account instead.
- **Changing the script later:** use **Deploy > Manage deployments > Edit (pencil) >
  Version: New version > Deploy**. That keeps the same URL. Creating a *new deployment* gives a new
  URL, which you'd then have to update in `script.js`.
- **Spam:** both forms include a hidden "honeypot" field that bots fill and people don't;
  those submissions are silently dropped. If spam becomes a problem later, add Cloudflare
  Turnstile.
- **Access to the data:** share the Sheet only with the people who need it. It contains
  personal contact details.
- **Quotas:** Workspace accounts can send about 1,500 notification emails per day via
  Apps Script, far more than this form needs.
