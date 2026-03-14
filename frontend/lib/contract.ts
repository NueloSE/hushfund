// ─── HushFund Contract ABI ───────────────────────────────────────────────────
// Update HUSHFUND_ADDRESS after deployment

export const HUSHFUND_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

export const HUSHFUND_ABI = [
  // ─── Campaign creation ───
  {
    name: "createCampaign",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title",       type: "string"  },
      { name: "description", type: "string"  },
      { name: "imageUrl",    type: "string"  },
      { name: "goalAmount",  type: "uint256" },
      { name: "mode",        type: "uint8"   },
      { name: "deadline",    type: "uint256" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },

  // ─── Donations ───
  {
    name: "donatePrivate",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "campaignId",       type: "uint256" },
      { name: "encryptedHandle",  type: "bytes32" },
      { name: "inputProof",       type: "bytes"   },
      { name: "message",          type: "string"  },
    ],
    outputs: [],
  },
  {
    name: "donatePublic",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "message",    type: "string"  },
    ],
    outputs: [],
  },

  // ─── Withdrawal ───
  {
    name: "withdrawFunds",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "campaignId", type: "uint256" }],
    outputs: [],
  },

  // ─── Views ───
  {
    name: "campaignCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getCampaign",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id",               type: "uint256" },
          { name: "creator",          type: "address" },
          { name: "title",            type: "string"  },
          { name: "description",      type: "string"  },
          { name: "imageUrl",         type: "string"  },
          { name: "goalAmount",       type: "uint256" },
          { name: "totalRaised",      type: "uint256" },
          { name: "donorCount",       type: "uint256" },
          { name: "mode",             type: "uint8"   },
          { name: "deadline",         type: "uint256" },
          { name: "milestoneReached", type: "bool"    },
          { name: "withdrawn",        type: "bool"    },
          { name: "active",           type: "bool"    },
        ],
      },
    ],
  },
  {
    name: "getCampaigns",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit",  type: "uint256" },
    ],
    outputs: [
      {
        name: "result",
        type: "tuple[]",
        components: [
          { name: "id",               type: "uint256" },
          { name: "creator",          type: "address" },
          { name: "title",            type: "string"  },
          { name: "description",      type: "string"  },
          { name: "imageUrl",         type: "string"  },
          { name: "goalAmount",       type: "uint256" },
          { name: "totalRaised",      type: "uint256" },
          { name: "donorCount",       type: "uint256" },
          { name: "mode",             type: "uint8"   },
          { name: "deadline",         type: "uint256" },
          { name: "milestoneReached", type: "bool"    },
          { name: "withdrawn",        type: "bool"    },
          { name: "active",           type: "bool"    },
        ],
      },
    ],
  },
  {
    name: "getPublicDonations",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "campaignId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "donor",     type: "address" },
          { name: "amount",    type: "uint256" },
          { name: "message",   type: "string"  },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getPrivateDonations",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "campaignId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "donor",     type: "address" },
          { name: "message",   type: "string"  },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },

  // ─── Events ───
  {
    name: "CampaignCreated",
    type: "event",
    inputs: [
      { name: "id",      type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "title",   type: "string",  indexed: false },
      { name: "mode",    type: "uint8",   indexed: false },
    ],
  },
  {
    name: "DonationReceived",
    type: "event",
    inputs: [
      { name: "campaignId", type: "uint256", indexed: true },
      { name: "donor",      type: "address", indexed: true },
      { name: "isPrivate",  type: "bool",    indexed: false },
      { name: "amount",     type: "uint256", indexed: false },
    ],
  },
  {
    name: "MilestoneReached",
    type: "event",
    inputs: [
      { name: "campaignId",  type: "uint256", indexed: true },
      { name: "totalRaised", type: "uint256", indexed: false },
    ],
  },
  {
    name: "FundsWithdrawn",
    type: "event",
    inputs: [
      { name: "campaignId", type: "uint256", indexed: true },
      { name: "creator",    type: "address", indexed: true },
      { name: "amount",     type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Campaign {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  imageUrl: string;
  goalAmount: bigint;
  totalRaised: bigint;
  donorCount: bigint;
  mode: number;
  deadline: bigint;
  milestoneReached: boolean;
  withdrawn: boolean;
  active: boolean;
}

export interface PublicDonation {
  donor: string;
  amount: bigint;
  message: string;
  timestamp: bigint;
}

export interface PrivateDonation {
  donor: string;
  message: string;
  timestamp: bigint;
}

export const CAMPAIGN_MODES = { MILESTONE: 0, FLEXIBLE: 1 } as const;
