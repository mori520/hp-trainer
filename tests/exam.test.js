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

/* ---------- 모의 공4: B+ A+ B− A− (양솔 + 양솔) ---------- */
const X4={
  hoses:()=>[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod'),h('D2','V2_1'),h('V2_4','B_cap'),h('V2_2','B_rod')],
  // K1 = 기동·유지(K4 NC로 해제), Y3(B+) = K1·K2NC, K2 = (S2 ∥ K2)·K1, Y1(A+) = K2·K3NC, K3 = (LS2 ∥ K3)·K2,
  // Y4(B−) = K3, Y2(A−) = S1·K3, K4 = S1·K3·LS1 (Y2 줄에서 갈라짐)
  wires:(y1='K3_11',y1b='K3_12')=>[
    w('R24_6_0','K4_11','red'),w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_0','K1_21','red'),w('K1_24','K2_11','red'),w('K2_12','V2_Ya_p','red'),w('V2_Ya_n','R0_5_1','blue'),
    w('R24_1_0','S2_p','red'),w('S2_n','R0_1_0','blue'),w('S2_out','K1_31','red'),w('R24_5_1','K2_21','red'),w('K2_24','K1_31','red'),w('K1_34','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
    w('R24_5_2','K2_31','red'),w('K2_34',y1,'red'),w(y1b,'V1_Ya_p','red'),w('V1_Ya_n','R0_5_3','blue'),
    w('R24_1_1','LS2_1','red'),w('LS2_4','K2_41','red'),w('R24_5_3','K3_21','red'),w('K3_24','K2_41','red'),w('K2_44','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
    w('R24_6_1','K3_31','red'),w('K3_34','V2_Yb_p','red'),w('V2_Yb_n','R0_6_0','blue'),
    w('R24_1_2','S1_p','red'),w('S1_n','R0_1_1','blue'),w('S1_out','K3_41','red'),w('K3_44','V1_Yb_p','red'),w('V1_Yb_n','R0_6_1','blue'),
    w('K3_44','LS1_1','red'),w('LS1_4','K4_A1','red'),w('K4_A2','R0_6_2','blue')]
};
// 유지보수 1): Y4는 타이머 NO(11-14)로, 타이머 코일은 K3 NO(31-34)로
const x4m1=()=>({wires:X4.wires().filter(x=>x.a!=='K3_34').concat([w('K3_34','T1_A1','red'),w('T1_A2','R0_6_3','blue'),
  w('R24_3_0','T1_11','red'),w('T1_14','V2_Yb_p','red')]),hoses:X4.hoses(),set:{SU:0.5,T1:3}});
// 유지보수 2): V1 2번 → F1 1번, F1 2번 → A 전방 / V1 4번 → Q1 P, Q1 A → A 후방
const x4m2=()=>{const c=x4m1();c.set.F1=5;
  c.hoses=c.hoses.filter(x=>x.a!=='V1_2'&&x.a!=='V1_4').concat([h('V1_2','F1_1'),h('F1_2','A_rod'),h('V1_4','Q1_P'),h('Q1_A','A_cap')]);return c;};
// 유지보수 3): K1은 카운터 NC로 끊고, K2 줄의 K1 접점은 K4 NC로. S2 출력 → 카운터 계수, 카운터 NO → H2, PB3 → 리셋
const x4m3=()=>{const c=x4m2();c.set.C1=2;
  const J={K4_11:'C1_11',K4_12:'C1_12',K1_31:'K4_21',K1_34:'K4_22'};
  c.wires=c.wires.map(x=>({...x,a:J[x.a]||x.a,b:J[x.b]||x.b})).concat([
    w('S2_out','C1_A1','red'),w('C1_A2','R0_4_0','blue'),w('R24_4_0','C1_21','red'),w('C1_24','H2_p','red'),w('H2_n','R0_2_0','blue'),
    w('R24_1_3','PB3_13','red'),w('PB3_14','C1_R1','red'),w('C1_R2','R0_1_2','blue')]);
  return c;};

const x4=EXAMS.find(x=>x.id==='x4');
test('모의 공4 기본 동작: 고친 회로 통과, 도면대로 Y1 줄 b접점을 K4로 쓰면 실패',()=>{
  assert.deepEqual(failed(gradeStage(x4,0,{wires:X4.wires(),hoses:X4.hoses(),set:{SU:0.5}})),[]);
  const f=failed(gradeStage(x4,0,{wires:X4.wires('K4_21','K4_22'),hoses:X4.hoses(),set:{SU:0.5}}));
  assert.ok(f.some(s=>s.startsWith('PB1 → 변위단계선도')),f.join(' / '));
});
test('모의 공4 유지보수 1) 타이머 3초: 정답 통과, K3 그대로면 머무는 시간에서 실패',()=>{
  assert.deepEqual(failed(gradeStage(x4,1,x4m1())),[]);
  const f=failed(gradeStage(x4,1,{wires:X4.wires(),hoses:X4.hoses(),set:{SU:0.5,T1:3}}));
  assert.ok(f.some(s=>s.startsWith('A+ 도달 후 3초')),f.join(' / '));
});
test('모의 공4 유지보수 2) 미터아웃 + 급속배기: 정답 통과, 급속배기가 없으면 실패',()=>{
  assert.deepEqual(failed(gradeStage(x4,2,x4m2())),[]);
  const c=x4m2();c.hoses=c.hoses.filter(x=>x.a!=='V1_4'&&x.a!=='Q1_A').concat([h('V1_4','A_cap')]);
  assert.ok(failed(gradeStage(x4,2,c)).length>0);
});
test('모의 공4 유지보수 3) 카운터 2회 + 램프: 정답 통과, 기본 회로 그대로면 실패',()=>{
  assert.deepEqual(failed(gradeStage(x4,3,x4m3())),[]);
  assert.ok(failed(gradeStage(x4,3,{...x4m2(),set:{SU:0.5,T1:3,F1:5,C1:2}})).length>0);
});

/* ---------- 모의 유1: A+ B+ B− A− (4/2 + 4/3 중립 블록) ---------- */
const Y1={
  hoses:()=>[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','A_rod'),h('HP2','V2_P'),h('V2_T','HT2'),h('V2_A','B_cap'),h('V2_B','B_rod')],
  // K1 = 기동·유지(K4 NC로 해제), Y1(A) = K1, S1(B 후진 끝) → K2, Y2(B+) = LS2·K3NC, K3 = (S2 ∥ K3)·K1, Y3(B−) = K3·K2NC, K4 = K3·K2
  wires:(ls='LS2')=>[
    w('R24_6_0','K4_11','red'),w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_0','K1_21','red'),w('K1_24','V1_Ya_p','red'),w('V1_Ya_n','R0_5_1','blue'),
    w('R24_1_0','S1_p','red'),w('S1_n','R0_1_0','blue'),w('S1_out','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
    w('R24_1_1',ls+'_1','red'),w(ls+'_4','K3_11','red'),w('K3_12','V2_Ya_p','red'),w('V2_Ya_n','R0_5_3','blue'),
    w('R24_1_2','S2_p','red'),w('S2_n','R0_1_1','blue'),w('S2_out','K1_31','red'),w('R24_5_1','K3_21','red'),w('K3_24','K1_31','red'),w('K1_34','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
    w('R24_5_2','K3_31','red'),w('K3_34','K2_11','red'),w('K2_12','V2_Yb_p','red'),w('V2_Yb_n','R0_6_0','blue'),
    w('R24_6_1','K3_41','red'),w('K3_44','K2_21','red'),w('K2_24','K4_A1','red'),w('K4_A2','R0_6_1','blue')]
};
// 유지보수 1): B 전방 줄 미터인 (V2 B → F1 2번, F1 1번 → B 전방), 5단
const y1m1=()=>({wires:Y1.wires(),hoses:Y1.hoses().filter(x=>x.a!=='V2_B').concat([h('V2_B','F1_2'),h('F1_1','B_rod')]),set:{RV:4,F1:5}});
// 유지보수 2): S2를 떼고 B 후방 줄 압력스위치 PS1 NO(1-4)로 K3를 켬
const y1m2=()=>{const c=y1m1();c.set.PS1=3;
  c.hoses=c.hoses.filter(x=>x.a!=='V2_A').concat([h('V2_A','PS1_a'),h('PS1_b','B_cap')]);
  c.wires=c.wires.filter(x=>!x.a.startsWith('S2_')&&!x.b.startsWith('S2_')).concat([w('R24_1_2','PS1_1','red'),w('PS1_4','K1_31','red')]);return c;};
// 유지보수 3): 줄마다 24V를 비상정지 NC를 거쳐 받는다 (센서 전원은 그대로), NO로 H1
const y1m3=()=>{const c=y1m2();
  c.wires=c.wires.map(x=>x.a.startsWith('R24_')&&!/_p$/.test(x.b)?{...x,a:'ES_12'}:x)
    .concat([w('R24_1_3','ES_11','red'),w('R24_1_4','ES_13','red'),w('ES_14','H1_p','red'),w('H1_n','R0_2_0','blue')]);return c;};

const y1=EXAMS.find(x=>x.id==='y1');
test('모의 유1 기본 동작: 고친 회로 통과, 릴리프를 안 맞추면 실패, 도면대로 LS1로 쓰면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y1,0,{wires:Y1.wires(),hoses:Y1.hoses(),set:{RV:4}})),[]);
  assert.deepEqual(failed(gradeStage(y1,0,{wires:Y1.wires(),hoses:Y1.hoses(),set:{}})).map(s=>s.split(' — ')[0]),['릴리프 압력 4±0.2 MPa']);
  const f=failed(gradeStage(y1,0,{wires:Y1.wires('LS1'),hoses:Y1.hoses(),set:{RV:4}}));
  assert.ok(f.some(s=>s.startsWith('PB1 → 변위단계선도')),f.join(' / '));
});
test('모의 유1 유지보수 1) 미터인: 정답 통과, 미터아웃 방향으로 끼우면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y1,1,y1m1())),[]);
  const out=y1m1();out.hoses=out.hoses.map(x=>x.b==='F1_2'?{...x,b:'F1_1'}:x.a==='F1_1'?{...x,a:'F1_2'}:x);
  assert.ok(failed(gradeStage(y1,1,out)).length>0);
});
test('모의 유1 유지보수 2) 압력스위치: 정답 통과, S2 배선 그대로(센서가 빠짐)면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y1,2,y1m2())),[]);
  const old=y1m1();old.set.PS1=3;old.hoses=old.hoses.filter(x=>x.a!=='V2_A').concat([h('V2_A','PS1_a'),h('PS1_b','B_cap')]);
  old.wires=old.wires.filter(x=>!x.a.startsWith('S2_')&&!x.b.startsWith('S2_'));   // 판에서 S2가 빠지면 S2 선도 빠진다
  assert.ok(failed(gradeStage(y1,2,old)).length>0);
});
test('모의 유1 유지보수 3) 비상정지 + 램프: 정답 통과 (B는 중간에 멈춤), 비상정지를 안 달면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y1,3,y1m3())),[]);
  assert.ok(failed(gradeStage(y1,3,y1m2())).length>0);
});

/* ---------- 모의 유2: M+ (2초) A+ A− M0 (4/2 + 2/2 모터) ---------- */
const Y2={
  hoses:()=>[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','A_rod'),h('HP2','V2_P'),h('V2_A','M_a'),h('M_b','HT2')],
  // K1 = 기동·유지(K3 NC로 해제), Y2(모터) = K1, T1 = K1, Y1(A) = T1·K2NC, K2 = (LS2 ∥ K2)·K1, K3 = K2·LS1
  wires:(ls='LS1')=>[
    w('R24_6_0','K3_11','red'),w('K3_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K3_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_0','K1_21','red'),w('K1_24','V2_Ya_p','red'),w('V2_Ya_n','R0_5_1','blue'),
    w('R24_5_1','K1_31','red'),w('K1_34','T1_A1','red'),w('T1_A2','R0_3_0','blue'),
    w('R24_3_1','T1_11','red'),w('T1_14','K2_11','red'),w('K2_12','V1_Ya_p','red'),w('V1_Ya_n','R0_5_2','blue'),
    w('R24_1_0','LS2_1','red'),w('LS2_4','K1_41','red'),w('R24_5_2','K2_21','red'),w('K2_24','K1_41','red'),w('K1_44','K2_A1','red'),w('K2_A2','R0_5_3','blue'),
    w('R24_5_3','K2_31','red'),w('K2_34',ls+'_1','red'),w(ls+'_4','K3_A1','red'),w('K3_A2','R0_5_4','blue')]
};
// 유지보수 1): V1 A → 감압 PR1 1번, PR1 2번 → A 후방, 2.0 MPa
const y2m1=()=>({wires:Y2.wires(),hoses:Y2.hoses().filter(x=>x.a!=='V1_A').concat([h('V1_A','PR1_1'),h('PR1_2','A_cap')]),set:{RV:4,T1:2,PR1:2}});
// 유지보수 2): A 전방 줄 미터인 (V1 B → F1 2번, F1 1번 → A 전방)
const y2m2=()=>{const c=y2m1();c.set.F1=5;c.hoses=c.hoses.filter(x=>x.a!=='V1_B').concat([h('V1_B','F1_2'),h('F1_1','A_rod')]);return c;};
// 유지보수 3): K1은 K3 대신 카운터 NC로, K2 줄의 K1 접점은 K3 NC로. K2 NO → 카운터 계수, PB3 → 리셋
const y2m3=()=>{const c=y2m2();c.set.C1=3;
  const J={K3_11:'C1_11',K3_12:'C1_12',K1_41:'K3_21',K1_44:'K3_22'};
  c.wires=c.wires.map(x=>({...x,a:J[x.a]||x.a,b:J[x.b]||x.b})).concat([
    w('R24_6_1','K2_41','red'),w('K2_44','C1_A1','red'),w('C1_A2','R0_6_0','blue'),w('R24_1_1','PB3_13','red'),w('PB3_14','C1_R1','red'),w('C1_R2','R0_1_0','blue')]);
  return c;};

const y2=EXAMS.find(x=>x.id==='y2');
test('모의 유2 기본 동작: 고친 회로 통과, 타이머를 안 맞추면 실패, 도면대로 LS2로 쓰면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y2,0,{wires:Y2.wires(),hoses:Y2.hoses(),set:{RV:4,T1:2}})),[]);
  assert.ok(failed(gradeStage(y2,0,{wires:Y2.wires(),hoses:Y2.hoses(),set:{RV:4}})).length>0);
  const f=failed(gradeStage(y2,0,{wires:Y2.wires('LS2'),hoses:Y2.hoses(),set:{RV:4,T1:2}}));
  assert.ok(f.some(s=>s.startsWith('PB1 → 변위단계선도')),f.join(' / '));
});
test('모의 유2 유지보수 1) 감압 2.0: 정답 통과, 2차 압력을 안 맞추면(4.0) 실패',()=>{
  assert.deepEqual(failed(gradeStage(y2,1,y2m1())),[]);
  const f=failed(gradeStage(y2,1,{...y2m1(),set:{RV:4,T1:2,PR1:4}}));
  assert.ok(f.some(s=>/작동압력 4\.00 MPa/.test(s)),f.join(' / '));
});
test('모의 유2 유지보수 2) 후진 미터인: 정답 통과, 없으면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y2,2,y2m2())),[]);
  assert.ok(failed(gradeStage(y2,2,y2m1())).length>0);
});
test('모의 유2 유지보수 3) 모터를 돌린 채 A 3회: 정답 통과, 그대로면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y2,3,y2m3())),[]);
  assert.ok(failed(gradeStage(y2,3,{...y2m2(),set:{RV:4,T1:2,PR1:2,F1:5,C1:3}})).length>0);
});

