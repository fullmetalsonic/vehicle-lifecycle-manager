import assert from 'node:assert/strict';
import {visits,filterVisits} from './history.js';
const history=[{name:'오일',date:'2026-01-01',visitId:'a',action:'replace',shop:'가상점'},{name:'필터',date:'2026-01-01',visitId:'a',action:'inspect',memo:'먼지'},{name:'별도 방문',date:'2026-01-01',action:'clean'},{name:'배터리 교환',month:'8월',day:'12'}];
assert.equal(visits(history).length,3);assert.equal(filterVisits(history,'가상점').length,1);assert.equal(filterVisits(history,'먼지','inspect')[0].items.length,2);assert.equal(filterVisits(history,'먼지','replace').length,0);assert.equal(filterVisits(history,'','other').length,1);assert.equal(filterVisits(history,'','replace').length,2);assert.equal(filterVisits(history,'없는말').length,0);
console.log('PASS: explicit visit grouping, same-date separation, same-item search/filter intersection, legacy classification');
