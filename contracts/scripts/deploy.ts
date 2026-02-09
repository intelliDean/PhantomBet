import { ethers } from "hardhat";

async function main() {
    console.log("Starting deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy PredictionMarket with deployer as temporary oracle
    //    This allows us to get the PM address to pass to the Oracle constructor
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    // Pass deployer address as temp oracle
    const predictionMarket = await PredictionMarket.deploy(deployer.address);
    await predictionMarket.waitForDeployment();
    const predictionMarketAddress = await predictionMarket.getAddress();

    console.log(`PredictionMarket deployed to: ${predictionMarketAddress}`);

    // 2. Deploy CRESettlementOracle
    const CRESettlementOracle = await ethers.getContractFactory("CRESettlementOracle");
    const oracle = await CRESettlementOracle.deploy(predictionMarketAddress);
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();

    console.log(`CRESettlementOracle deployed to: ${oracleAddress}`);

    // 3. Update PredictionMarket to use the real Oracle address
    const tx = await predictionMarket.setOracle(oracleAddress);
    await tx.wait();

    console.log("PredictionMarket Oracle address updated successfully.");

    // 4. Verify (Optional output for .env)
    console.log("\nAdd these to your .env file:");
    console.log(`PREDICTION_MARKET_ADDRESS=${predictionMarketAddress}`);
    console.log(`CRE_ORACLE_ADDRESS=${oracleAddress}`);
    console.log(`VITE_PREDICTION_MARKET_ADDRESS=${predictionMarketAddress}`);
    console.log(`VITE_CRE_ORACLE_ADDRESS=${oracleAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
