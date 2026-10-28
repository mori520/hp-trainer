/* 공압 기기: 밸브와 실린더 사이(또는 공급 줄)에 호스로 끼워 쓴다. 고정판의 기기 자리(MA1… / R1)에 미션 데이터로 놓는다.
   fcv 일방향 유량조절밸브 F1: 1번(아래, 밸브 쪽) → 2번(위, 실린더 쪽)은 체크밸브로 자유, 2→1은 조여짐(▼▲ 1~10단, 10 = 다 열림).
       실린더에서 나가는 공기를 조이면 미터아웃, 들어가는 공기를 조이면 미터인 (끼운 방향에 따라 결정)
   qev 급속배기밸브 Q1: P(아래, 밸브 쪽) → A(위, 실린더 쪽). 실린더에서 나오는 공기를 그 자리에서 빼서 그쪽 움직임이 빨라짐
   prv 감압밸브 PR1: 1번(입구) → 2번(출구) 압력을 설정값(▼▲)으로 낮춘다. 1차 쪽에 공급이 없으면(거꾸로 끼움) 지나가지 않음 */
const DEV_W=120,DEV_H=70,DEV_PAD=16;   // 판은 포트(위·아래 끝)와 글자가 밖으로 나가지 않게 위아래로 DEV_PAD만큼 더 크게
function devPanel(p,title){
  const [cx,ty]=p.at,g=el('g',{},G);R[p.tags[0]]=g;
  el('rect',{x:cx-DEV_W/2,y:ty-DEV_PAD,width:DEV_W,height:DEV_H+2*DEV_PAD,rx:5,class:'panel'},g);
  tx(title,{x:cx+DEV_W/2-6,y:ty+14,'text-anchor':'end',class:'psmall'},g);
  return{g,cx,ty,px:cx-30};
}
PARTS.fcv={
  tag:'F',
  settings:p=>({[p.tags[0]]:{def:10,min:1,max:10,step:1,unit:'단'}}),
  dev:(p,w)=>{const F=p.tags[0];return{kind:'fcv',a:F+'_1',b:F+'_2',k:w.set[F]/10};},
  draw(p){
    const F=p.tags[0],{g,cx,ty,px}=devPanel(p,'유량조절 '+F);
    pport(F+'_2',px,ty,'up',g,'2',-16,4);
    pport(F+'_1',px,ty+DEV_H,'down',g,'1',-16,4);
    // 기호: 조임(왼쪽 가지) ∥ 체크밸브(오른쪽 가지, 1→2 방향 자유)
    el('path',{d:`M${px},${ty+10}V${ty+18}H${px-10}V${ty+52}H${px}V${ty+60}M${px},${ty+18}H${px+10}V${ty+52}H${px}`,class:'sym'},g);
    el('path',{d:`M${px-14},${ty+28}Q${px-10},${ty+35} ${px-14},${ty+42}M${px-6},${ty+28}Q${px-10},${ty+35} ${px-6},${ty+42}`,class:'sym'},g);
    el('line',{x1:px-17,y1:ty+44,x2:px-3,y2:ty+26,class:'sym','marker-end':'url(#ah)'},g);
    el('circle',{cx:px+10,cy:ty+33,r:4,fill:'none',class:'sym'},g);
    el('path',{d:`M${px+5},${ty+43}L${px+10},${ty+38}L${px+15},${ty+43}`,class:'sym'},g);
    tx('속도',{x:cx+30,y:ty+28,'text-anchor':'middle',class:'psmall'},g);
    p.r.val=tx('',{x:cx+30,y:ty+44,'text-anchor':'middle',class:'ptxt'},g);
    setButtons(g,F,cx+8,ty+49);
  },
  render(p,w){p.r.val.textContent=w.set[p.tags[0]]+'단';}
};
PARTS.qev={
  tag:'Q',
  dev:p=>{const Q=p.tags[0];return{kind:'qev',a:Q+'_P',b:Q+'_A'};},
  draw(p){
    const Q=p.tags[0],{g,cx,ty,px}=devPanel(p,'급속배기 '+Q);
    pport(Q+'_A',px,ty,'up',g,'A',-16,4);
    pport(Q+'_P',px,ty+DEV_H,'down',g,'P',-16,4);
    // 기호: 몸체 + 셔틀 + 옆으로 바로 배기(R)
    el('rect',{x:px-12,y:ty+22,width:24,height:26,fill:'none',class:'sym'},g);
    el('path',{d:`M${px},${ty+10}V${ty+22}M${px},${ty+48}V${ty+60}M${px+12},${ty+35}H${px+26}`,class:'sym'},g);
    el('circle',{cx:px,cy:ty+35,r:4,class:'symf'},g);
    el('path',{d:`M${px+26},${ty+29}L${px+38},${ty+35}L${px+26},${ty+41}Z`,class:'sym'},g);
    tx('R 배기',{x:cx+34,y:ty+52,'text-anchor':'middle',class:'psmall'},g);
  }
};
PARTS.prv={
  tag:'PR',
  settings:p=>({[p.tags[0]]:{def:0.5,min:0.1,max:0.8,step:0.05,unit:'MPa'}}),
  dev:(p,w)=>{const N=p.tags[0];return{kind:'prv',a:N+'_1',b:N+'_2',set:w.set[N]};},
  draw(p){
    const N=p.tags[0],[x,y]=p.at,g=el('g',{},G);R[N]=g;
    el('rect',{x,y,width:180,height:104,rx:5,class:'panel'},g);   // 아래 포트 이름(1 입구·2 출구)이 테두리에 붙지 않게
    tx('감압밸브 '+N,{x:x+10,y:y+16,class:'ptitle'},g);
    pport(N+'_1',x+22,y+66,'down',g,'1 입구',0,24);
    pport(N+'_2',x+82,y+66,'down',g,'2 출구',0,24);
    // 기호: 정사각 몸체, 화살표, 스프링(조절)
    el('rect',{x:x+38,y:y+26,width:28,height:28,fill:'none',class:'sym'},g);
    el('path',{d:`M${x+22},${y+56}V${y+40}H${x+38}M${x+66},${y+40}H${x+82}V${y+56}`,class:'sym'},g);
    el('line',{x1:x+44,y1:y+48,x2:x+60,y2:y+32,class:'sym','marker-end':'url(#ah)'},g);
    tx('2차 압력',{x:x+142,y:y+34,'text-anchor':'middle',class:'psmall'},g);
    p.r.val=tx('',{x:x+142,y:y+52,'text-anchor':'middle',class:'ptxt'},g);
    setButtons(g,N,x+118,y+60);
  },
  render(p,w){p.r.val.textContent=w.set[p.tags[0]].toFixed(2)+' MPa';}
};
