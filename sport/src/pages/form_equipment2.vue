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
      <!-- header -->
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <div>
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
          <router-link to="/cart"><i class="pi pi-shopping-cart"></i></router-link>
          <router-link to="/profile"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- Body -->
      <div>
        <div class="headStepper">
          <div class="stepper">
            <div v-for="(step, index) in steps" :key="index" class="step">
              <div class="circle" :class="{
                active: index === currentStep,
                completed: index < currentStep
              }" @click="tryGoStep(index)" :style="{
                  cursor: canStepTo(index) ? 'pointer' : 'not-allowed',
                  opacity: canStepTo(index) ? 1 : 0.5
                }"></div>
              <div class="label">{{ step }}</div>
              <div v-if="index < steps.length - 1" class="line" :class="{ filled: index < currentStep }"></div>
            </div>
          </div>
        </div>

        <div class="form-container">
          <h1 style="text-align: center;">อัปโหลดไฟล์</h1>
          <div class="upload-center">
            <p v-if="uploadedFileName" class="file-name">{{ uploadedFileName }}</p>
            <input type="file" id="fileUpload" @change="handleFileUpload" hidden />
            <label for="fileUpload" class="upload-button">อัปโหลดไฟล์</label>
          </div>

          <div style="text-align:center; margin-top:15px;">
            <!-- แสดง booking_id เพื่อ debug หรือให้ user เก็บ reference -->
            <!-- <span v-if="bookingId"><b>Booking ID:</b> {{ bookingId }}</span> -->
             <p style="color: red;">***หมายเหตุ***</p>
          </div>

        </div>
      </div>

      <div class="button-wrapper">
        <router-link to="/form_equipment" id="btnBack">Back</router-link>
        <button id="btnNext" @click="handleNext">Next</button>
      </div>
    </div>

    <footer class="foot">
      <div class="footer-left">
        <p>
          Sport Complex – Mae Fah Luang University |
          Tel. 0-5391-7821 | Facebook:
          <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a>
          |
          Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const API_BASE = import.meta.env.VITE_API_BASE

// Stepper
const steps = ['กรอกข้อมูล', 'อัปโหลดไฟล์', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(1)

// Booking id (สำคัญ)
const bookingId = ref(localStorage.getItem('equipment_booking_id') || '')

// อัปโหลดไฟล์
const uploadedFileName = ref('')
const uploadedFile = ref(null)
const fileBase64 = ref('')

// เมื่อ user เลือกไฟล์
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    uploadedFileName.value = file.name
    uploadedFile.value = file
    const reader = new FileReader()
    reader.onload = () => {
      fileBase64.value = reader.result // base64 string พร้อม prefix
      // เซฟ booking_id ไปด้วยใน localStorage
      localStorage.setItem('equipment_upload_file', JSON.stringify({
        fileName: file.name,
        fileData: reader.result,
        mimeType: file.type,
        booking_id: bookingId.value // <---- เพิ่ม booking_id เก็บคู่กับไฟล์
      }))
    }
    reader.readAsDataURL(file)
  }
}

// Sidebar toggle
const isSidebarClosed = ref(false)
function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

// Notification logic
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = new Set()
const userId = localStorage.getItem('user_id') || ''

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    unreadCount.value = 0
  }
}

async function fetchNotifications() {
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const newNotis = res.data.filter(item =>
      (item.status === 'approved' || item.status === 'disapproved') &&
      !lastCheckedIds.has(item._id)
    )

    if (newNotis.length) {
      const newMessages = newNotis.map(item => ({
        id: item._id,
        message: `รายการ '${item.name}' ของคุณถูก${item.status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}`
      }))
      notifications.value.push(...newMessages)
      newNotis.forEach(item => lastCheckedIds.add(item._id))
      unreadCount.value = notifications.value.length
    }
  } catch (err) {
    console.error('แจ้งเตือน error:', err)
  }
}

let polling = null
onMounted(() => {
  const savedFile = localStorage.getItem('equipment_upload_file')
  if (savedFile) {
    try {
      const fileObj = JSON.parse(savedFile)
      uploadedFileName.value = fileObj.fileName || ''
      fileBase64.value = fileObj.fileData || ''
      // โหลด booking_id ด้วย (กรณีมีในไฟล์)
      if (fileObj.booking_id) {
        bookingId.value = fileObj.booking_id
        localStorage.setItem('equipment_booking_id', fileObj.booking_id)
      }
    } catch {
      uploadedFileName.value = ''
      fileBase64.value = ''
    }
  }

  fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
})
onBeforeUnmount(() => {
  clearInterval(polling)
})

// Stepper navigation check
function canStepTo(index) {
  return index <= currentStep.value + 1;
}

function tryGoStep(index) {
  if (canStepTo(index)) {
    if (index === 0) window.location.href = '/form_equipment'
    else if (index === 1) window.location.href = '/form_equipment2'
    else if (index === 2) window.location.href = '/form_equipment3'
    else if (index === 3) window.location.href = '/form_equipment4'
  }
}

function handleNext() {
  window.location.href = '/form_equipment3'
}





// function handleNext() {
//   if (!uploadedFileName.value) {
//     Swal.fire({
//       icon: 'warning',
//       title: 'กรุณาอัปโหลดไฟล์ก่อนกดถัดไป',
//       confirmButtonText: 'ตกลง'
//     })
//     return
//   }
//   window.location.href = '/form_equipment3'
// }
</script>

<style scoped>
/* ... style เหมือนเดิม ... */
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

.upload-button {
  display: inline-block;
  background-color: #048ace;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  text-align: center;
  transition: background-color 0.3s;
}

.upload-button:hover {
  background-color: #036ea1;
}

.upload-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.file-name {
  margin-bottom: 10px;
  font-weight: bold;
  color: #333;
  text-align: center;
  word-break: break-all;
}
</style>
<style>
@import '../css/style.css';
</style>