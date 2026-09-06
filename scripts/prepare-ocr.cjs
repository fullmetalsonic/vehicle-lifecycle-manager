// Reproducible local dependency assets, never receipt images.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'ui/vendor/ocr');
fs.mkdirSync(out,{recursive:true});
const copy=(from,to)=>fs.copyFileSync(path.join(root,'node_modules',from),path.join(out,to));
for(const name of ['tesseract.min.js','worker.min.js'])copy('tesseract.js/dist/'+name,name);
fs.mkdirSync(path.join(out,'core'),{recursive:true});
for(const name of fs.readdirSync(path.join(root,'node_modules/tesseract.js-core')))if(/\.wasm(?:\.js)?$/.test(name))copy('tesseract.js-core/'+name,'core/'+name);
// AAPT expands .gz asset names; ship explicitly uncompressed data on every platform.
for(const lang of ['kor','eng']){
 const input=path.join(root,'node_modules/@tesseract.js-data',lang,'4.0.0',lang+'.traineddata.gz');
 fs.writeFileSync(path.join(out,lang+'.traineddata'),require('node:zlib').gunzipSync(fs.readFileSync(input)));
 const obsolete=path.join(out,lang+'.traineddata.gz');if(fs.existsSync(obsolete))fs.unlinkSync(obsolete);
}
console.log('Prepared local OCR runtime and Korean/English models.');
