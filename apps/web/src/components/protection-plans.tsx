"use client";

interface ProtectionPlan {
  id: "basic" | "standard" | "premium";
  label: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

interface ProtectionPlansProps {
  selected: "basic" | "standard" | "premium";
  onChange: (plan: "basic" | "standard" | "premium") => void;
  formatPrice: (n: number) => string;
  subtotal: number;
  disabled?: boolean;
}

export function ProtectionPlans({
  selected,
  onChange,
  formatPrice,
  subtotal,
  disabled,
}: ProtectionPlansProps) {
  const plans: ProtectionPlan[] = [
    {
      id: "basic",
      label: "Basic",
      price: "Free",
      description: "Liability coverage only",
      features: ["Third-party liability", "₹10,000 deductible"],
    },
    {
      id: "standard",
      label: "Standard",
      price: formatPrice(Math.round(subtotal * 0.08) / 100),
      description: "Comprehensive coverage",
      features: [
        "Collision damage",
        "Theft protection",
        "₹3,000 deductible",
      ],
      recommended: true,
    },
    {
      id: "premium",
      label: "Premium",
      price: formatPrice(Math.round(subtotal * 0.15) / 100),
      description: "Full protection",
      features: [
        "Zero deductible",
        "Roadside assistance",
        "Personal accident",
        "Key replacement",
      ],
    },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Protection Plan</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onChange(plan.id)}
            disabled={disabled}
            className={`relative text-left p-4 rounded-lg border-2 transition-all cursor-pointer disabled:opacity-50 ${
              selected === plan.id
                ? "border-[#FF4D00] bg-[#FFF1EB]/50"
                : "border-[#E8E6E1] hover:border-[#E8E6E1] bg-white"
            }`}
          >
            {plan.recommended && (
              <span className="absolute -top-2.5 right-3 text-[10px] font-bold text-white bg-[#FF4D00] px-2 py-0.5 rounded-full">
                POPULAR
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {plan.label}
              </span>
              <span
                className={`text-sm font-bold ${
                  plan.id === "basic" ? "text-[#6B6B6B]" : "text-[#FF4D00]"
                }`}
              >
                {plan.price}
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] mb-2">{plan.description}</p>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-[#FF4D00] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}
