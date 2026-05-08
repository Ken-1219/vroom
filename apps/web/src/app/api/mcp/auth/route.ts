import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const DEMO_ACCOUNTS: Record<string, { id: string; name: string; role: string; password: string }> = {
  "renter@demo.vroom.app": { id: "d0000000-0000-4000-8000-000000000001", name: "Arjun Mehta", role: "renter", password: "demo123" },
  "host@demo.vroom.app": { id: "d0000000-0000-4000-8000-000000000002", name: "Priya Sharma", role: "host", password: "demo123" },
  "admin@demo.vroom.app": { id: "d0000000-0000-4000-8000-000000000003", name: "Admin User", role: "admin", password: "demo123" },
  "fleet@demo.vroom.app": { id: "d0000000-0000-4000-8000-000000000004", name: "Fleet Manager", role: "host", password: "demo123" },
  "renter.us@demo.vroom.app": { id: "d0000000-0000-4000-8000-000000000005", name: "Mike Johnson", role: "renter", password: "demo123" },
  "renter.eu@demo.vroom.app": { id: "d0000000-0000-4000-8000-000000000006", name: "Emma Williams", role: "renter", password: "demo123" },
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const account = DEMO_ACCOUNTS[email as string];
    if (!account || account.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const token = await new SignJWT({
      email: email as string,
      name: account.name,
      role: account.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(account.id)
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    return NextResponse.json({
      token,
      expiresIn: "30d",
      user: { id: account.id, email, name: account.name, role: account.role },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
