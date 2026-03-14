import { expect } from "chai";
import { ethers } from "hardhat";
import { HushFund } from "../typechain-types";

describe("HushFund", function () {
  let hushFund: HushFund;
  let owner: any;
  let user1: any;
  let user2: any;

  const MILESTONE = 0;
  const FLEXIBLE = 1;

  const ONE_ETH = ethers.parseEther("1");
  const HALF_ETH = ethers.parseEther("0.5");
  const TWO_ETH = ethers.parseEther("2");

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const HushFund = await ethers.getContractFactory("HushFund");
    hushFund = (await HushFund.deploy()) as HushFund;
    await hushFund.waitForDeployment();
  });

  // ─── Campaign Creation ───
  describe("createCampaign", () => {
    it("creates a MILESTONE campaign correctly", async () => {
      await hushFund.createCampaign(
        "Save the Ocean",
        "Help clean up our seas",
        "https://example.com/img.jpg",
        ONE_ETH,
        MILESTONE,
        0
      );

      const campaign = await hushFund.getCampaign(1);
      expect(campaign.id).to.equal(1);
      expect(campaign.creator).to.equal(owner.address);
      expect(campaign.title).to.equal("Save the Ocean");
      expect(campaign.mode).to.equal(MILESTONE);
      expect(campaign.goalAmount).to.equal(ONE_ETH);
      expect(campaign.active).to.be.true;
      expect(campaign.milestoneReached).to.be.false;
    });

    it("creates a FLEXIBLE campaign correctly (no goal)", async () => {
      await hushFund.createCampaign(
        "Open Source Fund",
        "Support our project",
        "",
        0,
        FLEXIBLE,
        0
      );

      const campaign = await hushFund.getCampaign(1);
      expect(campaign.mode).to.equal(FLEXIBLE);
      expect(campaign.goalAmount).to.equal(0);
    });

    it("emits CampaignCreated event", async () => {
      await expect(
        hushFund.createCampaign("Test", "Desc", "", ONE_ETH, MILESTONE, 0)
      )
        .to.emit(hushFund, "CampaignCreated")
        .withArgs(1, owner.address, "Test", MILESTONE);
    });

    it("reverts if MILESTONE has no goal", async () => {
      await expect(
        hushFund.createCampaign("Test", "Desc", "", 0, MILESTONE, 0)
      ).to.be.revertedWith("Milestone campaigns need a goal");
    });

    it("reverts if title is empty", async () => {
      await expect(
        hushFund.createCampaign("", "Desc", "", ONE_ETH, MILESTONE, 0)
      ).to.be.revertedWith("Title required");
    });

    it("increments campaignCount", async () => {
      await hushFund.createCampaign("A", "B", "", ONE_ETH, MILESTONE, 0);
      await hushFund.createCampaign("C", "D", "", 0, FLEXIBLE, 0);
      expect(await hushFund.campaignCount()).to.equal(2);
    });
  });

  // ─── Public Donations ───
  describe("donatePublic", () => {
    let campaignId: bigint;

    beforeEach(async () => {
      await hushFund.createCampaign(
        "Build a School",
        "Education matters",
        "",
        TWO_ETH,
        MILESTONE,
        0
      );
      campaignId = 1n;
    });

    it("records a public donation and updates totalRaised", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Go team!", { value: HALF_ETH });

      const campaign = await hushFund.getCampaign(campaignId);
      expect(campaign.totalRaised).to.equal(HALF_ETH);
      expect(campaign.donorCount).to.equal(1);
    });

    it("stores donation in public donations list", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Supporting you!", { value: ONE_ETH });

      const donations = await hushFund.getPublicDonations(campaignId);
      expect(donations.length).to.equal(1);
      expect(donations[0].donor).to.equal(user1.address);
      expect(donations[0].amount).to.equal(ONE_ETH);
      expect(donations[0].message).to.equal("Supporting you!");
    });

    it("emits DonationReceived event", async () => {
      await expect(
        hushFund
          .connect(user1)
          .donatePublic(campaignId, "Hi!", { value: ONE_ETH })
      )
        .to.emit(hushFund, "DonationReceived")
        .withArgs(campaignId, user1.address, false, ONE_ETH);
    });

    it("triggers MilestoneReached when goal is met", async () => {
      await expect(
        hushFund
          .connect(user1)
          .donatePublic(campaignId, "Over the top!", { value: TWO_ETH })
      )
        .to.emit(hushFund, "MilestoneReached")
        .withArgs(campaignId, TWO_ETH);

      const campaign = await hushFund.getCampaign(campaignId);
      expect(campaign.milestoneReached).to.be.true;
    });

    it("reverts if donation is 0", async () => {
      await expect(
        hushFund.connect(user1).donatePublic(campaignId, "Free?", { value: 0 })
      ).to.be.revertedWithCustomError(hushFund, "InsufficientDonation");
    });
  });

  // ─── Withdraw ───
  describe("withdrawFunds", () => {
    let campaignId: bigint;

    beforeEach(async () => {
      await hushFund.createCampaign(
        "Build a School",
        "Education matters",
        "",
        ONE_ETH,
        MILESTONE,
        0
      );
      campaignId = 1n;
    });

    it("allows creator to withdraw after MILESTONE reached", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Go!", { value: ONE_ETH });

      const before = await ethers.provider.getBalance(owner.address);
      const tx = await hushFund.withdrawFunds(campaignId);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const after = await ethers.provider.getBalance(owner.address);

      expect(after - before + gasUsed).to.be.closeTo(
        ONE_ETH,
        ethers.parseEther("0.001")
      );
    });

    it("reverts if MILESTONE not reached", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Partial", { value: HALF_ETH });

      await expect(
        hushFund.withdrawFunds(campaignId)
      ).to.be.revertedWithCustomError(hushFund, "GoalNotReachedYet");
    });

    it("reverts if non-creator attempts withdrawal", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Funds!", { value: ONE_ETH });

      await expect(
        hushFund.connect(user1).withdrawFunds(campaignId)
      ).to.be.revertedWithCustomError(hushFund, "NotCampaignCreator");
    });

    it("reverts on double withdrawal", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Go!", { value: ONE_ETH });
      await hushFund.withdrawFunds(campaignId);

      await expect(
        hushFund.withdrawFunds(campaignId)
      ).to.be.revertedWithCustomError(hushFund, "AlreadyWithdrawn");
    });

    it("FLEXIBLE campaign allows withdrawal any time", async () => {
      await hushFund.createCampaign(
        "Flexible Fund",
        "Open source",
        "",
        0,
        FLEXIBLE,
        0
      );
      const flexId = 2n;
      await hushFund
        .connect(user1)
        .donatePublic(flexId, "Anytime!", { value: HALF_ETH });
      await expect(hushFund.withdrawFunds(flexId)).to.not.be.reverted;
    });
  });

  // ─── Pagination ───
  describe("getCampaigns", () => {
    it("returns paginated campaigns", async () => {
      for (let i = 0; i < 3; i++) {
        await hushFund.createCampaign(
          `Campaign ${i + 1}`,
          "Desc",
          "",
          ONE_ETH,
          MILESTONE,
          0
        );
      }

      const page1 = await hushFund.getCampaigns(1, 2);
      expect(page1.length).to.equal(2);
      expect(page1[0].title).to.equal("Campaign 1");

      const page2 = await hushFund.getCampaigns(3, 5);
      expect(page2.length).to.equal(1);
      expect(page2[0].title).to.equal("Campaign 3");
    });
  });
});
