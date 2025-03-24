# Базовый образ с Node
FROM node:18

# Устанавливаем Python, pip и LibreOffice
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libreoffice \
 && rm -rf /var/lib/apt/lists/*

# Создаём директорию для приложения
WORKDIR /app

# Копируем package.json и устанавливаем Node-зависимости
COPY package.json ./
RUN npm install

# Копируем requirements.txt
COPY requirements.txt ./

# Создаём виртуальное окружение и устанавливаем зависимости в него
RUN python3 -m venv /app/venv \
  && . /app/venv/bin/activate \
  && pip install --no-cache-dir -r requirements.txt

# Копируем все остальные файлы проекта в контейнер
COPY . .

# Укажем в PATH директорию venv/bin:
ENV PATH="/app/venv/bin:$PATH"

EXPOSE 4000
CMD ["node", "nodegin.js"]
