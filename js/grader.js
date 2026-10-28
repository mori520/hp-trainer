/* ===================== 채점 =====================
   엔진(stepWorld)을 화면 없이 돌려 동작 결과로 채점한다. 정답 배선과 비교하지 않는다.
   gradeMission(미션, 회로) → [{name, ok, detail, bad?, moves?}]

   미션 데이터의 "grading" 형식 (둘 중 하나):
   1) 단계 검사 — 버튼을 누르고 떼며 그때그때 결과를 본다
      {"setup":{"power":true,"air":true}, "repeat":2,
       "steps":[{"name":"…","set":{"PB1":true},"wait":2,"expect":{"A":"+","H1":true},"hint":"틀렸을 때 안내"}]}
      set: 버튼을 그 상태로 두고 wait초 / tap: "PB1"이면 0.2초 눌렀다 뗀 뒤 wait초
      expect: 램프·솔레노이드·릴레이 이름 → true/false, 실린더 이름 → "+"(전진 끝) / "-"(후진 끝)
      그 단계 동안의 움직임(실린더가 끝에 닿은 순서)도 볼 수 있다:
        "moves":["A+","A-"]  정확히 이 순서 ([]이면 움직이지 않아야 함)
        "movesRepeat":["A+","A-"], "minCycles":2  이 순서를 계속 되풀이 (연속동작), 기본 2회 이상
        "stroke":{"cyl":"A","dir":"-","min":1.5}   그 단계에서 A가 후진하는 데 걸린 시간(초) 1.5초 이상 (max도 가능)
        "meter":{"A":"out"}   마지막 움직임이 미터아웃이었는지 ("in" = 미터인, "bleed" = 블리드오프)
        "pressureAt":{"A":[0.25,0.35]}   A가 움직일 때 공급 압력(MPa) 범위
      "settingsCheck":[{"name":"SU","min":0.45,"max":0.55,"label":"…"}]   설정값 범위 검사 (서비스 유닛 압력 등)
   2) 변위단계선도 — 버튼을 한 번 눌렀다 떼고, 실린더가 끝에 닿는 순서를 기록해 비교한다
      {"press":"PB1", "sequence":["A+","B+","A-","B-"], "repeat":2, "timeout":20}
      유압모터는 돌기 시작·멈춤이 한 칸: "M+"(정회전) "M-"(역회전) "M0"(정지). 예 ["A+","M+","M0","A-"]
      ("moves"·"movesRepeat"에도 같은 이름이 들어간다)
      "dwell":{"after":"A+","sec":3,"tol":0.5} 을 더하면 A+에 닿은 뒤 다음 움직임이 시작될 때까지의 시간(타이머)도 검사한다
   expect에 카운터 이름과 숫자를 쓰면 센 값을 본다 (예: "C1":0)
   합선, 배선 색은 항상 검사하고, 공기를 쓰면 공기 누설도 검사한다. repeat가 2 이상이면 "2회 반복" 항목이 붙는다.
   두 형식 모두 "relayCount": 5 를 적으면 코일 양쪽(A1·A2)이 배선된 릴레이 수를 검사한다 (시험: 릴레이 개수 변경 금지). */
const TWICE='2회 반복해도 동일하게 동작';
const TAP=0.2;   // "잠깐 누르기" 시간(초)

