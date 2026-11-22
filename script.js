'use strict';
/* RoadPulse – Supabase-connected community road safety application. */
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch{return d}},
set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{toast('Storage is full. Try a smaller image.','err');return false}}};


/* Outline icons: every emoji used in the templates below is swapped for a clean SVG icon when rendered */
const P={'📋':'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>','✅':'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>','🎉':'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>','🚧':'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>','📸':'<path d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><circle cx="12" cy="13" r="4"/>','🤝':'<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-1a6 6 0 0112 0v1M16 4.5a3.5 3.5 0 010 7M22 21v-1a5 5 0 00-4-5"/>','🛠':'<path d="M14.5 6.5a4 4 0 005 5L10 21a2 2 0 01-3-3z"/><path d="M14.5 6.5l2-3 3 3-3 2"/>','🕳':'<ellipse cx="12" cy="14" rx="9" ry="5"/><ellipse cx="12" cy="14" rx="4" ry="2"/>','🛣':'<path d="M8 3L4 21M16 3l4 18M12 4v3M12 11v3M12 18v3"/>','🌧':'<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>','🚦':'<rect x="7" y="2" width="10" height="20" rx="3"/><circle cx="12" cy="7" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="17" r="1"/>','👁':'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>','👍':'<path d="M7 11v10H3V11zM7 11l4-8a2 2 0 012 2v4h6a2 2 0 012 2l-1.5 7a2 2 0 01-2 1.5H7"/>','📍':'<path d="M12 22s7-6.5 7-12a7 7 0 00-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>','🏠':'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>','➕':'<path d="M12 5v14M5 12h14"/>','🔎':'<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>','🔍':'<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>','🛡':'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>','📝':'<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>','⏳':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>','🔥':'<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>','🗑':'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>','🌿':'<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8"/>'};
const emo=h=>h.replace(/\p{Extended_Pictographic}\uFE0F?/gu,m=>{const k=m.replace('\uFE0F','');return P[k]?`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${P[k]}</svg>`:''});
{const d=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{get(){return d.get.call(this)},set(v){d.set.call(this,typeof v=='string'?emo(v):v)}})}

const STAT=['Reported','Under Review','In Progress','Resolved'],SEV=['Low','Medium','High','Critical'];
const CATS={'Pothole':'🕳️','Damaged Road':'🛣️','Waterlogging':'🌧️','Traffic Signal':'🚦','Road Obstruction':'🚧'},CK=Object.keys(CATS);
const day=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
let reports=[],user=null,conf=[],listFn=null,img='',lastHash='',currentSession=null;
const supabaseReady=!!(window.supabase&&window.ROADPULSE_SUPABASE_URL&&window.ROADPULSE_SUPABASE_PUBLISHABLE_KEY&&window.ROADPULSE_SUPABASE_PUBLISHABLE_KEY!=='PASTE_YOUR_SB_PUBLISHABLE_KEY_HERE');
const sb=supabaseReady?window.supabase.createClient(window.ROADPULSE_SUPABASE_URL,window.ROADPULSE_SUPABASE_PUBLISHABLE_KEY):null;
let currentSlide=0,slideTimer=null;
const setTheme=mode=>{document.documentElement.dataset.theme=mode;store.set('rp_theme',mode);const b=$('.theme-toggle');if(b){b.querySelector('.theme-glyph').textContent=mode==='dark'?'☀':'☾';b.querySelector('.theme-word').textContent=mode==='dark'?'Light mode':'Dark mode';b.setAttribute('aria-label',mode==='dark'?'Switch to light theme':'Switch to dark theme')}};
setTheme(store.get('rp_theme','light'));
const F={q:'',cat:'',sev:'',st:'',sort:'prio'},A={q:'',st:'',sort:'prio'},D={q:'',st:'',sort:'new'};
const save=()=>true;
const dbError=(err)=>{console.error(err);return err?.message||'Something went wrong. Please try again.'};
async function loadProfile(){if(!sb||!currentSession)return null;const {data,error}=await sb.from('profiles').select('id,full_name,role').eq('id',currentSession.user.id).maybeSingle();if(error)throw error;return {id:currentSession.user.id,name:data?.full_name||currentSession.user.email?.split('@')[0]||'Resident',email:currentSession.user.email,role:data?.role||'resident'};}
async function loadReports(){if(!sb)return;const [{data:rows,error:rErr},{data:votes,error:vErr}]=await Promise.all([sb.from('road_reports').select('*').order('created_at',{ascending:false}),sb.from('report_confirmations').select('report_id,user_id')]);if(rErr)throw rErr;if(vErr)throw vErr;const counts=new Map();(votes||[]).forEach(v=>counts.set(v.report_id,(counts.get(v.report_id)||0)+1));conf=(votes||[]).filter(v=>v.user_id===user?.id).map(v=>v.report_id);reports=(rows||[]).map(r=>({id:r.id,title:r.title,desc:r.description,cat:r.category,loc:r.location,sev:r.severity,status:r.status,date:(r.created_at||'').slice(0,10),conf:counts.get(r.id)||0,by:r.user_id,img:r.image_url||''}));}
async function refreshSession(){if(!sb)return;const {data,error}=await sb.auth.getSession();if(error)throw error;currentSession=data.session;user=currentSession?await loadProfile():null;await loadReports();}
const prio=r=>{
  const severityScore=({Low:10,Medium:25,High:45,Critical:65}[r.sev]||10);
  const communityScore=Math.min(25,Math.max(0,Number(r.conf)||0));
  const ageDays=Math.max(0,(Date.now()-new Date(r.date+'T00:00:00').getTime())/86400000);
  const recencyScore=Math.max(0,10-ageDays);
  const resolvedPenalty=r.status==='Resolved'?-100:0;
  return severityScore+communityScore+recencyScore+resolvedPenalty;
};
const badge=r=>`<span class="badge s${STAT.indexOf(r.status)}">${r.status}</span>`,sevb=r=>`<span class="sev v${SEV.indexOf(r.sev)}">● ${r.sev}</span>`;

