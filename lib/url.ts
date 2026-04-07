export function appendMessage(
  path: string,
  kind: "message" | "error",
  value: string
): string {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(kind, value);
  return `${url.pathname}${url.search}`;
}

export function sanitizeReturnTo(
  raw: FormDataEntryValue | null,
  fallback: string
): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) {
    return fallback;
  }

  return raw;
}
