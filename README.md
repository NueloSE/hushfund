# HushFund 🔒

> **"Fundraise Transparently. Donate Privately."**

A privacy-preserving crowdfunding platform built for the **Zama Developer Program Hackathon**, demonstrating real-world use of Fully Homomorphic Encryption (FHE) via [Zama fhEVM](https://docs.zama.ai/fhevm).

---

## Core Concept

| What        | Visibility     |
|-------------|----------------|
| Campaign totals | ✅ Public always |
| Individual donations | 🔒 Donor's choice (FHE-encrypted or public) |
| FHE computation | ⛓️ On-chain homomorphic addition — plaintext never revealed |

---

## Stack

| Layer | Tech |
|-------|------|
| Smart Contracts | Solidity 0.8.24 + `@fhevm/solidity` |
| FHE | Zama fhEVM (`FHE.fromExternal`, `FHE.add`, `FHE.allowThis`) |
| Frontend | Next.js 14, TailwindCSS |
| Web3 | wagmi v2, viem, RainbowKit |
| Dev | Hardhat 2, ethers.js |

---

## Quick Start

### 1. Smart Contracts

```bash
cd contracts
npm install

# Compile
npm run compile

# Run tests
npm test

# Local node
npm run node

# Deploy (new terminal)
npm run deploy:local
```

Copy the deployed contract address.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local — paste your contract address into NEXT_PUBLIC_CONTRACT_ADDRESS
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. MetaMask Setup

- Add network: **localhost:8545**, Chain ID **31337**
- Import an account from `npx hardhat node` output (copy a private key)

---

## Project Structure

```
hushfund-zama/
├── contracts/
│   ├── contracts/HushFund.sol      # Core contract with FHE encrypted donations
│   ├── scripts/deploy.ts
│   ├── test/HushFund.test.ts
│   └── hardhat.config.cjs
└── frontend/
    ├── app/
    │   ├── page.tsx                 # Landing page
    │   ├── explore/page.tsx         # Browse campaigns
    │   ├── campaign/[id]/page.tsx   # Campaign detail + donate
    │   ├── create/page.tsx          # Create campaign form
    │   └── dashboard/page.tsx       # Creator dashboard
    ├── components/
    │   ├── DonationModal.tsx        # Private/Public donation toggle
    │   ├── DonorWall.tsx            # Shows public + anonymous donors
    │   ├── MilestoneConfetti.tsx    # Confetti on goal reached
    │   ├── CampaignCard.tsx
    │   └── StatCard.tsx
    └── lib/
        ├── contract.ts             # ABI + TypeScript types
        ├── wagmi.ts                # Wagmi + RainbowKit config
        └── utils.ts                # Formatting helpers
```

---

## FHE Integration

The `donatePrivate` function demonstrates FHE on-chain:

```solidity
// User encrypts amount client-side → submits handle + ZK proof
euint64 donation = FHE.fromExternal(encryptedHandle, inputProof);

// Homomorphic addition — contract NEVER sees the plaintext
euint64 newTotal = FHE.add(_encryptedTotal[campaignId], donation);

// Access control — creator and donor can decrypt
FHE.allowThis(newTotal);
FHE.allow(newTotal, c.creator);
FHE.allow(donation, msg.sender);
```

The contract accumulates a fully encrypted total via homomorphic addition. Decryption is only available to authorized parties via the Zama KMS gateway.

---

## Campaign Modes

| Mode | Behavior |
|------|----------|
| **Milestone** | Funds locked until goal reached; confetti celebration on hit |
| **Flexible** | No goal; creator can withdraw any time |

---

## License

MIT — Built for the Zama Developer Program Builder Track.
