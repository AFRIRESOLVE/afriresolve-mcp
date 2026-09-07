import assert from "node:assert/strict";
import { handleDeveloperPage } from "../src/api/developers.js";

async function testDeveloperPage() {
  const request = new Request("https://example.test/developers", {
    method: "GET",
  });

  const response = handleDeveloperPage(request);

  assert.ok(response);
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") || "",
    /text\/html/i
  );

  const html = await response.text();

  assert.match(html, /AfriResolve/i);
  assert.match(html, /Create Free API Key/i);
  assert.match(html, /\/v1\/keys/i);
  assert.match(html, /\/v1\/resolve/i);
  assert.match(html, /\/v1\/search/i);
  assert.match(html, /startCheckout/i);
  assert.match(html, /"NG"/);
  assert.match(
    html,
    /https:\/\/afriresolve-mcp\.afriresolve28\.workers\.dev\/mcp/
  );
}

async function testNonDeveloperPath() {
  const request = new Request("https://example.test/");
  assert.equal(handleDeveloperPage(request), null);
}

async function testMethodNotAllowed() {
  const request = new Request("https://example.test/developers", {
    method: "POST",
  });

  const response = handleDeveloperPage(request);

  assert.ok(response);
  assert.equal(response.status, 405);
}

await testDeveloperPage();
await testNonDeveloperPath();
await testMethodNotAllowed();

console.log("Developer page tests passed.");
