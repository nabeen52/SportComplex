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

<div
  v-if="isMobile && !isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
></div>
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
          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- แถบประกาศ -->
      <transition name="slide-down">
  <div class="announcement-bar" v-if="showAnnouncementBar">
    <span class="announcement-icon">
      <i class="pi pi-megaphone"></i>
    </span>
    <span class="announcement-bar-text">
      {{ announcement }}
    </span>
    <button class="close-announcement-btn" @click="showAnnouncementBar = false" aria-label="ปิดประกาศ">
      <span class="close-icon">
        <i class="pi pi-times"></i>
      </span>
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
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp';

const lastSeenTimestamp = ref(0); 
const fields = ref([])
const isSidebarClosed = ref(false)
const announcement = ref("")
const showAnnouncementBar = ref(false)
const isMobile = ref(false)
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null

const router = useRouter()
function checkMobile() {
  isMobile.value = window.innerWidth <= 600
}
function resolveImagePath(img) {
  if (!img) return '/img/default.png'
  if (img.startsWith('data:image/')) return img
  if (img.startsWith('/img/')) return img
  return `/img/${img}`
}

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}


function pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // เก็บ 7 วัน
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff);
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value;
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now();
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(lastSeenTimestamp.value));
    unreadCount.value = 0; // เคลียร์ badge เมื่อเปิดดู
  }
}

function closeNotifications() {
  showNotifications.value = false;
}

// ปิดแจ้งเตือนเมื่อคลิกข้างนอก dropdown
function handleClickOutside(event) {
  const notifDropdown = document.querySelector('.notification-dropdown');
  const notifBtn = document.querySelector('.notification-btn');
  if (
    notifDropdown &&
    !notifDropdown.contains(event.target) &&
    notifBtn &&
    !notifBtn.contains(event.target)
  ) {
    closeNotifications();
  }
}

// แจ้งเตือน admin เฉพาะ pending ทั้ง field/equipment
async function fetchNotifications() {
  try {
    pruneOldNotifications();

    const res = await axios.get(`${API_BASE}/api/history/approve_field`);
    const data = Array.isArray(res.data) ? res.data : [];

    const pendings = data.filter(item =>
      item.status === 'pending' &&
      (item.type === 'field' || item.type === 'equipment')
    );

    if (pendings.length) {
      const newMessages = pendings.map(item => {
        const id = item._id?.$oid || item._id;
        const ts =
          (item.updatedAt && new Date(item.updatedAt).getTime()) ??
          (item.createdAt && new Date(item.createdAt).getTime()) ??
          (item.date && new Date(item.date).getTime()) ??
          Date.now();

        return {
          id,
          type: 'pending',
          timestamp: ts,
          message: item.type === 'field'
            ? `สนาม '${item.name}' กำลังรอการอนุมัติ`
            : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
        };
      });

      // รวม-ลบซ้ำตาม id แล้วเรียงใหม่ล่าสุดก่อน
      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      pruneOldNotifications();
    }

    // badge = จำนวน noti ที่ timestamp > lastSeenTimestamp
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length;
  } catch {}
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
  checkMobile()
  window.addEventListener('resize', checkMobile)
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

  lastSeenTimestamp.value = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0');

  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
  document.removeEventListener('mousedown', handleClickOutside)
window.removeEventListener('resize', checkMobile)
})
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
/* ตัวแถบประกาศ */
.announcement-bar {
  display: flex;
  align-items: center;  
  gap: 1.2rem;
  width: 100%;
  max-width: 900px; 
  margin: 12px auto;
  background: #ffeaeac8; /* ชมพูอ่อนแบบ danger alert */
  color: #e53e3e;      /* ฟอนต์แดง */
  font-size: 1.15rem;
  font-weight: 500;
  border-radius: 12px;
  padding: 1rem 2rem;
   box-shadow: 0 4px 18px rgba(255, 80, 80, 0.13);
  border: 1.5px solid #fdb6b6;
  position: sticky;
  top: 60px;                  /* ระยะห่างจากขอบบน ปรับให้เท่ากับความสูง navbar */
  z-index: 900;               /* ให้อยู่เหนือเนื้อหา แต่ต่ำกว่า navbar */
}
.announcement-icon {
  width: 34px;
  height: 34px;
  min-width: 34px;
  min-height: 34px;
  background: #ff5a5f;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 7px;
  box-shadow: 0 1px 5px #ffbfc1a0;
  flex-shrink: 0;
}
.announcement-icon i {
  color: #fff !important;
  font-size: 1.3rem !important;
  margin-top: 1px;
}


.announcement-bar-text {
  flex: 1;
  display: flex;
  align-items: center;
  word-break: break-word;
   gap: 0.8rem;
  white-space: pre-wrap;   /* อันนี้สำคัญ */
  overflow-wrap: anywhere;
  font-size: 1.07rem;
  font-weight: 500;
  color: #e53e3e; /* ฟอนต์แดง */
}
.close-announcement-btn {
  margin-left: 12px;
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s;
  display: flex;
  align-items: center;
}
.close-icon {
  width: 32px;
  height: 32px;
  background: #ffe0e3; /* วงกลมจางๆ */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  box-shadow: 0 1px 6px #f6b4b833;
}

.close-icon i {
  color: #e53e3e !important;
  font-size: 1.28rem !important;
}

.close-announcement-btn:hover .close-icon {
  background: #ffd1d7;
  /* สามารถปรับเฉดเมื่อ hover */
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

.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.22);
  z-index: 1999;
}
.sidebar {
  z-index: 2000;
}
.notification-backdrop{
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: transparent;
  z-index: 1001;
}

@media (max-width: 600px) {
  .main, .content {
    width: 100vw !important;
    min-width: 0 !important;
    max-width: 100vw !important;
    overflow-x: visible !important;
  }
  .block {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
  .grid {
    flex-direction: column !important;
    flex-wrap: nowrap !important;
    gap: 1rem !important;
    align-items: center !important;    /* <- เพิ่มบรรทัดนี้ */
    width: 100% !important;
  }
 
}



</style>

<style>
@import '../css/style.css';
</style>