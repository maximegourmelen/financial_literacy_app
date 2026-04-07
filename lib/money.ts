export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === "number" ? value : Number(value);
}

export function roundToScale(value: number, scale = 4): number {
  const factor = 10 ** scale;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatMoney(value: number, currency = "HKD"): string {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatUnits(value: number, maximumFractionDigits = 6): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits
  }).format(value);
}

export function parsePositiveAmount(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string") {
    return null;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return roundToScale(value, 4);
}

export function percentFromFraction(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${(value * 100).toFixed(2)}%`;
}
