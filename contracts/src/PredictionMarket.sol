// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @dev A privacy-first prediction market using commitment-reveal scheme.
 *      Integrated with Chainlink Runtime Environment (CRE) for AI-powered settlement.
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    // --- Structs ---

    struct Market {
        uint256 id;
        string question;
        string[] outcomes; // Possible outcomes (e.g., ["Yes", "No"])
        uint256 bettingDeadline;
        uint256 revealDeadline;
        bool revealed;
        string finalOutcome; // Set by Oracle
        bool settled;
        uint256 totalPool;
        mapping(string => uint256) outcomePools; // Outcome -> Total Amount Bet
    }

    struct Bet {
        bytes32 commitment; // keccak256(abi.encodePacked(amount, outcome, secret))
        uint256 amount;
        bool revealed;
        string revealedOutcome;
        address bettor;
    }

    // --- State Variables ---

    uint256 public nextMarketId;
    address public oracleAddress; // CRESettlementOracle address

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Bet[])) public bets; // MarketId -> User -> Bets

    // --- Events ---

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        uint256 bettingDeadline
    );
    event BetPlaced(
        uint256 indexed marketId,
        address indexed bettor,
        bytes32 commitment,
        uint256 amount
    );
    event BetRevealed(
        uint256 indexed marketId,
        address indexed bettor,
        string outcome,
        uint256 amount
    );
    event MarketSettled(uint256 indexed marketId, string outcome);
    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed bettor,
        uint256 amount
    );

    // --- Modifiers ---

    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Only Oracle can call this");
        _;
    }

    modifier beforeDeadline(uint256 marketId) {
        require(
            block.timestamp < markets[marketId].bettingDeadline,
            "Betting phase over"
        );
        _;
    }

    modifier duringRevealPhase(uint256 marketId) {
        require(
            block.timestamp >= markets[marketId].bettingDeadline,
            "Betting phase active"
        );
        require(
            block.timestamp < markets[marketId].revealDeadline,
            "Reveal phase over"
        );
        _;
    }

    modifier afterRevealPhase(uint256 marketId) {
        require(
            block.timestamp >= markets[marketId].revealDeadline,
            "Reveal phase active"
        );
        _;
    }

    // --- Constructor ---

    constructor(address _oracleAddress) Ownable(msg.sender) {
        oracleAddress = _oracleAddress;
    }

    // --- Core Functions ---

    /**
     * @notice Creates a new prediction market.
     * @param question The question to be predicted (e.g., "Will ETH hit $5k?").
     * @param outcomes List of possible outcomes (e.g., ["Yes", "No"]).
     * @param duration Duration of the betting phase in seconds.
     * @param revealDuration Duration of the reveal phase in seconds.
     */
    function createMarket(
        string memory question,
        string[] memory outcomes,
        uint256 duration,
        uint256 revealDuration
    ) external onlyOwner {
        require(duration > 0, "Duration must be positive");
        require(outcomes.length > 1, "Must have at least 2 outcomes");

        uint256 marketId = nextMarketId++;
        Market storage market = markets[marketId];

        market.id = marketId;
        market.question = question;
        market.outcomes = outcomes;
        market.bettingDeadline = block.timestamp + duration;
        market.revealDeadline = market.bettingDeadline + revealDuration;
        market.settled = false;

        emit MarketCreated(marketId, question, market.bettingDeadline);
    }

    /**
     * @notice Places a privacy-preserving bet using a commitment.
     * @param marketId The ID of the market to bet on.
     * @param commitment The hash of the bet details: keccak256(amount + outcome + secret).
     */
    function placeBet(
        uint256 marketId,
        bytes32 commitment
    ) external payable nonReentrant beforeDeadline(marketId) {
        require(msg.value > 0, "Bet amount must be > 0");

        bets[marketId][msg.sender].push(
            Bet({
                commitment: commitment,
                amount: msg.value,
                revealed: false,
                revealedOutcome: "",
                bettor: msg.sender
            })
        );

        markets[marketId].totalPool += msg.value;

        emit BetPlaced(marketId, msg.sender, commitment, msg.value);
    }

    /**
     * @notice Reveals a previously placed bet.
     * @param marketId The ID of the market.
     * @param outcome The outcome the user bet on.
     * @param secret The secret used to generate the commitment.
     * @param betIndex The index of the bet in the user's bet array.
     */
    function revealBet(
        uint256 marketId,
        string memory outcome,
        string memory secret,
        uint256 betIndex
    ) external nonReentrant duringRevealPhase(marketId) {
        Bet storage bet = bets[marketId][msg.sender][betIndex];
        require(!bet.revealed, "Bet already revealed");

        // Verify commitment
        // NOTE: We do not include msg.sender in the hash to allow for anonymity if desired in future upgrades,
        // but for now, the bet is tied to the msg.sender's storage anyway.
        // Commitment = keccak256(abi.encodePacked(amount, outcome, secret))
        bytes32 verifyHash = keccak256(
            abi.encodePacked(bet.amount, outcome, secret)
        );
        require(verifyHash == bet.commitment, "Invalid commitment");

        // Verify outcome is valid for this market
        bool validOutcome = false;
        for (uint i = 0; i < markets[marketId].outcomes.length; i++) {
            if (
                keccak256(bytes(markets[marketId].outcomes[i])) ==
                keccak256(bytes(outcome))
            ) {
                validOutcome = true;
                break;
            }
        }
        require(validOutcome, "Invalid outcome for this market");

        bet.revealed = true;
        bet.revealedOutcome = outcome;
        markets[marketId].outcomePools[outcome] += bet.amount;

        emit BetRevealed(marketId, msg.sender, outcome, bet.amount);
    }

    /**
     * @notice Settles the market with the final outcome. Only callable by the CRE Oracle.
     * @param marketId The ID of the market.
     * @param outcome The verified outcome.
     */
    function settleMarket(
        uint256 marketId,
        string memory outcome
    ) external onlyOracle afterRevealPhase(marketId) {
        Market storage market = markets[marketId];
        require(!market.settled, "Market already settled");

        market.finalOutcome = outcome;
        market.settled = true;

        emit MarketSettled(marketId, outcome);
    }

    /**
     * @notice Claims winnings for a settled market.
     * @param marketId The ID of the market.
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.settled, "Market not settled");

        uint256 payout = 0;
        uint256 totalWinningPool = market.outcomePools[market.finalOutcome];

        // If nobody won (e.g., all bets were on wrong outcome), the pot is locked (or could implement refund/burn)
        require(totalWinningPool > 0, "No winners in this market");

        Bet[] storage userBets = bets[marketId][msg.sender];
        // In a real implementation, we'd need to iterate carefully or use a withdrawal pattern to avoid gas limits
        for (uint i = 0; i < userBets.length; i++) {
            Bet storage bet = userBets[i];

            // Check if bet was revealed AND matched the final outcome
            if (
                bet.revealed &&
                keccak256(bytes(bet.revealedOutcome)) ==
                keccak256(bytes(market.finalOutcome))
            ) {
                // Calculate share: (UserBetAmount * TotalPool) / TotalWinningPool
                uint256 share = (bet.amount * market.totalPool) /
                    totalWinningPool;
                payout += share;

                // Prevent re-claiming: Mark as already processed
                // Simple way: set amount to 0 or revealed to false (with care)
                bet.amount = 0;
            }
        }

        require(payout > 0, "No winnings to claim");

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(marketId, msg.sender, payout);
    }

    /**
     * @notice Update Oracle Address
     */
    function setOracle(address _oracle) external onlyOwner {
        oracleAddress = _oracle;
    }
}
