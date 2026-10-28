/* 복동 실린더: 후방 포트 <id>_cap, 전방 포트 <id>_rod. 위치 w.cyl[id] 0(후진)~1(전진) */
const CYL_W=230, CYL_ST=160;   // 몸통 길이, 피스톤 이동 거리(화면 px)
// 센서·리밋스위치를 그릴 위치: 막대 끝(후진 끝 "-" / 전진 끝 "+") 바로 위에 단자판.
// mx = 단자판(잭 3개)의 가운데, hx = 감지 머리(롤러·감지면) 위치, jy = 잭 높이.
// 같은 끝에 두 번째가 오면 "+"는 막대 아래로, "-"는 단자판만 왼쪽으로 비키고 머리는 끝 옆에 둔다(점선으로 이음)
const SENS_DX=30;   // 단자판 잭 간격
function sensorSpot(p){
  const [x,y]=p.cylAt, end=x+CYL_W+(p.end==='+'?CYL_ST:0);
  let mx=end,hx=end,below=false;
  if(p.stack>0){if(p.end==='-'){mx=end-110;hx=end-14;}else below=true;}
  return{mx,hx,y,below,jy:below?y+104:y-46};
}
// 밝은 단자판 + 이름 + 잭 3개(각 잭 아래 두 줄 표시: 위 = 번호·선 색, 아래 = 역할)
function sensorPlate(s,g,name,jacks){
  el('rect',{x:s.mx-46,y:s.jy-42,width:92,height:80,rx:4,class:'panel'},g);
  tx(name,{x:s.mx,y:s.jy-28,'text-anchor':'middle',class:'ptxt'},g);
  if(Math.abs(s.mx-s.hx)>30)el('path',{d:`M${s.mx},${s.jy+38} V${s.y-12} H${s.hx}`,class:'leader',fill:'none'},g);
  jacks.forEach(([id,color,top,role],k)=>{
    const x=s.mx+(k-1)*SENS_DX;
    ejack(id,x,s.jy,color,g,top,0,21);
    tx(role,{x,y:s.jy+32,'text-anchor':'middle',class:'psmall'},g);
  });
}
PARTS.cylinder={
  init(p,w){w.cyl[p.id]=0;},
  // 움직이는 동안 속도 배율(유량조절·급속배기)과 미터 방식, 공급 압력을 남긴다 (채점용)
  // w.cylSup[id]: 이번에 움직였으면 공급 쪽 포트 (압력스위치가 "움직이는 동안은 압력이 낮다"를 판단)
  move(p,w,P,E,dt,pn){
    const cap=p.id+'_cap', rod=p.id+'_rod';
    let dir=0,sup,exh,k=1;
    if(P(cap)&&E(rod)){dir=1;sup=cap;exh=rod;} else if(P(rod)&&E(cap)){dir=-1;sup=rod;exh=cap;}
    // 하중 실린더(cylw): 전방 쪽 기름이 빠질 수 있고 후방 쪽이 막혀 있지 않으면 무게로 천천히 내려감(전진 방향)
    else if(p.type==='cylw'&&E(rod)&&(pn?pn.fill(cap):E(cap)||P(cap))){dir=1;sup=cap;exh=rod;k=.35;}
    w.cylSup[p.id]=null;
    if(!dir)return;
    const f=pn?pn.flow(sup,exh):{k:1,meter:''};
    const before=w.cyl[p.id];
    w.cyl[p.id]=Math.max(0,Math.min(1,before+dir*k*f.k*dt/STROKE_T));
    if(w.cyl[p.id]!==before){w.meter[p.id]=f.meter;w.cylP[p.id]=pn?pn.press(sup):0;w.cylSup[p.id]=sup;}
  },
  draw(p){
    const [x,y]=p.at, W=CYL_W;
    const cy=el('g',{},G);
    tx('실린더 '+p.id,{x,y:y-28,class:'btxt'},cy);
    el('rect',{x:x+20,y:y+60,width:16,height:16,class:'steel'},cy);
    el('rect',{x:x+W-46,y:y+60,width:16,height:16,class:'steel'},cy);
    pport(p.id+'_cap',x+28,y+84,'down',cy,'후방',0,26);
    pport(p.id+'_rod',x+W-38,y+84,'down',cy,'전방',0,26);
    p.r.rod=el('rect',{x:x+40,y:y+22,width:W-40,height:12,class:'chrome'},cy);
    p.r.rodEnd=el('rect',{x:x+W-8,y:y+14,width:14,height:28,rx:3,class:'chrome'},cy);
    el('rect',{x,y,width:W,height:60,rx:4,class:'steel'},cy);
    el('rect',{x,y,width:20,height:60,class:'chrome'},cy);
    el('rect',{x:x+W-20,y,width:20,height:60,class:'chrome'},cy);
    p.r.piston=el('rect',{x:x+24,y:y+4,width:16,height:52,class:'piston'},cy);
    p.r.rodIn=el('rect',{x:x+40,y:y+24,width:W-60,height:8,class:'chrome'},cy);
  },
  render(p,w){
    const [x]=p.at, W=CYL_W, px=x+24+w.cyl[p.id]*CYL_ST;
    p.r.piston.setAttribute('x',px);
    p.r.rodIn.setAttribute('x',px+16);p.r.rodIn.setAttribute('width',Math.max(0,x+W-20-(px+16)));
    p.r.rod.setAttribute('x',px+16);p.r.rodEnd.setAttribute('x',px+16+W-48);
  }
};

/* 하중 실린더(cylw): 세워서 무거운 물건을 단 실린더 (유압 카운터밸런스·로킹 회로 연습용). 그림은 같고 막대 끝에 추(W).
   밸브가 A·B를 탱크로 열어 두면(ABT 중립 등) 무게 때문에 천천히 전진 방향으로 내려간다 (자중 낙하) */
PARTS.cylw=Object.assign({},PARTS.cylinder,{
  draw(p){
    PARTS.cylinder.draw(p);
    const g=el('g',{},G);p.r.weight=g;
    el('rect',{x:0,y:0,width:30,height:30,rx:3,class:'weight'},g);
    tx('W',{x:15,y:20,'text-anchor':'middle',class:'ptxt'},g);
    tx('하중 W (무게로 전진 쪽으로 내려가려 함)',{x:p.at[0]+90,y:p.at[1]-12,class:'psmall'},G);
  },
  render(p,w){
    PARTS.cylinder.render(p,w);
    const [x,y]=p.at, px=x+24+w.cyl[p.id]*CYL_ST;
    p.r.weight.setAttribute('transform',`translate(${px+16+CYL_W-34},${y+44})`);
  }
});
