import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { Kaikatsu } from "./kaikatsu/index.js";

const LOOKUP_LIMIT = 10;

export class KaikatsuMcp extends McpAgent {
  server = new McpServer({ name: "kaikatsu-mcp", version: "1.0.0" });
  private kaikatsu = new Kaikatsu();

  async init() {
    this.server.registerTool(
      "lookup_store",
      {
        description:
          "快活CLUBの店舗をキーワード(店名/都道府県/市区町村/住所/店舗コード)で部分一致AND検索する。「北海道 旭川」のように複数語で絞り込み可能。",
        inputSchema: {
          keywords: z
            .array(z.string())
            .min(1)
            .describe("AND検索するキーワード配列。例: ['北海道', '旭川']"),
        },
      },
      async ({ keywords }) => {
        const hits = this.kaikatsu.lookupStore(keywords);
        const truncated = hits.length > LOOKUP_LIMIT;
        const results = hits.slice(0, LOOKUP_LIMIT);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { total: hits.length, truncated, results },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    this.server.registerTool(
      "check_vacancy",
      {
        description:
          "店舗コード(store_code)を指定してリアルタイムの空席情報を取得する。store_codeはlookup_storeで先に取得すること。",
        inputSchema: {
          store_code: z
            .string()
            .describe("快活CLUBの店舗コード。例: '20176'"),
        },
      },
      async ({ store_code }) => {
        try {
          const vacancy = await this.kaikatsu.checkVacancy(store_code);
          return {
            content: [{ type: "text", text: JSON.stringify(vacancy, null, 2) }],
          };
        } catch (err) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: err instanceof Error ? err.message : String(err),
              },
            ],
          };
        }
      },
    );
  }
}

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return KaikatsuMcp.serveSSE("/sse").fetch(request, env, ctx);
    }
    if (url.pathname === "/mcp") {
      return KaikatsuMcp.serve("/mcp").fetch(request, env, ctx);
    }
    return new Response("Not found", { status: 404 });
  },
};
