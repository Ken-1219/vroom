import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { auth, getDemoAccounts } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/vehicles");
  }

  const demoAccounts = getDemoAccounts();
  const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasGithub = !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Nav variant="light" />
      <main className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-8">
          <h1 className="text-2xl font-display font-bold text-[#1A1A1A] text-center">
            Sign in to Vroom
          </h1>
          <p className="text-sm text-[#6B6B6B] text-center mt-2">
            Use a demo account to explore the platform
          </p>

          <LoginForm hasGoogle={hasGoogle} hasGithub={hasGithub} />

          <div className="mt-8 pt-6 border-t border-[#F0EFEC]">
            <p className="text-xs font-medium text-[#999] uppercase tracking-wider mb-3">
              Demo Accounts
            </p>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <div
                  key={acc.email}
                  className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-[#FAFAF8]"
                >
                  <div>
                    <span className="font-medium text-[#1A1A1A]">
                      {acc.name}
                    </span>
                    <span className="text-[#999] ml-2 text-xs capitalize">
                      {acc.role}
                    </span>
                  </div>
                  <code className="text-xs text-[#6B6B6B] font-mono">
                    {acc.email}
                  </code>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#999] mt-3 text-center">
              Password for all accounts: <code className="font-mono text-[#1A1A1A]">demo123</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
