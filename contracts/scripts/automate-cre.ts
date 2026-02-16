import { spawn } from "child_process";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const POLLING_INTERVAL_MS = 60 * 1000; // 1 minute

function runSimulation() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🔄 Starting Settlement Sweep...`);

    // Using spawn to run the existing hardhat script
    const child = spawn("npx", ["hardhat", "run", "scripts/simulate-cre-locally.ts", "--network", "monad-testnet"], {
        stdio: "inherit",
        shell: true
    });

    child.on("close", (code) => {
        if (code === 0) {
            console.log(`[${new Date().toLocaleTimeString()}] ✅ Sweep Complete.`);
        } else {
            console.error(`[${new Date().toLocaleTimeString()}] ❌ Sweep Failed or Interrupted (Exit Code: ${code}).`);
        }

        console.log(`⏱️ Next check in ${POLLING_INTERVAL_MS / 1000} seconds...`);
    });
}

console.log("====================================================");
console.log("🛡️ PhantomBet Automated Local-DON Runner Started 🛡️");
console.log(`Interval: ${POLLING_INTERVAL_MS / 1000}s`);
console.log("Press Ctrl+C to stop.");
console.log("====================================================");

// Initial run
runSimulation();

// Polling loop
setInterval(runSimulation, POLLING_INTERVAL_MS);



// cd contracts
// npx hardhat run scripts/automate-cre.ts --network monad-testnet
