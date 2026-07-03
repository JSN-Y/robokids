import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Play, Trophy, Star, Target, Map as MapIcon, Loader2 } from "lucide-react";
import { useGetMe, useGetProgress, useListChapters } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RobotMascot } from "@/components/mascots";

export default function Dashboard() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: progress, isLoading: isProgressLoading } = useGetProgress();
  const { data: chapters, isLoading: isChaptersLoading } = useListChapters();

  const isLoading = isUserLoading || isProgressLoading || isChaptersLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!user || !progress || !chapters) return null;

  let nextLevelId: number | null = null;
  let nextLevelName = "";

  if (user.currentLevelId) {
    nextLevelId = user.currentLevelId;
    const allLevels = chapters.flatMap((c) => c.levels);
    const lvl = allLevels.find((l) => l.id === nextLevelId);
    if (lvl) nextLevelName = lvl.title;
  } else if (chapters.length > 0 && chapters[0].levels.length > 0) {
    nextLevelId = chapters[0].levels[0].id;
    nextLevelName = chapters[0].levels[0].title;
  }

  const totalLevels = chapters.reduce((acc, chap) => acc + chap.levels.length, 0);
  const completedCount = progress.completedLevelIds.length;
  const progressPercent = totalLevels > 0 ? Math.round((completedCount / totalLevels) * 100) : 0;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6"
      >
        <div className="absolute -right-10 -top-10 opacity-20 pointer-events-none">
          <RobotMascot size={200} animate={false} />
        </div>

        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-inner shrink-0">
          <RobotMascot size={80} />
        </div>

        <div className="flex-1 text-center md:text-left z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Salut {user.displayName || user.username} !
          </h1>
          <p className="text-white/90 text-lg mb-6 max-w-lg">
            Prêt pour une nouvelle mission de programmation ?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            {nextLevelId ? (
              <Link href={`/play/${nextLevelId}`}>
                <Button size="lg" variant="secondary" className="font-bold text-primary shadow-lg hover:shadow-xl transition-all" data-testid="btn-play-next">
                  <Play className="mr-2 h-5 w-5" />
                  Jouer : {nextLevelName || "Continuer"}
                </Button>
              </Link>
            ) : (
              <Link href="/chapters">
                <Button size="lg" variant="secondary" className="font-bold text-primary shadow-lg" data-testid="btn-play-next">
                  <MapIcon className="mr-2 h-5 w-5" />
                  Voir les niveaux
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="text-center border-border/50 shadow-sm">
            <CardContent className="pt-6 pb-4">
              <div className="text-3xl font-black text-primary">{completedCount}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Niveaux</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <Card className="text-center border-border/50 shadow-sm">
            <CardContent className="pt-6 pb-4">
              <div className="text-3xl font-black text-yellow-500">{user.coins || 0}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Pièces</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="text-center border-border/50 shadow-sm">
            <CardContent className="pt-6 pb-4">
              <div className="text-3xl font-black text-destructive">{user.hearts || 0}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Vies</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress & Chapters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall progress */}
        <Card className="md:col-span-1 border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Progression
              </CardTitle>
            </div>
            <CardDescription>Ta progression globale</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-4 py-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - progressPercent / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-primary">{progressPercent}%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {completedCount} / {totalLevels} niveaux terminés
            </p>
          </CardContent>
        </Card>

        {/* Chapters progress */}
        <Card className="md:col-span-2 border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Chapitres
              </CardTitle>
              <Link href="/chapters">
                <Button variant="ghost" size="sm" data-testid="btn-all-chapters">Voir tout</Button>
              </Link>
            </div>
            <CardDescription>Ton parcours d'apprentissage</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="space-y-4">
              {chapters.slice(0, 3).map((chapter, i) => {
                const chapterLevels = chapter.levels.length;
                const chapterCompleted = chapter.levels.filter((l) =>
                  progress.completedLevelIds.includes(l.id)
                ).length;
                const percent = chapterLevels > 0 ? (chapterCompleted / chapterLevels) * 100 : 0;
                const isCurrent = user.currentChapterId === chapter.id || (!user.currentChapterId && i === 0);

                return (
                  <motion.div
                    key={chapter.id}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-xl border ${isCurrent ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 bg-card"} transition-all`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-mono">
                          {i + 1}
                        </span>
                        {chapter.title}
                      </h3>
                      <span className="text-sm font-medium text-muted-foreground">
                        {chapterCompleted}/{chapterLevels}
                      </span>
                    </div>
                    <ProgressBar value={percent} className="h-2" />
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
