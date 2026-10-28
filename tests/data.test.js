/* 데이터 검사: 미션·배치 데이터의 오타를 잡는다.
   미션을 추가하면 이 테스트가 자동으로 그 미션도 검사한다. */
const test=require('node:test'), assert=require('node:assert/strict'), vm=require('vm');
const {load,htmlIds}=require('./load.js');

const {ctx,get}=load();
const PARTS=get('PARTS'), LAYOUTS=get('LAYOUTS'), MISSIONS=get('MISSIONS'), IDS=htmlIds();
const DONE_TYPES=new Set(['color','state','setting','quiz']);

test('배치 데이터: 자리에 적힌 부품 종류가 라이브러리에 있다',()=>{
  for(const [name,L] of Object.entries(LAYOUTS)){
    assert.ok(Array.isArray(L.board)&&L.board.length===4,`${name}: board는 [x,y,폭,높이]`);
    L.rack.forEach((row,r)=>{
      let cols=0;
      for(const m of row){assert.ok(PARTS[m.type],`${name} 랙 ${r+1}줄: 없는 종류 ${m.type}`);cols+=PARTS[m.type].span||1;}
      assert.ok(cols<=6,`${name} 랙 ${r+1}줄: ${cols}칸 (최대 6칸)`);
    });
    const ids=new Set();
    for(const s of L.slots){
      for(const t of [s.fixed,...(s.accepts||[])].filter(Boolean))assert.ok(PARTS[t],`${name}.${s.slot}: 없는 종류 ${t}`);
      assert.ok(!ids.has(s.id),`${name}: 부품 이름 ${s.id} 중복`);ids.add(s.id);
    }
  }
});

