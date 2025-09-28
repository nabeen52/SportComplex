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
         <router-link to="/step" active-class="active"><i class="pi pi-sitemap"></i> แก้ไขขั้นตอนการอนุมัติ </router-link>
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> จองสนาม</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <!-- <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> รับคืนอุปกรณ์ </router-link> -->
          <router-link to="/agency_admin" active-class="active"><i class="pi pi-briefcase"></i> หน่วยงาน </router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล </router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
      </nav>
    </aside>

    <div v-if="!isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>

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

      <!-- Success card -->
      <div class="form-container">
        <h1 style="display:flex;justify-content:center;">ส่งคำขอสำเร็จ ✅</h1>

        <button
          class="pdfmake-btn"
          :disabled="!finalPdfUrl"
          @click="downloadPdf"
        >
          ดาวน์โหลด PDF ฟอร์ม
        </button>

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
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'

const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'

// ======= Notification state =======
const showNotifications = ref(false)
const notifications = ref([])
const products = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const lastCheckedIds = new Set()
const lastSeenTimestamp = ref(parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0'))
let polling = null

function pruneOldNotifications () {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 วัน
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

function toggleNotifications () {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}

function closeNotifications () { showNotifications.value = false }

function handleClickOutside (event) {
  const dropdown = document.querySelector('.notification-dropdown')
  const btn = document.querySelector('.notification-btn')
  if (dropdown && !dropdown.contains(event.target) && btn && !btn.contains(event.target)) {
    closeNotifications()
  }
}

async function fetchNotifications () {
  try {
    pruneOldNotifications()

    // รายการรออนุมัติ (field/equipment)
    const res = await axios.get(`${API_BASE}/api/history/approve_field`)
    const data = Array.isArray(res.data) ? res.data : []

    const pendings = data.filter(item =>
      item?.status === 'pending' && (item?.type === 'field' || item?.type === 'equipment')
    )

    if (pendings.length) {
      const newMessages = pendings.map(item => {
        const id = item._id?.$oid || item._id
        const ts =
          (item.updatedAt && new Date(item.updatedAt).getTime()) ??
          (item.createdAt && new Date(item.createdAt).getTime()) ??
          (item.date && new Date(item.date).getTime()) ??
          Date.now()

        return {
          id,
          type: 'pending',
          timestamp: ts,
          message: item.type === 'field'
            ? `สนาม '${item.name}' กำลังรอการอนุมัติ`
            : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
        }
      })

      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp)

      pruneOldNotifications()
    }

    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch {/* เงียบไว้ */}
}

async function loadCart () {
  const userId = localStorage.getItem('user_id') || ''
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch {
    products.value = []
  }
}

// ======= Page state =======
const router = useRouter()
const info = ref({})
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(3)
const isSidebarClosed = ref(false)
const stepRoutes = ['/form_field_admin', '/form_field_admin3', '/form_field_admin4']

function toggleSidebar () { isSidebarClosed.value = !isSidebarClosed.value }
function canStepTo (idx) { return idx <= currentStep.value }
function goStep (idx) {
  if (!canStepTo(idx) || idx === currentStep.value) return
  router.push(stepRoutes[idx])
}

// === Utility for BE date ===
function formatDateOnly (dateTime) {
  if (!dateTime) return '-'
  let dateObj
  if (typeof dateTime === 'string') {
    const parts = dateTime.split('T')[0].split('-')
    dateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(dateTime)
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

// ====== PDF logic ======
const pdfUrl = ref(null)
const finalPdfUrl = computed(() => pdfUrl.value)

function normalizePdfUrl (raw) {
  if (!raw) return null
  let u = String(raw).trim()
  if (u.startsWith('/')) u = new URL(u, window.location.origin).href
  if (location.protocol === 'https:' && u.startsWith('http://')) {
    u = 'https://' + u.slice('http://'.length)
  }
  return u
}

function pickPdfUrl (list) {
  if (!Array.isArray(list)) return null
  const haveDirect = list.find(h => h?.bookingPdfUrl || h?.booking_pdf_url) || null
  if (haveDirect) return haveDirect.bookingPdfUrl || haveDirect.booking_pdf_url || null
  const haveAttach = list.find(h => Array.isArray(h?.attachment) && h.attachment[0])
  return haveAttach ? haveAttach.attachment[0] : null
}

function getFileNameFromUrl (u, fallback = 'booking.pdf') {
  try {
    const { pathname } = new URL(u)
    const name = decodeURIComponent(pathname.split('/').pop() || '')
    return name || fallback
  } catch {
    return fallback
  }
}

async function downloadPdf () {
  try {
    const url = finalPdfUrl.value
    if (!url) {
      await Swal.fire('ผิดพลาด', 'ไม่พบ URL ของไฟล์ PDF', 'error')
      return
    }
    const resp = await fetch(url, { credentials: 'include' })
    if (!resp.ok) throw new Error('download failed')

    const blob = await resp.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    const fallbackName = `booking_${info.value?.booking_id || localStorage.getItem('bookingId') || Date.now()}.pdf`
    a.download = getFileNameFromUrl(url, fallbackName)
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
  } catch (e) {
    await Swal.fire('ผิดพลาด', 'ไม่สามารถดาวน์โหลดไฟล์ได้', 'error')
  }
}

async function exportPdf (item) {
  try {
    let urlFromItem =
      item?.bookingPdfUrl ||
      item?.booking_pdf_url ||
      (Array.isArray(item?.attachment) ? item.attachment[0] : null) ||
      item?.pdfUrl ||
      item?.pdf_url ||
      null

    const chosen = normalizePdfUrl(urlFromItem || pdfUrl.value)
    if (chosen) {
      const w = window.open(chosen, '_blank', 'noopener,noreferrer')
      if (!w) location.href = chosen
      return
    }
    await Swal.fire('ผิดพลาด', 'ไม่พบ URL ของไฟล์ PDF ในรายการนี้', 'error')
  } catch {
    await Swal.fire('ผิดพลาด', 'ไม่พบไฟล์ PDF หรือพาธไม่ถูกต้อง', 'error')
  }
}

// ====== Load data ======
async function loadBookingInfo () {
  const bookingId = localStorage.getItem('bookingId')
  if (!bookingId) {
    Swal.fire('ไม่พบข้อมูลการจอง')
    return
  }
  try {
    // รายละเอียดการจอง
    const res = await axios.get(`${API_BASE}/api/booking_field/${bookingId}`)
    info.value = res.data || {}
    info.value.type = 'field'

    // URL PDF จาก history
    try {
      const resHist = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } })
      const list = (resHist.data || []).filter(
        h => (h.type === 'field') && String(h.booking_id) === String(bookingId)
      )
      const picked = pickPdfUrl(list)
      pdfUrl.value = normalizePdfUrl(picked)
    } catch { /* ไม่มี URL ก็ปล่อย */ }

    // ตั้งค่า "ชื่อผู้ขอ"
    const prefer = v => (v && String(v).trim() !== '' ? String(v).trim() : null)
    let requester = prefer(info.value.username_form)
    if (!requester) requester = prefer(localStorage.getItem('username_form'))
    if (!requester && info.value.user_id) {
      try {
        const userRes = await axios.get(`${API_BASE}/api/user/${info.value.user_id}`)
        requester = prefer(userRes.data?.name)
      } catch {}
    }
    info.value.requester = requester || '-'

    const proxyName =
      (info.value.proxyStudentName && String(info.value.proxyStudentName).trim()) ||
      (localStorage.getItem('proxyStudentName') && String(localStorage.getItem('proxyStudentName')).trim()) ||
      null
    info.value.proxyStudentName = proxyName || '-'

    // === SweetAlert รูปแบบเดียวกับ form_field4 ===
    await Swal.fire({
      title: 'ส่งคำขอสำเร็จ',
      html: `
        <div class="swal-wrapper">
          <table class="swal-booking-table">
            <tbody>
              <tr>
                <th>ชื่อกิจกรรม</th>
                <td>${esc(info.value.name_activity || '-')}</td>
              </tr>
              <tr>
                <th>อาคาร/สนาม</th>
                <td>${esc(info.value.building || '-')}</td>
              </tr>
              <tr>
                <th>โซน</th>
                <td>${esc(info.value.zone || '-')}</td>
              </tr>

              <tr>
                <th>ผู้ขอใช้</th>
                <td>${esc(info.value.username_form || info.value.requester || '-')}</td>
              </tr>

            

              <tr>
                <th>วันที่</th>
                <td>${esc(formatDateOnly(info.value.since))} - ${esc(formatDateOnly(info.value.uptodate))}</td>
              </tr>
              <tr>
                <th>เวลา</th>
                <td>${esc(info.value.since_time || '-')} น. - ${esc(info.value.until_thetime || '-')} น.</td>
              </tr>
              <tr>
                <th>จำนวนผู้เข้าร่วม</th>
                <td>${esc(info.value.participants || '-')}</td>
              </tr>
              <tr>
                <th>เหตุผล</th>
                <td>${esc(info.value.reasons || info.value.reason || '-')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'ตกลง',
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'swal-wide-form-field4'   // ✅ ใช้คลาสเดียวกับ form_field4
      }
    })
  } catch {
    Swal.fire('ดึงข้อมูลไม่สำเร็จ')
  }
}

onMounted(() => {
  lastSeenTimestamp.value = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0')
  window.addEventListener('click', handleClickOutside)

  loadBookingInfo()
  fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  loadCart()
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
  window.removeEventListener('click', handleClickOutside)
})

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
  router.push('/home_admin')
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
.stepper { display: flex; align-items: center; justify-content: center; padding: 20px; border-radius: 20px; }
.step { display: flex; align-items: center; position: relative; }
.circle { width: 30px; height: 30px; border-radius: 50%; background-color: #ccc; z-index: 1; transition: background 0.3s; opacity: 0.6; pointer-events: none; }
.circle.active { background-color: #ff4d4f; }
.circle.completed { background-color: #ff4d4f; opacity: 0.4; }
.label { margin-top: 15px; text-align: center; font-size: 12px; position: absolute; top: 40px; left: 16px; transform: translateX(-50%); white-space: nowrap; }
.line { height: 4px; width: 80px; background-color: #ccc; margin: 0 5px; z-index: 0; transition: background 0.3s; }
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
.notification-dropdown { position: absolute; right: 0; top: 38px; background: #fff; border-radius: 18px 0 18px 18px; box-shadow: 0 8px 24px 0 rgba(27, 50, 98, 0.14), 0 2px 4px 0 rgba(33, 125, 215, 0.06); min-width: 330px; max-width: 370px; max-height: 420px; overflow-y: auto; z-index: 1002; padding: 0; border: none; animation: fadeDown 0.22s; }
@keyframes fadeDown { 0% { opacity: 0; transform: translateY(-24px);} 100% { opacity: 1; transform: translateY(0);} }

.notification-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: transparent; z-index: 1001; }

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

<!-- SweetAlert2: ใช้ชุดเดียวกับ form_field4 -->
<style>
@import '../css/style.css';

/* ใช้คลาสเฉพาะนี้เท่านั้น เพื่อให้เหมือน form_field4 */
.swal2-popup.swal-wide-form-field4{
  width: min(550px, 92vw) !important;
  max-width: none !important;
  padding: 24px 26px 22px !important;
  font-family: inherit !important;
}
.swal2-popup.swal-wide-form-field4 .swal2-html-container{
  width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}
.swal2-popup.swal-wide-form-field4 .swal-booking{ max-width: none !important; }
.swal2-popup.swal-wide-form-field4 .swal-booking-table{ width: 100% !important; }
.swal2-popup.swal-wide-form-field4 .swal-booking-table td{ max-width: none !important; }

/* มือถือ: card layout */
@media (max-width: 520px){
  .swal2-popup.swal-wide-form-field4 .swal-booking-table,
  .swal2-popup.swal-wide-form-field4 .swal-booking-table thead,
  .swal2-popup.swal-wide-form-field4 .swal-booking-table tbody,
  .swal2-popup.swal-wide-form-field4 .swal-booking-table tr,
  .swal2-popup.swal-wide-form-field4 .swal-booking-table td,
  .swal2-popup.swal-wide-form-field4 .swal-booking-table th{
    display: block;
    width: 100%;
  }
  .swal2-popup.swal-wide-form-field4 .swal-booking-table tr{
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 6px 0;
    margin-bottom: 10px;
    background: #fff;
  }
  .swal2-popup.swal-wide-form-field4 .swal-booking-table th{
    text-align: left;
    background: #f9fafb;
    border: none;
    padding: 8px 12px 2px;
  }
  .swal2-popup.swal-wide-form-field4 .swal-booking-table td{
    border: none;
    padding: 2px 12px 10px;
  }
}
.swal2-popup.swal-wide-form-field4 .swal-booking-table th,
.swal2-popup.swal-wide-form-field4 .swal-booking-table td{
  text-align: left !important;
  padding-left: 12px !important;
  padding-right: 12px !important;
}
.swal2-popup.swal-wide-form-field4 .swal-booking-table tr > th { width: 34%; }
.swal2-popup.swal-wide-form-field4 .swal-booking-table tr > td { width: 66%; }

/* จบชุด SweetAlert */
</style>

<style>
  html, body, #app { height: 100%; margin: 0; }
</style>