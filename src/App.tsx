import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { BankAccountSection } from "./components/BankAccountSection";
import { ContractSection } from "./components/ContractSection";
import { CounterpartySection } from "./components/CounterpartySection";
import { DashboardStats } from "./components/DashboardStats";
import { InvoiceForm } from "./components/InvoiceForm";
import { InvoiceList } from "./components/InvoiceList";
import { InvoicePrintModal } from "./components/InvoicePrintModal";
import { LandingHero } from "./components/LandingHero";
import { LoginModal } from "./components/LoginModal";
import { UserProfile } from "./components/UserProfile";
import { isSupabaseConfigured } from "./supabase";
import {
  syncAllDataFromCloud,
  syncAllDataToCloud,
  saveToLocalCache
} from "./services/supabaseService";
import type { BankAccount, Contract, Counterparty, Invoice, User } from "./types";
import { isPastDate } from "./utils/format";

type Tab = "invoices" | "contracts" | "counterparties" | "accounts" | "profile";
type SyncStatus = "idle" | "syncing" | "synced" | "error";

function pluralize(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const userId = currentUser?.id ?? "guest";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const syncTimerRef = useRef<number | null>(null);

  const [tab, setTab] = useState<Tab>("invoices");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  // Restore local session on this browser.
  useEffect(() => {
    const usersRaw = localStorage.getItem("ved-tracker:users");
    const localUsers = usersRaw ? (JSON.parse(usersRaw) as User[]) : [];

    const currentUserId = localStorage.getItem("ved-tracker:currentUserId");
    const cachedUser = currentUserId
      ? localUsers.find((u) => u.id === currentUserId) ?? null
      : null;

    if (cachedUser) setCurrentUser(cachedUser);
  }, []);

  // Load data from Firebase for registered user, from localStorage for guest.
  useEffect(() => {
    const load = async () => {
      setDataReady(false);

      if (currentUser && isSupabaseConfigured) {
        try {
          setSyncStatus("syncing");
          const cloudData = await syncAllDataFromCloud(currentUser.id);
          if (cloudData) {
            setCurrentUser(cloudData.profile);
            setInvoices(cloudData.invoices);
            setCounterparties(cloudData.counterparties);
            setContracts(cloudData.contracts);
            setBankAccounts(cloudData.bankAccounts);
            saveToLocalCache(currentUser.id, cloudData);
          }
          setSyncStatus("synced");
          setDataReady(true);
          return;
        } catch (error) {
          console.error("Firebase load failed, using local cache", error);
          setSyncStatus("error");
        }
      }

      const invRaw = localStorage.getItem(`ved-tracker:invoices:${userId}`);
      const cpRaw = localStorage.getItem(`ved-tracker:counterparties:${userId}`);
      const baRaw = localStorage.getItem(`ved-tracker:bank-accounts:${userId}`);
      const ctrRaw = localStorage.getItem(`ved-tracker:contracts:${userId}`);

      setInvoices(invRaw ? JSON.parse(invRaw) : []);
      setCounterparties(cpRaw ? JSON.parse(cpRaw) : []);
      setBankAccounts(baRaw ? JSON.parse(baRaw) : []);
      setContracts(ctrRaw ? JSON.parse(ctrRaw) : []);
      setDataReady(true);
    };

    load();
  }, [currentUser?.id, userId]);

  // Local cache.
  useEffect(() => {
    if (dataReady) localStorage.setItem(`ved-tracker:invoices:${userId}`, JSON.stringify(invoices));
  }, [invoices, userId, dataReady]);

  useEffect(() => {
    if (dataReady) localStorage.setItem(`ved-tracker:counterparties:${userId}`, JSON.stringify(counterparties));
  }, [counterparties, userId, dataReady]);

  useEffect(() => {
    if (dataReady) localStorage.setItem(`ved-tracker:bank-accounts:${userId}`, JSON.stringify(bankAccounts));
  }, [bankAccounts, userId, dataReady]);

  useEffect(() => {
    if (dataReady) localStorage.setItem(`ved-tracker:contracts:${userId}`, JSON.stringify(contracts));
  }, [contracts, userId, dataReady]);

  // Debounced automatic cloud sync.
  useEffect(() => {
    if (!dataReady || !currentUser || !isSupabaseConfigured) return;

    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    setSyncStatus("syncing");

    syncTimerRef.current = window.setTimeout(async () => {
      try {
        await syncAllDataToCloud(currentUser.id, {
          profile: currentUser,
          invoices,
          counterparties,
          contracts,
          bankAccounts
        });
        setSyncStatus("synced");
      } catch (error) {
        console.error("Supabase sync failed", error);
        setSyncStatus("error");
      }
    }, 1200);

    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [currentUser, invoices, counterparties, contracts, bankAccounts, dataReady]);

  // Auto overdue.
  useEffect(() => {
    if (!dataReady || invoices.length === 0) return;
    let changed = false;
    const next = invoices.map((inv) => {
      if (
        inv.status !== "paid" &&
        inv.status !== "cancelled" &&
        inv.status !== "overdue" &&
        isPastDate(inv.dueDate)
      ) {
        changed = true;
        return { ...inv, status: "overdue" as const };
      }
      return inv;
    });
    if (changed) setInvoices(next);
  }, [dataReady]);

  const sortedInvoices = useMemo(() => invoices, [invoices]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSave = (inv: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((p) => p.id === inv.id);
      return exists ? prev.map((p) => (p.id === inv.id ? inv : p)) : [inv, ...prev];
    });
    closeForm();
  };

  const handleDelete = async (id: string) => {
    const nextInvoices = invoices.filter((p) => p.id !== id);
    setInvoices(nextInvoices);
    if (currentUser && isSupabaseConfigured) {
      try {
        await syncAllDataToCloud(currentUser.id, {
          profile: currentUser,
          invoices: nextInvoices,
          counterparties,
          contracts,
          bankAccounts
        });
      } catch (error) {
        console.error("Cloud invoice delete failed", error);
      }
    }
  };

  const saveLocalUser = (user: User) => {
    const raw = localStorage.getItem("ved-tracker:users");
    const prev = raw ? (JSON.parse(raw) as User[]) : [];
    const next = prev.some((u) => u.id === user.id)
      ? prev.map((u) => (u.id === user.id ? user : u))
      : [...prev, user];
    localStorage.setItem("ved-tracker:users", JSON.stringify(next));
    localStorage.setItem("ved-tracker:currentUserId", user.id);
  };

  const handleLogin = async (user: User) => {
    saveLocalUser(user);

    // If guest had data and cloud profile is empty, move guest data to this account.
    const guestInvoices = JSON.parse(localStorage.getItem("ved-tracker:invoices:guest") || "[]") as Invoice[];
    const guestCPs = JSON.parse(localStorage.getItem("ved-tracker:counterparties:guest") || "[]") as Counterparty[];
    const guestBAs = JSON.parse(localStorage.getItem("ved-tracker:bank-accounts:guest") || "[]") as BankAccount[];
    const guestCtrs = JSON.parse(localStorage.getItem("ved-tracker:contracts:guest") || "[]") as Contract[];

    if (isSupabaseConfigured) {
      try {
        const cloud = await syncAllDataFromCloud(user.id);
        if (
          (!cloud || cloud.invoices.length === 0) &&
          (guestInvoices.length || guestCPs.length || guestBAs.length || guestCtrs.length)
        ) {
          const inv = guestInvoices.map((x) => ({ ...x, userId: user.id }));
          const cp = guestCPs.map((x) => ({ ...x, userId: user.id }));
          const ba = guestBAs.map((x) => ({ ...x, userId: user.id }));
          const ctr = guestCtrs.map((x) => ({ ...x, userId: user.id }));
          
          const newData = {
            profile: user,
            invoices: inv,
            counterparties: cp,
            contracts: ctr,
            bankAccounts: ba
          };
          await syncAllDataToCloud(user.id, newData);
          saveToLocalCache(user.id, newData);
          setInvoices(inv);
          setCounterparties(cp);
          setContracts(ctr);
          setBankAccounts(ba);
        }
      } catch (error) {
        console.error("Initial cloud sync failed", error);
      }
    }

    setCurrentUser(user);
    setLoginOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("ved-tracker:currentUserId");
    setCurrentUser(null);
    setSyncStatus("idle");
    setInvoices([]);
    setCounterparties([]);
    setBankAccounts([]);
    setContracts([]);
    setTab("invoices");
  };

  const handleUpdateProfile = async (updated: User) => {
    setCurrentUser(updated);
    saveLocalUser(updated);
    if (isSupabaseConfigured) {
      try {
        await syncAllDataToCloud(updated.id, {
          profile: updated,
          invoices,
          counterparties,
          contracts,
          bankAccounts
        });
      } catch (error) {
        console.error("Profile cloud save failed", error);
      }
    }
  };

  const total = sortedInvoices.length;
  const totalLabel = pluralize(total, ["инвойс", "инвойса", "инвойсов"]);

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = currentUser
    ? [
        { key: "invoices", label: "Инвойсы", icon: "📄", count: invoices.length },
        { key: "contracts", label: "Договоры", icon: "📜", count: contracts.length },
        { key: "counterparties", label: "Контрагенты", icon: "🏢", count: counterparties.length },
        { key: "accounts", label: "Мои счета", icon: "🏦", count: bankAccounts.length },
        { key: "profile", label: "Профиль", icon: "👤" },
      ]
    : [];

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo" aria-hidden>📊</div>
          <div>
            <h1>Учёт ВЭД-инвойсов</h1>
            {tab === "profile" && currentUser ? (
              <p>Личный кабинет · {currentUser.name}</p>
            ) : (
              <p>{currentUser ? currentUser.name : "Гостевой режим"} · всего {total} {totalLabel}</p>
            )}
          </div>
        </div>
        <div className="header-actions">
          {currentUser && isSupabaseConfigured && (
            <div className={`sync-indicator sync-${syncStatus}`}>
              {syncStatus === "syncing" && "⏳ Синхронизация..."}
              {syncStatus === "synced" && "☁️ Синхронизировано"}
              {syncStatus === "error" && "⚠ Ошибка облака"}
              {syncStatus === "idle" && "☁️ В сети"}
            </div>
          )}
          {tab === "invoices" && (
            <button className="btn btn-primary" onClick={openCreate}>
              <span aria-hidden>＋</span> Новый инвойс
            </button>
          )}
          {!currentUser && (
            <button className="btn btn-secondary" onClick={() => setLoginOpen(true)}>
              Вход / Регистрация
            </button>
          )}
        </div>
      </header>

      {currentUser && tabs.length > 1 && (
        <nav className="tabs-nav">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${tab === t.key ? "tab-active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <span className="tab-icon">{t.icon}</span>
              <span className="tab-label">{t.label}</span>
              {t.count !== undefined && <span className="tab-count">{t.count}</span>}
            </button>
          ))}
        </nav>
      )}

      <main className="app-main">
        {!currentUser && invoices.length === 0 ? (
          <LandingHero onLogin={() => setLoginOpen(true)} onCreateInvoice={openCreate} invoiceCount={0} />
        ) : tab === "profile" && currentUser ? (
          <UserProfile
            user={currentUser}
            onUpdate={handleUpdateProfile}
            onLogout={handleLogout}
            syncStatus={syncStatus}
          />
        ) : tab === "invoices" ? (
          <>
            {!currentUser && (
              <LandingHero
                onLogin={() => setLoginOpen(true)}
                onCreateInvoice={openCreate}
                invoiceCount={invoices.length}
              />
            )}
            <DashboardStats invoices={sortedInvoices} />
            <InvoiceList
              invoices={sortedInvoices}
              onEdit={openEdit}
              onDelete={handleDelete}
              onPrint={(inv) => setPrintInvoice(inv)}
            />
          </>
        ) : tab === "contracts" ? (
          <ContractSection items={contracts} onChange={setContracts} counterparties={counterparties} userId={userId} />
        ) : tab === "counterparties" ? (
          <CounterpartySection items={counterparties} onChange={setCounterparties} userId={userId} />
        ) : tab === "accounts" ? (
          <BankAccountSection items={bankAccounts} onChange={setBankAccounts} userId={userId} />
        ) : null}
      </main>

      <footer className="app-footer">
        {currentUser ? currentUser.name : "Гость"} · {currentUser && isSupabaseConfigured ? "Данные синхронизируются с облаком" : "Данные хранятся локально"} · {new Date().getFullYear()}
      </footer>

      {formOpen && (
        <InvoiceForm
          initial={editing}
          onClose={closeForm}
          onSave={handleSave}
          counterparties={counterparties}
          bankAccounts={bankAccounts}
          contracts={contracts}
          userId={userId}
        />
      )}

      {loginOpen && <LoginModal onLogin={handleLogin} onClose={() => setLoginOpen(false)} />}

      {printInvoice && (
        <InvoicePrintModal
          invoice={printInvoice}
          onClose={() => setPrintInvoice(null)}
          counterparties={counterparties}
          bankAccounts={bankAccounts}
          contracts={contracts}
        />
      )}
    </div>
  );
}
