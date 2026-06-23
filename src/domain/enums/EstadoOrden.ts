export type EstadoOrden = "PENDIENTE" | "APROBADA" | "ENVIADA" | "CANCELADA";

export const EstadoOrdenLabel: Record<EstadoOrden, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  ENVIADA: "Enviada",
  CANCELADA: "Cancelada",
};

export const EstadoOrdenStyles: Record<
  EstadoOrden,
  { label: string; bg: string; text: string }
> = {
  PENDIENTE: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700" },
  APROBADA: { label: "Aprobada", bg: "bg-blue-100", text: "text-blue-700" },
  ENVIADA: { label: "Enviada", bg: "bg-emerald-100", text: "text-emerald-700" },
  CANCELADA: { label: "Cancelada", bg: "bg-red-100", text: "text-red-600" },
};
