/* ===================== 튜토리얼 =====================
   미션 데이터의 steps를 읽어 현재 단계를 판정하고, 다음에 꽂을 잭을 강조한다. */
// 잭 지정: "group:이름"이면 JACK_GROUPS의 묶음, 아니면 잭 id 그대로
function m(spec,id){if(spec.startsWith('group:'))return JACK_GROUPS[spec.slice(6)](id);return spec===id;}
function between(list,A,B){return list.filter(x=>(m(A,x.a)&&m(B,x.b))||(m(A,x.b)&&m(B,x.a)));}
// color: 툴바에서 고른 배선 색 / state: 지금 트레이너 상태가 expect와 모두 같으면 완료 (형식은 grader.js expectOk)
function condDone(d){
  if(d.type==='color')return store.autoColor||(d.is?UI.color===d.is:UI.color!==d.not);   // 자동 색이면 색 고르기 단계는 건너뜀
  if(d.type==='state')return Object.keys(d.expect).every(k=>expectOk(S,k,d.expect[k]));
  if(d.type==='setting')return Math.abs((S.set[d.name]||0)-d.value)<1e-6;   // 타이머·카운터 설정값
  if(d.type==='quiz')return UI.quiz.ok;   // 오류 찾기 문제를 맞힘
  return false;
}
function stepDone(s){
  if(s.wire){const[A,B,col]=s.wire;return between(S.wires,A,B).some(x=>col==='red'?x.color==='red':x.color!=='red');}
  if(s.hose)return between(S.hoses,s.hose[0],s.hose[1]).length>0;
  return condDone(s.done);
}
function stepHL(s){
  const ids=[];const add=sp=>{if(sp.startsWith('group:'))Object.keys(JACKS).filter(i=>m(sp,i)).forEach(i=>ids.push(i));else ids.push(sp);};
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
  if(s&&s.wire){const[A,B,col]=s.wire;if(between(S.wires,A,B).length&&!stepDone(s))warn='색이 맞지 않아요. 선을 더블클릭해 지우고 '+(col==='red'?'빨강':'파랑')+'으로 다시 연결하세요.';}
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
