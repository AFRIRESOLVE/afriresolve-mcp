function safeUnits(units) {
  return Number.isInteger(units) && units > 0 ? units : 1;
}

function safeMetadata(metadata) {
  return metadata && typeof metadata === "object"
    ? JSON.stringify(metadata)
    : "{}";
}

export async function reserveCredits(
  db,
  {
    customerId,
    units = 1,
  }
) {
  if (!db || typeof customerId !== "string" || !customerId.trim()) {
    return {
      success: false,
      reserved: false,
      reason: "invalid_database_or_customer",
    };
  }

  const safe = safeUnits(units);

  try {
    const result = await db
      .prepare(
        `UPDATE customers
         SET credits = credits - ?,
             updated_at = ?
         WHERE customer_id = ?
           AND status = 'active'
           AND credits >= ?`
      )
      .bind(
        safe,
        new Date().toISOString(),
        customerId.trim(),
        safe
      )
      .run();

    const changes = Number(result?.meta?.changes || 0);

    if (changes !== 1) {
      return {
        success: false,
        reserved: false,
        reason: "insufficient_credits_or_inactive_customer",
        customer_id: customerId.trim(),
        units: safe,
      };
    }

    return {
      success: true,
      reserved: true,
      customer_id: customerId.trim(),
      units: safe,
    };
  } catch (error) {
    console.error("AfriResolve credit reservation failed:", error);

    return {
      success: false,
      reserved: false,
      reason: "database_write_failed",
    };
  }
}

export async function refundCredits(
  db,
  {
    customerId,
    units = 1,
  }
) {
  if (!db || typeof customerId !== "string" || !customerId.trim()) {
    return {
      success: false,
      refunded: false,
      reason: "invalid_database_or_customer",
    };
  }

  const safe = safeUnits(units);

  try {
    const result = await db
      .prepare(
        `UPDATE customers
         SET credits = credits + ?,
             updated_at = ?
         WHERE customer_id = ?
           AND status = 'active'`
      )
      .bind(
        safe,
        new Date().toISOString(),
        customerId.trim()
      )
      .run();

    const changes = Number(result?.meta?.changes || 0);

    if (changes !== 1) {
      return {
        success: false,
        refunded: false,
        reason: "customer_not_found_or_inactive",
        customer_id: customerId.trim(),
        units: safe,
      };
    }

    return {
      success: true,
      refunded: true,
      customer_id: customerId.trim(),
      units: safe,
    };
  } catch (error) {
    console.error("AfriResolve credit refund failed:", error);

    return {
      success: false,
      refunded: false,
      reason: "database_write_failed",
    };
  }
}

export async function recordUsage(
  db,
  {
    customerId = null,
    tool,
    units = 1,
    billable = false,
    status = "recorded",
    metadata = {},
  }
) {
  if (!db || typeof tool !== "string" || !tool.trim()) {
    return {
      success: false,
      recorded: false,
      reason: "invalid_database_or_tool",
    };
  }

  const usageId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const safe = safeUnits(units);

  try {
    await db
      .prepare(
        `INSERT INTO usage_ledger
         (usage_id, customer_id, tool, units, billable, status, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        usageId,
        customerId,
        tool.trim(),
        safe,
        billable ? 1 : 0,
        status,
        safeMetadata(metadata),
        createdAt
      )
      .run();

    return {
      success: true,
      recorded: true,
      usage_id: usageId,
      customer_id: customerId,
      tool: tool.trim(),
      units: safe,
      billable: Boolean(billable),
      status,
      created_at: createdAt,
    };
  } catch (error) {
    console.error("AfriResolve usage recording failed:", error);

    return {
      success: false,
      recorded: false,
      reason: "database_write_failed",
    };
  }
}
