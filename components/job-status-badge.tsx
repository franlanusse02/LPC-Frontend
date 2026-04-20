"use client";

import { Badge } from "@/components/ui/badge";
import { EstadoJob } from "@/models/enums/EstadoJob";
import { CheckCircle2, Clock3, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusMap: Record<
  EstadoJob,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  PENDIENTE: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock3,
  },
  PROCESANDO: {
    label: "Procesando",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: LoaderCircle,
  },
  COMPLETADO: {
    label: "Completado",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
};

export function JobStatusBadge({ estado }: { estado: EstadoJob }) {
  const config = statusMap[estado];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border", config.className)}>
      <Icon className={cn("h-3 w-3", estado === "PROCESANDO" && "animate-spin")} />
      {config.label}
    </Badge>
  );
}
