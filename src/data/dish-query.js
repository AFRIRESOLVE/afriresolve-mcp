import { dishes, dishAliases } from "./dishes.js";

function normalize(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

export function listDishes() {
  return Object.values(dishes);
}

export function resolveDish(term) {
  const normalized = normalize(term);

  if (!normalized) return null;

  const key = dishAliases[normalized] || normalized;

  return dishes[key] || null;
}

export function findDishesByCountry(country) {
  const normalized = normalize(country);

  return listDishes().filter((dish) =>
    dish.countries.some(
      (item) => normalize(item) === normalized
    )
  );
}

export function findDishesByRegion(region) {
  const normalized = normalize(region);

  return listDishes().filter((dish) =>
    dish.regions.some(
      (item) => normalize(item) === normalized
    )
  );
}

export function findDishesByIngredient(ingredient) {
  const normalized = normalize(ingredient);

  return listDishes().filter((dish) =>
    dish.primary_ingredients.some(
      (item) => normalize(item) === normalized
    )
  );
}

export function searchDishes(query) {
  const normalized = normalize(query);

  if (!normalized) return [];

  return listDishes().filter((dish) => {
    const searchableText = [
      dish.term,
      dish.common_name,
      dish.category,
      ...dish.aliases,
      ...dish.countries,
      ...dish.regions,
      ...dish.primary_ingredients,
      ...dish.related_foods,
      dish.description,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalized);
  });
}
