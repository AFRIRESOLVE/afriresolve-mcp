import { createMcpHandler } from "agents/mcp/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

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
    async ({ query }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            query,
            message: "AfriResolve MCP connection is working.",
          }),
        },
      ],
    }),
  );

  return server;
}

export default {
  fetch(request, env, ctx) {
    return createMcpHandler(createServer)(request, env, ctx);
  },
};
