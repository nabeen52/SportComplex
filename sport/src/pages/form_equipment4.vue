<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
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

    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
  <button class="menu-toggle" @click="toggleSidebar">☰</button>
  <div class="topbar-actions">
    <!-- 🔔 START กระดิ่งแจ้งเตือน -->
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
    <!-- 🔔 END กระดิ่งแจ้งเตือน -->
    <router-link to="/cart"><i class="pi pi-shopping-cart"></i></router-link>
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
        <!-- ใน template -->
        <button class="pdfmake-btn" :disabled="!bookingInfo" @click="exportPdf(bookingInfo)">
  ดาวน์โหลด PDF ฟอร์ม
</button>



        <br>
        <br>
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


// (ถ้าจะใช้ภาษาไทย ต้อง import Sarabun font ที่ bundle มาแล้วใน public หรือ assets ตามตัวอย่างด้านล่าง)
import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'

const API_BASE = import.meta.env.VITE_API_BASE

const router = useRouter()
const equipmentList = ref([])
const bookingInfo = ref(null) // ต้องเป็น null เพื่อเช็ค !bookingInfo ได้
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(3)
const isSidebarClosed = ref(false)

// =============== Notification State (ยกมาจากหน้า 3) ================
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
// ===================================================================

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

// -- ส่วนนี้ไม่ต้องแก้ (ตามโค้ดเดิม) --
async function loadBookingInfo() {
  const bookingId = localStorage.getItem('equipment_booking_id');
  if (!bookingId) {
    await Swal.fire('ไม่พบข้อมูลการจอง');
    return;
  }

  try {
    // ดึงทุก record ที่ booking_id ตรงกัน
    const res = await axios.get(`${API_BASE}/api/history`, {
      params: { booking_id: bookingId }
    });
    // filter เฉพาะ equipment + booking_id ตรงกัน
    const historyList = (res.data || []).filter(
      h => h.type === 'equipment' && String(h.booking_id) === String(bookingId)
    );
    if (!historyList.length) {
      await Swal.fire('ไม่พบข้อมูลในประวัติ');
      return;
    }
    // สมมุติ record ทุกตัวใน booking_id เดียวกันเป็นของ booking เดียวกันหมด
    bookingInfo.value = historyList[0];

    // ชื่อผู้ขอ ใช้จาก record แรก
    let userName = historyList[0].requester || '-';
    if ((!userName || userName === '-') && historyList[0].user_id) {
      try {
        const userRes = await axios.get(`${API_BASE}/api/user/${historyList[0].user_id}`);
        userName = userRes.data?.name || historyList[0].user_id;
      } catch (e) {
        userName = historyList[0].user_id;
      }
    }

    // แสดงอุปกรณ์ทุกอันที่ booking_id เดียวกัน
    // ถ้าแต่ละ record มี name, quantity, remark
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
})

