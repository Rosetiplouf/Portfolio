// ════════════════════════════════
// STORAGE
// ════════════════════════════════
const LS={
  get(k){try{const v=localStorage.getItem('rp8_'+k);return v?JSON.parse(v):null;}catch{return null;}},
  set(k,v){try{localStorage.setItem('rp8_'+k,JSON.stringify(v));}catch{flash('⚠ Stockage plein');}
    if(API.enabled){API.scheduleSave();}}
};
const API={
  enabled:false,
  saveTimer:null,
  stateUrl:'/api/state',
  assetUrl:'/api/asset',
  async init(){
    try{const res=await fetch('/api/ping',{cache:'no-cache'});this.enabled=res.ok;}catch{this.enabled=false;}
  },
  async getState(){
    const res=await fetch(this.stateUrl,{cache:'no-cache'});
    if(!res.ok)throw new Error('Remote state unavailable');
    return res.json();
  },
  async saveState(state){
    if(!this.enabled) return;
    try{await fetch(this.stateUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});}catch(_){ }
  },
  scheduleSave(){
    if(!this.enabled) return;
    if(this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer=setTimeout(()=>this.saveState(S),500);
  },
  async uploadAsset(key,data){
    if(!this.enabled || typeof data !== 'string' || !data.startsWith('data:')) return;
    try{await fetch(this.assetUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,data})});}catch(_){ }
  }
};
const $=id=>document.getElementById(id);
const setHTML=(id,html)=>{const el=$(id); if(el) el.innerHTML=html; return el;};
const setText=(id,text)=>{const el=$(id); if(el) el.textContent=text; return el;};
const hasClass=(el,cls)=>el?.classList?.contains(cls);
const toggleClass=(el,cls,on)=>el?.classList?.toggle(cls,on);
const deepClone=obj=>obj===null||typeof obj!=='object'?obj:Array.isArray(obj)?obj.map(deepClone):{...obj,...Object.keys(obj).reduce((acc,k)=>(acc[k]=deepClone(obj[k]),acc),{})};
const IDB={
  db:null,
  open(){return new Promise(r=>{const q=indexedDB.open('rp8_imgs',1);q.onupgradeneeded=e=>e.target.result.createObjectStore('s');q.onsuccess=e=>{this.db=e.target.result;r();};q.onerror=()=>r();});},
  set(k,v){if(!this.db)return;this.db.transaction('s','readwrite').objectStore('s').put(v,k);if(API.enabled && typeof v==='string' && v.startsWith('data:'))API.uploadAsset(k,v);},
  get(k){return new Promise(r=>{if(!this.db){r(null);return;}const q=this.db.transaction('s','readonly').objectStore('s').get(k);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null);});},
  getAll(){return new Promise(r=>{if(!this.db){r({});return;}const st=this.db.transaction('s','readonly').objectStore('s');const kr=st.getAllKeys();kr.onsuccess=()=>{const ks=kr.result;if(!ks.length){r({});return;}const out={};let n=0;ks.forEach(k=>{const vr=st.get(k);vr.onsuccess=()=>{out[k]=vr.result;if(++n===ks.length)r(out);};});};kr.onerror=()=>r({});});},
  preloadImg(k){if(imgCache[k])return Promise.resolve(imgCache[k]);return this.get(k).then(d=>{if(d)imgCache[k]=d;return d;});}
};

const DEF={
  header:{title:'Rose Pagotto',logoKey:'',loaderMessages:['Chargement des données…','Activation du scanner créatif…','Préparation des visuels…','Chargement des modules artistiques…'] },
  hero:{name:'Rose Pagotto',disc:'Photographe · Vidéaste · Sculpteure · Animatrice · Organisatrice · Militante',tagline:'Des mondes différents, une seule vision.',tw:'Photographe,Vidéaste & Motion,Sculpteure,Animatrice BAFA,Organisatrice,Militante',cta:'Découvrir mon travail',en:{disc:'Photographer · Videographer · Sculptor · Facilitator · Organizer · Activist',tagline:'Different worlds, one vision.',cta:'Explore my work'}},
  about:{p1:"Je suis Rose, une créatrice pluridisciplinaire basée à Paris.",p2:"Animée par un fort engagement associatif et militant.",tags:[],en:{p1:'',p2:''}},
  tags:[{id:'t1',emoji:'📸',name:'Photo'},{id:'t2',emoji:'🎬',name:'Vidéo'},{id:'t3',emoji:'🗿',name:'Sculpture'},{id:'t4',emoji:'🎭',name:'Animation'},{id:'t5',emoji:'🎪',name:'Événements'},{id:'t6',emoji:'✊',name:'Militantisme'},{id:'t7',emoji:'🎓',name:'BAFA'},{id:'t8',emoji:'🎮',name:'Jeux vidéo'},{id:'t9',emoji:'📊',name:'Excel'}],
  skills:[{id:'sk1',name:'Photographie',pct:88,color:'#077187'},{id:'sk2',name:'Vidéo / Motion',pct:80,color:'#DB5461'},{id:'sk3',name:'Sculpture 3D',pct:72,color:'#9b74d4'},{id:'sk4',name:'Animation',pct:90,color:'#077187'},{id:'sk5',name:'Organisation',pct:85,color:'#DB5461'},{id:'sk6',name:'Excel / Data',pct:70,color:'#9b74d4'}],
  carousel:{speed:60,height:260,imageKeys:[],imageMeta:{}},
  projects:[
    {id:'p1',cat:'photo',emoji:'📸',iconKey:'',color:'#f5e6d3',title:'Série "Regards"',desc:'Portraits en milieu urbain.',location:'Paris, France',link:'',pdfKey:'',tags:[],en:{title:'"Gazes" Series',desc:'Urban portraits.'}},
    {id:'p2',cat:'video',emoji:'🎬',iconKey:'',color:'#f2d0d3',title:'Court-métrage documentaire',desc:"Sur l'engagement associatif.",location:'Bordeaux, France',link:'',pdfKey:'',tags:[],en:{title:'Short Documentary',desc:'On community activism.'}},
  ],
  timeline:[
    {id:'tl1',type:'pro',year:2024,month:0,title:'Animatrice socioculturelle & BAFA',desc:'Encadrement de jeunes.',location:'Paris',extra:'',mention:'',logoKey:'',linkedProjects:[],en:{title:'Youth Facilitator',desc:'Youth mentoring.'}},
    {id:'tl2',type:'pro',year:2023,month:0,title:'Festival des Possibles',desc:'Organisation & coordination.',location:'Lyon',extra:'',mention:'',logoKey:'',linkedProjects:[],en:{title:'Festival of Possibilities',desc:'Organization.'}},
    {id:'tl3',type:'edu',year:2023,month:6,title:'BAFA',desc:"Brevet d'Animateur.",location:'Rennes',extra:'',mention:'',logoKey:'',linkedProjects:[],en:{title:'BAFA Certificate',desc:'Youth diploma.'}},
    {id:'tl4',type:'edu',year:2021,month:0,title:'Formation photo & vidéo',desc:'Ateliers autodidactes.',location:'Paris',extra:'',mention:'',logoKey:'',linkedProjects:[],en:{title:'Photo & Video Training',desc:'Self-taught.'}},
  ],
  testimonials:[],
  contact:[
    {id:'c1',emoji:'📧',iconKey:'',label:'Email',value:'rose@pagotto.fr',href:'mailto:rose@pagotto.fr',en:{label:'Email'}},
    {id:'c2',emoji:'📍',iconKey:'',label:'Localisation',value:'Paris, France',href:'',en:{label:'Location'}},
    {id:'c3',emoji:'📸',iconKey:'',label:'Instagram',value:'@rosepagotto',href:'https://instagram.com/rosepagotto',en:{label:'Instagram'}},
  ],
  sectionOrder:['sec-home','sec-about','sec-skills','sec-carousel','sec-projects','sec-timeline','sec-testimonials','sec-contact'],
  fonts:[],activeFontIdx:-1,pendingTranslations:{},cv:null,visits:0,
};

const SEC_LABELS={
  'sec-home':{fr:'Accueil',en:'Home'},'sec-about':{fr:'À propos',en:'About'},
  'sec-skills':{fr:'Compétences',en:'Skills'},'sec-carousel':{fr:'Galerie',en:'Gallery'},
  'sec-projects':{fr:'Projets',en:'Projects'},'sec-timeline':{fr:'Parcours',en:'Journey'},
  'sec-testimonials':{fr:'Appréciations',en:'Testimonials'},'sec-contact':{fr:'Contact',en:'Contact'},
};

let S={}, imgCache={};

async function loadImageLibrary(){
  try{
    const res = await fetch('images/image-library.json',{cache:'no-cache'});
    if(!res.ok){ S.imageLibrary = []; return; }
    const list = await res.json();
    if(!Array.isArray(list)){ S.imageLibrary = []; return; }
    S.imageLibrary = list;
    S.imageLibrary.forEach(it=>{
      const filename = it.filename || (it.url||'').split('/').pop();
      const key = it.key || ('lib_'+(filename||Date.now()).replace(/[^a-z0-9_\-\.]/gi,'_'));
      const url = it.url || ('images/'+filename);
      imgCache[key] = url;
      it.key = key; it.url = url;
    });
  }catch(e){ S.imageLibrary = []; }
}

async function initState(){
  await IDB.open();
  await loadImageLibrary();
  await API.init();
  let remoteState = null;
  if(API.enabled){
    try{remoteState = await API.getState();}catch(_){remoteState = null;}
  }
  Object.keys(DEF).forEach(k=>{
    const remoteValue = remoteState?.[k];
    const localValue = LS.get(k);
    if(remoteState && remoteValue !== undefined && remoteValue !== null) S[k] = remoteValue;
    else if(localValue !== null) S[k] = localValue;
    else S[k] = deepClone(DEF[k]);
  });
  if(remoteState){Object.keys(remoteState).forEach(k=>{if(S[k]===undefined) S[k]=remoteState[k];});}
  (S.timeline||[]).forEach(t=>{if(!t.linkedProjects)t.linkedProjects=[];if(t.extra===undefined)t.extra='';if(t.mention===undefined)t.mention='';});
  S.visits=(S.visits||0)+1;LS.set('visits',S.visits);
  const criticalKeys=new Set();
  criticalKeys.add('about_avatar');
  (S.carousel.imageKeys||[]).slice(0,3).forEach(k=>criticalKeys.add(k));
  (S.projects||[]).slice(0,6).forEach(p=>{ if(p.iconKey) criticalKeys.add(p.iconKey); if(p.pdfKey) criticalKeys.add(p.pdfKey); criticalKeys.add('proj_'+p.id); });
  (S.timeline||[]).slice(0,6).forEach(t=>criticalKeys.add('tl_logo_'+t.id));
  if(S.header?.logoKey) criticalKeys.add(S.header.logoKey);
  (S.testimonials||[]).slice(0,4).forEach(t=>criticalKeys.add('testi_'+t.id));
  (async ()=>{
    try{
      await Promise.all([...criticalKeys].map(k=>IDB.get(k).then(v=>{ if(v) imgCache[k]=v; })));
      requestAnimationFrame(()=>{renderHeaderLogo();renderLoaderMain();renderAbout();renderCarouselBg();renderCarouselSection();renderProjects();renderTimeline();renderTestimonials();renderContact();});
    }catch(e){}
  })();
  renderAll();
  if(S.activeFontIdx>=0)applyFontByIdx(S.activeFontIdx);
  (async ()=>{
    try{
      const all = await IDB.getAll();
      if(all) Object.keys(all).forEach(k=>{ if(!imgCache[k] && all[k]) imgCache[k]=all[k]; });
      requestAnimationFrame(()=>{renderHeaderLogo();renderLoaderMain();renderAbout();renderCarouselBg();renderCarouselSection();renderProjects();renderTimeline();renderTestimonials();renderContact();});
    }catch(_){ }
    try{ hideLoader(); }catch(_){ }
  })();
  setTimeout(()=>{ try{ hideLoader(); }catch(_){ } },8000);
}

let dark=LS.get('dark_v8')||false;
function applyTheme(){document.body.classList.toggle('dark',dark);document.getElementById('theme-btn').textContent=dark?'☀️':'🌙';}
function toggleTheme(){dark=!dark;LS.set('dark_v8',dark);applyTheme();}
applyTheme();

let lang='fr';
function toggleLang(){
  lang=lang==='fr'?'en':'fr';
  document.getElementById('lang-btn').textContent=lang==='fr'?'EN':'FR';
  patchHero();patchAbout();patchProjects();patchTimeline();
  document.querySelectorAll('.testi-quote').forEach((el,i)=>{if(S.testimonials[i])el.textContent=tv(S.testimonials[i],'quote');});
  document.querySelectorAll('.ci-lbl').forEach((el,i)=>{if(S.contact[i])el.textContent=tv(S.contact[i],'label')+' :';});
  rebuildNav();
}
function tv(obj,field){return lang==='en'&&obj?.en?.[field]?obj.en[field]:obj?.[field]||'';}

