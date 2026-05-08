import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface PromoCode {
  code: string;
  type: "percent" | "flat";
  value: number; // percent (0-100) or flat amount in paise
  minOrderPaise: number;
  maxDiscountPaise: number | null;
  description: string;
  validUntil: string; // ISO date
}

const PROMO_CODES: PromoCode[] = [
  {
    code: "VROOM10",
    type: "percent",
    value: 10,
    minOrderPaise: 50000,
    maxDiscountPaise: 50000,
    description: "10% off (up to ₹500)",
    validUntil: "2026-12-31",
  },
  {
    code: "FIRST200",
    type: "flat",
    value: 20000,
    minOrderPaise: 100000,
    maxDiscountPaise: null,
    description: "₹200 off your first booking",
    validUntil: "2026-12-31",
  },
  {
    code: "WEEKEND15",
    type: "percent",
    value: 15,
    minOrderPaise: 150000,
    maxDiscountPaise: 75000,
    description: "15% off weekend trips (up to ₹750)",
    validUntil: "2026-12-31",
  },
  {
    code: "VROOM500",
    type: "flat",
    value: 50000,
    minOrderPaise: 300000,
    maxDiscountPaise: null,
    description: "₹500 off bookings over ₹3,000",
    validUntil: "2026-12-31",
  },
];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, subtotalPaise } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Promo code is required" }, { status: 400 });
  }

  const promo = PROMO_CODES.find((p) => p.code === code.toUpperCase().trim());

  if (!promo) {
    return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
  }

  if (new Date(promo.validUntil) < new Date()) {
    return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
  }

  if (subtotalPaise < promo.minOrderPaise) {
    const minFormatted = `₹${(promo.minOrderPaise / 100).toLocaleString("en-IN")}`;
    return NextResponse.json(
      { error: `Minimum order of ${minFormatted} required for this code` },
      { status: 400 }
    );
  }

  let discountPaise: number;
  if (promo.type === "percent") {
    discountPaise = Math.round((subtotalPaise * promo.value) / 100);
    if (promo.maxDiscountPaise !== null) {
      discountPaise = Math.min(discountPaise, promo.maxDiscountPaise);
    }
  } else {
    discountPaise = promo.value;
  }

  discountPaise = Math.min(discountPaise, subtotalPaise);

  return NextResponse.json({
    code: promo.code,
    description: promo.description,
    discountPaise,
    discountFormatted: `₹${(discountPaise / 100).toLocaleString("en-IN")}`,
  });
}
