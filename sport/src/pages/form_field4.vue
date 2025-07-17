<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/home_user" exact-active-class="active"><i class="pi pi-home"></i> Home</router-link>
        <router-link to="/booking_field" active-class="active"><i class="pi pi-map-marker"></i> Field</router-link>
        <router-link to="/booking_equipment" active-class="active"><i class="pi pi-box"></i> Equipment</router-link>
        <router-link to="/history" active-class="active"><i class="pi pi-history"></i> History</router-link>
      </nav>
    </aside>

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
      v-for="(noti, idx) in notifications"
      :key="noti.id || idx"
      :class="['notification-item', noti.type || '', { unread: idx === 0 }]"
    >
      {{ noti.message }}
    </li>
    <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
  </ul>
</div>

          </div>
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
              style="cursor:not-allowed"
              @click.stop
            ></div>
            <div class="label">{{ step }}</div>
            <div v-if="index < steps.length - 1" class="line" :class="{ filled: index < currentStep }"></div>
          </div>
        </div>
      </div>

      <div class="form-container">
        <h1 style="display: flex; justify-content: center;">ส่งคำขอสำเร็จ ✅</h1>
        <button class="pdfmake-btn" @click="() => { console.log('info', info); exportPdf(info) }">ดาวน์โหลด PDF ฟอร์ม</button>

        <br>
        <br>
        <button id="btnNext" @click="handleNext">กลับหน้าแรก</button>
      </div>
    </div>

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
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'


import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// (ถ้าจะใช้ภาษาไทย ต้อง import Sarabun font ที่ bundle มาแล้วใน public หรือ assets ตามตัวอย่างด้านล่าง)
import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'


const API_BASE = import.meta.env.VITE_API_BASE
// -------------- กระดิ่งแจ้งเตือน --------------
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const lastCheckedIds = new Set()


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
      newNotis.forEach(item => lastCheckedIds.add(item._id))
      unreadCount.value = notifications.value.length
    }
  } catch (err) {
    // ไม่ต้อง alert
  }
}
onMounted(() => {
  fetchNotifications()
  setInterval(fetchNotifications, 30000)
})
// ----------------------------------------------

const router = useRouter()
const info = ref({})
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(3)
const isSidebarClosed = ref(false)
const stepRoutes = ['/form_field', '/form_field3', '/form_field4']

