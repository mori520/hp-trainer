/* ===================== 처음 온 사람 안내 · 의견 보내기 (DOM 안 씀) =====================
   needWelcome: 기록이 하나도 없고 안내를 닫은 적이 없으면 true
   feedbackUrl: GitHub 이슈 쓰기 주소 (제목에 지금 보던 미션 이름과 버전을 미리 채움)
   backupText / parseBackup: 내 기록(저장 전체)을 파일로 내보내고, 불러올 때 형식을 검사 */
const FEEDBACK_REPO='https://github.com/mori520/hp-trainer/issues/new';
function needWelcome(store){
  if(!store||store.welcomed)return false;
  const has=o=>!!o&&Object.keys(o).length>0;
  return !has(store.done)&&!has(store.lessonDone);
}
function feedbackUrl(where,ver){
  const title=`[의견] ${where||'전체'} (버전 ${ver||'dev'})`;
  const body=['어떤 화면에서:',where||'','','무엇이 불편했나요 / 바라는 점:','','',
    '(가능하면 화면 캡처를 끌어다 놓아 주세요)'].join('\n');
  return FEEDBACK_REPO+'?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body);
}
// 내 기록 백업: 저장 전체(store)를 파일 하나로. 불러올 때는 이 앱이 만든 파일인지, 모양이 맞는지 본다
const BACKUP_APP='ph-trainer-backup';
function backupText(store,ver){return JSON.stringify({app:BACKUP_APP,v:1,ver:ver||'dev',saved:new Date().toISOString(),store});}
function parseBackup(text){
  if(typeof text!=='string'||text.length>8e6)return{error:'파일이 너무 커요.'};
  let d;try{d=JSON.parse(text);}catch(e){return{error:'읽을 수 없는 파일이에요. "내 기록 내보내기"로 만든 파일을 골라 주세요.'};}
  const obj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
  if(!obj(d)||d.app!==BACKUP_APP||!obj(d.store))return{error:'"내 기록 내보내기"로 만든 파일이 아니에요. (내 과제 파일은 목록의 내 과제 칸 → 불러오기)'};
  const s=d.store;
  // 모양이 이상한 칸은 버린다 (앱이 기본값으로 다시 채움)
  for(const k of ['done','circuits','lessonDone','exam','examBest','fold','quiz','practice','win'])if(k in s&&!obj(s[k]))delete s[k];
  if(!obj(s.done))s.done={};if(!obj(s.circuits))s.circuits={};
  for(const id in s.circuits){const c=s.circuits[id];if(!obj(c)||!Array.isArray(c.wires)||!Array.isArray(c.hoses))delete s.circuits[id];}
  if('custom' in s&&!Array.isArray(s.custom))delete s.custom;
  return{store:s,saved:typeof d.saved==='string'?d.saved.slice(0,10):'',
    count:{done:Object.keys(s.done).length,circuits:Object.keys(s.circuits).length,custom:(s.custom||[]).length}};
}
if(typeof module!=='undefined')module.exports={needWelcome,feedbackUrl,backupText,parseBackup};
