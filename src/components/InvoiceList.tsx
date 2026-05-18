import { useMemo, useState } from "react";
import type { Currency, Invoice, InvoiceStatus } from "../types";
import { formatDate, formatMoney } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

interface Props {
  invoices: Invoice[];
  onEdit: (inv: Invoice) => void;
  onDelete: (id: string) => void;
  onPrint: (inv: Invoice) => void;
}

const STATUS_LABELS: Record<InvoiceStatus | "all", string> = {
  all: "Все статусы",
  draft: "Черновик",
  sent: "Отправлен",
  paid: "Оплачен",
  overdue: "Просрочен",
  cancelled: "Отменён",
};

const STATUS_OPTIONS: (InvoiceStatus | "all")[] = [
  "all",
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];

const CURRENCY_OPTIONS: (Currency | "all")[] = ["all", "USD", "EUR", "RUB", "BYN"];

export function InvoiceList({ invoices, onEdit, onDelete, onPrint }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [currencyFilter, setCurrencyFilter] = useState<Currency | "all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        if (statusFilter !== "all" && inv.status !== statusFilter) return false;
        if (currencyFilter !== "all" && inv.currency !== currencyFilter)
          return false;
        if (!q) return true;
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.clientName.toLowerCase().includes(q) ||
          (inv.productName && inv.productName.toLowerCase().includes(q)) ||
          (inv.incoterms && inv.incoterms.toLowerCase().includes(q)) ||
          (inv.contractNumber && inv.contractNumber.toLowerCase().includes(q)) ||
          (inv.grade && inv.grade.toLowerCase().includes(q)) ||
          (inv.size && inv.size.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [invoices, search, statusFilter, currencyFilter]);

  return (
    <section className="invoice-list">
      <div className="filters">
        <input
          type="search"
          className="input search-input"
          placeholder="Поиск по №, клиенту, договору, условиям, сорту…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "all")}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          className="input select"
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value as Currency | "all")}
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Все валюты" : c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Инвойсы не найдены</h3>
          <p>Измените фильтры или создайте новый инвойс.</p>
        </div>
      ) : (
        <>
          {/* Таблица для десктопа / планшета */}
          <div className="table-wrapper">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>№ / Поставка</th>
                  <th>Договор</th>
                  <th>Клиент / Р/Счет</th>
                  <th>Характеристики</th>
                  <th>Объем и Цена</th>
                  <th>Даты (Срок)</th>
                  <th className="num">Итого</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id}>
                    <td className="mono" style={{ minWidth: "140px" }}>
                      <div className="cell-inv-num">{inv.invoiceNumber}</div>
                      {inv.incoterms && (
                        <div className="cell-incoterms-tag">{inv.incoterms}</div>
                      )}
                    </td>
                    <td>
                      {inv.contractNumber ? (
                        <div className="cell-contract-col" title="Номер договора, по которому выписан инвойс">
                          📜 {inv.contractNumber}
                        </div>
                      ) : (
                        <span className="cell-contract-empty">—</span>
                      )}
                    </td>
                    <td>
                      <div className="cell-client">{inv.clientName}</div>
                      {inv.bankAccount && (
                        <div className="cell-bank-acc" title="Расчетный счет">
                          💳 {inv.bankAccount}
                        </div>
                      )}
                    </td>
                    <td>
                      {inv.grade && <div className="cell-detail-item"><strong>Сорт:</strong> {inv.grade}</div>}
                      {inv.size && <div className="cell-detail-item"><strong>Размер:</strong> {inv.size}</div>}
                      {inv.productName && <div className="cell-desc-text">{inv.productName}</div>}
                    </td>
                    <td>
                      <div className="cell-volume-price">
                        <div>{inv.volumeM3 ?? 0} м³</div>
                        <div className="cell-sub-price">по {formatMoney(inv.pricePerM3 ?? 0, inv.currency)}/м³</div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-dates">
                        <div>от {formatDate(inv.date)}</div>
                        <div className="cell-due-date" title="Срок оплаты">
                          до {formatDate(inv.dueDate)}
                        </div>
                      </div>
                    </td>
                    <td className="num">
                      {formatMoney(inv.amount, inv.currency)}
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-icon"
                          onClick={() => onPrint(inv)}
                          title="Печать / Экспорт"
                        >
                          🖨️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onEdit(inv)}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => {
                            if (confirm(`Удалить инвойс ${inv.invoiceNumber}?`))
                              onDelete(inv.id);
                          }}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Карточки для мобильных */}
          <div className="invoice-cards">
            {filtered.map((inv) => (
              <article key={inv.id} className="invoice-card">
                <header className="ic-header">
                  <span className="mono">{inv.invoiceNumber}</span>
                  <StatusBadge status={inv.status} />
                </header>
                <div className="ic-client">
                  {inv.clientName}
                  {inv.incoterms && <span className="ic-incoterms-badge">{inv.incoterms}</span>}
                </div>
                
                {/* Блок договора в мобильной карточке */}
                {inv.contractNumber && (
                  <div className="ic-contract-block">
                    <div className="ic-contract-label">Договор:</div>
                    <div className="ic-contract-number">📜 {inv.contractNumber}</div>
                  </div>
                )}

                {inv.bankAccount && (
                  <div className="ic-bank">💳 Счет: {inv.bankAccount}</div>
                )}

                <div className="ic-specs">
                  {inv.grade && <div><strong>Сорт:</strong> {inv.grade}</div>}
                  {inv.size && <div><strong>Размер:</strong> {inv.size}</div>}
                  {inv.productName && <div className="ic-desc-text">{inv.productName}</div>}
                </div>

                <div className="ic-grid-expanded">
                  <div>
                    <span className="ic-label">Объем</span>
                    <span>{inv.volumeM3 ?? 0} м³</span>
                  </div>
                  <div>
                    <span className="ic-label">Цена / м³</span>
                    <span>{formatMoney(inv.pricePerM3 ?? 0, inv.currency)}</span>
                  </div>
                  <div>
                    <span className="ic-label">Дата / Срок</span>
                    <span style={{ fontSize: "11px" }}>{formatDate(inv.date)} — {formatDate(inv.dueDate)}</span>
                  </div>
                </div>

                <div className="ic-total-row">
                  <span>Итого:</span>
                  <span className="ic-amount">{formatMoney(inv.amount, inv.currency)}</span>
                </div>

                <footer className="ic-footer">
                  <button className="btn btn-primary" onClick={() => onPrint(inv)} style={{ padding: "10px" }} title="Печать и Экспорт">
                    🖨️
                  </button>
                  <button className="btn btn-secondary" onClick={() => onEdit(inv)}>
                    Изменить
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      if (confirm(`Удалить инвойс ${inv.invoiceNumber}?`))
                        onDelete(inv.id);
                    }}
                  >
                    Удалить
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
