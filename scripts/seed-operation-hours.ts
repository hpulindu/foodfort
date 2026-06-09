/**
 * Seeds storeSettings/operationHours in Firestore.
 *
 * Run after deploying firestore rules:
 *   npx tsx scripts/seed-operation-hours.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import process from "node:process";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

import { DEFAULT_OPERATION_HOURS } from "../src/lib/operation-hours-data";

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

  await setDoc(doc(db, "storeSettings", "operationHours"), {
    timezone: DEFAULT_OPERATION_HOURS.timezone,
    days: DEFAULT_OPERATION_HOURS.days,
    updatedAt: new Date().toISOString(),
  });

  console.log(
    `Seeded storeSettings/operationHours to project "${firebaseConfig.projectId}".`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
