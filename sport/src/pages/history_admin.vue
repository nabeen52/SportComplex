<template>
  <div class="layout">
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
        <!-- <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> รับคืนอุปกรณ์ </router-link> -->
         <router-link to="/agency_admin" active-class="active"><i class="pi pi-briefcase"></i> หน่วยงาน </router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล </router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
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
                  :class="[
                    'notification-item',
                    noti.type || '',
                    { unread: noti.timestamp > lastSeenTimestamp }
                  ]"
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
          <!-- Title -->
          <h1 style="display: flex; justify-content: center;">System history</h1>

          <!-- Type filter -->
          <div class="history-filter">
            <button :class="{ active: historyFilter === 'all' }" @click="setHistoryFilter('all')">All</button>
            <button :class="{ active: historyFilter === 'field' }" @click="setHistoryFilter('field')">Field</button>
            <button :class="{ active: historyFilter === 'equipment' }" @click="setHistoryFilter('equipment')">Equipment</button>
          </div>

          <!-- Date filter -->
         <!-- แค่ครอบ container นี้ก็พอ -->
<div class="content-wrap">
        <!-- Date filter -->
        <div class="date-filter-row">
          <label>Filter date</label>
          <input ref="rangePicker" class="date-input" placeholder="dd/mm/yyyy - dd/mm/yyyy" />
          <button class="clear-btn" @click="clearDateFilter()">clear</button>
        </div>

        <!-- History list (TABLE VERSION) -->
        <div class="table-x-scroll">
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th class="name-col">Name</th>
                <th>Time / Amount</th>
                <th>Status</th>
                <th>Files/PDF</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <template
                v-for="(group, gIdx) in paginatedGroups"
                :key="group.type + '_' + (group.items[0].booking_id || group.items[0].id || gIdx)"
              >
                <!-- แถวหลักของกลุ่ม -->
                <tr>
                  <!-- วันที่ -->
                  <td style="text-align:center; white-space:nowrap;">
                    <template v-if="group.type === 'field'">
                      {{ formatDate(group.items[0].approvedAt || group.items[0].date) }}
                    </template>
                    <template v-else>
                      <!-- ใหม่: เอาจาก createdAt ก่อน แล้วค่อย fallback -->
                      {{ formatDate(
                        group.items[0].createdAt ||
                        group.items[0].returnedAt ||
                        group.items[0].approvedAt ||
                        group.items[0].date
                      ) }}
                    </template>
                  </td>

                  <!-- ประเภท -->
                  <td style="text-align:center; text-transform: capitalize;">
                    {{ group.type }}
                  </td>

                  <!-- ชื่อรายการ -->
                  <td class="col-center name-col">
                    <div class="name-text" :title="group.type==='field' ? (group.items[0].name || '-') : uniqueListByName(group.items).join(', ')">
                      <template v-if="group.type === 'field'">
                        {{ group.items[0].name || '-' }}
                      </template>
                      <template v-else>
                        {{ uniqueListByName(group.items).join(', ') || '-' }}
                      </template>
                    </div>
                  </td>

                  <!-- เวลา/จำนวน -->
                  <td style="text-align:center;">
                    <template v-if="group.type === 'field'">
                      {{ addThaiMinuteSuffix(group.items[0].time) }}
                    </template>
                    <template v-else>
                      {{ quantitiesForGroup(group) }}
                    </template>
                  </td>

                  <!-- สถานะ -->
                  <td style="text-align:center;">
                    {{ groupStatus(group) }}
                  </td>

                  <!-- ไฟล์แนบ / PDF -->
                  <td style="text-align:center;">
                    <button class="toggle-btn" @click="toggleExpand(group.items[0].id)">
                      <i class="pi pi-paperclip"></i>
                    </button>

                    <button
                      class="pdfmake-btn small-btn"
                      @click="openPdfLikeApprove(group)"
                      style="margin-left:8px;"
                      title="ดูไฟล์ PDF"
                    >
                      <i class="pi pi-file-pdf"></i>
                    </button>
                  </td>

                  <!-- การกระทำ -->
                  <td style="text-align:center;">
                    <button class="remark-btn" @click="showDetailGroup(group)">Detail</button>

                    <button
                      v-if="group.type === 'field' && group.items[0].status && group.items[0].status.toLowerCase() === 'approved'"
                      class="cancel-btn"
                      @click="cancelFieldBooking(group.items[0])"
                      style="margin-left: 8px; margin-top: 10px;"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>

                <!-- แถวแสดงไฟล์แนบ -->
                <tr v-show="expandedRows.includes(group.items[0].id)">
                  <td colspan="7" style="padding: 0;">
                    <div class="hist-file-detail-box" style="margin: 10px 10px;">
                      <div class="hist-file-header"><b>ไฟล์แนบ</b></div>

                      <!-- FIELD: ใช้ไฟล์ของ item แรก -->
                      <template v-if="group.type === 'field'">
                        <div v-if="Array.isArray(group.items[0].fileName) && group.items[0].fileName.length">
                          <table class="attached-files-table">
                            <thead>
                              <tr>
                                <th>ลำดับ</th>
                                <th>ชื่อไฟล์</th>
                                <th>ดูไฟล์แนบ</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="(fname, idx) in uniqueFieldFiles(group.items[0])"
                                :key="idx"
                              >
                                <td>{{ idx + 1 }}</td>
                                <td class="left">{{ fname }}</td>
                                <td>
                                  <button
                                    class="download-link"
                                    @click="downloadAttachedFile(group.items[0], idx, fname)"
                                  >
                                    ดูไฟล์แนบ
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div v-else class="no-attachment">- ไม่มีไฟล์แนบ -</div>
                      </template>

                      <!-- EQUIPMENT: แยก “รูปการรับคืน” และ “ไฟล์แนบอื่น ๆ” -->
