import React, { useState, useEffect } from 'react';
import { Plus, Bell, Search, X } from 'lucide-react';
import Analytics from './components/Analytics';
import SubscriptionForm from './components/SubscriptionForm';
import SubscriptionCard from './components/SubscriptionCard';
import DataBackup from './components/DataBackup';
import PopularSubscriptions from './components/PopularSubscriptions';

function App() {
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem('subs_data');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [isPopularSubsOpen, setIsPopularSubsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('subs_data', JSON.stringify(subscriptions));
  }, [subscriptions]);

  // --- БЕЗОПАСНАЯ ЛОГИКА УВЕДОМЛЕНИЙ ---
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const checkAndNotify = () => {
      try {
        const now = new Date();
        const currentHour = now.getHours();
        
        if (currentHour < 21) return;

        const lastNotifiedStr = localStorage.getItem('last_notification_date');
        const todayStr = now.toDateString(); 

        if (lastNotifiedStr === todayStr) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const subsDueTomorrow = subscriptions.filter(sub => {
          if (sub.status === 'Paused') return false;

          try {
            const start = new Date(sub.startDate);
            if (isNaN(start.getTime())) return false;
            
            let next = new Date(start);
            // ЗАЩИТА ОТ ЗАВИСАНИЯ ЗДЕСЬ
            const qty = Math.max(1, parseInt(sub.periodQty) || 1);
            let safety = 0;

            while (next < now && safety < 1000) {
              if (sub.periodUnit === 'month') next.setMonth(next.getMonth() + qty);
              else if (sub.periodUnit === 'year') next.setFullYear(next.getFullYear() + qty);
              else if (sub.periodUnit === 'week') next.setDate(next.getDate() + (qty * 7));
              else next.setDate(next.getDate() + qty);
              safety++;
            }

            return (
              next.getDate() === tomorrow.getDate() &&
              next.getMonth() === tomorrow.getMonth() &&
              next.getFullYear() === tomorrow.getFullYear()
            );
          } catch (e) {
            return false;
          }
        });

        if (subsDueTomorrow.length > 0) {
          const names = subsDueTomorrow.map(s => s.name).join(', ');
          new Notification("Скоро оплата", {
            body: `Завтра списание: ${names}. Проверьте баланс!`,
            icon: '/pwa-192x192.png'
          });
        }
        localStorage.setItem('last_notification_date', todayStr);
      } catch (error) {
        console.error("Ошибка в уведомлениях:", error);
      }
    };

    checkAndNotify();
    const intervalId = setInterval(checkAndNotify, 60000); 
    return () => clearInterval(intervalId);
  }, [subscriptions]);

  const handleAddOrUpdate = (subData) => {
    // Дополнительная валидация перед сохранением
    const cleanData = {
        ...subData,
        periodQty: Math.max(1, parseInt(subData.periodQty) || 1)
    };

    if (editingSub && editingSub.id) {
      setSubscriptions(prev => prev.map(s => s.id === subData.id ? cleanData : s));
    } else {
      setSubscriptions(prev => [...prev, { ...cleanData, id: Date.now() }]);
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

  const handleSelectPopular = (sub) => {
    setEditingSub({ ...sub, logo: sub.icon });
    setIsPopularSubsOpen(false);
    setIsFormOpen(true);
  };

  const handleCustomSubscription = () => {
    setEditingSub(null);
    setIsPopularSubsOpen(false);
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
        onClick={() => { setEditingSub(null); setIsPopularSubsOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition z-20"
      >
        <Plus size={32} />
      </button>

      {isFormOpen && (
        <SubscriptionForm 
          onClose={() => {
            setIsFormOpen(false);
            setEditingSub(null);
          }} 
          onSave={handleAddOrUpdate}
          initialData={editingSub}
        />
      )}

      {isPopularSubsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Выбрать популярную подписку</h3>
              <button onClick={() => setIsPopularSubsOpen(false)} className="text-gray-500 hover:text-red-500 transition">
                <X size={24} />
              </button>
            </div>
            <PopularSubscriptions onSelect={handleSelectPopular} onCustom={handleCustomSubscription} />
          </div>
        </div>
      )}
    </div>
  );
}


export default App;