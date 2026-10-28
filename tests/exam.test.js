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

/* ---------- 모의 공2: A+ B+ B− A− (A 양솔, B 편솔) ---------- */
const X2={
  hoses:()=>[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod'),h('D2','V2_1'),h('V2_4','B_cap'),h('V2_2','B_rod')],
  // K1 = 기동·유지(K4 NC로 해제), LS2 → K2, Y1 = K1·K2NC·K3NC, Y3 = K2·K3NC, K3 = (S1 ∥ K3)·K1, Y2 = S2·K3, K4 = S2·K3·LS1 (Y2 줄에서 갈라짐)
  wires:(y2='K3')=>[
    w('R24_6_0','K4_11','red'),w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_1_0','LS2_1','red'),w('LS2_4','K2_A1','red'),w('K2_A2','R0_5_1','blue'),
    w('R24_5_0','K1_21','red'),w('K1_24','K2_11','red'),w('K2_12','K3_41','red'),w('K3_42','V1_Ya_p','red'),w('V1_Ya_n','R0_5_2','blue'),
    w('R24_5_1','K2_21','red'),w('K2_24','K3_21','red'),w('K3_22','V2_Ya_p','red'),w('V2_Ya_n','R0_5_3','blue'),
    w('R24_1_1','S1_p','red'),w('S1_n','R0_1_0','blue'),w('S1_out','K1_41','red'),w('R24_5_2','K3_11','red'),w('K3_14','K1_41','red'),w('K1_44','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
    w('R24_1_2','S2_p','red'),w('S2_n','R0_1_1','blue'),w('S2_out',y2+'_31','red'),w(y2+'_34','V1_Yb_p','red'),w('V1_Yb_n','R0_6_0','blue'),
    w(y2+'_34','LS1_1','red'),w('LS1_4','K4_A1','red'),w('K4_A2','R0_6_1','blue')]
};
// 유지보수 1): 분배기 D2 → 감압 PR1 1번, PR1 2번 → V2 1번, 2차 0.3
const x2m1=()=>({wires:X2.wires(),hoses:X2.hoses().filter(x=>x.a!=='D2').concat([h('D2','PR1_1'),h('PR1_2','V2_1')]),set:{SU:0.5,PR1:0.3}});
// 유지보수 2): V1 4번 → 급속배기 Q1 P, Q1 A → A 후방
const x2m2=()=>{const c=x2m1();c.hoses=c.hoses.filter(x=>x.a!=='V1_4').concat([h('V1_4','Q1_P'),h('Q1_A','A_cap')]);return c;};
// 유지보수 3): K1은 K4 대신 카운터 NC로 끊고, K3 줄의 K1 접점은 K4 NC로 바꿔 사이클 끝마다 K3만 끊음(다음 사이클 시작).
// K2 NO(A 전진 끝) → 카운터 계수, PB3 → 리셋. 3번째 A+에서 K1이 꺼지고 그 사이클은 끝까지 마침
const x2m3=()=>{const c=x2m2();c.set.C1=3;
  const J={K4_11:'C1_11',K4_12:'C1_12',K1_41:'K4_21',K1_44:'K4_22'};
  c.wires=c.wires.map(x=>({...x,a:J[x.a]||x.a,b:J[x.b]||x.b})).concat([
    w('R24_6_2','K2_31','red'),w('K2_34','C1_A1','red'),w('C1_A2','R0_6_2','blue'),w('R24_1_3','PB3_13','red'),w('PB3_14','C1_R1','red'),w('C1_R2','R0_1_2','blue')]);
  return c;};

const x2=EXAMS.find(x=>x.id==='x2');
test('모의 공2 기본 동작: 고친 회로 통과, 도면대로 Y2를 K2로 켜면 실패',()=>{
  assert.deepEqual(failed(gradeStage(x2,0,{wires:X2.wires(),hoses:X2.hoses(),set:{SU:0.5}})),[]);
  const f=failed(gradeStage(x2,0,{wires:X2.wires('K2'),hoses:X2.hoses(),set:{SU:0.5}}));
  assert.ok(f.some(s=>s.startsWith('PB1 → 변위단계선도')),f.join(' / '));
});
test('모의 공2 유지보수 1) 감압: 정답 통과, 감압을 A까지 거치게 하거나 2차 압력을 안 맞추면 실패',()=>{
  assert.deepEqual(failed(gradeStage(x2,1,x2m1())),[]);
  assert.ok(failed(gradeStage(x2,1,{...x2m1(),set:{SU:0.5,PR1:0.5}})).length>0);
  const both=x2m1();both.hoses=both.hoses.filter(x=>x.a!=='D1').concat([h('PR1_2','V1_1')]);   // 포트당 호스 1개라 실제로는 못 하지만, A를 감압 출구에서 받는 경우
  assert.ok(failed(gradeStage(x2,1,{...both,hoses:both.hoses.filter(x=>!(x.a==='PR1_2'&&x.b==='V2_1')).concat([h('D2','V2_1')])})).length>0);
});
test('모의 공2 유지보수 2) 급속배기: 정답 통과, 없으면 실패',()=>{
  assert.deepEqual(failed(gradeStage(x2,2,x2m2())),[]);
  assert.ok(failed(gradeStage(x2,2,x2m1())).length>0);
});
test('모의 공2 유지보수 3) 카운터 3회 + 리셋: 정답 통과, 기본 회로 그대로면 실패',()=>{
  assert.deepEqual(failed(gradeStage(x2,3,x2m3())),[]);
  assert.ok(failed(gradeStage(x2,3,{...x2m2(),set:{SU:0.5,PR1:0.3,C1:3}})).length>0);
});

/* ---------- 모의 공3: B+ A+ A− B− (편솔 + 편솔) ---------- */
const X3={
  hoses:()=>[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod'),h('D2','V2_1'),h('V2_4','B_cap'),h('V2_2','B_rod')],
  // K1 = 기동·유지(K4 NC로 해제), Y2(B) = K1, LS2 → K2, Y1(A) = K2·K3NC, K3 = (S1 ∥ K3)·K1, K4 = S2·K3
  wires:(y1='K3_12')=>[
    w('R24_6_0','K4_11','red'),w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_0','K1_21','red'),w('K1_24','V2_Ya_p','red'),w('V2_Ya_n','R0_5_1','blue'),
    w('R24_1_0','LS2_1','red'),w('LS2_4','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
    w('R24_5_1','K2_11','red'),w('K2_14','K3_11','red'),w(y1,'V1_Ya_p','red'),w('V1_Ya_n','R0_5_3','blue'),
    w('R24_1_1','S1_p','red'),w('S1_n','R0_1_0','blue'),w('S1_out','K1_31','red'),w('R24_5_2','K3_21','red'),w('K3_24','K1_31','red'),w('K1_34','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
    w('R24_1_2','S2_p','red'),w('S2_n','R0_1_1','blue'),w('S2_out','K3_31','red'),w('K3_34','K4_A1','red'),w('K4_A2','R0_6_0','blue')]
};
// 유지보수 1): B 양솔. Y2(B 전진) = K1·K3NC (전진 끝 기억 전까지), Y3(B 후진) = S2·K3 (K4와 나란히)
const x3m1=()=>({wires:X3.wires().filter(x=>!(x.a==='K1_24'&&x.b==='V2_Ya_p')).concat([w('K1_24','K3_41','red'),w('K3_42','V2_Ya_p','red'),
  w('K3_34','V2_Yb_p','red'),w('V2_Yb_n','R0_6_1','blue')]),hoses:X3.hoses(),set:{SU:0.5}});
// 유지보수 2): B 후방 줄 F1, 전방 줄 F2 (둘 다 1번이 밸브 쪽), 5단 = 2초
const x3m2=()=>{const c=x3m1();c.set.F1=5;c.set.F2=5;
  c.hoses=c.hoses.filter(x=>x.a!=='V2_4'&&x.a!=='V2_2').concat([h('V2_4','F1_1'),h('F1_2','B_cap'),h('V2_2','F2_1'),h('F2_2','B_rod')]);return c;};
// 유지보수 3): K5 = (PB2 ∥ K5)·PB3NC, K1 줄에 (K5·LS1) 가지를 더해 B가 돌아오면 다시 시작
const x3m3=()=>{const c=x3m2();
  c.wires=c.wires.concat([w('R24_1_3','PB3_11','red'),w('PB3_12','PB2_13','red'),w('PB2_14','K5_A1','red'),w('PB3_12','K5_11','red'),w('K5_14','K5_A1','red'),w('K5_A2','R0_6_2','blue'),
    w('K4_12','K5_21','red'),w('K5_24','LS1_1','red'),w('LS1_4','K1_A1','red')]);return c;};

const x3=EXAMS.find(x=>x.id==='x3');
test('모의 공3 기본 동작: 고친 회로 통과, 도면대로 Y1 줄 K3를 NO로 쓰면 실패',()=>{
  assert.deepEqual(failed(gradeStage(x3,0,{wires:X3.wires(),hoses:X3.hoses(),set:{SU:0.5}})),[]);
  const f=failed(gradeStage(x3,0,{wires:X3.wires('K3_14'),hoses:X3.hoses(),set:{SU:0.5}}));
  assert.ok(f.some(s=>s.startsWith('PB1 → 변위단계선도')),f.join(' / '));
});
test('모의 공3 유지보수 1) 양솔 교체: 정답 통과, 편솔 그대로면 교체 항목에서 실패',()=>{
  const two={...x3,board:{...x3.board,valveB:'valve52d'}};
  assert.deepEqual(failed(gradeStage(two,1,x3m1())),[]);
  assert.deepEqual(failed(gradeStage(x3,1,{wires:X3.wires(),hoses:X3.hoses(),set:{SU:0.5}})).map(s=>s.split(' — ')[0]),['B 밸브를 5/2 양솔로 교체']);
});
test('모의 공3 유지보수 2) B 양쪽 미터아웃: 정답 통과, 한쪽만 끼우면 실패',()=>{
  const two={...x3,board:{...x3.board,valveB:'valve52d'}};
  assert.deepEqual(failed(gradeStage(two,2,x3m2())),[]);
  const one=x3m2();one.hoses=one.hoses.filter(x=>!x.a.startsWith('V2_2')&&!x.a.startsWith('F2')).concat([h('V2_2','B_rod')]);
  assert.ok(failed(gradeStage(two,2,one)).length>0);
});
test('모의 공3 유지보수 3) 연속/연속정지: 정답 통과, K5 없이는 실패',()=>{
  const two={...x3,board:{...x3.board,valveB:'valve52d'}};
  assert.deepEqual(failed(gradeStage(two,3,x3m3())),[]);
  assert.ok(failed(gradeStage(two,3,x3m2())).length>0);
});
