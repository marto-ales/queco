import type { Unit } from "./types";

const DISCRETE_UNITS: Unit[] = ["un", "diente", "rebanada", "ramita"];

function trim(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** Human-friendly quantity: 1500 g → 1.5 kg, 2.5 cda → 2.5 cda, 2.3 un → 3 un */
export function formatQuantity(quantity: number, unit: Unit): string {
  if (unit === "g" || unit === "ml") {
    if (quantity >= 1000) {
      return `${trim(quantity / 1000)} ${unit === "g" ? "kg" : "L"}`;
    }
    return `${trim(Math.round(quantity))} ${unit}`;
  }
  if (DISCRETE_UNITS.includes(unit)) {
    return `${Math.ceil(quantity - 1e-9)} ${unit}`;
  }
  return `${trim(Math.round(quantity * 10) / 10)} ${unit}`;
}

export const SECTION_EMOJI: Record<string, string> = {
  Verdulería: "🥬",
  Carnicería: "🥩",
  "Aves y Pescados": "🐟",
  "Lácteos y Huevos": "🥛",
  Almacén: "🫙",
  Congelados: "❄️",
  Panadería: "🥖",
  Bebidas: "🥤",
};
