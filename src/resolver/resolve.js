import { foods, foodAliases } from "../data/foods.js";

export function normalizeTerm(query) {
  return query.trim().toLowerCase();
}

export function resolveFood(query) {
  const normalizedQuery = normalizeTerm(query);

  const canonicalTerm =
    foodAliases[normalizedQuery] ?? normalizedQuery;

  const food = foods[canonicalTerm];

  if (!food) {
    return {
      success: false,
      query,
      message:
        "AfriResolve does not yet have this term in its knowledge base.",
    };
  }

  return {
    success: true,
    query,
    data: food,
  };
}
