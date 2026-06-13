import { doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

export const STORE_SETTINGS_COLLECTION = "storeSettings";
export const ORDERING_DOC = "ordering";

export const ORDERING_PAUSED_MESSAGE =
  "Online ordering is temporarily paused. Please check back soon.";

export type OrderingStatus = {
  paused: boolean;
  reason: string | null;
};

const DEFAULT_STATUS: OrderingStatus = { paused: false, reason: null };

export async function fetchOrderingStatus(): Promise<OrderingStatus> {
  if (!isFirebaseConfigured) return DEFAULT_STATUS;

  const snap = await getDoc(doc(db, STORE_SETTINGS_COLLECTION, ORDERING_DOC));
  if (!snap.exists()) return DEFAULT_STATUS;
  const data = snap.data();
  return {
    paused: data.paused === true,
    reason: typeof data.reason === "string" && data.reason.trim() ? data.reason : null,
  };
}

export function getOrderingPausedMessage(status: OrderingStatus): string {
  if (!status.paused) return "";
  return status.reason ? `${ORDERING_PAUSED_MESSAGE} (${status.reason})` : ORDERING_PAUSED_MESSAGE;
}
