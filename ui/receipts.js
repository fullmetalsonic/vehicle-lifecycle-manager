// Local object URLs only. No upload, OCR request, persistent storage, or image alteration.
import {escape as esc} from './components.js';
const receipts=new Map();
export async function loadReceipt(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('JPG, PNG, WebP 사진을 선택해 주세요.');
 if(!file.size||file.size>10*1024*1024)throw Error('10 MB 이하의 사진을 선택해 주세요.');
 const url=URL.createObjectURL(file);
 try{const image=new Image();image.src=url;await image.decode();if(image.naturalWidth*image.naturalHeight>25000000)throw Error('사진 크기가 너무 큽니다. 2,500만 화소 이하로 선택해 주세요.');
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const r={blob:file,id:crypto.randomUUID(),url,name:file.name,size:file.size,hash,saved:false};receipts.set(r.id,r);return r;
 }catch(e){URL.revokeObjectURL(url);throw Error(e.message?.includes('화소')?e.message:'사진을 열 수 없어요. 다른 사진을 선택해 주세요.');}
}
export const getReceipt=id=>receipts.get(id);
export function discardReceipt(id){const r=receipts.get(id);if(r&&!r.saved){URL.revokeObjectURL(r.url);receipts.delete(id);}}
export function retainReceipt(id){const r=receipts.get(id);if(r)r.saved=true;}
export function receiptHTML(id,expanded=false){const r=getReceipt(id);return r?`<details class="receipt-preview" ${expanded?'open':''}><summary>첨부 사진 · ${esc(r.name)}</summary><a href="${r.url}" target="_blank" rel="noopener" aria-label="첨부 사진 크게 보기"><img src="${r.url}" alt="선택한 정비 영수증 사진"></a><p>사진을 누르면 크게 볼 수 있어요. 현재 브라우저에서만 보관합니다.</p></details>`:'';}
export async function serializeReceipts(ids){return Promise.all([...new Set(ids)].map(async id=>{const r=receipts.get(id);if(!r?.blob)throw Error('첨부 사진을 찾지 못했습니다. 저장을 중단합니다.');const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(r.blob);});return {id:r.id,name:r.name,size:r.size,hash:r.hash,type:r.blob.type,base64};}));}
export function restoreReceipts(photos){for(const p of photos){const bytes=Uint8Array.from(atob(p.base64),c=>c.charCodeAt(0)),blob=new Blob([bytes],{type:p.type});receipts.set(p.id,{...p,blob,url:URL.createObjectURL(blob),saved:true});}}
