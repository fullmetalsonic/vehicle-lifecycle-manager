const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const data=read('preventive-planning'),sources=[...read('sources'),...read('preventive-sources')];
const sourceIds=new Set(sources.map(x=>x.id)),componentIds=new Set(read('components').map(x=>x.id)),bundleIds=new Set(read('labor-bundles').map(x=>x.id));
let checks=0;const ok=x=>{checks++;assert.ok(x);};
ok(sourceIds.size===sources.length);ok(data.rules.length===22);ok(new Set(data.rules.map(x=>x.id)).size===22);
const covered=new Set();
for(const r of data.rules){
  for(const id of r.component_ids){ok(componentIds.has(id));covered.add(id);}
  for(const id of r.sources)ok(sourceIds.has(id));
  for(const id of r.bundle_ids)ok(bundleIds.has(id));
  ok(r.requires_user_opt_in&&!r.automatic_replacement);ok(r.scope&&r.note&&r.action);
  for(const [range,target] of [[r.reference_range_km,r.planning_km],[r.reference_range_months,r.planning_months]]){
    if(range){ok(range.length===2&&range[0]>0&&(range[1]===null||range[1]>=range[0]));ok(target>0&&target<=(range[1]??range[0]));}
    else ok(target===null);
  }
  if(r.planning_km===null&&r.planning_months===null)ok(r.inherit_target);
}
ok(covered.size===23);
ok(data.rules.filter(r=>r.inherit_target).length===5);
ok(Math.abs(data.rules.find(r=>r.id==='PR08').reference_range_km[0]-30000*1.609344)<0.001);
ok(Math.abs(data.rules.find(r=>r.id==='PR02').reference_range_km[1]-100000*1.609344)<0.001);
ok(Math.floor(500000/50000)-Math.floor(500000/80000)===4);
ok(data.rules.find(r=>r.id==='PR07').planning_months===48);
ok(data.remaining_numeric_research.length===0);
const closure=read('research-closure');
ok(closure.original_pending_ids.length===14);ok(closure.resolutions.length===14);
assert.deepEqual([...closure.original_pending_ids].sort(),closure.resolutions.map(x=>x.component_id).sort());checks++;
const ruleMap=new Map(data.rules.map(x=>[x.id,x]));
for(const r of closure.resolutions){
  ok(componentIds.has(r.component_id));ok(r.operating_action&&r.decision);
  ok(r.research_review_closed&&!r.vehicle_validation_complete);
  for(const s of r.source_ids)ok(sourceIds.has(s));
  for(const id of r.rule_ids)ok(ruleMap.get(id)?.component_ids.includes(r.component_id));
}
ok(closure.coverage.length===223);ok(new Set(closure.coverage.map(x=>x.component_id)).size===223);
for(const c of closure.coverage){
  ok(componentIds.has(c.component_id));ok(c.baseline_decision);
  const actual=data.rules.filter(r=>r.component_ids.includes(c.component_id)).map(r=>r.id);
  assert.deepEqual(c.preventive_rule_ids,actual);checks++;
}
for(const r of data.rules){
  const seen=new Set();let current=r;
  while(current?.inherit_target){
    ok(!seen.has(current.id));seen.add(current.id);
    const target=current.inherit_target;
    ok(target==='selected_vehicle_timing_belt'||ruleMap.has(target));
    current=ruleMap.get(target);
  }
}
ok(ruleMap.get('PR17').reference_range_km[1]===null);
ok(Math.abs(ruleMap.get('PR18').reference_range_km[0]-60000*1.609344)<0.001);
ok(ruleMap.get('PR18').scope.includes('N52/N54'));
ok(ruleMap.get('PR16').scope.includes('LB7'));
ok(ruleMap.get('PR20').action==='세척필요성상담');
ok(closure.resolutions.filter(x=>x.decision==='범용교환수치기각').length===4);
// Inheritance is conditional, never a fabricated independent pump lifetime.
const inherit=(rule,confirmedTarget)=>rule.inherit_target?confirmedTarget:null;
ok(inherit(data.rules.find(r=>r.id==='PR09'),100000)===100000);
ok(inherit(data.rules.find(r=>r.id==='PR09'),null)===null);
console.log(JSON.stringify({result:'PASS',checks,rules:data.rules.length,covered_components:covered.size,scope:'research schema and numerical planning checks; no field validation'}));
