/* ===================== 내 과제 (사용자가 만드는 채점 과제) =====================
   사용자가 가진 도면을 보고 판 구성·변위단계선도·규칙을 직접 정하면, 미션과 같은 모양(layout·board·grading)으로 바꿔
   기존 채점기 gradeMission을 그대로 쓴다. 앱·저장소에는 어떤 과제도 들어가지 않고, 만든 과제는 그 사람 브라우저(store.custom)에만 있다.
   DOM을 쓰지 않는다 (테스트 가능). 화면은 js/custom-ui.js

   과제 정의(def) 모양:
   {"v":1, "id":"c1a2b3", "title":"제목", "fluid":"air"|"hyd",
    "board":{자리:종류 — 실전 연습 판 구성과 같은 값},
    "seq":["A+","B+","A-","B-"]   변위단계선도 (유압모터는 "M+" 정회전, "M-" 역회전, "M0" 정지)
    "repeat":true                 2회 반복
    "relays":null|4               릴레이 개수 정확히 n (null = 상관없음)
    "pressure":null|[0.45,0.55]   서비스 유닛(공압)·릴리프(유압) 압력 범위
    "timer":null|{"after":"B+","sec":2}   그 도착 뒤 머무는 시간 (타이머)
    "meter":{"A+":"out"}          그 도착의 속도 조절 방식 (out 미터아웃 / in 미터인 / bleed 블리드오프)
    "settings":[{"name":"PR1","min":0.25,"max":0.35}]   기기 설정값 범위
    "memo":"요구사항 글", "img":"data:image/jpeg;base64,…" 도면 사진(줄여서)
    "maint":[유지보수 틀, 3개까지] — 기본 동작 뒤 단계로 차례대로 열린다. 틀 하나가 grading.steps 묶음으로 바뀐다:
      {"type":"counter","start":"PB1"|"PB2","n":3,"lamp":""|"H1"|"H2","lampMode":"done"|"run"}
          start를 누르면 n사이클 연속 후 정지(카운터 C1), PB3 리셋. 램프 done = 다 끝나면 켜짐(리셋에 꺼짐), run = 도는 동안 켜짐
      {"type":"estop","start":"PB1"|"PB2","lamp":""|"H1"|"H2"}
          (PB2면 연속동작 중) 비상정지 ES(유지형) ON → 모두 후진 끝·모터 정지(+ 램프), OFF → 램프 꺼지고 멈춘 채로, 다시 start로 처음부터
      {"type":"contstop"}   PB2 연속동작, PB3 사이클을 마치고 정지 (PB1 한 사이클도 그대로)
      {"type":"rules","timer":…,"meter":{…},"settings":[…],"swap":{"valveA":"valve52d"}}
          같은 변위단계선도를 다시 + 규칙(타이머·속도 조절·설정값·밸브 교체 확인). 기기는 처음부터 판 구성에 놓아 둔다} */
