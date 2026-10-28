/* 엔진 테스트: 전기·공압 계산과 부품 동작 규칙 */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {w,h}=require('./fixtures.js');

const {get}=load();
const run=(...a)=>get('run')(...a);
// 자유 실습과 같은 배치: A 편솔(Y1), B 양솔(Y2·Y3)
function world(board,c){
  get('configure')({parts:get('makeParts')(get('LAYOUTS').air,board)});
  return get('newWorld')(get('clone')(get('withJumpers')(get('LAYOUTS').air,c)));   // 기본 전원 선 포함
}
const FREE={cylA:'cylinder',valveA:'valve52s',cylB:'cylinder',valveB:'valve52d'};

test('솔레노이드 이름은 밸브 자리 순서대로 붙는다',()=>{
  const names=b=>{get('configure')({parts:get('makeParts')(get('LAYOUTS').air,b)});return get('LAYOUT').loads.filter(l=>l.sol).map(l=>l.name).join(',');};
  assert.equal(names(FREE),'Y1,Y2,Y3');
  assert.equal(names({...FREE,valveA:'valve52d'}),'Y1,Y2,Y3,Y4');
  assert.equal(names({...FREE,valveA:'valve52d',valveB:'valve52s'}),'Y1,Y2,Y3');
  assert.equal(names({cylA:'cylinder',valveA:'valve52s'}),'Y1');
});

test('합선이면 전원이 차단되고 short 이벤트가 남는다',()=>{
  const s=world(FREE,{wires:[w('R24_0_0','R0_0_0','red')],hoses:[]});
  run(s,{power:true},.1);
  assert.equal(s.power,false);
  assert.deepEqual([...s.events],['short']);
});

test('누름버튼: NO는 누를 때만, NC는 안 누를 때만 닫힌다',()=>{
  const s=world(FREE,{wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','H1_p','red'),w('H1_n','R0_2_0','blue'),
    w('R24_1_1','PB1_11','red'),w('PB1_12','H2_p','red'),w('H2_n','R0_2_1','blue')],hoses:[]});
  run(s,{power:true,PB1:false},.1);
  assert.deepEqual([s.out.H1,s.out.H2],[false,true]);
  run(s,{PB1:true},.1);
  assert.deepEqual([s.out.H1,s.out.H2],[true,false]);
});

// A: PB1 → Y1(편솔), B: PB1 → Y2, PB2 → Y3 (양솔)
const twoCyl={
  wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','V2_Ya_p','red'),w('V2_Ya_n','R0_1_0','blue'),
         w('R24_1_1','PB2_13','red'),w('PB2_14','V2_Yb_p','red'),w('V2_Yb_n','R0_1_1','blue'),
         w('PB1_14','V1_Ya_p','red'),w('V1_Ya_n','R0_1_2','blue')],
  hoses:[h('D1','V1_1'),h('D2','V2_1'),h('V1_4','A_cap'),h('V1_2','A_rod'),h('V2_4','B_cap'),h('V2_2','B_rod')]
};

test('편솔 밸브: 솔레노이드가 꺼지면 스프링으로 돌아와 실린더 후진',()=>{
  const s=world(FREE,twoCyl);
  run(s,{power:true,air:true},1);
  assert.equal(s.cyl.A,0);
  run(s,{PB1:true},.3); run(s,{PB1:false},.05);
  assert.equal(s.valve.V1,0,'손을 떼면 밸브 복귀');
  run(s,{},1.5);
  assert.equal(s.cyl.A,0);
});

test('양솔 밸브: 신호가 꺼져도 위치를 기억, 반대쪽 신호로만 돌아온다',()=>{
  const s=world(FREE,twoCyl);
  run(s,{power:true,air:true},1);
  run(s,{PB1:true},.2); run(s,{PB1:false},1.5);
  assert.equal(s.valve.V2,1);
  assert.equal(s.cyl.B,1,'짧게 눌렀다 떼도 B는 끝까지 전진');
  run(s,{PB2:true},.2); run(s,{PB2:false},1.5);
  assert.equal(s.valve.V2,0);
  assert.equal(s.cyl.B,0);
});

