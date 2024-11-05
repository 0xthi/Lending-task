const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingPlatform", function () {
    let lendingPlatform;
    let owner;
    let user;

    beforeEach(async function () {
        // Get the signers
        [owner, user] = await ethers.getSigners();

        // Deploy the LendingPlatform contract
        const LendingPlatform = await ethers.getContractFactory("LendingPlatform");
        lendingPlatform = await LendingPlatform.deploy();
        await lendingPlatform.deployed();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol for the LendToken", async function () {
            expect(await lendingPlatform.name()).to.equal("LendToken");
            expect(await lendingPlatform.symbol()).to.equal("LEND");
        });

        it("Should have an initial supply of LendTokens", async function () {
            const balance = await lendingPlatform.balanceOf(lendingPlatform.address);
            expect(await lendingPlatform.totalSupply()).to.equal(balance);
        });
    });

    describe("Deposits", function () {
        it("Should allow users to deposit Ether and mint LendTokens", async function () {
            const depositAmount = ethers.utils.parseEther("1.0"); // 1 Ether

            // User deposits Ether
            await lendingPlatform.connect(user).deposit({ value: depositAmount });

            // Check the user's LendToken balance after deposit
            const userBalance = await lendingPlatform.balanceOf(user.address);
            expect(userBalance).to.equal(depositAmount); // User should have 1 LendToken
        });

        it("Should revert if deposit amount is zero", async function () {
            await expect(lendingPlatform.connect(user).deposit({ value: 0 }))
                .to.be.revertedWithCustomError(lendingPlatform, "ZeroAmount");
        });
    });

    describe("Withdrawals", function () {
        it("Should allow users to withdraw Ether and burn shares", async function () {
            const depositAmount = ethers.utils.parseEther("1.0"); // 1 Ether

            // User deposits Ether
            await lendingPlatform.connect(user).deposit({ value: depositAmount });

            // User withdraws Ether
            const shares = await lendingPlatform.balanceOf(user.address);
            await expect(lendingPlatform.connect(user).withdraw())
                .to.emit(lendingPlatform, "Withdraw")
                .withArgs(user.address, shares);

            // Check the user's LendToken balance after withdrawal
            const userBalance = await lendingPlatform.balanceOf(user.address);
            expect(userBalance).to.equal(0); // User should have burned all shares
        });

        it("Should revert if user tries to withdraw without shares", async function () {
            await expect(lendingPlatform.connect(user).withdraw())
                .to.be.revertedWithCustomError(lendingPlatform, "InsufficientShares");
        });

        it("Should allow partial withdrawal of Ether by burning a specified amount of LendTokens", async function () {
            const depositAmount = ethers.utils.parseEther("1.0"); // 1 Ether

            // User deposits Ether
            await lendingPlatform.connect(user).deposit({ value: depositAmount });

            const sharesToWithdraw = ethers.utils.parseEther("0.5"); // 0.5 LendTokens
            await expect(lendingPlatform.connect(user).withdrawPartial(sharesToWithdraw))
                .to.emit(lendingPlatform, "PartialWithdraw")
                .withArgs(user.address, sharesToWithdraw);

            // Check the user's LendToken balance after partial withdrawal
            const userBalance = await lendingPlatform.balanceOf(user.address);
            expect(userBalance).to.equal(depositAmount.sub(sharesToWithdraw)); // User should have remaining shares
        });

        it("Should revert if withdrawal exceeds user's shares", async function () {
            const depositAmount = ethers.utils.parseEther("1.0"); // 1 Ether

            // User deposits Ether
            await lendingPlatform.connect(user).deposit({ value: depositAmount });

            // Attempt to withdraw more than the user's shares
            await expect(lendingPlatform.connect(user).withdrawPartial(depositAmount.mul(2)))
                .to.be.revertedWithCustomError(lendingPlatform, "InsufficientShares");
        });

        it("Should revert if partial withdrawal amount is zero", async function () {
            await expect(lendingPlatform.connect(user).withdrawPartial(0))
                .to.be.revertedWithCustomError(lendingPlatform, "ZeroAmount");
        });
    });

    describe("Fallback function", function () {
        it("Should accept Ether sent directly to the contract", async function () {
            const depositAmount = ethers.utils.parseEther("1.0"); // 1 Ether

            // Send Ether directly to the contract
            await owner.sendTransaction({
                to: lendingPlatform.address,
                value: depositAmount,
            });

            // Check the contract's balance
            const contractBalance = await ethers.provider.getBalance(lendingPlatform.address);
            expect(contractBalance).to.equal(depositAmount);
        });
    });
});