<template>
  <div class="layout">
    <!-- ========== Sidebar ========== -->
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

    <!-- ========== Main ========== -->
    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <!-- Bell -->
          <div style="position: relative;">
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

      <!-- ===== Calendar comes first ===== -->
      <!-- cal-head คงเดิมได้ แต่เพิ่มป้ายช่วงวันที่แบบ pill -->
<section class="calendar-card compact">
  <div class="cal-head">
    <div class="cal-left">
      <div class="cal-title">{{ fieldName || 'Field' }} – Weekly Schedule</div>
      <div class="cal-sub">{{ formatRangeLabel(weekDays[0], weekDays[6]) }}</div>
    </div>
    <div class="cal-right">
  <button class="nav-btn prev" @click="shiftWeek(-1)" aria-label="Previous week">
    <i class="pi pi-angle-left"></i>
  </button>

<div class="nav-date-wrap">
  <!-- กล่องที่เห็น: ให้คลิกได้ -->
  <div class="nav-date-display" @click="openDatePicker">
    {{ dateDisplay }}
    <i class="pi pi-calendar" style="margin-left:8px"></i>
  </div>

  <!-- input จริง ซ่อนแต่ยังอยู่ใน DOM -->
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



  <!-- แถบเวลาแนวนอน: ใส่ style ตัวแปร --hours ให้เท่ากับจำนวนคอลัมน์จริง -->
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
      <!-- สลับลำดับแสดงผลด้วย CSS (ให้ดูเหมือนภาพที่ 3: วันย่อ > เลขวัน > เดือน) -->
      <div class="day-col">
  <div class="day-dow">{{ engDow(d.getDay()) }}</div>
  <div class="day-num">{{ String(d.getDate()).padStart(2, '0') }}</div>
  <div class="day-mon">{{ engMonthShort(d.getMonth()) }}</div>
</div>

      <div class="timeline">
        <!-- เส้นกริดแนวตั้ง: ใส่ --hours -->
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
</div>

        </div>
      </div>
    </div>
  </div>
</section>


      <!-- ===== Image + Zone selector (equal height) ===== -->
      <div class="below-flex">
        <!-- Left: image -->
        <div class="left-column">
          <img :src="currentImage" alt="Field" class="field-image" />
          <div v-if="selectedZoneName" class="zone-overlay-label">{{ selectedZoneName }}</div>
        </div>

        <!-- Right: zones -->
        <div class="right-column" @click.self="clearZone">
          <div
  v-if="field && field.hasZone && field.zones && field.zones.length > 0"
  class="zone-selector"
  ref="zonePanel"            
>

            <p class="zone-label">Select Zone:</p>
            <div class="zone-actions">
 <div class="zone-buttons">
    <!-- NEW: All Zone button same style as others -->
    <button
      class="zone-btn"
      @click.stop="selectAllZones"
      :class="{ active: selectedZoneName === ALL_ZONES_LABEL }"
    >
      All Zone
    </button>

    <!-- เดิม: ปุ่มแต่ละโซน -->
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
            Tel: 0-5391-7820 and 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
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

const API_BASE = import.meta.env.VITE_API_BASE
const route = useRoute()
const router = useRouter()

/* ---------- state ---------- */
const isSidebarClosed = ref(false)
const products = ref([])
const field = ref(null)
const selectedZoneName = ref(null)

// === NEW: label สำหรับ "ทุกโซน"
const ALL_ZONES_LABEL = 'ทุกโซน'


function selectAllZones () {
  selectedZoneName.value = ALL_ZONES_LABEL
}
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const lastCheckedIds = new Set()
let polling = null
const lastSeenTimestamp = ref(parseInt(localStorage.getItem('lastSeenTimestamp') || '0'))

const fieldName = ref(route.query.fieldName || '')
// ย่อฟอนต์อัตโนมัติให้ข้อความพอดีกับความกว้างของตัวเอง
const vFitText = {
  mounted(el, binding) {
    const opt = { min: 10, max: 16, step: 0.5, ...(binding?.value || {}) }
    const apply = () => {
      // reset ก่อนคำนวณ
      el.style.whiteSpace = 'nowrap'
      el.style.lineHeight = '1.1'
      el.style.fontSize = opt.max + 'px'
      // ลดฟอนต์ลงทีละ step จนกว่าจะไม่ overflow
      let size = opt.max
      // ป้องกันกรณีพ่อ (parent) เป็น flex ให้ใช้ el.clientWidth เอง
      while (size > opt.min && el.scrollWidth > el.clientWidth) {
        size -= opt.step
        el.style.fontSize = size + 'px'
      }
    }
    el.__fitTextApply = apply
    const ro = new ResizeObserver(apply)
    el.__fitTextRO = ro
    ro.observe(el)
    // รอ DOM เสร็จค่อยวัดครั้งแรก
    requestAnimationFrame(apply)
  },
  updated(el) { el.__fitTextApply && el.__fitTextApply() },
  unmounted(el) {
    el.__fitTextRO && el.__fitTextRO.disconnect()
    delete el.__fitTextRO
    delete el.__fitTextApply
  }
}


