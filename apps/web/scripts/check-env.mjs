/**
 * Pre-build environment variable checker.
 * Runs before `next build` to catch missing keys early with clear messages
 * instead of cryptic runtime errors (e.g. "Missing API key" from Resend).
 *
 * Exit code 1 = required var missing (blocks build).
 * Exit code 0 = all required vars present (warnings for optional ones are non-blocking).
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // file doesn't exist — that's fine
  }
}

// Load .env files the same way Next.js does (most specific wins, but don't overwrite existing)
const appRoot = resolve(__dirname, "..");
const monorepoRoot = resolve(appRoot, "../..");
for (const dir of [monorepoRoot, appRoot]) {
  loadEnvFile(resolve(dir, ".env"));
  loadEnvFile(resolve(dir, ".env.local"));
}

const required = [
  { key: "DATABASE_URL", hint: "Neon/Postgres connection string" },
  { key: "AUTH_SECRET", hint: "NextAuth secret — run `npx auth secret`" },
];

const recommended = [
  // Auth providers
  { key: "GOOGLE_CLIENT_ID", hint: "Google OAuth — login will be unavailable" },
  { key: "GOOGLE_CLIENT_SECRET", hint: "Google OAuth — login will be unavailable" },

  // Payments
  { key: "RAZORPAY_KEY_ID", hint: "Razorpay — payments will fail" },
  { key: "RAZORPAY_KEY_SECRET", hint: "Razorpay — payments will fail" },
  { key: "NEXT_PUBLIC_RAZORPAY_KEY_ID", hint: "Razorpay (client) — checkout UI will fail" },

  // Email
  { key: "RESEND_API_KEY", hint: "Resend — transactional emails will be skipped" },

  // AI
  { key: "GROQ_API_KEY", hint: "Groq — AI chat / range advisor will be unavailable" },

  // Maps
  { key: "NEXT_PUBLIC_MAPBOX_TOKEN", hint: "Mapbox — map views will be unavailable" },
  { key: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", hint: "Google Maps — places autocomplete will be unavailable" },

  // Cache
  { key: "REDIS_URL", hint: "Upstash Redis — rate limiting & AI cache disabled" },

  // Monitoring
  { key: "NEXT_PUBLIC_SENTRY_DSN", hint: "Sentry — error tracking disabled" },
];

const missing = { required: [], recommended: [] };

for (const v of required) {
  if (!process.env[v.key]) missing.required.push(v);
}
for (const v of recommended) {
  if (!process.env[v.key]) missing.recommended.push(v);
}

// Report
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

console.log(`\n${bold("Environment Check")}\n`);

if (missing.required.length > 0) {
  console.log(red(`  ✗ ${missing.required.length} required variable(s) missing:\n`));
  for (const v of missing.required) {
    console.log(red(`    ${v.key}`), dim(`— ${v.hint}`));
  }
  console.log();
}

if (missing.recommended.length > 0) {
  console.log(yellow(`  ⚠ ${missing.recommended.length} optional variable(s) missing:\n`));
  for (const v of missing.recommended) {
    console.log(yellow(`    ${v.key}`), dim(`— ${v.hint}`));
  }
  console.log();
}

const totalSet = required.length + recommended.length - missing.required.length - missing.recommended.length;
const totalAll = required.length + recommended.length;
console.log(`  ${totalSet}/${totalAll} env vars configured\n`);

if (missing.required.length > 0) {
  console.log(red(bold("  Build aborted — set the required variables above and retry.\n")));
  process.exit(1);
} else {
  console.log(green("  ✓ All required variables present — proceeding with build.\n"));
}
