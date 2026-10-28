/* 5/2 밸브: 편솔(valve52s, 스프링 복귀)과 양솔(valve52d, 기억형)
   포트 1(공급) 2·4(출력) 3·5(배기). 위치 1 = 왼쪽 칸(1→4, 2→3), 위치 0 = 오른쪽 칸(1→2, 4→5)
   솔레노이드 잭: 왼쪽 a(<id>_Ya_p/n), 양솔은 오른쪽 b(<id>_Yb_p/n). 이름(Y1…)은 배치 순서로 정해진다 */
function valve52(double){
  return{
    name:double?'5/2 양솔 밸브':'5/2 편솔 밸브',
    solCount:double?2:1,
    loads:p=>p.sols.map((name,k)=>({name,a:p.id+'_Y'+'ab'[k]+'_p',b:p.id+'_Y'+'ab'[k]+'_n',sol:true})),
    init(p,w){w.valve[p.id]=0;},
    update(p,w,on){
      const a=on[p.sols[0]];
      if(!double){w.valve[p.id]=a?1:0;return;}
      const b=on[p.sols[1]];
      if(a&&!b)w.valve[p.id]=1; else if(b&&!a)w.valve[p.id]=0;   // 둘 다 꺼지면 마지막 위치 유지
    },
    pneu(p,w,u){
      const v=n=>p.id+'_'+n;
      if(w.valve[p.id]){u.u(v(1),v(4));u.u(v(2),'EX');}else{u.u(v(1),v(2));u.u(v(4),'EX');}
    },
    draw(p){
      const [x,y]=p.at, W=400, id=p.id;
      const vg=el('g',{},G);
      el('rect',{x,y,width:W,height:200,rx:6,class:'panel'},vg);
      tx(double?'5/2 양솔 밸브':'5/2 편솔 밸브',{x:x+14,y:y+22,class:'ptitle'},vg);
      // 종류 교체 버튼
      const sw=el('g',{class:'swap',tabindex:0,role:'button','aria-label':'밸브 종류 교체'},vg);
      sw.dataset.slot=p.slot;
      el('rect',{x:x+W-100,y:y+7,width:90,height:22,rx:5},sw);
      tx('⇄ 종류 교체',{x:x+W-55,y:y+22,'text-anchor':'middle'},sw);
      // 솔레노이드 잭 (왼쪽 a, 양솔이면 오른쪽 b)
      const sa=p.sols[0];
      ejack(id+'_Ya_p',x+34,y+82,'red',vg,sa+' +',0,-16);
      ejack(id+'_Ya_n',x+34,y+132,'blue',vg,sa+' −',0,26);
      p.r.led=[el('circle',{cx:x+64,cy:y+108,r:5,class:'led'},vg)];
      if(double){
        const sb=p.sols[1];
        ejack(id+'_Yb_p',x+376,y+82,'red',vg,sb+' +',0,-16);
        ejack(id+'_Yb_n',x+376,y+132,'blue',vg,sb+' −',0,26);
        p.r.led.push(el('circle',{cx:x+352,cy:y+108,r:5,class:'led'},vg));
      }
      // 고정 포트 선
      [[198,36,198,62],[232,36,232,62],[215,112,215,158],[190,112,190,124],[240,112,240,124]].forEach(([a,b,c,d])=>el('line',{x1:x+a,y1:y+b,x2:x+c,y2:y+d,class:'sym'},vg));
      [[190,124],[240,124]].forEach(([a,b])=>el('path',{d:`M${x+a-6},${y+b} L${x+a+6},${y+b} L${x+a},${y+b+8} z`,class:'sym'},vg));
      pport(id+'_4',x+198,y+36,'up',vg,'4',-18,4);
      pport(id+'_2',x+232,y+36,'up',vg,'2',18,4);
      pport(id+'_1',x+215,y+158,'down',vg,'1',-18,4);
      tx('3',{x:x+254,y:y+130,class:'psmall'},vg); tx('5',{x:x+174,y:y+130,class:'psmall'},vg);
      // 스풀(심볼) — 위치 0이면 오른쪽 칸이 포트에 정렬
      const sp=p.r.spool=el('g',{class:'spool'},vg);
      const L=x+180,T=y+62,B=y+112;
      el('rect',{x:L-70,y:T,width:70,height:50,fill:'none',class:'sym'},sp);
      el('rect',{x:L,y:T,width:70,height:50,fill:'none',class:'sym'},sp);
      // 왼쪽 칸: 1→4, 2→3
      el('line',{x1:L-70+35,y1:B,x2:L-70+18,y2:T+2,class:'sym','marker-end':'url(#ah)'},sp);
      el('line',{x1:L-70+52,y1:T,x2:L-70+60,y2:B-2,class:'sym','marker-end':'url(#ah)'},sp);
      el('line',{x1:L-70+6,y1:B-8,x2:L-70+14,y2:B-8,class:'sym'},sp);
      // 오른쪽 칸: 1→2, 4→5
      el('line',{x1:L+35,y1:B,x2:L+52,y2:T+2,class:'sym','marker-end':'url(#ah)'},sp);
      el('line',{x1:L+18,y1:T,x2:L+10,y2:B-2,class:'sym','marker-end':'url(#ah)'},sp);
      el('line',{x1:L+56,y1:B-8,x2:L+64,y2:B-8,class:'sym'},sp);
      // 왼쪽 솔레노이드
      el('rect',{x:L-96,y:T+10,width:26,height:30,fill:'none',class:'sym'},sp);
      el('line',{x1:L-92,y1:T+36,x2:L-74,y2:T+14,class:'sym'},sp);
      // 오른쪽: 양솔이면 솔레노이드, 편솔이면 스프링
      if(double){
        el('rect',{x:L+70,y:T+10,width:26,height:30,fill:'none',class:'sym'},sp);
        el('line',{x1:L+74,y1:T+36,x2:L+92,y2:T+14,class:'sym'},sp);
      }else el('path',{d:`M${L+70},${T+25} l6,-8 l8,16 l8,-16 l8,16 l6,-8`,class:'sym'},sp);
    },
    render(p,w){
      p.r.spool.style.transform=w.valve[p.id]?'translateX(70px)':'translateX(0)';
      p.sols.forEach((name,k)=>p.r.led[k].classList.toggle('sol',w.out[name]));
    }
  };
}
PARTS.valve52s=valve52(false);
PARTS.valve52d=valve52(true);
