import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, Signer } from 'ethers';
import {
  initFHEVM,
  encryptBoxChoice,
  decryptReward,
  getSecretBoxContract,
  toHexString,
  FHEVM_CONFIG,
  FHEVMInstance,
} from '@/lib/fhevm';

const MAX_BOX_OPENS = 3;
const STORAGE_KEY_PREFIX = 'secretbox-boxes-opened';
const TOTAL_REWARD_KEY_PREFIX = 'secretbox-total-reward';

const getStorageKey = (address: string) =>
  `${STORAGE_KEY_PREFIX}-${address.toLowerCase()}`;

const getTotalRewardKey = (address: string) =>
  `${TOTAL_REWARD_KEY_PREFIX}-${address.toLowerCase()}`;

const getStoredOpens = (address?: string | null): number => {
  if (typeof window === 'undefined' || !address) return 0;
  try {
    const raw = window.localStorage.getItem(getStorageKey(address));
    const parsed = Number.parseInt(raw ?? '0', 10);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.min(parsed, MAX_BOX_OPENS);
  } catch {
    return 0;
  }
};

const getStoredTotalReward = (address?: string | null): bigint => {
  if (typeof window === 'undefined' || !address) return 0n;
  try {
    const raw = window.localStorage.getItem(getTotalRewardKey(address));
    if (!raw) return 0n;
    const parsed = BigInt(raw);
    if (parsed < 0) return 0n;
    return parsed;
  } catch {
    return 0n;
  }
};

export type GameState =
  | 'idle'
  | 'encrypting'
  | 'sending'
  | 'confirming'
  | 'decrypting'
  | 'revealed'
  | 'error';

interface UseSecretBoxReturn {
  gameState: GameState;
  selectedBox: number | null;
  reward: bigint | null;
  txHash: string | null;
  error: string | null;
  selectBox: (
    boxIndex: number,
    signer: Signer,
    provider: BrowserProvider,
    userAddress: string
  ) => Promise<void>;
  reset: () => void;
  boxesOpened: number;
  maxOpens: number;
  totalReward: bigint;
  numberOfBoxes: number;
  loadNumberOfBoxes: (provider: BrowserProvider) => Promise<void>;
}

export function useSecretBox(connectedAddress?: string | null): UseSecretBoxReturn {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [reward, setReward] = useState<bigint | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fhevmInstance, setFhevmInstance] =
    useState<FHEVMInstance | null>(null);
  const [boxesOpened, setBoxesOpened] = useState(() =>
    getStoredOpens(connectedAddress)
  );
  const [totalReward, setTotalReward] = useState<bigint>(() =>
    getStoredTotalReward(connectedAddress)
  );
  const [numberOfBoxes, setNumberOfBoxes] = useState<number>(0);

  useEffect(() => {
    if (!connectedAddress) {
      setBoxesOpened(0);
      setTotalReward(0n);
      return;
    }

    setBoxesOpened(getStoredOpens(connectedAddress));
    setTotalReward(getStoredTotalReward(connectedAddress));
  }, [connectedAddress]);

  useEffect(() => {
    if (!connectedAddress) return;
    try {
      window.localStorage.setItem(
        getStorageKey(connectedAddress),
        boxesOpened.toString()
      );
    } catch (err) {
      console.error('Failed to persist opened boxes count', err);
    }
  }, [boxesOpened, connectedAddress]);

  useEffect(() => {
    if (!connectedAddress) return;
    try {
      window.localStorage.setItem(
        getTotalRewardKey(connectedAddress),
        totalReward.toString()
      );
    } catch (err) {
      console.error('Failed to persist total reward', err);
    }
  }, [totalReward, connectedAddress]);

  const loadNumberOfBoxes = useCallback(
    async (provider: BrowserProvider) => {
      try {
        const contract = getSecretBoxContract(
          FHEVM_CONFIG.contractAddress,
          provider
        );
        const numBoxes = await contract.numberOfBoxes();
        setNumberOfBoxes(Number(numBoxes));
        console.log('Loaded numberOfBoxes:', Number(numBoxes));
      } catch (err) {
        console.error('Failed to load numberOfBoxes:', err);
      }
    },
    []
  );

  const selectBox = useCallback(
    async (
      boxIndex: number,
      signer: Signer,
      provider: BrowserProvider,
      userAddress: string
    ) => {
      try {
        setError(null);

        if (boxesOpened >= MAX_BOX_OPENS) {
          setGameState('error');
          setError('Open limit reached');
          return;
        }

        if (numberOfBoxes === 0) {
          await loadNumberOfBoxes(provider);
          await new Promise((r) => setTimeout(r, 200));
        }

        if (boxIndex < 0 || boxIndex >= numberOfBoxes) {
          throw new Error(
            `Invalid box index ${boxIndex}. Valid range: 0-${
              numberOfBoxes - 1
            }`
          );
        }

        setSelectedBox(boxIndex);
        setGameState('encrypting');

        let instance = fhevmInstance;
        if (!instance) {
          instance = await initFHEVM(provider);
          setFhevmInstance(instance);
        }

        const encryptedInput = await encryptBoxChoice(
          instance,
          boxIndex & 0xff,
          FHEVM_CONFIG.contractAddress,
          userAddress
        );

        const encryptedData =
          encryptedInput.encryptedData ??
          toHexString(encryptedInput.handles[0]);

        const proof =
          encryptedInput.proof ??
          toHexString(encryptedInput.inputProof);

        const contractWrite = getSecretBoxContract(
          FHEVM_CONFIG.contractAddress,
          signer
        );

        setGameState('sending');
        const rewardHandle =
          await contractWrite.openBox.staticCall(
            encryptedData,
            proof
          );

        const tx = await contractWrite.openBox(
          encryptedData,
          proof
        );
        setTxHash(tx.hash);

        setGameState('confirming');
        await tx.wait();

        setGameState('decrypting');
        const decryptedReward = await decryptReward(
          instance,
          rewardHandle,
          FHEVM_CONFIG.contractAddress,
          signer
        );

        setReward(decryptedReward);
        setTotalReward((prev) => prev + decryptedReward);
        setBoxesOpened((prev) => prev + 1);
        setGameState('revealed');
      } catch (err) {
        console.error('Error in selectBox:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setGameState('error');
      }
    },
    [fhevmInstance, numberOfBoxes, loadNumberOfBoxes, boxesOpened]
  );

  const reset = useCallback(() => {
    setGameState('idle');
    setSelectedBox(null);
    setReward(null);
    setTxHash(null);
    setError(null);
  }, []);

  return {
    gameState,
    selectedBox,
    reward,
    txHash,
    error,
    selectBox,
    reset,
    boxesOpened,
    maxOpens: MAX_BOX_OPENS,
    totalReward,
    numberOfBoxes,
    loadNumberOfBoxes,
  };
}