const dateInputEl = ref(null)

function openDatePicker() {
  const el = dateInputEl.value
  if (!el) return
  // Chromium (Chrome/Edge) รองรับ
  if (typeof el.showPicker === 'function') {
    el.showPicker()
  } else {
    // Safari/Firefox (fallback)
    el.focus()
    el.click()
  }
}

/* ---------- calendar config ---------- */
/* ---------- calendar config (06:00 → 05:00) ---------- */
const START_H = 6;             // เริ่ม 06:00
const totalHours = 24;         // แสดง 24 ชม. เต็ม
const END_H = START_H + totalHours;

const hours = computed(() => {
  return Array.from({ length: totalHours }, (_, i) => {
    const h = (START_H + i) % 24;
    return String(h).padStart(2, '0') + ':00';
  });
});
/* ---------- Zone color palette (border/bg) ---------- */
const DEFAULT_COLORS = { border: '#6d4b3b', bg: '#ead7c0' }; // น้ำตาลเดิม

const ZONE_PALETTE = [
  { border: '#b91c1c', bg: '#fee2e2' }, // red
  { border: '#1d4ed8', bg: '#dbeafe' }, // blue
  { border: '#15803d', bg: '#dcfce7' }, // green
  { border: '#c2410c', bg: '#ffedd5' }, // orange
  { border: '#7c3aed', bg: '#ede9fe' }, // purple
  { border: '#0f766e', bg: '#ccfbf1' }, // teal
  { border: '#be185d', bg: '#fce7f3' }, // pink
  { border: '#4338ca', bg: '#e0e7ff' }, // indigo
  { border: '#b45309', bg: '#fef3c7' }, // amber
  { border: '#0ea5e9', bg: '#e0f2fe' }, // cyan
  { border: '#65a30d', bg: '#ecfccb' }, // lime
  { border: '#334155', bg: '#e2e8f0' }, // slate
];

/* ---------- Unique colors per field (no duplicates) ---------- */
function genExtraPalette(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const h = (i * 137.508) % 360; // golden angle
    out.push({
      border: `hsl(${(h + 12) % 360}, 60%, 35%)`,
      bg:     `hsl(${h}, 92%, 90%)`,
    });
  }
  return out;
}

const zoneColorMap = computed(() => {
  const map = new Map();
  if (!fieldHasZones.value) return map;

  const names = (field.value?.zones || [])
    .map(z => z?.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  // ขยายพาเลตถ้าจำนวนโซน > สีที่มี
  const need = names.length;
  const pal = [...ZONE_PALETTE];
  if (need > pal.length) pal.push(...genExtraPalette(need - pal.length));

  names.forEach((name, i) => map.set(name, pal[i]));
  return map;
});


const bookings = ref([]) // all bookings for this field
const zonePanel = ref(null)

// เพิ่มฟังก์ชันนี้ไว้ใต้ส่วน helpers ก็ได้
function handleClickOutside(e) {
  if (!selectedZoneName.value) return;

  const val = zonePanel.value;
  const panels = Array.isArray(val) ? val : [val];   // กันกรณีมีหลาย ref โดยไม่ตั้งใจ
  if (!panels.length) return;

  // ถ้าคลิกในแผงโซน หรือคลิกปุ่ม BOOKING → ไม่ต้องล้าง
  const clickedInsidePanel = panels.some(p => p && p.contains(e.target));
  if (clickedInsidePanel || e.target.closest('.booking-btn')) return;

  // คลิกที่อื่น → ล้างการเลือก
  selectedZoneName.value = null;
}




/* Week handling */
function mondayOf(d) {
  const x = new Date(d)
  const day = x.getDay() || 7 // 1..7 (Mon..Sun), JS: Sun=0
  if (day !== 1) x.setDate(x.getDate() - (day - 1))
  x.setHours(0, 0, 0, 0)
  return x
}
const weekStart = ref(mondayOf(new Date()))
const weekDays = computed(() => Array.from({ length: 7 }, (_, i) => new Date(weekStart.value.getFullYear(), weekStart.value.getMonth(), weekStart.value.getDate() + i)))
/* ===== Date picker helpers ===== */
function fmtYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
// ⬇⬇⬇ ใส่ตรงนี้
const dateDisplay = computed(() => {
  const d = weekStart.value
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
})
const dateInputValue = computed(() => fmtYMD(weekStart.value));

function onPickDate(ymdStr) {
  if (!ymdStr) return;
  // สร้างวันที่แบบ local (กันปัญหา timezone)
  const [y, m, d] = ymdStr.split('-').map(n => parseInt(n, 10));
  const picked = new Date(y, m - 1, d, 0, 0, 0, 0);
  weekStart.value = mondayOf(picked);    // กระโดดไป “วันจันทร์” ของสัปดาห์นั้น
}

function shiftWeek(step) {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + step * 7)
  weekStart.value = mondayOf(d)
}
function goThisWeek() { weekStart.value = mondayOf(new Date()) }

