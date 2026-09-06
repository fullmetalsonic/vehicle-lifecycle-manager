export const conditionOptions={
 fuel:[['unknown','모름'],['gasoline','가솔린'],['diesel','디젤'],['hev','하이브리드'],['phev','플러그인 하이브리드'],['bev','전기'],['lpg','LPG'],['other','기타']],
 drive:[['unknown','모름'],['2wd','2륜'],['4wd','4륜']],
 transmission:[['unknown','모름'],['at','자동변속기 (AT)'],['dct','DCT'],['cvt','CVT'],['mt','수동'],['power-split','동력분기형'],['other','기타']],
 battery:[['unknown','모름'],['flooded','일반 납산'],['efb','EFB'],['agm','AGM'],['lithium','리튬 계열']]
};
export function vehicleFromFields(fields){
 const name=fields.name?.trim();if(!name||name.length>60)throw Error('차량 이름을 1~60자로 입력해 주세요.');
 const conditions={};for(const [key,choices]of Object.entries(conditionOptions)){const value=fields[key]||'unknown';if(!choices.some(([id])=>id===value))throw Error('차량 조건을 확인해 주세요.');conditions[key]=value;}
 if(!['all','basic'].includes(fields.mode))throw Error('관리 모드를 선택해 주세요.');
 return {id:crypto.randomUUID(),name,conditions,meta:Object.entries(conditions).filter(([key,value])=>['fuel','drive'].includes(key)&&value!=='unknown').map(([key,value])=>conditionOptions[key].find(([id])=>id===value)[1]).join(' · ')||'차량 조건 미확인',managementMode:fields.mode,managePacks:fields.mode==='all'?['basic','major','long','body']:['basic'],points:[],services:[],history:[],yearCost:null};
}
