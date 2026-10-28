/* ===================== 내 회로 도면: 창 =====================
   "내 회로 도면" 버튼 → 떠 있는 창(탭: 공기압회로도 / 변위단계선도 / 전기회로도). 띄운 채로 배선하면 바로바로 다시 그린다.
   변위단계선도는 실린더가 끝에 닿을 때마다 기록한다: 움직이기 시작하면 기록 시작, 모두 끝에 멈춘 채 1.5초 지나면 한 번(회차) 끝.
   app.js 다음에 불러온다 (S·UI·cur·LAYOUT을 쓴다). 그림은 mydiagram.js */
const MYUI={tab:'pneu',key:''};
const REC={at:{},cur:null,runs:[],last:0,ver:0};
const REST=1.5;   // 이만큼 모두 멈춰 있으면 한 회차가 끝난 것으로 본다
function recReset(){REC.at={};REC.cur=null;REC.runs=[];REC.ver++;}
// 매 프레임(app.js 루프): 실린더가 끝에 닿거나 떠난 순간을 기록
function recMotion(){
  if(!S)return;
  let moving=false;
  for(const k in S.cyl){
    const e=cylEnd(S.cyl[k]),prev=REC.at[k];
    if(prev===undefined){REC.at[k]=e;continue;}
    if(!e)moving=true;
    if(e===prev)continue;
    REC.at[k]=e;
    if(!e){   // 끝에서 떠남
      if(!REC.cur)REC.cur={ev:[]};
      REC.cur.ev.push({k,t:S.t,dep:true});
    }else if(REC.cur)REC.cur.ev.push({k,e,t:S.t});
    REC.last=S.t;REC.ver++;
  }
  if(REC.cur&&!moving&&S.t-REC.last>REST){
    REC.runs.push(REC.cur);if(REC.runs.length>2)REC.runs.shift();
    REC.cur=null;REC.ver++;
  }
}
// 기록 → 변위단계선도 칸: 도착마다 한 칸, 도착 뒤 다음 출발까지 1초 넘게 머물면 "wait:n초" 칸을 끼운다
function recSeq(run){
  const seq=[],ev=run.ev;
  ev.forEach((x,i)=>{
    if(x.dep)return;
    seq.push(x.k+x.e);
    const nx=ev.slice(i+1).find(y=>y.dep);
    if(nx&&nx.t-x.t>1)seq.push(`wait:${(nx.t-x.t).toFixed(1)}초`);
  });
  return{seq};
}
function myDiagramSvg(){
  if(MYUI.tab==='pneu')return MYD.pneu(LAYOUT.parts,S.hoses,{set:S.set,leak:S.out.leak,valve:S.valve});
  if(MYUI.tab==='disp')return MYD.disp(REC.runs.map(recSeq),Object.keys(S.cyl),REC.cur&&recSeq(REC.cur));
  return `<p class="mydiag-soon">전기회로도는 다음 단계에서 추가돼요. 지금은 공기압회로도와 변위단계선도를 볼 수 있어요.</p>`;
}
function renderMyDiagram(force){
  const box=$('mydiag');if(box.hidden)return;
  const key=MYUI.tab+'|'+(MYUI.tab==='pneu'?JSON.stringify([S.hoses,UI.board,S.set,S.out.leak,S.valve]):MYUI.tab==='disp'?REC.ver:'');
  if(!force&&key===MYUI.key)return;
  MYUI.key=key;$('mydiagBody').innerHTML=myDiagramSvg();
  box.querySelectorAll('[data-mytab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mytab===MYUI.tab));
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
