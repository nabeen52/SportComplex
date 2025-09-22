<template>
  <div class="layout">
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/approve_field_super" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <router-link to="/history_super" active-class="active"><i class="pi pi-history"></i> ประวัติการทำรายการ</router-link>
      </nav>
    </aside>

    <div
      v-if="!isSidebarClosed && isMobile"
      class="sidebar-overlay"
      @click="isSidebarClosed = true"
    ></div>

    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <div style="position: relative;">
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
                  :class="['notification-item', noti.type || '', { unread: noti.timestamp > lastSeenTimestamp }]"
                >
                  {{ noti.message }}
                </li>
                <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
              </ul>
            </div>
          </div>
          <router-link to="/profile_super"><i class="pi pi-user"></i></router-link>
        </div>
      </header>



      <div style="margin-top: 50px;">
      <h1 style="display: flex; justify-content: center;">History</h1>
      <!-- ===================== ตารางประวัติที่ฉันอนุมัติ ===================== -->
      <div class="history-table-container" v-if="paginatedHistories.length">
        <table class="history-table">
          <thead>
            <tr>
              <th>Transaction date</th>
              <th>Activity Name</th>
              <th>Time</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(group, gi) in paginatedHistories"
              :key="group[0].booking_id || group[0].id || gi"
            >
              <td>{{ formatDate(getTxnDate(group[0])) }}</td>


              <!-- รายการ: ถ้า equipment รวมชื่อหลายชิ้น / ถ้า field แสดงชื่อกิจกรรม -->
              <td class="item-name">
                <template v-if="(group[0].type || '').toLowerCase() === 'equipment'">
                  {{ joinItemNames(group) }}
                </template>
                <template v-else>
                  {{ group[0].name_active || group[0].name || '-' }}
                </template>
              </td>

              <!-- เวลา-->
              <td class="item-amount">
                {{ getTimeRange(group) }}
              </td>


              <td>
                <span class="status-label" :class="statusClass(group[0].status)">
                  {{ statusTitle(group[0].status) }}
                </span>
              </td>

              <td>
                <button class="remark-btn" @click="detailGroup(group)">
                  รายละเอียด
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- กรณีไม่พบข้อมูล -->
      <div class="history-table-container" v-else>
      <div style="text-align:center;padding:24px">ไม่มีรายการของคุณ</div>

      </div>

      <!-- แถบควบคุมหน้า -->
      <div class="pagination-control" style="margin-top: 12px;">
        <button @click="prevPage" :disabled="currentPage === 1">Back</button>
        <span>Pages {{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
      </div>
    </div>


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
</template>

<script setup>
/**
 * History Super (เฉพาะสนาม/field)
 * - โชว์เฉพาะรายการที่ "ฉันเป็นผู้กด" (เทียบอีเมลก่อน, ถ้าไม่มีค่อยเทียบ id)
 * - สถานะที่ถือว่า "กดแล้ว": approved/approve/approved-super/disapproved/reject/rejected/cancelled/...
 * - ส่วน "รายละเอียด" และคอลัมน์ "Time": ดึง "ผู้ขอใช้ / รหัสพนักงาน / วันที่ใช้ / เวลา" จาก **ฟอร์มที่ส่งมาอนุมัติ** เป็นหลัก
 */

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const API_BASE = import.meta.env.VITE_API_BASE

// ========================= State =========================
const histories = ref([])

const isSidebarClosed = ref(false)
const announcement = ref("")
const showAnnouncementBar = ref(false)

const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set()) // เผื่ออนาคตต้องใช้
const polling = ref(null)

const filterStatus = ref('') // '', 'approved', 'disapproved'
const isMobile = ref(window.innerWidth <= 600)
const lastSeenTimestamp = ref(0)

const currentPage = ref(1)
const itemsPerPage = ref(5)

// ========================= Helpers (IDs / Emails) =========================
function normalizeId(v) {
  const raw = v && v.$oid ? v.$oid : v
  const s = (raw == null) ? '' : String(raw)
  return s.trim()
}
function normalizeEmail(val) {
  if (!val) return ''
  if (typeof val === 'string') return val.trim().toLowerCase()
  if (typeof val === 'object') {
    const cand = val.email || val.mail || val.username || ''
    return String(cand).trim().toLowerCase()
  }
  return String(val).trim().toLowerCase()
}

function getMyId() {
  const fromLoose = String(
    localStorage.getItem('super_id') ||
    localStorage.getItem('admin_id') ||
    localStorage.getItem('user_id')  ||
    localStorage.getItem('id')       ||
    ''
  ).trim()

  const tryJson = (k) => {
    try {
      const j = JSON.parse(localStorage.getItem(k) || 'null')
      return normalizeId(j?._id?.$oid || j?._id || j?.id)
    } catch { return '' }
  }
  const fromUser = tryJson('user') || tryJson('profile') || tryJson('account')
  return normalizeId(fromLoose || fromUser)
}

function getMyEmail() {
  const loose = String(
    localStorage.getItem('super_email') ||
    localStorage.getItem('admin_email') ||
    localStorage.getItem('user_email')  ||
    localStorage.getItem('email')       ||
    ''
  ).trim().toLowerCase()

  const tryJsonEmail = (k) => {
    try {
      const j = JSON.parse(localStorage.getItem(k) || 'null')
      return String(j?.email || j?.mail || '').trim().toLowerCase()
    } catch { return '' }
  }
  const fromUser = tryJsonEmail('user') || tryJsonEmail('profile') || tryJsonEmail('account')
  return (loose || fromUser || '').toLowerCase()
}

// เป็น “การกระทำของฉัน” สำหรับสนาม: พยายามเทียบอีเมลก่อน ถ้าไม่มีค่อยเทียบ id
function isFieldActionByMe(h, myEmail, myId) {
  if (!h) return false

  const emailCandidates = [
    h.superApprovedByEmail, h.approvedBySuperEmail, h.headApprovedByEmail,
    h.approvedBy2Email, h.approver2Email,
    h.approvedByEmail,
    h.disapprovedByEmail,
    h.returnedByEmail,
    h.superApprovedBy?.email, h.approvedBySuper?.email, h.headApprovedBy?.email,
    h.approvedBy2?.email, h.approver2?.email,
    h.approvedBy?.email,
    h.disapprovedBy?.email,
    h.returnedBy?.email,
  ].map(normalizeEmail).filter(Boolean)

  if (myEmail && emailCandidates.length && emailCandidates.includes(normalizeEmail(myEmail))) {
    return true
  }

  const idCandidates = [
    h.superApprovedById, h.approvedBySuperId, h.headApprovedById,
    h.approvedBy2Id, h.approver2Id,
    h.approvedById,
    h.disapprovedById,
    h.returnedById,
  ].map(normalizeId).filter(Boolean)

  if (myId && idCandidates.length && idCandidates.includes(normalizeId(myId))) {
    return true
  }

  return false
}

// ========================= FORM RESOLVER (ใช้ "ฟอร์มที่ส่งมาอนุมัติ" จริง) =========================
function _isNil(v){ return v===null || v===undefined }
function _str(v){ return _isNil(v)? '' : String(v) }
function _nonEmpty(v){ return _str(v).trim() !== '' && !['null','undefined'].includes(_str(v).trim().toLowerCase()) }
function _json(v){ try{ return typeof v==='string' ? JSON.parse(v) : (typeof v==='object'? v : null) } catch{ return null } }
function _flatForm(o){
  if(!o||typeof o!=='object') return o
  const out={...o}
  for(const k of ['values','data','payload','form','value']){
    if(o[k] && typeof o[k]==='object'){
      for(const [kk,vv] of Object.entries(o[k])) if(_isNil(out[kk])||!_nonEmpty(out[kk])) out[kk]=vv
    }
  }
  return out
}
function _collectForms(h){
  const cans=[]
  const push=(x)=>{ const o=_json(x); if(o&&typeof o==='object') cans.push(_flatForm(o)) }

  // ปกติ
  push(h.form); push(h.formData); push(h.form_field); push(h.formFields); push(h.form_values)
  push(h.requestForm); push(h.bookingForm); push(h.payload?.form); push(h.data?.form); push(h.meta?.form)
  push(h.superForm); push(h.superApprovalForm); push(h.formSuper); push(h.approvedBySuper?.form)
  push(h.request?.form); push(h.booking?.form)

  // อาร์เรย์ของขั้นตอน
  if(Array.isArray(h.forms))        h.forms.forEach(push)
  if(Array.isArray(h.formHistory))  h.formHistory.forEach(push)
  if(Array.isArray(h.approvals))    h.approvals.forEach(a=>{ push(a?.form); push(a?.payload); push(a?.data) })
  if(Array.isArray(h.logs))         h.logs.forEach(a=>{ push(a?.form); push(a?.payload); push(a?.data) })

  // ไล่คีย์ที่มี form/request/payload
  try{
    for(const [k,v] of Object.entries(h)){
      if(/form|request|payload/i.test(String(k))) push(v)
    }
  }catch{}

  const nest=['data','meta','context','additional','extra']
  for(const p of nest){
    const o=h?.[p]
    if(o && typeof o==='object'){
      for(const [k,v] of Object.entries(o)){
        if(/form|request|payload/i.test(String(k))) push(v)
      }
    }
  }
  return cans.filter(Boolean)
}
function _scoreForm(o){
  let s=0
  const has=(...keys)=>keys.some(k=>_nonEmpty(o?.[k]))
  if(has('requester','requesterName','fullname','full_name','employee_id','emp_id')) s+=2
  if(has('useDate','date_use','bookingDate','date','since','startDate')) s+=2
  if(has('startTime','start_time','endTime','end_time','time','timeRange')) s+=1
  const dump = JSON.stringify(o).toLowerCase()
  if(dump.includes('request')||dump.includes('submit')) s+=1
  return s
}
/** เลือกฟอร์มที่ "น่าจะเป็นตัวที่ส่งมาอนุมัติ" มากที่สุด */
function resolveFieldForm(h){
  const forms=_collectForms(h)
  if(!forms.length) return {}
  forms.sort((a,b)=>_scoreForm(b)-_scoreForm(a))
  return forms[0] || {}
}
function pickFirst(...vals){
  for(const v of vals){
    if(_isNil(v)) continue
    if(Array.isArray(v)){ if(v.length) return v[0] }
    const s=_str(v).trim()
    if(s!=='') return s
  }
  return ''
}
function fromForm(h, keyList=[], fallbackList=[]){
  const F=resolveFieldForm(h)
  const first = (ks,obj)=>pickFirst(...ks.map(k=>{
    const parts=String(k).split('.'); let cur=obj
    for(const p of parts){ if(_isNil(cur)) return ''; cur=cur[p] }
    return cur
  }))
  const v = first(keyList, F)
  if(_nonEmpty(v)) return v
  return first(fallbackList, h)
}

/* ===== Getter ที่ใช้ค่าจากฟอร์มเป็นหลัก (ยังคงไว้เพื่อ fallback) ===== */
function getFormRequester(h){
  return fromForm(h,
    ['requesterName','requester','fullName','full_name','fullname','employee_name','user.name','contactName','applicantName','person_name','student_name','staff_name'],
    ['formRequester','form_requester','requester','requesterName','fullname','name','user.name']
  )
}
function getFormEmpId(h){
  return fromForm(h,
    ['employee_id','employeeId','emp_id','empId','emp_code','employeeCode','staff_id','staffId','user.employeeId','user.empId','user.staffId','student_id'],
    ['formEmployeeId','form_employee_id','employee_id','emp_id','staff_id','user_id','user.employeeId','user.staffId']
  )
}
function parseDateFlexible(v){
  if(!v) return null
  if(v instanceof Date){ return isNaN(v)?null:v }
  if(typeof v==='number'){ const d=new Date(v); return isNaN(d)?null:d }
  const s=String(v).trim()
  let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if(m){
    let d=parseInt(m[1],10), mo=parseInt(m[2],10), y=parseInt(m[3],10)
    if(y>2400) y-=543
    const dt=new Date(y,mo-1,d)
    return isNaN(dt)?null:dt
  }
  const d2=new Date(s)
  return isNaN(d2)?null:d2
}
function formatDateTH(raw){
  const dt=parseDateFlexible(raw)
  if(!dt) return '-'
  return dt.toLocaleDateString('th-TH',{year:'numeric',month:'2-digit',day:'2-digit'})
}
function getFormDateVal(h){
  return fromForm(h,
    ['useDate','date_use','bookingDate','bookDate','requestDate','date','since','day','startDate'],
    ['formDate','form_date','date','since']
  )
}
function _splitTimeRangeMaybe(raw){
  const s=_str(raw)
  const mm=s.match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/)
  return mm? [mm[1],mm[2]] : []
}
function getFormStart(h){
  const fromRange=fromForm(h,['time','timeRange','use_time','useTime','time_range'],[])
  if(_nonEmpty(fromRange)){ const [a]=_splitTimeRangeMaybe(fromRange); if(_nonEmpty(a)) return a }
  return fromForm(h,
    ['startTime','start_time','start','timeStart','from','slot.start','schedule.start'],
    ['formStartTime','form_start_time','startTime','start_time','start']
  )
}
function getFormEnd(h){
  const fromRange=fromForm(h,['time','timeRange','use_time','useTime','time_range'],[])
  if(_nonEmpty(fromRange)){ const [,b]=_splitTimeRangeMaybe(fromRange); if(_nonEmpty(b)) return b }
  return fromForm(h,
    ['endTime','end_time','end','timeEnd','to','slot.end','schedule.end'],
    ['formEndTime','form_end_time','endTime','end_time','end']
  )
}
function formatTimeTH(t){
  if(!t) return '-'
  const s=String(t).trim().replace(/\s*น\.?$/i,'')
  const m=s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if(m) return `${m[1].padStart(2,'0')}:${m[2]} น.`
  const dt=new Date(`1970-01-01T${s}`); if(!isNaN(dt)){
    const hhmm=dt.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',hour12:false})
    return `${hhmm} น.`
  }
  return `${s} น.`
}
function formatTimeRangeTH(a,b){
  const A=formatTimeTH(a), B=formatTimeTH(b)
  if(A==='-'&&B==='-') return '-'
  if(A!=='-'&&B!=='-') return `${A} - ${B}`
  return A!=='-'?A:B
}

