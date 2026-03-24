import React from 'react';
import { Edit2, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const SubscriptionCard = ({ sub, onEdit, onDelete, onToggleStatus }) => {
  const isPaused = sub.status === 'Paused';
  const { t, language } = useLanguage();

  // Безопасный расчет следующего платежа
  const getNextPaymentDate = () => {
    try {
      if (!sub.startDate) return t.notSet;
      
      const start = new Date(sub.startDate);
      // Если дата некорректная
      if (isNaN(start.getTime())) return t.dateError;

      const now = new Date();
      let next = new Date(start);
      
      // ЗАЩИТА: Если количество периодов меньше 1 или не число, считаем как 1
      const qty = Math.max(1, parseInt(sub.periodQty) || 1);
      
      // Страховка от зависания: ограничим цикл (например, не больше 1000 итераций)
      let safetyCounter = 0;
      
      while (next < now && safetyCounter < 1000) {
        if (sub.periodUnit === 'month') next.setMonth(next.getMonth() + qty);
        else if (sub.periodUnit === 'year') next.setFullYear(next.getFullYear() + qty);
        else if (sub.periodUnit === 'week') next.setDate(next.getDate() + (qty * 7));
        else next.setDate(next.getDate() + qty);
        
        safetyCounter++;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextPaymentDate = new Date(next);
      nextPaymentDate.setHours(0, 0, 0, 0);
      
      const diffTime = nextPaymentDate - today;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let daysString = "";
      if (daysLeft === 0) daysString = t.today;
      else if (daysLeft === 1) daysString = t.tomorrow;
      else if (daysLeft > 1) daysString = t.inDays(daysLeft);

      return `${next.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}${daysString}`;
    } catch (e) {
      console.error(e);
      return t.error;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-3 flex items-center justify-between transition-colors duration-300 ${isPaused ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors duration-300">
           {sub.logo ? <img src={sub.logo} alt={sub.name} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-gray-400">{sub.name ? sub.name[0] : '?'}</span>}
        </div>
        
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center flex-wrap gap-2">
            <span>{sub.name || t.unnamed}</span>
            {sub.planName && (
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {sub.planName}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sub.cost} {sub.currency} / {sub.periodQty > 1 ? sub.periodQty : ''} {
              sub.periodUnit === 'month' ? t.mo :
              sub.periodUnit === 'year' ? t.yr :
              sub.periodUnit === 'week' ? t.wk : t.d
            }
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
             {t.nextPayment}: {getNextPaymentDate()}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onToggleStatus(sub.id)} 
          className={`p-2 rounded-full transition-colors duration-300 ${isPaused ? 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/30' : 'text-orange-400 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30'}`}
          title={isPaused ? t.resume : t.pause}
        >
          {isPaused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
        </button>
        
        <button onClick={() => onEdit(sub)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-700 rounded-full transition-colors duration-300">
          <Edit2 size={18} />
        </button>
        
        <button onClick={() => onDelete(sub.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700 rounded-full transition-colors duration-300">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;