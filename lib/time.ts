import { HONG_KONG_TIMEZONE } from "@/lib/config";

const businessDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: HONG_KONG_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-HK", {
  timeZone: HONG_KONG_TIMEZONE,
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

export function getBusinessDate(date = new Date()): string {
  return businessDateFormatter.format(date);
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not yet updated";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatBusinessDate(dateString: string | null): string {
  if (!dateString) {
    return "Not set";
  }

  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-HK", {
    timeZone: HONG_KONG_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

export function compareBusinessDates(left: string, right: string): number {
  return left.localeCompare(right);
}

export function listDatesInclusive(start: string, end: string): string[] {
  if (compareBusinessDates(start, end) > 0) {
    return [];
  }

  const values: string[] = [];
  let current = start;

  while (compareBusinessDates(current, end) <= 0) {
    values.push(current);
    current = addDays(current, 1);
  }

  return values;
}
