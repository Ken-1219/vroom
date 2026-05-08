import { NextResponse } from "next/server";
import { vehicleService } from "@/services/vehicle";

export async function GET() {
  try {
    const cities = await vehicleService.getCities();
    return NextResponse.json(cities);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
