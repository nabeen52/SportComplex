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

    <!-- คลิกนอกเพื่อปิด Sidebar -->
    <div
      v-if="!isSidebarClosed"
      class="sidebar-overlay"
      @click="toggleSidebar"
    ></div>

    <!-- Main -->
    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <!-- กระดิ่งแจ้งเตือน -->
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
              style="cursor: not-allowed"
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

      <!-- Success Message -->
      <div class="form-container">
        <h1 style="display: flex; justify-content: center;">ส่งคำขอสำเร็จ ✅</h1>

        <!-- <button class="pdfmake-btn" :disabled="!bookingInfo" @click="exportPdf(bookingInfo)">
          ดาวน์โหลด PDF ฟอร์ม
        </button> -->

          <button
            class="pdfmake-btn"
            :disabled="!finalPdfUrl"
            @click="downloadPdf()"
          >
            ดาวน์โหลด PDF ฟอร์ม
          </button>
      
        
        <br /><br />

        <button id="btnNext" @click="handleNext">กลับหน้าแรก</button>
      </div>

      <!-- Footer (ย้ายมาไว้ใน .main) -->
      <footer class="foot" style="margin-top: 20px;">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel: 0-5391-7820 and 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a>
            | Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
          <p>
            © 2025 Center for Information Technology Services, Mae Fah Luang University. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import Swal from 'sweetalert2'
import axios from 'axios'
import { useRouter } from 'vue-router'

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'

const API_BASE = import.meta.env.VITE_API_BASE
const lastSeenTimestamp = ref(parseInt(localStorage.getItem('lastSeenTimestamp') || '0'))

const products = ref([])
const router = useRouter()
const equipmentList = ref([])
const bookingInfo = ref(null)
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(3)
const isSidebarClosed = ref(false)

const pdfUrl = ref(null)



// Notification State
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
let polling = null

function formatDateOnly(dateTime) {
  if (!dateTime) return '-'
  let d
  if (typeof dateTime === 'string') {
    const parts = dateTime.split('T')[0].split('-')
    d = parts.length === 3 ? new Date(parts[0], parts[1]-1, parts[2]) : new Date(dateTime)
  } else {
    d = new Date(dateTime)
  }
  if (isNaN(d)) return '-'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth()+1).padStart(2, '0')
  const yy = d.getFullYear()+543
  return `${dd}/${mm}/${yy}`
}
function esc(s) {
  return String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>')
}

function pruneOldNotifications() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}

function closeNotifications() { showNotifications.value = false }

