/* =========================================================
   Safarnama — Google Analytics 4 setup
   ---------------------------------------------------------
   STEP 1: Create a GA4 property at analytics.google.com
   STEP 2: Copy your Measurement ID (looks like G-AB12CD34EF)
   STEP 3: Paste it below, replacing G-XXXXXXXXXX. That's it —
           every page on the site loads this one file.
   ========================================================= */

var SAFARNAMA_GA_ID = 'G-L7059TEKQL';

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
})();
