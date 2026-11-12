/* 설계 연습(산업기사형) D1~D3: 예시 회로(여기 테스트에만 둠)가 채점을 통과하고, 흔한 잘못 설계는 떨어지는지.
   앱 채점은 정답 배선과 비교하지 않고 동작으로만 본다 → 다른 설계도 동작이 맞으면 통과 */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {w,h}=require('./fixtures.js');
const {get}=load();
const MIS=id=>get('MISSIONS').find(m=>m.id===id);
function grade(id,wires,set={}){
  const m=MIS(id),L=get('LAYOUTS')[m.layout];
  get('configure')({parts:get('makeParts')(L,m.board)});
  const c=get('withJumpers')(L,{wires,hoses:[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod'),h('D2','V2_1'),h('V2_4','B_cap'),h('V2_2','B_rod')],set});
  return JSON.parse(JSON.stringify(get('gradeMission')(m,c)));
}
const failed=r=>r.filter(i=>!i.ok).map(i=>i.name+(i.detail?' — '+i.detail:''));
// 솔레노이드 −는 모두 0V로
const solN=()=>[w('V1_Ya_n','R0_5_0','blue'),w('V1_Yb_n','R0_5_1','blue'),w('V2_Ya_n','R0_5_2','blue'),w('V2_Yb_n','R0_5_3','blue')];
// D1: Y1 = PB1·LS3, Y3 = LS2, Y2 = LS4, Y4 = LS1 (릴레이 없음)
const d1=(y3)=>[w('R24_1_0','PB1_13','red'),w('PB1_14','LS3_1','red'),w('LS3_4','V1_Ya_p','red'),
  ...(y3||[w('R24_5_0','LS2_1','red'),w('LS2_4','V2_Ya_p','red')]),
  w('R24_5_1','LS4_1','red'),w('LS4_4','V1_Yb_p','red'),w('R24_5_2','LS1_1','red'),w('LS1_4','V2_Yb_p','red'),...solN()];

test('설계 연습 D1: 한 줄씩 4줄이면 통과, B− 줄을 빼면 실패',()=>{
  assert.deepEqual(failed(grade('d1',d1())),[]);
  assert.ok(failed(grade('d1',d1().filter(x=>x.b!=='V2_Yb_p'))).length>0);
});
test('설계 연습 D2: 릴레이 기억으로 통과, D1처럼 한 줄씩만 이으면 실패 (신호 겹침)',()=>{
  const ok=[w('R24_1_0','LS1_1','red'),w('LS1_4','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),
    w('LS1_2','LS4_1','red'),w('LS4_4','K1_A1','red'),w('LS1_2','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_4','blue'),
    w('R24_5_1','K1_41','red'),w('K1_44','V2_Yb_p','red'),
    w('R24_5_2','LS2_1','red'),w('LS2_4','K1_31','red'),w('K1_32','V2_Ya_p','red'),
    w('R24_5_3','LS3_1','red'),w('LS3_4','K1_21','red'),w('K1_24','V1_Yb_p','red'),...solN()];
  assert.deepEqual(failed(grade('d2',ok)),[]);
  // 한 줄씩: Y1 = PB1·LS3, Y3 = LS2, Y4 = LS4, Y2 = LS3
  const naive=[w('R24_1_0','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('R24_5_0','LS2_1','red'),w('LS2_4','V2_Ya_p','red'),
    w('R24_5_1','LS4_1','red'),w('LS4_4','V2_Yb_p','red'),w('R24_5_2','LS3_1','red'),w('LS3_4','V1_Yb_p','red'),...solN()];
  assert.ok(failed(grade('d2',naive)).some(s=>s.startsWith('PB1 → 변위단계선도')));
});
test('설계 연습 D3: 타이머로 2초 머물면 통과, 타이머 없이(D1 회로) 또는 1초로 두면 실패',()=>{
  const y3=[w('R24_5_0','LS2_1','red'),w('LS2_4','T1_A1','red'),w('T1_A2','R0_3_0','blue'),w('R24_5_3','T1_11','red'),w('T1_14','V2_Ya_p','red')];
  assert.deepEqual(failed(grade('d3',d1(y3),{T1:2})),[]);
  assert.ok(failed(grade('d3',d1(),{T1:2})).some(s=>s.startsWith('A+ 도달 후 2초')));
  assert.ok(failed(grade('d3',d1(y3),{T1:1})).some(s=>s.startsWith('타이머 2초')));
});
test('설계 연습: 힌트가 있고 튜토리얼 단계는 없다 (전기회로도를 주지 않음)',()=>{
  for(const m of get('MISSIONS').filter(x=>x.design)){
    assert.ok(Array.isArray(m.hints)&&m.hints.length>=2,m.id);
    assert.ok(!(m.steps||[]).length,m.id);
  }
});
test('설계 연습 D4 (유압): 자기유지 2개로 통과, 4/3을 PB1로만 켜면(유지 없음) 실패',()=>{
  const m=MIS('d4'),L=get('LAYOUTS').hyd;
  get('configure')({parts:get('makeParts')(L,m.board)});
  const hoses=[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','A_rod'),h('HP2','V2_P'),h('V2_T','HT2'),h('V2_A','B_cap'),h('V2_B','B_rod')];
  const neg=[w('V1_Ya_n','R0_6_0','blue'),w('V1_Yb_n','R0_6_1','blue'),w('V2_Ya_n','R0_6_2','blue')];
  // K1 = LS2(NC)·(PB1 ∥ K1), Y1 = K1, K2 = LS1(NC)·(LS2 ∥ K2), Y3 = K2, Y2 = LS4·K2
  const ok=[w('R24_5_0','LS2_1','red'),w('LS2_2','PB1_13','red'),w('PB1_14','K1_A1','red'),w('LS2_2','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_1','K1_21','red'),w('K1_24','V1_Ya_p','red'),
    w('R24_5_2','LS1_1','red'),w('LS1_2','K2_11','red'),w('K2_14','K2_A1','red'),w('LS2_4','K2_A1','red'),w('K2_A2','R0_5_1','blue'),
    w('R24_5_3','K2_21','red'),w('K2_24','V2_Ya_p','red'),
    w('R24_5_4','LS4_1','red'),w('LS4_4','K2_31','red'),w('K2_34','V1_Yb_p','red'),...neg];
  const g=c=>JSON.parse(JSON.stringify(get('gradeMission')(m,get('withJumpers')(L,{wires:c,hoses,set:{RV:4}}))));
  assert.deepEqual(failed(g(ok)),[]);
  const noHold=ok.filter(x=>x.a!=='K1_14');
  assert.ok(failed(g(noHold)).some(s=>s.startsWith('PB1 → 변위단계선도')));
});

test('설계 연습 D5 (A 편솔 + B 양솔): 릴레이 3개 예시와 2개짜리 다른 설계 모두 통과, 사이클 끝 기억(K3)이 없으면 실패',()=>{
  const neg=[w('V1_Ya_n','R0_6_0','blue'),w('V2_Ya_n','R0_6_1','blue'),w('V2_Yb_n','R0_6_2','blue')];
  // K1 = K3(NC)·(PB1 ∥ K1), Y1 = K1, K2 = K1·(LS4 ∥ K2), Y2 = K1·LS2·K2(NC), Y3 = K2, K3 = K2·LS3
  const ok=[w('R24_5_0','K3_11','red'),w('K3_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K3_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_1','K1_21','red'),w('K1_24','V1_Ya_p','red'),
    w('K1_24','LS2_1','red'),w('LS2_4','K2_31','red'),w('K2_32','V2_Ya_p','red'),
    w('K1_24','LS4_1','red'),w('LS4_4','K2_A1','red'),w('K1_24','K2_11','red'),w('K2_14','K2_A1','red'),w('K2_A2','R0_5_1','blue'),
    w('R24_5_2','K2_21','red'),w('K2_24','V2_Yb_p','red'),w('K2_24','LS3_1','red'),w('LS3_4','K3_A1','red'),w('K3_A2','R0_5_2','blue'),...neg];
  assert.deepEqual(failed(grade('d5',ok)),[]);
  assert.ok(failed(grade('d5',ok.filter(x=>x.b!=='K3_A1'))).some(s=>s.startsWith('PB1 → 변위단계선도')));
  // 다른 설계(릴레이 2개): K1 = (K2(NC) ∥ LS3(NC))·(PB1 ∥ K1), K2 = LS2·(LS4 ∥ K2), Y2 = LS2·K2(NC), Y3 = K2
  const alt=[w('R24_5_0','K2_41','red'),w('R24_5_0','LS3_1','red'),w('K2_42','PB1_13','red'),w('LS3_2','PB1_13','red'),w('PB1_14','K1_A1','red'),
    w('PB1_13','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_1','K1_21','red'),w('K1_24','V1_Ya_p','red'),
    w('R24_5_2','LS2_1','red'),w('LS2_4','K2_31','red'),w('K2_32','V2_Ya_p','red'),
    w('LS2_4','LS4_1','red'),w('LS4_4','K2_A1','red'),w('LS2_4','K2_11','red'),w('K2_14','K2_A1','red'),w('K2_A2','R0_5_1','blue'),
    w('R24_5_3','K2_21','red'),w('K2_24','V2_Yb_p','red'),...neg];
  assert.deepEqual(failed(grade('d5',alt)),[]);
});
test('설계 연습 D6 (카운터 3회): 운전 릴레이 + 카운터로 통과, D1 회로 그대로(한 사이클)거나 카운터가 2회면 실패',()=>{
  // K1 = C1(NC)·(PB1 ∥ K1), Y1 = K1·LS3, Y3 = LS2, Y2 = LS4, Y4 = LS1, C1 계수 = LS2, 리셋 = PB3
  const ok=[w('R24_4_0','C1_11','red'),w('C1_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('C1_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
    w('R24_5_1','K1_21','red'),w('K1_24','LS3_1','red'),w('LS3_4','V1_Ya_p','red'),
    w('R24_5_2','LS2_1','red'),w('LS2_4','V2_Ya_p','red'),w('LS2_4','C1_A1','red'),w('C1_A2','R0_4_0','blue'),
    w('R24_5_3','LS4_1','red'),w('LS4_4','V1_Yb_p','red'),w('R24_5_4','LS1_1','red'),w('LS1_4','V2_Yb_p','red'),
    w('R24_1_1','PB3_13','red'),w('PB3_14','C1_R1','red'),w('C1_R2','R0_4_1','blue'),...solN()];
  assert.deepEqual(failed(grade('d6',ok,{C1:3})),[]);
  assert.ok(failed(grade('d6',d1(),{C1:3})).length>0);
  assert.ok(failed(grade('d6',ok,{C1:2})).length>0);
});
