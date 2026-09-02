const DEFAULT_LIMIT = 20;

function safeLimit(value) {
  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(limit, 100);
}

function normalizeRows(rows) {
  return Array.isArray(rows) ? rows : [];
}

export async function getIntelligenceReport(db, options = {}) {
  if (!db || typeof db.prepare !== "function") {
    return {
      success: false,
      reason: "invalid_database",
    };
  }

  const limit = safeLimit(options.limit);

  try {
    const [
      totalsResult,
      topQueriesResult,
      topToolsResult,
      knowledgeGapsResult,
    ] = await Promise.all([
      db
        .prepare(
          `SELECT
             COUNT(*) AS total_events,
             SUM(CASE WHEN type = 'query_success' THEN 1 ELSE 0 END) AS successful_queries,
             SUM(CASE WHEN type = 'query_failure' THEN 1 ELSE 0 END) AS failed_queries,
             SUM(CASE WHEN type = 'demand_signal' THEN 1 ELSE 0 END) AS demand_signals,
             SUM(CASE WHEN type = 'knowledge_gap' THEN 1 ELSE 0 END) AS knowledge_gaps
           FROM intelligence_events`
        )
        .first(),

      db
        .prepare(
          `SELECT
             query,
             COUNT(*) AS count
           FROM intelligence_events
           WHERE query IS NOT NULL
             AND query != ''
           GROUP BY query
           ORDER BY count DESC, query ASC
           LIMIT ?`
        )
        .bind(limit)
        .all(),

      db
        .prepare(
          `SELECT
             tool,
             COUNT(*) AS count
           FROM intelligence_events
           WHERE tool IS NOT NULL
             AND tool != ''
           GROUP BY tool
           ORDER BY count DESC, tool ASC
           LIMIT ?`
        )
        .bind(limit)
        .all(),

      db
        .prepare(
          `SELECT
             query,
             COUNT(*) AS count
           FROM intelligence_events
           WHERE type = 'knowledge_gap'
             AND query IS NOT NULL
             AND query != ''
           GROUP BY query
           ORDER BY count DESC, query ASC
           LIMIT ?`
        )
        .bind(limit)
        .all(),
    ]);

    const totals = totalsResult || {};

    return {
      success: true,
      totals: {
        total_events: Number(totals.total_events || 0),
        successful_queries: Number(totals.successful_queries || 0),
        failed_queries: Number(totals.failed_queries || 0),
        demand_signals: Number(totals.demand_signals || 0),
        knowledge_gaps: Number(totals.knowledge_gaps || 0),
      },
      top_queries: normalizeRows(topQueriesResult?.results),
      top_tools: normalizeRows(topToolsResult?.results),
      knowledge_gaps: normalizeRows(knowledgeGapsResult?.results),
    };
  } catch (error) {
    console.error("AfriResolve intelligence report failed:", error);

    return {
      success: false,
      reason: "database_query_failed",
    };
  }
}
