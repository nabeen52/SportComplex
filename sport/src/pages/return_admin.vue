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

    <div v-if="isMobile && !isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>

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
                <li v-for="(noti, idx) in notifications.slice(0, 10)" :key="noti.id || idx"
                    :class="['notification-item', noti.type || '', { unread: noti.timestamp > lastSeenTimestamp }]">
                  {{ noti.message }}
                </li>
                <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
              </ul>
            </div>
          </div>
          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- Body -->
      <div class="histbody">
        <h1 style="display: flex; justify-content: center;">Return Pending Equipment</h1>

        <div class="table-container">
          <table class="approve-table">
            <thead>
              <tr>
                <th>Equipment Name</th>
                <th>Amount</th>
                <th>Actions</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in equipmentGroups" :key="group.booking_id || 'noid_' + group.items[0].id">
                <td style="text-align:center;">
                  {{ group.items.map(i => i.name).join(', ') }}
                </td>
                <td>
                  {{ group.items.reduce((sum, i) => sum + i.amount, 0) }}
                </td>
                <td>
                  <button class="return-btn" @click="returnGroup(group)">Return</button>
                </td>
                <td>
                  <button class="detail-btn" @click="detailGroup(group)">รายละเอียด</button>
                </td>
              </tr>
              <tr v-if="equipmentGroups.length === 0">
                <td colspan="4" style="color:#999; text-align:center;">
                  ไม่พบรายการยืมที่รอคืน
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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

<script>
import Swal from 'sweetalert2'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'

