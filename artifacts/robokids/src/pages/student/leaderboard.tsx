import React from "react";
import { Trophy, Crown } from "lucide-react";
import { useGetLeaderboard, useGetMe } from "@workspace/api-client-react";
import { motion } from "framer-motion";

import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: user } = useGetMe();
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-3xl space-y-6">
        <Skeleton className="h-16 w-64 rounded-xl mx-auto" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!leaderboard) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-yellow-500/10 rounded-full mb-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Classement Général</h1>
        <p className="text-muted-foreground text-lg">Les meilleurs codeurs de RoboKids</p>
      </div>

      {/* Podium top 3 */}
      <div className="flex justify-center items-end gap-2 md:gap-6 mb-12 h-48 px-4">
        {/* 2nd Place */}
        {leaderboard[1] && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center w-1/3"
          >
            <div className="relative mb-2">
              <Avatar className="h-14 w-14 border-4 border-gray-300">
                <AvatarFallback className="bg-gray-100 font-bold">
                  {leaderboard[1].username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-gray-300 text-gray-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                2
              </div>
            </div>
            <div className="bg-gradient-to-t from-gray-200 to-gray-100 w-full h-24 rounded-t-lg border border-gray-300 flex flex-col items-center justify-start pt-2 shadow-inner">
              <span className="font-bold text-sm truncate w-full text-center px-1">
                {leaderboard[1].displayName || leaderboard[1].username}
              </span>
              <span className="text-xs text-muted-foreground">{leaderboard[1].coins} pts</span>
            </div>
          </motion.div>
        )}

        {/* 1st Place */}
        {leaderboard[0] && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center w-1/3 z-10"
          >
            <div className="relative mb-2">
              <Crown className="w-8 h-8 text-yellow-500 absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-md" />
              <Avatar className="h-20 w-20 border-4 border-yellow-400">
                <AvatarFallback className="bg-yellow-50 font-bold text-xl">
                  {leaderboard[0].username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white">
                1
              </div>
            </div>
            <div className="bg-gradient-to-t from-yellow-300 to-yellow-100 w-full h-36 rounded-t-lg border border-yellow-300 flex flex-col items-center justify-start pt-2 shadow-inner">
              <span className="font-bold text-sm truncate w-full text-center px-1">
                {leaderboard[0].displayName || leaderboard[0].username}
              </span>
              <span className="text-xs text-yellow-700 font-medium">{leaderboard[0].coins} pts</span>
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {leaderboard[2] && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center w-1/3"
          >
            <div className="relative mb-2">
              <Avatar className="h-12 w-12 border-4 border-orange-300">
                <AvatarFallback className="bg-orange-50 font-bold">
                  {leaderboard[2].username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-orange-400 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                3
              </div>
            </div>
            <div className="bg-gradient-to-t from-orange-200 to-orange-100 w-full h-16 rounded-t-lg border border-orange-200 flex flex-col items-center justify-start pt-2 shadow-inner">
              <span className="font-bold text-xs truncate w-full text-center px-1">
                {leaderboard[2].displayName || leaderboard[2].username}
              </span>
              <span className="text-xs text-muted-foreground">{leaderboard[2].coins} pts</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Full list */}
      <div className="space-y-3">
        {leaderboard.map((entry, idx) => {
          const isMe = entry.id === user?.id;
          const rank = idx + 1;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                isMe
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0",
                  rank === 1
                    ? "bg-yellow-400 text-yellow-900"
                    : rank === 2
                    ? "bg-gray-300 text-gray-800"
                    : rank === 3
                    ? "bg-orange-400 text-white"
                    : "bg-muted text-muted-foreground text-base"
                )}
              >
                {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
              </div>

              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarFallback className="font-bold text-sm bg-muted">
                  {entry.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold truncate">{entry.displayName || entry.username}</span>
                  {isMe && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                      Moi
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{entry.completedLevels} niveaux</span>
              </div>

              <div className="text-right shrink-0">
                <div className="font-black text-lg text-yellow-500">{entry.coins}</div>
                <div className="text-xs text-muted-foreground">pts</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
