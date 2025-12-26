/**
 * Type declarations for FHEVM Relayer SDK from CDN
 */

declare global {
  interface Window {
    RelayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: any) => Promise<any>;
      SepoliaConfig: any;
    };
    relayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: any) => Promise<any>;
      SepoliaConfig: any;
    };
  }
}

export {};


