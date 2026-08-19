import assert from "node:assert/strict";
import { foods, foodAliases } from "../src/data/foods.js";

const requiredFields = [
  "term",
  "category",
  "common_name",
  "scientific_name",
  "origin_regions",
  "countries",
  "local_names",
  "aliases",
  "description",
  "uses",
  "nutrition",
];

const canonicalTerms = Object.keys(foods);
const aliases = Object.keys(foodAliases);

assert.ok(
  canonicalTerms.length > 0,
  "Knowledge base must contain at least one canonical food"
);

for (const [key, food] of Object.entries(foods)) {
  assert.equal(
    typeof food,
    "object",
    `Food record must be an object: ${key}`
  );

  for (const field of requiredFields) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(food, field),
      `Missing field "${field}" in food: ${key}`
    );
  }

  assert.equal(
    food.term,
    key.replaceAll("_", " "),
    `Term/key mismatch for: ${key}`
  );

  assert.ok(
    typeof food.category === "string" && food.category.length > 0,
    `Invalid category for: ${key}`
  );

  assert.ok(
    typeof food.common_name === "string" && food.common_name.length > 0,
    `Invalid common_name for: ${key}`
  );

  assert.ok(
    typeof food.scientific_name === "string" &&
      food.scientific_name.length > 0,
    `Invalid scientific_name for: ${key}`
  );

  for (const field of [
    "origin_regions",
    "countries",
    "local_names",
    "aliases",
    "uses",
  ]) {
    assert.ok(
      Array.isArray(food[field]),
      `${field} must be an array for: ${key}`
    );

    for (const value of food[field]) {
      assert.equal(
        typeof value,
        "string",
        `${field} contains a non-string value for: ${key}`
      );

      assert.ok(
        value.trim().length > 0,
        `${field} contains an empty value for: ${key}`
      );
    }
  }

  assert.ok(
    food.nutrition &&
      typeof food.nutrition === "object",
    `Invalid nutrition object for: ${key}`
  );

  assert.ok(
    Array.isArray(food.nutrition.rich_in),
    `nutrition.rich_in must be an array for: ${key}`
  );

  for (const alias of food.aliases) {
    const normalizedAlias = alias.trim().toLowerCase();

    assert.equal(
      foodAliases[normalizedAlias],
      key,
      `Alias "${alias}" does not correctly point to "${key}"`
    );
  }
}

for (const [alias, canonicalTerm] of Object.entries(foodAliases)) {
  assert.ok(
    canonicalTerms.includes(canonicalTerm),
    `Alias "${alias}" points to missing canonical food "${canonicalTerm}"`
  );

  assert.equal(
    alias,
    alias.trim().toLowerCase(),
    `Alias must be normalized: "${alias}"`
  );
}

console.log(
  `Knowledge base validation passed: ${canonicalTerms.length} canonical foods, ${aliases.length} aliases.`
);
