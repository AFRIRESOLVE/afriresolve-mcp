import { isValidEvent } from "./events.js";

export async function persistEvent(db, event) {
  if (!db || !isValidEvent(event)) {
    return {
      success: false,
      persisted: false,
      reason: "invalid_database_or_event",
    };
  }

  try {
    const metadata =
      event.metadata && typeof event.metadata === "object"
        ? JSON.stringify(event.metadata)
        : "{}";

    const success =
      event.success === true
        ? 1
        : event.success === false
          ? 0
          : null;

    const source =
      typeof event.source === "string" && event.source.trim()
        ? event.source.trim().toLowerCase()
        : "unknown";

    await db
      .prepare(
        `INSERT INTO intelligence_events
          (event_id, timestamp, type, tool, query, success, metadata, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        event.event_id,
        event.timestamp,
        event.type,
        event.tool || null,
        event.query || null,
        success,
        metadata,
        source
      )
      .run();

    return {
      success: true,
      persisted: true,
    };
  } catch (error) {
    console.error("AfriResolve intelligence persistence failed:", error);

    return {
      success: false,
      persisted: false,
      reason: "database_write_failed",
    };
  }
}