let twI=0,twC=0,twDel=false,twT=null;
function startTW(){if(twT)clearTimeout(twT);twI=0;twC=0;twDel=false;tick();}
function tick(){
  const ws=(S.hero.tw||'').split(',').map(w=>w.trim()).filter(Boolean);if(!ws.length)return;
  const el=document.getElementById('tw');if(!el)return;const w=ws[twI%ws.length];
  if(!twDel){el.textContent=w.slice(0,++twC);if(twC===w.length){twDel=true;twT=setTimeout(tick,1400);return;}}
  else{el.textContent=w.slice(0,--twC);if(twC===0){twDel=false;twI++;twT=setTimeout(tick,300);return;}}
  twT=setTimeout(tick,twDel?38:75);
}

let _navIO=null;
let _navNavClickTimeout=null;
function rebuildNav(){
  const nav=document.getElementById('tb-nav');if(!nav)return;
  nav.innerHTML=(S.sectionOrder||[]).filter(id=>id!=='sec-home').map(id=>`<a href="#${id}" data-sec="${id}">${SEC_LABELS[id]?.[lang]||id}</a>`).join('');
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    const id=a.dataset.sec;
    if(!id) return;
    clearTimeout(_navNavClickTimeout);
    document.querySelectorAll('.tb-nav a').forEach(link=>link.classList.toggle('active',link.dataset.sec===id));
    _navNavClickTimeout=setTimeout(()=>{_navNavClickTimeout=null;},1200);
  }));
  setupNavIO();
}
function setupNavIO(){
  if(_navIO){
    if(typeof _navIO.disconnect==='function') _navIO.disconnect();
    else { window.removeEventListener('scroll',_navIO);window.removeEventListener('resize',_navIO); }
  }
  const sections=Array.from(document.querySelectorAll('.sec-slot[id]'));
  const navLinks=document.querySelectorAll('.tb-nav a');
  const updateActive=()=>{
    const viewportCenter=window.innerHeight/2;
    let best=null;
    sections.forEach(el=>{
      const rect=el.getBoundingClientRect();
      if(rect.bottom < 0 || rect.top > window.innerHeight) return;
      const centerDist=Math.abs((rect.top+rect.bottom)/2 - viewportCenter);
      if(!best || centerDist < best.dist) best={id:el.id,dist:centerDist};
    });
    if(best){
      navLinks.forEach(a=>a.classList.toggle('active',a.dataset.sec===best.id));
    }
  };
  _navIO=updateActive;
  updateActive();
  window.addEventListener('scroll',_navIO);
  window.addEventListener('resize',_navIO);
}

function applySectionOrder(){
  const pc=document.getElementById('page-content');
  (S.sectionOrder||DEF.sectionOrder).forEach(id=>{const el=document.getElementById(id);if(el)pc.appendChild(el);});
  rebuildNav();
}
function renderSectionOrderAdmin(){
  document.getElementById('sec-order-list').innerHTML=(S.sectionOrder||[]).map((id,i)=>`
    <div class="sec-ri" draggable="true" data-idx="${i}" ondragstart="dss(event)" ondragover="event.preventDefault()" ondrop="dsd(event,${i})">
      <span style="color:var(--ink2)">⠿</span><span>${SEC_LABELS[id]?.fr||id}</span>
      <span style="margin-left:auto;display:flex;gap:.3rem">
        <button class="smbtn" onclick="event.stopPropagation();moveSec(${i},-1)" ${i===0?'disabled':''}>↑</button>
        <button class="smbtn" onclick="event.stopPropagation();moveSec(${i},1)" ${i===S.sectionOrder.length-1?'disabled':''}>↓</button>
      </span>
    </div>`).join('');
}
let dsi=null;
function dss(e){dsi=+e.currentTarget.dataset.idx;}
function dsd(e,i){e.preventDefault();if(dsi===null||dsi===i)return;const a=S.sectionOrder;[a[dsi],a[i]]=[a[i],a[dsi]];dsi=null;renderSectionOrderAdmin();}
function moveSec(i,d){const a=S.sectionOrder,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];renderSectionOrderAdmin();}
function saveSectionOrder(){LS.set('sectionOrder',S.sectionOrder);applySectionOrder();flash('Ordre enregistré ✓');}
function renderSectionSettings(){
  const headerPreview=$('header-logo-preview');
  const loaderMessagesTextarea=$('loader-messages');
  const header=S.header||{};
  const preview=(src,alt)=>src?`<img src="${src}" style="max-width:120px;max-height:60px;display:block;margin:0 auto">`:alt;
  if(headerPreview) headerPreview.innerHTML = preview(imgCache[header.logoKey],'Uploader un PNG');
  if(loaderMessagesTextarea) loaderMessagesTextarea.value = (header.loaderMessages||DEF.header.loaderMessages||[]).join('\n');
}
function saveSectionSettings(){S.header ||= {};const loaderMessagesTextarea=document.getElementById('loader-messages');if(loaderMessagesTextarea){S.header.loaderMessages=loaderMessagesTextarea.value.split('\n').map(l=>l.trim()).filter(Boolean);}LS.set('header',S.header);renderHeaderLogo();flash('Paramètres du header enregistrés ✓');}
function loadHeaderLogo(e){const f=e.target.files[0];if(!f)return;storeImg(f,'header_logo',()=>{S.header ||= {};S.header.logoKey='header_logo';LS.set('header',S.header);renderHeaderLogo();renderSectionSettings();});}

function handleFontDrop(e){e.preventDefault();document.getElementById('font-dz').classList.remove('drag');const f=e.dataTransfer.files[0];if(f)loadFont(f);}
function loadFont(f){if(!f)return;const r=new FileReader();r.onload=ev=>{const b64=ev.target.result,name=f.name.replace(/\.[^.]+$/,'');if(!S.fonts)S.fonts=[];const ei=S.fonts.findIndex(fn=>fn.name===name);if(ei>=0)S.fonts[ei].data=b64;else S.fonts.push({name,data:b64});const idx=ei>=0?ei:S.fonts.length-1;LS.set('fonts',S.fonts.map(fn=>({name:fn.name})));IDB.set('font_'+name,b64);S.activeFontIdx=idx;LS.set('activeFontIdx',idx);applyFontByIdx(idx);renderFontMenu();renderFontAdmin();flash('Police "'+name+'" chargée ✓');};r.readAsDataURL(f);}
async function applyFontByIdx(idx){if(idx<0||!S.fonts?.[idx])return;const name=S.fonts[idx].name,data=S.fonts[idx].data||await IDB.get('font_'+name);if(!data)return;let st=document.getElementById('cfs');if(!st){st=document.createElement('style');st.id='cfs';document.head.appendChild(st);}st.textContent=`@font-face{font-family:'${name}';src:url('${data}');}`;document.documentElement.style.setProperty('--font',`'${name}',Georgia,serif`);}
function switchFont(idx){S.activeFontIdx=idx;LS.set('activeFontIdx',idx);if(idx===-1)document.documentElement.style.setProperty('--font',"'Georgia',serif");else applyFontByIdx(idx);renderFontMenu();renderFontAdmin();toggleFontMenu();}
function deleteFont(idx){IDB.set('font_'+S.fonts[idx].name,null);S.fonts.splice(idx,1);if(S.activeFontIdx===idx){S.activeFontIdx=-1;document.documentElement.style.setProperty('--font',"'Georgia',serif");}else if(S.activeFontIdx>idx)S.activeFontIdx--;LS.set('fonts',S.fonts.map(fn=>({name:fn.name})));LS.set('activeFontIdx',S.activeFontIdx);renderFontMenu();renderFontAdmin();}
function renderFontMenu(){const ml=document.getElementById('font-menu-list');if(!S.fonts?.length){ml.innerHTML='<div class="fm-label">Aucune police</div>';return;}ml.innerHTML='<div class="fm-label">Police</div>'+[{name:'Georgia (défaut)',idx:-1},...S.fonts.map((f,i)=>({name:f.name,idx:i}))].map(f=>`<div class="fm-item ${f.idx===S.activeFontIdx?'active':''}" onclick="switchFont(${f.idx})">${f.name}${f.idx===S.activeFontIdx?' ✓':''}</div>`).join('');}
function renderFontAdmin(){const el=document.getElementById('font-admin-list');if(!el)return;if(!S.fonts?.length){el.innerHTML='<div style="font-size:.82rem;color:var(--ink2)">Aucune police</div>';return;}el.innerHTML=S.fonts.map((f,i)=>`<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem;padding:.4rem .6rem;background:rgba(255,255,255,.4);border-radius:8px"><span style="flex:1;font-size:.85rem;${i===S.activeFontIdx?'color:var(--teal);font-weight:600':''}">${f.name}${i===S.activeFontIdx?' ✓':''}</span><button class="smbtn" onclick="switchFont(${i})">Utiliser</button><button class="smbtn del" onclick="deleteFont(${i})">✕</button></div>`).join('');}
function toggleFontMenu(){document.getElementById('font-menu').classList.toggle('open');}

document.addEventListener('click',e=>{
  if(!e.target.closest('#font-menu')) document.getElementById('font-menu').classList.remove('open');
  if(!e.target.closest('.emoji-field')) document.querySelectorAll('.emoji-picker-pop').forEach(p=>p.classList.remove('show'));
});

const EMOJIS=['✦','★','✿','✧','✶','✸','✹','❖','✱','✴','✷','✺','❂','❃','☼','☾','☀','☁','♡','♥','♦','♣','♠','♪','♫','✉','✔','✖','✈','⚑','⚐','⚡','✢','✣','✤','✥'];
const _epBuilt=new Set();
function buildEP(pickerId,inputId,onSelect){
  if(_epBuilt.has(pickerId))return;_epBuilt.add(pickerId);
  const el=document.getElementById(pickerId);if(!el)return;
  const g=document.createElement('div');g.className='emoji-grid';
  EMOJIS.forEach(em=>{const b=document.createElement('button');b.textContent=em;b.type='button';b.addEventListener('click',()=>{const inp=document.getElementById(inputId);if(inp)inp.value=em;el.classList.remove('show');if(onSelect)onSelect(em);});g.appendChild(b);});
  el.appendChild(g);
  try{
    el.addEventListener('wheel',function(e){
      e.stopPropagation();
      const canScroll = this.scrollHeight > this.clientHeight;
      const atTop = this.scrollTop === 0;
      const atBottom = Math.abs(this.scrollHeight - this.clientHeight - this.scrollTop) <= 1;
      if(!canScroll){
        e.preventDefault();
        return;
      }
      if((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)){
        e.preventDefault();
      }
    },{passive:false});
  }catch(_e){}
}
function toggleEP(pickerId){
  document.querySelectorAll('.emoji-picker-pop').forEach(p=>{if(p.id!==pickerId)p.classList.remove('show');});
  document.getElementById(pickerId)?.classList.toggle('show');
}

let cropState={key:'',ratio:0,cb:null,img:null,sx:0,sy:0,sw:0,sh:0};
let cDrag={on:false,ox:0,oy:0,osx:0,osy:0};
const OPTIMIZED_IMAGE_QUALITY=0.82;
const OPTIMIZED_IMAGE_MAX_DIM=1600;
function isRasterImageFile(file){return file && file.type && /^image\/(jpeg|jpg|png|bmp|webp|tiff|tif)$/.test(file.type.toLowerCase());}
const OPTIMIZED_IMAGE_OUTPUT_TYPE=(()=>{const canvas=document.createElement('canvas');const types=['image/avif','image/webp'];
  for(const type of types){try{const data=canvas.toDataURL(type);if(data.indexOf('data:' + type)===0) return type;}catch(_){} }
  return 'image/jpeg';
})();
function optimizeImageFile(file){return new Promise((resolve,reject)=>{
  if(!file) return reject(new Error('No file'));
  if(!isRasterImageFile(file)){
    const reader=new FileReader();reader.onload=ev=>resolve(ev.target.result);reader.onerror=reject;reader.readAsDataURL(file);return;
  }
  const reader=new FileReader();reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const maxDim=OPTIMIZED_IMAGE_MAX_DIM;
      let w=img.width,h=img.height;
      if(maxDim && (w>maxDim || h>maxDim)){
        const ratio=w/h;
        if(w>h){w=maxDim;h=Math.round(maxDim/ratio);} else {h=maxDim;w=Math.round(maxDim*ratio);}  
      }
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
      try{
        const data=canvas.toDataURL(OPTIMIZED_IMAGE_OUTPUT_TYPE,OPTIMIZED_IMAGE_QUALITY);
        resolve(data);
      }catch(_){
        resolve(canvas.toDataURL('image/jpeg',OPTIMIZED_IMAGE_QUALITY));
      }
    };
    img.onerror=()=>reject(new Error('Image load failed'));
    img.src=ev.target.result;
  };
  reader.onerror=reject;
  reader.readAsDataURL(file);
});}
function storeImg(file,key,cb){if(!file)return;optimizeImageFile(file).then(data=>{imgCache[key]=data;IDB.set(key,data);if(cb)cb();}).catch(()=>{const r=new FileReader();r.onload=ev=>{imgCache[key]=ev.target.result;IDB.set(key,ev.target.result);if(cb)cb();};r.readAsDataURL(file);});}
function openCropForKey(key,cb){const d=imgCache[key];if(!d){flash('Aucune image');return;}cropState.key=key;cropState.cb=cb;const img=new Image();img.onload=()=>{cropState.img=img;const cnv=document.getElementById('crop-canvas'),cont=document.getElementById('crop-container'),mw=Math.min(500,window.innerWidth-120),sc=mw/img.width;cnv.width=img.width;cnv.height=img.height;cnv.style.width=Math.round(img.width*sc)+'px';cnv.style.height=Math.round(img.height*sc)+'px';cont.style.height=Math.round(img.height*sc)+'px';cnv.getContext('2d').drawImage(img,0,0);cropState.sx=0;cropState.sy=0;cropState.sw=img.width;cropState.sh=img.height;cropState.ratio=0;document.querySelectorAll('#crop-ratios .crb').forEach((b,i)=>b.classList.toggle('on',i===0));updateCropRect();document.getElementById('crop-panel').classList.add('show');};img.src=d;}
function updateCropRect(){const c=document.getElementById('crop-canvas'),r=document.getElementById('crop-rect');r.style.left=Math.round(cropState.sx*(c.offsetWidth/c.width))+'px';r.style.top=Math.round(cropState.sy*(c.offsetHeight/c.height))+'px';r.style.width=Math.round(cropState.sw*(c.offsetWidth/c.width))+'px';r.style.height=Math.round(cropState.sh*(c.offsetHeight/c.height))+'px';}
function setCropRatio(ratio,btn){cropState.ratio=ratio;document.querySelectorAll('#crop-ratios .crb').forEach(b=>b.classList.remove('on'));btn.classList.add('on');if(ratio>0&&cropState.img){let w=cropState.img.width,h=w/ratio;if(h>cropState.img.height){h=cropState.img.height;w=h*ratio;}cropState.sx=Math.round((cropState.img.width-w)/2);cropState.sy=Math.round((cropState.img.height-h)/2);cropState.sw=Math.round(w);cropState.sh=Math.round(h);updateCropRect();}}
document.getElementById('crop-rect').addEventListener('mousedown',e=>{cDrag={on:true,ox:e.clientX,oy:e.clientY,osx:cropState.sx,osy:cropState.sy};e.preventDefault();});
document.addEventListener('mousemove',e=>{if(!cDrag.on)return;const c=document.getElementById('crop-canvas'),dx=(e.clientX-cDrag.ox)/(c.offsetWidth/c.width),dy=(e.clientY-cDrag.oy)/(c.offsetHeight/c.height);cropState.sx=Math.max(0,Math.min(cropState.img.width-cropState.sw,Math.round(cDrag.osx+dx)));cropState.sy=Math.max(0,Math.min(cropState.img.height-cropState.sh,Math.round(cDrag.osy+dy)));updateCropRect();});
document.addEventListener('mouseup',()=>{cDrag.on=false;});
function applyCrop(){const{img,sx,sy,sw,sh,key,cb}=cropState;const out=document.createElement('canvas');out.width=sw;out.height=sh;out.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,sw,sh);imgCache[key]=out.toDataURL('image/jpeg',.92);IDB.set(key,imgCache[key]);document.getElementById('crop-panel').classList.remove('show');if(cb)cb();flash('Image recadrée ✓');}
function cancelCrop(){document.getElementById('crop-panel').classList.remove('show');}

function renderStats(){
  setHTML('stats-grid',
    `<div class="stat-card"><div class="stat-num">${S.visits||0}</div><div class="stat-lbl">Visites</div></div>`+
    `<div class="stat-card"><div class="stat-num">${(S.projects||[]).length}</div><div class="stat-lbl">Projets</div></div>`+
    `<div class="stat-card"><div class="stat-num">${(S.timeline||[]).length}</div><div class="stat-lbl">Étapes</div></div>`+
    `<div class="stat-card"><div class="stat-num">${(S.testimonials||[]).length}</div><div class="stat-lbl">Appréciations</div></div>`
  );
}
function resetVisits(){S.visits=0;LS.set('visits',0);renderStats();}
function loadCV(f){if(!f)return;const r=new FileReader();r.onload=ev=>{S.cv=ev.target.result;LS.set('cv',S.cv);document.getElementById('cv-status').textContent='✓ CV chargé';document.getElementById('cv-preview-wrap').style.display='block';renderCVBtn();flash('CV chargé ✓');};r.readAsDataURL(f);}
function deleteCV(){S.cv=null;LS.set('cv',null);document.getElementById('cv-status').textContent='Cliquer pour uploader';document.getElementById('cv-preview-wrap').style.display='none';renderCVBtn();}
function renderCVBtn(){const b=document.getElementById('cv-nav-btn');if(b)b.style.display=S.cv?'inline-block':'none';}
function openPDFViewer(src,title){document.getElementById('pdf-title-bar').textContent=title||'';document.getElementById('pdf-frame').src=src;document.getElementById('pdf-dl-btn').href=src;document.getElementById('pdf-dl-btn').download=(title||'cv')+'.pdf';document.getElementById('pdf-modal').classList.add('show');}
function closePDF(){document.getElementById('pdf-modal').classList.remove('show');setTimeout(()=>document.getElementById('pdf-frame').src='',300);}

