/* ===================== 미션 데이터 =====================
   코드 없이 데이터만 둔다 (JSON과 같은 모양).

   튜토리얼 단계(steps) 항목:
   - t      : 안내 문구 (<b> 강조 가능)
   - wire   : [잭A, 잭B, 색]  두 잭을 그 색 선으로 이으면 완료. 색 "red" 외에는 "빨강이 아닌 색"으로 본다
   - hose   : [포트A, 포트B]  두 포트를 호스로 이으면 완료
   - 잭 이름 대신 "group:rail24"(+24V 잭 아무거나), "group:rail0"(0V 잭), "group:dist"(분배기 출구)를 쓸 수 있다
   - done   : 그 밖의 완료 조건
              {"type":"color","is":"red"} / {"type":"color","not":"red"}  툴바에서 고른 배선 색
              {"type":"setting","name":"T1","value":3}  타이머·카운터 설정값을 그 값으로 맞추면 완료
              {"type":"quiz"}  미션의 오류 찾기 문제(quiz)를 맞히면 완료
              {"type":"state","expect":{...}}  트레이너 상태가 모두 같아지면 완료. 쓰는 이름은 채점 expect와 같고
                누름버튼("PB1":true=눌림), "power"/"air"도 쓸 수 있다. 예: {"PB1":false,"K1":true,"A":"+"}
   - btn    : 깜박여 강조할 툴바 버튼 id
   - hl     : 강조할 부품 ("@rocker", "@air", "@PB1btn", "@K1coil"처럼 @ + 이름) 또는 잭 이름
   - keep   : true면 나중에 이 단계가 깨질 때 이 단계로 되돌아간다
   - g      : 묶음 제목. 같은 g가 이어진 단계끼리 묶여, 화면에는 지금 하는 묶음만 펼쳐진다 (긴 튜토리얼용)

   도면: "diagram"에 SVG 파일 경로 (diagrams/*.svg, tools/make-diagrams.js로 만든다). 있으면 "도면 보기" 버튼이 뜬다
   오류 찾기: "quiz":{"q":질문, "choices":[{"t":보기, "why":틀린 보기를 골랐을 때 안내}], "answer":정답 번호(0부터), "explain":정답 해설}
     미션 패널에 문제가 뜨고, 채점 결과 맨 위에 "오류 찾기" 항목이 붙는다 (맞혀야 미션 완료)

   배치: "layout"은 layouts.js의 이름, "board"는 자리마다 놓을 부품 종류 (없는 자리는 빈칸)
   처음 설정값: "set":{"SU":0.2} 처럼 쓰면 그 미션은 그 값으로 시작 (직접 맞추는 연습용). 없으면 부품 기본값
   채점: "grading" 형식은 grader.js 머리 주석 참고. 없으면 채점 버튼이 숨는다
   실전 연습: "practice":{"check":[스스로 확인할 것], "choices":{자리:[고를 수 있는 종류, ""=없음]}} — 판 구성을 직접 고르고 스톱워치로 잰다 */
