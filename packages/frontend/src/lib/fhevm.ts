import { BrowserProvider, Contract, Signer, hexlify } from 'ethers';

export const SECRET_BOX_ABI = [
  {
    type: "function",
    name: "openBox",
    stateMutability: "nonpayable",
    inputs: [
      {
        internalType: "externalEuint8",
        name: "choiceEncrypted",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
    ],
    outputs: [
      {
        internalType: "euint64",
        name: "reward",
        type: "bytes32",
      },
    ],
  },
  {
    type: "function",
    name: "numberOfBoxes",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
  },
];

export const FHEVM_CONFIG = {
  chainId: 11155111,
  contractAddress: "0xccc5f7093d37b8cF6C2F2522E67cd59a02AD90bE",
  gatewayUrl: "https://gateway.sepolia.zama.ai",
};

export interface EncryptedInput {
  handles: Uint8Array[];
  inputProof: Uint8Array;
  encryptedData?: string;
  proof?: string;
}

export interface FHEVMInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => EncryptedInputBuilder;
  decrypt: (handle: string, contractAddress: string, signer: Signer) => Promise<bigint>;
  instance?: any;
}

export interface EncryptedInputBuilder {
  add8: (value: number) => EncryptedInputBuilder;
  add16: (value: number) => EncryptedInputBuilder;
  add64: (value: bigint) => EncryptedInputBuilder;
  encrypt: () => Promise<EncryptedInput>;
}

class MockFHEVMInstance implements FHEVMInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInputBuilder {
    console.log(`Creating encrypted input for contract: ${contractAddress}, user: ${userAddress}`);
    
    let storedValue = 0;
    
