import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, Signer } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

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
  disconnect: () => void;
  switchToSepolia: () => Promise<void>;
}

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    chainId: null,
    provider: null,
    signer: null,
    error: null,
  });

  const getInjectedEthereum = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const eth = window.ethereum as any;
    if (!eth) return null;
    if (Array.isArray(eth.providers) && eth.providers.length > 0) {
      const metamaskProvider = eth.providers.find((p: any) => p?.isMetaMask);
      return metamaskProvider || eth.providers[0];
    }
    return eth;
  }, []);

  const isMetaMaskInstalled = useCallback(() => {
    return !!getInjectedEthereum();
  }, [getInjectedEthereum]);

  const handleAccountsChanged = useCallback(async (accounts: unknown) => {
    const accountList = accounts as string[];
    if (accountList.length === 0) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        signer: null,
        error: null,
      }));
    } else if (accountList[0] !== state.address) {
      const provider = new BrowserProvider(getInjectedEthereum()!);
      const signer = await provider.getSigner();
      setState(prev => ({
        ...prev,
        address: accountList[0],
        provider,
        signer,
      }));
    }
  }, [state.address]);

  const handleChainChanged = useCallback((chainId: unknown) => {
    const newChainId = parseInt(chainId as string, 16);
    setState(prev => ({
      ...prev,
      chainId: newChainId,
    }));

    window.location.reload();
  }, []);

  useEffect(() => {
    const eth = getInjectedEthereum();
    if (!eth) return;

    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);

    return () => {
      eth?.removeListener?.('accountsChanged', handleAccountsChanged);
      eth?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [getInjectedEthereum, handleAccountsChanged, handleChainChanged]);

  useEffect(() => {
    const checkConnection = async () => {
      const eth = getInjectedEthereum();
      if (!eth) return;

      try {
        const accounts = await eth.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length > 0) {
          const provider = new BrowserProvider(eth);
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          
          setState({
            isConnected: true,
            isConnecting: false,
            address: accounts[0],
            chainId: Number(network.chainId),
            provider,
            signer,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, [getInjectedEthereum, isMetaMaskInstalled]);

  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setState(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to continue.',
      }));
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const eth = getInjectedEthereum();
      if (!eth) throw new Error('Ethereum provider not found');

      const accounts = await eth.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts returned');
      }

      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setState({
        isConnected: true,
        isConnecting: false,
        address: accounts[0],
        chainId: Number(network.chainId),
        provider,
        signer,
        error: null,
      });
    } catch (error) {
      const err = error as Error & { code?: number };
      let errorMessage = 'Failed to connect wallet';
      
      if (err.code === 4001) {
        errorMessage = 'Connection request rejected. Please try again.';
      }
      
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  }, [isMetaMaskInstalled]);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      isConnecting: false,
      address: null,
      chainId: null,
      provider: null,
      signer: null,
      error: null,
    });
  }, []);

  const switchToSepolia = useCallback(async () => {
    const eth = getInjectedEthereum();
    if (!eth) return;

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (error) {
      const err = error as Error & { code?: number };
      
      if (err.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
        }
      }
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchToSepolia,
  };
}

export { SEPOLIA_CHAIN_ID };
