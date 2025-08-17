<template>
  <div class="layout">
    <!-- Sidebar -->
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

    <!-- Sidebar overlay (mobile) -->
    <div v-if="!isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>

    <!-- Main -->
    <div class="main">
      <!-- Topbar -->
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

      <!-- Stepper -->
      <div class="headStepper">
        <div class="stepper">
          <div v-for="(step, index) in steps" :key="index" class="step">
            <div
              class="circle"
              :class="{ active: index === currentStep, completed: index < currentStep }"
              style="cursor:not-allowed"
              @click.stop
            ></div>
            <div class="label">{{ step }}</div>
            <div
              v-if="index < steps.length - 1"
              class="line"
              :class="{ filled: index < currentStep }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Success card (หน้าเอง เผื่ออยากให้ผู้ใช้ดาวน์โหลด PDF/กลับหน้าแรก) -->
      <div class="form-container">
        <h1 style="display:flex;justify-content:center;">ส่งคำขอสำเร็จ ✅</h1>
        <button class="pdfmake-btn" @click="() => { exportPdf(info) }">ดาวน์โหลด PDF ฟอร์ม</button>
        <br /><br />
        <button id="btnNext" @click="handleNext">กลับหน้าแรก</button>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'

const API_BASE = import.meta.env.VITE_API_BASE

// ======= Notification state =======
const showNotifications = ref(false)
const notifications = ref([])
const products = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const lastCheckedIds = new Set()
const lastSeenTimestamp = ref(parseInt(localStorage.getItem('lastSeenTimestamp') || '0'))
let polling = null

