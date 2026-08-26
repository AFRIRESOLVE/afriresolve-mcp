import assert from "node:assert/strict";
import {
  createEvent,
  createQueryEvent,
  createDemandEvent,
  createKnowledgeGapEvent,
  isValidEvent,
} from "../src/intelligence/events.js";

const event = createEvent({
  type: "test",
  tool: "test_tool",
  query: "  ACHA  ",
  success: true,
});

assert.equal(event.type, "test");
assert.equal(event.tool, "test_tool");
assert.equal(event.query, "acha");
assert.equal(event.success, true);
assert.equal(typeof event.event_id, "string");
assert.equal(typeof event.timestamp, "string");
assert.equal(isValidEvent(event), true);

const successEvent = createQueryEvent({
  tool: "resolve_african_term",
  query: "acha",
  success: true,
});

assert.equal(successEvent.type, "query_success");
assert.equal(successEvent.success, true);
assert.equal(isValidEvent(successEvent), true);

const failureEvent = createQueryEvent({
  tool: "resolve_african_term",
  query: "unknown-term",
  success: false,
});

assert.equal(failureEvent.type, "query_failure");
assert.equal(failureEvent.success, false);
assert.equal(isValidEvent(failureEvent), true);

const demandEvent = createDemandEvent({
  tool: "search_african_foods",
  query: "fonio",
});

assert.equal(demandEvent.type, "demand_signal");
assert.equal(demandEvent.query, "fonio");
assert.equal(isValidEvent(demandEvent), true);

const gapEvent = createKnowledgeGapEvent({
  tool: "resolve_african_term",
  query: "unknown-african-term",
});

assert.equal(gapEvent.type, "knowledge_gap");
assert.equal(gapEvent.success, false);
assert.equal(isValidEvent(gapEvent), true);

const longQuery = "A".repeat(300);

const boundedEvent = createEvent({
  type: "test",
  query: longQuery,
});

assert.equal(boundedEvent.query.length, 200);

assert.equal(isValidEvent(null), false);
assert.equal(isValidEvent({}), false);
assert.equal(isValidEvent({ event_id: "x" }), false);

console.log("Intelligence events validation completed successfully.");
