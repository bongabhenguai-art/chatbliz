import test from "node:test";
import assert from "node:assert/strict";
import {validatePublishRequest, publishChecklist} from "../src/publishing.mjs";

const valid={repository:"bongabhenguai-art/chatbliz",target:"github-pages",approved:true};
test("validates a publishing request without pretending to deploy",()=>{
  assert.equal(validatePublishRequest(valid).status,"validated-not-deployed");
  assert.equal(publishChecklist(valid).execution,"requires-server-side-publisher-and-credentials");
});
test("blocks publishing without owner approval",()=>assert.throws(()=>validatePublishRequest({...valid,approved:false}),/approval/));
test("rejects invalid repositories and domains",()=>{
  assert.throws(()=>validatePublishRequest({...valid,repository:"https://bad.example/"}),/Repository/);
  assert.throws(()=>validatePublishRequest({...valid,domain:"localhost"}),/domain/);
});
test("rejects unsupported publishers and unsafe branch syntax",()=>{
  assert.throws(()=>validatePublishRequest({...valid,target:"unknown"}),/target/);
  assert.throws(()=>validatePublishRequest({...valid,branch:"../secrets"}),/branch/);
});
