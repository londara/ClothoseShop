import type { Metadata } from "next";
import { Battambang } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PLATFORM_NAME } from "@/lib/platform";
import "./globals.css";

const battambang = Battambang({
  variable: "--font-battambang",
  weight: ["300", "400", "700", "900"],
  subsets: ["khmer", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${PLATFORM_NAME} — វេទិកាហាងម៉ូដប្រណីត`, template: `%s | ${PLATFORM_NAME}` },
  description: `${PLATFORM_NAME} — បើកហាងអនឡាញប្រណីតរបស់អ្នក ឬទិញសម្លៀកបំពាក់ពីហាងល្អៗ ជាមួយការបញ្ជាទិញផ្ទាល់តាមតេឡេក្រាម។`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="km" className={`${battambang.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          {children}
          <Toaster position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
