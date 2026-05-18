import { useState } from "react";
import type { User } from "../types";

interface Props {
  user: User;
  onUpdate: (user: User) => void;
  onLogout: () => void;
  syncStatus: "idle" | "syncing" | "synced" | "error";
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  inn: string;
  bankName: string;
  bankAccount: string;
  bankSwift: string;
  bankAddress: string;
};

export function UserProfile({ user, onUpdate, onLogout, syncStatus }: Props) {
  const [form, setForm] = useState<FormState>({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    inn: user.inn,
    bankName: user.bankName,
    bankAccount: user.bankAccount,
    bankSwift: user.bankSwift,
    bankAddress: user.bankAddress,
  });
  const [saved, setSaved] = useState(false);

  const update = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = () => {
    const updated: User = { ...user, ...form };
    onUpdate(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p className="profile-email">{user.email}</p>
          <p className="profile-meta">
            Регистрация: {new Date(user.createdAt).toLocaleDateString("ru-RU")}
            {" • "}Последний вход: {new Date(user.lastLogin).toLocaleString("ru-RU")}
          </p>
        </div>
        <button className="btn btn-danger" onClick={onLogout}>Выйти</button>
      </div>

      <div className="profile-card sync-card">
        <h3>☁️ Облачная синхронизация</h3>
        <p className="sync-description">
          Данные аккаунта автоматически сохраняются в облаке. Чтобы войти с другого устройства,
          используйте тот же email и пароль — код синхронизации больше не нужен.
        </p>
        <div className="sync-status-row">
          <span className="sync-status-label">Статус:</span>
          <span className={`sync-status-badge sync-${syncStatus}`}>
            {syncStatus === "syncing" && "⏳ Синхронизация..."}
            {syncStatus === "synced" && "✓ Синхронизировано"}
            {syncStatus === "error" && "⚠ Ошибка синхронизации"}
            {syncStatus === "idle" && "● Готово"}
          </span>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <h3>👤 Личные данные</h3>
          <div className="profile-form">
            <label className="field">
              <span>Название компании / Имя</span>
              <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </label>
            <label className="field">
              <span>Телефон</span>
              <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </label>
            <label className="field">
              <span>Адрес</span>
              <input className="input" value={form.address} onChange={(e) => update("address", e.target.value)} />
            </label>
            <label className="field">
              <span>ИНН организации</span>
              <input className="input" value={form.inn} onChange={(e) => update("inn", e.target.value)} />
            </label>
          </div>
        </div>

        <div className="profile-card">
          <h3>🏦 Банковские реквизиты</h3>
          <div className="profile-form">
            <label className="field">
              <span>Название банка</span>
              <input className="input" value={form.bankName} onChange={(e) => update("bankName", e.target.value)} />
            </label>
            <label className="field">
              <span>Расчетный счет / IBAN</span>
              <input className="input" value={form.bankAccount} onChange={(e) => update("bankAccount", e.target.value)} />
            </label>
            <label className="field">
              <span>SWIFT / БИК</span>
              <input className="input" value={form.bankSwift} onChange={(e) => update("bankSwift", e.target.value)} />
            </label>
            <label className="field">
              <span>Адрес банка</span>
              <input className="input" value={form.bankAddress} onChange={(e) => update("bankAddress", e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? "✓ Сохранено!" : "Сохранить изменения"}
        </button>
      </div>
    </section>
  );
}
