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
<div class="headStepper" role="navigation" aria-label="ขั้นตอน">
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
<!-- spacer กันเนื้อหาโดนทับ (ถูกซ่อนไว้ใน CSS) -->
<div class="headStepper-spacer"></div>


      <div class="scroll-x-container">
        <div class="form-container">
          <div class="form-header">
            <h3>แบบฟอร์มการยืมอุปกรณ์ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h3>
            <p><b>โทร: 0-5391-7820 และ 0-5391-7821 | E-mail: sport-complex@mfu.ac.th</b></p>
          </div>

          <div class="form-grid">
            <!-- Name -->
            <div class="form-row">
              <label>
                ชื่อ-นามสกุล
                <span v-if="touched && (showError && !username_form)" style="color:red">*</span>
              </label>
              <input
                type="text"
                class="custom-input"
                v-model="form.username_form"
                :class="{ 'is-invalid': touched && showError && !form.username_form }"
                :readonly="false"
              />
            </div>

           <!-- Student ID -->
<div class="form-row">
  <label>
    รหัสนักศึกษา/รหัสพนักงาน
    <span v-if="touched && (showError && !id_form)" style="color:red">*</span>
  </label>

  <input
    type="text"
    class="custom-input"
    v-model="form.id_form"
    :class="{
      'is-invalid':
        touched &&
        (showError && (!form.id_form || form.id_form.length !== requiredIdLen))
    }"
    :readonly="false"
    inputmode="numeric"
    pattern="\d*"
    :maxlength="requiredIdLen"
    @input="onIdInput"
  />

  <small class="note-text">
    ต้องเป็นตัวเลข {{ requiredIdLen }} หลัก
    <span v-if="emailDomain === 'lamduan'">(บัญชี @lamduan.mfu.ac.th)</span>
    <span v-else-if="emailDomain === 'mfu'">(บัญชี @mfu.ac.th)</span>
  </small>
</div>

            <!-- Agency -->
            <div class="form-row" style="position:relative;">
              <label>
                ชื่อหน่วยงาน/สำนักวิชา
                <span v-if="touched && (showError && !agencyInput)" style="color:red">*</span>
              </label>
              <input
                ref="agencyInputEl"
                class="custom-input"
                type="text"
                v-model="agencySearch"
                @click="maybeEnterEdit"
                @input="filterAgency"
                @focus="onAgencyFocus"
                @blur="onAgencyBlur"
                :readonly="isFormLocked || (isAgencySelected && !!agencyInput && !isAgencyEditing)"
                placeholder="ค้นหาหรือเลือกหน่วยงาน"
                autocomplete="off"
                :class="{ 'is-invalid': touched && showError && !agencyInput }"
                style="flex:1"
              />

              <ul v-if="agencyDropdownOpen && filteredAgencyOptions.length" class="agency-dropdown">
                <li
                  v-for="option in filteredAgencyOptions"
                  :key="option"
                  @mousedown.prevent="selectAgency(option)"
                  style="cursor:pointer;padding:7px 16px;"
                >{{ option }}</li>
              </ul>
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

            <!-- Phone -->
            <div class="form-row">
              <label>
                เบอร์โทรติดต่อ
                <span v-if="touched && (showError && !form.number)" style="color:red">*</span>
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
                :class="{ 'is-invalid': touched && (showError && !form.number) }"
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
    maxlength="100"
    placeholder="กรอกเหตุผลในการขอใช้"
  ></textarea>
  <small class="char-counter">{{ reasonCount }}/{{ MAX_REASON }} ตัวอักษร</small>
</div>

<!-- Location -->
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
    maxlength="100"
    placeholder="กรอกสถานที่ใช้งาน"
  ></textarea>
  <small class="char-counter">{{ locationCount }}/{{ MAX_LOCATION }} ตัวอักษร</small>
</div>


            <!-- ====== ช่วงวันที่ (แบบโรงแรม – เดือนเดียว) ====== -->
            <div class="form-row date-range-row">
              <label>
                ช่วงวันที่
                <span v-if="touched && (showError && (!form.start_date || !form.end_date))" style="color:red">*</span>
              </label>

              <VueDatePicker
                v-model="dpRange"
                range
                :multi-calendars="false"
                :auto-apply="true"
                :enable-time-picker="false"
                :partial-range="false"
                :min-date="minStartDate"
                :format="formatRangeBE"
                locale="th"
                :hide-input-icon="true"
                placeholder="วัน/เดือน/ปี"
              />

    
            </div>

            <!-- วันที่และเวลาที่มารับของ -->
            <div class="form-row date-range-row">
              <label>วันที่และเวลาที่มารับของ</label>
              <div class="date-range-group" style="gap:8px; width:100%">
                <!-- วันที่รับของ -->
                <div
                  :class="{ 'is-invalid-date': touched && showError && !form.receive_date }"
                  style="width:48%"
                >
                  <VueDatePicker
                    v-model="dpReceive"
                    :format="formatBE"
                    :enable-time-picker="false"
                    :min-date="receiveMinDate"
                    :max-date="dpRangeEnd || null"
                    :disabled="!form.start_date || !form.end_date || isFormLocked"
                    placeholder="วัน/เดือน/ปี"
                    locale="th"
                    :hide-input-icon="true"
                  />
                </div>

                <span>-</span>

                <!-- เวลา -->
                <input
                  type="time"
                  v-model="form.receive_time"
                  class="custom-input"
                  :class="{ 'is-invalid': touched && showError && !form.receive_time }"
                  :readonly="isFormLocked"
                  :disabled="!form.start_date || !form.end_date || isFormLocked"
                  style="width:48%;"
                />
              </div>
            </div>

            <!-- แนบไฟล์ -->
            <div class="form-row">
              <label>
                แนบไฟล์ (รายละเอียดโครงการ)
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
                    ไม่บังคับแนบไฟล์
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

            <!-- Equipment cart title -->
            <div class="form-section-title">รายการอุปกรณ์</div>
          </div>

          <!-- Equipment table -->
          <div class="equipment-table-wrapper">
            <table class="equipment-table">
              <thead>
                <tr>
                  <th style="width:40%">ชื่ออุปกรณ์</th>
                  <th style="width:20%">จำนวน</th>
                  <th style="width:40%">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(qty, name) in cartMap" :key="name">
                  <td>{{ name }}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      :max="findMaxAmount(name)"
                      class="equipment-amount-input"
                      v-model.number="selectedQuantities[name]"
                      placeholder="จำนวน"
                      :disabled="isFormLocked"
                      :class="{ 'is-invalid': touched && showError && (!selectedQuantities[name] || selectedQuantities[name] <= 0) }"
                      style="width: 60px;"
                    />
                  </td>
                  <td>
                    <input
  type="text"
  class="equipment-remark-input"
  v-model="equipmentRemarks[name]"
  :readonly="isFormLocked"
  placeholder="หมายเหตุ"
  maxlength="50"
  style="width: 100%;"
/>

                  </td>
                </tr>
                <tr v-if="Object.keys(cartMap).length === 0">
                  <td colspan="3" style="text-align: center; color: #888;">ไม่มีรายการ</td>
                </tr>
              </tbody>
            </table>
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
            Tel: 0-5391-7820 and 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a>
            |
            Email:
            <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
          <p>© 2025 Center for Information Technology Services, Mae Fah Luang University. All rights reserved.</p>
        </div>
      </footer>
    </div> <!-- /.main -->
  </div> <!-- /.layout -->
</template>
<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import axios from 'axios'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import Swal from 'sweetalert2'

import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import dayjs from 'dayjs'

// ==== ตัวแปรชั่วคราวไฟล์ (ระดับ window) ====
if (!window._equipTempFiles) window._equipTempFiles = []  // File[] จริง
const API_BASE = import.meta.env.VITE_API_BASE
const products = ref([])
const router = useRouter()
const route = useRoute()
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const currentStep = ref(0)
const isSidebarClosed = ref(false)
const today = new Date().toISOString().split('T')[0]
const LS_FORM_KEY = 'equipmentFormData'
const isFormLocked = ref(false)
const selectedFiles = ref([])
const fileError = ref(false)
const agencySearch = ref('')
const agencyDropdownOpen = ref(false)
const agencyInputEl = ref(null)
const isAgencyEditing = ref(false)
const fileUploadInput = ref(null)

