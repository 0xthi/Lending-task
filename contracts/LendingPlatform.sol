// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract LendingPlatform is ERC20, ReentrancyGuard {
    using Address for address payable;

    // Custom errors
    error InsufficientEther();
    error InsufficientShares();
    error ZeroAmount();

    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event PartialWithdraw(address indexed user, uint256 amount);

    constructor() ERC20("LendToken", "LEND") {
        // Initial minting of LendTokens to the contract itself
        _mint(address(this), 10000 * 10**decimals());
    }

    // Fallback function to receive Ether
    receive() external payable {}

    // Deposit Ether and mint LendTokens at a 1:1 ratio
    function deposit() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        uint256 shares = msg.value; // 1 Ether = 1 LendToken
        _mint(msg.sender, shares);

        emit Deposit(msg.sender, shares);
    }

    // Withdraw all Ether by burning all LendTokens
    function withdraw() external nonReentrant {
        uint256 shares = balanceOf(msg.sender); // Get the total shares of the user
        if (shares == 0) revert InsufficientShares(); // Check if the user has shares

        // Effects
        _burn(msg.sender, shares); // Burn all shares

        // Interactions
        payable(msg.sender).sendValue(shares); // Send the equivalent Ether

        emit Withdraw(msg.sender, shares); // Emit the withdraw event
    }

    // Partial withdrawal of Ether by burning a specified amount of LendTokens
    function withdrawPartial(uint256 shares) external nonReentrant {
        if (shares == 0) revert ZeroAmount(); // Check for zero amount
        if (balanceOf(msg.sender) < shares) revert InsufficientShares(); // Check for sufficient shares

        // Effects
        _burn(msg.sender, shares); // Burn the specified shares

        // Interactions
        payable(msg.sender).sendValue(shares); // Send the equivalent Ether

        emit PartialWithdraw(msg.sender, shares); // Emit the partial withdraw event
    }
}
