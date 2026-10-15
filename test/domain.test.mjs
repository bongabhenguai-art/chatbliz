import test from "node:test";
import assert from "node:assert/strict";
import { PACKAGES, PARTNERS, PRODUCTS, preparePlan } from "../src/domain.mjs";

test("the four product workspaces and five partners are present", () => {
  assert.deepEqual(PRODUCTS.map(item => item.id), ["business", "brand", "website", "content"]);
  assert.equal(PARTNERS.length, 5);
  assert.equal(new Set(PARTNERS.map(item => item.id)).size, PARTNERS.length);
});

test("package details match the business tiers without claiming checkout", () => {
  assert.deepEqual(PACKAGES.map(item => item.price), ["R299", "R499", "R899", "Custom"]);
  assert.match(PACKAGES[2].details.join(" "), /eight profiles/i);
  assert.match(PACKAGES[3].details.join(" "), /R2,000–R1,000,000 per month/);
});

test("planning routes a website request and never claims external execution", () => {
  const result = preparePlan("Build a website for my business");
  assert.equal(result.product.id, "website");
  assert.equal(result.status, "plan-prepared");
  assert.equal(result.execution, "not-connected");
  assert.match(result.response, /No external action has been taken/);
});

test("empty requests are rejected", () => {
  assert.throws(() => preparePlan("  "), /Write a message first/);
});
