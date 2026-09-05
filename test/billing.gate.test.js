import assert from "node:assert/strict";

import { chargeToolRequest, settleToolRequest } from "../src/billing/gate.js";

const API_KEY = "afr_test_billing_gate_key";

function createMockDb({
  customer = {
    customer_id: "cust_gate_001",
    name: "Billing Gate Test",
    email: "billing-gate@example.invalid",
    status: "active",
    plan: "free",
    credits: 100,
  },
  reservationChanges = 1,
  refundChanges = 1,
} = {}) {
  const calls = [];

  return {
    calls,

    prepare(sql) {
      return {
        bind(...params) {
          calls.push({ sql, params });

          return {
            async first() {
              if (/SELECT customer_id/i.test(sql)) {
                return customer;
              }

              return null;
            },

            async run() {
              if (/credits = credits -/i.test(sql)) {
                return {
                  meta: {
                    changes: reservationChanges,
                  },
                };
              }

              if (/credits = credits \+/i.test(sql)) {
                return {
                  meta: {
                    changes: refundChanges,
                  },
                };
              }

              if (/INSERT INTO usage_ledger/i.test(sql)) {
                return {
                  meta: {
                    changes: 1,
                  },
                };
              }

              throw new Error(`Unexpected SQL: ${sql}`);
            },
          };
        },
      };
    },
  };
}

async function testChargeToolRequestSuccess() {
  const db = createMockDb();

  const result = await chargeToolRequest(
    db,
    API_KEY,
    "resolve_african_term"
  );

  assert.equal(result.success, true);
  assert.equal(result.allowed, true);
  assert.equal(result.charged, true);
  assert.equal(result.units, 1);
  assert.equal(result.customer.customer_id, "cust_gate_001");

  assert.equal(
    db.calls.filter((call) => /SELECT customer_id/i.test(call.sql)).length,
    1
  );
  assert.equal(
    db.calls.filter((call) => /credits = credits -/i.test(call.sql)).length,
    1
  );
}

async function testChargeToolRequestInsufficientCredits() {
  const db = createMockDb({
    reservationChanges: 0,
  });

  const result = await chargeToolRequest(
    db,
    API_KEY,
    "resolve_african_term"
  );

  assert.equal(result.success, false);
  assert.equal(result.allowed, false);
  assert.equal(
    result.reason,
    "insufficient_credits_or_inactive_customer"
  );
}

async function testChargeToolRequestInvalidKey() {
  const db = createMockDb({
    customer: null,
  });

  const result = await chargeToolRequest(
    db,
    "afr_invalid_key",
    "resolve_african_term"
  );

  assert.equal(result.success, false);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "invalid_api_key");

  assert.equal(
    db.calls.filter((call) => /credits = credits -/i.test(call.sql)).length,
    0
  );
}

async function testSettleSuccessfulRequest() {
  const db = createMockDb();

  const result = await settleToolRequest(db, {
    customerId: "cust_gate_001",
    tool: "resolve_african_term",
    units: 1,
    success: true,
    metadata: { plan: "free" },
  });

  assert.equal(result.success, true);
  assert.equal(result.recorded, true);

  assert.equal(
    db.calls.filter((call) => /INSERT INTO usage_ledger/i.test(call.sql)).length,
    1
  );

  assert.equal(
    db.calls.filter((call) => /credits = credits \+/i.test(call.sql)).length,
    0
  );

  const usageCall = db.calls.find((call) =>
    /INSERT INTO usage_ledger/i.test(call.sql)
  );

  assert.equal(usageCall.params[2], "resolve_african_term");
  assert.equal(usageCall.params[3], 1);
  assert.equal(usageCall.params[5], "recorded");
}

async function testSettleFailedRequestRefundsCredit() {
  const db = createMockDb();

  const result = await settleToolRequest(db, {
    customerId: "cust_gate_001",
    tool: "resolve_african_term",
    units: 1,
    success: false,
    metadata: { plan: "free" },
  });

  assert.equal(result.success, true);
  assert.equal(result.refunded, true);
  assert.equal(result.recorded, true);

  assert.equal(
    db.calls.filter((call) => /credits = credits \+/i.test(call.sql)).length,
    1
  );

  assert.equal(
    db.calls.filter((call) => /INSERT INTO usage_ledger/i.test(call.sql)).length,
    1
  );

  const usageCall = db.calls.find((call) =>
    /INSERT INTO usage_ledger/i.test(call.sql)
  );

  assert.equal(usageCall.params[5], "refunded");
  assert.match(usageCall.params[6], /tool_execution_failed/);
}

await testChargeToolRequestSuccess();
await testChargeToolRequestInsufficientCredits();
await testChargeToolRequestInvalidKey();
await testSettleSuccessfulRequest();
await testSettleFailedRequestRefundsCredit();

console.log("Billing gate tests passed");
