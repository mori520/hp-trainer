/* ===================== 기초 강의 화면 =====================
   강의(lessons.js)를 트레이너 자리에 한 장씩 보여 준다. 그림(lessonfigs.js)의 data-hold·data-tap·data-show를 살린다.
   app.js 다음에 불러온다 (store·save·renderMissionList·loadMission을 쓴다). */
const LS_UI={page:0,state:{}};
function lessonById(id){return LESSONS.find(x=>x.id===id);}
// data-show 식: 상태 이름·숫자와 & | ! ( ) 만 쓴다
function lessonExpr(e,s){return Function('s',`return !!(${e.replace(/[A-Za-z_]\w*/g,m=>`s.${m}`)})`)(s);}
function lessonUpdate(){
  const box=$('lesson');
  box.querySelectorAll('[data-show]').forEach(el=>{el.style.display=lessonExpr(el.dataset.show,LS_UI.state)?'':'none';});
}
function openLesson(id,page){
  const L=lessonById(id);if(!L)return;
  UI.lesson=id;LS_UI.page=Math.max(0,Math.min(page,L.pages.length-1));LS_UI.state={};
  document.body.classList.add('in-lesson');$('lesson').hidden=false;$('diagram').hidden=true;
  const pg=L.pages[LS_UI.page],last=LS_UI.page===L.pages.length-1,idx=LESSONS.indexOf(L),next=LESSONS[idx+1];
  const mis=ALL.find(x=>x.id===L.mission);
  $('lesson').innerHTML=`<header class="lesson-head"><span class="eyebrow">${L.no}</span><h2>${L.title}</h2>
      <span class="lesson-pg">${LS_UI.page+1} / ${L.pages.length}</span></header>
    <div class="lesson-fig">${FIG[pg.fig]()}</div>
    ${pg.try?`<p class="lesson-try">👆 ${pg.try}</p>`:''}
    <p class="lesson-text">${pg.t}</p>
    <nav class="lesson-nav">
      <button class="btn" data-go="prev" ${LS_UI.page?'':'disabled'}>← 이전</button>
      <span class="lesson-dots">${L.pages.map((_,k)=>`<button class="dot ${k===LS_UI.page?'on':''}" data-page="${k}" aria-label="${k+1}장"></button>`).join('')}</span>
      ${last?`${mis?`<button class="btn primary" data-go="mission">미션 ${mis.no}에서 해 보기</button>`:''}${next?`<button class="btn" data-go="nextLesson">다음 강의 →</button>`:''}`
        :`<button class="btn primary" data-go="next">다음 →</button>`}
    </nav>`;
  lessonUpdate();
  if(last){store.lessonDone=Object.assign(store.lessonDone||{},{[id]:true});}
  save();renderMissionList();
}
function closeLesson(){UI.lesson=null;document.body.classList.remove('in-lesson');$('lesson').hidden=true;}
$('lesson').addEventListener('click',e=>{
  const L=lessonById(UI.lesson);if(!L)return;
  const t=e.target.closest('[data-tap]');
  if(t){const k=t.dataset.tap;LS_UI.state[k]=!LS_UI.state[k];lessonUpdate();return;}
  const d=e.target.closest('[data-page]');if(d){openLesson(L.id,+d.dataset.page);return;}
  const b=e.target.closest('[data-go]');if(!b)return;
  const go=b.dataset.go,idx=LESSONS.indexOf(L);
  if(go==='prev')openLesson(L.id,LS_UI.page-1);
  if(go==='next')openLesson(L.id,LS_UI.page+1);
  if(go==='nextLesson')openLesson(LESSONS[idx+1].id,0);
  if(go==='mission'){closeLesson();UI.mode='tut';loadMission(L.mission);}
});
// 누름버튼(data-hold): 누르는 동안만 켜짐
$('lesson').addEventListener('pointerdown',e=>{const h=e.target.closest('[data-hold]');if(h){LS_UI.state[h.dataset.hold]=true;lessonUpdate();e.preventDefault();}});
window.addEventListener('pointerup',()=>{
  if(!UI.lesson)return;
  $('lesson').querySelectorAll('[data-hold]').forEach(h=>{LS_UI.state[h.dataset.hold]=false;});lessonUpdate();
});
// 키보드: ← → 로 장 넘기기, 그림 버튼은 Space/Enter
window.addEventListener('keydown',e=>{
  if(!UI.lesson)return;
  const L=lessonById(UI.lesson),f=document.activeElement;
  if(f&&f.dataset&&(f.dataset.hold||f.dataset.tap)&&(e.key===' '||e.key==='Enter')){
    if(f.dataset.tap)LS_UI.state[f.dataset.tap]=!LS_UI.state[f.dataset.tap];else if(!e.repeat)LS_UI.state[f.dataset.hold]=true;
    lessonUpdate();e.preventDefault();return;
  }
  if(e.key==='ArrowRight'&&LS_UI.page<L.pages.length-1)openLesson(L.id,LS_UI.page+1);
  if(e.key==='ArrowLeft'&&LS_UI.page>0)openLesson(L.id,LS_UI.page-1);
});
window.addEventListener('keyup',e=>{
  if(!UI.lesson||!(e.key===' '||e.key==='Enter'))return;
  $('lesson').querySelectorAll('[data-hold]').forEach(h=>{LS_UI.state[h.dataset.hold]=false;});lessonUpdate();
});
// 처음 열 때: 마지막에 보던 것이 강의면 그 강의부터
if(lessonById(BOOT_LAST))openLesson(BOOT_LAST,0);
