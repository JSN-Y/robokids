import React, { useState, useCallback, useRef } from "react";
import { Wrench, Trash2, Save, Play, RotateCcw, Loader2, ListMusic, PlusCircle, Pencil, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Arena from "@/components/arena";
import { RobotMascot, WallMascot, MonsterMascot, BossMascot, GoalMascot } from "@/components/mascots";
import { sounds } from "@/lib/sounds";
import WinOverlay from "@/components/win-overlay";
import { useEquipment } from "@/lib/equipment";
import { useListShopItems, useGetMe } from "@workspace/api-client-react";

const DEFAULT_SIZE = 8;
const MAX_SIZE = 15;
const MIN_SIZE = 5;
const LEVELS_STORAGE_KEY = "mosaicinic_studio_levels";

type Tool = "." | "#" | "M" | "B" | "G" | "P";

const TOOLS: { id: Tool; label: string; icon: React.ReactNode; color: string }[] = [
  { id: ".",  label: "Sol",      icon: <div className="w-4 h-4 bg-background border border-dashed border-border/50 rounded-sm" />, color: "bg-background border border-border" },
  { id: "#",  label: "Mur",      icon: <WallMascot size={20} />,                     color: "bg-muted" },
  { id: "M",  label: "Monstre",  icon: <MonsterMascot size={20} animate={false} />,  color: "bg-red-500/10" },
  { id: "B",  label: "Boss",     icon: <BossMascot size={20} animate={false} />,     color: "bg-red-900/20" },
  { id: "G",  label: "Objectif", icon: <GoalMascot size={20} animate={false} />,     color: "bg-green-500/10" },
  { id: "P",  label: "Départ",   icon: <RobotMascot size={20} animate={false} />,    color: "bg-primary/10" },
];

const BLOCK_PALETTE = [
  { id: "p_fwd",  label: "Avancer",   icon: "➡️", color: "blue",   pythonLabel: "robot.drive(forward=1)" },
  { id: "p_back", label: "Reculer",   icon: "⬅️", color: "blue",   pythonLabel: "robot.drive(backward=1)" },
  { id: "p_up",   label: "Monter",    icon: "⬆️", color: "green",  pythonLabel: "robot.drive(up=1)" },
  { id: "p_down", label: "Descendre", icon: "⬇️", color: "yellow", pythonLabel: "robot.drive(down=1)" },
  { id: "p_atk",  label: "Attaquer", icon: "⚔️", color: "red",    pythonLabel: "robot.attack()" },
];

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500 border-blue-700", green: "bg-green-500 border-green-700",
  red: "bg-red-500 border-red-700", yellow: "bg-yellow-500 border-yellow-700",
};
const COLOR_MAP_PILL: Record<string, string> = {
  blue: "bg-blue-500", green: "bg-green-500", red: "bg-red-500", yellow: "bg-yellow-500",
};

interface SavedLevel {
  id: string;
  name: string;
  grid: string[][];
  playerStart: [number, number];
  goal: [number, number];
  savedAt: number;
}

function makeGrid(size: number): string[][] {
  return Array(size).fill(null).map(() => Array(size).fill("."));
}

