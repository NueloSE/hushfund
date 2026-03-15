import { expect } from "chai";
import { ethers } from "hardhat";
import { HushFund } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

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
  const MIN_DONATION = ethers.parseEther("0.001");

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

    it("reverts if deadline is in the past", async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      await expect(
        hushFund.createCampaign("Test", "Desc", "", ONE_ETH, MILESTONE, pastTime)
      ).to.be.revertedWith("Deadline must be in the future");
    });

    it("increments campaignCount", async () => {
      await hushFund.createCampaign("A", "B", "", ONE_ETH, MILESTONE, 0);
      await hushFund.createCampaign("C", "D", "", 0, FLEXIBLE, 0);
      expect(await hushFund.campaignCount()).to.equal(2);
    });
  });

  // ─── Campaign Update ───
  describe("updateCampaign", () => {
    beforeEach(async () => {
      await hushFund.createCampaign("Original", "Old desc", "", ONE_ETH, MILESTONE, 0);
    });

    it("allows creator to update description", async () => {
      await hushFund.updateCampaign(1, "New description", "");
      const campaign = await hushFund.getCampaign(1);
      expect(campaign.description).to.equal("New description");
    });

    it("allows creator to update image URL", async () => {
      await hushFund.updateCampaign(1, "", "https://new-image.com/img.jpg");
      const campaign = await hushFund.getCampaign(1);
      expect(campaign.imageUrl).to.equal("https://new-image.com/img.jpg");
    });

    it("emits CampaignUpdated event", async () => {
      await expect(hushFund.updateCampaign(1, "Updated", ""))
        .to.emit(hushFund, "CampaignUpdated")
        .withArgs(1);
    });

    it("reverts if non-creator tries to update", async () => {
      await expect(
        hushFund.connect(user1).updateCampaign(1, "Hack", "")
      ).to.be.revertedWithCustomError(hushFund, "NotCampaignCreator");
    });
  });

  // ─── Close Campaign ───
  describe("closeCampaign", () => {
    beforeEach(async () => {
      await hushFund.createCampaign("To Close", "Desc", "", 0, FLEXIBLE, 0);
    });

    it("allows creator to close campaign", async () => {
      await hushFund.closeCampaign(1);
      const campaign = await hushFund.getCampaign(1);
      expect(campaign.active).to.be.false;
    });

    it("emits CampaignClosed event", async () => {
      await expect(hushFund.closeCampaign(1))
        .to.emit(hushFund, "CampaignClosed")
        .withArgs(1, owner.address);
    });

    it("reverts if non-creator tries to close", async () => {
      await expect(
        hushFund.connect(user1).closeCampaign(1)
      ).to.be.revertedWithCustomError(hushFund, "NotCampaignCreator");
    });

    it("reverts donations after campaign is closed", async () => {
      await hushFund.closeCampaign(1);
      await expect(
        hushFund.connect(user1).donatePublic(1, "Late!", { value: ONE_ETH })
      ).to.be.revertedWithCustomError(hushFund, "CampaignNotActive");
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

    it("tracks donor contribution amount", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "First!", { value: HALF_ETH });
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Second!", { value: HALF_ETH });

      const contribution = await hushFund.getDonorContribution(campaignId, user1.address);
      expect(contribution).to.equal(ONE_ETH);
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

    it("reverts if donation is below minimum", async () => {
      await expect(
        hushFund.connect(user1).donatePublic(campaignId, "Dust", { value: 100 })
      ).to.be.revertedWithCustomError(hushFund, "InsufficientDonation");
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

    it("emits FundsWithdrawn event", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Go!", { value: ONE_ETH });

      await expect(hushFund.withdrawFunds(campaignId))
        .to.emit(hushFund, "FundsWithdrawn")
        .withArgs(campaignId, owner.address, ONE_ETH);
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

  // ─── Refunds ───
  describe("claimRefund", () => {
    let campaignId: bigint;
    let deadline: number;

    beforeEach(async () => {
      const now = await time.latest();
      deadline = now + 3600; // 1 hour from now
      await hushFund.createCampaign(
        "Timed Campaign",
        "Must reach goal",
        "",
        TWO_ETH,
        MILESTONE,
        deadline
      );
      campaignId = 1n;
    });

    it("allows refund after deadline expires without reaching goal", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Hope!", { value: HALF_ETH });

      // Fast forward past deadline
      await time.increaseTo(deadline + 1);

      const before = await ethers.provider.getBalance(user1.address);
      const tx = await hushFund.connect(user1).claimRefund(campaignId);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const after = await ethers.provider.getBalance(user1.address);

      expect(after - before + gasUsed).to.be.closeTo(
        HALF_ETH,
        ethers.parseEther("0.001")
      );
    });

    it("emits RefundClaimed event", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Hope!", { value: HALF_ETH });

      await time.increaseTo(deadline + 1);

      await expect(hushFund.connect(user1).claimRefund(campaignId))
        .to.emit(hushFund, "RefundClaimed")
        .withArgs(campaignId, user1.address, HALF_ETH);
    });

    it("allows multiple donors to refund independently", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "From user1", { value: HALF_ETH });
      await hushFund
        .connect(user2)
        .donatePublic(campaignId, "From user2", { value: ONE_ETH });

      await time.increaseTo(deadline + 1);

      await expect(hushFund.connect(user1).claimRefund(campaignId)).to.not.be.reverted;
      await expect(hushFund.connect(user2).claimRefund(campaignId)).to.not.be.reverted;

      // Campaign balance should be 0 after both refund
      const balance = await hushFund.getCampaignBalance(campaignId);
      expect(balance).to.equal(0);
    });

    it("reverts if deadline has not expired", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Early", { value: HALF_ETH });

      await expect(
        hushFund.connect(user1).claimRefund(campaignId)
      ).to.be.revertedWithCustomError(hushFund, "DeadlineNotExpired");
    });

    it("reverts for FLEXIBLE campaigns", async () => {
      await hushFund.createCampaign("Flex", "Desc", "", 0, FLEXIBLE, 0);
      await hushFund
        .connect(user1)
        .donatePublic(2, "Flex!", { value: HALF_ETH });

      await expect(
        hushFund.connect(user1).claimRefund(2)
      ).to.be.revertedWithCustomError(hushFund, "RefundNotAvailable");
    });

    it("reverts if milestone was reached", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Big!", { value: TWO_ETH });

      await time.increaseTo(deadline + 1);

      await expect(
        hushFund.connect(user1).claimRefund(campaignId)
      ).to.be.revertedWithCustomError(hushFund, "RefundNotAvailable");
    });

    it("reverts if donor has no contributions", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Only user1", { value: HALF_ETH });

      await time.increaseTo(deadline + 1);

      await expect(
        hushFund.connect(user2).claimRefund(campaignId)
      ).to.be.revertedWithCustomError(hushFund, "NothingToRefund");
    });

    it("reverts on double refund", async () => {
      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Once!", { value: HALF_ETH });

      await time.increaseTo(deadline + 1);
      await hushFund.connect(user1).claimRefund(campaignId);

      await expect(
        hushFund.connect(user1).claimRefund(campaignId)
      ).to.be.revertedWithCustomError(hushFund, "NothingToRefund");
    });

    it("isRefundable returns correct value", async () => {
      expect(await hushFund.isRefundable(campaignId)).to.be.false;

      await hushFund
        .connect(user1)
        .donatePublic(campaignId, "Hope!", { value: HALF_ETH });

      await time.increaseTo(deadline + 1);
      expect(await hushFund.isRefundable(campaignId)).to.be.true;
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
