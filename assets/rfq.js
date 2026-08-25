/* Excel Unit KSA RFQ — language-aware, accessible, hardened.
   POSTs to the lead API with a 15s timeout; on failure shows a clear
   message with the sales address (no auto-opened mail client). */
(function(){
'use strict';
var LEAD_API = 'https://excelunit-lead-api.onrender.com/api/lead';
var form = document.getElementById('rfqform');
if (!form) return;
var AR = (document.documentElement.lang || '').indexOf('ar') === 0;
var T = AR ? {
  need: 'يرجى اختيار نوع منتج واحد على الأقل أو إدخال رقم القطعة.',
  email: 'يرجى التحقق من البريد الإلكتروني.',
  fill: 'يرجى تعبئة الحقول المحددة باللون الأحمر.',
  big: ' يتجاوز 15MB — يرجى إرساله إلى sales@excelunit-ksa.com مباشرة.',
  sending: 'جارٍ الإرسال…',
  ok: 'تم تسجيل طلبك',
  okmail: 'ستصلك نسخة من ردنا على ',
  fail: 'تعذر الإرسال الآن — يرجى المحاولة مرة أخرى أو مراسلتنا مباشرة على ',
  send: 'إرسال الطلب'
} : {
  need: 'Tap at least one product type, or paste a part number.',
  email: 'Please check the email address.',
  fill: 'Please fill in the fields marked red.',
  big: ' is over 15 MB — please email it to sales@excelunit-ksa.com instead.',
  sending: 'Sending…',
  ok: 'Request logged',
  okmail: 'A copy of our reply goes to ',
  fail: 'Could not send right now — please try again, or email us directly at ',
  send: 'Send request'
};

[].slice.call(document.querySelectorAll('.qchips')).forEach(function(g){
  var multi = g.hasAttribute('data-multi');
  [].slice.call(g.querySelectorAll('.qchip')).forEach(function(ch){
    ch.addEventListener('click', function(){
      if (multi) ch.classList.toggle('on');
      else {
        var was = ch.classList.contains('on');
        [].slice.call(g.querySelectorAll('.qchip')).forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false');});
        if (!was) ch.classList.add('on');
      }
      ch.setAttribute('aria-pressed', ch.classList.contains('on') ? 'true' : 'false');
      g.classList.remove('bad');
    });
  });
});

var files = [];
var finput = document.getElementById('rfiles');
function renderFiles(){
  var box = document.getElementById('rflist'); if(!box) return;
  box.innerHTML = files.map(function(f,i){
    return '<span class="rfile"><bdi>'+f.name.replace(/[<>&]/g,'')+'</bdi> <b>'+(f.size/1048576).toFixed(1)+'MB</b><button type="button" data-i="'+i+'" aria-label="Remove">✕</button></span>';
  }).join('');
}
if (finput){
  finput.addEventListener('change', function(){
    [].slice.call(finput.files).forEach(function(f){
      if (files.length >= 5) return;
      if (f.size > 15*1048576){ alert(f.name + T.big); return; }
      files.push(f);
    });
    finput.value=''; renderFiles();
  });
  document.getElementById('rflist').addEventListener('click', function(e){
    var b = e.target.closest('button[data-i]'); if(!b) return;
    files.splice(+b.getAttribute('data-i'),1); renderFiles();
  });
}

var pn = new URLSearchParams(location.search).get('pn');
if (pn) {
  var ta = document.getElementById('rpns');
  if (ta) ta.value = pn + '  × ';
  var q = document.getElementById('quote'); if (q) q.scrollIntoView();
}

function picked(name){
  var g = document.querySelector('.qchips[data-name="'+name+'"]');
  if (!g) return [];
  return [].slice.call(g.querySelectorAll('.qchip.on')).map(function(x){return x.textContent;});
}
function val(id){ var el=document.getElementById(id); return el ? el.value.trim() : ''; }
['rname','rcompany','remail','rphone','rpns'].forEach(function(id){
  var el = document.getElementById(id);
  if (el) el.addEventListener('input', function(){ el.classList.remove('bad'); });
});

form.addEventListener('submit', function(e){
  e.preventDefault();
  var err = document.getElementById('rerr'); err.textContent = '';
  var products = picked('products'), pns = val('rpns');
  var name = val('rname'), company = val('rcompany'), email = val('remail'), phone = val('rphone');
  var bad = false;
  if (!products.length && !pns){
    document.querySelector('.qchips[data-name="products"]').classList.add('bad');
    err.textContent = T.need; bad = true;
  }
  [['rname',name],['rcompany',company],['remail',email]].forEach(function(f){
    var el = document.getElementById(f[0]);
    el.classList.toggle('bad', !f[1]); if(!f[1]) bad = true;
  });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
    document.getElementById('remail').classList.add('bad');
    err.textContent = err.textContent || T.email; bad = true;
  }
  if (bad){ if(!err.textContent) err.textContent = T.fill; return; }

  var payload = {
    products: products, sector: picked('sector')[0]||'', stage: '',
    timeline: picked('timeline')[0]||'', scale: '', part_numbers: pns,
    name: name, company: company, email: email, phone: phone,
    website: val('rhp'),
    source: location.pathname + location.search, submitted_at: new Date().toISOString()
  };
  var btn = form.querySelector('.rsubmit'); btn.disabled = true; btn.textContent = T.sending;
  var ctl = ('AbortController' in window) ? new AbortController() : null;
  var timer = ctl ? setTimeout(function(){ ctl.abort(); }, 15000) : null;

  function done(){
    if (window.gtag) gtag('event','generate_lead',{method:'rfq_form',language:AR?'ar':'en'});
    form.hidden = true;
    var ok = document.getElementById('rfqok'); ok.hidden = false;
    var s = document.getElementById('oksum');
    if (s) s.textContent = T.okmail + email;
    ok.scrollIntoView({block:'center'});
  }
  function fail(){
    btn.disabled = false; btn.textContent = T.send;
    err.innerHTML = T.fail + '<a href="mailto:sales@excelunit-ksa.com" style="font-weight:700">sales@excelunit-ksa.com</a>';
  }
  var req;
  if (files.length){
    var fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    files.forEach(function(f){ fd.append('files', f, f.name); });
    req = fetch(LEAD_API, {method:'POST', body: fd, signal: ctl && ctl.signal});
  } else {
    req = fetch(LEAD_API, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), signal: ctl && ctl.signal});
  }
  req.then(function(r){ if(timer)clearTimeout(timer); if(!r.ok) throw 0; done(); })
     .catch(function(){ if(timer)clearTimeout(timer); fail(); });
});
})();