const MAX_REASON = 100
const MAX_LOCATION = 100

const reasonCount   = computed(() => (form.reason   || '').length)
const locationCount = computed(() => (form.location || '').length)

/* ===== Date variables ===== */
const dpRange = ref(null)     // [Date, Date] | null
const dpReceive = ref(null)   // Date | null

const lastSeenTimestamp = ref(parseInt(localStorage.getItem('lastSeenTimestamp') || '0'))

// จำกัดขนาดไฟล์
const MAX_FILE_SIZE = 100 * 1024 * 1024
const MAX_TOTAL_SIZE = 100 * 1024 * 1024

function fileExt(name='') {
  return (name.split('.').pop() || '').toLowerCase()
}

function pruneOldNotifications() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

function makePreviewRecord(file) {
  const url = URL.createObjectURL(file)
  return { name: file.name, size: file.size, type: file.type, url, ext: fileExt(file.name) }
}

function revokePreview(record) {
  try { record?.url && URL.revokeObjectURL(record.url) } catch {}
}

function maybeEnterEdit() {
  if (isFormLocked.value) return
  if (isAgencySelected.value && !isAgencyEditing.value) {
    isAgencyEditing.value = true
    agencyDropdownOpen.value = true
    agencySearch.value = ''
    nextTick(() => agencyInputEl.value?.focus())
  }
}

const filteredAgencyOptions = computed(() => {
  const search = agencySearch.value.trim().toLowerCase()
  if (!search) return agencyOptions.value
  return agencyOptions.value.filter(option =>
    option.toLowerCase().includes(search)
  )
})

function filterAgency() {
  agencyDropdownOpen.value = true
  isAgencyEditing.value = true
}

function onAgencyFocus() {
  isAgencyEditing.value = true
  agencyDropdownOpen.value = true
  if (isAgencySelected.value) {
    agencySearch.value = ''
  }
}

function selectAgency(option) {
  agencyInput.value = option
  agencySearch.value = option
  agencyDropdownOpen.value = false
  isAgencyEditing.value = false
  handleAgencyChange()
}

function onAgencyBlur() {
  setTimeout(() => {
    agencyDropdownOpen.value = false
    isAgencyEditing.value = false
  }, 180)
}

/* ========= กติกาความยาวรหัสตามโดเมนอีเมล =========
   - @lamduan.mfu.ac.th  => รหัสนักศึกษา 10 หลัก
   - @mfu.ac.th          => รหัสพนักงาน   8 หลัก
*/
const userEmail = ref('')  // จะตั้งค่าจาก API ผู้ใช้ใน onMounted
const emailDomain = computed(() => {
  const s = (userEmail.value || '').toLowerCase()
  if (s.endsWith('@lamduan.mfu.ac.th')) return 'lamduan'
  if (s.endsWith('@mfu.ac.th')) return 'mfu'
  return '' // โดเมนอื่น ๆ (กรณีไม่ตรงสองแบบนี้)
})
const requiredIdLen = computed(() => (emailDomain.value === 'lamduan' ? 10 : 8))

function onIdInput(e) {
  // รับเฉพาะตัวเลข และจำกัดตาม requiredIdLen
  let digits = e.target.value.replace(/\D/g, '').slice(0, requiredIdLen.value)
  form.id_form = digits
}

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
  username_form: '',
  id_form: '',
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

function safeDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d) ? null : d
}

