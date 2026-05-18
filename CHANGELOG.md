# Changelog

All notable changes to `mcp-pexels` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] — 2026-05-18

### Added

- Initial public release.
- Nine MCP tools covering the full Pexels API v1 surface:
  - **Photos:** `pexels_search_photos`, `pexels_curated_photos`, `pexels_get_photo`.
  - **Videos:** `pexels_search_videos`, `pexels_popular_videos`, `pexels_get_video`.
  - **Collections:** `pexels_featured_collections`, `pexels_my_collections`, `pexels_collection_media`.
- `PexelsClient` HTTP wrapper with injectable `fetch` for tests and automatic rate-limit-header extraction (`_rateLimit` is appended to every tool response).
- Zod-validated input schemas for every tool, converted to JSON Schema for MCP advertisement.
- 42 mocked vitest cases covering URL serialization, error mapping, and validation rejections.
- `bin: mcp-pexels` for one-step `npx -y mcp-pexels` invocation in any MCP client.
- Tag-driven GitHub Actions release workflow that publishes to npm with provenance and creates a GitHub release.
- Per-tool documentation in [`docs/tools/`](./docs/tools/).
- [`smithery.yaml`](./smithery.yaml) for Smithery marketplace auto-listing.
- [`llms.txt`](./llms.txt) for LLM-friendly repo discovery.

[Unreleased]: https://github.com/developer-ishan/mcp-pexels/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/developer-ishan/mcp-pexels/releases/tag/v1.0.0
