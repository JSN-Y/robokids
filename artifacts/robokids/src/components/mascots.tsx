import { cn } from "@/lib/utils";

export const RobotMascot = ({ size = 48, className, animate = true }: { size?: number; className?: string; animate?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={cn("drop-shadow-lg", animate && "animate-bounce", className)}
  >
    {/* Head */}
    <rect x="20" y="15" width="60" height="50" rx="10" fill="hsl(var(--primary))" />
    {/* Eyes */}
    <circle cx="35" cy="35" r="8" fill="#fff" />
    <circle cx="65" cy="35" r="8" fill="#fff" />
    <circle cx="37" cy="35" r="4" fill="#000" />
    <circle cx="67" cy="35" r="4" fill="#000" />
    {/* Pupils shine */}
    <circle cx="39" cy="33" r="1.5" fill="#fff" />
    <circle cx="69" cy="33" r="1.5" fill="#fff" />
    {/* Mouth */}
    <rect x="30" y="50" width="40" height="8" rx="4" fill="hsl(var(--primary-foreground))" opacity="0.5" />
    <rect x="35" y="52" width="8" height="4" rx="2" fill="hsl(var(--secondary))" />
    <rect x="46" y="52" width="8" height="4" rx="2" fill="hsl(var(--secondary))" />
    <rect x="57" y="52" width="8" height="4" rx="2" fill="hsl(var(--secondary))" />
    {/* Antenna */}
    <rect x="47" y="5" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
    <circle cx="50" cy="5" r="5" fill="hsl(var(--chart-4))" />
    {/* Body */}
    <rect x="25" y="65" width="50" height="25" rx="8" fill="hsl(var(--primary))" opacity="0.8" />
    {/* Chest light */}
    <circle cx="50" cy="77" r="6" fill="hsl(var(--secondary))" opacity="0.9" />
    {/* Arms */}
    <rect x="8" y="66" width="15" height="20" rx="7" fill="hsl(var(--primary))" opacity="0.7" />
    <rect x="77" y="66" width="15" height="20" rx="7" fill="hsl(var(--primary))" opacity="0.7" />
  </svg>
);

export const WallMascot = ({ size = 32, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={cn("drop-shadow", className)}>
    <rect x="5" y="5" width="90" height="90" rx="8" fill="hsl(var(--muted-foreground))" opacity="0.4" />
    <rect x="5" y="5" width="90" height="90" rx="8" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="3" opacity="0.6" />
    {/* Brick pattern */}
    <rect x="10" y="20" width="35" height="18" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
    <rect x="50" y="20" width="40" height="18" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
    <rect x="10" y="42" width="40" height="18" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
    <rect x="55" y="42" width="35" height="18" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
    <rect x="10" y="64" width="35" height="18" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
    <rect x="50" y="64" width="40" height="18" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
  </svg>
);

export const MonsterMascot = ({ size = 48, className, animate = true }: { size?: number; className?: string; animate?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={cn("drop-shadow-lg", animate && "animate-pulse", className)}
  >
    <path d="M 20 80 Q 20 30 50 30 Q 80 30 80 80 Q 65 70 50 80 Q 35 70 20 80" fill="hsl(var(--destructive))" />
    {/* Big Eye */}
    <circle cx="50" cy="55" r="15" fill="#fff" />
    <circle cx="50" cy="55" r="6" fill="#000" />
    <path d="M 35 45 Q 50 35 65 45" stroke="#000" fill="none" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const BossMascot = ({ size = 48, className, animate = true }: { size?: number; className?: string; animate?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={cn("drop-shadow-xl", animate && "animate-pulse scale-110", className)}
  >
    <path d="M 10 90 Q 10 20 50 20 Q 90 20 90 90 Q 70 75 50 90 Q 30 75 10 90" fill="hsl(var(--destructive))" />
    {/* Horns */}
    <path d="M 30 30 Q 15 10 5 25" stroke="hsl(var(--destructive))" fill="none" strokeWidth="6" strokeLinecap="round" />
    <path d="M 70 30 Q 85 10 95 25" stroke="hsl(var(--destructive))" fill="none" strokeWidth="6" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="35" cy="50" r="10" fill="#fff" />
    <circle cx="35" cy="50" r="4" fill="#f00" />
    <circle cx="65" cy="50" r="10" fill="#fff" />
    <circle cx="65" cy="50" r="4" fill="#f00" />
    <path d="M 25 40 Q 50 45 75 40" stroke="#000" fill="none" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const GoalMascot = ({ size = 48, className, animate = true }: { size?: number; className?: string; animate?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={cn("drop-shadow-lg", animate && "animate-spin-slow", className)}
  >
    <path d="M 50 5 L 60 40 L 95 50 L 60 60 L 50 95 L 40 60 L 5 50 L 40 40 Z" fill="hsl(var(--chart-4))" />
    <circle cx="50" cy="50" r="15" fill="hsl(var(--chart-4))" opacity="0.5" />
    <circle cx="50" cy="50" r="5" fill="#fff" />
  </svg>
);
