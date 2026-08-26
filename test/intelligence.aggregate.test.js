import assert from "node:assert/strict";
import { aggregateEvents } from "../src/intelligence/aggregate.js";

const events = [
  {
    type: "query_success",
    query: "acha",
    tool: "resolve_african_term",
  },
  {
    type: "query_success",
    query: "ACHA",
    tool: "resolve_african_term",
  },
  {
    type: "query_failure",
    query: "unknown-term",
    tool: "resolve_african_term",
  },
  {
    type: "demand_signal",
    query: "acha",
    tool: "search_african_foods",
  },
  {
    type: "knowledge_gap",
    query: "unknown-term",
    tool: "resolve_african_term",
  },
  {
    type: "invalid_event",
    query: "should-be-ignored",
    tool: "bad_tool",
  },
];

const result = aggregateEvents(events);

assert.equal(result.total_events, 5);
assert.equal(result.successful_queries, 2);
assert.equal(result.failed_queries, 1);
assert.equal(result.demand_signals, 1);
assert.equal(result.knowledge_gaps, 1);

assert.deepEqual(result.top_queries, [
  { value: "acha", count: 3 },
  { value: "unknown-term", count: 2 },
]);

assert.deepEqual(result.top_tools, [
  { value: "resolve_african_term", count: 4 },
  { value: "search_african_foods", count: 1 },
]);

assert.deepEqual(aggregateEvents(null).top_queries, []);
assert.deepEqual(aggregateEvents("invalid").top_tools, []);

console.log("Intelligence aggregation validation completed successfully.");
