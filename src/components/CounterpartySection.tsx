import { useEffect, useState } from "react";
import type { Counterparty } from "../types";
import { uuid } from "../utils/format";

interface Props {
  items: Counterparty[];
  onChange: (items: Counterparty[]) => void;
  userId: string;
}

type FormState = {
  name: string;
  country: string;
  address: string;
  taxId: string;
  regNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  notes: string;
};

const empty = (): FormState => ({
  name: "",
  country: "",
  address: "",
  taxId: "",
  regNumber: "",
  contactPerson: "",
  phone: "",
  email: "",
  notes: "",
});

export function CounterpartySection({ items, onChange, userId }: Props) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Counterparty | null>(null);
  const [form, setForm] = useState<FormState>(empty());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const filtered = items
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.taxId.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const openCreate = () => {
    setEditing(null);
    setForm(empty());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (c: Counterparty) => {
    setEditing(c);
    setForm({
      name: c.name,
      country: c.country,
      address: c.address,
      taxId: c.taxId,
      regNumber: c.regNumber,
      contactPerson: c.contactPerson,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  // ESC + body lock
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
    if (!form.name.trim()) errs.name = "Обязательное поле";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const entry: Counterparty = {
      id: editing?.id ?? uuid(),
      userId,
      createdAt: editing?.createdAt ?? Date.now(),
      name: form.name.trim(),
      country: form.country.trim(),
      address: form.address.trim(),
      taxId: form.taxId.trim(),
      regNumber: form.regNumber.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
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
    if (confirm("Удалить контрагента?")) onChange(items.filter((c) => c.id !== id));
  };

  return (
    <section className="ref-section">
      <div className="ref-toolbar">
        <input
          type="search"
          className="input search-input"
          placeholder="Поиск контрагентов…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={openCreate}>
          <span aria-hidden>＋</span> Добавить контрагента
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>Контрагентов пока нет</h3>
          <p>Добавьте первого контрагента-покупателя.</p>
        </div>
      ) : (
        <div className="ref-grid">
          {filtered.map((c) => (
            <article key={c.id} className="ref-card">
              <header className="ref-card-header">
                <h3>{c.name}</h3>
                {c.country && <span className="ref-country">{c.country}</span>}
              </header>
              <div className="ref-card-body">
                {c.address && <div className="ref-row"><span className="ref-label">Адрес</span><span>{c.address}</span></div>}
                {c.taxId && <div className="ref-row"><span className="ref-label">УНП / ИНН</span><span className="mono">{c.taxId}</span></div>}
                {c.regNumber && <div className="ref-row"><span className="ref-label">Рег. №</span><span className="mono">{c.regNumber}</span></div>}
                {c.contactPerson && <div className="ref-row"><span className="ref-label">Контакт</span><span>{c.contactPerson}</span></div>}
                {c.phone && <div className="ref-row"><span className="ref-label">Телефон</span><span>{c.phone}</span></div>}
                {c.email && <div className="ref-row"><span className="ref-label">Email</span><span>{c.email}</span></div>}
                {c.notes && <div className="ref-notes">{c.notes}</div>}
              </div>
              <footer className="ref-card-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Изменить</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Удалить</button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <header className="modal-header">
              <h2>{editing ? "Редактировать контрагента" : "Новый контрагент"}</h2>
              <button className="btn-icon" onClick={closeModal} aria-label="Закрыть">✕</button>
            </header>
            <form className="modal-body" onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <label className="field field-full">
                  <span>Название фирмы *</span>
                  <input className={`input ${errors.name ? "input-error" : ""}`} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="ООО «Название»" />
                  {errors.name && <span className="error">{errors.name}</span>}
                </label>
                <label className="field">
                  <span>Страна</span>
                  <input className="input" value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="Германия" />
                </label>
                <label className="field">
                  <span>УНП / ИНН / VAT</span>
                  <input className="input" value={form.taxId} onChange={(e) => update("taxId", e.target.value)} placeholder="DE123456789" />
                </label>
                <label className="field field-full">
                  <span>Юридический адрес</span>
                  <input className="input" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Полный адрес" />
                </label>
                <label className="field">
                  <span>Регистрационный номер</span>
                  <input className="input" value={form.regNumber} onChange={(e) => update("regNumber", e.target.value)} placeholder="HRB 12345" />
                </label>
                <label className="field">
                  <span>Контактное лицо</span>
                  <input className="input" value={form.contactPerson} onChange={(e) => update("contactPerson", e.target.value)} placeholder="Иванов И.И." />
                </label>
                <label className="field">
                  <span>Телефон</span>
                  <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+375 29 ..." />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input type="email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@company.com" />
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
