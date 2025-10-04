<template>  
  <div class="layout">
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">Sport Complex MFU</p>
      </div>
      <nav class="nav-links">
        <router-link to="/home_user" exact-active-class="active"><i class="pi pi-home"></i> Home</router-link>
        <router-link to="/booking_field" active-class="active"><i class="pi pi-map-marker"></i> Field</router-link>
        <router-link to="/booking_equipment" active-class="active"><i class="pi pi-box"></i> Equipment</router-link>
        <router-link to="/history" active-class="active"><i class="pi pi-history"></i> History</router-link>
      </nav>
    </aside>

    <div
      v-if="!isSidebarClosed"
      class="sidebar-overlay"
      @click="toggleSidebar"
    ></div>

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
                <li v-for="(noti, idx) in notifications.slice(0, 10)" :key="noti.id || idx"
                  :class="['notification-item', noti.type || '', { unread: idx === 0 }]">
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

      <!-- เดิมใน form_equipment3 -->
<div class="headStepper" role="navigation" aria-label="ขั้นตอน">
  <div class="stepper">
    <div v-for="(step, index) in steps" :key="index" class="step">
      <div
        class="circle"
        :class="{ active: index === currentStep, completed: index < currentStep }"
        @click="goStep(index)"
        :style="{ cursor: canStepTo(index) ? 'pointer' : 'not-allowed', opacity: canStepTo(index) ? 1 : 0.5 }"
      ></div>
      <div class="label">{{ step }}</div>
      <div v-if="index < steps.length - 1" class="line" :class="{ filled: index < currentStep }"></div>
    </div>
  </div>
</div>


      <div class="scroll-x-container">
      <div class="form-container">
        <h1 style="display: flex; justify-content: center;">ยืนยันข้อมูล</h1>
        <div id="pdf-section"> 
        <div class="form-header">
          <h3>แบบฟอร์มการยืมอุปกรณ์ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h3>
          <p><b>โทร: 0-5391-7820 และ 0-5391-7821 | E-mail: sport-complex@mfu.ac.th</b></p>
        </div>

        <!-- กลุ่มขวา: วันที่มารับของและเวลามารับของ -->
        <div class="form-header-section">
          <div class="right-form" style="align-items: flex-end; text-align: right;">
            <div class="form-row-title" style="font-size: 18px; font-weight: bold;">
              ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง
            </div>
            <div>
    <!-- วันที่และเวลา -->
<div style="display: flex; flex-direction: column; align-items: flex-start;">
  <span style="display: flex; gap: 19px;"> <!-- gap = ระยะห่างระหว่างคำกับเลข -->
    <span><b>วันที่มารับของ</b></span>
    <span>
      {{ booking && booking.receive_date
        ? new Date(booking.receive_date).toLocaleDateString('th-TH')
        : "" }}
    </span>
  </span>
  <span style="display: flex; gap: 6px;">
    <span><b>เวลาที่มารับของ</b></span>
    <span>
      {{ booking && booking.receive_time ? booking.receive_time : "" }} น.
    </span>
  </span>
</div>



            </div>
          </div>
        </div>

        <!-- =================== ข้อมูลผู้ขอ/รายละเอียด =================== -->
        <div class="form-row" style="padding-top: 30px; flex-direction: column; align-items: flex-start;">
         <span style="margin-bottom: 0;">
  <b>วันที่ </b> {{ todayThai }}
</span>

          <span style="font-weight: bold; margin-top: 8px;">
            สำหรับผู้ขอใช้บริการ
          </span>
        </div>

        <!-- ========== ข้าพเจ้า ... รหัสนักศึกษา ... หน่วยงาน ========== -->
        <div class="form-row mt-30"
          style="text-indent: 80px; text-align: left; line-height: 2.0;">
         ข้าพเจ้า {{ booking && booking.username_form || "-" }}
{{ idLabel }} {{ booking && booking.id_form || "-" }}
{{ booking && booking.agency || "-" }}

          โทร {{ booking && booking.number || "-" }}
          มีความประสงค์ขอยืมอุปกรณ์ของศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง เพื่อใช้ในงาน {{ booking && booking.reason || "-" }}
          สถานที่ใช้งาน {{ booking && booking.location || "-" }}
          ระหว่างวันที่ {{ booking && booking.start_date ? (new Date(booking.start_date)).toLocaleDateString('th-TH') : "-" }}
          ถึงวันที่ {{ booking && booking.end_date ? (new Date(booking.end_date)).toLocaleDateString('th-TH') : "-" }}
        </div>

        <div class="form-row" style="padding-top: 10px; justify-content: flex-start !important;">
          <span>โดยมีรายการดังต่อไปนี้</span>
        </div>
