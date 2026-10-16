import test from "node:test";
import assert from "node:assert/strict";
import { makeBusinessBriefing, BRIEFING_TIMES, slotForLocalHour } from "../voice-briefings.mjs";
const blank={paidRevenueZar:null,paidOrders:null,actualReplies:null,confirmedAppointments:null,qualifiedPipelineZar:null,issuesFixed:null};
test("three daily report slots",()=>assert.deepEqual([...BRIEFING_TIMES],["08:00","13:00","19:00"]));
test("unknown data is never represented as zero",()=>{const b=makeBusinessBriefing(blank);assert.match(b.text,/not verified/);});
test("revenue and appointments need verified evidence",()=>{assert.throws(()=>makeBusinessBriefing({...blank,paidRevenueZar:5000}),/payment evidence/);assert.throws(()=>makeBusinessBriefing({...blank,confirmedAppointments:2}),/appointment evidence/);});
test("validated paid revenue can be narrated",()=>{const b=makeBusinessBriefing({...blank,paidRevenueZar:5000,paymentVerified:true},{slot:"evening"});assert.match(b.text,/R\s?5.?000/);});
test("local hour mapping",()=>{assert.equal(slotForLocalHour(8),"morning");assert.equal(slotForLocalHour(13),"afternoon");assert.equal(slotForLocalHour(19),"evening");});
