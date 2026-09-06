// Local preview only. Serves this UI folder, never the parent/private workspace.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=process.env.VEHICLE_UI_MOBILE==='1'?path.resolve(__dirname,'../dist-mobile'):__dirname,port=Number(process.env.VEHICLE_UI_PORT||4178);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.wasm':'application/wasm','.gz':'application/gzip','.traineddata':'application/octet-stream'};
http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 const target=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!target.startsWith(root+path.sep)||!Object.hasOwn(types,path.extname(target))){res.writeHead(404).end();return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(target)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);});
}).listen(port,'127.0.0.1',()=>console.log(`Vehicle UI preview: http://127.0.0.1:${port}`));
