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

const backupText=get('backupText'), parseBackup=get('parseBackup');
test('내 기록 백업: 내보낸 글을 다시 읽으면 같은 기록',()=>{
  const store={done:{m0:true,m1:true},circuits:{free:{wires:[{id:'w1',a:'x',b:'y',color:'red'}],hoses:[]}},custom:[{id:'c1'}],examBest:{x1:754}};
  const p=parseBackup(backupText(store,'abc1234'));
  assert.equal(p.error,undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(p.store)),store);
  assert.deepEqual(JSON.parse(JSON.stringify(p.count)),{done:2,circuits:1,custom:1});
  assert.match(p.saved,/^\d{4}-\d{2}-\d{2}$/);
});
test('내 기록 백업: 다른 파일은 거절하고, 모양이 이상한 칸은 버림',()=>{
  assert.ok(parseBackup('안녕').error);
  assert.ok(parseBackup('{"a":1}').error);
  assert.ok(parseBackup(JSON.stringify({app:'ph-trainer-backup',store:[1]})).error);
  assert.ok(parseBackup(JSON.stringify([{id:'c1',title:'내 과제 파일'}])).error);
  const p=parseBackup(JSON.stringify({app:'ph-trainer-backup',store:{done:'x',circuits:{a:{wires:[],hoses:[]},b:{wires:1},c:null},custom:{},fold:[1],zoom:2}}));
  assert.deepEqual(JSON.parse(JSON.stringify(p.store)),{done:{},circuits:{a:{wires:[],hoses:[]}},zoom:2});
});
