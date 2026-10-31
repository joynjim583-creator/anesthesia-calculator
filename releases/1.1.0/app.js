import { tools, calculate } from './formulas.js';

const VERSION = '1.1.0';
const app = document.querySelector('#app');
const patient = { height: '', weight: '', sex: '' };
let results = {}, query = '', registration, installEvent, reloadApproved = false;
let offlineReady = false, updateInfo, updateNote = '';
let favorites = [];
try { const v = JSON.parse(localStorage.getItem('anesthesia:favorites') || '[]'); if (Array.isArray(v)) favorites = v.filter(id => tools.some(t => t.id === id)); } catch { /* storage may be unavailable */ }
const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
  settings: '<path d="m9 3-1 3-3 1-2 4 2 3 1 4 4 3 3-1 4-1 3-4-1-3-1-4-4-3z"/><circle cx="12" cy="12" r="3"/>',
  person: '<circle cx="12" cy="6" r="3"/><path d="M5 21v-4a7 7 0 0 1 14 0v4z"/>',
  scale: '<rect x="4" y="3" width="16" height="18" rx="4"/><path d="M8 7h8l-1 5H9zM12 7l1 3"/>',
  chart: '<path d="M4 3v17h17M8 15v-3m5 3V8m5 7V5"/>',
  lungs: '<path d="M10 4v8m4-8v8M8 7C4 8 2 14 3 19c1 2 5 2 7-1V9m6-2c4 1 6 7 5 12-1 2-5 2-7-1V9M10 12l-3 3m7-3 3 3"/>',
  drop: '<path d="M12 3S4 12 4 16a8 8 0 0 0 16 0c0-4-8-13-8-13z"/><path d="M7 16a5 5 0 0 0 5 5"/>',
  syringe: '<path d="m14 3 7 7M16 5 5 16l3 3L19 8M4 20l-2 2m2-6 4 4M10 11l3 3m0-6 3 3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>', back: '<path d="m15 5-7 7 7 7"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="m5 12 4 4L19 6"/>'
};
function icon(name, cls = '') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.person}</svg>`; }
function escape(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function route() { return location.hash.slice(1) || 'home'; }
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600); }
function newPatientButton() { return `<button class="new-patient" data-reset>${icon('plus')}新患者</button>`; }
function nav(active) { return `<nav class="bottom-nav" aria-label="主导航">${[['home','home','首页'],['favorites','star','收藏'],['settings','settings','设置']].map(([id, ico, label]) => `<a href="#${id}" ${active === id ? 'aria-current="page"' : ''}>${icon(ico)}<span>${label}</span></a>`).join('')}</nav>`; }
function search(placeholder) { return `<div class="search">${icon('search')}<input id="search" type="search" aria-label="${placeholder}" placeholder="${placeholder}" autocomplete="off" value="${escape(query)}"></div>`; }
function toolCard(t) { return `<a class="tool-card" href="#tool/${t.id}"><span class="tool-icon">${icon(t.icon)}</span><span class="card-copy"><strong>${t.name}<small>${t.code}</small></strong><span>${t.description}</span></span>${icon('arrow', 'chevron')}</a>`; }
function toolList(list) { return list.length ? list.map(toolCard).join('') : '<div class="empty">没有找到工具<br><span>试试中文名称、BMI 或 PBW</span></div>'; }
function filter(list) { const q = query.toLowerCase().trim(); return list.filter(t => `${t.name} ${t.code} ${t.en} ${t.description}`.toLowerCase().includes(q)); }
function shell(content, active, calculator = false) {
  app.innerHTML = `<div class="app-shell ${calculator ? 'calculator-shell' : ''}">${content}${calculator ? '' : nav(active)}<footer class="page-foot">${icon('shield')}参数仅在本机处理 · 默认不保存记录</footer></div>`;
  document.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => document.querySelector('#reset-dialog').showModal()));
}
function renderHome() {
  shell(`<header class="home-header"><div class="brand-line"><span class="brand-symbol">${icon('plus')}</span><span>ANESTHESIA TOOLS</span><span class="version-pill">v${VERSION}</span></div><div class="title-row"><h1>麻醉计算助手</h1>${newPatientButton()}</div><p class="subtitle">让每一次计算，清晰可核对。</p></header><main id="main"><div class="edition">${icon('check')}1.1 预览版<span>体重计算 · ${tools.length} 项工具</span></div>${search('搜索计算工具')}<div id="home-content"></div></main>`, 'home');
  updateHomeContent(); bindSearch(updateHomeContent);
}
function updateHomeContent() {
  const el = document.querySelector('#home-content');
  if (query.trim()) { el.innerHTML = `<div class="section-heading"><h2>搜索结果</h2><span>${filter(tools).length} 项</span></div><div class="tool-list">${toolList(filter(tools))}</div>`; return; }
  const quick = [tools.find(t => t.id === 'bmi'), tools.find(t => t.id === 'ibw')];
  el.innerHTML = `<div class="section-heading"><h2>常用工具</h2><span>快速进入</span></div><div class="quick-grid">${quick.map(t => `<a class="quick-card" href="#tool/${t.id}">${icon(t.icon)}<strong>${t.name}</strong><span>${t.code}${icon('arrow')}</span></a>`).join('')}</div><div class="section-heading"><h2>全部分类</h2><span>按场景查找</span></div><div class="categories"><a class="category-card available" href="#category/weight"><span class="category-icon">${icon('person')}</span><span class="card-copy"><strong>体重与体型</strong><span>BMI、标准体重、瘦体重等</span></span><span class="category-end"><small>${tools.length} 项工具</small>${icon('arrow')}</span></a>${[['lungs','气道管理','导管型号、置入深度等'],['drop','液体管理','补液量、维持液体等'],['syringe','药物换算','剂量、浓度、输注速率等']].map(([ico,name,desc]) => `<div class="category-card upcoming"><span class="category-icon">${icon(ico)}</span><span class="card-copy"><strong>${name}</strong><span>${desc}</span></span><span class="coming-badge">后续版本</span></div>`).join('')}</div><p class="preview-note">预览版用于公式与交互核对；各工具的适用范围见详情。</p>`;
}
function bindSearch(update) { document.querySelector('#search').addEventListener('input', e => { query = e.target.value; update(); }); }
function renderCategory() {
  shell(`<header class="inner-header"><a href="#home" class="back">${icon('back')}首页</a><span>体重与体型</span>${newPatientButton()}</header><main id="main"><div class="page-intro"><span class="eyebrow">BODY WEIGHT</span><h1>体重与体型</h1><p>五种指标，分别计算、清楚区分。</p></div>${search('搜索体重工具')}<div class="section-heading"><h2>体重计算</h2><span>${tools.length} 项工具</span></div><div class="tool-list" id="tool-list"></div><p class="preview-note">不同体重指标不相互替代。给药、补液及潮气量计算不属于当前版本。</p></main>`, 'home');
  const update = () => document.querySelector('#tool-list').innerHTML = toolList(filter(tools)); update(); bindSearch(update);
}
function fieldMarkup(field) {
  if (field === 'sex') return `<fieldset class="sex-field"><legend>公式性别分支 <span>必选</span></legend><div class="segment">${[['male','男性'],['female','女性']].map(([v,l]) => `<label><input type="radio" name="sex" value="${v}" ${patient.sex === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>`;
  const label = field === 'height' ? '身高' : '实际体重', unit = field === 'height' ? 'cm' : 'kg';
  return `<label class="field" for="${field}"><span>${label}</span><span class="input-unit"><input id="${field}" name="${field}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="请输入${label}" value="${escape(patient[field])}" aria-describedby="${field}-unit"><span id="${field}-unit">${unit}</span></span></label>`;
}
function resultMarkup(t) {
  const r = results[t.id];
  if (!r) return `<div class="result-value placeholder">— — <span>${t.id === 'bmi' ? 'kg/m²' : 'kg'}</span></div><p>输入参数后，点击计算</p>`;
  return `<div class="result-value">${r.display} <span>${r.unit}</span></div>${r.category ? `<span class="bmi-label ${r.category === '正常' ? 'normal' : ''}">${r.category}</span><p class="rounding-note">分级按未舍入值判定，显示值保留 1 位小数</p>` : `<p>按所选公式计算</p>`}`;
}
function renderTool(id) {
  const t = tools.find(t => t.id === id);
  if (!t) { location.hash = 'home'; return; }
  shell(`<header class="inner-header calculator-header"><a href="#category/weight" class="back">${icon('back')}体重与体型</a><button id="favorite" class="icon-button ${favorites.includes(id) ? 'is-favorite' : ''}" aria-label="${favorites.includes(id) ? '取消收藏' : '收藏工具'}" aria-pressed="${favorites.includes(id)}">${icon('star')}</button></header><main id="main"><div class="calculator-title"><span class="eyebrow">${t.en.toUpperCase()}</span><h1>${t.name}<span>${t.code}</span></h1><span class="method-badge">${t.method}</span></div><div class="scope-note">${t.id === 'bmi' ? '成人分级' : '适用范围待核实'} · 预览版，供公式与交互核对</div><form id="calculator-form" class="panel" novalidate><div class="panel-heading"><h2>输入参数</h2><button class="text-button" type="button" data-reset>新患者 / 清空</button></div>${t.fields.map(fieldMarkup).join('')}<div id="form-error" class="error" role="alert" hidden></div><button class="primary calculate-button" type="submit">计算${icon('arrow')}</button></form><section class="panel result-panel" aria-labelledby="result-title"><div class="panel-heading"><h2 id="result-title">计算结果</h2><span class="local-badge">本地计算</span></div><div class="result-box" id="result" aria-live="polite">${resultMarkup(t)}</div></section><details class="panel disclosure"><summary>公式与计算过程${icon('arrow')}</summary><div class="detail-content"><h3>计算公式</h3><pre>${escape(t.formula)}</pre><h3>本次使用参数</h3><p id="used-inputs">${inputSummary(t)}</p><h3>代入过程</h3><pre id="steps">${escape(results[id]?.steps || '完成计算后显示。')}</pre><p>H：身高（cm）；W：实际体重（kg）。中间值不舍入，结果保留 1 位小数。</p></div></details><details class="panel disclosure"><summary>适用范围与来源${icon('arrow')}</summary><div class="detail-content"><p>${t.scope}</p><p>公式依据：用户工作文档《体重计算模块开发交接》，2026-10-31。当前为实现核对版，尚未完成适用范围与临床案例核验。</p>${t.id === 'bmi' ? `<h3>成人 BMI 分级</h3><ul class="bmi-ranges"><li>偏瘦：BMI &lt; 18.5</li><li>正常：18.5 ≤ BMI &lt; 24</li><li>超重：24 ≤ BMI &lt; 28</li><li>肥胖：BMI ≥ 28</li></ul><p>分级与国家卫生健康委发布的成人标准一致。</p><a href="https://www.nhc.gov.cn/xcs/c100122/202503/27b26d397f4941ff8ff3846ef40026ee.shtml" target="_blank" rel="noopener noreferrer">查看分级参考来源 ↗（联网）</a>` : ''}<p>当前工具不建议用药剂量、补液量或潮气量，也不会自动选择下游计算所用的体重指标。</p></div></details></main>`, '', true);
  document.querySelector('#favorite').addEventListener('click', () => {
    favorites = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    try { localStorage.setItem('anesthesia:favorites', JSON.stringify(favorites)); } catch { toast('浏览器禁止保存偏好，本次收藏仅在当前会话有效'); }
    const b = document.querySelector('#favorite'), selected = favorites.includes(id); b.classList.toggle('is-favorite', selected); b.setAttribute('aria-pressed', String(selected)); b.setAttribute('aria-label', selected ? '取消收藏' : '收藏工具');
  });
  const form = document.querySelector('#calculator-form');
  form.addEventListener('input', e => {
    if (!t.fields.includes(e.target.name)) return;
    patient[e.target.name] = e.target.value; results = {};
    document.querySelector('#result').innerHTML = resultMarkup(t);
    document.querySelector('#steps').textContent = '参数已变更，请重新计算。';
    document.querySelector('#used-inputs').textContent = inputSummary(t);
    document.querySelector('#form-error').hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  });
  form.addEventListener('submit', e => {
    e.preventDefault(); const error = document.querySelector('#form-error');
    try {
      results[id] = calculate(id, patient); error.hidden = true;
      document.querySelector('#result').innerHTML = resultMarkup(t);
      document.querySelector('#steps').textContent = results[id].steps;
      document.querySelector('#used-inputs').textContent = inputSummary(t);
    } catch (err) {
      delete results[id]; document.querySelector('#result').innerHTML = resultMarkup(t);
      document.querySelector('#steps').textContent = '请核对输入与适用范围后重新计算。';
      error.textContent = err.message; error.hidden = false;
    }
  });
}
function inputSummary(t) {
  return t.fields.map(f => f === 'sex' ? `性别分支：${patient.sex === 'male' ? '男性' : patient.sex === 'female' ? '女性' : '未选择'}` : `${f === 'height' ? '身高' : '实际体重'}：${patient[f] || '未输入'} ${f === 'height' ? 'cm' : 'kg'}`).join('；');
}
function renderFavorites() {
  shell(`<header class="title-row simple-header"><h1>收藏工具</h1>${newPatientButton()}</header><main id="main"><p class="subtitle">把常用的计算，放在触手可及处。</p><div class="tool-list">${favorites.length ? toolList(tools.filter(t => favorites.includes(t.id))) : `<div class="empty favorite-empty">${icon('star')}<h2>还没有收藏工具</h2><span>进入计算器，点击右上角星标即可收藏。</span><a href="#category/weight" class="secondary">浏览体重工具</a></div>`}</div><p class="preview-note">仅保存工具偏好，不保存患者参数和结果。</p></main>`, 'favorites');
}
function renderSettings() {
  shell(`<header class="title-row simple-header"><h1>设置</h1></header><main id="main"><p class="subtitle">离线使用，更新由你决定。</p><section class="panel settings-panel"><div class="settings-brand"><span class="brand-symbol">${icon('plus')}</span><div><h2>麻醉计算助手</h2><span>1.1 预览版 · ${VERSION}</span></div></div><h3>本版内容</h3><p>五项体重指标；已移除“实际体重”独立工具。BMI 与瘦体重所需的实际体重输入继续保留。</p><p class="preview-note">公式适用范围及用户核对案例仍需确认。</p></section><section class="panel settings-panel"><h2>安装与离线</h2><p id="offline-status">${offlineReady ? '离线资源已就绪，可在断网时重新打开。' : '离线资源尚未就绪，请保持联网并等待缓存完成。'}</p><button id="install" class="secondary full">${installEvent ? '安装到设备' : '查看安装方式'}</button><p class="small-copy">安卓 Chrome：菜单 → 安装应用 / 添加到主屏幕。安装和离线就绪需分别确认。</p></section><section class="panel settings-panel"><h2>版本更新</h2><p>当前版本 ${VERSION}。新版准备好后，经你确认再刷新。</p><button id="check-update" class="secondary full">检查更新</button><div id="update-status" role="status">${escape(updateNote)}</div><div id="update-offer"></div></section><section class="panel settings-panel"><h2>隐私与数据</h2><p>计算参数仅在当前设备处理；默认不保存计算记录。不提供姓名、住院号等身份信息输入。</p><p>身高、体重与性别分支可在工具间临时复用，均显示在当前表单中。点击“新患者”清空全部参数与结果；页面重新加载后不恢复。</p><p>收藏工具保存在本机。离线缓存仅包含应用资源，不含患者参数。</p><p>若通过 GitHub Pages 访问，托管平台可能记录 IP 等访问日志。</p><button class="secondary full" data-reset>新患者 / 清空当前参数</button></section></main>`, 'settings');
  document.querySelector('#install').addEventListener('click', async () => {
    if (installEvent) { await installEvent.prompt(); installEvent = undefined; renderSettings(); }
    else toast('在安卓 Chrome 菜单中选择“安装应用”或“添加到主屏幕”');
  });
  document.querySelector('#check-update').addEventListener('click', checkUpdate);
  renderUpdateOffer();
}
function renderUpdateOffer() {
  const el = document.querySelector('#update-offer'); if (!el || !updateInfo) return;
  el.innerHTML = `<div class="update-card"><strong>新版 ${escape(updateInfo.version)} 已准备好</strong><p>${escape(updateInfo.notes)}</p><p>更新会清空当前参数与结果。请完成当前计算后再更新。</p><button id="apply-update" class="primary full">确认更新并重新打开</button></div>`;
  document.querySelector('#apply-update').addEventListener('click', () => {
    if (!registration?.waiting) { toast('更新状态已变化，请重新检查'); return; }
    reloadApproved = true; registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
  });
}
function render() {
  const r = route();
  if (r.startsWith('tool/')) renderTool(r.split('/')[1]);
  else if (r === 'category/weight') renderCategory();
  else if (r === 'favorites') renderFavorites();
  else if (r === 'settings') renderSettings();
  else renderHome();
}
window.addEventListener('hashchange', () => { query = ''; render(); window.scrollTo(0,0); });
document.querySelector('#cancel-reset').addEventListener('click', () => document.querySelector('#reset-dialog').close());
document.querySelector('#confirm-reset').addEventListener('click', () => {
  patient.height = ''; patient.weight = ''; patient.sex = ''; results = {};
  document.querySelector('#reset-dialog').close(); render(); toast('已清空全部患者参数与结果');
});
window.addEventListener('pagehide', () => { patient.height = ''; patient.weight = ''; patient.sex = ''; results = {}; });
window.addEventListener('pageshow', e => { if (e.persisted) render(); });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; if (route() === 'settings') renderSettings(); });

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
