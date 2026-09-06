import {validateState,readState,writeState} from './local-store.js';
export const MAX_BACKUP=50*1024*1024;
const hash=async text=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function encodeBackup(snapshot){
 const payload=JSON.stringify(snapshot);const text=JSON.stringify({format:'vehicle-note-backup',version:1,createdAt:new Date().toISOString(),sha256:await hash(payload),payload});
 if(new Blob([text]).size>MAX_BACKUP)throw Error('백업은 50 MB까지 지원합니다.');await decodeBackup(text);return text;
}
export async function decodeBackup(text){
 if(new Blob([text]).size>MAX_BACKUP)throw Error('50 MB 이하의 백업을 선택해 주세요.');
 const envelope=JSON.parse(text);
 if(envelope.format!=='vehicle-note-backup'||envelope.version!==1||typeof envelope.payload!=='string'||await hash(envelope.payload)!==envelope.sha256)throw Error('지원하지 않거나 손상된 백업입니다.');
 const snapshot=JSON.parse(envelope.payload),state=validateState(snapshot.state);
 // Reject unsafe keys and identifiers before any imported data reaches a template.
 function check(value,depth=0){if(depth>25)throw Error('백업 구조가 너무 복잡합니다.');if(!value||typeof value!=='object')return;for(const [key,v] of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(key))throw Error('잘못된 백업 필드입니다.');if((key==='id'||key.endsWith('Id'))&&v!=null&&(typeof v!=='string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(v)))throw Error('잘못된 식별자입니다.');check(v,depth+1);}}
 check(state);
 const numeric=new Set(['km','cost','yearCost','intervalKm','intervalMonths','lastKm','basisKm','referenceKm','referenceMonths','target']);
 const dates=new Set(['date','lastDate']);
 const strings=new Set(['name','meta','month','day','note','memo','shop','plate','vin','spec','basis','last','period','icon','action']);
 function typed(value){if(!value||typeof value!=='object')return;for(const [key,v]of Object.entries(value)){if(numeric.has(key)&&v!=null&&(!Number.isFinite(v)||v<0))throw Error('숫자 필드 오류');if(dates.has(key)&&v!=null&&(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw Error('날짜 필드 오류');if(strings.has(key)&&v!=null&&typeof v!=='string')throw Error('문자 필드 오류');if(v!=null&&['companions','edits','managePacks','assetIds','planned'].includes(key)&&!Array.isArray(v))throw Error('목록 필드 오류');typed(v);}}typed(state);
 for(const v of state.vehicles){if(typeof v.meta!=='string')throw Error('차량 설명이 올바르지 않습니다.');for(const p of v.points)if(!Array.isArray(p)||!/^\d{4}-\d{2}-\d{2}$/.test(p[0])||!Number.isFinite(Date.parse(p[0]))||!Number.isFinite(p[1])||p[1]<0)throw Error('주행거리 기록 오류');for(const h of v.history)if(typeof h.name!=='string'||!Number.isFinite(h.km)||(h.cost!=null&&!Number.isFinite(h.cost)))throw Error('정비 기록 오류');for(const s of [...v.services,...(v.laterServices||[])])if(typeof s.name!=='string'||typeof s.id!=='string')throw Error('관리 항목 오류');}
 for(const v of state.vehicles){if(v.planned&&!Array.isArray(v.planned))throw Error('관리 항목 오류');for(const s of [...v.services,...(v.planned||[])]){if(!s||typeof s.name!=='string'||typeof s.id!=='string')throw Error('관리 항목 오류');for(const key of ['intervalMonths','referenceMonths'])if(s[key]!=null&&(!Number.isInteger(s[key])||s[key]>1200))throw Error('기간 주기 오류');for(const c of s.companions||[])if(!c||typeof c.id!=='string'||typeof c.name!=='string'||typeof c.reason!=='string')throw Error('동반 항목 오류');}for(const h of v.history)for(const e of h.edits||[])if(!e||!e.before||typeof e.before!=='object'||!e.after||typeof e.after!=='object')throw Error('수정 이력 오류');}
 if(!Array.isArray(snapshot.photos)||snapshot.photos.length!==state.receipts.length||new Set(state.receipts.map(p=>p.id)).size!==state.receipts.length)throw Error('사진 목록이 일치하지 않습니다.');
 const ids=new Set();for(const p of snapshot.photos){if(!/^[a-f0-9-]{36}$/i.test(p.id)||ids.has(p.id)||!['image/png','image/jpeg','image/webp'].includes(p.type)||typeof p.name!=='string'||typeof p.base64!=='string')throw Error('사진 정보 오류');ids.add(p.id);const bytes=Uint8Array.from(atob(p.base64),c=>c.charCodeAt(0));if(!bytes.length||bytes.length>10*1024*1024||bytes.length!==p.size)throw Error('사진 크기 오류');const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(digest!==p.hash||!state.receipts.some(r=>r.id===p.id&&r.hash===p.hash))throw Error('사진 무결성 오류');}
 for(const v of state.vehicles)for(const h of v.history)if(h.receiptId&&!ids.has(h.receiptId))throw Error('첨부 사진이 빠진 백업입니다.');
 return snapshot;
}
export async function restoreBackup(snapshot){
 const current=await readState(),added=structuredClone(snapshot);const ids=new Map();
 for(const p of added.photos){const next=crypto.randomUUID();ids.set(p.id,next);p.id=next;}
 for(const v of added.state.vehicles){v.id=crypto.randomUUID();v.name+=' (복원)';for(const h of v.history)if(h.receiptId)h.receiptId=ids.get(h.receiptId);}
 const photos=[...(current?.photos||[]),...added.photos];
 await writeState({version:1,vehicles:[...(current?.state.vehicles||[]),...added.state.vehicles],receipts:photos.map(({base64,...p})=>p)},photos);
}
export async function exportFile(text){
 const filename='vehicle-note-'+new Date().toISOString().replaceAll(':','-')+'.json';
 if(globalThis.Capacitor?.isNativePlatform?.()){const {registerPlugin}=await import('/vendor/capacitor.js');return (await registerPlugin('VehicleStore').exportBackup({text,filename}))||{};}
 const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);return {download:true};
}
