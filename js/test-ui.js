/* ===================== 시험 모드 화면 =====================
   목록의 "시험 모드" 칸 → [시험 보기]: 등급(기사/산업기사)과 과제당 시간을 고르면 공압 1 + 유압 1을 무작위로 골라 이어서 푼다.
   시험 과제는 모의 과제를 복사한 것(id 앞에 "t:")이라 평소 모의 과제의 진행·배선을 건드리지 않는다.
   시험 중(body.testing): 위쪽 막대에 남은 시간, 다른 목록·내 회로 도면·채점 힌트·해설은 숨김. 시간이 다 되면 그 과제는 더 평가받을 수 없다.
   끝내면 결과표(과제별 통과 단계·쓴 시간)를 보여 주고 store.testLog에 5개까지 남긴다.
   app.js·exam-ui.js 다음에 불러온다 (store·save·ALL·loadMission·fmtTime·toast·showMyDiagram을 쓴다). 고르기·결과 계산은 testmode.js */
const TKEY=id=>'t:'+id;
function testOn(){return !!(store.test&&store.test.on);}
function testTask(){const T=store.test;return T&&T.tasks[T.cur];}
// 모의 과제를 시험용으로 복사해 목록 데이터(ALL)에 더한다
function testClone(id){
  const mid=TKEY(id);
  if(!ALL.some(x=>x.id===mid)){const e=EXAMS.find(x=>x.id===id);if(!e)return null;ALL.push(Object.assign({},e,{id:mid,test:true}));}
  return mid;
}
function testForget(id){const mid=TKEY(id);delete store.circuits[mid];delete store.done[mid];if(store.exam)delete store.exam[mid];if(store.examBest)delete store.examBest[mid];}
// 목록의 시험 모드 칸 (app.js renderMissionList가 부른다)
function testRows(misItem){
  if(!testOn())return `<li class="cus-tools test-row"><button class="btn" data-teststart>시험 보기 (공압 1 + 유압 1)</button>${(store.testLog||[]).length?'<button class="btn" data-testlog>지난 결과</button>':''}</li>`;
  const m=ALL.find(x=>x.id===TKEY(testTask().id));
  return m?misItem(m).replace('<li>','<li class="test-row">'):'';
}
const testDlg=$('testDlg'),testBar=$('testBar');
let testAskQuit=false;
function testApply(){
  const on=testOn();
  document.body.classList.toggle('testing',on);
  document.body.classList.toggle('test-over',on&&!!testTask().over);
  if(on&&typeof showMyDiagram==='function')showMyDiagram(false);
  renderTestBar();
}
function renderTestBar(){
  testBar.hidden=!testOn();if(!testOn())return;
  const T=store.test,t=testTask(),left=Math.max(0,T.limit-t.sec),last=T.cur===T.tasks.length-1;
  testBar.innerHTML=`<span>시험 중 · 과제 ${T.cur+1}/${T.tasks.length}</span>
    <b class="${t.over?'over':left<=300?'warn':''}" id="testClock">${t.over?'시간 종료':'남은 시간 '+fmtTime(left)}</b>
    <button class="btn primary" id="testNext">${last?'시험 끝내기':'다음 과제 →'}</button>
    <button class="btn" id="testQuit">${testAskQuit?'정말 그만두기 (결과 없음)':'그만두기'}</button>`;
}
function testOpenStart(){
  testDlg.innerHTML=`<h3>시험 모드</h3>
    <p>공압 과제 하나와 유압 과제 하나를 무작위로 골라 이어서 풉니다. 시험 중에는 <b>내 회로 도면, 채점 힌트, 해설</b>이 보이지 않고, 과제마다 시간이 다 되면 더 평가받을 수 없어요.</p>
    <label>등급<select id="testLevel"><option value="">기사 (틀린 곳이 있는 전기회로도)</option><option value="industrial">산업기사 (전기회로도 없이 설계)</option></select></label>
    <label>과제당 시간<select id="testLimit"><option value="30">30분</option><option value="40">40분</option><option value="50" selected>50분</option><option value="60">60분</option></select></label>
    <p class="welcome-sub">평소 모의 과제의 진행 상황과 배선은 그대로 남아요.</p>
    <div class="welcome-btns"><button class="btn primary" id="testGo">시작</button><button class="btn" id="testCancel">닫기</button></div>`;
  testDlg.hidden=false;
}
const testLevelName=l=>l==='industrial'?'산업기사':'기사';
function testResultHtml(r){
  return `<p class="welcome-sub">${r.date} · ${testLevelName(r.level)} · 과제당 ${Math.round(r.limit/60)}분</p>
    <ul class="test-res">${r.tasks.map(t=>`<li class="${t.passed===t.total?'pass':'fail'}"><b>${t.no}</b> ${t.title}<small>${t.passed}/${t.total} 단계 통과 · ${fmtTime(t.sec)} 사용${t.over?' · 시간 종료':''}</small></li>`).join('')}</ul>
    <p class="${r.all?'test-ok':'test-no'}">${r.all?'모든 단계를 시간 안에 통과했어요!':`${r.passed}/${r.total} 단계 통과. 통과하지 못한 단계는 모의 과제에서 다시 연습해 보세요.`}</p>`;
}
function testShowResult(list,title){
  testDlg.innerHTML=`<h3>${title}</h3>${list.map(testResultHtml).join('<hr>')}<div class="welcome-btns"><button class="btn primary" id="testCancel">닫기</button></div>`;
  testDlg.hidden=false;
}
function testStart(level,limitMin){
  if(DEMO_ON)demoStop();
  const ids=TESTMODE.pick(EXAMS,level,Math.random);
  if(!ids){toast('고를 과제가 모자라요.');return;}
  ids.forEach(id=>{testClone(id);testForget(id);});
  store.test={on:true,level,limit:limitMin*60,cur:0,tasks:ids.map(id=>({id,sec:0}))};
  testAskQuit=false;testDlg.hidden=true;
  if(UI.lesson)closeLesson();
  testApply();loadMission(TKEY(ids[0]));save();
}
// 지금 과제의 통과 단계 수를 적어 둔다
function testClose(t){
  const st=(store.exam||{})[TKEY(t.id)]||{passed:[]},e=EXAMS.find(x=>x.id===t.id);
  t.passed=st.passed.length;t.total=e?e.exam.stages.length:0;
}
function testNext(){
  const T=store.test;testClose(testTask());
  if(T.cur<T.tasks.length-1){T.cur++;testAskQuit=false;testApply();loadMission(TKEY(testTask().id));save();}
  else testFinish(false);
}
function testFinish(quit){
  const T=store.test;T.tasks.forEach(t=>{if(t.total==null)testClose(t);});
  if(!quit)store.testLog=[TESTMODE.summary(T,EXAMS,new Date().toISOString().slice(0,10))].concat(store.testLog||[]).slice(0,5);
  store.test=null;testAskQuit=false;testApply();
  loadMission('free');
  T.tasks.forEach(t=>testForget(t.id));
  save();renderMissionList();
  if(!quit)testShowResult([store.testLog[0]],'시험 결과');
}
$('missionList').addEventListener('click',e=>{
  if(e.target.closest('[data-teststart]'))testOpenStart();
  if(e.target.closest('[data-testlog]'))testShowResult(store.testLog||[],'지난 시험 결과');
});
testDlg.addEventListener('click',e=>{
  if(e.target.id==='testCancel')testDlg.hidden=true;
  if(e.target.id==='testGo')testStart($('testLevel').value,+$('testLimit').value);
});
testBar.addEventListener('click',e=>{
  if(e.target.id==='testNext')testNext();
  if(e.target.id==='testQuit'){if(!testAskQuit){testAskQuit=true;renderTestBar();}else testFinish(true);}
});
// 시간이 끝난 과제는 더 평가받을 수 없다 (exam-ui.js의 평가 받기보다 먼저 가로챔)
document.addEventListener('click',e=>{
  if(testOn()&&testTask().over&&e.target.id==='examGrade'){e.stopPropagation();toast('이 과제는 시간이 끝났어요. 아래 막대에서 다음으로 넘어가세요.');}
},true);
// 시험 시계: 시험 과제를 열어 둔 동안 1초씩
setInterval(()=>{
  if(!testOn()||document.hidden)return;
  const T=store.test,t=testTask();if(t.over)return;
  t.sec++;
  if(t.sec>=T.limit){t.over=true;testApply();save();toast('시간이 다 됐어요. 이 과제는 여기까지입니다.');return;}
  const left=T.limit-t.sec,c=$('testClock');
  if(c){c.textContent='남은 시간 '+fmtTime(left);c.classList.toggle('warn',left<=300);}
  if(t.sec%10===0)save();
},1000);
// 시작: 시험 중에 새로고침했으면 이어서
if(testOn()&&store.test.tasks.every(t=>testClone(t.id))){testApply();loadMission(TKEY(testTask().id));}
else{if(store.test)store.test=null;renderMissionList();}
