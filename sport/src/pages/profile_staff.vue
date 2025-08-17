<template>
  <div class="layout">
    <!-- Sidebar ทางซ้าย -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/approve_equipment" exact-active-class="active">
          <i class="pi pi-home"></i> อนุมัติ/รับคืนอุปกรณ์
        </router-link>
        <router-link to="/equipment" active-class="active">
          <i class="pi pi-map-marker"></i> อุปกรณ์
        </router-link>
        <router-link to="/history_staff" active-class="active">
          <i class="pi pi-history"></i> ประวัติการทำรายการ
        </router-link>
      </nav>
    </aside>

    <div
      v-if="!isSidebarClosed && isMobile"
      class="sidebar-overlay"
      @click="isSidebarClosed = true"
    ></div>

    <!-- Content ทางขวา -->
    <div class="main">
      <!-- Topbar (Header เล็ก) -->
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
                v-for="(noti, idx) in notifications.slice(0, 10)"
                :key="noti.id || idx"
                :class="['notification-item', noti.type || '', { unread: noti.timestamp > lastSeenTimestamp }]"
              >
                {{ noti.message }}
              </li>
              <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
            </ul>
          </div>

          </div>
          <router-link to="/profile_staff"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- Body -->
      <div class="probody">
        <!-- Profile -->
        <div>
          <h1 style="padding-left: 50px;">Profile</h1>
          <div class="profile-scroll-container">
            <div class="profile-container">
              <div class="proinfo">
                <!-- ใช้ dynamic src -->
                <img :src="profileImageUrl" alt="profile" class="profile-img" @error="imgError" />

                <div class="profile-details" v-if="info">
                  <p class="info-line">
                    <span class="label">Username :</span>
                    <span class="value">{{ info.name }}</span>
                  </p>
                  <!-- <div class="editable-row">
  <span>ID :</span>
  <template v-if="!editId">
    <span>{{ info.id }}</span>
    <button
      v-if="canEditUserId"
      class="edit-btn"
      @click="startEdit"
    >แก้ไข</button>
  </template>
  <template v-else>
    <input v-model="editUserId" style="padding:6px 12px;font-size:1rem;border-radius:4px;border:1px solid #d1d5db;" />
    <button class="save-btn" @click="saveUserId">บันทึก</button>
    <button class="cancel-btn" @click="cancelEdit">ยกเลิก</button>
  </template>
