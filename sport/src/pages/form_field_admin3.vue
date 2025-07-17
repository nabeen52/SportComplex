<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/dashboard" exact-active-class="active">
          <i class="pi pi-chart-pie"></i> Dashboard
        </router-link>
        <router-link to="/home_admin" exact-active-class="active">
          <i class="pi pi-megaphone"></i> Edit News
        </router-link>
        <router-link to="/edit_field" active-class="active">
          <i class="pi pi-map-marker"></i> Edit Field
        </router-link>
        <router-link to="/edit_equipment" active-class="active">
          <i class="pi pi-clipboard"></i> Edit Equipment
        </router-link>
        <router-link to="/booking_field_admin" active-class="active">
          <i class="pi pi-map-marker"></i> Book Field
        </router-link>
        <router-link to="/approve_field" active-class="active">
          <i class="pi pi-verified"></i> Approve
        </router-link>
        <router-link to="/return_admin" active-class="active">
            <i class="pi pi-box"></i> Return
          </router-link>
        <router-link to="/members" active-class="active">
          <i class="pi pi-user-edit"></i> Member
        </router-link>
        <router-link to="/history_admin" active-class="active">
          <i class="pi pi-history"></i> History System
        </router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
  <button class="menu-toggle" @click="toggleSidebar">☰</button>
  <div class="topbar-actions">
    <!-- กระดิ่งแจ้งเตือน -->
    <div style="position: relative; display: inline-block;">
      <button class="notification-btn" @click="toggleNotifications">
        <i class="pi pi-bell"></i>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </button>
      <div v-if="showNotifications" class="notification-dropdown">
        <ul>
          <li v-for="(noti, idx) in notifications" :key="idx">
            {{ noti.message }}
          </li>
          <li v-if="notifications.length === 0">ไม่มีแจ้งเตือน</li>
        </ul>
      </div>
    </div>
    <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
  </div>
</header>

      <!-- Stepper -->
      <div class="headStepper">
        <div class="stepper">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="step"
          >
            <div
              class="circle"
              :class="{ active: index === currentStep, completed: index < currentStep }"
              @click="goStep(index)"
              :style="{ cursor: canStepTo(index) ? 'pointer' : 'not-allowed', opacity: canStepTo(index) ? 1 : 0.5 }"
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

      <!-- Confirm Form -->
      <div class="form-container">
        <h1 class="title">ยืนยันข้อมูล</h1>
        <div class="form-header">
          <h3>แบบฟอร์มขออนุมัติใช้สถานที่ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h3>
          <p>โทร 053-917820-1 | E-mail: sport-complex@mfu.ac.th</p>
        </div>

        <!-- Header Info -->
        <div class="info-left">
          <span>ที่ อว.</span>
          <span class="line-field single-line">{{ info.aw }}</span>
          <span>วันที่</span>
          <span class="line-field single-line">{{ formatDateOnly(info.date) }}</span>
          <span>โทร</span>
          <span class="line-field single-line">{{ info.tel }}</span>
        </div>

        <!-- Detail Content -->
        <div class="form-row mt-30">
          <span>เรียน อธิการบดี</span>
        </div>
<div class="form-row mt-30 block-row">
  <span>ด้วย</span>
  <span class="line-field block-text nowrap" style="min-width:160px; margin-right:40px;">{{ info.agency }}</span>
  <span>จะดำเนินกิจกรรม / โครงการ</span>
  <span class="line-field block-text">{{ info.name_activity }}</span>
