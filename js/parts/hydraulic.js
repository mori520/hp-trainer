/* ===================== 유압 부품 =====================
   유압도 공압과 같은 경로 계산(solvePneu)을 쓴다. 다른 점: 쓰고 난 기름은 공기처럼 그 자리에서 빠지지 않고
   밸브의 T 포트 → 호스 → 파워유닛 탱크(T)로 돌아가야 한다. 탱크 호스를 빼먹으면 실린더가 움직이지 않는다.
   - hpu      파워유닛: 펌프 ON/OFF(w.air를 같이 씀), 릴리프 설정 RV(▼▲, 시험 4±0.2 MPa), 압력계, P 포트 HP1·HP2 / 탱크 T 포트 HT1~HT3
   - valve42  4/2 편솔 밸브: 평상시 P→B, A→T / Y 여자 P→A, B→T
   - valve43c 4/3 양솔 밸브(중립 올 포트 블록): Ya 여자 P→A·B→T, Yb 여자 P→B·A→T, 둘 다 꺼지면 가운데(모두 막힘 → 그 자리 정지)
   - valve43a 4/3 양솔 밸브(중립 ABT 접속): 가운데에서 A·B·T가 이어지고 P만 막힘 (파일럿 체크와 쓰는 로킹 회로용)
   - motor    유압모터: A로 들어가 B로 나가면 정회전("+"), 반대면 역회전("-"), 아니면 정지("0"). 상태 w.motor[id]={dir,ang}
   - chk      체크밸브 CV: 1→2만 흐름 (펌프 토출구 역류 방지 등)
   밸브 포트 잭 이름: <id>_P / _T / _A / _B, 솔레노이드는 5/2 밸브와 같이 <id>_Ya_p/n, <id>_Yb_p/n */
PARTS.hpu={
  fluid:'hyd',
  settings:()=>({RV:{def:4,min:0.5,max:7,step:0.1,unit:'MPa'}}),
  source:(p,w)=>w.set.RV,   // 펌프 압력 = 릴리프 설정값 (남는 기름은 릴리프로 탱크에)
  pneu(p,w,u){
    ['HP1','HP2'].forEach(d=>u.u(d,'HPS'));
    if(w.air)u.u('HPS','SUP');
    ['HT1','HT2','HT3'].forEach(t=>u.u(t,'EX'));
  },
  draw(p){
    const [x,y]=p.at, gx=x+100, gy=y+96;
    const g=el('g',{},G);
    el('rect',{x,y,width:200,height:250,rx:6,class:'panel'},g);
    tx('유압 파워유닛',{x:x+14,y:y+22,class:'ptitle'},g);
    el('circle',{cx:gx,cy:gy,r:46,class:'gface'},g);
    for(let k=0;k<=10;k++){
      const a=(-135+27*k)*Math.PI/180, r1=40, r2=k%5?35:31;
      el('line',{x1:gx+r1*Math.sin(a),y1:gy-r1*Math.cos(a),x2:gx+r2*Math.sin(a),y2:gy-r2*Math.cos(a),class:'gtick'},g);
      if(k%5===0)tx(String(k),{x:gx+23*Math.sin(a),y:gy-23*Math.cos(a)+3,'text-anchor':'middle',class:'gnum'},g);
    }
    tx('MPa',{x:gx,y:gy+30,'text-anchor':'middle',class:'gnum'},g);
    p.r.needle=el('line',{x1:gx,y1:gy,x2:gx,y2:gy-36,class:'needle',style:`transform-origin:${gx}px ${gy}px;transform:rotate(-135deg)`},g);
    el('circle',{cx:gx,cy:gy,r:4,class:'symf'},g);
    R.air=el('g',{class:'toggle',tabindex:0,role:'button','aria-label':'펌프'},g);
    el('rect',{x:x+40,y:y+168,width:120,height:34,rx:6},R.air);
    p.r.airTxt=tx('펌프 OFF',{x:gx,y:y+190,'text-anchor':'middle'},R.air);
    p.r.setTxt=tx('',{x:x+16,y:y+230,class:'ptxt'},g);
    setButtons(g,'RV',x+136,y+216,24,22);
    // 매니폴드: P(펌프에서 나옴) 2개, T(탱크로 돌아감) 3개
    el('line',{x1:gx,y1:y+250,x2:gx,y2:y+272,class:'sym'},g);
    el('rect',{x:x+10,y:y+272,width:180,height:56,rx:5,class:'panel'},g);
    tx('P',{x:x+44,y:y+289,class:'psmall','text-anchor':'middle'},g);
    tx('T 탱크',{x:x+142,y:y+289,class:'psmall','text-anchor':'middle'},g);
    pport('HP1',x+30,y+308,'down',g);pport('HP2',x+60,y+308,'down',g);
    pport('HT1',x+105,y+308,'down',g);pport('HT2',x+140,y+308,'down',g);pport('HT3',x+175,y+308,'down',g);
    el('line',{x1:x+88,y1:y+278,x2:x+88,y2:y+322,class:'leader'},g);
  },
  render(p,w){
    R.air.classList.toggle('on',w.air);p.r.airTxt.textContent=w.air?'펌프 ON':'펌프 OFF';
    p.r.needle.style.transform=`rotate(${-135+270*Math.min(1,(w.supP||0)/10)}deg)`;
    p.r.setTxt.textContent='릴리프 '+w.set.RV.toFixed(1)+' MPa';
  }
};

