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
  if(MYUI.tab==='disp')return MYD.disp(REC.runs.map(MYD.recSeq),Object.keys(S.cyl),REC.cur&&MYD.recSeq(REC.cur));
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
