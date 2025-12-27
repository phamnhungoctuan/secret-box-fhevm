import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, Signer } from "ethers";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useDisconnect,
} from "@reown/appkit/react";

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
  error: string | null;
}

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
}

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export function useWallet(): UseWalletReturn {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { open } = useAppKit();
  const { disconnect: appKitDisconnect } = useDisconnect();

  const [state, setState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    chainId: null,
    provider: null,
    signer: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const syncWallet = async () => {
      if (!walletProvider || !isConnected || !address) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          address: null,
          chainId: null,
          provider: null,
          signer: null,
        }));
        return;
      }

      try {
        const provider = new BrowserProvider(walletProvider as any);
        const [signer, network] = await Promise.all([
          provider.getSigner(),
          provider.getNetwork(),
        ]);

        if (cancelled) return;

        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          address,
          chainId: Number(network.chainId),
          provider,
          signer,
          error: null,
        }));
      } catch (error) {
        if (cancelled) return;
        console.error("Error syncing wallet state:", error);
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          chainId: null,
          provider: null,
          signer: null,
          error: "Unable to access wallet provider",
        }));
      }
    };

    void syncWallet();

    return () => {
      cancelled = true;
    };
  }, [walletProvider, isConnected, address]);

  useEffect(() => {
    if (!walletProvider || typeof (walletProvider as any).on !== "function") {
      return;
    }

    const handleChainChanged = (newChainId: unknown) => {
      const parsed =
        typeof newChainId === "string"
          ? parseInt(newChainId, 16)
          : Number(newChainId);

      if (Number.isNaN(parsed)) return;

      setState((prev) => ({
        ...prev,
        chainId: parsed,
      }));
    };

    (walletProvider as any).on("chainChanged", handleChainChanged);

    return () => {
      (walletProvider as any).removeListener?.(
        "chainChanged",
        handleChainChanged
      );
    };
  }, [walletProvider]);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      await open();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: "Failed to connect wallet",
      }));
    } finally {
      setState((prev) => ({ ...prev, isConnecting: false }));
    }
  }, [open]);

  const disconnect = useCallback(async () => {
    try {
      await appKitDisconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    } finally {
      setState({
        isConnected: false,
        isConnecting: false,
        address: null,
        chainId: null,
        provider: null,
        signer: null,
        error: null,
      });
    }
  }, [appKitDisconnect]);

  const switchToSepolia = useCallback(async () => {
    if (!walletProvider) return;

    try {
      await (walletProvider as any).request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (error) {
      const err = error as Error & { code?: number };

      if (err.code === 4902) {
        try {
          await (walletProvider as any).request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [
                  "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
                ],
                blockExplorerUrls: ["https://sepolia.etherscan.io/"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
          setState((prev) => ({
            ...prev,
            error: "Failed to add Sepolia network",
          }));
        }
      } else {
        console.error("Failed to switch network:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to switch network",
        }));
      }
    }
  }, [walletProvider]);

  return {
    ...state,
    connect,
    disconnect,
    switchToSepolia,
  };
}

export { SEPOLIA_CHAIN_ID };
