<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/dashboard" exact-active-class="active"><i class="pi pi-chart-pie"></i> แดชบอร์ด</router-link>
        <router-link to="/home_admin" exact-active-class="active"><i class="pi pi-megaphone"></i> แก้ไขข่าว</router-link>
        <router-link to="/edit_field" active-class="active"><i class="pi pi-map-marker"></i> แก้ไขสนาม</router-link>
        <router-link to="/edit_equipment" active-class="active"><i class="pi pi-clipboard"></i> แก้ไขอุปกรณ์ </router-link>
        <!-- <router-link to="/step" active-class="active"><i class="pi pi-sitemap"></i> แก้ไขขั้นตอนการอนุมัติ </router-link> -->
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> จองสนาม</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <router-link to="/agency_admin" active-class="active"><i class="pi pi-briefcase"></i> หน่วยงาน </router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล </router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
      </nav>
    </aside>

    <div v-if="!isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>

    <!-- Main -->
    <div class="main">
      <!-- Topbar -->
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
                    v-for="(noti, idx) in notifications.slice(0, 10)"
                    :key="noti.id || idx"
                    :class="['notification-item', noti.type || '', { unread: noti.timestamp > lastSeenTimestamp }]"
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
              @click="tryGoStep(index)"
              :style="{ cursor: canGoToStep(index) ? 'pointer' : 'not-allowed', opacity: canGoToStep(index) ? 1 : 0.5 }"
            ></div>
            <div class="label">{{ step }}</div>
            <div v-if="index < steps.length - 1" class="line" :class="{ filled: index < currentStep }"></div>
          </div>
        </div>
      </div>

      <div class="scroll-x-container">
        <!-- Confirm Form -->
        <div class="form-container admin3">
          <h1 class="title">ยืนยันข้อมูล</h1>

          <div id="pdf-section">
            <section id="uniform-lines">
              <div class="form-header">
                <h3>แบบฟอร์มขออนุมัติใช้สถานที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h3>
                <p><b>โทร: 0-5391-7820 และ 0-5391-7821 | E-mail: sport-complex@mfu.ac.th</b></p>
              </div>

              <!-- Header Info -->
              <div class="info-left">
                <span class="bold">ที่ อว.</span>
                <span class="line-field single-line">{{ info.aw }}</span>
                <span class="bold" style="margin-left: 50px;">วันที่</span>
                <span class="line-field single-line">{{ formatDateOnly(info.date) }}</span>
                <span class="bold" style="margin-left: 50px;">โทร</span>
                <span class="line-field single-line">{{ info.tel }}</span>
              </div>

              <!-- Detail -->
              <div class="form-row mt-15" style="margin-left:0;"><span class="bold">เรื่อง</span><span>ขออนุมัติใช้สถานที่</span></div>
              <div class="form-row mt-15" style="margin-left:0;"><span class="bold">เรียน</span><span>หัวหน้าศูนย์กีฬาฯ</span></div>

              <div class="form-row mt-15" style="text-indent: 80px; text-align:left; line-height: 2.0;">
                ด้วย {{ info.agency }}
                จะดำเนินกิจกรรม/โครงการ {{ info.name_activity }}
                เหตุผลในการขอใช้เพื่อ {{ info.reasons }}
                ในวันที่ {{ formatDateOnly(info.since) }} ถึงวันที่ {{ formatDateOnly(info.uptodate) }}
                ช่วงเวลา {{ formatTimeTH(info.since_time) }} ถึงเวลา {{ formatTimeTH(info.until_thetime) }}
                จำนวนผู้เข้าร่วม {{ info.participants }} คน
                และเพื่อให้การดำเนินงานเป็นไปด้วยความเรียบร้อย จึงเรียนมาเพื่อขออนุมัติ ดังนี้
              </div>

              <!-- ข้อ 1 -->
              <div class="form-row bold" style="margin-left:0;"><span>1. ขออนุมัติใช้สถานที่</span></div>
              <table class="util-table util-colon-align" style="margin-left:80px;">
                <colgroup>
                  <col class="c-label" /><col class="c-colon" /><col />
                </colgroup>
                <tr>
                  <td class="util-label">1.1 อาคาร</td><td class="colon">:</td>
                  <td class="restroom-text">{{ info.building && info.building.trim() !== '' ? info.building : '-' }}</td>
                </tr>
                <tr>
                  <td class="util-label">1.2 พื้นที่/ห้อง</td><td class="colon">:</td>
                  <td class="restroom-text">{{ info.zone && info.zone.trim() !== '' ? info.zone : '-' }}</td>
                </tr>
              </table>

              <!-- ข้อ 2 -->
              <div class="form-row util-header" style="margin-left:0;">
                <span class="bold">2. ขออนุมัติใช้ระบบสาธารณูปโภค</span>
                <div class="util-choose">
                  <span :class="['radio-print', { on: isYes(info.utilityRequest) }]"></span><label style="margin-right:18px;">เลือก</label>
                  <span :class="['radio-print', { on: isNo(info.utilityRequest) }]"></span><label>ไม่เลือก</label>
                </div>
              </div>

              <div v-if="isYes(info.utilityRequest)" class="util-wrap" style="margin-left:80px;">
                <table class="util-table util-colon-align">
                  <colgroup>
                    <col class="c-label" /><col class="c-colon" />
                    <col class="c-time" /><col class="c-sep" /><col class="c-time" />
                  </colgroup>
                  <tr>
                      <td class="util-label">2.1 ไฟฟ้าส่องสว่าง</td>
                      <td class="colon">:</td>

                      <!-- ถ้าไม่ต้องการ แสดงข้อความ -->
                      <template v-if="isLightsNo">
                        <td class="restroom-text" colspan="3">ไม่ต้องการใช้งาน</td>
                      </template>

                      <!-- ถ้าต้องการ แสดงช่วงเวลา -->
                      <template v-else>
                        <td class="time"><span class="since">ตั้งแต่</span> {{ formatTimeTH(info.turnon_lights) }}</td>
                        <td class="sep">-</td>
                        <td class="time">{{ formatTimeTH(info.turnoff_lights) }}</td>
                      </template>
                    </tr>
                  <tr>
                    <td class="util-label">2.2 ห้องสุขา</td><td class="colon">:</td>
                    <td class="restroom-text" colspan="3">
                      {{ isYes(info.restroom) ? 'ต้องการใช้งาน' : (isNo(info.restroom) ? 'ไม่ต้องการใช้งาน' : '-') }}
                    </td>
                  </tr>
                </table>
              </div>

              <div class="note-line">
                <span style="font-weight:bold; font-size: 15px;">
                  *ต้องได้รับการอนุมัติจากรองอธิการบดีผู้กำกับดูแล และสำเนาเอกสารถึงฝ่ายอนุรักษ์พลังงาน
                </span>
              </div>

              <!-- ข้อ 3 -->
              <div class="form-row bold" style="margin-left:0;">
  <span>3. ขออนุมัติรายการประกอบอาคาร</span>
  <span :class="['radio-print', { on: isYes(info.facilityRequest) }]" style="margin-left:8px;"></span>
  <label style="margin-right: 18px;">เลือก</label>
  <span :class="['radio-print', { on: isNo(info.facilityRequest) }]"></span>
  <label>ไม่เลือก</label>
