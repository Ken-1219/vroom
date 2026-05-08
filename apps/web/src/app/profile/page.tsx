import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Profile</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">
          Manage your account information
        </p>

        <div className="bg-white border border-[#E8E6E1] rounded-xl p-6">
          <ProfileForm />
        </div>
      </main>
    </div>
  );
}
