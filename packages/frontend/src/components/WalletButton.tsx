import { motion } from 'framer-motion';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalletButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: number | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

const SEPOLIA_CHAIN_ID = 11155111;

export function WalletButton({
  isConnected,
  isConnecting,
  address,
  chainId,
  error,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}: WalletButtonProps) {
  const isWrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID;
  
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isWrongNetwork) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2"
      >
        <Button
          onClick={onSwitchNetwork}
          variant="destructive"
          className="gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Switch to Sepolia
        </Button>
        <span className="text-xs text-muted-foreground">
          Wrong network detected
        </span>
      </motion.div>
    );
  }

  if (isConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 border border-border">
          <div className="h-2 w-2 rounded-full bg-neon-cyan animate-pulse" />
          <span className="font-mono text-sm text-foreground">
            {formatAddress(address)}
          </span>
        </div>
        <Button
          onClick={onDisconnect}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-destructive/20 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2"
    >
      <Button
        onClick={onConnect}
        disabled={isConnecting}
        className="gap-2 bg-gradient-to-r from-primary to-neon-pink hover:opacity-90 transition-opacity"
        size="lg"
      >
        <Wallet className="h-5 w-5" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      {error && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-destructive"
        >
          {error}
        </motion.span>
      )}
    </motion.div>
  );
}
