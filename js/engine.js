/* ===================== 시뮬레이션 엔진 (순수 함수) =====================
   화면(DOM)에 전혀 기대지 않는다. 브라우저에서는 전역 함수로, Node에서는 module.exports로 쓴다.
   매 프레임 stepWorld: 전기 회로 계산 → 밸브 상태 → 실린더 이동 → 센서 갱신(다음 프레임 전기 계산에 반영)
   부품마다의 동작 규칙은 js/parts/*.js가 PARTS에 등록한다. 엔진은 배치된 부품 목록만 보고 계산한다. */
const STROKE_T=1.0;       // 실린더 전체 행정 시간(초)
const CYL_TYPES={cylinder:1,cylw:1};   // 실린더 종류 (포트 <id>_cap / <id>_rod, 위치 w.cyl)

/* 부품 종류 라이브러리. PARTS[종류] 에 들어갈 수 있는 동작 규칙(모두 선택):
   rails(p)            → {r24:[잭], r0:[잭]}  모듈의 +24V/0V 레일 잭. 모듈 안에서만 서로 이어져 있다.
                       supply:true인 부품(전원 모듈)의 레일만 실제 +24V/0V이고, 다른 모듈은 선(기본 전원 선)으로 받아야 한다
   pbs(p)              → ['PB1',...]           누름버튼 이름 (누르는 동안만 켜짐)
   toggles(p)          → ['ES',...]            유지형 스위치 이름 (누르면 켜진 채로, 다시 누르면 꺼짐). 상태는 누름버튼과 같이 w.pb에
   elec(p,w,u,all)     전기 회로 연결 (접점). all=true면 모든 접점을 닫은 것으로 본다(배선 색 검사용)
   loads(p)            → [{name,a,b,sol?}]     전기 부하(램프·솔레노이드). name이 w.out의 키
   init(p,w)           월드 상태 초기값 (밸브 위치, 실린더 위치, 릴레이 상태)
   update(p,w,on,e,dt) 부하 여자 상태(on[name])로 밸브 위치·릴레이 접점 결정 (다음 계산부터 반영 = 릴레이의 짧은 지연)
                       e.hot(잭)/e.gnd(잭)로 잭이 +24V/0V에 이어졌는지도 볼 수 있다 (센서 전원)
   pneu(p,w,u)         공압·유압 경로 연결. 공급 'SUP', 배기 'EX' (유압은 펌프 = SUP, 탱크로 돌아가는 포트 = EX)
   source(p,w)         → 공급 압력(MPa). 서비스 유닛(공압) 설정 SU, 파워유닛(유압) 릴리프 설정 RV. fluid:'hyd'면 유압 판
   move(p,w,P,E,dt,pn) P(포트)=공급압 걸림, E(포트)=배기로 열림 → 액추에이터 이동.
                       pn.flow(공급 포트, 배기 포트) → {k:속도 배율, meter:'out'|'in'|''}, pn.press(포트) → 압력(MPa)
   dev(p,w)            공압 기기: {kind:'fcv'|'qev'|'prv', a:1차(밸브 쪽) 포트, b:2차(실린더 쪽) 포트, k:조임 배율, set:2차 압력}
                       fcv(일방향 유량조절) a→b 자유, b→a 조임 / qev(급속배기) b 쪽 배기를 그 자리에서 / prv(감압) b 쪽 압력 = min(공급, set)
                       chk(체크밸브) a→b만 흐름 (거꾸로 흐르려 하면 막힘), pocv(파일럿 체크: pilot 포트에 압력이 있으면 거꾸로도),
                       cbv(카운터밸런스: 실린더 반대쪽 포트 압력이 set 이상이면 거꾸로도), thr(양방향 조임, 공급↔탱크 사이면 블리드오프),
                       pipe(그냥 통과: 압력스위치 블록). dev는 배열을 돌려줘도 된다 (로크밸브: 체크 2개)
   sense(p,w)          실린더 위치로 센서·리밋스위치 감지 상태(w.sensor[이름]) 결정
   그 밖의 속성: solCount(솔레노이드 수), relayCount(릴레이 수), span(랙에서 차지하는 칸 수),
                 tag·tagCount(이름 붙이기: 타이머 'T' → T1, 카운터 'C' → C1), settings(p) → {이름:{기본값,최소,최대,간격}}
   사용자가 맞추는 설정값(타이머 초, 카운터 횟수)은 회로와 함께 c.set에 저장되고 w.set으로 읽는다 */
const PARTS={};

