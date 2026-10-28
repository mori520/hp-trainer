/* 타이머 모듈: 켜짐 지연 타이머 T1. 코일 <T>_A1(+)/<T>_A2(−), c접점 2개 <T>_n1(공통)/<T>_n2(NC)/<T>_n4(NO).
   코일에 전기가 들어온 뒤 설정 시간(w.set.T1 초)이 지나면 접점이 바뀌고, 코일이 꺼지면 곧바로 원래대로 돌아온다.
   설정값은 ▼▲ 버튼으로 맞춘다 (처음 1.0초: 시험처럼 직접 3초로 맞추게) */
PARTS.timer={
  label:()=>'타이머 모듈',needsPower:true,
  tag:'T',tagCount:1,
  rails:p=>rackRails(p.rack),
  settings:p=>({[p.tags[0]]:{def:1,min:0.5,max:10,step:0.5,unit:'초'}}),
  loads:p=>p.tags.map(T=>({name:T,a:T+'_A1',b:T+'_A2',timer:true})),
  init(p,w){p.tags.forEach(T=>w.timer[T]={t:0,out:false});},
  update(p,w,on,e,dt){
    const pow=modulePowered(p,w,e);
    p.tags.forEach(T=>{
      const s=w.timer[T];
      if(pow&&on[T]){s.t+=dt;s.out=s.t>=w.set[T]-1e-9;}else{s.t=0;s.out=false;}
    });
  },
  elec(p,w,u,all){p.tags.forEach(T=>cContacts(u,T,2,w.timer[T].out,all));},
  draw(p){
    const m=rackModule(p,'타이머 모듈'), y=m.oy, x=m.x, T=p.tags[0];
    p.r.disp=settingDisplay(m.g,x,y,T,T+' 설정 시간');
    p.r.bar=el('rect',{x:x+14,y:y+117,width:0,height:5,class:'disp-bar'},m.g);
    el('rect',{x:x+14,y:y+117,width:162,height:5,class:'disp-track'},m.g);
    m.g.appendChild(p.r.bar);
    ejack(T+'_A1',x+34,y+152,'red',m.g,'A1',0,-16);
    ejack(T+'_A2',x+156,y+152,'blue',m.g,'A2',0,-16);
    el('line',{x1:x+44,y1:y+152,x2:x+66,y2:y+152,class:'sym'},m.g);
    el('line',{x1:x+124,y1:y+152,x2:x+146,y2:y+152,class:'sym'},m.g);
    R[T+'coil']=el('rect',{x:x+66,y:y+143,width:58,height:18,fill:'none',class:'sym'},m.g);
    tx(T,{x:x+95,y:y+156,'text-anchor':'middle',class:'psmall'},m.g);
    p.r.led=el('circle',{cx:x+95,cy:y+133,r:4.5,class:'led'},m.g);
    p.r.blades=[1,2].map(n=>contactCell(m.g,T,n,x+[60,130][n-1],y+190));
  },
  // 코일이 켜지면 표시등, 흐른 시간 막대가 차오르고, 설정 시간이 되면 접점 날이 NO 쪽으로
  render(p,w){
    const T=p.tags[0],s=w.timer[T];
    p.r.disp.textContent=w.modPow[p.id]?w.set[T].toFixed(1)+' 초':'';   // 모듈 전원이 없으면 표시창 꺼짐
    p.r.bar.setAttribute('width',162*Math.min(1,s.t/w.set[T]));
    p.r.led.classList.toggle('on',!!w.out[T]);
    p.r.blades.forEach(b=>bladeSet(b,s.out));
  }
};
