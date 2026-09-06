// Deliberately synthetic. Never import the owner's private maintenance log here.
import {APP_MODE,TODAY} from './runtime.js';
export const DEMO_DATE = APP_MODE?TODAY():'2026-09-06';
export const vehicles = [
 {id:'santa',name:'싼타페 DM',meta:'디젤 · 2륜',points:[['2026-08-07',146400],['2026-08-17',147000],['2026-08-27',147600]],yearCost:620000,
  services:[{id:'oil',name:'엔진오일',icon:'oil',target:149000,period:'10,000 km 또는 12개월',basis:'내가 선택한 예방 기준',last:'2025. 11. 20 · 139,000 km'}, {id:'brake',name:'브레이크액',icon:'drop',date:'2026-09-30',period:'24개월',basis:'예방 선택 · 화면 설명용',last:'2024. 09. 30 · 115,000 km'}],
  history:[{month:'8월',day:'12',name:'배터리 교환',km:146700,cost:180000,note:'시안용 정비 기록입니다.'},{month:'6월',day:'20',name:'에어컨 필터 교환',km:143000,cost:28000,note:'사진과 메모가 보관될 영역입니다.'}]},
 {id:'sorento',name:'쏘렌토 MQ4',meta:'하이브리드 · 4륜',points:[['2026-08-13',27200],['2026-08-23',27800],['2026-09-02',28400]],yearCost:156000,
  services:[{id:'cabin',name:'에어컨 필터',icon:'filter',date:'2026-09-28',period:'12개월',basis:'예방 선택 · 화면 설명용',last:'2025. 09. 28 · 11,400 km'}],
  history:[{month:'7월',day:'18',name:'엔진오일 · 오일필터 교환',km:25600,cost:128000,note:'같은 방문에 교환한 항목을 함께 보여줍니다.'}]},
 {id:'new',name:'새 차량',meta:'첫 기록 전 · 빈 화면 예시',points:[],yearCost:null,services:[],history:[]}
];
export function estimate(v,onDate=APP_MODE?TODAY():DEMO_DATE) {
 const p=[...new Map(v.points.filter(p=>p[0]<=onDate).sort((a,b)=>a[0].localeCompare(b[0])).map(p=>[p[0],p[1]]))].slice(-3); if(!p.length)return {km:null,rate:null,last:null,age:null};
 const first=p[0],last=p.at(-1),days=(Date.parse(last[0])-Date.parse(first[0]))/86400000;
 const rate=days>0?(last[1]-first[1])/days:null;
 const age=(Date.parse(onDate)-Date.parse(last[0]))/86400000;
 return {km:v.odometerConflict||age>90||rate<0?null:age===0?last[1]:rate!==null?Math.round(last[1]+rate*age):null,rate:v.odometerConflict||age>90||rate<0?null:rate,last,age};
}
export function remaining(v,s) {
 if(s.target!==undefined){const e=estimate(v);const n=e.km===null?null:s.target-e.km;return {label:n===null?'주행거리 입력 필요':n<0?`${Math.abs(n).toLocaleString('ko-KR')} km 초과`:`약 ${n.toLocaleString('ko-KR')} km 남음`,basis:n===null?'실제 기록을 먼저 남겨주세요':`거리 기준${e.age===0?' · 실측 반영':' · 예상 주행거리 반영'}`};}
 const days=Math.round((Date.parse(s.date)-Date.parse(DEMO_DATE))/86400000);
 return {label:days<0?`${Math.abs(days)}일 초과`:`${days}일 남음`,basis:`날짜 기준 · ${Number(s.date.slice(5,7))}월 ${Number(s.date.slice(8))}일 예정`};
}
