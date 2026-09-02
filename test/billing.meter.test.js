import assert from "node:assert/strict";
import {
  reserveCredits,
  refundCredits,
  recordUsage,
} from "../src/billing/meter.js";

function createMockDb({
  changes = 1,
  shouldFail = false,
} = {}) {
  const calls = [];

  return {
    calls,

    prepare(sql) {
      return {
        bind(...params) {
          calls.push({ sql, params });

          return {
            async run() {
              if (shouldFail) {
                throw new Error("database unavailable");
              }

              return {
                meta: {
                  changes,
                },
              };
            },
          };
        },
      };
    },
  };
}

async function testReserveCredits() {
  const db = createMockDb();

  const result = await reserveCredits(db, {
    customerId: "cust_001",
    units: 3,
  });

  assert.equal(result.success, true);
  assert.equal(result.reserved, true);
  assert.equal(result.customer_id, "cust_001");
  assert.equal(result.units, 3);
  assert.equal(db.calls.length, 1);
  assert.match(db.calls[0].sql, /UPDATE customers/);
  assert.match(db.calls[0].sql, /credits = credits -/);
  assert.match(db.calls[0].sql, /credits >=/);
}

async function testReserveInsufficientCredits() {
  const db = createMockDb({ changes: 0 });

  const result = await reserveCredits(db, {
    customerId: "cust_001",
    units: 3,
  });

  assert.equal(result.success, false);
  assert.equal(result.reserved, false);
  assert.equal(
    result.reason,
    "insufficient_credits_or_inactive_customer"
  );
}

async function testReserveDatabaseFailure() {
  const db = createMockDb({ shouldFail: true });

  const result = await reserveCredits(db, {
    customerId: "cust_001",
    units: 1,
  });

  assert.equal(result.success, false);
  assert.equal(result.reserved, false);
  assert.equal(result.reason, "database_write_failed");
}

async function testRefundCredits() {
  const db = createMockDb();

  const result = await refundCredits(db, {
    customerId: "cust_001",
    units: 2,
  });

  assert.equal(result.success, true);
  assert.equal(result.refunded, true);
  assert.equal(result.customer_id, "cust_001");
  assert.equal(result.units, 2);
  assert.match(db.calls[0].sql, /credits = credits \+/);
}

async function testRefundCustomerMissing() {
  const db = createMockDb({ changes: 0 });

  const result = await refundCredits(db, {
    customerId: "cust_001",
    units: 2,
  });

  assert.equal(result.success, false);
  assert.equal(result.refunded, false);
  assert.equal(
    result.reason,
    "customer_not_found_or_inactive"
  );
}

async function testRecordUsage() {
  const db = createMockDb();

  const result = await recordUsage(db, {
    customerId: "cust_001",
    tool: "search_african_foods",
    units: 1,
    billable: true,
    status: "recorded",
    metadata: {
      plan: "free",
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.recorded, true);
  assert.equal(result.customer_id, "cust_001");
  assert.equal(result.tool, "search_african_foods");
  assert.equal(result.units, 1);
  assert.equal(result.billable, true);
  assert.equal(result.status, "recorded");
  assert.match(db.calls[0].sql, /INSERT INTO usage_ledger/);
}

await testReserveCredits();
await testReserveInsufficientCredits();
await testReserveDatabaseFailure();
await testRefundCredits();
await testRefundCustomerMissing();
await testRecordUsage();

console.log("Billing meter tests passed");
