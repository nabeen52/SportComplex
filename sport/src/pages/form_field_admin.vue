<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/dashboard" exact-active-class="active"><i class="pi pi-chart-pie"></i> Dashboard</router-link>
        <router-link to="/home_admin" exact-active-class="active"><i class="pi pi-megaphone"></i> Edit News</router-link>
        <router-link to="/edit_field" active-class="active"><i class="pi pi-map-marker"></i> Edit Field</router-link>
        <router-link to="/edit_equipment" active-class="active"><i class="pi pi-clipboard"></i> Edit Equipment</router-link>
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> Book Field</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> Approve</router-link>
        <router-link to="/return_admin" active-class="active">
            <i class="pi pi-box"></i> Return
          </router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> Member</router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> History System</router-link>
      </nav>
    </aside>

    <div class="main">
      <!-- Header -->
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

      <div>
        <div class="form-container">
          <div class="form-header">
            <h3>แบบฟอร์มขออนุมัติใช้สถานที่ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h3>
            <p>โทร 053-917820-1 E-mail Sport-complex@mfu.ac.th</p>
          </div>


          <form @submit.prevent="handleSubmit" enctype="multipart/form-data" class="booking-form">
            <div class="form-grid">
              <!-- ... ฟิลด์เดิม ... -->
              <div class="form-row">
                <label>ที่ อว.</label>
                <input type="text" :class="inputClass('aw')" v-model="formData.aw" />
              </div>
              <div class="form-row">
                <label>วันที่</label>
                <input type="date" :class="inputClass('date')" v-model="formData.date" />
              </div>
              <div class="form-row">
                <label>เบอร์โทรติดต่อ</label>
                <input type="text" :class="inputClass('tel')" v-model="formData.tel" />
              </div>
              <div class="form-row">
                <label>ชื่อหน่วยงาน</label>
                <input
                  list="agency-list"
                  :class="inputClass('agency')"
                  v-model="agencyInput"
                  placeholder="ค้นหาหรือเลือกหน่วยงาน"
                  @change="handleAgencyChange"
                />
                <datalist id="agency-list">
                  <option v-for="option in agencyOptions" :key="option" :value="option" />
                </datalist>
              </div>
              <div class="form-row" v-if="agencyInput === 'อื่นๆ'">
                <label>โปรดระบุหน่วยงาน</label>
                <input type="text" :class="inputClass('agencyOther')" v-model="customAgency" placeholder="กรอกชื่อหน่วยงาน" />
              </div>
              <div class="form-row" v-if="agencyInput === 'อื่นๆ'">
                <label>รายละเอียดเพิ่มเติม (ถ้ามี)</label>
                <input type="text" class="custom-input" v-model="otherAgencyDetail" placeholder="รายละเอียดเพิ่มเติม" />
              </div>
              <div class="form-row">
                <label>ชื่อกิจกรรม/โครงการ</label>
                <textarea
                  :class="inputClass('name_activity') + ' custom-textarea'"
                  v-model="formData.name_activity"
                  rows="4"
                  placeholder="กรอกชื่อกิจกรรม/โครงการ"
                ></textarea>
              </div>
              <div class="form-row">
                <label>เหตุผลในการขอใช้</label>
                <textarea
                  :class="inputClass('reasons') + ' custom-textarea'"
                  v-model="formData.reasons"
                  rows="4"
                  placeholder="กรอกเหตุผลในการขอใช้"
                ></textarea>
              </div>
              <div class="form-row">
                <label>ตั้งแต่วันที่</label>
                <input type="date" :class="inputClass('since')" v-model="formData.since" :min="minBookingDate" />
                <small class="note-text">* กรุณาจองก่อนใช้งานจริง 5 วัน</small>
              </div>
              <div class="form-row">
                <label>ถึงวันที่</label>
                <input type="date" :class="inputClass('uptodate')" v-model="formData.uptodate" :min="formData.since || minBookingDate" />
              </div>
              <div class="form-row">
  <label>ตั้งแต่เวลา</label>
  <input type="time" :class="inputClass('since_time')" v-model="formData.since_time" />
</div>
<div class="form-row">
  <label>ถึงเวลา</label>
  <input
    type="time"
    :class="inputClass('until_thetime')"
    v-model="formData.until_thetime"
    :min="minUntilTime"
  />
