import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { getRequiredEnv, SESSION_DURATION_MS } from "@/lib/config";
import { SessionPayload, UserRole } from "@/lib/types";

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecretBuffer(): Buffer {
  return Buffer.from(getRequiredEnv("SESSION_SECRET"), "utf8");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, storedDigest] = storedHash.split(":");

  if (!salt || !storedDigest) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const reference = Buffer.from(storedDigest, "hex");

  if (candidate.length !== reference.length) {
    return false;
  }

  return timingSafeEqual(candidate, reference);
}

export function createSignedSession(params: {
  userId: string;
  username: string;
  role: UserRole;
  displayName: string;
}): string {
  const payload: SessionPayload = {
    ...params,
    expiresAt: Date.now() + SESSION_DURATION_MS
  };

  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", getSessionSecretBuffer())
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function parseSignedSession(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSecretBuffer())
    .update(body)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;

  if (!payload.expiresAt || payload.expiresAt <= Date.now()) {
    return null;
  }

  return payload;
}