function moveEnemies(monsters: [number, number][], player: [number, number], grid: string[][]): [number, number][] {
  return monsters.map((m) => {
    const dr = player[0] - m[0];
    const dc = player[1] - m[1];
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

function loadLevels(userId?: number): SavedLevel[] {
  try {
    const key = userId ? `${LEVELS_STORAGE_KEY}_${userId}` : LEVELS_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLevels(levels: SavedLevel[], userId?: number) {
  try {
    const key = userId ? `${LEVELS_STORAGE_KEY}_${userId}` : LEVELS_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(levels));
  } catch {}
}

type StudioMode = "list" | "edit" | "play";
type OverlayState = { show: boolean; success: boolean } | null;

export default function ArenaStudio() {
  const { toast } = useToast();
  const { data: me } = useGetMe();
  const { getWeaponType, equipped } = useEquipment();
  const { data: shopItems } = useListShopItems();

  const userId = me?.id;
  const weaponType = getWeaponType();
  const equippedSkinIcon = React.useMemo(() => {
    if (!equipped.skinId) return null;
    return shopItems?.find((s) => s.id === equipped.skinId)?.icon ?? null;
  }, [equipped.skinId, shopItems]);

  // ── Navigation state ──
  const [mode, setMode] = useState<StudioMode>("list");

  // ── Level list state ──
  const [savedLevels, setSavedLevels] = useState<SavedLevel[]>(() => loadLevels(userId));

  // ── Editor state ──
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [levelName, setLevelName]     = useState("Mon Niveau");
  const [size, setSize]               = useState(DEFAULT_SIZE);
  const [grid, setGrid]               = useState<string[][]>(makeGrid(DEFAULT_SIZE));
  const [selectedTool, setSelectedTool] = useState<Tool>("#");
  const [playerStart, setPlayerStart] = useState<[number, number]>([0, 0]);
  const [goal, setGoal]               = useState<[number, number]>([DEFAULT_SIZE - 1, DEFAULT_SIZE - 1]);

  // ── Play state ──
  const [playingLevel, setPlayingLevel] = useState<SavedLevel | null>(null);
  const [program, setProgram]           = useState<string[]>([]);
  const [playerPos, setPlayerPos]       = useState<[number, number]>([0, 0]);
  const [monsters, setMonsters]         = useState<[number, number][]>([]);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());
  const [attackAnim, setAttackAnim]     = useState<[number, number] | null>(null);
  const [isRunning, setIsRunning]       = useState(false);
  const [overlayState, setOverlayState] = useState<OverlayState>(null);

  // ── Reload saved levels when userId changes ──
  React.useEffect(() => {
    setSavedLevels(loadLevels(userId));
  }, [userId]);

  // ── Editor helpers ──
  const handleSizeChange = (newSizeStr: string) => {
    const newSize = parseInt(newSizeStr, 10);
    if (isNaN(newSize) || newSize < MIN_SIZE || newSize > MAX_SIZE) return;
    const newGrid = Array(newSize).fill(null).map((_, r) =>
      Array(newSize).fill(null).map((_, c) => r < grid.length && c < grid[0].length ? grid[r][c] : ".")
    );
    setSize(newSize);
    setGrid(newGrid);
    setPlayerStart([Math.min(playerStart[0], newSize - 1), Math.min(playerStart[1], newSize - 1)]);
    setGoal([Math.min(goal[0], newSize - 1), Math.min(goal[1], newSize - 1)]);
  };

  const handleCellClick = (r: number, c: number) => {
    if (selectedTool === "P") {
      setPlayerStart([r, c]);
      const g = grid.map((row) => [...row]);
      if (g[r][c] !== ".") g[r][c] = ".";
      setGrid(g); return;
    }
    if (selectedTool === "G") {
      setGoal([r, c]);
      const g = grid.map((row) => [...row]);
      if (g[r][c] !== ".") g[r][c] = ".";
      setGrid(g); return;
    }
    if ((r === playerStart[0] && c === playerStart[1]) || (r === goal[0] && c === goal[1])) {
      toast({ title: "Action impossible", description: "Déplace d'abord P ou G.", variant: "destructive" });
      return;
    }
    const g = grid.map((row) => [...row]);
    g[r][c] = selectedTool;
    setGrid(g);
  };

  const handleClear = () => {
    setGrid(makeGrid(size));
    setPlayerStart([0, 0]);
    setGoal([size - 1, size - 1]);
  };

  // ── Save level ──
  const handleSave = () => {
    if (!levelName.trim()) {
      toast({ title: "Nomme ton niveau", variant: "destructive" }); return;
    }
    const updated: SavedLevel = {
      id: editingId ?? `level_${Date.now()}`,
      name: levelName.trim(),
      grid,
      playerStart,
      goal,
      savedAt: Date.now(),
    };
    const next = editingId
      ? savedLevels.map((l) => l.id === editingId ? updated : l)
      : [...savedLevels, updated];
    setSavedLevels(next);
    saveLevels(next, userId);
    toast({ title: "✅ Niveau sauvegardé !", description: `"${updated.name}" est dans ta liste.` });
    setMode("list");
  };

  // ── Delete level ──
  const handleDelete = (id: string) => {
    const next = savedLevels.filter((l) => l.id !== id);
    setSavedLevels(next);
    saveLevels(next, userId);
    toast({ title: "Niveau supprimé." });
  };

  // ── Open editor for new level ──
  const openNewEditor = () => {
    setEditingId(null);
    setLevelName("Mon Niveau");
    setSize(DEFAULT_SIZE);
    setGrid(makeGrid(DEFAULT_SIZE));
    setPlayerStart([0, 0]);
    setGoal([DEFAULT_SIZE - 1, DEFAULT_SIZE - 1]);
    setMode("edit");
  };

  // ── Open editor to edit existing level ──
  const openEditLevel = (level: SavedLevel) => {
    setEditingId(level.id);
    setLevelName(level.name);
    setSize(level.grid.length);
    setGrid(level.grid.map((r) => [...r]));
    setPlayerStart([...level.playerStart]);
    setGoal([...level.goal]);
    setMode("edit");
  };

  // ── Start playing a saved level ──
  const startPlay = useCallback((level: SavedLevel) => {
    const ps = level.playerStart;
    setPlayingLevel(level);
    setPlayerPos([ps[0], ps[1]]);
    const initMonsters = level.grid.flatMap((row, r) =>
      row.map((cell, c) => (cell === "M" || cell === "B" ? ([r, c] as [number, number]) : null)).filter(Boolean) as [number, number][]
    );
    setMonsters(initMonsters);
    setVisitedCells(new Set([`${ps[0]},${ps[1]}`]));
    setAttackAnim(null);
    setProgram([]);
    setOverlayState(null);
    setIsRunning(false);
    setMode("play");
  }, []);

  const resetPlay = useCallback(() => {
    if (!playingLevel) return;
    const ps = playingLevel.playerStart;
    setPlayerPos([ps[0], ps[1]]);
    const initMonsters = playingLevel.grid.flatMap((row, r) =>
      row.map((cell, c) => (cell === "M" || cell === "B" ? ([r, c] as [number, number]) : null)).filter(Boolean) as [number, number][]
    );
    setMonsters(initMonsters);
    setVisitedCells(new Set([`${ps[0]},${ps[1]}`]));
    setAttackAnim(null);
    setOverlayState(null);
    setIsRunning(false);
  }, [playingLevel]);

  const runProgram = useCallback(async () => {
    if (!playingLevel) return;
    const { grid: lvGrid, playerStart: ps, goal: lvGoal } = playingLevel;
    const cleanGrid = lvGrid.map((row, r) =>
      row.map((cell, c) => {
        if (r === ps[0] && c === ps[1]) return ".";
        if (r === lvGoal[0] && c === lvGoal[1]) return ".";
        return cell;
      })
    );
    setIsRunning(true);
    setOverlayState(null);

    let pos: [number, number] = [...ps];
    let curMonsters: [number, number][] = cleanGrid.flatMap((row, r) =>
      row.map((cell, c) => (cell === "M" || cell === "B" ? ([r, c] as [number, number]) : null)).filter(Boolean) as [number, number][]
    );
    const visited = new Set<string>([`${pos[0]},${pos[1]}`]);
    let success = false;
    let dead    = false;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (const cmd of program) {
      if (dead) break;
      if (cmd === "p_atk") {
        const adj: [number, number][] = [
          [pos[0]-1, pos[1]], [pos[0]+1, pos[1]],
          [pos[0], pos[1]-1], [pos[0], pos[1]+1],
        ];
        for (const a of adj) {
          const mi = curMonsters.findIndex((m) => m[0] === a[0] && m[1] === a[1]);
          if (mi !== -1) {
            setAttackAnim(a);
            sounds.attack();
            await delay(350);
            curMonsters = curMonsters.filter((_, i) => i !== mi);
            setMonsters([...curMonsters]);
            setAttackAnim(null);
          }
        }
        continue;
      }
      let np: [number, number] = [...pos];
      if      (cmd === "p_fwd")  np = [pos[0], pos[1]+1];
      else if (cmd === "p_back") np = [pos[0], pos[1]-1];
      else if (cmd === "p_up")   np = [pos[0]-1, pos[1]];
      else if (cmd === "p_down") np = [pos[0]+1, pos[1]];

      const inBounds = np[0] >= 0 && np[0] < cleanGrid.length && np[1] >= 0 && np[1] < (cleanGrid[0]?.length ?? 0);
      if (inBounds && cleanGrid[np[0]][np[1]] !== "#") {
        pos = np;
        visited.add(`${pos[0]},${pos[1]}`);
        setPlayerPos([...pos]);
        setVisitedCells(new Set(visited));
        sounds.step();
        await delay(250);
      }
      if (curMonsters.some((m) => m[0] === pos[0] && m[1] === pos[1])) { dead = true; break; }
      if (pos[0] === lvGoal[0] && pos[1] === lvGoal[1]) { success = true; break; }
      if (curMonsters.length > 0) {
        curMonsters = moveEnemies(curMonsters, pos, cleanGrid);
        setMonsters([...curMonsters]);
        await delay(180);
        if (curMonsters.some((m) => m[0] === pos[0] && m[1] === pos[1])) { dead = true; break; }
      }
    }
    if (!dead && pos[0] === (playingLevel?.goal[0]) && pos[1] === (playingLevel?.goal[1])) success = true;
    sounds[success ? "win" : "fail"]();
    setIsRunning(false);
    setOverlayState({ show: true, success });
  }, [playingLevel, program]);

  const editorHasBoss = grid.some((row) => row.includes("B"));
  const playHasBoss   = (playingLevel?.grid ?? []).some((row) => row.includes("B"));
  const editorMonsters: [number, number][] = grid.flatMap((row, r) =>
    row.map((cell, c) => (cell === "M" || cell === "B" ? ([r, c] as [number, number]) : null)).filter(Boolean) as [number, number][]
  );

  // ─────────────────────────────────────────────
  // LIST mode
  // ─────────────────────────────────────────────
  if (mode === "list") {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-in fade-in duration-500">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-3 rounded-2xl">
              <Wrench className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Studio de niveaux</h1>
              <p className="text-muted-foreground">Crée, sauvegarde et joue tes propres niveaux !</p>
            </div>
          </div>
          <Button onClick={openNewEditor} className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Nouveau niveau
          </Button>
        </div>

        {savedLevels.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl py-24 flex flex-col items-center gap-4 text-muted-foreground">
            <ListMusic className="w-12 h-12 opacity-20" />
            <p className="text-lg font-medium">Aucun niveau sauvegardé</p>
            <p className="text-sm">Clique sur «&nbsp;Nouveau niveau&nbsp;» pour commencer !</p>
            <Button variant="outline" onClick={openNewEditor}><PlusCircle className="w-4 h-4 mr-2" /> Créer mon premier niveau</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedLevels.map((lvl) => (
              <Card key={lvl.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Mini-preview of the grid */}
                <div className="h-32 bg-muted/30 border-b border-border flex items-center justify-center p-2">
                  <div
                    className="grid gap-0.5"
                    style={{
                      gridTemplateColumns: `repeat(${lvl.grid[0]?.length || 1}, minmax(0, 1fr))`,
                      width: "100%", height: "100%",
                    }}
                  >
                    {lvl.grid.map((row, r) =>
                      row.map((cell, c) => {
                        const isP = lvl.playerStart[0] === r && lvl.playerStart[1] === c;
                        const isG = lvl.goal[0] === r && lvl.goal[1] === c;
                        return (
                          <div
                            key={`${r}-${c}`}
                            className={`rounded-sm text-[8px] flex items-center justify-center
                              ${cell === "#" ? "bg-muted-foreground/30" : "bg-background/60"}
                              ${isP ? "bg-primary/40" : ""}
                              ${isG ? "bg-green-500/40" : ""}
                            `}
                          >
                            {cell === "M" && <span>👾</span>}
                            {cell === "B" && <span>🐲</span>}
                            {isP && <span>🤖</span>}
                            {isG && !isP && <span>⭐</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm truncate">{lvl.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lvl.grid.length}×{lvl.grid[0]?.length} · {new Date(lvl.savedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 ml-2">Studio</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => startPlay(lvl)}>
                      <Play className="w-3 h-3 mr-1" /> Jouer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditLevel(lvl)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(lvl.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // EDIT mode
  // ─────────────────────────────────────────────
  if (mode === "edit") {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in duration-500">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setMode("list")} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Mes niveaux
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {editingId ? `Modifier : ${levelName}` : "Nouveau niveau"}
              </h1>
              <p className="text-muted-foreground text-sm">Dessine ta grille puis sauvegarde</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Level name */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Nom du niveau</label>
                  <Input
                    value={levelName}
                    onChange={(e) => setLevelName(e.target.value)}
                    placeholder="Mon Niveau"
                    className="h-9 text-sm"
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Outils</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {TOOLS.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedTool === tool.id
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border hover:border-primary/50 " + tool.color
                        }`}
                      >
                        <span className="shrink-0">{tool.icon}</span>
                        <span className="truncate">{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Taille de la grille</h3>
                  <Select value={size.toString()} onValueChange={handleSizeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: MAX_SIZE - MIN_SIZE + 1 }, (_, i) => MIN_SIZE + i).map((s) => (
                        <SelectItem key={s} value={s.toString()}>{s} × {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleClear}>
                    <Trash2 className="w-4 h-4 mr-2" /> Effacer la grille
                  </Button>
                  <Button className="w-full justify-start" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" /> Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-sm text-muted-foreground">
                <h4 className="font-bold text-foreground mb-2">Instructions</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Sélectionne un outil.</li>
                  <li>Clique sur la grille pour placer.</li>
                  <li>P (Départ) et G (Objectif) sont uniques.</li>
                  <li>Donne un nom et sauvegarde !</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Editor grid */}
          <div className="lg:col-span-3 bg-muted/30 rounded-2xl border border-border p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl mx-auto">
              <Arena
                config={{ grid, playerStart, goal }}
                playerPos={playerStart}
                monsters={editorMonsters}
                isBoss={editorHasBoss}
                editable={true}
                onCellClick={handleCellClick}
                selectedTool={selectedTool}
                playerSkinIcon={equippedSkinIcon}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // PLAY mode
  // ─────────────────────────────────────────────
  if (!playingLevel) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setMode("list"); setOverlayState(null); }} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Mes niveaux
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🎮 {playingLevel.name}</h1>
            <p className="text-muted-foreground text-sm">Mode jeu — teste ton niveau !</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditLevel(playingLevel)}>
            <Pencil className="w-3 h-3 mr-1" /> Modifier
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
        {/* Block editor */}
        <div className="lg:w-1/2 bg-card rounded-2xl border border-border p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">🧩 Programme</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={resetPlay} disabled={isRunning}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={runProgram} disabled={isRunning || program.length === 0}>
                {isRunning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                Exécuter
              </Button>
            </div>
          </div>

          {/* Block palette */}
          <div className="p-3 bg-muted/50 rounded-xl border border-border">
            <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Blocs</p>
            <div className="flex flex-wrap gap-2">
              {BLOCK_PALETTE.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setProgram((p) => [...p, b.id])}
                  className={`px-3 py-1.5 rounded-md border-b-4 text-white text-sm font-medium flex items-center gap-1.5 shadow-sm hover:-translate-y-0.5 transition-transform ${COLOR_MAP[b.color] || "bg-primary border-primary/80"}`}
                >
                  <span>{b.icon}</span><span>{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Program list */}
          <div className="flex-1 bg-card rounded-xl border border-border p-3 overflow-y-auto min-h-[200px]">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Programme ({program.length} blocs)</p>
              {program.length > 0 && (
                <button onClick={() => setProgram([])} className="text-xs text-destructive hover:underline">Effacer</button>
              )}
            </div>
            {program.length === 0 ? (
              <div className="h-24 flex items-center justify-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                Clique sur les blocs pour les ajouter
              </div>
            ) : (
              <div className="space-y-1">
                {program.map((cmdId, idx) => {
                  const b = BLOCK_PALETTE.find((x) => x.id === cmdId);
                  if (!b) return null;
                  return (
                    <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-lg text-white text-sm font-medium ${COLOR_MAP_PILL[b.color] || "bg-primary"}`}>
                      <span className="flex items-center gap-2"><span>{b.icon}</span> {b.label}</span>
                      <button onClick={() => setProgram((p) => p.filter((_, i) => i !== idx))} className="text-white/70 hover:text-white text-lg leading-none">×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Arena */}
        <div className="lg:w-1/2 bg-card rounded-2xl border border-border p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">🗺️ {playingLevel.name}</span>
            <Badge variant="secondary">Studio</Badge>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Arena
              config={{ grid: playingLevel.grid, playerStart: playingLevel.playerStart, goal: playingLevel.goal }}
              playerPos={playerPos}
              monsters={monsters}
              visitedCells={visitedCells}
              attackAnim={attackAnim}
              weaponType={weaponType}
              playerSkinIcon={equippedSkinIcon}
              isBoss={playHasBoss}
            />
          </div>
        </div>
      </div>

      {overlayState?.show && (
        <WinOverlay
          success={overlayState.success}
          onRetry={() => { setOverlayState(null); resetPlay(); }}
        />
      )}
    </div>
  );
}
