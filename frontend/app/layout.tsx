import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "HushFund — Fundraise Transparently. Donate Privately.",
  description:
    "A privacy-preserving crowdfunding platform powered by Fully Homomorphic Encryption (FHE) on Zama fhEVM. Campaign totals are public; individual donation amounts stay private.",
  keywords: ["crowdfunding", "FHE", "privacy", "blockchain", "Zama", "fhEVM", "Web3"],
  openGraph: {
    title: "HushFund",
    description: "Fundraise Transparently. Donate Privately.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

