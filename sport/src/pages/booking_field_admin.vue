<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/dashboard" exact-active-class="active">
          <i class="pi pi-chart-pie"></i> Dashboard
        </router-link>
        <router-link to="/home_admin" exact-active-class="active">
          <i class="pi pi-megaphone"></i> Edit News
        </router-link>
        <router-link to="/edit_field" active-class="active">
          <i class="pi pi-map-marker"></i> Edit Field
        </router-link>
        <router-link to="/edit_equipment" active-class="active">
          <i class="pi pi-clipboard"></i> Edit Equipment
        </router-link>
        <router-link to="/booking_field_admin" active-class="active">
          <i class="pi pi-map-marker"></i> Book Field
        </router-link>
        <router-link to="/approve_field" active-class="active">
          <i class="pi pi-verified"></i> Approve
        </router-link>
        <router-link to="/return_admin" active-class="active">
          <i class="pi pi-box"></i> Return
        </router-link>
        <router-link to="/members" active-class="active">
          <i class="pi pi-user-edit"></i> Member
        </router-link>
        <router-link to="/history_admin" active-class="active">
          <i class="pi pi-history"></i> History System
        </router-link>
      </nav>
    </aside>

    <!-- Content -->
    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <div>
            <div v-if="showNotifications" class="notification-backdrop" @click="closeNotifications"></div>
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
          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- แถบประกาศ -->
      <transition name="slide-down">
        <div class="announcement-bar" v-if="showAnnouncementBar">
          <i class="pi pi-megaphone announcement-icon"></i>
          <div class="announcement-bar-text">{{ announcement }}</div>
          <button class="close-announcement-btn" @click="showAnnouncementBar = false">
            <i class="pi pi-times" style="color: red;"></i>
          </button>
        </div>
      </transition>

      <section class="content">
        <p style="padding-top: 5px;"></p>
        <div class="block">
          <h3 style="padding-top: 40px;">Field</h3>
          <div class="grid">
            <div class="card" v-for="field in fields" :key="field._id">
              <img :src="field.image" :alt="field.name" class="field-image" />
              <div class="card-content">
                <h4>{{ field.name }}</h4>
              </div>
              <button
                class="book-btn"
                :class="{ disabled: !field.visible }"
                :disabled="!field.visible"
                @click="goToBooking(field)"
              >
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE

const fields = ref([])
const isSidebarClosed = ref(false)
const announcement = ref("")
const showAnnouncementBar = ref(false)

const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null

const router = useRouter()

function resolveImagePath(img) {
  if (!img) return '/img/default.png'
  if (img.startsWith('data:image/')) return img
  if (img.startsWith('/img/')) return img
  return `/img/${img}`
}

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) unreadCount.value = 0
}
function closeNotifications() {
  showNotifications.value = false
}

// ปิดแจ้งเตือนเมื่อคลิกข้างนอก dropdown
function handleClickOutside(event) {
  const notifDropdown = document.querySelector('.notification-dropdown')
  const notifBtn = document.querySelector('.notification-btn')
  if (
    notifDropdown &&
    !notifDropdown.contains(event.target) &&
    notifBtn &&
    !notifBtn.contains(event.target)
  ) {
    closeNotifications()
  }
}

// แจ้งเตือน admin เฉพาะ pending ทั้ง field/equipment
async function fetchNotifications() {
  try {
    const res = await axios.get(`${API_BASE}/api/history/approve_field`)
    const data = Array.isArray(res.data) ? res.data : []
    const pendings = data.filter(item =>
      item.status === 'pending' &&
      (item.type === 'field' || item.type === 'equipment') &&
      !lastCheckedIds.value.has(item._id?.$oid || item._id)
    )
    if (pendings.length) {
      const newMessages = pendings.map(item => {
        if (item.type === 'field') {
          return {
            id: item._id?.$oid || item._id,
            type: 'pending',
            message: `สนาม '${item.name}' กำลังรอการอนุมัติ`
          }
        } else if (item.type === 'equipment') {
          return {
            id: item._id?.$oid || item._id,
            type: 'pending',
            message: `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
          }
        }
      })
      notifications.value = [...notifications.value, ...newMessages]
      pendings.forEach(item => lastCheckedIds.value.add(item._id?.$oid || item._id))
      unreadCount.value = notifications.value.length
    }
  } catch (err) {
    // ไม่แจ้ง error
  }
}

// ไปหน้าจอง (ใช้ /booking_admin) พร้อมส่ง query
function goToBooking(field) {
  if (!field.visible) return
  router.push({
    path: '/booking_admin',
    query: {
      fieldName: field.name,
      hasZone: field.hasZone ? 'true' : 'false',
      zone: (field.hasZone && field.zones && field.zones.length > 0) ? field.zones[0].name : ''
    }
  })
}

onMounted(async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/fields`)
    fields.value = res.data.map(field => ({
      ...field,
      image: resolveImagePath(field.image)
    }))
  } catch (err) {
    console.error('ไม่สามารถโหลดข้อมูลสนาม:', err)
  }

  try {
    const annRes = await axios.get(`${API_BASE}/api/announcement`)
    announcement.value = annRes.data?.announce || ""
    showAnnouncementBar.value = !!announcement.value && announcement.value.trim().length > 0
  } catch {
    announcement.value = ""
    showAnnouncementBar.value = false
  }

  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>


<style scoped>
.field-image {
  width: 100%;
  max-width: 200px;
  height: 120px;
  object-fit: contain !important;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  background: #fff;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.content {
  flex: 1;
  padding: 1.5rem;
  background-color: #dbe9f4;
  overflow-y: auto;
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 1rem;
  width: 220px;
  text-align: center;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  min-height: 260px;
}

.card:hover {
  transform: translateY(-4px);
}

.card img {
  width: 200px;
  height: 120px;
  object-fit: contain;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  background: #fff;
}

.card h4 {
  word-break: break-word;
  overflow-wrap: break-word;
  margin-bottom: 0.5rem;
  min-height: 40px;
  max-height: 56px;
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


</style>
