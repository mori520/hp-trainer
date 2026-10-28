/* 채점 테스트: 맞는 회로는 전부 통과, 틀린 회로는 정확히 그 항목에서 실패해야 한다 */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const F=require('./fixtures.js');

const {get}=load();
function setup(id){
  const mis=get('MISSIONS').find(m=>m.id===id);
  get('configure')({parts:get('makeParts')(get('LAYOUTS')[mis.layout],mis.board)});
  return mis;
}
// 결과는 별도 실행 환경에서 만들어지므로 JSON으로 한 번 옮겨 비교한다
// 회로 예시는 사용자가 그은 선만 적어 두고, 앱처럼 기본 전원 선(전원 모듈 → 각 모듈)을 더해서 채점한다
const J=(mis,c)=>get('withJumpers')(get('LAYOUTS')[mis.layout],c);
const grade=(id,c)=>{const mis=setup(id);return JSON.parse(JSON.stringify(get('gradeMission')(mis,J(mis,c))));};

const SHORT='합선 없음', COLOR='배선 색 규칙 (+ 적색, − 청색/흑색)', LEAK='공기 누설 없음', TWICE='2회 반복해도 동일하게 동작';
const RELAY1='릴레이 1개 사용 (개수 변경 금지)';
const SEQ_AA='PB1 → 변위단계선도(A+ A−)대로 동작';
const SEQ_ABBA='PB1 → 변위단계선도(A+ B+ B− A−)대로 동작';
const M2=['PB1을 누르지 않으면 H1 꺼짐, H2 켜짐','PB1을 누르면 H1 켜짐, H2 꺼짐','PB1을 떼면 원래대로 (H1 꺼짐, H2 켜짐)'];
const M3=['초기 상태에서 K1 꺼짐, 실린더 후진','PB1을 누르면 K1이 켜지고 실린더 전진','PB1을 떼면 K1이 꺼지고 실린더 후진'];
const M4=['초기 상태에서 K1 꺼짐, 실린더 후진','PB1을 눌렀다 떼도 전진 유지 (자기유지)','PB2를 누르면 자기유지 해제, 실린더 후진'];
const NAMES={
  m0:[SHORT,COLOR,'PB1을 누르지 않으면 H1 꺼짐','PB1을 누르면 H1 점등','PB1을 떼면 H1 소등',TWICE],
  m1:[SHORT,COLOR,LEAK,'초기 상태에서 실린더 후진 유지','PB1을 누르면 실린더 전진','PB1을 떼면 실린더 후진',TWICE],
  m2:[SHORT,COLOR,...M2,TWICE],
  m3:[SHORT,COLOR,LEAK,RELAY1,...M3,TWICE],
  m4:[SHORT,COLOR,LEAK,RELAY1,...M4,TWICE],
  m5:[SHORT,COLOR,LEAK,RELAY1,SEQ_AA,TWICE],
  m6:[SHORT,COLOR,LEAK,'릴레이 2개 사용 (개수 변경 금지)',SEQ_AA,TWICE],
  m7:[SHORT,COLOR,LEAK,SEQ_AA,TWICE],
  m8:[SHORT,COLOR,LEAK,'릴레이 4개 사용 (개수 변경 금지)',SEQ_ABBA,TWICE]
};
// 회로 예시마다 실패해야 하는 항목 (나머지는 모두 통과)
const FAILS={
  m0:{
    ok:[],
    wrongColor:[COLOR],
    short:[SHORT,'PB1을 누르면 H1 점등',TWICE],
    nc:['PB1을 누르지 않으면 H1 꺼짐','PB1을 누르면 H1 점등','PB1을 떼면 H1 소등',TWICE],
    noGround:['PB1을 누르면 H1 점등',TWICE]
  },
  m1:{
    ok:[],
    swapped:['초기 상태에서 실린더 후진 유지','PB1을 누르면 실린더 전진','PB1을 떼면 실린더 후진',TWICE],
    leak:[LEAK,'PB1을 누르면 실린더 전진',TWICE],
    noSupply:['PB1을 누르면 실린더 전진',TWICE],
    noSolGround:['PB1을 누르면 실린더 전진',TWICE]
  },
  m2:{
    ok:[],
    h2OnNO:[...M2,TWICE],
    noH2:[M2[0],M2[2],TWICE]
  },
  m3:{
    ok:[],
    noRelay:[RELAY1,M3[1],TWICE],
    onNC:[...M3,TWICE]
  },
  m4:{
    ok:[],
    noHold:[M4[1],TWICE],
    holdBypassesStop:[M4[2],TWICE],
    stopOnNO:[M4[1],TWICE]
  },
  m5:{ok:[],lsNO:[SEQ_AA,TWICE],holdBypass:[SEQ_AA,TWICE]},
  m6:{ok:[],noSensorGround:[SEQ_AA,TWICE],k2NO:[SEQ_AA,TWICE]},
  m7:{ok:[],lsNC:[SEQ_AA,TWICE],noY2:[SEQ_AA,TWICE]},
  // noReset은 K4 코일 선이 빠져 릴레이 개수(3개)도 틀린다
  m8:{ok:[],noK3cut:[SEQ_ABBA,TWICE],noReset:['릴레이 4개 사용 (개수 변경 금지)',SEQ_ABBA,TWICE]}
};