<template v-else>
  <!-- ส่วนไฟล์แนบ (ไม่ใช่รูป) ให้แสดงเสมอ ถ้าไม่มีให้ขึ้นข้อความ -->
  <div class="section-block">
    <table v-if="attachmentsSplit(group).files.length" class="attached-files-table" style="margin-bottom:10px;">
      <thead>
        <tr>
          <th>ลำดับ</th>
          <th>ชื่อไฟล์</th>
          <th>ดูไฟล์แนบ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(att, i) in attachmentsSplit(group).files" :key="att.key">
          <td>{{ i + 1 }}</td>
          <td class="left">{{ att.fileName }}</td>
          <td>
            <button class="download-link"
              @click="downloadAttachedFile(att.item, att.fileIdx, att.fileName)">
              ดูไฟล์แนบ
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ไม่มีไฟล์แนบ -->
    <div v-else class="no-attachment" style="margin-bottom:10px;">- ไม่มีไฟล์แนบ -</div>
  </div>

  <!-- รูปการรับคืน (แสดงต่อจากไฟล์แนบ ถ้ามีรูป) -->
  <div v-if="attachmentsSplit(group).images.length" class="section-block">
    <div class="hist-file-header"><b>รูปการรับคืน</b></div>
    <table class="attached-files-table" style="margin-bottom:10px;">
      <thead>
        <tr>
          <th>ลำดับ</th>
          <th>อุปกรณ์</th>
          <th>ชื่อไฟล์</th>
          <th>ดูรูป</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(att, i) in attachmentsSplit(group).images" :key="att.key">
          <td>{{ i + 1 }}</td>
          <td class="left">{{ att.itemName }}</td>
          <td class="left">{{ att.fileName }}</td>
          <td>
            <button class="download-link"
              @click="downloadAttachedFile(att.item, att.fileIdx, att.fileName, att.source, att.url)">
              ดูรูป
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
          

          <!-- Pagination -->
          <div class="pagination-control">
            <button @click="prevPage" :disabled="currentPage === 1">ย้อนกลับ</button>
            <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages">ถัดไป</button>
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
    </div>
  </div>
  </div>
</template>








<script>
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import { Thai } from 'flatpickr/dist/l10n/th.js'
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
    fpStart: null,
    fpEnd: null,
    fpRange: null,  
      dateFilterApplied: false,
      lastSeenTimestamp: 0,
       dateFilterStartUI: '', // เก็บข้อความที่ผู้ใช้พิมพ์: dd/mm/yyyy (โชว์)
    dateFilterEndUI:   '',
  userIdToEmail: {}, // <-- NEW: เก็บ map user_id -> email
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
uniqueFieldFiles(item) {
  // โชว์เฉพาะไฟล์ที่แนบมาจริงจาก collection history > attachment
  const atts = Array.isArray(item?.attachment) ? item.attachment : [];

  const cleanNameFromUrl = (u) => {
    try {
      const s = String(u || '');
      const noQuery = s.split('?')[0];
      return decodeURIComponent(noQuery.split('/').pop() || 'file');
    } catch { return 'file'; }
  };

  // ไม่ dedupe เพื่อให้ตรงกับไฟล์ที่แนบมาจริง ๆ
  return atts.map(cleanNameFromUrl);
},


     addThaiMinuteSuffix(t) {
  const s = (t || '').toString().trim();
  if (!s) return '-';

  // ถ้ามีช่วงเวลา เช่น "18:51 - 19:51"
  if (s.includes('-')) {
    const [startRaw, endRaw] = s.split('-').map(p => p.trim());
    const fmt = (x) => /(น\.)$/.test(x) ? x : `${x} น.`;

    if (startRaw && endRaw) return `${fmt(startRaw)} - ${fmt(endRaw)}`;
    if (startRaw) return fmt(startRaw);
    if (endRaw) return fmt(endRaw);
    return '-';
  }

  // เวลาเดียว
  if (/(น\.)$/.test(s)) return s;
  return `${s} น.`;
},

attachmentsSplit(group) {
  const images = [];
  const files  = [];
  const items = Array.isArray(group?.items) ? group.items : [];

  const normArr = (v) => Array.isArray(v) ? v : (v ? [v] : []);
  const cleanNameFromUrl = (u) => {
    try {
      const s = String(u || '');
      const noQuery = s.split('?')[0];
      return decodeURIComponent(noQuery.split('/').pop() || 'file');
    } catch { return 'file'; }
  };
  const isImage = (name) => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(String(name || ''));
  const dedupeKey = (u) => {
    try {
      const s = String(u || '');
      const noQuery = s.split('?')[0];
      return decodeURIComponent(noQuery.split('/').pop() || s).toLowerCase();
    } catch { return String(u || '').toLowerCase(); }
  };

  const seenFile = new Set();

  items.forEach(item => {
    const atts    = normArr(item?.attachment);
    // รองรับหลายชื่อ แต่หลัก ๆ คือ returnPhoto
    const returns = [
      ...normArr(item?.returnPhoto),
      ...normArr(item?.return_photo),
      ...normArr(item?.returnImage),
      ...normArr(item?.return_images),
      ...normArr(item?.return_img),
    ].filter(Boolean);

    // A) รูปการรับคืน: "ให้สิทธิ์มากกว่า" ถ้ามี returnPhoto ให้ใช้รูปแรกต่อ 1 รายการ
    if (returns.length) {
      const u = returns[0];
      const fname = cleanNameFromUrl(u);
      if (isImage(fname)) {
        images.push({
          key: `${item.id || item._id || Math.random()}-rp-0`,
          itemName: item.name || '-',
          fileName: fname,
          fileIdx: 0,
          item,
          source: 'returnPhoto',
          url: u
        });
      }
    } else {
      // ไม่มี returnPhoto → fallback ไปใช้รูปแรกใน attachment
      for (let idx = 0; idx < atts.length; idx++) {
        const u = atts[idx];
        const fname = cleanNameFromUrl(u);
        if (isImage(fname)) {
          images.push({
            key: `${item.id || item._id || Math.random()}-att-${idx}`,
            itemName: item.name || '-',
            fileName: fname,
            fileIdx: idx,
            item,
            source: 'attachment',
            url: u
          });
          break;
        }
      }
    }

    // B) ไฟล์แนบอื่น ๆ (ไม่ใช่รูป) จาก attachment (ตัดซ้ำทั้งกลุ่ม)
    atts.forEach((att, idx) => {
      const fname = cleanNameFromUrl(att);
      if (isImage(fname)) return;
      const key = dedupeKey(att);
      if (seenFile.has(key)) return;
      seenFile.add(key);
      files.push({
        key: `${item.id || item._id || Math.random()}-file-${idx}`,
        itemName: item.name || '-',
        fileName: fname,
        fileIdx: idx,
        item,
        source: 'attachment',
        url: att
      });
    });
  });

  return { images, files };
},



    mergedAttachments(group) {
  const out = [];
  const cleanNameFromUrl = (u) => {
    try {
      const s = String(u);
      const noQuery = s.split('?')[0];
      return decodeURIComponent(noQuery.split('/').pop() || 'file');
    } catch { return 'file'; }
  };

  (group?.items || []).forEach(item => {
    // ชื่อไฟล์จาก fileName[] หรือดึงชื่อจาก attachment[] ถ้าไม่มี
    let names = Array.isArray(item.fileName) ? item.fileName.slice() : [];
    if ((!names || names.length === 0) && Array.isArray(item.attachment)) {
      names = item.attachment.map(cleanNameFromUrl);
    }

    names.forEach((fname, idx) => {
      out.push({
        key: `${item.id || item._id || Math.random()}-${idx}`,
        itemName: item.name || '-',
        fileName: fname || cleanNameFromUrl(fname),
        fileIdx: idx,
        item
      });
    });
  });

  return out;
},


 // แปลง "dd/mm/yyyy" -> "yyyy-mm-dd" (ถ้าไม่ถูกต้อง คืน '')
 onDateFilterChange() {
    this.currentPage = 1
  },
 clearDateFilter() {
  this.dateFilterStart = '';
  this.dateFilterEnd   = '';
  this.dateFilterApplied = false;
  this.currentPage = 1;

  if (this.fpRange) {
    this.fpRange.clear();
    if (this.fpRange.altInput) this.fpRange.altInput.value = '';
    if (this.fpRange.input)    this.fpRange.input.value    = '';
  }
},

     openInNewTabSilent(u) {
    const url = this.normalizePdfUrl(u);
    if (!url) return false;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch (e) {
      // ทางหนีสุดท้าย: เปิดในแท็บเดิม (ไม่แจ้งเตือน)
      try { window.location.href = url; } catch {}
      return false;
    }
  },

    _forceHttps(u) {
  try {
    const url = new URL(u, window.location.origin);
    if (location.protocol === 'https:') url.protocol = 'https:'; // อัปเกรดเป็น https เสมอเมื่อหน้าเป็น https
    return url.toString();
  } catch { return u; }
},

    _findAttachmentIndexByName(item, fname) {
  const atts = Array.isArray(item.attachment) ? item.attachment : [];
  if (!fname || !atts.length) return null;
  const clean = (s) => decodeURIComponent(String(s).split('?')[0]).split('/').pop();
  const target = clean(fname);
  const idx = atts.findIndex(a => clean(a) === target || String(a).includes(target));
  return idx >= 0 ? idx : null;
},

