import { UserProviderTypes } from "../types/enums";
import useContractMethods from "../hooks/useContractMethods";
import {
  createContext,
  FC,
  ReactChild,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { UserTokenData } from "../types/interfaces";
import ContractProvider, { useContractProvider } from "./ContractProvider";

interface State {
  tokenBalances: UserTokenData[];
  totalUsdValue: number;
}

interface IContext {
  state: State;
  getTokenUSDBalances: () => Promise<void>;
}

const initialState: State = {
  tokenBalances: [],
  totalUsdValue: 0,
};

const Context = createContext<IContext>({
  state: initialState,
  getTokenUSDBalances: async () => {},
});

export const useUserProvider = () => useContext(Context);

const reducer = (state: State, action: any): State => {
  switch (action.type) {
    case UserProviderTypes.UPDATE_TOKEN_BALANCES:
      return { ...state, tokenBalances: action.tokenData, totalUsdValue: action.totalUsdValue };

    default:
      throw new Error();
  }
};

const UserProvider: FC<{ children: ReactChild }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { getUserUSDStakedBalances, getUserTokenBalances } = useContractMethods();
  const {
    state: { tokens },
  } = useContractProvider();

  const getTokenUSDBalances = useCallback(async () => {
    try {
      // const { tokenUSDBalances, totalUsdValue } = await getUserUSDStakedBalances(tokens);
      // const tokenBalances = await getUserTokenBalances(tokens);
      // ?: using Promise.all runs both promises concurrently 
      const promisesArr: any = [getUserUSDStakedBalances(tokens), getUserTokenBalances(tokens)];
      const [{ tokenUSDBalances, totalUsdValue }, tokenBalances] = await Promise.all(promisesArr);

      const tokenData: UserTokenData[] = tokens.map((address, index) => ({
        address,
        stakedUSDBalance: tokenUSDBalances[index],
        stakedBalance: tokenBalances[index],
      }));

      dispatch({ type: UserProviderTypes.UPDATE_TOKEN_BALANCES, tokenData, totalUsdValue });
    } catch (error) {
      console.log(error);
    }
  }, [getUserTokenBalances, getUserUSDStakedBalances, tokens]);

  const context = { state, getTokenUSDBalances };

  return <Context.Provider value={context}>{children}</Context.Provider>;
};

export default UserProvider;
