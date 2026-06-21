import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { CartItem } from "./cart";

export type OrderType = "pickup" | "dinein";

export function formatOrderNumber(
  orderNumber?: number,
  fallbackId?: string
): string {
  if (orderNumber != null && orderNumber > 0) {
    return String(orderNumber).padStart(3, "0");
  }
  return fallbackId?.slice(-8) ?? "---";
}

export type Order = {
  id: string;
  orderNumber?: number;
  orderDay?: string;
  type: OrderType;
  pickupTime: string | null;
  table: string | null;
  customer: { name: string; phone: string; email: string; notes: string };
  items: CartItem[];
  subtotal: number;
  serviceFee: number;
  cardProcessingFee: number;
  total: number;
  currency: string;
  paymentIntentId: string;
  paymentStatus: "paid";
  orderStatus: "pending";
};

export interface StripeConnectConfig {
  connectedAccountId: string;
}

export async function getStripeConnectConfig(): Promise<StripeConnectConfig> {
  const fn = httpsCallable<void, StripeConnectConfig>(functions, "getStripeConnectConfig");
  const result = await fn();
  return result.data;
}

// ── createPaymentIntent ────────────────────────────────────────────────────────
// Sends cart and customer details to the backend. The backend validates prices
// against Firestore, calculates all fees, creates a Stripe PaymentIntent on the
// connected account, and returns the clientSecret needed by Stripe.js.
// The connected account ID is returned here so Stripe.js can use it — it is
// never a secret key.

export interface PaymentModifierInput {
  name: string;
}

export interface CreatePaymentIntentRequest {
  items: Array<{
    id: string;
    name: string;
    baseName?: string;
    qty: number;
    extras?: PaymentModifierInput[];
    variant?: PaymentModifierInput;
    sauces?: PaymentModifierInput[];
  }>;
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes?: string;
  tableNumber?: string;
  pickupTime?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  connectedAccountId: string;
  subtotal: number;
  serviceFee: number;
  cardProcessingFee: number;
  total: number;
}

export async function createPaymentIntent(
  data: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> {
  const fn = httpsCallable<CreatePaymentIntentRequest, CreatePaymentIntentResponse>(
    functions,
    "createPaymentIntent"
  );
  const result = await fn(data);
  return result.data;
}

// ── confirmPayment ─────────────────────────────────────────────────────────────
// After Stripe.js confirms the card payment, call this to have the backend
// verify the PaymentIntent status with Stripe and create the order in Firestore.
// Returns the created order so the frontend can display a confirmation.

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  items: CartItem[];
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes?: string;
  tableNumber?: string;
  pickupTime?: string;
}

export interface ConfirmPaymentResponse {
  orderId: string;
  order: Order;
}

export async function confirmPayment(
  data: ConfirmPaymentRequest
): Promise<ConfirmPaymentResponse> {
  const fn = httpsCallable<ConfirmPaymentRequest, ConfirmPaymentResponse>(
    functions,
    "confirmPayment"
  );
  const result = await fn(data);
  return result.data;
}
