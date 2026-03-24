import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { useLanguage } from './LanguageContext';

// Базовые курсы валют (относительно USD), если нет интернета
const FALLBACK_RATES = {
  USD: 1,
  RUB: 92.5,
  EUR: 0.92,
  BYN: 3.25,
  KZT: 450,
  UAH: 39
};

const Analytics = ({ subscriptions }) => {
  const [period, setPeriod] = useState('month'); // 'month' or 'year'
  const { t, currency } = useLanguage();
  const [rates, setRates] = useState(FALLBACK_RATES);

  useEffect(() => {
    const fetchRates = async () => {
      const CACHE_KEY = 'exchange_rates_cache';
      const CACHE_TIME_KEY = 'exchange_rates_timestamp';
      const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 часов в миллисекундах
      
      const cachedRates = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      const now = Date.now();

      // Если есть кэш и прошло менее 12 часов, используем его
      if (cachedRates && cachedTime && (now - parseInt(cachedTime, 10) < CACHE_DURATION)) {
        setRates(JSON.parse(cachedRates));
        return;
      }

      try {
        // Иначе запрашиваем свежие курсы (база - USD)
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();

        if (data && data.rates) {
          const newRates = { ...FALLBACK_RATES, ...data.rates };
          setRates(newRates);
          localStorage.setItem(CACHE_KEY, JSON.stringify(newRates));
          localStorage.setItem(CACHE_TIME_KEY, now.toString());
        }
      } catch (err) {
        console.error('Не удалось загрузить курсы валют:', err);
        // В случае ошибки (нет интернета) пробуем использовать старый (пусть и просроченный) кэш
        if (cachedRates) {
          setRates(JSON.parse(cachedRates));
        }
      }
    };

    fetchRates();
  }, []);

  // Фильтруем только активные подписки
  const activeSubs = subscriptions.filter(sub => sub.status === 'Active');

  const calculateTotal = () => {
    return activeSubs.reduce((total, sub) => {
      let monthlyCost = 0;
      const cost = parseFloat(sub.cost) || 0;
      
      // Нормализация к месяцу
      if (sub.periodUnit === 'month') {
        monthlyCost = cost / sub.periodQty;
      } else if (sub.periodUnit === 'year') {
        monthlyCost = cost / (sub.periodQty * 12);
      } else if (sub.periodUnit === 'week') {
        monthlyCost = (cost / sub.periodQty) * 4.33; // В месяце примерно 4.33 недели
      } else if (sub.periodUnit === 'day') {
        monthlyCost = (cost / sub.periodQty) * 30;
      }

      // Конвертация валют
      const subCurrency = sub.currency || 'RUB';
      const rateSub = rates[subCurrency] || 1;
      const rateMain = rates[currency] || 1;
      
      // Переводим стоимость подписки в базу (USD), а затем в целевую валюту
      const convertedCost = (monthlyCost / rateSub) * rateMain;

      return total + convertedCost;
    }, 0);
  };

  const total = calculateTotal();
  const displayTotal = period === 'month' ? total : total * 12;

  const currencySymbols = { RUB: '₽', USD: '$', EUR: '€', BYN: 'Br', KZT: '₸', UAH: '₴' };
  const symbol = currencySymbols[currency] || currency;

  return (
    <div className="bg-blue-600 dark:bg-blue-800 text-white p-6 rounded-2xl shadow-lg mb-6 transition-colors duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-blue-100 text-sm font-medium uppercase tracking-wide">
            {period === 'month' ? t.monthlyExpense : t.yearlyExpense}
          </h2>
          <div className="text-4xl font-bold mt-2">
            {displayTotal.toFixed(0)} {symbol}
          </div>
          <p className="text-blue-200 text-sm mt-1">
            {t.activeSubs}: {activeSubs.length}
          </p>
        </div>
        <button 
          onClick={() => setPeriod(period === 'month' ? 'year' : 'month')}
          className="bg-blue-500 dark:bg-blue-700 p-2 rounded-lg hover:bg-blue-400 dark:hover:bg-blue-600 transition"
          title="Переключить период"
        >
          <Calculator size={24} />
        </button>
      </div>
    </div>
  );
};

export default Analytics;