test('미션 8: 어디서 어긋났는지 실제 움직임으로 보여 준다',()=>{
  const d=k=>grade('m8',F.m8[k]).find(r=>r.name===SEQ_ABBA).detail;
  assert.equal(d('noK3cut'),'기대: A+ B+ B− A− / 실제: A+ B+');
  assert.equal(d('noReset'),'기대: A+ B+ B− A− / 실제: A+ B+ B−');
});

test('미션 5: 자기유지가 LS2를 건너뛰면 "실제: A+"로 멈춘 곳을 보여 준다',()=>{
  const res=grade('m5',F.m5.holdBypass);
  assert.equal(res.find(r=>r.name===SEQ_AA).detail,'기대: A+ A− / 실제: A+');
  assert.equal(res.find(r=>r.name===TWICE).detail,'2회차 — 기대: A+ A− / 실제: 움직임 없음');
});

for(const id in FAILS)for(const k in FAILS[id]){
  test(`${id} 채점: ${k}`,()=>{
    const res=grade(id,F[id][k]);
    assert.deepEqual(res.map(r=>r.name),NAMES[id],'채점 항목 이름과 순서');
    assert.deepEqual(res.filter(r=>!r.ok).map(r=>r.name),FAILS[id][k],'실패한 항목');
  });
}

// 튜토리얼 안내대로 연결한 회로는 반드시 채점을 통과해야 한다
for(const mis of get('MISSIONS').filter(m=>m.grading&&(m.steps||[]).length)){
  test(`${mis.id} 튜토리얼대로 연결하면 채점 통과`,()=>{
    setup(mis.id);
    const L=get('LAYOUTS')[mis.layout];
    get('buildScene')(get('LAYOUT').parts,L.board);
    const JACKS=get('JACKS'), G=get('JACK_GROUPS');
    // "group:이름"은 그 묶음의 첫 번째 잭을 쓴다
    const pick=s=>s.startsWith('group:')?Object.keys(JACKS).find(G[s.slice(6)]):s;
    let n=0;
    const c={
      wires:mis.steps.filter(s=>s.wire).map(s=>({id:'t'+(++n),a:pick(s.wire[0]),b:pick(s.wire[1]),color:s.wire[2]})),
      hoses:mis.steps.filter(s=>s.hose).map(s=>({id:'t'+(++n),a:pick(s.hose[0]),b:pick(s.hose[1])})),
      // 튜토리얼에서 맞추라고 한 설정값(타이머 초, 카운터 횟수)도 그대로
      set:Object.assign({},mis.set,Object.fromEntries(mis.steps.filter(s=>s.done&&s.done.type==='setting').map(s=>[s.done.name,s.done.value])))
    };
    const res=JSON.parse(JSON.stringify(get('gradeMission')(mis,J(mis,c))));
    assert.deepEqual(res.filter(r=>!r.ok).map(r=>r.name),[]);
  });
}

test('색이 틀린 선은 bad 목록으로 알려 준다 (화면에서 깜박임)',()=>{
  const res=grade('m0',F.m0.wrongColor);
  assert.deepEqual(res.find(r=>r.name===COLOR).bad,[F.m0.wrongColor.wires[2].id]);
});

test('틀린 항목에는 미션 데이터의 안내(hint)가 붙는다',()=>{
  const res=grade('m1',F.m1.swapped);
  assert.match(res.find(r=>r.name==='초기 상태에서 실린더 후진 유지').detail,/2번이 전방 포트/);
});

/* 변위단계선도 검사. 릴레이·센서가 아직 없어 자동 연속 동작 회로는 못 만들므로,
   양솔 밸브의 기억 기능(짧게 눌러도 끝까지 전진)으로 "한 번 누르면 B+" 회로를 쓴다 */
const {w,h}=F;
const tapB={wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','V2_Ya_p','red'),w('V2_Ya_n','R0_1_0','blue')],
  hoses:[h('D1','V2_1'),h('V2_4','B_cap'),h('V2_2','B_rod')]};
const FREE={layout:'air',board:{cylA:'cylinder',valveA:'valve52s',cylB:'cylinder',valveB:'valve52d'}};
function gradeSeq(grading,c){
  const mis={...FREE,grading};
  get('configure')({parts:get('makeParts')(get('LAYOUTS').air,mis.board)});
  return JSON.parse(JSON.stringify(get('gradeMission')(mis,J(mis,c))));
}

test('변위단계선도: 기록이 같으면 통과하고 실제 움직임을 남긴다',()=>{
  const res=gradeSeq({press:'PB1',sequence:['B+']},tapB);
  assert.deepEqual(res.map(r=>r.name),[SHORT,COLOR,LEAK,'PB1 → 변위단계선도(B+)대로 동작']);
  assert.ok(res.every(r=>r.ok));
  assert.deepEqual(res[3].moves,['B+']);
});

test('변위단계선도: 순서가 다르면 기대와 실제를 보여 준다',()=>{
  const res=gradeSeq({press:'PB1',sequence:['A+','A-']},tapB);
  const r=res[3];
  assert.equal(r.ok,false);
  assert.equal(r.detail,'기대: A+ A− / 실제: B+');
});

test('변위단계선도: 아무것도 안 움직이면 "움직임 없음"',()=>{
  const res=gradeSeq({press:'PB1',sequence:['B+']},{wires:[],hoses:tapB.hoses});
  assert.equal(res[3].detail,'기대: B+ / 실제: 움직임 없음');
});

test('변위단계선도: 2회차가 다르면 2회 반복 항목에서 실패',()=>{
  // B는 한 번 전진하면 되돌아오지 않으므로 2회차에는 움직임이 없다
  const res=gradeSeq({press:'PB1',sequence:['B+'],repeat:2},tapB);
  assert.equal(res[3].ok,true);
  const t=res.find(r=>r.name===TWICE);
  assert.equal(t.ok,false);
  assert.equal(t.detail,'2회차 — 기대: B+ / 실제: 움직임 없음');
});

