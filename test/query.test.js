import assert from "node:assert/strict";
import {
  listFoods,
  findFoodsByCategory,
  findFoodsByCountry,
  findFoodsByRegion,
} from "../src/data/query.js";

const allFoods = listFoods();

assert.equal(allFoods.length, 20);

const grains = findFoodsByCategory("grain");

assert.ok(grains.length > 0);
assert.ok(
  grains.some((food) => food.term === "fonio"),
  "Fonio should be classified as a grain"
);

const nigeriaFoods = findFoodsByCountry("nigeria");

assert.ok(nigeriaFoods.length > 0);
assert.ok(
  nigeriaFoods.some((food) => food.term === "fonio"),
  "Fonio should be associated with Nigeria"
);

const westAfricanFoods = findFoodsByRegion("west africa");

assert.ok(westAfricanFoods.length > 0);
assert.ok(
  westAfricanFoods.some((food) => food.term === "fonio"),
  "Fonio should be associated with West Africa"
);

const caseInsensitive = findFoodsByCategory("GRAIN");

assert.equal(
  caseInsensitive.length,
  grains.length,
  "Category search should be case-insensitive"
);

console.log("PASS: listFoods");
console.log("PASS: findFoodsByCategory");
console.log("PASS: findFoodsByCountry");
console.log("PASS: findFoodsByRegion");
console.log("PASS: query case normalization");
console.log("Query layer validation completed successfully.");

assert.throws(
  () => findFoodsByCategory(),
  TypeError
);

assert.throws(
  () => findFoodsByCountry(),
  TypeError
);

assert.throws(
  () => findFoodsByRegion(),
  TypeError
);

console.log("PASS: query invalid input handling");
