import type { ConsumoResponse } from "@/domain/dto/consumo/ConsumoResponse";
import { fmtCurrency } from "@/lib/utils";

type Value = string | number | null | undefined;

function DetailField({ label, value }: { label: string; value: Value }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className={empty ? "text-sm text-gray-300" : "text-sm text-gray-700"}>
        {empty ? "-" : value}
      </span>
    </div>
  );
}

const fmtInstant = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
        hour12: false,
      })
    : null;

/** Expanded-row detail of a consumo: every field, empty ones as "-". */
export function ConsumoDetail({
  consumo,
  comedorName,
  puntoDeVentaName,
  consumidorName,
}: {
  consumo: ConsumoResponse;
  comedorName?: string;
  puntoDeVentaName?: string;
  consumidorName?: string;
}) {
  const anulado = consumo.anulacion !== null;
  const fields: [string, Value][] = [
    ["Comedor", comedorName],
    ["Punto de venta", puntoDeVentaName],
    ["Fecha", consumo.fecha],
    ["Consumidor", consumidorName],
    ["Estado", anulado ? "Anulado" : "Activo"],
    ["Total", fmtCurrency(consumo.total)],
    ["Motivo anulación", consumo.anulacion?.motivo],
    ["Fecha anulación", fmtInstant(consumo.anulacion?.creadoEn)],
    ["Creado en", fmtInstant(consumo.creadoEn)],
    ["Actualizado en", fmtInstant(consumo.actualizadoEn)],
    ["Observaciones", consumo.observaciones],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
      {fields.map(([label, value]) => (
        <DetailField key={label} label={label} value={value} />
      ))}

      <div className="col-span-full mt-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Productos</span>
        {consumo.productos.length === 0 ? (
          <div className="mt-1 text-sm text-gray-300">-</div>
        ) : (
          <div className="mt-1 space-y-1">
            {consumo.productos.map((p, i) => (
              <div key={i} className="text-sm text-gray-700">
                {p.producto.nombre} x{p.cantidad.toLocaleString("es-AR")} · {fmtCurrency(p.precioUnitario)} c/u —{" "}
                {fmtCurrency(Math.round(p.cantidad * p.precioUnitario * 100) / 100)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
