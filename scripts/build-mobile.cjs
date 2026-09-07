const fs=require('node:fs'),path=require('node:path');
require('./build-catalog.cjs');
require('./build-notices.cjs');
const root=path.resolve(__dirname,'..'),ui=path.join(root,'ui'),out=path.join(root,'dist-mobile');
fs.mkdirSync(out,{recursive:true});
const copyText=[
 ['예시 데이터에만 반영됩니다. 새로고침하면 초기화되며 실제 차계부에는 저장하지 않습니다.','기기에 저장합니다. 앱 삭제·분실에 대비해 관리 화면에서 백업 파일을 보관하세요.'],
 ['예시 데이터만 바뀝니다. 새로고침하면 초기화되며 실제 차계부에는 저장하지 않습니다.','기기에 실제 주행거리를 저장합니다.'],
 ['예시 데이터에만 반영되며 새로고침하면 초기화됩니다.','확인한 기록을 기기에 저장합니다.'],
 ['시안이므로 가상 정보로 시험해 주세요. 외부로 보내지 않지만 새로고침하면 지워집니다.','입력한 차량 정보는 기기에 저장하며 외부로 전송하지 않습니다.'],
 ['새로고침하면 초기화됩니다.','기기에 저장합니다.'],
 ['새로고침하면 사진도 초기화','사진을 기기에 보관'],
 ['현재 브라우저에서만 보관합니다.','기기에 보관합니다.'],
 ['2026년 9월 6일 (예시 기준일)','${DEMO_DATE} (한국시간 기준)'],
 ['예시 기준일(2026-09-06) 이전의','오늘까지의'],
 ['예시 데이터','내 기록'],
 ['예시 ',''],['시안','초기 앱'],['화면 설명용 예시','사용자 기록 기준']
];
for(const f of fs.readdirSync(ui))if(/\.(html|css|js)$/.test(f)&&!f.includes('.test.')){let text=fs.readFileSync(path.join(ui,f),'utf8');for(const [from,to]of copyText)text=text.replaceAll(from,to);if(f==='index.html')text=text.replace(/<span class="demo-badge">[\s\S]*?<\/span>/,'');if(f==='runtime.js')text=text.replace(/export const APP_MODE=.*?;/,'export const APP_MODE=true;');if(f==='demo-data.js')text=text.replace(/export const vehicles = \[[\s\S]*?\n\];/,'export const vehicles = [];');fs.writeFileSync(path.join(out,f),text);}
fs.cpSync(path.join(ui,'vendor'),path.join(out,'vendor'),{recursive:true});
for(const lang of ['kor','eng']){const obsolete=path.join(out,'vendor/ocr',lang+'.traineddata.gz');if(fs.existsSync(obsolete))fs.unlinkSync(obsolete);}
fs.copyFileSync(path.join(root,'node_modules/@capacitor/core/dist/index.js'),path.join(out,'vendor/capacitor.js'));
console.log('Built mobile assets from shared UI; no research/private/test files included.');
