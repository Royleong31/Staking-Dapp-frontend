import { Card } from "react-bootstrap";
import { Button, Slider, Input, Divider, CircularProgress } from "@mui/material";
import React, { useState, useMemo, useEffect } from "react";
import { useEthers, useToken, useTokenAllowance, useTokenBalance } from "@usedapp/core";
import { formatUnits } from "@ethersproject/units";
import useTransactions from "../hooks/useTransactions";
import contractData from "../abi/Staking.json";
import useContractMethods from "../hooks/useContractMethods";

enum StakingButtonStatus {
  REQUIRES_APPROVAL,
  APPROVING,
  READY,
  STAKING,
}

enum UnstakingButtonStatus {
  READY,
  UNSTAKING,
}

export default function StakeContainer({
  tokenAddress,
  price,
  stakedBalance,
}: {
  tokenAddress: string;
  price: number;
  stakedBalance: number;
}) {
  const { address: stakingContractAddress } = contractData;
  const { account } = useEthers();
  const tokenData = useToken(tokenAddress);
  const walletBalance = useTokenBalance(tokenAddress, account);

  const symbol = tokenData?.symbol;
  const decimals = tokenData?.decimals;
  const { stakeTokenHandler, unstakeTokenHandler } = useTransactions();
  const { approveTokenHandler } = useContractMethods();
  const tokenAllowance = useTokenAllowance(tokenAddress, account, stakingContractAddress);

  const [stakeButtonStatus, setStakeButtonStatus] = useState(StakingButtonStatus.REQUIRES_APPROVAL);
  const [unstakeButtonStatus, setUnstakeButtonStatus] = useState(UnstakingButtonStatus.READY);

  useEffect(() => {
    if (tokenAllowance === undefined || walletBalance === undefined) return;

    if (
      stakeButtonStatus === StakingButtonStatus.APPROVING ||
      stakeButtonStatus === StakingButtonStatus.STAKING
    )
      return;

    if (tokenAllowance.gte(walletBalance) && walletBalance.gt(0)) {
      setStakeButtonStatus(StakingButtonStatus.READY);
    } else if (tokenAllowance.gt(0)) {
      setStakeButtonStatus(StakingButtonStatus.READY);
    } else {
      setStakeButtonStatus(StakingButtonStatus.REQUIRES_APPROVAL);
    }
  }, [tokenAllowance, walletBalance, account, symbol, stakeButtonStatus]);

  const formattedTokenBalance: number = walletBalance
    ? parseFloat(formatUnits(walletBalance, decimals))
    : 0;

  const [stakeValue, setStakeValue] = useState(0);
  const [unstakeValue, setUnstakeValue] = useState(0);

  const handleSlider = (event: any, newValue: any) => {
    setStakeValue(newValue);
  };

  const handleUnstakeSlider = (event: any, newValue: any) => {
    setUnstakeValue(newValue);
  };

  const handleStakeInput = (event: any) => {
    const inputtedValue = +event.target.value;

    if (inputtedValue < 0 || inputtedValue > formattedTokenBalance) return;
    setStakeValue(inputtedValue);
  };

  const handleUnstakeInput = (event: any) => {
    const inputtedValue = event.target.value;
    if (inputtedValue < 0 || inputtedValue > stakedBalance) return;
    setUnstakeValue(inputtedValue);
  };

  const stakingHandler = async () => {
    setStakeButtonStatus(StakingButtonStatus.STAKING);
    console.log("inside staking handler");
    await stakeTokenHandler(tokenAddress, stakeValue, decimals);
    setStakeButtonStatus(StakingButtonStatus.READY);
    // TODO: add error handling
  };

  const approveHandler = async () => {
    setStakeButtonStatus(StakingButtonStatus.APPROVING);
    await approveTokenHandler(tokenAddress);
    setStakeButtonStatus(StakingButtonStatus.READY);
  };

  const unstakingHandler = async () => {
    setUnstakeButtonStatus(UnstakingButtonStatus.UNSTAKING);
    await unstakeTokenHandler(tokenAddress, unstakeValue, decimals);
    setUnstakeButtonStatus(UnstakingButtonStatus.READY);
  };

  const stakeButtonText = useMemo(() => {
    if (stakeButtonStatus === StakingButtonStatus.READY)
      return `Stake ${stakeValue} ${symbol} ($${Math.round(stakeValue * price)})`;
    if (stakeButtonStatus === StakingButtonStatus.APPROVING) return "Approving...";
    if (stakeButtonStatus === StakingButtonStatus.STAKING) return "Staking...";
    if (stakeButtonStatus === StakingButtonStatus.REQUIRES_APPROVAL) return "Approve";
  }, [price, stakeButtonStatus, stakeValue, symbol]);

  const unstakeButtonText = useMemo(() => {
    if (unstakeButtonStatus === UnstakingButtonStatus.READY)
      return `Unstake ${unstakeValue} ${symbol} ($${Math.round(unstakeValue * price)})`;
    else return "Unstaking...";
  }, [price, symbol, unstakeButtonStatus, unstakeValue]);

  return (
    <Card border="primary" style={{ width: "18rem" }} className="mb-2">
      <Card.Header>
        {tokenData?.name} (${price}/{symbol})
      </Card.Header>
      <Card.Body>
        <Card.Title>Stake</Card.Title>

        <Input
          value={stakeValue}
          type="number"
          onChange={handleStakeInput}
          placeholder="Staking amount"
        />
        <Slider
          style={{ marginTop: "1rem", marginBottom: "1rem" }}
          value={stakeValue}
          min={0}
          step={0.01}
          max={formattedTokenBalance}
          onChange={handleSlider}
          valueLabelDisplay="auto"
        />
        <Button
          disabled={stakeValue === 0 && stakeButtonStatus === StakingButtonStatus.READY}
          variant="contained"
          onClick={
            stakeButtonStatus === StakingButtonStatus.READY ? stakingHandler : approveHandler
          }
        >
          {stakeButtonText}
        </Button>
      </Card.Body>

      <div style={{ padding: "0.5rem", paddingLeft: "1rem", backgroundColor: "#DBC" }}>
        Wallet Balance: {formattedTokenBalance} {symbol}
      </div>

      <Card.Body style={{ backgroundColor: "#F9DAD3" }}>
        <Card.Title>Unstake</Card.Title>

        <Input
          value={unstakeValue}
          type="number"
          onChange={handleUnstakeInput}
          placeholder="Staking amount"
        />
        <Slider
          value={unstakeValue}
          min={0}
          step={0.01}
          max={stakedBalance}
          onChange={handleUnstakeSlider}
          valueLabelDisplay="auto"
        />
        <Button color="warning" variant="contained" onClick={unstakingHandler}>
          {unstakeButtonText}
        </Button>
      </Card.Body>

      <Card.Footer>
        <small>
          Staked Balance: {stakedBalance}
          {symbol} (${price * stakedBalance})
        </small>
      </Card.Footer>
    </Card>
  );
}
