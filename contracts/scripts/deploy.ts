import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying HushFund with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH"
  );

  const HushFund = await ethers.getContractFactory("HushFund");
  const hushFund = await HushFund.deploy();
  await hushFund.waitForDeployment();

  const address = await hushFund.getAddress();
  console.log("✅ HushFund deployed to:", address);
  console.log("\nNext steps:");
  console.log("  1. Copy the address above");
  console.log(
    "  2. Set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.local"
  );
  console.log('  3. Copy ABI from artifacts/contracts/HushFund.sol/HushFund.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
