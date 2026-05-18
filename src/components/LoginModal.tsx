import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../supabase";
import { syncAllDataFromCloud, syncAllDataToCloud } from "../services/supabaseService";
import type { User } from "../types";

interface Props {
  onLogin: (user: User) => void;
  onClose?: () => void;
}

type Mode = "login" | "register";

export function LoginModal({ onLogin, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!isSupabaseConfigured || !supabase) {
      setError("База данных не настроена. Следуйте инструкции SUPABASE_SETUP_RU.md.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Введите email и пароль");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) {
          setError("Введите имя / название компании");
          return;
        }
        if (password.length < 6) {
          setError("Пароль должен быть не менее 6 символов");
          return;
        }
        if (password !== confirmPassword) {
          setError("Пароли не совпадают");
          return;
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password,
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("Не удалось создать пользователя");

        const user: User = {
          id: authData.user.id,
          email: authData.user.email || email.toLowerCase().trim(),
          passwordHash: "",
          name: name.trim(),
          phone: phone.trim(),
          address: "",
          inn: "",
          bankName: "",
          bankAccount: "",
          bankSwift: "",
          bankAddress: "",
          createdAt: Date.now(),
          lastLogin: Date.now(),
        };

        await syncAllDataToCloud(user.id, {
          profile: user,
          invoices: [],
          counterparties: [],
          contracts: [],
          bankAccounts: []
        });

        onLogin(user);
      } else {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });

        if (signInError) throw signInError;
        if (!authData.user) throw new Error("Пользователь не найден");

        const cloudData = await syncAllDataFromCloud(authData.user.id);
        
        let profile: User;
        if (!cloudData || !cloudData.profile) {
          profile = {
            id: authData.user.id,
            email: authData.user.email || email.toLowerCase().trim(),
            passwordHash: "",
            name: authData.user.email?.split("@")[0] || "Пользователь",
            phone: "",
            address: "",
            inn: "",
            bankName: "",
            bankAccount: "",
            bankSwift: "",
            bankAddress: "",
            createdAt: Date.now(),
            lastLogin: Date.now(),
          };
        } else {
          profile = cloudData.profile;
        }

        profile.lastLogin = Date.now();
        onLogin(profile);
      }
    } catch (err: any) {
      if (err.message?.includes("already registered") || err.code === "user_already_exists") {
        setError("Этот email уже зарегистрирован");
      } else if (
        err.message?.includes("Invalid login") || 
        err.message?.includes("credentials")
      ) {
        setError("Неверный email или пароль");
      } else if (err.message?.includes("Password should be")) {
        setError("Слишком слабый пароль");
      } else {
        setError("Ошибка связи с базой данных. Проверьте настройки.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 1000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal modal-auth" role="dialog" aria-modal="true">
        {onClose && (
          <button className="btn-icon auth-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        )}

        <div className="auth-header">
          <div className="auth-logo">📊</div>
          <h2>Учёт ВЭД-инвойсов</h2>
          <p className="auth-subtitle">
            {mode === "login" ? "Вход в личный кабинет" : "Регистрация нового аккаунта"}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          {mode === "register" && (
            <label className="field">
              <span>Название компании / Имя *</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ООО «ВашаКомпания»"
              />
            </label>
          )}

          <label className="field">
            <span>Email *</span>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
            />
          </label>

          <label className="field">
            <span>Пароль *</span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {mode === "register" && (
            <label className="field">
              <span>Подтвердите пароль *</span>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
          )}

          {mode === "register" && (
            <label className="field">
              <span>Телефон</span>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 999 000-00-00"
              />
            </label>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <div className="auth-footer">
          {mode === "login" ? (
            <p>
              Нет аккаунта?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Зарегистрироваться
              </button>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Войти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