function openLB(src,title,desc,link,key){
  document.getElementById('lb-img').src=src;
  document.getElementById('lb-title').textContent=title||'';
  const meta=(S.carousel.imageMeta||{})[key]||{};
  const tagHtml=(meta.tags||[]).map(id=>{const tg=(S.tags||[]).find(x=>x.id===id);return tg?`<span class="tl-popup-badge" style="border-color:var(--border);color:var(--ink2);background:var(--cream)">${tg.emoji} ${tg.name}</span>`:'';}).join('');
  const linkedHtml=(meta.linkedProjects||[]).map(pid=>{const p=(S.projects||[]).find(x=>x.id===pid);return p?`<button class="proj-badge" onclick="closeLB();setTimeout(()=>document.getElementById('sec-projects').scrollIntoView({behavior:'smooth'}),200)"><span>${p.emoji}</span>${tv(p,'title')}</button>`:'';}).join('');
  document.getElementById('lb-desc').innerHTML=`${desc||''}${tagHtml?`<div style="margin-top:1rem;display:flex;flex-wrap:wrap;gap:.45rem">${tagHtml}</div>`:''}${linkedHtml?`<div style="margin-top:1rem">${linkedHtml}</div>`:''}`;
  const la=document.getElementById('lb-link');if(link){la.href=link;la.style.display='inline-block';}else la.style.display='none';
  document.getElementById('lb-modal').classList.add('show');
}
function closeLB(){document.getElementById('lb-modal').classList.remove('show');}
document.getElementById('lb-modal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeLB();});
document.getElementById('pdf-modal').addEventListener('click',e=>{if(e.target===e.currentTarget)closePDF();});

let _shareActs=[];
function shareProject(title,link){
  const url=link||window.location.href;
  document.getElementById('share-title').textContent='Partager — '+title;
  _shareActs=[
    {icon:'🔗',label:'Copier le lien',fn:()=>{navigator.clipboard.writeText(url).then(()=>flash('Lien copié ✓'));closeShare();}},
    {icon:'📧',label:'Email',fn:()=>{window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`);closeShare();}},
    {icon:'💬',label:'WhatsApp',fn:()=>{window.open(`https://wa.me/?text=${encodeURIComponent(title+' — '+url)}`);closeShare();}},
    {icon:'🐦',label:'X / Twitter',fn:()=>{window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);closeShare();}},
    {icon:'💼',label:'LinkedIn',fn:()=>{window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);closeShare();}},
  ];
  document.getElementById('share-opts').innerHTML=_shareActs.map((_,i)=>`<button class="share-opt" onclick="_shareActs[${i}].fn()"><span>${_shareActs[i].icon}</span><span>${_shareActs[i].label}</span></button>`).join('');
  document.getElementById('share-menu').classList.add('show');document.getElementById('share-bd').classList.add('show');
}
function closeShare(){document.getElementById('share-menu').classList.remove('show');document.getElementById('share-bd').classList.remove('show');}

function openTLPopup(id){
  const t=(S.timeline||[]).find(x=>x.id===id);if(!t)return;
  const col=t.type==='pro'?'var(--teal)':'var(--red)';
  const logo=imgCache['tl_logo_'+t.id];
  const dates=formatTLDateLabel(t);
  const linkedP=(t.linkedProjects||[]).map(pid=>{const p=(S.projects||[]).find(x=>x.id===pid);return p?`<button class="proj-badge" onclick="closeTLPopup();setTimeout(()=>document.getElementById('sec-projects').scrollIntoView({behavior:'smooth'}),200)"><span>${p.emoji}</span>${tv(p,'title')}</button>`:'';}).join('');
  const skills=(t.linkedSkills||[]).map(id=>{const s=(S.skills||[]).find(x=>x.id===id);return s?`<span class="tl-popup-badge" style="border-color:${s.color};color:${s.color}">${s.name}</span>`:'';}).join('');
  const place=tv(t,'location')||t.location||'';
  const tags=(t.tags||[]).map(id=>{const tag=(S.tags||[]).find(x=>x.id===id);return tag?`<span class="tl-popup-badge" style="border-color:var(--border);color:var(--ink2);background:var(--cream)">${tag.emoji} ${tag.name}</span>`:'';}).join('');
  document.getElementById('tl-popup-content').innerHTML=`
    <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.2rem;flex-wrap:wrap">
      ${logo?`<img src="${logo}" class="tl-popup-logo">`:''}
      <div style="flex:1;min-width:180px">
        <div style="font-size:.8rem;font-family:monospace;color:${col};letter-spacing:.12em;margin-bottom:.5rem">${dates}</div>
        <div style="font-size:1.35rem;font-weight:700;line-height:1.15;">${tv(t,'title')}</div>
        ${place?`<div style="font-size:.9rem;color:var(--ink2);margin-top:.5rem">${place}</div>`:''}
      </div>
      <span style="margin-left:auto;font-size:.8rem;padding:.45rem .9rem;border-radius:14px;background:${col}18;color:${col};font-weight:600;white-space:nowrap">${t.type==='pro'?(lang==='fr'?'PRO':'PROFESSIONAL'):(lang==='fr'?'ÉTUDES':'EDUCATION')}</span>
    </div>
    <div style="font-size:.88rem;line-height:1.75;color:var(--ink2);margin-bottom:1.2rem">${tv(t,'desc')}</div>
    ${place||t.mention||skills||tags||linkedP?`<div class="tl-popup-details show">
      ${place?`<div><h4>${lang==='fr'?'Lieu / structure':'Place / organization'}</h4><p>${place}</p></div>`:''}
      ${t.mention?`<div><h4>${lang==='fr'?'Mention / distinction':'Mention / distinction'}</h4><p>${t.mention}</p></div>`:''}
      ${skills?`<div><h4>${lang==='fr'?'Compétences':'Skills'}</h4><div style="display:flex;flex-wrap:wrap;gap:.45rem">${skills}</div></div>`:''}
      ${tags?`<div><h4>${lang==='fr'?'Tags':'Tags'}</h4><div style="display:flex;flex-wrap:wrap;gap:.45rem">${tags}</div></div>`:''}
      ${linkedP?`<div><h4>${lang==='fr'?'Projets liés':'Related projects'}</h4><div style="display:flex;flex-wrap:wrap;gap:.5rem">${linkedP}</div></div>`:''}
    </div>`:''}
  `;
  document.getElementById('tl-popup').classList.add('show');
}
function toggleTLDetails(id){const details=document.getElementById(`tl-popup-details-${id}`);const btn=document.getElementById(`tl-popup-more-${id}`);if(!details||!btn)return;const show=details.classList.toggle('show');btn.textContent=show?(lang==='fr'?'Voir moins':'See less'):(lang==='fr'?'Voir plus':'See more');}
function closeTLPopup(){document.getElementById('tl-popup').classList.remove('show');}
document.getElementById('tl-popup').addEventListener('click',e=>{if(e.target===e.currentTarget)closeTLPopup();});

function showSkillProjects(skillId){
  const s=(S.skills||[]).find(x=>x.id===skillId);if(!s)return;
  currentSkillPopupId=skillId;
  const projects=(S.projects||[]).filter(p=> (p.linkedSkills||[]).includes(skillId));
  const timelines=(S.timeline||[]).filter(t=> (t.linkedSkills||[]).includes(skillId));
  const projHtml=projects.length?projects.map(p=>{const img=imgCache['proj_'+p.id];return `<div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem"><div style="width:56px;height:56px;border-radius:8px;overflow:hidden;background:${p.color};display:flex;align-items:center;justify-content:center">${img?`<img src="${img}" style="width:100%;height:100%;object-fit:cover">`:`${p.emoji||'✦'}`}</div><div style="flex:1"><div style="font-weight:700">${tv(p,'title')}</div><div style="font-size:.88rem;color:var(--ink2)">${tv(p,'desc')}</div></div><div><button class="smbtn" onclick="closeSkillPopup();setTimeout(()=>{document.getElementById('sec-projects').scrollIntoView({behavior:'smooth'});},220)">Voir</button></div></div>`;}).join(''):`<div style="color:var(--ink2);font-size:.92rem">${lang==='fr'?'Aucun projet lié à cette compétence pour l’instant.':'No projects linked to this skill yet.'}</div>`;
  const tlHtml=timelines.length?timelines.map(t=>{const logo=imgCache['tl_logo_'+t.id];const dates=formatTLDateLabel(t);return `<div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem"><div style="width:56px;height:56px;border-radius:8px;overflow:hidden;background:${t.type==='pro'?'var(--teal)':'var(--red)'};display:flex;align-items:center;justify-content:center">${logo?`<img src="${logo}" style="width:100%;height:100%;object-fit:cover">`:'✦'}</div><div style="flex:1"><div style="font-weight:700">${tv(t,'title')}</div><div style="font-size:.82rem;color:var(--ink2)">${dates}</div></div><div><button class="smbtn" onclick="closeSkillPopup();setTimeout(()=>{openTLPopup('${t.id}');},220)">Voir</button></div></div>`;}).join(''):`<div style="color:var(--ink2);font-size:.92rem">${lang==='fr'?'Aucune étape liée à cette compétence pour l’instant.':'No timeline entries linked to this skill yet.'}</div>`;
  const combined=`<div style="display:flex;align-items:center;gap:.8rem;margin-bottom:1rem"><div style="width:42px;height:42px;border-radius:10px;background:${s.color};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${s.name[0]||'S'}</div><div style="font-size:1.05rem;font-weight:700">${s.name}</div></div><div style="margin-bottom:.6rem"><strong>${lang==='fr'?'Projets liés':'Related projects'}</strong><div style="margin-top:.5rem">${projHtml}</div></div><div><strong>${lang==='fr'?'Parcours liés':'Related timeline'}</strong><div style="margin-top:.5rem">${tlHtml}</div></div>`;
  document.getElementById('skill-popup-content').innerHTML=combined;
  document.getElementById('skill-popup').classList.add('show');
}
function closeSkillPopup(){document.getElementById('skill-popup').classList.remove('show');currentSkillPopupId=null;}
document.getElementById('skill-popup').addEventListener('click',e=>{if(e.target===e.currentTarget)closeSkillPopup();});

function renderAll(){
  applySectionOrder();
    renderHeaderLogo();renderLoaderMain();renderHero();renderAbout();renderCarouselBg();renderSkills();renderCarouselSection();renderProjects();renderTimeline();renderTestimonials();renderContact();renderAdminImageLibrary();renderCVBtn();
  obs();startCarousels();
  document.getElementById('fy').textContent=new Date().getFullYear();
}

function patchHero(){document.getElementById('h-desc').innerHTML=tv(S.hero,'disc')+'<br><span style="color:var(--ink2);font-style:italic">'+tv(S.hero,'tagline')+'</span>';document.getElementById('h-cta').textContent=tv(S.hero,'cta');}
function patchAbout(){document.getElementById('ab-p1').textContent=tv(S.about,'p1');document.getElementById('ab-p2').textContent=tv(S.about,'p2');}
function patchProjects(){document.querySelectorAll('.proj-card').forEach((el,idx)=>{const list=activeF==='all'?S.projects:(S.projects||[]).filter(p=>{if(isSkillFilter(activeF)) return (p.linkedSkills||[]).includes(activeF);return p.cat===activeF||(p.tags||[]).includes(activeF);});const p=list[idx];if(!p)return;const ne=el.querySelector('.proj-name'),de=el.querySelector('.proj-desc');if(ne)ne.textContent=tv(p,'title');if(de)de.textContent=tv(p,'desc');});}
function patchTimeline(){renderTimeline();}

function renderHeaderLogo(){
  const logoContainer=$('tb-logo');
  if(!logoContainer) return;
  const header=S.header||{};
  const d=imgCache[header.logoKey];
  logoContainer.innerHTML = d?`<img src="${d}" alt="Logo header">`:'';
  updateFavicon(d);
}
function updateFavicon(src){
  let link=document.getElementById('favicon-link');
  if(!link){
    link=document.createElement('link');
    link.id='favicon-link';
    link.rel='icon';
    document.head.appendChild(link);
  }
  if(src){
    link.href=src;
    link.type='image/png';
  } else {
    link.href='';
  }
}
function renderLoaderMain(){
  const spinner=document.querySelector('.spinner');
  if(spinner) spinner.style.display='block';
}
function renderHero(){
  const h=S.hero,p=h.name.trim().split(' ');
  document.getElementById('h-name').innerHTML=p.slice(0,-1).join(' ')+' <em>'+p.slice(-1)+'</em>';
  document.getElementById('h-desc').innerHTML=tv(h,'disc')+'<br><span style="color:var(--ink2);font-style:italic">'+tv(h,'tagline')+'</span>';
  document.getElementById('h-cta').textContent=tv(h,'cta');
  startTW();
}
function renderAbout(){
  setText('ab-p1',tv(S.about,'p1'));
  setText('ab-p2',tv(S.about,'p2'));
  const img=$('about-img');
  const ph=$('about-ph');
  const d=imgCache['about_avatar'];
  if(d){if(img){img.src=d;img.style.display='block';} if(ph) ph.style.display='none';}
  else{if(img) img.style.display='none'; if(ph) ph.style.display='flex';}
  setHTML('ab-tags',(S.about.tags||[]).map(id=>{const tag=(S.tags||[]).find(x=>x.id===id);return tag?`<span class="tag-pill">${tag.emoji} ${tag.name}</span>`:'';}).join(''));
}
function renderSkills(){
  const R=36,C=2*Math.PI*R;
  document.getElementById('sk-el').innerHTML=(S.skills||[]).map(s=>{const off=C-(s.pct/100)*C;const initial=skillsAnimated?off:C;return`<div class="card sk-card ap${activeF===s.id?' on':''}" onclick="setSkillFilter('${s.id}')"><div class="ring"><svg width="84" height="84" viewBox="0 0 84 84"><circle class="trk" cx="42" cy="42" r="${R}"/><circle class="fill" cx="42" cy="42" r="${R}" stroke="${s.color}" stroke-dasharray="${C}" stroke-dashoffset="${initial}" data-off="${off}"/></svg><span class="ring-pct">${s.pct}%</span></div><div class="sk-lbl">${s.name}</div></div>`;}).join('');
  if(!skillsAnimated){
    setTimeout(()=>{document.querySelectorAll('.ring .fill').forEach(f=>f.style.strokeDashoffset=f.dataset.off);skillsAnimated=true;},300);
  }
  if(typeof obs==='function') setTimeout(()=>obs(),60);
}

let carA={bg:null,sec:null};
function carImgs(){return(S.carousel.imageKeys||[]).map(k=>({data:imgCache[k],key:k})).filter(x=>x.data);}
function renderCarouselBg(){const imgs=carImgs(),t=document.getElementById('car-track-bg');t.innerHTML=imgs.length?[...imgs,...imgs].map(x=>`<img src="${x.data}" alt="">`).join(''):'';}
function renderCarouselSection(){
  const h=S.carousel.height||260,imgs=carImgs(),t=document.getElementById('car-track-sec');
  if(!imgs.length){t.innerHTML=`<div style="height:${h}px;min-width:220px;display:flex;align-items:center;justify-content:center;color:var(--ink2);font-size:.82rem;border:1.5px dashed var(--border);border-radius:12px;padding:1rem">Ajoutez des images dans l'admin ✦</div>`;return;}
  const meta=S.carousel.imageMeta||{};
  t.innerHTML=[...imgs,...imgs].map(x=>{const m=meta[x.key]||{},esc=s=>(s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');return`<img src="${x.data}" style="height:${h}px;width:auto;border-radius:12px;object-fit:cover;flex-shrink:0" alt="${esc(m.title)}" onclick="openLB('${x.data}','${esc(m.title)}','${esc(m.desc)}','${esc(m.link)}','${x.key}')">`;}).join('');
  startCarousels();
}
function startCarousels(){
  ['bg','sec'].forEach(type=>{
    if(carA[type])cancelAnimationFrame(carA[type]);
    const t=document.getElementById(type==='bg'?'car-track-bg':'car-track-sec');
    if(!t||!t.children.length)return;
    let pos=0,last=null;const speed=S.carousel.speed||60;
    function step(ts){if(last===null)last=ts;const dt=(ts-last)/1e3;last=ts;pos+=speed*dt;const half=t.scrollWidth/2;if(half>0&&pos>=half)pos-=half;t.style.transform=`translateX(-${pos}px)`;carA[type]=requestAnimationFrame(step);}
    carA[type]=requestAnimationFrame(step);
  });
}
function addCarImages(files){
  const arr=Array.from(files);let done=0;
  const fill=document.getElementById('upload-fill'),bar=fill?.parentElement;
  if(bar)bar.style.display='block';
  function next(i){
    if(i>=arr.length){if(bar)bar.style.display='none';renderCarouselSection();renderCarouselBg();renderAdminCarousel();return;}
    const r=new FileReader();
    r.onload=ev=>{const key='car_'+Date.now()+'_'+Math.random().toString(36).slice(2);imgCache[key]=ev.target.result;IDB.set(key,ev.target.result);S.carousel.imageKeys.push(key);LS.set('carousel',S.carousel);done++;if(fill)fill.style.width=Math.round(done/arr.length*100)+'%';next(i+1);};r.readAsDataURL(arr[i]);
  }
  next(0);
}

const MONTHS_FR=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
function formatMonthYear(year,month){
  if(!year)return'';
  if(month){const months=lang==='fr'?MONTHS_FR:MONTHS_EN;return `${months[month-1]||''} ${year}`;}
  return String(year);
}
function formatTLDateLabel(t){
  const startYear=t.startYear||t.year||0;
  const startMonth=t.startMonth||t.month||0;
  const start=formatMonthYear(startYear,startMonth);
  const endYear=t.endYear||0;
  const endMonth=t.endMonth||0;
  if(endYear && (endYear!==startYear || endMonth!==startMonth)){
    return `${lang==='fr'?'De':'From'} ${start} ${lang==='fr'?'à':'to'} ${formatMonthYear(endYear,endMonth)}`;
  }
  return start;
}
function tlStartVal(t){return (t.startYear||t.year||0)*12+((t.startMonth||t.month||0));}
function isSkillFilter(f){return (S.skills||[]).some(s=>s.id===f);}
function renderTimeline(){
  const all=S.timeline||[];
  const visible=all;
  if(!visible.length){document.getElementById('tl-container').style.height='160px';document.getElementById('tl-cards').innerHTML='';return;}
  function tlStartValSafe(t){return (t.startYear||t.year||0)*12 + (t.startMonth||t.month||0);} 
  function tlEndValSafe(t){const ey=(t.endYear!==undefined&&t.endYear)?t.endYear:(t.startYear||t.year||0);const em=(t.endMonth!==undefined&&t.endMonth)?t.endMonth:(t.startMonth||t.month||0);return ey*12 + em;}
  const startVals=visible.map(t=>tlStartValSafe(t));
  const endVals=visible.map(t=>tlEndValSafe(t));
  let minV=Math.min(...startVals), maxV=Math.max(...endVals);
  maxV = maxV + 6;
  const range = Math.max(maxV-minV,6);
  const PL=50,PR=100; const LP=120,LE=280; const TH=LE+90;
  const pixelsPerMonth = Math.max(6, Math.floor((900-PL-PR)/Math.max(range,12)));
  const totalW = Math.max(900, PL+PR+Math.round(range*pixelsPerMonth));
  function xOf(t){return PL+Math.round(((tlStartValSafe(t)-minV)/range)*(totalW-PL-PR));}
  const minYr=Math.floor(minV/12), maxYr=Math.ceil(maxV/12);
  const svg=document.getElementById('tl-svg');
  svg.setAttribute('width',totalW);svg.setAttribute('height',TH);svg.setAttribute('viewBox',`0 0 ${totalW} ${TH}`);
  let h='';
  for(let y=minYr;y<=maxYr;y++){
    const xv=PL+Math.round(((y*12-minV)/range)*(totalW-PL-PR));
    h+=`<line x1="${xv}" y1="${LP-100}" x2="${xv}" y2="${LE+100}" stroke="var(--border)" stroke-width="1" stroke-dasharray="4 4"/>`;
    h+=`<text x="${xv}" y="${(LP+LE)/2+5}" text-anchor="middle" font-size="12" fill="var(--ink2)" font-family="monospace">${y}</text>`;
  }
  h+=`<line x1="${PL}" y1="${LP}" x2="${totalW-PR}" y2="${LP}" stroke="var(--teal)" stroke-width="2.5"/>`;
  h+=`<line x1="${PL}" y1="${LE}" x2="${totalW-PR}" y2="${LE}" stroke="var(--red)" stroke-width="2.5"/>`;
  h+=`<line x1="${PL-60}" y1="${LP}" x2="${PL}" y2="${LP}" class="tl-dash" stroke="var(--teal)" stroke-width="1.5"/>`;
  h+=`<line x1="${totalW-PR}" y1="${LP}" x2="${totalW-PR+60}" y2="${LP}" class="tl-dash" stroke="var(--teal)" stroke-width="1.5"/>`;
  h+=`<line x1="${PL-60}" y1="${LE}" x2="${PL}" y2="${LE}" class="tl-dash" stroke="var(--red)" stroke-width="1.5"/>`;
  h+=`<line x1="${totalW-PR}" y1="${LE}" x2="${totalW-PR+60}" y2="${LE}" class="tl-dash" stroke="var(--red)" stroke-width="1.5"/>`;
  h+=`<text x="${PL}" y="${LP+62}" font-size="10" fill="var(--teal)" font-weight="600" letter-spacing="1.5">${lang==='fr'?'EXPÉRIENCES PRO':'PROFESSIONAL'}</text>`;
  h+=`<text x="${PL}" y="${LE-62}" font-size="10" fill="var(--red)" font-weight="600" letter-spacing="1.5">${lang==='fr'?'ÉTUDES & DIPLÔMES':'EDUCATION'}</text>`;
  const posCounts={};
  const offsets={};
  visible.forEach(t=>{
    const x=xOf(t);
    const key=Math.round(x)+(t.type==='pro'?'_pro':'_edu');
    const idx=(posCounts[key]||0)+1; posCounts[key]=idx;
    let offset=0;
    if(idx===1) offset=0; else { 
      const n=Math.ceil((idx-1)/2); 
      if(t.type==='pro'){
        offset = (idx%2===0? -1: 1) * n * 56;
      } else {
        offset = (idx%2===0? 1: -1) * n * 56;
      }
    }
    offsets[t.id]=offset;
  });
  visible.forEach(t=>{
    const x=xOf(t),ly=t.type==='pro'?LP:LE,col=t.type==='pro'?'var(--teal)':'var(--red)';
    h+=`<circle cx="${x}" cy="${ly}" r="7" fill="${col}" stroke="var(--cream)" stroke-width="3"/>`;
  });
  svg.innerHTML=h;
  document.getElementById('tl-cards').innerHTML=visible.map(t=>{
    const x=xOf(t),ly=t.type==='pro'?LP:LE,col=t.type==='pro'?'var(--teal)':'var(--red)';
    const logo=imgCache['tl_logo_'+t.id];
    const offset=offsets[t.id]||0;
    const top=ly+offset-23;
    return`<div class="tl-card tl-node${isSkillFilter(activeF)&&((t.linkedSkills||[]).includes(activeF))?' active':''}" style="left:${x}px;top:${top}px;transform:translateX(-50%);border:2px solid ${col};" onclick="openTLPopup('${t.id}')" title="${tv(t,'title')}">${logo?`<img class="tl-card-logo" src="${logo}" alt="">`:`<div class="tl-card-logo-ph">✦</div>`}</div>`;
  }).join('');
  document.getElementById('tl-container').style.height=TH+'px';
}

function renderTestimonials(){
  const el=document.getElementById('testi-el');
  if(!el) return;
  if(!(S.testimonials||[]).length){el.innerHTML='<p style="color:var(--ink2);font-size:.9rem;font-style:italic">Aucune appréciation pour l\'instant.</p>';if(typeof obs==='function') setTimeout(()=>obs(),60);return;}
  el.innerHTML=S.testimonials.map(t=>{const av=imgCache['testi_'+t.id];return`<div class="card testimonial-card ap"><div class="testi-quote">${tv(t,'quote')||''}</div><div class="testi-author"><div class="testi-avatar">${av?`<img src="${av}">`:(t.initials||'?')}</div><div><div class="testi-name">${t.name||''}</div><div class="testi-role">${t.role||''}</div></div></div></div>`;}).join('');
  if(typeof obs==='function') setTimeout(()=>obs(),60);
}

let activeF='all';
let currentSkillPopupId=null;
let skillsAnimated=false;
let loaderDotsInterval=null;
let loaderDotIndex=0;
function renderProjects(){
  const tagMap=Object.fromEntries((S.tags||[]).map(t=>[t.id,t]));
  const cats=['all',...new Set((S.projects||[]).map(p=>p.cat).filter(Boolean))];
  document.getElementById('f-bar').innerHTML=cats.map(c=>`<button class="fb ${c===activeF?'on':''}" onclick="setF('${c}')">${c==='all'?(lang==='fr'?'Tout':'All'):c}</button>`).join('');
  const list=(activeF==='all'?S.projects:(S.projects||[]).filter(p=>{
    if(isSkillFilter(activeF)) return (p.linkedSkills||[]).includes(activeF);
    return p.cat===activeF||(p.tags||[]).includes(activeF);
  }));
  document.getElementById('proj-el').innerHTML=(list||[]).map(p=>{
    const img=imgCache['proj_'+p.id],icon=p.iconKey?imgCache[p.iconKey]:null,hasPDF=p.pdfKey&&imgCache[p.pdfKey];
    const esc=s=>(s||'').replace(/'/g,"\\'");
    return`<div class="card proj-card ap">
      <div class="proj-thumb" style="background:${p.color}">${img?`<img class="cover" src="${img}">`:''}${(icon||!img)?`<span class="pe">${icon?`<img src="${icon}" style="width:2.5rem;height:2.5rem;object-fit:contain">`:(p.emoji||'')}</span>`:''}</div>
      <div class="proj-body"><div class="proj-cat">${p.cat}${p.location?` · ${p.location}`:''}</div><div class="proj-name">${tv(p,'title')}</div><div class="proj-desc">${tv(p,'desc')}</div>
      ${(p.tags||[]).length?`<div class="proj-tags">${p.tags.map(id=>tagMap[id]?`<span class="proj-tag">${tagMap[id].emoji} ${tagMap[id].name}</span>`:'').join('')}</div>`:''}
      <div class="proj-actions">
        ${p.link?`<button class="pab" onclick="window.open('${esc(p.link)}','_blank')">↗ Lien</button>`:''}
        ${hasPDF?`<button class="pab" onclick="openPDFViewer(imgCache['${p.pdfKey}'],'${esc(tv(p,'title'))}')">📄 PDF</button>`:''}
        <button class="pab" onclick="shareProject('${esc(tv(p,'title'))}','${esc(p.link||'')}')">↗ Partager</button>
      </div></div></div>`;
  }).join('');
  obs();
}
function setF(c){activeF=c;renderProjects();renderTimeline();renderSkills();}
function setSkillFilter(id){
  activeF=activeF===id?'all':id;
  renderProjects();renderTimeline();renderSkills();
  if(activeF!=='all'&&isSkillFilter(activeF)){showSkillProjects(activeF);}else{closeSkillPopup();}
}

function renderContact(){
  const items=(S.contact||[]).map(c=>{
    const icon=c.iconKey?imgCache[c.iconKey]:null;
    const value=c.href?`<a href="${c.href}">${c.value}</a>`:`<span class="ci-value">${c.value}</span>`;
    return `<div class="ci"><div class="ci-icon">${icon?`<img src="${icon}" alt="">`:(c.emoji||'✦')}</div><div class="ci-meta"><span class="ci-lbl">${tv(c,'label')}</span>${value}</div></div>`;
  }).join('');
  setHTML('ct-el',`<div class="contact-grid">${items}</div>`);
}
function obs(){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target);}}),{threshold:.1});document.querySelectorAll('.ap:not(.vis)').forEach(el=>io.observe(el));}

