# Contributing to mcp-pexels

Thanks for considering a contribution. This project is small and the bar is "make it work, keep the test suite green, follow the existing style."

## Reporting bugs

Open a [GitHub issue](https://github.com/developer-ishan/mcp-pexels/issues/new/choose) using the **Bug report** template. Please include:

- The MCP client you are using (Claude Desktop, Cursor, Cline, etc.) and its version.
- Node version (`node --version`).
- Exact tool call inputs that reproduce the issue (redact your API key).
- The error message or unexpected response.

## Requesting features

Open an issue using the **Feature request** template. The Pexels API surface is fully wrapped as of v1.0.0, so most feature requests will either be:

- A new orchestration on top of the existing tools (e.g. higher-level helpers).
- A new transport (HTTP/SSE).
- Quality-of-life improvements to error messages, logging, or output shape.

## Development workflow

```bash
git clone https://github.com/developer-ishan/mcp-pexels.git
cd mcp-pexels
npm install
echo "PEXELS_API_KEY=your_key_here" > .env

npm test           # 42 mocked vitest cases; no network calls
npm run build      # tsc → dist/
npm run dev        # tsx watch (stdio)
```

### Code style

- TypeScript strict mode, ESM, NodeNext module resolution.
- Internal imports use `.js` extensions (NodeNext requirement).
- Match the existing file layout — per-domain modules under `src/tools/` and `src/types/`, shared infrastructure under `src/http/` and `src/types/tool.ts`.
- No new runtime dependencies without strong justification. The current dep list is `@modelcontextprotocol/sdk`, `zod`, `zod-to-json-schema`.
- All HTTP calls go through `PexelsClient.get` so the test seam stays clean.

### Tests

Every new tool or behavior change needs a Vitest case. See `tests/photos.test.ts` for the pattern: construct a `PexelsClient` with a `vi.fn()` `fetchImpl` via `makeMockClient`, exercise the handler, and assert the constructed URL plus the parsed response.

Run the suite with `npm test`. CI runs the same suite on Node 20 and 22 for every push and PR.

### Commits & PRs

- Conventional commit prefixes are encouraged (`feat:`, `fix:`, `docs:`, `chore:`, `ci:`).
- One logical change per PR. Keep diffs small enough that a reviewer can read them in one sitting.
- Update `CHANGELOG.md` under `## [Unreleased]` so the entry is ready when the next release is cut.

## Releases

Maintainers release by:

1. Bumping the version with `npm version patch` / `minor` / `major`.
2. Pushing with `git push --follow-tags`.
3. The release workflow handles `npm publish --provenance` and the GitHub release.

## Used by

If you ship `mcp-pexels` inside a tool, agent template, or product, open a PR adding yourself to this section.

- *(your project here)*
