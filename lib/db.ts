import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = join(process.cwd(), ".data", "db.json");

type WithId = { id?: number; [key: string]: any };

type TableSchema = Record<string, WithId[]>;

function initDb(): TableSchema {
  return {
    courses: [],
    units: [],
    lessons: [],
    challenges: [],
    challengeOptions: [],
    challengeProgress: [],
    readingAttempts: [],
    userProgress: [],
    userSubscription: [],
  };
}

function loadDb(): TableSchema {
  try {
    if (existsSync(DB_PATH)) {
      return JSON.parse(readFileSync(DB_PATH, "utf-8"));
    }
  } catch { /* corrupt file, reset */ }
  return initDb();
}

function saveDb(data: TableSchema): void {
  const dir = join(process.cwd(), ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ---- Public API ----

export const db = {
  findMany<T extends WithId>(
    table: keyof TableSchema,
    opts?: {
      where?: Partial<T> | ((item: T) => boolean);
      orderBy?: (a: T, b: T) => number;
      limit?: number;
    }
  ): T[] {
    const data = loadDb();
    let items = data[table] as T[];
    if (opts?.where) {
      if (typeof opts.where === "function") {
        items = items.filter(opts.where);
      } else {
        items = items.filter((item) =>
          Object.entries(opts.where!).every(
            ([k, v]) => (item as Record<string, unknown>)[k] === v
          )
        );
      }
    }
    if (opts?.orderBy) items = items.sort(opts.orderBy);
    if (opts?.limit) items = items.slice(0, opts.limit);
    return items;
  },

  findFirst<T extends WithId>(
    table: keyof TableSchema,
    opts?: {
      where?: Partial<T> | ((item: T) => boolean);
    }
  ): T | null {
    const data = loadDb();
    const items = data[table] as T[];
    if (!opts?.where) return items[0] ?? null;
    if (typeof opts.where === "function") {
      return items.find(opts.where) ?? null;
    }
    return items.find((item) =>
      Object.entries(opts.where!).every(
        ([k, v]) => (item as Record<string, unknown>)[k] === v
      )
    ) ?? null;
  },

  insert<T extends WithId>(
    table: keyof TableSchema,
    values: T[]
  ): T[] {
    const data = loadDb();
    const items = data[table] as T[];
    const lastId = items.reduce((max, item) => Math.max(max, item.id || 0), 0);
    const inserted = values.map((v, i) => ({ ...v, id: v.id ?? (lastId + i + 1) } as T));
    items.push(...inserted);
    saveDb(data);
    return inserted;
  },

  update<T extends WithId>(
    table: keyof TableSchema,
    where: Partial<T>,
    set: Partial<T>
  ): T[] {
    const data = loadDb();
    const items = data[table] as T[];
    const updated: T[] = [];
    for (let i = 0; i < items.length; i++) {
      const match = Object.entries(where).every(
        ([k, v]) => (items[i] as Record<string, unknown>)[k] === v
      );
      if (match) {
        items[i] = { ...items[i], ...set };
        updated.push(items[i]);
      }
    }
    saveDb(data);
    return updated;
  },

  deleteWhere(table: keyof TableSchema, predicate: (item: WithId) => boolean): void {
    const data = loadDb();
    data[table] = data[table].filter((item) => !predicate(item));
    saveDb(data);
  },

  deleteAll(table?: keyof TableSchema): void {
    if (table) {
      const data = loadDb();
      data[table] = [];
      saveDb(data);
    } else {
      saveDb(initDb());
    }
  },
};
