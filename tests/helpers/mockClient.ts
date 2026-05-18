import { vi, type Mock } from "vitest";
import { PexelsClient } from "../../src/http/client.js";

export interface MockResponseSpec {
  status?: number;
  body: unknown;
  headers?: Record<string, string>;
}

export interface MockClientResult {
  client: PexelsClient;
  fetchImpl: Mock;
}

const DEFAULT_RATE_LIMIT_HEADERS: Record<string, string> = {
  "X-Ratelimit-Limit": "20000",
  "X-Ratelimit-Remaining": "19999",
  "X-Ratelimit-Reset": "1700000000",
};

export function makeMockClient(responses: MockResponseSpec[]): MockClientResult {
  const fetchImpl = vi.fn();
  for (const r of responses) {
    const status = r.status ?? 200;
    const headers = {
      "Content-Type": "application/json",
      ...(status >= 200 && status < 300 ? DEFAULT_RATE_LIMIT_HEADERS : {}),
      ...(r.headers ?? {}),
    };
    const body =
      typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? {});
    fetchImpl.mockResolvedValueOnce(new Response(body, { status, headers }));
  }
  const client = new PexelsClient({ apiKey: "test-key", fetchImpl });
  return { client, fetchImpl };
}

export function getCallUrl(fetchImpl: Mock, index = 0): URL {
  const [url] = fetchImpl.mock.calls[index];
  return new URL(typeof url === "string" ? url : url.toString());
}

export function getCallHeaders(
  fetchImpl: Mock,
  index = 0,
): Record<string, string> {
  const [, init] = fetchImpl.mock.calls[index];
  return (init?.headers ?? {}) as Record<string, string>;
}