</div>

<div v-if="isYes(info.facilityRequest)">
  <!-- แสดง "ดึงอัฒจันทร์ฯ" เฉพาะกรณีเป็นอาคาร 72 -->
  <div
    v-if="isBuilding72"
    class="form-row block-row"
    style="margin-left: 80px;"
  >
    <span style="white-space: nowrap;">3.1 ดึงอัฒจันทร์ภายในอาคารเฉลิมพระเกียรติฯ :</span>
    <span class="line-field block-text force-inline">
      {{ (info.amphitheater && info.amphitheater.trim() !== '') ? info.amphitheater : '-' }}
    </span>
  </div>

  <!-- อุปกรณ์กีฬา: ถ้าไม่ใช่ 72 ให้เลื่อนเป็น 3.1 -->
  <div class="form-row block-row" style="margin-left: 80px;">
    <span style="white-space: nowrap;">
      {{ isBuilding72 ? '3.2' : '3.1' }} อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน) :
    </span>
    <span class="line-field block-text force-inline">
      {{ (info.need_equipment && info.need_equipment.trim() !== '') ? info.need_equipment : '-' }}
    </span>
  </div>

  <!-- 3.x ห้องที่ต้องการใช้งาน -->
<div class="form-row block-row" style="margin-left: 80px;">
  <span style="white-space: nowrap;">
    {{ isBuilding72 ? '3.3' : '3.2' }} ห้องที่ต้องการใช้งาน :
  </span>
  <span class="line-field block-text force-inline">
    {{ info.room_request && info.room_request.trim() ? info.room_request : '-' }}
  </span>
</div>




</div>

              <div class="note-line">
                <span style="font-weight:bold; font-size:15px;">ทั้งนี้ต้องแนบเอกสารโครงการหรือกิจกรรมที่ได้รับการอนุมัติแล้วพร้อมกำหนดการจัดกิจกรรม</span>
              </div>
              <div class="note-line">
                <span style="font-weight:bold; font-size:15px;">หากเป็นการเรียนการสอน ต้องแนบตารางการเรียนการสอน (Class schedule) พร้อมทั้งรายชื่อนักศึกษา</span>
              </div>
            </section>

            <!-- ตารางเซ็นชื่อ (บน) – ผู้รับผิดชอบชิดขวา -->
            <table class="sign-header-table single-right" style="display: flex; justify-content: right;">
              <tbody>
                <tr>
                  <td>
                    <div class="sig-box">
                      <div class="sign-line">
                        <span class="sign-text">ลงชื่อ</span>
                        <div class="signature-wrap">
                          <template v-if="signatureUrl">
                            <img :src="signatureUrl" alt="ลายเซ็น" class="signature-img" crossorigin="anonymous" @error="signatureUrl = ''" />
                          </template>
                          <template v-else>
                            <span class="dot-line-inline">......................................</span>
                          </template>
                        </div>
                        <span aria-hidden="true"></span>
                      </div>
                      <div class="sig-under">
                        <div class="sig-name" style="padding-bottom:8px;">( {{ info.proxyStudentName || info.username_form || '-' }} )</div>
                        <div class="sig-role" style="padding-bottom:8px;">ผู้รับผิดชอบ</div>
                        <div class="sig-date">{{ nowTH }}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- ตารางเซ็นชื่อ (ล่าง) – 2 ช่อง ตาม form_field3 -->
            <div class="avoid-break">
              <div class="form-row" style="padding-top:10px;">
                <table class="approval-sign-table two-cols">
                  <thead>
                    <tr>
                      <th>1. เลขานุการศูนย์กีฬาฯ</th>
                      <th>2. หัวหน้าศูนย์กีฬาฯ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div class="td-inner">
                          <div class="checkbox-line">
                            <span class="box-print"></span><label>เรียน หัวหน้าศูนย์กีฬาฯ</label>
                          </div>
                          <div class="checkbox-line">
                            <span class="box-print"></span><label>อื่นๆ</label>
                            <span class="dot-line dot-line-custom"></span>
                          </div>
                          <div class="line-row"><span class="dot-line"></span></div>
                          <div class="line-row">(<span class="dot-line"></span>)</div>
                          <div class="date-row">วันที่ ............/............/............</div>
                        </div>
                      </td>
                      <td>
                        <div class="td-inner">
                          <div class="checkbox-line">
                            <span class="box-print"></span><label>เห็นชอบ</label>
                          </div>
                          <div class="checkbox-line">
                            <span class="box-print"></span><label>อื่นๆ</label>
                            <span class="dot-line dot-line-custom"></span>
                          </div>
                          <div class="line-row"><span class="dot-line"></span></div>
                          <div class="line-row">(<span class="dot-line"></span>)</div>
                          <div class="date-row">วันที่ ............/............/............</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style="margin-top:12px;">
              <span style="font-weight:bold; font-size:15px;">
                หมายเหตุ: ให้นักศึกษา/ผู้รับผิดชอบแนบเอกสารโครงการหรือกำหนดการเพื่อประกอบการพิจารณา
              </span>
            </div>
          </div>

          <!-- ไฟล์แนบ -->
          <div v-if="fileAttachments && fileAttachments.length > 0" class="form-row mt-30">
            <span>ไฟล์แนบ</span>
            <div class="attached-files-list">
              <div v-for="(file, idx) in fileAttachments" :key="idx" class="attached-file-item">
                <a :href="file.url" target="_blank" :download="file.fileName">
                  {{ file.fileName || 'ไฟล์แนบ' }}
                </a>
                <span v-if="file.size" style="color:#888; font-size:12px; margin-left:8px;">({{ file.size }} KB)</span>
              </div>
            </div>
          </div>

          <div class="button-wrapper mt-30">
            <button id="btnBack" @click="goBack">Back</button>
            <button id="btnNext" @click="handleNext" :disabled="isLoading">{{ isLoading ? 'Processing…' : 'Next' }}</button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel: 0-5391-7820 and 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a>
            | Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
          <p>© 2025 Center for Information Technology Services, Mae Fah Luang University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import axios from 'axios'
