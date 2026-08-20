import assert from "node:assert/strict";

const URL =
  "https://afriresolve-mcp.afriresolve28.workers.dev/mcp";

async function mcpRequest(id, method, params = {}) {
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params,
    }),
  });

  assert.equal(response.ok, true, `${method} returned HTTP ${response.status}`);

  const raw = await response.text();

  const dataLine = raw
    .split("\n")
    .find((line) => line.startsWith("data: "));

  assert.ok(dataLine, `No SSE data returned for ${method}`);

  return JSON.parse(dataLine.slice(6));
}

const initialized = await mcpRequest(
  1,
  "initialize",
  {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: {
      name: "afriresolve-test",
      version: "1.0.0",
    },
  }
);

assert.equal(initialized.jsonrpc, "2.0");
assert.equal(initialized.id, 1);
assert.equal(initialized.result?.protocolVersion, "2025-06-18");
assert.equal(initialized.result?.serverInfo?.name, "AfriResolve");
assert.equal(initialized.result?.serverInfo?.version, "1.0.0");

console.log("PASS: MCP initialize");

const tools = await mcpRequest(2, "tools/list");

assert.equal(tools.jsonrpc, "2.0");
assert.equal(tools.id, 2);

const resolverTool = tools.result?.tools?.find(
  (tool) => tool.name === "resolve_african_term"
);

assert.ok(resolverTool, "resolve_african_term tool not exposed");
assert.equal(resolverTool.inputSchema?.properties?.query?.type, "string");
assert.ok(
  resolverTool.inputSchema?.required?.includes("query"),
  "query must be required"
);

console.log("PASS: MCP tools/list");

const call = await mcpRequest(
  3,
  "tools/call",
  {
    name: "resolve_african_term",
    arguments: {
      query: "acha",
    },
  }
);

assert.equal(call.jsonrpc, "2.0");
assert.equal(call.id, 3);

const toolText = call.result?.content?.[0]?.text;
assert.ok(toolText, "Missing resolver tool response");

const resolved = JSON.parse(toolText);

assert.equal(resolved.success, true);
assert.equal(resolved.data?.term, "fonio");

console.log("PASS: MCP tools/call — acha → fonio");

console.log("MCP protocol validation completed successfully.");
