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
        <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> Return</router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> Member</router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> History System</router-link>
      </nav>
    </aside>
<div
  v-if="isMobile && !isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
></div>
    <div class="main" :class="{ 'sidebar-closed': isSidebarClosed }">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <div style="position: relative; display: inline-block;">
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

          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <div style="background-color: #dbe9f4;">
        <div class="histbody">
<!-- ตรง h1 -->
<h1 style="display: flex; justify-content: center;">System history</h1>

          <div class="history-filter">
            <button :class="{ active: historyFilter === 'all' }" @click="setHistoryFilter('all')">ทั้งหมด</button>
            <button :class="{ active: historyFilter === 'field' }" @click="setHistoryFilter('field')">สถานที่</button>
            <button :class="{ active: historyFilter === 'equipment' }" @click="setHistoryFilter('equipment')">อุปกรณ์กีฬา</button>
          </div>
<div class="date-filter-row">
  <label>ตั้งแต่</label>
  <input
    type="date"
    v-model="dateFilterStart"
    @change="onDateFilterChange"
    :max="dateFilterEnd"
  >
  <label>ถึง</label>
  <input
    type="date"
    v-model="dateFilterEnd"
    @change="onDateFilterChange"
    :min="dateFilterStart"
  >
</div>


          <div class="hist-grid" :class="{ 'sidebar-closed': isSidebarClosed }">
            <template v-for="group in paginatedGroups" :key="group.type + '_' + (group.items[0].booking_id || group.items[0].id)">
              
              <!-- Field card -->
              <div v-if="group.type === 'field'">
                <div class="hist-date-outside">
                  {{ formatDate(group.items[0].approvedAt || group.items[0].date) }}
                </div>
                <div class="hist-card">
                  <div class="hist-row table-row-align" style="font-weight:600; border-bottom:1px solid #eee; background-color: #a1bdff">
                    <span class="hist-user">ผู้ใช้</span>
                    <span class="hist-name">ชื่อสนาม</span>
                    <span class="hist-detail">เวลา</span>
                    <span class="hist-status">สถานะ</span>
                    <span class="hist-file">ดูไฟล์แนบ</span>
                    <span class="hist-action">รายละเอียด</span>
                  </div>
                  <div class="hist-row table-row-align">
                    <span class="hist-user">{{ group.items[0].userName }}</span>
                    <span class="hist-name">{{ group.items[0].name }}</span>
                    <span class="hist-detail">{{ group.items[0].time }}</span>
                    <span class="hist-status">
                      <span v-if="group.items[0].status && group.items[0].status.toLowerCase() === 'returned'">👍 Returned</span>
                      <span v-else-if="group.items[0].status && group.items[0].status.toLowerCase() === 'approved'">✅ Approved</span>
                      <span v-else-if="group.items[0].status && group.items[0].status.toLowerCase() === 'disapproved'">❌ Disapproved</span>
                      <span v-else-if="group.items[0].status && group.items[0].status.toLowerCase() === 'cancel'" class="cancel-status">🚫 Cancel</span>
                      <span v-else>-</span>
                    </span>
                    <span class="hist-file">
  <button class="toggle-btn" @click="toggleExpand(group.items[0].id)">
    <i class="pi pi-paperclip"></i>
  </button>
  <button class="pdfmake-btn small-btn" @click="downloadBookingPdf(group.items[0])" style="margin-left:8px;" title="ดาวน์โหลด PDF">
  <i class="pi pi-file-pdf"></i>
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
                      </div>
                      <div v-if="Array.isArray(group.items[0].fileName) && group.items[0].fileName.length">
                        <table class="attached-files-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>ชื่อไฟล์</th>
                              <th>ดาวน์โหลด</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(fname, idx) in group.items[0].fileName" :key="idx">
                              <td>{{ idx + 1 }}</td>
                              <td>{{ fname }}</td>
                              <td>
                                <a
  :href="`${API_BASE}/api/history/file/${group.items[0].id}?fileIdx=${idx}`"
  target="_blank"
  class="download-link"
  download
>
  ดาวน์โหลด
