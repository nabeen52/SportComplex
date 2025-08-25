<template>
  <div class="layout" :class="{ 'sidebar-closed': isSidebarClosed }">
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
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> จองสนาม</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> รับคืนอุปกรณ์ </router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล </router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
      </nav>
    </aside>
<div v-if="!isSidebarClosed && isMobile" class="sidebar-backdrop" @click="toggleSidebar"></div>
    <!-- Main Content -->
    <div class="main">
      <header class="topbar">
  <button class="menu-toggle" @click="toggleSidebar">☰</button>
  <div class="topbar-actions">
    <!-- Export PDF -->
    




    <!-- กระดิ่งแจ้งเตือน (ซ้าย) -->
    <div style="position: relative; display: inline-block;">
  <!-- backdrop ปิด dropdown เมื่อคลิกนอกกรอบ -->
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

    <!-- ปุ่มโปรไฟล์ (ขวา) -->
    <router-link to="/profile_admin" class="profile-link">
      <i class="pi pi-user"></i>
    </router-link>
  </div>
</header>


<!-- สถิติการใช้งานสนามกีฬาโดยภาพรวม -->
 <div class="dashboard-grid">
       <div class="dashboard-section">
        <div class="dashboard-section-header">
    <div class="header-spacer"></div>
    <h2 class="dashboard-title">สถิติการใช้งาน "สนามกีฬาโดยภาพรวม"</h2>
    <button @click="exportOverallFieldPDF" class="export-btn">ExportPDF</button>

    
  </div>
  <div class="filter-options" style="margin-bottom:0;">
    <label>ตั้งแต่:
      <select v-model="overallFieldStartMonth">
        <option v-for="(m, i) in months" :key="i" :value="i+1">{{ m }}</option>
      </select>
      <select v-model="overallFieldStartYear">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </label>
    <label>ถึง:
      <select v-model="overallFieldEndMonth">
        <option v-for="(m, i) in months" :key="i" :value="i+1">{{ m }}</option>
      </select>
      <select v-model="overallFieldEndYear">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </label>
  </div>
    <div class="chart-container overall">
    <Line :data="overallFieldChartData" :options="overallFieldChartOptions" :key="overallChartUpdateKey" />
    <!-- ใต้ Line chart -->
    <div class="chart-legend">
         <span
      v-for="(ds, idx) in overallFieldChartData.datasets"
      :key="ds.label"
       class="legend-item"
      :style="{
      color: ds._hidden ? '#ccc' : ds.borderColor,
      cursor: 'pointer',
      marginRight: '22px',
      fontWeight: ds._hidden ? 'normal' : 'bold'
    }"
    @click="toggleOverallLine(idx)"
  >
    <span
      class="legend-color"
      :style="{
        background: ds.borderColor,
        border: ds._hidden ? '2px solid #ccc' : `2px solid ${ds.borderColor}`,
        opacity: ds._hidden ? 0.33 : 1
      }"
    ></span>
    {{ ds.label }}
      </span>
   </div>
  </div>
</div>

        <!-- Card 1: สนามกีฬา -->
      
        <div class="dashboard-section">
         <div class="dashboard-section-header">
             <div class="header-spacer"></div>
           <h2 class="dashboard-title">สถิติการใช้งาน "สนามกีฬาของหน่วยงาน"</h2>
  <button @click="exportFieldPDF" class="export-btn sum">ExportPDF</button>
</div>

       <div class="filter-options field-filter">
  <label>แสดงสูงสุด:
    <select v-model="fieldShowLimit">
      <option :value="null">ทั้งหมด</option>
      <option v-for="n in [5,10,15,20,50,100]" :key="n" :value="n">{{ n }} รายการ</option>
    </select>
  </label>

  <label>ชื่อสนาม:
    <select v-model="selectedFieldName">
      <option value="">ทั้งหมด</option>
      <option v-for="name in allFieldNames" :key="name" :value="name">{{ name }}</option>
    </select>
  </label>

  <label>ตั้งเเต่:
    <select v-model="fieldStartMonth">
      <option v-for="(m, i) in months" :key="i" :value="i+1">{{ m }}</option>
    </select>
  </label>

  <label>
    <select v-model="fieldStartYear">
      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
    </select>
  </label>

  <span>ถึง:</span>

  <label>
    <select v-model="fieldEndMonth">
      <option v-for="(m, i) in months" :key="i" :value="i+1">{{ m }}</option>
    </select>
  </label>

  <label>
    <select v-model="fieldEndYear">
      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
    </select>
  </label>
</div>


         
         <div class="chart-container overall">
  <UnitUsageChart
    :units="filteredFieldUnits"
    unitType="usage"
    yLabel="จำนวนชั่วโมงการใช้งาน"
  />