// ใช้ในคอลัมน์ Time ของตาราง (ดึงจากฟอร์มเป็นหลัก)
function getTimeRange(group) {
  const head = (group && group[0]) || {}
  const s = getFormStart(head)
  const e = getFormEnd(head)
  return formatTimeRangeTH(s, e)
}

// สำหรับคอลัมน์ Transaction date (เป็นวันที่ "ธุรกรรม/อัปเดต" ของรายการ)
function formatDate(dateVal) {
  if (!dateVal) return '-'
  const d = (dateVal instanceof Date) ? dateVal : new Date(dateVal)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
function getTxnDate(h = {}) {
  const pick = (val) => {
    if (!val) return null
    const d = new Date(val)
    return isNaN(d) ? null : d
  }
  const order = [
    h.returnedAt, h.return_at, h.returnDate,
    h.superApprovedAt, h.approvedAtSuper, h.approvedAt2,
    h.approvedAt,
    h.disapprovedAt,
    h.updatedAt,
    h.date, h.since,
  ]
  for (const v of order) {
    const d = pick(v)
    if (d) return d
  }
  return null
}

// ========================= สถานะ / คลาส / อื่นๆ =========================
function statusTitle(s='') {
  const m = String(s).toLowerCase()
  if (m === 'approved' || m === 'approve' || m === 'approved-super') return 'ถูกอนุมัติ'
  if (['disapproved','reject','rejected','disapproved-super','cancelled','canceled'].includes(m)) return 'ไม่ถูกอนุมัติ'
  if (m === 'returned') return 'รับคืนอุปกรณ์แล้ว'
  if (m === 'pending') return 'รอดำเนินการ'
  if (m === 'return-pending') return 'รอรับคืน'
  return s || '-'
}
function statusClass(s='') {
  const m = String(s).toLowerCase()
  return {
    'status-approved': ['approved','approve','approved-super'].includes(m),
    'status-returned': m === 'returned',
    'status-disapproved': ['disapproved','reject','rejected','disapproved-super','cancelled','canceled'].includes(m),
    'status-pending': m === 'pending',
    'status-return-pending': m === 'return-pending',
  }
}
function joinItemNames(group) {
  return group.map(i => i.name).filter(Boolean).join(', ')
}
function calcQty(group) {
  return group.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
}

// ========================= เลขาฯ / แจ้งเตือน (สำหรับแถบบน) =========================
function hasSecretaryMeta(h) {
  const hasBy   = typeof h?.approvedBy === 'string' ? h.approvedBy.trim() !== '' : !!h?.approvedBy
  const hasById = typeof h?.approvedById === 'string' ? h.approvedById.trim() !== '' : !!h?.approvedById
  const hasAt   = !!h?.approvedAt
  return hasBy && hasById && hasAt
}
function isSuperPending(h) {
  return String(h?.type || '').toLowerCase() === 'field'
      && String(h?.status || '').toLowerCase() === 'pending'
      && hasSecretaryMeta(h)
}

// ========================= UI handlers =========================
function toggleSidebar() { isSidebarClosed.value = !isSidebarClosed.value }
function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('staff_lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function getDisplayItems(group) {
  const cleaned = group.filter(it => (it.status || '').toLowerCase() !== 'return-pending')
  const returnedOnly = cleaned.filter(it => (it.status || '').toLowerCase() === 'returned')
  return returnedOnly.length ? returnedOnly : cleaned
}
function pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
  notifications.value = (notifications.value || []).filter(n => (n?.timestamp ?? 0) >= cutoff)
}
function toggleFilter(status) { filterStatus.value = (filterStatus.value === status ? '' : status) }
function clearFilter() { filterStatus.value = '' }
function checkMobile() {
  isMobile.value = window.innerWidth <= 600
  if (isMobile.value) isSidebarClosed.value = true
}
function closeNotifications() { showNotifications.value = false }

