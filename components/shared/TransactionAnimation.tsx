"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type TransactionAnimationProps = {
  isTransacting: boolean;
};

type CoinParticle = {
  duration: number;
  id: number;
  rotation: number;
  size: number;
  startLeftPercent: number;
  targetOffsetX: number;
  wobbleX: number;
};

type PixelRect = {
  color: string;
  glow?: string;
  height: number;
  opacity?: number;
  width: number;
  x: number;
  y: number;
};

const STATUS_MESSAGES = [
  "CONFIRMING ON BASE CHAIN...",
  "MINING YIELD...",
] as const;

const PIXEL_OCTAGON_CLIP_PATH =
  "polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%)";
const PIXEL_PANEL_CLIP_PATH =
  "polygon(10px 0, calc(100% - 10px) 0, calc(100% - 10px) 4px, calc(100% - 4px) 4px, calc(100% - 4px) 10px, 100% 10px, 100% calc(100% - 10px), calc(100% - 4px) calc(100% - 10px), calc(100% - 4px) calc(100% - 4px), calc(100% - 10px) calc(100% - 4px), calc(100% - 10px) 100%, 10px 100%, 10px calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 10px), 0 calc(100% - 10px), 0 10px, 4px 10px, 4px 4px, 10px 4px)";
const MAX_ACTIVE_COINS = 28;
const VAULT_PIXEL_SIZE = "clamp(6px, 0.72vw, 10px)";
const VAULT_SPRITE_WIDTH = 18;
const VAULT_SPRITE_HEIGHT = 17;
const VAULT_PIXEL_RECTS: PixelRect[] = [
  { color: "rgba(0, 0, 0, 0.45)", height: 1, opacity: 0.9, width: 10, x: 4, y: 15 },
  { color: "rgba(0, 0, 0, 0.22)", height: 1, opacity: 0.65, width: 12, x: 3, y: 16 },
  { color: "rgba(62, 255, 170, 0.05)", glow: "rgba(62, 255, 170, 0.16)", height: 6, width: 6, x: 6, y: 5 },
  { color: "#c7d2d9", height: 1, width: 4, x: 7, y: 0 },
  { color: "#92a0a8", height: 1, width: 6, x: 6, y: 1 },
  { color: "#66737c", height: 1, width: 8, x: 5, y: 2 },
  { color: "#23483b", height: 10, width: 11, x: 2, y: 3 },
  { color: "#0a1511", height: 8, width: 9, x: 3, y: 4 },
  { color: "#173126", height: 1, width: 9, x: 3, y: 4 },
  { color: "#17352a", height: 8, width: 1, x: 3, y: 4 },
  { color: "#0d1f18", height: 1, width: 10, x: 2, y: 13 },
  { color: "#55626a", height: 8, width: 2, x: 13, y: 4 },
  { color: "#7b8992", height: 1, width: 1, x: 14, y: 4 },
  { color: "#333c42", height: 7, width: 1, x: 15, y: 5 },
  { color: "#52f0aa", glow: "rgba(82, 240, 170, 0.24)", height: 3, width: 3, x: 4, y: 6 },
  { color: "#142a21", height: 1, width: 1, x: 5, y: 7 },
  { color: "#d8fff0", height: 1, width: 1, x: 5, y: 6 },
  { color: "#59f2ad", glow: "rgba(89, 242, 173, 0.22)", height: 6, width: 4, x: 8, y: 5 },
  { color: "#0f2d23", height: 4, width: 2, x: 9, y: 6 },
  { color: "#184135", height: 1, width: 2, x: 9, y: 6 },
  { color: "#0b1713", height: 2, width: 1, x: 10, y: 7 },
  { color: "#cbffe5", height: 3, width: 1, x: 10, y: 7 },
  { color: "#cbffe5", height: 1, width: 3, x: 9, y: 8 },
  { color: "#0b1f18", height: 1, width: 1, x: 10, y: 8 },
  { color: "#9effd6", height: 1, width: 1, x: 9, y: 5 },
  { color: "#9effd6", height: 1, width: 1, x: 11, y: 5 },
  { color: "#9effd6", height: 1, width: 1, x: 9, y: 10 },
  { color: "#9effd6", height: 1, width: 1, x: 11, y: 10 },
  { color: "#ffd451", height: 1, width: 1, x: 8, y: 12 },
  { color: "#ffbf2f", height: 1, width: 1, x: 9, y: 11 },
  { color: "#ffe487", height: 1, width: 1, x: 10, y: 12 },
  { color: "#ffd451", height: 1, width: 1, x: 11, y: 11 },
  { color: "#ffbf2f", height: 1, width: 1, x: 12, y: 12 },
  { color: "#9dffe1", glow: "rgba(157, 255, 225, 0.32)", height: 1, width: 1, x: 8, y: 0 },
  { color: "#9dffe1", glow: "rgba(157, 255, 225, 0.32)", height: 1, width: 1, x: 9, y: 0 },
];
const VAULT_PIXELS = expandPixelRects(VAULT_PIXEL_RECTS);

