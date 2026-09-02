import { generateApiKey, hashApiKey } from "../billing/auth.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleKeyApi(request, env) {
  const url = new URL(request.url);

  if (url.pathname !== "/v1/keys") return null;

  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!name || !email) {
    return json({ error: "name_and_email_required" }, 400);
  }

  const existingCustomer = await env.DB.prepare(
    `SELECT customer_id, name, email, plan, credits
     FROM customers
     WHERE lower(email) = lower(?)
     LIMIT 1`
  ).bind(email).first();

  if (existingCustomer) {
    return json({
      error: "email_already_registered",
      message: "An AfriResolve account already exists for this email. Use your existing API key.",
      customer: {
        customer_id: existingCustomer.customer_id,
        name: existingCustomer.name,
        email: existingCustomer.email,
        plan: existingCustomer.plan,
        credits: existingCustomer.credits,
      },
    }, 409);
  }

  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);
  const customerId = `cust_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO customers
       (customer_id, api_key_hash, name, email, status, plan, credits, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', 'free', 100, ?, ?)`
    ).bind(
      customerId,
      apiKeyHash,
      name,
      email,
      now,
      now
    ).run();
  } catch (error) {
    console.error("AfriResolve customer creation failed:", error);
    return json({ error: "customer_creation_failed" }, 500);
  }

  return json({
    success: true,
    customer: {
      customer_id: customerId,
      name,
      email,
      plan: "free",
      credits: 100,
    },
    api_key: apiKey,
    warning: "Store this API key securely. It will not be shown again.",
  }, 201);
}
