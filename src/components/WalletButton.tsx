import { Button, Alert, AlertTitle } from "@mui/material";
import { ChainId, useEthers, useLocalStorage } from "@usedapp/core";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { UnsupportedChainIdError } from "@web3-react/core";
import useContractMethods from "../hooks/useContractMethods";
import useWeb3React from "@web3-react/core";

// export const metamask = new InjectedConnector({ supportedChainIds: [4] });

export default function WalletButton() {
  const { getAllowedTokens, getStakers } = useContractMethods();
  const { activateBrowserWallet, active, chainId, account, error, deactivate } = useEthers();
  // const { active, account, activate, deactivate } = useWeb3React();

  const [activateError, setActivateError] = useState("");
  const [walletStorage, setWalletStorage] = useLocalStorage("WalletType");

  const addOrSwitchToPolygonNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x89" }],
      });
    } catch (switchError: any) {
      //  TODO: Add rinkeby testnet to metamask
    }
  };

  const handleActivate = useCallback(() => {
    try {
      setActivateError("");
      activateBrowserWallet();
      setWalletStorage("Metamask");

      activateBrowserWallet(async (error: any) => {
        if (error instanceof UnsupportedChainIdError) {
          await addOrSwitchToPolygonNetwork();
          activateBrowserWallet();
        }
      });
    } catch (error) {}
  }, [activateBrowserWallet, setWalletStorage]);

  useEffect(() => {
    if (error !== undefined) console.log(error);

    if (error instanceof UnsupportedChainIdError) {
      console.log("activating");
      setActivateError("Switch to polygon");
    }
  }, [active, error, handleActivate]);

  const handleDisconnect = () => {
    deactivate();
    setWalletStorage("");
  };

  const isConnected = account !== undefined && account !== null && active;

  if (!isConnected)
    return (
      <>
        {activateError && (
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {activateError}
          </Alert>
        )}
        <Button
          onClick={handleActivate}
          variant="contained"
          color="secondary"
          style={{ marginLeft: "2rem" }}
        >
          Connect Wallet
        </Button>
      </>
    );

  return (
    <>
      <Button
        onClick={handleDisconnect}
        variant="outlined"
        color="secondary"
        style={{ marginLeft: "2rem" }}
      >
        Disconnect
      </Button>
    </>
  );
}
