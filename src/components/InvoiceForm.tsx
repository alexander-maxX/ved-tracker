import { useEffect, useState } from "react";
import type { BankAccount, Contract, Counterparty, Currency, Invoice, InvoiceStatus } from "../types";
import { todayISO, uuid } from "../utils/format";

interface Props {
  initial: Invoice | null;
  onClose: () => void;
  onSave: (inv: Invoice) => void;
  counterparties: Counterparty[];
  bankAccounts: BankAccount[];
  contracts: Contract[];
  userId: string;
}

type FormState = {
  invoiceNumber: string;
  counterpartyId: string;
  clientName: string;
  buyerCountry: string;
  buyerAddress: string;
  buyerTaxId: string;
  contractId: string;
  contractNumber: string;
  bankAccountId: string;
  bankAccount: string;
  bankName: string;
  bankCode: string;
  bankAddress: string;
  bankOwnerName: string;
  sellerName: string;
  sellerAddress: string;
  sellerTaxId: string;
  date: string;
  dueDate: string;
  currency: Currency;
  status: InvoiceStatus;
  productName: string;
  additionalInfo: string;
  pricePerM3: string;
  volumeM3: string;
  incoterms: string;
  grade: string;
  size: string;
};

const empty = (): FormState => ({
  invoiceNumber: "",
  counterpartyId: "",
  clientName: "",
  buyerCountry: "",
  buyerAddress: "",
  buyerTaxId: "",
  contractId: "",
  contractNumber: "",
  bankAccountId: "",
  bankAccount: "",
  bankName: "",
  bankCode: "",
  bankAddress: "",
  bankOwnerName: "",
  sellerName: "",
  sellerAddress: "",
  sellerTaxId: "",
  date: todayISO(),
  dueDate: todayISO(),
  currency: "USD",
  status: "draft",
  productName: "",
  additionalInfo: "",
  pricePerM3: "",
  volumeM3: "",
  incoterms: "FCA",
  grade: "",
  size: "",
});

const INCOTERMS_OPTIONS = ["EXW", "FCA", "CPT", "CIP", "DAT", "DAP", "DDP", "FAS", "FOB", "CFR", "CIF"];

