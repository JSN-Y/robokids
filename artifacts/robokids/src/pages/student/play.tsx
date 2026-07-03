import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { Play, RotateCcw, List, Loader2, Heart } from "lucide-react";
import { useGetLevel, useSubmitAttempt, getGetLevelQueryKey, useGetMe, useListShopItems, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

import Arena from "@/components/arena";
import DragBlocks from "@/components/drag-blocks";
import CodeBook from "@/components/code-book";
import WinOverlay from "@/components/win-overlay";
import { sounds } from "@/lib/sounds";
import { RobotMascot, WallMascot, MonsterMascot, GoalMascot } from "@/components/mascots";
import { useEquipment } from "@/lib/equipment";

// ── Block palette ──────────────────────────────────────────
const BLOCK_PALETTE = [
  { id: "p_fwd",  label: "Avancer",   pythonLabel: "robot.drive(forward=1)",   icon: "➡️", color: "blue",   category: "motion", description: "Avancer vers la droite" },
  { id: "p_back", label: "Reculer",   pythonLabel: "robot.drive(backward=1)",  icon: "⬅️", color: "blue",   category: "motion", description: "Reculer vers la gauche" },
  { id: "p_up",   label: "Monter",    pythonLabel: "robot.drive(up=1)",         icon: "⬆️", color: "green",  category: "motion", description: "Aller vers le haut" },
  { id: "p_down", label: "Descendre", pythonLabel: "robot.drive(down=1)",       icon: "⬇️", color: "yellow", category: "motion", description: "Aller vers le bas" },
  { id: "p_atk",  label: "Attaquer", pythonLabel: "robot.attack()",            icon: "⚔️", color: "red",    category: "action", description: "Attaquer un ennemi adjacent" },
];

const DEFAULT_PYTHON = `# MicroPython Robot – Mosaicinic
# Commandes disponibles :
#   robot.drive(forward=N)   → avance de N cases (droite)
#   robot.drive(backward=N)  → recule de N cases (gauche)
#   robot.drive(up=N)        → monte de N cases
#   robot.drive(down=N)      → descend de N cases
#   robot.attack()           → attaque un ennemi adjacent

robot.drive(forward=1)
robot.drive(up=1)
`;

const HEART_REGEN_MS = 10 * 60 * 1000; // 10 minutes per heart

// ── Boost IDs → effects ───────────────────────────────────
// 13: Bouclier x2   🛡️  → 2 HP (absorb 1 hit before dying)
// 14: Turbo Vitesse 🚀  → halve movement delay
// 15: Super Attaque ⚔️  → attack kills all 4 adjacent at once
// 16: Vies Bonus    ❤️  → 3 HP (absorb 2 hits before dying)
// 17: Aimant Pièces 🧲  → passive (server-side coins bonus)
// 18: Potion XP     🧪  → passive (server-side XP bonus)

function getBoostEffects(boostId: number | null) {
  return {
    maxHP:        boostId === 16 ? 3 : boostId === 13 ? 2 : 1,
    moveDelay:    boostId === 14 ? 120 : 240,
    superAttack:  boostId === 15,
  };
}

function parseMicroPython(code: string): string[] {
  const lines = code.split("\n");
  const commands: string[] = [];
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith("#") || !line) continue;
    let match;
    if ((match = line.match(/robot\.drive\(\s*forward\s*=\s*(\d+)\s*\)/)))  for (let i = 0; i < parseInt(match[1], 10); i++) commands.push("p_fwd");
    else if ((match = line.match(/robot\.drive\(\s*backward\s*=\s*(\d+)\s*\)/))) for (let i = 0; i < parseInt(match[1], 10); i++) commands.push("p_back");
    else if ((match = line.match(/robot\.drive\(\s*up\s*=\s*(\d+)\s*\)/)))   for (let i = 0; i < parseInt(match[1], 10); i++) commands.push("p_up");
    else if ((match = line.match(/robot\.drive\(\s*down\s*=\s*(\d+)\s*\)/))) for (let i = 0; i < parseInt(match[1], 10); i++) commands.push("p_down");
    else if (line.includes("robot.attack()")) commands.push("p_atk");
  }
  return commands;
}

function moveEnemies(monsters: [number, number][], player: [number, number], grid: string[][]): [number, number][] {
  return monsters.map((m) => {
    const dr = player[0] - m[0], dc = player[1] - m[1];
    const candidates: [number, number][] = [];
    if (Math.abs(dr) >= Math.abs(dc)) {
      if (dr !== 0) candidates.push([m[0] + Math.sign(dr), m[1]]);
      if (dc !== 0) candidates.push([m[0], m[1] + Math.sign(dc)]);
    } else {
      if (dc !== 0) candidates.push([m[0], m[1] + Math.sign(dc)]);
      if (dr !== 0) candidates.push([m[0] + Math.sign(dr), m[1]]);
    }
    for (const [nr, nc] of candidates) {
      if (nr < 0 || nr >= grid.length || nc < 0 || nc >= (grid[0]?.length ?? 0)) continue;
      if (grid[nr][nc] === "#") continue;
      return [nr, nc] as [number, number];
    }
    return m;
  });
}

type OverlayState = { show: boolean; success: boolean; coins?: number; hearts?: number; nextLevelId?: number | null };

// ── Hearts countdown component ────────────────────────────
function HeartsTimer({ heartsLastLostAt, onReady }: { heartsLastLostAt: number; onReady: () => void }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const nextAt = heartsLastLostAt + HEART_REGEN_MS;
      const r = Math.max(0, nextAt - Date.now());
      setRemaining(r);
      if (r === 0) onReady();
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [heartsLastLostAt, onReady]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      <div className="text-5xl font-mono font-bold text-destructive">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
      <p className="text-sm text-muted-foreground">avant ta prochaine vie ❤️</p>
    </div>
  );
}

