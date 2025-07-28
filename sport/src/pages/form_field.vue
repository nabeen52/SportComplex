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
    
    <div v-if="!isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>

<button class="menu-toggle" @click="toggleSidebar">☰</button>
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
              style="cursor:pointer"
              @click="goStep(index)"
            ></div>
            <div class="label">{{ step }}</div>
            <div v-if="index < steps.length - 1" class="line" :class="{ filled: index < currentStep }"></div>
          </div>
        </div>
      </div>

       <div class="scroll-x-container">

        <div class="form-container">
          <div class="form-header">
            <h3>แบบฟอร์มขออนุมัติใช้สถานที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h3>
            <p>โทร 053-917820-1 E-mail Sport-complex@mfu.ac.th</p>
          </div>
          <form @submit.prevent="handleSubmit" enctype="multipart/form-data" class="booking-form">
            <div class="form-grid">

              <div class="form-row">
                <label>
                  ที่ อว.
                  <span v-if="showValidate && missingFields.aw" class="required-star">*</span>
                </label>
                <input
                  type="text"
                  :class="inputClass('aw')"
                  v-model="formData.aw"
                  maxlength="10"
                  @input="onlyAwInput"
                />
              </div>
              <div class="form-row">
                <label>
                  วันที่
                  <span v-if="showValidate && missingFields.date" class="required-star">*</span>
                </label>
                <input type="date" :class="inputClass('date')" v-model="formData.date" />
              </div>
              <div class="form-row">
                <label>
                  เบอร์โทรติดต่อ
                  <span v-if="showValidate && missingFields.tel" class="required-star">*</span>
                </label>
                <input
                  type="text"
                  :class="inputClass('tel')"
                  v-model="formData.tel"
                  maxlength="10"
                  @input="onlyNumbersLimit('tel')"
                />
              </div>

              <div class="form-row">
              <label>
                ชื่อหน่วยงาน
                <span v-if="showValidate && missingFields.agency" class="required-star">*</span>
              </label>
              <div style="display:flex;gap:6px;align-items:center;">
                <input
                  class="custom-input"
                  list="agency-list"
                  v-model="agencyInput"
                  placeholder="ค้นหาหรือเลือกหน่วยงาน"
                  @change="handleAgencyChange"
                  :readonly="isAgencySelected"
                  :class="{ 'is-invalid': showValidate && missingFields.agency }"
                  style="flex:1"
                />
                <button
                  v-if="isAgencySelected"
                  type="button"
                  @click="clearAgency"
                  style="background:#eee;padding:3px 10px;border-radius:6px;border:none;cursor:pointer"
                  title="ลบ"
                >ลบ</button>
                <datalist id="agency-list">
                  <option v-for="option in agencyOptions" :key="option" :value="option" />
                </datalist>
              </div>
            </div>
            <div class="form-row" v-if="agencyInput === 'อื่นๆ'">
              <label>
                โปรดระบุหน่วยงาน
                <span v-if="showValidate && missingFields.agencyOther" class="required-star">*</span>
              </label>
              <input
                type="text"
                class="custom-input"
                v-model="customAgency"
                placeholder="กรอกชื่อหน่วยงาน"
                :class="{ 'is-invalid': showValidate && missingFields.agencyOther }"
              />
            </div>
            <div class="form-row" v-if="agencyInput === 'อื่นๆ'">
              <label>รายละเอียดเพิ่มเติม (ถ้ามี)</label>
              <input
                type="text"
                class="custom-input"
                v-model="otherAgencyDetail"
                placeholder="รายละเอียดเพิ่มเติม"
              />
              </div>


              <div class="form-row">
                <label>
                  ชื่อกิจกรรม/โครงการ
                  <span v-if="showValidate && missingFields.name_activity" class="required-star">*</span>
                </label>
                <textarea
                  :class="inputClass('name_activity') + ' custom-textarea'"
                  v-model="formData.name_activity"
                  rows="4"
                  placeholder="กรอกชื่อกิจกรรม/โครงการ"
                ></textarea>
              </div>
              <div class="form-row">
                <label>
                  เหตุผลในการขอใช้
                  <span v-if="showValidate && missingFields.reasons" class="required-star">*</span>
                </label>
                <textarea
                  :class="inputClass('reasons') + ' custom-textarea'"
                  v-model="formData.reasons"
                  rows="4"
                  placeholder="กรอกเหตุผลในการขอใช้"
                ></textarea>
              </div>
              <div class="form-row date-range-row">
                <label>
                  ช่วงวันที่
                  <span v-if="showValidate && (missingFields.since || missingFields.uptodate)" class="required-star">*</span>
                </label>
                <div class="date-range-group">
                  <input
                    type="date"
                    :min="minBookingDate"
                    v-model="dateRange[0]"
                    @change="syncDateRange('start')"
                    :class="inputClass('since')"
                  />
                  <span style="margin: 0 6px;">-</span>
                  <input
                    type="date"
                    :min="dateRange[0] || minBookingDate"
                    v-model="dateRange[1]"
                    @change="syncDateRange('end')"
                    :class="inputClass('uptodate')"
                  />
                </div>
                <small class="note-text">* กรุณาจองก่อนใช้งานจริง 5 วัน</small>
              </div>
              <div class="form-row">
                <label>
                  ตั้งแต่เวลา
                  <span v-if="showValidate && missingFields.since_time" class="required-star">*</span>
                </label>
                <input type="time" :class="inputClass('since_time')" v-model="formData.since_time" />
              </div>
              <div class="form-row">
                <label>
                  ถึงเวลา
                  <span v-if="showValidate && missingFields.until_thetime" class="required-star">*</span>
                </label>
                <input type="time" :class="inputClass('until_thetime')" v-model="formData.until_thetime" :min="minUntilTime" />
              </div>
              <div class="form-row">
                <label>
                  จำนวนผู้เข้าร่วม
                  <span v-if="showValidate && missingFields.participants" class="required-star">*</span>
                </label>
                <input
                  type="text"
                  :class="inputClass('participants')"
                  v-model="formData.participants"
                  maxlength="10"
                  @input="onlyNumbersLimit('participants')"
                />
              </div>

              <!-- เพิ่มใน <form> ตำแหน่งใกล้ๆ requester/proxyUserId -->
