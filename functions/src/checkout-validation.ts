import { HttpsError } from "firebase-functions/v2/https";

export type OrderType = "pickup" | "dinein";

export const CHECKOUT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  phoneDigits: 10,
  emailMax: 254,
  notesMax: 500,
  tableMax: 20,
  maxCartItems: 50,
} as const;

export type SanitizedCheckoutDetails = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes: string;
  tableNumber: string;
  orderType: OrderType;
  pickupTime: string;
};

const HTML_TAG_RE = /<[^>]*>/g;
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MULTI_SPACE_RE = / {2,}/g;

const NAME_RE = /^[\p{L}\p{M}'.\-\s]{2,80}$/u;
const EMAIL_RE =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const TABLE_RE = /^[A-Za-z0-9][A-Za-z0-9 \-]{0,19}$/;
const STRIPE_PI_RE = /^pi_[a-zA-Z0-9]{8,}$/;
const PICKUP_TIMES = new Set(["", "asap", "15", "30", "45", "60"]);
const CART_ITEM_ID_MAX = 240;
const CART_ITEM_NAME_MAX = 200;
const UNSAFE_CART_TEXT_RE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F<>{}\\]|<script|javascript:|data:/i;

function normalizeUnicode(value: string): string {
  return value.normalize("NFKC");
}

function stripControlChars(value: string, allowNewlines = false): string {
  if (allowNewlines) {
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  }
  return value.replace(CONTROL_RE, "");
}

function stripHtml(value: string): string {
  return value.replace(HTML_TAG_RE, "");
}

function collapseSpaces(value: string): string {
  return value.replace(MULTI_SPACE_RE, " ").trim();
}

function asTrimmedString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLen);
}

export function sanitizeName(raw: unknown): string {
  const value = asTrimmedString(raw, CHECKOUT_LIMITS.nameMax);
  return collapseSpaces(
    stripHtml(stripControlChars(normalizeUnicode(value))).replace(
      /[^\p{L}\p{M}'.\-\s]/gu,
      ""
    )
  );
}

export function sanitizePhone(raw: unknown): string {
  const value = asTrimmedString(raw, 24);
  return normalizePhoneDigits(normalizeUnicode(stripControlChars(value))).slice(
    0,
    CHECKOUT_LIMITS.phoneDigits
  );
}

function normalizePhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length >= 10) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.startsWith("610")) {
    digits = digits.slice(2);
  }
  return digits;
}

export function sanitizeEmail(raw: unknown): string {
  const value = asTrimmedString(raw, CHECKOUT_LIMITS.emailMax);
  return normalizeUnicode(stripControlChars(value))
    .replace(/[<>\s]/g, "")
    .toLowerCase();
}

export function sanitizeNotes(raw: unknown): string {
  const value = asTrimmedString(raw, CHECKOUT_LIMITS.notesMax);
  return stripHtml(stripControlChars(normalizeUnicode(value), true))
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, CHECKOUT_LIMITS.notesMax);
}

export function sanitizeTableNumber(raw: unknown): string {
  const value = asTrimmedString(raw, CHECKOUT_LIMITS.tableMax);
  return normalizeUnicode(stripControlChars(value))
    .replace(/[^A-Za-z0-9 \-]/g, "")
    .trim();
}

function sanitizePickupTime(raw: unknown): string {
  const value = asTrimmedString(raw, 10).toLowerCase();
  return PICKUP_TIMES.has(value) ? value : "";
}

function assertName(name: string): void {
  if (!name || name.length < CHECKOUT_LIMITS.nameMin || !NAME_RE.test(name)) {
    throw new HttpsError("invalid-argument", "Please enter a valid name.");
  }
}

function assertPhone(phone: string): void {
  if (!phone) {
    throw new HttpsError("invalid-argument", "Please enter a valid phone number.");
  }
  const digits = normalizePhoneDigits(phone);
  if (digits.length !== CHECKOUT_LIMITS.phoneDigits || !/^0\d{9}$/.test(digits)) {
    throw new HttpsError("invalid-argument", "Phone number must be 10 digits.");
  }
}

function assertEmail(email: string): void {
  if (!email) {
    throw new HttpsError("invalid-argument", "Email address is required.");
  }
  if (email.length > CHECKOUT_LIMITS.emailMax || !EMAIL_RE.test(email)) {
    throw new HttpsError("invalid-argument", "Please enter a valid email address.");
  }
}

function assertNotes(notes: string): void {
  if (!notes) return;
  if (notes.length > CHECKOUT_LIMITS.notesMax) {
    throw new HttpsError(
      "invalid-argument",
      `Notes must be ${CHECKOUT_LIMITS.notesMax} characters or fewer.`
    );
  }
  if (/<script|javascript:|data:/i.test(notes)) {
    throw new HttpsError("invalid-argument", "Notes contain invalid content.");
  }
}

function assertTable(table: string, orderType: OrderType): void {
  if (orderType !== "dinein") return;
  if (!table || !TABLE_RE.test(table)) {
    throw new HttpsError(
      "invalid-argument",
      "Please enter a valid table number for dine-in orders."
    );
  }
}

export function parseAndValidateCheckoutDetails(input: {
  customerName: unknown;
  customerPhone: unknown;
  customerEmail: unknown;
  customerNotes?: unknown;
  tableNumber?: unknown;
  orderType: unknown;
  pickupTime?: unknown;
}): SanitizedCheckoutDetails {
  const orderType: OrderType = input.orderType === "dinein" ? "dinein" : "pickup";
  if (input.orderType !== "pickup" && input.orderType !== "dinein") {
    throw new HttpsError("invalid-argument", "Invalid order type.");
  }

  const sanitized: SanitizedCheckoutDetails = {
    customerName: sanitizeName(input.customerName),
    customerPhone: sanitizePhone(input.customerPhone),
    customerEmail: sanitizeEmail(input.customerEmail),
    customerNotes: sanitizeNotes(input.customerNotes ?? ""),
    tableNumber: sanitizeTableNumber(input.tableNumber ?? ""),
    orderType,
    pickupTime: sanitizePickupTime(input.pickupTime),
  };

  assertName(sanitized.customerName);
  assertPhone(sanitized.customerPhone);
  assertEmail(sanitized.customerEmail);
  assertNotes(sanitized.customerNotes);
  assertTable(sanitized.tableNumber, sanitized.orderType);

  if (sanitized.pickupTime && !PICKUP_TIMES.has(sanitized.pickupTime)) {
    throw new HttpsError("invalid-argument", "Invalid pickup time.");
  }

  return sanitized;
}

export function assertValidPaymentIntentId(id: unknown): string {
  const value = typeof id === "string" ? id.trim() : "";
  if (!STRIPE_PI_RE.test(value)) {
    throw new HttpsError("invalid-argument", "Invalid payment reference.");
  }
  return value;
}

export function assertValidCartItemId(id: unknown): string {
  const value = typeof id === "string" ? id.trim() : "";
  if (!value || value.length > CART_ITEM_ID_MAX || UNSAFE_CART_TEXT_RE.test(value)) {
    throw new HttpsError("invalid-argument", "Invalid cart item.");
  }
  return value;
}

export function assertValidCartItemName(name: unknown): string {
  const value = typeof name === "string" ? stripHtml(stripControlChars(name)).trim() : "";
  if (!value || value.length > CART_ITEM_NAME_MAX || UNSAFE_CART_TEXT_RE.test(value)) {
    throw new HttpsError("invalid-argument", "Invalid cart item.");
  }
  return value;
}
