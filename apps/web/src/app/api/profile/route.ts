import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, type User } from "@vroom/db/schema";
import { eq } from "drizzle-orm";
import { ApiError, errorResponse } from "@/lib/api-error";
import { updateProfileSchema } from "@vroom/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }

  try {
    const rows = (await db
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
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const allowedFields: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) allowedFields.name = parsed.data.name.trim();
    if (parsed.data.phone !== undefined) allowedFields.phone = parsed.data.phone.trim() || null;
    if (parsed.data.avatarUrl !== undefined) allowedFields.avatarUrl = parsed.data.avatarUrl.trim() || null;

    if (Object.keys(allowedFields).length === 0) {
      return errorResponse(
        new ApiError(400, "BAD_REQUEST", "No valid fields to update")
      );
    }

    allowedFields.updatedAt = new Date();

    const updated = (await db
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
