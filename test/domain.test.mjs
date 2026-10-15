import test from "node:test";
import assert from "node:assert/strict";
import { PACKAGES, PARTNERS, PRODUCTS, preparePlan } from "../src/domain.mjs";

test("the four product workspaces and six partners are present", () => {
  assert.deepEqual(PRODUCTS.map(item => item.id), ["business", "brand", "website", "content"]);
  assert.equal(PARTNERS.length, 6);
  assert.equal(new Set(PARTNERS.map(item => item.id)).size, PARTNERS.length);
  assert.ok(PARTNERS.some(item => item.id === "problem_solver"));
});

test("package details match the business tiers without claiming checkout", () => {
  assert.deepEqual(PACKAGES.map(item => item.price), ["R299", "R499", "R899", "Custom"]);
  assert.match(PACKAGES[2].details.join(" "), /eight profiles/i);
  assert.match(PACKAGES[3].details.join(" "), /R2,000–R1,000,000 per month/);
});

test("planning routes a website request and never claims external execution", () => {
  const result = preparePlan("Build a website for my business");
  assert.equal(result.product.id, "website");
  assert.equal(result.problemSolving, false);
  assert.equal(result.status, "plan-prepared");
  assert.equal(result.execution, "not-connected");
  assert.match(result.response, /No external action has been taken/);
});

test("empty requests are rejected", () => {
  assert.throws(() => preparePlan("  "), /Write a message first/);
});

test("a customer lead problem receives a measurable business plan", () => {
  const result = preparePlan("I need more customers for my business");
  assert.equal(result.solution.area, "Lead flow and sales");
  assert.equal(result.partners[0], "AI Problem Solver");
  assert.equal(result.problemSolving, true);
  assert.match(result.solution.measure, /Qualified enquiries per week/);
  assert.equal(result.execution, "not-connected");
});

test("a reported signup write problem gets a verification-first repair plan", () => {
  const result = preparePlan("Signup says success but it is not saving to the database");
  assert.equal(result.solution.area, "Digital product reliability");
  assert.equal(result.partners[0], "AI Problem Solver");
  assert.match(result.solution.actions.join(" "), /same runtime database/);
  assert.match(result.solution.measure, /readable from the app’s runtime database/);
});

test("an underspecified business problem asks for context without inventing a cause", () => {
  const result = preparePlan("I have a problem in my business");
  assert.equal(result.solution.area, "Business planning");
  assert.match(result.solution.assessment, /need the business problem/);
  assert.ok(result.solution.questions.length <= 2);
});
