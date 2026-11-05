import { renderNeuro } from './neuro.js';
import { renderGlucose } from './glucose.js';
import { tools, calculateAll, searchTools } from './formulas.js';
const VERSION = '1.2.1';
// Restore the search UI here when the catalog grows; interface remains in formulas.js.
const FEATURES = Object.freeze({ search: false });
const app = document.querySelector('#app');
const patient = { height:'', weight:'', sex:'' };
let results = {}, registration, installEvent, reloadApproved = false;
let offlineReady = false, updateInfo, updateNote = '', favorites = [];
try {
  const old = JSON.parse(localStorage.getItem('anesthesia:favorites') || '[]');
  if (Array.isArray(old)) favorites = [...new Set(old.map(id => tools.some(t => t.id === id) ? 'weight' : id).filter(id => ['weight','glucose','neuro'].includes(id)))];
} catch { /* Favorites remain session-only if storage is unavailable. */ }
const paths = {
  home:'<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3z"/>', star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
  settings:'<path d="m9 3-1 3-3 1-2 4 2 3 1 4 4 3 3-1 4-1 3-4-1-3-1-4-4-3z"/><circle cx="12" cy="12" r="3"/>', person:'<circle cx="12" cy="6" r="3"/><path d="M5 21v-4a7 7 0 0 1 14 0v4z"/>',
  lungs:'<path d="M10 4v8m4-8v8M8 7C4 8 2 14 3 19c1 2 5 2 7-1V9m6-2c4 1 6 7 5 12-1 2-5 2-7-1V9"/>', drop:'<path d="M12 3S4 12 4 16a8 8 0 0 0 16 0c0-4-8-13-8-13z"/>',
  syringe:'<path d="m14 3 7 7M16 5 5 16l3 3L19 8M4 20l-2 2m2-6 4 4M10 11l3 3m0-6 3 3"/>', arrow:'<path d="m9 5 7 7-7 7"/>', back:'<path d="m15 5-7 7 7 7"/>', shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>', plus:'<path d="M12 5v14M5 12h14"/>'
};
function icon(name, cls='') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.person}</svg>`; }
function escape(s) { return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function route() { return location.hash.slice(1) || 'home'; }
function toast(message) { const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2600); }
function nav(active) { return `<nav class="bottom-nav" aria-label="主导航">${[['home','home','首页'],['favorites','star','收藏'],['settings','settings','设置']].map(([id,ico,label])=>`<a href="#${id}" ${active===id?'aria-current="page"':''}>${icon(ico)}<span>${label}</span></a>`).join('')}</nav>`; }
function shell(content,active,cls='') { app.innerHTML=`<div class="app-shell ${cls}">${content}${nav(active)}<footer class="page-foot">${icon('shield')}参数仅在本机处理 · 默认不保存记录</footer></div>`; }
function weightShortcut() { return `<a class="tool-card" href="#category/weight"><span class="tool-icon">${icon('person')}</span><span class="card-copy"><strong>体重综合计算</strong><span>一次输入 · 六项结果</span></span>${icon('arrow','chevron')}</a>`; }
function renderHome() {
  shell(`<header class="home-header"><div class="brand-line"><span class="brand-symbol">${icon('plus')}</span><span>ANESTHESIA TOOLS</span><span class="version-pill">v${VERSION}</span></div><h1>麻醉计算助手</h1><p class="subtitle">本地计算与围术期临床速查。</p></header><main id="main">${FEATURES.search?'<div class="search"><input id="search" type="search" aria-label="搜索计算工具" placeholder="搜索计算工具" autocomplete="off"></div><div id="search-results"></div>':''}<div class="section-heading"><h2>常用工具</h2><span>快速进入</span></div>${weightShortcut()}<div class="section-heading"><h2>临床专题</h2><span>1.2.1 测试版</span></div>${glucoseShortcut()}${neuroShortcut()}<div class="section-heading"><h2>全部分类</h2><span>按场景查找</span></div><div class="categories"><a class="category-card available" href="#category/weight"><span class="category-icon">${icon('person')}</span><span class="card-copy"><strong>体重与体型</strong><span>BMI、标准体重、校正体重等</span></span>${icon('arrow','chevron')}</a>${[['lungs','气道管理','导管型号、置入深度等'],['drop','液体管理','补液量、维持液体等'],['syringe','药物换算','剂量、浓度、输注速率等']].map(([ico,name,desc])=>`<div class="category-card upcoming"><span class="category-icon">${icon(ico)}</span><span class="card-copy"><strong>${name}</strong><span>${desc}</span></span><span class="coming-badge">后续版本</span></div>`).join('')}</div></main>`,'home');
  if(FEATURES.search) document.querySelector('#search').addEventListener('input',e=>{document.querySelector('#search-results').innerHTML=!e.target.value.trim()?'':searchTools(e.target.value).length?weightShortcut():'<p class="empty">没有找到工具</p>';});
}
function numberField(name,label,unit) { return `<label class="field" for="${name}"><span>${label}</span><span class="input-unit"><input id="${name}" name="${name}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="请输入${label}" value="${escape(patient[name])}" aria-describedby="${name}-unit"><span id="${name}-unit">${unit}</span></span></label>`; }
function resultCards() {
  return tools.map(t=>{const r=results[t.id];return `<article class="metric-card ${r?.error?'metric-error':''}" id="metric-${t.id}" aria-labelledby="label-${t.id}"><h3 id="label-${t.id}">${t.name} <span>${t.code}</span></h3>${r?.error?`<p class="metric-invalid">无法计算</p><p class="metric-error-copy">${escape(r.error)}</p>`:`<div class="metric-number">${r?r.display:'— —'} <span>${t.id==='bmi'?'kg/m²':'kg'}</span></div>${r?.category?`<span class="bmi-label ${r.category==='正常'?'normal':''}">${r.category}</span>`:''}`}${t.id==='cbw'?'<p class="metric-note">成人 · 系数 0.4</p>':''}</article>`;}).join('');
}
function formulaDetails() {
  return tools.map(t=>`<section class="formula-item"><h3>${t.name} ${t.code}</h3><pre>${escape(t.formula)}</pre><p class="formula-inputs">使用参数：${escape(t.fields.map(f=>f==='height'?`身高 ${patient.height||'未输入'} cm`:f==='weight'?`实际体重 ${patient.weight||'未输入'} kg`:`性别 ${patient.sex==='male'?'男性':patient.sex==='female'?'女性':'未选择'}`).join('；'))}</p><pre>${escape(results[t.id]?.steps||results[t.id]?.error||'完成计算后显示代入过程。')}</pre></section>`).join('')+'<p>H：身高（cm）；W：实际体重（kg）。IBW 为理想体重，CBW 为校正体重。中间值不舍入，结果保留 1 位小数；BMI 按未舍入值分级。</p>';
}
function updateResults() {
  document.querySelector('#results-grid').innerHTML=resultCards(); document.querySelector('#formula-content').innerHTML=formulaDetails();
  document.querySelector('#result-status').textContent=Object.keys(results).length?'已完成计算；各项异常见对应卡片。':'修改参数后，请重新计算全部结果。';
}
function renderWeight() {
  const selected=favorites.includes('weight');
  shell(`<header class="inner-header weight-header"><a href="#home" class="back">${icon('back')}首页</a><h1>体重与体型</h1><button id="favorite" class="icon-button ${selected?'is-favorite':''}" aria-label="${selected?'取消收藏':'收藏体重综合计算'}" aria-pressed="${selected}">${icon('star')}</button></header><main id="main"><form id="calculator-form" class="panel unified-form" novalidate><div class="panel-heading"><h2>输入参数</h2><span class="local-badge">成人体重指标</span></div><div class="unified-fields">${numberField('height','身高','cm')}${numberField('weight','实际体重','kg')}</div><fieldset class="sex-field"><legend>性别</legend><div class="segment">${[['male','男性'],['female','女性']].map(([v,l])=>`<label><input type="radio" name="sex" value="${v}" ${patient.sex===v?'checked':''}><span>${l}</span></label>`).join('')}</div></fieldset><div id="form-error" class="error" role="alert" hidden></div><button class="primary calculate-button" type="submit">计算全部</button></form><section class="panel unified-results" aria-labelledby="results-title"><div class="panel-heading"><h2 id="results-title">计算结果</h2><span>六项指标统一展示</span></div><div class="results-grid" id="results-grid">${resultCards()}</div><p class="bmi-round-note">BMI 分级使用未舍入值，显示值保留 1 位小数。</p></section><details class="panel disclosure"><summary>公式与计算过程${icon('arrow')}</summary><div id="formula-content" class="detail-content">${formulaDetails()}</div></details><p class="recalculate-note" id="result-status" role="status">${Object.keys(results).length?'已完成计算；各项异常见对应卡片。':'输入参数后，点击“计算全部”。'}</p></main>`,'home','weight-shell');
  document.querySelector('#favorite').addEventListener('click',()=>{
    favorites=favorites.includes('weight')?favorites.filter(id=>id!=='weight'):[...favorites,'weight'];
    try{localStorage.setItem('anesthesia:favorites',JSON.stringify(favorites));}catch{toast('偏好无法持久保存，本次收藏仅在当前会话有效');}
    const b=document.querySelector('#favorite'),active=favorites.includes('weight');b.classList.toggle('is-favorite',active);b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',active?'取消收藏':'收藏体重综合计算');
  });
  const form=document.querySelector('#calculator-form');
  form.addEventListener('input',e=>{if(!Object.hasOwn(patient,e.target.name))return;patient[e.target.name]=e.target.value;results={};updateResults();document.querySelector('#form-error').hidden=true;});
  form.addEventListener('submit',e=>{e.preventDefault();const error=document.querySelector('#form-error');try{results=calculateAll(patient);error.hidden=true;updateResults();}catch(err){results={};updateResults();error.textContent=err.message;error.hidden=false;}});
}
function renderFavorites() {
  shell(`<header class="simple-header"><h1>收藏工具</h1></header><main id="main"><p class="subtitle">常用的计算，触手可及。</p><div class="tool-list">${favorites.length?(favorites.includes('weight')?weightShortcut():'')+(favorites.includes('glucose')?glucoseShortcut():'')+(favorites.includes('neuro')?neuroShortcut():''):`<div class="empty favorite-empty">${icon('star')}<h2>还没有收藏工具</h2><span>在工具或专题中点击右上角星标即可收藏。</span><a class="secondary" href="#category/weight">浏览体重工具</a></div>`}</div><p class="preview-note">仅保存工具偏好，不保存患者参数和结果。</p></main>`,'favorites');
}
function renderSettings() {
  shell(`<header class="simple-header"><h1>设置</h1></header><main id="main"><p class="subtitle">离线使用，更新由你决定。</p><section class="panel settings-panel"><div class="settings-brand"><span class="brand-symbol">${icon('plus')}</span><div><h2>麻醉计算助手</h2><span>版本 ${VERSION}</span></div></div><h3>本版内容</h3><p>1.2.1 测试版：补充神经专题用途、使用顺序，以及各项目的背景知识、基础概念与阅读提示。保留ISNCSCI 2026第9版查体速查、六步分类、10个病例和16份中英对照图表，支持离线查阅。</p><p>新增围术期血糖管理专题（测试版）：以处理流程为主，六张图表均已译成中文，保留原有排版、数值、单位与脚注，配处理步骤与来源定位；已删除参数评估。尚未经临床验收。</p><p>统一输入，集中展示 BMI、标准体重、瘦体重、理想体重、预测体重和校正体重。实际体重仅作为输入；校正体重采用成人系数 0.4，IBW 为理想体重。</p></section><section class="panel settings-panel"><h2>安装与离线</h2><p id="offline-status">${offlineReady?'离线资源已就绪，可在断网时重新打开。':'离线资源尚未就绪，请保持联网并等待缓存完成。'}</p><button id="install" class="secondary full">${installEvent?'安装到设备':'查看安装方式'}</button><p class="small-copy">安卓 Chrome：菜单 → 安装应用 / 添加到主屏幕。安装和离线就绪需分别确认。</p></section><section class="panel settings-panel"><h2>版本更新</h2><p>当前版本 ${VERSION}。新版准备好后，经你确认再刷新。</p><button id="check-update" class="secondary full">检查更新</button><div id="update-status" role="status">${escape(updateNote)}</div><div id="update-offer"></div></section><section class="panel settings-panel"><h2>隐私与数据</h2><p>计算参数仅在当前设备处理；默认不保存计算记录。不提供姓名、住院号等身份信息输入。</p><p>身高、体重和性别仅在当前页面运行内存中保留，修改参数后旧结果立即清除。重新加载或关闭后不恢复参数。开始下一次计算时请核对并替换表单参数。</p><p>收藏工具保存在本机。离线缓存仅包含应用资源，不含患者参数。托管平台可能记录 IP 等访问日志。</p></section></main>`,'settings');
  document.querySelector('#install').addEventListener('click',async()=>{if(installEvent){await installEvent.prompt();installEvent=undefined;if(route()==='settings')renderSettings();}else toast('在安卓 Chrome 菜单中选择“安装应用”或“添加到主屏幕”');});
  document.querySelector('#check-update').addEventListener('click',checkUpdate);renderUpdateOffer();
}
function renderUpdateOffer() {
  const el=document.querySelector('#update-offer');if(!el||!updateInfo)return;
  el.innerHTML=`<div class="update-card"><strong>新版 ${escape(updateInfo.version)} 已准备好</strong><p>${escape(updateInfo.notes)}</p><p>更新会清空当前参数与结果。请完成当前计算后再更新。</p><button id="apply-update" class="primary full">确认更新并重新打开</button></div>`;
  document.querySelector('#apply-update').addEventListener('click',()=>{if(!registration?.waiting){toast('更新状态已变化，请重新检查');return;}reloadApproved=true;registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});});
}
function render() {const r=route();if(r==='neuro'||r.startsWith('neuro/')){renderNeuro({shell,icon,escape,favorites,toggleFavorite},r);return;}if(r==='glucose'||r.startsWith('glucose/')){renderGlucose({shell,icon,escape,favorites,toggleFavorite},r);return;}if(r==='category/weight'||r.startsWith('tool/'))renderWeight();else if(r==='favorites')renderFavorites();else if(r==='settings')renderSettings();else renderHome();}
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
window.addEventListener('pagehide',()=>{patient.height='';patient.weight='';patient.sex='';results={};});
window.addEventListener('pageshow',e=>{if(e.persisted)render();});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;if(route()==='settings')renderSettings();});

