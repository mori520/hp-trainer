/* ===================== 내 과제 화면 =====================
   목록의 "내 과제" 칸(+ 새 과제·불러오기·모두 내보내기), 과제를 열었을 때 고치기·복제·내보내기·삭제 막대,
   과제 만들기 창(에디터). 채점·스톱워치·도면 보기는 모의 과제 화면(exam-ui.js)을 그대로 쓴다.
   과제 정의를 미션 모양으로 바꾸기·기준 검사·불러오기 형식 검사는 custom.js (DOM 없음, 테스트 있음).
   exam-ui.js 다음에 불러온다 (store·save·ALL·cur·loadMission·renderMissionList·toast·PRAC_LABEL·pracValName을 쓴다) */
const cusDefs=()=>store.custom=store.custom||[];
const cusOf=mid=>cusDefs().find(d=>'u_'+d.id===mid);
// 목록(ALL)의 내 과제를 지금 저장된 정의로 다시 채운다
function syncCustom(){
  for(let i=ALL.length-1;i>=0;i--)if(ALL[i].custom)ALL.splice(i,1);
  cusDefs().forEach(d=>{try{ALL.push(CUSTOM.toMission(d));}catch(e){}});
}
// 내 과제 하나의 기록(배선·단계·완료)을 지운다
function cusForget(mid,keepWires){
  delete store.done[mid];if(store.exam)delete store.exam[mid];
  if(!keepWires)delete store.circuits[mid];
  else if(store.circuits[mid])delete store.circuits[mid].board;   // 판 구성은 새 정의를 따르게
}
function cusDownload(name,text){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  a.download=name.replace(/[\\/:*?"<>|]/g,'_')+'.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
let cusAskDel=false;
function renderCustomBar(){
  const mis=cur(),box=$('customBar');box.hidden=!mis.custom;if(!mis.custom)return;
  box.innerHTML=`<button class="btn" data-c="edit">고치기</button><button class="btn" data-c="copy">복제</button>
    <button class="btn" data-c="export" title=".json 파일로 저장해 친구에게 주거나 다른 컴퓨터에서 불러올 수 있어요">내보내기</button>
    <button class="btn danger" data-c="del">${cusAskDel?'정말 삭제? 한 번 더':'삭제'}</button>`;
}
$('customBar').addEventListener('click',e=>{
  const b=e.target.closest('button[data-c]');if(!b)return;
  const mid=UI.mission,d=cusOf(mid);if(!d)return;
  const c=b.dataset.c;
  if(c!=='del')cusAskDel=false;
  if(c==='edit')openCustomEditor(d);
  if(c==='copy'){
    const n=JSON.parse(JSON.stringify(d));n.id=CUSTOM.newId();n.title=(d.title+' (복사)').slice(0,60);
    cusDefs().push(n);syncCustom();save();loadMission('u_'+n.id);toast('복제했어요. "고치기"로 바꿔 보세요.');
  }
  if(c==='export')cusDownload('내과제-'+(d.title||'제목없음'),CUSTOM.exportText([d]));
  if(c==='del'){
    if(!cusAskDel){cusAskDel=true;renderCustomBar();return;}
    cusAskDel=false;
    store.custom=cusDefs().filter(x=>x!==d);cusForget(mid);syncCustom();
    S=null;loadMission('free');toast('과제를 지웠어요.');   // S=null: 지운 과제의 배선을 다시 저장하지 않게
  }
  renderCustomBar();
});
// 목록의 + 새 과제 / 불러오기 / 모두 내보내기
$('missionList').addEventListener('click',e=>{
  if(e.target.closest('[data-cnew]'))openCustomEditor(null);
  if(e.target.closest('[data-cimport]')){$('customFile').value='';$('customFile').click();}
  if(e.target.closest('[data-cexport]'))cusDownload('내과제-모두',CUSTOM.exportText(cusDefs()));
});
$('customFile').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  if(f.size>20e6){toast('파일이 너무 커요.');return;}
  const r=new FileReader();
  r.onload=()=>{
    const list=CUSTOM.parseFile(String(r.result));
    if(!list.length){toast('읽을 수 있는 과제가 없어요. "내보내기"로 만든 .json 파일인지 확인하세요.');return;}
    list.forEach(d=>{if(cusDefs().some(x=>x.id===d.id))d.id=CUSTOM.newId();cusDefs().push(d);});
    syncCustom();store.fold=Object.assign(store.fold||{},{custom:false});save();
    loadMission('u_'+list[0].id);toast(`과제 ${list.length}개를 불러왔어요.`);
  };
  r.readAsText(f);
});

/* ---------- 과제 만들기 창 ---------- */
let ED=null, edNew=false, edWarned=false;   // ED: 고치는 중인 정의(복사본)
const edBox=$('customEd');
function openCustomEditor(d){
  edNew=!d;ED=JSON.parse(JSON.stringify(d||CUSTOM.blank(cur()&&cur().layout==='hyd'?'hyd':'air')));
  edWarned=false;edBox.hidden=false;renderEditor();edBox.scrollTop=0;
  const t=edBox.querySelector('[data-f="title"]');if(t)t.focus();
}
function closeEditor(){edBox.hidden=true;ED=null;}
// 기기 설정값 목록 (공급 압력 SU·RV는 위 "압력" 칸에서 따로 정하므로 뺀다)
const cusSets=d=>CUSTOM.settingsOf(d).filter(a=>a.name!=='SU'&&a.name!=='RV');
const opt=(v,label,sel)=>`<option value="${v}" ${sel?'selected':''}>${label}</option>`;
const fmtT=t=>t.replace('-','−');
function renderEditor(msgs){
  const d=ED,ch=CUSTOM.choices(d.fluid),tk=CUSTOM.tokens(d),sets=cusSets(d);
  const cylTk=d.seq.filter((t,i,a)=>a.indexOf(t)===i&&!tk.includes(t.slice(0,-1)+'0'));
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  edBox.innerHTML=`<div class="cus-head"><h3 id="customEdTitle">${edNew?'새 과제 만들기':'과제 고치기'}</h3><button class="btn" data-e="close">닫기</button></div>
  <p class="cus-note">가진 도면을 보고 판·동작 순서·규칙을 정하면, "평가 받기"가 그 기준으로 채점해요. 만든 과제는 이 브라우저에만 저장돼요.</p>
  <label class="cus-row"><span>제목</span><input data-f="title" maxlength="60" value="${esc(d.title)}" placeholder="예: 공압 연습 1"></label>
  <fieldset><legend>1. 판 구성</legend>
    <div class="mode cus-fluid"><button data-fluid="air" aria-pressed="${d.fluid==='air'}">공압</button><button data-fluid="hyd" aria-pressed="${d.fluid==='hyd'}">유압</button></div>
    <div class="prac-grid">${Object.keys(ch).map(slot=>`<label><span>${PRAC_LABEL[slot]||slot}</span>
      <select data-slot="${slot}">${ch[slot].map(v=>opt(v,pracValName(v),(d.board[slot]||'')===v)).join('')}</select></label>`).join('')}</div>
  </fieldset>
  <fieldset><legend>2. 변위단계선도 (PB1을 한 번 누르면 이 순서로)</legend>
    <div class="cus-seq">${d.seq.length?d.seq.map((t,i)=>`<span class="chip">${i+1}. ${fmtT(t)}</span>`).join('<span class="arr">→</span>'):'<span class="muted">아래 버튼을 눌러 순서대로 넣으세요.</span>'}</div>
    <div class="cus-tok">${tk.map(t=>`<button class="btn" data-tok="${t}">${fmtT(t)}</button>`).join('')}
      <button class="btn" data-e="undo" ${d.seq.length?'':'disabled'}>↶ 하나 지우기</button><button class="btn" data-e="clear" ${d.seq.length?'':'disabled'}>모두 지우기</button></div>
    <p class="cus-note">A+ 전진, A− 후진${tk.includes('M0')?', M+ 정회전, M− 역회전, M0 정지':''}. 사이클이 끝나면 실린더는 후진 끝으로 돌아와야 해요.</p>
  </fieldset>
  <fieldset><legend>3. 채점 규칙</legend>
    <label class="cus-chk"><input type="checkbox" data-f="repeat" ${d.repeat?'checked':''}> 2회 반복해도 똑같이 동작</label>
    <label class="cus-row"><span>릴레이 개수</span><select data-f="relays">${opt('','상관없음',d.relays==null)}${[1,2,3,4,5,6].map(n=>opt(n,n+'개 정확히',d.relays===n)).join('')}</select></label>
    <div class="cus-line"><label class="cus-chk"><input type="checkbox" data-f="pOn" ${d.pressure?'checked':''}> ${d.fluid==='hyd'?'릴리프':'서비스 유닛'} 압력</label>
      ${d.pressure?`<input type="number" data-f="p0" step="${d.fluid==='hyd'?0.1:0.05}" min="0" max="10" value="${d.pressure[0]}"> ~ <input type="number" data-f="p1" step="${d.fluid==='hyd'?0.1:0.05}" min="0" max="10" value="${d.pressure[1]}"> MPa`:''}</div>
    <div class="cus-line"><label class="cus-chk"><input type="checkbox" data-f="tOn" ${d.timer?'checked':''} ${d.seq.length?'':'disabled'}> 타이머: 머무는 시간</label>
      ${d.timer?`<select data-f="tAfter">${d.seq.filter((t,i,a)=>a.indexOf(t)===i).map(t=>opt(t,fmtT(t)+' 도착 뒤',t===d.timer.after)).join('')}</select>
        <input type="number" data-f="tSec" step="0.5" min="0.5" max="10" value="${d.timer.sec}"> 초`:''}</div>
    <div class="cus-sub"><b>속도 조절 방식</b>${Object.entries(d.meter).map(([k,v])=>`<div class="cus-line">
        <select data-meterk="${k}">${cylTk.map(t=>opt(t,fmtT(t)+' 움직임',t===k)).join('')}</select>
        <select data-meterv="${k}">${Object.entries(CUSTOM.METER).map(([m,l])=>opt(m,l,m===v)).join('')}</select>
        <button class="btn" data-meterdel="${k}" aria-label="빼기">✕</button></div>`).join('')}
      <button class="btn" data-e="meterAdd" ${cylTk.some(t=>!(t in d.meter))?'':'disabled'}>+ 추가</button></div>
    <div class="cus-sub"><b>기기 설정값 범위</b>${d.settings.map((s,i)=>`<div class="cus-line">
        <select data-sname="${i}">${sets.map(a=>opt(a.name,`${a.name} (${a.unit})`,a.name===s.name)).join('')}${sets.some(a=>a.name===s.name)?'':opt(s.name,s.name+' (판에 없음)',true)}</select>
        <input type="number" data-smin="${i}" step="any" value="${s.min}"> ~ <input type="number" data-smax="${i}" step="any" value="${s.max}">
        <button class="btn" data-sdel="${i}" aria-label="빼기">✕</button></div>`).join('')}
      <button class="btn" data-e="setAdd" ${sets.length?'':'disabled'}>+ 추가</button></div>
  </fieldset>
  <fieldset><legend>4. 메모와 도면</legend>
    <label class="cus-row cus-memo"><span>요구사항 메모 (한 줄에 하나, 요구사항 목록에 보여요)</span><textarea data-f="memo" rows="3" maxlength="2000">${esc(d.memo)}</textarea></label>
    <div class="cus-line"><label class="btn">도면 사진 넣기<input type="file" accept="image/*" data-e="img" hidden></label>
      ${d.img?`<img class="cus-thumb" src="${d.img}" alt="첨부한 도면"><button class="btn" data-e="imgDel">사진 빼기</button>`:'<span class="muted">사진은 줄여서 이 브라우저에 저장돼요.</span>'}</div>
  </fieldset>
  ${msgs?`<div class="cus-msgs ${msgs.length?'bad':'ok'}">${msgs.length?'<b>확인할 곳</b><ul>'+msgs.map(m=>`<li>${m}</li>`).join('')+'</ul>':'<b>문제 없어요.</b> 저장한 뒤 판을 꾸미고 "평가 받기"를 눌러 보세요.'}</div>`:''}
  <div class="cus-foot"><button class="btn" data-e="check">이 기준 검사</button><span class="sp"></span>
    <button class="btn" data-e="close">취소</button><button class="btn primary" data-e="save">${edWarned?'그래도 저장':'저장'}</button></div>`;
}
// 글자·숫자 입력은 다시 그리지 않고 값만 (입력 중 커서가 튀지 않게)
edBox.addEventListener('input',e=>{
  if(!ED)return;const t=e.target,f=t.dataset.f,n=parseFloat(t.value);edWarned=false;
  if(f==='title')ED.title=t.value;
  if(f==='memo')ED.memo=t.value;
  if(f==='p0'&&isFinite(n))ED.pressure[0]=n;
  if(f==='p1'&&isFinite(n))ED.pressure[1]=n;
  if(f==='tSec'&&isFinite(n))ED.timer.sec=n;
  if(t.dataset.smin!=null&&isFinite(n))ED.settings[+t.dataset.smin].min=n;
  if(t.dataset.smax!=null&&isFinite(n))ED.settings[+t.dataset.smax].max=n;
});
edBox.addEventListener('change',e=>{
  if(!ED)return;const t=e.target,f=t.dataset.f,d=ED;edWarned=false;
  if(t.dataset.slot){if(t.value)d.board[t.dataset.slot]=t.value;else delete d.board[t.dataset.slot];}
  else if(f==='repeat')d.repeat=t.checked;
  else if(f==='relays')d.relays=t.value===''?null:+t.value;
  else if(f==='pOn')d.pressure=t.checked?(d.fluid==='hyd'?[3.8,4.2]:[0.45,0.55]):null;
  else if(f==='tOn')d.timer=t.checked?{after:d.seq[0],sec:3}:null;
  else if(f==='tAfter')d.timer.after=t.value;
  else if(t.dataset.meterk){const v=d.meter[t.dataset.meterk];delete d.meter[t.dataset.meterk];d.meter[t.value]=v;}
  else if(t.dataset.meterv)d.meter[t.dataset.meterv]=t.value;
  else if(t.dataset.sname!=null){const s=cusSets(d).find(a=>a.name===t.value),x=d.settings[+t.dataset.sname];x.name=t.value;if(s){x.min=s.def;x.max=s.def;}}
  else if(t.dataset.e==='img'){cusImage(t.files[0]);return;}
  else return;
  renderEditor();
});
edBox.addEventListener('click',e=>{
  if(!ED)return;const b=e.target.closest('button');if(!b)return;const d=ED,a=b.dataset.e;
  if(a==='close'){closeEditor();return;}
  if(b.dataset.fluid&&b.dataset.fluid!==d.fluid){
    // 공압 ↔ 유압: 판이 달라서 판·순서·규칙을 새로 정한다 (제목·메모·사진은 그대로)
    const n=CUSTOM.blank(b.dataset.fluid);Object.assign(n,{id:d.id,title:d.title,memo:d.memo,img:d.img,repeat:d.repeat,relays:d.relays});ED=n;
  }
  if(b.dataset.tok)d.seq.push(b.dataset.tok);
  if(a==='undo')d.seq.pop();
  if(a==='clear')d.seq=[];
  if(a==='meterAdd'){const t=d.seq.filter((x,i,s)=>s.indexOf(x)===i&&!CUSTOM.tokens(d).includes(x.slice(0,-1)+'0')).find(x=>!(x in d.meter));if(t)d.meter[t]='out';}
  if(b.dataset.meterdel)delete d.meter[b.dataset.meterdel];
  if(a==='setAdd'){const s=cusSets(d).find(x=>!d.settings.some(y=>y.name===x.name))||cusSets(d)[0];if(s)d.settings.push({name:s.name,min:s.def,max:s.def});}
  if(b.dataset.sdel!=null)d.settings.splice(+b.dataset.sdel,1);
  if(a==='imgDel')d.img='';
  if(a==='check'){renderEditor(CUSTOM.check(ED));return;}
  if(a==='save'){cusSave();return;}
  // 순서가 바뀌어 없어진 칸을 쓰던 타이머·속도 조절은 정리
  if(d.timer&&!d.seq.includes(d.timer.after))d.timer=d.seq.length?Object.assign(d.timer,{after:d.seq[0]}):null;
  for(const k in d.meter)if(!d.seq.includes(k))delete d.meter[k];
  edWarned=false;renderEditor();
});
// 저장: 기준 검사에 걸리면 한 번 보여 주고, "그래도 저장"을 누르면 저장
function cusSave(){
  const msgs=CUSTOM.check(ED);
  if(msgs.length&&!edWarned){edWarned=true;renderEditor(msgs);edBox.querySelector('.cus-msgs').scrollIntoView({block:'nearest'});return;}
  const d=JSON.parse(JSON.stringify(ED)),mid='u_'+d.id,list=cusDefs(),i=list.findIndex(x=>x.id===d.id);
  if(i<0)list.push(d);else list[i]=d;
  try{if(JSON.stringify(store).length>4.5e6){if(i<0)list.pop();else list[i]=cusOf(mid);toast('저장 공간이 모자라요. 도면 사진을 빼거나 다른 과제를 지운 뒤 저장하세요.');return;}}catch(e){}
  if(UI.mission===mid&&S)save();   // 지금 배선은 남기고
  cusForget(mid,true);             // 판 구성·단계·완료 기록은 새 기준으로
  syncCustom();
  if(UI.mission===mid)UI.board=Object.assign({},CUSTOM.toMission(d).board);   // loadMission의 save()가 예전 판을 다시 쓰지 않게
  store.fold=Object.assign(store.fold||{},{custom:false});
  closeEditor();save();loadMission(mid);
  toast(i<0?'과제를 만들었어요. 판을 꾸미고 "평가 받기"를 눌러 보세요.':'과제를 고쳤어요. 단계 기록은 처음부터예요.');
}
// 도면 사진: 긴 변 1600px로 줄여 JPEG로. 그래도 크면 더 줄인다
function cusImage(f){
  if(!f)return;if(!/^image\//.test(f.type)){toast('사진 파일만 넣을 수 있어요.');return;}
  const img=new Image(),url=URL.createObjectURL(f);
  img.onload=()=>{
    URL.revokeObjectURL(url);let out='';
    for(const [side,q] of [[1600,.75],[1300,.6],[1000,.5]]){
      const k=Math.min(1,side/Math.max(img.width,img.height)),c=document.createElement('canvas');
      c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
      const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);
      out=c.toDataURL('image/jpeg',q);if(out.length<=CUSTOM.MAX_IMG)break;
    }
    if(!ED)return;
    if(out.length>CUSTOM.MAX_IMG){toast('사진이 너무 커요. 더 작은 사진을 넣어 주세요.');return;}
    ED.img=out;renderEditor();
  };
  img.onerror=()=>{URL.revokeObjectURL(url);toast('사진을 읽지 못했어요.');};
  img.src=url;
}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!edBox.hidden)closeEditor();});
// 시작할 때 마지막으로 보던 것이 내 과제였으면 막대도 그린다 (app.js가 먼저 불러서 아직 함수가 없었음)
if(cur()&&cur().custom)renderCustomBar();
