import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, type User } from "@vroom/db/schema";
import { asc } from "drizzle-orm";
import { ApiError, errorResponse } from "@/lib/api-error";
import { trustScoreService } from "@/services/trust-score";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Admin access required"));
  }

  try {
    const rows = (await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        trustScore: users.trustScore,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.trustScore))
      .limit(200)) as Pick<
      User,
      "id" | "name" | "email" | "role" | "status" | "trustScore" | "createdAt"
    >[];

    return NextResponse.json({ users: rows });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return errorResponse(new ApiError(403, "FORBIDDEN", "Admin access required"));
  }

  try {
    const body = await request.json();
    const userId = body?.userId;

    if (!userId || typeof userId !== "string") {
      return errorResponse(
        new ApiError(400, "BAD_REQUEST", "userId is required")
      );
    }

    const newScore = await trustScoreService.recalculateScore(userId);

    return NextResponse.json({ userId, trustScore: newScore });
  } catch (error) {
    return errorResponse(error);
  }
}
