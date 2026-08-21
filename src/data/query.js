import { foods } from "./foods.js";

export function listFoods() {
  return Object.values(foods);
}

export function findFoodsByCategory(category) {
  const normalized = category.trim().toLowerCase();

  return Object.values(foods).filter(
    (food) => food.category.toLowerCase() === normalized
  );
}

export function findFoodsByCountry(country) {
  const normalized = country.trim().toLowerCase();

  return Object.values(foods).filter((food) =>
    food.countries.some(
      (item) => item.toLowerCase() === normalized
    )
  );
}

export function findFoodsByRegion(region) {
  const normalized = region.trim().toLowerCase();

  return Object.values(foods).filter((food) =>
    food.origin_regions.some(
      (item) => item.toLowerCase() === normalized
    )
  );
}