</a>
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
                  <div class="hist-row table-row-align" style="font-weight:600; border-bottom:1px solid #eee; background-color: #a1bdff">
                    <span class="hist-user">รายการอุปกรณ์</span>
                    <span class="hist-name">วันที่ทำรายการ</span>
                    <span class="hist-detail hist-qty">จำนวน</span>
                    <span class="hist-status hist-equip-status">สถานะ</span>
                    <span class="hist-file">ดูไฟล์แนบ</span>
                    <span class="hist-action">
                      <button class="remark-btn" @click="showDetailGroup(group)">Detail</button>
                    </span>
                  </div>
                  <div
                    class="hist-row table-row-align"
                    v-for="item in group.items"
                    :key="item.id"
                    style="border-bottom:1px dashed #ccc;"
                  >
                    <span class="hist-user">{{ item.name }}</span>
                    <span class="hist-name">
                      <template v-if="item.since && item.uptodate">
                        {{ formatDate(item.since) }} - {{ formatDate(item.uptodate) }}
                      </template>
                      <template v-else>
                        {{ formatDate(item.date) }}
                      </template>
                    </span>
                    <span class="hist-detail hist-qty">{{ item.quantity }}</span>
                    <span class="hist-status hist-equip-status">
                      <span v-if="item.status && item.status.toLowerCase() === 'returned'">👍 Returned</span>
                      <span v-else-if="item.status && item.status.toLowerCase() === 'approved'">✅ Approved</span>
                      <span v-else-if="item.status && item.status.toLowerCase() === 'disapproved'">❌ Disapproved</span>
                      <span v-else-if="item.status && item.status.toLowerCase() === 'pending'">⌛ Pending</span>
                      <span v-else-if="item.status && item.status.toLowerCase() === 'return-pending'">⏪ Return-pending</span>
                      <span v-else-if="item.status">- {{ item.status }}</span>
                      <span v-else>-</span>
                    </span>
                     <span class="hist-file">
  <button class="toggle-btn" @click="toggleExpand(group.items[0].id)">
    <i class="pi pi-paperclip"></i>
  </button>
  <button class="pdfmake-btn small-btn" @click="downloadBookingPdf(item)" style="margin-left:8px;" title="ดาวน์โหลด PDF">
  <i class="pi pi-file-pdf"></i>
</button>


