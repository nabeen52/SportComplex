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

    <!-- Main Content -->
    <div class="main">
      <header class="topbar">
  <button class="menu-toggle" @click="toggleSidebar">☰</button>
  <div class="topbar-actions">
    <!-- Export PDF -->
    <button @click="exportPDFHandler" class="export-btn">
    <i class="pi pi-file-pdf"></i> Export PDF
  </button>




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


      <!-- Filter Section -->
      <div class="filter-options">
    <label>ประเภท:
      <select v-model="selectedType">
        <option value="field">สนามกีฬา</option>
        <option value="equipment">อุปกรณ์กีฬา</option>
      </select>
    </label>
    <label>ชื่อสนาม:
  <select v-model="selectedFieldName" :disabled="selectedType !== 'field'">
    <option value="">ทั้งหมด</option>
    <option v-for="name in allFieldNames" :key="name" :value="name">{{ name }}</option>
  </select>
</label>

    <!-- เดือน, ปี, แสดงสูงสุด ตามเดิม -->
    <label>เดือน:
  <select v-model="selectedMonth">
    <option value="">ทั้งหมด</option>
    <option v-for="(m, i) in months" :key="i" :value="i+1">{{ m }}</option>
  </select>
</label>
<label>ปี:
  <select v-model="selectedYear">
    <option value="">ทั้งหมด</option>
    <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
  </select>
</label>
<label>แสดงสูงสุด:
  <select v-model="showLimit">
    <option :value="null">ทั้งหมด</option>
    <option v-for="n in [5,10,15,20,50,100]" :key="n" :value="n">{{ n }} รายการ</option>
  </select>
</label>

<label>หน่วย:
  <select v-model="unitType" :disabled="selectedType !== 'field'">
    <option value="usage">ครั้ง/ชั่วโมง</option>
    <option value="hours">ชั่วโมง/ครั้ง</option>
  </select>
</label>

  </div>

  <div class="dashboard-grid">
    <div class="dashboard-section">
      <!-- แสดงกราฟเฟรมเดียว พร้อม title ตามประเภท -->
      <h2 class="dashboard-title">
        สถิติการใช้งาน "{{ selectedType === 'field' ? 'สนามกีฬา' : 'อุปกรณ์กีฬา' }}"
      </h2>
      <UnitUsageChart
        :units="filteredUnits"
        :unitType="unitType"
      />
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
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
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
const filteredFieldUnits = ref([])
const filteredEquipUnits = ref([])
const isSidebarClosed = ref(false)

// Filter state
const selectedMonth = ref('')
const selectedYear = ref('')
const showLimit = ref(5)
const months = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]
const currentYear = new Date().getFullYear()
const years = [currentYear, currentYear - 1, currentYear - 2]

// เพิ่ม state และ logic
const selectedType      = ref('field')
const selectedFieldName = ref('')
const unitType          = ref('usage')

// ==== กระดิ่งแจ้งเตือน ====
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null

// รีเซ็ต fieldName และ unitType เมื่อเปลี่ยนประเภท
watch(selectedType, () => {
  selectedFieldName.value = ''
  unitType.value = 'usage'
})




// คำนวณ filteredUnits ใน computed
const filteredUnits = computed(() => {
  // ไม่ต้อง filter base ตรงนี้
  const base = selectedType.value === 'field' ? fieldUnits.value : equipUnits.value
  return filterTopUnits(base, showLimit.value)
})

// ดึงชื่อสนามที่ไม่ซ้ำกันทั้งหมดจาก fieldUnits.value
const allFieldNames = computed(() => {
  const names = new Set()
  fieldUnits.value.forEach(unit => {
    if (unit.usageByMonthYear) {
      unit.usageByMonthYear.forEach(row => {
        // ต้องมี fieldName, และมี usage หรือ hours > 0
        if (
          row.fieldName &&
          (
            (unitType.value === 'usage' && row.usage > 0) ||
            (unitType.value === 'hours' && row.hours > 0)
          )
        ) {
          names.add(row.fieldName)
        }
      })
    }
  })
  return Array.from(names)
})


// exportPDFHandler ใช้ logic เดิมตามประเภท
function exportPDFHandler() {
  if (selectedType.value === 'field') {
    exportPDF(filteredUnits.value, 'รายงานสถิติการใช้สนามกีฬา', 'field-usage-report.pdf')
  } else {
    exportPDF(filteredUnits.value, 'รายงานสถิติการใช้อุปกรณ์กีฬา', 'equipment-usage-report.pdf')
  }
}

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
  } catch (err) {/* ไม่ต้องแจ้งเตือน error */}
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





