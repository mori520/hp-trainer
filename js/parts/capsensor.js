/* 정전용량 센서(S1…), 3선식 PNP: 갈색 <id>_p(+24V), 청색 <id>_n(0V), 흑색 <id>_out(신호).
   전원(갈색 +24V, 청색 0V)이 들어간 상태에서 감지하면 신호선이 갈색 쪽(+24V)과 이어진다.
   전원 판단은 앞 계산 결과를 쓰므로 한 박자 늦게 반영된다 */
PARTS.capsensor={
  wire3:true,   // 3선식 센서 (내 회로 도면이 센서 기호로 그림)
  kind:'정전용량형',
  elec(p,w,u,all){if(all||(w.sensor[p.id]&&w.sensorPow[p.id]))u.u(p.id+'_out',p.id+'_p');},
  update(p,w,on,e){w.sensorPow[p.id]=!!(w.power&&e.hot(p.id+'_p')&&e.gnd(p.id+'_n'));},
  sense(p,w){w.sensor[p.id]=(p.cyl in w.cyl)&&cylEnd(w.cyl[p.cyl])===p.end;},
  draw(p){
    const s=sensorSpot(p), {mx,hx,y,below,jy}=s, id=p.id;
    const g=R[id]=el('g',{},G);
    const fy=below?y+44:y-10;   // 감지면이 막대 끝을 향함
    // 정전용량형은 둥근 감지면, 유도형은 각진 금속 머리 + 코일 표시(물결)
    if(p.type==='indsensor'){
      el('rect',{x:hx-9,y:fy-1,width:18,height:14,class:'chrome'},g);
      el('path',{d:`M${hx-6},${fy+(below?3:11)} q1.5,-3 3,0 t3,0 t3,0 t3,0`,class:'sym',fill:'none'},g);
    }else el('rect',{x:hx-8,y:fy,width:16,height:12,rx:3,class:'steel'},g);
    p.r.led=el('circle',{cx:hx,cy:fy+6,r:3.5,class:'led'},g);
    sensorPlate(s,g,id+(p.type==='indsensor'?' 유도형':' 센서'),[[id+'_p','brown','갈','+24V'],[id+'_n','blue','청','0V'],[id+'_out','black','흑','출력']]);
  },
  // 전원이 있고 감지 중일 때 표시등이 켜진다 (실제 센서처럼 출력 표시)
  render(p,w){p.r.led.classList.toggle('on',!!(w.sensor[p.id]&&w.sensorPow[p.id]));}
};
/* 유도형 센서: 실제로는 금속만 감지한다(정전용량형은 금속·비금속 모두). 시뮬레이터의 실린더 막대는 금속이라 동작은 같다.
   잭 이름 규칙도 같다(<id>_p 갈색 / <id>_n 청색 / <id>_out 흑색). 그림만 다르다 */
PARTS.indsensor=Object.assign({},PARTS.capsensor,{kind:'유도형'});
