import {
  authenticateCustomer,
  generateApiKey,
  hashApiKey,
} from "../billing/auth.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getApiKey(request) {
  const direct = request.headers.get("x-api-key");
  if (direct?.trim()) return direct.trim();

  const authorization = request.headers.get("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return "";
}

async function authenticateRequest(request, env) {
  const apiKey = getApiKey(request);

  if (!apiKey) {
    return {
      success: false,
      response: json({ error: "missing_api_key" }, 401),
    };
  }

  const authentication = await authenticateCustomer(env.DB, apiKey);

  if (!authentication.authenticated) {
    return {
      success: false,
      response: json(
        { error: authentication.reason || "invalid_api_key" },
        401
      ),
    };
  }

  return {
    success: true,
    customer: authentication.customer,
  };
}

export async function handleKeyApi(request, env) {
  const url = new URL(request.url);

  if (url.pathname !== "/v1/keys" && url.pathname !== "/v1/account") {
    return null;
  }

  if (url.pathname === "/v1/keys" && request.method === "POST") {
    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const name =
      typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim() : "";

    if (!name || !email) {
      return json({ error: "name_and_email_required" }, 400);
    }

    const existingCustomer = await env.DB.prepare(
      `SELECT customer_id, name, email, plan, credits
       FROM customers
       WHERE lower(email) = lower(?)
       LIMIT 1`
    )
      .bind(email)
      .first();

    if (existingCustomer) {
      return json(
        {
          error: "email_already_registered",
          message:
            "An AfriResolve account already exists for this email. Use your existing API key.",
          customer: {
            customer_id: existingCustomer.customer_id,
            name: existingCustomer.name,
            email: existingCustomer.email,
            plan: existingCustomer.plan,
            credits: existingCustomer.credits,
          },
        },
        409
      );
    }

    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);
    const customerId = `cust_${crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 16)}`;
    const now = new Date().toISOString();

    try {
      await env.DB.prepare(
        `INSERT INTO customers
         (customer_id, api_key_hash, name, email, status, plan, credits, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', 'free', 100, ?, ?)`
      )
        .bind(
          customerId,
          apiKeyHash,
          name,
          email,
          now,
          now
        )
        .run();
    } catch (error) {
      console.error(
        "AfriResolve customer creation failed:",
        error
      );
      return json({ error: "customer_creation_failed" }, 500);
    }

    return json(
      {
        success: true,
        customer: {
          customer_id: customerId,
          name,
          email,
          plan: "free",
          credits: 100,
        },
        api_key: apiKey,
        warning:
          "Store this API key securely. It will not be shown again.",
      },
      201
    );
  }

  const authentication = await authenticateRequest(request, env);

  if (!authentication.success) {
    return authentication.response;
  }

  const customer = authentication.customer;

  if (url.pathname === "/v1/keys") {
    if (request.method === "GET") {
      return json({
        success: true,
        key: {
          active: true,
          prefix: "afr_",
        },
        customer,
      });
    }

    if (request.method === "DELETE") {
      const now = new Date().toISOString();

      const result = await env.DB.prepare(
        `UPDATE customers
         SET api_key_hash = NULL,
             status = 'revoked',
             updated_at = ?
         WHERE customer_id = ?
           AND status = 'active'`
      )
        .bind(now, customer.customer_id)
        .run();

      if (!result.success || result.meta?.changes !== 1) {
        return json(
          { error: "key_revocation_failed" },
          500
        );
      }

      return json({
        success: true,
        revoked: true,
        customer_id: customer.customer_id,
        message:
          "API key revoked successfully. This key can no longer authenticate requests.",
      });
    }

    return json({ error: "method_not_allowed" }, 405);
  }

  if (url.pathname === "/v1/account") {
    if (request.method !== "GET") {
      return json({ error: "method_not_allowed" }, 405);
    }

    const usage = await env.DB.prepare(
      `SELECT
         COUNT(*) AS requests,
         COALESCE(SUM(units), 0) AS units,
         COALESCE(SUM(CASE WHEN status = 'recorded' THEN units ELSE 0 END), 0) AS recorded_units,
         COALESCE(SUM(CASE WHEN status = 'refunded' THEN units ELSE 0 END), 0) AS refunded_units
       FROM usage_ledger
       WHERE customer_id = ?`
    )
      .bind(customer.customer_id)
      .first();

    return json({
      success: true,
      customer,
      usage: {
        requests: Number(usage?.requests || 0),
        units: Number(usage?.units || 0),
        recorded_units: Number(usage?.recorded_units || 0),
        refunded_units: Number(usage?.refunded_units || 0),
      },
    });
  }

  return null;
}
