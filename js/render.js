/* ===================== 렌더링 =====================
   배선·호스 그리기, 튜토리얼 강조, 매 프레임 상태 표시(램프, 스풀, 접점, 실린더) */
function wirePath(a,b){const A=JACKS[a],B=JACKS[b];const s=30+Math.abs(A.x-B.x)*.12+Math.abs(A.y-B.y)*.05;return`M${A.x},${A.y} C${A.x},${A.y+s} ${B.x},${B.y+s} ${B.x},${B.y}`;}
function hosePath(a,b){const A=JACKS[a],B=JACKS[b];const k=60+Math.abs(A.x-B.x)*.08;const da=A.dir==='up'?-k:k,db=B.dir==='up'?-k:k;return`M${A.x},${A.y} C${A.x},${A.y+da} ${B.x},${B.y+db} ${B.x},${B.y}`;}
// 기본 전원 선: 같은 줄이면 24V는 위로, 0V는 아래로 짧게 휘고, 다른 줄(릴레이 모듈)로 가면 왼쪽으로 돌아 내려간다
function jumperPath(a,b){
  const A=JACKS[a],B=JACKS[b];
  if(Math.abs(A.y-B.y)<5){const h=(a.startsWith('R0')?1:-1)*(16+Math.abs(A.x-B.x)*.04);return`M${A.x},${A.y} C${A.x},${A.y+h} ${B.x},${B.y+h} ${B.x},${B.y}`;}
  // 다른 줄: 24V는 모듈 위로, 0V는 모듈 아래 틈으로 나가 랙 왼쪽 바깥을 따라 내려가서 들어간다 (모듈 앞을 가로지르지 않게)
  const ey=a.startsWith('R0')?A.y+30:A.y-46, ex=6;
  return`M${A.x},${A.y} V${ey} H${ex} V${B.y} H${B.x}`;
}
function renderConn(){
  const g=$('gConn');g.innerHTML='';
  S.hoses.forEach(h=>{const c=el('g',{class:'conn'+(UI.flash.includes(h.id)?' flash':''),'data-id':h.id,'data-type':'hose','data-a':h.a,'data-b':h.b},g);const d=hosePath(h.a,h.b);
    el('path',{d,class:'hose-edge'},c);el('path',{d,class:'hose'},c);el('path',{d,class:'hit'},c);});
  S.wires.forEach(w=>{const c=el('g',{class:'conn'+(UI.flash.includes(w.id)?' flash':''),'data-id':w.id,'data-type':'wire','data-a':w.a,'data-b':w.b},g);const d=w.base?jumperPath(w.a,w.b):wirePath(w.a,w.b);
    el('path',{d,class:'wire w-'+w.color},c);el('path',{d,class:'hit'},c);
    [w.a,w.b].forEach(j=>el('circle',{cx:JACKS[j].x,cy:JACKS[j].y,r:6.5,class:'p-'+w.color,'pointer-events':'none'},c));});
  renderBadges();clearFocus();save();
}
// 한 잭에 선이 2개 이상 꽂혀 있으면 잭 오른쪽 위에 개수를 늘 띄운다
function renderBadges(){
  const g=$('gBadge');g.innerHTML='';const n={};
  S.wires.forEach(w=>{n[w.a]=(n[w.a]||0)+1;n[w.b]=(n[w.b]||0)+1;});
  for(const id in n)if(n[id]>=2&&JACKS[id]){
    const j=JACKS[id],b=el('g',{class:'badge'},g);
    el('circle',{cx:j.x+11,cy:j.y-11,r:7.5},b);tx(String(n[id]),{x:j.x+11,y:j.y-7.8,'text-anchor':'middle'},b);
  }
}
// 마우스를 올린 선(또는 잭에 꽂힌 선들)만 진하게, 나머지는 흐리게. 선 양 끝 잭에는 테두리
function setFocus(conns,jacks){
  const g=$('gConn');g.classList.add('focusing');
  g.querySelectorAll('.conn').forEach(c=>c.classList.toggle('focus',conns.includes(c)));
  const f=$('gFocus');f.innerHTML='';
  jacks.forEach(id=>{if(JACKS[id])el('circle',{cx:JACKS[id].x,cy:JACKS[id].y,r:14,class:'focus-ring'},f);});
}
function clearFocus(){$('gConn').classList.remove('focusing');$('gFocus').innerHTML='';}
function buildHits(){const g=$('gHits');g.innerHTML='';Object.values(JACKS).forEach(j=>{const c=el('circle',{cx:j.x,cy:j.y,r:13,class:'jhit'},g);c.dataset.jack=j.id;});}

let lastHL='';
function renderHL(ids){
  const key=ids.join(',');if(key===lastHL)return;lastHL=key;
  const g=$('gHL');g.innerHTML='';
  ids.forEach(id=>{
    if(id[0]==='@'){const t=R[id.slice(1)];if(!t)return;const b=t.getBBox();el('rect',{x:b.x-6,y:b.y-6,width:b.width+12,height:b.height+12,rx:8,class:'hl'},g);}
    else if(JACKS[id])el('circle',{cx:JACKS[id].x,cy:JACKS[id].y,r:16,class:'hl'},g);
  });
}
let lastStatus='';
function renderDyn(){
  const o=S.out;
  LAYOUT.parts.forEach(p=>{const d=PARTS[p.type];if(d.render)d.render(p,S);});
  const sols=LAYOUT.loads.filter(l=>l.sol).map(l=>`<span class="st ${o[l.name]?'on':''}">${l.name} ${o[l.name]?'여자':'소자'}</span>`).join('');
  const html=`<span class="st ${S.power?'on':''}">전원 ${S.power?'ON':'OFF'}</span><span class="st ${S.air?'on':''}">${fluidText().supply} ${S.air?'ON':'OFF'}</span>`+sols+(o.leak?'<span class="st alert">공기 누설</span>':'');
  if(html!==lastStatus){$('status').innerHTML=html;lastStatus=html;}
}
