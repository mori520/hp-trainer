/* 내 과제(custom.js): 에디터에서 만든 정의 → 미션 데이터로 바꿔 기존 채점기로 채점, 기준 검사, 불러오기 형식 검사.
   정답 회로는 여기(테스트)에만 둔다 (모의 공1과 같은 판·순서를 사용자가 직접 만든 경우) */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {w,h}=require('./fixtures.js');
const {get}=load();
const C=get('CUSTOM');
const J=x=>JSON.parse(JSON.stringify(x));

function grade(def,c){
  const mis=C.toMission(def),L=get('LAYOUTS')[mis.layout];
  get('configure')({parts:get('makeParts')(L,mis.board)});
  const cc=get('withJumpers')(L,{wires:c.wires,hoses:c.hoses,set:Object.assign({},mis.set,c.set)});
  return J(get('gradeMission')({...mis,grading:mis.exam.stages[0].grading},cc));
}
const failed=r=>r.filter(i=>!i.ok).map(i=>i.name+(i.detail?' — '+i.detail:''));

// A 편솔·B 양솔, A+ B+ A− B−, 릴레이 4개 (tests/exam.test.js 모의 공1의 고친 회로와 같은 배선)
const hoses=()=>[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod'),h('D2','V2_1'),h('V2_4','B_cap'),h('V2_2','B_rod')];
const wires=()=>[
  w('R24_6_0','K4_11','red'),w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('R24_5_0','K1_21','red'),w('K1_24','K3_11','red'),w('K3_12','V1_Ya_p','red'),w('V1_Ya_n','R0_5_1','blue'),
  w('R24_1_0','S1_p','red'),w('S1_n','R0_1_0','blue'),w('S1_out','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
  w('R24_5_1','K2_11','red'),w('K2_14','V2_Ya_p','red'),w('V2_Ya_n','R0_5_3','blue'),
  w('R24_5_2','K1_31','red'),w('K1_34','LS2_1','red'),w('LS2_4','K3_A1','red'),w('K1_34','K3_21','red'),w('K3_24','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
  w('R24_1_1','S2_p','red'),w('S2_n','R0_1_1','blue'),w('S2_out','K3_31','red'),w('K3_34','V2_Yb_p','red'),w('V2_Yb_n','R0_6_0','blue'),
  w('R24_6_1','K3_41','red'),w('K3_44','LS1_1','red'),w('LS1_4','K4_A1','red'),w('K4_A2','R0_6_1','blue')];
function myTask(){
  const d=C.blank('air');
  Object.assign(d,{title:'내 연습 1',board:{cylA:'cylinder',valveA:'valve52s',cylB:'cylinder',valveB:'valve52d',S1:'A+',S2:'A-',LS1:'B-',LS2:'B+'},
    seq:['A+','B+','A-','B-'],relays:4});
  return d;
}

test('내 과제 → 미션 데이터: 단계 하나짜리 exam, 변위단계선도·릴레이·압력 채점',()=>{
  const m=C.toMission(myTask());
  assert.equal(m.id.slice(0,2),'u_');assert.equal(m.layout,'air');assert.equal(m.exam.stages.length,1);
  const g=m.exam.stages[0].grading;
  assert.deepEqual(J(g.sequence),['A+','B+','A-','B-']);assert.equal(g.repeat,2);assert.equal(g.relayCount,4);
  assert.deepEqual(J(m.set),{SU:0.3},'압력을 검사하면 0.3에서 시작해 직접 맞추게');
  assert.deepEqual(J(C.check(myTask())),[]);
});
test('내 과제: 맞는 회로는 통과, 압력을 안 맞추거나 릴레이 개수가 다르거나 순서가 다르면 실패',()=>{
  assert.deepEqual(failed(grade(myTask(),{wires:wires(),hoses:hoses(),set:{SU:0.5}})),[]);
  assert.ok(failed(grade(myTask(),{wires:wires(),hoses:hoses(),set:{}})).some(s=>s.startsWith('서비스 유닛 압력')));
  assert.ok(failed(grade({...myTask(),relays:5},{wires:wires(),hoses:hoses(),set:{SU:0.5}})).some(s=>s.startsWith('릴레이 5개')));
  assert.ok(failed(grade({...myTask(),seq:['A+','B+','B-','A-']},{wires:wires(),hoses:hoses(),set:{SU:0.5}})).some(s=>s.startsWith('PB1 → 변위단계선도')));
  // 릴레이 상관없음 + 압력 검사 안 함 → 그 항목이 없다
  const free=grade({...myTask(),relays:null,pressure:null},{wires:wires(),hoses:hoses(),set:{SU:0.5}});
  assert.ok(!free.some(i=>/릴레이|압력/.test(i.name)));
});
test('내 과제: 미터아웃·타이머 규칙 (변위단계선도 채점에 meterOn·dwell)',()=>{
  const d={...myTask(),board:{...myTask().board,MA2:'fcv'},meter:{'A+':'out'},timer:{after:'B+',sec:2},settings:[{name:'F1',min:3,max:7}]};
  assert.deepEqual(J(C.check(d)),[]);
  const meterOut={wires:wires(),hoses:hoses().filter(x=>x.a!=='V1_2').concat([h('V1_2','F1_1'),h('F1_2','A_rod')]),set:{SU:0.5,F1:5,T1:2}};
  // 타이머: Y1을 K3 NC 대신 타이머 NC로 끊고 타이머 코일은 K3 NO로
  const timed=c=>({...c,wires:c.wires.filter(x=>!(x.a==='K1_24'||x.a==='K3_12')).concat([w('K1_24','T1_11','red'),w('T1_12','V1_Ya_p','red'),
    w('R24_5_3','K3_11','red'),w('K3_14','T1_A1','red'),w('T1_A2','R0_5_5','blue')])});
  assert.deepEqual(failed(grade(d,timed(meterOut))),[]);
  const f1=failed(grade(d,meterOut));
  assert.ok(f1.some(s=>s.startsWith('B+ 도달 후 2초')),f1.join(' / '));
  // 유량조절을 거꾸로 끼우면(전진 때 조이지 않음) 속도 조절 항목에서 실패
  const rev=timed(meterOut);rev.hoses=rev.hoses.map(x=>x.b==='F1_1'?{...x,b:'F1_2'}:x.a==='F1_2'?{...x,a:'F1_1'}:x);
  const f2=failed(grade(d,rev));
  assert.ok(f2.some(s=>s.startsWith('속도 조절·압력: A+ 미터아웃')),f2.join(' / '));
  // 설정값 범위: F1을 1단으로 두면 실패
  assert.ok(failed(grade(d,{...timed(meterOut),set:{SU:0.5,F1:1,T1:2}})).some(s=>s.startsWith('설정값 F1')));
});
test('이 기준 검사: 판에 없는 실린더, 돌아오지 않는 순서, 타이머·속도 조절 모순',()=>{
  const d=myTask();
  const msg=x=>C.check(x).join(' / ');
  assert.match(msg({...d,board:{...d.board,cylB:'',S1:'A+',LS1:'',LS2:''}}),/2번째 B\+: 판에 그 액추에이터가 없어요/);
  assert.match(msg({...d,seq:['A+','B+','A-']}),/실린더 B가 사이클 끝에 후진 끝으로 돌아오지 않아요/);
  assert.match(msg({...d,seq:['A+','A+','A-']}),/2번째 A\+: A는 이미 전진 끝에/);
  assert.match(msg({...d,seq:['A-','A+','A-']}),/1번째 A−: A는 이미 후진 끝에/);
  assert.match(msg({...d,timer:{after:'B-',sec:2}}),/마지막 동작 뒤/);
  assert.match(msg({...d,meter:{'A+':'out'}}),/판에 유량조절밸브가 없어요/);
  assert.match(msg({...d,settings:[{name:'PR1',min:0.2,max:0.3}]}),/설정값 PR1: 판에 그 기기가 없어요/);
  assert.match(msg({...d,title:'',seq:[]}),/제목.*변위단계선도/);
  assert.match(msg({...d,board:{...d.board,S3:'A+',S4:'A+'}}),/A\+에 센서·리밋이 3개/);
});
test('이 기준 검사: 유압모터는 M+ … M0으로 멈춰야 하고, B 자리가 모터면 B+는 못 씀',()=>{
  const d=C.blank('hyd');d.title='모터';d.board.cylB='motor';d.board.valveB='valve43c';
  assert.deepEqual(J(C.tokens(d)),['A+','A-','M+','M-','M0']);
  d.seq=['A+','M+','M0','A-'];assert.deepEqual(J(C.check(d)),[]);
  assert.match(C.check({...d,seq:['A+','M+','A-']}).join(' / '),/모터 M가 사이클 끝에 멈추지 않아요/);
  assert.match(C.check({...d,seq:['B+','B-']}).join(' / '),/판에 그 액추에이터가 없어요/);
  const m=C.toMission(d);assert.equal(m.layout,'hyd');assert.deepEqual(J(m.set),{RV:3});
  assert.ok(C.settingsOf(d).some(s=>s.name==='RV'));
});
test('불러오기 형식 검사: 이상한 값은 버린다',()=>{
  const bad={id:'../x',title:'<b>'.repeat(40),fluid:'zzz',board:{valveA:'valve52d',cylA:'bomb',S1:'indsensor:B+',XX:'1'},
    seq:['A+','Q+','A-',5],repeat:'yes',relays:99,pressure:[0.4,'a'],timer:{after:'A+',sec:99},meter:{'A+':'fast','A-':'in'},
    settings:[{name:'F1',min:1,max:5},{name:'a b',min:0,max:1}],memo:5,img:'javascript:alert(1)'};
  const d=J(C.sanitize(bad));
  assert.notEqual(d.id,'../x');assert.equal(d.title.length,60);assert.equal(d.fluid,'air');
  assert.equal(d.board.valveA,'valve52d');assert.equal(d.board.cylA,'cylinder');assert.equal(d.board.S1,'indsensor:B+');assert.ok(!('XX' in d.board));
  assert.deepEqual(d.seq,['A+','A-']);assert.equal(d.repeat,true);assert.equal(d.relays,null);
  assert.deepEqual(d.pressure,[0.45,0.55]);assert.equal(d.timer,null);assert.deepEqual(d.meter,{'A-':'in'});
  assert.deepEqual(d.settings,[{name:'F1',min:1,max:5}]);assert.equal(d.memo,'');assert.equal(d.img,'');
  assert.equal(C.sanitize('x'),null);assert.equal(C.sanitize([1]),null);
  // 제목·메모의 꺾쇠는 화면에 그대로 글자로 (HTML로 해석되지 않게)
  assert.match(C.toMission(d).title,/^&lt;b&gt;/);
});
test('파일로 내보내기 → 불러오기 하면 같은 과제',()=>{
  const d={...myTask(),memo:'메모 한 줄\n두 줄',img:'data:image/jpeg;base64,AAAA'};
  const back=J(C.parseFile(C.exportText([d])));
  assert.equal(back.length,1);assert.deepEqual(back[0],J(d));
  assert.deepEqual(J(C.parseFile('{not json')),[]);
  assert.equal(C.parseFile(JSON.stringify(d)).length,1,'과제 하나만 든 파일도');
});
