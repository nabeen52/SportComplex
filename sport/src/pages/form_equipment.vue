<template>
  <div class="layout">
    <!-- Sidebar -->
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
        <div class="form-header">
          <h3>แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์</h3>
          <p> ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง โทร 053-917820</p>
        </div>
        <div class="form-grid">
          <!-- Name -->
          <div class="form-row">
            <label>
              ชื่อ-นามสกุล
              <span v-if="touched && (showError && !form.name)" style="color:red">*</span>
            </label>
            <input
              type="text"
              class="custom-input"
              v-model="form.name"
              :class="{ 'is-invalid': touched && showError && !form.name }"
              :readonly="isFormLocked"
            />
          </div>
          <!-- Student ID -->
          <div class="form-row">
            <label>
              รหัสนักศึกษา
              <span v-if="touched && (showError && !form.user_id)" style="color:red">*</span>
            </label>
            <input
              type="text"
              class="custom-input"
              v-model="form.user_id"
              :class="{ 'is-invalid': touched && showError && !form.user_id }"
              :readonly="isFormLocked"
            />
          </div>
          <!-- Agency (หน่วยงาน) -->
          <div class="form-row">
  <label>
    ชื่อหน่วยงาน
    <span v-if="touched && (showError && !agencyInput)" style="color:red">*</span>
  </label>
   <input
    class="custom-input"
    list="agency-list"
    v-model="agencyInput"
    placeholder="ค้นหาหรือเลือกหน่วยงาน"
    @change="handleAgencyChange"
    :readonly="isAgencySelected"
    :class="{ 'is-invalid': touched && showError && !agencyInput }"
    style="flex:1"
  />
  <button
    v-if="isAgencySelected && !isFormLocked"
    type="button"
    @click="clearAgency"
    style="background:#eee;padding:3px 10px;border-radius:6px;border:none;cursor:pointer"
    title="ลบ"
  >ลบ</button>
  <datalist id="agency-list">
    <option v-for="option in agencyOptions" :key="option" :value="option" />
  </datalist>

</div>
<div class="form-row" v-if="agencyInput === 'อื่นๆ'">
  <label>
    โปรดระบุหน่วยงาน
    <span v-if="touched && (showError && !customAgency)" style="color:red">*</span>
  </label>
  <input
    type="text"
    class="custom-input"
    v-model="customAgency"
    placeholder="กรอกชื่อหน่วยงาน"
    :readonly="isFormLocked"
    :class="{ 'is-invalid': touched && showError && !customAgency }"
  />
</div>

          <div class="form-row" v-if="agencyInput === 'อื่นๆ'">
            <label>รายละเอียดเพิ่มเติม (ถ้ามี)</label>
            <input
              type="text"
              class="custom-input"
              v-model="otherAgencyDetail"
              placeholder="รายละเอียดเพิ่มเติม"
              :readonly="isFormLocked"
            />
          </div>
          <!-- Phone number -->
          <div class="form-row">
            <label>
              เบอร์โทรศัพท์
              <span v-if="touched && (showError && (!form.number || form.number.length !== 10))" style="color:red">*</span>
            </label>
            <input
              type="text"
              class="custom-input"
              v-model="form.number"
              maxlength="10"
              inputmode="numeric"
              pattern="\d*"
              @input="onPhoneInput"
              :readonly="isFormLocked"
              :class="{ 'is-invalid': touched && (showError && (!form.number || form.number.length !== 10)) }"
            />
          </div>
          <!-- Reason -->
          <div class="form-row">
            <label>
              เหตุผลที่ขอใช้
              <span v-if="touched && (showError && !form.reason)" style="color:red">*</span>
            </label>
            <textarea
              class="custom-textarea"
              v-model="form.reason"
              :class="{ 'is-invalid': touched && showError && !form.reason }"
              :readonly="isFormLocked"
              rows="4"
              placeholder="กรอกเหตุผลในการขอใช้"
            ></textarea>
          </div>

          <div class="form-row">
            <label>
              สถานที่ใช้งาน
              <span v-if="touched && (showError && !form.location)" style="color:red">*</span>
            </label>
            <textarea
              class="custom-textarea"
              v-model="form.location"
              :class="{ 'is-invalid': touched && showError && !form.location }"
              :readonly="isFormLocked"
              rows="3"
              placeholder="กรอกสถานที่ใช้งาน"
            ></textarea>
          </div>

          <!-- Date range -->
          <div class="form-row">
            <label>
              ตั้งแต่วันที่
              <span v-if="touched && (showError && !form.start_date)" style="color:red">*</span>
            </label>
            <input
              type="date"
              class="custom-input"
              v-model="form.start_date"
              :min="today"
              :class="{ 'is-invalid': touched && showError && !form.start_date }"
              :readonly="isFormLocked"
            />
          </div>
          <div class="form-row">
            <label>
              ถึงวันที่
              <span v-if="touched && (showError && !form.end_date)" style="color:red">*</span>
            </label>
            <input
              type="date"
              class="custom-input"
              v-model="form.end_date"
              :min="form.start_date || today"
              :class="{ 'is-invalid': touched && showError && !form.end_date }"
              :readonly="isFormLocked"
            />
          </div>
          <div class="form-row">
            <label>วันที่มารับของ:</label>
            <input
              v-model="form.receive_date"
              type="date"
              class="custom-input"
              :readonly="isFormLocked"
              :min="form.start_date || today"
              :max="form.end_date || ''"
              :disabled="!form.start_date || !form.end_date || isFormLocked"
            />
          </div>
          <div class="form-row">
            <label>เวลาที่มารับของ:</label>
            <input v-model="form.receive_time" type="time" :readonly="isFormLocked" class="custom-input" />
          </div>
         <!-- เฉพาะ block แนบไฟล์ใน template -->
