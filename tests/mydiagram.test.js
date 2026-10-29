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
test('유압회로도: 파워유닛·4/2·체크밸브·유량조절, 남는 P·T 포트는 빈 포트로 안 셈',()=>{
  const hinfo={set:{RV:4,F1:3},leak:false,valve:{}};
  const hoses=[{a:'HP1',b:'CV1_1'},{a:'CV1_2',b:'V1_P'},{a:'V1_T',b:'HT1'},{a:'V1_A',b:'F1_2'},{a:'F1_1',b:'A_cap'},{a:'V1_B',b:'A_rod'}];
  const s=MYD.pneu(parts('h4'),hoses,hinfo);
  assert.equal(count(s,/class="hose"/g),6);
  assert.doesNotMatch(s,/빈 포트/);
  assert.match(s,/릴리프 4\.0 MPa/);assert.match(s,/CV1/);assert.match(s,/F1 3단/);
  assert.match(MYD.pneu(parts('h4'),hoses.slice(0,2),hinfo),/빈 포트\(○\) 7개/);   // 밸브 T·A·B, F1 두 개, 실린더 후방·전방
  assert.match(MYD.pneu(parts('h4'),hoses,{...hinfo,leak:true}),/P→T 직결/);
});
test('유압회로도: 4/3 밸브는 칸 3개, 모터 포트 A·B',()=>{
  const s=MYD.pneu(parts('h3'),[{a:'HP1',b:'V2_P'},{a:'V2_T',b:'HT1'},{a:'V2_A',b:'M_a'},{a:'V2_B',b:'M_b'}],{set:{RV:4},leak:false,valve:{V2:1}});
  assert.equal(count(s,/class="hose"/g),4);
  assert.doesNotMatch(s,/빈 포트/);
  assert.match(s,/유압모터/);
  assert.equal(count(s,/class="w act"/g),1,'지금 칸 하나만 진하게');
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

test('유도형 센서: 공기압회로도·전기회로도에 물결 기호와 이름',()=>{
  get('configure')({parts:get('makeParts')(get('LAYOUTS').air,{cylA:'cylinder',valveA:'valve52s',S1:'indsensor:A+',S2:'A-'})});
  const P=get('LAYOUT').parts, pn=MYD.pneu(P,[],info);
  assert.match(pn,/q1\.25,-3/);assert.match(pn,/>S1</);
  const w=get('newWorld')(get('withJumpers')(get('LAYOUTS').air,{wires:[{id:'a',a:'R24_1_0',b:'S1_p',color:'red'},{id:'b',a:'S1_n',b:'R0_1_0',color:'blue'},
    {id:'c',a:'S1_out',b:'H1_p',color:'red'},{id:'d',a:'H1_n',b:'R0_2_0',color:'blue'}],hoses:[]}));
  const r=MYD._reduce(get('LAYOUT'),get('PARTS'),w);
  assert.equal(r.issues.length,0,r.issues.join(' / '));
  const s=MYD.elec(get('LAYOUT'),get('PARTS'),w,null);
  assert.match(s,/q1,-2\.5/);
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
test('유압회로도: 하중 실린더·파일럿 체크 블록·카운터밸런스·압력스위치·블리드오프 기호와 포트',()=>{
  const p=(board)=>{get('configure')({parts:get('makeParts')(get('LAYOUTS').hyd,board)});return get('LAYOUT').parts;};
  const hinfo={set:{RV:4,CB1:2,PS1:3,F1:5},leak:false,valve:{}};
  const lockHoses=[{a:'HP1',b:'V1_P'},{a:'V1_T',b:'HT1'},{a:'V1_A',b:'PC1_A1'},{a:'PC1_A2',b:'A_cap'},{a:'V1_B',b:'PC1_B1'},{a:'PC1_B2',b:'A_rod'}];
  const a=MYD.pneu(p({cylA:'cylw',valveA:'valve43a',LA:'lock'}),lockHoses,hinfo);
  assert.equal(count(a,/class="hose"/g),6);assert.doesNotMatch(a,/빈 포트/);assert.match(a,/파일럿 체크/);assert.match(a,/>W</);
  const b=MYD.pneu(p({cylA:'cylw',valveA:'valve43a',MA1:'psw',MA2:'cbv',R1:'thr'}),
    [{a:'HP1',b:'V1_P'},{a:'V1_T',b:'HT1'},{a:'V1_A',b:'PS1_a'},{a:'PS1_b',b:'A_cap'},{a:'V1_B',b:'CB1_1'},{a:'CB1_2',b:'A_rod'},{a:'HP2',b:'F1_1'},{a:'F1_2',b:'HT2'}],hinfo);
  assert.equal(count(b,/class="hose"/g),8);assert.doesNotMatch(b,/빈 포트/);
  assert.match(b,/압력스위치 3\.0/);assert.match(b,/카운터밸런스 2\.0/);assert.match(b,/F1 5단/);
});

/* 튜토리얼 순서대로 선을 하나씩 꽂으면 전기회로도가 한 칸씩 자란다 (그려진 부품 수가 줄지 않음) */
for(const id of ['m4','m9','m12']){
  test(`전기회로도 ${id}: 선을 하나씩 꽂을 때마다 도면이 자란다`,()=>{
    const mis=get('MISSIONS').find(x=>x.id===id);
    const all=mis.steps.filter(s=>s.wire).length;
    const count=n=>n.t==='el'?1:n.k.reduce((s,x)=>s+count(x.n),0);
    let prev=0,grew=0;
    for(let k=1;k<=all;k++){
      const drop=new Set([...Array(all).keys()].filter(i=>i>=k));
      const w=tutorialWorld(mis);w.wires=w.wires.filter(x=>x.base||!drop.has(+x.id.slice(1)));
      const r=reduce(w),shown=r.rungs.concat(r.partial).reduce((s,x)=>s+count(x.n),0);
      assert.ok(shown>=prev,`${k}번째 선에서 그려진 부품이 ${prev} → ${shown}로 줄어듦`);
      if(shown>prev)grew++;prev=shown;
      if(k===all)assert.equal(r.partial.length,0,'다 꽂으면 끝이 열린 줄이 없어야 함');
    }
    assert.ok(grew>=4,`도면이 여러 번에 걸쳐 자라야 함 (${grew}번)`);
  });
}

/* 유압모터도 변위단계선도에: 돌기 시작·멈춤이 한 칸 */
test('기록: H11 실린더 + 모터 (A+ → 모터 3초 → 모터 정지 + A−)',()=>{
  const runs=runRec('h11',{T1:3},[[9]]);
  assert.equal(runs.length,1,JSON.stringify(runs));
  const r=runs[0];
  assert.deepEqual([r[0],r[1],r[3],r[4]],['A+','M+','M0','A-'],JSON.stringify(r));
  assert.match(r[2],/^wait:3\.\d초$/);
});
test('변위단계선도: 모터 줄은 정·0·역 세 칸으로 그린다',()=>{
  const s=MYD.disp([{seq:['A+','M+','wait:3.0초','M0','A-']}],['A'],null,['M']);
  assert.match(s,/>정</);assert.match(s,/>역</);assert.match(s,/>M</);
  // 모터만 있는 미션(H3)도 그려진다
  assert.doesNotMatch(MYD.disp([{seq:['M+','M0','M-','M0']}],[],null,['M']),/모터가 없어요/);
});
