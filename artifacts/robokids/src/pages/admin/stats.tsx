import React from "react";
import { Link } from "wouter";
import { Users, Coins, Activity, ArrowRight } from "lucide-react";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function AdminStats() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold mb-8">Tableau de bord administrateur</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const categoryData = [
    { name: "Catégorie 1", value: stats.studentsPerCategory.category1, color: "bg-blue-500" },
    { name: "Catégorie 2", value: stats.studentsPerCategory.category2, color: "bg-green-500" },
    { name: "Catégorie 3", value: stats.studentsPerCategory.category3, color: "bg-purple-500" },
  ];

  const totalInCategory = categoryData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in duration-500 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h1>
          <p className="text-muted-foreground">Statistiques globales de RoboKids</p>
        </div>
        <Link href="/admin/students">
          <Button data-testid="btn-manage-students">
            Gérer les élèves <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total des élèves</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pièces gagnées (total)</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCoinsEarned}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tentatives (Aujourd'hui)</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAttemptsToday}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category distribution */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryData.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">{cat.value} élèves</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color} transition-all duration-1000`}
                    style={{ width: totalInCategory > 0 ? `${(cat.value / totalInCategory) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
            {totalInCategory === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Aucun élève pour le moment.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 5).map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Avatar className="h-8 w-8 border border-border shrink-0">
                      <AvatarFallback className="text-xs font-bold bg-muted">
                        {activity.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{activity.displayName || activity.username}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        {activity.success ? "✅ réussi" : "❌ échoué"} «{activity.levelTitle}»
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Aucune activité récente.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
