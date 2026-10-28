/* ===================== 앱: 상태 / 저장 / 조작 / 미션 패널 / 루프 =====================
   다른 파일을 모두 불러온 뒤 마지막에 실행된다. */

/* ===================== 상태 / 저장 ===================== */
const KEY='ph-trainer-v1';
// 처음 온 사람: 기초 강의·미션 칸은 접고, 실전 연습 칸의 자유 실습을 연 상태로 시작
let store={done:{},circuits:{},last:'free',mode:'tut',fold:{lessons:true,missions:true}};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)store=Object.assign(store,s);}catch(e){}
const BOOT_LAST=store.last;   // 시작 때 마지막으로 보던 것 (그리는 중 save()가 store.last를 덮기 전에 기억)
// 예전 잭 이름으로 저장된 배선을 새 이름(부품 id_포트)으로 옮긴다
const OLD_IDS={CYL_cap:'A_cap',CYL_rod:'A_rod',Y1_p:'V1_Ya_p',Y1_n:'V1_Ya_n'};
Object.values(store.circuits).forEach(c=>{if(c.board)return;[...(c.wires||[]),...(c.hoses||[])].forEach(x=>{x.a=OLD_IDS[x.a]||x.a;x.b=OLD_IDS[x.b]||x.b;});});
// 스위치·릴레이 모듈 레일 잭을 6개로 늘리기 전에 저장된 기본 전원 선(3번째 잭에서 나감)을 맨 끝 잭으로 옮긴다
const OLD_JUMP={R24_1_2:'R24_1_5',R0_1_2:'R0_1_5',R24_5_2:'R24_5_5',R0_5_2:'R0_5_5'};
Object.values(store.circuits).forEach(c=>(c.wires||[]).forEach(x=>{if(!x.base)return;x.a=OLD_JUMP[x.a]||x.a;x.b=OLD_JUMP[x.b]||x.b;}));
let DEMO_ON=false;   // 시연 중(demo-ui.js): 사용자 손이 버튼을 떼게 하지 않음
let WIPED=false;   // 모든 기록을 지운 뒤 새로고침 전까지는 다시 저장하지 않는다
function save(){if(WIPED)return;try{if(!inTutorial())store.circuits[UI.mission]={wires:S.wires,hoses:S.hoses,board:UI.board,set:S.set,pw:1};store.last=UI.lesson||UI.mission;store.mode=UI.mode;localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}}
const UI={color:'red',mission:'m0',mode:'tut',board:{},stepIdx:0,flash:[],quiz:{tried:[],ok:false},lesson:null};
let S=null;
let uid=1;

