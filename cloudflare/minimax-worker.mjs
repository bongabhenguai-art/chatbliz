// Cloudflare Worker adapter: install only after production route review.
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  const reply=(status,value)=>new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
  if(path==="/api/ai/health")return reply(200,{service:"Chatbliz MiniMax",configured:Boolean(env.MINIMAX_API_KEY&&env.MINIMAX_MODEL)});
  if(path!=="/api/ai/engineering")return reply(404,{error:"Not found"});
  if(request.method!=="POST")return reply(405,{error:"Method not allowed"});
  if(!env.CHATBLIZ_ADMIN_TOKEN||request.headers.get("authorization")!=="Bearer "+env.CHATBLIZ_ADMIN_TOKEN)return reply(401,{error:"Unauthorized"});
  if(!env.MINIMAX_API_KEY||!env.MINIMAX_MODEL)return reply(503,{error:"MiniMax not configured"});
  const raw=await request.text();if(raw.length>12000)return reply(413,{error:"Too large"});
  let body;try{body=JSON.parse(raw)}catch{return reply(400,{error:"Invalid JSON"})}
  if(!["architecture","performance","operations","advisor","backend","frontend"].includes(body?.area)||typeof body?.observations!=="string"||!body.observations.trim()||body.observations.length>10000)return reply(400,{error:"Invalid brief"});
  const prompt="Provide an evidence-based Chatbliz OS engineering review for "+body.area+". Distinguish facts and assumptions; propose fixes, tests and rollback. Do not claim changes were deployed. Evidence: "+body.observations;
  try{
   const response=await fetch("https://api.minimax.io/v1/chat/completions",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+env.MINIMAX_API_KEY},body:JSON.stringify({model:env.MINIMAX_MODEL,messages:[{role:"user",content:prompt}],max_tokens:700}),signal:AbortSignal.timeout(25000)});
   if(!response.ok)return reply(502,{error:"MiniMax upstream error",status:response.status});
   const data=await response.json();const advice=data?.choices?.[0]?.message?.content;
   if(typeof advice!=="string"||!advice.trim())return reply(502,{error:"No provider response"});
   return reply(200,{provider:"minimax",mode:"advisory-only",advice});
  }catch{return reply(502,{error:"MiniMax connection failed"})}
 }
};
