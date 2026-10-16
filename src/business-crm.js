// Chatbliz My Business: browser-local, owner-scoped consent-aware CRM.
// No messages, bookings, payments or external actions are performed.
export const STAGES = Object.freeze(["new","qualified","proposal","won","lost"]);
export function createLead({id,name,need,consent,ownerId,estimatedValueZar=0}) {
  if (!ownerId || typeof ownerId!=="string") throw Error("Owner required");
  if (typeof name!=="string" || !name.trim() || name.length>120) throw Error("Customer name required");
  if (typeof need!=="string" || !need.trim() || need.length>500) throw Error("Business need required");
  if (consent!==true) throw Error("Customer consent must be confirmed");
  if (!Number.isFinite(estimatedValueZar)||estimatedValueZar<0) throw Error("Invalid estimate");
  return {id:id||crypto.randomUUID(),ownerId,name:name.trim(),need:need.trim(),consent:true,stage:"new",qualified:false,customerConfirmed:false,estimatedValueZar,createdAt:new Date().toISOString()};
}
export function updateLead(lead,stage,{customerConfirmed=false}={}) {
  if (!STAGES.includes(stage)) throw Error("Invalid pipeline stage");
  if (stage==="won") throw Error("Won requires verified payment reconciliation");
  if (stage==="qualified" && !customerConfirmed) throw Error("Customer confirmation required");
  return {...lead,stage,qualified:stage==="qualified"||stage==="proposal",customerConfirmed:lead.customerConfirmed||customerConfirmed};
}
export function leadSummary(leads,ownerId) {
  const own=leads.filter(l=>l.ownerId===ownerId);
  const qualified=own.filter(l=>l.consent===true&&l.customerConfirmed===true&&l.qualified===true&&["qualified","proposal"].includes(l.stage));
  return {total:own.length,qualified:qualified.length,qualifiedPipelineZar:qualified.reduce((sum,l)=>sum+l.estimatedValueZar,0),stages:Object.fromEntries(STAGES.map(s=>[s,own.filter(l=>l.stage===s).length]))};
}
export function readLeads(key,ownerId) {
  try { const raw=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(raw)?raw.filter(l=>l&&l.ownerId===ownerId&&STAGES.includes(l.stage)&&l.consent===true).slice(0,250):[]; } catch{return [];}
}
export function saveLeads(key,ownerId,leads) {
  if(leads.some(l=>l.ownerId!==ownerId)) throw Error("Owner mismatch");
  localStorage.setItem(key,JSON.stringify(leads.slice(0,250)));
}
