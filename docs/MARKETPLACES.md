# Marketplace submission cheatsheet

A one-stop guide for getting `mcp-pexels` listed across the major MCP discovery surfaces. Most listings are free and human-reviewed within a few days.

## One-line description (use everywhere)

> Pexels MCP server — search and fetch free stock photos, videos, and curated collections from Pexels inside Claude, Cursor, Cline, and other MCP clients.

## Keywords

`mcp` `model-context-protocol` `pexels` `photos` `videos` `stock-photos` `stock-videos` `claude` `cursor` `cline` `anthropic` `ai-tools` `typescript`

## Drop-in config (paste into any submission form that asks)

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

---

## 1. Anthropic's official directory — `modelcontextprotocol/servers`

**Where:** <https://github.com/modelcontextprotocol/servers>

**How:** Open a PR adding `mcp-pexels` to the `README.md` "Community Servers" section, alphabetical order.

**Suggested entry:**

```markdown
- **[Pexels](https://github.com/developer-ishan/mcp-pexels)** - Search and fetch free stock photos, videos, and curated collections from the [Pexels API](https://www.pexels.com/api/).
```

## 2. Smithery — `smithery.ai`

**Where:** <https://smithery.ai/new>

**How:** For local stdio servers like this one, Smithery distributes a pre-built **MCPB bundle** that clients download and run locally. Two options:

**Option A — submit via web (easiest):**

1. Build the bundle locally: `npm run pack:mcpb` (produces `mcp-pexels.mcpb`).
2. Go to <https://smithery.ai/new> and select the "Local (MCPB Bundle)" tab.
3. Upload the `.mcpb` file. Smithery validates the manifest and lists the server.

**Option B — Smithery CLI:**

```bash
npm install -g @smithery/cli
smithery mcp publish ./mcp-pexels.mcpb -n developer-ishan/mcp-pexels
```

The legacy [`smithery.yaml`](../smithery.yaml) `commandFunction` block is kept as a fallback for older Smithery flows, but MCPB is the modern path.

## 3. mcp.so

**Where:** <https://mcp.so/submit>

**How:** Fill out the form with:

- **Name:** `mcp-pexels`
- **GitHub:** `https://github.com/developer-ishan/mcp-pexels`
- **npm:** `https://www.npmjs.com/package/mcp-pexels`
- **Description:** *(use the one-liner above)*
- **Category:** Media / Content
- **Install command:** `npx -y mcp-pexels`

## 4. awesome-mcp-servers (punkpeye)

**Where:** <https://github.com/punkpeye/awesome-mcp-servers>

**How:** PR adding to the appropriate category (likely "Search & Data Extraction" or "Multimedia").

**Suggested entry:**

```markdown
- [developer-ishan/mcp-pexels](https://github.com/developer-ishan/mcp-pexels) - Pexels API (photos, videos, collections) wrapped as nine MCP tools. Published to npm; works via `npx -y mcp-pexels`.
```

## 5. Glama AI directory

**Where:** <https://glama.ai/mcp/servers>

**How:** Glama auto-indexes published npm packages with the `mcp` keyword and a working `bin` — no submission required. Should appear within ~24h of publish.

## 6. PulseMCP

**Where:** <https://www.pulsemcp.com/submit>

**How:** Form-based submission. Use the description and config above.

## 7. Cline MCP marketplace

**Where:** <https://github.com/cline/mcp-marketplace>

**How:** PR adding an entry under `servers/`. See repo README for the exact schema.

## 8. VS Code MCP marketplace (preview)

**Where:** Marketplace page emerging. Easiest path is currently listing in the Cline marketplace (above) since the VS Code experience surfaces those.

---

## After-publish hygiene

- ✅ Repo description set
- ✅ Repo topics set (`mcp`, `model-context-protocol`, `pexels`, `claude`, `ai`, `typescript`, `stock-photos`, `cursor`, `anthropic`)
- ✅ Repo homepage points at the npm page
- ✅ `smithery.yaml` at repo root
- ✅ `llms.txt` at repo root
- ✅ `LICENSE` at repo root (MIT)
- ✅ `CHANGELOG.md` documents v1.0.0
- ✅ npm package published with provenance
- ⬜ **Social preview image** — upload a 1280×640 PNG via GitHub → repo Settings → General → Social preview. Without this, GitHub auto-generates a plain preview; with one, Twitter / LinkedIn / Bluesky shares look much better.
- ⬜ Star + tweet from your own account once initial listings land — small but real signal.
