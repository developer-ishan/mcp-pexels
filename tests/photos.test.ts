import { describe, it, expect } from "vitest";
import { photoTools } from "../src/tools/photos.js";
import {
  makeMockClient,
  getCallUrl,
  getCallHeaders,
} from "./helpers/mockClient.js";

function makePhoto(id = 1) {
  return {
    id,
    width: 1000,
    height: 800,
    url: `https://www.pexels.com/photo/${id}/`,
    photographer: "X",
    photographer_url: "https://www.pexels.com/@x",
    photographer_id: 1,
    avg_color: "#abcdef",
    src: {
      original: "https://images.pexels.com/photos/1/o.jpg",
      large2x: "https://images.pexels.com/photos/1/l2x.jpg",
      large: "https://images.pexels.com/photos/1/l.jpg",
      medium: "https://images.pexels.com/photos/1/m.jpg",
      small: "https://images.pexels.com/photos/1/s.jpg",
      portrait: "https://images.pexels.com/photos/1/p.jpg",
      landscape: "https://images.pexels.com/photos/1/ls.jpg",
      tiny: "https://images.pexels.com/photos/1/t.jpg",
    },
    liked: false,
    alt: "alt text",
  };
}

const SEARCH_BODY = {
  page: 1,
  per_page: 15,
  total_results: 100,
  photos: [makePhoto(1)],
  next_page: "https://api.pexels.com/v1/search?page=2",
};

const CURATED_BODY = {
  page: 1,
  per_page: 15,
  total_results: 100,
  photos: [makePhoto(2)],
  next_page: "https://api.pexels.com/v1/curated?page=2",
};

const SINGLE_PHOTO_BODY = makePhoto(2014422);

const EXPECTED_RATE_LIMIT = {
  limit: 20000,
  remaining: 19999,
  reset: 1700000000,
};

