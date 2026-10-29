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
