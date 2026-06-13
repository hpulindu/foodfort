import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";
import { FieldValue, getDb, Timestamp } from "./firebase-admin-app";
import {
  assertValidCartItemId,
  assertValidCartItemName,
  assertValidPaymentIntentId,
  CHECKOUT_LIMITS,
  parseAndValidateCheckoutDetails,
} from "./checkout-validation";
import { assertStoreIsOpen } from "./operation-hours";
import { assertOrderingNotPaused } from "./ordering";

export {
  blockPublicSignup,
  enforceStaffSignIn,
  provisionStaffAccount,
  revokeStaffAccess,
} from "./staff-auth";

export {
  adminUpdateOrderStatus,
  adminRefundOrder,
  adminUpsertMenuSection,
  adminDeleteMenuSection,
  adminReorderSections,
  adminUpsertMenuItem,
  adminDeleteMenuItem,
  adminSetItemAvailability,
  adminUpsertSauce,
  adminDeleteSauce,
  adminSetSauceAvailability,
  adminUpdateOperationHours,
  adminSetOrderingPaused,
} from "./admin";

// ─── Secrets (stored in Firebase Secret Manager, never in source) ─────────────
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const stripeConnectedAccountId = defineSecret("STRIPE_CONNECTED_ACCOUNT_ID");

// ─── Firebase Admin (shared init — required for Gen 2 isolated function entry points) ─

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRENCY = "aud" as const;
const SERVICE_CHARGE_RATE = 0.05;
const SERVICE_CHARGE_CAP = 3.0;
// Standard Stripe Australia domestic card rate passed through to customer
const CARD_PROCESSING_RATE = 0.0175;
const CARD_PROCESSING_FIXED = 0.3;
const FUNCTION_REGION = "us-central1";
// Daily order numbers reset at midnight in the restaurant's local timezone
const RESTAURANT_TIMEZONE = "Australia/Perth";

// ─── Fee helpers ──────────────────────────────────────────────────────────────
function calcServiceFee(subtotal: number): number {
  return +Math.min(subtotal * SERVICE_CHARGE_RATE, SERVICE_CHARGE_CAP).toFixed(2);
}

function calcCardProcessingFee(base: number): number {
  return +(base * CARD_PROCESSING_RATE + CARD_PROCESSING_FIXED).toFixed(2);
}

function getStripe(): Stripe {
  return new Stripe(stripeSecretKey.value().trim());
}

function getConnectedAccountId(): string {
  return stripeConnectedAccountId.value().trim();
}

