/* 전원 모듈: 콘센트 플러그 + POWER 스위치 + 레일. 이 모듈의 레일만 실제 +24V/0V이고, 다른 모듈은 기본 전원 선으로 받는다 */
let PLUGGED=false;   // 플러그가 콘센트에 꽂혀 있는지 (앱이 저장값으로 맞춘다)
PARTS.power={
  supply:true,
  rails:p=>rackRails(p.rack),
  draw(p){
    const m=rackModule(p,'전원 모듈'), y=m.oy;
    tx('POWER',{x:m.x+95,y:y+132,'text-anchor':'middle',class:'ptxt'},m.g);
    R.rocker=el('rect',{x:m.x+80,y:y+144,width:30,height:52,rx:4,class:'rocker',tabindex:0,role:'button','aria-label':'전원 스위치'},m.g);
    p.r.led=el('circle',{cx:m.x+95,cy:y+222,r:6,class:'led'},m.g);
    // 콘센트(왼쪽 아래)와 플러그: 클릭해서 꽂고 뺀다
    el('rect',{x:m.x+14,y:y+178,width:40,height:44,rx:6,class:'outlet'},m.g);
    el('rect',{x:m.x+25,y:y+192,width:4,height:12,class:'hole'},m.g);el('rect',{x:m.x+39,y:y+192,width:4,height:12,class:'hole'},m.g);
    tx('콘센트',{x:m.x+34,y:y+236,'text-anchor':'middle',class:'psmall'},m.g);
    const pg=R.plug=p.r.plug=el('g',{class:'plug',tabindex:0,role:'button','aria-label':'전원 플러그 꽂기/빼기'},m.g);
    el('path',{d:`M${m.x+34},${y+210} C${m.x+34},${y+150} ${m.x+10},${y+150} ${m.x+8},${y+120}`,class:'cord'},pg);
    el('rect',{x:m.x+22,y:y+186,width:24,height:24,rx:4,class:'plug-body'},pg);
    tx('ON',{x:m.x+95,y:y+244,'text-anchor':'middle',class:'psmall'},m.g);
  },
  // 빠져 있으면 플러그가 콘센트 아래로 비켜 있고, 꽂으면 콘센트에 들어간 모습
  render(p,w){
    R.rocker.classList.toggle('on',w.power);p.r.led.classList.toggle('on',w.power);
    p.r.plug.classList.toggle('in',PLUGGED);
  }
};
