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

      <!-- Success card -->
      <div class="form-container">
        <h1 style="display:flex;justify-content:center;">ส่งคำขอสำเร็จ ✅</h1>

        <!-- ใช้ logic เดียวกับ form_equipment4 -->
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
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
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

function closeNotifications () { showNotifications.value = false }

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
  } catch {
    // ignore
  }
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
const stepRoutes = ['/form_field', '/form_field3', '/form_field4']

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

// ====== PDF logic (เหมือน form_equipment4) ======
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

// (เผื่อเรียกด้วย item เฉพาะจุด)
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
    // 1) ดึงรายละเอียดการจองสนาม
    const res = await axios.get(`${API_BASE}/api/booking_field/${bookingId}`)
    info.value = res.data || {}
    info.value.type = 'field'

    // 2) หาลิงก์ PDF จาก history
    try {
      const resHist = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } })
      const list = (resHist.data || []).filter(
        h => (h.type === 'field') && String(h.booking_id) === String(bookingId)
      )
      const picked = pickPdfUrl(list)
      pdfUrl.value = normalizePdfUrl(picked)
    } catch { /* ignore */ }

    // ==== นิยามฟังก์ชันไว้ตรงนี้ (หรือย้ายขึ้นไปนอกฟังก์ชันก็ได้) ====
    const prefer = v => (v && String(v).trim() !== '' ? String(v).trim() : null)

    // 3) ผู้ขอใช้
    let requester = prefer(info.value.username_form)
    if (!requester) requester = prefer(localStorage.getItem('username_form'))
    if (!requester && info.value.user_id) {
      try {
        const userRes = await axios.get(`${API_BASE}/api/user/${info.value.user_id}`)
        requester = prefer(userRes.data?.name)
      } catch {}
    }
    info.value.requester = requester || '-'

    // 4) จองแทนผู้ใช้ (ใหม่)
    const proxyName =
      prefer(info.value.proxyStudentName) ||
      prefer(localStorage.getItem('proxyStudentName'))
    info.value.proxyStudentName = proxyName || '-'

    // 5) แสดงสรุป
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
      customClass: { popup: 'swal-wide-form-field4' }
    })
  } catch (err) {
    Swal.fire('ดึงข้อมูลไม่สำเร็จ')
  }
}



onMounted(() => {
  lastSeenTimestamp.value = parseInt(localStorage.getItem('lastSeenTimestamp') || '0')
  loadBookingInfo()
  fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  loadCart()
})

onBeforeUnmount(() => { if (polling) clearInterval(polling) })

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
</script>

<style scoped>
/* ===== Layout / Stepper / Card เดิมของหน้า ===== */
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

/* ===== Notification dropdown เดิมของหน้า ===== */
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
@keyframes fadeDown { 0% { opacity: 0; transform: translateY(-24px); } 100% { opacity: 1; transform: translateY(0); } }
.notification-dropdown ul { padding: 0; margin: 0; list-style: none; }
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
.notification-dropdown li::before { content: "🔔"; font-size: 1.2em; margin-right: 7px; color: #1976d2; opacity: 0.80; }
.notification-dropdown li.no-noti { background: #f2f3f6; color: #a7aab7; justify-content: center; font-style: italic; }
.notification-dropdown::-webkit-scrollbar { width: 7px; }
.notification-dropdown::-webkit-scrollbar-thumb { background: #e1e7f5; border-radius: 10px; }
.notification-dropdown::-webkit-scrollbar-track { background: transparent; }
.notification-item.approved { background: linear-gradient(90deg, #e9fbe7 85%, #cbffdb 100%); border-left: 4px solid #38b000; color: #228c22; }
.notification-item.disapproved { background: linear-gradient(90deg, #ffeaea 85%, #ffd6d6 100%); border-left: 4px solid #ff6060; color: #b91423; }
.notification-item.canceled,
.notification-item.cancel { background: linear-gradient(90deg, #f9d7d7 80%, #e26a6a 100%); border-left: 4px solid #bb2124; color: #91061a; }
.notification-item.returned { background: linear-gradient(90deg, #e0f0ff 85%, #b6e0ff 100%); border-left: 4px solid #1976d2; color: #1976d2; }
.notification-item { transition: background 0.3s, border-color 0.3s, color 0.3s; }

.notification-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: transparent; z-index: 1001; }

/* ===== ปุ่ม PDF ===== */
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



<style>
@import '../css/style.css';


.swal2-popup.swal-wide-form-field4{
  width: min(550px, 92vw) !important;
  padding: 18px 20px 16px !important;   /* ลด padding เดิมลง */
  font-family: inherit !important;
}

.swal2-popup.swal-wide-form-field4 .swal2-html-container{
  width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}

.swal2-popup.swal-wide-form-field4 .swal-booking{
  max-width: none !important;
}

.swal2-popup.swal-wide-form-field4 .swal-booking-table{
  width: 100% !important;
}

.swal2-popup.swal-wide-form-field4 .swal-booking-table td{
  max-width: none !important;
}

/* มือถือ: card layout เฉพาะ alert นี้ */
@media (max-width: 520px){
  .swal2-popup.swal-wide-form-field4{
    width: 94vw !important;
    padding: 14px 12px 16px !important;  /* ลด padding เพิ่มพื้นที่เนื้อหา */
  }
  .swal2-popup.swal-wide-form-field4 .swal2-icon{
    transform: scale(.72);
    margin: 4px auto 4px !important;
  }
  .swal2-popup.swal-wide-form-field4 .swal2-title{
    font-size: 1.02rem !important;
    margin: 2px 0 6px !important;
  }

  /* บังคับให้เป็น “ตารางจริง” บนมือถือ (ไม่แปลงเป็นบล็อก) */
  .swal2-popup.swal-wide-form-field4 .swal-booking-table,
  .swal2-popup.swal-wide-form-field4 .swal-booking-table thead,
  .swal2-popup.swal-wide-form-field4 .swal-booking-table tbody{
    display: table !important;
    width: 100% !important;
  }
  .swal2-popup.swal-wide-form-field4 .swal-booking-table tr{
    display: table-row !important;
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
  }
  .swal2-popup.swal-wide-form-field4 .swal-booking-table th,
  .swal2-popup.swal-wide-form-field4 .swal-booking-table td{
    display: table-cell !important;
    border: 1px solid #e5e7eb !important;
    padding: 6px 8px !important;
    word-break: break-word !important;
  }
  .swal2-popup.swal-wide-form-field4 .swal-booking-table tr > th { width: 42% !important; }
  .swal2-popup.swal-wide-form-field4 .swal-booking-table tr > td { width: 58% !important; }
}

.swal2-popup.swal-wide-form-field4 .swal-booking-table th,
.swal2-popup.swal-wide-form-field4 .swal-booking-table td{
  text-align: left !important;
  padding: 6px 10px !important;          /* ลด padding เซลล์ลง */
  line-height: 1.45 !important;
  border: 1px solid #e5e7eb;
  vertical-align: top;
}


.swal2-popup.swal-wide-form-field4 .swal-booking-table tr > th {
  width: 30%;                    
}
.swal2-popup.swal-wide-form-field4 .swal-booking-table tr > td {
  width: 70%;                   
}
</style>