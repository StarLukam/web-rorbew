import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "adicoran_admin";

function getSecret() {
  return process.env.ADMIN_SECRET || "adicoran-default-secret";
}

export function createAdminToken() {
  const secret = getSecret();
  const expires = Date.now() + 1000 * 60 * 60 * 6;
  return Buffer.from(`${expires}.${secret}`).toString("base64");
}

export function verifyAdminToken(token?: string) {
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [expires, secret] = decoded.split(".");

    if (!expires || !secret) return false;
    if (secret !== getSecret()) return false;
    if (Date.now() > Number(expires)) return false;

    return true;
  } catch {
    return false;
  }
}

export function createAdminCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 6,
  });

  return response;
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export function isAdminLoggedIn() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}

export function requireAdmin() {
  if (!isAdminLoggedIn()) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}
