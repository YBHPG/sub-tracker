import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const ErrorMessage = ({ type }) => {
  const { t } = useLanguage();
  if (!type) return null;
  
  let text = t.reqField;
  if (type === 'invalid_number') text = t.costError;

  return (
    <div className="flex items-center gap-1 text-red-500 text-xs mt-1 animate-pulse">
      <AlertCircle size={12} />
      <span>{text}</span>
    </div>
  );
};

// Утилита для ужимания картинки (до ~1 МБ) и перевода в base64
const processAndCompressImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = 'Anonymous';
    }
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const MAX_SIZE = 512;
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      let quality = 0.9;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      while (dataUrl.length * 0.75 > 1048576 && quality > 0.1) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
};

const SubscriptionForm = ({ onClose, onSave, initialData }) => {
  const { t, currency: preferredCurrency } = useLanguage();

  const allCurrencies = ['RUB', 'USD', 'EUR', 'BYN', 'KZT', 'UAH', 'TRY'];
  const currencyLabels = {
    RUB: '₽ (RUB)',
    USD: '$ (USD)',
    EUR: '€ (EUR)',
    BYN: 'Br (BYN)',
    KZT: '₸ (KZT)',
    UAH: '₴ (UAH)',
    TRY: '₺ (TRY)'
  };

  // Оставляем только те валюты, которые есть в тарифах этой подписки (либо все для ручной подписки)
  let availableCurrencies = initialData?.plans?.length > 0
    ? Array.from(new Set(initialData.plans.map(p => p.currency)))
    : [...allCurrencies];

  // Пользователь всегда должен иметь возможность выбрать свою стандартную валюту
  if (!availableCurrencies.includes(preferredCurrency)) {
    availableCurrencies.push(preferredCurrency);
  }

  // На всякий случай добавляем текущую валюту подписки, если редактируем старую кастомную запись
  if (initialData?.currency && !availableCurrencies.includes(initialData.currency)) {
    availableCurrencies.push(initialData.currency);
  }

  // Инициализация формы с подмешиванием значений по умолчанию
  const [formData, setFormData] = useState(() => {
    let initialCurrency = preferredCurrency;

    // Если предпочитаемая валюта недоступна для этого сервиса, выбираем первую доступную
    if (!initialData?.id && initialData?.plans?.length > 0) {
       const planCurrencies = initialData.plans.map(p => p.currency);
       if (!planCurrencies.includes(preferredCurrency)) {
         initialCurrency = planCurrencies[0];
       }
    }

    const defaultData = {
      id: null,
      name: '',
      cost: '',
      currency: initialCurrency,
      periodQty: 1,
      periodUnit: 'month',
      startDate: new Date().toISOString().substr(0, 10),
      comment: '',
      logo: null,
      status: 'Active',
      planName: ''
    };

    if (initialData) {
      let initialCost = initialData.cost || defaultData.cost;
      let initialCurrency = initialData.currency || defaultData.currency;
      let initialPeriodQty = initialData.periodQty || defaultData.periodQty;
      let initialPeriodUnit = initialData.periodUnit || defaultData.periodUnit;
      let initialPlanName = initialData.planName || '';

      // Подставляем первый тариф только если это новая подписка из списка (нет ID)
      if (!initialData.id && initialData.plans && initialData.plans.length > 0) {
        const initialPlans = initialData.plans.filter(p => p.currency === initialCurrency);
        if (initialPlans.length > 0) {
          const firstPlan = initialPlans[0];
          initialCost = firstPlan.cost;
          initialPeriodQty = firstPlan.periodQty || 1;
          initialPeriodUnit = firstPlan.periodUnit || 'month';
          initialPlanName = firstPlan.name;
        }
      }

      return { 
        ...defaultData, 
        ...initialData, 
        cost: initialCost, 
        currency: initialCurrency, 
        periodQty: initialPeriodQty, 
        periodUnit: initialPeriodUnit, 
        planName: initialPlanName,
        logo: initialData.logo || initialData.icon || null 
      };
    }
    return defaultData;
  });

  // Показываем все доступные тарифы подписки (выбор тарифа сам переключит валюту)
  const displayPlans = initialData?.plans || [];

  const [touched, setTouched] = useState({});

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const modalId = Math.random().toString(36).substring(2, 9);
    window.history.pushState({ modalId }, '', window.location.href);

    const handlePopState = () => {
      if (onCloseRef.current) onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state && window.history.state.modalId === modalId) {
        window.history.back();
      }
    };
  }, []);

  const [selectedPlan, setSelectedPlan] = useState(() => {
    if (formData.planName) return formData.planName;
    return 'custom';
  });


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressedUrl = await processAndCompressImage(reader.result);
          setFormData({ ...formData, logo: compressedUrl });
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Если меняем валюту, автоматически переключаемся на первый тариф в этой валюте (если он есть)
    if (name === 'currency') {
      if (initialData?.plans) {
        const plansInNewCurrency = initialData.plans.filter(p => p.currency === value);
        if (plansInNewCurrency.length > 0) {
          const firstPlan = plansInNewCurrency[0];
          setFormData(prev => ({
            ...prev,
            currency: value,
            cost: firstPlan.cost,
            periodQty: firstPlan.periodQty || 1,
            periodUnit: firstPlan.periodUnit || 'month',
            planName: firstPlan.name
          }));
          setSelectedPlan(firstPlan.name);
          return;
        }
      }
      // Если для выбранной валюты нет тарифов (или их вообще нет), переключаем на "Свой / Вручную" и очищаем цену
      setFormData(prev => ({ ...prev, currency: value, planName: '', cost: '' }));
      setSelectedPlan('custom');
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Если юзер начал вручную менять параметры тарифа - переключаем селектор на "Свой"
    if (['cost', 'currency', 'periodQty', 'periodUnit'].includes(name) && selectedPlan !== 'custom') {
      setSelectedPlan('custom');
      setFormData(prev => ({ ...prev, planName: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({ ...prev, [name]: true }));

    // Логика авто-исправления для periodQty (как делали раньше)
    if (name === 'periodQty') {
      if (!value || parseInt(value) < 1) {
        setFormData(prev => ({ ...prev, periodQty: 1 }));
      }
    }
  };

  const handlePlanChange = (e) => {
    const planName = e.target.value;
    setSelectedPlan(planName);
    
    if (planName !== 'custom' && displayPlans.length > 0) {
      const plan = displayPlans.find(p => p.name === planName);
      if (plan) {
        setFormData(prev => ({
          ...prev,
          planName: plan.name,
          cost: plan.cost,
          currency: plan.currency,
          periodQty: plan.periodQty || 1,
          periodUnit: plan.periodUnit || 'month'
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, planName: '', cost: '' }));
    }
  };


  // Определяем, является ли подписка системной (из списка сервисов)
  const isPredefined = !!initialData?.domain || !!initialData?.icon || !!initialData?.category || (initialData?.plans?.length > 0);

  // --- ОБНОВЛЕННАЯ ЛОГИКА ОШИБОК ---
  const getErrorType = (field) => {
    // Если поле еще не трогали - ошибок нет
    if (!touched[field]) return null;

    const value = formData[field];

    // Специфичная проверка для Стоимости
    if (field === 'cost') {
      if (!value) return 'empty'; // Пустое
      if (parseFloat(value) <= 0) return 'invalid_number'; // Меньше или равно 0
      return null;
    }

    // Для остальных полей (просто проверка на пустоту)
    if (!value) return 'empty';
    
    return null;
  };

  // Валидация всей формы для кнопки (Стоимость должна быть строго > 0)
  const isFormValid = 
    formData.name && 
    formData.cost && parseFloat(formData.cost) > 0 && 
    formData.startDate;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      const finalData = {
        ...formData,
        periodQty: formData.periodQty || 1 
      };
      onSave(finalData);
      onClose();
    }
  };

  const getInputClass = (hasError) => `
    w-full min-w-0 p-3 border rounded-xl outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white
    ${hasError 
      ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50 dark:bg-red-900/30' 
      : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
    }
  `;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {initialData && initialData.name ? t.editSub : t.newSub}
          </h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden" noValidate>
          <div className="space-y-4 flex-grow overflow-y-auto overflow-x-hidden pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Логотип */}
          {isPredefined ? (
            <div className="flex justify-center mb-4">
              <div className="flex flex-col items-center gap-2">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-16 h-16 rounded-full object-cover border dark:border-gray-600 shadow-sm" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-400 text-2xl">
                    {formData.name ? formData.name[0] : '?'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 mb-4">
              <label className="cursor-pointer flex flex-col items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-16 h-16 rounded-full object-cover border dark:border-gray-600 shadow-sm" />
                ) : (
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-400 transition">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                )}
                <span>{t.uploadIcon}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.nameLabel} <span className="text-red-500">*</span></label>
            <input 
              name="name"
              type="text" 
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClass(getErrorType('name'))}
              placeholder={t.namePlaceholder}
            />
            <ErrorMessage type={getErrorType('name')} />
          </div>

          {/* Тарифный план (показывается только если в базе есть планы для этого сервиса) */}
          {displayPlans.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.tariffPlan}</label>
              <select 
                value={selectedPlan}
                onChange={handlePlanChange}
                className="w-full min-w-0 p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              >
                {displayPlans.map(plan => (
                  <option key={plan.name} value={plan.name}>
                    {plan.name} — {plan.cost} {plan.currency} / {plan.periodQty > 1 ? plan.periodQty + ' ' : ''}{plan.periodUnit === 'month' ? t.mo : plan.periodUnit === 'year' ? t.yr : plan.periodUnit === 'week' ? t.wk : t.d}
                  </option>
                ))}
                <option value="custom">{t.customPlan}</option>
              </select>
            </div>
          )}

          {/* Стоимость и Валюта */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.costLabel} <span className="text-red-500">*</span></label>
              <input 
                name="cost"
                type="number" 
                value={formData.cost}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClass(getErrorType('cost'))}
                placeholder="0"
                min="0.01" 
                step="0.01"
              />
              <ErrorMessage type={getErrorType('cost')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.currencyLabel}</label>
              <select 
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full min-w-0 p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {availableCurrencies.map(c => (
                  <option key={c} value={c}>{currencyLabels[c] || c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Период */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.billingEvery}</label>
            <div className="flex gap-2">
              <input 
                name="periodQty"
                type="number" 
                min="1"
                value={formData.periodQty}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-20 min-w-0 p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select 
                name="periodUnit"
                value={formData.periodUnit}
                onChange={handleChange}
                className="flex-1 min-w-0 p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="day">{t.days}</option>
                <option value="week">{t.weeks}</option>
                <option value="month">{t.months}</option>
                <option value="year">{t.years}</option>
              </select>
            </div>
          </div>

          {/* Дата */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.firstPayment} <span className="text-red-500">*</span></label>
            <input 
              name="startDate"
              type="date" 
              value={formData.startDate}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClass(getErrorType('startDate'))}
            />
            <ErrorMessage type={getErrorType('startDate')} />
          </div>
          </div>

          {/* Кнопка */}
          <div className="pt-4 mt-auto shrink-0">
            <button 
              type="submit" 
              disabled={!isFormValid}
              className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2
                ${isFormValid 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
            >
              {t.saveBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionForm;