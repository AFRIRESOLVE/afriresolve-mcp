import assert from "node:assert/strict";
import { resolveFood } from "../src/resolver/resolve.js";

const tests = [
  ["acha", "fonio"],
  ["ACHA", "fonio"],
  [" Acha ", "fonio"],
  ["corn", "maize"],
  ["cowpea", "beans"],
  ["ukwa", "african breadfruit"],
  ["aya", "tiger nut"],
  ["peanut", "groundnut"],
  ["taro", "cocoyam"],
  ["egusi", "egusi"],
  ["african yam bean", "african yam bean"],
  ["AFRICAN YAM BEAN", "african yam bean"],
  ["agbalumo", "african star apple"],
  ["udara", "african star apple"],
  ["alasa", "african star apple"],
  ["bitter leaf", "bitter leaf"],
  ["onugbu", "bitter leaf"],
  ["ewuro", "bitter leaf"],
];

for (const [query, expectedTerm] of tests) {
  const result = resolveFood(query);

  assert.equal(result.success, true);
  assert.equal(result.data.term, expectedTerm);
}

const unknown = resolveFood("this-does-not-exist");

assert.equal(unknown.success, false);
assert.equal(unknown.query, "this-does-not-exist");

console.log(`Passed ${tests.length + 1} AfriResolve resolver tests.`);