function toast(m,t='ok'){const d=document.createElement('div');d.className='toast '+t;d.textContent=m;$('#toasts').append(d);setTimeout(()=>d.remove(),3200)}
function count(el){const n=+el.dataset.count;let s=null;const f=t=>{s??=t;const p=Math.min((t-s)/900,1);el.textContent=Math.round(n*p);if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)}

/* ---------- reusable pieces ---------- */
const card=r=>`<a class="card" href="#/view/${r.id}"><div class="thumb c${CK.indexOf(r.cat)}">${r.img?`<img src="${r.img}" alt="">`:`<span>${CATS[r.cat]}</span>`}</div><div class="pad"><div class="row between">${badge(r)}${sevb(r)}</div><h3>${esc(r.title)}</h3><p class="mut"><small>📍 ${esc(r.loc)}</small></p><div class="row between"><small class="mut">${r.date}</small><button class="btn sm ${conf.includes(r.id)?'':'ghost'}" data-act="confirm" data-id="${r.id}">👍 ${r.conf} ${conf.includes(r.id)?'Confirmed':'Confirm'}</button></div></div></a>`;
const grid=L=>L.length?`<div class="grid">${L.map(card).join('')}</div>`:`<div class="empty">No reports match. Try clearing a filter or <a href="#/report"><b>report a new issue</b></a>.</div>`;
function filt(L,S){const q=S.q.toLowerCase();return L.filter(r=>(!q||(r.title+r.loc+r.desc).toLowerCase().includes(q))&&(!S.cat||r.cat==S.cat)&&(!S.sev||r.sev==S.sev)&&(!S.st||r.status==S.st)).sort(S.sort=='prio'?(a,b)=>prio(b)-prio(a)||b.date.localeCompare(a.date):(a,b)=>b.date.localeCompare(a.date)||b.id-a.id)}
const opt=(a,v,all)=>`<option value="">${all}</option>`+a.map(x=>`<option ${x==v?'selected':''}>${x}</option>`).join('');
const bar=(p,S,full)=>`<div class="filters"><input id="${p}-q" placeholder="Search reports…" value="${esc(S.q)}" aria-label="Search">${full?`<select id="${p}-cat" aria-label="Category">${opt(CK,S.cat,'All categories')}</select><select id="${p}-sev" aria-label="Severity">${opt(SEV,S.sev,'All severities')}</select>`:''}<select id="${p}-st" aria-label="Status">${opt(STAT,S.st,'All statuses')}</select>${p!='d'?`<select id="${p}-sort" aria-label="Sort"><option value="new">Newest first</option><option value="prio" ${S.sort=='prio'?'selected':''}>Highest priority</option></select>`:''}</div>`;
const statCard=([t,n,i,c])=>`<div class="stat ${c}"><span>${i}</span><b data-count="${n}">0</b><small>${t}</small></div>`;
const tl=r=>{const k=STAT.indexOf(r.status);return `<ol class="tl">${STAT.map((s,i)=>`<li class="${i<=k?'done':''} ${i==k?'now':''}"><i>${i<k?'✓':i+1}</i>${s}</li>`).join('')}</ol>`};
const shell=(on,body)=>`<div class="wrap shell"><aside><a class="${on=='dash'?'on':''}" href="#/dashboard">🏠 Dashboard</a><a href="#/report">➕ New report</a><a href="#/explore">🔎 Explore</a>${user&&user.role=='admin'?`<a class="${on=='admin'?'on':''}" href="#/admin">🛡️ Admin</a>`:''}</aside><section>${body}</section></div>`;

