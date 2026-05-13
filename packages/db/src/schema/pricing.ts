import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
  date,
  bigserial,
  index,
} from "drizzle-orm/pg-core";
import { pricingScopeEnum, pricingRuleTypeEnum, vehicleTypeEnum } from "./enums";

export const pricingRules = pgTable("pricing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  scope: pricingScopeEnum("scope").notNull(),
  scopeValue: varchar("scope_value", { length: 100 }),
  ruleType: pricingRuleTypeEnum("rule_type").notNull(),
  conditions: jsonb("conditions").notNull(),
  multiplier: numeric("multiplier", { precision: 3, scale: 2 }).notNull(),
  priority: integer("priority").default(0),
  active: boolean("active").default(true),
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const demandSnapshots = pgTable(
  "demand_snapshots",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    h3Index: varchar("h3_index", { length: 20 }).notNull(),
    vehicleType: vehicleTypeEnum("vehicle_type"),
    demandScore: numeric("demand_score", { precision: 3, scale: 2 }),
    supplyCount: integer("supply_count"),
    bookedCount: integer("booked_count"),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_demand_h3").on(table.h3Index, table.computedAt),
  ]
);

export type PricingRule = typeof pricingRules.$inferSelect;
export type NewPricingRule = typeof pricingRules.$inferInsert;
export type DemandSnapshot = typeof demandSnapshots.$inferSelect;
export type NewDemandSnapshot = typeof demandSnapshots.$inferInsert;
