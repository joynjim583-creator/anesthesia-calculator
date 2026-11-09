// Presentation-only policy: remove citation furniture, not clinical content/data.
export function polishContent(html) {
  const template=document.createElement('template');template.innerHTML=html;
  const root=template.content;
  root.querySelectorAll('.cv-source,.neuro-source,.source-link,.g-page-buttons,.cv-edition,.neuro-figure figcaption > p').forEach(el=>el.remove());
  root.querySelectorAll('a[href="#glucose/sources"],a[href="#cardio/sources"],a[href="#neuro/sources"]').forEach(a=>{
    const label=a.querySelector('strong');
    if(label)label.textContent=a.hash.startsWith('#neuro')?'缩写与评分表':'基础概念与缩写';
    const sub=a.querySelector('small,.card-copy > span');if(sub)sub.textContent='术语与阅读提示';
  });
  root.querySelectorAll('details').forEach(details=>{
    if(!details.querySelector('table,img'))return;
    const section=document.createElement('section');section.className=details.className+' expanded-content';
    for(const child of [...details.childNodes]){
      if(child.nodeName==='SUMMARY'){const title=document.createElement('h3');title.innerHTML=child.innerHTML;section.append(title);}
      else section.append(child);
    }
    details.replaceWith(section);
  });
  // Delete citation-only empty containers, not panels containing useful material.
  root.querySelectorAll('section').forEach(el=>{if(!el.textContent.trim()&&!el.querySelector('img,table,input'))el.remove();});
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const replacements=[
    ['CPOC p28总述','CPOC总述'],
    ['原文推荐液体及替代液见PDF p25','推荐液体及替代液见相关图表'],
    ['§3.3年龄表述','年龄表述'],
    ['中文为来源明确的转述与编辑性组织；完整原文提取文本可逐页离线核对。','按章节进入主题，阅读背景、条件和处理步骤；相关图表直接展示，点击可放大。'],
    ['19项：编号图表、连续用药表、急诊矩阵及3份正文步骤节选。CPOC附录1–3是文字性附件，见完整章节原文定位。','19项图表与步骤节选，点击即可放大。'],
    ['先明确场景，再查处理与依据','先明确场景，再查处理流程'],
    ['原文提取文本可能有断词、双栏次序或编码问题，不能替代图表版式，复杂内容以原文整页为准。','图表可切换中文与原文，放大后双向滚动阅读。'],
    ['外部链接仅主动点击时联网。',''],
  ];
  while(walker.nextNode())for(const [from,to] of replacements)walker.currentNode.textContent=walker.currentNode.textContent.replaceAll(from,to);
  return template.innerHTML;
}

export function enhanceTables(root) {
  const tables=[...root.querySelectorAll('#main .neuro-table-scroll,#main .cv-table-wrap')];
  if(!tables.length)return;
  const dialog=document.createElement('dialog');dialog.id='table-viewer';dialog.className='cv-viewer table-viewer';
  dialog.setAttribute('aria-labelledby','table-view-title');
  dialog.innerHTML='<header><h2 id="table-view-title">表格</h2><button id="table-close" class="secondary">关闭</button></header><div class="cv-view-tools"><span>表格详情</span><div><button id="table-less" class="secondary" aria-label="缩小表格">−</button><output id="table-scale">100%</output><button id="table-more" class="secondary" aria-label="放大表格">＋</button></div></div><div id="table-viewport" tabindex="0" data-zoom="0" aria-label="表格双向滚动区域"></div>';
  root.querySelector('.app-shell').append(dialog);
  let zoom=0,opener;const viewport=dialog.querySelector('#table-viewport');
  function redraw(){viewport.dataset.zoom=String(zoom);dialog.querySelector('#table-scale').textContent=[100,150,200,300][zoom]+'%';dialog.querySelector('#table-less').disabled=zoom===0;dialog.querySelector('#table-more').disabled=zoom===3;}
  for(const wrap of tables){
    const button=document.createElement('button');button.type='button';button.className='text-button table-open';button.textContent='点击表格放大';button.setAttribute('aria-haspopup','dialog');wrap.after(button);
    const open=trigger=>{opener=trigger;zoom=0;viewport.innerHTML=wrap.querySelector('table').outerHTML;dialog.querySelector('#table-view-title').textContent=wrap.closest('section')?.querySelector('h2,h3')?.textContent||'表格详情';redraw();viewport.scrollTo(0,0);dialog.showModal();};
    button.addEventListener('click',()=>open(button));wrap.addEventListener('click',e=>{if(!e.target.closest('a,button,input'))open(button);});
  }
  dialog.querySelector('#table-less').addEventListener('click',()=>{zoom=Math.max(0,zoom-1);redraw();});dialog.querySelector('#table-more').addEventListener('click',()=>{zoom=Math.min(3,zoom+1);redraw();});
  dialog.querySelector('#table-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{viewport.innerHTML='';opener?.focus();});
}
