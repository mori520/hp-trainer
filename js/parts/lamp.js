/* 램프 모듈: 램프(p.lamps, 최대 2개). 램프마다 + / − 잭 */
PARTS.lamp={
  label:()=>'램프 모듈',
  rails:p=>rackRails(p.rack),
  loads:p=>p.lamps.map(id=>({name:id,a:id+'_p',b:id+'_n'})),
  draw(p){
    const m=rackModule(p,'램프 모듈'), y=m.oy;
    p.lamps.forEach((id,k)=>{
      const cx=m.x+[52,138][k];
      p.r[id]=el('circle',{cx,cy:y+130,r:22,class:'lamp'},m.g);
      el('line',{x1:cx-15,y1:y+115,x2:cx+15,y2:y+145,class:'sym'},m.g);
      el('line',{x1:cx+15,y1:y+115,x2:cx-15,y2:y+145,class:'sym'},m.g);
      tx(id,{x:cx,y:y+172,'text-anchor':'middle',class:'ptxt'},m.g);
      ejack(id+'_p',cx-20,y+210,'red',m.g,'+');
      ejack(id+'_n',cx+20,y+210,'blue',m.g,'−');
    });
  },
  render(p,w){p.lamps.forEach(id=>p.r[id].classList.toggle('on',w.out[id]));}
};