const HERO=`<svg class="hero-art" viewBox="0 0 480 360" aria-hidden="true"><circle cx="395" cy="60" r="38" fill="#FFF0B8"/><rect x="30" y="150" width="70" height="150" rx="8" fill="#B9DDF7"/><rect x="110" y="120" width="80" height="180" rx="8" fill="#B8E6D0"/><rect x="200" y="175" width="60" height="125" rx="8" fill="#FFE0D2"/><rect x="270" y="135" width="90" height="165" rx="8" fill="#B9DDF7"/><rect x="370" y="185" width="70" height="115" rx="8" fill="#B8E6D0"/><path d="M0 300h480v60H0z" fill="#dfe9e4"/><path d="M0 332h480" stroke="#fff" stroke-width="4" stroke-dasharray="26 18"/><ellipse cx="300" cy="322" rx="30" ry="8" fill="#34443D" opacity=".2"/><g class="pin"><path d="M300 150c-26 0-44 19-44 42 0 30 44 70 44 70s44-40 44-70c0-23-18-42-44-42z" fill="#35A77A"/><circle cx="300" cy="192" r="16" fill="#fff"/></g></svg>`;
const FOOT=`<div class="foot-inner"><div class="foot-brand"><a class="logo" href="#/home"><img src="assets/logo.svg" alt="" width="32">RoadPulse</a><p>Community reporting. Clearer priorities. Safer journeys.</p></div><div class="foot-links"><b>Explore</b><a href="#/explore">Community reports</a><a href="#/about">About RoadPulse</a><a href="#/report">Report a hazard</a></div><div class="foot-note"><b>See it. Report it. Follow it.</b><p>Help make road concerns visible to the people who can review them.</p></div></div><div class="foot-bottom"><span>© ${new Date().getFullYear()} RoadPulse</span><span>Built around safer, more connected communities.</span></div>`;

/* ---------- views ---------- */
const home=()=>{const res=reports.filter(r=>r.status=='Resolved').length,tc=reports.reduce((a,r)=>a+r.conf,0);return `
<section class="wrap hero"><div class="hero-copy"><div class="hero-slides" aria-live="polite"><article class="hero-slide active" data-slide="0"><span class="pill">COMMUNITY ROAD WATCH</span><h1>Better streets begin with <em>being heard.</em></h1><p class="lead">Report the road hazards you encounter and help your neighbourhood keep track of the issues that matter.</p></article><article class="hero-slide" data-slide="1"><span class="pill">REPORTS THAT GET NOTICED</span><h1>One clear report can make a <em>real difference.</em></h1><p class="lead">Add a location, explain the risk and attach a photograph so others can understand the problem.</p></article><article class="hero-slide" data-slide="2"><span class="pill">PRIORITY THROUGH PARTICIPATION</span><h1>Help urgent road issues rise to the <em>top.</em></h1><p class="lead">Confirm hazards you have seen. Severity and community confirmations help highlight reports that need attention.</p></article></div><div class="row g hero-actions"><a class="btn" href="#/report">Report a hazard <span aria-hidden="true">→</span></a><a class="btn ghost" href="#/explore">Explore community reports</a></div><div class="slide-controls" aria-label="Hero slides"><button type="button" data-act="slide-prev" aria-label="Previous slide">←</button><button type="button" class="slide-dot active" data-act="slide" data-slide-to="0" aria-label="Show slide 1"></button><button type="button" class="slide-dot" data-act="slide" data-slide-to="1" aria-label="Show slide 2"></button><button type="button" class="slide-dot" data-act="slide" data-slide-to="2" aria-label="Show slide 3"></button><button type="button" data-act="slide-next" aria-label="Next slide">→</button></div></div>${HERO}</section>
<section class="wrap stats3">${statCard(['Total reports',reports.length,'📋','sky'])}${statCard(['Resolved issues',res,'✅','mint'])}${statCard(['Active reports',reports.length-res,'🚧','peach'])}</section>
<section class="wrap sec center"><h2>One shared place for road concerns</h2><p class="mut">See what residents are reporting, add useful details and follow progress.</p><div class="steps">
<div class="card pad"><div class="ico peach">📸</div><h3>Report the issue</h3><p class="mut">Add a title, location, severity and photo in under a minute.</p></div>
<div class="card pad"><div class="ico yel">🤝</div><h3>Neighbours confirm</h3><p class="mut">Community confirmations push urgent problems up the list.</p></div>
<div class="card pad"><div class="ico mint">🛠️</div><h3>Track the fix</h3><p class="mut">Follow the status from review to work in progress to resolved.</p></div></div></section>
<section class="wrap"><div class="band center"><h2>What can you report?</h2><div class="cats">${CK.map((c,i)=>`<a class="card cat" href="#/explore"><div class="ico c${i}">${CATS[c]}</div><b>${c}</b></a>`).join('')}</div></div></section>
<section class="wrap sec center"><h2>Community reports at a glance</h2><div class="impact"><div><b data-count="${tc}">0</b>community confirmations</div><div><b data-count="${reports.length}">0</b>reports shared</div><div><b data-count="${res}">0</b>reports resolved</div></div>
<p style="margin-top:30px"><a class="btn" href="#/${user?'report':'register'}">${user?'Report an issue':'Create a free account'}</a></p></section>`};