function rethrowStripeError(err: unknown): never {
  if (err instanceof Stripe.errors.StripeError) {
    console.error("Stripe error:", err.type, err.code ?? "none", err.message);
    throw new HttpsError(
      "failed-precondition",
      "Unable to process payment right now. Please try again."
    );
  }
  throw err;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartExtraInput {
  name: string;
}

interface CartItemInput {
  id: string;
  name: string;
  baseName?: string;
  qty: number;
  extras?: CartExtraInput[];
}

interface CreatePaymentIntentData {
  items: CartItemInput[];
  orderType: "pickup" | "dinein";
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes?: string;
  tableNumber?: string;
  pickupTime?: string;
}

interface ConfirmPaymentData {
  paymentIntentId: string;
  items: Array<{ id: string; name: string; price: number; qty: number }>;
  orderType: "pickup" | "dinein";
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes?: string;
  tableNumber?: string;
  pickupTime?: string;
}

type OrderItem = { id: string; name: string; price: number; qty: number };

const META_VALUE_MAX = 500;

function serializeItemsToMetadata(items: OrderItem[]): Record<string, string> {
  const json = JSON.stringify(items);
  if (json.length <= META_VALUE_MAX) {
    return { itemsJson: json };
  }
  const meta: Record<string, string> = {
    itemsJsonParts: String(Math.ceil(json.length / META_VALUE_MAX)),
  };
  for (let i = 0; i < json.length; i += META_VALUE_MAX) {
    meta[`itemsJson${Math.floor(i / META_VALUE_MAX)}`] = json.slice(
      i,
      i + META_VALUE_MAX
    );
  }
  return meta;
}

function parseItemsFromMetadata(meta: Stripe.Metadata): OrderItem[] {
  if (meta.itemsJson) {
    try {
      const parsed = JSON.parse(meta.itemsJson) as OrderItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  const parts = parseInt(meta.itemsJsonParts ?? "0", 10);
  if (parts <= 0) return [];
  let json = "";
  for (let i = 0; i < parts; i++) {
    json += meta[`itemsJson${i}`] ?? "";
  }
  try {
    const parsed = JSON.parse(json) as OrderItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getPerthDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: RESTAURANT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function findExistingOrderByPaymentIntent(
  paymentIntentId: string
): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  const direct = await getDb().collection("orders").doc(paymentIntentId).get();
  if (direct.exists) {
    return direct;
  }

  const legacySnap = await getDb()
    .collection("orders")
    .where("paymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get();

  return legacySnap.empty ? null : legacySnap.docs[0];
}

async function createPaidOrder(
  paymentIntentId: string,
  meta: Stripe.Metadata,
  items: OrderItem[],
  extra?: Record<string, unknown>
): Promise<{
  orderId: string;
  order: FirebaseFirestore.DocumentData;
  created: boolean;
}> {
  const orderRef = getDb().collection("orders").doc(paymentIntentId);

  return getDb().runTransaction(async (tx) => {
    const existing = await tx.get(orderRef);
    if (existing.exists) {
      return {
        orderId: orderRef.id,
        order: existing.data()!,
        created: false,
      };
    }

    const orderDay = getPerthDateKey();
    const counterRef = getDb().collection("orderCounters").doc(orderDay);
    const counterSnap = await tx.get(counterRef);
    const orderNumber =
      ((counterSnap.data()?.count as number | undefined) ?? 0) + 1;

    tx.set(
      counterRef,
      {
        count: orderNumber,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const orderDoc = {
      ...buildOrderDoc(meta, paymentIntentId, items, extra),
      orderNumber,
      orderDay,
    };
    tx.set(orderRef, orderDoc);

    return { orderId: orderRef.id, order: orderDoc, created: true };
  });
}

function buildOrderDoc(
  meta: Stripe.Metadata,
  paymentIntentId: string,
  items: OrderItem[],
  extra?: Record<string, unknown>
) {
  const now = Timestamp.now();
  return {
    customer: {
      name: meta.customerName ?? "",
      phone: meta.customerPhone ?? "",
      email: meta.customerEmail ?? "",
      notes: meta.customerNotes ?? "",
    },
    items,
    type: meta.orderType,
    pickupTime: meta.pickupTime || null,
    table: meta.tableNumber || null,
    subtotal: parseFloat(meta.subtotal ?? "0"),
    serviceFee: parseFloat(meta.serviceFee ?? "0"),
    cardProcessingFee: parseFloat(meta.cardProcessingFee ?? "0"),
    total: parseFloat(meta.total ?? "0"),
    currency: CURRENCY,
    paymentIntentId,
    paymentStatus: "paid",
    orderStatus: "pending",
    createdAt: now,
    paidAt: now,
    ...extra,
  };
}

// ─── getStripeConnectConfig ───────────────────────────────────────────────────
// Returns only the connected account ID so Stripe.js can initialise on the
// checkout page before a PaymentIntent exists. No secret keys are exposed.
export const getStripeConnectConfig = onCall(
  {
    region: FUNCTION_REGION,
    secrets: [stripeConnectedAccountId],
  },
  async () => ({
    connectedAccountId: getConnectedAccountId(),
  })
);

// ─── createPaymentIntent ──────────────────────────────────────────────────────
export const createPaymentIntent = onCall(
  {
    region: FUNCTION_REGION,
    secrets: [stripeSecretKey, stripeConnectedAccountId],
  },
  async (request) => {
    const data = request.data as CreatePaymentIntentData;

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new HttpsError("invalid-argument", "Cart cannot be empty.");
    }
    if (data.items.length > CHECKOUT_LIMITS.maxCartItems) {
      throw new HttpsError("invalid-argument", "Cart is too large.");
    }

    const customer = parseAndValidateCheckoutDetails({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      customerNotes: data.customerNotes,
      tableNumber: data.tableNumber,
      orderType: data.orderType,
      pickupTime: data.pickupTime,
    });

    await assertStoreIsOpen(getDb());
    await assertOrderingNotPaused(getDb());

    // Validate each item
    for (const item of data.items) {
      assertValidCartItemId(item.id);
      assertValidCartItemName(item.name);
      if (item.baseName) {
        assertValidCartItemName(item.baseName);
      }
      if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
        throw new HttpsError("invalid-argument", "Invalid item quantity.");
      }
      for (const extra of item.extras ?? []) {
        assertValidCartItemName(extra.name);
      }
    }

    // Fetch authoritative menu prices and availability from Firestore
    const [sectionsSnap, saucesSnap] = await Promise.all([
      getDb().collection("menuSections").get(),
      getDb().collection("sauces").get(),
    ]);

    const priceMap = new Map<string, number>();
    const availabilityMap = new Map<string, boolean>();
    sectionsSnap.forEach((doc) => {
      const section = doc.data();
      const availability = section.availability as Record<string, boolean> | undefined;
      if (Array.isArray(section.items)) {
        for (const item of section.items) {
          if (item.name) {
            const key = item.name.toLowerCase().trim();
            const price =
              typeof item.price === "number"
                ? item.price
                : parseFloat(item.price);
            if (!isNaN(price)) {
              priceMap.set(key, price);
            }
            availabilityMap.set(key, availability?.[item.name] !== false);
          }
        }
      }
    });

    const saucePriceMap = new Map<string, number>();
    const sauceAvailabilityMap = new Map<string, boolean>();
    saucesSnap.forEach((doc) => {
      const sauce = doc.data();
      if (typeof sauce.name === "string") {
        const key = sauce.name.toLowerCase().trim();
        const price =
          typeof sauce.price === "number"
            ? sauce.price
            : parseFloat(sauce.price ?? "0");
        saucePriceMap.set(key, isNaN(price) ? 0 : price);
        sauceAvailabilityMap.set(key, sauce.available !== false);
      }
    });

    // Verify every cart item exists in the menu and recalculate subtotal
    let subtotal = 0;
    const verifiedItems: Array<{ id: string; name: string; price: number; qty: number }> = [];
    for (const item of data.items) {
      const isSauce = item.id.startsWith("sauce-");
      const lookupKey = isSauce
        ? item.id.slice("sauce-".length).toLowerCase().trim()
        : item.name.toLowerCase().trim();

      if (isSauce) {
        if (!saucePriceMap.has(lookupKey)) {
          throw new HttpsError("invalid-argument", `Item not found in menu: "${item.name}". Please refresh and try again.`);
        }
        if (sauceAvailabilityMap.get(lookupKey) === false) {
          throw new HttpsError("invalid-argument", `"${item.name}" is currently sold out. Please refresh and try again.`);
        }
        const price = saucePriceMap.get(lookupKey) ?? 0;
        subtotal += price * item.qty;
        verifiedItems.push({ id: item.id, name: item.name, price, qty: item.qty });
        continue;
      }

      const baseName = (item.baseName ?? item.name).toLowerCase().trim();
      const basePrice = priceMap.get(baseName);
      if (basePrice === undefined) {
        throw new HttpsError("invalid-argument", `Item not found in menu: "${item.name}". Please refresh and try again.`);
      }
      if (availabilityMap.get(baseName) === false) {
        throw new HttpsError("invalid-argument", `"${item.baseName ?? item.name}" is currently sold out. Please refresh and try again.`);
      }

      let unitPrice = basePrice;
      for (const extra of item.extras ?? []) {
        const extraKey = extra.name.toLowerCase().trim();
        const extraPrice = priceMap.get(extraKey);
        if (extraPrice === undefined) {
          throw new HttpsError("invalid-argument", `Extra not found in menu: "${extra.name}". Please refresh and try again.`);
        }
        if (availabilityMap.get(extraKey) === false) {
          throw new HttpsError("invalid-argument", `"${extra.name}" is currently sold out. Please refresh and try again.`);
        }
        unitPrice += extraPrice;
      }
      unitPrice = +unitPrice.toFixed(2);

      subtotal += unitPrice * item.qty;
      verifiedItems.push({ id: item.id, name: item.name, price: unitPrice, qty: item.qty });
    }
    subtotal = +subtotal.toFixed(2);

    // Calculate fees server-side
    const serviceFee = calcServiceFee(subtotal);
    const cardProcessingFee = calcCardProcessingFee(subtotal + serviceFee);
    const total = +(subtotal + serviceFee + cardProcessingFee).toFixed(2);
    const amountCents = Math.round(total * 100);
    const serviceFeeCents = Math.round(serviceFee * 100);
    const stripe = getStripe();
    const connectedAccountId = getConnectedAccountId();

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency: CURRENCY,
          application_fee_amount: serviceFeeCents,
          metadata: {
            customerName: customer.customerName,
            customerPhone: customer.customerPhone,
            customerEmail: customer.customerEmail,
            customerNotes: customer.customerNotes,
            orderType: customer.orderType,
            tableNumber: customer.tableNumber,
            pickupTime: customer.pickupTime,
            subtotal: subtotal.toFixed(2),
            serviceFee: serviceFee.toFixed(2),
            cardProcessingFee: cardProcessingFee.toFixed(2),
            total: total.toFixed(2),
            ...serializeItemsToMetadata(verifiedItems),
          },
        },
        { stripeAccount: connectedAccountId }
      );
    } catch (err) {
      rethrowStripeError(err);
    }

    if (!paymentIntent.client_secret) {
      throw new HttpsError("internal", "PaymentIntent missing client secret.");
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      connectedAccountId,
      subtotal,
      serviceFee,
      cardProcessingFee,
      total,
    };
  }
);

// ─── confirmPayment ───────────────────────────────────────────────────────────
export const confirmPayment = onCall(
  {
    region: FUNCTION_REGION,
    secrets: [stripeSecretKey, stripeConnectedAccountId],
  },
  async (request) => {
    const data = request.data as ConfirmPaymentData;
    const paymentIntentId = assertValidPaymentIntentId(data.paymentIntentId);

    await assertStoreIsOpen(getDb());
    await assertOrderingNotPaused(getDb());

    const stripe = getStripe();

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        {},
        { stripeAccount: getConnectedAccountId() }
      );
    } catch (err) {
      if (err instanceof Stripe.errors.StripeError && err.code === "resource_missing") {
        throw new HttpsError("not-found", "PaymentIntent not found.");
      }
      rethrowStripeError(err);
    }

    // Reject if payment has not succeeded
    if (paymentIntent.status !== "succeeded") {
      throw new HttpsError(
        "failed-precondition",
        `Payment not confirmed. Current status: ${paymentIntent.status}`
      );
    }

    const meta = paymentIntent.metadata;
    const verifiedItems = parseItemsFromMetadata(meta);

    const existingDoc = await findExistingOrderByPaymentIntent(paymentIntentId);
    if (existingDoc) {
      const existing = existingDoc.data();
      if (existing) {
        const hasItems =
          Array.isArray(existing.items) && existing.items.length > 0;

        if (!hasItems && verifiedItems.length > 0) {
          await existingDoc.ref.update({
            items: verifiedItems,
            source: FieldValue.delete(),
          });
          const updated = (await existingDoc.ref.get()).data();
          return { orderId: existingDoc.id, order: updated };
        }

        return { orderId: existingDoc.id, order: existing };
      }
    }

    const { orderId, order } = await createPaidOrder(
      paymentIntentId,
      meta,
      verifiedItems
    );

    return { orderId, order };
  }
);

