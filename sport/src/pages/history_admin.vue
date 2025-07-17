<template>
  <div class="layout">
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

    <div class="main" :class="{ 'sidebar-closed': isSidebarClosed }">
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

      <div style="background-color: #dbe9f4;">
        <div class="histbody">
          <h1 style="display: flex; justify-content: center;">History (Admin/Staff)</h1>
          <div class="history-filter">
            <button :class="{ active: historyFilter === 'all' }" @click="setHistoryFilter('all')">ทั้งหมด</button>
            <button :class="{ active: historyFilter === 'field' }" @click="setHistoryFilter('field')">สถานที่</button>
            <button :class="{ active: historyFilter === 'equipment' }" @click="setHistoryFilter('equipment')">อุปกรณ์กีฬา</button>
          </div>
          <div class="hist-grid" :class="{ 'sidebar-closed': isSidebarClosed }">
            <template v-for="group in paginatedGroups" :key="group.type + '_' + (group.items[0].booking_id || group.items[0].id)">
              <!-- Field card -->
              <div v-if="group.type === 'field'">
                <div class="hist-date-outside">
                  {{ formatDate(group.items[0].approvedAt || group.items[0].date) }}
                </div>
                <div class="hist-card">
                  <div class="hist-row" style="font-weight:600; border-bottom:1px solid #eee; background-color: #a1bdff">
                    <span class="hist-user">ผู้ใช้</span>
                    <span class="hist-name">ชื่อสนาม</span>
                    <span class="hist-detail">เวลา</span>
                    <span class="hist-status">สถานะ</span>
                    <span class="hist-file">ดูไฟล์แนบ</span>
                    <span class="hist-action">รายละเอียด</span>
                  </div>
                  <div class="hist-row">
                    <span class="hist-user">{{ group.items[0].userName }}</span>
                    <span class="hist-name">{{ group.items[0].name }}</span>
                    <span class="hist-detail">เวลา: {{ group.items[0].time }}</span>
                    <span class="hist-status">
                      <span v-if="group.items[0].status && group.items[0].status.toLowerCase() === 'returned'">👍 Returned</span>
                      <span v-else-if="group.items[0].status && group.items[0].status.toLowerCase() === 'approved'">✅ Approved</span>
                      <span v-else-if="group.items[0].status && group.items[0].status.toLowerCase() === 'disapproved'">❌ Disapproved</span>
                      <span v-else-if="group.items[0].status && group.items[0].status.toLowerCase() === 'cancel'" class="cancel-status">🚫 Cancel</span>
                      <span v-else>-</span>
                    </span>
                    <span class="hist-file">
                      <button class="toggle-btn" @click="toggleExpand(group.items[0].id)">
                        รายละเอียดไฟล์ ▾
                      </button>
                    </span>
                    <span class="hist-action">
                      <button class="remark-btn" @click="showDetailGroup(group)">Detail</button>
                      <button v-if="group.items[0].status && group.items[0].status.toLowerCase() === 'approved'"
                        class="cancel-btn"
                        @click="cancelFieldBooking(group.items[0])"
                        style="margin-left: 10px"
                      >Cancel</button>
                    </span>
                  </div>
                  <transition name="slide">
                    <div class="hist-file-detail-box" v-show="expandedRows.includes(group.items[0].id)">
                      <div class="hist-file-header">
                        <b>ไฟล์แนบ</b>
                        <!-- ปุ่มดาวน์โหลด PDF -->
                        <button class="pdfmake-btn" @click="exportPdf(group.items[0])">ดาวน์โหลด PDF ฟอร์ม</button>
                      </div>
                      <div v-if="Array.isArray(group.items[0].fileName) && group.items[0].fileName.length">
                        <table class="attached-files-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>ชื่อไฟล์</th>
                              <th>ดาวน์โหลด/เปิด</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(fname, idx) in group.items[0].fileName" :key="idx">
                              <td>{{ idx + 1 }}</td>
                              <td>{{ fname }}</td>
                              <td>
                                <a
                                  :href="`http://localhost:3000/api/history/file/${group.items[0].id}?fileIdx=${idx}`"
                                  target="_blank"
                                  class="download-link"
                                  download
                                >ดาวน์โหลด/เปิด</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div v-else class="no-attachment">
                        - ไม่มีไฟล์แนบ -
                      </div>
                    </div>
                  </transition>
                </div>
              </div>
              <!-- Equipment card -->
              <div v-else-if="group.type === 'equipment'">
                <div class="hist-date-outside">
                  {{ formatDate(group.items[0].returnedAt || group.items[0].date) }}
                </div>
                <div class="hist-card">
                  <div class="hist-row" style="font-weight:600; border-bottom:1px solid #eee; background-color: #a1bdff">
                    <span class="hist-user">รายการอุปกรณ์</span>
                    <span class="hist-name">วันที่ทำรายการ</span>
                    <span class="hist-detail">จำนวน</span>
                    <span class="hist-status">สถานะ</span>
                    <span class="hist-file">ดูไฟล์แนบ</span>
                    <span class="hist-action">
                      <button class="remark-btn" @click="showDetailGroup(group)">Detail</button>
                    </span>
                  </div>
                  <div class="hist-row" v-for="item in group.items" :key="item.id" style="border-bottom:1px dashed #ccc;">
                    <span class="hist-user">{{ item.name }}</span>
                    <span class="hist-name">
                      <template v-if="item.since && item.uptodate">
                        {{ formatDate(item.since) }} - {{ formatDate(item.uptodate) }}
                      </template>
                      <template v-else>
                        {{ formatDate(item.date) }}
                      </template>
                    </span>
                    <span class="hist-detail">{{ item.quantity }}</span>
                    <span class="hist-status">
                      <span v-if="item.status && item.status.toLowerCase() === 'returned'">👍 Returned</span>
                      <span v-else-if="item.status && item.status.toLowerCase() === 'approved'">✅ Approved</span>
                      <span v-else-if="item.status && item.status.toLowerCase() === 'disapproved'">❌ Disapproved</span>
                      <span v-else-if="item.status && item.status.toLowerCase() === 'pending'">⌛ Pending</span>
                      <span v-else-if="item.status && item.status.toLowerCase() === 'return-pending'">⏪ Return-pending</span>
                      <span v-else-if="item.status">- {{ item.status }}</span>
                      <span v-else>-</span>
                    </span>
                    <span class="hist-file">
                      <button class="toggle-btn" @click="toggleExpand(item.id)">
                        รายละเอียดไฟล์ ▾
                      </button>
                    </span>
                    <span class="hist-action"></span>
                  </div>
                  <div v-for="item in group.items" :key="item.id + '-file-detail'">
                    <!-- ใน <div v-for="item in group.items" ... >  (ของ equipment) -->