</span>
                    <span class="hist-action"></span>
                  </div>
                  <div v-for="item in group.items" :key="item.id + '-file-detail'">
                    <transition name="slide">
                      <div class="hist-file-detail-box" v-show="expandedRows.includes(item.id)">
                        <div class="hist-file-header">
                          <b>ไฟล์แนบ</b>
                          
                        </div>
                        <div v-if="Array.isArray(item.attachment) && item.attachment.length">
                          <table class="attached-files-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>ชื่อไฟล์</th>
                                <th>ดาวน์โหลด</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(attachId, idx) in item.attachment" :key="attachId">
                                <td>{{ idx + 1 }}</td>
                                <td>{{ item.fileName[idx] || '-' }}</td>
                                <td>
                                  <a
                                    :href="`${API_BASE}/api/history/file/${item.id}?fileIdx=${idx}`"
                                    target="_blank"
                                    class="download-link"
                                    download
                                  >ดาวน์โหลด</a>
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
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp';



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
      isMobile: window.innerWidth <= 600,
      API_BASE: API_BASE,
      dateFilterStart: '',
      dateFilterEnd: '',
      dateFilterApplied: false,
      dateFilterStart: '',
      dateFilterEnd: '',
      lastSeenTimestamp: 0,

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
  totalPages() {
    return Math.ceil(this.allGroupsSorted.length / this.itemsPerPage) || 1
  },
    filteredHistory() {
    let arr = this.historyFilter === 'all'
      ? this.historys
      : this.historys.filter(h => h.type === this.historyFilter);

    if (this.dateFilterStart) {
      const start = new Date(this.dateFilterStart + 'T00:00:00');
      arr = arr.filter(h => {
        const d = h.approvedAt || h.returnedAt || h.date;
        if (!d) return false;
        return new Date(d) >= start;
      });
    }
    if (this.dateFilterEnd) {
      const end = new Date(this.dateFilterEnd + 'T23:59:59');
      arr = arr.filter(h => {
        const d = h.approvedAt || h.returnedAt || h.date;
        if (!d) return false;
        return new Date(d) <= end;
      });
    }
    return arr;
  },

    paginatedGroups() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      return this.allGroupsSorted.slice(start, start + this.itemsPerPage)
    },
    totalPages() {
      return Math.ceil(this.allGroupsSorted.length / this.itemsPerPage) || 1
    },
  },
  methods: {
    onDateFilterChange() {
    this.currentPage = 1 // ถ้าใช้ pagination
    // filter จะถูกทำงานอัตโนมัติผ่าน computed
  },
  
  async downloadBookingPdf(item) {
    try {
      const bookingId = item.booking_id || item.booking_field_id || item.booking_equipment_id;
      if (!bookingId) {
        Swal.fire('ผิดพลาด', 'ไม่พบ booking_id สำหรับรายการนี้', 'error');
        return;
      }

      // ขอไฟล์ PDF จาก backend เป็น blob
      const response = await axios.get(`${API_BASE}/api/history/pdf/${bookingId}`, {
        responseType: 'blob'
      });

      // สร้าง URL สำหรับดาวน์โหลดไฟล์
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // สร้างลิงก์ดาวน์โหลดชั่วคราวและคลิก
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      Swal.fire('ผิดพลาด', 'ไม่สามารถดาวน์โหลดไฟล์ PDF ได้', 'error');
    }
  },
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed
    },
    setHistoryFilter(type) {
      this.historyFilter = type
      this.currentPage = 1
    },
    applyDateFilter() {
  this.currentPage = 1;
  this.dateFilterApplied = true;
},
clearDateFilter() {
  this.dateFilterStart = '';
  this.dateFilterEnd = '';
  this.dateFilterApplied = false;
  this.currentPage = 1;
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
  }/${d.getFullYear()}`
},
    showDetailGroup(group) {
      let html = ''
      if (group.type === 'field') {
        const item = group.items[0]
        html = `
          <div style="text-align:left;">
            <b>ชื่อสนาม:</b> ${item.name || '-'}<br>
            <b>ชื่อผู้ขอใช้:</b> ${item.requester || item.userName || '-'}<br>
            <b>จองให้ผู้ใช้:</b> ${item.proxyStudentName || '-'}<br>
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
  async  exportPdf(item) {
  // --------- ฟังก์ชันย่อยสำหรับ field ---------
  function formatDate(date) {
    if (!date) return '-';
    if (typeof date === 'string' && date.includes('T')) {
      const d = new Date(date);
      if (!isNaN(d)) {
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      }
      return date.split('T')[0].split('-').reverse().join('/');
    }
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = date.split('-');
      return `${d}/${m}/${y}`;
    }
    return date;
  }
  function formatTime(time) {
    if (!time) return '-';
    if (typeof time === 'string' && time.match(/^\d{2}:\d{2}/)) return time;
    const t = new Date(`2000-01-01T${time}`);
    if (!isNaN(t.getTime())) return t.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return time;
  }
  function checkY(doc, y, minY = 50, maxY = 780) {
    if (y > maxY) {
      doc.addPage();
      return minY;
    }
    return y;
  }
  function drawLines(doc, lines, x, y, lineHeight = 15, minY = 50, maxY = 780) {
    for (const line of lines) {
      y = checkY(doc, y, minY, maxY);
      doc.text(line, x, y);
      y += lineHeight;
    }
    return y;
  }

  const mainBookingId = item.booking_field_id || item.booking_equipment_id || item.booking_id;
  const mainId = item.id || item._id;
  if (!mainBookingId) {
    Swal.fire('ผิดพลาด', 'ไม่พบ booking_id สำหรับรายการนี้', 'error');
    return;
  }

  try {
    if (item.type === 'field') {
      // ------------------ FIELD (แบบใหม่) --------------------
      const res = await axios.get(`${API_BASE}/api/booking_field?id=${mainBookingId}`);
      let data;
      if (Array.isArray(res.data)) {
        data = res.data.find(d => String(d.booking_id) === String(mainBookingId));
        if (!data && mainId) {
          data = res.data.find(d => String(d._id) === String(mainId));
        }
        if (!data && res.data.length === 1) data = res.data[0];
      } else {
        data = res.data;
      }

      if (!data) {
        Swal.fire('ไม่พบข้อมูล', 'ไม่พบข้อมูลการจอง', 'warning');
        return;
      }

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFont('Sarabun');

      // ------- ใช้รูปแบบ field จาก form_field4 ---------
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(17);
      doc.text('แบบฟอร์มขออนุมัติใช้สถานที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง', 80, 48);

      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11);
      doc.text('โทร 053-917820-1 | E-mail: sport-complex@mfu.ac.th', 180, 68);

      doc.setFontSize(11);

doc.setFont('Sarabun', 'bold');
doc.setFontSize(12);

doc.setFont('Sarabun', 'normal');
doc.setFontSize(11);
doc.text(`ที่ อว. ${data.aw || '-'}`, 30, 100);     // ← จาก 45 → 30
doc.text(`วันที่ ${formatDate(data.date) || '-'}`, 230, 100);
doc.text(`โทร ${data.tel || '-'}`, 430, 100);


      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(12);
      doc.text('เรื่อง  ขออนุมัติใช้สถานที่', 25, 121);
      doc.text('เรียน  ผู้อำนวยการศูนย์กีฬา', 25, 146);

      doc.setFontSize(12);

      let y = 171;
      y = checkY(doc, y);
      const activityLines = doc.splitTextToSize('ด้วย ' + (data.agency || '-'), 500);
      y = drawLines(doc, activityLines, 55, y);

      const projectLines = doc.splitTextToSize('จะดำเนินกิจกรรม / โครงการ ' + (data.name_activity || '-'), 500);
      y = drawLines(doc, projectLines, 25, y);

      const reasonLabel = 'เหตุผลในการขอใช้คือ';
      const reasonValue = data.reasons || '-';
      y = checkY(doc, y);
      doc.text(reasonLabel, 25, y);
      y += 20;
      const reasonsLines = doc.splitTextToSize(reasonValue, 480);
      y = drawLines(doc, reasonsLines, 40, y);

      y = checkY(doc, y);
      doc.text(`ในวันที่ ${formatDate(data.since) || '-'}`, 25, y + 10);
      doc.text(`ถึงวันที่ ${formatDate(data.uptodate) || '-'}`, 175, y + 10);
      doc.text(`ตั้งแต่เวลา ${formatTime(data.since_time) || '-'} น.`, 325, y + 10);
      doc.text(`ถึงเวลา ${formatTime(data.until_thetime) || '-'} น.`, 475, y + 10);
      y += 30;

      y = checkY(doc, y);
      doc.text(`จำนวนผู้เข้าร่วม ${data.participants || '-'}`, 25, y);
      y += 25;

      y = checkY(doc, y);
      doc.text('และมีความประสงค์ขออนุญาตใช้ห้อง/สนาม ดังรายละเอียดต่อไปนี้', 25, y);
      y += 30;

      y = checkY(doc, y);
      doc.setFontSize(12);
      doc.setFont('Sarabun', 'bold');
      doc.text('1. ข้อมูลผู้ใช้สถานที่', 25, y);
      doc.setFont('Sarabun', 'normal');
      y += 25;

      const buildingLines = doc.splitTextToSize('อาคาร ' + (data.building || '-'), 200);
      const zoneLines = doc.splitTextToSize('ระบุหมายเลขพื้นที่/ห้องที่ต้องการใช้ ' + (data.zone || '-'), 250);
      y = checkY(doc, y);
      drawLines(doc, buildingLines, 55, y);
      drawLines(doc, zoneLines, 280, y);
      y += Math.max(buildingLines.length, zoneLines.length) * 15;

      y = checkY(doc, y);
      doc.setFont('Sarabun', 'bold');
      doc.text('2. ขออนุญาตใช้ระบบสาธารณูปโภค', 25, y + 10);
      doc.setFont('Sarabun', 'normal');
      y += 30;

      const airLines = doc.splitTextToSize(`เปิดเครื่องปรับอากาศตั้งแต่ ${data.turnon_air || '-'} น. ถึง ${data.turnoff_air || '-'} น. ( เฉพาะอาคารเฉลิมพระเกียรติฯ)`, 500);
      const lightLines = doc.splitTextToSize(`ไฟฟ้าส่องสว่างตั้งแต่ ${data.turnon_lights || '-'} น. ถึง ${data.turnoff_lights || '-'} น. ( เฉพาะอาคารเฉลิมพระเกียรติฯ)`, 500);
      y = drawLines(doc, airLines, 55, y);
      y = drawLines(doc, lightLines, 55, y);

      const otherLines = doc.splitTextToSize('อื่นๆ ' + (data.other || '-'), 480);
      y = drawLines(doc, otherLines, 55, y);

      y = checkY(doc, y);
      doc.setFont('Sarabun', 'bold');
      doc.text('3.ขออนุมัติรายการประกอบอาคาร', 25, y + 10);
      doc.setFont('Sarabun', 'normal');
      y += 25;

      const amphitheaterLines = doc.splitTextToSize('ดึงอัฒจันทร์ภายในอาคารเฉลิมพระเกียรติฯ ' + (data.amphitheater || '-'), 480);
      y = drawLines(doc, amphitheaterLines, 55, y + 10);

      const needEquipmentLines = doc.splitTextToSize('อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน) ' + (data.need_equipment || '-'), 480);
      y = drawLines(doc, needEquipmentLines, 55, y + 10);
      y += 25;

      // ----------------- เซ็นชื่อ ---------------------
      const signNameHeight = 45;
      if (y + signNameHeight > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        y = 50;
      }
      let signY = y;

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

      y = signY + 65; // กล่องกรอบล่าง

      // ----------------- กรอบล่าง ---------------------
      const signBoxHeight = 190;
      if (y + signBoxHeight > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        y = 50;
      }

      const boxY = y;
      const pageWidth2 = doc.internal.pageSize.getWidth();
      const boxWidth = (pageWidth2 - 40) / 3;
      const boxHeight = signBoxHeight;
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
      return;
    }

    // ------------------ EQUIPMENT (แบบเดิม) ------------------
    if (item.type === 'equipment') {
      const resBooking = await axios.get(`${API_BASE}/api/booking_equipment?id=${mainBookingId}`);
      const bookingData = Array.isArray(resBooking.data) ? resBooking.data[0] : resBooking.data;
      const itemRemarks = Array.isArray(bookingData.items)
        ? bookingData.items.map(i => ({
          name: i.item_name,
          remark: i.remark || ''
        }))
        : [];

      const historyRes = await axios.get(`${API_BASE}/api/history`);
      const allItems = historyRes.data
        .filter(d => String(d.booking_id) === String(mainBookingId))
        .filter(d => !d.status || d.status.toLowerCase() !== 'returned');

      const mergedItems = allItems.map((row, idx) => {
        const matched = itemRemarks.find(it => it.name === row.name);
        return {
          ...row,
          remark: matched ? matched.remark : '-'
        };
      });

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFont('Sarabun', 'normal');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFontSize(16);
      const title = 'แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง';
      const subTitle = 'โทร 053-917820-1 E-mail sport-complex@mfu.ac.th';
      doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, 45);
      doc.setFontSize(11);
      doc.text(subTitle, (pageWidth - doc.getTextWidth(subTitle)) / 2, 69);

      // ส่วนหัวด้านขวา
      const headerRightX = pageWidth - 50;
      const headerLines = [
        "ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง",
        `วันที่ ${formatDate(bookingData.start_date || bookingData.since || bookingData.date) || '-'}`,
        `วันที่มารับของ ${formatDate(bookingData.receive_date) || '-'}`,
        `เวลาที่มารับของ ${formatTime(bookingData.receive_time) || '-'} น.`
      ];
      let headerY = 100;
      const lineSpacing = 20;
      headerLines.forEach(line => {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, headerRightX - textWidth, headerY);
        headerY += lineSpacing;
      });

      // ฟังก์ชันเช็ค y (ขึ้นหน้าใหม่ถ้าจำเป็น)
      function checkAddPage(nextY, space = 20) {
        if (nextY + space > pageHeight - 60) {
          doc.addPage();
          return 80;
        }
        return nextY;
      }

      // ข้อมูลรายละเอียด
      let y = headerY + 20;
      const leftMargin = 50;
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(12);

      // ข้อมูลทั่วไป
      y = checkAddPage(y, 16);
      doc.text(`ข้าพเจ้า ${bookingData.name || '-'}`, leftMargin, y);
      doc.text(`รหัสนักศึกษา/พนักงาน ${bookingData.user_id || '-'}`, leftMargin + 270, y);

      y += 28;
      y = checkAddPage(y, 16);
      doc.text(`หน่วยงาน ${bookingData.agency || '-'}`, leftMargin, y);

      // เหตุผล (ข้อความยาว)
      y += 28;
      const reasonText = `เหตุผลในการขอใช้เพื่อ: ${bookingData.reason || '-'}`;
      const reasonLines = doc.splitTextToSize(reasonText, pageWidth - 80);
      doc.setFontSize(12);
      for (const line of reasonLines) {
        y = checkAddPage(y, 16);
        doc.text(line, leftMargin - 20, y);
        y += 16;
      }

      y = checkAddPage(y, 16);
      doc.text(`สถานที่ใช้งาน: ${bookingData.location || '-'}`, leftMargin - 20, y);
      y += 25;
      y = checkAddPage(y, 16);

      doc.text(
        `ในวันที่ ${formatDate(bookingData.start_date || bookingData.since || bookingData.date) || '-'} ถึงวันที่ ${formatDate(bookingData.end_date || bookingData.uptodate) || '-'}`,
        leftMargin - 20, y
      );
      y += 25;
      y = checkAddPage(y, 16);

      doc.text(`โดยมีรายการดังต่อไปนี้`, leftMargin - 20, y);
      y += 25;

      // ตาราง (autoTable จะจัดการขึ้นหน้าให้เอง)
      autoTable(doc, {
        startY: y,
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

      // กล่องลายเซ็น
      let signY = doc.lastAutoTable.finalY + 40;
      if (signY + 150 > pageHeight - 40) {
        doc.addPage();
        signY = 80;
      }
      const boxWidth = (pageWidth - 60) / 2;
      const boxHeight = 110;
      const marginLeft = 30;

      // Draw outer rectangles
      doc.setLineWidth(1);
      doc.setDrawColor(50, 50, 50);
      doc.rect(marginLeft, signY, boxWidth, boxHeight);
      doc.rect(marginLeft + boxWidth, signY, boxWidth, boxHeight);

      // Draw column titles
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('ความคิดเห็น/คำสั่ง/ผลการพิจารณา', marginLeft + boxWidth / 2, signY + 18, { align: 'center' });
      doc.text('ผลการดำเนินการ/ผลการปฏิบัติงาน', marginLeft + boxWidth + boxWidth / 2, signY + 18, { align: 'center' });

      // Thin lines under headers
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.7);
      doc.line(marginLeft + 10, signY + 25, marginLeft + boxWidth - 10, signY + 25);
      doc.line(marginLeft + boxWidth + 10, signY + 25, marginLeft + 2 * boxWidth - 10, signY + 25);

      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11);

      // Left box lines
      doc.text('.................................................................', marginLeft + 17, signY + 40);
      doc.text('.................................................................', marginLeft + 17, signY + 54);
      doc.text('ลงชื่อ.............................................หัวหน้าส่วน', marginLeft + 17, signY + 70);
      doc.text('วันที่................./................./.................', marginLeft + 22, signY + 100);

      // Right box lines
      doc.text('.................................................................', marginLeft + boxWidth + 17, signY + 40);
      doc.text('.................................................................', marginLeft + boxWidth + 17, signY + 54);
      doc.text('ลงชื่อ.................................ผู้ปฏิบัติงาน/ผู้รับผิดชอบ', marginLeft + boxWidth + 17, signY + 70);
      doc.text('วันที่................./................./.................', marginLeft + boxWidth + 22, signY + 100);

      // ===== ลายเซ็นผู้ขอ (ชิดซ้าย ลดขนาด ชื่ออยู่บรรทัดถัดไป) =====
      const userName = bookingData.name || '-';
      const signX = marginLeft + boxWidth + 20;
      let signTextY = signY + boxHeight + 40;
      if (signTextY + 32 > pageHeight - 40) {
        doc.addPage();
        signTextY = 80;
      }
      const nameWidth = doc.getTextWidth(userName);
      const minParenWidth = 140;
      const parenWidth = Math.max(nameWidth + 20, minParenWidth);
      const parenDots = '.'.repeat(Math.round(parenWidth / doc.getTextWidth('.')));
      const parenText = `( ${parenDots} )`;
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11);
      doc.text(`ลงชื่อ ${parenText}`, signX, signTextY, { align: 'left' });
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(12);
      doc.text(userName, signX + 35, signTextY + 16, { align: 'left' });

      doc.save('user_form.pdf');
      return;
    }

  } catch (err) {
    Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการดาวน์โหลด PDF', 'error');
    console.error(err);
  }
},

    // ==== Notification functions ====
    pruneOldNotifications() {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 วัน
      this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
    },

    toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    this.lastSeenTimestamp = Date.now();
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(this.lastSeenTimestamp));
    this.unreadCount = 0; // เคลียร์ badge ทันทีเมื่อเปิด
  }
},
    closeNotifications() {
  this.showNotifications = false;
},
    handleClickOutside(event) {
  const notifDropdown = document.querySelector('.notification-dropdown');
  const notifBtn = document.querySelector('.notification-btn');
  if (
    notifDropdown &&
    !notifDropdown.contains(event.target) &&
    notifBtn &&
    !notifBtn.contains(event.target)
  ) {
    this.closeNotifications();
  }
},
    async fetchNotifications() {
  try {
    this.pruneOldNotifications();

    const res = await axios.get(`${API_BASE}/api/history/approve_field`);
    const data = Array.isArray(res.data) ? res.data : [];

    const pendings = data.filter(item =>
      item.status === 'pending' &&
      (item.type === 'field' || item.type === 'equipment')
    );

    if (pendings.length) {
      const newMessages = pendings.map(item => {
        const id = item._id?.$oid || item._id;
        const ts =
          (item.updatedAt && new Date(item.updatedAt).getTime()) ??
          (item.createdAt && new Date(item.createdAt).getTime()) ??
          (item.date && new Date(item.date).getTime()) ??
          Date.now();

        return {
          id,
          type: 'pending',
          timestamp: ts,
          message: item.type === 'field'
            ? `สนาม '${item.name}' กำลังรอการอนุมัติ`
            : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
        };
      });

      // รวม + unique ตาม id และเรียงล่าสุดก่อน
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      this.pruneOldNotifications();
    }

    // นับ unread จาก timestamp > lastSeenTimestamp (เหมือน Members)
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch {}
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
    handleResize() {
    this.isMobile = window.innerWidth <= 600;
    if (!this.isMobile) this.isSidebarClosed = false;
  },
  toggleSidebar() {
    this.isSidebarClosed = !this.isSidebarClosed;
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

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    document.addEventListener('mousedown', this.handleClickOutside)
    this.lastSeenTimestamp = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0');

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
    window.removeEventListener('resize', this.handleResize);

  }
}
</script>






<style scoped>

.small-btn, .pdfmake-btn, .toggle-btn, .download-link {
  font-size: 0.89rem !important;
  padding: 5px 10px !important;
  min-height: 26px !important;
  border-radius: 5px !important;
  line-height: 1.2 !important;
}
.pdfmake-btn i,
.toggle-btn i,
.download-link i {
  font-size: 1.13em;
}

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
  padding: 1rem 0 2.5rem 0;   /* เปลี่ยนตรงนี้! เอา padding ซ้ายขวาออก */
  justify-content: space-between;
  max-width: 1200px;          /* เพิ่มบรรทัดนี้! */
  margin: 0 auto;              /* กลางหน้าจอ */
}
.hist-date {
  font-size: 0.9em;
  color: #777;
  margin-right: 7px;
  min-width: 56px;
  display: inline-block;
}

