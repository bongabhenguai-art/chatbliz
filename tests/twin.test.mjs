import test from "node:test";
import assert from "node:assert/strict";
import {buildTwinTask,evaluateApproval,buildRepairPlan} from "../twin/engine.mjs";
test("AI Twin queues diagnostics automatically",()=>{const t=buildTwinTask({workspace:"my-studio",action:"diagnose",description:"Microphone is silent"});assert.equal(t.status,"queued");assert.equal(evaluateApproval(t).allowed,true)});
test("AI Twin blocks production changes without approval and tests",()=>{const t=buildTwinTask({workspace:"my-website-app",action:"deploy",description:"Publish tested fix"});assert.equal(t.status,"awaiting-approval");assert.equal(evaluateApproval(t).allowed,false);assert.equal(evaluateApproval(t,{approved:true}).allowed,false);assert.equal(evaluateApproval(t,{approved:true,testsPassed:true,reviewed:true}).allowed,true)});
test("AI Twin repair plans include reproduction, testing and rollback",()=>{const p=buildRepairPlan({component:"Studio audio",symptoms:"Live video works but sound is absent"});assert.ok(p.steps.some(x=>x.includes("rollback")));assert.ok(p.steps.some(x=>x.includes("regression test")))});
test("AI Twin rejects unknown actions",()=>{assert.throws(()=>buildTwinTask({workspace:"my-business",action:"override",description:"Skip approvals"}))});