</div>

        <div class="form-row mt-30 block-row">
          <span>เหตุผลในการขอใช้เพื่อ</span>
          <span class="line-field block-text">{{ info.reasons }}</span>
          <span>ในวันที่</span>
          <span class="line-field single-line">{{ formatDateOnly(info.since) }}</span>
          <span>ถึงวันที่</span>
          <span class="line-field single-line">{{ formatDateOnly(info.uptodate) }}</span>
        </div>

        <div class="form-row mt-30 block-row">
          <span>ตั้งแต่เวลา</span>
          <span class="line-field single-line">{{ info.since_time || '-' }}</span>
          <span>ถึงเวลา</span>
          <span class="line-field single-line">{{ info.until_thetime || '-' }}</span>
          <span>จำนวนผู้เข้าร่วม</span>
          <span class="line-field single-line">{{ info.participants }}</span>
        </div>

        <div class="form-row mt-30">
          <span>และเพื่อให้การดำเนินงานเป็นไปด้วยความเรียบร้อย จึงเรียนมาเพื่อขออนุมัติ ดังนี้</span>
        </div>

        <div class="form-row mt-30 bold">
          <span>1. ขออนุมัติใช้สถานที่</span>
        </div>

      <div class="form-row mt-30 block-row">
  <span>อาคาร</span>
  <span class="line-field block-text">{{ info.building }}</span>
  <span>ระบุตำแหน่งพื้นที่/ห้องที่ต้องการใช้</span>
  <span class="line-field block-text">
    {{ info.zone && info.zone.trim() !== '' ? info.zone : '-' }}
  </span>
</div>


        <div class="form-row mt-30 bold">
          <span>2. ขออนุมัติใช้ระบบสาธารณูปโภค</span>
        </div>

        <div class="form-row mt-30 block-row">
          <span>เปิดเครื่องปรับอากาศตั้งแต่</span>
          <span class="line-field single-line">{{ info.turnon_air || '-' }}</span>
          <span>ถึง</span>
          <span class="line-field single-line">{{ info.turnoff_air || '-' }}</span>
          <span>( เฉพาะอาคารเฉลิมพระเกียรติฯ )</span>
        </div>

        <div class="form-row mt-15 block-row">
          <span>ไฟฟ้าส่องสว่างตั้งแต่</span>
          <span class="line-field single-line">{{ info.turnon_lights || '-' }}</span>
          <span>ถึง</span>
          <span class="line-field single-line">{{ info.turnoff_lights || '-' }}</span>
          <span>( เฉพาะอาคารเฉลิมพระเกียรติฯ )</span>
        </div>

        <div class="form-row mt-15 block-row">
          <span>อื่นๆ</span>
          <span class="line-field block-text">{{ info.other }}</span>
        </div>

        <div class="form-row mt-15 block-row">
          <span>ดึงอัฒจันทร์ภายในอาคารเฉลิมพระเกียรติฯ</span>
          <span class="line-field block-text">{{ info.amphitheater }}</span>
        </div>



        <!-- ตารางเซ็นชื่อ 3 ช่อง (ด้านบน) -->
<table class="sign-header-table">
  <tbody>
    <tr>
      <td>
        ลงชื่อ............................................<br><br>
        <span > ( {{ info.requester }} ) </span><br><br>
        นักศึกษา/ผู้รับผิดชอบ<br><br>
        วันที่............/............/............
      </td>
      <td>
        ลงชื่อ............................................<br><br>
        (.................................................)<br><br>
        อาจารย์/ที่ปรึกษาโครงการ<br><br>
        วันที่............/............/............
      </td>
      <td>
        ลงชื่อ............................................<br><br>
        (.................................................)<br><br>
        คณบดี/หัวหน้าหน่วยงาน<br><br>
        วันที่............/............/............
      </td>
    </tr>
  </tbody>
</table>

<div class="form-row" style="padding-top: 10px;">
          <!-- ตารางลายเซ็น 3 ช่อง -->
