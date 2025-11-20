import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

const Analytics = ({ subscriptions }) => {
  const [period, setPeriod] = useState('month'); // 'month' or 'year'

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

      return total + monthlyCost;
    }, 0);
  };

  const total = calculateTotal();
  const displayTotal = period === 'month' ? total : total * 12;

  return (
    <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-blue-100 text-sm font-medium uppercase tracking-wide">
            {period === 'month' ? 'Расход в месяц' : 'Расход в год'}
          </h2>
          <div className="text-4xl font-bold mt-2">
            {displayTotal.toFixed(0)} ₽
          </div>
          <p className="text-blue-200 text-sm mt-1">
            Активных подписок: {activeSubs.length}
          </p>
        </div>
        <button 
          onClick={() => setPeriod(period === 'month' ? 'year' : 'month')}
          className="bg-blue-500 p-2 rounded-lg hover:bg-blue-400 transition"
          title="Переключить период"
        >
          <Calculator size={24} />
        </button>
      </div>
    </div>
  );
};

export default Analytics;