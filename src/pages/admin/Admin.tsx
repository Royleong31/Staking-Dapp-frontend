import { Input, Button, Alert } from "@mui/material";
import { useContractFunction, useEtherBalance, useEthers, useSendTransaction } from "@usedapp/core";
import { useState } from "react";
import { useContractProvider } from "../../providers/ContractProvider";
import StakingContractData from "../../abi/Staking.json";
import { utils, BigNumber } from "ethers";
import useContractMethods from "../../hooks/useContractMethods";
import { useEffect } from "react";
import { useMemo } from "react";
import { isAddress } from "@ethersproject/address";

export default function Admin() {
  const [payAmt, setPayAmt] = useState<number>();
  const [totalStakingRewards, setTotalStakingRewards] = useState("");
  const [newTokenAddress, setNewTokenAddress] = useState("");
  const [oracleAddress, setOracleAddress] = useState("");
  const stakingContractAddress = StakingContractData.address;
  const { formatEther, parseEther } = utils;

  const { account } = useEthers();
  const { getTotalStakingRewards, contract } = useContractMethods();

  const { sendTransaction, state: sendingState } = useSendTransaction({
    transactionName: "Send Ethereum",
  });
  const { state: issueTokensState, send: sendIssueTokens } = useContractFunction(
    contract,
    "issueTokens",
    { transactionName: "issueTokens" }
  );
  const { state: addAllowedTokenState, send: sendAddAllowedToken } = useContractFunction(
    contract,
    "addAllowedToken"
  );
  const { state: withdrawFundsState, send: sendWithdrawFunds } = useContractFunction(
    contract,
    "rug"
  );

  useEffect(() => {
    getTotalStakingRewards().then((amt) => {
      setTotalStakingRewards(formatEther(amt));
    });
  }, [formatEther, getTotalStakingRewards]);

  const {
    state: { owner },
  } = useContractProvider();

  const payContractHandler = async () => {
    const amount = payAmt ? payAmt.toString() : "";
    if (amount === "") return;
    await sendTransaction({ to: stakingContractAddress, value: parseEther(amount) });
  };

  const contractEthBalance = useEtherBalance(stakingContractAddress);
  const accountEthBalance = useEtherBalance(account);
  const formattedAccountEthBalance = accountEthBalance ? formatEther(accountEthBalance) : "0";
  const formattedContractEthBalance = contractEthBalance ? formatEther(contractEthBalance) : "0";

  const handleSendInput = (event: any) => {
    if (event.target.value === "") return setPayAmt(undefined);
    const value = parseEther(event.target.value.toString());
    if (value.lt(0)) return;
    setPayAmt(+formatEther(value));
  };

  const sendEthBtnState = useMemo(() => {
    switch (sendingState.status) {
      case "Mining":
        return "Sending Eth...";
      case "Exception":
        return "Trxn Failed!";
      default:
        return `Send ${payAmt ? payAmt : 0} ETH`;
    }
  }, [payAmt, sendingState.status]);

  const sendAddNewTokenBtnState = useMemo(() => {
    switch (addAllowedTokenState.status) {
      case "Mining":
        return "Adding Token...";
      case "Exception":
        return "Trxn Failed!";
      default:
        return `Add token`;
    }
  }, [addAllowedTokenState.status]);

  const issueTokensBtnState = useMemo(() => {
    switch (issueTokensState.status) {
      case "Mining":
        return "Issuing tokens...";
      case "Exception":
        return "Something went wrong!";
      default:
        return "Issue tokens to stakers";
    }
  }, [issueTokensState.status]);

  const withdrawFundsBtnState = useMemo(() => {
    switch (withdrawFundsState.status) {
      case "Mining":
        return "Withdrawing funds...";
      case "Exception":
        return "Something went wrong!";
      default:
        return "Withdraw all ETH from contract";
    }
  }, [withdrawFundsState.status]);

  if (account !== owner) return <h1>You are not the owner!</h1>;

  const disableSendBtn = !!(payAmt && payAmt > +formattedAccountEthBalance);
  const disableAddToken =
    !!newTokenAddress &&
    !!oracleAddress &&
    (!isAddress(newTokenAddress) || !isAddress(oracleAddress));

  return (
    <>
      <h2>Your Eth Balance: {formattedAccountEthBalance} ETH</h2>
      <h2>Contract Eth Balance: {formattedContractEthBalance} ETH</h2>
      <h2>Total Staking Reward: {totalStakingRewards} ETH</h2>
      <hr />
      <label htmlFor="sendValue">Send ETH to contract: &nbsp;</label>
      <Input
        id="sendValue"
        placeholder="amount"
        type="number"
        value={payAmt}
        onChange={handleSendInput}
      />
      &nbsp;
      <Button disabled={disableSendBtn} variant="outlined" onClick={payContractHandler}>
        {sendEthBtnState}
      </Button>
      {disableSendBtn && <Alert severity="error">Send amount greater than account balance</Alert>}
      <hr />
      <h3>Add New token</h3>
      <label htmlFor="tokenAddress">New Token: &nbsp;</label>
      <Input
        id="tokenAddress"
        placeholder="address"
        value={newTokenAddress}
        onChange={(event) => setNewTokenAddress(event.target.value)}
      />
      <label htmlFor="oracleAddress">Oracle Address: &nbsp;</label>
      <Input
        id="oracleAddress"
        placeholder="address"
        value={oracleAddress}
        onChange={(event) => setOracleAddress(event.target.value)}
      />
      &nbsp;
      <Button
        disabled={disableAddToken}
        variant="outlined"
        onClick={() => sendAddAllowedToken(newTokenAddress, oracleAddress)}
      >
        {sendAddNewTokenBtnState}
      </Button>
      {disableAddToken && (
        <Alert severity="error">Both oracle and new token addresses need to be valid</Alert>
      )}
      <hr />
      <Button variant="contained" color="warning" onClick={() => sendIssueTokens()}>
        {issueTokensBtnState}
      </Button>
      <hr />
      <h3>Withdraw all ETH from contract</h3>
      <Button variant="contained" color="error" onClick={() => sendWithdrawFunds()}>
        {withdrawFundsBtnState}
      </Button>
    </>
  );
}
