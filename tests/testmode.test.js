/* 시험 모드: 과제 고르기와 결과표 (DOM 없는 부분) */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {get}=load();
const TESTMODE=get('TESTMODE'), EXAMS=get('EXAMS');
const J=x=>JSON.parse(JSON.stringify(x));

test('시험 모드: 등급에 맞는 공압 하나 + 유압 하나를 고른다',()=>{
  for(const level of ['','industrial'])for(const r of [0,0.3,0.6,0.999]){
    const ids=J(TESTMODE.pick(EXAMS,level,()=>r));
    assert.equal(ids.length,2);
    const [a,h]=ids.map(id=>EXAMS.find(x=>x.id===id));
    assert.equal(a.layout,'air');assert.equal(h.layout,'hyd');
    assert.equal(a.level||'',level);assert.equal(h.level||'',level);
  }
  // 난수에 따라 다른 과제가 나온다
  assert.notEqual(TESTMODE.pick(EXAMS,'',()=>0)[0],TESTMODE.pick(EXAMS,'',()=>0.999)[0]);
  assert.equal(TESTMODE.pick([],'',()=>0),null);
});
test('시험 모드: 결과표는 과제별 통과 단계·시간과 합계를 낸다',()=>{
  const T={level:'',limit:3000,tasks:[{id:'x1',sec:1500,passed:4,total:4},{id:'y1',sec:3000,over:true,passed:1,total:4}]};
  const r=J(TESTMODE.summary(T,EXAMS,'2026-11-12'));
  assert.equal(r.passed,5);assert.equal(r.total,8);assert.equal(r.all,false);
  assert.deepEqual(r.tasks.map(t=>[t.no,t.passed,t.total,t.over]),[['모의 공1',4,4,false],['모의 유1',1,4,true]]);
  T.tasks[1].passed=4;
  assert.equal(TESTMODE.summary(T,EXAMS,'').all,true);
});
