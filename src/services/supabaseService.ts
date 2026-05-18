import { supabase, isSupabaseConfigured } from "../supabase";
import type { BankAccount, Contract, Counterparty, Invoice, User } from "../types";

// Интерфейс для единого JSON-блока данных пользователя
export interface CloudData {
  profile: User;
  invoices: Invoice[];
  counterparties: Counterparty[];
  contracts: Contract[];
  bankAccounts: BankAccount[];
}

/**
 * Получить все данные пользователя из Supabase
 */
export async function syncAllDataFromCloud(userId: string): Promise<CloudData | null> {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase не настроен");

  const { data, error } = await supabase
    .from("user_data")
    .select("data")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Запись не найдена (новый пользователь)
    throw error;
  }

  return data?.data as CloudData;
}

/**
 * Сохранить все данные пользователя в Supabase
 */
export async function syncAllDataToCloud(userId: string, payload: CloudData) {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase не настроен");

  const { error } = await supabase
    .from("user_data")
    .upsert({ id: userId, data: payload });

  if (error) throw error;
}

/**
 * Сохраняем данные в localStorage
 */
export function saveToLocalCache(userId: string, data: CloudData) {
  localStorage.setItem("ved-tracker:currentUserId", userId);
  
  // Профиль (сохраняется в общий список users, чтобы оффлайн логин работал)
  const rawUsers = localStorage.getItem("ved-tracker:users");
  const users = rawUsers ? (JSON.parse(rawUsers) as User[]) : [];
  const nextUsers = users.some((u) => u.id === data.profile.id)
    ? users.map((u) => (u.id === data.profile.id ? data.profile : u))
    : [...users, data.profile];
  localStorage.setItem("ved-tracker:users", JSON.stringify(nextUsers));

  localStorage.setItem(`ved-tracker:invoices:${userId}`, JSON.stringify(data.invoices));
  localStorage.setItem(`ved-tracker:counterparties:${userId}`, JSON.stringify(data.counterparties));
  localStorage.setItem(`ved-tracker:contracts:${userId}`, JSON.stringify(data.contracts));
  localStorage.setItem(`ved-tracker:bank-accounts:${userId}`, JSON.stringify(data.bankAccounts));
}