import html2pdf from 'html2pdf.js'

const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'

// -------- layout / nav --------
const router = useRouter()
const isSidebarClosed = ref(false)
function toggleSidebar(){ isSidebarClosed.value = !isSidebarClosed.value }

// -------- stepper --------
const steps = ['กรอกข้อมูล','ยืนยันข้อมูล','สำเร็จ']
const currentStep = ref(1)
function canGoToStep(i){ return i <= currentStep.value }
function tryGoStep(i){
  if (i===0) router.push('/form_field_admin')
  else if (i===1) router.push('/form_field_admin3')
  else if (i===2) router.push('/form_field_admin4')
}

// -------- notifications / cart (เหมือน form_field3) --------
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const products = ref([])
const userId = localStorage.getItem('user_id') || ''
const lastSeenTimestamp = ref(0)
let polling = null

const isBuilding72 = computed(() => {
  const name = ((info.value && info.value.building) ? info.value.building : '')
    .replace(/\s+/g, '')
    .toLowerCase()
  // ปรับเงื่อนไขตามที่ต้องการได้
  return name.includes('72พรรษา') || name.includes('อาคารเฉลิมพระเกียรติ') || name.includes('72')
})

// แทนที่ของเดิมทั้งบล็อกนี้
const isLightsNo = computed(() => {
  const on  = (info.value?.turnon_lights  || '').trim()
  const off = (info.value?.turnoff_lights || '').trim()

  // ถ้าเวลาใดเวลาหนึ่งว่าง -> ถือว่า "ไม่ต้องการใช้งาน"
  if (!on || !off) return true

  // ถ้ามีทั้งสองเวลาแล้ว ค่อยพิจารณาค่าธง lights ต่อ (รองรับกรณีพิเศษ)
  const v = norm(info.value?.lights ?? info.value?.light ?? info.value?.lighting ?? '')
  return NO_TOKENS.includes(v)
})

