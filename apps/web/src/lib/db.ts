import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import * as schema from "@vroom/db/schema";

// WebSocket not needed in edge/serverless — the Pool constructor handles it
// For Node.js environments (local dev, tests), we need the ws polyfill
if (typeof globalThis.WebSocket === "undefined") {
  try {
    const ws = require("ws");
    neonConfig.webSocketConstructor = ws;
  } catch {
    // ws not available — WebSocket transport won't work (HTTP still will)
  }
}

let _httpDb: ReturnType<typeof drizzleHttp<typeof schema>> | null = null;
let _wsDb: ReturnType<typeof drizzleWs<typeof schema>> | null = null;
let _pool: Pool | null = null;

function getHttpDb() {
  if (!_httpDb) {
    const sql = neon(process.env.DATABASE_URL!);
    _httpDb = drizzleHttp(sql, { schema });
  }
  return _httpDb;
}

function getWsDb() {
  if (!_wsDb) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    _wsDb = drizzleWs(_pool, { schema });
  }
  return _wsDb;
}

export const db = new Proxy({} as ReturnType<typeof drizzleHttp<typeof schema>>, {
  get(_, prop) {
    return (getHttpDb() as any)[prop];
  },
});

export const wsDb = new Proxy({} as ReturnType<typeof drizzleWs<typeof schema>>, {
  get(_, prop) {
    return (getWsDb() as any)[prop];
  },
});
