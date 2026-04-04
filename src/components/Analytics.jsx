import React, { useState } from 'react';
import { Calculator, DollarSign, Euro } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const Analytics = ({ subscriptions, displayCurrency, setDisplayCurrency }) => {
  const [period, setPeriod] = useState('month'); // 'month' or 'year'
  const { t, currency: mainCurrency, rates } = useLanguage();

  // Фильтруем только активные подписки
  const activeSubs = subscriptions.filter(sub => sub.status === 'Active');

  const calculateTotal = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return activeSubs.reduce((total, sub) => {
      const cost = parseFloat(sub.cost) || 0;
      
      // Конвертация валют
      const subCurrency = sub.currency || 'RUB';
      const rateSub = rates[subCurrency] || 1;
      const rateDisplay = rates[displayCurrency] || 1;
      
      const convertedCost = (cost / rateSub) * rateDisplay;

      let paymentCount = 0;

      try {
        if (!sub.startDate) return total;
        
        // Создаем дату безопасно (на случай если startDate = YYYY-MM-DD, чтобы избежать смещения таймзоны)
        let start;
        if (sub.startDate.includes('-')) {
          const [y, m, d] = sub.startDate.split('-');
          start = new Date(y, m - 1, d);
        } else {
          start = new Date(sub.startDate);
        }
        
        if (isNaN(start.getTime())) return total;

        let next = new Date(start);
        const qty = Math.max(1, parseInt(sub.periodQty) || 1);
        let safetyCounter = 0;

        // Определяем границу: конец текущего месяца или конец текущего года
        const endOfPeriod = period === 'month' 
          ? new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
          : new Date(currentYear, 11, 31, 23, 59, 59);

        // Математически "прогоняем" платежи от старта до конца периода
        while (next <= endOfPeriod && safetyCounter < 100000) {
          const isMatch = period === 'month'
            ? next.getMonth() === currentMonth && next.getFullYear() === currentYear
            : next.getFullYear() === currentYear;

          if (isMatch) {
            paymentCount++;
          }

          if (sub.periodUnit === 'month') next.setMonth(next.getMonth() + qty);
          else if (sub.periodUnit === 'year') next.setFullYear(next.getFullYear() + qty);
          else if (sub.periodUnit === 'week') next.setDate(next.getDate() + (qty * 7));
          else next.setDate(next.getDate() + qty);
          
          safetyCounter++;
        }
      } catch (e) {
        console.error(e);
      }

      return total + (convertedCost * paymentCount);
    }, 0);
  };

  const displayTotal = calculateTotal();

  const currencySymbols = { RUB: '₽', USD: '$', EUR: '€', BYN: 'Br', KZT: '₸', UAH: '₴', TRY: '₺' };
  const symbol = currencySymbols[displayCurrency] || displayCurrency;

  const handleCurrencySwitch = () => {
    if (displayCurrency === mainCurrency) {
      setDisplayCurrency('USD');
    } else if (displayCurrency === 'USD') {
      setDisplayCurrency('EUR');
    } else {
      setDisplayCurrency(mainCurrency);
    }
  };

  const getNextCurrencyIcon = () => {
    const mainCurrencySymbol = currencySymbols[mainCurrency] || mainCurrency[0];

    if (displayCurrency === mainCurrency) {
      return <DollarSign size={24} />;
    }
    if (displayCurrency === 'USD') {
      return <Euro size={24} />;
    }
    return <span className="font-bold text-2xl leading-none flex items-center justify-center h-full">{mainCurrencySymbol}</span>;
  };

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
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCurrencySwitch}
            className="bg-blue-500 dark:bg-blue-700 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-blue-400 dark:hover:bg-blue-600 transition"
            title="Сменить валюту"
          >
            {getNextCurrencyIcon()}
          </button>
          <button 
            onClick={() => setPeriod(period === 'month' ? 'year' : 'month')}
            className="bg-blue-500 dark:bg-blue-700 p-2 rounded-lg hover:bg-blue-400 dark:hover:bg-blue-600 transition"
            title="Переключить период"
          >
            <Calculator size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;