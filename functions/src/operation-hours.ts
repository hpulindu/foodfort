import { HttpsError } from "firebase-functions/v2/https";

export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DaySchedule = {
  day: DayKey;
  closed: boolean;
  open?: string;
  close?: string;
};

export type OperationHours = {
  timezone: string;
  days: DaySchedule[];
};

export const STORE_SETTINGS_COLLECTION = "storeSettings";
export const OPERATION_HOURS_DOC = "operationHours";
export const RESTAURANT_TIMEZONE = "Australia/Perth";

export const STORE_CLOSED_ERROR =
  "Orders are only accepted during opening hours. Please try again when we are open.";

const DAY_KEYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const DEFAULT_OPERATION_HOURS: OperationHours = {
  timezone: RESTAURANT_TIMEZONE,
  days: [
    { day: "monday", closed: true },
    { day: "tuesday", closed: false, open: "15:00", close: "21:00" },
    { day: "wednesday", closed: false, open: "11:00", close: "21:00" },
    { day: "thursday", closed: false, open: "11:00", close: "21:00" },
    { day: "friday", closed: false, open: "11:00", close: "21:00" },
    { day: "saturday", closed: false, open: "11:00", close: "21:00" },
    { day: "sunday", closed: false, open: "11:00", close: "21:00" },
  ],
};

function isDayKey(value: unknown): value is DayKey {
  return typeof value === "string" && DAY_KEYS.includes(value as DayKey);
}

function normalizeDaySchedule(raw: unknown): DaySchedule | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isDayKey(r.day)) return null;

  const closed = r.closed === true;
  if (closed) {
    return { day: r.day, closed: true };
  }

  const open = typeof r.open === "string" ? r.open : "";
  const close = typeof r.close === "string" ? r.close : "";
  if (!TIME_RE.test(open) || !TIME_RE.test(close)) return null;

  return { day: r.day, closed: false, open, close };
}

function normalizeOperationHours(raw: unknown): OperationHours {
  if (!raw || typeof raw !== "object") return DEFAULT_OPERATION_HOURS;
  const r = raw as Record<string, unknown>;
  const timezone =
    typeof r.timezone === "string" && r.timezone.trim()
      ? r.timezone.trim()
      : DEFAULT_OPERATION_HOURS.timezone;

  const days = Array.isArray(r.days)
    ? r.days.map(normalizeDaySchedule).filter((d): d is DaySchedule => d !== null)
    : [];

  if (days.length === 0) return DEFAULT_OPERATION_HOURS;

  const byDay = new Map(days.map((d) => [d.day, d]));
  const mergedDays = DAY_KEYS.map(
    (day) => byDay.get(day) ?? DEFAULT_OPERATION_HOURS.days.find((d) => d.day === day)!,
  );

  return { timezone, days: mergedDays };
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getLocalParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value.toLowerCase() ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return {
    day: weekday as DayKey,
    time: `${hour}:${minute}`,
  };
}

function getDaySchedule(hours: OperationHours, date = new Date()): DaySchedule | null {
  const { day } = getLocalParts(date, hours.timezone);
  return hours.days.find((d) => d.day === day) ?? null;
}

export function isStoreOpen(hours: OperationHours, date = new Date()): boolean {
  const schedule = getDaySchedule(hours, date);
  if (!schedule || schedule.closed || !schedule.open || !schedule.close) {
    return false;
  }

  const { time } = getLocalParts(date, hours.timezone);
  const current = parseTimeToMinutes(time);
  const open = parseTimeToMinutes(schedule.open);
  const close = parseTimeToMinutes(schedule.close);
  return current >= open && current < close;
}

export async function fetchOperationHours(
  db: FirebaseFirestore.Firestore,
): Promise<OperationHours> {
  const snap = await db
    .collection(STORE_SETTINGS_COLLECTION)
    .doc(OPERATION_HOURS_DOC)
    .get();

  if (!snap.exists) return DEFAULT_OPERATION_HOURS;
  return normalizeOperationHours(snap.data());
}

export async function assertStoreIsOpen(
  db: FirebaseFirestore.Firestore,
  date = new Date(),
): Promise<void> {
  const hours = await fetchOperationHours(db);
  if (!isStoreOpen(hours, date)) {
    throw new HttpsError("failed-precondition", STORE_CLOSED_ERROR);
  }
}
