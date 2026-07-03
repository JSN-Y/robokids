import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { RobotMascot } from "@/components/mascots";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <RobotMascot size={120} animate={true} />
      <div>
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <p className="text-xl text-muted-foreground">Page introuvable !</p>
        <p className="text-muted-foreground mt-1">Le robot s'est perdu...</p>
      </div>
      <Link href="/dashboard">
        <Button size="lg">Retour à l'accueil</Button>
      </Link>
    </div>
  );
}