// 합선: 누름버튼 모든 조합(릴레이 꺼짐)을 검사하고, 채점 동작 중에 생긴 합선(runShort)도 합친다
function chkShort(c,runShort){
  const w=newWorld(clone(c));w.power=true;let s=!!runShort;
  const pbs=LAYOUT.pbs.concat(LAYOUT.toggles);   // 누름버튼·유지형 스위치를 누르고 뗀 모든 조합
  for(let m=0;m<(1<<pbs.length);m++){pbs.forEach((pb,k)=>w.pb[pb]=!!(m&(1<<k)));if(solveElec(w,false).short)s=true;}
  return{name:'합선 없음',ok:!s,detail:s?'+24V와 0V가 곧바로 이어지는 경로가 있습니다. 실제 시험에서는 즉시 전원을 차단해야 합니다.':''};
}
// 모듈 전원: 사용자가 그 모듈의 레일 잭에 선을 꽂았거나, 전원이 필요한 모듈(타이머·카운터)을 썼는데
// 그 모듈 레일에 24V/0V가 안 들어가 있으면 알려 준다 (문제 없으면 항목 없음)
function chkModulePower(c){
  const w=newWorld(clone(c)),e=solveElec(w,false);
  const userJ=new Set();c.wires.filter(x=>!x.base).forEach(x=>{userJ.add(x.a);userJ.add(x.b);});
  const bad=[];
  LAYOUT.parts.forEach(p=>{
    const d=PARTS[p.type];if(!d.rails||d.supply)return;
    const r=d.rails(p);if(e.hot(r.r24[0])&&e.gnd(r.r0[0]))return;
    const onRail=r.r24.concat(r.r0).some(j=>userJ.has(j));
    const needs=d.needsPower&&[...userJ].some(j=>p.tags.some(t=>j.startsWith(t+'_')));
    if(onRail||needs)bad.push(d.label(p));
  });
  return bad.length?{name:'모듈 전원 연결',ok:false,detail:`${bad.join(', ')}에 24V/0V가 연결되지 않았어요. 배선 초기화를 하면 기본 전원 선이 다시 생겨요.`}:null;
}
function chkRelayCount(c,n){
  const wired=id=>c.wires.some(x=>x.a===id||x.b===id);
  const used=LAYOUT.loads.filter(l=>l.coil&&wired(l.a)&&wired(l.b)).map(l=>l.name);
  return{name:`릴레이 ${n}개 사용 (개수 변경 금지)`,ok:used.length===n,
    detail:used.length===n?'':`지금 코일이 배선된 릴레이는 ${used.length}개${used.length?` (${used.join(', ')})`:''}입니다.`};
}
function chkColor(c){
  const w=newWorld(clone(c));const e=solveElec(w,true);
  const bad=c.wires.filter(x=>{const h=e.hot(x.a),g=e.gnd(x.a);if(h&&g)return false;if(h)return x.color!=='red';if(g)return x.color==='red';return false;});
  return{name:'배선 색 규칙 (+ 적색, − 청색/흑색)',ok:bad.length===0,detail:bad.length?`${bad.length}개 선의 색이 규칙과 다릅니다. 깜박이는 선을 확인하세요.`:'',bad:bad.map(x=>x.id)};
}
function chkLeak(leak){const f=fluidText();return{name:f.leak,ok:!leak,detail:leak?f.leakDetail:''};}

const endOf=cylEnd;
// 기대 상태 하나 확인 (채점과 튜토리얼이 같이 쓴다)
// 실린더 → "+"/"-"(중간이면 ""), 유압모터 → "+"/"-"/"0", 램프·솔레노이드·릴레이 코일 → 켜짐 여부, 센서·리밋스위치 → 감지 여부,
// 누름버튼 → 눌림 여부, power/air → 켜짐 여부
function expectOk(w,key,val){
  if(typeof val==='number'&&key in w.counter)return w.counter[key].n===val;   // 카운터 이름 → 센 값 (예: "C1":0)
  if(key in w.cyl)return endOf(w.cyl[key])===val;
  if(w.motor&&key in w.motor)return motorState(w.motor[key])===val;   // 유압모터 → "+"(정회전) "-"(역회전) "0"(정지)
  if(key in w.out)return w.out[key]===val;
  if(key in w.sensor)return w.sensor[key]===val;
  if(key in w.pb)return w.pb[key]===val;
  if(key==='power'||key==='air')return w[key]===val;
  return false;
}

