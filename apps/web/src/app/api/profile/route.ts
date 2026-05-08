import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, type User } from "@vroom/db/schema";
import { eq } from "drizzle-orm";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const rows = (await (db as any)
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)) as User[];

    const user = rows[0];
    if (!user) {
      return errorResponse(new ApiError(404, "NOT_FOUND", "User not found"));
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const body = await request.json();
    const allowedFields: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      allowedFields.name = body.name.trim();
    }
    if (typeof body.phone === "string") {
      allowedFields.phone = body.phone.trim() || null;
    }
    if (typeof body.avatarUrl === "string") {
      allowedFields.avatarUrl = body.avatarUrl.trim() || null;
    }

    if (Object.keys(allowedFields).length === 0) {
      return errorResponse(
        new ApiError(400, "BAD_REQUEST", "No valid fields to update")
      );
    }

    (allowedFields as any).updatedAt = new Date();

    const updated = (await (db as any)
      .update(users)
      .set(allowedFields)
      .where(eq(users.id, session.user.id))
      .returning()) as User[];

    const user = updated[0]!;
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
