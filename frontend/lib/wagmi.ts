"use client";

import { createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "HushFund",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "hushfund-dev",
  chains: [hardhat, sepolia],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http(),
  },
  ssr: true,
});
