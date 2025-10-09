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
        <router-link to="/edit_equipment" active-class="active"><i class="pi pi-clipboard"></i> แก้ไขอุปกรณ์</router-link>
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> จองสนาม</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <router-link to="/agency_admin" active-class="active"><i class="pi pi-briefcase"></i> หน่วยงาน</router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล</router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
      </nav>
    </aside>

    <div v-if="isMobile && !isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>

    <!-- Main -->
    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <div style="position: relative; display: inline-block;">
            <div v-if="showNotifications" class="notification-backdrop" @click="closeNotifications"></div>
            <button class="notification-btn" @click="toggleNotifications">
              <i class="pi pi-bell"></i>
              <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
            </button>
            <div v-if="showNotifications" class="notification-dropdown">
              <ul>
                <li
                  v-for="(n, i) in notifications.slice(0,10)"
                  :key="n.id || i"
                  :class="['notification-item', n.type || '', { unread: n.timestamp > lastSeenTimestamp }]"
                >
                  {{ n.message }}
                </li>
                <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
              </ul>
            </div>
          </div>
          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- Calendar (Weekly) -->
      <section class="calendar-card compact">
        <div class="cal-head">
          <div class="cal-left">
            <div class="cal-title">{{ fieldName || 'Field' }} – Weekly Schedule</div>
            <div class="cal-sub">{{ formatRangeLabel(weekDays[0], weekDays[6]) }}</div>
          </div>
          <div class="cal-right">
            <button
              v-if="isFieldAdmin"
              class="nav-btn"
              style="width:auto; padding:0 12px; font-weight:700; background:linear-gradient(135deg,#0e7490,#0e7490)"
              @click="openAdminQuickBook"
            >
              <i class="pi pi-plus" style="margin-right:6px"></i> จองพิเศษ
            </button>

            <button class="nav-btn prev" @click="shiftWeek(-1)" aria-label="Previous week">
              <i class="pi pi-angle-left"></i>
            </button>

            <div class="nav-date-wrap">
              <div class="nav-date-display" @click="openDatePicker">
                {{ dateDisplay }}
                <i class="pi pi-calendar" style="margin-left:8px"></i>
              </div>
              <input
                type="date"
                ref="dateInputEl"
                class="nav-date-native"
                :value="dateInputValue"
                lang="th-TH"
                @change="onPickDate($event.target.value)"
              />
            </div>

            <button class="nav-btn next" @click="shiftWeek(1)" aria-label="Next week">
              <i class="pi pi-angle-right"></i>
            </button>
          </div>
        </div>

        <div class="cal-times">
          <div class="day-col-spacer"></div>
          <div class="time-scale" :style="{ '--hours': totalHours }">
            <div v-for="(h, i) in hours" :key="i" class="time-tick">{{ h }}</div>
          </div>
        </div>

        <div class="cal-body">
          <div
            v-for="(d, di) in weekDays"
            :key="di"
            class="cal-row"
            :class="{ 'is-today': sameDay(d, new Date()) }"
            :style="rowStyle(d)"
          >
            <div class="day-col">
              <div class="day-dow">{{ engDow(d.getDay()) }}</div>
              <div class="day-num">{{ String(d.getDate()).padStart(2, '0') }}</div>
              <div class="day-mon">{{ engMonthShort(d.getMonth()) }}</div>
            </div>

            <div class="timeline">
              <div class="hour-columns" :style="{ '--hours': totalHours }">
                <div v-for="i in totalHours" :key="i" class="hour-col"></div>
              </div>

              <div class="booking-layer">
                <div
                  v-for="(bk, bi) in bookingsOfDay(d)"
                  :key="bi"
                  :class="['booking-chip', { narrow: isNarrow(bk) }]"
                  :style="chipStyle(bk)"
                  :title="chipTitle(bk)"
                >
                  <button
                    v-if="isFieldAdmin && bk._adminQuick"
                    class="chip-delete-btn"
                    @click.stop="confirmDeleteAdminQuick(bk)"
                    title="ลบรายการนี้ (จะลบทุกวันใน booking เดียวกัน)"
                    aria-label="ลบรายการนี้"
                  >
                    <i class="pi pi-trash" aria-hidden="true"></i><span class="label">ลบ</span>
                  </button>

                  <div class="chip-inner">
                    <div class="chip-top">
                      <span
                        v-if="fieldHasZones"
                        class="chip-code chip-zone"
                        v-fit-text="{ min: 12, max: 16, step: 0.5 }"
                      >{{ bk.zone || bk.name }}</span>

                      <span
                        v-else
                        class="chip-code"
                        v-fit-text="{ min: 12, max: 16, step: 0.5 }"
                      >{{ bk.name }}</span>

                      <span class="chip-status" :data-status="(bk.status || '').toLowerCase()">
                        {{ mapStatus(bk.status) }}
                      </span>
                    </div>
                    <div class="chip-sub">
                      <span v-fit-text="{ min: 10, max: 14, step: 0.5 }">
                        {{ bk.startTime }}-{{ bk.endTime }}
                      </span>
                    </div>
                  </div>
                </div><!-- /chip -->
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Image + Zone selector -->
      <div class="below-flex">
        <div class="left-column">
          <img :src="currentImage" alt="Field" class="field-image" />
          <div v-if="selectedZoneName" class="zone-overlay-label">{{ selectedZoneName }}</div>
        </div>

        <div class="right-column" @click.self="clearZone" ref="zonePanel">
          <div
            v-if="field && field.hasZone && field.zones && field.zones.length > 0"
            class="zone-selector"
          >
            <p class="zone-label">Select Zone:</p>
            <div class="zone-actions">
              <div class="zone-buttons">
                <button
                  class="zone-btn"
                  @click.stop="selectAllZones"
                  :class="{ active: selectedZoneName === ALL_ZONES_LABEL }"
                >
                  All Zone
                </button>

                <button
                  v-for="(zone, idx) in field.zones"
                  :key="zone._id?.$oid || idx"
                  @click.stop="zone.active !== false && zone.status !== 'ปิด' && selectZone(zone)"
                  :class="{ active: selectedZoneName === zone.name, 'zone-disabled': zone.active === false || zone.status === 'ปิด' }"
                  :disabled="zone.active === false || zone.status === 'ปิด'"
                >
                  <img
                    v-if="zone.image"
                    :src="zone.image"
                    alt="Zone"
                    style="width: 40px; height: 30px; object-fit: cover; border-radius: 4px; margin-right: 8px"
                  />
                  {{ zone.name || `Zone ${idx + 1}` }}
                  <span v-if="zone.active === false || zone.status === 'ปิด'" style="color:#e11d48;font-size:12px;margin-left:4px">(ปิดใช้งาน)</span>
                </button>
              </div>

              <button class="booking-btn" @click="bookZone" :disabled="zoneRequired && !selectedZoneName">
                <i class="pi pi-check-circle" style="margin-right: 8px"></i>
                BOOKING
              </button>
            </div>
          </div>

          <div v-else-if="field">
            <button class="booking-btn" @click="bookZone">
              <i class="pi pi-check-circle" style="margin-right: 8px"></i>
              BOOKING
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel: 0-5391-7820 and 0-5391-7821 |
            Facebook: <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
            Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
          <p>© 2025 Center for Information Technology Services, Mae Fah Luang University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'
