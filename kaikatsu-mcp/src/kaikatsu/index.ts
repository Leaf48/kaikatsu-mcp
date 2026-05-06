import * as z from "zod";
import storesRaw from "../../assets/stores.json" with { type: "json" };
import { api_key, endpoint } from "./get-endpoint.js";

const StoreSchema = z.object({
  store_code: z.string(),
  store_name: z.string(),
  name_kana: z.string(),
  cf_store_city: z.string(),
  cf_store_city_kana: z.string(),
  tel: z.string(),
  address: z.string(),
});

type Store = z.infer<typeof StoreSchema> & { prefecture: string };

const ALL_STORES: Store[] = Object.entries(
  storesRaw as Record<string, unknown[]>,
).flatMap(([prefecture, list]) =>
  list.map((s) => ({ ...StoreSchema.parse(s), prefecture })),
);

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
    return ALL_STORES.filter((s) => {
      const haystack = [
        s.store_code,
        s.store_name,
        s.name_kana,
        s.cf_store_city,
        s.cf_store_city_kana,
        s.address,
        s.prefecture,
      ]
        .join("\n")
        .toLowerCase();
      return qs.every((q) => haystack.includes(q));
    });
  }

  listAllStores(): Store[] {
    return ALL_STORES;
  }
}
