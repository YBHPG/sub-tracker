import React, { useState } from 'react';
import { Calculator, DollarSign, Euro } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const Analytics = ({ subscriptions, displayCurrency, setDisplayCurrency }) => {
  const [period, setPeriod] = useState('month'); // 'month' or 'year'
  const { t, currency: mainCurrency, rates } = useLanguage();

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
      const rateDisplay = rates[displayCurrency] || 1;
      
      // Переводим стоимость подписки в базу (USD), а затем в целевую валюту
      const convertedCost = (monthlyCost / rateSub) * rateDisplay;

      return total + convertedCost;
    }, 0);
  };

  const total = calculateTotal();
  const displayTotal = period === 'month' ? total : total * 12;

  const currencySymbols = { RUB: '₽', USD: '$', EUR: '€', BYN: 'Br', KZT: '₸', UAH: '₴' };
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