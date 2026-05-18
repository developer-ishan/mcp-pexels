import { describe, expect, it } from "vitest";
import { collectionTools } from "../src/tools/collections.js";
import { PexelsApiError } from "../src/http/types.js";
import {
  getCallHeaders,
  getCallUrl,
  makeMockClient,
} from "./helpers/mockClient.js";
import type { ToolDefinition } from "../src/types/tool.js";

function getTool(tools: ToolDefinition[], name: string): ToolDefinition {
  const t = tools.find((t) => t.name === name);
  if (!t) throw new Error(`Tool not found: ${name}`);
  return t;
}

const listBody = {
  collections: [
    {
      id: "9mp14cx",
      title: "Cool Cats",
      description: null,
      private: false,
      media_count: 6,
      photos_count: 5,
      videos_count: 1,
    },
  ],
  page: 1,
  per_page: 15,
  total_results: 5,
};

const collectionMediaBody = {
  id: "9mp14cx",
  media: [
    {
      type: "Photo",
      id: 1,
      width: 100,
      height: 100,
      url: "https://example.com/1",
      photographer: "X",
      photographer_url: "https://example.com/x",
      photographer_id: 1,
      avg_color: "#fff",
      src: {},
      liked: false,
    },
    {
      type: "Video",
      id: 2,
      width: 100,
      height: 100,
      duration: 10,
      url: "https://example.com/2",
      image: "https://example.com/2.jpg",
      user: {},
      video_files: [],
      video_pictures: [],
    },
  ],
  page: 1,
  per_page: 15,
  total_results: 2,
};

describe("collectionTools", () => {
  it("returns three tools in the documented order", () => {
    const { client } = makeMockClient([]);
    const tools = collectionTools(client);
    expect(tools.map((t) => t.name)).toEqual([
      "pexels_featured_collections",
      "pexels_my_collections",
      "pexels_collection_media",
    ]);
  });

  describe("pexels_featured_collections", () => {
    it("hits the featured collections endpoint and forwards rate limit", async () => {
      const { client, fetchImpl } = makeMockClient([{ body: listBody }]);
      const tool = getTool(collectionTools(client), "pexels_featured_collections");
      const result = (await tool.handler({ page: 2, per_page: 5 })) as Record<
        string,
        unknown
      >;

      const url = getCallUrl(fetchImpl);
      expect(url.toString()).toBe(
        "https://api.pexels.com/v1/collections/featured?page=2&per_page=5",
      );
      expect(getCallHeaders(fetchImpl).Authorization).toBe("test-key");
      expect(result._rateLimit).toEqual({
        limit: 20000,
        remaining: 19999,
        reset: 1700000000,
      });
      expect(result.collections).toEqual(listBody.collections);
    });

    it("throws a PexelsApiError on a 404 response", async () => {
      const { client } = makeMockClient([
        { status: 404, body: { error: "Not Found" } },
      ]);
      const tool = getTool(collectionTools(client), "pexels_featured_collections");
      const err = await tool.handler({}).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(PexelsApiError);
      expect((err as PexelsApiError).status).toBe(404);
    });
  });

  describe("pexels_my_collections", () => {
    it("hits the my collections endpoint and forwards rate limit", async () => {
      const { client, fetchImpl } = makeMockClient([{ body: listBody }]);
      const tool = getTool(collectionTools(client), "pexels_my_collections");
      const result = (await tool.handler({})) as Record<string, unknown>;

      const url = getCallUrl(fetchImpl);
      expect(url.toString()).toBe("https://api.pexels.com/v1/collections");
      expect(getCallHeaders(fetchImpl).Authorization).toBe("test-key");
      expect(result._rateLimit).toMatchObject({ limit: 20000 });
      expect(result.collections).toEqual(listBody.collections);
    });

    it("throws a PexelsApiError on a 404 response", async () => {
      const { client } = makeMockClient([
        { status: 404, body: { error: "Not Found" } },
      ]);
      const tool = getTool(collectionTools(client), "pexels_my_collections");
      await expect(tool.handler({})).rejects.toBeInstanceOf(PexelsApiError);
    });
  });

  describe("pexels_collection_media", () => {
    it("hits the collection media endpoint with all params", async () => {
      const { client, fetchImpl } = makeMockClient([
        { body: collectionMediaBody },
      ]);
      const tool = getTool(collectionTools(client), "pexels_collection_media");
      const result = (await tool.handler({
        id: "abc123",
        type: "photos",
        sort: "desc",
        per_page: 10,
      })) as Record<string, unknown>;

      const url = getCallUrl(fetchImpl);
      expect(url.origin + url.pathname).toBe(
        "https://api.pexels.com/v1/collections/abc123",
      );
      expect(url.searchParams.get("type")).toBe("photos");
      expect(url.searchParams.get("sort")).toBe("desc");
      expect(url.searchParams.get("per_page")).toBe("10");
      expect(url.searchParams.get("page")).toBeNull();
      expect(getCallHeaders(fetchImpl).Authorization).toBe("test-key");
      expect(result._rateLimit).toMatchObject({ limit: 20000 });
    });

    it("passes through the Photo/Video discriminated `type` field on media items", async () => {
      const { client } = makeMockClient([{ body: collectionMediaBody }]);
      const tool = getTool(collectionTools(client), "pexels_collection_media");
      const result = (await tool.handler({ id: "9mp14cx" })) as {
        media: Array<{ type: string; id: number }>;
      };

      expect(result.media).toHaveLength(2);
      expect(result.media[0].type).toBe("Photo");
      expect(result.media[0].id).toBe(1);
      expect(result.media[1].type).toBe("Video");
      expect(result.media[1].id).toBe(2);
    });

    it("throws a PexelsApiError on a 404 response", async () => {
      const { client } = makeMockClient([
        { status: 404, body: { error: "Not Found" } },
      ]);
      const tool = getTool(collectionTools(client), "pexels_collection_media");
      await expect(
        tool.handler({ id: "missing" }),
      ).rejects.toBeInstanceOf(PexelsApiError);
    });

    it("rejects input missing the required id", () => {
      const { client } = makeMockClient([]);
      const tool = getTool(collectionTools(client), "pexels_collection_media");
      const parsed = tool.inputSchema.safeParse({});
      expect(parsed.success).toBe(false);
    });

    it("rejects invalid `type` values", () => {
      const { client } = makeMockClient([]);
      const tool = getTool(collectionTools(client), "pexels_collection_media");
      const parsed = tool.inputSchema.safeParse({
        id: "abc",
        type: "audio",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects invalid `sort` values", () => {
      const { client } = makeMockClient([]);
      const tool = getTool(collectionTools(client), "pexels_collection_media");
      const parsed = tool.inputSchema.safeParse({
        id: "abc",
        sort: "sideways",
      });
      expect(parsed.success).toBe(false);
    });

    it("accepts a fully populated valid input", () => {
      const { client } = makeMockClient([]);
      const tool = getTool(collectionTools(client), "pexels_collection_media");
      const parsed = tool.inputSchema.safeParse({
        id: "abc",
        type: "videos",
        sort: "asc",
        page: 2,
        per_page: 20,
      });
      expect(parsed.success).toBe(true);
    });
  });
});
