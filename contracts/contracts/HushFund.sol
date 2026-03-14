// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title HushFund
 * @notice Privacy-preserving crowdfunding platform powered by Zama fhEVM.
 *         Campaign totals are always public. Individual private donation amounts
 *         are encrypted via Fully Homomorphic Encryption — the contract adds to
 *         the FHE accumulator without ever knowing the plaintext amount.
 *
 *         Campaign Modes:
 *           0 = MILESTONE — locked until goal is reached
 *           1 = FLEXIBLE  — creator can withdraw at any time
 */
contract HushFund {
    // ─────────── Constants ───────────
    uint8 public constant MILESTONE = 0;
    uint8 public constant FLEXIBLE = 1;

    // ─────────── Data Types ───────────
    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        string imageUrl;
        uint256 goalAmount; // in wei; 0 for FLEXIBLE
        uint256 totalRaised; // running ETH total (wei)
        uint256 donorCount;
        uint8 mode; // MILESTONE or FLEXIBLE
        uint256 deadline; // unix timestamp; 0 = no deadline
        bool milestoneReached;
        bool withdrawn;
        bool active;
    }

    struct PublicDonation {
        address donor;
        uint256 amount; // wei
        string message;
        uint256 timestamp;
    }

    struct PrivateDonation {
        address donor;
        string message; // encrypted or plain, stored off-chain display
        uint256 timestamp;
    }

    // ─────────── Storage ───────────
    uint256 public campaignCount;

    mapping(uint256 => Campaign) public campaigns;

    // FHE encrypted accumulator per campaign (privacy showcase)
    // The contract adds encrypted donation amounts homomorphically without
    // seeing the plaintext. Only authorized parties (creator/donor) can decrypt.
    mapping(uint256 => euint64) private _encryptedTotal;

    // Per-campaign donation lists
    mapping(uint256 => PublicDonation[]) private _publicDonations;
    mapping(uint256 => PrivateDonation[]) private _privateDonations;

    // ETH held per campaign (to support multiple campaigns in one contract)
    mapping(uint256 => uint256) private _campaignBalance;

    // ─────────── Events ───────────
    event CampaignCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        uint8 mode
    );
    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        bool isPrivate,
        uint256 amount // 0 for private (amount hidden)
    );
    event MilestoneReached(uint256 indexed campaignId, uint256 totalRaised);
    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
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
    error TransferFailed();

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

    // ─────────── Campaign Management ───────────

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

    // ─────────── Donations ───────────

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
        if (msg.value == 0) revert InsufficientDonation();

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
        if (msg.value == 0) revert InsufficientDonation();

        Campaign storage c = campaigns[campaignId];

        c.totalRaised += msg.value;
        c.donorCount++;
        _campaignBalance[campaignId] += msg.value;

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

    // ─────────── Withdrawal ───────────

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

    // ─────────── Views ───────────

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
