/**
 * Seeds the Firestore `menuSections` collection from the bundled menu data.
 *
 * Run once (after configuring env/.env.local):
 *   npx tsx scripts/seed-menu.ts
 *
 * Each section becomes one document keyed by its slug (e.g. "pizzas"), with an
 * `order` field so the app can sort sections deterministically. Re-running is
 * idempotent — it overwrites existing section documents.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import process from "node:process";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, writeBatch } from "firebase/firestore";

import { menu, sauces } from "../src/lib/menu-data";
import { DEFAULT_OPERATION_HOURS } from "../src/lib/operation-hours-data";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): Record<string, string> {
  // Prefer real environment variables (CI), fall back to env/.env.local.
  const fromProcess = { ...process.env } as Record<string, string>;
  try {
    const raw = readFileSync(resolve(__dirname, "../env/.env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in fromProcess)) fromProcess[key] = value;
    }
  } catch {
    // No .env.local — rely on process env only.
  }
  return fromProcess;
}

async function main() {
  const env = loadEnv();

  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    throw new Error(
      "Missing Firebase config. Set VITE_FIREBASE_* in env/.env.local or the environment.",
    );
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const batch = writeBatch(db);
  menu.forEach((section, index) => {
    batch.set(doc(db, "menuSections", section.id), {
      id: section.id,
      number: section.number,
      title: section.title,
      subtitle: section.subtitle ?? null,
      order: index,
      items: section.items.map((item) => ({
        name: item.name,
        description: item.description ?? null,
        price: Number.parseFloat(item.price),
        badge: item.badge ?? null,
        image: item.image ?? null,
      })),
    });
  });

  sauces.forEach((sauce, index) => {
    // Use the sauce name as a stable, readable document ID.
    const id = sauce.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    batch.set(doc(db, "sauces", id), {
      name: sauce.name,
      price: Number.parseFloat(sauce.price),
      order: index,
    });
  });

  batch.set(doc(db, "storeSettings", "operationHours"), {
    timezone: DEFAULT_OPERATION_HOURS.timezone,
    days: DEFAULT_OPERATION_HOURS.days,
    updatedAt: new Date().toISOString(),
  });

  await batch.commit();
  console.log(
    `Seeded ${menu.length} menu sections, ${sauces.length} sauces, and store operation hours to project "${firebaseConfig.projectId}".`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
