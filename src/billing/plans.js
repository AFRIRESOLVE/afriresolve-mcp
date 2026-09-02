export const PLANS = {
  free: {
    name: "Free",
    monthlyCredits: 100,
    priceUsd: 0,
  },

  developer: {
    name: "Developer",
    monthlyCredits: 10000,
    priceUsd: 29,
  },

  pro: {
    name: "Pro",
    monthlyCredits: 100000,
    priceUsd: 199,
  },

  enterprise: {
    name: "Enterprise",
    monthlyCredits: 1000000,
    priceUsd: 999,
  },
};

export const TOOL_PRICING = {
  resolve_african_term: 1,
  list_african_foods: 1,
  find_foods_by_category: 1,
  find_foods_by_country: 1,
  find_foods_by_region: 1,
  search_african_foods: 1,
  rank_african_foods: 1,
  get_afriresolve_intelligence: 1,
};

export function getPlan(plan = "free") {
  return PLANS[plan] || PLANS.free;
}

export function getToolUnits(tool) {
  return TOOL_PRICING[tool] || 1;
}

export function calculateUsageCharge({
  tool,
  units = 1,
  pricePerUnitUsd = 0.001,
}) {
  const safeUnits =
    Number.isInteger(units) && units > 0 ? units : 1;

  return Number(
    (safeUnits * pricePerUnitUsd).toFixed(6)
  );
}