    const builder: EncryptedInputBuilder = {
      add8: (value: number) => {
        storedValue = value;
        console.log(`Adding uint8 value: ${value} (encrypted)`);
        return builder;
      },
      add16: (value: number) => {
        storedValue = value;
        console.log(`Adding uint16 value: ${value} (encrypted)`);
        return builder;
      },
      add64: (value: bigint) => {
        console.log(`Adding uint64 value: ${value} (encrypted)`);
        return builder;
      },
      encrypt: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockHandle = new Uint8Array(32);
        crypto.getRandomValues(mockHandle);

        const mockProof = new Uint8Array(64);
        crypto.getRandomValues(mockProof);
        
        console.log('Encryption complete (mock)');
        
        return {
          handles: [mockHandle],
          inputProof: mockProof,
        };
      },
    };
    
    return builder;
  }

  async decrypt(handle: string, contractAddress: string, signer: Signer): Promise<bigint> {
    console.log(`Decrypting handle: ${handle}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockRewards = [100n, 250n, 500n, 1000n, 2500n, 5000n, 10000n];
    const randomReward = mockRewards[Math.floor(Math.random() * mockRewards.length)];
    
    console.log(`Decrypted reward: ${randomReward}`);
    return randomReward;
  }
}

let fhevmInstance: FHEVMInstance | null = null;

export async function initFHEVM(provider: BrowserProvider): Promise<FHEVMInstance> {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  console.log('Initializing FHEVM instance...');
  
  const sdk = (window as any).RelayerSDK || (window as any).relayerSDK;
  
  if (!sdk) {
    console.warn('RelayerSDK not loaded, using mock instance');
    fhevmInstance = new MockFHEVMInstance();
    return fhevmInstance;
  }

  if (typeof window === 'undefined' || !window.ethereum) {
    console.warn('window.ethereum not available, using mock instance');
    fhevmInstance = new MockFHEVMInstance();
    return fhevmInstance;
  }

  try {
    const { initSDK, createInstance, SepoliaConfig } = sdk;
    
    await initSDK();
    console.log('✅ FHEVM SDK initialized');
    
    const config = { ...SepoliaConfig, network: window.ethereum };
    const instance = await createInstance(config);
    
    fhevmInstance = {
      createEncryptedInput: (contractAddress: string, userAddress: string) => {
        const builder = instance.createEncryptedInput(contractAddress, userAddress);
        return {
          add8: (value: number) => {
            builder.add8(value);
            return builder;
          },
          add16: (value: number) => {
            builder.add16(value);
            return builder;
          },
          add64: (value: bigint) => {
            builder.add64(value);
            return builder;
          },
          encrypt: async () => {
            const result = await builder.encrypt();
            console.log('Encrypt result:', result);
            if (result && typeof result === 'object') {
              if (result.handles && Array.isArray(result.handles) && result.handles.length > 0) {
                const handles = result.handles.map((h: any) => {
                  if (h instanceof Uint8Array) return h;
                  if (typeof h === 'string') {
                    const hex = h.startsWith('0x') ? h.slice(2) : h;
                    return new Uint8Array(Buffer.from(hex, 'hex'));
                  }
                  return new Uint8Array(h);
                });
                
                let inputProof: Uint8Array;
                if (result.inputProof instanceof Uint8Array) {
                  inputProof = result.inputProof;
                } else if (typeof result.inputProof === 'string') {
                  const hex = result.inputProof.startsWith('0x') ? result.inputProof.slice(2) : result.inputProof;
                  inputProof = new Uint8Array(Buffer.from(hex, 'hex'));
                } else {
                  inputProof = new Uint8Array(result.inputProof);
                }
                
                return {
                  handles,
                  inputProof,
                };
              }
              
              if (result.encryptedData && result.proof) {
                return {
                  handles: [
                    result.encryptedData instanceof Uint8Array 
                      ? result.encryptedData 
                      : new Uint8Array(result.encryptedData)
                  ],
                  inputProof: result.proof instanceof Uint8Array 
                    ? result.proof 
                    : new Uint8Array(result.proof),
                };
              }
            }
            
            console.warn('Unexpected encrypt result format:', result);
            return {
              handles: [new Uint8Array(32)],
              inputProof: new Uint8Array(0),
            };
          },
        };
      },
      decrypt: async (handle: string, contractAddress: string, signer: Signer) => {
        try {
          const keypair = instance.generateKeypair();
          const handleContractPairs = [
            {
              handle: handle,
              contractAddress: contractAddress,
            },
          ];
          
          const startTimeStamp = Math.floor(Date.now() / 1000).toString();
          const durationDays = "10";
          const contractAddresses = [contractAddress];

          const eip712 = instance.createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimeStamp,
            durationDays
          );

          const userAddress = await signer.getAddress();
          const signature = await signer.signTypedData(
            eip712.domain,
            {
              UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
            },
            eip712.message
          );

          const result = await instance.userDecrypt(
            handleContractPairs,
            keypair.privateKey,
            keypair.publicKey,
            signature.replace("0x", ""),
            contractAddresses,
            userAddress,
            startTimeStamp,
            durationDays
          );

          const decryptedValue = result[handle] || Object.values(result)[0];
          return BigInt(Number(decryptedValue));
        } catch (error) {
          console.error('Decryption failed:', error);
          throw error;
        }
      },
      instance,
    };
    
    console.log('✅ FHEVM instance created successfully');
    return fhevmInstance;
  } catch (error) {
    console.error('Failed to initialize FHEVM, using mock:', error);
    fhevmInstance = new MockFHEVMInstance();
    return fhevmInstance;
  }
}

export async function encryptBoxChoice(
  instance: FHEVMInstance,
  boxIndex: number,
  contractAddress: string,
  userAddress: string
): Promise<EncryptedInput> {
  const uint8Value = Math.floor(boxIndex) & 0xFF;
  
  if (uint8Value !== boxIndex) {
    throw new Error(`Box index must be a valid uint8: ${boxIndex}`);
  }
  
  console.log(`🔐 Encrypting box choice: ${uint8Value} (uint8)`);
  console.log(`   Contract: ${contractAddress}`);
  console.log(`   User: ${userAddress}`);
  
  const inputBuilder = instance.createEncryptedInput(contractAddress, userAddress);
  
  inputBuilder.add8(uint8Value);
  
  const encryptedInput = await inputBuilder.encrypt();
  
  console.log('✅ Encrypted input from builder:', {
    handlesCount: encryptedInput.handles?.length,
    handleLength: encryptedInput.handles?.[0]?.length,
    proofLength: encryptedInput.inputProof?.length,
  });
  
  const handleBytes = encryptedInput.handles[0] instanceof Uint8Array 
    ? encryptedInput.handles[0] 
    : new Uint8Array(encryptedInput.handles[0]);
  
  const proofBytes = encryptedInput.inputProof instanceof Uint8Array
    ? encryptedInput.inputProof
    : new Uint8Array(encryptedInput.inputProof);
  
  if (handleBytes.length !== 32) {
    console.warn(`⚠️ Handle length is ${handleBytes.length}, expected 32. Padding or truncating...`);
    const paddedHandle = new Uint8Array(32);
    paddedHandle.set(handleBytes.slice(0, 32), 0);
    handleBytes.set(paddedHandle);
  }
  
  const encryptedData = hexlify(handleBytes);
  const proof = hexlify(proofBytes);
  
  console.log('📤 Converted to hex:', { 
    encryptedData: encryptedData.substring(0, 30) + '...', 
    proof: proof.substring(0, 30) + '...',
    encryptedDataLength: encryptedData.length,
    proofLength: proof.length,
  });
  
  return {
    ...encryptedInput,
    encryptedData,
    proof,
  };
}

export function toHexString(bytes: Uint8Array): string {
  return hexlify(bytes);
}

export async function decryptReward(
  instance: FHEVMInstance,
  handle: string,
  contractAddress: string,
  signer: Signer
): Promise<bigint> {
  const decryptedValue = await instance.decrypt(handle, contractAddress, signer);
  
  return decryptedValue;
}

export function getSecretBoxContract(
  contractAddress: string,
  signerOrProvider: Signer | BrowserProvider
): Contract {
  return new Contract(contractAddress, SECRET_BOX_ABI, signerOrProvider);
}
