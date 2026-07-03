import React, { useState } from "react";
import { Link } from "wouter";
import { Search, Plus, UserCog, Trash2, ShieldAlert } from "lucide-react";
import { useListStudents, useDeleteStudent, getListStudentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useListStudents();
  const deleteStudent = useDeleteStudent();

  const filteredStudents = React.useMemo(() => {
    if (!students) return [];
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.username.toLowerCase().includes(term) ||
        (s.displayName && s.displayName.toLowerCase().includes(term))
    );
  }, [students, searchTerm]);

  const handleDelete = () => {
    if (!studentToDelete) return;
    deleteStudent.mutate(
      { id: studentToDelete.id },
      {
        onSuccess: () => {
          toast({ title: "Élève supprimé" });
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
          setStudentToDelete(null);
        },
        onError: () => {
          toast({ title: "Erreur lors de la suppression", variant: "destructive" });
          setStudentToDelete(null);
        },
      }
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des élèves</h1>
          <p className="text-muted-foreground">Liste complète et assignation</p>
        </div>
        <Link href="/admin/students/new">
          <Button data-testid="btn-add-student">
            <Plus className="mr-2 h-4 w-4" /> Nouvel Élève
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-students"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Pseudo</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Pièces</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} data-testid={`student-row-${student.id}`}>
                    <TableCell>
                      <div className="font-medium">{student.displayName || student.username}</div>
                      <div className="text-xs text-muted-foreground">{student.username}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5">
                        Cat. {student.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{student.completedLevels} niveaux</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-yellow-600 dark:text-yellow-500">{student.coins} 🪙</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/students/${student.id}`}>
                          <Button variant="outline" size="sm" data-testid={`btn-edit-${student.id}`}>
                            <UserCog className="h-4 w-4 mr-2" /> Gérer
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setStudentToDelete({ id: student.id, name: student.username })}
                          data-testid={`btn-delete-${student.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucun élève trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!studentToDelete} onOpenChange={(o) => !o && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'élève <strong>{studentToDelete?.name}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
