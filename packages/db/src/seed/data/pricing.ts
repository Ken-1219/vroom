import type { NewPricingRule, NewDemandSnapshot } from "../../schema/pricing";

function pricingRuleId(n: number): string {
  return `ab000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

export const seedPricingRules: NewPricingRule[] = [
  // ── Global Rules ───────────────────────────────────────────
  {
    id: pricingRuleId(1),
    scope: "global",
    scopeValue: null,
    ruleType: "weekend",
    conditions: { dayOfWeek: [5, 6] }, // Friday, Saturday
    multiplier: "1.15",
    priority: 10,
    active: true,
    validFrom: null,
    validTo: null,
  },
  {
    id: pricingRuleId(2),
    scope: "global",
    scopeValue: null,
    ruleType: "time_decay",
    conditions: { hoursBeforeStart: { lte: 6 } }, // Last 6 hours - last minute discount
    multiplier: "0.90",
    priority: 5,
    active: true,
    validFrom: null,
    validTo: null,
  },
  {
    id: pricingRuleId(3),
    scope: "global",
    scopeValue: null,
    ruleType: "time_decay",
    conditions: { hoursBeforeStart: { lte: 2 } }, // Last 2 hours - deeper discount
    multiplier: "0.85",
    priority: 6,
    active: true,
    validFrom: null,
    validTo: null,
  },

  // ── India Holiday Rules ────────────────────────────────────
  {
    id: pricingRuleId(4),
    scope: "country",
    scopeValue: "IN",
    ruleType: "seasonal",
    conditions: { name: "Diwali Week" },
    multiplier: "1.40",
    priority: 20,
    active: true,
    validFrom: "2026-10-15",
    validTo: "2026-10-25",
  },
  {
    id: pricingRuleId(5),
    scope: "country",
    scopeValue: "IN",
    ruleType: "seasonal",
    conditions: { name: "Christmas & New Year" },
    multiplier: "1.30",
    priority: 20,
    active: true,
    validFrom: "2026-12-22",
    validTo: "2027-01-03",
  },
  {
    id: pricingRuleId(6),
    scope: "country",
    scopeValue: "IN",
    ruleType: "seasonal",
    conditions: { name: "Independence Day Weekend" },
    multiplier: "1.25",
    priority: 18,
    active: true,
    validFrom: "2026-08-13",
    validTo: "2026-08-17",
  },
  {
    id: pricingRuleId(7),
    scope: "country",
    scopeValue: "IN",
    ruleType: "event",
    conditions: { name: "Holi Festival" },
    multiplier: "1.20",
    priority: 18,
    active: true,
    validFrom: "2027-03-12",
    validTo: "2027-03-15",
  },

  // ── City-Level Demand Surge Rules ──────────────────────────
  {
    id: pricingRuleId(8),
    scope: "city",
    scopeValue: "Bangalore",
    ruleType: "demand_surge",
    conditions: { demandScore: { gte: 0.80 }, timeWindow: "4h" },
    multiplier: "1.25",
    priority: 15,
    active: true,
    validFrom: null,
    validTo: null,
  },
  {
    id: pricingRuleId(9),
    scope: "city",
    scopeValue: "Mumbai",
    ruleType: "demand_surge",
    conditions: { demandScore: { gte: 0.85 }, timeWindow: "4h" },
    multiplier: "1.30",
    priority: 15,
    active: true,
    validFrom: null,
    validTo: null,
  },
  {
    id: pricingRuleId(10),
    scope: "city",
    scopeValue: "New Delhi",
    ruleType: "demand_surge",
    conditions: { demandScore: { gte: 0.80 }, timeWindow: "4h" },
    multiplier: "1.20",
    priority: 15,
    active: true,
    validFrom: null,
    validTo: null,
  },
  {
    id: pricingRuleId(11),
    scope: "city",
    scopeValue: "Hyderabad",
    ruleType: "demand_surge",
    conditions: { demandScore: { gte: 0.75 }, timeWindow: "4h" },
    multiplier: "1.25",
    priority: 15,
    active: true,
    validFrom: null,
    validTo: null,
  },
  {
    id: pricingRuleId(16),
    scope: "city",
    scopeValue: "Panaji",
    ruleType: "demand_surge",
    conditions: { demandScore: { gte: 0.70 }, timeWindow: "4h" },
    multiplier: "1.30",
    priority: 15,
    active: true,
    validFrom: null,
    validTo: null,
  },

  // ── Duration Discount Rules ────────────────────────────────
  {
    id: pricingRuleId(12),
    scope: "global",
    scopeValue: null,
    ruleType: "duration",
    conditions: { durationDays: { gte: 7 }, name: "Weekly Discount" },
    multiplier: "0.90",
    priority: 8,
    active: true,
    validFrom: null,
    validTo: null,
  },
  {
    id: pricingRuleId(13),
    scope: "global",
    scopeValue: null,
    ruleType: "duration",
    conditions: { durationDays: { gte: 30 }, name: "Monthly Discount" },
    multiplier: "0.80",
    priority: 9,
    active: true,
    validFrom: null,
    validTo: null,
  },

  // ── Vehicle Type Rules ─────────────────────────────────────
  {
    id: pricingRuleId(14),
    scope: "vehicle_type",
    scopeValue: "suv",
    ruleType: "seasonal",
    conditions: { name: "Summer SUV Premium", months: [5, 6, 7] }, // June-August (0-indexed+1)
    multiplier: "1.10",
    priority: 12,
    active: true,
    validFrom: "2026-06-01",
    validTo: "2026-08-31",
  },
  {
    id: pricingRuleId(15),
    scope: "vehicle_type",
    scopeValue: "ev",
    ruleType: "seasonal",
    conditions: { name: "Monsoon EV Discount", months: [6, 7, 8] },
    multiplier: "0.90",
    priority: 12,
    active: true,
    validFrom: "2026-07-01",
    validTo: "2026-09-30",
  },
];

// ── Demand Snapshots ─────────────────────────────────────────
// Simulated demand data for various H3 hexagons
// H3 resolution 7 indexes for major areas
export const seedDemandSnapshots: NewDemandSnapshot[] = [
  // Bangalore - Koramangala (high demand)
  {
    h3Index: "872a1074bffffff",
    vehicleType: "hatchback",
    demandScore: "0.82",
    supplyCount: 5,
    bookedCount: 4,
  },
  {
    h3Index: "872a1074bffffff",
    vehicleType: "suv",
    demandScore: "0.75",
    supplyCount: 3,
    bookedCount: 2,
  },
  // Bangalore - Indiranagar
  {
    h3Index: "872a10749ffffff",
    vehicleType: "sedan",
    demandScore: "0.68",
    supplyCount: 4,
    bookedCount: 3,
  },
  {
    h3Index: "872a10749ffffff",
    vehicleType: "suv",
    demandScore: "0.72",
    supplyCount: 3,
    bookedCount: 2,
  },
  // Mumbai - Bandra
  {
    h3Index: "872a10600ffffff",
    vehicleType: "hatchback",
    demandScore: "0.88",
    supplyCount: 4,
    bookedCount: 4,
  },
  {
    h3Index: "872a10600ffffff",
    vehicleType: "suv",
    demandScore: "0.65",
    supplyCount: 3,
    bookedCount: 2,
  },
  // Delhi - CP
  {
    h3Index: "872a10416ffffff",
    vehicleType: "sedan",
    demandScore: "0.78",
    supplyCount: 5,
    bookedCount: 4,
  },
  // Hyderabad - Hitech City
  {
    h3Index: "872a10700ffffff",
    vehicleType: "sedan",
    demandScore: "0.70",
    supplyCount: 3,
    bookedCount: 2,
  },
  {
    h3Index: "872a10700ffffff",
    vehicleType: "suv",
    demandScore: "0.78",
    supplyCount: 4,
    bookedCount: 3,
  },
  // Chennai - T Nagar
  {
    h3Index: "872a10620ffffff",
    vehicleType: "hatchback",
    demandScore: "0.65",
    supplyCount: 3,
    bookedCount: 2,
  },
  // Pune - Koregaon Park
  {
    h3Index: "872a10500ffffff",
    vehicleType: "suv",
    demandScore: "0.72",
    supplyCount: 3,
    bookedCount: 2,
  },
  // Goa - Panaji
  {
    h3Index: "872a10810ffffff",
    vehicleType: "suv",
    demandScore: "0.85",
    supplyCount: 4,
    bookedCount: 4,
  },
];