import 'flatpickr/dist/flatpickr.min.css'

axios.defaults.withCredentials = true
const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'

const route = useRoute()
const router = useRouter()

/* ---------- state ---------- */
const isSidebarClosed = ref(false)
const isMobile = ref(false)
const currentUser = ref(null)

const fieldName = ref(route.query.fieldName || '')
const field = ref(null)
const selectedZoneName = ref(null)

const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastSeenTimestamp = ref(0)
let polling = null

/* ---------- role ---------- */
const isFieldAdmin = computed(() => {
  const u = currentUser.value
  if (!u) return false
  const roleOk = String(u.role || '').toLowerCase() === 'admin'
  const owns = Array.isArray(u?.managedFields) ? u.managedFields.includes(fieldName.value) : true
  return roleOk && owns
})

/* ---------- sidebar ---------- */
function toggleSidebar(){ isSidebarClosed.value = !isSidebarClosed.value }
function checkMobile(){ isMobile.value = window.innerWidth <= 600 }

/* ---------- notifications ---------- */
function pruneOldNotifications(){
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}
function toggleNotifications(){
  showNotifications.value = !showNotifications.value
  if (showNotifications.value){
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}
function closeNotifications(){ showNotifications.value = false }
function handleClickOutsideNoti(e){
  const dd = document.querySelector('.notification-dropdown')
  const btn = document.querySelector('.notification-btn')
  if (dd && !dd.contains(e.target) && btn && !btn.contains(e.target)) closeNotifications()
}
async function fetchNotifications(){
  try{
    pruneOldNotifications()
    const res = await axios.get(`${API_BASE}/api/history/approve_field`)
    const data = Array.isArray(res.data) ? res.data : []
    const pendings = data.filter(i => i.status === 'pending' && (i.type === 'field' || i.type === 'equipment'))
    if (pendings.length){
      const newMsgs = pendings.map(item => {
        const id = item._id?.$oid || item._id
        const ts = (item.updatedAt && +new Date(item.updatedAt)) ||
                   (item.createdAt && +new Date(item.createdAt)) ||
                   (item.date && +new Date(item.date)) || Date.now()
        return {
          id,
          type: 'pending',
          timestamp: ts,
          message: item.type === 'field'
            ? `สนาม '${item.name}' กำลังรอการอนุมัติ`
            : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
        }
      })
      notifications.value = [...notifications.value, ...newMsgs]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a,b) => b.timestamp - a.timestamp)
      pruneOldNotifications()
    }
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  }catch{}
}

/* ---------- image / zones ---------- */
function resolveImagePath(img){
  if (!img) return '/img/default.png'
  const s = String(img)
  if (s.startsWith('data:image/') || s.startsWith('/img/') || s.startsWith('http')) return s
  if (s.startsWith('/uploads/')) return `${API_BASE}${s}`
  return `/img/${s}`
}
const ALL_ZONES_LABEL = 'ทุกโซน'
const fieldHasZones = computed(() =>
  !!(field.value && field.value.hasZone && Array.isArray(field.value.zones) && field.value.zones.length > 0)
)
const defaultImage = computed(() => field.value ? resolveImagePath(field.value.image) : '/img/default.png')
const currentImage = computed(() => {
  if (fieldHasZones.value && selectedZoneName.value && selectedZoneName.value !== ALL_ZONES_LABEL){
    const found = field.value.zones.find(z => z.name === selectedZoneName.value)
    return found?.image ? resolveImagePath(found.image) : defaultImage.value
  }
  return defaultImage.value
})
const zoneRequired = computed(() => fieldHasZones.value)

function clearZone(){ selectedZoneName.value = null }
function selectZone(zone){ selectedZoneName.value = zone.name }
function selectAllZones(){ selectedZoneName.value = ALL_ZONES_LABEL }
function bookZone(){
  if (zoneRequired.value && !selectedZoneName.value) return alert('กรุณาเลือกโซนก่อนจอง')
  router.push({ path: '/form_field_admin', query: { fieldName: fieldName.value, zone: selectedZoneName.value } })
}

/* ---------- calendar ---------- */
const dateInputEl = ref(null)
function openDatePicker(){
  const el = dateInputEl.value
  if (!el) return
  if (typeof el.showPicker === 'function') el.showPicker()
  else { el.focus(); el.click() }
}

const START_H = 6
const totalHours = 24
const hours = computed(() =>
  Array.from({ length: totalHours }, (_, i) => String((START_H + i) % 24).padStart(2,'0') + ':00')
)

