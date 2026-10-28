/* 리밋스위치(LS1…): 실린더 막대 끝이 롤러를 누르면 c접점이 바뀐다.
   잭: <id>_1 공통, <id>_2 NC, <id>_4 NO. 붙는 위치는 미션 데이터 board의 "LS2":"A+" 처럼 정한다 */
PARTS.limitsw={
  elec(p,w,u,all){
    const a=w.sensor[p.id];
    if(all||a)u.u(p.id+'_1',p.id+'_4');
    if(all||!a)u.u(p.id+'_1',p.id+'_2');
  },
  sense(p,w){w.sensor[p.id]=(p.cyl in w.cyl)&&cylEnd(w.cyl[p.cyl])===p.end;},
  draw(p){
    const s=sensorSpot(p), {mx,hx,y,below,jy}=s, id=p.id;
    const g=R[id]=el('g',{},G);
    // 롤러 레버 (막대 끝에 닿는 쪽)
    if(below){
      p.r.roller=el('circle',{cx:hx,cy:y+47,r:4,class:'roller'},g);
      el('rect',{x:hx-6,y:y+52,width:12,height:6,class:'steel'},g);
    }else{
      el('rect',{x:hx-6,y:y-8,width:12,height:6,class:'steel'},g);
      el('line',{x1:hx,y1:y-2,x2:hx,y2:y+5,class:'sym'},g);
      p.r.roller=el('circle',{cx:hx,cy:y+9,r:4,class:'roller'},g);
    }
    // 잭과 접점 기호 (1 공통 — 2 NC — 4 NO)
    sensorPlate(s,g,id+' 리밋',[[id+'_1','black','1','공통'],[id+'_2','black','2','NC'],[id+'_4','black','4','NO']]);
    const c1=mx-SENS_DX,c2=mx,c4=mx+SENS_DX,sy=jy-14;
    el('line',{x1:c1,y1:jy-10,x2:c1,y2:sy,class:'sym'},g);
    el('line',{x1:c2,y1:jy-10,x2:c2,y2:sy-4,class:'sym'},g);
    el('line',{x1:c2-6,y1:sy-4,x2:c2,y2:sy-4,class:'sym'},g);
    el('line',{x1:c4,y1:jy-10,x2:c4,y2:sy-4,class:'sym'},g);
    p.r.blade=el('line',{x1:c1,y1:sy,x2:c2-2,y2:sy-6,class:'sym'},g);
  },
  // 눌리면 롤러 색이 바뀌고 접점 날이 NC(2)에서 NO(4)로 넘어간다
  render(p,w){
    const a=w.sensor[p.id], x1=+p.r.blade.getAttribute('x1');
    p.r.roller.classList.toggle('on',a);
    p.r.blade.setAttribute('x2',a?x1+2*SENS_DX-2:x1+SENS_DX-2);
  }
};