test('실린더 두 개는 따로 움직인다',()=>{
  const s=world(FREE,{wires:twoCyl.wires.slice(0,6),hoses:twoCyl.hoses});   // A 솔레노이드는 배선 안 함
  run(s,{power:true,air:true},.5);
  run(s,{PB1:true},.2); run(s,{PB1:false},1.5);
  assert.deepEqual([s.cyl.A,s.cyl.B],[0,1]);
});

test('행정 시간: 1초에 끝까지 이동, 중간에는 그 사이 값',()=>{
  const s=world(FREE,twoCyl);
  run(s,{power:true,air:true},.5);
  run(s,{PB1:true},.5);
  assert.ok(s.cyl.A>.4&&s.cyl.A<.6,`0.5초 뒤 위치 ${s.cyl.A}`);
  run(s,{},.6);
  assert.equal(s.cyl.A,1);
});

test('공기 공급이 꺼져 있으면 움직이지 않는다',()=>{
  const s=world(FREE,twoCyl);
  run(s,{power:true,air:false,PB1:true},2);
  assert.deepEqual([s.cyl.A,s.cyl.B],[0,0]);
});

test('릴레이 이름은 릴레이 모듈 순서대로 K1~K6',()=>{
  get('configure')({parts:get('makeParts')(get('LAYOUTS').air,FREE)});
  assert.equal(get('LAYOUT').loads.filter(l=>l.coil).map(l=>l.name).join(','),'K1,K2,K3,K4,K5,K6');
});

