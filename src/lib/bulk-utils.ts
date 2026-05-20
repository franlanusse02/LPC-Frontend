import { toast } from "sonner";
import type { BulkActionResponse } from "@/domain/dto/shared/BulkActionResponse";

export function handleBulkResponse(res: BulkActionResponse, action: string) {
  if (res.fallidas === 0) {
    toast(`${action} completado`, {
      description: `${res.exitosas} registro${res.exitosas !== 1 ? "s" : ""} procesado${res.exitosas !== 1 ? "s" : ""}.`,
    });
  } else {
    toast(`${action} parcial`, {
      description: `${res.exitosas} exitosa${res.exitosas !== 1 ? "s" : ""}, ${res.fallidas} fallida${res.fallidas !== 1 ? "s" : ""}. ${res.errores.map((e) => e.mensaje).join("; ")}`,
    });
  }
}
