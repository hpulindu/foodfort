import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";
import { FieldValue, getDb, Timestamp } from "./firebase-admin-app";

const FUNCTION_REGION = "us-central1";

// Stripe secrets (same names as index.ts — resolve to the same Secret Manager values).
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeConnectedAccountId = defineSecret("STRIPE_CONNECTED_ACCOUNT_ID");

function getStripe(): Stripe {
  return new Stripe(stripeSecretKey.value().trim());
}

function getConnectedAccountId(): string {
  return stripeConnectedAccountId.value().trim();
}

// ─── Auth guard ────────────────────────────────────────────────────────────────
type AdminIdentity = { uid: string; email: string | null };

function assertAdmin(request: CallableRequest): AdminIdentity {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  if (request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Admin privileges required.");
  }
  return {
    uid: request.auth.uid,
    email: (request.auth.token.email as string | undefined) ?? null,
  };
}

// ─── Audit log ───────────────────────────────────────────────────────────────
async function writeAuditLog(
  identity: AdminIdentity,
  action: string,
  targetId?: string | null,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await getDb().collection("auditLogs").add({
      action,
      by: identity.uid,
      byEmail: identity.email,
      targetId: targetId ?? null,
      details: details ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Never let audit logging break the primary action.
    console.error("writeAuditLog failed:", err);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function asString(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new HttpsError("invalid-argument", `${field} is too long.`);
  }
  return trimmed;
}

function asPrice(value: unknown, field: string): number {
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(num) || num < 0 || num > 100000) {
    throw new HttpsError("invalid-argument", `${field} must be a valid price.`);
  }
  return +num.toFixed(2);
}

const ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
  "refunded",
] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function normalizeTime(value: string): string {
  const match = value.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : value;
}

const callOpts = { region: FUNCTION_REGION };
const stripeCallOpts = {
  region: FUNCTION_REGION,
  secrets: [stripeSecretKey, stripeConnectedAccountId],
};

// ─── Orders: status update ──────────────────────────────────────────────────────
export const adminUpdateOrderStatus = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const data = request.data as { orderId?: string; orderStatus?: string };
  const orderId = asString(data.orderId, "orderId");
  const orderStatus = data.orderStatus as OrderStatus;

  if (!ORDER_STATUSES.includes(orderStatus)) {
    throw new HttpsError("invalid-argument", "Invalid order status.");
  }

  const ref = getDb().collection("orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Order not found.");
  }

  await ref.update({
    orderStatus,
    statusUpdatedAt: FieldValue.serverTimestamp(),
    statusUpdatedBy: identity.uid,
  });

  await writeAuditLog(identity, "order.status", orderId, { orderStatus });

  return { ok: true as const, orderStatus };
});