</div>
</div>

        <!-- Card 2: อุปกรณ์กีฬา -->
        <div class="dashboard-section">
  <div class="dashboard-section-header">
    <div class="header-spacer"></div>
    <h2 class="dashboard-title">สถิติการใช้งาน "อุปกรณ์กีฬา"</h2>
    <button @click="exportEquipPDF" class="export-btn equip">ExportPDF</button>
  </div>

  <!-- ตัวกรอง: ตั้งแต่ เดือน/ปี ถึง เดือน/ปี -->
  <div class="filter-options" style="margin-bottom:0;">
    <label>ตั้งแต่:
      <select v-model="equipOverallStartMonth">
        <option v-for="(m, i) in months" :key="'es-'+i" :value="i+1">{{ m }}</option>
      </select>
      <select v-model="equipOverallStartYear">
        <option v-for="y in years" :key="'ey1-'+y" :value="y">{{ y }}</option>
      </select>
    </label>
    <label>ถึง:
      <select v-model="equipOverallEndMonth">
        <option v-for="(m, i) in months" :key="'ee-'+i" :value="i+1">{{ m }}</option>
      </select>
      <select v-model="equipOverallEndYear">
        <option v-for="y in years" :key="'ey2-'+y" :value="y">{{ y }}</option>
      </select>
    </label>
  </div>

  <div class="chart-container overall">
    <Line :data="overallEquipChartData" :options="overallEquipChartOptions" :key="equipOverallUpdateKey" />

    <!-- legend ใต้กราฟ (กดเพื่อซ่อน/แสดงเส้น) -->
    <div class="chart-legend">
      <span
        v-for="(ds, idx) in overallEquipChartData.datasets"
        :key="'elegend-'+(ds.label||idx)"
        class="legend-item"
        :style="{
          color: ds._hidden ? '#ccc' : ds.borderColor,
          cursor: 'pointer',
          marginRight: '22px',
          fontWeight: ds._hidden ? 'normal' : 'bold'
        }"
        @click="toggleEquipLine(idx)"
      >
        <span
          class="legend-color"
          :style="{
            background: ds.borderColor,
            border: ds._hidden ? '2px solid #ccc' : `2px solid ${ds.borderColor}`,
            opacity: ds._hidden ? 0.33 : 1
          }"
        ></span>
        {{ ds.label }}
      </span>
    </div>
  </div>
</div>
</div>
         
         <!-- <UnitUsageChart
  :units="filteredEquipUnits"
  unitType="equipment"
  yLabel="จำนวนการใช้งาน"
/>
        </div>
      </div> -->

      <!-- Footer -->
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import UnitUsageChart from '@/components/UnitUsageChart.vue'
import jsPDF from 'jspdf'
import { Line } from 'vue-chartjs'
import {
  Chart,
  LineElement, PointElement, LinearScale, CategoryScale,
  Title, Tooltip, Legend
} from 'chart.js'

// >>> ต้องมีบรรทัดนี้ใน dashboard.vue ด้วย <<<
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend)

import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'
import '@/assets/fonts/Sarabun-BoldItalic-normal.js'
import '@/assets/fonts/Sarabun-ExtraBold-normal.js'
import '@/assets/fonts/Sarabun-ExtraBoldItalic-normal.js'
import '@/assets/fonts/Sarabun-ExtraLight-normal.js'
import '@/assets/fonts/Sarabun-ExtraLightItalic-normal.js'
import '@/assets/fonts/Sarabun-Italic-normal.js'
import '@/assets/fonts/Sarabun-Light-normal.js'
import '@/assets/fonts/Sarabun-LightItalic-normal.js'
import '@/assets/fonts/Sarabun-Medium-normal.js'
import '@/assets/fonts/Sarabun-MediumItalic-normal.js'
import '@/assets/fonts/Sarabun-SemiBold-normal.js'
import '@/assets/fonts/Sarabun-SemiBoldItalic-normal.js'
import '@/assets/fonts/Sarabun-Thin-normal.js'
import '@/assets/fonts/Sarabun-ThinItalic-normal.js'

const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'
const currentYear = new Date().getFullYear()
const fieldStartMonth = ref(1)
const fieldStartYear = ref(currentYear)
const fieldEndMonth = ref(12)
const fieldEndYear = ref(currentYear)

const equipStartMonth = ref(1)
const equipStartYear = ref(currentYear)
const equipEndMonth = ref(12)
const equipEndYear = ref(currentYear)

// State
const fieldUnits = ref([])
const equipUnits = ref([])
const isSidebarClosed = ref(false)


const overallChartUpdateKey = ref(0)

const months = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]
// ---- กราฟ "สนามกีฬา" ----

const overallFieldStartMonth = ref(1)
const overallFieldStartYear = ref(currentYear)
const overallFieldEndMonth = ref(12)
const overallFieldEndYear = ref(currentYear)

const overallMonths = months  // ["มกราคม", ... "ธันวาคม"]

