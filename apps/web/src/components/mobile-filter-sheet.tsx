"use client";

import { useState, useEffect } from "react";

interface MobileFilterSheetProps {
  children: React.ReactNode;
  activeCount: number;
}

export function MobileFilterSheet({ children, activeCount }: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E8E6E1] rounded-xl text-sm text-[#1A1A1A] font-medium cursor-pointer"
        aria-label="Open filters"
      >
        <svg className="w-4 h-4 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="bg-[#FF4D00] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile sheet overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#E8E6E1]" />
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-b border-[#F0EFEC]">
              <h3 className="text-base font-display font-bold text-[#1A1A1A]">Filters</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-[#999] hover:text-[#1A1A1A] cursor-pointer"
                aria-label="Close filters"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
            <div className="px-6 py-4 border-t border-[#F0EFEC]">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 bg-[#FF4D00] hover:bg-[#E64500] text-white font-semibold rounded-full transition-colors cursor-pointer"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
