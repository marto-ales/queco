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

  const linkClass = (href: string) =>
    `group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
      isActive(href)
        ? "bg-emerald-500/10 text-emerald-700 shadow-[inset_0_0_0_1px_rgb(16_185_129/0.18)] dark:bg-emerald-400/10 dark:text-emerald-300"
        : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
    }`;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="glass hidden md:flex flex-col w-60 border-r border-white/50 dark:border-white/10 min-h-screen p-4 gap-1 sticky top-0 z-40">
        <div className="mb-6 px-2 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-lg shadow-lg shadow-emerald-500/30">
            🍳
          </span>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              QueCo
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Tu semana resuelta</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-xl text-sm transition-transform duration-200 group-hover:scale-110 ${
                  isActive(item.href)
                    ? "bg-white/80 shadow-sm dark:bg-white/10"
                    : "bg-white/40 dark:bg-white/5"
                }`}
              >
                {item.emoji}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-6 pt-5 border-t border-white/50 dark:border-white/10">
          <p className="px-3 mb-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Modos especiales
          </p>
          <nav className="flex flex-col gap-1">
            {EXTRA_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-xl text-sm transition-transform duration-200 group-hover:scale-110 ${
                    isActive(item.href)
                      ? "bg-white/80 shadow-sm dark:bg-white/10"
                      : "bg-white/40 dark:bg-white/5"
                  }`}
                >
                  {item.emoji}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-3 py-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Hecho para cocinar tranquilo ✨
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="glass md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/50 dark:border-white/10 safe-area-bottom">
        <div className="flex items-stretch justify-around px-1 pt-1">
          {[...NAV_ITEMS.slice(0, 4), EXTRA_ITEMS[0]].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 mb-1 min-w-0 flex-1 rounded-2xl transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              <span
                className={`text-lg leading-none transition-transform duration-200 ${
                  isActive(item.href) ? "scale-110" : ""
                }`}
              >
                {item.emoji}
              </span>
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
