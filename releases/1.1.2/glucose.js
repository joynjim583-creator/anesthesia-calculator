// Clinical decision support TEST release. Facts are paraphrased from the three supplied PDFs.
// This module never infers DKA/HHS exclusion or generates an insulin prescription.
export const sources = {
  cpoc: {name:'CPOC 2023', title:'Guideline for Perioperative Care for People with Diabetes Mellitus Undergoing Elective and Emergency Surgery', location:'文内 p13、23–28、38–39（PDF 页码比文内多 1）', url:'https://www.cpoc.org.uk/sites/cpoc/files/documents/2024-03/CPOC-DiabetesGuideline2023.pdf'},
  ada: {name:'ADA 2026', title:'Diabetes Care in the Hospital: Standards of Care in Diabetes—2026', location:'推荐 16.4a/b、16.5a/b、16.15；Perioperative Care；Hypoglycemia',url:decodeURIComponent('https://doi.org/10%2E2337/dc26-S016')},
  samba: {name:'SAMBA 2024', title:'Society for Ambulatory Anesthesia Updated Consensus Statement on Perioperative Blood Glucose Management in Adult Patients With Diabetes Mellitus Undergoing Ambulatory Surgery', location:'所供 PDF p5 表1、p10–13 术中监测与治疗章节；Anesth Analg 139:459–477',url:decodeURIComponent('https://doi.org/10%2E1213/ANE.0000000000006791')}
};
export const paths = {
  cpoc:{label:'普通手术 · CPOC',target:'术中 6–12 mmol/L；VRIII 通常以 6–10 为目标',threshold:'>12 mmol/L 进入高血糖处理流程',scope:'成人糖尿病患者择期或急诊手术'},
  ada:{label:'住院围术期 · ADA',target:'围术期 5.6–10.0 mmol/L；多数 ICU 患者 7.8–10.0',threshold:'持续 ≥10.0 mmol/L 考虑启动或加强治疗',scope:'住院成人；包含糖尿病或应激性高血糖'},
  samba:{label:'日间手术 · SAMBA',target:'按患者及手术特点，可采用 180–250 mg/dL（约 10.0–13.9 mmol/L）的宽松术中目标',threshold:'未用过胰岛素者 >250 mg/dL 时可考虑胰岛素；不是人人适用的硬阈值',scope:'成人糖尿病患者日间手术；不外推至普通大手术或 ICU'}
};
function glucoseNumber(raw) {
  const s=String(raw??'').trim();
  if(s.length>18||! /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)||!Number.isFinite(Number(s))||Number(s)<=0)throw new Error('请输入大于 0 的有效血糖数值（mmol/L）');
  return Number(s);
}
export function assessGlucose(input) {
  const g=glucoseNumber(input.glucose);
  if(input.adult!=='yes')throw new Error('请确认患者为成人且非妊娠；儿童和妊娠需专用路径');
  if(!Object.hasOwn(paths,input.path))throw new Error('请选择指南路径');
  if(!['none','t1','t2','unknown'].includes(input.diabetes))throw new Error('请选择糖尿病情况');
  if(!['none','sc','iv','pump'].includes(input.therapy))throw new Error('请选择当前胰岛素治疗');
  if(!['no','yes','unknown'].includes(input.crisis))throw new Error('请选择急性代谢失代偿评估状态');
  const source=input.path, result=(level,title,steps,follow)=>({level,title,steps,follow,source,glucose:g});
  if(g<3.9 || (source==='cpoc'&&g<4))return result('urgent','立即进入低血糖处理',[
    '停止常规高血糖纠正流程，按院内低血糖方案及时处理；麻醉或禁食患者使用静脉途径。',
    'CPOC 低血糖阈值 <4.0；ADA 为 <3.9 mmol/L。核对胰岛素、含糖底物与管路。',
    '若同时怀疑其他急性失代偿，应同步评估，不能只纠正血糖。'
  ],'处理后 10–15 分钟复测（CPOC）；未纠正时继续按低血糖流程处理。');
  if(input.crisis==='yes')return result('urgent','优先排查急性代谢失代偿',[
    '疑似 DKA / HHS 或其他急性失代偿，转入专用急症流程；本页不能凭血糖确诊或排除。',
    '结合血酮、血气酸碱、电解质、容量和渗透压评估，联系相关团队。',
    'SGLT2 抑制剂相关 DKA 可在血糖不明显升高时出现；不套用普通皮下纠正或 VRIII 速查表。'
  ],'复测与治疗按急症路径执行，不等待常规复测间隔。');
  if(g<4)return result('caution','接近低血糖，先复核处理',[
    '当前值在 3.9–<4.0 mmol/L：低于 CPOC 处理阈值，虽未低于 ADA 的 3.9，仍需及时核对并避免继续降糖。',
    '按本院方案处理；麻醉状态不能依赖主观低血糖症状。'
  ],'若按低血糖处理，10–15 分钟复测；持续下降需立即干预。');
  if(g<6&&input.therapy!=='none')return result('caution','警惕治疗相关低血糖',[
    'CPOC 提示：使用降糖药时 4–6 mmol/L 可为临近低血糖，应复核胰岛素及底物供应。',
    '不要继续按高血糖纠正追加胰岛素；1型患者不能无替代安排地停掉全部基础胰岛素。'
  ],'按趋势及院内方案加密复测；已治疗低血糖则 10–15 分钟复测。');
  if(source!=='ada'&&['none','unknown'].includes(input.diabetes))return result('caution','先确认该指南适用人群',[
    `${sources[source].name} 此路径针对糖尿病患者；当前为无已知糖尿病或情况不明。`,
    '应激性高血糖可参考 ADA 住院路径并结合临床评估；不在后台自动切换指南或生成剂量。'
  ],'明确诊断及适用场景后重新评估，血糖异常时加密监测。');
  const high=source==='cpoc'?g>12:source==='ada'?g>=10:g*18>250;
  if(high&&input.crisis==='unknown')return result('caution','达到评估阈值，先核对急症风险',[
    paths[source].threshold+'。',
    '尚未完成急性代谢失代偿评估，不直接转为常规给药指令。',
    'CPOC：病情不佳或血糖 >13 mmol/L 时测血酮；SGLT2 抑制剂使用者即使血糖不高也需警惕酮症。'
  ],'先补充必要评估并安排复测；疑似急症时立即转入专用流程。');
  if(high&&input.therapy==='pump')return result('caution','核对胰岛素泵与替代方案',[
    '检查 CSII 管路、连接及泵工作状态；皮下泵中断可导致胰岛素缺乏。',
    '按泵管理及院内流程处理，不能在不了解现有输注的情况下直接叠加纠正剂量。'
  ],'按泵方案加密监测；无法安全持续使用时安排替代胰岛素方案。');
  if(high&&input.therapy==='iv')return result('action','按现行静脉方案复核与滴定',[
    '核对胰岛素浓度、当前泵速、管路、含糖底物、前次血糖及变化趋势。',
    '使用已验证的院内静脉滴定流程；本页的 CPOC 表仅供对应方案核对，不能用来自动追加静推或皮下注射。'
  ],'CPOC VRIII：至少每小时测血糖；不稳定或按本院方案需要时更频繁。');
  if(high&&source==='ada'&&input.persistent!=='yes')return result('caution','核实是否为持续高血糖',[
    'ADA 住院启动/加强治疗阈值为持续 ≥10.0 mmol/L，定义为 24小时内两次确认。',
    '单次结果需结合趋势、治疗及手术状态安排复测；这不意味着术中要等满24小时。',
    '本页不把单次超过围术期目标上限，自动等同于固定剂量的用药指令。'
  ],'术中按异常程度及现用治疗及时复测；有急性失代偿迹象则立即处理。');
  if(high)return result('action',source==='samba'?'可考虑治疗，需个体化选择':'达到该路径的干预条件',[
    source==='samba'?'SAMBA：未用过胰岛素者血糖 >250 mg/dL 时，可根据患者、手术及机构条件考虑胰岛素；已用胰岛素者需复核既有方案。':paths[source].threshold+'；核对诱因并选择适用的胰岛素方案。',
    input.therapy==='sc'?'已接受皮下胰岛素：先核对药物种类、最近剂量及时间，避免禁食时胰岛素叠加；不自动重复给药。':'若适用，可查皮下速效胰岛素纠正路径；持续/反复升高、长时间禁食等情况评估静脉输注。',
    input.diabetes==='t1'?'1型糖尿病必须保障基础胰岛素，转换治疗时避免中断。':'结合肾功能、低血糖风险、手术剩余时间及监测条件调整。'
  ],source==='samba'?'SAMBA：皮下速效胰岛素后 90–120 分钟内复测；低血糖时每15–30分钟监测至纠正。根据趋势和院内方案加密，不自动重复给药。':source==='cpoc'?'CPOC 皮下纠正后 1小时复测趋势；2小时后仍 >12 才按反应考虑重复。VRIII 至少每小时监测。':'按院内已验证的胰岛素方案安排复测与滴定；ADA 对静脉胰岛素通常要求每30分钟至2小时监测，按不稳定程度加密。');
  return result('monitor','暂未达到该路径的高血糖干预条件',[
    `当前路径：${paths[source].label}。${paths[source].target}。`,
    source==='samba'?'宽松目标的下限不是补糖阈值；不能因为血糖低于10就自动补糖。':'继续观察趋势并核对正在使用的降糖药物；未达到高血糖阈值不代表无需监测。',
    input.crisis==='unknown'?'急性失代偿状态尚未明确；不能仅凭当前血糖排除 DKA，特别是使用 SGLT2 抑制剂时。':'出现新的病情变化时重新评估，不仅依赖单次结果。'
  ],'CPOC 术中：使用胰岛素或促泌剂至少每小时，否则至少每2小时；异常时加密。SAMBA / ADA 需依各自场景安排，不能直接套用禁食病房的2–4小时频率。');
}

