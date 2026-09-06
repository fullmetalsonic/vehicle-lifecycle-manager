// Deterministic UI scheduling model. Demo data only, not a manufacturer rule matcher.
import {DEMO_DATE,estimate} from './demo-data.js';
import {APP_MODE,TODAY} from './runtime.js';
export const dayMs=86400000;
export function validDate(d){return /^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;}
export function addMonths(date,months){if(!validDate(date)||!Number.isInteger(months)||months<0)throw Error('Invalid date');const d=new Date(date),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);d.setUTCDate(Math.min(day,new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()));return d.toISOString().slice(0,10);}
export const allServices=v=>[...v.services,...(v.planned||[])].filter(s=>!s.deletedAt&&(!s.catalogVersion||s.fitment==='present'));
export const periodText=s=>[s.intervalKm?`${s.intervalKm.toLocaleString('ko-KR')} km`:null,s.intervalMonths?`${s.intervalMonths}개월`:null].filter(Boolean).join(' 또는 ')||'주기 미설정';
export function sync(s){const action=s.scheduleAction||'replace';const replaced=!!(action==='replace'?s.lastDate:s.lastServiceDate);const first=!replaced&&(s.firstIntervalKm||s.firstIntervalMonths);s.clockDate=s.clockOrigin==='manufactured'?s.manufactureDate:(action==='replace'?s.lastDate:s.lastServiceDate)||(first?s.inServiceDate:null);s.clockKm=action==='replace'?(s.basisKm??s.lastKm):s.lastServiceKm;if(first&&s.clockKm==null)s.clockKm=s.inServiceKm??null;s.firstCycle=!!first;s.effectiveKm=first?s.firstIntervalKm:s.intervalKm;s.effectiveMonths=first?s.firstIntervalMonths:s.intervalMonths;s.target=s.effectiveKm&&s.clockKm!=null?s.clockKm+s.effectiveKm:undefined;s.date=s.effectiveMonths&&s.clockDate?addMonths(s.clockDate,s.effectiveMonths):undefined;s.period=periodText(s);s.last=s.lastDate?s.lastDate.replaceAll('-','. ')+' · '+(s.lastKm==null?'거리 미상':s.lastKm.toLocaleString('ko-KR')+' km'):'마지막 교환 기록 필요';return s;}
export function timeline(v,s,onDate=APP_MODE?TODAY():DEMO_DATE){const e=estimate(v,onDate);const refKm=s.firstCycle?(s.firstReferenceKm??s.referenceKm):s.referenceKm,refMonths=s.firstCycle?(s.firstReferenceMonths??s.referenceMonths):s.referenceMonths;const referenceBase=s.firstCycle?s.inServiceKm:(s.scheduleAction&&s.scheduleAction!=='replace'?s.lastServiceKm:s.lastKm);const sourceKm=refKm&&referenceBase!=null?referenceBase+refKm:null;const sourceDate=refMonths&&s.clockDate?addMonths(s.clockDate,refMonths):null;
 if(['condition','event'].includes(s.managementType))return {status:'unknown',km:null,days:null,projected:null,target:null,date:null,sourceKm:null,sourceDate:null,text:s.managementType==='condition'?'상태를 보고 정비':'관련 작업 때 함께 확인',eta:null,kmFirst:false,score:Infinity};
 if(s.historyNeedsReview)return {status:'unknown',km:null,days:null,projected:null,target:null,date:null,sourceKm:null,sourceDate:null,text:'최근 작업의 교환 여부 확인 필요',eta:null,kmFirst:false,score:Infinity};
 const targets=[s.target,sourceKm].filter(Number.isFinite);const target=targets.length?Math.min(...targets):null;const measuredOnly=e.km===null&&!v.odometerConflict&&e.last&&target!==null&&e.last[1]>=target;const km=target!==null&&e.km!==null?target-e.km:measuredOnly?target-e.last[1]:null;
 const dates=[s.date,sourceDate].filter(Boolean).sort();const date=dates[0]||null;const days=date?(Date.parse(date)-Date.parse(onDate))/dayMs:null;
 const projected=km!==null&&e.rate>0&&e.age<=90?Math.max(0,Math.ceil(km/e.rate)):null;
 const overdue=(km!==null&&km<0)||(days!==null&&days<0);const soon=(km!==null&&km<=1000)||(days!==null&&days<=30)||(projected!==null&&projected<=30);
 const status=overdue?'overdue':soon?'soon':km===null&&days===null?'unknown':'later';
 const kmFirst=km!==null&&(days===null||(km<=0&&days>=0)||projected!==null&&projected<=days);
 const text=kmFirst?(km<0?`${Math.abs(km).toLocaleString('ko-KR')} km 초과`:`약 ${km.toLocaleString('ko-KR')} km 남음`):days!==null?(days<0?`${Math.abs(days)}일 초과`:`${days}일 남음`):!s.lastDate&&s.lastKm===null?'마지막 교환 기록 필요':'교환주기 또는 주행거리 확인 필요';
 const eta=kmFirst&&projected!==null?new Date(Date.parse(onDate)+projected*dayMs).toISOString().slice(0,10):date;
 return {status,km,days,projected,target,date,sourceKm,sourceDate,text:measuredOnly?'마지막 실측에서 '+(km<0?'이미 '+Math.abs(km).toLocaleString('ko-KR')+' km 초과':'교환 거리 도래'):text,measuredOnly:!!measuredOnly,eta:measuredOnly?null:eta,kmFirst,score:overdue?Math.min(days??0,km??0):Math.min(days??Infinity,projected??Infinity)};
}
export function alignedCandidate(km,interval){if(!interval)return null;const n=Math.round(km/interval)*interval;return n>0&&n!==km&&Math.abs(n-km)<=Math.min(1000,interval*.1)?n:null;}
export function validateRecord(v,s,d){if(!validDate(d.date)||d.date>(APP_MODE?TODAY():DEMO_DATE))return '예시 기준일(2026-09-06) 이전의 올바른 날짜를 입력해 주세요.';
 if(!Number.isSafeInteger(d.km)||d.km<0||d.km>999999)return '주행거리는 0~999,999 사이의 정수로 입력해 주세요.';
 if(s.clockOrigin==='manufactured'&&d.action==='replace'&&(!validDate(d.manufactureDate)||d.manufactureDate>d.date))return '교환한 부품의 실제 제조일을 작업일 이전 날짜로 입력해 주세요.';
 if(d.cost!==null&&(!Number.isSafeInteger(d.cost)||d.cost<0||d.cost>999999999))return '비용은 0 이상의 정수로 입력하거나 비워 두세요.';
 if(!['replace','inspect','clean','refill','adjust','lubricate','other'].includes(d.action))return '작업 종류를 선택해 주세요.';
 const observations=[...v.points,...allServices(v).filter(x=>x.lastDate&&Number.isFinite(x.lastKm)).map(x=>[x.lastDate,x.lastKm])];
 for(const [date,km]of observations){if(date===d.date&&km!==d.km)return '같은 날짜에 다른 실측값이 있어요. 주행거리 입력에서 먼저 확인해 주세요.';if(date<d.date&&km>d.km||date>d.date&&km<d.km)return '기존 날짜별 실측 주행거리와 순서가 맞지 않아요.';}
 if(d.aligned&&(d.action!=='replace'||alignedCandidate(d.km,s.intervalKm)===null))return '가까운 정비회차를 선택할 수 없는 거리예요.';
 if(d.action!=='replace'&&d.companions.length)return '동반 교환 항목은 교환 작업에서만 선택해 주세요.';return null;
}
export function commitRecord(v,s,d){const error=validateRecord(v,s,d);if(error)throw Error(error);
 if(s.catalogVersion){s.fitment='present';s.fitmentConfirmedByUser=true;}if(d.manufactureDate&&d.action==='replace'&&(!s.lastDate||d.date>=s.lastDate))s.manufactureDate=d.manufactureDate;
 const recent=!s.lastDate||d.date>=s.lastDate;
 if(d.action==='replace'&&recent){s.lastKm=d.km;s.lastDate=d.date;s.basisKm=d.aligned?alignedCandidate(d.km,s.intervalKm):d.km;if(s.catalogVersion)s.historyNeedsReview=false;sync(s);}
 // Companions are recorded only if explicitly selected; do not reset unrelated assets.
 const selected=(s.companions||[]).filter(c=>d.companions.includes(c.id));
 for(const c of selected){const asset=[...v.services,...(v.planned||[])].find(x=>x.id===c.id);if(asset){asset.fitment='present';asset.fitmentConfirmedByUser=true;}}
 const names=[s.name,...selected.map(c=>c.name)];
 const actionNames={replace:'교환',inspect:'점검',clean:'청소',refill:'보충',adjust:'조정',lubricate:'윤활',other:'수리'};
 const entry={id:crypto.randomUUID(),manufactureDate:d.manufactureDate||null,alignedKm:d.aligned?s.basisKm:null,shop:d.shop||'',memo:d.memo||'',date:d.date,month:Number(d.date.slice(5,7))+'월',day:String(Number(d.date.slice(8))),name:names.join(' · ')+' '+actionNames[d.action],km:d.km,cost:d.cost,action:d.action,assetIds:[s.id,...selected.map(c=>c.id)],note:`예시 기록 · ${d.aligned?'정비회차 '+s.basisKm+' km 선택':'실제 거리 기준'}${d.action!=='replace'?' · 교환 주기 유지':''}${!recent?' · 과거 기록, 최신 교환 기준 유지':''}`};v.history.unshift(entry);
 v.history.sort((a,b)=>(b.date||`2026-${String(parseInt(b.month)).padStart(2,'0')}-${b.day.padStart(2,'0')}`).localeCompare(a.date||`2026-${String(parseInt(a.month)).padStart(2,'0')}-${a.day.padStart(2,'0')}`));
 if(d.cost!==null&&d.date.slice(0,4)===DEMO_DATE.slice(0,4))v.yearCost=(v.yearCost??0)+d.cost;
 if(!v.points.some(p=>p[0]===d.date))v.points.push([d.date,d.km]);v.points.sort((a,b)=>a[0].localeCompare(b[0]));return entry;
}
export function initializePlans(vehicles){for(const v of vehicles){for(const s of v.services){
 if(s.id==='oil')Object.assign(s,{intervalKm:10000,intervalMonths:12,lastKm:139000,lastDate:'2025-11-20',companions:[{id:'oil-filter',name:'오일필터',reason:'같은 엔진오일 작업에서 접근 공정이 겹쳐요. 부품비는 별도예요.'}]});
 if(s.id==='brake')Object.assign(s,{intervalKm:null,intervalMonths:24,lastKm:115000,lastDate:'2024-09-30'});
 if(s.id==='cabin')Object.assign(s,{intervalKm:null,intervalMonths:12,lastKm:11400,lastDate:'2025-09-28'});
 s.referenceKm=null;s.referenceMonths=null;sync(s);
 }if(v.id==='santa')v.planned=[sync({id:'transmission',name:'미션오일',icon:'oil',intervalKm:50000,intervalMonths:null,lastKm:120000,lastDate:'2024-12-01',basis:'내가 선택한 예방 기준',referenceKm:null,referenceMonths:null}),sync({id:'pump',name:'워터펌프',icon:'drop',intervalKm:null,intervalMonths:null,lastKm:null,lastDate:null,basis:'기록 확인 후 관리 · 예시',referenceKm:null,referenceMonths:null})];}
}
