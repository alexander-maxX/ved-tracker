import type { InvoiceStatus } from "../types";

const labels: Record<InvoiceStatus, string> = {
  draft: "Черновик",
  sent: "Отправлен",
  paid: "Оплачен",
  overdue: "Просрочен",
  cancelled: "Отменён",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>;
}
