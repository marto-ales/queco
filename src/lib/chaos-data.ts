import type { Unit } from "./types";

type ChaosBaseItem = { ingredient: string; quantity: number; unit: Unit; prep: string };
type ChaosMeal = { name: string; emoji: string; needs: string[]; extra: string[] };

// Modo Caos base
export const CHAOS_BASE: ChaosBaseItem[] = [
  { ingredient: "Pollo (muslos o pechugas)", quantity: 800, unit: "g" as Unit, prep: "Cocinar todo el pollo al horno con sal, pimienta y pimentón. Desmenuzar o cortar en cubos." },
  { ingredient: "Arroz", quantity: 400, unit: "g" as Unit, prep: "Cocinar todo el arroz. Dejar entibiar y guardar en la heladera." },
  { ingredient: "Papa", quantity: 800, unit: "g" as Unit, prep: "Hervir todas las papas con piel. Pelar y cortar en cubos." },
  { ingredient: "Cebolla", quantity: 3, unit: "un" as Unit, prep: "Picar 2 cebolla en cubos finos y 1 en juliana. Sofreír ambas por separado." },
  { ingredient: "Morrones", quantity: 3, unit: "un" as Unit, prep: "Cortar en tiras y sofreír hasta que estén tiernos." },
  { ingredient: "Huevos", quantity: 10, unit: "un" as Unit, prep: "Hervir 6 huevos (7 min para yema cremosa). Dejar otros 4 crudos para preparar según la receta." },
  { ingredient: "Lechuga", quantity: 2, unit: "un" as Unit, prep: "Lavar y secar la lechuga. Guardar en un tupper con servilleta." },
  { ingredient: "Garbanzos", quantity: 400, unit: "g" as Unit, prep: "Dejar los garbanzos escurridos y enjuagados listos para usar." },
];

// Meals that can be assembled from chaos base
export const CHAOS_MEALS: ChaosMeal[] = [
  { name: "Ensalada de pollo", emoji: "🥗", needs: ["Pollo", "Lechuga", "Tomate", "Palta"], extra: ["Tomate fresco", "Palta", "Aceite de oliva"] },
  { name: "Wrap de pollo", emoji: "🌯", needs: ["Pollo", "Lechuga"], extra: ["Tortillas", "Queso cremoso untable"] },
  { name: "Bowl de arroz con pollo", emoji: "🍚", needs: ["Pollo", "Arroz"], extra: ["Salsa de soja", "Sesamo"] },
  { name: "Ensalada tibia de garbanzos", emoji: "🥗", needs: ["Garbanzos", "Morrones", "Cebolla"], extra: ["Vinagre", "Comino"] },
  { name: "Tortilla de papa", emoji: "🍳", needs: ["Papa", "Huevos", "Cebolla"], extra: [] },
  { name: "Ensalada de garbanzos", emoji: "🥗", needs: ["Garbanzos", "Tomate", "Cebolla"], extra: ["Limón", "Aceite de oliva"] },
  { name: "Hash de papa con huevo", emoji: "🍳", needs: ["Papa", "Huevos", "Cebolla"], extra: ["Aceite"] },
  { name: "Ensalada César rápida", emoji: "🥗", needs: ["Pollo", "Lechuga"], extra: ["Queso parmesano", "Mayonesa", "Limón"] },
  { name: "Arroz salteado con huevo", emoji: "🍳", needs: ["Arroz", "Huevos", "Cebolla"], extra: ["Salsa de soja"] },
  { name: "Bowl mediterráneo", emoji: "🥙", needs: ["Garbanzos", "Tomate", "Cebolla"], extra: ["Aceitunas", "Pepino", "Queso feta"] },
];
