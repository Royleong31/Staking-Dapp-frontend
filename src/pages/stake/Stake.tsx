import { Card, Col, Row } from "react-bootstrap";
import { Button, Slider, Input, Divider, CircularProgress } from "@mui/material";
import React, { useEffect, useMemo } from "react";
import StakeContainer from "../../components/StakeContainer";
import { useContractProvider } from "../../providers/ContractProvider";
import { useUserProvider } from "../../providers/UserProvider";
import { useEthers } from "@usedapp/core";

export default function Stake() {
  const {
    state: { totalUsdValue, tokenBalances },
    getTokenUSDBalances,
  } = useUserProvider();
  const { account } = useEthers();

  useEffect(() => {
    getTokenUSDBalances();
  }, [getTokenUSDBalances]);

  const {
    state: { tokenPrices, tokens },
  } = useContractProvider();

  const displayTokens = useMemo(() => {
    if (account)
      return tokenBalances.map((token, i) => ({
        ...token,
        price: tokenPrices[i],
      }));

    return tokens.map((token, i) => ({
      address: token,
      price: tokenPrices[i],
      stakedBalance: 0,
    }));
  }, [account, tokenBalances, tokenPrices, tokens]);

  if (displayTokens.length === 0) return <CircularProgress />;

  return (
    <>
      <h1 style={{ margin: "auto", width: "80%", textAlign: "center", marginBottom: "3rem" }}>
        Total value of staked tokens: ${totalUsdValue}
      </h1>
      <Row xs={1} md={2} lg={3} className="g-4">
        {displayTokens.map(({ price, address, stakedBalance }, i) => (
          <Col key={i} style={{ display: "flex", justifyContent: "center" }}>
            <StakeContainer
              tokenAddress={address}
              price={tokenPrices[i]}
              stakedBalance={stakedBalance}
            />
          </Col>
        ))}
      </Row>
    </>
  );
}
