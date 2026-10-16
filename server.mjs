import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { handleTasks, configured, authorized } from "./backend/tasks.mjs";
import {askMiniMax,minimaxConfigured,validateMiniMaxRequest} from "./backend/minimax.mjs";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT) || 3000;
const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".mjs":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".ico":"image/x-icon" };

createServer(async (req,res)=>{
 try {
  const {pathname}=new URL(req.url,"http://localhost");
  if(pathname==="/api/ai/chat"){
   const respond=(status,data)=>res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}).end(JSON.stringify(data));
   if(req.method!=="POST")return respond(405,{error:"Method not allowed"});
   if(!authorized(req))return respond(401,{error:"Unauthorized"});
   if(!minimaxConfigured())return respond(503,{error:"MiniMax is not configured"});
   try{let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>6000)return respond(413,{error:"Request too large"})}const message=validateMiniMaxRequest(JSON.parse(raw));const answer=await askMiniMax(message);return respond(200,{answer,provider:"minimax"})}catch(e){return respond(400,{error:e.name==="AbortError"?"Provider timed out":e.message})}
  }
  if(pathname==="/api/tasks") return await handleTasks(req,res);
  if(pathname==="/api/status"){res.writeHead(200,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}).end(JSON.stringify({service:"Chatbliz OS",taskApiConfigured:configured(),authentication:"admin token only; no browser session",sharedTaskUiConnected:false,minimaxConfigured:minimaxConfigured()}));return;}
  if(req.method!=="GET"&&req.method!=="HEAD"){res.writeHead(405,{"Content-Type":"text/plain"}).end("Method not allowed");return}
  const publicFiles=new Set(["/","/index.html","/styles.css","/src/app.js","/src/domain.mjs","/src/journey.mjs","/src/journey-ui.js","/workforce/","/workforce/index.html","/workforce/workforce.js","/workforce/business-modules.mjs","/builder/","/builder/index.html","/builder/builder.js","/builder/project.mjs","/modules/","/modules/index.html","/modules/modules.js","/modules/registry.mjs"]);
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