/* ====== Formatters ====== */
function formatBE(date) {
  if (!date) return ''
  const y = date.getFullYear() + 543
  const m = String(date.getMonth() + 1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${d}/${m}/${y}`
}

function formatRangeBE(value) {
  if (Array.isArray(value)) {
    const [s, e] = value
    if (s && e) return `${formatBE(s)} - ${formatBE(e)}`
    if (s) return `${formatBE(s)}`
    return ''
  }
  return formatBE(value)
}

function toISO(date) {
  if (!date || isNaN(date)) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
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

/* ===== บังคับจองล่วงหน้าอย่างน้อย 5 วัน ===== */
const minStartDate = ref(new Date())
 minStartDate.value.setHours(0,0,0,0)

/* dpRange helpers */
const dpRangeStart = computed(() =>
  Array.isArray(dpRange.value) ? dpRange.value[0] || null : null
)
const dpRangeEnd = computed(() =>
  Array.isArray(dpRange.value) ? dpRange.value[1] || null : null
)

/* วันที่รับของอย่างน้อยคือวันเริ่ม (ถ้าเลือกแล้ว) มิฉะนั้นคือ minStartDate */
const receiveMinDate = computed(() => {
  return (dpRangeStart.value && !isNaN(dpRangeStart.value))
    ? dpRangeStart.value
    : minStartDate.value
})

function validateFields() {
  const fields = {}
  if (!form.name) fields['name'] = true
  if (!form.user_id) fields['user_id'] = true
  if (!agencyInput.value || String(agencyInput.value).trim() === "") fields['agency'] = true
  if (agencyInput.value === 'อื่นๆ' && (!customAgency.value || String(customAgency.value).trim() === "")) fields['agencyOther'] = true
  if (!form.number) fields['number'] = true
  if (!form.reason) fields['reason'] = true
  if (!form.location) fields['location'] = true
  if (!form.start_date) fields['start_date'] = true
  if (!form.end_date) fields['end_date'] = true
  if (!form.receive_date) fields['receive_date'] = true
  if (!form.receive_time) fields['receive_time'] = true

  if (!form.username_form) fields['username_form'] = true

  // ✅ บังคับความยาวรหัสตามโดเมนอีเมลผู้ใช้:
  //    lamduan.mfu.ac.th -> 10 หลัก (นักศึกษา)
  //    mfu.ac.th         -> 8 หลัก (พนักงาน)
  if (!form.id_form || form.id_form.length !== requiredIdLen.value) {
    fields['id_form'] = true
  }

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

function loadUploadedFiles() {
  const files = Array.isArray(window._equipTempFiles) ? window._equipTempFiles : []
  selectedFiles.value.forEach(revokePreview)
  selectedFiles.value = files.map(makePreviewRecord)
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

// ลบฟังก์ชัน canStepTo ทั้งหมด

// แทน goStep ด้วยอันนี้
async function goStep(targetStep) {
  // บันทึก/รักษาไฟล์แนบชั่วคราวไว้เหมือนเดิม (ถ้าต้องการ)
  if (targetStep === currentStep.value) return

  // กันกดข้ามไปสำเร็จเลยจาก step แรก
  if (targetStep === 2 && currentStep.value === 0) {
    Swal.fire({
      icon: 'info',
      title: 'โปรดดำเนินการทีละขั้นตอน',
      text: 'กรุณายืนยันข้อมูลก่อนข้ามไปขั้นตอนสุดท้าย',
      confirmButtonText: 'ตกลง'
    })
    return
  }

  if (targetStep === 0) {
    router.push('/form_equipment')
    return
  }

  if (targetStep === 1) {
    // ทำเหมือนกด Next: validate ก่อน แล้วค่อย submit/route ไปหน้าถัดไป
    touched.value = true
    if (!validateFields() || !validateBeforeSubmit()) {
      Swal.fire('กรุณากรอกข้อมูลให้ครบถ้วน', '', 'warning')
      return
    }
    await submitBooking() // จะ push ไป /form_equipment3 เองเมื่อสำเร็จ
    return
  }
}


function closeNotifications() {
  showNotifications.value = false
}

async function submitBooking() {
  touched.value = true
 if (!validateFields()) {
  Swal.fire('กรุณากรอกข้อมูลให้ครบถ้วน', '', 'warning')
  return
 }

  const items = Object.entries(selectedQuantities).map(([name, amount]) => ({
    item_name: name,
    amount: amount,
    remark: equipmentRemarks[name] || ""
  }))

  const bookingPayload = {
    ...form,
    username_form: form.username_form,
    id_form: form.id_form,
    agency: agencyInput.value === 'อื่นๆ' ? customAgency.value : agencyInput.value,
    agency_detail: otherAgencyDetail.value || '',
    items
  }

  try {
    const res = await axios.post(`${API_BASE}/api/booking_equipment`, bookingPayload)
    const booking = res.data?.booking || res.data
    // ✅ ล้างข้อมูล auto-save เก่าหลังส่งสำเร็จ
localStorage.removeItem('equipmentFormData')

    localStorage.setItem('equipmentFormData', JSON.stringify({
      form: {
        ...form,
        agency: bookingPayload.agency,
        agency_detail: bookingPayload.agency_detail,
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
    pruneOldNotifications()

    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const targetStatuses = ['approved', 'disapproved', 'cancel', 'canceled', 'returned']

    const newNotis = (res.data || []).filter(item =>
      targetStatuses.includes((item.status || '').toLowerCase()) &&
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
      pruneOldNotifications()
    }

    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch (err) {
    // ignore
  }
}

let polling = null

onMounted(async () => {
  lastSeenTimestamp.value = parseInt(localStorage.getItem('lastSeenTimestamp') || '0')

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

  // โหลดตะกร้าจากพารามิเตอร์ (ถ้ามี)
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

  // โหลดข้อมูลผู้ใช้ และดึงอีเมลเพื่อกำหนดความยาวรหัสตามโดเมน
  form.user_id = localStorage.getItem('user_id') || ''
  if (form.user_id) {
    try {
      const resUser = await axios.get(`${API_BASE}/api/users/${form.user_id}`)
      form.name = resUser.data.name || ''
      userEmail.value = resUser.data.email || ''   // ใช้ตัดสินโดเมน lamduan/mfu
    } catch (err) {
      console.error('โหลดชื่อผู้ใช้ไม่สำเร็จ', err)
    }
  }
// ✅ ตั้งค่าวันเริ่มต้นเริ่มที่วันนี้เฉพาะตอนยังไม่เคยกรอกเท่านั้น
if (!form.start_date || !form.end_date) {
  const today = new Date()
  dpRange.value = [today, today]
  form.start_date = toISO(today)
  form.end_date = toISO(today)
}

  // เซ็ตค่าเริ่มต้นของปฏิทินจากค่าใน form (ถ้ามี)
  const s = safeDate(form.start_date)
  const e = safeDate(form.end_date)
  dpRange.value = s && e ? [s, e] : null
  dpReceive.value = safeDate(form.receive_date)

  fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  await loadCart()
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
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
  selectedFiles.value.forEach(revokePreview)
  selectedFiles.value = []
  window._equipTempFiles = []
  localStorage.removeItem('equipment_upload_file')
  if (fileUploadInput.value) fileUploadInput.value.value = ''
  touched.value = false
  showError.value = false
  dpRange.value = null
  dpReceive.value = null
}

function removeFile(idx) {
  if (!Array.isArray(window._equipTempFiles)) window._equipTempFiles = []
  revokePreview(selectedFiles.value[idx])
  window._equipTempFiles.splice(idx, 1)
  selectedFiles.value.splice(idx, 1)
  fileError.value = selectedFiles.value.length === 0
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}

async function handleFileChange(e) {
  const allowed = [".png",".jpg",".jpeg",".pdf",".xls",".xlsx",".doc",".docx"]
  const inputFiles = Array.from(e.target.files || [])
  let valid = inputFiles.filter(f => allowed.some(ext => f.name.toLowerCase().endsWith(ext)))
  if (valid.length !== inputFiles.length) {
    Swal.fire('รองรับเฉพาะไฟล์ .png, .jpg, .jpeg, .pdf, .xls, .xlsx, .doc, .docx', '', 'warning')
  }

  const overs = valid.filter(f => f.size > MAX_FILE_SIZE)
  if (overs.length) {
    Swal.fire({
      icon: 'warning',
      title: 'ไฟล์ใหญ่เกินกำหนด',
      html: overs.map(f => `${f.name} (${Math.round(f.size/1024/1024)}MB)`).join('<br>') +
            `<br>เพดานไฟล์ละ ${Math.round(MAX_FILE_SIZE/1024/1024)}MB`,
    })
  }
  valid = valid.filter(f => f.size <= MAX_FILE_SIZE)

  const total = valid.reduce((s, f) => s + f.size, 0)
  if (total > MAX_TOTAL_SIZE) {
    Swal.fire({
      icon: 'warning',
      title: 'ขนาดรวมไฟล์เกินกำหนด',
      text: `รวม ${Math.round(total/1024/1024)}MB (เพดาน ${Math.round(MAX_TOTAL_SIZE/1024/1024)}MB)`,
    })
    valid = []
  }

  window._equipTempFiles = valid

  selectedFiles.value.forEach(revokePreview)
  selectedFiles.value = valid.map(makePreviewRecord)

  fileError.value = selectedFiles.value.length === 0

  if (fileUploadInput.value) fileUploadInput.value.value = ''
}

function previewFile(file) {
  if (["png","jpg","jpeg","pdf"].includes(file.ext)) {
    window.open(file.url, '_blank', 'noopener')
    return
  }
  const a = document.createElement('a')
  a.href = file.url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function openFilePreview(dataUrl, ext, fileName) {
  if (["png", "jpg", "jpeg"].includes(ext)) {
    const w = window.open()
    w.document.write(`<img src="${dataUrl}" style="max-width:95vw;max-height:95vh;display:block;margin:auto"/>`)
  } else if (ext === "pdf") {
    const w = window.open()
    w.document.write(`<iframe src="${dataUrl}" width="100%" height="100%" style="border:0;min-height:95vh"></iframe>`)
  } else {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = fileName
    a.click()
  }
}

/* ออกจากหน้าฟอร์ม -> ล้างรายการไฟล์ชั่วคราว */
const FORM_ROUTES = [
  '/form_equipment',
  '/form_equipment3',
  '/form_equipment4'
]
onBeforeRouteLeave((to, from, next) => {
  try {
    if (!FORM_ROUTES.includes(to.path)) {
      selectedFiles.value.forEach(revokePreview)
      selectedFiles.value = []
      fileError.value = false
      window._equipTempFiles = []
      localStorage.removeItem('equipment_upload_file')
      if (fileUploadInput.value) fileUploadInput.value.value = ''
    }
  } catch (e) {
    console.error('leave guard error:', e)
  } finally {
    next()
  }
})

/* ===== Auto-save ===== */
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

watch(agencyInput, (v) => { agencySearch.value = v || '' })
watch(agencySearch, (v) => {
  if (v !== agencyInput.value && agencyOptions.value.includes(v)) {
    agencyInput.value = v
  }
})

watch(dpRange, (val) => {
  if (Array.isArray(val) && val[0] && val[1]) {
    const start = toISO(val[0])
    const end   = toISO(val[1])

    if (start === end) {
      Swal.fire({
  icon: 'warning',
  title: 'ไม่อนุญาตให้จองวันเดียว',
  html: '<div style="text-align:center;">กรุณาเลือกช่วงวันที่อย่างน้อย 2 วัน</div>',
  confirmButtonText: 'ตกลง'
})

      // reset ค่ากลับไป
      dpRange.value = null
      form.start_date = ''
      form.end_date   = ''
      return
    }

    form.start_date = start
    form.end_date   = end
  } else {
    form.start_date = ''
    form.end_date   = ''
  }
})


watch(dpReceive, (d) => {
  form.receive_date = (!d || isNaN(d)) ? '' : toISO(d)
})
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, .1);
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 20px 52px;
  border-radius: 20px;
}

.headStepper-spacer{ display:none; }

.main{
  padding-top: var(--topbar-h);
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
.circle.active { background-color: #ff4d4f; }
.circle.completed { background-color: #ff4d4f; opacity: 0.5; }
.label{
  position: absolute;
  top: 45px;
  left: 15px;
  transform: translateX(-50%);
  font-size: 12px;
  white-space: nowrap;
  text-align: center;
}
.line {
  height: 4px;
  width: 80px;
  background-color: #ccc;
  margin: 0 5px;
  z-index: 0;
  transition: background 0.3s;
}
.line.filled { background-color: #ff4d4f; }
/* วางเพิ่มไว้ใน <style scoped> ของ form_equipment */
.layout{
  background: #e7f2fb;
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
}

/* ใช้ตัวแปรระยะห่างด้านบนแบบเดียวกัน */
:root{
  --topbar-h: 64px;
  --subbar-h: 0px;
  --gap: 12px;
}

.main{
  padding-top: calc(var(--topbar-h));
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
.form-header { text-align: center; margin-bottom: 20px; }

.form-row { display: flex; flex-direction: column; }
.form-row label { font-weight: bold; margin-bottom: 6px; font-size: 14px; }

.custom-input {
  padding: 10px 14px;
  font-size: 14px;
  border: 2px solid #94a3b8;
  border-radius: 8px;
  background-color: #f9fafb;
  transition: border 0.3s ease;
}
.custom-input:focus { outline: none; border-color: #3b82f6; background-color: #fff; }

.form-section-title { grid-column: span 2; font-weight: bold; margin-top: 20px; font-size: 16px; }

.equipment-list { grid-column: span 2; margin-bottom: 10px; }

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
.button-wrapper { display: flex; justify-content: flex-end; margin: 20px auto 0 auto; width: 90%; max-width: 900px; }
.is-invalid { border-color: #ef4444 !important; background: #ffeaea !important; }

/* ============ ปุ่มแนบไฟล์ ============= */
.file-upload-wrapper { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; width: 100%; }
.file-upload-header { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; width: 100%; }
.accepted-file-info { font-size: 12px; color: #888; font-style: italic; font-family: inherit; user-select: none; white-space: nowrap; }

.custom-file-list { display: block; margin: 6px 0 0 0; width: 100%; }
.file-list-item { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }

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
  display: flex; align-items: center; justify-content: center;
  white-space: nowrap;
  margin-right: 6px;
  transition: background 0.2s;
}
.custom-file-button:hover { background: #1976d2 !important; }

.custom-file-name { color: #333; min-width: 100px; font-size: 15px; margin-left: 0; }
.file-link { color: #1976d2; text-decoration: underline; cursor: pointer; font-size: 14px; word-break: break-all; }
.file-link:hover { color: #ff4d4f; }
.remove-file-btn { background: #ef4444; color: #fff; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 1em; }
.remove-file-btn:hover { background: #c82333; }

#btnReset { background-color: #ff7070; color: white; margin-right: 12px; border: none; border-radius: 6px; padding: 0.5rem 1rem; cursor: pointer; }
#btnReset:hover { background-color: #ff4d4d; }

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

/* ===== Notification dropdown ===== */
.notification-dropdown { position: absolute; right: 0; top: 38px; background: #fff; border-radius: 18px 0 18px 18px;
  box-shadow: 0 8px 24px 0 rgba(27, 50, 98, 0.14), 0 2px 4px 0 rgba(33, 125, 215, 0.06);
  min-width: 330px; max-width: 370px; max-height: 420px; overflow-y: auto; z-index: 1002; padding: 0; border: none; animation: fadeDown 0.22s; }
@keyframes fadeDown { 0% { opacity: 0; transform: translateY(-24px);} 100% { opacity: 1; transform: translateY(0);} }
.notification-dropdown ul { padding: 0; margin: 0; list-style: none; }
.notification-dropdown li { background: linear-gradient(90deg, #f6fafd 88%, #e2e7f3 100%); margin: 0.2em 0.8em; padding: 0.85em 1.1em;
  border-radius: 12px; border: none; font-size: 1.07rem; font-weight: 500; color: #1e2c48; box-shadow: 0 2px 8px 0 rgba(85, 131, 255, 0.06);
  display: flex; align-items: flex-start; gap: 10px; position: relative; cursor: default; transition: background 0.2s; }
.notification-dropdown li:not(:last-child) { margin-bottom: 0.15em; }
.notification-dropdown li::before { content: "🔔"; font-size: 1.2em; margin-right: 7px; color: #1976d2; opacity: 0.80; }
.notification-dropdown li.no-noti { background: #f2f3f6; color: #a7aab7; justify-content: center; font-style: italic; }
.notification-dropdown::-webkit-scrollbar { width: 7px; }
.notification-dropdown::-webkit-scrollbar-thumb { background: #e1e7f5; border-radius: 10px; }
.notification-dropdown::-webkit-scrollbar-track { background: transparent; }
.notification-item.approved { background: linear-gradient(90deg, #e9fbe7 85%, #cbffdb 100%); border-left: 4px solid #38b000; color: #228c22; }
.notification-item.disapproved { background: linear-gradient(90deg, #ffeaea 85%, #ffd6d6 100%); border-left: 4px solid #ff6060; color: #b91423; }
.notification-item.canceled, .notification-item.cancel { background: linear-gradient(90deg, #f9d7d7 80%, #e26a6a 100%); border-left: 4px solid #bb2124; color: #91061a; }
.notification-item.returned { background: linear-gradient(90deg, #e0f0ff 85%, #b6e0ff 100%); border-left: 4px solid #1976d2; color: #1976d2; }

.badge { background-color: red; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.75rem; vertical-align: top; margin-left: 4px; }

.date-range-row .date-range-group { display: flex; align-items: center; width: 100%; }

.note-text { font-size: 12px; color: #666; margin-top: 4px; margin-left: 4px; font-style: italic; }

.agency-dropdown { position: absolute; top: 54px; left: 0; right: 0; z-index: 11; background: #fff; border: 1.5px solid #ddd; border-radius: 8px;
  max-height: 170px; overflow-y: auto; box-shadow: 0 4px 16px rgba(0,0,0,0.09); margin-top: 0.2em; padding: 0; list-style: none; }
.agency-dropdown li:hover { background: #f5f7fa; }

.equipment-table-wrapper { width: 100%; overflow-x: auto; margin-bottom: 10px; }
.equipment-table { width: 100%; border-collapse: collapse; margin-top: 10px; background: #f9fafb; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
.equipment-table th, .equipment-table td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 15px; text-align: left; background: #fff; }
.equipment-table th { background: #d8dfe6; font-weight: 600; }
.equipment-table input { padding: 6px 10px; font-size: 14px; border: 1.5px solid #c9d0df; border-radius: 5px; background: #fff; }
.equipment-table thead th { text-align: center !important; vertical-align: middle; }
.equipment-table td:nth-child(2) { text-align: center; }
.equipment-table td:nth-child(2) .equipment-amount-input { display: block; margin: 0 auto; text-align: center; }

@media (max-width: 540px) {
  .scroll-x-container { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100vw; padding: 0; }
  .form-container { min-width: 900px; width: 900px; max-width: 900px; padding: 16px 24px !important; border-radius: 10px !important; box-sizing: border-box; }
  .form-row { width: 100% !important; min-width: 0 !important; box-sizing: border-box !important; }
  .custom-input, .custom-textarea, input[type="text"], input[type="date"], input[type="time"], select, textarea {
    width: 100% !important; min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; overflow-x: auto;
  }
}

/* Vue DatePicker – ให้หน้าตาเข้ากับอินพุตอื่น + ซ่อน "เช็คอิน/เช็คเอาท์" */
:deep(.dp__selection_preview){ display: none !important; }
:deep(.dp__input) {
  border-color: #727272 !important;
  box-shadow: none !important;
  border-radius: 8px !important;
  border: 1px solid #ccc;
  height: 40px;
  padding: 10px 14px;
  box-sizing: border-box;
}
:deep(.dp__input_focus) { border-color: #ccc !important; box-shadow: none !important; }
:deep(.dp__menu) { z-index: 3000; }
:deep(.dp-like-custom) {
  padding-left: 40px !important;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background-color: #f9fafb;
}
:deep(.dp__input_wrap .dp__icon) { left: 12px; }

:deep(.is-invalid-date .dp__input) {
  border-color: #ef4444 !important;
  background: #ffeaea !important;
}

/* ==== Sticky Stepper base vars ==== */
:root{
  --topbar-h: 64px;
  --subbar-h: 0px;
  --gap: 12px;
}
.char-counter{
  display: block;
  margin-top: 4px;
  margin-left: 2px;
  font-size: 12px;
  font-style: italic;
  color: #6b7280; /* เทาอ่อน อ่านง่าย */
}

</style>

<style>
@import '../css/style.css';
</style>