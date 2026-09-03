# AFRIRESOLVE

**African intelligence infrastructure for AI applications, developers, and data products.**

AfriResolve is a machine-readable African knowledge and intelligence service exposed through the **Model Context Protocol (MCP)** and a developer-friendly **REST API**.

It helps AI systems and applications resolve African terms, discover African foods and dishes, and build Africa-focused applications on structured data.

**👉 Get your free API key:** https://afriresolve-mcp.afriresolve28.workers.dev/developers
**📖 GitHub:** https://github.com/AFRIRESOLVE/afriresolve-mcp
**🎯 Free tier:** 100 API credits/month

## 🚀 Production

**MCP endpoint**

https://afriresolve-mcp.afriresolve28.workers.dev/mcp

**Developer portal**

https://afriresolve-mcp.afriresolve28.workers.dev/developers

AfriResolve runs on Cloudflare Workers with Cloudflare D1.

## Current Knowledge Base

The current production knowledge base contains:

- 20 canonical African food records
- 37 aliases
- African food names and local names
- Categories
- Countries
- Geographic regions
- Descriptions
- Common uses
- Selected nutrition information

The knowledge base is intentionally structured so it can expand over time.

## MCP Tools

AfriResolve currently exposes the following MCP tools:

### MCP tool groups

**African terminology**
- `resolve_african_term`

**African foods**
- `search_african_foods`
- `rank_african_foods`
- `list_african_foods`
- `find_foods_by_category`
- `find_foods_by_country`
- `find_foods_by_region`

**African dishes**
- `resolve_african_dish`
- `list_african_dishes`
- `find_dishes_by_country`
- `find_dishes_by_region`
- `find_dishes_by_ingredient`

**Intelligence**
- `get_afriresolve_intelligence`

### 1. resolve_african_term

Resolve an African word or food term.

Example:

```json
{
  "name": "resolve_african_term",
  "arguments": {
    "query": "acha"
  }
}
```

## 🌐 REST API



AfriResolve also provides a developer REST API for applications that prefer standard HTTP requests.



### Base URL



`https://afriresolve-mcp.afriresolve28.workers.dev`



### Available endpoints



- `POST /v1/resolve`

- `POST /v1/search`

- `POST /v1/rank`

- `POST /v1/keys`



### Authentication



Authenticated API requests accept either `x-api-key` or `Authorization: Bearer` authentication.



### Get a free API key



Visit the developer portal:



https://afriresolve-mcp.afriresolve28.workers.dev/developers



Each new account currently receives **100 free credits**.



API keys are displayed once when created. Store your key securely.

### Create a free API key with curl



```bash

curl -X POST \

  https://afriresolve-mcp.afriresolve28.workers.dev/v1/keys \

  -H "content-type: application/json" \

  -d '{"name":"Your Name","email":"you@example.com"}'

```



### Resolve an African term



```bash

curl -X POST \

  https://afriresolve-mcp.afriresolve28.workers.dev/v1/resolve \

  -H "content-type: application/json" \

  -H "x-api-key: YOUR_API_KEY" \

  -d '{"query":"acha"}'

```



Example:



`acha → fonio`



### Search African foods



```bash

curl -X POST \

  https://afriresolve-mcp.afriresolve28.workers.dev/v1/search \

  -H "content-type: application/json" \

  -H "x-api-key: YOUR_API_KEY" \

  -d '{"query":"fonio"}'

```



### Rank African foods



```bash

curl -X POST \

  https://afriresolve-mcp.afriresolve28.workers.dev/v1/rank \

  -H "content-type: application/json" \

  -H "x-api-key: YOUR_API_KEY" \

  -d '{"query":"high fiber African grains"}'

```

## 💳 Pricing

AfriResolve currently offers:

| Plan | Credits | Price |
|---|---:|---:|
| Free | 100/month | $0 |
| Developer | 10,000/month | $29 |
| Pro | 100,000/month | $199 |
| Enterprise | 1,000,000/month | $999 |

For API access and account creation, visit the developer portal.

## 🏗️ Architecture

AfriResolve is designed as a lightweight African intelligence layer for modern applications.

- **Cloudflare Workers** — edge API and MCP runtime
- **Cloudflare D1** — structured African knowledge, customer, usage, and intelligence data
- **MCP** — AI-native tool access
- **REST API** — standard HTTP integration
- **Usage metering** — credit-based API consumption
- **Intelligence layer** — demand and knowledge-gap signals from usage

## ⚡ Quick Start

### REST API

Create a free API key:

```bash
curl -X POST \
  https://afriresolve-mcp.afriresolve28.workers.dev/v1/keys \
  -H "content-type: application/json" \
  -d '{"name":"Your Name","email":"you@example.com"}'
```

Use the returned key to make authenticated requests:

```bash
curl -X POST \
  https://afriresolve-mcp.afriresolve28.workers.dev/v1/resolve \
  -H "content-type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"query":"acha"}'
```

### MCP

Connect an MCP-compatible application to:

`https://afriresolve-mcp.afriresolve28.workers.dev/mcp`

The MCP interface provides access to African terminology, food, dish, and intelligence tools.

## 🧪 Development

```bash
git clone https://github.com/AFRIRESOLVE/afriresolve-mcp.git
cd afriresolve-mcp
npm install
npm test
```