async function uploadTempFilesAndGetUrls() {
  try {
    // ใช้แหล่งเดียวกับหน้า form_field3
    const picked =
      (Array.isArray(window._tempSelectedFiles) && window._tempSelectedFiles.length > 0)
        ? window._tempSelectedFiles
        : (Array.isArray(window._adminSelectedFiles) && window._adminSelectedFiles.length > 0)
          ? window._adminSelectedFiles
          : []

    if (!picked.length) return []

    const results = []
    for (const f of picked) {
      const fd = new FormData()
      fd.append('file', f)              // ✅ ชื่อ key = 'file' เหมือน form_field3
      const up = await axios.post(`${API_BASE}/api/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = up?.data?.fileUrl || up?.data?.url || ''
      if (url) {
        results.push({
          url,
          fileName: f.name || up?.data?.fileName || 'attachment',
          sizeKB: f.size ? Math.round(f.size / 1024) : null
        })
      }
    }

    // อัปเดต preview บนหน้านี้ด้วย
    if (results.length) {
      fileAttachments.value = [
        ...fileAttachments.value,
        ...results.map(x => ({ url: x.url, fileName: x.fileName, size: x.sizeKB }))
      ]
    }

    // เคลียร์ตัวแปรไฟล์ชั่วคราว
    try { delete window._tempSelectedFiles } catch {}
    try { delete window._adminSelectedFiles } catch {}

    return results
  } catch (e) {
    console.warn('uploadTempFilesAndGetUrls error:', e?.message || e)
    return []
  }
}



function pruneOldNotifications () {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // เก็บ 7 วัน
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

// --- keys สำหรับ snapshot ---
const SNAP_KEY = 'field_form_snapshot'
const KEEP_ROUTES = ['/form_field_admin', '/form_field_admin3']   // เส้นทางใน flow นี้

function saveSnapshot() {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(info.value || {}))
  } catch {}
}



function toggleNotifications () {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(lastSeenTimestamp.value))
    unreadCount.value = 0 // เคลียร์ badge เมื่อเปิดดู
  }
}


function closeNotifications () {
  showNotifications.value = false
}



function handleClickOutside (event) {
  const dropdown = document.querySelector('.notification-dropdown')
  const btn = document.querySelector('.notification-btn')
  if (
    dropdown &&
    !dropdown.contains(event.target) &&
    btn &&
    !btn.contains(event.target)
  ) {
    closeNotifications()
  }
}

/** ดึงแจ้งเตือน pending เฉพาะ field / equipment */
async function fetchNotifications () {
  try {
    pruneOldNotifications()

    const res = await axios.get(`${API_BASE}/api/history/approve_field`)
    const data = Array.isArray(res.data) ? res.data : []

    const pendings = data.filter(
      (item) => item.status === 'pending' && (item.type === 'field' || item.type === 'equipment')
    )

    if (pendings.length) {
      const newMessages = pendings.map((item) => {
        const id = item._id?.$oid || item._id
        const ts =
          (item.updatedAt && new Date(item.updatedAt).getTime()) ??
          (item.createdAt && new Date(item.createdAt).getTime()) ??
          (item.date && new Date(item.date).getTime()) ??
          Date.now()

        return {
          id,
          type: 'pending',
          timestamp: ts,
          message: item.type === 'field'
            ? `สนาม '${item.name}' กำลังรอการอนุมัติ`
            : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
        }
      })

      // รวม-ตัดซ้ำ-เรียงใหม่สุดก่อน
      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp)

      pruneOldNotifications()
    }

    // badge = จำนวนที่ยัง “ใหม่กว่า” ครั้งล่าสุดที่เปิดดู
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch {
    // เงียบไว้
  }
}

async function loadCart(){
  if (!userId) return
  try{
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  }catch{ products.value = [] }
}

// -------- form data (align to form_field3) --------
const info = ref({})
const fileAttachments = ref([])
const signatureUrl = ref('')

const YES_TOKENS = ['yes','เลือก','ต้องการ','true','1']
const NO_TOKENS  = ['no','ไม่เลือก','ไม่ต้องการ','false','0']
const norm = v => (v ?? '').toString().trim().toLowerCase()
const isYes = v => YES_TOKENS.includes(norm(v))
const isNo  = v => NO_TOKENS.includes(norm(v))

function formatDateOnly(dateTime){
  if (!dateTime) return '-'
  let dateStr = dateTime
  if (typeof dateTime==='string' && dateTime.includes('T')) dateStr = dateTime.split('T')[0]
  if (dateStr.includes('/')) return dateStr
  const [y,m,d] = dateStr.split('-')
  if (!y||!m||!d) return dateStr
  return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${(parseInt(y)+543)}`
}
function formatTimeTH(s){
  if (!s || typeof s!=='string') return '-'
  const t = s.trim().slice(0,5)
  return /^\d{2}:\d{2}$/.test(t) ? `${t} น.` : s + ' น.'
}

// timestamp สำหรับแสดงใต้กล่องเซ็นชื่อ (ให้ตรงกับ form_field3)
const nowTH = ref('')
function getNowTH(){
  const now = new Date()
  const dd = String(now.getDate()).padStart(2,'0')
  const mm = String(now.getMonth()+1).padStart(2,'0')
  const yyyyTH = String(now.getFullYear()+543)
  const HH = String(now.getHours()).padStart(2,'0')
  const MM = String(now.getMinutes()).padStart(2,'0')
  return `${dd}/${mm}/${yyyyTH} ${HH}:${MM} น.`
}
nowTH.value = getNowTH()
let nowTicker = null
onMounted(()=>{ nowTicker = setInterval(()=> nowTH.value = getNowTH(), 60*1000) })
onBeforeUnmount(()=>{ if (nowTicker) clearInterval(nowTicker) })

// toAbsUrl เหมือนหน้า form_field3 (สำหรับลายเซ็น)
function toAbsUrl(p){
  if (!p) return ''
  const s = String(p)
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('/')) return `${API_BASE}${s}`
  return `${API_BASE}/${s}`
}

// โหลดข้อมูล booking + ผู้ใช้ + ไฟล์แนบ แล้ว normalize ให้อยู่โครงเดียวกับ form_field3
// โหลดข้อมูล booking + ผู้ใช้ + ไฟล์แนบ แล้ว normalize ให้อยู่โครงเดียวกับ form_field3
function normalizeFieldBooking(doc = {}) {
  return {
    aw: doc.aw || '',
    date: doc.date || '',
    tel: doc.tel || doc.number || '',
    agency: doc.agency || doc.agency_other_detail || '',
    name_activity: doc.name_activity || '',
    reasons: doc.reasons || '',
    building: doc.building || '',
    zone: doc.zone || '',
    since: doc.since || '',
    uptodate: doc.uptodate || '',
    since_time: doc.since_time || '',
    until_thetime: doc.until_thetime || '',
    participants: doc.participants || '',

    // -------- สาธารณูปโภค --------
    utilityRequest: doc.utilityRequest || '',
    restroom: doc.restroom || '',
    lights: doc.lights ?? doc.light ?? doc.lighting ?? '',

    // ✅ เพิ่ม 2 ฟิลด์นี้เพื่อให้ 2.1 แสดงได้
    turnon_lights: doc.turnon_lights || '',
    turnoff_lights: doc.turnoff_lights || '',

    // -------- รายการประกอบอาคาร --------
    facilityRequest: doc.facilityRequest || '',
    amphitheater: doc.amphitheater || '',
    need_equipment: doc.need_equipment || '',
    room_request: (doc.room_request || doc.roomRequest || ''),

    // -------- ผู้ยื่น --------
    proxyStudentName: doc.proxyStudentName || '',
    username_form: doc.username_form || '',
    id_form: doc.id_form || '',
    user_id: doc.user_id || '',

    // -------- id booking --------
    booking_id: doc._id || doc.id || localStorage.getItem('bookingId') || ''
  }
}



onMounted(async () => {
  lastSeenTimestamp.value = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0')
  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  document.addEventListener('mousedown', handleClickOutside)
  loadCart()

  const bookingId = localStorage.getItem('bookingId')
  if (!bookingId) {
    // เผื่อมาแบบ snapshot
    const snapRaw = localStorage.getItem('field_form_snapshot')
    if (snapRaw) {
      info.value = normalizeFieldBooking(JSON.parse(snapRaw))
    } else {
      return router.push({ path: '/form_field_admin', query: { restore: 'true' } })
    }
  } else {
    try {
      const res = await axios.get(`${API_BASE}/api/booking_field/${bookingId}`)
      const doc = res?.data?.data ?? res?.data ?? {}
      info.value = normalizeFieldBooking(doc)

      // --- Normalize yes/no ---
      info.value.utilityRequest  = isYes(info.value.utilityRequest)  ? 'yes' : (isNo(info.value.utilityRequest)  ? 'no' : '')
      info.value.restroom        = isYes(info.value.restroom)        ? 'yes' : (isNo(info.value.restroom)        ? 'no' : '')
      info.value.facilityRequest = isYes(info.value.facilityRequest) ? 'yes' : (isNo(info.value.facilityRequest) ? 'no' : '')

      // ✅ ถ้ามีกรอกเวลาไฟแล้ว -> บังคับให้ lights = 'yes' เพื่อให้ 2.1 แสดงช่วงเวลา
      const hasLightTimes =
        !!(info.value.turnon_lights && info.value.turnoff_lights &&
           info.value.turnon_lights.trim() && info.value.turnoff_lights.trim())

      if (hasLightTimes) {
        info.value.lights = 'yes'
      } else {
        // ถ้าไม่กรอกเวลา ให้ยึดค่าที่มาจากฐานข้อมูล (yes/no/ว่าง)
        info.value.lights = isYes(info.value.lights) ? 'yes' : (isNo(info.value.lights) ? 'no' : '')
      }

      // ไฟล์แนบ
      const rawAttach = doc.attachedFiles || doc.attachment || doc.files || []
      fileAttachments.value = (rawAttach || []).map((x, i) => ({
        url: x?.url || x?.fileUrl || '',
        fileName: x?.originalName || x?.fileName || x?.name || `attachment_${i + 1}`,
        size: x?.size ? Math.ceil(Number(x.size) / 1024) : null
      }))

      // ลายเซ็นของผู้ยื่น
      if (info.value.user_id) {
        try {
          const u = await axios.get(`${API_BASE}/api/user/${info.value.user_id}`)
          const sigPath = u.data.signaturePath || u.data.signature_url || u.data.signature || ''
          signatureUrl.value = sigPath ? toAbsUrl(sigPath) : ''
        } catch {
          signatureUrl.value = ''
        }
      }
    } catch {
      // ถ้าดึงไม่ได้ให้กลับไปหน้า 1
      return router.push({ path: '/form_field_admin', query: { restore: 'true' } })
    }
  }
})

onBeforeUnmount(()=>{
   if (polling) clearInterval(polling) 
   if (polling) clearInterval(polling)
  document.removeEventListener('mousedown', handleClickOutside)
  }
)

function goBack()
{   
  // เซฟข้อมูลไว้ก่อนค่อยย้อนกลับ
  saveSnapshot()
  router.push({ path: '/form_field_admin', query: { restore: 'true' } }) 
}

// ---------- PDF: ทำให้ตรงกับ form_field3 (A4 one page scale) ----------
const pdfFilename = 'แบบฟอร์มขออนุมัติใช้สถานที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง.pdf'
const A4_W = Math.round(210 * (96/25.4))   // ≈ 794px
const A4_H = Math.round(297 * (96/25.4))   // ≈ 1123px
const PAD_X = 12
const PAD_Y = 12

async function makeA4OnePageBlob(element){
  if (document.fonts && document.fonts.ready){ try{ await document.fonts.ready }catch{} }

  const orig = {
    width: element.style.width, height: element.style.height,
    margin: element.style.margin, padding: element.style.padding,
    transform: element.style.transform, transformOrigin: element.style.transformOrigin,
    display: element.style.display,
  }

  const wrapper = document.createElement('div')
  Object.assign(wrapper.style, {
    width: A4_W+'px', height: A4_H+'px', background:'#fff',
    padding:'0', margin:'0', position:'relative', overflow:'hidden'
  })

  const innerW = A4_W - 2*PAD_X
  const innerH = A4_H - 2*PAD_Y

  element.classList.add('pdf-export','pdf-onepage')
  element.style.display = 'block'
  element.style.margin = '0 auto'
  element.style.padding = `${PAD_Y}px ${PAD_X}px`
  element.style.width = innerW + 'px'
  element.style.transformOrigin = 'top center'
  element.style.transform = 'scale(1)'

  const parent = element.parentNode
  const next = element.nextSibling
  parent.insertBefore(wrapper, element)
  wrapper.appendChild(element)

  await nextTick(); await new Promise(r=>requestAnimationFrame(r))

  let contentHeight = element.scrollHeight
  let scale = Math.min(1, innerH / contentHeight)
  if (scale < 1){
    element.style.width = (innerW / scale) + 'px'
    await new Promise(r=>requestAnimationFrame(r))
    contentHeight = element.scrollHeight
    scale = Math.min(1, innerH / contentHeight)
  }
  element.style.transform = `scale(${scale})`
  await new Promise(r=>requestAnimationFrame(r))

  const opt = {
    margin: 0,
    filename: pdfFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor:'#ffffff' },
    jsPDF: { unit:'px', format:[A4_W, A4_H], orientation:'portrait' },
    pagebreak: { mode: [] }
  }

  const pdfBlob = await html2pdf().from(wrapper).set(opt).outputPdf('blob')

  if (next) parent.insertBefore(element, next); else parent.appendChild(element)
  wrapper.remove()
  element.classList.remove('pdf-export','pdf-onepage')
  element.style.width = orig.width
  element.style.height = orig.height
  element.style.margin = orig.margin
  element.style.padding = orig.padding
  element.style.transform = orig.transform
  element.style.transformOrigin = orig.transformOrigin
  element.style.display = orig.display

  return pdfBlob
}
async function htmlToPdfBlob(elementId){
  const el = document.getElementById(elementId)
  return await makeA4OnePageBlob(el)
}
async function uploadPdfBlob(pdfBlob){
  const fd = new FormData()
  fd.append('file', pdfBlob, 'booking.pdf')
  const up = await axios.post(`${API_BASE}/api/upload`, fd, {
    headers:{ 'Content-Type':'multipart/form-data' }
  })
  return up.data?.fileUrl
}

// ---------- Next (สร้าง History แบบ form_field3) ----------
const isLoading = ref(false)

// ⬇️ ใช้แทนฟังก์ชัน handleNext เดิมทั้งก้อน (มีใส่ room_request ใน payload)
async function handleNext () {
  const bookingIdFromServer = info.value.booking_id || ''
  const userIdForSave = info.value.user_id || localStorage.getItem('user_id') || ''

  if (!bookingIdFromServer) { alert('ไม่พบเลขที่คำขอ (booking_id)'); return }
  if (!userIdForSave)      { alert('ไม่พบผู้ใช้ที่ทำรายการ (user_id)'); return }

  isLoading.value = true
  try {
    // 1) สร้าง PDF 1 หน้า
    const pdfBlob = await htmlToPdfBlob('pdf-section')
    const pdfUrl  = await uploadPdfBlob(pdfBlob)

    // 2) อัปโหลดไฟล์ที่เพิ่งเลือกในหน้า admin (ถ้ามี)
    const uploadedNow = await uploadTempFilesAndGetUrls()

    // 3) รวมไฟล์เดิม + ไฟล์ใหม่ แล้วแตกเป็น 2 อาร์เรย์ (url / fileName)
    const existing = (fileAttachments.value || []).map(f => ({
      url: f.url, fileName: f.fileName || 'ไฟล์แนบ'
    }))
    const merged = [
      ...existing,
      ...uploadedNow.map(f => ({ url: f.url, fileName: f.fileName || 'ไฟล์แนบ' }))
    ]

    const allAttachments = merged.map(x => x.url).filter(Boolean)
    const allFileNames   = merged.map(x => x.fileName || 'ไฟล์แนบ')

    // 4) โหลด roles เพื่อสร้าง step
    let stepArray = []
    try {
      const resStep = await axios.get(`${API_BASE}/api/settings/approval_roles`)
      const roles = Array.isArray(resStep?.data?.value?.field) ? resStep.data.value.field : []
      const VALID = ['staff', 'admin', 'super']
      stepArray = Array.from(new Set(
        roles.map(r => String(r || '').trim().toLowerCase()).filter(r => VALID.includes(r))
      )).map(r => ({ role: r, approve: null }))
    } catch { stepArray = [] }

    // 5) POST /api/history — เพิ่ม room_request เข้าไปด้วย
    await axios.post(`${API_BASE}/api/history`, {
      user_id: userIdForSave,
      name: info.value.building,
      name_active: info.value.name_activity,
      zone: info.value.zone,
      since: info.value.since,
      uptodate: info.value.uptodate,
      startTime: info.value.since_time,
      endTime: info.value.until_thetime,
      status: 'pending',
      type: 'field',
      agency: info.value.agency,
      booking_id: bookingIdFromServer,

      // แนบไฟล์แบบเดียวกับฝั่ง user
      attachment: allAttachments,
      fileName:   allFileNames,

      date: new Date(),
      proxyStudentName: info.value.proxyStudentName || '',
      proxyStudentId: info.value.proxyStudentId || '',
      bookingPdfUrl: pdfUrl,
      username_form: info.value.username_form || '',
      id_form:       info.value.id_form || '',
      step: stepArray,

      // ฟิลด์อื่น ๆ
      utilityRequest: info.value.utilityRequest || '',
      restroom: info.value.restroom || '',
      facilityRequest: info.value.facilityRequest || '',
      turnon_air: info.value.turnon_air || '',
      turnoff_air: info.value.turnoff_air || '',
      turnon_lights: info.value.turnon_lights || '',
      turnoff_lights: info.value.turnoff_lights || '',
      other: info.value.other || '',
      amphitheater: info.value.amphitheater || '',
      need_equipment: info.value.need_equipment || '',
      room_request: info.value.room_request || '',  // ✅ ใส่เพิ่มตรงนี้

      aw: info.value.aw || '',
      tel: info.value.tel || '',
      reasons: info.value.reasons || '',
      participants: info.value.participants || '',
      requester: info.value.requester || '',
      no_receive: info.value.no_receive || '',
      date_receive: info.value.date_receive || null,
      receiver: info.value.receiver || '',
      fileUrl: info.value.fileUrl || ''
    })

    // 6) ไปขั้นถัดไป
    localStorage.removeItem('field_form_snapshot')
    router.push('/form_field_admin4')
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + (err?.response?.data?.message || err.message))
  } finally {
    isLoading.value = false
  }
}





