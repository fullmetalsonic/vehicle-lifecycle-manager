import {installUpdates} from './update-view.js';
import {showRecoveries,startupImport} from './recovery-view.js';
import {homeGuidance} from './home-guidance.js';
import {createRuleEditor} from './rule-editor.js';
import {APP_MODE,TODAY} from './runtime.js';
import {openBackup} from './backup-view.js';
import {createVehicleView} from './vehicle-view.js';
import {createCatalogView} from './catalog-view.js';
import {migrateLedger,recalculate,saveOdometer} from './ledger.js';
import {createRecordTools} from './record-tools.js';
import {maintenanceWorkspace,bindMaintenanceSearch} from './maintenance-workspace.js';
import {linkHistory} from './catalog-link.js';
import {syncNotifications,openNotificationSettings} from './notifications.js';
import {readState,writeState} from './local-store.js';
import {serializeReceipts,restoreReceipts} from './receipts.js';
import {vehicles,DEMO_DATE,estimate} from './demo-data.js';
import {escape as esc,icon,fmt,serviceCard,historyCard} from './components.js';
import {initializePlans,allServices,timeline} from './schedule.js';
import {upcomingPage,detailContent} from './upcoming.js';
import {createServiceForms} from './service-forms.js';
import {createRecordEntry} from './record-entry.js';
import {createHistory} from './history.js';
import {createManage} from './manage.js';
let restoredActiveId;
const emptyVehicle={id:'empty',name:'차량을 등록해 주세요',meta:'첫 차량 등록',points:[],history:[],services:[],yearCost:null};
const visibleVehicles=()=>vehicles.filter(v=>!v.deletedAt);
if(APP_MODE){try{const saved=await readState();restoredActiveId=saved?.state.activeVehicleId;vehicles.splice(0,vehicles.length,...(saved?.state.vehicles||[]));if(saved)restoreReceipts(saved.photos);}catch(e){document.body.innerHTML='<main style="padding:24px"><h1>저장 데이터를 열지 못했어요</h1><p>기존 데이터를 지우거나 초기화하지 않았습니다. 아래 복구 목록을 확인할 수 있습니다.</p><div id="startup-recoveries"></div></main>';await showRecoveries(document.getElementById('startup-recoveries'));startupImport(document.querySelector('main'));throw e;}}else initializePlans(vehicles);
if(APP_MODE)for(const v of vehicles){linkHistory(v);migrateLedger(v);recalculate(v);}
for(const v of vehicles)for(const s of allServices(v))s.initialPeriod??={intervalKm:s.intervalKm,intervalMonths:s.intervalMonths};
let activeId=visibleVehicles().some(v=>v.id===restoredActiveId)?restoredActiveId:visibleVehicles()[0]?.id,page='home',toastTimer,returnFocus,filter='all',undoSnapshot=null;
const urgent=v=>allServices(v).filter(s=>['soon','overdue'].includes(timeline(v,s).status)).slice(0,3);
const remaining=(v,s)=>{const t=timeline(v,s),e=estimate(v);return {label:t.text,basis:t.measuredOnly?'추정 없이 마지막 실측값으로 확인':t.kmFirst?'거리 기준'+(e.age===0?' · 실측 반영':' · 예상 주행거리 반영'):t.date?`날짜 기준 · ${Number(t.date.slice(5,7))}월 ${Number(t.date.slice(8))}일 예정`:'실제 기록을 먼저 남겨주세요'};};
const $=s=>document.querySelector(s),vehicle=()=>visibleVehicles().find(v=>v.id===activeId)||emptyVehicle;
const dialog=$('#sheet'),body=$('#sheet-body');
const nav=[['home','home','홈'],['upcoming','calendar','정비 예정'],['add','plus','기록 추가'],['history','history','이력'],['manage','settings','관리']];
$('#sheet-close').innerHTML=icon('close');$('#vehicle-info').innerHTML=icon('info');
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
function sheet(title,html){if(!dialog.open)returnFocus=document.activeElement;$('#sheet-title').textContent=title;body.innerHTML=html;if(!dialog.open)dialog.showModal();}
function close(){dialog.close();if(returnFocus?.isConnected)returnFocus.focus();}
$('#sheet-close').onclick=close;dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
let pendingSave=false;
dialog.addEventListener('cancel',e=>{if(pendingSave)e.preventDefault();});
function backupBusy(busy){pendingSave=busy;$('.app-shell').inert=busy;dialog.inert=busy;}
const saveStatus=document.createElement('div');saveStatus.id='save-status';saveStatus.hidden=true;saveStatus.setAttribute('role','status');document.body.append(saveStatus);
async function persist(message){if(!APP_MODE){toast(message);return;}pendingSave=true;$('.app-shell').inert=true;dialog.inert=true;saveStatus.textContent='저장 중…';saveStatus.hidden=false;
 try{const snapshot=JSON.parse(JSON.stringify(vehicles));const ids=snapshot.flatMap(v=>v.history.map(h=>h.receiptId).filter(Boolean));const photos=await serializeReceipts(ids);await writeState({version:1,activeVehicleId:activeId,vehicles:snapshot,receipts:photos.map(({base64,...p})=>p)},photos);pendingSave=false;$('.app-shell').inert=false;dialog.inert=false;saveStatus.hidden=true;toast('저장했어요');syncNotifications(vehicles).catch(()=>toast('기록은 저장됐지만 알림 예약을 갱신하지 못했어요. 알림 설정을 확인하세요.'));}
 catch(e){saveStatus.innerHTML='저장하지 못했어요. 이 화면을 닫지 마세요. <button id="retry-save">다시 저장</button>';document.querySelector('#retry-save').onclick=()=>persist(message);}
}
window.addEventListener('beforeunload',e=>{if(pendingSave){e.preventDefault();e.returnValue='';}});
function mutate(change,message){undoSnapshot=activeId?{id:activeId,data:JSON.parse(JSON.stringify(vehicle()))}:null;change();if(APP_MODE)for(const v of vehicles)recalculate(v);render();persist(message);}
const manageView=createManage({getVehicle:vehicle,open:sheet,close,mutate});
const editRule=createRuleEditor({getVehicle:vehicle,open:sheet,close,mutate});
const catalogView=createCatalogView({getVehicle:vehicle,open:sheet,mutate,editRule});
const recordTools=createRecordTools({getVehicle:vehicle,getVehicles:()=>vehicles,open:sheet,close,mutate,onVehicleRemoved:()=>{activeId=visibleVehicles()[0]?.id;}});
const vehicleView=createVehicleView({open:sheet,close,getVehicle:vehicle,getVehicles:()=>vehicles,mutate,add:v=>{if(APP_MODE){linkHistory(v);migrateLedger(v);recalculate(v);}vehicles.push(v);activeId=v.id;undoSnapshot=null;page='home';render();persist('차량을 등록했어요');}});
const historyView=createHistory({getVehicle:vehicle,open:sheet,mutate});
const forms=createServiceForms({getVehicle:vehicle,open:sheet,close,mutate});
const recordEntry=createRecordEntry({getVehicle:vehicle,open:sheet,forms,mileage,close,mutate});
dialog.addEventListener('close',()=>recordEntry.onClose());
function heading(title,count,target){return `<div class="section-header"><h2>${title}${count?`<span class="count">${count}</span>`:''}</h2><button data-page="${target}">전체 보기</button></div>`;}
function empty(){return `<div class="empty">${icon('history')}<h3>첫 기록을 남겨보세요</h3><p>주행거리를 입력하면<br>차량 관리를 시작할 수 있어요.</p><button class="secondary-button" data-mileage>주행거리 입력</button></div>`;}
function home(v){const e=estimate(v);return `${APP_MODE&&!v.points.length?homeGuidance(v):''}<section class="mileage-card" aria-label="주행거리 요약"><div class="hero-label">${icon('trend')}${e.age===0?'오늘 입력한 실제 주행거리':'오늘의 예상 주행거리'}</div><div class="mileage-number ${e.km===null?'mileage-message':''}">${e.km===null?(e.last?'주행거리 업데이트 필요':'첫 주행거리를 입력해 주세요'):fmt(e.km)}${e.km===null?'':'<small>km</small>'}</div><p class="hero-sub">${e.last?`최근 실측 ${fmt(e.last[1])} km · ${e.age===0?'오늘':e.age+'일 전'}`:'실제 계기판의 거리를 입력해 주세요'}</p><div class="hero-bottom"><span>${e.rate!==null?'최근 기록 기준 · 하루 약 '+Math.round(e.rate)+' km':e.age>90?'90일 이상 지나 거리 추정을 잠시 멈췄어요':v.odometerConflict?'주행거리 기록을 확인해 주세요':'서로 다른 날짜의 실측 기록이 필요해요'}</span><button data-mileage>주행거리 입력 ${icon('right')}</button></div></section>${APP_MODE&&v.points.length?homeGuidance(v):''}${heading('곧 챙겨주세요',urgent(v).length,'upcoming')}${urgent(v).length?urgent(v).map(s=>serviceCard(s,remaining(v,s))).join(''):v.points.length?'<div class="empty"><h3>가까운 정비 일정이 없어요</h3><p>등록된 기록과 기준에 따른 안내예요.</p></div>':empty()}${heading('최근 남긴 기록',null,'history')}${v.history.length?historyCard(v.history.map((h,i)=>({...h,_index:i})).filter(h=>!h.deletedAt)):'<p class="muted-note">아직 정비 기록이 없어요.</p>'}<section class="spend-card"><div><p>올해 정비비</p><strong>${v.yearCost===null?'기록 후 확인할 수 있어요':fmt(v.yearCost)+' <small>원</small>'}</strong></div>${icon('trend')}</section>`;}
function render(){const v=vehicle();$('#vehicle-picker').innerHTML=`<span><span class="vehicle-name">${esc(v.name)}</span><span class="vehicle-meta">${esc(v.meta)}</span></span>${icon('down')}`;
 $('.bottom-nav').innerHTML=nav.map(([id,ic,title])=>`<button class="nav-item" data-page="${id}" ${page===id?'aria-current="page"':''}>${id==='add'?`<span class="add-disc">${icon(ic)}</span>`:icon(ic)}<span>${title}</span></button>`).join('');
 if(page==='home')$('#main').innerHTML=home(v);
 if(page==='upcoming')$('#main').innerHTML=upcomingPage(v,filter);
 if(page==='history'){$('#main').innerHTML=historyView.page();historyView.bind();}
 if(page==='manage'){if(APP_MODE){$('#main').innerHTML=maintenanceWorkspace(v);bindMaintenanceSearch();}else $('#main').innerHTML=manageView.page();}
 if(APP_MODE&&!visibleVehicles().length){$('#main').innerHTML=`<div class="empty"><h2>${page==='manage'?'관리':'첫 차량을 추가하세요'}</h2><button class="primary-button" data-add-vehicle>차량 등록</button><button class="secondary-button" data-backup>백업 불러오기</button>${vehicles.some(v=>v.deletedAt)?'<button class="secondary-button" data-trash>삭제한 차량 복구</button>':''}${page==='manage'?'<button class="secondary-button" data-app-info>앱 정보·업데이트</button>':''}</div>`;return;}
 if(undoSnapshot)$('#main').insertAdjacentHTML('afterbegin','<div class="undo-strip"><span>최근 변경을 되돌릴 수 있어요</span><button data-undo>되돌리기</button></div>');
}
function switchPage(id){if(id==='add'){if(APP_MODE&&!visibleVehicles().length)vehicleView.form();else addSheet();return;}page=id;render();$('#main').scrollTop=0;$('#main').focus({preventScroll:true});}
function chooseVehicle(){sheet('내 차량',visibleVehicles().map(v=>`<button class="option ${v.id===activeId?'selected':''}" data-vehicle="${v.id}">${icon('car')}<span><strong>${esc(v.name)}</strong><small>${v.services.length?'관리 중 '+allServices(v).length+'개':esc(v.meta)}</small></span>${v.id===activeId?icon('check'):''}</button>`).join('')+(APP_MODE?'<button class="primary-button" data-add-vehicle>차량 등록</button>':''));}
function info(){if(APP_MODE&&!visibleVehicles().length)vehicleView.form();else manageView.info();}
function addSheet(){recordEntry.menu();}
function mileage(){if(APP_MODE){recordTools.odometers();return;}const v=vehicle(),e=estimate(v);sheet('주행거리 입력',`<form id="mileage-form"><p class="muted-note">${esc(v.name)} · 2026년 9월 6일 (예시 기준일)</p><label for="mileage">계기판 주행거리 (km)</label><input id="mileage" name="mileage" inputmode="numeric" autocomplete="off" placeholder="예: 148200" value="${e.km??''}" aria-describedby="mileage-error"><p id="mileage-error" class="form-error" role="alert"></p>${APP_MODE?'':'<p class="demo-warning" id="demo-warning">예시 기록이며 새로고침하면 초기화됩니다.</p>'}<button class="primary-button" type="submit">주행거리 저장</button></form>`);
 $('#mileage-form').onsubmit=event=>{event.preventDefault();const raw=$('#mileage').value.trim(),km=Number(raw),last=v.points.at(-1);if(!/^\d+$/.test(raw)||!Number.isSafeInteger(km)||km>999999||(last&&km<last[1])){$('#mileage-error').textContent=last?`최근 실측 ${fmt(last[1])} km 이상, 999,999 km 이하의 정수를 입력해 주세요.`:'0~999,999 사이의 정수를 입력해 주세요.';return;}
 mutate(()=>{if(APP_MODE){const existing=v.odometerEntries?.find(p=>p.date===DEMO_DATE&&!p.deletedAt);saveOdometer(v,{id:existing?.id,date:DEMO_DATE,km});}else{v.points=v.points.filter(p=>p[0]!==DEMO_DATE);v.points.push([DEMO_DATE,km]);}},'예시 주행거리를 반영했어요');close();};}
