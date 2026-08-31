

(function(){var t=document.getElementById('tilt3d');if(!t)return;
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var hero=document.querySelector('.hero');
hero.addEventListener('mousemove',function(e){var r=hero.getBoundingClientRect();
var x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
t.style.transform='rotateY('+(x*10)+'deg) rotateX('+(-y*8)+'deg)';});
hero.addEventListener('mouseleave',function(){t.style.transform='';});})();
(function(){
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var top=document.querySelector('.top');
function hdr(){ if(top) top.classList.toggle('solid', window.scrollY>40);
var pb=document.getElementById('pbar');
if(pb){var d=document.documentElement;var m=d.scrollHeight-innerHeight;pb.style.width=(m>0?(scrollY/m*100):0)+'%';}}
window.addEventListener('scroll', hdr, {passive:true}); hdr();
var pb=document.createElement('div'); pb.id='pbar'; document.body.appendChild(pb);
var sel='#industries .ind,.why,.svc,.sec h2,.sec .lead,.mission h2,.mission p,.mission .kicker,.pl,.tierh,.stdbar img,.stdbar span,.cta-band h2,.cta-band p,.spot,.mini,.cablelegend li,footer .wrap > div';
var els=[].slice.call(document.querySelectorAll(sel));
els.forEach(function(e,i){e.classList.add('rv');e.style.transitionDelay=((i%6)*70)+'ms';});
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('on');io.unobserve(x.target);}});},{threshold:.12});
function rvsweep(){els.forEach(function(e){if(e.classList.contains('on'))return;var r=e.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)e.classList.add('on');});}
addEventListener('load',rvsweep);addEventListener('pageshow',rvsweep);addEventListener('hashchange',function(){setTimeout(rvsweep,60);});setTimeout(rvsweep,900);
els.forEach(function(e){io.observe(e);});
function fmt(n,sh){if(sh){return n>=1000000?Math.round(n/1000000)+'M':n>=1000?Math.round(n/1000)+'K':''+n}return n.toLocaleString('en-US')}
var cs=[].slice.call(document.querySelectorAll('[data-count]'));
var io2=new IntersectionObserver(function(en){en.forEach(function(x){if(!x.isIntersecting)return;io2.unobserve(x.target);
var el=x.target,T=+el.getAttribute('data-count'),sf=el.getAttribute('data-suffix')||'',sh=el.hasAttribute('data-short'),nf=el.hasAttribute('data-nofmt');
var t0=null;function step(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/1400);p=1-Math.pow(1-p,3);var v=Math.round(T*p);
el.textContent=(nf?(''+v):fmt(v,sh))+(p===1?sf:'');if(p<1)requestAnimationFrame(step);}
requestAnimationFrame(step);});},{threshold:.4});
cs.forEach(function(e){io2.observe(e);});
})();
(function(){var mb=document.getElementById('mbtn'),nv=document.getElementById('mnavp');
if(!mb)return;
mb.addEventListener('click',function(){var o=document.body.classList.toggle('mnav');mb.setAttribute('aria-expanded',o);});
nv&&nv.addEventListener('click',function(e){if(e.target.tagName==='A'){document.body.classList.remove('mnav');mb.setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){document.body.classList.remove('mnav');}});
})();
/* 3D tilt on product & industry cards — desktop fine-pointer only */
(function(){
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
if(!window.matchMedia('(pointer: fine)').matches)return;
var cur=null,raf=0,mx=0,my=0;
document.addEventListener('mousemove',function(e){
var c=e.target.closest?e.target.closest('.pc,.ind'):null;
if(c!==cur){if(cur)cur.style.transform='';cur=c;}
if(!cur)return;mx=e.clientX;my=e.clientY;
if(!raf){raf=requestAnimationFrame(function(){raf=0;if(!cur)return;
var r=cur.getBoundingClientRect();
var x=(mx-r.left)/r.width-.5,y=(my-r.top)/r.height-.5;
cur.style.transform='perspective(760px) rotateY('+(x*7).toFixed(2)+'deg) rotateX('+(-y*5).toFixed(2)+'deg) translateY(-3px)';});}
},{passive:true});
document.addEventListener('mouseout',function(e){if(cur&&!cur.contains(e.relatedTarget)){cur.style.transform='';cur=null;}},true);
})();
/* depth parallax on use-case spotlight images */
(function(){
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
if(window.innerWidth<881)return;
var imgs=[].slice.call(document.querySelectorAll('.spot .simg'));
if(!imgs.length)return;
var items=imgs.map(function(el){
if(!el.style.backgroundImage)return null;
var layer=document.createElement('div');layer.className='spar';
layer.style.backgroundImage=el.style.backgroundImage;
if(el.style.backgroundPosition)layer.style.backgroundPosition=el.style.backgroundPosition;
el.style.backgroundImage='none';el.insertBefore(layer,el.firstChild);
return {el:el,layer:layer};
}).filter(Boolean);
var t=0;
function upd(){t=0;var vh=innerHeight;
items.forEach(function(it){var r=it.el.getBoundingClientRect();
if(r.bottom<0||r.top>vh)return;
var p=((r.top+r.height/2)-vh/2)/vh;
it.layer.style.transform='translateY('+(p*-26).toFixed(1)+'px)';});}
addEventListener('scroll',function(){if(!t)t=requestAnimationFrame(upd);},{passive:true});
addEventListener('load',upd);upd();
})();
