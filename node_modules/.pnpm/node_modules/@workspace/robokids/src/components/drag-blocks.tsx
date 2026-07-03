import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface Block {
  id: string;
  label: string;
  pythonLabel: string;
  icon: string;
  color: string;
  category: string;
  description: string;
}

export interface DragBlocksProps {
  palette: Block[];
  program: string[];
  onProgramChange: (p: string[]) => void;
  maxBlocks?: number;
  mode?: "visual" | "python-blocks";
}

export default function DragBlocks({ palette, program, onProgramChange, maxBlocks = 15, mode = "visual" }: DragBlocksProps) {
  const [draggedItem, setDraggedItem] = useState<{ id: string; source: "palette" | "program"; index?: number } | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string, source: "palette" | "program", index?: number) => {
    setDraggedItem({ id, source, index });
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = source === "palette" ? "copy" : "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedItem?.source === "palette" ? "copy" : "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    const newProgram = [...program];
    if (draggedItem.source === "palette") {
      if (newProgram.length < maxBlocks) newProgram.splice(targetIndex, 0, draggedItem.id);
    } else if (draggedItem.source === "program" && draggedItem.index !== undefined) {
      const [movedItem] = newProgram.splice(draggedItem.index, 1);
      const adj = draggedItem.index < targetIndex ? targetIndex - 1 : targetIndex;
      newProgram.splice(adj, 0, movedItem);
    }
    onProgramChange(newProgram);
    setDraggedItem(null);
  };

  const handleRemove = (index: number) => {
    const newProgram = [...program];
    newProgram.splice(index, 1);
    onProgramChange(newProgram);
  };

  const getBlockStyles = (color: string) => {
    const colorMap: Record<string, string> = {
      blue:   "bg-blue-500 hover:bg-blue-600 border-blue-700",
      green:  "bg-green-500 hover:bg-green-600 border-green-700",
      red:    "bg-red-500 hover:bg-red-600 border-red-700",
      yellow: "bg-yellow-500 hover:bg-yellow-600 border-yellow-700",
      purple: "bg-purple-500 hover:bg-purple-600 border-purple-700",
      orange: "bg-orange-500 hover:bg-orange-600 border-orange-700",
      cyan:   "bg-cyan-500 hover:bg-cyan-600 border-cyan-700",
    };
    return colorMap[color] || "bg-primary hover:bg-primary/90 border-primary/80";
  };

  const getLabel = (block: Block) =>
    mode === "python-blocks" ? block.pythonLabel : block.label;

  const isPython = mode === "python-blocks";

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Palette */}
      <div className={cn("p-4 rounded-xl border", isPython ? "bg-gray-900/90 border-gray-700" : "bg-muted/50 border-border")}>
        <h3 className={cn("text-sm font-semibold mb-3 uppercase tracking-wider", isPython ? "text-green-400 font-mono" : "text-muted-foreground")}>
          {isPython ? "# Blocs de code" : "Outils"}
        </h3>
        <div className="flex flex-wrap gap-2">
          {palette.map((block) => (
            <div
              key={`palette-${block.id}`}
              draggable
              onDragStart={(e) => handleDragStart(e, block.id, "palette")}
              className={cn(
                "px-3 py-2 rounded-md border-b-4 text-white font-medium flex items-center gap-2 cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-1 shadow-sm",
                isPython ? "text-xs font-mono" : "text-sm",
                getBlockStyles(block.color)
              )}
              title={block.description}
            >
              <span>{block.icon}</span>
              <span className={isPython ? "font-mono" : ""}>{getLabel(block)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Program Area */}
      <div
        className={cn(
          "flex-1 p-4 rounded-xl border shadow-sm overflow-y-auto min-h-[300px]",
          isPython ? "bg-gray-900 border-gray-700" : "bg-card border-border"
        )}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, program.length)}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={cn("text-sm font-semibold uppercase tracking-wider", isPython ? "text-green-400 font-mono" : "text-muted-foreground")}>
            {isPython ? "# Programme" : "Programme"}
          </h3>
          <span className={cn("text-xs font-mono px-2 py-1 rounded", isPython ? "text-gray-400 bg-gray-800" : "text-muted-foreground bg-muted")}>
            {program.length}/{maxBlocks} blocs
          </span>
        </div>

        <div className="flex flex-col items-start pl-4 pt-2">
          {program.length === 0 ? (
            <div className={cn("w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg", isPython ? "border-gray-700 text-gray-500" : "border-border text-muted-foreground")}>
              <span className="text-2xl mb-2">🧩</span>
              <p className="text-sm">{isPython ? "# Glisse les blocs ici" : "Glissez les blocs ici"}</p>
            </div>
          ) : (
            program.map((blockId, idx) => {
              const blockDef = palette.find((b) => b.id === blockId);
              if (!blockDef) return null;
              return (
                <div
                  key={`prog-${idx}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, blockDef.id, "program", idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => { e.stopPropagation(); handleDrop(e, idx); }}
                  className={cn(
                    "relative text-white font-medium cursor-grab active:cursor-grabbing flex items-center justify-between w-64 shadow-md rounded-lg",
                    isPython ? "text-xs font-mono" : "text-sm",
                    getBlockStyles(blockDef.color)
                  )}
                  style={{ padding: "12px 16px", marginBottom: "4px" }}
                >
                  {idx > 0 && (
                    <div className="absolute -top-[12px] left-4 w-8 h-3 bg-card z-10"
                      style={{ clipPath: "polygon(0 100%, 100% 100%, 80% 0, 20% 0)" }} />
                  )}
                  <div className="flex items-center gap-2 relative z-20 pointer-events-none">
                    <span className="text-lg">{blockDef.icon}</span>
                    <span className="tracking-wide">{getLabel(blockDef)}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(idx)}
                    className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/80 hover:text-white transition-colors z-20"
                    title="Supprimer"
                  >×</button>
                  <div
                    className={cn("absolute -bottom-[12px] left-4 w-8 h-3 z-30", getBlockStyles(blockDef.color).split(" ")[0])}
                    style={{ clipPath: "polygon(0 0, 100% 0, 80% 100%, 20% 100%)" }}
                  />
                </div>
              );
            })
          )}

          <div
            className={cn("h-16 w-64 mt-3 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors", isPython ? "border-green-800 bg-green-950/30" : "border-primary/30 bg-primary/5")}
            onDragOver={handleDragOver}
            onDrop={(e) => { e.stopPropagation(); handleDrop(e, program.length); }}
          >
            <span className={cn("text-xs uppercase font-bold tracking-widest", isPython ? "text-green-700" : "text-primary/50")}>
              {isPython ? "# + Ajouter" : "+ Ajouter"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
