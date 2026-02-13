
const ZERODEV_PROJECT_ID = "94d57625-9d5e-413f-a2a3-98fc8d222654";
const CHAIN_ID = 10143;
const BUNDLER_URL = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/${CHAIN_ID}`;

console.log(`Checking Bundler at: ${BUNDLER_URL}`);

async function checkBundler() {
    const body = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_chainId",
        params: []
    });

    try {
        const start = Date.now();
        const response = await fetch(BUNDLER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body
        });
        const data = await response.json();
        const duration = Date.now() - start;

        console.log(`Status: ${response.status}`);
        console.log(`Time: ${duration}ms`);
        console.log("Response:", data);
    } catch (error) {
        console.error("Fetch error:", error.message);
    }
}

checkBundler();
