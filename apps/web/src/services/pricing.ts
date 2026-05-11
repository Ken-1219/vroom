import type { Vehicle } from "@vroom/db/schema";

export interface PriceEstimateInput {
  vehicle: Vehicle;
  startDate: Date;
  endDate: Date;
  protectionPlan?: "basic" | "standard" | "premium";
}

export interface PriceBreakdown {
  days: number;
  weekdays: number;
  weekendDays: number;
  baseRate: number;
  weekdayTotal: number;
  weekendTotal: number;
  subtotal: number;
  weeklyDiscount: number;
  monthlyDiscount: number;
  protectionFee: number;
  protectionPlan: string;
  platformFee: number;
  tax: number;
  total: number;
  currency: string;
  perDayEffective: number;
}

const PROTECTION_PLANS = {
  basic: { label: "Basic", rate: 0, description: "Liability only, ₹10,000 deductible" },
  standard: { label: "Standard", rate: 0.08, description: "Comprehensive, ₹3,000 deductible" },
  premium: { label: "Premium", rate: 0.15, description: "Zero deductible, roadside assist" },
};

export const CANCELLATION_TIERS = [
  { minHours: 48, label: "More than 48 hours", refundPct: 100, fee: "Free" },
  { minHours: 24, label: "24 - 48 hours", refundPct: 75, fee: "25% fee" },
  { minHours: 6, label: "6 - 24 hours", refundPct: 50, fee: "50% fee" },
  { minHours: 0, label: "Less than 6 hours", refundPct: 0, fee: "No refund" },
];

export class PricingService {
  calculateEstimate(input: PriceEstimateInput): PriceBreakdown {
    const { vehicle, startDate, endDate, protectionPlan = "basic" } = input;

    const diffMs = endDate.getTime() - startDate.getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    let weekendDays = 0;
    const cursor = new Date(startDate);
    for (let i = 0; i < days; i++) {
      const dow = cursor.getDay();
      if (dow === 0 || dow === 6) weekendDays++;
      cursor.setDate(cursor.getDate() + 1);
    }
    const weekdays = days - weekendDays;

    const dailyRate = vehicle.baseDailyRate;
    const weekendRate = vehicle.weekendRate ?? dailyRate;

    const weekdayTotal = weekdays * dailyRate;
    const weekendTotal = weekendDays * weekendRate;
    let subtotal = weekdayTotal + weekendTotal;

    let weeklyDiscount = 0;
    let monthlyDiscount = 0;

    if (days >= 30 && (vehicle.monthlyDiscountPct ?? 0) > 0) {
      monthlyDiscount = Math.round(subtotal * (vehicle.monthlyDiscountPct! / 100));
      subtotal -= monthlyDiscount;
    } else if (days >= 7 && (vehicle.weeklyDiscountPct ?? 0) > 0) {
      weeklyDiscount = Math.round(subtotal * (vehicle.weeklyDiscountPct! / 100));
      subtotal -= weeklyDiscount;
    }

    const planConfig = PROTECTION_PLANS[protectionPlan];
    const protectionFee = Math.round(subtotal * planConfig.rate);

    const platformFee = Math.round(subtotal * 0.18);
    const taxableAmount = subtotal + platformFee + protectionFee;
    const tax = Math.round(taxableAmount * 0.05);
    const total = subtotal + protectionFee + platformFee + tax;

    return {
      days,
      weekdays,
      weekendDays,
      baseRate: dailyRate,
      weekdayTotal,
      weekendTotal,
      subtotal,
      weeklyDiscount,
      monthlyDiscount,
      protectionFee,
      protectionPlan,
      platformFee,
      tax,
      total,
      currency: vehicle.currency,
      perDayEffective: Math.round(total / days),
    };
  }

  getCancellationRefund(totalAmount: number, hoursUntilStart: number): { refundAmount: number; refundPct: number; tier: string } {
    for (const tier of CANCELLATION_TIERS) {
      if (hoursUntilStart >= tier.minHours) {
        const refundAmount = Math.round((totalAmount * tier.refundPct) / 100);
        return { refundAmount, refundPct: tier.refundPct, tier: tier.label };
      }
    }
    return { refundAmount: 0, refundPct: 0, tier: "No refund" };
  }

  getProtectionPlans() {
    return PROTECTION_PLANS;
  }
}

export const pricingService = new PricingService();
