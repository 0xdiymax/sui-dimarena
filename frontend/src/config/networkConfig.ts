import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { TESTNET_CARD_PACKAGE_ID } from "./constants";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    // devnet: {
    //   url: getFullnodeUrl("devnet"),
    // },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        cardPackageId: TESTNET_CARD_PACKAGE_ID,
      },
    },
    // mainnet: {
    //   url: getFullnodeUrl("mainnet"),
    // },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