export function InvoiceForm({ initial, onClose, onSave, counterparties, bankAccounts, contracts, userId }: Props) {
  const [form, setForm] = useState<FormState>(() => initial ? {
    invoiceNumber: initial.invoiceNumber,
    counterpartyId: initial.counterpartyId ?? "",
    clientName: initial.clientName ?? "",
    buyerCountry: initial.buyerCountry ?? "",
    buyerAddress: initial.buyerAddress ?? "",
    buyerTaxId: initial.buyerTaxId ?? "",
    contractId: initial.contractId ?? "",
    contractNumber: initial.contractNumber ?? "",
    bankAccountId: initial.bankAccountId ?? "",
    bankAccount: initial.bankAccount ?? "",
    bankName: initial.bankName ?? "",
    bankCode: initial.bankCode ?? "",
    bankAddress: initial.bankAddress ?? "",
    bankOwnerName: initial.bankOwnerName ?? "",
    sellerName: initial.sellerName ?? "",
    sellerAddress: initial.sellerAddress ?? "",
    sellerTaxId: initial.sellerTaxId ?? "",
    date: initial.date,
    dueDate: initial.dueDate,
    currency: initial.currency,
    status: initial.status,
    productName: initial.productName ?? "",
    additionalInfo: initial.additionalInfo ?? "",
    pricePerM3: String(initial.pricePerM3 ?? ""),
    volumeM3: String(initial.volumeM3 ?? ""),
    incoterms: initial.incoterms || "FCA",
    grade: initial.grade ?? "",
    size: initial.size ?? "",
  } : empty());

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const availableContracts = contracts.filter((c) => c.counterpartyId === form.counterpartyId);

  const handleCounterpartyChange = (id: string) => {
    const cp = counterparties.find((c) => c.id === id);
    setForm((f) => ({
      ...f,
      counterpartyId: id,
      contractId: "",
      clientName: cp?.name ?? f.clientName,
      buyerCountry: cp?.country ?? f.buyerCountry,
      buyerAddress: cp?.address ?? f.buyerAddress,
      buyerTaxId: cp?.taxId ?? f.buyerTaxId,
    }));
  };

  const handleContractChange = (id: string) => {
    const ctr = contracts.find((c) => c.id === id);
    setForm((f) => ({
      ...f,
      contractId: id,
      contractNumber: ctr?.contractNumber ?? f.contractNumber,
      currency: ctr?.currency ?? f.currency,
    }));
  };

  const handleBankAccountChange = (id: string) => {
    const ba = bankAccounts.find((b) => b.id === id);
    setForm((f) => ({
      ...f,
      bankAccountId: id,
      bankAccount: ba?.accountNumber ?? f.bankAccount,
      bankName: ba?.bankName ?? f.bankName,
      bankCode: ba?.bankCode ?? f.bankCode,
      bankAddress: ba?.bankAddress ?? f.bankAddress,
      bankOwnerName: ba?.ownerName ?? f.bankOwnerName,
      currency: ba?.currency ?? f.currency,
    }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.invoiceNumber.trim()) errs.invoiceNumber = "Обязательное поле";
    if (!form.clientName.trim()) errs.clientName = "Укажите покупателя";
    if (!form.bankAccount.trim()) errs.bankAccount = "Укажите счёт для оплаты";
    if (!form.date) errs.date = "Обязательное поле";
    if (!form.dueDate) errs.dueDate = "Обязательное поле";

    if (form.date && form.dueDate && form.dueDate < form.date) {
      errs.dueDate = "Срок оплаты не может быть раньше даты инвойса";
    }

    const price = Number(form.pricePerM3);
    if (!form.pricePerM3 || isNaN(price)) errs.pricePerM3 = "Введите корректное число";
    else if (price <= 0) errs.pricePerM3 = "Цена должна быть больше нуля";

    const vol = Number(form.volumeM3);
    if (!form.volumeM3 || isNaN(vol)) errs.volumeM3 = "Введите корректное число";
    else if (vol <= 0) errs.volumeM3 = "Объем должен быть больше нуля";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const price = Number(form.pricePerM3);
    const vol = Number(form.volumeM3);
    const computedAmount = Number((price * vol).toFixed(2));

    const invoice: Invoice = {
      id: initial?.id ?? uuid(),
      userId,
      createdAt: initial?.createdAt ?? Date.now(),
      invoiceNumber: form.invoiceNumber.trim(),
      clientName: form.clientName.trim(),
      buyerCountry: form.buyerCountry.trim(),
      buyerAddress: form.buyerAddress.trim(),
      buyerTaxId: form.buyerTaxId.trim(),
      sellerName: form.sellerName.trim(),
      sellerAddress: form.sellerAddress.trim(),
      sellerTaxId: form.sellerTaxId.trim(),
      date: form.date,
      dueDate: form.dueDate,
      amount: computedAmount,
      currency: form.currency,
      status: form.status,
      productName: form.productName.trim(),
      additionalInfo: form.additionalInfo.trim(),
      bankAccount: form.bankAccount.trim(),
      bankName: form.bankName.trim(),
      bankCode: form.bankCode.trim(),
      bankAddress: form.bankAddress.trim(),
      bankOwnerName: form.bankOwnerName.trim(),
      pricePerM3: price,
      volumeM3: vol,
      incoterms: form.incoterms,
      grade: form.grade.trim(),
      size: form.size.trim(),
      counterpartyId: form.counterpartyId,
      bankAccountId: form.bankAccountId,
      contractId: form.contractId,
      contractNumber: form.contractNumber.trim(),
    };
    onSave(invoice);
  };

  const currentPrice = Number(form.pricePerM3);
  const currentVolume = Number(form.volumeM3);
  const hasAmount = !isNaN(currentPrice) && !isNaN(currentVolume) && currentPrice > 0 && currentVolume > 0;
  const computedTotal = hasAmount ? (currentPrice * currentVolume).toFixed(2) : "0.00";

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-wide" role="dialog" aria-modal="true">
        <header className="modal-header">
          <h2>{initial ? "Редактирование инвойса" : "Новый инвойс"}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Закрыть">✕</button>
        </header>

        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          {userId !== "guest" && (
            <div className="field-hint manual-note">
              Можно выбрать данные из справочников или заполнить все реквизиты вручную.
            </div>
          )}
          <div className="form-grid">
            <label className="field">
              <span>Номер инвойса *</span>
              <input className={`input ${errors.invoiceNumber ? "input-error" : ""}`} value={form.invoiceNumber} onChange={(e) => update("invoiceNumber", e.target.value)} placeholder="EXP-2026-001" />
              {errors.invoiceNumber && <span className="error">{errors.invoiceNumber}</span>}
            </label>
            <label className="field">
              <span>Статус</span>
              <select className="input" value={form.status} onChange={(e) => update("status", e.target.value as InvoiceStatus)}>
                <option value="draft">Черновик</option>
                <option value="sent">Отправлен</option>
                <option value="paid">Оплачен</option>
                <option value="overdue">Просрочен</option>
                <option value="cancelled">Отменён</option>
              </select>
            </label>

            {userId !== "guest" && counterparties.length > 0 && (
              <label className="field field-full">
                <span>Контрагент из справочника (необязательно)</span>
                <select className="input" value={form.counterpartyId} onChange={(e) => handleCounterpartyChange(e.target.value)}>
                  <option value="">— Заполнить покупателя вручную —</option>
                  {counterparties.map((c) => <option key={c.id} value={c.id}>{c.name}{c.country ? ` (${c.country})` : ""}</option>)}
                </select>
              </label>
            )}

            <label className="field">
              <span>Покупатель *</span>
              <input className={`input ${errors.clientName ? "input-error" : ""}`} value={form.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="Название фирмы покупателя" />
              {errors.clientName && <span className="error">{errors.clientName}</span>}
            </label>
            <label className="field">
              <span>Страна покупателя</span>
              <input className="input" value={form.buyerCountry} onChange={(e) => update("buyerCountry", e.target.value)} placeholder="Германия" />
            </label>
            <label className="field">
              <span>ИНН / VAT покупателя</span>
              <input className="input" value={form.buyerTaxId} onChange={(e) => update("buyerTaxId", e.target.value)} placeholder="DE123456789" />
            </label>
            <label className="field">
              <span>Адрес покупателя</span>
              <input className="input" value={form.buyerAddress} onChange={(e) => update("buyerAddress", e.target.value)} placeholder="Юридический адрес" />
            </label>

            {userId !== "guest" && counterparties.length > 0 && availableContracts.length > 0 && (
              <label className="field">
                <span>Договор из справочника</span>
                <select className="input" value={form.contractId} onChange={(e) => handleContractChange(e.target.value)} disabled={!form.counterpartyId}>
                  <option value="">— Указать номер договора вручную —</option>
                  {availableContracts.map((c) => <option key={c.id} value={c.id}>{c.contractNumber} · {c.currency}</option>)}
                </select>
              </label>
            )}
            <label className="field">
              <span>Номер договора</span>
              <input className="input" value={form.contractNumber} onChange={(e) => update("contractNumber", e.target.value)} placeholder="CTR-2026-001" />
            </label>

            {userId !== "guest" && bankAccounts.length > 0 && (
              <label className="field field-full">
                <span>Счёт из справочника</span>
                <select className="input" value={form.bankAccountId} onChange={(e) => handleBankAccountChange(e.target.value)}>
                  <option value="">— Заполнить банковские реквизиты вручную —</option>
                  {bankAccounts.map((b) => <option key={b.id} value={b.id}>{b.label} · {b.accountNumber} ({b.currency})</option>)}
                </select>
              </label>
            )}
            <label className="field">
              <span>Получатель платежа</span>
              <input className="input" value={form.bankOwnerName} onChange={(e) => update("bankOwnerName", e.target.value)} placeholder="ООО «ВашаКомпания»" />
            </label>
            <label className="field">
              <span>Счёт / IBAN *</span>
              <input className={`input ${errors.bankAccount ? "input-error" : ""}`} value={form.bankAccount} onChange={(e) => update("bankAccount", e.target.value)} placeholder="BY89ALFA..." />
              {errors.bankAccount && <span className="error">{errors.bankAccount}</span>}
            </label>
            <label className="field">
              <span>Банк</span>
              <input className="input" value={form.bankName} onChange={(e) => update("bankName", e.target.value)} placeholder="Название банка" />
            </label>
            <label className="field">
              <span>SWIFT / БИК</span>
              <input className="input" value={form.bankCode} onChange={(e) => update("bankCode", e.target.value)} placeholder="ALFABY2X" />
            </label>
            <label className="field field-full">
              <span>Адрес банка</span>
              <input className="input" value={form.bankAddress} onChange={(e) => update("bankAddress", e.target.value)} placeholder="Адрес банка" />
            </label>

            <label className="field">
              <span>Ваша компания / Продавец</span>
              <input className="input" value={form.sellerName} onChange={(e) => update("sellerName", e.target.value)} placeholder="Название продавца" />
            </label>
            <label className="field">
              <span>ИНН продавца</span>
              <input className="input" value={form.sellerTaxId} onChange={(e) => update("sellerTaxId", e.target.value)} placeholder="ИНН / УНП" />
            </label>
            <label className="field field-full">
              <span>Адрес продавца</span>
              <input className="input" value={form.sellerAddress} onChange={(e) => update("sellerAddress", e.target.value)} placeholder="Юридический адрес продавца" />
            </label>

            <label className="field">
              <span>Цена за 1 м³ *</span>
              <input type="number" step="0.01" min="0" className={`input ${errors.pricePerM3 ? "input-error" : ""}`} value={form.pricePerM3} onChange={(e) => update("pricePerM3", e.target.value)} placeholder="0.00" />
              {errors.pricePerM3 && <span className="error">{errors.pricePerM3}</span>}
            </label>
            <label className="field">
              <span>Объем партии (м³) *</span>
              <input type="number" step="0.001" min="0" className={`input ${errors.volumeM3 ? "input-error" : ""}`} value={form.volumeM3} onChange={(e) => update("volumeM3", e.target.value)} placeholder="0.000" />
              {errors.volumeM3 && <span className="error">{errors.volumeM3}</span>}
            </label>
            <label className="field">
              <span>Валюта</span>
              <select className="input" value={form.currency} onChange={(e) => update("currency", e.target.value as Currency)}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="RUB">RUB (₽)</option>
                <option value="BYN">BYN (Br)</option>
              </select>
            </label>
            <label className="field">
              <span>Условия поставки (Incoterms)</span>
              <select className="input" value={form.incoterms} onChange={(e) => update("incoterms", e.target.value)}>
                {INCOTERMS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Сорт продукции</span>
              <input className="input" value={form.grade} onChange={(e) => update("grade", e.target.value)} placeholder="например, 1-3 сорт" />
            </label>
            <label className="field">
              <span>Размер продукции</span>
              <input className="input" value={form.size} onChange={(e) => update("size", e.target.value)} placeholder="например, 25x100x6000мм" />
            </label>
            <label className="field">
              <span>Дата инвойса *</span>
              <input type="date" className={`input ${errors.date ? "input-error" : ""}`} value={form.date} onChange={(e) => update("date", e.target.value)} />
              {errors.date && <span className="error">{errors.date}</span>}
            </label>
            <label className="field">
              <span>Срок оплаты *</span>
              <input type="date" className={`input ${errors.dueDate ? "input-error" : ""}`} value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
              {errors.dueDate && <span className="error">{errors.dueDate}</span>}
            </label>
            <label className="field field-full">
              <span>Наименование товара *</span>
              <textarea className="input textarea" rows={2} value={form.productName} onChange={(e) => update("productName", e.target.value)} placeholder="Например: Пиломатериалы хвойные обрезные" />
            </label>
            <label className="field field-full">
              <span>Дополнительная информация</span>
              <textarea className="input textarea" rows={2} value={form.additionalInfo} onChange={(e) => update("additionalInfo", e.target.value)} placeholder="Примечания к контракту, условия поставки…" />
            </label>
          </div>

          <div className="form-summary">Итоговая сумма: <strong>{computedTotal} {form.currency}</strong></div>
          <footer className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary">{initial ? "Сохранить изменения" : "Создать инвойс"}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}