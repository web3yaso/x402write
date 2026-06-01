import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { Account, Chain, Client, Transport } from "viem";

/** Convert a viem WalletClient (from wagmi useWalletClient) into an ethers v6 JsonRpcSigner. */
export function walletClientToSigner(client: Client<Transport, Chain, Account>): JsonRpcSigner {
  const { account, chain, transport } = client;
  const network = { chainId: chain.id, name: chain.name };
  const provider = new BrowserProvider(transport as never, network);
  return new JsonRpcSigner(provider, account.address);
}
