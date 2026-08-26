# mcp-openaq

OpenAQ MCP — global air-quality measurements via the OpenAQ v3 API.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `air_quality_near` | Get the latest air-quality readings (PM2.5, PM10, O3, NO2, SO2, CO, etc.) at the monitoring station NEAREST to a latitude/longitude. PREFER for "air quality near me", "what is the air quality at <coordinates>", "is the air bad in <place> right now". Returns the nearest station with its most recent pollutant values, plus other nearby stations. |
| `find_stations` | Find OpenAQ air-quality monitoring stations by location: a city or place name, coordinates+radius (nearest first), a country (ISO 3166-1 alpha-2 code), or a bounding box. Returns station id, name, country, coordinates, and the pollutants each measures (with sensor ids), plus resolved_place echoing the coordinates a city name resolved to. This is the first step for a historical series: find the station here, then pass its sensor_id to get_measurements. At least one location argument is required — the tool will not return an unfiltered global list. |
| `get_latest` | Get the latest reading for every pollutant at a specific OpenAQ station (by location id from find_stations). Returns each parameter (PM2.5, O3, NO2, etc.) with its value, units, and measurement time. |
| `get_measurements` | Get the most recent time series (hourly or daily aggregates) for a single OpenAQ sensor (sensor id from find_stations), newest first. Use for pollutant trends over time at one station/parameter. Returns the sensor's LAST `limit` readings — note that many OpenAQ sensors are archived and stopped reporting years ago, so "most recent" can legitimately be several years old: always read the returned timestamps rather than assuming the data is current. Use find_stations or get_latest to pick a sensor that is still reporting. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "openaq": {
      "url": "https://gateway.pipeworx.io/openaq/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/openaq/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Openaq data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
