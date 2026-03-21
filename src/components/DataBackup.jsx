import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';

const DataBackup = ({ subscriptions, onImport }) => {
  const fileInputRef = useRef(null);

  // Логика экспорта: превращаем данные в файл
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

  // Логика импорта: читаем файл
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          onImport(data);
          alert('Данные успешно восстановлены!');
        } else {
          alert('Ошибка: Неверный формат файла.');
        }
      } catch (error) {
        alert('Ошибка при чтении файла.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-2 mt-4">
      <button 
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 border border-transparent dark:border-gray-700 transition"
      >
        <Download size={18} /> Экспорт
      </button>

      <button 
        onClick={() => fileInputRef.current.click()}
        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 border border-transparent dark:border-gray-700 transition"
      >
        <Upload size={18} /> Импорт
      </button>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        accept=".json" 
        className="hidden" 
      />
    </div>
  );
};

export default DataBackup;