async function fetchNotifications() {
  if (!userId) return
  try {
    pruneOldNotifications()

    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const target = ['approved', 'disapproved', 'cancel', 'canceled', 'returned']
    const list = (res.data || []).filter(it => target.includes((it.status || '').toLowerCase()))
    if (list.length) {
      const mapped = list.map(item => ({
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
      notifications.value = [...notifications.value, ...mapped]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp)
      pruneOldNotifications()
    }
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch {
    // เงียบไว้
  }
}

function toggleSidebar() { isSidebarClosed.value = !isSidebarClosed.value }

async function loadCart() {
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch {
    products.value = []
  }
}

async function loadBookingInfo() {
  const bookingId = localStorage.getItem('equipment_booking_id')
  if (!bookingId) {
    await Swal.fire('ไม่พบข้อมูลการจอง')
    return
  }

  try {
    // 1) ดึงประวัติทั้งหมดของ booking นี้ (type=equipment)
    const res = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } })
    const historyList = (res.data || []).filter(
      h => (h.type === 'equipment') && String(h.booking_id) === String(bookingId)
    )

    if (!historyList.length) {
      await Swal.fire('ไม่พบข้อมูลในประวัติ')
      return
    }

    // เก็บตัวแรกไว้เป็นตัวแทนหลัก
    bookingInfo.value = historyList[0]

    // 2) หา URL ของ PDF แล้ว normalize เพื่อใช้กับปุ่มดาวน์โหลด
    const picked = pickPdfUrl(historyList)
    pdfUrl.value = normalizePdfUrl(picked)

    // 3) ตั้งค่า "ชื่อผู้ขอ" — ใช้ username_form เป็นหลัก, แล้ว fallback ตามลำดับ
    const prefer = v => (v && String(v).trim() !== '' ? String(v).trim() : null)
    let userName =
      prefer(historyList[0].username_form) ||          // จาก history
      prefer(localStorage.getItem('username_form')) ||  // จาก localStorage (ถ้ามี)
      prefer(historyList[0].requester) ||               // fallback: requester เดิม
      null

    if (!userName && historyList[0].user_id) {
      try {
        const userRes = await axios.get(`${API_BASE}/api/user/${historyList[0].user_id}`)
        userName = prefer(userRes.data?.name) || historyList[0].user_id
      } catch {
        userName = historyList[0].user_id
      }
    }

    // 4) เตรียม HTML ตาราง: มีคอลัมน์หมายเหตุเฉพาะเมื่อมี remark อย่างน้อย 1 รายการ
    const hasRemark = historyList.some(h => (h.remark && String(h.remark).trim() !== ''))

    const itemsTable = `
      <table class="swal-inner-table">
        <thead>
          <tr>
            <th>รายการ</th>
            <th>จำนวน</th>
            ${hasRemark ? '<th>หมายเหตุ</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${historyList.map(h => `
            <tr>
              <td>${esc(h.name || '-')}</td>
              <td style="text-align:center">${esc(h.quantity ?? '-')}</td>
              ${hasRemark ? `<td>${esc(h.remark || '-')}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    // 5) แสดง SweetAlert เป็น "ตารางสรุป + ตารางย่อยรายการอุปกรณ์"
    await Swal.fire({
      title: 'ส่งคำขอสำเร็จ',
      html: `
        <div class="swal-wrapper">
          <table class="swal-booking-table">
            <tbody>
              <tr>
                <th>ชื่อผู้ขอใช้</th>
                <td>${esc(userName || '-')}</td>
              </tr>
              <tr>
                <th>วันที่ขอยืม</th>
                <td>${esc(formatDateOnly(historyList[0].since))}</td>
              </tr>
              <tr>
                <th>วันที่คืน</th>
                <td>${esc(formatDateOnly(historyList[0].uptodate))}</td>
              </tr>
              <tr>
                <th>รายการอุปกรณ์</th>
                <td>
                  <div class="swal-items-wrap">
                    ${itemsTable}
                  </div>
                </td>
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
    popup: 'swal-wide-form-equipment4'   // ✅ กำหนด class เฉพาะหน้านี้
  }
    })
  } catch (err) {
    await Swal.fire('ดึงข้อมูลการจองล้มเหลว', err?.message || '', 'error')
  }
}



onMounted(() => {
  loadBookingInfo()
  fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  loadCart()
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
})

function handleNext() {
  localStorage.removeItem('equipment_booking_id')
  localStorage.removeItem('equipmentFormData')
  router.push('/home_user')
}

// ------------------ PDF MULTI-PAGE -------------------

function normalizePdfUrl(raw) {
  if (!raw) return null
  let u = String(raw).trim()
  if (u.startsWith('/')) u = new URL(u, window.location.origin).href
  if (location.protocol === 'https:' && u.startsWith('http://')) {
    u = 'https://' + u.slice('http://'.length)
  }
  return u
}

function pickPdfUrl(list) {
  if (!Array.isArray(list)) return null
  const haveDirect =
    list.find(h => h?.bookingPdfUrl || h?.booking_pdf_url) || null
  if (haveDirect) {
    return (
      haveDirect.bookingPdfUrl ||
      haveDirect.booking_pdf_url ||
      null
    )
  }
  const haveAttach = list.find(h => Array.isArray(h?.attachment) && h.attachment[0])
  return haveAttach ? haveAttach.attachment[0] : null
}

const finalPdfUrl = computed(() => pdfUrl.value)

