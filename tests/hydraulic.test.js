/* 유압 엔진 테스트: 파워유닛(펌프·탱크·릴리프), 4/2·4/3 밸브, 유압모터, 체크밸브, 유량조절 */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {w,h}=require('./fixtures.js');

const {get}=load();
const run=(...a)=>get('run')(...a);
const HYD=()=>get('LAYOUTS').hyd;
function world(board,c){
  get('configure')({parts:get('makeParts')(HYD(),board)});
  return get('newWorld')(get('clone')(get('withJumpers')(HYD(),Object.assign({set:{}},c))));
}
const end=v=>get('cylEnd')(v);
// PB1 → Ya(V1), PB2 → Yb(V1) — 전원 모듈 레일에서 바로
const pbWires=(v,two)=>[w('R24_0_2','PB1_13','red'),w('PB1_14',v+'_Ya_p','red'),w(v+'_Ya_n','R0_0_2','blue'),
  ...(two?[w('R24_0_2','PB2_13','red'),w('PB2_14',v+'_Yb_p','red'),w(v+'_Yb_n','R0_0_2','blue')]:[])];
// 밸브 P←펌프, T→탱크, A→후방, B→전방
const cylHoses=(v,c)=>[h('HP1',v+'_P'),h(v+'_T','HT1'),h(v+'_A',c+'_cap'),h(v+'_B',c+'_rod')];

test('유압 판이면 LAYOUT.fluid가 hyd, 파워유닛 릴리프 설정 RV는 4.0 MPa에서 시작',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42'},{wires:[],hoses:[]});
  assert.equal(get('LAYOUT').fluid,'hyd');
  assert.equal(s.set.RV,4);
  get('configure')({parts:get('makeParts')(get('LAYOUTS').air,{})});
  assert.equal(get('LAYOUT').fluid,'air');
});

test('4/2 편솔: 평상시 P→B로 후진 유지, Y1 여자면 P→A로 전진',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42'},{wires:pbWires('V1'),hoses:cylHoses('V1','A')});
  s.cyl.A=.5;run(s,{power:true,air:true},1.5);
  assert.equal(end(s.cyl.A),'-');
  run(s,{PB1:true},1.5);assert.equal(end(s.cyl.A),'+');
  run(s,{PB1:false},1.5);assert.equal(end(s.cyl.A),'-');
});

test('탱크(T) 호스를 빼먹으면 돌아갈 길이 없어 움직이지 않는다',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42'},{wires:pbWires('V1'),hoses:cylHoses('V1','A').filter(x=>x.b!=='HT1')});
  run(s,{power:true,air:true,PB1:true},2);
  assert.equal(s.cyl.A,0);
});

test('펌프가 꺼져 있으면 움직이지 않고, 켜면 압력계가 릴리프 설정값',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42'},{wires:pbWires('V1'),hoses:cylHoses('V1','A'),set:{RV:3.5}});
  run(s,{power:true,air:false,PB1:true},1.5);
  assert.equal(s.cyl.A,0);assert.equal(s.supP,0);
  run(s,{air:true},1.5);
  assert.equal(end(s.cyl.A),'+');assert.equal(s.supP,3.5);assert.equal(s.cylP.A,3.5);
});

test('4/3 중립 블록: 버튼을 떼면 그 자리에 멈추고, Yb로 후진',()=>{
  const s=world({cylA:'cylinder',valveA:'valve43c'},{wires:pbWires('V1',true),hoses:cylHoses('V1','A')});
  run(s,{power:true,air:true},.5);assert.equal(s.cyl.A,0);
  run(s,{PB1:true},.4);run(s,{PB1:false},1);
  const mid=s.cyl.A;assert.ok(mid>.2&&mid<.8,'중간 '+mid);
  assert.equal(end(mid),'');
  assert.equal(get('expectOk')(s,'A',''),true,'expect "" = 중간');
  run(s,{},1);assert.equal(s.cyl.A,mid,'그대로 멈춤');
  run(s,{PB2:true},1.5);assert.equal(end(s.cyl.A),'-');
  run(s,{PB1:true,PB2:true},.5);assert.equal(s.valve.V1,0,'둘 다 켜지면 가운데');
});

