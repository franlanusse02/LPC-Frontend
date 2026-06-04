import type { ListFilterState } from "./ListFilters";

function currentMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    desde: `${y}-${m}-01`,
    hasta: `${y}-${m}-${String(lastDay).padStart(2, "0")}`,
  };
}

export const defaultFilters: ListFilterState = {
  comedorId: "",
  sociedadId: "",
  puntoDeVentaId: "",
  dateField: "fechaFactura",
  ...currentMonthRange(),
};