let LAYOUT={parts:[],rail24:[],rail0:[],buses:[],pbs:[],toggles:[],loads:[],settings:{},fluid:'air'};
function configure(layout){
  const parts=layout.parts||[];
  const each=(k,f)=>parts.forEach(p=>{const d=PARTS[p.type];if(d&&d[k])f(d[k](p),p);});
  const rail24=[],rail0=[],buses=[],pbs=[],toggles=[],loads=[];
  each('rails',(r,p)=>{
    if(PARTS[p.type].supply){rail24.push(...r.r24);rail0.push(...r.r0);}
    else buses.push(r.r24,r.r0);
  });
  each('pbs',r=>pbs.push(...r));
  each('toggles',r=>toggles.push(...r));
  each('loads',r=>loads.push(...r));
  const settings={};each('settings',r=>Object.assign(settings,r));
  const fluid=parts.some(p=>PARTS[p.type]&&PARTS[p.type].fluid==='hyd')?'hyd':'air';   // 유압 파워유닛이 있으면 유압 판
  LAYOUT={parts,rail24,rail0,buses,pbs,toggles,loads,settings,fluid};
}
// 배치 데이터(layouts.js) + 자리별 선택(board)으로 부품 목록을 만든다.
// 랙은 줄(row)마다 왼쪽부터 칸(col)을 채운다. 솔레노이드 Y1…, 릴레이 K1…는 놓인 순서대로 이름을 붙인다
function makeParts(def,board){
  const parts=[],n={Y:0,K:0};
  const names=(type,p)=>{
    p.sols=[];for(let k=0;k<(PARTS[type].solCount||0);k++)p.sols.push('Y'+(++n.Y));
    p.relays=[];for(let k=0;k<(PARTS[type].relayCount||0);k++)p.relays.push('K'+(++n.K));
    const t=PARTS[type].tag;p.tags=[];if(t)for(let k=0;k<(PARTS[type].tagCount||1);k++){n[t]=(n[t]||0)+1;p.tags.push(t+n[t]);}
  };
  let i=0;
  def.rack.forEach((row,r)=>{let col=0;row.forEach(m=>{
    const p=Object.assign({},m,{id:'RK'+i,rack:i,row:r,col,span:PARTS[m.type].span||1});
    names(m.type,p);parts.push(p);col+=p.span;i++;
  });});
  const stacks={};
  def.slots.forEach(s=>{
    if(s.sensor){
      // 센서 자리: board 값은 붙일 위치 "A+"(실린더 A 전진 끝) / "A-"(후진 끝)
      const m=/^(\w+)([+-])$/.exec(board[s.slot]||'');if(!m)return;
      const cyl=def.slots.find(x=>x.id===m[1]);
      const stack=stacks[board[s.slot]]=(stacks[board[s.slot]]||0)+1;   // 같은 끝에 여러 개면 옆으로 비켜 그림
      parts.push({type:s.sensor,id:s.id,slot:s.slot,cyl:m[1],end:m[2],cylAt:cyl&&cyl.at,stack:stack-1,sols:[],relays:[],tags:[]});
      return;
    }
    const type=s.fixed||board[s.slot];if(!type)return;
    const p={type,id:(s.ids&&s.ids[type])||s.id,slot:s.slot,at:s.at};   // ids: 종류마다 다른 이름 (예: 모터는 M)
    names(type,p);parts.push(p);
  });
  return parts;
}
// 기본 전원 선(배치 데이터 jumpers): 전원 모듈에서 각 모듈 레일로 미리 꽂혀 있는 선. 지울 수 있고, 배선 초기화하면 다시 생긴다
function defaultJumpers(def){
  return (def.jumpers||[]).map(([a,b],k)=>({id:'p'+(k+1),a,b,color:a.startsWith('R0')?'blue':'red',base:true}));
}
// 회로에 기본 전원 선이 하나도 없으면(예전에 저장된 배선) 넣어 준다
function withJumpers(def,c){
  if(c.pw)return c;
  return Object.assign({},c,{wires:defaultJumpers(def).concat(c.wires),pw:1});
}
// 레일 잭 개수: 1칸 모듈 3개, 2칸 모듈(스위치·릴레이) 6개
function railCount(span){return span>1?6:3;}
function rackRails(i,span){const r24=[],r0=[];for(let k=0;k<railCount(span);k++){r24.push(`R24_${i}_${k}`);r0.push(`R0_${i}_${k}`);}return{r24,r0};}

// c접점 count개(n=1…): on이면 n1-n4(NO), 아니면 n1-n2(NC)가 이어진다. all=true면 둘 다 (배선 색 검사용)
function cContacts(u,id,count,on,all){for(let n=1;n<=count;n++){if(all||on)u.u(id+'_'+n+'1',id+'_'+n+'4');if(all||!on)u.u(id+'_'+n+'1',id+'_'+n+'2');}}
function UF(){const p=new Map();const f=x=>{if(!p.has(x))p.set(x,x);let r=x;while(p.get(r)!==r)r=p.get(r);let c=x;while(p.get(c)!==r){const n=p.get(c);p.set(c,r);c=n;}return r;};return{f,u:(a,b)=>{const A=f(a),B=f(b);if(A!==B)p.set(A,B);},same:(a,b)=>f(a)===f(b)};}
function partsWith(k){return LAYOUT.parts.filter(p=>PARTS[p.type]&&PARTS[p.type][k]);}

