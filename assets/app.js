
const inp=document.getElementById('q');let idx=null;
async function load(){if(!idx){idx=await (await fetch('assets/search.json')).json()}}
const go=document.getElementById('qgo');
go&&go.addEventListener('click',()=>{inp.dispatchEvent(new Event('input'));document.getElementById('results').scrollIntoView({block:'start'})});
inp&&inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go&&go.click();}});
inp&&inp.addEventListener('input',async e=>{await load();const q=e.target.value.trim().toLowerCase();
const res=document.getElementById('results');const cats=document.getElementById('catgrid');
const pgh=document.getElementById('pgh');if(q.length<2){res.style.display='none';cats.style.display='grid';pgh&&(pgh.innerHTML='Browse by category <span style="color:var(--blue);font-size:22px">產品目錄</span>');return}pgh&&(pgh.innerHTML='Search results <span style="color:var(--blue);font-size:22px">搜尋結果</span>');
const terms=q.split(/\s+/);const hits=idx.filter(x=>terms.every(t=>(x.n+' '+x.p).toLowerCase().includes(t))).slice(0,48);
res.innerHTML=hits.map(x=>`<a class="pc" href="${x.u}"><div class="im">${x.i?`<img loading="lazy" src="${x.i}">`:'<span class="noimg">—</span>'}</div><div class="bd"><h3>${x.n}</h3><span class="pn">${x.p.slice(0,34)}</span></div></a>`).join('')||'<p style="color:var(--mut)">No products matched. Try a part number like "CPC3312" or "N-012".</p>';
res.style.display='grid';cats.style.display='none';});