function getFileNameFromUrl(u, fallback = 'booking.pdf') {
  try {
    const { pathname } = new URL(u);
    const name = decodeURIComponent(pathname.split('/').pop() || '');
    return name || fallback;
  } catch {
    return fallback;
  }
}

async function downloadPdf() {
  try {
    const url = finalPdfUrl.value;
    if (!url) {
      await Swal.fire('ผิดพลาด', 'ไม่พบ URL ของไฟล์ PDF', 'error');
      return;
    }

    // ดึงไฟล์เป็น blob แล้วสั่งดาวน์โหลด (กันบราวเซอร์เปิดดูเอง)
    const resp = await fetch(url, { credentials: 'include' }); // โดเมนเดียวกัน OK
    if (!resp.ok) throw new Error('download failed');

    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    // ตั้งชื่อไฟล์จาก URL หรือ booking_id
    const fallbackName = `booking_${bookingInfo.value?.booking_id || Date.now()}.pdf`;
    a.download = getFileNameFromUrl(url, fallbackName);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    await Swal.fire('ผิดพลาด', 'ไม่สามารถดาวน์โหลดไฟล์ได้', 'error');
  }
}

async function exportPdf(item) {
  try {
    // พยายามดึง URL จากตัว item ก่อน (รองรับหลายชื่อฟิลด์ + แนบไฟล์)
    let urlFromItem =
      item?.bookingPdfUrl ||
      item?.booking_pdf_url ||
      (Array.isArray(item?.attachment) ? item.attachment[0] : null) ||
      item?.pdfUrl ||
      item?.pdf_url ||
      null

    // ถ้า state มีแล้ว (จาก loadBookingInfo) ให้ใช้เลย
    const chosen = normalizePdfUrl(urlFromItem || pdfUrl.value)

    if (chosen) {
      const w = window.open(chosen, '_blank', 'noopener,noreferrer')
      if (!w) location.href = chosen // กัน popup ถูกบล็อก
      return
    }

    await Swal.fire('ผิดพลาด', 'ไม่พบ URL ของไฟล์ PDF ในรายการนี้', 'error')
  } catch {
    await Swal.fire('ผิดพลาด', 'ไม่พบไฟล์ PDF หรือพาธไม่ถูกต้อง', 'error')
  }
}


</script>
<style scoped>
/* ...style เดิมของคุณ... */
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
  pointer-events: none; /* ห้ามคลิก */
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

.badge {
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  vertical-align: top;
  margin-left: 4px;
}

/* โครงหน้าสูงเต็มจอ: sidebar + main วางข้างกัน */
.layout{
  min-height: 100vh !important;
  display: flex !important;
}

/* ให้ .main เป็นคอลัมน์: topbar -> เนื้อหา -> footer */
.main{
  flex: 1 1 auto !important;
  display: flex !important;
  flex-direction: column !important;
  min-width: 0;            /* กัน overflow แนวนอน */
}

/* ดัน footer ไปชิดล่างอัตโนมัติ */
.foot{
  margin-top: auto !important;   /* ตัวนี้ทำให้ footer ไปก้นหน้า */
  flex-shrink: 0 !important;
  width: 100% !important;
  border-radius: 0 !important;   /* ไม่ให้โค้งลอย */
  margin-bottom: 0 !important;
  padding-top: 12px;             /* ปรับได้ตามชอบ */
  padding-bottom: 12px;          /* ปรับได้ตามชอบ */
}

/* ลดช่องว่างก่อน footer ไม่ให้ดันขึ้น */
.form-container{
  margin-bottom: 8px !important; /* หรือ 0 ตามต้องการ */
}

</style>

<style>

/* จัดกลางหัวคอลัมน์ตารางรายการอุปกรณ์ใน SweetAlert ของหน้า form_equipment4 */
.swal2-popup.swal-wide-form-equipment4 .swal-inner-table thead th{
  text-align: center !important;
  vertical-align: middle !important;
}

