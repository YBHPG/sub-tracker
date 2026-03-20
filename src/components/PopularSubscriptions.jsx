import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import servicesList from '../assets/services.json';

// Подтягиваем все скачанные локальные иконки из assets/icons на этапе сборки Vite
const iconModules = import.meta.glob('../assets/icons/*.{png,jpg,jpeg,svg}', { eager: true, import: 'default' });

// Собираем финальный список, находя правильную картинку для каждого сервиса
const popularSubscriptions = servicesList.map(service => {
  const safeName = service.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const iconPath = Object.keys(iconModules).find(path => path.includes(`/${safeName}.`));
  return {
    ...service,
    icon: iconPath ? iconModules[iconPath] : null
  };
});

const categories = ['All', ...new Set(popularSubscriptions.map(sub => sub.category))];
// Разделяем категории пополам для независимых строк
const halfLen = Math.ceil(categories.length / 2);
const topCategories = categories.slice(0, halfLen);
const bottomCategories = categories.slice(halfLen);

const PopularSubscriptions = ({ onSelect, onCustom }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredSubscriptions = popularSubscriptions.filter(sub => {
    const matchesCategory = selectedCategory === 'All' || sub.category === selectedCategory;
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Выносим рендер кнопки в функцию, чтобы не дублировать код для двух рядов
  const renderCategoryBtn = (category) => (
    <button
      key={category}
      onClick={() => setSelectedCategory(category)}
      className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
        selectedCategory === category
          ? 'bg-black text-white'
          : 'bg-gray-200 text-gray-700'
      }`}
    >
      {category}
    </button>
  );

  return (
    <div className="flex flex-col h-[500px] max-h-[80vh]">
      <input
        type="text"
        placeholder="Search popular subscriptions..."
        className="w-full p-2 mb-4 border rounded-xl"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      <div className="flex flex-col gap-2 mb-4 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-2 w-max">
          {topCategories.map(renderCategoryBtn)}
        </div>
        <div className="flex gap-2 w-max">
          {bottomCategories.map(renderCategoryBtn)}
        </div>
      </div>
      <div className="overflow-y-auto flex-grow [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="grid grid-cols-1 gap-4">
          <div
              className="p-4 border rounded-xl cursor-pointer hover:bg-gray-100 flex items-center bg-gray-50"
              onClick={onCustom}
          >
              <div className="w-10 h-10 mr-4 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Plus size={24} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold">Add custom subscription</h3>
                <p className="text-sm text-gray-500">Create manually</p>
              </div>
          </div>
          {filteredSubscriptions.map(sub => (
            <div
              key={sub.name}
              className="p-4 border rounded-xl cursor-pointer hover:bg-gray-100 flex items-center"
              onClick={() => onSelect(sub)}
            >
              {sub.icon ? (
                <img src={sub.icon} alt={`${sub.name} icon`} className="w-10 h-10 mr-4 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 mr-4 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 flex-shrink-0">
                  {sub.name[0]}
                </div>
              )}
              <div>
                <h3 className="font-bold">{sub.name}</h3>
                <p className="text-sm text-gray-500">{sub.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularSubscriptions;
