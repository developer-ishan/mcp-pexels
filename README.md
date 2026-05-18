# mcp-pexels

[![npm version](https://img.shields.io/npm/v/mcp-pexels.svg)](https://www.npmjs.com/package/mcp-pexels)
[![CI](https://github.com/developer-ishan/mcp-pexels/actions/workflows/ci.yml/badge.svg)](https://github.com/developer-ishan/mcp-pexels/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node ≥20](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)](#requirements)

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the [Pexels API](https://www.pexels.com/api/) — free stock photos, videos, and curated collections — as MCP tools that any compatible AI client (Claude Desktop, Claude Code, Cursor, etc.) can call.

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

## Connect to an MCP client

Once `mcp-pexels` is on npm, the simplest setup is `npx` directly from your MCP client's config — no install step required.

### Claude Desktop / Claude Code / Cursor

```json
{
  "mcpServers": {
    "pexels": {
      "command": "npx",
      "args": ["-y", "mcp-pexels"],
      "env": { "PEXELS_API_KEY": "your_key_here" }
    }
  }
}
```

- **Claude Desktop:** `claude_desktop_config.json` (`~/Library/Application Support/Claude/` on macOS, `%APPDATA%\Claude\` on Windows).
- **Claude Code:** `~/.claude.json` `mcpServers` block, or run `claude mcp add pexels -- npx -y mcp-pexels`.
- **Cursor:** `~/.cursor/mcp.json` (or per-project `.cursor/mcp.json`).

Restart the client and the nine `pexels_*` tools become available.

### Alternative — global install

```bash
npm install -g mcp-pexels
```

Then:

```json
{
  "mcpServers": {
    "pexels": {
      "command": "mcp-pexels",
      "env": { "PEXELS_API_KEY": "your_key_here" }
    }
  }
}
```

### Alternative — run from a source checkout

```bash
git clone https://github.com/developer-ishan/mcp-pexels.git
cd mcp-pexels
npm install
npm run build
```

```json
{
  "mcpServers": {
    "pexels": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pexels/dist/index.js"],
      "env": { "PEXELS_API_KEY": "your_key_here" }
    }
  }
}
```

### Manual smoke test over stdio

```bash
export PEXELS_API_KEY=your_key_here
printf '%s\n%s\n' \
  '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' \
  '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | npx -y mcp-pexels
```

Replace `npx -y mcp-pexels` with `mcp-pexels` (global install) or `node dist/index.js` (source checkout) depending on your setup. You should see the `serverInfo` reply followed by a `tools/list` reply containing all nine tools.

## Development

```bash
npm install
echo "PEXELS_API_KEY=your_key_here" > .env

npm test           # 42 mocked vitest cases, no network
npm run build      # tsc → dist/
npm run dev        # tsx watch
npm run test:watch # vitest in watch mode
npm start          # node --env-file=.env dist/index.js
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

## Releasing

This repo uses a tag-driven release workflow (`.github/workflows/release.yml`):

1. Bump the version: `npm version patch` (or `minor` / `major`) — creates a commit and tag.
2. Push: `git push && git push --tags`.
3. The workflow runs tests, builds, and publishes to npm using the `NPM_TOKEN` repository secret.

## License

[MIT](./LICENSE)
