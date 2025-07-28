<template>
  <div class="layout">
    <!-- Sidebar ทางซ้าย -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">Sport Complex MFU</p>
      </div>
      <nav class="nav-links">
        <router-link to="/home_user" exact-active-class="active">
          <i class="pi pi-home"></i> Home
        </router-link>
        <router-link to="/booking_field" active-class="active">
          <i class="pi pi-map-marker"></i> Field
        </router-link>
        <router-link to="/booking_equipment" active-class="active">
          <i class="pi pi-box"></i> Equipment
        </router-link>
        <router-link to="/history" active-class="active">
          <i class="pi pi-history"></i> History
        </router-link>
      </nav>
    </aside>


<!-- <div v-if="isSidebarOpen" class="sidebar-mask" @click="isSidebarOpen = false"></div> -->

<div
  v-if="!isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
></div>





    <!-- Content ทางขวา -->
    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <div>
            <div
      v-if="showNotifications"
      class="notification-backdrop"
      @click="closeNotifications"
    ></div>
            <button class="notification-btn" @click="toggleNotifications">
              <i class="pi pi-bell"></i>
              <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
            </button>
            <div v-if="showNotifications" class="notification-dropdown">
  <ul>
    <li
      v-for="(noti, idx) in notifications"
      :key="noti.id || idx"
      :class="['notification-item', noti.type || '', { unread: idx === 0 }]"
    >
      {{ noti.message }}
    </li>
    <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
  </ul>
</div>

          </div>
          <router-link to="/cart" class="cart-link">
            <i class="pi pi-shopping-cart"></i>
            <span v-if="products.length > 0" class="badge">{{ products.length }}</span>
          </router-link>
          <router-link to="/profile"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <section class="content">
        <!-- แถบประกาศ แบบเลื่อนลง -->
        <!-- <transition name="slide-down">
          <div class="announcement-bar" v-if="showAnnouncementBar">
            <i class="pi pi-megaphone announcement-icon"></i>
            <div class="announcement-bar-text">{{ announcement }}</div>
            <button class="close-announcement-btn" @click="showAnnouncementBar = false">
              <i class="pi pi-times" style="color: red;"></i>
            </button>
          </div>
        </transition> -->

        <p style="padding-top: 5px;"></p>

        <div class="block">
          <h3 style="padding-top: 40px;">Field</h3>
          <div class="grid">
            <!-- แสดงรายการสนาม -->
            <div class="card" v-for="field in fields" :key="field._id">
  <img :src="field.image" :alt="field.name" class="field-image" />
  <div class="card-content">
    <h4>{{ field.name }}</h4>
  </div>
  <button class="book-btn" :class="{ disabled: !field.visible }" :disabled="!field.visible"
    @click="goToBooking(field)">
    จอง
  </button>
</div>

          </div>
        </div>
      </section>

      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel. 053-917-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
            Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_BASE
// const API_BASE = "http://localhost:8020"




// ตัวแปร Reactive
const showAnnouncementBar = ref(false)
const announcement = ref('')
const fields = ref([])
const isSidebarClosed = ref(false) // เหมือน booking_equipment.vue
const products = ref([]) // เพิ่มบรรทัดนี้
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const lastCheckedIds = new Set()

const router = useRouter()

// สลับแถบ Sidebar
function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value;
}

// สลับแจ้งเตือน
function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    unreadCount.value = 0
  }
}

async function loadCart() {
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch (err) {
    products.value = []
  }
}


// โหลดแจ้งเตือนใหม่
async function fetchNotifications() {
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const newNotis = res.data.filter(item =>
      (['approved', 'disapproved', 'cancel', 'canceled', 'returned'].includes((item.status || '').toLowerCase())) &&
      !lastCheckedIds.has(item._id)
    )
    if (newNotis.length) {
      const newMessages = newNotis.map(item => ({
        id: item._id,
        type: (item.status || '').toLowerCase(),
        timestamp: item.returnedAt
          ? new Date(item.returnedAt).getTime()
          : item.updatedAt
          ? new Date(item.updatedAt).getTime()
          : item.approvedAt
          ? new Date(item.approvedAt).getTime()
          : item.date
          ? new Date(item.date).getTime()
          : Date.now(),
        message: `รายการ '${item.name}' ของคุณ${
          (item.status || '').toLowerCase() === 'approved'
            ? ' ได้รับการอนุมัติ'
            : (item.status || '').toLowerCase() === 'disapproved'
            ? ' ไม่ได้รับการอนุมัติ'
            : (item.status || '').toLowerCase() === 'cancel' || (item.status || '').toLowerCase() === 'canceled'
            ? ' ถูกยกเลิก'
            : (item.status || '').toLowerCase() === 'returned'
            ? ' คืนของสำเร็จแล้ว'
            : ''
        }`
      }))
      // รวม, กรองซ้ำ, sort ใหม่สุดบน
      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp)
      newNotis.forEach(item => lastCheckedIds.add(item._id))
      unreadCount.value = notifications.value.length
    }
  } catch (err) {
    // ignore
  }
}