test('4/3 중립 ABT: 가운데에서 A·B가 탱크로 이어지고 P는 막힘 (누설 아님)',()=>{
  const s=world({cylA:'cylinder',valveA:'valve43a'},{wires:pbWires('V1',true),hoses:cylHoses('V1','A')});
  run(s,{power:true,air:true},.3);
  assert.equal(s.out.leak,false);
  run(s,{PB1:true},1.5);assert.equal(end(s.cyl.A),'+');
  run(s,{PB1:false},1);assert.equal(end(s.cyl.A),'+');
});

test('유압모터: A→B 정회전, B→A 역회전, 밸브 가운데면 정지 (이름은 자리의 ids로 M)',()=>{
  const s=world({cylB:'motor',valveB:'valve43c'},{wires:pbWires('V2',true),hoses:[h('HP1','V2_P'),h('V2_T','HT1'),h('V2_A','M_a'),h('V2_B','M_b')]});
  assert.ok('M' in s.motor);
  run(s,{power:true,air:true,PB1:true},.5);
  assert.equal(s.motor.M.dir,1);assert.equal(get('expectOk')(s,'M','+'),true);
  const a=s.motor.M.ang;run(s,{},.5);assert.ok(s.motor.M.ang>a,'돈다');
  run(s,{PB1:false,PB2:true},.3);assert.equal(get('expectOk')(s,'M','-'),true);
  run(s,{PB2:false},.3);assert.equal(get('expectOk')(s,'M','0'),true);
});

test('체크밸브: 1→2 방향으로 끼우면 흐르고, 거꾸로 끼우면 막힌다 (펌프 토출구)',()=>{
  const go=(a,b)=>{
    const s=world({cylA:'cylinder',valveA:'valve42',R1:'chk'},{wires:pbWires('V1'),hoses:[h('HP1',a),h(b,'V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','A_rod')]});
    run(s,{power:true,air:true,PB1:true},1.5);return s;
  };
  assert.equal(end(go('CV1_1','CV1_2').cyl.A),'+');
  assert.equal(go('CV1_2','CV1_1').cyl.A,0);
});

