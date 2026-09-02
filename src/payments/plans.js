export const PAYMENT_PLANS = {
  developer: {
    plan: "developer",
    name: "Developer",
    amountUsd: 29,
    credits: 10000,
  },

  pro: {
    plan: "pro",
    name: "Pro",
    amountUsd: 199,
    credits: 100000,
  },

  enterprise: {
    plan: "enterprise",
    name: "Enterprise",
    amountUsd: 999,
    credits: 1000000,
  },
};

export function getPaymentPlan(plan) {
  if (typeof plan !== "string") return null;
  return PAYMENT_PLANS[plan.trim().toLowerCase()] || null;
}
