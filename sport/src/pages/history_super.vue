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
              <td>{{ formatDate(group[0].returnedAt || group[0].approvedAt || group[0].date) }}</td>

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
        <div style="text-align:center;padding:24px">ไม่มีรายการที่คุณอนุมัติ</div>
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

<script>
import axios from 'axios'
import Swal from 'sweetalert2'

const API_BASE = import.meta.env.VITE_API_BASE

export default {
  data() {
    return {
      histories: [],
      isSidebarClosed: false,
      announcement: "",
      showAnnouncementBar: false,
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
      filterStatus: '',
      isMobile: window.innerWidth <= 600,
      lastSeenTimestamp: 0,
      currentPage: 1,
      itemsPerPage: 5,
    }
  },

  computed: {
    // === จัดกลุ่มรายการที่ "ฉันเป็นคนอนุมัติ" ===
    groupedHistories() {
      const groups = {}
      const returnedBookingIds = new Set()

      this.histories.forEach(item => {
        const t  = String(item.type || '').toLowerCase()
        const st = String(item.status || '').toLowerCase()

        // สำหรับอุปกรณ์: ตัด return-pending ออก
        if (t === 'equipment' && st === 'return-pending') return

        // key กลุ่ม
        let key
        if (t === 'equipment') {
          key = item.booking_id || `equip_${item.id}`
          if (st === 'returned') returnedBookingIds.add(key)
        } else {
          // field ให้เป็นกลุ่มเดี่ยว
          key = `field_${item.id || item.booking_id || Math.random()}`
        }

        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      })

      let arr = Object.values(groups)
        .filter(g => g.length > 0)
        .sort((a, b) => {
          const da = new Date(a[0].returnedAt || a[0].approvedAt || a[0].date)
          const db = new Date(b[0].returnedAt || b[0].approvedAt || b[0].date)
          return db - da
        })

      // กรองเฉพาะสถานะที่อนุญาต
      const allow = new Set(['approved', 'returned'])
      arr = arr.filter(group => allow.has(String(group[0].status || '').toLowerCase()))

      // ถ้าผู้ใช้กด filterStatus (ถ้ามี)
      if (this.filterStatus) {
        arr = arr.filter(group => {
          const status = (group[0].status || '').toLowerCase()
          if (this.filterStatus === 'approved' &&
              returnedBookingIds.has(group[0].booking_id || '')) {
            return false
          }
          return status === this.filterStatus
        })
      }

      return arr
    },

    totalPages() {
      return Math.ceil(this.groupedHistories.length / this.itemsPerPage) || 1
    },

    paginatedHistories() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end   = start + this.itemsPerPage
      return this.groupedHistories.slice(start, end)
    },
  },

  methods: {

    // เมตาจากเลขานุการครบหรือไม่
hasSecretaryMeta(h) {
  const hasBy   = typeof h?.approvedBy === 'string'
    ? h.approvedBy.trim() !== ''
    : !!h?.approvedBy;

  const hasById = typeof h?.approvedById === 'string'
    ? h.approvedById.trim() !== ''
    : !!h?.approvedById;

  const hasAt   = !!h?.approvedAt;
  return hasBy && hasById && hasAt;
},
// เงื่อนไขที่หัวหน้าต้องอนุมัติ
isSuperPending(h) {
  return String(h?.type || '').toLowerCase() === 'field'
      && String(h?.status || '').toLowerCase() === 'pending'
      && this.hasSecretaryMeta(h);
},
// เวลาแบบไทย
formatTimeTH(t) {
  if (!t) return '-';
  const s = String(t).trim().replace(/\s*น\.?$/i,'');
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) return `${m[1].padStart(2,'0')}:${m[2]} น.`;
  const dt = new Date(`1970-01-01T${s}`);
  if (!isNaN(dt)) {
    const hhmm = dt.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',hour12:false});
    return `${hhmm} น.`;
  }
  return `${s} น.`;
},
formatTimeRangeTH(a,b) {
  const A = this.formatTimeTH(a), B = this.formatTimeTH(b);
  if (A === '-' && B === '-') return '-';
  if (A !== '-' && B !== '-') return `${A} - ${B}`;
  return A !== '-' ? A : B;
},


    getTimeRange(group) {
  // ใช้รายการตัวแรกของกลุ่มเป็นตัวแทน
  const head  = (group && group[0]) || {};
  const start = head.startTime || head.start_time || head.start || '';
  const end   = head.endTime   || head.end_time   || head.end   || '';

  // แปลงเป็น HH:mm (ตัดวินาทีและ zero-pad ชั่วโมงถ้าจำเป็น)
  const toHHMM = (v) => {
    const s = String(v || '').trim();
    const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
    return s;
  };

  const s = start ? toHHMM(start) : '';
  const e = end   ? toHHMM(end)   : '';

  if (s && e) return `${s} น. - ${e} น.`; // ใส่ "น." ทั้งหน้า-หลัง
  if (s)      return `${s} น.`;           // มีแค่เวลาเริ่ม
  if (e)      return `${e} น.`;           // มีแค่เวลาสิ้นสุด
  return '-';
},






    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed
    },

    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
      if (this.showNotifications) {
        this.lastSeenTimestamp = Date.now();
        localStorage.setItem('staff_lastSeenTimestamp', String(this.lastSeenTimestamp));
        this.unreadCount = 0;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++
    },
    prevPage() {
      if (this.currentPage > 1) this.currentPage--
    },

    getDisplayItems(group) {
      const cleaned = group.filter(it => (it.status || '').toLowerCase() !== 'return-pending')
      const returnedOnly = cleaned.filter(it => (it.status || '').toLowerCase() === 'returned')
      return returnedOnly.length ? returnedOnly : cleaned
    },

    pruneOldNotifications() {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
    },

    toggleFilter(status) {
      this.filterStatus = this.filterStatus === status ? '' : status
    },
    clearFilter() {
      this.filterStatus = ''
    },
    checkMobile() {
      this.isMobile = window.innerWidth <= 600
      if (this.isMobile) this.isSidebarClosed = true
    },
    closeNotifications() {
      this.showNotifications = false
    },

    formatDate(dateStr) {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })
    },

    async fetchNotifications() {
  try {
    // ตัดแจ้งเตือนเก่ากว่า 7 วันทิ้ง
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.notifications = (this.notifications || []).filter(n => (n?.timestamp ?? 0) >= cutoff);

    // ดึงข้อมูลเดียวกับหน้าที่แล้ว
    const res = await axios.get(`${API_BASE}/api/history/approve_field`);
    const raw = Array.isArray(res.data) ? res.data : [];

    // สนามที่ pending และมีเมตาเลขานุการครบ
    const pendings = raw.filter(h => this.isSuperPending(h));

    // สร้างข้อความแจ้งเตือน
    const toTs = (v) => {
      if (!v) return 0;
      const s = String(v).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y,m,d] = s.split('-').map(Number);
        return new Date(y, m - 1, d).getTime() || 0;
      }
      const t = new Date(s).getTime();
      return isNaN(t) ? 0 : t;
    };

    const notis = pendings.map(h => {
      const id  = h._id?.$oid || h._id || h.booking_id || Math.random().toString(36).slice(2);
      const ts  = toTs(h.updatedAt) || toTs(h.createdAt) || toTs(h.date) || Date.now();
      const zone = h.zone && h.zone !== '-' ? ` (โซน: ${h.zone})` : '';
      const day  = h.since ? this.formatDate(h.since) : (h.date ? this.formatDate(h.date) : '-');
      const time = this.formatTimeRangeTH(h.startTime, h.endTime);
      let msg = `สนาม '${h.name || '-'}'${zone} รออนุมัติ`;
      
      return { id: `field_${id}`, type: 'field', timestamp: ts, message: msg };
    });

    // unique ตาม id + เรียงล่าสุดก่อน
    const seen = new Set();
    const unique = [];
    for (const n of notis) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      unique.push(n);
    }
    unique.sort((a,b) => b.timestamp - a.timestamp);

    this.notifications = unique;
    // badge = จำนวนที่ใหม่กว่าครั้งล่าสุดที่เปิด dropdown
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch (_) {
    // ไม่ต้องเด้ง error
  }
},


    // ================== รายละเอียด (รองรับทั้ง equipment/field) ==================
    detailGroup(group) {
  const head = group[0] || {};
  const type = String(head.type || '').toLowerCase();

  // ---------- helpers ----------
  const esc = (s) => String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>');

  const fmtDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? '-' : dt.toLocaleDateString('th-TH', {year:'numeric',month:'2-digit',day:'2-digit'});
  };

  const statusTitle = (s='') => this.statusTitle(s);

  // แปลง path เป็น URL ที่เปิดได้ (อิง API_BASE ถ้าเป็น relative path)
  const toUrl = (val) => {
    if (!val) return null;
    const s = String(val);
    if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:')) return s;
    if (s.startsWith('/')) return s;
    try {
      const base = (API_BASE || '').replace(/\/+$/,'');
      return base ? `${base}/${s.replace(/^\/+/, '')}` : s;
    } catch { return s; }
  };

  // ====== EQUIPMENT ======
  if (type === 'equipment') {
    const cleaned = group.filter(it => (String(it.status || '').toLowerCase() !== 'return-pending'));
    const returnedOnly = cleaned.filter(it => (String(it.status || '').toLowerCase() === 'returned'));
    const itemsToShow = returnedOnly.length ? returnedOnly : cleaned;

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
      );

      const photoCell = imgUrl
        ? `<img src="${imgUrl}" class="swal-thumb" alt="แนบรูป"
               onclick="window.__showFullReturnPhoto && window.__showFullReturnPhoto('${imgUrl}')">
           <div class="swal-thumb-hint">(คลิกรูปเพื่อดูเต็ม)</div>`
        : '-';

      return `
        <tr>
          <td style="text-align:center">${idx + 1}</td>
          <td class="nowrap">${esc(item.name)}</td>
          <td style="text-align:center">${esc(item.quantity)}</td>
          <td>${esc(item.requester || '-')}</td>
          <td>${esc(item.user_id || '-')}</td>
          <td>${esc(fmtDate(item.date))}</td>
          <td>${esc(statusTitle(item.status))}</td>
          <td>${esc(item.returnedAt ? fmtDate(item.returnedAt) : '-')}</td>
          <td style="text-align:center">${photoCell}</td>
          <td>${esc(item.remark || '-')}</td>
        </tr>`;
    }).join('');

    const html = `
      <div class="swal-table-wrap">
        <table class="swal-table">
          <thead>
            <tr>
              <th style="width:56px;text-align:center">ลำดับ</th>
              <th>อุปกรณ์</th>
              <th style="width:90px;text-align:center">จำนวน</th>
              <th style="width:160px">ผู้ขอใช้</th>
              <th style="width:160px">รหัสนักศึกษา/พนักงาน</th>
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
    `;

    const GAP  = 24;
    const MAXW = 1400;
    const popupW = Math.min(Math.max(window.innerWidth - GAP*2, 360), MAXW);

    Swal.fire({
      title: 'รายละเอียดรายการ',
      html,
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#3085d6',
      width: popupW + 'px',
      customClass: {
        container: 'mfu-swal-center',
        popup: 'mfu-swal',
        htmlContainer: 'mfu-swal-body'
      },
      didOpen: () => {
        window.__showFullReturnPhoto = (img) => {
          const w = window.open("", "_blank");
          w.document.write(`
            <html><head><title>รูปแนบ</title>
              <style>
                *{box-sizing:border-box}
                body{background:#111;margin:0;display:flex;align-items:center;justify-content:center;height:100vh}
                img{max-width:100vw;max-height:100vh;object-fit:contain;border-radius:16px;box-shadow:0 8px 30px #0008}
              </style>
            </head><body onclick="window.close()"><img src="${img}"></body></html>
          `);
        };
      },
      willClose: () => { window.__showFullReturnPhoto = undefined; }
    });

    return;
  }

  // ====== FIELD ======
  const f = head;
  const timeRange = this.getTimeRange([f]); // ได้รูปแบบ "HH:mm - HH:mm น."

  const html = `
    <div class="swal-table-wrap">
      <table class="swal-table">
        <tbody>
          <tr><th style="width:220px;text-align:left">กิจกรรม/โครงการ</th><td>${esc(f.name_active || '-')}</td></tr>
          <tr><th style="text-align:left">สนาม/อาคาร</th><td>${esc(f.name || '-')}</td></tr>
          <tr><th style="text-align:left">โซน</th><td>${esc(f.zone || '-')}</td></tr>
          <tr><th style="text-align:left">ผู้ขอใช้</th><td>${esc(f.requester || '-')}</td></tr>
          <tr><th style="text-align:left">รหัสนักศึกษา/พนักงาน</th><td>${esc(f.user_id || '-')}</td></tr>
          <tr><th style="text-align:left">วันที่ใช้</th><td>${esc(fmtDate(f.date || f.since))}</td></tr>
          <tr><th style="text-align:left">เวลา</th><td>${esc(timeRange)}</td></tr>
          <tr><th style="text-align:left">สถานะ</th><td>${esc(statusTitle(f.status))}</td></tr>
          <tr><th style="text-align:left">หมายเหตุ</th><td>${esc(f.remark || '-')}</td></tr>
        </tbody>
      </table>
    </div>
  `;

  Swal.fire({
    title: 'รายละเอียดรายการ (สนาม/สถานที่)',
    html,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3085d6',
    width: '900px',
    customClass: {
      container: 'mfu-swal-center',
      popup: 'mfu-swal',
      htmlContainer: 'mfu-swal-body'
    },
  });
},


    // ===== helper แสดงสถานะ / รวมชื่อ / รวมจำนวน =====
    statusTitle(s='') {
      const m = String(s).toLowerCase();
      if (m === 'approved') return 'ถูกอนุมัติ';
      if (m === 'returned') return 'รับคืนอุปกรณ์แล้ว';
      if (m === 'disapproved') return 'ไม่ถูกอนุมัติ';
      if (m === 'pending') return 'รอดำเนินการ';
      if (m === 'return-pending') return 'รอรับคืน';
      return s || '-';
    },
    statusClass(s='') {
      const m = String(s).toLowerCase();
      return {
        'status-approved': m === 'approved',
        'status-returned': m === 'returned',
        'status-disapproved': m === 'disapproved',
        'status-pending': m === 'pending',
        'status-return-pending': m === 'return-pending',
      };
    },
    joinItemNames(group) {
      return group.map(i => i.name).filter(Boolean).join(', ');
    },
    calcQty(group) {
      return group.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    },
  },

  async mounted() {
    try {
      // ใช้ super_id เป็นหลัก (ถ้าไม่มีค่อยถอยไปตัวอื่น)
      const myId = String(
        localStorage.getItem('super_id') ||
        localStorage.getItem('admin_id') ||
        localStorage.getItem('user_id') ||
        ''
      ).trim();

      const res = await axios.get(`${API_BASE}/api/history`);
      const data = Array.isArray(res.data) ? res.data : [];

      // allow:
      // - equipment: approved / returned
      // - field:     approved
      const allowEquip = new Set(['approved','returned']);
      const allowField = new Set(['approved']);

      this.histories = data
        .filter(h => {
          const t = String(h.type || '').toLowerCase();
          const status = String(h.status || '').toLowerCase();

          // normalize approvedById -> string
          const approverId =
            (h.approvedById && h.approvedById.$oid) ? h.approvedById.$oid :
            (h.approvedById != null ? String(h.approvedById) : '');

          const isMine = approverId && myId && approverId.trim() === myId;
          if (!isMine) return false;

          if (t === 'equipment') return allowEquip.has(status);
          if (t === 'field')     return allowField.has(status);
          return false;
        })
        .sort((a, b) => new Date(b.date || b.approvedAt || b.returnedAt || 0) -
                        new Date(a.date || a.approvedAt || a.returnedAt || 0))
        .map((h, idx) => ({
          id: h._id?.$oid || h._id || idx + 1,
          name: h.name,
          name_active: h.name_active,
          zone: h.zone,
          quantity: h.quantity,
          status: h.status,
          approvedBy: h.approvedBy,
          approvedAt: h.approvedAt,
          disapprovedBy: h.disapprovedBy,
          disapprovedById: h.disapprovedById,
          returnedBy: h.returnedBy,
          returnedAt: h.returnedAt,
          returnedById: h.returnedById,
          type: h.type,
          remark: h.remark,
          requester: h.requester,
          date: h.date,
          startTime: h.startTime,
          endTime: h.endTime,
          booking_id: h.booking_id || null,
          disapprovedAt: h.disapprovedAt || null,
          user_id: h.user_id || '-',
          attachment:
            h.attachment ||
            h.returnAttachment ||
            h.return_photo ||
            h.returnImage ||
            (Array.isArray(h.attachments) ? h.attachments[0] : null) ||
            (Array.isArray(h.images) ? h.images[0] : null) ||
            h.image ||
            h.photo ||
            null,
        }))

      // ช่วยดีบัก (เปิด DevTools Console ดู)
      console.debug('[history_super] myId =', myId, 'all =', data.length, 'mine =', this.histories.length);
    } catch (err) {
      this.histories = []
      console.error('โหลดข้อมูล history super ไม่สำเร็จ:', err)
    }

    try {
      const annRes = await axios.get(`${API_BASE}/api/announcement`)
      this.announcement = annRes.data?.announce || ""
      this.showAnnouncementBar = !!this.announcement
    } catch (err) {
      this.announcement = ""
      this.showAnnouncementBar = false
    }

    this.lastSeenTimestamp = parseInt(localStorage.getItem('staff_lastSeenTimestamp') || '0');

    await this.fetchNotifications()
    this.polling = setInterval(this.fetchNotifications, 30000)
    window.addEventListener('resize', this.checkMobile)
  },

  beforeUnmount() {
    clearInterval(this.polling)
    window.removeEventListener('resize', this.checkMobile)
  },

  watch: {
    filterStatus() {
      this.currentPage = 1
    },
    groupedHistories() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages
      }
    }
  },
}
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
</style>

<style>
@import '../css/style.css';

/* === SweetAlert (global) === */
.mfu-swal{ max-width: none !important; width: 100% !important; font-size: 1rem; }
.mfu-swal-body{ text-align: left; }
.swal2-container.mfu-swal-center{ display:flex !important; align-items:center !important; justify-content:center !important; padding:0 !important; }
.swal2-container.mfu-swal-center .swal2-popup{ margin:0 !important; }
.mfu-swal .swal-table-wrap{ max-height: 70vh; overflow: auto; }
.mfu-swal .swal-table{ width: 100%; min-width: 0; table-layout: auto; }
.mfu-swal .swal-table th:nth-child(2),
.mfu-swal .swal-table td:nth-child(2),
.mfu-swal .swal-table .nowrap{ white-space: nowrap; word-break: keep-all; }
@media (max-width: 1280px){
  .mfu-swal .swal-table th, .mfu-swal .swal-table td{ padding: 8px 10px; }
}
</style>