import {allServices} from './schedule.js';
export function homeGuidance(v){
 if(!v.history.some(h=>!h.deletedAt)&&!v.points.length)return `<section class="first-steps" aria-label="처음 사용 안내"><h2>첫 정비 기록을 남겨보세요</h2><div><button data-edit-vehicle>1. 차량 설정</button><button data-page="add">2. 첫 기록 남기기</button><button data-page="upcoming">3. 정비 예정 보기</button></div></section>`;
 const unset=allServices(v).filter(s=>!s.intervalKm&&!s.intervalMonths).length;
 return unset?`<button class="setup-reminder" data-page="manage"><span>관리 기준 확인</span><small>${unset}개 항목 · 상태 관리 또는 주기 설정</small></button>`:'';
}