// ─── Orders: refund (Stripe Connect direct charge) ──────────────────────────────
export const adminRefundOrder = onCall(stripeCallOpts, async (request) => {
  const identity = assertAdmin(request);
  const data = request.data as { orderId?: string; amount?: number; reason?: string };
  const orderId = asString(data.orderId, "orderId");
  const reason =
    typeof data.reason === "string" && data.reason.trim()
      ? data.reason.trim().slice(0, 500)
      : null;

  const ref = getDb().collection("orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Order not found.");
  }
  const order = snap.data() as FirebaseFirestore.DocumentData;

  const paymentIntentId: string = order.paymentIntentId ?? orderId;
  const total: number = typeof order.total === "number" ? order.total : 0;
  const alreadyRefunded: number =
    typeof order.refundedAmount === "number" ? order.refundedAmount : 0;
  const remaining = +(total - alreadyRefunded).toFixed(2);

  if (remaining <= 0) {
    throw new HttpsError("failed-precondition", "This order is already fully refunded.");
  }

  // Default to a full refund of the remaining customer-paid amount.
  let refundAmount = remaining;
  if (data.amount !== undefined && data.amount !== null) {
    refundAmount = asPrice(data.amount, "amount");
    if (refundAmount <= 0 || refundAmount > remaining + 0.001) {
      throw new HttpsError(
        "invalid-argument",
        `Refund amount must be between 0 and ${remaining.toFixed(2)}.`,
      );
    }
  }

  const amountCents = Math.round(refundAmount * 100);
  const stripe = getStripe();

  let refund: Stripe.Refund;
  try {
    refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        amount: amountCents,
        // Free-text admin reason is kept in metadata; Stripe's enum is fixed.
        reason: "requested_by_customer",
        // IMPORTANT: do NOT refund the platform application fee. The Skryptone
        // service fee stays with the platform; the merchant absorbs it.
        refund_application_fee: false,
        metadata: {
          orderId,
          refundedBy: identity.uid,
          adminReason: reason ?? "",
        },
      },
      { stripeAccount: getConnectedAccountId() },
    );
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      console.error("Refund error:", err.type, err.code ?? "none", err.message);
      throw new HttpsError(
        "failed-precondition",
        err.message || "Unable to process the refund right now.",
      );
    }
    throw err;
  }

  const newRefundedTotal = +(alreadyRefunded + refundAmount).toFixed(2);
  const isFull = newRefundedTotal >= total - 0.001;
  const refundStatus: "partial" | "full" = isFull ? "full" : "partial";

  const refundRecord = {
    id: refund.id,
    amount: refundAmount,
    reason,
    createdAt: Timestamp.now(),
    by: identity.uid,
  };

  const update: Record<string, unknown> = {
    refundStatus,
    refundedAmount: newRefundedTotal,
    refunds: FieldValue.arrayUnion(refundRecord),
    lastRefundedAt: FieldValue.serverTimestamp(),
    refundedBy: identity.uid,
  };
  if (isFull) {
    update.orderStatus = "refunded";
  }

  await ref.update(update);

  await writeAuditLog(identity, "order.refund", orderId, {
    refundId: refund.id,
    amount: refundAmount,
    refundStatus,
    reason,
  });

  return {
    ok: true as const,
    refundId: refund.id,
    refundedAmount: newRefundedTotal,
    refundStatus,
  };
});

// ─── Menu: sections ──────────────────────────────────────────────────────────
export const adminUpsertMenuSection = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const data = request.data as {
    id?: string;
    number?: string;
    title?: string;
    subtitle?: string | null;
    order?: number;
  };
  const title = asString(data.title, "title", 120);
  const number = data.number ? asString(data.number, "number", 20) : "";
  const subtitle =
    data.subtitle === null || data.subtitle === undefined
      ? null
      : asString(data.subtitle, "subtitle", 200);

  const db = getDb();
  const collection = db.collection("menuSections");

  if (data.id) {
    const id = asString(data.id, "id", 120);
    const ref = collection.doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Section not found.");
    }
    await ref.update({ number, title, subtitle, id });
    await writeAuditLog(identity, "menu.section.update", id, { title });
    return { ok: true as const, id };
  }

  // Create — derive a stable slug id, ensure uniqueness.
  let id = slugify(title) || `section-${Date.now()}`;
  if ((await collection.doc(id).get()).exists) {
    id = `${id}-${Math.random().toString(36).slice(2, 6)}`;
  }
  const order =
    typeof data.order === "number" ? data.order : (await collection.get()).size;

  await collection.doc(id).set({
    id,
    number,
    title,
    subtitle,
    order,
    items: [],
    availability: {},
  });
  await writeAuditLog(identity, "menu.section.create", id, { title });
  return { ok: true as const, id };
});

export const adminDeleteMenuSection = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const id = asString((request.data as { id?: string }).id, "id", 120);
  const ref = getDb().collection("menuSections").doc(id);
  if (!(await ref.get()).exists) {
    throw new HttpsError("not-found", "Section not found.");
  }
  await ref.delete();
  await writeAuditLog(identity, "menu.section.delete", id);
  return { ok: true as const };
});

export const adminReorderSections = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const order = (request.data as { order?: unknown }).order;
  if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
    throw new HttpsError("invalid-argument", "order must be an array of section IDs.");
  }
  const db = getDb();
  const batch = db.batch();
  (order as string[]).forEach((id, index) => {
    batch.update(db.collection("menuSections").doc(id), { order: index });
  });
  await batch.commit();
  await writeAuditLog(identity, "menu.section.reorder", null, { count: order.length });
  return { ok: true as const };
});

// ─── Menu: items ─────────────────────────────────────────────────────────────
type MenuItemInput = {
  id?: string;
  name?: string;
  description?: string | null;
  price?: number;
  badge?: string | null;
  image?: string | null;
};

