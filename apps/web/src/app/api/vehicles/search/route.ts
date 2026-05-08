import { NextRequest, NextResponse } from "next/server";
import { vehicleSearchSchema } from "@vroom/validators";
import { vehicleService } from "@/services/vehicle";
import { errorResponse } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);

    const parsed = vehicleSearchSchema.safeParse(searchParams);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }

    const results = await vehicleService.search(parsed.data);
    return NextResponse.json(results);
  } catch (error) {
    return errorResponse(error);
  }
}