async downloadAttachedFile(item, idx = 0, fname = '', source = '', directUrl = null) {
  try {
    // ถ้ามี url ตรง ๆ มาเลย เปิดทันที
    if (directUrl) {
      this.openInNewTabSilent(this.normalizePdfUrl(directUrl));
      return;
    }

    const atts = Array.isArray(item?.attachment) ? item.attachment : [];
    const returns = Array.isArray(item?.returnPhoto)
      ? item.returnPhoto
      : (item?.returnPhoto ? [item.returnPhoto] : []);

    const clean = (s) => decodeURIComponent(String(s).split('?')[0]).split('/').pop();
    const findIdxByName = (arr, name) => {
      if (!arr?.length || !name) return null;
      const target = clean(name);
      const i = arr.findIndex(u => {
        const fn = clean(u);
        return fn === target || String(u).includes(target);
      });
      return i >= 0 ? i : null;
    };

    // ถ้าระบุว่าเป็นรูปการรับคืน
    if (source === 'returnPhoto' && returns.length) {
      const matchIdx = findIdxByName(returns, fname);
      const useIdx = matchIdx !== null ? matchIdx : Math.min(idx, returns.length - 1);
      const href = this.normalizePdfUrl(returns[useIdx]);
      this.openInNewTabSilent(href);
      return;
    }

    // ปกติ: เปิดจาก attachment
    if (atts.length) {
      const matchIdx = findIdxByName(atts, fname);
      const useIdx = matchIdx !== null ? matchIdx : Math.min(idx, atts.length - 1);
      const href = this.normalizePdfUrl(atts[useIdx]);
      this.openInNewTabSilent(href);
      return;
    }

    // ทางหนีสุดท้าย: preview จาก endpoint
    const histId = item.id || item._id;
    if (!histId) {
      Swal.fire('ผิดพลาด','ไม่พบรหัสรายการสำหรับไฟล์แนบ','error');
      return;
    }
    const apiBase = this._forceHttps(this.API_BASE || window.location.origin).replace(/\/+$/,'');
    const previewUrl = `${apiBase}/api/history/file/${histId}?fileIdx=${idx}`;
    this.openInNewTabSilent(previewUrl);
  } catch (e) {
    console.error(e);
    Swal.fire('ผิดพลาด','ไม่สามารถเปิดไฟล์แนบได้','error');
  }
},



   normalizePdfUrl(raw) {
  if (!raw) return null;

  // ทำให้ path ที่ขึ้นต้นด้วย '/' เป็น absolute ที่สอดคล้อง origin ปัจจุบัน
  let u = raw.startsWith('/') ? new URL(raw, window.location.origin).href : raw;

  // บังคับ https ชั้นนอกก่อน
  u = this._forceHttps(u);

  // ถ้าเป็น /file/preview?url=… ให้ “อัปเกรดค่าข้างใน” ด้วย
  try {
    const outer = new URL(u);
    if (outer.pathname.startsWith('/file/preview')) {
      const inner = outer.searchParams.get('url');
      if (inner) {
        outer.searchParams.set('url', this._forceHttps(inner));
        u = outer.toString();
      }
    }
  } catch {}
  return u;
},

pickPdfUrl(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  // ถ้า BE เก็บ url ไว้ตรง ๆ
  const direct = list.find(h => h?.bookingPdfUrl || h?.booking_pdf_url);
  if (direct) return direct.bookingPdfUrl || direct.booking_pdf_url;
  // ถ้าเก็บใน attachment เป็น array
  const attach = list.find(h => Array.isArray(h?.attachment) && h.attachment[0]);
  return attach ? attach.attachment[0] : null;
},

