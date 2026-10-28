/* ===================== 내 회로 도면: 창 =====================
   "내 회로 도면" 버튼 → 떠 있는 창(탭: 공기압회로도 / 변위단계선도 / 전기회로도). 띄운 채로 배선하거나 버튼을 누르면 바로바로 다시 그린다.
   변위단계선도 기록(MYD.recTick)은 매 프레임 app.js 루프에서 recMotion()으로 부른다.
   app.js 다음에 불러온다 (S·UI·cur·LAYOUT을 쓴다). 그림은 mydiagram.js */
const MYUI={tab:'pneu',key:''};
const REC=MYD.recNew();
function recReset(){Object.assign(REC,MYD.recNew(),{ver:REC.ver+1});}
function recMotion(){if(S)MYD.recTick(REC,S);}
function myDiagramSvg(){
  if(MYUI.tab==='pneu')return MYD.pneu(LAYOUT.parts,S.hoses,{set:S.set,leak:S.out.leak,valve:S.valve});
  if(MYUI.tab==='disp')return MYD.disp(REC.runs.map(MYD.recSeq),Object.keys(S.cyl),REC.cur&&MYD.recSeq(REC.cur),Object.keys(S.motor||{}));
  return MYD.elec(LAYOUT,PARTS,S,solveElec(S,false));
}
function renderMyDiagram(force){
  const box=$('mydiag');if(box.hidden)return;
  const key=MYUI.tab+'|'+(MYUI.tab==='pneu'?JSON.stringify([S.hoses,UI.board,S.set,S.out.leak,S.valve]):MYUI.tab==='disp'?REC.ver:JSON.stringify([S.wires,S.pb,S.relay,S.out,S.sensor,S.power,S.timer,S.counter]));
  if(!force&&key===MYUI.key)return;
  MYUI.key=key;$('mydiagBody').innerHTML=myDiagramSvg();
  box.querySelectorAll('[data-mytab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mytab===MYUI.tab));
  box.querySelector('[data-mytab="pneu"]').textContent=LAYOUT.fluid==='hyd'?'유압회로도':'공기압회로도';
}
function showMyDiagram(on){$('mydiag').hidden=!on;if(on)renderMyDiagram(true);}
$('mydiagBtn').onclick=()=>showMyDiagram($('mydiag').hidden);
$('mydiagClose').onclick=()=>showMyDiagram(false);
$('mydiag').addEventListener('click',e=>{
  const t=e.target.closest('[data-mytab]');if(t){MYUI.tab=t.dataset.mytab;renderMyDiagram(true);return;}
  if(e.target.id==='mydiagClear'){recReset();renderMyDiagram(true);}
});
// 머리를 끌어 옮긴다 (도면 창과 같은 방식)
$('mydiagHead').addEventListener('pointerdown',e=>{
  if(e.target.closest('button'))return;
  const box=$('mydiag'),r=box.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
  const move=ev=>{box.style.right='auto';box.style.left=Math.max(0,Math.min(innerWidth-80,ev.clientX-dx))+'px';box.style.top=Math.max(0,Math.min(innerHeight-40,ev.clientY-dy))+'px';};
  const stop=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop);e.preventDefault();
});
setInterval(()=>renderMyDiagram(false),250);

/* ---------- 창 배치 ----------
   튜토리얼을 열면 트레이너 오른쪽에 완성 도면(위)과 내 회로 도면(아래)을 나란히 띄운다 (미션 모드는 직접 열 때만).
   크기는 화면에 맞춰 정하고, 사용자가 모서리를 끌어 크기를 바꾸면 store.win에 기억해 다음에도 그 크기로 */
function placeWin(box,{top,height}){
  const saved=(store.win||{})[box.id];
  const w=saved?saved.w:Math.round(Math.min(640,Math.max(340,innerWidth*0.30)));
  const h=saved?saved.h:Math.round(height);
  Object.assign(box.style,{right:'auto',left:Math.max(8,innerWidth-w-16)+'px',top:top+'px',width:w+'px',height:h+'px'});
  box.dataset.setW=w;box.dataset.setH=h;   // 이 크기와 다르면 사용자가 바꾼 것
}
function arrangeWindows(pair){
  const mis=cur(),top=64,avail=innerHeight-top-12,both=pair&&!!mis.diagram;
  if(both){showDiagram();placeWin($('diagram'),{top,height:avail/2-6});}
  placeWin($('mydiag'),{top:both?top+avail/2+6:top,height:both?avail/2-6:avail*0.75});
  showMyDiagram(true);
}
let autoWin=false;   // 튜토리얼이 자동으로 연 창인지 (미션 모드로 바꾸면 닫음)
function tutorialWindows(){
  if(UI.lesson||typeof DEMO_ON!=='undefined'&&DEMO_ON)return;
  if(inTutorial()){autoWin=true;arrangeWindows(true);}
  else if(autoWin){autoWin=false;$('diagram').hidden=true;showMyDiagram(false);}
  if(typeof updateDock==='function')updateDock();
}
// 모서리를 끌어 바꾼 크기를 기억 (내 회로 도면·도면 창)
const watchSize=box=>new ResizeObserver(()=>{
  if(box.hidden||!box.dataset.setW)return;
  const w=box.offsetWidth,h=box.offsetHeight;
  if(Math.abs(w-box.dataset.setW)>4||Math.abs(h-box.dataset.setH)>4){
    store.win=Object.assign(store.win||{},{[box.id]:{w,h}});box.dataset.setW=w;box.dataset.setH=h;save();updateDock();
  }
}).observe(box);
watchSize($('mydiag'));watchSize($('diagram'));
tutorialWindows();   // 처음 열었을 때 (app.js가 먼저 미션을 연 뒤)
// 튜토리얼이 오른쪽에 창을 띄운 동안에는 트레이너를 그 왼쪽 공간에 맞춘다 (창이 판을 가리지 않게)
function updateDock(){
  const open=['diagram','mydiag'].map($).filter(b=>!b.hidden&&b.dataset.setW);
  const on=autoWin&&open.length>0&&!UI.lesson;
  document.body.classList.toggle('docked',on);
  if(on)document.body.style.setProperty('--dock',Math.max(...open.map(b=>b.offsetWidth))+24+'px');
  applyZoom();
}
new MutationObserver(updateDock).observe($('diagram'),{attributes:true,attributeFilter:['hidden']});
new MutationObserver(updateDock).observe($('mydiag'),{attributes:true,attributeFilter:['hidden']});
updateDock();