// 단계 검사: 1회차 결과를 항목으로, 모든 회차가 통과해야 "2회 반복" 통과
// 단계 동안 기록한 움직임 검사. 통과면 ''(빈 문자열), 아니면 틀린 내용
function movesProblem(s,log){
  const real=log.length?fmtSeq(log):'움직임 없음';
  if(s.moves){
    if(log.join(' ')===s.moves.join(' '))return '';
    return s.moves.length?`기대: ${fmtSeq(s.moves)} / 실제: ${real}`:`움직이지 않아야 하는데 움직였습니다: ${real}`;
  }
  if(s.movesRepeat){
    const P=s.movesRepeat,min=s.minCycles||2;
    if(log.length>=P.length*min&&log.every((m,i)=>m===P[i%P.length]))return '';
    return `기대: ${fmtSeq(P)} 를 ${min}회 이상 되풀이 / 실제: ${real}`;
  }
  return '';
}
// 움직임 시간: 그 단계에서 st.cyl이 st.dir 끝에 닿기까지 걸린 시간 (떠난 순간부터)
function strokeProblem(st,tl){
  const name=(st.dir==='+'?'전진':'후진');
  const i=tl.map(x=>x.ev).lastIndexOf(st.cyl+st.dir);
  if(i<0)return `${name}이 끝까지 되지 않았어요`;
  let j=i-1;while(j>=0&&tl[j].ev!==st.cyl+'~')j--;
  if(j<0)return '';
  const dur=tl[i].t-tl[j].t, txt=`${name} ${dur.toFixed(1)}초`;
  if(st.min!=null&&dur<st.min)return `${txt} — 기대: ${st.min}초 이상 (느리게)`;
  if(st.max!=null&&dur>st.max)return `${txt} — 기대: ${st.max}초 이하 (빠르게)`;
  return '';
}
function stepExtraProblem(s,w,tl){
  if(s.stroke){const p=strokeProblem(s.stroke,tl);if(p)return p;}
  for(const k in s.meter||{}){
    const m=w.meter[k]||'';if(m===s.meter[k])continue;
    return m==='in'?'미터인 방식이에요. 유량조절밸브를 뒤집어 1번이 밸브 쪽, 2번이 실린더 쪽이 되게 끼우세요.':
      m==='out'?'미터아웃 방식이에요.':'유량조절밸브를 거치지 않았어요. 밸브와 실린더 사이 호스에 끼우세요.';
  }
  for(const k in s.pressureAt||{}){
    const [lo,hi]=s.pressureAt[k],v=w.cylP[k]||0;
    if(v<lo-1e-9||v>hi+1e-9)return `${k} 작동압력 ${v.toFixed(2)} MPa — 기대 ${lo}~${hi} MPa`;
  }
  return '';
}
function gradeSteps(g,c){
  const w=newWorld(clone(c));run(w,g.setup||{},0);
  const at={};for(const k in w.cyl)at[k]=endOf(w.cyl[k]);for(const k in w.motor)at[k]=motorState(w.motor[k]);
  let tl=[];
  const go=(sets,dur,log)=>{run(w,sets,0);recordMoves(w,dur,log,at,tl);};
  const items=[];let all=true,leak=false;
  for(let r=0;r<(g.repeat||1);r++)g.steps.forEach(s=>{
    const log=[];tl=[];tl.pos=Object.assign({},at);
    if(s.tap){go(Object.assign({},s.set,{[s.tap]:true}),TAP,log);go({[s.tap]:false},s.wait||0,log);}
    else go(s.set||{},s.wait||0,log);
    if(w.out.leak)leak=true;
    const mv=movesProblem(s,log)||stepExtraProblem(s,w,tl);
    const ok=!mv&&Object.keys(s.expect||{}).every(k=>expectOk(w,k,s.expect[k]));
    if(!ok)all=false;
    if(r===0)items.push({name:s.name,ok,detail:ok?'':[mv,s.hint].filter(Boolean).join(' — '),moves:log});
  });
  if((g.repeat||1)>=2)items.push({name:TWICE,ok:all});
  return{items,leak,short:w.events.includes('short')};
}

