import { NextRequest, NextResponse } from "next/server";
import { isPasswordSet, setPassword, verifyPassword, isAuthenticated } from "@/lib/auth";

// GET: check auth status
export async function GET(req: NextRequest) {
  return NextResponse.json({
    authenticated: isAuthenticated(req),
    passwordSet: isPasswordSet(),
  });
}

// POST: login or setup
export async function POST(req: NextRequest) {
  try {
    const { password, action } = await req.json();

    if (!password || password.length < 4) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 4 caracteres" }, { status: 400 });
    }

    if (action === "setup") {
      if (isPasswordSet()) {
        return NextResponse.json({ error: "Senha ja definida. Use login." }, { status: 400 });
      }
      const token = setPassword(password);
      const res = NextResponse.json({ ok: true, token });
      res.cookies.set("maestro-session", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60, sameSite: "lax" });
      return res;
    }

    // Login
    const token = verifyPassword(password);
    if (!token) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, token });
    res.cookies.set("maestro-session", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60, sameSite: "lax" });
    return res;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
