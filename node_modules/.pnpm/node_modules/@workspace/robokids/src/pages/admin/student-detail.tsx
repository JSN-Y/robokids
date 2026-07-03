import React, { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import {
  useGetStudent,
  useUpdateStudent,
  getGetStudentQueryKey,
  useListChapters,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const updateSchema = z.object({
  displayName: z.string().optional(),
  password: z.string().optional(),
  coins: z.coerce.number().min(0).optional(),
  hearts: z.coerce.number().min(0).optional(),
  category: z.coerce.number().min(1).max(3).optional(),
});

export default function AdminStudentDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: student, isLoading: isStudentLoading } = useGetStudent(id, {
    query: { enabled: !!id, queryKey: getGetStudentQueryKey(id) },
  });
  useListChapters(); // prefetch chapters
  const updateMut = useUpdateStudent();

  const updateForm = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: { displayName: "", password: "", coins: 0, hearts: 5, category: 1 },
  });

  useEffect(() => {
    if (student) {
      updateForm.reset({
        displayName: student.displayName || "",
        coins: student.coins,
        hearts: student.hearts,
        password: "",
        category: student.category ?? 1,
      });
    }
  }, [student]);

  const onUpdateSubmit = (values: z.infer<typeof updateSchema>) => {
    const payload: Record<string, any> = { ...values };
    if (!payload.password) delete payload.password;
    updateMut.mutate(
      { id, data: payload },
      {
        onSuccess: () => {
          toast({ title: "Profil mis à jour ✅" });
          queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(id) });
        },
        onError: () => toast({ title: "Erreur de mise à jour", variant: "destructive" }),
      }
    );
  };

  if (isStudentLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) return <div className="p-8 text-center text-muted-foreground">Élève introuvable.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => setLocation("/admin/students")} className="mb-6 -ml-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {student.displayName || student.username}
        </h1>
        <p className="text-muted-foreground">
          @{student.username} · Cat. {student.category} · {student.coins} 🪙 · {student.hearts} ❤️
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Modifier le profil</CardTitle>
            <CardDescription>Changer les informations de l'élève</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'affichage</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom affiché" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Laisser vide pour ne pas changer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Cat. 1 (CP – CE2)</SelectItem>
                          <SelectItem value="2">Cat. 2 (CM1 – 6ème)</SelectItem>
                          <SelectItem value="3">Cat. 3 (5ème – 3ème)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={updateForm.control}
                    name="coins"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pièces 🪙</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={updateForm.control}
                    name="hearts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vies ❤️</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={10} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={updateMut.isPending}>
                  {updateMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Enregistrer
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
            <CardDescription>{student.completedLevelIds?.length ?? 0} niveaux terminés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {student.recentAttempts && student.recentAttempts.length > 0 ? (
                student.recentAttempts.slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/40">
                    <span className="text-base">{a.success ? "✅" : "❌"}</span>
                    <span className="flex-1 truncate font-medium">{a.levelTitle}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune tentative pour le moment.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
