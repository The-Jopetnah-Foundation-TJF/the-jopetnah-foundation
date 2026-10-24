(function(){
  var root = document.documentElement;
  var STORAGE_KEY = 'tjf-theme';

  /* ---------- Light / dark theme ----------
   * The inline script in <head> has already set data-theme before first paint
   * (saved choice, else the visitor's system setting, else dark).
   * Here we wire up the switch. The choice is stored only in this browser. */
  function currentTheme(){ return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }

  function paintTheme(theme){
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', theme === 'light' ? '#F8F1E6' : '#180E06');
    var btn = document.getElementById('themeToggle');
    if(btn){
      var next = theme === 'light' ? 'dark' : 'light';
      btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      btn.setAttribute('title', 'Switch to ' + next + ' theme');
    }
  }

  function saved(){
    try{ var v = localStorage.getItem(STORAGE_KEY); return (v === 'light' || v === 'dark') ? v : null; }
    catch(e){ return null; }
  }

  paintTheme(currentTheme());

  var themeBtn = document.getElementById('themeToggle');
  if(themeBtn){
    themeBtn.addEventListener('click', function(){
      var next = currentTheme() === 'light' ? 'dark' : 'light';
      paintTheme(next);
      try{ localStorage.setItem(STORAGE_KEY, next); }catch(e){}
    });
  }

  // Follow the system setting live, unless the visitor has chosen a theme
  if(window.matchMedia){
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var onChange = function(e){ if(!saved()) paintTheme(e.matches ? 'light' : 'dark'); };
    if(mq.addEventListener) mq.addEventListener('change', onChange);
    else if(mq.addListener) mq.addListener(onChange);
  }

  /* ---------- Floating contact button ---------- */
  var fab = document.getElementById('fab'), fabBtn = document.getElementById('fabToggle');
  if(fab && fabBtn){
    document.body.setAttribute('data-fab','');
    var setFab = function(open){ fab.setAttribute('data-open', open ? 'true' : 'false'); fabBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    fabBtn.addEventListener('click', function(){ setFab(fab.getAttribute('data-open') !== 'true'); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && fab.getAttribute('data-open') === 'true'){ setFab(false); fabBtn.focus(); } });
    document.addEventListener('click', function(e){ if(!fab.contains(e.target)) setFab(false); });
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navlinks');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && links.classList.contains('open')){
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Scroll-reveal (no-op on pages without .reveal elements) ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if(!revealEls.length) return;
  if(!('IntersectionObserver' in window)){
    revealEls.forEach(function(el){ el.classList.add('in'); });
    return;
  }
  try{
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function(el){ io.observe(el); });
  }catch(err){
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }
})();
