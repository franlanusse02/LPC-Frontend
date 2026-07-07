# Handout — Server-Side Pagination Rollout (Front + Back)

Status doc for work in progress. Backend N+1 fixes for `cierres`/`compras`/`consumos`/`eventos` already shipped (fetch-join + ID-first pagination, `Page<T>` on all 4 list endpoints — no frontend changes yet). This doc covers what's left: wiring the frontend to consume real pagination, plus the additional backend filter/stat endpoints that requires.

## Why this is bigger than "read `.content` instead of an array"

The 4 list pages (`CierresContabilidad.tsx` etc.) currently fetch the **entire table** in one call and do search/sort/date-range/comedor filtering and stat-card totals **client-side** over the full in-memory array. Real pagination means only one page (~20 rows) is in memory at a time, so:
- Filtering must move server-side (query params), or it'd only filter the visible page.
- Free-text search must move server-side, same reason.
- Stat cards (totals, counts) need dedicated aggregate endpoints — can't sum a page that isn't fully loaded.

Decisions locked in for this rollout (confirmed with user):
- Search: **server-side per module** (not dropped).
- Stat cards: **new lightweight aggregate endpoints** (not "current page only").
- Build order: **shared infra → cierres as template → replicate to compras/consumos/eventos**.

## Shared frontend infra (in progress)

- `src/domain/dto/shared/Page.ts` — mirrors Spring's `Page<T>` JSON shape (`content`, `totalElements`, `totalPages`, `number`, `size`, `first`, `last`, `numberOfElements`, `empty`).
- `src/lib/query-string.ts` — `buildQuery(params)` helper, turns a params object into a `?a=1&b=2` string, handles arrays (repeats the key) and skips null/undefined/empty.
- `src/components/Pagination.tsx` — dumb UI component: page-size select + prev/next + "Página X de Y · N resultados". No filtering/fetch logic, just page/size in, `onPageChange`/`onSizeChange` out.

No generic "useServerList" data-fetching hook — each page keeps its own `useEffect` + `get(...)` call (matches existing per-page fetch pattern, avoids a premature abstraction across 4 modules with different filter shapes).

## Per-module scope, in priority order

Each module needs 3 layers: **(a)** backend filter params on the existing `searchIds`/`findAll` query, **(b)** backend stat aggregate endpoint(s), **(c)** frontend page rewrite (filters → query params, `Page<T>` → table + `Pagination`, stat cards → aggregate call).

### 1. `cierres` (template module — building now)

- **Backend filters to add** (`CierreCajaRepository` currently has *zero* filter support — service just calls `findAll(pageable)` directly):
  - `comedorId` (via `puntoDeVenta.comedor.id`)
  - `puntoDeVentaIds` (list)
  - `anulado` (boolean, null = all) — replaces client-side `anulacionId` presence check
  - `fechaInicio`/`fechaFin` on **`fechaOperacion` only** (matches existing `sumTotalActivo`; the `createdAt` toggle option in `ListFilters` is deferred — not filterable server-side yet)
- **No free-text search** — confirmed the current page has no search box, only status pills. Nothing to wire.
- **Sortable columns, server-side**: `fechaOperacion`, `createdAt`, `totalPlatosVendidos` only. `comedor`/`creadoPor`/`puntoDeVenta` (joined names) and `montoTotal` (computed, not a column) are **not** server-sortable — dropping those `SortableTh` headers in the paginated view.
- **Stats endpoint** (new): count total / activos / anulados matching current filters, plus monto total activo (reuse `sumTotalActivo`) and monto filtrado activo (same query, current filters applied).
- **Frontend**: rewrite `CierresContabilidad.tsx` — page/size state, filters → `buildQuery`, `Page<DetailedCierreCajaResponse>` response, `Pagination` component, stat cards backed by the new endpoint instead of `cierres.length` etc.

### 2. `compras` (FacturaProveedor)

- Already has `searchIds(comedorId, sociedadId, proveedorId, pageable)` — add `fechaInicio`/`fechaFin` (on `fechaFactura`) and free-text search (numero, proveedor nombre, comentarios).
- Stats endpoint: counts by estado (`PENDIENTE`/`EMITIDA`/`PAGADA`/`ANULADA`) + monto total/filtrado (reuse existing `sumTotalActivo`).
- Frontend: `ComprasContabilidad.tsx` (has an existing search box — first module where server-side search actually replaces working client logic).

### 3. `consumos`

- `ConsumoRepository` has **no filtered search at all** (`findAll(pageable)` plain) — build `searchIds` from scratch: `comedorId`, date range on `fecha`, free-text search (puntoDeVenta nombre, consumidor nombre, observaciones).
- Stats endpoint: count + monto total/filtrado (reuse `sumTotalActivo`).
- Frontend: `ConsumosContabilidad.tsx`.

### 4. `eventos`

- Already has `searchIds(puntoDeVentaId, comedorId, estado, pageable)` — add `fechaInicio`/`fechaFin` (on `fechaEvento`) and free-text search. Also revisit `puntoDeVentaId` (single) vs frontend's `puntoDeVentaIds` (multi) — needs to become a list param to match.
- Subtype DTO audit for stats: BBVA/Galicia/Techint/UDESA all share the same base fields for stat purposes (estado, montoTotal), so one stats endpoint on the base `Evento` covers all subtypes.
- Frontend: `EventosContabilidad.tsx` + `EventosEncargado.tsx` + `EventosCargaDatos.tsx` (3 pages, more than the other modules — audit which need full pagination vs which are low-volume enough to skip).

## Known gaps / deferred

- `createdAt`-based date filtering on `cierres` (client-side toggle exists today, server-side only supports `fechaOperacion`).
- Sortable "joined name" columns (comedor/creadoPor/puntoDeVenta) and computed `montoTotal` — dropped from server-sortable set across all 4 modules, not just cierres.
- `eventos` `puntoDeVentaId` filter is single-value server-side today; frontend uses multi-select (`puntoDeVentaIds`) — needs alignment when eventos is tackled.
