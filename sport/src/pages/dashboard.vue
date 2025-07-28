<template>
  <div class="layout" :class="{ 'sidebar-closed': isSidebarClosed }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/dashboard" exact-active-class="active">
          <i class="pi pi-chart-pie"></i> Dashboard
        </router-link>
        <router-link to="/home_admin" exact-active-class="active">
          <i class="pi pi-megaphone"></i> Edit News
        </router-link>
        <router-link to="/edit_field" active-class="active">
          <i class="pi pi-map-marker"></i> Edit Field
        </router-link>
        <router-link to="/edit_equipment" active-class="active">
          <i class="pi pi-clipboard"></i> Edit Equipment
        </router-link>
        <router-link to="/booking_field_admin" active-class="active">
          <i class="pi pi-map-marker"></i> Book Field
        </router-link>
        <router-link to="/approve_field" active-class="active">
          <i class="pi pi-verified"></i> Approve
        </router-link>
        <router-link to="/return_admin" active-class="active">
            <i class="pi pi-box"></i> Return
          </router-link>
        <router-link to="/members" active-class="active">
          <i class="pi pi-user-edit"></i> Member
        </router-link>
        <router-link to="/history_admin" active-class="active">
          <i class="pi pi-history"></i> History System
        </router-link>
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
      <button class="notification-btn" @click="toggleNotifications">
        <i class="pi pi-bell"></i>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </button>
      <div v-if="showNotifications" class="notification-dropdown">
  
  <ul>
    <li v-for="(noti, idx) in notifications" :key="idx">{{ noti.message }}</li>
    <li v-if="notifications.length === 0">ไม่มีแจ้งเตือน</li>
  </ul>
</div>
    </div>
    <!-- ปุ่มโปรไฟล์ (ขวา) -->
    <router-link to="/profile_admin" class="profile-link">
      <i class="pi pi-user"></i>
    </router-link>
  </div>
</header>


        <!-- Card 1: สนามกีฬา -->
      <div class="dashboard-grid">
        <div class="dashboard-section">
         <div class="dashboard-section-header">
  <div class="header-spacer"></div>
  <h2 class="dashboard-title">สถิติการใช้งาน "สนามกีฬา"</h2>
  <button @click="exportFieldPDF" class="export-btn">ExportPDF</button>
</div>

          <div class="filter-options">
            <label>ชื่อสนาม:
              <select v-model="selectedFieldName">
                <option value="">ทั้งหมด</option>
                <option v-for="name in allFieldNames" :key="name" :value="name">{{ name }}</option>
              </select>
            </label>
            <label>เดือน:
              <select v-model="selectedFieldMonth">
                <option value="">ทั้งหมด</option>
                <option v-for="(m, i) in months" :key="i" :value="i+1">{{ m }}</option>
              </select>
            </label>
            <label>ปี:
              <select v-model="selectedFieldYear">
                <option value="">ทั้งหมด</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </label>
            <label>แสดงสูงสุด:
              <select v-model="fieldShowLimit">
                <option :value="null">ทั้งหมด</option>
                <option v-for="n in [5,10,15,20,50,100]" :key="n" :value="n">{{ n }} รายการ</option>
              </select>
            </label>
          </div>
         
          <UnitUsageChart :units="filteredFieldUnits" unitType="usage" />
        </div>

        <!-- Card 2: อุปกรณ์กีฬา -->
        <div class="dashboard-section">
         <div class="dashboard-section-header">
  <div class="header-spacer"></div>
  <h2 class="dashboard-title">สถิติการใช้งาน "อุปกรณ์กีฬา"</h2>
  <button @click="exportEquipPDF" class="export-btn equip">ExportPDF</button>
</div>

          <div class="filter-options">
            <label>ชื่ออุปกรณ์:
              <select v-model="selectedEquipName">
                <option value="">ทั้งหมด</option>
                <option v-for="name in allEquipNames" :key="name" :value="name">{{ name }}</option>
              </select>
            </label>
            <label>เดือน:
              <select v-model="selectedEquipMonth">
                <option value="">ทั้งหมด</option>
                <option v-for="(m, i) in months" :key="i" :value="i+1">{{ m }}</option>
              </select>
            </label>
            <label>ปี:
              <select v-model="selectedEquipYear">
                <option value="">ทั้งหมด</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </label>
            <label v-if="!isSingleEquipMode">
  แสดงสูงสุด:
  <select v-model="equipShowLimit">
    <option :value="null">ทั้งหมด</option>
    <option v-for="n in [5,10,15,20,50,100]" :key="n" :value="n">{{ n }} รายการ</option>
  </select>