const DEFAULT_COLORS = { border: '#6d4b3b', bg: '#ead7c0' }
const ZONE_PALETTE = [
  { border: '#b91c1c', bg: '#fee2e2' }, { border: '#1d4ed8', bg: '#dbeafe' },
  { border: '#15803d', bg: '#dcfce7' }, { border: '#c2410c', bg: '#ffedd5' },
  { border: '#7c3aed', bg: '#ede9fe' }, { border: '#0f766e', bg: '#ccfbf1' },
  { border: '#be185d', bg: '#fce7f3' }, { border: '#4338ca', bg: '#e0e7ff' },
  { border: '#b45309', bg: '#fef3c7' }, { border: '#0ea5e9', bg: '#e0f2fe' },
  { border: '#65a30d', bg: '#ecfccb' }, { border: '#334155', bg: '#e2e8f0' },
]
function genExtraPalette(n){
  const out=[]; for (let i=0;i<n;i++){ const h=(i*137.508)%360
    out.push({ border:`hsl(${(h+12)%360},60%,35%)`, bg:`hsl(${h},92%,90%)` })
  } return out
}
const zoneColorMap = computed(() => {
  const map = new Map()
  if (!fieldHasZones.value) return map
  const names = (field.value?.zones || []).map(z => z?.name).filter(Boolean).sort((a,b)=>a.localeCompare(b))
  const pal = [...ZONE_PALETTE]
  if (names.length > pal.length) pal.push(...genExtraPalette(names.length - pal.length))
  names.forEach((n,i)=> map.set(n, pal[i]))
  return map
})

function mondayOf(d){ const x=new Date(d); const day=x.getDay()||7; if(day!==1)x.setDate(x.getDate()-(day-1)); x.setHours(0,0,0,0); return x }
const weekStart = ref(mondayOf(new Date()))
const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => new Date(weekStart.value.getFullYear(), weekStart.value.getMonth(), weekStart.value.getDate()+i))
)
function fmtYMD(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}` }
const dateDisplay = computed(() => {
  const d = weekStart.value; return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
})
const dateInputValue = computed(() => fmtYMD(weekStart.value))
function onPickDate(ymd){ if(!ymd) return; const [y,m,d]=ymd.split('-').map(n=>+n); weekStart.value = mondayOf(new Date(y, m-1, d)) }
function shiftWeek(step){ const d=new Date(weekStart.value); d.setDate(d.getDate()+step*7); weekStart.value = mondayOf(d) }

/* utils */
function toLocalDateOnly(d){ if(!d) return null; const x=new Date(d); if(isNaN(x)) return null; x.setHours(0,0,0,0); return x }
function ymd(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function listDatesInclusive(a,b){ const s=toLocalDateOnly(a), e=toLocalDateOnly(b||a); if(!s) return []; const out=[]; const cur=new Date(s); while(cur<=e){ out.push(ymd(cur)); cur.setDate(cur.getDate()+1) } return out }
function normalizeTime(t){ const m=String(t||'').match(/^(\d{1,2}):?(\d{2})$/); if(!m) return '00:00'; const hh=Math.min(23, +m[1]), mm=Math.min(59, +m[2]); return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}` }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate() }
function toMinutes(t){ const [h,m]=String(t).split(':').map(n=>parseInt(n,10)); return (isNaN(h)?0:h)*60+(isNaN(m)?0:m) }
function toAxisMinutes(t){ let m=toMinutes(t); if(m<START_H*60) m+=24*60; return m-START_H*60 }