<div class="form-row">
  <label>
    ชื่อผู้ขอใช้สถานที่
    <span v-if="isProxyBooking && showValidate && missingFields.requester" class="required-star">*</span>
  </label>
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

<!-- ช่องสำหรับรหัสผู้จอง (เดิม) -->
<div class="form-row">
  <label>
    รหัสนักศึกษา/รหัสพนักงาน
    <span v-if="showValidate && missingFields.userId" class="required-star">*</span>
  </label>
  <input
    type="text"
    :class="inputClass('userId')"
    v-model="proxyUserId"
    :readonly="!isProxyBooking"
    :placeholder="isProxyBooking ? 'กรอกรหัสนักศึกษา/รหัสพนักงาน' : loginStudentId"
  />
</div>

<!-- ✅ เพิ่มสองช่องใหม่สำหรับข้อมูลผู้ที่จองแทน -->
<div class="form-row" v-if="isProxyBooking">
  <label>
    ชื่อของผู้ที่จองแทน
    <span v-if="showValidate && missingFields.proxyStudentName" class="required-star">*</span>
  </label>
  <input
    type="text"
    class="custom-input"
    :class="{ 'input-error': showValidate && missingFields.proxyStudentName }"
    v-model="proxyStudentName"
    placeholder="กรอกชื่อของผู้ที่คุณจองแทน"
  />
</div>

<div class="form-row" v-if="isProxyBooking">
  <label>
    รหัสนักศึกษาของผู้ที่จองแทน
    <span v-if="showValidate && missingFields.proxyStudentId" class="required-star">*</span>
  </label>
  <input
    type="text"
    class="custom-input"
    :class="{ 'input-error': showValidate && missingFields.proxyStudentId }"
    v-model="proxyStudentId"
    placeholder="กรอกรหัสนักศึกษาของผู้ที่คุณจองแทน"
  />
