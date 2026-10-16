import test from "node:test";import assert from "node:assert/strict";import { PassThrough } from "node:stream";import {handleTasks,configured,authorized} from "../backend/tasks.mjs";
function request(method,body,authorization=""){const r=new PassThrough();r.method=method;r.headers={authorization};if(body!==undefined)r.end(JSON.stringify(body));else r.end();return r}
function response(){return{status:0,headers:{},body:"",writeHead(s,h){this.status=s;this.headers=h||{};return this},end(v){this.body=v||"";return this}}}
test("task API disabled without a strong admin token",async()=>{if(configured())return;const res=response();await handleTasks(request("GET"),res);assert.equal(res.status,503)});
test("task API rejects requests without credentials when configured",async()=>{if(!configured())return;const res=response();await handleTasks(request("GET"),res);assert.equal(res.status,401)});
test("invalid or absent token is not authorized",()=>{assert.equal(authorized({headers:{authorization:"Bearer wrong"}}),false)});
