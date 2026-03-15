// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title HushFund
 * @author HushFund Team — Zama Developer Program Hackathon
 * @notice Privacy-preserving crowdfunding platform powered by Zama fhEVM.
 *
 *         CORE PRIVACY MODEL:
 *         - Campaign totals are always public (aggregate transparency)
 *         - Individual private donation amounts are encrypted via FHE
 *         - The contract adds to the FHE accumulator without knowing plaintext
 *         - Only authorized parties (creator/donor) can decrypt via Zama KMS
 *
 *         CAMPAIGN MODES:
 *           0 = MILESTONE — funds locked until goal is reached; refundable if deadline expires
 *           1 = FLEXIBLE  — creator can withdraw at any time
 */
contract HushFund is ZamaEthereumConfig {
    // ─────────── Constants ───────────
    uint8 public constant MILESTONE = 0;
    uint8 public constant FLEXIBLE = 1;
    uint256 public constant MIN_DONATION = 0.001 ether;

    // ─────────── Data Types ───────────
    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        string imageUrl;
        uint256 goalAmount;        // in wei; 0 for FLEXIBLE
        uint256 totalRaised;       // running ETH total (wei)
        uint256 donorCount;
        uint8 mode;                // MILESTONE or FLEXIBLE
        uint256 deadline;          // unix timestamp; 0 = no deadline
        bool milestoneReached;
        bool withdrawn;
        bool active;
    }

    struct PublicDonation {
        address donor;
        uint256 amount;            // wei
        string message;
        uint256 timestamp;
    }

    struct PrivateDonation {
        address donor;
        string message;
        uint256 timestamp;
    }

    // ─────────── Storage ───────────
    uint256 public campaignCount;

    mapping(uint256 => Campaign) public campaigns;

    // FHE encrypted accumulator per campaign.
    // The contract adds encrypted donation amounts homomorphically without
    // seeing the plaintext. Only authorized parties (creator/donor) can decrypt.
    mapping(uint256 => euint64) private _encryptedTotal;

    // Per-campaign donation lists
    mapping(uint256 => PublicDonation[]) private _publicDonations;
    mapping(uint256 => PrivateDonation[]) private _privateDonations;

    // ETH held per campaign (to support multiple campaigns in one contract)
    mapping(uint256 => uint256) private _campaignBalance;

    // Track individual contributions for refunds (donor => campaignId => amount)
    mapping(address => mapping(uint256 => uint256)) private _donorContributions;

    // ─────────── Events ───────────
    event CampaignCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        uint8 mode
    );
    event CampaignUpdated(uint256 indexed id);
    event CampaignClosed(uint256 indexed id, address indexed creator);
    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        bool isPrivate,
        uint256 amount           // 0 for private (amount hidden)
    );
    event MilestoneReached(uint256 indexed campaignId, uint256 totalRaised);
    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );
    event RefundClaimed(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount
    );

    // ─────────── Errors ───────────
    error CampaignNotFound(uint256 id);
    error NotCampaignCreator();
    error CampaignNotActive();
    error GoalNotReachedYet();
    error AlreadyWithdrawn();
    error InsufficientDonation();
    error DeadlineExpired();
    error DeadlineNotExpired();
    error TransferFailed();
    error RefundNotAvailable();
    error NothingToRefund();

    // ─────────── Modifiers ───────────
    modifier campaignExists(uint256 id) {
        if (id == 0 || id > campaignCount) revert CampaignNotFound(id);
        _;
    }

    modifier onlyCreator(uint256 id) {
        if (campaigns[id].creator != msg.sender) revert NotCampaignCreator();
        _;
    }

    modifier campaignActive(uint256 id) {
        Campaign storage c = campaigns[id];
        if (!c.active) revert CampaignNotActive();
        if (c.deadline != 0 && block.timestamp > c.deadline)
            revert DeadlineExpired();
        _;
    }

    // ═══════════════════════════════════════════════════════════════
    //                     CAMPAIGN MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Create a new fundraising campaign.
     * @param title       Campaign title
     * @param description Campaign description
     * @param imageUrl    URL for campaign image
     * @param goalAmount  Funding goal in wei (0 for FLEXIBLE mode)
     * @param mode        0 = MILESTONE, 1 = FLEXIBLE
     * @param deadline    Unix timestamp deadline (0 = no deadline)
     * @return id         The new campaign ID
     */
    function createCampaign(
        string calldata title,
        string calldata description,
        string calldata imageUrl,
        uint256 goalAmount,
        uint8 mode,
        uint256 deadline
    ) external returns (uint256 id) {
        require(mode == MILESTONE || mode == FLEXIBLE, "Invalid mode");
        require(bytes(title).length > 0, "Title required");
        if (mode == MILESTONE) {
            require(goalAmount > 0, "Milestone campaigns need a goal");
        }
        if (deadline != 0) {
            require(deadline > block.timestamp, "Deadline must be in the future");
        }

        id = ++campaignCount;
        campaigns[id] = Campaign({
            id: id,
            creator: msg.sender,
            title: title,
            description: description,
            imageUrl: imageUrl,
            goalAmount: goalAmount,
            totalRaised: 0,
            donorCount: 0,
            mode: mode,
            deadline: deadline,
            milestoneReached: false,
            withdrawn: false,
            active: true
        });

        // Initialize encrypted accumulator to 0
        euint64 zero = FHE.asEuint64(0);
        FHE.allowThis(zero);
        _encryptedTotal[id] = zero;

        emit CampaignCreated(id, msg.sender, title, mode);
    }

    /**
     * @notice Update campaign description or image while it's still active.
     *         Only the creator can update.
     * @param campaignId  Campaign to update
     * @param description New description (pass "" to keep existing)
     * @param imageUrl    New image URL (pass "" to keep existing)
     */
    function updateCampaign(
        uint256 campaignId,
        string calldata description,
        string calldata imageUrl
    ) external campaignExists(campaignId) onlyCreator(campaignId) {
        Campaign storage c = campaigns[campaignId];
        require(c.active, "Campaign is closed");

        if (bytes(description).length > 0) {
            c.description = description;
        }
        if (bytes(imageUrl).length > 0) {
            c.imageUrl = imageUrl;
        }

        emit CampaignUpdated(campaignId);
    }

    /**
     * @notice Creator can close their campaign at any time.
     *         Stops accepting new donations.
     * @param campaignId Campaign to close
     */
    function closeCampaign(
        uint256 campaignId
    ) external campaignExists(campaignId) onlyCreator(campaignId) {
        Campaign storage c = campaigns[campaignId];
        require(c.active, "Already closed");
        c.active = false;
        emit CampaignClosed(campaignId, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════
    //                          DONATIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Donate privately. The donation amount is encrypted client-side
     *         using the global FHE public key. The contract adds it to the
     *         encrypted accumulator without ever seeing the plaintext.
     *
     *         The ETH value must still be sent via msg.value so funds can be
     *         held on-chain. It is added to totalRaised for public tracking.
     *         The ENCRYPTED accumulator mirrors the sum homomorphically.
     *
     * @param campaignId       Campaign to donate to
     * @param encryptedHandle  Client-side encrypted donation amount (euint64 handle)
     * @param inputProof       ZK proof of plaintext knowledge
     * @param message          Public or encrypted message from donor
     */
    function donatePrivate(
        uint256 campaignId,
        externalEuint64 encryptedHandle,
        bytes calldata inputProof,
        string calldata message
    ) external payable campaignExists(campaignId) campaignActive(campaignId) {
        if (msg.value < MIN_DONATION) revert InsufficientDonation();

        Campaign storage c = campaigns[campaignId];

        // Validate and unwrap the encrypted donation (FHE core operation)
        euint64 donation = FHE.fromExternal(encryptedHandle, inputProof);

        // Homomorphic addition: add encrypted donation to encrypted running total
        // Neither the contract nor the network sees the plaintext at this point
        euint64 newTotal = FHE.add(_encryptedTotal[campaignId], donation);

        // Grant this contract persistent access to the new total handle
        FHE.allowThis(newTotal);
        // Grant the campaign creator access to decrypt the accumulator
        FHE.allow(newTotal, c.creator);
        // Also grant the donor access to their own donation handle
        FHE.allow(donation, msg.sender);

        _encryptedTotal[campaignId] = newTotal;

        // Update public bookkeeping (msg.value is visible on-chain, that's expected)
        c.totalRaised += msg.value;
        c.donorCount++;
        _campaignBalance[campaignId] += msg.value;
        _donorContributions[msg.sender][campaignId] += msg.value;

        _privateDonations[campaignId].push(
            PrivateDonation({
                donor: msg.sender,
                message: message,
                timestamp: block.timestamp
            })
        );

        // Check milestone
        if (
            c.mode == MILESTONE &&
            !c.milestoneReached &&
            c.totalRaised >= c.goalAmount
        ) {
            c.milestoneReached = true;
            emit MilestoneReached(campaignId, c.totalRaised);
        }

        emit DonationReceived(campaignId, msg.sender, true, 0);
    }

    /**
     * @notice Donate publicly. Donation amount is stored in plaintext and
     *         visible on the donor wall.
     * @param campaignId Campaign to donate to
     * @param message    Public message from the donor
     */
    function donatePublic(
        uint256 campaignId,
        string calldata message
    ) external payable campaignExists(campaignId) campaignActive(campaignId) {
        if (msg.value < MIN_DONATION) revert InsufficientDonation();

        Campaign storage c = campaigns[campaignId];

        c.totalRaised += msg.value;
        c.donorCount++;
        _campaignBalance[campaignId] += msg.value;
        _donorContributions[msg.sender][campaignId] += msg.value;

        _publicDonations[campaignId].push(
            PublicDonation({
                donor: msg.sender,
                amount: msg.value,
                message: message,
                timestamp: block.timestamp
            })
        );

        // Check milestone
        if (
            c.mode == MILESTONE &&
            !c.milestoneReached &&
            c.totalRaised >= c.goalAmount
        ) {
            c.milestoneReached = true;
            emit MilestoneReached(campaignId, c.totalRaised);
        }

        emit DonationReceived(campaignId, msg.sender, false, msg.value);
    }

    // ═══════════════════════════════════════════════════════════════
    //                    WITHDRAWAL & REFUNDS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Withdraw raised funds to the campaign creator.
     *         For MILESTONE campaigns: only after goal is reached.
     *         For FLEXIBLE campaigns: any time.
     * @param campaignId Campaign to withdraw from
     */
    function withdrawFunds(
        uint256 campaignId
    )
        external
        campaignExists(campaignId)
        onlyCreator(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        if (c.withdrawn) revert AlreadyWithdrawn();
        if (c.mode == MILESTONE && !c.milestoneReached)
            revert GoalNotReachedYet();

        uint256 amount = _campaignBalance[campaignId];
        require(amount > 0, "Nothing to withdraw");

        c.withdrawn = true;
        c.active = false;
        _campaignBalance[campaignId] = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit FundsWithdrawn(campaignId, msg.sender, amount);
    }

    /**
     * @notice Claim a refund for a MILESTONE campaign that failed to reach
     *         its goal before the deadline expired. Only available when:
     *         - Campaign mode is MILESTONE
     *         - Campaign has a deadline that has passed
     *         - Goal was NOT reached
     *         - Funds have NOT been withdrawn
     *         - Caller has contributed to the campaign
     *
     * @param campaignId Campaign to claim refund from
     */
    function claimRefund(
        uint256 campaignId
    ) external campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];

        // Refunds only for milestone campaigns that missed their deadline
        if (c.mode != MILESTONE) revert RefundNotAvailable();
        if (c.milestoneReached) revert RefundNotAvailable();
        if (c.withdrawn) revert RefundNotAvailable();
        if (c.deadline == 0 || block.timestamp <= c.deadline)
            revert DeadlineNotExpired();

        uint256 contributed = _donorContributions[msg.sender][campaignId];
        if (contributed == 0) revert NothingToRefund();

        // Mark campaign inactive on first refund claim
        if (c.active) {
            c.active = false;
        }

        // Zero out donor's contribution and update balances
        _donorContributions[msg.sender][campaignId] = 0;
        _campaignBalance[campaignId] -= contributed;
        c.totalRaised -= contributed;

        (bool ok, ) = payable(msg.sender).call{value: contributed}("");
        if (!ok) revert TransferFailed();

        emit RefundClaimed(campaignId, msg.sender, contributed);
    }

    // ═══════════════════════════════════════════════════════════════
    //                           VIEWS
    // ═══════════════════════════════════════════════════════════════

    function getCampaign(
        uint256 id
    ) external view campaignExists(id) returns (Campaign memory) {
        return campaigns[id];
    }

    function getPublicDonations(
        uint256 campaignId
    )
        external
        view
        campaignExists(campaignId)
        returns (PublicDonation[] memory)
    {
        return _publicDonations[campaignId];
    }

    function getPrivateDonations(
        uint256 campaignId
    )
        external
        view
        campaignExists(campaignId)
        returns (PrivateDonation[] memory)
    {
        return _privateDonations[campaignId];
    }

    function getCampaignBalance(
        uint256 campaignId
    ) external view campaignExists(campaignId) returns (uint256) {
        return _campaignBalance[campaignId];
    }

    /**
     * @notice Get the amount a specific donor has contributed to a campaign.
     *         Useful for refund eligibility checks on the frontend.
     */
    function getDonorContribution(
        uint256 campaignId,
        address donor
    ) external view campaignExists(campaignId) returns (uint256) {
        return _donorContributions[donor][campaignId];
    }

    /**
     * @notice Check if a campaign is eligible for refunds.
     *         Returns true if: MILESTONE mode, deadline passed, goal not reached, not withdrawn.
     */
    function isRefundable(
        uint256 campaignId
    ) external view campaignExists(campaignId) returns (bool) {
        Campaign storage c = campaigns[campaignId];
        return (
            c.mode == MILESTONE &&
            !c.milestoneReached &&
            !c.withdrawn &&
            c.deadline != 0 &&
            block.timestamp > c.deadline
        );
    }

    /**
     * @notice Get all campaigns (paginated). Returns up to `limit` campaigns
     *         starting from `offset` (1-indexed).
     */
    function getCampaigns(
        uint256 offset,
        uint256 limit
    ) external view returns (Campaign[] memory result) {
        uint256 total = campaignCount;
        if (offset == 0) offset = 1;
        if (offset > total) return new Campaign[](0);

        uint256 end = offset + limit - 1;
        if (end > total) end = total;
        uint256 count = end - offset + 1;

        result = new Campaign[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = campaigns[offset + i];
        }
    }

    /// @notice Receive ETH sent directly (not via donate functions)
    receive() external payable {}
}
