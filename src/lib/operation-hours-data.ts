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

export const RESTAURANT_TIMEZONE = "Australia/Perth";

/** Default schedule — matches the public site hours but is not coupled to them. */
export const DEFAULT_OPERATION_HOURS: OperationHours = {
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
