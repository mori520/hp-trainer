/* ===================== 처음 온 사람 안내 · 의견 보내기 (DOM 안 씀) =====================
   needWelcome: 기록이 하나도 없고 안내를 닫은 적이 없으면 true
   feedbackUrl: GitHub 이슈 쓰기 주소 (제목에 지금 보던 미션 이름과 버전을 미리 채움) */
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
if(typeof module!=='undefined')module.exports={needWelcome,feedbackUrl};