getFileNameFromUrl(u, fallback = 'booking.pdf') {
  try {
    const { pathname } = new URL(u);
    const name = decodeURIComponent(pathname.split('/').pop() || '');
    return name || fallback;
  } catch { return fallback; }
},


 async openPdfFromHistoryGroup(group) {
    try {
      const first = group?.items?.[0] || {};
      let bookingId =
        group?.booking_id ||
        first.booking_id ||
        first.booking_field_id ||
        first.booking_equipment_id || '';

      if (/^[a-f0-9]{24}$/i.test(String(bookingId))) bookingId = '';

      let fileUrl = null;

      if (bookingId) {
        const resHist = await axios.get(`${this.API_BASE}/api/history`, { params: { booking_id: bookingId } });
        let list = Array.isArray(resHist.data) ? resHist.data : [];
        list = list
          .filter(h => String(h?.booking_id || '') === String(bookingId))
          .sort((a,b) =>
            new Date(b.updatedAt || b.createdAt || b.date || 0) -
            new Date(a.updatedAt || a.createdAt || a.date || 0)
          );
        fileUrl = this.pickPdfUrl(list);
      }

      if (!fileUrl) {
        const histId = first.id || first._id;
        if (!histId) {
          Swal.fire('ผิดพลาด','ไม่พบไฟล์ PDF สำหรับรายการนี้','error');
          return;
        }
        const apiBase = this._forceHttps(this.API_BASE || window.location.origin).replace(/\/+$/,'');
        this.openInNewTabSilent(`${apiBase}/api/history/file/${histId}?fileIdx=0`);
        return;
      }

      this.openInNewTabSilent(fileUrl);
    } catch (err) {
      console.error('openPdfFromHistoryGroup error:', err);
      Swal.fire('ผิดพลาด','ไม่สามารถเปิดไฟล์ PDF ได้','error');
    }
  },

 async downloadBookingPdf(target) {
    const bookingId  = typeof target === 'string' ? target : (target?.booking_id || '');
    const typeFilter = typeof target === 'object' ? (target?.type || '') : '';

    if (!bookingId) {
      Swal.fire('ผิดพลาด','ไม่พบ booking_id สำหรับไฟล์ PDF','error');
      return;
    }

    try {
      const resHist = await axios.get(`${this.API_BASE}/api/history`, { params: { booking_id: bookingId } });
      let list = Array.isArray(resHist.data) ? resHist.data : [];

      list = list.filter(h => String(h?.booking_id || '') === String(bookingId));
      if (typeFilter) list = list.filter(h => (h?.type || '').toLowerCase() === typeFilter.toLowerCase());
      list.sort((a,b) =>
        new Date(b.updatedAt || b.createdAt || b.date || 0) -
        new Date(a.updatedAt || a.createdAt || a.date || 0)
      );

      const picked = this.pickPdfUrl(list);
      const rawUrl = this.normalizePdfUrl(picked);

      if (!rawUrl) {
        Swal.fire('ผิดพลาด','ไม่พบ URL ของไฟล์ PDF สำหรับรายการนี้','error');
        return;
      }

      // ✅ เปิดแบบเงียบ ไม่เด้งแจ้งเตือนเมื่อเบราว์เซอร์บล็อก
      this.openInNewTabSilent(rawUrl);
    } catch (err) {
      console.error('downloadBookingPdf error:', err);
      Swal.fire('ผิดพลาด','ไม่สามารถเปิดไฟล์ PDF ได้','error');
    }
  },

  async openPdfLikeApprove(group) {
    const first = group?.items?.[0] || {};

    // เปิดแบบเงียบ (คืน true ถ้ามี url ให้เปิด)
    const tryOpen = (u) => {
      if (!u) return false;
      this.openInNewTabSilent(u);
      return true;
    };

    // เปิดจาก bookingPdfUrl ในแถวก่อน
    if (tryOpen(first.bookingPdfUrl)) return;
    if (tryOpen(first.booking_pdf_url)) return;

    // หา bookingPdfUrl ล่าสุดจาก history ของ booking เดียวกัน
    const bookingId =
      first.booking_id ||
      first.booking_field_id ||
      first.booking_equipment_id ||
      group?.booking_id ||
      '';

    if (bookingId) {
      try {
        const resHist = await axios.get(`${this.API_BASE}/api/history`, {
          params: { booking_id: bookingId }
        });
        const rows = (Array.isArray(resHist.data) ? resHist.data : [])
          .filter(h => String(h?.booking_id || '') === String(bookingId))
          .sort((a, b) =>
            new Date(b.updatedAt || b.createdAt || b.date || 0) -
            new Date(a.updatedAt || a.createdAt || a.date || 0)
          );

        const found = rows.find(h => h.bookingPdfUrl || h.booking_pdf_url);
        if (found && tryOpen(found.bookingPdfUrl || found.booking_pdf_url)) return;

        Swal.fire({
  icon: 'warning',
  title: 'ไม่พบไฟล์ PDF',
  html: '<div style="text-align:center">รายการนี้ไม่มี PDF Form</div>',
  confirmButtonText: 'OK'
});
        return;
      } catch (e) {
        console.error('openPdfLikeApprove lookup error:', e);
        Swal.fire('ผิดพลาด', 'ไม่สามารถค้นหาไฟล์ PDF ได้', 'error');
        return;
      }
    }

    Swal.fire('ไม่พบไฟล์ PDF', 'ไม่พบ bookingPdfUrl สำหรับรายการนี้', 'warning');
  },

    onDateFilterChange() {
    this.currentPage = 1 // ถ้าใช้ pagination
    // filter จะถูกทำงานอัตโนมัติผ่าน computed
  },
  selectItemsForDetail(group) {
  const items = group?.items || [];
  const has = (s) => items.some(it => (it.status || '').toLowerCase() === s);

  // ✅ ตัด return-pending ออกจากลอจิกการเลือก
  if (has('returned')) return items.filter(it => (it.status || '').toLowerCase() === 'returned');
  if (has('approved')) return items.filter(it => (it.status || '').toLowerCase() === 'approved');

  return items.filter(it => {
    const s = (it.status || '').toLowerCase();
    return s !== 'return-pending'; // กันหลุด
  });
},

groupStatus(group) {
  if (!group || !group.items || !group.items.length) return '-';

  if (group.type === 'field') {
    const raw = (group.items[0].status || '').toLowerCase();
    if (raw === 'cancel') return 'Cancelled';        // เดิมมีอยู่แล้วสำหรับ field
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  // equipment
  const items = group.items;
  const has = (s) => items.some(it => (it.status || '').toLowerCase() === s);

  if (has('returned'))     return 'Returned';
  if (has('cancel'))       return 'Cancelled';       // << เพิ่มบรรทัดนี้
  if (has('approved'))     return 'Approved';
  if (has('disapproved'))  return 'Disapproved';

  return '-';
},

  uniqueListByName(items) {
  // ตัดซ้ำแบบ case-insensitive และเก็บรูปเดิมของชื่อแรกที่พบ
  const seen = new Set();
  const out = [];
  for (const it of (items || [])) {
    const original = (it?.name ?? '').trim();
    if (!original) continue;
    const key = original.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(original);
    }
  }
  return out;
},