function workerMessage(worker, type) {
  return new Promise((resolve, reject) => {
    if (!worker) { reject(new Error('离线服务尚未启动')); return; }
    const ch = new MessageChannel(); const timer = setTimeout(() => reject(new Error('检查超时，请稍后再试')), 6000);
    ch.port1.onmessage = e => { clearTimeout(timer); ch.port1.close(); resolve(e.data); };
    worker.postMessage({ type }, [ch.port2]);
  });
}
async function inspectWaiting() {
  if (!registration?.waiting) return;
  try {
    const info = await workerMessage(registration.waiting, 'VERSION');
    if (info.version === VERSION) return;
    const changed = updateInfo?.version !== info.version;
    updateInfo = info; renderUpdateOffer();
    if (changed) toast('新版已准备好，可到设置中查看并更新');
  } catch { /* manual check can retry */ }
}
async function syncOfflineState() {
  try { const info = await workerMessage(navigator.serviceWorker.controller, 'CACHE_READY'); offlineReady = info.ready === true; }
  catch { offlineReady = false; }
  const el = document.querySelector('#offline-status'); if (el) el.textContent = offlineReady ? '离线资源已就绪，可在断网时重新打开。' : '离线资源尚未就绪，请保持联网并等待缓存完成。';
}
async function checkUpdate() {
  const status = document.querySelector('#update-status'); const b = document.querySelector('#check-update');
  if (!registration) { status.textContent = '离线服务尚未启动；请通过 HTTPS 或 localhost 访问。'; return; }
  b.disabled = true; status.textContent = '正在检查…';
  try {
    // A real network request distinguishes offline use from an unchanged worker.
    const response = await fetch(new URL('./version.json', location.href), { cache: 'no-store' });
    if (!response.ok) throw new Error('network');
    const version = await response.json();
    await registration.update(); await inspectWaiting();
    updateNote = updateInfo ? '新版已就绪，请查看下方更新说明。' : version.version !== VERSION ? '发现新版，正在准备资源；完成后会提示。' : '当前已是最新版本。';
  } catch { updateNote = '暂时无法连接更新服务。可继续使用当前版本，稍后再试。'; }
  status.textContent = updateNote; b.disabled = false;
}
async function setupOffline() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloadApproved) location.reload(); else syncOfflineState(); });
  try {
    registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed') { inspectWaiting(); syncOfflineState(); }
        if (worker.state === 'redundant') {
          updateNote = '新版资源下载失败，已保留当前版本。请稍后重试。';
          const status = document.querySelector('#update-status'); if (status) status.textContent = updateNote;
        }
      });
    });
    await navigator.serviceWorker.ready; await syncOfflineState(); await inspectWaiting();
  } catch { updateNote = '离线服务启动失败，请联网后重新打开。'; }
}
render(); setupOffline();

function glucoseShortcut(){return '<a class="tool-card glucose-shortcut" href="#glucose"><span class="tool-icon">'+icon('drop')+'</span><span class="card-copy"><strong>围术期血糖管理</strong><span>按情况查处理步骤与复测要求</span></span>'+icon('arrow','chevron')+'</a>';}
function toggleFavorite(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];try{localStorage.setItem('anesthesia:favorites',JSON.stringify(favorites));}catch{toast('偏好仅在当前会话有效');}return favorites.includes(id);}

function neuroShortcut(){return '<a class="tool-card neuro-shortcut" href="#neuro"><span class="tool-icon">'+icon('person')+'</span><span class="card-copy"><strong>脊髓损伤神经功能评估</strong><span>ISNCSCI 2026 · 查体、分类与中文图表</span></span>'+icon('arrow','chevron')+'</a>';}
