/**
 * Blockchain interaction utilities for PhantomBet CRE Workflow using official SDK
 */

import {
    EVMClient,
    encodeCallMsg,
    hexToBytes,
    bytesToHex,
    type Runtime,
} from "@chainlink/cre-sdk";
import {
    parseAbi,
    encodeFunctionData,
    decodeFunctionResult,
    type Address,
} from "viem";
import type { Market } from "./types.js";

// ABI for the PredictionMarket
const MARKET_ABI = parseAbi([
    "function nextMarketId() view returns (uint256)",
    "function markets(uint256 marketId) view returns (uint256 id, string question, uint256 bettingDeadline, uint256 revealDeadline, bool revealed, uint256 finalOutcomeId, bool settled, uint256 totalPool)",
    "function getMarketOutcomes(uint256 marketId) view returns (string[])",
]);

export class BlockchainClient {
    private evmClient: EVMClient;
    private chainSelector: bigint;

    constructor(chainSelector: bigint = 2183018362218727504n) {
        this.chainSelector = chainSelector;
        this.evmClient = new EVMClient(this.chainSelector);
    }

    /**
     * Get all markets that are ready to be settled
     */
    async getMarketsToSettle(runtime: Runtime<any>, marketContract: string): Promise<Market[]> {
        try {
            // 1. Get nextMarketId
            const nextMarketIdData = encodeFunctionData({
                abi: MARKET_ABI,
                functionName: "nextMarketId",
            });

            const nextMarketIdResult = this.evmClient
                .callContract(runtime, {
                    call: encodeCallMsg({
                        from: "0x0000000000000000000000000000000000000000",
                        to: marketContract as Address,
                        data: nextMarketIdData,
                    }),
                })
                .result();

            const nextMarketId = decodeFunctionResult({
                abi: MARKET_ABI,
                functionName: "nextMarketId",
                data: bytesToHex(nextMarketIdResult.data),
            }) as bigint;

            const now = BigInt(Math.floor(Date.now() / 1000));
            const marketsToSettle: Market[] = [];

            // 2. Iterate through markets
            for (let i = 0n; i < nextMarketId; i++) {
                const marketDataCall = encodeFunctionData({
                    abi: MARKET_ABI,
                    functionName: "markets",
                    args: [i],
                });

                const marketResult = this.evmClient
                    .callContract(runtime, {
                        call: encodeCallMsg({
                            from: "0x0000000000000000000000000000000000000000",
                            to: marketContract as Address,
                            data: marketDataCall,
                        }),
                    })
                    .result();

                const [
                    id,
                    question,
                    bettingDeadline,
                    revealDeadline,
                    revealed,
                    finalOutcomeId,
                    settled,
                    totalPool,
                ] = decodeFunctionResult({
                    abi: MARKET_ABI,
                    functionName: "markets",
                    data: bytesToHex(marketResult.data),
                }) as [bigint, string, bigint, bigint, boolean, bigint, boolean, bigint];

                if (!settled && now > revealDeadline) {
                    // Fetch outcomes
                    const outcomes = await this.getMarketOutcomes(runtime, marketContract, i);

                    marketsToSettle.push({
                        id,
                        question,
                        outcomes,
                        bettingDeadline,
                        revealDeadline,
                        settled,
                        finalOutcomeId,
                        totalPool,
                    });
                }
            }

            return marketsToSettle;
        } catch (error) {
            runtime.log(`Error in getMarketsToSettle: ${error}`);
            return [];
        }
    }

    /**
     * Get outcomes for a specific market
     */
    async getMarketOutcomes(runtime: Runtime<any>, marketContract: string, marketId: bigint): Promise<string[]> {
        const outcomesDataCall = encodeFunctionData({
            abi: MARKET_ABI,
            functionName: "getMarketOutcomes",
            args: [marketId],
        });

        const outcomesResult = this.evmClient
            .callContract(runtime, {
                call: encodeCallMsg({
                    from: "0x0000000000000000000000000000000000000000",
                    to: marketContract as Address,
                    data: outcomesDataCall,
                }),
            })
            .result();

        return decodeFunctionResult({
            abi: MARKET_ABI,
            functionName: "getMarketOutcomes",
            data: bytesToHex(outcomesResult.data),
        }) as string[];
    }

    /**
     * Submit settlement report
     */
    async submitSettlement(runtime: Runtime<any>, oracleContract: string, report: any): Promise<any> {
        return this.evmClient
            .writeReport(runtime, {
                receiver: hexToBytes(oracleContract),
                report,
                $report: true,
            })
            .result();
    }
}
