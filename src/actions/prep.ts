"use server";

import { getDb } from "@/lib/db";
import { getWeekPlan } from "@/lib/planner";
import { revalidatePath } from "next/cache";

export async function togglePrepTask(taskId: number, completed: boolean) {
  const db = getDb();
  db.prepare("UPDATE prep_tasks SET completed = ? WHERE id = ?").run(completed ? 1 : 0, taskId);
  revalidatePath("/prep");
  return { ok: true };
}

export async function resetPrepTasks(weekStart: string) {
  const db = getDb();
  const plan = getWeekPlan(weekStart);
  if (plan) {
    db.prepare("UPDATE prep_tasks SET completed = 0 WHERE week_plan_id = ?").run(plan.id);
  }
  revalidatePath("/prep");
  return { ok: true };
}