<div class="form-row">
  <label>
  แนบไฟล์
  <span v-if="touched && showError && selectedFiles.length === 0" style="color:red">*</span>
</label>

  <div class="file-upload-wrapper">
    <div class="file-upload-header">
      <button
        type="button"
        class="custom-file-button"
        @click="$refs.fileUploadInput.click()"
      >เลือกไฟล์</button>
      <input
        ref="fileUploadInput"
        id="fileUploadInput"
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx"
        style="display:none"
        @change="handleFileChange"
      />
      <div class="accepted-file-info">
        * รองรับไฟล์ <span class="file-ext">.png, .jpg, .jpeg, .pdf, .xls, .xlsx, .doc, .docx</span> เท่านั้น
      </div>
    </div>
    <template v-if="selectedFiles.length > 0">
      <div class="custom-file-list">
        <div
          v-for="(file, idx) in selectedFiles"
          :key="idx"
          class="file-list-item"
        >
          <a
            href="#"
            @click.prevent="previewFile(file)"
            class="file-link"
            :title="file.name"
          >{{ file.name }}</a>
          <button type="button" class="remove-file-btn" @click="removeFile(idx)">×</button>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="custom-file-name">ยังไม่ได้เลือกไฟล์</div>
    </template>
  </div>
</div>



          <!-- Equipment cart -->
          <div class="form-section-title">รายการอุปกรณ์/วัสดุ/ครุภัณฑ์</div>
          <div class="equipment-list">
            <div
              v-for="(qty, name) in cartMap"
              :key="name"
              class="equipment-item"
            >
              <span>{{ name }}</span>
              <input
                type="number"
                min="1"
                :max="findMaxAmount(name)"
                class="equipment-amount-input"
                v-model.number="selectedQuantities[name]"
                placeholder="จำนวน"
                :disabled="isFormLocked"
                :class="{ 'is-invalid': touched && showError && (!selectedQuantities[name] || selectedQuantities[name] <= 0) }"
              />
              <input
                type="text"
                class="equipment-remark-input"
                v-model="equipmentRemarks[name]"
                :readonly="isFormLocked"
                placeholder="หมายเหตุ"
                style="margin-left: 12px; width: 140px"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="button-wrapper" style="padding-bottom: 20px;">
        <button id="btnReset" @click="resetForm" type="button">ล้างฟอร์ม</button>
        <button id="btnNext" @click="submitBooking" :disabled="isFormLocked">Next</button>
      </div>
      </div>
      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel. 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a>
            |
            Email:
            <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import axios from 'axios'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import Swal from 'sweetalert2'

