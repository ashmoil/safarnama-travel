/* =========================================================
   Safarnama — Google Analytics 4 setup
   ---------------------------------------------------------
   STEP 1: Create a GA4 property at analytics.google.com
   STEP 2: Copy your Measurement ID (looks like G-AB12CD34EF)
   STEP 3: Paste it below, replacing G-XXXXXXXXXX. That's it —
           every page on the site loads this one file.
   ========================================================= */

var SAFARNAMA_GA_ID = 'G-L7059TEKQL';

/* Backend (Google Apps Script Web App URL, ends with /exec).
   Form enquiries + newsletter signups are saved to Google Sheets. */
var SAFARNAMA_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbza1NomLMFJIj1nAGCqpUVEoEQnmGyhXqJtWz8017goOux6aD9XIaj7V86JO8ZGKLTh/exec';

(function () {
  var id = SAFARNAMA_GA_ID;
  var ready = /^G-[A-Z0-9]{6,}$/.test(id) && id !== 'G-XXXXXXXXXX';

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  if (ready) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', id);
  } else if (window.console) {
    console.info('[Safarnama] GA4 not connected yet — add your Measurement ID in js/analytics.js');
  }

  /**
   * Send a GA4 event. Goals ("key events") used on this site:
   *   generate_lead       — Plan My Trip form submitted   (KEY EVENT)
   *   sign_up             — Newsletter subscription       (KEY EVENT)
   *   brochure_download   — Itinerary PDF downloaded      (KEY EVENT)
   * Supporting events:
   *   search, select_destination, cta_click, whatsapp_click, filter_used
   */
  window.track = function (name, params, done) {
    params = params || {};
    params.page_path = location.pathname;
    var finished = false;
    var finish = function () { if (!finished) { finished = true; if (done) done(); } };
    if (ready) {
      params.event_callback = finish;
      params.event_timeout = 1200;
      params.transport_type = 'beacon';
      gtag('event', name, params);
      setTimeout(finish, 1300);
    } else {
      if (window.console) console.info('[Safarnama] event:', name, params);
      finish();
    }
  };

  /** Save a form submission to the Safarnama database (Google Sheets). Always resolves. */
  window.sendToBackend = function (data) {
    var url = SAFARNAMA_BACKEND_URL;
    if (!/^https:\/\/script\.google\.com\//.test(url) || !window.fetch) {
      if (window.console) console.info('[Safarnama] backend not connected yet — would save:', data);
      return Promise.resolve(false);
    }
    data.page = location.pathname + location.search;
    var body = new URLSearchParams();
    Object.keys(data).forEach(function (k) { body.append(k, data[k] == null ? '' : data[k]); });
    var req = fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, body: body })
      .then(function () { return true; }, function () { return false; });
    var timeout = new Promise(function (r) { setTimeout(function () { r(false); }, 4000); });
    return Promise.race([req, timeout]);
  };
})();
