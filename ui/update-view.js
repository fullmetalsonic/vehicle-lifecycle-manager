import {appVersion} from './app-version.js';
import {checkUpdate,releasePage} from './updates.js';
import {escape as esc} from './components.js';
const key='vehicle-note-startup-update';
function enabled(){try{return localStorage.getItem(key)!=='off';}catch{return false;}}
export function installUpdates({open,toast}){let result=null,inflight;
 async function check(){if(!inflight)inflight=checkUpdate(appVersion).then(value=>{result=value;return value;}).finally(()=>{inflight=null;});return inflight;}
 function view(){open('앱 정보·업데이트',`<p>현재 버전 <strong>${esc(appVersion)}</strong></p><div id="update-result" role="status"></div><button class="primary-button" id="check-update">업데이트 확인</button><p><label class="check-option"><input type="checkbox" id="startup-update" ${enabled()?'checked':''}> 시작할 때 자동 확인</label></p><p class="field-help">GitHub에서 새 버전만 확인합니다. 자동 설치하지 않습니다.</p><p><a href="${releasePage}" target="_blank" rel="noopener noreferrer">공개 배포 페이지 열기</a></p><details class="detail-fold"><summary>데이터 보관·정비 안내</summary><p>기록과 사진은 기기에 보관하며 외부로 보내지 않습니다. 앱 삭제·분실에 대비해 백업 파일을 따로 보관하세요.</p><p>정비 기준은 관리 보조 정보입니다. 차량 설명서와 전문가 판단을 우선하세요.</p></details>`);
 document.querySelector('#sheet-body').insertAdjacentHTML('beforeend','<p><button class="secondary-button" id="open-notices">오픈소스 고지</button></p>');
 document.querySelector('#open-notices').onclick=()=>open('오픈소스 고지','<iframe title="오픈소스 라이선스" src="third-party.html" sandbox="" style="width:100%;height:60vh;border:0"></iframe>');
 const output=document.querySelector('#update-result'),button=document.querySelector('#check-update');
 const paint=()=>{output.textContent=!result?'최신 버전: 아직 확인하지 않았어요.':result.status==='unavailable'?'최신 버전을 확인하지 못했어요. 네트워크 연결이나 배포 페이지를 확인해 주세요.':`최신 정식 버전 ${result.latest} · ${result.status==='available'?'업데이트가 있어요. 배포 페이지에서 직접 내려받으세요.':'업데이트가 필요하지 않아요.'}`;};paint();
 button.onclick=async()=>{button.disabled=true;output.textContent='최신 버전을 확인하고 있어요…';await check();if(output.isConnected){paint();button.disabled=false;}};
 document.querySelector('#startup-update').onchange=e=>{try{localStorage.setItem(key,e.target.checked?'on':'off');}catch{e.target.checked=false;toast('자동 확인 설정을 저장하지 못했어요');}};
 }
 document.querySelector('.demo-badge')?.remove();
 document.addEventListener('click',event=>{if(event.target.closest('[data-app-info]'))view();});
 if(enabled())setTimeout(()=>{check().then(value=>{if(value.status==='available')toast('새 버전이 있어요. 관리의 앱 정보에서 확인하세요.');});},1000);
}