const about=()=>`<section class="wrap sec">
<div class="about-hero"><span class="pill">ABOUT ROADPULSE</span><h1>Making everyday roads safer, one community report at a time.</h1>
<p class="lead">RoadPulse is a community-based road hazard reporting and monitoring platform. It gives residents a simple way to report problems they encounter and helps bring repeated, urgent issues to the attention of the people responsible for reviewing them.</p></div>
<div class="about-grid">
<article class="card pad"><div class="ico mint">📍</div><h3>Why RoadPulse</h3><p class="mut">A pothole, damaged stretch or faulty traffic signal can affect hundreds of journeys. RoadPulse brings these concerns into one shared place so they are easier to see and follow up.</p></article>
<article class="card pad"><div class="ico sky">🤝</div><h3>Community participation</h3><p class="mut">Residents can share a description, location and photograph. Others can confirm issues they have personally seen, helping important hazards receive more attention.</p></article>
<article class="card pad"><div class="ico peach">🛠</div><h3>Visible progress</h3><p class="mut">Every report can move through Reported, Under Review, In Progress and Resolved, giving residents a clearer view of its progress.</p></article>
</div>
<div class="band about-process"><span class="pill">HOW IT WORKS</span><h2>From a road-side observation to a visible record.</h2>
<div class="steps"><div><b>01</b><h3>Report</h3><p class="mut">Add the hazard type, location, severity, description and a clear photo.</p></div><div><b>02</b><h3>Confirm</h3><p class="mut">Residents can confirm reports they have also seen.</p></div><div><b>03</b><h3>Prioritise</h3><p class="mut">Severity and community confirmations help urgent reports stand out.</p></div><div><b>04</b><h3>Track</h3><p class="mut">Administrators review reports and update their status as work progresses.</p></div></div></div>
<div class="about-detail-grid">
<article class="card pad"><span class="pill">WHAT CAN BE REPORTED</span><h2>Everyday hazards. Real-world impact.</h2><p class="mut">RoadPulse supports reports about potholes, damaged road surfaces, waterlogging, traffic signals that are not working and obstructions that make roads difficult or unsafe to use. A useful report includes a recognisable location, a concise description and a photograph when it is safe to take one.</p></article>
<article class="card pad"><span class="pill">HOW PRIORITY IS SET</span><h2>Make the urgent issues easier to spot.</h2><p class="mut">The report feed gives greater visibility to higher-severity hazards, reports confirmed by more residents and recent unresolved issues. This helps organise attention; it is a guide for review, not an automated safety decision or a guarantee of repair order.</p></article>
<article class="card pad"><span class="pill">REPORT STATUS</span><h2>Know what happens next.</h2><p class="mut"><b>Reported</b> means a concern has been submitted. <b>Under Review</b> means it is being checked. <b>In Progress</b> means action is underway. <b>Resolved</b> means the issue has been marked as addressed.</p></article>
<article class="card pad"><span class="pill">COMMUNITY GUIDELINES</span><h2>Useful reports are respectful and accurate.</h2><p class="mut">Share only issues you have observed, choose the closest location, avoid personal details in photographs and do not put yourself in danger to take a picture. Confirm a report only when you have seen the same issue.</p></article>
</div>
<div class="about-note"><h2>Our purpose</h2><p class="mut">RoadPulse aims to make road concerns easier to report, easier for neighbours to recognise and easier for administrators to review. By bringing reports and progress updates into one place, the platform encourages shared responsibility and more transparent follow-up.</p><p class="mut">RoadPulse is a community information and tracking tool. It is not an emergency-response service and does not replace official municipal or police complaint channels. For an immediate threat to safety, contact the appropriate local emergency service or authority.</p></div>
<p class="about-disclaimer">RoadPulse stores accounts, reports, confirmations and report photographs in Supabase. Access is controlled through authenticated sessions and database security policies.</p>
</section>`;

const explore=()=>{listFn=()=>grid(filt(reports,F));return `<section class="wrap sec"><div class="explore-head"><div><span class="pill">COMMUNITY REPORTS</span><h1>Road issues reported by residents</h1><p class="lead">Browse concerns shared by other residents. Confirm an issue if you have seen it too, and help bring urgent hazards to the top.</p></div><a class="btn" href="#/report">＋ Report a hazard</a></div><div class="priority-note"><b>How priority works</b><span>Reports are ranked using severity, community confirmations and how recently the issue was reported. Resolved reports move down the list.</span></div>${bar('f',F,1)}<div class="list-caption"><b>Community report feed</b><span class="mut">Sorted by highest priority</span></div><div id="list">${listFn()}</div></section>`};