/* มือถือก็ให้กึ่งกลางเหมือนกัน */
@media (max-width: 520px){
  .swal2-popup.swal-wide-form-equipment4 .swal-inner-table thead th{
    text-align: center !important;
  }
}
.swal2-popup.swal-wide-form-equipment4{
  width: min(600px, 96vw) !important;  /* กว้างสุด */
  max-width: none !important;
  padding: 24px 26px 22px !important;
  font-family: inherit !important;
}

  /* ให้โครงสร้างสูงเต็มหน้าจอ และตัด margin เริ่มต้นของ body */
  html, body, #app { height: 100%; margin: 0; }

  /* ตารางสรุปใน SweetAlert */
.swal2-popup .swal-booking-table{
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  margin: 6px 0 2px;
}
.swal2-popup .swal-booking-table th{
  background: #f3f4f6;
  text-align: left !important;   /* จาก right -> left */
  white-space: nowrap;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  vertical-align: top;
  font-weight: 700;
}
.swal2-popup .swal-booking-table td{
  text-align: left;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  max-width: min(56vw, 560px);
  word-break: break-word;
  line-height: 1.6;
}

/* ตารางย่อย: รายการอุปกรณ์ */
.swal2-popup .swal-items-wrap{
  max-height: 260px;           /* เลื่อนดูได้ถ้ารายการยาว */
  overflow: auto;
  margin-top: 2px;
}
.swal2-popup .swal-inner-table{
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}
.swal2-popup .swal-inner-table th{
  background: #f9fafb;
  text-align: center;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  font-weight: 700;
}
.swal2-popup .swal-inner-table td{
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
}