/* 릴레이 회로: PB1 → K1 자기유지 → K1 2번 접점으로 Y1 → A 전진 (한 번 누르면 A+) */
const holdA={wires:[
  w('R24_1_0','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('R24_5_0','K1_11','red'),w('K1_14','K1_A1','red'),
  w('R24_5_1','K1_21','red'),w('K1_24','V1_Ya_p','red'),w('V1_Ya_n','R0_5_1','blue')],
  hoses:[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod')]};

test('변위단계선도 + 릴레이 개수: 자기유지 회로로 한 번 누르면 A+',()=>{
  const res=gradeSeq({press:'PB1',sequence:['A+'],relayCount:1},holdA);
  assert.deepEqual(res.filter(r=>!r.ok).map(r=>r.name),[]);
  assert.ok(res.some(r=>r.name==='릴레이 1개 사용 (개수 변경 금지)'));
});

test('릴레이 개수가 다르면 실패하고 쓴 릴레이를 알려 준다',()=>{
  const extra={wires:[...holdA.wires,w('R24_6_0','K4_A1','red'),w('K4_A2','R0_6_0','blue')],hoses:holdA.hoses};
  const r=gradeSeq({press:'PB1',sequence:['A+'],relayCount:1},extra).find(x=>x.name.startsWith('릴레이'));
  assert.equal(r.ok,false);
  assert.equal(r.detail,'지금 코일이 배선된 릴레이는 2개 (K1, K4)입니다.');
});

test('동작 중에만 생기는 합선(릴레이 접점 경유)도 잡는다',()=>{
  // K1이 켜지면 NO 접점이 +24V와 0V를 바로 잇는다. 버튼만 눌러 보는 검사로는 안 보이는 합선
  const c={wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_0','K1_11','red'),w('K1_14','R0_5_1','blue')],hoses:[]};
  const res=gradeSeq({setup:{power:true},steps:[{name:'PB1 누름',set:{PB1:true},wait:.2,expect:{}}]},c);
  assert.equal(res.find(r=>r.name===SHORT).ok,false);
});

test('채점은 원래 회로를 바꾸지 않는다',()=>{
  const c=JSON.parse(JSON.stringify(F.m1.ok));
  grade('m1',c);
  assert.deepEqual(c,F.m1.ok);
});

/* 연속동작·비상정지 (미션 9·12): 단계 동안의 움직임 기록으로 채점 */
const failed=(id,k)=>grade(id,F[id][k]).filter(r=>!r.ok).map(r=>r.name);
for(const id of ['m9','m12'])test(`${id} 맞는 회로는 모두 통과`,()=>assert.deepEqual(failed(id,'ok'),[]));

test('미션 9: K1 없이 LS1로 시작하면 "처음에는 움직이지 않음"에서 실패',()=>{
  const r=grade('m9',F.m9.noK1gate).find(x=>x.name==='처음에는 움직이지 않음');
  assert.equal(r.ok,false);
  assert.match(r.detail,/^움직이지 않아야 하는데 움직였습니다: A\+/);
});
test('미션 9: PB3를 NO로 달면 연속동작이 시작되지 않음',()=>{
  const r=grade('m9',F.m9.stopOnNO).find(x=>x.name==='PB2를 한 번 누르면 A+ A− 연속 반복');
  assert.equal(r.ok,false);
  assert.match(r.detail,/^기대: A\+ A− 를 2회 이상 되풀이 \/ 실제: 움직임 없음/);
});
test('미션 9: PB3를 거치지 않으면 멈추지 않음',()=>{
  const f=failed('m9','noStop');
  assert.ok(f.includes('PB3를 누르면 사이클을 마치고 후진 끝에서 정지'),f.join(','));
  assert.ok(f.includes('정지한 채로 유지'));
});
test('미션 12: 비상정지를 거치지 않으면 비상정지가 동작을 못 멈춤',()=>{
  const f=failed('m12','esBypass');
  assert.ok(f.includes('비상정지 ON → 실린더 후진, 램프 점등')||f.includes('비상정지 OFF → 램프 소등, 초기화되어 멈춘 채로'),f.join(','));
});
test('미션 12: 램프를 NC에 달면 비상정지 때 꺼짐',()=>{
  assert.ok(failed('m12','lampOnNC').includes('비상정지 ON → 실린더 후진, 램프 점등'));
});

/* 카운터·타이머 미션 (10·11): 설정값을 직접 맞추지 않으면 실패해야 한다 */
function tutorialCircuit(id,set){
  const mis=setup(id),L=get('LAYOUTS')[mis.layout];
  get('buildScene')(get('LAYOUT').parts,L.board);
  const JACKS=get('JACKS'),G=get('JACK_GROUPS'),pick=s=>s.startsWith('group:')?Object.keys(JACKS).find(G[s.slice(6)]):s;
  let n=0;
  return{wires:mis.steps.filter(s=>s.wire).map(s=>({id:'q'+(++n),a:pick(s.wire[0]),b:pick(s.wire[1]),color:s.wire[2]})),
    hoses:mis.steps.filter(s=>s.hose).map(s=>({id:'q'+(++n),a:pick(s.hose[0]),b:pick(s.hose[1])})),set};
}
test('미션 10: 카운터를 3으로 안 맞추면(처음 값 1) 한 번만 하고 멈춤',()=>{
  const r=grade('m10',tutorialCircuit('m10',{})).find(x=>x.name==='PB2를 한 번 누르면 A+ A−를 3번 하고 정지');
  assert.equal(r.ok,false);
  assert.match(r.detail,/^기대: A\+ A− A\+ A− A\+ A− \/ 실제: A\+ A−/);
});
test('미션 10: PB3 리셋 선이 없으면 리셋·재동작에서 실패',()=>{
  const c=tutorialCircuit('m10',{C1:3});c.wires=c.wires.filter(x=>x.b!=='C1_R1');
  const f=grade('m10',c).filter(r=>!r.ok).map(r=>r.name);
  assert.deepEqual(f,['PB3를 누르면 카운터 리셋(0)','리셋 후 PB2로 다시 3번 동작']);
});
test('미션 11: 타이머를 3초로 맞춰야 통과, 처음 값(1초)·2초는 시간 검사에서 실패',()=>{
  const dw=set=>grade('m11',tutorialCircuit('m11',set)).find(x=>x.name==='A+ 도달 후 3초 머문 뒤 다음 동작');
  assert.equal(dw({T1:3}).ok,true);
  const one=dw({}),two=dw({T1:2});
  assert.equal(one.ok,false);assert.match(one.detail,/^1회차 — A\+ 후 1\.\d초 만에 움직였어요 \(기대 3±0\.5초\)$/);
  assert.equal(two.ok,false);assert.match(two.detail,/2\.\d초 만에/);
});

test('기본 전원 선을 뺀 모듈을 쓰면 "모듈 전원 연결" 항목으로 알려 준다',()=>{
  const mis=setup('m3');
  const c=J(mis,F.m3.ok);
  // 릴레이 모듈(K1~K3)로 가는 기본 전원 선을 뺌. 미션 3 회로는 R24_5_0·R0_5_x(릴레이 모듈 레일)를 쓴다
  c.wires=c.wires.filter(x=>!(x.base&&x.b.endsWith('_5_0')));
  const r=JSON.parse(JSON.stringify(get('gradeMission')(mis,c))).find(x=>x.name==='모듈 전원 연결');
  assert.ok(r&&!r.ok);
  assert.match(r.detail,/^릴레이 모듈\(K1~K3\)에 24V\/0V가 연결되지 않았어요/);
});
test('전원 선이 다 있으면 "모듈 전원 연결" 항목은 나오지 않는다',()=>{
  assert.ok(!grade('m3',F.m3.ok).some(x=>x.name==='모듈 전원 연결'));
});

/* 공압 기기 (미션 13-1·2·3) */
const swapHose=(c,a,b)=>{c.hoses=c.hoses.map(h=>h.a===a?{...h,a:b}:h.b===a?{...h,b:b}:h.a===b?{...h,a:a}:h.b===b?{...h,b:a}:h);return c;};
const item=(id,c,name)=>grade(id,c).find(x=>x.name===name);
test('13-1: 유량조절밸브를 뒤집어 끼우면 미터인으로 판정',()=>{
  const c=swapHose(tutorialCircuit('m13a',{F1:4}),'F1_1','F1_2');
  const fw=item('m13a',c,'전진 속도는 그대로 (1.3초 안에)'), bw=item('m13a',c,'후진만 느리게 (1.5초 이상, 미터아웃)');
  assert.equal(fw.ok,false);assert.match(fw.detail,/^전진이 끝까지 되지 않았어요/);   // 미터인으로 조여져 2초 안에 다 못 나감
  assert.equal(bw.ok,false);
});
test('13-1: 조이지 않으면(10단) 후진이 느려지지 않음',()=>{
  const r=item('m13a',tutorialCircuit('m13a',{}),'후진만 느리게 (1.5초 이상, 미터아웃)');
  assert.equal(r.ok,false);assert.match(r.detail,/^후진 \d\.\d초 — 기대: 1\.5초 이상 \(느리게\)/);
});
test('13-1: 유량조절밸브를 거치지 않으면 미터아웃이 아님',()=>{
  const c=tutorialCircuit('m13a',{F1:4});
  c.hoses=c.hoses.filter(h=>!h.a.startsWith('F1')&&!h.b.startsWith('F1')).concat([{id:'x1',a:'V1_4',b:'A_cap'}]);
  const r=item('m13a',c,'후진만 느리게 (1.5초 이상, 미터아웃)');
  assert.equal(r.ok,false);
});
test('13-2: 급속배기밸브를 뒤집어 끼우면 빨라지지 않음',()=>{
  const r=item('m13b',swapHose(tutorialCircuit('m13b',{}),'Q1_P','Q1_A'),'후진이 빨라짐 (0.7초 이하)');
  assert.equal(r.ok,false);assert.match(r.detail,/^후진 \d\.\d초 — 기대: 0\.7초 이하 \(빠르게\)/);
});
test('13-3: 감압밸브를 안 맞추면(0.5) 작동압력, 서비스 유닛을 안 맞추면(0.2) 설정 검사에서 실패',()=>{
  const p=item('m13c',tutorialCircuit('m13c',{SU:0.5}),'A 작동압력 0.3±0.05 MPa');
  assert.equal(p.ok,false);assert.match(p.detail,/^A 작동압력 0\.50 MPa — 기대 0\.25~0\.35 MPa/);
  const s=item('m13c',tutorialCircuit('m13c',{SU:0.2,PR1:0.3}),'서비스 유닛 압력 0.5±0.05 MPa');
  assert.equal(s.ok,false);
});
test('13-3: 감압밸브를 거꾸로 끼우면 공기가 지나가지 않음',()=>{
  const r=item('m13c',swapHose(tutorialCircuit('m13c',{SU:0.5,PR1:0.3}),'PR1_1','PR1_2'),'A 작동압력 0.3±0.05 MPa');
  assert.equal(r.ok,false);
});

/* 오류 찾기 (미션 14): 틀린 도면에 그려진 그대로 배선하면 채점에서 떨어져야 한다 */
const rewire=(c,map)=>{c.wires=c.wires.map(w=>({...w,a:map[w.a]||w.a,b:map[w.b]||w.b}));return c;};
const fails=(id,c)=>grade(id,c).filter(r=>!r.ok).map(r=>r.name);
test('14-1: 자기유지를 도면대로 NC(K1 12번)로 배선하면 실패',()=>{
  const f=fails('m14a',rewire(tutorialCircuit('m14a',{}),{K1_14:'K1_12'}));
  assert.ok(f.includes('초기 상태에서 K1 꺼짐, 실린더 후진')||f.includes('PB1을 눌렀다 떼도 전진 유지 (자기유지)'),f.join(','));
});
test('14-2: 도면대로 LS1(후진 끝)로 끊으면 실패',()=>{
  const f=fails('m14b',rewire(tutorialCircuit('m14b',{}),{LS2_1:'LS1_1',LS2_2:'LS1_2'}));
  assert.ok(f.length>0);
});
test('14-3: 도면대로 K4 줄에 K2 접점을 쓰면 실패 (B가 움직이기 전에 A 후진)',()=>{
  const f=fails('m14c',rewire(tutorialCircuit('m14c',{}),{K3_31:'K2_31',K3_34:'K2_34'}));
  assert.ok(f.length>0);
});
test('14-4: 도면대로 LS2 NC로 K1을 끊으면 3초를 기다리지 않아 실패',()=>{
  const f=fails('m14d',rewire(tutorialCircuit('m14d',{T1:3}),{T1_11:'LS2_1',T1_12:'LS2_2'}));
  assert.ok(f.includes('A+ 도달 후 3초 머문 뒤 다음 동작'),f.join(','));
});

/* 유압 미션: 틀린 회로는 그 항목에서 실패한다 */
const HL='P→T 직결 없음 (압력이 오르는지)';
const hydOk={
  h1:{wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('V1_Ya_n','R0_1_0','blue')],
      hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','A_rod')],set:{RV:4}},
  h2:{wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('V1_Ya_n','R0_1_0','blue'),w('R24_1_1','PB2_13','red'),w('PB2_14','V1_Yb_p','red'),w('V1_Yb_n','R0_1_1','blue')],
      hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','A_rod')]},
  h4:{wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('V1_Ya_n','R0_1_0','blue')],
      hoses:[h('HP1','CV1_1'),h('CV1_2','V1_P'),h('V1_T','HT1'),h('V1_A','F1_2'),h('F1_1','A_cap'),h('V1_B','A_rod')],set:{F1:3}}
};
const without=(c,a)=>({...c,hoses:c.hoses.filter(x=>x.a!==a&&x.b!==a)});
const swapEnds=(c,from,to)=>({...c,hoses:c.hoses.map(x=>({...x,a:x.a===from?to:x.a===to?from:x.a,b:x.b===from?to:x.b===to?from:x.b}))});
test('h1: 맞는 회로는 통과, 릴리프가 4±0.2가 아니면 그 항목만 실패, 탱크 호스가 없으면 전진 실패',()=>{
  const fails=c=>grade('h1',c).filter(r=>!r.ok).map(r=>r.name);
  assert.deepEqual(grade('h1',hydOk.h1).map(r=>r.name).includes(HL),true,'유압 판 누설 항목 이름');
  assert.deepEqual(fails(hydOk.h1),[]);
  assert.deepEqual(fails({...hydOk.h1,set:{RV:3}}),['릴리프 압력 4±0.2 MPa']);
  assert.deepEqual(fails(without(hydOk.h1,'HT1')),['PB1을 누르면 실린더 전진',TWICE]);
});
test('h2: 4/2 밸브로 바꿔 끼우면 "그 자리에 멈춤"에서 실패',()=>{
  assert.deepEqual(grade('h2',hydOk.h2).filter(r=>!r.ok).map(r=>r.name),[]);
  const mis=get('MISSIONS').find(m=>m.id==='h2');
  const m42={...mis,board:{...mis.board,valveA:'valve42'}};
  get('configure')({parts:get('makeParts')(get('LAYOUTS').hyd,m42.board)});
  const res=JSON.parse(JSON.stringify(get('gradeMission')(m42,J(m42,hydOk.h2))));
  assert.ok(res.filter(r=>!r.ok).map(r=>r.name).includes('PB1을 떼면 그 자리에 멈춤 (중립)'));
});
test('h4: 유량조절밸브를 거꾸로 끼우면 미터인이 아니고, 체크밸브를 거꾸로 끼우면 움직이지 않는다',()=>{
  const fails=c=>grade('h4',c).filter(r=>!r.ok).map(r=>r.name);
  assert.deepEqual(fails(hydOk.h4),[]);
  assert.ok(fails(swapEnds(hydOk.h4,'F1_1','F1_2')).includes('전진만 느리게 (1.5초 이상, 미터인)'));
  assert.ok(fails(swapEnds(hydOk.h4,'CV1_1','CV1_2')).includes('펌프 토출구 체크밸브 방향'));
});
test('h9: 카운터밸런스를 건너뛰면(밸브 B → 전방 바로) 하중이 내려가 첫 항목부터 실패',()=>{
  const ok={wires:hydOk.h2.wires,hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','CB1_1'),h('CB1_2','A_rod')]};
  assert.deepEqual(grade('h9',ok).filter(r=>!r.ok).map(r=>r.name),[]);
  const skip={...ok,hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','A_rod')]};
  const f=grade('h9',skip).filter(r=>!r.ok).map(r=>r.name);
  assert.ok(f.includes('버튼을 누르지 않으면 하중이 내려가지 않음'),f.join());
});
test('h10: 파일럿 체크를 거꾸로(2→1) 꽂으면 기름이 바깥으로만 빠져 하중이 내려간다',()=>{
  const ok={wires:hydOk.h2.wires,hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','PC1_A1'),h('PC1_A2','A_cap'),h('V1_B','PC1_B1'),h('PC1_B2','A_rod')]};
  assert.deepEqual(grade('h10',ok).filter(r=>!r.ok).map(r=>r.name),[]);
  const rev={...ok,hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','PC1_A2'),h('PC1_A1','A_cap'),h('V1_B','PC1_B2'),h('PC1_B1','A_rod')]};
  assert.ok(grade('h10',rev).filter(r=>!r.ok).map(r=>r.name).includes('버튼을 누르지 않으면 움직이지 않음'));
});
test('h8: 압력스위치 NO(1-4)로 끊으면 자동 후진이 안 된다',()=>{
  const hs=[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','PS1_a'),h('PS1_b','A_cap'),h('V1_B','A_rod')];
  const wires=nc=>[w('R24_1_0','PS1_1','red'),w(nc,'PB1_13','red'),w('PB1_14','K1_A1','red'),w(nc,'K1_11','red'),w('K1_14','K1_A1','red'),
    w('R24_5_0','K1_21','red'),w('K1_24','V1_Ya_p','red'),w('K1_A2','R0_5_0','blue'),w('V1_Ya_n','R0_5_1','blue')];
  assert.deepEqual(grade('h8',{wires:wires('PS1_2'),hoses:hs}).filter(r=>!r.ok).map(r=>r.name),[]);
  assert.ok(grade('h8',{wires:wires('PS1_4'),hoses:hs}).some(r=>!r.ok));
});
