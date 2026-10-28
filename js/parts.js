/* ===================== 부품 그리기 공통 =====================
   SVG 도우미, 잭·포트 등록(JACKS), 랙 모듈 틀, 장면 만들기(buildScene).
   부품별 그림과 동작은 js/parts/*.js 에 있다. */
const NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
function el(t,a,p){const e=document.createElementNS(NS,t);if(a)for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
function tx(s,a,p){const e=el('text',a,p);e.textContent=s;return e;}

const JACKS={};           // id -> {id,x,y,kind:'elec'|'pneu',color,rail,dir}
const R={};               // 튜토리얼 강조용 이름 붙은 요소 (@rocker, @air, @PB1btn …)
const G=$('gStatic');

function ejack(id,x,y,color,p,label,lx,ly,extra){
  JACKS[id]=Object.assign({id,x,y,kind:'elec',color},extra||{});
  el('circle',{cx:x,cy:y,r:10,class:'jk-'+color},p);
  el('circle',{cx:x,cy:y,r:4.2,class:'hole'},p);
  if(label)tx(label,{x:x+(lx||0),y:y+(ly==null?24:ly),'text-anchor':'middle',class:'psmall'},p);
}
function pport(id,x,y,dir,p,label,lx,ly){
  JACKS[id]={id,x,y,kind:'pneu',dir};
  el('circle',{cx:x,cy:y,r:10,class:'port'},p);
  el('circle',{cx:x,cy:y,r:4.5,class:'port-in'},p);
  if(label)tx(label,{x:x+(lx||0),y:y+(ly||0),'text-anchor':'middle',class:'psmall'},p);
}

// 랙 모듈 틀: p.row줄 p.col칸에 패널과 +24V/0V 레일 잭(dim이면 회색 빈 모듈). 2칸 모듈은 레일 잭 6개씩
// 돌려주는 oy는 첫 줄 기준으로 내려간 거리. 모듈 안 그림의 y좌표에 더해 쓴다
const MW=190, MH=300, RACK_DX=196, RACK_DY=316;
function rackModule(p,title,dim){
  const x=16+p.col*RACK_DX, oy=p.row*RACK_DY, y=16+oy, w=MW+(p.span-1)*RACK_DX, i=p.rack;
  const g=el('g',dim?{class:'dim'}:{},G);
  el('rect',{x,y,width:w,height:MH,rx:4,class:'panel'},g);
  el('rect',{x:x+1,y:y+1,width:w-2,height:22,class:'panel-head'},g);
  tx(title,{x:x+10,y:y+16,class:'ptitle'},g);
  if(!dim){
    const n=railCount(p.span), gap=n>3?58:55;   // 6개면 오른쪽 +24V·0V 글자와 겹치지 않게 조금 좁게
    el('line',{x1:x+38,y1:oy+56,x2:x+42+(n-1)*gap,y2:oy+56,class:'bus-red'},g);
    el('line',{x1:x+38,y1:oy+292,x2:x+42+(n-1)*gap,y2:oy+292,class:'bus-blue'},g);
    for(let k=0;k<n;k++){
      ejack(`R24_${i}_${k}`,x+40+k*gap,oy+56,'red',g,null,0,0,{rail:'24'});
      ejack(`R0_${i}_${k}`,x+40+k*gap,oy+292,'blue',g,null,0,0,{rail:'0'});
    }
    tx('+24V',{x:x+w-8,y:oy+49,'text-anchor':'end',class:'psmall'},g);
    tx('0V',{x:x+w-8,y:oy+278,'text-anchor':'end',class:'psmall'},g);
  }
  return {g,x,oy};
}

// 부품 목록대로 트레이너 전체를 다시 그린다 (밸브 교체 때도 호출). board=[x,y,폭,높이] 고정판 위치
function buildScene(parts,board){
  G.innerHTML='';
  for(const k in JACKS)delete JACKS[k];
  for(const k in R)delete R[k];
  // 고정판 바탕
  const [bx,by,bw,bh]=board;
  el('rect',{x:bx,y:by,width:bw,height:bh,rx:6,class:'board'},G);
  for(let y=by+22;y<by+bh-6;y+=26)el('line',{x1:bx+14,y1:y,x2:bx+bw-14,y2:y,class:'slot'},G);
  if(G.ownerSVGElement)G.ownerSVGElement.setAttribute('viewBox',`0 0 1200 ${by+bh+14}`);
  parts.forEach(p=>{p.r={};PARTS[p.type].draw(p);});
}

// c접점 한 칸 그리기 (릴레이와 같은 모양): 공통 n1 위, NC n2 왼쪽 아래, NO n4 오른쪽 아래. 날(blade)을 돌려준다
function contactCell(g,id,n,cx,cy){
  ejack(id+'_'+n+'1',cx,cy,'black',g,n+'1',20,4);
  ejack(id+'_'+n+'2',cx-17,cy+40,'black',g,n+'2',0,22);
  ejack(id+'_'+n+'4',cx+17,cy+40,'black',g,n+'4',0,22);
  el('line',{x1:cx,y1:cy+10,x2:cx,y2:cy+14,class:'sym'},g);
  el('line',{x1:cx-17,y1:cy+30,x2:cx-17,y2:cy+24,class:'sym'},g);
  el('line',{x1:cx-17,y1:cy+24,x2:cx-11,y2:cy+24,class:'sym'},g);
  el('line',{x1:cx+17,y1:cy+30,x2:cx+17,y2:cy+24,class:'sym'},g);
  return el('line',{x1:cx,y1:cy+14,x2:cx-13,y2:cy+24,class:'sym'},g);
}
function bladeSet(b,on){const x1=+b.getAttribute('x1');b.setAttribute('x2',on?x1+15:x1-13);}
// 설정값 표시창 + ▼▲ 버튼 (타이머·카운터). 값 글자 요소를 돌려준다
function settingDisplay(g,x,y,name,caption){
  el('rect',{x:x+14,y:y+72,width:162,height:40,rx:4,class:'disp'},g);
  tx(caption,{x:x+22,y:y+87,class:'disp-cap'},g);
  const v=tx('',{x:x+22,y:y+106,class:'disp-val'},g);
  [['▼',-1,x+116],['▲',1,x+146]].forEach(([s,d,bx])=>{
    const b=el('g',{class:'setbtn',tabindex:0,role:'button','aria-label':name+(d>0?' 올리기':' 내리기')},g);
    b.dataset.name=name;b.dataset.dir=d;if(d>0)R[name+'set']=b;   // 튜토리얼 강조용 (@T1set)
    el('rect',{x:bx,y:y+76,width:26,height:32,rx:4},b);tx(s,{x:bx+13,y:y+97,'text-anchor':'middle'},b);
  });
  return v;
}

// 작은 ▼▲ 설정 버튼 한 쌍 (서비스 유닛·공압 기기). ▲ 버튼을 튜토리얼 강조용 R[name+'set']으로 등록
function setButtons(g,name,x,y,bw=20,bh=18){
  [['▼',-1,x],['▲',1,x+bw+4]].forEach(([s,d,bx])=>{
    const b=el('g',{class:'setbtn',tabindex:0,role:'button','aria-label':name+(d>0?' 올리기':' 내리기')},g);
    b.dataset.name=name;b.dataset.dir=d;if(d>0)R[name+'set']=b;
    el('rect',{x:bx,y,width:bw,height:bh,rx:3},b);tx(s,{x:bx+bw/2,y:y+bh-5,'text-anchor':'middle'},b);
  });
}

// 자동 배선 색: 한쪽 끝이 − 쪽 잭(파란 잭: 0V 레일, 램프 −, 코일 A2, 솔레노이드 −, 센서 청색)이면 파랑, 아니면 빨강
// (시험 규정: + 적색, − 청색 또는 흑색. 예외가 있어도 채점은 실제 전위로 색을 검사한다)
function autoWireColor(a,b){return [a,b].some(id=>JACKS[id]&&JACKS[id].color==='blue')?'blue':'red';}

// 잭 묶음: 튜토리얼 데이터에서 "group:rail24"처럼 이름으로 가리킨다
function isR24(id){return JACKS[id]&&JACKS[id].rail==='24';}
function isR0(id){return JACKS[id]&&JACKS[id].rail==='0';}
function isDist(id){return /^D\d$/.test(id);}
const JACK_GROUPS={rail24:isR24,rail0:isR0,dist:isDist};
