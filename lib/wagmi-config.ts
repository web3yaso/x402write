import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/** MetaMask-only connect (no RainbowKit / WalletConnect — see build design §1.1).
 *  cookieStorage + ssr persists the connection across navigations/reloads and
 *  lets the server hydrate it via cookieToInitialState (in the root layout). */
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected({ target: "metaMask" })],
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
