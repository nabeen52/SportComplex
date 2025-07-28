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

    <div
  v-if="!isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
    ></div>

    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <!-- 🔔 START กระดิ่งแจ้งเตือน -->
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
                  :class="['notification-item', noti.type || '', { unread: idx === 0 }]"
                >
                  {{ noti.message }}
                </li>
                <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
              </ul>
            </div>
          </div>
          <!-- 🔔 END กระดิ่งแจ้งเตือน -->
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
              style="cursor:pointer"
              @click="goStep(index)"
            ></div>
            <div class="label">{{ step }}</div>
            <div v-if="index < steps.length - 1" class="line" :class="{ filled: index < currentStep }"></div>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div class="form-container">
        <h1 style="display: flex; justify-content: center;">ส่งคำขอสำเร็จ ✅</h1>
        <button class="pdfmake-btn" :disabled="!bookingInfo" @click="exportPdf(bookingInfo)">
          ดาวน์โหลด PDF ฟอร์ม
        </button>
        <br><br>
        <button id="btnNext" @click="handleNext">กลับหน้าแรก</button>
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import axios from 'axios'
import { useRouter } from 'vue-router'

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'

const API_BASE = import.meta.env.VITE_API_BASE
const products = ref([])
const router = useRouter()
const equipmentList = ref([])
const bookingInfo = ref(null)
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(3)
const isSidebarClosed = ref(false)

