import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// 1. Viewport-u buradan ayırırıq
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 2. Metadata hissəsindən viewport-u silirik
export const metadata = {
  title: "Dəniz Qırağı — Rəqəmsal Onlayn Menyu",
  description: "Dəniz Qırağı Restaurant & Lounge-un minimalist, sürətli və mobilə uyğun rəqəmsal onlayn menyusu. Ən ləziz isti yeməklər, kabablar, şorbalar və şirniyyatlar.",
  robots: "index, follow",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="az"
      className={`${outfit.variable} ${playfair.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}