<transition name="slide">
  <div class="hist-file-detail-box" v-show="expandedRows.includes(item.id)">
    <div class="hist-file-header">
      <b>ไฟล์แนบ</b>
      <button class="pdfmake-btn" @click="exportPdf(item)">ดาวน์โหลด PDF ฟอร์ม</button>
    </div>
    <div v-if="Array.isArray(item.attachment) && item.attachment.length">
  <table class="attached-files-table">
    <thead>
      <tr>
        <th>#</th>
        <th>ชื่อไฟล์</th>
        <th>ดาวน์โหลด/เปิด</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(attachId, idx) in item.attachment" :key="attachId">
        <td>{{ idx + 1 }}</td>
        <td>{{ item.fileName[idx] || '-' }}</td>
        <td>
          <a
            :href="`http://localhost:3000/api/history/file/${item.id}?fileIdx=${idx}`"
            target="_blank"
            class="download-link"
            download
          >ดาวน์โหลด/เปิด</a>
        </td>
      </tr>
    </tbody>
  </table>
</div>
<div v-else class="no-attachment">
  - ไม่มีไฟล์แนบ -
</div>

  </div>
</transition>


                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="pagination-control">
            <button @click="prevPage" :disabled="currentPage === 1">ย้อนกลับ</button>
            <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages">ถัดไป</button>
          </div>
        </div>
      </div>

      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University | Tel. 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
            Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>




<script>
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import axios from 'axios'
import Swal from 'sweetalert2'

// (ถ้าจะใช้ภาษาไทย ต้อง import Sarabun font ที่ bundle มาแล้วใน public หรือ assets ตามตัวอย่างด้านล่าง)
import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'
// ... import font ตัวอื่นๆ ถ้ามี

const API_BASE = import.meta.env.VITE_API_BASE



function getEquipmentGroupSortDate(group) {
  // ถ้ามี Disapproved, ใช้วันที่ล่าสุดใน disapprovedAt ของ item ที่ถูก Disapproved
  const disapprovedDates = group.items
    .filter(it => it.status && it.status.toLowerCase() === 'disapproved' && it.disapprovedAt)
    .map(it => new Date(it.disapprovedAt));
  if (disapprovedDates.length > 0) {
    return new Date(Math.max(...disapprovedDates.map(d => d.getTime())));
  }
  // ถ้ามี Returned, ใช้วันที่ returnedAt ล่าสุดในกลุ่ม
  const returnedDates = group.items
    .filter(it => it.returnedAt)
    .map(it => new Date(it.returnedAt));
  if (returnedDates.length > 0) {
    return new Date(Math.max(...returnedDates.map(d => d.getTime())));
  }
  // ถ้ามี Approved, ใช้วันที่ approvedAt ล่าสุด
  const approvedDates = group.items
    .filter(it => it.approvedAt)
    .map(it => new Date(it.approvedAt));
  if (approvedDates.length > 0) {
    return new Date(Math.max(...approvedDates.map(d => d.getTime())));
  }
  // fallback: ใช้ date แรก
  return new Date(group.items[0].date || 0);
}

function statusLabel(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved': return 'Approved';
    case 'pending': return 'Pending';
    case 'returned': return 'Returned';
    case 'disapproved': return 'Disapproved';
    case 'cancel': return 'Cancel';
    default: return status;
  }
}

