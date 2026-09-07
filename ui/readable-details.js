import {escape as esc,fmt} from './components.js';
import {actions} from './ledger.js';
import {periodText} from './schedule.js';
const row=(label,value)=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
export function revisionSummary(value={}){
 const labels={name:'항목',date:'작업일',km:'주행거리',cost:'비용',action:'작업',shop:'정비소',memo:'메모',alignedKm:'계산 기준 거리'};
 return Object.entries(labels).filter(([key])=>Object.hasOwn(value,key)).map(([key,label])=>{
 const v=value[key];const text=v==null||v===''?'미입력':key==='action'?(actions[v]||'기타'):key==='km'||key==='alignedKm'?fmt(v)+' km':key==='cost'?fmt(v)+'원':String(v);
 return `${label}: ${text}`;
 }).join(' · ')||'변경 내용 없음';
}
export function profileDescription(profile,sourceList=[]){
 if(!profile)return '';
 const period=(km,months)=>periodText({intervalKm:km,intervalMonths:months});
 let html='<dl class="detail-list">'+row('적용 대상',profile.scope||profile.when?.service_profile?.replaceAll('_',' ')||'원문 적용조건 확인')+row('작업',profile.action||actions[profile.reset_action]||'교환')+row('선택 주기',period(profile.selected_km,profile.selected_months))+row('원문 기준',period(profile.reference_km,profile.reference_months));
 if(profile.first)html+=row('최초 주기',period(profile.first.selected_km,profile.first.selected_months))+row('최초 원문 기준',period(profile.first.reference_km,profile.first.reference_months));
 if(profile.asset_part)html+=row('세부 부품',profile.asset_part);
 if(profile.event)html+=row('작업 조건',profile.event==='battery_assembly_replaced'?'배터리 어셈블리 교환':profile.event==='slow_LPG_refill'?'LPG 충전 지연':profile.event);
 html+='</dl>';
 for(const note of [profile.note,profile.warning])if(note)html+=`<p>${esc(note)}</p>`;
 if(profile.requires_resolved_component)html+='<p>실제 작업할 세부 부품을 지정해야 합니다.</p>';
 if(profile.requires_exact_fitment_and_current_procedure)html+='<p>정확한 장착 사양과 최신 정비 절차를 확인하세요.</p>';
 html+=(profile.source_ids||profile.sources||[]).map(id=>{const source=sourceList.find(s=>s.id===id);return source?`<p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></p>`:'';}).join('');
 return html;
}
