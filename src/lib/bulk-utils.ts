import { toast } from "sonner";
import type { BulkActionResponse } from "@/domain/dto/shared/BulkActionResponse";

export function handleBulkResponse(res: BulkActionResponse, action: string) {
  if (res.fallidas === 0) {
    toast(`${action} completado`, {
      description: `${res.exitosas} registro${res.exitosas !== 1 ? "s" : ""} procesado${res.exitosas !== 1 ? "s" : ""}.`,
    });
  } else {
    const detail = res.errores.length > 0
      ? res.errores[0].mensaje + (res.errores.length > 1 ? ` (+${res.errores.length - 1} más)` : "")
      : "";
    toast(`${action} parcial`, {
      description: `${res.exitosas} exitosa${res.exitosas !== 1 ? "s" : ""}, ${res.fallidas} con error.${detail ? ` ${detail}` : ""}`,
    });
  }
}
