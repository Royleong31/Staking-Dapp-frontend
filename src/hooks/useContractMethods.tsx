import { ethers } from "ethers";
import { useEthers } from "@usedapp/core";
import { useMemo, useCallback } from "react";
import stakingContractData from "../abi/Staking.json";
import { ERC20Interface } from "@usedapp/core";
import { constants, utils } from "ethers";

const defaultProvider = new ethers.providers.StaticJsonRpcProvider(
  process.env.REACT_APP_RINKEBY_KEY!
);

interface Methods {
  contract: ethers.Contract;
  approveTokenHandler: (contractAddress: string) => Promise<any>;
  getStakers: () => Promise<string[]>;
  getAllowedTokens: () => Promise<string[]>;
  getTVL: (stakers: string[]) => Promise<number>;
  getTokenPrices: (tokens: string[]) => Promise<number[]>;
  getUserTokenBalances: (tokens: string[]) => Promise<number[]>;
  getUserUSDStakedBalances: (tokens: string[]) => Promise<{
    tokenUSDBalances: number[];
    totalUsdValue: number;
  }>;
  stakeToken: (tokenAddress: string, amount: ethers.BigNumber) => Promise<any>;
  unstakeToken: (tokenAddress: string, amount: ethers.BigNumber) => Promise<any>;
  getTotalStakingRewards: () => Promise<ethers.BigNumber>;
  addAllowedToken: (tokenAddress: string, oracleAddress: string) => Promise<any>;
  issueTokens: () => Promise<any>;
  withdrawFunds: () => Promise<any>;
  getContractOwnerAddress: () => Promise<string>;
}

const getContract = (
  address: string,
  abi: any,
  signer?: ethers.Signer | ethers.providers.Provider
) => {
  return new ethers.Contract(address, abi, signer);
};

export default function useContractMethods(): Methods {
  const { library, account } = useEthers();
  const { abi, address } = stakingContractData;

  const signer = useMemo(() => (library ? library.getSigner() : defaultProvider), [library]);
  const contract = useMemo(() => getContract(address, abi, signer), [abi, address, signer]);

  const approveTokenHandler = useCallback(
    async (contractAddress: string) => {
      try {
        const erc20Contract = getContract(contractAddress, ERC20Interface, signer);
        const tx = await erc20Contract.approve(address, constants.MaxUint256);
        return tx.wait();
      } catch (error) {
        console.log(error);
        // TODO: update the error message
      }
    },
    [address, signer]
  );

  const getStakers = useCallback(async () => {
    try {
      const number: ethers.BigNumber = await contract.numberOfStakers();

      const stakersPromises: Promise<string>[] = Array.from(
        { length: +number },
        (_: undefined, i: number) => {
          return contract.stakers(i);
        }
      );

      const allowedTokens = await Promise.all(stakersPromises);
      return allowedTokens;
    } catch (error) {
      console.log(error);
      return [];
    }
  }, [contract]);

  const getAllowedTokens = useCallback(async () => {
    try {
      const numberOfAllowedTokens: ethers.BigNumber = await contract.numberOfAllowedTokens();
      const allowedTokensPromises = Array.from(
        { length: +numberOfAllowedTokens },
        (_: undefined, i: number) => {
          return contract.allowedTokens(i);
        }
      );

      const allowedTokens = await Promise.all(allowedTokensPromises);
      return allowedTokens;
    } catch (error) {
      console.log(error);
      return [];
    }
  }, [contract]);

  // !: This method is extremely inefficient. Create a mapping for IERC20 => balance, and use the token price to find TVL
  const getTVL = useCallback(
    async (stakers: string[]) => {
      try {
        let TVL = 0;

        for (let i = 0; i < stakers.length; i++) {
          TVL += (await contract.getUserTotalUSDValue(stakers[i])).toNumber();
        }

        return TVL;
      } catch (error) {
        return 0;
      }
    },
    [contract]
  );

  const getTokenPrices = useCallback(
    async (tokens: string[]) => {
      const tokenPricesPromises = tokens.map((token) => contract.getTokenValue(token));
      const tokenPrices = await Promise.all(tokenPricesPromises);

      const tokenPricesInUSD = tokenPrices.map(
        ([price, decimals]) => Math.round((price.toNumber() * 10 ** 2) / 10 ** decimals) / 10 ** 2
      );

      return tokenPricesInUSD;
    },
    [contract]
  );

  // TODO: Combine this and getUserTokenBalances together. Use the token price to calculate the user's balance instead of calling functions multiple times. Basically do the work here instead of in the contract calls
  const getUserUSDStakedBalances = useCallback(
    async (tokens: string[]) => {
      const tokenUSDBalancesPromises: Promise<ethers.BigNumber>[] = tokens.map((token) =>
        contract.getUserSingleTokenUSDValue(account, token)
      );

      const tokenUSDBalances = (await Promise.all(tokenUSDBalancesPromises)).map(
        (balance) => balance.toNumber() // ?: balance is in USD, not in wei
      );

      const totalUsdValue = tokenUSDBalances.reduce((prev, cur) => prev + cur, 0);

      return { tokenUSDBalances, totalUsdValue };
    },
    [account, contract]
  );

  const getUserTokenBalances = useCallback(
    async (tokens: string[]) => {
      const tokenBalancesPromises: Promise<ethers.BigNumber>[] = tokens.map((token) =>
        contract.stakingBalances(token, account)
      );
      const tokenBalances = (await Promise.all(tokenBalancesPromises)).map(
        (balance) => +utils.formatEther(balance.toString())
      );

      return tokenBalances;
    },
    [account, contract]
  );

  const stakeToken = useCallback(
    async (tokenAddress: string, amount: ethers.BigNumber) => {
      const tx = await contract.stakeTokens(tokenAddress, amount);
      return tx.wait();
    },
    [contract]
  );

  const unstakeToken = useCallback(
    async (tokenAddress: string, amount: ethers.BigNumber) => {
      const tx = await contract.unstakeTokens(tokenAddress, amount);
      return tx.wait();
    },
    [contract]
  );

  const getTotalStakingRewards = useCallback(async () => {
    const amount: ethers.BigNumber = await contract.totalStakingRewards();
    return amount;
  }, [contract]);

  const getContractOwnerAddress = useCallback(async () => {
    const owner: string = await contract.owner();
    return owner;
  }, [contract]);

  // ?: Only Owner can call this function
  const addAllowedToken = useCallback(
    async (tokenAddress: string, oracleAddress: string) => {
      const tx = await contract.addAllowedToken(tokenAddress, oracleAddress);
      return tx.wait();
    },
    [contract]
  );

  // ?: Only Owner can call this function
  const issueTokens = useCallback(async () => {
    const tx = await contract.issueTokens();
    return tx.wait();
  }, [contract]);

  // ?: Only Owner can call this function
  const withdrawFunds = useCallback(async () => {
    const tx = await contract.rug();
    return tx.wait();
  }, [contract]);


  return {
    contract,
    approveTokenHandler,
    getStakers,
    getAllowedTokens,
    getTVL,
    getTokenPrices,
    getUserTokenBalances,
    getUserUSDStakedBalances,
    stakeToken,
    unstakeToken,
    getTotalStakingRewards,
    getContractOwnerAddress,
    addAllowedToken,
    issueTokens,
    withdrawFunds,
  };
}
