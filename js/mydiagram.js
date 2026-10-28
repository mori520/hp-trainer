/* ===================== 내 회로 도면: 그리기 =====================
   사용자가 만든 것을 시험 도면 모양으로 다시 그린다 (DOM을 쓰지 않음 → 테스트에서도 돈다). 화면 쪽은 mydiagram-ui.js
   - pneu(parts, hoses, info) : 공기압회로도. 부품 기호는 자리마다 정해진 곳에 두고, 꽂힌 호스를 선으로 잇는다
       (도면대로 꽂았으면 시험 도면과 같은 모양이 되고, 잘못 꽂았으면 잘못된 모양 그대로 보인다). 비어 있는 포트는 빈 동그라미
   - disp(runs, names)       : 변위단계선도. runs = 기록한 동작 [{seq:["A+","wait:3.0초","B+",…]}] */
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
  return{pneu,disp};
})();
