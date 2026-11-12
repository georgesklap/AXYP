'use strict';
let data=null,tab='leaves',offset=0,metric='nights',password='';
const $=id=>document.getElementById(id);
const months=['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος','Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const people=()=>data.people||[];
const person=id=>people().find(p=>p.id===id)||{name:id,color:'#dce5f5'};
const color=p=>/^#[0-9a-fA-F]{6}$/.test(p.color)?p.color:'#dce5f5';
const period=()=>{let d=new Date(data.year,0,1);if(tab==='shifts'){d.setDate(d.getDate()+offset*7);let dow=(d.getDay()+6)%7;d.setDate(d.getDate()-dow)}else d.setMonth(offset);return d};
function label(){let d=period();if(tab==='shifts'){let e=new Date(d);e.setDate(e.getDate()+6);return `${d.toLocaleDateString('el-GR')} – ${e.toLocaleDateString('el-GR')}`}return `${months[d.getMonth()]} ${d.getFullYear()}`}
function render(){if(!data)return;$('period').textContent=label();document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));let d=period();$('content').innerHTML=tab==='leaves'?leaves(d):tab==='shifts'?shifts(d):tab==='nights'?nights(d):owed(d);document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>showDay(b.dataset.day));document.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>{metric=b.dataset.metric;render()})}
function leaves(d){let y=d.getFullYear(),m=d.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,last=new Date(y,m+1,0).getDate();let html='<div class="calendar">'+['Δ','Τ','Τ','Π','Π','Σ','Κ'].map(s=>`<div class="dow">${s}</div>`).join('');for(let i=0;i<first;i++)html+='<div></div>';for(let day=1;day<=last;day++){let k=dateKey(new Date(y,m,day)),items=(data.leaves[k]||[]).slice(0,2);html+=`<button class="day" data-day="${k}"><span class="number">${day}</span><span class="leaveparts">${items.map(a=>`<span class="leavepart" style="background:${color(person(a.id))}">${esc(a.code)}</span>`).join('')}</span></button>`}return html+'</div><div class="legend">'+people().map(p=>`<span style="background:${color(p)}">${esc(p.name)}</span>`).join('')+'</div>'}
function showDay(k){let a=data.leaves[k]||[];let txt=a.length?a.map(x=>`${person(x.id).name}: ${x.code==='Κ'?'Κανονική':x.code==='Β'?'Βραχεία':x.code}`).join('\n'):'Καμία καταχωρισμένη άδεια';alert(`${k}\n${txt}`)}
function shifts(d){
  const groups=[['Πρωί',['Π']],['Απόγευμα',['Α']],['Νύχτα',['Ν']],['Ρεπό',['Ρ','ΧΡ']],['Άδεια',['Κ','Β','ΑΝ','ΑΙΜ','ΕΙΔ','ΓΟΝ']],['Αδιάθετο',['Α/Α','α/α']]];
  let html='';
  for(let i=0;i<7;i++){
    let day=new Date(d);day.setDate(day.getDate()+i);
    const k=dateKey(day),entries=data.shifts[k]||{},used=new Set();
    html+=`<article class="panel shift-panel"><h3>${day.toLocaleDateString('el-GR',{weekday:'long',day:'numeric',month:'short'})}</h3><div class="shift-grid">`;
    for(const [title,codes] of groups){
      const matches=people().filter(p=>codes.includes(entries[p.id]));
      matches.forEach(p=>used.add(p.id));
      const names=matches.map(p=>`${esc(p.name)}${entries[p.id]==='ΧΡ'?' (ΧΡ)':codes.length>1&&entries[p.id]?' ('+esc(entries[p.id])+')':''}`).join(', ');
      html+=`<div class="shift-label">${title}</div><div class="shift-names${matches.length?'':' shift-empty'}">${names||'—'}</div>`;
    }
    html+='</div>';
    const others=people().filter(p=>entries[p.id]&&!used.has(p.id));
    if(others.length)html+=`<div class="shift-other"><strong>Λοιπά:</strong> ${others.map(p=>esc(p.name)+': '+esc(entries[p.id])).join(', ')}</div>`;
    html+='</article>';
  }
  return html;
}
function nights(d){let m=d.getMonth(),items=data[metric]||{};return `<div class="switch"><button data-metric="nights" class="${metric==='nights'?'':'secondary'}">Νυχτερινά</button><button data-metric="fiveDays" class="${metric==='fiveDays'?'':'secondary'}">Πενθήμερα</button></div><table><thead><tr><th>Συνάδελφος</th><th>${metric==='nights'?'Νύχτες':'5μερα'}</th></tr></thead><tbody>${people().map(p=>{let item=items[p.id]?.[m]||{};return `<tr><td>${esc(p.name)}</td><td style="background:${/^#[0-9a-fA-F]{6}$/.test(item.color||'')?item.color:'transparent'}">${item.value??'—'}</td></tr>`}).join('')}</tbody></table>`}
function owed(d){let m=d.getMonth();return `<table><thead><tr><th>Συνάδελφος</th><th>Μήνας</th><th>Σύνολο</th></tr></thead><tbody>${people().map(p=>{let x=data.owed?.[p.id]?.[m]||{};return `<tr><td>${esc(p.name)}</td><td>${x.hasEntries===false?'—':esc(x.month??'—')}</td><td>${x.hasEntries===false?'—':esc(x.total??'—')}${x.star?' *':''}</td></tr>`}).join('')}</tbody></table>`}
async function decrypt(blob,pass){if(blob.format!=='axyp-aesgcm-v1')throw Error('Άγνωστη μορφή δημοσίευσης');const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));let base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);let key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(blob.salt),iterations:blob.iterations,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);let plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(blob.nonce)},key,bytes(blob.ciphertext));return JSON.parse(new TextDecoder().decode(plaintext))}
async function load(pass){$('error').textContent='';try{let r=await fetch('data.enc.json?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('Δεν υπάρχει δημοσίευση');let obj=await decrypt(await r.json(),pass);if(!obj.year||!Array.isArray(obj.people))throw Error('Μη έγκυρα δεδομένα');data=obj;password=pass;$('unlock').hidden=true;document.querySelector('main').hidden=false;$('updated').textContent='Τελευταία δημοσίευση: '+new Date(obj.publishedAt).toLocaleString('el-GR');offset=tab==='shifts'?0:new Date().getMonth();render()}catch(e){$('error').textContent='Δεν άνοιξαν τα δεδομένα. Έλεγξε τον κωδικό ή τη σύνδεση.';console.error(e)}}
$('open').onclick=()=>load($('password').value);$('password').onkeydown=e=>{if(e.key==='Enter')$('open').click()};$('prev').onclick=()=>{offset--;render()};$('next').onclick=()=>{offset++;render()};$('refresh').onclick=()=>load(password);document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;offset=tab==='shifts'?0:new Date().getMonth();render()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
