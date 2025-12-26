# 🔐 Secret Box – Private Mystery Game on FHEVM

Secret Box is a fully on-chain mystery-box game built on FHEVM. Players choose a box, the choice is encrypted client-side, and the reward is computed and returned as encrypted data on-chain. No one – including the contract – can see your choice or reward value.

<p align="center">
  <img src="./secret.png" alt="Game Flow" width="350"/>
</p>

## Demo
* 🎮 **Play** → [secretbox.vercel.app](https://secretbox.vercel.app/)


## Highlights
- Encrypt the chosen box on the client with FHE, call `openBox`, receive an encrypted reward handle.
- `SecretBox` contract computes entirely on encrypted data with `FHE.select` and only returns the handle for the player to decrypt.
- Frontend (Vite/React) loads the FHEVM Relayer SDK from CDN and uses EIP-712 for decryption.
- Pre-configured Secret Box on Sepolia: `0xccc5f7093d37b8cF6C2F2522E67cd59a02AD90bE`.

## FLOW

```
┌──────────────┐
│     User     │
│ (Web Wallet) │
└──────┬───────┘
       │
       │ 1. Select a Box (UI)
       ▼
┌──────────────────────┐
│      Frontend        │
│  (React + ethers)    │
└──────┬───────────────┘
       │
       │ 2. Encrypt box index
       │    - Relayer SDK
       │    - externalEuint8
       ▼
┌──────────────────────┐
│  Encrypted Input     │
│  (box index hidden)  │
└──────┬───────────────┘
       │
       │ 3. Send encrypted tx
       │    openBox(encryptedChoice, proof)
       ▼
┌──────────────────────────────────┐
│        SecretBox Contract         │
│          (Zama FHEVM)             │
│                                  │
│  - FHE.fromExternal               │
│  - FHE.eq / FHE.select            │
│  - reward computed encrypted     │
│                                  │
│  ❌ No plaintext choice           │
│  ❌ No plaintext reward           │
└──────┬───────────────────────────┘
       │
       │ 4. Return encrypted reward
       │    (euint64 handle)
       ▼
┌──────────────────────┐
│  Encrypted Reward    │
│   (handle only)      │
└──────┬───────────────┘
       │
       │ 5. UserDecrypt (EIP-712)
       │    via Relayer SDK
       ▼
┌──────────────────────┐
│   User Browser       │
│  (Private Decrypt)   │
└──────┬───────────────┘
       │
       │ 6. Show reward
       ▼
┌──────────────────────┐
│   Reward Revealed    │
│   (User Only)        │
└──────────────────────┘
```

## Quick architecture
- `packages/hardhat/contracts/SecretBox.sol`: FHE contract storing encrypted rewards and returning a handle authorized for the player.
- `packages/frontend`: React + Tailwind/shadcn UI; main component `SecretBoxGame` (open box, track progress, decrypt).
- `packages/frontend/src/hooks/useSecretBox.ts`: game flow (encrypt choice → static call → send tx → decrypt reward).
- `packages/frontend/src/lib/fhevm.ts`: FHEVM config (chainId/gateway/contract address) and Relayer SDK wrapper.
- `packages/fhevm-sdk`: bundled FHEVM helper SDK used by the hooks.

## Directory layout
- `packages/frontend`: Secret Box app (Vite/React).
- `packages/hardhat`: Solidity sources + deploy script.
- `packages/fhevm-sdk`: helper SDK (built into `dist/`).

## Tutorial to run
1) Prereqs  
   - Node.js 20+, `pnpm` (tip: `corepack enable`).  
   - Sepolia wallet with some ETH for gas.  
   - Browser wallet (Metamask) allowed to load the FHEVM CDN script (`packages/frontend/index.html` already includes it).
2) Install dependencies  
   ```bash
   pnpm install
   # if preinstall fails, run: pnpm install --ignore-scripts && pnpm sdk:build
   ```
3) Start the frontend (uses the deployed Sepolia contract)  
   ```bash
   pnpm --filter ./packages/frontend dev
   # open http://localhost:5173
   ```
4) Play Secret Box  
   - Connect your wallet and switch to Sepolia.  
   - Pick a box to encrypt the choice, sign the `openBox` tx, then sign the EIP-712 message to decrypt the reward.

## Deploy a new contract (optional)
Secret Box requires an FHE-enabled network (e.g., Sepolia FHEVM). Hardhat localhost cannot encrypt in the constructor.

```bash
cd packages/hardhat
export MNEMONIC="deployment wallet seed phrase"
export INFURA_API_KEY="Sepolia API key"
pnpm install
pnpm deploy:sepolia
```
- Update the new address in `packages/frontend/src/lib/fhevm.ts` → `FHEVM_CONFIG.contractAddress`.  
- To change box count/rewards, edit the `rewards` array in `packages/hardhat/deploy/deploy.ts` before deploying.

## Useful commands
- Build SDK: `pnpm --filter ./packages/fhevm-sdk build`
- Check/compile contracts: `pnpm --filter ./packages/hardhat compile`
- Build frontend: `pnpm --filter ./packages/frontend build`