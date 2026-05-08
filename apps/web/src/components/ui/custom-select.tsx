"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  "aria-label": ariaLabel,
  className = "",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const allOptions: Option[] = placeholder
    ? [{ label: placeholder, value: "" }, ...options]
    : options;

  const selected = allOptions.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;
  const isPlaceholder = !value;

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [open, close]);

  useEffect(() => {
    if (open && focusedIndex >= 0) {
      const items = listRef.current?.children;
      if (items?.[focusedIndex]) {
        (items[focusedIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex, open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        const idx = allOptions.findIndex((o) => o.value === value);
        setFocusedIndex(idx >= 0 ? idx : 0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, allOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0 && allOptions[focusedIndex]) {
          onChange(allOptions[focusedIndex].value);
          close();
        }
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(allOptions.length - 1);
        break;
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => {
          setOpen(!open);
          if (!open) {
            const idx = allOptions.findIndex((o) => o.value === value);
            setFocusedIndex(idx >= 0 ? idx : 0);
          }
        }}
        onKeyDown={handleKeyDown}
        className="w-full lg:w-auto flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-[#E8E6E1] text-sm bg-white hover:border-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] transition-all cursor-pointer text-left min-w-[140px]"
      >
        <span className={isPlaceholder ? "text-[#999]" : "text-[#1A1A1A]"}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-[#999] flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 mt-1.5 w-full min-w-[180px] bg-white border border-[#E8E6E1] rounded-xl shadow-lg shadow-black/8 py-1 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#E8E6E1] [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {allOptions.map((opt, i) => {
            const isSelected = opt.value === value;
            const isFocused = i === focusedIndex;
            return (
              <li
                key={opt.value + i}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setFocusedIndex(i)}
                onClick={() => {
                  onChange(opt.value);
                  close();
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                  isFocused
                    ? "bg-[#FFF1EB] text-[#FF4D00]"
                    : isSelected
                      ? "text-[#FF4D00] bg-[#FFF1EB]/50"
                      : "text-[#1A1A1A] hover:bg-[#FAFAF8]"
                } ${i === 0 ? "rounded-t-lg" : ""} ${i === allOptions.length - 1 ? "rounded-b-lg" : ""}`}
              >
                <span className={isSelected ? "font-medium" : ""}>{opt.label}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-[#FF4D00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