</div>
              <div class="form-row">
                <label>จำนวนผู้เข้าร่วม</label>
                <input type="text" :class="inputClass('participants')" v-model="formData.participants" />
              </div>
              <div class="form-row">
                <label>ชื่อผู้ขอใช้สถานที่</label>
                <input
                  type="text"
                  :class="inputClass('requester')"
                  v-model="formData.requester"
                  :readonly="!isProxyBooking"
                  :placeholder="isProxyBooking ? 'กรอกชื่อผู้ขอใช้สถานที่' : loginName"
                />
                <div class="proxy-checkbox-row-under">
                  <input type="checkbox" v-model="isProxyBooking" id="proxy-booking-checkbox" />
                  <label for="proxy-booking-checkbox" class="proxy-checkbox-label-under">จองแทนผู้อื่น</label>
                </div>
              </div>
              <div class="form-row">
  <label>รหัสนักศึกษา/รหัสพนักงาน</label>
  <input
    type="text"
    :class="inputClass('userId')"
    v-model="proxyUserId"
    :readonly="!isProxyBooking"
    :placeholder="isProxyBooking ? 'กรอกรหัสนักศึกษา/รหัสพนักงาน' : loginStudentId"
  />
</div>

              <div class="form-section-title">1.ขออนุมัติใช้สถานที่</div>
              <div class="form-row">
                <label>อาคารที่ต้องการขอใช้</label>
                <input type="text" class="custom-input" :value="formData.building || 'ยังไม่ได้เลือกอาคาร'" readonly />
              </div>
              <!-- *** เงื่อนไขใหม่ *** -->
              <div class="form-row"
                   v-if="hasZone && formData.zone && zones.some(z => z.name === formData.zone)">
                <label>ระบุตำแหน่งพื้นที่/ห้องที่ต้องการใช้</label>
                <input type="text" class="custom-input" :value="formData.zone" readonly />
              </div>
              <!-- *** /เงื่อนไขใหม่ *** -->

              <!-- **** เปลี่ยนตรงนี้ **** -->
              <div class="form-section-title">2.ขออนุมัติใช้ระบบสาธารณูปโภค</div>
              <div class="form-row" style="grid-column: span 2;">
                <div>
                  <label>
  <input type="radio" name="utility-request" value="yes" v-model="formData.utilityRequest" /> ต้องการ
</label>
<label>
  <input type="radio" name="utility-request" value="no" v-model="formData.utilityRequest" /> ไม่ต้องการ
</label>
                </div>
              </div>
              <div class="form-row" v-if="formData.utilityRequest === 'yes'">
                <label>เปิดเครื่องปรับอากาศตั้งแต่เวลา</label>
                <input type="time" :class="inputClass('turnon_air')" v-model="formData.turnon_air" />
              </div>
              <div class="form-row" v-if="formData.utilityRequest === 'yes'">
                <label>ถึงเวลา</label>
                <input type="time" :class="inputClass('turnoff_air')" v-model="formData.turnoff_air" />
              </div>
              <div class="form-row" v-if="formData.utilityRequest === 'yes'">
                <label>ไฟฟ้าส่องสว่างตั้งแต่เวลา</label>
                <input type="time" :class="inputClass('turnon_lights')" v-model="formData.turnon_lights" />
              </div>
              <div class="form-row" v-if="formData.utilityRequest === 'yes'">
                <label>ถึงเวลา</label>
                <input type="time" :class="inputClass('turnoff_lights')" v-model="formData.turnoff_lights" />
              </div>
              <div class="form-row">
                <label>อื่นๆ</label>
                <input type="text" class="custom-input" v-model="formData.other" />
              </div>

              <div class="form-section-title">3.ขออนุมัติรายการประกอบอาคาร </div>
              <div class="form-row" style="grid-column: span 2;">
                <div>
                  <label>
  <input type="radio" name="facility-request" value="yes" v-model="formData.facilityRequest" /> ต้องการ
</label>
<label>
  <input type="radio" name="facility-request" value="no" v-model="formData.facilityRequest" /> ไม่ต้องการ