<table class="approval-sign-table">
  <thead>
    <tr>
      <th>1. เลขานุการศูนย์กีฬาฯ</th>
      <th>2. หัวหน้าศูนย์กีฬาฯ</th>
      <th>3. อธิการบดี</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <!-- ช่อง 1 -->
      <td>
        <div class="td-inner">
          <div class="checkbox-line">
            <input type="checkbox" id="chk1-1"><label for="chk1-1">เรียน หัวหน้าศูนย์กีฬาฯ</label>
          </div>
          <div class="checkbox-line">
            <input type="checkbox" id="chk1-2"><label for="chk1-2">เพื่อโปรดพิจารณา</label>
          </div>
          <div class="checkbox-line">
            <input type="checkbox" id="chk1-3"><label for="chk1-3">อื่นๆ</label><span class="dot-line mid"></span>
          </div>
          <div class="dot-line"></div>
          <div style="margin:12px 0 6px;">
            (<span class="dot-line short"></span>)
          </div>
          <div style="margin-bottom: 6px;">
            วันที่ <span class="dot-line date"></span>
          </div>
        </div>
      </td>
      <!-- ช่อง 2 -->
      <td>
        <div class="td-inner">
          <div class="checkbox-line">
            <input type="checkbox" id="chk2-1"><label for="chk2-1">เรียนท่านรองอธิการบดี</label>
          </div>
          <div class="checkbox-line">
            <input type="checkbox" id="chk2-2"><label for="chk2-2">เพื่อโปรดพิจารณา</label>
          </div>
          <div class="checkbox-line">
            <input type="checkbox" id="chk2-3"><label for="chk2-3">อื่นๆ</label><span class="dot-line mid"></span>
          </div>
          <div class="dot-line"></div>
          <div style="margin:12px 0 6px;">
            (<span class="dot-line short"></span>)
          </div>
          <div style="margin-bottom: 6px;">
            วันที่ <span class="dot-line date"></span>
          </div>
        </div>
      </td>
      
      
<!-- ช่อง 3 -->
<td>
  <div class="td-inner">
    <div class="checkbox-line">
      <input type="checkbox" id="chk3-1">
      <label for="chk3-1">อนุมัติข้อ</label>
    </div>
    <div class="checkbox-line">
      <input type="checkbox" id="chk3-2">
      <label for="chk3-2">อื่นๆ</label>
      <span class="dot-line mid"></span>
    </div>
    <!-- เพิ่มบรรทัดเปล่าไว้ตรงนี้ (จำนวน 1 บรรทัด) -->
    <div style="height:9.5px"></div> <!-- ปรับขนาดได้ตามต้องการ -->
    <div class="dot-line"></div>
    <div class="dot-line"></div>
    
    <div style="margin:12px 0 6px;">
      (<span class="dot-line short"></span>)
    </div>
    <div style="margin-bottom: 6px;">
      วันที่ <span class="dot-line date"></span>
    </div>
  </div>
</td>






    </tr>
  </tbody>
</table>


        </div>

<!-- โชว์ไฟล์แนบ -->
<!-- ...ไฟล์แนบปกติ-->
<div v-if="info.files && info.files.length > 0" class="form-row mt-30">
  <span>ไฟล์แนบ (ปกติ)</span>
  <div class="attached-files-list">
    <div 
      v-for="(file, idx) in info.files" 
      :key="idx"
      class="attached-file-item"
    >
      <a 
        :href="file.fileUrl || file.url" 
        target="_blank" 
        :download="file.originalName || file.fileName"
      >
        {{ file.originalName || file.fileName || 'ไฟล์แนบ' }}
      </a>
      <span v-if="file.size" style="color: #888; font-size:12px; margin-left:8px;">
        ({{ Math.round(file.size/1024) }} KB)
      </span>
    </div>
  </div>
</div>

<!-- ...ไฟล์แนบจาก uploadFiles (base64)-->
<div v-if="fileAttachments && fileAttachments.length > 0" class="form-row mt-30">
  <span>ไฟล์แนบ (UploadFile)</span>
  <div class="attached-files-list">
    <div 
      v-for="(file, idx) in fileAttachments" 
      :key="'upl-'+idx"
      class="attached-file-item"
    >
      <a 
        :href="file.url"
        target="_blank"
        :download="file.fileName"
      >
        {{ file.fileName || 'ไฟล์แนบ' }}
      </a>
      <span v-if="file.size" style="color: #888; font-size:12px; margin-left:8px;">
        ({{ file.size }} KB)
      </span>
    </div>
  </div>
</div>


        <div class="button-wrapper mt-30">
          <button id="btnBack" @click="goBack">Back</button>
          <button id="btnNext" @click="handleNext">Next</button>
        </div>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'

const API_BASE = import.meta.env.VITE_API_BASE

const info = ref({})
const fileAttachments = ref([])
const isSidebarClosed = ref(false)
const router = useRouter()

