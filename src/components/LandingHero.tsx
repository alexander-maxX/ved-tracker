interface Props {
  onLogin: () => void;
  onCreateInvoice: () => void;
  invoiceCount: number;
}

export function LandingHero({ onLogin, onCreateInvoice, invoiceCount }: Props) {
  return (
    <div className="landing-hero">
      <div className="landing-container">
        {/* Hero Section */}
        <section className="hero-main">
          <h1 className="hero-title">
            Профессиональный учёт <span className="hero-accent">ВЭД-инвойсов</span>
          </h1>
          <p className="hero-subtitle">
            Создавайте экспортные инвойсы, управляйте договорами и контрагентами.
            Печать, экспорт в Word/Excel — всё работает прямо в браузере, без сервера.
          </p>
          
          <div className="hero-actions">
            <button className="btn btn-primary btn-hero" onClick={onCreateInvoice}>
              <span>＋</span> Создать первый инвойс
            </button>
            <button className="btn btn-secondary btn-hero" onClick={onLogin}>
              Войти / Сохранить данные
            </button>
          </div>

          <div className="hero-trust">
            <div className="trust-item">
              <span className="trust-icon">🔒</span>
              <span>Данные хранятся только у вас</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">⚡</span>
              <span>Работает мгновенно</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🇷🇺</span>
              <span>Полностью на русском</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Инвойсы</h3>
            <p>Создание коммерческих инвойсов с авторасчётом суммы по объёму и цене за м³. Поддержка USD, EUR, RUB, BYN.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📜</div>
            <h3>Договоры</h3>
            <p>Ведение реестра экспортных контрактов. Привязка инвойсов к договорам, контроль сроков действия.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>Контрагенты</h3>
            <p>База покупателей с реквизитами, контактами и историей сделок. Автоподстановка данных в инвойсы.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🏦</div>
            <h3>Банковские счета</h3>
            <p>Хранение реквизитов для оплаты в разных валютах. Быстрый выбор счёта при создании инвойса.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🖨️</div>
            <h3>Печать и экспорт</h3>
            <p>Профессиональный бланк инвойса для печати в PDF. Экспорт в Word (.doc) и Excel (.csv) в один клик.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Аналитика</h3>
            <p>Дашборд с выручкой, ожидаемыми платежами и просрочками. Фильтры по статусам и валютам.</p>
          </div>
        </section>

        {/* How it works */}
        <section className="how-it-works">
          <h2>Как это работает</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Создайте инвойс</h4>
                <p>Заполните данные покупателя, товар, объём и цену — сумма рассчитается автоматически</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Распечатайте или отправьте</h4>
                <p>Экспортируйте в PDF для печати, в Word для редактирования или в Excel для учёта</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Сохраните данные</h4>
                <p>Зарегистрируйтесь, чтобы хранить контрагентов, договоры и историю инвойсов</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA for guest with existing invoices */}
        {invoiceCount > 0 && (
          <section className="guest-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>У вас {invoiceCount} {invoiceCount === 1 ? 'инвойс' : invoiceCount < 5 ? 'инвойса' : 'инвойсов'} в гостевом режиме</h4>
              <p>Зарегистрируйтесь сейчас, чтобы сохранить все данные и получить доступ к контрагентам и договорам</p>
            </div>
            <button className="btn btn-primary" onClick={onLogin}>
              Сохранить данные
            </button>
          </section>
        )}

        {/* For whom */}
        <section className="for-whom">
          <h2>Для кого</h2>
          <div className="audience">
            <div className="audience-item">🌲 Экспортёры пиломатериалов</div>
            <div className="audience-item">📦 ВЭД-менеджеры</div>
            <div className="audience-item">🏭 Производственные компании</div>
            <div className="audience-item">🚢 Логистические операторы</div>
          </div>
        </section>
      </div>
    </div>
  );
}
