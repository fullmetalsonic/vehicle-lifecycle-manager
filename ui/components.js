export const paths={
 home:'M3 10 12 3l9 7M5 9v11h5v-6h4v6h5V9',calendar:'M5 5h14v16H5zM8 2v6m8-6v6M5 10h14m-10 4h2m3 0h2m-7 3h2',
 plus:'M12 5v14M5 12h14',history:'M4 8a9 9 0 1 1-1 7M4 3v5h5m3-1v6l4 2',settings:'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6M9 15v6',
 car:'m3 11 2-6h14l2 6v8H3zM3 11h18M6 15h2m8 0h2M6 19v2m12-2v2',down:'m7 10 5 5 5-5',right:'m9 5 7 7-7 7',close:'m6 6 12 12M6 18 18 6',info:'M12 11v6m0-10v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
 oil:'M4 9h12v10H4zM7 5h6v4m3 2 4-3v6l-4 2M3 12H1',drop:'M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12zm-3 13c0 2 2 3 3 3',filter:'M4 5h16v14H4zM8 5v14m4-14v14m4-14v14',
 trend:'m4 16 5-5 4 3 7-8m-6 0h6v6',edit:'m5 16 10-10 3 3L8 19H5zm9-9 3 3',camera:'M3 7h5l2-3h4l2 3h5v14H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',photo:'M3 3h18v18H3zM3 17l6-7 4 5 3-3 5 6M16 7h.1',check:'m5 12 4 4L19 6'
};
export const icon=(name,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.info}"/></svg>`;
export const fmt=n=>n===null?'미입력':n.toLocaleString('ko-KR');
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function serviceCard(s,r){return `<button class="service-card" data-service="${s.id}"><span class="service-icon ${s.icon==='drop'?'green':''}">${icon(s.icon)}</span><span class="service-copy"><strong>${escape(s.name)}</strong><span class="remaining">${r.label}</span><span class="basis">${r.basis}</span></span>${icon('right','chevron')}</button>`;}
export function historyCard(items){return `<div class="history-card">${items.map((h,i)=>`<button class="history-row" data-history="${h._index??i}"><span class="history-date">${escape(h.month||'')}<b>${escape(h.day||'')}</b></span><span class="history-copy"><strong>${escape(h.name)}</strong><small>${fmt(h.km)} km</small></span><span class="price">${h.cost===null?'비용 미입력':fmt(h.cost)+'원'}</span></button>`).join('')}</div>`;}
