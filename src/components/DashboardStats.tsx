import { useMemo } from "react";
import type { Invoice } from "../types";
import { formatMoney } from "../utils/format";

export function DashboardStats({ invoices }: { invoices: Invoice[] }) {
  const stats = useMemo(() => {
    const totals = { paid: 0, pending: 0, overdue: 0 };
    const counts = { paid: 0, pending: 0, overdue: 0 };

    const perCurrency = {
      paid: { USD: 0, EUR: 0, BYN: 0, RUB: 0 },
      pending: { USD: 0, EUR: 0, BYN: 0, RUB: 0 },
      overdue: { USD: 0, EUR: 0, BYN: 0, RUB: 0 },
    } as Record<"paid" | "pending" | "overdue", Record<string, number>>;

    for (const inv of invoices) {
      if (inv.status === "paid") {
        totals.paid += inv.amount;
        counts.paid += 1;
        perCurrency.paid[inv.currency] = (perCurrency.paid[inv.currency] || 0) + inv.amount;
      } else if (inv.status === "sent" || inv.status === "draft") {
        totals.pending += inv.amount;
        counts.pending += 1;
        perCurrency.pending[inv.currency] = (perCurrency.pending[inv.currency] || 0) + inv.amount;
      } else if (inv.status === "overdue") {
        totals.overdue += inv.amount;
        counts.overdue += 1;
        perCurrency.overdue[inv.currency] = (perCurrency.overdue[inv.currency] || 0) + inv.amount;
      }
    }
    return { totals, counts, perCurrency };
  }, [invoices]);

  const renderBreakdown = (key: "paid" | "pending" | "overdue") => {
    const map = stats.perCurrency[key];
    const entries = (Object.entries(map) as [
      "USD" | "EUR" | "BYN" | "RUB",
      number
    ][]).filter(([, v]) => v > 0);
    if (entries.length === 0) return <span className="kpi-empty">Нет данных</span>;
    return entries.map(([cur, v]) => (
      <span key={cur} className="kpi-amount">
        {formatMoney(v, cur)}
      </span>
    ));
  };

  const pluralize = (n: number, forms: [string, string, string]) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
    return forms[2];
  };

  return (
    <section className="dashboard-stats">
      <div className="kpi-card kpi-revenue">
        <div className="kpi-header">
          <span className="kpi-label">Выручка</span>
          <span className="kpi-icon" aria-hidden>💰</span>
        </div>
        <div className="kpi-values">{renderBreakdown("paid")}</div>
        <div className="kpi-meta">
          {stats.counts.paid}{" "}
          {pluralize(stats.counts.paid, [
            "оплаченный инвойс",
            "оплаченных инвойса",
            "оплаченных инвойсов",
          ])}
        </div>
      </div>

      <div className="kpi-card kpi-pending">
        <div className="kpi-header">
          <span className="kpi-label">Ожидает оплаты</span>
          <span className="kpi-icon" aria-hidden>⏳</span>
        </div>
        <div className="kpi-values">{renderBreakdown("pending")}</div>
        <div className="kpi-meta">
          {stats.counts.pending}{" "}
          {pluralize(stats.counts.pending, [
            "инвойс ожидает оплаты",
            "инвойса ожидают оплаты",
            "инвойсов ожидают оплаты",
          ])}
        </div>
      </div>

      <div className="kpi-card kpi-overdue">
        <div className="kpi-header">
          <span className="kpi-label">Просрочено</span>
          <span className="kpi-icon" aria-hidden>⚠️</span>
        </div>
        <div className="kpi-values">{renderBreakdown("overdue")}</div>
        <div className="kpi-meta">
          {stats.counts.overdue}{" "}
          {pluralize(stats.counts.overdue, [
            "требует внимания",
            "требуют внимания",
            "требуют внимания",
          ])}
        </div>
      </div>
    </section>
  );
}
