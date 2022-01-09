import { useCallback } from "react";
import { useUserProvider } from "../providers/UserProvider";
import useContractMethods from "./useContractMethods";
import { utils, Contract, constants } from "ethers";
import stakingData from "../abi/Staking.json";
import { ERC20Interface } from "@usedapp/core";

// Purpose of this hook is to abstract data away from the UI, can use it to update global state for the new data from the transactions as well as open modals/messages for error/success cases
// If all relevant state is handled locally, such as in Admin.tsx, then it does not need to be here

export default function useTransactions() {
  const { stakeToken, unstakeToken, addAllowedToken, issueTokens, withdrawFunds } =
    useContractMethods();
  const { getTokenUSDBalances } = useUserProvider();

  const stakeTokenHandler = useCallback(
    async (tokenAddress: string, amount: number) => {
      try {
        const result = await stakeToken(tokenAddress, utils.parseEther(amount.toString()));
        console.log(result);
        await getTokenUSDBalances();
      } catch (error) {
        console.log(error);
      }
    },
    [getTokenUSDBalances, stakeToken]
  );

  const unstakeTokenHandler = useCallback(
    async (tokenAddress: string, amount: number) => {
      try {
        const result = await unstakeToken(tokenAddress, utils.parseEther(amount.toString()));
        console.log(result);
        await getTokenUSDBalances();
      } catch (error) {
        console.log(error);
      }
    },
    [getTokenUSDBalances, unstakeToken]
  );



  // ?: Handled in Admin.tsx as state can be handled locally.
  // const addNewTokenHandler = useCallback(async ()=>{},[])
  // const issueTokensHandler = useCallback(async () => {}, []);
  // const withdrawFundsHandler = useCallback(async () => {}, []);

  return {
    stakeTokenHandler,
    unstakeTokenHandler,
    // addNewTokenHandler,
    // issueTokensHandler,
    // withdrawFundsHandler,
  };
}