function toggleSidebar() { isSidebarClosed.value = !isSidebarClosed.value }
function canStepTo(idx) { return idx <= currentStep.value }
function goStep(idx) {
  // ฟังก์ชันนี้จะไม่มีทางถูกเรียก เพราะปิด @click ไว้หมดแล้ว
  if (!canStepTo(idx) || idx === currentStep.value) return
  router.push(stepRoutes[idx])
}
function formatDateOnly(dateTime) {
  if (!dateTime) return '-'
  let dateObj
  if (typeof dateTime === 'string') {
    // รองรับรูปแบบ ISO: 2024-07-05T00:00:00.000Z หรือ 2024-07-05
    const parts = dateTime.split('T')[0].split('-')
    if (parts.length === 3) {
      // yyyy-mm-dd
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
  const year = dateObj.getFullYear()
  return `${day}/${month}/${year}`
}

// ==== ดึง booking + ดึงชื่อผู้ขอ ====
async function loadBookingInfo() {
  const bookingId = localStorage.getItem('bookingId')
  if (!bookingId) {
    Swal.fire('ไม่พบข้อมูลการจอง')
    return
  }
  try {
    const res = await axios.get(`${API_BASE}/api/booking_field/${bookingId}`)
    info.value = res.data
    info.value.type = 'field' // <---- เพิ่มบรรทัดนี้!
    // <<< เพิ่มจุดนี้ >>>>
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

    // === แจ้งเตือนเหมือนเดิม ===
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

  // ==== ล้างไฟล์แนบให้หมด ====
  if (window._tempSelectedFiles) window._tempSelectedFiles = []
  sessionStorage.removeItem('form_field_save')

  // เผื่อ input file ยังจำไฟล์เดิม
  setTimeout(() => {
    const fileInput = document.getElementById('fileUploadInput')
    if (fileInput) fileInput.value = ''
  }, 100)

  router.push('/home_user')
}

 async function exportPdf(item) {
  // ฟังก์ชันช่วย format วันที่/เวลา
  function formatDate(date) {
    if (!date) return '-';
    if (typeof date === 'string' && date.includes('T')) {
      const d = new Date(date);
      if (!isNaN(d)) {
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      }
      return date.split('T')[0].split('-').reverse().join('/');
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

  // รองรับ field ชื่อ booking_field_id, booking_equipment_id, booking_id
  const mainBookingId = item.booking_field_id || item.booking_equipment_id || item.booking_id;
  const mainId = item.id || item._id;

  if (!mainBookingId) {
    Swal.fire('ผิดพลาด', 'ไม่พบ booking_id สำหรับรายการนี้', 'error');
    return;
  }

  let url = '';
  if (item.type === 'field') {
    url = `${API_BASE}/api/booking_field?id=${mainBookingId}`;
  } else if (item.type === 'equipment') {
    url = `${API_BASE}/api/booking_equipment?id=${mainBookingId}`;
  } else {
    Swal.fire('ผิดพลาด', 'ประเภทข้อมูลไม่รองรับ', 'error');
    return;
  }

  try {
    const res = await axios.get(url);
    const normalize = x => (typeof x === 'object' && x !== null && '$oid' in x) ? x.$oid : String(x || '');

    let data;
    if (Array.isArray(res.data)) {
      data = res.data.find(d => normalize(d.booking_id) === normalize(mainBookingId));
      if (!data && mainId) {
        data = res.data.find(d => normalize(d._id) === normalize(mainId));
      }
      if (!data && res.data.length === 1) data = res.data[0];
    } else {
      data = res.data;
    }

    if (!data) {
      Swal.fire('ไม่พบข้อมูล', 'ไม่พบข้อมูลการจอง', 'warning');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFont('Sarabun');

    // ---------------- ฟอร์ม "field" -------------------
    if (item.type === 'field') {
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(17);
      doc.text('แบบฟอร์มขออนุมัติใช้สถานที่ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง', 80, 48);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11);
      doc.text('โทร 053-917820-1 | E-mail: sport-complex@mfu.ac.th', 180, 68);

      doc.setFontSize(12);
      doc.text(`ที่ อว. ${data.aw || '-'}`, 55, 96);
      doc.text(`วันที่ ${formatDate(data.since) || '-'}`, 240, 96);
      doc.text(`โทร ${data.tel || '-'}`, 425, 96);

      doc.setFontSize(12);
      doc.text('เรื่อง  ขออนุมัติใช้สถานที่', 25, 121);
      doc.text('เรียน  ผู้อำนวยการศูนย์กีฬา', 25, 146);

      doc.setFontSize(12);
      doc.text(`ด้วย ${data.agency || '-'}`, 55, 171);
      doc.text(`จะดำเนินกิจกรรม / โครงการ ${data.name_activity || '-'}`, 25, 196);
      doc.text(`เหตุผลในการขอใช้คือ ${data.reasons || '-'}`, 25, 221);

      doc.text(`ในวันที่ ${formatDate(data.since) || '-'}`, 25, 246);
      doc.text(`ถึงวันที่ ${formatDate(data.uptodate) || '-'}`, 175, 246);
      doc.text(`ตั้งแต่เวลา ${formatTime(data.since_time) || '-'} น.`, 325, 246);
      doc.text(`ถึงเวลา ${formatTime(data.until_thetime) || '-'} น.`, 475, 246);

      doc.text(`จำนวนผู้เข้าร่วม ${data.participants || '-'}`, 25, 271);

      doc.setFontSize(12);
      doc.text('และมีความประสงค์ขออนุญาตใช้ห้อง/สนาม ดังรายละเอียดต่อไปนี้', 25, 296);

      doc.setFontSize(12);
      doc.setFont('Sarabun', 'bold');
      doc.text('1. ข้อมูลผู้ใช้สถานที่', 25, 321);
      doc.setFont('Sarabun', 'normal');
      doc.text(`อาคาร ${data.building || '-'}`, 55, 346);
      doc.text(`ระบุหมายเลขพื้นที่/ห้องที่ต้องการใช้ ${data.zone || '-'}`, 280, 346);
      doc.setFont('Sarabun', 'bold');
      doc.text('2. ขออนุญาตใช้ระบบสาธารณูปโภค', 25, 371);
      doc.setFont('Sarabun', 'normal');
      doc.text(`เปิดเครื่องปรับอากาศตั้งแต่ ${data.turnon_air || '-'} น. ถึง ${data.turnoff_air || '-'} น. ( เฉพาะอาคารเฉลิมพระเกียรติฯ)`, 55, 396);
      doc.text(`ไฟฟ้าส่องสว่างตั้งแต่ ${data.turnon_lights || '-'} น. ถึง ${data.turnoff_lights || '-'} น. ( เฉพาะอาคารเฉลิมพระเกียรติฯ)`, 55, 421);
      doc.text(`อื่นๆ ${data.other || '-'}`, 55, 446);
      doc.setFont('Sarabun', 'bold');
      doc.text('3.ขออนุมัติรายการประกอบอาคาร', 25, 471);
      doc.setFont('Sarabun', 'normal');
      doc.text(`ดึงอัฒจันทร์ภายในอาคารเฉลิมพระเกียรติฯ ${data.amphitheater || '-'}`, 55, 496);
      doc.text(`อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน) ${data.need_equipment || '-'}`, 55, 521);

      let signY = 565;
      doc.setFontSize(12);
      doc.text('ลงชื่อ................................................', 25, signY);
      doc.text('ลงชื่อ................................................', 210, signY);
      doc.text('ลงชื่อ................................................', 395, signY);

      doc.text(`(  ${data.requester}  )`, 35, signY + 25);
      doc.text('(..................................................)', 220, signY + 25);
      doc.text('(..................................................)', 405, signY + 25);

      doc.text('นักศึกษา/ผู้รับผิดชอบ', 65, signY + 45);
      doc.text('อาจารย์/ที่ปรึกษาโครงการ', 235, signY + 45);
      doc.text('คณะ/หัวหน้าหน่วยงาน', 434, signY + 45);

      let boxY = signY + 65;
      const pageWidth2 = doc.internal.pageSize.getWidth();
      const boxWidth = (pageWidth2 - 40) / 3;
      const boxHeight = 190;
      const marginLeft = 20;

      for (let i = 0; i < 3; i++) {
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(1);
        doc.rect(marginLeft + i * boxWidth, boxY, boxWidth, boxHeight);
      }

      let x1 = marginLeft;
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('1. เลขานุการศูนย์กีฬา', x1 + 28, boxY + 22);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11.5);
      doc.rect(x1 + 16, boxY + 40, 10, 10);
      doc.text('เรียน หัวหน้าศูนย์กีฬา', x1 + 16 + 14, boxY + 50);
      doc.rect(x1 + 16, boxY + 65, 10, 10);
      doc.text('เพื่อโปรดพิจารณา', x1 + 16 + 14, boxY + 75);
      doc.rect(x1 + 16, boxY + 90, 10, 10);
      doc.text('อื่นๆ ___________________________', x1 + 16 + 14, boxY + 100);
      doc.text('.......................................................', x1 + 12, boxY + 125);
      doc.text('(....................................................)', x1 + 12, boxY + 150);
      doc.text('วันที่ ..........................................', x1 + 16, boxY + 175);

      let x2 = marginLeft + boxWidth;
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('2. หัวหน้าศูนย์กีฬา', x2 + 40, boxY + 22);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11.5);
      doc.rect(x2 + 16, boxY + 40, 10, 10);
      doc.text('เรียนท่านรองอธิการบดี', x2 + 16 + 14, boxY + 50);
      doc.rect(x2 + 16, boxY + 65, 10, 10);
      doc.text('เพื่อโปรดพิจารณา', x2 + 16 + 14, boxY + 75);
      doc.rect(x2 + 16, boxY + 90, 10, 10);
      doc.text('อื่นๆ ___________________________', x2 + 16 + 14, boxY + 100);
      doc.text('.......................................................', x2 + 12, boxY + 125);
      doc.text('(....................................................)', x2 + 12, boxY + 150);
      doc.text('วันที่ ..........................................', x2 + 16, boxY + 175);

      let x3 = marginLeft + boxWidth * 2;
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('3. อธิการบดี', x3 + 60, boxY + 22);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11.5);
      doc.rect(x3 + 16, boxY + 40, 10, 10);
      doc.text('อนุมัติข้อ', x3 + 16 + 14, boxY + 50);
      doc.rect(x3 + 16, boxY + 65, 10, 10);
      doc.text('อื่นๆ ___________________________', x3 + 16 + 14, boxY + 75);
      doc.text('.......................................................', x3 + 12, boxY + 100);
      doc.text('.......................................................', x3 + 12, boxY + 125);
      doc.text('(....................................................)', x3 + 12, boxY + 150);
      doc.text('วันที่ ..........................................', x3 + 16, boxY + 175);

      for (let i = 0; i < 3; i++) {
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(1);
        doc.line(marginLeft + i * boxWidth, boxY + 32, marginLeft + (i + 1) * boxWidth, boxY + 32);
      }
    }

    // ---------------- ฟอร์ม "equipment" -------------------
    else if (item.type === 'equipment') {
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(16);
      const title = 'แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง';
      const subTitle = 'โทร 053-917820-1 E-mail sport-complex@mfu.ac.th';
      const pageWidth = doc.internal.pageSize.getWidth();
      const titleWidth = doc.getTextWidth(title);
      const subTitleWidth = doc.getTextWidth(subTitle);
      doc.text(title, (pageWidth - titleWidth) / 2, 45);
      doc.setFontSize(11);
      doc.text(subTitle, (pageWidth - subTitleWidth) / 2, 62);

      doc.setFontSize(11);
      doc.text(`วันที่ ${formatDate(data.start_date) || '-'}`, 60, 92);
      doc.text(`วันที่มารับของ ${formatDate(data.receive_date) || '-'}`, 210, 92);
      doc.text(`เวลาที่มารับของ ${formatTime(data.receive_time) || '-'}`, 370, 92);
      doc.text(`หน่วยงาน ${data.agency || '-'}`, 60, 112);
      doc.text(`ชื่อผู้ขอ ${data.requester || item.userName || '-'}`, 60, 132);
      doc.text(`รหัส ${data.user_id || '-'}`, 310, 132);

      doc.text(`เหตุผลในการขอใช้เพื่อ: ${data.reason || '-'}`, 60, 150);
      doc.text(`สถานที่ใช้งาน: ${data.location || '-'}`, 60, 170);
      doc.text(
        `ในวันที่ ${formatDate(data.start_date) || '-'} ถึงวันที่ ${formatDate(data.end_date) || '-'}`,
        60, 190
      );

      autoTable(doc, {
        startY: 230,
        head: [['ลำดับ', 'รายการ', 'จำนวน', 'หมายเหตุ']],
        body: (Array.isArray(data.items) && data.items.length > 0
          ? data.items
          : [{ item_name: item.name, amount: item.quantity, remark: item.remark }]
        ).map((item2, idx) => [
          idx + 1,
          item2.item_name || '-',
          item2.amount || '-',
          item2.remark || '-'
        ]),
        headStyles: { fillColor: [40, 63, 125], textColor: 255, font: 'Sarabun', halign: 'center', fontSize: 11 },
        styles: { font: 'Sarabun', fontSize: 11, halign: 'center', cellPadding: 4 }
      });

      // ==== ตารางเซ็นชื่อ 2 ช่องแนวนอนแบบมีกรอบ ====
      let signY = doc.lastAutoTable.finalY + 30;
      const pageWidth2 = doc.internal.pageSize.getWidth();
      const boxWidth = (pageWidth2 - 40) / 2;
      const boxHeight = 120;
      const marginLeft = 20;

      // วาดกรอบ 2 ช่อง
      for (let i = 0; i < 2; i++) {
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(1);
        doc.rect(marginLeft + i * boxWidth, signY, boxWidth, boxHeight);
      }
      // ช่องซ้าย
      let x1 = marginLeft;
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(12);
      doc.text('ความเห็นเพิ่มเติม/คำสั่ง/ผลการพิจารณา', x1 + 8, signY + 22);
      doc.text('.....................................................................................', x1 + 8, signY + 42);
      doc.text('.....................................................................................', x1 + 8, signY + 62);
      doc.text('ลงชื่อ............................................................หัวหน้าส่วน', x1 + 8, signY + 82);
      doc.text('วันที่....................../.............................../.......................', x1 + 8, signY + 102);

      // ช่องขวา
      let x2 = marginLeft + boxWidth;
      doc.text('ผลการดำเนินการ/ผลการปฏิบัติงาน', x2 + 8, signY + 22);
      doc.text('.....................................................................................', x2 + 8, signY + 42);
      doc.text('.....................................................................................', x2 + 8, signY + 62);
      doc.text('ลงชื่อ.......................................ผู้ปฏิบัติงาน/ผู้รับผิดชอบ', x2 + 8, signY + 82);
      doc.text('วันที่....................../.............................../.......................', x2 + 8, signY + 102);

      // เส้นคาดหัวช่อง
      for (let i = 0; i < 2; i++) {
        doc.setDrawColor(140, 140, 140);
        doc.setLineWidth(0.5);
        doc.line(marginLeft + i * boxWidth, signY + 28, marginLeft + (i + 1) * boxWidth, signY + 28);
      }

      // === ส่วนไฟล์แนบและชื่อผู้ขอ (เพิ่มท้ายฟอร์ม)
      let fileY = signY + boxHeight + 16;
      if (data.requester || item.userName) {
        doc.text(`ลงชื่อ  ${data.requester || item.userName}`, 420, fileY + 60);
      }
    }

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