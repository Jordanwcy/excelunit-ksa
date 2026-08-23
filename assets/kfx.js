(function(){
'use strict';
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
var els = [].slice.call(document.querySelectorAll('.kfx'));
if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      var t = e.target;
      setTimeout(function(){ t.classList.add('on'); }, (+t.getAttribute('data-d') || 0));
      io.unobserve(t);
    });
  }, {threshold: .12, rootMargin: '0px 0px -6% 0px'});
  els.forEach(function(el){ io.observe(el); });
} else { els.forEach(function(el){ el.classList.add('on'); }); }
[].slice.call(document.querySelectorAll('[data-count]')).forEach(function(el){
  var io2 = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      io2.unobserve(el);
      var target = +el.getAttribute('data-count'), suffix = el.getAttribute('data-suffix') || '', t0 = null;
      function step(ts){
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1400, 1); p = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * p).toLocaleString('en-US') + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, {threshold: .6});
  io2.observe(el);
});
})();