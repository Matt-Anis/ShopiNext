import type { Metadata } from "next"
import { Geist, Geist_Mono, Figtree } from "next/font/google"
import "./globals.css"
import { cn } from "@repo/ui/utils"
import { Toaster } from "@repo/ui/toast"
import { TooltipProvider } from "@repo/ui/tooltip"
import { ThemeProvider } from "@repo/ui/theme-provider"

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ShopiNext — Your next good find",
  description:
    "Everyday essentials and unexpected favourites. Discover your next good find at ShopiNext.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        figtreeHeading.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider storageKey="shopinext-client-theme">
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
