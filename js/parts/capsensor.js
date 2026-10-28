/* 정전용량 센서(S1…), 3선식 PNP: 갈색 <id>_p(+24V), 청색 <id>_n(0V), 흑색 <id>_out(신호).
   전원(갈색 +24V, 청색 0V)이 들어간 상태에서 감지하면 신호선이 갈색 쪽(+24V)과 이어진다.
   전원 판단은 앞 계산 결과를 쓰므로 한 박자 늦게 반영된다 */
PARTS.capsensor={
  elec(p,w,u,all){if(all||(w.sensor[p.id]&&w.sensorPow[p.id]))u.u(p.id+'_out',p.id+'_p');},
  update(p,w,on,e){w.sensorPow[p.id]=!!(w.power&&e.hot(p.id+'_p')&&e.gnd(p.id+'_n'));},
  sense(p,w){w.sensor[p.id]=(p.cyl in w.cyl)&&cylEnd(w.cyl[p.cyl])===p.end;},
  draw(p){
    const s=sensorSpot(p), {mx,hx,y,below,jy}=s, id=p.id;
    const g=R[id]=el('g',{},G);
    const fy=below?y+44:y-10;   // 감지면이 막대 끝을 향함
    el('rect',{x:hx-8,y:fy,width:16,height:12,rx:3,class:'steel'},g);
    p.r.led=el('circle',{cx:hx,cy:fy+6,r:3.5,class:'led'},g);
    sensorPlate(s,g,id+' 센서',[[id+'_p','brown','갈','+24V'],[id+'_n','blue','청','0V'],[id+'_out','black','흑','출력']]);
  },
  // 전원이 있고 감지 중일 때 표시등이 켜진다 (실제 센서처럼 출력 표시)
  render(p,w){p.r.led.classList.toggle('on',!!(w.sensor[p.id]&&w.sensorPow[p.id]));}
};
