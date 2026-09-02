import { createMcpHandler } from "agents/mcp/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { resolveFood } from "./resolver/resolve.js";
import {
  listDishes,
  resolveDish,
  findDishesByCountry,
  findDishesByRegion,
  findDishesByIngredient,
  searchDishes,
} from "./data/dish-query.js";

import {
  listFoods,
  findFoodsByCategory,
  findFoodsByCountry,
  findFoodsByRegion,
  searchFoods,
  searchFoodsRanked,
} from "./data/query.js";

import {
  createQueryEvent,
  createDemandEvent,
  createKnowledgeGapEvent,
} from "./intelligence/events.js";

import { persistEvent } from "./intelligence/persist.js";
import { getIntelligenceReport } from "./intelligence/report.js";
import { chargeToolRequest, settleToolRequest } from "./billing/gate.js";
import { createPayment } from "./payments/service.js";
import { verifyPaystackTransaction } from "./payments/paystack.js";
import { fulfillPayment } from "./payments/fulfill.js";

function recordEvent(ctx, env, event) {
  if (!env?.DB || !event) {
    return;
  }

  ctx?.waitUntil?.(
    persistEvent(env.DB, event).catch((error) => {
      console.error("AfriResolve intelligence event failed:", error);
    })
  );
}

function recordQuery(ctx, env, {
  tool,
  query,
  success,
  metadata = {},
  source = "mcp",
}) {
  recordEvent(
    ctx,
    env,
    createQueryEvent({
      tool,
      query,
      success,
      metadata,
      source,
    })
  );
}

function recordDemand(ctx, env, {
  tool,
  query,
  metadata = {},
  source = "mcp",
}) {
  recordEvent(
    ctx,
    env,
    createDemandEvent({
      tool,
      query,
      metadata,
      source,
    })
  );
}

function recordKnowledgeGap(ctx, env, {
  tool,
  query,
  metadata = {},
  source = "mcp",
}) {
  recordEvent(
    ctx,
    env,
    createKnowledgeGapEvent({
      tool,
      query,
      metadata,
      source,
    })
  );
}