const PASS='0000';let adminTime=null;const SESSION=5*60*1e3;
function openAdmin(){if(adminTime&&(Date.now()-adminTime)<SESSION){showAdmin();return;}document.getElementById('pwd').value='';document.getElementById('pwd-err').textContent='';document.getElementById('login-ov').classList.add('show');setTimeout(()=>document.getElementById('pwd').focus(),80);}
function tryLogin(){if(document.getElementById('pwd').value===PASS){document.getElementById('login-ov').classList.remove('show');adminTime=Date.now();showAdmin();}else document.getElementById('pwd-err').textContent='Mot de passe incorrect';}
function showAdmin(){document.getElementById('page-content').style.visibility='hidden';populateAdmin();document.getElementById('admin-ov').classList.add('show');}
function closeAdmin(){document.getElementById('admin-ov').classList.remove('show');document.getElementById('crop-panel').classList.remove('show');document.getElementById('page-content').style.visibility='visible';}
window.addEventListener('hashchange',()=>{if(location.hash==='#admin')openAdmin();});
if(location.hash==='#admin')setTimeout(openAdmin,500);

function showTab(id,btn){document.querySelectorAll('.apanel').forEach(p=>p.classList.remove('show'));document.querySelectorAll('.atab').forEach(b=>b.classList.remove('on'));document.getElementById('tab-'+id).classList.add('show');btn.classList.add('on');}
function toggleItem(el){el.closest('.aitem').classList.toggle('open');}

function populateAdmin(){
  document.getElementById('a-name').value=S.hero.name||'';document.getElementById('a-disc').value=S.hero.disc||'';document.getElementById('a-tagline').value=S.hero.tagline||'';document.getElementById('a-tw').value=S.hero.tw||'';document.getElementById('a-cta').value=S.hero.cta||'';
  document.getElementById('a-p1').value=S.about.p1||'';document.getElementById('a-p2').value=S.about.p2||'';
  document.getElementById('car-speed').value=S.carousel.speed||60;document.getElementById('car-height').value=S.carousel.height||260;
  refreshAboutPrev();
  if(S.cv){document.getElementById('cv-status').textContent='✓ CV chargé';document.getElementById('cv-preview-wrap').style.display='block';}
  renderStats();renderSectionOrderAdmin();renderSectionSettings();renderFontAdmin();renderFontMenu();
  renderTagsLib();renderAboutTagSel();
  renderAdminSkills();renderAdminCarousel();renderAdminImageLibrary();renderAdminProjects();
  renderAdminTimeline();renderAdminTestimonials();renderAdminContact();
  renderPendingTranslations();
  buildEP('new-tag-emoji-ep','new-tag-emoji',null);
  const n=Object.keys(S.pendingTranslations||{}).length;
  const tb=document.getElementById('tab-transl-btn');tb.classList.toggle('pending',n>0);tb.textContent=n>0?`Traductions ⏳ (${n})`:'Traductions ⏳';
}
function refreshAboutPrev(){const d=imgCache['about_avatar'];document.getElementById('about-img-prev').innerHTML=d?`<img src="${d}" style="max-height:52px;display:block;margin:0 auto">`:'Cliquer pour ajouter';document.getElementById('about-crop-btn').style.display=d?'inline-block':'none';}

