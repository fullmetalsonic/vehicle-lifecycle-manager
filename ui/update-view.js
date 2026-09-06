import {appVersion} from './app-version.js';
import {checkUpdate,releasePage} from './updates.js';
import {escape as esc} from './components.js';
const key='vehicle-note-startup-update';
function enabled(){try{return localStorage.getItem(key)!=='off';}catch{return false;}}
export function installUpdates({open,toast}){let result=null,inflight;
 async function check(){if(!inflight)inflight=checkUpdate(appVersion).then(value=>{result=value;return value;}).finally(()=>{inflight=null;});return inflight;}
 function view(){open('앱 정보·업데이트',`<p>현재 버전 <strong>${esc(appVersion)}</strong></p><div id="update-result" role="status"></div><button class="primary-button" id="check-update">업데이트 확인</button><p><label><input type="checkbox" id="startup-update" ${enabled()?'checked':''}> 시작할 때 자동 확인</label></p><p class="field-help">확인할 때 GitHub에 접속합니다. 차량 기록·사진은 보내지 않습니다. 다운로드와 설치는 직접 선택하며, 인터넷 없이도 차량 관리는 가능합니다.</p><p><a href="${releasePage}" target="_blank" rel="noopener noreferrer">공개 배포 페이지 열기</a></p><p class="field-help">차계부와 사진은 기기에 보관합니다. 앱 삭제·기기 분실에 대비해 백업 파일을 따로 보관하세요. 정비 기준은 관리 보조 정보이며 차량 설명서와 전문가 판단을 우선합니다.</p>`);
 document.querySelector('#sheet-body').insertAdjacentHTML('beforeend','<p><button class="secondary-button" id="open-notices">오픈소스 고지</button></p>');
 document.querySelector('#open-notices').onclick=()=>open('오픈소스 고지','<iframe title="오픈소스 라이선스" src="third-party.html" sandbox="" style="width:100%;height:60vh;border:0"></iframe>');
 const output=document.querySelector('#update-result'),button=document.querySelector('#check-update');
 const paint=()=>{output.textContent=!result?'최신 버전: 아직 확인하지 않았어요.':result.status==='unavailable'?'최신 버전을 확인하지 못했어요. 네트워크 연결이나 배포 페이지를 확인해 주세요.':`최신 정식 버전 ${result.latest} · ${result.status==='available'?'업데이트가 있어요. 배포 페이지에서 직접 내려받으세요.':'업데이트가 필요하지 않아요.'}`;};paint();
 button.onclick=async()=>{button.disabled=true;output.textContent='최신 버전을 확인하고 있어요…';await check();if(output.isConnected){paint();button.disabled=false;}};
 document.querySelector('#startup-update').onchange=e=>{try{localStorage.setItem(key,e.target.checked?'on':'off');}catch{e.target.checked=false;toast('자동 확인 설정을 저장하지 못했어요');}};
 }
 const badge=document.querySelector('.demo-badge');const button=document.createElement('button');button.className='demo-badge';button.textContent='앱 정보';button.setAttribute('aria-label','앱 정보·업데이트');button.onclick=view;badge.replaceWith(button);
 if(enabled())setTimeout(()=>{check().then(value=>{if(value.status==='available')toast('새 버전이 있어요. 위쪽 앱 정보에서 확인하세요.');});},1000);
}