// Notification State
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) unreadCount.value = 0
}
function closeNotifications() {
  showNotifications.value = false
}
async function fetchNotifications() {
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const filterStatus = ['approved', 'disapproved', 'cancel', 'canceled', 'returned']
    const newNotis = (res.data || []).filter(item =>
      filterStatus.includes((item.status || '').toLowerCase())
    )
    if (newNotis.length > 0) {
      notifications.value = newNotis
        .map(item => ({
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
        .sort((a, b) => b.timestamp - a.timestamp)
      unreadCount.value = notifications.value.length
    } else {
      notifications.value = []
      unreadCount.value = 0
    }
  } catch (err) {
    notifications.value = []
    unreadCount.value = 0
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
  } catch {
    products.value = []
  }
}

async function loadBookingInfo() {
  const bookingId = localStorage.getItem('equipment_booking_id');
  if (!bookingId) {
    await Swal.fire('ไม่พบข้อมูลการจอง');
    return;
  }
  try {
    const res = await axios.get(`${API_BASE}/api/history`, {
      params: { booking_id: bookingId }
    });
    const historyList = (res.data || []).filter(
      h => h.type === 'equipment' && String(h.booking_id) === String(bookingId)
    );
    if (!historyList.length) {
      await Swal.fire('ไม่พบข้อมูลในประวัติ');
      return;
    }
    bookingInfo.value = historyList[0];
    let userName = historyList[0].requester || '-';
    if ((!userName || userName === '-') && historyList[0].user_id) {
      try {
        const userRes = await axios.get(`${API_BASE}/api/user/${historyList[0].user_id}`);
        userName = userRes.data?.name || historyList[0].user_id;
      } catch (e) {
        userName = historyList[0].user_id;
      }
    }
    const itemList = historyList.map(h => {
      return h.quantity ? `${h.name} (${h.quantity})` : h.name;
    }).join(', ');
    await Swal.fire({
      title: 'ส่งคำขอสำเร็จ!',
      html: `
        <p><b>ชื่อผู้ใช้:</b> ${userName}</p>
        <p><b>วันที่ขอยืม:</b> ${historyList[0].since ? new Date(historyList[0].since).toLocaleDateString('th-TH') : '-'}</p>
        <p><b>วันที่คืน:</b> ${historyList[0].uptodate ? new Date(historyList[0].uptodate).toLocaleDateString('th-TH') : '-'}</p>
        <p><b>รายการอุปกรณ์:</b> ${itemList || '-'}</p>
      `,
      icon: 'success',
      confirmButtonText: 'ตกลง',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  } catch (err) {
    await Swal.fire('ดึงข้อมูลการจองล้มเหลว', err?.message || '', 'error');
  }
}

onMounted(() => {
  loadBookingInfo()
  fetchNotifications()
  setInterval(fetchNotifications, 30000)
  loadCart()
})

function handleNext() {
  localStorage.removeItem('equipment_booking_id')
  localStorage.removeItem('equipmentFormData')
  router.push('/home_user')
}

// --- exportPdf: วาดลายเซ็นและชื่อชิดซ้าย/ลดขนาด/บรรทัดถัดจาก "ลงชื่อ (....)" ---
async function exportPdf(item) {
  if (item && item.value) item = item.value;
  if (!item) {
    Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลที่จะออก PDF', 'error');
    return;
  }

  function formatDate(date) {
    if (!date) return '-';
    if (typeof date === 'string' && date.includes('T')) {
      const d = new Date(date);
      if (!isNaN(d)) {
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      }
      return date.split('T')[0].split('-').reverse().join('/');
    }
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = date.split('-');
      return `${d}/${m}/${y}`;
    }
    return date;
  }

  function formatTime(time) {
    if (!time) return '-';
    if (typeof time === 'string' && time.match(/^\d{2}:\d{2}/)) return time;
    const t = new Date(`2000-01-01T${time}`);
    if (!isNaN(t.getTime())) return t.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return time;
  }

  const mainBookingId = item.booking_field_id || item.booking_equipment_id || item.booking_id;
  if (!mainBookingId) {
    Swal.fire('ผิดพลาด', 'ไม่พบ booking_id สำหรับรายการนี้', 'error');
    return;
  }

  try {
    const resBooking = await axios.get(`${API_BASE}/api/booking_equipment?id=${mainBookingId}`);
    const bookingData = Array.isArray(resBooking.data) ? resBooking.data[0] : resBooking.data;
    const itemRemarks = Array.isArray(bookingData.items)
      ? bookingData.items.map(i => ({
          name: i.item_name,
          remark: i.remark || ''
        }))
      : [];

    const historyRes = await axios.get(`${API_BASE}/api/history`);
    const allItems = historyRes.data
      .filter(d => String(d.booking_id) === String(mainBookingId))
      .filter(d => !d.status || d.status.toLowerCase() !== 'returned');

    const mergedItems = allItems.map((row, idx) => {
      const matched = itemRemarks.find(it => it.name === row.name);
      return {
        ...row,
        remark: matched ? matched.remark : '-'
      };
    });

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFont('Sarabun', 'normal');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.setFontSize(16);
    const title = 'แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง';
    const subTitle = 'โทร 053-917820-1 E-mail sport-complex@mfu.ac.th';
    doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, 45);
    doc.setFontSize(11);
    doc.text(subTitle, (pageWidth - doc.getTextWidth(subTitle)) / 2, 69);

    // ส่วนหัวด้านขวา
    const headerRightX = pageWidth - 50;
    const headerLines = [
      "ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง",
      `วันที่ ${formatDate(bookingData.start_date || bookingData.since || bookingData.date) || '-'}`,
      `วันที่มารับของ ${formatDate(bookingData.receive_date) || '-'}`,
      `เวลาที่มารับของ ${formatTime(bookingData.receive_time) || '-'} น.`
    ];
    let headerY = 100;
    const lineSpacing = 20;
    headerLines.forEach(line => {
      const textWidth = doc.getTextWidth(line);
      doc.text(line, headerRightX - textWidth, headerY);
      headerY += lineSpacing;
    });

    // ฟังก์ชันเช็ค y (ขึ้นหน้าใหม่ถ้าจำเป็น)
    function checkAddPage(nextY, space = 20) {
      if (nextY + space > pageHeight - 60) {
        doc.addPage();
        return 80;
      }
      return nextY;
    }

    // ข้อมูลรายละเอียด
    let y = headerY + 20;
    const leftMargin = 50;
    doc.setFont('Sarabun', 'normal');
    doc.setFontSize(12);

    // ข้อมูลทั่วไป
    y = checkAddPage(y, 16);
    doc.text(`ข้าพเจ้า ${bookingData.name || '-'}`, leftMargin, y);
    doc.text(`รหัสนักศึกษา/พนักงาน ${bookingData.user_id || '-'}`, leftMargin + 270, y);

    y += 28;
    y = checkAddPage(y, 16);
    doc.text(`หน่วยงาน ${bookingData.agency || '-'}`, leftMargin, y);

    // เหตุผล (ข้อความยาว)
    y += 28;
    const reasonText = `เหตุผลในการขอใช้เพื่อ: ${bookingData.reason || '-'}`;
    const reasonLines = doc.splitTextToSize(reasonText, pageWidth - 80);
    doc.setFontSize(12);
    for (const line of reasonLines) {
      y = checkAddPage(y, 16);
      doc.text(line, leftMargin-20, y);
      y += 20;
    }

    y = checkAddPage(y, 16);
    doc.text(`สถานที่ใช้งาน: ${bookingData.location || '-'}`, leftMargin-20, y);
    y += 25;
    y = checkAddPage(y, 16);

    doc.text(
      `ในวันที่ ${formatDate(bookingData.start_date || bookingData.since || bookingData.date) || '-'} ถึงวันที่ ${formatDate(bookingData.end_date || bookingData.uptodate) || '-'}`,
      leftMargin-20, y
    );
    y += 25;
    y = checkAddPage(y, 16);

    doc.text(`โดยมีรายการดังต่อไปนี้`, leftMargin-20, y);
    y += 25;

    // ตาราง (autoTable จะจัดการขึ้นหน้าให้เอง)
    autoTable(doc, {
      startY: y,
      head: [['ลำดับ', 'รายการ', 'จำนวน', 'หมายเหตุ']],
      body: mergedItems.map((row, idx) => [
        idx + 1,
        row.name || '-',
        row.quantity || '-',
        row.remark || '-'
      ]),
      headStyles: { fillColor: [40, 63, 125], textColor: 255, font: 'Sarabun', halign: 'center', fontSize: 11 },
      styles: { font: 'Sarabun', fontSize: 11, halign: 'center', cellPadding: 4 }
    });

    // กล่องลายเซ็น
    let signY = doc.lastAutoTable.finalY + 40;
    if (signY + 150 > pageHeight - 40) {
      doc.addPage();
      signY = 80;
    }
    const boxWidth = (pageWidth - 60) / 2;
    const boxHeight = 110;
    const marginLeft = 30;

    // Draw outer rectangles
    doc.setLineWidth(1);
    doc.setDrawColor(50,50,50);
    doc.rect(marginLeft, signY, boxWidth, boxHeight);
    doc.rect(marginLeft + boxWidth, signY, boxWidth, boxHeight);

    // Draw column titles
    doc.setFont('Sarabun', 'bold');
    doc.setFontSize(12);
    doc.text('ความคิดเห็น/คำสั่ง/ผลการพิจารณา', marginLeft + boxWidth/2, signY + 18, { align: 'center' });
    doc.text('ผลการดำเนินการ/ผลการปฏิบัติงาน', marginLeft + boxWidth + boxWidth/2, signY + 18, { align: 'center' });

    // Thin lines under headers
    doc.setDrawColor(200,200,200);
    doc.setLineWidth(0.7);
    doc.line(marginLeft + 10, signY + 25, marginLeft + boxWidth - 10, signY + 25);
    doc.line(marginLeft + boxWidth + 10, signY + 25, marginLeft + 2*boxWidth - 10, signY + 25);

    doc.setFont('Sarabun', 'normal');
    doc.setFontSize(11);

    // Left box lines
    doc.text('.................................................................', marginLeft + 17, signY + 40);
    doc.text('.................................................................', marginLeft + 17, signY + 54);
    doc.text('ลงชื่อ.............................................หัวหน้าส่วน', marginLeft + 17, signY + 70);
    doc.text('วันที่................./................./.................', marginLeft + 22, signY + 100);

    // Right box lines
    doc.text('.................................................................', marginLeft + boxWidth + 17, signY + 40);
    doc.text('.................................................................', marginLeft + boxWidth + 17, signY + 54);
    doc.text('ลงชื่อ.................................ผู้ปฏิบัติงาน/ผู้รับผิดชอบ', marginLeft + boxWidth + 17, signY + 70);
    doc.text('วันที่................./................./.................', marginLeft + boxWidth + 22, signY + 100);

    // ===== ลายเซ็นผู้ขอ (ชิดซ้าย ลดขนาด ชื่ออยู่บรรทัดถัดไป) =====
    const userName = bookingData.name || '-';
    const signX = marginLeft + boxWidth + 20;  // ชิดขวาของกล่อง
    let signTextY = signY + boxHeight + 40; // ใต้กล่อง

    // ถ้าพื้นที่ไม่พอสำหรับลายเซ็น+ชื่อ ขึ้นหน้าใหม่อีก
    if (signTextY + 32 > pageHeight - 40) {
      doc.addPage();
      signTextY = 80;
    }

    // วาด "ลงชื่อ (......)"
    const nameWidth = doc.getTextWidth(userName);
    const minParenWidth = 140;
    const parenWidth = Math.max(nameWidth + 20, minParenWidth);
    const parenDots = '.'.repeat(Math.round(parenWidth / doc.getTextWidth('.')));
    const parenText = `( ${parenDots} )`;

    doc.setFont('Sarabun', 'normal');
    doc.setFontSize(11);
    doc.text(`ลงชื่อ ${parenText}`, signX, signTextY, { align: 'left' });

    // ชื่ออยู่บรรทัดใหม่
    doc.setFont('Sarabun', 'normal');
    doc.setFontSize(12);
    doc.text(userName, signX + 35, signTextY + 16, { align: 'left' });

    doc.save('user_form.pdf');
  } catch (err) {
    Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการดาวน์โหลด PDF', 'error');
    console.error(err);
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
}
.circle.active {
  background-color: #ff4d4f;
}
.circle.completed {
  background-color: #ff4d4f;
  opacity: 0.5;
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

</style>
<style>
@import '../css/style.css';
</style>