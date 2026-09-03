export const PAYMENT_MARKETS = {
  NG: {
    country: "NG",
    name: "Nigeria",
    currency: "NGN",
    symbol: "₦",
    locale: "en-NG",
    prices: {
      developer: 45000,
      pro: 300000,
      enterprise: 1500000,
    },
  },

  KE: {
    country: "KE",
    name: "Kenya",
    currency: "KES",
    symbol: "KSh",
    locale: "en-KE",
    prices: {
      developer: 4000,
      pro: 27000,
      enterprise: 135000,
    },
  },

  ZA: {
    country: "ZA",
    name: "South Africa",
    currency: "ZAR",
    symbol: "R",
    locale: "en-ZA",
    prices: {
      developer: 549,
      pro: 3699,
      enterprise: 18499,
    },
  },

  EG: {
    country: "EG",
    name: "Egypt",
    currency: "EGP",
    symbol: "E£",
    locale: "en-EG",
    prices: {
      developer: 1499,
      pro: 10499,
      enterprise: 52999,
    },
  },

  INTL: {
    country: null,
    name: "International",
    currency: "USD",
    symbol: "$",
    locale: "en-US",
    prices: {
      developer: 29,
      pro: 199,
      enterprise: 999,
    },
  },
};

export function getPaymentMarket(countryCode) {
  if (typeof countryCode !== "string") {
    return PAYMENT_MARKETS.INTL;
  }

  const normalized = countryCode.trim().toUpperCase();

  return PAYMENT_MARKETS[normalized] || PAYMENT_MARKETS.INTL;
}

export function getLocalizedPaymentPrice(plan, countryCode) {
  const market = getPaymentMarket(countryCode);

  if (typeof plan !== "string") {
    return null;
  }

  const normalizedPlan = plan.trim().toLowerCase();

  if (!(normalizedPlan in market.prices)) {
    return null;
  }

  return {
    plan: normalizedPlan,
    market: market.country || "INTL",
    marketName: market.name,
    currency: market.currency,
    symbol: market.symbol,
    locale: market.locale,
    amount: market.prices[normalizedPlan],
  };
}
