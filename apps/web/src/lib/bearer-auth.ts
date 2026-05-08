import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

export interface BearerUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function bearerAuth(request: NextRequest): Promise<BearerUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || !payload.email) return null;
    return {
      id: payload.sub,
      email: payload.email as string,
      name: (payload.name as string) ?? "",
      role: (payload.role as string) ?? "renter",
    };
  } catch {
    return null;
  }
}