</div>



              <div class="form-section-title">1.ขอใช้สถานที่</div>
              <div class="form-row">
                <label>
                  อาคารที่ต้องการขอใช้
                  <span v-if="showValidate && missingFields.building" class="required-star">*</span>
                </label>
                <input type="text" class="custom-input building-readonly" :value="formData.building || 'ยังไม่ได้เลือกอาคาร'" readonly />
              </div>
              <div class="form-row" v-if="hasZone && formData.zone && zones.some(z => z.name === formData.zone)">
                <label>
                  ระบุตำแหน่งพื้นที่/ห้องที่ต้องการใช้
                  <span v-if="showValidate && missingFields.zone" class="required-star">*</span>
                </label>
                <input type="text" class="custom-input" :value="formData.zone" readonly />
              </div>
              <div class="form-section-title">2.ขอใช้ระบบสาธารณูปโภค</div>
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
              <template v-if="formData.utilityRequest === 'yes'">
                <div class="form-row">
                  <label>เปิดเครื่องปรับอากาศตั้งแต่เวลา</label>
                  <input type="time" :class="inputClass('turnon_air')" v-model="formData.turnon_air" />
                </div>
                <div class="form-row">
                  <label>ถึงเวลา</label>
                  <input type="time" :class="inputClass('turnoff_air')" v-model="formData.turnoff_air" />
                </div>
                <div class="form-row">
                  <label>ไฟฟ้าส่องสว่างตั้งแต่เวลา</label>
                  <input type="time" :class="inputClass('turnon_lights')" v-model="formData.turnon_lights" />
                </div>
                <div class="form-row">
                  <label>ถึงเวลา</label>
                  <input type="time" :class="inputClass('turnoff_lights')" v-model="formData.turnoff_lights" />
                </div>
                <div class="form-row">
                  <label>อื่นๆ</label>
                  <input type="text" class="custom-input" v-model="formData.other" />
                </div>
              </template>
              <div class="form-section-title">3.ขอใช้รายการประกอบอาคาร</div>
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
              <div
                class="form-row"
                v-if="formData.facilityRequest === 'yes' && formData.building && formData.building.includes('72')"
              >
                <label>
                  ดึงอัฒจันทร์ภายในอาคารเฉลิมพระเกียรติ 72 พรรษา
                  <span v-if="showValidate && missingFields.amphitheater" class="required-star">*</span>
                </label>
                <input type="text" class="custom-input" v-model="formData.amphitheater" placeholder="เฉพาะอาคาร72พรรษา" />
              </div>
              <div class="form-row" v-if="formData.facilityRequest === 'yes'">
                <label>อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน)</label>
                <input type="text" class="custom-input" v-model="formData.need_equipment" />
              </div>
           <div class="form-row" style="grid-column: span 2;">
                <label>
                  แนบไฟล์
                  <span class="required-star">*</span>
                </label>
                <div class="file-upload-wrapper">
                  <label class="custom-file-label" :class="{ 'input-error': fileError }">
                    <span class="custom-file-button">เลือกไฟล์</span>
                    <input
                      id="fileUploadInput"
                      type="file"
                      multiple
                      style="display:none"
                      @change="handleFileChange"
                      accept=".png,.jpg,.jpeg,.pdf,.xls,.xlsx,.doc,.docx"
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
                <small class="note-text">* เฉพาะ .png, .jpg, .jpeg, .pdf, .xls, .xlsx, .doc, .docx</small>
                <div v-if="fileError" class="input-error-message">กรุณาแนบไฟล์อย่างน้อย 1 ไฟล์</div>

                <!-- รายการไฟล์แนบ -->
<div v-if="selectedFiles.length > 0" class="attached-files-list">
  <div
    v-for="(file, idx) in selectedFiles"
    :key="idx"
    class="attached-file-item attached-file-row"
  >
    <!-- รูปภาพ -->
    <template v-if="/\.(png|jpe?g)$/i.test(file.name)">
      <a href="#" class="file-name file-link" @click.prevent="viewImage(idx)">
        {{ shortenFileName(file.name) }}
      </a>
    </template>
    <!-- PDF -->
    <template v-else-if="/\.pdf$/i.test(file.name)">
      <a href="#" class="file-name file-link" @click.prevent="viewPdf(idx)">
        {{ shortenFileName(file.name) }}
      </a>
    </template>
    <!-- Word/Excel/อื่นๆ -->
    <template v-else>
      <a href="#" class="file-name file-link" @click.prevent="viewFile(idx)">
        {{ shortenFileName(file.name) }}
      </a>
    </template>
    <!-- ปุ่มลบขวาสุด -->
    <span class="remove-file-btn" @click="removeFile(idx)">✖</span>
  </div>
</div>

<!-- modal ดูรูป -->
<div v-if="showImageModal" class="image-modal-backdrop" @click="showImageModal=false">
  <div class="image-modal-content" @click.stop>
    <img :src="modalImageUrl" style="max-width:100%;max-height:60vh;display:block;margin:auto;" />
    <button style="margin-top:12px;" @click="showImageModal=false">ปิด</button>
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
            Tel. 053-9177821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
            Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'

const API_BASE = import.meta.env.VITE_API_BASE

// --- Notification ---
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const products = ref([])
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
    // ignore
  }
}

async function loadCart() {
  const userId = localStorage.getItem('user_id') || ''
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch (err) {
    products.value = []
  }
}

onMounted(() => {
  fetchNotifications()
  setInterval(fetchNotifications, 30000)
  loadCart()
})

// --- Form Main ---
const steps = ['กรอกข้อมูล', 'ยืนยันข้อมูล', 'สำเร็จ']
const stepRoutes = ['/form_field1', '/form_field3', '/form_field4']
const currentStep = 0

const router = useRouter()
const route = useRoute()

const isSidebarClosed = ref(false)
function toggleSidebar() { isSidebarClosed.value = !isSidebarClosed.value }

const userIdRef = ref(localStorage.getItem('user_id') || '')
const studentId = ref(localStorage.getItem('student_id') || '')
const loginName = ref('')
const loginStudentId = ref('')
const proxyUserId = ref(localStorage.getItem('student_id') || localStorage.getItem('user_id') || '')
const isProxyBooking = ref(false)

// script setup ส่วนบน
const proxyStudentName = ref('')
const proxyStudentId = ref('')


const formData = ref({
  aw: '', date: '', tel: '', name_activity: '', reasons: '',
  since: '', uptodate: '', since_time: '', until_thetime: '', participants: '',
  requester: '', building: '', zone: '', selectedUtility: '',
  turnon_air: '', turnoff_air: '', turnon_lights: '', turnoff_lights: '',
  other: '', amphitheater: '', need_equipment: '',
   utilityRequest: 'no',
  facilityRequest: 'no',
  proxyStudentName: '',
  proxyStudentId: '',

})
const agencyOptions = ref([])
const agencyInput = ref('')
const customAgency = ref('')
const otherAgencyDetail = ref('')

// Zone
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

// Date Range
const minBookingDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 5)
  return d.toISOString().slice(0, 10)
})
const dateRange = ref([formData.value.since, formData.value.uptodate])
watch(dateRange, ([start, end]) => {
  formData.value.since = start
  formData.value.uptodate = end
})
function syncDateRange(type) {
  if (type === 'start') {
    if (dateRange.value[1] && dateRange.value[1] < dateRange.value[0]) {
      dateRange.value[1] = dateRange.value[0]
    }
    formData.value.since = dateRange.value[0]
  } else if (type === 'end') {
    if (dateRange.value[0] && dateRange.value[1] < dateRange.value[0]) {
      dateRange.value[0] = dateRange.value[1]
    }
    formData.value.uptodate = dateRange.value[1]
  }
}