function closeNotifications() {
  showNotifications.value = false
}


// แก้ path รูปภาพให้ถูกต้อง
function resolveImagePath(img) {
  if (!img) return '/img/default.png'
  if (img.startsWith('data:image/')) return img
  if (img.startsWith('/img/')) return img
  return `/img/${img}`
}

onMounted(async () => {
  try {
    // โหลดข้อมูลสนาม
    const res = await axios.get(`${API_BASE}/api/fields`)
    fields.value = res.data.map(field => ({
      ...field,
      image: resolveImagePath(field.image)
    }))
  } catch (err) {
    console.error('ไม่สามารถโหลดข้อมูลสนาม:', err)
  }

  try {
    // โหลดประกาศ
    const annRes = await axios.get(`${API_BASE}/api/announcement`)
    const ann = annRes.data?.announce || ''
    announcement.value = ann
    showAnnouncementBar.value = !!ann
  } catch {
    announcement.value = ''
    showAnnouncementBar.value = false
  }

  // โหลดแจ้งเตือนครั้งแรกและตั้ง poll ทุก 30 วินาที
  fetchNotifications()
  setInterval(fetchNotifications, 30000)

  await loadCart()
})

// ไปหน้าจองสนาม พร้อมส่ง query
function goToBooking(field) {
  if (!field.visible) return;  // ป้องกันกดจองถ้า visible === false
  router.push({
    path: '/booking',
    query: {
      fieldName: field.name,
      hasZone: field.hasZone ? 'true' : 'false',
      zone: (field.hasZone && field.zones && field.zones.length > 0) ? field.zones[0].name : ''
    }
  })
}


</script>

<style scoped>

.field-image, .card img {
  width: 100%;
  height: 120px;
  object-fit: cover !important;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: #fff;
  display: block;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 1px 4px #c7d6ed2a;
  border: 1px solid #e0e0e0;
}

.content {
  flex: 1;
  padding: 1.5rem;
  background-color: #dbe9f4;
  overflow-y: auto;
}
.badge {
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  vertical-align: top;
  margin-left: 4px;
}
.block {
  background-color: #ffffff;
  border-radius: 10px;
  margin-bottom: 2rem;
  padding: 0px 50px 50px 50px;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
}

.card {
  background: rgb(203, 217, 243);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  width: 220px;
  text-align: center;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  min-height: 260px;
  /* height: 260px;  // ไม่ fix ความสูง แต่ใช้ min-height */
}

.card:hover {
  transform: translateY(-4px);
}

.card h4 {
  word-break: break-word;
  overflow-wrap: break-word;
  margin-bottom: 0.5rem;
  /* font-size: 1.08rem; */
  min-height: 40px; /* รองรับ 2 บรรทัด */
  max-height: 56px; /* รองรับ 2-3 บรรทัด */
  line-height: 1.3;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.book-btn {
  margin-top: auto;
  padding: 0.50rem 0.9rem 0.5rem 0.9rem;
  font-size: 0.90rem;
  background-color: #048ace;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: fit-content;
  align-self: center;
}

.book-btn:hover {
  background-color: #0276b7;
}

.book-btn.disabled {
  background-color: #ccc;
  cursor: not-allowed;
  color: #666;
}

/* Animation แถบประกาศ slide down */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  transform: translateY(0%);
  opacity: 1;
}

