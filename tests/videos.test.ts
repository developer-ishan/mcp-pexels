import { describe, expect, it } from "vitest";
import { videoTools } from "../src/tools/videos.js";
import { PexelsApiError } from "../src/http/types.js";
import {
  getCallHeaders,
  getCallUrl,
  makeMockClient,
} from "./helpers/mockClient.js";

const sampleVideo = {
  id: 1,
  width: 1920,
  height: 1080,
  url: "https://www.pexels.com/video/1/",
  image: "https://images.pexels.com/videos/1/free-video-1.jpg",
  duration: 22,
  user: { id: 1, name: "X", url: "https://www.pexels.com/@x" },
  video_files: [
    {
      id: 1,
      quality: "hd",
      file_type: "video/mp4",
      width: 1920,
      height: 1080,
      fps: 30,
      link: "https://player.vimeo.com/external/1.mp4",
    },
  ],
  video_pictures: [
    {
      id: 1,
      picture: "https://static-videos.pexels.com/videos/1/pictures/preview-0.jpg",
      nr: 0,
    },
  ],
};

const sampleSearchBody = {
  page: 1,
  per_page: 15,
  total_results: 100,
  url: "https://www.pexels.com/videos/",
  videos: [sampleVideo],
};

function getToolByName(client: ReturnType<typeof makeMockClient>["client"], name: string) {
  const tool = videoTools(client).find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool;
}

describe("videoTools factory", () => {
  it("returns the 3 tools in the documented order", () => {
    const { client } = makeMockClient([]);
    const tools = videoTools(client);
    expect(tools.map((t) => t.name)).toEqual([
      "pexels_search_videos",
      "pexels_popular_videos",
      "pexels_get_video",
    ]);
  });
});

describe("pexels_search_videos", () => {
  it("hits /v1/videos/search with all query params and Authorization header", async () => {
    const { client, fetchImpl } = makeMockClient([{ body: sampleSearchBody }]);
    const tool = getToolByName(client, "pexels_search_videos");
    const result = (await tool.handler({
      query: "nature",
      orientation: "landscape",
      size: "medium",
      locale: "en-US",
      page: 2,
      per_page: 10,
    })) as Record<string, unknown>;

    const url = getCallUrl(fetchImpl);
    expect(url.pathname).toBe("/v1/videos/search");
    expect(url.searchParams.get("query")).toBe("nature");
    expect(url.searchParams.get("orientation")).toBe("landscape");
    expect(url.searchParams.get("size")).toBe("medium");
    expect(url.searchParams.get("locale")).toBe("en-US");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("per_page")).toBe("10");

    const headers = getCallHeaders(fetchImpl);
    expect(headers.Authorization).toBe("test-key");

    expect(result.videos).toEqual(sampleSearchBody.videos);
    expect(result.total_results).toBe(100);
    expect(result._rateLimit).toMatchObject({
      limit: 20000,
      remaining: 19999,
      reset: 1700000000,
    });
  });

  it("omits undefined optional params from the URL", async () => {
    const { client, fetchImpl } = makeMockClient([{ body: sampleSearchBody }]);
    const tool = getToolByName(client, "pexels_search_videos");
    await tool.handler({ query: "ocean" });

    const url = getCallUrl(fetchImpl);
    expect(url.pathname).toBe("/v1/videos/search");
    expect(url.searchParams.get("query")).toBe("ocean");
    expect(url.searchParams.has("orientation")).toBe(false);
    expect(url.searchParams.has("size")).toBe(false);
    expect(url.searchParams.has("locale")).toBe(false);
    expect(url.searchParams.has("page")).toBe(false);
    expect(url.searchParams.has("per_page")).toBe(false);
  });

  it("maps a 404 response to a PexelsApiError", async () => {
    const { client } = makeMockClient([
      { status: 404, body: { error: "Not Found" } },
    ]);
    const tool = getToolByName(client, "pexels_search_videos");
    let captured: unknown;
    try {
      await tool.handler({ query: "missing" });
    } catch (err) {
      captured = err;
    }
    expect(captured).toBeInstanceOf(PexelsApiError);
    expect((captured as PexelsApiError).status).toBe(404);
  });

  it("rejects missing query via inputSchema.safeParse", () => {
    const { client } = makeMockClient([]);
    const tool = getToolByName(client, "pexels_search_videos");
    const result = tool.inputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects per_page above 80 via inputSchema.safeParse", () => {
    const { client } = makeMockClient([]);
    const tool = getToolByName(client, "pexels_search_videos");
    const result = tool.inputSchema.safeParse({ query: "x", per_page: 200 });
    expect(result.success).toBe(false);
  });
});

