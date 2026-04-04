import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const servicesJsonPath = path.join(__dirname, '../assets/services.json');

// Конфигурация для каждого сайта. Это сердце архитектуры.
// Мы описываем ГДЕ брать данные, а не КАК.
const SCRAPER_CONFIG = {
    'netflix.com': {
        url: 'https://www.netflix.com/signup/planform',
        waitForSelector: '.plan-card', // Ждем, пока JS отрендерит карточки
        selectors: {
            card: '.plan-card',
            name: '.plan-title',
            price: '.plan-price'
        },
        currencyFallback: 'USD',
    },
    'spotify.com': {
        url: 'https://www.spotify.com/us/premium/',
        waitForSelector: '[data-testid="plan-card"]',
        selectors: {
            card: '[data-testid="plan-card"]',
            name: 'h3',
            price: '.price-tag'
        },
        currencyFallback: 'USD',
    }
    // Сюда легко добавлять новые сайты, изучив их структуру через DevTools (F12)
};

async function main() {
    console.log('🚀 Запускаем процесс сбора цен...');

    // Запускаем браузер (headless: true означает, что окно не будет видно)
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
    });

    const data = await fs.readFile(servicesJsonPath, 'utf8');
    let services = JSON.parse(data);
    let hasChanges = false;

    for (const service of services) {
        // Ищем базовый домен в ключах конфига
        const configKey = Object.keys(SCRAPER_CONFIG).find(k => service.domain.includes(k));
        if (!configKey) continue;

        const config = SCRAPER_CONFIG[configKey];
        console.log(`⏳ Проверяем ${service.name} (${config.url})...`);

        try {
            const page = await context.newPage();
            await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Ждем появления элемента на странице
            await page.waitForSelector(config.waitForSelector, { timeout: 10000 });

            // Извлекаем данные, запуская код прямо внутри контекста страницы
            const newPlans = await page.$$eval(config.selectors.card, (cards, sel) => {
                return cards.map(card => {
                    const nameEl = card.querySelector(sel.name);
                    const priceEl = card.querySelector(sel.price);

                    if (!nameEl || !priceEl) return null;

                    const name = nameEl.innerText.trim();
                    const priceText = priceEl.innerText.trim();

                    const priceMatch = priceText.match(/(\d+[\.,]\d+|\d+)/);
                    const currencyMatch = priceText.match(/([$€₽₺])/);

                    if (name && priceMatch) {
                        return {
                            name: name,
                            cost: parseFloat(priceMatch[1].replace(',', '.')),
                            currencySymbol: currencyMatch ? currencyMatch[1] : null,
                        };
                    }
                    return null;
                }).filter(Boolean);
            }, config.selectors);

            await page.close();

            if (newPlans && newPlans.length > 0) {
                // Здесь нужно сопоставить символы с кодами валют ($, €, ₽) и обновить service.plans
                // В рамках примера, мы выводим в консоль:
                console.log(`✅ Найдено тарифов для ${service.name}: ${newPlans.length}`);
                // Логика обновления services и флага hasChanges = true
            } else {
                console.log(`⚠️ Не удалось распарсить тарифы для ${service.name}.`);
            }

            // Обязательная задержка между сайтами, чтобы не получить бан по IP
            await new Promise(r => setTimeout(r, 3000));

        } catch (error) {
            console.error(`❌ Ошибка проверки ${service.name}:`, error.message);
        }
    }

    await browser.close();

    if (hasChanges) {
        await fs.writeFile(servicesJsonPath, JSON.stringify(services, null, 2));
        console.log('🎉 Файл services.json обновлен!');
    }
}

main();