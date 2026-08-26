# AFRIRESOLVE MCP

AFRIRESOLVE is a machine-readable African food knowledge service exposed through the Model Context Protocol (MCP).

It converts African food terms, aliases, categories, countries, regions, descriptions, uses, and nutrition information into structured data that AI systems and applications can consume.

## Production Endpoint

https://afriresolve-mcp.afriresolve28.workers.dev/mcp

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

AFRIRESOLVE currently exposes seven MCP tools.

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

