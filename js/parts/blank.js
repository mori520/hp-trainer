/* 빈 모듈: 아직 만들지 않은 모듈 자리 (회색) */
PARTS.blank={
  draw(p){
    const m=rackModule(p,p.title,true);
    tx('다음 단계에서 추가',{x:m.x+95,y:m.oy+170,'text-anchor':'middle',class:'ptxt'},m.g);
  }
};
