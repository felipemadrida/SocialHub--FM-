"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme, type ThemeMode } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function ThemeToggle({ className }: Props) {
  const { theme, setTheme, ready } = useTheme();

  const select = (mode: ThemeMode) => {
    setTheme(mode);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-muted/60 p-0.5",
        className
      )}
      role="group"
      aria-label="Diseño claro u oscuro"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={theme === "light" ? "default" : "ghost"}
            className={cn(
              "h-8 gap-1.5 px-2.5 text-xs",
              theme === "light" && "shadow-sm"
            )}
            onClick={() => select("light")}
            aria-pressed={theme === "light"}
            disabled={!ready}
          >
            <Sun className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Blanco</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Diseño claro</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={theme === "dark" ? "default" : "ghost"}
            className={cn(
              "h-8 gap-1.5 px-2.5 text-xs",
              theme === "dark" && "shadow-sm"
            )}
            onClick={() => select("dark")}
            aria-pressed={theme === "dark"}
            disabled={!ready}
          >
            <Moon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Negro</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Diseño oscuro</TooltipContent>
      </Tooltip>
    </div>
  );
}
