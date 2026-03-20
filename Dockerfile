# Раздача готовой статики через Nginx
FROM nginx:alpine

# Копируем локально собранную папку dist в директорию Nginx
COPY dist /usr/share/nginx/html

# Открываем 80 порт
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]
