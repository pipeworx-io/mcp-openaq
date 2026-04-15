# mcp-openaq

OpenAQ MCP — wraps OpenAQ v2 API (free, no auth required)

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "openaq": {
      "url": "https://gateway.pipeworx.io/openaq/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use openaq
```

## License

MIT
