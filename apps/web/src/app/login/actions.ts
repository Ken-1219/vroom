"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginWithCredentials(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/vehicles",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password. Try a demo account." };
    }
    throw error;
  }

  return null;
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/vehicles" });
}

export async function loginWithGithub() {
  await signIn("github", { redirectTo: "/vehicles" });
}
