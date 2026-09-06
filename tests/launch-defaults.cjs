const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const d=read('launch-defaults'),cs=read('components'),ps=read('policies'),vs=read('rule-variants'),bs=read('labor-bundles'),pr=read('preventive-planning').rules;
let checks=0;const ok=x=>{checks++;assert.ok(x);},ids=x=>new Set(x.map(r=>r.id));
ok(d.rows.length===222);ok(new Set(d.rows.map(r=>r.component_id)).size===222);
const ci=ids(cs),pi=ids(ps),vi=ids(vs),bi=ids(bs),pri=ids(pr);
for(const r of d.rows){
 ok(ci.has(r.component_id));ok(r.status==='확정');ok(r.criteria.length>10);
 for(const p of r.source_policy_ids)ok(pi.has(p));
 for(const v of r.exact_variant_ids)ok(vi.has(v));
 for(const b of r.bundle_ids)ok(bi.has(b));
 for(const p of r.researched_plan_ids)ok(pri.has(p));
 for(const k of ['interval_km','interval_months','review_km','review_months'])ok(r[k]===null||(Number.isFinite(r[k])&&r[k]>0));
 if(r.mode==='주기관리')ok(r.interval_km!==null||r.interval_months!==null);
 if(r.mode==='작업·사건연동')ok(r.event);
 if(['측정판정교환','구조별주기'].includes(r.mode))ok(r.review_km&&r.review_months);
 ok(r.replacement_clock_reset&&r.service_clock_reset);
 ok(!/남은조사|추후결정|미정|TBD/.test(r.criteria));
}
const get=id=>d.rows.find(r=>r.component_id===id);
ok(get('ENG-01').interval_km===10000&&get('ENG-01').interval_months===12);
ok(get('TRN-01').interval_km===50000);
ok(get('ELE-01').subtype_rules.find(r=>r.when==='lithium_low_voltage').months===null);
ok(get('COO-10').required_subtype.includes('고무'));
ok(get('BDY-12').interval_km===null&&get('BDY-12').interval_months===null);
ok(get('BRK-03').criteria.includes('MIN TH'));
ok(get('FUE-06').required_subtype.includes('제어기제외'));
ok(get('TIM-04').event);
const due=(actual,basis,interval,sourceInterval)=>Math.min(basis+interval,sourceInterval===null?Infinity:actual+sourceInterval);
ok(due(49500,50000,50000,50000)===99500);
ok(due(49500,50000,50000,null)===100000);
for(const r of d.rows)for(const [field,horizon]of [['interval_km',500000],['interval_months',300]]){
 const n=r[field];if(n!==null){const count=Math.floor(horizon/n);ok(count>=0&&Number.isFinite(count));}
}
console.log(JSON.stringify({result:'PASS',checks,components:d.rows.length,modes:d.rows.reduce((a,r)=>(a[r.mode]=(a[r.mode]||0)+1,a),{}),scope:'final policy data validation'}));
