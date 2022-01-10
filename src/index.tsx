import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./App";
import { Config, DAppProvider, ChainId, Rinkeby, Polygon } from "@usedapp/core";
import { Web3ReactProvider } from "@web3-react/core";
import { ethers } from "ethers";

function getLibrary(
  provider: any
): ethers.providers.Web3Provider | ethers.providers.StaticJsonRpcProvider {
  const library = new ethers.providers.Web3Provider(provider);

  // library.pollingInterval = 12000;
  return library;
}

// ?: Can be switched to other networks
const config: Config = {
  networks: [Polygon],
  readOnlyChainId: ChainId.Polygon,
  readOnlyUrls: {
    [ChainId.Polygon]: process.env.REACT_APP_POLYGON_KEY!,
  },
  autoConnect: true,
};

declare global {
  interface Window {
    ethereum: any;
  }
}

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={config}>
      {/* <Web3ReactProvider getLibrary={getLibrary}> */}
      <App />
      {/* </Web3ReactProvider> */}
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
