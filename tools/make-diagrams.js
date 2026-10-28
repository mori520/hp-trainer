/* 미션 도면(SVG) 만들기 도구 — 개발용. 결과 파일(diagrams/*.svg)을 저장소에 넣고, 앱은 그림만 띄운다.
   실행: node tools/make-diagrams.js
   도면 = 가. 공기압회로도(유압 미션은 유압회로도) / 나. 전기회로도(세로 사다리, 위 24V·아래 0V) / 다. 변위단계선도
   (공개과제 도면은 복사하지 않는다. 우리 미션 회로를 직접 그린 것) */
const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'..','diagrams');

class Svg{
  constructor(w,h){this.w=w;this.h=h;this.o=[];}
  add(s){this.o.push(s);return this;}
  line(x1,y1,x2,y2,c='w'){return this.add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c}"/>`);}
  path(d,c='w'){return this.add(`<path d="${d}" class="${c}"/>`);}
  rect(x,y,w,h,c='w'){return this.add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${c}"/>`);}
  dot(x,y){return this.add(`<circle cx="${x}" cy="${y}" r="2.6" class="dot"/>`);}
  text(x,y,s,{anchor='start',c='t'}={}){return this.add(`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${c}">${s}</text>`);}
  toString(){
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}">
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#111"/></marker></defs>
<style>
.w{stroke:#111;stroke-width:1.6;fill:none;stroke-linecap:round;stroke-linejoin:round}
.thin{stroke:#bbb;stroke-width:1;fill:none}
.thick{stroke:#111;stroke-width:4;fill:none}
.dash{stroke:#111;stroke-width:1.4;fill:none;stroke-dasharray:4 3}
.arw{stroke:#111;stroke-width:1.4;fill:none;marker-end:url(#ar)}
.fill{fill:#111;stroke:#111}
.dot{fill:#111}
.t{font:13px "Malgun Gothic","Apple SD Gothic Neo",sans-serif;fill:#111}
.s{font:11px "Malgun Gothic","Apple SD Gothic Neo",sans-serif;fill:#444}
.h{font:bold 15px "Malgun Gothic","Apple SD Gothic Neo",sans-serif;fill:#111}
.n{font:bold 13px "Malgun Gothic","Apple SD Gothic Neo",sans-serif;fill:#111}
</style>
<rect width="100%" height="100%" fill="#fff"/>
${this.o.join('\n')}
</svg>
`;
  }
}

/* ---------- 나. 전기회로도: 세로 사다리 ---------- */
function ladder(S,{top,bot,x0,x1}){
  S.line(x0,top,x1,top).line(x0,bot,x1,bot);
  S.text(x0-6,top+5,'24V',{anchor:'end',c:'n'}).text(x0-6,bot+5,'0V',{anchor:'end',c:'n'});
  const Y=[top+55,top+125,top+195], CY=bot-45;
  // 접점 하나 (가운데 y, 위아래 20px). act: 'pb'(누름버튼) | 'ls'(리밋스위치) | 'es'(비상정지, 버섯 머리 + 유지)
  function contact(x,y,c){
    if(c.t==='gap'){S.line(x,y-20,x,y+20);return;}   // 접점 없이 지나가는 줄
    // 3선식 센서를 줄 안에 그림: 위(갈색 +24V)에서 들어와 아래(흑색 출력)로 나가고, 청색은 0V까지
    if(c.t==='sensor'){
      S.line(x,y-20,x,y-16);S.rect(x-14,y-16,28,32);
      S.path(`M${x},${y-12}L${x+8},${y-4}L${x},${y+4}L${x-8},${y-4}Z`);S.line(x-4,y-4,x+4,y-4);S.line(x-5,y+10,x+5,y+10);
      S.line(x,y+16,x,y+20);S.path(`M${x-14},${y+8}H${x-24}V${bot}`);S.dot(x-24,bot);
      S.text(x-30,y-4,c.name,{anchor:'end'});return;
    }
    if(c.t==='no')S.path(`M${x},${y-20}V${y-8}M${x},${y+8}V${y+20}M${x},${y+8}L${x-9},${y-7}`);
    else S.path(`M${x},${y-20}V${y-8}H${x+9}M${x},${y+8}V${y+20}M${x},${y+8}L${x+11},${y-11}`);
    if(c.act==='pb'){S.line(x-4,y,x-20,y,'dash');S.path(`M${x-20},${y-6}V${y+6}M${x-20},${y-6}H${x-25}M${x-20},${y+6}H${x-25}`);}
    if(c.act==='ls'){S.line(x-4,y,x-18,y);S.add(`<circle cx="${x-22}" cy="${y}" r="4" class="w"/>`);
      if(c.pressed)S.path(`M${x-22},${y+16}V${y+6}M${x-25},${y+10}L${x-22},${y+5}L${x-19},${y+10}`);}   // 처음부터 눌려 있는 리밋(화살표)
    if(c.act==='ps'){S.line(x-4,y,x-14,y,'dash');S.rect(x-26,y-7,12,14);S.path(`M${x-23},${y+4}L${x-17},${y-4}`);}   // 압력스위치
    if(c.act==='es'){S.line(x-4,y,x-18,y,'dash');S.path(`M${x-18},${y-8}A8,8 0 0,0 ${x-18},${y+8}Z`);S.path(`M${x-11},${y-4}l3,4l-3,4`);}
    // 한시(타이머) 접점: 날에서 왼쪽으로 낙하산 모양 표시
    if(c.timed){S.line(x-4,y,x-12,y);S.path(`M${x-12},${y-6}A6,6 0 0,0 ${x-12},${y+6}`);}
    if(c.act)S.text(x-32,y+5,c.name,{anchor:'end'});
    else S.text(x+(c.t==='nc'?16:12),y+5,c.name);
  }
  // 부하: coil(릴레이 코일) | sol(솔레노이드) | lamp(램프)
  function load(x,y,c){
    if(c.t==='lamp'){S.add(`<circle cx="${x}" cy="${y}" r="10" class="w"/>`);S.path(`M${x-7},${y-7}L${x+7},${y+7}M${x+7},${y-7}L${x-7},${y+7}`);S.text(x+18,y+5,c.name);return;}
    S.rect(x-12,y-9,24,18);
    if(c.t==='sol')S.line(x-12,y+9,x+12,y-9);
    S.text(x+18,y+5,c.name);
  }
  return{
    Y,CY,top,bot,
    // 가로대(세로줄) 하나: 위 24V(또는 fromY)에서 접점들을 지나 맨 아래 부하(코일·솔레노이드·램프)를 거쳐 0V로
    // 접점에 hold:'K1'이 있으면 그 접점과 나란히(병렬) 자기유지 접점을 오른쪽에 그린다. span:2면 아래 접점까지 묶어서 병렬
    // holdT:'nc'면 자기유지 접점을 NC로 그린다 (오류 찾기 미션의 틀린 도면용)
    // hold에 접점 목록([{t,name},…], 2개까지)을 주면 병렬 가지에 직렬로 그린다 (span:2 필요). 예: K4 a접점 + K5 b접점
    // slots: 접점을 놓을 높이 목록 (기본 Y), dot: fromY에서 갈라지는 점 표시
    rung(x,els,{fromY,slots=Y,dot=false}={}){
      const loadEl=els[els.length-1], cs=els.slice(0,-1);
      let cur=fromY==null?top:fromY;
      if(fromY==null||dot)S.dot(x,cur);
      cs.forEach((c,i)=>{
        const y=slots[i];
        S.line(x,cur,x,y-20);contact(x,y,c);cur=y+20;
        if(c.hold){
          const hx=x+52, y2=slots[i+(c.span||1)-1], hy=(y+y2)/2;
          const hs=Array.isArray(c.hold)?c.hold:[{t:c.holdT||'no',name:c.hold}], ys=hs.length>1?[y,y2]:[hy];
          S.path(`M${x},${y-32}H${hx}V${ys[0]-20}`);
          hs.forEach((h,k)=>{contact(hx,ys[k],h);if(k)S.line(hx,ys[k-1]+20,hx,ys[k]-20);});
          S.path(`M${hx},${ys[ys.length-1]+20}V${y2+32}H${x}`);S.dot(x,y-32);S.dot(x,y2+32);
        }
      });
      S.line(x,cur,x,CY-9);load(x,CY,loadEl);S.line(x,CY+9,x,bot);S.dot(x,bot);
    },
    // 가로 모선: 비상정지 등을 거친 뒤 여러 줄에 전기를 나눠 주는 선
    bus(x1,x2,y){S.line(x1,y,x2,y);},
    // 위 24V에서 접점 하나를 거쳐 모선(busY)까지 내려가는 짧은 줄
    drop(x,c,busY){S.dot(x,top);const y=(top+busY)/2;S.line(x,top,x,y-20);contact(x,y,c);S.line(x,y+20,x,busY);S.dot(x,busY);},
    // 3선식 센서: 갈색 24V, 청색 0V, 흑색 출력 → toX 줄의 코일
    sensor(x,name,toX){
      const y=Y[1];
      S.dot(x,top);S.line(x,top,x,y-14);S.path(`M${x},${y-14}L${x+14},${y}L${x},${y+14}L${x-14},${y}Z`);
      S.line(x-6,y,x+6,y);S.line(x,y+14,x,bot);S.dot(x,bot);
      S.line(x+14,y,toX,y);
      S.text(x-20,y+5,name,{anchor:'end'});
      S.text(x+5,y-24,'갈',{c:'s'}).text(x+5,y+30,'청',{c:'s'}).text(x+18,y-5,'흑',{c:'s'});
    }
  };
}

/* ---------- 가. 공기압회로도 ---------- */
// 복동 실린더: 몸통 x..x+160, 막대 끝(후진 위치) x+200. 센서 표시 "-" = x+200, "+" = x+260
function cylinder(S,x,y,name,sensors=[]){
  S.text(x,y-10,name,{c:'n'});
  S.rect(x,y,160,30);S.line(x+22,y,x+22,y+30,'thick');S.line(x+22,y+15,x+200,y+15,'thick');
  S.path(`M${x+12},${y+30}V${y+40}M${x+148},${y+30}V${y+40}`);
  sensors.forEach(s=>{
    const sx=x+(s.end==='-'?200:260);
    if(s.kind==='ls'){
      S.rect(sx-7,y-26,14,12);S.line(sx,y-14,sx,y+4);S.add(`<circle cx="${sx}" cy="${y+8}" r="4" class="w"/>`);
    }else{
      S.path(`M${sx},${y-24}L${sx+9},${y-15}L${sx},${y-6}L${sx-9},${y-15}Z`);S.line(sx-4,y-15,sx+4,y-15);
    }
    S.text(sx,y-32,s.name,{anchor:'middle'});
  });
  return{cap:[x+12,y+40],rod:[x+148,y+40]};
}
// 5/2 밸브: 왼쪽 칸(여자) | 오른쪽 칸(평상시). 포트는 오른쪽 칸에: 4·2 위, 1 아래, 배기 5·3
// capDev: 후방 줄에 끼운 기기 'fcv'(일방향 유량조절) | 'qev'(급속배기), supplyDev: 공급 줄 'prv'(감압)
function valve(S,vx,vy,cyl,{double=false,sols,capDev,supplyDev}){
  const W=60,H=36,R=vx+W;
  S.rect(vx,vy,W,H).rect(R,vy,W,H);
  S.path(`M${vx+30},${vy+H}L${vx+15},${vy+3}`,'arw');S.path(`M${vx+45},${vy}L${vx+52},${vy+H-3}`,'arw');
  S.path(`M${R+30},${vy+H}L${R+45},${vy+3}`,'arw');S.path(`M${R+15},${vy}L${R+8},${vy+H-3}`,'arw');
  [R+8,R+52].forEach(ex=>S.path(`M${ex},${vy+H}V${vy+H+8}M${ex-5},${vy+H+8}H${ex+5}L${ex},${vy+H+15}Z`));
  if(supplyDev==='prv'){
    const sx=R+30,sy=vy+H+18;
    S.path(`M${sx},${vy+H}V${sy}`);S.rect(sx-12,sy,24,24);S.line(sx-7,sy+19,sx+7,sy+5,'arw');
    S.path(`M${sx+12},${sy+12}l4,-5l4,10l4,-10l4,5`);S.text(sx+32,sy+16,'감압 0.3 MPa',{c:'s'});
    S.path(`M${sx},${sy+24}V${sy+36}`);S.path(`M${sx},${sy+36}l-6,10h12z`,'fill');
  }else{S.path(`M${R+30},${vy+H}V${vy+H+22}`);S.path(`M${R+30},${vy+H+22}l-6,10h12z`,'fill');}
  S.text(R+20,vy-6,'4',{c:'s'}).text(R+48,vy-6,'2',{c:'s'}).text(R+36,vy+H+14,'1',{c:'s'});
  S.rect(vx-24,vy+8,24,20);S.line(vx-24,vy+28,vx,vy+8);S.text(vx-30,vy+23,sols[0],{anchor:'end'});
  if(double){S.rect(R+W,vy+8,24,20);S.line(R+W,vy+28,R+W+24,vy+8);S.text(R+W+30,vy+23,sols[1]);}
  else S.path(`M${R+W},${vy+18}l4,-6l6,12l6,-12l6,12l4,-6`);
  // 4 → 후방, 2 → 전방
  S.path(`M${R+15},${vy}V${vy-18}H${cyl.cap[0]}V${cyl.cap[1]}`);
  if(capDev){
    // 후방 줄 세로 구간 가운데에 기기 기호
    const x=cyl.cap[0],y=(cyl.cap[1]+vy-18)/2;
    S.add(`<rect x="${x-13}" y="${y-14}" width="26" height="28" fill="#fff" stroke="none"/>`);
    if(capDev==='fcv'){
      S.path(`M${x},${y-14}V${y-10}H${x-7}V${y+10}H${x}V${y+14}M${x},${y-10}H${x+7}V${y+10}H${x}`);
      S.path(`M${x-10},${y-5}Q${x-7},${y} ${x-10},${y+5}M${x-4},${y-5}Q${x-7},${y} ${x-4},${y+5}`);
      S.add(`<circle cx="${x+7}" cy="${y-1}" r="3" class="w"/>`);S.path(`M${x+3},${y+6}L${x+7},${y+2}L${x+11},${y+6}`);
      S.text(x+16,y+4,'미터아웃',{c:'s'});
    }else{
      S.rect(x-8,y-9,16,18);S.path(`M${x},${y-14}V${y-9}M${x},${y+9}V${y+14}M${x+8},${y}H${x+14}`);
      S.path(`M${x+14},${y-5}L${x+22},${y}L${x+14},${y+5}Z`);S.text(x+26,y+4,'급속배기',{c:'s'});
    }
  }
  S.path(`M${R+45},${vy}V${vy-32}H${cyl.rod[0]}V${cyl.rod[1]}`);
}

/* ---------- 가. 유압회로도 ---------- */
// 액추에이터(실린더·하중 실린더·모터) + 4/2·4/3 밸브 + 파워유닛(펌프·릴리프·탱크). 밸브 포트는 평상시 칸에: A·B 위, P·T 아래
// o: {act:'cyl'|'cylw'|'motor', name, sensors, valve:'42'|'43c'|'43a', sols, capDev, rodDev, lock, supply:'chk'|'bleed', rv}
//   capDev·rodDev(후방·전방 줄 기기): 'fcvin'(미터인 유량조절) | 'hprv' | 'cbv' | 'psw' (뒤에 :글자 = 옆 설명)
function tank(S,x,y){S.path(`M${x-10},${y}V${y+8}H${x+10}V${y}`);}
function hdev(S,x,y,dev){
  const [k,lab]=dev.split(':');
  S.add(`<rect x="${x-13}" y="${y-14}" width="26" height="28" fill="#fff" stroke="none"/>`);
  if(k==='fcvin'){
    S.path(`M${x},${y-14}V${y-10}H${x-7}V${y+10}H${x}V${y+14}M${x},${y-10}H${x+7}V${y+10}H${x}`);
    S.path(`M${x-10},${y-5}Q${x-7},${y} ${x-10},${y+5}M${x-4},${y-5}Q${x-7},${y} ${x-4},${y+5}`);
    S.add(`<circle cx="${x+7}" cy="${y+1}" r="3" class="w"/>`);S.path(`M${x+3},${y-4}L${x+7},${y}L${x+11},${y-4}`);   // 체크가 아래로 열림 → 올라가는 기름은 조임
  }
  if(k==='hprv'){S.rect(x-9,y-10,18,20);S.path(`M${x},${y-14}V${y-10}M${x},${y+10}V${y+14}`);S.line(x-5,y+7,x+5,y-7,'arw');}
  if(k==='cbv'){S.path(`M${x},${y-14}V${y-10}H${x-7}V${y+10}H${x}V${y+14}M${x},${y-10}H${x+7}V${y+10}H${x}`);S.rect(x-11,y-4,8,9);S.add(`<circle cx="${x+7}" cy="${y-1}" r="3" class="w"/>`);}
  if(k==='psw'){S.path(`M${x},${y-14}V${y+14}M${x},${y}H${x+6}`);S.rect(x+6,y-6,10,12);}
  if(lab)S.text(x+16,y+4,lab,{c:'s'});
}
function hmotor(S,x,y,name){
  const cx=x+80,cy=y+12;
  S.text(x,y-10,name,{c:'n'}).text(cx+24,cy-16,'유압모터',{c:'s'});S.add(`<circle cx="${cx}" cy="${cy}" r="20" class="w"/>`);
  S.path(`M${cx-6},${cy-18}L${cx},${cy-10}L${cx+6},${cy-18}Z`,'fill');S.path(`M${cx-6},${cy+18}L${cx},${cy+10}L${cx+6},${cy+18}Z`,'fill');
  S.path(`M${x+12},${y+40}V${cy}H${cx-20}M${x+148},${y+40}V${cy}H${cx+20}`);
  return{cap:[x+12,y+40],rod:[x+148,y+40]};
}
function hyd(S,x,y,o){
  const act=o.act==='motor'?hmotor(S,x,y,o.name):cylinder(S,x,y,o.name,o.sensors||[]);
  if(o.act==='cylw'){S.rect(x+204,y+20,20,18);S.text(x+214,y+33,'W',{anchor:'middle',c:'s'});S.text(x+232,y+33,'하중',{c:'s'});}
  const three=o.valve!=='42',abt=o.valve==='43a',W=48,H=36,vy=y+150,vx=x+20;
  const boxes=three?['par','mid','cross']:['par','cross'],rb=vx+W;
  boxes.forEach((b,i)=>{
    const bx=vx+i*W;S.rect(bx,vy,W,H);
    if(b==='par'){S.path(`M${bx+12},${vy+H}L${bx+12},${vy+3}`,'arw');S.path(`M${bx+36},${vy}L${bx+36},${vy+H-3}`,'arw');}
    if(b==='cross'){S.path(`M${bx+12},${vy+H}L${bx+36},${vy+3}`,'arw');S.path(`M${bx+12},${vy}L${bx+36},${vy+H-3}`,'arw');}
    if(b==='mid'){
      const tb=(cx,top)=>S.path(top?`M${cx},${vy}V${vy+8}M${cx-5},${vy+8}H${cx+5}`:`M${cx},${vy+H}V${vy+H-8}M${cx-5},${vy+H-8}H${cx+5}`);
      if(abt){S.path(`M${bx+12},${vy}V${vy+14}H${bx+36}M${bx+36},${vy}V${vy+H}`);tb(bx+12,false);}
      else{tb(bx+12,true);tb(bx+36,true);tb(bx+12,false);tb(bx+36,false);}
    }
  });
  const R=vx+boxes.length*W;
  S.rect(vx-24,vy+8,24,20);S.line(vx-24,vy+28,vx,vy+8);S.text(vx-30,vy+23,o.sols[0],{anchor:'end'});
  if(three){S.rect(R,vy+8,24,20);S.line(R,vy+28,R+24,vy+8);S.text(R+30,vy+23,o.sols[1]);}
  else S.path(`M${R},${vy+18}l4,-6l6,12l6,-12l6,12l4,-6`);
  S.text(rb+6,vy-6,'A',{anchor:'end',c:'s'}).text(rb+42,vy-6,'B',{c:'s'}).text(rb+6,vy+H+14,'P',{anchor:'end',c:'s'}).text(rb+42,vy+H+14,'T',{c:'s'});
  // A → 후방, B → 전방 (줄 가운데에 기기)
  const ax=rb+12,bxp=rb+36,yA=vy-18,yB=vy-34;
  S.path(`M${ax},${vy}V${yA}H${act.cap[0]}V${act.cap[1]}`);S.path(`M${bxp},${vy}V${yB}H${act.rod[0]}V${act.rod[1]}`);
  const mid=(top,bot)=>(top+bot)/2;
  if(o.capDev)hdev(S,act.cap[0],mid(act.cap[1],yA),o.capDev);
  if(o.rodDev)hdev(S,act.rod[0],mid(act.rod[1],yB),o.rodDev);
  if(o.lock){
    [[act.cap[0],mid(act.cap[1],yA)],[act.rod[0],mid(act.rod[1],yB)]].forEach(([cx,cy])=>{
      S.add(`<rect x="${cx-13}" y="${cy-12}" width="26" height="24" fill="#fff" stroke="none"/>`);
      S.path(`M${cx-7},${cy-6}L${cx},${cy+1}L${cx+7},${cy-6}`);S.add(`<circle cx="${cx}" cy="${cy+3}" r="4" class="w"/>`);
    });
    const y1=mid(act.cap[1],yA);S.path(`M${act.cap[0]+8},${y1+3}L${act.rod[0]},${y1+12}`,'dash');S.text((act.cap[0]+act.rod[0])/2,y1-6,'파일럿 체크',{anchor:'middle',c:'s'});
  }
  // 파워유닛: P 아래로 펌프, 릴리프는 탱크로. T는 바로 탱크. feed:{x,y}면 펌프를 다시 그리지 않고 그 점(첫 밸브의 P 줄)에서 받음
  const py=vy+H+44, pumpX=vx-50;
  if(o.feed){S.path(`M${ax},${vy+H}V${o.feed.y}H${o.feed.x}`);S.dot(o.feed.x,o.feed.y);S.path(`M${bxp},${vy+H}V${py+50}`);tank(S,bxp,py+50);return{py,ax};}
  S.path(`M${ax},${vy+H}V${py}H${pumpX}V${py+12}`);
  if(o.supply==='chk'){const cy=vy+H+22;S.add(`<rect x="${ax-10}" y="${cy-10}" width="20" height="20" fill="#fff" stroke="none"/>`);S.path(`M${ax-7},${cy+4}L${ax},${cy-3}L${ax+7},${cy+4}`);S.add(`<circle cx="${ax}" cy="${cy-6}" r="4" class="w"/>`);S.text(ax+12,cy+4,'체크',{c:'s'});}
  S.add(`<circle cx="${pumpX}" cy="${py+26}" r="13" class="w"/>`);S.path(`M${pumpX-7},${py+30}L${pumpX},${py+19}L${pumpX+7},${py+30}Z`,'fill');
  S.line(pumpX,py+39,pumpX,py+50);tank(S,pumpX,py+50);
  const rx=pumpX+40;S.path(`M${rx},${py}V${py+12}`);S.rect(rx-10,py+12,20,20);S.line(rx-6,py+28,rx+6,py+16,'arw');S.path(`M${rx},${py+32}V${py+50}`);tank(S,rx,py+50);
  S.text(rx+14,py+28,`릴리프 ${o.rv||'4.0'} MPa`,{c:'s'});
  if(o.supply==='bleed'){const bx=pumpX-40;S.path(`M${pumpX},${py}H${bx}V${py+12}`);S.path(`M${bx-5},${py+16}Q${bx},${py+22} ${bx-5},${py+28}M${bx+5},${py+16}Q${bx},${py+22} ${bx+5},${py+28}`);S.line(bx-8,py+30,bx+8,py+14,'arw');S.path(`M${bx},${py+30}V${py+50}`);tank(S,bx,py+50);S.text(bx,py+72,'블리드오프',{anchor:'middle',c:'s'});}
  S.path(`M${bxp},${vy+H}V${py+50}`);tank(S,bxp,py+50);
  return{py,ax};
}

/* ---------- 다. 변위단계선도 ---------- */
// seq 원소: "A+"·"B-" 같은 동작, 또는 "wait:3초"(그 구간은 그대로 머물고 위에 글자 표시)
function displacement(S,x,y,names,seq){
  seq.forEach((m,k)=>{if(m.startsWith('wait:'))S.text(x+(k+0.5)*80,y+12,m.slice(5),{anchor:'middle',c:'s'});});
  const dx=80,rh=34,gap=24,n=seq.length+1;
  for(let k=0;k<n;k++){S.text(x+k*dx,y-8,String(k+1),{anchor:'middle',c:'s'});}
  names.forEach((a,r)=>{
    const top=y+r*(rh+gap),bot=top+rh;
    for(let k=0;k<n;k++)S.line(x+k*dx,top,x+k*dx,bot,'thin');
    S.line(x,top,x+(n-1)*dx,top,'thin').line(x,bot,x+(n-1)*dx,bot,'thin');
    S.text(x-40,top+rh/2+5,a,{c:'n'}).text(x-10,top+4,'1',{anchor:'end',c:'s'}).text(x-10,bot+4,'0',{anchor:'end',c:'s'});
    let st=0;const pts=[[x,bot]];
    seq.forEach((m,k)=>{if(m[0]===a)st=m[1]==='+'?1:0;pts.push([x+(k+1)*dx,st?top:bot]);});
    S.path('M'+pts.map(p=>p.join(',')).join('L'),'thick');
  });
}

// hyd: 유압 미션(제목 "유압회로도", 회로도 칸이 조금 더 큼). seq가 비어 있으면 변위단계선도 대신 동작 설명(note)만
function sheet(file,{w,h,pneu,elec,elecH=300,seq,names,note,hyd}){
  const S=new Svg(w,h);
  S.text(16,26,hyd?'가. 유압회로도':'가. 공기압회로도',{c:'h'});pneu(S);
  const lt=hyd?450:300;S.text(16,lt-20,'나. 전기회로도',{c:'h'});
  elec(ladder(S,{top:lt+10,bot:lt+10+elecH,x0:50,x1:w-30}));
  const dy=lt+elecH+60;S.text(16,dy,seq.length?'다. 변위단계선도':'다. 동작',{c:'h'});
  if(seq.length)displacement(S,90,dy+34,names,seq);
  (note||[]).forEach((t,k)=>S.text(seq.length?90+seq.length*80+40:40,dy+40+k*20,t));
  fs.writeFileSync(path.join(OUT,file),S.toString());
  console.log('wrote diagrams/'+file);
}

fs.mkdirSync(OUT,{recursive:true});

// 미션 5: LS2(A+)로 자기유지를 끊어 자동 후진
sheet('m5.svg',{w:560,h:760,names:['A'],seq:['A+','A-'],
  pneu:S=>{const c=cylinder(S,90,90,'A',[{end:'+',name:'LS2',kind:'ls'}]);valve(S,130,190,c,{sols:['Y1']});},
  elec:L=>{
    L.rung(140,[{t:'nc',name:'LS2',act:'ls'},{t:'no',name:'PB1',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(300,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);
  }});

// 미션 6: 센서 S2(A+) → K2, K2 NC로 자기유지를 끊음
sheet('m6.svg',{w:600,h:760,names:['A'],seq:['A+','A-'],
  pneu:S=>{const c=cylinder(S,90,90,'A',[{end:'+',name:'S2',kind:'cap'}]);valve(S,130,190,c,{sols:['Y1']});},
  elec:L=>{
    L.sensor(110,'S2',180);L.rung(180,[{t:'coil',name:'K2'}],{fromY:L.Y[1]});
    L.rung(300,[{t:'nc',name:'K2'},{t:'no',name:'PB1',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(450,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);
  }});

// 미션 7: 양솔 밸브. PB1 → Y1(전진), LS2(A+) → Y2(후진)
sheet('m7.svg',{w:560,h:760,names:['A'],seq:['A+','A-'],
  pneu:S=>{const c=cylinder(S,90,90,'A',[{end:'+',name:'LS2',kind:'ls'}]);valve(S,130,190,c,{double:true,sols:['Y1','Y2']});},
  elec:L=>{
    L.rung(160,[{t:'no',name:'PB1',act:'pb'},{t:'sol',name:'Y1'}]);
    L.rung(330,[{t:'no',name:'LS2',act:'ls'},{t:'sol',name:'Y2'}]);
  }});

// 미션 8: A+ B+ B− A−. S1(A+) → K2, LS1(B+) → K3 유지, LS2(B−) + K3 → K4가 K1 해제
sheet('m8.svg',{w:780,h:820,names:['A','B'],seq:['A+','B+','B-','A-'],
  pneu:S=>{
    const a=cylinder(S,60,90,'A',[{end:'+',name:'S1',kind:'cap'}]);valve(S,100,190,a,{sols:['Y1']});
    const b=cylinder(S,420,90,'B',[{end:'+',name:'LS1',kind:'ls'},{end:'-',name:'LS2',kind:'ls'}]);valve(S,460,190,b,{sols:['Y2']});
  },
  elec:L=>{
    L.rung(110,[{t:'nc',name:'K4'},{t:'no',name:'PB1',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(230,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);
    L.sensor(320,'S1',380);L.rung(380,[{t:'coil',name:'K2'}],{fromY:L.Y[1]});
    L.rung(470,[{t:'no',name:'K1'},{t:'no',name:'K2'},{t:'nc',name:'K3'},{t:'sol',name:'Y2'}]);
    L.rung(570,[{t:'no',name:'K1'},{t:'no',name:'LS1',act:'ls',hold:'K3'},{t:'coil',name:'K3'}]);
    L.rung(710,[{t:'no',name:'K3'},{t:'no',name:'LS2',act:'ls'},{t:'coil',name:'K4'}]);
  }});

// 미션 9: 연속동작·연속정지. K1 = 연속 기억(PB2 시작, PB3 정지), K2 = 한 사이클(LS1에서 시작, LS2에서 끝)
sheet('m9.svg',{w:580,h:760,names:['A'],seq:['A+','A-'],note:['PB2: 연속 반복','PB3: 사이클 끝에서 정지'],
  pneu:S=>{const c=cylinder(S,90,90,'A',[{end:'-',name:'LS1',kind:'ls'},{end:'+',name:'LS2',kind:'ls'}]);valve(S,130,190,c,{sols:['Y1']});},
  elec:L=>{
    L.rung(130,[{t:'nc',name:'PB3',act:'pb'},{t:'no',name:'PB2',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(300,[{t:'nc',name:'LS2',act:'ls'},{t:'no',name:'K1',hold:'K2',span:2},{t:'no',name:'LS1',act:'ls'},{t:'coil',name:'K2'}]);
    L.rung(470,[{t:'no',name:'K2'},{t:'sol',name:'Y1'}]);
  }});

// 미션 12: 비상정지(유지형) NC로 제어 모선 전체를 끊고, NO로 램프 H1
sheet('m12.svg',{w:660,h:820,elecH:360,names:['A'],seq:['A+','A-'],note:['PB2: 연속 반복','비상정지 ON: 후진 + H1 점등','비상정지 OFF: 초기화'],
  pneu:S=>{const c=cylinder(S,90,90,'A',[{end:'-',name:'LS1',kind:'ls'},{end:'+',name:'LS2',kind:'ls'}]);valve(S,130,190,c,{sols:['Y1']});},
  elec:L=>{
    const busY=L.top+80, slots=[L.top+130,L.top+200,L.top+270];
    L.drop(90,{t:'nc',name:'ES',act:'es'},busY);L.bus(90,480,busY);
    L.rung(170,[{t:'no',name:'PB2',act:'pb',hold:'K1'},{t:'coil',name:'K1'}],{fromY:busY,slots,dot:true});
    L.rung(320,[{t:'nc',name:'LS2',act:'ls'},{t:'no',name:'K1',hold:'K2',span:2},{t:'no',name:'LS1',act:'ls'},{t:'coil',name:'K2'}],{fromY:busY,slots,dot:true});
    L.rung(480,[{t:'no',name:'K2'},{t:'sol',name:'Y1'}],{fromY:busY,slots,dot:true});
    L.rung(590,[{t:'no',name:'ES',act:'es'},{t:'lamp',name:'H1'}],{slots});
  }});

// 미션 10: 미션 9 + 카운터. LS2 NO로 세고, 다 세면 카운터 NC가 K1을 끊음. PB3로 리셋
sheet('m10.svg',{w:780,h:760,names:['A'],seq:['A+','A-','A+','A-','A+','A-'],note:['PB2: 3회 후 정지','PB3: 카운터 리셋'],
  pneu:S=>{const c=cylinder(S,90,90,'A',[{end:'-',name:'LS1',kind:'ls'},{end:'+',name:'LS2',kind:'ls'}]);valve(S,130,190,c,{sols:['Y1']});},
  elec:L=>{
    L.rung(120,[{t:'nc',name:'C1'},{t:'no',name:'PB2',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(290,[{t:'nc',name:'LS2',act:'ls'},{t:'no',name:'K1',hold:'K2',span:2},{t:'no',name:'LS1',act:'ls'},{t:'coil',name:'K2'}]);
    L.rung(440,[{t:'no',name:'K2'},{t:'sol',name:'Y1'}]);
    L.rung(560,[{t:'no',name:'LS2',act:'ls'},{t:'coil',name:'C1 (3회)'}]);
    L.rung(690,[{t:'no',name:'PB3',act:'pb'},{t:'coil',name:'C1 리셋'}]);
  }});

// 미션 11: LS2(A+) → T1, 3초 뒤 T1 NC가 K1 자기유지를 끊어 후진
sheet('m11.svg',{w:580,h:760,names:['A'],seq:['A+','wait:3초','A-'],
  pneu:S=>{const c=cylinder(S,90,90,'A',[{end:'+',name:'LS2',kind:'ls'}]);valve(S,130,190,c,{sols:['Y1']});},
  elec:L=>{
    L.rung(140,[{t:'nc',name:'T1',timed:true},{t:'no',name:'PB1',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(320,[{t:'no',name:'LS2',act:'ls'},{t:'coil',name:'T1 (3초)'}]);
    L.rung(470,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);
  }});

// 미션 13-1·2·3: 전기 회로는 미션 1과 같고(PB1 → Y1), 공압 기기만 다르다
const m1elec=L=>{L.rung(170,[{t:'no',name:'PB1',act:'pb'},{t:'sol',name:'Y1'}]);};
sheet('m13a.svg',{w:560,h:760,names:['A'],seq:['A+','A-'],note:['후진만 느리게 (미터아웃)'],
  pneu:S=>{const c=cylinder(S,90,90,'A');valve(S,130,190,c,{sols:['Y1'],capDev:'fcv'});},elec:m1elec});
sheet('m13b.svg',{w:560,h:760,names:['A'],seq:['A+','A-'],note:['후진이 빨라짐 (급속배기)'],
  pneu:S=>{const c=cylinder(S,90,90,'A');valve(S,130,190,c,{sols:['Y1'],capDev:'qev'});},elec:m1elec});
sheet('m13c.svg',{w:560,h:760,names:['A'],seq:['A+','A-'],note:['공급 0.5 MPa','A 작동압력 0.3 MPa'],
  pneu:S=>{const c=cylinder(S,90,90,'A');valve(S,130,170,c,{sols:['Y1'],supplyDev:'prv'});},elec:m1elec});

// 미션 14: 오류 찾기. 전기회로도에 일부러 틀린 곳이 하나씩 있다 (도면에는 표시하지 않음. 정답은 missions.js의 quiz)
// 14-1: 미션 4 자기유지. 틀린 곳 = K1 자기유지 접점이 NC
sheet('m14a.svg',{w:560,h:760,names:['A'],seq:['A+','A-'],note:['PB1: 전진 (손을 떼도 유지)','PB2: 후진'],
  pneu:S=>{const c=cylinder(S,90,90,'A');valve(S,130,190,c,{sols:['Y1']});},
  elec:L=>{
    L.rung(140,[{t:'nc',name:'PB2',act:'pb'},{t:'no',name:'PB1',act:'pb',hold:'K1',holdT:'nc'},{t:'coil',name:'K1'}]);
    L.rung(300,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);
  }});
// 14-2: 미션 5 리밋 자동 후진. 틀린 곳 = 자기유지를 끊는 리밋이 LS2(전진 끝) 대신 LS1(후진 끝)
sheet('m14b.svg',{w:560,h:760,names:['A'],seq:['A+','A-'],
  pneu:S=>{const c=cylinder(S,90,90,'A',[{end:'-',name:'LS1',kind:'ls'},{end:'+',name:'LS2',kind:'ls'}]);valve(S,130,190,c,{sols:['Y1']});},
  elec:L=>{
    L.rung(140,[{t:'nc',name:'LS1',act:'ls'},{t:'no',name:'PB1',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(300,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);
  }});
// 14-3: 미션 8 시퀀스. 틀린 곳 = K4 줄의 K3 접점이 K2로 적힘
sheet('m14c.svg',{w:780,h:820,names:['A','B'],seq:['A+','B+','B-','A-'],
  pneu:S=>{
    const a=cylinder(S,60,90,'A',[{end:'+',name:'S1',kind:'cap'}]);valve(S,100,190,a,{sols:['Y1']});
    const b=cylinder(S,420,90,'B',[{end:'+',name:'LS1',kind:'ls'},{end:'-',name:'LS2',kind:'ls'}]);valve(S,460,190,b,{sols:['Y2']});
  },
  elec:L=>{
    L.rung(110,[{t:'nc',name:'K4'},{t:'no',name:'PB1',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(230,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);
    L.sensor(320,'S1',380);L.rung(380,[{t:'coil',name:'K2'}],{fromY:L.Y[1]});
    L.rung(470,[{t:'no',name:'K1'},{t:'no',name:'K2'},{t:'nc',name:'K3'},{t:'sol',name:'Y2'}]);
    L.rung(570,[{t:'no',name:'K1'},{t:'no',name:'LS1',act:'ls',hold:'K3'},{t:'coil',name:'K3'}]);
    L.rung(710,[{t:'no',name:'K2'},{t:'no',name:'LS2',act:'ls'},{t:'coil',name:'K4'}]);
  }});
// 14-4: 미션 11 타이머. 틀린 곳 = K1을 끊는 접점이 T1 한시 접점 대신 LS2
sheet('m14d.svg',{w:580,h:760,names:['A'],seq:['A+','wait:3초','A-'],
  pneu:S=>{const c=cylinder(S,90,90,'A',[{end:'+',name:'LS2',kind:'ls'}]);valve(S,130,190,c,{sols:['Y1']});},
  elec:L=>{
    L.rung(140,[{t:'nc',name:'LS2',act:'ls'},{t:'no',name:'PB1',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(320,[{t:'no',name:'LS2',act:'ls'},{t:'coil',name:'T1 (3초)'}]);
    L.rung(470,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);
  }});

/* ---------- 유압 미션 H1~H10 (직접 만든 회로) ---------- */
const pbY=L=>{L.rung(170,[{t:'no',name:'PB1',act:'pb'},{t:'sol',name:'Y1'}]);};
const pbYY=L=>{L.rung(150,[{t:'no',name:'PB1',act:'pb'},{t:'sol',name:'Y1'}]);L.rung(330,[{t:'no',name:'PB2',act:'pb'},{t:'sol',name:'Y2'}]);};
const HS={w:560,h:910,hyd:true};
sheet('h1.svg',{...HS,names:['A'],seq:['A+','A-'],note:['PB1을 누르는 동안 전진','릴리프 4.0 MPa'],
  pneu:S=>hyd(S,110,90,{name:'A',valve:'42',sols:['Y1']}),elec:pbY});
sheet('h2.svg',{...HS,names:['A'],seq:[],note:['PB1을 누르는 동안 전진, PB2를 누르는 동안 후진','둘 다 떼면 그 자리에 정지 (중립 올 포트 블록)'],
  pneu:S=>hyd(S,110,90,{name:'A',valve:'43c',sols:['Y1','Y2']}),elec:pbYY});
sheet('h3.svg',{...HS,names:['M'],seq:[],note:['PB1을 누르는 동안 정회전 (A → B)','PB2를 누르는 동안 역회전 (B → A)','떼면 정지'],
  pneu:S=>hyd(S,110,90,{act:'motor',name:'M',valve:'43c',sols:['Y1','Y2']}),elec:pbYY});
sheet('h4.svg',{...HS,names:['A'],seq:['A+','A-'],note:['전진만 느리게 (미터인, F1 3단)','펌프 토출구 체크밸브'],
  pneu:S=>hyd(S,110,90,{name:'A',valve:'42',sols:['Y1'],capDev:'fcvin:미터인',supply:'chk'}),elec:pbY});
sheet('h5.svg',{...HS,names:['A'],seq:['A+','A-'],
  pneu:S=>hyd(S,110,90,{name:'A',valve:'42',sols:['Y1'],sensors:[{end:'+',name:'LS2',kind:'ls'}]}),
  elec:L=>{L.rung(140,[{t:'nc',name:'LS2',act:'ls'},{t:'no',name:'PB1',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);L.rung(300,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);}});
sheet('h6.svg',{...HS,names:['A'],seq:['A+','A-'],note:['전진·후진 모두 느리게 (블리드오프, F1 6단)'],
  pneu:S=>hyd(S,170,90,{name:'A',valve:'42',sols:['Y1'],supply:'bleed'}),elec:pbY});
sheet('h7.svg',{...HS,names:['A'],seq:['A+','A-'],note:['A 작동압력 2.0 MPa (감압)','릴리프 4.0 MPa'],
  pneu:S=>hyd(S,110,90,{name:'A',valve:'42',sols:['Y1'],capDev:'hprv:감압 2.0 MPa'}),elec:pbY});
sheet('h8.svg',{...HS,names:['A'],seq:['A+','A-'],note:['PS1 3.0 MPa'],
  pneu:S=>hyd(S,110,90,{name:'A',valve:'42',sols:['Y1'],capDev:'psw:PS1'}),
  elec:L=>{L.rung(140,[{t:'nc',name:'PS1',act:'ps'},{t:'no',name:'PB1',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);L.rung(300,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);}});
sheet('h9.svg',{...HS,names:['A'],seq:[],note:['PB1을 누르는 동안 전진(하중이 내려감), PB2를 누르는 동안 후진','떼면 그 자리에 정지 — 하중이 제 무게로 내려가지 않게 (카운터밸런스 2.0 MPa)'],
  pneu:S=>hyd(S,110,90,{act:'cylw',name:'A',valve:'43a',sols:['Y1','Y2'],rodDev:'cbv:카운터밸런스'}),elec:pbYY});
sheet('h10.svg',{...HS,names:['A'],seq:[],note:['PB1을 누르는 동안 전진, PB2를 누르는 동안 후진','떼면 그 자리에 고정, 펌프를 꺼도 그대로 (로킹 회로)'],
  pneu:S=>hyd(S,110,90,{act:'cylw',name:'A',valve:'43a',sols:['Y1','Y2'],lock:true}),elec:pbYY});
sheet('h11.svg',{...HS,w:780,names:['A'],seq:['A+','wait:3초','A-'],note:['A+ 끝(LS2)에서 모터 M 정회전','3초 뒤 A− (모터 정지)'],
  pneu:S=>{const a=hyd(S,110,90,{name:'A',valve:'42',sols:['Y1'],sensors:[{end:'+',name:'LS2',kind:'ls'}]});
    hyd(S,470,90,{act:'motor',name:'M',valve:'43c',sols:['Y2','Y3'],feed:{x:a.ax,y:a.py}});},
  elec:L=>{
    L.rung(130,[{t:'nc',name:'T1',timed:true},{t:'no',name:'PB1',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(300,[{t:'no',name:'K1'},{t:'sol',name:'Y1'}]);
    L.rung(440,[{t:'no',name:'LS2',act:'ls'},{t:'coil',name:'T1 (3초)'}]);
    const jy=L.Y[0]+34;L.bus(440,600,jy);L.rung(600,[{t:'sol',name:'Y2'}],{fromY:jy,dot:true});   // LS2 NO 아래에서 갈라져 Y2(모터)도
  }});
sheet('h12.svg',{...HS,w:660,h:990,elecH:360,names:['A'],seq:['A+','A-'],note:['PB2: 연속 반복','비상정지 ON: 후진 + H1 점등','비상정지 OFF: 초기화'],
  pneu:S=>hyd(S,110,90,{name:'A',valve:'42',sols:['Y1'],sensors:[{end:'-',name:'LS1',kind:'ls'},{end:'+',name:'LS2',kind:'ls'}]}),
  elec:L=>{
    const busY=L.top+80, slots=[L.top+130,L.top+200,L.top+270];
    L.drop(90,{t:'nc',name:'ES',act:'es'},busY);L.bus(90,480,busY);
    L.rung(170,[{t:'no',name:'PB2',act:'pb',hold:'K1'},{t:'coil',name:'K1'}],{fromY:busY,slots,dot:true});
    L.rung(320,[{t:'nc',name:'LS2',act:'ls'},{t:'no',name:'K1',hold:'K2',span:2},{t:'no',name:'LS1',act:'ls'},{t:'coil',name:'K2'}],{fromY:busY,slots,dot:true});
    L.rung(480,[{t:'no',name:'K2'},{t:'sol',name:'Y1'}],{fromY:busY,slots,dot:true});
    L.rung(590,[{t:'no',name:'ES',act:'es'},{t:'lamp',name:'H1'}],{slots});
  }});
sheet('h13.svg',{...HS,w:780,names:['A'],seq:['A+','A-','A+','A-','A+','A-'],note:['PB2: 3회 후 정지','PB3: 카운터 리셋'],
  pneu:S=>hyd(S,110,90,{name:'A',valve:'42',sols:['Y1'],sensors:[{end:'-',name:'LS1',kind:'ls'},{end:'+',name:'LS2',kind:'ls'}]}),
  elec:L=>{
    L.rung(120,[{t:'nc',name:'C1'},{t:'no',name:'PB2',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(290,[{t:'nc',name:'LS2',act:'ls'},{t:'no',name:'K1',hold:'K2',span:2},{t:'no',name:'LS1',act:'ls'},{t:'coil',name:'K2'}]);
    L.rung(440,[{t:'no',name:'K2'},{t:'sol',name:'Y1'}]);
    L.rung(560,[{t:'no',name:'LS2',act:'ls'},{t:'coil',name:'C1 (3회)'}]);
    L.rung(690,[{t:'no',name:'PB3',act:'pb'},{t:'coil',name:'C1 리셋'}]);
  }});
sheet('h14.svg',{...HS,w:580,names:['A'],seq:['A+','A-'],note:['PB2: 연속 반복','PB3: 사이클 끝에서 정지'],
  pneu:S=>hyd(S,110,90,{name:'A',valve:'42',sols:['Y1'],sensors:[{end:'-',name:'LS1',kind:'ls'},{end:'+',name:'LS2',kind:'ls'}]}),
  elec:L=>{
    L.rung(130,[{t:'nc',name:'PB3',act:'pb'},{t:'no',name:'PB2',act:'pb',hold:'K1'},{t:'coil',name:'K1'}]);
    L.rung(300,[{t:'nc',name:'LS2',act:'ls'},{t:'no',name:'K1',hold:'K2',span:2},{t:'no',name:'LS1',act:'ls'},{t:'coil',name:'K2'}]);
    L.rung(470,[{t:'no',name:'K2'},{t:'sol',name:'Y1'}]);
  }});
