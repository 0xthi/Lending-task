import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import addresses from '../../addresses.json'; // Import contract addresses
import LendingPlatformABI from '../../artifacts/contracts/LendingPlatform.sol/LendingPlatform.json'; // Import LendingPlatform ABI

function App() {
  const [account, setAccount] = useState('');
  const [lendingPlatformContract, setLendingPlatformContract] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [etherBalance, setEtherBalance] = useState('0');
  const [lendTokenBalance, setLendTokenBalance] = useState('0');
  const [vaultEtherBalance, setVaultEtherBalance] = useState('0');

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum); // Use BrowserProvider for MetaMask
        await provider.send("eth_requestAccounts", []); // Request account access
        const signer = await provider.getSigner();
        const account = await signer.getAddress();
        setAccount(account);

        // Initialize LendingPlatform contract
        const contractAddress = addresses.LendingPlatform;
        console.log("Contract Address:", contractAddress); // Log the contract address
        if (!contractAddress) {
          console.error("Contract address is not defined.");
          return;
        }
        const lendingPlatformContract = new ethers.Contract(contractAddress, LendingPlatformABI.abi, signer);
        console.log("LendingPlatform Contract:", lendingPlatformContract); // Log the contract object
        setLendingPlatformContract(lendingPlatformContract);

        // Fetch initial balances
        await fetchBalances(account, lendingPlatformContract, contractAddress);
      } else {
        alert("Please install MetaMask!");
      }
    };

    init();
  }, []);

  const fetchBalances = async (account, lendingPlatformContract, contractAddress) => {
    if (!lendingPlatformContract) {
      console.error("Contract is not initialized.");
      return; // Exit if contract is not ready
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum); // Use BrowserProvider to fetch balances

      // Check if account and contract address are valid
      if (!account) {
        console.error("Account is not initialized.");
        return;
      }
      if (!contractAddress) {
        console.error("Contract address is not initialized.");
        return;
      }

      // Fetch user's Ether balance in the lending pool
      const vaultEtherBalance = await provider.getBalance(contractAddress); // Get the balance of the contract itself
      // Fetch user's LendToken balance
      const lendTokenBalance = await lendingPlatformContract.balanceOf(account);
      // Fetch user's Ether balance
      const etherBalance = await provider.getBalance(account);

      // Update state with fetched balances
      setVaultEtherBalance(ethers.formatEther(vaultEtherBalance));
      setLendTokenBalance(ethers.formatUnits(lendTokenBalance, 18));
      setEtherBalance(ethers.formatEther(etherBalance));
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const depositEther = async () => {
    if (lendingPlatformContract && depositAmount) {
      try {
        const amount = ethers.parseEther(depositAmount); // Convert user input to Wei
        const tx = await lendingPlatformContract.deposit({ value: amount });
        await tx.wait(); // Wait for the transaction to be mined
        alert(`Deposited ${depositAmount} Ether to the vault!`);
        setDepositAmount(''); // Clear input after deposit
        await fetchBalances(account, lendingPlatformContract, addresses.LendingPlatform); // Update balances after deposit
      } catch (error) {
        console.error("Error depositing Ether:", error);
        alert("Transaction failed: " + error.message); // Show error message
      }
    }
  };

  const withdrawEther = async () => {
    if (lendingPlatformContract) {
      try {
        const shares = await lendingPlatformContract.balanceOf(account); // Get user's total shares
        const tx = await lendingPlatformContract.withdraw(); // Withdraw all LendTokens
        await tx.wait(); // Wait for the transaction to be mined
        alert(`Withdrew all LEND tokens!`);
        await fetchBalances(account, lendingPlatformContract, addresses.LendingPlatform); // Update balances after withdrawal
      } catch (error) {
        console.error("Error withdrawing LendToken:", error);
        alert("Transaction failed: " + error.message); // Show error message
      }
    }
  };

  const withdrawPartialEther = async () => {
    if (lendingPlatformContract && withdrawAmount) {
      try {
        const amount = ethers.parseUnits(withdrawAmount, 18); // Convert user input to Wei
        const tx = await lendingPlatformContract.withdrawPartial(amount); // Withdraw specified amount of LendTokens
        await tx.wait(); // Wait for the transaction to be mined
        alert(`Withdrew ${withdrawAmount} LEND tokens!`);
        setWithdrawAmount(''); // Clear input after withdrawal
        await fetchBalances(account, lendingPlatformContract, addresses.LendingPlatform); // Update balances after withdrawal
      } catch (error) {
        console.error("Error withdrawing LendToken:", error);
        alert("Transaction failed: " + error.message); // Show error message
      }
    }
  };

  return (
    <>
      <h1>Lending Vault</h1>
      <div className="card">
        <div>
          <input
            type="text"
            placeholder="Amount to deposit in Ether"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <button onClick={depositEther}>Deposit Ether to Vault</button>
        </div>
        <div>
          <input
            type="text"
            placeholder="Amount to withdraw in LEND"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <button onClick={withdrawPartialEther}>Withdraw Partial LendToken</button>
          <button onClick={withdrawEther}>Withdraw All LendToken</button>
        </div>
        <p>Connected account: {account}</p>
        <p>Ether Balance: {etherBalance} ETH</p>
        <p>LendToken Balance: {lendTokenBalance} LEND</p>
        <p>Vault Ether Balance: {vaultEtherBalance} ETH</p>
      </div>
    </>
  );
}

export default App;
