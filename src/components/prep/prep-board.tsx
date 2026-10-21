"use client";

import { useTransition } from "react";
import { togglePrepTask, resetPrepTasks } from "@/actions/prep";
import { PREP_LEVELS } from "@/lib/prep-levels";
import type { PrepTaskFull } from "@/lib/types";

type Props = {
  weekStart: string;
  tasks: PrepTaskFull[];
};

function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function PrepBoard({ weekStart, tasks }: Props) {
  const [isPending, startTransition] = useTransition();

  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const totalMinutes = tasks.reduce((sum, t) => sum + t.time_minutes, 0);

  const handleToggle = (taskId: number, completed: boolean) => {
    startTransition(async () => {
      await togglePrepTask(taskId, completed);
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      await resetPrepTasks(weekStart);
    });
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="card p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {done === total && total > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">¡Meal prep terminado! 🎉</span>
              ) : (
                `${done} de ${total} tareas`
              )}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              ⏱ {formatMinutes(totalMinutes)} de trabajo estimado en total
            </p>
          </div>
          {done > 0 && (
            <button
              onClick={handleReset}
              disabled={isPending}
              className="btn-secondary text-xs py-1.5 disabled:opacity-50 no-print"
            >
              ↺ Reiniciar
            </button>
          )}
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Levels */}
      <div className="grid gap-3 md:grid-cols-3 items-start">
        {PREP_LEVELS.map((lvl) => {
          const levelTasks = tasks.filter((t) => t.level === lvl.level);
          const levelDone = levelTasks.filter((t) => t.completed).length;
          const levelMinutes = levelTasks.reduce((sum, t) => sum + t.time_minutes, 0);

          return (
            <div key={lvl.level} className="card p-4">
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 text-base ring-1 ring-emerald-500/15">
                    {lvl.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{lvl.title}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{lvl.subtitle}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>
                    {levelDone}/{levelTasks.length} hechas
                  </span>
                  <span>⏱ {formatMinutes(levelMinutes)}</span>
                </div>
              </div>

              <ul className="space-y-1">
                {levelTasks.map((task) => (
                  <li key={task.id}>
                    <label className="group flex cursor-pointer items-start gap-2.5 rounded-2xl p-2 transition-colors hover:bg-white/70 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        defaultChecked={!!task.completed}
                        onChange={(e) => handleToggle(task.id, e.target.checked)}
                        className="peer sr-only"
                        aria-label={`Completar ${task.task_description}`}
                      />
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-zinc-300 bg-white/70 text-[10px] font-bold text-transparent transition-all duration-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:text-white dark:border-white/20 dark:bg-white/5">
                        ✓
                      </span>
                      <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug transition-colors peer-checked:text-zinc-400 peer-checked:line-through">
                        {task.recipe_emoji} {task.task_description}
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