describe("pexels_popular_videos", () => {
  it("passes min_width, max_duration, and per_page into query string", async () => {
    const { client, fetchImpl } = makeMockClient([{ body: sampleSearchBody }]);
    const tool = getToolByName(client, "pexels_popular_videos");
    const result = (await tool.handler({
      min_width: 1920,
      max_duration: 30,
      per_page: 5,
    })) as Record<string, unknown>;

    const url = getCallUrl(fetchImpl);
    expect(url.pathname).toBe("/v1/videos/popular");
    expect(url.searchParams.get("min_width")).toBe("1920");
    expect(url.searchParams.get("max_duration")).toBe("30");
    expect(url.searchParams.get("per_page")).toBe("5");
    expect(url.searchParams.has("min_height")).toBe(false);
    expect(url.searchParams.has("min_duration")).toBe(false);

    const headers = getCallHeaders(fetchImpl);
    expect(headers.Authorization).toBe("test-key");

    expect(result.videos).toEqual(sampleSearchBody.videos);
    expect(result._rateLimit).toBeDefined();
  });

  it("maps a 500 response to a PexelsApiError", async () => {
    const { client } = makeMockClient([
      { status: 500, body: { error: "boom" } },
    ]);
    const tool = getToolByName(client, "pexels_popular_videos");
    await expect(tool.handler({})).rejects.toBeInstanceOf(PexelsApiError);
  });

  it("rejects min_width less than 1 via inputSchema.safeParse", () => {
    const { client } = makeMockClient([]);
    const tool = getToolByName(client, "pexels_popular_videos");
    const result = tool.inputSchema.safeParse({ min_width: 0 });
    expect(result.success).toBe(false);
  });
});

describe("pexels_get_video", () => {
  it("hits the literal /v1/videos/videos/:id path (note the duplicated 'videos/')", async () => {
    const { client, fetchImpl } = makeMockClient([{ body: sampleVideo }]);
    const tool = getToolByName(client, "pexels_get_video");
    const result = (await tool.handler({ id: 123 })) as Record<string, unknown>;

    const url = getCallUrl(fetchImpl);
    expect(url.pathname).toBe("/v1/videos/videos/123");
    expect(url.pathname).not.toBe("/v1/videos/123");
    expect([...url.searchParams.keys()]).toHaveLength(0);

    const headers = getCallHeaders(fetchImpl);
    expect(headers.Authorization).toBe("test-key");

    expect(result.id).toBe(sampleVideo.id);
    expect(result._rateLimit).toBeDefined();
  });

  it("maps a 404 response to a PexelsApiError with status 404", async () => {
    const { client } = makeMockClient([
      { status: 404, body: { error: "Not Found" } },
    ]);
    const tool = getToolByName(client, "pexels_get_video");
    await expect(tool.handler({ id: 9999999 })).rejects.toMatchObject({
      status: 404,
    });
  });

  it("rejects non-integer id via inputSchema.safeParse", () => {
    const { client } = makeMockClient([]);
    const tool = getToolByName(client, "pexels_get_video");
    const result = tool.inputSchema.safeParse({ id: 1.5 });
    expect(result.success).toBe(false);
  });

  it("rejects id below 1 via inputSchema.safeParse", () => {
    const { client } = makeMockClient([]);
    const tool = getToolByName(client, "pexels_get_video");
    const result = tool.inputSchema.safeParse({ id: 0 });
    expect(result.success).toBe(false);
  });
});
