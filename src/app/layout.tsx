import type { Metadata, Viewport } from "next";
import { Archivo, Doto, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
const doto = Doto({ variable: "--font-doto", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3200"),
  title: { default: "Mise · What do you want to eat today?", template: "%s · Mise" },
  description: "Type a dish. Mise writes the grocery list with Gemini and builds the cart on Zepto.",
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrains.variable} ${doto.variable}`}>
      <body>
        <noscript>
          <style>{"[data-slide] .reveal{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