/* ===================== 사용자 조작 ===================== */
const sv=$('sv'),prev=$('preview');
let drag=null;
function svgPt(e){const p=sv.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(sv.getScreenCTM().inverse());}
function jackAt(e){const t=document.elementFromPoint(e.clientX,e.clientY);return t&&t.dataset&&t.dataset.jack?t.dataset.jack:null;}
function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,3200);}
function connect(a,b){
  if(a===b)return;
  const A=JACKS[a],B=JACKS[b];
  if(A.kind!==B.kind){toast(A.kind==='elec'?'전기 잭은 전기 잭끼리만 연결할 수 있어요.':'공압 포트는 공압 포트끼리 호스로 연결하세요.');return;}
  if(A.kind==='pneu'){
    const used=id=>S.hoses.some(h=>h.a===id||h.b===id);
    if(used(a)||used(b)){toast('이 포트에는 이미 호스가 꽂혀 있어요. 포트 하나에는 호스 하나만 연결합니다.');return;}
    S.hoses.push({id:'h'+uid++,a,b});
  }else{
    if(S.wires.some(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a))){toast('같은 두 잭 사이에 이미 선이 있어요.');return;}
    S.wires.push({id:'w'+uid++,a,b,color:store.autoColor?autoWireColor(a,b):UI.color});
  }
  clearResults();renderConn();
}
// 밸브 종류 교체: 공기 공급을 끄고, 그 밸브에 꽂힌 호스·배선을 모두 뺀 뒤에만 가능 (실제 교체 절차)
function swapPart(slot){
  const def=LAYOUTS[cur().layout].slots.find(s=>s.slot===slot), types=def.accepts;
  const next=types[(types.indexOf(UI.board[slot])+1)%types.length];
  const label={valve52s:'편솔',valve52d:'양솔'}[next]||next;
  if(S.air){toast('공기 공급을 먼저 끈 뒤 밸브를 교체하세요. (수험자 유의사항)');return;}
  const mine=x=>[x.a,x.b].some(j=>j.startsWith(def.id+'_'));
  const hoses=S.hoses.filter(mine), wires=S.wires.filter(mine);
  if(hoses.length||wires.length){
    UI.flash=hoses.concat(wires).map(x=>x.id);renderConn();
    toast(`교체하려면 이 밸브에 꽂힌 ${hoses.length?`호스 ${hoses.length}개`:''}${hoses.length&&wires.length?'와 ':''}${wires.length?`배선 ${wires.length}개`:''}를 먼저 빼세요. 깜박이는 선을 더블클릭하면 빠집니다.`);
    return;
  }
  const old=S;
  applyBoard(Object.assign({},UI.board,{[slot]:next}));
  S=newWorld({wires:old.wires,hoses:old.hoses,set:old.set});
  S.power=old.power;
  for(const k in S.cyl)if(k in old.cyl)S.cyl[k]=old.cyl[k];
  for(const k in S.valve)if(k in old.valve&&k!==def.id)S.valve[k]=old.valve[k];
  clearResults();renderConn();
  toast(`${def.id} 밸브를 5/2 ${label} 밸브로 교체했어요.`);
}
// 누름버튼은 누르는 동안만(놓으면 pointerup에서 풀림), 유지형(비상정지)은 누를 때마다 켜짐/꺼짐이 바뀐다
// 타이머·카운터 설정 ▼▲: 정해진 간격으로 올리고 내린다 (최소·최대 안에서)
function changeSetting(b){
  const name=b.dataset.name,d=+b.dataset.dir,s=LAYOUT.settings[name];if(!s)return;
  const v=Math.round((S.set[name]+d*s.step)/s.step)*s.step;
  S.set[name]=Math.min(s.max,Math.max(s.min,+v.toFixed(2)));clearResults();save();
}
// 콘센트: 플러그를 꽂아야 POWER가 켜진다. 뽑으면 전원도 꺼진다 (꽂은 상태는 기억)
function togglePower(){
  if(!store.plugged){toast('먼저 전원 모듈 왼쪽의 플러그를 콘센트에 꽂으세요.');return;}
  S.power=!S.power;
}
function togglePlug(){store.plugged=!store.plugged;PLUGGED=store.plugged;if(!PLUGGED)S.power=false;save();}
function pressButton(b){const id=b.dataset.pb;S.pb[id]=b.dataset.toggle?!S.pb[id]:true;}
sv.addEventListener('pointerdown',e=>{
  const swap=e.target.closest&&e.target.closest('.swap');
  if(swap){swapPart(swap.dataset.slot);return;}
  const pb=e.target.closest&&e.target.closest('.pbtn');
  if(pb){pressButton(pb);e.preventDefault();return;}
  const sb=e.target.closest&&e.target.closest('.setbtn');
  if(sb){changeSetting(sb);e.preventDefault();return;}
  if(e.target===R.rocker){togglePower();return;}
  if(e.target.closest&&e.target.closest('.plug')){togglePlug();return;}
  if(e.target.closest&&e.target.closest('.toggle')){S.air=!S.air;return;}
  const j=e.target.dataset&&e.target.dataset.jack;
  if(j){e.preventDefault();
    if(drag&&drag.pending){connect(drag.from,j);drag=null;prev.setAttribute('d','');return;}
    drag={from:j,pending:false};return;}
  if(drag&&drag.pending){drag=null;prev.setAttribute('d','');}
});
window.addEventListener('pointermove',e=>{
  if(!drag)return;const p=svgPt(e),A=JACKS[drag.from];
  prev.setAttribute('d',`M${A.x},${A.y} C${A.x},${A.y+40} ${p.x},${p.y+40} ${p.x},${p.y}`);
});
window.addEventListener('pointerup',e=>{
  if(!DEMO_ON)LAYOUT.pbs.forEach(pb=>S.pb[pb]=false);
  if(!drag||drag.pending)return;
  const t=jackAt(e);
  if(t===drag.from){drag.pending=true;return;}
  if(t)connect(drag.from,t);
  drag=null;prev.setAttribute('d','');
});
// 선을 한 번 클릭하면 색이 빨강 → 파랑 → 검정 순으로 바뀐다 (더블클릭은 삭제)
const WIRE_COLORS=['red','blue','black'];
sv.addEventListener('click',e=>{
  if(e.detail!==1)return;
  const c=e.target.closest&&e.target.closest('.conn[data-type="wire"]');if(!c)return;
  const x=S.wires.find(w=>w.id===c.dataset.id);if(!x)return;
  x.color=WIRE_COLORS[(WIRE_COLORS.indexOf(x.color)+1)%WIRE_COLORS.length];
  clearResults();renderConn();
});
// 선·호스에 올리면 그 선만, 잭에 올리면 그 잭에 꽂힌 선들만 진하게 (나머지는 흐리게, 양 끝 잭에 테두리)
sv.addEventListener('pointerover',e=>{
  if(drag)return;
  const c=e.target.closest&&e.target.closest('.conn');
  if(c){setFocus([c],[c.dataset.a,c.dataset.b]);return;}
  const j=e.target.dataset&&e.target.dataset.jack;
  if(j){
    const cs=[...$('gConn').querySelectorAll('.conn')].filter(x=>x.dataset.a===j||x.dataset.b===j);
    if(cs.length)setFocus(cs,[...new Set(cs.flatMap(x=>[x.dataset.a,x.dataset.b]))]);else clearFocus();
    return;
  }
  clearFocus();
});
sv.addEventListener('pointerleave',clearFocus);
sv.addEventListener('dblclick',e=>{
  const c=e.target.closest&&e.target.closest('.conn');if(!c)return;
  const id=c.dataset.id;
  if(c.dataset.type==='hose'){
    if(S.air){toast('공기 공급을 먼저 끈 뒤 호스를 제거하세요. (수험자 유의사항)');return;}
    S.hoses=S.hoses.filter(h=>h.id!==id);
  }else S.wires=S.wires.filter(w=>w.id!==id);
  clearResults();renderConn();
});
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&drag){drag=null;prev.setAttribute('d','');}
  if(['1','2','3'].includes(e.key)&&!e.target.closest('input,textarea')){if(store.autoColor)setAutoColor(false);setColor(['red','blue','black'][+e.key-1]);}
  const pb=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.pb;
  if(pb&&(e.key===' '||e.key==='Enter')){if(!e.repeat)pressButton(document.activeElement);e.preventDefault();}
  if(document.activeElement===R.rocker&&(e.key===' '||e.key==='Enter')){togglePower();e.preventDefault();}
  if(document.activeElement===R.plug&&(e.key===' '||e.key==='Enter')){togglePlug();e.preventDefault();}
  if(document.activeElement===R.air&&(e.key===' '||e.key==='Enter')){S.air=!S.air;e.preventDefault();}
  const sw=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('.swap');
  if(sw&&(e.key===' '||e.key==='Enter')){swapPart(sw.dataset.slot);e.preventDefault();}
});
window.addEventListener('keyup',e=>{if(!DEMO_ON&&(e.key===' '||e.key==='Enter'))LAYOUT.pbs.forEach(pb=>S.pb[pb]=false);});
// 화면 크기: 1 = 화면에 맞춤(트레이너 전체가 보임). 그보다 크면 맞춤 크기의 배수로 키우고 스크롤
const ZOOMS=[1,1.25,1.5,2,2.5,3];
function applyZoom(){
  const z=store.zoom||1, wrap=sv.parentElement;
  if(z===1){sv.style.width='';sv.style.height='';}
  else{
    const vb=sv.viewBox.baseVal, fitW=Math.min(wrap.clientWidth,wrap.clientHeight*vb.width/vb.height);
    sv.style.width=Math.round(fitW*z)+'px';sv.style.height=Math.round(fitW*z*vb.height/vb.width)+'px';
  }
  $('zoomFit').textContent=z===1?'맞춤':Math.round(z*100)+'%';
  $('zoomOut').disabled=z===1;$('zoomIn').disabled=z===ZOOMS[ZOOMS.length-1];
}
function setZoom(z){store.zoom=z;applyZoom();save();}
$('zoomIn').onclick=()=>setZoom(ZOOMS[Math.min(ZOOMS.length-1,ZOOMS.indexOf(store.zoom||1)+1)]);
$('zoomOut').onclick=()=>setZoom(ZOOMS[Math.max(0,ZOOMS.indexOf(store.zoom||1)-1)]);
$('zoomFit').onclick=()=>setZoom(1);
window.addEventListener('resize',applyZoom);
// 색을 직접 고르면 자동 색은 꺼진다
function setColor(c){
  UI.color=c;
  document.querySelectorAll('.swatch[data-color]').forEach(b=>b.setAttribute('aria-pressed',!store.autoColor&&b.dataset.color===c));
}
function setAutoColor(on){store.autoColor=on;$('autoColor').setAttribute('aria-pressed',on);setColor(UI.color);save();}
document.querySelectorAll('.swatch[data-color]').forEach(b=>b.addEventListener('click',()=>{
  if(store.autoColor){setAutoColor(false);toast('자동 색을 껐어요. 다시 켜려면 "자동"을 누르세요.');}
  setColor(b.dataset.color);
}));
$('autoColor').onclick=()=>setAutoColor(!store.autoColor);

/* ===================== 미션 패널 ===================== */
// 목록: 기초 강의(lessons.js, 없으면 생략) / 미션 / 실전 연습(실전 연습·자유 실습). 칸 제목을 누르면 접고 편다(store.fold)
const ALL=MISSIONS;
const sectOf=x=>x.practice||x.id==='free'?'practice':'missions';
function cur(){return ALL.find(x=>x.id===UI.mission);}
function renderMissionList(){
  const LS=typeof LESSONS==='undefined'?[]:LESSONS, fold=store.fold||{};
  const head=(k,t,n)=>`<li class="sect"><button data-sect="${k}" aria-expanded="${!fold[k]}"><span class="caret">▾</span>${t}<small>${n}</small></button></li>`;
  const body=(k,html)=>fold[k]?'':html;
  const lessonItem=x=>`<li><button data-l="${x.id}" aria-current="${x.id===UI.lesson}">
    <span class="no">${x.no.replace('기초 ','')}</span><span class="t">${x.title}</span>
    <span class="chip ${(store.lessonDone||{})[x.id]?'done':''}">${(store.lessonDone||{})[x.id]?'읽음':'강의'}</span></button></li>`;
  const misItem=x=>`<li><button data-m="${x.id}" aria-current="${!UI.lesson&&x.id===UI.mission}">
    <span class="no">${x.no}</span><span class="t">${x.title}</span>
    <span class="chip ${store.done[x.id]?'done':''}">${store.done[x.id]?'완료':x.id==='free'?'자유':x.practice?'실전':'도전'}</span></button></li>`;
  const mis=ALL.filter(x=>sectOf(x)==='missions'), prac=ALL.filter(x=>sectOf(x)==='practice');
  $('missionList').innerHTML=(LS.length?head('lessons','기초 강의',LS.length)+body('lessons',LS.map(lessonItem).join('')):'')
    +head('missions','미션',mis.length)+body('missions',mis.map(misItem).join(''))
    +head('practice','실전 연습',prac.length)+body('practice',prac.map(misItem).join(''));
}
$('missionList').addEventListener('click',e=>{
  const s=e.target.closest('button[data-sect]');
  if(s){const k=s.dataset.sect;store.fold=Object.assign(store.fold||{},{[k]:!(store.fold||{})[k]});save();renderMissionList();return;}
  const l=e.target.closest('button[data-l]');if(l){openLesson(l.dataset.l,0);return;}   // lesson.js
  const b=e.target.closest('button[data-m]');if(b){if(UI.lesson)closeLesson();loadMission(b.dataset.m);}
});
// 자리별 부품 선택(board)대로 부품 목록을 만들고 화면을 다시 그린다
function applyBoard(board){
  UI.board=board;
  const def=LAYOUTS[cur().layout];
  configure({parts:makeParts(def,board)});
  buildScene(LAYOUT.parts,def.board);buildHits();lastHL=null;   // null: 다음 renderHL이 반드시 다시 그림(남은 강조 지우기 포함)
}
// 튜토리얼은 열 때마다 빈 판에서 시작하고 배선을 저장하지 않는다. 미션 모드·자유 실습은 저장된 배선을 불러온다
function inTutorial(){return UI.mode==='tut'&&(cur().steps||[]).length>0;}
function loadCircuit(){
  const mis=cur();
  // 기본 전원 선이 없는 회로(빈 판·튜토리얼·예전 저장)에는 넣어 준다
  const c=withJumpers(LAYOUTS[mis.layout],(!inTutorial()&&store.circuits[mis.id])||{wires:[],hoses:[],set:Object.assign({},mis.set)});
  applyBoard(Object.assign({},mis.board,c.board));   // 저장된 선택(밸브 교체 등)을 미션 기본값 위에 덮는다. 새로 생긴 자리는 기본값으로
  // 지금 배치에 없는 잭에 꽂힌 선은 버린다
  const ok=x=>JACKS[x.a]&&JACKS[x.b];
  S=newWorld(clone({wires:c.wires.filter(ok),hoses:c.hoses.filter(ok),set:c.set}));
  uid=1+Math.max(0,...S.wires.concat(S.hoses).map(x=>+String(x.id).slice(1)||0));
  UI.stepIdx=0;UI.flash=[];lastStepsKey='';
  // 오류 찾기: 튜토리얼은 매번 새로, 미션 모드는 한 번 맞히면 기억
  UI.quiz={tried:[],ok:!inTutorial()&&!!(store.quiz||{})[mis.id]};renderQuiz();
  renderPractice();
  if(typeof recReset==='function')recReset();   // 미션이 바뀌면 동작 기록도 새로
  clearResults();renderConn();
}
// 오류 찾기 문제: 틀린 보기는 이유를 보여 주고 다시 고르게, 맞히면 해설
function renderQuiz(qz=cur().quiz,fb=''){
  const box=$('quiz');box.hidden=!qz;if(!qz)return;
  if(UI.quiz.ok)fb=`<p class="fb ok"><b>정답!</b> ${qz.explain}</p>`;
  box.innerHTML=`<p class="q">${qz.q}</p>`+qz.choices.map((c,i)=>{
    const cls=UI.quiz.ok&&i===qz.answer?'right':UI.quiz.tried.includes(i)?'wrong':'';
    return `<button data-i="${i}" class="${cls}" ${UI.quiz.ok||cls?'disabled':''}>${i+1}. ${c.t}</button>`;
  }).join('')+fb;
}
$('quiz').addEventListener('click',e=>{
  const b=e.target.closest('button[data-i]');if(!b||b.disabled)return;
  const qz=cur().quiz,i=+b.dataset.i;
  if(i===qz.answer){
    UI.quiz.ok=true;
    if(!inTutorial()){store.quiz=Object.assign(store.quiz||{},{[UI.mission]:true});save();}
    renderQuiz();
  }else{UI.quiz.tried.push(i);renderQuiz(qz,`<p class="fb bad">${qz.choices[i].why||'다시 골라 보세요.'}</p>`);}
  clearResults();
});
function loadMission(id){
  if(DEMO_ON)demoStop();
  if(S)save();
  UI.mission=id;const mis=cur();
  $('mTitle').textContent=(mis.no!=='∞'&&!mis.practice?`미션 ${mis.no}. `:'')+mis.title;
  $('mGoal').textContent=mis.goal;$('mLearn').textContent=mis.learn;
  const hasSteps=(mis.steps||[]).length>0;
  $('modeBox').hidden=!hasSteps;$('gradeBtn').hidden=!mis.grading;
  $('diagramBtn').hidden=!mis.diagram;
  if(!$('diagram').hidden){if(mis.diagram)showDiagram();else $('diagram').hidden=true;}
  setMode(hasSteps?UI.mode:'mis');
  renderMissionList();
}
function setMode(md){UI.mode=md;$('modeTut').setAttribute('aria-pressed',md==='tut');$('modeMis').setAttribute('aria-pressed',md==='mis');loadCircuit();}
function switchMode(md){if(UI.mode===md)return;if(DEMO_ON)demoStop();save();setMode(md);}
$('modeTut').onclick=()=>switchMode('tut');$('modeMis').onclick=()=>switchMode('mis');
function clearResults(){$('results').innerHTML='';$('summary').hidden=true;if(UI.flash.length){UI.flash=[];}}
$('gradeBtn').onclick=()=>{
  const mis=cur();if(!mis.grading)return;
  const res=gradeMission(mis,{wires:S.wires,hoses:S.hoses,set:S.set});   // 타이머·카운터 설정값도 함께
  if(mis.quiz)res.unshift({name:'오류 찾기: 도면의 틀린 곳',ok:UI.quiz.ok,detail:'미션 설명 아래 문제에서 틀린 곳을 골라 주세요.'});
  const pass=showResults(res,'미션 완료!');
  if(pass){store.done[mis.id]=true;save();renderMissionList();}
};
// 채점 결과 목록과 요약을 보여 주고, 색이 틀린 선은 깜박이게 한다. 모두 통과면 true
function showResults(res,passText,head){
  const pass=res.every(r=>r.ok);
  const col=res.find(r=>r.bad);UI.flash=col&&col.bad.length?col.bad:[];renderConn();
  $('results').innerHTML=res.map(r=>`<li class="${r.ok?'pass':'fail'}"><span class="m">${r.ok?'✓':'✗'}</span><span>${r.name}${!r.ok&&r.detail?`<small>${r.detail}</small>`:''}</span></li>`).join('');
  const sm=$('summary');sm.hidden=false;sm.className='summary '+(pass?'pass':'fail');
  sm.textContent=(head?head+' — ':'')+(pass?`${res.length}/${res.length} 통과 — ${passText}`:`${res.filter(r=>r.ok).length}/${res.length} 통과 — 빨간 항목을 고쳐 보세요.`);
  return pass;
}

/* ===================== 실전 연습 =====================
   공개과제 내용은 넣지 않는다(저작권). 가지고 있는 공개도면을 보며 판 구성(밸브 종류·센서 위치·공압 기기)을 직접 고르고,
   스톱워치로 시간을 재며 꾸민다. 채점 대신 "내 회로 도면"으로 비교한다. 선택지는 미션 데이터의 practice.choices */
const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const PRAC_LABEL={valveA:'밸브 V1 (실린더 A)',valveB:'밸브 V2 (실린더 B)',S1:'센서 S1',S2:'센서 S2',LS1:'리밋 LS1',LS2:'리밋 LS2',
  MA1:'A 후방 줄 기기',MA2:'A 전방 줄 기기',MB1:'B 후방 줄 기기',MB2:'B 전방 줄 기기',R1:'공급 줄 기기'};
const PRAC_NAME={'':'없음',valve52s:'5/2 편솔',valve52d:'5/2 양솔',fcv:'유량조절',qev:'급속배기',prv:'감압'};
const pracValName=v=>PRAC_NAME[v]||v.replace('+',' 전진 끝').replace('-',' 후진 끝');
function pracState(){return store.practice=store.practice||{sec:0,run:false};}
function renderPractice(){
  const mis=cur(),box=$('practice');box.hidden=!mis.practice;if(!mis.practice)return;
  const st=pracState(),ch=mis.practice.choices;
  box.innerHTML=`<div class="prac-top"><span class="clock" id="pracClock" title="걸린 시간">${fmtTime(st.sec)}</span>
      <button class="btn ${st.run?'':'primary'}" id="pracRun">${st.run?'일시정지':st.sec?'계속':'시작'}</button>
      <button class="btn" id="pracZero">0으로</button></div>
    <ul class="req">${mis.practice.check.map(t=>`<li>${t}</li>`).join('')}</ul>
    <details class="prac-board" ${st.boardOpen?'open':''}><summary>판 구성 (공개도면대로 고르기)</summary>
      <div class="prac-grid">${Object.keys(ch).map(slot=>`<label><span>${PRAC_LABEL[slot]||slot}</span>
        <select data-slot="${slot}">${ch[slot].map(v=>`<option value="${v}" ${(UI.board[slot]||'')===v?'selected':''}>${pracValName(v)}</option>`).join('')}</select></label>`).join('')}</div>
    </details>`;
}
// 판 구성 바꾸기: 공기를 끄고, 바뀌는 부품에 꽂힌 선·호스가 없어야 한다 (꽂힌 잭의 위치가 그대로인지로 판단)
function setPracticeSlot(slot,val){
  const old=Object.assign({},UI.board),next=Object.assign({},old);
  if(val)next[slot]=val;else delete next[slot];
  if(S.air){toast('공기 공급을 먼저 끈 뒤 판 구성을 바꾸세요.');renderPractice();return;}
  if(/^[AB][+-]$/.test(val)&&Object.values(next).filter(v=>v===val).length>2){toast('한 실린더 끝에는 센서를 2개까지 달 수 있어요.');renderPractice();return;}
  const used=S.wires.concat(S.hoses),pos={},at=j=>JACKS[j]?JACKS[j].x+','+JACKS[j].y:'';
  used.forEach(x=>[x.a,x.b].forEach(j=>pos[j]=at(j)));
  applyBoard(next);
  const moved=used.filter(x=>[x.a,x.b].some(j=>at(j)!==pos[j]));
  if(moved.length){
    applyBoard(old);UI.flash=moved.map(x=>x.id);renderConn();renderPractice();
    toast('바뀌는 부품에 꽂힌 선·호스를 먼저 빼세요. 깜박이는 선을 더블클릭하면 빠집니다.');return;
  }
  const o=S;S=newWorld({wires:o.wires,hoses:o.hoses,set:Object.assign({},o.set)});S.power=o.power;
  for(const k in S.cyl)if(k in o.cyl)S.cyl[k]=o.cyl[k];
  clearResults();renderConn();save();renderPractice();
}
$('practice').addEventListener('change',e=>{const s=e.target.closest('select[data-slot]');if(s)setPracticeSlot(s.dataset.slot,s.value);});
$('practice').addEventListener('toggle',e=>{if(e.target.matches('details'))pracState().boardOpen=e.target.open;},true);
$('practice').addEventListener('click',e=>{
  const st=pracState();
  if(e.target.id==='pracRun'){st.run=!st.run;save();renderPractice();}
  if(e.target.id==='pracZero'){st.sec=0;st.run=false;save();renderPractice();}
});
// 스톱워치: 실전 연습을 열어 두고 "시작"한 동안 1초씩
setInterval(()=>{
  const mis=cur();if(!mis||!mis.practice||document.hidden||UI.lesson)return;
  const st=pracState();if(!st.run)return;
  st.sec++;const c=$('pracClock');if(c)c.textContent=fmtTime(st.sec);
  if(st.sec%10===0)save();
},1000);
// 도면 창: 띄워 둔 채로 배선할 수 있다. 머리를 끌어 옮긴다
// 도면 그림 주소에도 버전을 붙여 예전 그림이 남지 않게 (빌드가 meta app-version을 채움)
const APP_VER=(document.querySelector('meta[name="app-version"]')||{}).content||'dev';
function showDiagram(){const mis=cur();$('diagramImg').src=mis.diagram+(APP_VER==='dev'?'':'?v='+APP_VER);$('diagramTitle').textContent='도면 — '+mis.title;$('diagram').hidden=false;}
$('diagramBtn').onclick=()=>{if($('diagram').hidden)showDiagram();else $('diagram').hidden=true;};
$('diagramClose').onclick=()=>{$('diagram').hidden=true;};
$('diagramHead').addEventListener('pointerdown',e=>{
  if(e.target.closest('button'))return;
  const box=$('diagram'),r=box.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
  const move=ev=>{box.style.right='auto';box.style.left=Math.max(0,Math.min(innerWidth-80,ev.clientX-dx))+'px';box.style.top=Math.max(0,Math.min(innerHeight-40,ev.clientY-dy))+'px';};
  const stop=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop);e.preventDefault();
});
$('resetBtn').onclick=()=>{$('resetConfirm').hidden=false;};
$('resetNo').onclick=()=>{$('resetConfirm').hidden=true;};
// 배선 초기화: 직접 그은 선·호스는 지우고 기본 전원 선은 다시 꽂는다
$('resetYes').onclick=()=>{$('resetConfirm').hidden=true;applyBoard(Object.assign({},cur().board));S=newWorld(withJumpers(LAYOUTS[cur().layout],{wires:[],hoses:[],set:Object.assign({},cur().set)}));UI.stepIdx=0;clearResults();renderConn();};

// 설정 ⚙ → 모든 기록 지우기: 한 번 더 확인받고 저장을 지운 뒤 새로고침 (처음 온 사람과 같은 상태: 자유 실습, 강의·미션 칸 접힘)
$('settingsBtn').onclick=()=>{const box=$('settings');box.hidden=!box.hidden;$('settingsBtn').setAttribute('aria-expanded',!box.hidden);$('wipeConfirm').hidden=true;};
$('wipeBtn').onclick=()=>{$('wipeConfirm').hidden=false;};
$('wipeNo').onclick=()=>{$('wipeConfirm').hidden=true;};
$('wipeYes').onclick=()=>{WIPED=true;try{localStorage.removeItem(KEY);}catch(e){}location.reload();};

/* ===================== 루프 ===================== */
let last=performance.now();
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(typeof demoFrame==='function')demoFrame(dt);   // 시연 (demo-ui.js)
  stepWorld(S,dt);
  if(S.events.length){S.events=[];toast('합선이 감지되어 전원이 차단되었습니다. +24V와 0V가 곧바로 이어진 선을 찾아 지우세요.');}
  renderDyn();updateTutorial();recMotion();   // recMotion: 변위단계선도 기록 (mydiagram-ui.js)
  requestAnimationFrame(loop);
}

/* ===================== 시작 ===================== */
UI.mode=store.mode||'tut';
if(!ZOOMS.includes(store.zoom))store.zoom=1;
PLUGGED=!!store.plugged;
if(typeof store.autoColor!=='boolean')store.autoColor=true;
$('autoColor').setAttribute('aria-pressed',store.autoColor);setColor(UI.color);
applyZoom();
loadMission(ALL.some(x=>x.id===store.last)?store.last:'free');
// 루프는 뒤에 불러오는 파일(lesson·mydiagram-ui)까지 모두 읽은 뒤 시작한다 (먼저 돌면 recMotion이 없어 루프가 멈춤)
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(loop));else requestAnimationFrame(loop);