function solveElec(w,allClosed){
  const u=UF();
  LAYOUT.rail24.forEach(j=>u.u(j,'+24')); LAYOUT.rail0.forEach(j=>u.u(j,'0V'));
  LAYOUT.buses.forEach(g=>g.forEach(j=>u.u(j,g[0])));   // 각 모듈 레일은 모듈 안에서만 이어짐
  w.wires.forEach(x=>u.u(x.a,x.b));
  partsWith('elec').forEach(p=>PARTS[p.type].elec(p,w,u,allClosed));
  const short=u.same('+24','0V');
  const hot=id=>u.same(id,'+24'), gnd=id=>u.same(id,'0V');
  const on={};
  LAYOUT.loads.forEach(l=>{on[l.name]=!!(w.power&&!short&&((hot(l.a)&&gnd(l.b))||(gnd(l.a)&&hot(l.b))));});
  return{short,on,hot,gnd};
}
// 공압·유압 경로. 기기를 뺀 연결(u0)로 "기기 어느 쪽 포트가 실린더 쪽인지"를 알고, 기기를 넣은 연결로 실제 흐름을 본다
// 기기(dev) 종류: 늘 통함(fcv·qev·pipe) / thr(양방향 조임: 공급과 탱크 사이에 끼우면 블리드오프) /
//   한방향(chk·pocv·cbv: a→b만. pocv는 파일럿 포트에, cbv는 실린더 반대쪽 포트에 압력이 있으면 거꾸로도 통함) /
//   prv(감압: 1차 쪽에 공급이 있어야 지나감. rev면 거꾸로 돌아오는 기름은 그냥 지나감)
const MIN_P=0.1;   // 이보다 낮은 압력(MPa)이면 실린더가 움직이지 않음
const DEV_PIPE=new Set(['fcv','qev','pipe']), DEV_DIR=new Set(['chk','pocv','cbv']);
function solvePneu(w){
  const base=()=>{const u=UF();partsWith('pneu').forEach(p=>PARTS[p.type].pneu(p,w,u));w.hoses.forEach(h=>u.u(h.a,h.b));return u;};
  const devs=partsWith('dev').flatMap(p=>[].concat(PARTS[p.type].dev(p,w)));
  const src=partsWith('source')[0];
  const main=w.air?(src?PARTS[src.type].source(src,w):0.5):0;
  // 1) 늘 통하는 기기만 넣고 각 포트가 공급(S)·배기(E)·그 밖(N) 어디에 이어졌는지 본다
  const uc=base();devs.filter(d=>DEV_PIPE.has(d.kind)).forEach(d=>uc.u(d.a,d.b));
  const side=id=>uc.same(id,'SUP')?'S':uc.same(id,'EX')?'E':'N';
  const thr=devs.filter(d=>d.kind==='thr');
  const bleed=thr.filter(d=>{const a=side(d.a),b=side(d.b);return (a==='S'&&b==='E')||(a==='E'&&b==='S');});   // 블리드오프: 잇지 않고 속도만 줄임
  const thrOn=thr.filter(d=>!bleed.includes(d));thrOn.forEach(d=>uc.u(d.a,d.b));
  // 2) 한방향 기기: 정방향(a→b)으로 흐를 자리면 통함. 거꾸로는 파일럿 조건이 맞을 때만
  const pre=id=>uc.same(id,'SUP')?main:0;
  const fwd=d=>{const a=side(d.a),b=side(d.b);return !((b==='S'&&a!=='S')||(a==='E'&&b!=='E'));};
  const other=id=>{for(const p of LAYOUT.parts){if(!(p.type in CYL_TYPES))continue;const c=p.id+'_cap',r=p.id+'_rod';if(uc.same(id,c))return r;if(uc.same(id,r))return c;}return null;};
  const pilot=d=>d.kind==='pocv'?d.pilot.some(x=>pre(x)>=MIN_P):d.kind==='cbv'?(o=>o!=null&&pre(o)>=d.set)(other(d.b)):false;
  const dirOn=devs.filter(d=>DEV_DIR.has(d.kind)&&(fwd(d)||pilot(d)));
  const pass=devs.filter(d=>DEV_PIPE.has(d.kind)).concat(thrOn,dirOn);
  const u0=base(), u1=base();pass.forEach(d=>u1.u(d.a,d.b));
  const prvOn=devs.filter(d=>d.kind==='prv'&&u1.same(d.a,'SUP'));   // 감압밸브는 1차 쪽에 공급이 있어야 지나감
  const prvRev=devs.filter(d=>d.kind==='prv'&&d.rev&&!prvOn.includes(d)&&u1.same(d.a,'EX'));   // 내장 체크: 돌아오는 기름
  const u=base();pass.concat(prvOn,prvRev).forEach(d=>u.u(d.a,d.b));
  const leak=w.air&&u.same('SUP','EX');
  const press=id=>{
    if(!w.air||leak)return 0;
    if(u1.same(id,'SUP'))return main;
    const d=prvOn.find(d=>u1.same(id,d.b));return d?Math.min(main,d.set):0;
  };
  const P=id=>press(id)>=MIN_P, E=id=>u.same(id,'EX');
  const flow=(sup,exh)=>{
    let k=1,meter='';
    devs.forEach(d=>{
      if(d.kind==='fcv'){
        if(u0.same(d.b,exh)){k*=d.k;meter='out';}        // 실린더에서 나가는 공기가 2→1(조임): 미터아웃
        else if(u0.same(d.a,sup)){k*=d.k;meter='in';}    // 실린더로 들어가는 공기가 2→1(조임): 미터인
      }
      if(d.kind==='thr'&&thrOn.includes(d)){               // 양방향 조임: 어느 쪽으로 지나가든 조임
        if(u0.same(d.a,sup)||u0.same(d.b,sup)){k*=d.k;meter='in';}
        else if(u0.same(d.a,exh)||u0.same(d.b,exh)){k*=d.k;meter='out';}
      }
      if(d.kind==='qev'&&u0.same(d.b,exh))k*=1.8;       // 실린더 쪽(A)에서 바로 배기 → 빨라짐
    });
    if(bleed.length&&u.same(sup,'SUP')){bleed.forEach(d=>k*=Math.max(.1,1-.9*d.k));meter='bleed';}   // 많이 열수록 탱크로 새는 기름이 많아 느려짐
    return{k,meter};
  };
  return{leak,P,E,press,flow,main,same:(a,b)=>u.same(a,b)};
}
function newWorld(c){
  const w={wires:c.wires,hoses:c.hoses,set:{},power:false,air:false,t:0,pb:{},relay:{},timer:{},counter:{},modPow:{},meter:{},cylP:{},cylSup:{},cyl:{},motor:{},valve:{},sensor:{},sensorPow:{},out:{leak:false},events:[]};
  for(const k in LAYOUT.settings)w.set[k]=(c.set&&k in c.set)?c.set[k]:LAYOUT.settings[k].def;
  LAYOUT.pbs.concat(LAYOUT.toggles).forEach(id=>w.pb[id]=false); LAYOUT.loads.forEach(l=>w.out[l.name]=false);
  partsWith('init').forEach(p=>PARTS[p.type].init(p,w));
  partsWith('sense').forEach(p=>PARTS[p.type].sense(p,w));
  return w;
}
function stepWorld(w,dt){
  let e=solveElec(w,false);
  if(e.short&&w.power){w.power=false;w.events.push('short');e=solveElec(w,false);}
  partsWith('update').forEach(p=>PARTS[p.type].update(p,w,e.on,e,dt));
  const pn=solvePneu(w);
  partsWith('move').forEach(p=>PARTS[p.type].move(p,w,pn.P,pn.E,dt,pn));
  partsWith('sense').forEach(p=>PARTS[p.type].sense(p,w));
  w.out=Object.assign({leak:pn.leak},e.on);
  w.supP=pn.leak?0:pn.main;   // 압력계에 보일 공급 압력
  w.t+=dt;
}
// 랙 모듈 자체에 전원(자기 레일에 24V/0V)이 들어와 있는지. 타이머·카운터처럼 전자식 모듈이 쓴다
function modulePowered(p,w,e){const r=rackRails(p.rack);return w.modPow[p.id]=!!(w.power&&e.hot(r.r24[0])&&e.gnd(r.r0[0]));}
// 실린더 위치 → 끝 표시: "+"(전진 끝) "-"(후진 끝) ""(중간)
function cylEnd(v){return v>.95?'+':v<.05?'-':'';}
// 버튼·전원 등을 sets대로 맞춘 뒤 dur초 동안 진행
function run(w,sets,dur){Object.keys(sets).forEach(k=>{if(k in w.pb)w.pb[k]=sets[k];else w[k]=sets[k];});for(let t=0;t<dur;t+=0.02)stepWorld(w,0.02);return w;}
function clone(c){return{wires:c.wires.map(x=>({...x})),hoses:c.hoses.map(x=>({...x})),set:Object.assign({},c.set)};}

if(typeof module!=='undefined')module.exports={STROKE_T,PARTS,cContacts,defaultJumpers,withJumpers,configure,makeParts,rackRails,UF,solveElec,solvePneu,newWorld,stepWorld,run,clone,cylEnd};
