import test from 'node:test';import assert from 'node:assert/strict';import {BUSINESS_MODULES,TASK_STAGES,createTask,advanceTask} from '../workforce/business-modules.mjs';
test('module catalog has unique entries',()=>{assert.equal(BUSINESS_MODULES.length,14);assert.equal(new Set(BUSINESS_MODULES.map(m=>m.name)).size,14)});
test('creates an intake task for a known module',()=>{const t=createTask('Find missing SEO pages','Gap Fixer');assert.equal(t.status,'intake');assert.equal(t.module,'Gap Fixer')});
test('rejects blank tasks and unknown modules',()=>{assert.throws(()=>createTask(' ','Gap Fixer'));assert.throws(()=>createTask('Do work','Unknown'))});
test('requires evidence and approval to mark completed',()=>{const t=createTask('Audit','Authority Control');assert.throws(()=>advanceTask(t,'completed'));assert.equal(advanceTask({...t,evidence:['report'],approvals:['owner']},'completed').status,'completed')});
test('rejects invalid statuses',()=>{const t=createTask('Audit','Authority Control');assert.ok(TASK_STAGES.includes('verified'));assert.throws(()=>advanceTask(t,'fake'))});
