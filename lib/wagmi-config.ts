import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/** MetaMask-only connect (no RainbowKit / WalletConnect — see build design §1.1). */
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected({ target: "metaMask" })],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
