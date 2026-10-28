/* 기초 강의 데이터 검사: 그림 이름·미션 연결 오타, 그림 속 식(data-show)이 버튼 상태 이름과 맞는지 */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');

const {get}=load();
const LESSONS=get('LESSONS'), FIG=get('FIG'), MISSIONS=get('MISSIONS');

test('강의 id가 겹치지 않는다',()=>{
  const ids=LESSONS.map(l=>l.id);
  assert.equal(new Set(ids).size,ids.length);
});
for(const L of LESSONS){
  test(`강의 ${L.id}: 그림·미션·글이 올바르다`,()=>{
    assert.ok(L.no&&L.title&&L.pages.length,'no·title·pages');
    if(L.mission)assert.ok(MISSIONS.some(m=>m.id===L.mission),`없는 미션 ${L.mission}`);
    L.pages.forEach((p,i)=>{
      const at=`${i+1}장`;
      assert.ok(p.t,`${at}: 글 없음`);
      assert.ok(typeof FIG[p.fig]==='function',`${at}: 없는 그림 ${p.fig}`);
      const svg=FIG[p.fig]();
      assert.match(svg,/^<svg /,`${at}: SVG가 아님`);
      // 버튼이 만드는 상태 이름
      const states=new Set([...svg.matchAll(/data-(?:hold|tap)="(\w+)"/g)].map(m=>m[1]));
      for(const [,e] of svg.matchAll(/data-show="([^"]+)"/g)){
        assert.match(e,/^[\w\s&|!()]+$/,`${at}: 식에 쓸 수 없는 글자 "${e}"`);
        for(const name of e.match(/[A-Za-z_]\w*/g)||[])assert.ok(states.has(name),`${at}: 식 "${e}"의 ${name}을(를) 바꾸는 버튼이 없음`);
        assert.doesNotThrow(()=>Function('s',`return !!(${e.replace(/[A-Za-z_]\w*/g,m=>`s.${m}`)})`)({}),`${at}: 식 "${e}"`);
      }
      // "해 보기" 안내가 있으면 누를 버튼이 있어야 한다
      if(p.try)assert.ok(states.size>0,`${at}: try 안내가 있는데 그림에 버튼이 없음`);
    });
  });
}