const authPage=reg=>`<div class="card auth"><div class="center"><img src="assets/logo.svg" width="48" alt=""><h2>${reg?'Create your account':'Welcome back'}</h2><p class="mut">${reg?'Create an account to report hazards, add photos and follow updates.':'Sign in to report a hazard, confirm community reports and track progress.'}</p></div><form class="form" data-form="${reg?'register':'login'}" novalidate style="margin-top:18px">
${reg?'<label>Full name<input name="name" autocomplete="name" placeholder="Asha Rao"></label>':''}
<label>Email<input name="email" type="email" autocomplete="email" placeholder="you@example.com" ></label>
<label>Password<span class="pw"><input name="password" type="password" placeholder="At least 8 characters" ><button type="button" data-act="eye" aria-label="Show or hide password">👁</button></span></label>
${reg?'<label>Confirm password<span class="pw"><input name="confirm" type="password"><button type="button" data-act="eye" aria-label="Show or hide password">👁</button></span></label>':''}
<div class="msg"></div><button class="btn full">${reg?'Create account':'Log in'}</button></form>
<p class="center mut" style="margin-top:14px"><small>${reg?'Already registered? <a href="#/login"><b>Log in</b></a>':`New here? <a href="#/register"><b>Create an account</b></a>`}</small></p></div>`;
const login=()=>authPage(0),register=()=>authPage(1);

const dashboard=()=>{const my=reports.filter(r=>r.by==user.id),c=s=>my.filter(r=>r.status==s).length;listFn=()=>grid(filt(my,D));
return shell('dash',`<div class="row between"><div><h1 style="font-size:1.9rem">Welcome back, ${esc(user.name)}</h1><p class="mut">Here is how your reports are doing.</p></div><a class="btn" href="#/report">+ Quick report</a></div>
<div class="card pad prof"><div class="avatar">${esc(user.name[0]||'U').toUpperCase()}</div><div><b>${esc(user.name)}</b><br><small class="mut">${esc(user.email)}</small></div></div>
<div class="stats5">${[['Total reports',my.length,'📋','sky'],['Reported',c('Reported'),'📝','peach'],['Under review',c('Under Review'),'🔍','yel'],['In progress',c('In Progress'),'🛠️','sky'],['Resolved',c('Resolved'),'✅','mint']].map(statCard).join('')}</div>
<h2 style="font-size:1.3rem">Recent reports</h2>${bar('d',D,0)}<div id="list">${listFn()}</div>${my.length?'':`<p class="mut center"><small>Your own submissions will appear here. Browse the Community reports page to see reports shared by other residents.</small></p>`}`)};

const reportForm=()=>{img='';return `<section class="wrap sec" style="max-width:720px"><div class="card pad" id="rf"><h1 style="font-size:1.9rem">Report a road issue</h1><p class="mut">Clear details help the review team act faster.</p><form class="form" data-form="report" novalidate style="margin-top:16px">
<label>Issue title<input name="title" placeholder="e.g. Deep pothole near bus stop"></label>
<label>Category<select name="cat">${CK.map(c=>`<option>${c}</option>`).join('')}</select></label>
<label>Description<textarea name="desc" rows="4" placeholder="What is wrong, and how does it affect people?"></textarea></label>
<label>Location<input name="loc" placeholder="Street, landmark, area"></label>
<div><b style="font-size:.9rem;font-weight:500">Severity</b><div class="chips" style="margin-top:6px">${SEV.map((s,i)=>`<label><input type="radio" name="sev" value="${s}" ${i==1?'checked':''}><span>${s}</span></label>`).join('')}</div></div>
<div><b style="font-size:.88rem;font-weight:500">Photo (optional)</b><div class="row" style="margin-top:6px"><button type="button" class="btn ghost sm" data-act="cam">📸 Take photo</button><label class="btn ghost sm" style="cursor:pointer">Upload from device<input type="file" id="img" accept="image/*" hidden></label></div></div><img class="prev" id="prev" alt="Preview of selected photo">
<div class="msg"></div><button class="btn full">Submit report</button></form></div></section>`};