.hist-date-outside {
  font-size: 1.08em;
  color: #526683;
  margin-bottom: 0px;
  margin-left: 6px;
  margin-top: 12px;
  font-weight: 500;
  position: relative;
}

.hist-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 2px;
  padding: 0;
  width: 100%;                /* ปล่อยไว้ได้เลย */
  transition: box-shadow 0.2s;
}

.hist-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.hist-card:nth-child(even) {
  background-color: #f3f6fa;
}

.hist-header,
.hist-row,
.table-row-align {
  display: flex;
  align-items: center;
  text-align: center;
}

.hist-header > span,
.hist-row > span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  /* สำหรับมือถือข้อมูลจะอยู่กลาง */
}

/* ---- ช่องข้อมูลแต่ละ column ---- */
.hist-user    { flex: 1.4; min-width: 110px; max-width: 200px;}
.hist-name    { flex: 2.1; min-width: 160px; max-width: 260px;}
.hist-detail  { flex: 1.3; min-width: 90px;  max-width: 130px;}
.hist-status  { flex: 1.3; min-width: 120px;  max-width: 170px;}
.hist-file    { flex: 1.4; min-width: 120px; max-width: 190px;}
.hist-action  { flex: 1.3; min-width: 110px; max-width: 190px;}


.hist-row span, .hist-header span {
  justify-content: center !important;
  align-items: center !important;
}

