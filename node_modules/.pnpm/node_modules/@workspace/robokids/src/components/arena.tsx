import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RobotMascot, WallMascot, MonsterMascot, BossMascot, GoalMascot } from "@/components/mascots";

export interface ArenaConfig {
  grid: string[][];
  playerStart: [number, number];
  goal: [number, number];
}

export interface ArenaProps {
  config: ArenaConfig;
  playerPos: [number, number];
  monsters: [number, number][];
  visitedCells?: Set<string>;
  isBoss?: boolean;
  attackAnim?: [number, number] | null;   // monster cell that was hit
  playerAttacking?: boolean;              // show weapon swing on player cell
  weaponType?: "sword" | "gun" | "wand" | null;
  playerSkinIcon?: string | null;
  playerDamaged?: boolean;                // flash red when player takes a hit
  editable?: boolean;
  onCellClick?: (r: number, c: number) => void;
  selectedTool?: string;
}

/* ── Attack overlays ──────────────────────────────────── */
function SwordSwing({ onPlayer }: { onPlayer?: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      initial={{ scale: 0, rotate: -60, opacity: 0 }}
      animate={{ scale: [0, 1.5, 1], rotate: ["-60deg", "30deg", "15deg"], opacity: [0, 1, 0] }}
      transition={{ duration: 0.35 }}
    >
      <span className="text-3xl drop-shadow-lg select-none">{onPlayer ? "⚔️" : "💢"}</span>
    </motion.div>
  );
}

function GunBlast({ onPlayer }: { onPlayer?: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.6, 0.8], opacity: [0, 1, 0] }}
      transition={{ duration: 0.25 }}
    >
      <span className="text-3xl drop-shadow-lg select-none">{onPlayer ? "🔫" : "💥"}</span>
    </motion.div>
  );
}

function WandCast({ onPlayer }: { onPlayer?: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.4, 0.9], opacity: [0, 1, 0] }}
      transition={{ duration: 0.4 }}
    >
      <span className="text-3xl drop-shadow-lg select-none">{onPlayer ? "🪄" : "✨"}</span>
    </motion.div>
  );
}

function AttackOverlay({ weaponType, onPlayer }: { weaponType: "sword" | "gun" | "wand" | null; onPlayer?: boolean }) {
  if (weaponType === "gun")  return <GunBlast  onPlayer={onPlayer} />;
  if (weaponType === "wand") return <WandCast  onPlayer={onPlayer} />;
  return <SwordSwing onPlayer={onPlayer} />;
}

/* ── Player cell ────────────────────────────────────────── */
function PlayerCell({ skinIcon, damaged }: { skinIcon?: string | null; damaged?: boolean }) {
  if (skinIcon) {
    return (
      <motion.div
        className={cn("absolute inset-0 z-10 flex items-center justify-center select-none rounded-md", damaged && "bg-red-400/60")}
        animate={damaged ? { backgroundColor: ["rgba(248,113,113,0.6)", "rgba(0,0,0,0)"] } : { y: [0, -2, 0] }}
        transition={damaged ? { duration: 0.3 } : { repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      >
        <span style={{ fontSize: "clamp(18px, 5vw, 40px)", lineHeight: 1 }}>{skinIcon}</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      className={cn("absolute inset-0 z-10 flex items-center justify-center rounded-md", damaged && "bg-red-400/60")}
      animate={damaged ? { backgroundColor: ["rgba(248,113,113,0.6)", "rgba(0,0,0,0)"] } : {}}
      transition={{ duration: 0.3 }}
    >
      <RobotMascot className="w-full h-full p-1" />
    </motion.div>
  );
}

export default function Arena({
  config,
  playerPos,
  monsters,
  visitedCells,
  isBoss,
  attackAnim,
  playerAttacking = false,
  weaponType = null,
  playerSkinIcon = null,
  playerDamaged = false,
  editable,
  onCellClick,
  selectedTool,
}: ArenaProps) {
  const { grid, goal } = config;

  return (
    <div className="relative w-full max-w-2xl aspect-square mx-auto bg-card rounded-xl border border-border shadow-sm p-3 overflow-hidden">
      <div
        className="w-full h-full grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${grid[0]?.length || 1}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${grid.length}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isPlayer    = playerPos[0] === r && playerPos[1] === c;
            const isGoal      = goal[0] === r && goal[1] === c;
            const isMonster   = monsters.some((m) => m[0] === r && m[1] === c);
            const isVisited   = visitedCells?.has(`${r},${c}`);
            const isHitTarget = attackAnim && attackAnim[0] === r && attackAnim[1] === c;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => editable && onCellClick && onCellClick(r, c)}
                className={cn(
                  "relative flex items-center justify-center rounded-md border border-border/50 transition-colors overflow-hidden",
                  cell === "#" ? "bg-muted" : "bg-background/50",
                  isVisited && !isPlayer && !isGoal && cell !== "#" && "bg-primary/10",
                  editable && "cursor-pointer hover:border-primary",
                  isHitTarget && "ring-2 ring-destructive"
                )}
                data-testid={`cell-${r}-${c}`}
              >
                {cell === "#" && <WallMascot className="w-full h-full p-1" />}
                {isGoal && !isPlayer && <GoalMascot className="w-full h-full p-2" />}
                {isMonster && (
                  isBoss
                    ? <BossMascot className="w-full h-full p-1" />
                    : <MonsterMascot className="w-full h-full p-2" />
                )}
                {isPlayer && <PlayerCell skinIcon={playerSkinIcon} damaged={playerDamaged} />}

                {/* Hit effect on monster cell */}
                <AnimatePresence>
                  {isHitTarget && (
                    <AttackOverlay key="hit" weaponType={weaponType} onPlayer={false} />
                  )}
                </AnimatePresence>

                {/* Weapon swing on player's own cell when attacking */}
                <AnimatePresence>
                  {isPlayer && playerAttacking && !isHitTarget && (
                    <AttackOverlay key="swing" weaponType={weaponType} onPlayer={true} />
                  )}
                </AnimatePresence>

                {/* Editor hover previews */}
                {editable && !isPlayer && !isGoal && !isMonster && cell !== "#" && (
                  <div className="opacity-0 hover:opacity-40 transition-opacity absolute inset-0 flex items-center justify-center">
                    {selectedTool === "#" && <WallMascot className="w-full h-full p-1" />}
                    {selectedTool === "M" && <MonsterMascot className="w-full h-full p-2" />}
                    {selectedTool === "B" && <BossMascot className="w-full h-full p-1" />}
                    {selectedTool === "G" && <GoalMascot className="w-full h-full p-2" />}
                    {selectedTool === "P" && <PlayerCell skinIcon={playerSkinIcon} />}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