function createCoinParticle(id: number): CoinParticle {
  return {
    duration: 1.15 + Math.random() * 0.6,
    id,
    rotation: (Math.random() > 0.5 ? 1 : -1) * (90 + Math.random() * 160),
    size: 18 + Math.round(Math.random() * 10),
    startLeftPercent: 20 + Math.random() * 60,
    targetOffsetX: -10 + Math.random() * 20,
    wobbleX: -18 + Math.random() * 36,
  };
}

export function TransactionAnimation({
  isTransacting,
}: TransactionAnimationProps) {
  const [coins, setCoins] = useState<CoinParticle[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const nextCoinId = useRef(0);

  useEffect(() => {
    if (!isTransacting) {
      return;
    }

    let timeoutId: number | null = null;
    let isCancelled = false;

    const spawnCoin = () => {
      if (isCancelled) {
        return;
      }

      const nextCoin = createCoinParticle(nextCoinId.current++);
      setCoins((current) => [...current.slice(-(MAX_ACTIVE_COINS - 1)), nextCoin]);

      timeoutId = window.setTimeout(
        spawnCoin,
        100 + Math.round(Math.random() * 100),
      );
    };

    spawnCoin();

    return () => {
      isCancelled = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isTransacting]);

  useEffect(() => {
    if (!isTransacting) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % STATUS_MESSAGES.length);
    }, 1400);

    return () => window.clearInterval(intervalId);
  }, [isTransacting]);

  const removeCoin = (coinId: number) => {
    setCoins((current) => current.filter((coin) => coin.id !== coinId));
  };

  return (
    <AnimatePresence>
      {isTransacting ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div
            className="relative h-full w-full overflow-hidden"
            role="status"
            aria-live="polite"
            aria-label={STATUS_MESSAGES[messageIndex]}
          >
            <div
              className="absolute inset-3 border border-[rgba(0,255,157,0.22)] opacity-90"
              style={{ clipPath: PIXEL_PANEL_CLIP_PATH }}
            />
            <div
              className="absolute inset-[18px] border border-[rgba(255,255,255,0.06)]"
              style={{ clipPath: PIXEL_PANEL_CLIP_PATH }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,157,0.08),transparent_28%),radial-gradient(circle_at_bottom,rgba(255,196,0,0.06),transparent_22%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0,rgba(255,255,255,0.02)_1px,transparent_1px,transparent_6px)] opacity-30" />
            <div className="absolute left-1/2 top-6 -translate-x-1/2">
              <div
                className="bg-[#08120f]/95 px-4 py-2 shadow-[0_0_18px_rgba(0,255,157,0.08)]"
                style={{ clipPath: PIXEL_PANEL_CLIP_PATH }}
              >
                <p className="font-pixel text-center text-[0.45rem] uppercase tracking-[0.16em] text-[var(--color-accent)] md:text-[0.55rem]">
                  YIELD-PAY // TRANSACTION PIPELINE
                </p>
              </div>
            </div>
            <AnimatePresence>
              {coins.map((coin) => (
                <motion.div
                  key={coin.id}
                  className="pointer-events-none absolute"
                  style={{
                    height: `${coin.size}px`,
                    width: `${coin.size}px`,
                    willChange: "left, top, transform, opacity",
                  }}
                  initial={{
                    left: `calc(${coin.startLeftPercent}% - ${coin.size / 2}px)`,
                    opacity: 0,
                    rotate: 0,
                    scale: 0.72,
                    top: "-56px",
                  }}
                  animate={{
                    left: [
                      `calc(${coin.startLeftPercent}% - ${coin.size / 2}px)`,
                      `calc(${coin.startLeftPercent}% - ${coin.size / 2}px + ${coin.wobbleX}px)`,
                      `calc(50% - ${coin.size / 2}px + ${coin.targetOffsetX}px)`,
                    ],
                    opacity: [0, 1, 1, 0.96],
                    rotate: coin.rotation,
                    scale: [0.72, 1, 1, 0.84],
                    top: "calc(50% - 4.65rem)",
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: coin.duration,
                    ease: "linear",
                  }}
                  onAnimationComplete={() => removeCoin(coin.id)}
                >
                  <PixelCoin />
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <motion.div
                className="mb-4"
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{
                  duration: 0.75,
                  ease: "linear",
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                <IntakeBeacon />
              </motion.div>

              <div
                className="relative px-6 py-5"
                style={{ clipPath: PIXEL_PANEL_CLIP_PATH }}
              >
                <div className="absolute inset-0 border border-[rgba(0,255,157,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0)),rgba(7,13,11,0.88)]" />
                <div className="absolute inset-[4px] border border-[rgba(255,255,255,0.05)]" />
                <div className="absolute inset-x-5 top-2 h-[3px] bg-[linear-gradient(90deg,transparent,rgba(175,255,226,0.72),transparent)]" />
              <motion.div
                className="relative"
                animate={{ scale: [1, 1.03, 1], y: [0, -3, 0] }}
                transition={{
                  duration: 1.35,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                <PixelVault />
              </motion.div>
              </div>

              <motion.p
                className="font-pixel mt-6 max-w-[18rem] text-center text-[0.58rem] uppercase tracking-[0.16em] text-[var(--color-accent)] [text-shadow:2px_0_0_rgba(2,10,7,0.9),0_2px_0_rgba(2,10,7,0.9)] md:max-w-[24rem] md:text-[0.72rem]"
                animate={{ opacity: [1, 0.42, 1] }}
                transition={{
                  duration: 1,
                  ease: "linear",
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                {STATUS_MESSAGES[messageIndex]}
              </motion.p>
              <p className="font-pixel mt-3 text-center text-[0.42rem] uppercase tracking-[0.18em] text-zinc-500 md:text-[0.5rem]">
                ROUTING FEES INTO FUTURE YIELD
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function PixelCoin() {
  return (
    <span className="relative block h-full w-full">
      <span
        className="absolute inset-0 border-2 border-[#8a5300] bg-[#d79613] shadow-[inset_0_2px_0_rgba(255,247,194,0.35),0_0_14px_rgba(255,190,38,0.22)]"
        style={{ clipPath: PIXEL_OCTAGON_CLIP_PATH }}
      />
      <span
        className="absolute border-2 border-[#f0c13c] bg-[#ffe16b]"
        style={{
          clipPath: PIXEL_OCTAGON_CLIP_PATH,
          inset: "14%",
        }}
      />
      <span
        className="absolute left-1/2 top-[18%] h-[64%] w-[2px] -translate-x-1/2 bg-[#d88e05]"
        style={{
          boxShadow:
            "6px 0 0 0 rgba(216, 142, 5, 0.95), -6px 0 0 0 rgba(216, 142, 5, 0.95)",
        }}
      />
      <span className="absolute left-[24%] top-[20%] h-[14%] w-[18%] bg-[#fff4b2]" />
    </span>
  );
}

function PixelVault() {
  return (
    <div
      className="relative"
      aria-hidden="true"
      style={{
        height: `calc(${VAULT_SPRITE_HEIGHT} * ${VAULT_PIXEL_SIZE})`,
        width: `calc(${VAULT_SPRITE_WIDTH} * ${VAULT_PIXEL_SIZE})`,
      }}
    >
      {VAULT_PIXELS.map((pixel, index) => (
        <span
          key={`${pixel.x}-${pixel.y}-${index}`}
          className="absolute"
          style={{
            backgroundColor: pixel.color,
            boxShadow: pixel.glow
              ? `0 0 0 1px ${pixel.glow}, 0 0 12px ${pixel.glow}`
              : undefined,
            height: `calc(${pixel.height} * ${VAULT_PIXEL_SIZE})`,
            left: `calc(${pixel.x} * ${VAULT_PIXEL_SIZE})`,
            opacity: pixel.opacity ?? 1,
            top: `calc(${pixel.y} * ${VAULT_PIXEL_SIZE})`,
            width: `calc(${pixel.width} * ${VAULT_PIXEL_SIZE})`,
          }}
        />
      ))}
    </div>
  );
}

function IntakeBeacon() {
  return (
    <div className="relative h-6 w-16" aria-hidden="true">
      <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-[#4affb1] shadow-[0_0_10px_rgba(74,255,177,0.55)]" />
      <span className="absolute left-1/2 top-1/2 h-6 w-[6px] -translate-x-1/2 -translate-y-1/2 bg-[#ffe27e] shadow-[0_0_10px_rgba(255,226,126,0.45)]" />
      <span className="absolute left-2 top-1/2 h-3 w-[4px] -translate-y-1/2 bg-[#8dffd6]" />
      <span className="absolute right-2 top-1/2 h-3 w-[4px] -translate-y-1/2 bg-[#8dffd6]" />
    </div>
  );
}

function expandPixelRects(rects: PixelRect[]) {
  return rects.flatMap((rect) =>
    Array.from({ length: rect.height * rect.width }, (_, index) => {
      const offsetX = index % rect.width;
      const offsetY = Math.floor(index / rect.width);

      return {
        color: rect.color,
        glow: rect.glow,
        height: 1,
        opacity: rect.opacity,
        width: 1,
        x: rect.x + offsetX,
        y: rect.y + offsetY,
      };
    }),
  );
}
