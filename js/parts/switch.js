/* 스위치 모듈 (랙 2칸): 누름버튼(p.pbs, 최대 3개) + 비상정지(p.es, 유지형 1개).
   버튼마다 NO 13-14, NC 11-12. 누름버튼은 누르는 동안만, 비상정지는 한 번 누르면 눌린 채로 유지(다시 누르면 풀림) */
const SW_COL=96;   // 버튼 한 칸 너비
PARTS.switch={
  label:()=>'스위치 모듈',
  span:2,
  rails:p=>rackRails(p.rack,p.span),
  pbs:p=>p.pbs,
  toggles:p=>p.es?[p.es]:[],
  elec(p,w,u,all){
    p.pbs.concat(p.es?[p.es]:[]).forEach(id=>{
      const on=w.pb[id];
      if(all||on)u.u(id+'_13',id+'_14');
      if(all||!on)u.u(id+'_11',id+'_12');
    });
  },
  draw(p){
    const m=rackModule(p,'스위치 모듈'), y=m.oy;
    const btns=p.pbs.map((id,k)=>({id,cls:['pb-green','pb-red','pb-black'][k],label:id}));
    if(p.es)btns.push({id:p.es,es:true,label:'비상정지'});
    btns.forEach((bt,k)=>{
      const cx=m.x+48+k*SW_COL, by=y+100, id=bt.id;
      const b=el('g',{class:'pbtn'+(bt.es?' estop':''),tabindex:0,role:'button','aria-label':bt.es?'비상정지 스위치(유지형)':id+' 누름버튼'},m.g);
      if(bt.es){
        el('rect',{x:cx-30,y:by-30,width:60,height:60,rx:4,class:'es-plate'},b);
        el('circle',{cx,cy:by,r:24,class:'cap pb-red'},b);
        el('circle',{cx,cy:by,r:15,fill:'none',class:'es-ring'},b);
        b.dataset.toggle='1';
      }else{
        el('circle',{cx,cy:by,r:25,fill:'none',class:'sym'},b);
        el('circle',{cx,cy:by,r:21,class:'cap '+bt.cls},b);
      }
      tx(bt.label,{x:cx,y:by+(bt.es?46:40),'text-anchor':'middle',class:'ptxt'},m.g);
      R[id+'btn']=b; b.dataset.pb=id;
      // NO 13-14 (왼쪽), NC 11-12 (오른쪽)
      const nx=cx-22, cx2=cx+22, t=y+170, bo=y+222;
      ejack(id+'_13',nx,t,'black',m.g,'13',-16,4);
      ejack(id+'_14',nx,bo,'black',m.g,'14',-16,4);
      el('line',{x1:nx,y1:t+10,x2:nx,y2:t+18,class:'sym'},m.g);
      el('line',{x1:nx,y1:bo-10,x2:nx,y2:bo-18,class:'sym'},m.g);
      p.r[id+'no']=el('line',{x1:nx,y1:bo-18,x2:nx-9,y2:t+19,class:'sym'},m.g);
      ejack(id+'_11',cx2,t,'black',m.g,'11',16,4);
      ejack(id+'_12',cx2,bo,'black',m.g,'12',16,4);
      el('line',{x1:cx2,y1:t+10,x2:cx2,y2:t+18,class:'sym'},m.g);
      el('line',{x1:cx2,y1:bo-10,x2:cx2,y2:bo-18,class:'sym'},m.g);
      el('line',{x1:cx2,y1:t+18,x2:cx2+6,y2:t+18,class:'sym'},m.g);
      p.r[id+'nc']=el('line',{x1:cx2,y1:bo-18,x2:cx2+7,y2:t+17,class:'sym'},m.g);
      tx('NO',{x:nx,y:y+248,'text-anchor':'middle',class:'psmall'},m.g);
      tx('NC',{x:cx2,y:y+248,'text-anchor':'middle',class:'psmall'},m.g);
    });
  },
  // 누르면 버튼이 들어가고 NO는 닫히고 NC는 열리는 모습 (비상정지는 눌린 채로 유지)
  render(p,w){
    p.pbs.concat(p.es?[p.es]:[]).forEach(id=>{
      const on=w.pb[id];R[id+'btn'].classList.toggle('down',on);
      const no=p.r[id+'no'],nc=p.r[id+'nc'],x1=+no.getAttribute('x1'),y1=+no.getAttribute('y1');
      no.setAttribute('x2',on?x1:x1-9);no.setAttribute('y2',on?y1-16:y1-15);   // 그릴 때와 같은 길이 (위 단자 끝 y1-16에 닿으면 닫힘)
      const cx=+nc.getAttribute('x1');nc.setAttribute('x2',on?cx-8:cx+7);
    });
  }
};