// ====== fetch และ watch หน่วยงาน ======
onMounted(async () => {
  // กระดิ่ง
  document.addEventListener('mousedown', handleClickOutside)
  fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)

  // ดึงข้อมูล usage
  try {
    const resField = await axios.get(`${API_BASE}/api/information?type=field`)
    fieldUnits.value = resField.data
  } catch {
    fieldUnits.value = []
  }
  try {
    const resEquip = await axios.get(`${API_BASE}/api/information?type=equipment`)
    equipUnits.value = resEquip.data
  } catch {
    equipUnits.value = []
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  clearInterval(polling)
})

function filterTopUnits(units, limit) {
  if (selectedType.value === 'field') {
    let result = []
    units.forEach(unit => {
      if (!unit.usageByMonthYear) return
      // filter เฉพาะ fieldName, เดือน, ปี
      let filtered = unit.usageByMonthYear.filter(row => {
        if (selectedFieldName.value && row.fieldName) {
          if (row.fieldName.trim() !== selectedFieldName.value.trim()) return false
        }
        if (selectedMonth.value && row.month !== Number(selectedMonth.value)) return false
        if (selectedYear.value && row.year !== Number(selectedYear.value)) return false
        return true
      })
      // รวม usage กับ hours
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
    // sort (desc)
    let sortKey = unitType.value === 'hours' ? 'hours' : 'usage'
    result = result.sort((a, b) => b[sortKey] - a[sortKey])
    // ถ้า limit = null => ไม่ slice (โชว์ทั้งหมดที่มีข้อมูล)
    if (limit != null && typeof limit === 'number') {
      result = result.slice(0, limit)
    }
    return result
  }
  // --- equipment เดิม เอาเฉพาะ usage>0 ---
  let data = units.map(unit => {
    let usage = 0
    if (selectedYear.value && selectedMonth.value && unit.usageByMonthYear) {
      usage = unit.usageByMonthYear.find(u =>
        u.year === Number(selectedYear.value) && u.month === Number(selectedMonth.value)
      )?.usage || 0
    } else if (!selectedYear.value && selectedMonth.value && unit.usageByMonthYear) {
      usage = unit.usageByMonthYear.filter(u => u.month === Number(selectedMonth.value))
        .reduce((sum, u) => sum + u.usage, 0) || 0
    } else if (selectedYear.value && !selectedMonth.value && unit.usageByMonthYear) {
      usage = unit.usageByMonthYear.filter(u => u.year === Number(selectedYear.value))
        .reduce((sum, u) => sum + u.usage, 0) || 0
    } else if (unit.usage !== undefined) {
      usage = unit.usage
    }
    return { ...unit, usage }
  }).filter(u => u.usage > 0)  // เพิ่ม filter เฉพาะที่มีข้อมูล
  data = data.sort((a, b) => b.usage - a.usage)
  if (limit != null && typeof limit === 'number') {
    data = data.slice(0, limit)
  }
  return data
}




watch([fieldUnits, selectedMonth, selectedYear, showLimit], () => {
  filteredFieldUnits.value = filterTopUnits(fieldUnits.value, showLimit.value)
}, { immediate: true })

watch([equipUnits, selectedMonth, selectedYear, showLimit], () => {
  filteredEquipUnits.value = filterTopUnits(equipUnits.value, showLimit.value)
}, { immediate: true })

function exportFieldPDF() {
  exportPDF(filteredFieldUnits.value, 'รายงานสถิติการใช้สนามกีฬา', 'field-usage-report.pdf')
}

function exportEquipPDF() {
  exportPDF(filteredEquipUnits.value, 'รายงานสถิติการใช้อุปกรณ์กีฬา', 'equipment-usage-report.pdf')
}

function exportPDF(data, header, filename) {
  try {
    // สร้างเอกสาร PDF
    const pdf = new jsPDF();
    // ใช้ Sarabun แบบ normal (แนะนำให้ import Sarabun-Regular-normal.js ไว้ใน project)
    pdf.setFont('Sarabun', 'normal');
    pdf.setFontSize(18);

    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 25;

    // ชื่อมหาวิทยาลัย
    pdf.text('ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // หัวข้อรายงาน
    pdf.setFontSize(16);
    pdf.text(header, pageWidth / 2, y, { align: 'center' });
    y += 14;

    pdf.setFontSize(13);

    // ข้อมูล filter (filter summary)
    const filterLine = [
      `ประเภท: ${selectedType.value === 'field' ? 'สนามกีฬา' : 'อุปกรณ์กีฬา'}`,
      selectedType.value === 'field' && selectedFieldName.value ? `ชื่อสนาม: ${selectedFieldName.value}` : '',
      `เดือน: ${selectedMonth.value ? months[Number(selectedMonth.value) - 1] : 'ทั้งหมด'}`,
      `ปี: ${selectedYear.value || 'ทั้งหมด'}`,
      `แสดงสูงสุด: ${showLimit.value ? showLimit.value + ' รายการ' : 'ทั้งหมด'}`,
      `หน่วย: ${unitType.value === 'hours' ? 'ชั่วโมง/ครั้ง' : 'ครั้ง/ชั่วโมง'}`
    ].filter(Boolean).join('   ');

    // แสดง filter summary แบบไม่ซ้อน
    const filterLines = pdf.splitTextToSize(filterLine, pageWidth - 40);
    filterLines.forEach(line => {
      pdf.text(line, pageWidth / 2, y, { align: 'center' });
      y += 8;
    });

    // วันที่ / เวลา
    const now = new Date();
    pdf.setFontSize(13);
    pdf.text(`วันที่: ${now.toLocaleDateString('th-TH')}`, 15, y);
    pdf.text(`เวลา: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 50, y);

    y += 12;

    // เนื้อหา intro
    pdf.setFontSize(13);
    const intro = 'รายงานแสดงสรุปสถิติการใช้บริการของแต่ละหน่วยงาน';
    const introLines = pdf.splitTextToSize(intro, pageWidth - 30);
    introLines.forEach(line => {
      pdf.text(line, 15, y);
      y += 8;
    });
    y += 10;

    // หัวข้อข้อมูลหลัก
    pdf.setFontSize(14);
    pdf.text('สรุปการใช้บริการแต่ละหน่วยงาน', pageWidth / 2, y, { align: 'center' });
    y += 10;
    pdf.setFontSize(13);

    // ตารางข้อมูล
    let totalUsage = 0, totalHours = 0;
    const lineHeight = 9, marginBottom = 18, leftX = 20, rightX = pageWidth - 20;

    if (!data.length) {
      pdf.text('ไม่มีข้อมูลการใช้งาน', leftX, y);
      y += lineHeight;
    } else {
      data.forEach((u, i) => {
        // ขึ้นหน้าใหม่ถ้าเต็ม
        if (y + lineHeight > pdf.internal.pageSize.getHeight() - marginBottom) {
          pdf.addPage();
          y = 25;
          pdf.setFontSize(14);
          pdf.text('ต่อจากหน้าเดิม', leftX, y);
          y += 10;
          pdf.setFontSize(13);
        }
        pdf.text(`${i + 1}. ${u.unit}`, leftX, y);
        let rightText = '';
        if (unitType.value === 'hours') {
          rightText = `จำนวนชั่วโมง: ${u.hours || 0} | จำนวนครั้ง: ${u.usage || 0}`;
        } else {
          rightText = `จำนวนครั้ง: ${u.usage || 0} | จำนวนชั่วโมง: ${u.hours || 0}`;
        }
        pdf.text(rightText, rightX, y, { align: 'right' });
        y += lineHeight;
        totalUsage += u.usage || 0;
        totalHours += u.hours || 0;
      });
      y += 4;
      pdf.setFontSize(13);
      if (unitType.value === 'hours') {
        pdf.text(`รวมชั่วโมง: ${totalHours} | รวมครั้ง: ${totalUsage}`, leftX, y);
      } else {
        pdf.text(`รวมครั้ง: ${totalUsage} | รวมชั่วโมง: ${totalHours}`, leftX, y);
      }
    }

    y += marginBottom;
    if (y > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage();
      y = 25;
    }
    pdf.setFontSize(12);
    pdf.text('ผู้จัดทำ: ...........................................................', leftX, y);
    y += 7;
    pdf.text('ระบบจัดการศูนย์กีฬา มหาวิทยาลัยแม่ฟ้าหลวง', leftX, y);

    // Save PDF
    pdf.save(filename);
  } catch (e) {
    alert('Export PDF Error: ' + e.message);
  }
}




</script>

<style scoped>


.filter-options {
  display: flex;
  flex-wrap: wrap;       /* เพิ่มบรรทัดนี้ */
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
  min-width: 110px;   /* ปรับได้ตามต้องการ */
  margin-bottom: 5px;
}
.filter-options select {
  min-width: 75px;
  max-width: 135px;
}


.dashboard-grid {
  flex: 1 1 0;               /* ให้กินพื้นที่ว่างที่เหลือ */
  display: flex;
  flex-direction: column; 
  gap: 32px;
  padding: 1.5rem 1rem 0 1rem;
  justify-content: center;
  margin-bottom: 32px
}
.dashboard-section {
  flex: 1 1 0;      
  background: #f9fafb;
  border-radius: 16px;
  box-shadow: 0 6px 32px rgba(30, 58, 138, 0.09);
  padding: 2.5rem 1.8rem 3.5rem 1.8rem;   /* ปรับจาก 2rem เป็น 3.5rem ด้านล่าง */
   width: 100%;           /* ขยายเต็มขอบของ grid */
  max-width: 100%;       /* แก้จาก 98vw เป็น 100% */
  min-width: 0;          /* ยืดหยุ่น */
  display: flex;
  flex-direction: column;
  align-items: stretch;   
  min-height: 0;
  
  
}

.dashboard-title {
  color: #153477;
  font-size: 1.35rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.8rem;
  margin-top: 0;
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
}

</style>

<style>
@import '../css/style.css';
</style>