export function handleDeveloperPage(request) {
  const url = new URL(request.url);

  if (url.pathname !== "/developers") return null;

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AfriResolve Developer API</title>
<meta name="description" content="Africa-focused food, terminology and cultural intelligence API.">
<style>
body{font-family:system-ui,sans-serif;max-width:900px;margin:auto;padding:32px;line-height:1.6;color:#17202a}
h1{font-size:42px;line-height:1.1}
h2{margin-top:36px}
.card{border:1px solid #ddd;border-radius:12px;padding:20px;margin:16px 0}
code,pre{background:#f4f4f4;border-radius:8px}
code{padding:2px 5px}
pre{padding:16px;overflow:auto}
.badge{display:inline-block;padding:5px 10px;border-radius:20px;background:#eee}
a{color:#075985}
</style>
</head>
<body>

<span class="badge">AFRIRESOLVE DEVELOPER API</span>

<h1>Africa intelligence for developers.</h1>

<p>AfriResolve helps applications understand African food terminology,
names, aliases and related knowledge through a simple API and MCP tools.</p>

<h2>Get started</h2>

<p>Create a free developer API key:</p>

<pre><code>POST /v1/keys

Content-Type: application/json

{
  "name": "Your Name",
  "email": "you@example.com"
}</code></pre>

<p>The response contains your API key. Store it securely because it is
shown only once.</p>

<h2>Authentication</h2>

<pre><code>x-api-key: afr_YOUR_API_KEY</code></pre>

<p>or:</p>

<pre><code>Authorization: Bearer afr_YOUR_API_KEY</code></pre>

<h2>Try the API</h2>

<div class="card">
<label for="apiKey"><strong>API key</strong></label>
<br>
<input id="apiKey" type="password" placeholder="afr_YOUR_API_KEY"
style="width:100%;box-sizing:border-box;padding:10px;margin:8px 0 14px">

<label for="term"><strong>African food term</strong></label>
<br>
<input id="term" value="acha"
style="width:100%;box-sizing:border-box;padding:10px;margin:8px 0 14px">

<button onclick="resolveTerm()"
style="padding:10px 18px;border:0;border-radius:8px;cursor:pointer">
Resolve term
</button>

<pre id="result" style="margin-top:16px">Enter your API key and click Resolve term.</pre>
</div>

<script>
async function resolveTerm() {
  const apiKey = document.getElementById("apiKey").value.trim();
  const query = document.getElementById("term").value.trim();
  const result = document.getElementById("result");

  if (!apiKey || !query) {
    result.textContent = "API key and term are required.";
    return;
  }

  result.textContent = "Loading...";

  try {
    const response = await fetch("/v1/resolve", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    result.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    result.textContent = JSON.stringify({
      success: false,
      error: "request_failed"
    }, null, 2);
  }
}
</script>

<h2>Resolve African food terms</h2>

<pre><code>POST /v1/resolve

{
  "query": "acha"
}</code></pre>

<p>Example: <strong>acha → Fonio</strong>.</p>

<h2>Search</h2>

<pre><code>POST /v1/search

{
  "query": "grain"
}</code></pre>

<h2>Rank results</h2>

<pre><code>POST /v1/rank

{
  "query": "nigeria grain"
}</code></pre>

<h2>Pricing</h2>

<div class="card"><strong>Free</strong><p>100 credits/month · $0</p></div>
<div class="card"><strong>Developer</strong><p>10,000 credits/month · $29</p></div>
<div class="card"><strong>Pro</strong><p>100,000 credits/month · $199</p></div>
<div class="card"><strong>Enterprise</strong><p>1,000,000 credits/month · $999</p></div>

<h2>Endpoints</h2>

<ul>
<li><code>POST /v1/keys</code> — create a developer account</li>
<li><code>POST /v1/resolve</code> — resolve African food terminology</li>
<li><code>POST /v1/search</code> — search African food knowledge</li>
<li><code>POST /v1/rank</code> — ranked food search</li>
</ul>

<h2>MCP</h2>

<p>AfriResolve is also available through its production MCP endpoint.</p>

<pre><code>https://afriresolve-mcp.afriresolve28.workers.dev/mcp</code></pre>

<p>Built for developers, AI agents, researchers and applications that need
structured African knowledge.</p>

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
}
