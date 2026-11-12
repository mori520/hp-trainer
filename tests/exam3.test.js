/* 모의 과제 (기사) 공5·공6, 유5·유6: 고친 정답 회로는 모든 단계를 통과하고, 도면(틀린 곳 포함) 그대로 배선하면
   기본 동작에서 떨어진다. 정답 회로는 여기(테스트)에만 둔다. 앱 채점은 정답과 비교하지 않고 동작으로만 본다 */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {w,h}=require('./fixtures.js');
const {get}=load();
const EX=id=>get('EXAMS').find(x=>x.id===id);
function gradeStage(x,k,c,board){
  const b=Object.assign({},get('examBoard')(x,k),board);
  get('configure')({parts:get('makeParts')(get('LAYOUTS')[x.layout],b)});
  const cc=get('withJumpers')(get('LAYOUTS')[x.layout],{wires:c.wires,hoses:c.hoses,set:Object.assign({},x.set,c.set)});
  return JSON.parse(JSON.stringify(get('gradeMission')({...x,grading:x.exam.stages[k].grading},cc)));
}
const failed=r=>r.filter(i=>!i.ok).map(i=>i.name+(i.detail?' — '+i.detail:''));
const pass=(x,k,c,board)=>assert.deepEqual(failed(gradeStage(x,k,c,board)),[]);
const fails=(x,k,c,start,board)=>{const f=failed(gradeStage(x,k,c,board));assert.ok(start?f.some(s=>s.startsWith(start)):f.length>0,f.join(' / ')||'통과해 버림');};
const airH=()=>[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod'),h('D2','V2_1'),h('V2_4','B_cap'),h('V2_2','B_rod')];
const sensorPw=()=>[w('R24_2_0','S1_p','red'),w('S1_n','R0_2_0','blue'),w('R24_2_1','S2_p','red'),w('S2_n','R0_2_1','blue')];
const SEQ='PB1 → 변위단계선도';

/* ---------- 모의 공5: A+ A− B+ B− (A 양솔 Y1·Y2, B 편솔 Y3) ---------- */
const x5=EX('x5');
// K1 = S2·K2(NC)·(PB1 ∥ K1), Y1 = K1, K2 = K4(NC)·(LS2 ∥ K2), Y2 = K2·K1(NC), K3 = K2·LS1, Y3 = K3, K4 = S1
// nc: K2 줄을 끊는 b접점 (도면은 K3로 틀리게 그려져 있음)
const x5w=(nc='K4',n=nc==='K4'?'1':'2')=>[...sensorPw(),
  w('S2_out','K2_11','red'),w('K2_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K2_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('R24_5_0','K1_21','red'),w('K1_24','V1_Ya_p','red'),w('V1_Ya_n','R0_5_1','blue'),
  w('R24_5_1',nc+'_'+n+'1','red'),w(nc+'_'+n+'2','LS2_1','red'),w('LS2_4','K2_A1','red'),w(nc+'_'+n+'2','K2_21','red'),w('K2_24','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
  w('R24_5_2','K2_31','red'),w('K2_34','K1_31','red'),w('K1_32','V1_Yb_p','red'),w('V1_Yb_n','R0_5_3','blue'),
  w('K2_34','LS1_1','red'),w('LS1_4','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
  w('R24_5_3','K3_11','red'),w('K3_14','V2_Ya_p','red'),w('V2_Ya_n','R0_5_5','blue'),
  w('S1_out','K4_A1','red'),w('K4_A2','R0_6_0','blue')];
// 유지보수 1): T1 코일 = K2, Y2 = T1(NO)·K1(NC)
const x5m1=()=>({wires:x5w().filter(x=>!(x.a==='K2_34'&&x.b==='K1_31')).concat([w('K2_34','T1_A1','red'),w('T1_A2','R0_3_0','blue'),w('R24_3_0','T1_11','red'),w('T1_14','K1_31','red')]),
  hoses:airH(),set:{SU:0.5,T1:2}});
// 유지보수 2): B 전방 줄에 F1 미터아웃
const x5m2=()=>{const c=x5m1();c.hoses=c.hoses.filter(x=>x.a!=='V2_2').concat([h('V2_2','F1_1'),h('F1_2','B_rod')]);c.set.F1=5;return c;};
// 유지보수 3): 제어 줄 24V는 비상정지 NC를 거쳐서, K5 = PB2 ∥ K5 (연속), K5 NO를 PB1과 나란히, ES NO → H1·K6, K6 NO → Y2
const x5m3=()=>{const c=x5m2();
  c.wires=c.wires.map(x=>x.a.startsWith('R24_')&&!/_p$/.test(x.b)?{...x,a:'ES_12'}:x).concat([
    w('R24_1_2','ES_11','red'),w('R24_1_3','ES_13','red'),w('ES_14','H1_p','red'),w('H1_n','R0_2_2','blue'),
    w('ES_12','PB2_13','red'),w('PB2_14','K5_A1','red'),w('ES_12','K5_11','red'),w('K5_14','K5_A1','red'),w('K5_A2','R0_6_1','blue'),
    w('K2_12','K5_21','red'),w('K5_24','K1_A1','red'),
    w('ES_14','K6_A1','red'),w('K6_A2','R0_6_2','blue'),w('R24_6_0','K6_11','red'),w('K6_14','V1_Yb_p','red')]);return c;};
test('모의 공5 기본 동작: 고친 회로 통과, 도면대로 K2를 K3로 끊으면 실패, 압력을 안 맞추면 실패',()=>{
  pass(x5,0,{wires:x5w(),hoses:airH(),set:{SU:0.5}});
  fails(x5,0,{wires:x5w('K3'),hoses:airH(),set:{SU:0.5}},SEQ);
  fails(x5,0,{wires:x5w(),hoses:airH(),set:{}},'서비스 유닛 압력');
});
test('모의 공5 유지보수 1) 타이머 2초: 정답 통과, 타이머 없이는 머무는 시간에서 실패',()=>{
  pass(x5,1,x5m1());
  fails(x5,1,{wires:x5w(),hoses:airH(),set:{SU:0.5,T1:2}},'A+ 도달 후 2초');
});
test('모의 공5 유지보수 2) B 전진 미터아웃: 정답 통과, 유량조절을 안 끼우거나 미터인으로 끼우면 실패',()=>{
  pass(x5,2,x5m2());
  fails(x5,2,x5m1());
  const mi=x5m1();mi.hoses=mi.hoses.filter(x=>x.a!=='V2_4').concat([h('V2_4','F1_1'),h('F1_2','B_cap')]);mi.set.F1=5;
  fails(x5,2,mi);
});
test('모의 공5 유지보수 3) 연속 + 비상정지 + 램프: 정답 통과, 앞 단계 회로 그대로거나 Y2를 안 켜면 실패',()=>{
  pass(x5,3,x5m3());
  fails(x5,3,x5m2());
  const noY2=x5m3();noY2.wires=noY2.wires.filter(x=>x.a!=='K6_14');
  fails(x5,3,noY2,'비상정지 ON');
});

/* ---------- 모의 공6: B+ B− A+ A− (A 편솔 Y1, B 양솔 Y2·Y3) ---------- */
const x6=EX('x6');
// K1 = K4(NC)·(PB1 ∥ K1), Y2 = K1·K2(NC), K2 = (S2 ∥ K2)·K1, Y3 = K2, K3 = S1·K2, Y1 = K3, K4 = K3·LS2
// hold: K2 줄의 자기유지 접점 (도면은 K1으로 틀리게 그려져 있음). yB: B 밸브 솔레노이드 잭 앞부분
const x6w=(hold='K2',o={})=>[...sensorPw(),
  w('R24_5_0','K4_11','red'),w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('R24_5_1','K1_21','red'),w('K1_24','K2_11','red'),w('K2_12','V2_Ya_p','red'),w('V2_Ya_n','R0_5_1','blue'),
  w('S2_out','K1_31','red'),w('K1_34','K2_A1','red'),w('R24_5_2',hold+'_41','red'),w(hold+'_44','K1_31','red'),w('K2_A2','R0_5_2','blue'),
  ...(o.timer?[w('R24_5_3','K2_21','red'),w('K2_24','T1_A1','red'),w('T1_A2','R0_3_0','blue'),w('R24_3_0','T1_11','red'),w('T1_14','V2_Yb_p','red')]
    :[w('R24_5_3','K2_21','red'),w('K2_24','V2_Yb_p','red')]),w('V2_Yb_n','R0_5_3','blue'),
  w('S1_out','K2_31','red'),w('K2_34','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
  w('R24_5_4','K3_11','red'),w('K3_14','V1_Ya_p','red'),w('V1_Ya_n','R0_5_5','blue'),
  w('K3_14','LS2_1','red'),w('LS2_4','K4_A1','red'),w('K4_A2','R0_6_0','blue'),
  // 양솔로 바꾼 뒤: A 후진 Y(V1 오른쪽) = K1(NC)·K3(NC)
  ...(o.dbl?[w('R24_6_0','K1_41','red'),w('K1_42','K3_21','red'),w('K3_22','V1_Yb_p','red'),w('V1_Yb_n','R0_6_1','blue')]:[])];
const DBL={valveA:'valve52d'};
const x6m3=()=>({wires:x6w('K2',{dbl:true,timer:true}),hoses:airH().filter(x=>x.a!=='D1').concat([h('D1','PR1_1'),h('PR1_2','V1_1')]),set:{SU:0.5,T1:3,PR1:0.3}});
test('모의 공6 기본 동작: 고친 회로 통과, 도면대로 자기유지를 K1 접점으로 하면 실패',()=>{
  pass(x6,0,{wires:x6w(),hoses:airH(),set:{SU:0.5}});
  fails(x6,0,{wires:x6w('K1'),hoses:airH(),set:{SU:0.5}},SEQ);
});
test('모의 공6 유지보수 1) A 양솔 교체: 후진 솔레노이드까지 배선하면 통과, 밸브를 안 바꾸거나 후진 줄이 없으면 실패',()=>{
  pass(x6,1,{wires:x6w('K2',{dbl:true}),hoses:airH(),set:{SU:0.5}},DBL);
  fails(x6,1,{wires:x6w(),hoses:airH(),set:{SU:0.5}},'A 밸브를 5/2 양솔로 교체');
  fails(x6,1,{wires:x6w(),hoses:airH(),set:{SU:0.5}},SEQ,DBL);
});
test('모의 공6 유지보수 2) 타이머 3초: 정답 통과, 타이머 없이는 실패',()=>{
  pass(x6,2,{wires:x6w('K2',{dbl:true,timer:true}),hoses:airH(),set:{SU:0.5,T1:3}},DBL);
  fails(x6,2,{wires:x6w('K2',{dbl:true}),hoses:airH(),set:{SU:0.5,T1:3}},'B+ 도달 후 3초',DBL);
});
test('모의 공6 유지보수 3) A만 0.3 MPa: 정답 통과, 감압밸브를 안 끼우거나 0.5로 두면 실패',()=>{
  pass(x6,3,x6m3(),DBL);
  fails(x6,3,{...x6m3(),hoses:airH()},null,DBL);
  fails(x6,3,{...x6m3(),set:{SU:0.5,T1:3,PR1:0.5}},null,DBL);
});

/* ---------- 모의 유5: B+ A+ A− B− (하중 A 4/3 Y1·Y2, B 4/2 Y3) ---------- */
const y5=EX('y5');
const hydH=()=>[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','A_rod'),h('HP2','V2_P'),h('V2_T','HT2'),h('V2_A','B_cap'),h('V2_B','B_rod')];
// K1 = K4(NC)·(PB1 ∥ K1), Y3 = K1, K2 = S1, Y1 = K1·K2·K3(NC), K3 = (LS2 ∥ K3)·K1, Y2 = K3, K4 = K3·LS1
// (Y1에 K1이 없으면 사이클이 끝나 K3가 풀리는 순간 B가 아직 앞에 있어 Y1이 잠깐 다시 켜진다)
// ls1: K4 줄의 LS1 접점 잭 (도면은 NC = 2번으로 틀리게 그려져 있음)
const y5w=(ls1='LS1_4')=>[
  w('R24_6_0','K4_11','red'),w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('R24_5_0','K1_21','red'),w('K1_24','V2_Ya_p','red'),w('V2_Ya_n','R0_5_1','blue'),
  w('R24_2_0','S1_p','red'),w('S1_n','R0_2_0','blue'),w('S1_out','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
  w('K1_24','K2_11','red'),w('K2_14','K3_11','red'),w('K3_12','V1_Ya_p','red'),w('V1_Ya_n','R0_5_3','blue'),
  w('R24_1_0','LS2_1','red'),w('LS2_4','K1_31','red'),w('R24_5_2','K3_21','red'),w('K3_24','K1_31','red'),w('K1_34','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
  w('R24_5_3','K3_31','red'),w('K3_34','V1_Yb_p','red'),w('V1_Yb_n','R0_5_5','blue'),
  w('K3_34','LS1_1','red'),w(ls1,'K4_A1','red'),w('K4_A2','R0_6_0','blue')];
const ABT={valveA:'valve43a'};
const y5m1H=()=>hydH().filter(x=>x.a!=='V1_A'&&x.a!=='V1_B').concat([h('V1_A','PC1_A1'),h('PC1_A2','A_cap'),h('V1_B','PC1_B1'),h('PC1_B2','A_rod')]);
const y5m2H=()=>y5m1H().filter(x=>x.a!=='V2_B').concat([h('V2_B','F1_1'),h('F1_2','B_rod')]);
// 유지보수 3): K5 = PB3(NC)·(PB2 ∥ K5), K1 다시 시작 = S2·K5
const y5m3w=(viaS2=true)=>y5w().concat([w('R24_2_1','S2_p','red'),w('S2_n','R0_2_1','blue'),
  w('R24_1_1','PB3_11','red'),w('PB3_12','PB2_13','red'),w('PB2_14','K5_A1','red'),w('PB3_12','K5_11','red'),w('K5_14','K5_A1','red'),w('K5_A2','R0_6_1','blue'),
  w(viaS2?'S2_out':'K4_12','K5_21','red'),w('K5_24','K1_A1','red')]);
test('모의 유5 기본 동작: 고친 회로 통과, 도면대로 LS1을 b접점으로 쓰면 실패, 릴리프를 안 맞추면 실패',()=>{
  pass(y5,0,{wires:y5w(),hoses:hydH(),set:{RV:4}});
  fails(y5,0,{wires:y5w('LS1_2'),hoses:hydH(),set:{RV:4}},SEQ);
  fails(y5,0,{wires:y5w(),hoses:hydH(),set:{}},'릴리프 압력');
});
test('모의 유5 유지보수 1) 로킹: 정답 통과, 파일럿 체크 없이 ABT면 하중이 내려가 실패, 교체 안 하면 실패',()=>{
  pass(y5,1,{wires:y5w(),hoses:y5m1H(),set:{RV:4}},ABT);
  fails(y5,1,{wires:y5w(),hoses:hydH(),set:{RV:4}},null,ABT);
  fails(y5,1,{wires:y5w(),hoses:y5m1H(),set:{RV:4}},'A 밸브를 4/3 중립 ABT로 교체');
});
test('모의 유5 유지보수 2) B 양방향 유량조절: 정답 통과, 안 끼우면 실패',()=>{
  pass(y5,2,{wires:y5w(),hoses:y5m2H(),set:{RV:4,F1:4}},ABT);
  fails(y5,2,{wires:y5w(),hoses:y5m1H(),set:{RV:4}},null,ABT);
});
test('모의 유5 유지보수 3) 연속동작/연속정지: 정답 통과, S2 없이 K5만으로 다시 켜면 실패, 앞 단계 그대로면 실패',()=>{
  pass(y5,3,{wires:y5m3w(),hoses:y5m2H(),set:{RV:4,F1:4}},ABT);
  fails(y5,3,{wires:y5m3w(false),hoses:y5m2H(),set:{RV:4,F1:4}},'PB2 → 연속동작',ABT);
  fails(y5,3,{wires:y5w(),hoses:y5m2H(),set:{RV:4,F1:4}},null,ABT);
});

/* ---------- 모의 유6: B+ A+ B− A− (A 4/2 Y1, B 4/2 Y2) ---------- */
const y6=EX('y6');
// K1 = K4(NC)·(PB1 ∥ K1), Y2 = K1·K3(NC), K2 = (LS2 ∥ K2)·K1, Y1 = K2, K3 = (S1 ∥ K3)·K1, K4 = K3·LS1
// y1: Y1을 켜는 릴레이 (도면은 K3로 틀리게 그려져 있음). start: K1을 켜는 줄 (기본 = PB1, 유지보수 2)부터 = S2·K5)
const y6w=(y1='K2',o={})=>[
  w('R24_6_0','K4_11','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  ...(o.count?[w('S2_out','K5_21','red'),w('K5_24','K1_A1','red')]:[w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red')]),
  w('R24_5_0','K1_21','red'),w('K1_24','K3_11','red'),w('K3_12','V2_Ya_p','red'),w('V2_Ya_n','R0_5_1','blue'),
  w('R24_1_0','LS2_1','red'),w('LS2_4','K1_31','red'),w('R24_5_1','K2_11','red'),w('K2_14','K1_31','red'),w('K1_34','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
  w('R24_5_2',y1+'_41','red'),w(y1+'_44','V1_Ya_p','red'),w('V1_Ya_n','R0_5_3','blue'),
  w('R24_2_0','S1_p','red'),w('S1_n','R0_2_0','blue'),w('S1_out','K1_41','red'),w('R24_5_3','K3_21','red'),w('K3_24','K1_41','red'),w('K1_44','K3_A1','red'),w('K3_A2','R0_5_4','blue'),
  w('R24_5_4','K3_31','red'),w('K3_34','LS1_1','red'),w('LS1_4','K4_A1','red'),w('K4_A2','R0_6_0','blue'),
  ...(o.count?[w('R24_2_1','S2_p','red'),w('S2_n','R0_2_1','blue'),
    w('R24_4_0','C1_11','red'),w('C1_12','PB1_13','red'),w('PB1_14','K5_A1','red'),w('C1_12','K5_11','red'),w('K5_14','K5_A1','red'),w('K5_A2','R0_6_1','blue'),
    w('S1_out','C1_A1','red'),w('C1_A2','R0_4_0','blue'),w('R24_1_1','PB3_13','red'),w('PB3_14','C1_R1','red'),w('C1_R2','R0_4_1','blue')]:[])];
const y6m1H=()=>hydH().filter(x=>x.a!=='V1_A').concat([h('V1_A','PR1_1'),h('PR1_2','A_cap')]);
const y6m3w=()=>y6w('K2',{count:true}).map(x=>x.a.startsWith('R24_')&&!/_p$/.test(x.b)?{...x,a:'ES_12'}:x)
  .concat([w('R24_1_2','ES_11','red'),w('R24_1_3','ES_13','red'),w('ES_14','H1_p','red'),w('H1_n','R0_2_2','blue')]);
test('모의 유6 기본 동작: 고친 회로 통과, 도면대로 Y1을 K3로 켜면 실패',()=>{
  pass(y6,0,{wires:y6w(),hoses:hydH(),set:{RV:4}});
  fails(y6,0,{wires:y6w('K3'),hoses:hydH(),set:{RV:4}},SEQ);
});
test('모의 유6 유지보수 1) A 전진 감압 2.0: 정답 통과, 감압밸브가 없거나 4.0 그대로면 실패',()=>{
  pass(y6,1,{wires:y6w(),hoses:y6m1H(),set:{RV:4,PR1:2}});
  fails(y6,1,{wires:y6w(),hoses:hydH(),set:{RV:4,PR1:2}});
  fails(y6,1,{wires:y6w(),hoses:y6m1H(),set:{RV:4,PR1:4}});
});
test('모의 유6 유지보수 2) 카운터 3회 + 리셋: 정답 통과, 기본 회로 그대로거나 카운터 2회면 실패',()=>{
  pass(y6,2,{wires:y6w('K2',{count:true}),hoses:y6m1H(),set:{RV:4,PR1:2,C1:3}});
  fails(y6,2,{wires:y6w(),hoses:y6m1H(),set:{RV:4,PR1:2,C1:3}});
  fails(y6,2,{wires:y6w('K2',{count:true}),hoses:y6m1H(),set:{RV:4,PR1:2,C1:2}});
});
test('모의 유6 유지보수 3) 비상정지 + 램프: 정답 통과, 비상정지를 안 넣으면 실패',()=>{
  pass(y6,3,{wires:y6m3w(),hoses:y6m1H(),set:{RV:4,PR1:2,C1:3}});
  fails(y6,3,{wires:y6w('K2',{count:true}),hoses:y6m1H(),set:{RV:4,PR1:2,C1:3}},'비상정지 ON');
});