// ออกจาก route ไปที่อื่นที่ไม่ใช่ flow -> เคลียร์ snapshot
onBeforeRouteLeave((to) => {
  if (!KEEP_ROUTES.includes(to.path)) {
    localStorage.removeItem(SNAP_KEY)
  }
})

// ปิดแท็บ/รีเฟรช -> ถือว่าออกจากหน้า เคลียร์ snapshot
onMounted(() => {
  window.addEventListener('beforeunload', clearSnapshotOnUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', clearSnapshotOnUnload)
})
function clearSnapshotOnUnload() {
  try { localStorage.removeItem(SNAP_KEY) } catch {}
}
</script>

<style scoped>
/* ===== Stepper (เหมือน form_field3) ===== */
.headStepper { position: sticky; top: 60px; z-index: 10; width: 90%; max-width: 900px; margin: 0 auto 16px;
  background: rgba(255,255,255,.85); backdrop-filter: blur(2px); border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,.1);}
.stepper{ display:flex; align-items:center; justify-content:center; padding:20px 20px 52px; border-radius:20px; }
.headStepper-spacer{ display:none; }
.main{ padding-top: var(--topbar-h); }
.step{ position:relative; display:flex; align-items:center; }
.circle{ width:30px; height:30px; border-radius:50%; background:#ccc; transition:background .3s; cursor:pointer; }
.circle.active{ background:#ff4d4f; } .circle.completed{ background:#ff4d4f; opacity:.5; }
.label{ position:absolute; top:45px; left: calc(30px/2); transform: translateX(-50%); font-size:12px; white-space:nowrap; text-align:center; }
.line{ width:80px; height:4px; background:#ccc; margin:0 5px; transition: background .3s; }
.line.filled{ background:#ff4d4f; }

/* ===== Form Container ===== */
.title{ text-align:center; margin-bottom:20px; }
.form-container{ background:#fff; margin:30px auto; padding:40px; width:90%; max-width:900px; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,.1);}
.form-header{ text-align:center; margin-bottom:20px; }
.info-left{ display:flex; align-items:center; gap:12px; margin-top:0; flex-wrap:wrap; }
.form-row{ display:flex; align-items:center; gap:10px; }
.mt-30{ margin-top:30px; } .mt-15{ margin-top:15px; }
.bold{ font-weight:700; }
.line-field{ padding:0 6px; min-width:50px; min-height:20px; max-width:650px; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; display:block; line-height:1.5em; }

/* ===== Utilities table align (เหมือน form_field3) ===== */
.util-table{ border-collapse:collapse; table-layout:fixed; }
.util-table td{ padding:0 4px; height:26px; vertical-align:middle; font-size:15px; }
.util-table .util-label{ white-space:nowrap; }
.util-table .time{ white-space:nowrap; text-align:left; padding-left:0; }
.util-table .sep{ text-align:center; }
.util-table.util-colon-align col.c-label{ width:230px !important; }
.util-table.util-colon-align col.c-colon{ width:12px !important; }
.util-table.util-colon-align col.c-time{ width:74px !important; }
.util-table.util-colon-align col.c-sep{ width:34px !important; }
.util-table.util-colon-align td.colon{ text-align:center; padding:0 2px !important; }
.util-table.util-colon-align td.time,
.util-table.util-colon-align td.restroom-text{ padding-left:2px !important; white-space:nowrap; }
.util-table.util-colon-align .time .since{ margin-right:4px; }

/* ===== Signature tables & style (เหมือน form_field3) ===== */
.avoid-break, .approval-sign-table, .sign-header-table{ page-break-inside: avoid; break-inside: avoid; }
.sign-header-table{ width:100%; border-collapse:collapse; margin-top:16px; table-layout:fixed; }
.sign-header-table td{ padding:14px 10px 12px 10px; font-size:16px; text-align:center; vertical-align:top; word-break:break-word; width:100%; }
.sign-header-table.single-right td{ text-align:right !important; padding-right:0 !important; }
.sign-header-table.single-right .sig-box{ display:block !important; margin-left:auto !important; margin-right:0 !important; text-align:center !important; min-width:320px; }
.sign-line{ --sign-gap:8px; display:grid; grid-template-columns:1fr auto 1fr; align-items:end; column-gap:var(--sign-gap); white-space:nowrap; width:100%; text-align:center; }
.sign-text{ justify-self:end; }
.signature-wrap{ justify-self:center; display:inline-block; }
.signature-img{ height:48px; display:inline-block; vertical-align:bottom; max-width:260px; object-fit:contain; }
.dot-line-inline{ display:inline-block; min-width:200px; }
.sig-under .sig-date{ font-size:13px !important; line-height:1.2; }

/* ตารางเซ็นชื่อ 2 ช่อง */
.approval-sign-table{ width:100%; border-collapse:collapse; table-layout:fixed; background:#fff; margin-bottom:16px; }
.approval-sign-table th, .approval-sign-table td{ border:1px solid #222; font-size:16px; vertical-align:top; padding:0; text-align:left; }
.approval-sign-table.th{ background:#f8f9fa; }
.approval-sign-table.two-cols th, .approval-sign-table.two-cols td{ width:50%; }
.td-inner{ display:flex; flex-direction:column; justify-content:flex-start; height:auto; min-height:160px; padding:12px; box-sizing:border-box; }
.checkbox-line{ display:flex; align-items:center; gap:6px; margin-bottom:6px; min-height:26px; white-space:nowrap; }
.dot-line{ display:inline-block; width:98%; border-bottom:1px dotted #222; height:15px; min-width:60px; vertical-align:middle; }
.dot-line-custom{ flex:1 1 0; border-bottom:1.5px dotted #222; min-width:80px; margin-left:8px; margin-right:6px; height:16px; display:inline-block; }
.line-row{ display:flex; align-items:center; height:22px; margin:2px 0; }
.date-row{ display:flex; align-items:center; height:22px; margin-top:15px !important; justify-content:center !important; }

/* ===== Attachments ===== */
.attached-files-list{ margin-top:8px; max-height:140px; overflow-y:auto; border:1px solid #ccc; border-radius:6px; background:#f9fafb; padding:6px 16px; }
.attached-file-item{ font-size:14px; color:#26577C; padding:3px 0; border-bottom:1px solid #eee; white-space:normal; word-break:break-all; }
.attached-file-item:last-child{ border-bottom:none; }
.attached-file-item a{ color:#048ace; text-decoration:underline; }

/* ===== Buttons ===== */
.button-wrapper{ display:flex; justify-content:space-between; gap:16px; margin-top:30px; }
#btnBack, #btnNext{ font-size:1rem; font-weight:500; padding:.55rem 1.5rem; border:none; border-radius:8px; outline:none; cursor:pointer; transition:background .22s, color .22s, box-shadow .22s; box-shadow:0 1px 6px rgba(0,0,0,.07); }
#btnBack{ background:#6c757d; color:#fff; }
#btnBack:hover{ background:#5a6268; }
#btnNext{ background:#007bff; color:#fff; }

/* ===== Notifications (เหมือน form_field3) ===== */
.notification-dropdown{ position:absolute; right:0; top:38px; background:#fff; border-radius:18px 0 18px 18px; box-shadow:0 8px 24px rgba(27,50,98,.14), 0 2px 4px rgba(33,125,215,.06); min-width:330px; max-width:370px; max-height:420px; overflow-y:auto; z-index:1002; padding:0; border:none; animation: fadeDown .22s; }
@keyframes fadeDown{ 0%{opacity:0; transform:translateY(-24px);} 100%{opacity:1; transform:translateY(0);} }
.notification-dropdown ul{ padding:0; margin:0; list-style:none; }
.notification-dropdown li{ background:linear-gradient(90deg,#f6fafd 88%,#e2e7f3 100%); margin:.2em .8em; padding:.85em 1.1em; border-radius:12px; font-size:1.07rem; font-weight:500; color:#1e2c48; box-shadow:0 2px 8px rgba(85,131,255,.06); display:flex; gap:10px; }
.notification-dropdown li.no-noti{ background:#f2f3f6; color:#a7aab7; justify-content:center; font-style:italic; }
.notification-item.approved{ background:linear-gradient(90deg,#e9fbe7 85%,#cbffdb 100%); border-left:4px solid #38b000; color:#228c22; }
.notification-item.disapproved{ background:linear-gradient(90deg,#ffeaea 85%,#ffd6d6 100%); border-left:4px solid #ff6060; color:#b91423; }
.notification-item.canceled,.notification-item.cancel{ background:linear-gradient(90deg,#f9d7d7 80%,#e26a6a 100%); border-left:4px solid #bb2124; color:#91061a; }
.notification-item.returned{ background:linear-gradient(90deg,#e0f0ff 85%,#b6e0ff 100%); border-left:4px solid #1976d2; color:#1976d2; }
.notification-backdrop{ position:fixed; inset:0; background:transparent; z-index:1001; }
.badge{ background:red; color:#fff; border-radius:50%; padding:2px 6px; font-size:.75rem; margin-left:4px; }

@media (max-width:540px){
  .scroll-x-container{ overflow-x:auto; -webkit-overflow-scrolling:touch; width:100vw; padding:0; }
  .form-container{ min-width:900px; width:900px; max-width:900px; padding:16px 24px !important; border-radius:10px !important; box-sizing:border-box; }
}

/* ===== PDF export tweaks ===== */
.pdf-export{ font-size:16px !important; }
#pdf-section, #pdf-section *{ font-family:'THSarabunNew','Sarabun','Noto Sans Thai',Tahoma,sans-serif !important; letter-spacing:0; }
#pdf-section .bold, #pdf-section b, #pdf-section strong, #pdf-section th{ font-weight:700; }

/* Uniform line spacing block (ตาม baseline) */
#uniform-lines{ --line-gap:10px; line-height:1.35; }
#uniform-lines .form-row, #uniform-lines .block-row, #uniform-lines .util-wrap, #uniform-lines .note-line{ margin-top:var(--line-gap) !important; margin-bottom:0 !important; }
#uniform-lines .form-row.bold:first-of-type{ margin-top:0 !important; }
#uniform-lines .util-table{ margin-top:var(--line-gap) !important; }
#uniform-lines .util-table td{ padding-top:0 !important; padding-bottom:0 !important; height:26px !important; vertical-align:middle; }
#uniform-lines .mt-30, #uniform-lines .mt-15{ margin-top:var(--line-gap) !important; }

/* === ทำหัวตารางให้ตรงกับ form_field3 === */
.approval-sign-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  background: #fff;
  margin-bottom: 16px;
}

.approval-sign-table th,
.approval-sign-table td {
  border: 1px solid #222;         /* เหมือนหน้า form_field3 */
  vertical-align: top;
  padding: 0;                      /* เดี๋ยวคุมหัวแยก */
  font-size: 16px;
  text-align: left;
}

/* หัวตาราง: ให้เหมือน form_field3 เป๊ะ */
.approval-sign-table th {
  text-align: center !important;
  background: #f8f9fa !important;
  font-weight: 700 !important;
  font-size: 16.5px !important;
  padding: 10px 0 !important;
}

/* คอลัมน์กว้างเท่า ๆ กัน */
.approval-sign-table.two-cols th,
.approval-sign-table.two-cols td {
  width: 50%;
}

/* เนื้อในเซลล์ (กล่องลายเซ็น) – ใช้แบบเดียวกับ form_field3 */
.td-inner{
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: auto;
  min-height: 160px;
  padding: 12px;
  box-sizing: border-box;
}

.checkbox-line{ display:flex; align-items:center; gap:6px; margin-bottom:6px; min-height:26px; white-space:nowrap; }
.dot-line{ display:inline-block; width:98%; border-bottom:1px dotted #222; height:15px; min-width:60px; vertical-align:middle; }
.dot-line-custom{ flex:1 1 0; border-bottom:1.5px dotted #222; min-width:80px; margin-left:8px; margin-right:6px; height:16px; display:inline-block; }
.line-row{ display:flex; align-items:center; height:22px; margin:2px 0; }
.date-row{ display:flex; align-items:center; height:22px; margin-top: 15px !important; justify-content: center !important; }

</style>

<style>
/* TH Sarabun (โหลดเฉพาะหน้านี้ก็พอ แต่ใช้ global font-face ได้) */
@font-face{
  font-family:'THSarabunNew';
  src:url('/fonts/THSarabunNew.woff2') format('woff2'),
      url('/fonts/THSarabunNew.woff') format('woff');
  font-weight:400; font-style:normal; font-display:swap;
}
@font-face{
  font-family:'THSarabunNew';
  src:url('/fonts/THSarabunNew-Bold.woff2') format('woff2'),
      url('/fonts/THSarabunNew-Bold.woff') format('woff');
  font-weight:700; font-style:normal; font-display:swap;
}

/* บังคับใช้ฟอนต์ใน pdf-section */
#pdf-section, #pdf-section *{ font-family:'THSarabunNew','Sarabun',Tahoma,sans-serif !important; }

@import '../css/style.css';
</style>