import { PAYMENT_MARKETS } from "../payments/markets.js";

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
<title>AfriResolve — African Intelligence for AI Agents</title>
<meta name="description" content="Machine-readable African intelligence for AI agents, developers and data products through MCP, REST and x402 payments.">
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

<span class="badge">AFRIRESOLVE AI INTELLIGENCE INFRASTRUCTURE</span>

<h1>African intelligence infrastructure for AI agents.</h1>

<p>AfriResolve gives AI agents machine-readable access to African food terminology,
names, aliases and related knowledge through REST, MCP and x402-enabled access.</p>
<p><strong>Resolve African terms. Discover foods. Rank knowledge. Pay per agent call with x402.</strong></p>

<h2>Connect your AI agent</h2>

<div class="card" style="margin-top:24px">
<h2>Start with a free API key</h2>
<p>Get 100 free credits and connect your application or AI agent immediately.</p>

<form onsubmit="createApiKey(event)" style="display:grid;gap:12px;max-width:520px">
<input id="signupName" type="text" placeholder="Your name or company" required
style="padding:12px;border:1px solid #ccc;border-radius:8px">

<input id="signupEmail" type="email" placeholder="Email address" required
style="padding:12px;border:1px solid #ccc;border-radius:8px">

<button type="submit" style="padding:12px;border:0;border-radius:8px;cursor:pointer">
Create Free API Key
</button>
</form>

<div id="signupResult" style="margin-top:16px"></div>
</div>

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
async function createApiKey(event) {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const result = document.getElementById("signupResult");

  result.textContent = "Creating your API key...";

  try {
    const response = await fetch("/v1/keys", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ name, email })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      result.textContent = data.error || "Unable to create API key.";
      return;
    }

    result.innerHTML =
      "<strong>API key created successfully.</strong><br>" +
      "<small>Save this key now. It will not be shown again.</small>" +
      "<pre id='createdApiKey' style='white-space:pre-wrap;word-break:break-all'>" +
      data.api_key +
      "</pre>" +
      "<button type='button' onclick='copyCreatedApiKey()' style='padding:10px 14px;border:0;border-radius:8px;cursor:pointer'>" +
      "Copy API Key" +
      "</button>";

    document.getElementById("apiKey").value = data.api_key;
  } catch (error) {
    result.textContent = "Network error. Please try again.";
  }
}

async function copyCreatedApiKey() {
  const key = document.getElementById("createdApiKey")?.textContent?.trim();
  if (!key) return;

  try {
    await navigator.clipboard.writeText(key);
    const buttons = document.querySelectorAll("button");
    const button = [...buttons].find((item) => item.textContent === "Copy API Key");
    if (button) {
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = "Copy API Key";
      }, 2000);
    }
  } catch {
    alert("Copy failed. Please copy the API key manually.");
  }
}

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
<div class="card">
  <label for="marketSelector"><strong>Pricing for your market</strong></label>
  <select id="marketSelector"
    style="width:100%;box-sizing:border-box;padding:12px;margin-top:8px;border:1px solid #ccc;border-radius:8px">
    <option value="NG">🇳🇬 Nigeria — NGN</option>
    <option value="KE">🇰🇪 Kenya — KES</option>
    <option value="ZA">🇿🇦 South Africa — ZAR</option>
    <option value="EG">🇪🇬 Egypt — EGP</option>
    <option value="INTL">🌎 International — USD</option>
  </select>
  <p id="pricingMarketLabel" style="margin-bottom:0"></p>
</div>

<div id="pricingCards"></div>

<script>
const AFRIRESOLVE_PRICING = ${JSON.stringify(PAYMENT_MARKETS)};
const PRICING_PLANS = [
  ["developer", "Developer", "10,000"],
  ["pro", "Pro", "100,000"],
  ["enterprise", "Enterprise", "1,000,000"]
];

async function startCheckout(plan) {
  const apiKey = document.getElementById("apiKey").value.trim();

  if (!apiKey) {
    alert("Please create or enter your AfriResolve API key first.");
    document.getElementById("apiKey").focus();
    return;
  }

  try {
    const response = await fetch("/pay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({ plan })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || data.error || "Unable to start payment."
      );
    }

    if (!data.authorization_url) {
      throw new Error("Paystack checkout URL was not returned.");
    }

    window.location.href = data.authorization_url;
  } catch (error) {
    alert(error.message || "Unable to start payment.");
  }
}

function renderPricing(marketCode) {
  const market =
    AFRIRESOLVE_PRICING[marketCode] || AFRIRESOLVE_PRICING.INTL;

  document.getElementById("pricingMarketLabel").textContent =
    "Prices shown in " + market.currency + " for " + market.name + ".";

  document.getElementById("pricingCards").innerHTML =
    '<div class="card"><strong>Free</strong><p>100 credits/month · ' +
    market.symbol + '0</p></div>' +
    PRICING_PLANS.map(function(plan) {
      const amount = market.prices[plan[0]].toLocaleString();
      return '<div class="card"><strong>' + plan[1] +
        '</strong><p>' + plan[2] + ' credits/month · ' +
        market.symbol + amount + '</p>' +
          '<button type="button" data-plan="' + plan[0] + '" ' +
        'style="margin-top:8px;padding:10px 16px;border:0;border-radius:8px;cursor:pointer">' +
        'Buy ' + plan[1] + '</button></div>';
    }).join("");

      document.querySelectorAll("#pricingCards button[data-plan]").forEach(function(button) {
        button.addEventListener("click", function() {
          startCheckout(button.dataset.plan);
        });
      });
}

function detectMarket() {
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  if (timezone === "Africa/Lagos") return "NG";
  if (timezone === "Africa/Nairobi") return "KE";
  if (timezone === "Africa/Johannesburg") return "ZA";
  if (timezone === "Africa/Cairo") return "EG";

  return "INTL";
}

const marketSelector =
  document.getElementById("marketSelector");

const detectedMarket = detectMarket();

marketSelector.value = detectedMarket;
renderPricing(detectedMarket);

marketSelector.addEventListener("change", function() {
  renderPricing(this.value);
});
</script>

<h2>Endpoints</h2>

<ul>
<li><code>POST /v1/keys</code> — create a developer account</li>
<li><code>POST /v1/resolve</code> — resolve African food terminology</li>
<li><code>POST /v1/search</code> — search African food knowledge</li>
<li><code>POST /v1/rank</code> — ranked food search</li>
</ul>

<h2>Connect AI agents via MCP</h2>

<p>Connect compatible AI agents directly to AfriResolve through MCP for African terminology, food discovery, search and ranking.</p>

<p><strong>Production MCP endpoint:</strong></p>
<p><strong>x402:</strong> AI agents can pay for eligible MCP tool calls programmatically, without a traditional subscription checkout.</p>
<p>Use x402 when your agent should discover, authorize and pay for eligible tool calls on demand.</p>
<pre><code>https://afriresolve-mcp.afriresolve28.workers.dev/mcp</code></pre>

<p>Give your AI agent a reliable African intelligence layer via MCP, REST, or x402.</p>
<p><strong>Capabilities:</strong> resolve terms · search foods · rank results · discover African dishes · access intelligence.</p>

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
