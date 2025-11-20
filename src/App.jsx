import React, { useState, useEffect } from 'react';
import { Plus, Bell } from 'lucide-react';
import Analytics from './components/Analytics';
import SubscriptionForm from './components/SubscriptionForm';
import SubscriptionCard from './components/SubscriptionCard';
import DataBackup from './components/DataBackup';

function App() {
  // Загружаем данные из LocalStorage при старте
  const [subscriptions, setSubscriptions] = useState(() => {
    const saved = localStorage.getItem('subs_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);

  // Сохраняем в LocalStorage при любом изменении
  useEffect(() => {
    localStorage.setItem('subs_data', JSON.stringify(subscriptions));
  }, [subscriptions]);

  // Проверка уведомлений при загрузке приложения
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const checkUpcomingPayments = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      subscriptions.forEach(sub => {
        if (sub.status === 'Paused') return;
        
        const start = new Date(sub.startDate);
        let next = new Date(start);
        // Упрощенный поиск следующей даты
        while (next < now) {
          if (sub.periodUnit === 'month') next.setMonth(next.getMonth() + parseInt(sub.periodQty));
          else if (sub.periodUnit === 'year') next.setFullYear(next.getFullYear() + parseInt(sub.periodQty));
          else if (sub.periodUnit === 'week') next.setDate(next.getDate() + (parseInt(sub.periodQty) * 7));
          else next.setDate(next.getDate() + parseInt(sub.periodQty));
        }

        // Если оплата завтра
        if (next.getDate() === tomorrow.getDate() && 
            next.getMonth() === tomorrow.getMonth() && 
            next.getFullYear() === tomorrow.getFullYear()) {
              new Notification("Напоминание о подписке", {
                body: `Завтра списание за ${sub.name}: ${sub.cost} ${sub.currency}`
              });
        }
      });
    };
    
    checkUpcomingPayments();
  }, [subscriptions]);

  const handleAddOrUpdate = (subData) => {
    if (editingSub) {
      setSubscriptions(prev => prev.map(s => s.id === subData.id ? subData : s));
    } else {
      setSubscriptions(prev => [...prev, subData]);
    }
    setEditingSub(null);
  };

  const handleDelete = (id) => {
    if (confirm('Вы уверены, что хотите удалить эту подписку?')) {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleToggleStatus = (id) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' };
      }
      return s;
    }));
  };

  const openEdit = (sub) => {
    setEditingSub(sub);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto bg-gray-50 sm:border-x sm:border-gray-200">
      <header className="p-6 bg-white sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-gray-900">Мои Подписки</h1>
        <Bell size={20} className="text-gray-400" />
      </header>

      <main className="p-4">
        <Analytics subscriptions={subscriptions} />

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-700">Список ({subscriptions.length})</h2>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <p>Нет активных подписок</p>
            <p className="text-sm">Нажмите +, чтобы добавить</p>
          </div>
        ) : (
          subscriptions.map(sub => (
            <SubscriptionCard 
              key={sub.id} 
              sub={sub} 
              onDelete={handleDelete}
              onEdit={openEdit}
              onToggleStatus={handleToggleStatus}
            />
          ))
        )}

        <DataBackup 
          subscriptions={subscriptions} 
          onImport={(data) => setSubscriptions(data)} 
        />
      </main>

      {/* Плавающая кнопка добавления */}
      <button 
        onClick={() => { setEditingSub(null); setIsFormOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition z-20"
      >
        <Plus size={32} />
      </button>

      {isFormOpen && (
        <SubscriptionForm 
          onClose={() => setIsFormOpen(false)} 
          onSave={handleAddOrUpdate}
          initialData={editingSub}
        />
      )}
    </div>
  );
}

export default App;