const CUSTOM=(()=>{
  const FLUIDS={air:{layout:'air',practice:'practice',base:{cylA:'cylinder',valveA:'valve52s',cylB:'cylinder',valveB:'valve52s'},
      press:[0.45,0.55],start:{SU:0.3},supply:'SU',supplyName:'서비스 유닛 압력'},
    hyd:{layout:'hyd',practice:'hpractice',base:{cylA:'cylinder',valveA:'valve42',cylB:'cylinder',valveB:'valve42'},
      press:[3.8,4.2],start:{RV:3},supply:'RV',supplyName:'릴리프 압력'}};
  const METER={out:'미터아웃',in:'미터인',bleed:'블리드오프'};
  const MAX_IMG=1.5e6;   // 도면 사진 최대 크기 (글자 수, 약 1.1MB). 브라우저 저장 공간이 작아서
  const fmt=s=>s.replace('-','−');
  const newId=()=>'c'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36);

  function blank(fluid='air'){
    const F=FLUIDS[fluid];
    return{v:1,id:newId(),title:'',fluid,board:Object.assign({},F.base),seq:[],repeat:true,relays:null,
      pressure:F.press.slice(),timer:null,meter:{},settings:[],memo:'',img:'',maint:[]};
  }
  // 유지보수 틀 기본값
  const MAINT={
    counter:{label:'연속 n회 + 카운터 리셋',make:()=>({type:'counter',start:'PB2',n:3,lamp:'',lampMode:'done'})},
    estop:{label:'비상정지 + 램프',make:()=>({type:'estop',start:'PB2',lamp:'H1'})},
    contstop:{label:'연속동작 / 연속정지',make:()=>({type:'contstop'})},
    rules:{label:'다시 동작 + 규칙 (타이머·속도·설정값·밸브 교체)',make:()=>({type:'rules',timer:null,meter:{},settings:[],swap:{}})}};
  const MAX_MAINT=3;
  const VALVE_SLOTS=['valveA','valveB'];
  // 판 구성 선택지: 실전 연습과 같고, B 자리는 비울 수도 있다 (실린더 하나짜리 과제)
  function choices(fluid){
    const F=FLUIDS[fluid],src=MISSIONS.find(m=>m.id===F.practice).practice.choices;
    // B 자리는 비울 수도 있게 ''를 더한다. 판 구성에 B 자리가 있으면 그 순서 그대로(A 다음), 없으면 맨 앞
    const cylB=(src.cylB||['cylinder']).concat('');
    return Object.assign(src.cylB?{}:{cylB},src,{cylB});
  }
  const layoutOf=def=>LAYOUTS[FLUIDS[def.fluid].layout];
  // 판에 놓인 액추에이터로 쓸 수 있는 변위단계선도 칸: 실린더 → "A+","A-", 모터 → "M+","M-","M0"
  function tokens(def){
    const L=layoutOf(def),out=[];
    ['cylA','cylB'].forEach(slot=>{
      const s=L.slots.find(x=>x.slot===slot),type=def.board[slot];if(!s||!type)return;
      const id=(s.ids&&s.ids[type])||s.id;
      if(type==='motor')out.push(id+'+',id+'-',id+'0');else out.push(id+'+',id+'-');
    });
    return out;
  }
  // 판의 기기에서 맞출 수 있는 설정값 (서비스 유닛·릴리프·타이머·카운터·유량조절·감압 등): [{name, min, max, step, unit}]
  function settingsOf(def){
    const parts=makeParts(layoutOf(def),def.board||{}),out=[];
    parts.forEach(p=>{const d=PARTS[p.type];if(d&&d.settings)for(const [name,s] of Object.entries(d.settings(p)))out.push(Object.assign({name},s));});
    return out;
  }

  // 미션 데이터 모양으로: 모의 과제 화면(exam-ui.js)을 그대로 쓰도록 단계 하나짜리 "exam"을 만든다
  // 변위단계선도 채점 + 규칙(타이머·속도 조절·설정값·밸브 교체). 기본 동작과 "rules" 유지보수가 같이 쓴다
  function seqGrading(def,r,sc){
    const seq=def.seq||[];
    const g={press:'PB1',sequence:seq.slice(),repeat:def.repeat?2:1,
      timeout:Math.max(20,seq.length*5+((r.timer&&r.timer.sec)||0)+5)};
    if(r.timer)g.dwell={after:r.timer.after,sec:r.timer.sec,tol:0.5};
    if(Object.keys(r.meter||{}).length)g.meterOn=Object.assign({},r.meter);
    sc=(sc||[]).concat((r.settings||[]).map(s=>({name:s.name,min:s.min,max:s.max,label:`설정값 ${s.name} ${s.min}~${s.max}`})));
    if(sc.length)g.settingsCheck=sc;
    const pc=Object.entries(r.swap||{}).map(([slot,type])=>({slot,type,label:`${slot==='valveA'?'A':'B'} 밸브를 ${pracValLabel(type)}(으)로 교체`}));
    if(pc.length)g.partCheck=pc;
    return g;
  }
  const pracValLabel=t=>({valve52s:'5/2 편솔',valve52d:'5/2 양솔',valve42:'4/2 편솔',valve43c:'4/3 중립 블록',valve43a:'4/3 ABT',valve22:'2/2 편솔'})[t]||t;
  // 한 사이클 걸리는 시간 넉넉히 (속도 조절로 느려져도 되게)
  function cycleSec(def){
    const t=[def.timer].concat((def.maint||[]).map(m=>m.timer)).reduce((a,x)=>Math.max(a,(x&&x.sec)||0),0);
    return (def.seq||[]).length*3.5+t+1;
  }
  // 모두 처음 자리로: 실린더 후진 끝, 모터 정지
  function restExpect(def){const o={};tokens(def).forEach(t=>{if(t.endsWith('0'))o[t.slice(0,-1)]='0';else if(t.endsWith('-'))o[t.slice(0,-1)]='-';});return o;}
  // 유지보수 틀 → 모의 과제 단계 하나
  function maintStage(def,m,k){
    const seq=(def.seq||[]).slice(),cyc=cycleSec(def),S=m.start||'PB2',L=m.lamp||'',rest=restExpect(def),fs=fmtSeqC(seq);
    const base={setup:{power:true,air:true},repeat:def.repeat?2:1};
    const one={name:`PB1 → 한 사이클만 (${fs})`,tap:'PB1',wait:cyc+1.5,moves:seq};
    const head=`유지보수 ${k}) `;
    if(m.type==='counter'){
      const n=m.n,seqN=[].concat(...Array(n).fill(seq)),lampOn=L&&m.lampMode==='done',run=L&&m.lampMode==='run',steps=[];
      if(S!=='PB1')steps.push(one);
      steps.push({name:'PB3 → 카운터 리셋(0)',tap:'PB3',wait:0.5,expect:Object.assign({C1:0},L?{[L]:false}:{}),
        hint:'PB3 NO(13-14)를 카운터 리셋 입력(R1-R2)에 이으세요.'});
      const hint=`'연속' 릴레이를 ${S}로 켜고 카운터 NC로 끄는 자기유지로 만들고, 그 NO를 PB1과 나란히(병렬) 두세요. 카운터는 사이클 중 한 번만 켜지는 신호(예: 마지막 동작 직전 끝의 센서)로 세세요.`;
      if(run){
        steps.push({name:`${S} → 도는 동안 ${L} 점등`,tap:S,wait:0.6,expect:{[L]:true},hint:`${L}은 '연속' 릴레이 NO로 켜면 도는 동안만 켜져요.`});
        steps.push({name:`${n}사이클 하고 정지, ${L} 소등`,cont:true,wait:n*cyc+2,moves:seqN,expect:Object.assign({C1:n,[L]:false},rest),hint});
      }else steps.push({name:`${S} → ${n}사이클 하고 정지${lampOn?`, ${L} 점등`:''}`,tap:S,wait:n*cyc+2,moves:seqN,
        expect:Object.assign({C1:n},lampOn?{[L]:true}:{},rest),hint:hint+(lampOn?` ${L}은 카운터 NO로 켜세요.`:'')});
      steps.push({name:`PB3 → 리셋${L?`, ${L} 소등`:''}`,tap:'PB3',wait:0.5,moves:[],expect:Object.assign({C1:0},L?{[L]:false}:{})});
      return{name:`${head}연속 ${n}회 + 리셋`,
        task:`<b>${S}</b>를 누르면 <b>${n}사이클 연속</b>으로 동작하고 멈추게 하세요 (카운터 C1 ${n}회). <b>PB3</b>로 카운터를 리셋하면 다시 ${S}로 동작합니다.`
          +(L?` 램프 <b>${L}</b>는 ${run?'도는 동안 켜지고 끝나면 꺼져요':'다 끝나면 켜지고 리셋하면 꺼져요'}.`:'')+(S!=='PB1'?' PB1 한 사이클 동작도 그대로 돼야 해요.':''),
        grading:Object.assign(base,{settingsCheck:[{name:'C1',min:n,max:n,label:`카운터 ${n}회`}],steps})};
    }
    if(m.type==='estop'){
      const cont=S==='PB2',lamp=L?{[L]:true}:{},off=L?{[L]:false}:{},steps=[];
      const start=cont?{name:'PB2 → 연속동작',tap:'PB2',wait:2*cyc+1,movesRepeat:seq}:{name:'PB1 → 동작 시작',tap:'PB1',wait:1};
      const esOn={name:`비상정지 ON → 모두 처음 자리(후진 끝${tokens(def).some(t=>t.endsWith('0'))?'·모터 정지':''})${L?`, ${L} 점등`:''}`,set:{ES:true},wait:cyc/2+3,
        expect:Object.assign({},rest,lamp),
        hint:'ES NC(11-12)를 거친 24V로 제어 줄을 모두 먹이고, ES NO(13-14)로 램프를 켜세요. 양솔 밸브는 기억이 있어서 전원만 끊으면 돌아가지 않아요 → 비상정지 때 후진 솔레노이드를 켜야 해요.'};
      const esOff={name:`비상정지 OFF → ${L?L+' 소등, ':''}멈춘 채로`,set:{ES:false},wait:3,moves:[],expect:off};
      steps.push(start,esOn,esOff);
      if(cont)steps.push({name:'PB2 → 다시 연속동작',tap:'PB2',wait:2*cyc+1,movesRepeat:seq},Object.assign({},esOn,{name:'비상정지 ON → 다시 처음 자리'}),Object.assign({},esOff,{name:'비상정지 OFF → 멈춘 채로'}));
      else steps.push({name:`PB1 → 처음부터 한 사이클 (${fs})`,tap:'PB1',wait:cyc+1.5,moves:seq});
      return{name:`${head}비상정지${L?' + 램프':''}`,
        task:`${cont?'<b>PB2</b>를 누르면 사이클을 계속 되풀이(연속동작)하고, ':''}동작 중 비상정지 <b>ES</b>(유지형)를 누르면 <b>모든 실린더가 후진 끝으로 돌아가고</b>${tokens(def).some(t=>t.endsWith('0'))?' 모터는 멈추고':''}${L?` 램프 <b>${L}</b>가 켜지게`:''} 하세요. ES를 풀면 ${L?'램프가 꺼지고 ':''}멈춘 채로 있다가, ${S}를 누르면 처음부터 동작합니다.`,
        grading:Object.assign(base,{steps})};
    }
    if(m.type==='contstop'){
      return{name:`${head}연속동작 / 연속정지`,
        task:'<b>PB2</b>를 누르면 사이클을 계속 되풀이하고, <b>PB3</b>를 누르면 하던 사이클을 마친 뒤 멈추게 하세요. PB1 한 사이클 동작도 그대로 돼야 해요.',
        grading:Object.assign(base,{steps:[one,
          {name:'PB2 → 연속동작 (2사이클 이상)',tap:'PB2',wait:2*cyc+1,movesRepeat:seq,
           hint:"'연속' 릴레이를 PB2로 켜고 PB3(NC)로 끄는 자기유지로 만들고, 그 NO 접점을 PB1과 나란히(병렬) 두세요."},
          {name:'PB3 → 사이클을 마치고 정지',tap:'PB3',wait:cyc+1.5,expect:rest},
          {name:'멈춘 채로 유지',wait:3,moves:[]}]})};
    }
    // rules: 같은 변위단계선도 + 규칙
    const what=[];
    if(m.timer)what.push(`${fmt(m.timer.after)} 뒤 ${m.timer.sec}초 머무름`);
    for(const [kk,v] of Object.entries(m.meter||{}))what.push(`${fmt(kk)} ${METER[v]}`);
    (m.settings||[]).forEach(s=>what.push(`${s.name} ${s.min}~${s.max}`));
    for(const [slot,type] of Object.entries(m.swap||{}))what.push(`${slot==='valveA'?'A':'B'} 밸브 → ${pracValLabel(type)}`);
    return{name:`${head}${what.length?what.join(', '):'다시 동작'}`,
      task:`PB1을 누르면 <b>${fs}</b> 순서 그대로 동작하면서 다음을 지키게 고치세요: ${what.length?what.join(', '):'(규칙 없음)'}.`
        +(Object.keys(m.swap||{}).length?' 밸브는 "⇄ 종류 교체"로 바꿉니다 (공급을 끄고 그 밸브의 호스·배선을 뺀 뒤).':''),
      grading:seqGrading(def,m)};
  }
  function toMission(def){
    const F=FLUIDS[def.fluid]||FLUIDS.air, seq=def.seq||[];
    const sc=[];
    if(def.pressure)sc.push({name:F.supply,min:def.pressure[0],max:def.pressure[1],label:`${F.supplyName} ${def.pressure[0]}~${def.pressure[1]} MPa`});
    const g=seqGrading(def,def,sc);
    if(def.relays!=null)g.relayCount=def.relays;
    const req=[];
    if(def.pressure)req.push(`${F.supplyName}을 ${def.pressure[0]}~${def.pressure[1]} MPa로 맞춥니다.`);
    req.push(`PB1을 한 번 눌렀다 떼면 ${fmtSeqC(seq)} 순서로 동작하고 멈춥니다.${def.repeat?' 2회 이상 똑같이 동작해야 합니다.':''}`);
    if(def.relays!=null)req.push(`릴레이는 ${def.relays}개를 씁니다.`);
    if(def.timer)req.push(`${fmt(def.timer.after)}에 닿은 뒤 ${def.timer.sec}초 머문 다음 다음 동작.`);
    for(const [k,v] of Object.entries(def.meter||{}))req.push(`${fmt(k)} 움직임의 속도 조절: ${METER[v]}.`);
    (def.settings||[]).forEach(s=>req.push(`설정값 ${s.name}: ${s.min}~${s.max}`));
    req.push('배선 색: +24V 쪽 적색, 0V 쪽 청색 또는 흑색.');
    String(def.memo||'').split('\n').map(t=>t.trim()).filter(Boolean).forEach(t=>req.push(esc(t)));
    return{id:'u_'+def.id,no:'내',title:esc(def.title||'(제목 없음)'),custom:true,
      goal:'내가 만든 과제예요. 판을 꾸미고 배선한 뒤 "평가 받기"를 누르면 정한 기준대로 채점해요.',
      learn:'요구사항과 도면(첨부했다면 "도면 보기")을 보며 시험처럼 혼자 꾸며 보세요. 스톱워치로 시간도 재 보세요.',
      layout:F.layout,board:Object.assign({},def.board),diagram:def.img||'',
      set:def.pressure?Object.assign({},F.start):{},
      exam:{req,stages:[{name:(def.maint||[]).length?'기본 동작':'평가',task:'요구사항대로 꾸미고 배선한 뒤 <b>평가 받기</b>를 누르세요.',grading:g}]
        .concat((def.maint||[]).map((m,i)=>maintStage(def,m,i+1))),explain:''}};
  }
  function fmtSeqC(s){return s.length?s.map(fmt).join(' '):'(순서 없음)';}
  function esc(t){return String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);}

  // 규칙(타이머·속도 조절·설정값)이 판·순서와 맞는지. r = 기본 동작(def 자체) 또는 "rules" 유지보수
  function ruleProblems(def,r,pre){
    const out=[],seq=def.seq||[],tk=tokens(def),parts=makeParts(layoutOf(def),def.board||{}),avail=settingsOf(def);
    if(r.timer){
      const i=seq.indexOf(r.timer.after);
      if(i<0)out.push(`${pre}타이머: ${fmt(r.timer.after)}이(가) 동작 순서에 없어요.`);
      else if(i===seq.length-1)out.push(pre+'타이머: 마지막 동작 뒤에는 머무는 시간을 잴 수 없어요. 그 뒤에 동작이 있는 칸을 고르세요.');
      if(!(r.timer.sec>=0.5&&r.timer.sec<=10))out.push(pre+'타이머: 시간은 0.5~10초 사이로 정하세요.');
      if(!avail.some(a=>/^T\d$/.test(a.name)))out.push(pre+'타이머 모듈이 판에 없어요.');
    }
    for(const [k,v] of Object.entries(r.meter||{})){
      if(!seq.includes(k))out.push(`${pre}속도 조절: ${fmt(k)}이(가) 동작 순서에 없어요.`);
      if(/0$/.test(k)||tk.includes(k.slice(0,-1)+'0'))out.push(`${pre}속도 조절: ${fmt(k)}은(는) 모터라 미터 방식을 검사할 수 없어요. 실린더 칸을 고르세요.`);
      if(v==='bleed'&&!parts.some(p=>p.slot==='R1'&&p.type==='thr'))out.push(pre+'블리드오프: 판 구성의 "공급 줄 기기"에 양방향 유량조절을 놓아 주세요.');
      else if(v!=='bleed'&&!parts.some(p=>/^M[AB]\d$/.test(p.slot)&&['fcv','thr'].includes(p.type)))out.push(`${pre}속도 조절(${METER[v]}): 판에 유량조절밸브가 없어요. 판 구성에서 줄 기기를 놓아 주세요.`);
    }
    (r.settings||[]).forEach(s=>{
      const a=avail.find(x=>x.name===s.name);
      if(!a)out.push(`${pre}설정값 ${s.name}: 판에 그 기기가 없어요.`);
      else if(!(s.min<=s.max))out.push(`${pre}설정값 ${s.name}: 아래 값이 위 값보다 커요.`);
      else if(s.max<a.min||s.min>a.max)out.push(`${pre}설정값 ${s.name}: 맞출 수 있는 범위(${a.min}~${a.max} ${a.unit})를 벗어났어요.`);
    });
    return out;
  }
  // "이 기준 검사": 서로 맞지 않는 곳을 쉬운 말로. 빈 배열이면 문제 없음
  function check(def){
    const out=[],tk=tokens(def),seq=def.seq||[],L=layoutOf(def);
    if(!String(def.title||'').trim())out.push('제목을 적어 주세요.');
    if(!seq.length)out.push('변위단계선도(동작 순서)를 하나 이상 넣어 주세요.');
    seq.forEach((t,i)=>{if(!tk.includes(t))out.push(`${i+1}번째 ${fmt(t)}: 판에 그 액추에이터가 없어요. 판 구성을 확인하세요.`);});
    // 액추에이터마다: 실린더는 처음에 후진 끝 → "+"부터 번갈아, 끝나면 "−"로 돌아와야 다음 회차를 할 수 있다
    const last={};
    seq.forEach((t,i)=>{
      const id=t.slice(0,-1),d=t.slice(-1),motor=d==='0'||tk.includes(id+'0'),prev=last[id]||(motor?'0':'-');
      if(d===prev)out.push(`${i+1}번째 ${fmt(t)}: ${id}는 이미 ${motor?(d==='0'?'멈춰':'그 방향으로 돌고'):(d==='+'?'전진 끝에':'후진 끝에')} 있어요.`);
      last[id]=d;
    });
    for(const [id,d] of Object.entries(last)){
      const motor=tk.includes(id+'0');
      if(motor&&d!=='0')out.push(`모터 ${id}가 사이클 끝에 멈추지 않아요 (M0을 넣으세요).`);
      if(!motor&&d!=='-')out.push(`실린더 ${id}가 사이클 끝에 후진 끝으로 돌아오지 않아요. 그러면 다음 회차를 시작할 수 없어요.`);
    }
    out.push(...ruleProblems(def,def,''));
    if(def.pressure&&!(def.pressure[0]<=def.pressure[1]))out.push('압력 범위: 아래 값이 위 값보다 커요.');
    const avail=settingsOf(def),ch=choices(def.fluid);
    const maint=def.maint||[];
    if(maint.length>MAX_MAINT)out.push(`유지보수는 ${MAX_MAINT}개까지예요.`);
    maint.forEach((m,i)=>{
      const pre=`유지보수 ${i+1}) `;
      if(m.type==='counter'){
        if(!(Number.isInteger(m.n)&&m.n>=1&&m.n<=9))out.push(pre+'카운터 횟수는 1~9회로 정하세요.');
        if(!avail.some(a=>/^C\d$/.test(a.name)))out.push(pre+'카운터 모듈이 판에 없어요.');
      }
      if(m.type==='rules'){
        out.push(...ruleProblems(def,m,pre));
        for(const [slot,type] of Object.entries(m.swap||{})){
          if(!VALVE_SLOTS.includes(slot)||!(ch[slot]||[]).includes(type))out.push(pre+`${slot}: 그 밸브로는 바꿀 수 없어요.`);
          else if(def.board[slot]===type)out.push(pre+`${slot==='valveA'?'A':'B'} 밸브가 처음부터 ${pracValLabel(type)}예요. 판 구성(처음 밸브)을 바꾸기 전 종류로 두세요.`);
        }
        if(!m.timer&&!Object.keys(m.meter||{}).length&&!(m.settings||[]).length&&!Object.keys(m.swap||{}).length)out.push(pre+'규칙을 하나 이상 넣어 주세요.');
      }
    });
    // 센서는 놓인 실린더에만, 한 끝에 2개까지
    const ends={};
    L.slots.filter(s=>s.sensor).forEach(s=>{
      const m=parseSensor(def.board[s.slot]);if(!m)return;
      ends[m.pos]=(ends[m.pos]||0)+1;
      if(!tk.includes(m.cyl+'+')||tk.includes(m.cyl+'0'))out.push(`${s.slot}: ${m.cyl} 자리에 실린더가 없어요.`);
    });
    for(const [p,n] of Object.entries(ends))if(n>2)out.push(`${fmt(p)}에 센서·리밋이 ${n}개예요 (한 끝에 2개까지).`);
    if(def.img&&def.img.length>MAX_IMG)out.push('도면 사진이 너무 커요. 더 작은 사진을 넣어 주세요.');
    return out;
  }

  // 불러오기 형식 검사: 이상한 값은 버리고 깨끗한 정의만 돌려준다 (못 쓰면 null)
  function sanitize(o){
    if(!o||typeof o!=='object'||Array.isArray(o))return null;
    const fluid=o.fluid==='hyd'?'hyd':'air', d=blank(fluid), num=(x,lo,hi)=>typeof x==='number'&&isFinite(x)&&x>=lo&&x<=hi;
    if(typeof o.id==='string'&&/^[\w-]{1,40}$/.test(o.id))d.id=o.id;
    d.title=typeof o.title==='string'?o.title.slice(0,60):'';
    // 판: 실전 연습 선택지 안의 값만 (그 밖의 자리는 기본값)
    const ch=choices(fluid);
    if(o.board&&typeof o.board==='object')for(const [k,v] of Object.entries(o.board)){
      if(!ch[k]||typeof v!=='string'||!ch[k].includes(v))continue;
      if(v)d.board[k]=v;else delete d.board[k];
    }
    const tk=tokens(d);
    d.seq=Array.isArray(o.seq)?o.seq.filter(t=>tk.includes(t)).slice(0,40):[];
    d.repeat=o.repeat!==false;
    d.relays=Number.isInteger(o.relays)&&o.relays>=0&&o.relays<=6?o.relays:null;
    d.pressure=Array.isArray(o.pressure)&&o.pressure.length===2&&o.pressure.every(x=>num(x,0,10))?o.pressure.slice():o.pressure===null?null:d.pressure;
    const rules=(r,into)=>{
      into.timer=r.timer&&typeof r.timer==='object'&&tk.includes(r.timer.after)&&num(r.timer.sec,0.5,10)?{after:r.timer.after,sec:r.timer.sec}:null;
      into.meter={};
      if(r.meter&&typeof r.meter==='object')for(const [k,v] of Object.entries(r.meter))if(tk.includes(k)&&METER[v])into.meter[k]=v;
      into.settings=Array.isArray(r.settings)?r.settings.filter(s=>s&&typeof s.name==='string'&&/^\w{1,8}$/.test(s.name)&&num(s.min,0,100)&&num(s.max,0,100))
        .slice(0,10).map(s=>({name:s.name,min:s.min,max:s.max})):[];
      return into;
    };
    rules(o,d);
    const lamp=x=>['H1','H2'].includes(x)?x:'', start=x=>x==='PB1'?'PB1':'PB2';
    d.maint=(Array.isArray(o.maint)?o.maint:[]).filter(m=>m&&typeof m==='object'&&MAINT[m.type]).slice(0,MAX_MAINT).map(m=>{
      if(m.type==='counter')return{type:'counter',start:start(m.start),n:Number.isInteger(m.n)&&m.n>=1&&m.n<=9?m.n:3,lamp:lamp(m.lamp),lampMode:m.lampMode==='run'?'run':'done'};
      if(m.type==='estop')return{type:'estop',start:start(m.start),lamp:lamp(m.lamp)};
      if(m.type==='contstop')return{type:'contstop'};
      const r=rules(m,{type:'rules'});r.swap={};
      if(m.swap&&typeof m.swap==='object')for(const [k,v] of Object.entries(m.swap))if(VALVE_SLOTS.includes(k)&&(ch[k]||[]).includes(v)&&v)r.swap[k]=v;
      return r;
    });
    d.memo=typeof o.memo==='string'?o.memo.slice(0,2000):'';
    d.img=typeof o.img==='string'&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(o.img)&&o.img.length<=MAX_IMG?o.img:'';
    return d;
  }
  // 파일 내용(문자열) → 과제 목록. {"tasks":[…]} / […] / {…} 모두 받는다. 못 읽으면 []
  function parseFile(text){
    let o;try{o=JSON.parse(text);}catch(e){return[];}
    const list=Array.isArray(o)?o:o&&Array.isArray(o.tasks)?o.tasks:[o];
    return list.map(sanitize).filter(Boolean);
  }
  function exportText(defs){return JSON.stringify({app:'hp-trainer',kind:'my-tasks',v:1,tasks:defs},null,1);}
  return{blank,choices,tokens,settingsOf,toMission,check,sanitize,parseFile,exportText,newId,MAX_IMG,METER,MAINT,MAX_MAINT,VALVE_SLOTS,pracValLabel};
})();
