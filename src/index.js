import { createMcpHandler } from "agents/mcp/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

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
                            query: z.string().min(1).describe("The African term to resolve"),
                                },
                                  },
                                    async ({ query }) => {
                                        return {
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
                                                                                                                                          };
                                                                                                                                            }
                                                                                                                                            );

                                                                                                                                            export default {
                                                                                                                                              fetch(request, env, ctx) {
                                                                                                                                                  return createMcpHandler(server)(request, env, ctx);
                                                                                                                                                    },
                                                                                                                                                    };