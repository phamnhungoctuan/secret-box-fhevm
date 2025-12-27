import { createAppKit } from "@reown/appkit/react";
import { sepolia } from "@reown/appkit/networks";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";

const projectId =
  import.meta.env.VITE_REOWN_PROJECT_ID ?? "d43bccd656d6c1a2f7c7693caab78e2c";

const metadata = {
  name: "Secret Box",
  description: "On-chain encrypted mystery box game powered by FHEVM",
  url: "https://zama.ai",
  icons: ["https://avatars.githubusercontent.com/u/37784886?s=200&v=4"],
};

createAppKit({
  adapters: [new EthersAdapter()],
  networks: [sepolia],
  metadata,
  projectId,
  features: {
    analytics: false,
    email: false,
    socials: false,
    onramp: false,
  },
});