/* ---------- 모의 유3: 하중 A+ B+ A− B− (4/3 중립 블록 + 4/2) ---------- */
const Y3={
  hoses:()=>[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','A_rod'),h('HP2','V2_P'),h('V2_T','HT2'),h('V2_A','B_cap'),h('V2_B','B_rod')],
  // K1 = 기동·유지(K4 NC로 해제), Y1(A+) = K1·K2NC, K2 = (LS2 ∥ K2)·K1, Y3(B) = K2, K3 = (S2 ∥ K3)·K1, Y2(A−) = K3, K4 = K3·LS1
  wires:(y1='K2_12')=>[
    w('R24_6_0','K4_11','red'),w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_0','K1_21','red'),w('K1_24','K2_11','red'),w(y1,'V1_Ya_p','red'),w('V1_Ya_n','R0_5_1','blue'),
    w('R24_1_0','LS2_1','red'),w('LS2_4','K1_31','red'),w('R24_5_1','K2_21','red'),w('K2_24','K1_31','red'),w('K1_34','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
    w('R24_5_2','K2_31','red'),w('K2_34','V2_Ya_p','red'),w('V2_Ya_n','R0_5_3','blue'),
    w('R24_1_1','S2_p','red'),w('S2_n','R0_1_0','blue'),w('S2_out','K1_41','red'),w('R24_5_3','K3_11','red'),w('K3_14','K1_41','red'),w('K1_44','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
    w('R24_6_1','K3_21','red'),w('K3_24','V1_Yb_p','red'),w('V1_Yb_n','R0_6_0','blue'),
    w('R24_6_2','K3_31','red'),w('K3_34','LS1_1','red'),w('LS1_4','K4_A1','red'),w('K4_A2','R0_6_1','blue')]
};
const y3abt={...EXAMS.find(x=>x.id==='y3')};y3abt.board={...y3abt.board,valveA:'valve43a'};   // 사용자가 ⇄로 바꾼 판
// 유지보수 1): ABT 교체 + 전방 줄 카운터밸런스 (V1 B → CB1 1번, CB1 2번 → A 전방)
const y3m1=()=>({wires:Y3.wires(),hoses:Y3.hoses().filter(x=>x.a!=='V1_B').concat([h('V1_B','CB1_1'),h('CB1_2','A_rod')]),set:{RV:4,CB1:2}});
// 유지보수 2): B 후방 줄 미터인 (V2 A → F1 2번, F1 1번 → B 후방)
const y3m2=()=>{const c=y3m1();c.set.F1=5;c.hoses=c.hoses.filter(x=>x.a!=='V2_A').concat([h('V2_A','F1_2'),h('F1_1','B_cap')]);return c;};
// 유지보수 3): K3 a접점(41-44) → 타이머 코일, Y2는 타이머 a접점(11-14)으로
const y3m3=()=>{const c=y3m2();c.set.T1=2;
  c.wires=c.wires.filter(x=>x.a!=='K3_24').concat([w('R24_6_3','K3_41','red'),w('K3_44','T1_A1','red'),w('T1_A2','R0_3_0','blue'),
    w('K3_24','T1_11','red'),w('T1_14','V1_Yb_p','red')]);return c;};

const y3=EXAMS.find(x=>x.id==='y3');
test('모의 유3 기본 동작: 고친 회로 통과, 도면대로 Y1 줄 K2를 a접점으로 쓰면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y3,0,{wires:Y3.wires(),hoses:Y3.hoses(),set:{RV:4}})),[]);
  const f=failed(gradeStage(y3,0,{wires:Y3.wires('K2_14'),hoses:Y3.hoses(),set:{RV:4}}));
  assert.ok(f.some(s=>s.startsWith('PB1 → 변위단계선도')),f.join(' / '));
});
test('모의 유3 유지보수 1) ABT + 카운터밸런스: 정답 통과, 카운터밸런스가 없으면 하중이 내려가 실패, 교체 안 하면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y3abt,1,y3m1())),[]);
  const f=failed(gradeStage(y3abt,1,{wires:Y3.wires(),hoses:Y3.hoses(),set:{RV:4}}));
  assert.ok(f.some(s=>s.startsWith('멈춘 뒤 하중이 내려가지 않음')),f.join(' / '));
  assert.ok(failed(gradeStage(y3,1,y3m1())).some(s=>s.startsWith('A 밸브를 4/3 중립 ABT로 교체')));
});
test('모의 유3 유지보수 2) B 전진 미터인: 정답 통과, 없으면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y3abt,2,y3m2())),[]);
  assert.ok(failed(gradeStage(y3abt,2,y3m1())).length>0);
});
test('모의 유3 유지보수 3) 타이머 2초: 정답 통과, 타이머를 안 쓰면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y3abt,3,y3m3())),[]);
  assert.ok(failed(gradeStage(y3abt,3,{...y3m2(),set:{RV:4,CB1:2,F1:5,T1:2}})).length>0);
});

