(function(){
  // Mobile navigation toggle
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navlinks');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll-reveal (no-op on pages without .reveal elements)
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
