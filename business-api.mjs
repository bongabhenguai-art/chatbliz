// Authenticated owner-only JSON API for Chatbliz. Single-instance file persistence.
// Configure CHATBLIZ_API_TOKEN (32+ characters) before enabling. No token = API disabled.
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { createLead, updateLead, leadSummary } from "./src/business-crm.js";
import { makeBusinessBriefing } from "./voice-briefings.mjs";
const path = resolve(process.env.CHATBLIZ_DATA_FILE || "./data/business.json");
const secret = process.env.CHATBLIZ_API_TOKEN || "";
const authorized = req => {
  const supplied = (req.headers.authorization || "").replace(/^Bearer /,"");
  if(secret.length<32 || supplied.length!==secret.length)return false;
  return timingSafeEqual(Buffer.from(supplied),Buffer.from(secret));
};
let serial=Promise.resolve();
async function load(){
  try {const data=JSON.parse(await readFile(path,"utf8"));return {leads:Array.isArray(data.leads)?data.leads:[],tasks:Array.isArray(data.tasks)?data.tasks:[]};}
  catch(e){if(e.code==="ENOENT")return {leads:[],tasks:[]};throw e;}
}
async function save(data){
  await mkdir(dirname(path),{recursive:true,mode:0o700});
  const tmp=path+"."+process.pid+".tmp";
  await writeFile(tmp,JSON.stringify(data),{mode:0o600});
  await rename(tmp,path);
}
function send(res,status,body){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}).end(JSON.stringify(body));}
async function body(req){
  let data="";for await(const chunk of req){data+=chunk;if(data.length>16384)throw Error("Request too large");}
  return JSON.parse(data||"{}");
}
export async function businessApi(req,res,pathname){
  if(!pathname.startsWith("/api/business"))return false;
  if(!authorized(req)){send(res,401,{error:"Authorized account connection required"});return true;}
  const ownerId="primary"; // Single-owner API; multi-tenant deployment requires real identity provider.
  const action=async()=>{
    const data=await load();
    if(req.method==="GET"&&pathname==="/api/business/summary"){
      const stats=leadSummary(data.leads,ownerId);
      return {status:200,data:{customers:stats,taskCount:data.tasks.length,paidRevenueZar:null,paidOrders:null,actualReplies:null,confirmedAppointments:null,issuesFixed:null,qualifiedPipelineZar:null,source:"Local owner records only; not independently verified"}};
    }
    if(req.method==="GET"&&pathname==="/api/business/leads")return {status:200,data:{leads:data.leads.filter(l=>l.ownerId===ownerId)}};
    if(req.method==="POST"&&pathname==="/api/business/leads"){
      const input=await body(req);const lead=createLead({...input,ownerId});
      data.leads.push(lead);await save(data);return {status:201,data:{lead}};
    }
    if(req.method==="POST"&&pathname.match(/^\/api\/business\/leads\/[^/]+\/qualify$/)){
      const id=decodeURIComponent(pathname.split("/")[4]);const input=await body(req);
      if(input.customerConfirmed!==true)return {status:400,data:{error:"Explicit customer confirmation required"}};
      const index=data.leads.findIndex(l=>l.id===id&&l.ownerId===ownerId);
      if(index<0)return {status:404,data:{error:"Lead not found"}};
      data.leads[index]=updateLead(data.leads[index],"qualified",{customerConfirmed:true});
      await save(data);return {status:200,data:{lead:data.leads[index]}};
    }
    if(req.method==="GET"&&pathname==="/api/business/briefing"){
      const stats=leadSummary(data.leads,ownerId);
      const briefing=makeBusinessBriefing({paidRevenueZar:null,paidOrders:null,actualReplies:null,confirmedAppointments:null,qualifiedPipelineZar:null,issuesFixed:null,blockers:["Payment and CRM provider verification not connected"],nextActions:["Review "+stats.qualified+" owner-confirmed local leads","Connect verified payment and customer data"]},{businessName:"Chatbliz OS"});
      return {status:200,data:{...briefing,localQualifiedPipelineEstimateZar:stats.qualifiedPipelineZar}};
    }
    return {status:404,data:{error:"Unknown business endpoint"}};
  };
  const pending=serial.then(action);
  serial=pending.catch(()=>{});
  try{const result=await pending;send(res,result.status,result.data);}
  catch(e){send(res,e instanceof SyntaxError?400: e.message==="Request too large"?413: e.message.includes("required")||e.message.includes("Invalid")?400:500,{error:e.message.includes("required")||e.message.includes("Invalid")?e.message:"Business operation failed"});}
  return true;
}
