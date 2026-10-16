/** AI Twin repair queue: separates diagnosis from production execution. */
import {buildTwinTask,evaluateApproval} from "./engine.mjs";
export class TwinQueue {
 constructor(){this.tasks=new Map();this.counter=0}
 enqueue(input){const task=buildTwinTask(input);const id=`twin-${++this.counter}`;const item={...task,id,history:[{state:task.status,at:new Date().toISOString()}]};this.tasks.set(id,item);return structuredClone(item)}
 get(id){const item=this.tasks.get(id);return item?structuredClone(item):null}
 list(){return [...this.tasks.values()].map(x=>structuredClone(x))}
 submitEvidence(id,{summary,testsPassed=false,reviewed=false}={}){const task=this.tasks.get(id);if(!task)throw Error("Task not found");if(typeof summary!=="string"||!summary.trim()||summary.length>2000)throw Error("Invalid evidence");task.evidence.push(summary.trim());task.testsPassed=Boolean(testsPassed);task.reviewed=Boolean(reviewed);task.history.push({state:"evidence-added",at:new Date().toISOString()});return this.get(id)}
 approve(id,{actor,approved}={}){const task=this.tasks.get(id);if(!task)throw Error("Task not found");if(typeof actor!=="string"||!actor.trim())throw Error("Identified approver required");const result=evaluateApproval(task,{approved:approved===true,testsPassed:task.testsPassed===true,reviewed:task.reviewed===true});if(!result.allowed)throw Error(result.reason);task.status="approved";task.approvedBy=actor.trim();task.history.push({state:"approved",at:new Date().toISOString()});return this.get(id)}
 markComplete(id,{result}={}){const task=this.tasks.get(id);if(!task)throw Error("Task not found");if(task.policy!=="automatic"&&task.status!=="approved")throw Error("Approval required");if(typeof result!=="string"||!result.trim())throw Error("Execution evidence required");task.status="completed";task.result=result.trim().slice(0,2000);task.history.push({state:"completed",at:new Date().toISOString()});return this.get(id)}
}
