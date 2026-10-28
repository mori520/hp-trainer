/* 배포용 빌드 — 앱에 필요한 파일만 dist/로 복사한다 (CLAUDE.md·테스트·도구·docs는 사이트에 올리지 않음).
   실행: npm run build  (Cloudflare Pages 빌드 명령도 이것, 출력 폴더는 dist) */
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'), OUT=path.join(ROOT,'dist');
const KEEP=['index.html','css','js','diagrams'];
fs.rmSync(OUT,{recursive:true,force:true});
for(const f of KEEP)fs.cpSync(path.join(ROOT,f),path.join(OUT,f),{recursive:true});
console.log('dist/ ←',KEEP.join(', '));