export default {
  data() {
    return {
      isSidebarClosed: false,
      historys: [],
      itemsPerPage: 10,
      currentPage: 1,
      historyFilter: 'all',
      expandedRows: [],
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
    }
  },
  computed: {
    fieldGroups() {
      return this.filteredHistory
        .filter(h => h.type === 'field')
        .map(item => ({ type: 'field', items: [item] }))
    },
    equipmentGroups() {
      const eqList = this.filteredHistory.filter(h => h.type === 'equipment')
      const groups = {}
      for (const item of eqList) {
        const key = item.booking_id || `single_${item.id}`
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      }
      return Object.values(groups).map(list => ({ type: 'equipment', items: list }))
    },
    allGroupsSorted() {
      const all = [
        ...this.fieldGroups.map(g => ({
          ...g,
          sortDate: new Date(g.items[0].approvedAt || g.items[0].date || 0)
        })),
        ...this.equipmentGroups.map(g => ({
          ...g,
          sortDate: getEquipmentGroupSortDate(g)
        })),
      ]
      return all.sort((a, b) => b.sortDate - a.sortDate)
    },
    paginatedGroups() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      return this.allGroupsSorted.slice(start, start + this.itemsPerPage)
    },
    filteredHistory() {
      if (this.historyFilter === 'all') return this.historys
      return this.historys.filter(h => h.type === this.historyFilter)
    },
    totalPages() {
      return Math.ceil(this.allGroupsSorted.length / this.itemsPerPage) || 1
    },
  },
  methods: {
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed
    },
    setHistoryFilter(type) {
      this.historyFilter = type
      this.currentPage = 1
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++
    },
    prevPage() {
      if (this.currentPage > 1) this.currentPage--
    },
    toggleExpand(id) {
      const i = this.expandedRows.indexOf(id)
      if (i > -1) this.expandedRows.splice(i, 1)
      else this.expandedRows.push(id)
    },
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getDate().toString().padStart(2, '0')}/${
        (d.getMonth() + 1).toString().padStart(2, '0')
      }/${(d.getFullYear() % 100).toString().padStart(2, '0')}`
    },
    showDetailGroup(group) {
      let html = ''
      if (group.type === 'field') {
        const item = group.items[0]
        html = `
          <div style="text-align:left;">
            <b>ชื่อสนาม:</b> ${item.name || '-'}<br>
            <b>ชื่อผู้ขอใช้:</b> ${item.requester || item.userName || '-'}<br>
            <b>วันที่:</b> ${item.date ? new Date(item.date).toLocaleDateString('th-TH') : '-'}<br>
            <b>เวลา:</b> ${item.time || '-'}<br>
            <b>สถานะ:</b> ${item.status || '-'}<br>
            <b>ผู้อนุมัติ:</b> ${item.approvedBy || '-'}<br>
            <b>ผู้ไม่อนุมัติ:</b> ${item.disapprovedBy || '-'}<br>
            <b>ผู้รับคืน:</b> ${item.returnedBy || '-'}<br>
            <b>ผู้ยกเลิก:</b> ${item.canceledBy || '-'}
          </div>
        `
      } else if (group.type === 'equipment') {
        html = '<div style="text-align:left;">'
        if (group.items.length === 0) {
          html += `<div>ไม่มีรายการ</div>`
        } else {
          group.items.forEach((item, i) => {
            html += `
              <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #bbb;">
                <b>อุปกรณ์ที่ ${i + 1}:</b> ${item.name || '-'}<br>
                <b>จำนวน:</b> ${item.quantity || '-'}<br>
                <b>ชื่อผู้ขอใช้:</b> ${item.requester || item.userName || '-'}<br>
                <b>วันที่ขอยืม:</b>
                ${item.since && item.uptodate
                  ? `${new Date(item.since).toLocaleDateString('th-TH')} - ${new Date(item.uptodate).toLocaleDateString('th-TH')}`
                  : item.date ? new Date(item.date).toLocaleDateString('th-TH') : '-'
                }<br>
                <b>สถานะ:</b> ${item.status || '-'}<br>
                <b>วันที่คืน:</b> ${item.returnedAt ? new Date(item.returnedAt).toLocaleDateString('th-TH') : '-'}<br>
                <b>ผู้อนุมัติ:</b> ${item.approvedBy || '-'}<br>
                <b>ผู้ไม่อนุมัติ:</b> ${item.disapprovedBy || '-'}<br>
                <b>ผู้คืน:</b> ${item.returnedBy || '-'}<br>
                <b>ผู้ยกเลิก:</b> ${item.canceledBy || '-'}
              </div>
            `
          })
        }
        html += '</div>'
      }
      Swal.fire({
        title: 'รายละเอียดรายการ',
        html,
        confirmButtonText: 'ปิด',
        confirmButtonColor: '#3085d6'
      })
    },

    // ==== PDF DOWNLOAD BUTTON ====
    // ==== PDF DOWNLOAD BUTTON ====
  async exportPdf(item) {
  // --- รองรับ field/equipment ---
  const mainBookingId = item.booking_field_id || item.booking_equipment_id || item.booking_id;
  const mainId = item.id || item._id;
  if (!mainBookingId) {
    Swal.fire('ผิดพลาด', 'ไม่พบ booking_id สำหรับรายการนี้', 'error');
    return;
  }

  const formatDate = date => {
    if (!date) return '-';
    const d = new Date(date);
    if (!isNaN(d)) return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    return date;
  };
  const formatTime = time => {
    if (!time) return '-';
    if (/^\d{2}:\d{2}/.test(time)) return time;
    const t = new Date(`2000-01-01T${time}`);
    if (!isNaN(t)) return t.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return time;
  };

  try {
    if (item.type === 'field') {
      // ------- FIELD -------
      const res = await axios.get(`${API_BASE}/api/booking_field?id=${mainBookingId}`);
      const data = Array.isArray(res.data)
        ? (res.data.find(d => String(d.booking_id) === String(mainBookingId)) || res.data[0])
        : res.data;

      if (!data) {
        Swal.fire('ไม่พบข้อมูล', 'ไม่พบข้อมูลการจอง', 'warning');
        return;
      }

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFont('Sarabun');

      // ---------------- ฟอร์ม "field" -------------------
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(17);
      doc.text('แบบฟอร์มขออนุมัติใช้สถานที่ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง', 80, 48);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11);
      doc.text('โทร 053-917820-1 | E-mail: sport-complex@mfu.ac.th', 180, 68);

      doc.setFontSize(12);
      doc.text(`ที่ อว. ${data.aw || '-'}`, 55, 96);
      doc.text(`วันที่ ${formatDate(data.since) || '-'}`, 240, 96);
      doc.text(`โทร ${data.tel || '-'}`, 425, 96);

      doc.setFontSize(12);
      doc.text('เรื่อง  ขออนุมัติใช้สถานที่', 25, 121);
      doc.text('เรียน  ผู้อำนวยการศูนย์กีฬา', 25, 146);

      doc.setFontSize(12);
      doc.text(`ด้วย ${data.agency || '-'}`, 55, 171);
      doc.text(`จะดำเนินกิจกรรม / โครงการ ${data.name_activity || '-'}`, 25, 196);
      doc.text(`เหตุผลในการขอใช้คือ ${data.reasons || '-'}`, 25, 221);

      doc.text(`ในวันที่ ${formatDate(data.since) || '-'}`, 25, 246);
      doc.text(`ถึงวันที่ ${formatDate(data.uptodate) || '-'}`, 175, 246);
      doc.text(`ตั้งแต่เวลา ${formatTime(data.since_time) || '-'} น.`, 325, 246);
      doc.text(`ถึงเวลา ${formatTime(data.until_thetime) || '-'} น.`, 475, 246);

      doc.text(`จำนวนผู้เข้าร่วม ${data.participants || '-'}`, 25, 271);

      doc.setFontSize(12);
      doc.text('และมีความประสงค์ขออนุญาตใช้ห้อง/สนาม ดังรายละเอียดต่อไปนี้', 25, 296);

      doc.setFontSize(12);
      doc.setFont('Sarabun', 'bold');
      doc.text('1. ข้อมูลผู้ใช้สถานที่', 25, 321);
      doc.setFont('Sarabun', 'normal');
      doc.text(`อาคาร ${data.building || '-'}`, 55, 346);
      doc.text(`ระบุหมายเลขพื้นที่/ห้องที่ต้องการใช้ ${data.zone || '-'}`, 280, 346);
      doc.setFont('Sarabun', 'bold');
      doc.text('2. ขออนุญาตใช้ระบบสาธารณูปโภค', 25, 371);
      doc.setFont('Sarabun', 'normal');
      doc.text(`เปิดเครื่องปรับอากาศตั้งแต่ ${data.turnon_air || '_'} น. ถึง ${data.turnoff_air || '_'} น. ( เฉพาะอาคารเฉลิมพระเกียรติฯ)`, 55, 396);
      doc.text(`ไฟฟ้าส่องสว่างตั้งแต่ ${data.turnon_lights || '_'} น. ถึง ${data.turnoff_lights || '_'} น. ( เฉพาะอาคารเฉลิมพระเกียรติฯ)`, 55, 421);
      doc.text(`อื่นๆ ${data.other || '_'}`, 55, 446);
      doc.setFont('Sarabun', 'bold');
      doc.text('3.ขออนุมัติรายการประกอบอาคาร', 25, 471);
      doc.setFont('Sarabun', 'normal');
      doc.text(`ดึงอัฒจันทร์ภายในอาคารเฉลิมพระเกียรติฯ ${data.amphitheater || '_'}`, 55, 496);
      doc.text(`อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน) ${data.need_equipment || '_'}`, 55, 521);

      let signY = 565;
      doc.setFontSize(12);
      doc.text('ลงชื่อ................................................', 25, signY);
      doc.text('ลงชื่อ................................................', 210, signY);
      doc.text('ลงชื่อ................................................', 395, signY);

      doc.text(`(  ${data.requester}  )`, 35, signY + 25);
      doc.text('(..................................................)', 220, signY + 25);
      doc.text('(..................................................)', 405, signY + 25);

      doc.text('นักศึกษา/ผู้รับผิดชอบ', 65, signY + 45);
      doc.text('อาจารย์/ที่ปรึกษาโครงการ', 235, signY + 45);
      doc.text('คณะ/หัวหน้าหน่วยงาน', 434, signY + 45);

      let boxY = signY + 65;
      const pageWidth2 = doc.internal.pageSize.getWidth();
      const boxWidth = (pageWidth2 - 40) / 3;
      const boxHeight = 190;
      const marginLeft = 20;

      for (let i = 0; i < 3; i++) {
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(1);
        doc.rect(marginLeft + i * boxWidth, boxY, boxWidth, boxHeight);
      }

      let x1 = marginLeft;
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('1. เลขานุการศูนย์กีฬา', x1 + 28, boxY + 22);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11.5);
      doc.rect(x1 + 16, boxY + 40, 10, 10);
      doc.text('เรียน หัวหน้าศูนย์กีฬา', x1 + 16 + 14, boxY + 50);
      doc.rect(x1 + 16, boxY + 65, 10, 10);
      doc.text('เพื่อโปรดพิจารณา', x1 + 16 + 14, boxY + 75);
      doc.rect(x1 + 16, boxY + 90, 10, 10);
      doc.text('อื่นๆ ___________________________', x1 + 16 + 14, boxY + 100);
      doc.text('.......................................................', x1 + 12, boxY + 125);
      doc.text('(....................................................)', x1 + 12, boxY + 150);
      doc.text('วันที่ ..........................................', x1 + 16, boxY + 175);

      let x2 = marginLeft + boxWidth;
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('2. หัวหน้าศูนย์กีฬา', x2 + 40, boxY + 22);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11.5);
      doc.rect(x2 + 16, boxY + 40, 10, 10);
      doc.text('เรียนท่านรองอธิการบดี', x2 + 16 + 14, boxY + 50);
      doc.rect(x2 + 16, boxY + 65, 10, 10);
      doc.text('เพื่อโปรดพิจารณา', x2 + 16 + 14, boxY + 75);
      doc.rect(x2 + 16, boxY + 90, 10, 10);
      doc.text('อื่นๆ ___________________________', x2 + 16 + 14, boxY + 100);
      doc.text('.......................................................', x2 + 12, boxY + 125);
      doc.text('(....................................................)', x2 + 12, boxY + 150);
      doc.text('วันที่ ..........................................', x2 + 16, boxY + 175);

      let x3 = marginLeft + boxWidth * 2;
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('3. อธิการบดี', x3 + 60, boxY + 22);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11.5);
      doc.rect(x3 + 16, boxY + 40, 10, 10);
      doc.text('อนุมัติข้อ', x3 + 16 + 14, boxY + 50);
      doc.rect(x3 + 16, boxY + 65, 10, 10);
      doc.text('อื่นๆ ___________________________', x3 + 16 + 14, boxY + 75);
      doc.text('.......................................................', x3 + 12, boxY + 100);
      doc.text('.......................................................', x3 + 12, boxY + 125);
      doc.text('(....................................................)', x3 + 12, boxY + 150);
      doc.text('วันที่ ..........................................', x3 + 16, boxY + 175);

      for (let i = 0; i < 3; i++) {
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(1);
        doc.line(marginLeft + i * boxWidth, boxY + 32, marginLeft + (i + 1) * boxWidth, boxY + 32);
      }

      doc.save('user_form.pdf');
    }

     // ------- EQUIPMENT -------
     else if (item.type === 'equipment') {
      // 1. ดึง booking_equipment (เพื่อ remark)
      const resBooking = await axios.get(`${API_BASE}/api/booking_equipment?id=${mainBookingId}`);
      const bookingData = Array.isArray(resBooking.data) ? resBooking.data[0] : resBooking.data;
      const itemRemarks = Array.isArray(bookingData.items)
        ? bookingData.items.map(i => ({
            name: i.item_name,
            remark: i.remark || ''
          }))
        : [];
      // 2. ดึงรายการ history ของ booking นี้ (ที่ไม่ใช่ returned)
      const historyRes = await axios.get(`${API_BASE}/api/history`);
      const allItems = historyRes.data
        .filter(d => String(d.booking_id) === String(mainBookingId))
        .filter(d => !d.status || d.status.toLowerCase() !== 'returned');
      // 3. Join remark เข้ากับรายการ
      const mergedItems = allItems.map((row, idx) => {
        const matched = itemRemarks.find(it => it.name === row.name);
        return {
          ...row,
          remark: matched ? matched.remark : '-'
        };
      });
      // 4. สร้าง PDF
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFont('Sarabun', 'normal');
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      const title = 'แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง';
      const subTitle = 'โทร 053-917820-1 E-mail sport-complex@mfu.ac.th';
      doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, 45);
      doc.setFontSize(11);
      doc.text(subTitle, (pageWidth - doc.getTextWidth(subTitle)) / 2, 69);

      doc.setFontSize(11);
      doc.text(`ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง`, 380, 100);
      doc.text(`วันที่ ${formatDate(bookingData.start_date || bookingData.since || bookingData.date) || '-'}`, 400, 125);
      doc.text(`วันที่มารับของ ${formatDate(bookingData.receive_date) || '-'}`, 400, 145);
      doc.text(`เวลาที่มารับของ ${formatTime(bookingData.receive_time) || '-'} น.`, 400, 165);
      doc.text(`หน่วยงาน ${bookingData.agency || '-'}`, 380, 185);

      doc.text(`ข้าพเจ้า ${bookingData.name || '-'}`, 50, 250);
      doc.text(`รหัสนักศึกษา/พนักงาน ${bookingData.user_id || '-'}`, 260, 250);

      const reasonText = `เหตุผลในการขอใช้เพื่อ: ${bookingData.reason || '-'}`;
      const reasonLines = doc.splitTextToSize(reasonText, pageWidth - 100);
      let yReason = 275;
      const lineSpacing = 30;
      for (let i = 0; i < reasonLines.length; i++) {
        doc.text(reasonLines[i], 30, yReason + (i * lineSpacing));
      }

      doc.text(`สถานที่ใช้งาน: ${bookingData.location || '-'}`, 30, 300);
      doc.text(
        `ในวันที่         ${formatDate(bookingData.start_date || bookingData.since || bookingData.date) || '-'}         ถึงวันที่         ${formatDate(bookingData.end_date || bookingData.uptodate) || '-'}`,
        30, 330
      );
      doc.text(`โดยมีรายการดังต่อไปนี้ `,30, 360);

      // ตารางรายการ
      autoTable(doc, {
        startY: 390,
        head: [['ลำดับ', 'รายการ', 'จำนวน', 'หมายเหตุ']],
        body: mergedItems.map((row, idx) => [
          idx + 1,
          row.name || '-',
          row.quantity || '-',
          row.remark || '-'
        ]),
        headStyles: { fillColor: [40, 63, 125], textColor: 255, font: 'Sarabun', halign: 'center', fontSize: 11 },
        styles: { font: 'Sarabun', fontSize: 11, halign: 'center', cellPadding: 4 }
      });

    // ช่องเซ็นชื่อ
    const marginRight = 60;
    const signText = 'ลงชื่อ  (...........................................................)';
    const nameText = bookingData.name || '-';
    const signTextWidth = doc.getTextWidth(signText);
    const nameTextWidth = doc.getTextWidth(nameText);
    doc.text(signText, pageWidth - signTextWidth - marginRight, 800);
    doc.text(nameText, pageWidth - nameTextWidth - marginRight - 25, 820);

    let signY = doc.lastAutoTable.finalY + 100;
    const boxWidth = (pageWidth - 40) / 2;
    const boxHeight = 140;
    const marginLeft = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (signY + boxHeight > pageHeight - 30) {
      signY = pageHeight - boxHeight - 40;
    }

    for (let i = 0; i < 2; i++) {
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(1);
      doc.rect(marginLeft + i * boxWidth, signY, boxWidth, boxHeight);
    }

    // หัวข้อในช่องเซ็น
    const headerY = signY + 28;
    const lineY = headerY + 10;
    const boxHeaderPad = 0;
    doc.setFont('Sarabun', 'bold');
    doc.text('ความคิดเห็น/คำสั่ง/ผลการพิจารณา', marginLeft + 50, headerY);
    doc.setDrawColor(0,0,0);
    doc.setLineWidth(1);
    doc.line(marginLeft + boxHeaderPad, lineY, marginLeft + boxWidth - boxHeaderPad, lineY);

    doc.text('ผลการดำเนินการ/ผลการปฏิบัติงาน', marginLeft + boxWidth + 50, headerY);
    doc.line(marginLeft + boxWidth + boxHeaderPad, lineY, marginLeft + 2*boxWidth - boxHeaderPad, lineY);

    doc.setFont('Sarabun', 'normal');
    doc.text('...........................................................................................', marginLeft + 12, signY + 65);
    doc.text('...........................................................................................', marginLeft + 12, signY + 90);
    doc.text('ลงชื่อ.....................................................................หัวหน้าส่วน', marginLeft + 6, signY + 110);
    doc.text('วันที่....................../....................../....................', marginLeft + 16, signY + 130);

    doc.text('...........................................................................................', marginLeft + boxWidth + 12, signY + 65);
    doc.text('...........................................................................................', marginLeft + boxWidth + 12, signY + 90);
    doc.text('ลงชื่อ................................................ผู้ปฏิบัติงาน/ผู้รับผิดชอบ', marginLeft + boxWidth + 7, signY + 110);
    doc.text('วันที่....................../....................../....................', marginLeft + boxWidth + 16, signY + 130);

    doc.save('user_form.pdf');
    }
    // ------ อื่นๆ ------
    else {
      Swal.fire('ผิดพลาด', 'ประเภทข้อมูลไม่รองรับ', 'error');
      return;
    }
  } catch (err) {
    Swal.fire('ขออภัย', 'ไม่มีแบบฟอร์มสำหรับการยืมอุปกรณ์วันเดียว', 'warning');
    console.error(err);
  }
},












    // ==== Notification functions ====
    toggleNotifications() {
      this.showNotifications = !this.showNotifications
      if (this.showNotifications) this.unreadCount = 0
    },
    closeNotifications() {
      this.showNotifications = false
    },
    handleClickOutside(event) {
      const notifDropdown = document.querySelector('.notification-dropdown')
      const notifBtn = document.querySelector('.notification-btn')
      if (
        notifDropdown &&
        !notifDropdown.contains(event.target) &&
        notifBtn &&
        !notifBtn.contains(event.target)
      ) {
        this.closeNotifications()
      }
    },
    async fetchNotifications() {
      try {
        const res = await axios.get(`${API_BASE}/api/history/approve_field`)
        const data = Array.isArray(res.data) ? res.data : []
        const pendings = data.filter(item =>
          item.status === 'pending' &&
          (item.type === 'field' || item.type === 'equipment') &&
          !this.lastCheckedIds.has(item._id?.$oid || item._id)
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
          this.notifications = [...this.notifications, ...newMessages]
          pendings.forEach(item => this.lastCheckedIds.add(item._id?.$oid || item._id))
          this.unreadCount = this.notifications.length
        }
      } catch (err) { }
    },
    async cancelFieldBooking(item) {
      const result = await Swal.fire({
        title: "ยืนยันยกเลิกการจองสนาม?",
        text: "ต้องการยกเลิกการจองสนามนี้ใช่หรือไม่? (จะไม่สามารถย้อนกลับได้)",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก"
      });
      if (!result.isConfirmed) return;
      try {
        const res = await axios.patch(`${API_BASE}/api/history/${item.id}/cancel_field`, {
          admin_id: JSON.parse(localStorage.getItem("user"))?.user_id || ""
        })
        if (res.data && res.data.status === "cancel") {
          Swal.fire("สำเร็จ", "ยกเลิกการจองสนามแล้ว", "success")
          window.location.reload()
        } else {
          throw new Error("เกิดข้อผิดพลาด")
        }
      } catch (err) {
        Swal.fire("ผิดพลาด", err.message || "ไม่สามารถยกเลิกได้", "error")
      }
    },
    async reloadHistory() {
      try {
        const userId = localStorage.getItem('user_id') || ''
        if (!userId) throw new Error('User not logged in')
        const resHistory = await axios.get(`${API_BASE}/api/history`)
        let histories = resHistory.data
          .filter(h =>
            h.approvedById === userId ||
            h.disapprovedById === userId ||
            h.canceledById === userId
          )
          .map((h, idx) => ({
            id: h._id?.$oid || h._id || idx + 1,
            type: h.type,
            name: h.name,
            time: h.type === "field" ? `${h.startTime} - ${h.endTime}` : "",
            quantity: h.type === "equipment" ? h.quantity : "",
            status: statusLabel(h.status),
            approvedBy: h.approvedBy,
            approvedById: h.approvedById,
            disapprovedBy: h.disapprovedBy,
            disapprovedById: h.disapprovedById,
            canceledBy: h.canceledBy,
            canceledById: h.canceledById,
            approvedAt: h.approvedAt,
            disapprovedAt: h.disapprovedAt,
            canceledAt: h.canceledAt,
            date: h.date,
            canceledBy: h.canceledBy,
            canceledById: h.canceledById,
          }))
        const getSortDate = (item) => (
          item.canceledAt ||
          item.disapprovedAt ||
          item.approvedAt ||
          item.date || 0
        )
        histories = histories.sort((a, b) => new Date(getSortDate(b)) - new Date(getSortDate(a)))
        this.historys = histories
      } catch (err) {
        this.historys = []
        console.error('โหลดข้อมูลประวัติไม่สำเร็จ:', err)
      }
    },
  },
  async mounted() {
    document.addEventListener('mousedown', this.handleClickOutside)
    try {
      const usersRes = await axios.get(`${API_BASE}/api/users`)
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : []
      const userIdToName = Object.fromEntries(allUsers.map(u => [u.user_id, u.name]))
      const historyRes = await axios.get(`${API_BASE}/api/history`)
      let historyArr = historyRes.data
      // filter out pending
      historyArr = historyArr.filter(
        h => String(h.status).toLowerCase() !== 'pending'
      )
      this.historys = historyArr
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((h, idx) => ({
          id: h._id?.$oid || h._id || idx + 1,
          user_id: h.user_id,
          userName: userIdToName[h.user_id] || h.user_id,
          type: h.type,
          name: h.name,
          date: h.date,
          time: h.type === 'field' ? `${h.startTime} - ${h.endTime}` : '',
          quantity: h.type === 'equipment' ? h.quantity : '',
          booking_field_id: h.booking_field_id,
          booking_equipment_id: h.booking_equipment_id,
          fileUrl: h.fileUrl,
          status: (h.status || '').charAt(0).toUpperCase() + (h.status || '').slice(1).toLowerCase(),
          requester: h.requester || userIdToName[h.user_id] || '-',
          approvedBy: userIdToName[h.approvedById] || h.approvedBy || h.approvedById || '',
          disapprovedBy: userIdToName[h.disapprovedById] || h.disapprovedBy || h.disapprovedById || '',
          returnedBy: userIdToName[h.returnedById] || h.returnedBy || h.returnedById || '',
          returnedAt: h.returnedAt,
          remark: h.remark,
          approvedAt: h.approvedAt,
          disapprovedAt: h.disapprovedAt || null,
          booking_id: h.booking_id,
          fileName: Array.isArray(h.fileName) ? h.fileName : (h.fileName ? [h.fileName] : []),
          attachment: Array.isArray(h.attachment) ? h.attachment : (h.attachment ? [h.attachment] : []),
          fileType: Array.isArray(h.fileType) ? h.fileType : (h.fileType ? [h.fileType] : []),
          since: h.since,
          uptodate: h.uptodate,
          canceledBy: h.canceledBy || userIdToName[h.canceledById] || h.canceledById || '-',
          canceledById: h.canceledById,
          canceledAt: h.canceledAt,
        }))
    } catch (err) {
      console.error('โหลดข้อมูลไม่สำเร็จ:', err)
    }
    await this.fetchNotifications()
    this.polling = setInterval(this.fetchNotifications, 30000)
  },
  beforeDestroy() {
    clearInterval(this.polling)
    document.removeEventListener('mousedown', this.handleClickOutside)
  }
}
</script>






<style scoped>
.histbody {
  width: 100%;
  min-height: 100vh;
  padding: 20px 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

.history-filter {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-bottom: 18px;
  margin-top: 12px;
}

.history-filter button {
  background: #f3f4f6;
  border: 1.5px solid #a5b4fc;
  color: #213555;
  font-weight: 600;
  padding: 7px 22px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.16s;
}

.history-filter button.active,
.history-filter button:hover {
  background: #1d4ed8;
  color: #fff;
  border-color: #1d4ed8;
}

.hist-grid {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 1rem 60px 2.5rem 60px;
  justify-content: space-between;
}
.hist-date {
  font-size: 0.9em;
  color: #777;
  margin-right: 7px;
  min-width: 56px;
  display: inline-block;
}

/* วันที่อยู่นอกกรอบ card */
.hist-date-outside {
  font-size: 1em;
  color: #526683;
  margin-bottom: -8px;
  margin-left: 10px;
  margin-top: 6px;
  font-weight: 500;
}

.hist-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 2px;
  padding: 0;
  width: 100%;
  transition: box-shadow 0.2s;
}

.hist-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.hist-card:nth-child(even) {
  background-color: #f3f6fa;
}

.hist-header {
  background: #a1bdff;
  font-weight: bold;
  border-radius: 12px 12px 0 0;
  color: #1d3557;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07);
  margin-bottom: 1.5px;
  font-size: 1.08rem;
  min-height: 44px;
  align-items: center;
  display: flex;
}

.hist-row {
  display: flex;
  align-items: center;
  font-size: 1rem;
  color: #333;
  min-height: 48px;
  padding: 12px 4px;
  justify-content: space-between;
}

.hist-user {
  flex: 1.5;
  min-width: 120px;
  max-width: 220px;
}

.hist-name {
  flex: 2.2;
  min-width: 160px;
  max-width: 270px;
}

.hist-detail {
  flex: 1.7;
  min-width: 140px;
  max-width: 200px;
}

.hist-status {
  flex: 1.1;
  min-width: 90px;
  max-width: 110px;
}

.hist-file,
.hist-pdf {
  flex: 1.5;
  min-width: 120px;
  max-width: 180px;
}

.hist-action {
  display: flex;
  justify-content: center;   /* ให้ปุ่มอยู่ตรงกลาง column */
  align-items: center;
  gap: 12px;                 /* ระยะห่างระหว่างปุ่ม */
  min-width: 140px;          /* ปรับกว้างขึ้นนิด */
  max-width: 180px;          /* ป้องกันบีบ */
  flex: unset;               /* ยกเลิก flex: 1; เพื่อไม่ดันขยาย */
}
.hist-file a,
.file-btn {
  background-color: #ff0000;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
  text-decoration: none;
  font-weight: 500;
}

/* ปุ่ม PDF */
.pdfmake-btn {
  background-color: #11ff00;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: 500;
}
.pdfmake-btn:hover {
  background-color: #099710df;
}

.pagination-control {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px 0 8px 0;
  gap: 8px;
}
.pagination-control button {
  background: #1d4ed8;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.pagination-control button:disabled {
  background: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
}

/* ปุ่มดูรายละเอียด */
.remark-btn {
  background-color: #213555;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 14px;
  cursor: pointer;
  margin-left: 4px;
  font-size: 0.95rem;
  transition: background 0.2s;
}
.remark-btn:hover {
  background-color: #4268a3;
}

/* --- แก้ตรงนี้: กล่องรายละเอียดไฟล์แนบ --- */
.hist-file-detail-box {
  width: 100%;
  background: #f7fafc;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(54, 88, 167, 0.12);
  padding: 18px 22px 16px 22px;
  margin: 0 0 6px 0;
  display: flex;
  flex-direction: column;
  gap: 0.7em;
  border: 1px solid #dde7fb;
}

.hist-file-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 1.1em;
  color: #25396f;
  font-weight: 600;
}

.no-attachment {
  color: #afafaf;
  font-style: italic;
  padding: 12px 0 3px 4px;
  text-align: left;
  font-size: 1em;
}

.attached-files-table {
  width: 100%;
  border-collapse: collapse;
  background: #fafdff;
  font-size: 0.99rem;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 4px;
  box-shadow: 0 1px 4px 0 rgba(54, 88, 167, 0.06);
}
.attached-files-table th,
.attached-files-table td {
  border: 1px solid #e5eaff;
  padding: 9px 15px;
  text-align: left;
  font-size: 1em;
}
.attached-files-table th {
  background: #e8f0ff;
  color: #25396f;
}

/* ปุ่มดาวน์โหลดใหม่ (ดูไฟล์/ดาวน์โหลด) */
.download-link {
  background: #eb2525;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 7px 19px;
  font-size: 0.97rem;
  font-weight: 500;
  transition: background 0.14s;
  text-decoration: none;
  display: inline-block;
}
.download-link:hover {
  background: #c9141475;
  color: #fff;
}

/* --- END กล่องรายละเอียดไฟล์แนบ --- */

.hist-collapse {
  display: flex;
  gap: 1rem;
  padding: 8px 4px;
  background: #f9fafb;
}

.toggle-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  cursor: pointer;
  font-weight: 500;
}
.toggle-btn:hover {
  background: #1e40af;
}
.cancel-btn {
  background-color: #f59e42;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 14px;
  cursor: pointer;

  font-size: 0.95rem;
  transition: background 0.2s;
}
.cancel-btn:hover {
  background-color: #c2410c;
}
.hist-status .cancel-status {
  color: #f43f5e;
  font-weight: bold;
}




</style>