function service(id){const v=vehicle(),s=allServices(v).find(x=>x.id===id);if(s)sheet(s.name,detailContent(v,s));}

document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.page)switchPage(b.dataset.page);
if(b.hasAttribute('data-backup'))openBackup(sheet,backupBusy);
if(b.dataset.managementMode){const mode=b.dataset.managementMode;mutate(()=>{vehicle().managementMode=mode;vehicle().managePacks=mode==='basic'?['basic']:['basic','major','long','body'];},'관리 화면 표시 범위를 변경했어요');}
if(b.hasAttribute('data-notifications'))openNotificationSettings({getVehicle:vehicle,getVehicles:()=>vehicles,open:sheet,mutate});
if(b.hasAttribute('data-delete-vehicle'))recordTools.removeVehicle();if(b.hasAttribute('data-trash'))recordTools.trash();if(b.hasAttribute('data-odometer-log'))recordTools.odometers();if(b.dataset.fullEdit!==undefined)recordTools.edit(Number(b.dataset.fullEdit));if(b.dataset.removeRecord!==undefined)recordTools.remove(Number(b.dataset.removeRecord));
if(b.hasAttribute('data-connect-catalog'))catalogView.connect();if(b.hasAttribute('data-open-catalog'))catalogView.show();if(b.hasAttribute('data-review-links'))catalogView.review();
if(b.hasAttribute('data-add-vehicle'))vehicleView.form();if(b.hasAttribute('data-edit-vehicle'))vehicleView.form(true);if(b.hasAttribute('data-source-log'))vehicleView.source();
if(b.dataset.pack)manageView.pack(b.dataset.pack);if(b.hasAttribute('data-manage-info'))manageView.info();if(b.hasAttribute('data-manage-alert')){if(APP_MODE)openNotificationSettings({getVehicle:vehicle,getVehicles:()=>vehicles,open:sheet,mutate});else manageView.alerts();}
if(b.dataset.filter){filter=b.dataset.filter;render();document.querySelector('[data-filter="'+filter+'"]').focus();}
if(b.dataset.recordService)forms.record(allServices(vehicle()).find(s=>s.id===b.dataset.recordService));
if(b.dataset.editPeriod){const s=allServices(vehicle()).find(s=>s.id===b.dataset.editPeriod);if(APP_MODE)editRule(s);else forms.editPeriod(s);}
if(b.hasAttribute('data-undo')&&undoSnapshot){const snapshot=undoSnapshot;const target=vehicles.find(v=>v.id===snapshot.id);for(const key of Object.keys(target))if(!Object.hasOwn(snapshot.data,key))delete target[key];Object.assign(target,snapshot.data);activeId=snapshot.id;undoSnapshot=null;render();persist('최근 예시 변경을 되돌렸어요');}
if(b.hasAttribute('data-mileage'))mileage();if(b.hasAttribute('data-info'))info();if(b.hasAttribute('data-dismiss'))close();if(b.dataset.vehicle){activeId=b.dataset.vehicle;filter='all';close();render();if(APP_MODE)persist('차량을 선택했어요');}if(b.dataset.service)service(b.dataset.service);if(b.dataset.history!==undefined)historyView.detail(Number(b.dataset.history));});
$('#vehicle-picker').onclick=chooseVehicle;$('#vehicle-info').onclick=info;$('.brand').onclick=e=>{e.preventDefault();switchPage('home');};render();
if(APP_MODE){document.body.classList.add('real-app');document.title='차량 노트';installUpdates({open:sheet,toast});syncNotifications(vehicles).catch(()=>{});}
let displayedDay=TODAY();document.addEventListener('visibilitychange',()=>{if(APP_MODE&&!document.hidden&&!pendingSave&&displayedDay!==TODAY()){displayedDay=TODAY();for(const v of vehicles)recalculate(v);render();syncNotifications(vehicles).catch(()=>{});}});
window.handleNativeBack=()=>{if(pendingSave)return true;if(dialog.open){close();return true;}if(page!=='home'){switchPage('home');return true;}return false;};