const API_BASE = import.meta.env.VITE_API_BASE
const products = ref([]) // จำนวนรายการในรถเข็น
const router = useRouter()
const route = useRoute()
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(0)
const isSidebarClosed = ref(false)
const today = new Date().toISOString().split('T')[0]
const LS_FORM_KEY = 'equipmentFormData'
const isFormLocked = ref(false)
const selectedFiles = ref([])       // ใช้สำหรับแสดงรายชื่อไฟล์แนบ
const fileError = ref(false)

const form = reactive({
  name: '',
  user_id: '',
  number: '',
  reason: '',
  location: '',
  start_date: '',
  end_date: '',
  book_no: '',
  receive_date: '',
  receive_time: '',
})

const agencyOptions = ref([])
const agencyInput = ref('')
const customAgency = ref('')
const otherAgencyDetail = ref('')
const finalAgency = computed(() =>
  agencyInput.value === 'อื่นๆ'
    ? customAgency.value
    : agencyInput.value
)
const showError = ref(false)
const touched = ref(false)
const equipments = ref([])
const selectedQuantities = reactive({})
const cartMap = reactive({})
const equipmentRemarks = reactive({})
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = new Set()
const userId = localStorage.getItem('user_id') || ''

const isAgencySelected = computed(() =>
  !!agencyInput.value &&
  agencyOptions.value.includes(agencyInput.value) &&
  agencyInput.value !== 'อื่นๆ'
)
function clearAgency() {
  agencyInput.value = ''
  customAgency.value = ''
  otherAgencyDetail.value = ''
}


function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) unreadCount.value = 0
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

function onPhoneInput(e) {
  let digits = e.target.value.replace(/\D/g, '')
  if (digits.length > 10) digits = digits.slice(0, 10)
  form.number = digits
}

function validateFields() {
  const fields = {}
  if (!form.name) fields['name'] = true
  if (!form.user_id) fields['user_id'] = true
  if (!agencyInput.value || String(agencyInput.value).trim() === "") fields['agency'] = true
  if (agencyInput.value === 'อื่นๆ' && (!customAgency.value || String(customAgency.value).trim() === "")) fields['agencyOther'] = true
  if (!form.number || form.number.length !== 10) fields['number'] = true
  if (!form.reason) fields['reason'] = true
  if (!form.location) fields['location'] = true
  if (!form.start_date) fields['start_date'] = true
  if (!form.end_date) fields['end_date'] = true
  if (!selectedFiles.value.length) fields['file'] = true

  let invalidQty = false
  for (const name in cartMap) {
    const qty = selectedQuantities[name]
    if (!qty || qty <= 0) {
      invalidQty = true
      break
    }
  }
  if (invalidQty) fields['equipmentQty'] = true
  showError.value = Object.keys(fields).length > 0
  return Object.keys(fields).length === 0
}

function hasUploadedFile() {
  return selectedFiles.value.length > 0
}

function handleFileChange(event) {
  const allowedExts = [".png", ".jpg", ".jpeg", ".pdf", ".xls", ".xlsx", ".doc", ".docx"]
  const files = Array.from(event.target.files).filter(file =>
    allowedExts.some(ext => file.name.toLowerCase().endsWith(ext))
  )
  if (files.length !== event.target.files.length) {
    Swal.fire('รองรับเฉพาะไฟล์ .png, .jpg, .jpeg, .pdf, .xls, .xlsx, .doc, .docx', '', 'warning')
  }
  const promises = files.map(file =>
    new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => resolve({
        fileData: e.target.result,
        fileName: file.name,
        mimeType: file.type
      })
      reader.readAsDataURL(file)
    })
  )
  Promise.all(promises).then(results => {
    localStorage.setItem('equipment_upload_file', JSON.stringify(results))
    selectedFiles.value = results.map(f => ({
      name: f.fileName,
      type: f.mimeType,
      size: f.fileData.length,
      data: f.fileData
    }))
  })
}

function loadUploadedFiles() {
  const data = localStorage.getItem('equipment_upload_file')
  if (data) {
    try {
      const arr = JSON.parse(data)
      selectedFiles.value = arr.map(f => ({
        name: f.fileName,
        size: f.fileData.length,
        type: f.mimeType,
        data: f.fileData
      }))
    } catch (e) {
      selectedFiles.value = []
    }
  } else {
    selectedFiles.value = []
  }
}

