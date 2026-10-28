/* 서비스 유닛 + 분배기: 공기 공급 ON/OFF, 압력 조절(▼▲, 설정 SU), 압력계, 분배기 출구 D1~D3
   시험: 공압 0.5±0.05 MPa로 설정. 0.1 MPa보다 낮으면 실린더가 움직이지 않는다 */
PARTS.service={
  settings:()=>({SU:{def:0.5,min:0,max:0.8,step:0.05,unit:'MPa'}}),
  source:(p,w)=>w.set.SU,   // 공급 압력 = 설정값
  pneu(p,w,u){
    ['D1','D2','D3'].forEach(d=>u.u(d,'DIST'));
    if(w.air)u.u('DIST','SUP');
  },
  draw(p){
    const [x,y]=p.at, gx=x+100, gy=y+96;
    const su=el('g',{},G);
    el('rect',{x,y,width:200,height:250,rx:6,class:'panel'},su);
    tx('서비스 유닛',{x:x+14,y:y+22,class:'ptitle'},su);
    el('circle',{cx:gx,cy:gy,r:46,class:'gface'},su);
    for(let k=0;k<=10;k++){
      const a=(-135+27*k)*Math.PI/180, r1=40, r2=k%5?35:31;
      el('line',{x1:gx+r1*Math.sin(a),y1:gy-r1*Math.cos(a),x2:gx+r2*Math.sin(a),y2:gy-r2*Math.cos(a),class:'gtick'},su);
      if(k%5===0)tx((k/10).toFixed(1),{x:gx+23*Math.sin(a),y:gy-23*Math.cos(a)+3,'text-anchor':'middle',class:'gnum'},su);
    }
    tx('MPa',{x:gx,y:gy+30,'text-anchor':'middle',class:'gnum'},su);
    p.r.needle=el('line',{x1:gx,y1:gy,x2:gx,y2:gy-36,class:'needle',style:`transform-origin:${gx}px ${gy}px;transform:rotate(-135deg)`},su);
    el('circle',{cx:gx,cy:gy,r:4,class:'symf'},su);
    R.air=el('g',{class:'toggle',tabindex:0,role:'button','aria-label':'공기 공급'},su);
    el('rect',{x:x+40,y:y+168,width:120,height:34,rx:6},R.air);
    p.r.airTxt=tx('공기 공급 OFF',{x:gx,y:y+190,'text-anchor':'middle'},R.air);
    p.r.setTxt=tx('',{x:x+16,y:y+230,class:'ptxt'},su);
    setButtons(su,'SU',x+136,y+216,24,22);
    el('line',{x1:gx,y1:y+250,x2:gx,y2:y+272,class:'sym'},su);
    el('rect',{x:x+10,y:y+272,width:180,height:56,rx:5,class:'panel'},su);
    tx('분배기',{x:x+20,y:y+289,class:'psmall'},su);
    [50,100,150].forEach((dx,k)=>pport('D'+(k+1),x+dx,y+308,'down',su));
  },
  render(p,w){
    R.air.classList.toggle('on',w.air);p.r.airTxt.textContent=w.air?'공기 공급 ON':'공기 공급 OFF';
    p.r.needle.style.transform=`rotate(${w.air?-135+270*Math.min(1,w.set.SU):-135}deg)`;
    p.r.setTxt.textContent='설정 '+w.set.SU.toFixed(2)+' MPa';
  }
};
