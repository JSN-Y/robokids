import React from "react";
import { X, BookOpen, Terminal, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeBookProps {
  isOpen: boolean;
  onClose: () => void;
  category?: number;
}

export default function CodeBook({ isOpen, onClose, category = 1 }: CodeBookProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-full duration-300">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Manuel du Pilote</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <Tabs defaultValue={`cat-${category}`} className="flex-1 flex flex-col h-full">
        <div className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="cat-1" className="flex items-center gap-2">
              <Puzzle className="w-4 h-4" /> Blocs
            </TabsTrigger>
            <TabsTrigger value="cat-3" className="flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Python
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="cat-1" className="mt-0 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Déplacements de base</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium whitespace-nowrap shadow-sm">➡️ Avancer</div>
                  <p className="text-sm text-muted-foreground pt-1">Fait avancer le robot d'une case vers la droite.</p>
                </div>
                <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium whitespace-nowrap shadow-sm">⬅️ Reculer</div>
                  <p className="text-sm text-muted-foreground pt-1">Fait reculer le robot d'une case vers la gauche.</p>
                </div>
                <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium whitespace-nowrap shadow-sm">⬆️ Monter</div>
                  <p className="text-sm text-muted-foreground pt-1">Fait monter le robot d'une case vers le haut.</p>
                </div>
                <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="bg-yellow-500 text-white px-3 py-1 rounded text-sm font-medium whitespace-nowrap shadow-sm">⬇️ Descendre</div>
                  <p className="text-sm text-muted-foreground pt-1">Fait descendre le robot d'une case vers le bas.</p>
                </div>
              </div>

              <h3 className="font-semibold text-lg border-b pb-2 mt-6">Actions</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <div className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium whitespace-nowrap shadow-sm">⚔️ Attaquer</div>
                  <p className="text-sm text-muted-foreground pt-1">Lance une attaque sur un ennemi adjacent.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cat-3" className="mt-0 space-y-6">
            <div className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 text-sm">
                <p className="text-foreground font-medium mb-2">MicroPython API (v2.0)</p>
                <p className="text-muted-foreground">L'objet <code className="bg-background px-1 py-0.5 rounded">robot</code> est disponible globalement.</p>
              </div>

              <h3 className="font-semibold text-lg border-b pb-2">Déplacements</h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="bg-muted p-3 rounded-md border border-border">
                  <div className="text-blue-500 font-semibold mb-1">robot.drive(forward=N)</div>
                  <div className="text-muted-foreground font-sans text-xs">Avance de N cases vers la droite.</div>
                </div>
                <div className="bg-muted p-3 rounded-md border border-border">
                  <div className="text-blue-500 font-semibold mb-1">robot.drive(backward=N)</div>
                  <div className="text-muted-foreground font-sans text-xs">Recule de N cases vers la gauche.</div>
                </div>
                <div className="bg-muted p-3 rounded-md border border-border">
                  <div className="text-green-500 font-semibold mb-1">robot.drive(up=N)</div>
                  <div className="text-muted-foreground font-sans text-xs">Monte de N cases.</div>
                </div>
                <div className="bg-muted p-3 rounded-md border border-border">
                  <div className="text-green-500 font-semibold mb-1">robot.drive(down=N)</div>
                  <div className="text-muted-foreground font-sans text-xs">Descend de N cases.</div>
                </div>
                <div className="bg-muted p-3 rounded-md border border-border">
                  <div className="text-purple-500 font-semibold mb-1">robot.turn(90)</div>
                  <div className="text-muted-foreground font-sans text-xs">Tourne à droite (90°).</div>
                </div>
              </div>

              <h3 className="font-semibold text-lg border-b pb-2 mt-6">Actions</h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="bg-muted p-3 rounded-md border border-border">
                  <div className="text-red-500 font-semibold mb-1">robot.attack()</div>
                  <div className="text-muted-foreground font-sans text-xs">Attaque l'ennemi adjacent.</div>
                </div>
              </div>

              <h3 className="font-semibold text-lg border-b pb-2 mt-6">Capteurs</h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="bg-muted p-3 rounded-md border border-border">
                  <div className="text-cyan-500 font-semibold mb-1">robot.touching()</div>
                  <div className="text-muted-foreground font-sans text-xs">Retourne True si un obstacle ou ennemi est adjacent.</div>
                </div>
                <div className="bg-muted p-3 rounded-md border border-border">
                  <div className="text-cyan-500 font-semibold mb-1">robot.distance()</div>
                  <div className="text-muted-foreground font-sans text-xs">Retourne la distance jusqu'au prochain obstacle.</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
