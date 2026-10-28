/* ===================== 튜토리얼 =====================
   미션 데이터의 steps를 읽어 현재 단계를 판정하고, 다음에 꽂을 잭을 강조한다. */
// 단계 완료 판정은 시연과 같이 쓴다 (demo.js tutStepDone, 잭 묶음 jackMatch·wiresBetween)
function stepDone(s){return tutStepDone(s,S,{color:UI.color,auto:store.autoColor,quiz:UI.quiz.ok});}
function stepHL(s){
  const ids=[];const add=sp=>{if(sp.startsWith('group:'))Object.keys(JACKS).filter(i=>jackMatch(sp,i)).forEach(i=>ids.push(i));else ids.push(sp);};
  if(s.wire){add(s.wire[0]);add(s.wire[1]);}
  if(s.hose){add(s.hose[0]);add(s.hose[1]);}
  (s.hl||[]).forEach(add);return ids;
}
let lastStepsKey='';
function updateTutorial(){
  const mis=cur();const steps=mis.steps||[];
  const tut=UI.mode==='tut'&&steps.length>0;
  $('steps').hidden=!tut;
  document.querySelectorAll('.swatch').forEach(b=>b.classList.remove('pulse-btn'));
  if(!tut){renderHL([]);$('tutDone').hidden=true;lastStepsKey='';return;}
  // 지켜야 하는 앞 단계가 깨지면 되돌아감
  for(let i=0;i<UI.stepIdx;i++)if(steps[i].keep&&!stepDone(steps[i])){UI.stepIdx=i;break;}
  while(UI.stepIdx<steps.length&&stepDone(steps[UI.stepIdx]))UI.stepIdx++;
  const idx=UI.stepIdx, s=steps[idx];
  let warn='';
  if(s&&s.wire){const[A,B,col]=s.wire;if(wiresBetween(S.wires,A,B).length&&!stepDone(s))warn='색이 맞지 않아요. 선을 더블클릭해 지우고 '+(col==='red'?'빨강':'파랑')+'으로 다시 연결하세요.';}
  if(s&&s.btn)$(s.btn).classList.add('pulse-btn');
  const needPlug=s&&s.done&&s.done.type==='state'&&s.done.expect.power&&!PLUGGED;
  renderHL(s?stepHL(s).concat(needPlug?['@plug']:[]):[]);
  $('tutDone').hidden=!!s;
  const key=idx+'|'+warn;if(key===lastStepsKey)return;lastStepsKey=key;
  const item=(st,i)=>`<li class="${i<idx?'ok':i===idx?'cur':''}" data-n="${i+1}"><span>${st.t}${i===idx&&warn?`<span class="warn">${warn}</span>`:''}</span></li>`;
  // 단계에 g(묶음 제목)가 있으면 묶음별로 접어서, 지금 하는 묶음만 펼쳐 보인다
  if(!steps.some(st=>st.g)){$('steps').innerHTML=steps.map(item).join('');return;}
  let html='';
  for(let i=0;i<steps.length;){
    const g=steps[i].g||'',start=i;
    while(i<steps.length&&(steps[i].g||'')===g)i++;
    const st=i<=idx?'done':start<=idx?'cur':'todo';
    html+=`<li class="grp ${st}"><span>${g} <small>${st==='done'?'완료':`${i-start}단계`}</small></span></li>`;
    if(st==='cur')for(let k=start;k<i;k++)html+=item(steps[k],k);
  }
  $('steps').innerHTML=html;
}