function createServer(env, ctx) {
  const server = new McpServer({
    name: "AfriResolve",
    version: "1.0.0",
  });

  server.registerTool(
    "resolve_african_dish",
    {
      description:
        "Resolve an African dish name or alias and return standardized dish information.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("The African dish name or alias to resolve"),
      },
    },
    async ({ query }) => {
      const result = resolveDish(query);

      recordQuery(ctx, env, {
        tool: "resolve_african_dish",
        query,
        success: Boolean(result),
        metadata: {
          resolved: Boolean(result),
        },
      });

      if (!result) {
        recordKnowledgeGap(ctx, env, {
          tool: "resolve_african_dish",
          query,
        });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              result || {
                success: false,
                query,
                error: "dish_not_found",
              }
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "list_african_dishes",
    {
      description:
        "List all standardized African dish records in the AfriResolve knowledge base.",
    },
    async () => {
      const result = listDishes();

      recordQuery(ctx, env, {
        tool: "list_african_dishes",
        query: "list",
        success: true,
        metadata: {
          result_count: result.length,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "find_dishes_by_country",
    {
      description:
        "Find African dishes associated with a specific African country.",
      inputSchema: {
        country: z
          .string()
          .min(1)
          .describe("Country to search for"),
      },
    },
    async ({ country }) => {
      const result = findDishesByCountry(country);

      recordQuery(ctx, env, {
        tool: "find_dishes_by_country",
        query: country,
        success: result.length > 0,
        metadata: {
          result_count: result.length,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "find_dishes_by_region",
    {
      description:
        "Find African dishes associated with a geographic region such as West Africa or Central Africa.",
      inputSchema: {
        region: z
          .string()
          .min(1)
          .describe("African region to search for"),
      },
    },
    async ({ region }) => {
      const result = findDishesByRegion(region);

      recordQuery(ctx, env, {
        tool: "find_dishes_by_region",
        query: region,
        success: result.length > 0,
        metadata: {
          result_count: result.length,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "find_dishes_by_ingredient",
    {
      description:
        "Find African dishes that use a specific ingredient or food.",
      inputSchema: {
        ingredient: z
          .string()
          .min(1)
          .describe("Ingredient or food to search for"),
      },
    },
    async ({ ingredient }) => {
      const result = findDishesByIngredient(ingredient);

      recordQuery(ctx, env, {
        tool: "find_dishes_by_ingredient",
        query: ingredient,
        success: result.length > 0,
        metadata: {
          result_count: result.length,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "resolve_african_term",
    {
      description:
        "Resolve an African word or food term and return standardized information.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("The African term to resolve"),
      },
    },
    async ({ query }) => {
      const result = resolveFood(query);

      recordQuery(ctx, env, {
        tool: "resolve_african_term",
        query,
        success: result.success,
      });

      if (!result.success) {
        recordKnowledgeGap(ctx, env, {
          tool: "resolve_african_term",
          query,
        });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "list_african_foods",
    {
      description:
        "List all standardized African food records in the AfriResolve knowledge base.",
    },
    async () => {
      const result = listFoods();

      recordQuery(ctx, env, {
        tool: "list_african_foods",
        query: "list",
        success: true,
        metadata: {
          result_count: result.length,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "find_foods_by_category",
    {
      description:
        "Find African foods by category such as grain, root, fruit, legume, seed, tuber, vegetable, or leafy_vegetable.",
      inputSchema: {
        category: z
          .string()
          .min(1)
          .describe("Food category to search for"),
      },
    },
    async ({ category }) => {
      const result = findFoodsByCategory(category);

      recordQuery(ctx, env, {
        tool: "find_foods_by_category",
        query: category,
        success: result.length > 0,
        metadata: {
          result_count: result.length,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "find_foods_by_country",
    {
      description:
        "Find African foods associated with a specific African country.",
      inputSchema: {
        country: z
          .string()
          .min(1)
          .describe("Country to search for"),
      },
    },
    async ({ country }) => {
      const result = findFoodsByCountry(country);

      recordQuery(ctx, env, {
        tool: "find_foods_by_country",
        query: country,
        success: result.length > 0,
        metadata: {
          result_count: result.length,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "find_foods_by_region",
    {
      description:
        "Find African foods associated with a geographic region such as West Africa or Central Africa.",
      inputSchema: {
        region: z
          .string()
          .min(1)
          .describe("African region to search for"),
      },
    },
    async ({ region }) => {
      const result = findFoodsByRegion(region);

      recordQuery(ctx, env, {
        tool: "find_foods_by_region",
        query: region,
        success: result.length > 0,
        metadata: {
          result_count: result.length,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "rank_african_foods",
    {
      description:
        "Search and rank African food records by relevance across names, aliases, categories, countries, regions, descriptions, uses, and nutrition information.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("Search text for ranked African food discovery"),
      },
    },
    async ({ query }) => {
      const result = searchFoodsRanked(query);

      recordDemand(ctx, env, {
        tool: "rank_african_foods",
        query,
        metadata: {
          result_count: result.length,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "search_african_foods",
    {
      description:
        "Search the AfriResolve African food knowledge base across names, aliases, categories, countries, regions, descriptions, uses, and nutrition information.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("Search text for discovering African food records"),
      },
    },
    async ({ query }) => {
      const result = searchFoods(query);

      recordDemand(ctx, env, {
        tool: "search_african_foods",
        query,
        metadata: {
          result_count: result.length,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_afriresolve_intelligence",
    {
      description:
        "Return aggregated AfriResolve usage intelligence, including total activity, demand signals, popular queries, tool usage, and recurring knowledge gaps.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum number of rows returned in each intelligence list"),
      },
    },
    async ({ limit }) => {
      const result = await getIntelligenceReport(env.DB, {
        limit,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  return server;
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

async function getToolName(request) {
  if (request.method !== "POST") return null;

  try {
    const body = await request.clone().json();
    if (body?.method !== "tools/call") return null;

    const name = body?.params?.name;
    return typeof name === "string" && name.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/pay/callback") {
      const reference = url.searchParams.get("reference")?.trim();

      if (!reference) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "missing_reference",
          }),
          {
            status: 400,
            headers: {
              "content-type": "application/json",
            },
          }
        );
      }

      const verified = await verifyPaystackTransaction({
        secretKey: env.PAYSTACK_SECRET_KEY,
        reference,
      });

      if (!verified.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: verified.reason,
            message: verified.message,
          }),
          {
            status: 502,
            headers: {
              "content-type": "application/json",
            },
          }
        );
      }

      const transaction = verified.data;

      const payment = await env.DB
        .prepare(
          `SELECT payment_id, customer_id, plan, amount, currency,
                  reference, status, fulfilled
           FROM payments
           WHERE reference = ?
           LIMIT 1`
        )
        .bind(reference)
        .first();

      if (!payment) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "payment_not_found",
          }),
          {
            status: 404,
            headers: {
              "content-type": "application/json",
            },
          }
        );
      }

      if (transaction.status !== "success") {
        await env.DB
          .prepare(
            `UPDATE payments
             SET status = ?, updated_at = ?
             WHERE reference = ?
               AND fulfilled = 0`
          )
          .bind(
            transaction.status || "failed",
            new Date().toISOString(),
            reference
          )
          .run();

        return new Response(
          JSON.stringify({
            success: false,
            error: "payment_not_successful",
            status: transaction.status,
            reference,
          }),
          {
            status: 402,
            headers: {
              "content-type": "application/json",
            },
          }
        );
      }

      const fulfillment = await fulfillPayment(
        env.DB,
        reference,
        transaction
      );

      return new Response(
        JSON.stringify({
          success: fulfillment.success,
          reference,
          fulfillment,
        }),
        {
          status: fulfillment.success ? 200 : 500,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }

    if (url.pathname === "/pay") {
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({
            error: "method_not_allowed",
          }),
          {
            status: 405,
            headers: {
              "content-type": "application/json",
            },
          }
        );
      }

      const apiKey = getApiKey(request);

      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error: "missing_api_key",
          }),
          {
            status: 401,
            headers: {
              "content-type": "application/json",
            },
          }
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return new Response(
          JSON.stringify({
            error: "invalid_json",
          }),
          {
            status: 400,
            headers: {
              "content-type": "application/json",
            },
          }
        );
      }

      const plan =
        typeof body?.plan === "string"
          ? body.plan.trim().toLowerCase()
          : "";

      const email =
        typeof body?.email === "string"
          ? body.email.trim().toLowerCase()
          : "";

      if (!plan) {
        return new Response(
          JSON.stringify({
            error: "missing_plan",
          }),
          {
            status: 400,
            headers: {
              "content-type": "application/json",
            },
          }
        );
      }

      if (!email) {
        return new Response(
          JSON.stringify({
            error: "missing_email",
          }),
          {
            status: 400,
            headers: {
              "content-type": "application/json",
            },
          }
        );
      }

      const payment = await createPayment({
        db: env.DB,
        secretKey: env.PAYSTACK_SECRET_KEY,
        apiKey,
        plan,
        email,
        callbackUrl: `${url.origin}/pay/callback`,
      });

      const status =
        payment.success
          ? 200
          : payment.reason === "invalid_api_key"
            ? 401
            : payment.reason === "invalid_payment_plan"
              ? 400
              : 500;

      return new Response(
        JSON.stringify(payment),
        {
          status,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }

    const toolName = await getToolName(request);
    let billing = null;

    if (toolName) {
      const apiKey = getApiKey(request);

      if (apiKey) {
        billing = await chargeToolRequest(env.DB, apiKey, toolName);

        if (!billing.allowed) {
          const status =
            billing.reason === "insufficient_credits_or_inactive_customer"
              ? 402
              : 401;

          return new Response(
            JSON.stringify({
              error: billing.reason,
            }),
            {
              status,
              headers: {
                "content-type": "application/json",
              },
            }
          );
        }
      }
    }

    const response = await createMcpHandler(() => createServer(env, ctx))(
      request,
      env,
      ctx
    );

    if (billing?.charged) {
      const successful = response.ok;

      ctx?.waitUntil?.(
        settleToolRequest(env.DB, {
          customerId: billing.customer.customer_id,
          tool: toolName,
          units: billing.units,
          success: successful,
          metadata: {
            plan: billing.customer.plan,
          },
        }).catch((error) => {
          console.error("AfriResolve billing settlement failed:", error);
        })
      );
    }

    return response;
  },
};
