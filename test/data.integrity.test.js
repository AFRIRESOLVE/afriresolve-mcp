import assert from "node:assert/strict";
import { foods, foodAliases } from "../src/data/foods.js";

const canonicalTerms = Object.keys(foods);
const aliases = Object.keys(foodAliases);

assert.equal(
  new Set(canonicalTerms).size,
  canonicalTerms.length,
  "Duplicate canonical food keys detected"
);

assert.equal(
  new Set(aliases).size,
  aliases.length,
  "Duplicate aliases detected"
);

for (const [key, food] of Object.entries(foods)) {
  assert.equal(
    food.term,
    key.replaceAll("_", " "),
    `Canonical term mismatch for: ${key}`
  );

  assert.ok(food.common_name, `Missing common_name: ${key}`);
  assert.ok(food.scientific_name, `Missing scientific_name: ${key}`);
  assert.ok(food.category, `Missing category: ${key}`);

  assert.ok(
    Array.isArray(food.origin_regions) &&
      food.origin_regions.length > 0,
    `Missing origin_regions: ${key}`
  );

  assert.ok(
    Array.isArray(food.countries) &&
      food.countries.length > 0,
    `Missing countries: ${key}`
  );

  assert.ok(
    Array.isArray(food.local_names) &&
      food.local_names.length > 0,
    `Missing local_names: ${key}`
  );

  assert.ok(
    Array.isArray(food.aliases),
    `Aliases must be an array: ${key}`
  );

  assert.ok(
    food.description,
    `Missing description: ${key}`
  );

  assert.ok(
    Array.isArray(food.uses) &&
      food.uses.length > 0,
    `Missing uses: ${key}`
  );

  assert.ok(
    food.nutrition &&
      Array.isArray(food.nutrition.rich_in) &&
      food.nutrition.rich_in.length > 0,
    `Invalid nutrition data: ${key}`
  );

  for (const alias of food.aliases) {
    const normalized = alias.trim().toLowerCase();

    assert.equal(
      foodAliases[normalized],
      key,
      `Broken alias "${alias}" for ${key}`
    );
  }
}

for (const [alias, canonical] of Object.entries(foodAliases)) {
  assert.equal(
    alias,
    alias.trim().toLowerCase(),
    `Alias is not normalized: "${alias}"`
  );

  assert.ok(
    foods[canonical],
    `Alias "${alias}" points to missing food "${canonical}"`
  );
}

console.log(
  `Integrity validation passed: ${canonicalTerms.length} foods, ${aliases.length} aliases.`
);
