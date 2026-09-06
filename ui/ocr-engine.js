// All scripts/models are same-origin bundled assets. Image processing stays in the worker.
let library;
function loadLibrary(){return library??=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/vendor/ocr/tesseract.min.js';s.onload=resolve;s.onerror=()=>{library=null;s.remove();reject(Error('OCR 파일을 불러오지 못했어요. 설치 상태를 확인하거나 직접 입력해 주세요.'));};document.head.append(s);});}
export function recognizeReceipt(url,onProgress=()=>{}){
 let worker,cancelled=false,timer,rejectStop;
 const stop=new Promise((_,reject)=>{rejectStop=reject;});
 const run=(async()=>{await loadLibrary();if(cancelled)throw Error('인식을 취소했어요.');
  worker=await Tesseract.createWorker(['kor','eng'],1,{workerPath:location.origin+'/vendor/ocr/worker.min.js',corePath:location.origin+'/vendor/ocr/core',langPath:location.origin+'/vendor/ocr',gzip:false,cacheMethod:'none',logger:m=>{if(!cancelled)onProgress(m);},errorHandler:()=>rejectStop(Error('사진 인식에 실패했어요. 다시 시도하거나 직접 입력해 주세요.'))});
  if(cancelled){await worker.terminate();throw Error('인식을 취소했어요.');}
  await worker.setParameters({preserve_interword_spaces:'1'});const result=await worker.recognize(url);return result.data.text;
 })();
 const cancel=()=>{cancelled=true;worker?.terminate();rejectStop(Error('인식을 취소했어요.'));};
 timer=setTimeout(()=>{cancel();},90000);
 return {cancel,promise:Promise.race([run,stop]).finally(()=>{clearTimeout(timer);worker?.terminate();})};
}
