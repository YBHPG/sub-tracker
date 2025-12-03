import React from 'react';
import { Edit2, Trash2, PauseCircle, PlayCircle } from 'lucide-react';

const SubscriptionCard = ({ sub, onEdit, onDelete, onToggleStatus }) => {
  const isPaused = sub.status === 'Paused';

  // Безопасный расчет следующего платежа
  const getNextPaymentDate = () => {
    try {
      if (!sub.startDate) return 'Не указана';
      
      const start = new Date(sub.startDate);
      // Если дата некорректная
      if (isNaN(start.getTime())) return 'Ошибка даты';

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

      // Если цикл крутился слишком долго (например, дата 1900 года), просто вернем что есть
      return next.toLocaleDateString('ru-RU');
    } catch (e) {
      console.error(e);
      return 'Ошибка';
    }
  };

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 flex items-center justify-between transition ${isPaused ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
           {sub.logo ? <img src={sub.logo} alt={sub.name} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-gray-400">{sub.name ? sub.name[0] : '?'}</span>}
        </div>
        
        <div>
          <h3 className="font-bold text-gray-800">{sub.name || 'Без названия'}</h3>
          <p className="text-sm text-gray-500">
            {sub.cost} {sub.currency} / {sub.periodQty > 1 ? sub.periodQty : ''} {
              sub.periodUnit === 'month' ? 'мес' :
              sub.periodUnit === 'year' ? 'год' :
              sub.periodUnit === 'week' ? 'нед' : 'дн'
            }
          </p>
          <p className="text-xs text-blue-500 mt-1">
             След. оплата: {getNextPaymentDate()}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onToggleStatus(sub.id)} 
          className={`p-2 rounded-full ${isPaused ? 'text-green-500 bg-green-50' : 'text-orange-400 bg-orange-50'}`}
          title={isPaused ? "Возобновить" : "Приостановить"}
        >
          {isPaused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
        </button>
        
        <button onClick={() => onEdit(sub)} className="p-2 text-gray-400 hover:text-blue-500 bg-gray-50 rounded-full">
          <Edit2 size={18} />
        </button>
        
        <button onClick={() => onDelete(sub.id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;