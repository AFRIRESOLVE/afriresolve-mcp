const API_KEY_PREFIX = "afr_";

function normalizeKey(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function hashApiKey(apiKey) {
  const key = normalizeKey(apiKey);

  if (!key) {
    return null;
  }

  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function generateApiKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  const randomPart = [...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `${API_KEY_PREFIX}${randomPart}`;
}

export async function authenticateCustomer(db, apiKey) {
  if (!db || !apiKey) {
    return {
      success: false,
      authenticated: false,
      reason: "missing_database_or_api_key",
    };
  }

  const hash = await hashApiKey(apiKey);

  const result = await db
    .prepare(
      `SELECT customer_id, name, email, status, plan, credits
       FROM customers
       WHERE api_key_hash = ?
       LIMIT 1`
    )
    .bind(hash)
    .first();

  if (!result) {
    return {
      success: false,
      authenticated: false,
      reason: "invalid_api_key",
    };
  }

  if (result.status !== "active") {
    return {
      success: false,
      authenticated: false,
      reason: "customer_inactive",
      customer_id: result.customer_id,
    };
  }

  return {
    success: true,
    authenticated: true,
    customer: result,
  };
}
