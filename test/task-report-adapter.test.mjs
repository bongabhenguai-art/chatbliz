import test from "node:test";
import assert from "node:assert/strict";
import { TaskEngine } from "../task-engine.mjs";
import { taskReport } from "../task-report-adapter.mjs";
test("owner scoped counts and unknown commercial results",()=>{
 const engine=new TaskEngine({id:(()=>{let n=0;return()=>String(++n)})()});
 const a=engine.create({ownerId:"a",title:"Check tender",role:"Hunting"});
 engine.create({ownerId:"b",title:"Other business",role:"Closer"});
 engine.transition(a.id,"a","ready");
 const r=taskReport(engine,"a");
 assert.equal(r.taskSummary.total,1);
 assert.equal(r.taskSummary.statuses.ready,1);
 assert.equal(r.taskSummary.agents.Hunting,1);
 assert.equal(r.paidRevenueZar,null);
 assert.equal(r.confirmedAppointments,null);
 assert.deepEqual(r.nextActions,["Hunting: Check tender"]);
});
test("owner identity required",()=>assert.throws(()=>taskReport(new TaskEngine(),""),/owner ID/));
