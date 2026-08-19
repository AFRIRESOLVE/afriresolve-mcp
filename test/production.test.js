import assert from "node:assert/strict";

const URL =
  "https://afriresolve-mcp.afriresolve28.workers.dev/mcp";

async function callTool(query) {
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: "resolve_african_term",
        arguments: { query },
      },
    }),
  });

  assert.equal(response.ok, true);

  const raw = await response.text();

  const dataLine = raw
    .split("\n")
    .find((line) => line.startsWith("data: "));

  assert.ok(dataLine, `No SSE data returned for: ${query}`);

  const mcpResponse = JSON.parse(dataLine.slice(6));

  assert.ok(
    mcpResponse.result,
    `Missing MCP result for: ${query}`
  );

  assert.ok(
    mcpResponse.result.content?.[0]?.text,
    `Missing tool response text for: ${query}`
  );

  return JSON.parse(mcpResponse.result.content[0].text);
}

const tests = [
  ["acha", true],
  ["ACHA", true],
  [" Acha ", true],
  ["egusi", true],
  ["corn", true],
  ["ukwa", true],
  ["peanut", true],
  ["unknown-term-xyz", false],
];

for (const [query, expectedSuccess] of tests) {
  const result = await callTool(query);

  assert.equal(
    result.success,
    expectedSuccess,
    `Unexpected production result for: ${query}`
  );

  console.log(
    `${expectedSuccess ? "PASS" : "PASS (expected failure)"}: ${query}`
  );
}

console.log(
  `Production validation completed: ${tests.length} tests.`
);
