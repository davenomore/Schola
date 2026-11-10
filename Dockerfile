FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app

# Másoljuk a csomagfájlokat
COPY package*.json ./
COPY server/package*.json ./server/

# Függőségek telepítése
RUN npm install
RUN cd server && npm install

# Teljes forráskód másolása
COPY . .

# React frontend buildelése
RUN npm run build

# Render környezeti változók és port
ENV PORT=10000
ENV NODE_ENV=production
EXPOSE 10000

# Szerver indítása
CMD ["node", "server/index.js"]
