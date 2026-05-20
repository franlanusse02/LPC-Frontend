import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(n);
