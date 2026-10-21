"use server";

import { getDb } from "@/lib/db";
import { getWeekPlan } from "@/lib/planner";
import { revalidatePath } from "next/cache";

export async function toggleShoppingItem(itemId: number, checked: boolean) {
  const db = getDb();
  db.prepare("UPDATE shopping_items SET checked = ? WHERE id = ?").run(checked ? 1 : 0, itemId);
  revalidatePath("/shopping");
  return { ok: true };
}

export async function uncheckAllShoppingItems(weekStart: string) {
  const db = getDb();
  const plan = getWeekPlan(weekStart);
  if (plan) {
    db.prepare("UPDATE shopping_items SET checked = 0 WHERE week_plan_id = ?").run(plan.id);
  }
  revalidatePath("/shopping");
  return { ok: true };
}
