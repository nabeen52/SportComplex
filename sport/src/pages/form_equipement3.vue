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
      <!-- Stepper -->
      <div class="headStepper">
        <div class="stepper">
          <div v-for="(step, index) in steps" :key="index" class="step">
            <div class="circle"
              :class="{ active: index === currentStep, completed: index < currentStep }"
              @click="tryGoStep(index)"
              :style="{ cursor: canGoToStep(index) ? 'pointer' : 'not-allowed', opacity: canGoToStep(index) ? 1 : 0.5 }">
            </div>
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
          <h3>แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h3>
          <p>โทร 053-917-8201 E-mail Sport-complex@mfu.ac.th</p>
        </div>

      <!-- กลุ่มขวา: วันที่มารับของ ชิดขวา, เวลาที่มารับของอยู่บรรทัดล่าง -->
<div class="form-header-section">
  <div class="right-form" style="align-items: flex-end; text-align: right;">
    <div class="form-row-title" style="font-size: 18px; font-weight: bold;">
      ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง
    </div>
    <div>
      
      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 2px;">
        <span>วันที่มารับของ</span>
        <span>{{ booking?.receive_date ? new Date(booking.receive_date).toLocaleDateString('th-TH') : "" }}</span>
      </div>
      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 2px; margin-top:2px;">
        <span>เวลาที่มารับของ</span>
        <span>{{ booking?.receive_time || "" }}</span>
      </div>
    </div>
  </div>
</div>

        <!-- =================== ข้อมูลผู้ขอ/รายละเอียด =================== -->
        <div class="form-row" style="padding-top: 30px; flex-direction: column; align-items: flex-start;">
          <span style="margin-bottom: 0;">
            วันที่ {{ booking?.start_date ? (new Date(booking.start_date)).toLocaleDateString('th-TH') : (new Date()).toLocaleDateString('th-TH') }}
          </span>
          <span style="font-weight: bold; margin-top: 8px;">
            ส่วนที่1 สำหรับผู้ใช้
          </span>
        </div>

        <!-- ========== ข้าพเจ้า ... รหัสนักศึกษา ... หน่วยงาน ========== -->
      <!-- จุดนี้คือส่วนที่ต้องการจัดให้อยู่ "แนวเดียวกับคำว่าสำหรับผู้ใช้" -->
<!-- อยู่ใน <div class="form-container"> ... -->

<!-- ย่อหน้าเดียวกันทั้งหมด -->
<div class="form-row mt-30"
     style="text-indent: 80px; text-align: left; line-height: 2.0;">
  ข้าพเจ้า {{ booking?.name || "-" }}
  รหัสนักศึกษา {{ booking?.user_id || "-" }}
  หน่วยงาน {{ booking?.agency || "-" }}
  เหตุผลในการขอใช้เพื่อ {{ booking?.reason || "-" }}
  สถานที่ใช้งาน {{ booking?.location || "-" }}
  ในวันที่ {{ booking?.start_date ? (new Date(booking.start_date)).toLocaleDateString('th-TH') : "-" }}
  ถึงวันที่ {{ booking?.end_date ? (new Date(booking.end_date)).toLocaleDateString('th-TH') : "-" }}
</div>

<div class="form-row" style="padding-top: 5px; justify-content: flex-start !important;">
  <span>โดยมีรายการดังต่อไปนี้</span>
</div>


        <!-- ================= ตารางรายการอุปกรณ์ ================= -->
        <div class="form-row" style="padding-top: 10px;">
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

       
        <!-- ================= ส่วนลายเซ็น/ความเห็น ================= -->
        <div class="form-row" style="padding-top: 10px;">
          <table class="approval-table">
            <thead>
              <tr>
                <th style="width: 50%;">ความคิดเห็น/คำสั่ง/ผลการพิจารณา</th>
                <th style="width: 50%;">ผลการดำเนินการ/ผลการปฏิบัติงาน</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="vertical-align: top; ">
                  <div style="min-height:50px; margin-bottom: 10px;">
                    ............................................................................................<br>
                    ............................................................................................<br>
                  </div>
                  <div style="margin-top: 8px;">
                    ลงชื่อ.......................................................หัวหน้าส่วน<br>
                    วันที่.............../.............../...............
                  </div>
                </td>
                <td style="vertical-align: top;">
                  <div style="min-height:50px; margin-bottom: 10px;">
                    ............................................................................................<br>
                    ............................................................................................<br>
                  </div>
                  <div style="margin-top: 8px;">
                    ลงชื่อ...........................................ผู้ปฏิบัติงาน/ผู้รับผิดชอบ<br>
                    วันที่.............../.............../...............
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
        
        <!-- ===== แสดงไฟล์แนบ ===== -->
        <!-- ไฟล์แนบ -->
         <div class="form-row-sign" style="padding-top: 30px; display: flex; align-items: center; gap: 10px;">
  <span style="white-space: nowrap;">ลงชื่อ</span>
  <span class="line-field block-text" style="min-width:140px;">{{ booking?.name || "" }}</span>
