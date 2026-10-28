/* ===================== 내 회로 도면: 그리기 =====================
   사용자가 만든 것을 시험 도면 모양으로 다시 그린다 (DOM을 쓰지 않음 → 테스트에서도 돈다). 화면 쪽은 mydiagram-ui.js
   - pneu(parts, hoses, info) : 공기압회로도. 부품 기호는 자리마다 정해진 곳에 두고, 꽂힌 호스를 선으로 잇는다
       (도면대로 꽂았으면 시험 도면과 같은 모양이 되고, 잘못 꽂았으면 잘못된 모양 그대로 보인다). 비어 있는 포트는 빈 동그라미
   - disp(runs, names)       : 변위단계선도. runs = 기록한 동작 [{seq:["A+","wait:3.0초","B+",…]}]
   - elec(LAYOUT, PARTS, w, e): 전기회로도(사다리). 꽂은 선으로 직렬·병렬을 정리해 그리고, 정리 안 되는 곳은 "확인할 곳" 목록 */
const MYD=(()=>{
  const at=o=>Object.entries(o).filter(([,v])=>v!=null&&v!=='').map(([k,v])=>` ${k}="${v}"`).join('');
  const line=(x1,y1,x2,y2,c='w')=>`<line${at({x1,y1,x2,y2,class:c})}/>`;
  const path=(d,c='w')=>`<path${at({d,class:c})}/>`;
  const rect=(x,y,w,h,c='w')=>`<rect${at({x,y,width:w,height:h,class:c})}/>`;
  const circ=(cx,cy,r,c='w')=>`<circle${at({cx,cy,r,class:c})}/>`;
  const text=(x,y,s,c='t',a='start')=>`<text${at({x,y,class:c,'text-anchor':a})}>${s}</text>`;
  const svg=(w,h,b)=>`<svg viewBox="0 0 ${w} ${h}" class="mdsvg" xmlns="http://www.w3.org/2000/svg">${rect(0,0,w,h,'bg')}${b}</svg>`;

  /* ---------- 공기압회로도 ---------- */
  // 실린더 x0 기준 자리. A는 왼쪽, B는 오른쪽
  const COL={A:60,B:420};
  const CY=70, VY=236, DEVY=168, SUPY=360;
  function cylinder(p,x,o,ports){
    o.push(text(x,CY-10,p.id,'n'),rect(x,CY,160,30),line(x+22,CY,x+22,CY+30,'thick'),line(x+22,CY+15,x+200,CY+15,'thick'));
    o.push(path(`M${x+12},${CY+30}V${CY+40}M${x+148},${CY+30}V${CY+40}`));
    ports[p.id+'_cap']=[x+12,CY+40,'down'];ports[p.id+'_rod']=[x+148,CY+40,'down'];
  }
  function sensor(p,x,o){
    const sx=x+(p.end==='-'?200:260)+(p.stack?22:0),y=CY;
    if(p.type==='limitsw'){o.push(rect(sx-7,y-26,14,12),line(sx,y-14,sx,y+4),circ(sx,y+8,4));}
    else o.push(path(`M${sx},${y-24}L${sx+9},${y-15}L${sx},${y-6}L${sx-9},${y-15}Z`),line(sx-4,y-15,sx+4,y-15));
    o.push(text(sx,y-32,p.id,'t','middle'));
  }
  // 5/2 밸브: 왼쪽 칸(여자) | 오른쪽 칸(평상시). 포트 4·2 위, 1 아래, 배기 3·5
  function valve(p,x,o,ports,on){
    const vx=x+40,vy=VY,W=60,H=36,R=vx+W,dbl=p.type==='valve52d';
    o.push(rect(vx,vy,W,H,on?'w act':'w'),rect(R,vy,W,H,on?'w':'w act'));
    o.push(path(`M${vx+30},${vy+H}L${vx+15},${vy+3}`,'arw'),path(`M${vx+45},${vy}L${vx+52},${vy+H-3}`,'arw'));
    o.push(path(`M${R+30},${vy+H}L${R+45},${vy+3}`,'arw'),path(`M${R+15},${vy}L${R+8},${vy+H-3}`,'arw'));
    [R+8,R+52].forEach(ex=>o.push(path(`M${ex},${vy+H}V${vy+H+8}M${ex-5},${vy+H+8}H${ex+5}L${ex},${vy+H+15}Z`)));
    o.push(text(R+20,vy-6,'4','s'),text(R+48,vy-6,'2','s'),text(R+36,vy+H+14,'1','s'));
    o.push(rect(vx-24,vy+8,24,20),line(vx-24,vy+28,vx,vy+8),text(vx-30,vy+23,p.sols[0]||'','t','end'));
    if(dbl)o.push(rect(R+W,vy+8,24,20),line(R+W,vy+28,R+W+24,vy+8),text(R+W+30,vy+23,p.sols[1]||''));
    else o.push(path(`M${R+W},${vy+18}l4,-6l6,12l6,-12l4,6`));
    o.push(path(`M${R+15},${vy}V${vy-8}M${R+45},${vy}V${vy-8}M${R+30},${vy+H}V${vy+H+8}`));
    ports[p.id+'_4']=[R+15,vy-8,'up'];ports[p.id+'_2']=[R+45,vy-8,'up'];ports[p.id+'_1']=[R+30,vy+H+8,'down'];
  }
  // 줄에 끼우는 기기(유량조절·급속배기): 세로로, 위 = 실린더 쪽, 아래 = 밸브 쪽
  function inline(p,x,o,ports,info){
    const t=p.tags[0],y=DEVY;
    o.push(rect(x-13,y-14,26,28,'bgfill'));
    if(p.type==='fcv'){
      o.push(path(`M${x},${y-14}V${y-10}H${x-7}V${y+10}H${x}V${y+14}M${x},${y-10}H${x+7}V${y+10}H${x}`));
      o.push(path(`M${x-10},${y-5}Q${x-7},${y} ${x-10},${y+5}M${x-4},${y-5}Q${x-7},${y} ${x-4},${y+5}`),circ(x+7,y-1,3),path(`M${x+3},${y+6}L${x+7},${y+2}L${x+11},${y+6}`));
      o.push(text(x+16,y+4,`${t} ${info.set[t]}단`,'s'));
      ports[t+'_2']=[x,y-14,'up'];ports[t+'_1']=[x,y+14,'down'];
    }else{
      o.push(rect(x-8,y-9,16,18),path(`M${x},${y-14}V${y-9}M${x},${y+9}V${y+14}M${x+8},${y}H${x+14}`),path(`M${x+14},${y-5}L${x+22},${y}L${x+14},${y+5}Z`));
      o.push(text(x+26,y+4,t,'s'));
      ports[t+'_A']=[x,y-14,'up'];ports[t+'_P']=[x,y+14,'down'];
    }
  }
  function service(o,ports,info){
    const x=40,y=SUPY;
    o.push(circ(x+14,y+26,12),path(`M${x+14},${y+16}l-6,10h12z`,'fill'),text(x+32,y+31,`서비스 유닛 ${info.set.SU.toFixed(2)} MPa`,'s'));
    o.push(path(`M${x+14},${y+14}V${y}H${x+150}`));
    [['D1',x+50],['D2',x+100],['D3',x+150]].forEach(([d,dx])=>{o.push(text(dx+6,y+14,d,'s'));ports[d]=[dx,y,'up'];});
  }
  function prv(p,o,ports,info){
    const t=p.tags[0],x=240,y=SUPY-6;
    o.push(rect(x,y-12,60,24),line(x+16,y+8,x+44,y-8,'arw'),text(x+30,y+30,`${t} 감압 ${info.set[t].toFixed(2)}`,'s','middle'));
    o.push(path(`M${x},${y}H${x-8}M${x+60},${y}H${x+68}`));
    ports[t+'_1']=[x-8,y,'left'];ports[t+'_2']=[x+68,y,'right'];
  }
  // 호스: 가로·세로로만 꺾는다. 위를 보는 포트끼리는 위로, 그 밖은 두 포트 사이 높이에서 꺾음
  function route(a,b,k){
    const off=(k%3-1)*6;
    let ym=(a[1]+b[1])/2+off;
    if(Math.abs(a[1]-b[1])<6)ym=(a[2]==='up'?Math.min(a[1],b[1])-16:Math.max(a[1],b[1])+16)+off;
    if(a[2]==='left'||a[2]==='right'||b[2]==='left'||b[2]==='right'){
      const [s,t]=a[2]==='left'||a[2]==='right'?[a,b]:[b,a];
      return `M${s[0]},${s[1]}H${t[0]}V${t[1]}`;
    }
    return `M${a[0]},${a[1]}V${ym}H${b[0]}V${b[1]}`;
  }
  function pneu(parts,hoses,info){
    const o=[],ports={},has=t=>parts.some(p=>p.type===t);
    const cyls=parts.filter(p=>p.type==='cylinder');
    cyls.forEach(p=>cylinder(p,COL[p.id]??60,o,ports));
    parts.filter(p=>p.cyl).forEach(p=>sensor(p,COL[p.cyl]??60,o));
    parts.filter(p=>p.type==='valve52s'||p.type==='valve52d').forEach(p=>{
      const cylId=p.slot==='valveB'?'B':'A';
      valve(p,COL[cylId],o,ports,(info.valve||{})[p.id]);
    });
    parts.filter(p=>p.type==='fcv'||p.type==='qev').forEach(p=>{
      const m=/^M([AB])([12])$/.exec(p.slot)||[];const x0=COL[m[1]]??60;
      inline(p,m[2]==='2'?x0+148:x0+12,o,ports,info);
    });
    if(has('service'))service(o,ports,info);
    parts.filter(p=>p.type==='prv').forEach(p=>prv(p,o,ports,info));
    const used=new Set();
    const lines=hoses.filter(h=>ports[h.a]&&ports[h.b]).map((h,k)=>{used.add(h.a);used.add(h.b);return path(route(ports[h.a],ports[h.b],k),'hose');});
    const ends=Object.entries(ports).map(([id,[x,y]])=>used.has(id)?circ(x,y,2.6,'dot'):circ(x,y,3.2,'open'));
    const notes=[];
    if(info.leak)notes.push(text(20,24,'⚠ 공기 누설: 공급이 배기로 바로 빠지는 연결이 있어요','bad'));
    const empty=Object.keys(ports).filter(id=>!used.has(id)&&!/^D\d$/.test(id));
    if(empty.length)notes.push(text(740,24,`빈 포트(○) ${empty.length}개`,'s','end'));
    if(!cyls.length)return svg(760,420,text(380,210,'이 미션에는 공압 기기가 없어요','t','middle'));
    return svg(760,420,o.join('')+lines.join('')+ends.join('')+notes.join(''));
  }

  /* ---------- 변위단계선도 ---------- */
  // seq: "A+"·"B-" 같은 도착, "wait:3.0초"는 그 구간 그대로 머묾. 실린더마다 0(후진)·1(전진) 줄
  function dispRows(x,y,names,seq,o){
    const dx=Math.min(70,Math.max(34,560/Math.max(1,seq.length))),rh=30,gap=18,n=seq.length+1;
    seq.forEach((m,k)=>{if(m.startsWith('wait:'))o.push(text(x+(k+0.5)*dx,y+12,m.slice(5),'s','middle'));});
    for(let k=0;k<n;k++)o.push(text(x+k*dx,y-6,String(k+1),'s','middle'));
    names.forEach((a,r)=>{
      const top=y+r*(rh+gap),bot=top+rh;
      for(let k=0;k<n;k++)o.push(line(x+k*dx,top,x+k*dx,bot,'thin'));
      o.push(line(x,top,x+(n-1)*dx,top,'thin'),line(x,bot,x+(n-1)*dx,bot,'thin'));
      o.push(text(x-34,top+rh/2+5,a,'n'),text(x-8,top+4,'1','s','end'),text(x-8,bot+4,'0','s','end'));
      let st=0;const pts=[[x,bot]];
      seq.forEach((m,k)=>{if(m[0]===a&&!m.startsWith('wait:'))st=m[1]==='+'?1:0;pts.push([x+(k+1)*dx,st?top:bot]);});
      o.push(path('M'+pts.map(p=>p.join(',')).join('L'),'thick'));
    });
    return names.length*(rh+gap);
  }
  const fmt=s=>s.filter(m=>!m.startsWith('wait:')).map(m=>m.replace('-','−')).join(' ')||'움직임 없음';
  function disp(runs,names,live){
    if(!names.length)return svg(760,200,text(380,100,'이 미션에는 실린더가 없어요','t','middle'));
    const o=[];let y=46;
    if(!runs.length&&!live)o.push(text(380,90,'PB1을 눌러 동작시키면 실린더가 끝에 닿은 순서를 기록해 여기에 그려요','t','middle'),
      text(380,114,'한 번 끝나고(1.5초 동안 멈춤) 다시 누르면 두 번째 기록과 나란히 비교해요','s','middle'));
    const all=runs.map((r,i)=>({title:`${runs.length>1?(i+1)+'회차':'기록'}: ${fmt(r.seq)}`,seq:r.seq}));
    if(live)all.push({title:`기록 중… ${fmt(live.seq)}`,seq:live.seq});
    all.forEach(r=>{o.push(text(20,y-22,r.title,'n'));y+=dispRows(80,y,names,r.seq,o)+44;});
    if(runs.length===2){
      const same=fmt(runs[0].seq)===fmt(runs[1].seq);
      o.push(text(20,y-12,same?'✓ 두 번 모두 같은 순서로 동작했어요':'✗ 두 번의 순서가 달라요 (시험은 2회 이상 똑같이 동작해야 인정)',same?'good':'bad'));y+=10;
    }
    return svg(760,Math.max(200,y),o.join(''));
  }
  /* ---------- 전기회로도 (사다리) ----------
     1) 선·모듈 레일로 이어진 잭끼리 한 점(net)으로 묶는다
     2) 양쪽 잭이 모두 배선된 부품만 고른다: 접점(부품 elec 규칙을 all=true로 불러 두 잭 쌍을 얻음), 부하(LAYOUT.loads), 센서
     3) 24V·0V가 아닌 점에 부품이 하나만 걸려 있으면 끊긴 줄 → "확인할 곳"으로 빼고, 남은 것을 직렬(점에 둘)·병렬(같은 두 점)로 묶어 나간다
     4) 하나로 묶이면 위(24V)→아래(0V) 사다리로 그린다. 줄 순서는 먼저 꽂은 선이 들어간 줄이 왼쪽
     닫힌 접점은 초록, 24V가 와 있는 선은 주황, 켜진 코일·솔레노이드·램프는 색칠 */
  function elecGraph(L,PARTS,w,e){
    const par=new Map(),f=x=>{if(!par.has(x))par.set(x,x);let r=x;while(par.get(r)!==r)r=par.get(r);return r;},u=(a,b)=>{const A=f(a),B=f(b);if(A!==B)par.set(A,B);};
    L.rail24.forEach(j=>u(j,'+24'));L.rail0.forEach(j=>u(j,'0V'));L.buses.forEach(g=>g.forEach(j=>u(j,g[0])));
    w.wires.forEach(x=>u(x.a,x.b));
    const wired=new Set();w.wires.forEach(x=>{wired.add(x.a);wired.add(x.b);});
    const order={};w.wires.filter(x=>!x.base).forEach((x,i)=>[x.a,x.b].forEach(j=>{if(!(j in order))order[j]=i;}));
    const els=[],issues=[],half=[];
    const add=(el)=>{
      const wa=wired.has(el.a),wb=wired.has(el.b);
      if(!wa&&!wb)return;
      if(!(wa&&wb)){half.push({el,j:wa?el.a:el.b,miss:wa?el.b:el.a});return;}
      el.ord=Math.min(order[el.a]??1e9,order[el.b]??1e9);els.push(el);
    };
    // 접점: all=true로 모든 쌍, all=false로 지금 닫힌 쌍
    L.parts.forEach(p=>{
      const d=PARTS[p.type];if(!d.elec)return;
      const all=[],now=new Set(),rec=arr=>({u:(a,b)=>arr.push(a+'|'+b),f:x=>x,same:()=>false});
      d.elec(p,w,rec(all),true);const nowArr=[];d.elec(p,w,rec(nowArr),false);nowArr.forEach(k=>now.add(k));
      all.forEach(k=>{
        const [a,b]=k.split('|'),owner=a.split('_')[0],ta=a.slice(owner.length+1),tb=b.slice(owner.length+1);
        if(p.type==='capsensor'){add({kind:'sensor',a:b.endsWith('_p')?b:a,b:b.endsWith('_p')?a:b,name:owner,label:`센서 ${owner}`,closed:now.has(k)});return;}
        const nc=/2$/.test(tb);
        add({kind:nc?'nc':'no',a,b,name:owner,term:`${ta}-${tb}`,label:`${owner} ${ta}-${tb}`,closed:now.has(k),pb:p.type==='switch',ls:p.type==='limitsw',timed:p.type==='timer'});
      });
      if(p.type==='capsensor'&&wired.has(p.id+'_p')&&wired.has(p.id+'_out')&&!(wired.has(p.id+'_n')&&f(p.id+'_n')===f('0V')))issues.push(`센서 ${p.id}: 청색(0V) 선이 0V에 이어져 있지 않아요`);
    });
    L.loads.forEach(l=>{
      const kind=l.sol?'sol':l.coil?'coil':l.timer?'timer':l.counter?(l.name.endsWith('R')?'reset':'counter'):'lamp';
      const label={sol:`솔레노이드 ${l.name}`,coil:`${l.name} 코일`,timer:`타이머 ${l.name}`,counter:`카운터 ${l.name}`,reset:`카운터 ${l.name.slice(0,-1)} 리셋`,lamp:`램프 ${l.name}`}[kind];
      add({kind,a:l.a,b:l.b,name:l.name,label,on:!!(w.out||{})[l.name]});
    });
    // 한쪽만 꽂힌 부품: c접점의 공통(11 등)을 다른 쪽(NO/NC)으로 쓰는 중이면 정상이라 알리지 않는다
    half.forEach(({el,j,miss})=>{if(!els.some(x=>x.a===j||x.b===j))issues.push(`${el.label}: ${miss.split('_').pop()}번이 비어 있어요`);});
    return{f,els,issues,hot:j=>e?e.hot(j):false};
  }
  // 직렬·병렬로 묶기. 간선 {u,v,n(트리)}: n = {t:'el',el} | {t:'ser',k:[간선…]} | {t:'par',k:[간선…]}
  function reduce(G){
    const T=G.f('+24'),B=G.f('0V'),issues=[];
    if(T===B)return{issues:['24V와 0V가 곧바로 이어져 있어요 (합선)'],rungs:[]};
    let E=G.els.map(el=>({u:G.f(el.a),v:G.f(el.b),n:{t:'el',el},ord:el.ord,rep:[el.a,el.b]})).filter(x=>{
      if(x.u===x.v){issues.push(`${x.n.el.label}: 양쪽 잭이 같은 점에 이어져 있어요`);return false;}return true;});
    const flip=x=>({u:x.v,v:x.u,ord:x.ord,rep:[x.rep[1],x.rep[0]],n:x.n.t==='el'?x.n:x.n.t==='par'?{t:'par',k:x.n.k.map(flip)}:{t:'ser',k:x.n.k.slice().reverse().map(flip)}});
    const labels=n=>n.t==='el'?[n.el.label]:n.k.flatMap(x=>labels(x.n));
    for(let changed=true;changed;){
      changed=false;
      const deg=new Map();E.forEach(x=>{deg.set(x.u,(deg.get(x.u)||0)+1);deg.set(x.v,(deg.get(x.v)||0)+1);});
      // 끊긴 끝: 24V·0V가 아닌 점에 하나만 걸린 부품
      const dead=E.filter(x=>(x.u!==T&&x.u!==B&&deg.get(x.u)===1)||(x.v!==T&&x.v!==B&&deg.get(x.v)===1));
      if(dead.length){
        dead.forEach(x=>issues.push(`끊긴 줄: ${labels(x.n).join(' → ')} (0V 또는 24V까지 이어지지 않음)`));
        E=E.filter(x=>!dead.includes(x));changed=true;continue;
      }
      // 병렬: 같은 두 점 사이 간선들
      const key=x=>x.u<x.v?x.u+'\u0000'+x.v:x.v+'\u0000'+x.u,groups=new Map();
      E.forEach(x=>{const k=key(x);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x);});
      for(const g of groups.values())if(g.length>1){
        // 이미 병렬인 것은 가지를 펴서 한 겹으로 (가지 순서 = 먼저 꽂은 선)
        const base=g[0],kids=g.map(x=>x.u===base.u?x:flip(x)).flatMap(x=>x.n.t==='par'?x.n.k:[x]).sort((a,b)=>a.ord-b.ord);
        E=E.filter(x=>!g.includes(x)).concat([{u:base.u,v:base.v,ord:kids[0].ord,rep:base.rep,n:{t:'par',k:kids}}]);changed=true;break;
      }
      if(changed)continue;
      // 직렬: 24V·0V가 아닌 점에 딱 둘
      for(const [node,d] of deg)if(d===2&&node!==T&&node!==B){
        const [oa,ob]=E.filter(x=>x.u===node||x.v===node);
        const a=oa.v===node?oa:flip(oa),b=ob.u===node?ob:flip(ob);
        const k=[...(a.n.t==='ser'?a.n.k:[a]),...(b.n.t==='ser'?b.n.k:[b])];
        E=E.filter(x=>x!==oa&&x!==ob).concat([{u:a.u,v:b.v,ord:Math.min(a.ord,b.ord),rep:[a.rep[0],b.rep[1]],n:{t:'ser',k}}]);
        changed=true;break;
      }
    }
    // 24V-0V 사이에 남은 것 = 줄들. 그 밖에 남은 것은 사다리로 못 그리는 연결
    const rungs=E.filter(x=>(x.u===T&&x.v===B)||(x.u===B&&x.v===T)).map(x=>x.u===T?x:flip(x)).sort((a,b)=>a.ord-b.ord);
    const rest=E.filter(x=>!rungs.some(r=>r.n===x.n));
    if(rest.length)issues.push(`사다리로 정리할 수 없는 연결: ${rest.flatMap(x=>labels(x.n)).join(', ')}`);
    return{rungs:rungs.flatMap(r=>r.n.t==='par'?r.n.k:[r]),issues};
  }
  // 그리기: 블록마다 {w,h,cx,draw(x,y,o)}. 위 연결점 (x+cx,y), 아래 연결점 (x+cx,y+h)
  const EW=86,EH=58;
  function block(x,G){
    const lead=(o,X,y1,y2,net)=>o.push(line(X,y1,X,y2,G.hot(net)?'w lhot':'w'));
    if(x.n.t==='el'){
      const el=x.n.el;
      return{w:EW,h:EH,cx:24,draw(X,Y,o){
        const cx=X+24,cy=Y+EH/2;lead(o,cx,Y,cy-18,x.rep[0]);lead(o,cx,cy+18,Y+EH,x.rep[1]);
        if(el.kind==='no'||el.kind==='nc'){
          const c=el.closed;
          o.push(path(`M${cx},${cy-18}V${cy-8}M${cx},${cy+8}V${cy+18}`));
          if(el.kind==='no')o.push(c?path(`M${cx},${cy+8}V${cy-8}`,'w lon'):path(`M${cx},${cy+8}L${cx-10},${cy-7}`));
          else o.push(path(`M${cx},${cy-8}H${cx+9}`),c?path(`M${cx},${cy+8}L${cx+10},${cy-9}`,'w lon'):path(`M${cx},${cy+8}L${cx+15},${cy+1}`));
          if(el.pb)o.push(line(cx-4,cy,cx-14,cy,'dash'));
          if(el.ls)o.push(line(cx-4,cy,cx-12,cy),circ(cx-15,cy,3));
          if(el.timed)o.push(path(`M${cx-4},${cy}H${cx-10}M${cx-10},${cy-5}A5,5 0 0,0 ${cx-10},${cy+5}`));
          o.push(text(cx+14,cy-2,el.name,'t'),text(cx+14,cy+13,el.term,'s'));
        }else if(el.kind==='sensor'){
          o.push(rect(cx-12,cy-16,24,32,el.closed?'w lonbox':'w'),path(`M${cx},${cy-11}L${cx+7},${cy-4}L${cx},${cy+3}L${cx-7},${cy-4}Z`),
            path(`M${cx},${cy-18}V${cy-16}M${cx},${cy+16}V${cy+18}`),text(cx+16,cy+4,el.name,'t'));
        }else{
          const on=el.on?' lonbox':'';
          if(el.kind==='lamp')o.push(circ(cx,cy,11,'w'+on),path(`M${cx-8},${cy-8}L${cx+8},${cy+8}M${cx+8},${cy-8}L${cx-8},${cy+8}`));
          else o.push(rect(cx-14,cy-10,28,20,'w'+on));
          if(el.kind==='sol')o.push(line(cx-14,cy+10,cx+14,cy-10));
          const r=el.kind==='lamp'?11:10;o.push(path(`M${cx},${cy-18}V${cy-r}M${cx},${cy+r}V${cy+18}`));
          o.push(text(cx+20,cy+5,{reset:`${el.name.slice(0,-1)} 리셋`}[el.kind]||el.name,'t'));
        }
      }};
    }
    const kids=x.n.k.map(k=>block(k,G));
    if(x.n.t==='ser'){
      const left=Math.max(...kids.map(b=>b.cx)),w=left+Math.max(...kids.map(b=>b.w-b.cx));
      return{w,h:kids.reduce((s,b)=>s+b.h,0),cx:left,draw(X,Y,o){let y=Y;kids.forEach(b=>{b.draw(X+left-b.cx,y,o);y+=b.h;});}};
    }
    // 병렬: 가지를 옆으로. 위·아래 가로대로 잇고, 짧은 가지는 아래로 선을 늘인다
    const gap=10,h=Math.max(...kids.map(b=>b.h))+24;let w=0;const xs=kids.map(b=>{const x0=w;w+=b.w+gap;return x0;});w-=gap;
    return{w,h,cx:kids[0].cx,draw(X,Y,o){
      const top=Y+12,bot=Y+h-12,xa=X+kids[0].cx,xb=X+xs[kids.length-1]+kids[kids.length-1].cx;
      lead(o,xa,Y,top,x.rep[0]);lead(o,xa,bot,Y+h,x.rep[1]);
      o.push(line(xa,top,xb,top,G.hot(x.rep[0])?'w lhot':'w'),line(xa,bot,xb,bot,G.hot(x.rep[1])?'w lhot':'w'),circ(xa,top,2.6,'dot'),circ(xa,bot,2.6,'dot'));
      kids.forEach((b,i)=>{const bx=X+xs[i];b.draw(bx,top,o);if(top+b.h<bot)lead(o,bx+b.cx,top+b.h,bot,x.n.k[i].rep[1]);});
    }};
  }
  function elec(L,PARTS,w,e){
    const G=elecGraph(L,PARTS,w,e),R=reduce(G),issues=G.issues.concat(R.issues);
    if(!G.els.length)return svg(760,200,text(380,90,'아직 배선된 부품이 없어요','t','middle')+text(380,114,'선을 꽂으면 그 회로를 사다리 모양으로 그려요','s','middle'));
    const blocks=R.rungs.map(r=>block(r,G));
    const x0=70,y0=40,gap=26,h=Math.max(EH,...blocks.map(b=>b.h)),W=Math.max(760,x0+blocks.reduce((s,b)=>s+b.w+gap,0)+20);
    const o=[],yb=y0+h+20;
    o.push(line(x0-20,y0,W-20,y0,'thick2'),line(x0-20,yb,W-20,yb,'thick2'),text(x0-26,y0+5,'24V','n','end'),text(x0-26,yb+5,'0V','n','end'));
    let x=x0;blocks.forEach((b,i)=>{
      const cx=x+b.cx;o.push(circ(cx,y0,2.6,'dot'),circ(cx,yb,2.6,'dot'));b.draw(x,y0+10,o);
      o.push(line(cx,y0,cx,y0+10,G.hot(R.rungs[i].rep[0])?'w lhot':'w'),line(cx,y0+10+b.h,cx,yb,G.hot(R.rungs[i].rep[1])?'w lhot':'w'));
      x+=b.w+gap;
    });
    if(!blocks.length)o.push(text(W/2,y0+h/2+10,'24V에서 0V까지 이어진 줄이 아직 없어요','t','middle'));
    let y=yb+36;
    if(issues.length){o.push(text(20,y,'확인할 곳','bad'));y+=20;issues.forEach(s=>{o.push(text(28,y,'• '+s,'t'));y+=19;});}
    return svg(W,y+10,o.join(''));
  }
  // _reduce: 테스트용 (정리 결과 + 확인할 곳 전체)
  return{pneu,disp,elec,_reduce:(L,PARTS,w)=>{const G=elecGraph(L,PARTS,w,null),R=reduce(G);return{rungs:R.rungs,issues:G.issues.concat(R.issues)};}};
})();
