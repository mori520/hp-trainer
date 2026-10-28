/* 시연: 튜토리얼 단계 데이터만 읽어 자동으로 끝까지 해낼 수 있는지 (엔진만으로, 화면 없이) */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {get}=load();
const MISSIONS=get('MISSIONS'), LAYOUTS=get('LAYOUTS'), DEMO=get('DEMO');

// 앱과 같은 순서: 판 만들기 → 빈 판(기본 전원 선) → 계획 → 매 프레임 tick + stepWorld
function play(mis,auto,speed=1){
  const L=LAYOUTS[mis.layout];
  get('configure')({parts:get('makeParts')(L,mis.board||{})});
  get('buildScene')(get('LAYOUT').parts,L.board);
  const w=get('newWorld')(get('withJumpers')(L,{wires:[],hoses:[],set:Object.assign({},mis.set)}));
  const plan=DEMO.plan(mis,get('JACKS'),w.wires.concat(w.hoses));
  const r=DEMO.start(mis,plan), c={color:'red',auto,quiz:false,plugged:false}, seen=[];
  const dt=1/30;
  for(let t=0;t<900&&!r.done&&!r.fail;t+=dt){
    DEMO.tick(r,w,c,dt*speed,(k,v)=>seen.push(k),dt);
    get('stepWorld')(w,dt);
    if(w.events.length)r.fail='합선: '+r.i;
  }
  return{r,w,plan,seen};
}

for(const mis of MISSIONS.filter(m=>(m.steps||[]).length)){
  test(`${mis.id} 시연이 튜토리얼을 끝까지 해낸다`,()=>{
    const {r,w}=play(mis,true);
    assert.equal(r.fail,'');
    assert.ok(r.done,`${r.i+1}단계에서 멈춤`);
    // 시연이 그은 선만으로도 채점을 통과해야 한다 (채점이 있는 미션)
    if(mis.grading){
      const res=JSON.parse(JSON.stringify(get('gradeMission')(mis,{wires:w.wires,hoses:w.hoses,set:w.set,pw:1})));
      assert.deepEqual(res.filter(x=>!x.ok).map(x=>x.name),[]);
    }
  });
}

test('4배속으로 봐도 끝까지 간다 (누르는 시간은 실제 시간)',()=>{
  for(const mis of MISSIONS.filter(m=>(m.steps||[]).length)){
    const {r}=play(mis,true,4);
    assert.ok(r.done&&!r.fail,mis.id+' '+r.fail);
  }
});

test('자동 색을 끈 경우에도 색 고르기 단계를 직접 해 가며 끝까지 간다',()=>{
  for(const id of ['m0','m3']){
    const {r,seen}=play(MISSIONS.find(m=>m.id===id),false);
    assert.ok(r.done&&!r.fail,id+' '+r.fail);
    assert.ok(seen.includes('color'));
  }
});

test('묶음 잭은 반대쪽 끝에서 가까운 빈 잭, 호스 포트는 겹치지 않게 고른다',()=>{
  const mis=MISSIONS.find(m=>m.id==='m4');
  const {plan}=play(mis,true);
  const hoses=plan.filter(p=>p.do==='hose').flatMap(p=>[p.a,p.b]);
  assert.equal(new Set(hoses).size,hoses.length);
  const wires=plan.filter(p=>p.do==='wire');
  assert.ok(wires.every(p=>!p.a.startsWith('group:')&&!p.b.startsWith('group:')));
  // m4: PB1 탭(누르고 떼기), PB2 탭
  const st=JSON.parse(JSON.stringify(plan.filter(p=>p.do==='state').map(p=>p.acts)));
  assert.deepEqual(st.at(-2),[{tap:'PB1'}]);
  assert.deepEqual(st.at(-1),[{tap:'PB2'}]);
  // m1: 누른 채로 → 떼기
  const p1=JSON.parse(JSON.stringify(play(MISSIONS.find(m=>m.id==='m1'),true).plan.filter(p=>p.do==='state').map(p=>p.acts)));
  assert.deepEqual(p1.slice(-2),[[{press:'PB1'}],[{release:'PB1'}]]);
});
