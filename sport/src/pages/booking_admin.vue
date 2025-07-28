<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">Sport Complex MFU</p>
      </div>
      <nav class="nav-links">
        <router-link to="/dashboard" exact-active-class="active"><i class="pi pi-chart-pie"></i> Dashboard</router-link>
        <router-link to="/home_admin" exact-active-class="active"><i class="pi pi-megaphone"></i> Edit News</router-link>
        <router-link to="/edit_field" active-class="active"><i class="pi pi-map-marker"></i> Edit Field</router-link>
        <router-link to="/edit_equipment" active-class="active"><i class="pi pi-clipboard"></i> Edit Equipment</router-link>
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> Book Field</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> Approve</router-link>
        <router-link to="/return_admin" active-class="active">
          <i class="pi pi-box"></i> Return
        </router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> Member</router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> History System</router-link>
      </nav>
    </aside>
<div
  v-if="isMobile && !isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
></div>
    <!-- Main Content -->
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

      <!-- Body -->
      <div class="probody-flex">
        <!-- Left -->
        <div class="left-column">
          <img :src="currentImage" alt="Field" class="field-image" />
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
          <!-- ปุ่ม BOOKING เฉพาะ mobile -->
  <div v-if="isMobile" class="booking-btn-wrapper">
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
            Tel. 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
            Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_BASE

const route = useRoute()
const router = useRouter()

const isSidebarClosed = ref(false)
const selectedZoneName = ref(null)
const field = ref(null)
const fieldName = ref(route.query.fieldName || '')
const isMobile = ref(false)
// ====== กระดิ่งแจ้งเตือน (dashboard-style, พร้อม close/handleClickOutside) ======
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null
function checkMobile() {
  isMobile.value = window.innerWidth <= 600
}
function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) unreadCount.value = 0
}
function closeNotifications() {
  showNotifications.value = false
}
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
// ====== /กระดิ่งแจ้งเตือน ======

// ====== รูปสนาม/โซน ======
function resolveImagePath(img) {
  if (!img) return '/img/default.png'
  if (img.startsWith('data:image/')) return img
  if (img.startsWith('/img/')) return img
  return `/img/${img}`
}
const defaultImage = computed(() => {
  if (!field.value) return '/img/default.png'
  return resolveImagePath(field.value.image)
})
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
const zoneRequired = computed(() => {
  return field.value && field.value.hasZone && field.value.zones && field.value.zones.length > 0
})

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
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
    path: '/form_field_admin',
    query: {
      fieldName: fieldName.value,
      zone: selectedZoneName.value
    }
  })
}

onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)

  checkMobile()
  window.addEventListener('resize', checkMobile)
  // โหลด field สำหรับ booking admin
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

  // โหลดแจ้งเตือนทันที และตั้ง poll ทุก 30 วิ
  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
  document.removeEventListener('mousedown', handleClickOutside)
window.removeEventListener('resize', checkMobile)
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
}
.right-column {
  flex: 1 1 35%;
  max-width: 35%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 600px;
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
/* ================== ส่วนโซนใหม่ ================== */
.zone-selector {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0;
}
.zone-label {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 10px;
  align-self: center;
}
.zone-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.zone-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  margin-top: 24px;
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
/* =============================================== */
@media (max-width: 600px) {
  .probody-flex {
    flex-direction: column !important;
    gap: 1rem !important;
    padding: 8px !important;
    overflow-x: auto !important;
  }
  .left-column, .right-column {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
  }
  .calendar-wrapper {
    overflow-x: auto;
    width: 100vw;
    min-width: 320px;
    /* ถ้าตารางล้นจะเลื่อนได้ */
  }
  .booking-btn-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-top: 12px;
    margin-bottom: 10px;
  }
  .booking-btn {
    width: 80vw !important;
    max-width: 400px;
    font-size: 1.2rem;
    padding: 16px 0;
    border-radius: 999px;
  }
  .right-column {
    display: none !important;
  }
}
.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.22);
  z-index: 1999;
}
.sidebar {
  z-index: 2000;
}
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
}
.right-column {
  flex: 1 1 35%;
  max-width: 35%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 600px;
}
</style>
<style>
@import '../css/style.css';
</style>