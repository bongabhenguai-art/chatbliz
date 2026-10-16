import test from "node:test";
import assert from "node:assert/strict";
import {createPublisher} from "../src/publisher-gateway.mjs";
const base={repository:"bongabhenguai-art/chatbliz",target:"coolify",approved:true};
test("requires configured credentials",async()=>{
  await assert.rejects(createPublisher({fetchImpl:async()=>{},environment:{}})(base),/configured securely/);
});
test("rejects unsupported protocol and mismatched target",async()=>{
  await assert.rejects(createPublisher({fetchImpl:async()=>{},environment:{CHATBLIZ_PUBLISHER_URL:"http://localhost:3000",CHATBLIZ_PUBLISHER_TOKEN:"secret",CHATBLIZ_PUBLISHER_TARGET:"coolify"}})(base),/HTTPS/);
  await assert.rejects(createPublisher({fetchImpl:async()=>{},environment:{CHATBLIZ_PUBLISHER_URL:"https://publisher.example",CHATBLIZ_PUBLISHER_TOKEN:"secret",CHATBLIZ_PUBLISHER_TARGET:"dokploy"}})(base),/not configured/);
});
test("submits to configured gateway and does not claim production success",async()=>{
  let seen;
  const publisher=createPublisher({
    environment:{CHATBLIZ_PUBLISHER_URL:"https://publisher.example",CHATBLIZ_PUBLISHER_TOKEN:"secret",CHATBLIZ_PUBLISHER_TARGET:"coolify"},
    fetchImpl:async(url,opts)=>{seen={url:String(url),opts};return {ok:true,json:async()=>({deploymentId:"job_123"})};}
  });
  const result=await publisher(base);
  assert.equal(result.status,"submitted-unverified");
  assert.equal(seen.url,"https://publisher.example/v1/deployments");
  assert.equal(JSON.parse(seen.opts.body).repository,base.repository);
  assert.equal(seen.opts.headers.authorization,"Bearer secret");
});
test("blocks unauthorized and GitHub Pages requests",async()=>{
  const publisher=createPublisher({fetchImpl:async()=>{throw Error("should not call network");},environment:{}});
  await assert.rejects(publisher({...base,approved:false}),/approval/);
  await assert.rejects(publisher({...base,target:"github-pages"}),/GitHub Actions/);
});
