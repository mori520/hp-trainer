/* 모의 과제 (산업기사형, exams.js의 level:"industrial"): 전기회로도가 없는 과제.
   여기 있는 설계 예시 회로(테스트에만 둠)가 모든 단계를 통과하고, 흔한 잘못 설계는 떨어지는지 확인한다.
   앱 채점은 정답과 비교하지 않고 동작으로만 본다 → 다른 설계도 동작이 맞으면 통과 */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {w,h}=require('./fixtures.js');
const {get}=load();
const EX=id=>get('EXAMS').find(x=>x.id===id);
function gradeStage(x,k,c){
  const board=get('examBoard')(x,k);
  get('configure')({parts:get('makeParts')(get('LAYOUTS')[x.layout],board)});
  const J=get('JACKS');void J;
  const cc=get('withJumpers')(get('LAYOUTS')[x.layout],{wires:c.wires,hoses:c.hoses,set:Object.assign({},x.set,c.set)});
  return JSON.parse(JSON.stringify(get('gradeMission')({...x,grading:x.exam.stages[k].grading},cc)));
}
const failed=r=>r.filter(i=>!i.ok).map(i=>i.name+(i.detail?' — '+i.detail:''));
const pass=(x,k,c)=>assert.deepEqual(failed(gradeStage(x,k,c)),[]);
// 기본 호스 + 유량조절 F1을 한 줄에 끼움 (via: 그 줄의 밸브 포트, 실린더 포트)
const hoses=(vp,cp)=>[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod'),h('D2','V2_1'),h('V2_4','B_cap'),h('V2_2','B_rod')]
  .filter(x=>x.a!==vp).concat([h(vp,'F1_1'),h('F1_2',cp)]);
const solN=()=>[w('V1_Ya_n','R0_6_2','blue'),w('V1_Yb_n','R0_6_3','blue'),w('V2_Ya_n','R0_6_4','blue'),w('V2_Yb_n','R0_6_5','blue')];
// 이름이 to인 잭으로 가는 선을 바꾸거나(from 잭 이름 → 새 이름) 빼기
const without=(ws,f)=>ws.filter(x=>!f(x));
const swap=(ws,map)=>ws.map(x=>({...x,a:map[x.a]||x.a,b:map[x.b]||x.b}));
const sensor=(id,src='R24_2_0',gnd='R0_2_0')=>[w(src,id+'_p','red'),w(id+'_n',gnd,'blue')];

/* ---------- 산업 공1: A+ B+ B− A− ---------- */
const sx1=EX('sx1');
const S1H=()=>hoses('V1_2','A_rod');
// K1 = LS1(NC)·(LS4 ∥ K1), Y1 = LS1(NO)·PB1, Y4 = K1, Y3 = LS2·K1(NC), Y2 = LS3·K1
const s1base=()=>[w('R24_1_0','LS1_1','red'),w('LS1_4','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),
  w('LS1_2','LS4_1','red'),w('LS4_4','K1_A1','red'),w('LS1_2','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_4','blue'),
  w('R24_5_1','K1_41','red'),w('K1_44','V2_Yb_p','red'),
  w('R24_5_2','LS2_1','red'),w('LS2_4','K1_31','red'),w('K1_32','V2_Ya_p','red'),
  w('R24_5_3','LS3_1','red'),w('LS3_4','K1_21','red'),w('K1_24','V1_Yb_p','red'),...solN()];
// 유지보수 1): 운전 릴레이 K2 = C1(NC)·(PB1 ∥ K2), Y1 = LS1(NO)·K2, 카운터는 LS2로 세고 PB3로 리셋
const s1m1=()=>without(s1base(),x=>x.a==='LS1_4'||x.a==='PB1_14').concat([
  w('R24_6_0','C1_11','red'),w('C1_12','PB1_13','red'),w('PB1_14','K2_A1','red'),w('C1_12','K2_11','red'),w('K2_14','K2_A1','red'),w('K2_A2','R0_6_0','blue'),
  w('LS1_4','K2_21','red'),w('K2_24','V1_Ya_p','red'),
  w('LS2_4','C1_A1','red'),w('C1_A2','R0_4_0','blue'),w('R24_1_1','PB3_13','red'),w('PB3_14','C1_R1','red'),w('C1_R2','R0_4_1','blue')]);
// 유지보수 2): LS1 → S1(정전용량, NC 대신 K3 NC), LS2 → S2(유도형)
const s1m2=()=>{
  const ws=without(s1m1(),x=>[x.a,x.b].some(j=>/^LS[12]_/.test(j)));
  return ws.concat([...sensor('S1'),...sensor('S2','R24_2_1','R0_2_1'),
    w('S1_out','K3_A1','red'),w('K3_A2','R0_5_5','blue'),w('S1_out','K2_21','red'),
    w('R24_1_0','K3_11','red'),w('K3_12','LS4_1','red'),w('K3_12','K1_11','red'),
    w('S2_out','K1_31','red'),w('S2_out','C1_A1','red')]);
};
test('산업 공1 기본 동작: 설계 예시 통과, 미터아웃 대신 미터인이면 실패, D1처럼 한 줄씩이면 실패',()=>{
  pass(sx1,0,{wires:s1base(),hoses:S1H(),set:{SU:0.5}});
  const meterIn={wires:s1base(),hoses:hoses('V1_4','A_cap'),set:{SU:0.5}};
  assert.ok(failed(gradeStage(sx1,0,meterIn)).some(s=>s.startsWith('속도 조절')));
  const naive=[w('R24_1_0','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('R24_5_0','LS2_1','red'),w('LS2_4','V2_Ya_p','red'),
    w('R24_5_1','LS4_1','red'),w('LS4_4','V2_Yb_p','red'),w('R24_5_2','LS3_1','red'),w('LS3_4','V1_Yb_p','red'),...solN()];
  assert.ok(failed(gradeStage(sx1,0,{wires:naive,hoses:S1H(),set:{SU:0.5}})).some(s=>s.startsWith('PB1 → 변위단계선도')));
});
test('산업 공1 유지보수 1) 연속 3회 + 리셋: 예시 통과, 기본 회로 그대로면 실패',()=>{
  pass(sx1,1,{wires:s1m1(),hoses:S1H(),set:{SU:0.5,C1:3}});
  assert.ok(failed(gradeStage(sx1,1,{wires:s1base(),hoses:S1H(),set:{SU:0.5,C1:3}})).length>0);
});
test('산업 공1 유지보수 2) A 리밋 → 센서: 예시 통과, LS 선이 빠진 채(센서 미배선)면 실패',()=>{
  pass(sx1,2,{wires:s1m2(),hoses:S1H(),set:{SU:0.5,C1:3}});
  assert.ok(failed(gradeStage(sx1,2,{wires:s1m1(),hoses:S1H(),set:{SU:0.5,C1:3}})).length>0);
});

/* ---------- 산업 공2: A+ B+ 2초 A− B− ---------- */
const sx2=EX('sx2');
const S2H=()=>hoses('V2_4','B_cap');
// Y1 = PB1·LS3, Y3 = LS2, T1 = LS4, Y2 = T1, Y4 = LS1 (릴레이 없음). src: 제어 줄 24V (비상정지 뒤엔 ES 12)
const s2base=(src={})=>[w(src.a||'R24_1_0','PB1_13','red'),w('PB1_14','LS3_1','red'),w('LS3_4','V1_Ya_p','red'),
  w(src.b||'R24_5_0','LS2_1','red'),w('LS2_4','V2_Ya_p','red'),
  w(src.c||'R24_5_1','LS4_1','red'),w('LS4_4','T1_A1','red'),w('T1_A2','R0_3_0','blue'),
  w(src.d||'R24_3_0','T1_11','red'),w('T1_14','V1_Yb_p','red'),
  w(src.e||'R24_5_2','LS1_1','red'),w('LS1_4','V2_Yb_p','red'),...solN()];
// 유지보수 1): 제어 줄은 ES NC(11-12) 뒤에서, ES NO(13-14) → H1 + K2, K2 NO → Y2·Y4
const ES={a:'ES_12',b:'ES_12',c:'ES_12',d:'ES_12',e:'ES_12'};
const esPart=()=>[w('R24_1_2','ES_11','red'),w('R24_1_3','ES_13','red'),w('ES_14','H1_p','red'),w('H1_n','R0_2_0','blue'),
  w('ES_14','K2_A1','red'),w('K2_A2','R0_5_5','blue'),w('R24_6_0','K2_11','red'),w('K2_14','V1_Yb_p','red'),w('R24_6_1','K2_21','red'),w('K2_24','V2_Yb_p','red')];
const s2m1=()=>s2base(ES).concat(esPart());
// 유지보수 2): LS3 → S3(유도형): S3 흑색이 PB1 줄의 전원, LS4 → S4: S4 흑색 → 타이머. 센서 전원도 ES 뒤에서
const s2m2=()=>without(s2m1(),x=>[x.a,x.b].some(j=>/^LS[34]_/.test(j))).concat([
  ...sensor('S3','ES_12','R0_2_1'),...sensor('S4','ES_12','R0_2_2'),
  w('S3_out','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('S4_out','T1_A1','red')]).filter(x=>!(x.a==='ES_12'&&x.b==='PB1_13'));
test('산업 공2 기본 동작: 설계 예시 통과, 타이머 없이(LS4 → Y2) 하면 머무는 시간에서 실패',()=>{
  pass(sx2,0,{wires:s2base(),hoses:S2H(),set:{SU:0.5,T1:2}});
  const noTimer=without(s2base(),x=>x.b==='T1_A1'||x.a==='T1_A2'||x.a==='R24_3_0'||x.a==='T1_14').concat([w('LS4_4','V1_Yb_p','red')]);
  assert.ok(failed(gradeStage(sx2,0,{wires:noTimer,hoses:S2H(),set:{SU:0.5,T1:2}})).some(s=>s.startsWith('B+ 도달 후 2초')));
});
test('산업 공2 유지보수 1) 비상정지 + 램프: 예시 통과, 전원만 끊으면(후진 솔레노이드를 안 켜면) 실패',()=>{
  pass(sx2,1,{wires:s2m1(),hoses:S2H(),set:{SU:0.5,T1:2}});
  const cutOnly=s2base(ES).concat([w('R24_1_2','ES_11','red'),w('R24_1_3','ES_13','red'),w('ES_14','H1_p','red'),w('H1_n','R0_2_0','blue')]);
  assert.ok(failed(gradeStage(sx2,1,{wires:cutOnly,hoses:S2H(),set:{SU:0.5,T1:2}})).some(s=>s.startsWith('비상정지 ON')));
});
test('산업 공2 유지보수 2) B 리밋 → 센서: 예시 통과, 센서 미배선이면 실패',()=>{
  pass(sx2,2,{wires:s2m2(),hoses:S2H(),set:{SU:0.5,T1:2}});
  assert.ok(failed(gradeStage(sx2,2,{wires:s2m1(),hoses:S2H(),set:{SU:0.5,T1:2}})).length>0);
});

/* ---------- 산업 공3: B+ A+ A− B− ---------- */
const sx3=EX('sx3');
const S3H=()=>hoses('V2_2','B_rod');
// K1 = LS3(NC)·(LS2 ∥ K1), Y2 = K1(코일 줄에서), Y3 = PB1·K1(NC), Y1 = LS4·K1(NC), Y4 = LS1·K1
const s3base=()=>[w('R24_5_0','LS3_1','red'),w('LS3_2','LS2_1','red'),w('LS2_4','K1_A1','red'),w('LS3_2','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('K1_A1','V1_Yb_p','red'),
  w('R24_1_0','PB1_13','red'),w('PB1_14','K1_21','red'),w('K1_22','V2_Ya_p','red'),
  w('R24_5_1','LS4_1','red'),w('LS4_4','K1_31','red'),w('K1_32','V1_Ya_p','red'),
  w('R24_5_2','LS1_1','red'),w('LS1_4','K1_41','red'),w('K1_44','V2_Yb_p','red'),...solN()];
// 유지보수 1): K2 = PB3(NC)·(PB2 ∥ K2), K2 NO를 PB1과 병렬
const s3m1=()=>s3base().concat([w('R24_1_1','PB3_11','red'),w('PB3_12','PB2_13','red'),w('PB2_14','K2_A1','red'),w('PB3_12','K2_11','red'),w('K2_14','K2_A1','red'),w('K2_A2','R0_5_1','blue'),
  w('R24_6_0','K2_21','red'),w('K2_24','K1_21','red')]);
// 유지보수 2): LS2 → S2 흑색을 K1 코일 쪽에, LS1 → S1 흑색을 K1 41에
const s3m2=()=>without(s3m1(),x=>[x.a,x.b].some(j=>/^LS[12]_/.test(j))).concat([...sensor('S1'),...sensor('S2','R24_2_1','R0_2_1'),
  w('S2_out','K1_A1','red'),w('S1_out','K1_41','red')]);
test('산업 공3 기본 동작: 설계 예시 통과, K1 없이 한 줄씩이면 실패',()=>{
  pass(sx3,0,{wires:s3base(),hoses:S3H(),set:{SU:0.5}});
  const naive=[w('R24_1_0','PB1_13','red'),w('PB1_14','V2_Ya_p','red'),w('R24_5_0','LS4_1','red'),w('LS4_4','V1_Ya_p','red'),
    w('R24_5_1','LS2_1','red'),w('LS2_4','V1_Yb_p','red'),w('R24_5_2','LS1_1','red'),w('LS1_4','V2_Yb_p','red'),...solN()];
  assert.ok(failed(gradeStage(sx3,0,{wires:naive,hoses:S3H(),set:{SU:0.5}})).some(s=>s.startsWith('PB1 → 변위단계선도')));
});
test('산업 공3 유지보수 1) 연속/연속정지: 예시 통과, 기본 회로 그대로면 실패',()=>{
  pass(sx3,1,{wires:s3m1(),hoses:S3H(),set:{SU:0.5}});
  assert.ok(failed(gradeStage(sx3,1,{wires:s3base(),hoses:S3H(),set:{SU:0.5}})).length>0);
});
test('산업 공3 유지보수 2) A 리밋 → 유도형 센서: 예시 통과',()=>{
  pass(sx3,2,{wires:s3m2(),hoses:S3H(),set:{SU:0.5}});
  assert.ok(failed(gradeStage(sx3,2,{wires:s3m1(),hoses:S3H(),set:{SU:0.5}})).length>0);
});

/* ---------- 산업 공4: A+ A− B+ B− ---------- */
const sx4=EX('sx4');
const S4H=()=>hoses('V1_4','A_cap');
// K1 = LS4(NC)·(LS2 ∥ K1), Y2 = K1(코일 줄에서), Y1 = PB1·K1(NC)·LS3, Y3 = LS1·K1, Y4 = LS4
const s4base=()=>[w('R24_5_0','LS4_1','red'),w('LS4_2','LS2_1','red'),w('LS2_4','K1_A1','red'),w('LS4_2','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('K1_A1','V1_Yb_p','red'),
  w('R24_1_0','PB1_13','red'),w('PB1_14','K1_31','red'),w('K1_32','LS3_1','red'),w('LS3_4','V1_Ya_p','red'),
  w('R24_5_1','LS1_1','red'),w('LS1_4','K1_21','red'),w('K1_24','V2_Ya_p','red'),
  w('LS4_4','V2_Yb_p','red'),...solN()];
// 유지보수 1): K2 = C1(NC)·(PB2 ∥ K2), K2 NO를 PB1과 병렬, 카운터는 LS4로, C1 NO → H2, PB3 리셋
const s4m1=()=>s4base().concat([w('R24_6_0','C1_11','red'),w('C1_12','PB2_13','red'),w('PB2_14','K2_A1','red'),w('C1_12','K2_11','red'),w('K2_14','K2_A1','red'),w('K2_A2','R0_5_1','blue'),
  w('R24_6_1','K2_21','red'),w('K2_24','K1_31','red'),
  w('LS4_4','C1_A1','red'),w('C1_A2','R0_4_0','blue'),w('R24_4_0','C1_21','red'),w('C1_24','H2_p','red'),w('H2_n','R0_2_0','blue'),
  w('R24_1_1','PB3_13','red'),w('PB3_14','C1_R1','red'),w('C1_R2','R0_4_1','blue')]);
// 유지보수 2): LS3(직렬 접점) → S3로 K3를 켜 K3 NO, LS4 NC → S4로 K4를 켜 K4 NC, LS4 NO 자리는 S4 흑색
const s4m2=()=>without(s4m1(),x=>[x.a,x.b].some(j=>/^LS[34]_/.test(j))).concat([...sensor('S3'),...sensor('S4','R24_2_1','R0_2_1'),
  w('S3_out','K3_A1','red'),w('K3_A2','R0_5_2','blue'),w('K1_32','K3_11','red'),w('K3_14','V1_Ya_p','red'),
  w('S4_out','K4_A1','red'),w('K4_A2','R0_6_0','blue'),w('R24_5_0','K4_11','red'),w('K4_12','LS2_1','red'),w('K4_12','K1_11','red'),
  w('S4_out','V2_Yb_p','red'),w('S4_out','C1_A1','red')]);
test('산업 공4 기본 동작: 설계 예시 통과, 압력을 안 맞추면 실패',()=>{
  pass(sx4,0,{wires:s4base(),hoses:S4H(),set:{SU:0.5}});
  assert.ok(failed(gradeStage(sx4,0,{wires:s4base(),hoses:S4H(),set:{}})).some(s=>s.startsWith('서비스 유닛 압력')));
});
test('산업 공4 유지보수 1) 연속 3회 + 완료 램프: 예시 통과, 램프가 없으면 실패',()=>{
  pass(sx4,1,{wires:s4m1(),hoses:S4H(),set:{SU:0.5,C1:3}});
  assert.ok(failed(gradeStage(sx4,1,{wires:without(s4m1(),x=>x.b==='H2_p'),hoses:S4H(),set:{SU:0.5,C1:3}})).length>0);
});
test('산업 공4 유지보수 2) B 리밋 → 센서: 예시 통과',()=>{
  pass(sx4,2,{wires:s4m2(),hoses:S4H(),set:{SU:0.5,C1:3}});
  assert.ok(failed(gradeStage(sx4,2,{wires:s4m1(),hoses:S4H(),set:{SU:0.5,C1:3}})).length>0);
});
test('산업기사 과제: 채점 항목이 실제로 만들어진다 (빈 채점 아님)',()=>{
  for(const id of ['sx1','sx2','sx3','sx4']){
    const x=EX(id);assert.equal(x.exam.level,undefined);assert.equal(x.level,'industrial');
    x.exam.stages.forEach((s,k)=>{const r=gradeStage(x,k,{wires:[],hoses:[],set:{}});assert.ok(r.length>=3&&r.some(i=>!i.ok),`${id} ${k}`);});
  }
});
