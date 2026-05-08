import type { Metadata } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import { Providers } from "@/components/providers";
import { CommandBarProvider, CommandBar } from "@/components/command-bar";
import { registerEventHandlers } from "@/lib/event-handlers";
import "./globals.css";

registerEventHandlers();

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Vroom — Self-Drive Car Rental in Bangalore",
  description:
    "Premium self-drive car rental in Bangalore. 200+ cars across 40+ neighborhoods. Book by the day, weekend, or week.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)]">
        <Providers>
          <CommandBarProvider>
            {children}
            <CommandBar />
          </CommandBarProvider>
        </Providers>
      </body>
    </html>
  );
}
