/* 배포용 빌드 — 앱에 필요한 파일만 dist/로 복사한다 (CLAUDE.md·테스트·도구·docs는 사이트에 올리지 않음).
   실행: npm run build  (Cloudflare Pages 빌드 명령도 이것, 출력 폴더는 dist)
   브라우저가 예전 파일을 붙들고 있지 않게(캐시), dist/index.html의 css·js 주소 뒤에 ?v=버전 을 붙이고
   화면 구석 버전 표시(#appVer)와 <meta name="app-version">에 같은 버전을 적는다. */
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const ROOT=path.join(__dirname,'..'), OUT=path.join(ROOT,'dist');
const KEEP=['index.html','css','js','diagrams'];

// 버전: Cloudflare가 알려 주는 커밋 → git 짧은 해시 → 빌드 시각 순으로
function version(){
  const cf=process.env.CF_PAGES_COMMIT_SHA;if(cf)return cf.slice(0,7);
  try{return execSync('git rev-parse --short HEAD',{cwd:ROOT,stdio:['ignore','pipe','ignore']}).toString().trim();}
  catch(e){return new Date().toISOString().slice(0,16).replace(/\D/g,'');}
}
// index.html 글자를 받아 버전을 찍은 글자를 돌려준다 (테스트에서도 씀)
function stamp(html,ver){
  return html
    .replace(/(<(?:script|link)\b[^>]*?\s(?:src|href)=")((?:css|js)\/[^"?]+)"/g,`$1$2?v=${ver}"`)
    .replace(/<meta name="app-version" content="[^"]*">/,`<meta name="app-version" content="${ver}">`)
    .replace(/(<span id="appVer"[^>]*>)[^<]*(<\/span>)/,`$1${ver}$2`);
}

if(require.main===module){
  const ver=version();
  fs.rmSync(OUT,{recursive:true,force:true});
  for(const f of KEEP)fs.cpSync(path.join(ROOT,f),path.join(OUT,f),{recursive:true});
  const idx=path.join(OUT,'index.html');
  fs.writeFileSync(idx,stamp(fs.readFileSync(idx,'utf8'),ver));
  console.log('dist/ ←',KEEP.join(', '),'· 버전',ver);
}
module.exports={stamp};
