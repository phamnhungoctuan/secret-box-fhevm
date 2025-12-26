# Secret Box Frontend

React + Vite UI for the Secret Box FHE game.

## Requirements
- Node.js 20+
- pnpm (recommended) or npm
- Browser wallet (Metamask) on Sepolia

## Run locally
```bash
pnpm install
pnpm --filter ./packages/frontend dev
# open http://localhost:5173
```

## Build
```bash
pnpm --filter ./packages/frontend build
```

## Notes
- The FHEVM Relayer SDK is loaded via CDN in `index.html`.
- Contract address is set in `src/lib/fhevm.ts` (`FHEVM_CONFIG.contractAddress`).
