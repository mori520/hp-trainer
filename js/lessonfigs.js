/* ===================== 기초 강의 그림 =====================
   강의 데이터(lessons.js)의 "fig" 이름 → SVG 문자열. 화면 없이도 만들 수 있다(DOM을 쓰지 않음).
   눌러 보는 그림: 상태 이름(예: P, W)을 쓴다.
     data-hold="P"  누르는 동안만 P가 켜짐 (누름버튼)
     data-tap="W"   누를 때마다 W가 켜짐/꺼짐 (선 꽂기, 코일 켜기 등)
     data-show="식" 식이 참일 때만 보임. 식은 상태 이름과 & | ! ( ) 로 쓴다 (예: "A&B", "!P")
   전기가 흐르는 길은 class="flow"(움직이는 점선)로 그린다. */
const FIG=(()=>{
  const at=o=>Object.entries(o).filter(([,v])=>v!=null&&v!=='').map(([k,v])=>` ${k}="${v}"`).join('');
  const sv=(w,h,b)=>`<svg viewBox="0 0 ${w} ${h}" class="lfig" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
  const line=(x1,y1,x2,y2,c='lw',o={})=>`<line${at({x1,y1,x2,y2,class:c,...o})}/>`;
  const path=(d,c='lw',o={})=>`<path${at({d,class:c,...o})}/>`;
  const rect=(x,y,w,h,c='lw',o={})=>`<rect${at({x,y,width:w,height:h,rx:4,class:c,...o})}/>`;
  const circ=(cx,cy,r,c='lw',o={})=>`<circle${at({cx,cy,r,class:c,...o})}/>`;
  const text=(x,y,s,c='lt',a='middle',o={})=>`<text${at({x,y,class:c,'text-anchor':a,...o})}>${s}</text>`;
  const show=e=>e?{'data-show':e}:{};
  const live=e=>/[A-Za-z]/.test(e)?'lw lon':'lw';   // 버튼으로 바뀌는 접점만 닫힌 날을 초록으로
  const g=(o,b)=>`<g${at(o)}>${b}</g>`;
  const dot=(x,y)=>circ(x,y,3,'ldot');
  const flow=(d,e)=>path(d,'flow',show(e));

  // 위 +24V(빨강), 아래 0V(파랑) 가로선
  const rails=(w,top=40,bot=260,x0=70)=>line(x0,top,w-20,top,'lred')+line(x0,bot,w-20,bot,'lblue')
    +text(x0-8,top+5,'+24V','lh lr','end')+text(x0-8,bot+5,'0V','lh lb','end');
  // 접점(세로, 가운데 y, 위아래 20px). on: 닫히는 조건 식
  const cNO=(x,y,on,name)=>path(`M${x},${y-20}V${y-8}M${x},${y+8}V${y+20}`)
    +path(`M${x},${y+8}L${x-12},${y-7}`,'lw',show(`!(${on})`))+path(`M${x},${y+8}V${y-8}`,live(on),show(on))
    +(name?text(x+12,y+5,name,'lt','start'):'');
  // NC 접점: open = 열리는 조건 식
  const cNC=(x,y,open,name)=>path(`M${x},${y-20}V${y-8}H${x+10}M${x},${y+8}V${y+20}`)
    +path(`M${x},${y+8}L${x+11},${y-9}`,live(open),show(`!(${open})`))+path(`M${x},${y+8}L${x+16},${y+1}`,'lw',show(open))
    +(name?text(x+20,y+5,name,'lt','start'):'');
  const lamp=(x,y,on,name)=>circ(x,y,17,'llamp')+circ(x,y,17,'llamp on',show(on))
    +path(`M${x-12},${y-12}L${x+12},${y+12}M${x+12},${y-12}L${x-12},${y+12}`,'lw')+(name?text(x+26,y+5,name,'lt','start'):'');
  const coil=(x,y,on,name)=>rect(x-17,y-11,34,22,'lcoil')+rect(x-17,y-11,34,22,'lcoil on',show(on))+(name?text(x+26,y+5,name,'lt','start'):'');
  // 눌러 보는 버튼: hold(누르는 동안) / tap(누를 때마다 바뀜)
  const btn=(x,y,w,label,o)=>g({class:'tap',tabindex:0,role:'button',...o},
    rect(x-w/2,y-17,w,34,'lbtn')+rect(x-w/2,y-17,w,34,'lbtn down',show(o['data-hold']||o['data-tap']))+text(x,y+5,label,'lt lbt'));
  const hold=(x,y,id,label,w=110)=>btn(x,y,w,label,{'data-hold':id});
  const tap=(x,y,id,label,w=110)=>btn(x,y,w,label,{'data-tap':id});
  const say=(x,y,e,s,c='ls',a='middle')=>text(x,y,s,c,a,show(e));

  const F={};

  /* ---------- 1. 전기가 흐르는 길 ---------- */
  F.rails=()=>sv(560,300,rails(560)
    +path('M280,70V220','larrow')+path('M270,206L280,224L290,206','lw lfillk')
    +text(300,140,'전기는 +24V에서','lt','start')+text(300,162,'0V 쪽으로 흐르려 해요','lt','start')
    +circ(120,110,9,'ljack r')+text(138,115,'빨간 잭 = +24V','ls','start')
    +circ(120,190,9,'ljack b')+text(138,195,'파란 잭 = 0V','ls','start'));
  F.loop=()=>sv(560,300,rails(560)+dot(220,40)+dot(220,260)
    +line(220,40,220,132)+lamp(220,150,'W','H1')+line(220,168,220,196)+line(220,232,220,260)
    +circ(220,196,4,'ldot')+circ(220,232,4,'ldot')
    +line(220,196,220,232,'lw',show('W'))+text(234,219,'← 빠진 선','ls lbad','start',show('!W'))
    +flow('M220,40V132M220,168V260','W')
    +tap(420,140,'W','선 꽂기 / 빼기',130)
    +say(420,196,'W','한 바퀴 길이 이어져 램프가 켜졌어요')+say(420,196,'!W','길이 끊겨 전기가 흐르지 못해요'));
  F.short=()=>sv(560,300,rails(560)+dot(170,40)+dot(170,260)+line(170,40,170,260,'lw lbadw')
    +path('M158,140l10,-10l4,12l10,-12l4,12','lbadw')+text(170,290,'✗ 부하 없이 바로 이음 = 합선','lt lbad')
    +dot(400,40)+dot(400,260)+line(400,40,400,132)+lamp(400,150,'1','H1')+line(400,168,400,260)
    +flow('M400,40V132M400,168V260','1')+text(400,290,'✓ 램프(부하)를 거침','lt lgood'));

  /* ---------- 2. 트레이너 둘러보기 ---------- */
  F.rack=()=>{
    const box=(x,y,w,h,s,c='lbox')=>rect(x,y,w,h,c)+text(x+w/2,y+h/2+5,s,'lt');
    return sv(560,320,text(20,24,'전기 랙 (위)','lh','start')
      +box(20,36,70,60,'전원')+box(96,36,140,60,'스위치')+box(242,36,70,60,'램프')+box(318,36,70,60,'타이머')+box(394,36,70,60,'카운터')
      +box(20,102,215,56,'릴레이 K1~K3')+box(241,102,215,56,'릴레이 K4~K6')
      +text(20,192,'고정판 (아래) — 공압 기기','lh','start')
      +rect(20,204,520,100,'lboard')+box(36,218,90,72,'서비스 유닛','lbox2')+box(146,218,120,30,'실린더 A','lbox2')+box(146,258,120,32,'밸브 V1','lbox2')
      +box(286,218,120,30,'실린더 B','lbox2')+box(286,258,120,32,'밸브 V2','lbox2')+box(424,218,100,72,'센서·리밋','lbox2'));
  };
  F.module=()=>{
    const mod=(x,title,live)=>rect(x,40,180,200,'lbox')+text(x+90,62,title,'lh')
      +line(x+30,90,x+150,90,'lred')+[0,1,2].map(k=>circ(x+30+k*60,90,9,'ljack r')).join('')
      +line(x+30,214,x+150,214,'lblue')+[0,1,2].map(k=>circ(x+30+k*60,214,9,'ljack b')).join('')
      +(live?'':rect(x+4,74,172,156,'ldead',show('U'))+text(x+90,158,'전기 없음','lt lbad','middle',show('U')));
    return sv(560,300,mod(30,'전원 모듈',true)+mod(330,'스위치 모듈',false)
      +path('M180,90C250,20 300,20 360,90','lwire r',show('!U'))+path('M180,214C250,280 300,280 360,214','lwire b',show('!U'))
      +flow('M180,90C250,20 300,20 360,90','!U')
      +text(270,150,'기본 전원 선','ls')+tap(270,184,'U','선 빼기 / 꽂기',120)
      +text(280,290,'같은 줄의 잭은 모듈 안에서 이미 이어져 있어요 (빨간 줄끼리, 파란 줄끼리)','ls'));
  };
  F.colors=()=>sv(560,260,circ(80,60,10,'ljack r')+text(80,90,'+24V','ls')+circ(300,60,10,'ljack k')+text(300,90,'PB1 13','ls')
    +path('M80,60C150,10 230,10 300,60','lwire r')+text(420,55,'+ 쪽 선: 빨강','lt','start')
    +circ(80,180,10,'ljack k')+text(80,210,'H1 −','ls')+circ(300,180,10,'ljack b')+text(300,210,'0V','ls')
    +path('M80,180C150,230 230,230 300,180','lwire b')+text(420,175,'− 쪽 선: 파랑','lt','start')+text(420,197,'(또는 검정)','ls','start')
    +text(280,250,'잭에서 잭으로 끌어 놓으면 선이 생기고, 선을 두 번 클릭하면 지워져요','ls'));

  /* ---------- 3. 스위치 ---------- */
  const pbFig=(nc)=>sv(560,300,rails(560)+dot(220,40)+dot(220,260)+line(220,40,220,90)
    +(nc?cNC(220,110,'P'):cNO(220,110,'P'))+text(196,95,nc?'11':'13','ls','end')+text(196,135,nc?'12':'14','ls','end')
    +line(220,130,220,172)+lamp(220,190,nc?'!P':'P','H1')+line(220,208,220,260)
    +flow('M220,40V172M220,208V260',nc?'!P':'P')
    +hold(420,110,'P','PB1 누르기')+text(420,160,nc?'NC (b접점) 11-12':'NO (a접점) 13-14','lh')
    +say(420,186,'P',nc?'눌렀더니 끊겼어요':'누르는 동안 연결!')+say(420,186,'!P',nc?'평소엔 연결되어 있어요':'평소엔 열려 있어요'));
  F.pbNO=()=>pbFig(false);
  F.pbNC=()=>pbFig(true);
  F.pbBoth=()=>sv(560,300,rails(560)+dot(160,40)+dot(160,260)+dot(330,40)+dot(330,260)
    +line(160,40,160,90)+cNO(160,110,'P')+text(160,22+50,'NO 13-14','ls')+line(160,130,160,172)+lamp(160,190,'P','H1')+line(160,208,160,260)
    +line(330,40,330,90)+cNC(330,110,'P')+text(330,72,'NC 11-12','ls')+line(330,130,330,172)+lamp(330,190,'!P','H2')+line(330,208,330,260)
    +path('M150,110H330','ldash')+flow('M160,40V172M160,208V260','P')+flow('M330,40V172M330,208V260','!P')
    +hold(470,150,'P','PB1 누르기',100)+text(245,290,'점선 = 같은 버튼 안의 두 접점 (함께 움직여요)','ls'));

  /* ---------- 4. 직렬과 병렬 ---------- */
  F.series=()=>sv(560,300,rails(560)+dot(220,40)+dot(220,260)+line(220,40,220,60)
    +cNO(220,80,'A','A')+line(220,100,220,120)+cNO(220,140,'B','B')+line(220,160,220,178)+lamp(220,196,'A&B','H1')+line(220,214,220,260)
    +flow('M220,40V178M220,214V260','A&B')
    +tap(410,90,'A','A 켜기/끄기')+tap(410,140,'B','B 켜기/끄기')
    +say(410,196,'A&B','둘 다 닫혀서 켜짐')+say(410,196,'!(A&B)','둘 다 닫혀야 켜져요'));
  F.parallel=()=>sv(560,300,rails(560)+dot(220,40)+dot(220,260)+line(220,40,220,70)+dot(220,70)
    +path('M220,70H170V90M220,70H270V90')+cNO(170,110,'A','A')+cNO(270,110,'B','B')
    +path('M170,130V150H270V130')+dot(220,150)+line(220,150,220,178)+lamp(220,196,'A|B','H1')+line(220,214,220,260)
    +flow('M220,40V70H170V150H220','A')+flow('M220,70H270V150H220','B')+flow('M220,150V178M220,214V260','A|B')
    +tap(420,90,'A','A 켜기/끄기')+tap(420,140,'B','B 켜기/끄기')
    +say(420,196,'A|B','하나만 닫혀도 켜짐')+say(420,196,'!(A|B)','둘 중 하나만 닫혀도 켜져요'));
  F.parjack=()=>{
    const blk=(x,title,a,b)=>rect(x,90,150,140,'lbox')+text(x+75,112,title,'lh')+circ(x+75,140,10,'ljack k')+text(x+92,145,a,'ls','start')+circ(x+75,200,10,'ljack k')+text(x+92,205,b,'ls','start');
    const badge=(x,y)=>circ(x,y,8,'lbadge')+text(x,y+4,'2','lbadge-t');
    return sv(560,320,blk(60,'PB1 (NO)','13','14')+blk(330,'K1 접점','11','14')
      +circ(135,30,10,'ljack r')+text(152,35,'+24V','ls','start')+path('M135,30V140','lwire r')
      +path('M135,140C200,60 340,60 405,140','lwire r')+badge(149,128)
      +path('M135,200C140,270 220,288 270,290','lwire r')+path('M405,200C400,270 320,288 270,290','lwire r')
      +circ(270,290,10,'ljack k')+badge(284,278)
      +text(52,145,'갈라지는 점','ls lgood','end')+text(52,162,'(13번에 선 2개)','ls lgood','end')
      +text(300,312,'합쳐지는 점: K1 A1(코일 +)에 선 2개','ls lgood','start'));
  };
  F.ladderpar=()=>sv(560,300,rails(560)+dot(200,40)+dot(200,260)+line(200,40,200,60)
    +cNO(200,80,'0','PB1')+line(200,100,200,120)+dot(200,58)+dot(200,124)
    +path('M200,58H260V70')+cNO(260,90,'0','K1')+path('M260,110V124H200')
    +line(200,120,200,182)+coil(200,200,'0','K1')+line(200,211,200,260)
    +text(320,90,'← 옆가지 = 병렬','lt','start')+text(320,112,'(PB1과 K1 접점 중 하나만','ls','start')+text(320,130,' 닫혀도 코일에 전기가 가요)','ls','start'));

  /* ---------- 5. 릴레이 ---------- */
  F.relay=()=>sv(560,300,rails(560)+dot(160,40)+dot(160,260)+line(160,40,160,90)+cNO(160,110,'P','PB1')+line(160,130,160,184)+coil(160,195,'P','K1 코일')+line(160,206,160,260)
    +flow('M160,40V184M160,206V260','P')
    +dot(360,40)+dot(360,260)+line(360,40,360,90)+cNO(360,110,'P','K1 접점')+line(360,130,360,172)+lamp(360,190,'P','H1')+line(360,208,360,260)
    +flow('M360,40V172M360,208V260','P')+path('M190,195C260,195 300,110 348,110','ldash')
    +hold(480,150,'P','PB1 누르기',100)+text(260,290,'코일이 켜지면(여자) → 같은 이름의 접점이 바뀌어요','ls'));
  F.relayc=()=>sv(560,300,rect(40,60,140,120,'lcoil')+rect(40,60,140,120,'lcoil on',show('K'))+text(110,110,'코일','lh')+text(110,132,'A1 · A2','ls')
    +say(110,156,'K','전자석 ON (여자)')+say(110,156,'!K','꺼짐 (소자)')
    +circ(300,200,10,'ljack k')+text(300,230,'11 공통','lt')+circ(250,90,10,'ljack k')+text(250,70,'12 (NC)','lt')+circ(370,90,10,'ljack k')+text(370,70,'14 (NO)','lt')
    +path('M300,190L255,100','lw lon',show('!K'))+path('M300,190L365,100','lw lon',show('K'))
    +flow('M300,200L250,90','!K')+flow('M300,200L370,90','K')
    +tap(110,230,'K','코일 켜기/끄기',130)
    +text(470,130,'꺼짐: 11–12','lt','start',show('!K'))+text(470,130,'켜짐: 11–14','lt','start',show('K'))
    +text(300,280,'접점은 4벌: 11·21·31·41이 각각의 공통이에요','ls'));

  /* ---------- 6. 솔레노이드 밸브와 실린더 ---------- */
  // 실린더(위)와 5/2 밸브(아래). Y가 켜지면 스풀이 움직여 1→4(전진), 꺼지면 1→2(후진)
  F.valve=()=>{
    const cyl=rect(120,30,220,46,'lbox')+rect(130,34,14,38,'lpiston',show('!Y'))+line(144,53,380,53,'lrod',show('!Y'))
      +rect(310,34,14,38,'lpiston',show('Y'))+line(324,53,530,53,'lrod',show('Y'))+text(230,22,'실린더','ls');
    const ports=path('M150,76V112M310,76V112')+text(140,100,'후방','ls','end')+text(320,100,'전방','ls','start')
      +path('M150,112H215V130M310,112H245V130')+text(212,126,'4','ls','end')+text(250,126,'2','ls','start');
    // 밸브 칸 두 개: 오른쪽 칸(평상시: 1→2, 4→배기), 왼쪽 칸(여자: 1→4, 2→배기). 연결된 칸을 포트 위(200~260)에 놓는다
    const boxes=(x)=>rect(x,130,60,50,'lbox')+rect(x+60,130,60,50,'lbox')
      +path(`M${x+30},180L${x+15},134`,'larr')+path(`M${x+45},130L${x+52},176`,'larr')
      +path(`M${x+90},180L${x+105},134`,'larr')+path(`M${x+75},130L${x+68},176`,'larr');
    return sv(560,300,cyl+ports+g(show('!Y'),boxes(140))+g(show('Y'),boxes(200))
      +path('M230,180V212')+path('M230,212l-8,14h16z','lfillk')+text(244,224,'1 (공급)','ls','start')
      +rect(100,140,34,30,'lcoil')+rect(100,140,34,30,'lcoil on',show('Y'))+text(92,160,'Y1','lt','end')
      +flow('M230,214V180M245,130V112H310V76','!Y')+flow('M230,214V180M215,130V112H150V76','Y')
      +hold(440,160,'Y','Y1 켜기',100)
      +say(440,210,'!Y','꺼짐: 1→2, 후진')+say(440,210,'Y','켜짐: 1→4, 전진')
      +text(280,290,'칸 두 개 중 포트 위에 놓인 칸의 화살표대로 공기가 흘러요','ls'));
  };
  F.sol2=()=>sv(560,250,text(150,40,'편솔 (솔레노이드 1개 + 스프링)','lh')+rect(60,70,80,30,'lbox')+rect(140,70,80,30,'lbox')+rect(30,75,30,20,'lcoil')+path('M220,85l5,-8l8,16l8,-16l5,8')
    +text(150,130,'전기가 끊기면 스프링이 원래대로 → 후진','ls')+text(150,150,'그래서 누르고 있어야 하거나 자기유지가 필요','ls')
    +text(420,40,'양솔 (솔레노이드 2개)','lh')+rect(340,70,80,30,'lbox')+rect(420,70,80,30,'lbox')+rect(310,75,30,20,'lcoil')+rect(500,75,30,20,'lcoil')
    +text(420,130,'마지막으로 켜진 쪽을 기억해요','ls')+text(420,150,'Y1 잠깐 → 전진 유지, Y2 잠깐 → 후진 유지','ls')
    +text(280,210,'둘이 동시에 켜지면 움직이지 않아요 (먼저 끊어 줘야 해요)','ls lbad'));

  /* ---------- 7. 전기회로도 읽는 법 ---------- */
  const m3=(lab)=>rails(560)+dot(160,40)+dot(160,260)+line(160,40,160,90)+cNO(160,110,'0','PB1')+line(160,130,160,184)+coil(160,195,'0','K1')+line(160,206,160,260)
    +dot(330,40)+dot(330,260)+line(330,40,330,90)+cNO(330,110,'0','K1')+line(330,130,330,184)+rect(313,184,34,22,'lcoil')+line(313,206,347,184)+text(356,200,'Y1','lt','start')+line(330,206,330,260)+lab;
  F.ladder=()=>sv(560,300,m3(path('M150,62V240','lhint')+text(120,150,'한 줄','ls lgood','end')+text(120,168,'(위→아래)','ls lgood','end')
    +text(480,110,'접점 (조건)','ls','start')+text(480,195,'부하 (일하는 것)','ls','start')+path('M470,110H380M470,195H400','ldash')));
  F.symbols=()=>{
    const cell=(i,draw,name)=>{const x=40+(i%4)*130,y=40+Math.floor(i/4)*130;return rect(x,y,110,110,'lbox')+draw(x+55,y+50)+text(x+55,y+100,name,'ls');};
    return sv(560,300,
      cell(0,(x,y)=>cNO(x,y,'0'),'a접점 (NO)')+cell(1,(x,y)=>cNC(x,y,'0'),'b접점 (NC)')
      +cell(2,(x,y)=>cNO(x,y,'0')+line(x-6,y,x-22,y,'ldash')+path(`M${x-22},${y-6}V${y+6}`),'누름버튼')
      +cell(3,(x,y)=>cNO(x,y,'0')+line(x-6,y,x-20,y)+circ(x-24,y,4),'리밋스위치')
      +cell(4,(x,y)=>coil(x,y,'0'),'릴레이 코일')
      +cell(5,(x,y)=>rect(x-17,y-11,34,22,'lcoil')+line(x-17,y+11,x+17,y-11),'솔레노이드')
      +cell(6,(x,y)=>lamp(x,y,'0'),'램프')
      +cell(7,(x,y)=>rect(x-16,y-18,32,36,'lbox')+path(`M${x},${y-12}L${x+8},${y-4}L${x},${y+4}L${x-8},${y-4}Z`),'센서 (3선식)'));
  };
  F.map=()=>sv(560,300,m3(text(80,110,'PB1 13·14','ls lgood','end')+text(120,232,'K1 A1·A2','ls lgood','end')
    +text(400,110,'K1 11·14 (또는 21·24…)','ls lgood','start')+text(400,232,'밸브 Y1 +·−','ls lgood','start')+path('M84,106H130','ldash')+path('M122,228H140V206','ldash')+path('M396,106H350','ldash')+path('M396,228H370V206','ldash')));

  /* ---------- 8. 센서와 리밋스위치 ---------- */
  F.limit=()=>sv(560,300,rect(40,60,180,40,'lbox')+line(220,80,300,80,'lrod',show('!R'))+line(220,80,352,80,'lrod',show('R'))
    +text(130,50,'실린더','ls')+circ(360,96,8)+line(360,104,360,130)+rect(340,130,40,40,'lbox')+text(400,155,'LS','lt','start')
    +circ(300,240,10,'ljack k')+text(300,270,'1 공통','ls')+circ(240,200,10,'ljack k')+text(240,190,'2 (NC)','ls','end')+circ(370,200,10,'ljack k')+text(390,195,'4 (NO)','ls','start')
    +path('M300,230L245,206','lw lon',show('!R'))+path('M300,230L365,206','lw lon',show('R'))
    +tap(130,160,'R','막대 밀기/당기기',140)+say(130,200,'R','롤러가 눌림: 1–4 연결')+say(130,200,'!R','안 눌림: 1–2 연결'));
  F.sensor3=()=>sv(560,300,rails(560)+rect(150,110,60,60,'lbox')+path('M180,122L192,134L180,146L168,134Z')+text(180,190,'센서','ls')
    +dot(180,40)+line(180,40,180,110,'lwire br')+text(190,80,'갈색 +24V','ls','start')
    +path('M160,170V260','lwire b')+dot(160,260)+text(150,230,'청색 0V','ls','end')
    +path('M200,170V200H330V214','lwire k')+text(265,195,'흑색 출력','ls')+coil(330,225,'N','K2')+line(330,236,330,260)+dot(330,260)
    +flow('M200,170V200H330V214','N')+circ(230,140,12,'lobj',show('N'))
    +tap(450,120,'N','물체 가까이/멀리',140)+say(450,170,'N','감지! 흑색 선에서 +24V가 나와요')+say(450,170,'!N','감지 안 함: 출력 없음'));
  F.ends=()=>sv(560,220,rect(60,70,220,50,'lbox')+rect(70,74,14,42,'lpiston')+line(84,95,300,95,'lrod')
    +path('M300,140V160')+text(300,180,'A− (후진 끝)','lt')+path('M470,140V160')+text(470,180,'A+ (전진 끝)','lt')+path('M310,95H460','ldash')+path('M450,89L462,95L450,101','lw')
    +text(280,40,'센서 위치는 실린더 막대 끝이 닿는 곳으로 말해요','ls'));

  return F;
})();
