import {
  authenticateCustomer,
} from "./auth.js";

import {
  reserveCredits,
  refundCredits,
  recordUsage,
} from "./meter.js";

import {
  getToolUnits,
} from "./plans.js";

export async function chargeToolRequest(db, apiKey, tool) {
  const authentication = await authenticateCustomer(db, apiKey);

  if (!authentication.authenticated) {
    return {
      success: false,
      allowed: false,
      reason: authentication.reason || "authentication_failed",
    };
  }

  const units = getToolUnits(tool);

  const reservation = await reserveCredits(db, {
    customerId: authentication.customer.customer_id,
    units,
  });

  if (!reservation.reserved) {
    return {
      success: false,
      allowed: false,
      reason: reservation.reason || "insufficient_credits",
      customer: authentication.customer,
    };
  }

  return {
    success: true,
    allowed: true,
    charged: true,
    customer: authentication.customer,
    units,
  };
}

export async function settleToolRequest(
  db,
  {
    customerId,
    tool,
    units = 1,
    success = true,
    metadata = {},
  }
) {
  if (success) {
    return recordUsage(db, {
      customerId,
      tool,
      units,
      billable: true,
      status: "recorded",
      metadata,
    });
  }

  const refund = await refundCredits(db, {
    customerId,
    units,
  });

  const usage = await recordUsage(db, {
    customerId,
    tool,
    units,
    billable: true,
    status: "refunded",
    metadata: {
      ...metadata,
      reason: "tool_execution_failed",
    },
  });

  return {
    success: refund.success && usage.success,
    refunded: refund.refunded,
    recorded: usage.recorded,
  };
}
