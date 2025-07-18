FROM nginx:stable-alpine

# ลบ default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# คัดลอก nginx config ใหม่เข้าไป
COPY nginx.conf /etc/nginx/conf.d

# คัดลอกไฟล์ build ของ Vue ไปไว้ใน nginx directory
COPY dist/ /usr/share/nginx/html

# เปิดพอร์ต 8020
EXPOSE 8010

# สั่งรัน nginx
CMD ["nginx", "-g", "daemon off;"]