/**
 * Backfills a stable `id` on every embedded menu item in `menuSections`.
 *
 * Existing menu items are keyed only by name. The admin dashboard upserts and
 * deletes items by a stable id, so this script assigns one to any item missing
 * it. Name-based lookups (used by the checkout `baseName` validation) keep
 * working during and after the transition.
 *
 * Run once (after configuring env/.env.local):
 *   npx tsx scripts/backfill-menu-item-ids.ts
 *
 * Idempotent — items that already have an id are left untouched.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import process from "node:process";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): Record<string, string> {
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

  const snap = await getDocs(collection(db, "menuSections"));
  const batch = writeBatch(db);
  let updatedSections = 0;
  let updatedItems = 0;

  snap.forEach((sectionDoc) => {
    const data = sectionDoc.data() as Record<string, unknown>;
    const items = Array.isArray(data.items) ? (data.items as Record<string, unknown>[]) : [];
    if (items.length === 0) return;

    const seen = new Set<string>();
    let changed = false;

    const nextItems = items.map((item) => {
      if (typeof item.id === "string" && item.id.trim()) {
        seen.add(item.id);
        return item;
      }
      changed = true;
      updatedItems += 1;
      const base = slugify(String(item.name ?? "item")) || "item";
      let id = base;
      let n = 2;
      while (seen.has(id)) {
        id = `${base}-${n++}`;
      }
      seen.add(id);
      return { ...item, id };
    });

    if (changed) {
      updatedSections += 1;
      batch.set(doc(db, "menuSections", sectionDoc.id), { items: nextItems }, { merge: true });
    }
  });

  if (updatedItems === 0) {
    console.log("All menu items already have stable IDs. Nothing to do.");
    process.exit(0);
  }

  await batch.commit();
  console.log(
    `Backfilled ${updatedItems} item IDs across ${updatedSections} sections in project "${firebaseConfig.projectId}".`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
