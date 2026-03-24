# 📝 Sub Tracker

[🇬🇧 English](#-english) | [🇷🇺 Русский](#-русский)

---

## 🇬🇧 English

A simple, convenient, and private web application for tracking your regular paid subscriptions and services. Works entirely in the browser, saves data locally, and helps control expenses.

### ✨ Main Features

- **Subscription Management**: Add new subscriptions, edit their parameters, or delete outdated ones.
- **Popular Services**: Quick addition from a built-in list of popular services with pre-set logos.
- **Custom Subscriptions**: Create your own subscriptions: specify name, cost, currency (₽, $, €), billing period (every X days/weeks/months/years), and upload a custom icon.
- **Pause Subscriptions**: Temporarily "freeze" a subscription with one click if you're not using it, so it's not included in the total expense statistics.
- **Expense Analytics**: A visual widget that automatically calculates total spending on all your active services (with the ability to toggle between monthly & yearly spending).
- **Security and Data Transfer**: Data is not sent anywhere and is stored exclusively on your device via LocalStorage. Easy export and import of all records as a JSON file is available.
- **Themes**: Support for light, dark, and automatic (system) interface themes.
- **PWA (Progressive Web App)**: The design is adapted for mobile devices and feels like a native app.

### 🛠 Tech Stack

- **Frontend**: React, Vite
- **Styling**: Tailwind CSS (v4)
- **Icons**: Lucide React
- **Deployment**: Docker

### 🚀 Running Locally

1. Clone the repository:

    ```bash
    git clone git@github.com:YBHPG/sub-tracker.git
    ```

2. Go to the project folder and install dependencies:

    ```bash
    cd sub-tracker
    npm i
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open the link provided in the terminal in your browser.

---

## 🇷🇺 Русский

Простое, удобное и приватное веб-приложение для отслеживания ваших регулярных платных подписок и сервисов. Работает полностью в браузере, сохраняет данные локально и помогает контролировать расходы.

### ✨ Основной функционал

- **Управление подписками**: Добавляйте новые подписки, редактируйте их параметры или удаляйте неактуальные.
- **Популярные сервисы**: Быстрое добавление из встроенного списка популярных сервисов с уже заданными логотипами.
- **Кастомные подписки**: Создавайте собственные подписки: указывайте название, стоимость, валюту (₽, $, €), период списания (каждые X дней/недель/месяцев/лет) и загружайте собственную иконку.
- **Пауза подписок**: Временно "заморозьте" подписку одним кликом, если вы ей не пользуетесь, чтобы она не учитывалась в общей статистике расходов.
- **Аналитика расходов**: Наглядный виджет, автоматически подсчитывающий суммарные траты на все ваши активные сервисы (с возможностью переключения за месяц / за год).
- **Безопасность и перенос данных**: Данные никуда не отправляются и хранятся исключительно на вашем устройстве с помощью LocalStorage. Доступен удобный экспорт и импорт всех записей в виде JSON-файла.
- **Темы оформления**: Поддержка светлой, тёмной и автоматической (системной) темы интерфейса.
- **PWA (Progressive Web App)**: Дизайн адаптирован под мобильные устройства и ощущается как нативное приложение.

### 🛠 Технологический стек

- **Frontend**: React, Vite
- **Стилизация**: Tailwind CSS (v4)
- **Иконки**: Lucide React
- **Деплой**: Docker

### 🚀 Запуск проекта локально

1. Склонируйте репозиторий:

    ```bash
    git clone git@github.com:YBHPG/sub-tracker.git
    ```

2. Перейдите в папку с проектом и установите зависимости:

    ```bash
    cd sub-tracker
    npm i
    ```

3. Запустите сервер для разработки:

    ```bash
    npm run dev
    ```

4. Откройте ссылку из терминала в браузере.
