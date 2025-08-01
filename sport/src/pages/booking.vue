<template>
  <div class="layout">
    <!-- Sidebar ทางซ้าย -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">Sport Complex MFU</p>
      </div>
      <nav class="nav-links">
        <router-link to="/home_user" exact-active-class="active"><i class="pi pi-home"></i> Home</router-link>
        <router-link to="/booking_field" active-class="active"><i class="pi pi-map-marker"></i> Field</router-link>
        <router-link to="/booking_equipment" active-class="active"><i class="pi pi-box"></i> Equipment</router-link>
        <router-link to="/history" active-class="active"><i class="pi pi-history"></i> History</router-link>
      </nav>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <!-- กระดิ่งแจ้งเตือน -->
          <div style="position: relative;">
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
      <div class="probody-flex">
        <!-- Left -->
        <div class="left-column">
  <img :src="currentImage" alt="Field" class="field-image" />
  <!-- Overlay ชื่อโซนที่เลือก (จะแสดงเฉพาะเมื่อเลือก zone) -->
  <div v-if="selectedZoneName" class="zone-overlay-label">
    {{ selectedZoneName }}
  </div>
  <div class="calendar-wrapper">
    <iframe
      src="https://calendar.google.com/calendar/embed?src=gpt.lumduanfriend%40gmail.com&ctz=Asia%2FBangkok"
      style="border: 0"
      width="100%"
      height="600"
      frameborder="0"
      scrolling="no"
    ></iframe>
  </div>
</div>

        <!-- Right -->
        <div class="right-column" @click.self="clearZone">
          <!-- กรณีมีโซน -->
          <div v-if="field && field.hasZone && field.zones && field.zones.length > 0" class="zone-selector">
            <p class="zone-label">Select Zone:</p>
            <div class="zone-actions">
              <div class="zone-buttons">
                <button
                  v-for="(zone, idx) in field.zones"
                  :key="zone._id?.$oid || idx"
                  @click.stop="zone.active !== false && zone.status !== 'ปิด' && selectZone(zone)"
                  :class="{
                    active: selectedZoneName === zone.name,
                    'zone-disabled': zone.active === false || zone.status === 'ปิด'
                  }"
                  :disabled="zone.active === false || zone.status === 'ปิด'"
                >
                  <img
                    v-if="zone.image"
                    :src="zone.image"
                    alt="Zone"
                    style="width: 40px; height: 30px; object-fit: cover; border-radius: 4px; margin-right: 8px"
                  />
                  {{ zone.name || `Zone ${idx + 1}` }}
                  <span v-if="zone.active === false || zone.status === 'ปิด'" style="color: #e11d48; font-size: 12px; margin-left: 4px;">
                    (ปิดใช้งาน)
                  </span>
                </button>
              </div>
              <button
                class="booking-btn"
                @click="bookZone"
                :disabled="zoneRequired && !selectedZoneName"
              >
                <i class="pi pi-check-circle" style="margin-right: 8px"></i>
                BOOKING
              </button>
            </div>
          </div>
          <!-- กรณีไม่มีโซน -->
          <div v-else-if="field">
            <button class="booking-btn" @click="bookZone">
              <i class="pi pi-check-circle" style="margin-right: 8px"></i>
              BOOKING
            </button>
          </div>
        </div>
      </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_BASE

const route = useRoute()
const router = useRouter()
const products = ref([]) // เพิ่มบรรทัดนี้
const isSidebarClosed = ref(false)
const selectedZoneName = ref(null)
const field = ref(null)

// แจ้งเตือน
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const lastCheckedIds = new Set()

// รับชื่อสนามจาก query param
const fieldName = ref(route.query.fieldName || '')

// แปลง path รูป
function resolveImagePath(img) {
  if (!img) return '/img/default.png'
  if (img.startsWith('data:image/')) return img
  if (img.startsWith('/img/')) return img
  return `/img/${img}`
}

// ภาพปกหลักสนาม
const defaultImage = computed(() => {
  if (!field.value) return '/img/default.png'
  return resolveImagePath(field.value.image)
})

// ภาพ zone ที่เลือก (หรือใช้ภาพหลักถ้าไม่มี zone หรือยังไม่เลือก)
const currentImage = computed(() => {
  if (
    field.value &&
    field.value.hasZone &&
    field.value.zones &&
    field.value.zones.length > 0 &&
    selectedZoneName.value
  ) {
    const found = field.value.zones.find(z => z.name === selectedZoneName.value)
    return found && found.image ? resolveImagePath(found.image) : defaultImage.value
  }
  return defaultImage.value
})