/* ---------- helpers ---------- */
function toggleSidebar() { isSidebarClosed.value = !isSidebarClosed.value }

function resolveImagePath(img) {
  if (!img) return '/img/default.png'
  const s = String(img)
  if (s.startsWith('data:image/') || s.startsWith('/img/') || s.startsWith('http')) return s
  if (s.startsWith('/uploads/')) return `${API_BASE}${s}`
  return `/img/${s}`
}

const defaultImage = computed(() => field.value ? resolveImagePath(field.value.image) : '/img/default.png')
const currentImage = computed(() => {
  if (
    field.value?.hasZone &&
    field.value?.zones?.length > 0 &&
    selectedZoneName.value &&
    selectedZoneName.value !== ALL_ZONES_LABEL   // <=== เพิ่มเงื่อนไขนี้
  ) {
    const found = field.value.zones.find(z => z.name === selectedZoneName.value)
    return found?.image ? resolveImagePath(found.image) : defaultImage.value
  }
  return defaultImage.value
})

const zoneRequired = computed(() => field.value && field.value.hasZone && field.value.zones && field.value.zones.length > 0)
const fieldHasZones = computed(() =>
  !!(field.value && field.value.hasZone && Array.isArray(field.value.zones) && field.value.zones.length > 0)
)

function clearZone() { if (selectedZoneName.value) selectedZoneName.value = null }
function selectZone(zone) { selectedZoneName.value = zone.name }
function bookZone() {
  if (zoneRequired.value && !selectedZoneName.value) { alert('กรุณาเลือกโซนก่อนจอง'); return }
  router.push({ path: '/form_field', query: { fieldName: fieldName.value, zone: selectedZoneName.value } })
}

/* ---------- load field & bookings ---------- */
async function loadField() {
  if (!fieldName.value) { field.value = null; return }
  try {
    const res = await axios.get(`${API_BASE}/api/fields`)
    const found = res.data.find(f => f.name === fieldName.value)
    if (found) {
      found.image = resolveImagePath(found.image)
      if (Array.isArray(found.zones)) {
        found.zones = found.zones.map(z => ({ ...z, image: resolveImagePath(z.image) }))
      }
      field.value = found
    } else { field.value = null }
  } catch (e) { field.value = null }
}

async function loadBookings() {
  if (!fieldName.value) { bookings.value = []; return }
  try {
    const res = await axios.get(`${API_BASE}/api/history`, {
      params: { type: 'field', name: fieldName.value }
    });

    const banned = ['cancel', 'canceled', 'disapprove', 'disapproved'];

    // 1. กรองรายการเฉพาะ field/สถานะที่ต้องการ
    const rows = (res.data || [])
      .filter(b => (b.type || '').toLowerCase() === 'field')
      .filter(b => (b.name || '') === fieldName.value)
      .filter(b => !banned.includes((b.status || '').toLowerCase()));

    // 2. ขยายรายการตามช่วงวัน [since .. uptodate] (รวมปลายทาง)
    const expanded = rows.flatMap(b => {
      const startDateLike = b.since || b.date || b.createdAt;
      const endDateLike   = b.uptodate || b.since || b.date || b.createdAt;

      const days = listDatesInclusive(startDateLike, endDateLike);

      const base = {
        ...b,
        startTime: normalizeTime(b.startTime || b.start_time),
        endTime:   normalizeTime(b.endTime   || b.end_time)
      };

      return days.map(ds => ({ ...base, dateOnly: ds }));
    });

    bookings.value = expanded;
  } catch (e) {
    bookings.value = [];
  }
}


