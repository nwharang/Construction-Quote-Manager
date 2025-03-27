import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { TRPCProvider } from "./_trpc/Provider";
import { Providers } from "./providers";
import { Navbar } from "~/components/navbar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Construction Quote Manager",
  description: "A web app for construction workers to create and manage job quotes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={inter.className}>
        <TRPCProvider>
          <Providers>
            <div className="grid min-h-dvh grid-rows-[auto_1fr]">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster richColors closeButton />
          </Providers>
        </TRPCProvider>
      </body>
    </html>
  );
}
