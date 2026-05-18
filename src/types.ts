export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";

export type Currency = "USD" | "EUR" | "BYN" | "RUB";

// ===== Пользователь =====
export interface User {
  id: string;
  email: string;
  passwordHash: string; // Хранить только хеш пароля
  name: string;         // Имя пользователя / компании
  phone: string;        // Телефон
  address: string;      // Адрес
  inn: string;          // ИНН организации
  bankName: string;     // Название банка
  bankAccount: string;  // Основной расчетный счет
  bankSwift: string;    // SWIFT/БИК банка
  bankAddress: string;  // Адрес банка
  createdAt: number;
  lastLogin: number;
}

// ===== Контрагенты =====
export interface Counterparty {
  id: string;
  userId: string;       // Привязка к пользователю
  name: string;
  country: string;
  address: string;
  taxId: string;
  regNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: number;
}

// ===== Договоры =====
export interface Contract {
  id: string;
  userId: string;
  contractNumber: string;
  date: string;
  expiryDate: string;
  counterpartyId: string;
  currency: Currency;
  subject: string;
  notes: string;
  createdAt: number;
}

// ===== Банковские счета =====
export interface BankAccount {
  id: string;
  userId: string;
  label: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  bankAddress: string;
  corrAccount: string;
  currency: Currency;
  ownerName: string;
  notes: string;
  createdAt: number;
}

// ===== Инвойс =====
export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientName: string;
  date: string;
  dueDate: string;
  amount: number;
  currency: Currency;
  status: InvoiceStatus;
  productName: string;        // Наименование товара
  additionalInfo?: string;    // Дополнительная информация (пункт 5 на бланке)
  createdAt: number;
  bankAccount: string;
  pricePerM3: number;
  volumeM3: number;
  incoterms: string;
  grade: string;
  size: string;
  counterpartyId: string;
  bankAccountId: string;
  contractId: string;
  contractNumber: string;
  buyerCountry?: string;
  buyerAddress?: string;
  buyerTaxId?: string;
  sellerName?: string;
  sellerAddress?: string;
  sellerTaxId?: string;
  bankName?: string;
  bankCode?: string;
  bankAddress?: string;
  bankOwnerName?: string;
}
