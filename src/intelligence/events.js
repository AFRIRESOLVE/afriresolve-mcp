const MAX_TERM_LENGTH = 200;

function clean(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, MAX_TERM_LENGTH);
}

export function createEvent({
  type,
  query = "",
  tool = "",
  success = null,
  metadata = {},
}) {
  return {
    event_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type: clean(type),
    tool: clean(tool),
    query: clean(query).toLowerCase(),
    success,
    metadata,
  };
}

export function createQueryEvent({
  tool,
  query,
  success,
  metadata = {},
}) {
  return createEvent({
    type: success ? "query_success" : "query_failure",
    tool,
    query,
    success,
    metadata,
  });
}

export function createDemandEvent({
  tool,
  query,
  metadata = {},
}) {
  return createEvent({
    type: "demand_signal",
    tool,
    query,
    metadata,
  });
}

export function createKnowledgeGapEvent({
  query,
  tool = "",
  metadata = {},
}) {
  return createEvent({
    type: "knowledge_gap",
    tool,
    query,
    success: false,
    metadata,
  });
}

export function isValidEvent(event) {
  return Boolean(
    event &&
      typeof event.event_id === "string" &&
      typeof event.timestamp === "string" &&
      typeof event.type === "string"
  );
}