export default {
  data() {
    return {
      isSidebarClosed: false,
      equipments: [],
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
      isMobile: window.innerWidth <= 600,
      lastSeenTimestamp: 0,
      userMap: {},        // << เพิ่มสำหรับชื่อผู้ใช้
    }
  },
  computed: {
    equipmentGroups() {
      const map = {};
      this.equipments.forEach(e => {
        const key = e.booking_id || `noid_${e.id}`;
        if (!map[key]) map[key] = { booking_id: e.booking_id, items: [] };
        map[key].items.push(e);
      });
      return Object.values(map);
    }
  },
  async mounted() {
    this.lastSeenTimestamp = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0');

    await Promise.all([this.fetchEquipments(), this.fetchNotifications()]);

    this.polling = setInterval(async () => {
      await this.fetchEquipments();
      await this.fetchNotifications();
    }, 20000);

    document.addEventListener('mousedown', this.handleClickOutside);
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  },
  beforeUnmount() {
    clearInterval(this.polling);
    document.removeEventListener('mousedown', this.handleClickOutside);
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    // ---------- Utilities (เหมือน approve_field.vue) ----------
    parseToDate(d) {
      if (!d) return null;
      const s = String(d).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, dd] = s.split('-').map(Number);
        return new Date(y, m - 1, dd);
      }
      const dt = new Date(s);
      return isNaN(dt) ? null : dt;
    },
    formatDate(dateInput) {
      const d = this.parseToDate(dateInput);
      if (!d) return '-';
      return d.toLocaleDateString('th-TH-u-nu-latn', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    formatTimeTH(t) {
      if (!t) return '-';
      const s = String(t).trim().replace(/\s*น\.?$/i, '');
      const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (m) {
        const hh = m[1].padStart(2, '0'), mm = m[2];
        return `${hh}:${mm} น.`;
      }
      const dt = new Date(`1970-01-01T${s}`);
      if (!isNaN(dt)) {
        const hhmm = dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${hhmm} น.`;
      }
      return `${s} น.`;
    },
    formatTimeRangeTH(a, b) {
      const A = this.formatTimeTH(a), B = this.formatTimeTH(b);
      if (A === '-' && B === '-') return '-';
      if (A !== '-' && B !== '-') return `${A} - ${B}`;
      return A !== '-' ? A : B;
    },
    isSameDay(a, b) {
      const A = this.parseToDate(a), B = this.parseToDate(b);
      if (!A || !B) return true;
      return A.getFullYear() === B.getFullYear() && A.getMonth() === B.getMonth() && A.getDate() === B.getDate();
    },
    isMultiDayEquipment(item) {
      const A = this.parseToDate(item?.since);
      const B = this.parseToDate(item?.uptodate);
      if (!A || !B) return false;
      return !this.isSameDay(A, B);
    },
    normalizePdfUrl(raw) {
      if (!raw) return null;
      let u = String(raw).trim();
      if (u.startsWith('/')) u = new URL(u, window.location.origin).href;
      return u;
    },
    pickPdfUrl(list) {
      if (!Array.isArray(list) || list.length === 0) return null;
      const direct = list.find(h => h?.bookingPdfUrl || h?.booking_pdf_url);
      if (direct) return direct.bookingPdfUrl || direct.booking_pdf_url;
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

    // ---------- Notifications / layout ----------
    toggleSidebar() { this.isSidebarClosed = !this.isSidebarClosed },
    handleResize() {
      this.isMobile = window.innerWidth <= 600;
      if (!this.isMobile) this.isSidebarClosed = false;
    },
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
      if (this.showNotifications) {
        this.lastSeenTimestamp = Date.now();
        localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(this.lastSeenTimestamp));
        this.unreadCount = 0;
      }
    },
    closeNotifications() { this.showNotifications = false; },
    pruneOldNotifications() {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
    },
    handleClickOutside(event) {
      const notifDropdown = document.querySelector('.notification-dropdown');
      const notifBtn = document.querySelector('.notification-btn');
      if (notifDropdown && !notifDropdown.contains(event.target) && notifBtn && !notifBtn.contains(event.target)) {
        this.closeNotifications();
      }
    },

    // ---------- Fetch ----------
    async ensureUsersLoaded() {
      if (Object.keys(this.userMap || {}).length) return;
      try {
        const userRes = await axios.get(`${API_BASE}/api/users`);
        this.userMap = {};
        userRes.data.forEach(u => {
          this.userMap[u.user_id] =
            (u.firstname && u.lastname) ? `${u.firstname} ${u.lastname}` : (u.name || u.user_id);
        });
      } catch {
        this.userMap = {};
      }
    },
    async fetchEquipments() {
      try {
        const res = await axios.get(`${API_BASE}/api/equipments/return-pending`)
        this.equipments = (res.data || [])
          .filter(e =>
            e.since && e.uptodate &&
            String(e.since).trim() !== "" && String(e.uptodate).trim() !== ""
          )
          .map(e => ({
            id: e._id?.$oid || e._id,
            name: e.name,
            amount: e.quantity,
            booking_id: e.booking_id || null,
            returnPhoto: Array.isArray(e.returnPhoto) ? e.returnPhoto[0] : e.returnPhoto,
            fileData: e.attachment || null,
            fileName: e.fileName || null
          }))
      } catch (e) {
        this.equipments = []
        Swal.fire('Error', 'โหลดข้อมูลอุปกรณ์ล้มเหลว', 'error')
      }
    },
    async fetchNotifications() {
      try {
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
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
                : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`,
            };
          });

          this.notifications = [...this.notifications, ...newMessages]
            .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
            .sort((a, b) => b.timestamp - a.timestamp);

          this.pruneOldNotifications();
        }

        this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
      } catch {}
    },

    // ---------- Return ----------
    async returnGroup(group) {
  const staffId = localStorage.getItem('user_id');
  const itemWithPhoto = group.items.find(item => !!item.returnPhoto);

  let photoHtml = '';
  if (itemWithPhoto && itemWithPhoto.returnPhoto) {
    photoHtml = `
      <div style="text-align:center;margin-bottom:12px;">
        <img
          src="${itemWithPhoto.returnPhoto}"
          style="max-width:220px;max-height:170px;object-fit:contain;cursor:pointer;border-radius:10px;border:1.5px solid #bbb;"
          alt="รูปคืนอุปกรณ์"
          onclick="window.__showFullPhoto && window.__showFullPhoto()"
        />
        <div style="font-size:0.9em;color:#888;margin-top:0.4em;">คลิกที่รูปเพื่อดูแบบเต็มจอ</div>
      </div>
    `;
  } else {
    photoHtml = `<div style="text-align:center;color:#bbb;margin-bottom:12px;">ไม่มีรูปคืนอุปกรณ์แนบมา</div>`;
  }

  const { value: result } = await Swal.fire({
    title: 'ยืนยันการคืนอุปกรณ์',
    html: `
      <div style="margin-bottom:8px; text-align:center;">
        ${photoHtml}
        <hr>
        <div style="font-size:1.02rem; font-weight:600; margin:6px 0 2px;">
          คุณต้องการรับคืนอุปกรณ์นี้หรือไม่
        </div>
        <div style="font-size:0.9rem; color:#666; margin-top:2px;">
          (กรุณาเลือกสถานะและกรอกหมายเหตุหากอุปกรณ์ไม่สมบูรณ์)
        </div>
      </div>

      <div style="display:flex; justify-content:center; align-items:center; margin-bottom:8px;">
        <label style="margin-right:2em;">
          <input type="radio" name="equipStatus" value="good" checked> สมบูรณ์
        </label>
        <label>
          <input type="radio" name="equipStatus" value="bad"> ไม่สมบูรณ์
        </label>
      </div>

      <div id="remarkBox" style="margin-top:1em; display:none; text-align:center;">
        <input
          id="remarkInput"
          class="swal2-input"
          placeholder="กรุณากรอกหมายเหตุ"
          style="width:min(780px,92%); max-width:none; margin:8px auto 0; display:block;"
        />
      </div>
    `,
    icon: 'question',
    input: null,
    showCancelButton: true,
    confirmButtonText: 'รับคืนอุปกรณ์',
    cancelButtonText: 'ยกเลิก',
    focusConfirm: false,
    preConfirm: () => {
      const status = document.querySelector('input[name="equipStatus"]:checked').value;
      const remark = document.getElementById('remarkInput')?.value || "";
      if (status === 'bad' && !remark.trim()) {
        Swal.showValidationMessage('กรุณากรอกหมายเหตุหากอุปกรณ์ไม่สมบูรณ์');
        return false;
      }
      return { status, remark };
    },
    didOpen: () => {
      window.__showFullPhoto = () => {
        if (itemWithPhoto && itemWithPhoto.returnPhoto) {
          const imgWin = window.open("", "_blank");
          imgWin.document.write(`
            <html>
              <head>
                <title>รูปคืนอุปกรณ์</title>
                <style>
                  body { background:#111;margin:0;display:flex;align-items:center;justify-content:center;height:100vh;}
                  img { max-width:100vw;max-height:100vh;object-fit:contain;border-radius:16px;box-shadow:0 8px 30px #0008;}
                </style>
              </head>
              <body onclick="window.close()">
                <img src="${itemWithPhoto.returnPhoto}" alt="รูปคืนอุปกรณ์" />
              </body>
            </html>
          `);
        }
      };
      const radios = document.getElementsByName('equipStatus');
      radios.forEach(radio => {
        radio.addEventListener('change', () => {
          document.getElementById('remarkBox').style.display =
            radio.value === 'bad' && radio.checked ? 'block' : 'none';
        });
      });
    },
    willClose: () => { window.__showFullPhoto = undefined; }
  });

  if (!result) return;

  try {
    await Promise.all(
      group.items.map(item =>
        axios.patch(`${API_BASE}/api/history/${item.id}/return`, {
          staff_id: staffId,
          status: result.status,
          remark: result.remark,
          attachment: item.fileData,
          fileName: item.fileName,
          booking_id: item.booking_id || null
        })
      )
    );
    Swal.fire({
      title: 'สำเร็จ',
      text: `คุณได้คืนอุปกรณ์กลุ่มนี้แล้ว`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
    await this.fetchEquipments();
  } catch {
    Swal.fire('Error', 'คืนอุปกรณ์ไม่สำเร็จ', 'error');
  }
},


    // ---------- Detail (เหมือน approve_field.vue กรณี equipment) ----------
    // ---------- Detail ----------
// ---------- Detail (แบบเดียวกับรูปแรก: รวมรายการตามชื่อ) ----------
// ---------- Detail (รวมรายการตามชื่อ และดึงผู้ขอใช้จาก username_form) ----------
// ---------- Detail (รวมรายการตามชื่อ + ดึงผู้ขอใช้แบบ robust) ----------
// ---------- Detail (รวมรายการตามชื่อ + ใช้ username_form เท่านั้น) ----------
// ---------- Detail (รวมรายการ + แสดง id_form) ----------
async detailGroup(group) {
  const esc = (s) => String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');

  const tableWrap = (innerHtml, showPdf, showAttach) => `
    <div class="swal-detail-wrap">
      ${innerHtml}
      <div class="swal-detail-actions">
        ${showPdf ? `<button id="pdf-btn" type="button">ดูไฟล์ PDF</button>` : ``}
        ${showAttach ? `<button id="attach-btn" type="button">ดูไฟล์แนบ</button>` : ``}
      </div>
    </div>
  `;

  await this.ensureUsersLoaded();

  const bookingId = group.booking_id || group.items?.[0]?.booking_id || null;

  // รวมจำนวนต่อชื่ออุปกรณ์
  const merged = new Map();
  (group.items || []).forEach(it => {
    const name = it?.name || '-';
    const qty  = Number(it?.amount ?? it?.quantity ?? 0) || 0;
    merged.set(name, (merged.get(name) || 0) + qty);
  });

  // ค่าแสดงผล
  let requester   = '-'; // ชื่อผู้ขอใช้ (จาก username_form)
  let requesterId = '-'; // ไอดีผู้ขอใช้ (จาก id_form)
  let dateBorrow  = '-';
  let dateRange   = '-';

  if (bookingId) {
    try {
      const res = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
      let list = Array.isArray(res.data) ? res.data : [];
      list = list
        .filter(h => String(h?.booking_id || '') === String(bookingId))
        .filter(h => (h?.type || '').toLowerCase() === 'equipment')
        .sort((a,b) => new Date(b.updatedAt || b.createdAt || b.date || 0) - new Date(a.updatedAt || a.createdAt || a.date || 0));

      // ดึงชื่อจาก username_form
      const recUser = list.find(h => h?.username_form && String(h.username_form).trim());
      if (recUser) requester = String(recUser.username_form).trim();

      // ดึง “ไอดีผู้ขอใช้” จาก id_form
      const recId = list.find(h => h?.id_form && String(h.id_form).trim());
      if (recId) requesterId = String(recId.id_form).trim();

      // วันที่ยืม/ช่วงใช้
      const recDate = list.find(h => h?.date || h?.since || h?.uptodate) || list[0];
      if (recDate) {
        dateBorrow = recDate?.date ? this.formatDate(recDate.date) : '-';
        const since = recDate?.since ? this.formatDate(recDate.since) : '-';
        const upto  = recDate?.uptodate ? this.formatDate(recDate.uptodate) : '-';
        dateRange   = `${since} - ${upto}`;
      }
    } catch (e) {
      // ใช้ค่า default ถ้าดึงไม่สำเร็จ
    }
  }

  const rowsData = Array.from(merged.entries()).map(([name, qty], idx) => ({
    idx: idx + 1,
    name,
    quantity: qty,
    requester,
    requesterId,
    dateBorrow,
    dateRange
  }));

const rowsHtml = rowsData.map(r => `
  <tr>
    <td class="c">${r.idx}</td>
    <td>${esc(r.name)}</td>
    <td class="c">${esc(r.quantity)}</td>
    <td class="c col-id nowrap">${esc(r.requesterId)}</td>
    <td class="col-requester">${esc(r.requester)}</td>
    <td class="c nowrap">${esc(r.dateBorrow)}</td>
    <td class="c nowrap">${esc(r.dateRange)}</td>
  </tr>
`).join('');


  const table = `
  <table class="swal-detail-table items">
    <thead>
      <tr>
        <th style="width:64px">ลำดับ</th>
        <th>รายการ</th>
        <th style="width:86px">จำนวน</th>
        <th class="col-id">รหัสนักศึกษา/พนักงาน</th>
        <th class="col-requester">ผู้ขอใช้</th>
        <th style="width:120px">วันที่ทำรายการ</th>
        <th style="min-width:220px">ช่วงเวลาที่ใช้</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
`;


  Swal.fire({
    title: 'รายละเอียดอุปกรณ์',
    html: tableWrap(table, true, true),
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3085d6',
    width: 1100,
    customClass: { popup: 'swal-equipment' },
    didOpen: () => {
      const btnPdf = document.getElementById('pdf-btn');
      if (btnPdf) btnPdf.addEventListener('click', () => this.downloadBookingPdf(group));
      const btnAttach = document.getElementById('attach-btn');
      if (btnAttach) btnAttach.addEventListener('click', () => this.viewAttachment(group));
    }
  });
}





,

    // ---------- PDF & Attachment (เหมือน approve_field.vue) ----------
    async downloadBookingPdf(target) {
      const bookingId  = typeof target === 'string' ? target : (target?.booking_id || '');
      const typeFilter = 'equipment';

      if (!bookingId) {
        Swal.fire('ผิดพลาด','ไม่พบ booking_id สำหรับดาวน์โหลด PDF','error');
        return;
      }

      try {
        const resHist = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
        let list = Array.isArray(resHist.data) ? resHist.data : [];

        list = list
          .filter(h => String(h?.booking_id || '') === String(bookingId))
          .filter(h => (h?.type || '').toLowerCase() === typeFilter);

        list.sort((a,b) => new Date(b.updatedAt || b.createdAt || b.date || 0) - new Date(a.updatedAt || a.createdAt || a.date || 0));

        const picked = this.pickPdfUrl(list);
        const rawUrl = this.normalizePdfUrl(picked);

        if (!rawUrl) {
          Swal.fire('ผิดพลาด','ไม่พบ URL ของไฟล์ PDF สำหรับรายการนี้','error');
          return;
        }

        try {
          const resp = await fetch(rawUrl, { credentials: 'include' });
          if (!resp.ok) throw new Error('not ok');
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = this.getFileNameFromUrl(rawUrl, `booking_${bookingId}.pdf`);
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(blobUrl);
          return;
        } catch (_) {
          if (/^https:\/\//i.test(rawUrl)) {
            const httpUrl = 'http://' + rawUrl.slice('https://'.length);
            window.open(httpUrl, '_blank', 'noopener');
            return;
          }
          if (/^http:\/\//i.test(rawUrl)) {
            const httpsUrl = 'https://' + rawUrl.slice('http://'.length);
            window.open(httpsUrl, '_blank', 'noopener');
            return;
          }
          throw _;
        }
      } catch (err) {
        console.error('downloadBookingPdf error:', err);
        Swal.fire('ผิดพลาด','ดาวน์โหลด PDF ไม่สำเร็จ','error');
      }
    },

    async viewAttachment(group) {
      try {
        const bookingId = group.booking_id;
        if (!bookingId) {
          Swal.fire('ผิดพลาด','ไม่พบ booking_id สำหรับดูไฟล์แนบ','error');
          return;
        }

        const resHist = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
        let list = Array.isArray(resHist.data) ? resHist.data : [];
        list = list.filter(h => String(h?.booking_id || '') === String(bookingId));

        const files = [];
        const seen = new Set();
        const safeName = (name, url) => {
          if (name && typeof name === 'string') return name;
          try {
            const { pathname } = new URL(url);
            const n = decodeURIComponent(pathname.split('/').pop() || '');
            return n || 'attachment';
          } catch { return 'attachment'; }
        };

        list.forEach(h => {
          const atts = Array.isArray(h?.attachment) ? h.attachment : [];
          const names = Array.isArray(h?.fileName) ? h.fileName : [];
          atts.forEach((u, i) => {
            const url = this.normalizePdfUrl(u);
            if (!url) return;
            if (seen.has(url)) return;
            seen.add(url);
            files.push({ url, name: safeName(names[i], url) });
          });
        });

        if (files.length === 0) {
          Swal.fire('ไม่มีไฟล์แนบ', 'ไม่พบไฟล์แนบสำหรับรายการนี้', 'warning');
          return;
        }

        if (files.length === 1) {
          window.open(files[0].url, '_blank', 'noopener');
          return;
        }

        const itemHtml = files.map((f, idx) => `
          <li style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed #e5e7eb;">
            <div style="flex:1;word-break:break-word;text-align:left;">
              ${idx + 1}. ${f.name}
            </div>
            <div>
              <button class="open-attach" data-idx="${idx}"
                style="background:#3a7ca5;color:#fff;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;">
                เปิด
              </button>
            </div>
          </li>
        `).join('');

        Swal.fire({
          title: 'ไฟล์แนบทั้งหมด',
          html: `
            <div style="text-align:left;max-height:60vh;overflow:auto;padding:4px 2px;">
              <ul style="list-style:none;margin:0;padding:0;">
                ${itemHtml}
              </ul>
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: 'ปิด',
          confirmButtonColor: '#3085d6',
          didOpen: () => {
            document.querySelectorAll('.open-attach').forEach(btn => {
              btn.addEventListener('click', () => {
                const i = Number(btn.getAttribute('data-idx'));
                const f = files[i];
                if (f?.url) window.open(f.url, '_blank', 'noopener');
              });
            });
          }
        });
      } catch (err) {
        console.error('viewAttachment error:', err);
        Swal.fire('ผิดพลาด','ไม่สามารถดึงไฟล์แนบได้','error');
      }
    },

    // ---------- Misc ----------
    formatNamesWithQty(items) {
      const acc = new Map();
      for (const it of (items || [])) {
        const name = String(it?.name ?? '').trim();
        if (!name) continue;
        const qty = Number(it?.amount ?? it?.quantity ?? 0) || 0;
        acc.set(name, (acc.get(name) ?? 0) + qty);
      }
      return Array.from(acc.entries()).map(([n, q]) => `${n}${q ? ` (${q})` : ''}`).join(', ');
    },
    sumQty(items) {
      return (items || []).reduce((sum, it) => sum + (Number(it?.amount ?? it?.quantity ?? 0) || 0), 0);
    },
  }
}
</script>

<style scoped>
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
  justify-content: space-between;
  grid-template-columns: 200px 80px auto;
  align-items: center;
  gap: 1rem;
}
.hist-row-desktop { grid-template-columns: 200px 1fr 80px; gap: 1rem; }
.hist-row-mobile { grid-template-columns: 1fr auto; gap: 0.6rem; }

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
.return-btn {
  padding: 4px 10px;
  background-color: #1eac36;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.3s;
  max-width: 70px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.return-btn:hover{ background-color: #178129; }

.detail-btn{
  padding: 4px 10px;
  background-color: #304674;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.3s;
  white-space: nowrap;
}
.detail-btn:hover{ background-color: #2953d1; }

.table-container {
  padding: 0 70px;
  overflow-x: auto;
}
.approve-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.approve-table th, .approve-table td {
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}
.approve-table th {
  background: #1e3a8a;
  color: #fff;
  font-weight: bold;
}
.approve-table tr:last-child td { border-bottom: none; }

@media (max-width: 600px) {
  .histbody {
    padding: 14px 0 0 0 !important;
    width: 100vw;
    min-width: unset;
    overflow-x: auto !important;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .hist-grid {
    min-width: 320px;
    width: 95vw;
    max-width: 440px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  .hist-card {
    min-width: 95vw;
    max-width: 440px;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .hist-row {
    display: grid !important;
    grid-template-columns: 1fr auto;
    align-items: center;
    min-width: 0 !important;
    width: 100% !important;
    gap: 0.6rem;
    flex-wrap: unset !important;
    overflow-x: unset !important;
  }
  .item-name {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.16); z-index: 1100; }
.sidebar { z-index: 1200; }

.notification-backdrop{ position: fixed; top:0; left:0; right:0; bottom:0; background: transparent; z-index: 1001; }
.notification-dropdown { position: absolute; right: 0; top: 38px; background: #fff; border-radius: 18px 0 18px 18px; box-shadow: 0 8px 24px 0 rgba(27, 50, 98, 0.14), 0 2px 4px 0 rgba(33, 125, 215, 0.06); min-width: 330px; max-width: 370px; max-height: 420px; overflow-y: auto; z-index: 1002; padding: 0; border: none; animation: fadeDown 0.22s; }
</style>

<style>
@import '../css/style.css';

/* ===== SweetAlert detail tables (เหมือน approve_field.vue) ===== */
.swal2-popup .swal-detail-wrap{
  max-width: min(1240px, 96vw);
  overflow-x: auto;
}
.swal2-popup .swal-detail-actions{ text-align:center; margin-top: 16px; }
.swal2-popup #pdf-btn,
.swal2-popup #attach-btn{
  background:#213555; color:#fff; padding:8px 18px; border-radius:8px; border:none; cursor:pointer; margin:0 6px;
}
.swal2-popup #attach-btn{ background:#3a7ca5; }

.swal2-popup .swal-detail-table{
  width: min(1200px, 96vw);
  border-collapse: collapse;
  margin: 0 auto;
  font-size: 0.98rem;
}
.swal2-popup .swal-detail-table.items thead th{
  background:#213555; color:#fff; padding:8px 10px; border:1px solid #e6e9f2; text-align:center; font-weight:700;
}
.swal2-popup .swal-detail-table.items tbody td{ border:1px solid #e6e9f2; padding:8px 10px; }
.swal2-popup .swal-detail-table.items tbody td.c{ text-align:center; }
.swal2-popup .nowrap { white-space: nowrap !important; word-break: normal !important; }

.swal2-popup.swal-equipment{
  max-width: 1100px !important;
  padding: 28px 26px !important;
}
.swal2-popup.swal-equipment .swal-detail-wrap{ max-width: 1080px; }
.swal2-popup.swal-equipment .swal-detail-table,
.swal2-popup.swal-equipment .swal-detail-table.items{ width: 1080px; }

@media (max-width: 600px){
  .swal2-popup.swal-equipment{ max-width: 96vw !important; width: auto !important; }
  .swal2-popup .swal-detail-table.items{ width: auto; min-width: 640px; }
}
/* ==== Widths for ID & Requester columns ==== */
.swal2-popup .swal-detail-table.items th.col-id,
.swal2-popup .swal-detail-table.items td.col-id {
  width: 110px;            /* ทำให้แคบลง */
}

.swal2-popup .swal-detail-table.items th.col-requester,
.swal2-popup .swal-detail-table.items td.col-requester {
  min-width: 240px;        /* เพิ่มความกว้างผู้ขอใช้ */
}

/* ปรับบนจอเล็กลงเล็กน้อย */
@media (max-width: 600px){
  .swal2-popup .swal-detail-table.items th.col-id,
  .swal2-popup .swal-detail-table.items td.col-id { width: 100px; }
  .swal2-popup .swal-detail-table.items th.col-requester,
  .swal2-popup .swal-detail-table.items td.col-requester { min-width: 200px; }
}

</style>