const details=id=>{const r=reports.find(x=>x.id==id);if(!r)return `<section class="wrap sec center"><h2>Report not found</h2><p><a class="btn" href="#/explore">Back to reports</a></p></section>`;
const rel=reports.filter(x=>x.cat==r.cat&&x.id!=r.id).slice(0,3),ok=conf.includes(r.id);
return `<section class="wrap sec"><a href="#/explore" class="mut">← All reports</a><div class="det"><div class="card pad"><div class="thumb big c${CK.indexOf(r.cat)}">${r.img?`<img src="${r.img}" alt="">`:`<span style="font-size:5rem">${CATS[r.cat]}</span>`}</div><div class="row" style="margin-top:14px">${badge(r)}${sevb(r)}</div><h1 style="font-size:1.8rem;margin:8px 0">${esc(r.title)}</h1><p>${esc(r.desc)}</p></div>
<div class="card pad"><h3>Details</h3><div class="facts"><div><small class="mut">Location</small><br>${esc(r.loc)}</div><div><small class="mut">Category</small><br>${CATS[r.cat]} ${r.cat}</div><div><small class="mut">Reported on</small><br>${r.date}</div><div><small class="mut">Confirmations</small><br>👍 ${r.conf}</div></div>
<button class="btn full ${ok?'':'ghost'}" data-act="confirm" data-id="${r.id}">${ok?'✓ You confirmed this (tap to undo)':'👍 I have seen this too'}</button>${user&&(user.role=='admin'||user.email==r.by)?`<button class="btn ghost full" style="margin-top:10px;color:#b33" data-act="del" data-id="${r.id}">🗑 Delete this report</button>`:''}<h3 style="margin-top:22px">Status timeline</h3>${tl(r)}</div></div>
<h2 style="font-size:1.4rem;margin-bottom:16px">Related reports</h2>${rel.length?`<div class="grid">${rel.map(card).join('')}</div>`:'<div class="empty">No related reports in this category yet.</div>'}</section>`};

