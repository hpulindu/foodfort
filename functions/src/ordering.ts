import { HttpsError } from "firebase-functions/v2/https";

export const STORE_SETTINGS_COLLECTION = "storeSettings";
export const ORDERING_DOC = "ordering";

export const ORDERING_PAUSED_ERROR =
  "Online ordering is temporarily paused. Please try again shortly.";

export type OrderingStatus = {
  paused: boolean;
  reason: string | null;
};

export async function fetchOrderingStatus(
  db: FirebaseFirestore.Firestore,
): Promise<OrderingStatus> {
  const snap = await db
    .collection(STORE_SETTINGS_COLLECTION)
    .doc(ORDERING_DOC)
    .get();

  if (!snap.exists) return { paused: false, reason: null };
  const data = snap.data() ?? {};
  return {
    paused: data.paused === true,
    reason: typeof data.reason === "string" ? data.reason : null,
  };
}

/**
 * Rejects when an admin has paused online ordering. The customer-facing reason
 * (if any) is surfaced so checkout can show why ordering is unavailable.
 */
export async function assertOrderingNotPaused(
  db: FirebaseFirestore.Firestore,
): Promise<void> {
  const status = await fetchOrderingStatus(db);
  if (status.paused) {
    throw new HttpsError(
      "failed-precondition",
      status.reason ? `${ORDERING_PAUSED_ERROR} (${status.reason})` : ORDERING_PAUSED_ERROR,
    );
  }
}