</div>

<div v-if="uploadedFiles.length > 0" class="form-row" style="flex-direction: column; align-items: flex-start; padding-top: 20px;">
  <span style="font-weight: bold; margin-bottom: 6px;">ไฟล์แนบ:</span>
  <ul style="list-style-type: disc; padding-left: 20px; margin: 0;">
    <li v-for="(file, idx) in uploadedFiles" :key="file.fileName || idx" style="margin-bottom: 4px;">
      <span style="font-weight: 500;">{{ file.fileName }}</span>
      <span style="font-size: 12px; color: #888; margin-left: 10px;">
        ({{ file.mimeType }})
      </span>
      <span v-if="file.fileData" style="margin-left:10px;">
        <a :href="file.fileData" :download="file.fileName" target="_blank">ดูไฟล์</a>
      </span>
    </li>
  </ul>
</div>



        <div class="button-wrapper">
          <button id="btnBack" @click="handleBack">Back</button>
          <button id="btnNext" @click="handleNext" :disabled="isLoading">Next</button>
        </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) unreadCount.value = 0
}

function exportToPDF() {
  smartPageBreak(); // <<<< เพิ่มบรรทัดนี้
  const element = document.getElementById('pdf-section');
  // ตั้งค่ารูปแบบไฟล์ PDF
 const opt = {
  margin: 0.2,
  filename: 'booking-form.pdf',
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
  pagebreak: { mode: ['css', 'legacy'] }
};
html2pdf().from(element).set(opt).save();
}
// รับ element id, return Blob ของไฟล์ pdf
function htmlToPdfBlob(elementId) {
  smartPageBreak();
  return new Promise((resolve, reject) => {
    const element = document.getElementById(elementId)
    const opt = {
      margin:       0.2,
      filename:     `booking-form.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
       pagebreak: { mode: ['css', 'legacy'] } 
    }
    html2pdf()
      .from(element)
      .set(opt)
      .outputPdf('blob')
      .then(resolve)
      .catch(reject)
  })
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

onMounted(async () => {
  const formDataRaw = localStorage.getItem('equipmentFormData')
  let bookingId = null
  if (formDataRaw) {
    const parsed = JSON.parse(formDataRaw)
    booking.value = parsed.form
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
  const fileData = localStorage.getItem('equipment_upload_file')
  if (fileData) {
    try {
      uploadedFiles.value = JSON.parse(fileData)
    } catch { uploadedFiles.value = [] }
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
    setInterval(fetchNotifications, 30000)
    await loadCart()

  }
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

function canGoToStep(index) {
  return index <= currentStep.value
}
function tryGoStep(index) {
  if (canGoToStep(index)) {
    if (index === 0) router.push('/form_equipment')
    else if (index === 1) router.push('/form_equipment3')
    else if (index === 2) router.push('/form_equipment4')
  }
}
async function handleNext() {
  if (!booking.value || equipmentList.value.length === 0) {
    alert('ไม่มีข้อมูลจะบันทึก')
    return
  }
  const bookingIdFromServer = booking.value.booking_id || booking.value._id || booking.value.id || ''
  if (!bookingIdFromServer) {
    alert('ไม่พบ booking_id กรุณากรอกข้อมูลใหม่อีกครั้ง')
    return
  }
  isLoading.value = true
  try {
     // สร้าง PDF Blob จาก html
    const pdfBlob = await htmlToPdfBlob('pdf-section')
    // แปลง Blob เป็น base64 string
    const pdfBase64 = await blobToBase64(pdfBlob)
    
    // บันทึกข้อมูล history พร้อม PDF ลง DB
    // สมมติว่า API /api/history รองรับ field bookingPdf (base64)
    // และบันทึกข้อมูลแยกเป็น 1 record ต่อ 1 รายการ item
    for (const item of equipmentList.value) {
      await axios.post(`${API_BASE}/api/history`, {
        booking_id: bookingIdFromServer,
        user_id: booking.value.user_id,
        name: item.name,
        quantity: item.quantity,
        status: 'pending',
        agency: booking.value.agency || booking.value.school_of || '',
        attachment: uploadedFiles.value.map(f => f.fileData),
        fileName: uploadedFiles.value.map(f => f.fileName),
        fileType: uploadedFiles.value.map(f => f.mimeType),
        reason: booking.value.reason || '',
        since: booking.value.start_date || '',
        uptodate: booking.value.end_date || '',
        receive_date: booking.value.receive_date || '',
        receive_time: booking.value.receive_time || '',
        bookingPdf: pdfBase64 
      })
    }
     // ดาวน์โหลด PDF ให้ผู้ใช้ด้วย
    const link = document.createElement('a')
    link.href = URL.createObjectURL(pdfBlob)
    link.download = 'booking-form.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()

    await axios.delete(`${API_BASE}/api/cart`, {
      data: { user_id: booking.value.user_id }
    })
    localStorage.removeItem('equipment_upload_file')
    localStorage.removeItem('equipmentFormData')
    localStorage.setItem('equipment_booking_id', bookingIdFromServer)
    router.push('/form_equipment4')
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message))
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.headStepper {
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
}
.form-header {
  text-align: center;
  margin-bottom: 20px;
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
#btnBack:hover {
  background-color: #5a6268;
}
.form-header-section {
  display: flex;
  justify-content: flex-end;
  gap: 40px;
  margin-top: 30px;
}
.left-form,
.right-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 12px; /* ระยะห่าง */
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: flex-start; /* ทำให้ชิดซ้าย */
}

.form-row-title {
  font-weight: bold;
  margin-bottom: 10px;
}
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
.line-field.block-expanding {
  width: 100%;
  min-width: 160px;
  margin-bottom: 6px;
}
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
.equipment-table th {
  background-color: #f0f0f0;
}
.approval-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
}
.approval-table th,
.approval-table td {
  border: 1px solid #000;
  padding: 10px 12px;
  font-size: 15px;
  text-align: left;
  vertical-align: top;
}
.approval-table th {
  background: #f7f7f7;
  font-weight: bold;
  text-align: center;
}

.page-break {
  page-break-before: always;
  break-before: page;
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

.badge {
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  vertical-align: top;
  margin-left: 4px;
}

@media (max-width: 540px) {
  .scroll-x-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100vw;
    padding: 0;
  }
  .form-container {
    min-width: 900px;
    width: 900px;
    max-width: 900px;
    padding: 16px 24px !important;
    border-radius: 10px !important;
    box-sizing: border-box;
  }
  .form-row {
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }
  .custom-input,
  .custom-textarea,
  input[type="text"],
  input[type="date"],
  input[type="time"],
  select,
  textarea {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow-x: auto;
  }
  .equipment-table,
  .approval-table {
    min-width: 700px;
  }
}
/* ลบเส้นใต้เฉพาะในโซนฟอร์ม */
.form-container .line-field,
.form-container .reason-underline {
  border-bottom: none !important;
  background: none !important;
  padding-bottom: 0 !important;
}
.form-row-align {
  display: flex;
  align-items: center;
  gap: 8px; /* ระยะห่างแต่ละช่อง */
  flex-wrap: wrap;
}
.align-field {
  min-width: 120px;
  max-width: 220px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 18px;
  /* ไม่มีเส้นใต้ */
  border-bottom: none !important;
  background: none !important;
  padding-bottom: 0 !important;
  font-weight: 500;
}
.form-row-align > span:not(.align-field) {
  min-width: 80px;
  text-align: right;
  font-weight: 400;
}
@media (max-width: 540px) {
  .form-row-align {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }
  .align-field {
    margin-right: 0;
    min-width: 120px;
    max-width: 100%;
  }
}
.form-user-row {
  margin-left: 30px !important;      /* ให้ชิดซ้ายสุด */
  padding-left: 0px !important;
  gap: 10px;
  margin-top: 4px;                 /* ลดความห่าง */
  margin-bottom: 8px;              /* ลดความห่าง */
  font-size: 16px;                 /* ขนาดตัวอักษร */
  line-height: 1.35;               /* ความสูงแต่ละบรรทัด */
}
.form-row, .form-row-align {
  margin-bottom: 6px !important;   /* ลดความห่างระหว่างบรรทัด */
  line-height: 1.5;
}
.user-info-row {
  margin-top: 24px;
  margin-bottom: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  line-height: 1.4;
}
.user-info-row > span {
  /* เพิ่ม spacing เฉพาะตัวหัวข้อให้โดดเด่น */
  margin-right: 8px;
}
.user-info-row > span[style*="font-weight: bold"] {
  font-size: 18px;
  margin-right: 20px;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 12px; /* ระยะห่างระหว่าง "ลงชื่อ" กับชื่อ */
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: flex-end; /* ชิดขวา */
}
.form-row-sign {
  display: flex;
  align-items: center;
  gap: 10px;           /* ระยะห่างระหว่าง "ลงชื่อ" กับชื่อ */
  justify-content: flex-end; /* ชิดขวา */
}

.form-row-sign .label {
  white-space: nowrap; /* ป้องกันคำว่า "ลงชื่อ" หักบรรทัด */
}



</style>

<style>
@import '../css/style.css';
</style>