import React, { useState, useEffect } from 'react';
import { Plus, Bell, Search, X, Settings, Filter, Calendar, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Analytics from './components/Analytics';
import SubscriptionForm from './components/SubscriptionForm';
import SubscriptionCard from './components/SubscriptionCard';
import SettingsModal from './components/SettingsModal';
import PopularSubscriptions from './components/PopularSubscriptions';
import { useLanguage } from './components/LanguageContext';
import servicesList from './assets/services.json';

// Вспомогательная функция для получения сырой даты для точной сортировки
const getRawNextDate = (sub) => {
  try {
    if (!sub.startDate) return new Date(8640000000000000); // Отправляем в конец
    const start = new Date(sub.startDate);
    if (isNaN(start.getTime())) return new Date(8640000000000000);
    
    const now = new Date();
    let next = new Date(start);
    
    const qty = Math.max(1, parseInt(sub.periodQty) || 1);
    let safetyCounter = 0;
    
    while (next < now && safetyCounter < 1000) {
      if (sub.periodUnit === 'month') next.setMonth(next.getMonth() + qty);
      else if (sub.periodUnit === 'year') next.setFullYear(next.getFullYear() + qty);
      else if (sub.periodUnit === 'week') next.setDate(next.getDate() + (qty * 7));
      else next.setDate(next.getDate() + qty);
      safetyCounter++;
    }
    
    next.setHours(0, 0, 0, 0); // Обнуляем время для честного сравнения дат
    return next;
  } catch {
    return new Date(8640000000000000);
  }
};

function App() {
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem('subs_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ретроактивно добавляем planName для старых подписок
        return parsed.map(sub => {
          if (!sub.planName) {
            const service = servicesList.find(s => s.name === sub.name);
            if (service && service.plans) {
              const matchedPlan = service.plans.find(p => 
                parseFloat(p.cost) === parseFloat(sub.cost) && 
                p.currency === sub.currency && 
                (p.periodQty || 1) == (sub.periodQty || 1) && 
                (p.periodUnit || 'month') === sub.periodUnit
              );
              if (matchedPlan) return { ...sub, planName: matchedPlan.name };
            }
          }
          return sub;
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [isPopularSubsOpen, setIsPopularSubsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('app_sort') || 'dateAsc');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'system';
  });
  const { t, currency: mainCurrency } = useLanguage();
  const [displayCurrency, setDisplayCurrency] = useState(mainCurrency);

  useEffect(() => {
    localStorage.setItem('subs_data', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    setDisplayCurrency(mainCurrency);
  }, [mainCurrency]);

  useEffect(() => {
    localStorage.setItem('app_sort', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      if (theme === 'system') {
        root.classList.toggle('dark', mediaQuery.matches);
        root.style.colorScheme = mediaQuery.matches ? 'dark' : 'light';
      } else {
        root.classList.toggle('dark', theme === 'dark');
        root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
      }
    };

    applyTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  // --- БЕЗОПАСНАЯ ЛОГИКА УВЕДОМЛЕНИЙ ---
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().catch(console.error);
      }
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
          } catch {
            return false;
          }
        });

        if (subsDueTomorrow.length > 0 && 'Notification' in window && Notification.permission === "granted") {
          const names = subsDueTomorrow.map(s => s.name).join(', ');
          new Notification(t.notifTitle, {
            body: `${t.notifBody1} ${names}. ${t.notifBody2}`,
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
  }, [subscriptions, t]);

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
    if (confirm(t.deleteConfirm)) {
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

  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    // Пауза всегда уходит в конец списка
    if (a.status !== b.status) {
      return a.status === 'Active' ? -1 : 1;
    }

    if (sortBy === 'dateAsc' || sortBy === 'dateDesc') {
      const dateA = getRawNextDate(a).getTime();
      const dateB = getRawNextDate(b).getTime();
      return sortBy === 'dateAsc' ? dateA - dateB : dateB - dateA;
    }
    if (sortBy === 'nameAsc' || sortBy === 'nameDesc') {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      if (nameA < nameB) return sortBy === 'nameAsc' ? -1 : 1;
      if (nameA > nameB) return sortBy === 'nameAsc' ? 1 : -1;
      return 0;
    }
    if (sortBy === 'priceAsc' || sortBy === 'priceDesc') {
      const priceA = parseFloat(a.cost) || 0;
      const priceB = parseFloat(b.cost) || 0;
      return sortBy === 'priceAsc' ? priceA - priceB : priceB - priceA;
    }
    return 0;
  });

  return (
    <div className="min-h-[100dvh] pb-24 max-w-lg mx-auto bg-gray-50 dark:bg-gray-900 sm:border-x sm:border-gray-200 dark:sm:border-gray-800 transition-colors duration-300">
      <header className="p-6 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center transition-colors duration-300">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{t.mySubs}</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <Settings size={20} />
          </button>
          <Bell size={20} className="text-gray-400 dark:text-gray-500" />
        </div>
      </header>

      <main className="p-4">
        <Analytics 
          subscriptions={subscriptions} 
          displayCurrency={displayCurrency}
          setDisplayCurrency={setDisplayCurrency}
        />

        <div className="flex justify-between items-center mb-4 gap-2">
          <h2 className="font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{t.list} ({subscriptions.length})</h2>
          {subscriptions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className={`p-2 border rounded-xl outline-none transition-colors flex items-center justify-center shadow-sm ${
                  isSortMenuOpen
                    ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/40 dark:border-blue-500'
                    : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                <Filter size={18} />
              </button>

              {isSortMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsSortMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-20 py-1.5 overflow-hidden">
                    {[
                      { value: 'dateAsc', icon: Calendar, text: t.sortDate, arrow: ArrowDown },
                      { value: 'dateDesc', icon: Calendar, text: t.sortDate, arrow: ArrowUp },
                      { value: 'nameAsc', icon: 'A', text: t.sortName, arrow: ArrowDown },
                      { value: 'nameDesc', icon: 'A', text: t.sortName, arrow: ArrowUp },
                      { value: 'priceAsc', icon: DollarSign, text: t.sortPrice, arrow: ArrowDown },
                      { value: 'priceDesc', icon: DollarSign, text: t.sortPrice, arrow: ArrowUp },
                    ].map((option, idx) => (
                      <React.Fragment key={option.value}>
                        <button
                          onClick={() => {
                            setSortBy(option.value);
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                            sortBy === option.value
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {option.icon === 'A' ? (
                              <span className={`font-bold text-[15px] w-4 text-center leading-none ${sortBy === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>A</span>
                            ) : (
                              <option.icon size={16} className={sortBy === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} />
                            )}
                            <span>{option.text}</span>
                          </div>
                          <option.arrow size={14} className={sortBy === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} />
                        </button>
                        {idx % 2 !== 0 && idx !== 5 && (
                          <div className="h-px bg-gray-100 dark:bg-gray-700/50 my-1 mx-2" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
            <p>{t.noActiveSubs}</p>
            <p className="text-sm">{t.clickPlus}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedSubscriptions.map(sub => (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: sub.status === 'Paused' ? [1, 0.96, 1] : 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                style={{ position: 'relative', zIndex: sub.status === 'Paused' ? 0 : 1 }}
              >
                <SubscriptionCard 
                  sub={sub} 
                  onDelete={handleDelete}
                  onEdit={openEdit}
                  onToggleStatus={handleToggleStatus}
                  displayCurrency={displayCurrency}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

      </main>

      <button 
        onClick={() => { setEditingSub(null); setIsPopularSubsOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition z-20"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setIsPopularSubsOpen(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.selectPopular}</h3>
              <button onClick={() => setIsPopularSubsOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition">
                <X size={24} />
              </button>
            </div>
            <PopularSubscriptions onSelect={handleSelectPopular} onCustom={handleCustomSubscription} />
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          subscriptions={subscriptions} 
          onImport={(data) => setSubscriptions(data)} 
          theme={theme}
          setTheme={setTheme}
        />
      )}
    </div>
  );
}


export default App;