/* แถบประกาศ */
.announcement-bar {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 3000;
  max-width: var(--announcement-width, 100vw);
  margin-left: auto;
  margin-right: auto;
  right: 0;
  background: linear-gradient(90deg, #ff0000 60%, #ffd6c0 100%);
  color: #ffffff;
  padding: 1rem 2rem;
  font-size: 1.15rem;
  font-weight: bold;
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  box-shadow: 0 4px 18px rgba(255, 80, 80, 0.13);
  border-radius: 12px;
}

.announcement-bar-text {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.close-announcement-btn {
  background: none;
  border: none;
  color: #bf0c0c;
  font-size: 1.5rem;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: color 0.15s;
}

.close-announcement-btn:hover {
  color: #222;
}

/* ===== CSS แจ้งเตือนแบบ history ===== */
.notification-dropdown {
  position: absolute;
  right: 0;
  top: 38px;
  background: #fff;
  border-radius: 18px 0 18px 18px;
  box-shadow:
    0 8px 24px 0 rgba(27, 50, 98, 0.14),
    0 2px 4px 0 rgba(33, 125, 215, 0.06);
  min-width: 330px;
  max-width: 370px;
  max-height: 420px;
  overflow-y: auto;
  z-index: 1002;
  padding: 0;
  border: none;
  animation: fadeDown 0.22s;
}
@keyframes fadeDown {
  0% { opacity: 0; transform: translateY(-24px);}
  100% { opacity: 1; transform: translateY(0);}
}
.notification-dropdown ul {
  padding: 0;
  margin: 0;
  list-style: none;
}
.notification-dropdown li {
  background: linear-gradient(90deg, #f6fafd 88%, #e2e7f3 100%);
  margin: 0.2em 0.8em;
  padding: 0.85em 1.1em;
  border-radius: 12px;
  border: none;
  font-size: 1.07rem;
  font-weight: 500;
  color: #1e2c48;
  box-shadow: 0 2px 8px 0 rgba(85, 131, 255, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  cursor: default;
  transition: background 0.2s;
}
.notification-dropdown li:not(:last-child) {
  margin-bottom: 0.15em;
}
.notification-dropdown li::before {
  content: "🔔";
  font-size: 1.2em;
  margin-right: 7px;
  color: #1976d2;
  opacity: 0.80;
}
.notification-dropdown li.no-noti {
  background: #f2f3f6;
  color: #a7aab7;
  justify-content: center;
  font-style: italic;
}
.notification-dropdown::-webkit-scrollbar {
  width: 7px;
}
.notification-dropdown::-webkit-scrollbar-thumb {
  background: #e1e7f5;
  border-radius: 10px;
}
.notification-dropdown::-webkit-scrollbar-track {
  background: transparent;
}
.notification-item.approved {
  background: linear-gradient(90deg, #e9fbe7 85%, #cbffdb 100%);
  border-left: 4px solid #38b000;
  color: #228c22;
}
.notification-item.disapproved {
  background: linear-gradient(90deg, #ffeaea 85%, #ffd6d6 100%);
  border-left: 4px solid #ff6060;
  color: #b91423;
}
.notification-item.canceled,
.notification-item.cancel {
  background: linear-gradient(90deg, #f9d7d7 80%, #e26a6a 100%);
  border-left: 4px solid #bb2124;
  color: #91061a;
}
.notification-item.returned {
  background: linear-gradient(90deg, #e0f0ff 85%, #b6e0ff 100%);
  border-left: 4px solid #1976d2;
  color: #1976d2;
}
.notification-item {
  transition: background 0.3s, border-color 0.3s, color 0.3s;
}
@media (max-width: 540px) {
  .notification-dropdown {
    min-width: 220px;
    max-width: 99vw;
  }
  .notification-dropdown li {
    font-size: 0.99rem;
    padding: 0.7em 0.7em;
  }
}
.notification-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent;
  z-index: 1001; /* ต้องน้อยกว่า .notification-dropdown (1002) */
}
@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 80vw;
    max-width: 320px;
    height: 100vh;
    z-index: 3000;
    transform: translateX(-100%);
    transition: transform 0.3s;
    box-shadow: 2px 0 12px rgba(0,0,0,0.11);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .main {
    margin-left: 0 !important;
    max-width: 100vw;
    min-width: 0;
    padding: 8px;
  }
}
.sidebar-mask {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  z-index: 2999;
  background: rgba(0,0,0,0.2);
}


</style>

<style>
@import '../css/style.css';
</style>