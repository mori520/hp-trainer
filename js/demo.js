/* ===================== 시연 (자동 재생) — 화면 없이 도는 부분 =====================
   튜토리얼 단계(미션 데이터 steps)를 그대로 읽어 한 단계씩 "직접 해 보이는" 재생기.
   DOM을 쓰지 않는다 → 테스트가 엔진(stepWorld)만으로 모든 튜토리얼을 끝까지 돌려 본다. 화면 쪽은 demo-ui.js.

   단계마다 할 일(DEMO.plan):
   - wire / hose : 정해진 두 잭을 잇는다. "group:rail24"처럼 묶음이면 반대쪽 끝에서 가장 가까운 빈 잭
   - done.color  : 툴바 색 고르기 (자동 색이 켜져 있으면 건너뜀)
   - done.setting: 설정값 맞추기 / done.quiz: 정답 고르기
   - done.state  : expect를 보고 정한다. power·air 켜기/끄기, 누름버튼 true면 누른 채로 / false면 떼기,
                   유지형 스위치(비상정지)는 그 상태로. expect에 없는 버튼이 hl("@PB1btn")에 있으면 잠깐 눌렀다 떼기(탭)
   판단이 애매한 단계는 단계 데이터에 "demo":{"tap":"PB1"} / {"hold":"PB1"} / {"release":"PB1"} 을 적어 정한다.

   재생(DEMO.start → 매 프레임 DEMO.tick): 단계마다 쉬기 → 하기(선은 그어지는 모습 anim) → 완료 조건이 될 때까지 기다리기 → 보여 주기.
   탭했는데 조건이 안 되면 잠시 뒤 다시 탭(최대 6번). 너무 오래 안 되면 fail에 이유를 남기고 멈춘다. */

// 잭 지정: "group:이름"이면 JACK_GROUPS의 묶음, 아니면 잭 id 그대로 (튜토리얼과 같은 규칙)
function jackMatch(spec,id){if(spec.startsWith('group:'))return JACK_GROUPS[spec.slice(6)](id);return spec===id;}
function wiresBetween(list,A,B){return list.filter(x=>(jackMatch(A,x.a)&&jackMatch(B,x.b))||(jackMatch(A,x.b)&&jackMatch(B,x.a)));}
// 튜토리얼 단계 완료 판정. c = {color: 툴바 색, auto: 자동 색 켜짐, quiz: 오류 찾기 맞힘}
function tutStepDone(s,w,c){
  if(s.wire){const[A,B,col]=s.wire;return wiresBetween(w.wires,A,B).some(x=>col==='red'?x.color==='red':x.color!=='red');}
  if(s.hose)return wiresBetween(w.hoses,s.hose[0],s.hose[1]).length>0;
  const d=s.done;
  if(d.type==='color')return c.auto||(d.is?c.color===d.is:c.color!==d.not);   // 자동 색이면 색 고르기 단계는 건너뜀
  if(d.type==='state')return Object.keys(d.expect).every(k=>expectOk(w,k,d.expect[k]));
  if(d.type==='setting')return Math.abs((w.set[d.name]||0)-d.value)<1e-6;   // 타이머·카운터 설정값
  if(d.type==='quiz')return c.quiz;   // 오류 찾기 문제를 맞힘
  return false;
}