function dayLayout(dateObj){
  const list = (bookings.value || []).filter(b => {
    if (!b.dateOnly) return false
    const bd = toLocalDateOnly(b.dateOnly)
    return bd && sameDay(dateObj, bd)
  })
  if (list.length === 0) return { items: [], lanes: 1 }

  const zoneGroups = new Map()
  for (const bk of list){
    const key = bk.zone || '(no-zone)'
    if (!zoneGroups.has(key)) zoneGroups.set(key, [])
    zoneGroups.get(key).push(bk)
  }
  const zoneOrder = Array.from(zoneGroups.keys()).sort((a,b)=>a.localeCompare(b))
  const out = []; let laneOffset = 0; const EPS = 0
  for (const key of zoneOrder){
    const arr = zoneGroups.get(key).sort((a,b)=>toAxisMinutes(a.startTime)-toAxisMinutes(b.startTime))
    const laneEnd = []
    for (const bk of arr){
      const s = toAxisMinutes(bk.startTime), e = toAxisMinutes(bk.endTime)
      let use = laneEnd.findIndex(v => s >= v + EPS)
      if (use === -1){ use = laneEnd.length; laneEnd.push(e) } else { laneEnd[use] = e }
      out.push({ ...bk, _lane: laneOffset + use })
    }
    laneOffset += laneEnd.length
  }
  return { items: out, lanes: Math.max(1, laneOffset) }
}
function bookingsOfDay(d){ return dayLayout(d).items }
function rowStyle(d){ return { '--lanes': dayLayout(d).lanes } }
function widthPctOf(bk){ const s=Math.max(0,Math.min(24*60,toAxisMinutes(bk.startTime))), e=Math.max(0,Math.min(24*60,toAxisMinutes(bk.endTime))); const dur=Math.max(15,e-s); return (dur/(24*60))*100 }
function isNarrow(bk){ return widthPctOf(bk) < 6 }
function chipStyle(bk){
  const s=Math.max(0,Math.min(24*60,toAxisMinutes(bk.startTime)))
  const e=Math.max(0,Math.min(24*60,toAxisMinutes(bk.endTime)))
  const dur=Math.max(15,e-s)
  const leftPct = (s/(24*60))*100
  const rawPct  = (dur/(24*60))*100
  const pctMax  = Math.max(0.5, Math.min(100 - leftPct, rawPct))
  const col = fieldHasZones.value ? (zoneColorMap.value.get(bk.zone || bk.name) || DEFAULT_COLORS) : DEFAULT_COLORS
  return {
    left: `calc(${leftPct}% + 1px)`,
    width:`calc(${pctMax}% - 3px)`,
    top:  `calc(var(--layer-pad-y) + ${bk._lane} * var(--lane-h))`,
    '--chip-bg-color': col.bg,
    '--chip-border-color': col.border,
  }
}
function chipTitle(bk){
  const lines = [
    `กิจกรรม: ${bk.name_active || bk.reasons  || bk.title || '-'}`,
    `หน่วยงาน: ${bk.agency || '-'}`,
    `เวลา: ${bk.startTime || '--:--'} - ${bk.endTime || '--:--'}`,
    `สนาม: ${bk.name || fieldName.value || '-'}${bk.zone && bk.zone !== '-' ? ` / โซน: ${bk.zone}` : ''}`,
    `สถานะ: ${mapStatus(bk.status)}`
  ]
  return lines.join('\n')
}
const EN_DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const EN_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function engDow(n){ return EN_DOW[n] }
function engMonthShort(m){ return EN_MON[m] }
function ddmmyyyy(d){ return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` }
function formatRangeLabel(a,b){ return `${ddmmyyyy(a)} - ${ddmmyyyy(b)}` }
function mapStatus(s){
  const t=(s||'').toLowerCase()
  if (t==='approved') return 'Approved'
  if (t==='pending') return 'Pending'
  if (t==='returned') return 'Returned'
  if (t==='disapproved') return 'Disapproved'
  if (t==='cancel' || t==='canceled') return 'Canceled'
  return s || ''
}

/* ---------- data ---------- */
async function loadMe(){
  try{
    const res = await axios.get(`${API_BASE}/api/me`, { withCredentials:true })
    currentUser.value = res.data?.user || null
  }catch{ currentUser.value = null }
}
async function loadField(){
  if (!fieldName.value){ field.value = null; return }
  try{
    const res = await axios.get(`${API_BASE}/api/fields`)
    const found = res.data.find(f => f.name === fieldName.value)
    if (found){
      found.image = resolveImagePath(found.image)
      if (Array.isArray(found.zones)){
        found.zones = found.zones.map(z => ({ ...z, image: resolveImagePath(z.image) }))
      }
      field.value = found
    } else field.value = null
  }catch{ field.value = null }
}
const bookings = ref([])
async function loadBookings(){
  if (!fieldName.value){ bookings.value = []; return }
  try{
    const res = await axios.get(`${API_BASE}/api/history`, { params: { type:'field', name: fieldName.value } })
    const banned = ['cancel','canceled','disapprove','disapproved']
    const rows = (res.data || [])
      .filter(b => (b.type||'').toLowerCase()==='field')
      .filter(b => (b.name||'') === fieldName.value)
      .filter(b => !banned.includes((b.status||'').toLowerCase()))
    const expanded = rows.flatMap(b => {
      const startDateLike = b.since || b.date || b.createdAt
      const endDateLike   = b.uptodate || b.since || b.date || b.createdAt
      const days = listDatesInclusive(startDateLike, endDateLike)
      const base = {
        ...b,
        startTime: normalizeTime(b.startTime || b.start_time),
        endTime:   normalizeTime(b.endTime   || b.end_time),
        _adminQuick: !!b?.specialAdminQuick
      }
      return days.map(ds => ({ ...base, dateOnly: ds }))
    })
    bookings.value = expanded
  }catch{ bookings.value = [] }
}

/* ---------- admin quick booking ---------- */
async function buildInitialStepPending(){
  try{
    const res = await axios.get(`${API_BASE}/api/settings/approval_roles`)
    const roles = res?.data?.value?.field || ['staff','admin','super']
    return roles.map(r => ({ role: r, approve: null, actorName: '', actedAt: null }))
  }catch{
    return [{role:'staff',approve:null},{role:'admin',approve:null},{role:'super',approve:null}]
  }
}

const agencyOptions = ref([])
async function fetchAllAgenciesRobust(){
  const tries = [
    { params: { type: 'agency' } },
    { params: { type: 'equipment' } },
    { params: { type: 'agency,equipment' } },
    { params: undefined },
  ]
  const collected = new Set()
  for (const t of tries){
    try{
      const res = await axios.get(`${API_BASE}/api/information`, { withCredentials:true, ...(t?.params ? { params: t.params } : {}) })
      const arr = (Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.items || []))
        .map(x => (x?.agency ?? x?.unit ?? x?.name ?? x?.title ?? x?.label ?? '').toString().trim())
        .filter(Boolean)
      for (const n of arr) collected.add(n)
    }catch{}
  }
  return Array.from(collected).sort((a,b)=>a.localeCompare(b,'th'))
}

async function openAdminQuickBook(){
  if (!isFieldAdmin.value) return Swal.fire('สิทธิ์ไม่พอ','ฟังก์ชันนี้สำหรับผู้ดูแลสนามเท่านั้น','warning')

  const zoneList = (field.value?.hasZone && Array.isArray(field.value?.zones)) ? field.value.zones : []
  const hasZones = zoneList.length > 0

  const html = `
    <div class="aqb2-form">
      <h2 class="aqb2-title">จองพิเศษ</h2>

      <div class="aqb2-row">
        <label class="aqb2-label">ชื่อกิจกรรม</label>
        <div class="aqb2-field">
          <input id="q_title" class="aqb2-input" placeholder="เช่น ซ้อมกีฬา, กิจกรรมสาขา" autocomplete="off">
        </div>
      </div>

      <div class="aqb2-row">
        <label class="aqb2-label">หน่วยงาน</label>
        <div class="aqb2-field aqb2-agency">
          <input id="q_agency" class="aqb2-input" placeholder="พิมพ์เพื่อค้นหา หรือกรอกชื่อหน่วยงาน" autocomplete="off">
          <ul id="q_agency_list" class="aqb2-agency-list" hidden></ul>
        </div>
      </div>

      <div class="aqb2-row">
        <label class="aqb2-label">ช่วงวันที่</label>
        <div class="aqb2-field">
          <input id="q_daterange" class="aqb2-input" placeholder="เลือกช่วงวันที่" autocomplete="off">
        </div>
      </div>

      <div class="aqb2-row">
        <label class="aqb2-label">ช่วงเวลา</label>
        <div class="aqb2-field aqb2-range">
          <div class="aqb2-icon-input">
            <input id="q_start" type="time" class="aqb2-input time-input" step="300" value="08:00">
            <button type="button" class="aqb2-icon-btn" aria-label="เลือกเวลาเริ่ม"><i class="pi pi-clock"></i></button>
          </div>
          <span class="aqb2-sep">-</span>
          <div class="aqb2-icon-input">
            <input id="q_end" type="time" class="aqb2-input time-input" step="300" value="12:00">
            <button type="button" class="aqb2-icon-btn" aria-label="เลือกเวลาสิ้นสุด"><i class="pi pi-clock"></i></button>
          </div>
        </div>
      </div>

      ${hasZones ? `
      <div class="aqb2-row">
        <label class="aqb2-label">โซน</label>
        <div class="aqb2-field">
          <select id="q_zone" class="aqb2-input">
            <option value="">— เลือกโซน —</option>
            <option value="${ALL_ZONES_LABEL}">${ALL_ZONES_LABEL}</option>
            ${zoneList
              .filter(z => z?.status !== 'ปิด' && z?.active !== false)
              .map(z => `<option value="${z.name}">${z.name}</option>`).join('')}
          </select>
        </div>
      </div>` : ``}
    </div>
  `

  const { value: form } = await Swal.fire({
    title: '',
    html,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก',
    buttonsStyling: false,
    customClass: { popup: 'aqb2-popup', confirmButton: 'aqb2-btn aqb2-btn-primary', cancelButton: 'aqb2-btn aqb2-btn-secondary', actions: 'aqb2-actions' },
    didOpen: async () => {
      // agency dropdown (บนพอร์ทัล body)
      const $inp = document.getElementById('q_agency')
      const $portal = document.createElement('ul')
      $portal.className = 'aqb2-portal'; $portal.hidden = true; document.body.appendChild($portal)

      const placeList = () => {
        const r = $inp.getBoundingClientRect()
        const vwBottom = window.innerHeight - r.bottom
        const listH = Math.min(260, $portal.scrollHeight || 260)
        $portal.style.width = r.width + 'px'
        $portal.style.left  = (r.left + window.scrollX) + 'px'
        $portal.style.top   = (vwBottom >= listH + 12)
          ? (r.bottom + 6 + window.scrollY) + 'px'
          : (Math.max(6, r.top - listH - 6) + window.scrollY) + 'px'
      }
      const render = (items=[]) => {
        if (!items.length){ $portal.hidden = true; $portal.innerHTML = ''; return }
        $portal.innerHTML = items.map(n => `<li data-v="${n}">${n}</li>`).join('')
        $portal.hidden = false; placeList()
        $portal.querySelectorAll('li').forEach(li => {
          li.addEventListener('mousedown', e => { e.preventDefault(); $inp.value = li.getAttribute('data-v') || ''; $portal.hidden = true })
        })
      }
      const filter = (q) => {
        const s = (q||'').trim().toLowerCase()
        if (!s) return render(agencyOptions.value.slice(0,50))
        render(agencyOptions.value.filter(n => n.toLowerCase().includes(s)).slice(0,50))
      }
      $inp.addEventListener('focus', () => { filter($inp.value); placeList() })
      $inp.addEventListener('input', () => filter($inp.value))
      $inp.addEventListener('blur',  () => setTimeout(()=>{ $portal.hidden = true }, 150))
      const relayout = () => { if (!$portal.hidden) placeList() }
      window.addEventListener('scroll', relayout, true)
      window.addEventListener('resize', relayout)
      $inp.__aqbCleanup = () => { window.removeEventListener('scroll', relayout, true); window.removeEventListener('resize', relayout); $portal.remove() }

      // date range (flatpickr)
      const { default: flatpickr } = await import('flatpickr')
      const $dr = document.getElementById('q_daterange')
      const today = new Date()
      const toYMD = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      $dr._fp = flatpickr($dr, {
        mode: 'range', dateFormat: 'Y-m-d', altInput: true, altFormat: 'd/m/Y',
        defaultDate: [toYMD(today), toYMD(today)], clickOpens: true, allowInput: true, locale: { rangeSeparator: ' - ' }
      })
      $dr.addEventListener('focus', () => { $dr._fp && $dr._fp.open() })
      $dr.addEventListener('click', () => { $dr._fp && $dr._fp.open() })

      // time pickers open on icon/box click
      document.querySelectorAll('.aqb2-icon-input').forEach(box => {
        const input = box.querySelector('input[type="time"]')
        const btn   = box.querySelector('.aqb2-icon-btn')
        const openPicker = () => { if (input && typeof input.showPicker === 'function') input.showPicker(); else if (input) input.focus() }
        box.addEventListener('click', (e) => { if (e.target.tagName !== 'INPUT') openPicker() })
        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); openPicker() })
      })
    },
    willClose: () => {
      const $inp = document.getElementById('q_agency')
      if ($inp?.__aqbCleanup) $inp.__aqbCleanup()
    },
    preConfirm: () => {
      const title  = document.getElementById('q_title').value.trim()
      const agency = document.getElementById('q_agency').value.trim()
      const start  = document.getElementById('q_start').value
      const end    = document.getElementById('q_end').value
      const zoneEl = document.getElementById('q_zone')
      const zone   = zoneEl ? (zoneEl.value || '') : ''

      const $dr = document.getElementById('q_daterange')
      const fp  = $dr && $dr._fp
      const sel = fp ? fp.selectedDates : []
      const sinceDate   = sel[0] || null
      const uptodateRaw = sel[1] || sel[0] || null
      const toYMD = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

      if (!title)  return Swal.showValidationMessage('กรุณากรอกชื่อกิจกรรม')
      if (!agency) return Swal.showValidationMessage('กรุณาระบุหน่วยงาน')
      if (!sinceDate || !uptodateRaw) return Swal.showValidationMessage('กรุณาเลือกช่วงวันที่')
      if (!start || !end) return Swal.showValidationMessage('กรุณาเลือกเวลา')

      return { title, agency, since: toYMD(sinceDate), uptodate: toYMD(uptodateRaw), start, end, zone }
    }
  })
  if (!form) return

  try{
    const bookingId = `${Date.now()}_${currentUser.value?._id || 'admin'}`
    const step = await buildInitialStepPending()
    await axios.post(`${API_BASE}/api/history/admin-quick-field`, {
      type:'field',
      name: fieldName.value,
      zone: form.zone || '-',
      status:'pending',
      since: new Date(form.since),
      uptodate: new Date(form.uptodate),
      startTime: form.start,
      endTime: form.end,
      agency: form.agency,
      reasons: form.title,
      requester: 'Admin Quick Booking',
      user_id: currentUser.value?._id || '',
      booking_id: bookingId,
      specialAdminQuick: true,
      step
    })
    Swal.fire('สำเร็จ','เพิ่มจองพิเศษแล้ว','success')
    await loadBookings()
  }catch(e){
    console.error(e); Swal.fire('ผิดพลาด','บันทึกไม่สำเร็จ','error')
  }
}

async function confirmDeleteAdminQuick(bk){
  if (!bk?.booking_id) return
  const out = await Swal.fire({
    title: 'ลบรายการนี้',
    html: `<div style="text-align:left">
      <p style="margin:0 0 6px">การลบนี้จะลบ <b>ทุกวัน</b> ของ booking เดียวกัน</p>
      <ul style="margin:0 0 6px; padding-left:18px">
        <li>สนาม: <b>${bk.name}</b></li>
        <li>โซน: <b>${bk.zone || '-'}</b></li>
        <li>เวลา: ${bk.startTime}-${bk.endTime}</li>
      </ul>
    </div>`,
    icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบทั้งหมด', cancelButtonText: 'ยกเลิก'
  })
  if (!out.isConfirmed) return
  try{
    await axios.delete(`${API_BASE}/api/history/admin-quick-field/${encodeURIComponent(bk.booking_id)}`)
    Swal.fire('ลบแล้ว','ลบรายการจองพิเศษเรียบร้อย','success')
    await loadBookings()
  }catch(e){ console.error(e); Swal.fire('ผิดพลาด','ลบไม่สำเร็จ','error') }
}

/* ---------- directive: v-fit-text ---------- */
const vFitText = {
  mounted(el, binding){
    const opt = { min: 10, max: 16, step: 0.5, ...(binding?.value || {}) }
    const apply = () => {
      el.style.whiteSpace = 'nowrap'
      el.style.lineHeight = '1.1'
      el.style.fontSize = opt.max + 'px'
      let size = opt.max
      while (size > opt.min && el.scrollWidth > el.clientWidth){
        size -= opt.step
        el.style.fontSize = size + 'px'
      }
    }
    el.__fitTextApply = apply
    const ro = new ResizeObserver(apply)
    el.__fitTextRO = ro
    ro.observe(el)
    requestAnimationFrame(apply)
  },
  updated(el){ el.__fitTextApply && el.__fitTextApply() },
  unmounted(el){
    el.__fitTextRO && el.__fitTextRO.disconnect()
    delete el.__fitTextRO
    delete el.__fitTextApply
  }
}

/* ---------- click outside zones ---------- */
const zonePanel = ref(null)
function handleClickOutsideZones(e){
  if (!selectedZoneName.value) return
  const p = zonePanel.value
  if (!p) return
  const inside = p.contains(e.target)
  if (inside || e.target.closest('.booking-btn')) return
  selectedZoneName.value = null
}

/* ---------- lifecycle ---------- */
onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutsideNoti)
  document.addEventListener('click', handleClickOutsideZones, true)
  checkMobile(); window.addEventListener('resize', checkMobile)

  lastSeenTimestamp.value = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0')

  await loadField()
  await loadMe()
  await loadBookings()
  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)

  try{ agencyOptions.value = await fetchAllAgenciesRobust() }catch{ agencyOptions.value = [] }
})
onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
  document.removeEventListener('mousedown', handleClickOutsideNoti)
  document.removeEventListener('click', handleClickOutsideZones, true)
  window.removeEventListener('resize', checkMobile)
})

/* ---------- watch field in query ---------- */
watch(() => route.query.fieldName, async (v) => {
  fieldName.value = v || ''
  selectedZoneName.value = null
  await loadField()
  await loadBookings()
})
</script>

<style scoped>
/* ===== Calendar core ===== */
.calendar-card{
  position: relative; margin: 12px 16px 6px; padding: 12px 12px 8px;
  background:#fff; border-radius:16px; box-shadow:0 6px 22px rgba(0,0,0,.08);
  --chip-h:40px; --chip-pad-y:4px; --chip-border:2px; --lane-gap:6px; --layer-pad-y:4px;
  --chip-outer-h: calc(var(--chip-h) + (2 * var(--chip-pad-y)) + (2 * var(--chip-border)));
  --lane-h: calc(var(--chip-outer-h) + var(--lane-gap));
}
.cal-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:10px; margin-bottom:4px }
.cal-title{ font-weight:800; font-size:1.05rem; color:#1e2c48 }
.cal-sub{ color:#6b7280; font-size:.9rem }
.cal-head .cal-right{ display:flex; align-items:center; gap:12px }
.cal-head .nav-btn{
  display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; padding:0;
  border:none; border-radius:10px; color:#fff; background:linear-gradient(135deg, #304674, #304674);
  box-shadow:0 2px 8px rgba(0,0,0,.08); cursor:pointer; transition:transform .06s, box-shadow .2s, filter .2s;
}
.cal-head .nav-btn:hover{ filter:brightness(1.05); box-shadow:0 4px 12px rgba(0,0,0,.12) }
.cal-head .nav-btn:active{ transform:translateY(1px) scale(.98) }

.cal-times{ display:flex; align-items:center; padding:4px 0 6px 0 }
.day-col-spacer{ width:86px; flex:0 0 auto }
.time-scale{ display:grid; grid-template-columns:repeat(var(--hours), minmax(0,1fr)); width:100% }
.time-tick{ display:flex; align-items:center; justify-content:center; font-size:.72rem; color:#42526e }

.cal-body{ border-top:1px solid #e6eef7 }
.cal-row{
  display:flex;
  min-height: calc((var(--lane-h) * var(--lanes)) + (2 * var(--layer-pad-y)));
  border-bottom:1px solid #e6eef7; background:#fbfdff; --lanes:1;
}
.day-col{
  width:86px; flex:0 0 auto; padding:4px 4px; text-align:center;
  display:flex; flex-direction:column; align-items:center; justify-content:center; row-gap:2px;
}
.day-dow{ color:#2b3f72; font-weight:700; font-size:.9rem }
.day-num{ font-weight:900; font-size:1.2rem; color:#1f2937; letter-spacing:.5px }
.day-mon{ color:#94a3b8; font-size:.72rem }

.timeline{ position:relative; flex:1; background:#fff; overflow:visible; isolation:isolate }
.hour-columns{ position:absolute; inset:0; display:grid; grid-template-columns:repeat(var(--hours), minmax(0,1fr)); z-index:0; pointer-events:none }
.hour-col{ border-left:1px solid #ecf2fa }
.hour-col:last-child{ border-right:1px solid #ecf2fa }
.booking-layer{ position:relative; height:100%; z-index:2; padding:var(--layer-pad-y) 0 }

/* booking chip */
.booking-chip{
  position:absolute; height:var(--chip-outer-h);
  background:var(--chip-bg-color, #ead7c0); border:var(--chip-border) solid var(--chip-border-color, #6d4b3b);
  border-radius:8px; display:flex; align-items:center; padding:var(--chip-pad-y) 10px; box-sizing:border-box; overflow:hidden; z-index:3;
}
.chip-inner{ display:flex; flex-direction:column; line-height:1.1; width:100% }
.chip-top{ display:flex; justify-content:space-between; align-items:center; gap:8px; white-space:nowrap }
.chip-code{ min-width:0; overflow:hidden; text-overflow:ellipsis; flex:1 1 auto }
.chip-status{ flex-shrink:0; font-size:.72rem; padding:2px 6px; border-radius:999px; border:1px solid var(--chip-border-color,#6d4b3b); background:#ffffffa8; white-space:nowrap; margin-left:8px }
.chip-sub{ font-size:.9rem; color:#4b382db0; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.booking-chip.narrow{ padding:var(--chip-pad-y) 6px }
.booking-chip.narrow .chip-top{ gap:4px }
.booking-chip.narrow .chip-status{ display:none }
.booking-chip.narrow .chip-sub{ font-size:.78rem }
.chip-zone{ color:var(--chip-border-color,#6d4b3b); font-weight:900 }
.chip-status[data-status="pending"]{ background:#e5e7eb; border-color:#6b7280; color:#374151 }
.chip-status[data-status="approved"]{ background:#dcfce7; border-color:#16a34a; color:#166534 }

/* today */
.cal-row.is-today{ background:#f4f7ff }
.cal-row.is-today .day-num,
.cal-row.is-today .day-dow{ color:#1d4ed8 }

/* date picker */
.nav-date-wrap{ position:relative; width:160px; height:32px }
.nav-date-display{
  position:absolute; inset:0; z-index:3; border:1px solid #cbd5e1; background:#fff; border-radius:10px;
  display:flex; align-items:center; justify-content:center; gap:8px; padding:4px 8px; color:#111827; cursor:pointer;
}
.nav-date-native{ position:absolute; inset:0; z-index:1; width:100%; height:100%; opacity:0; pointer-events:none }

/* image + zone */
.below-flex{ display:flex; flex-wrap:wrap; gap:2rem; padding:12px 20px 20px; background:#dbe9f4 }
.left-column{ flex:1 1 60%; max-width:60%; position:relative; min-height:480px }
.right-column{ flex:1 1 35%; max-width:35%; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:480px }
.field-image{ width:100%; max-width:800px; height:480px; object-fit:cover; background:#fff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,.1); display:block; margin:0 auto }
.zone-overlay-label{ position:absolute; top:16px; left:16px; background:rgba(0,123,255,.86); color:#fff; padding:10px 22px; font-size:1.05rem; font-weight:800; border-radius:18px; box-shadow:0 3px 10px rgba(60,60,100,.08); z-index:5; pointer-events:none; letter-spacing:1px }
.zone-selector{ width:100%; text-align:center; display:flex; flex-direction:column; align-items:center }
.zone-label{ font-weight:800; font-size:1.2rem; margin-bottom:12px }
.zone-actions{ display:flex; flex-direction:column; align-items:center; gap:10px }
.zone-buttons{ display:flex; flex-direction:column; align-items:center; gap:10px; width:100% }
.zone-buttons button{
  padding:12px 16px; border:1px solid #007bff; background:#fff; color:#007bff; border-radius:8px; cursor:pointer; transition:.2s;
  min-width:120px; width:180px; max-width:100%; display:flex; align-items:center;
}
.zone-buttons .zone-btn{ justify-content:center; font-weight:800 }
.zone-buttons button.active, .zone-buttons button:hover{ background:#007bff; color:#fff }
.zone-buttons button.zone-disabled, .zone-buttons button:disabled{ background:#f4f4f4 !important; color:#aaa !important; border-color:#bbb !important; cursor:not-allowed !important; opacity:.7 }
.booking-btn{
  margin-top:14px; padding:14px 50px; font-size:1.2rem; border:none; background:linear-gradient(135deg, #304674, #304674);
  color:#fff; border-radius:999px; font-weight:700; cursor:pointer; transition:.3s; box-shadow:0 4px 12px rgba(0,0,0,.25); letter-spacing:1px;
}
.booking-btn:disabled{ background:#aaa; cursor:not-allowed; box-shadow:none }

/* chip delete (compact) */
.booking-chip .chip-delete-btn{
  position:absolute; top:-6px; right:-6px; width:24px; height:24px; padding:0; border:2px solid #fff; border-radius:999px;
  background:#ef4444; color:#fff; font-weight:800; font-size:13px; line-height:1; cursor:pointer;
  box-shadow:0 4px 10px rgba(239,68,68,.28); z-index:5; transition:width .12s, padding .12s, border-radius .12s, transform .06s, box-shadow .2s, filter .15s;
}
.booking-chip .chip-delete-btn i{ font-size:13px }
.booking-chip .chip-delete-btn .label{ display:none }
.booking-chip .chip-delete-btn:hover,
.booking-chip .chip-delete-btn:focus{ width:auto; height:26px; padding:3px 8px; border-radius:999px; box-shadow:0 6px 14px rgba(239,68,68,.35); outline:none }
.booking-chip .chip-delete-btn:hover .label,
.booking-chip .chip-delete-btn:focus .label{ display:inline; margin-left:6px; font-size:12px }
.booking-chip.narrow .chip-delete-btn{ width:22px; height:22px; padding:0 }
.booking-chip.narrow .chip-delete-btn:hover,
.booking-chip.narrow .chip-delete-btn:focus{ width:22px; height:22px; padding:0 }
.booking-chip.narrow .chip-delete-btn .label{ display:none !important }

@media (max-width: 900px){
  .left-column{ flex:1 1 100%; max-width:100% }
  .right-column{ flex:1 1 100%; max-width:100%; min-height:auto; padding-bottom:10px }
  .time-tick{ font-size:.8rem }
}

/* notifications & overlay */
.notification-dropdown { position:absolute; right:0; top:38px; background:#fff; border-radius:18px 0 18px 18px; box-shadow:0 8px 24px rgba(27,50,98,.14),0 2px 4px rgba(33,125,215,.06); min-width:330px; max-width:370px; max-height:420px; overflow-y:auto; z-index:1002; padding:0; border:none; animation: fadeDown .22s }
.sidebar-overlay { position:fixed; inset:0; background:rgba(0,0,0,.22); z-index:1999 }
.sidebar { z-index:2000 }
</style>

<style>
/* ===== SweetAlert for THIS page only – namespaced by .aqb2-popup & .aqb2-portal ===== */

/* popup wrapper from customClass.popup: 'aqb2-popup' */
.aqb2-popup { padding: 18px 22px 20px !important; border-radius: 16px; }

/* ซ่อน title เฉพาะป๊อปอัปนี้ เท่านั้น */
.aqb2-popup .swal2-title{ display:none !important }

/* เนื้อหาในป๊อปอัปนี้เท่านั้น */
.swal2-container .aqb2-popup .swal2-html-container{
  text-align:initial !important;
  overflow:visible !important;
  max-height:none !important;
}

/* ฟอร์มด้านในป๊อปอัปนี้เท่านั้น */
.aqb2-popup .aqb2-form{
  display:grid; grid-template-columns:140px 1fr; row-gap:14px; column-gap:18px;
}
.aqb2-popup .aqb2-row{ display:contents }
.aqb2-popup .aqb2-label{ grid-column:1/2; font-weight:700; color:#1f2937; align-self:center; font-size:18px }
.aqb2-popup .aqb2-field{ grid-column:2/3 }
.aqb2-popup .aqb2-input{
  width:100%; height:48px; padding:10px 14px; border-radius:12px; border:1px solid #d1d5db; background:#fff;
  box-sizing:border-box; font-size:16px; color:#111827; transition: box-shadow .12s ease, border-color .12s ease;
}
.aqb2-popup .aqb2-input::placeholder{ color:#9aa3ad }
.aqb2-popup .aqb2-input:focus{ outline:none; border-color:#111827; box-shadow: inset 0 0 0 3px #111827 }
.aqb2-popup .aqb2-range{ display:grid; grid-template-columns:1fr 48px 1fr; column-gap:12px; align-items:center }
.aqb2-popup .aqb2-sep{ display:inline-flex; align-items:center; justify-content:center }

.aqb2-popup .aqb2-actions{
  display:flex !important; justify-content:center !important; gap:15px !important; margin-top:18px !important
}
.aqb2-popup .aqb2-btn{ height:46px; padding:0 22px; border-radius:14px; font-weight:800; font-size:15px; border:none }
.aqb2-popup .aqb2-btn-primary{ background:#24406f; color:#fff }
.aqb2-popup .aqb2-btn-secondary{ background:#6b7280; color:#fff }
.aqb2-popup .aqb2-title{
  grid-column:1 / -1; justify-self:center; text-align:center !important; margin:6px 0 18px !important; font-weight:900; font-size:30px; color:#222
}

/* ไอคอน-ปุ่มเลือกเวลา/วันที่ */
.aqb2-popup .aqb2-icon-input{ position:relative }
.aqb2-popup .aqb2-icon-input .aqb2-icon-btn{
  position:absolute; right:8px; top:50%; transform:translateY(-50%); width:32px; height:32px; border:0; background:transparent; cursor:pointer; padding:0;
}
.aqb2-popup .aqb2-icon-input .aqb2-icon-btn i{ font-size:1.05rem; color:#6b7280 }

/* จำกัดเฉพาะ input ภายในป๊อปอัปนี้ */
.aqb2-popup .aqb2-input[type="date"],
.aqb2-popup .aqb2-input[type="time"]{ -webkit-appearance:none; appearance:none; padding-right:44px }
.aqb2-popup .aqb2-input[type="date"]::-webkit-calendar-picker-indicator,
.aqb2-popup .aqb2-input[type="time"]::-webkit-calendar-picker-indicator{ opacity:0; -webkit-appearance:none; appearance:none; cursor:pointer }
.aqb2-popup .aqb2-input[type="time"]::-webkit-calendar-picker-indicator{ pointer-events:auto }

/* ===== Agency dropdown portal – unique to THIS page ===== */
.aqb2-portal{
  position:fixed; left:0; top:0; width:260px; max-height:260px; overflow-y:auto; overflow-x:hidden;
  margin:0; padding:6px 0; list-style:none; background:#fff; border:1px solid #e5e7eb; border-radius:8px;
  box-shadow:0 10px 24px rgba(0,0,0,.14); z-index:2147483647;
}
.aqb2-portal li{ padding:8px 12px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.aqb2-portal li:hover{ background:#f3f4f6 }

/* อย่า import global จาก component นี้ (จะชนทั้งแอป) */
/* @import '../css/style.css';  <-- ลบหรือย้ายไปไฟล์ global ของแอป */
</style>

