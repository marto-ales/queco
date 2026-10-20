"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", emoji: "🏠" },
  { href: "/planner", label: "Planificador", emoji: "📅" },
  { href: "/recipes", label: "Recetas", emoji: "📖" },
  { href: "/shopping", label: "Compras", emoji: "🛒" },
  { href: "/prep", label: "Meal Prep", emoji: "⚡" },
];

const EXTRA_ITEMS = [
  { href: "/express", label: "Express", emoji: "🚀" },
  { href: "/chaos", label: "Modo Caos", emoji: "🆘" },
  { href: "/breakfast", label: "Desayunos", emoji: "🥣" },
];

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 min-h-screen p-4 gap-1 sticky top-0">
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold text-emerald-600">QueCo</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Tu semana resuelta</p>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="px-3 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
            Modos especiales
          </p>
          <nav className="flex flex-col gap-0.5">
            {EXTRA_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 safe-area-bottom">
        <div className="flex items-stretch justify-around">
          {[...NAV_ITEMS.slice(0, 4), EXTRA_ITEMS[0]].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 flex-1 ${
                isActive(item.href)
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              <span className="text-lg leading-none">{item.emoji}</span>
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
