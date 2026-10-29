/* 배포 빌드: css·js 주소에 버전이 붙는지 (캐시 때문에 친구들이 예전 화면을 보는 문제 방지) */
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('fs'), path=require('path');
const {stamp}=require('../tools/build.js');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('빌드하면 모든 css·js 주소에 ?v=버전 이 붙고, 버전 표시·meta도 바뀐다',()=>{
  const out=stamp(html,'abc1234');
  const local=[...out.matchAll(/\s(?:src|href)="((?:css|js)\/[^"]+)"/g)].map(m=>m[1]);
  assert.ok(local.length>10);
  for(const u of local)assert.match(u,/\?v=abc1234$/,u);
  assert.ok(!out.includes('fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap?v'),'외부 주소는 그대로');
  assert.match(out,/<meta name="app-version" content="abc1234">/);
  assert.match(out,/<span id="appVer"[^>]*>abc1234<\/span>/);
  assert.equal(stamp(html,'x').split('\n').length,html.split('\n').length,'다른 줄은 그대로');
});

// 화면 파일(app.js 등)은 테스트에서 실행하지 않으므로, 적어도 문법 오류(같은 이름 두 번 선언 등)는 없는지 확인
test('모든 스크립트가 문법 오류 없이 읽힌다 (화면 파일 포함)',()=>{
  const fs=require('fs'), path=require('path'), vm=require('vm');
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  for(const [,f] of html.matchAll(/<script src="([^"]+)"/g))
    assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{filename:f}),f);
});