const steps = ['กรอกข้อมูล','ยืนยันข้อมูล','สำเร็จ']
const currentStep = ref(1)
const stepRoutes = ['/form_field_admin', '/form_field_admin3', '/form_field_admin4']

// ---------- กระดิ่งแจ้งเตือน ----------
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
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
function goBack() {
  router.push({ path: '/form_field_admin', query: { restore: 'true' } })
}
function formatDateOnly(dateTime) {
  if (!dateTime) return '-'
  if (typeof dateTime === 'string' && dateTime.includes('T')) {
    return dateTime.split('T')[0]
  }
  return dateTime
}

// ===== Notification (close on outside click) =====
function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) unreadCount.value = 0
}
function closeNotifications() {
  showNotifications.value = false
}
function handleClickOutside(event) {
  const notifDropdown = document.querySelector('.notification-dropdown')
  const notifBtn = document.querySelector('.notification-btn')
  if (
    notifDropdown &&
    !notifDropdown.contains(event.target) &&
    notifBtn &&
    !notifBtn.contains(event.target)
  ) {
    closeNotifications()
  }
}
async function fetchNotifications() {
  try {
    const res = await axios.get(`${API_BASE}/api/history/approve_field`)
    const data = Array.isArray(res.data) ? res.data : []

    const pendings = data.filter(item =>
      item.status === 'pending' &&
      (item.type === 'field' || item.type === 'equipment') &&
      !lastCheckedIds.value.has(item._id?.$oid || item._id)
    )
    if (pendings.length) {
      const newMessages = pendings.map(item => {
        if (item.type === 'field') {
          return {
            id: item._id?.$oid || item._id,
            message: `สนาม '${item.name}' กำลังรอการอนุมัติ`
          }
        } else if (item.type === 'equipment') {
          return {
            id: item._id?.$oid || item._id,
            message: `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
          }
        }
      })
      notifications.value = [...notifications.value, ...newMessages]
      pendings.forEach(item => lastCheckedIds.value.add(item._id?.$oid || item._id))
      unreadCount.value = notifications.value.length
    }
  } catch (err) { /* ไม่แจ้งเตือน error */ }
}

onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)

  const bookingId = localStorage.getItem('bookingId')
  if (!bookingId) {
    Swal.fire('ไม่พบ bookingId')
    return
  }
  try {
    const res = await axios.get(`${API_BASE}/api/booking_field/${bookingId}`)
    info.value = res.data

    if (info.value.user_id) {
      try {
        const userRes = await axios.get(`${API_BASE}/api/user/${info.value.user_id}`)
        info.value.requester = userRes.data.name || '-'
      } catch {
        info.value.requester = '-'
      }
    }

    // ==== ดึงไฟล์แนบจริง ====
    fileAttachments.value = []
    if (info.value.uploadFiles && info.value.uploadFiles.length > 0) {
      let fileListRes
      try {
        fileListRes = await axios.get(`${API_BASE}/api/upload_file`)
      } catch (e) {
        fileListRes = { data: [] }
      }
      for (const fid of info.value.uploadFiles) {
        const found = Array.isArray(fileListRes.data) ? fileListRes.data.find(f => f._id === fid) : null
        if (found) {
          fileAttachments.value.push({
            fileName: found.fileName,
            url: `${API_BASE}/api/uploadfile/${found._id}`,
            size: found.fileData ? Math.round((found.fileData.length * 3 / 4) / 1024) : null
          })
        }
      }
    }
  } catch (err) {
    Swal.fire('ดึงข้อมูลไม่สำเร็จ')
    console.error(err)
  }

  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
  document.removeEventListener('mousedown', handleClickOutside)
})

async function handleNext() {
  try {
    const bookingId = localStorage.getItem('bookingId')
    if (!bookingId) {
      Swal.fire('ไม่พบ bookingId')
      return
    }
    const bookingData = { ...info.value }

    const attachments = (bookingData.files || []).map(f => f.fileUrl || f.url || null)
    const fileNames   = (bookingData.files || []).map(f => f.originalName || f.fileName || null)
    const fileTypes   = (bookingData.files || []).map(f => f.mimetype || null)
    const uploadFiles = Array.isArray(bookingData.uploadFiles) ? bookingData.uploadFiles : []

    const allFileNames = [
      ...fileNames,
      ...fileAttachments.value.map(f => f.fileName)
    ]
    const allAttachments = [
      ...attachments,
      ...fileAttachments.value.map(f => f.url)
    ]

    const payload = {
      user_id: bookingData.user_id,
      name: bookingData.building,
      name_active: bookingData.name_activity,
      zone: bookingData.zone,
      since: bookingData.since,
      uptodate: bookingData.uptodate,
      startTime: bookingData.since_time,
      endTime: bookingData.until_thetime,
      status: 'pending',
      type: 'field',
      agency: bookingData.agency,
      booking_id: bookingId,
      attachment: allAttachments,
      fileName: allFileNames,
      fileType: fileTypes,
      uploadFiles: uploadFiles,
      date: new Date(),
    }

    await axios.post(`${API_BASE}/api/history`, payload)

    sessionStorage.removeItem('form_field_save')
    window._tempSelectedFiles = []

    router.push('/form_field_admin4')
  } catch (err) {
    Swal.fire('เกิดข้อผิดพลาดในการบันทึกข้อมูล', err?.response?.data?.message || err.message, 'error')
    console.error(err)
  }
}
</script>







<style scoped>
.headStepper {
  background: #fff;
  margin: 15px auto;
  width: 90%; max-width: 900px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.step {
  display: flex;
  align-items: center;
  position: relative;
}
.circle {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: #ccc;
  transition: background .3s;
  cursor: pointer;
}
.circle.active { background: #ff4d4f; }
.circle.completed { background: #ff4d4f; opacity: .5; }
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
  width: 80px; height: 4px;
  background: #ccc; margin: 0 5px;
  transition: background .3s;
}
.line.filled { background: #ff4d4f; }

.title { text-align: center; margin-bottom: 20px; }
.form-container {
  background: #fff;
  margin: 30px auto;
  padding: 40px;
  width: 90%; max-width: 900px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.form-header { text-align: center; margin-bottom: 20px; }
.info-left {
  display: flex; align-items: center; gap: 12px;
  margin: 8px 0 20px;
  flex-wrap: wrap;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-row-title {
  font-weight: bold;
  margin-bottom: 10px;
}
.mt-30 { margin-top: 30px; }
.mt-15 { margin-top: 15px; }
.bold { font-weight: bold; }
.line-field {
  border-bottom: 2px solid #334155;
  padding: 0 6px;
  min-width: 100px;
  height: auto;
  min-height: 20px;
  max-width: 2000px;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: block;
  line-height: 1.5em;
}
.attached-files-list {
  margin-top: 8px;
  max-height: 140px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f9fafb;
  padding: 6px 16px;
}
.attached-file-item {
  font-size: 14px;
  color: #26577C;
  padding: 3px 0;
  border-bottom: 1px solid #eee;
  white-space: normal;
  word-break: break-all;
}
.attached-file-item:last-child {
  border-bottom: none;
}
.attached-file-item a {
  color: #048ace;
  text-decoration: underline;
  word-break: break-all;
}

/* --- Signature Section --- */
.signatures-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin: 38px 0 12px 0;
}

.signature-box {
  flex: 1 1 0;
  padding: 0px;
  margin: 0 2px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: none;
  box-shadow: none;
}
.sign-label {
  font-size: 14px;
  margin-bottom: 1px;
  margin-top: 0;
}
.sign-role {
  font-size: 13px;
  margin-bottom: 2px;
  margin-top: 2px;
}
.sign-date {
  font-size: 13px;
  margin-bottom: 4px;
  margin-top: 0;
}
.sign-inner-box {
  width: 100%;
  border: 1px solid #222;
  margin-top: 7px;
  padding: 8px 9px 7px 9px;
  font-size: 14px;
  background: none;
  box-shadow: none;
}
.sign-inner-title {
  font-weight: bold;
  margin-bottom: 4px;
}
.sign-inner-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  gap: 7px;
  margin-bottom: 1px;
}
.sign-inner-item input[type="checkbox"] {
  accent-color: #222;
  margin-right: 5px;
}
.sign-dotline {
  display: inline-block;
  min-width: 80px;
  font-size: 14px;
  border-bottom: none;
  letter-spacing: 2px;
  vertical-align: bottom;
}
.sign-inner-blank {
  margin: 7px 0 3px 0;
}
@media (max-width: 900px) {
  .signatures-row {
    flex-direction: column;
    gap: 18px;
  }
  .signature-box {
    margin: 0 0 12px 0;
  }
}
.sign-inner-title {
  font-weight: bold;
  margin-bottom: 4px;
  position: relative;
  padding-bottom: 0;
}
.sign-underline {
  border-bottom: 1px solid #222;
  width: 500px ;
  margin-left: 0px;
  margin-right: 0px;
  margin-top: 2px;
}
.approval-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  margin-top: 24px;
}
.approval-table th,
.approval-table td {
  border: 1px solid #000;
  padding: 10px 8px;
  font-size: 15px;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
  overflow-wrap: break-word;
}
.approval-table th {
  background: #f7f7f7;
  font-weight: bold;
  text-align: center;
}

/* ===================== */
/* ตารางเซ็น 3 ช่องหลัก  */
/* ===================== */
.approval-sign-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  background: #fff;
  margin-bottom: 16px;
}
.approval-sign-table th,
.approval-sign-table td {
  border: 1px solid #222;
  font-size: 16px;
  vertical-align: top;
  padding: 0;
  text-align: left;
}
.approval-sign-table th {
  text-align: center;
  background: #f8f9fa;
  font-weight: bold;
  font-size: 16.5px;
  padding: 10px 0;
}
.approval-sign-table td {
  height: 230px; /* ความสูงแต่ละช่อง */
}

.td-inner {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
  padding: 12px 12px 10px 12px;
  box-sizing: border-box;
}

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  min-height: 26px;
}
.checkbox-line input[type="checkbox"] {
  width: 17px;
  height: 17px;
  accent-color: #444;
  margin: 0 4px 0 0;
}
.checkbox-line label {
  font-size: 15px;
  user-select: none;
}

.dot-line {
  display: inline-block;
  width: 98%;
  border-bottom: 1px dotted #222;
  height: 15px;
  margin: 9px 0 0 0;
  min-width: 60px;
  vertical-align: middle;
}
.dot-line.short { width: 90%; min-width: 70px; }
.dot-line.mid { width: 65px; }
.dot-line.date { 
  width: 170px;  /* จากเดิม 98px */
  min-width: 100px; 
  border-bottom: 1px dotted #222;
}

.sign-space {
  margin: 16px 0 0 0;
  font-size: 15px;
  min-height: 22px;
  display: flex;
  align-items: center;
  gap: 7px;
}

/* Responsive */
@media (max-width: 900px) {
  .approval-sign-table th, .approval-sign-table td { font-size: 13.5px; }
  .approval-sign-table td { height: 170px; }
  .td-inner { padding: 9px 5px; }
}

/* ========================= */
.sign-header-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  table-layout: fixed;
}
.sign-header-table td {
  padding: 14px 10px 12px 10px;
  font-size: 16px;
  text-align: center;
  vertical-align: top;
  word-break: break-word;
  width: 33.33%;
}

/* ======= ปุ่ม Back & Next ======= */
.button-wrapper {
  display: flex;
  justify-content: space-between; /* Back ซ้าย, Next ขวา */
  gap: 16px;
  margin-top: 30px;
  padding-left: 185px;
  padding-right: 185px;
  padding-bottom: 50px;
}
#btnBack, #btnNext {
  font-size: 1rem;
  font-weight: 500;
  padding: .55rem 1.5rem;
  border: none;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  transition: background 0.22s, color 0.22s, box-shadow 0.22s;
  box-shadow: 0 1px 6px 0 rgba(0,0,0,0.07);
}
#btnBack {
  background-color: #6c757d;
  color: white;
}
#btnNext {
  background: #007bff;
  color: #fff;
}
#btnBack:hover {
  background: #c9bfbf;
  color: #111;
}

@media (max-width: 900px) {
  .sign-header-table td { font-size: 13.5px; }
}
</style>

<style>
@import '../css/style.css';
</style>

  