</div> -->

                  <p class="info-line">
                    <span class="label">Email :</span>
                    <span class="value">{{ info.email }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="logout-container">
          <button @click="logout" class="logout-btn">ออกจากระบบ</button>
        </div>
      </div>

      <!-- Footer -->
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

axios.defaults.withCredentials = true

const API_BASE = import.meta.env.VITE_API_BASE // ให้ตรงกับ backend
const isMobile = ref(window.innerWidth <= 600)
const isSidebarClosed = ref(false)
const router = useRouter()


// ดึงข้อมูล user จาก API (ไม่ใช้ userStore.user แล้ว)
const info = ref({ id: "-", name: "-", email: "-", picture: null })

const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null
const lastSeenTimestamp = ref(0)

// Render รูป profile ถูกต้อง
const profileImageUrl = computed(() => {
  if (!info.value || !info.value.picture) return '/img/user.png'
  if (info.value.picture.startsWith('http')) return info.value.picture
  return API_BASE + info.value.picture
})
function imgError(event) {
  event.target.src = '/img/user.png'
}

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

function checkMobile() {
  isMobile.value = window.innerWidth <= 600
  if (isMobile.value) {
    isSidebarClosed.value = true
  }
}

// LOGOUT
async function logout() {
  const result = await Swal.fire({
    title: 'คุณต้องการออกจากระบบหรือไม่',
    // text: "คุณต้องการออกจากระบบใช่หรือไม่",
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
function closeNotifications() { showNotifications.value = false }
function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('staff_lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}

function pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 วัน
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

async function fetchNotifications() {
  try {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)

    // ล้างของเก่ากว่า 7 วันทุกครั้งก่อน
    pruneOldNotifications()

    // ดึง pending สำหรับ staff
    const res = await axios.get(`${API_BASE}/api/equipments/pending`)
    const data = Array.isArray(res.data) ? res.data : []

    // เอาเฉพาะ id ใหม่ที่ยังไม่เคยแจ้ง
    const fresh = data.filter(item => !lastCheckedIds.value.has(item._id?.$oid || item._id))

    if (fresh.length) {
      const newMessages = fresh.map(item => {
        const ts =
          item.updatedAt ? new Date(item.updatedAt).getTime() :
          item.createdAt ? new Date(item.createdAt).getTime() :
          item.date      ? new Date(item.date).getTime()      :
          Date.now()
        return {
          id: item._id?.$oid || item._id,
          type: 'pending',
          timestamp: ts,
          message: `มีรายการ '${item.name}' ที่รออนุมัติ`
        }
      })

      // รวม + กันซ้ำ + เรียงล่าสุดก่อน
      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp)

      // ตัดที่เก่ากว่า 7 วันอีกรอบ
      pruneOldNotifications()

      // มาร์คว่าเคยเห็น id แล้วกันเด้งซ้ำ
      fresh.forEach(item => lastCheckedIds.value.add(item._id?.$oid || item._id))
    }

    // นับ unread เฉพาะที่ timestamp > lastSeenTimestamp
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch (err) { /* เงียบตามเดิม */ }
}

// ---------- ส่วนของ "แก้ไข user_id" ----------

// ตัวแปรควบคุมโหมด edit และค่าใหม่
const editId = ref(false)
const editUserId = ref('')

// เฉพาะ email @mfu.ac.th เท่านั้นถึงจะแก้ user_id ได้
const canEditUserId = computed(() => {
  return info.value?.email?.toLowerCase().endsWith('@mfu.ac.th')
})

function startEdit() {
  editUserId.value = info.value.id
  editId.value = true
}
function cancelEdit() {
  editId.value = false
}
async function saveUserId() {
  if (!editUserId.value.trim()) {
    Swal.fire('กรุณากรอก user id', '', 'warning')
    return
  }
  try {
    // ตัวอย่าง API ปรับให้ตรง backend จริง
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

// ---------- END ส่วนของ "แก้ไข user_id" ----------

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

  lastSeenTimestamp.value = parseInt(localStorage.getItem('staff_lastSeenTimestamp') || '0')
  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => {
  clearInterval(polling)
  window.removeEventListener('resize', checkMobile)
})

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
  min-width: 400px; /* กำหนดความกว้างขั้นต่ำ */
  max-width: 100%;  /* จำกัดไม่ให้เกินพื้นที่ของ container */
  box-sizing: border-box; /* นับ padding ในความกว้าง */
  overflow-x: auto; /* ให้เลื่อนแนวนอนได้ ถ้ากว้างเกิน */
  word-break: break-word; /* ตัดคำเมื่อยาวเกิน */
}

.profile-details {
  color: #333;
  font-size: 1.07rem;
  padding-left: 12px;

  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 300px; /* ลดขนาดเพื่อให้ข้อความไม่ล้น */
  box-sizing: border-box;
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

  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 300px; /* ลดขนาดเพื่อให้ข้อความไม่ล้น */
  box-sizing: border-box;
}

.profile-container {
  min-width: 360px; /* กำหนดความกว้างขั้นต่ำ */
  padding: 1rem 0;
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
.notification-dropdown {
  position: absolute;
  right: 0;
  top: 36px;
  background: white;
  box-shadow: 0 4px 24px rgba(70, 70, 70, 0.14);
  border-radius: 10px;
  width: 320px;
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

.profile-scroll-container {
  overflow-x: auto;
  padding: 0 70px;  /* ระยะขอบเหมือนหน้า approve_equipment */
  box-sizing: border-box;
}

.info-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0;
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
  /* ขนาดเท่ากันทุกปุ่ม */
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

/* เพิ่ม gap ระหว่าง input กับปุ่ม */


.editable-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  /* ป้องกันเคาะขึ้นบรรทัด */
}
.editable-row > * {
  white-space: nowrap;
}




/* ทำให้แสดงบรรทัดเดียวเฉพาะ desktop */
@media screen and (min-width: 601px) {
  .info-line {
    flex-wrap: nowrap;
  }

  .info-line .label,
  .info-line .value {
    white-space: nowrap;
  }
}

</style>

<style>
@import '../css/style.css';
</style>