"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { EventoResponse } from "@/models/dto/evento/EventoResponse";
import { EventoSortDir, EventoSortKey, EventoStatusFilter, EventosTable } from "@/components/eventos-table";
import { AnularEventoModal } from "@/components/anular-evento-modal";
import { RealizarEventoModal } from "@/components/realizar-evento-modal";
import { EmitirEventoModal, EmitirEventoPayload } from "@/components/emitir-evento-modal";
import { PagarEventoModal, PagarEventoPayload } from "@/components/pagar-evento-modal";
import { EliminarPdfEventoModal } from "@/components/eliminar-pdf-evento-modal";
import { CalendarDays } from "lucide-react";

export default function EventosPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const { toast } = useToast();

  const [eventos, setEventos] = useState<EventoResponse[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);

  const [eventoSearch, setEventoSearch] = useState("");
  const [eventoStatusFilter, setEventoStatusFilter] = useState<EventoStatusFilter>("all");
  const [eventoSortKey, setEventoSortKey] = useState<EventoSortKey>("fechaEvento");
  const [eventoSortDir, setEventoSortDir] = useState<EventoSortDir>("desc");

  const [anularEvento, setAnularEvento] = useState<EventoResponse | null>(null);
  const [realizarEvento, setRealizarEvento] = useState<EventoResponse | null>(null);
  const [emitirEvento, setEmitirEvento] = useState<EventoResponse | null>(null);
  const [pagarEvento, setPagarEvento] = useState<EventoResponse | null>(null);
  const [eliminarPdfEvento, setEliminarPdfEvento] = useState<EventoResponse | null>(null);

  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((c) => [c.id, c.nombre])),
    [comedores],
  );

  const displayedEventos = useMemo(() => {
    let list = [...eventos];
    if (eventoStatusFilter !== "all") list = list.filter((e) => e.estado === eventoStatusFilter);
    if (eventoSearch.trim()) {
      const q = eventoSearch.trim().toLowerCase();
      list = list.filter((e) =>
        (comedorNameById[e.comedorId] ?? "").toLowerCase().includes(q) ||
        (e.solicitanteNombre ?? "").toLowerCase().includes(q) ||
        (e.tipoEventoNombre ?? "").toLowerCase().includes(q) ||
        e.fechaEvento.includes(q),
      );
    }
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (eventoSortKey === "fechaEvento") { av = a.fechaEvento; bv = b.fechaEvento; }
      if (eventoSortKey === "comedor") { av = comedorNameById[a.comedorId] ?? ""; bv = comedorNameById[b.comedorId] ?? ""; }
      if (eventoSortKey === "montoTotal") { av = a.montoTotal ?? 0; bv = b.montoTotal ?? 0; }
      if (eventoSortKey === "estado") { av = a.estado; bv = b.estado; }
      if (av < bv) return eventoSortDir === "asc" ? -1 : 1;
      if (av > bv) return eventoSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [eventos, eventoStatusFilter, eventoSearch, eventoSortKey, eventoSortDir, comedorNameById]);

  const handleError = (err: unknown) => {
    toast({
      variant: "destructive",
      title: "Error",
      description: err instanceof ApiError ? err.message : "No se pudo completar la operación.",
    });
  };

  const handleAnularEvento = async (eventoId: number, motivo: string) => {
    if (!session) return;
    try {
      const updated = await apiFetch<EventoResponse>(`/api/eventos/${eventoId}/anular`,
        { method: "PATCH", body: JSON.stringify({ motivo }) }, session.token);
      setEventos((prev) => prev.map((e) => e.id === eventoId ? updated : e));
      toast({ title: "Evento anulado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleRealizarEvento = async (eventoId: number) => {
    if (!session) return;
    try {
      const updated = await apiFetch<EventoResponse>(`/api/eventos/${eventoId}/realizar`,
        { method: "PATCH" }, session.token);
      setEventos((prev) => prev.map((e) => e.id === eventoId ? updated : e));
      toast({ title: "Evento marcado como realizado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleEmitirEvento = async (eventoId: number, payload: EmitirEventoPayload) => {
    if (!session) return;
    try {
      const updated = await apiFetch<EventoResponse>(`/api/eventos/${eventoId}/emitir`,
        { method: "PATCH", body: JSON.stringify(payload) }, session.token);
      setEventos((prev) => prev.map((e) => e.id === eventoId ? updated : e));
      toast({ title: "Factura de evento emitida" });
    } catch (err) { handleError(err); throw err; }
  };

  const handlePagarEvento = async (eventoId: number, payload: PagarEventoPayload) => {
    if (!session) return;
    try {
      const updated = await apiFetch<EventoResponse>(`/api/eventos/${eventoId}/pagado`,
        { method: "PATCH", body: JSON.stringify(payload) }, session.token);
      setEventos((prev) => prev.map((e) => e.id === eventoId ? updated : e));
      toast({ title: "Pago del evento registrado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleEliminarPdfEvento = async (eventoId: number) => {
    if (!session) return;
    try {
      const updated = await apiFetch<EventoResponse>(`/api/eventos/${eventoId}/eliminar-factura-pdf`,
        { method: "PATCH" }, session.token);
      setEventos((prev) => prev.map((e) => e.id === eventoId ? updated : e));
      toast({ title: "PDF del evento eliminado" });
    } catch (err) { handleError(err); throw err; }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      if (session?.rol === "ENCARGADO") router.replace("/encargado");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session) return;
    apiFetch<EventoResponse[]>("/api/eventos", {}, session.token)
      .then(setEventos)
      .finally(() => setLoadingEventos(false));
    apiFetch<ComedorResponse[]>("/api/comedores", {}, session.token).then(setComedores);
  }, [session]);

  if (isLoading || !session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Eventos</h1>
            <p className="text-sm text-gray-500">Gestión de eventos y facturación</p>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
          <CardHeader className="border-b bg-white px-6 py-4">
            <CardTitle className="text-base font-semibold text-gray-800">Eventos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <EventosTable
              eventos={eventos}
              displayedEventos={displayedEventos}
              comedorNameById={comedorNameById}
              loading={loadingEventos}
              search={eventoSearch}
              onSearchChange={setEventoSearch}
              statusFilter={eventoStatusFilter}
              onStatusFilterChange={setEventoStatusFilter}
              sortKey={eventoSortKey}
              sortDir={eventoSortDir}
              onSort={(key) => {
                if (key === eventoSortKey) setEventoSortDir((d) => (d === "asc" ? "desc" : "asc"));
                else { setEventoSortKey(key); setEventoSortDir("asc"); }
              }}
              onRealizar={setRealizarEvento}
              onEmitir={setEmitirEvento}
              onPagar={setPagarEvento}
              onEliminarPdf={setEliminarPdfEvento}
              onAnular={setAnularEvento}
              onClearFilters={() => {
                setEventoSearch("");
                setEventoStatusFilter("all");
              }}
            />
          </CardContent>
        </Card>
      </main>

      {anularEvento && (
        <AnularEventoModal
          open={!!anularEvento}
          onClose={() => setAnularEvento(null)}
          eventoId={anularEvento.id}
          fechaEvento={anularEvento.fechaEvento}
          comedorNombre={comedorNameById[anularEvento.comedorId] ?? String(anularEvento.comedorId)}
          onConfirm={handleAnularEvento}
        />
      )}
      {realizarEvento && (
        <RealizarEventoModal
          open={!!realizarEvento}
          onClose={() => setRealizarEvento(null)}
          eventoId={realizarEvento.id}
          fechaEvento={realizarEvento.fechaEvento}
          comedorNombre={comedorNameById[realizarEvento.comedorId] ?? String(realizarEvento.comedorId)}
          onConfirm={handleRealizarEvento}
        />
      )}
      {emitirEvento && (
        <EmitirEventoModal
          open={!!emitirEvento}
          onClose={() => setEmitirEvento(null)}
          evento={emitirEvento}
          onConfirm={handleEmitirEvento}
        />
      )}
      {pagarEvento && (
        <PagarEventoModal
          open={!!pagarEvento}
          onClose={() => setPagarEvento(null)}
          evento={pagarEvento}
          onConfirm={handlePagarEvento}
        />
      )}
      {eliminarPdfEvento && (
        <EliminarPdfEventoModal
          open={!!eliminarPdfEvento}
          onClose={() => setEliminarPdfEvento(null)}
          eventoId={eliminarPdfEvento.id}
          nombreArchivo={eliminarPdfEvento.facturaPdfNombreArchivo ?? "PDF"}
          onConfirm={handleEliminarPdfEvento}
        />
      )}
    </div>
  );
}