function pruneOldNotifications () {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 วัน
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

function toggleNotifications () {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}

function closeNotifications () {
  showNotifications.value = false
}

async function fetchNotifications () {
  if (!userId) return
  try {
    pruneOldNotifications()
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

      pruneOldNotifications()
      newNotis.forEach(item => lastCheckedIds.add(item._id))
    }

    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch (err) {
    // ignore
  }
}

async function loadCart () {
  const userId = localStorage.getItem('user_id') || ''
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch (err) {
    products.value = []
  }
}

onMounted(() => {
  lastSeenTimestamp.value = parseInt(localStorage.getItem('lastSeenTimestamp') || '0')
  fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  loadCart()
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
})

// ======= Page state =======
const router = useRouter()
const info = ref({})
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(3)
const isSidebarClosed = ref(false)
const stepRoutes = ['/form_field', '/form_field3', '/form_field4']

function toggleSidebar () { isSidebarClosed.value = !isSidebarClosed.value }
function canStepTo (idx) { return idx <= currentStep.value }
function goStep (idx) {
  if (!canStepTo(idx) || idx === currentStep.value) return
  router.push(stepRoutes[idx])
}

function formatDateOnly (dateTime) {
  if (!dateTime) return '-'
  let dateObj
  if (typeof dateTime === 'string') {
    const parts = dateTime.split('T')[0].split('-')
    if (parts.length === 3) {
      dateObj = new Date(parts[0], parts[1] - 1, parts[2])
    } else {
      dateObj = new Date(dateTime)
    }
  } else {
    dateObj = new Date(dateTime)
  }
  if (isNaN(dateObj)) return '-'

  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear() + 543
  return `${day}/${month}/${year}`
}

function esc (s) {
  return String(s ?? '-')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>')
}

async function loadBookingInfo () {
  const bookingId = localStorage.getItem('bookingId')
  if (!bookingId) {
    Swal.fire('ไม่พบข้อมูลการจอง')
    return
  }
  try {
    const res = await axios.get(`${API_BASE}/api/booking_field/${bookingId}`)
    info.value = res.data
    info.value.type = 'field'

    if (info.value.user_id) {
      try {
        const userRes = await axios.get(`${API_BASE}/api/user/${info.value.user_id}`)
        info.value.requester = userRes.data.name || '-'
      } catch {
        info.value.requester = '-'
      }
    } else {
      info.value.requester = '-'
    }

    // ===== Popup จัดแนวด้วย CSS Grid =====
    await Swal.fire({
      title: 'ส่งคำขอสำเร็จ',
      html: `
        <div class="swal-booking">
          <div class="label"><b>ชื่อกิจกรรม:</b></div>
          <div class="value">${esc(info.value.name_activity || '-')}</div>

          <div class="label"><b>ชื่อสนาม:</b></div>
          <div class="value">${esc(info.value.building || '-')}</div>

          <div class="label"><b>ชื่อผู้ขอ:</b></div>
          <div class="value">${esc(info.value.requester || '-')}</div>

          <div class="label"><b>วันที่:</b></div>
          <div class="value">${esc(formatDateOnly(info.value.since))} - ${esc(formatDateOnly(info.value.uptodate))}</div>

          <div class="label"><b>เวลา:</b></div>
          <div class="value">${esc(info.value.since_time || '-')} น. - ${esc(info.value.until_thetime || '-')} น. </div>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'ตกลง',
      allowOutsideClick: false,
      allowEscapeKey: false
    })
  } catch (err) {
    Swal.fire('ดึงข้อมูลไม่สำเร็จ')
  }
}
onMounted(loadBookingInfo)

function handleNext () {
  localStorage.removeItem('bookingId')
  localStorage.removeItem('fieldName')
  localStorage.removeItem('equipment_upload_file')
  sessionStorage.clear()

  if (window._tempSelectedFiles) window._tempSelectedFiles = []
  sessionStorage.removeItem('form_field_save')

  setTimeout(() => {
    const fileInput = document.getElementById('fileUploadInput')
    if (fileInput) fileInput.value = ''
  }, 100)

  router.push('/home_user')
}

// ------------------ PDF MULTI-PAGE -------------------
async function exportPdf (item) {
  const bookingId = item.booking_field_id || item.booking_equipment_id || item.booking_id
  if (!bookingId) {
    Swal.fire('ผิดพลาด', 'ไม่พบ booking_id สำหรับรายการนี้', 'error')
    return
  }
  try {
    const res = await axios.get(`${API_BASE}/api/history/pdf/${bookingId}`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `booking_${bookingId}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    Swal.fire('ผิดพลาด', 'ไม่พบไฟล์ PDF', 'error')
  }
}
</script>

<style scoped>
.headStepper{
  background-color: white;
  margin: 15px auto;
  padding: 0px;
  width: 90%;
  max-width: 900px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 20px;
}
.step {
  display: flex;
  align-items: center;
  position: relative;
}
.circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #ccc;
  z-index: 1;
  transition: background 0.3s;
  opacity: 0.6;
  pointer-events: none;
}
.circle.active { background-color: #ff4d4f; }
.circle.completed { background-color: #ff4d4f; opacity: 0.4; }
.label {
  margin-top: 15px;
  text-align: center;
  font-size: 12px;
  position: absolute;
  top: 40px;
  left: 16px;
  transform: translateX(-50%);
  white-space: nowrap;
}
.line {
  height: 4px;
  width: 80px;
  background-color: #ccc;
  margin: 0 5px;
  z-index: 0;
  transition: background 0.3s;
}
.line.filled { background-color: #ff4d4f; }

.form-container {
  background-color: white;
  margin: 30px auto;
  padding: 40px;
  width: 90%;
  max-width: 900px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}
#btnNext {
  padding: 0.5rem 1rem;
  background-color: #048ace;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
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
  0% { opacity: 0; transform: translateY(-24px); }
  100% { opacity: 1; transform: translateY(0); }
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
.notification-dropdown li:not(:last-child) { margin-bottom: 0.15em; }
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
.notification-dropdown::-webkit-scrollbar { width: 7px; }
.notification-dropdown::-webkit-scrollbar-thumb {
  background: #e1e7f5;
  border-radius: 10px;
}
.notification-dropdown::-webkit-scrollbar-track { background: transparent; }
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
  z-index: 1001;
}

/* ปุ่ม PDF */
.pdfmake-btn {
  background-color: #ff0000;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: 500;
}
.pdfmake-btn:hover { background-color: #7e0f0fdf; }
</style>

<!-- สไตล์ “global” สำหรับ SweetAlert2 (อยู่นอก scoped เพื่อให้มีผลกับ popup) -->
<style>
/* ขนาดและระยะของ popup – ให้ย่อตามเนื้อหา และขยายเมื่อข้อมูลยาว */
.swal2-popup {
  /* เดิม: width: min(680px, 92vw);  ==> ปรับให้ยืด/หดตามเนื้อหา */
  width: auto;
  max-width: min(720px, 92vw);
  padding: 24px 26px 22px;
  font-family: inherit;
}
@supports (width: fit-content) {
  .swal2-popup { width: fit-content; }
}

.swal2-title {
  margin-bottom: 10px !important;
}

/* กล่องข้อมูลแบบ 2 คอลัมน์: label / value  */
.swal2-popup .swal-booking {
  display: grid;
  grid-template-columns: auto 1fr; /* คอลัมน์ซ้ายกว้างตามป้ายกำกับ, ขวาเต็มที่ */
  column-gap: 12px;
  row-gap: 8px;
  text-align: left;

  /* จัดทั้งบล็อกให้อยู่กึ่งกลางของ popup */
  margin-inline: auto;

  /* จำกัดความกว้างสูงสุดของบล็อกเนื้อหา เพื่อให้ขึ้นบรรทัดใหม่เมื่อยาว */
  max-width: min(680px, 86vw);
}

/* ป้ายกำกับชิดขวา → อักษรตัวสุดท้ายเรียงแนวเดียวกัน */
.swal2-popup .swal-booking .label {
  justify-self: end;
  white-space: nowrap;
  font-weight: 700;
}

/* ค่า/ข้อมูลชิดซ้าย → อักษรตัวแรกเรียงแนวเดียวกัน, รองรับขึ้นบรรทัดใหม่ */
.swal2-popup .swal-booking .value {
  justify-self: start;
  white-space: pre-wrap;   /* เคารพ \n */
  word-break: break-word;  /* ตัดคำเมื่อยาว */
  line-height: 1.6;

  /* กันแถวยาวเกินไปเมื่อข้อความยาวมาก */
  max-width: clamp(260px, 56vw, 560px);
}

/* ให้โครงหน้าสูงเต็มจอ: sidebar + main วางข้างกัน */
.layout{
  min-height: 100vh;
  display: flex;           /* sidebar | main */
}

/* ให้ .main เป็นคอลัมน์: topbar -> เนื้อหา -> footer */
.main{
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-width: 0;            /* กัน overflow แนวนอน */
}

/* ดัน footer ไปชิดล่างเสมอ */
.foot{
  margin-top: auto;        /* ตัวนี้สำคัญที่สุด */
  flex-shrink: 0;
  width: 100%;
  border-radius: 0;        /* กันมุมโค้งดู “ลอย” */
}

/* ลดช่องว่างท้ายคอนเทนต์ไม่ให้ดัน footer ลอย */
.form-container{
  margin-bottom: 12px;
}

</style>

<style>
  html, body, #app { height: 100%; margin: 0; }
</style>

<style>
@import '../css/style.css';
</style>
