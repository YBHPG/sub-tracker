import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

const SubscriptionForm = ({ onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    id: Date.now(),
    name: '',
    cost: '',
    currency: 'RUB',
    periodQty: 1,
    periodUnit: 'month',
    startDate: new Date().toISOString().substr(0, 10),
    comment: '',
    logo: null,
    status: 'Active'
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Редактировать' : 'Новая подписка'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Логотип */}
          <div className="flex justify-center mb-4">
            <label className="cursor-pointer flex flex-col items-center gap-2 text-sm text-blue-600">
              {formData.logo ? (
                <img src={formData.logo} alt="Logo" className="w-16 h-16 rounded-full object-cover border" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Upload size={24} className="text-gray-400" />
                </div>
              )}
              <span>Загрузить иконку</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Например, Netflix"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость</label>
              <input 
                required
                type="number" 
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
              <select 
                value={formData.currency}
                onChange={e => setFormData({...formData, currency: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white"
              >
                <option value="RUB">₽ (RUB)</option>
                <option value="USD">$ (USD)</option>
                <option value="EUR">€ (EUR)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Списание каждые</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                min="1"
                value={formData.periodQty}
                onChange={e => setFormData({...formData, periodQty: e.target.value})}
                className="w-20 p-3 border border-gray-200 rounded-xl"
              />
              <select 
                value={formData.periodUnit}
                onChange={e => setFormData({...formData, periodUnit: e.target.value})}
                className="flex-1 p-3 border border-gray-200 rounded-xl bg-white"
              >
                <option value="day">Дней</option>
                <option value="week">Недель</option>
                <option value="month">Месяцев</option>
                <option value="year">Лет</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Первое списание</label>
            <input 
              type="date" 
              required
              value={formData.startDate}
              onChange={e => setFormData({...formData, startDate: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-xl bg-white"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
            Сохранить
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionForm;