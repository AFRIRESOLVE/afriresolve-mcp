import assert from "node:assert/strict";
import {
  listFoods,
  findFoodsByCategory,
  findFoodsByCountry,
  findFoodsByRegion,
  searchFoods,
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

const searchFonio = searchFoods("acha");

assert.ok(
  searchFonio.length > 0,
  "Search should find foods through aliases"
);

assert.ok(
  searchFonio.some((food) => food.term === "fonio"),
  "Search for acha should return fonio"
);

const searchNigeria = searchFoods("nigeria");

assert.ok(
  searchNigeria.length > 0,
  "Search should find foods associated with Nigeria"
);

const searchGrain = searchFoods("grain");

assert.ok(
  searchGrain.length > 0,
  "Search should find foods by category"
);

assert.throws(
  () => searchFoods(),
  TypeError
);

console.log("PASS: searchFoods");
console.log("PASS: search alias discovery");
console.log("PASS: search country discovery");
console.log("PASS: search category discovery");
console.log("PASS: search invalid input handling");
console.log("Search layer validation completed successfully.");
