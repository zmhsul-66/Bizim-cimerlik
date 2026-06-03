import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
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
      className={`${inter.variable} ${playfair.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}