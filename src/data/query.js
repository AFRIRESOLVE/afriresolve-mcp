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

export function searchFoods(query) {
  const normalized = query.trim().toLowerCase();

  return Object.values(foods).filter((food) => {
    const searchableText = [
      food.term,
      food.common_name,
      food.scientific_name,
      food.category,
      ...food.local_names,
      ...food.aliases,
      ...food.countries,
      ...food.origin_regions,
      food.description,
      ...food.uses,
      ...food.nutrition.rich_in,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalized);
  });
}

export function scoreFoodMatch(food, query) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return {
      score: 0,
      match_type: "none",
      matched_field: null,
    };
  }

  const exact = (value) =>
    typeof value === "string" &&
    value.trim().toLowerCase() === normalized;

  const partial = (value) =>
    typeof value === "string" &&
    value.trim().toLowerCase().includes(normalized);

  if (exact(food.term)) {
    return {
      score: 100,
      match_type: "exact_term",
      matched_field: "term",
    };
  }

  if (exact(food.common_name)) {
    return {
      score: 95,
      match_type: "exact_common_name",
      matched_field: "common_name",
    };
  }

  if (food.local_names?.some(exact)) {
    return {
      score: 90,
      match_type: "local_name",
      matched_field: "local_names",
    };
  }

  if (food.aliases?.some(exact)) {
    return {
      score: 90,
      match_type: "alias",
      matched_field: "aliases",
    };
  }

  if (exact(food.scientific_name)) {
    return {
      score: 85,
      match_type: "scientific_name",
      matched_field: "scientific_name",
    };
  }

  if (exact(food.category)) {
    return {
      score: 80,
      match_type: "category",
      matched_field: "category",
    };
  }

  if (food.countries?.some(exact)) {
    return {
      score: 75,
      match_type: "country",
      matched_field: "countries",
    };
  }

  if (food.origin_regions?.some(exact)) {
    return {
      score: 70,
      match_type: "region",
      matched_field: "origin_regions",
    };
  }

  if (partial(food.term)) {
    return {
      score: 65,
      match_type: "partial_term",
      matched_field: "term",
    };
  }

  if (partial(food.common_name)) {
    return {
      score: 60,
      match_type: "partial_common_name",
      matched_field: "common_name",
    };
  }

  if (food.local_names?.some(partial)) {
    return {
      score: 55,
      match_type: "partial_local_name",
      matched_field: "local_names",
    };
  }

  if (food.aliases?.some(partial)) {
    return {
      score: 55,
      match_type: "partial_alias",
      matched_field: "aliases",
    };
  }

  if (partial(food.scientific_name)) {
    return {
      score: 50,
      match_type: "partial_scientific_name",
      matched_field: "scientific_name",
    };
  }

  if (partial(food.category)) {
    return {
      score: 45,
      match_type: "partial_category",
      matched_field: "category",
    };
  }

  if (food.countries?.some(partial)) {
    return {
      score: 40,
      match_type: "partial_country",
      matched_field: "countries",
    };
  }

  if (food.origin_regions?.some(partial)) {
    return {
      score: 35,
      match_type: "partial_region",
      matched_field: "origin_regions",
    };
  }

  if (partial(food.description)) {
    return {
      score: 25,
      match_type: "description",
      matched_field: "description",
    };
  }

  if (food.uses?.some(partial)) {
    return {
      score: 20,
      match_type: "use",
      matched_field: "uses",
    };
  }

  if (food.nutrition?.rich_in?.some(partial)) {
    return {
      score: 15,
      match_type: "nutrition",
      matched_field: "nutrition.rich_in",
    };
  }

  return {
    score: 0,
    match_type: "none",
    matched_field: null,
  };
}

export function rankSearchResults(query) {
  const normalized = query.trim().toLowerCase();

  return Object.values(foods)
    .map((food) => {
      const match = scoreFoodMatch(food, normalized);

      return {
        ...food,
        relevance: match,
      };
    })
    .filter((food) => food.relevance.score > 0)
    .sort((a, b) => {
      if (b.relevance.score !== a.relevance.score) {
        return b.relevance.score - a.relevance.score;
      }

      return a.term.localeCompare(b.term);
    });
}

export function searchFoodsRanked(query) {
  return rankSearchResults(query);
}