<p style="margin: 16px 0;">
  <b>สถานที่รับอุปกรณ์:</b> สำนักงานอาคารกีฬาอเนกประสงค์ (ข้างสนามแบดมินตัน)
</p>

        <!-- ================= ตารางรายการอุปกรณ์ ================= -->
        <div class="form-row" style="padding-top: 0px;">
          <table class="equipment-table">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>รายการ</th>
                <th>จำนวน</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in equipmentList" :key="index">
                <td>{{ index + 1 }}</td>
                <td><span class="block-text">{{ item.name }}</span></td>
                <td><span class="block-text">{{ item.quantity }}</span></td>
                <td><span class="block-text">{{ item.remark }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

<!-- ========= ลายเซ็นผู้ยืม (แบบรูปที่ 2) ========= -->
<div class="sigX">
  <div class="sigX-row">
    <span class="sigX-left">ลงชื่อ</span>
    <span class="sigX-name">{{ booking && booking.username_form || "-" }}</span>
    <span class="sigX-right">ผู้ยืม</span>
  </div>
  <div class="sigX-date">{{ nowThai }}</div>
</div>

        <!-- ================= ส่วนลายเซ็น/ความเห็น ================= -->
        <div class="form-row" style="padding-top: 10px;">
          <table class="approval-table">
            <thead>
              <tr>
                <th style="width: 50%;">ผลการดำเนินการ/ผลการปฏิบัติงาน</th>
                <th style="width: 50%;">ผลการดำเนินการ/ผลการปฏิบัติงาน</th>
              </tr>
            </thead>
            <tbody>
            <tr>
              <!-- ซ้าย -->
              <td class="approval-cell">
                <div class="approval-content">
                  <div class="approval-lines">
                    ..........................................................................<br>
                    ..........................................................................<br>
                  </div>
                  <div class="approval-sign">
                    ลงชื่อ......................................................ผู้ส่งมอบ<br>
                    
                    .............../.............../...............
                  </div>
                </div>
              </td>

              <!-- ขวา -->
              <td class="approval-cell">
                <div class="approval-content">
                  <div class="approval-lines">
                    ..........................................................................<br>
                    ..........................................................................<br>
                  </div>
                  <div class="approval-sign">
                    ลงชื่อ........................................................ผู้รับคืน<br>
                    .............../.............../...............
                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          </table>
        </div>
        <div style="margin-top: 15px;"></div>
<p class="note-block"> <b> *หมายเหตุ หากอุปกรณ์เกิดการชำรุดหรือสูญหายในระหว่างที่ผู้ยืมเป็นผู้รับผิดชอบ ผู้ยืมจะต้องชดใช้ค่าเสียหายที่เกิดขึ้นทั้งหมด</b>
 
</p>
       
      </div>

      <!-- ไฟล์แนบ (ยังไม่อัปโหลด) -->
<div v-if="tempFiles.length > 0" class="form-row" style="flex-direction: column; align-items: flex-start; padding-top: 20px;">
  <span style="font-weight: bold; margin-bottom: 6px;">ไฟล์แนบ:</span>
  <ul style="list-style-type: disc; padding-left: 20px; margin: 0;">
    <li v-for="(f, idx) in tempFiles" :key="idx" style="margin-bottom: 4px;">
      <span style="font-weight: 500;">{{ f.name }}</span>
      <span style="font-size: 12px; color: #888; margin-left: 10px;">
        ({{ f.type || 'unknown' }}, {{ Math.ceil((f.size||0)/1024) }} KB)
      </span>
    </li>
  </ul>
</div>

      <div class="button-wrapper">
  <button id="btnBack" @click="handleBack" :disabled="isLoading">Back</button>

  <button
    id="btnNext"
    @click="handleNext"
    :disabled="isLoading"
    :aria-busy="isLoading ? 'true' : 'false'"
  >
    <span v-if="!isLoading">Next</span>
    <span v-else class="btn-spinner-wrap">
      <span class="btn-spinner" aria-hidden="true"></span>
      <span class="btn-text">กำลังบันทึก…</span>
    </span>
  </button>
</div>

<!-- Overlay กันกดซ้ำระหว่างบันทึก -->
<div v-if="isLoading" class="saving-overlay" role="alert" aria-live="polite">
  <div class="saving-card">
    <div class="saving-spinner"></div>
    <div class="saving-text">กำลังบันทึกข้อมูล โปรดรอสักครู่…</div>
  </div>
</div>

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
          <p>© 2025 Center for Information Technology Services, Mae Fah Luang University. All rights reserved.</p>
        </div>
      </footer>
  </div>
</div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import html2pdf from 'html2pdf.js'

const API_BASE = import.meta.env.VITE_API_BASE

const router = useRouter()
const booking = ref(null)
const equipmentList = ref([])
const uploadedFiles = ref([])
const attachedFiles = ref([])
const isLoading = ref(false)
const isSidebarClosed = ref(false)
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(1)
const products = ref([]) // จำนวนรายการในรถเข็น
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const tempFiles = ref([])

// ✅ roles สำหรับ flow ยืมอุปกรณ์ (admin อนุมัติ / staff ส่งมอบ)
const EQUIP_APPROVAL_ROLES = ref([])

const idLabel = ref('รหัส') // ค่า default

onMounted(() => {
  const email =
    (booking.value?.email || localStorage.getItem('email') || '').toLowerCase()

  if (email.endsWith('@lamduan.mfu.ac.th')) {
    idLabel.value = 'รหัสนักศึกษา'
  } else if (email.endsWith('@mfu.ac.th')) {
    idLabel.value = 'รหัสพนักงาน'
  } else {
    idLabel.value = 'รหัส' // fallback กรณีไม่ตรงเงื่อนไข
  }
})

/** ✅ สร้างค่าเริ่มต้นของ step ให้ครบทุก role */
const buildInitialEquipmentStep = () =>
  (EQUIP_APPROVAL_ROLES.value || []).map(r => ({ role: r, approve: null }))

const stepRoutes = ['/form_equipment', '/form_equipment3', '/form_equipment4']

async function loadEquipRoles() {
  try {
    const res = await axios.get(`${API_BASE}/api/settings/approval_roles`)
    EQUIP_APPROVAL_ROLES.value = res.data.value?.equipment || []
  } catch {
    EQUIP_APPROVAL_ROLES.value = ['admin', 'staff'] // fallback
  }
}

function canStepTo(idx) {
  return idx <= currentStep.value
}
function goStep(idx) {
  if (!canStepTo(idx) || idx === currentStep.value) return
  if (idx === 0) {
    router.push({ path: stepRoutes[0], query: { restore: 'true' } })
  } else {
    router.push(stepRoutes[idx])
  }
}

/* >>> ใช้วันที่วันนี้ (ไทย) สำหรับลายเซ็นผู้ยืม */
const todayThai = ref(new Date().toLocaleDateString('th-TH'))

const lastSeenTimestamp = ref(parseInt(localStorage.getItem('lastSeenTimestamp') || '0'))
let polling = null
/* >>> ไทม์แสตมป์ (วัน/เดือน/ปี เวลา) ภาษาไทย สำหรับลายเซ็น */
const nowThai = ref(formatThaiTimestamp(new Date()))

function formatThaiTimestamp(d) {
  const date = d.toLocaleDateString('th-TH')
  const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time} น.`
}

/* อัปเดตทุกนาที เผื่อผู้ใช้เปิดหน้านานๆ */
let nowTicker = null
onMounted(() => {
  nowTicker = setInterval(() => {
    nowThai.value = formatThaiTimestamp(new Date())
  }, 60 * 1000)
})
onBeforeUnmount(() => {
  if (nowTicker) clearInterval(nowTicker)
})

function pruneOldNotifications() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

function loadTempFilesFromPage1() {
  const equipFiles = Array.isArray(window._equipTempFiles) ? window._equipTempFiles : []
  const fieldFiles = Array.isArray(window._fieldTempFiles) ? window._fieldTempFiles : []
  tempFiles.value = [...equipFiles, ...fieldFiles]
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}

const PDF_FILENAME = 'แบบฟอร์มการยืมอุปกรณ์-วัสดุ-ครุภัณฑ์.pdf'


async function uploadPdfBlob(pdfBlob) {
  const fd = new FormData()
  fd.append('file', pdfBlob, 'equipment-booking.pdf')
  const up = await axios.post(`${API_BASE}/api/upload`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
  return up.data?.fileUrl
}

function exportToPDF() {
  smartPageBreak();
  const element = document.getElementById('pdf-section');
  element.classList.add('pdf-export-font-size'); // <<< เพิ่มคลาสลดฟอนต์
 const opt = {
  margin: [0.5, 0.5, 0.5, 0.5],
  filename: PDF_FILENAME,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
  pagebreak: { mode: ['css', 'legacy'] }
};
  html2pdf()
    .from(element)
    .set(opt)
    .save()
    .then(() => {
      element.classList.remove('pdf-export-font-size'); // <<< ถอดคลาส
    })
    .catch(() => {
      element.classList.remove('pdf-export-font-size');
    });
}
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result.split(',')[1]) // base64 (ตัด header)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadTempFiles() {
  const results = []
  for (const f of (tempFiles.value || [])) {
    const fd = new FormData()
    fd.append('file', f, f.name)
    const res = await axios.post(`${API_BASE}/api/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })
    results.push({
      fileId: null,
      fileName: f.name,
      mimeType: f.type || '',
      fileUrl: res.data.fileUrl
    })
  }
  return results
}

