import React from "react";
import { Link } from "wouter";
import { Map as MapIcon, Lock, CheckCircle2, Play, RotateCcw } from "lucide-react";
import { useGetMe, useGetProgress, useListChapters } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RobotMascot } from "@/components/mascots";

export default function Chapters() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: progress, isLoading: isProgressLoading } = useGetProgress();
  const { data: chapters, isLoading: isChaptersLoading } = useListChapters();

  const isLoading = isUserLoading || isProgressLoading || isChaptersLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="space-y-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-10 w-48 rounded-xl" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="h-32 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user || !progress || !chapters) return null;

  const isTestAccount = user.username === "test";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/20 p-3 rounded-2xl">
          <MapIcon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carte de l'aventure</h1>
          <p className="text-muted-foreground">
            {isTestAccount
              ? "🔓 Mode test — tous les niveaux sont déverrouillés"
              : "Sélectionne un niveau pour continuer"}
          </p>
        </div>
      </div>

      <div className="space-y-12 relative pb-20">
        <div className="hidden md:block absolute left-[39px] top-6 bottom-0 w-1 bg-border/50 -z-10" />

        {chapters.map((chapter, chapIdx) => {
          let isChapterUnlocked: boolean = true;
          if (!isTestAccount && chapIdx > 0) {
            const prevChap = chapters[chapIdx - 1];
            const prevChapCompleted = prevChap.levels.every((l) =>
              progress.completedLevelIds.includes(l.id)
            );
            isChapterUnlocked = prevChapCompleted;
          }

          const chapterCompleted = chapter.levels.every((l) =>
            progress.completedLevelIds.includes(l.id)
          );

          return (
            <div key={chapter.id} className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm z-10 border-4 border-background shrink-0",
                    chapterCompleted
                      ? "bg-primary text-white"
                      : isChapterUnlocked
                      ? "bg-secondary text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isChapterUnlocked ? (
                    chapterCompleted ? (
                      <CheckCircle2 className="w-10 h-10" />
                    ) : (
                      <RobotMascot size={50} />
                    )
                  ) : (
                    <Lock className="w-8 h-8" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant={isChapterUnlocked ? "default" : "secondary"}>
                      Chapitre {chapIdx + 1}
                    </Badge>
                    {chapterCompleted && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                        Terminé
                      </Badge>
                    )}
                    {isTestAccount && (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                        🔓 Test
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mt-1">{chapter.title}</h2>
                  {chapter.description && (
                    <p className="text-muted-foreground mt-1">{chapter.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-0 md:ml-24">
                {chapter.levels.map((level, levelIdx) => {
                  const isCompleted = progress.completedLevelIds.includes(level.id);
                  let isLevelUnlocked = isTestAccount;
                  if (!isTestAccount) {
                    isLevelUnlocked = isChapterUnlocked;
                    if (levelIdx > 0) {
                      isLevelUnlocked =
                        isChapterUnlocked && progress.completedLevelIds.includes(chapter.levels[levelIdx - 1].id);
                    }
                  }

                  return (
                    <Card
                      key={level.id}
                      className={cn(
                        "overflow-hidden border transition-all",
                        isCompleted
                          ? "border-primary/30 shadow-md shadow-primary/10"
                          : isLevelUnlocked
                          ? "border-border hover:border-primary hover:shadow-md"
                          : "border-border/30 opacity-50 grayscale"
                      )}
                    >
                      <CardContent className="p-0">
                        <div
                          className={cn(
                            "h-20 flex items-center justify-center font-black text-3xl relative overflow-hidden",
                            isCompleted
                              ? "bg-primary/20"
                              : isLevelUnlocked
                              ? "bg-muted/50"
                              : "bg-muted"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-10 h-10 text-primary" />
                          ) : isLevelUnlocked ? (
                            <span className="text-4xl font-black text-primary/60">{levelIdx + 1}</span>
                          ) : (
                            <Lock className="w-8 h-8 text-muted-foreground/50" />
                          )}
                        </div>

                        <div className="p-3">
                          <div className="font-bold text-sm truncate mb-1">{level.title}</div>
                          <div className="flex justify-between items-center text-xs font-medium mb-3">
                            <span className="text-yellow-500">🪙 {level.coinReward}</span>
                            <span
                              className={cn(
                                level.difficulty === "easy"
                                  ? "text-green-500"
                                  : level.difficulty === "medium"
                                  ? "text-orange-500"
                                  : "text-red-500"
                              )}
                            >
                              {level.difficulty === "easy"
                                ? "Facile"
                                : level.difficulty === "medium"
                                ? "Moyen"
                                : "Difficile"}
                            </span>
                          </div>

                          {isLevelUnlocked ? (
                            <Link href={`/play/${level.id}`} className="w-full">
                              <Button
                                variant={isCompleted ? "secondary" : "default"}
                                className="w-full text-xs h-8"
                                data-testid={`btn-play-level-${level.id}`}
                              >
                                {isCompleted ? (
                                  <><RotateCcw className="mr-1 w-3 h-3" /> Rejouer</>
                                ) : (
                                  <><Play className="mr-1 w-3 h-3" /> Jouer</>
                                )}
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="outline" className="w-full text-xs h-8" disabled>
                              Bloqué
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