for(const mis of MISSIONS.filter(m=>!m.soon)){
  test(`미션 ${mis.id}: 배치·튜토리얼·채점 데이터가 올바르다`,()=>{
    const L=LAYOUTS[mis.layout];
    assert.ok(L,`없는 배치 ${mis.layout}`);
    if(mis.diagram)assert.ok(require('fs').existsSync(require('path').join(__dirname,'..',mis.diagram)),`없는 도면 파일 ${mis.diagram}`);
    // 오류 찾기 문제: 정답 하나, 틀린 보기마다 이유(why), 해설
    const qz=mis.quiz;
    if(qz){
      assert.ok(qz.q&&qz.explain&&Array.isArray(qz.choices)&&qz.choices.length>=2,'quiz: q·explain·choices(2개 이상)');
      assert.ok(Number.isInteger(qz.answer)&&qz.choices[qz.answer],`quiz: 정답 번호 ${qz.answer}`);
      qz.choices.forEach((c,i)=>assert.ok(c.t&&(i===qz.answer||c.why),`quiz 보기 ${i+1}: t, 틀린 보기는 why 필요`));
      assert.ok(mis.diagram,'quiz가 있으면 도면도 있어야 함');
    }
    (mis.steps||[]).forEach((s,i)=>{if(s.done&&s.done.type==='quiz')assert.ok(qz,`튜토리얼 ${i+1}단계: quiz 조건인데 미션에 quiz가 없음`);});
    (mis.steps||[]).forEach((s,i)=>{if(s.g!=null)assert.ok(typeof s.g==='string'&&s.g,`튜토리얼 ${i+1}단계: 묶음 제목 g가 비어 있음`);});
    const mounts={};
    for(const [slot,type] of Object.entries(mis.board||{})){
      const s=L.slots.find(x=>x.slot===slot);
      assert.ok(s,`없는 자리 ${slot}`);
      if(s.sensor){
        const m=/^(\w+)([+-])$/.exec(type);
        assert.ok(m,`${slot}: 위치는 "A+"·"A-" 모양 (지금 ${type})`);
        const cs=L.slots.find(x=>x.id===m[1]);
        assert.ok(cs&&mis.board[cs.slot]==='cylinder',`${slot}: 실린더 ${m[1]}가 배치되어 있지 않음`);
        mounts[type]=(mounts[type]||0)+1;
        assert.ok(mounts[type]<=2,`${type}에 센서가 3개 이상 (최대 2개)`);
      }else assert.ok((s.accepts||[]).includes(type),`${slot}에 ${type}은 놓을 수 없음`);
    }
    // 실제로 그려서 잭 목록을 얻는다
    get('configure')({parts:get('makeParts')(L,mis.board||{})});
    const LAYOUT=get('LAYOUT');
    get('buildScene')(LAYOUT.parts,L.board);
    const JACKS=get('JACKS'), R=get('R'), GROUPS=get('JACK_GROUPS');
    const jackOk=spec=>spec.startsWith('group:')
      ?GROUPS[spec.slice(6)]&&Object.keys(JACKS).some(GROUPS[spec.slice(6)])
      :!!JACKS[spec];
    // 상태 이름 검사 (채점 expect와 튜토리얼 state가 같이 쓴다)
    // pbs = 누름버튼(잠깐 누르기 가능), inputs = 누름버튼 + 유지형 스위치(상태로 쓸 수 있음)
    const pbs=new Set(LAYOUT.pbs), inputs=new Set([...LAYOUT.pbs,...LAYOUT.toggles]), loads=new Set(LAYOUT.loads.map(l=>l.name));
    const cyls=new Set(LAYOUT.parts.filter(p=>p.type==='cylinder').map(p=>p.id));
    const sensors=new Set(LAYOUT.parts.filter(p=>p.cyl).map(p=>p.id));
    const counters=new Set(LAYOUT.parts.filter(p=>p.type==='counter').flatMap(p=>p.tags));
    const checkExpect=(exp,at,allowInputs)=>{
      for(const [k,v] of Object.entries(exp||{})){
        if(cyls.has(k))assert.ok(v==='+'||v==='-',`${at}: 실린더 ${k}는 "+" 또는 "-"`);
        else if(typeof v==='number')assert.ok(counters.has(k)&&Number.isInteger(v)&&v>=0,`${at}: 숫자는 카운터 값에만 (${k}=${v})`);
        else if(loads.has(k)||sensors.has(k)||(allowInputs&&(inputs.has(k)||k==='power'||k==='air')))assert.equal(typeof v,'boolean',`${at}: ${k}는 true/false`);
        else assert.fail(`${at}: 모르는 이름 ${k}`);
      }
    };

    (mis.steps||[]).forEach((s,i)=>{
      const at=`튜토리얼 ${i+1}단계`;
      if(s.wire){
        assert.ok(jackOk(s.wire[0])&&jackOk(s.wire[1]),`${at}: 없는 잭 ${s.wire}`);
        assert.ok(['red','blue','black'].includes(s.wire[2]),`${at}: 색 ${s.wire[2]}`);
        // 자동 색으로 그어도 튜토리얼이 요구하는 색과 같아야 한다
        const pick=x=>x.startsWith('group:')?Object.keys(JACKS).find(GROUPS[x.slice(6)]):x;
        const auto=get('autoWireColor')(pick(s.wire[0]),pick(s.wire[1]));
        assert.ok(s.wire[2]==='red'?auto==='red':auto!=='red',`${at}: 자동 색(${auto})이 안내 색(${s.wire[2]})과 다름`);
      }else if(s.hose){
        assert.ok(jackOk(s.hose[0])&&jackOk(s.hose[1]),`${at}: 없는 포트 ${s.hose}`);
        assert.ok(JACKS[s.hose[1]]?JACKS[s.hose[1]].kind==='pneu':true,`${at}: 호스는 공압 포트에만`);
      }else{
        assert.ok(s.done&&DONE_TYPES.has(s.done.type),`${at}: 완료 조건 ${JSON.stringify(s.done)}`);
        if(s.done.type==='state'){
          assert.ok(s.done.expect&&Object.keys(s.done.expect).length,`${at}: state에 expect가 없음`);
          checkExpect(s.done.expect,at,true);
        }
        if(s.done.type==='setting'){
          const st=LAYOUT.settings[s.done.name];
          assert.ok(st,`${at}: 없는 설정 ${s.done.name}`);
          const k=(s.done.value-st.min)/st.step;
          assert.ok(s.done.value>=st.min&&s.done.value<=st.max&&Math.abs(k-Math.round(k))<1e-9,`${at}: ${s.done.name}을 ${s.done.value}로 맞출 수 없음 (${st.min}~${st.max}, ${st.step} 간격)`);
          const start=mis.set&&s.done.name in mis.set?mis.set[s.done.name]:st.def;
          assert.notEqual(s.done.value,start,`${at}: 처음 값과 같으면 맞추는 연습이 안 됨`);
        }
      }
      (s.hl||[]).forEach(x=>assert.ok(x[0]==='@'?R[x.slice(1)]:jackOk(x),`${at}: 강조 대상 ${x}`));
      if(s.btn)assert.ok(IDS.has(s.btn),`${at}: 없는 버튼 ${s.btn}`);
    });
    // keep 단계의 상태 조건을 뒤 단계가 뒤집으면, 뒤 단계를 하는 순간 앞 단계로 되돌아가 버린다
    (mis.steps||[]).forEach((s,i)=>{
      if(!s.keep||!s.done||s.done.type!=='state')return;
      mis.steps.slice(i+1).forEach((t,j)=>{
        if(!t.done||t.done.type!=='state')return;
        for(const k in s.done.expect)if(k in t.done.expect)
          assert.equal(t.done.expect[k],s.done.expect[k],
            `튜토리얼 ${i+1}단계(keep)의 ${k}=${s.done.expect[k]}를 ${i+j+2}단계가 ${t.done.expect[k]}로 바꿈 → 되돌아감`);
      });
    });

    for(const k in mis.set||{})assert.ok(LAYOUT.settings[k],`처음 설정값 set: 없는 설정 ${k}`);
    // 실전 연습: 판 구성 선택지가 배치의 자리와 맞는지
    if(mis.practice)for(const slot of Object.keys(mis.practice.choices||{}))assert.ok(L.slots.some(s=>s.slot===slot),`실전 연습: 없는 자리 ${slot}`);
    for(const g of (mis.grading?[mis.grading]:[])){
    (g.settingsCheck||[]).forEach(s=>assert.ok(LAYOUT.settings[s.name]&&s.label,`settingsCheck: ${s.name}`));
    (g.steps||[]).forEach((s,i)=>{
      if(s.stroke)assert.ok(cyls.has(s.stroke.cyl)&&['+','-'].includes(s.stroke.dir)&&(s.stroke.min!=null||s.stroke.max!=null),`채점 ${i+1}: stroke`);
      for(const k in s.meter||{})assert.ok(cyls.has(k)&&['out','in'].includes(s.meter[k]),`채점 ${i+1}: meter`);
      for(const k in s.pressureAt||{})assert.ok(cyls.has(k)&&s.pressureAt[k].length===2,`채점 ${i+1}: pressureAt`);
    });
    const setOk=k=>k==='power'||k==='air'||inputs.has(k);
    const moveOk=x=>{const m=/^(\w+)([+-])$/.exec(x);return m&&cyls.has(m[1]);};
    Object.keys(g.setup||{}).forEach(k=>assert.ok(setOk(k),`채점 setup: 모르는 이름 ${k}`));
    if(g.relayCount!=null){
      const max=LAYOUT.loads.filter(l=>l.coil).length;
      assert.ok(Number.isInteger(g.relayCount)&&g.relayCount>=0&&g.relayCount<=max,`relayCount ${g.relayCount} (배치에 릴레이 ${max}개)`);
    }
    if(g.sequence){
      assert.ok(pbs.has(g.press),`채점 press: 없는 버튼 ${g.press}`);
      g.sequence.forEach(x=>assert.ok(moveOk(x),`변위단계선도: ${x}`));
    }else{
      assert.ok(Array.isArray(g.steps)&&g.steps.length,'채점 steps가 비어 있음');
      g.steps.forEach((s,i)=>{
        assert.ok(s.name,`채점 ${i+1}: 이름 없음`);
        Object.keys(s.set||{}).forEach(k=>assert.ok(setOk(k),`채점 ${i+1}: 모르는 이름 ${k}`));
        if(s.tap)assert.ok(pbs.has(s.tap),`채점 ${i+1}: tap에 없는 버튼 ${s.tap}`);
        checkExpect(s.expect,`채점 ${i+1}`,false);
        (s.moves||[]).concat(s.movesRepeat||[]).forEach(x=>assert.ok(moveOk(x),`채점 ${i+1}: 움직임 이름 ${x}`));
        if(s.movesRepeat)assert.ok(s.movesRepeat.length>0,`채점 ${i+1}: movesRepeat가 비어 있음`);
      });
    }
    }
  });
}

