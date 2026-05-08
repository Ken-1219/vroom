import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "../schema";

// Seed data imports
import { seedUsers } from "./data/users";
import { seedVehicles } from "./data/vehicles";
import { seedBookings, seedPayments, seedTrips, seedBookingEvents } from "./data/bookings";
import { seedReviews } from "./data/reviews";
import { seedPricingRules, seedDemandSnapshots } from "./data/pricing";
import { seedPickupPoints, seedGeofences } from "./data/geo";

async function main() {
  console.log("🌱 VROOM Seed Script Starting...\n");

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is not set.");
    console.error("Make sure .env file exists in packages/db/ with DATABASE_URL=...");
    process.exit(1);
  }

  const neonSql = neon(process.env.DATABASE_URL);
  const db = drizzle(neonSql, { schema });

  try {
    // ── Step 1: Clear existing data (respect FK order) ───────
    console.log("Clearing existing data...");

    await db.execute(sql`DELETE FROM "notifications"`);
    await db.execute(sql`DELETE FROM "trip_locations"`);
    await db.execute(sql`DELETE FROM "trips"`);
    await db.execute(sql`DELETE FROM "reviews"`);
    await db.execute(sql`DELETE FROM "booking_events"`);
    await db.execute(sql`DELETE FROM "payments"`);
    await db.execute(sql`DELETE FROM "bookings"`);
    await db.execute(sql`DELETE FROM "demand_snapshots"`);
    await db.execute(sql`DELETE FROM "pricing_rules"`);
    await db.execute(sql`DELETE FROM "geofences"`);
    await db.execute(sql`DELETE FROM "pickup_points"`);
    await db.execute(sql`DELETE FROM "vehicles"`);
    await db.execute(sql`DELETE FROM "users"`);

    console.log("  All tables cleared.\n");

    // ── Step 2: Seed users ───────────────────────────────────
    console.log("Seeding users...");
    await db.insert(schema.users).values(seedUsers);
    console.log(`  Inserted ${seedUsers.length} users.\n`);

    // ── Step 3: Seed vehicles ────────────────────────────────
    console.log("Seeding vehicles...");
    await db.insert(schema.vehicles).values(seedVehicles);
    console.log(`  Inserted ${seedVehicles.length} vehicles.\n`);

    // ── Step 4: Seed bookings ────────────────────────────────
    console.log("Seeding bookings...");
    await db.insert(schema.bookings).values(seedBookings);
    console.log(`  Inserted ${seedBookings.length} bookings.\n`);

    // ── Step 5: Seed payments ────────────────────────────────
    console.log("Seeding payments...");
    await db.insert(schema.payments).values(seedPayments);
    console.log(`  Inserted ${seedPayments.length} payments.\n`);

    // ── Step 6: Seed trips ───────────────────────────────────
    console.log("Seeding trips...");
    await db.insert(schema.trips).values(seedTrips);
    console.log(`  Inserted ${seedTrips.length} trips.\n`);

    // ── Step 7: Seed booking events ──────────────────────────
    console.log("Seeding booking events...");
    await db.insert(schema.bookingEvents).values(seedBookingEvents);
    console.log(`  Inserted ${seedBookingEvents.length} booking events.\n`);

    // ── Step 8: Seed reviews ─────────────────────────────────
    console.log("Seeding reviews...");
    await db.insert(schema.reviews).values(seedReviews);
    console.log(`  Inserted ${seedReviews.length} reviews.\n`);

    // ── Step 9: Seed pricing rules ───────────────────────────
    console.log("Seeding pricing rules...");
    await db.insert(schema.pricingRules).values(seedPricingRules);
    console.log(`  Inserted ${seedPricingRules.length} pricing rules.\n`);

    // ── Step 10: Seed demand snapshots ───────────────────────
    console.log("Seeding demand snapshots...");
    await db.insert(schema.demandSnapshots).values(seedDemandSnapshots);
    console.log(`  Inserted ${seedDemandSnapshots.length} demand snapshots.\n`);

    // ── Step 11: Seed pickup points ──────────────────────────
    console.log("Seeding pickup points...");
    await db.insert(schema.pickupPoints).values(seedPickupPoints);
    console.log(`  Inserted ${seedPickupPoints.length} pickup points.\n`);

    // ── Step 12: Seed geofences ──────────────────────────────
    console.log("Seeding geofences...");
    await db.insert(schema.geofences).values(seedGeofences);
    console.log(`  Inserted ${seedGeofences.length} geofences.\n`);

    // ── Summary ──────────────────────────────────────────────
    console.log("=".repeat(50));
    console.log("SEED COMPLETE! Summary:");
    console.log(`  Users:            ${seedUsers.length}`);
    console.log(`  Vehicles:         ${seedVehicles.length}`);
    console.log(`  Bookings:         ${seedBookings.length}`);
    console.log(`  Payments:         ${seedPayments.length}`);
    console.log(`  Trips:            ${seedTrips.length}`);
    console.log(`  Booking Events:   ${seedBookingEvents.length}`);
    console.log(`  Reviews:          ${seedReviews.length}`);
    console.log(`  Pricing Rules:    ${seedPricingRules.length}`);
    console.log(`  Demand Snapshots: ${seedDemandSnapshots.length}`);
    console.log(`  Pickup Points:    ${seedPickupPoints.length}`);
    console.log(`  Geofences:        ${seedGeofences.length}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\nSeed failed with error:");
    console.error(error);
    process.exit(1);
  }
}

main();
