import {allServices} from './schedule.js';
export function homeGuidance(v){
 if(!v.history.some(h=>!h.deletedAt)&&!v.points.length)return `<section class="first-steps" aria-label="처음 사용 안내"><h2>세 단계로 시작해 보세요</h2><p>차량 정보를 확인하고, 실제 기록을 남기면 다음 정비를 볼 수 있어요.</p><div><button data-edit-vehicle>1. 차량 설정</button><button data-page="add">2. 첫 기록 남기기</button><button data-page="upcoming">3. 정비 예정 보기</button></div></section>`;
 const unset=allServices(v).filter(s=>!s.intervalKm&&!s.intervalMonths).length;
 return unset?`<button class="setup-reminder" data-page="manage"><span>관리 기준 확인</span><small>${unset}개 항목은 고정 주기가 없어요. 상태 관리 또는 적용할 기준을 확인하세요.</small></button>`:'';
}
