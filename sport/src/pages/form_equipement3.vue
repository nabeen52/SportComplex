<template>
  <div class="layout">
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
      <!-- header -->
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








      
      <div class="form-container">
        <h1 style="display: flex; justify-content: center;">ยืนยันข้อมูล</h1>
        <div class="form-header">
          <h3>แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h3>
          <p>โทร 053-917820-1 E-mail Sport-complex@mfu.ac.th</p>
        </div>
        <!-- ================= ข้อมูลวันที่/ส่วนหัว ================= -->
        <div class="form-header-section">
          <div class="center-form" style="padding-top: 50px;">
            <span>วันที่</span>
            <span class="line-field block-text" style="min-width: 130px;">
              {{ booking?.start_date ? (new Date(booking.start_date)).toLocaleDateString('th-TH') : (new Date()).toLocaleDateString('th-TH') }}
            </span>
          </div>
          <!-- ขวา: ศูนย์กีฬาและรายละเอียด -->
          <div class="right-form" style="align-items: flex-end;">
            <div class="form-row-title" style="font-size: 18px; font-weight: bold;">
              ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง
            </div>
            <div class="form-row">
              <span>วันที่มารับของ</span>
              <span class="line-field block-text" style="min-width: 110px;">
                {{ booking?.receive_date ? new Date(booking.receive_date).toLocaleDateString('th-TH') : "" }}
              </span>
            </div>
            <div class="form-row">
              <span>เวลาที่มารับของ</span>
              <span class="line-field block-text" style="min-width: 80px;">
                {{ booking?.receive_time || "" }}
              </span>
            </div>
            <div class="form-row">
              <span>หน่วยงาน</span>
              <span class="line-field block-text" style="min-width: 140px;">
                {{ booking?.agency || "" }}
              </span>
            </div>
          </div>
        </div>
        <!-- ================= ข้อมูลผู้ขอ/รายละเอียด ================= -->
        <div class="form-row" style="padding-top: 30px;">
          <span>ส่วนที่1 สำหรับผู้ใช้</span>
        </div>
        <div class="form-row" style="padding-top: 30px;">
          <span>ข้าพเจ้า</span>
          <span class="line-field block-text" style="min-width:160px;">{{ booking?.name || "" }}</span>
          <span>รหัสนักศึกษา</span>
          <span class="line-field block-text" style="min-width:120px;">{{ booking?.user_id || "" }}</span>
        </div>
        <!-- เหตุผล/สถานที่ ขยายเส้นอัตโนมัติ -->
        <div class="form-row" style="padding-top: 30px;">
  <span>เหตุผลในการขอใช้เพื่อ</span>
  <div class="reason-underline">{{ booking?.reason || "" }}</div>
</div>

        <div class="form-row" style="padding-top: 30px; flex-wrap: wrap;">
          <span>สถานที่ใช้งาน</span>
          <span class="line-field block-text" style="margin-bottom: 3px;">
            {{ booking?.location || "" }}
          </span>
          <br style="flex-basis: 100%; height: 0;" />
          <span>ในวันที่</span>
          <span class="line-field block-text" style="min-width: 100px;">
            {{ booking?.start_date ? (new Date(booking.start_date)).toLocaleDateString('th-TH') : "" }}
          </span>
          <span>ถึงวันที่</span>
          <span class="line-field block-text" style="min-width: 100px;">
            {{ booking?.end_date ? (new Date(booking.end_date)).toLocaleDateString('th-TH') : "" }}
          </span>
        </div>
        <div class="form-row" style="padding-top: 30px;">
          <span>โดยมีรายการดังต่อไปนี้</span>
        </div>
        <!-- ================= ตารางรายการอุปกรณ์ ================= -->
        <div class="form-row" style="padding-top: 30px;">
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
                <td style="vertical-align: top;">
                  <div style="min-height:50px; margin-bottom: 10px;">
                    .................................................................<br>
                    .................................................................<br>
                  </div>
                  <div style="margin-top: 8px;">
                    ลงชื่อ.......................................................หัวหน้าส่วน<br>
                    วันที่.............../.............../...............
                  </div>
                </td>
                <td style="vertical-align: top;">
                  <div style="min-height:50px; margin-bottom: 10px;">
                    .................................................................<br>
                    .................................................................<br>
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

        <!-- ===== แสดงไฟล์ที่ user เพิ่งอัป (localStorage/base64) ===== -->
        <div v-if="uploadedFiles.length > 0" class="form-row" style="padding-top: 20px;">
          <span>ไฟล์แนบ:</span>
          <ul>
            <li v-for="(file, idx) in uploadedFiles" :key="file.fileName || idx">
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

       

        <div class="form-row" style="padding-top: 30px; justify-self: end;">
          <span>ลงชื่อ</span>
          <span class="line-field block-text" style="min-width:140px;">{{ booking?.name || "" }}</span>
        </div>
        <div class="button-wrapper">
          <button id="btnBack" @click="handleBack">Back</button>
          <button id="btnNext" @click="handleNext" :disabled="isLoading">Next</button>
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