// ── HP display component ──────────────────────────────────
function HPBar({ current, max }: { current: number; max: number }) {
  if (max <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Heart
          key={i}
          className={`w-5 h-5 transition-all ${i < current ? "text-red-500 fill-red-500" : "text-muted-foreground/30 fill-muted-foreground/10"}`}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function PlayLevel() {
  const params = useParams();
  const levelId = parseInt(params.levelId || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: level, isLoading: isLevelLoading } = useGetLevel(levelId, {
    query: { enabled: !!levelId, queryKey: getGetLevelQueryKey(levelId) },
  });
  const { data: me } = useGetMe();
  const submitAttempt = useSubmitAttempt();
  const { getWeaponType, equipped } = useEquipment();
  const { data: shopItems } = useListShopItems();

  const [program, setProgram]             = useState<string[]>([]);
  const [pythonCode, setPythonCode]       = useState(DEFAULT_PYTHON);
  const [playerPos, setPlayerPos]         = useState<[number, number]>([0, 0]);
  const [monsters, setMonsters]           = useState<[number, number][]>([]);
  const [visitedCells, setVisitedCells]   = useState<Set<string>>(new Set());
  const [attackAnim, setAttackAnim]       = useState<[number, number] | null>(null);
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [playerHP, setPlayerHP]           = useState(1);
  const [isRunning, setIsRunning]         = useState(false);
  const [overlayState, setOverlayState]   = useState<OverlayState | null>(null);
  const [showCodebook, setShowCodebook]   = useState(false);
  const [activeTab, setActiveTab]         = useState("blocks");

  const userCategory = me?.category ?? 1;
  const showPythonTab = userCategory === 3;
  const blockMode = userCategory === 2 ? "python-blocks" : "visual";

  useEffect(() => {
    if (userCategory === 3) setActiveTab("python");
    else setActiveTab("blocks");
  }, [userCategory]);

  const weaponType   = getWeaponType();
  const boostEffects = React.useMemo(() => getBoostEffects(equipped.boostId), [equipped.boostId]);

  const equippedSkinIcon = React.useMemo(() => {
    if (!equipped.skinId) return null;
    return shopItems?.find((s) => s.id === equipped.skinId)?.icon ?? null;
  }, [equipped.skinId, shopItems]);

  const parsedConfig = React.useMemo(() => {
    if (!level?.config) return null;
    try { return typeof level.config === "string" ? JSON.parse(level.config) : level.config; }
    catch { return null; }
  }, [level]);

  const resetLevel = useCallback(() => {
    if (!parsedConfig) return;
    const ps = parsedConfig.playerStart as [number, number];
    setPlayerPos([ps[0], ps[1]]);
    const init = (parsedConfig.grid as string[][])
      .flatMap((row: string[], r: number) =>
        row.map((cell: string, c: number) => cell === "M" || cell === "B" ? ([r, c] as [number, number]) : null)
      ).filter(Boolean) as [number, number][];
    setMonsters(init);
    setVisitedCells(new Set([`${ps[0]},${ps[1]}`]));
    setAttackAnim(null);
    setPlayerAttacking(false);
    setPlayerDamaged(false);
    setPlayerHP(boostEffects.maxHP);
    setOverlayState(null);
    setIsRunning(false);
  }, [parsedConfig, boostEffects.maxHP]);

  useEffect(() => { resetLevel(); }, [resetLevel]);

  // Hearts: 0 = blocked, compute countdown from heartsLastLostAt
  const heartsCount       = me?.hearts ?? 5;
  const heartsLastLostAt  = (me as any)?.heartsLastLostAt as number | null | undefined;
  const isBlocked         = heartsCount <= 0;

  const handleHeartsReady = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  }, [queryClient]);

  const executeProgram = useCallback(async () => {
    if (!parsedConfig || !level) return;
    if (isBlocked) {
      toast({ title: "Plus de vies !", description: "Attends que tes vies se rechargent.", variant: "destructive" });
      return;
    }
    setIsRunning(true);
    setOverlayState(null);

    const commands   = activeTab === "python" ? parseMicroPython(pythonCode) : program;
    const grid       = parsedConfig.grid as string[][];
    const ps         = parsedConfig.playerStart as [number, number];
    const goal       = parsedConfig.goal as [number, number];
    const enemyMoves = !!parsedConfig.enemyMoves;
    const { moveDelay, maxHP, superAttack } = boostEffects;

    let pos: [number, number]         = [ps[0], ps[1]];
    let currentHP                     = maxHP;
    let curMonsters: [number, number][] = grid
      .flatMap((row: string[], r: number) =>
        row.map((cell: string, c: number) => cell === "M" || cell === "B" ? ([r, c] as [number, number]) : null)
      ).filter(Boolean) as [number, number][];

    const visited = new Set<string>([`${pos[0]},${pos[1]}`]);
    let success = false;
    let dead    = false;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const flashDamage = async () => {
      setPlayerDamaged(true);
      sounds.fail();
      await delay(350);
      setPlayerDamaged(false);
    };

    const doAttack = async (atPos: [number, number]) => {
      // Always show swing on player cell first
      setPlayerAttacking(true);
      sounds.attack();

      const adj: [number, number][] = superAttack
        ? [[atPos[0]-1,atPos[1]],[atPos[0]+1,atPos[1]],[atPos[0],atPos[1]-1],[atPos[0],atPos[1]+1]]
        : [[atPos[0]-1,atPos[1]],[atPos[0]+1,atPos[1]],[atPos[0],atPos[1]-1],[atPos[0],atPos[1]+1]];

      // Show all adjacent targets at once for super, else one at a time
      let killed = false;
      if (superAttack) {
        // Kill everything adjacent simultaneously
        const toKill = adj.filter(a => curMonsters.some(m => m[0] === a[0] && m[1] === a[1]));
        if (toKill.length > 0) {
          toKill.forEach(a => setAttackAnim(a));
          killed = true;
          await delay(300);
          curMonsters = curMonsters.filter(m => !toKill.some(a => a[0] === m[0] && a[1] === m[1]));
          setMonsters([...curMonsters]);
          setAttackAnim(null);
        }
      } else {
        for (const a of adj) {
          const mi = curMonsters.findIndex(m => m[0] === a[0] && m[1] === a[1]);
          if (mi !== -1) {
            setAttackAnim(a);
            await delay(320);
            curMonsters = curMonsters.filter((_, i) => i !== mi);
            setMonsters([...curMonsters]);
            setAttackAnim(null);
            killed = true;
            break; // one hit at a time for non-super
          }
        }
      }

      await delay(killed ? 80 : 250);
      setPlayerAttacking(false);
    };

    setPlayerHP(currentHP);

    for (const cmd of commands) {
      if (dead) break;

      if (cmd === "p_atk") {
        await doAttack(pos);
        continue;
      }

      // Move player
      let np: [number, number] = [...pos];
      if      (cmd === "p_fwd")  np = [pos[0], pos[1]+1];
      else if (cmd === "p_back") np = [pos[0], pos[1]-1];
      else if (cmd === "p_up")   np = [pos[0]-1, pos[1]];
      else if (cmd === "p_down") np = [pos[0]+1, pos[1]];

      const inBounds = np[0] >= 0 && np[0] < grid.length && np[1] >= 0 && np[1] < (grid[0]?.length ?? 0);
      const notWall  = inBounds && grid[np[0]][np[1]] !== "#";

      if (notWall) {
        pos = np;
        visited.add(`${pos[0]},${pos[1]}`);
        setPlayerPos([...pos]);
        setVisitedCells(new Set(visited));
        sounds.step();
        await delay(moveDelay);
      }

      // Check if stepped on a monster
      const hitIdx = curMonsters.findIndex(m => m[0] === pos[0] && m[1] === pos[1]);
      if (hitIdx !== -1) {
        if (currentHP > 1) {
          // Absorb hit: lose HP, remove monster
          currentHP -= 1;
          setPlayerHP(currentHP);
          curMonsters = curMonsters.filter((_, i) => i !== hitIdx);
          setMonsters([...curMonsters]);
          await flashDamage();
          toast({ title: `💔 Touché ! (${currentHP}/${maxHP} vies)`, variant: "destructive" });
        } else {
          dead = true; break;
        }
      }

      if (pos[0] === goal[0] && pos[1] === goal[1]) { success = true; break; }

      if (enemyMoves && curMonsters.length > 0) {
        curMonsters = moveEnemies(curMonsters, pos, grid);
        setMonsters([...curMonsters]);
        await delay(160);

        // Enemy reached player
        const hitAfterMove = curMonsters.findIndex(m => m[0] === pos[0] && m[1] === pos[1]);
        if (hitAfterMove !== -1) {
          if (currentHP > 1) {
            currentHP -= 1;
            setPlayerHP(currentHP);
            curMonsters = curMonsters.filter((_, i) => i !== hitAfterMove);
            setMonsters([...curMonsters]);
            await flashDamage();
            toast({ title: `💔 Touché ! (${currentHP}/${maxHP} vies)`, variant: "destructive" });
          } else {
            dead = true; break;
          }
        }
      }
    }

    if (!dead && pos[0] === goal[0] && pos[1] === goal[1]) success = true;
    sounds[success ? "win" : "fail"]();

    submitAttempt.mutate(
      { data: { levelId: level.id, success } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getGetLevelQueryKey(levelId) });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setOverlayState({
            show: true, success,
            coins: (data as any).coinsEarned,
            hearts: (data as any).heartsRemaining,
            nextLevelId: (data as any).nextLevelId,
          });
        },
        onError: () => setOverlayState({ show: true, success, coins: 0 }),
      }
    );
    setIsRunning(false);
  }, [parsedConfig, level, program, pythonCode, activeTab, submitAttempt, queryClient, levelId, isBlocked, boostEffects, toast]);

  if (isLevelLoading) {
    return (
      <div className="flex-1 flex flex-col p-4 md:p-8 gap-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!level || !parsedConfig) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Niveau introuvable.</p>
      </div>
    );
  }

  const isBoss = !!parsedConfig.enemyMoves || level.title.toLowerCase().includes("boss");

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/chapters")}>← Niveaux</Button>
          <div>
            <h1 className="font-bold text-lg leading-tight">{level.title}</h1>
            <p className="text-xs text-muted-foreground">{level.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {parsedConfig.enemyMoves && (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/30 animate-pulse">
              ⚠️ Ennemis mobiles
            </span>
          )}
          {/* Hearts display */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart key={i} className={`w-4 h-4 transition-all ${i < heartsCount ? "text-red-500 fill-red-500" : "text-muted-foreground/20 fill-muted-foreground/10"}`} />
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground">🪙 {level.coinReward}</span>
          <Button variant="outline" size="sm" onClick={() => setShowCodebook(!showCodebook)}>
            <List className="w-4 h-4 mr-1" /> Manuel
          </Button>
        </div>
      </div>

      {/* Blocked: no hearts */}
      {isBlocked && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 max-w-sm w-full">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-destructive mb-2">Plus de vies !</h2>
            <p className="text-muted-foreground mb-4">Tes vies se rechargent automatiquement. Reviens dans :</p>
            {heartsLastLostAt && (
              <HeartsTimer heartsLastLostAt={heartsLastLostAt} onReady={handleHeartsReady} />
            )}
            <Button variant="outline" className="mt-4 w-full" onClick={() => setLocation("/dashboard")}>
              ← Retour au tableau de bord
            </Button>
          </div>
        </div>
      )}

      {/* Normal play layout */}
      {!isBlocked && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 gap-0">
          {/* Coding panel */}
          <div className="lg:w-1/2 flex flex-col border-r border-border overflow-hidden">
            {showPythonTab ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 pt-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-500 font-mono">🐍 Python</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">MicroPython</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={resetLevel} disabled={isRunning}><RotateCcw className="w-4 h-4" /></Button>
                    <Button size="sm" onClick={executeProgram} disabled={isRunning}>
                      {isRunning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                      Exécuter
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden p-4">
                  <Textarea
                    value={pythonCode}
                    onChange={(e) => setPythonCode(e.target.value)}
                    className="h-full font-mono text-sm resize-none bg-gray-900 text-green-400 border-gray-700"
                    spellCheck={false}
                    data-testid="python-editor"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 pt-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {blockMode === "python-blocks" ? "🐍 Blocs Python" : "🧩 Blocs"}
                    </span>
                    {blockMode === "python-blocks" && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">code visible</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={resetLevel} disabled={isRunning} data-testid="btn-reset"><RotateCcw className="w-4 h-4" /></Button>
                    <Button size="sm" onClick={executeProgram} disabled={isRunning} data-testid="btn-run">
                      {isRunning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                      Exécuter
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden p-4">
                  <DragBlocks
                    palette={BLOCK_PALETTE}
                    program={program}
                    onProgramChange={setProgram}
                    maxBlocks={20}
                    mode={blockMode}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Arena panel */}
          <div className="lg:w-1/2 flex flex-col p-4 overflow-hidden min-h-0">
            {/* HP bar + boost indicator */}
            <div className="flex items-center justify-between mb-2 shrink-0">
              <HPBar current={playerHP} max={boostEffects.maxHP} />
              {equipped.boostId && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {shopItems?.find(s => s.id === equipped.boostId)?.icon} {shopItems?.find(s => s.id === equipped.boostId)?.name}
                </span>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
              <Arena
                config={{ grid: parsedConfig.grid, playerStart: parsedConfig.playerStart, goal: parsedConfig.goal }}
                playerPos={playerPos}
                monsters={monsters}
                visitedCells={visitedCells}
                attackAnim={attackAnim}
                playerAttacking={playerAttacking}
                weaponType={weaponType}
                playerSkinIcon={equippedSkinIcon}
                playerDamaged={playerDamaged}
                isBoss={isBoss}
              />
            </div>

            <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs font-medium text-muted-foreground shrink-0 bg-background/50 p-2 rounded-lg border border-border/50">
              <div className="flex items-center gap-1"><RobotMascot size={14} animate={false} /> Robot</div>
              <div className="flex items-center gap-1"><GoalMascot size={14} animate={false} /> Objectif</div>
              <div className="flex items-center gap-1"><WallMascot size={14} /> Mur</div>
              <div className="flex items-center gap-1"><MonsterMascot size={14} animate={false} /> Monstre</div>
              {weaponType && (
                <div className="flex items-center gap-1">
                  <span>{weaponType === "gun" ? "🔫" : weaponType === "wand" ? "🪄" : "⚔️"}</span>
                  <span>{weaponType === "gun" ? "Pistolet" : weaponType === "wand" ? "Baguette" : "Épée"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CodeBook isOpen={showCodebook} onClose={() => setShowCodebook(false)} category={userCategory} />

      {overlayState?.show && (
        <WinOverlay
          success={overlayState.success}
          coinsEarned={overlayState.coins}
          heartsRemaining={overlayState.hearts}
          nextLevelId={overlayState.nextLevelId}
          onRetry={() => { setOverlayState(null); resetLevel(); }}
        />
      )}
    </div>
  );
}
