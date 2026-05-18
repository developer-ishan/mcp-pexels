# Security Policy

## Supported versions

Only the latest published version on npm is supported. Older versions will not receive security fixes — upgrade with `npm update -g mcp-pexels` or by bumping the dependency in your MCP client config.

| Version | Supported |
|---|---|
| 1.x | ✅ |

## Reporting a vulnerability

Please do **not** open a public GitHub issue for security reports.

Instead, report privately through GitHub's [private vulnerability reporting](https://github.com/developer-ishan/mcp-pexels/security/advisories/new). Include:

- A description of the vulnerability and the affected version(s).
- Reproduction steps or a minimal proof of concept.
- Any suggested mitigation or fix.

You will receive an acknowledgement within 7 days. Once a fix is available, a coordinated disclosure timeline will be agreed before public release.

## Scope

This package is a thin wrapper around the [Pexels API](https://www.pexels.com/api/) over stdio. Its trust boundary is:

- **Input:** JSON-RPC messages on stdin from the host MCP client.
- **Output:** HTTPS requests to `api.pexels.com` carrying a user-supplied `PEXELS_API_KEY`.

In-scope reports include things like prototype-pollution in tool inputs, missing input validation that could leak the API key, or supply-chain concerns. Out of scope: vulnerabilities in the Pexels API itself (report directly to Pexels) and vulnerabilities in upstream dependencies (report to the dependency).
