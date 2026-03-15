"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "viem/chains";
import { http } from "viem";

const INFURA_URL = process.env.NEXT_PUBLIC_FHEVM_NETWORK_URL;

export const config = getDefaultConfig({
  appName: "HushFund",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "hushfund-dev",
  chains: [sepolia],
  ssr: true,
  transports: INFURA_URL
    ? { [sepolia.id]: http(INFURA_URL) }
    : undefined,
});