test('체크밸브: 실린더에서 나오는 기름이 1→2로 탱크 쪽에 가면 지나간다',()=>{
  // 전방 줄에 체크밸브 2(밸브 쪽)… 1(실린더 쪽): 전진할 때 전방 기름이 1→2로 빠져나감, 후진 공급은 2→1이라 막힘
  const s=world({cylA:'cylinder',valveA:'valve42',MA2:'chk'},{wires:pbWires('V1'),hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','CV1_2'),h('CV1_1','A_rod')]});
  run(s,{power:true,air:true,PB1:true},1.5);assert.equal(end(s.cyl.A),'+');
  run(s,{PB1:false},1.5);assert.equal(end(s.cyl.A),'+','후진 공급은 막혀서 그대로');
});

test('유량조절: 실린더로 들어가는 기름을 조이면 미터인, 나가는 기름을 조이면 미터아웃',()=>{
  const go=hoses=>{
    const s=world({cylA:'cylinder',valveA:'valve42',MA1:'fcv'},{wires:pbWires('V1'),hoses,set:{F1:2}});
    run(s,{power:true,air:true,PB1:true},.5);return s;
  };
  // 후방 줄: 밸브 A → F1_2 … F1_1 → 후방 (들어가는 기름이 2→1 조임)
  const sIn=go([h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','F1_2'),h('F1_1','A_cap'),h('V1_B','A_rod')]);
  assert.equal(sIn.meter.A,'in');assert.ok(sIn.cyl.A<.15,'느림 '+sIn.cyl.A);
  const sFree=go([h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','F1_1'),h('F1_2','A_cap'),h('V1_B','A_rod')]);
  assert.equal(sFree.meter.A||'','');assert.ok(sFree.cyl.A>.45,'자유 '+sFree.cyl.A);
});

test('P와 T를 곧바로 이으면 압력이 오르지 않는다 (누설로 판단)',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42'},{wires:pbWires('V1'),hoses:[...cylHoses('V1','A'),h('HP2','HT2')]});
  run(s,{power:true,air:true,PB1:true},1);
  assert.equal(s.out.leak,true);assert.equal(s.supP,0);assert.equal(s.cyl.A,0);
});

test('유압 판의 모든 부품이 그리기·화면 갱신 중 오류 없이 돈다',()=>{
  for(const board of [{cylA:'cylinder',valveA:'valve42',cylB:'motor',valveB:'valve43c',MA1:'fcv',MB1:'chk',R1:'chk',LS1:'A-',LS2:'A+'},
                      {cylA:'cylinder',valveA:'valve43a',cylB:'cylinder',valveB:'valve42',S1:'B+'},
                      {cylA:'cylw',valveA:'valve43a',LA:'lock',cylB:'cylw',valveB:'valve43c',MB1:'psw',MB2:'cbv',R1:'thr',LS2:'A+'},
                      {cylA:'cylinder',valveA:'valve42',MA1:'hprv',MA2:'thr',cylB:'cylinder',valveB:'valve43a',LB:'lock'},
                      {cylA:'cylinder',valveA:'valve22',cylB:'motor',valveB:'valve22'}]){
    get('configure')({parts:get('makeParts')(HYD(),board)});
    const parts=get('LAYOUT').parts;
    get('buildScene')(parts,HYD().board);
    const J=get('JACKS');
    for(const id of ['HP1','HT3','V1_P','V1_A'])assert.ok(J[id],id);
    const s=get('newWorld')({wires:[],hoses:[]});
    for(const on of [false,true]){s.air=on;for(const k in s.valve)s.valve[k]=on?2:1;for(const p of parts)if(get('PARTS')[p.type].render)get('PARTS')[p.type].render(p,s);}
  }
});

/* ---------- 유지보수 기기: 양방향 유량조절·블리드오프·감압·압력스위치·카운터밸런스·파일럿 체크, 하중 실린더 ---------- */
const P43=pbWires('V1',true);
const hold=(s,btn,sec)=>{run(s,{[btn]:true},sec);run(s,{[btn]:false},0.02);};

test('양방향 유량조절: 후방 줄에 끼우면 전진도 후진도 느려진다',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42',MA1:'thr'},{wires:pbWires('V1'),hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','F1_1'),h('F1_2','A_cap'),h('V1_B','A_rod')],set:{F1:3}});
  run(s,{power:true,air:true,PB1:true},1);
  assert.ok(s.cyl.A>.2&&s.cyl.A<.4,'전진 느림 '+s.cyl.A);
  run(s,{},3);assert.equal(end(s.cyl.A),'+');
  run(s,{PB1:false},1);assert.ok(s.cyl.A>.6,'후진도 느림 '+s.cyl.A);
});

test('블리드오프: 펌프 P2 → 양방향 유량조절 → 탱크. 누설로 보지 않고, 많이 열수록 느려진다',()=>{
  const go=open=>{
    const s=world({cylA:'cylinder',valveA:'valve42',R1:'thr'},{wires:pbWires('V1'),hoses:[...cylHoses('V1','A'),h('HP2','F1_1'),h('F1_2','HT2')],set:{F1:open}});
    run(s,{power:true,air:true,PB1:true},.5);return s;
  };
  const a=go(2),b=go(8);
  assert.equal(a.out.leak,false);assert.equal(a.supP,4);
  assert.equal(a.meter.A,'bleed');
  assert.ok(b.cyl.A<a.cyl.A,`많이 열면 더 느림 ${b.cyl.A} < ${a.cyl.A}`);
});

test('유압 감압밸브: 실린더 쪽 압력이 설정값, 돌아오는 기름은 그냥 지나감',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42',MA1:'hprv'},{wires:pbWires('V1'),hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','PR1_1'),h('PR1_2','A_cap'),h('V1_B','A_rod')],set:{PR1:2}});
  run(s,{power:true,air:true,PB1:true},.5);
  assert.equal(s.cylP.A,2);
  run(s,{},1);assert.equal(end(s.cyl.A),'+');
  run(s,{PB1:false},1.5);assert.equal(end(s.cyl.A),'-','후진할 때 후방 기름이 2→1로 돌아감');
});