/* ---------- notifications (ของเดิม) ---------- */
function pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}
function closeNotifications() { showNotifications.value = false }
function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}
async function fetchNotifications() {
  if (!userId) return
  try {
    pruneOldNotifications()
    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const newNotis = res.data.filter(item =>
      (['approved', 'disapproved', 'cancel', 'canceled', 'returned'].includes((item.status || '').toLowerCase())) &&
      !lastCheckedIds.has(item._id)
    )
    if (newNotis.length) {
      const msgs = newNotis.map(item => ({
        id: item._id,
        type: (item.status || '').toLowerCase(),
        timestamp: item.returnedAt ? new Date(item.returnedAt).getTime()
          : item.updatedAt ? new Date(item.updatedAt).getTime()
          : item.approvedAt ? new Date(item.approvedAt).getTime()
          : item.date ? new Date(item.date).getTime() : Date.now(),
        message: `รายการ '${item.name}' ของคุณ${
          (item.status || '').toLowerCase() === 'approved' ? ' ได้รับการอนุมัติ'
          : (item.status || '').toLowerCase() === 'disapproved' ? ' ไม่ได้รับการอนุมัติ'
          : (item.status || '').toLowerCase() === 'cancel' || (item.status || '').toLowerCase() === 'canceled' ? ' ถูกยกเลิก'
          : (item.status || '').toLowerCase() === 'returned' ? ' คืนของสำเร็จแล้ว' : '' }`
      }))
      notifications.value = [...notifications.value, ...msgs]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp)
      pruneOldNotifications()
      newNotis.forEach(item => lastCheckedIds.add(item._id))
    }
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch (e) {}
}
async function loadCart() {
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch { products.value = [] }
}

