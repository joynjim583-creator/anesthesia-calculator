import { figures } from './figures.js';

// Case-first reference topic. No glucose inputs, patient triage or dose calculation.
export const sources = {
  cpoc:{name:'CPOC 2023',title:'Guideline for Perioperative Care for People with Diabetes Mellitus Undergoing Elective and Emergency Surgery',url:'https://www.cpoc.org.uk/sites/cpoc/files/documents/2024-03/CPOC-DiabetesGuideline2023.pdf'},
  ada:{name:'ADA 2026',title:'Diabetes Care in the Hospital: Standards of Care in Diabetes—2026',url:decodeURIComponent('https://doi.org/10%2E2337/dc26-S016')},
  samba:{name:'SAMBA 2024',title:'Perioperative Blood Glucose Management in Adult Patients With Diabetes Mellitus Undergoing Ambulatory Surgery',url:decodeURIComponent('https://doi.org/10%2E1213/ANE.0000000000006791')}
};
export const topics = [
  {id:'high',title:'术中发现血糖升高',subtitle:'先排急症 → 纠正 → 复测 → 必要时升级',icon:'drop',source:'CPOC p27–28'},
  {id:'iv',title:'需要静脉胰岛素输注',subtitle:'适应证、配置液体、分档表及安全要求',icon:'syringe',source:'CPOC p23–25、39'},
  {id:'hypo',title:'血糖下降或发生低血糖',subtitle:'及时处理 → 10–15 分钟复测 → 防复发',icon:'shield',source:'CPOC p25–27'},
  {id:'daycase',title:'日间手术如何处理高血糖',subtitle:'SAMBA 目标、治疗条件与复测要求',icon:'person',source:'SAMBA 2024'},
  {id:'crisis',title:'怀疑 DKA / HHS',subtitle:'独立急症路径 · ADA 原图与解读',icon:'shield',source:'ADA 图16.1'},
  {id:'overview',title:'围术期全程如何衔接',subtitle:'术前、术中、恢复与交接的原图解读',icon:'person',source:'CPOC 图1'}
];
export function renderGlucose(ctx,route){
  const {shell,icon,escape:e}=ctx;
  let leaf=route.split('/')[1]||'home';
  if(['assess','result'].includes(leaf)){location.hash='glucose';return;}
  if(leaf==='sc')leaf='high';
  const note='<p class="clinical-note">成人非妊娠处理流程速查 · 测试版，未经临床验收。使用时核对患者、原文与本院方案；疑似急症按专用流程处理。</p>';
  const header=(title,back='glucose')=>`<header class="inner-header"><a class="back" href="#${back}">${icon('back')}${back==='home'?'首页':'血糖专题'}</a><span>1.1.3 测试版</span></header><div class="glucose-title"><span class="eyebrow">PERIOPERATIVE GLUCOSE</span><h1>${title}</h1></div>`;
  const cite=(id,pages)=>`<details class="panel disclosure source-details"><summary>依据与原文位置${icon('arrow')}</summary><div class="detail-content"><strong>${sources[id].name} · ${e(pages)}</strong><p>以下中文步骤为按原文整理的解读；标为原图、原表或原文截图的内容来自用户提供的 PDF，图中文字保持原样。</p><a href="${sources[id].url}" target="_blank" rel="noopener noreferrer">打开原文 ↗（联网）</a></div></details>`;
  const flow=(steps,label='处理流程')=>`<section class="panel process-panel"><div class="panel-heading"><h2>${label}</h2><span class="local-badge">中文整理 · 非原图</span></div><ol class="process-flow">${steps.map(([title,body,extra=''])=>`<li><h3>${title}</h3><p>${body}</p>${extra}</li>`).join('')}</ol></section>`;
  const box=(title,text,kind='')=>`<aside class="process-callout ${kind}"><strong>${title}</strong><p>${text}</p></aside>`;
  const fig=(id)=>`<figure class="panel source-figure"><figcaption><span class="method-badge">${figures[id].kind}</span><h2>${figures[id].title}</h2></figcaption><button class="figure-preview" type="button" data-figure="${id}" aria-label="放大查看：${figures[id].title}"><img src="${figures[id].src}" alt="${figures[id].title}" loading="lazy" width="${figures[id].width}" height="${figures[id].height}"><span>点开原图 · 支持放大与滚动</span></button></figure>`;
  const related=(items)=>`<div class="section-heading"><h2>接下来可能要查</h2></div><div class="related-paths">${items.map(([id,text])=>`<a class="secondary" href="#glucose/${id}">${text}${icon('arrow')}</a>`).join('')}</div>`;
  const summary=(label,text)=>`<section class="case-summary"><span>${label}</span><p>${text}</p></section>`;
  let content='';
  if(leaf==='home'){
    content=header('围术期血糖管理','home')+'<p class="subtitle">遇到情况，直接查处理步骤。</p><div class="section-heading"><h2>按情况找处理流程</h2><button id="favorite-glucose" class="icon-button '+(ctx.favorites.includes('glucose')?'is-favorite':'')+'" aria-label="收藏血糖专题" aria-pressed="'+ctx.favorites.includes('glucose')+'">'+icon('star')+'</button></div><div class="case-list">'+topics.map((t,i)=>`<a class="case-card ${i===0?'featured':''} ${t.id==='crisis'?'urgent-case':''}" href="#glucose/${t.id}"><span class="case-number">${String(i+1).padStart(2,'0')}</span><span class="card-copy"><strong>${t.title}</strong><span>${t.subtitle}</span><small>${t.source}</small></span>${icon('arrow','chevron')}</a>`).join('')+'</div><div class="topic-utilities"><a href="#glucose/thresholds">指南目标与阈值对照</a><a href="#glucose/sources">三篇原文与图表说明</a></div>'+note;
  }else if(leaf==='high'){
    content=header('术中发现血糖升高')+summary('适用入口 · CPOC 成人糖尿病手术','血糖 >12 mmol/L 进入高血糖救援处理；不能只依据一个数值直接套用固定剂量。')+flow([
      ['先确认测值与诱因','复核血糖及趋势；检查采样是否被含糖液体污染、胰岛素是否遗漏或泵管路中断，并评估应激、感染等诱因。'],
      ['先排查 DKA / HHS','病情不佳或血糖 >13 mmol/L 时测血酮，结合血气酸碱、容量及渗透压评估。SGLT2 相关 DKA 可无明显高血糖。怀疑急症时转专用路径。','<a href="#glucose/crisis" class="inline-path">查看 DKA / HHS 原图与解读 →</a>'],
      ['核对现有胰岛素方案','使用 CSII 时先检查泵及管路。已静脉输注者复核当前滴定方案，不直接叠加皮下纠正。1型患者须保障基础胰岛素。'],
      ['排除急症后，选择纠正途径','适用时考虑皮下速效胰岛素类似物纠正；持续或反复高血糖、长时间禁食等情况，评估可变速率静脉输注（VRIII）。'],
      ['安排复测，再决定是否重复或升级','CPOC 皮下纠正后1小时复测趋势；2小时后仍 >12 mmol/L 才结合初次反应考虑重复。效果不佳评估 VRIII，不能因仍高就连续追加或自动加倍。']
    ])+box('先看流程，再看剂量','原文 p28 总述为2–6 units；1型以1 unit约降低3 mmol/L为假设并结合个体经验，2型列0.1 units/kg。这些表述可能产生不同剂量范围，需按原文及本院方案确认，不自动限幅、取整或外推为静脉剂量。')+fig('high')+fig('sc')+cite('cpoc','文内 p27–28；PDF p28–29')+related([['iv','需要泵注时：配置、分档与监测'],['hypo','纠正后血糖下降：低血糖处理'],['thresholds','非糖尿病或其他场景：查指南对照']])+note;
  }else if(leaf==='iv'){
    content=header('静脉胰岛素输注')+summary('VRIII · CPOC 文内 p23–25、39','先明确适应证与配套监测，再核对分档表；DKA/HHS 不使用普通 VRIII 表代替急症方案。')+flow([
      ['确认需要 VRIII','包括糖尿病患者禁食超过一餐、1型未获得基础胰岛素、多数糖尿病急诊手术，或急性失代偿背景下持续高血糖等。结合实际情况选择。'],
      ['配置胰岛素并核对浓度','CPOC 原方案：可溶性人胰岛素50 units配至50 mL，即1 unit/mL。只有该浓度下，表内 units/h 与 mL/h 数值相同。'],
      ['同时落实底物液及电解质安排','按原方案和患者情况配置含葡萄糖、钠及钾的底物液；结合血钾、肾功能、容量与液体限制调整，不能统一给所有患者补钾。'],
      ['结合敏感性与当前方案查分档','减量、标准、增量分档见原表；需同时核对当前泵速、前次血糖与趋势。不是根据一次血糖静推或自动加倍。'],
      ['至少每小时复测血糖','初始或不稳定时按院内方案加密；继续检查底物、管路和电解质。低值先处理并安排复测和后续胰岛素供应。'],
      ['停泵或转皮下前做好衔接','1型患者避免基础胰岛素中断，按院内转换方案衔接并继续监测。恢复饮食不等于立即无条件停泵。']
    ])+fig('iv')+box('怎样读原文分档表','表头分别为减量、标准和增量；原文举例：虚弱老年、肾病或每日用量<24 units可考虑减量；每日>100 units或BMI>35可考虑增量。原表的一位小数分档存在未列出的精确边界，如6.0，不能在本页自行补齐或自动选择泵速。')+fig('safety')+cite('cpoc','文内 p23–25、39；输注原表 p25，附录4 p39')+related([['hypo','泵注中血糖偏低：处理与复测'],['high','回到高血糖纠正流程'],['crisis','怀疑 DKA / HHS：专用路径']])+note;
  }else if(leaf==='hypo'){
    content=header('血糖下降或低血糖')+summary('及时处理 · 麻醉中不依赖主观症状','CPOC：<4.0 mmol/L；ADA：<3.9 mmol/L。正在用降糖药且4–6 mmol/L时，CPOC提示警惕临近低血糖，核对治疗和底物。')+flow([
      ['停止常规高血糖追加纠正','核对血糖、胰岛素及底物输注；必要时按本院低血糖流程暂停或调整当前输注。不要因未出现症状而延误。'],
      ['麻醉或禁食患者选择静脉途径','CPOC 原文示例：10%葡萄糖150–200 mL，15分钟输入，即15–20 g；结合容量状态调整，并核对泵设置，防止整袋误输。麻醉患者不经口喂糖。'],
      ['10–15分钟后复测','若仍<4 mmol/L，按原流程继续处理并复测；持续不纠正时及时升级处理。'],
      ['纠正后查原因并防止复发','检查胰岛素叠加、底物中断、长效胰岛素或磺脲类、肾功能变化等。1型患者不能在没有替代计划时长时间停掉全部胰岛素。']
    ])+box('别把“临近低血糖”当作所有患者的补糖指令','4–6 mmol/L的提醒有正在使用降糖药等背景。复测间隔及葡萄糖剂量需结合本院方案和患者状态。')+cite('cpoc','文内 p25–27：Practical Resource 3')+cite('ada','Hypoglycemia：定义及处理原则')+related([['iv','纠正后如何恢复或衔接输注'],['daycase','日间手术的监测要求']])+note;
  }else if(leaf==='daycase'){
    content=header('日间手术高血糖')+summary('SAMBA 2024 · 成人糖尿病日间手术','按患者及手术特点，可采用180–250 mg/dL（约10.0–13.9 mmol/L）的宽松术中目标；不能外推到所有住院大手术或 ICU。')+flow([
      ['明确属于日间手术场景','结合术前控制、手术侵袭性与时长、预计恢复和监测能力判断。不要将不同指南目标混合成一个硬阈值。'],
      ['先看有无急性并发症','疑似 DKA / HHS 时按急症方案处理；不能仅凭术中血糖不很高排除。'],
      ['决定是否需要胰岛素纠正','SAMBA：未用过胰岛素者血糖>250 mg/dL时，可按患者和手术特点考虑胰岛素；已用胰岛素者需复核既有方案与敏感性。推荐皮下途径处理适用的高血糖。'],
      ['给药后安排复测','皮下速效胰岛素后90–120分钟内复测；需要胰岛素或手术>2小时者需更频繁监测。低血糖时每15–30分钟监测至安全纠正。'],
      ['恢复与出院前交接','将术中用药时间、剂量、最近血糖及后续监测计划交给恢复室团队，按出院流程核对。']
    ])+box('低于10 mmol/L并不等于需要补糖','宽松目标的下限不是低血糖阈值。要结合正在用的胰岛素、趋势及临床状态。')+cite('samba','所供PDF p5表1、p10–13治疗及监测章节')+related([['hypo','低血糖处理'],['thresholds','与 ADA / CPOC 对照']])+note;
  }else if(leaf==='crisis'){
    content=header('怀疑 DKA / HHS')+box('这是独立急症流程','下方 ADA 图16.1用于已怀疑或确诊高血糖急症的治疗路径，不是普通术中高血糖的一次性纠正方案。不能只凭血糖诊断或排除DKA/HHS。','urgent')+fig('crisis')+flow([
      ['先确定病情、类型与监护需求','结合血酮、血气pH/碳酸氢根、容量、电解质及渗透压；DKA和HHS可重叠。SGLT2相关DKA可能血糖不明显升高。'],
      ['左栏：液体与循环评估','按脱水程度、心功能及循环状态选择补液与监测。原图并不是所有患者统一固定速度的补液处方。'],
      ['中栏：分型与胰岛素路径','原图区分轻度DKA、中重度DKA和HHS；不同路径的胰岛素方案不可互换，不套用普通VRIII表。'],
      ['右栏：钾与肾功能','先评估血钾和排尿/肾功能；补钾及胰岛素启动时机依急症方案，不能忽略低钾风险。'],
      ['血糖下降后仍需判断急症是否解除','按原图调整胰岛素、含糖液体并持续监测。血糖恢复不等于酮症、酸中毒或高渗状态已解除；转换到皮下需要衔接。']
    ],'按原图三栏来读')+cite('ada','图16.1；S348（所供PDF p10），包括图下注释与急症解除标准')+related([['high','普通高血糖：回到纠正流程'],['iv','普通 VRIII：适用条件与表格']])+note;
  }else if(leaf==='overview'){
    content=header('围术期全程衔接')+fig('overview')+flow([
      ['术前：评估和个体计划','核对糖尿病控制、共病及全部药物，明确禁食、用药调整和手术安排。'],
      ['入院到术中：监测与执行计划','核对既定方案、减少禁食时间，按CPOC原图维持术中目标并保障1型患者胰岛素供应；发生异常时进入对应处理流程。'],
      ['恢复室到病房：交接下一步','交接最后血糖、胰岛素种类/剂量/时间、输注与底物、复测计划；尽早恢复饮食与活动并继续监测。'],
      ['出院：说明药物变化与后续管理','按原图完成与患者、家属及后续照护团队的信息衔接。']
    ],'原图怎么用于日常工作')+cite('cpoc','图1：文内 p7（横向图，PDF p8）')+related([['high','术中血糖升高'],['hypo','血糖偏低'],['iv','输注与转换衔接']])+note;
  }else if(leaf==='thresholds'){
    content=header('目标与干预阈值对照')+summary('目标范围 ≠ 单次给药阈值','按适用场景选择指南；不把三篇文献的阈值合并。')+flow([
      ['CPOC 2023：成人糖尿病手术','术中目标6–12 mmol/L；>12进入高血糖处理。VRIII通常以6–10为目标。病情不佳或>13时评估血酮。','<a class="inline-path" href="#glucose/high">看 CPOC 处理流程 →</a>'],
      ['ADA 2026：住院与围术期','围术期5.6–10.0 mmol/L；多数ICU患者7.8–10.0。住院持续≥10启动或加强治疗，持续定义为24小时内两次确认，不表示术中需等满24小时。'],
      ['SAMBA 2024：糖尿病日间手术','个体化术中宽松目标180–250 mg/dL。未用过胰岛素者>250时可考虑胰岛素治疗。','<a class="inline-path" href="#glucose/daycase">看日间手术处理流程 →</a>']
    ])+cite('cpoc','文内 p13、23、27、39')+cite('ada','推荐16.4a/b、16.5a/b、16.15')+cite('samba','表1与术中治疗章节')+note;
  }else if(leaf==='sources'){
    content=header('原文与图表说明')+Object.entries(sources).map(([id,s])=>`<section class="panel reference-card"><span class="method-badge">${s.name}</span><h2>${s.title}</h2><a class="source-link" href="${s.url}" target="_blank" rel="noopener noreferrer">打开原文 ↗（联网）</a></section>`).join('')+box('图表在本专题中的用法','CPOC图1和ADA图16.1为文献流程原图；CPOC p25为原表，p27–28和p39为原文步骤截图。中文箭头/编号流程是根据文字整理的解读，均标明“非原图”。原图保留可读文字、表头和相关脚注，可放大滚动查看。')+box('为什么没有放 SAMBA 的流程原图','所供SAMBA文章中的流程图是文献检索和筛选流程，不能用作患者治疗流程，因此本专题按其临床建议整理文字步骤，不冒充文献原图。')+'<p class="small-copy">整理日期：2026-11-03。只展示相关图表/步骤摘录与解读，不发布PDF全文。专题及原图支持离线；外部原文链接需联网。</p>'+note;
  }else{location.hash='glucose';return;}
  const modal=`<dialog id="figure-dialog" class="figure-dialog" aria-labelledby="figure-title"><header><h2 id="figure-title"></h2><button id="figure-close" class="secondary">关闭</button></header><div class="figure-controls"><button id="figure-less" class="secondary" aria-label="缩小原图">−</button><output id="figure-scale">100%</output><button id="figure-more" class="secondary" aria-label="放大原图">＋</button></div><div class="figure-viewport" tabindex="0" data-zoom="0" aria-label="原图滚动区域"><img id="figure-full" alt=""></div><p>放大后可横向、纵向滚动。请同时核对图中的单位、分支和脚注。</p></dialog>`;
  shell(`<main id="main">${content}</main>${modal}`,'home','glucose-shell process-shell');
  const fav=document.querySelector('#favorite-glucose');if(fav)fav.addEventListener('click',()=>{const on=ctx.toggleFavorite('glucose');fav.classList.toggle('is-favorite',on);fav.setAttribute('aria-pressed',String(on));});
  const dialog=document.querySelector('#figure-dialog');let zoom=0,opener;
  const setZoom=()=>{document.querySelector('.figure-viewport').dataset.zoom=String(zoom);document.querySelector('#figure-scale').textContent=[100,150,200,300][zoom]+'%';document.querySelector('#figure-less').disabled=zoom===0;document.querySelector('#figure-more').disabled=zoom===3;};
  document.querySelectorAll('[data-figure]').forEach(button=>button.addEventListener('click',()=>{const f=figures[button.dataset.figure];opener=button;document.querySelector('#figure-title').textContent=f.title;const img=document.querySelector('#figure-full');img.src=f.src;img.alt=f.title;zoom=0;setZoom();dialog.showModal();}));
  document.querySelector('#figure-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>opener?.focus());document.querySelector('#figure-less').addEventListener('click',()=>{if(zoom>0){zoom--;setZoom();}});document.querySelector('#figure-more').addEventListener('click',()=>{if(zoom<3){zoom++;setZoom();}});
}