function saveHero(){S.hero={...S.hero,name:document.getElementById('a-name').value,disc:document.getElementById('a-disc').value,tagline:document.getElementById('a-tagline').value,tw:document.getElementById('a-tw').value,cta:document.getElementById('a-cta').value};markPending('hero','disc',S.hero.disc,'Disciplines hero');markPending('hero','tagline',S.hero.tagline,'Accroche hero');LS.set('hero',S.hero);renderHero();flash('Hero enregistré ✓');}
function renderAboutTagSel(){const sel=S.about.tags||[];document.getElementById('about-tag-sel').innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.4rem">'+(S.tags||[]).map(t=>`<span onclick="toggleAboutTag('${t.id}',this)" style="cursor:pointer;padding:.2rem .75rem;border-radius:20px;font-size:.78rem;border:1.5px solid var(--border);background:${sel.includes(t.id)?'var(--teal)':'transparent'};color:${sel.includes(t.id)?'#fff':'var(--ink2)'};transition:all .2s">${t.emoji} ${t.name}</span>`).join('')+'</div>';}
function toggleAboutTag(id,el){if(!S.about.tags)S.about.tags=[];const i=S.about.tags.indexOf(id);if(i>=0)S.about.tags.splice(i,1);else S.about.tags.push(id);el.style.background=S.about.tags.includes(id)?'var(--teal)':'transparent';el.style.color=S.about.tags.includes(id)?'#fff':'var(--ink2)';}
function saveAbout(){S.about={...S.about,p1:document.getElementById('a-p1').value,p2:document.getElementById('a-p2').value};markPending('about','p1',S.about.p1,'À propos §1');markPending('about','p2',S.about.p2,'À propos §2');LS.set('about',S.about);renderAbout();flash('À propos enregistré ✓');}

function renderTagsLib(){document.getElementById('tags-lib').innerHTML=(S.tags||[]).map((t,i)=>`<div class="tag-ap">${t.emoji} ${t.name}<button onclick="delTag(${i})">✕</button></div>`).join('');}
function addTag(){const e=document.getElementById('new-tag-emoji').value.trim(),n=document.getElementById('new-tag-name').value.trim();if(!n)return;if(!S.tags)S.tags=[];S.tags.push({id:'t'+Date.now(),emoji:e,name:n});LS.set('tags',S.tags);document.getElementById('new-tag-emoji').value='';document.getElementById('new-tag-name').value='';renderTagsLib();renderAboutTagSel();flash('Tag ajouté ✓');}
function delTag(i){S.tags.splice(i,1);LS.set('tags',S.tags);renderTagsLib();renderAboutTagSel();}

function renderAdminSkills(){
  document.getElementById('a-sk-list').innerHTML=(S.skills||[]).map((s,i)=>`
    <div class="aitem">
      <div class="aitem-head" onclick="toggleItem(this)"><strong>${s.name}</strong>
        <div style="display:flex;gap:.4rem;align-items:center;flex-shrink:0">
          <span style="font-size:.76rem;color:var(--ink2)">${s.pct}%</span>
          <button class="smbtn" onclick="event.stopPropagation();moveSk(${i},-1)" ${i===0?'disabled':''}>↑</button>
          <button class="smbtn" onclick="event.stopPropagation();moveSk(${i},1)" ${i===S.skills.length-1?'disabled':''}>↓</button>
          <button class="smbtn del" onclick="event.stopPropagation();delSkill(${i})">✕</button>
          <span class="achev">▾</span>
        </div>
      </div>
      <div class="aitem-body">
        <div class="agrid3">
          <div><label>Nom</label><input value="${s.name}" onchange="S.skills[${i}].name=this.value;this.closest('.aitem').querySelector('strong').textContent=this.value"></div>
          <div><label>%</label><input type="number" value="${s.pct}" min="0" max="100" onchange="S.skills[${i}].pct=+this.value"></div>
          <div><label>Couleur</label><input type="color" value="${s.color}" onchange="S.skills[${i}].color=this.value"></div>
        </div>
      </div>
    </div>`).join('');
}
function moveSk(i,d){const j=i+d;if(j<0||j>=S.skills.length)return;[S.skills[i],S.skills[j]]=[S.skills[j],S.skills[i]];renderAdminSkills();}
function addSkill(){S.skills.push({id:'sk'+Date.now(),name:'Nouvelle compétence',pct:75,color:'#077187'});renderAdminSkills();}
function delSkill(i){S.skills.splice(i,1);renderAdminSkills();}
function saveSkills(){LS.set('skills',S.skills);renderSkills();flash('Compétences enregistrées ✓');}

function renderAdminCarousel(){
  const meta=S.carousel.imageMeta||{};
  document.getElementById('a-car-list').innerHTML=(S.carousel.imageKeys||[]).map((k,i)=>{
    const d=imgCache[k];if(!d)return'';const m=meta[k]||{};
    const tagOpts=(S.tags||[]).map(t=>`<span onclick="toggleCarTag('${k}','${t.id}',this)" style="cursor:pointer;padding:.15rem .6rem;border-radius:16px;font-size:.74rem;border:1.5px solid var(--border);background:${(m.tags||[]).includes(t.id)?'var(--teal)':'transparent'};color:${(m.tags||[]).includes(t.id)?'#fff':'var(--ink2)'};margin:.1rem;display:inline-block">${t.emoji} ${t.name}</span>`).join('');
    const projOpts=(S.projects||[]).map(p=>`<span onclick="toggleCarProj('${k}','${p.id}',this)" style="cursor:pointer;padding:.15rem .6rem;border-radius:16px;font-size:.74rem;border:1.5px solid var(--border);background:${(m.linkedProjects||[]).includes(p.id)?'var(--teal)':'transparent'};color:${(m.linkedProjects||[]).includes(p.id)?'#fff':'var(--ink2)'};margin:.1rem;display:inline-block">${p.emoji} ${p.title}</span>`).join('');
    return`<div class="car-adm-card" id="cadc-${i}">
      <div class="car-adm-thumb" onclick="document.getElementById('cadc-${i}').classList.toggle('open')">
        <img src="${d}" alt=""><div class="car-adm-hint">✏ Cliquer pour éditer</div>
        <div class="car-adm-btns">
          <button onclick="event.stopPropagation();moveCar(${i},-1)" ${i===0?'disabled':''}>↑</button>
          <button onclick="event.stopPropagation();moveCar(${i},1)" ${i===S.carousel.imageKeys.length-1?'disabled':''}>↓</button>
          <button onclick="event.stopPropagation();delCar(${i})">✕</button>
          <button onclick="event.stopPropagation();openCropForKey('${k}',()=>{renderAdminCarousel();renderCarouselSection();renderCarouselBg();})">✂</button>
        </div>
      </div>
      <div class="car-adm-detail">
        <div class="afull"><label>Titre</label><input value="${m.title||''}" placeholder="Titre de l'image" onchange="setCarMeta('${k}','title',this.value)"></div>
        <div class="afull"><label>Description (lightbox)</label><textarea rows="2" onchange="setCarMeta('${k}','desc',this.value)">${m.desc||''}</textarea></div>
        <div class="afull"><label>Lien</label><input value="${m.link||''}" placeholder="https://…" onchange="setCarMeta('${k}','link',this.value)"></div>
        <div class="afull"><label>Tags photo</label><div style="display:flex;flex-wrap:wrap">${tagOpts}</div></div>
        <div class="afull"><label>Projets liés</label><div style="display:flex;flex-wrap:wrap">${projOpts}</div></div>
      </div>
    </div>`;
  }).join('');
}
function renderAdminImageLibrary(){
  const el=document.getElementById('image-library');
  if(!el) return;
  const list=S.imageLibrary||[];
  if(!list.length){ el.innerHTML='<div style="color:var(--ink2);font-size:.9rem">Aucune image dans images/image-library.json</div>'; return; }
  el.innerHTML = list.map(it=>{
    const key=it.key; const url=it.url; const lbl=it.label||it.filename||url.split('/').pop();
    return `<div style="width:120px"><div style="height:80px;overflow:hidden;border-radius:8px"><img src="${url}" style="width:100%;height:100%;object-fit:cover"></div><div style="margin-top:.35rem;text-align:center;font-size:.82rem;color:var(--ink2)">${lbl}</div><div style="display:flex;gap:.3rem;justify-content:center;margin-top:.4rem"><button class="smbtn" onclick="useLibAsHeader('${key}')">Logo</button><button class="smbtn" onclick="useLibAsAbout('${key}')">Avatar</button></div><div style="display:flex;gap:.3rem;justify-content:center;margin-top:.3rem"><button class="smbtn" onclick="addLibToCarousel('${key}')">+ Galerie</button></div></div>`;
  }).join('');
}

function useLibAsHeader(libKey){ S.header ||= {}; S.header.logoKey = libKey; LS.set('header',S.header); renderHeaderLogo(); renderSectionSettings(); flash('Logo défini depuis la bibliothèque ✓'); }
function useLibAsAbout(libKey){ const d=imgCache[libKey]; if(!d){flash('Image introuvable');return;} imgCache['about_avatar']=d; IDB.set('about_avatar',d); renderAbout(); refreshAboutPrev(); flash('Photo de profil définie ✓'); }
function addLibToCarousel(libKey){ S.carousel ||= {}; S.carousel.imageKeys = S.carousel.imageKeys||[]; S.carousel.imageKeys.push(libKey); LS.set('carousel',S.carousel); renderAdminCarousel(); renderCarouselSection(); renderCarouselBg(); flash('Image ajoutée à la galerie ✓'); }
function setCarMeta(k,f,v){if(!S.carousel.imageMeta)S.carousel.imageMeta={};if(!S.carousel.imageMeta[k])S.carousel.imageMeta[k]={};S.carousel.imageMeta[k][f]=v;LS.set('carousel',S.carousel);renderCarouselSection();renderAdminCarousel();renderCarouselBg();}
function toggleCarTag(k,tid,el){if(!S.carousel.imageMeta)S.carousel.imageMeta={};if(!S.carousel.imageMeta[k])S.carousel.imageMeta[k]={};if(!S.carousel.imageMeta[k].tags)S.carousel.imageMeta[k].tags=[];const arr=S.carousel.imageMeta[k].tags;const j=arr.indexOf(tid);if(j>=0)arr.splice(j,1);else arr.push(tid);LS.set('carousel',S.carousel);el.style.background=arr.includes(tid)?'var(--teal)':'transparent';el.style.color=arr.includes(tid)?'#fff':'var(--ink2)';}
function toggleCarProj(k,pid,el){if(!S.carousel.imageMeta)S.carousel.imageMeta={};if(!S.carousel.imageMeta[k])S.carousel.imageMeta[k]={};if(!S.carousel.imageMeta[k].linkedProjects)S.carousel.imageMeta[k].linkedProjects=[];const arr=S.carousel.imageMeta[k].linkedProjects;const j=arr.indexOf(pid);if(j>=0)arr.splice(j,1);else arr.push(pid);LS.set('carousel',S.carousel);el.style.background=arr.includes(pid)?'var(--teal)':'transparent';el.style.color=arr.includes(pid)?'#fff':'var(--ink2)';}
function moveCar(i,d){const a=S.carousel.imageKeys,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];LS.set('carousel',S.carousel);renderAdminCarousel();renderCarouselSection();renderCarouselBg();}
function delCar(i){const k=S.carousel.imageKeys[i];IDB.set(k,null);delete imgCache[k];S.carousel.imageKeys.splice(i,1);if(S.carousel.imageMeta)delete S.carousel.imageMeta[k];LS.set('carousel',S.carousel);renderAdminCarousel();renderCarouselSection();renderCarouselBg();}
function saveCarousel(){S.carousel.speed=+document.getElementById('car-speed').value||60;S.carousel.height=+document.getElementById('car-height').value||260;LS.set('carousel',S.carousel);renderCarouselSection();renderCarouselBg();startCarousels();flash('Galerie enregistrée ✓');}

