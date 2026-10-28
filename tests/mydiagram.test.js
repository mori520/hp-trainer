/* 내 회로 도면 그리기 검사: 꽂은 호스만큼 선이 그려지고, 빈 포트는 표시되고, 머문 시간은 칸으로 들어간다 */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');

const {get}=load();
const MYD=get('MYD');
function parts(id){
  const mis=get('MISSIONS').find(m=>m.id===id);
  get('configure')({parts:get('makeParts')(get('LAYOUTS')[mis.layout],mis.board)});
  return get('LAYOUT').parts;
}
const info={set:{SU:0.5,F1:4},leak:false,valve:{}};
const count=(s,re)=>(s.match(re)||[]).length;

test('공기압회로도: 호스마다 선 하나, 빈 포트는 빈 동그라미',()=>{
  const p=parts('m8');
  const full=MYD.pneu(p,[{a:'D1',b:'V1_1'},{a:'V1_4',b:'A_cap'},{a:'V1_2',b:'A_rod'},{a:'D2',b:'V2_1'},{a:'V2_4',b:'B_cap'},{a:'V2_2',b:'B_rod'}],info);
  assert.equal(count(full,/class="hose"/g),6);
  assert.doesNotMatch(full,/빈 포트/);
  const half=MYD.pneu(p,[{a:'V1_4',b:'A_cap'}],info);
  assert.equal(count(half,/class="hose"/g),1);
  assert.match(half,/빈 포트\(○\) 8개/);   // A_rod, V1_2, V1_1, B_cap, B_rod, V2_4, V2_2, V2_1
});
test('공기압회로도: 유량조절밸브·누설 표시',()=>{
  const s=MYD.pneu(parts('m13a'),[{a:'V1_4',b:'F1_1'},{a:'F1_2',b:'A_cap'}],Object.assign({},info,{leak:true}));
  assert.equal(count(s,/class="hose"/g),2);
  assert.match(s,/F1 4단/);
  assert.match(s,/공기 누설/);
});
test('변위단계선도: 두 회차 비교, 머문 시간 칸',()=>{
  const same=MYD.disp([{seq:['A+','A-']},{seq:['A+','A-']}],['A']);
  assert.match(same,/두 번 모두 같은 순서/);
  const diff=MYD.disp([{seq:['A+','A-']},{seq:['A+']}],['A']);
  assert.match(diff,/두 번의 순서가 달라요/);
  assert.match(MYD.disp([{seq:['A+','wait:3.0초','A-']}],['A']),/3\.0초/);
});