test('랙: 모듈이 겹치지 않고, 잭 이름이 겹치지 않는다',()=>{
  for(const L of Object.values(LAYOUTS)){
    // 모든 자리를 채우고, 센서는 같은 끝에 두 개씩 겹치게 놓아 비켜 그리기까지 검사
    const cylIds=L.slots.filter(s=>(s.accepts||[]).includes('cylinder')).map(s=>s.id);
    const ends=cylIds.flatMap(c=>[c+'+',c+'-']);
    const board=Object.fromEntries(L.slots.filter(s=>s.accepts).map(s=>[s.slot,s.accepts[0]]));
    L.slots.filter(s=>s.sensor).forEach((s,k)=>board[s.slot]=ends[Math.floor(k/2)%ends.length]);
    get('configure')({parts:get('makeParts')(L,board)});
    const parts=get('LAYOUT').parts;
    // 잭 등록(ejack·pport)을 잠시 감싸 이름을 세면서 그린다
    const seen=new Map();
    ctx.__count=id=>seen.set(id,(seen.get(id)||0)+1);
    vm.runInContext(`{const e=ejack,p=pport;
      ejack=function(id){__count(id);return e.apply(this,arguments);};
      pport=function(id){__count(id);return p.apply(this,arguments);};
      __restore=()=>{ejack=e;pport=p;};}`,ctx);
    try{get('buildScene')(parts,L.board);}finally{vm.runInContext('__restore()',ctx);}
    assert.equal(seen.size,Object.keys(get('JACKS')).length,'잭을 모두 세었는지');
    const dup=[...seen].filter(([,n])=>n>1).map(([id])=>id);
    assert.deepEqual(dup,[],'겹치는 잭 이름');
  }
});

test('모든 부품이 화면 갱신(render) 중 오류 없이 돈다',()=>{
  for(const mis of MISSIONS.filter(m=>!m.soon)){
    get('configure')({parts:get('makeParts')(LAYOUTS[mis.layout],mis.board||{})});
    const parts=get('LAYOUT').parts;
    get('buildScene')(parts,LAYOUTS[mis.layout].board);
    const w=get('newWorld')({wires:[],hoses:[]});
    for(const on of [false,true]){
      for(const k in w.relay)w.relay[k]=on;
      for(const k in w.pb)w.pb[k]=on;
      for(const p of parts)if(PARTS[p.type].render)PARTS[p.type].render(p,w);
    }
  }
});
