import type { EventoResponse } from "@/domain/dto/evento/EventoResponse";
import { EstadoEventoLabel } from "@/domain/enums/EstadoEvento";
import { fmtCurrency } from "@/lib/utils";

type Value = string | number | null | undefined;

/** Always rendered; an empty value shows as "-" so the field set is the same for
 *  every evento of a comedor case. */
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

const money = (n: number | null | undefined) => (n === null || n === undefined ? null : fmtCurrency(n));

function caseFields(evento: EventoResponse): [string, Value][] {
  switch (evento.tipoComedor) {
    case "GALICIA":
      return [
        ["Solicitante", evento.solicitanteNombre],
        ["Email solicitante", evento.emailSolicitante],
        ["Funcionario", evento.funcionarioNombre],
        ["Responsable", evento.responsableNombre],
        ["Centro de costo", evento.centroCosto],
        ["Partida", evento.partida],
        ["Precio unitario", money(evento.precioUnitario)],
        ["Retenciones", money(evento.retenciones)],
        ["Nro. operación", evento.numeroOperacion],
        ["Razón social", evento.razonSocial],
        ["Dest. facturación", evento.destinatarioFacturacion],
        ["Tipo comprobante", evento.tipoComprobante],
        ["Nro. comprobante", evento.numeroComprobante],
      ];
    case "BBVA":
      return [
        ["Solicitante", evento.solicitanteNombre],
        ["Email solicitante", evento.emailSolicitante],
        ["Orden de compra", evento.ordenCompra],
        ["Legajo", evento.legajo],
        ["Recepción", evento.recepcion],
      ];
    case "TECHINT":
      return [
        ["Nro. pedido", evento.numeroPedido],
        ["Razón social", evento.razonSocial],
        ["Concepto", evento.concepto],
        ["Tipo comprobante", evento.tipoComprobante],
        ["Nro. comprobante", evento.numeroComprobante],
      ];
    case "UDESA":
      return [
        ["Solicitante", evento.solicitanteNombre],
        ["Centro de costo", evento.centroCosto],
        ["Área", evento.area],
        ["Precio unitario", money(evento.precioUnitario)],
        ["Adicionales", money(evento.adicionales)],
      ];
    default:
      return [];
  }
}

/** Expanded-row detail of an evento: base fields plus every field of its comedor case. */
export function EventoDetail({
  evento,
  comedorName,
  puntoDeVentaName,
}: {
  evento: EventoResponse;
  comedorName: string;
  puntoDeVentaName?: string;
}) {
  const base: [string, Value][] = [
    ["Comedor", comedorName],
    ["Punto de venta", puntoDeVentaName],
    ["Estado", EstadoEventoLabel[evento.estado] ?? evento.estado],
    ["Fecha evento", evento.fechaEvento],
    ["Cantidad personas", evento.cantidadPersonas],
    ["Monto total", money(evento.montoTotal)],
    ["Medio de pago", evento.medioPago],
    ["Fecha emisión", evento.fechaEmision],
    ["Fecha pago", evento.fechaPago],
    ["Creado por", evento.creadoPorNombre],
    ["Factura PDF", evento.facturaPdfNombreArchivo],
    ["Observaciones", evento.observaciones],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
      {[...base, ...caseFields(evento)].map(([label, value]) => (
        <DetailField key={label} label={label} value={value} />
      ))}

      <div className="col-span-full mt-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Servicios</span>
        {evento.servicios.length === 0 ? (
          <div className="mt-1 text-sm text-gray-300">-</div>
        ) : (
          <div className="mt-1 space-y-1">
            {evento.servicios.map((s, i) => (
              <div key={i} className="text-sm text-gray-700">
                {s.producto.nombre} x{s.cantidad} — {fmtCurrency(s.precioUnitario * s.cantidad)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
