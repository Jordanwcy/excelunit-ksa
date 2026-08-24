/* Excel Unit Product Finder — client-side assistant.
   Understands brands, categories, specs (cat6a, LSZH, OM4, 24-core, LC, 3m…),
   English + 繁中 keywords. Keeps filters across turns. No backend needed. */
(function(){
'use strict';
var R = '/';
var IDX = null, busy = false;

/* ---------- knowledge ---------- */
var BRAND_WORDS = {systimax:'SYSTIMAX',gigaspeed:'SYSTIMAX',lazrspeed:'SYSTIMAX',teraspeed:'SYSTIMAX',
imvision:'SYSTIMAX',ipatch:'SYSTIMAX',visipatch:'SYSTIMAX',propel:'SYSTIMAX',
netconnect:'NETCONNECT',amp:'NETCONNECT',uniprise:'NETCONNECT',slx:'NETCONNECT',
cpi:'CPI',chatsworth:'CPI',globalframe:'CPI',krone:'KRONE',lsa:'KRONE',highband:'KRONE'};
var CAT_RULES = [
 [/krone|voice|語音|110\s?block|disconnection|backmount/i,'Voice & Krone','voice-krone'],
 [/(aim|intelligent|imvision|智能)/i,'Intelligent Infrastructure (AIM)','aim'],
 [/(raceway|fiberguide|cable management|ladder|basket|理線|線槽)/i,'Cable Management & Raceway','cable-management'],
 [/(rack|cabinet|enclosure|機櫃|機架|frame)/i,'Racks & Cabinets','racks-cabinets'],
 [/(splice|cassette|cartridge|shelf|liu|termination panel|fiber panel|光纖配線|熔接)/i,'Fiber Panels & Splice','fiber-panels'],
 [/(qwik|splice-on|fusion connector|attenuator|coupler|(fiber|optical|光纖).{0,12}(connector|adapter)|連接器)/i,'Fiber Connectors & Adapters','fiber-connectors'],
 [/(pigtail|mpo|mtp|trunk|(fiber|optical|光纖).{0,12}(patch|cord|jumper|跳線)|尾纖|\b(lc|sc|st)\b.{0,20}(cord|patch|jumper|跳線)|(cord|patch|jumper).{0,20}\b(lc|sc|st)\b)/i,'Fiber Patch Cords & MPO','fiber-patch-cords'],
 [/(fiber|optical|光纖|光纜|om[1-5]|os2|singlemode|multimode|單模|多模).{0,16}(cable|纜)|光纜/i,'Fiber Cable','fiber-cable'],
 [/(patch panel|modular panel|配線架|panel)/i,'Copper Panels & 110','copper-panels'],
 [/(jack|outlet|faceplate|插座|面板|surface mount|module)/i,'Jacks, Outlets & Faceplates','jacks-outlets'],
 [/(patch cord|cord|jumper|跳線)/i,'Copper Patch Cords','copper-patch-cords'],
 [/(cat\s?[356]|copper|銅|utp|ftp).{0,14}(cable|纜)|網線/i,'Copper Cable (Bulk)','copper-cable'],
 [/(tool|工具|crimp|stripper|cleaner|connector kit|qwik)/i,'Tools & Accessories','tools-accessories'],
];
var SYN = {
 'cat5e':['cat5e','cat 5e','category 5e'],'cat6':['cat6','cat 6','category 6'],
 'cat6a':['cat6a','cat 6a','category 6a','x10d','6a'],'cat3':['cat3','cat 3','category 3'],
 'lszh':['lszh','low smoke','zero halogen'],'plenum':['plenum','cmp','ofnp'],
 'riser':['riser','cmr','ofnr'],'pvc':['pvc'],
 'armored':['armored','armoured','interlocking armor','ca-'],
 'outdoor':['outdoor','osp','outside plant'],'indoor':['indoor','premises'],
 'singlemode':['singlemode','single mode','single-mode','os2','g.657','g.652','9/125'],
 'multimode':['multimode','multi mode','multi-mode','om3','om4','om5','50/125'],
 'om3':['om3'],'om4':['om4'],'om5':['om5'],'os2':['os2','singlemode','single mode'],
 'lc':['lc'],'sc':['sc'],'st':['st'],'mpo':['mpo','mtp'],'rj45':['rj45','rj-45','modular jack'],
 'utp':['utp','u/utp','unshielded'],'ftp':['ftp','f/utp','shielded','s/ftp','screened'],
 'shuttered':['shuttered','shutter','dust cover'],
 'white':['white'],'blue':['blue'],'black':['black'],'grey':['grey','gray'],'red':['red'],
 'yellow':['yellow'],'green':['green'],'orange':['orange'],'ivory':['ivory','almond'],
};
var ZH2EN = {'藍':'blue','白':'white','黑':'black','灰':'grey','紅':'red','黃':'yellow','綠':'green',
'單模':'singlemode','多模':'multimode','屏蔽':'ftp','非屏蔽':'utp','防火':'lszh','鎧裝':'armored',
'室外':'outdoor','室內':'indoor','跳線':'cord','光纖':'fiber','銅':'copper','插座':'jack','面板':'faceplate',
'配線架':'panel','機櫃':'rack','工具':'tool','現貨':'instock',
'كابل':'cable','نحاسي':'copper','نحاس':'copper','ألياف':'fiber','الألياف':'fiber','ليف':'fiber',
'وصلة':'cord','جامبر':'jumper','مقبس':'jack','مقابس':'jack','لوحة':'panel','لوحات':'panel',
'خزانة':'rack','خزائن':'rack','أحادي':'singlemode','متعدد':'multimode',
'أزرق':'blue','أبيض':'white','أسود':'black','أحمر':'red','أصفر':'yellow','أخضر':'green','رمادي':'grey',
'خارجي':'outdoor','داخلي':'indoor','مدرع':'armored','مدرعة':'armored','أدوات':'tool','مخزون':'instock'};
var STOP = ['the','a','an','i','need','want','looking','for','some','please','show','me','find','with','and','or',
'of','in','do','you','have','any','products','product','item','items','buy','price','quote','only','just','all',
'give','get','something','type','kind','我','想','要','請','找','有','嗎','的'];

/* ---------- state ---------- */
var state = {brand:'', cat:'', catSlug:'', terms:[], stock:false};

/* ---------- parsing ---------- */
function parse(msg){
  var m = msg.toLowerCase();
  var out = {brand:'', cat:'', catSlug:'', terms:[], stock:false, reset:false, intent:''};
  if (/^(hi|hello|hey|你好|哈囉)\b/.test(m) && m.length<20) out.intent='greet';
  if (/(how.*(buy|order|quote)|pricing|price|報價|訂購|點買)/.test(m)) out.intent='quote';
  if (/(contact|phone|email|address|聯絡|電話)/.test(m)) out.intent='contact';
  if (/(clear|reset|start over|new search|重新|清除)/.test(m)) out.reset=true;
  if (/(in stock|ex-?stock|available|現貨)/.test(m)) out.stock=true;
  for (var w in BRAND_WORDS) if (m.indexOf(w)>-1){ out.brand=BRAND_WORDS[w]; break; }
  for (var i=0;i<CAT_RULES.length;i++) if (CAT_RULES[i][0].test(msg)){ out.cat=CAT_RULES[i][1]; out.catSlug=CAT_RULES[i][2]; break; }
  // translate zh fragments then tokenize
  var t = m;
  for (var z in ZH2EN) t = t.split(z).join(' '+ZH2EN[z]+' ');
  t = t.replace(/(\d+)\s*(core|cores|fiber|fibers|fibre|f|芯)\b/g,'$1-count')
       .replace(/(\d+)\s*(port|ports|口)\b/g,'$1 port')
       .replace(/(\d+)\s*(m|米|meter|metre)\b/g,'$1m')
       .replace(/(\d+)\s*(ft|feet|呎)\b/g,'$1ft');
  var toks = t.split(/[^a-z0-9./-]+/).filter(function(x){
    return x && x.length>1 && STOP.indexOf(x)===-1 && x!=='instock' && !BRAND_WORDS[x];});
  // drop tokens already consumed by category words
  var catWords = (out.cat||'').toLowerCase()+' cable cables fiber copper patch cord cords panel panels jack jacks rack racks tool tools outlet outlets faceplate faceplates management voice krone splice cassette mpo';
  toks = toks.filter(function(x){ return catWords.indexOf(x)===-1; });
  out.terms = toks.slice(0,6);
  return out;
}
function expand(tok){
  if (SYN[tok]) return SYN[tok];
  var m = tok.match(/^(\d+)-count$/); if (m) return ['-0*'+m[1]+'-', m[1]+' fiber', m[1]+'-fiber', m[1]+' f ', '-'+pad3(m[1])+'-'];
  m = tok.match(/^(\d+)m$/); if (m) return [m[1]+' m', m[1]+'m', pad3(m[1])+'m', 'm'+pad3(m[1]), m[1]+' meter', m[1]+' metre'];
  m = tok.match(/^(\d+)ft$/); if (m) return [m[1]+' ft', m[1]+'ft', m[1]+' feet'];
  return [tok];
}
function pad3(n){ n=''+n; while(n.length<3)n='0'+n; return n; }

/* ---------- matching ---------- */
function run(){
  var res = IDX.filter(function(x){
    if (state.brand && x.b!==state.brand) return false;
    if (state.cat && x.c!==state.cat) return false;
    if (state.stock && !x.s) return false;
    return state.terms.every(function(tk){
      return expand(tk).some(function(alt){
        if (alt.indexOf('*')>-1){ var ps=alt.split('*'); return x.t.indexOf(ps[0])>-1&&x.t.indexOf(ps[1])>-1; }
        return x.t.indexOf(alt)>-1; });
    });
  });
  res.sort(function(a,b2){ return (b2.s-a.s)||((b2.i?1:0)-(a.i?1:0)); });
  return res;
}

/* ---------- ui ---------- */
function el(tag,cls,html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
var box, log, input;
function build(){
  var launcher = el('button','cbl','<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5z"/></svg><span>Product Finder · دليل المنتجات</span>');
  launcher.setAttribute('aria-label','Open product finder chat');
  box = el('div','cbx');
  box.innerHTML = '<div class="cbh"><div><b>Product Finder · دليل المنتجات</b><span>2,000+ SKUs · SYSTIMAX · NETCONNECT · CPI · KRONE</span></div><button class="cbc" aria-label="Close">✕</button></div>'+
    '<div class="cblog" role="log" aria-live="polite"></div>'+
    '<form class="cbf"><input type="text" placeholder="e.g. cat6a lszh cable · OM4 MPO · اكتب بالعربية أو الإنجليزية…" autocomplete="off" aria-label="Describe the product you need"><button type="submit" aria-label="Send">➤</button></form>';
  document.body.appendChild(launcher); document.body.appendChild(box);
  log = box.querySelector('.cblog'); input = box.querySelector('input');
  launcher.addEventListener('click',function(){ box.classList.toggle('open'); if(box.classList.contains('open')){ input.focus(); if(!log.children.length) hello(); }});
  box.querySelector('.cbc').addEventListener('click',function(){ box.classList.remove('open'); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') box.classList.remove('open'); });
  box.querySelector('.cbf').addEventListener('submit',function(e){ e.preventDefault(); var v=input.value.trim(); if(v&&!busy){ user(v); input.value=''; reply(v); }});
}
function bubble(cls,html){ var b=el('div','cbm '+cls,html); log.appendChild(b); log.scrollTop=log.scrollHeight; return b; }
function user(t){ bubble('me',esc(t)); }
function chips(list){
  var c=el('div','cbchips');
  list.forEach(function(ch){
    var b=el('button','cbchip',esc(ch[0]));
    b.addEventListener('click',function(){ if(busy)return; user(ch[0]); reply(ch[1]||ch[0]); });
    c.appendChild(b); });
  log.appendChild(c); log.scrollTop=log.scrollHeight;
}
function cards(res,n){
  var wrap=el('div','cbcards');
  res.slice(0,n).forEach(function(x){
    var im = x.i ? '<img loading="lazy" src="'+R+x.i+'" alt="">' : '<span>—</span>';
    var st = x.s ? '<em>✓ ex-stock</em>' : '';
    wrap.appendChild(el('a','cbcard','<div class="cim">'+im+'</div><div><b>'+esc(x.n)+'</b><span>'+esc(x.p.split(' ')[0])+'</span>'+st+'</div>')).href=R+x.u;
  });
  log.appendChild(wrap); log.scrollTop=log.scrollHeight;
}
function hello(){
  bubble('bot','Hi! Describe what you need and I\'ll find it in our catalogue — part numbers, specs or plain words all work. تحدث بالعربية أو الإنجليزية — اكتب المواصفات أو رقم القطعة.');
  chips([['Cat6A LSZH cable'],['24-core OS2 fiber'],['LC-LC patch cord 3m'],['CPI racks'],['Krone modules']]);
}

/* ---------- conversation ---------- */
function reply(msg){
  busy=true;
  var think=bubble('bot cbthink','<i></i><i></i><i></i>');
  loadIdx().then(function(){
    setTimeout(function(){ think.remove(); answer(msg); busy=false; },420);
  });
}
function answer(msg){
  var p = parse(msg);
  if (p.intent==='greet' && !p.brand && !p.cat && !p.terms.length){ hello(); return; }
  if (p.intent==='quote'){
    bubble('bot','For distributor pricing, send the part numbers via our quote form — we reply within 1 business day. نرد خلال يوم عمل واحد.');
    var c=el('div','cbchips'); var a=el('a','cbchip','Request a Quote · اطلب عرض سعر');
    a.href=R+'quote'; c.appendChild(a);
    log.appendChild(c); return;
  }
  if (p.intent==='contact'){ bubble('bot','✉ sales@excelunit-ksa.com · jordan@excelunit.com.hk<br>Al Olaya District, Prince Sultan Ibn Abdulaziz Road, Riyadh, Kingdom of Saudi Arabia'); return; }
  if (p.reset){ state={brand:'',cat:'',catSlug:'',terms:[],stock:false}; bubble('bot','Fresh start — what are you looking for? لنبدأ من جديد — ماذا تبحث عنه؟'); return; }
  // bare part-number / SKU lookup -> global search, ignore previous filters
  var lone = msg.trim().toLowerCase();
  if (!p.cat && !p.brand && /^[a-z0-9][a-z0-9./ -]{5,24}$/.test(lone) && /\d{3}/.test(lone) && lone.split(/\s+/).length<=2){
    state={brand:'',cat:'',catSlug:'',terms:[],stock:false};
    p.terms=[lone.split(/\s+/)[0]];
    if(lone.split(/\s+/)[1]) p.terms.push(lone.split(/\s+/)[1]);
  }
  // merge into state: new cat/brand replaces; terms accumulate (fresh cat resets terms)
  if (p.cat && p.cat!==state.cat){ state.cat=p.cat; state.catSlug=p.catSlug; state.terms=[]; }
  if (p.brand) state.brand=p.brand;
  if (p.stock) state.stock=true;
  p.terms.forEach(function(t){ if(state.terms.indexOf(t)===-1) state.terms.push(t); });
  if (!state.brand && !state.cat && !state.terms.length){
    bubble('bot','Tell me a product type, spec or part number — e.g. “Cat6 patch cord blue 2m”, “OM4 MPO trunk”, “760237032”.');
    return;
  }
  var res = run();
  // relax if empty: drop terms one by one (least recent first)
  var dropped=[];
  while(!res.length && state.terms.length){ dropped.push(state.terms.pop()); res=run(); }
  if(!res.length && state.stock){ state.stock=false; dropped.push('in-stock'); res=run(); }
  if(!res.length && state.brand){ dropped.push(state.brand); state.brand=''; res=run(); }
  var f=[];
  if(state.brand)f.push(state.brand);
  if(state.cat)f.push(state.cat);
  state.terms.forEach(function(t){f.push(t)});
  if(state.stock)f.push('ex-stock');
  if(!res.length){
    bubble('bot','No match for <b>'+esc(f.join(' · '))+'</b>. Try a different spec, or send us the part number — if CommScope makes it, we can source it. لم نجد منتجاً مطابقاً — أرسل لنا رقم القطعة مباشرة.');
    chips([['Browse all categories','__cats'],['Request a Quote','how to get a quote']]);
    return;
  }
  var head='Found <b>'+res.length+'</b> product'+(res.length>1?'s':'')+' for <b>'+esc(f.join(' · '))+'</b>'+
    (dropped.length?'<br><span class="cbnote">(I set aside “'+esc(dropped.join(', '))+'” — no exact match with it)</span>':'');
  bubble('bot',head);
  cards(res,4);
  var next=[];
  if(res.length>4){
    var u = state.catSlug ? R+'c/'+state.catSlug+'?'+(state.brand?'brand='+state.brand+'&':'')+'q='+encodeURIComponent(state.terms.join(' '))
                          : R+'product';
    var c2=el('div','cbchips'); var a2=el('a','cbchip cbgo','View all '+res.length+' results →'); a2.href=u; c2.appendChild(a2); log.appendChild(c2);
  }
  // refinement suggestions from result set
  var brands={}; res.forEach(function(x){ if(x.b)brands[x.b]=(brands[x.b]||0)+1; });
  var bkeys=Object.keys(brands);
  if(!state.brand && bkeys.length>1) bkeys.slice(0,3).forEach(function(b){ next.push([b+' only ('+brands[b]+')',b.toLowerCase()]); });
  if(!state.cat){
    var cats={}; res.forEach(function(x){ cats[x.c]=(cats[x.c]||0)+1; });
    Object.keys(cats).sort(function(a,b3){return cats[b3]-cats[a]}).slice(0,3).forEach(function(cn){
      if(Object.keys(cats).length>1) next.push([cn+' ('+cats[cn]+')',cn]); });
  }
  if(!state.stock) next.push(['✓ In stock only','in stock']);
  next.push(['Start over','reset']);
  chips(next.slice(0,5));
}
function loadIdx(){
  if (IDX) return Promise.resolve();
  return fetch(R+'assets/search.json').then(function(r){return r.json()}).then(function(d){
    IDX=d.map(function(x){ x.t=(x.n+' '+x.p+' '+(x.d||'')).toLowerCase(); return x; });
  });
}
/* special chip payloads */
var _origReply=reply;
reply=function(msg){ if(msg==='__cats'){ location.href=R+'product'; return; } _origReply(msg); };

if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',build); else build();
})();
