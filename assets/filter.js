(function(){
var grid=document.getElementById('pgrid');if(!grid)return;
var cards=[].slice.call(grid.children);
var sp=new URLSearchParams(location.search);
var q=sp.get('q')||'',b=sp.get('brand')||'';
var boxes=[].slice.call(document.querySelectorAll('.fside input[type=checkbox]'));
var more=document.getElementById('more');var SHOW=60,shown=SHOW;
if(b){boxes.forEach(function(x){if(x.getAttribute('data-t')==='b.'+b)x.checked=true;});}
function sel(){var m={};boxes.forEach(function(x){if(x.checked){var t=x.getAttribute('data-t');var g=t.split('.')[0];(m[g]=m[g]||[]).push(' '+t+' ');}});return m;}
function apply(){
var t=q.toLowerCase();var m=sel();
var vis=cards.filter(function(c){
if(t&&c.getAttribute('data-t').indexOf(t)===-1)return false;
var f=' '+(c.getAttribute('data-f')||'')+' ';
for(var g in m){var hit=false;for(var i=0;i<m[g].length;i++){if(f.indexOf(m[g][i])>-1){hit=true;break}}if(!hit)return false;}
return true;});
cards.forEach(function(c){c.style.display='none'});
vis.slice(0,shown).forEach(function(c){c.style.display=''});
var cnt=document.getElementById('fcount');if(cnt)cnt.textContent=vis.length;
if(more)more.style.display=vis.length>shown?'':'none';}
boxes.forEach(function(x){x.addEventListener('change',function(){shown=SHOW;apply()})});
var inp=document.querySelector('.fq');
if(inp&&q)inp.value=q;
inp&&inp.addEventListener('input',function(e){q=e.target.value.trim();shown=SHOW;apply()});
var clr=document.getElementById('fclear');
clr&&clr.addEventListener('click',function(){boxes.forEach(function(x){x.checked=false});q='';if(inp)inp.value='';shown=SHOW;apply()});
more&&more.addEventListener('click',function(){shown+=120;apply()});
apply();})();