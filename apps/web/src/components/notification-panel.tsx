"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

interface NotificationPanelProps {
  onClose: () => void;
  onCountChange: (count: number) => void;
}

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  booking_created: { icon: "📋", color: "bg-blue-50" },
  booking_confirmed: { icon: "✓", color: "bg-[#FFF1EB]" },
  booking_cancelled: { icon: "✕", color: "bg-red-50" },
  payment_captured: { icon: "💳", color: "bg-green-50" },
  payment_refunded: { icon: "↩", color: "bg-amber-50" },
};

export function NotificationPanel({ onClose, onCountChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications?limit=20")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setNotifications(data.notifications);
          onCountChange(data.unreadCount);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [onCountChange]);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onCountChange(0);
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    onCountChange(Math.max(0, notifications.filter((n) => !n.read).length - 1));
  }

  function getLink(n: Notification): string | null {
    const bookingId = n.data?.bookingId as string | undefined;
    if (bookingId) return `/bookings/${bookingId}`;
    return null;
  }

  function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E8E6E1] z-50 overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EFEC]">
        <h3 className="text-sm font-display font-bold text-[#1A1A1A]">Notifications</h3>
        {hasUnread && (
          <button
            onClick={markAllRead}
            className="text-xs text-[#FF4D00] hover:text-[#E64500] font-medium cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-sm text-[#999]">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-10 h-10 text-[#E8E6E1] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <p className="text-sm text-[#6B6B6B]">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const link = getLink(n);
            const typeConfig = TYPE_ICONS[n.type] ?? { icon: "•", color: "bg-[#F0EFEC]" };

            const content = (
              <div
                className={`flex gap-3 px-4 py-3 transition-colors ${
                  n.read ? "bg-white" : "bg-[#FFF1EB]/30"
                } hover:bg-[#FAFAF8]`}
              >
                <div className={`w-8 h-8 rounded-full ${typeConfig.color} flex items-center justify-center flex-shrink-0 text-sm`}>
                  {typeConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${n.read ? "text-[#6B6B6B]" : "text-[#1A1A1A] font-medium"}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#FF4D00] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-[#999] mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-[#999] mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );

            if (link) {
              return (
                <Link
                  key={n.id}
                  href={link}
                  onClick={() => {
                    if (!n.read) markRead(n.id);
                    onClose();
                  }}
                  className="block border-b border-[#F0EFEC] last:border-b-0"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={n.id}
                onClick={() => { if (!n.read) markRead(n.id); }}
                className="border-b border-[#F0EFEC] last:border-b-0 cursor-pointer"
              >
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
