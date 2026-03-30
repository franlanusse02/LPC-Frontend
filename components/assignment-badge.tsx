"use client";

import { Badge } from "@/components/ui/badge";
import { EstadoAsignacion } from "@/models/enums/EstadoAsignacion";
import { LockKeyhole, UserRoundCheck, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

type AssignmentBadgeProps = {
  estadoAsignacion: EstadoAsignacion;
  asignadoANombre?: string | null;
  mine?: boolean;
};

export function AssignmentBadge({
  estadoAsignacion,
  asignadoANombre,
  mine = false,
}: AssignmentBadgeProps) {
  if (estadoAsignacion === "SIN_ASIGNAR") {
    return (
      <Badge variant="outline" className="gap-1.5 border-gray-200 bg-gray-100 text-gray-600">
        <UsersRound className="h-3 w-3" />
        Sin asignar
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border",
        mine
          ? "border-emerald-200 bg-emerald-100 text-emerald-700"
          : "border-violet-200 bg-violet-100 text-violet-700"
      )}
    >
      {mine ? <UserRoundCheck className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}
      {mine ? "Asignada a vos" : asignadoANombre ? `Asignada a ${asignadoANombre}` : "Asignada"}
    </Badge>
  );
}