// ต้องเลือก zone ก่อนจองหรือไม่ (เฉพาะสนามที่ hasZone && zones.length > 0)
const zoneRequired = computed(() => {
  return field.value && field.value.hasZone && field.value.zones && field.value.zones.length > 0
})

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

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
function closeNotifications() {
  showNotifications.value = false
}

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

function clearZone() {
  if (selectedZoneName.value) {
    selectedZoneName.value = null
  }
}

function selectZone(zone) {
  selectedZoneName.value = zone.name
}

function bookZone() {
  if (zoneRequired.value && !selectedZoneName.value) {
    alert('กรุณาเลือกโซนก่อนจอง')
    return
  }
  router.push({
    path: '/form_field',
    query: {
      fieldName: fieldName.value,
      zone: selectedZoneName.value
    }
  })
}

onMounted(async () => {
  if (!fieldName.value) return
  try {
    const res = await axios.get(`${API_BASE}/api/fields`)
    const found = res.data.find(f => f.name === fieldName.value)
    if (found) {
      found.image = resolveImagePath(found.image)
      if (Array.isArray(found.zones)) {
        found.zones = found.zones.map(z => ({
          ...z,
          image: resolveImagePath(z.image)
        }))
      }
      field.value = found
    } else {
      field.value = null
    }
  } catch (err) {
    field.value = null
    console.error('โหลดข้อมูลสนามไม่สำเร็จ', err)
  }
  await fetchNotifications()
  setInterval(fetchNotifications, 30000)
  
  await loadCart()

})
</script>

<style scoped>
.probody-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 20px;
  background-color: #dbe9f4;
  box-sizing: border-box;
}
.left-column {
  flex: 1 1 60%;
  max-width: 60%;
  position: relative; /* เพิ่มตรงนี้ */
}

.right-column {
  flex: 1 1 35%;
  max-width: 35%;
  display: flex;
  flex-direction: column;
  align-items: center;      /* <--- ชิดกลางคอลัมน์ */
  justify-content: center;
  min-height: 600px;
  position: relative;
}
.field-image {
  width: 100%;
  max-width: 800px;
  height: 480px;
  object-fit: cover !important;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: block;
  margin-left: auto;
  margin-right: auto;
}

/* กล่องโซน + ปุ่ม booking อยู่ตรงกลาง */
.zone-selector {
  width: 100%;
  text-align: center;       /* <--- เปลี่ยนเป็น center */
  display: flex;
  flex-direction: column;
  align-items: center;      /* <--- center! */
  margin-bottom: 0;
}

.zone-label {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 10px;
  align-self: center;       /* <--- center! */
}

.zone-actions {
  display: flex;
  flex-direction: column;
  align-items: center;      /* <--- center! */
  gap: 10px;
}
.zone-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;      /* <--- center! */
  gap: 10px;
  width: 100%;
}
.zone-buttons button {
  padding: 12px 16px;
  border: 1px solid #007bff;
  background-color: white;
  color: #007bff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  width: 180px;
  max-width: 100%;
  display: flex;
  align-items: center;
  margin-left: 0;
}
.zone-buttons button.active,
.zone-buttons button:hover {
  background-color: #007bff;
  color: white;
}
.booking-btn {
  margin-top: 24px;    /* ปรับให้ห่าง zone-buttons แค่เล็กน้อย */
  padding: 14px 50px;
  font-size: 1.2rem;
  border: none;
  background: linear-gradient(135deg, #304674);
  color: white;
  border-radius: 999px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  letter-spacing: 1px;
}
.booking-btn:disabled {
  background: #aaa;
  cursor: not-allowed;
  box-shadow: none;
}
.zone-buttons button.zone-disabled,
.zone-buttons button:disabled {
  background: #f4f4f4 !important;
  color: #aaa !important;
  border-color: #bbb !important;
  cursor: not-allowed !important;
  opacity: 0.7;
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

.zone-overlay-label {
  position: absolute;
  top: 32px;
  left: 32px;
  background: rgba(0, 123, 255, 0.658);
  color: #fff;
  padding: 10px 22px;
  font-size: 1.25rem;
  font-weight: bold;
  border-radius: 18px;
  box-shadow: 0 3px 10px rgba(60,60,100,0.08);
  z-index: 5;
  pointer-events: none;
  letter-spacing: 1px;
}



</style>
<style>
@import '../css/style.css';
</style>