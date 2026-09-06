// Conservative suggestions only. No manufacturer rules or OCR confidence guarantees.
const aliases=[
 ['엔진오일',/엔진\s*오일|ENGINE\s*OIL/i],['오일필터',/오일\s*(필터|휠터)|필터\s*어셈블리\s*[-－]?\s*오일/i],
 ['에어클리너',/에어\s*(클리너|크리너)|에어\s*필터/i],['에어컨필터',/에어컨\s*필터|캐빈\s*필터/i],
 ['미션오일',/미션\s*오일|변속기\s*오일|ATF/i],['브레이크액',/브레이크\s*(액|오일)/i],
 ['배터리',/배터리|밧데리/i],['워터펌프',/워터\s*펌프/i],['브레이크패드',/브레이크\s*패드/i]];
const amount=s=>{const n=Number(s.replaceAll(',',''));return Number.isSafeInteger(n)&&n>=0&&n<=999999999?n:null;};
export function parseReceipt(text){
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),items=[],warnings=[];
 let date='',km=null,cost=null,shop='';
 const dateLines=lines.filter(l=>/완료|출고|작업일|정비일/.test(l));
 const dates=[...new Set(dateLines.flatMap(l=>[...l.matchAll(/(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})/g)].map(m=>m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'))))];
 if(dates.length===1)date=dates[0];else warnings.push('작업일을 확인해 주세요. 접수일·등록일은 작업일로 자동 선택하지 않아요.');
 const kms=[...new Set(lines.filter(l=>/주행\s*거리|키로수/.test(l)).flatMap(l=>[...l.matchAll(/(?:주행\s*거리|키로수)\s*[:：]?\s*([\d,]+)\s*(?:km|㎞)?/gi)].map(m=>amount(m[1]))).filter(x=>x!==null&&x<=999999))];
 if(kms.length===1)km=kms[0];else warnings.push('실제 주행거리를 확인해 주세요.');
 const totals=[...new Set(lines.filter(l=>!/소계|부품|공임/.test(l)).flatMap(l=>[...l.matchAll(/(?:총\s*액|총\s*계|합계\s*금액|청구\s*금액)\s*[:：]?\s*([\d,]+)/g)].map(m=>amount(m[1]))).filter(x=>x!==null))];
 if(totals.length===1)cost=totals[0];else warnings.push('총비용을 확인해 주세요. 부품비·공임·세금을 중복 합산하지 않아요.');
 if(lines.some(l=>/포인트|할인|쿠폰|지원금/.test(l))){cost=null;warnings.push('할인·포인트가 있어 실제 부담한 총비용을 직접 확인해야 해요.');}
 shop=(lines.find(l=>/^(?:업체명|상호)\s*[:：]/.test(l))||'').replace(/^(?:업체명|상호)\s*[:：]\s*/,'').slice(0,120);
 for(const line of lines){if(/권장|권고|추천|예정|차기|다음|미실시/.test(line))continue;
  for(const [name,re] of aliases){if(!re.test(line))continue;const action=/점검/.test(line)?'inspect':/플러싱|세척|청소/.test(line)?'clean':/보충/.test(line)?'refill':/교환|교체/.test(line)?'replace':'';
   if(!items.some(x=>x.name===name&&x.action===action))items.push({name,action,source:line.slice(0,220)});
  }
 }
 if(!items.length)warnings.push('정비 항목을 찾지 못했어요. 원문을 확인하고 직접 추가해 주세요.');
 if(/견적서/.test(text))warnings.push('견적서일 수 있어요. 실제 작업 완료 여부를 확인하기 전에는 저장하지 마세요.');
 return {date,km,cost,shop,items,warnings};
}
