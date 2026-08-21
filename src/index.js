import { createMcpHandler } from "agents/mcp/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { resolveFood } from "./resolver/resolve.js";
import {
  listFoods,
  findFoodsByCategory,
  findFoodsByCountry,
  findFoodsByRegion,
  searchFoods,
  searchFoodsRanked,
} from "./data/query.js";

function createServer() {
  const server = new McpServer({
    name: "AfriResolve",
    version: "1.0.0",
  });

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
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(listFoods()),
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
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(findFoodsByCategory(category)),
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
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(findFoodsByCountry(country)),
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
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(findFoodsByRegion(region)),
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
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(searchFoodsRanked(query)),
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
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(searchFoods(query)),
          },
        ],
      };
    }
  );

  return server;
}

export default {
  fetch(request, env, ctx) {
    return createMcpHandler(createServer)(request, env, ctx);
  },
};
