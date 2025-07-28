<template>
  <div class="layout">
    <!-- Sidebar ทางซ้าย -->
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
<div
  v-if="isMobile && !isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
></div>
    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
  <div style="position: relative;">
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
  <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
</div>

      </header>

      <!-- Body -->
      <div class="probody">
        <!-- Profile -->
        <div>
          <h1 style="padding-left: 50px;">Profile</h1>
          <div class="profile-container">
  <div class="proinfo">
   <img :src="profileImageUrl" alt="profile" class="profile-img" @error="imgError" />
    <div class="profile-details" v-if="info">
      <p>Username : {{ info.name }}</p>
      <p>ID : {{ info.id }}</p>
      <p>Email : {{ info.email }}</p>
    </div>
    <div v-else>
      Loading...
              </div>
            </div>
          </div>
        </div>
        <!-- History -->
        <div>
          <h1 style="padding-left: 50px;">History</h1>
          <div class="profile-grid">
            <div class="profile-card" v-for="hist in paginatedHistory" :key="hist.id">
              <div class="profile-row">
                <span class="left">{{ hist.name }}</span>
                <span class="center" v-if="hist.type === 'field'">
                  เวลา : {{ hist.time }}
                </span>
                <span class="center" v-else-if="hist.type === 'equipment'">
                  จำนวน : {{ hist.quantity }}
                </span>
<span class="left status-group">
  <!-- สถานะ -->
  <span class="status-label">
    <template v-if="hist.status === 'Approved'">
      ✅ รายการถูกอนุมัติ
    </template>
    <template v-else-if="hist.status === 'Disapproved'">
      ❌ รายการไม่ถูกอนุมัติ
    </template>
    <template v-else-if="hist.status === 'Cancel'">
      🚫 รายการถูกยกเลิก
    </template>
    <template v-else-if="hist.status === 'Returned'">
      ✅ คืนของสำเร็จแล้ว
    </template>
    <template v-else-if="hist.status === 'Pending'">
      ⏳ กำลังรออนุมัติ
    </template>
    <template v-else>
      {{ hist.status }}
    </template>
  </span>

  <!-- ปุ่ม -->
  <span class="action-buttons">
    <template v-if="hist.status === 'Pending'">
      <button class="cancel-btn" @click="cancelItem(hist.id)">Cancel</button>
    </template>
    <button class="remark-btn" @click="detailGroup([hist])">Detail</button>
  </span>
</span>


              </div>
            </div>
          </div>
          <div class="pagination-control">
            <button @click="prevPage" :disabled="currentPage === 1">ย้อนกลับ</button>
            <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages">ถัดไป</button>
          </div>
        </div>
        <div class="logout-container">
          <button @click="logout" class="logout-btn">Logout</button>
        </div>
      </div>
      <!-- Footer -->
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Swal from 'sweetalert2'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const API_BASE = import.meta.env.VITE_API_BASE
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL

const router = useRouter()
const userStore = useUserStore()



const isMobile = ref(window.innerWidth <= 600)
const info = ref({ id: "-", name: "-", email: "-", picture: null })

const history = ref([])

const userMap = ref({}) // <<--- เพิ่ม userMap


const profileImageUrl = computed(() => {
  if (!info.value || !info.value.picture) return '/img/user.png'
  // ถ้าขึ้นต้น http = ใช้ external URL, ถ้าไม่ใช่ = ต่อ API_BASE
  if (info.value.picture.startsWith('http')) return info.value.picture
  return API_BASE + info.value.picture
})
function imgError(event) { event.target.src = '/img/user.png' }


const itemsPerPage = 5
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(history.value.length / itemsPerPage) || 1)
const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return history.value.slice(start, start + itemsPerPage)
})

// ==== กระดิ่งแจ้งเตือน ====
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null

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

