const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Deploy LendingPlatform contract
  const LendingPlatform = await hre.ethers.getContractFactory("LendingPlatform");
  const lendingPlatform = await LendingPlatform.deploy();
  await lendingPlatform.deployed();

  console.log(`LendingPlatform deployed to: ${lendingPlatform.address}`);

  // Save address to addresses.json
  const addresses = {
    LendingPlatform: lendingPlatform.address,
  };
  fs.writeFileSync("addresses.json", JSON.stringify(addresses, null, 2));

  // Verify LendingPlatform contract on Etherscan
  await hre.run("verify:verify", {
    address: lendingPlatform.address,
    constructorArguments: [],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("Error deploying the contract:", error);
  process.exitCode = 1;
});
