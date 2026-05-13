import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

let _httpDb: NeonHttpDatabase<typeof schema> | null = null;
let _wsDb: NeonDatabase<typeof schema> | null = null;
let _pool: Pool | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_httpDb) {
    const sql = neon(process.env.DATABASE_URL!);
    _httpDb = drizzleHttp(sql, { schema });
  }
  return _httpDb;
}

export function getWsDb(): NeonDatabase<typeof schema> {
  if (!_wsDb) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    _wsDb = drizzleWs(_pool, { schema });
  }
  return _wsDb;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});

export const wsDb = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_, prop) {
    return (getWsDb() as any)[prop];
  },
});

export type Database = NeonHttpDatabase<typeof schema>;
export type WsDatabase = NeonDatabase<typeof schema>;