// ─── stripeWebhook ────────────────────────────────────────────────────────────
export const stripeWebhook = onRequest(
  {
    region: FUNCTION_REGION,
    secrets: [stripeSecretKey, stripeWebhookSecret],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const sig = req.headers["stripe-signature"] as string | undefined;
    if (!sig) {
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      // req.rawBody is the unparsed body buffer — required for signature verification
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value().trim()
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", msg);
      res.status(400).send(`Webhook verification failed: ${msg}`);
      return;
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case "payment_intent.payment_failed":
          await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        default:
          // Acknowledge unknown event types without processing them
          break;
      }
      res.status(200).json({ received: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook handler error:", msg);
      res.status(500).send("Internal webhook error");
    }
  }
);

// ─── Webhook handlers ─────────────────────────────────────────────────────────

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  const existingDoc = await findExistingOrderByPaymentIntent(pi.id);
  if (existingDoc) {
    return;
  }

  const meta = pi.metadata;
  const items = parseItemsFromMetadata(meta);

  // Only create a fallback order if we have enough metadata (including line items)
  if (!meta.customerName || !meta.orderType || !meta.total || items.length === 0) {
    console.warn(`Skipping webhook fallback order for PI ${pi.id}: insufficient metadata`);
    return;
  }

  await createPaidOrder(pi.id, meta, items, { source: "webhook_fallback" });
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  // Record the failure for internal visibility — no sensitive card data is logged
  await getDb().collection("failedPayments").add({
    paymentIntentId: pi.id,
    status: pi.status,
    failureCode: pi.last_payment_error?.code ?? null,
    failureMessage: pi.last_payment_error?.message ?? null,
    amount: pi.amount,
    currency: pi.currency,
    failedAt: Timestamp.now(),
  });
}
