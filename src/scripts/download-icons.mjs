import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const servicesPath = path.join(__dirname, '../assets/services.json');
const iconsDir = path.join(__dirname, '../assets/icons');

const services = JSON.parse(fs.readFileSync(servicesPath, 'utf-8'));

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

async function downloadIcons() {
    console.log('Начинаем загрузку иконок...');
    for (const service of services) {
        // Единая логика генерации имени файла (такая же как в UI компоненте)
        const safeName = service.domain.replace(/^www\./i, '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const iconPath = path.join(iconsDir, `${safeName}.png`);

        if (fs.existsSync(iconPath)) {
            console.log(`✅ Пропущен (уже есть): ${safeName}.png`);
            continue;
        }

        try {
            // Берем чистый хост (игнорируем подкаталоги вроде apple.com/music)
            const mainDomain = service.domain.split('/')[0];
            const url = `https://www.google.com/s2/favicons?domain=${mainDomain}&sz=128`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const buffer = await response.arrayBuffer();
            fs.writeFileSync(iconPath, Buffer.from(buffer));
            console.log(`⬇️  Скачано: ${safeName}.png (${service.name})`);
        } catch (error) {
            console.error(`❌ Ошибка для ${safeName}.png (${service.name}):`, error.message);
        }
    }
    console.log('🎉 Все иконки загружены!');
}

downloadIcons();