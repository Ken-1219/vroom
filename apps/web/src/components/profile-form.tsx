"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ProfileData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export function ProfileForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setProfile(data);
          setName(data.name);
          setPhone(data.phone ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to update profile");
      }

      setMessage({ type: "success", text: "Profile updated successfully" });
      router.refresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-[#E8E6E1] rounded-lg h-10 w-full" />
        <div className="animate-pulse bg-[#E8E6E1] rounded-lg h-10 w-full" />
        <div className="animate-pulse bg-[#E8E6E1] rounded-lg h-10 w-full" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-sm text-[#6B6B6B]">Failed to load profile</p>;
  }

  const roleLabels: Record<string, string> = {
    renter: "Renter",
    host: "Host",
    admin: "Admin",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`text-sm rounded-lg px-4 py-3 ${
            message.type === "success"
              ? "bg-[#FFF1EB] border border-[#FF4D00]/20 text-[#FF4D00]"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Read-only fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Email
          </label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={profile.email ?? ""}
              disabled
              className="flex-1 rounded-lg border border-[#E8E6E1] px-4 py-2.5 text-sm text-[#6B6B6B] bg-[#FAFAF8]"
            />
            {profile.emailVerified && (
              <span className="text-xs font-medium text-[#FF4D00] bg-[#FFF1EB] px-2 py-1 rounded-full">
                Verified
              </span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Role
          </label>
          <input
            type="text"
            value={roleLabels[profile.role] ?? profile.role}
            disabled
            className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2.5 text-sm text-[#6B6B6B] bg-[#FAFAF8] capitalize"
          />
        </div>
      </div>

      {/* Editable fields */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
          Phone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full rounded-lg border border-[#E8E6E1] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-[#999]">
          Member since{" "}
          {new Date(profile.createdAt).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="px-6 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-[#E8E6E1] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
