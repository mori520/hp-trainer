/* 모의 과제(exams.js): 고친 정답 회로는 모든 단계를 통과하고, 도면(틀린 곳 포함) 그대로 배선하면 기본 동작에서 떨어진다.
   정답 회로는 여기(테스트)에만 둔다. 앱 채점은 정답과 비교하지 않고 동작으로만 본다 */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {w,h}=require('./fixtures.js');
const {get}=load();
const EXAMS=get('EXAMS');

// k번째 단계까지의 판(앞 단계 board를 모두 더함)으로 그 단계 채점
function gradeStage(x,k,c){
  const board=get('examBoard')(x,k);
  get('configure')({parts:get('makeParts')(get('LAYOUTS')[x.layout],board)});
  const cc=get('withJumpers')(get('LAYOUTS')[x.layout],{wires:c.wires,hoses:c.hoses,set:Object.assign({},x.set,c.set)});
  return JSON.parse(JSON.stringify(get('gradeMission')({...x,grading:x.exam.stages[k].grading},cc)));
}
const failed=r=>r.filter(i=>!i.ok).map(i=>i.name+(i.detail?' — '+i.detail:''));

/* ---------- 모의 공1: A+ B+ A− B− ---------- */
const X1={
  hoses:()=>[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod'),h('D2','V2_1'),h('V2_4','B_cap'),h('V2_2','B_rod')],
  // K1 = 기동·유지(K4 NC로 해제), Y1 = K1·K3NC, S1 → K2, Y2 = K2, K3 = K1·(LS2 ∥ K3), Y3 = S2·K3, K4 = K3·LS1
  wires:(s1='S1')=>[
    w('R24_6_0','K4_11','red'),w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_0','K1_21','red'),w('K1_24','K3_11','red'),w('K3_12','V1_Ya_p','red'),w('V1_Ya_n','R0_5_1','blue'),
    w('R24_1_0',s1+'_p','red'),w(s1+'_n','R0_1_0','blue'),w(s1+'_out','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
    w('R24_5_1','K2_11','red'),w('K2_14','V2_Ya_p','red'),w('V2_Ya_n','R0_5_3','blue'),
    w('R24_5_2','K1_31','red'),w('K1_34','LS2_1','red'),w('LS2_4','K3_A1','red'),w('K1_34','K3_21','red'),w('K3_24','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
    w('R24_1_1','S2_p','red'),w('S2_n','R0_1_1','blue'),w('S2_out','K3_31','red'),w('K3_34','V2_Yb_p','red'),w('V2_Yb_n','R0_6_0','blue'),
    w('R24_6_1','K3_41','red'),w('K3_44','LS1_1','red'),w('LS1_4','K4_A1','red'),w('K4_A2','R0_6_1','blue')]
};
// 유지보수 1): A 전방 줄에 F1 미터아웃 (밸브 2번 → F1 1번, F1 2번 → A 전방), 5단 = 2초
const x1m1=()=>({wires:X1.wires(),hoses:X1.hoses().filter(x=>x.a!=='V1_2').concat([h('V1_2','F1_1'),h('F1_2','A_rod')]),set:{SU:0.5,F1:5}});
// 유지보수 2): Y1을 K3 NC 대신 타이머 NC로 끊고, 타이머 코일은 K3 NO(11-14)로
const x1m2=()=>{const c=x1m1();c.set.T1=2;
  c.wires=c.wires.filter(x=>!(x.a==='K1_24'||x.a==='K3_12')).concat([w('K1_24','T1_11','red'),w('T1_12','V1_Ya_p','red'),
    w('R24_5_3','K3_11','red'),w('K3_14','T1_A1','red'),w('T1_A2','R0_5_5','blue')]);return c;};
// 유지보수 3): 줄마다 24V를 비상정지 NC(11-12)를 거쳐 받는다 (센서 전원은 그대로), NO(13-14)로 H1
const x1m3=()=>{const c=x1m2();
  c.wires=c.wires.map(x=>x.a.startsWith('R24_')&&!/_p$/.test(x.b)?{...x,a:'ES_12'}:x)
    .concat([w('R24_1_2','ES_11','red'),w('R24_1_3','ES_13','red'),w('ES_14','H1_p','red'),w('H1_n','R0_2_0','blue')]);return c;};

const x1=EXAMS.find(x=>x.id==='x1');
test('모의 공1 기본 동작: 고친 회로 통과, 압력을 안 맞추면(0.3) 실패',()=>{
  assert.deepEqual(failed(gradeStage(x1,0,{wires:X1.wires(),hoses:X1.hoses(),set:{SU:0.5}})),[]);
  assert.deepEqual(failed(gradeStage(x1,0,{wires:X1.wires(),hoses:X1.hoses(),set:{}})).map(s=>s.split(' — ')[0]),['서비스 유닛 압력 0.5±0.05 MPa']);
});
test('모의 공1 기본 동작: 도면대로 K2를 S2로 켜면 변위단계선도에서 실패',()=>{
  const f=failed(gradeStage(x1,0,{wires:X1.wires('S2').filter((x,i,a)=>a.findIndex(y=>y.a===x.a&&y.b===x.b)===i),hoses:X1.hoses(),set:{SU:0.5}}));
  assert.ok(f.some(s=>s.startsWith('PB1 → 변위단계선도')),f.join(' / '));
});
test('모의 공1 유지보수 1) 미터아웃: 정답 통과, 유량조절을 안 끼우거나 거꾸로 끼우면 실패',()=>{
  assert.deepEqual(failed(gradeStage(x1,1,x1m1())),[]);
  assert.ok(failed(gradeStage(x1,1,{wires:X1.wires(),hoses:X1.hoses(),set:{SU:0.5}})).length>0);
  const rev=x1m1();rev.hoses=rev.hoses.map(x=>x.b==='F1_1'?{...x,b:'F1_2'}:x.a==='F1_2'?{...x,a:'F1_1'}:x);
  assert.ok(failed(gradeStage(x1,1,rev)).length>0);
});
test('모의 공1 유지보수 2) 타이머 2초: 정답 통과, 타이머를 안 쓰면 머무는 시간에서 실패',()=>{
  assert.deepEqual(failed(gradeStage(x1,2,x1m2())),[]);
  const f=failed(gradeStage(x1,2,{...x1m1(),set:{SU:0.5,F1:5,T1:2}}));
  assert.ok(f.some(s=>s.startsWith('B+ 도달 후 2초')),f.join(' / '));
});
test('모의 공1 유지보수 3) 비상정지 + 램프: 정답 통과, 비상정지를 안 달면 실패',()=>{
  assert.deepEqual(failed(gradeStage(x1,3,x1m3())),[]);
  assert.ok(failed(gradeStage(x1,3,x1m2())).length>0);
});
