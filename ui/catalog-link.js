import {laborBundles} from './research-profiles.js';
import {catalog,catalogVersion} from './catalog-data.js';
import {sync} from './schedule.js';
const aliases={
 'ENG-01':['엔진오일'],'ENG-02':['오일필터','오일 필터'],'ENG-11':['엔진마운트'],'ENG-17':['크랭크각','캠각'],'ENG-18':['타이밍체인커버','타이밍커버'],
 'TIM-03':['타이밍체인 세트','타이밍체인 교환'],'TIM-06':['겉밸트','겉벨트'],'TIM-07':['밸트 텐셔너','벨트 텐셔너'],
 'FUE-17':['예열플러그'],'FUE-11':['인젝터 동와셔'],'EXH-01':['egr밸브','egr 밸브'],'EXH-09':['산소센서'],
 'COO-10':['라디에이터 호스'],'COO-07':['서모스텟','서모스탯'],'BRK-01':['브레이크액','브레이크오일'],'BRK-02':['브레이크 패드','브레이크패드'],
 'SUS-01':['쇼바'],'SUS-07':['활대링크'],'ELE-03':['발전기'],'ELE-11':['도어락'],
 'TIR-01':['타이어 4개','타이어 교환'],'TIR-03':['바퀴위치교환','타이어 위치교환'],'TIR-04':['얼라이먼트'],
 'AC-03':['에어컨 냉매','냉매 플러싱'],'AC-06':['냉매드라이어','냉매 드라이어'],
 'DRV-02':['뒷 디퍼 오일','후륜 디퍼'],
 'user-transmission':['미션오일','미션 오일'],
 'user-water-pump':['냉각수펌프','워터펌프']
};
export function fitment(v,row){const fuel=v.conditions?.fuel||'unknown',id=row.id;
 if(id.startsWith('LPG-')&&!['unknown','lpg','other'].includes(fuel))return 'absent';
 if(id.startsWith('HV-')&&['diesel','gasoline','lpg'].includes(fuel))return 'absent';
 if(fuel==='bev'&&/^(ENG|TIM|FUE|AIR|EXH)-/.test(id))return 'absent';
 if(fuel==='diesel'&&['FUE-01','FUE-02','FUE-03','FUE-05','FUE-10','EXH-06'].includes(id))return 'absent';
 if(['gasoline','hev','phev','lpg'].includes(fuel)&&['FUE-04','FUE-09','FUE-17'].includes(id))return 'absent';
 if(['ENG-01','ENG-02','AIR-01'].includes(id)&&['diesel','gasoline','hev','phev','lpg'].includes(fuel))return 'present';return 'unknown';
}
function asset(row,v){return {id:row.id,name:row.name,pack:row.pack,icon:'settings',catalogVersion,fitment:fitment(v,row),intervalKm:null,intervalMonths:null,lastKm:null,lastDate:null,referenceKm:null,referenceMonths:null,basis:'기록 관리 · 예방기준 선택 전',catalogMode:row.mode};}
export function ensureCatalog(v){for(const row of catalog){if(![...v.services,...(v.planned||[])].some(s=>s.id===row.id))v.services.push(sync(asset(row,v)));}for(const s of v.services){const bundles=laborBundles.filter(b=>b.anchors.includes(s.id));if(bundles.length){s.companions=[...new Map(bundles.flatMap(b=>b.companions.map(id=>({id,name:catalog.find(r=>r.id===id)?.name||id,reason:b.condition+' '+b.labor}))).map(c=>[c.id,c])).values()];}}v.catalogVersion=catalogVersion;}
export function proposeLinks(v){const links=[];for(const h of v.history.filter(h=>h.sourceHash&&!h.deletedAt)){const lines=(h.memo||'').split('\n');for(let i=0;i<lines.length;i++){
 const line=lines[i],normalized=line.toLowerCase();const ids=Object.entries(aliases).filter(([,terms])=>terms.some(t=>normalized.includes(t))).map(([id])=>id);
 if(v.conditions?.fuel==='diesel'&&/연료필터/.test(line))ids.push('FUE-04');
 if(v.conditions?.fuel==='diesel'&&/냉각수/.test(line)&&!/냉각수펌프/.test(line))ids.push('COO-01');
 for(const id of new Set(ids)){
  if(id==='AC-03'&&/드라이어/.test(line))continue;
  if(id==='ENG-01'&&/엔진오일필터/.test(line)&&!line.replace('엔진오일필터','').includes('엔진오일'))continue;
  // A trailing 'rotation/replacement' must not imply replacement of all earlier items.
  const fragment=line.split(/,(?![^()]*\))/).find(t=>(aliases[id]||[id==='COO-01'?'냉각수':'연료필터']).some(a=>t.toLowerCase().includes(a)))||line;
  const action=id==='TIR-03'?'adjust':/플러싱|세척|청소/.test(fragment)?'clean':/보충/.test(fragment)?'refill':/수리|누유/.test(fragment)?'other':/교환|교체/.test(fragment)?'replace':'unknown';
  links.push({key:h.visitId+'-'+i+'-'+id,visitId:h.visitId,componentId:id,date:h.date,km:h.km,text:line,action});
 }
 }}return links;}
export function linkHistory(v){ensureCatalog(v);v.maintenanceLinks??=[];
 for(const link of proposeLinks(v)){if(v.maintenanceLinks.some(l=>l.key===link.key))continue;
  let s=v.services.find(s=>s.id===link.componentId);if(!s){s=sync({id:link.componentId,name:link.componentId==='user-transmission'?'미션오일 (변속기 구조 확인 필요)':'냉각수펌프 (기계식·전동식 확인 필요)',pack:'major',icon:'settings',fitment:'present',intervalKm:link.componentId==='user-transmission'?50000:null,intervalMonths:null,lastKm:null,lastDate:null,referenceKm:null,referenceMonths:null,basis:'사용자 지정 주기 · 규격/구조 확인 전 작업 지시 아님'});v.services.push(s);}
  s.fitment='present';v.maintenanceLinks.push({...link,confirmed:link.action!=='unknown',confirmation:link.action!=='unknown'?'원문 명시':'사용자 확인 필요'});
 }
 // Explicit user oil rule is not labeled as a manufacturer recommendation.
 const oil=v.services.find(s=>s.id==='ENG-01');if(oil.fitment==='present'&&!oil.userPeriodChanged){oil.intervalKm??=10000;oil.intervalMonths??=12;oil.basis='사용자 지정 · 10,000 km / 12개월';}
 for(const s of v.services){const records=v.maintenanceLinks.filter(l=>!l.deletedAt&&l.componentId===s.id&&l.confirmed&&l.action==='replace').sort((a,b)=>b.date.localeCompare(a.date));const last=records[0];if(last&&(!s.lastDate||last.date>s.lastDate)){s.lastDate=last.date;s.lastKm=last.km;s.basisKm=last.km;}
  const newest=v.maintenanceLinks.filter(l=>!l.deletedAt&&l.componentId===s.id).sort((a,b)=>b.date.localeCompare(a.date))[0];s.historyNeedsReview=!!(newest&&newest.action==='unknown'&&(!s.lastDate||newest.date>=s.lastDate));sync(s);
 }return v.maintenanceLinks;
}
export function confirmLink(v,key,action){const link=v.maintenanceLinks.find(l=>l.key===key);if(!link||!['replace','inspect','clean','refill','other','adjust'].includes(action))throw Error('연결 내용을 확인해 주세요.');if(link.confirmed)throw Error('이미 확인한 기록입니다.');link.action=action;link.confirmed=true;link.confirmation='사용자 확인';linkHistory(v);}
