const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying HushFund with account:", deployer.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH"
  );

  const HushFund = await hre.ethers.getContractFactory("HushFund");
  const hushFund = await HushFund.deploy();
  await hushFund.waitForDeployment();

  const address = await hushFund.getAddress();
  console.log("HushFund deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
