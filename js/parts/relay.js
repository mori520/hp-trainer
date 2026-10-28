/* 릴레이 모듈: 릴레이 3개(이름 K1…은 놓인 순서대로), 랙 2칸 너비.
   릴레이마다 코일 <K>_A1(+) / <K>_A2(−), c접점 4개: n번 접점은 공통 <K>_n1, NC <K>_n2, NO <K>_n4
   코일이 여자되면 다음 계산부터 모든 접점이 바뀐다 (NO 닫힘, NC 열림) */
const RELAY_CONTACTS=4;
PARTS.relay={
  label:p=>`릴레이 모듈(${p.relays[0]}~${p.relays[p.relays.length-1]})`,
  span:2,
  relayCount:3,
  rails:p=>rackRails(p.rack,p.span),
  loads:p=>p.relays.map(K=>({name:K,a:K+'_A1',b:K+'_A2',coil:true})),
  init(p,w){p.relays.forEach(K=>w.relay[K]=false);},
  update(p,w,on){p.relays.forEach(K=>w.relay[K]=!!on[K]);},
  elec(p,w,u,all){
    p.relays.forEach(K=>{
      const on=w.relay[K];
      for(let n=1;n<=RELAY_CONTACTS;n++){
        if(all||on)u.u(`${K}_${n}1`,`${K}_${n}4`);
        if(all||!on)u.u(`${K}_${n}1`,`${K}_${n}2`);
      }
    });
  },
  draw(p){
    const m=rackModule(p,'릴레이 모듈'), y=m.oy;
    p.relays.forEach((K,j)=>{
      const x0=m.x+6+j*126;
      tx(K,{x:x0+50,y:y+80,'text-anchor':'middle',class:'ptxt'},m.g);
      p.r[K+'led']=el('circle',{cx:x0+72,cy:y+76,r:5,class:'led'},m.g);
      // 코일
      ejack(K+'_A1',x0+22,y+104,'red',m.g,'A1',0,-16);
      ejack(K+'_A2',x0+100,y+104,'blue',m.g,'A2',0,-16);
      el('line',{x1:x0+32,y1:y+104,x2:x0+44,y2:y+104,class:'sym'},m.g);
      el('line',{x1:x0+78,y1:y+104,x2:x0+90,y2:y+104,class:'sym'},m.g);
      R[K+'coil']=el('rect',{x:x0+44,y:y+94,width:34,height:20,fill:'none',class:'sym'},m.g);
      // c접점 4개 (2×2)
      p.r[K+'blade']=[];
      for(let n=1;n<=RELAY_CONTACTS;n++){
        const cx=x0+[32,92][(n-1)%2], cy=y+[134,204][n>2?1:0];
        ejack(`${K}_${n}1`,cx,cy,'black',m.g,n+'1',20,4);
        ejack(`${K}_${n}2`,cx-17,cy+40,'black',m.g,n+'2',0,22);
        ejack(`${K}_${n}4`,cx+17,cy+40,'black',m.g,n+'4',0,22);
        el('line',{x1:cx,y1:cy+10,x2:cx,y2:cy+14,class:'sym'},m.g);
        el('line',{x1:cx-17,y1:cy+30,x2:cx-17,y2:cy+24,class:'sym'},m.g);
        el('line',{x1:cx-17,y1:cy+24,x2:cx-11,y2:cy+24,class:'sym'},m.g);
        el('line',{x1:cx+17,y1:cy+30,x2:cx+17,y2:cy+24,class:'sym'},m.g);
        p.r[K+'blade'].push(el('line',{x1:cx,y1:cy+14,x2:cx-13,y2:cy+24,class:'sym'},m.g));
      }
    });
  },
  // 코일이 켜지면 표시등이 켜지고 접점 날이 NC 쪽에서 NO 쪽으로 넘어간다
  render(p,w){
    p.relays.forEach(K=>{
      const on=w.relay[K];
      p.r[K+'led'].classList.toggle('on',on);
      p.r[K+'blade'].forEach(b=>{const cx=+b.getAttribute('x1');b.setAttribute('x2',on?cx+15:cx-13);});
    });
  }
};
