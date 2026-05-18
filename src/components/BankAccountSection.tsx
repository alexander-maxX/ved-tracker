import { useEffect, useState } from "react";
import type { BankAccount, Currency } from "../types";
import { uuid } from "../utils/format";

interface Props {
  items: BankAccount[];
  onChange: (items: BankAccount[]) => void;
  userId: string;
}

type FormState = {
  label: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  bankAddress: string;
  corrAccount: string;
  currency: Currency;
  ownerName: string;
  notes: string;
};

const empty = (): FormState => ({
  label: "",
  accountNumber: "",
  bankName: "",
  bankCode: "",
  bankAddress: "",
  corrAccount: "",
  currency: "USD",
  ownerName: "",
  notes: "",
});

export function BankAccountSection({ items, onChange, userId }: Props) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<FormState>(empty());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const filtered = items
    .filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.label.toLowerCase().includes(q) ||
        b.accountNumber.toLowerCase().includes(q) ||
        b.bankName.toLowerCase().includes(q) ||
        b.bankCode.toLowerCase().includes(q) ||
        b.currency.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const openCreate = () => {
    setEditing(null);
    setForm(empty());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (b: BankAccount) => {
    setEditing(b);
    setForm({
      label: b.label,
      accountNumber: b.accountNumber,
      bankName: b.bankName,
      bankCode: b.bankCode,
      bankAddress: b.bankAddress,
      corrAccount: b.corrAccount,
      currency: b.currency,
      ownerName: b.ownerName,
      notes: b.notes,
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.label.trim()) errs.label = "Обязательное поле";
    if (!form.accountNumber.trim()) errs.accountNumber = "Обязательное поле";
    if (!form.bankName.trim()) errs.bankName = "Обязательное поле";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const entry: BankAccount = {
      id: editing?.id ?? uuid(),
      userId,
      createdAt: editing?.createdAt ?? Date.now(),
      label: form.label.trim(),
      accountNumber: form.accountNumber.trim(),
      bankName: form.bankName.trim(),
      bankCode: form.bankCode.trim(),
      bankAddress: form.bankAddress.trim(),
      corrAccount: form.corrAccount.trim(),
      currency: form.currency,
      ownerName: form.ownerName.trim(),
      notes: form.notes.trim(),
    };
    if (editing) {
      onChange(items.map((b) => (b.id === entry.id ? entry : b)));
    } else {
      onChange([entry, ...items]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить банковский счет?")) onChange(items.filter((b) => b.id !== id));
  };

  const currencyBadge = (c: Currency) => {
    const colors: Record<Currency, string> = { USD: "#60a5fa", EUR: "#34d399", RUB: "#f59e0b", BYN: "#a78bfa" };
    return <span className="ba-currency-badge" style={{ color: colors[c], borderColor: colors[c] }}>{c}</span>;
  };

  return (
    <section className="ref-section">
      <div className="ref-toolbar">
        <input
          type="search"
          className="input search-input"
          placeholder="Поиск по счетам…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={openCreate}>
          <span aria-hidden>＋</span> Добавить счёт
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏦</div>
          <h3>Счетов пока нет</h3>
          <p>Добавьте свой первый банковский счёт.</p>
        </div>
      ) : (
        <div className="ref-grid">
          {filtered.map((b) => (
            <article key={b.id} className="ref-card">
              <header className="ref-card-header">
                <h3>{b.label}</h3>
                {currencyBadge(b.currency)}
              </header>
              <div className="ref-card-body">
                <div className="ref-row"><span className="ref-label">Счет / IBAN</span><span className="mono">{b.accountNumber}</span></div>
                <div className="ref-row"><span className="ref-label">Банк</span><span>{b.bankName}</span></div>
                {b.bankCode && <div className="ref-row"><span className="ref-label">БИК / SWIFT</span><span className="mono">{b.bankCode}</span></div>}
                {b.bankAddress && <div className="ref-row"><span className="ref-label">Адрес банка</span><span>{b.bankAddress}</span></div>}
                {b.corrAccount && <div className="ref-row"><span className="ref-label">Кор. счет</span><span className="mono">{b.corrAccount}</span></div>}
                {b.ownerName && <div className="ref-row"><span className="ref-label">Владелец</span><span>{b.ownerName}</span></div>}
                {b.notes && <div className="ref-notes">{b.notes}</div>}
              </div>
              <footer className="ref-card-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>Изменить</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>Удалить</button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <header className="modal-header">
              <h2>{editing ? "Редактировать счёт" : "Новый банковский счёт"}</h2>
              <button className="btn-icon" onClick={closeModal} aria-label="Закрыть">✕</button>
            </header>
            <form className="modal-body" onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <label className="field">
                  <span>Название (метка) *</span>
                  <input className={`input ${errors.label ? "input-error" : ""}`} value={form.label} onChange={(e) => update("label", e.target.value)} placeholder="Основной EUR" />
                  {errors.label && <span className="error">{errors.label}</span>}
                </label>
                <label className="field">
                  <span>Валюта счета</span>
                  <select className="input" value={form.currency} onChange={(e) => update("currency", e.target.value as Currency)}>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="RUB">RUB (₽)</option>
                    <option value="BYN">BYN (Br)</option>
                  </select>
                </label>
                <label className="field field-full">
                  <span>Номер счета / IBAN *</span>
                  <input className={`input ${errors.accountNumber ? "input-error" : ""}`} value={form.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} placeholder="BY89ALFA30140000012340000000" />
                  {errors.accountNumber && <span className="error">{errors.accountNumber}</span>}
                </label>
                <label className="field">
                  <span>Наименование банка *</span>
                  <input className={`input ${errors.bankName ? "input-error" : ""}`} value={form.bankName} onChange={(e) => update("bankName", e.target.value)} placeholder="ОАО «Альфа-банк»" />
                  {errors.bankName && <span className="error">{errors.bankName}</span>}
                </label>
                <label className="field">
                  <span>БИК / SWIFT</span>
                  <input className="input" value={form.bankCode} onChange={(e) => update("bankCode", e.target.value)} placeholder="ALFABY2X" />
                </label>
                <label className="field field-full">
                  <span>Адрес банка</span>
                  <input className="input" value={form.bankAddress} onChange={(e) => update("bankAddress", e.target.value)} placeholder="г. Минск, ул. Сурганова, 43" />
                </label>
                <label className="field">
                  <span>Кор. счет</span>
                  <input className="input" value={form.corrAccount} onChange={(e) => update("corrAccount", e.target.value)} placeholder="3019914400001" />
                </label>
                <label className="field">
                  <span>Владелец счета</span>
                  <input className="input" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="ООО «МояКомпания»" />
                </label>
                <label className="field field-full">
                  <span>Примечание</span>
                  <textarea className="input textarea" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Любые заметки…" />
                </label>
              </div>
              <footer className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Отмена</button>
                <button type="submit" className="btn btn-primary">{editing ? "Сохранить" : "Добавить"}</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