// ไฟล์แนบ
const selectedFiles = ref([])
const fileError = ref(false)
function handleFileChange(event) {
  let files = Array.from(event.target.files)
  const allowExt = /\.(png|jpg|jpeg|pdf|xls|xlsx|doc|docx)$/i
  files = files.filter(f => allowExt.test(f.name))
  selectedFiles.value = files
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
function removeFile(idx) {
  selectedFiles.value.splice(idx, 1)
  window._tempSelectedFiles = selectedFiles.value
  fileError.value = selectedFiles.value.length === 0
}

// ดูไฟล์แนบ (Preview Image)
const showImageModal = ref(false)
const modalImageUrl = ref('')
function viewImage(idx) {
  const file = selectedFiles.value[idx]
  if (file.url) {
    modalImageUrl.value = file.url
    showImageModal.value = true
  } else {
    const reader = new FileReader()
    reader.onload = (e) => {
      modalImageUrl.value = e.target.result
      showImageModal.value = true
    }
    reader.readAsDataURL(file)
  }
}

// ถึงเวลา
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
watch(() => formData.value.since_time, () => {
  if (
    formData.value.until_thetime &&
    formData.value.until_thetime < minUntilTime.value
  ) {
    formData.value.until_thetime = ''
  }
})

onMounted(async () => {
  if (studentId.value) {
    loginStudentId.value = studentId.value
    proxyUserId.value = studentId.value
  } else if (userIdRef.value) {
    loginStudentId.value = userIdRef.value
    proxyUserId.value = userIdRef.value
  } else {
    loginStudentId.value = 'รหัสผู้ใช้ระบบ'
    proxyUserId.value = ''
  }
  const storedRequester = localStorage.getItem('requesterName') || ''
  if (storedRequester) {
    formData.value.requester = storedRequester
    loginName.value = storedRequester
  } else if (userIdRef.value) {
    try {
      const res = await axios.get(`${API_BASE}/api/user/${userIdRef.value}`)
      if (res.data && res.data.name) {
        formData.value.requester = res.data.name
        loginName.value = res.data.name
      }
    } catch {
      loginName.value = 'ชื่อผู้ใช้ระบบ'
    }
  } else {
    loginName.value = 'ชื่อผู้ใช้ระบบ'
  }
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
})

// watch(isProxyBooking, (val) => {
//   if (!val) {
//     proxyUserId.value = loginStudentId.value
//   } else {
//     proxyUserId.value = ''
//   }
// })

watch(formData, saveFormToSession, { deep: true })
watch(agencyInput, saveFormToSession)
watch(customAgency, saveFormToSession)
watch(otherAgencyDetail, saveFormToSession)
watch(proxyUserId, saveFormToSession)
watch(isProxyBooking, saveFormToSession)
watch(proxyStudentName, saveFormToSession)
watch(proxyStudentId, saveFormToSession)
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
      selectedFileNames: selectedFiles.value.map(f => f.name),
      proxyStudentName: proxyStudentName.value,     
      proxyStudentId: proxyStudentId.value,
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
      dateRange.value = [formData.value.since, formData.value.uptodate]
      proxyStudentName.value = d.proxyStudentName || ''
      proxyStudentId.value = d.proxyStudentId || ''
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

async function goStep(targetStep) {
  saveFormToSession()
  window._tempSelectedFiles = selectedFiles.value
  if (targetStep === currentStep) return
  if (targetStep === 2 && currentStep === 0) {
    Swal.fire({
      icon: 'info',
      title: 'โปรดดำเนินการทีละขั้นตอน',
      text: 'กรุณายืนยันข้อมูลก่อนข้ามไปขั้นตอนสุดท้าย',
      confirmButtonText: 'ตกลง'
    })
    return
  }
  if (targetStep === 0) {
    router.push({ path: stepRoutes[0], query: { restore: 'true' } })
    return
  }
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
        if (res.data && res.data.id) uploadFileIds.push(res.data.id)
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
}
const finalAgency = computed(() => (agencyInput.value === 'อื่นๆ' ? customAgency.value : agencyInput.value))
function handleAgencyChange() {
  if (agencyInput.value !== 'อื่นๆ') {
    customAgency.value = ''
    otherAgencyDetail.value = ''
  }
}

const isAgencySelected = computed(() =>
  !!agencyInput.value &&
  agencyOptions.value.includes(agencyInput.value) &&
  agencyInput.value !== 'อื่นๆ'
)


const missingFields = ref({})
const showValidate = ref(false)
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
  if (field === 'building') return 'custom-input building-readonly'
  return 'custom-input'
}

