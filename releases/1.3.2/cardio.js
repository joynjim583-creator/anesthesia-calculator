import {translatedFigures} from '../1.3.1/cardio-translated.js';
import {reference,groups,topics,scenarios,glossary,grades,evidence} from '../1.3.0/cardio-data.js';
import {tables} from '../1.3.0/cardio-tables.js';
import {flows} from '../1.3.0/cardio-flows.js';
import {cardioImages} from '../1.3.0/cardio-images.js';
import {originalPages} from '../1.3.0/cardio-original.js';
export const cardioFigures=[...flows,...tables];
const topicMap=Object.fromEntries(topics.map(t=>[t.id,t]));
const figureMap=Object.fromEntries(cardioFigures.map(f=>[f.id,f]));

export function renderCardio(ctx,route){
 const {shell,icon,escape:e,favorites}=ctx;
 const leaf=route.split('/')[1]||'home';
 const link=(id,title,sub='')=>`<a class="cv-link" href="#cardio/${e(id)}"><span><strong>${e(title)}</strong>${sub?`<small>${e(sub)}</small>`:''}</span>${icon('arrow','chevron')}</a>`;
 const box=(title,text,cls='')=>`<section class="panel cv-copy ${cls}"><h2>${e(title)}</h2><p>${e(text)}</p></section>`;
 const header=(title,back='cardio',backText='心血管管理')=>`<header class="inner-header cv-header"><a class="back" href="#${back}">${icon('back')}${backText}</a>${leaf==='home'?`<button id="favorite-cardio" class="icon-button ${favorites.includes('cardio')?'is-favorite':''}" aria-label="${favorites.includes('cardio')?'取消收藏心血管专题':'收藏心血管专题'}" aria-pressed="${favorites.includes('cardio')}">${icon('star')}</button>`:''}</header><div class="cv-title"><span class="eyebrow">PERIOPERATIVE CARDIOVASCULAR CARE</span><h1>${e(title)}</h1></div>`;
 const source=(section,pages)=>`<div class="cv-source"><strong>原文定位 · §${e(section)}</strong><p>${pages.map(p=>`<button class="cv-page" data-source-page="${p}">e${412+p} / PDF ${p}</button>`).join('')}</p></div>`;
 const figureCard=id=>{const f=figureMap[id];return `<article class="cv-figure-card" id="figure-${id}"><span class="cv-type">${f.type==='flow'?'中文译图 · 原结构':'中文译表 · 原结构'}</span><h3>${e(f.title)}</h3><p>原文 e${412+f.page} / PDF ${f.page} · 保留原文整页对照</p><div class="cv-button-row"><button class="secondary" data-cv-figure="${id}">查看中文</button><button class="secondary" data-cv-figure="${id}" data-original="true">查看原文</button></div></article>`;};
 const topicLinks=list=>`<div class="cv-links">${list.map(t=>link('topic/'+t.id,t.title,`§${t.section} · ${t.recommendations.length?t.recommendations.length+'条分级推荐':'背景与流程'}`)).join('')}</div>`;
 const groupList=list=>`<div class="cv-links">${list.map(g=>link('group/'+g.id,g.title,g.description)).join('')}</div>`;
 let content;
 if(leaf==='home'){
  content=header('非心脏手术围术期心血管管理','home','首页')+
  `<section class="cv-intro"><span class="cv-edition">AHA / ACC · 2026 再确认版</span><h2>从术前评估，到术后衔接</h2><p>查阅成人非心脏手术的心血管风险评估、检查选择、疾病与用药管理，以及术后心肌损伤处理。</p><p>按当前问题进入，先看背景与判断条件，再查处理步骤、推荐等级和中文/原文图表。完整阅读可从下方章节开始。</p><div class="cv-stats"><span>10 个模块</span><span>${topics.length} 个主题</span><span>6 图 · 15 表</span></div></section>`+
  `<div class="section-heading"><h2>按临床情景查阅</h2><span>先找到当前问题</span></div><div class="cv-scenarios">${scenarios.map(([title,sub,id],i)=>`<a class="cv-scenario" href="#cardio/${id==='diseases'?'diseases':id==='intraoperative'?'group/intraoperative':'topic/'+id}"><span class="cv-number">0${i+1}</span><strong>${e(title)}</strong><small>${e(sub)}</small>${icon('arrow')}</a>`).join('')}</div>`+
  `<div class="section-heading"><h2>完整阅读与速查</h2></div><div class="cv-links">${link('chapters','完整章节','十个模块，按指南逻辑阅读')}${link('medications','用药速查','按适应证区分继续、中断与恢复')}${link('figures','全部图表','6幅流程图与15张编号表')}${link('sources','基础概念、缩写与来源','推荐等级、术语及2026版本说明')}</div><p class="preview-note">1.3.1 测试版 · 人工查阅与中文整理，待临床内容审核。</p>`;
 }else if(leaf==='chapters'){
  content=header('完整章节')+box('怎样读这份指南','建议先看基础与总路径，再按当前需要进入检查、疾病、用药和术后部分。页面中的中文为结合上下文的整理，分级推荐与编辑性解读分别标注。')+groupList(groups);
 }else if(leaf==='group'){
  const group=groups.find(g=>g.id===route.split('/')[2]);if(!group){location.hash='cardio';return;}
  content=header(group.title,'cardio/chapters','完整章节')+box('本模块',group.description)+topicLinks(topics.filter(t=>t.group===group.id));
 }else if(leaf==='diseases'){
  content=header('心脏疾病与植入装置')+box('先明确病变与当前状态','病名、症状、代偿状态、病变严重程度及手术紧迫程度共同影响路径。各病变的推荐条件不能互相替代。')+topicLinks(topics.filter(t=>['disease','valve'].includes(t.group)));
 }else if(leaf==='medications'){
  content=header('围术期用药速查')+box('先看适应证，再看停与不停','同一药物用于高血压、心衰或其他适应证时，建议可能不同。时间还需结合手术紧迫性、肾功能、出血、血栓和止血状态。这里不自动生成停药或剂量处方。')+topicLinks(topics.filter(t=>['medication','antithrombotic'].includes(t.group)))+link('topic/bp','同时查看血压管理')+`<a class="cv-link" href="#glucose"><span><strong>围术期血糖管理专题</strong><small>CPOC / ADA / SAMBA，保留各自适用范围</small></span>${icon('arrow')}</a>`;
 }else if(leaf==='figures'){
  content=header('全部图表')+box('中文与原文如何对照','在原图表基础上替换英文，保留原有行列、合并单元格、框体、箭头、分支、配色、数值与脚注位置；不转置、不重排、不拆成卡片。中文长度仅通过字号和文字区域内换行适配。译图非官方中文版，可切换原文整页对照并离线缩放。')+`<div class="cv-figures">${cardioFigures.map(f=>figureCard(f.id)).join('')}</div>`;
 }else if(leaf==='sources'){
  content=header('基础概念与来源')+box(reference.title,reference.citation+' '+reference.scope)+box('版本说明',reference.edition)+`<section class="panel cv-copy"><h2>推荐类别 COR</h2>${htmlTable(['类别','含义'],grades,e)}<h2>证据等级 LOE</h2>${htmlTable(['等级','证据基础'],evidence,e)}</section><section class="panel cv-copy"><h2>专业术语</h2>${htmlTable(['缩写','中文与语义'],glossary,e)}</section>`+box('翻译与语义约定','is recommended译为“推荐”；is reasonable保留“合理”；may be considered保留“可考虑”。无获益与有害分别显示。risk升高不等于高风险单一档；time-sensitive为时间敏感。CrCl不与所有eGFR混同；MINS不等于所有cTn升高；OR为比值比。')+box('原文疑点处理','表4的AUB-HAS2血红蛋白单位、表9血管加压素类别、图5与推荐文字的边界差异、§3.3年龄表述在相关页单列说明，不静默纠正、不用于自动算法。')+`<section class="panel cv-copy"><h2>原文与官方说明</h2><a class="source-link" href="${reference.doi}" target="_blank" rel="noopener noreferrer">打开原文 DOI ↗（联网）</a><a class="source-link" href="${reference.official}" target="_blank" rel="noopener noreferrer">AHA 2026版说明 ↗（联网）</a><p>原文提取文本可在主题页逐页离线查看。复杂排版以图表中的原文整页为准。此专题不采集患者心血管参数，不运行手术许可、桥接或剂量算法。</p></section>`;
 }else if(leaf==='topic'){
  const t=topicMap[route.split('/')[2]];if(!t){location.hash='cardio';return;}
  const group=groups.find(g=>g.id===t.group);
  content=header(t.title,'cardio/group/'+t.group,group.title)+box('背景与适用情景',t.background,'cv-background')+
  `<section class="panel cv-copy"><h2>先核对这些条件</h2><ul>${t.checks.map(x=>`<li>${e(x)}</li>`).join('')}</ul></section>`+
  `<section class="panel cv-copy"><h2>处理与查阅步骤</h2><ol class="cv-steps">${t.steps.map(x=>`<li>${e(x)}</li>`).join('')}</ol><p class="cv-label">中文整理：不单独赋予推荐等级；具体条件以下方原文推荐为准。</p></section>`+
  (t.recommendations.length?`<section class="cv-recommendations" aria-label="指南分级推荐"><div class="section-heading"><h2>指南推荐 · 中文转述</h2><span>保留条件与强度</span></div>${t.recommendations.map(r=>`<article class="panel cv-rec ${r.cor.includes('Harm')?'cv-harm':r.cor.includes('No benefit')?'cv-no-benefit':''}" data-rec="${r.id}"><div class="cv-rec-tags"><span class="cv-cor">${e(r.cor)}</span><span>LOE ${r.loe}</span><small>${e(grades.find(g=>g[0]===r.cor)?.[1].split('：')[0]||'')}</small></div><p>${e(r.text)}</p><small>§${e(t.section)} · ${t.pages.map(p=>'e'+(412+p)).join('、')}</small></article>`).join('')}</section>`:box('本页证据形式','本页以原文背景、流程或支持性讨论为主；没有分级推荐时不自行添加COR/LOE。'))+
  (t.figures.length?`<div class="section-heading"><h2>相关图表</h2><span>中文 / 原文</span></div>${t.figures.map(figureCard).join('')}`:'')+
  (t.explanation?box('证据解释与容易误解之处',t.explanation):'')+source(t.section,t.pages)+
  `<details class="panel disclosure cv-related"><summary>本模块其他主题${icon('arrow')}</summary>${topicLinks(topics.filter(x=>x.group===t.group&&x.id!==t.id))}</details>`;
 }else{location.hash='cardio';return;}
 const modal=`<dialog id="cv-viewer" class="cv-viewer" aria-labelledby="cv-view-title"><header><h2 id="cv-view-title"></h2><button class="secondary" id="cv-close">关闭</button></header><div class="cv-view-tools"><button class="secondary" id="cv-switch">查看原文</button><div><button class="secondary" id="cv-less" aria-label="缩小图表">−</button><output id="cv-scale">100%</output><button class="secondary" id="cv-more" aria-label="放大图表">＋</button></div></div><div id="cv-viewport" tabindex="0" aria-label="心血管专题图表滚动区域" data-zoom="0"></div><p id="cv-caption"></p></dialog>`;
 shell(`<main id="main">${content}</main>${modal}`,'home','cv-shell');
 document.querySelector('#favorite-cardio')?.addEventListener('click',event=>{const on=ctx.toggleFavorite('cardio');const b=event.currentTarget;b.classList.toggle('is-favorite',on);b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'取消收藏心血管专题':'收藏心血管专题');});
 const dialog=document.querySelector('#cv-viewer'),viewport=document.querySelector('#cv-viewport');
 let current,original=false,zoom=0,opener;
 const redraw=()=>{
  viewport.dataset.zoom=String(zoom);document.querySelector('#cv-scale').textContent=[100,150,200,300][zoom]+'%';
  document.querySelector('#cv-less').disabled=zoom===0;document.querySelector('#cv-more').disabled=zoom===3;
  document.querySelector('#cv-view-title').textContent=current.title+(original?' · 原文整页':' · 中文');
  document.querySelector('#cv-switch').hidden=current.type==='source';
  document.querySelector('#cv-switch').textContent=original?'查看中文':'查看原文';
  if(current.type==='source')viewport.innerHTML=`<div class="cv-sheet cv-original-text"><p>原文提取文本；双栏次序、断词和脚注位置可能变化。图表以原文整页图像为准。</p><pre>${e(originalPages[String(current.page)]||'')}</pre></div>`;
  else if(original)viewport.innerHTML=`<img id="cv-original-image" class="cv-original-image" src="${cardioImages['page'+current.page]}" alt="${e(current.title)}，原文完整页面，含图注及脚注">`;
  else viewport.innerHTML=`<img id="cv-translated-image" class="cv-original-image cv-translated-image" src="${translatedFigures[current.id].src}" alt="${e(current.title)}，在原结构上英译中，保留行列、合并单元格、箭头与脚注">`;
  document.querySelector('#cv-caption').textContent=`Circulation 2026 · e${412+current.page} / PDF ${current.page}。${original?'原文整页；保留图表上下文。':'原结构英译中，非官方中文版。'}放大后可双向滚动。`;
 };
 document.querySelectorAll('[data-cv-figure]').forEach(b=>b.addEventListener('click',()=>{current=figureMap[b.dataset.cvFigure];opener=b;original=b.dataset.original==='true';zoom=0;redraw();viewport.scrollTo(0,0);dialog.showModal();}));
 document.querySelectorAll('[data-source-page]').forEach(b=>b.addEventListener('click',()=>{current={type:'source',page:Number(b.dataset.sourcePage),title:'对应原文 · PDF '+b.dataset.sourcePage};opener=b;original=false;zoom=0;redraw();viewport.scrollTo(0,0);dialog.showModal();}));
 document.querySelector('#cv-switch').addEventListener('click',()=>{original=!original;redraw();viewport.scrollTo(0,0);});
 document.querySelector('#cv-less').addEventListener('click',()=>{zoom=Math.max(0,zoom-1);redraw();});
 document.querySelector('#cv-more').addEventListener('click',()=>{zoom=Math.min(3,zoom+1);redraw();});
 document.querySelector('#cv-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{viewport.innerHTML='';opener?.focus();});
}
function htmlTable(headers,rows,e){return `<div class="cv-table-wrap" tabindex="0" aria-label="可横向滚动的中文表格"><table class="cv-table"><thead><tr>${headers.map(h=>`<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((v,i)=>i===0?`<th scope="row">${e(v)}</th>`:`<td>${e(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