// 실린더가 끝에 닿을 때마다 "A+" / "A-"를, 유압모터가 돌기 시작하거나 멈출 때마다 "M+"(정회전) / "M-"(역회전) / "M0"(정지)를 log에 남기며 dur초 진행
// tl(시간 기록, 선택): 끝에 닿음 {ev:"A+",t}, 끝에서 떠남 {ev:"A~",t}. 모터는 돌기 시작할 때 {ev:"M~"}와 {ev:"M+"}, 멈추면 {ev:"M0"}
// tl.pos = 실린더마다 지금 끝("+"/"-"/"")
function recordMoves(w,dur,log,at,tl){
  for(let t=0;t<dur;t+=0.02){
    stepWorld(w,0.02);
    for(const k in w.cyl){
      const e=endOf(w.cyl[k]);
      if(e&&e!==at[k]){log.push(k+e);at[k]=e;if(tl)tl.push({ev:k+e,t:w.t});}
      if(tl){if(tl.pos[k]&&!e)tl.push({ev:k+'~',t:w.t});tl.pos[k]=e;}
    }
    for(const k in w.motor){
      const e=motorState(w.motor[k]);
      if(at[k]===undefined){at[k]=e;continue;}
      if(e===at[k])continue;
      log.push(k+e);at[k]=e;
      if(tl){if(e!=='0')tl.push({ev:k+'~',t:w.t});tl.push({ev:k+e,t:w.t});}
    }
  }
}
// 머무는 시간 검사: d.after(예 "A+")에 닿은 뒤 어떤 실린더든 다음으로 움직이기 시작할 때까지 d.sec±d.tol초인지
function dwellProblem(d,tl){
  const i=tl.findIndex(x=>x.ev===d.after);
  if(i<0)return `${fmtSeq([d.after])}에 닿지 않았어요`;
  const j=tl.findIndex((x,k)=>k>i&&x.ev.endsWith('~'));
  if(j<0)return `${fmtSeq([d.after])} 뒤에 다음 동작이 없었어요`;
  const gap=tl[j].t-tl[i].t;
  return Math.abs(gap-d.sec)<=d.tol?'':`${fmtSeq([d.after])} 후 ${gap.toFixed(1)}초 만에 움직였어요 (기대 ${d.sec}±${d.tol}초)`;
}
const fmtSeq=s=>s.map(x=>x.replace('-','−')).join(' ');
function gradeSequence(g,c){
  const w=newWorld(clone(c));run(w,g.setup||{power:true,air:true},0);
  const at={};recordMoves(w,1,[],at);   // 처음 위치로 자리 잡기
  const items=[],reps=g.repeat||1;let all=true,leak=false,laterFail='',dwellFail='';
  for(let r=0;r<reps;r++){
    const log=[],tl=[];tl.pos=Object.assign({},at);
    w.pb[g.press]=true;recordMoves(w,TAP,log,at,tl);w.pb[g.press]=false;
    for(let t=0;t<(g.timeout||20)&&log.length<g.sequence.length;t+=.1){recordMoves(w,.1,log,at,tl);if(w.out.leak)leak=true;}
    recordMoves(w,1.5,log,at,tl);           // 끝난 뒤 더 움직이지 않는지
    if(w.out.leak)leak=true;
    const ok=log.join(' ')===g.sequence.join(' ');
    if(!ok)all=false;
    const detail=ok?'':`기대: ${fmtSeq(g.sequence)} / 실제: ${log.length?fmtSeq(log):'움직임 없음'}`;
    if(r===0)items.push({name:`${g.press} → 변위단계선도(${fmtSeq(g.sequence)})대로 동작`,ok,detail,moves:log});
    else if(!ok&&!laterFail)laterFail=`${r+1}회차 — ${detail}`;
    if(g.dwell&&!dwellFail){const p=dwellProblem(g.dwell,tl);if(p)dwellFail=(reps>1?`${r+1}회차 — `:'')+p;}
  }
  if(g.dwell)items.push({name:`${fmtSeq([g.dwell.after])} 도달 후 ${g.dwell.sec}초 머문 뒤 다음 동작`,ok:!dwellFail,detail:dwellFail});
  if(reps>=2)items.push({name:TWICE,ok:all,detail:all?'':(laterFail||'1회차부터 순서가 다릅니다.')});
  return{items,leak,short:w.events.includes('short')};
}

function gradeMission(mis,c){
  const g=mis.grading;if(!g)return null;
  const r=g.sequence?gradeSequence(g,c):gradeSteps(g,c);
  const res=[chkShort(c,r.short),chkColor(c)];
  const mp=chkModulePower(c);if(mp)res.push(mp);
  const sw=newWorld(clone(c));
  (g.settingsCheck||[]).forEach(s=>{const v=sw.set[s.name];
    res.push({name:s.label,ok:v>=s.min-1e-9&&v<=s.max+1e-9,detail:`지금 ${v} — 기대 ${s.min}~${s.max}`});});
  const air=g.sequence?(g.setup?g.setup.air:true):(g.setup&&g.setup.air);
  if(air)res.push(chkLeak(r.leak));
  if(g.relayCount!=null)res.push(chkRelayCount(c,g.relayCount));
  return res.concat(r.items);
}