/* 전기회로도: 튜토리얼대로 배선한 회로는 모두 "확인할 곳" 없이 사다리로 정리돼야 한다 */
function tutorialWorld(mis,drop){
  const L=get('LAYOUTS')[mis.layout];parts(mis.id);get('buildScene')(get('LAYOUT').parts,L.board);
  const J=get('JACKS'),G=get('JACK_GROUPS'),pick=s=>s.startsWith('group:')?Object.keys(J).find(G[s.slice(6)]):s;
  const wires=mis.steps.filter(s=>s.wire).map((s,i)=>({id:'t'+i,a:pick(s.wire[0]),b:pick(s.wire[1]),color:s.wire[2]})).filter((_,i)=>i!==drop);
  return get('newWorld')(get('withJumpers')(L,{wires,hoses:[]}));
}
const reduce=w=>JSON.parse(JSON.stringify(MYD._reduce(get('LAYOUT'),get('PARTS'),w)));
for(const mis of get('MISSIONS').filter(m=>(m.steps||[]).some(s=>s.wire))){
  test(`전기회로도 ${mis.id}: 튜토리얼 배선이 확인할 곳 없이 정리된다`,()=>{
    const r=reduce(tutorialWorld(mis));
    assert.deepEqual(r.issues,[]);
    assert.ok(r.rungs.length>0);
  });
}
test('전기회로도: 미션 8은 6줄, 미션 12는 비상정지 아래 공통 줄 + 램프 줄',()=>{
  const m=id=>get('MISSIONS').find(x=>x.id===id);
  assert.equal(reduce(tutorialWorld(m('m8'))).rungs.length,6);
  const r12=reduce(tutorialWorld(m('m12')));
  assert.equal(r12.rungs.length,2);
  assert.equal(r12.rungs[0].n.k[0].n.el.label,'ES 11-12');
});
test('전기회로도: 선을 하나 빼면 "끊긴 줄"로 알려 준다',()=>{
  const m3=get('MISSIONS').find(x=>x.id==='m3');
  const drop=m3.steps.filter(s=>s.wire).findIndex(s=>s.wire[0]==='K1_A2');   // K1 코일 → 0V 선
  const r=reduce(tutorialWorld(m3,drop));
  // 코일 A2가 비었다는 것과, 그 때문에 PB1 줄이 0V까지 안 이어진다는 것을 함께 알려 준다
  assert.ok(r.issues.includes('K1 코일: A2번이 비어 있어요'),r.issues.join(' / '));
  assert.ok(r.issues.some(s=>s.startsWith('끊긴 줄')&&s.includes('PB1 13-14')),r.issues.join(' / '));
});
test('전기회로도: 24V와 0V를 바로 이으면 합선',()=>{
  const m0=get('MISSIONS').find(x=>x.id==='m0');
  const w=tutorialWorld(m0);w.wires.push({id:'x',a:'R24_0_2',b:'R0_0_2',color:'red'});
  assert.match(reduce(w).issues[0],/합선/);
});
test('전기회로도: 그림이 만들어진다 (접점 이름·번호)',()=>{
  const w=tutorialWorld(get('MISSIONS').find(x=>x.id==='m4'));
  const s=MYD.elec(get('LAYOUT'),get('PARTS'),w,null);
  assert.match(s,/^<svg /);assert.match(s,/PB2/);assert.match(s,/11-12/);assert.doesNotMatch(s,/확인할 곳/);
});

/* 변위단계선도 기록: 엔진을 돌리며 매 프레임 recTick */
function runRec(id,set,presses){
  const mis=get('MISSIONS').find(x=>x.id===id),L=get('LAYOUTS')[mis.layout];parts(id);get('buildScene')(get('LAYOUT').parts,L.board);
  const J=get('JACKS'),G=get('JACK_GROUPS'),pick=s=>s.startsWith('group:')?Object.keys(J).find(G[s.slice(6)]):s;
  const w=get('newWorld')(get('withJumpers')(L,{wires:mis.steps.filter(s=>s.wire).map((s,i)=>({id:'t'+i,a:pick(s.wire[0]),b:pick(s.wire[1]),color:s.wire[2]})),
    hoses:mis.steps.filter(s=>s.hose).map((s,i)=>({id:'h'+i,a:pick(s.hose[0]),b:pick(s.hose[1])})),set}));
  w.power=true;w.air=true;
  const rec=MYD.recNew(),step=sec=>{for(let t=0;t<sec;t+=0.02){get('stepWorld')(w,0.02);MYD.recTick(rec,w);}};
  step(1);
  presses.forEach(([wait])=>{w.pb.PB1=true;step(0.2);w.pb.PB1=false;step(wait);});
  return JSON.parse(JSON.stringify(rec.runs.map(MYD.recSeq).map(r=>r.seq)));
}
test('기록: 타이머로 3초 머물러도 한 회차 (A+ 3초 A−)',()=>{
  const runs=runRec('m11',{T1:3},[[8]]);
  assert.equal(runs.length,1);
  assert.equal(runs[0][0],'A+');assert.match(runs[0][1],/^wait:3\.\d초$/);assert.equal(runs[0][2],'A-');
});
test('기록: 끝나고 1초 넘게 기다렸다 다시 누르면 2회차로 나뉜다',()=>{
  const runs=runRec('m8',{},[[7],[7]]);
  assert.deepEqual(runs,[['A+','B+','B-','A-'],['A+','B+','B-','A-']]);
});
test('기록: 끝나자마자(1초 안에) 다시 누르면 한 회차로 붙는다 (그래서 안내가 필요)',()=>{
  const runs=runRec('m5',{},[[2.6],[5]]);   // m5 한 사이클 ≈2.2초 → 0.4초 쉬고 다시 누름
  assert.equal(runs.length,1);assert.deepEqual(runs[0],['A+','A-','A+','A-']);
});
