/*
 * Contact form. No server involved: the form composes an email and opens the
 * visitor's own email app (mailto:). Nothing is transmitted until they press
 * send in their email app. A copy-to-clipboard fallback is shown because very
 * long messages or missing mail apps can make mailto links fail.
 */
(function(){
  var TO = 'thejopetnahfoundation@gmail.com';
  var form = document.getElementById('contactForm');
  if(!form) return;

  var result = document.getElementById('formResult');
  var preview = document.getElementById('composedText');
  var copyBtn = document.getElementById('copyBtn');
  var copyStatus = document.getElementById('copyStatus');


  // Prefill from ?audience=inkind|volunteer|donor... and show guidance in the message box.
  var HINTS = {
    inkind: 'Tell us what you would like to give (for example books, shelving, furniture, solar equipment), roughly how much, its condition, where it is, and whether you can help with transport. Please do not ship anything until we have replied.',
    volunteer: 'Tell us your skills or profession, how many hours you could offer, whether you can work remotely or in person, and any relevant experience. All volunteers go through TJF safeguarding checks before any contact with children.',
    donor: 'Tell us what you are interested in supporting and anything you would need to see first. Online donations are not active yet.',
    partner: 'Tell us about your organisation and how you would like to work with TJF.'
  };
  var sel = form.elements.audience, msg = form.elements.message;
  function applyHint(){ msg.placeholder = HINTS[sel.value] || ''; }
  try{
    var q = new URLSearchParams(window.location.search).get('audience');
    if(q && sel.querySelector('option[value="'+q+'"]')) sel.value = q;
  }catch(e){}
  sel.addEventListener('change', applyHint);
  applyHint();

  function fieldWrap(el){ return el.closest('.field'); }

  function validate(){
    var ok = true, firstBad = null;
    ['name','email','audience','message'].forEach(function(id){
      var el = form.elements[id];
      var wrap = fieldWrap(el);
      var good = el.value.trim() !== '' && (id !== 'email' || el.checkValidity());
      wrap.classList.toggle('invalid', !good);
      el.setAttribute('aria-invalid', good ? 'false' : 'true');
      if(!good){ ok = false; if(!firstBad) firstBad = el; }
    });
    if(firstBad) firstBad.focus();
    return ok;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(!validate()) return;

    var v = function(id){ return form.elements[id].value.trim(); };
    var audience = form.elements.audience.options[form.elements.audience.selectedIndex].text;
    var subject = '[TJF website] ' + audience + ' — ' + v('name');
    var lines = [
      'Name: ' + v('name'),
      'Email: ' + v('email'),
      'I am: ' + audience
    ];
    if(v('organisation')) lines.push('Organisation: ' + v('organisation'));
    lines.push('', v('message'));
    var body = lines.join('\n');

    preview.value = 'To: ' + TO + '\nSubject: ' + subject + '\n\n' + body;
    result.classList.add('show');
    result.setAttribute('tabindex','-1');

    var href = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) +
               '&body=' + encodeURIComponent(body);
    if(href.length <= 1900){
      window.location.href = href;
    }else{
      document.getElementById('resultLead').textContent =
        'Your message is too long to pre-fill automatically. Copy it below and paste it into an email to ' + TO + '.';
    }
    result.focus();
  });

  form.addEventListener('input', function(e){
    var wrap = fieldWrap(e.target);
    if(wrap && wrap.classList.contains('invalid') && e.target.value.trim() !== ''){
      wrap.classList.remove('invalid');
      e.target.setAttribute('aria-invalid','false');
    }
  });

  if(copyBtn){
    copyBtn.addEventListener('click', function(){
      var done = function(msg){ copyStatus.textContent = msg; };
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(preview.value).then(
          function(){ done('Copied.'); },
          function(){ preview.select(); done('Press Ctrl+C (or Cmd+C) to copy.'); }
        );
      }else{
        preview.select(); done('Press Ctrl+C (or Cmd+C) to copy.');
      }
    });
  }
})();
