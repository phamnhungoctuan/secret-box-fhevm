import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useSecretBox } from '@/hooks/useSecretBox';
import { WalletButton } from '@/components/WalletButton';
import { MysteryBox } from '@/components/MysteryBox';
import { GameStatus } from '@/components/GameStatus';
import { useToast } from '@/hooks/use-toast';
import { Shield, Zap, Eye, Lock, Gift } from 'lucide-react';

const DEFAULT_NUM_BOXES = 5;

export function SecretBoxGame() {
  const {
    isConnected,
    isConnecting,
    address,
    chainId,
    provider,
    signer,
    error: walletError,
    connect,
    disconnect,
    switchToSepolia,
  } = useWallet();

  const {
    gameState,
    selectedBox,
    reward,
    txHash,
    error: gameError,
    selectBox,
    reset,
    boxesOpened,
    maxOpens,
    totalReward,
    numberOfBoxes,
    loadNumberOfBoxes,
  } = useSecretBox(address);

  const { toast } = useToast();

  useEffect(() => {
    if (isConnected && provider) {
      loadNumberOfBoxes(provider);
    }
  }, [isConnected, provider, loadNumberOfBoxes]);
  const hasReachedLimit = boxesOpened >= maxOpens;
  const opensLeft = Math.max(maxOpens - boxesOpened, 0);

  const handleBoxClick = async (boxIndex: number) => {
    if (!isConnected || !signer || !provider || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to play",
        variant: "destructive",
      });
      return;
    }

    if (hasReachedLimit) {
      toast({
        title: "Open Limit Reached",
        description: `You can open ${maxOpens} boxes. Claim your rewards and come back soon.`,
        variant: "destructive",
      });
      return;
    }

    if (gameState !== 'idle') {
      return;
    }

    await selectBox(boxIndex, signer, provider, address);
  };

  const isBoxDisabled = gameState !== 'idle' || hasReachedLimit;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-neon-cyan/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-primary/5 via-transparent to-transparent" />
      </div>

      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/50 blur-xl rounded-full" />
              <div className="relative bg-gradient-to-br from-primary to-neon-pink p-3 rounded-xl">
                <Lock className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                SECRET<span className="text-primary text-glow-purple">BOX</span>
              </h1>
              <p className="text-xs text-muted-foreground">Powered by FHEVM</p>
            </div>
          </motion.div>

          <WalletButton
            isConnected={isConnected}
            isConnecting={isConnecting}
            address={address}
            chainId={chainId}
            error={walletError}
            onConnect={connect}
            onDisconnect={disconnect}
            onSwitchNetwork={switchToSepolia}
          />
        </header>

        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-4xl mx-auto mb-10"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 shadow-card">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-neon-pink/5 to-neon-cyan/10" />
              <div className="relative p-4 md:p-5 flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Boxes opened</span>
                    <span className="font-mono text-foreground">{boxesOpened} / {maxOpens}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(boxesOpened / maxOpens) * 100}%` }}
                      className="h-full bg-gradient-to-r from-primary via-neon-pink to-neon-cyan"
                    />
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">
                    {hasReachedLimit ? "You've opened all available boxes." : `${opensLeft} box${opensLeft === 1 ? '' : 'es'} left to open.`}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-dark-surface px-4 py-3 shadow-card min-w-[220px]">
                  <div className="p-2 rounded-lg bg-primary/10 text-neon-gold">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total tokens earned</p>
                    <p className="text-2xl font-display font-bold text-neon-gold text-glow-gold">
                      {totalReward.toString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Across all opened boxes</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <main className="flex-1 flex flex-col items-center justify-center gap-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">Choose Your </span>
              <span className="bg-gradient-to-r from-primary via-neon-pink to-neon-cyan bg-clip-text text-transparent">
                Mystery Box
              </span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Each box contains an encrypted reward. Only YOU can decrypt and reveal your prize.
              The secret is protected by Fully Homomorphic Encryption.
            </p>
          </motion.div>

          {isConnected ? (
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-3xl">
              {Array.from({ length: numberOfBoxes || DEFAULT_NUM_BOXES }).map((_, index) => (
                <MysteryBox
                  key={index}
                  index={index}
                  isSelected={selectedBox === index}
                  isDisabled={isBoxDisabled && selectedBox !== index}
                  isRevealed={gameState === 'revealed' && selectedBox === index}
                  reward={selectedBox === index ? reward ?? undefined : undefined}
                  onClick={() => handleBoxClick(index)}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground mb-4">
                Connect your wallet to start playing
              </p>
              <div className="flex justify-center gap-4 opacity-50">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-border"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {isConnected && gameState !== 'idle' && (
            <GameStatus
              gameState={gameState}
              selectedBox={selectedBox}
              reward={reward}
              txHash={txHash}
              error={gameError}
              onReset={reset}
              canPlayMore={!hasReachedLimit}
            />
          )}
        </main>

        <footer className="mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              {
                icon: Shield,
                title: 'Fully Encrypted',
                description: 'Your choice is encrypted before leaving your device',
              },
              {
                icon: Eye,
                title: 'Private Rewards',
                description: 'Only you can decrypt and see your reward',
              },
              {
                icon: Zap,
                title: 'On-Chain Computation',
                description: 'Rewards are computed on encrypted data',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-border"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </footer>
      </div>
    </div>
  );
}
