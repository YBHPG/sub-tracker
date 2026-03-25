import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
en: {
    searchPlaceholder: "Search popular subscriptions...",
    addCustom: "Add custom subscription",
    createManually: "Create manually",
    unnamed: "Unnamed",
    notSet: "Not set",
    dateError: "Date error",
    error: "Error",
    resume: "Resume",
    pause: "Pause",
    nextPayment: "Next payment",
    mo: "mo",
    yr: "yr",
    wk: "wk",
    d: "d",
    today: ", today",
    tomorrow: ", tomorrow",
    inDays: (d) => `, in ${d} day${d !== 1 ? 's' : ''}`,
    settings: "Settings",
    dataTransfer: "Data transfer",
    export: "Export",
    import: "Import",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    language: "Language",
    importSuccess: "Data successfully restored!",
    importFormatError: "Error: Invalid file format.",
    importReadError: "Error reading file.",
    monthlyExpense: "Monthly expense",
    yearlyExpense: "Yearly expense",
    activeSubs: "Active subscriptions",
    editSub: "Edit subscription",
    newSub: "New subscription",
    uploadIcon: "Upload icon",
    nameLabel: "Name",
    namePlaceholder: "e.g. Netflix",
    costLabel: "Cost",
    currencyLabel: "Currency",
    billingEvery: "Billing every",
    days: "Days",
    weeks: "Weeks",
    months: "Months",
    years: "Years",
    firstPayment: "First payment",
    saveBtn: "Save",
    reqField: "This field is required",
    costError: "Cost must be greater than 0",
    mySubs: "My subscriptions",
    list: "List",
    noActiveSubs: "No active subscriptions",
    clickPlus: "Click + to add",
    deleteConfirm: "Are you sure you want to delete this subscription?",
    selectPopular: "Select popular subscription",
    tariffPlan: "Tariff plan",
    customPlan: "Custom / Manual",
    mainCurrency: "Main Currency",
    notifTitle: "Upcoming payment",
    notifBody1: "Payment due tomorrow:",
    notifBody2: "Check your balance!",
    sortDate: "By date",
    sortName: "Alphabetical",
    sortPrice: "By price",
    corsError: "Failed to load image from link (CORS block or invalid URL)",
    categories: {
        "All": "All",
        "Entertainment": "Entertainment",
        "E-commerce": "E-commerce",
        "Food & Delivery": "Food & Delivery",
        "Lifestyle & Beauty": "Lifestyle & Beauty",
        "Health & Fitness": "Health & Fitness",
        "Gaming": "Gaming",
        "Social": "Social",
        "Software": "Software",
        "Music": "Music",
        "Pets": "Pets",
        "Education & Books": "Education & Books",
        "Fashion": "Fashion",
        "News & Media": "News & Media",
        "Transport & Auto": "Transport & Auto",
        "Utilities & Services": "Utilities & Services",
        "Finance": "Finance",
        "Telecom": "Telecom"
    }
},
ru: {
    searchPlaceholder: "Поиск популярных подписок...",
    addCustom: "Добавить свою подписку",
    createManually: "Создать вручную",
    unnamed: "Без названия",
    notSet: "Не указана",
    dateError: "Ошибка даты",
    error: "Ошибка",
    resume: "Возобновить",
    pause: "Приостановить",
    nextPayment: "След. оплата",
    mo: "мес",
    yr: "год",
    wk: "нед",
    d: "дн",
    today: ", сегодня",
    tomorrow: ", завтра",
    inDays: (d) => {
        const lastDigit = d % 10;
        const lastTwo = d % 100;
        if (lastTwo >= 11 && lastTwo <= 19) return `, через ${d} дней`;
        if (lastDigit === 1) return `, через ${d} день`;
        if (lastDigit >= 2 && lastDigit <= 4) return `, через ${d} дня`;
        return `, через ${d} дней`;
    },
    settings: "Настройки",
    dataTransfer: "Перенос данных",
    export: "Экспорт",
    import: "Импорт",
    theme: "Тема интерфейса",
    light: "Светлая",
    dark: "Тёмная",
    system: "Системная",
    language: "Язык",
    importSuccess: "Данные успешно восстановлены!",
    importFormatError: "Ошибка: Неверный формат файла.",
    importReadError: "Ошибка при чтении файла.",
    monthlyExpense: "Расход в месяц",
    yearlyExpense: "Расход в год",
    activeSubs: "Активных подписок",
    editSub: "Редактировать",
    newSub: "Новая подписка",
    uploadIcon: "Загрузить иконку",
    nameLabel: "Название",
    namePlaceholder: "Например, Netflix",
    costLabel: "Стоимость",
    currencyLabel: "Валюта",
    billingEvery: "Списание каждые",
    days: "Дней",
    weeks: "Недель",
    months: "Месяцев",
    years: "Лет",
    firstPayment: "Первое списание",
    saveBtn: "Сохранить",
    reqField: "Поле обязательно для заполнения",
    costError: "Стоимость должна быть больше 0",
    mySubs: "Мои подписки",
    list: "Список",
    noActiveSubs: "Нет активных подписок",
    clickPlus: "Нажмите +, чтобы добавить",
    deleteConfirm: "Вы уверены, что хотите удалить эту подписку?",
    selectPopular: "Выбрать популярную подписку",
    tariffPlan: "Тариф",
    customPlan: "Свой / Вручную",
    mainCurrency: "Основная валюта",
    notifTitle: "Скоро оплата",
    notifBody1: "Завтра списание:",
    notifBody2: "Проверьте баланс!",
    sortDate: "По дате",
    sortName: "По алфавиту",
    sortPrice: "По стоимости",
    corsError: "Не удалось загрузить картинку по ссылке (блокировка CORS или неверная ссылка)",
    categories: {
        "All": "Все",
        "Entertainment": "Развлечения",
        "E-commerce": "Маркетплейсы",
        "Food & Delivery": "Еда и доставка",
        "Lifestyle & Beauty": "Красота и стиль",
        "Health & Fitness": "Здоровье и спорт",
        "Gaming": "Игры",
        "Social": "Соцсети",
        "Software": "Софт",
        "Music": "Музыка",
        "Pets": "Питомцы",
        "Education & Books": "Образование и книги",
        "Fashion": "Мода",
        "News & Media": "Новости и медиа",
        "Transport & Auto": "Транспорт и авто",
        "Utilities & Services": "Услуги и сервисы",
        "Finance": "Финансы",
        "Telecom": "Связь"
    }
  }
};

