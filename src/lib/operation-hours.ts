import { doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import {
  DEFAULT_OPERATION_HOURS,
  type DayKey,
  type DaySchedule,
  type OperationHours,
} from "./operation-hours-data";

export const STORE_SETTINGS_COLLECTION = "storeSettings";
export const OPERATION_HOURS_DOC = "operationHours";

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

export function normalizeOperationHours(raw: unknown): OperationHours {
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

export async function fetchOperationHours(): Promise<OperationHours> {
  if (!isFirebaseConfigured) return DEFAULT_OPERATION_HOURS;

  const snap = await getDoc(doc(db, STORE_SETTINGS_COLLECTION, OPERATION_HOURS_DOC));
  if (!snap.exists()) return DEFAULT_OPERATION_HOURS;
  return normalizeOperationHours(snap.data());
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

function formatTimeLabel(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatDaySchedule(schedule: DaySchedule): string {
  if (schedule.closed) return "Closed";
  if (!schedule.open || !schedule.close) return "Closed";
  return `${formatTimeLabel(schedule.open)} – ${formatTimeLabel(schedule.close)}`;
}

export function getDaySchedule(
  hours: OperationHours,
  date = new Date(),
): DaySchedule | null {
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

export function getStoreClosedMessage(hours: OperationHours, date = new Date()): string {
  const schedule = getDaySchedule(hours, date);
  if (!schedule) return STORE_CLOSED_ERROR;
  if (schedule.closed) {
    return "We are closed today and not accepting orders.";
  }
  return `We are currently closed. Today's hours: ${formatDaySchedule(schedule)}.`;
}

export function isStoreClosedMessage(message: string): boolean {
  return /only accepted during opening hours|currently closed|closed today/i.test(message);
}