// รับ element id, return Blob ของไฟล์ pdf
function htmlToPdfBlob(elementId) {
  smartPageBreak();
  return new Promise((resolve, reject) => {
    const element = document.getElementById(elementId)
    const opt = {
  margin: [0.5, 0.5, 0.5, 0.5],
  filename: PDF_FILENAME,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
  pagebreak: { mode: ['css', 'legacy'] }
}

   html2pdf()
      .from(element)
      .set(opt)
      .outputPdf('blob')
      .then(blob => {
        element.classList.remove('pdf-export-font-size');
        resolve(blob);
      })
      .catch(err => {
        element.classList.remove('pdf-export-font-size');
        reject(err);
      });
  });
}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1]) // เอาเฉพาะ base64
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function smartPageBreak() {
  // ปรับเป็นขนาด px ตาม jsPDF (1 in = 96 px), A4 สูง ~1122 px ที่ scale=1
  const PAGE_HEIGHT = 1122 * 0.95; // margin เผื่อขอบเล็กน้อย
  const pdfSection = document.getElementById('pdf-section');
  const approvalSection = pdfSection.querySelector('.approval-table').closest('.form-row');

  // เอาความสูงจนถึง approval-section
  const contentHeight = approvalSection.offsetTop;

  // ลบ page-break เดิม (ถ้ามี)
  const exist = pdfSection.querySelector('.page-break');
  if (exist) exist.remove();

  // ถ้าเนื้อหายาวเกิน 1 หน้า ให้แทรก div.page-break ก่อน approval-section
  if (contentHeight > PAGE_HEIGHT) {
    const pageBreak = document.createElement('div');
    pageBreak.className = 'page-break';
    approvalSection.parentNode.insertBefore(pageBreak, approvalSection);
  }
}

