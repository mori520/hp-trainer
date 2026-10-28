/* ===================== 모의 과제 화면 =====================
   미션 정보 칸 안에: 스톱워치, 요구사항, 단계 목록(기본 동작 → 유지보수 1)·2)·3)), 지금 단계 할 일, "평가 받기".
   단계 채점은 그 단계의 grading으로 지금 회로를 채점한다 (gradeMission). 통과하면 다음 단계가 열리고,
   다음 단계로 넘어가면 그 단계의 기기(board)가 판에 생긴다. 기본 동작을 통과하면 "틀린 곳 해설"이 보인다.
   app.js 다음에 불러온다 (store·save·cur·applyBoard·showResults·examState를 쓴다) */
let examAsk=false;   // "처음부터 다시"를 한 번 눌러 확인을 묻는 중
function renderExam(){
  const mis=cur(),box=$('exam');box.hidden=!mis.exam;if(!mis.exam)return;
  const X=mis.exam,st=examState(mis.id),k=st.stage,stg=X.stages[k],last=X.stages.length-1;
  const passed=i=>st.passed.includes(i),allDone=X.stages.every((_,i)=>passed(i));
  box.innerHTML=`<div class="prac-top"><span class="clock" id="examClock" title="걸린 시간">${fmtTime(st.sec)}</span>
      <button class="btn ${st.run?'':'primary'}" id="examRun">${st.run?'일시정지':st.sec?'계속':'시작'}</button>
      <button class="btn" id="examZero">0으로</button></div>
    <details class="ex-req" ${st.reqClosed?'':'open'}><summary>요구사항</summary><ul class="req">${X.req.map(t=>`<li>${t}</li>`).join('')}</ul></details>
    <ol class="ex-stages">${X.stages.map((s,i)=>`<li class="${passed(i)?'pass':i===k?'cur':'lock'}"><span class="m">${passed(i)?'✓':i===k?'▶':'·'}</span>${s.name}</li>`).join('')}</ol>
    <div class="ex-task"><b>${stg.name}</b><p>${stg.task}</p></div>
    <div class="ex-btns"><button class="btn primary" id="examGrade">평가 받기</button>
      ${passed(k)&&k<last?`<button class="btn primary" id="examNext">다음: ${X.stages[k+1].name} →</button>`:''}</div>
    ${allDone?`<p class="fb ok"><b>모든 단계 통과!</b> 걸린 시간 ${fmtTime(st.sec)}. 시험은 보통 기본 동작부터 유지보수까지 정해진 시간 안에 끝내야 해요.</p>`:''}
    ${passed(0)?`<details class="ex-explain"><summary>도면의 틀린 곳 해설</summary><p>${X.explain}</p></details>`:''}
    <button class="link" id="examRestart">${examAsk?'정말 처음부터? (단계 기록·시간을 지우고, 판을 처음 구성으로 되돌립니다. 한 번 더 누르세요)':'처음부터 다시'}</button>`;
}
// 판을 바꾼 뒤 배선·호스·설정·실린더 자리는 그대로 두고 세계를 다시 만든다
function examRebuild(board){
  applyBoard(board);
  const ok=x=>JACKS[x.a]&&JACKS[x.b];
  const o=S;S=newWorld({wires:o.wires.filter(ok),hoses:o.hoses.filter(ok),set:Object.assign({},o.set)});S.power=o.power;S.air=o.air;
  for(const k in S.cyl)if(k in o.cyl)S.cyl[k]=o.cyl[k];
  clearResults();renderConn();save();
}
$('exam').addEventListener('click',e=>{
  const mis=cur();if(!mis.exam)return;
  const X=mis.exam,st=examState(mis.id),id=e.target.id;
  if(id!=='examRestart'&&examAsk){examAsk=false;renderExam();}
  if(id==='examRun'){st.run=!st.run;save();renderExam();}
  if(id==='examZero'){st.sec=0;st.run=false;save();renderExam();}
  if(id==='examGrade'){
    const k=st.stage,stg=X.stages[k],last=k===X.stages.length-1;
    const res=gradeMission({...mis,grading:stg.grading},{wires:S.wires,hoses:S.hoses,set:S.set});
    const pass=showResults(res,last?'모의 과제 완료!':'다음 단계가 열렸어요.',stg.name);
    if(pass){
      if(!st.passed.includes(k))st.passed.push(k);
      if(last){store.done[mis.id]=true;st.run=false;}
      save();renderMissionList();
    }
    renderExam();
  }
  if(id==='examNext'){
    st.stage++;const add=X.stages[st.stage].board||{};
    examRebuild(Object.assign({},UI.board,add));renderExam();
    const added=Object.values(add).filter(Boolean).map(v=>pracValName(v)),removed=Object.keys(add).filter(k=>!add[k]);
    if(added.length||removed.length)toast([added.length?`판에 ${added.join('·')}이(가) 생겼어요.`:'',removed.length?`${removed.join('·')}은(는) 판에서 빠졌어요.`:''].filter(Boolean).join(' '));
  }
  if(id==='examRestart'){
    if(!examAsk){examAsk=true;renderExam();return;}
    examAsk=false;
    store.exam[mis.id]={stage:0,passed:[],sec:0,run:false};delete store.done[mis.id];
    examRebuild(examBoard(mis,0));   // 밸브 교체 등 바꾼 판도 처음대로
    renderMissionList();renderExam();
  }
});
$('exam').addEventListener('toggle',e=>{if(e.target.matches('.ex-req')&&cur().exam)examState(cur().id).reqClosed=!e.target.open;},true);
// 스톱워치: 모의 과제를 열어 두고 "시작"한 동안 1초씩
setInterval(()=>{
  const mis=cur();if(!mis||!mis.exam||document.hidden||UI.lesson)return;
  const st=examState(mis.id);if(!st.run)return;
  st.sec++;const c=$('examClock');if(c)c.textContent=fmtTime(st.sec);
  if(st.sec%10===0)save();
},1000);
// 시작할 때 마지막으로 보던 것이 모의 과제였으면 (app.js가 먼저 불러서 아직 그리지 못함) 다시 불러 단계 판까지 맞춘다
if(cur()&&cur().exam&&!UI.lesson)loadMission(UI.mission);