test('압력스위치: 실린더가 움직이는 동안은 꺼져 있다가, 끝에 닿아 압력이 오르면 켜진다',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42',MA1:'psw'},{wires:pbWires('V1'),hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','PS1_a'),h('PS1_b','A_cap'),h('V1_B','A_rod')]});
  run(s,{power:true,air:true,PB1:true},.4);
  assert.equal(s.sensor.PS1,false,'움직이는 중');
  run(s,{},1);assert.equal(end(s.cyl.A),'+');
  assert.equal(get('expectOk')(s,'PS1',true),true,'끝에 닿으면 켜짐');
  s.set.PS1=4.5;run(s,{},.1);assert.equal(s.sensor.PS1,false,'설정이 릴리프보다 높으면 안 켜짐');
});

test('압력스위치 접점: NO(1-4)로 램프를 켠다',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42',MA1:'psw'},{wires:[...pbWires('V1'),w('R24_0_2','PS1_1','red'),w('PS1_4','H1_p','red'),w('H1_n','R0_0_2','blue'),w('R24_0_0','R24_2_0','red'),w('R0_0_0','R0_2_0','blue')],hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','PS1_a'),h('PS1_b','A_cap'),h('V1_B','A_rod')]});
  run(s,{power:true,air:true,PB1:true},.3);assert.equal(s.out.H1,false);
  run(s,{},1.2);assert.equal(s.out.H1,true);
});

const lift=extra=>({wires:P43,hoses:extra});
test('하중 실린더: ABT 중립이면 무게로 내려가고, 올 포트 블록·4/2면 그 자리',()=>{
  const drop=world({cylA:'cylw',valveA:'valve43a'},lift(cylHoses('V1','A')));
  run(drop,{power:true,air:true},2);
  assert.ok(drop.cyl.A>.3,'ABT: 내려감 '+drop.cyl.A);
  const blk=world({cylA:'cylw',valveA:'valve43c'},lift(cylHoses('V1','A')));
  run(blk,{power:true,air:true},2);assert.equal(blk.cyl.A,0);
  const s42=world({cylA:'cylw',valveA:'valve42'},{wires:pbWires('V1'),hoses:cylHoses('V1','A')});
  run(s42,{power:false,air:false},2);assert.equal(s42.cyl.A,0,'펌프가 꺼져도 P 쪽은 막혀 있음');
});