function clearAgency() {
  agencyInput.value = ''
  customAgency.value = ''
  otherAgencyDetail.value = ''
}

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

  if (isProxyBooking.value) {
  if (!proxyStudentName.value || proxyStudentName.value.trim() === '') {
    fields['proxyStudentName'] = true
  }
  if (!proxyStudentId.value || proxyStudentId.value.trim() === '') {
    fields['proxyStudentId'] = true
  }
}

  if (!finalAgency.value || String(finalAgency.value).trim() === '') fields['agency'] = true
  if (agencyInput.value === 'อื่นๆ' && (!customAgency.value || String(customAgency.value).trim() === ''))
    fields['agencyOther'] = true
  if (hasZone.value && (!formData.value.zone || String(formData.value.zone).trim() === '')) fields['zone'] = true
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
      if (res.data && res.data.id) uploadFileIds.push(res.data.id)
    }
    const submitData = {
      ...formData.value,
      agency: finalAgency.value ?? '',
      agency_other_detail: otherAgencyDetail.value ?? '',
      user_id: proxyUserId.value ?? '',
      uploadFiles: uploadFileIds,
      proxyStudentName: proxyStudentName.value ?? '',
      proxyStudentId: proxyStudentId.value ?? ''
    }
    const bookingRes = await axios.post(`${API_BASE}/api/booking_field`, submitData)
    localStorage.setItem('bookingId', bookingRes.data.bookingId)
    router.push('/form_field3')
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
onBeforeRouteLeave((to, from, next) => {
  if (to.path !== '/form_field' && to.path !== '/form_field3') {
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
function onlyNumbersLimit(field) {
  formData.value[field] = formData.value[field].replace(/[^0-9]/g, '').slice(0, 10)
}
function onlyAwInput(e) {
  // อนุญาตแค่เลขและ / - _
  let val = e.target.value.replace(/[^0-9/_-]/g, '').slice(0, 10)
  formData.value.aw = val
}
function shortenFileName(name) {
  if (!name) return ''
  if (name.length <= 30) return name
  const dot = name.lastIndexOf('.')
  const ext = dot > -1 ? name.slice(dot) : ''
  return name.slice(0, 15) + '...' + (ext.length < 8 ? ext : ext.slice(0, 8) + '...')
}
function viewPdf(idx) {
  const file = selectedFiles.value[idx]
  const reader = new FileReader()
  reader.onload = (e) => {
    const pdfData = e.target.result
    const blob = new Blob([pdfData], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
  reader.readAsArrayBuffer(file)
}

function viewFile(idx) {
  const file = selectedFiles.value[idx]
  const reader = new FileReader()
  reader.onload = (e) => {
    const arrbuf = e.target.result
    let mime = ''
    if (/\.(docx?|rtf)$/i.test(file.name)) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else if (/\.(xlsx?)$/i.test(file.name)) mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    else mime = file.type || 'application/octet-stream'
    const blob = new Blob([arrbuf], { type: mime })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
  reader.readAsArrayBuffer(file)
}

</script>

<style scoped>
/* ... วาง style ของคุณที่นี่ ... */
/* ตัวอย่าง style ตามที่แนบมาก่อนหน้า */
.required-star {
  color: red;
}
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

.is-invalid {
  border-color: #ef4444 !important;
  background: #ffeaea !important;
}




@media (max-width: 540px) {
  /* ตัวครอบ card ให้ scroll-x */
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

  /* ให้ input และ textarea เต็มความกว้างของ col */
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

  /* ปรับขนาด font หรือ padding ถ้าต้องการ */
  .form-header h3 {
    font-size: 1.1rem;
  }
}

</style>


<style>
@import '../css/style.css';
</style>