const API_BASE = import.meta.env.VITE_API_BASE



const router = useRouter()
const booking = ref(null)
const equipmentList = ref([])
const uploadedFiles = ref([])
const attachedFiles = ref([])
const isLoading = ref(false)
const isSidebarClosed = ref(false)
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(1) // ตอนนี้อยู่ step 2 (ยืนยันข้อมูล)

// ======================= Notification State ========================
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

onMounted(async () => {
  // โหลดข้อมูลฟอร์ม + รายการอุปกรณ์จาก localStorage
  const formDataRaw = localStorage.getItem('equipmentFormData')
  let bookingId = null

  if (formDataRaw) {
    const parsed = JSON.parse(formDataRaw)
    booking.value = parsed.form

    bookingId = booking.value.booking_id || booking.value._id || booking.value.id
    if (!booking.value.booking_id && (booking.value._id || booking.value.id)) {
      booking.value.booking_id = booking.value._id || booking.value.id
    }

    // map จาก items (ที่มี remark) แทน selectedQuantities
    if (booking.value.items && Array.isArray(booking.value.items)) {
      equipmentList.value = booking.value.items.map(item => ({
        name: item.item_name,
        quantity: item.amount,
        remark: item.remark || ''
      }))
    }
  }

  // โหลดไฟล์แนบ base64 ที่ user เพิ่งอัป
  const fileData = localStorage.getItem('equipment_upload_file')
  if (fileData) {
    try {
      uploadedFiles.value = JSON.parse(fileData)
    } catch { uploadedFiles.value = [] }
  }

  // โหลดไฟล์แนบจาก backend (ถ้ามี)
  if (bookingId) {
    try {
      const res = await axios.get(`${API_BASE}/api/booking_equipment/${bookingId}`)
      attachedFiles.value = res.data.attachedFiles || res.data.attachment || []

      // อัปเดต equipmentList จาก backend ด้วย remark (กรณี edit หรือ reload)
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
  }
})


function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

function handleBack() {
  // ข้อมูล (booking, uploadedFiles) จะค้างอยู่ใน localStorage
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

// ยืนยัน (ส่งข้อมูล)
// ปุ่ม Next: บันทึกประวัติทีละรายการ และไปหน้า 4
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
    // ส่งข้อมูลรายการอุปกรณ์ทีละชิ้น (เหมือนเดิม)
    for (const item of equipmentList.value) {
      await axios.post(`${API_BASE}/api/history`, {
        booking_id: bookingIdFromServer,
        user_id: booking.value.user_id,
        name: item.name,
        quantity: item.quantity,
        status: 'pending',
        agency: booking.value.agency || booking.value.school_of || '',
        // === แนบไฟล์ base64 ไปด้วย ===
        attachment: uploadedFiles.value.map(f => f.fileData),    // <-- base64 array
        fileName: uploadedFiles.value.map(f => f.fileName),
        fileType: uploadedFiles.value.map(f => f.mimeType),
        reason: booking.value.reason || '',
        since: booking.value.start_date || '',
        uptodate: booking.value.end_date || '',
        receive_date: booking.value.receive_date || '',
        receive_time: booking.value.receive_time || ''
      })
    }

    // ลบข้อมูลตะกร้า
    await axios.delete(`${API_BASE}/api/cart`, {
      data: { user_id: booking.value.user_id }
    })

    // ลบ localStorage ที่เกี่ยวข้อง
    localStorage.removeItem('equipment_upload_file')
    localStorage.removeItem('equipmentFormData')

    // เก็บ booking id สำหรับหน้า 4
    localStorage.setItem('equipment_booking_id', bookingIdFromServer)

    // ไปหน้า 4
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
  justify-content: space-between;
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
  align-items: flex-end;   /* ชิดล่างตรงเส้น */
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.form-row-title {
  font-weight: bold;
  margin-bottom: 10px;
}

/* --------- ปรับให้ทุก field ที่เป็นเส้นใต้เหมือนกัน ----------- */
.line-field,
.line-field.block-text,
.line-field.block-expanding,
.reason-underline {
  display: inline-block;
  border-bottom: 2px solid #334155;
  min-width: 140px;
  max-width: 100%;
  width: auto;
  padding: 10px 8px 3px 8px;  /* top right bottom left */
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
</style>

