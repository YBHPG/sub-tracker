import React, { useState, useRef } from 'react';
import { Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const PriceDisplay = ({ sub, displayCurrency, rates }) => {
  const currencySymbols = { RUB: '₽', USD: '$', EUR: '€', BYN: 'Br', KZT: '₸', UAH: '₴', TRY: '₺' };
  const subCost = parseFloat(sub.cost) || 0;
  const subCurrency = sub.currency;
  
  // Если валюта отображения совпадает с валютой подписки, показываем просто
  if (displayCurrency === subCurrency) {
    return `${subCost.toLocaleString('ru-RU')} ${currencySymbols[subCurrency] || subCurrency}`;
  }

  // Иначе, конвертируем и показываем оба значения
  const rateSub = rates[subCurrency] || 1;
  const rateDisplay = rates[displayCurrency] || 1;
  
  const convertedCost = (subCost / rateSub) * rateDisplay;

  const originalPrice = `${subCost.toLocaleString('ru-RU')} ${currencySymbols[subCurrency] || subCurrency}`;
  const convertedPrice = `${convertedCost.toLocaleString('ru-RU', {maximumFractionDigits: 0})} ${currencySymbols[displayCurrency] || displayCurrency}`;

  return (
    <>
      {convertedPrice} <span className="text-gray-400 dark:text-gray-500">({originalPrice})</span>
    </>
  );
};

const SubscriptionCard = ({ sub, onEdit, onDelete, onToggleStatus, displayCurrency }) => {
  const isPaused = sub.status === 'Paused';
  const { t, language, rates } = useLanguage();

  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [startX, setStartX] = useState(null);
  const [startY, setStartY] = useState(null);
  const [startOffset, setStartOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const dragRef = useRef(false);
  const swipeStateRef = useRef(0); // 0: начальное, 1: кнопки показаны, 2: порог действия

  const MAX_OFFSET = 80;
  const SWIPE_THRESHOLD = 40;
  const ACTION_THRESHOLD = 150;

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

  const handleTouchStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setStartX(clientX);
    setStartY(clientY);
    setStartOffset(offset);
    setIsSwiping(true);
    setIsScrolling(false);
    dragRef.current = false;
    
    let initialState = 0;
    if (Math.abs(offset) >= ACTION_THRESHOLD) initialState = 2;
    else if (Math.abs(offset) >= SWIPE_THRESHOLD) initialState = 1;
    swipeStateRef.current = initialState;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping || startX === null || startY === null) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const diffX = clientX - startX;
    const diffY = clientY - startY;

    // Если свайп больше вертикальный, отменяем наш свайп и даем браузеру скроллить
    if (!isScrolling && Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 5) {
      setIsScrolling(true);
      setIsSwiping(false);
      setOffset(startOffset);
      return;
    }

    if (isScrolling) return;

    if (Math.abs(diffX) > 5) {
      dragRef.current = true;
    }

    let newOffset = startOffset + diffX;
    
    // Эффект пружины теперь срабатывает только после достижения порога финального действия
    if (newOffset > ACTION_THRESHOLD) newOffset = ACTION_THRESHOLD + (newOffset - ACTION_THRESHOLD) * 0.2;
    if (newOffset < -ACTION_THRESHOLD) newOffset = -ACTION_THRESHOLD + (newOffset + ACTION_THRESHOLD) * 0.2;

    // Тактильная отдача для разных стадий свайпа
    let currentState = 0;
    if (Math.abs(newOffset) >= ACTION_THRESHOLD) currentState = 2;
    else if (Math.abs(newOffset) >= SWIPE_THRESHOLD) currentState = 1;

    if (currentState !== swipeStateRef.current) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(currentState === 2 ? 25 : 15); // Более сильный "щелчок" для финального действия
      }
      swipeStateRef.current = currentState;
    }

    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    if (offset >= ACTION_THRESHOLD) {
      setOffset(0);
      setTimeout(() => onToggleStatus(sub.id), 0);
    } else if (offset <= -ACTION_THRESHOLD) {
      setOffset(0);
      setTimeout(() => onDelete(sub.id), 0);
    } else if (offset > SWIPE_THRESHOLD) {
      setOffset(MAX_OFFSET);
    } else if (offset < -SWIPE_THRESHOLD) {
      setOffset(-MAX_OFFSET);
    } else {
      setOffset(0);
    }
    setStartX(null);
    setStartY(null);
  };

  const handleCardClick = (e) => {
    // Если был свайп, не триггерим клик
    if (dragRef.current) {
      e.preventDefault();
      return;
    }
    // Если карточка открыта — просто закрываем её
    if (offset !== 0) {
      setOffset(0);
      return;
    }
    // Иначе открываем форму редактирования
    onEdit(sub);
  };

  return (
    <div className="relative mb-3 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 select-none [transform:translateZ(0)]">
      {/* Задний фон с кнопками действий */}
      <div className="absolute inset-0 flex justify-between">
        <div 
          className={`w-1/2 flex items-center justify-start px-6 text-white cursor-pointer transition-colors duration-300 ${isPaused ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-400 hover:bg-orange-500'}`}
          onClick={(e) => { e.stopPropagation(); onToggleStatus(sub.id); setOffset(0); }}
        >
          {isPaused 
            ? <PlayCircle size={24} className={`transition-transform duration-300 ${offset >= ACTION_THRESHOLD ? 'scale-125' : ''}`} /> 
            : <PauseCircle size={24} className={`transition-transform duration-300 ${offset >= ACTION_THRESHOLD ? 'scale-125' : ''}`} />
          }
        </div>
        <div 
          className="w-1/2 flex items-center justify-end px-6 bg-red-500 hover:bg-red-600 text-white cursor-pointer transition-colors duration-300"
          onClick={(e) => { e.stopPropagation(); onDelete(sub.id); setOffset(0); }}
        >
          <Trash2 size={24} className={`transition-transform duration-300 ${offset <= -ACTION_THRESHOLD ? 'scale-125' : ''}`} />
        </div>
      </div>

      {/* Сама карточка, которая будет сдвигаться */}
      <div 
        className={`relative bg-white dark:bg-gray-800 p-4 w-full h-full flex items-center cursor-pointer touch-pan-y
          ${!isSwiping ? 'transition-transform duration-300 ease-out' : ''}
        `}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onClick={handleCardClick}
      >
        <div className={`flex items-center gap-4 w-full min-w-0 pointer-events-none transition-all duration-300 ${isPaused ? 'opacity-60 grayscale' : ''}`}>
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors duration-300">
             {sub.logo ? <img src={sub.logo} alt={sub.name} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-gray-400">{sub.name ? sub.name[0] : '?'}</span>}
          </div>
          
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center flex-wrap gap-2">
              <span className="truncate">{sub.name || t.unnamed}</span>
              {sub.planName && (
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                  {sub.planName}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              <PriceDisplay sub={sub} displayCurrency={displayCurrency} rates={rates} /> / {sub.periodQty > 1 ? sub.periodQty : ''} {
                sub.periodUnit === 'month' ? t.mo :
                sub.periodUnit === 'year' ? t.yr :
                sub.periodUnit === 'week' ? t.wk : t.d
              }
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 truncate">
               {t.nextPayment}: {getNextPaymentDate()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCard;