import { motion } from 'framer-motion';
import { Lock, Gift, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MysteryBoxProps {
  index: number;
  isSelected: boolean;
  isDisabled: boolean;
  isRevealed: boolean;
  reward?: bigint;
  onClick: () => void;
}

export function MysteryBox({
  index,
  isSelected,
  isDisabled,
  isRevealed,
  reward,
  onClick,
}: MysteryBoxProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotateY: isRevealed && isSelected ? 360 : 0,
      }}
      whileHover={!isDisabled ? { 
        scale: 1.05, 
        y: -5,
      } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={{ 
        duration: 0.3,
        delay: index * 0.1,
        rotateY: { duration: 0.8, ease: "easeInOut" }
      }}
      className={cn(
        "relative w-32 h-32 md:w-40 md:h-40 rounded-2xl",
        "flex flex-col items-center justify-center gap-2",
        "transition-all duration-300",
        "border-2",
        "overflow-hidden",
        "group",
        !isSelected && !isDisabled && [
          "bg-gradient-to-b from-card to-dark-surface",
          "border-border hover:border-primary",
          "shadow-card hover:shadow-neon",
          "cursor-pointer",
        ],
        isSelected && !isRevealed && [
          "bg-gradient-to-b from-primary/20 to-card",
          "border-primary",
          "shadow-neon",
        ],
        isSelected && isRevealed && [
          "bg-gradient-to-b from-neon-gold/20 to-card",
          "border-neon-gold",
          "shadow-gold",
        ],
        isDisabled && !isSelected && [
          "bg-card/50",
          "border-border/50",
          "opacity-50",
          "cursor-not-allowed",
        ],
      )}
    >
      {!isDisabled && !isRevealed && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent"
          initial={{ y: "-100%" }}
          animate={{ y: "100%" }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "linear",
            delay: index * 0.3 
          }}
        />
      )}

      {isRevealed && isSelected && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: 0,
                y: 0,
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1, 0],
                x: Math.cos((i / 6) * Math.PI * 2) * 60,
                y: Math.sin((i / 6) * Math.PI * 2) * 60,
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: i * 0.2,
                ease: "easeOut"
              }}
            >
              <Sparkles className="h-4 w-4 text-neon-gold" />
            </motion.div>
          ))}
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-2">
        {isRevealed && isSelected ? (
          <>
            <Gift className="h-10 w-10 text-neon-gold" />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <span className="text-xs text-muted-foreground">Reward</span>
              <p className="text-2xl font-display font-bold text-neon-gold text-glow-gold">
                {reward?.toString() ?? '???'}
              </p>
            </motion.div>
          </>
        ) : (
          <>
            <Lock className={cn(
              "h-8 w-8 transition-colors",
              isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"
            )} />
            <span className={cn(
              "font-display text-lg font-bold transition-colors",
              isSelected ? "text-primary text-glow-purple" : "text-muted-foreground group-hover:text-foreground"
            )}>
              #{index + 1}
            </span>
          </>
        )}
      </div>

      <div className={cn(
        "absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 rounded-tl-lg transition-colors",
        isSelected ? "border-primary" : "border-border group-hover:border-primary/50"
      )} />
      <div className={cn(
        "absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 rounded-tr-lg transition-colors",
        isSelected ? "border-primary" : "border-border group-hover:border-primary/50"
      )} />
      <div className={cn(
        "absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 rounded-bl-lg transition-colors",
        isSelected ? "border-primary" : "border-border group-hover:border-primary/50"
      )} />
      <div className={cn(
        "absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 rounded-br-lg transition-colors",
        isSelected ? "border-primary" : "border-border group-hover:border-primary/50"
      )} />
    </motion.button>
  );
}
