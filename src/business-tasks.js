// Browser-only task records; not authenticated or connected to customer accounts.
const roles = ["Hunting","Fishing","Closer","Design Influence","Studio","Fixer","Legal Support","Research"];
const steps = {backlog:"ready",ready:"in_progress",in_progress:"done"};
export function createTask({title,role,ownerId}) {
 if(typeof title!=="string"||!title.trim()||title.length>140) throw Error("Enter a valid task title");
 if(!roles.includes(role)||!ownerId) throw Error("Invalid role or owner");
 return {id:crypto.randomUUID(),title:title.trim(),role,ownerId,status:"backlog",createdAt:new Date().toISOString()};
}
export function transitionTask(task,next) {
 if(steps[task.status]!==next) throw Error("Invalid transition");
 return {...task,status:next};
}
export function summarizeTasks(tasks) {
 return {total:tasks.length,completed:tasks.filter(t=>t.status==="done").length,pending:tasks.filter(t=>t.status!=="done").length};
}
export function readTasks(key,ownerId) {
 try {
  const value=JSON.parse(localStorage.getItem(key)||"[]");
  return Array.isArray(value)?value.filter(t=>t&&t.ownerId===ownerId&&roles.includes(t.role)&&["backlog","ready","in_progress","done"].includes(t.status)&&typeof t.title==="string").slice(0,250):[];
 } catch {return [];}
}
export function saveTasks(key,ownerId,tasks) {
 if(!Array.isArray(tasks)||tasks.some(t=>t.ownerId!==ownerId)) throw Error("Owner mismatch");
 localStorage.setItem(key,JSON.stringify(tasks.slice(0,250)));
}