const MISSIONS=[
{
  "id":"m0","no":"0","title":"PB1으로 램프 켜기",
  "goal":"PB1을 누르고 있는 동안만 램프 H1이 켜지도록 배선하세요.",
  "learn":"배우는 것: 전원 +24V / 0V, 잭 연결, NO 접점, 배선 색 규칙",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s"},
  "steps":[
    {"t":"툴바에서 배선 색을 <b>빨강</b>으로 고르세요. + 쪽 배선은 적색이 규칙입니다.","done":{"type":"color","is":"red"},"btn":"c-red"},
    {"t":"<b>+24V 잭</b>(모듈 위쪽 빨간 잭)에서 <b>PB1의 13번</b> 잭으로 끌어 연결하세요.","wire":["group:rail24","PB1_13","red"],"keep":true},
    {"t":"<b>PB1 14번</b> 잭에서 <b>램프 H1의 +</b> 잭으로 연결하세요.","wire":["PB1_14","H1_p","red"],"keep":true},
    {"t":"배선 색을 <b>파랑</b>으로 바꾸세요. − 쪽은 청색 또는 흑색입니다.","done":{"type":"color","not":"red"},"btn":"c-blue"},
    {"t":"<b>H1의 −</b> 잭에서 <b>0V 잭</b>(모듈 아래쪽 파란 잭)으로 연결하세요.","wire":["H1_n","group:rail0","blue"],"keep":true},
    {"t":"전원 모듈의 <b>POWER</b> 스위치를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"t":"<b>PB1</b>을 눌러 보세요. 누르는 동안 H1이 켜지면 성공입니다.","done":{"type":"state","expect":{"H1":true}},"hl":["@PB1btn"]}
  ],
  "grading":{
    "setup":{"power":true},"repeat":2,
    "steps":[
      {"name":"PB1을 누르지 않으면 H1 꺼짐","set":{"PB1":false},"wait":0.2,"expect":{"H1":false}},
      {"name":"PB1을 누르면 H1 점등","set":{"PB1":true},"wait":0.2,"expect":{"H1":true},
       "hint":"PB1 NO 접점(13-14)을 거쳐 H1의 +와 −가 각각 +24V, 0V에 이어지는지 확인하세요."},
      {"name":"PB1을 떼면 H1 소등","set":{"PB1":false},"wait":0.2,"expect":{"H1":false}}
    ]
  }
},
{
  "id":"m1","no":"1","title":"PB1으로 실린더 전진",
  "goal":"PB1을 누르고 있으면 실린더 A가 전진하고, 떼면 후진하도록 호스와 배선을 구성하세요.",
  "learn":"배우는 것: 솔레노이드, 5/2 편솔 밸브, 호스 연결, 공기 공급",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s"},
  "steps":[
    {"t":"<b>분배기</b> 출구에서 <b>밸브 1번</b>(공급, P) 포트로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"t":"<b>밸브 4번</b>(A) 포트에서 <b>실린더 후방</b> 포트로 연결하세요. 솔레노이드가 켜지면 이쪽으로 공기가 갑니다.","hose":["V1_4","A_cap"],"keep":true},
    {"t":"<b>밸브 2번</b>(B) 포트에서 <b>실린더 전방</b> 포트로 연결하세요.","hose":["V1_2","A_rod"],"keep":true},
    {"t":"서비스 유닛의 <b>공기 공급</b>을 켜세요. 실린더가 후진 위치를 유지하면 정상입니다.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"t":"배선 색을 <b>빨강</b>으로 고르세요.","done":{"type":"color","is":"red"},"btn":"c-red"},
    {"t":"<b>+24V 잭</b>에서 <b>PB1 13번</b>으로 연결하세요.","wire":["group:rail24","PB1_13","red"],"keep":true},
    {"t":"<b>PB1 14번</b>에서 밸브의 <b>Y1 +</b> 잭으로 연결하세요.","wire":["PB1_14","V1_Ya_p","red"],"keep":true},
    {"t":"배선 색을 <b>파랑</b>으로 바꾸세요.","done":{"type":"color","not":"red"},"btn":"c-blue"},
    {"t":"<b>Y1 −</b> 잭에서 <b>0V 잭</b>으로 연결하세요.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"t":"<b>POWER</b> 스위치를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"t":"<b>PB1</b>을 누르고 있어 보세요. 실린더가 끝까지 전진합니다.","done":{"type":"state","expect":{"PB1":true,"A":"+"}},"hl":["@PB1btn"]},
    {"t":"이제 <b>PB1</b>에서 손을 떼 보세요. 실린더가 후진하면 성공입니다.","done":{"type":"state","expect":{"PB1":false,"A":"-"}},"hl":["@PB1btn"]}
  ],
  "grading":{
    "setup":{"power":true,"air":true},"repeat":2,
    "steps":[
      {"name":"초기 상태에서 실린더 후진 유지","set":{"PB1":false},"wait":1.5,"expect":{"A":"-"},
       "hint":"평상시 밸브는 1→2 로 공급합니다. 2번이 전방 포트에 이어졌는지 확인하세요."},
      {"name":"PB1을 누르면 실린더 전진","set":{"PB1":true},"wait":2,"expect":{"A":"+"},
       "hint":"Y1이 켜지면 1→4 로 바뀝니다. 4번이 후방 포트에, Y1이 PB1을 거쳐 전원에 이어졌는지 확인하세요."},
      {"name":"PB1을 떼면 실린더 후진","set":{"PB1":false},"wait":2,"expect":{"A":"-"}}
    ]
  }
},
{
  "id":"m2","no":"2","title":"NO와 NC 접점 비교",
  "goal":"PB1을 누르지 않을 때는 H2만, 누르고 있는 동안은 H1만 켜지도록 배선하세요.",
  "learn":"배우는 것: NO 접점(평소 열림, 13-14)과 NC 접점(평소 닫힘, 11-12)의 차이",
  "layout":"air","board":{},
  "steps":[
    {"t":"배선 색을 <b>빨강</b>으로 고르세요.","done":{"type":"color","is":"red"},"btn":"c-red"},
    {"t":"<b>+24V 잭</b>에서 <b>PB1 13번</b>(NO)으로 연결하세요.","wire":["group:rail24","PB1_13","red"],"keep":true},
    {"t":"<b>PB1 14번</b>에서 <b>H1 +</b>로 연결하세요. NO 접점은 누를 때만 닫힙니다.","wire":["PB1_14","H1_p","red"],"keep":true},
    {"t":"같은 버튼의 NC 접점도 씁니다. <b>+24V 잭</b>에서 <b>PB1 11번</b>(NC)으로 연결하세요.","wire":["group:rail24","PB1_11","red"],"keep":true},
    {"t":"<b>PB1 12번</b>에서 <b>H2 +</b>로 연결하세요. NC 접점은 누르지 않을 때 닫혀 있습니다.","wire":["PB1_12","H2_p","red"],"keep":true},
    {"t":"배선 색을 <b>파랑</b>으로 바꾸세요.","done":{"type":"color","not":"red"},"btn":"c-blue"},
    {"t":"<b>H1 −</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["H1_n","group:rail0","blue"],"keep":true},
    {"t":"<b>H2 −</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["H2_n","group:rail0","blue"],"keep":true},
    {"t":"<b>POWER</b>를 켜세요. 버튼을 누르지 않았는데 H2가 켜지면 NC가 제대로 연결된 거예요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"t":"<b>PB1</b>을 누르고 있어 보세요. H1이 켜지고 H2가 꺼지면 성공입니다. 스위치 모듈의 NO·NC 그림도 함께 바뀌어요.","done":{"type":"state","expect":{"PB1":true,"H1":true,"H2":false}},"hl":["@PB1btn"]}
  ],
  "grading":{
    "setup":{"power":true},"repeat":2,
    "steps":[
      {"name":"PB1을 누르지 않으면 H1 꺼짐, H2 켜짐","set":{"PB1":false},"wait":0.2,"expect":{"H1":false,"H2":true},
       "hint":"H2는 PB1의 NC 접점(11-12)을 거쳐야 합니다. NC는 누르지 않을 때 닫혀 있습니다."},
      {"name":"PB1을 누르면 H1 켜짐, H2 꺼짐","set":{"PB1":true},"wait":0.2,"expect":{"H1":true,"H2":false},
       "hint":"H1은 PB1의 NO 접점(13-14)을 거쳐야 합니다."},
      {"name":"PB1을 떼면 원래대로 (H1 꺼짐, H2 켜짐)","set":{"PB1":false},"wait":0.2,"expect":{"H1":false,"H2":true}}
    ]
  }
},
{
  "id":"m3","no":"3","title":"릴레이로 실린더 전진",
  "goal":"PB1을 누르면 릴레이 K1이 켜지고, K1의 접점이 Y1을 켜서 실린더 A가 전진하도록 구성하세요. 떼면 후진합니다.",
  "learn":"배우는 것: 릴레이 코일(A1-A2)과 접점(11-14)이 따로 있다는 것. 버튼은 코일만, 솔레노이드는 접점이 켭니다",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s"},
  "steps":[
    {"t":"먼저 호스: <b>분배기</b>에서 <b>밸브 1번</b>으로 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"t":"<b>밸브 4번</b>에서 <b>실린더 후방</b>으로 연결하세요.","hose":["V1_4","A_cap"],"keep":true},
    {"t":"<b>밸브 2번</b>에서 <b>실린더 전방</b>으로 연결하세요.","hose":["V1_2","A_rod"],"keep":true},
    {"t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"t":"배선 색을 <b>빨강</b>으로 고르세요.","done":{"type":"color","is":"red"},"btn":"c-red"},
    {"t":"<b>+24V 잭</b>에서 <b>PB1 13번</b>으로 연결하세요.","wire":["group:rail24","PB1_13","red"],"keep":true},
    {"t":"<b>PB1 14번</b>에서 릴레이 모듈의 <b>K1 A1</b>(코일 +)으로 연결하세요. 버튼은 이제 코일만 켭니다.","wire":["PB1_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"t":"솔레노이드는 K1의 접점이 켭니다. <b>+24V 잭</b>에서 <b>K1 11번</b>(첫 번째 접점의 공통)으로 연결하세요.","wire":["group:rail24","K1_11","red"],"keep":true},
    {"t":"<b>K1 14번</b>(NO)에서 밸브의 <b>Y1 +</b>로 연결하세요.","wire":["K1_14","V1_Ya_p","red"],"keep":true},
    {"t":"배선 색을 <b>파랑</b>으로 바꾸세요.","done":{"type":"color","not":"red"},"btn":"c-blue"},
    {"t":"<b>K1 A2</b>(코일 −)에서 <b>0V 잭</b>으로 연결하세요.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"t":"<b>Y1 −</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"t":"<b>PB1</b>을 누르고 있어 보세요. K1 표시등이 켜지고 접점 그림이 NO 쪽으로 넘어가면서 실린더가 전진합니다.","done":{"type":"state","expect":{"PB1":true,"K1":true,"A":"+"}},"hl":["@PB1btn"]},
    {"t":"<b>PB1</b>에서 손을 떼 보세요. K1이 꺼지고 실린더가 후진하면 성공입니다.","done":{"type":"state","expect":{"PB1":false,"K1":false,"A":"-"}},"hl":["@PB1btn"]}
  ],
  "grading":{
    "setup":{"power":true,"air":true},"repeat":2,"relayCount":1,
    "steps":[
      {"name":"초기 상태에서 K1 꺼짐, 실린더 후진","set":{"PB1":false},"wait":1.5,"expect":{"K1":false,"A":"-"}},
      {"name":"PB1을 누르면 K1이 켜지고 실린더 전진","set":{"PB1":true},"wait":2,"expect":{"K1":true,"A":"+"},
       "hint":"PB1 → K1 코일(A1-A2), 그리고 +24V → K1 NO 접점(11-14) → Y1 순서로 이어졌는지 확인하세요. PB1이 Y1을 바로 켜면 안 됩니다."},
      {"name":"PB1을 떼면 K1이 꺼지고 실린더 후진","set":{"PB1":false},"wait":2,"expect":{"K1":false,"A":"-"}}
    ]
  }
},
{
  "id":"m4","no":"4","title":"자기유지회로",
  "goal":"PB1을 잠깐 눌렀다 떼도 실린더 A가 전진한 채로 있고, PB2를 누르면 후진하도록 구성하세요.",
  "learn":"배우는 것: 자기유지(릴레이가 자기 접점으로 전기를 계속 받음), 정지 버튼을 NC로 앞에 다는 이유",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s"},
  "steps":[
    {"t":"먼저 호스: <b>분배기</b>에서 <b>밸브 1번</b>으로 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"t":"<b>밸브 4번</b>에서 <b>실린더 후방</b>으로 연결하세요.","hose":["V1_4","A_cap"],"keep":true},
    {"t":"<b>밸브 2번</b>에서 <b>실린더 전방</b>으로 연결하세요.","hose":["V1_2","A_rod"],"keep":true},
    {"t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"t":"배선 색을 <b>빨강</b>으로 고르세요.","done":{"type":"color","is":"red"},"btn":"c-red"},
    {"t":"정지 버튼부터 답니다. <b>+24V 잭</b>에서 <b>PB2 11번</b>(NC)으로 연결하세요.","wire":["group:rail24","PB2_11","red"],"keep":true},
    {"t":"<b>PB2 12번</b>에서 <b>PB1 13번</b>으로 연결하세요. 이제 PB1은 PB2를 거쳐서 전기를 받습니다.","wire":["PB2_12","PB1_13","red"],"keep":true},
    {"t":"<b>PB1 14번</b>에서 <b>K1 A1</b>(코일 +)으로 연결하세요.","wire":["PB1_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"t":"자기유지 선 ①: <b>PB2 12번</b>에서 <b>K1 11번</b>으로 연결하세요.","wire":["PB2_12","K1_11","red"],"keep":true},
    {"t":"자기유지 선 ②: <b>K1 14번</b>에서 <b>K1 A1</b>으로 연결하세요. K1이 켜지면 이 접점이 PB1 대신 코일에 전기를 이어 줍니다.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"t":"솔레노이드는 K1의 두 번째 접점으로 켭니다. <b>+24V 잭</b>에서 <b>K1 21번</b>으로 연결하세요.","wire":["group:rail24","K1_21","red"],"keep":true},
    {"t":"<b>K1 24번</b>(NO)에서 <b>Y1 +</b>로 연결하세요.","wire":["K1_24","V1_Ya_p","red"],"keep":true},
    {"t":"배선 색을 <b>파랑</b>으로 바꾸세요.","done":{"type":"color","not":"red"},"btn":"c-blue"},
    {"t":"<b>K1 A2</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"t":"<b>Y1 −</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"t":"<b>PB1</b>을 잠깐 눌렀다 떼 보세요. 손을 뗀 뒤에도 K1이 켜진 채로 실린더가 전진해 있으면 자기유지 성공!","done":{"type":"state","expect":{"PB1":false,"K1":true,"A":"+"}},"hl":["@PB1btn"]},
    {"t":"<b>PB2</b>를 눌러 보세요. 자기유지가 풀리면서 실린더가 후진합니다.","done":{"type":"state","expect":{"K1":false,"A":"-"}},"hl":["@PB2btn"]}
  ],
  "grading":{
    "setup":{"power":true,"air":true},"repeat":2,"relayCount":1,
    "steps":[
      {"name":"초기 상태에서 K1 꺼짐, 실린더 후진","wait":1.5,"expect":{"K1":false,"A":"-"}},
      {"name":"PB1을 눌렀다 떼도 전진 유지 (자기유지)","tap":"PB1","wait":2,"expect":{"K1":true,"A":"+"},
       "hint":"K1의 NO 접점(11-14)이 PB1과 나란히(병렬로) 연결되어, PB1을 떼도 코일에 전기가 계속 가야 합니다."},
      {"name":"PB2를 누르면 자기유지 해제, 실린더 후진","tap":"PB2","wait":2,"expect":{"K1":false,"A":"-"},
       "hint":"PB2는 NC 접점(11-12)으로, PB1과 자기유지 접점 둘 다의 앞에 직렬로 들어가야 합니다."}
    ]
  }
},
{
  "id":"m5","no":"5","title":"리밋스위치로 자동 후진",
  "goal":"PB1을 한 번 누르면 실린더 A가 전진하고, 끝에 닿으면 리밋스위치 LS2가 자기유지를 끊어 자동으로 후진하게 하세요 (A+ A−).",
  "learn":"배우는 것: 센서 피드백(실린더가 끝에 닿았다는 신호로 다음 동작), 리밋스위치 c접점(1 공통, 2 NC, 4 NO)",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","LS2":"A+"},"diagram":"diagrams/m5.svg",
  "steps":[
    {"t":"먼저 호스: <b>분배기</b>에서 <b>밸브 1번</b>으로 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"t":"<b>밸브 4번</b>에서 <b>실린더 후방</b>으로 연결하세요.","hose":["V1_4","A_cap"],"keep":true},
    {"t":"<b>밸브 2번</b>에서 <b>실린더 전방</b>으로 연결하세요.","hose":["V1_2","A_rod"],"keep":true},
    {"t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"t":"배선 색을 <b>빨강</b>으로 고르세요.","done":{"type":"color","is":"red"},"btn":"c-red"},
    {"t":"실린더 전진 끝에 달린 <b>리밋스위치 LS2</b>를 씁니다. <b>+24V 잭</b>에서 <b>LS2 1번</b>(공통)으로 연결하세요.","wire":["group:rail24","LS2_1","red"],"keep":true,"hl":["@LS2"]},
    {"t":"<b>LS2 2번</b>(NC)에서 <b>PB1 13번</b>으로 연결하세요. 실린더가 끝에 닿아 LS2가 눌리면 이 길이 끊깁니다.","wire":["LS2_2","PB1_13","red"],"keep":true},
    {"t":"<b>PB1 14번</b>에서 <b>K1 A1</b>으로 연결하세요.","wire":["PB1_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"t":"자기유지 선 ①: <b>LS2 2번</b>에서 <b>K1 11번</b>으로 연결하세요. 자기유지도 LS2를 거치게 하는 게 핵심이에요.","wire":["LS2_2","K1_11","red"],"keep":true},
    {"t":"자기유지 선 ②: <b>K1 14번</b>에서 <b>K1 A1</b>으로 연결하세요.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"t":"<b>+24V 잭</b>에서 <b>K1 21번</b>으로 연결하세요.","wire":["group:rail24","K1_21","red"],"keep":true},
    {"t":"<b>K1 24번</b>에서 <b>Y1 +</b>로 연결하세요.","wire":["K1_24","V1_Ya_p","red"],"keep":true},
    {"t":"배선 색을 <b>파랑</b>으로 바꾸세요.","done":{"type":"color","not":"red"},"btn":"c-blue"},
    {"t":"<b>K1 A2</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"t":"<b>Y1 −</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"t":"<b>PB1</b>을 잠깐 눌렀다 떼 보세요. 실린더가 끝까지 전진하면서 LS2 롤러를 누릅니다.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB1btn"]},
    {"t":"LS2가 눌리는 순간 자기유지가 끊겨 실린더가 저절로 후진합니다. 끝까지 돌아오면 성공! 한 번 더 눌러 똑같이 동작하는지도 보세요.","done":{"type":"state","expect":{"A":"-","K1":false}}}
  ],
  "grading":{"press":"PB1","sequence":["A+","A-"],"repeat":2,"relayCount":1}
},
{
  "id":"m6","no":"6","title":"3선식 센서로 자동 후진",
  "goal":"미션 5와 같은 동작(A+ A−)을 리밋스위치 대신 정전용량 센서 S2로 만드세요. 센서 신호는 릴레이 K2로 받습니다.",
  "learn":"배우는 것: 3선식 센서 배선(갈색 +24V, 청색 0V, 흑색 출력), 센서 출력으로 릴레이를 켜고 그 NC 접점으로 끊기",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","S2":"A+"},"diagram":"diagrams/m6.svg",
  "steps":[
    {"t":"먼저 호스: <b>분배기</b>에서 <b>밸브 1번</b>으로 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"t":"<b>밸브 4번</b>에서 <b>실린더 후방</b>으로 연결하세요.","hose":["V1_4","A_cap"],"keep":true},
    {"t":"<b>밸브 2번</b>에서 <b>실린더 전방</b>으로 연결하세요.","hose":["V1_2","A_rod"],"keep":true},
    {"t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"t":"배선 색을 <b>빨강</b>으로 고르세요.","done":{"type":"color","is":"red"},"btn":"c-red"},
    {"t":"센서에도 전원이 필요합니다. <b>+24V 잭</b>에서 센서 <b>S2의 +</b>(갈색) 잭으로 연결하세요.","wire":["group:rail24","S2_p","red"],"keep":true,"hl":["@S2"]},
    {"t":"<b>S2 출력</b>(흑색)에서 <b>K2 A1</b>으로 연결하세요. 실린더가 끝에 오면 센서가 +24V를 내보내 K2를 켭니다.","wire":["S2_out","K2_A1","red"],"keep":true,"hl":["@K2coil"]},
    {"t":"<b>+24V 잭</b>에서 <b>K2 11번</b>으로 연결하세요.","wire":["group:rail24","K2_11","red"],"keep":true},
    {"t":"<b>K2 12번</b>(NC)에서 <b>PB1 13번</b>으로 연결하세요. 센서가 감지하면 K2가 이 길을 끊습니다.","wire":["K2_12","PB1_13","red"],"keep":true},
    {"t":"<b>PB1 14번</b>에서 <b>K1 A1</b>으로 연결하세요.","wire":["PB1_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"t":"자기유지 선 ①: <b>K2 12번</b>에서 <b>K1 11번</b>으로 연결하세요.","wire":["K2_12","K1_11","red"],"keep":true},
    {"t":"자기유지 선 ②: <b>K1 14번</b>에서 <b>K1 A1</b>으로 연결하세요.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"t":"<b>+24V 잭</b>에서 <b>K1 21번</b>으로 연결하세요.","wire":["group:rail24","K1_21","red"],"keep":true},
    {"t":"<b>K1 24번</b>에서 <b>Y1 +</b>로 연결하세요.","wire":["K1_24","V1_Ya_p","red"],"keep":true},
    {"t":"배선 색을 <b>파랑</b>으로 바꾸세요.","done":{"type":"color","not":"red"},"btn":"c-blue"},
    {"t":"센서 <b>S2의 −</b>(청색)에서 <b>0V 잭</b>으로 연결하세요. 이 선이 없으면 센서가 동작하지 않아요.","wire":["S2_n","group:rail0","blue"],"keep":true},
    {"t":"<b>K2 A2</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["K2_A2","group:rail0","blue"],"keep":true},
    {"t":"<b>K1 A2</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"t":"<b>Y1 −</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"t":"<b>PB1</b>을 잠깐 눌렀다 떼 보세요. 실린더가 전진해 끝에 닿으면 S2 표시등이 켜집니다.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB1btn"]},
    {"t":"S2 → K2가 켜지면서 자기유지가 끊겨 실린더가 후진합니다. 끝까지 돌아오면 성공!","done":{"type":"state","expect":{"A":"-","K1":false}}}
  ],
  "grading":{"press":"PB1","sequence":["A+","A-"],"repeat":2,"relayCount":2}
},
{
  "id":"m7","no":"7","title":"양솔 밸브로 자동 후진",
  "goal":"양솔 밸브를 써서, PB1을 한 번 누르면 실린더 A가 전진했다가 LS2에 닿으면 후진하게 하세요 (A+ A−). 릴레이 없이 만들 수 있어요.",
  "learn":"배우는 것: 양솔 밸브는 마지막 위치를 기억한다 → 자기유지가 필요 없음. Y1·Y2가 동시에 켜지면 움직이지 않는다는 점",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52d","LS2":"A+"},"diagram":"diagrams/m7.svg",
  "steps":[
    {"g":"1. 공기 회로","t":"<b>분배기</b>에서 <b>밸브 1번</b>으로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 4번</b>에서 <b>실린더 후방</b>으로 연결하세요.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 2번</b>에서 <b>실린더 전방</b>으로 연결하세요.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. 전진: PB1 → Y1","t":"<b>+24V 잭</b>에서 <b>PB1 13번</b>으로 연결하세요.","wire":["group:rail24","PB1_13","red"],"keep":true},
    {"g":"2. 전진: PB1 → Y1","t":"<b>PB1 14번</b>에서 밸브 왼쪽 <b>Y1 +</b>로 연결하세요.","wire":["PB1_14","V1_Ya_p","red"],"keep":true},
    {"g":"2. 전진: PB1 → Y1","t":"<b>Y1 −</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"3. 후진: LS2 → Y2","t":"<b>+24V 잭</b>에서 <b>LS2 1번</b>(공통)으로 연결하세요.","wire":["group:rail24","LS2_1","red"],"keep":true,"hl":["@LS2"]},
    {"g":"3. 후진: LS2 → Y2","t":"<b>LS2 4번</b>(NO)에서 밸브 오른쪽 <b>Y2 +</b>로 연결하세요. 실린더가 끝에 닿으면 Y2가 켜집니다.","wire":["LS2_4","V1_Yb_p","red"],"keep":true},
    {"g":"3. 후진: LS2 → Y2","t":"<b>Y2 −</b>에서 <b>0V 잭</b>으로 연결하세요.","wire":["V1_Yb_n","group:rail0","blue"],"keep":true},
    {"g":"4. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"4. 동작 확인","t":"<b>PB1</b>을 잠깐 눌렀다 떼 보세요. 손을 떼도 밸브가 위치를 기억해서 끝까지 전진합니다.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB1btn"]},
    {"g":"4. 동작 확인","t":"끝에서 LS2가 Y2를 켜면 밸브가 반대로 바뀌어 후진합니다.","done":{"type":"state","expect":{"A":"-"}}},
    {"g":"4. 동작 확인","t":"이번엔 <b>PB1</b>을 <b>계속 누르고</b> 있어 보세요. 끝에 닿아도 돌아오지 않아요. Y1과 Y2가 동시에 켜지면 밸브가 그대로 있기 때문이에요.","done":{"type":"state","expect":{"PB1":true,"A":"+","Y2":true}},"hl":["@PB1btn"]},
    {"g":"4. 동작 확인","t":"<b>PB1</b>에서 손을 떼면 그제야 후진합니다. 시험에서는 버튼을 잠깐만 누르세요.","done":{"type":"state","expect":{"PB1":false,"A":"-"}},"hl":["@PB1btn"]}
  ],
  "grading":{"press":"PB1","sequence":["A+","A-"],"repeat":2}
},
{
  "id":"m8","no":"8","title":"2실린더 시퀀스 A+ B+ B− A−",
  "goal":"PB1을 한 번 누르면 A 전진 → B 전진 → B 후진 → A 후진 순서로 움직이게 하세요. 릴레이 4개를 씁니다. 도면 보기를 참고하세요.",
  "learn":"배우는 것: 앞 동작이 끝났다는 센서 신호로 다음 동작을 시작하는 릴레이 시퀀스 (실전 과제와 같은 구조)",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","cylB":"cylinder","valveB":"valve52s","S1":"A+","LS1":"B+","LS2":"B-"},"diagram":"diagrams/m8.svg",
  "steps":[
    {"g":"1. 공기 회로","t":"<b>분배기 D1</b>에서 <b>밸브 V1의 1번</b>으로 호스를 연결하세요.","hose":["D1","V1_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>V1 4번</b> → <b>실린더 A 후방</b>.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>V1 2번</b> → <b>실린더 A 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>분배기 D2</b> → <b>밸브 V2의 1번</b>.","hose":["D2","V2_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>V2 4번</b> → <b>실린더 B 후방</b>.","hose":["V2_4","B_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>V2 2번</b> → <b>실린더 B 전방</b>.","hose":["V2_2","B_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>공기 공급</b>을 켜세요. 두 실린더 모두 후진해 있으면 정상입니다.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지","t":"사이클 끝에 K4가 끊을 수 있게 K4의 NC부터 답니다. <b>+24V</b> → <b>K4 11번</b>.","wire":["group:rail24","K4_11","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지","t":"<b>K4 12번</b>(NC) → <b>PB1 13번</b>.","wire":["K4_12","PB1_13","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지","t":"<b>PB1 14번</b> → <b>K1 A1</b>.","wire":["PB1_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"g":"2. K1 — 기동과 자기유지","t":"자기유지 ①: <b>K4 12번</b> → <b>K1 11번</b>.","wire":["K4_12","K1_11","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지","t":"자기유지 ②: <b>K1 14번</b> → <b>K1 A1</b>.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지","t":"<b>K1 A2</b> → <b>0V</b>.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>+24V</b> → <b>K1 21번</b>.","wire":["group:rail24","K1_21","red"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>K1 24번</b> → <b>Y1 +</b> (밸브 V1).","wire":["K1_24","V1_Ya_p","red"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"4. S1 → K2 — A 전진 끝 감지","t":"센서 전원: <b>+24V</b> → <b>S1 갈색(+)</b>.","wire":["group:rail24","S1_p","red"],"keep":true,"hl":["@S1"]},
    {"g":"4. S1 → K2 — A 전진 끝 감지","t":"<b>S1 청색(−)</b> → <b>0V</b>.","wire":["S1_n","group:rail0","blue"],"keep":true},
    {"g":"4. S1 → K2 — A 전진 끝 감지","t":"<b>S1 흑색(출력)</b> → <b>K2 A1</b>. A가 끝까지 나가면 K2가 켜집니다.","wire":["S1_out","K2_A1","red"],"keep":true,"hl":["@K2coil"]},
    {"g":"4. S1 → K2 — A 전진 끝 감지","t":"<b>K2 A2</b> → <b>0V</b>.","wire":["K2_A2","group:rail0","blue"],"keep":true},
    {"g":"5. Y2 — B 전진 (K1·K2 켜짐, K3 꺼짐일 때)","t":"<b>+24V</b> → <b>K1 31번</b>. 사이클이 끝나 K1이 꺼질 때 B가 움찔하지 않게 막아 줘요.","wire":["group:rail24","K1_31","red"],"keep":true},
    {"g":"5. Y2 — B 전진 (K1·K2 켜짐, K3 꺼짐일 때)","t":"<b>K1 34번</b> → <b>K2 11번</b>.","wire":["K1_34","K2_11","red"],"keep":true},
    {"g":"5. Y2 — B 전진 (K1·K2 켜짐, K3 꺼짐일 때)","t":"<b>K2 14번</b> → <b>K3 11번</b>.","wire":["K2_14","K3_11","red"],"keep":true},
    {"g":"5. Y2 — B 전진 (K1·K2 켜짐, K3 꺼짐일 때)","t":"<b>K3 12번</b>(NC) → <b>Y2 +</b> (밸브 V2). K3가 켜지면 Y2가 꺼져 B가 후진합니다.","wire":["K3_12","V2_Ya_p","red"],"keep":true},
    {"g":"5. Y2 — B 전진 (K1·K2 켜짐, K3 꺼짐일 때)","t":"<b>Y2 −</b> → <b>0V</b>.","wire":["V2_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"<b>+24V</b> → <b>K1 41번</b>.","wire":["group:rail24","K1_41","red"],"keep":true},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"<b>K1 44번</b> → <b>LS1 1번</b>(공통).","wire":["K1_44","LS1_1","red"],"keep":true,"hl":["@LS1"]},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"<b>LS1 4번</b>(NO) → <b>K3 A1</b>.","wire":["LS1_4","K3_A1","red"],"keep":true,"hl":["@K3coil"]},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"자기유지 ①: <b>K1 44번</b> → <b>K3 21번</b>. B가 돌아와 LS1이 풀려도 K3가 켜진 채로 있게 합니다.","wire":["K1_44","K3_21","red"],"keep":true},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"자기유지 ②: <b>K3 24번</b> → <b>K3 A1</b>.","wire":["K3_24","K3_A1","red"],"keep":true},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"<b>K3 A2</b> → <b>0V</b>.","wire":["K3_A2","group:rail0","blue"],"keep":true},
    {"g":"7. K4 — 사이클 끝 (LS2)","t":"<b>+24V</b> → <b>K3 31번</b>.","wire":["group:rail24","K3_31","red"],"keep":true},
    {"g":"7. K4 — 사이클 끝 (LS2)","t":"<b>K3 34번</b> → <b>LS2 1번</b>. LS2는 B 후진 끝에 있어요.","wire":["K3_34","LS2_1","red"],"keep":true,"hl":["@LS2"]},
    {"g":"7. K4 — 사이클 끝 (LS2)","t":"<b>LS2 4번</b>(NO) → <b>K4 A1</b>. B가 돌아오면 K4가 켜져 K1을 끊고, A가 후진합니다.","wire":["LS2_4","K4_A1","red"],"keep":true,"hl":["@K4coil"]},
    {"g":"7. K4 — 사이클 끝 (LS2)","t":"<b>K4 A2</b> → <b>0V</b>.","wire":["K4_A2","group:rail0","blue"],"keep":true},
    {"g":"8. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"8. 동작 확인","t":"<b>PB1</b>을 잠깐 눌렀다 떼세요. K1이 켜지고 <b>A가 전진</b>합니다.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB1btn"]},
    {"g":"8. 동작 확인","t":"A가 끝에 닿으면 S1 → K2 → Y2로 <b>B가 전진</b>합니다.","done":{"type":"state","expect":{"B":"+"}}},
    {"g":"8. 동작 확인","t":"B가 끝에서 LS1을 누르면 K3가 Y2를 끊어 <b>B가 후진</b>합니다.","done":{"type":"state","expect":{"B":"-"}}},
    {"g":"8. 동작 확인","t":"B가 돌아와 LS2를 누르면 K4가 K1을 끊어 <b>A가 후진</b>합니다. 한 번 더 눌러 똑같이 동작하면 성공!","done":{"type":"state","expect":{"A":"-"}}}
  ],
  "grading":{"press":"PB1","sequence":["A+","B+","B-","A-"],"repeat":2,"relayCount":4}
},
{
  "id":"m9","no":"9","title":"연속동작 · 연속정지",
  "goal":"PB2를 한 번 누르면 실린더 A가 A+ A−를 계속 되풀이하고, PB3를 누르면 지금 사이클을 마친 뒤 후진 끝에서 멈추게 하세요.",
  "learn":"배우는 것: 연속 기억 릴레이(K1)와 사이클 릴레이(K2)를 나누는 법, 후진 끝 신호(LS1)로 다음 사이클을 다시 시작하는 법",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","LS1":"A-","LS2":"A+"},"diagram":"diagrams/m9.svg",
  "steps":[
    {"g":"1. 공기 회로","t":"<b>분배기</b>에서 <b>밸브 1번</b>으로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 4번</b> → <b>실린더 후방</b>.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 2번</b> → <b>실린더 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. K1 — 연속 기억 (PB2 시작, PB3 정지)","t":"정지 버튼부터: <b>+24V</b> → <b>PB3 11번</b>(NC).","wire":["group:rail24","PB3_11","red"],"keep":true,"hl":["@PB3btn"]},
    {"g":"2. K1 — 연속 기억 (PB2 시작, PB3 정지)","t":"<b>PB3 12번</b> → <b>PB2 13번</b>.","wire":["PB3_12","PB2_13","red"],"keep":true},
    {"g":"2. K1 — 연속 기억 (PB2 시작, PB3 정지)","t":"<b>PB2 14번</b> → <b>K1 A1</b>.","wire":["PB2_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"g":"2. K1 — 연속 기억 (PB2 시작, PB3 정지)","t":"자기유지 ①: <b>PB3 12번</b> → <b>K1 11번</b>.","wire":["PB3_12","K1_11","red"],"keep":true},
    {"g":"2. K1 — 연속 기억 (PB2 시작, PB3 정지)","t":"자기유지 ②: <b>K1 14번</b> → <b>K1 A1</b>. K1이 켜져 있는 동안이 \"연속동작 중\"이에요.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"g":"2. K1 — 연속 기억 (PB2 시작, PB3 정지)","t":"<b>K1 A2</b> → <b>0V</b>.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"g":"3. K2 — 한 사이클 (LS1에서 시작, LS2에서 끝)","t":"<b>+24V</b> → <b>LS2 1번</b>. LS2는 A 전진 끝에 있어요.","wire":["group:rail24","LS2_1","red"],"keep":true,"hl":["@LS2"]},
    {"g":"3. K2 — 한 사이클 (LS1에서 시작, LS2에서 끝)","t":"<b>LS2 2번</b>(NC) → <b>K1 21번</b>.","wire":["LS2_2","K1_21","red"],"keep":true},
    {"g":"3. K2 — 한 사이클 (LS1에서 시작, LS2에서 끝)","t":"<b>K1 24번</b> → <b>LS1 1번</b>. LS1은 A 후진 끝에 있어서, 연속동작 중에 A가 돌아오면 다음 사이클을 시작해요.","wire":["K1_24","LS1_1","red"],"keep":true,"hl":["@LS1"]},
    {"g":"3. K2 — 한 사이클 (LS1에서 시작, LS2에서 끝)","t":"<b>LS1 4번</b>(NO) → <b>K2 A1</b>.","wire":["LS1_4","K2_A1","red"],"keep":true,"hl":["@K2coil"]},
    {"g":"3. K2 — 한 사이클 (LS1에서 시작, LS2에서 끝)","t":"자기유지 ①: <b>LS2 2번</b> → <b>K2 11번</b>. A가 출발해 LS1이 풀려도 K2가 유지돼요.","wire":["LS2_2","K2_11","red"],"keep":true},
    {"g":"3. K2 — 한 사이클 (LS1에서 시작, LS2에서 끝)","t":"자기유지 ②: <b>K2 14번</b> → <b>K2 A1</b>.","wire":["K2_14","K2_A1","red"],"keep":true},
    {"g":"3. K2 — 한 사이클 (LS1에서 시작, LS2에서 끝)","t":"<b>K2 A2</b> → <b>0V</b>.","wire":["K2_A2","group:rail0","blue"],"keep":true},
    {"g":"4. Y1 — A 전진","t":"<b>+24V</b> → <b>K2 21번</b>.","wire":["group:rail24","K2_21","red"],"keep":true},
    {"g":"4. Y1 — A 전진","t":"<b>K2 24번</b> → <b>Y1 +</b>.","wire":["K2_24","V1_Ya_p","red"],"keep":true},
    {"g":"4. Y1 — A 전진","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"5. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"5. 동작 확인","t":"<b>PB2</b>를 잠깐 눌렀다 떼세요. A가 전진합니다.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB2btn"]},
    {"g":"5. 동작 확인","t":"끝에서 LS2가 K2를 끊어 후진합니다.","done":{"type":"state","expect":{"A":"-"}}},
    {"g":"5. 동작 확인","t":"돌아오면 LS1이 눌려 K2가 다시 켜지고, 손대지 않아도 <b>또 전진</b>합니다. 이게 연속동작이에요.","done":{"type":"state","expect":{"A":"+"}}},
    {"g":"5. 동작 확인","t":"이제 <b>PB3</b>를 잠깐 눌러 보세요. K1이 꺼집니다.","done":{"type":"state","expect":{"K1":false}},"hl":["@PB3btn"]},
    {"g":"5. 동작 확인","t":"하던 사이클은 끝까지 마치고, 후진 끝에서 멈춥니다. 이게 연속정지예요.","done":{"type":"state","expect":{"A":"-","K2":false}}}
  ],
  "grading":{
    "setup":{"power":true,"air":true},"relayCount":2,
    "steps":[
      {"name":"처음에는 움직이지 않음","wait":1,"moves":[],"expect":{"A":"-"},
       "hint":"PB2를 누르기 전에는 K2가 켜지면 안 됩니다. LS1 다음에 K1 접점이 있는지 확인하세요."},
      {"name":"PB2를 한 번 누르면 A+ A− 연속 반복","tap":"PB2","wait":6.5,"movesRepeat":["A+","A-"],
       "hint":"K1이 PB2로 자기유지되고, A가 후진 끝(LS1)에 오면 K2가 다시 켜져야 합니다."},
      {"name":"PB3를 누르면 사이클을 마치고 후진 끝에서 정지","tap":"PB3","wait":3,"expect":{"A":"-","K1":false},
       "hint":"PB3(NC)가 K1 자기유지를 끊어야 합니다. 하던 사이클은 LS2가 K2를 끊어 마무리합니다."},
      {"name":"정지한 채로 유지","wait":3,"moves":[],"expect":{"A":"-"}},
      {"name":"PB2를 다시 누르면 다시 연속동작","tap":"PB2","wait":5,"movesRepeat":["A+","A-"]}
    ]
  }
},
{
  "id":"m10","no":"10","title":"카운터 3회 + 리셋",
  "goal":"PB2를 한 번 누르면 A+ A−를 3번 하고 멈추게 하세요. PB3로 카운터를 리셋한 뒤 PB2를 누르면 다시 3번 동작합니다.",
  "learn":"배우는 것: 카운터 모듈(계수 입력·리셋 입력·설정값), 다 세면 접점이 바뀌어 연속동작을 끊는 법 (공개과제 공1·2·4·8 유지보수 문항과 같은 동작)",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","LS1":"A-","LS2":"A+"},"diagram":"diagrams/m10.svg",
  "steps":[
    {"g":"1. 공기 회로","t":"<b>분배기</b>에서 <b>밸브 1번</b>으로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 4번</b> → <b>실린더 후방</b>.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 2번</b> → <b>실린더 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. 카운터 설정","t":"카운터 모듈 표시창의 <b>▲</b>를 눌러 설정을 <b>3</b>으로 맞추세요. (시험에서도 직접 맞춰야 해요)","done":{"type":"setting","name":"C1","value":3},"hl":["@C1set"],"keep":true},
    {"g":"3. K1 — 연속 기억 (다 세면 끊김)","t":"<b>+24V</b> → <b>카운터 11번</b>(공통).","wire":["group:rail24","C1_11","red"],"keep":true,"hl":["@C1coil"]},
    {"g":"3. K1 — 연속 기억 (다 세면 끊김)","t":"<b>카운터 12번</b>(NC) → <b>PB2 13번</b>. 3번을 다 세면 이 접점이 열려 연속동작이 끊겨요.","wire":["C1_12","PB2_13","red"],"keep":true},
    {"g":"3. K1 — 연속 기억 (다 세면 끊김)","t":"<b>PB2 14번</b> → <b>K1 A1</b>.","wire":["PB2_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"g":"3. K1 — 연속 기억 (다 세면 끊김)","t":"자기유지 ①: <b>카운터 12번</b> → <b>K1 11번</b>.","wire":["C1_12","K1_11","red"],"keep":true},
    {"g":"3. K1 — 연속 기억 (다 세면 끊김)","t":"자기유지 ②: <b>K1 14번</b> → <b>K1 A1</b>.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"g":"3. K1 — 연속 기억 (다 세면 끊김)","t":"<b>K1 A2</b> → <b>0V</b>.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"g":"4. K2 — 한 사이클 (미션 9와 같아요)","t":"<b>+24V</b> → <b>LS2 1번</b>.","wire":["group:rail24","LS2_1","red"],"keep":true,"hl":["@LS2"]},
    {"g":"4. K2 — 한 사이클 (미션 9와 같아요)","t":"<b>LS2 2번</b>(NC) → <b>K1 21번</b>.","wire":["LS2_2","K1_21","red"],"keep":true},
    {"g":"4. K2 — 한 사이클 (미션 9와 같아요)","t":"<b>K1 24번</b> → <b>LS1 1번</b>.","wire":["K1_24","LS1_1","red"],"keep":true,"hl":["@LS1"]},
    {"g":"4. K2 — 한 사이클 (미션 9와 같아요)","t":"<b>LS1 4번</b> → <b>K2 A1</b>.","wire":["LS1_4","K2_A1","red"],"keep":true,"hl":["@K2coil"]},
    {"g":"4. K2 — 한 사이클 (미션 9와 같아요)","t":"자기유지 ①: <b>LS2 2번</b> → <b>K2 11번</b>.","wire":["LS2_2","K2_11","red"],"keep":true},
    {"g":"4. K2 — 한 사이클 (미션 9와 같아요)","t":"자기유지 ②: <b>K2 14번</b> → <b>K2 A1</b>.","wire":["K2_14","K2_A1","red"],"keep":true},
    {"g":"4. K2 — 한 사이클 (미션 9와 같아요)","t":"<b>K2 A2</b> → <b>0V</b>.","wire":["K2_A2","group:rail0","blue"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>+24V</b> → <b>K2 21번</b>.","wire":["group:rail24","K2_21","red"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>K2 24번</b> → <b>Y1 +</b>.","wire":["K2_24","V1_Ya_p","red"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"6. 카운터 입력 (세기·리셋)","t":"세기: <b>LS2 4번</b>(NO) → <b>카운터 A1</b>(계수 입력). A가 전진 끝에 닿을 때마다 1씩 셉니다. LS2 1번에는 이미 +24V가 와 있어요.","wire":["LS2_4","C1_A1","red"],"keep":true},
    {"g":"6. 카운터 입력 (세기·리셋)","t":"<b>카운터 A2</b> → <b>0V</b>.","wire":["C1_A2","group:rail0","blue"],"keep":true},
    {"g":"6. 카운터 입력 (세기·리셋)","t":"리셋: <b>+24V</b> → <b>PB3 13번</b>.","wire":["group:rail24","PB3_13","red"],"keep":true,"hl":["@PB3btn"]},
    {"g":"6. 카운터 입력 (세기·리셋)","t":"<b>PB3 14번</b> → <b>카운터 R1</b>(리셋 입력).","wire":["PB3_14","C1_R1","red"],"keep":true},
    {"g":"6. 카운터 입력 (세기·리셋)","t":"<b>카운터 R2</b> → <b>0V</b>.","wire":["C1_R2","group:rail0","blue"],"keep":true},
    {"g":"7. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"7. 동작 확인","t":"<b>PB2</b>를 잠깐 눌러 연속동작을 시작하세요. 전진할 때마다 카운터 숫자가 올라가요.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB2btn"]},
    {"g":"7. 동작 확인","t":"세 번째 전진에서 카운터가 <b>3 / 3</b>이 되면 접점이 바뀌어 K1이 꺼집니다.","done":{"type":"state","expect":{"C1":3}}},
    {"g":"7. 동작 확인","t":"마지막 사이클을 마치고 후진 끝에서 멈춥니다. PB2를 눌러도 다시 움직이지 않아요(카운터가 다 찼으니까요).","done":{"type":"state","expect":{"A":"-","K1":false,"K2":false}}},
    {"g":"7. 동작 확인","t":"<b>PB3</b>를 눌러 카운터를 리셋하세요. 숫자가 0이 됩니다.","done":{"type":"state","expect":{"C1":0}},"hl":["@PB3btn"]},
    {"g":"7. 동작 확인","t":"<b>PB2</b>를 누르면 다시 3번 동작합니다. 성공!","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB2btn"]}
  ],
  "grading":{
    "setup":{"power":true,"air":true},"relayCount":2,
    "steps":[
      {"name":"PB2를 한 번 누르면 A+ A−를 3번 하고 정지","tap":"PB2","wait":8.5,"moves":["A+","A-","A+","A-","A+","A-"],"expect":{"A":"-"},
       "hint":"카운터를 3으로 맞췄는지, LS2 NO가 카운터 계수 입력(A1)에, 카운터 NC(11-12)가 K1 회로 앞에 있는지 확인하세요."},
      {"name":"리셋 전에는 PB2를 눌러도 움직이지 않음","tap":"PB2","wait":3,"moves":[]},
      {"name":"PB3를 누르면 카운터 리셋(0)","tap":"PB3","wait":0.5,"expect":{"C1":0},
       "hint":"PB3 NO(13-14)가 카운터 리셋 입력(R1-R2)에 이어져야 합니다."},
      {"name":"리셋 후 PB2로 다시 3번 동작","tap":"PB2","wait":8.5,"moves":["A+","A-","A+","A-","A+","A-"]}
    ]
  }
},
{
  "id":"m11","no":"11","title":"타이머 3초 지연",
  "goal":"PB1을 한 번 누르면 실린더 A가 전진하고, 끝에서 3초 머문 뒤 후진하게 하세요 (A+ 3초 A−).",
  "learn":"배우는 것: 켜짐 지연 타이머(코일에 전기가 들어오고 설정 시간이 지나면 접점이 바뀜), 타이머 설정 (공개과제 '전진 완료 3초 후 동작' 문항의 기초)",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","LS2":"A+"},"diagram":"diagrams/m11.svg",
  "steps":[
    {"g":"1. 공기 회로","t":"<b>분배기</b>에서 <b>밸브 1번</b>으로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 4번</b> → <b>실린더 후방</b>.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 2번</b> → <b>실린더 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. 타이머 설정","t":"타이머 모듈 표시창의 <b>▲</b>를 눌러 <b>3.0초</b>로 맞추세요. (한 번에 0.5초씩 올라가요)","done":{"type":"setting","name":"T1","value":3},"hl":["@T1set"],"keep":true},
    {"g":"3. K1 — 기동과 자기유지 (타이머가 끊음)","t":"<b>+24V</b> → <b>타이머 11번</b>(공통).","wire":["group:rail24","T1_11","red"],"keep":true,"hl":["@T1coil"]},
    {"g":"3. K1 — 기동과 자기유지 (타이머가 끊음)","t":"<b>타이머 12번</b>(NC) → <b>PB1 13번</b>. 3초가 지나면 이 접점이 열려 K1이 꺼져요.","wire":["T1_12","PB1_13","red"],"keep":true},
    {"g":"3. K1 — 기동과 자기유지 (타이머가 끊음)","t":"<b>PB1 14번</b> → <b>K1 A1</b>.","wire":["PB1_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"g":"3. K1 — 기동과 자기유지 (타이머가 끊음)","t":"자기유지 ①: <b>타이머 12번</b> → <b>K1 11번</b>.","wire":["T1_12","K1_11","red"],"keep":true},
    {"g":"3. K1 — 기동과 자기유지 (타이머가 끊음)","t":"자기유지 ②: <b>K1 14번</b> → <b>K1 A1</b>.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"g":"3. K1 — 기동과 자기유지 (타이머가 끊음)","t":"<b>K1 A2</b> → <b>0V</b>.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"g":"4. T1 — 전진 끝에서 시간 재기","t":"<b>+24V</b> → <b>LS2 1번</b>.","wire":["group:rail24","LS2_1","red"],"keep":true,"hl":["@LS2"]},
    {"g":"4. T1 — 전진 끝에서 시간 재기","t":"<b>LS2 4번</b>(NO) → <b>타이머 A1</b>. A가 끝에 닿으면 타이머가 시간을 재기 시작해요.","wire":["LS2_4","T1_A1","red"],"keep":true},
    {"g":"4. T1 — 전진 끝에서 시간 재기","t":"<b>타이머 A2</b> → <b>0V</b>.","wire":["T1_A2","group:rail0","blue"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>+24V</b> → <b>K1 21번</b>.","wire":["group:rail24","K1_21","red"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>K1 24번</b> → <b>Y1 +</b>.","wire":["K1_24","V1_Ya_p","red"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"6. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"6. 동작 확인","t":"<b>PB1</b>을 잠깐 눌렀다 떼세요. A가 전진합니다.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB1btn"]},
    {"g":"6. 동작 확인","t":"끝에 닿으면 타이머 막대가 차오르고, <b>3초 뒤</b> 접점이 바뀌어 후진합니다. 성공!","done":{"type":"state","expect":{"A":"-"}}}
  ],
  "grading":{"press":"PB1","sequence":["A+","A-"],"repeat":2,"relayCount":1,"dwell":{"after":"A+","sec":3,"tol":0.5}}
},
{
  "id":"m12","no":"12","title":"비상정지 + 램프",
  "goal":"PB2로 연속동작(A+ A− 반복). 동작 중 비상정지를 누르면 실린더가 후진하고 램프 H1이 켜지며, 비상정지를 풀면 램프가 꺼지고 초기화되어 PB2로 다시 시작하게 하세요.",
  "learn":"배우는 것: 유지형 비상정지 스위치. NC로 제어회로 전원 전체를 끊고, NO로 램프를 켜는 법 (공개과제 공3·5·6·7 유지보수 문항과 같은 동작)",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","LS1":"A-","LS2":"A+"},"diagram":"diagrams/m12.svg",
  "steps":[
    {"g":"1. 공기 회로","t":"<b>분배기</b>에서 <b>밸브 1번</b>으로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 4번</b> → <b>실린더 후방</b>.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 2번</b> → <b>실린더 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. 비상정지 — 제어 전원","t":"<b>+24V</b> → <b>비상정지 11번</b>(NC). 이제부터 회로는 모두 <b>비상정지 12번</b>에서 전기를 받아요. 비상정지를 누르면 전부 끊깁니다.","wire":["group:rail24","ES_11","red"],"keep":true,"hl":["@ESbtn"]},
    {"g":"3. K1 — 연속 기억 (PB2)","t":"<b>비상정지 12번</b> → <b>PB2 13번</b>.","wire":["ES_12","PB2_13","red"],"keep":true},
    {"g":"3. K1 — 연속 기억 (PB2)","t":"<b>PB2 14번</b> → <b>K1 A1</b>.","wire":["PB2_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"g":"3. K1 — 연속 기억 (PB2)","t":"자기유지 ①: <b>비상정지 12번</b> → <b>K1 11번</b>.","wire":["ES_12","K1_11","red"],"keep":true},
    {"g":"3. K1 — 연속 기억 (PB2)","t":"자기유지 ②: <b>K1 14번</b> → <b>K1 A1</b>.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"g":"3. K1 — 연속 기억 (PB2)","t":"<b>K1 A2</b> → <b>0V</b>.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"g":"4. K2 — 한 사이클 (LS1 시작, LS2 끝)","t":"<b>비상정지 12번</b> → <b>LS2 1번</b>.","wire":["ES_12","LS2_1","red"],"keep":true,"hl":["@LS2"]},
    {"g":"4. K2 — 한 사이클 (LS1 시작, LS2 끝)","t":"<b>LS2 2번</b>(NC) → <b>K1 21번</b>.","wire":["LS2_2","K1_21","red"],"keep":true},
    {"g":"4. K2 — 한 사이클 (LS1 시작, LS2 끝)","t":"<b>K1 24번</b> → <b>LS1 1번</b>.","wire":["K1_24","LS1_1","red"],"keep":true,"hl":["@LS1"]},
    {"g":"4. K2 — 한 사이클 (LS1 시작, LS2 끝)","t":"<b>LS1 4번</b> → <b>K2 A1</b>.","wire":["LS1_4","K2_A1","red"],"keep":true,"hl":["@K2coil"]},
    {"g":"4. K2 — 한 사이클 (LS1 시작, LS2 끝)","t":"자기유지 ①: <b>LS2 2번</b> → <b>K2 11번</b>.","wire":["LS2_2","K2_11","red"],"keep":true},
    {"g":"4. K2 — 한 사이클 (LS1 시작, LS2 끝)","t":"자기유지 ②: <b>K2 14번</b> → <b>K2 A1</b>.","wire":["K2_14","K2_A1","red"],"keep":true},
    {"g":"4. K2 — 한 사이클 (LS1 시작, LS2 끝)","t":"<b>K2 A2</b> → <b>0V</b>.","wire":["K2_A2","group:rail0","blue"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>비상정지 12번</b> → <b>K2 21번</b>.","wire":["ES_12","K2_21","red"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>K2 24번</b> → <b>Y1 +</b>.","wire":["K2_24","V1_Ya_p","red"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"6. 램프 — 비상정지 표시","t":"<b>+24V</b> → <b>비상정지 13번</b>(NO).","wire":["group:rail24","ES_13","red"],"keep":true},
    {"g":"6. 램프 — 비상정지 표시","t":"<b>비상정지 14번</b> → <b>H1 +</b>.","wire":["ES_14","H1_p","red"],"keep":true},
    {"g":"6. 램프 — 비상정지 표시","t":"<b>H1 −</b> → <b>0V</b>.","wire":["H1_n","group:rail0","blue"],"keep":true},
    {"g":"7. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"7. 동작 확인","t":"<b>PB2</b>를 잠깐 눌러 연속동작을 시작하세요.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB2btn"]},
    {"g":"7. 동작 확인","t":"연속동작 중에 <b>비상정지</b>를 누르세요. 눌린 채로 유지되고, 실린더가 후진하며 H1이 켜집니다.","done":{"type":"state","expect":{"ES":true,"A":"-","H1":true}},"hl":["@ESbtn"]},
    {"g":"7. 동작 확인","t":"<b>비상정지</b>를 한 번 더 눌러 풀어 주세요. 램프가 꺼지고, 다시 시작 전 상태(초기화)가 됩니다.","done":{"type":"state","expect":{"ES":false,"H1":false,"K1":false}},"hl":["@ESbtn"]},
    {"g":"7. 동작 확인","t":"<b>PB2</b>를 누르면 연속동작이 다시 시작됩니다. 성공!","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB2btn"]}
  ],
  "grading":{
    "setup":{"power":true,"air":true},"relayCount":2,
    "steps":[
      {"name":"PB2를 한 번 누르면 A+ A− 연속동작","tap":"PB2","wait":5,"movesRepeat":["A+","A-"]},
      {"name":"비상정지 ON → 실린더 후진, 램프 점등","set":{"ES":true},"wait":1.5,"expect":{"A":"-","H1":true},
       "hint":"비상정지 NC(11-12)가 K1·K2·Y1 회로 전체의 전원 앞에 있어야 하고, NO(13-14)로 램프를 켭니다."},
      {"name":"비상정지 OFF → 램프 소등, 초기화되어 멈춘 채로","set":{"ES":false},"wait":2.5,"moves":[],"expect":{"H1":false,"A":"-","K1":false},
       "hint":"비상정지를 풀어도 K1 자기유지가 끊긴 상태여야 합니다(초기화)."},
      {"name":"초기화 후 PB2로 다시 연속동작","tap":"PB2","wait":5,"movesRepeat":["A+","A-"]}
    ]
  }
},
{
  "id":"m13a","no":"13-1","title":"미터아웃 속도제어",
  "goal":"일방향 유량조절밸브로 실린더 A의 후진 속도만 느리게 하세요. 전진 속도는 그대로여야 합니다 (미터아웃).",
  "learn":"배우는 것: 일방향 유량조절밸브(조임 + 체크밸브), 실린더에서 나가는 공기를 조이는 미터아웃 (공개과제 공1·4·7 유지보수 문항)",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","MA1":"fcv"},"diagram":"diagrams/m13a.svg",
  "steps":[
    {"g":"1. 공기 회로 + 유량조절밸브","t":"<b>분배기</b>에서 <b>밸브 1번</b>으로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"g":"1. 공기 회로 + 유량조절밸브","t":"<b>밸브 4번</b> → <b>유량조절밸브 F1의 1번</b>(아래). 1번이 밸브 쪽이에요.","hose":["V1_4","F1_1"],"keep":true,"hl":["@F1"]},
    {"g":"1. 공기 회로 + 유량조절밸브","t":"<b>F1 2번</b>(위) → <b>실린더 후방</b>. 후진할 때 실린더에서 나가는 공기가 2→1로 지나가며 조여져요.","hose":["F1_2","A_cap"],"keep":true},
    {"g":"1. 공기 회로 + 유량조절밸브","t":"<b>밸브 2번</b> → <b>실린더 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로 + 유량조절밸브","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. 전기 회로 (미션 1과 같아요)","t":"<b>+24V</b> → <b>PB1 13번</b>.","wire":["group:rail24","PB1_13","red"],"keep":true},
    {"g":"2. 전기 회로 (미션 1과 같아요)","t":"<b>PB1 14번</b> → <b>Y1 +</b>.","wire":["PB1_14","V1_Ya_p","red"],"keep":true},
    {"g":"2. 전기 회로 (미션 1과 같아요)","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"3. 속도 조절","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"3. 속도 조절","t":"<b>PB1</b>을 누르고 있어 보세요. 전진은 체크밸브로 그냥 지나가서 빨라요.","done":{"type":"state","expect":{"PB1":true,"A":"+"}},"hl":["@PB1btn"]},
    {"g":"3. 속도 조절","t":"손을 떼 보세요. 지금은 10단(다 열림)이라 후진도 빨라요.","done":{"type":"state","expect":{"PB1":false,"A":"-"}},"hl":["@PB1btn"]},
    {"g":"3. 속도 조절","t":"유량조절밸브의 <b>▼</b>를 눌러 <b>4단</b>으로 조이세요.","done":{"type":"setting","name":"F1","value":4},"hl":["@F1set"],"keep":true},
    {"g":"3. 속도 조절","t":"<b>PB1</b>을 다시 누르고 있어 보세요. 전진 속도는 그대로예요.","done":{"type":"state","expect":{"PB1":true,"A":"+"}},"hl":["@PB1btn"]},
    {"g":"3. 속도 조절","t":"손을 떼면 <b>후진만 천천히</b> 돌아옵니다. 미터아웃 성공!","done":{"type":"state","expect":{"PB1":false,"A":"-"}},"hl":["@PB1btn"]}
  ],
  "grading":{
    "setup":{"power":true,"air":true},"repeat":2,
    "steps":[
      {"name":"전진 속도는 그대로 (1.3초 안에)","set":{"PB1":true},"wait":2,"expect":{"A":"+"},"stroke":{"cyl":"A","dir":"+","max":1.3},
       "hint":"전진할 때는 체크밸브 쪽으로 자유롭게 지나가야 합니다. 유량조절밸브 방향을 확인하세요."},
      {"name":"후진만 느리게 (1.5초 이상, 미터아웃)","set":{"PB1":false},"wait":4,"expect":{"A":"-"},"stroke":{"cyl":"A","dir":"-","min":1.5},"meter":{"A":"out"},
       "hint":"유량조절밸브를 실린더 후방 줄에 1번(밸브 쪽)·2번(실린더 쪽)으로 끼우고, ▼로 조여 보세요."}
    ]
  }
},
{
  "id":"m13b","no":"13-2","title":"급속배기밸브",
  "goal":"급속배기밸브로 실린더 A의 후진 속도를 빠르게 하세요.",
  "learn":"배우는 것: 급속배기밸브(실린더에서 나오는 공기를 방향제어밸브까지 보내지 않고 그 자리에서 빼 줌) (공개과제 공3·6 유지보수 문항)",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","MA1":"qev"},"diagram":"diagrams/m13b.svg",
  "steps":[
    {"g":"1. 공기 회로 + 급속배기밸브","t":"<b>분배기</b>에서 <b>밸브 1번</b>으로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"g":"1. 공기 회로 + 급속배기밸브","t":"<b>밸브 4번</b> → <b>급속배기밸브 Q1의 P</b>(아래).","hose":["V1_4","Q1_P"],"keep":true,"hl":["@Q1"]},
    {"g":"1. 공기 회로 + 급속배기밸브","t":"<b>Q1 A</b>(위) → <b>실린더 후방</b>. 실린더에 최대한 가까이 다는 게 요령이에요.","hose":["Q1_A","A_cap"],"keep":true},
    {"g":"1. 공기 회로 + 급속배기밸브","t":"<b>밸브 2번</b> → <b>실린더 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로 + 급속배기밸브","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. 전기 회로 (미션 1과 같아요)","t":"<b>+24V</b> → <b>PB1 13번</b>.","wire":["group:rail24","PB1_13","red"],"keep":true},
    {"g":"2. 전기 회로 (미션 1과 같아요)","t":"<b>PB1 14번</b> → <b>Y1 +</b>.","wire":["PB1_14","V1_Ya_p","red"],"keep":true},
    {"g":"2. 전기 회로 (미션 1과 같아요)","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"3. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"3. 동작 확인","t":"<b>PB1</b>을 누르고 있어 보세요. 전진은 평소 속도예요.","done":{"type":"state","expect":{"PB1":true,"A":"+"}},"hl":["@PB1btn"]},
    {"g":"3. 동작 확인","t":"손을 떼면 급속배기밸브가 그 자리에서 공기를 빼서 <b>후진이 훨씬 빨라요</b>. 성공!","done":{"type":"state","expect":{"PB1":false,"A":"-"}},"hl":["@PB1btn"]}
  ],
  "grading":{
    "setup":{"power":true,"air":true},"repeat":2,
    "steps":[
      {"name":"전진은 평소 속도","set":{"PB1":true},"wait":2,"expect":{"A":"+"},"stroke":{"cyl":"A","dir":"+","max":1.3}},
      {"name":"후진이 빨라짐 (0.7초 이하)","set":{"PB1":false},"wait":2,"expect":{"A":"-"},"stroke":{"cyl":"A","dir":"-","max":0.7},
       "hint":"급속배기밸브를 실린더 후방 줄에 P(밸브 쪽)·A(실린더 쪽)로 끼우세요. 반대로 끼우면 빨라지지 않아요."}
    ]
  }
},
{
  "id":"m13c","no":"13-3","title":"감압밸브",
  "goal":"서비스 유닛을 0.5 MPa로 맞추고, 감압밸브로 실린더 A의 작동압력을 0.3 MPa로 낮추세요.",
  "learn":"배우는 것: 서비스 유닛 압력 설정(시험 0.5±0.05 MPa), 감압밸브로 2차 압력 설정 (공개과제 공2·5·8 유지보수 문항)",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","R1":"prv"},"set":{"SU":0.2},"diagram":"diagrams/m13c.svg",
  "steps":[
    {"g":"1. 공급 압력 설정","t":"서비스 유닛의 <b>▲</b>를 눌러 <b>0.50 MPa</b>로 맞추세요. (시험 1번 문항: 0.5±0.05 MPa)","done":{"type":"setting","name":"SU","value":0.5},"hl":["@SUset"],"keep":true},
    {"g":"2. 공기 회로 + 감압밸브","t":"<b>분배기</b> → <b>감압밸브 PR1의 1번</b>(입구).","hose":["group:dist","PR1_1"],"keep":true,"hl":["@PR1"]},
    {"g":"2. 공기 회로 + 감압밸브","t":"<b>PR1 2번</b>(출구) → <b>밸브 1번</b>. 이제 밸브와 실린더는 낮춘 압력을 받아요.","hose":["PR1_2","V1_1"],"keep":true},
    {"g":"2. 공기 회로 + 감압밸브","t":"<b>밸브 4번</b> → <b>실린더 후방</b>.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"2. 공기 회로 + 감압밸브","t":"<b>밸브 2번</b> → <b>실린더 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"2. 공기 회로 + 감압밸브","t":"감압밸브의 <b>▼</b>를 눌러 2차 압력을 <b>0.30 MPa</b>로 맞추세요.","done":{"type":"setting","name":"PR1","value":0.3},"hl":["@PR1set"],"keep":true},
    {"g":"2. 공기 회로 + 감압밸브","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"3. 전기 회로 (미션 1과 같아요)","t":"<b>+24V</b> → <b>PB1 13번</b>.","wire":["group:rail24","PB1_13","red"],"keep":true},
    {"g":"3. 전기 회로 (미션 1과 같아요)","t":"<b>PB1 14번</b> → <b>Y1 +</b>.","wire":["PB1_14","V1_Ya_p","red"],"keep":true},
    {"g":"3. 전기 회로 (미션 1과 같아요)","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"4. 동작 확인","t":"<b>POWER</b>를 켜고 <b>PB1</b>을 누르고 있어 보세요. 실린더는 0.3 MPa로 전진합니다. 성공!","done":{"type":"state","expect":{"power":true,"PB1":true,"A":"+"}},"hl":["@rocker","@PB1btn"]}
  ],
  "grading":{
    "setup":{"power":true,"air":true},"repeat":2,
    "settingsCheck":[{"name":"SU","min":0.45,"max":0.55,"label":"서비스 유닛 압력 0.5±0.05 MPa"}],
    "steps":[
      {"name":"A 작동압력 0.3±0.05 MPa","set":{"PB1":true},"wait":2,"expect":{"A":"+"},"pressureAt":{"A":[0.25,0.35]},
       "hint":"감압밸브를 분배기와 밸브 1번 사이에 1번(입구)·2번(출구) 방향으로 끼우고 2차 압력을 0.30으로 맞추세요."},
      {"name":"PB1을 떼면 후진","set":{"PB1":false},"wait":2,"expect":{"A":"-"}}
    ]
  }
},
{
  "id":"m14a","no":"14-1","title":"오류 찾기: 자기유지",
  "goal":"도면의 전기회로도에는 틀린 곳이 하나 있어요. 찾아서 고친 회로로 배선하세요. PB1을 눌렀다 떼도 A가 전진한 채로 있고, PB2를 누르면 후진해야 합니다.",
  "learn":"배우는 것: 시험 2번 문항 \"전기회로도의 오류를 정정하고 배선\" 연습. 그려진 대로가 아니라 동작을 생각하며 읽기",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s"},"diagram":"diagrams/m14a.svg",
  "quiz":{
    "q":"도면의 전기회로도에서 틀린 곳은 어디일까요?",
    "choices":[
      {"t":"정지 버튼 PB2가 NC로 그려져 있다","why":"정지 버튼은 평소에 전기를 흘려 주다가 누를 때만 끊어야 하니 NC가 맞아요."},
      {"t":"K1 자기유지 접점이 NC로 그려져 있다"},
      {"t":"Y1을 PB1이 아니라 K1 접점으로 켠다","why":"릴레이 회로에서는 솔레노이드를 릴레이 접점으로 켜는 게 맞아요. 미션 3·4와 같아요."}
    ],
    "answer":1,
    "explain":"자기유지 접점은 K1이 켜졌을 때 <b>닫혀야</b> PB1을 떼도 코일에 전기가 계속 갑니다. 그래서 <b>NO</b>(11-14)여야 해요. NC로 배선하면 전원을 켜자마자 K1이 켜졌다 꺼졌다를 되풀이합니다."
  },
  "steps":[
    {"g":"0. 오류 찾기","t":"<b>도면 보기</b>를 열고 전기회로도를 살펴보세요. 위 문제에서 틀린 곳을 고르면 다음으로 넘어갑니다.","done":{"type":"quiz"},"btn":"diagramBtn","keep":true},
    {"g":"1. 공기 회로","t":"<b>분배기</b>에서 <b>밸브 1번</b>으로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 4번</b> → <b>실린더 후방</b>.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 2번</b> → <b>실린더 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"<b>+24V</b> → <b>PB2 11번</b>(NC).","wire":["group:rail24","PB2_11","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"<b>PB2 12번</b> → <b>PB1 13번</b>.","wire":["PB2_12","PB1_13","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"<b>PB1 14번</b> → <b>K1 A1</b>.","wire":["PB1_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"자기유지 ①: <b>PB2 12번</b> → <b>K1 11번</b>(공통).","wire":["PB2_12","K1_11","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"자기유지 ②: 도면은 NC(12번)지만 고쳐서 <b>K1 14번</b>(NO) → <b>K1 A1</b>.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"<b>K1 A2</b> → <b>0V</b>.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>+24V</b> → <b>K1 21번</b>.","wire":["group:rail24","K1_21","red"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>K1 24번</b> → <b>Y1 +</b>.","wire":["K1_24","V1_Ya_p","red"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"4. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"4. 동작 확인","t":"<b>PB1</b>을 잠깐 눌렀다 떼세요. A가 전진한 채로 있으면 자기유지가 된 거예요.","done":{"type":"state","expect":{"PB1":false,"K1":true,"A":"+"}},"hl":["@PB1btn"]},
    {"g":"4. 동작 확인","t":"<b>PB2</b>를 누르면 후진합니다. 성공!","done":{"type":"state","expect":{"K1":false,"A":"-"}},"hl":["@PB2btn"]}
  ],
  "grading":{
    "setup":{"power":true,"air":true},"repeat":2,"relayCount":1,
    "steps":[
      {"name":"초기 상태에서 K1 꺼짐, 실린더 후진","wait":1.5,"expect":{"K1":false,"A":"-"},
       "hint":"전원만 켰는데 K1이 켜진다면 자기유지 접점을 NC로 배선한 거예요."},
      {"name":"PB1을 눌렀다 떼도 전진 유지 (자기유지)","tap":"PB1","wait":2,"expect":{"K1":true,"A":"+"},
       "hint":"자기유지 접점은 K1의 NO(11-14)로, PB1과 나란히 연결합니다."},
      {"name":"PB2를 누르면 자기유지 해제, 실린더 후진","tap":"PB2","wait":2,"expect":{"K1":false,"A":"-"}}
    ]
  }
},
{
  "id":"m14b","no":"14-2","title":"오류 찾기: 리밋스위치",
  "goal":"도면의 전기회로도에는 틀린 곳이 하나 있어요. 찾아서 고친 회로로 배선하세요. PB1을 한 번 누르면 A+ A−로 움직여야 합니다.",
  "learn":"배우는 것: 공기압회로도에서 센서가 실린더 어느 끝에 있는지 보고 전기회로도의 센서 이름이 맞는지 확인하기",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","LS1":"A-","LS2":"A+"},"diagram":"diagrams/m14b.svg",
  "quiz":{
    "q":"도면의 전기회로도에서 틀린 곳은 어디일까요?",
    "choices":[
      {"t":"기동 버튼 PB1이 NO로 그려져 있다","why":"기동 버튼은 누를 때만 닫히는 NO가 맞아요."},
      {"t":"자기유지 접점 K1이 PB1과 나란히(병렬로) 그려져 있다","why":"병렬이어야 PB1을 떼도 K1이 유지돼요. 맞게 그려져 있어요."},
      {"t":"자기유지를 끊는 리밋스위치가 LS2가 아니라 LS1로 적혀 있다"}
    ],
    "answer":2,
    "explain":"공기압회로도를 보면 <b>LS1은 후진 끝</b>, <b>LS2는 전진 끝</b>에 있어요. 실린더가 평소 후진해 있으니 LS1은 늘 눌려 있고, 그 NC가 열려 있어서 PB1을 눌러도 K1이 켜지지 않습니다. 전진 끝에서 끊어야 하므로 <b>LS2</b>의 NC를 써야 해요."
  },
  "steps":[
    {"g":"0. 오류 찾기","t":"<b>도면 보기</b>를 열고, 공기압회로도의 센서 위치와 전기회로도를 비교해 보세요. 위 문제에서 틀린 곳을 고르면 넘어갑니다.","done":{"type":"quiz"},"btn":"diagramBtn","keep":true},
    {"g":"1. 공기 회로","t":"<b>분배기</b>에서 <b>밸브 1번</b>으로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 4번</b> → <b>실린더 후방</b>.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 2번</b> → <b>실린더 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"도면의 LS1을 고쳐 <b>LS2</b>를 씁니다. <b>+24V</b> → <b>LS2 1번</b>.","wire":["group:rail24","LS2_1","red"],"keep":true,"hl":["@LS2"]},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"<b>LS2 2번</b>(NC) → <b>PB1 13번</b>.","wire":["LS2_2","PB1_13","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"<b>PB1 14번</b> → <b>K1 A1</b>.","wire":["PB1_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"자기유지 ①: <b>LS2 2번</b> → <b>K1 11번</b>.","wire":["LS2_2","K1_11","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"자기유지 ②: <b>K1 14번</b> → <b>K1 A1</b>.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지 (고친 회로)","t":"<b>K1 A2</b> → <b>0V</b>.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>+24V</b> → <b>K1 21번</b>.","wire":["group:rail24","K1_21","red"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>K1 24번</b> → <b>Y1 +</b>.","wire":["K1_24","V1_Ya_p","red"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"4. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"4. 동작 확인","t":"<b>PB1</b>을 잠깐 눌렀다 떼세요. A가 전진합니다.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB1btn"]},
    {"g":"4. 동작 확인","t":"전진 끝에서 LS2가 자기유지를 끊어 후진합니다. 성공!","done":{"type":"state","expect":{"A":"-","K1":false}}}
  ],
  "grading":{"press":"PB1","sequence":["A+","A-"],"repeat":2,"relayCount":1}
},
{
  "id":"m14c","no":"14-3","title":"오류 찾기: 릴레이 번호",
  "goal":"도면의 전기회로도에는 틀린 곳이 하나 있어요. 찾아서 고친 회로로 배선하세요. PB1을 한 번 누르면 A+ B+ B− A− 순서로 움직여야 합니다.",
  "learn":"배우는 것: 릴레이마다 \"언제 켜지는지\"를 따라가며 접점 번호가 맞는지 확인하기 (공개과제 오류에서 자주 나오는 유형)",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","cylB":"cylinder","valveB":"valve52s","S1":"A+","LS1":"B+","LS2":"B-"},"diagram":"diagrams/m14c.svg",
  "quiz":{
    "q":"도면의 전기회로도에서 틀린 곳은 어디일까요?",
    "choices":[
      {"t":"K1 줄의 K4 접점이 NC로 그려져 있다","why":"K4는 사이클이 끝날 때 K1을 끊어야 하니 NC가 맞아요."},
      {"t":"Y2 줄의 K3 접점이 NC로 그려져 있다","why":"K3는 B가 전진 끝(LS1)에 닿으면 켜져서 Y2를 끊어야 하니 NC가 맞아요."},
      {"t":"K4 줄의 첫 접점이 K3가 아니라 K2로 적혀 있다"},
      {"t":"센서 S1의 출력이 K3가 아니라 K2에 이어져 있다","why":"S1(A 전진 끝)은 B를 출발시키는 K2를 켜야 해요. 맞게 그려져 있어요."}
    ],
    "answer":2,
    "explain":"K4는 <b>B가 나갔다가 돌아왔을 때</b> 켜져야 합니다. 그래서 \"B가 나갔었다\"를 기억하는 <b>K3</b> 뒤에 LS2를 둬요. K2로 적힌 대로 배선하면, A가 전진 끝에 닿는 순간 B는 아직 후진 끝(LS2 눌림)이라 K4가 바로 켜져서 <b>B가 움직이기도 전에 A가 돌아옵니다</b>."
  },
  "steps":[
    {"g":"0. 오류 찾기","t":"<b>도면 보기</b>를 열고, 릴레이마다 언제 켜지는지 따라가 보세요. 위 문제에서 틀린 곳을 고르면 넘어갑니다.","done":{"type":"quiz"},"btn":"diagramBtn","keep":true},
    {"g":"1. 공기 회로","t":"<b>분배기 D1</b> → <b>V1 1번</b>.","hose":["D1","V1_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>V1 4번</b> → <b>실린더 A 후방</b>.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>V1 2번</b> → <b>실린더 A 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>분배기 D2</b> → <b>V2 1번</b>.","hose":["D2","V2_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>V2 4번</b> → <b>실린더 B 후방</b>.","hose":["V2_4","B_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>V2 2번</b> → <b>실린더 B 전방</b>.","hose":["V2_2","B_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지","t":"<b>+24V</b> → <b>K4 11번</b>.","wire":["group:rail24","K4_11","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지","t":"<b>K4 12번</b>(NC) → <b>PB1 13번</b>.","wire":["K4_12","PB1_13","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지","t":"<b>PB1 14번</b> → <b>K1 A1</b>.","wire":["PB1_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"g":"2. K1 — 기동과 자기유지","t":"자기유지 ①: <b>K4 12번</b> → <b>K1 11번</b>.","wire":["K4_12","K1_11","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지","t":"자기유지 ②: <b>K1 14번</b> → <b>K1 A1</b>.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"g":"2. K1 — 기동과 자기유지","t":"<b>K1 A2</b> → <b>0V</b>.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>+24V</b> → <b>K1 21번</b>.","wire":["group:rail24","K1_21","red"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>K1 24번</b> → <b>Y1 +</b>.","wire":["K1_24","V1_Ya_p","red"],"keep":true},
    {"g":"3. Y1 — A 전진","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"4. S1 → K2 — A 전진 끝 감지","t":"<b>+24V</b> → <b>S1 갈색(+)</b>.","wire":["group:rail24","S1_p","red"],"keep":true,"hl":["@S1"]},
    {"g":"4. S1 → K2 — A 전진 끝 감지","t":"<b>S1 청색(−)</b> → <b>0V</b>.","wire":["S1_n","group:rail0","blue"],"keep":true},
    {"g":"4. S1 → K2 — A 전진 끝 감지","t":"<b>S1 흑색(출력)</b> → <b>K2 A1</b>.","wire":["S1_out","K2_A1","red"],"keep":true,"hl":["@K2coil"]},
    {"g":"4. S1 → K2 — A 전진 끝 감지","t":"<b>K2 A2</b> → <b>0V</b>.","wire":["K2_A2","group:rail0","blue"],"keep":true},
    {"g":"5. Y2 — B 전진","t":"<b>+24V</b> → <b>K1 31번</b>.","wire":["group:rail24","K1_31","red"],"keep":true},
    {"g":"5. Y2 — B 전진","t":"<b>K1 34번</b> → <b>K2 11번</b>.","wire":["K1_34","K2_11","red"],"keep":true},
    {"g":"5. Y2 — B 전진","t":"<b>K2 14번</b> → <b>K3 11번</b>.","wire":["K2_14","K3_11","red"],"keep":true},
    {"g":"5. Y2 — B 전진","t":"<b>K3 12번</b>(NC) → <b>Y2 +</b>.","wire":["K3_12","V2_Ya_p","red"],"keep":true},
    {"g":"5. Y2 — B 전진","t":"<b>Y2 −</b> → <b>0V</b>.","wire":["V2_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"<b>+24V</b> → <b>K1 41번</b>.","wire":["group:rail24","K1_41","red"],"keep":true},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"<b>K1 44번</b> → <b>LS1 1번</b>.","wire":["K1_44","LS1_1","red"],"keep":true,"hl":["@LS1"]},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"<b>LS1 4번</b>(NO) → <b>K3 A1</b>.","wire":["LS1_4","K3_A1","red"],"keep":true,"hl":["@K3coil"]},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"자기유지 ①: <b>K1 44번</b> → <b>K3 21번</b>.","wire":["K1_44","K3_21","red"],"keep":true},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"자기유지 ②: <b>K3 24번</b> → <b>K3 A1</b>.","wire":["K3_24","K3_A1","red"],"keep":true},
    {"g":"6. K3 — B 전진 끝 기억 (LS1)","t":"<b>K3 A2</b> → <b>0V</b>.","wire":["K3_A2","group:rail0","blue"],"keep":true},
    {"g":"7. K4 — 사이클 끝 (고친 회로)","t":"도면의 K2를 고쳐 <b>K3</b>를 씁니다. <b>+24V</b> → <b>K3 31번</b>.","wire":["group:rail24","K3_31","red"],"keep":true},
    {"g":"7. K4 — 사이클 끝 (고친 회로)","t":"<b>K3 34번</b> → <b>LS2 1번</b>.","wire":["K3_34","LS2_1","red"],"keep":true,"hl":["@LS2"]},
    {"g":"7. K4 — 사이클 끝 (고친 회로)","t":"<b>LS2 4번</b>(NO) → <b>K4 A1</b>.","wire":["LS2_4","K4_A1","red"],"keep":true,"hl":["@K4coil"]},
    {"g":"7. K4 — 사이클 끝 (고친 회로)","t":"<b>K4 A2</b> → <b>0V</b>.","wire":["K4_A2","group:rail0","blue"],"keep":true},
    {"g":"8. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"8. 동작 확인","t":"<b>PB1</b>을 잠깐 눌렀다 떼세요. <b>A가 전진</b>합니다.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB1btn"]},
    {"g":"8. 동작 확인","t":"이번엔 A가 돌아오지 않고 <b>B가 전진</b>합니다.","done":{"type":"state","expect":{"B":"+"}}},
    {"g":"8. 동작 확인","t":"<b>B가 후진</b>합니다.","done":{"type":"state","expect":{"B":"-"}}},
    {"g":"8. 동작 확인","t":"B가 돌아오면 K4가 켜져 <b>A가 후진</b>합니다. 성공!","done":{"type":"state","expect":{"A":"-"}}}
  ],
  "grading":{"press":"PB1","sequence":["A+","B+","B-","A-"],"repeat":2,"relayCount":4}
},
{
  "id":"m14d","no":"14-4","title":"오류 찾기: 타이머",
  "goal":"도면의 전기회로도에는 틀린 곳이 하나 있어요. 찾아서 고친 회로로 배선하세요. PB1을 한 번 누르면 A가 전진하고, 끝에서 3초 머문 뒤 후진해야 합니다.",
  "learn":"배우는 것: 타이머 코일을 켜 놓고 그 접점을 쓰지 않는 오류 찾기. 한시 접점(낙하산 모양) 기호 읽기",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","LS2":"A+"},"diagram":"diagrams/m14d.svg",
  "quiz":{
    "q":"도면의 전기회로도에서 틀린 곳은 어디일까요?",
    "choices":[
      {"t":"T1 코일 줄의 LS2가 NO로 그려져 있다","why":"A가 전진 끝에 닿았을 때 타이머가 시간을 재기 시작해야 하니 NO가 맞아요."},
      {"t":"K1을 끊는 접점이 T1(타이머)이 아니라 LS2로 적혀 있다"},
      {"t":"Y1을 T1이 아니라 K1 접점으로 켠다","why":"Y1은 K1 접점으로 켜고, 타이머는 K1을 끊는 역할이에요. 맞게 그려져 있어요."}
    ],
    "answer":1,
    "explain":"타이머 코일(T1)은 그려져 있는데 <b>T1 접점은 어디에도 없어요</b>. 이런 경우가 오류 신호예요. LS2 NC로 끊으면 전진 끝에 닿자마자 후진해서 3초를 기다리지 않습니다. K1 줄 맨 위에는 <b>T1 한시 NC 접점</b>(11-12)이 와야 해요."
  },
  "steps":[
    {"g":"0. 오류 찾기","t":"<b>도면 보기</b>를 열고, 코일마다 그 접점이 어디에 쓰였는지 찾아보세요. 위 문제에서 틀린 곳을 고르면 넘어갑니다.","done":{"type":"quiz"},"btn":"diagramBtn","keep":true},
    {"g":"1. 공기 회로","t":"<b>분배기</b>에서 <b>밸브 1번</b>으로 호스를 연결하세요.","hose":["group:dist","V1_1"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 4번</b> → <b>실린더 후방</b>.","hose":["V1_4","A_cap"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>밸브 2번</b> → <b>실린더 전방</b>.","hose":["V1_2","A_rod"],"keep":true},
    {"g":"1. 공기 회로","t":"<b>공기 공급</b>을 켜세요.","done":{"type":"state","expect":{"air":true}},"hl":["@air"],"keep":true},
    {"g":"2. 타이머 설정","t":"타이머 표시창의 <b>▲</b>를 눌러 <b>3.0초</b>로 맞추세요.","done":{"type":"setting","name":"T1","value":3},"hl":["@T1set"],"keep":true},
    {"g":"3. K1 — 기동과 자기유지 (고친 회로)","t":"도면의 LS2를 고쳐 <b>타이머 접점</b>을 씁니다. <b>+24V</b> → <b>타이머 11번</b>.","wire":["group:rail24","T1_11","red"],"keep":true,"hl":["@T1coil"]},
    {"g":"3. K1 — 기동과 자기유지 (고친 회로)","t":"<b>타이머 12번</b>(NC) → <b>PB1 13번</b>.","wire":["T1_12","PB1_13","red"],"keep":true},
    {"g":"3. K1 — 기동과 자기유지 (고친 회로)","t":"<b>PB1 14번</b> → <b>K1 A1</b>.","wire":["PB1_14","K1_A1","red"],"keep":true,"hl":["@K1coil"]},
    {"g":"3. K1 — 기동과 자기유지 (고친 회로)","t":"자기유지 ①: <b>타이머 12번</b> → <b>K1 11번</b>.","wire":["T1_12","K1_11","red"],"keep":true},
    {"g":"3. K1 — 기동과 자기유지 (고친 회로)","t":"자기유지 ②: <b>K1 14번</b> → <b>K1 A1</b>.","wire":["K1_14","K1_A1","red"],"keep":true},
    {"g":"3. K1 — 기동과 자기유지 (고친 회로)","t":"<b>K1 A2</b> → <b>0V</b>.","wire":["K1_A2","group:rail0","blue"],"keep":true},
    {"g":"4. T1 — 전진 끝에서 시간 재기","t":"<b>+24V</b> → <b>LS2 1번</b>.","wire":["group:rail24","LS2_1","red"],"keep":true,"hl":["@LS2"]},
    {"g":"4. T1 — 전진 끝에서 시간 재기","t":"<b>LS2 4번</b>(NO) → <b>타이머 A1</b>.","wire":["LS2_4","T1_A1","red"],"keep":true},
    {"g":"4. T1 — 전진 끝에서 시간 재기","t":"<b>타이머 A2</b> → <b>0V</b>.","wire":["T1_A2","group:rail0","blue"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>+24V</b> → <b>K1 21번</b>.","wire":["group:rail24","K1_21","red"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>K1 24번</b> → <b>Y1 +</b>.","wire":["K1_24","V1_Ya_p","red"],"keep":true},
    {"g":"5. Y1 — A 전진","t":"<b>Y1 −</b> → <b>0V</b>.","wire":["V1_Ya_n","group:rail0","blue"],"keep":true},
    {"g":"6. 동작 확인","t":"<b>POWER</b>를 켜세요.","done":{"type":"state","expect":{"power":true}},"hl":["@rocker"],"keep":true},
    {"g":"6. 동작 확인","t":"<b>PB1</b>을 잠깐 눌렀다 떼세요. A가 전진합니다.","done":{"type":"state","expect":{"A":"+"}},"hl":["@PB1btn"]},
    {"g":"6. 동작 확인","t":"끝에서 <b>3초 머문 뒤</b> 후진합니다. 성공!","done":{"type":"state","expect":{"A":"-"}}}
  ],
  "grading":{"press":"PB1","sequence":["A+","A-"],"repeat":2,"relayCount":1,"dwell":{"after":"A+","sec":3,"tol":0.5}}
},
{
  "id":"practice","no":"실전","title":"실전 연습","steps":[],
  "goal":"가지고 있는 공개도면을 보며 판을 꾸미고 호스·배선을 하세요. 시험장처럼 채점은 없어요. 다 했으면 PB1을 두 번 눌러 변위단계선도대로 똑같이 동작하는지 직접 확인하세요.",
  "learn":"판 구성에서 밸브 종류(편솔·양솔), 센서·리밋 위치, 유지보수 기기를 도면대로 고르세요. 스톱워치로 시간을 재 보세요.",
  "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","cylB":"cylinder","valveB":"valve52s"},"set":{"SU":0.3},
  "practice":{
    "check":["서비스 유닛 압력 0.5±0.05 MPa","호스는 포트 하나에 하나, 공기 누설 없게","+ 배선 적색, − 배선 청색·흑색","전기회로도의 오류를 고쳐 배선 (릴레이 개수는 그대로)","PB1을 두 번 눌러 두 번 다 똑같이 동작하는지"],
    "choices":{"valveA":["valve52s","valve52d"],"valveB":["valve52s","valve52d"],"S1":["","A+","A-","B+","B-"],"S2":["","A+","A-","B+","B-"],"LS1":["","A+","A-","B+","B-"],"LS2":["","A+","A-","B+","B-"],"MA1":["","fcv","qev"],"MA2":["","fcv","qev"],"MB1":["","fcv","qev"],"MB2":["","fcv","qev"],"R1":["","prv"]}
  }
},
{"id":"hfree","no":"∞","title":"유압 자유 실습","goal":"유압 파워유닛, 4/2·4/3 밸브, 실린더·유압모터를 자유롭게 연결해 보세요.","learn":"유압은 쓰고 난 기름이 밸브 T 포트 → 탱크(T)로 돌아가야 움직여요. 펌프 압력은 릴리프(RV)로 맞춥니다 (시험 4±0.2 MPa). 밸브의 ‘종류 교체’로 4/2·4/3을 바꿔 볼 수 있어요.","steps":[],
 "layout":"hyd","board":{"cylA":"cylinder","valveA":"valve43c","cylB":"motor","valveB":"valve43c","LS1":"A-","LS2":"A+","MA1":"fcv","R1":"chk"}},
{"id":"free","no":"∞","title":"자유 실습","goal":"모든 부품을 자유롭게 연결하고 동작을 확인해 보세요.","learn":"채점 없이 회로를 실험하는 공간입니다. 밸브의 ‘종류 교체’로 편솔·양솔을 바꿔 볼 수 있어요.","steps":[],
 "layout":"air","board":{"cylA":"cylinder","valveA":"valve52s","cylB":"cylinder","valveB":"valve52d","LS1":"A-","LS2":"A+","S1":"B-","S2":"B+","MA1":"fcv","MB1":"qev","R1":"prv"}}
];
