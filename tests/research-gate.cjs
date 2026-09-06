const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,'..','data',n+'.json'),'utf8'));
const engine=require('./reference-engine.cjs');
const rules=read('implementation-rules'),contract=read('implementation-contract'),launch=read('launch-defaults');
const sources=[...read('sources'),...read('preventive-sources'),...read('implementation-sources')];
let checks=0;function ok(x){checks++;assert.ok(x);}function eq(a,b){checks++;assert.deepEqual(a,b);}
const ci=new Set(read('components').map(x=>x.id)),si=new Set(sources.map(x=>x.id));
eq(si.size,sources.length);eq(launch.rows.length,contract.catalog_count);eq(ci.size,223);
eq(rules.corrections.length,30);eq(new Set(rules.corrections.map(x=>x.component_id)).size,30);
eq(rules.cases.length,32);eq(new Set(rules.cases.map(x=>x.id)).size,32);
for(const c of rules.corrections){
 const r=launch.rows.find(x=>x.component_id===c.component_id);
 ok(r && c.closed && c.decision && c.previous);eq(r.interval_km,c.selected_km);eq(r.interval_months,c.selected_months);
 ok(!r.interval_basis.includes('앱설계예방값'));for(const s of c.source_ids)ok(si.has(s));
 for(const id of c.case_ids)ok(rules.cases.some(x=>x.id===id&&x.component_ids.includes(c.component_id)));
}
const routes=new Set(['periodic_proposal','matched_profile','event','condition']);
for(const r of launch.rows){
 ok(ci.has(r.component_id));ok(routes.has(r.operational_contract.route));
 eq(r.operational_contract.condition_input,'professional_report_v1');ok(r.operational_contract.missing_rule);
 eq(r.operational_contract.review_is_replacement,false);
 for(const s of r.source_ids)ok(si.has(s));
 for(const id of r.implementation_case_ids)ok(rules.cases.some(c=>c.id===id&&c.component_ids.includes(r.component_id)));
 if(r.mode==='주기관리')ok(r.requires_user_opt_in);
}
for(const c of rules.cases){
 if(c.original_distance?.unit==='mile')ok(Math.abs(c.reference_km-c.original_distance.value*1.609344)<0.00001);
 if(c.action==='점검')eq(c.selected_km,c.reference_km);
 for(const id of c.component_ids)ok(ci.has(id));for(const id of c.source_ids)ok(si.has(id));
 for(const p of [c,...(c.first?[c.first]:[])]){
  for(const [ref,selected]of [['reference_km','selected_km'],['reference_months','selected_months']]){
   if(p[ref]===null)eq(p[selected],null);else ok(p[selected]>0&&p[selected]<=p[ref]);
  }
 }
 eq(c.reset_action,({교환:'replace',점검:'inspect',청소:'clean'})[c.action]);
 const input={componentId:c.component_ids[0],serviceProfile:c.when.service_profile,verified:true,fitment:'present',assetPart:c.asset_part,resolvedComponent:c.component_ids[0],optIn:true};
 ok(engine.matchCases(rules.cases,input).some(x=>x.id===c.id));
 for(const patch of [{verified:false},{fitment:'unknown'},{fitment:'absent'},{serviceProfile:'unmatched'}])eq(engine.matchCases(rules.cases,{...input,...patch}).length,0);
 if(c.requires_opt_in)ok(!engine.matchCases(rules.cases,{...input,optIn:false}).some(x=>x.id===c.id));
 if(c.requires_resolved_component)ok(!engine.matchCases(rules.cases,{...input,resolvedComponent:null}).some(x=>x.id===c.id));
}
const get=id=>rules.cases.find(x=>x.id===id),base={state:'serviced_with_record',actualKm:49500,basisKm:50000,date:'2024-02-29'};
eq(engine.schedule(get('N07'),base).km,79500);eq(engine.schedule(get('N07'),base).date,'2026-02-28');
eq(engine.schedule(get('N07'),{state:'original_since_new',actualKm:0,date:'2020-01-31'}).km,200000);
eq(engine.schedule(get('N07'),{state:'unknown'}),{state:'baseline_needed'});
eq(engine.schedule(get('N01'),base).date,null);
eq(get('N20').reference_km,32186.88);eq(get('N20').reset_action,'clean');
eq(get('N22').reference_km,20000);eq(get('N22').reset_action,'replace');
eq(get('N19').reset_action,'inspect');eq(get('N29').reset_action,'inspect');
eq(get('N12').selected_km,30000);eq(get('N13').selected_km,50000);eq(get('N14').selected_months,36);
eq(engine.schedule(get('N18'),{state:'original_since_new',actualKm:0,date:'2020-01-01'}).km,25000);
eq(engine.schedule(get('N18'),{state:'serviced_with_record',actualKm:25000,date:'2021-01-01'}).km,75000);
eq(get('N32').selected_months,48);eq(get('N32').component_ids,['ELE-15']);
const imported=engine.compileVariants(read('rule-variants'));eq(imported.length,20);
for(const v of imported){
 ok(engine.matchCases(imported,{componentId:v.component_ids[0],serviceProfile:v.when.service_profile,verified:true,fitment:'present'}).some(x=>x.id===v.id));
 eq(engine.matchCases(imported,{componentId:v.component_ids[0],serviceProfile:v.when.service_profile,verified:false,fitment:'present'}).length,0);
}
eq(imported.find(v=>v.id==='V20').selected_months,72);
for(const date of ['2026-02-31','invalid','2026-13-01']){checks++;assert.throws(()=>engine.addMonths(date,12));}
checks++;assert.throws(()=>engine.schedule(get('N01'),{...base,basisKm:Infinity}));
const clock={assetId:'left-filter',action:'replace',last:'2020-01-01',km:0};
for(const e of [{assetId:'left-filter',action:'clean',confirmed:true},{assetId:'right-filter',action:'replace',confirmed:true},{assetId:'left-filter',action:'replace',confirmed:false}])eq(engine.resetClock(clock,e),clock);
eq(engine.resetClock(clock,{assetId:'left-filter',action:'replace',confirmed:true,date:'2026-01-01',km:50000}).km,50000);
const measurement={value:19,unit:'mm',operator:'lt',limit:20,limit_unit:'mm',limit_source:'synthetic-test-limit-not-a-vehicle-standard'};
eq(engine.compare(measurement),'outside_limit');
for(const patch of [{limit_source:null},{limit_unit:'bar'},{value:NaN},{limit:null},{operator:'unsupported'}])eq(engine.compare({...measurement,...patch}),'undetermined');
eq(engine.compare({...measurement,value:20}),'within_supplied_limit');
eq(engine.compare({...measurement,value:20,operator:'lte'}),'outside_limit');
eq(engine.compare({...measurement,operator:'outside',lower:10,upper:30}),'within_supplied_limit');
eq(engine.compare({...measurement,operator:'outside',lower:30,upper:10}),'undetermined');
eq(engine.lead(1000,31),true);eq(engine.lead(1001,30),true);eq(engine.lead(1001,31),false);eq(engine.lead(null,null),false);
eq(contract.implementation_research_dependency,false);
console.log(JSON.stringify({result:'PASS',checks,catalog:ci.size,reviewed_defaults:30,additional_source_cases:32,scope:'source linkage, scope isolation, event clocks and executable research contract; not field or app E2E'}));