</label>
                </div>
              </div>
              <div class="form-row" v-if="formData.facilityRequest === 'yes'">
                <label>ดึงอัฒจันทร์ภายในอาคาารเฉลิมพระเกียรติ 72 พรรษา</label>
                <input type="text" class="custom-input" v-model="formData.amphitheater"  placeholder="เฉพาะอาคาร72พรรษา" />
              </div>
              <div class="form-row"  v-if="formData.facilityRequest === 'yes'">
                <label>อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน)</label>
                <input type="text" class="custom-input" v-model="formData.need_equipment" />
              </div>

              
              <div class="form-row" style="grid-column: span 2;">
                <label>แนบไฟล์ (บังคับ)</label>
                <div class="file-upload-wrapper">
                  <label class="custom-file-label" :class="{ 'input-error': fileError }">
                    <span class="custom-file-button">เลือกไฟล์</span>
                    <input
                      id="fileUploadInput"
                      type="file"
                      multiple
                      style="display:none"
                      @change="handleFileChange"
                    />
                    <span class="custom-file-name">
                      <span v-if="selectedFiles.length > 0">
                        {{ selectedFiles.length }} ไฟล์
                      </span>
                      <span v-else>
                        ยังไม่ได้เลือกไฟล์
                      </span>
                    </span>
                  </label>
                  <button v-if="selectedFiles.length > 0" type="button" class="clear-files-btn" @click="clearFiles">
                    ล้างไฟล์
                  </button>
                </div>
                <small class="note-text">* สามารถแนบไฟล์ได้ทุกชนิด</small>
                <div v-if="fileError" class="input-error-message">กรุณาแนบไฟล์อย่างน้อย 1 ไฟล์</div>
                <div v-if="selectedFiles.length > 0" class="attached-files-list">
                  <div v-for="(file, idx) in selectedFiles" :key="idx" class="attached-file-item">
                    {{ shortenFileName(file.name) }}
                  </div>
                </div>
              </div>
            </div>
            <div class="button-wrapper">
              <button type="button" class="clear-btn" @click="handleClear">ล้างฟอร์ม</button>
              <button id="btnNext" type="submit">Next</button>
            </div>
          </form>
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
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'

const API_BASE = import.meta.env.VITE_API_BASE

// Stepper
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const stepRoutes = ['/form_field_admin1', '/form_field_admin3', '/form_field_admin4']
const currentStep = 0

const router = useRouter()
const route = useRoute()

const userId = ref(localStorage.getItem('user_id') || '')
const studentId = ref(localStorage.getItem('student_id') || '')
const loginName = ref('')
const loginStudentId = ref('')

const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null

const proxyUserId = ref(localStorage.getItem('student_id') || localStorage.getItem('user_id') || '')
const isProxyBooking = ref(false)

const formData = ref({
  aw: '', date: '', tel: '', name_activity: '', reasons: '',
  since: '', uptodate: '', since_time: '', until_thetime: '', participants: '',
  requester: '', building: '', zone: '', selectedUtility: '',
  turnon_air: '', turnoff_air: '', turnon_lights: '', turnoff_lights: '',
  other: '', amphitheater: '', equipment: ''
})

const agencyOptions = ref([])
const agencyInput = ref('')
const customAgency = ref('')
const otherAgencyDetail = ref('')

// ---------- ดึง zone อัตโนมัติ ----------
const hasZone = ref(false)
const zones = ref([])
watch(() => formData.value.building, async (newBuilding) => {
  if (newBuilding) {
    try {
      const res = await axios.get(`${API_BASE}/api/fields`)
      const found = res.data.find(f => f.name === newBuilding)
      if (found && found.hasZone && found.zones && found.zones.length > 0) {
        zones.value = found.zones
        hasZone.value = true
        if (!found.zones.some(z => z.name === formData.value.zone)) {
          formData.value.zone = ''
        }
      } else {
        zones.value = []
        hasZone.value = false
        formData.value.zone = ''
      }
    } catch {
      zones.value = []
      hasZone.value = false
      formData.value.zone = ''
    }
  } else {
    zones.value = []
    hasZone.value = false
    formData.value.zone = ''
  }
})
// --------------------------------------

const selectedFiles = ref([])
const fileError = ref(false)
const isSidebarClosed = ref(false)
function toggleSidebar() { isSidebarClosed.value = !isSidebarClosed.value }

const minUntilTime = computed(() => {
  if (!formData.value.since_time) return ''
  const [h, m] = formData.value.since_time.split(':').map(Number)
  let hour = h, min = m + 1
  if (min >= 60) {
    hour += 1
    min -= 60
  }
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
})

const minBookingDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 5)
  return d.toISOString().slice(0, 10)
})

function shortenFileName(name) {
  if (name.length <= 30) return name
  const dot = name.lastIndexOf('.')
  const ext = dot > -1 ? name.slice(dot) : ''
  return name.slice(0, 15) + '...' + (ext.length < 8 ? ext : ext.slice(0, 8) + '...')
}

// ===== Notification Functions =====
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
  } catch (err) {
    // ไม่แจ้ง error
  }
}
// ===== /Notification Functions =====

onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)

  // เซ็ต loginStudentId ให้เป็นรหัสนักศึกษา/พนักงานที่ login
  if (studentId.value) {
    loginStudentId.value = studentId.value
    proxyUserId.value = studentId.value
  } else if (userId.value) {
    loginStudentId.value = userId.value
    proxyUserId.value = userId.value
  } else {
    loginStudentId.value = 'รหัสผู้ใช้ระบบ'
    proxyUserId.value = ''
  }

  // สำหรับชื่อผู้ขอ (loginName)
  const storedRequester = localStorage.getItem('requesterName') || ''
  if (storedRequester) {
    formData.value.requester = storedRequester
    loginName.value = storedRequester
  } else if (userId.value) {
    try {
      const res = await axios.get(`${API_BASE}/api/user/${userId.value}`)
      if (res.data && res.data.name) {
        formData.value.requester = res.data.name
        loginName.value = res.data.name
      }
    } catch (error) {
      loginName.value = 'ชื่อผู้ใช้ระบบ'
    }
  } else {
    loginName.value = 'ชื่อผู้ใช้ระบบ'
  }

  // auto restore จาก session
  if (route.query.restore === 'true') {
    loadFormFromSession()
    loadFilesFromGlobal()

    if (!formData.value.building) {
      const storedBuilding = sessionStorage.getItem('fieldName') || localStorage.getItem('fieldName') || localStorage.getItem('buildingSelected')
      if (storedBuilding) formData.value.building = storedBuilding
    }
    if (!formData.value.zone) {
      const storedZone = sessionStorage.getItem('zone') || localStorage.getItem('zone') || localStorage.getItem('zoneSelected')
      if (storedZone) formData.value.zone = storedZone
    }
    if (route.query.fieldName) formData.value.building = route.query.fieldName
    if (route.query.zone) formData.value.zone = route.query.zone
    return
  }

  if (route.query.fieldName) formData.value.building = route.query.fieldName
  if (route.query.zone) formData.value.zone = route.query.zone
  if (!formData.value.building) {
    const storedBuilding = sessionStorage.getItem('fieldName') || localStorage.getItem('fieldName') || localStorage.getItem('buildingSelected')
    if (storedBuilding) formData.value.building = storedBuilding
  }
  if (!formData.value.zone) {
    const storedZone = sessionStorage.getItem('zone') || localStorage.getItem('zone') || localStorage.getItem('zoneSelected')
    if (storedZone) formData.value.zone = storedZone
  }

  try {
    const res = await axios.get(`${API_BASE}/api/information`)
    const uniqueUnits = [...new Set(res.data.map(item => item.unit))]
    agencyOptions.value = uniqueUnits
    if (!agencyOptions.value.includes('อื่นๆ')) agencyOptions.value.push('อื่นๆ')
  } catch (e) {
    agencyOptions.value = ['อื่นๆ']
  }

  loadFormFromSession()
  loadFilesFromGlobal()

  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
  document.removeEventListener('mousedown', handleClickOutside)
})

// เพิ่ม watch สำหรับ isProxyBooking (รหัสนศ/พนง)
watch(isProxyBooking, (val) => {
  if (!val) {
    proxyUserId.value = loginStudentId.value
  } else {
    proxyUserId.value = ''
  }
})

watch(formData, saveFormToSession, { deep: true })
watch(agencyInput, saveFormToSession)
watch(customAgency, saveFormToSession)
watch(otherAgencyDetail, saveFormToSession)
watch(proxyUserId, saveFormToSession)
watch(isProxyBooking, saveFormToSession)
watch(selectedFiles, () => {
  window._tempSelectedFiles = selectedFiles.value
  saveFormToSession()
}, { deep: true })

