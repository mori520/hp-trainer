/* 테스트용 회로 예시. 채점기가 맞게 판단하는지 확인하는 데에만 쓴다 (앱 채점은 정답 비교를 하지 않는다).
   w(a,b,색), h(a,b)로 짧게 적는다. */
let n=0;
const w=(a,b,color)=>({id:'w'+(++n),a,b,color});
const h=(a,b)=>({id:'h'+(++n),a,b});

const m0ok={wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','H1_p','red'),w('H1_n','R0_2_0','blue')],hoses:[]};
const m1ok={
  wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('V1_Ya_n','R0_1_0','blue')],
  hoses:[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod')]
};

const airA=()=>[h('D1','V1_1'),h('V1_4','A_cap'),h('V1_2','A_rod')];
const m2ok={wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','H1_p','red'),w('R24_1_1','PB1_11','red'),w('PB1_12','H2_p','red'),
  w('H1_n','R0_2_0','blue'),w('H2_n','R0_2_1','blue')],hoses:[]};
// PB1 → K1 코일, +24V → K1 NO(11-14) → Y1
const m3ok={wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('R24_5_0','K1_11','red'),w('K1_14','V1_Ya_p','red'),w('V1_Ya_n','R0_5_1','blue')],hoses:airA()};
// +24V → PB2(NC) → [PB1(NO) ∥ K1 NO(11-14)] → K1 코일, +24V → K1 NO(21-24) → Y1
const m4wires=()=>[w('R24_1_0','PB2_11','red'),w('PB2_12','PB1_13','red'),w('PB1_14','K1_A1','red'),
  w('PB2_12','K1_11','red'),w('K1_14','K1_A1','red'),w('R24_5_0','K1_21','red'),w('K1_24','V1_Ya_p','red'),
  w('K1_A2','R0_5_0','blue'),w('V1_Ya_n','R0_5_1','blue')];
const m4ok={wires:m4wires(),hoses:airA()};
const without=(c,a,b)=>({wires:c.wires.filter(x=>!(x.a===a&&x.b===b)),hoses:c.hoses});
const replace=(c,a,b,na,nb)=>({wires:c.wires.map(x=>x.a===a&&x.b===b?{...x,a:na,b:nb}:x),hoses:c.hoses});

// +24V → LS2 NC(1-2) → [PB1 ∥ K1 NO(11-14)] → K1, K1 NO(21-24) → Y1
const m5ok={wires:[w('R24_1_0','LS2_1','red'),w('LS2_2','PB1_13','red'),w('PB1_14','K1_A1','red'),
  w('LS2_2','K1_11','red'),w('K1_14','K1_A1','red'),w('R24_5_0','K1_21','red'),w('K1_24','V1_Ya_p','red'),
  w('K1_A2','R0_5_0','blue'),w('V1_Ya_n','R0_5_1','blue')],hoses:airA()};
// S2(PNP) → K2 코일, K2 NC(11-12)가 미션 5의 LS2 NC 역할
const m6ok={wires:[w('R24_1_0','S2_p','red'),w('S2_out','K2_A1','red'),w('R24_1_1','K2_11','red'),w('K2_12','PB1_13','red'),
  w('PB1_14','K1_A1','red'),w('K2_12','K1_11','red'),w('K1_14','K1_A1','red'),w('R24_5_0','K1_21','red'),w('K1_24','V1_Ya_p','red'),
  w('S2_n','R0_1_0','blue'),w('K2_A2','R0_5_0','blue'),w('K1_A2','R0_5_1','blue'),w('V1_Ya_n','R0_5_2','blue')],hoses:airA()};

const airAB=()=>[...airA(),h('D2','V2_1'),h('V2_4','B_cap'),h('V2_2','B_rod')];
// PB1 → Y1, LS2 NO → Y2 (양솔)
const m7ok={wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('V1_Ya_n','R0_1_0','blue'),
  w('R24_1_1','LS2_1','red'),w('LS2_4','V1_Yb_p','red'),w('V1_Yb_n','R0_1_1','blue')],hoses:airA()};