// ---- Filter "สนามกีฬา" ----
const selectedFieldName = ref('')
const selectedFieldMonth = ref('')

const years = [currentYear - 3,currentYear - 2,currentYear - 1,currentYear, currentYear + 1, currentYear + 2, currentYear + 3]
const selectedFieldYear = ref(currentYear)
const fieldShowLimit = ref(5)

// ---- Filter "อุปกรณ์กีฬา" ----
const selectedEquipName = ref('')
const selectedEquipMonth = ref('')
const selectedEquipYear = ref(currentYear)
const equipShowLimit = ref(5)

const allFields = ref([]) // รายชื่อสนามทั้งหมด (master)
const isSingleEquipMode = computed(() => !!selectedEquipName.value);
// ==== อุปกรณ์กีฬาแบบภาพรวมรายเดือน ====
const equipOverallStartMonth = ref(1)
const equipOverallStartYear  = ref(currentYear)
const equipOverallEndMonth   = ref(12)
const equipOverallEndYear    = ref(currentYear)
const equipOverallUpdateKey  = ref(0)

// รายชื่ออุปกรณ์ทั้งหมด (สำหรับทำเส้นละอุปกรณ์)
const allEquipNamesOverall = computed(() => {
  const names = new Set()
  equipUnits.value.forEach(u => {
    if (u.name) names.add(u.name)
  })
  return Array.from(names)
})

// ข้อมูลกราฟอุปกรณ์ (X = เดือนช่วงที่เลือก, Y = จำนวนการใช้งาน, เส้น = อุปกรณ์)
const overallEquipChartData = computed(() => {
  // 1) คำนวณจำนวนเดือนในช่วง
  const yStart = Number(equipOverallStartYear.value)
  const yEnd   = Number(equipOverallEndYear.value)
  const mStart = Number(equipOverallStartMonth.value)
  const mEnd   = Number(equipOverallEndMonth.value)

  const countMonth = (yEnd - yStart) * 12 + (mEnd - mStart) + 1
  const labels = []
  const monthYearList = []
  for (let i = 0; i < countMonth; i++) {
    const y = yStart + Math.floor((mStart - 1 + i) / 12)
    const m = ((mStart - 1 + i) % 12) + 1
    labels.push(`${months[m - 1]} ${y}`)
    monthYearList.push({ m, y })
  }

  // 2) ทำ datasets สำหรับแต่ละอุปกรณ์
  const colorList = [
    "#e57373","#64b5f6","#81c784","#ffd54f","#ba68c8","#7986cb","#4db6ac","#ff8a65","#a1887f",
    "#f06292","#9575cd","#4fc3f7","#aed581","#fff176","#dce775","#ffd54f","#a1887f","#90caf9","#ffb74d",
  ]
 const datasets = allEquipNamesOverall.value.map((equipName, i) => {
  const dataArr = monthYearList.map(({ m, y }) => {
    let sum = 0
    equipUnits.value.forEach(u => {
      if (!u.usageByMonthYear) return
      if (u.name !== equipName) return        // เช็คชื่อที่ระดับ doc แทน
      u.usageByMonthYear.forEach(row => {
        // แถวใน usageByMonthYear มีแค่ year, month, usage
        if (row.year === y && row.month === m) {
          sum += row.usage || 0
        }
      })
    })
    return sum
  })
    const c = colorList[i % colorList.length]
    return {
      label: equipName,
      data: dataArr,
      borderColor: c,
      backgroundColor: c + "22",
      fill: false,
      tension: 0.32,
      pointRadius: 2,
      borderWidth: 2,
      _hidden: false,
      hidden: false,
    }
  })

  return { labels, datasets }
})

function toggleEquipLine(idx) {
  const ds = overallEquipChartData.value.datasets[idx]
  ds._hidden = !ds._hidden
  ds.hidden = ds._hidden
  equipOverallUpdateKey.value++
}

const overallEquipChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest', intersect: false },
  elements: { point: { radius: 3, hitRadius: 10, hoverRadius: 5 } },
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: {
      enabled: true,
      callbacks: {
        // บรรทัดหัว tooltip = เดือน/ปี
        title: (items) => (items && items[0]?.label) || '',
        // แสดง "ชื่ออุปกรณ์: 20 ครั้ง"
        label: (ctx) => {
          const v = (ctx.raw ?? ctx.parsed?.y ?? 0);
          return `${ctx.dataset.label}: ${Number(v).toLocaleString('th-TH')} ครั้ง`;
        }
      }
    }
  },
  scales: {
    x: { title: { display: false } },
    y: {
      beginAtZero: true,
      title: { display: true, text: "จำนวนการใช้งาน" }
    }
  },
  datasets: {
    line: { hidden: (context) => context?.dataset?._hidden === true }
  }
}))


// สำหรับดึงชื่อสนามทั้งหมด
const allFieldNamesOverall = computed(() =>
  allFields.value.map(f => f.name)
)

