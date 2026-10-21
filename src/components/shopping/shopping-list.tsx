"use client";

import { useTransition } from "react";
import { toggleShoppingItem, uncheckAllShoppingItems } from "@/actions/shopping";
import { formatQuantity, SECTION_EMOJI } from "@/lib/shopping-format";
import type { ShoppingItemFull } from "@/lib/types";

type Props = {
  weekStart: string;
  items: ShoppingItemFull[];
};

export function ShoppingList({ weekStart, items }: Props) {
  const [isPending, startTransition] = useTransition();

  const checked = items.filter((i) => i.checked).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100);

  const sections: { name: string; sort: number; items: ShoppingItemFull[] }[] = [];
  for (const item of items) {
    let section = sections.find((s) => s.name === item.section_name);
    if (!section) {
      section = { name: item.section_name, sort: item.section_sort, items: [] };
      sections.push(section);
    }
    section.items.push(item);
  }
  sections.sort((a, b) => a.sort - b.sort);

  const handleToggle = (itemId: number, isChecked: boolean) => {
    startTransition(async () => {
      await toggleShoppingItem(itemId, isChecked);
    });
  };

  const handleUncheckAll = () => {
    startTransition(async () => {
      await uncheckAllShoppingItems(weekStart);
    });
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="card p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {checked === total && total > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">¡Listo! 🎉</span>
              ) : (
                `${checked} de ${total} productos`
              )}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {total - checked === 1 ? "Falta 1 producto" : `Faltan ${total - checked} productos`}
            </p>
          </div>
          <div className="flex gap-2 no-print">
            {checked > 0 && (
              <button
                onClick={handleUncheckAll}
                disabled={isPending}
                className="btn-secondary text-xs py-1.5 disabled:opacity-50"
              >
                ↺ Desmarcar todo
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="btn-secondary text-xs py-1.5"
              title="Imprimir lista"
            >
              🖨 Imprimir
            </button>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="grid gap-3 md:grid-cols-2 items-start">
        {sections.map((section) => {
          const sectionChecked = section.items.filter((i) => i.checked).length;
          const allDone = sectionChecked === section.items.length;
          return (
            <div key={section.name} className="card p-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-base">{SECTION_EMOJI[section.name] || "🛒"}</span>
                  {section.name}
                </h2>
                <span
                  className={`text-[11px] font-medium ${
                    allDone ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                  }`}
                >
                  {allDone ? "✓ " : ""}
                  {sectionChecked}/{section.items.length}
                </span>
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={`${item.ingredient_id}-${item.unit}-${item.checked}`}>
                    <label className="group flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-white/70 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        defaultChecked={!!item.checked}
                        onChange={(e) => handleToggle(item.id, e.target.checked)}
                        className="peer sr-only"
                        aria-label={`Marcar ${item.ingredient_name}`}
                      />
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-zinc-300 bg-white/70 text-xs font-bold text-transparent transition-all duration-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:text-white dark:border-white/20 dark:bg-white/5">
                        ✓
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium transition-colors peer-checked:text-zinc-400 peer-checked:line-through">
                        {item.ingredient_name}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-zinc-500 transition-colors peer-checked:text-zinc-300 peer-checked:line-through dark:text-zinc-400 dark:peer-checked:text-zinc-600">
                        {formatQuantity(item.quantity, item.unit)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
