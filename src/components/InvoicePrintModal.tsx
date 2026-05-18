import type { BankAccount, Contract, Counterparty, Invoice } from "../types";
import { formatDate, formatMoney } from "../utils/format";

interface Props {
  invoice: Invoice;
  onClose: () => void;
  counterparties: Counterparty[];
  bankAccounts: BankAccount[];
  contracts: Contract[];
}

export function InvoicePrintModal({ invoice, onClose, counterparties, bankAccounts, contracts }: Props) {
  const cp = counterparties.find((c) => c.id === invoice.counterpartyId);
  const ba = bankAccounts.find((b) => b.id === invoice.bankAccountId);
  const ctr = contracts.find((c) => c.id === invoice.contractId);
  const sellerName = invoice.sellerName || invoice.bankOwnerName || ba?.ownerName || "ООО «МояКомпания»";
  const buyerCountry = invoice.buyerCountry || cp?.country || "";
  const buyerAddress = invoice.buyerAddress || cp?.address || "";
  const buyerTaxId = invoice.buyerTaxId || cp?.taxId || "";
  const bankOwnerName = invoice.bankOwnerName || ba?.ownerName || sellerName;
  const bankName = invoice.bankName || ba?.bankName || "";
  const bankCode = invoice.bankCode || ba?.bankCode || "";
  const bankAddress = invoice.bankAddress || ba?.bankAddress || "";

  // --- Функция 1: Печать / PDF ---
  const handlePrint = () => {
    window.print();
  };

  // --- Функция 2: Экспорт в Word (.doc) ---
  const handleExportWord = () => {
    const filename = `Invoice_${invoice.invoiceNumber}.doc`;
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Инвойс ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #333; }
          h1 { font-size: 20pt; text-align: center; margin-bottom: 20px; }
          .section-title { font-weight: bold; background-color: #f2f2f2; padding: 5px; margin-top: 15px; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
          th, td { border: 1px solid #999; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .num { text-align: right; }
          .total-row { font-weight: bold; background-color: #eaebed; }
        </style>
      </head>
      <body>
        <h1>ИНВОЙС № ${invoice.invoiceNumber}</h1>
        <p><strong>Дата инвойса:</strong> ${formatDate(invoice.date)} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Срок оплаты:</strong> ${formatDate(invoice.dueDate)}</p>
        
        <div class="section-title">1. СТОРОНЫ</div>
        <p><strong>Продавец:</strong> ${sellerName}</p>
        <p><strong>Покупатель:</strong> ${invoice.clientName} ${buyerCountry ? `(${buyerCountry})` : ""}<br>
           ${buyerAddress ? `Адрес: ${buyerAddress}<br>` : ""}
           ${buyerTaxId ? `ИНН/VAT: ${buyerTaxId}` : ""}</p>

        <div class="section-title">2. ОСНОВАНИЕ И ПОСТАВКА</div>
        <p><strong>Договор №:</strong> ${invoice.contractNumber || "—"} ${ctr?.date ? `от ${formatDate(ctr.date)}` : ""}</p>
        <p><strong>Предмет договора:</strong> ${ctr?.subject || "—"}</p>
        <p><strong>Условия поставки (Incoterms):</strong> ${invoice.incoterms || "—"}</p>

        <div class="section-title">3. РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ</div>
        <p><strong>Получатель:</strong> ${bankOwnerName || "—"}</p>
        <p><strong>Счет / IBAN:</strong> ${invoice.bankAccount || "—"}</p>
        <p><strong>Банк:</strong> ${bankName || "—"} ${bankCode ? `(SWIFT/БИК: ${bankCode})` : ""}</p>
        ${bankAddress ? `<p><strong>Адрес банка:</strong> ${bankAddress}</p>` : ""}

        <div class="section-title">4. СПЕЦИФИКАЦИЯ ТОВАРА И СТОИМОСТЬ</div>
        <table>
          <thead>
            <tr>
              <th>Наименование товара / Описание</th>
              <th>Сорт</th>
              <th>Размер</th>
              <th class="num">Объем (м³)</th>
              <th class="num">Цена / м³</th>
              <th class="num">Итого (${invoice.currency})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.productName || "Пиломатериалы экспортные"}</td>
              <td>${invoice.grade || "—"}</td>
              <td>${invoice.size || "—"}</td>
              <td class="num">${invoice.volumeM3}</td>
              <td class="num">${formatMoney(invoice.pricePerM3, invoice.currency)}</td>
              <td class="num">${formatMoney(invoice.amount, invoice.currency)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="5" style="text-align: right;">ВСЕГО К ОПЛАТЕ:</td>
              <td class="num">${formatMoney(invoice.amount, invoice.currency)}</td>
            </tr>
          </tbody>
        </table>

        ${invoice.additionalInfo ? `
        <div class="section-title">5. ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ</div>
        <p>${invoice.additionalInfo}</p>
        ` : ""}
      </body>
      </html>
    `;
    const blob = new Blob([content], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- Функция 3: Экспорт в Excel (.csv) ---
  const handleExportExcel = () => {
    const filename = `Invoice_${invoice.invoiceNumber}.csv`;
    const rows = [
      ["Параметр", "Значение"],
      ["Номер инвойса", invoice.invoiceNumber],
      ["Дата инвойса", invoice.date],
      ["Срок оплаты", invoice.dueDate],
      ["Покупатель", invoice.clientName],
      ["Страна покупателя", buyerCountry],
      ["ИНН/VAT покупателя", buyerTaxId],
      ["Номер договора", invoice.contractNumber || ""],
      ["Условия поставки (Incoterms)", invoice.incoterms || ""],
      ["Расчетный счет", invoice.bankAccount || ""],
      ["Банк", bankName],
      ["SWIFT/БИК банка", bankCode],
      ["Наименование товара", invoice.productName || ""],
      ["Дополнительная информация", invoice.additionalInfo || ""],
      ["Сорт", invoice.grade || ""],
      ["Размер", invoice.size || ""],
      ["Объем (м3)", invoice.volumeM3],
      ["Цена за м3", invoice.pricePerM3],
      ["Итоговая сумма", invoice.amount],
      ["Валюта", invoice.currency],
    ];

    const csvContent = "\uFEFF" + rows.map((e) => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop no-print-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-wide print-preview-modal">
        <header className="modal-header no-print">
          <h2>Печать и экспорт инвойса</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </header>

        {/* Панель управления действиями */}
        <div className="print-actions-bar no-print">
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Печать / Сохранить в PDF
          </button>
          <button className="btn btn-secondary" onClick={handleExportWord}>
            📝 Экспорт в Word (.doc)
          </button>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            📊 Экспорт в Excel (.csv)
          </button>
        </div>

        {/* Официальный бланк инвойса (Точно как в варианте Б) */}
        <div className="print-document-target">
          <h1 style={{ textAlign: "center", fontSize: "24px", color: "#0f172a", marginBottom: "20px", textTransform: "uppercase", fontWeight: 800 }}>
            ИНВОЙС № {invoice.invoiceNumber}
          </h1>
          
          <p style={{ marginBottom: "20px", fontSize: "14px" }}>
            <strong>Дата инвойса:</strong> {formatDate(invoice.date)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
            <strong>Срок оплаты:</strong> {formatDate(invoice.dueDate)}
          </p>
          
          {/* 1. СТОРОНЫ */}
          <div className="doc-section-title-b">1. СТОРОНЫ</div>
          <div style={{ padding: "4px 8px", marginBottom: "15px" }}>
            <p style={{ margin: "4px 0" }}><strong>Продавец:</strong> {sellerName}</p>
            <p style={{ margin: "4px 0" }}>
              <strong>Покупатель:</strong> {invoice.clientName} {buyerCountry ? `(${buyerCountry})` : ""}<br />
              {buyerAddress && <span style={{ color: "#475569" }}>Адрес: {buyerAddress}<br /></span>}
              {buyerTaxId && <span style={{ color: "#475569" }}>ИНН/VAT: {buyerTaxId}</span>}
            </p>
          </div>

          {/* 2. ОСНОВАНИЕ И ПОСТАВКА */}
          <div className="doc-section-title-b">2. ОСНОВАНИЕ И ПОСТАВКА</div>
          <div style={{ padding: "4px 8px", marginBottom: "15px" }}>
            <p style={{ margin: "4px 0" }}><strong>Договор №:</strong> {invoice.contractNumber || "—"} {ctr?.date ? `от ${formatDate(ctr.date)}` : ""}</p>
            {ctr?.subject && <p style={{ margin: "4px 0" }}><strong>Предмет договора:</strong> {ctr.subject}</p>}
            <p style={{ margin: "4px 0" }}><strong>Условия поставки (Incoterms):</strong> <span style={{ fontWeight: 700, color: "#2563eb" }} className="no-print-color">{invoice.incoterms || "—"}</span></p>
          </div>

          {/* 3. РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ */}
          <div className="doc-section-title-b">3. РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ</div>
          <div style={{ padding: "4px 8px", marginBottom: "15px" }}>
            <p style={{ margin: "4px 0" }}><strong>Получатель:</strong> {bankOwnerName || "—"}</p>
            <p style={{ margin: "4px 0" }}><strong>Счет / IBAN:</strong> <span className="mono" style={{ fontSize: "14px", fontWeight: 700 }}>{invoice.bankAccount || "—"}</span></p>
            <p style={{ margin: "4px 0" }}><strong>Банк:</strong> {bankName || "—"} {bankCode ? `(SWIFT/БИК: ${bankCode})` : ""}</p>
            {bankAddress && <p style={{ margin: "4px 0", color: "#475569" }}><strong>Адрес банка:</strong> {bankAddress}</p>}
          </div>

          {/* 4. СПЕЦИФИКАЦИЯ ТОВАРА И СТОИМОСТЬ */}
          <div className="doc-section-title-b">4. СПЕЦИФИКАЦИЯ ТОВАРА И СТОИМОСТЬ</div>
          <table className="doc-main-table-b">
            <thead>
              <tr>
                <th>Наименование товара / Описание</th>
                <th>Сорт</th>
                <th>Размер</th>
                <th style={{ textAlign: "right" }}>Объем (м³)</th>
                <th style={{ textAlign: "right" }}>Цена / м³</th>
                <th style={{ textAlign: "right" }}>Итого ({invoice.currency})</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong style={{ color: "#0f172a" }}>{invoice.productName || "Пиломатериалы экспортные"}</strong></td>
                <td>{invoice.grade || "—"}</td>
                <td>{invoice.size || "—"}</td>
                <td style={{ textAlign: "right" }} className="mono">{invoice.volumeM3}</td>
                <td style={{ textAlign: "right" }} className="mono">{formatMoney(invoice.pricePerM3, invoice.currency)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }} className="mono">{formatMoney(invoice.amount, invoice.currency)}</td>
              </tr>
              <tr className="doc-total-row-b">
                <td colSpan={5} style={{ textAlign: "right", fontWeight: "bold" }}>ВСЕГО К ОПЛАТЕ:</td>
                <td style={{ textAlign: "right", fontSize: "16px", fontWeight: 800 }} className="mono">
                  {formatMoney(invoice.amount, invoice.currency)}
                </td>
              </tr>
            </tbody>
          </table>

          {invoice.additionalInfo && (
            <div>
              <div className="doc-section-title-b">5. ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ</div>
              <div style={{ padding: "4px 8px", marginBottom: "15px" }}>
                <p style={{ margin: "4px 0" }}>{invoice.additionalInfo}</p>
              </div>
            </div>
          )}

          {/* Подписи */}
          <div className="doc-signatures" style={{ marginTop: "50px" }}>
            <div className="doc-sig-box">
              <div className="sig-line"></div>
              <div>Продавец (От имени)</div>
            </div>
            <div className="doc-sig-box">
              <div className="sig-line"></div>
              <div>Покупатель (От имени)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
