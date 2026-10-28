/* ===================== 배치 데이터 =====================
   트레이너마다 랙 모듈 순서와 고정판의 "자리"를 정해 둔다. 코드 없이 데이터만 둔다.
   - rack  : 줄마다 왼쪽부터 놓을 랙 모듈 목록. type은 js/parts/의 부품 종류 (스위치·릴레이 모듈은 2칸 차지)
   - board : 고정판 위치 [x, y, 폭, 높이]
   - jumpers : 기본 전원 선 [[잭, 잭], …]. 처음부터 꽂혀 있고, 지울 수 있지만 배선 초기화하면 다시 생긴다
   - slots : 고정판 자리. slot(자리 이름), id(부품 이름: 잭 이름 앞부분), at(그리는 위치 [x,y]),
             accepts(놓을 수 있는 종류. 둘 이상이면 화면에서 교체 가능), fixed(항상 놓이는 부품)
             공압 기기 자리 MA1·MA2(실린더 A 후방·전방 줄), MB1·MB2(B), R1(공급 줄, 감압밸브)
             sensor(센서 자리: 부품 종류). 위치는 미션 board에서 "A+"(실린더 A 전진 끝)/"A-"(후진 끝)로 정한다
   미션 데이터의 "board"가 자리마다 무엇을 놓을지 고른다. board에 없는 자리는 비워 둔다. */
const LAYOUTS={
"air":{
  "rack":[
    [
      {"type":"power"},
      {"type":"switch","pbs":["PB1","PB2","PB3"],"es":"ES"},
      {"type":"lamp","lamps":["H1","H2"]},
      {"type":"timer"},
      {"type":"counter"}
    ],
    [
      {"type":"relay"},
      {"type":"relay"}
    ]
  ],
  "jumpers":[["R24_0_0","R24_1_0"],["R24_1_5","R24_2_0"],["R24_2_2","R24_3_0"],["R24_3_2","R24_4_0"],["R24_0_1","R24_5_0"],["R24_5_5","R24_6_0"],["R0_0_0","R0_1_0"],["R0_1_5","R0_2_0"],["R0_2_2","R0_3_0"],["R0_3_2","R0_4_0"],["R0_0_1","R0_5_0"],["R0_5_5","R0_6_0"]],
  "board":[16,650,1168,532],
  "slots":[
    {"slot":"service","id":"SU","at":[46,678],"fixed":"service"},
    {"slot":"cylA","id":"A","at":[300,740],"accepts":["cylinder"]},
    {"slot":"valveA","id":"V1","at":[290,950],"accepts":["valve52s","valve52d"]},
    {"slot":"cylB","id":"B","at":[750,740],"accepts":["cylinder"]},
    {"slot":"valveB","id":"V2","at":[740,950],"accepts":["valve52s","valve52d"]},
    {"slot":"MA1","id":"MA1","at":[328,860],"accepts":["fcv","qev"]},
    {"slot":"MA2","id":"MA2","at":[492,860],"accepts":["fcv","qev"]},
    {"slot":"MB1","id":"MB1","at":[778,860],"accepts":["fcv","qev"]},
    {"slot":"MB2","id":"MB2","at":[942,860],"accepts":["fcv","qev"]},
    {"slot":"R1","id":"R1","at":[46,1040],"accepts":["prv"]},
    {"slot":"S1","id":"S1","sensor":"capsensor"},
    {"slot":"S2","id":"S2","sensor":"capsensor"},
    {"slot":"LS1","id":"LS1","sensor":"limitsw"},
    {"slot":"LS2","id":"LS2","sensor":"limitsw"}
  ]
}
};
