import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import axios from "axios";
import OpenAI from "openai";

dotenv.config({ path: "../.env" });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🚀 [PhantomBet Local-DON] Initializing local settlement node...");
    console.log("Using account:", deployer.address);

    if (!OPENAI_API_KEY || !NEWS_API_KEY) {
        throw new Error("Missing API Keys (OPENAI_API_KEY or NEWS_API_KEY) in root .env");
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const pmAddress = process.env.PREDICTION_MARKET_ADDRESS;
    const oracleAddress = process.env.CRE_ORACLE_ADDRESS;

    if (!pmAddress || !oracleAddress) {
        throw new Error("Missing contract addresses in .env");
    }

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const pm = PredictionMarket.attach(pmAddress) as any;

    const Oracle = await ethers.getContractFactory("CRESettlementOracle");
    const oracle = Oracle.attach(oracleAddress) as any;

    // 1. Discover markets ready for settlement
    console.log("\n🔍 Scanning blockchain for markets to settle...");
    const nextId = await pm.nextMarketId();
    const now = BigInt(Math.floor(Date.now() / 1000));

    let marketsFound = 0;

    for (let i = 0n; i < nextId; i++) {
        const market = await pm.markets(i);
        // market: [id, question, bettingDeadline, revealDeadline, revealed, finalOutcomeId, settled, totalPool]

        const isSettled = market.settled;
        const revealDeadline = market.revealDeadline;

        if (!isSettled && now > revealDeadline) {
            marketsFound++;
            const question = market.question;
            const outcomes = await pm.getMarketOutcomes(i);

            console.log(`\n📊 Processing Market #${i}: "${question}"`);

            // 2. Aggregate Data (NewsAPI)
            console.log("  - Fetching news articles for context...");
            let context = "";
            try {
                const newsResponse = await axios.get(`https://newsapi.org/v2/everything?q=${encodeURIComponent(question)}&sortBy=relevancy&pageSize=5&apiKey=${NEWS_API_KEY}`);
                if (newsResponse.data.status === "ok") {
                    context = newsResponse.data.articles
                        .slice(0, 5)
                        .map((a: any) => `Source: ${a.source.name}\nTitle: ${a.title}\nDescription: ${a.description}`)
                        .join("\n\n---\n\n");
                }
            } catch (e) {
                console.warn("  - Warning: Failed to fetch news context, using internal knowledge.");
            }

            // 3. AI Analysis (OpenAI)
            console.log("  - Running AI Analysis...");
            let decision = "";
            let confidence = 0;
            let reasoning = "";

            try {
                const prompt = `You are an objective fact-checker analyzing a prediction market question.
QUESTION: ${question}
POSSIBLE OUTCOMES: ${outcomes.join(", ")}
${context ? `EXTERNAL CONTEXT:\n${context}` : 'No external context available. Use your internal training data up to today.'}

TASK:
1. Determine which outcome is most accurate based on the evidence.
2. Provide your confidence level (0-1).
3. Explain your reasoning.

RESPOND IN THIS EXACT JSON FORMAT:
{
  "outcome": "the exact outcome from the list above",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`;

                const aiResponse = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.3,
                    response_format: { type: "json_object" }
                });

                const result = JSON.parse(aiResponse.choices[0].message.content || "{}");
                decision = result.outcome;
                confidence = result.confidence;
                reasoning = result.reasoning;

                console.log(`  - AI Decision: "${decision}" (Confidence: ${confidence})`);
                console.log(`  - Reasoning: ${reasoning}`);
            } catch (aiError: any) {
                if (aiError.code === 'insufficient_quota' || aiError.status === 429) {
                    console.warn("  - ⚠️ OpenAI Quota Exceeded! Falling back to MOCK MODE.");
                    decision = outcomes[0]; // Default to first outcome
                    confidence = 1.0;
                    reasoning = "MOCK MODE: AI quota exceeded, using fallback outcome for testing.";
                    console.log(`  - Mock Decision: "${decision}"`);
                } else {
                    throw aiError;
                }
            }

            // 4. Submit Settlement to Oracle
            console.log("  - Submitting settlement to on-chain Oracle...");
            try {
                const tx = await oracle.receiveSettlement(i, decision, "0x");
                console.log(`  - Transaction Sent: ${tx.hash}`);
                await tx.wait();
                console.log(`  - ✅ Market #${i} settled successfully!`);
            } catch (error: any) {
                console.error(`  - ❌ Failed to settle: ${error.message}`);
            }
        }
    }

    if (marketsFound === 0) {
        console.log("✅ No markets currently require settlement.");
    } else {
        console.log(`\n🎉 Processed ${marketsFound} markets.`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