function renderAdminProjects(){
  document.getElementById('a-proj-list').innerHTML=(S.projects||[]).map((p,i)=>{
    const img=imgCache['proj_'+p.id],icon=p.iconKey?imgCache[p.iconKey]:null,hasPDF=p.pdfKey&&imgCache[p.pdfKey];
    const tOpts=(S.tags||[]).map(t=>`<span onclick="toggleProjTag('${p.id}','${t.id}',this)" style="cursor:pointer;padding:.15rem .6rem;border-radius:16px;font-size:.74rem;border:1.5px solid var(--border);background:${(p.tags||[]).includes(t.id)?'var(--teal)':'transparent'};color:${(p.tags||[]).includes(t.id)?'#fff':'var(--ink2)'};margin:.1rem;display:inline-block">${t.emoji} ${t.name}</span>`).join('');
    const skillOpts=(S.skills||[]).map(s=>`<span onclick="toggleProjSkill('${p.id}','${s.id}',this)" style="cursor:pointer;padding:.15rem .6rem;border-radius:16px;font-size:.74rem;border:1.5px solid var(--border);background:${(p.linkedSkills||[]).includes(s.id)?'var(--teal)':'transparent'};color:${(p.linkedSkills||[]).includes(s.id)?'#fff':'var(--ink2)'};margin:.1rem;display:inline-block">${s.name}</span>`).join('');
    return`<div class="aitem">
      <div class="aitem-head" onclick="toggleItem(this)"><strong>${p.title}</strong>
        <div style="display:flex;gap:.3rem;align-items:center;flex-shrink:0">
          <button class="smbtn" onclick="event.stopPropagation();moveProj(${i},-1)" ${i===0?'disabled':''}>↑</button>
          <button class="smbtn" onclick="event.stopPropagation();moveProj(${i},1)" ${i===S.projects.length-1?'disabled':''}>↓</button>
          <button class="smbtn del" onclick="event.stopPropagation();delProj(${i})">✕</button>
          <span class="achev">▾</span>
        </div>
      </div>
      <div class="aitem-body">
        <div class="form-step"><strong>Étape 1</strong> – Informations essentielles</div>
        <div class="agrid2">
          <div><label>Titre *</label><input value="${p.title}" onchange="S.projects[${i}].title=this.value;this.closest('.aitem').querySelector('strong').textContent=this.value;markPending('project_${p.id}','title',this.value,'Projet: '+this.value)"></div>
          <div><label>Catégorie</label><input value="${p.cat}" onchange="S.projects[${i}].cat=this.value"></div>
        </div>
        <div class="agrid2">
          <div><label>Localisation</label><input value="${p.location||''}" placeholder="optionnel" onchange="S.projects[${i}].location=this.value"></div>
          <div><label>Lien</label><input value="${p.link||''}" placeholder="https://…" onchange="S.projects[${i}].link=this.value"></div>
        </div>
        <div class="form-step"><strong>Étape 2</strong> – Détails optionnels</div>
        <div class="afull"><label>Description</label><textarea rows="2" onchange="S.projects[${i}].desc=this.value">${p.desc}</textarea></div>
        <div class="agrid3">
          <div><label>Emoji</label>
            <div class="emoji-field"><input id="p-emoji-${p.id}" value="${p.emoji||''}" readonly class="emoji-trigger" onclick="toggleEP('p-ep-${p.id}');buildEP('p-ep-${p.id}','p-emoji-${p.id}',em=>S.projects[${i}].emoji=em)">
            <div class="emoji-picker-pop" id="p-ep-${p.id}"></div></div>
          </div>
          <div><label>Couleur fond</label><input type="color" value="${p.color}" onchange="S.projects[${i}].color=this.value"></div>
          <div><label>PDF associé</label><input value="${hasPDF?'Fichier chargé':''}" readonly style="background:transparent;border:none;color:var(--ink2)"></div>
        </div>
        <div class="afull"><label>Icône personnalisée (PNG/ICO/SVG)</label>
          <div class="icon-picker">
            <div class="icon-prev">${icon?`<img src="${icon}">`:(p.emoji||'')}</div>
            <div class="dz" style="flex:1"><input type="file" accept="image/*" onchange="loadProjIcon(event,'${p.id}',${i})">Uploader icône</div>
          </div>
        </div>
        <div class="afull"><label>Tags</label><div style="display:flex;flex-wrap:wrap">${tOpts}</div></div>
        <div class="afull"><label>Compétences liées</label><div style="display:flex;flex-wrap:wrap">${skillOpts}</div></div>
        <div class="agrid2">
          <div><label>Image de couverture</label>
            <div class="dz"><input type="file" accept="image/*" onchange="loadProjImg(event,'${p.id}')">
            ${img?`<img src="${img}">`:'Cliquer pour ajouter'}</div>
            ${img?`<button class="smbtn" style="margin-top:.3rem" onclick="openCropForKey('proj_${p.id}',()=>renderAdminProjects())">✂ Recadrer</button>`:''}
          </div>
          <div><label>Fichier PDF</label>
            <div class="dz"><input type="file" accept=".pdf" onchange="loadProjPDF(event,'${p.id}',${i})">
            ${hasPDF?'✓ PDF chargé':'Uploader PDF'}</div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}
function toggleProjTag(pid,tid,el){const p=S.projects.find(x=>x.id===pid);if(!p){return;}if(!p.tags)p.tags=[];const j=p.tags.indexOf(tid);if(j>=0)p.tags.splice(j,1);else p.tags.push(tid);el.style.background=p.tags.includes(tid)?'var(--teal)':'transparent';el.style.color=p.tags.includes(tid)?'#fff':'var(--ink2)';}
function toggleProjSkill(pid,sid,el){const p=S.projects.find(x=>x.id===pid);if(!p){return;}if(!p.linkedSkills)p.linkedSkills=[];const j=p.linkedSkills.indexOf(sid);if(j>=0)p.linkedSkills.splice(j,1);else p.linkedSkills.push(sid);el.style.background=p.linkedSkills.includes(sid)?'var(--teal)':'transparent';el.style.color=p.linkedSkills.includes(sid)?'#fff':'var(--ink2)';LS.set('projects',S.projects);try{renderProjects();}catch(_){} if(currentSkillPopupId===sid){try{showSkillProjects(sid);}catch(_){} }}
function moveProj(i,d){const j=i+d;if(j<0||j>=S.projects.length)return;[S.projects[i],S.projects[j]]=[S.projects[j],S.projects[i]];renderAdminProjects();}
function addProject(){S.projects.push({id:'p'+Date.now(),cat:'autre',emoji:'✨',iconKey:'',color:'#f5e6d3',title:'Nouveau projet',desc:'Description…',location:'',link:'',pdfKey:'',tags:[],linkedSkills:[],en:{title:'',desc:''}});renderAdminProjects();}
function delProj(i){S.projects.splice(i,1);renderAdminProjects();}
function loadProjImg(e,id){const f=e.target.files[0];if(!f)return;storeImg(f,'proj_'+id,()=>renderAdminProjects());}
function loadProjIcon(e,id,i){const f=e.target.files[0];if(!f)return;storeImg(f,'icon_'+id,()=>{S.projects[i].iconKey='icon_'+id;renderAdminProjects();});}
function loadProjPDF(e,id,i){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const k='pdf_'+id;imgCache[k]=ev.target.result;IDB.set(k,ev.target.result);S.projects[i].pdfKey=k;renderAdminProjects();};r.readAsDataURL(f);}
function saveProjects(){LS.set('projects',S.projects);renderProjects();flash('Projets enregistrés ✓');}

function renderAdminTimeline(){
  document.getElementById('a-tl-list').innerHTML=(S.timeline||[]).map((t,i)=>{
    const logo=imgCache['tl_logo_'+t.id];
    const projOpts=(S.projects||[]).map(p=>`<span onclick="toggleTLProj(${i},'${p.id}',this)" style="cursor:pointer;padding:.15rem .6rem;border-radius:16px;font-size:.74rem;border:1.5px solid var(--border);background:${(t.linkedProjects||[]).includes(p.id)?'var(--teal)':'transparent'};color:${(t.linkedProjects||[]).includes(p.id)?'#fff':'var(--ink2)'};margin:.1rem;display:inline-block">${p.emoji} ${p.title}</span>`).join('');
    const skillOpts=(S.skills||[]).map(s=>`<span onclick="toggleTLSkill(${i},'${s.id}',this)" style="cursor:pointer;padding:.15rem .6rem;border-radius:16px;font-size:.74rem;border:1.5px solid var(--border);background:${(t.linkedSkills||[]).includes(s.id)?'var(--teal)':'transparent'};color:${(t.linkedSkills||[]).includes(s.id)?'#fff':'var(--ink2)'};margin:.1rem;display:inline-block">${s.name}</span>`).join('');
    return`<div class="aitem">
      <div class="aitem-head" onclick="toggleItem(this)"><strong>${t.title}</strong>
        <div style="display:flex;gap:.3rem;align-items:center;flex-shrink:0">
          <span style="font-size:.7rem;color:${t.type==='pro'?'var(--teal)':'var(--red)'}">${t.type==='pro'?'Pro':'Études'}</span>
          <button class="smbtn" onclick="event.stopPropagation();moveTL(${i},-1)" ${i===0?'disabled':''}>↑</button>
          <button class="smbtn" onclick="event.stopPropagation();moveTL(${i},1)" ${i===S.timeline.length-1?'disabled':''}>↓</button>
          <button class="smbtn del" onclick="event.stopPropagation();delTL(${i})">✕</button>
          <span class="achev">▾</span>
        </div>
      </div>
      <div class="aitem-body">
        <div class="form-step"><strong>Étape 1</strong> – Informations essentielles</div>
        <div class="agrid3">
          <div><label>Type</label><select onchange="S.timeline[${i}].type=this.value;const sp=this.closest('.aitem').querySelector('.aitem-head span');sp.textContent=this.value==='pro'?'Pro':'Études';sp.style.color=this.value==='pro'?'var(--teal)':'var(--red)'"><option value="pro" ${t.type==='pro'?'selected':''}>Pro</option><option value="edu" ${t.type==='edu'?'selected':''}>Études</option></select></div>
          <div><label>Année *</label><input type="number" value="${t.startYear||t.year||''}" min="1990" max="2045" onchange="S.timeline[${i}].startYear=+this.value"></div>
          <div><label>Mois (optionnel)</label><input type="number" value="${t.startMonth||t.month||''}" min="1" max="12" placeholder="—" onchange="S.timeline[${i}].startMonth=+this.value||0"></div>
        </div>
        <div class="agrid3">
          <div><label>Fin - année (optionnel)</label><input type="number" value="${t.endYear||''}" min="1990" max="2045" placeholder="—" onchange="S.timeline[${i}].endYear=+this.value||0"></div>
          <div><label>Fin - mois (optionnel)</label><input type="number" value="${t.endMonth||''}" min="1" max="12" placeholder="—" onchange="S.timeline[${i}].endMonth=+this.value||0"></div>
          <div><label>Localisation</label><input value="${t.location||''}" placeholder="optionnel" onchange="S.timeline[${i}].location=this.value"></div>
        </div>
        <div class="form-step"><strong>Étape 2</strong> – Détails optionnels</div>
        <div class="afull"><label>Titre *</label><input value="${t.title}" onchange="S.timeline[${i}].title=this.value;this.closest('.aitem').querySelector('strong').textContent=this.value;markPending('tl_${t.id}','title',this.value,'Parcours: '+this.value)"></div>
        <div class="afull"><label>Description courte</label><textarea rows="2" onchange="S.timeline[${i}].desc=this.value">${t.desc}</textarea></div>
        <div class="afull"><label>Mention / distinction</label><input value="${t.mention||''}" placeholder="optionnel" onchange="S.timeline[${i}].mention=this.value"></div>
        <div class="afull"><label>Compétences liées</label><div style="display:flex;flex-wrap:wrap">${skillOpts}</div></div>
        <div class="afull"><label>Projets liés</label><div style="display:flex;flex-wrap:wrap">${projOpts}</div></div>
        <div class="afull"><label>Logo / badge</label>
          <div class="dz"><input type="file" accept="image/*" onchange="loadTLLogo(event,${i},'${t.id}')">
          ${logo?`<img src="${logo}">`:'Cliquer pour ajouter'}</div>
          ${logo?`<button class="smbtn" style="margin-top:.3rem" onclick="openCropForKey('tl_logo_${t.id}',()=>renderAdminTimeline())">✂ Recadrer</button>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
}
function toggleTLProj(i,pid,el){if(!S.timeline[i].linkedProjects)S.timeline[i].linkedProjects=[];const j=S.timeline[i].linkedProjects.indexOf(pid);if(j>=0)S.timeline[i].linkedProjects.splice(j,1);else S.timeline[i].linkedProjects.push(pid);el.style.background=S.timeline[i].linkedProjects.includes(pid)?'var(--teal)':'transparent';el.style.color=S.timeline[i].linkedProjects.includes(pid)?'#fff':'var(--ink2)';}
function toggleTLSkill(i,sid,el){
  if(!S.timeline[i].linkedSkills)S.timeline[i].linkedSkills=[];
  const j=S.timeline[i].linkedSkills.indexOf(sid);
  if(j>=0)S.timeline[i].linkedSkills.splice(j,1);else S.timeline[i].linkedSkills.push(sid);
  el.style.background=S.timeline[i].linkedSkills.includes(sid)?'var(--teal)':'transparent';
  el.style.color=S.timeline[i].linkedSkills.includes(sid)?'#fff':'var(--ink2)';
  LS.set('timeline',S.timeline);
  try{renderTimeline();renderAdminTimeline();}catch(e){}
  if(currentSkillPopupId===sid){ try{showSkillProjects(sid);}catch(e){} }
}
function moveTL(i,d){const j=i+d;if(j<0||j>=S.timeline.length)return;[S.timeline[i],S.timeline[j]]=[S.timeline[j],S.timeline[i]];renderAdminTimeline();}
function addTL(type){S.timeline.push({id:'tl'+Date.now(),type,year:new Date().getFullYear(),month:0,startYear:new Date().getFullYear(),startMonth:0,endYear:0,endMonth:0,title:'Nouveau',desc:'…',location:'',extra:'',mention:'',logoKey:'',linkedProjects:[],linkedSkills:[],en:{title:'',desc:''}});renderAdminTimeline();}
function delTL(i){S.timeline.splice(i,1);renderAdminTimeline();}
function loadTLLogo(e,i,id){const f=e.target.files[0];if(!f)return;storeImg(f,'tl_logo_'+id,()=>renderAdminTimeline());}
function saveTimeline(){LS.set('timeline',S.timeline);renderTimeline();flash('Parcours enregistré ✓');}

function renderAdminTestimonials(){
  document.getElementById('a-testi-list').innerHTML=(S.testimonials||[]).map((t,i)=>{
    const av=imgCache['testi_'+t.id];
    return`<div class="aitem">
      <div class="aitem-head" onclick="toggleItem(this)"><strong>${t.name||'Appréciation '+(i+1)}</strong>
        <div style="display:flex;gap:.3rem;align-items:center;flex-shrink:0">
          <button class="smbtn" onclick="event.stopPropagation();moveTesti(${i},-1)" ${i===0?'disabled':''}>↑</button>
          <button class="smbtn" onclick="event.stopPropagation();moveTesti(${i},1)" ${i===S.testimonials.length-1?'disabled':''}>↓</button>
          <button class="smbtn del" onclick="event.stopPropagation();delTesti(${i})">✕</button>
          <span class="achev">▾</span>
        </div>
      </div>
      <div class="aitem-body">
        <div class="afull"><label>Citation</label><textarea rows="3" onchange="S.testimonials[${i}].quote=this.value;markPending('testi_${t.id}','quote',this.value,'Appréciation: ${(t.name||'').replace(/'/g,'')}')">${t.quote||''}</textarea></div>
        <div class="agrid2">
          <div><label>Nom</label><input value="${t.name||''}" onchange="S.testimonials[${i}].name=this.value;this.closest('.aitem').querySelector('strong').textContent=this.value||'Appréciation'"></div>
          <div><label>Rôle / Structure</label><input value="${t.role||''}" onchange="S.testimonials[${i}].role=this.value"></div>
        </div>
        <div class="afull"><label>Initiales (si pas de photo)</label><input value="${t.initials||''}" onchange="S.testimonials[${i}].initials=this.value" style="max-width:80px"></div>
        <div class="afull"><label>Photo</label>
          <div class="dz"><input type="file" accept="image/*" onchange="loadTestiImg(event,'${t.id}')">
          ${av?`<img src="${av}">`:'Cliquer pour ajouter'}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}
function moveTesti(i,d){const j=i+d;if(j<0||j>=S.testimonials.length)return;[S.testimonials[i],S.testimonials[j]]=[S.testimonials[j],S.testimonials[i]];renderAdminTestimonials();}
function addTesti(){S.testimonials.push({id:'tsti'+Date.now(),name:'',role:'',quote:'',initials:'',en:{quote:''}});renderAdminTestimonials();}
function delTesti(i){S.testimonials.splice(i,1);renderAdminTestimonials();}
function loadTestiImg(e,id){const f=e.target.files[0];if(!f)return;storeImg(f,'testi_'+id,()=>renderAdminTestimonials());}
function saveTestimonials(){LS.set('testimonials',S.testimonials);renderTestimonials();flash('Appréciations enregistrées ✓');}

function renderAdminContact(){
  document.getElementById('a-ct-list').innerHTML=(S.contact||[]).map((c,i)=>{
    const icon=c.iconKey?imgCache[c.iconKey]:null;
    return`<div class="aitem">
      <div class="aitem-head" onclick="toggleItem(this)"><strong>${c.emoji||''} ${c.label}</strong>
        <div style="display:flex;gap:.3rem;align-items:center;flex-shrink:0">
          <button class="smbtn" onclick="event.stopPropagation();moveCt(${i},-1)" ${i===0?'disabled':''}>↑</button>
          <button class="smbtn" onclick="event.stopPropagation();moveCt(${i},1)" ${i===S.contact.length-1?'disabled':''}>↓</button>
          <button class="smbtn del" onclick="event.stopPropagation();delContact(${i})">✕</button>
          <span class="achev">▾</span>
        </div>
      </div>
      <div class="aitem-body">
        <div class="agrid3">
          <div><label>Emoji</label>
            <div class="emoji-field"><input id="ct-emoji-${c.id}" value="${c.emoji||''}" readonly class="emoji-trigger" onclick="toggleEP('ct-ep-${c.id}');buildEP('ct-ep-${c.id}','ct-emoji-${c.id}',em=>{S.contact[${i}].emoji=em;document.querySelector('#ct-ep-${c.id}').closest('.aitem').querySelector('strong').textContent=em+' '+(S.contact[${i}].label||'');})">
            <div class="emoji-picker-pop" id="ct-ep-${c.id}"></div></div>
          </div>
          <div><label>Label</label><input value="${c.label}" onchange="S.contact[${i}].label=this.value;this.closest('.aitem').querySelector('strong').textContent=(S.contact[${i}].emoji||'')+' '+this.value;markPending('contact_${c.id}','label',this.value,'Contact: '+this.value)"></div>
          <div><label>Valeur</label><input value="${c.value}" onchange="S.contact[${i}].value=this.value"></div>
        </div>
        <div class="afull"><label>Lien</label><input value="${c.href||''}" placeholder="https://… ou mailto:…" onchange="S.contact[${i}].href=this.value"></div>
        <div class="afull"><label>Icône (PNG/ICO/SVG)</label>
          <div class="icon-picker">
            <div class="icon-prev">${icon?`<img src="${icon}">`:(c.emoji||'')}</div>
            <div class="dz" style="flex:1"><input type="file" accept="image/png,image/x-icon,image/svg+xml" onchange="loadCtIcon(event,'${c.id}',${i})">Uploader icône</div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}
function moveCt(i,d){const j=i+d;if(j<0||j>=S.contact.length)return;[S.contact[i],S.contact[j]]=[S.contact[j],S.contact[i]];renderAdminContact();}
function addContact(){S.contact.push({id:'c'+Date.now(),emoji:'✦',iconKey:'',label:'Info',value:'…',href:'',en:{label:''}});renderAdminContact();}
function delContact(i){S.contact.splice(i,1);renderAdminContact();}
function loadCtIcon(e,id,i){const f=e.target.files[0];if(!f)return;storeImg(f,'cticon_'+id,()=>{S.contact[i].iconKey='cticon_'+id;renderAdminContact();});}
function saveContact(){LS.set('contact',S.contact);renderContact();flash('Contact enregistré ✓');}

function markPending(key,field,frVal,label){
  if(!S.pendingTranslations)S.pendingTranslations={};
  if(!S.pendingTranslations[key])S.pendingTranslations[key]={label,fields:{}};
  S.pendingTranslations[key].fields[field]={fr:frVal,en:S.pendingTranslations[key].fields[field]?.en||''};
  LS.set('pendingTranslations',S.pendingTranslations);
}
function renderPendingTranslations(){
  const keys=Object.keys(S.pendingTranslations||{}),no=document.getElementById('no-pending'),list=document.getElementById('pending-transl-list');
  if(!keys.length){no.style.display='block';list.innerHTML='';return;}
  no.style.display='none';
  list.innerHTML=keys.map(k=>{const p=S.pendingTranslations[k];return`<div class="pending-item"><h4>${p.label}</h4>${Object.entries(p.fields).map(([f,v])=>`<div style="font-size:.72rem;color:var(--ink2);margin-bottom:.2rem">FR : ${v.fr}</div><input placeholder="EN — ${f}" value="${v.en||''}" onchange="S.pendingTranslations['${k}'].fields['${f}'].en=this.value;LS.set('pendingTranslations',S.pendingTranslations)" style="margin-bottom:.4rem">`).join('')}<div style="display:flex;gap:.5rem;margin-top:.5rem"><button class="smbtn" onclick="applyTrans('${k}')">✓ Valider</button><button class="smbtn del" onclick="skipTrans('${k}')">Plus tard</button></div></div>`;}).join('');
}
function applyTrans(k){
  const p=S.pendingTranslations[k];
  function setEn(obj){if(!obj.en)obj.en={};Object.entries(p.fields).forEach(([f,v])=>{obj.en[f]=v.en;});}
  if(k==='hero'){setEn(S.hero);LS.set('hero',S.hero);}
  else if(k==='about'){setEn(S.about);LS.set('about',S.about);}
  else if(k.startsWith('project_')){const o=S.projects.find(x=>x.id===k.replace('project_',''));if(o){setEn(o);LS.set('projects',S.projects);}}
  else if(k.startsWith('tl_')){const o=S.timeline.find(x=>x.id===k.replace('tl_',''));if(o){setEn(o);LS.set('timeline',S.timeline);}}
  else if(k.startsWith('testi_')){const o=S.testimonials.find(x=>x.id===k.replace('testi_',''));if(o){setEn(o);LS.set('testimonials',S.testimonials);}}
  else if(k.startsWith('contact_')){const o=S.contact.find(x=>x.id===k.replace('contact_',''));if(o){setEn(o);LS.set('contact',S.contact);}}
  delete S.pendingTranslations[k];LS.set('pendingTranslations',S.pendingTranslations);
  renderPendingTranslations();flash('Traduction appliquée ✓');
}
function skipTrans(k){delete S.pendingTranslations[k];LS.set('pendingTranslations',S.pendingTranslations);renderPendingTranslations();}

function flash(msg){const el=document.createElement('div');el.className='flash-msg';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),400);},2200);}

initState();
function getLoaderMessages(){
  const header=S.header||{};
  const list=header.loaderMessages||DEF.header.loaderMessages||[];
  return Array.isArray(list)?list:list.filter?.(Boolean)||[];
}
function renderLoaderNote(){
  const notes=getLoaderMessages();
  const noteEl=document.getElementById('loader-notes');
  if(noteEl) noteEl.textContent = notes.length?notes[Math.floor(Math.random()*notes.length)]:'';
}
function updateLoaderDots(){
  const dots=document.getElementById('loader-dots');
  if(!dots) return;
  loaderDotIndex=(loaderDotIndex+1)%4;
  dots.textContent='.'.repeat(loaderDotIndex);
}
function startLoaderDotCycle(){
  stopLoaderDotCycle();
  updateLoaderDots();
  loaderDotsInterval=setInterval(updateLoaderDots,500);
}
function stopLoaderDotCycle(){
  if(loaderDotsInterval){clearInterval(loaderDotsInterval);loaderDotsInterval=null;}
}
function showLoader(){
  const s=document.getElementById('site-loader');
  const pc=document.getElementById('page-content');
  if(pc) pc.style.opacity='0';
  if(s){
    s.style.display='flex';
    s.classList.add('show');
    renderLoaderMain();
    renderLoaderNote();
    startLoaderDotCycle();
  }
}
function hideLoader(){
  const s=document.getElementById('site-loader');
  const pc=document.getElementById('page-content');
  if(!s) return;
  s.classList.remove('show');
  stopLoaderDotCycle();
  setTimeout(()=>{
    if(pc) pc.style.opacity='1';
    if(s && !s.classList.contains('show')) s.style.display='none';
  },150);
}

// ════════════════════════════════
// DATABASE - GITHUB / SUPABASE
// ════════════════════════════════
function setupGitHub(){
  const token = document.getElementById('github-token').value.trim();
  const repo = document.getElementById('github-repo').value.trim();
  const branch = document.getElementById('github-branch').value.trim() || 'main';
  
  if(!token || !repo){
    flash('⚠ Token et dépôt requis');
    return;
  }
  
  GITHUB.init(token, repo, branch);
  LS.set('github_token', token);
  LS.set('github_repo', repo);
  LS.set('github_branch', branch);
  
  document.getElementById('github-status').textContent = '✓ Configuré';
  document.getElementById('gh-commit-btn').style.display = 'inline-block';
  flash('✓ GitHub configuré');
}

function commitToGitHub(){
  if(!GITHUB.initialized){
    flash('⚠ Veuillez configurer GitHub d\'abord');
    return;
  }
  
  const status = document.getElementById('github-status');
  status.textContent = '⏳ Envoi...';
  
  EXPORT_IMPORT.exportState().then(state => {
    GITHUB.commitState(state).then(success => {
      if(success){
        status.textContent = '✓ Synchronisé à GitHub';
        flash('✓ Données envoyées à GitHub');
      } else {
        status.textContent = '✗ Erreur lors de l\'envoi';
        flash('✗ Erreur GitHub');
      }
    });
  });
}

function setupSupabase(){
  const url = document.getElementById('supabase-url').value.trim();
  const key = document.getElementById('supabase-key').value.trim();
  
  if(!url || !key){
    flash('⚠ URL et clé Supabase requises');
    return;
  }
  
  CLOUD.init(url, key);
  LS.set('supabase_url', url);
  LS.set('supabase_key', key);
  
  document.getElementById('supabase-status').textContent = '✓ Configuré';
  document.getElementById('sb-sync-btn').style.display = 'inline-block';
  flash('✓ Supabase configuré');
}

function syncWithSupabase(){
  if(!CLOUD.enabled){
    flash('⚠ Veuillez configurer Supabase d\'abord');
    return;
  }
  
  const status = document.getElementById('supabase-status');
  status.textContent = '⏳ Synchronisation...';
  
  CLOUD.pull().then(remoteState => {
    if(remoteState && confirm('Voulez-vous charger les données du cloud? Les données locales seront remplacées.')){
      EXPORT_IMPORT.importState(JSON.stringify(remoteState)).then(success => {
        if(success){
          status.textContent = '✓ Données du cloud chargées';
          flash('✓ Synchronisé depuis le cloud');
          renderAll();
        }
      });
    } else if(!remoteState){
      // Push vers le cloud
      EXPORT_IMPORT.exportState().then(state => {
        CLOUD.push(state).then(success => {
          if(success){
            status.textContent = '✓ Envoyé au cloud';
            flash('✓ Données synchronisées au cloud');
          }
        });
      });
    }
  });
}

function restoreGitHubSession(){
  const token = LS.get('github_token');
  const repo = LS.get('github_repo');
  const branch = LS.get('github_branch');
  
  if(token && repo){
    GITHUB.init(token, repo, branch || 'main');
    document.getElementById('github-token').value = token;
    document.getElementById('github-repo').value = repo;
    document.getElementById('github-branch').value = branch || 'main';
    document.getElementById('github-status').textContent = '✓ Configuré';
    document.getElementById('gh-commit-btn').style.display = 'inline-block';
  }
}

function restoreSupabaseSession(){
  const url = LS.get('supabase_url');
  const key = LS.get('supabase_key');
  
  if(url && key){
    CLOUD.init(url, key);
    document.getElementById('supabase-url').value = url;
    document.getElementById('supabase-key').value = key;
    document.getElementById('supabase-status').textContent = '✓ Configuré';
    document.getElementById('sb-sync-btn').style.display = 'inline-block';
  }
}

try{
  const start = () => {
    showLoader();
    // Restaurer les sessions GitHub/Supabase après chargement du DOM
    setTimeout(() => {
      restoreGitHubSession();
      restoreSupabaseSession();
    }, 100);
  };
  document.addEventListener('DOMContentLoaded', start);
  if(document.readyState !== 'loading') start();
}catch(_e){}
