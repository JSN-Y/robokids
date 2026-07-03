import React from "react";
import { Link, useLocation, Redirect } from "wouter";
import { useTheme } from "next-themes";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gamepad2, 
  Map, 
  Trophy, 
  Store, 
  Wrench, 
  LogOut, 
  Sun, 
  Moon, 
  Coins, 
  Heart,
  LayoutDashboard,
  Users,
  UserPlus,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { data: user, isLoading, isError } = useGetMe();
  const logout = useLogout();

  if (!isLoading && isError) {
    return <Redirect to="/login" />;
  }

  const handleLogout = () => {
    logout.mutate({} as never, {
      onSuccess: () => { window.location.href = "/login"; }
    });
  };

  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";

  const studentLinks = [
    { href: "/dashboard",    label: "Accueil",    icon: Gamepad2 },
    { href: "/chapters",     label: "Niveaux",    icon: Map },
    { href: "/arena-studio", label: "Studio",     icon: Wrench },
    { href: "/shop",         label: "Boutique",   icon: Store },
    { href: "/inventory",    label: "Équipement", icon: Shield },
    { href: "/leaderboard",  label: "Classement", icon: Trophy },
  ];

  const adminLinks = [
    { href: "/admin",              label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/students",     label: "Élèves",          icon: Users },
    { href: "/admin/students/new", label: "Ajouter",         icon: UserPlus },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">Mosaicinic</span>
          </div>

          {/* Desktop Nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="flex">
                  <Button
                    variant={location === link.href ? "default" : "ghost"}
                    className="flex items-center gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-4">
            {isStudent && (
              <div className="flex items-center gap-3 bg-muted px-3 py-1.5 rounded-full text-sm font-medium">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Coins className="w-4 h-4" />
                  <span data-testid="header-coins">{user?.coins || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-destructive">
                  <Heart className="w-4 h-4 fill-current" />
                  <span data-testid="header-hearts">{user?.hearts || 0}</span>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium hidden sm:inline-block">
                  {user.displayName || user.username}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      {user && (
        <nav className="md:hidden sticky bottom-0 z-50 w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-around h-16 px-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="flex flex-1 justify-center">
                <div
                  className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 ${
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="text-[9px] font-medium leading-tight">{link.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
