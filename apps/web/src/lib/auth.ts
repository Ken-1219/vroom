import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string | null;
    };
  }
}

const DEMO_ACCOUNTS: Record<
  string,
  { id: string; name: string; role: string; password: string }
> = {
  "renter@demo.vroom.app": {
    id: "d0000000-0000-4000-8000-000000000001",
    name: "Arjun Mehta",
    role: "renter",
    password: "demo123",
  },
  "host@demo.vroom.app": {
    id: "d0000000-0000-4000-8000-000000000002",
    name: "Priya Sharma",
    role: "host",
    password: "demo123",
  },
  "admin@demo.vroom.app": {
    id: "d0000000-0000-4000-8000-000000000003",
    name: "Admin User",
    role: "admin",
    password: "demo123",
  },
  "fleet@demo.vroom.app": {
    id: "d0000000-0000-4000-8000-000000000004",
    name: "Fleet Manager",
    role: "host",
    password: "demo123",
  },
  "renter.us@demo.vroom.app": {
    id: "d0000000-0000-4000-8000-000000000005",
    name: "Mike Johnson",
    role: "renter",
    password: "demo123",
  },
  "renter.eu@demo.vroom.app": {
    id: "d0000000-0000-4000-8000-000000000006",
    name: "Emma Williams",
    role: "renter",
    password: "demo123",
  },
};

const providers = [
  Credentials({
    name: "Demo Account",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string;
      const password = credentials?.password as string;
      const account = DEMO_ACCOUNTS[email];
      if (!account || account.password !== password) return null;
      return {
        id: account.id,
        email,
        name: account.name,
        role: account.role,
      };
    },
  }),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
    : []),
  ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
    ? [GitHub({ clientId: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET })]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "renter";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "renter";
      }
      return session;
    },
  },
});

export function getDemoAccounts() {
  return Object.entries(DEMO_ACCOUNTS).map(([email, acc]) => ({
    email,
    name: acc.name,
    role: acc.role,
  }));
}
