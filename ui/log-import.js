// Conservative text-log import. Original UTF-8 text is retained verbatim.
// A dated visit is one record; no inferred replacement clock or invented cost.
const datePattern=/(\d{2,4})년\s*(\d{1,2})월\s*(\d{1,2})일/;
const distancePattern=/(\d[\d,]*(?:\.\d+)?)\s*(만)?\s*km/i;
function dateOf(line){const m=line.match(datePattern);if(!m||line.includes('?'))return null;let year=+m[1];if(year<100)year+=2000;const date=[year,String(+m[2]).padStart(2,'0'),String(+m[3]).padStart(2,'0')].join('-');return Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date?date:null;}
function kmOf(line){const m=line.match(distancePattern);if(!m)return null;const km=Number(m[1].replaceAll(',',''))*(m[2]?10000:1);return Number.isSafeInteger(km)&&km>=0&&km<=999999?km:null;}
export async function parseLog(text,filename='차계부.txt'){
 if(!text.trim()||new TextEncoder().encode(text).length>1024*1024)throw Error('1 MB 이하의 비어 있지 않은 텍스트를 선택해 주세요.');
 if(text.includes('\ufffd'))throw Error('문자 인코딩을 확인해 주세요. UTF-8 텍스트를 지원합니다.');
 const sourceHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const history=[],pendingRecords=[],warnings=[],points=[];
 for(const section of text.split(/^\s*___+\s*$/m)){
  const lines=section.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const markers=lines.map((line,i)=>({i,date:dateOf(line),km:kmOf(line)})).filter(x=>x.date&&x.km!==null);
  if(markers.length){for(let i=0;i<markers.length;i++){const m=markers[i],body=lines.slice(m.i+1,markers[i+1]?.i??lines.length).join('\n');if(!body)continue;
   const id=crypto.randomUUID();history.push({date:m.date,month:Number(m.date.slice(5,7))+'월',day:String(Number(m.date.slice(8))),name:body.split('\n')[0].slice(0,100),km:m.km,cost:null,action:'other',visitId:id,note:'차계부 원문에서 가져온 정비 방문 · 교환시계 자동 변경 없음',memo:body,sourceHeader:lines[m.i],sourceHash});points.push([m.date,m.km]);
   const weekday=lines[m.i].match(/\(([일월화수목금토])\)/);if(weekday&&weekday[1]!=='일월화수목금토'[new Date(m.date).getUTCDay()])warnings.push(`${m.date}: 원문의 요일과 날짜가 달라 숫자 날짜를 사용했습니다.`);
  }}else{const header=lines.find(l=>/^\d[\d,]*(?:\.\d+)?\s*(?:만)?\s*km/i.test(l));if(header){const body=lines.filter(l=>kmOf(l)===null).join('\n');if(body)pendingRecords.push({km:kmOf(header),name:'날짜 확인 필요',memo:body,sourceHeader:header});}}
 }
 history.sort((a,b)=>b.date.localeCompare(a.date));points.sort((a,b)=>a[0].localeCompare(b[0]));
 const unique=[];for(const p of points){const previous=unique.at(-1);if(previous&&((previous[0]===p[0]&&previous[1]!==p[1])||previous[1]>p[1])){warnings.push('날짜별 주행거리 순서 충돌: 자동 주행 추정을 보류합니다.');unique.length=0;break;}if(!previous||previous[0]!==p[0])unique.push(p);}
 const vin=text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/)?.[0]||'';
 const plate=text.match(/(?:^|\n)\s*(\d{2,3}\s*[가-힣]\s*\d{4})/)?.[1]||'';
 return {history,pendingRecords,points:unique,details:{vin,plate,note:''},sourceDocument:{filename,text,sourceHash,warnings},sourceHash};
}
