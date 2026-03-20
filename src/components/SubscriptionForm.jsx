import React, { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';

const ErrorMessage = ({ type }) => {
  if (!type) return null;
  
  let text = "Поле обязательно для заполнения";
  if (type === 'invalid_number') text = "Стоимость должна быть больше 0";

  return (
    <div className="flex items-center gap-1 text-red-500 text-xs mt-1 animate-pulse">
      <AlertCircle size={12} />
      <span>{text}</span>
    </div>
  );
};

const SubscriptionForm = ({ onClose, onSave, initialData }) => {
  // Инициализация формы с подмешиванием значений по умолчанию
  const [formData, setFormData] = useState(() => {
    const defaultData = {
      id: null,
      name: '',
      cost: '',
      currency: 'RUB',
      periodQty: 1,
      periodUnit: 'month',
      startDate: new Date().toISOString().substr(0, 10),
      comment: '',
      logo: null,
      status: 'Active'
    };

    if (initialData) {
      return { ...defaultData, ...initialData, logo: initialData.logo || initialData.icon || null };
    }
    return defaultData;
  });

  const [touched, setTouched] = useState({});

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    w-full p-3 border rounded-xl outline-none transition-colors
    ${hasError 
      ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' 
      : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
    }
  `;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData && initialData.name ? 'Редактировать' : 'Новая подписка'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Логотип */}
          <div className="flex justify-center mb-4">
            <label className="cursor-pointer flex flex-col items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition">
              {formData.logo ? (
                <img src={formData.logo} alt="Logo" className="w-16 h-16 rounded-full object-cover border shadow-sm" />
              ) : (
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition">
                  <Upload size={24} className="text-gray-400" />
                </div>
              )}
              <span>Загрузить иконку</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название <span className="text-red-500">*</span></label>
            <input 
              name="name"
              type="text" 
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClass(getErrorType('name'))}
              placeholder="Например, Netflix"
            />
            <ErrorMessage type={getErrorType('name')} />
          </div>

          {/* Стоимость и Валюта */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость <span className="text-red-500">*</span></label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
              <select 
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="RUB">₽ (RUB)</option>
                <option value="USD">$ (USD)</option>
                <option value="EUR">€ (EUR)</option>
              </select>
            </div>
          </div>

          {/* Период */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Списание каждые</label>
            <div className="flex gap-2">
              <input 
                name="periodQty"
                type="number" 
                min="1"
                value={formData.periodQty}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-20 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select 
                name="periodUnit"
                value={formData.periodUnit}
                onChange={handleChange}
                className="flex-1 p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="day">Дней</option>
                <option value="week">Недель</option>
                <option value="month">Месяцев</option>
                <option value="year">Лет</option>
              </select>
            </div>
          </div>

          {/* Дата */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Первое списание <span className="text-red-500">*</span></label>
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

          {/* Кнопка */}
          <button 
            type="submit" 
            disabled={!isFormValid}
            className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2
              ${isFormValid 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            Сохранить
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionForm;