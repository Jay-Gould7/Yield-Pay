"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Address } from "viem";

import { VaultModal } from "@/components/home/VaultModal";

type CoinParticle = {
  delay: number;
  duration: number;
  liftY: number;
  id: number;
  originX: number;
  originY: number;
  rotate: number;
  size: number;
  x: number;
  y: number;
};

type VaultIconProps = {
  activeApy: string;
  activeBreakEven: string;
  activeVaultName: string;
  className?: string;
  recoveryProgress: number;
  vaultTokenAddress?: Address;
  walletAddress?: Address;
};

function createCoinParticles(originX: number, originY: number): CoinParticle[] {
  return Array.from({ length: 36 }, (_, index) => ({
    delay: Math.random() * 0.16,
    duration: 1 + Math.random() * 0.7,
    id: index,
    liftY: -(28 + Math.random() * 86),
    originX,
    originY,
    rotate: (Math.random() > 0.5 ? 1 : -1) * (220 + Math.random() * 460),
    size: 8 + Math.round(Math.random() * 10),
    x: -150 + Math.random() * 300,
    y: 78 + Math.random() * 176,
  }));
}

export function VaultIcon({
  activeApy,
  activeBreakEven,
  activeVaultName,
  className = "",
  recoveryProgress,
  vaultTokenAddress,
  walletAddress,
}: VaultIconProps) {
  const [coinParticles, setCoinParticles] = useState<CoinParticle[]>([]);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const clearParticlesTimer = useRef<number | null>(null);
  const portalRoot = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    return () => {
      if (clearParticlesTimer.current) {
        window.clearTimeout(clearParticlesTimer.current);
      }
    };
  }, []);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height * 0.45;

    if (clearParticlesTimer.current) {
      window.clearTimeout(clearParticlesTimer.current);
    }

    setCoinParticles(createCoinParticles(originX, originY));
    clearParticlesTimer.current = window.setTimeout(() => {
      setCoinParticles([]);
      clearParticlesTimer.current = null;
    }, 1500);

    setIsVaultOpen(true);
  };

  const handleClose = () => {
    setIsVaultOpen(false);
  };

  return (
    <>
      <div className={`relative shrink-0 ${className}`.trim()}>
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Open vault recovery details"
          className="vault-icon-button relative grid h-[5rem] w-[5rem] place-items-center overflow-visible p-0 transition hover:brightness-110"
        >
          <PixelVaultSafe open={isVaultOpen} />
        </button>
      </div>

      {portalRoot
        ? createPortal(
            <AnimatePresence>
              {coinParticles.map((particle) => (
                <motion.span
                  key={`${particle.id}-${particle.originX}-${particle.originY}-${particle.delay}`}
                  className="vault-coin fixed pointer-events-none z-[140]"
                  style={{
                    height: `${particle.size}px`,
                    left: `${particle.originX}px`,
                    top: `${particle.originY}px`,
                    width: `${particle.size}px`,
                  }}
                  initial={{ opacity: 0, rotate: 0, scale: 0.55, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 1, 0],
                    rotate: particle.rotate,
                    scale: [0.55, 1, 1.1, 0.96, 0.8],
                    x: [0, particle.x * 0.34, particle.x],
                    y: [0, particle.liftY, particle.y],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    delay: particle.delay,
                    duration: particle.duration,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                />
              ))}
            </AnimatePresence>,
            portalRoot,
          )
        : null}

      <VaultModal
        activeApy={activeApy}
        activeBreakEven={activeBreakEven}
        activeVaultName={activeVaultName}
        isOpen={isVaultOpen}
        onClose={handleClose}
        recoveryProgress={recoveryProgress}
        vaultTokenAddress={vaultTokenAddress}
        walletAddress={walletAddress}
      />
    </>
  );
}
function PixelVaultSafe({ open = false }: { open?: boolean }) {
  return (
    <span className={`pixel-safe ${open ? "is-open" : ""}`.trim()} aria-hidden="true">
      <span className="pixel-safe-aura" />
      <span className="pixel-safe-shadow" />
      <span className="pixel-safe-top" />
      <span className="pixel-safe-body" />
      <span className="pixel-safe-side" />
      <span className="pixel-safe-interior" />
      <span className="pixel-safe-coins" />
      <span className="pixel-safe-door">
        <span className="pixel-safe-door-inner" />
        <span className="pixel-safe-wheel" />
        <span className="pixel-safe-wheel-center" />
        <span className="pixel-safe-bolt pixel-safe-bolt-a" />
        <span className="pixel-safe-bolt pixel-safe-bolt-b" />
        <span className="pixel-safe-bolt pixel-safe-bolt-c" />
        <span className="pixel-safe-bolt pixel-safe-bolt-d" />
      </span>
    </span>
  );
}
