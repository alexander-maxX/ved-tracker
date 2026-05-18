import { useEffect, useState } from "react";
import type { Contract, Counterparty, Currency } from "../types";
import { formatDate, uuid } from "../utils/format";

interface Props {
  items: Contract[];
  onChange: (items: Contract[]) => void;
  counterparties: Counterparty[];
  userId: string;
}

type FormState = {
  contractNumber: string;
  date: string;
  expiryDate: string;
  counterpartyId: string;
  currency: Currency;
  subject: string;
  notes: string;
};

const empty = (): FormState => ({
  contractNumber: "",
  date: "",
  expiryDate: "",
  counterpartyId: "",
  currency: "USD",
  subject: "",
  notes: "",
});

export function ContractSection({ items, onChange, counterparties, userId }: Props) {
  const [search, setSearch] = useState("");
  const [cpFilter, setCpFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [form, setForm] = useState<FormState>(empty());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const filtered = items
    .filter((c) => {
      if (cpFilter && c.counterpartyId !== cpFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.contractNumber.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const openCreate = () => {
    setEditing(null);
    setForm(empty());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (c: Contract) => {
    setEditing(c);
    setForm({
      contractNumber: c.contractNumber,
      date: c.date,
      expiryDate: c.expiryDate,
      counterpartyId: c.counterpartyId,
      currency: c.currency,
      subject: c.subject,
      notes: c.notes,
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
    if (!form.contractNumber.trim()) errs.contractNumber = "Обязательное поле";
    if (!form.counterpartyId) errs.counterpartyId = "Выберите контрагента";
    if (!form.date) errs.date = "Обязательное поле";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const entry: Contract = {
      id: editing?.id ?? uuid(),
      userId,
      createdAt: editing?.createdAt ?? Date.now(),
      contractNumber: form.contractNumber.trim(),
      date: form.date,
      expiryDate: form.expiryDate,
      counterpartyId: form.counterpartyId,
      currency: form.currency,
      subject: form.subject.trim(),
      notes: form.notes.trim(),
    };
    if (editing) {
      onChange(items.map((c) => (c.id === entry.id ? entry : c)));
    } else {
      onChange([entry, ...items]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить этот договор? Все привязанные инвойсы потеряют ссылку.")) {
      onChange(items.filter((c) => c.id !== id));
    }
  };

  const getCounterpartyName = (id: string) => {
    return counterparties.find((cp) => cp.id === id)?.name || "Неизвестный клиент";
  };

  return (
    <section className="ref-section">
      <div className="ref-toolbar">
        <input
          type="search"
          className="input search-input"
          placeholder="Поиск по номеру или предмету договора…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input select"
          style={{ maxWidth: "240px" }}
          value={cpFilter}
          onChange={(e) => setCpFilter(e.target.value)}
        >
          <option value="">Все контрагенты</option>
          {counterparties.map((cp) => (
            <option key={cp.id} value={cp.id}>{cp.name}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={openCreate}>
          <span aria-hidden>＋</span> Добавить договор
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h3>Договоры не найдены</h3>
          <p>Добавьте первый экспортный контракт или измените фильтры.</p>
        </div>
      ) : (
        <div className="ref-grid">
          {filtered.map((c) => {
            const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
            return (
              <article key={c.id} className="ref-card">
                <header className="ref-card-header">
                  <h3>{c.contractNumber}</h3>
                  <span className="ref-country" style={{ color: isExpired ? "#ef4444" : "#eab308", borderColor: isExpired ? "#ef4444" : "#eab308" }}>
                    {c.currency}
                  </span>
                </header>
                <div className="ref-card-body">
                  <div className="ref-row">
                    <span className="ref-label">Клиент</span>
                    <span style={{ fontWeight: 600 }}>{getCounterpartyName(c.counterpartyId)}</span>
                  </div>
                  <div className="ref-row">
                    <span className="ref-label">Дата закл.</span>
                    <span>{formatDate(c.date)}</span>
                  </div>
                  {c.expiryDate && (
                    <div className="ref-row">
                      <span className="ref-label">Действует до</span>
                      <span style={{ color: isExpired ? "#ef4444" : "inherit" }}>
                        {formatDate(c.expiryDate)} {isExpired ? "(Истёк)" : ""}
                      </span>
                    </div>
                  )}
                  {c.subject && (
                    <div className="ref-row">
                      <span className="ref-label">Предмет</span>
                      <span>{c.subject}</span>
                    </div>
                  )}
                  {c.notes && <div className="ref-notes">{c.notes}</div>}
                </div>
                <footer className="ref-card-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Изменить</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Удалить</button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <header className="modal-header">
              <h2>{editing ? "Редактировать договор" : "Новый договор"}</h2>
              <button className="btn-icon" onClick={closeModal} aria-label="Закрыть">✕</button>
            </header>
            <form className="modal-body" onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <label className="field">
                  <span>Номер договора *</span>
                  <input className={`input ${errors.contractNumber ? "input-error" : ""}`} value={form.contractNumber} onChange={(e) => update("contractNumber", e.target.value)} placeholder="CTR-2026-01" />
                  {errors.contractNumber && <span className="error">{errors.contractNumber}</span>}
                </label>

                <label className="field">
                  <span>Валюта договора</span>
                  <select className="input" value={form.currency} onChange={(e) => update("currency", e.target.value as Currency)}>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="RUB">RUB (₽)</option>
                    <option value="BYN">BYN (Br)</option>
                  </select>
                </label>

                <label className="field field-full">
                  <span>Контрагент (покупатель) *</span>
                  <select className={`input ${errors.counterpartyId ? "input-error" : ""}`} value={form.counterpartyId} onChange={(e) => update("counterpartyId", e.target.value)}>
                    <option value="">— Выберите контрагента —</option>
                    {counterparties.map((cp) => (
                      <option key={cp.id} value={cp.id}>{cp.name}</option>
                    ))}
                  </select>
                  {errors.counterpartyId && <span className="error">{errors.counterpartyId}</span>}
                </label>

                <label className="field">
                  <span>Дата заключения *</span>
                  <input type="date" className={`input ${errors.date ? "input-error" : ""}`} value={form.date} onChange={(e) => update("date", e.target.value)} />
                  {errors.date && <span className="error">{errors.date}</span>}
                </label>

                <label className="field">
                  <span>Срок действия до</span>
                  <input type="date" className="input" value={form.expiryDate} onChange={(e) => update("expiryDate", e.target.value)} />
                </label>

                <label className="field field-full">
                  <span>Предмет договора</span>
                  <input className="input" value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="например, Поставка пиломатериалов обрезных" />
                </label>

                <label className="field field-full">
                  <span>Примечание</span>
                  <textarea className="input textarea" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Дополнительные условия, пролонгация…" />
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
