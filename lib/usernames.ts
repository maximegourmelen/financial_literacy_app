export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,31}$/.test(username);
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@family-savings.local`;
}

export function isStrongEnoughPassword(password: string): boolean {
  return password.length >= 8;
}