describe("pexels_search_photos", () => {
  it("constructs the correct URL with just a query and returns body + _rateLimit", async () => {
    const { client, fetchImpl } = makeMockClient([{ body: SEARCH_BODY }]);
    const [searchTool] = photoTools(client);

    const result = (await searchTool.handler({ query: "nature" })) as Record<
      string,
      unknown
    >;

    const url = getCallUrl(fetchImpl);
    expect(url.origin + url.pathname).toBe("https://api.pexels.com/v1/search");
    expect(url.searchParams.get("query")).toBe("nature");
    // No optional params should leak through
    expect(url.searchParams.get("orientation")).toBeNull();
    expect(url.searchParams.get("per_page")).toBeNull();

    const headers = getCallHeaders(fetchImpl);
    expect(headers.Authorization).toBe("test-key");

    expect(result.page).toBe(1);
    expect(result.total_results).toBe(100);
    expect(Array.isArray(result.photos)).toBe(true);
    expect(result._rateLimit).toEqual(EXPECTED_RATE_LIMIT);
  });

  it("serializes optional params into the URL", async () => {
    const { client, fetchImpl } = makeMockClient([{ body: SEARCH_BODY }]);
    const [searchTool] = photoTools(client);

    await searchTool.handler({
      query: "tigers",
      orientation: "landscape",
      size: "medium",
      color: "red",
      locale: "en-US",
      page: 2,
      per_page: 5,
    });

    const url = getCallUrl(fetchImpl);
    expect(url.searchParams.get("query")).toBe("tigers");
    expect(url.searchParams.get("orientation")).toBe("landscape");
    expect(url.searchParams.get("size")).toBe("medium");
    expect(url.searchParams.get("color")).toBe("red");
    expect(url.searchParams.get("locale")).toBe("en-US");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("per_page")).toBe("5");
  });

  it("accepts hex color codes", async () => {
    const { client, fetchImpl } = makeMockClient([{ body: SEARCH_BODY }]);
    const [searchTool] = photoTools(client);

    await searchTool.handler({ query: "sky", color: "#ffffff" });

    const url = getCallUrl(fetchImpl);
    expect(url.searchParams.get("color")).toBe("#ffffff");
  });

  it("maps 404 errors to a PexelsApiError", async () => {
    const { client } = makeMockClient([
      { status: 404, body: { error: "Not Found" } },
    ]);
    const [searchTool] = photoTools(client);

    await expect(searchTool.handler({ query: "nope" })).rejects.toMatchObject({
      name: "PexelsApiError",
      status: 404,
    });
  });

  it("rejects missing required query via Zod", () => {
    const { client } = makeMockClient([]);
    const [searchTool] = photoTools(client);
    const parsed = searchTool.inputSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("rejects per_page out of range via Zod", () => {
    const { client } = makeMockClient([]);
    const [searchTool] = photoTools(client);
    const parsed = searchTool.inputSchema.safeParse({
      query: "a",
      per_page: 200,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid orientation via Zod", () => {
    const { client } = makeMockClient([]);
    const [searchTool] = photoTools(client);
    const parsed = searchTool.inputSchema.safeParse({
      query: "a",
      orientation: "diagonal",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("pexels_curated_photos", () => {
  it("hits /v1/curated with optional params and returns body + _rateLimit", async () => {
    const { client, fetchImpl } = makeMockClient([{ body: CURATED_BODY }]);
    const [, curatedTool] = photoTools(client);

    const result = (await curatedTool.handler({
      page: 3,
      per_page: 20,
    })) as Record<string, unknown>;

    const url = getCallUrl(fetchImpl);
    expect(url.origin + url.pathname).toBe("https://api.pexels.com/v1/curated");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.get("per_page")).toBe("20");

    const headers = getCallHeaders(fetchImpl);
    expect(headers.Authorization).toBe("test-key");

    expect(result.photos).toBeDefined();
    expect(result._rateLimit).toEqual(EXPECTED_RATE_LIMIT);
  });

  it("works with no params at all", async () => {
    const { client, fetchImpl } = makeMockClient([{ body: CURATED_BODY }]);
    const [, curatedTool] = photoTools(client);

    await curatedTool.handler({});

    const url = getCallUrl(fetchImpl);
    expect(url.searchParams.get("page")).toBeNull();
    expect(url.searchParams.get("per_page")).toBeNull();
  });

  it("maps 500 errors to a PexelsApiError", async () => {
    const { client } = makeMockClient([
      { status: 500, body: { error: "Server Error" } },
    ]);
    const [, curatedTool] = photoTools(client);

    await expect(curatedTool.handler({})).rejects.toMatchObject({
      name: "PexelsApiError",
      status: 500,
    });
  });

  it("rejects per_page > 80 via Zod", () => {
    const { client } = makeMockClient([]);
    const [, curatedTool] = photoTools(client);
    const parsed = curatedTool.inputSchema.safeParse({ per_page: 81 });
    expect(parsed.success).toBe(false);
  });
});

describe("pexels_get_photo", () => {
  it("interpolates the photo id into the path and returns body + _rateLimit", async () => {
    const { client, fetchImpl } = makeMockClient([{ body: SINGLE_PHOTO_BODY }]);
    const [, , getTool] = photoTools(client);

    const result = (await getTool.handler({ id: 2014422 })) as Record<
      string,
      unknown
    >;

    const url = getCallUrl(fetchImpl);
    expect(url.origin + url.pathname).toBe(
      "https://api.pexels.com/v1/photos/2014422",
    );
    // No query string expected for this endpoint.
    expect(url.search).toBe("");

    const headers = getCallHeaders(fetchImpl);
    expect(headers.Authorization).toBe("test-key");

    expect(result.id).toBe(2014422);
    expect(result._rateLimit).toEqual(EXPECTED_RATE_LIMIT);
  });

  it("maps 404 errors to a PexelsApiError", async () => {
    const { client } = makeMockClient([
      { status: 404, body: { error: "Not Found" } },
    ]);
    const [, , getTool] = photoTools(client);

    await expect(getTool.handler({ id: 9999999 })).rejects.toMatchObject({
      name: "PexelsApiError",
      status: 404,
    });
  });

  it("rejects missing id via Zod", () => {
    const { client } = makeMockClient([]);
    const [, , getTool] = photoTools(client);
    const parsed = getTool.inputSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("rejects non-integer id via Zod", () => {
    const { client } = makeMockClient([]);
    const [, , getTool] = photoTools(client);
    const parsed = getTool.inputSchema.safeParse({ id: 1.5 });
    expect(parsed.success).toBe(false);
  });

  it("rejects id < 1 via Zod", () => {
    const { client } = makeMockClient([]);
    const [, , getTool] = photoTools(client);
    const parsed = getTool.inputSchema.safeParse({ id: 0 });
    expect(parsed.success).toBe(false);
  });
});

describe("photoTools factory", () => {
  it("returns the three tools in the documented order", () => {
    const { client } = makeMockClient([]);
    const tools = photoTools(client);
    expect(tools.map((t) => t.name)).toEqual([
      "pexels_search_photos",
      "pexels_curated_photos",
      "pexels_get_photo",
    ]);
  });
});
