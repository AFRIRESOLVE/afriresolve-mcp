import assert from "node:assert/strict";
import { createQueryEvent } from "../src/intelligence/events.js";
import { persistEvent } from "../src/intelligence/persist.js";

const calls = [];

const fakeDb = {
  prepare(sql) {
    calls.push({ sql });

    return {
      bind(...values) {
        calls.push({ values });

        return {
          async run() {
            calls.push({ run: true });
            return { success: true };
          },
        };
      },
    };
  },
};

const event = createQueryEvent({
  tool: "resolve_african_term",
  query: "acha",
  success: true,
  metadata: {
    source: "mcp",
  },
});

const result = await persistEvent(fakeDb, event);

assert.equal(result.success, true);
assert.equal(result.persisted, true);

assert.equal(calls.length, 3);
assert.match(calls[0].sql, /INSERT INTO intelligence_events/i);

assert.equal(calls[1].values[0], event.event_id);
assert.equal(calls[1].values[1], event.timestamp);
assert.equal(calls[1].values[2], "query_success");
assert.equal(calls[1].values[3], "resolve_african_term");
assert.equal(calls[1].values[4], "acha");
assert.equal(calls[1].values[5], 1);
assert.equal(calls[1].values[6], JSON.stringify({ source: "mcp" }));

assert.equal(calls[2].run, true);

const invalid = await persistEvent(null, event);

assert.equal(invalid.success, false);
assert.equal(invalid.persisted, false);

const brokenDb = {
  prepare() {
    throw new Error("database unavailable");
  },
};

const failed = await persistEvent(brokenDb, event);

assert.equal(failed.success, false);
assert.equal(failed.persisted, false);

console.log("Intelligence persistence validation completed successfully.");