function validateBeforeSubmit() {
  if (!hasUploadedFile()) {
    fileError.value = true
    return false
  }
  fileError.value = false
  return true
}

async function uploadSelectedFiles() {
  const files = JSON.parse(localStorage.getItem('equipment_upload_file') || '[]')
  if (!files.length) return []
  const uploadedFiles = []
  for (const f of files) {
    const res = await axios.post(`${API_BASE}/api/upload_file`, {
      fileName: f.fileName,
      fileData: f.fileData,
      user_id: form.user_id || ""
    })
    uploadedFiles.push({
      fileId: res.data.id,
      fileName: f.fileName,
      mimeType: f.mimeType
    })
  }
  return uploadedFiles
}

function canStepTo(index) {
  if (index <= currentStep.value) return true
  if (index === 1) return validateFields() && hasUploadedFile()
  if (index === 2) return false
  return false
}

function goStep(index) {
  if (index === currentStep.value) return
  if (!canStepTo(index)) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณาทำขั้นตอนก่อนหน้าให้ครบถ้วนก่อน',
      confirmButtonText: 'ตกลง'
    })
    return
  }
  if (index === 0) router.push('/form_equipment')
  else if (index === 1) router.push('/form_equipment3')
  else if (index === 2) router.push('/form_equipment4')
}

function closeNotifications() {
  showNotifications.value = false
}

async function submitBooking() {
  touched.value = true   // ตั้งค่านี้เพื่อให้แสดงดอกจันและ error
  if (!validateFields() || !validateBeforeSubmit()) {
    Swal.fire('กรุณากรอกข้อมูลให้ครบถ้วน', '', 'warning')
    return
  }
  let uploadedFiles = []
  try {
    uploadedFiles = await uploadSelectedFiles()
  } catch (err) {
    Swal.fire('อัปโหลดไฟล์ไม่สำเร็จ', err.message, 'error')
    return
  }
  const items = Object.entries(selectedQuantities).map(([name, amount]) => ({
    item_name: name,
    amount: amount,
    remark: equipmentRemarks[name] || ""
  }))
  const bookingPayload = {
    ...form,
    agency: agencyInput.value === 'อื่นๆ' ? customAgency.value : agencyInput.value,
    agency_detail: otherAgencyDetail.value || '',
    items,
    attachedFiles: uploadedFiles
  }
  try {
    const res = await axios.post(`${API_BASE}/api/booking_equipment`, bookingPayload)
    const booking = res.data?.booking || res.data
    localStorage.setItem('equipmentFormData', JSON.stringify({
      form: { ...form,
        agency: agencyInput.value === 'อื่นๆ' ? customAgency.value : agencyInput.value,
        agency_detail: otherAgencyDetail.value || '',
        booking_id: booking._id || booking.booking_id
      },
      selectedQuantities: { ...selectedQuantities },
      agencyInput: agencyInput.value,
      customAgency: customAgency.value,
      otherAgencyDetail: otherAgencyDetail.value,
      equipmentRemarks: { ...equipmentRemarks }
    }))
    router.push('/form_equipment3')
  } catch (err) {
    Swal.fire('บันทึกข้อมูลไม่สำเร็จ', err?.response?.data?.message || err.message, 'error')
  }
}

function handleAgencyChange() {
  if (agencyInput.value !== 'อื่นๆ') {
    customAgency.value = ''
    otherAgencyDetail.value = ''
  }
}

function findMaxAmount(name) {
  const eq = equipments.value.find(e => e.name === name)
  return eq ? eq.amount : undefined
}

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
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

let polling = null

