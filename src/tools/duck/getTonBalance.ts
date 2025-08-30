import { ethers } from "ethers";
import { getProvider, getAgentAddress } from "../../core/client";

export const getTonBalance = async ({ 
  walletAddress
}: { 
  walletAddress?: string;
}): Promise<string> => {
  try {
    const provider = getProvider();
    const agentAddress = getAgentAddress();
    
    // Validate wallet address if provided
    if (walletAddress && !ethers.isAddress(walletAddress)) {
      throw new Error("Invalid wallet address");
    }
    
    const addressToCheck = walletAddress || agentAddress;
    
    if (!provider) {
      throw new Error("Provider not initialized");
    }

    const balance = await provider.getBalance(addressToCheck);
    const formattedBalance = ethers.formatEther(balance);
    const numericBalance = parseFloat(formattedBalance);
    return `${numericBalance} TON`;
  } catch (error: any) {
    throw new Error(`Error: ${error.message}`);
  }
};