// Базовые курсы валют (относительно USD), если нет интернета
const FALLBACK_RATES = {
  USD: 1,
  RUB: 92.5,
  EUR: 0.92,
  BYN: 3.25,
  KZT: 450,
  UAH: 39
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('appLanguage');
        if (saved) return saved;
        // Автоматическое определение языка (если начинается с 'ru' - русский, иначе 'en')
        return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
    });

    const [currency, setCurrency] = useState(() => {
        const saved = localStorage.getItem('appCurrency');
        if (saved) return saved;
        // Основа для региональных цен (по умолчанию RUB для РФ, USD для остальных)
        return navigator.language.toLowerCase().startsWith('ru') ? 'RUB' : 'USD';
    });

    const [rates, setRates] = useState(() => {
        const cachedRates = localStorage.getItem('exchange_rates_cache');
        if (cachedRates) {
            try {
                return JSON.parse(cachedRates);
            } catch (e) {
                console.error("Ошибка парсинга кэша валют:", e);
                return FALLBACK_RATES;
            }
        }
        return FALLBACK_RATES;
    });

    useEffect(() => {
        localStorage.setItem('appLanguage', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('appCurrency', currency);
    }, [currency]);

    useEffect(() => {
      const fetchRates = async () => {
        const CACHE_KEY = 'exchange_rates_cache';
        const CACHE_TIME_KEY = 'exchange_rates_timestamp';
        const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 часов в миллисекундах

        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        // Не запрашиваем, если кэш свежий
        if (cachedTime && (now - parseInt(cachedTime, 10) < CACHE_DURATION)) {
          return;
        }

        try {
          // Запрашиваем свежие курсы (база - USD)
          const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          const data = await res.json();

          if (data && data.rates) {
            // Объединяем с текущими, чтобы не потерять валюты, если API их не вернет
            const newRates = { ...rates, ...data.rates };
            setRates(newRates);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newRates));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
          }
        } catch (err) {
          console.error('Не удалось загрузить курсы валют:', err);
          // В случае ошибки остаемся на старых данных из кэша (или на FALLBACK_RATES)
        }
      };
  
      fetchRates();
    }, []);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currency, setCurrency, rates }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);