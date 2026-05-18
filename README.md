# pexels-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the [Pexels API](https://www.pexels.com/api/) — free stock photos, videos, and curated collections — as MCP tools that any compatible client (Claude Desktop, Claude Code, Cursor, etc.) can call.

> Photos & videos provided by [Pexels](https://www.pexels.com).

## Capabilities

Nine tools across three domains:

| Domain | Tool | What it does |
|---|---|---|
| Photos | `pexels_search_photos` | Search photos by query with orientation / size / color / locale filters. |
| Photos | `pexels_curated_photos` | Fetch the Pexels team's real-time curated photo feed. |
| Photos | `pexels_get_photo` | Retrieve a single photo by its numeric id. |
| Videos | `pexels_search_videos` | Search videos by query with orientation / size / locale filters. |
| Videos | `pexels_popular_videos` | Fetch popular videos with optional width / height / duration constraints. |
| Videos | `pexels_get_video` | Retrieve a single video by its numeric id. |
| Collections | `pexels_featured_collections` | List Pexels featured collections. |
| Collections | `pexels_my_collections` | List the authenticated user's own collections. |
| Collections | `pexels_collection_media` | Retrieve the photos and videos inside a specific collection. |

Every tool response includes a `_rateLimit` field with `limit`, `remaining`, and `reset` (UNIX timestamp) so clients can manage their monthly quota.

See [`docs/tools/`](docs/tools/) for per-tool parameter tables and example payloads.

## Requirements

- Node.js **≥ 20** (uses native `fetch` and `--env-file`)
- A free Pexels API key — [request one here](https://www.pexels.com/api/)

## Quickstart

```bash
# Install
npm install

# Add your API key
echo "PEXELS_API_KEY=your_key_here" > .env

# Run the test suite (mocked, no network calls)
npm test

# Build to dist/
npm run build

# Run the server (stdio transport)
npm start
```

## Connect to an MCP client

The server is packaged as an executable npm `bin`, so any MCP-aware AI client can launch it. Pick whichever integration path fits your environment.

### Option A — installed binary (recommended)

Build a tarball and install it globally (no npm publish needed):

```bash
npm install      # one time
npm run build    # produces dist/index.js
npm pack         # produces pexels-mcp-1.0.0.tgz

npm install -g ./pexels-mcp-1.0.0.tgz
which pexels-mcp # confirm it is on PATH
```

Then point your MCP client at the binary and pass the API key via `env`:

```json
{
  "mcpServers": {
    "pexels": {
      "command": "pexels-mcp",
      "env": { "PEXELS_API_KEY": "your_key_here" }
    }
  }
}
```

This config works as-is in **Claude Desktop** (`claude_desktop_config.json`), **Claude Code** (`~/.claude.json` `mcpServers` block), **Cursor**, and any other MCP client that follows the standard config shape.

### Option B — `npx` from a local tarball

If you do not want a global install:

```json
{
  "mcpServers": {
    "pexels": {
      "command": "npx",
      "args": ["-y", "/absolute/path/to/pexels-mcp-1.0.0.tgz"],
      "env": { "PEXELS_API_KEY": "your_key_here" }
    }
  }
}
```

### Option C — run from the source checkout

For development, point at the built file directly:

```json
{
  "mcpServers": {
    "pexels": {
      "command": "node",
      "args": ["/absolute/path/to/pexels-mcp/dist/index.js"],
      "env": { "PEXELS_API_KEY": "your_key_here" }
    }
  }
}
```

After updating the config, restart the client and the nine `pexels_*` tools become available.

### Manual smoke test over stdio

```bash
export PEXELS_API_KEY=your_key_here
printf '%s\n%s\n' \
  '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' \
  '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | pexels-mcp
```

You should see the `serverInfo` reply followed by a `tools/list` reply containing all nine tools.

Use `node dist/index.js` instead of `pexels-mcp` if you have not installed the binary globally.

## Development

```bash
npm run dev        # tsx watch (requires PEXELS_API_KEY in your env)
npm run test:watch # vitest in watch mode
npm run build      # tsc → dist/
```

### Project layout

```
src/
├── index.ts                  # MCP server entrypoint (stdio)
├── http/
│   ├── client.ts             # PexelsClient (injectable fetch for tests)
│   └── types.ts              # PexelsApiError, RateLimit, PexelsResponse
├── tools/
│   ├── index.ts              # composes the three domain factories
│   ├── photos.ts             # 3 photo tools
│   ├── videos.ts             # 3 video tools
│   └── collections.ts        # 3 collection tools
└── types/
    ├── tool.ts               # defineTool helper + ToolDefinition
    ├── photos.ts             # Photo, PhotosSearchResponse, …
    ├── videos.ts             # Video, VideosSearchResponse, …
    └── collections.ts        # Collection, CollectionMediaResponse, …

tests/
├── helpers/mockClient.ts     # makeMockClient() — fake fetch via vitest mocks
├── photos.test.ts            # 17 cases
├── videos.test.ts            # 13 cases
└── collections.test.ts       # 12 cases
```

### Testing approach

Tests construct a `PexelsClient` with a `vi.fn()` `fetchImpl` returned by `makeMockClient(responses)`. No real HTTP is performed. Each tool is exercised for:

1. **Happy path** — URL serialization and `Authorization` header.
2. **Error mapping** — non-2xx → `PexelsApiError` with `status` and `body`.
3. **Zod validation** — required params, enum membership, integer bounds.

## Rate limits

The default Pexels free tier is **200 requests/hour** and **20 000 requests/month**. Every successful response from this server includes a `_rateLimit` object so consuming agents can self-throttle.

## Attribution

When you use Pexels content, please follow the [Pexels API guidelines](https://www.pexels.com/api/documentation/#guidelines):

- Show a prominent link to Pexels — e.g. *"Photos provided by Pexels"*.
- Credit photographers/videographers when possible — e.g. *"Photo by John Doe on Pexels"*.

## License

ISC
