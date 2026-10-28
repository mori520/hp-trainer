/* 카운터 모듈: 카운터 C1. 계수 입력 <C>_A1(+)/<C>_A2(−), 리셋 입력 <C>_R1(+)/<C>_R2(−),
   c접점 2개 <C>_n1(공통)/<C>_n2(NC)/<C>_n4(NO).
   계수 입력이 꺼졌다 켜질 때마다 1씩 세고, 센 값이 설정 횟수(w.set.C1)에 닿으면 접점이 바뀐다.
   리셋 입력에 전기가 들어오면 0으로 돌아간다. 설정값은 ▼▲ 버튼 (처음 1회: 직접 3회로 맞추게) */
PARTS.counter={
  label:()=>'카운터 모듈',needsPower:true,
  tag:'C',tagCount:1,
  rails:p=>rackRails(p.rack),
  settings:p=>({[p.tags[0]]:{def:1,min:1,max:9,step:1,unit:'회'}}),
  loads:p=>p.tags.flatMap(C=>[{name:C,a:C+'_A1',b:C+'_A2',counter:true},{name:C+'R',a:C+'_R1',b:C+'_R2',counter:true}]),
  init(p,w){p.tags.forEach(C=>w.counter[C]={n:0,prev:false,out:false});},
  update(p,w,on,e){
    const pow=modulePowered(p,w,e);
    p.tags.forEach(C=>{
      const s=w.counter[C],inp=pow&&!!on[C];
      if(!pow){s.prev=false;s.out=false;return;}   // 모듈 전원이 없으면 세지 않음
      if(on[C+'R'])s.n=0;
      else if(inp&&!s.prev)s.n=Math.min(99,s.n+1);   // 꺼졌다 켜지는 순간 1 증가
      s.prev=inp;
      s.out=s.n>=w.set[C];
    });
  },
  elec(p,w,u,all){p.tags.forEach(C=>cContacts(u,C,2,w.counter[C].out,all));},
  draw(p){
    const m=rackModule(p,'카운터 모듈'), y=m.oy, x=m.x, C=p.tags[0];
    p.r.disp=settingDisplay(m.g,x,y,C,C+' 현재 / 설정');
    ejack(C+'_A1',x+26,y+148,'red',m.g,'A1',0,-16);
    ejack(C+'_A2',x+62,y+148,'blue',m.g,'A2',0,-16);
    ejack(C+'_R1',x+124,y+148,'red',m.g,'R1',0,-16);
    ejack(C+'_R2',x+160,y+148,'blue',m.g,'R2',0,-16);
    tx('계수 입력',{x:x+44,y:y+172,'text-anchor':'middle',class:'psmall'},m.g);
    tx('리셋 입력',{x:x+142,y:y+172,'text-anchor':'middle',class:'psmall'},m.g);
    R[C+'coil']=m.g;
    p.r.blades=[1,2].map(n=>contactCell(m.g,C,n,x+[60,130][n-1],y+196));
  },
  // 현재 값 / 설정 값 표시, 설정에 닿으면 접점 날이 NO 쪽으로
  render(p,w){
    const C=p.tags[0],s=w.counter[C];
    p.r.disp.textContent=w.modPow[p.id]?`${s.n} / ${w.set[C]}`:'';
    p.r.blades.forEach(b=>bladeSet(b,s.out));
  }
};
