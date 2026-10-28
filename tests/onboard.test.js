/* 처음 온 사람 안내 조건, 의견 보내기 주소 */
const test=require('node:test'), assert=require('node:assert/strict');
const {load}=require('./load.js');
const {get}=load();
const needWelcome=get('needWelcome'), feedbackUrl=get('feedbackUrl');

test('기록이 없으면 안내, 닫았거나 기록이 있으면 안 띄움',()=>{
  assert.equal(needWelcome({done:{},circuits:{free:{}}}),true);
  assert.equal(needWelcome({done:{},welcomed:true}),false);
  assert.equal(needWelcome({done:{m0:true}}),false);
  assert.equal(needWelcome({done:{},lessonDone:{l1:true}}),false);
});
test('의견 보내기: 우리 저장소 이슈 쓰기 주소, 제목에 화면 이름·버전',()=>{
  const u=new URL(feedbackUrl('미션 4 자기유지회로','abc1234'));
  assert.equal(u.origin+u.pathname,'https://github.com/mori520/hp-trainer/issues/new');
  assert.match(u.searchParams.get('title'),/미션 4 자기유지회로/);
  assert.match(u.searchParams.get('title'),/abc1234/);
  assert.doesNotMatch(u.href,/@/,'이메일 주소가 들어가면 안 됨');
});
