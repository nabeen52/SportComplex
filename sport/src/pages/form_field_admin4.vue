<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
         <router-link to="/dashboard" exact-active-class="active"><i class="pi pi-chart-pie"></i> แดชบอร์ด</router-link>
        <router-link to="/home_admin" exact-active-class="active"><i class="pi pi-megaphone"></i> แก้ไขข่าว</router-link>
        <router-link to="/edit_field" active-class="active"><i class="pi pi-map-marker"></i> แก้ไขสนาม</router-link>
        <router-link to="/edit_equipment" active-class="active"><i class="pi pi-clipboard"></i> แก้ไขอุปกรณ์ </router-link>
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> จองสนาม</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> รับคืนอุปกรณ์ </router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล </router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
      </nav>
    </aside>
<div
  v-if="isMobile && !isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
></div>
    <div class="main">
      <!-- Header with Notification Bell -->
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
           <div style="position: relative; display: inline-block;">
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
          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- Stepper -->
      <div class="headStepper">
        <div class="stepper">
          <div v-for="(step, index) in steps" :key="index" class="step">
            <div
              class="circle"
              :class="{ active: index === currentStep, completed: index < currentStep }"
            ></div>
            <div class="label">{{ step }}</div>
            <div v-if="index < steps.length - 1" class="line" :class="{ filled: index < currentStep }"></div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="form-container">
        <h1 style="display: flex; justify-content: center;">ส่งคำขอสำเร็จ ✅</h1>
        <button class="pdfmake-btn" @click="() => { exportPdf(info) }">ดาวน์โหลด PDF ฟอร์ม</button>
        <br><br>
        <button id="btnNext" @click="handleNext">กลับหน้าแรก</button>
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
        </div>
      </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'

const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_FORM_LAST_SEEN_KEY = 'form_field_admin_lastSeen'
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const lastCheckedIds = new Set()
const lastSeenTimestamp = ref(0)
let notiPolling = null

const route = useRoute()
watch(() => route.fullPath, () => {
  if (isMobile.value) isSidebarClosed.value = true
})
const isMobile = ref(window.innerWidth <= 600)
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth <= 600
})

function pruneOldNotifications() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem(ADMIN_FORM_LAST_SEEN_KEY, String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}

function closeNotifications() { showNotifications.value = false }

function handleClickOutside(e) {
  const dd = document.querySelector('.notification-dropdown')
  const btn = document.querySelector('.notification-btn')
  if (dd && !dd.contains(e.target) && btn && !btn.contains(e.target)) closeNotifications()
}