const adminRows=()=>{const L=filt(reports,A);return L.length?`<table><thead><tr><th>ID</th><th>Report</th><th>Category</th><th>Priority</th><th>Votes</th><th>Status</th><th></th></tr></thead><tbody>${L.map(r=>`<tr><td>#${r.id}</td><td><b>${esc(r.title)}</b><br><small class="mut">${esc(r.loc)}</small></td><td>${CATS[r.cat]} ${r.cat}</td><td>${sevb(r)}<div class="meter"><i style="width:${Math.min(100,prio(r)*2)}%"></i></div></td><td>👍 ${r.conf}</td><td><select data-st="${r.id}" aria-label="Update status">${STAT.map(s=>`<option ${s==r.status?'selected':''}>${s}</option>`).join('')}</select></td><td><div class="row" style="flex-wrap:nowrap"><a class="btn ghost sm" href="#/view/${r.id}">View</a><button class="btn ghost sm" style="color:#b33" data-act="del" data-id="${r.id}">🗑 Delete</button></div></td></tr>`).join('')}</tbody></table>`:`<div class="empty">No reports match your filters.</div>`};
const admin=()=>{listFn=adminRows;const c=s=>reports.filter(r=>r.status==s).length;
return shell('admin',`<h1 style="font-size:1.9rem">Admin dashboard</h1><p class="mut">Review community-submitted hazards, prioritise urgent issues and keep residents informed with clear status updates.</p><div class="priority-note"><b>Review order</b><span>Highest severity, strongest community confirmation and newest unresolved reports appear first.</span></div><div class="stats5">${[['Total reports',reports.length,'📋','sky'],['Pending',c('Reported')+c('Under Review'),'⏳','yel'],['High priority',reports.filter(r=>SEV.indexOf(r.sev)>=2&&r.status!='Resolved').length,'🔥','peach'],['Resolved',c('Resolved'),'✅','mint']].map(statCard).join('')}</div>${bar('a',A,0)}<div id="list" class="tw">${adminRows()}</div>`)};

function showSlide(n){currentSlide=(n+3)%3;$$('.hero-slide').forEach((el,i)=>el.classList.toggle('active',i===currentSlide));$$('.slide-dot').forEach((el,i)=>el.classList.toggle('active',i===currentSlide))}
/* ---------- router ---------- */
function nav(){const h=location.hash.split('/')[1]||'home',l=(p,t)=>`<a href="#/${p}" class="${h==p?'on':''}">${t}</a>`;
$('#nav').innerHTML=`<div class="wrap bar"><a class="logo" href="#/${user?'home':'login'}"><img src="assets/logo.svg" alt="" width="34" height="34">RoadPulse</a><button class="theme-toggle" type="button" data-act="theme" aria-label="Switch colour theme" title="Switch colour theme"><span class="theme-glyph">☾</span><span class="theme-word">Dark mode</span></button><button class="burger" data-act="burger" aria-label="Menu">☰</button><nav class="links">${user?l('home','Home'):''}${l('explore','Community reports')}${l('about','About')}${user?l('dashboard','My dashboard')+(user.role=='admin'?l('admin','Admin panel'):'')+'<a class="btn sm" href="#/report">＋ Report a hazard</a><button class="btn ghost sm" data-act="logout">Sign out</button>':'<a class="btn sm" href="#/login">Sign in</a><a class="btn ghost sm" href="#/register">Create account</a>'}</nav></div>`}
function route(){const [,p='home',a]=location.hash.split('/');
if(!user && (p==='home' || !p)){location.hash='#/login';return}
if((p=='dashboard'||p=='report')&&!user){toast('Please log in first.','err');location.hash='#/login';return}
if(p=='admin'&&(!user||user.role!='admin')){toast('Admin access is restricted to authorised accounts.','err');location.hash='#/login';return}
closeCam();listFn=null;const V={home,explore,about,login,register,dashboard,report:reportForm,view:details,admin};
$('#app').innerHTML=`<div class="view">${(V[p]||home)(a)}</div>`;nav();$('#foot').innerHTML=FOOT;setTheme(store.get('rp_theme','light'));
if(slideTimer){clearInterval(slideTimer);slideTimer=null}
if(p==='home'){currentSlide=0;showSlide(0);slideTimer=setInterval(()=>showSlide((currentSlide+1)%3),6500)}
if(lastHash!=location.hash)scrollTo(0,0);lastHash=location.hash;$$('[data-count]').forEach(count)}
const refresh=()=>listFn&&($('#list').innerHTML=listFn());


/* Live camera capture (needs https:// or http://localhost, and the browser's camera permission) */
let camM=null;
async function openCam(){
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return toast('Camera needs https:// or localhost. Use Upload instead.','err');
let st;try{st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}catch(err){return toast(err.name=='NotAllowedError'?'Camera access is blocked. Allow it from the address bar, then try again.':'No camera found. Use Upload instead.','err')}
camM=document.createElement('div');camM.className='modal';camM.innerHTML='<div class="card pad"><video autoplay playsinline muted></video><div class="row g"><button type="button" class="btn" data-act="snap">Capture photo</button><button type="button" class="btn ghost" data-act="camx">Cancel</button></div></div>';
$('video',camM).srcObject=st;camM.st=st;document.body.append(camM)}
function closeCam(){if(!camM)return;camM.st.getTracks().forEach(t=>t.stop());camM.remove();camM=null}
function snap(){const v=$('video',camM),s=Math.min(1,640/(v.videoWidth||640)),c=document.createElement('canvas');c.width=(v.videoWidth||640)*s;c.height=(v.videoHeight||480)*s;c.getContext('2d').drawImage(v,0,0,c.width,c.height);img=c.toDataURL('image/jpeg',.7);const p=$('#prev');p.src=img;p.style.display='block';closeCam();toast('Photo captured.')}

/* ---------- events ---------- */
document.addEventListener('click',async e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act;
if(a==='del'){e.preventDefault();const id=t.dataset.id,r=reports.find(x=>x.id==id);if(r&&confirm(`Delete \"${r.title}\"? This cannot be undone.`)){const {error}=await sb.from('road_reports').delete().eq('id',id);if(error)return toast(dbError(error),'err');await loadReports();toast('Report deleted.');if(location.hash.startsWith('#/view'))location.hash=user?.role==='admin'?'#/admin':'#/dashboard';else route();}}
if(a==='cam')openCam();if(a==='snap')snap();if(a==='camx')closeCam();
if(a==='burger')$('.links').classList.toggle('open');
if(a==='theme')setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
if(a==='slide')showSlide(+t.dataset.slideTo);if(a==='slide-next')showSlide(currentSlide+1);if(a==='slide-prev')showSlide(currentSlide-1);
if(a==='eye'){const i=t.previousElementSibling;i.type=i.type==='password'?'text':'password'}
if(a==='logout'){if(sb){const {error}=await sb.auth.signOut();if(error)return toast(dbError(error),'err')}currentSession=null;user=null;reports=[];conf=[];toast('You have been signed out.');location.hash='#/login';route();}
if(a==='confirm'){e.preventDefault();if(!user)return toast('Please sign in to confirm a report.','err');const id=t.dataset.id,already=conf.includes(id);let result;if(already)result=await sb.from('report_confirmations').delete().eq('report_id',id).eq('user_id',user.id);else result=await sb.from('report_confirmations').insert({report_id:id,user_id:user.id});if(result.error)return toast(dbError(result.error),'err');await loadReports();toast(already?'Your confirmation was removed.':'Thanks for confirming this report.');listFn?refresh():route();}
});
document.addEventListener('input',e=>{const m=(e.target.id||'').match(/^([fad])-(\w+)$/);if(!m)return;({f:F,a:A,d:D})[m[1]][m[2]]=e.target.value;refresh()});
document.addEventListener('change',async e=>{const t=e.target;
if(t.dataset.st){const {error}=await sb.from('road_reports').update({status:t.value,updated_at:new Date().toISOString()}).eq('id',t.dataset.st);if(error){toast(dbError(error),'err');return}await loadReports();toast('Report status updated.');route();}
if(t.id==='img'&&t.files[0]){const file=t.files[0];if(!file.type.startsWith('image/'))return toast('Please choose an image file.','err');if(file.size>5*1024*1024)return toast('Image must be 5 MB or smaller.','err');const rd=new FileReader();rd.onload=()=>{const i=new Image();i.onload=()=>{const scale=Math.min(1,1280/i.width),c=document.createElement('canvas');c.width=Math.round(i.width*scale);c.height=Math.round(i.height*scale);c.getContext('2d').drawImage(i,0,0,c.width,c.height);img=c.toDataURL('image/jpeg',.78);const preview=$('#prev');preview.src=img;preview.style.display='block'};i.src=rd.result};rd.readAsDataURL(file)}});
const say=(f,t,ok)=>{const m=$('.msg',f);m.className='msg '+(ok?'ok':'err');m.textContent=t};
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f)),n=f.dataset.form,mail=/^\S+@\S+\.\S+$/;
if(!sb)return say(f,'Supabase is not configured yet. Add your Publishable Key in supabase-config.js.');
const submitButton=$('button[type=submit],button:not([type])',f);if(submitButton){submitButton.disabled=true;submitButton.textContent='Please wait…'}
try{
if(n==='login'||n==='register'){
if(n==='register'&&(d.name||'').trim().length<2)return say(f,'Enter your full name.');
if(!mail.test(d.email||''))return say(f,'Enter a valid email address.');
if((d.password||'').length<8)return say(f,'Use a password with at least 8 characters.');
if(n==='register'&&d.password!==d.confirm)return say(f,'The passwords do not match.');
if(n==='register'){
const {data,error}=await sb.auth.signUp({email:d.email.trim(),password:d.password,options:{data:{full_name:d.name.trim()},emailRedirectTo:window.location.origin}});if(error)throw error;
if(data.session){currentSession=data.session;user=await loadProfile();await loadReports();toast('Your account is ready.');location.hash='#/dashboard'}else{say(f,'Registration successful. Check your email and confirm your address, then sign in.',true);f.reset()}
}else{
const {data,error}=await sb.auth.signInWithPassword({email:d.email.trim(),password:d.password});if(error)throw error;currentSession=data.session;user=await loadProfile();await loadReports();toast('Welcome back!');location.hash=user.role==='admin'?'#/admin':'#/dashboard';}
}
if(n==='report'){
if(!user)return say(f,'Please sign in before submitting a report.');
if((d.title||'').trim().length<5)return say(f,'Give the issue a title of at least 5 characters.');
if((d.desc||'').trim().length<15)return say(f,'Describe the issue in at least 15 characters.');
if(!(d.loc||'').trim())return say(f,'Add a location so the team can find the issue.');
let imageUrl=null;
if(img){const blob=await (await fetch(img)).blob(),path=`${user.id}/${crypto.randomUUID()}.jpg`;const {error:upErr}=await sb.storage.from('road-photos').upload(path,blob,{contentType:'image/jpeg',upsert:false});if(upErr)throw upErr;imageUrl=sb.storage.from('road-photos').getPublicUrl(path).data.publicUrl;}
const {data,error}=await sb.from('road_reports').insert({user_id:user.id,title:d.title.trim(),description:d.desc.trim(),category:d.cat,location:d.loc.trim(),severity:d.sev,status:'Reported',image_url:imageUrl}).select().single();if(error)throw error;
await loadReports();$('#rf').innerHTML=`<div class="done-card"><div class="ico">🎉</div><h2>Report submitted</h2><p class="mut" style="margin:8px 0 20px">Your report is now shared with the community and ready for review.</p><div class="row g" style="justify-content:center"><a class="btn" href="#/view/${data.id}">View report</a><a class="btn ghost" href="#/dashboard">Go to dashboard</a></div></div>`;toast('Report submitted successfully.');img='';}
}catch(err){say(f,dbError(err));}finally{if(submitButton&&document.body.contains(submitButton)){submitButton.disabled=false;submitButton.textContent=n==='register'?'Create account':n==='login'?'Log in':'Submit report'}}
});
async function boot(){if(!sb){toast('Add your Supabase Publishable Key in supabase-config.js to connect RoadPulse.','err');reports=[];route();return;}try{await refreshSession();}catch(err){console.error(err);toast('Could not connect to Supabase: '+dbError(err),'err');}if(!location.hash||location.hash==='#/'||location.hash==='#/home')location.hash=user?'#/home':'#/login';addEventListener('hashchange',route);route();sb.auth.onAuthStateChange(async(_event,session)=>{currentSession=session;if(!session){user=null;reports=[];conf=[];}else{try{user=await loadProfile();await loadReports()}catch(err){toast(dbError(err),'err')}}if(document.body){nav();if(location.hash.includes('/explore')||location.hash.includes('/dashboard')||location.hash.includes('/admin'))route();}})}
boot();
