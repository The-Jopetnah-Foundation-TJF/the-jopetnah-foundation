/*
 * Privacy-friendly analytics loader for TJF.
 *
 * STATUS: ENABLED with GoatCounter (site: thejopetnahfoundation.goatcounter.com).
 * To switch it off, set provider to '' below: the file then loads nothing,
 * sets nothing and sends nothing. If you change provider or turn it off,
 * update the analytics paragraph in privacy.html in the same commit.
 *
 * Provider options:
 *   Plausible:    provider: 'plausible',   plausibleDomain: 'your-site-domain'
 *   GoatCounter:  provider: 'goatcounter', goatcounterEndpoint: 'https://CODE.goatcounter.com/count'
 * Both are cookie-free and do not track people across sites. Whenever you
 * enable this, update the Analytics line in privacy.html in the same commit.
 *
 * Respects Do Not Track and Global Privacy Control: if either is on, nothing loads.
 *
 * Events recorded (no personal data is attached to any of them):
 *   Email click, Call click, Text click, WhatsApp click, GitHub click,
 *   Social click, Get Involved click,
 *   Contact form opened (page view of contact.html), Contact form submitted.
 */
(function(){
  var CONFIG = {
    provider: 'goatcounter',   // '', 'plausible' or 'goatcounter'
    plausibleDomain: '',       // e.g. 'jopetnahfoundation.org'
    goatcounterEndpoint: 'https://thejopetnahfoundation.goatcounter.com/count'
  };

  if(!CONFIG.provider) return;
  if(navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;

  function addScript(src, attrs){
    var s = document.createElement('script');
    s.async = true; s.defer = true; s.src = src;
    Object.keys(attrs || {}).forEach(function(k){ s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
  }

  var track;
  if(CONFIG.provider === 'plausible' && CONFIG.plausibleDomain){
    window.plausible = window.plausible || function(){ (window.plausible.q = window.plausible.q || []).push(arguments); };
    addScript('https://plausible.io/js/script.js', {'data-domain': CONFIG.plausibleDomain});
    track = function(name){ window.plausible(name); };
  }else if(CONFIG.provider === 'goatcounter' && CONFIG.goatcounterEndpoint){
    addScript('https://gc.zgo.at/count.js', {'data-goatcounter': CONFIG.goatcounterEndpoint});
    track = function(name){
      if(window.goatcounter && window.goatcounter.count){
        window.goatcounter.count({path: name, title: name, event: true});
      }
    };
  }else{
    return;
  }

  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a');
    if(!a) return;
    var href = a.getAttribute('href') || '';
    if(href.indexOf('mailto:') === 0) track('Email click');
    else if(href.indexOf('tel:') === 0) track('Call click');
    else if(href.indexOf('sms:') === 0) track('Text click');
    else if(href.indexOf('wa.me/') !== -1) track('WhatsApp click');
    else if(/\/\/(www\.)?(facebook|linkedin|x|youtube|instagram|tiktok)\.com\//.test(href)) track('Social click');
    else if(href.indexOf('github.com') !== -1) track('GitHub click');
    else if(a.classList.contains('navcta') || href.indexOf('#get-involved') !== -1) track('Get Involved click');
  });

  var form = document.getElementById('contactForm');
  if(form) form.addEventListener('submit', function(){
    if(form.elements.name.value.trim() && form.elements.email.checkValidity() && form.elements.audience.value && form.elements.message.value.trim()) track('Contact form submitted');
  });
})();
