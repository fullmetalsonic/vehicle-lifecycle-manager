const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'));
let checks=0;
function ok(value){checks++;assert.ok(value);}
function eq(a,b){checks++;assert.deepEqual(a,b);}
const components=read('components'),policies=read('policies'),sources=read('sources'),bundles=read('labor-bundles');
const profiles=read('management-profiles'),variants=read('rule-variants'),families=read('families');
function ids(rows){const s=new Set(rows.map(x=>x.id));eq(s.size,rows.length);return s;}
const ci=ids(components),pi=ids(policies),si=ids(sources),bi=ids(bundles),fi=ids(families);
eq(components.length,222);eq(policies.length,26);eq(variants.length,20);eq(bundles.length,15);eq(families.length,25);
for(const x of components){ok(x.decision&&x.trigger&&x.applicability);for(const id of x.policy_ids)ok(pi.has(id));for(const id of x.bundle_ids)ok(bi.has(id));eq(x.automatic_replacement,false);}
for(const p of policies){for(const id of p.component_ids)ok(ci.has(id));for(const id of p.sources)ok(si.has(id));ok(fi.has(p.family_id));eq(p.automatic_application,false);}
for(const b of bundles){for(const id of [...b.anchors,...b.companions])ok(ci.has(id));for(const id of b.sources)ok(si.has(id));eq(b.allow_delay_due_item,false);ok(b.requires_consent&&b.requires_quote);}
for(const v of variants){for(const id of v.component_ids)ok(ci.has(id));for(const id of v.sources){ok(si.has(id));ok(!['S38','S50','C01','C02','C03','C04'].includes(id));}ok(v.selected_km===null||v.selected_km<=v.reference_km);eq(v.automatic_application,false);}
eq(ids(profiles.items).size,ci.size);for(const x of profiles.items){ok(ci.has(x.id));eq(x.profile_changes_interval,false);eq(x.record_visible_regardless_of_profile,true);}
for(const p of profiles.packs)eq(profiles.items.filter(x=>x.primary_pack===p.id).length,p.catalog_count);
eq(profiles.packs.map(x=>x.catalog_count),[48,98,46,30]);
for(const p of profiles.profiles)for(const id of p.packs)ok(profiles.packs.some(x=>x.id===id));
for(const a of read('applications'))for(const m of a.members)ok(si.has(m.source));
for(const s of sources){ok(/^https:\/\//.test(s.url));}
const rounding=read('interval-rounding');
function down(km){if(km===null)return null;assert.ok(km>0);return rounding.anchors.filter(x=>x<=km).at(-1)??km;}
for(const [input,output] of rounding.tests)eq(down(input),output);
for(let km=1;km<=500000;km++)ok(down(km)>0&&down(km)<=km);
for(const e of read('service-alignment').examples){const target=(e.mode==='actual'?e.actual:e.basis)+e.interval;eq(target,e.target);eq(target-e.actual,e.actual_usage);eq(e.actual+e.source_interval,e.source_due);eq(Math.min(target,e.source_due),e.reminder);}
// These are executable specification examples, not a deployed app implementation.
function addMonths(date,months){const d=new Date(date+'T00:00:00Z');const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.toISOString().slice(0,10);}
eq(addMonths('2024-02-29',12),'2025-02-28');eq(addMonths('2026-01-31',1),'2026-02-28');eq(addMonths('2025-01-31',1),'2025-02-28');eq(addMonths('2001-09-06',300),'2026-09-06');
function estimate(points,today){const list=points.filter(x=>x.day<=today).sort((a,b)=>a.day-b.day).slice(-3);if(list.length<2)return null;assert.ok(new Set(list.map(x=>x.day)).size===list.length);for(let i=1;i<list.length;i++)assert.ok(list[i].km>=list[i-1].km);const a=list[0],b=list.at(-1);const rate=(b.km-a.km)/(b.day-a.day);return b.km+rate*(today-b.day);}
const pts=[{day:0,km:10000},{day:10,km:10500},{day:20,km:11200}];eq(estimate(pts,30),11800);eq(estimate([...pts,{day:30,km:12000}],40),12750);eq(estimate([{day:0,km:100}],1),null);eq(estimate([{day:0,km:100},{day:1,km:100}],20),100);
checks++;assert.throws(()=>estimate([{day:0,km:100},{day:1,km:99}],2));
function due(km,days){return (km!==null&&km<=1000)||(days!==null&&days<=30);}
eq(due(1000,31),true);eq(due(1001,30),true);eq(due(1001,31),false);eq(due(null,29),true);eq(due(null,null),false);eq(due(-1,null),true);
eq(Math.floor(500000/50000),10);eq(Math.floor(500000/100000),5);
// All proposed quarter-century repeating intervals remain finite and increasing.
for(const interval of [5000,7500,10000,50000,100000,250000]){let prev=0;for(let target=interval;target<=500000;target+=interval){ok(target>prev);prev=target;}}
// Narrow public-tree privacy patterns: no actual log ingestion or credentials allowed.
const banned=[/[A-Za-z]:[\\/](?:Users|Codex|Projects)[\\/]/i,/\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/,/-----BEGIN .*PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{20,}/,/\bsk-[A-Za-z0-9_-]{25,}/,/\b[A-HJ-NPR-Z0-9]{17}\b/,/\b\d{2,3}[가-힣]\d{4}\b/];
for(const dir of ['data','docs'])for(const name of fs.readdirSync(path.join(root,dir))){const content=fs.readFileSync(path.join(root,dir,name),'utf8');for(const re of banned)ok(!re.test(content));}
console.log(JSON.stringify({result:'PASS',checks,components:components.length,policies:policies.length,variants:variants.length,bundles:bundles.length,pack_counts:profiles.packs.map(x=>x.catalog_count),scope:'data integrity and executable design examples; not vehicle safety or app E2E'}));
