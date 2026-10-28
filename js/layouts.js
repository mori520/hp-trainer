/* ===================== 배치 데이터 =====================
   트레이너마다 랙 모듈 순서와 고정판의 "자리"를 정해 둔다. 코드 없이 데이터만 둔다.
   - rack  : 줄마다 왼쪽부터 놓을 랙 모듈 목록. type은 js/parts/의 부품 종류 (스위치·릴레이 모듈은 2칸 차지)
   - board : 고정판 위치 [x, y, 폭, 높이]
   - jumpers : 기본 전원 선 [[잭, 잭], …]. 처음부터 꽂혀 있고, 지울 수 있지만 배선 초기화하면 다시 생긴다
   - slots : 고정판 자리. slot(자리 이름), id(부품 이름: 잭 이름 앞부분), at(그리는 위치 [x,y]),
             accepts(놓을 수 있는 종류. 둘 이상이면 화면에서 교체 가능), fixed(항상 놓이는 부품)
             공압 기기 자리 MA1·MA2(실린더 A 후방·전방 줄), MB1·MB2(B), R1(공급 줄, 감압밸브)
             sensor(센서 자리: 부품 종류). 위치는 미션 board에서 "A+"(실린더 A 전진 끝)/"A-"(후진 끝)로 정한다
             ids(종류마다 다른 부품 이름, 예: {"motor":"M"} → 그 자리에 모터를 놓으면 이름이 M),
             excludes(같은 곳을 쓰는 자리: 이 자리에 부품이 있으면 그 자리들은 비워야 함)
   "hyd"(유압 판)는 랙이 공압 판과 같고, 서비스 유닛 대신 유압 파워유닛, 5/2 대신 4/2·4/3 밸브, B 자리에 실린더 또는 유압모터.
   기기 자리 MA1…에는 유량조절(일방향·양방향)·체크·카운터밸런스·감압·압력스위치, LA·LB(실린더 두 포트 아래 한 칸)에는
   파일럿 체크 블록, R1(파워유닛 옆)에는 체크밸브(펌프 토출구) 또는 양방향 유량조절(P→T 블리드오프)을 끼운다.
   LA는 MA1·MA2와, LB는 MB1·MB2와 같은 곳이라 함께 쓰지 않는다
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
},
"hyd":{
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
    {"slot":"pump","id":"HPU","at":[46,678],"fixed":"hpu"},
    {"slot":"cylA","id":"A","at":[300,740],"accepts":["cylinder","cylw"]},
    {"slot":"valveA","id":"V1","at":[290,950],"accepts":["valve42","valve43c","valve43a"]},
    {"slot":"cylB","id":"B","ids":{"motor":"M"},"at":[750,740],"accepts":["cylinder","cylw","motor"]},
    {"slot":"valveB","id":"V2","at":[740,950],"accepts":["valve42","valve43c","valve43a"]},
    {"slot":"MA1","id":"MA1","at":[328,860],"accepts":["fcv","thr","chk","cbv","hprv","psw"]},
    {"slot":"MA2","id":"MA2","at":[492,860],"accepts":["fcv","thr","chk","cbv","hprv","psw"]},
    {"slot":"MB1","id":"MB1","at":[778,860],"accepts":["fcv","thr","chk","cbv","hprv","psw"]},
    {"slot":"MB2","id":"MB2","at":[942,860],"accepts":["fcv","thr","chk","cbv","hprv","psw"]},
    {"slot":"LA","id":"LA","at":[410,860],"accepts":["lock"],"excludes":["MA1","MA2"]},
    {"slot":"LB","id":"LB","at":[860,860],"accepts":["lock"],"excludes":["MB1","MB2"]},
    {"slot":"R1","id":"R1","at":[146,1090],"accepts":["chk","thr"]},
    {"slot":"S1","id":"S1","sensor":"capsensor"},
    {"slot":"S2","id":"S2","sensor":"capsensor"},
    {"slot":"LS1","id":"LS1","sensor":"limitsw"},
    {"slot":"LS2","id":"LS2","sensor":"limitsw"}
  ]
}
};
