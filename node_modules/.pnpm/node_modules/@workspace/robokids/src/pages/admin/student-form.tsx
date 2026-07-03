import React from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { useCreateStudent } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const createSchema = z.object({
  username: z.string().min(3, "Le pseudo doit faire au moins 3 caractères"),
  password: z.string().min(4, "Le mot de passe doit faire au moins 4 caractères"),
  displayName: z.string().optional(),
  category: z.coerce.number().min(1).max(3),
});

export default function AdminStudentForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMut = useCreateStudent();

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: "", password: "", displayName: "", category: 1 },
  });

  const onSubmit = (values: z.infer<typeof createSchema>) => {
    const payload = { ...values, displayName: values.displayName || undefined };
    createMut.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({ title: "Élève créé avec succès" });
          setLocation("/admin/students");
        },
        onError: (err: any) => {
          toast({
            title: "Erreur de création",
            description: err.message || "Ce pseudo est peut-être déjà utilisé",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => setLocation("/admin/students")} className="mb-6 -ml-4" data-testid="btn-back">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Ajouter un élève
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identifiant de connexion *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: leo123" {...field} data-testid="input-username" />
                      </FormControl>
                      <FormDescription>Utilisé pour se connecter</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} data-testid="input-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'affichage (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Léo M." {...field} data-testid="input-displayname" />
                    </FormControl>
                    <FormDescription>Affiché sur le profil et les classements</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie (Âge/Niveau) *</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v, 10))} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Choisir une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Catégorie 1 (CP - CE2)</SelectItem>
                        <SelectItem value="2">Catégorie 2 (CM1 - 6ème)</SelectItem>
                        <SelectItem value="3">Catégorie 3 (5ème - 3ème)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t border-border">
                <Button type="submit" className="w-full" disabled={createMut.isPending} data-testid="btn-submit">
                  {createMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Créer l'élève
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
