export const APP_MODE=!!globalThis.Capacitor?.isNativePlatform?.()||(typeof location!=='undefined'&&new URLSearchParams(location.search).get('mode')==='local');
export const TODAY=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
