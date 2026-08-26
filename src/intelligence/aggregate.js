const VALID_TYPES = new Set([
  "query_success",
  "query_failure",
  "demand_signal",
  "knowledge_gap",
]);

function increment(map, key) {
  if (!key) {
    return;
  }

  map[key] = (map[key] || 0) + 1;
}

function sortCounts(map) {
  return Object.entries(map)
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0]);
    })
    .map(([value, count]) => ({
      value,
      count,
    }));
}

export function aggregateEvents(events = []) {
  const summary = {
    total_events: 0,
    successful_queries: 0,
    failed_queries: 0,
    demand_signals: 0,
    knowledge_gaps: 0,
    queries: {},
    tools: {},
  };

  if (!Array.isArray(events)) {
    return {
      ...summary,
      top_queries: [],
      top_tools: [],
    };
  }

  for (const event of events) {
    if (
      !event ||
      typeof event !== "object" ||
      !VALID_TYPES.has(event.type)
    ) {
      continue;
    }

    summary.total_events += 1;

    if (event.type === "query_success") {
      summary.successful_queries += 1;
    }

    if (event.type === "query_failure") {
      summary.failed_queries += 1;
    }

    if (event.type === "demand_signal") {
      summary.demand_signals += 1;
    }

    if (event.type === "knowledge_gap") {
      summary.knowledge_gaps += 1;
    }

    if (typeof event.query === "string" && event.query.trim()) {
      increment(summary.queries, event.query.trim().toLowerCase());
    }

    if (typeof event.tool === "string" && event.tool.trim()) {
      increment(summary.tools, event.tool.trim());
    }
  }

  return {
    ...summary,
    top_queries: sortCounts(summary.queries),
    top_tools: sortCounts(summary.tools),
  };
}
