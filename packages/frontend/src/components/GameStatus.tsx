import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, Send, Key, Gift, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameState } from '@/hooks/useSecretBox';
import { cn } from '@/lib/utils';

interface GameStatusProps {
  gameState: GameState;
  selectedBox: number | null;
  reward: bigint | null;
  txHash: string | null;
  error: string | null;
  onReset: () => void;
  canPlayMore: boolean;
}

const statusConfig: Record<GameState, {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}> = {
  idle: {
    icon: Lock,
    title: 'Choose Your Box',
    description: 'Select one of the mystery boxes to reveal your encrypted reward',
    color: 'text-primary',
  },
  encrypting: {
    icon: Loader2,
    title: 'Encrypting Your Choice',
    description: 'Your selection is being encrypted using FHE technology',
    color: 'text-neon-cyan',
  },
  sending: {
    icon: Send,
    title: 'Sending Transaction',
    description: 'Submitting your encrypted choice to the blockchain',
    color: 'text-neon-cyan',
  },
  confirming: {
    icon: Loader2,
    title: 'Awaiting Confirmation',
    description: 'Waiting for the transaction to be confirmed on-chain',
    color: 'text-neon-cyan',
  },
  decrypting: {
    icon: Key,
    title: 'Decrypting Reward',
    description: 'Retrieving and decrypting your private reward',
    color: 'text-neon-gold',
  },
  revealed: {
    icon: Gift,
    title: 'Reward Revealed!',
    description: 'Congratulations! Your encrypted reward has been decrypted',
    color: 'text-neon-gold',
  },
  error: {
    icon: AlertCircle,
    title: 'Error Occurred',
    description: 'Something went wrong. Please try again.',
    color: 'text-destructive',
  },
};

export function GameStatus({
  gameState,
  selectedBox,
  reward,
  txHash,
  error,
  onReset,
  canPlayMore,
}: GameStatusProps) {
  const config = statusConfig[gameState];
  const Icon = config.icon;
  const isLoading = ['encrypting', 'sending', 'confirming', 'decrypting'].includes(gameState);
  const showResetButton = gameState === 'revealed' || gameState === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className={cn(
        "rounded-2xl p-6 border",
        "bg-gradient-to-b from-card to-dark-surface",
        "border-border",
        gameState === 'revealed' && "border-neon-gold/50 shadow-gold",
        gameState === 'error' && "border-destructive/50",
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={gameState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center text-center gap-4"
          >
            {/* Icon */}
            <div className={cn(
              "p-4 rounded-full",
              "bg-muted/50",
              config.color,
            )}>
              <Icon className={cn(
                "h-8 w-8",
                isLoading && "animate-spin"
              )} />
            </div>

            {/* Title & Description */}
            <div>
              <h3 className={cn(
                "font-display text-xl font-bold mb-1",
                config.color,
                gameState === 'revealed' && "text-glow-gold",
              )}>
                {config.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {error || config.description}
              </p>
            </div>

            {/* Selected Box Info */}
            {selectedBox !== null && gameState !== 'idle' && (
              <div className="text-sm text-muted-foreground">
                Box #{selectedBox + 1} selected
              </div>
            )}

            {/* Reward Display */}
            {gameState === 'revealed' && reward !== null && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="py-4"
              >
                <p className="text-sm text-muted-foreground mb-1">Your Reward</p>
                <p className="text-5xl font-display font-bold text-neon-gold text-glow-gold">
                  {reward.toString()}
                </p>
                <p className="text-sm text-neon-gold/70 mt-1">tokens</p>
              </motion.div>
            )}

            {/* Transaction Hash */}
            {txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neon-cyan hover:underline font-mono"
              >
                View Transaction ↗
              </a>
            )}

            {/* Progress Steps */}
            {isLoading && (
              <div className="flex items-center gap-2 mt-2">
                {['encrypting', 'sending', 'confirming', 'decrypting'].map((step, i) => (
                  <div
                    key={step}
                    className={cn(
                      "h-1.5 w-8 rounded-full transition-colors duration-300",
                      gameState === step && "bg-neon-cyan animate-pulse",
                      ['encrypting', 'sending', 'confirming', 'decrypting'].indexOf(gameState) > i
                        ? "bg-neon-cyan"
                        : "bg-muted",
                    )}
                  />
                ))}
              </div>
            )}

            {/* Play Again Button */}
            {showResetButton && (
              <Button
                onClick={onReset}
                className="mt-4 gap-2"
                variant={gameState === 'error' ? 'destructive' : 'default'}
              >
                <RefreshCw className="h-4 w-4" />
                {gameState === 'error'
                  ? 'Try Again'
                  : canPlayMore
                    ? 'Play Again'
                    : 'Reset Board'}
              </Button>
            )}

            {/* Limit Message */}
            {gameState === 'revealed' && !canPlayMore && (
              <p className="text-xs text-muted-foreground">
                You have opened all available boxes for now.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
