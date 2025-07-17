<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/" exact-active-class="active">
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
              @click="canStepTo(index) && goStep(index)"
              :style="{ cursor: canStepTo(index) ? 'pointer' : 'not-allowed', opacity: canStepTo(index) ? 1 : 0.5 }"
            ></div>
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
      </div>

      <div class="button-wrapper">
        <router-link to="/form_field" id="btnBack">Back</router-link>
        <div class="right-buttons">
          <button id="btnClear" @click="clearUploadedFile">ล้างไฟล์</button>
          <button id="btnNext" @click="handleNext">Next</button>
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'


const API_BASE = import.meta.env.VITE_API_BASE
const steps = ['กรอกข้อมูล', 'อัปโหลดไฟล์', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(1)

const canStepTo = (index) => index <= currentStep.value
const goStep = (index) => {
  if (canStepTo(index)) {
    if (index === 0) window.location.href = '/form_field'
    if (index === 1) window.location.href = '/form_field2'
    if (index === 2) window.location.href = '/form_field3'
    if (index === 3) window.location.href = '/form_field4'
  }
}

const isSidebarClosed = ref(false)
const toggleSidebar = () => { isSidebarClosed.value = !isSidebarClosed.value }

const uploadedFileName = ref('')
const uploadedFile = ref(null)
const fileBase64 = ref('')

onMounted(() => {
  const savedFile = localStorage.getItem('equipment_upload_file')
  if (savedFile) {
    const fileData = JSON.parse(savedFile)
    uploadedFileName.value = fileData.fileName || ''
    fileBase64.value = fileData.fileData || ''
  }
})

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    uploadedFileName.value = file.name
    uploadedFile.value = file
    const reader = new FileReader()
    reader.onload = () => {
      fileBase64.value = reader.result
      localStorage.setItem('equipment_upload_file', JSON.stringify({
        fileName: file.name,
        fileData: reader.result,
        mimeType: file.type
      }))
    }
    reader.readAsDataURL(file)
  }
}

function clearUploadedFile() {
  uploadedFileName.value = ''
  uploadedFile.value = null
  fileBase64.value = ''
  localStorage.removeItem('equipment_upload_file')
}

function handleNext() {
  if (!uploadedFileName.value) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณาอัปโหลดไฟล์ก่อน',
      text: 'ต้องแนบไฟล์เอกสารก่อนจึงจะดำเนินการต่อได้',
      confirmButtonText: 'ตกลง'
    })
    return
  }
  window.location.href = '/form_field3'
}
</script>

<style scoped>
@import '../css/style.css';

.headStepper {
  background-color: white;
  margin: 15px auto;
  padding: 0;
  width: 90%;
  max-width: 900px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
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
  width: 80px;
  height: 4px;
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
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.upload-center {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.upload-button {
  background-color: #048ace;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}
.upload-button:hover {
  background-color: #036ea1;
}
.file-name {
  margin-bottom: 10px;
  font-weight: bold;
  color: #333;
  word-break: break-all;
}
.button-wrapper {
  display: flex;
  justify-content: space-between;
  margin: 20px auto 0;
  width: 90%;
  max-width: 900px;
  align-items: center;
}
#btnBack {
  background-color: #6c757d;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  line-height: 1.5;
  order: 1;
}
#btnBack:hover {
  background-color: #5a6268;
}
.right-buttons {
  display: flex;
  gap: 10px;
  order: 2;
}
#btnClear {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
#btnClear:hover {
  background-color: #c0392b;
}
#btnNext {
  background-color: #048ace;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
</style>