onMounted(async () => {
  const newBookingId = "EQ" + Date.now() + Math.floor(Math.random() * 1000000)
  localStorage.setItem('equipment_booking_id', newBookingId)
  touched.value = false
  try {
    const res = await axios.get(`${API_BASE}/api/equipments`)
    equipments.value = res.data.map(e => ({ ...e, amount: e.quantity }))
  } catch {
    equipments.value = []
  }
  try {
    const res = await axios.get(`${API_BASE}/api/information?type=equipment`)
    const uniqueUnits = [...new Set(res.data.map(item => item.unit))]
    agencyOptions.value = uniqueUnits
    if (!agencyOptions.value.includes('อื่นๆ')) agencyOptions.value.push('อื่นๆ')
  } catch {
    agencyOptions.value = ['อื่นๆ']
  }
  if (route.query.items) {
    try {
      const items = JSON.parse(route.query.items)
      Object.keys(selectedQuantities).forEach(key => delete selectedQuantities[key])
      Object.keys(cartMap).forEach(key => delete cartMap[key])
      Object.keys(equipmentRemarks).forEach(key => delete equipmentRemarks[key])
      if (Array.isArray(items)) {
        items.forEach(({ name, quantity, remark }) => {
          if (name && quantity) {
            selectedQuantities[name] = quantity
            cartMap[name] = quantity
            if (remark) equipmentRemarks[name] = remark
          }
        })
      }
    } catch (e) {
      console.error('Error parsing items from query:', e)
    }
  } else {
    const data = localStorage.getItem(LS_FORM_KEY)
    if (data) {
      const saved = JSON.parse(data)
      Object.assign(form, saved.form)
      agencyInput.value = saved.agencyInput || ''
      customAgency.value = saved.customAgency || ''
      otherAgencyDetail.value = saved.otherAgencyDetail || ''
      Object.keys(selectedQuantities).forEach(key => delete selectedQuantities[key])
      Object.assign(selectedQuantities, saved.selectedQuantities || {})
      Object.keys(cartMap).forEach(key => delete cartMap[key])
      Object.assign(cartMap, saved.selectedQuantities || {})
      Object.keys(equipmentRemarks).forEach(key => delete equipmentRemarks[key])
      Object.assign(equipmentRemarks, saved.equipmentRemarks || {})
    }
  }
  loadUploadedFiles()
  form.user_id = localStorage.getItem('user_id') || ''
  if (form.user_id) {
    try {
      const resUser = await axios.get(`${API_BASE}/api/users/${form.user_id}`)
      form.name = resUser.data.name || ''
    } catch (err) {
      console.error('โหลดชื่อผู้ใช้ไม่สำเร็จ', err)
    }
  }
  fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  await loadCart()

})
onBeforeUnmount(() => {
  clearInterval(polling)
})

function resetForm() {
  const name = form.name
  const userId = form.user_id
  Object.assign(form, {
    name,
    user_id: userId,
    number: '',
    reason: '',
    location: '',
    start_date: '',
    end_date: '',
    book_no: '',
    receive_date: '',
    receive_time: '',
  })
  agencyInput.value = ''
  customAgency.value = ''
  otherAgencyDetail.value = ''
  fileError.value = false
  selectedFiles.value = []
  localStorage.removeItem('equipment_upload_file')
  Object.keys(selectedQuantities).forEach(key => delete selectedQuantities[key])
  Object.keys(cartMap).forEach(key => delete cartMap[key])
  Object.keys(equipmentRemarks).forEach(key => delete equipmentRemarks[key])
  touched.value = false
  showError.value = false
}

function removeFile(idx) {
  selectedFiles.value.splice(idx, 1)
  const arr = JSON.parse(localStorage.getItem('equipment_upload_file') || '[]')
  arr.splice(idx, 1)
  if (arr.length === 0) {
    localStorage.removeItem('equipment_upload_file')
  } else {
    localStorage.setItem('equipment_upload_file', JSON.stringify(arr))
  }
}

// ฟังก์ชัน preview
function previewFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (file.data) {
    openFilePreview(file.data, ext, file.name)
  } else {
    Swal.fire('กรุณาเลือกไฟล์ใหม่อีกครั้งเพื่อดูตัวอย่าง', '', 'info')
  }
}
function openFilePreview(dataUrl, ext, fileName) {
  if (["png", "jpg", "jpeg", "pdf"].includes(ext)) {
    const win = window.open()
    win.document.write(
      ext === "pdf"
        ? `<iframe src="${dataUrl}" width="100%" height="100%" style="border:0;min-height:90vh"></iframe>`
        : `<img src="${dataUrl}" style="max-width:90vw;max-height:90vh;display:block;margin:auto"/>`
    )
  } else {
    // .doc .xls .xlsx → Download
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = fileName
    a.click()
  }
}