// A+ B+ B− A−: K1 기동·유지(K4 NC로 해제), S1 → K2, Y2 = K1·K2·K3NC, K3 = K1·(LS1 ∥ K3), K4 = K3·LS2
const m8ok={wires:[
  w('R24_1_0','K4_11','red'),w('K4_12','PB1_13','red'),w('PB1_14','K1_A1','red'),w('K4_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('R24_5_0','K1_21','red'),w('K1_24','V1_Ya_p','red'),w('V1_Ya_n','R0_5_1','blue'),
  w('R24_1_1','S1_p','red'),w('S1_n','R0_1_0','blue'),w('S1_out','K2_A1','red'),w('K2_A2','R0_5_2','blue'),
  w('R24_5_1','K1_31','red'),w('K1_34','K2_11','red'),w('K2_14','K3_11','red'),w('K3_12','V2_Ya_p','red'),w('V2_Ya_n','R0_6_0','blue'),
  w('R24_5_2','K1_41','red'),w('K1_44','LS1_1','red'),w('LS1_4','K3_A1','red'),w('K1_44','K3_21','red'),w('K3_24','K3_A1','red'),w('K3_A2','R0_6_1','blue'),
  w('R24_6_0','K3_31','red'),w('K3_34','LS2_1','red'),w('LS2_4','K4_A1','red'),w('K4_A2','R0_6_2','blue')],hoses:airAB()};

// 연속동작: K1 = PB3(NC) → [PB2 ∥ K1] , K2 = LS2(NC) → [(K1 → LS1) ∥ K2], Y1 = K2
const m9wires=()=>[w('R24_1_0','PB3_11','red'),w('PB3_12','PB2_13','red'),w('PB2_14','K1_A1','red'),w('PB3_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('R24_1_1','LS2_1','red'),w('LS2_2','K1_21','red'),w('K1_24','LS1_1','red'),w('LS1_4','K2_A1','red'),w('LS2_2','K2_11','red'),w('K2_14','K2_A1','red'),w('K2_A2','R0_5_1','blue'),
  w('R24_5_0','K2_21','red'),w('K2_24','V1_Ya_p','red'),w('V1_Ya_n','R0_5_2','blue')];
const m9ok={wires:m9wires(),hoses:airA()};
// 비상정지: 같은 회로를 ES NC(12)에서 받고, ES NO(14) → H1
const m12ok={wires:[w('R24_1_0','ES_11','red'),w('ES_12','PB2_13','red'),w('PB2_14','K1_A1','red'),w('ES_12','K1_11','red'),w('K1_14','K1_A1','red'),w('K1_A2','R0_5_0','blue'),
  w('ES_12','LS2_1','red'),w('LS2_2','K1_21','red'),w('K1_24','LS1_1','red'),w('LS1_4','K2_A1','red'),w('LS2_2','K2_11','red'),w('K2_14','K2_A1','red'),w('K2_A2','R0_5_1','blue'),
  w('ES_12','K2_21','red'),w('K2_24','V1_Ya_p','red'),w('V1_Ya_n','R0_5_2','blue'),
  w('R24_1_1','ES_13','red'),w('ES_14','H1_p','red'),w('H1_n','R0_2_0','blue')],hoses:airA()};

module.exports={w,h,
  m9:{
    ok:m9ok,
    // LS1 앞에 K1 접점이 없음 → PB2를 누르지 않아도 저절로 연속동작
    noK1gate:{wires:m9ok.wires.filter(x=>x.a!=='K1_24').map(x=>x.a==='LS2_2'&&x.b==='K1_21'?{...x,b:'LS1_1'}:x),hoses:m9ok.hoses},
    // PB3를 NO(13-14)로 연결 → K1에 전기가 가지 않아 시작이 안 됨
    stopOnNO:{wires:m9ok.wires.map(x=>x.b==='PB3_11'?{...x,b:'PB3_13'}:x.a==='PB3_12'?{...x,a:'PB3_14'}:x),hoses:m9ok.hoses},
    // PB3를 거치지 않음 → 멈추지 않음
    noStop:{wires:m9ok.wires.filter(x=>x.b!=='PB3_11').map(x=>x.a==='PB3_12'?{...x,a:'R24_1_2'}:x),hoses:m9ok.hoses}
  },
  m12:{
    ok:m12ok,
    // K1·K2·Y1을 비상정지를 거치지 않고 +24V에서 바로 받음 → 비상정지가 동작을 못 멈춤
    esBypass:{wires:m12ok.wires.map(x=>x.a==='ES_12'?{...x,a:'R24_1_2'}:x),hoses:m12ok.hoses},
    // 램프를 NC(12)에 연결 → 평소에 켜지고 비상정지 때 꺼짐
    lampOnNC:{wires:m12ok.wires.map(x=>x.a==='ES_14'?{...x,a:'ES_12'}:x),hoses:m12ok.hoses}
  },
  m7:{
    ok:m7ok,
    // LS2를 NC(2)에 연결 → 처음부터 Y2가 켜져 있어 PB1을 눌러도 Y1·Y2 동시 → 안 움직임
    lsNC:{wires:m7ok.wires.map(x=>x.a==='LS2_4'?{...x,a:'LS2_2'}:x),hoses:m7ok.hoses},
    // Y2 연결 안 함 → 전진한 채로
    noY2:without(m7ok,'LS2_4','V1_Yb_p')
  },
  m8:{
    ok:m8ok,
    // Y2가 K3 NC를 거치지 않음 → B가 돌아오지 않음
    noK3cut:{wires:m8ok.wires.filter(x=>!(x.a==='K3_12')).map(x=>x.a==='K2_14'?{...x,b:'V2_Ya_p'}:x),hoses:m8ok.hoses},
    // K4 코일 연결 빠짐 → 사이클이 끝나지 않아 A가 돌아오지 않음
    noReset:without(m8ok,'LS2_4','K4_A1')
  },
  m5:{
    ok:m5ok,
    // LS2를 NO(4)로 연결 → 처음부터 전기가 안 감
    lsNO:{wires:m5ok.wires.map(x=>x.a==='LS2_2'?{...x,a:'LS2_4'}:x),hoses:m5ok.hoses},
    // 자기유지를 +24V에서 바로 받음 → LS2가 끊어도 유지되어 후진하지 않음
    holdBypass:replace(m5ok,'LS2_2','K1_11','R24_1_1','K1_11')
  },
  m6:{
    ok:m6ok,
    // 센서 청색(0V) 빠짐 → 센서가 동작하지 않아 후진하지 않음
    noSensorGround:without(m6ok,'S2_n','R0_1_0'),
    // K2 NO(14)로 연결 → 처음부터 전기가 안 감
    k2NO:{wires:m6ok.wires.map(x=>x.a==='K2_12'?{...x,a:'K2_14'}:x),hoses:m6ok.hoses}
  },
  m2:{
    ok:m2ok,
    // H2를 NO(13-14)에 연결 → H1과 똑같이 켜짐
    h2OnNO:{wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','H1_p','red'),w('PB1_14','H2_p','red'),
      w('H1_n','R0_2_0','blue'),w('H2_n','R0_2_1','blue')],hoses:[]},
    // H2 연결 안 함
    noH2:{wires:m2ok.wires.filter(x=>!x.b.startsWith('H2')&&!x.a.startsWith('H2')&&x.b!=='PB1_11'),hoses:[]}
  },
  m3:{
    ok:m3ok,
    // 릴레이 없이 PB1이 Y1을 바로 켬
    noRelay:{wires:[w('R24_1_0','PB1_13','red'),w('PB1_14','V1_Ya_p','red'),w('V1_Ya_n','R0_1_0','blue')],hoses:airA()},
    // Y1을 K1 NC(12)에 연결 → 평소에 전진
    onNC:replace(m3ok,'K1_14','V1_Ya_p','K1_12','V1_Ya_p')
  },
  m4:{
    ok:m4ok,
    // 자기유지 선 ② 빠짐 → 떼면 바로 꺼짐
    noHold:without(m4ok,'K1_14','K1_A1'),
    // 자기유지를 +24V에서 바로 받음 (PB2를 거치지 않음) → 정지가 안 됨
    holdBypassesStop:replace(m4ok,'PB2_12','K1_11','R24_1_1','K1_11'),
    // PB2를 NO(13-14)로 연결 → 처음부터 전기가 안 감
    stopOnNO:replace(replace(m4ok,'R24_1_0','PB2_11','R24_1_0','PB2_13'),'PB2_12','PB1_13','PB2_14','PB1_13')
  },

  m0:{
    ok:m0ok,
    // − 쪽을 빨간 선으로
    wrongColor:{wires:[m0ok.wires[0],m0ok.wires[1],w('H1_n','R0_2_0','red')],hoses:[]},
    // +24V와 0V를 바로 연결
    short:{wires:[...m0ok.wires,w('PB1_13','R0_1_0','blue')],hoses:[]},
    // NO 대신 NC(11-12) 접점 사용 → 안 눌러도 켜짐
    nc:{wires:[w('R24_1_0','PB1_11','red'),w('PB1_12','H1_p','red'),w('H1_n','R0_2_0','blue')],hoses:[]},
    // 0V 선 빠짐
    noGround:{wires:[m0ok.wires[0],m0ok.wires[1]],hoses:[]}
  },
  m1:{
    ok:m1ok,
    // 실린더 호스를 반대로 (4→전방, 2→후방)
    swapped:{wires:m1ok.wires,hoses:[h('D1','V1_1'),h('V1_4','A_rod'),h('V1_2','A_cap')]},
    // 공급이 배기(4번→5번)로 바로 빠짐
    leak:{wires:m1ok.wires,hoses:[h('D1','V1_1'),h('D2','V1_4'),h('V1_2','A_rod')]},
    // 공급 호스 없음
    noSupply:{wires:m1ok.wires,hoses:[h('V1_4','A_cap'),h('V1_2','A_rod')]},
    // 솔레노이드 0V 선 빠짐
    noSolGround:{wires:[m1ok.wires[0],m1ok.wires[1]],hoses:m1ok.hoses}
  }
};