quantitiesForGroup(group) {
  if (!group || group.type !== 'equipment') return '-';
  const norm = (it) => (it.status || '').toLowerCase();

  const returned = group.items.filter(it => norm(it) === 'returned');
  const fallback = group.items.filter(it => norm(it) !== 'return-pending'); // ✅ ตัดทิ้ง

  const useList = returned.length ? returned : fallback;
  return useList.length ? useList.map(it => (it.quantity ?? '-')).join(', ') : '-';
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

pickNonEmpty(...vals) {
  for (const v of vals) {
    const s = (v ?? '').toString().trim();
    if (s && s !== '-' && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined') {
      return s;
    }
  }
  return '-';
},


emailForRow(row, group) {
  // ดึงอีเมลจากหลายแหล่ง: ในแถวเอง / ชื่อฟิลด์อื่น / จากแม็พ userIdToEmail / เผื่อในรายการเดียวกันมีตัวอื่นที่มีอีเมล
  const fromMap = this.userIdToEmail?.[row.user_id] || this.userIdToEmail?.[row.id_form] || '';
  const fromRow = this.pickNonEmpty(row.email, row.user_email, row.email_form, row.userEmail);
  const fromGroup = (group?.items || [])
    .map(x => this.pickNonEmpty(x.email, x.user_email, x.email_form, this.userIdToEmail?.[x.user_id] || ''))
    .find(e => e && String(e).includes('@')) || '';
  return this.pickNonEmpty(fromRow, fromMap, fromGroup, '-');
},

   async showDetailGroup(group) {
  let html = '';

  const esc = (s) => String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>');

  const fmt = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt)
      ? '-'
      : dt.toLocaleDateString('th-TH', { year:'numeric', month:'2-digit', day:'2-digit' });
  };

  const pick = (...vals) => {
    for (const v of vals) {
      const s = (v ?? '').toString().trim();
      if (s && s !== '-' && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined') return s;
    }
    return '-';
  };

  const reviewerName = (row) => {
    const s = (row.status || '').toLowerCase();
    if (s === 'approved')    return esc(row.approvedBy || '-');
    if (s === 'disapproved') return esc(row.disapprovedBy || '-');
    if (s === 'returned') {
      const fb = (group.items || []).find(x => x.approvedBy || x.disapprovedBy);
      return esc(
        row.approvedBy ||
        row.disapprovedBy ||
        fb?.approvedBy ||
        fb?.disapprovedBy ||
        '-'
      );
    }
    return '-';
  };

  // ✅ helper: ผู้ส่งมอบ = handoverBy ถ้าไม่มีให้ใช้ approvedBy แทน
  const handoverName = (row) => esc(row.handoverBy || row.approvedBy || '-');

  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s||'').trim());
  const mailto = (s) => {
    const e = String(s || '').trim();
    return isEmail(e)
      ? `<a href="mailto:${encodeURIComponent(e)}" class="mailto-link">${esc(e)}</a>`
      : '-';
  };

  const it = group.items?.[0] || {};

  if (group.type === 'field') {
  // === FIELD DETAIL ===
  const startDateRaw = it.since || it.start_date || it.startDate;
  const endDateRaw   = it.uptodate || it.end_date || it.endDate;

  const dateCell = (() => {
    const s = fmt(startDateRaw);
    const e = fmt(endDateRaw);
    if (s !== '-' && e !== '-') return `${s} - ${e}`;
    if (s !== '-') return s;
    if (e !== '-') return e;
    return fmt(it.date);
  })();

  const prettyStatus  = ((it.status || '').toLowerCase() === 'cancel') ? 'Cancelled' : (it.status || '-');
  const requesterCell = it.username_form || it.requester || it.userName || it.user_name || it.user || '-';
  const emailCell     = this.emailForRow(it, group);

  // ✅ รองรับหลายคีย์ของ zone แล้วคืน '-' ถ้าไม่มี
  const zoneCell = pick(it.zone, it.field_zone, it.room_zone, it.fieldZone);

  html = `
    <div class="swal-table-wrap">
      <table class="swal-table-2col">
        <tbody>
          <tr><th>สนาม</th><td>${esc(it.name)}</td></tr>
          <tr><th>โซน</th><td>${esc(zoneCell)}</td></tr>
          <tr><th>ผู้ขอใช้</th><td>${esc(requesterCell)}</td></tr>
          <tr><th>อีเมล</th><td>${mailto(emailCell)}</td></tr>
          <tr><th>วันที่จอง</th><td>${dateCell}</td></tr>
          <tr><th>เวลาที่จอง</th><td>${esc(this.addThaiMinuteSuffix(it.time))}</td></tr>
          <tr><th>สถานะ</th><td>${esc(prettyStatus)}</td></tr>
          <tr><th>ผู้อนุมัติ/ผู้ไม่อนุมัติ</th><td>${esc(it.approvedBy || it.disapprovedBy || '-')}</td></tr>
          <tr><th>หมายเหตุ</th><td>${esc(it.remark || '-')}</td></tr>
          <tr><th>ผู้ยกเลิก</th><td>${esc(it.canceledBy || '-')}</td></tr>
        </tbody>
      </table>
    </div>
  `;
} else {
    // === EQUIPMENT DETAIL ===
    const itemsToShow = this.selectItemsForDetail(group);
    const groupRequester = pick(
      ...(group.items || []).flatMap(x => [
        x.username_form, x.requester, x.userName, x.user_name, x.user
      ])
    );

    const list = (itemsToShow.length ? itemsToShow : group.items);
    const rows = list.map((row, idx) => {
      const requesterCell = pick(row.username_form, row.requester, row.userName, row.user_name, row.user, groupRequester);
      const emailCell = this.emailForRow(row, group);
      return `
        <tr>
          <td>${idx + 1}</td>
          <td class="left">${esc(row.name)}</td>
          <td>${esc(row.quantity ?? '-')}</td>
          <td class="left req">${esc(requesterCell)}</td>
          <td class="left">${mailto(emailCell)}</td>
          <td>${row.since && row.uptodate ? `${fmt(row.since)} - ${fmt(row.uptodate)}` : fmt(row.date)}</td>
          <td>${esc(row.status || '-')}</td>
          <td>${row.returnedAt ? fmt(row.returnedAt) : '-'}</td>
          <td class="left">${esc(row.remark || '-')}</td>
          <td class="left">${reviewerName(row)}</td>
          <td class="left">${handoverName(row)}</td>    <!-- ✅ ผู้ส่งมอบ -->
          <td class="left">${esc(row.returnedBy || '-')}</td>
        </tr>
      `;
    }).join('');

    html = `
      <div class="swal-table-wrap">
        <table class="swal-table">
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>อุปกรณ์</th>
              <th>จำนวน</th>
              <th class="req">ผู้ขอใช้</th>
              <th>อีเมล</th>
              <th>วันที่ขอยืม</th>
              <th>สถานะ</th>
              <th>วันที่คืน</th>
              <th>หมายเหตุ</th>
              <th>ผู้อนุมัติ/ผู้ไม่อนุมัติ</th>
              <th>ผู้ส่งมอบ</th>               <!-- ✅ หัวตารางใหม่ -->
              <th>ผู้รับคืน</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="12" style="text-align:center">ไม่มีรายการ</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  const isField = group.type === 'field';
  Swal.fire({
  title: 'รายละเอียดรายการ',
  html,
  confirmButtonText: 'ปิด',
  confirmButtonColor: '#3085d6',
  // ✅ กว้างขึ้นสำหรับอุปกรณ์
  width: isField
    ? Math.min(window.innerWidth * 0.85, 720) + 'px'
    : Math.min(window.innerWidth * 0.98, 1400) + 'px',
  customClass: {
    // ✅ อุปกรณ์ -> เพิ่มคลาส mfu-swal--equip
    popup: isField ? 'mfu-swal mfu-swal--field' : 'mfu-swal mfu-swal--equip',
    htmlContainer: 'mfu-swal-body'
  }
})
;
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
  const { isConfirmed, value } = await Swal.fire({
    title: "ยืนยันยกเลิกการจองสนาม?",
    text: "คุณต้องการยกเลิกการจองสนามนี้ใช่หรือไม่(จะไม่สามารถย้อนกลับได้)",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
    input: "textarea",                      // << ช่องกรอกหมายเหตุ
    inputLabel: "กรุณากรอกหมายเหตุ (จำเป็น)",
    inputPlaceholder: "กรอกเหตุผล/หมายเหตุในการยกเลิก...",
    inputAttributes: { maxlength: 500, "aria-label": "remark" },
    preConfirm: (val) => {
      const remark = (val || "").trim();
      if (!remark) {
        Swal.showValidationMessage("กรุณากรอกหมายเหตุ");
        return false;
      }
      return remark; // ส่งให้ value
    }
  });

  if (!isConfirmed) return;

  try {
    const adminId = JSON.parse(localStorage.getItem("user"))?.user_id || "";
    const remark = (value || "").trim();   // << รับค่าจาก SweetAlert

    const res = await axios.patch(
      `${API_BASE}/api/history/${item.id}/cancel_field`,
      { admin_id: adminId, remark }        // << ส่ง remark ไปที่ backend
    );

    if (res.data && res.data.status === "cancel") {
      await Swal.fire("สำเร็จ", "ยกเลิกการจองสนามแล้ว", "success");

      // อัปเดตหน้าจอแบบไม่ต้องรีเฟรชทั้งหน้า (ถ้าต้องการ)
      item.status = "cancel";
      item.canceledById = adminId;
      item.canceledAt = new Date().toISOString();
      item.remark = remark;

      // ถ้าต้องการรีโหลดทั้งหน้าเหมือนเดิม ให้ปลดคอมเมนต์บรรทัดล่าง:
      // window.location.reload();
    } else {
      throw new Error("เกิดข้อผิดพลาด");
    }
  } catch (err) {
    Swal.fire("ผิดพลาด", err.message || "ไม่สามารถยกเลิกได้", "error");
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
      // ✅ ตัด return-pending ออก
      .filter(h => String(h.status || '').toLowerCase() !== 'return-pending')
      .map((h, idx) => ({
        id: h._id?.$oid || h._id || idx + 1,
        type: h.type,
        name: h.name,
        time: h.type === "field" ? `${h.startTime} - ${h.endTime}` : "",
        quantity: h.type === "equipment" ? h.quantity : "",
        status: ((h.status || '')).charAt(0).toUpperCase() + ((h.status || '')).slice(1).toLowerCase(),
        approvedBy: h.approvedBy,
        approvedById: h.approvedById,
        disapprovedBy: h.disapprovedBy,
        disapprovedById: h.disapprovedById,
        canceledBy: h.canceledBy,
        canceledById: h.canceledById,
        approvedAt: h.approvedAt,
        disapprovedAt: h.disapprovedAt,
        canceledAt: h.canceledAt,
        createdAt: h.createdAt,
        date: h.date,
        username_form: h.username_form || '-',
        id_form: h.id_form || '',
        proxyStudentId: h.proxyStudentId || '',
        proxyStudentName: h.proxyStudentName || h.proxy_name || h.proxyStudent || h.proxy_user_name || '-',
        proxyStudentId:   h.proxyStudentId   || h.proxy_user_id || h.proxy_id     || '',
      }))

    const getSortDate = (item) =>
      item.canceledAt || item.disapprovedAt || item.approvedAt || item.date || 0

    histories = histories.sort((a, b) => new Date(getSortDate(b)) - new Date(getSortDate(a)))
    this.historys = histories
  } catch (err) {
    this.historys = []
    console.error('โหลดข้อมูลประวัติไม่สำเร็จ:', err)
  }
},

  },
  async mounted() {
  flatpickr.localize(Thai);

  this.fpRange = flatpickr(this.$refs.rangePicker, {
    mode: 'range',
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd/m/Y',
    altInputClass: 'mfu-alt-input',
    allowInput: true,
    disableMobile: true,
    // ถ้ามีค่าอยู่แล้ว ให้ใส่เป็น default
    defaultDate: [this.dateFilterStart, this.dateFilterEnd].filter(Boolean),
    onChange: (selectedDates, dateStr, instance) => {
      const [start, end] = selectedDates;
      this.dateFilterStart = start ? instance.formatDate(start, 'Y-m-d') : '';
      this.dateFilterEnd   = end   ? instance.formatDate(end,   'Y-m-d') : '';
      this.onDateFilterChange();
    },
    // รองรับกรณีพิมพ์เอง เช่น "25/09/2025 - 28/09/2025" แล้วคลิคนอกช่อง
    onClose: (selectedDates, dateStr, instance) => {
      if (!selectedDates.length && instance.altInput?.value) {
        const raw = instance.altInput.value;
        const parts = raw.includes('ถึง') ? raw.split('ถึง')
                    : raw.includes('to')  ? raw.split('to')
                    : raw.split('-');
        const parse = s => instance.parseDate((s || '').trim(), 'd/m/Y');
        const s = parse(parts[0]);
        const e = parse(parts[1]);
        this.dateFilterStart = s ? instance.formatDate(s, 'Y-m-d') : '';
        this.dateFilterEnd   = e ? instance.formatDate(e, 'Y-m-d') : '';
        this.onDateFilterChange();
      }
    }
  });

  // ใส่ placeholder ให้ alt-input (สวยขึ้น)
  if (this.fpRange?.altInput) {
    this.fpRange.altInput.placeholder = 'dd/mm/yyyy - dd/mm/yyyy';
  }
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    document.addEventListener('mousedown', this.handleClickOutside)
    this.lastSeenTimestamp = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0');
    try {
      const usersRes = await axios.get(`${API_BASE}/api/users`)
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : []
      const userIdToName = Object.fromEntries(allUsers.map(u => [u.user_id, u.name]))
      // NEW: แม็พ user_id -> email (รองรับหลาย key ที่ backend อาจตั้งชื่อไม่เหมือนกัน)
const userIdToEmail = Object.fromEntries(
  allUsers.map(u => [u.user_id, u.email || u.mail || u.user_email || u.username || ''])
)
this.userIdToEmail = userIdToEmail

      const historyRes = await axios.get(`${API_BASE}/api/history`)
      let historyArr = historyRes.data
const toArr = (v) => Array.isArray(v) ? v : (v ? [v] : []);
      // ✅ กรองทิ้งทั้ง pending และ return-pending
      historyArr = historyArr.filter(h => {
        const s = String(h.status || '').toLowerCase()
        return s !== 'pending' && s !== 'return-pending'
      })

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
          handoverBy:  userIdToName[h.handoverById] || h.handoverBy || h.handoverById || '',
          handoverById: h.handoverById,
          zone: this.pickNonEmpty(h.zone, h.field_zone, h.room_zone, h.fieldZone) || '-',
          returnedAt: h.returnedAt,
          remark: h.remark,
          approvedAt: h.approvedAt,
          disapprovedAt: h.disapprovedAt || null,
          createdAt: h.createdAt,
          booking_id: h.booking_id,
          fileName: Array.isArray(h.fileName) ? h.fileName : (h.fileName ? [h.fileName] : []),
          attachment: Array.isArray(h.attachment) ? h.attachment : (h.attachment ? [h.attachment] : []),
          returnPhoto: [
  ...toArr(h.returnPhoto),
  ...toArr(h.return_photo),
  ...toArr(h.returnImage),
  ...toArr(h.return_images),
  ...toArr(h.return_img),
].filter(Boolean),
          fileType: Array.isArray(h.fileType) ? h.fileType : (h.fileType ? [h.fileType] : []),
          since: h.since,
          uptodate: h.uptodate,
          canceledBy: h.canceledBy || userIdToName[h.canceledById] || h.canceledById || '-',
          canceledById: h.canceledById,
          canceledAt: h.canceledAt,
          username_form: h.username_form || '-',
          id_form: h.id_form || '',
          proxyStudentId: h.proxyStudentId || '',
          proxyStudentName: h.proxyStudentName || h.proxy_name || h.proxyStudent || h.proxy_user_name || '-',
          proxyStudentId:   h.proxyStudentId   || h.proxy_user_id || h.proxy_id     || '',
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
  window.removeEventListener('resize', this.handleResize)

  if (this.fpRange) { this.fpRange.destroy(); this.fpRange = null }
},


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
   overflow-x: visible; 
}

.histbody{ overflow-x: visible !important; }

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
  width: 98.5%;
  background: #f7fafc;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(54, 88, 167, 0.12);
  padding: 10px 10px 10px 10px;
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
/* คอนเทนเนอร์กลางหน้า จำกัดความกว้างรวมทั้งฟิลเตอร์และตาราง */
.content-wrap{
  --gutter: 12px;
  max-width: 1290px;
  margin: 0 auto;
  padding: 0 var(--gutter);
  box-sizing: border-box;
}
.date-filter-row{
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin: 12px 0;           /* เอา margin-right:18px เดิมออก */
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


/* ===== Table look & feel (matching "history" page) ===== */



.history-table{
  width: 100% !important;                /* <-- แทนที่ calc(100% + var(--gutter)) */
  margin: 0;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  background-color: white;
}

.history-table th,
.history-table td {
  border-bottom: 1px solid #ddd;
  padding: 10px;
  font-size: 0.95rem;
  text-align: center;
  vertical-align: middle;
}

.history-table th {
  background-color: #1e3a8a;
  color: #fff;
}

.history-table tbody tr:hover {
  background-color: #f0f4ff;
}

.history-table td.col-center {
  text-align: center;
}

@media (max-width: 540px) {
  .history-table {
    min-width: 1500px; /* บังคับให้เลื่อนแนวนอนได้บนจอเล็ก */
    white-space: nowrap;
  }
}

.notification-dropdown { position: absolute; right: 0; top: 38px; background: #fff; border-radius: 18px 0 18px 18px; box-shadow: 0 8px 24px 0 rgba(27, 50, 98, 0.14), 0 2px 4px 0 rgba(33, 125, 215, 0.06); min-width: 330px; max-width: 370px; max-height: 420px; overflow-y: auto; z-index: 1002; padding: 0; border: none; animation: fadeDown 0.22s; }


/* ==== SweetAlert ตาราง (global) ==== */

/* -- เดิมมี .date-filter-row button {...} ให้แก้เป็นไม่กินปุ่ม clear -- */
.date-filter-row button:not(.clear-btn) {
  border-radius: 6px;
  border: none;
  padding: 5px 13px;
  background: #1d4ed8;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.16s;
}
.date-filter-row button:not(.clear-btn):hover { background: #25396f; }

/* -- ขนาดช่องวันที่ (flatpickr ใช้ alt input) --
   ใส่ไว้ใน <style scoped> และใช้ :deep() ให้เจาะถึง input ที่ flatpickr สร้างขึ้น */
/* ===== Range picker: กรอบบาง โค้งนิด ๆ แบบรูปที่สอง ===== */
.date-filter-row :deep(.mfu-alt-input) {
  box-sizing: border-box;
  width: 100px;
  min-width: 220px;
  max-width: 300px;
  height: 34px;
  padding: 6px 12px;

  /* กรอบอย่างเดียว */
  border: 1.6px solid #a5b4fc;           /* โทนม่วงอ่อนเดิม */
  border-radius: 10px;

  outline: none;
  box-shadow: none;                      /* ปิดเงาเริ่มต้น */
  font-size: 1em;
  line-height: 1.2;
  text-align: center;                      /* ถ้าชอบกลาง ให้เป็น center */
}

/* วงโฟกัสสีฟ้าอ่อน เมื่อคลิก */
.date-filter-row :deep(.mfu-alt-input:focus) {
  border-color: #93a2fb;
  box-shadow: 0 0 0 3px rgba(147,162,251,.35);
}

/* สี placeholder ให้อ่านง่าย */
.date-filter-row :deep(.mfu-alt-input::placeholder) {
  color: #9aa3b1;
  opacity: 1;
}

/* (กัน Flatpickr ตัวจริงโผล่) */
.date-filter-row :deep(.flatpickr-input) {
  display: none !important;
}

.date-filter-row :deep(.flatpickr-alt-input){ text-align: center; }


/* -- สีปุ่ม clear ให้เหมือนสีกรอบ -- */
.date-filter-row .clear-btn{
  height: 32px;
  padding: 0 12px;
  background: #a5b4fc !important;   /* โทนม่วงเดิม */
  border: 1px solid #a5b4fc !important;
  color: #fff;
  font-weight: 600;
  border-radius: 7px;
  cursor: pointer;
}
.date-filter-row .clear-btn:hover{
  background: #93a2fb !important;
  border-color: #93a2fb !important;
}

/* กฎนี้ (input[type="date"]) ไม่ได้มีผลกับ flatpickr แล้ว จะลบทิ้งก็ได้ */
.history-table th.name-col,
.history-table td.name-col {
  width: 20%;              /* ปรับเปอร์เซ็นต์ได้ตามต้องการ */
}

.history-table td.name-col {
  text-align: start;             /* ปรับเปอร์เซ็นต์ได้ตามต้องการ */
}

/* กันข้อความยาวชนคอลัมน์ข้าง ๆ */
.history-table th,
.history-table td {
  overflow-wrap: anywhere; /* ตัดคำไทย/อังกฤษยาว ๆ ได้ */
  word-break: break-word;
}

/* กล่องข้อความในคอลัมน์ Name: ให้ตัดเกินเป็น … และไม่ล้นกรอบ */
.history-table .name-col .name-text {
  display: block;
  max-width: 100%;
  white-space: nowrap;      /* ถ้าอยากให้ขึ้นบรรทัดเดียว */
  overflow: hidden;
  text-overflow: ellipsis;  /* โชว์ … เมื่อเกินกรอบ */
}

.hist-file-subtitle{
  margin: 6px 0 8px 0;
  color: #25396f;
  font-size: 1.05rem;
}

.equip-names{
  margin: 2px 0 8px 0;
  color: #526683;
  font-size: 0.95rem;
}
.section-block + .section-block{
  margin-top: 14px;
}
/* ให้ section ย่อยจัดวางเป็นคอลัมน์และเว้นช่องว่างเท่ากับกล่องหลัก */
.section-block{
  display: flex;
  flex-direction: column;
  gap: 0.7em;   /* << เท่ากับ .hist-file-detail-box */
}

/* ตัด margin ล่างของหัวข้อ ไม่ให้บวกเพิ่มกับ gap */
.hist-file-detail-box > .hist-file-header,
.section-block .hist-file-header{
  margin-bottom: 0;
}
.mailto-link {
  text-decoration: underline;
}
/* ให้คอนเทนเนอร์กำหนดขอบซ้ายขวาเดียวกับแถวฟิลเตอร์ */


/* กล่องครอบตารางไม่ต้องมีช่องว่างเพิ่ม */
.table-x-scroll{
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 !important;                 /* <-- แทนที่ margin-right: calc(-1*var(--gutter)) */
  padding: 0;                            /* ไม่มี padding เพิ่ม */
}


/* ให้ตารางกินเต็มความกว้างคอนเทนเนอร์ (ชิดขวาเท่าปุ่ม clear) */


/* padding cell เหมือนเดิมได้ */
.history-table th,
.history-table td{
  padding: 10px;
}

/* (ตัวเลือก) ถ้ายังเหลือระยะ 1px จากเส้นขวา ให้ชดเชยเงาหรือเส้นขอบ */


</style>


<style>
@import '../css/style.css';

.swal2-container{
  z-index: 2000 !important;
}

/* ขนาด popup ตามเดิม แต่กันชิดขอบเกินไป */
.mfu-swal.swal2-popup{
  width: min(1360px, 96vw) !important;
}

/* ให้ภายในเลื่อนแนวนอนได้ถ้าตารางกว้าง */
.mfu-swal .swal-table-wrap{
  max-width: calc(96vw - 40px);  /* เผื่อ padding เล็กน้อย */
  max-height: 70vh;              /* เลื่อนแนวตั้งได้อยู่แล้ว */
  overflow-x: auto;              /* ✅ ป้องกันล้นแนวนอน */
  overflow-y: auto;
}

/* บังคับตารางไม่ดัน popup ล้น */
.mfu-swal .swal-table{
  width: 100%;
  min-width: 760px;              /* เอาอ่านง่ายไว้ก่อน */
  table-layout: fixed;           /* แจกจ่ายความกว้างคอลัมน์เท่าๆกัน */
}

/* อนุญาตให้ตัดคำ/ขึ้นบรรทัดใหม่ ไม่บีบจนยาวล้น */
.mfu-swal .swal-table th,
.mfu-swal .swal-table td{
  white-space: normal;           /* เดิมคุณตั้ง nowrap → ทำให้ล้น */
  word-break: break-word;
  font-size: 0.95rem;
}

/* (ทางเลือก) บีบคอลัมน์ที่มักยาวให้พอดีสายตา */
.mfu-swal .swal-table th:nth-child(7),
.mfu-swal .swal-table td:nth-child(7) {
  text-align: center !important;
}
.mfu-swal .swal-table th:nth-child(8),
.mfu-swal .swal-table td:nth-child(8){ /* หมายเหตุ (equipment) */
  width: 24ch;
}

/* ตาราง 2 คอลัมน์ของ type=field */
.mfu-swal .swal-table-2col {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}
.mfu-swal .swal-table-2col th {
  text-align: left;
  width: 35%;
  padding: 8px 12px;
  background: #f0f4ff;
  color: #213555;
  font-weight: 600;
  border-bottom: 1px solid #ddd;
  vertical-align: top;
}
.mfu-swal .swal-table-2col td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid #ddd;
}

/* จัดกึ่งกลางเฉพาะคอลัมน์: ลำดับ(1), จำนวน(3), วันที่ขอยืม(6), วันที่คืน(8) */
.mfu-swal .swal-table th:nth-child(1),
.mfu-swal .swal-table td:nth-child(1),
.mfu-swal .swal-table th:nth-child(3),
.mfu-swal .swal-table td:nth-child(3),
.mfu-swal .swal-table th:nth-child(6),
.mfu-swal .swal-table td:nth-child(6),
.mfu-swal .swal-table th:nth-child(8),
.mfu-swal .swal-table td:nth-child(8) {
  text-align: center;

}



/* เดิม: ใช้กับทุกป๊อปอัป */
.mfu-swal.swal2-popup{
  width: min(1360px, 96vw) !important;
}

/* ใหม่: แคบเฉพาะป๊อปอัปรายละเอียด type=field */
.swal2-container .mfu-swal--field.swal2-popup{
  width: min(84vw, 720px) !important;  /* ปรับ 720 → 680/760 ได้ตามต้องการ */
  padding: 18px 22px !important;       /* (ทางเลือก) ให้ดูคอมแพคขึ้น */
}

@media (max-width: 540px){
  .swal2-container .mfu-swal--field.swal2-popup{
    width: 95vw !important;            /* มือถือยังเต็มตา */
  }
}
/* ==== Equipment detail popup: bigger & taller ==== */

/* ✅ กว้างขึ้น: อนุญาตได้ถึง ~1600px หรือ 98vw */
.swal2-container .mfu-swal--equip.swal2-popup{
  width: min(1580px, 98vw) !important;
  padding: 18px 22px !important;   /* ให้ดูโปร่งขึ้นนิดหน่อย */
}

/* ✅ สูงขึ้น: พื้นที่เนื้อหาเลื่อนแนวตั้งได้มากขึ้น */
.mfu-swal--equip .swal-table-wrap{
  max-width: calc(98vw - 40px);    /* เดิม 96vw → 98vw */
  max-height: 82vh;                /* เดิม 70vh → 82vh */
  overflow-x: auto;
  overflow-y: auto;
}

/* (ทางเลือก) ตารางขั้นต่ำกว้างขึ้นเวลาข้อมูลแน่น ๆ */
.mfu-swal--equip .swal-table{
  min-width: 880px;
}

@media (max-width: 540px){
  /* มือถือยังให้เต็มตา แต่ไม่ล้นเกิน */
  .swal2-container .mfu-swal--equip.swal2-popup{
    width: 96vw !important;
  }
  .mfu-swal--equip .swal-table-wrap{
    max-width: 95vw;
    max-height: 86vh;
  }
}

</style>
