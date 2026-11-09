import { neuroFigures } from '../1.3.0/neuro-figures.js';
import { reference, sensoryPoints, muscles, cases, sections, glossary } from '../1.3.0/neuro-data.js';
import { neuroIntroduction, neuroBackground } from '../1.3.0/neuro-background.js';

// Read-only reference topic: no patient form, automatic classifier, or persistent exam data.
export function renderNeuro(ctx,route) {
  const {shell,icon,escape:e}=ctx;
  const leaf=route.split('/')[1]||'home';
  const figureByID=Object.fromEntries(neuroFigures.map(f=>[f.id,f]));
  const header=title=>`<header class="inner-header"><a class="back" href="#${leaf==='home'?'home':'neuro'}">${icon('back')}${leaf==='home'?'首页':'专题'}</a><h1>${title}</h1>${leaf==='home'?`<button id="favorite-neuro" class="icon-button ${ctx.favorites.includes('neuro')?'is-favorite':''}" aria-label="收藏神经评估专题" aria-pressed="${ctx.favorites.includes('neuro')}">${icon('star')}</button>`:'<span></span>'}</header>`;
  const box=(title,text,cls='')=>`<section class="panel neuro-copy ${cls}"><h2>${title}</h2><p>${text}</p></section>`;
  const source=()=>'';
  const link=(id,title,subtitle='')=>`<a class="tool-card" href="#neuro/${id}"><span class="card-copy"><strong>${title}</strong>${subtitle?`<span>${subtitle}</span>`:''}</span>${icon('arrow','chevron')}</a>`;
  const figure=id=>{
    const f=figureByID[id];
    return `<figure class="panel neuro-figure" data-figure-card="${id}"><figcaption><span class="method-badge">${f.kind}</span><h2>${e(f.title)}</h2><p>${e(f.source)} · 非官方中文版</p></figcaption><button type="button" class="neuro-image-button" data-neuro-figure="${id}" aria-label="放大${e(f.title)}"><img loading="lazy" src="${new URL(f.src,import.meta.url).href}" alt="${e(f.title)}，中文翻译整理"></button><div class="neuro-figure-actions"><button class="secondary" data-neuro-figure="${id}">放大中文图</button><button class="text-button" data-neuro-figure="${id}" data-original="true">原文对照</button></div></figure>`;
  };
  const table=(heads,rows)=>`<div class="neuro-table-scroll" tabindex="0"><table><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>i===0?`<th scope="row">${e(c)}</th>`:`<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const steps=items=>`<ol class="neuro-steps">${items.map(([title,text])=>`<li><h2>${title}</h2><p>${text}</p></li>`).join('')}</ol>`;
  const note='<p class="neuro-note">查体与分类速查测试版 · 未经临床验收。适用于所述脊髓损伤评估场景，非椎管内麻醉阻滞平面判定或治疗方案。</p>';
  const background=id=>{
    const b=neuroBackground[id];
    if(!b)return '';
    return `<section class="panel neuro-copy neuro-background" aria-labelledby="background-title"><span class="neuro-background-label">背景知识</span><h2 id="background-title">${e(b.title)}</h2>${b.paragraphs.map(p=>`<p>${e(p)}</p>`).join('')}<details class="neuro-background-details"><summary>基础概念与阅读提示</summary><dl>${b.concepts.map(([term,text])=>`<dt>${e(term)}</dt><dd>${e(text)}</dd>`).join('')}</dl><p class="neuro-reading"><strong>这一页怎么用</strong>${e(b.reading)}</p></details><p class="neuro-source">原文依据：ISNCSCI 2026 第9版 · ${e(b.pages)}。<a href="#neuro/sources">原文与说明 →</a></p></section>`;
  };
  const renderIntroduction=()=>{
    const i=neuroIntroduction;
    return `<section class="neuro-hero neuro-introduction" aria-labelledby="neuro-intro-title"><span class="eyebrow">ISNCSCI 2026 · 第9版</span><h2 id="neuro-intro-title">${e(i.title)}</h2><p>${e(i.definition)}</p><div class="neuro-hero-purpose"><h3>这个工具能帮你做什么？</h3><p>${e(i.purpose)}</p></div><p class="neuro-hero-reading">${e(i.reading)}</p><div class="neuro-hero-stats"><span>28 对感觉点</span><span>10 对关键肌</span><span>16 份中英对照图表</span></div></section><p class="neuro-intro-boundary">${e(i.scope)}</p>`;
  };
  let content;
  if(leaf==='home'){
    content=header('神经功能评估')+`${renderIntroduction()}<div class="section-heading"><h2>按问题查阅</h2><span>从查体到记录</span></div><div class="neuro-menu">${sections.map(s=>link(s.id,s.title,s.subtitle)).join('')}</div><div class="section-heading"><h2>图表与学习</h2><span>支持离线</span></div><div class="neuro-menu">${link('figures','全部中文图表','3张图 · 1张对照表 · 10例 · 评分表正反面')}${link('cases','10个运动平面病例','先看图，再对照判定理由')}${link('updates','2026版重点澄清','体位、运动平面、星号与AIS E')}${link('patterns','常见脊髓损伤模式','圆锥、马尾及其他综合征')}${link('sources','原文、缩写与评分表','版本、出处及原文对照')}</div>`+note;
  }else if(leaf==='sensory'){
    content=header('感觉检查')+box('先统一检查方法','左右各28个关键感觉点，从C2至S4–S5。分别检查轻触觉和针刺觉，以面部（优选面颊）感觉作为正常参照。左右侧、两种感觉分别记录。')+figure('sensory-map')+box('轻触觉：0 / 1 / 2','遮挡视线，用细棉絮在不超过1 cm的皮肤范围划过一次。无感觉为0；可感觉但与面部不同（减退或过敏）为1；与面部相同为2。')+box('针刺觉：先辨锐钝，再比较强度','不能可靠区分锐钝，或完全无感觉，记0。能辨锐钝但锐刺激强度与面部不同，记1；能辨锐钝且强度相同，记2。存在疑问时，原文建议10次中答对8次作为准确性参考。')+`<section class="panel neuro-copy"><h2>关键感觉点定位</h2>${[['颈段与上胸段',0,9],['胸段',9,18],['腰骶段',18,28]].map(([name,start,end])=>`<details class="neuro-list"><summary>${name}</summary>${table(['节段','关键定位点'],sensoryPoints.slice(start,end))}</details>`).join('')}</section>`+box('感觉平面与总分分别处理','感觉平面要求从头侧连续正常，轻触觉与针刺觉均为2分。左右可不同。LT和PP双侧合计满分各112，不能将总分直接换算为平面；出现NT时，相应不能完整求和的分数应明确标为无法求和。')+source('p150–153、155–156')+link('special','遇到NT或非SCI因素，怎样记录？')+note;
  }else if(leaf==='motor'){
    content=header('运动检查')+box('仰卧位、固定充分，避免代偿','左右各10项关键肌功能，按头侧至尾侧检查。下面体位为原文针对4、5级检查的特定体位；0–3级的完整操作需结合官方检查培训。')+figure('innervation')+`<section class="panel neuro-copy"><h2>10项关键肌功能</h2>${muscles.map(([seg,action,muscle,position])=>`<details class="neuro-list"><summary><strong>${seg} · ${action}</strong></summary><p>${muscle}</p><p>4–5级检查体位：${position}。</p></details>`).join('')}</section>`+box('肌力分级的关键区别','0无收缩；1可见或可触及收缩，或去重力位能主动活动但不能完成全活动范围；2去重力完成全活动范围；3抗重力完成全活动范围；4、5在规定检查体位分别抗中等和充分阻力。4、5级不是沿全活动范围逐段施阻检查。')+box('不能摆到规定检查体位时','不能可靠检查记NT或NT*，依据SCI相关或非SCI因素区分，并记录原因。原文对活动范围受限有专门条件；不能把固定、疼痛或关节受限造成的低分直接归为脊髓损伤。')+box('上肢、下肢分开看','UEMS上肢运动评分满分50，LEMS下肢运动评分满分50。原文不建议把两者合成100分作为主要临床表征或统计指标。')+figure('nonkey')+box('非关键肌何时有用','疑似AIS B且无VAC时，要检查每侧运动平面以下超过3个节段的非关键肌，以区分感觉不完全与运动不完全。非关键肌不纳入运动评分求和，也不用于确定运动平面；结果写入备注。')+source('p153–155、162')+link('cases','查看10个运动平面病例')+note;
  }else if(leaf==='sacral'){
    content=header('骶段功能保留')+steps([['S4–S5：左右轻触觉与针刺觉','在肛周黏膜皮肤交界外侧不足1 cm处检查。任一侧存在正常或改变的感觉，均属于骶段感觉保留。'],['DAP：深部肛门压觉','按原文肛直肠检查方法施加温和压力，确认可重复感知，记录有或无；完整检查建议常规评估DAP。'],['VAC：肛门自主收缩','确认可重复的自主收缩，区别于反射性收缩。仅在Valsalva动作时出现的收缩，不能当作自主收缩。'],['汇总完全性 / 不完全性','VAC无、双侧S4–S5轻触觉和针刺觉均0、且DAP无，才符合完全性。任一骶段感觉或运动保留提示不完全性。缺失检查不能直接当作“无”。']])+box('自主收缩和反射不同','骶反射存在不等于VAC存在，也不能仅凭下肢有无活动判断完全性。需依据完整且可靠的骶段检查。')+source('p143、149、152、154、163')+link('classification','继续核对AIS分类')+link('zpp','骶段结果如何影响ZPP？')+note;
  }else if(leaf==='classification'){
    content=header('平面与 AIS 分类')+steps([['1 · 左右感觉平面','从C2向尾侧，确定轻触觉和针刺觉均正常、且其上感觉连续正常的最尾侧皮节。左右分别记录。'],['2 · 左右运动平面','最尾侧关键肌功能至少3级，且其上关键肌功能均5级。无直接可查肌节的区域及C4/C5、L1/L2过渡需结合完整规则，不能一律等于感觉平面。'],['3 · 单一NLI','取右感觉、左感觉、右运动、左运动四个平面中最头侧者，同时保留四项独立记录。'],['4 · 完全性 / 不完全性','依据S4–S5轻触觉、针刺觉、DAP与VAC是否有骶段保留判断。影像学骨性损伤平面不是NLI。'],['5 · AIS分级','先判完全性，再判运动完全性，再比较NLI以下关键肌中肌力至少3级的比例。详见下表与评分表背面。'],['6 · ZPP','先分别核对感觉和运动ZPP是否适用，再记录左右各自最尾侧保留节段；不适用NA与无法确定ND不同。']])+`<section class="panel neuro-copy"><h2>AIS判定要点</h2>${table(['级别','条件'],[['A','完全性：S4–S5无感觉和运动保留。'],['B','有骶段感觉保留；任一侧运动平面以下超过3个节段无运动保留。'],['C','有VAC；或有骶段感觉保留并在任一侧同侧运动平面以下超过3个节段有运动保留。符合运动不完全条件，且单一NLI以下肌力≥3的关键肌功能少于一半。'],['D','符合运动不完全条件，且单一NLI以下至少一半关键肌功能肌力≥3。'],['E','既往有SCI功能缺损，目前ISNCSCI感觉和运动检查正常。无SCI者不赋予AIS分级。']])}</section>`+box('两个“平面”不要混用','区分B与C/D时看每侧运动平面；区分C与D时看单一NLI。非关键肌可参与判断运动不完全，但不进入C/D比例的关键肌分母。')+box('INT与DAP的特殊情况','全部皮节LT、PP正常且DAP有，感觉平面可记INT；LT、PP全正常但DAP无时，原文规定该侧感觉平面记S3。运动INT仅在AIS E者使用。')+figure('worksheet-back')+source('p155–165；官方评分表背面')+link('cases','看运动平面病例')+note;
  }else if(leaf==='special'){
    content=header('特殊情况与记录')+steps([['实测结果：NT还是NT*？','SCI直接相关因素（如痉挛、神经病理性疼痛）使检查不可靠，记NT。非SCI因素（如石膏、烧伤、截肢等）导致无法检查，记NT*。均须说明原因。'],['异常实测分数：何时加星号？','非SCI因素影响异常分数时，记录实际查体分数并加“*”，例如2*。不要用5*代替实际低分，也不能自动假设正常。'],['临床分类假设：由检查者明确','备注中写明非SCI因素及用于分类的处理。明确位于平面以上的非SCI因素可按规则假设正常；叠加于SCI平面或以下的情况不能自动恢复为正常。'],['评分求和与分类分开','求和用实际数值，忽略星号而不是忽略异常分数。总分本身不加星号；存在NT/NT*导致不能完整求和时，不补0、不补满分。'],['分类不确定：ND或ND*','无法确定平面、AIS或ZPP时，因SCI相关检查缺失用ND；受非SCI因素或相应假设影响且无法得到一致结论时用ND*。若某项不受NT影响，仍可记录其确定结果。']])+box('不是“出现星号，所有结果都加星号”','依据假设分数分类，再用实测分数重新分类，比较每个分类变量是否改变。标记具体受影响的结果；不机械传播星号到所有平面、NLI或AIS。')+source('p149–150、153–154、164–165')+link('sources','查看缩写含义及原文')+note;
  }else if(leaf==='zpp'){
    content=header('部分保留区 ZPP')+box('先判适用，再填节段','ZPP并非只适用于AIS A。感觉与运动分别核对，左右分别记录。记录的是最尾侧保留功能的单一节段，不是一段范围。')+steps([['感觉ZPP','DAP存在时双侧不适用。DAP无但某侧S4–S5有LT或PP，该侧不适用。相应骶段感觉缺失时，再查该侧最尾侧感觉保留。'],['运动ZPP','VAC存在时双侧运动ZPP不适用；VAC无时，按平面以下自主运动保留确定最尾侧节段。不能把感觉ZPP当作运动ZPP。'],['无更尾侧保留时','在适用ZPP的前提下，平面以下无部分功能保留，填对应感觉或运动平面本身。'],['NA、ND和星号','不适用填NA；无法依据现有检查确定则ND或ND*。临床假设影响具体结果时，按星号规则处理。']])+box('非关键肌的例外','非关键肌一般不纳入ZPP；当最尾侧非关键肌功能是确定AIS C/D的唯一依据时，原文规定该侧运动ZPP可记录其对应神经根节段。')+box('原文举例','若感觉、运动平面及NLI均为T4，左侧T6仍有感觉，左感觉ZPP可记T6；不能据此将运动ZPP也写成T6，原例仍为T4。')+source('p149、164–165')+figure('worksheet-back')+note;
  }else if(leaf==='cases'){
    content=header('运动平面病例')+box('按原文10例逐一核对','病例均为文献教学示例。图中灰色或虚线格为原图的推定表示，不代表额外进行了临床实测；数值、节段和对应关系保留。')+cases.map(c=>`<article class="neuro-case"><div class="neuro-case-head"><span>病例 ${c.number}</span><strong>运动 ${c.motor} · 感觉 ${c.sensory}</strong></div>${figure(c.id)}${box('判定理由',c.explanation)}</article>`).join('')+source('p157–162，病例1–10')+note;
  }else if(leaf==='figures'){
    content=header('全部图表')+box('全文图表目录','16份图表完整纳入。中文翻译整理页保留原有分栏、编号及逻辑关系；每份可切换原文，病例数值格与解剖图形直接保留原图。')+neuroFigures.map(f=>figure(f.id)).join('')+source('图1–3、非关键肌表、病例1–10、评分表正反两页')+note;
  }else if(leaf==='updates'){
    content=header('2026版重点澄清')+steps([['四肢瘫与截瘫的定义','本版按NLI定义：T1或以上为四肢瘫；T1以下为截瘫。只适用于SCI语境。'],['肌力检查体位','4、5级在特定关节体位检查；去重力位活动不能完成全ROM的弱肌记1级。无法进入规定检查体位要考虑NT/NT*。'],['运动平面的过渡与特殊表现','新增图示解释无可查肌节区域、C4/C5和L1/L2过渡，以及感觉异常但关键肌完整的情形。'],['NT、星号和ND','明确SCI相关因素与非SCI因素的区别；实测分数求和与基于临床假设的分类必须分开。'],['AIS E的含义','代表ISNCSCI所检查的感觉与运动功能正常，不保证自主神经、协调或其他未测功能也正常。'],['常规完整评估DAP','完整ISNCSCI检查建议常规检查DAP，即使S4–S5已有LT或PP保留。'],['损伤模式与分类分开','补充后脊髓综合征；综合征模式是描述，不是AIS的替代分类。']])+source('p141–145')+link('cases','查看新增与澄清的病例图')+note;
  }else if(leaf==='patterns'){
    content=header('常见损伤模式')+figure('anatomy')+`<section class="panel neuro-copy"><h2>临床模式对照</h2>${table(['模式','原文特征'],[['中央脊髓综合征','常见上肢运动损害重于下肢，可见于颈椎退变背景的过伸伤。'],['Brown-Séquard综合征','同侧运动、位置觉和振动觉受损，对侧痛温觉受损；纯半切模式较少见。'],['前脊髓综合征','运动、痛温觉受损，而后索相关感觉相对保留。'],['后脊髓综合征','振动觉和关节位置觉受损较突出，运动及痛温觉通常保留。'],['脊髓圆锥综合征','可混合上、下运动神经元表现，部分骶反射可保留。'],['马尾综合征','腰骶神经根损伤，典型为下运动神经元表现，可有弛缓性瘫痪与反射缺失。']])}</section>`+box('描述模式不代替分类','上述模式不能直接换算成AIS等级，也不能以影像骨性节段代替神经损伤平面。本专题没有加入治疗算法。')+source('p146–149')+note;
  }else if(leaf==='sources'){
    content=header('缩写与评分表')+`<section class="panel neuro-copy"><a class="source-link" href="${reference.doi}" target="_blank" rel="noopener noreferrer">打开标准全文 ↗（联网）</a><a class="source-link" href="${reference.official}" target="_blank" rel="noopener noreferrer">ASIA官方资源与培训 ↗（联网）</a><a class="source-link" href="${reference.worksheet}" target="_blank" rel="noopener noreferrer">官方原版评分表 ↗（联网）</a></section>`+figure('worksheet-front')+figure('worksheet-back')+`<section class="panel neuro-copy"><h2>缩写对照</h2>${table(['缩写','中文'],glossary)}</section>`+box('译图与原文的关系','中文页为本项目翻译整理，非ASIA或出版社官方中文版。结构与内容按原文核对，个别换行、字号及留白因中文长度调整。评分表保留原版对照；中文病例说明与原文图分开。')+box('适用边界','ISNCSCI不等于全面神经系统检查，也不涵盖完整自主神经评估。非创伤性病变需有明确可辨的损伤平面，不能外推至所有弥漫性神经系统疾病。E-ISNCSCI是另行发布的简化检查，本专题不自行删减完整检查项目。')+note;
  }else {location.hash='neuro';return;}
  if(leaf!=='home')content=content.replace('</header>','</header>'+background(leaf));
  const modal=`<dialog id="neuro-viewer" class="figure-dialog neuro-viewer" aria-labelledby="neuro-figure-title"><header><h2 id="neuro-figure-title"></h2><button id="neuro-close" class="secondary">关闭</button></header><div class="neuro-view-tools"><button id="neuro-original" class="secondary">查看原文</button><div class="figure-controls"><button id="neuro-less" class="secondary" aria-label="缩小图表">−</button><output id="neuro-scale">100%</output><button id="neuro-more" class="secondary" aria-label="放大图表">＋</button></div></div><div id="neuro-viewport" class="figure-viewport" tabindex="0" data-zoom="0" aria-label="神经专题图表滚动区域"><img id="neuro-full" alt=""></div><p id="neuro-caption"></p></dialog>`;
  shell(`<main id="main">${content}</main>${modal}`,'home','neuro-shell process-shell');
  document.querySelector('#favorite-neuro')?.addEventListener('click',event=>{const on=ctx.toggleFavorite('neuro');event.currentTarget.classList.toggle('is-favorite',on);event.currentTarget.setAttribute('aria-pressed',String(on));});
  const dialog=document.querySelector('#neuro-viewer'),img=document.querySelector('#neuro-full');let zoom=0,original=false,current,opener;
  const redraw=()=>{
    document.querySelector('#neuro-viewport').dataset.zoom=String(zoom);document.querySelector('#neuro-scale').textContent=[100,150,200,300][zoom]+'%';
    document.querySelector('#neuro-less').disabled=zoom===0;document.querySelector('#neuro-more').disabled=zoom===3;
    img.src=new URL(original?current.original:current.src,import.meta.url).href;img.alt=current.title+(original?'，原文':'，中文翻译整理');
    document.querySelector('#neuro-figure-title').textContent=current.title+(original?' · 原文':' · 中文');
    document.querySelector('#neuro-original').textContent=original?'查看中文':'查看原文';
    document.querySelector('#neuro-caption').textContent=(original?'原文对照':'中文译图 · 非官方中文版')+' · 可缩放并双向滚动。';
  };
  document.querySelectorAll('[data-neuro-figure]').forEach(button=>button.addEventListener('click',()=>{current=figureByID[button.dataset.neuroFigure];original=button.dataset.original==='true';zoom=0;opener=button;redraw();dialog.showModal();}));
  document.querySelector('#neuro-original').addEventListener('click',()=>{original=!original;redraw();});
  document.querySelector('#neuro-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>opener?.focus());
  document.querySelector('#neuro-less').addEventListener('click',()=>{if(zoom>0){zoom--;redraw();}});document.querySelector('#neuro-more').addEventListener('click',()=>{if(zoom<3){zoom++;redraw();}});
}
