/**
 * North Star website forms -> Google Sheet
 *
 * Paste this whole file into the Apps Script editor of your Google Sheet
 * (Extensions > Apps Script), then deploy it as a Web app. See FORMS_SETUP.md.
 *
 * Each form gets its own tab, created automatically on the first submission.
 */

// Who gets an email for each new submission. Use a person or a Google Group
// (e.g. investors@yourdomain.com). Set to '' to turn notifications off.
// Set the real address in the Apps Script editor only -- not in the public repo.
const NOTIFY_EMAIL = '';

const FORMS = {
  investor: {
    tab: 'Investors',
    subject: 'New investor interest',
    fields: { name: 'Name', email: 'Email', phone: 'Phone', interest: 'Interest' },
  },
  early_access: {
    tab: 'Early Access',
    subject: 'New Early Access signup',
    fields: {
      role: 'Role', name: 'Name', email: 'Email', phone: 'Phone', age: 'Age',
      location: 'Location / time zone', expertise: 'Expertise', message: 'Message',
      source: 'Heard about us via',
    },
  },
};

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Honeypot: real visitors never see or fill the hidden "website" field.
  if (p.website) return json_({ ok: true });

  const cfg = FORMS[p.form];
  if (!cfg) return json_({ ok: false, error: 'Unknown form' });

  const values = {};
  Object.keys(cfg.fields).forEach((k) => (values[k] = clean_(p[k])));
  if (!values.name) return json_({ ok: false, error: 'Name is required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return json_({ ok: false, error: 'A valid email is required' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = sheetFor_(cfg);
    sheet.appendRow(
      [new Date()]
        .concat(Object.keys(cfg.fields).map((k) => sheetSafe_(values[k])))
        .concat([sheetSafe_(clean_(p.page))])
    );
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    try {
      const body = Object.keys(cfg.fields)
        .filter((k) => values[k])
        .map((k) => cfg.fields[k] + ': ' + values[k])
        .join('\n');
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: cfg.subject + ': ' + values.name,
        body: body + '\n\nSheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
        replyTo: values.email,
      });
    } catch (err) {
      console.error('Notification email failed', err); // row is still saved
    }
  }

  return json_({ ok: true });
}

// Lets you open the Web app URL in a browser to confirm it's live.
function doGet() {
  return json_({ ok: true, status: 'North Star form endpoint is running' });
}

function sheetFor_(cfg) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(cfg.tab);
  if (!sheet) {
    sheet = ss.insertSheet(cfg.tab);
    const headers = ['Timestamp'].concat(Object.values(cfg.fields)).concat(['Page']);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function clean_(v) {
  return String(v == null ? '' : v).trim().slice(0, 2000);
}

// Stops values like "=IMPORTXML(...)" from running as formulas in the Sheet.
function sheetSafe_(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
