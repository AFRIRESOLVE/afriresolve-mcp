import assert from "node:assert/strict";

const URL =
  "https://afriresolve-mcp.afriresolve28.workers.dev/mcp";
const API_KEY = process.env.AFRI_API_KEY?.trim();

async function mcpRequest(id, method, params = {}) {
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "x-api-key": API_KEY,
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

if (!API_KEY) {
  console.log(
    "MCP protocol validation skipped: AFRI_API_KEY is not set."
  );
  process.exit(0);
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

const unknownCall = await mcpRequest(
  4,
  "tools/call",
  {
    name: "resolve_african_term",
    arguments: {
      query: "unknown-term-xyz",
    },
  }
);

assert.equal(unknownCall.jsonrpc, "2.0");
assert.equal(unknownCall.id, 4);

const unknownToolText = unknownCall.result?.content?.[0]?.text;
assert.ok(
  unknownToolText,
  "Missing unknown-term resolver response"
);

const unknownResolved = JSON.parse(unknownToolText);

assert.equal(unknownResolved.success, false);
assert.equal(unknownResolved.query, "unknown-term-xyz");
assert.ok(
  unknownResolved.message,
  "Unknown term should include an explanatory message"
);

console.log("PASS: MCP tools/call - unknown term handling");

console.log("Extended MCP protocol validation completed successfully.");

const unknownTool = await mcpRequest(
  5,
  "tools/call",
  {
    name: "does_not_exist",
    arguments: {},
  }
);

assert.equal(unknownTool.jsonrpc, "2.0");
assert.equal(unknownTool.id, 5);
assert.equal(unknownTool.error?.code, -32602);
assert.equal(
  unknownTool.error?.message,
  "Tool does_not_exist not found"
);

console.log("PASS: MCP unknown tool handling");

console.log("Full MCP protocol validation completed successfully.");

const missingQueryCall = await mcpRequest(
  6,
  "tools/call",
  {
    name: "resolve_african_term",
    arguments: {},
  }
);

assert.equal(missingQueryCall.jsonrpc, "2.0");
assert.equal(missingQueryCall.id, 6);
assert.equal(missingQueryCall.result?.isError, true);

const missingQueryText = missingQueryCall.result?.content?.[0]?.text;

assert.ok(
  missingQueryText,
  "Missing validation error response for absent query"
);

assert.match(
  missingQueryText,
  /query: Invalid input: expected string, received undefined/
);

console.log("PASS: MCP missing query validation");

const numericQueryCall = await mcpRequest(
  7,
  "tools/call",
  {
    name: "resolve_african_term",
    arguments: {
      query: 123,
    },
  }
);

assert.equal(numericQueryCall.jsonrpc, "2.0");
assert.equal(numericQueryCall.id, 7);
assert.equal(numericQueryCall.result?.isError, true);

const numericQueryText =
  numericQueryCall.result?.content?.[0]?.text;

assert.ok(
  numericQueryText,
  "Missing validation error response for numeric query"
);

assert.match(
  numericQueryText,
  /query: Invalid input: expected string, received number/
);

console.log("PASS: MCP numeric query validation");

const emptyQueryCall = await mcpRequest(
  8,
  "tools/call",
  {
    name: "resolve_african_term",
    arguments: {
      query: "",
    },
  }
);

assert.equal(emptyQueryCall.jsonrpc, "2.0");
assert.equal(emptyQueryCall.id, 8);
assert.equal(emptyQueryCall.result?.isError, true);

const emptyQueryText =
  emptyQueryCall.result?.content?.[0]?.text;

assert.ok(
  emptyQueryText,
  "Missing validation error response for empty query"
);

assert.match(
  emptyQueryText,
  /query: Too small: expected string to have >=1 characters/
);

console.log("PASS: MCP empty query validation");


const listFoodsCall = await mcpRequest(
  20,
  "tools/call",
  {
    name: "list_african_foods",
    arguments: {},
  }
);

assert.equal(listFoodsCall.jsonrpc, "2.0");
assert.equal(listFoodsCall.id, 20);
assert.equal(listFoodsCall.result?.isError, undefined);

const listFoodsText =
  listFoodsCall.result?.content?.[0]?.text;

assert.ok(
  listFoodsText,
  "Missing list_african_foods response"
);

const listedFoods = JSON.parse(listFoodsText);

assert.equal(
  listedFoods.length,
  20,
  "Expected 20 African foods"
);

assert.ok(
  listedFoods.some((food) => food.term === "fonio"),
  "Fonio missing from food list"
);

console.log("PASS: MCP list_african_foods");


const categoryCall = await mcpRequest(
  21,
  "tools/call",
  {
    name: "find_foods_by_category",
    arguments: {
      category: "grain",
    },
  }
);

assert.equal(categoryCall.jsonrpc, "2.0");
assert.equal(categoryCall.id, 21);
assert.equal(categoryCall.result?.isError, undefined);

const categoryText =
  categoryCall.result?.content?.[0]?.text;

assert.ok(
  categoryText,
  "Missing category query response"
);

const grainFoods = JSON.parse(categoryText);

assert.ok(
  grainFoods.length > 0,
  "Expected grain query to return results"
);

assert.ok(
  grainFoods.some((food) => food.term === "fonio"),
  "Fonio missing from grain query"
);

console.log("PASS: MCP find_foods_by_category");


const countryCall = await mcpRequest(
  22,
  "tools/call",
  {
    name: "find_foods_by_country",
    arguments: {
      country: "nigeria",
    },
  }
);

assert.equal(countryCall.jsonrpc, "2.0");
assert.equal(countryCall.id, 22);
assert.equal(countryCall.result?.isError, undefined);

const countryText =
  countryCall.result?.content?.[0]?.text;

assert.ok(
  countryText,
  "Missing country query response"
);

const nigeriaFoods = JSON.parse(countryText);

assert.ok(
  nigeriaFoods.length > 0,
  "Expected Nigeria query to return results"
);

assert.ok(
  nigeriaFoods.some((food) => food.term === "fonio"),
  "Fonio missing from Nigeria query"
);

console.log("PASS: MCP find_foods_by_country");


const regionCall = await mcpRequest(
  23,
  "tools/call",
  {
    name: "find_foods_by_region",
    arguments: {
      region: "west africa",
    },
  }
);

assert.equal(regionCall.jsonrpc, "2.0");
assert.equal(regionCall.id, 23);
assert.equal(regionCall.result?.isError, undefined);

const regionText =
  regionCall.result?.content?.[0]?.text;

assert.ok(
  regionText,
  "Missing region query response"
);

const westAfricanFoods = JSON.parse(regionText);

assert.ok(
  westAfricanFoods.length > 0,
  "Expected West Africa query to return results"
);

assert.ok(
  westAfricanFoods.some((food) => food.term === "fonio"),
  "Fonio missing from West Africa query"
);

console.log("PASS: MCP find_foods_by_region");


const invalidCategoryCall = await mcpRequest(
  24,
  "tools/call",
  {
    name: "find_foods_by_category",
    arguments: {
      category: "",
    },
  }
);

assert.equal(invalidCategoryCall.jsonrpc, "2.0");
assert.equal(invalidCategoryCall.id, 24);
assert.equal(invalidCategoryCall.result?.isError, true);

console.log("PASS: MCP query validation");


console.log(
  "Extended MCP query tool validation completed successfully."
);

const searchAchaCall = await mcpRequest(
  30,
  "tools/call",
  {
    name: "search_african_foods",
    arguments: {
      query: "acha",
    },
  }
);

assert.equal(searchAchaCall.jsonrpc, "2.0");
assert.equal(searchAchaCall.id, 30);
assert.equal(searchAchaCall.result?.isError, undefined);

const searchAchaText =
  searchAchaCall.result?.content?.[0]?.text;

assert.ok(
  searchAchaText,
  "Missing search_african_foods response for acha"
);

const searchAchaResults = JSON.parse(searchAchaText);

assert.ok(
  searchAchaResults.some((food) => food.term === "fonio"),
  "Search for acha should return fonio"
);

console.log("PASS: MCP search_african_foods - acha -> fonio");

const searchNigeriaCall = await mcpRequest(
  31,
  "tools/call",
  {
    name: "search_african_foods",
    arguments: {
      query: "nigeria",
    },
  }
);

assert.equal(searchNigeriaCall.jsonrpc, "2.0");
assert.equal(searchNigeriaCall.id, 31);
assert.equal(searchNigeriaCall.result?.isError, undefined);

const searchNigeriaText =
  searchNigeriaCall.result?.content?.[0]?.text;

assert.ok(
  searchNigeriaText,
  "Missing search_african_foods response for nigeria"
);

const searchNigeriaResults = JSON.parse(searchNigeriaText);

assert.ok(
  searchNigeriaResults.length > 0,
  "Search for nigeria should return foods"
);

console.log("PASS: MCP search_african_foods - nigeria");

const searchGrainCall = await mcpRequest(
  32,
  "tools/call",
  {
    name: "search_african_foods",
    arguments: {
      query: "grain",
    },
  }
);

assert.equal(searchGrainCall.jsonrpc, "2.0");
assert.equal(searchGrainCall.id, 32);
assert.equal(searchGrainCall.result?.isError, undefined);

const searchGrainText =
  searchGrainCall.result?.content?.[0]?.text;

assert.ok(
  searchGrainText,
  "Missing search_african_foods response for grain"
);

const searchGrainResults = JSON.parse(searchGrainText);

assert.ok(
  searchGrainResults.length > 0,
  "Search for grain should return foods"
);

console.log("PASS: MCP search_african_foods - grain");

const searchMissingQueryCall = await mcpRequest(
  33,
  "tools/call",
  {
    name: "search_african_foods",
    arguments: {},
  }
);

assert.equal(searchMissingQueryCall.jsonrpc, "2.0");
assert.equal(searchMissingQueryCall.id, 33);
assert.equal(searchMissingQueryCall.result?.isError, true);

console.log("PASS: MCP search_african_foods - missing query");

const searchNumericQueryCall = await mcpRequest(
  34,
  "tools/call",
  {
    name: "search_african_foods",
    arguments: {
      query: 123,
    },
  }
);

assert.equal(searchNumericQueryCall.jsonrpc, "2.0");
assert.equal(searchNumericQueryCall.id, 34);
assert.equal(searchNumericQueryCall.result?.isError, true);

console.log("PASS: MCP search_african_foods - numeric query");

const searchEmptyQueryCall = await mcpRequest(
  35,
  "tools/call",
  {
    name: "search_african_foods",
    arguments: {
      query: "",
    },
  }
);

assert.equal(searchEmptyQueryCall.jsonrpc, "2.0");
assert.equal(searchEmptyQueryCall.id, 35);
assert.equal(searchEmptyQueryCall.result?.isError, true);

console.log("PASS: MCP search_african_foods - empty query");

console.log("MCP search tool validation completed successfully.");

const rankAchaCall = await mcpRequest(
  40,
  "tools/call",
  {
    name: "rank_african_foods",
    arguments: {
      query: "acha",
    },
  }
);

assert.equal(rankAchaCall.jsonrpc, "2.0");
assert.equal(rankAchaCall.id, 40);
assert.equal(rankAchaCall.result?.isError, undefined);

const rankAchaText =
  rankAchaCall.result?.content?.[0]?.text;

assert.ok(
  rankAchaText,
  "Missing rank_african_foods response for acha"
);

const rankAchaResults = JSON.parse(rankAchaText);

assert.ok(
  rankAchaResults.length > 0,
  "Ranked search for acha should return results"
);

assert.equal(
  rankAchaResults[0].term,
  "fonio",
  "Ranked search for acha should put fonio first"
);

assert.equal(
  rankAchaResults[0].relevance.score,
  90,
  "Acha should receive the expected relevance score"
);

console.log("PASS: MCP rank_african_foods - acha -> fonio");

const rankFonioCall = await mcpRequest(
  41,
  "tools/call",
  {
    name: "rank_african_foods",
    arguments: {
      query: "fonio",
    },
  }
);

assert.equal(rankFonioCall.jsonrpc, "2.0");
assert.equal(rankFonioCall.id, 41);
assert.equal(rankFonioCall.result?.isError, undefined);

const rankFonioText =
  rankFonioCall.result?.content?.[0]?.text;

assert.ok(
  rankFonioText,
  "Missing rank_african_foods response for fonio"
);

const rankFonioResults = JSON.parse(rankFonioText);

assert.equal(
  rankFonioResults[0].term,
  "fonio",
  "Exact fonio search should rank fonio first"
);

assert.equal(
  rankFonioResults[0].relevance.score,
  100,
  "Exact fonio search should score 100"
);

console.log("PASS: MCP rank_african_foods - exact term");

const rankNigeriaCall = await mcpRequest(
  42,
  "tools/call",
  {
    name: "rank_african_foods",
    arguments: {
      query: "nigeria",
    },
  }
);

assert.equal(rankNigeriaCall.jsonrpc, "2.0");
assert.equal(rankNigeriaCall.id, 42);
assert.equal(rankNigeriaCall.result?.isError, undefined);

const rankNigeriaText =
  rankNigeriaCall.result?.content?.[0]?.text;

assert.ok(
  rankNigeriaText,
  "Missing rank_african_foods response for nigeria"
);

const rankNigeriaResults = JSON.parse(rankNigeriaText);

assert.ok(
  rankNigeriaResults.length > 0,
  "Nigeria ranked search should return results"
);

assert.ok(
  rankNigeriaResults.every(
    (food) => food.relevance.match_type === "country"
  ),
  "Nigeria ranked results should identify country matches"
);

console.log("PASS: MCP rank_african_foods - nigeria");

const rankGrainCall = await mcpRequest(
  43,
  "tools/call",
  {
    name: "rank_african_foods",
    arguments: {
      query: "grain",
    },
  }
);

assert.equal(rankGrainCall.jsonrpc, "2.0");
assert.equal(rankGrainCall.id, 43);
assert.equal(rankGrainCall.result?.isError, undefined);

const rankGrainText =
  rankGrainCall.result?.content?.[0]?.text;

assert.ok(
  rankGrainText,
  "Missing rank_african_foods response for grain"
);

const rankGrainResults = JSON.parse(rankGrainText);

assert.ok(
  rankGrainResults.length > 0,
  "Grain ranked search should return results"
);

assert.ok(
  rankGrainResults.every(
    (food) => food.relevance.match_type === "category"
  ),
  "Grain ranked results should identify category matches"
);

console.log("PASS: MCP rank_african_foods - grain");

const rankMissingQueryCall = await mcpRequest(
  44,
  "tools/call",
  {
    name: "rank_african_foods",
    arguments: {},
  }
);

assert.equal(rankMissingQueryCall.jsonrpc, "2.0");
assert.equal(rankMissingQueryCall.id, 44);
assert.equal(rankMissingQueryCall.result?.isError, true);

console.log("PASS: MCP rank_african_foods - missing query");

const rankNumericQueryCall = await mcpRequest(
  45,
  "tools/call",
  {
    name: "rank_african_foods",
    arguments: {
      query: 123,
    },
  }
);

assert.equal(rankNumericQueryCall.jsonrpc, "2.0");
assert.equal(rankNumericQueryCall.id, 45);
assert.equal(rankNumericQueryCall.result?.isError, true);

console.log("PASS: MCP rank_african_foods - numeric query");

const rankEmptyQueryCall = await mcpRequest(
  46,
  "tools/call",
  {
    name: "rank_african_foods",
    arguments: {
      query: "",
    },
  }
);

assert.equal(rankEmptyQueryCall.jsonrpc, "2.0");
assert.equal(rankEmptyQueryCall.id, 46);
assert.equal(rankEmptyQueryCall.result?.isError, true);

console.log("PASS: MCP rank_african_foods - empty query");

console.log("MCP ranked search validation completed successfully.");

async function callDishTool(name, args = {}) {
  const response = await mcpRequest(
    `dish-${name}-${Date.now()}`,
    "tools/call",
    { name, arguments: args }
  );

  assert.equal(response.error, undefined);
  return JSON.parse(response.result.content[0].text);
}

const resolvedDish = await callDishTool(
  "resolve_african_dish",
  { query: "jollof" }
);

assert.equal(resolvedDish.common_name, "Jollof rice");
console.log("PASS: MCP resolve_african_dish - jollof");

const dishes = await callDishTool("list_african_dishes");
assert.equal(dishes.length, 5);
console.log("PASS: MCP list_african_dishes");

const nigeriaDishes = await callDishTool(
  "find_dishes_by_country",
  { country: "Nigeria" }
);
assert.equal(nigeriaDishes.length, 5);
console.log("PASS: MCP find_dishes_by_country - Nigeria");

const westAfricaDishes = await callDishTool(
  "find_dishes_by_region",
  { region: "West Africa" }
);
assert.equal(westAfricaDishes.length, 5);
console.log("PASS: MCP find_dishes_by_region - West Africa");

const beanDishes = await callDishTool(
  "find_dishes_by_ingredient",
  { ingredient: "beans" }
);
assert.equal(beanDishes.length, 2);
console.log("PASS: MCP find_dishes_by_ingredient - beans");

console.log("MCP dish tool validation completed successfully.");


