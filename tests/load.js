/* 테스트용 로더: 브라우저용 스크립트를 Node에서 그대로 불러온다.
   index.html의 <script src> 순서를 읽어, 화면 조작 파일(tutorial·render·app·lesson·mydiagram-ui·demo-ui)만 빼고 실행한다.
   그림 그리기(buildScene)도 돌 수 있게 아주 작은 가짜 DOM을 넣는다. */
const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.join(__dirname,'..');
const SKIP=new Set(['js/tutorial.js','js/render.js','js/app.js','js/lesson.js','js/mydiagram-ui.js','js/demo-ui.js']);

function fakeEl(){
  const e={children:[],attrs:{},style:{},dataset:{},textContent:'',
    classList:{add(){},remove(){},toggle(){},contains:()=>false},
    setAttribute(k,v){e.attrs[k]=String(v);},getAttribute:k=>e.attrs[k],
    appendChild(c){e.children.push(c);return c;}};
  Object.defineProperty(e,'innerHTML',{set(){e.children=[];},get:()=>''});
  return e;
}

function scriptList(){
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  return [...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]).filter(f=>!SKIP.has(f));
}
function htmlIds(){
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  return new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
}

// 새 실행 환경을 만들어 스크립트를 불러온다. get('이름')으로 전역 값을 꺼낸다
function load(){
  const els={};
  const document={getElementById:id=>els[id]||(els[id]=fakeEl()),createElementNS:()=>fakeEl()};
  const ctx=vm.createContext({console,document});
  for(const f of scriptList())vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});
  const get=expr=>vm.runInContext(expr,ctx);
  return{ctx,get};
}

module.exports={load,htmlIds,scriptList};
