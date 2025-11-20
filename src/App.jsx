import React, { useState, useEffect } from 'react';
import { Plus, Bell } from 'lucide-react';
import Analytics from './components/Analytics';
import SubscriptionForm from './components/SubscriptionForm';
import SubscriptionCard from './components/SubscriptionCard';
import DataBackup from './components/DataBackup';

function App() {
  // Загружаем данные
  const [subscriptions, setSubscriptions] = useState(() => {
    const saved = localStorage.getItem('subs_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);

  // Сохраняем данные при изменении
  useEffect(() => {
    localStorage.setItem('subs_data', JSON.stringify(subscriptions));
  }, [subscriptions]);

  // --- ЛОГИКА УВЕДОМЛЕНИЙ (Новая) ---
  useEffect(() => {
    // 1. Проверяем права
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const checkAndNotify = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Проверяем: Наступило ли 9 вечера (21:00)?
      if (currentHour < 23) return;

      // Проверяем: Отправляли ли мы уже уведомление СЕГОДНЯ?
      const lastNotifiedStr = localStorage.getItem('last_notification_date');
      const todayStr = now.toDateString(); // формат "Thu Nov 21 2025"

      if (lastNotifiedStr === todayStr) {
        return; // Сегодня уже напоминали, выходим
      }

      // Если 21:00+ и сегодня не напоминали, ищем подписки
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Сбрасываем время для точного сравнения дат

      const subsDueTomorrow = subscriptions.filter(sub => {
        if (sub.status === 'Paused') return false;

        // Расчет следующей даты (та же логика, что и раньше)
        const start = new Date(sub.startDate);
        let next = new Date(start);
        // Важно: сравниваем с "сейчас", чтобы найти актуальную следующую дату
        while (next < now) {
          if (sub.periodUnit === 'month') next.setMonth(next.getMonth() + parseInt(sub.periodQty));
          else if (sub.periodUnit === 'year') next.setFullYear(next.getFullYear() + parseInt(sub.periodQty));
          else if (sub.periodUnit === 'week') next.setDate(next.getDate() + (parseInt(sub.periodQty) * 7));
          else next.setDate(next.getDate() + parseInt(sub.periodQty));
        }

        // Проверяем, совпадает ли дата с "завтра"
        return (
          next.getDate() === tomorrow.getDate() &&
          next.getMonth() === tomorrow.getMonth() &&
          next.getFullYear() === tomorrow.getFullYear()
        );
      });

      // Если нашли такие подписки — отправляем уведомление
      if (subsDueTomorrow.length > 0) {
        const names = subsDueTomorrow.map(s => s.name).join(', ');
        new Notification("Скоро оплата", {
          body: `Завтра списание: ${names}. Проверьте баланс!`,
          icon: '/pwa-192x192.png' // Иконка (если есть)
        });
      }

      // ВАЖНО: Запоминаем, что сегодня мы проверку выполнили (даже если список пуст)
      // Это предотвратит спам при перезагрузке страницы
      localStorage.setItem('last_notification_date', todayStr);
    };

    // Запускаем проверку сразу при загрузке (вдруг пользователь открыл в 21:30)
    checkAndNotify();

    // И запускаем таймер, который проверяет время каждую минуту 
    // (на случай, если приложение открыто и на часах стукнуло 21:00)
    const intervalId = setInterval(checkAndNotify, 60000); 

    return () => clearInterval(intervalId);
  }, [subscriptions]); // Зависит от подписок, чтобы данные были свежими

  // --- ОСТАЛЬНОЙ КОД БЕЗ ИЗМЕНЕНИЙ ---

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
        <h1 className="text-2xl font-extrabold text-gray-900">Мои подписки</h1>
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