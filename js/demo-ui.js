/* ===================== 시연 (자동 재생) — 화면 =====================
   튜토리얼에서 "시연 보기"를 누르면 빈 판에서 단계 데이터대로 선을 하나씩 꽂고, 전원·공기를 켜고, 버튼을 눌러 보인다.
   계획·진행은 demo.js(DEMO), 여기서는 그리기와 조작 막대(일시정지·한 단계·속도·그만)만. 끝나면 빈 판으로 돌아간다.
   시연 중에는 "내 회로 도면"을 띄워 두고, 호스 단계면 공기압회로도, 선 단계면 전기회로도 탭이 같이 자란다.
   mydiagram-ui.js 다음에 불러온다 (S·UI·cur·loadCircuit·setColor·showMyDiagram을 쓴다). */
const DM={run:null,paused:false,stepOnce:false,speed:1,endT:0};
const SPEEDS=[.5,1,2,4];
function demoUpdateBtn(){$('demoBtn').hidden=!inTutorial()||!!DM.run;}
function demoStart(){
  if(!inTutorial())return;
  loadCircuit();   // 튜토리얼처럼 빈 판(기본 전원 선만)에서 시작
  S.power=false;S.air=false;
  DM.run=DEMO.start(cur(),DEMO.plan(cur(),JACKS,S.wires.concat(S.hoses)));
  DM.paused=false;DM.stepOnce=false;DM.endT=0;DM.color=UI.color;DEMO_ON=true;
  document.body.classList.add('demo-on');$('demoBar').hidden=false;demoUpdateBtn();
  // 도면 창은 작게 오른쪽 위로 (트레이너 앞을 많이 가리지 않게). 사용자가 옮겨 둔 창이면 그대로
  const box=$('mydiag');DM.sized=box.hidden&&!box.style.left&&!box.style.width;   // 사용자가 옮기거나 크기를 바꾼 창은 그대로
  if(DM.sized){box.style.width='min(440px,32vw)';box.style.height='min(400px,46vh)';}
  showMyDiagram(true);demoBarText();
}
// 끝내기: 누르던 버튼을 떼고, 플러그는 원래대로, 판은 빈 판으로
function demoStop(){
  if(!DM.run)return;
  DM.run=null;DEMO_ON=false;
  document.body.classList.remove('demo-on');$('demoBar').hidden=true;
  $('demoPath').setAttribute('d','');$('demoHand').setAttribute('r',0);
  PLUGGED=!!store.plugged;
  setColor(DM.color||UI.color);   // 시연이 바꾼 툴바 색을 원래대로
  if(DM.sized){const box=$('mydiag');box.style.width=box.style.height='';DM.sized=false;}
  loadCircuit();demoUpdateBtn();
}
function demoBarText(){
  const r=DM.run;if(!r)return;
  const n=r.plan.length, i=Math.min(r.i+1,n);
  $('demoInfo').textContent=r.fail?'시연이 멈췄어요: '+r.fail:r.done?'시연 끝! 곧 빈 판으로 돌아가요. 이제 직접 해 보세요.':`시연 중 · ${i}/${n} 단계${DM.paused?' (일시정지)':''}`;
  $('demoPause').textContent=DM.paused?'▶ 계속':'⏸ 일시정지';
  $('demoPause').disabled=$('demoNext').disabled=!!(r.done||r.fail);
  $('demoSpeed').textContent=DM.speed+'배';
}
// 시연이 하는 일을 화면에 반영
function demoFx(kind,v){
  if(kind==='conn'){renderConn();const a=DM.run.plan[DM.run.i];MYUI.tab=a.do==='hose'?'pneu':'elec';renderMyDiagram(true);}
  if(kind==='color')setColor(v);
  if(kind==='plug')PLUGGED=true;   // 시연 동안만 꽂는다 (끝나면 저장된 상태로)
  if(kind==='quiz'){UI.quiz.ok=true;renderQuiz();}
}
// 선이 그어지는 모습: 경로를 p만큼만 보이고, 끝에 손가락 점
function demoDraw(anim){
  const path=$('demoPath'),hand=$('demoHand');
  if(!anim){path.setAttribute('d','');hand.setAttribute('r',0);return;}
  path.setAttribute('d',anim.hose?hosePath(anim.a,anim.b):wirePath(anim.a,anim.b));
  path.setAttribute('class','demo-path'+(anim.hose?' hose':''));
  const L=path.getTotalLength(),pt=path.getPointAtLength(L*anim.p);
  path.style.strokeDasharray=L;path.style.strokeDashoffset=L*(1-anim.p);
  hand.setAttribute('cx',pt.x);hand.setAttribute('cy',pt.y);hand.setAttribute('r',9);
}
// 매 프레임 (app.js 루프에서 stepWorld 전에)
function demoFrame(dt){
  const r=DM.run;if(!r)return;
  if(r.done||r.fail){
    if(r.done&&(DM.endT+=dt)>4)demoStop();   // 다 된 모습을 4초 보여 주고 빈 판으로
    return;
  }
  if(DM.paused){DEMO.timers(r,dt);return;}
  const i=r.i,c={color:UI.color,auto:store.autoColor,quiz:UI.quiz.ok,plugged:PLUGGED};
  DEMO.tick(r,S,c,dt*DM.speed,demoFx,dt);
  demoDraw(r.anim);
  if(r.done||r.fail)DEMO.releaseAll(S);
  if(r.i!==i&&DM.stepOnce){DM.paused=true;DM.stepOnce=false;}
  if(r.i!==i||r.done||r.fail)demoBarText();
}
$('demoBtn').onclick=demoStart;
$('demoStop').onclick=demoStop;
$('demoPause').onclick=()=>{DM.paused=!DM.paused;DM.stepOnce=false;demoBarText();};
$('demoNext').onclick=()=>{DM.paused=false;DM.stepOnce=true;demoBarText();};   // 지금 단계를 마치면 멈춤
$('demoSpeed').onclick=()=>{DM.speed=SPEEDS[(SPEEDS.indexOf(DM.speed)+1)%SPEEDS.length];demoBarText();};
setInterval(demoUpdateBtn,300);   // 튜토리얼/미션 모드가 바뀌면 버튼 보이기·숨기기
