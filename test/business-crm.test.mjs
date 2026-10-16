import test from "node:test";
import assert from "node:assert/strict";
import {createLead,updateLead,leadSummary} from "../src/business-crm.js";
test("consent and confirmation gate pipeline",()=>{
 assert.throws(()=>createLead({ownerId:"a",name:"Client",need:"Website",consent:false}),/consent/);
 const lead=createLead({id:"1",ownerId:"a",name:"Client",need:"Website",consent:true,estimatedValueZar:5000});
 assert.throws(()=>updateLead(lead,"qualified"),/confirmation/);
 const q=updateLead(lead,"qualified",{customerConfirmed:true});
 assert.equal(leadSummary([q],"a").qualifiedPipelineZar,5000);
 assert.equal(leadSummary([q],"b").qualifiedPipelineZar,0);
 assert.throws(()=>updateLead(q,"won"),/payment/);
});