test('카운터밸런스: 전방 줄에 끼우면 ABT 중립에서도 안 내려가고, Y1로 밀면 내려간다',()=>{
  const hoses=[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','A_cap'),h('V1_B','CB1_1'),h('CB1_2','A_rod')];
  const s=world({cylA:'cylw',valveA:'valve43a',MA2:'cbv'},lift(hoses));
  run(s,{power:true,air:true},2);assert.equal(s.cyl.A,0,'자중 낙하 없음');
  run(s,{PB1:true},1.5);assert.equal(end(s.cyl.A),'+','후방 압력이 설정 이상 → 열림');
  run(s,{PB1:false,PB2:true},1.5);assert.equal(end(s.cyl.A),'-','들어 올릴 때는 1→2 자유');
  run(s,{PB2:false},.5);hold(s,'PB1',.4);
  const mid=s.cyl.A;run(s,{},2);assert.equal(s.cyl.A,mid,'중간에서도 그대로');
  s.set.CB1=5;run(s,{PB1:true},1);assert.equal(s.cyl.A,mid,'설정이 릴리프보다 높으면 밀어도 안 열림');
});

test('파일럿 체크 블록(로킹 회로): ABT 중립에서 꽉 고정, Y1·Y2로는 잘 움직임',()=>{
  const hoses=[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','PC1_A1'),h('PC1_A2','A_cap'),h('V1_B','PC1_B1'),h('PC1_B2','A_rod')];
  const s=world({cylA:'cylw',valveA:'valve43a',LA:'lock'},lift(hoses));
  run(s,{power:true,air:true},2);assert.equal(s.cyl.A,0);
  hold(s,'PB1',.5);const mid=s.cyl.A;assert.ok(mid>.2&&mid<.8,'중간 '+mid);
  run(s,{},2);assert.equal(s.cyl.A,mid,'로킹');
  run(s,{PB2:true},1.5);assert.equal(end(s.cyl.A),'-');
  run(s,{PB2:false,air:false},2);assert.equal(end(s.cyl.A),'-','펌프를 꺼도 그대로');
});

test('2/2 밸브: 평상시 막힘, Y 여자면 P→A. 한 방향 모터를 켜고 끈다',()=>{
  const s=world({cylB:'motor',valveB:'valve22'},{wires:pbWires('V2'),hoses:[h('HP1','V2_P'),h('V2_A','M_a'),h('M_b','HT1')]});
  run(s,{power:true,air:true},.3);assert.equal(s.motor.M.dir,0);assert.equal(s.out.leak,false);
  run(s,{PB1:true},.3);assert.equal(s.motor.M.dir,1);
  run(s,{PB1:false},.3);assert.equal(s.motor.M.dir,0);
});

test('카운터밸런스를 후방 줄에 끼우면 소용없다: 전방 기름은 탱크로 빠지고 후방은 체크 쪽으로 채워져 내려감',()=>{
  const s=world({cylA:'cylw',valveA:'valve43a',MA1:'cbv'},lift([h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','CB1_1'),h('CB1_2','A_cap'),h('V1_B','A_rod')]));
  run(s,{power:true,air:true},2);
  assert.ok(s.cyl.A>.3,'내려감 '+s.cyl.A);
});

test('펌프 토출구 체크밸브가 있어도 카운터밸런스·파일럿 체크가 열린다',()=>{
  const base=[h('HP1','CV1_1'),h('CV1_2','V1_P'),h('V1_T','HT1')];
  const cb=world({cylA:'cylw',valveA:'valve43a',MA2:'cbv',R1:'chk'},lift([...base,h('V1_A','A_cap'),h('V1_B','CB2_1'),h('CB2_2','A_rod')].map(x=>({...x,a:x.a.replace('CB2','CB1'),b:x.b.replace('CB2','CB1')}))));
  run(cb,{power:true,air:true},1);assert.equal(cb.cyl.A,0);
  run(cb,{PB1:true},1.5);assert.equal(end(cb.cyl.A),'+');
  const lk=world({cylA:'cylw',valveA:'valve43a',LA:'lock',R1:'chk'},lift([...base,h('V1_A','PC1_A1'),h('PC1_A2','A_cap'),h('V1_B','PC1_B1'),h('PC1_B2','A_rod')]));
  run(lk,{power:true,air:true,PB1:true},1.5);assert.equal(end(lk.cyl.A),'+');
  run(lk,{PB1:false,PB2:true},1.5);assert.equal(end(lk.cyl.A),'-');
});
test('펌프 쪽 체크 뒤에 거꾸로 끼운 체크밸브는 막는다',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42',R1:'chk',MA1:'chk'},{wires:pbWires('V1'),hoses:[h('HP1','CV1_1'),h('CV1_2','V1_P'),h('V1_T','HT1'),h('V1_A','CV2_2'),h('CV2_1','A_cap'),h('V1_B','A_rod')]});
  run(s,{power:true,air:true,PB1:true},1.5);assert.equal(s.cyl.A,0);
});
test('압력스위치: 릴리프를 높게 맞춰도 움직이는 동안은 켜지지 않는다',()=>{
  const s=world({cylA:'cylinder',valveA:'valve42',MA1:'psw'},{wires:pbWires('V1'),hoses:[h('HP1','V1_P'),h('V1_T','HT1'),h('V1_A','PS1_a'),h('PS1_b','A_cap'),h('V1_B','A_rod')],set:{RV:7,PS1:1}});
  run(s,{power:true,air:true,PB1:true},.4);assert.equal(s.sensor.PS1,false);
  run(s,{},1);assert.equal(s.sensor.PS1,true);
});
