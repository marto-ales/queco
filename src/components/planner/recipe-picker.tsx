"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { RecipeListItem } from "@/lib/types";

const emptySubscribe = () => () => {};

const PREP_BADGE: Record<string, string> = {
  express: "badge-express",
  normal: "badge-normal",
  largo: "badge-largo",
};

type Props = {
  dayLabel: string;
  mealType: "almuerzo" | "cena";
  recipes: RecipeListItem[];
  onPick: (recipeId: number) => void;
  onClose: () => void;
  pending: boolean;
};

export function RecipePicker({ dayLabel, mealType, recipes, onPick, onClose, pending }: Props) {
  const [search, setSearch] = useState("");
  const [onlySuggested, setOnlySuggested] = useState(true);
  const sheetRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Keep the sheet within the visible area on mobile when the keyboard opens.
  // `dvh` covers most browsers; visualViewport covers Android Chrome precisely.
  // Only applies on small/touch viewports so desktop sizing stays CSS-driven.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !sheetRef.current) return;
    const el = sheetRef.current;
    const isMobile = () => window.matchMedia("(max-width: 767px)").matches;
    const onResize = () => {
      if (!isMobile()) {
        el.style.maxHeight = "";
        return;
      }
      el.style.maxHeight = `${Math.round(vv.height * 0.9)}px`;
    };
    onResize();
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
      el.style.maxHeight = "";
    };
  }, []);

  // Lock background scroll while the sheet is open. Use overflow:hidden on the
  // root elements instead of position:fixed on <body>, which would offset the
  // fixed backdrop and push the sheet below the viewport.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const suggestedCategory = mealType === "almuerzo" ? ["almuerzo", "snack"] : ["cena", "almuerzo"];
    return recipes.filter((r) => {
      if (onlySuggested && !suggestedCategory.includes(r.category)) return false;
      if (!q) return true;
      if (r.name.toLowerCase().includes(q)) return true;
      return JSON.parse(r.tags).some((t: string) => t.includes(q));
    });
  }, [recipes, search, onlySuggested, mealType]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm flex justify-center items-end md:items-center md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={sheetRef}
        className="w-full md:max-w-lg max-h-[85dvh] md:max-h-[80dvh] mb-[env(safe-area-inset-bottom)] md:mb-0 flex flex-col rounded-t-3xl md:rounded-3xl border border-white/60 bg-white/85 backdrop-blur-2xl shadow-2xl dark:border-white/10 dark:bg-zinc-900/85 animate-[pop-in_.25s_cubic-bezier(.22,.68,.32,1)_both]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/60 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">
              {dayLabel} · {mealType === "almuerzo" ? "🍽 Almuerzo" : "🌙 Cena"}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100/80 dark:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/80 dark:hover:bg-white/20 transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar receta..."
            className="input"
            inputMode="search"
            enterKeyHint="search"
          />
          <label className="flex items-center gap-2 mt-2.5 text-xs text-zinc-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlySuggested}
              onChange={(e) => setOnlySuggested(e.target.checked)}
              className="rounded"
            />
            {mealType === "almuerzo" ? "Solo sugeridas para almuerzo" : "Solo sugeridas para cena"}
          </label>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-2">
          {/* Create / duplicate actions */}
          <div className="flex flex-col gap-1.5 p-1 pb-2 mb-1 border-b border-white/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/recipes/new?from=${mealType}`);
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 text-left transition-colors hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40"
            >
              <span className="text-xl">➕</span>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Crear receta nueva
              </span>
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">Sin resultados</p>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-1 rounded-2xl hover:bg-white/80 dark:hover:bg-white/5 transition-colors"
              >
                <button
                  onClick={() => onPick(r.id)}
                  disabled={pending}
                  className="flex-1 flex items-center gap-3 p-2.5 text-left disabled:opacity-50 min-w-0"
                >
                  <span className="text-2xl">{r.image_emoji || "🍽"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-zinc-400">
                      ⏱ {r.time_minutes} min · {r.servings_base} porc.
                    </p>
                  </div>
                  <span className={`badge ${PREP_BADGE[r.prep_level]} shrink-0`}>{r.prep_level}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/recipes/${r.id}/edit`);
                  }}
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                  title="Editar receta"
                  aria-label={`Editar ${r.name}`}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/recipes/${r.id}/duplicate`);
                  }}
                  className="shrink-0 w-9 h-9 mr-1 rounded-full flex items-center justify-center text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                  title="Duplicar como variante"
                  aria-label={`Duplicar ${r.name}`}
                >
                  ⧉
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
