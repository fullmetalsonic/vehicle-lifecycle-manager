import {escape as esc,fmt} from './components.js';
import {recognizeReceipt} from './ocr-engine.js';
import {parseReceipt} from './receipt-parser.js';
import {allServices,sync,validateRecord,commitRecord} from './schedule.js';
import {receiptHTML,retainReceipt} from './receipts.js';
const $=s=>document.querySelector(s);
export function createOCRReview({getVehicle,open,close,mutate}){
 let job=null,revision=0;
 function cancel(){revision++;job?.cancel();job=null;}
 async function start(receipt,onSaved){
  cancel();const token=revision,v=getVehicle();
  open('사진에서 글자를 읽고 있어요',`<p class="detail-vehicle">${esc(v.name)}</p><p id="ocr-status" role="status">인식을 준비하고 있어요.</p><p class="muted-note">사진 크기와 기기 성능에 따라 시간이 걸릴 수 있어요.</p><button id="ocr-cancel" class="secondary-button">인식 취소</button>`);
  $('#ocr-cancel').onclick=()=>{cancel();close();};
  job=recognizeReceipt(receipt.url,m=>{if(token===revision&&$('#ocr-status'))$('#ocr-status').textContent=m.status==='recognizing text'?'글자 인식 중 · '+Math.round(m.progress*100)+'%':'인식기 준비 중';});
  try{const raw=await job.promise;if(token!==revision||getVehicle().id!==v.id)return;job=null;edit(parseReceipt(raw),raw,receipt,onSaved,v);}
  catch(e){if(token!==revision)return;job=null;open('사진 인식을 완료하지 못했어요',`<p role="alert">${esc(e.message)}</p><p>창을 닫고 사진을 다시 선택하거나 직접 입력할 수 있어요.</p>`);}
 }
 function edit(d,raw,receipt,onSaved,v){
  open('읽은 내용을 확인해 주세요',`<p class="detail-vehicle">${esc(v.name)} · 자동 저장하지 않아요</p><p class="demo-warning">OCR은 글자·금액을 잘못 읽을 수 있어요. 실제로 작업한 항목과 작업 종류만 선택해 주세요. 견적·구매만으로 교환 처리하지 않습니다.</p>${receiptHTML(receipt.id)}<details><summary>인식 원문 보기</summary><pre class="record-note">${esc(raw||'읽은 글자가 없어요.')}</pre></details>${d.warnings.map(w=>`<p class="field-help">${esc(w)}</p>`).join('')}<form id="ocr-form" class="service-form"><label for="ocr-date">실제 작업일</label><input id="ocr-date" type="date" value="${esc(d.date)}"><label for="ocr-km">실제 주행거리 (km)</label><input id="ocr-km" inputmode="numeric" value="${d.km??''}"><label for="ocr-cost">이번 방문 총비용 (원 · 선택)</label><input id="ocr-cost" inputmode="numeric" value="${d.cost??''}"><p class="field-help">여러 항목을 저장해도 총비용은 한 번만 반영해요.</p><label for="ocr-shop">정비소 (선택)</label><input id="ocr-shop" maxlength="120" value="${esc(d.shop)}"><div id="ocr-items"></div><button type="button" id="ocr-add-row" class="secondary-button">항목 직접 추가</button><p id="ocr-error" role="alert" class="form-error"></p><button class="primary-button" type="submit">선택한 내용 확인</button></form>`);
  function row(item={name:'',action:'',source:''}){const div=document.createElement('div');div.className='ocr-item';div.innerHTML=`<label class="check-option"><input type="checkbox" data-use ${item.selected?'checked':''}><span>이 항목 기록하기</span></label><label>항목명<input data-name maxlength="60" value="${esc(item.name)}"></label><label>작업 종류<select data-action><option value="">직접 확인 후 선택</option>${[['replace','교환'],['inspect','점검'],['clean','청소'],['refill','보충'],['adjust','조정·위치교환'],['lubricate','윤활'],['other','수리·기타']].map(([a,l])=>`<option value="${a}" ${item.action===a?'selected':''}>${l}</option>`).join('')}</select></label><label>교환 부품 제조일 (제조일 기준 항목만)<input type="date" data-manufactured value="${item.manufactureDate||''}"></label><p class="field-help">${esc(item.source)}</p>`;$('#ocr-items').append(div);}
  d.items.forEach(row);if(!d.items.length)row();$('#ocr-add-row').onclick=()=>row();
  $('#ocr-form').onsubmit=e=>{e.preventDefault();const int=id=>{const x=$(id).value.trim();return x===''?null:/^\d+$/.test(x)?Number(x):NaN;};
   const selected=[...document.querySelectorAll('.ocr-item')].filter(el=>el.querySelector('[data-use]').checked).map(el=>({selected:true,manufactureDate:el.querySelector('[data-manufactured]').value||null,name:el.querySelector('[data-name]').value.trim(),action:el.querySelector('[data-action]').value,source:el.querySelector('.field-help').textContent}));
   const draft={date:$('#ocr-date').value,km:int('#ocr-km'),cost:int('#ocr-cost'),shop:$('#ocr-shop').value.trim(),items:selected};
   if(!selected.length||selected.some(x=>!x.name||x.name.length>60)){ $('#ocr-error').textContent='실제 작업한 항목을 선택하고 이름을 입력해 주세요.';return;}
   if(new Set(selected.map(x=>x.name.replaceAll(' ','').toLowerCase())).size!==selected.length){$('#ocr-error').textContent='같은 부품이 중복 선택됐어요. 한 항목으로 정리해 주세요.';return;}
   const records=selected.map((item,i)=>{const existing=[...v.services,...(v.planned||[])].find(s=>s.name.replaceAll(' ','').toLowerCase()===item.name.replaceAll(' ','').toLowerCase());const s=existing||sync({id:'custom-'+crypto.randomUUID(),name:item.name,icon:'edit',lastDate:null,lastKm:null,intervalKm:null,intervalMonths:null,basis:'OCR 확인 후 추가 · 주기 미설정',referenceKm:null,referenceMonths:null});return {s,pending:!existing,d:{manufactureDate:item.manufactureDate,date:draft.date,km:draft.km,cost:i===0?draft.cost:null,shop:draft.shop,action:item.action,aligned:false,companions:[],memo:'사진 OCR 확인 기록 · 방문 총비용은 첫 항목에만 반영'}};});
   const error=records.map(r=>validateRecord(v,r.s,r.d)).find(Boolean);if(error){$('#ocr-error').textContent=error;return;}
   open('이 내용으로 기록할까요?',`<p class="detail-vehicle">${esc(v.name)}</p><p>${esc(draft.date)} · ${fmt(draft.km)} km</p><p>방문 총비용: ${draft.cost===null?'미입력':fmt(draft.cost)+'원'}</p><ul>${selected.map(x=>`<li>${esc(x.name)} · ${{replace:'교환',inspect:'점검',clean:'청소',refill:'보충',adjust:'조정',lubricate:'윤활',other:'수리·기타'}[x.action]}</li>`).join('')}</ul><button class="primary-button" id="ocr-save">확인한 기록 저장</button><button class="secondary-button" id="ocr-back">돌아가서 수정</button>`);
   $('#ocr-back').onclick=()=>edit({...draft,warnings:[]},raw,receipt,onSaved,v);
   $('#ocr-save').onclick=()=>{if(v.id!==getVehicle().id)return;const error=records.map(r=>validateRecord(v,r.s,r.d)).find(Boolean);if(error)return;$('#ocr-save').disabled=true;
    mutate(()=>{const visitId=crypto.randomUUID();for(const r of records){if(r.pending)(v.planned??=[]).push(r.s);const entry=commitRecord(v,r.s,r.d);entry.receiptId=receipt.id;entry.visitId=visitId;}retainReceipt(receipt.id);onSaved();},'확인한 OCR 기록을 저장했어요');close();
   };
  };
 }
 return {start,cancel};
}
