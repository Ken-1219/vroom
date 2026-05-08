"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Step {
  id: number;
  title: string;
  icon: string;
  baseDuration: number;
}

const STEPS: Step[] = [
  { id: 1, title: "Browse", icon: "🔍", baseDuration: 2000 },
  { id: 2, title: "AI Chat", icon: "🤖", baseDuration: 3000 },
  { id: 3, title: "Booking Created", icon: "📋", baseDuration: 1500 },
  { id: 4, title: "Payment", icon: "💳", baseDuration: 2500 },
  { id: 5, title: "Confirmed", icon: "✅", baseDuration: 1500 },
  { id: 6, title: "Pickup Day", icon: "📅", baseDuration: 1500 },
  { id: 7, title: "OTP Verify", icon: "🔐", baseDuration: 2500 },
  { id: 8, title: "Trip Active", icon: "🚗", baseDuration: 3000 },
  { id: 9, title: "Trip Completed", icon: "🏁", baseDuration: 2000 },
  { id: 10, title: "Review", icon: "⭐", baseDuration: 2000 },
];

type SpeedMultiplier = 0.5 | 1 | 2 | 4;

interface StepRecord {
  stepId: number;
  completedAt: string;
}

function formatClock(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function LifecycleClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<StepRecord[]>([]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stepTimestamps, setStepTimestamps] = useState<Record<number, Date>>({});
  const [tripCounter, setTripCounter] = useState(0);
  const [chatStage, setChatStage] = useState(0);
  const [payStage, setPayStage] = useState(0);
  const [stars, setStars] = useState(0);

  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tripCounterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(speed);
  const pausedRef = useRef(paused);
  const elapsedRef = useRef(elapsedMs);
  const clockStartRef = useRef<number>(0);
  const clockBaseRef = useRef<number>(0);

  speedRef.current = speed;
  pausedRef.current = paused;
  elapsedRef.current = elapsedMs;

  const clearAllTimers = useCallback(() => {
    if (clockRef.current) clearInterval(clockRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (tripCounterRef.current) clearInterval(tripCounterRef.current);
    clockRef.current = null;
    stepTimerRef.current = null;
    tripCounterRef.current = null;
  }, []);

  const resetState = useCallback(() => {
    clearAllTimers();
    setCurrentStep(0);
    setCompletedSteps([]);
    setRunning(false);
    setPaused(false);
    setDone(false);
    setElapsedMs(0);
    setStepTimestamps({});
    setTripCounter(0);
    setChatStage(0);
    setPayStage(0);
    setStars(0);
  }, [clearAllTimers]);

  const startClock = useCallback(() => {
    clockStartRef.current = Date.now();
    clockBaseRef.current = elapsedRef.current;
    if (clockRef.current) clearInterval(clockRef.current);
    clockRef.current = setInterval(() => {
      setElapsedMs(clockBaseRef.current + (Date.now() - clockStartRef.current));
    }, 100);
  }, []);

  const stopClock = useCallback(() => {
    if (clockRef.current) {
      clearInterval(clockRef.current);
      clockRef.current = null;
    }
    clockBaseRef.current = elapsedRef.current;
  }, []);

  const advanceStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= STEPS.length) {
        setDone(true);
        setRunning(false);
        stopClock();
        return;
      }

      setCurrentStep(stepIndex + 1);
      setChatStage(0);
      setPayStage(0);
      setStars(0);
      setTripCounter(0);
      if (tripCounterRef.current) clearInterval(tripCounterRef.current);

      const step = STEPS[stepIndex]!;
      const now = new Date();
      setStepTimestamps((prev) => ({ ...prev, [step.id]: now }));

      if (step.id === 2) {
        const chatInterval = setInterval(() => {
          setChatStage((s) => {
            if (s >= 2) {
              clearInterval(chatInterval);
              return 2;
            }
            return s + 1;
          });
        }, step.baseDuration / (3 * speedRef.current));
      }

      if (step.id === 4) {
        const payInterval = setInterval(() => {
          setPayStage((s) => {
            if (s >= 2) {
              clearInterval(payInterval);
              return 2;
            }
            return s + 1;
          });
        }, step.baseDuration / (3 * speedRef.current));
      }

      if (step.id === 8) {
        let count = 0;
        tripCounterRef.current = setInterval(() => {
          count++;
          setTripCounter(count);
        }, 1000 / speedRef.current);
      }

      if (step.id === 10) {
        let star = 0;
        const starInterval = setInterval(() => {
          star++;
          setStars(star);
          if (star >= 5) clearInterval(starInterval);
        }, (step.baseDuration / 5) / speedRef.current);
      }

      const duration = step.baseDuration / speedRef.current;
      stepTimerRef.current = setTimeout(() => {
        setCompletedSteps((prev) => [
          ...prev,
          {
            stepId: step.id,
            completedAt: new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            }),
          },
        ]);
        advanceStep(stepIndex + 1);
      }, duration);
    },
    [stopClock]
  );

  const start = useCallback(() => {
    resetState();
    setRunning(true);
    setTimeout(() => {
      startClock();
      advanceStep(0);
    }, 50);
  }, [resetState, startClock, advanceStep]);

  const togglePause = useCallback(() => {
    if (!running) return;
    if (!paused) {
      setPaused(true);
      stopClock();
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      if (tripCounterRef.current) {
        clearInterval(tripCounterRef.current);
        tripCounterRef.current = null;
      }
    } else {
      setPaused(false);
      startClock();
      const stepIndex = currentStep - 1;
      if (stepIndex >= 0 && stepIndex < STEPS.length) {
        const step = STEPS[stepIndex]!;
        const duration = step.baseDuration / speedRef.current;
        stepTimerRef.current = setTimeout(() => {
          setCompletedSteps((prev) => [
            ...prev,
            {
              stepId: step.id,
              completedAt: new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              }),
            },
          ]);
          advanceStep(stepIndex + 1);
        }, duration / 2);
      }
    }
  }, [running, paused, currentStep, stopClock, startClock, advanceStep]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const completedSet = new Set(completedSteps.map((r) => r.stepId));
  const activeStep = STEPS[currentStep - 1] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E8E6E1] rounded-xl px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-[#6B6B6B]">⏱️ Simulation Clock:</span>
          <span className="text-[#1A1A1A] font-semibold">{formatClock(elapsedMs)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {([0.5, 1, 2, 4] as SpeedMultiplier[]).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                speed === s
                  ? "bg-[#FF4D00] text-white border-[#FF4D00]"
                  : "bg-white text-[#6B6B6B] border-[#E8E6E1] hover:border-[#FF4D00] hover:text-[#FF4D00]"
              }`}
            >
              {s}x
            </button>
          ))}
          {running && (
            <button
              onClick={togglePause}
              className="px-3 py-1 text-xs font-semibold rounded-lg border border-[#E8E6E1] bg-white text-[#6B6B6B] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
            >
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
          )}
          <button
            onClick={resetState}
            className="px-3 py-1 text-xs font-semibold rounded-lg border border-[#E8E6E1] bg-white text-[#6B6B6B] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {!running && !done && (
        <div className="flex justify-center py-6">
          <button
            onClick={start}
            className="px-10 py-3.5 bg-[#FF4D00] hover:bg-[#E64500] text-white font-bold text-base rounded-xl transition-colors shadow-sm"
          >
            Start Simulation
          </button>
        </div>
      )}

      {(running || done) && (
        <div className="flex gap-6">
          <div className="w-56 flex-shrink-0">
            <div className="bg-white border border-[#E8E6E1] rounded-xl p-4 space-y-1">
              {STEPS.map((step, idx) => {
                const isCompleted = completedSet.has(step.id);
                const isActive = currentStep === idx + 1;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-[#FFF1EB]"
                        : isCompleted
                        ? ""
                        : "opacity-40"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-[#FF4D00] text-white"
                          : "bg-[#E8E6E1] text-[#999]"
                      }`}
                    >
                      {isCompleted ? "✓" : isActive ? (
                        <span className="animate-pulse">{step.id}</span>
                      ) : (
                        step.id
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive
                          ? "text-[#FF4D00]"
                          : isCompleted
                          ? "text-[#1A1A1A]"
                          : "text-[#999]"
                      }`}
                    >
                      {step.icon} {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {activeStep && !done && (
              <StepDetail
                step={activeStep}
                chatStage={chatStage}
                payStage={payStage}
                tripCounter={tripCounter}
                stars={stars}
                timestamp={stepTimestamps[activeStep.id]}
              />
            )}
            {done && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-lg font-bold text-green-800">Simulation Complete!</p>
                  <p className="text-sm text-green-600 mt-1">Full rental lifecycle finished in {formatClock(elapsedMs)}</p>
                  <button
                    onClick={start}
                    className="mt-4 px-6 py-2 bg-[#FF4D00] hover:bg-[#E64500] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Run Again
                  </button>
                </div>
                <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#E8E6E1]">
                    <h3 className="text-sm font-semibold text-[#1A1A1A]">Timeline Summary</h3>
                  </div>
                  <div className="divide-y divide-[#E8E6E1]">
                    {completedSteps.map((record) => {
                      const step = STEPS.find((s) => s.id === record.stepId);
                      if (!step) return null;
                      return (
                        <div key={record.stepId} className="flex items-center justify-between px-5 py-3">
                          <span className="text-sm text-[#1A1A1A]">
                            {step.icon} {step.title}
                          </span>
                          <span className="text-xs font-mono text-[#6B6B6B]">
                            📅 {record.completedAt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepDetail({
  step,
  chatStage,
  payStage,
  tripCounter,
  stars,
  timestamp,
}: {
  step: Step;
  chatStage: number;
  payStage: number;
  tripCounter: number;
  stars: number;
  timestamp: Date | undefined;
}) {
  const ts = timestamp ? formatTimestamp(timestamp) : "--:--:--";

  if (step.id === 1) {
    const vehicles = [
      { name: "Toyota Fortuner", type: "SUV", price: "₹3,200/day", badge: "Popular" },
      { name: "Maruti Dzire", type: "Sedan", price: "₹900/day", badge: "Best Value" },
      { name: "Honda City", type: "Sedan", price: "₹1,400/day", badge: null },
    ];
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 space-y-4">
        <StepHeader step={step} ts={ts} />
        <p className="text-xs text-[#6B6B6B]">User is browsing available vehicles in Bangalore…</p>
        <div className="space-y-2">
          {vehicles.map((v, i) => (
            <div
              key={v.name}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                i === 1 ? "border-[#FF4D00] bg-[#FFF1EB]" : "border-[#E8E6E1]"
              }`}
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-8 rounded bg-[#E8E6E1] flex items-center justify-center">
                  <svg className="w-6 h-4 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{v.name}</p>
                  <p className="text-xs text-[#6B6B6B]">{v.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#1A1A1A]">{v.price}</p>
                {v.badge && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-[#FF4D00] text-white">
                    {v.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <CompletedAt step={step} ts={ts} />
      </div>
    );
  }

  if (step.id === 2) {
    const messages = [
      { role: "user", text: "Book me a Maruti Suzuki Dzire in Bangalore from May 20 to May 25" },
      { role: "ai", text: "I found a great option! Booking the 2024 Maruti Suzuki Dzire ZXi+ for ₹6,071 (5 days). Shall I confirm?" },
      { role: "ai", text: "Booking created! ✅ Your booking ID is BK-A7X2P9" },
    ];
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 space-y-4">
        <StepHeader step={step} ts={ts} />
        <div className="space-y-3">
          {messages.slice(0, chatStage + 1).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-[#FF4D00] text-white rounded-br-sm"
                    : "bg-[#F0EFEC] text-[#1A1A1A] rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {chatStage < 2 && (
            <div className="flex justify-start">
              <div className="bg-[#F0EFEC] px-4 py-2.5 rounded-2xl rounded-bl-sm">
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>
        <CompletedAt step={step} ts={ts} />
      </div>
    );
  }

  if (step.id === 3) {
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 space-y-4">
        <StepHeader step={step} ts={ts} />
        <div className="border border-[#E8E6E1] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#1A1A1A]">Maruti Suzuki Dzire ZXi+ AMT</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">PENDING</span>
          </div>
          <div className="text-xs text-[#6B6B6B] space-y-1">
            <div className="flex justify-between"><span>Booking ID</span><span className="font-mono text-[#1A1A1A]">BK-A7X2P9</span></div>
            <div className="flex justify-between"><span>Dates</span><span className="text-[#1A1A1A]">May 20 – 25, 2025</span></div>
            <div className="flex justify-between"><span>Total</span><span className="font-bold text-[#1A1A1A]">₹6,071</span></div>
          </div>
          <div className="bg-[#FFF1EB] border border-[#FF4D00]/30 rounded-lg px-3 py-2 text-xs text-[#E64500] font-medium">
            Payment required to confirm booking
          </div>
        </div>
        <CompletedAt step={step} ts={ts} />
      </div>
    );
  }

  if (step.id === 4) {
    const cardDigits = ["4111", "1111", "1111", "1111"];
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 space-y-4">
        <StepHeader step={step} ts={ts} />
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#3D3D3D] rounded-xl p-4 text-white">
            <p className="text-xs text-white/60 mb-3">Credit / Debit Card</p>
            <p className="font-mono text-sm tracking-[3px]">
              {cardDigits.map((group, i) => (
                <span key={i}>
                  {payStage > i ? group : "····"}{i < 3 ? " " : ""}
                </span>
              ))}
            </p>
            <div className="flex justify-between mt-3 text-xs text-white/60">
              <span>Renter Name</span>
              <span>₹6,071</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#6B6B6B]">
              <span>Processing payment…</span>
              <span>{Math.min(payStage * 34, 100)}%</span>
            </div>
            <div className="h-2 bg-[#F0EFEC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF4D00] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(payStage * 34, 100)}%` }}
              />
            </div>
          </div>
          {payStage >= 2 && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 font-semibold text-center">
              Payment Successful ✅
            </div>
          )}
        </div>
        <CompletedAt step={step} ts={ts} />
      </div>
    );
  }

  if (step.id === 5) {
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 space-y-4">
        <StepHeader step={step} ts={ts} />
        <div className="border border-green-200 rounded-xl p-4 space-y-3 bg-green-50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#1A1A1A]">Maruti Suzuki Dzire ZXi+ AMT</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF1EB] text-[#E64500]">CONFIRMED</span>
          </div>
          <div className="text-xs text-[#6B6B6B] space-y-1">
            <div className="flex justify-between"><span>Booking ID</span><span className="font-mono text-[#1A1A1A]">BK-A7X2P9</span></div>
            <div className="flex justify-between"><span>Dates</span><span className="text-[#1A1A1A]">May 20 – 25, 2025</span></div>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#6B6B6B] mb-1">Your Pickup OTP</p>
            <p className="text-3xl font-extrabold text-[#FF4D00] tracking-[8px] font-mono">4829</p>
          </div>
        </div>
        <CompletedAt step={step} ts={ts} />
      </div>
    );
  }

  if (step.id === 6) {
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 space-y-4">
        <StepHeader step={step} ts={ts} />
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#FF4D00] bg-[#FFF1EB] text-3xl font-bold text-[#FF4D00] mb-3 animate-pulse">
            20
          </div>
          <p className="font-semibold text-[#1A1A1A]">Today is your pickup day! 🗓️</p>
          <p className="text-sm text-[#6B6B6B] mt-1">May 20, 2025 · Head to the pickup location</p>
        </div>
        <CompletedAt step={step} ts={ts} />
      </div>
    );
  }

  if (step.id === 7) {
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 space-y-4">
        <StepHeader step={step} ts={ts} />
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-[#F0EFEC] rounded-xl">
            <div className="text-2xl">🧑🏽</div>
            <div>
              <p className="text-xs text-[#6B6B6B]">Renter shows OTP</p>
              <p className="text-xl font-bold font-mono tracking-[4px] text-[#FF4D00]">4829</p>
            </div>
          </div>
          <div className="flex justify-center text-[#6B6B6B] text-sm">↓ host verifies</div>
          <div className="flex items-center gap-3 p-3 bg-[#F0EFEC] rounded-xl">
            <div className="text-2xl">🧑🏾</div>
            <div>
              <p className="text-xs text-[#6B6B6B]">Host enters OTP</p>
              <p className="text-xl font-bold font-mono tracking-[4px] text-[#1A1A1A]">4829</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 font-semibold text-center">
            OTP Verified ✅
          </div>
          <p className="text-xs text-[#6B6B6B] text-center">
            Trip start: {ts}
          </p>
        </div>
        <CompletedAt step={step} ts={ts} />
      </div>
    );
  }

  if (step.id === 8) {
    const s = tripCounter % 60;
    const m = Math.floor(tripCounter / 60) % 60;
    const h = Math.floor(tripCounter / 3600);
    const counterStr = [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 space-y-4">
        <StepHeader step={step} ts={ts} />
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <p className="font-bold text-blue-800 text-lg">TRIP IN PROGRESS</p>
          </div>
          <p className="font-mono text-3xl font-bold text-blue-700">⏱️ {counterStr}</p>
          <p className="text-xs text-blue-600 mt-2">Trip started: {ts}</p>
        </div>
        <CompletedAt step={step} ts={ts} />
      </div>
    );
  }

  if (step.id === 9) {
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 space-y-4">
        <StepHeader step={step} ts={ts} />
        <div className="space-y-3">
          <div className="bg-[#F0EFEC] rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Trip ended</span>
              <span className="font-medium text-[#1A1A1A]">{ts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Duration</span>
              <span className="font-medium text-[#1A1A1A]">5 days, 2 hours, 34 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Odometer</span>
              <span className="font-medium text-[#1A1A1A]">300 km driven</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Fuel</span>
              <span className="font-medium text-[#1A1A1A]">Full ⛽</span>
            </div>
          </div>
        </div>
        <CompletedAt step={step} ts={ts} />
      </div>
    );
  }

  if (step.id === 10) {
    return (
      <div className="bg-white border border-[#E8E6E1] rounded-xl p-5 space-y-4">
        <StepHeader step={step} ts={ts} />
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`text-3xl transition-all duration-300 ${stars >= n ? "opacity-100" : "opacity-20"}`}
              >
                ⭐
              </span>
            ))}
          </div>
          {stars >= 5 && (
            <div className="bg-[#FFF1EB] border border-[#FF4D00]/20 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-[#1A1A1A]">Review submitted</p>
              <p className="text-sm text-[#6B6B6B] mt-1">
                &quot;5/5 — Great car, very smooth ride!&quot; ⭐⭐⭐⭐⭐
              </p>
            </div>
          )}
        </div>
        <CompletedAt step={step} ts={ts} />
      </div>
    );
  }

  return null;
}

function StepHeader({ step, ts }: { step: Step; ts: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{step.icon}</span>
      <div>
        <h3 className="text-base font-bold text-[#1A1A1A]">{step.title}</h3>
        <p className="text-xs text-[#999]">Step {step.id} of {STEPS.length} · started {ts}</p>
      </div>
    </div>
  );
}

function CompletedAt({ step: _step, ts }: { step: Step; ts: string }) {
  return (
    <p className="text-xs text-[#999] border-t border-[#E8E6E1] pt-3">
      📅 Advancing at {ts}…
    </p>
  );
}
