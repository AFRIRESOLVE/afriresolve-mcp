import assert from "node:assert/strict";

import { handleRestApi } from "../src/api/rest.js";
import { hashApiKey } from "../src/billing/auth.js";

const API_KEY = "afr_test_rest_key";

async function createMockDb({
  customer = {
    customer_id: "cust_rest_001",
    name: "REST API Test",
    email: "rest-api@example.invalid",
    status: "active",
    plan: "free",
    credits: 100,
  },
  reservationChanges = 1,
  refundChanges = 1,
} = {}) {
  const calls = [];
  const apiKeyHash = await hashApiKey(API_KEY);

  return {
    calls,

    prepare(sql) {
      return {
        bind(...params) {
          calls.push({ sql, params });

          return {
            async first() {
              if (/SELECT customer_id/i.test(sql)) {
                if (/api_key_hash/i.test(sql) && params[0] === apiKeyHash) {
                  return customer;
                }
                return null;
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

              if (/INSERT INTO intelligence_events/i.test(sql)) {
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

function createContext() {
  const pending = [];

  return {
    pending,
    waitUntil(promise) {
      pending.push(Promise.resolve(promise));
    },
  };
}

async function request(path, {
  method = "POST",
  apiKey = API_KEY,
  body,
} = {}) {
  const headers = {};

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  const request = new Request(`https://example.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const db = await createMockDb();
  const ctx = createContext();

  const response = await handleRestApi(request, { DB: db }, ctx);
  const data = await response.json();

  await Promise.all(ctx.pending);

  return { response, data, db, ctx };
}

async function testUnknownEndpoint() {
  const result = await request("/v1/unknown");

  assert.equal(result.response.status, 404);
  assert.deepEqual(result.data, {
    error: "endpoint_not_found",
  });
}

async function testMissingApiKey() {
  const result = await request("/v1/resolve", {
    apiKey: "",
    body: { query: "acha" },
  });

  assert.equal(result.response.status, 401);
  assert.deepEqual(result.data, {
    error: "missing_api_key",
  });
}

async function testMissingQueryRefundsCredit() {
  const result = await request("/v1/resolve", {
    body: {},
  });

  assert.equal(result.response.status, 400);
  assert.deepEqual(result.data, {
    error: "missing_query",
  });

  assert.equal(
    result.db.calls.filter((call) => /credits = credits -/i.test(call.sql))
      .length,
    1
  );

  assert.equal(
    result.db.calls.filter((call) => /credits = credits \+/i.test(call.sql))
      .length,
    1
  );

  const usageCall = result.db.calls.find((call) =>
    /INSERT INTO usage_ledger/i.test(call.sql)
  );

  assert.ok(usageCall);
  assert.equal(usageCall.params[5], "refunded");
}

async function testResolveSuccess() {
  const result = await request("/v1/resolve", {
    body: { query: "acha" },
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.data.success, true);
  assert.equal(result.data.data.data.term, "fonio");

  assert.equal(
    result.db.calls.filter((call) => /credits = credits -/i.test(call.sql))
      .length,
    1
  );

  assert.equal(
    result.db.calls.filter((call) => /INSERT INTO usage_ledger/i.test(call.sql))
      .length,
    1
  );

  const usageCall = result.db.calls.find((call) =>
    /INSERT INTO usage_ledger/i.test(call.sql)
  );

  assert.equal(usageCall.params[5], "recorded");
}

async function testSearchSuccess() {
  const result = await request("/v1/search", {
    body: { query: "grain" },
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.data.success, true);
  assert.ok(Array.isArray(result.data.data));
}

async function testRankSuccess() {
  const result = await request("/v1/rank", {
    body: { query: "nigeria grain" },
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.data.success, true);
  assert.ok(Array.isArray(result.data.data));
}

async function testUnknownTermRefundsCredit() {
  const result = await request("/v1/resolve", {
    body: { query: "unknown-term-xyz" },
  });

  assert.equal(result.response.status, 404);
  assert.deepEqual(result.data, {
    error: "term_not_found",
  });

  assert.equal(
    result.db.calls.filter((call) => /credits = credits \+/i.test(call.sql))
      .length,
    1
  );

  const usageCall = result.db.calls.find((call) =>
    /INSERT INTO usage_ledger/i.test(call.sql)
  );

  assert.ok(usageCall);
  assert.equal(usageCall.params[5], "refunded");
}

await testUnknownEndpoint();
await testMissingApiKey();
await testMissingQueryRefundsCredit();
await testResolveSuccess();
await testSearchSuccess();
await testRankSuccess();
await testUnknownTermRefundsCredit();

console.log("REST API tests passed");