function closeNotifications() {
  showNotifications.value = false
}
async function fetchNotifications() {
  if (!userId) return
  try {
    pruneOldNotifications()

    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const targetStatuses = ['approved', 'disapproved', 'cancel', 'canceled', 'returned']

    const newNotis = (res.data || []).filter(item =>
      targetStatuses.includes((item.status || '').toLowerCase())
    )

    if (newNotis.length) {
      const mapped = newNotis.map(item => ({
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

      // รวม + ตัดซ้ำตาม id + เรียงเวลาใหม่สุดบน
      notifications.value = [...notifications.value, ...mapped]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp)

      pruneOldNotifications()
    }

    // นับเฉพาะที่ยังไม่ได้อ่าน (timestamp > lastSeenTimestamp)
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch {
    // เงียบไว้ ไม่ต้องรบกวนผู้ใช้
  }
}


onMounted(async () => {
  lastSeenTimestamp.value = parseInt(localStorage.getItem('lastSeenTimestamp') || '0')

  const formDataRaw = localStorage.getItem('equipmentFormData')
  let bookingId = null

  if (formDataRaw) {
    const parsed = JSON.parse(formDataRaw)
    booking.value = parsed.form

    // ✅ ดึงค่าที่ส่งมาจากหน้าแรก
    booking.value.username_form = parsed.form.username_form || ""
    booking.value.id_form       = parsed.form.id_form || ""
    booking.value.number        = parsed.form.number || parsed.form.tel || parsed.form.phone || "" // ✅ เพิ่มบรรทัดนี้

    bookingId = booking.value.booking_id || booking.value._id || booking.value.id
    if (!booking.value.booking_id && (booking.value._id || booking.value.id)) {
      booking.value.booking_id = booking.value._id || booking.value.id
    }

    if (booking.value.items && Array.isArray(booking.value.items)) {
      equipmentList.value = booking.value.items.map(item => ({
        name: item.item_name,
        quantity: item.amount,
        remark: item.remark || ''
      }))
    }
  }

  loadTempFilesFromPage1()

  const fileData = localStorage.getItem('equipment_upload_file')
  if (fileData) {
    try {
      uploadedFiles.value = JSON.parse(fileData)
    } catch {
      uploadedFiles.value = []
    }
  }

  if (bookingId) {
    try {
      const res = await axios.get(`${API_BASE}/api/booking_equipment/${bookingId}`)
      attachedFiles.value = res.data.attachedFiles || res.data.attachment || []

      if (res.data.items && Array.isArray(res.data.items)) {
        equipmentList.value = res.data.items.map(item => ({
          name: item.item_name,
          quantity: item.amount,
          remark: item.remark || ''
        }))
      }
    } catch {
      attachedFiles.value = []
    }

    fetchNotifications()
    polling = setInterval(fetchNotifications, 30000)
    await loadCart()
  }
})


onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
})


function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

async function loadCart() {
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch (err) {
    products.value = []
  }
}


function handleBack() {
  router.push('/form_equipment')
}



async function handleNext() {
   if (isLoading.value) return; 

  if (!booking.value || !Array.isArray(equipmentList.value) || equipmentList.value.length === 0) {
    alert('ไม่มีข้อมูลจะบันทึก');
    return;
  }

  const bookingIdFromServer =
    booking.value.booking_id || booking.value._id || booking.value.id || '';
  if (!bookingIdFromServer) {
    alert('ไม่พบ booking_id กรุณากรอกข้อมูลใหม่อีกครั้ง');
    return;
  }

  // helper: ล้าง role ให้เหลือเฉพาะที่รองรับและไม่ซ้ำ
  const cleanRoles = (arr) =>
    Array.from(new Set(
      (Array.isArray(arr) ? arr : [])
        .map(r => String(r || '').trim().toLowerCase())
        .filter(r => r === 'staff' || r === 'admin' || r === 'super')
    ));

  isLoading.value = true;
  try {
    // 1) ทำ PDF เป็น Blob
    const pdfBlob = await htmlToPdfBlob('pdf-section');

    // 2) อัปโหลด PDF → ได้ URL
    const pdfUrl = await uploadPdfBlob(pdfBlob);

    // 3) อัปโหลดไฟล์แนบชั่วคราว (ถ้ามี)
    const uploaded = await uploadTempFiles(); // ควรคืน [{fileUrl,fileId,fileName,mimeType}, ...]

    // 4) โหลด roles สำหรับ "equipment" จาก settings แล้วแปลงเป็น step array
    let stepTemplate = [];
    try {
      const res = await axios.get(`${API_BASE}/api/settings/approval_roles`);
      const value = res?.data?.value || {}; // { field: [...], equipment: [...] }
      const roles = Array.isArray(value.equipment) ? value.equipment : [];
      stepTemplate = cleanRoles(roles).map(r => ({ role: r, approve: null }));
    } catch (e) {
      console.warn('โหลด approval_roles (equipment) ไม่สำเร็จ:', e);
      stepTemplate = []; // ถ้าโหลดไม่ได้ก็ปล่อยว่าง (ไปกำหนดต่อที่ backend ตามฟลว์)
    }

    // 5) บันทึกเข้า history (หนึ่งแถวต่อหนึ่งอุปกรณ์)
    for (const item of equipmentList.value) {
      await axios.post(`${API_BASE}/api/history`, {
        // ชนิด
        type: 'equipment',
        status: 'pending',

        // ระบุ booking/user
        booking_id: bookingIdFromServer,
        user_id: booking.value.user_id,

        // ข้อมูลฟอร์มผู้ขอ
        username_form: booking.value.username_form || '',
        id_form: (booking.value.id_form ?? '').toString().trim(),
        number: (booking.value.number ?? '').toString().trim(),

        // รายการอุปกรณ์
        name: item.name,
        quantity: item.quantity,

        // หน่วยงาน/สังกัด
        agency: booking.value.agency || booking.value.school_of || '',

        // ไฟล์แนบ
        attachment: uploaded.map(u => u.fileUrl || u.fileId).filter(Boolean),
        fileName: uploaded.map(u => u.fileName).filter(Boolean),
        fileType: uploaded.map(u => u.mimeType).filter(Boolean),

        // รายละเอียดช่วงเวลาการยืม
        reasons: booking.value.reason || '',
        since: booking.value.start_date || '',
        uptodate: booking.value.end_date || '',

        // วันเวลานัดรับอุปกรณ์
        receive_date: booking.value.receive_date || null,
        receive_time: booking.value.receive_time || '',

        // PDF ที่อัปโหลด
        bookingPdfUrl: pdfUrl,

        // ⬅️ สำคัญ: แนบ step ที่ได้จาก settings (equipment)
        step: stepTemplate,
      });
    }

    // 6) เคลียร์รถเข็น/ไฟล์ชั่วคราว แล้วไปหน้าสำเร็จ
    try {
      await axios.delete(`${API_BASE}/api/cart`, { data: { user_id: booking.value.user_id } });
    } catch (e) {
      console.warn('ล้างตะกร้าไม่สำเร็จ (ข้ามได้):', e?.message || e);
    }

    window._equipTempFiles = [];
    localStorage.removeItem('equipmentFormData');
    localStorage.setItem('equipment_booking_id', bookingIdFromServer);

    router.push('/form_equipment4');
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + (err?.response?.data?.message || err.message));
  } finally {
    isLoading.value = false;
  }
}


</script>
<style scoped>
.headStepper {
  position: sticky;
  top: 60px;
  z-index: 10;
  width: 90%;
  max-width: 900px;
  margin: 0 auto 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,.1);
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 20px 52px;
  border-radius: 20px;
}

.headStepper-spacer { display: none; }

.main { padding-top: var(--topbar-h); }

.step { display: flex; align-items: center; position: relative; }
.circle { width: 30px; height: 30px; border-radius: 50%; background-color: #ccc; z-index: 1; }
.circle.active { background-color: #ff4d4f; }
.circle.completed { background-color: #ff4d4f; opacity: 0.5; }

.line { height: 4px; width: 80px; background-color: #ccc; margin: 0 5px; z-index: 0; }
.line.filled { background-color: #ff4d4f; }

.form-container {
  background-color: white;
  margin: 30px auto;
  padding: 40px;
  width: 90%;
  max-width: 900px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.form-header { text-align: center; margin-bottom: 20px; }

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
.button-wrapper {
  display: flex;
  justify-content: space-between;
  margin: 20px auto 0 auto;
  width: 90%;
  max-width: 900px;
}
#btnBack {
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}
#btnBack:hover { background-color: #5a6268; }

.form-header-section {
  display: flex;
  justify-content: flex-end;
  gap: 40px;
  margin-top: 30px;
}
.left-form, .right-form { display: flex; flex-direction: column; gap: 10px; flex: 1; }

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.form-row-title { font-weight: bold; margin-bottom: 10px; }

.line-field,
.line-field.block-text,
.line-field.block-expanding,
.reason-underline {
  display: inline-block;
  border-bottom: 2px solid #334155;
  min-width: 140px;
  max-width: 100%;
  width: auto;
  padding: 10px 8px 3px 8px;
  margin-bottom: 6px;
  background: none;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  vertical-align: bottom;
  box-sizing: border-box;
}
.line-field.block-expanding { width: 100%; min-width: 160px; margin-bottom: 6px; }

.equipment-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  margin-bottom: 30px;
}
.equipment-table th,
.equipment-table td {
  border: 1px solid #000;
  padding: 8px;
  text-align: left;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 350px;
}
.equipment-table th { background-color: #f0f0f0; text-align: center; }
.equipment-table td:nth-child(1),
.equipment-table td:nth-child(3) { text-align: center; }

.approval-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-top: 24px;
}
.approval-table th,
.approval-table td {
  border: 1px solid #000;
  padding: 6px 6px;
  font-size: 14px;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
  overflow-wrap: break-word;
}
.approval-table th { background: #f7f7f7; font-weight: bold; text-align: center; }

.page-break { page-break-before: always; break-before: page; }
/* ให้ป้ายชื่อไปอยู่ใต้จุด (เหมือนหน้าแรก) */
.label{
  position: absolute;
  top: 45px;
  left: 15px;
  transform: translateX(-50%);
  font-size: 12px;
  white-space: nowrap;
  text-align: center;
}

/* วงกลมที่ผ่านแล้วให้เป็นสีเทา (ไม่แดงจาง) */
.circle.completed{
  background-color: #ccc;   /* เดิม #ff4d4f + opacity */
  opacity: 1;
}

/* เส้นที่ผ่านแล้วให้เป็นสีเทา (ไม่แดง) */
.line.filled{
  background-color: #ccc;   /* เดิม #ff4d4f */
}

/* เผื่อให้มีพื้นที่ใต้สเต็ปเปอร์สำหรับป้ายชื่อ */
.stepper{
  padding: 20px 20px 52px;  /* ถ้ายังไม่ได้ตั้งแบบนี้ ให้ใส่ค่า bottom 52px */
}

/* ===== Dropdown แจ้งเตือน ===== */
.notification-dropdown {
  position: absolute;
  right: 0;
  top: 38px;
  background: #fff;
  border-radius: 18px 0 18px 18px;
  box-shadow: 0 8px 24px 0 rgba(27, 50, 98, 0.14), 0 2px 4px 0 rgba(33, 125, 215, 0.06);
  min-width: 330px;
  max-width: 370px;
  max-height: 420px;
  overflow-y: auto;
  z-index: 1002;
  padding: 0;
  border: none;
  animation: fadeDown 0.22s;
}
@keyframes fadeDown { 0%{opacity:0;transform:translateY(-24px);} 100%{opacity:1;transform:translateY(0);} }
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
.notification-dropdown li:not(:last-child){ margin-bottom: .15em; }
.notification-dropdown li::before { content: "🔔"; font-size: 1.2em; margin-right: 7px; color: #1976d2; opacity: .80; }
.notification-dropdown li.no-noti { background: #f2f3f6; color: #a7aab7; justify-content: center; font-style: italic; }
.notification-dropdown::-webkit-scrollbar { width: 7px; }
.notification-dropdown::-webkit-scrollbar-thumb { background: #e1e7f5; border-radius: 10px; }
.notification-dropdown::-webkit-scrollbar-track { background: transparent; }
.notification-item.approved { background: linear-gradient(90deg, #e9fbe7 85%, #cbffdb 100%); border-left: 4px solid #38b000; color: #228c22; }
.notification-item.disapproved { background: linear-gradient(90deg, #ffeaea 85%, #ffd6d6 100%); border-left: 4px solid #ff6060; color: #b91423; }
.notification-item.canceled, .notification-item.cancel { background: linear-gradient(90deg, #f9d7d7 80%, #e26a6a 100%); border-left: 4px solid #bb2124; color: #91061a; }
.notification-item.returned { background: linear-gradient(90deg, #e0f0ff 85%, #b6e0ff 100%); border-left: 4px solid #1976d2; color: #1976d2; }
.notification-item { transition: background .3s, border-color .3s, color .3s; }
.notification-backdrop { position: fixed; inset: 0; background: transparent; z-index: 1001; }

.badge { background-color: red; color: white; border-radius: 50%; padding: 2px 6px; font-size: .75rem; vertical-align: top; margin-left: 4px; }

@media (max-width: 540px) {
  .scroll-x-container { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100vw; padding: 0; }
  .form-container { min-width: 900px; width: 900px; max-width: 900px; padding: 16px 24px !important; border-radius: 10px !important; box-sizing: border-box; }
  .form-row { width: 100% !important; min-width: 0 !important; box-sizing: border-box !important; }
  .custom-input, .custom-textarea, input[type="text"], input[type="date"], input[type="time"], select, textarea {
    width: 100% !important; min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; overflow-x: auto;
  }
  .equipment-table, .approval-table { min-width: 600px; }
}
/* ให้ตำแหน่ง label อยู่กึ่งกลางจุด */
.label{
  position: absolute;
  top: 45px;
  left: calc(30px / 2);
  transform: translateX(-50%);
  font-size: 12px;
  white-space: nowrap;
  text-align: center;
}

/* สีจุด/เส้นเหมือน form_field3 */
.circle { width: 30px; height: 30px; border-radius: 50%; background: #ccc; transition: background .3s; cursor: pointer; }
.circle.active { background: #ff4d4f; }
.circle.completed { background: #ff4d4f; opacity: .5; }

.line { width: 80px; height: 4px; background: #ccc; margin: 0 5px; transition: background .3s; }
.line.filled { background: #ff4d4f; }

/* เผื่อพื้นที่ใต้ stepper สำหรับ label */
.stepper{ padding: 20px 20px 52px; border-radius: 20px; }

/* กันคอนเทนต์โดนบาร์บน */
.main{ padding-top: calc(var(--topbar-h)); }

/* ลบเส้นใต้เฉพาะในโซนฟอร์ม */
.form-container .line-field,
.form-container .reason-underline { border-bottom: none !important; background: none !important; padding-bottom: 0 !important; }

/* จัดแถวข้อมูลผู้ใช้ */
.form-row-align { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.align-field {
  min-width: 120px; max-width: 220px; display: inline-block; vertical-align: middle; margin-right: 18px;
  border-bottom: none !important; background: none !important; padding-bottom: 0 !important; font-weight: 500;
}
.form-row-align > span:not(.align-field) { min-width: 80px; text-align: right; font-weight: 400; }
@media (max-width: 540px) {
  .form-row-align { flex-direction: column; align-items: flex-start; gap: 0; }
  .align-field { margin-right: 0; min-width: 120px; max-width: 100%; }
}

.form-user-row { margin-left: 30px !important; padding-left: 0 !important; gap: 10px; margin-top: 4px; margin-bottom: 8px; font-size: 16px; line-height: 1.35; }
.form-row, .form-row-align { margin-bottom: 6px !important; line-height: 1.5; }

.user-info-row {
  margin-top: 24px; margin-bottom: 8px; font-size: 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; line-height: 1.4;
}
.user-info-row > span { margin-right: 8px; }
.user-info-row > span[style*="font-weight: bold"] { font-size: 18px; margin-right: 20px; }

/* หมายเหตุ */
.note-block { display: block; margin: 6px 0 0 0; font-size: 12.5px; font-style: italic; text-align: left; width: 100%; color: #000; }

/* กรอบความเห็น (บีบระยะ) */
.approval-table td { padding: 6px 6px 8px 6px !important; }
.approval-cell { padding: 0 !important; vertical-align: top !important; }
.approval-content { min-height: unset !important; padding: 8px 8px 2px 8px !important; gap: 4px !important; justify-content: flex-start !important; display:flex; flex-direction:column; align-items:center; text-align:center; }
.approval-lines { line-height: 1.5 !important; margin-bottom: 2px !important; }
.approval-sign { line-height: 1.25 !important; margin-top: 3px !important; margin-bottom: 0 !important; }
.approval-content > *:last-child { margin-bottom: 0 !important; }

:root { --topbar-h: 64px; --subbar-h: 0px; --gap: 12px; }

@media (max-width: 540px){ .sigX{ max-width:520px; } }

/* PDF ONLY – ลดขนาดตัวอักษรเวลา export */
.pdf-export-font-size { font-size: 16px !important; }
.pdf-export-font-size h1,
.pdf-export-font-size h2,
.pdf-export-font-size h3,
.pdf-export-font-size .form-row-title,
.pdf-export-font-size .form-header h3 { font-size: 18px !important; font-weight: bold; }

.pdf-export-header { font-size: 18px !important; font-weight: bold; }

/* ช่องไฟตารางให้กระชับขึ้นเล็กน้อย */
.equipment-table { margin-top: 6px !important; margin-bottom: 10px !important; }

/* ปุ่ม: disabled ตอนโหลด */
#btnNext[disabled],
#btnBack[disabled]{
  opacity: .7;
  cursor: not-allowed;
}

/* ปุ่ม Next – ขณะโหลดแสดงสปินเนอร์เล็ก */
.btn-spinner-wrap{
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-spinner{
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.6);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.btn-text{ display: inline-block; }

/* Overlay กันกดซ้ำทั้งหน้า (เฉพาะหน้านี้ เพราะ style เป็น scoped) */
.saving-overlay{
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,.5);
  backdrop-filter: blur(1px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.saving-card{
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(0,0,0,.12);
  padding: 22px 26px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #eef1f6;
}
.saving-spinner{
  width: 22px; height: 22px;
  border: 3px solid #1976d2;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
.saving-text{
  font-weight: 600;
  color: #1e2c48;
}

/* reuse */
@keyframes spin{
  to{ transform: rotate(360deg); }
}

</style>
<style>
/* ฟอนต์ TH Sarabun New */
@font-face{
  font-family: 'THSarabunNew';
  src: url('/fonts/THSarabunNew.woff2') format('woff2'),
       url('/fonts/THSarabunNew.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face{
  font-family: 'THSarabunNew';
  src: url('/fonts/THSarabunNew-Bold.woff2') format('woff2'),
       url('/fonts/THSarabunNew-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* ใช้ฟอนต์ในเอกสาร PDF */
#pdf-section, #pdf-section *{
  font-family: 'THSarabunNew', 'Sarabun', Tahoma, sans-serif !important;
}
#pdf-section h1,
#pdf-section h2,
#pdf-section h3,
#pdf-section b,
#pdf-section th,
#pdf-section .form-row-title,
#pdf-section .form-header h3{
  font-weight: 700;
}

/* ===== ลายเซ็นแบบอยู่ขวา + วันที่กึ่งกลางชื่อ ===== */
/* ===== ลายเซ็น: เว้นนิดเดียวทั้งสองข้าง + วันที่อยู่ใต้ชื่อ ===== */
#pdf-section .sigX{
  /* ใช้ grid 3 คอลัมน์: ลงชื่อ | ชื่อ | ผู้ยืม */
  display: grid;
  grid-template-columns: auto auto auto;
  column-gap: 12px;                /* ← ระยะห่าง “ลงชื่อ–ชื่อ–ผู้ยืม” (ปรับได้) */
  justify-content: end;            /* ทั้งบรรทัดชิดขวา */
  align-items: baseline;
  width: 100%;
  max-width: 700px;
  margin: 12px 0 0 auto;           /* ชิดขวา */
  padding-bottom: 6px;             /* เผื่อที่เล็กน้อย */
}

/* ทำให้ .sigX-row กระจายเป็น 3 ช่อง (ไม่ต้องมี wrapper เพิ่ม) */
#pdf-section .sigX-row{ display: contents; }

#pdf-section .sigX-left{  grid-column: 1; white-space: nowrap; }
#pdf-section .sigX-name{  grid-column: 2; white-space: nowrap; }
#pdf-section .sigX-right{ grid-column: 3; white-space: nowrap; }

/* วันที่ให้อยู่คอลัมน์กลาง และกึ่งกลางพอดีใต้ชื่อ */
#pdf-section .sigX-date{
  grid-column: 2;
  justify-self: center;            /* กลางคอลัมน์ชื่อ */
  margin-top: 6px;                 /* เว้นลงมาหน่อย */
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;

  /* กันค่า absolute ที่เคยตั้งไว้ก่อนหน้า */
  position: static !important;
  left: auto !important;
  right: auto !important;
  top: auto !important;
  transform: none !important;
}


@import '../css/style.css';
</style>
