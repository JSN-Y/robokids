import React, { useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WinOverlayProps {
  success: boolean;
  coinsEarned?: number;
  heartsRemaining?: number;
  nextLevelId?: number | null;
  onRetry: () => void;
}

function Confetti() {
  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(60)].map((_, i) => {
        const color = colors[i % colors.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 1.5 + Math.random() * 1.5;
        const size = 6 + Math.random() * 10;
        const rotate = Math.random() * 360;
        return (
          <motion.div
            key={i}
            className="absolute rounded-sm"
            style={{ left: `${left}%`, top: -20, width: size, height: size, background: color, rotate }}
            initial={{ y: -20, opacity: 1, rotate }}
            animate={{ y: "110vh", opacity: [1, 1, 0], rotate: rotate + 720 }}
            transition={{ duration, delay, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}

function Stars() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => {
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 2;
        return (
          <motion.div
            key={i}
            className="absolute text-yellow-400 select-none"
            style={{ left: `${left}%`, top: `${top}%`, fontSize: 12 + Math.random() * 20 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.5] }}
            transition={{ duration: 0.6, delay, repeat: Infinity, repeatDelay: 1.5 + Math.random() * 2 }}
          >
            ⭐
          </motion.div>
        );
      })}
    </div>
  );
}

export default function WinOverlay({ success, coinsEarned, heartsRemaining, nextLevelId, onRetry }: WinOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {success ? (
          <>
            {/* Full-screen green burst */}
            <motion.div
              className="absolute inset-0 bg-green-500"
              initial={{ scale: 0, borderRadius: "50%" }}
              animate={{ scale: 3, borderRadius: "0%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-yellow-400/90 via-green-500/80 to-emerald-600/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            />

            <Confetti />
            <Stars />

            {/* Card */}
            <motion.div
              className="relative z-10 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-yellow-400 p-8 max-w-sm w-full mx-4 text-center"
              initial={{ scale: 0.3, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            >
              <motion.div
                className="text-8xl mb-4 select-none"
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                🏆
              </motion.div>

              <motion.h2
                className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-green-600 mb-2"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                VICTOIRE !
              </motion.h2>
              <p className="text-gray-600 font-medium mb-6">Mission accomplie, champion ! 🎉</p>

              {coinsEarned !== undefined && coinsEarned > 0 && (
                <motion.div
                  className="flex justify-center items-center gap-3 text-2xl font-black bg-yellow-100 py-4 px-6 rounded-2xl border-2 border-yellow-300 mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ type: "spring", delay: 0.6 }}
                >
                  <span className="text-yellow-600">+{coinsEarned}</span>
                  <span>🪙</span>
                </motion.div>
              )}

              <div className="flex flex-col gap-3">
                {nextLevelId ? (
                  <Link href={`/play/${nextLevelId}`} className="w-full">
                    <Button size="lg" className="w-full text-lg h-14 font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0" data-testid="btn-next-level">
                      Niveau suivant <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/chapters" className="w-full">
                    <Button size="lg" className="w-full text-lg h-14 font-bold" data-testid="btn-next-level">
                      Voir les niveaux <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="lg" onClick={onRetry} className="h-12" data-testid="btn-retry-success">
                  <RotateCcw className="mr-2 h-4 w-4" /> Rejouer
                </Button>
              </div>
            </motion.div>
          </>
        ) : (
          <>
            {/* Full-screen red shake */}
            <motion.div
              className="absolute inset-0 bg-red-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8] }}
              transition={{ duration: 0.4 }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-red-800/95 via-red-600/90 to-red-900/95"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            />

            {/* Falling shards */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-red-300/30 rounded"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}%`,
                    width: 4 + Math.random() * 20,
                    height: 4 + Math.random() * 20,
                    rotate: Math.random() * 45,
                  }}
                  animate={{ y: "120vh", rotate: 720 + Math.random() * 720, opacity: [1, 0.5, 0] }}
                  transition={{ duration: 1 + Math.random(), delay: Math.random() * 0.5, ease: "easeIn" }}
                />
              ))}
            </div>

            {/* Card */}
            <motion.div
              className="relative z-10 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-red-400 p-8 max-w-sm w-full mx-4 text-center"
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: [0, -12, 12, -8, 8, 0] }}
              transition={{ duration: 0.5, x: { duration: 0.4, delay: 0.2 } }}
            >
              <motion.div
                className="text-8xl mb-4 select-none"
                animate={{ rotate: [0, -20, 20, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                💔
              </motion.div>

              <motion.h2
                className="text-5xl font-black text-red-600 mb-2"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                PERDU !
              </motion.h2>
              <p className="text-gray-600 font-medium mb-6">Ne lâche pas, tu vas y arriver ! 💪</p>

              {heartsRemaining !== undefined && (
                <div className="flex justify-center items-center gap-3 text-xl font-bold bg-red-50 py-4 px-6 rounded-2xl border-2 border-red-200 mb-6">
                  <span className="text-gray-600">Vies restantes :</span>
                  <div className="flex gap-1">
                    {[...Array(Math.max(0, heartsRemaining))].map((_, i) => (
                      <span key={i} className="text-2xl">❤️</span>
                    ))}
                    {heartsRemaining === 0 && <span className="text-red-500 font-bold">0</span>}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={onRetry}
                  className="w-full text-lg h-14 font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 text-white"
                  data-testid="btn-retry-fail"
                >
                  <RotateCcw className="mr-2 h-5 w-5" /> Réessayer
                </Button>
                <Link href="/chapters" className="w-full">
                  <Button variant="outline" size="lg" className="w-full h-12" data-testid="btn-chapters-fail">
                    Quitter
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
