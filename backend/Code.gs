/**
 * Safarnama — Backend API (Google Apps Script)
 * ------------------------------------------------------------
 * Database : this Google Sheet (tabs "Enquiries" and "Newsletter")
 * Backend  : this script, deployed as a Web App
 *
 * The website POSTs form data here. Each submission is validated,
 * saved as a new row, and (optionally) emailed to the owner.
 *
 * Setup: 1) Run  setup()  once and allow permissions.
 *        2) Deploy → New deployment → Web app
 *           Execute as: Me   |   Who has access: Anyone
 *        3) Copy the Web App URL (ends with /exec) into js/analytics.js
 */

var SEND_EMAIL_ALERTS = true;   // email the sheet owner on every new trip enquiry

var TABS = {
  lead: {
    name: 'Enquiries',
    headers: ['Timestamp', 'Enquiry ID', 'Name', 'Phone', 'Email', 'Destination', 'Package', 'Travel date', 'Travellers', 'Message', 'Source page', 'Status']
  },
  newsletter: {
    name: 'Newsletter',
    headers: ['Timestamp', 'Email', 'Signed up from', 'Source page']
  }
};

/** Run once from the editor: creates the tabs with formatted headers. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (key) { getSheet_(ss, TABS[key]); });
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
  return 'Safarnama database is ready.';
}

/** Health check: open the Web App URL in a browser to see this. */
function doGet() {
  return json_({ ok: true, service: 'Safarnama API', time: new Date().toISOString() });
}

/** Receives form submissions from the website. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var p = (e && e.parameter) || {};

    // Honeypot: real visitors never fill the hidden "website" field
    if (p.website) return json_({ ok: true });

    var type = String(p.type || '').toLowerCase();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();

    if (type === 'lead') {
      var name = clean_(p.name, 80), phone = clean_(p.phone, 20).replace(/[^0-9+ ]/g, ''), email = clean_(p.email, 120);
      if (name.length < 2 || phone.replace(/\D/g, '').length < 10 || !isEmail_(email)) {
        return json_({ ok: false, error: 'Please check your name, phone and email.' });
      }
      var id = 'SAF-' + Utilities.formatDate(now, 'Asia/Kolkata', 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
      getSheet_(ss, TABS.lead).appendRow([
        now, id, name, "'" + phone, email,
        clean_(p.destination, 60), clean_(p.package, 60), clean_(p.date, 20), clean_(p.travellers, 10),
        clean_(p.message, 1000), clean_(p.page, 200), 'New'
      ]);
      if (SEND_EMAIL_ALERTS) {
        try {
          MailApp.sendEmail({
            to: Session.getEffectiveUser().getEmail(),
            subject: 'New Safarnama enquiry ' + id + ' — ' + name + ' (' + (p.destination || 'destination not decided') + ')',
            body: 'Name: ' + name + '\nPhone: ' + phone + '\nEmail: ' + email +
                  '\nDestination: ' + (p.destination || '-') + '\nPackage: ' + (p.package || '-') +
                  '\nTravel date: ' + (p.date || '-') + '\nTravellers: ' + (p.travellers || '-') +
                  '\nMessage: ' + (p.message || '-') + '\n\nOpen the sheet: ' + ss.getUrl()
          });
        } catch (mailErr) { /* email quota reached — the row is still saved */ }
      }
      return json_({ ok: true, id: id });
    }

    if (type === 'newsletter') {
      var nlEmail = clean_(p.email, 120);
      if (!isEmail_(nlEmail)) return json_({ ok: false, error: 'Invalid email.' });
      var sh = getSheet_(ss, TABS.newsletter);
      var last = sh.getLastRow();
      if (last > 1) {
        var existing = sh.getRange(2, 2, last - 1, 1).getValues().map(function (r) { return String(r[0]).toLowerCase(); });
        if (existing.indexOf(nlEmail.toLowerCase()) > -1) return json_({ ok: true, duplicate: true });
      }
      sh.appendRow([now, nlEmail, clean_(p.location, 40), clean_(p.page, 200)]);
      return json_({ ok: true });
    }

    return json_({ ok: false, error: 'Unknown form type.' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- helpers ---------- */
function getSheet_(ss, def) {
  var sh = ss.getSheetByName(def.name) || ss.insertSheet(def.name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(def.headers);
    sh.getRange(1, 1, 1, def.headers.length).setFontWeight('bold').setBackground('#c9f158').setFontColor('#0d1310');
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, def.headers.length);
  }
  return sh;
}
function clean_(v, max) {
  v = String(v == null ? '' : v).trim();
  if (/^[=+\-@]/.test(v)) v = "'" + v;           // block spreadsheet formula injection
  return v.slice(0, max || 200);
}
function isEmail_(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