/* มือถือ: แปลงตารางสรุปเป็นการ์ดแถว-ต่อ-แถว อ่านง่าย */
@media (max-width: 520px){
  .swal2-popup .swal-booking-table,
  .swal2-popup .swal-booking-table tbody,
  .swal2-popup .swal-booking-table tr,
  .swal2-popup .swal-booking-table td,
  .swal2-popup .swal-booking-table th{
    display: block;
    width: 100%;
  }
  .swal2-popup .swal-booking-table tr{
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 6px 0;
    margin-bottom: 10px;
    background: #fff;
  }
  .swal2-popup .swal-booking-table th{
    text-align: left;
    background: #f9fafb;
    border: none;
    padding: 8px 12px 2px;
  }
  .swal2-popup .swal-booking-table td{
    border: none;
    padding: 2px 12px 10px;
  }

  /* ==== SweetAlert2 เฉพาะหน้า form_equipment4.vue ==== */

.swal2-popup.swal-wide-form-equipment4 .swal2-html-container{
  width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}

.swal2-popup.swal-wide-form-equipment4 .swal-booking-table{
  width: 100% !important;
  border-collapse: collapse;
  font-size: 0.95rem;
  margin: 6px 0 2px;
}

.swal2-popup.swal-wide-form-equipment4 .swal-booking-table th{
  background: #f3f4f6;
 text-align: left !important;               /* ✅ ชิดขวา */
  white-space: nowrap;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  vertical-align: top;
  font-weight: 700;
}

.swal2-popup.swal-wide-form-equipment4 .swal-booking-table td{
  text-align: left;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  max-width: none !important;
  word-break: break-word;
  line-height: 1.6;
}

/* สัดส่วนคอลัมน์ */
.swal2-popup.swal-wide-form-equipment4 .swal-booking-table tr > th { width: 32%; }
.swal2-popup.swal-wide-form-equipment4 .swal-booking-table tr > td { width: 68%; }
/* ===== กันล้น/เพี้ยนเมื่อเป็นไซส์มือถือ ===== */
.swal2-popup.swal-wide-form-equipment4 .swal-items-wrap{
  max-height: 260px;
  overflow-y: auto;
  overflow-x: hidden;  /* กันเลื่อนแนวนอน */
}
.swal2-popup.swal-wide-form-equipment4{
  width: min(550px, 92vw) !important;  /* กว้างสุด */
  max-width: none !important;
  padding: 24px 26px 22px !important;
  font-family: inherit !important;
}
/* มือถือ: card layout */
/* ===== ปรับสเกลสำหรับมือถือ ===== */
@media (max-width: 520px){
  /* ย่อขนาดป็อปอัป + เก็บขอบ */
  .swal2-popup.swal-wide-form-equipment4{
    width: 94vw !important;
    padding: 16px 14px 18px !important;
  }
  /* ย่อไอคอนติ๊กเขียวและหัวข้อ */
  .swal2-popup.swal-wide-form-equipment4 .swal2-icon{
    transform: scale(0.72);
    margin: 8px auto 4px;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal2-title{
    font-size: 1.05rem;
    margin: 4px 0 8px;
  }

  /* ตารางสรุปหลักเป็นแบบการ์ดอ่านง่าย (ตามเดิม) */
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table,
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table tbody,
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table tr,
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table td,
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table th{
    display: block;
    width: 100%;
    box-sizing: border-box;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table th{
    text-align: left !important;
    background: #f9fafb;
    border: none;
    padding: 8px 12px 2px;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table td{
    border: none;
    padding: 2px 12px 10px;
  }

  /* ===== “ล็อก” ตารางรายการอุปกรณ์ด้านในให้เป็น table จริง ไม่แตกเป็นบล็อก ===== */
  .swal2-popup.swal-wide-form-equipment4 .swal-inner-table{
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal-inner-table thead{ display: table-header-group !important; }
  .swal2-popup.swal-wide-form-equipment4 .swal-inner-table tbody{ display: table-row-group !important; }
  .swal2-popup.swal-wide-form-equipment4 .swal-inner-table tr{ display: table-row !important; }
  .swal2-popup.swal-wide-form-equipment4 .swal-inner-table th,
  .swal2-popup.swal-wide-form-equipment4 .swal-inner-table td{
    display: table-cell !important;
    word-break: break-word;
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
  }

  /* ลดความสูงกรอบเลื่อนรายการในมือถือ */
  .swal2-popup.swal-wide-form-equipment4 .swal-items-wrap{
    max-height: 200px;
  }
}

}

/* ==== มือถือ: ให้หัวข้อซ้าย / เนื้อหาขวา + ลดช่องว่าง (เฉพาะ form_equipment4) ==== */
@media (max-width: 520px){
  /* บังคับกลับเป็นตาราง 2 คอลัมน์ ไม่ให้แปลงเป็น block */
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table{ 
    display: table !important; width:100% !important; border-collapse: collapse;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table tbody{
    display: table-row-group !important;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table tr{
    display: table-row !important;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table th,
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table td{
    display: table-cell !important;
    padding: 6px 10px !important;      /* ลด padding */
    border: 1px solid #e5e7eb !important;
    vertical-align: middle !important;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table tr > th{
    width: 38% !important;              /* สัดส่วนซ้าย */
    text-align: left !important;
    white-space: nowrap;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal-booking-table tr > td{
    width: 62% !important;              /* สัดส่วนขวา */
    text-align: left !important;
  }

  /* ย่อป็อปอัปและหัวข้อให้กระชับ */
  .swal2-popup.swal-wide-form-equipment4{
    width: 92vw !important;
    padding: 14px 14px 16px !important;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal2-title{
    font-size: 1rem !important;
    margin: 2px 0 6px !important;
  }
  .swal2-popup.swal-wide-form-equipment4 .swal-items-wrap{
    max-height: 180px !important;       /* ลดความสูงพื้นที่รายการ */
  }
   .swal2-popup.swal-wide-form-equipment4 .swal-inner-table th:nth-child(2),
  .swal2-popup.swal-wide-form-equipment4 .swal-inner-table td:nth-child(2){
    text-align: center !important;
  }
}

/* หัวตาราง "รายการ / จำนวน" จัดกลาง */
.swal2-popup.swal-wide-form-equipment4 .swal-inner-table thead th{
  text-align: center !important;
  vertical-align: middle !important;
}

</style>

<style>
@import '../css/style.css';
</style>