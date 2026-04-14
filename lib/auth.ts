import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

/**
 * Simple password-based auth for Maestro.
 *
 * - First run: no password set → user creates one via /api/auth/setup
 * - Subsequent: user logs in with password → receives session token
 * - Local requests (localhost) bypass auth
 * - Password stored as SHA-256 hash in ~/.maestro/auth.json
 */

const AUTH_PATH = path.join(process.env.HOME || "/tmp", ".maestro", "auth.json");

interface AuthConfig {
  passwordHash: string | null;  // null = not set yet
  createdAt: number;
  allowLocalBypass: boolean;
}

function loadAuth(): AuthConfig {
  if (existsSync(AUTH_PATH)) {
    try {
      return JSON.parse(readFileSync(AUTH_PATH, "utf-8"));
    } catch { /* recreate */ }
  }
  return { passwordHash: null, createdAt: Date.now(), allowLocalBypass: true };
}

function saveAuth(config: AuthConfig) {
  mkdirSync(path.dirname(AUTH_PATH), { recursive: true });
  writeFileSync(AUTH_PATH, JSON.stringify(config, null, 2));
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// Active sessions (token -> expiry)
const sessions = new Map<string, number>();
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateSessionToken(): string {
  return createHash("sha256").update(Math.random().toString() + Date.now().toString()).digest("hex").substring(0, 48);
}

/**
 * Check if password has been set
 */
export function isPasswordSet(): boolean {
  const config = loadAuth();
  return config.passwordHash !== null;
}

/**
 * Set password (first time setup)
 */
export function setPassword(password: string): string {
  const config = loadAuth();
  config.passwordHash = hashPassword(password);
  config.createdAt = Date.now();
  saveAuth(config);

  const token = generateSessionToken();
  sessions.set(token, Date.now() + SESSION_DURATION);
  return token;
}

/**
 * Verify password and return session token
 */
export function verifyPassword(password: string): string | null {
  const config = loadAuth();
  if (!config.passwordHash) return null;
  if (hashPassword(password) !== config.passwordHash) return null;

  const token = generateSessionToken();
  sessions.set(token, Date.now() + SESSION_DURATION);
  return token;
}

/**
 * Check if a request is authenticated
 */
export function isAuthenticated(req: NextRequest): boolean {
  // Local bypass
  const config = loadAuth();
  if (config.allowLocalBypass) {
    const host = req.headers.get("host") || "";
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
      return true;
    }
  }

  // Check session token in Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const expiry = sessions.get(token);
    if (expiry && expiry > Date.now()) return true;
    if (expiry) sessions.delete(token); // expired
  }

  // Check cookie
  const cookieToken = req.cookies.get("maestro-session")?.value;
  if (cookieToken) {
    const expiry = sessions.get(cookieToken);
    if (expiry && expiry > Date.now()) return true;
  }

  return false;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