function handleNext() {
  localStorage.removeItem('equipment_booking_id')
  localStorage.removeItem('equipmentFormData')
  router.push('/home_user')
}

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
    // 1. ดึง booking_equipment (เพื่อเอา remark)
    const resBooking = await axios.get(`${API_BASE}/api/booking_equipment?id=${mainBookingId}`);
    const bookingData = Array.isArray(resBooking.data) ? resBooking.data[0] : resBooking.data;
    const itemRemarks = Array.isArray(bookingData.items)
      ? bookingData.items.map(i => ({
          name: i.item_name,
          remark: i.remark || ''
        }))
      : [];

    // 2. ดึงรายการ /api/history ของ booking นี้ (ที่ไม่ใช่ returned)
    const historyRes = await axios.get(`${API_BASE}/api/history`);
    const allItems = historyRes.data
      .filter(d => String(d.booking_id) === String(mainBookingId))
      .filter(d => !d.status || d.status.toLowerCase() !== 'returned');

    // 3. Join remark เข้ากับรายการ
    const mergedItems = allItems.map((row, idx) => {
      const matched = itemRemarks.find(it => it.name === row.name);
      return {
        ...row,
        remark: matched ? matched.remark : '-'
      };
    });

    // 4. สร้าง PDF
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFont('Sarabun', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    const title = 'แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง';
    const subTitle = 'โทร 053-917820-1 E-mail sport-complex@mfu.ac.th';
    doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, 45);
    doc.setFontSize(11);
    doc.text(subTitle, (pageWidth - doc.getTextWidth(subTitle)) / 2, 69);

    // --- รายละเอียด ---
    doc.setFontSize(11);
    doc.text(`ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง`, 380, 100);
      doc.text(`วันที่ ${formatDate(bookingData.start_date || bookingData.since || bookingData.date) || '-'}`, 400, 125);
      doc.text(`วันที่มารับของ ${formatDate(bookingData.receive_date) || '-'}`, 400, 145);
      doc.text(`เวลาที่มารับของ ${formatTime(bookingData.receive_time) || '-'} น.`, 400, 165);
      doc.text(`หน่วยงาน ${bookingData.agency || '-'}`, 380, 185);

      doc.text(`ข้าพเจ้า ${bookingData.name || '-'}`, 50, 250);
      doc.text(`รหัสนักศึกษา/พนักงาน ${bookingData.user_id || '-'}`, 260, 250);

      const reasonText = `เหตุผลในการขอใช้เพื่อ: ${bookingData.reason || '-'}`;
      const reasonLines = doc.splitTextToSize(reasonText, pageWidth - 100);
      let yReason = 275;
      const lineSpacing = 30;
      for (let i = 0; i < reasonLines.length; i++) {
        doc.text(reasonLines[i], 30, yReason + (i * lineSpacing));
      }

      doc.text(`สถานที่ใช้งาน: ${bookingData.location || '-'}`, 30, 300);
      doc.text(
        `ในวันที่         ${formatDate(bookingData.start_date || bookingData.since || bookingData.date) || '-'}         ถึงวันที่         ${formatDate(bookingData.end_date || bookingData.uptodate) || '-'}`,
        30, 330
      );
      doc.text(`โดยมีรายการดังต่อไปนี้ `,30, 360);

    // ตารางรายการ
    autoTable(doc, {
      startY: 390,
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

    // ช่องเซ็นชื่อ
    const marginRight = 60;
    const signText = 'ลงชื่อ  (...........................................................)';
    const nameText = bookingData.name || '-';
    const signTextWidth = doc.getTextWidth(signText);
    const nameTextWidth = doc.getTextWidth(nameText);
    doc.text(signText, pageWidth - signTextWidth - marginRight, 800);
    doc.text(nameText, pageWidth - nameTextWidth - marginRight -15, 820);

    let signY = doc.lastAutoTable.finalY + 100;
    const boxWidth = (pageWidth - 40) / 2;
    const boxHeight = 140;
    const marginLeft = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (signY + boxHeight > pageHeight - 30) {
      signY = pageHeight - boxHeight - 40;
    }

    for (let i = 0; i < 2; i++) {
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(1);
      doc.rect(marginLeft + i * boxWidth, signY, boxWidth, boxHeight);
    }

    // หัวข้อในช่องเซ็น
    const headerY = signY + 28;
    const lineY = headerY + 10;
    const boxHeaderPad = 0;
    doc.setFont('Sarabun', 'bold');
    doc.text('ความคิดเห็น/คำสั่ง/ผลการพิจารณา', marginLeft + 50, headerY);
    doc.setDrawColor(0,0,0);
    doc.setLineWidth(1);
    doc.line(marginLeft + boxHeaderPad, lineY, marginLeft + boxWidth - boxHeaderPad, lineY);

    doc.text('ผลการดำเนินการ/ผลการปฏิบัติงาน', marginLeft + boxWidth + 50, headerY);
    doc.line(marginLeft + boxWidth + boxHeaderPad, lineY, marginLeft + 2*boxWidth - boxHeaderPad, lineY);

    doc.setFont('Sarabun', 'normal');
    doc.text('...........................................................................................', marginLeft + 12, signY + 65);
    doc.text('...........................................................................................', marginLeft + 12, signY + 90);
    doc.text('ลงชื่อ.....................................................................หัวหน้าส่วน', marginLeft + 6, signY + 110);
    doc.text('วันที่....................../....................../....................', marginLeft + 16, signY + 130);

    doc.text('...........................................................................................', marginLeft + boxWidth + 12, signY + 65);
    doc.text('...........................................................................................', marginLeft + boxWidth + 12, signY + 90);
    doc.text('ลงชื่อ................................................ผู้ปฏิบัติงาน/ผู้รับผิดชอบ', marginLeft + boxWidth + 7, signY + 110);
    doc.text('วันที่....................../....................../....................', marginLeft + boxWidth + 16, signY + 130);

    doc.save('user_form.pdf');
  } catch (err) {
    Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการดาวน์โหลด PDF', 'error');
    console.error(err);
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
@media (max-width: 540px) {
  .notification-dropdown {
    min-width: 220px;
    max-width: 99vw;
  }
  .notification-dropdown li {
    font-size: 0.99rem;
    padding: 0.7em 0.7em;
  }
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
</style>