// DATA สำหรับ overall chart
const overallFieldChartData = computed(() => {
  // --- 1. สร้างช่วงเดือนที่เลือกแบบละเอียด ---
  let xLabels = []
  let monthYearList = []
  let yStart = overallFieldStartYear.value
  let yEnd = overallFieldEndYear.value
  let mStart = overallFieldStartMonth.value
  let mEnd = overallFieldEndMonth.value

  // handle กรณีเลือกข้ามปี (เช่น พ.ย. 2024 ถึง ก.พ. 2025)
  let countMonth = (yEnd - yStart) * 12 + (mEnd - mStart) + 1
  for (let i = 0; i < countMonth; i++) {
    let y = yStart + Math.floor((mStart - 1 + i) / 12)
    let m = ((mStart - 1 + i) % 12) + 1
    xLabels.push(`${months[m - 1]} ${y}`)
    monthYearList.push({ m, y })
  }

  // --- 2. เตรียม dataset สำหรับแต่ละสนาม ---
  let fieldNames = allFieldNamesOverall.value
  let colorList = [
    "#e57373","#64b5f6","#81c784","#ffd54f","#ba68c8","#7986cb","#4db6ac","#ff8a65","#a1887f",
    "#f06292","#9575cd","#4fc3f7","#aed581","#fff176","#dce775","#ffd54f","#a1887f"
  ]

  let datasets = fieldNames.map((field, i) => {
    // สร้าง array ตามจำนวนเดือนในช่วงที่เลือก
    let dataArr = []
    for (let idx = 0; idx < countMonth; idx++) {
      let { m, y } = monthYearList[idx]
      // รวมชั่วโมงของ field ในเดือน/ปี นั้นๆ
      let sum = 0
      fieldUnits.value.forEach(unit => {
        if (!unit.usageByMonthYear) return
        unit.usageByMonthYear.forEach(row => {
          if (row.fieldName === field && row.year === y && row.month === m) {
            sum += row.hours || 0
          }
        })
      })
      dataArr.push(sum)
    }
    return {
      label: field,
      data: dataArr,
      borderColor: colorList[i % colorList.length],
      backgroundColor: colorList[i % colorList.length] + "22",
      fill: false,
      tension: 0.32,
      pointRadius: 2,
      borderWidth: 2,
      _hidden: false, // สำหรับ legend toggle
      hidden: false, // **เพิ่ม**
    }
  })
  return {
    labels: xLabels,
    datasets
  }
})
const isMobile = ref(window.innerWidth <= 600)

function handleResize() { isMobile.value = window.innerWidth <= 600 }
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

function toggleOverallLine(idx) {
  // toggle _hidden
  const ds = overallFieldChartData.value.datasets[idx]
  ds._hidden = !ds._hidden
  ds.hidden = ds._hidden // **เพิ่มบรรทัดนี้**
  overallChartUpdateKey.value++
}
const overallFieldChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest', intersect: false },
elements: { point: { radius: 3, hitRadius: 10, hoverRadius: 5 } },
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: {
      enabled: true,
      callbacks: {
        // บรรทัดหัว = เดือน/ปี
        title: (items) => (items && items[0]?.label) || '',
        // แสดง "ชื่อสนาม: 35 ชม."
        label: (ctx) => {
          const v = (ctx.raw ?? ctx.parsed?.y ?? 0);
          return `${ctx.dataset.label}: ${Number(v).toLocaleString('th-TH')} ชม.`;
        }
      }
    }
  },
  scales: {
    x: { title: { display: false } },
    y: {
      beginAtZero: true,
      title: { display: true, text: "จำนวนชั่วโมงการใช้งาน" }
    }
  },
  datasets: {
    line: {
      hidden: (context) => context?.dataset?._hidden === true
    }
  }
}))


// ==== กระดิ่งแจ้งเตือน ====
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null
const lastSeenTimestamp = ref(parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0'))


function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}
function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(lastSeenTimestamp.value)) // ✅
    unreadCount.value = 0
  }
}

async function fetchNotifications() {
  try {
    // ตัดรายการเก่าเกิน 7 วันทิ้งก่อน
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
    notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)

    // โหลดสถานะรออนุมัติ (pending) ของ field/equipment
    const res = await axios.get(`${API_BASE}/api/history/approve_field`)
    const data = Array.isArray(res.data) ? res.data : []

    // เอาเฉพาะ pending ของ field/equipment ที่ยังไม่เคยใส่
    const pendings = data.filter(item =>
      item.status === 'pending' &&
      (item.type === 'field' || item.type === 'equipment')
    )

    if (pendings.length) {
      const newMessages = pendings.map(item => {
        const id = item._id?.$oid || item._id
        // หา timestamp ที่เหมาะสม
        const ts =
          (item.updatedAt && new Date(item.updatedAt).getTime()) ??
          (item.createdAt && new Date(item.createdAt).getTime()) ??
          (item.date && new Date(item.date).getTime()) ??
          Date.now()

        return {
          id,
          type: 'pending',
          timestamp: ts,
          message:
            item.type === 'field'
              ? `สนาม '${item.name}' กำลังรอการอนุมัติ`
              : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
        }
      })

      // รวม + unique ตาม id + sort ตามเวลาล่าสุด
      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp)

      // ตัดของเก่าเกิน 7 วันอีกรอบ (กันเผื่อ)
      pruneOldNotifications()
    }

    // คำนวณ unread ตาม timestamp > lastSeenTimestamp (คงสภาพไม่ว่าไปหน้าไหน)
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch (e) {
    // เงียบไว้ตามเดิม
  }
}