// ============ ส่วนนี้คือจุดแก้ไขหลัก ใช้ onBeforeRouteLeave (ดีที่สุด ไม่ต้อง watcher route) ============
const FORM_ROUTES = [
  '/form_equipment',
  '/form_equipment3',
  '/form_equipment4'
]
onBeforeRouteLeave((to, from, next) => {
  if (!FORM_ROUTES.includes(to.path)) {
    localStorage.removeItem('equipment_upload_file')
    selectedFiles.value = []
  }
  next()
})
// =====================================================================================================

// สำหรับ auto-save
watch(
  [form, agencyInput, customAgency, otherAgencyDetail, selectedQuantities, equipmentRemarks],
  () => {
    localStorage.setItem(
      LS_FORM_KEY,
      JSON.stringify({
        form: { ...form },
        agencyInput: agencyInput.value,
        customAgency: customAgency.value,
        otherAgencyDetail: otherAgencyDetail.value,
        selectedQuantities: { ...selectedQuantities },
        equipmentRemarks: { ...equipmentRemarks },
        agency: agencyInput.value === 'อื่นๆ'
          ? (customAgency.value || '')
          : (agencyInput.value || '')
      })
    )
  },
  { deep: true }
)
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
  transition: background 0.3s;
  cursor: pointer;
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
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 40px;
  margin-top: 30px;
}
.form-header {
  text-align: center;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
}
.form-row label {
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 14px;
}
.custom-input {
  padding: 10px 14px;
  font-size: 14px;
  border: 2px solid #94a3b8;
  border-radius: 8px;
  background-color: #f9fafb;
  transition: border 0.3s ease;
}
.custom-input:focus {
  outline: none;
  border-color: #3b82f6;
  background-color: #fff;
}
.form-section-title {
  grid-column: span 2;
  font-weight: bold;
  margin-top: 20px;
  font-size: 16px;
}
.equipment-list {
  grid-column: span 2;
  margin-bottom: 10px;
}
.equipment-item {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-top: 10px;
  gap: 1.5rem;
}
.equipment-amount-input {
  width: 60px;
  margin-left: 10px;
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
  justify-content: flex-end;
  margin: 20px auto 0 auto;
  width: 90%;
  max-width: 900px;
}
.is-invalid {
  border-color: #ef4444 !important;
  background: #ffeaea !important;
}

/* ============ ปุ่มแนบไฟล์ ============= */
.file-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  width: 100%;
}

.file-upload-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
}

.accepted-file-info {
  font-size: 12px;
  color: #888;
  font-style: italic;
  font-family: inherit;
  user-select: none;
  white-space: nowrap;
}

.custom-file-list {
  display: block;
  margin: 6px 0 0 0;    /* <<<<<<<< เปลี่ยนจาก 90px เป็น 0 */
  width: 100%;           /* <<<<<<<< เปลี่ยนจาก calc(...) เป็น 100% */
}

.file-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.custom-file-button {
  background: #3498db !important;
  color: #fff !important;
  border-radius: 5px;
  padding: 3px 10px;
  cursor: pointer;
  border: none;
  font-weight: bold;
  font-size: 13px;
  width: 82px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  margin-right: 6px;
  transition: background 0.2s;
}
.custom-file-button:hover {
  background: #1976d2 !important;
}

.custom-file-name {
  color: #333;
  min-width: 100px;
  font-size: 15px;
  margin-left: 0;       /* <<<<<<<< เปลี่ยนจาก 90px เป็น 0 */
}

/* Responsive (มือถือ) */

.file-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.file-link {
  color: #1976d2;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
  word-break: break-all;
}
.file-link:hover {
  color: #ff4d4f;
}
.remove-file-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 1em;
}
.remove-file-btn:hover {
  background: #c82333;
}

#btnReset {
  background-color: #ff7070;
  color: white;
  margin-right: 12px;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
#btnReset:hover {
  background-color: #ff4d4d;
}
.custom-textarea {
  padding: 10px 14px;
  font-size: 14px;
  border: 2px solid #94a3b8;
  border-radius: 8px;
  background-color: #f9fafb;
  transition: border 0.3s ease;
  font-family: inherit;
  min-height: 80px;
  resize: vertical;
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
  z-index: 1001;
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
}


</style>

<style>
@import '../css/style.css';
</style>