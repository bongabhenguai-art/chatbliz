import test from "node:test";
import assert from "node:assert/strict";
import { ENGINEERING_AREAS, createEngineeringBrief, recordMetric, summarizeMetrics } from "../backend/engineering.mjs";
test("MiniMax engineering supervisor supports six workstreams", () => {
  assert.deepEqual(ENGINEERING_AREAS, ["architecture","performance","operations","advisor","backend","frontend"]);
  for (const area of ENGINEERING_AREAS) {
    const brief=createEngineeringBrief({area,observations:"A real 500 error was observed in staging."});
    assert.match(brief,/Verification/);
    assert.match(brief,/No automatic writes or deployments/);
  }
});
test("supervisor refuses invalid and unbounded input",()=>{
  assert.throws(()=>createEngineeringBrief({area:"production-root",observations:"test"}));
  assert.throws(()=>createEngineeringBrief({area:"backend",observations:" "}));
  assert.throws(()=>createEngineeringBrief({area:"backend",observations:"x".repeat(10001)}));
});
test("monitoring calculates error rate and p95",()=>{
  const records=[recordMetric({operation:"engineering",durationMs:12,ok:true}),recordMetric({operation:"engineering",durationMs:80,ok:false})];
  assert.deepEqual(summarizeMetrics(records),{requests:2,errors:1,errorRate:0.5,p95Ms:80});
  assert.deepEqual(summarizeMetrics([]),{requests:0,errors:0,errorRate:0,p95Ms:null});
});
