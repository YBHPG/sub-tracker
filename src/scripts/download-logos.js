import fs from 'fs/promises';
import path from 'path';
import { Buffer } from 'buffer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Пути
const jsonPath = path.join(__dirname, 'src/assets/services.json');
const iconsDir = path.join(__dirname, 'src/assets/icons');

// Базовый эндпоинт CompanyEnrich Logo API
// (Если API требует авторизации, вам нужно будет добавить заголовок Authorization в функцию fetch)
const getLogoUrl = (domain) => `https://api.companyenrich.com/logo/${domain}`;

async function downloadLogo(name, domain) {
    const url = getLogoUrl(domain);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`❌ Ошибка API для ${name} (${domain}): ${response.status} ${response.statusText}`);
            return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Очищаем имя сервиса для создания безопасного имени файла
        const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // Определяем расширение из заголовка ответа
        const contentType = response.headers.get('content-type') || 'image/png';
        const ext = contentType.includes('svg') ? 'svg' : contentType.includes('jpeg') ? 'jpg' : 'png';

        const filePath = path.join(iconsDir, `${safeName}.${ext}`);

        await fs.writeFile(filePath, buffer);
        console.log(`✅ Сохранено: ${name} -> ${filePath}`);
    } catch (error) {
        console.error(`❌ Ошибка сети для ${name} (${domain}):`, error.message);
    }
}

async function main() {
    try {
        // Создаем папку assets/icons, если её нет
        await fs.mkdir(iconsDir, { recursive: true });

        const data = await fs.readFile(jsonPath, 'utf8');
        const services = JSON.parse(data);

        console.log(`🚀 Найдено сервисов: ${services.length}. Начинаем загрузку...`);

        for (const service of services) {
            await downloadLogo(service.name, service.domain);
        }

        console.log('🎉 Все доступные логотипы были обработаны!');
    } catch (error) {
        console.error('🔥 Критическая ошибка:', error);
    }
}

main();