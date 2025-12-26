import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  const chainId = hre.network.config.chainId || 31337;
  const isLocalhost = chainId === 31337;
  
  // Deploy SecretBox contract
  // Note: SecretBox requires FHEVM support for constructor encryption
  // It can only be deployed on networks with FHEVM (Sepolia, Mainnet)
  if (isLocalhost) {
    console.log("\n⚠️  Skipping SecretBox deployment on localhost (Hardhat network doesn't support FHEVM encryption in constructor)");
    console.log("   To deploy SecretBox, use Sepolia testnet: pnpm deploy:sepolia");
  } else {
    console.log("Deploying SecretBox contract...");
    // Default rewards: [100, 200, 500, 1000, 5000] (example values)
    const rewards = [BigInt(100), BigInt(200), BigInt(500), BigInt(1000), BigInt(5000)];
    const SecretBox = await hre.ethers.getContractFactory("SecretBox");
    const secretBox = await SecretBox.deploy(rewards);
    await secretBox.waitForDeployment();
    const secretBoxAddress = await secretBox.getAddress();
    console.log(`SecretBox contract deployed to: ${secretBoxAddress}`);
    
    console.log("\n=== Deployment Summary ===");
    console.log(`SecretBox: ${secretBoxAddress}`);
    return;
  }
  
  console.log("\n=== Deployment Summary ===");
  console.log(`SecretBox: Skipped (requires FHEVM network)`);
}

// Export the main function for hardhat-deploy
export default main;