/* 4/2·4/3 밸브. 그림은 5/2 밸브와 같은 틀: 포트 A·B 위, P·T 아래. 스풀(칸 그림)이 옆으로 밀려 지금 칸이 포트 아래에 온다.
   4/2: 칸 폭 70, 솔레노이드 잭은 왼쪽 (5/2 편솔과 같은 자리)
   4/3: 칸 3개가 양쪽으로 한 칸씩 움직여도 판 안에 들어오게 칸 폭 60, 솔레노이드 잭은 아래 양 끝 */
function valve4(kind){
  const three=kind!=='42', abt=kind==='43a';
  const title={'42':'4/2 편솔 밸브','43c':'4/3 양솔 밸브 (중립 블록)','43a':'4/3 양솔 밸브 (중립 ABT)'}[kind];
  const BW=three?60:70, pa=three?16:18, pb=BW-pa;   // 칸 폭, 칸 안의 A(P)·B(T) 줄 위치
  return{
    name:title,
    solCount:three?2:1,
    loads:p=>p.sols.map((name,k)=>({name,a:p.id+'_Y'+'ab'[k]+'_p',b:p.id+'_Y'+'ab'[k]+'_n',sol:true})),
    init(p,w){w.valve[p.id]=0;},
    // 4/2: 0 평상시, 1 여자 / 4/3: 0 가운데, 1 Ya 쪽, 2 Yb 쪽 (둘 다 켜지거나 꺼지면 스프링으로 가운데)
    update(p,w,on){
      const a=on[p.sols[0]];
      if(!three){w.valve[p.id]=a?1:0;return;}
      const b=on[p.sols[1]];
      w.valve[p.id]=a&&!b?1:b&&!a?2:0;
    },
    pneu(p,w,u){
      const v=n=>p.id+'_'+n, s=w.valve[p.id];
      if(!three){if(s){u.u(v('P'),v('A'));u.u(v('B'),v('T'));}else{u.u(v('P'),v('B'));u.u(v('A'),v('T'));}return;}
      if(s===1){u.u(v('P'),v('A'));u.u(v('B'),v('T'));}
      else if(s===2){u.u(v('P'),v('B'));u.u(v('A'),v('T'));}
      else if(abt){u.u(v('A'),v('T'));u.u(v('B'),v('T'));}
    },
    draw(p){
      const [x,y]=p.at, W=400, id=p.id, L=three?x+170:x+180, T=y+62, B=y+112;
      const vg=el('g',{},G);
      el('rect',{x,y,width:W,height:200,rx:6,class:'panel'},vg);
      tx(title,{x:x+14,y:y+22,class:'ptitle'},vg);
      const sw=el('g',{class:'swap',tabindex:0,role:'button','aria-label':'밸브 종류 교체'},vg);
      sw.dataset.slot=p.slot;
      el('rect',{x:x+W-100,y:y+7,width:90,height:22,rx:5},sw);
      tx('⇄ 종류 교체',{x:x+W-55,y:y+22,'text-anchor':'middle'},sw);
      if(three){
        ejack(id+'_Ya_p',x+30,y+176,'red',vg,p.sols[0]+' +',0,-16);
        ejack(id+'_Ya_n',x+70,y+176,'blue',vg,p.sols[0]+' −',0,-16);
        ejack(id+'_Yb_p',x+330,y+176,'red',vg,p.sols[1]+' +',0,-16);
        ejack(id+'_Yb_n',x+370,y+176,'blue',vg,p.sols[1]+' −',0,-16);
        p.r.led=[el('circle',{cx:x+100,cy:y+176,r:5,class:'led'},vg),el('circle',{cx:x+300,cy:y+176,r:5,class:'led'},vg)];
      }else{
        ejack(id+'_Ya_p',x+34,y+82,'red',vg,p.sols[0]+' +',0,-16);
        ejack(id+'_Ya_n',x+34,y+132,'blue',vg,p.sols[0]+' −',0,26);
        p.r.led=[el('circle',{cx:x+64,cy:y+108,r:5,class:'led'},vg)];
      }
      // 고정 포트 (지금 칸 = 포트 바로 아래 칸)
      const ax=L+pa, bx=L+pb;
      [[ax,36,ax,62],[bx,36,bx,62],[ax,112,ax,158],[bx,112,bx,158]].forEach(([a,b,c,d])=>el('line',{x1:a,y1:y+b,x2:c,y2:y+d,class:'sym'},vg));
      pport(id+'_A',ax,y+36,'up',vg,'A',-16,4);
      pport(id+'_B',bx,y+36,'up',vg,'B',16,4);
      pport(id+'_P',ax,y+158,'down',vg,'P',-16,4);
      pport(id+'_T',bx,y+158,'down',vg,'T',16,4);
      const sp=p.r.spool=el('g',{class:'spool'},vg);
      const box=bx0=>el('rect',{x:bx0,y:T,width:BW,height:50,fill:'none',class:'sym'},sp);
      const arrow=(x1,y1,x2,y2)=>el('line',{x1,y1,x2,y2,class:'sym','marker-end':'url(#ah)'},sp);
      // 평행 칸(P→A, B→T)과 교차 칸(P→B, A→T)
      const par=bx0=>{box(bx0);arrow(bx0+pa,B,bx0+pa,T+3);arrow(bx0+pb,T,bx0+pb,B-3);};
      const cross=bx0=>{box(bx0);arrow(bx0+pa,B,bx0+pb,T+3);arrow(bx0+pa,T,bx0+pb,B-3);};
      const block=(cx,top)=>{const yy=top?T:B,d=top?10:-10;el('path',{d:`M${cx},${yy}V${yy+d}M${cx-6},${yy+d}H${cx+6}`,class:'sym'},sp);};
      if(!three){par(L-BW);cross(L);}
      else{
        par(L-BW);cross(L+BW);box(L);
        if(abt){el('path',{d:`M${L+pa},${T}V${T+22}H${L+pb}M${L+pb},${T}V${B}`,class:'sym'},sp);block(L+pa,false);}
        else{block(L+pa,true);block(L+pb,true);block(L+pa,false);block(L+pb,false);}
      }
      // 솔레노이드(왼쪽 a) + 오른쪽: 4/3은 양쪽 스프링(가운데 복귀) + 솔레노이드, 4/2는 스프링
      const left=L-BW, right=three?L+2*BW:L+BW;
      const spring=(x0,dir)=>el('path',{d:`M${x0},${T+25} l${3*dir},-6 l${4*dir},12 l${4*dir},-12 l${3*dir},6`,class:'sym'},sp);
      const sol=x0=>{el('rect',{x:x0,y:T+10,width:24,height:30,fill:'none',class:'sym'},sp);el('line',{x1:x0+4,y1:T+36,x2:x0+20,y2:T+14,class:'sym'},sp);};
      if(three){spring(left,-1);sol(left-14-24);spring(right,1);sol(right+14);}
      else{sol(left-24);el('path',{d:`M${right},${T+25} l6,-8 l8,16 l8,-16 l8,16 l6,-8`,class:'sym'},sp);}
      p.r.shift=BW;
    },
    render(p,w){
      const s=w.valve[p.id];
      p.r.spool.style.transform=`translateX(${s===1?p.r.shift:s===2?-p.r.shift:0}px)`;
      p.sols.forEach((name,k)=>p.r.led[k].classList.toggle('sol',w.out[name]));
    }
  };
}
PARTS.valve42=valve4('42');
PARTS.valve43c=valve4('43c');
PARTS.valve43a=valve4('43a');