function saveFormToSession() {
  sessionStorage.setItem(
    'form_field_save',
    JSON.stringify({
      formData: formData.value,
      agencyInput: agencyInput.value,
      customAgency: customAgency.value,
      otherAgencyDetail: otherAgencyDetail.value,
      proxyUserId: proxyUserId.value,
      isProxyBooking: isProxyBooking.value,
      selectedFileNames: selectedFiles.value.map(f => f.name)
    })
  )
}

function loadFormFromSession() {
  const data = sessionStorage.getItem('form_field_save')
  if (data) {
    try {
      const d = JSON.parse(data)
      if (d.formData) Object.assign(formData.value, d.formData)
      agencyInput.value = d.agencyInput || ''
      customAgency.value = d.customAgency || ''
      otherAgencyDetail.value = d.otherAgencyDetail || ''
      proxyUserId.value = d.proxyUserId || ''
      isProxyBooking.value = d.isProxyBooking || false
      selectedFiles.value = (d.selectedFileNames || []).map(name => ({ name }))
    } catch (e) {
      sessionStorage.removeItem('form_field_save')
    }
  }
}

function loadFilesFromGlobal() {
  if (window._tempSelectedFiles && window._tempSelectedFiles.length > 0) {
    selectedFiles.value = window._tempSelectedFiles
  }
}

function handleFileChange(event) {
  selectedFiles.value = Array.from(event.target.files)
  window._tempSelectedFiles = selectedFiles.value
  fileError.value = selectedFiles.value.length === 0
  saveFormToSession()
}

function clearFiles() {
  selectedFiles.value = []
  window._tempSelectedFiles = []
  fileError.value = false
  setTimeout(() => {
    const fileInput = document.getElementById('fileUploadInput')
    if (fileInput) fileInput.value = ''
  }, 0)
}

function goBack() {
  saveFormToSession()
  window._tempSelectedFiles = selectedFiles.value
  router.push({ path: '/form_field_admin', query: { restore: 'true' } })
}

function inputClass(field) {
  if (
    field === 'requester'
    && showValidate.value
    && isProxyBooking.value
    && missingFields.value['requester']
  ) {
    return 'custom-input input-error'
  }
  if (showValidate.value && missingFields.value[field]) return 'custom-input input-error'
  if (field === 'files' && fileError.value) return 'input-error'
  return 'custom-input'
}

const finalAgency = computed(() => (agencyInput.value === 'อื่นๆ' ? customAgency.value : agencyInput.value))
function handleAgencyChange() {
  if (agencyInput.value !== 'อื่นๆ') {
    customAgency.value = ''
    otherAgencyDetail.value = ''
  }
}

const missingFields = ref({})
const showValidate = ref(false)

function validateFields() {
  const fields = {}
  const requiredFields = [
    'aw', 'date', 'tel', 'name_activity', 'reasons',
    'since', 'uptodate', 'since_time', 'until_thetime',
    'participants', 'building'
  ]
  requiredFields.forEach((k) => {
    if (!formData.value[k] || String(formData.value[k]).trim() === '') fields[k] = true
  })
  if (isProxyBooking.value) {
    if (!formData.value.requester || String(formData.value.requester).trim() === '') {
      fields['requester'] = true
    }
  }
  if (!finalAgency.value || String(finalAgency.value).trim() === '') fields['agency'] = true
  if (agencyInput.value === 'อื่นๆ' && (!customAgency.value || String(customAgency.value).trim() === ''))
    fields['agencyOther'] = true
  if (hasZone.value && (!formData.value.zone || String(formData.value.zone).trim() === '')) fields['zone'] = true
  if (formData.value.selectedUtility === 'ไฟฟ้า') {
    ['turnon_air', 'turnoff_air', 'turnon_lights', 'turnoff_lights'].forEach((k) => {
      if (!formData.value[k] || String(formData.value[k]).trim() === '') fields[k] = true
    })
  }
  if (!proxyUserId.value || String(proxyUserId.value).trim() === '') fields['userId'] = true
  if (selectedFiles.value.length === 0) {
    fields['files'] = true
    fileError.value = true
  } else {
    fileError.value = false
  }
  missingFields.value = fields
  return Object.keys(fields).length === 0
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = error => reject(error)
    reader.readAsDataURL(file)
  })
}

