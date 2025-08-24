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
<div
  v-if="!isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
></div>
    <!-- Content -->
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
        v-for="(noti, idx) in notifications.slice(0, 10)"
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

      <!-- Body -->
      <div class="probody">
        <!-- Profile -->
        <div>
          <h1 style="padding-left: 50px;">Profile</h1>
          <div class="profile-container">
  <div class="proinfo">
    <!-- ใช้ dynamic src -->
    <img :src="profileImageUrl" alt="profile" class="profile-img" @error="imgError" />

    <div class="profile-details" v-if="info">
      <p>Username : {{ info.name }}</p>
      <p>Email : {{ info.email }}</p>
    </div>
  </div>
</div>
        </div>
        <div class="logout-container">
          <button @click="logout" class="logout-btn">Logout</button>
        </div>
      </div>

     <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel: 0-5391-7820 and 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a>
            |
            Email:
            <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
          <p>© 2025 Center for Information Technology Services, Mae Fah Luang University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE // ให้ตรงกับ backend

const products = ref([])
const isSidebarClosed = ref(false)
const router = useRouter()
const userId = localStorage.getItem('user_id') || ''

const editId = ref(false)
const editUserId = ref('')
const canEditUserId = computed(() => {
  return info.value?.email?.toLowerCase().endsWith('@mfu.ac.th')
})


// ดึงข้อมูล user จาก API (ไม่ใช้ userStore.user แล้ว)
const info = ref({ id: "-", name: "-", email: "-", picture: null })

const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = new Set()
const lastSeenTimestamp = ref(parseInt(localStorage.getItem('lastSeenTimestamp') || '0'))
let polling = null

// Render รูป profile ถูกต้อง
const profileImageUrl = computed(() => {
  if (!info.value || !info.value.picture) return '/img/user.png'
  if (info.value.picture.startsWith('http')) return info.value.picture
  return API_BASE + info.value.picture
})
function imgError(event) {
  event.target.src = '/img/user.png'
}

function pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

async function saveUserId() {
  if (!editUserId.value.trim()) {
    Swal.fire('กรุณากรอก user id', '', 'warning')
    return
  }
  try {
    const res = await axios.patch(`${API_BASE}/api/users/update_id`, {
      old_user_id: info.value.id,
      new_user_id: editUserId.value.trim(),
    }, { withCredentials: true })

    if (res.data && res.data.success) {
      info.value.id = editUserId.value.trim()
      Swal.fire('บันทึกสำเร็จ', '', 'success')
      editId.value = false
    } else {
      Swal.fire('เกิดข้อผิดพลาด', res.data?.message || '', 'error')
    }
  } catch (e) {
    Swal.fire('เกิดข้อผิดพลาด', e.response?.data?.message || e.message, 'error')
  }
}


function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
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

// LOGOUT
async function logout() {
  const result = await Swal.fire({
    title: 'Log out',
    text: "Do you want to log out?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes',
    cancelButtonText: 'No'
  });

  if (result.isConfirmed) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'GET',
        credentials: 'include'
      });
    } catch (err) {}
    localStorage.removeItem('jwt');
    localStorage.removeItem('user_id');
    // ถ้ามี userStore ให้รีเซ็ต (กันค้าง)
    try { 
      const { useUserStore } = await import('@/stores/userStore');
      useUserStore().$reset?.();
    } catch(e){}
    window.location.href =
      'https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://localhost:5173/login';
  }
}

// Notification
function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}
function closeNotifications() {
  showNotifications.value = false
}

async function fetchNotifications() {
  if (!userId) return
  try {
    // ตัดรายการเกิน 7 วันก่อนเสมอ
    pruneOldNotifications()

    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const newNotis = res.data.filter(item =>
      (['approved', 'disapproved', 'cancel', 'canceled', 'returned']
        .includes((item.status || '').toLowerCase())) &&
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

      // รวม + กันซ้ำ + เรียงใหม่สุดอยู่บน
      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp)

      // ตัดแจ้งเตือนเกิน 7 วันหลังรวม
      pruneOldNotifications()

      newNotis.forEach(item => lastCheckedIds.add(item._id))
    }

    // นับ unread เฉพาะที่ใหม่กว่าครั้งล่าสุดที่เปิดกระดิ่ง
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch (err) {
    // เงียบไว้เหมือนเดิม
  }
}


onMounted(async () => {
  // ดึง user profile สดใหม่เสมอ
  try {
    const res = await axios.get(`${API_BASE}/api/me`, { withCredentials: true })
    if (res.data && res.data.user) {
      info.value = {
        id: res.data.user.user_id,
        name: res.data.user.name,
        email: res.data.user.email,
        picture: res.data.user.picture
      }
    } else {
      router.push('/login')
      return
    }
  } catch (e) {
    router.push('/login')
    return
  }

   await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  fetchNotifications()
  setInterval(fetchNotifications, 30000)
   loadCart()
})

onUnmounted(() => clearInterval(polling))
</script>
<style scoped>
.probody {
  background-color: #dbe9f4;
  width: 100%;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  overflow-x: hidden;
}
.proinfo {
  background-color: white;
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
  font-size: 1.07rem;
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
  background-color: white;
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
.center {
  text-align: center;
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

.notification-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent;
  z-index: 1001; /* ต้องน้อยกว่า .notification-dropdown (1002) */
}
.proinfo {
  background-color: white;
  border-radius: 20px;
  padding: 30px 60px 30px 40px; /* padding-top 30, right 60, bottom 30, left 40 */
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
  min-height: 160px;

  overflow-x: auto;
  max-width: 100%;
}


.edit-btn, .save-btn, .cancel-btn {
  margin-left: 8px;
  background: #f59e42;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 18px;
  cursor: pointer;
  transition: background 0.2s;
  min-width: 80px;
  min-height: 20px;
  box-sizing: border-box;
  outline: none;
  display: inline-block;
}

.save-btn { background: #22c55e; }
.save-btn:hover { background: #15803d; }

.cancel-btn { background: #ef4444; }
.cancel-btn:hover { background: #dc2626; }

.edit-btn { background: #f59e42; }
.edit-btn:hover { background: #ea580c; }

.editable-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.editable-row > * {
  white-space: nowrap;
}

/* สำหรับจอมือถือ */
@media (max-width: 768px) {
  .profile-container {
    padding: 1rem 15px;  /* ลดระยะห่างด้านข้าง */
  }

  .proinfo {
    width: 100%;         /* ให้กว้างเต็ม container */
    max-width: 100%;     /* เอาขีดจำกัดออก */
    padding: 20px;       /* padding ด้านในพอดี */
  }

  .logout-container {
    margin: 10px 15px 20px 0; /* ระยะขอบขวา = 15px เหมือน .profile-container */
    display: flex;
    justify-content: flex-end; /* ชิดขวา */
  }
}



</style>

<style>
@import '../css/style.css';
</style>