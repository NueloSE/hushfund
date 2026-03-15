# HushFund

> **Fundraise Transparently. Donate Privately.**

HushFund is a privacy-preserving crowdfunding platform built for the **Zama Developer Program Hackathon**. It demonstrates a real-world use case of Fully Homomorphic Encryption (FHE) using the [Zama fhEVM](https://docs.zama.ai/fhevm) to allow private, encrypted donations on-chain.

---

## Key Features

HushFund balances the need for public accountability in crowdfunding with the privacy rights of individual donors.

| Feature | Visibility / Implementation |
|---------|-----------------------------|
| **Campaign Totals** | Always public so progress can be tracked. |
| **Individual Donations**| Donor's choice (can be completely FHE-encrypted or public). |
| **FHE Computation** | On-chain homomorphic addition — plaintext is *never* revealed to the network. |
| **Milestone Campaigns** | Funds are locked until a specific goal is reached; features a confetti celebration on success! |
| **Flexible Campaigns** | No funding goal required; creators can withdraw funds at any time. |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Smart Contracts** | Solidity 0.8.24, `@fhevm/solidity` |
| **FHE Engine** | Zama fhEVM (`FHE.fromExternal`, `FHE.add`, `FHE.allowThis`) |
| **Frontend** | Next.js 14, React, TailwindCSS |
| **Web3 / Blockchain**| wagmi v2, viem, RainbowKit |
| **Development** | Hardhat, ethers.js |

---

## Quick Start Guide

Follow these steps to get HushFund running locally on your machine.

### 1. Smart Contracts Setup

1. **Navigate to the contracts directory and install dependencies:**
   ```bash
   cd contracts
   npm install
   ```

2. **Compile the smart contracts:**
   ```bash
   npm run compile
   ```

3. **Run the automated test suite to ensure everything works:**
   ```bash
   npm test
   ```

4. **Start a local Hardhat node in one terminal:**
   ```bash
   npm run node
   ```

5. **Deploy the contracts to your local node (in a new terminal):**
   ```bash
   npm run deploy:local
   ```
   > **Note:** Save the deployed contract address outputted in the terminal.

### 2. Frontend Setup

1. **Navigate to the frontend directory and install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up your environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   > **Note:** Edit `.env.local` and paste your deployed contract address into `NEXT_PUBLIC_CONTRACT_ADDRESS`.

3. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

### 3. Wallet (MetaMask) Setup

To interact with the local dApp:
1. Open your Web3 wallet (e.g., MetaMask).
2. Add a new network manually:
   - **RPC URL:** `http://localhost:8545`
   - **Chain ID:** `31337`
3. Import an account using one of the private keys provided by the `npm run node` output.

---

## How FHE Integration Works

HushFund leverages *Fully Homomorphic Encryption* to process donations without exposing their amounts. Here is a simplified look at the `donatePrivate` function:

```solidity
// 1. Donor encrypts their amount client-side and submits the ciphertext + ZK proof.
euint64 donation = FHE.fromExternal(encryptedHandle, inputProof);

// 2. Homomorphic addition occurs on-chain — the contract NEVER sees the plaintext.
euint64 newTotal = FHE.add(_encryptedTotal[campaignId], donation);

// 3. Access control is strictly enforced — only the creator and donor can decrypt their respective values.
FHE.allowThis(newTotal);
FHE.allow(newTotal, campaign.creator);
FHE.allow(donation, msg.sender);
```

By accumulating a fully encrypted total via homomorphic addition, decryption is restricted strictly to authorized parties through the Zama KMS gateway.

---

## Project Structure

```text
hushfund/
├── contracts/                        # Smart Contract environment
│   ├── contracts/
│   │   └── HushFund.sol              # Core logic with FHE encrypted donations
│   ├── scripts/
│   │   └── deploy.ts                 # Deployment scripts
│   ├── test/
│   │   └── HushFund.test.ts          # Contract test suite
│   └── hardhat.config.cjs            # Hardhat configuration
│
└── frontend/                         # Next.js Application
    ├── app/
    │   ├── page.tsx                  # Landing page
    │   ├── explore/page.tsx          # Browse active campaigns
    │   ├── campaign/[id]/page.tsx    # Campaign details and donation interface
    │   ├── create/page.tsx           # Create a new campaign form
    │   └── dashboard/page.tsx        # Creator management dashboard
    │
    ├── components/
    │   ├── DonationModal.tsx         # Toggle between Private/Public donations
    │   ├── DonorWall.tsx             # Displays public and anonymous donors
    │   ├── MilestoneConfetti.tsx     # Celebration animation for goals reached
    │   ├── CampaignCard.tsx          # Reusable campaign display card
    │   └── StatCard.tsx              # Reusable statistics card
    │
    └── lib/
        ├── contract.ts               # ABI and TypeScript interface definitions
        ├── wagmi.ts                  # Wagmi and RainbowKit configuration setup
        └── utils.ts                  # Formatting and utility functions
```

---

## License

This project is licensed under the **MIT License**.

*Built for the Zama Developer Program Builder Track.*
