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
import { ContractProviderTypes } from "../types/enums";

interface State {
  numberOfStakers: number;
  stakers: string[];
  numberOfTokens: number;
  tokens: string[]; // TODO: change to an object with token name, address, ticker, price, totalStaked
  tokenPrices: number[];
  TVL: number;
  owner: string;
}

interface IContext {
  state: State;
  setStakers: () => Promise<void>;
  setTokens: () => Promise<void>;
  setTVL: (stakers: string[]) => Promise<void>;
}

const initialState: State = {
  numberOfStakers: 0,
  stakers: [],
  numberOfTokens: 0,
  tokens: [],
  tokenPrices: [],
  TVL: 0,
  owner: "",
};

const Context = createContext<IContext>({
  state: initialState,
  setStakers: async () => {},
  setTokens: async () => {},
  setTVL: async () => {},
});

export const useContractProvider = () => useContext(Context);

const reducer = (state: State, action: any): State => {
  switch (action.type) {
    case ContractProviderTypes.UPDATE_STAKERS:
      return { ...state, stakers: action.stakers, numberOfStakers: action.numberOfStakers };

    case ContractProviderTypes.UPDATE_TOKENS:
      return {
        ...state,
        tokens: action.tokens,
        numberOfTokens: action.numberOfTokens,
        tokenPrices: action.tokenPrices,
      };

    case ContractProviderTypes.UPDATE_TVL:
      return { ...state, TVL: action.data };

    case ContractProviderTypes.UPDATE_OWNER:
      return { ...state, owner: action.ownerAddress };

    default:
      throw new Error();
  }
};

const ContractProvider: FC<{ children: ReactChild }> = ({ children }) => {
  const { getStakers, getAllowedTokens, getTVL, getTokenPrices, getContractOwnerAddress } =
    useContractMethods();
  const [state, dispatch] = useReducer(reducer, initialState);

  const setTVL = useCallback(
    async (stakers: string[]) => {
      const TVL = await getTVL(stakers);

      dispatch({
        type: ContractProviderTypes.UPDATE_TVL,
        data: TVL,
      });
    },
    [getTVL]
  );

  const setStakers = useCallback(async () => {
    const stakers = await getStakers();
    setTVL(stakers);

    dispatch({
      type: ContractProviderTypes.UPDATE_STAKERS,
      stakers,
      numberOfStakers: stakers.length,
    });
  }, [getStakers, setTVL]);

  // !: using state.stakers inside here will cause infinite rerender. Don't read state here
  const setTokens = useCallback(async () => {
    const tokens = await getAllowedTokens();
    const tokenPrices = await getTokenPrices(tokens);

    dispatch({
      type: ContractProviderTypes.UPDATE_TOKENS,
      tokens,
      numberOfTokens: tokens.length,
      tokenPrices,
    });
  }, [getAllowedTokens, getTokenPrices]);

  const getOwner = useCallback(async () => {
    const ownerAddress = await getContractOwnerAddress();

    dispatch({ type: ContractProviderTypes.UPDATE_OWNER, ownerAddress });
  }, [getContractOwnerAddress]);

  useEffect(() => {
    setStakers();
    setTokens();
    getOwner();
  }, [setStakers, setTokens, getOwner]);

  const context = {
    state,
    setStakers,
    setTokens,
    setTVL,
  };

  return <Context.Provider value={context}>{children}</Context.Provider>;
};

export default ContractProvider;
