// Executable research contract, not the mobile app or an autonomous diagnosis tool.
const finite = n => typeof n === 'number' && Number.isFinite(n);
function compileVariants(variants) {
  return variants.map(v=>({id:v.id,component_ids:v.component_ids,source_ids:v.sources,
    when:{service_profile:v.id+'_confirmed'},scope:v.scope,action:v.action,
    reference_km:v.reference_km,reference_months:v.months,selected_km:v.selected_km,selected_months:v.months,
    reset_action:v.action==='교환'?'replace':v.action==='청소'?'clean':'inspect'}));
}
function matchCases(cases, input) {
  if (!input.verified || input.fitment !== 'present') return [];
  return cases.filter(r => r.component_ids.includes(input.componentId)
    && r.when.service_profile === input.serviceProfile
    && (!r.asset_part || r.asset_part === input.assetPart)
    && (!r.requires_opt_in || input.optIn === true)
    && (!r.requires_resolved_component || input.resolvedComponent === input.componentId));
}
function addMonths(iso, months) {
  const d = new Date(iso + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0,10)!==iso || !Number.isInteger(months) || months < 0) throw Error('invalid date/months');
  const day = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(Math.min(day, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 0)).getUTCDate()));
  return d.toISOString().slice(0,10);
}
function schedule(rule, history) {
  for (const k of ['actualKm','basisKm']) if (history[k]!=null && (!finite(history[k]) || history[k]<0)) throw Error('invalid odometer');
  if (!['original_since_new','serviced_with_record','replaced_with_record'].includes(history.state)) return {state:'baseline_needed'};
  const p = history.state === 'original_since_new' && rule.first ? rule.first : rule;
  const sourceKm = finite(p.reference_km) && finite(history.actualKm) ? history.actualKm+p.reference_km : null;
  const selectedKm = finite(p.selected_km) && finite(history.actualKm) ? (history.basisKm ?? history.actualKm)+p.selected_km : null;
  const km = [sourceKm,selectedKm].filter(finite);
  const dates = [p.reference_months,p.selected_months].filter(finite).map(m=>history.date ? addMonths(history.date,m) : null).filter(Boolean).sort();
  return {state:km.length || dates.length ? 'scheduled' : 'baseline_needed', km:km.length ? Math.min(...km) : null, date:dates[0]??null, sourceKm, selectedKm};
}
function compare(m) {
  if (!finite(m.value) || !m.limit_source || m.unit !== m.limit_unit) return 'undetermined';
  if (m.operator === 'outside') {
    if (!finite(m.lower) || !finite(m.upper) || m.lower > m.upper) return 'undetermined';
    return m.value < m.lower || m.value > m.upper ? 'outside_limit' : 'within_supplied_limit';
  }
  if (!finite(m.limit)) return 'undetermined';
  const f={lt:(a,b)=>a<b,lte:(a,b)=>a<=b,gt:(a,b)=>a>b,gte:(a,b)=>a>=b}[m.operator];
  return f ? (f(m.value,m.limit) ? 'outside_limit' : 'within_supplied_limit') : 'undetermined';
}
function resetClock(clock, event) {
  return event.assetId===clock.assetId && event.action===clock.action && event.confirmed===true
    ? {...clock,last:event.date,km:event.km} : clock;
}
function lead(km, days) { return (finite(km)&&km<=1000)||(finite(days)&&days<=30); }
module.exports={compileVariants,matchCases,addMonths,schedule,compare,resetClock,lead};