/* 유압모터: 포트 <id>_a(A) / <id>_b(B). 실린더와 같은 자리에 놓이고 포트 위치도 실린더 후방·전방 포트와 같다 */
PARTS.motor={
  init(p,w){w.motor[p.id]={dir:0,ang:0};},
  move(p,w,P,E,dt,pn){
    const a=p.id+'_a', b=p.id+'_b', m=w.motor[p.id];
    m.dir=P(a)&&E(b)?1:P(b)&&E(a)?-1:0;
    if(!m.dir)return;
    const f=pn?pn.flow(m.dir>0?a:b,m.dir>0?b:a):{k:1,meter:''};
    m.ang=(m.ang+m.dir*f.k*dt*240)%360;   // 1배속 = 1초에 2/3바퀴
    w.meter[p.id]=f.meter;w.cylP[p.id]=pn?pn.press(m.dir>0?a:b):0;
  },
  draw(p){
    const [x,y]=p.at, cx=x+115, cy=y+30;
    const g=el('g',{},G);
    tx('유압모터 '+p.id,{x,y:y-28,class:'btxt'},g);
    el('rect',{x:x+20,y:y+60,width:16,height:16,class:'steel'},g);
    el('rect',{x:x+CYL_W-46,y:y+60,width:16,height:16,class:'steel'},g);
    el('path',{d:`M${x+28},${y+60}V${cy}H${cx-44}M${x+CYL_W-38},${y+60}V${cy}H${cx+44}`,class:'sym'},g);
    pport(p.id+'_a',x+28,y+84,'down',g,'A',0,26);
    pport(p.id+'_b',x+CYL_W-38,y+84,'down',g,'B',0,26);
    el('circle',{cx,cy,r:44,class:'steel'},g);
    const rot=p.r.rot=el('g',{style:`transform-origin:${cx}px ${cy}px`},g);
    el('circle',{cx,cy,r:30,class:'chrome'},rot);
    for(let k=0;k<4;k++)el('rect',{x:cx-4,y:cy-30,width:8,height:16,class:'piston',transform:`rotate(${k*90} ${cx} ${cy})`},rot);
    el('circle',{cx,cy,r:6,class:'symf'},g);
    p.r.dir=tx('정지',{x:cx+CYL_ST,y:cy+5,'text-anchor':'middle',class:'ptxt'},g);
  },
  render(p,w){
    const m=w.motor[p.id];
    p.r.rot.style.transform=`rotate(${m.ang}deg)`;
    p.r.dir.textContent=m.dir>0?'정회전 ↻':m.dir<0?'역회전 ↺':'정지';
  }
};

/* 체크밸브 CV: 2번(위)·1번(아래) 포트. 1→2만 흐른다. 기기 자리에 끼운다 (devPanel: pneudev.js) */
PARTS.chk={
  tag:'CV',
  dev:p=>{const N=p.tags[0];return{kind:'chk',a:N+'_1',b:N+'_2'};},
  draw(p){
    const N=p.tags[0],{g,cx,ty,px}=devPanel(p,'체크밸브 '+N);
    pport(N+'_2',px,ty,'up',g,'2',-16,4);
    pport(N+'_1',px,ty+DEV_H,'down',g,'1',-16,4);
    // 기호: 공(동그라미)과 시트(V). 아래(1)에서 위(2)로만 열림
    el('path',{d:`M${px},${ty+10}V${ty+27}M${px},${ty+45}V${ty+60}M${px-10},${ty+27}L${px},${ty+37}L${px+10},${ty+27}`,class:'sym'},g);
    el('circle',{cx:px,cy:ty+40,r:6,fill:'none',class:'sym'},g);
    tx('1 → 2',{x:cx+30,y:ty+40,'text-anchor':'middle',class:'ptxt'},g);
  }
};
