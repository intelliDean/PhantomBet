import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    const oracleAddress = process.env.CRE_ORACLE_ADDRESS;
    if (!oracleAddress) throw new Error("Missing CRE_ORACLE_ADDRESS in .env");

    const CRESettlementOracle = await ethers.getContractFactory("CRESettlementOracle");
    const oracle = CRESettlementOracle.attach(oracleAddress) as any;

    // Change these values to settle a specific market
    const marketId = 0; // The ID of the market to settle
    const outcome = "Yes"; // The winning outcome string

    console.log(`\nSettling Market #${marketId} with outcome: "${outcome}"...`);

    // receiveSettlement(marketId, outcome, proof)
    // We pass empty bytes for 'proof' as it's not checked in the current hackathon version
    const tx = await oracle.receiveSettlement(marketId, outcome, "0x");
    await tx.wait();

    console.log(`🎉 Market #${marketId} settled successfully!`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
