/**
 * Data source integrations for PhantomBet CRE Workflow using official SDK
 */

import {
    HTTPClient,
    type Runtime,
    consensusIdenticalAggregation,
} from "@chainlink/cre-sdk";
import type { DataSource, NewsAPIResponse } from "./types.js";

export class DataSourceClient {
    private httpClient: HTTPClient;

    constructor() {
        this.httpClient = new HTTPClient();
    }

    /**
     * Fetch news articles related to the market question
     */
    async fetchNewsAPI(runtime: Runtime<any>, query: string, apiKey: string): Promise<DataSource> {
        return runtime.runInNodeMode(
            async (nodeRuntime) => {
                const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
                    query
                )}&sortBy=relevancy&pageSize=5&apiKey=${apiKey}`;

                const request = this.httpClient.sendRequest(nodeRuntime, {
                    url,
                    method: "GET",
                });

                const response = request.result();
                const data = JSON.parse(new TextDecoder().decode(response.body)) as NewsAPIResponse;

                if (data.status !== "ok") {
                    throw new Error(`NewsAPI error: ${data.status}`);
                }

                const articles = data.articles
                    .slice(0, 5)
                    .map((article) => `${article.title}: ${article.description}`)
                    .join("\n\n");

                return {
                    name: "NewsAPI",
                    data: articles,
                    confidence: 0.8,
                    timestamp: Date.now(),
                };
            },
            // Consensus: For text data, consensus usually means nodes provide identical or similar strings.
            // We'll use consensusIdenticalAggregation to ensure all nodes agree on the exact string.
            consensusIdenticalAggregation()
        ).result();
    }

    /**
     * Fetch crypto price from CoinGecko
     */
    async fetchPrice(runtime: Runtime<any>, symbol: string, apiUrl: string): Promise<number | null> {
        return runtime.runInNodeMode(
            async (nodeRuntime) => {
                const symbolMap: Record<string, string> = {
                    btc: "bitcoin",
                    eth: "ethereum",
                    mon: "monad",
                };
                const coinId = symbolMap[symbol.toLowerCase()] || symbol.toLowerCase();

                const request = this.httpClient.sendRequest(nodeRuntime, {
                    url: `${apiUrl}/simple/price?ids=${coinId}&vs_currencies=usd`,
                    method: "GET",
                });

                const response = request.result();
                const data = JSON.parse(new TextDecoder().decode(response.body));
                return data[coinId]?.usd || null;
            },
            consensusIdenticalAggregation()
        ).result();
    }

    /**
     * Aggregate data from multiple sources
     */
    async aggregateData(runtime: Runtime<any>, question: string, config: any): Promise<DataSource[]> {
        const sources: DataSource[] = [];

        // Fetch News
        if (config.newsApiKey) {
            const newsData = await this.fetchNewsAPI(runtime, question, config.newsApiKey);
            if (newsData.confidence > 0) sources.push(newsData);
        }

        return sources;
    }
}