/* ---------- calendar utils ---------- */
function toLocalDateOnly(d) {
  if (!d) return null;
  const s = String(d).slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    // สร้างวันที่แบบ local timezone (เลี่ยงปัญหา UTC เลื่อนวัน)
    return new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0, 0);
  }
  const x = new Date(d);
  if (isNaN(x)) return null;
  x.setHours(0, 0, 0, 0);
  return x;
}
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function listDatesInclusive(startLike, endLike) {
  const start = toLocalDateOnly(startLike);
  const end   = toLocalDateOnly(endLike || startLike);
  if (!start) return [];
  const out = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(ymd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function normalizeTime(t) {
  if (!t) return '00:00'
  const m = String(t).match(/^(\d{1,2}):?(\d{2})$/)
  if (!m) return '00:00'
  const hh = Math.min(23, parseInt(m[1], 10))
  const mm = Math.min(59, parseInt(m[2], 10))
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
}
function dateOnlyStr(d) {
  const x = new Date(d)
  if (isNaN(x)) return ''
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function toMinutes(t) {
  const [h, m] = String(t).split(':').map(n => parseInt(n, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}
function toAxisMinutes(t) {
  let m = toMinutes(t);
  if (m < START_H * 60) m += 24 * 60;     // 00-05 → +24h
  return m - START_H * 60;                // ชดเชย offset เริ่ม 06:00
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }

/* ===== LAYOUT: วางชิปไม่ให้ทับกัน และกำหนดจำนวนเลนที่ใช้จริง ===== */

/** จัดเลย์เอาต์ของวัน: คืน { items, lanes }
 * - items: รายการ booking ของวันนั้น พร้อม _lane ที่คำนวณแล้ว (ไม่ทับกัน)
 * - lanes: จำนวนเลนที่ใช้จริงทั้งหมดของวัน (เอาไปตั้ง --lanes ให้แถว)
 */
function dayLayout(dateObj) {
  // 1) เอาเฉพาะรายการของวันนั้น
  const list = (bookings.value || []).filter(b => {
    if (!b.dateOnly) return false;
    const bd = toLocalDateOnly(b.dateOnly);
    return bd && sameDay(dateObj, bd);
  });

  if (list.length === 0) return { items: [], lanes: 1 };

  // 2) แยกกลุ่มตามโซน (หรือ '(no-zone)' ถ้าไม่มี)
  const zoneGroups = new Map();
  for (const bk of list) {
    const key = bk.zone || '(no-zone)';
    if (!zoneGroups.has(key)) zoneGroups.set(key, []);
    zoneGroups.get(key).push(bk);
  }

  // 3) เรียงลำดับโซนเพื่อให้เลย์เอาต์นิ่ง (ตามชื่อโซน/ชื่อสนาม)
  const zoneOrder = Array.from(zoneGroups.keys()).sort((a, b) => a.localeCompare(b));

  // 4) วางทีละโซน ด้วย greedy interval-packing
  const out = [];
  let laneOffset = 0;              // ชดเชยเลนสะสมจากโซนก่อนหน้า
  const EPS = 0;                   // อนุญาตต่อท้ายกันพอดีโดยไม่ทับ (start >= end)

  for (const zoneKey of zoneOrder) {
    const arr = zoneGroups.get(zoneKey);

    // เรียงในโซนตามเวลาเริ่ม (บนแกน 06:00→ถัดไป)
    arr.sort((a, b) => toAxisMinutes(a.startTime) - toAxisMinutes(b.startTime));

    // laneEnd[j] = นาทีแกนที่ "เลิกทับได้" ของเลน j ในโซนนี้
    const laneEnd = [];

    for (const bk of arr) {
      const s = toAxisMinutes(bk.startTime);
      const e = toAxisMinutes(bk.endTime);

      // หาเลนแรกที่ว่าง (ไม่ชน) = s >= laneEnd[j] + EPS
      let use = -1;
      for (let j = 0; j < laneEnd.length; j++) {
        if (s >= laneEnd[j] + EPS) { use = j; break; }
      }
      if (use === -1) {            // ไม่มีเลนว่าง → เพิ่มเลนใหม่
        use = laneEnd.length;
        laneEnd.push(e);
      } else {
        laneEnd[use] = e;          // อัปเดตเวลาสิ้นสุดของเลนนั้น
      }

      // เก็บผล โดยเลนจริง = laneOffset + use
      out.push({ ...bk, _lane: laneOffset + use });
    }

    laneOffset += laneEnd.length;  // สะสมจำนวนเลนที่ใช้ในโซนนี้
  }

  const lanesUsed = Math.max(1, laneOffset);
  return { items: out, lanes: lanesUsed };
}

/* ใช้เลย์เอาต์เดียวกันทั้ง list ของชิปและความสูงแถว */
function bookingsOfDay(dateObj) {
  return dayLayout(dateObj).items;           // ← แทนที่ของเดิม
}
function rowStyle(dateObj) {
  const { lanes } = dayLayout(dateObj);
  return { '--lanes': lanes };               // ← ความสูงพอ ไม่ถูกตัด
}

function chipStyle(bk) {
  const startM = Math.max(0, Math.min(24 * 60, toAxisMinutes(bk.startTime)));
  const endM   = Math.max(0, Math.min(24 * 60, toAxisMinutes(bk.endTime)));
  const durM   = Math.max(15, endM - startM);

  const leftPct = (startM / (24 * 60)) * 100;
  const rawPct  = (durM   / (24 * 60)) * 100;

  const EPS_PX = 3;
  const pctMax = Math.max(0.5, Math.min(100 - leftPct, rawPct));

  const left  = `calc(${leftPct}% + 1px)`;
  const width = `calc(${pctMax}% - ${EPS_PX}px)`;
  const topExpr = `calc(var(--layer-pad-y) + ${bk._lane} * var(--lane-h))`;

  // สี: ถ้ามีโซนใช้สีตามโซน, ถ้าไม่มีใช้สีเริ่มต้นน้ำตาล
  const col = fieldHasZones.value
    ? (zoneColorMap.value.get(bk.zone || bk.name) || DEFAULT_COLORS)
    : DEFAULT_COLORS;

  return {
    left,
    width,
    top: topExpr,
    '--chip-bg-color': col.bg,
    '--chip-border-color': col.border,
  };
}

function widthPctOf(bk){
  const startM = Math.max(0, Math.min(24*60, toAxisMinutes(bk.startTime)));
  const endM   = Math.max(0, Math.min(24*60, toAxisMinutes(bk.endTime)));
  const durM   = Math.max(15, endM - startM);
  return (durM / (24*60)) * 100;
}
function isNarrow(bk){
  // แคบมาก ~กว้างน้อยกว่า ~6% ของแถบ (ประมาณ < 1ชม.30น.)
  return widthPctOf(bk) < 6;
}





function chipTitle(bk) {
  const head = fieldHasZones.value ? (bk.zone || bk.name) : bk.name
  return `${head} • ${bk.startTime}-${bk.endTime} • ${mapStatus(bk.status)}`
}


/* ===== English labels ===== */
const EN_DOW  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_MON  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function engDow(jsDow) {
  return EN_DOW[jsDow];          // 0=Sun .. 6=Sat
}
function engMonthShort(m) {
  return EN_MON[m];              // 0=Jan .. 11=Dec
}

/* Range label under the title (Gregorian year) */
function ddmmyyyy(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatRangeLabel(a, b) {
  return `${ddmmyyyy(a)} - ${ddmmyyyy(b)}`; // เช่น 09/09/2025 - 15/09/2025
}


/* Status label on booking chip (English) */
function mapStatus(s) {
  const t = (s || '').toLowerCase();
  if (t === 'approved')   return 'Approved';
  if (t === 'pending')    return 'Pending';
  if (t === 'returned')   return 'Returned';
  if (t === 'disapproved')return 'Disapproved';
  if (t === 'cancel' || t === 'canceled') return 'Canceled';
  return s || '';
}

function safe(v) { return (v || '').toString().slice(0, 12) }

/* ---------- lifecycle ---------- */
onMounted(async () => {
  await loadField()
  await loadBookings()
  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  await loadCart()

  // ✅ ผูกตัวดักคลิกทั้งหน้า
  document.addEventListener('click', handleClickOutside, true)
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
  // ✅ ถอดตัวดักคลิก
  document.removeEventListener('click', handleClickOutside, true)
})

watch(() => route.query.fieldName, async (v) => {
  fieldName.value = v || ''
  selectedZoneName.value = null
  await loadField()
  await loadBookings()
})
</script>

<style scoped>
/* ===== layout ===== */
.calendar-card{
  position: relative;
  margin: 18px 20px 6px;
  padding: 18px 16px 12px;
  background:#fff;
  border-radius:16px;
  box-shadow:0 6px 22px rgba(0,0,0,.08);

  /* === ตัวแปรความสูงแบบเผื่อจริง === */
  --chip-h: 38px;          /* แกนความสูงเนื้อหาในชิป (ไม่รวม padding/border) */
  --chip-pad-y: 6px;       /* padding บน/ล่างของชิป */
  --chip-border: 3px;      /* ความหนาเส้นขอบชิป */
  --lane-gap: 10px;        /* ช่องว่างระหว่างเลน */
  --layer-pad-y: 6px;      /* padding บน/ล่างของชั้นวางชิป (.booking-layer) */

  /* ความสูงภายนอกของชิป = เนื้อหา + padding + border */
  --chip-outer-h: calc(var(--chip-h) + (2 * var(--chip-pad-y)) + (2 * var(--chip-border)));
  /* ความสูงต่อเลน = ความสูงชิปจริง + ระยะห่างระหว่างเลน */
  --lane-h: calc(var(--chip-outer-h) + var(--lane-gap));
}
.cal-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:10px; margin-bottom:6px }
.cal-title{ font-weight:800; font-size:1.05rem; color:#1e2c48 }
.cal-sub{ color:#6b7280; font-size:.9rem }

/* ===== ปุ่มเลื่อนสัปดาห์ ===== */
.cal-head .cal-right{ display:flex; align-items:center; gap:12px }
.cal-head .nav-btn{
  display:inline-flex; align-items:center; justify-content:center;
  width:36px; height:36px; padding:0; border:none; border-radius:10px;
  color:#fff; background:linear-gradient(135deg, #304674, #304674);
  box-shadow:0 2px 8px rgba(0,0,0,.08);
  cursor:pointer; transition:transform .06s ease, box-shadow .2s ease, filter .2s ease;
}
.cal-head .nav-btn i{ font-size:1.05rem; line-height:1 }
.cal-head .nav-btn:hover{ filter:brightness(1.05); box-shadow:0 4px 12px rgba(0,0,0,.12) }
.cal-head .nav-btn:active{ transform:translateY(1px) scale(.98) }

/* ===== time scale ===== */
.cal-times{ display:flex; align-items:center; gap:0; padding:6px 0 8px 0 }
.day-col-spacer{ width:86px; flex:0 0 auto }
.time-scale{
  display:grid; grid-template-columns:repeat(var(--hours), minmax(0,1fr));
  gap:0; width:100%;
}
.time-tick{ display:flex; align-items:center; justify-content:center; font-size:.8rem; color:#42526e; padding-bottom:2px }

/* ===== grid body ===== */
.cal-body{ border-top:1px solid #e6eef7 }
.cal-row{
  display:flex;
  min-height: calc((var(--lane-h) * var(--lanes)) + (2 * var(--layer-pad-y)));
  border-bottom:1px solid #e6eef7; background:#fbfdff; --lanes:1;
}
.day-col{
  width:86px; flex:0 0 auto; padding:6px 6px; text-align:center;
  display:flex; flex-direction:column; align-items:center; justify-content:center; row-gap:2px;
}
/* วันย่อ > เลขวัน > เดือน */
.day-dow{ order:1; color:#2b3f72; font-weight:700; font-size:.95rem; line-height:1 }
.day-num{ order:2; font-weight:900; font-size:1.4rem; color:#1f2937; letter-spacing:.5px; line-height:1 }
.day-mon{ order:3; color:#94a3b8; font-size:.8rem }

.timeline{ position:relative; flex:1; background:#fff; overflow:visible; isolation:isolate }
.hour-columns{
  position:absolute; inset:0; display:grid; grid-template-columns:repeat(var(--hours), minmax(0,1fr));
  z-index:0; pointer-events:none;
}
.hour-col{ border-left:1px solid #ecf2fa }
.hour-col:last-child{ border-right:1px solid #ecf2fa }
.booking-layer{ position:relative; height:100%; z-index:2; padding:var(--layer-pad-y) 0 }

/* ===== booking chip ===== */
.booking-chip{
  position:absolute;
  height:var(--chip-outer-h);
  background:var(--chip-bg-color, #ead7c0);
  border:var(--chip-border) solid var(--chip-border-color, #6d4b3b);
  border-radius:8px;
  display:flex; align-items:center;
  padding:var(--chip-pad-y) 10px; box-sizing:border-box; overflow:hidden; white-space:normal; z-index:3;
}
.chip-inner{ display:flex; flex-direction:column; line-height:1.1; width:100% }
.chip-top{ display:flex; justify-content:space-between; align-items:center; gap:8px; padding-right:0; white-space:nowrap }
.chip-code{ min-width:0; overflow:hidden; text-overflow:ellipsis; flex:1 1 auto }
.chip-status{
  flex-shrink:0; font-size:.72rem; padding:2px 6px; border-radius:999px;
  border:1px solid var(--chip-border-color, #6d4b3b); background:#ffffffa8; line-height:1; white-space:nowrap; margin-left:8px;
}
.chip-sub{ font-size:.9rem; color:#4b382db0; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }

/* แคบมาก → ซ่อน status */
.booking-chip.narrow{ padding:var(--chip-pad-y) 6px }
.booking-chip.narrow .chip-top{ gap:4px }
.booking-chip.narrow .chip-status{ display:none }
.booking-chip.narrow .chip-sub{ font-size:.78rem }
.chip-mini{ display:none !important }

/* ===== bottom (image + zone) ===== */
.below-flex{ display:flex; flex-wrap:wrap; gap:2rem; padding:12px 20px 20px; background:#dbe9f4 }
.left-column{ flex:1 1 60%; max-width:60%; position:relative; min-height:480px }
.right-column{ flex:1 1 35%; max-width:35%; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:480px }
.field-image{
  width:100%; max-width:800px; height:480px; object-fit:cover !important;
  background:#fff; border-radius:12px; margin-bottom:0; box-shadow:0 4px 12px rgba(0,0,0,.1); display:block; margin-left:auto; margin-right:auto;
}
.zone-selector{ width:100%; text-align:center; display:flex; flex-direction:column; align-items:center }
.zone-label{ font-weight:800; font-size:1.2rem; margin-bottom:12px }
.zone-actions{ display:flex; flex-direction:column; align-items:center; gap:10px }
.zone-buttons{ display:flex; flex-direction:column; align-items:center; gap:10px; width:100% }
.zone-buttons button{
  padding:12px 16px; border:1px solid #007bff; background:#fff; color:#007bff;
  border-radius:8px; cursor:pointer; transition:.2s; min-width:120px; width:180px; max-width:100%;
  display:flex; align-items:center; margin-left:0;
}
.zone-buttons button.active, .zone-buttons button:hover{ background:#007bff; color:#fff }
.zone-buttons button.zone-disabled, .zone-buttons button:disabled{
  background:#f4f4f4 !important; color:#aaa !important; border-color:#bbb !important; cursor:not-allowed !important; opacity:.7;
}
.booking-btn{
  margin-top:14px; padding:14px 50px; font-size:1.2rem; border:none;
  background:linear-gradient(135deg, #304674, #304674);
  color:#fff; border-radius:999px; font-weight:700; cursor:pointer; transition:.3s;
  box-shadow:0 4px 12px rgba(0,0,0,.25); letter-spacing:1px;
}
.booking-btn:disabled{ background:#aaa; cursor:not-allowed; box-shadow:none }
.zone-overlay-label{
  position:absolute; top:16px; left:16px;
  background:rgba(0,123,255,.86); color:#fff; padding:10px 22px; font-size:1.05rem; font-weight:800;
  border-radius:18px; box-shadow:0 3px 10px rgba(60,60,100,.08); z-index:5; pointer-events:none; letter-spacing:1px;
}

/* ===== Notifications ===== */
.badge{ background:red; color:#fff; border-radius:50%; padding:2px 6px; font-size:.75rem; vertical-align:top; margin-left:4px }
.notification-dropdown{
  position:absolute; right:0; top:38px; background:#fff; border-radius:18px 0 18px 18px;
  box-shadow:0 8px 24px rgba(27,50,98,.14), 0 2px 4px rgba(33,125,215,.06);
  min-width:330px; max-width:370px; max-height:420px; overflow-y:auto; z-index:1002; padding:0; border:none; animation:fadeDown .22s
}
@keyframes fadeDown{ 0%{opacity:0;transform:translateY(-24px)} 100%{opacity:1;transform:translateY(0)} }
.notification-dropdown ul{ padding:0; margin:0; list-style:none }
.notification-dropdown li{
  background:linear-gradient(90deg,#f6fafd 88%,#e2e7f3 100%);
  margin:.2em .8em; padding:.85em 1.1em; border-radius:12px; border:none;
  font-size:1.07rem; font-weight:500; color:#1e2c48; box-shadow:0 2px 8px rgba(85,131,255,.06); display:flex; gap:10px; position:relative
}
.notification-dropdown li::before{ content:"🔔"; font-size:1.2em; margin-right:7px; color:#1976d2; opacity:.8 }
.notification-dropdown li.no-noti{ background:#f2f3f6; color:#a7aab7; justify-content:center; font-style:italic }
.notification-item.approved{ background:linear-gradient(90deg,#e9fbe7 85%,#cbffdb 100%); border-left:4px solid #38b000; color:#228c22 }
.notification-item.disapproved{ background:linear-gradient(90deg,#ffeaea 85%,#ffd6d6 100%); border-left:4px solid #ff6060; color:#b91423 }
.notification-item.canceled,.notification-item.cancel{ background:linear-gradient(90deg,#f9d7d7 80%,#e26a6a 100%); border-left:4px solid #bb2124; color:#91061a }
.notification-item.returned{ background:linear-gradient(90deg,#e0f0ff 85%,#b6e0ff 100%); border-left:4px solid #1976d2; color:#1976d2 }
.notification-backdrop{ position:fixed; inset:0; background:transparent; z-index:1001 }

/* ===== Highlight today ===== */
.cal-row.is-today{ background:#f4f7ff }
.cal-row.is-today .day-num{ color:#1d4ed8 }
.cal-row.is-today .day-dow{ color:#1d4ed8 }
.chip-zone{ color:var(--chip-border-color, #6d4b3b); font-weight:900 }

/* สถานะ */
.chip-status[data-status="pending"]{ background:#e5e7eb; border-color:#6b7280; color:#374151 }
.chip-status[data-status="approved"]{ background:#dcfce7; border-color:#16a34a; color:#166534 }

/* ===== Compact mode ===== */
.calendar-card.compact{
  margin:12px 16px 6px; padding:12px 12px 8px;
  --chip-h:40px; --chip-pad-y:4px; --chip-border:2px; --lane-gap:6px; --layer-pad-y:4px;
}
.calendar-card.compact .cal-head{ margin-bottom:4px }
.calendar-card.compact .cal-times{ padding:4px 0 6px 0 }
.calendar-card.compact .time-tick{ font-size:.72rem }
.calendar-card.compact .day-col{ padding:4px 4px }
.calendar-card.compact .day-dow{ font-size:.9rem }
.calendar-card.compact .day-num{ font-size:1.2rem }
.calendar-card.compact .day-mon{ font-size:.72rem }

/* ===== mobile ===== */
@media (max-width: 900px){
  .left-column{ flex:1 1 100%; max-width:100% }
  .right-column{ flex:1 1 100%; max-width:100%; min-height:auto; padding-bottom:10px }
  .time-tick{ font-size:.8rem }
}

/* ===== All Zone button tweak ===== */
.zone-buttons .zone-btn{ justify-content:center; font-weight:800 }

/* ===== Date picker mask (สำคัญ) ===== */
.nav-date-wrap{
  position: relative;
  width:160px;
  height:36px;
}
.nav-date-display{
  position:absolute; inset:0;
  z-index:2;               /* ใต้ input */
  border:1px solid #cbd5e1; background:#fff; border-radius:10px;
  padding:6px 10px; color:#111827;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.nav-date-display i{ flex-shrink:0 }
.nav-date-native{
  position:absolute; inset:0;
  z-index:3;               /* บน display */
  width:100%; height:100%;
  opacity:0; cursor:pointer;
}
.nav-date-display .pi{ color:#304674; font-size:1.05rem }
/* ขนาด compact */
.calendar-card.compact .nav-date-wrap{ height:32px }
.calendar-card.compact .nav-date-display{ padding:4px 8px }


.nav-date-wrap{ position:relative; width:160px; height:36px }

/* ให้ตัวที่เห็นอยู่ "บนสุด" และคลิกได้ */
.nav-date-display{
  position:absolute; inset:0; z-index:3;
  border:1px solid #cbd5e1; background:#fff; border-radius:10px;
  display:flex; align-items:center; justify-content:center; gap:8px;
  padding:6px 10px; color:#111827; cursor:pointer;
}

/* input จริง ซ่อนไว้ และไม่ดักคลิก */
.nav-date-native{
  position:absolute; inset:0; z-index:1;
  width:100%; height:100%;
  opacity:0; pointer-events:none;
}

.nav-date-display .pi{ color:#304674; font-size:1.05rem }
.calendar-card.compact .nav-date-wrap{ height:32px }
.calendar-card.compact .nav-date-display{ padding:4px 8px }

</style>



<style>
@import '../css/style.css';
</style>