const empty=()=>({adult:'',path:'',glucose:'',diabetes:'',therapy:'',crisis:'',persistent:''});
let draft=empty(), assessment;
export function clearGlucose(){draft=empty();assessment=undefined;}
const topics=[['thresholds','干预阈值与目标','chart'],['sc','皮下胰岛素纠正','syringe'],['iv','静脉胰岛素输注','drop'],['hypo','低血糖处理','shield']];
export function renderGlucose(ctx, route) {
  const {shell,icon,escape:e}=ctx;
  const leaf=route.split('/')[1]||'home';
  const header=(title,back='glucose')=>`<header class="inner-header"><a class="back" href="#${back}">${icon('back')}${back==='home'?'首页':'血糖专题'}</a><span>1.1.2 测试版</span></header><div class="glucose-title"><span class="eyebrow">PERIOPERATIVE GLUCOSE</span><h1>${title}</h1></div>`;
  const note='<p class="clinical-note">成人非妊娠临床速查测试版 · 未经临床验收。规则提示需结合患者、原文与本院方案，不自动生成处方。</p>';
  const sourceBlock=(id)=>`<details class="panel disclosure"><summary>推荐依据与原文位置${icon('arrow')}</summary><div class="detail-content"><strong>${sources[id].name}</strong><p>${sources[id].location}</p><a href="${sources[id].url}" target="_blank" rel="noopener noreferrer">打开原文 ↗（联网）</a></div></details>`;
  const links=()=>topics.map(([id,title,ico])=>`<a class="tool-card" href="#glucose/${id}"><span class="tool-icon">${icon(ico)}</span><strong class="card-copy">${title}</strong>${icon('arrow','chevron')}</a>`).join('');
  const select=(name,label,options)=>`<label class="field" for="g-${name}"><span>${label}</span><select id="g-${name}" name="${name}"><option value="">请选择</option>${options.map(([v,l])=>`<option value="${v}" ${draft[name]===v?'selected':''}>${l}</option>`).join('')}</select></label>`;
  let body='';
  if(leaf==='home') {
    body=header('围术期血糖管理','home')+`<p class="subtitle">明确场景，再选择处理路径。</p>${note}<a href="#glucose/assess" class="primary start-assess">开始术中评估${icon('arrow')}</a><div class="section-heading"><h2>快速查阅</h2><button id="favorite-glucose" class="icon-button ${ctx.favorites.includes('glucose')?'is-favorite':''}" aria-label="收藏血糖专题" aria-pressed="${ctx.favorites.includes('glucose')}">${icon('star')}</button></div><div class="tool-list">${links()}<a class="tool-card" href="#glucose/sources">${icon('shield')}<strong class="card-copy">指南与共识</strong>${icon('arrow','chevron')}</a></div>`;
  } else if(leaf==='assess') {
    body=header('术中血糖评估')+note+`<form id="glucose-form" class="panel" novalidate>${select('path','指南路径（不合并阈值）',Object.entries(paths).map(([id,p])=>[id,p.label]))}<p class="path-hint" id="g-path-hint">${draft.path?e(paths[draft.path].scope):'先选择适用人群与指南路径。'}</p><label class="field" for="g-glucose"><span>当前血糖</span><span class="input-unit"><input id="g-glucose" name="glucose" type="text" inputmode="decimal" autocomplete="off" placeholder="请输入" value="${e(draft.glucose)}"><span>mmol/L</span></span></label>${select('diabetes','糖尿病情况',[['t1','1型糖尿病'],['t2','2型糖尿病'],['none','无已知糖尿病'],['unknown','不明确']])}${select('therapy','当前胰岛素治疗',[['none','未使用'],['sc','皮下注射（需另核对最近剂量与时间）'],['iv','静脉输注'],['pump','皮下胰岛素泵 CSII']])}${select('crisis','急性代谢失代偿评估',[['unknown','未明确 / 尚待评估'],['yes','怀疑 DKA、HHS 或其他急性失代偿'],['no','经临床评估暂不支持急性失代偿']])}${select('persistent','是否持续高血糖（ADA 路径使用）',[['unknown','尚不明确 / 单次测值'],['yes','24小时内两次 ≥10.0 mmol/L'],['no','未满足上述持续标准']])}<label class="adult-check"><input name="adult" type="checkbox" value="yes" ${draft.adult==='yes'?'checked':''}>确认成人且非妊娠；已核对当前患者参数</label><div id="g-error" class="error" role="alert" hidden></div><button class="primary full" type="submit">评估处理路径</button></form><p class="small-copy">输入只保留在运行内存；修改任何参数后需重新评估。低血糖或急性失代偿无需等待完成本页。</p>`;
  } else if(leaf==='result') {
    if(!assessment){location.hash='glucose/assess';return;}
    const r=assessment;
    body=header('评估与下一步')+`<div class="panel assessment-meta"><strong>${e(paths[r.source].label)}</strong><p>本次血糖：${e(draft.glucose)} mmol/L · ${e({t1:'1型糖尿病',t2:'2型糖尿病',none:'无已知糖尿病',unknown:'糖尿病情况不明确'}[draft.diabetes])}</p></div><section class="assessment-box ${r.level}" role="status"><span>当前评估</span><h2>${e(r.title)}</h2></section><section class="panel"><h2>下一步处理</h2><ol class="action-steps">${r.steps.map(s=>`<li>${e(s)}</li>`).join('')}</ol></section><section class="panel follow-card"><h2>复测与升级处理</h2><p>${e(r.follow)}</p></section><a class="secondary full change-assess" href="#glucose/assess">返回修改参数 / 重新评估</a><div class="quick-path-links"><a href="#glucose/sc">皮下纠正速查</a><a href="#glucose/iv">静脉输注速查</a><a href="#glucose/hypo">低血糖处理</a></div>${sourceBlock(r.source)}<p class="small-copy">低血糖提示及 CPOC 复测补充规则另见对应速查页，非当前指南的自动剂量指令。</p>${note}`;
  } else if(leaf==='thresholds') {
    body=header('干预阈值与目标')+note+Object.entries(paths).map(([id,p])=>`<section class="panel reference-card"><span class="method-badge">${sources[id].name}</span><h2>${p.label}</h2><p>${p.scope}</p><h3>目标范围</h3><p>${p.target}</p><h3>启动 / 加强治疗条件</h3><p>${p.threshold}</p>${id==='ada'?'<p>持续：24小时内两次确认。该住院定义不表示术中必须等待24小时；围术期目标上限不等于单次测值的固定用药阈值。</p>':id==='samba'?'<p>250 mg/dL ÷18 ≈13.9 mmol/L。评估按未舍入值比较。宽松目标不能外推到所有住院手术，低于10不等于需要补糖。</p>':'<p>血糖 >13 或病情不佳需评估血酮；SGLT2 相关酮症不依赖明显高血糖。</p>'}</section>${sourceBlock(id)}`).join('');
  } else if(leaf==='sc') {
    body=header('皮下胰岛素纠正')+note+`<section class="panel reference-card"><span class="method-badge">CPOC 2023 · 文内 p27–28</span><h2>先核对是否适用</h2><p>针对成人糖尿病患者。先排查 DKA / HHS；疑似急症转专用流程。核对糖尿病类型、最近胰岛素种类 / 剂量 / 时间、肾功能及监测条件。</p><h3>原文的剂量表述</h3><p>皮下使用速效胰岛素类似物；章节总述为 2–6 units，按随后条件选择。</p><p>1型：以 1 unit 约降低 3 mmol/L 为假设，尽可能使用患者既有纠正经验及个体敏感性。</p><p>2型：原文列出 0.1 units/kg。</p><div class="source-caution">原文总述与按体重规则可能给出不同范围；测试版并列保留，不自动计算、限幅、取整或外推为静脉剂量。需结合原文和本院方案确认。</div><h3>复测与重复给药</h3><p>1小时复测是否下降；2小时后仍 >12 mmol/L 才结合反应考虑重复。注意禁食时剂量叠加，不直接自动加倍；效果不佳评估 VRIII。</p><p>已有静脉输注或 CSII 时按现有方案处理，不直接叠加本页皮下方案。</p></section>${sourceBlock('cpoc')}`;
  } else if(leaf==='iv') {
    body=header('静脉胰岛素输注')+note+`<section class="panel reference-card"><span class="method-badge">CPOC 2023 · 文内 p23–25、39</span><h2>VRIII 适应情况</h2><p>包括禁食超过一餐、1型未获基础胰岛素、多数糖尿病急诊手术，或急性失代偿背景下持续高血糖等。疑似 DKA / HHS 使用专用方案，不用本表替代。</p><h3>浓度与泵速必须对应</h3><p>原文为可溶性人胰岛素 50 units 配至 50 mL，即 1 unit/mL。下表按此浓度，units/h 与 mL/h 数值相同；浓度不同不能直接套用。</p><div class="table-scroll"><table class="clinical-table"><caption>原文分档速查（非自动滴定）</caption><thead><tr><th>血糖 mmol/L</th><th>减量</th><th>标准</th><th>增量</th></tr></thead><tbody>${[['<6.0','0*','0*','0*'],['6.1–8.0','0.5','1','2'],['8.1–11.0','1','2','4'],['11.1–15.0','2','4','6'],['15.1–20.0','3','5','7'],['20.1–28.0','4','6','8'],['≥28.1','6','8','10']].map(row=>`<tr>${row.map(c=>`<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p>减量：原文举例为虚弱老年、肾病或通常每日用量 <24 units；增量：原文举例为每日 >100 units 或 BMI >35。标准通常为初选，仍需医师判断。</p><div class="source-caution">原表按一位小数分档，未覆盖的精确边界（如 6.0）不在测试版自行补齐，也不自动选择泵速。*低值时按原文处理、复测并安排恢复或替代胰岛素；1型患者避免基础供应中断。</div><h3>监测与配套处理</h3><p>至少每小时测血糖；核对血钾、电解质及容量，按原方案配套含糖、钠及钾的底物液。不能只看到泵速而忽略配套液体，也不统一给所有患者补钾。</p><p>需结合前次血糖、变化趋势、当前泵速及低血糖风险滴定，不根据一次血糖直接静推或加倍。</p></section>${sourceBlock('cpoc')}`;
  } else if(leaf==='hypo') {
    body=header('低血糖处理')+`<section class="assessment-box urgent"><span>及时处理，不依赖麻醉中的症状</span><h2>CPOC：<4.0 mmol/L<br>ADA：<3.9 mmol/L</h2></section><section class="panel reference-card"><h2>成人麻醉 / 禁食场景</h2><p>进入院内低血糖流程，核对正在输注的胰岛素及底物，使用静脉葡萄糖；麻醉患者不经口喂糖。</p><p>CPOC 原文列举 10% 葡萄糖 150–200 mL，15分钟输入（15–20 g）。液体量结合容量状态调整，核对泵设置，防止整袋误输。</p><h3>10–15 分钟复测</h3><p>若仍 <4 mmol/L，按原流程再次处理；持续不纠正需升级处理。使用长效胰岛素或磺脲类、肾功能受损时警惕复发。</p><p>治疗后重审胰岛素与底物安排；1型患者不能在没有替代计划时长时间停掉全部胰岛素。</p></section>${sourceBlock('cpoc')}${sourceBlock('ada')}${note}`;
  } else if(leaf==='sources') {
    body=header('指南与共识')+note+Object.entries(sources).map(([id,s])=>`<section class="panel reference-card"><span class="method-badge">${s.name}</span><h2>${e(s.title)}</h2><p>${e(s.location)}</p><a class="source-link" href="${s.url}" target="_blank" rel="noopener noreferrer">打开官方原文 ↗</a></section>`).join('')+'<p class="small-copy">内容依据用户提供的三份 PDF 人工整理，非指南原文全文。版本整理日期：2026-11-03。页面摘要可离线查看，原文链接需联网。</p>';
  } else {location.hash='glucose';return;}
  shell(`<main id="main">${body}</main>`,'home','glucose-shell');
  const fav=document.querySelector('#favorite-glucose'); if(fav)fav.addEventListener('click',()=>{const on=ctx.toggleFavorite('glucose');fav.classList.toggle('is-favorite',on);fav.setAttribute('aria-pressed',String(on));});
  const form=document.querySelector('#glucose-form');
  if(form){
    form.addEventListener('input',event=>{const el=event.target;if(!Object.hasOwn(draft,el.name))return;draft[el.name]=el.type==='checkbox'?(el.checked?'yes':''):el.value;assessment=undefined;document.querySelector('#g-error').hidden=true;if(el.name==='path')document.querySelector('#g-path-hint').textContent=paths[draft.path]?.scope||'先选择适用人群与指南路径。';});
    form.addEventListener('submit',event=>{event.preventDefault();try{assessment=assessGlucose(draft);location.hash='glucose/result';}catch(err){assessment=undefined;const el=document.querySelector('#g-error');el.hidden=false;el.textContent=err.message;}});
  }
}
