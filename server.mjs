import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { handleTasks, configured } from "./backend/tasks.mjs";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT) || 3000;
const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".mjs":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".ico":"image/x-icon" };

createServer(async (req,res)=>{
 try {
  const {pathname}=new URL(req.url,"http://localhost");
  if(pathname==="/api/tasks") return await handleTasks(req,res);
  if(pathname==="/api/status"){res.writeHead(200,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}).end(JSON.stringify({service:"Chatbliz OS",taskApiConfigured:configured(),authentication:"admin token only; no browser session",sharedTaskUiConnected:false}));return;}
  if(req.method!=="GET"&&req.method!=="HEAD"){res.writeHead(405,{"Content-Type":"text/plain"}).end("Method not allowed");return}
  const publicFiles=new Set(["/","/index.html","/styles.css","/src/app.js","/src/domain.mjs","/workforce/","/workforce/index.html","/workforce/workforce.js","/workforce/business-modules.mjs"]);
  if(!publicFiles.has(pathname)){res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"}).end("Not found");return}
  let file=resolve(join(root,decodeURIComponent(pathname)));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end("Forbidden");return}
  if(file.includes(sep+"data"+sep)||file.includes(sep+"backend"+sep)||file.endsWith(".env")){res.writeHead(403).end("Forbidden");return}
  const info=await stat(file).catch(()=>null);
  if(info?.isDirectory())file=join(file,"index.html");
  const body=await readFile(file);
  res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream","X-Content-Type-Options":"nosniff"});
  res.end(req.method==="HEAD"?undefined:body);
 }catch{res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"}).end("Not found")}
}).listen(port,"0.0.0.0",()=>console.log("Chatbliz listening on port "+port));
