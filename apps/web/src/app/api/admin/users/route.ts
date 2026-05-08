import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, type User } from "@vroom/db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Admin access required"));
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role") ?? "";

  try {
    let query = (db as any).select().from(users);

    if (search) {
      query = query.where(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    if (role) {
      query = query.where(eq(users.role, role));
    }

    const rows = (await query.orderBy(desc(users.createdAt)).limit(100)) as User[];

    return NextResponse.json({
      users: rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Admin access required"));
  }

  try {
    const body = await request.json();
    const { userId, role, status } = body;

    if (!userId) {
      return errorResponse(new ApiError(400, "BAD_REQUEST", "userId required"));
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (role && ["renter", "host", "admin"].includes(role)) {
      updates.role = role;
    }
    if (status && ["active", "suspended", "banned"].includes(status)) {
      updates.status = status;
    }

    if (Object.keys(updates).length <= 1) {
      return errorResponse(
        new ApiError(400, "BAD_REQUEST", "No valid fields to update")
      );
    }

    const updated = (await (db as any)
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning()) as User[];

    return NextResponse.json(updated[0]);
  } catch (error) {
    return errorResponse(error);
  }
}