// ========================= Notifications (fetch) =========================
async function fetchNotifications() {
  try {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
    notifications.value = (notifications.value || []).filter(n => (n?.timestamp ?? 0) >= cutoff)

    const res = await axios.get(`${API_BASE}/api/history/approve_field`)
    const raw = Array.isArray(res.data) ? res.data : []

    const pendings = raw.filter(h => isSuperPending(h))

    const toTs = (v) => {
      if (!v) return 0
      const s = String(v).trim()
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y,m,d] = s.split('-').map(Number)
        return new Date(y, m - 1, d).getTime() || 0
      }
      const t = new Date(s).getTime()
      return isNaN(t) ? 0 : t
    }

    const notis = pendings.map(h => {
      const id  = h._id?.$oid || h._id || h.booking_id || Math.random().toString(36).slice(2)
      const ts  = toTs(h.updatedAt) || toTs(h.createdAt) || toTs(h.date) || Date.now()
      const zone = h.zone && h.zone !== '-' ? ` (โซน: ${h.zone})` : ''
      let msg = `สนาม '${h.name || '-'}'${zone} รออนุมัติ`
      return { id: `field_${id}`, type: 'field', timestamp: ts, message: msg }
    })

    const seen = new Set()
    const unique = []
    for (const n of notis) {
      if (seen.has(n.id)) continue
      seen.add(n.id)
      unique.push(n)
    }
    unique.sort((a,b) => b.timestamp - a.timestamp)

    notifications.value = unique
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch (_) { /* เงียบไว้ */ }
}

