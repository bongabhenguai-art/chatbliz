/** Chatbliz AI Twin: privacy-aware event ledger and learning preferences. */
const ALLOWED_TYPES=new Set(["incident","diagnosis","test-result","owner-correction","approval","execution-result"]);
const SECRET_PATTERN=/(api[_-]?key|authorization|password|access[_-]?token|secret)/i;
export function safeEvent(input){if(!input||typeof input!=="object"||!ALLOWED_TYPES.has(input.type))throw Error("Unsupported event");if(typeof input.summary!=="string"||!input.summary.trim()||input.summary.length>1000)throw Error("Invalid event summary");if(SECRET_PATTERN.test(input.summary))throw Error("Potential credential content");return {id:crypto.randomUUID(),type:input.type,summary:input.summary.trim(),at:new Date().toISOString(),taskId:typeof input.taskId==="string"?input.taskId.slice(0,120):null}}
export class TwinMemory {
 constructor({maxEvents=200}={}){if(!Number.isInteger(maxEvents)||maxEvents<1||maxEvents>10000)throw Error("Invalid capacity");this.maxEvents=maxEvents;this.events=[];this.preferences=new Map()}
 append(input){const event=safeEvent(input);this.events.push(event);if(this.events.length>this.maxEvents)this.events.shift();return event}
 learnPreference(key,value,{ownerApproved=false}={}){if(!ownerApproved)throw Error("Owner approval required");if(typeof key!=="string"||!/^[-a-z0-9_]{1,64}$/.test(key)||SECRET_PATTERN.test(key)||typeof value!=="string"||value.length>1000||SECRET_PATTERN.test(value))throw Error("Invalid preference");this.preferences.set(key,value);return {key,value}}
 forgetPreference(key){return this.preferences.delete(key)}
 snapshot(){return {events:this.events.map(e=>({...e})),preferences:Object.fromEntries(this.preferences)}}
 clear(){this.events=[];this.preferences.clear()}
}
