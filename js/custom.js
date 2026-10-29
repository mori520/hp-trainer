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
    "memo":"요구사항 글", "img":"data:image/jpeg;base64,…" 도면 사진(줄여서)} */
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
      pressure:F.press.slice(),timer:null,meter:{},settings:[],memo:'',img:''};
  }
  // 판 구성 선택지: 실전 연습과 같고, B 자리는 비울 수도 있다 (실린더 하나짜리 과제)
  function choices(fluid){
    const F=FLUIDS[fluid],src=MISSIONS.find(m=>m.id===F.practice).practice.choices;
    const ch=Object.assign({},src);
    ch.cylB=(src.cylB||['cylinder']).concat('');
    return Object.assign({cylB:ch.cylB},ch);
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
  function toMission(def){
    const F=FLUIDS[def.fluid]||FLUIDS.air, seq=def.seq||[];
    const g={press:'PB1',sequence:seq.slice(),repeat:def.repeat?2:1,
      timeout:Math.max(20,seq.length*5+((def.timer&&def.timer.sec)||0)+5)};
    if(def.relays!=null)g.relayCount=def.relays;
    if(def.timer)g.dwell={after:def.timer.after,sec:def.timer.sec,tol:0.5};
    if(Object.keys(def.meter||{}).length)g.meterOn=Object.assign({},def.meter);
    const sc=[];
    if(def.pressure)sc.push({name:F.supply,min:def.pressure[0],max:def.pressure[1],label:`${F.supplyName} ${def.pressure[0]}~${def.pressure[1]} MPa`});
    (def.settings||[]).forEach(s=>sc.push({name:s.name,min:s.min,max:s.max,label:`설정값 ${s.name} ${s.min}~${s.max}`}));
    if(sc.length)g.settingsCheck=sc;
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
      exam:{req,stages:[{name:'평가',task:'요구사항대로 꾸미고 배선한 뒤 <b>평가 받기</b>를 누르세요.',grading:g}],explain:''}};
  }
  function fmtSeqC(s){return s.length?s.map(fmt).join(' '):'(순서 없음)';}
  function esc(t){return String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);}

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
    if(def.timer){
      const i=seq.indexOf(def.timer.after);
      if(i<0)out.push(`타이머: ${fmt(def.timer.after)}이(가) 동작 순서에 없어요.`);
      else if(i===seq.length-1)out.push('타이머: 마지막 동작 뒤에는 머무는 시간을 잴 수 없어요. 그 뒤에 동작이 있는 칸을 고르세요.');
      if(!(def.timer.sec>=0.5&&def.timer.sec<=10))out.push('타이머: 시간은 0.5~10초 사이로 정하세요.');
    }
    const parts=makeParts(L,def.board||{});
    for(const [k,v] of Object.entries(def.meter||{})){
      if(!seq.includes(k))out.push(`속도 조절: ${fmt(k)}이(가) 동작 순서에 없어요.`);
      if(/0$/.test(k)||tk.includes(k.slice(0,-1)+'0'))out.push(`속도 조절: ${fmt(k)}은(는) 모터라 미터 방식을 검사할 수 없어요. 실린더 칸을 고르세요.`);
      if(v==='bleed'&&!parts.some(p=>p.slot==='R1'&&p.type==='thr'))out.push('블리드오프: 판 구성의 "공급 줄 기기"에 양방향 유량조절을 놓아 주세요.');
      else if(v!=='bleed'&&!parts.some(p=>/^M[AB]\d$/.test(p.slot)&&['fcv','thr'].includes(p.type)))out.push(`속도 조절(${METER[v]}): 판에 유량조절밸브가 없어요. 판 구성에서 줄 기기를 놓아 주세요.`);
    }
    if(def.pressure&&!(def.pressure[0]<=def.pressure[1]))out.push('압력 범위: 아래 값이 위 값보다 커요.');
    const avail=settingsOf(def);
    (def.settings||[]).forEach(s=>{
      const a=avail.find(x=>x.name===s.name);
      if(!a)out.push(`설정값 ${s.name}: 판에 그 기기가 없어요.`);
      else if(!(s.min<=s.max))out.push(`설정값 ${s.name}: 아래 값이 위 값보다 커요.`);
      else if(s.max<a.min||s.min>a.max)out.push(`설정값 ${s.name}: 맞출 수 있는 범위(${a.min}~${a.max} ${a.unit})를 벗어났어요.`);
    });
    if(def.timer&&!avail.some(a=>/^T\d$/.test(a.name)))out.push('타이머 모듈이 판에 없어요.');
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
    d.timer=o.timer&&typeof o.timer==='object'&&tk.includes(o.timer.after)&&num(o.timer.sec,0.5,10)?{after:o.timer.after,sec:o.timer.sec}:null;
    d.meter={};
    if(o.meter&&typeof o.meter==='object')for(const [k,v] of Object.entries(o.meter))if(tk.includes(k)&&METER[v])d.meter[k]=v;
    d.settings=Array.isArray(o.settings)?o.settings.filter(s=>s&&typeof s.name==='string'&&/^\w{1,8}$/.test(s.name)&&num(s.min,0,100)&&num(s.max,0,100))
      .slice(0,10).map(s=>({name:s.name,min:s.min,max:s.max})):[];
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
  return{blank,choices,tokens,settingsOf,toMission,check,sanitize,parseFile,exportText,newId,MAX_IMG,METER};
})();
