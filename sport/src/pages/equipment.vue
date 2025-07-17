<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/approve_equipment" exact-active-class="active">
          <i class="pi pi-home"></i> Approve
        </router-link>
        <router-link to="/equipment" active-class="active">
          <i class="pi pi-map-marker"></i> Equipment
        </router-link>
        <router-link to="/return" active-class="active">
          <i class="pi pi-box"></i> Return
        </router-link>
        <router-link to="/history_staff" active-class="active">
          <i class="pi pi-history"></i> History
        </router-link>
      </nav>
    </aside>

    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
  <button class="menu-toggle" @click="toggleSidebar">☰</button>
  <div class="topbar-actions">
    <!-- กระดิ่งแจ้งเตือน -->
    <div style="position: relative;">
      <!-- BACKDROP -->
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
          <li v-for="(noti, idx) in notifications" :key="idx">
            {{ noti.message }}
          </li>
          <li v-if="notifications.length === 0">ไม่มีแจ้งเตือน</li>
        </ul>
      </div>
    </div>
    <router-link to="/profile_staff"><i class="pi pi-user"></i></router-link>
  </div>
</header>


      <!-- แถบประกาศ slide-down -->
      <transition name="slide-down">
        <div class="announcement-bar" v-if="showAnnouncementBar">
          <i class="pi pi-megaphone announcement-icon"></i>
          <div class="announcement-bar-text">{{ announcement }}</div>
          <button class="close-announcement-btn" @click="showAnnouncementBar = false">
            <i class="pi pi-times" style="color: red;"></i>
          </button>
        </div>
      </transition>

      <!-- Body -->
      <div style="background-color: #dbe9f4;">
        <h1 style="display: flex; justify-content: center;">อุปกรณ์กีฬา (Equipment)</h1>
        <div class="equipment-grid">
          <div class="equipment-card" v-for="item in equipments" :key="item._id">
            <img :src="item.image" :alt="item.name" class="equipment-image" />
            <div class="equipment-info">
              <span class="equipment-name">{{ item.name }}</span>
              <!-- ปุ่มเปิด/ปิด -->
              <button
                :class="item.visible ? 'btn-on' : 'btn-off'"
                @click="confirmToggle(item)"
              >
                {{ item.visible ? 'เปิด' : 'ปิด' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'


axios.defaults.withCredentials = true    // <------ **บรรทัดสำคัญ!**
const API_BASE = import.meta.env.VITE_API_BASE

const equipments = ref([])
const isSidebarClosed = ref(false)
const toggleSidebar = () => { isSidebarClosed.value = !isSidebarClosed.value }
const announcement = ref("")
const showAnnouncementBar = ref(false)
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null

onMounted(async () => {
  await fetchEquipments()
  try {
    const annRes = await axios.get(`${API_BASE}/api/announcement`)
    announcement.value = annRes.data?.announce || ""
    showAnnouncementBar.value = !!announcement.value
  } catch (err) {
    announcement.value = ""
    showAnnouncementBar.value = false
  }

  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
})

onBeforeUnmount(() => { if (polling) clearInterval(polling) })

async function fetchEquipments() {
  try {
    const res = await axios.get(`${API_BASE}/api/equipments`)
    equipments.value = res.data
  } catch (err) {
    equipments.value = []
  }
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) unreadCount.value = 0
}

function closeNotifications() {
  showNotifications.value = false
}


async function fetchNotifications() {
  try {
    // ดึง pending อุปกรณ์ที่ต้องอนุมัติ
    const res = await axios.get(`${API_BASE}/api/equipments/pending`)
    const data = Array.isArray(res.data) ? res.data : []
    // กรองเฉพาะ id ใหม่ ๆ ที่ยังไม่เคยแจ้ง
    const pendings = data.filter(item => !lastCheckedIds.value.has(item._id?.$oid || item._id))
    if (pendings.length) {
      const newMessages = pendings.map(item => ({
        id: item._id?.$oid || item._id,
        message: `มีอุปกรณ์ '${item.name}' ที่รออนุมัติ`
      }))
      notifications.value = [...notifications.value, ...newMessages]
      pendings.forEach(item => lastCheckedIds.value.add(item._id?.$oid || item._id))
      unreadCount.value = notifications.value.length
    }
  } catch (err) { /* ไม่ต้องแจ้งเตือน error */ }
}

// ฟังก์ชันเปิด/ปิดสถานะ พร้อม SweetAlert2
async function confirmToggle(item) {
  const willEnable = !item.visible
  const result = await Swal.fire({
    title: `คุณต้องการ${willEnable ? 'เปิด' : 'ปิด'}อุปกรณ์นี้ใช่หรือไม่?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ใช่',
    cancelButtonText: 'ยกเลิก'
  })
  if (result.isConfirmed) {
    try {
      const res = await axios.patch(`${API_BASE}/api/equipments/${item._id}`, { visible: willEnable })
      // อัปเดตสถานะบนหน้าจอทันที
      item.visible = res.data.data.visible
      Swal.fire('สำเร็จ!', `สถานะอุปกรณ์ถูก${willEnable ? 'เปิด' : 'ปิด'}แล้ว`, 'success')
    } catch (err) {
      Swal.fire('ผิดพลาด!', err.response?.data?.message || err.message, 'error')
    }
  }
}
</script>

<style scoped>
.equipment-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: flex-start;
  padding: 1rem 70px;
}
.equipment-card {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.13);
  padding: 1rem 1rem 1.5rem 1rem;
  width: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.equipment-image {
  width: 150px;
  height: 180px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  border: 1.5px solid #e5e7eb;
}
.equipment-info {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.equipment-name {
  font-size: 1.08rem;
  font-weight: 500;
}
.btn-on, .btn-off {
  border: none;
  border-radius: 18px;
  padding: 5px 22px;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.18s;
}
.btn-on {
  background: #2ecc40;
  color: #fff;
}
.btn-off {
  background: #bbb;
  color: #fff;
}
.btn-on:hover, .btn-off:hover {
  filter: brightness(0.9);
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

.notification-dropdown {
  position: absolute;
  right: 0;
  top: 36px;
  background: white;
  box-shadow: 0 4px 24px rgba(70, 70, 70, 0.14);
  border-radius: 10px;
  width: 320px;        /* กว้างขึ้นเหมือน approve_equipment */
  max-width: 90vw;
  z-index: 1500;
  padding: 10px 0;
  margin-top: 6px;
  font-size: 1rem;
}
.notification-dropdown ul {
  padding: 0 18px;
  margin: 0;
}
.notification-dropdown li {
  list-style: none;
  padding: 10px 0;
  border-bottom: 1px solid #eaeaea;
  word-break: break-word;
}
.notification-dropdown li:last-child {
  border-bottom: none;
}
.notification-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  position: relative;
  margin-right: 8px;
}
.badge {
  position: absolute;
  top: 1px;
  right: 3px;
  background: #e11d48;
  color: white;
  border-radius: 8px;
  padding: 1px 8px;
  font-size: 0.83rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
  z-index: 10;
}

.notification-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent;
  z-index: 1400;
}


</style>

<style>
@import '../css/style.css';
</style>