export const adminUpsertMenuItem = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const data = request.data as { sectionId?: string; item?: MenuItemInput };
  const sectionId = asString(data.sectionId, "sectionId", 120);
  const raw = data.item;
  if (!raw || typeof raw !== "object") {
    throw new HttpsError("invalid-argument", "item is required.");
  }

  const name = asString(raw.name, "item.name", 160);
  const price = asPrice(raw.price, "item.price");
  const description =
    raw.description === null || raw.description === undefined
      ? null
      : asString(raw.description, "item.description", 500);
  const badge =
    raw.badge === "chef" || raw.badge === "veg" ? raw.badge : null;
  const image =
    raw.image === null || raw.image === undefined
      ? null
      : asString(raw.image, "item.image", 4096);
  const itemId =
    raw.id && typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim()
      : `item-${Math.random().toString(36).slice(2, 10)}`;

  const ref = getDb().collection("menuSections").doc(sectionId);
  const sectionSnap = await ref.get();
  if (!sectionSnap.exists) {
    throw new HttpsError("not-found", "Section not found.");
  }

  await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new Error("Section not found during update.");
    }
    const section = snap.data() as FirebaseFirestore.DocumentData;
    const items: MenuItemInput[] = Array.isArray(section.items) ? section.items : [];

    const newItem = { id: itemId, name, description, price, badge, image };
    const idx = items.findIndex((it) => it.id === itemId);
    if (idx >= 0) {
      items[idx] = newItem;
    } else {
      // Legacy items may lack stable ids — update by name when editing in place.
      const byName = items.findIndex((it) => it.name === name);
      if (byName >= 0) {
        items[byName] = newItem;
      } else {
        items.push(newItem);
      }
    }

    tx.update(ref, { items });
  });

  await writeAuditLog(identity, "menu.item.upsert", sectionId, { itemId, name });
  return { ok: true as const, itemId };
});

export const adminDeleteMenuItem = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const data = request.data as { sectionId?: string; itemId?: string };
  const sectionId = asString(data.sectionId, "sectionId", 120);
  const itemId = asString(data.itemId, "itemId", 160);

  const ref = getDb().collection("menuSections").doc(sectionId);
  const sectionSnap = await ref.get();
  if (!sectionSnap.exists) {
    throw new HttpsError("not-found", "Section not found.");
  }

  await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new Error("Section not found during update.");
    }
    const section = snap.data() as FirebaseFirestore.DocumentData;
    const items: MenuItemInput[] = Array.isArray(section.items) ? section.items : [];
    const removed = items.find((it) => it.id === itemId || it.name === itemId);
    const remaining = items.filter((it) => it.id !== itemId && it.name !== itemId);

    const availability = { ...(section.availability ?? {}) } as Record<string, boolean>;
    if (removed?.name) {
      delete availability[removed.name];
    }

    tx.update(ref, { items: remaining, availability });
  });

  await writeAuditLog(identity, "menu.item.delete", sectionId, { itemId });
  return { ok: true as const };
});

export const adminSetItemAvailability = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const data = request.data as {
    sectionId?: string;
    itemName?: string;
    available?: boolean;
  };
  const sectionId = asString(data.sectionId, "sectionId", 120);
  const itemName = asString(data.itemName, "itemName", 160);
  if (typeof data.available !== "boolean") {
    throw new HttpsError("invalid-argument", "available must be a boolean.");
  }

  const ref = getDb().collection("menuSections").doc(sectionId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Section not found.");
  }
  const availability = {
    ...((snap.data()?.availability as Record<string, boolean> | undefined) ?? {}),
  };
  availability[itemName] = data.available;
  await ref.update({ availability });

  await writeAuditLog(identity, "menu.item.availability", sectionId, {
    itemName,
    available: data.available,
  });
  return { ok: true as const };
});