async function cancelItem(id) {
  const confirmed = await Swal.fire({
    title: 'ยืนยันการยกเลิก?',
    text: 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'ใช่, ยกเลิก!',
    cancelButtonText: 'ไม่'
  });
  if (confirmed.isConfirmed) {
    try {
      await axios.delete(`${API_BASE}/api/history/${id}`);
      history.value = history.value.filter(h => h.id !== id);
      Swal.fire('ยกเลิกแล้ว!', 'รายการของคุณถูกยกเลิกเรียบร้อยแล้ว', 'success');
    } catch (err) {
      Swal.fire('ผิดพลาด', 'ลบข้อมูลไม่สำเร็จ', 'error');
    }
  }
}
function detailGroup(items) {
  let html = '<div style="text-align:left;">'
  items.forEach((item, i) => {
    if (item.type === 'field') {
      html += `
        <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #bbb;">
          <b>ชื่อ:</b> ${item.name || '-'}<br>
          <b>ชื่อผู้ขอใช้:</b> ${item.requester || '-'}<br>
          <b>วันที่ขอ:</b> ${item.date ? new Date(item.date).toLocaleDateString('th-TH') : '-'}<br>
          <b>สถานะ:</b> ${item.status || '-'}<br>
        </div>
      `
    } else {
      html += `
        <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #bbb;">
          <b>ชื่อ:</b> ${item.name || '-'}<br>
          <b>จำนวน:</b> ${item.quantity || '-'}<br>
          <b>ชื่อผู้ขอใช้:</b> ${item.requester || '-'}<br>
          <b>วันที่ขอยืม:</b> ${item.date ? new Date(item.date).toLocaleDateString('th-TH') : '-'}<br>
          <b>สถานะ:</b> ${item.status || '-'}<br>
          <b>วันที่คืน:</b> ${item.returnedAt ? formatDate(item.returnedAt) : '-'}
        </div>
      `
    }
  })
  html += '</div>'
  Swal.fire({
    title: 'รายละเอียดรายการ',
    html,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3085d6'
  })
}

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return !isNaN(d) ? d.toLocaleDateString('th-TH') : '-'
}

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
            message: `สนาม '${item.name}' กำลังรอการอนุมัติ`
          }
        } else if (item.type === 'equipment') {
          return {
            id: item._id?.$oid || item._id,
            message: `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
          }
        }
      })
      notifications.value = [...notifications.value, ...newMessages]
      pendings.forEach(item => lastCheckedIds.value.add(item._id?.$oid || item._id))
      unreadCount.value = notifications.value.length
    }
  } catch (err) {}
}

// ===============================

onMounted(async () => {
   window.addEventListener('resize', handleResize)
  handleResize()
  document.addEventListener('mousedown', handleClickOutside)
  try {
    // 1. ดึงข้อมูล user login ปัจจุบัน (session จริง)
    const resMe = await axios.get(`${API_BASE}/api/me`, { withCredentials: true })
    if (resMe.data && resMe.data.user) {
      info.value = {
        id: resMe.data.user.user_id,
        name: resMe.data.user.name,
        email: resMe.data.user.email,
         picture: resMe.data.user.picture
      }
    } else {
      info.value = { id: '-', name: '-', email: '-' }
      router.push('/login')
      return
    }

    // 2. ดึง user ทั้งหมดมาสร้าง userMap (user_id => name)
    try {
      const resUsers = await axios.get(`${API_BASE}/api/users`, { withCredentials: true })
      const map = {}
      if (Array.isArray(resUsers.data)) {
        resUsers.data.forEach(u => map[u.user_id] = u.name)
      }
      userMap.value = map
    } catch (e) {
      userMap.value = {}
    }

    // 3. โหลดประวัติทั้งหมด
    const userId = info.value.id
    const resHistory = await axios.get(`${API_BASE}/api/history`, { withCredentials: true })
    let histories = resHistory.data

    // กรองเฉพาะประวัติที่ตัวเองเป็นคนขอ หรือเป็นคน approve/disapprove/cancel
    let result = histories.filter(h =>
   h.user_id === userId ||
   h.approvedById === userId ||
   h.disapprovedById === userId ||
   h.canceledById === userId ||
   h.returnedById === userId
 )

    // ลบซ้ำ
    let seen = new Set()
    let unique = []
    for (let h of result) {
      let id = h._id?.$oid || h._id
      if (!seen.has(id)) {
        seen.add(id)
        unique.push(h)
      }
    }

    // map ข้อมูลสำหรับแสดงผล
    let mapped = unique.map((h, idx) => ({
      id: h._id?.$oid || h._id || idx + 1,
      type: h.type,
      name: h.name,
      time: h.type === "field" ? `${h.startTime || "-"} - ${h.endTime || "-"}` : "",
      quantity: h.type === "equipment" ? h.quantity : "",
      status: statusLabel(h.status),
      approvedBy: h.approvedBy,
      approvedById: h.approvedById,
      disapprovedBy: h.disapprovedBy,
      disapprovedById: h.disapprovedById,
      canceledBy: h.canceledBy,
      canceledById: h.canceledById,
      approvedAt: h.approvedAt,
      disapprovedAt: h.disapprovedAt,
      canceledAt: h.canceledAt,
      date: h.date,
      requester: userMap.value[h.user_id] || h.user_id || "-"
    }))

    // เรียงจากล่าสุด
    mapped = mapped.sort((a, b) => new Date(b.approvedAt || b.disapprovedAt || b.canceledAt || b.date || 0) - new Date(a.approvedAt || a.disapprovedAt || a.canceledAt || a.date || 0))

    history.value = mapped
  } catch (err) {
    info.value = { id: '-', name: '-', email: '-' }
    history.value = []
    router.push('/login')
  }

  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  clearInterval(polling)
  window.removeEventListener('resize', handleResize)
})

function statusLabel(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved': return 'Approved'
    case 'pending': return 'Pending'
    case 'returned': return 'Returned'
    case 'disapproved': return 'Disapproved'
    case 'cancel': return 'Cancel'
    default: return status
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}
function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

async function logout() {
  const result = await Swal.fire({
    title: 'ต้องการออกจากระบบ-?',
    text: "คุณต้องการออกจากระบบใช่หรือไม่",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ใช่, ออกจากระบบ',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'GET',
        credentials: 'include'
      });
    } catch (err) {
      // error ก็ ignore ได้
    }
    localStorage.removeItem('jwt');
    localStorage.removeItem('user_id');
    if (userStore && userStore.$reset) userStore.$reset();

    window.location.href =
      `https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=${FRONTEND_URL}/login`;
  }
}

const isSidebarClosed = ref(false)
function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

function handleResize() {
  isMobile.value = window.innerWidth <= 600
  if (!isMobile.value) isSidebarClosed.value = false
}
</script>





<style scoped>

.probody{
    background-color: #ffffff;
    width: 100%;
    height: 100vh;
    padding: 20px;
    box-sizing: border-box;
    overflow-x: hidden;
}

.proinfo{
  background-color: rgb(235, 235, 235);
  border-radius: 20px;
  padding: 30px 40px;
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
  min-height: 160px;
}
.profile-img {
  height: 120px;
  width: 120px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 1px 12px #e3e3e3;
  margin-right: 24px;
}
.profile-details {
  color: #333;
  font-size: 1rem;
  padding-left: 12px;
}
.profile-container {
  padding: 1rem 70px;
}

.profile-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 70px;
}

.profile-card {
  background-color: rgb(235, 235, 235);
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  padding: 1rem 1.5rem;
  width: 100%;
}

.profile-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: #333;
}

.left, .center, .right {
  flex: 1;
}

.left {
  text-align: left;
}

.center {
  text-align: center;
}

.status-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 260px;
}
.pending-status {
  /* สถานะอยู่ซ้ายสุด */
  flex-shrink: 0;
  margin-right: 16px;
}
.pending-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
  /* ทำให้ปุ่มไปขวาสุด */
}

.status-label {
  flex-shrink: 0;
  /* สถานะติดซ้าย */
}
.action-buttons {
  margin-left: auto;
  display: flex;
  gap: 8px;
  /* ปุ่มไปขวาสุด */
}

.logout-container {
  display: flex;
  justify-content: flex-end; 
  margin: 0px 70px 20px 0px;
}
.logout-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-weight: 600;
  margin-top: 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.logout-btn:hover {
  background: #dc2626;
}
.pagination-control {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px 0 8px 0;
  gap: 8px;
}
.pagination-control button {
  background: #1d4ed8;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.pagination-control button:disabled {
  background: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 4px 10px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}
.cancel-btn:hover {
  background-color: #d9363e;
}
.remark-btn {
  background-color: #213555;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 14px;
  cursor: pointer;
  margin-left: 8px;
  font-size: 0.95rem;
  transition: background 0.2s;
}
.remark-btn:hover {
  background-color: #4268a3;
}

.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.16);
  z-index: 1100;
}
.sidebar {
  z-index: 1200;
}

@media (max-width: 600px) {
  .profile-container {
    overflow-x: auto;
    padding: 0 !important;
    margin-bottom: 8px;
    width: 100vw;
  }
  .proinfo {
    min-width: 370px;
    width: max-content;
    padding: 20px 20px;
    box-sizing: border-box;
    overflow-x: auto;
  }
  .profile-grid {
    padding: 0 2px !important;
  }
  .profile-card {
    padding: 1rem 1.5rem;
    margin-bottom: 8px;
    overflow-x: auto;
    width: 100vw;
    box-sizing: border-box;
  }
  .profile-row {
    min-width: 650px; /* ลองเพิ่มเป็น 650px ถ้ายังไม่พอ */
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .status-group {
    min-width: 180px;
    flex-shrink: 0;
  }
  .remark-btn {
    margin-left: 8px;
    white-space: nowrap;
  }
  .pending-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pending-row .remark-btn,
  .pending-row .cancel-btn {
    margin-left: 0;
    margin-right: 0;
  }
}



</style>
<style>
@import '../css/style.css';
</style>
