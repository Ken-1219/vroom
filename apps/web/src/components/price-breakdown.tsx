"use client";

import { CANCELLATION_TIERS } from "@/services/pricing";

interface PriceBreakdownProps {
  days: number;
  weekdays: number;
  weekendDays: number;
  weekdayTotal: number;
  weekendTotal: number;
  weeklyDiscount: number;
  monthlyDiscount: number;
  protectionFee: number;
  protectionPlan: string;
  platformFee: number;
  tax: number;
  total: number;
  formattedDailyRate: string;
  weekendRate?: string | null;
  format: (n: number) => string;
}

export function PriceBreakdown({
  days,
  weekdays,
  weekendDays,
  weekdayTotal,
  weekendTotal,
  weeklyDiscount,
  monthlyDiscount,
  protectionFee,
  protectionPlan,
  platformFee,
  tax,
  total,
  formattedDailyRate,
  weekendRate,
  format,
}: PriceBreakdownProps) {
  return (
    <div className="bg-[#FAFAF8] rounded-lg p-5 space-y-3">
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Price Breakdown</h3>

      {/* Base rates */}
      {weekendDays > 0 && weekendRate ? (
        <>
          <LineItem
            label={`${formattedDailyRate}/day x ${weekdays} weekday${weekdays !== 1 ? "s" : ""}`}
            value={format(weekdayTotal / 100)}
          />
          <LineItem
            label={`${weekendRate}/day x ${weekendDays} weekend day${weekendDays !== 1 ? "s" : ""}`}
            value={format(weekendTotal / 100)}
          />
        </>
      ) : (
        <LineItem
          label={`${formattedDailyRate}/day x ${days} day${days !== 1 ? "s" : ""}`}
          value={format((weekdayTotal + weekendTotal) / 100)}
        />
      )}

      {/* Discounts */}
      {weeklyDiscount > 0 && (
        <LineItem
          label="Weekly discount"
          value={`-${format(weeklyDiscount / 100)}`}
          highlight="green"
        />
      )}
      {monthlyDiscount > 0 && (
        <LineItem
          label="Monthly discount"
          value={`-${format(monthlyDiscount / 100)}`}
          highlight="green"
        />
      )}

      {/* Protection */}
      {protectionFee > 0 && (
        <LineItem
          label={`Protection (${protectionPlan})`}
          value={format(protectionFee / 100)}
        />
      )}

      {/* Fees */}
      <LineItem label="Platform fee (18%)" value={format(platformFee / 100)} />
      <LineItem label="Tax (5%)" value={format(tax / 100)} />

      {/* Total */}
      <div className="border-t border-[#E8E6E1] pt-3 flex justify-between text-base font-bold text-[#1A1A1A]">
        <span>Total</span>
        <span>{format(total / 100)}</span>
      </div>

      {days >= 7 && (
        <p className="text-xs text-[#FF4D00] text-center">
          Effective rate: {format(Math.round(total / days) / 100)}/day
        </p>
      )}

      {/* Cancellation policy preview */}
      <div className="border-t border-[#E8E6E1] pt-3 mt-3">
        <p className="text-xs font-medium text-[#1A1A1A] mb-2">Cancellation Policy</p>
        <div className="space-y-1">
          {CANCELLATION_TIERS.map((tier) => (
            <div key={tier.minHours} className="flex justify-between text-xs text-[#6B6B6B]">
              <span>{tier.label}</span>
              <span className={tier.refundPct === 100 ? "text-[#FF4D00] font-medium" : tier.refundPct === 0 ? "text-red-500" : ""}>
                {tier.fee}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "green";
}) {
  return (
    <div className="flex justify-between text-sm text-[#6B6B6B]">
      <span>{label}</span>
      <span className={highlight === "green" ? "text-[#FF4D00] font-medium" : ""}>
        {value}
      </span>
    </div>
  );
}
