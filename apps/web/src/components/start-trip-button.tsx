"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { InspectionForm, type InspectionData } from "./inspection-form";

interface StartTripButtonProps {
  bookingId: string;
  pickupOtp?: string;
}

export function StartTripButton({ bookingId, pickupOtp }: StartTripButtonProps) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "otp" | "inspection">("idle");
  const [otpValue, setOtpValue] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpValue];
    next[index] = value.slice(-1);
    setOtpValue(next);
    setOtpError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otpValue[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otpValue];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] ?? "";
    }
    setOtpValue(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }

  function verifyOtp() {
    const entered = otpValue.join("");
    if (entered.length < 6) {
      setOtpError("Enter the full 6-digit OTP");
      return;
    }
    if (pickupOtp && entered !== pickupOtp) {
      setOtpError("OTP doesn't match. Ask the renter for the correct code.");
      setOtpValue(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }
    setStep("inspection");
  }

  async function handleSubmit(data: InspectionData) {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          odometer: data.odometer,
          fuelLevel: data.fuelLevel,
          preInspection: data.inspection,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error?.message ?? "Failed to start trip");
      }

      const trip = await res.json();
      router.push(`/trips/${trip.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep(pickupOtp ? "otp" : "inspection")}
        className="px-5 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
      >
        Start Trip
      </button>
    );
  }

  if (step === "otp") {
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <h3 className="text-sm font-semibold text-[#1A1A1A]">
            Verify Pickup OTP
          </h3>
        </div>
        <p className="text-xs text-[#6B6B6B] mb-5">
          Ask the renter for their 6-digit pickup OTP to verify their identity.
        </p>

        <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
          {otpValue.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              aria-label={`OTP digit ${i + 1}`}
              className={`w-11 h-13 text-center text-xl font-bold rounded-lg border-2 transition-all focus:outline-none ${
                otpError
                  ? "border-red-400 text-red-700 bg-red-50"
                  : digit
                    ? "border-[#FF4D00] text-[#FF4D00] bg-[#FFF1EB]"
                    : "border-[#E8E6E1] text-[#1A1A1A] bg-white focus:border-[#FF4D00]"
              }`}
            />
          ))}
        </div>

        {otpError && (
          <p className="text-sm text-red-600 text-center mb-4">{otpError}</p>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => { setStep("idle"); setOtpValue(["", "", "", "", "", ""]); setOtpError(null); }}
            className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={verifyOtp}
            className="px-5 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Verify & Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E6E1] rounded-xl p-6">
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">
        Pre-Trip Inspection
      </h3>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}
      <InspectionForm type="pre" onSubmit={handleSubmit} submitting={submitting} />
      <button
        type="button"
        onClick={() => setStep("idle")}
        className="mt-3 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer"
      >
        Cancel
      </button>
    </div>
  );
}