// ========================= รายละเอียด (SweetAlert) =========================
function detailGroup(group) {
  const head = group[0] || {}
  const type = String(head.type || '').toLowerCase()

  const esc = (s) => String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>')

  // ===== FIELD (ดึงจากตัวแปรที่กำหนด) =====
  if (type !== 'equipment') {
    // ใช้ตัวแปรที่กำหนดเป็นหลัก (ไม่ยุ่งคีย์อื่น) พร้อม fallback เล็กน้อยเฉพาะวันที่สิ้นสุด
    const requester = head.username_form || '-'           // ผู้ขอใช้
    const empId     = head.id_form       || '-'           // รหัสพนักงาน

    const dateSince = head.since || null                  // วันที่เริ่มใช้งาน
    const dateUpto  = head.uptodate ?? head.UpToDate ?? head.upToDate ?? null // วันที่สิ้นสุด (รองรับหลายสะกด)

    // แสดงเป็นช่วงถ้ามีทั้งคู่
    const dateUseStr = (dateSince || dateUpto)
      ? (dateSince && dateUpto
          ? `${formatDateTH(dateSince)} - ${formatDateTH(dateUpto)}`
          : formatDateTH(dateSince || dateUpto))
      : '-'

    const startUse  = head.startTime || null              // เวลาเริ่ม
    const endUse    = head.endTime   || null              // เวลาสิ้นสุด
    const timeRange = formatTimeRangeTH(startUse, endUse)

    Swal.fire({
      title: 'รายละเอียดรายการ (สนาม/สถานที่)',
      html: `
        <div class="swal-table-wrap">
          <table class="swal-table kv-table">
            <tbody>
              <tr><th style="width:220px;text-align:left">กิจกรรม/โครงการ</th><td>${esc(head.name_active || '-')}</td></tr>
              <tr><th style="text-align:left">สนาม/อาคาร</th><td>${esc(head.name || '-')}</td></tr>
              <tr><th style="text-align:left">โซน</th><td>${esc(head.zone || '-')}</td></tr>
              <tr><th style="text-align:left">ผู้ขอใช้</th><td>${esc(requester)}</td></tr>
              <tr><th style="text-align:left">รหัสพนักงาน</th><td>${esc(empId)}</td></tr>
              <tr><th style="text-align:left">วันที่ใช้</th><td>${esc(dateUseStr)}</td></tr>
              <tr><th style="text-align:left">เวลา</th><td>${esc(timeRange)}</td></tr>
              <tr><th style="text-align:left">สถานะ</th><td>${esc(statusTitle(head.status))}</td></tr>
              <tr><th style="text-align:left">หมายเหตุ</th><td>${esc(head.remark || '-')}</td></tr>
            </tbody>
          </table>
        </div>
      `,
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#3085d6',
      width: '900px',
      customClass: {
        container: 'mfu-swal-center',
        popup: 'mfu-swal',
        htmlContainer: 'mfu-swal-body'
      },
    })
    return
  }

  // ===== EQUIPMENT (คงไว้เผื่ออนาคต) =====
  const toUrl = (val) => {
    if (!val) return null
    const s = String(val)
    if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:')) return s
    if (s.startsWith('/')) return s
    try {
      const base = (API_BASE || '').replace(/\/+$/,'')
      return base ? `${base}/${s.replace(/^\/+/, '')}` : s
    } catch { return s }
  }

  const cleaned = group.filter(it => (String(it.status || '').toLowerCase() !== 'return-pending'))
  const returnedOnly = cleaned.filter(it => (String(it.status || '').toLowerCase() === 'returned'))
  const itemsToShow = returnedOnly.length ? returnedOnly : cleaned

  const rows = itemsToShow.map((item, idx) => {
    const imgUrl = toUrl(
      item.attachment ||
      item.returnAttachment ||
      item.return_photo ||
      item.returnImage ||
      (Array.isArray(item.attachments) ? item.attachments[0] : null) ||
      (Array.isArray(item.images) ? item.images[0] : null) ||
      item.image ||
      item.photo ||
      null
    )
    const photoCell = imgUrl
      ? `<img src="${imgUrl}" class="swal-thumb" alt="แนบรูป"
             onclick="window.__showFullReturnPhoto && window.__showFullReturnPhoto('${imgUrl}')">
         <div class="swal-thumb-hint">(คลิกรูปเพื่อดูเต็ม)</div>`
      : '-'

    return `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td class="nowrap">${esc(item.name)}</td>
        <td style="text-align:center">${esc(item.quantity)}</td>
        <td>${esc(item.requester || '-')}</td>
        <td>${esc(item.user_id || '-')}</td>
        <td>${esc(formatDateTH(item.date))}</td>
        <td>${esc(statusTitle(item.status))}</td>
        <td>${esc(item.returnedAt ? formatDateTH(item.returnedAt) : '-')}</td>
        <td style="text-align:center">${photoCell}</td>
        <td>${esc(item.remark || '-')}</td>
      </tr>`
  }).join('')

  const GAP  = 24
  const MAXW = 1400
  const popupW = Math.min(Math.max(window.innerWidth - GAP*2, 360), MAXW)

  Swal.fire({
    title: 'รายละเอียดรายการ',
    html: `
      <div class="swal-table-wrap">
        <table class="swal-table">
          <thead>
            <tr>
              <th style="width:56px;text-align:center">ลำดับ</th>
              <th>อุปกรณ์</th>
              <th style="width:90px;text-align:center">จำนวน</th>
              <th style="width:160px">ผู้ขอใช้</th>
              <th style="width:160px">รหัสพนักงาน</th>
              <th style="width:120px">วันที่ขอยืม</th>
              <th style="width:150px">สถานะ</th>
              <th style="width:130px">วันที่คืน</th>
              <th style="width:150px;text-align:center">รูป</th>
              <th style="width:160px">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="10" style="text-align:center">ไม่มีรายการ</td></tr>`}</tbody>
        </table>
      </div>
    `,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3085d6',
    width: popupW + 'px',
    customClass: {
      container: 'mfu-swal-center',
      popup: 'mfu-swal',
      htmlContainer: 'mfu-swal-body'
    }
  })
}

// ========================= Computed (group / paging) =========================
const groupedHistories = computed(() => {
  const groups = {}
  histories.value.forEach(item => {
    const t  = String(item.type || '').toLowerCase()
    if (t !== 'field') return
    const key = `field_${item.id || item.booking_id || Math.random()}`
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })

  let arr = Object.values(groups)
    .filter(g => g.length > 0)
    .sort((a, b) => {
      const da = getTxnDate(a[0]) || new Date(0)
      const db = getTxnDate(b[0]) || new Date(0)
      return db - da
    })

  const allow = new Set(['approved','disapproved','approve','reject','rejected','approved-super','disapproved-super','cancelled','canceled'])
  arr = arr.filter(group => allow.has(String(group[0].status || '').toLowerCase()))

  if (filterStatus.value) {
    arr = arr.filter(group => (group[0].status || '').toLowerCase() === filterStatus.value)
  }
  return arr
})

const totalPages = computed(() => Math.ceil(groupedHistories.value.length / itemsPerPage.value) || 1)
const paginatedHistories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end   = start + itemsPerPage.value
  return groupedHistories.value.slice(start, end)
})

// ========================= Lifecycle =========================
onMounted(async () => {
  try {
    const myEmail = getMyEmail()
    const myId    = getMyId()

    const res  = await axios.get(`${API_BASE}/api/history`)
    const data = Array.isArray(res.data) ? res.data : []

    const allowField = new Set(['approved','disapproved','approve','reject','rejected','approved-super','disapproved-super','cancelled','canceled'])

    histories.value = data
      .filter(h => {
        const t = String(h.type || '').toLowerCase()
        const status = String(h.status || '').toLowerCase()
        if (t !== 'field') return false
        if (!allowField.has(status)) return false
        return isFieldActionByMe(h, myEmail, myId)
      })
      .sort((a, b) => {
        const da = getTxnDate(a) || new Date(0)
        const db = getTxnDate(b) || new Date(0)
        return db - da
      })
      // เก็บเอกสารทั้งก้อน เพื่อให้ตัว resolver ฟอร์มเข้าถึงข้อมูลได้ครบ
      .map((h, idx) => ({ id: h._id?.$oid || h._id || idx + 1, ...h }))

    console.debug('[history_super:mine]', {
      myEmail, myId, all: data.length, kept: histories.value.length,
      sampleFieldKeys: Object.keys((data.find(x => String(x.type||'').toLowerCase()==='field') || {}))
    })
  } catch (err) {
    histories.value = []
    console.error('โหลดข้อมูล history super (mine) ไม่สำเร็จ:', err)
  }

  try {
    const annRes = await axios.get(`${API_BASE}/api/announcement`)
    announcement.value = annRes.data?.announce || ""
    showAnnouncementBar.value = !!announcement.value
  } catch (err) {
    announcement.value = ""
    showAnnouncementBar.value = false
  }

  lastSeenTimestamp.value = parseInt(localStorage.getItem('staff_lastSeenTimestamp') || '0')

  await fetchNotifications()
  polling.value = setInterval(fetchNotifications, 30000)
  window.addEventListener('resize', checkMobile)
})

onBeforeUnmount(() => {
  if (polling.value) clearInterval(polling.value)
  window.removeEventListener('resize', checkMobile)
})

// ========================= Watchers =========================
watch(filterStatus, () => { currentPage.value = 1 })
watch(groupedHistories, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})
</script>

<style scoped>
/* ใช้สไตล์ของคุณเดิมทั้งหมดได้เลย */


.histbody {
  width: 100%;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  overflow-x: hidden;
}
.hist-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 70px;
}
.hist-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  padding: 1rem 1.5rem;
  width: 100%;
}
.hist-row {
  display: grid;
  grid-template-columns: 200px 160px 80px auto;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}
.item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-amount {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
.item-date {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #222;
}
.status-group {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
  min-width: 190px;
}
.status-text {
  display: inline-block;
  min-width: 70px;
}
.remark-btn {
  background-color: #213555;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 14px;
  cursor: pointer;
  margin-left: 8px;
  font-size: 0.95rem;
  transition: background 0.2s;
}
.remark-btn:hover { background-color: #4268a3; }

.announcement-bar { /* ...คงเดิม... */ }

.notification-dropdown { /* ...คงเดิม... */ }
.notification-dropdown ul { padding: 0 18px; margin: 0; }
.notification-dropdown li { list-style: none; padding: 10px 0; border-bottom: 1px solid #eaeaea; word-break: break-word; }
.notification-dropdown li:last-child { border-bottom: none; }
.notification-btn { background: none; border: none; cursor: pointer; font-size: 1.4rem; position: relative; margin-right: 8px; }
.badge { position: absolute; top: 1px; right: 3px; background: #e11d48; color: white; border-radius: 8px; padding: 1px 8px; font-size: 0.83rem; font-weight: bold; min-width: 20px; text-align: center; z-index: 10; }
.notification-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: transparent; z-index: 1400; }

.history-table-container { overflow-x: auto; margin: 1rem 70px 2rem 70px; }
.history-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  font-size: 1rem;
}
.history-table th, .history-table td {
  padding: 0.7rem 1rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}
.history-table th { background: #1e3a8a; color: #fff; font-weight: 600; }
.history-table tr:last-child td { border-bottom: none; }

.status-label{
  display: inline-flex; align-items: center; justify-content: center;
  width: 180px; min-width: 180px; height: 32px; padding: 0 12px;
  border-radius: 999px; font-weight: 700; font-size: 1rem; white-space: nowrap;
  box-sizing: border-box; border-width: 1.5px; border-style: solid; text-align: center; flex: 0 0 180px;
}
.status-approved   { background:#d0f8ce !important; color:#259b24 !important; border-color:#90caf9; }
.status-returned   { background:#e3f2fd !important; color:#1565c0 !important; border-color:#64b5f6; }
.status-disapproved{ background:#fff3cd !important; color:#e84e40 !important; border-color:#ffe082; }
.status-pending    { background:#e3f2fd !important; color:#1976d2 !important; border-color:#90caf9; }
.status-return-pending { background:#f6d365 !important; color:#444 !important; border-color:#ffe082; }

.pagination-control {
  display: flex; justify-content: center; align-items: center; margin: 16px 0 8px 0; gap: 8px;
}
.pagination-control button {
  background: #1d4ed8; color: #fff; border: none; border-radius: 8px; padding: 6px 16px;
  font-weight: 600; cursor: pointer; transition: background 0.2s;
}
.pagination-control button:disabled { background: #e5e7eb; color: #6b7280; cursor: not-allowed; }

@media (max-width: 420px){
  .status-label{ width:auto; min-width:140px; flex:0 0 auto; }
}
@media (max-width: 640px){
  .histbody{ padding: 12px 0; }
  .history-table-container{ margin: 8px 8px 14px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .history-table{ min-width: 760px; table-layout: fixed; }
  .history-table th, .history-table td{ padding: 8px 10px; font-size: .92rem; }
  .history-table th:nth-child(1), .history-table td:nth-child(1){ min-width: 110px; }
  .history-table th:nth-child(2), .history-table td:nth-child(2){
    min-width: 240px; text-align: left; white-space: normal; word-break: break-word;
  }
  .history-table th:nth-child(3), .history-table td:nth-child(3){ min-width: 80px; }
  .history-table th:nth-child(4), .history-table td:nth-child(4){ min-width: 170px; }
  .history-table th:nth-child(5), .history-table td:nth-child(5){ min-width: 110px; }
}

/* จัด footer ให้อยู่กึ่งกลาง และให้ความกว้างภายในเท่ากับคอนเทนต์หลัก */
.foot{
  display: flex;
  justify-content: center;  /* จัดศูนย์บล็อกภายใน */
  align-items: center;
}

.foot .footer-left{
  width: 100%;
  max-width: 1200px;        /* กันยืดกว้างเกินไป */
  text-align: center;       /* จัดกลางข้อความ */ 
  box-sizing: border-box;
  padding-left: 200px;
  font-size:110%;
}

/* ให้ขอบซ้าย-ขวาเท่ากับคอนเทนต์ (70px) บนเดสก์ท็อป */
@media (min-width: 641px){
  .foot .footer-left{
    margin-left: 70px;
    margin-right: 70px;
    max-width: calc(100% - 140px);
  }
}
/* ===================== FIX: History table row separators ===================== */
/* ใช้กับ .history-table เท่านั้น ไม่แตะสไตล์ส่วนอื่น */

/* ========== Simple fix: ใช้เส้นล่างจากเซลล์ทุกช่อง แถวสุดท้ายไม่ต้องมี ========== */
.history-table{
  width: 100%;
  table-layout: fixed;       /* ให้คอลัมน์คงที่ เส้นพาดตรง */
  border-collapse: collapse; /* รวมเส้นเป็นเส้นเดียวทั้งแถว */
}

.history-table th,
.history-table td{
  border: none;              /* เคลียร์เส้นเดิม */
  padding: 0.7rem 1rem;
  text-align: center;
  vertical-align: middle;
}

/* วาดเส้นล่างจากแต่ละเซลล์ => เส้นตรงทั้งแถว */
.history-table tbody td{
  border-bottom: 1px solid #e2e8f0;
}
/* แถวสุดท้ายไม่ต้องมีเส้น */
.history-table tbody tr:last-child td{
  border-bottom: none;
}

/* คอลัมน์เวลา/วันที่ เป็น table-cell ปกติ (ไม่ใช้ flex) เพื่อไม่ให้เส้นเพี้ยน */
.history-table .item-amount,
.history-table .item-date{
  display: table-cell !important;
  text-align: center;
  vertical-align: middle;
  margin: 0;
  padding: 0.7rem 1rem;
}

</style>

<style>
@import '../css/style.css';

/* === SweetAlert (global) === */
.mfu-swal{ max-width: none !important; width: 100% !important; font-size: 1rem; }
.mfu-swal-body{ text-align: left; }
.swal2-container.mfu-swal-center{ display:flex !important; align-items:center !important; justify-content:center !important; padding:0 !important; }
.swal2-container.mfu-swal-center .swal2-popup{ margin:0 !important; }
.mfu-swal .swal-table-wrap{
  max-height: 70vh;
  overflow: auto;
  border: none;
  padding: 0;
}
.mfu-swal .swal-table{ width: 100%; min-width: 0; table-layout: auto; }
.mfu-swal .swal-table th:nth-child(2),
.mfu-swal .swal-table td:nth-child(2),
.mfu-swal .swal-table .nowrap{ white-space: nowrap; word-break: keep-all; }
@media (max-width: 1280px){
  .mfu-swal .swal-table th, .mfu-swal .swal-table td{ padding: 8px 10px; }
}

.mfu-swal .kv-table{
  width: 100%;
  border-collapse: separate;   /* ต้องใช้ separate เพื่อทำ radius ได้สวย */
  border-spacing: 0;
  border: 1px solid #d1d5db;   /* กรอบนอกคล้าย approve_field */
  border-radius: 12px;
  background: #fff;
  overflow: hidden;            /* ตัดมุมให้โค้งจริง */
}

/* ชิดซ้ายเฉพาะตาราง key-value ของรายละเอียดสนาม */
.mfu-swal .kv-table th,
.mfu-swal .kv-table td{
  text-align: left !important;
  padding: 12px 16px;
  font-size: 1rem;
  border-top: 1px solid #e5e7eb;  /* เส้นคั่นแต่ละแถว */
}

.mfu-swal .kv-table tr:first-child th,
.mfu-swal .kv-table tr:first-child td{
  border-top: 0;                 /* แถวแรกไม่ต้องมีเส้นบน */
}

.mfu-swal .kv-table td{
  color: #374151;                /* สีตัวอักษรฝั่งค่า */
}
.mfu-swal .kv-table th{
  width: 260px;                  /* ใกล้เคียง approve_field */
  background: #f3f4f6;           /* คอลัมน์ซ้ายพื้นสีอ่อน */
  color: #111827;
  font-weight: 700;
  white-space: nowrap;
}

</style>