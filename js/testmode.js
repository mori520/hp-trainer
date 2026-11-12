/* ===================== 시험 모드 (DOM 안 씀) =====================
   모의 과제 가운데 공압 하나 + 유압 하나를 무작위로 골라 이어서 푸는 연습. 화면은 test-ui.js.
   pick(과제 목록, 등급, 난수) → [공압 과제 id, 유압 과제 id]  (등급: '' = 기사, 'industrial' = 산업기사)
   summary(시험 상태, 과제 목록, 날짜) → 결과표 한 장 {date, level, limit, tasks:[{no,title,passed,total,sec,over}], passed, total, all}
   시험 상태(store.test) = {on, level, limit(과제당 초), cur, tasks:[{id, sec, over?, passed?, total?}]} */
const TESTMODE=(()=>{
  const isLevel=(x,level)=>!!x.exam&&!x.custom&&(x.level||'')===(level||'');
  function pick(exams,level,rnd=Math.random){
    const one=layout=>{const L=exams.filter(x=>isLevel(x,level)&&x.layout===layout);return L.length?L[Math.min(L.length-1,Math.floor(rnd()*L.length))].id:null;};
    const a=one('air'),h=one('hyd');
    return a&&h?[a,h]:null;
  }
  function summary(T,exams,date){
    const tasks=T.tasks.map(t=>{
      const e=exams.find(x=>x.id===t.id)||{no:t.id,title:'',exam:{stages:[]}};
      const total=t.total!=null?t.total:e.exam.stages.length;
      return{no:e.no,title:e.title,passed:Math.min(total,t.passed||0),total,sec:t.sec||0,over:!!t.over};
    });
    const passed=tasks.reduce((s,t)=>s+t.passed,0),total=tasks.reduce((s,t)=>s+t.total,0);
    return{date:date||'',level:T.level||'',limit:T.limit,tasks,passed,total,all:total>0&&passed===total};
  }
  return{pick,summary};
})();
if(typeof module!=='undefined')module.exports={TESTMODE};