// PB1(NO) → K1 코일. K1의 1번 접점으로 자기유지, 정지는 PB2(NC). K1 2번 접점 NO → H1, 3번 접점 NC → H2
const selfHold={wires:[
  w('R24_1_0','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('R24_1_1','PB2_11','red'),w('PB2_12','K1_11','red'),w('K1_14','K1_A1','red'),
  w('R24_5_0','K1_21','red'),w('K1_24','H1_p','red'),w('H1_n','R0_2_0','blue'),
  w('R24_5_1','K1_31','red'),w('K1_32','H2_p','red'),w('H2_n','R0_2_1','blue')],hoses:[]};

test('릴레이 접점: 코일이 켜지면 NO 닫힘, NC 열림',()=>{
  const s=world(FREE,selfHold);
  run(s,{power:true},.1);
  assert.deepEqual([s.relay.K1,s.out.H1,s.out.H2],[false,false,true]);
  run(s,{PB1:true},.1);
  assert.deepEqual([s.relay.K1,s.out.H1,s.out.H2],[true,true,false]);
});

test('자기유지: PB1을 떼도 K1 유지, PB2(NC)를 누르면 해제',()=>{
  const s=world(FREE,selfHold);
  run(s,{power:true,PB1:true},.1); run(s,{PB1:false},.5);
  assert.equal(s.relay.K1,true,'PB1을 뗀 뒤에도 유지');
  run(s,{PB2:true},.1); run(s,{PB2:false},.5);
  assert.equal(s.relay.K1,false,'PB2로 해제된 뒤 다시 켜지지 않음');
});

test('릴레이는 한 박자 늦게 접점이 바뀐다 (자기 NC로 코일을 끊으면 붙었다 떨어졌다 반복)',()=>{
  const s=world(FREE,{wires:[w('R24_5_0','K1_11','red'),w('K1_12','K1_A1','red'),w('K1_A2','R0_5_0','blue')],hoses:[]});
  run(s,{power:true},0);
  const seen=new Set();
  for(let i=0;i<10;i++){get('stepWorld')(s,.02);seen.add(s.relay.K1);}
  assert.deepEqual([...seen].sort(),[false,true]);
});

// 센서: LS2는 A 전진 끝, S1은 A 후진 끝
const SENS={cylA:'cylinder',valveA:'valve52s',LS2:'A+',S1:'A-'};
const airA=[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod')];
const pushA=[w('R24_1_0','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('V1_Ya_n','R0_1_0','blue')];

test('리밋스위치: 실린더가 그 끝에 닿았을 때만 눌리고 c접점이 바뀐다',()=>{
  // LS2 NO(4) → H1, NC(2) → H2
  const s=world(SENS,{wires:[...pushA,w('R24_2_0','LS2_1','red'),w('LS2_4','H1_p','red'),w('LS2_2','H2_p','red'),
    w('H1_n','R0_2_0','blue'),w('H2_n','R0_2_1','blue')],hoses:airA});
  run(s,{power:true,air:true},.5);
  assert.deepEqual([s.sensor.LS2,s.out.H1,s.out.H2],[false,false,true]);
  run(s,{PB1:true},.5);
  assert.equal(s.sensor.LS2,false,'중간에서는 안 눌림');
  run(s,{},1);
  assert.deepEqual([s.sensor.LS2,s.out.H1,s.out.H2],[true,true,false]);
});

test('3선식 센서(PNP): 전원이 있고 감지하면 출력선이 +24V가 된다',()=>{
  const sensorLamp=[w('R24_2_0','S1_p','red'),w('S1_n','R0_2_0','blue'),w('S1_out','H1_p','red'),w('H1_n','R0_2_1','blue')];
  const s=world(SENS,{wires:[...pushA,...sensorLamp],hoses:airA});
  run(s,{power:true,air:true},.2);
  assert.deepEqual([s.sensor.S1,s.out.H1],[true,true],'처음부터 후진 끝이라 감지 중');
  run(s,{PB1:true},1.2);
  assert.deepEqual([s.sensor.S1,s.out.H1],[false,false],'전진하면 감지 끝');
});

test('3선식 센서: 청색(0V)이 빠지면 감지해도 출력이 없다',()=>{
  const s=world(SENS,{wires:[w('R24_2_0','S1_p','red'),w('S1_out','H1_p','red'),w('H1_n','R0_2_1','blue')],hoses:[]});
  run(s,{power:true},.2);
  assert.deepEqual([s.sensor.S1,s.out.H1],[true,false]);
});

test('공급이 배기로 바로 이어지면 누설로 판단하고 압력이 걸리지 않는다',()=>{
  const s=world(FREE,{wires:[],hoses:[h('D1','V1_1'),h('D2','V1_4'),h('V1_2','A_rod')]});
  run(s,{air:true},.5);
  assert.equal(s.out.leak,true);
});

/* 타이머·카운터 */
const TC={cylA:'cylinder',valveA:'valve52s'};
test('타이머: 코일이 켜지고 설정 시간이 지나야 접점이 바뀌고, 코일이 꺼지면 곧바로 돌아온다',()=>{
  // PB1 → T1 코일, T1 NO(11-14) → H1
  const c={wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','T1_A1','red'),w('T1_A2','R0_3_0','blue'),
    w('R24_3_0','T1_11','red'),w('T1_14','H1_p','red'),w('H1_n','R0_2_0','blue')],hoses:[],set:{T1:2}};
  const s=world(TC,c);
  run(s,{power:true,PB1:true},1.9);
  assert.equal(s.out.H1,false,'1.9초: 아직');
  run(s,{},0.2);
  assert.equal(s.out.H1,true,'2.1초: 바뀜');
  run(s,{PB1:false},0.1);
  assert.equal(s.out.H1,false,'코일이 꺼지면 바로 원래대로');
});

test('타이머 설정의 처음 값은 1초 (시험처럼 직접 맞추게)',()=>{
  const s=world(TC,{wires:[],hoses:[]});
  assert.deepEqual([s.set.T1,s.set.C1],[1,1]);
});

test('카운터: 계수 입력이 꺼졌다 켜질 때마다 1씩 세고, 설정에 닿으면 접점이 바뀌며, 리셋하면 0',()=>{
  // PB1 → C1 계수, PB2 → C1 리셋, C1 NO → H1
  const c={wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','C1_A1','red'),w('C1_A2','R0_4_0','blue'),
    w('R24_1_1','PB2_13','red'),w('PB2_14','C1_R1','red'),w('C1_R2','R0_4_1','blue'),
    w('R24_4_0','C1_11','red'),w('C1_14','H1_p','red'),w('H1_n','R0_2_0','blue')],hoses:[],set:{C1:3}};
  const s=world(TC,c);
  run(s,{power:true},.1);
  const tap=()=>{run(s,{PB1:true},.2);run(s,{PB1:false},.2);};
  tap();tap();
  assert.deepEqual([s.counter.C1.n,s.out.H1],[2,false]);
  run(s,{PB1:true},1);   // 계속 누르고 있어도 한 번만 센다
  assert.deepEqual([s.counter.C1.n,s.out.H1],[3,true]);
  run(s,{PB1:false,PB2:true},.2);run(s,{PB2:false},.1);
  assert.deepEqual([s.counter.C1.n,s.out.H1],[0,false]);
});

/* 전원 배선: 전원 모듈 레일만 실제 24V/0V, 다른 모듈은 기본 전원 선으로 받는다 */
test('기본 전원 선은 12개 (24V·0V 각각 전원→스위치→램프→타이머→카운터, 전원→릴레이→릴레이)',()=>{
  const j=get('defaultJumpers')(get('LAYOUTS').air);
  assert.equal(j.length,12);
  assert.ok(j.every(x=>x.base&&(x.a.startsWith('R0')?x.color==='blue':x.color==='red')));
});
test('기본 전원 선을 빼면 그 모듈 레일에는 전기가 없다',()=>{
  // 스위치 모듈 레일(R24_1_0)에서 받아 PB1 → H1
  const user=[w('R24_1_0','PB1_13','red'),w('PB1_14','H1_p','red'),w('H1_n','R0_2_0','blue')];
  const s=world({},{wires:user,hoses:[]});run(s,{power:true,PB1:true},.1);
  assert.equal(s.out.H1,true,'기본 전원 선이 있으면 켜짐');
  get('configure')({parts:get('makeParts')(get('LAYOUTS').air,{})});
  const bare=get('newWorld')({wires:user,hoses:[],pw:1});   // pw:1 = 기본 전원 선을 일부러 뺀 회로
  run(bare,{power:true,PB1:true},.1);
  assert.equal(bare.out.H1,false,'빼면 꺼짐');
});
test('타이머·카운터는 모듈 전원이 있어야 동작 (전자식)',()=>{
  const user=[w('R24_0_2','PB1_13','red'),w('PB1_14','T1_A1','red'),w('T1_A2','R0_0_2','blue')];
  get('configure')({parts:get('makeParts')(get('LAYOUTS').air,{})});
  const jumpers=get('defaultJumpers')(get('LAYOUTS').air).filter(x=>!x.b.endsWith('_3_0'));   // 타이머 모듈로 가는 선만 뺌
  const s=get('newWorld')({wires:jumpers.concat(user),hoses:[],pw:1,set:{T1:1}});
  run(s,{power:true,PB1:true},2);
  assert.deepEqual([s.timer.T1.out,s.modPow.RK3],[false,false]);
});

test('서비스 유닛 압력이 0.1 MPa보다 낮으면 실린더가 움직이지 않는다',()=>{
  const c={wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('V1_Ya_n','R0_1_0','blue')],
    hoses:[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod')],set:{SU:0.05}};
  const s=world({cylA:'cylinder',valveA:'valve52s'},c);
  run(s,{power:true,air:true,PB1:true},2);
  assert.equal(s.cyl.A,0);
  s.set.SU=0.5;run(s,{},1.2);
  assert.equal(s.cyl.A,1);
});
