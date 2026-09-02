import { resolveFood } from "../resolver/resolve.js";
import { searchFoods, searchFoodsRanked } from "../data/query.js";
import { createQueryEvent } from "../intelligence/events.js";
import { persistEvent } from "../intelligence/persist.js";
import {
  chargeToolRequest,
  settleToolRequest,
} from "../billing/gate.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
    },
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

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function recordQuery(ctx, env, { tool, query, success, metadata = {} }) {
  if (!env?.DB) return;

  const event = createQueryEvent({
    tool,
    query,
    success,
    metadata,
    source: "rest",
  });

  ctx?.waitUntil?.(
    persistEvent(env.DB, event).catch((error) => {
      console.error("AfriResolve REST intelligence persistence failed:", error);
    })
  );
}

export async function handleRestApi(request, env, ctx) {
  const url = new URL(request.url);

  if (!url.pathname.startsWith("/v1/")) {
    return null;
  }

  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const routes = {
    "/v1/resolve": {
      tool: "resolve_african_term",
      execute: (body) => {
        const query =
          typeof body?.query === "string" ? body.query.trim() : "";

        if (!query) {
          return { error: "missing_query", status: 400 };
        }

        const result = resolveFood(query);

        if (!result) {
          return { error: "term_not_found", status: 404 };
        }

        return { data: result, status: 200 };
      },
    },

    "/v1/search": {
      tool: "search_african_foods",
      execute: (body) => {
        const query =
          typeof body?.query === "string" ? body.query.trim() : "";

        if (!query) {
          return { error: "missing_query", status: 400 };
        }

        return {
          data: searchFoods(query),
          status: 200,
        };
      },
    },

    "/v1/rank": {
      tool: "rank_african_foods",
      execute: (body) => {
        const query =
          typeof body?.query === "string" ? body.query.trim() : "";

        if (!query) {
          return { error: "missing_query", status: 400 };
        }

        return {
          data: searchFoodsRanked(query),
          status: 200,
        };
      },
    },
  };

  const route = routes[url.pathname];

  if (!route) {
    return json({ error: "endpoint_not_found" }, 404);
  }

  const apiKey = getApiKey(request);

  if (!apiKey) {
    return json({ error: "missing_api_key" }, 401);
  }

  const billing = await chargeToolRequest(
    env.DB,
    apiKey,
    route.tool
  );

  if (!billing.allowed) {
    return json(
      { error: billing.reason },
      billing.reason === "insufficient_credits_or_inactive_customer"
        ? 402
        : 401
    );
  }

  const body = await readBody(request);

  if (!body) {
    await settleToolRequest(env.DB, {
      customerId: billing.customer.customer_id,
      tool: route.tool,
      units: billing.units,
      success: false,
      metadata: {
        source: "rest",
        endpoint: url.pathname,
      },
    });

    return json({ error: "invalid_json" }, 400);
  }

  const result = route.execute(body);

  if (result.error) {
    await settleToolRequest(env.DB, {
      customerId: billing.customer.customer_id,
      tool: route.tool,
      units: billing.units,
      success: false,
      metadata: {
        source: "rest",
        endpoint: url.pathname,
        error: result.error,
      },
    });

    recordQuery(ctx, env, {
      tool: route.tool,
      query: body.query,
      success: false,
      metadata: {
        endpoint: url.pathname,
        error: result.error,
      },
    });

    return json({ error: result.error }, result.status);
  }

  recordQuery(ctx, env, {
    tool: route.tool,
    query: body.query,
    success: true,
    metadata: {
      endpoint: url.pathname,
      plan: billing.customer.plan,
    },
  });

  ctx?.waitUntil?.(
    settleToolRequest(env.DB, {
      customerId: billing.customer.customer_id,
      tool: route.tool,
      units: billing.units,
      success: true,
      metadata: {
        source: "rest",
        endpoint: url.pathname,
        plan: billing.customer.plan,
      },
    }).catch((error) => {
      console.error(
        "AfriResolve REST billing settlement failed:",
        error
      );
    })
  );

  return json({
    success: true,
    data: result.data,
  });
}