/* ---------- 모의 유4: A+ M+ (2초) M− A− M0 (4/2 + 4/3 모터) ---------- */
const Y4={
  hoses:()=>[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','A_rod'),h('HP2','V2_P'),h('V2_T','HT2'),h('V2_A','M_a'),h('V2_B','M_b')],
  // K1 = 기동·유지(K3 NC로 해제), Y1(A) = K1·K4NC, K2 = (LS2 ∥ K2)·K1, T1 = K2, K4 = T1, Y2(M+) = K2·K4NC, Y3(M−) = K4, K3 = K4·LS1
  wires:(t='K2_2')=>[
    w('R24_6_0','K3_11','red'),w('K3_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K3_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_0','K1_21','red'),w('K1_24','K4_11','red'),w('K4_12','V1_Ya_p','red'),w('V1_Ya_n','R0_5_1','blue'),
    w('R24_1_0','LS2_1','red'),w('LS2_4','K1_31','red'),w('R24_5_1','K2_11','red'),w('K2_14','K1_31','red'),w('K1_34','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
    w('R24_5_2',t==='K2_2'?'K2_21':'K1_41','red'),w(t==='K2_2'?'K2_24':'K1_44','T1_A1','red'),w('T1_A2','R0_3_0','blue'),
    w('R24_3_1','T1_11','red'),w('T1_14','K4_A1','red'),w('K4_A2','R0_6_0','blue'),
    w('R24_5_3','K2_31','red'),w('K2_34','K4_21','red'),w('K4_22','V2_Ya_p','red'),w('V2_Ya_n','R0_5_3','blue'),
    w('R24_6_1','K4_31','red'),w('K4_34','V2_Yb_p','red'),w('V2_Yb_n','R0_6_1','blue'),
    w('R24_6_2','K4_41','red'),w('K4_44','LS1_1','red'),w('LS1_4','K3_A1','red'),w('K3_A2','R0_6_2','blue')]
};
// 유지보수 1): A 전방 줄 미터아웃 (V1 B → F1 1번, F1 2번 → A 전방)
const y4m1=()=>({wires:Y4.wires(),hoses:Y4.hoses().filter(x=>x.a!=='V1_B').concat([h('V1_B','F1_1'),h('F1_2','A_rod')]),set:{RV:4,T1:2,F1:5}});
// 유지보수 2): LS2를 떼고 A 후방 줄 압력스위치 PS1 NO로 K2
const y4m2=()=>{const c=y4m1();c.set.PS1=3;
  c.hoses=c.hoses.filter(x=>x.a!=='V1_A').concat([h('V1_A','PS1_a'),h('PS1_b','A_cap')]);
  c.wires=c.wires.filter(x=>!x.a.startsWith('LS2_')&&!x.b.startsWith('LS2_')).concat([w('R24_1_0','PS1_1','red'),w('PS1_4','K1_31','red')]);return c;};
// 유지보수 3): K5 = (PB2 ∥ K5)·PB3NC, K5 a접점을 PB1과 나란히
const y4m3=()=>{const c=y4m2();
  c.wires=c.wires.concat([w('R24_1_1','PB3_11','red'),w('PB3_12','PB2_13','red'),w('PB2_14','K5_A1','red'),w('PB3_12','K5_11','red'),w('K5_14','K5_A1','red'),w('K5_A2','R0_6_3','blue'),
    w('K3_12','K5_21','red'),w('K5_24','K1_A1','red')]);return c;};

const y4=EXAMS.find(x=>x.id==='y4');
test('모의 유4 기본 동작: 고친 회로 통과, 도면대로 타이머를 K1로 켜면 머무는 시간에서 실패',()=>{
  assert.deepEqual(failed(gradeStage(y4,0,{wires:Y4.wires(),hoses:Y4.hoses(),set:{RV:4,T1:2}})),[]);
  const f=failed(gradeStage(y4,0,{wires:Y4.wires('K1'),hoses:Y4.hoses(),set:{RV:4,T1:2}}));
  assert.ok(f.some(s=>s.startsWith('M+ 도달 후 2초')),f.join(' / '));
});
test('모의 유4 유지보수 1) 미터아웃: 정답 통과, 미터인 방향이면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y4,1,y4m1())),[]);
  const rev=y4m1();rev.hoses=rev.hoses.map(x=>x.b==='F1_1'?{...x,b:'F1_2'}:x.a==='F1_2'?{...x,a:'F1_1'}:x);
  assert.ok(failed(gradeStage(y4,1,rev)).length>0);
});
test('모의 유4 유지보수 2) LS2 대신 압력스위치: 정답 통과, 압력스위치 선이 없으면 실패',()=>{
  assert.deepEqual(failed(gradeStage(y4,2,y4m2())),[]);
  const c=y4m2();c.wires=c.wires.filter(x=>!x.a.startsWith('PS1_')&&!x.b.startsWith('PS1_'));
  assert.ok(failed(gradeStage(y4,2,c)).length>0);
});
test('모의 유4 유지보수 3) 연속/연속정지: 정답 통과, K5 없이는 실패',()=>{
  assert.deepEqual(failed(gradeStage(y4,3,y4m3())),[]);
  assert.ok(failed(gradeStage(y4,3,y4m2())).length>0);
});