// ─── Menu: sauces ────────────────────────────────────────────────────────────
export const adminUpsertSauce = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const data = request.data as {
    id?: string;
    name?: string;
    price?: number;
    order?: number;
  };
  const name = asString(data.name, "name", 120);
  const price = asPrice(data.price, "price");
  const db = getDb();
  const collection = db.collection("sauces");

  if (data.id) {
    const id = asString(data.id, "id", 120);
    const ref = collection.doc(id);
    if (!(await ref.get()).exists) {
      throw new HttpsError("not-found", "Sauce not found.");
    }
    await ref.update({ name, price });
    await writeAuditLog(identity, "menu.sauce.update", id, { name });
    return { ok: true as const, id };
  }

  let id = slugify(name) || `sauce-${Date.now()}`;
  if ((await collection.doc(id).get()).exists) {
    id = `${id}-${Math.random().toString(36).slice(2, 6)}`;
  }
  const order =
    typeof data.order === "number" ? data.order : (await collection.get()).size;
  await collection.doc(id).set({ name, price, order });
  await writeAuditLog(identity, "menu.sauce.create", id, { name });
  return { ok: true as const, id };
});

export const adminDeleteSauce = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const id = asString((request.data as { id?: string }).id, "id", 120);
  const ref = getDb().collection("sauces").doc(id);
  if (!(await ref.get()).exists) {
    throw new HttpsError("not-found", "Sauce not found.");
  }
  await ref.delete();
  await writeAuditLog(identity, "menu.sauce.delete", id);
  return { ok: true as const };
});

export const adminSetSauceAvailability = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const data = request.data as { id?: string; available?: boolean };
  const id = asString(data.id, "id", 120);
  if (typeof data.available !== "boolean") {
    throw new HttpsError("invalid-argument", "available must be a boolean.");
  }
  const ref = getDb().collection("sauces").doc(id);
  if (!(await ref.get()).exists) {
    throw new HttpsError("not-found", "Sauce not found.");
  }
  await ref.update({ available: data.available });
  await writeAuditLog(identity, "menu.sauce.availability", id, {
    available: data.available,
  });
  return { ok: true as const };
});

// ─── Settings: operation hours ──────────────────────────────────────────────────
type DayInput = { day?: string; closed?: boolean; open?: string; close?: string };

export const adminUpdateOperationHours = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const data = request.data as { timezone?: string; days?: DayInput[] };
  const timezone = data.timezone ? asString(data.timezone, "timezone", 60) : "Australia/Perth";

  if (!Array.isArray(data.days)) {
    throw new HttpsError("invalid-argument", "days must be an array.");
  }

  const days = data.days.map((raw) => {
    if (!raw || typeof raw.day !== "string" || !DAY_KEYS.includes(raw.day as never)) {
      throw new HttpsError("invalid-argument", "Invalid day entry.");
    }
    if (raw.closed === true) {
      return { day: raw.day, closed: true };
    }
    const open = normalizeTime(typeof raw.open === "string" ? raw.open : "");
    const close = normalizeTime(typeof raw.close === "string" ? raw.close : "");
    if (!TIME_RE.test(open) || !TIME_RE.test(close)) {
      throw new HttpsError("invalid-argument", `Invalid times for ${raw.day}.`);
    }
    return { day: raw.day, closed: false, open, close };
  });

  await getDb().collection("storeSettings").doc("operationHours").set(
    {
      timezone,
      days,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await writeAuditLog(identity, "settings.operationHours", "operationHours");
  return { ok: true as const };
});

// ─── Settings: pause ordering ──────────────────────────────────────────────────
export const adminSetOrderingPaused = onCall(callOpts, async (request) => {
  const identity = assertAdmin(request);
  const data = request.data as { paused?: boolean; reason?: string };
  if (typeof data.paused !== "boolean") {
    throw new HttpsError("invalid-argument", "paused must be a boolean.");
  }
  const reason =
    typeof data.reason === "string" && data.reason.trim()
      ? data.reason.trim().slice(0, 300)
      : null;

  const update: Record<string, unknown> = {
    paused: data.paused,
    reason: data.paused ? reason : null,
    updatedAt: FieldValue.serverTimestamp(),
    pausedBy: identity.uid,
  };
  if (data.paused) {
    update.pausedAt = FieldValue.serverTimestamp();
  }

  await getDb().collection("storeSettings").doc("ordering").set(update, { merge: true });

  await writeAuditLog(identity, "settings.ordering.paused", "ordering", {
    paused: data.paused,
    reason,
  });
  return { ok: true as const, paused: data.paused };
});