function closeNotifications() { showNotifications.value = false }

function pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 วันย้อนหลัง
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
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

// ====== fetch data ======
onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)
  fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)

try {
    const resFields = await axios.get(`${API_BASE}/api/fields`)
    allFields.value = resFields.data
  } catch { allFields.value = [] }
    // ดึงข้อมูล usage
  try {
    const resField = await axios.get(`${API_BASE}/api/information?type=field`)
    fieldUnits.value = resField.data
    // แทรก log ตรงนี้
    console.log('fieldUnits', JSON.stringify(fieldUnits.value, null, 2))
  } catch { fieldUnits.value = [] }
  try {
    const resEquip = await axios.get(`${API_BASE}/api/equipments`)
    equipUnits.value = resEquip.data
    // log ข้อมูลอุปกรณ์
    console.log('equipUnits', JSON.stringify(equipUnits.value, null, 2))
  } catch { equipUnits.value = [] }

  
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  if (polling) clearInterval(polling)
})

// ======= สนามกีฬา =======
const allFieldNames = computed(() => allFields.value.map(f => f.name))


const filteredFieldUnits = computed(() => {
  let result = []
  fieldUnits.value.forEach(unit => {
    if (!unit.usageByMonthYear) return

    let filtered = unit.usageByMonthYear.filter(row => {
      // ตรงนี้ใช้ค่าจาก filter ทั้งหมด
      if (selectedFieldName.value && row.fieldName.trim() !== selectedFieldName.value.trim()) return false
      if (fieldStartYear.value && row.year < Number(fieldStartYear.value)) return false
      if (fieldEndYear.value && row.year > Number(fieldEndYear.value)) return false
      if (fieldStartMonth.value && (
        (row.year === Number(fieldStartYear.value) && row.month < Number(fieldStartMonth.value)) ||
        (row.year === Number(fieldEndYear.value) && row.month > Number(fieldEndMonth.value))
      )) return false
      return true
    })

    let sumUsage = filtered.reduce((acc, f) => acc + (f.usage || 0), 0)
    let sumHours = filtered.reduce((acc, f) => acc + (f.hours || 0), 0)
    if (sumUsage > 0 || sumHours > 0) {
      result.push({
        unit: unit.unit || unit.fieldName,
        usage: sumUsage,
        hours: sumHours
      })
    }
  })
  // Sort & Limit
  result = result.sort((a, b) => b.usage - a.usage)
  if (fieldShowLimit.value != null && typeof fieldShowLimit.value === 'number') {
    result = result.slice(0, fieldShowLimit.value)
  }
  return result
})


// ======= อุปกรณ์กีฬา =======
const allEquipNames = computed(() => {
  const names = new Set()
  equipUnits.value.forEach(unit => {
    if (unit.name) names.add(unit.name)
  })
  return Array.from(names)
})



const filteredEquipUnits = computed(() => {
  let data = []
  equipUnits.value.forEach(unit => {
    if (!unit.usageByMonthYear) return

    let filtered = unit.usageByMonthYear.filter(row => {
      if (selectedEquipName.value && row.name !== selectedEquipName.value) return false
      if (equipStartYear.value && row.year < Number(equipStartYear.value)) return false
      if (equipEndYear.value && row.year > Number(equipEndYear.value)) return false
      if (equipStartMonth.value && (
        (row.year === Number(equipStartYear.value) && row.month < Number(equipStartMonth.value)) ||
        (row.year === Number(equipEndYear.value) && row.month > Number(equipEndMonth.value))
      )) return false
      return true
    })
    let sumUsage = filtered.reduce((acc, f) => acc + (f.usage || 0), 0)
    if (sumUsage > 0) {
      data.push({
        unit: unit.name,
        usage: sumUsage,
      })
    }
  })

  // Sort & Limit
  if (equipShowLimit.value != null && typeof equipShowLimit.value === 'number') {
    data = data.sort((a, b) => b.usage - a.usage).slice(0, equipShowLimit.value)
  }
  return data
})


function exportOverallFieldPDF() {
  // เตรียม data เป็น summary ของแต่ละสนาม (sum ตามช่วงเดือน)
  const chartData = overallFieldChartData.value;
  const fieldSummaries = chartData.datasets.map(ds => {
    // หาผลรวมชั่วโมงช่วงนี้
    const totalHours = ds.data.reduce((a, b) => a + (b || 0), 0);
    return {
      unit: ds.label,    // ชื่อสนาม
      hours: totalHours, // ผลรวมชั่วโมง
    }
  })

  // สร้าง summary text
  const periodText = `ช่วง: ${months[overallFieldStartMonth.value - 1]} ${overallFieldStartYear.value} ถึง ${months[overallFieldEndMonth.value - 1]} ${overallFieldEndYear.value}`;
  exportPDF(
    fieldSummaries,
    'รายงานสถิติการใช้ "สนามกีฬาโดยภาพรวม"',
    'สถิติการใช้งาน สนามกีฬาโดยภาพรวม.pdf',
    periodText,
    'overall'
  );
}


// ====== Export PDF ======
function exportFieldPDF() {
  exportPDF(
    filteredFieldUnits.value,
    'รายงานสถิติการใช้สนามกีฬาของหน่วยงาน',
    'สถิติการใช้งาน สนามกีฬาของหน่วยงาน.pdf',
    [
      `ชื่อสนาม: ${selectedFieldName.value || 'ทั้งหมด'}`,
      `เดือน: ${selectedFieldMonth.value ? months[selectedFieldMonth.value - 1] : 'ทั้งหมด'}`,
      `ปี: ${selectedFieldYear.value || 'ทั้งหมด'}`,
      `แสดงสูงสุด: ${fieldShowLimit.value ? fieldShowLimit.value + ' รายการ' : 'ทั้งหมด'}`
    ].join('   ')
  )
}
function exportEquipPDF() {
  const chartData = overallEquipChartData.value
  const summaries = chartData.datasets.map(ds => ({
    unit: ds.label,
    usage: ds.data.reduce((a,b) => a + (b || 0), 0)
  }))

  const periodText =
    `ช่วง: ${months[equipOverallStartMonth.value - 1]} ${equipOverallStartYear.value} ` +
    `ถึง ${months[equipOverallEndMonth.value - 1]} ${equipOverallEndYear.value}`

  exportPDF(
    summaries,
    'รายงานสถิติการใช้อุปกรณ์กีฬา',
    'สถิติการใช้งาน อุปกรณ์กีฬา.pdf',
    periodText,
    'equipment' // ให้แสดง "รวมการใช้งาน: ... ครั้ง"
  )
}



function exportPDF(data, header, filename, filterSummary, type = 'field') {
  try {
    const pdf = new jsPDF()
    pdf.setFont('Sarabun', 'normal')
    pdf.setFontSize(18)
    const pageWidth = pdf.internal.pageSize.getWidth()
    let y = 25

    pdf.text('ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง', pageWidth / 2, y, { align: 'center' }); y += 10
    pdf.setFontSize(16)
    pdf.text(header, pageWidth / 2, y, { align: 'center' }); y += 14
    pdf.setFontSize(13)

    // Filter summary
    if (filterSummary) {
      const filterLines = pdf.splitTextToSize(filterSummary, pageWidth - 40)
      filterLines.forEach(line => {
        pdf.text(line, pageWidth / 2, y, { align: 'center' }); y += 8
      })
    }

    const now = new Date()
    pdf.text(`วันที่: ${now.toLocaleDateString('th-TH')}`, 15, y)
    pdf.text(`เวลา: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 50, y)
    y += 12

    pdf.setFontSize(13)
    const intro = 'รายงานแสดงสรุปสถิติการใช้บริการของแต่ละหน่วยงาน'
    const introLines = pdf.splitTextToSize(intro, pageWidth - 30)
    introLines.forEach(line => { pdf.text(line, 15, y); y += 8 })
    y += 10

    pdf.setFontSize(14)
    pdf.text('สรุปการใช้บริการแต่ละหน่วยงาน', pageWidth / 2, y, { align: 'center' }); y += 10
    pdf.setFontSize(13)

    let totalUsage = 0, totalHours = 0
    const lineHeight = 9, marginBottom = 18, leftX = 20, rightX = pageWidth - 20
    if (!data.length) {
      pdf.text('ไม่มีข้อมูลการใช้งาน', leftX, y); y += lineHeight
    } else {
      data.forEach((u, i) => {
        if (y + lineHeight > pdf.internal.pageSize.getHeight() - marginBottom) {
          pdf.addPage(); y = 25
          pdf.setFontSize(14)
          pdf.text('ต่อจากหน้าเดิม', leftX, y); y += 10
          pdf.setFontSize(13)
        }
         pdf.text(`${i + 1}. ${u.unit}`, leftX, y)
        let rightText = ''
        if (type === 'equipment') {
          rightText = `จำนวนการใช้งาน: ${u.usage || 0} ครั้ง`
        } else if (type === 'overall') {
          rightText = `จำนวนชั่วโมง: ${u.hours || 0}`
        } else {
          rightText = `จำนวนครั้ง: ${u.usage || 0} | จำนวนชั่วโมง: ${u.hours || 0}`
        }
        pdf.text(rightText, rightX, y, { align: 'right' }); y += lineHeight
        if (type === 'equipment') totalUsage += u.usage || 0
        else totalHours += u.hours || 0
        if (type !== 'overall') totalUsage += u.usage || 0 // เฉพาะ non-overall
      })
       y += 4
      if (type === 'equipment') {
        pdf.text(`รวมการใช้งาน: ${totalUsage} ครั้ง`, leftX, y)
      } else if (type === 'overall') {
        pdf.text(`รวมชั่วโมง: ${totalHours}`, leftX, y)
      } else {
        pdf.text(`รวมครั้ง: ${totalUsage} | รวมชั่วโมง: ${totalHours}`, leftX, y)
      }
    }
    y += marginBottom
    if (y > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage(); y = 25
    }
    pdf.setFontSize(12)
    pdf.text('ผู้จัดทำ: ...........................................................', leftX, y); y += 7
    pdf.text('ระบบจัดการศูนย์กีฬา มหาวิทยาลัยแม่ฟ้าหลวง', leftX, y)

    pdf.save(filename)
  } catch (e) {
    alert('Export PDF Error: ' + e.message)
  }
}

</script>

<style scoped>
.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 36px;  /* ช่องว่างระหว่างแต่ละ card */
  padding: 1.5rem 1rem 0 1rem;
  margin-bottom: 32px;
}
.dashboard-section.overall {
  min-height: unset !important;
  padding-bottom: 1.5rem !important;
}
/* ปล่อยสูง auto, กันล้นแนวนอน และคงพื้นที่แคนวาสกราฟไว้ด้วย canvas height */
.chart-container.overall {
  height: auto !important;       /* ให้สูงอัตโนมัติ */
  min-height: 320px;             /* ฐานขั้นต่ำ */
  max-height: none !important;   /* ไม่จำกัดความสูง */
  overflow: visible !important;  /* ให้ tooltip โผล่ได้ */
}
/* ล็อกความสูงตัวกราฟ (canvas) แทน เพื่อไม่ให้ยืดตาม legend */
.chart-container.overall canvas {
  height: 260px !important;  /* ปรับได้ตามชอบ */
  width: 100% !important;
}


.filter-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
  margin: 1.3rem 1.5rem 0.2rem 0;
}

.filter-options label {
  font-size: 1rem;
  color: #222;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 110px;
  margin-bottom: 5px;
}
.filter-options select {
  min-width: 75px;
  max-width: 135px;
}


.dashboard-grid {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 1.5rem 1rem 0 1rem;
  justify-content: center;
  margin-bottom: 32px
}
.dashboard-section {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(30, 58, 138, 0.09);
  padding: 2.5rem 1.8rem 2.5rem 1.8rem;   /* ขยาย padding ล่าง */
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;

}
.chart-legend {
  margin-top: 12px;
  text-align: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 16px;
  font-size: 1rem;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s;
}
.legend-color {
  display: inline-block;
  width: 16px;
  height: 10px;
  border-radius: 4px;
  margin-right: 2px;
  vertical-align: middle;
}

.dashboard-title {
  color: #153477;
  font-size: 1.35rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.8rem;
  margin-top: 0;
}
.dashboard-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.6rem;
}
.dashboard-section-header .dashboard-title {
  margin-bottom: 0;
}
.header-spacer {
  width: 120px;
}
.dashboard-section-header .dashboard-title {
  flex: 1;
  text-align: center;
  margin: 0;
}
/* ===== ExportPDF buttons (สีเขียวเดียวกัน) ===== */
.export-btn {
  background: #39b844;        /* เขียวหลัก */
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 7px 15px;
  font-size: 15px;
  margin-right: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.2s;
}

.export-btn:hover,
.export-btn.sum:hover,
.export-btn.equip:hover {
  background: #307722;        /* เขียวเข้มตอน hover */
}

/* บังคับให้ปุ่มที่มี class เสริมก็ยังเป็นสีเขียวเดียวกัน */
.export-btn.sum,
.export-btn.equip {
  background: #39b844;
}







/* ==== Notification styles ==== */
.notification-dropdown {
  position: absolute;
  right: 0;
  top: 36px;
  background: white;
  box-shadow: 0 4px 24px rgba(70, 70, 70, 0.14);
  border-radius: 10px;
  width: 320px;
  max-width: 90vw;
  z-index: 1500;
  padding: 10px 0;
  font-size: 1rem;
}
.notification-backdrop{
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: transparent;
  z-index: 1001; /* ต้องต่ำกว่า .notification-dropdown */
}
.notification-dropdown ul {
  padding: 0 18px;
  margin: 0;
}
.notification-dropdown li {
  list-style: none;
  padding: 10px 0;
  border-bottom: 1px solid #eaeaea;
  word-break: break-word;
}
.notification-dropdown li:last-child {
  border-bottom: none;
}
.notification-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  position: relative;
  margin-right: 8px;
}
.badge {
  position: absolute;
  top: 1px;
  right: 3px;
  background: #e11d48;
  color: white;
  border-radius: 8px;
  padding: 1px 8px;
  font-size: 0.83rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
  z-index: 10;
}
.chart-container {
    height: 440px; 
  position: relative;
  margin: 0;
  width: 100%;
  max-width: 100%;    /* เพิ่มบรรทัดนี้ */
  overflow-x: auto;   /* เพิ่มบรรทัดนี้ ป้องกันล้น */
  box-sizing: border-box; /* เพิ่มบรรทัดนี้ */
}
.filter-summary {
  margin-bottom: 14px;
  color: #333;
  font-size: 1.09rem;
  text-align: center;
}

/* ================== SIDEBAR BACKDROP FOR MOBILE ================== */
.sidebar-backdrop {
  position: fixed;
  z-index: 2999;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.22);
}

/* ================== RESPONSIVE (มือถือ) ================== */
@media (max-width: 900px) {
  .filter-options {
    justify-content: flex-start;
    gap: 10px;
  }
  .filter-options label {
    min-width: 90px;
    font-size: 0.98rem;
  }
  .dashboard-title {
    font-size: 1.13rem;
  }
}

@media (max-width: 600px) {
  .filter-options {
    flex-direction: column;
    align-items: stretch;
    margin: 0.7rem 0.3rem 0.1rem 0.3rem;
    gap: 7px;
  }
  .filter-options label {
    min-width: unset;
    width: 100%;
    margin-bottom: 0;
    font-size: 0.95rem;
    justify-content: flex-start;
  }
  .filter-options select {
    min-width: 80px;
    width: 100%;
    max-width: 100%;
  }
  .dashboard-section {
    padding: 1rem 0.5rem;
  }
  /* ป้องกัน main/container เลื่อนซ้ายขวา */
 .main {
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: visible !important;
}
 .dashboard-section {
    padding: 1rem 0.5rem;
    max-width: 100vw;      /* ป้องกันล้นหน้าจอ */
    box-sizing: border-box;
  }
  .chart-container {
    height: 180px;
    max-width: 100vw;
    box-sizing: border-box;
    overflow-x: auto;
  }
  .chart-container.overall {
    height: auto !important;
    min-height: 0;
    max-height: none !important;
  }
  .chart-container.overall canvas {
    height: 160px !important;   /* ให้กราฟเตี้ยลงบนจอเล็ก */
  }
  
}

.notification-dropdown { position: absolute; right: 0; top: 38px; background: #fff; border-radius: 18px 0 18px 18px; box-shadow: 0 8px 24px 0 rgba(27, 50, 98, 0.14), 0 2px 4px 0 rgba(33, 125, 215, 0.06); min-width: 330px; max-width: 370px; max-height: 420px; overflow-y: auto; z-index: 1002; padding: 0; border: none; animation: fadeDown 0.22s; }


/* ตัวเลือก: บังคับลูกทุกตัวใน .filter-options ให้จัดกึ่งกลางแนวตั้งและมี margin เท่ากัน */
.filter-options > * {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;
}
@media (max-width: 600px) {
  .filter-options > * { margin-bottom: 0; }
}
/* ฟิลเตอร์ของการ์ด "สนามกีฬาของหน่วยงาน" ให้ชิดกันและชิดซ้าย */
.field-filter {
  justify-content: flex-end;          /* >>> ชิดขวาเหมือนการ์ดอื่น */
  align-items: center;
  gap: 12px;                          /* ระยะห่างกำลังดี */
  margin: 1.3rem 1.5rem 0.2rem 0;     /* ให้เท่ากับ .filter-options ทั่วไป */
}

.field-filter label,
.field-filter span { min-width: unset; margin-bottom: 0; }

.field-filter select {
  min-width: 72px;
  max-width: 140px;
}

/* ลบ margin-bottom ของลูกใน row นี้ (ทับ global rule) */
.field-filter > * { margin-bottom: 0; }

/* มือถือยังคงซ้อนเป็นคอลัมน์ตามเดิมได้ */
@media (max-width: 600px) {
  .field-filter {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    margin: 0.7rem 0.3rem 0.1rem 0.3rem;   /* ให้พฤติกรรมเหมือนการ์ดอื่นตอนจอเล็ก */
  }
  .field-filter select { width: 100%; max-width: 100%; }
}

</style>

<style>
@import '../css/style.css';
</style>