const DEMO={
  T:{pre:.7,draw:.8,gap:.35,tap:.9,retry:4,post:.6,postState:1.4,limit:40},   // 걸리는 시간(초, 1배속)
  // 단계 목록 → 할 일 목록. jacks: 잭 위치(JACKS), used: 이미 꽂힌 선·호스
  plan(mis,jacks,used){
    const taken=new Set((used||[]).flatMap(x=>[x.a,x.b]));
    const dist=(a,b)=>Math.hypot(jacks[a].x-jacks[b].x,jacks[a].y-jacks[b].y);
    const pick=(spec,other,hose)=>{
      if(!spec.startsWith('group:'))return spec;
      const all=Object.keys(jacks).filter(id=>jackMatch(spec,id));
      const free=all.filter(id=>!taken.has(id)), from=hose?free:(free.length?free:all);
      const ref=other&&jacks[other]?other:null;
      return from.slice().sort((a,b)=>ref?dist(a,ref)-dist(b,ref):0)[0];
    };
    const ends=(A,B,hose)=>{
      const a0=A.startsWith('group:')?null:A, b0=B.startsWith('group:')?null:B;
      const a=pick(A,b0,hose), b=pick(B,a0||a,hose);taken.add(a);taken.add(b);return[a,b];
    };
    const toggles=new Set(LAYOUT.toggles), held=new Set(), on={};
    return (mis.steps||[]).map(s=>{
      if(s.wire){const[a,b]=ends(s.wire[0],s.wire[1]);return{do:'wire',a,b,color:s.wire[2]==='red'?'red':'blue'};}
      if(s.hose){const[a,b]=ends(s.hose[0],s.hose[1],true);return{do:'hose',a,b};}
      const d=s.done;
      if(d.type==='color')return{do:'color',color:d.is||(d.not==='red'?'blue':'red')};
      if(d.type==='setting')return{do:'set',name:d.name,value:d.value};
      if(d.type==='quiz')return{do:'quiz',answer:mis.quiz?mis.quiz.answer:0};
      const acts=[],ex=d.expect,dm=s.demo||{};
      if('power' in ex)acts.push({power:ex.power});
      if('air' in ex)acts.push({air:ex.air});
      if(dm.release){acts.push({release:dm.release});held.delete(dm.release);}
      for(const k in ex){
        if(!LAYOUT.pbs.includes(k)&&!toggles.has(k))continue;   // 램프·실린더 같은 결과는 기다리기만
        if(toggles.has(k)){if(!!on[k]!==ex[k]){acts.push({toggle:k});on[k]=ex[k];}}
        else if(ex[k]&&!held.has(k)){acts.push({press:k});held.add(k);}
        else if(!ex[k]&&held.has(k)){acts.push({release:k});held.delete(k);}
      }
      if(dm.hold&&!held.has(dm.hold)){acts.push({press:dm.hold});held.add(dm.hold);}
      if(dm.tap)acts.push({tap:dm.tap});
      else if(!dm.hold)(s.hl||[]).forEach(h=>{
        const b=(h.match(/^@(\w+)btn$/)||[])[1];if(!b||held.has(b)||acts.some(a=>a.press===b||a.release===b))return;
        if(toggles.has(b)){if(!(b in ex)){acts.push({toggle:b});on[b]=!on[b];}}
        else acts.push({tap:b});
      });
      return{do:'state',acts};
    });
  },
  start(mis,plan){return{mis,plan,i:0,phase:'pre',t:0,sub:0,taps:0,lastTap:0,timers:[],anim:null,fail:'',done:false};},
  // 시간을 dt(초)만큼 진행한다. w: 트레이너 상태, c: tutStepDone의 c, fx(종류, 값): 화면 쪽 알림 (선 추가·색·플러그·문제 정답)
  tick(r,w,c,dt,fx){
    const T=DEMO.T, step=r.mis.steps[r.i], act=r.plan[r.i];
    r.timers=r.timers.filter(x=>{x.t-=dt;if(x.t>0)return true;x.fn();return false;});
    if(r.done||r.fail)return;
    r.t+=dt;
    const next=ph=>{r.phase=ph;r.t=0;};
    const press=(b,v)=>{w.pb[b]=v;fx('pb',b);};
    // 지켜보기만 하는 단계(할 일 없는 state, 예: "B가 전진합니다"): 기계가 계속 움직이므로 쉬지 않고 바로 확인
    const watch=a=>a&&a.do==='state'&&!a.acts.length;
    if(r.phase==='pre'){
      if(act.do==='color'&&c.auto)return next('post');   // 자동 색이면 색 고르기는 할 필요 없음
      if(r.t>=(watch(act)?0:T.pre)){next('act');r.sub=0;}
      return;
    }
    if(r.phase==='act'){
      if(act.do==='wire'||act.do==='hose'){
        r.anim={a:act.a,b:act.b,p:Math.min(1,r.t/T.draw),hose:act.do==='hose'};
        if(r.t<T.draw)return;
        r.anim=null;
        const id='d'+(r.i+1);
        if(act.do==='wire')w.wires.push({id,a:act.a,b:act.b,color:act.color});else w.hoses.push({id,a:act.a,b:act.b});
        fx('conn');return next('wait');
      }
      if(act.do==='color'){c.color=act.color;fx('color',act.color);return next('wait');}
      if(act.do==='set'){w.set[act.name]=act.value;fx('set',act.name);return next('wait');}
      if(act.do==='quiz'){c.quiz=true;fx('quiz',act.answer);return next('wait');}
      // state: 하위 동작을 T.gap 간격으로 하나씩
      if(r.t<T.gap*r.sub)return;
      const a=act.acts[r.sub++];
      if(a){
        if('power' in a){if(a.power&&!c.plugged){c.plugged=true;fx('plug');}w.power=a.power;fx('power');}
        else if('air' in a){w.air=a.air;fx('air');}
        else if(a.press)press(a.press,true);
        else if(a.release)press(a.release,false);
        else if(a.toggle)press(a.toggle,!w.pb[a.toggle]);
        else if(a.tap){press(a.tap,true);r.taps=1;r.lastTap=0;r.tapBtn=a.tap;r.timers.push({t:T.tap,fn:()=>press(a.tap,false)});}
        return;
      }
      return next('wait');
    }
    if(r.phase==='wait'){
      if(tutStepDone(step,w,c))return next('post');
      if(act.do==='state'&&r.tapBtn){
        r.lastTap+=dt;
        if(r.lastTap>=T.retry&&r.taps<6){const b=r.tapBtn;press(b,true);r.taps++;r.lastTap=0;r.timers.push({t:T.tap,fn:()=>press(b,false)});}
      }
      if(r.t>T.limit)r.fail=`${r.i+1}단계에서 기다려도 조건이 맞지 않아요: ${step.t.replace(/<[^>]+>/g,'')}`;
      return;
    }
    if(r.phase==='post'){
      if(r.t<(watch(r.plan[r.i+1])?0:act.do==='state'?T.postState:T.post))return;
      r.tapBtn=null;r.i++;
      if(r.i>=r.plan.length){r.done=true;return;}
      next('pre');
    }
  },
  // 끝: 누르고 있던 버튼을 모두 뗀다
  releaseAll(w){for(const k in w.pb)if(LAYOUT.pbs.includes(k))w.pb[k]=false;}
};