async function fetchNotifications() {
  const uid = localStorage.getItem('user_id') || ''
  if (!uid) return
  try {
    pruneOldNotifications()

    const res = await axios.get(`${API_BASE}/api/history?user_id=${uid}`)
    const data = Array.isArray(res.data) ? res.data : []

    const list = data
      .filter(it => ['approved','disapproved','cancel','canceled','returned'].includes((it.status||'').toLowerCase()))
      .map(it => {
        const ts =
          (it.returnedAt && new Date(it.returnedAt).getTime()) ??
          (it.updatedAt && new Date(it.updatedAt).getTime()) ??
          (it.approvedAt && new Date(it.approvedAt).getTime()) ??
          (it.date && new Date(it.date).getTime()) ??
          Date.now()
        return {
          id: it._id,
          type: (it.status||'').toLowerCase(),
          timestamp: ts,
          message:
            `รายการ '${it.name}' ของคุณ${
              (it.status||'').toLowerCase()==='approved' ? ' ได้รับการอนุมัติ' :
              (it.status||'').toLowerCase()==='disapproved' ? ' ไม่ได้รับการอนุมัติ' :
              (it.status||'').toLowerCase()==='canceled' || (it.status||'').toLowerCase()==='cancel' ? ' ถูกยกเลิก' :
              (it.status||'').toLowerCase()==='returned' ? ' คืนของสำเร็จแล้ว' : ''
            }`
        }
      })

    notifications.value = [...list, ...notifications.value]
      .filter((v, i, arr) => arr.findIndex(x => (x.id||i) === (v.id||i)) === i)
      .sort((a,b) => b.timestamp - a.timestamp)

    pruneOldNotifications()
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch {}
}

onMounted(async () => {
  // ...ของเดิมคุณ (เช่น loadBookingInfo)
  lastSeenTimestamp.value = parseInt(localStorage.getItem(ADMIN_FORM_LAST_SEEN_KEY) || '0')

  document.addEventListener('mousedown', handleClickOutside)
  await fetchNotifications()
  notiPolling = setInterval(fetchNotifications, 30000)
})

onBeforeUnmount(() => {
  if (notiPolling) clearInterval(notiPolling)
  document.removeEventListener('mousedown', handleClickOutside)
})


const router = useRouter()
const info = ref({})
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(3)
const isSidebarClosed = ref(false)
const stepRoutes = ['/form_field_admin', '/form_field_admin3', '/form_field_admin4']

function toggleSidebar() { isSidebarClosed.value = !isSidebarClosed.value }
function canStepTo(idx) { return idx <= currentStep.value }
function goStep(idx) {
  if (!canStepTo(idx) || idx === currentStep.value) return
  router.push(stepRoutes[idx])
}
function formatDateOnly(dateTime) {
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
  const year = dateObj.getFullYear() + 543 // ✅ แปลงเป็น พ.ศ.
  return `${day}/${month}/${year}`
}


async function loadBookingInfo() {
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

    await Swal.fire({
      title: 'ส่งคำขอสำเร็จ!',
      html: `
        <p><b>ชื่อกิจกรรม:</b> ${info.value.name_activity || '-'}</p>
        <p><b>ชื่อสนาม:</b> ${info.value.building || '-'}</p>
        <p><b>ชื่อผู้ขอ:</b> ${info.value.requester || '-'}</p>
        <p><b>วันที่:</b> ${formatDateOnly(info.value.since)} - ${formatDateOnly(info.value.uptodate)}</p>
        <p><b>เวลา:</b> ${info.value.since_time || '-'} - ${info.value.until_thetime || '-'}</p>
      `,
      icon: 'success',
      confirmButtonText: 'ตกลง',
      allowOutsideClick: false,
      allowEscapeKey: false,
    })
  } catch (err) {
    Swal.fire('ดึงข้อมูลไม่สำเร็จ')
  }
}
onMounted(loadBookingInfo)

function handleNext() {
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

  router.push('/home_admin')
}

// ------------------ PDF MULTI-PAGE -------------------
async function exportPdf(item) {
  const bookingId = item.booking_field_id || item.booking_equipment_id || item.booking_id;
  if (!bookingId) {
    Swal.fire('ผิดพลาด', 'ไม่พบ booking_id สำหรับรายการนี้', 'error');
    return;
  }
  try {
    const res = await axios.get(`${API_BASE}/api/history/pdf/${bookingId}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `booking_${bookingId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    Swal.fire('ผิดพลาด', 'ไม่พบไฟล์ PDF', 'error');
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
  /* เพิ่มให้ดูจางเมื่อ disable */
  opacity: 0.6;
  pointer-events: none;
}
.circle.active {
  background-color: #ff4d4f;
}
.circle.completed {
  background-color: #ff4d4f;
  opacity: 0.4;
}
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
.line.filled {
  background-color: #ff4d4f;
}
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

/* ==== Notification styles ==== */
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
.pdfmake-btn:hover {
  background-color: #7e0f0fdf;
}
.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 1100;
}
.sidebar {
  z-index: 1200;
}
@media (max-width: 600px) {
  .main {
    overflow-x: auto !important;
    min-width: 400px;
    width: 100vw;
    box-sizing: border-box;
    padding-right: 12px;
  }
  .form-container {
    min-width: 400px;
    width: 100vw;
    box-sizing: border-box;
    padding-right: 12px;
    overflow-x: auto;
  }
}

.notification-backdrop{
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 1001;
}

</style>


<style>
@import '../css/style.css';
</style>