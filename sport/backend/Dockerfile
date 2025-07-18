FROM node:20   

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# เปลี่ยนพอร์ตตามที่ต้องการ (ควรตั้ง ENV PORT=8020 ใน .env หรือ start script)
EXPOSE 8020

CMD ["node", "app.js"]