</label>
          </div>
         
          <UnitUsageChart :units="filteredEquipUnits" unitType="equipment" />
        </div>
      </div>

      <!-- Footer -->
      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel. 053-917-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
            Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
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

// State
const fieldUnits = ref([])
const equipUnits = ref([])
const isSidebarClosed = ref(false)

// ---- Filter "สนามกีฬา" ----
const selectedFieldName = ref('')
const selectedFieldMonth = ref('')
const currentYear = new Date().getFullYear()
const years = [currentYear, currentYear - 1, currentYear - 2]
const selectedFieldYear = ref(currentYear)
const fieldShowLimit = ref(5)

// ---- Filter "อุปกรณ์กีฬา" ----
const selectedEquipName = ref('')
const selectedEquipMonth = ref('')
const selectedEquipYear = ref(currentYear)
const equipShowLimit = ref(5)

const months = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]
const isSingleEquipMode = computed(() => !!selectedEquipName.value);



const isMobile = ref(window.innerWidth <= 600)

function handleResize() { isMobile.value = window.innerWidth <= 600 }
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))




// ==== กระดิ่งแจ้งเตือน ====
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}
function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) unreadCount.value = 0
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
  } catch {}
}
function closeNotifications() { showNotifications.value = false }
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

  // ดึงข้อมูล usage
  try {
    const resField = await axios.get(`${API_BASE}/api/information?type=field`)
    fieldUnits.value = resField.data
  } catch { fieldUnits.value = [] }
  try {
    const resEquip = await axios.get(`${API_BASE}/api/equipments`)
equipUnits.value = resEquip.data
  } catch { equipUnits.value = [] }
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  clearInterval(polling)
})

// ======= สนามกีฬา =======
const allFieldNames = computed(() => {
  const names = new Set()
  fieldUnits.value.forEach(unit => {
    if (unit.usageByMonthYear) {
      unit.usageByMonthYear.forEach(row => {
        if (row.fieldName) names.add(row.fieldName)
      })
    }
  })
  return Array.from(names)
})

const filteredFieldUnits = computed(() => {
  let result = []
  fieldUnits.value.forEach(unit => {
    if (!unit.usageByMonthYear) return
    let filtered = unit.usageByMonthYear.filter(row => {
      if (selectedFieldName.value && row.fieldName.trim() !== selectedFieldName.value.trim()) return false
      if (selectedFieldMonth.value && row.month !== Number(selectedFieldMonth.value)) return false
      if (selectedFieldYear.value && row.year !== Number(selectedFieldYear.value)) return false
      return true
    })
    let sumUsage = filtered.reduce((acc, f) => acc + (f.usage || 0), 0)
    let sumHours = filtered.reduce((acc, f) => acc + (f.hours || 0), 0)
    if (sumUsage > 0 || sumHours > 0) {
      result.push({
        unit: unit.unit,
        usage: sumUsage,
        hours: sumHours
      })
    }
  })
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
  // ถ้าเลือกชื่ออุปกรณ์แล้ว
  if (selectedEquipName.value) {
    // กราฟ X = เดือน, Y = จำนวนการใช้ ในปีที่เลือก (หรือปีปัจจุบันถ้าไม่ได้เลือกปี)
    const targetYear = selectedEquipYear.value || currentYear;
    // หาอุปกรณ์
    const equip = equipUnits.value.find(u => u.name === selectedEquipName.value);
    if (!equip || !equip.usageByMonthYear) return [];

    // ถ้าเลือกเดือนด้วย → แสดงแค่เดือนนั้น
    if (selectedEquipMonth.value) {
      const usage = equip.usageByMonthYear.find(u =>
        u.year === Number(targetYear) && u.month === Number(selectedEquipMonth.value)
      )?.usage || 0;
      return [{
        unit: `${months[selectedEquipMonth.value - 1]}`,
        usage,
      }];
    } else {
      // ไม่เลือกเดือน แสดงทุกเดือนของปี
      const monthArr = Array.from({ length: 12 }, (_, i) => i + 1);
      return monthArr.map(m => {
        const usage = equip.usageByMonthYear.find(u =>
          u.year === Number(targetYear) && u.month === m
        )?.usage || 0;
        return {
          unit: months[m - 1], // ชื่อเดือน
          usage,
        }
      });
    }
  }

  // ========== ด้านล่างนี้คือกรณี "ทั้งหมด" ==========
  let data = equipUnits.value.map(unit => {
    let usage = 0;
    if (selectedEquipYear.value && selectedEquipMonth.value && unit.usageByMonthYear) {
      usage = unit.usageByMonthYear.find(u =>
        u.year === Number(selectedEquipYear.value) && u.month === Number(selectedEquipMonth.value)
      )?.usage || 0
    } else if (!selectedEquipYear.value && selectedEquipMonth.value && unit.usageByMonthYear) {
      usage = unit.usageByMonthYear.filter(u => u.month === Number(selectedEquipMonth.value))
        .reduce((sum, u) => sum + u.usage, 0) || 0
    } else if (selectedEquipYear.value && !selectedEquipMonth.value && unit.usageByMonthYear) {
      usage = unit.usageByMonthYear.filter(u => u.year === Number(selectedEquipYear.value))
        .reduce((sum, u) => sum + u.usage, 0) || 0
    } else if (unit.usageCount !== undefined) {
      usage = unit.usageCount
    }
    return usage > 0 ? { unit: unit.name, usage } : null
  }).filter(u => u !== null);

  // "แสดงสูงสุด" ใช้ได้เฉพาะกรณีนี้
  if (equipShowLimit.value != null && typeof equipShowLimit.value === 'number') {
    data = data.sort((a, b) => b.usage - a.usage).slice(0, equipShowLimit.value);
  }
  return data;
});



