import React, { useRef, useEffect } from 'react';
import { Download, Upload, X, Monitor, Sun, Moon } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const SettingsModal = ({ onClose, subscriptions, onImport, theme, setTheme }) => {
  const fileInputRef = useRef(null);
  const { language, setLanguage, t, currency, setCurrency } = useLanguage();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleExport = () => {
    const dataStr = JSON.stringify(subscriptions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `subscriptions_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          onImport(data);
          alert(t.importSuccess);
        } else {
          alert(t.importFormatError);
        }
      } catch {
        alert(t.importReadError);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t.settings}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Перенос данных */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">{t.dataTransfer}</h3>
            <div className="flex gap-3">
              <button 
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <Download size={18} /> {t.export}
              </button>

              <button 
                onClick={() => fileInputRef.current.click()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <Upload size={18} /> {t.import}
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                accept=".json" 
                className="hidden" 
              />
            </div>
          </div>

          {/* Тема интерфейса */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">{t.theme}</h3>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                  theme === 'light' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Sun size={24} />
                <span className="text-xs font-medium">{t.light}</span>
              </button>
              
              <button 
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                  theme === 'dark' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Moon size={24} />
                <span className="text-xs font-medium">{t.dark}</span>
              </button>
              
              <button 
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                  theme === 'system' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Monitor size={24} />
                <span className="text-xs font-medium">{t.system}</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Язык */}
            <div>
              <h3 className="text-[11px] sm:text-sm whitespace-nowrap font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight sm:tracking-wider mb-3">{t.language}</h3>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
            </div>

            {/* Валюта */}
            <div>
              <h3 className="text-[11px] sm:text-sm whitespace-nowrap font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight sm:tracking-wider mb-3">{t.mainCurrency}</h3>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                <option value="RUB">₽ (RUB)</option>
                <option value="USD">$ (USD)</option>
                <option value="EUR">€ (EUR)</option>
                <option value="BYN">Br (BYN)</option>
                <option value="KZT">₸ (KZT)</option>
                <option value="UAH">₴ (UAH)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
          Версия 0.3
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;