/* ขยับช่อง "จำนวน" ซ้ายขึ้นและเว้นช่องกับ "สถานะ" */
.hist-detail.hist-qty {
  justify-content: center !important; /* เดิมเป็น flex-start */
  margin-left: 0;
  min-width: 90px;
  max-width: 110px;
  text-align: center;
}

/* ช่อง "สถานะ" ของอุปกรณ์: เว้นช่องซ้าย-ขวา */
.hist-status.hist-equip-status {
  margin-left: 0;
  margin-right: 0;
  min-width: 140px;   /* ขยายขึ้นจาก 110px */
  max-width: 170px;   /* ขยายขึ้นจาก 140px */
  justify-content: center !important;
  text-align: center;
  padding: 0 10px;
  white-space: nowrap;  /* บังคับให้ขึ้นบรรทัดเดียว */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ช่อง "ดูไฟล์แนบ" เว้นข้างซ้าย */
.hist-file {
  margin-left: 8px;
  margin-right: 6px;
  justify-content: center !important;
}

.hist-action {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

/* ให้แต่ละ cell มีขอบคั่น */
.hist-row > span, .hist-header > span {
  padding: 12px 0 12px 0;
}
/* --------- ส่วนปุ่มและกล่องไฟล์แนบ --------- */
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
.pdfmake-btn {
  background-color: #ff2600;
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
  background-color: #970909df;
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

/* กล่องรายละเอียดไฟล์แนบ */
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
.date-filter-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 7px;
  margin-bottom: 12px;
  margin-right: 18px;
}
.date-filter-row label { font-weight: 500; }
.date-filter-row input[type="date"] {
  border-radius: 7px;
  border: 1px solid #a5b4fc;
  padding: 4px 7px;
  font-size: 1em;
}
.date-filter-row button {
  border-radius: 6px;
  border: none;
  padding: 5px 13px;
  background: #1d4ed8;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.16s;
}
.date-filter-row button:hover { background: #25396f; }

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

/* Slide animation */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(.25,1.7,.46,.89);
}
.slide-enter, .slide-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}

/* toggle/cancel */
.toggle-btn {
  background: #5deb2593;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  cursor: pointer;
  font-weight: 500;
}
.toggle-btn:hover {
  background: #0e5017c5;
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
.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.16);
  z-index: 1100;
}
.sidebar {
  z-index: 1200;
}
@media (max-width: 600px) {
  .main {
    width: 100vw;
    overflow-x: auto !important;
  }
  .histbody {
    width: 100vw !important;
    min-width: unset;
    overflow-x: auto !important;
    padding: 0 0.5rem;
  }
  .hist-grid {
    min-width: 700px;
    width: max-content;
  }
}

.notification-backdrop{
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: transparent;
  z-index: 1001;
}


</style>


<style>
@import '../css/style.css';
</style>