// ====== Export PDF ======
function exportFieldPDF() {
  exportPDF(
    filteredFieldUnits.value,
    'รายงานสถิติการใช้สนามกีฬา',
    'field-usage-report.pdf',
    [
      `ชื่อสนาม: ${selectedFieldName.value || 'ทั้งหมด'}`,
      `เดือน: ${selectedFieldMonth.value ? months[selectedFieldMonth.value - 1] : 'ทั้งหมด'}`,
      `ปี: ${selectedFieldYear.value || 'ทั้งหมด'}`,
      `แสดงสูงสุด: ${fieldShowLimit.value ? fieldShowLimit.value + ' รายการ' : 'ทั้งหมด'}`
    ].join('   ')
  )
}
function exportEquipPDF() {
  exportPDF(
    filteredEquipUnits.value,
    'รายงานสถิติการใช้อุปกรณ์กีฬา',
    'equipment-usage-report.pdf',
    [
      `ชื่ออุปกรณ์: ${selectedEquipName.value || 'ทั้งหมด'}`,
      `เดือน: ${selectedEquipMonth.value ? months[selectedEquipMonth.value - 1] : 'ทั้งหมด'}`,
      `ปี: ${selectedEquipYear.value || 'ทั้งหมด'}`,
      `แสดงสูงสุด: ${equipShowLimit.value ? equipShowLimit.value + ' รายการ' : 'ทั้งหมด'}`
    ].join('   '),
    'equipment'   // <- เพิ่มตรงนี้
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
        } else {
          rightText = `จำนวนครั้ง: ${u.usage || 0} | จำนวนชั่วโมง: ${u.hours || 0}`
        }
        pdf.text(rightText, rightX, y, { align: 'right' }); y += lineHeight
        totalUsage += u.usage || 0
        totalHours += u.hours || 0
      })
      y += 4
      if (type === 'equipment') {
        pdf.text(`รวมการใช้งาน: ${totalUsage} ครั้ง`, leftX, y)
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
  padding: 2.5rem 1.8rem 2rem 1.8rem;
  width: 100%;
  min-width: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
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
.export-btn {
  background: #d32f2f;
  color: white;
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
.export-btn.equip {
  background: #488bff;
}
.export-btn.equip:hover {
  background: #1a235d;
}
.export-btn:hover {
  background: #b71c1c;
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
    margin-left: 0 !important;
    width: 100vw !important;
    min-width: 0;
    overflow-x: hidden;
  }
}


</style>

<style>
@import '../css/style.css';
</style>