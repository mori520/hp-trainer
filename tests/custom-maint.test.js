/* 내 과제의 유지보수 틀(custom.js maint: counter·estop·contstop·rules) → 모의 과제 단계로 바뀌어 채점되는지.
   실린더 A 하나(양솔, LS1 = A 후진 끝, LS2 = A 전진 끝), A+ A−. 단계마다 그 단계용 회로로 채점한다 (정답 회로는 여기에만) */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {w,h}=require('./fixtures.js');
const {get}=load();
const C=get('CUSTOM');
const J=x=>JSON.parse(JSON.stringify(x));
const failed=r=>r.filter(i=>!i.ok).map(i=>i.name+(i.detail?' — '+i.detail:''));

function gradeStage(def,c,k){
  const mis=C.toMission(def),L=get('LAYOUTS')[mis.layout];
  get('configure')({parts:get('makeParts')(L,mis.board)});
  const cc=get('withJumpers')(L,{wires:c.wires,hoses:c.hoses,set:Object.assign({},mis.set,c.set)});
  return J(get('gradeMission')({...mis,grading:mis.exam.stages[k].grading},cc));
}
function oneCyl(maint){
  const d=C.blank('air');
  Object.assign(d,{title:'A 왕복',board:{cylA:'cylinder',valveA:'valve52d',LS1:'A-',LS2:'A+'},seq:['A+','A-'],pressure:null,maint});
  return d;
}
const hA=()=>[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod')];
// 기본: Y1 = PB1·LS1, Y2 = LS2
const baseW=()=>[w('R24_1_0','PB1_13','red'),w('PB1_14','LS1_1','red'),w('LS1_4','V1_Ya_p','red'),w('V1_Ya_n','R0_5_3','blue'),
  w('R24_1_4','LS2_1','red'),w('LS2_4','V1_Yb_p','red'),w('V1_Yb_n','R0_5_4','blue')];
// 연속 릴레이 K1: (PB2 ∥ K1) → 코일, K1 NO를 PB1과 나란히. cut = 자기유지를 끊는 NC 접점 [입구, 출구]
const contW=(feed,cut)=>[w(feed,cut[0],'red'),w(cut[1],'PB2_13','red'),w('PB2_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w(cut[1],'K1_21','red'),w('K1_24','K1_A1','red'),w('R24_5_1','K1_11','red'),w('K1_14','LS1_1','red')];
// 카운터: LS2 NO로 세고 카운터 NC로 K1을 끊음, PB3로 리셋. lamp done = 카운터 NO로 H2, run = K1 NO로 H2
const counterW=lamp=>baseW().concat(contW('R24_4_0',['C1_11','C1_12']),[
  w('LS2_4','C1_A1','red'),w('C1_A2','R0_4_0','blue'),w('R24_1_2','PB3_13','red'),w('PB3_14','C1_R1','red'),w('C1_R2','R0_4_1','blue')],
  lamp==='done'?[w('R24_4_1','C1_21','red'),w('C1_24','H2_p','red'),w('H2_n','R0_2_0','blue')]:
  lamp==='run'?[w('R24_5_2','K1_31','red'),w('K1_34','H2_p','red'),w('H2_n','R0_2_0','blue')]:[]);

test('유지보수 틀 → 단계: 기본 동작 다음에 차례대로, 이름·카운터 설정 검사',()=>{
  const d=oneCyl([{type:'counter',start:'PB2',n:3,lamp:'H2',lampMode:'done'},{type:'estop',start:'PB2',lamp:'H1'},{type:'contstop'}]);
  assert.deepEqual(J(C.check(d)),[]);
  const st=C.toMission(d).exam.stages;
  assert.deepEqual(J(st.map(s=>s.name)),['기본 동작','유지보수 1) 연속 3회 + 리셋','유지보수 2) 비상정지 + 램프','유지보수 3) 연속동작 / 연속정지']);
  assert.deepEqual(J(st[1].grading.settingsCheck),[{name:'C1',min:3,max:3,label:'카운터 3회'}]);
  assert.equal(st[1].grading.repeat,2,'끝나면 처음 자리라 2회 반복');
  assert.equal(C.toMission(oneCyl([])).exam.stages[0].name,'평가','유지보수가 없으면 단계 이름은 그대로');
});
test('유지보수 틀 카운터: 맞는 회로는 통과, 카운터가 연속을 안 끊으면·완료 램프가 없으면 실패',()=>{
  const d=oneCyl([{type:'counter',start:'PB2',n:3,lamp:'H2',lampMode:'done'}]);
  const ok={wires:counterW('done'),hoses:hA(),set:{C1:3}};
  assert.deepEqual(failed(gradeStage(d,ok,1)),[]);
  // 카운터 NC를 거치지 않고 24V를 바로 → 3회 뒤에도 계속 돈다
  const noCut={...ok,wires:counterW('done').filter(x=>x.a!=='R24_4_0').concat([w('R24_4_0','C1_12','red')])};
  assert.ok(failed(gradeStage(d,noCut,1)).some(s=>s.startsWith('PB2 → 3사이클 하고 정지')));
  assert.ok(failed(gradeStage(d,{...ok,wires:counterW('')},1)).some(s=>/H2 점등/.test(s)));
  assert.ok(failed(gradeStage(d,{...ok,set:{C1:2}},1)).some(s=>s.startsWith('카운터 3회')));
});
test('유지보수 틀 카운터: 램프 "도는 동안 켜짐"은 앞 단계 기록에 이어서(cont) 순서를 본다',()=>{
  const d=oneCyl([{type:'counter',start:'PB2',n:2,lamp:'H2',lampMode:'run'}]);
  assert.ok(C.toMission(d).exam.stages[1].grading.steps.some(s=>s.cont),'cont 단계가 있다');
  assert.deepEqual(failed(gradeStage(d,{wires:counterW('run'),hoses:hA(),set:{C1:2}},1)),[]);
  // 완료 램프(카운터 NO)로 달면 도는 동안 꺼져 있어 실패
  assert.ok(failed(gradeStage(d,{wires:counterW('done'),hoses:hA(),set:{C1:2}},1)).some(s=>/도는 동안 H2 점등/.test(s)));
});
test('유지보수 틀 연속정지: PB3 NC로 연속 릴레이를 끊으면 통과, 못 멈추면 실패',()=>{
  const d=oneCyl([{type:'contstop'}]);
  const wires=baseW().concat(contW('R24_1_3',['PB3_11','PB3_12']));
  assert.deepEqual(failed(gradeStage(d,{wires,hoses:hA()},1)),[]);
  const noStop=wires.filter(x=>x.a!=='R24_1_3').concat([w('R24_1_3','PB3_12','red')]);
  assert.ok(failed(gradeStage(d,{wires:noStop,hoses:hA()},1)).length>0);
});
test('유지보수 틀 비상정지: ES NC로 제어 모선, ES NO로 램프 + 후진 릴레이면 통과. 양솔인데 후진을 안 켜면 실패',()=>{
  const d=oneCyl([{type:'estop',start:'PB2',lamp:'H1'}]);
  // 모선 = ES_12. 연속 K1은 모선에서 (따로 끊는 접점 없음 → 비상정지로만 꺼짐)
  const bus=[w('R24_1_0','ES_11','red'),w('ES_12','PB1_13','red'),w('ES_12','LS2_1','red'),
    w('ES_12','PB2_13','red'),w('PB2_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),w('ES_12','K1_21','red'),w('K1_24','K1_A1','red'),
    w('ES_12','K1_11','red'),w('K1_14','LS1_1','red'),
    w('PB1_14','LS1_1','red'),w('LS1_4','V1_Ya_p','red'),w('V1_Ya_n','R0_5_3','blue'),w('LS2_4','V1_Yb_p','red'),w('V1_Yb_n','R0_5_4','blue'),
    w('R24_1_1','ES_13','red'),w('ES_14','H1_p','red'),w('H1_n','R0_2_0','blue')];
  const back=[w('ES_14','K2_A1','red'),w('K2_A2','R0_5_1','blue'),w('R24_5_2','K2_11','red'),w('K2_14','V1_Yb_p','red')];
  assert.deepEqual(failed(gradeStage(d,{wires:bus.concat(back),hoses:hA()},1)),[]);
  const f=failed(gradeStage(d,{wires:bus,hoses:hA()},1));
  assert.ok(f.some(s=>s.startsWith('비상정지 ON → 모두 처음 자리')),f.join(' / '));
});
test('유지보수 틀 규칙: 같은 순서 + 미터아웃·밸브 교체 확인, 기준 검사',()=>{
  const d=oneCyl([{type:'rules',timer:null,meter:{'A+':'out'},settings:[],swap:{}}]);
  d.board.MA2='fcv';
  assert.deepEqual(J(C.check(d)),[]);
  const straight={wires:baseW(),hoses:hA(),set:{F1:5}};
  const metered={...straight,hoses:hA().filter(x=>x.a!=='V1_2').concat([h('V1_2','F1_1'),h('F1_2','A_rod')])};
  assert.deepEqual(failed(gradeStage(d,metered,1)),[]);
  assert.ok(failed(gradeStage(d,straight,1)).some(s=>s.startsWith('속도 조절·압력: A+ 미터아웃')));
  // 밸브 교체: 처음부터 양솔이면 기준 검사가 알려 주고, 편솔에서 시작하면 partCheck
  const sw=oneCyl([{type:'rules',timer:null,meter:{},settings:[],swap:{valveA:'valve52d'}}]);
  assert.match(C.check(sw).join(' / '),/처음부터 5\/2 양솔/);
  sw.board.valveA='valve52s';
  assert.deepEqual(J(C.toMission(sw).exam.stages[1].grading.partCheck),[{slot:'valveA',type:'valve52d',label:'A 밸브를 5/2 양솔(으)로 교체'}]);
  assert.match(C.check(oneCyl([{type:'rules',timer:null,meter:{},settings:[],swap:{}}])).join(' / '),/유지보수 1\) 규칙을 하나 이상/);
  assert.match(C.check(oneCyl([{type:'rules',timer:null,meter:{'A-':'in'},settings:[],swap:{}}])).join(' / '),/유지보수 1\) 속도 조절\(미터인\): 판에 유량조절밸브가 없어요/);
});
test('불러오기: 유지보수 틀도 형식 검사 (모르는 틀·이상한 값은 버림, 3개까지)',()=>{
  const d=J(C.sanitize({...oneCyl([]),maint:[{type:'counter',start:'PB9',n:99,lamp:'H7',lampMode:'zz'},{type:'boom'},{type:'estop',lamp:'H2'},
    {type:'rules',timer:{after:'A+',sec:3},meter:{'A-':'out','Q+':'in'},swap:{valveA:'valve52s',valveX:'a'}},{type:'contstop'}]}));
  assert.deepEqual(d.maint,[{type:'counter',start:'PB2',n:3,lamp:'',lampMode:'done'},{type:'estop',start:'PB2',lamp:'H2'},
    {type:'rules',timer:{after:'A+',sec:3},meter:{'A-':'out'},settings:[],swap:{valveA:'valve52s'}}]);
  assert.deepEqual(J(C.parseFile(C.exportText([oneCyl([{type:'contstop'}])])))[0].maint,[{type:'contstop'}]);
});
