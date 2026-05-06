import * as z from "zod";
import storesRaw from "../../assets/stores.json" with { type: "json" };
import { api_key, endpoint } from "./get-endpoint.js";

const RawStoreSchema = z.object({
  store_code: z.string(),
  store_name: z.string(),
  name_kana: z.string(),
  cf_store_city: z.string(),
  cf_store_city_kana: z.string(),
  tel: z.string(),
  address: z.string(),
  service: z.array(z.string()).default([]),
  roomtype: z.array(z.string()).default([]),
  karaoke: z.array(z.string()).default([]),
  darts: z.array(z.string()).default([]),
  billiards: z.array(z.string()).default([]),
  "12karaoke": z.array(z.string()).default([]),
});

type RawStore = z.infer<typeof RawStoreSchema>;
type Playable = "karaoke" | "darts" | "billiards";
type Playables = Partial<Record<Playable, string[]>>;
type Store = Pick<
  RawStore,
  | "store_code"
  | "store_name"
  | "name_kana"
  | "cf_store_city"
  | "cf_store_city_kana"
  | "tel"
  | "address"
> & {
  prefecture: string;
  services: string[];
  seat_types: string[];
  playables: Playables;
};

type StoreIndex = {
  store: Store;
  haystack: string;
};

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function derivePlayables(
  store: Pick<RawStore, "karaoke" | "darts" | "billiards" | "12karaoke">,
): Playables {
  const playables: Playables = {};
  const karaoke = uniqueStrings([...store.karaoke, ...store["12karaoke"]]);
  if (karaoke.length > 0) {
    playables.karaoke = karaoke;
  }
  if (store.darts.length > 0) {
    playables.darts = uniqueStrings(store.darts);
  }
  if (store.billiards.length > 0) {
    playables.billiards = uniqueStrings(store.billiards);
  }
  return playables;
}

function toStoreIndex(prefecture: string, raw: unknown): StoreIndex {
  const store = RawStoreSchema.parse(raw);
  return {
    store: {
      store_code: store.store_code,
      store_name: store.store_name,
      name_kana: store.name_kana,
      cf_store_city: store.cf_store_city,
      cf_store_city_kana: store.cf_store_city_kana,
      tel: store.tel,
      address: store.address,
      prefecture,
      services: store.service,
      seat_types: store.roomtype,
      playables: derivePlayables(store),
    },
    haystack: [
      store.store_code,
      store.store_name,
      store.name_kana,
      store.cf_store_city,
      store.cf_store_city_kana,
      store.address,
      prefecture,
    ]
      .join("\n")
      .toLowerCase(),
  };
}

const ALL_STORES: StoreIndex[] = Object.entries(
  storesRaw as Record<string, unknown[]>,
).flatMap(([prefecture, list]) => list.map((s) => toStoreIndex(prefecture, s)));

const VacancySchema = z.object({
  status: z.number(),
  store_cd: z.string(),
  message: z.string(),
  seat_type: z.array(
    z.object({
      category_id: z.string(),
      seat_name: z.string(),
      seat_status: z.string(),
      status_no: z.string(),
    }),
  ),
});

type Vacancy = z.infer<typeof VacancySchema>;

class KaikatsuError extends Error {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "Kaikatsu Error";
  }
}

export class Kaikatsu {
  constructor() {}

  async checkVacancy(storeId: string): Promise<Vacancy> {
    let res: Response;
    try {
      res = await fetch(`${endpoint}${encodeURIComponent(storeId)}`, {
        headers: { "x-api-key": api_key },
      });
    } catch (err) {
      throw new KaikatsuError(
        `Failed to fetch vacancy for store ${storeId}`,
        err as Error,
      );
    }
    if (!res.ok) {
      throw new KaikatsuError(
        `Vacancy API returned ${res.status} for store ${storeId}`,
      );
    }

    const body = await res.json();
    const parsed = VacancySchema.safeParse(body);
    if (!parsed.success) {
      throw new KaikatsuError(
        `Invalid vacancy response: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  }

  lookupStore(keywords: string[]): Store[] {
    const qs = keywords.map((k) => k.trim().toLowerCase()).filter(Boolean);
    if (qs.length === 0) return [];
    return ALL_STORES.filter(({ haystack }) =>
      qs.every((q) => haystack.includes(q)),
    ).map(({ store }) => store);
  }

  listAllStores(): Store[] {
    return ALL_STORES.map(({ store }) => store);
  }
}