async function handleSubmit() {
  showValidate.value = true
  if (!validateFields()) {
    Swal.fire({
      icon: 'warning',
      title: 'กรอกข้อมูลไม่ครบถ้วน',
      text: 'กรุณากรอกข้อมูลให้ครบถ้วนและแนบไฟล์ก่อนดำเนินการต่อ',
      confirmButtonText: 'ตกลง'
    })
    return
  }
  try {
    localStorage.setItem('zoneSelected', formData.value.zone || '')
    const uploadFileIds = []
    for (const file of selectedFiles.value) {
      const base64 = await fileToBase64(file)
      const res = await axios.post(`${API_BASE}/api/upload_file`, {
        fileName: file.name,
        fileData: base64,
        user_id: proxyUserId.value
      })
      if (res.data && res.data.id) {
        uploadFileIds.push(res.data.id)
      }
    }
    const submitData = {
      ...formData.value,
      agency: finalAgency.value ?? '',
      agency_other_detail: otherAgencyDetail.value ?? '',
      user_id: proxyUserId.value ?? '',
      uploadFiles: uploadFileIds
    }
    const bookingRes = await axios.post(`${API_BASE}/api/booking_field`, submitData)
    localStorage.setItem('bookingId', bookingRes.data.bookingId)
    router.push('/form_field_admin3')
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      console.error('Upload Error:', err.response.data.message)
    }
    Swal.fire({
      icon: 'error',
      title: 'ผิดพลาด',
      text: 'บันทึกข้อมูลไม่สำเร็จ',
      confirmButtonText: 'ตกลง'
    })
    console.error(err)
  }
}

function handleClear() {
  sessionStorage.removeItem('form_field_save')
  const keepBuilding = formData.value.building
  const keepZone = formData.value.zone
  const keepRequester = formData.value.requester
  const keepProxyUserId = proxyUserId.value

  formData.value = {
    aw: '', date: '', tel: '', name_activity: '', reasons: '',
    since: '', uptodate: '', since_time: '', until_thetime: '', participants: '',
    requester: keepRequester,
    building: keepBuilding,
    zone: keepZone,
    selectedUtility: '', turnon_air: '', turnoff_air: '', turnon_lights: '',
    turnoff_lights: '', other: '', amphitheater: '', equipment: ''
  }
  proxyUserId.value = keepProxyUserId

  selectedFiles.value = []
  window._tempSelectedFiles = []
  fileError.value = false

  setTimeout(() => {
    const fileInput = document.getElementById('fileUploadInput')
    if (fileInput) fileInput.value = ''
  }, 0)
}

async function goStep(targetStep) {
  saveFormToSession()
  window._tempSelectedFiles = selectedFiles.value
  if (targetStep === currentStep) return

  // ไม่อนุญาตข้ามข้าม step! (1 → 3 หรือ 1 → 4) ต้องไป step2 ก่อนเสมอ
  if (targetStep === 2 && currentStep === 0) {
    Swal.fire({
      icon: 'info',
      title: 'โปรดดำเนินการทีละขั้นตอน',
      text: 'กรุณายืนยันข้อมูลก่อนข้ามไปขั้นตอนสุดท้าย',
      confirmButtonText: 'ตกลง'
    })
    return
  }
  
  // ไป step1 (กลับไปแก้ไข) ให้ restore form
  if (targetStep === 0) {
    router.push({ path: stepRoutes[0], query: { restore: 'true' } })
    return
  }
  
  // ถ้าไป step2 (form_field3) — validate ก่อน!
  if (targetStep === 1) {
    showValidate.value = true
    if (!validateFields()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรอกข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนข้ามไปขั้นตอนถัดไป',
        confirmButtonText: 'ตกลง'
      })
      return
    }

    try {
      const uploadFileIds = []
      for (const file of selectedFiles.value) {
        const base64 = await fileToBase64(file)
        const res = await axios.post(`${API_BASE}/api/upload_file`, {
          fileName: file.name,
          fileData: base64,
          user_id: proxyUserId.value
        })
        if (res.data && res.data.id) {
          uploadFileIds.push(res.data.id)
        }
      }
      const submitData = {
        ...formData.value,
        agency: finalAgency.value ?? '',
        agency_other_detail: otherAgencyDetail.value ?? '',
        user_id: proxyUserId.value ?? '',
        uploadFiles: uploadFileIds
      }
      const bookingRes = await axios.post(`${API_BASE}/api/booking_field`, submitData)
      localStorage.setItem('bookingId', bookingRes.data.bookingId)

      router.push(stepRoutes[1])
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ผิดพลาด',
        text: 'บันทึกข้อมูลไม่สำเร็จ',
        confirmButtonText: 'ตกลง'
      })
      console.error(err)
    }
    return
  }

  // ป้องกันข้ามไป step 3 (form_field4) ตรง ๆ จาก stepper
}

