import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Gamepad2, LogIn, Loader2 } from "lucide-react";
import { useLogin, useGetMe } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { RobotMascot } from "@/components/mascots";

const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user } = useGetMe();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  React.useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          toast({
            title: "Connexion réussie",
            description: `Bienvenue ${data.displayName || data.username} !`,
          });
          if (data.role === "admin") {
            setLocation("/admin");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: "Nom d'utilisateur ou mot de passe incorrect.",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <RobotMascot size={100} animate={true} />
          </motion.div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            Mosaicinic
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Apprends à coder en t'amusant !</p>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-xl border border-border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: leo123"
                        {...field}
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full mt-6 h-12 text-lg"
                disabled={loginMutation.isPending}
                data-testid="button-submit"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-5 w-5" />
                )}
                Jouer
              </Button>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}
