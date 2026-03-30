"use client";

import { Badge } from "@/components/ui/badge";
import { EstadoFila } from "@/models/enums/EstadoFila";
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const statusMap: Record<
  EstadoFila,
  { label: string; className: string; icon: typeof Sparkles }
> = {
  READY: {
    label: "Ready",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: Sparkles,
  },
  INVALID: {
    label: "Inválida",
    className: "bg-orange-100 text-orange-700 border-orange-200",
    icon: AlertTriangle,
  },
  CONFLICT: {
    label: "Conflicto",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    icon: ShieldAlert,
  },
  APPLIED: {
    label: "Aplicada",
    className: "bg-sky-100 text-sky-700 border-sky-200",
    icon: CheckCircle2,
  },
};

export function RowStatusBadge({ estado }: { estado: EstadoFila }) {
  const config = statusMap[estado];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