// ปิด/ล้างไฟล์แนบเมื่อออกจากฟอร์ม
onBeforeRouteLeave((to, from, next) => {
  if (to.path !== '/form_field_admin' && to.path !== '/form_field_admin3') {
    selectedFiles.value = []
    window._tempSelectedFiles = []
    sessionStorage.removeItem('form_field_save')

    setTimeout(() => {
      const fileInput = document.getElementById('fileUploadInput')
      if (fileInput) fileInput.value = ''
    }, 0)
  }
  next()
})

</script>











<style scoped>
.flex-row {
  display: flex;
  gap: 32px;
  width: 100%;
  align-items: flex-end;
}
.flex-item {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
}
@media (max-width: 900px) {
  .flex-row {
    flex-direction: column;
    gap: 18px;
  }
}
.layout {
  background: #e7f2fb;
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
}
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
  max-width: 900px;
  overflow-wrap: break-word;
}
.form-header {
  text-align: center;
  margin-bottom: 20px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 40px;
  margin-top: 30px;
}
.form-row {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.form-row label {
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 14px;
}
@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}
.custom-input {
  padding: 10px 14px;
  font-size: 14px;
  border: 2px solid #94a3b8;
  border-radius: 8px;
  background-color: #f9fafb;
  transition: border 0.3s ease;
  word-break: break-word;
}
.custom-input:focus {
  outline: none;
  border-color: #3b82f6;
  background-color: #fff;
}
.input-error {
  border-color: #ff4747 !important;
  background-color: #fff0f0 !important;
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
.custom-textarea:focus {
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
.button-wrapper {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin: 20px auto 0 auto;
  width: 90%;
  max-width: 900px;
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
#btnNext:disabled {
  background-color: #b6b6b6;
  color: #fff;
  cursor: not-allowed;
}
.clear-btn {
  padding: 0.5rem 1rem;
  background-color: #fff;
  color: #048ace;
  border: 2px solid #048ace;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.clear-btn:hover {
  background-color: #d2f2ff;
}
.proxy-checkbox-row-under {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 2px;
  margin-left: 2px;
}
.proxy-checkbox-label-under {
  font-size: 12px;
  color: #555;
  margin-left: 2px;
  font-weight: normal;
}
.input-error-message {
  color: #ff4747;
  font-size: 12px;
  margin-top: 2px;
}
.file-upload-wrapper {
  width: 50;
  display: flex;
  align-items: center;
}
.custom-file-label {
  display: flex;
  align-items: center;
  border: 2px solid #94a3b8;
  border-radius: 8px;
  background-color: #f9fafb;
  width: 48%;
  padding: 0;
  min-height: 40px;
  cursor: pointer;
  transition: border 0.3s;
  font-size: 14px;
}
.custom-file-label:focus-within,
.custom-file-label:hover {
  border-color: #3b82f6;
  background-color: #fff;
}
.custom-file-button {
  background: #048ace;
  color: #fff;
  border: none;
  padding: 6px 18px;
  border-radius: 8px 0 0 8px;
  font-size: 11px;
  cursor: pointer;
  margin-right: 10px;
  transition: background 0.2s;
}
.custom-file-label:active .custom-file-button,
.custom-file-label:hover .custom-file-button {
  background: #0366a4;
}
.custom-file-name {
  flex: 1;
  color: #555;
  font-size: 13px;
  padding-right: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 250px;
}
.attached-files-list {
  margin-top: 6px;
  padding-left: 20px;
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #f9fafb;
}
.attached-file-item {
  font-size: 13px;
  color: #333;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}
.attached-file-item:last-child {
  border-bottom: none;
}
.note-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  margin-left: 4px;
  font-style: italic;
}
.clear-files-btn {
  margin-top: 8px;
  background-color: #f44336;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.clear-files-btn:hover {
  background-color: #d32f2f;
}
.custom-file-label {
  width: 100%;
  min-height: 40px;
  border: none !important;
  background: none !important;
  box-shadow: none !important;
}
</style>

<style>
@import '../css/style.css';
</style>


  