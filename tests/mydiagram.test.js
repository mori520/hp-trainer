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
