import assert from "node:assert/strict";
import test from "node:test";
import { fulfillPayment } from "../src/payments/fulfill.js";

function makeDb(payment = {}, customer = {}) {
  const p = {
    payment_id: "pay_test_001",
    customer_id: "cust_test_001",
    plan: "developer",
    amount: 45000,
    currency: "NGN",
    reference: "afr_test_ref",
    status: "pending",
    credits: 10000,
    fulfilled: 0,
    ...payment,
  };

  const c = {
    customer_id: "cust_test_001",
    status: "active",
    plan: "free",
    credits: 100,
    ...customer,
  };

  return {
    prepare(sql) {
      return {
        bind() {
          return {
            async first() {
              if (sql.includes("SELECT fulfilled")) {
                return { fulfilled: p.fulfilled };
              }
              return p;
            },
            async run() {
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
    async batch() {
      p.fulfilled = 1;
      c.plan = "developer";
      c.credits += 10000;
      return [
        { meta: { changes: 1 } },
        { meta: { changes: 1 } },
      ];
    },
    _payment: p,
    _customer: c,
  };
}

test("valid NGN payment fulfills", async () => {
  const db = makeDb();

  const result = await fulfillPayment(db, "afr_test_ref", {
    status: "success",
    amount: 4500000,
    currency: "NGN",
    id: 12345,
  });

  assert.equal(result.success, true);
  assert.equal(result.fulfilled, true);
  assert.equal(result.already_fulfilled, false);
  assert.equal(result.credits_added, 10000);
  assert.equal(db._customer.credits, 10100);
});

test("amount mismatch is rejected", async () => {
  const db = makeDb();

  const result = await fulfillPayment(db, "afr_test_ref", {
    status: "success",
    amount: 4400000,
    currency: "NGN",
    id: 12345,
  });

  assert.equal(result.success, false);
  assert.equal(result.reason, "payment_amount_mismatch");
});

test("currency mismatch is rejected", async () => {
  const db = makeDb();

  const result = await fulfillPayment(db, "afr_test_ref", {
    status: "success",
    amount: 4500000,
    currency: "USD",
    id: 12345,
  });

  assert.equal(result.success, false);
  assert.equal(result.reason, "payment_currency_mismatch");
});

test("failed payment is rejected", async () => {
  const db = makeDb();

  const result = await fulfillPayment(db, "afr_test_ref", {
    status: "failed",
    amount: 4500000,
    currency: "NGN",
    id: 12345,
  });

  assert.equal(result.success, false);
  assert.equal(result.reason, "payment_not_successful");
});

test("already fulfilled payment is idempotent", async () => {
  const db = makeDb({ fulfilled: 1 });

  const result = await fulfillPayment(db, "afr_test_ref", {
    status: "success",
    amount: 4500000,
    currency: "NGN",
    id: 12345,
  });

  assert.equal(result.success, true);
  assert.equal(result.fulfilled, true);
  assert.equal(result.already_fulfilled, true);
});
