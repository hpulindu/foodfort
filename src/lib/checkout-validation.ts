export type OrderType = "pickup" | "dinein";

export const CHECKOUT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  phoneDigits: 10,
  emailMax: 254,
  notesMax: 500,
  tableMax: 20,
} as const;

export type CheckoutField = "name" | "phone" | "email" | "notes" | "tableNo";
export type CheckoutFieldErrors = Partial<Record<CheckoutField, string>>;

export type SanitizedCheckoutDetails = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes: string;
  tableNumber: string;
  orderType: OrderType;
};

const HTML_TAG_RE = /<[^>]*>/g;
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MULTI_SPACE_RE = / {2,}/g;

const NAME_RE = /^[\p{L}\p{M}'.\-\s]{2,80}$/u;
const EMAIL_RE =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const TABLE_RE = /^[A-Za-z0-9][A-Za-z0-9 \-]{0,19}$/;
const STRIPE_PI_RE = /^pi_[a-zA-Z0-9]{8,}$/;

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

/** Remove characters that should never appear in a name field. */
export function filterNameInput(raw: string): string {
  return normalizeUnicode(stripHtml(stripControlChars(raw)))
    .replace(/[^\p{L}\p{M}'.\-\s]/gu, "")
    .slice(0, CHECKOUT_LIMITS.nameMax);
}

/** Keep only digits while typing; Australian numbers are 10 digits. */
export function filterPhoneInput(raw: string): string {
  return normalizeUnicode(stripControlChars(raw))
    .replace(/\D/g, "")
    .slice(0, CHECKOUT_LIMITS.phoneDigits);
}

/** Strip unsafe characters from email input. */
export function filterEmailInput(raw: string): string {
  return normalizeUnicode(stripControlChars(raw))
    .replace(/[<>\s]/g, "")
    .slice(0, CHECKOUT_LIMITS.emailMax);
}

/** Strip HTML/control chars from notes; preserve single newlines. */
export function filterNotesInput(raw: string): string {
  return stripHtml(stripControlChars(raw, true))
    .replace(/\r\n/g, "\n")
    .slice(0, CHECKOUT_LIMITS.notesMax);
}

/** Alphanumeric table identifiers only. */
export function filterTableInput(raw: string): string {
  return normalizeUnicode(stripControlChars(raw))
    .replace(/[^A-Za-z0-9 \-]/g, "")
    .slice(0, CHECKOUT_LIMITS.tableMax);
}

export function sanitizeName(raw: string): string {
  return collapseSpaces(filterNameInput(raw));
}

export function sanitizePhone(raw: string): string {
  return normalizePhoneDigits(raw).slice(0, CHECKOUT_LIMITS.phoneDigits);
}

export function normalizePhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length >= 10) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.startsWith("610")) {
    digits = digits.slice(2);
  }
  return digits;
}

export function sanitizeEmail(raw: string): string {
  return filterEmailInput(raw).toLowerCase();
}

export function sanitizeNotes(raw: string): string {
  return stripHtml(stripControlChars(raw, true))
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, CHECKOUT_LIMITS.notesMax);
}

export function sanitizeTableNumber(raw: string): string {
  return filterTableInput(raw).trim();
}

function validateName(name: string): string | undefined {
  if (!name) return "Full name is required.";
  if (name.length < CHECKOUT_LIMITS.nameMin) {
    return `Name must be at least ${CHECKOUT_LIMITS.nameMin} characters.`;
  }
  if (!NAME_RE.test(name)) return "Please enter a valid name.";
  return undefined;
}

function validatePhone(phone: string): string | undefined {
  if (!phone) return "Phone number is required.";

  const digits = normalizePhoneDigits(phone);
  if (digits.length !== CHECKOUT_LIMITS.phoneDigits) {
    return "Phone number must be 10 digits.";
  }
  if (!/^0\d{9}$/.test(digits)) {
    return "Please enter a valid Australian phone number.";
  }
  return undefined;
}

function validateEmail(email: string): string | undefined {
  if (!email) return "Email address is required.";
  if (email.length > CHECKOUT_LIMITS.emailMax) return "Email address is too long.";
  if (!EMAIL_RE.test(email)) return "Please enter a valid email address.";
  return undefined;
}

function validateNotes(notes: string): string | undefined {
  if (!notes) return undefined;
  if (notes.length > CHECKOUT_LIMITS.notesMax) {
    return `Notes must be ${CHECKOUT_LIMITS.notesMax} characters or fewer.`;
  }
  if (/<script|javascript:|data:/i.test(notes)) {
    return "Notes contain invalid content.";
  }
  return undefined;
}

function validateTable(table: string, orderType: OrderType): string | undefined {
  if (orderType !== "dinein") return undefined;
  if (!table) return "Table number is required for dine-in orders.";
  if (!TABLE_RE.test(table)) return "Please enter a valid table number.";
  return undefined;
}

export function validateCheckoutDetails(input: {
  name: string;
  phone: string;
  email: string;
  notes: string;
  tableNo: string;
  orderType: OrderType;
}):
  | { ok: true; sanitized: SanitizedCheckoutDetails; errors: CheckoutFieldErrors }
  | { ok: false; sanitized: SanitizedCheckoutDetails; errors: CheckoutFieldErrors } {
  const sanitized: SanitizedCheckoutDetails = {
    customerName: sanitizeName(input.name),
    customerPhone: sanitizePhone(input.phone),
    customerEmail: sanitizeEmail(input.email),
    customerNotes: sanitizeNotes(input.notes),
    tableNumber: sanitizeTableNumber(input.tableNo),
    orderType: input.orderType === "dinein" ? "dinein" : "pickup",
  };

  const errors: CheckoutFieldErrors = {};

  const nameError = validateName(sanitized.customerName);
  if (nameError) errors.name = nameError;

  const phoneError = validatePhone(sanitized.customerPhone);
  if (phoneError) errors.phone = phoneError;

  const emailError = validateEmail(sanitized.customerEmail);
  if (emailError) errors.email = emailError;

  const notesError = validateNotes(sanitized.customerNotes);
  if (notesError) errors.notes = notesError;

  const tableError = validateTable(sanitized.tableNumber, sanitized.orderType);
  if (tableError) errors.tableNo = tableError;

  if (Object.keys(errors).length > 0) {
    return { ok: false, sanitized, errors };
  }

  return { ok: true, sanitized, errors };
}

export function isValidPaymentIntentId(id: string): boolean {
  return STRIPE_PI_RE.test(id.trim());
}
