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
        <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> รับคืนอุปกรณ์ </router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล </router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
      </nav>
    </aside>

    <div v-if="isMobile && !isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>

    <div class="main">
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
      <div class="histbody">
        <h1 style="padding-left: 50px; display: flex; justify-content: center;">Field/Equipment Approve</h1>

        <!-- ปุ่มกรอง -->
        <div class="history-filter" style="display: flex; justify-content: center;">
          <button :class="{ active: filterType === 'all' }" @click="filterType = 'all'">All</button>
          <button :class="{ active: filterType === 'field' }" @click="filterType = 'field'">Field</button>
          <button :class="{ active: filterType === 'equipment' }" @click="filterType = 'equipment'">Equipment</button>
        </div>

        <!-- ตารางอนุมัติ (table) -->
        <div class="table-container">
          <table class="approve-table">
            <thead>
              <tr>
                <th>Transaction date</th>
                <th>Type</th>
                <th>Field / Equipment</th>
                <th>Time / Amount</th>
                <th>Actions</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in filteredGrouped" :key="group.type + '_' + (group.booking_id || group.items[0].id)">
                <!-- สนาม -->
                <tr v-if="group.type === 'field'">
                  <td>{{ formatDate(group.items[0].date) }}</td>
                  <td>สนาม</td>
                  <td>
                    {{ group.items[0].name }}
                    <template v-if="group.items[0].zone && group.items[0].zone !== '-' && group.items[0].zone !== ''">
                      (โซน: {{ group.items[0].zone }})
                    </template>
                  </td>
                  <td>
                    <!-- แสดงเวลา ถ้ามีข้อมูล -->
                    <template v-if="group.items[0].startTime && group.items[0].endTime">
                    {{ group.items[0].startTime }} - {{ group.items[0].endTime }}
                  </template>
                    <template v-else>
                      -
                    </template>
                  </td>
                  <td>
                    <button class="approve-btn" @click="approveGroup(group)">อนุมัติ</button>
                    <button class="cancel-btn" @click="cancelGroup(group)">ไม่อนุมัติ</button>
                  </td>
                  <td>
                    <button class="detail-btn" @click="detailGroup(group)">รายละเอียด</button>
                  </td>
                </tr>

                <!-- อุปกรณ์ -->
                <tr v-else>
                  <td>{{ formatDate(group.items[0].date) }}</td>
                  <td>อุปกรณ์</td>
                  <td>
                    <span v-for="(item, idx) in group.items" :key="item.id">
                      {{ item.name }}<span v-if="idx < group.items.length - 1">, </span>
                    </span>
                  </td>
                  <td>
                    <span v-for="(item, idx) in group.items" :key="item.id">
                      {{ item.quantity }}<span v-if="idx < group.items.length - 1">, </span>
                    </span>
                  </td>
                  <td>
                    <button class="approve-btn" @click="approveGroup(group)">อนุมัติ</button>
                    <button class="cancel-btn" @click="cancelGroup(group)">ไม่อนุมัติ</button>
                  </td>
                  <td>
                    <button class="detail-btn" @click="detailGroup(group)">รายละเอียด</button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
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
</template>


<script>
import Swal from 'sweetalert2'
import axios from 'axios'

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// (ฟอนต์ Sarabun ต้อง import JS ไฟล์ที่ bundle มาเอง!)
import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'

const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'

export default {
  data() {
    return {
      isSidebarClosed: false,
      filterType: 'all',
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
      userMap: {},
      isMobile: window.innerWidth <= 600,
      grouped: [],
      lastSeenTimestamp: 0,
      refreshTimer: null,
    _lastSnapshot: '',
    }
  },
  computed: {
    filteredGrouped() {
      if (this.filterType === 'all') return this.grouped
      return this.grouped.filter(g => g.type === this.filterType)
    }
  },
  methods: {

     _makeSnapshot(groups) {
    // เก็บเฉพาะ field สำคัญ เพื่อตรวจเปลี่ยนแปลง
    const lite = groups.map(g => ({
      t: g.type,
      b: g.booking_id || '',
      items: g.items.map(it => ({
        id: it.id,
        name: it.name,
        qty: it.quantity,
        date: it.date,
        s: it.startTime, e: it.endTime,
        u: it.user_id
      }))
    }));
    return JSON.stringify(lite);
  },

   async fetchAndGroup() {
    try {
      // 1) users (ถ้าจำเป็นครั้งแรก)
      if (!Object.keys(this.userMap || {}).length) {
        const userRes = await axios.get(`${API_BASE}/api/users`);
        this.userMap = {};
        userRes.data.forEach(u => {
          this.userMap[u.user_id] =
            (u.firstname && u.lastname) ? `${u.firstname} ${u.lastname}` : (u.name || u.user_id);
        });
      }

      // 2) ข้อมูลอนุมัติ
      const res = await axios.get(`${API_BASE}/api/history/approve_field`);
      const bookings = (res.data || []).map((h, idx) => ({
        id: h._id?.$oid || h._id || idx + 1,
        name: h.name || "-",
        requester: h.requester || "-",
        user_id: h.user_id || "-",
        booking_id: h.booking_id || "",
        type: h.type || "field",
        since: h.since || "-",
        uptodate: h.uptodate || "-",
        reason: h.reason || h.reasons || "-",
        zone: h.zone || "-",
        quantity: h.quantity || "-",
        date: h.date || "-",
        startTime: h.startTime || "",
        endTime: h.endTime || "",
      }));

      // 3) group ข้อมูล
      const fields = bookings
        .filter(b => b.type === 'field')
        .map(f => ({ type: 'field', items: [f], booking_id: f.booking_id || '' }));

      const equipGroups = {};
      bookings.filter(b => b.type === 'equipment').forEach(eq => {
        const key = eq.booking_id || 'single_' + eq.id;
        if (!equipGroups[key]) equipGroups[key] = [];
        equipGroups[key].push(eq);
      });
      const equipments = Object.entries(equipGroups).map(([booking_id, items]) => ({
        type: 'equipment',
        booking_id,
        items
      }));

      const next = [...fields, ...equipments];

      // 4) อัปเดตเฉพาะเมื่อข้อมูลเปลี่ยนจริง ๆ (กันการกระพริบตาราง)
      const snap = this._makeSnapshot(next);
      if (snap !== this._lastSnapshot) {
        this.grouped = next;
        this._lastSnapshot = snap;
      }
    } catch (err) {
      console.error('โหลดข้อมูล approve_field ไม่สำเร็จ:', err);
    }
  },

  async approveGroup(group) {
  const result = await Swal.fire({ /* …เดิม… */ });
  if (!result.isConfirmed) return;

  const adminUserId = localStorage.getItem('user_id');
  const approveDate = new Date().toISOString();

  await Promise.all(group.items.map(item => {
    let url, data;
    if (item.type === 'field') {
      url = `${API_BASE}/api/history/${item.id}/approve_field`;
      data = { admin_id: adminUserId, approvedAt: approveDate };
    } else {
      url = `${API_BASE}/api/history/${item.id}/approve_equipment`;
      data = { staff_id: adminUserId, approvedAt: approveDate };
    }
    return axios.patch(url, data);
  }));

  Swal.fire('Approved', 'The booking has been approved.', 'success');

  // ⬇️ ดึงข้อมูลใหม่ทันที
  await this.fetchAndGroup();
},

async cancelGroup(group) {
  const result = await Swal.fire({ /* …เดิม… */ });
  if (!result.isConfirmed) return;

  const adminId = localStorage.getItem('user_id');
  await Promise.all(
    group.items.map(item =>
      axios.patch(
        item.type === 'field'
          ? `${API_BASE}/api/history/${item.id}/disapprove_field`
          : `${API_BASE}/api/history/${item.id}/disapprove_equipment`,
        { admin_id: adminId }
      )
    )
  );

  Swal.fire('Cancelled!', 'The booking has been cancelled.', 'error');

  // ⬇️ ดึงข้อมูลใหม่ทันที
  await this.fetchAndGroup();
},

    formatDate(dateInput) {
      if (!dateInput || dateInput === "-") return '-';
      const date = new Date(dateInput);
      if (isNaN(date)) return '-';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed
    },
     async downloadBookingPdf(bookingId) {
    if (!bookingId) {
      Swal.fire('ผิดพลาด', 'ไม่พบ booking_id สำหรับดาวน์โหลด PDF', 'error');
      return;
    }
    try {
      const response = await axios.get(`${API_BASE}/api/history/pdf`, {
        params: { booking_id: bookingId },
        responseType: 'blob'  // ให้ axios รู้ว่าเป็นไฟล์
      });
      
      // สร้างลิงก์ดาวน์โหลด
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `booking_${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      Swal.fire('ผิดพลาด', 'ดาวน์โหลด PDF ไม่สำเร็จ', 'error');
      console.error(err);
    }
  },
    toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    this.lastSeenTimestamp = Date.now();
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(this.lastSeenTimestamp));
    this.unreadCount = 0; // เคลียร์ทันที และจะไม่กลับมาเพราะคำนวณจาก timestamp
  }
},
closeNotifications() { this.showNotifications = false; },

pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
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
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.pruneOldNotifications();

    // ดึง pending field/equipment
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

      // รวม + unique ตาม id + sort ล่าสุดอยู่บน
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      this.pruneOldNotifications();
    }

    // นับ unread จาก timestamp > lastSeenTimestamp (sync ทุกหน้า)
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch (err) {
    // ไม่ต้องแจ้ง error
  }
},
    async approveGroup(group) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'Approve รายการนี้ทั้งหมด?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, approve it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#0cad00',
    cancelButtonColor: '#d90004'
  });

  if (result.isConfirmed) {
    // ===== จุดนี้ต้องใช้ user_id ที่เป็น string =====
    // ดึงจาก localStorage หรือ state manager
    const adminUserId = localStorage.getItem('user_id');
const approveDate = new Date().toISOString();

await Promise.all(
  group.items.map(item => {
    let url, data;
    if (item.type === 'field') {
      url = `${API_BASE}/api/history/${item.id}/approve_field`;
      data = { admin_id: adminUserId, approvedAt: approveDate };
    } else {
      url = `${API_BASE}/api/history/${item.id}/approve_equipment`;
      data = { staff_id: adminUserId, approvedAt: approveDate };
    }
    return axios.patch(url, data);
  })
);

    // เอากลุ่มที่อนุมัติแล้วออกจาก list
    this.grouped = this.grouped.filter(g => g !== group);
    Swal.fire('Approved', 'The booking has been approved.', 'success');
  }
},
handleResize() {
    this.isMobile = window.innerWidth <= 800;
    if (!this.isMobile) this.isSidebarClosed = false;
  },
    async cancelGroup(group) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'Cancel รายการนี้ทั้งหมด?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, cancel it!',
        cancelButtonText: 'Back',
        confirmButtonColor: '#ff4d4f',
        cancelButtonColor: '#999'
      })
      if (result.isConfirmed) {
        const adminId = localStorage.getItem('user_id');
        await Promise.all(
          group.items.map(item =>
            axios.patch(
              item.type === 'field'
                ? `${API_BASE}/api/history/${item.id}/disapprove_field`
                : `${API_BASE}/api/history/${item.id}/disapprove_equipment`,
              { admin_id: adminId }
            )
          )
        );
        this.grouped = this.grouped.filter(g => g !== group)
        Swal.fire('Cancelled', 'The booking has been cancelled.', 'error')
      }
    },
   detailGroup(group) {
  // helper: สร้าง 1 แถว (label/value) ให้ชิดซ้ายเท่ากันหมด
  const row = (label, value) => `
    <div style="display:flex; align-items:flex-start; margin-bottom:8px;">
      <div style="width:160px; font-weight:700; text-align:left;">
        ${label}
      </div>
      <div style="flex:1; text-align:left; padding-left:12px; word-break:break-word;">
        ${value}
      </div>
    </div>
  `;

  // helper: ครอบ container + ปุ่ม PDF
  const wrap = (title, rowsHtml, showPdf, bookingId) => `
    <div style="text-align:left; padding-top:2px;">
      ${rowsHtml}
      ${showPdf ? `
        <div style="text-align:center; margin-top:14px;">
          <button id="pdf-btn" style="background:#213555;color:#fff;padding:8px 18px;border-radius:8px;border:none;cursor:pointer;">
            ดาวน์โหลด PDF
          </button>
        </div>` : ``}
    </div>
  `;

  if (group.type === 'field') {
    const it = group.items[0] || {};
    const zone = (it.zone && it.zone !== '-' && it.zone !== '') ? it.zone : '-';
    const requester = this.userMap[it.user_id] || it.requester || it.user_id || '-';
    const rowsHtml =
      row('ชื่อสนาม:', it.name || '-') +
      row('โซน:', zone) +
      row('ชื่อผู้ขอใช้:', requester) +
      row('วันที่ขอใช้:', it.date ? this.formatDate(it.date) : '-') +
      row('ช่วงเวลาที่ใช้:', `${it.since ? this.formatDate(it.since) : '-'} - ${it.uptodate ? this.formatDate(it.uptodate) : '-'}`);

    Swal.fire({
      title: 'รายละเอียดสนาม',
      html: wrap('รายละเอียดสนาม', rowsHtml, true, group.booking_id),
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#3085d6',
      didOpen: () => {
        const btn = document.getElementById('pdf-btn');
        if (btn) btn.addEventListener('click', () => this.downloadBookingPdf(group.booking_id));
      }
    });
  } else {
    // equipment (โชว์หลายชิ้นได้)
    let rowsHtml = '';
    group.items.forEach((item, idx) => {
      const requester = this.userMap[item.user_id] || item.requester || item.user_id || '-';
      rowsHtml += `
        <div style="padding:8px 0; border-bottom:1px dashed #c7c7c7;">
          ${row(`อุปกรณ์ที่ ${idx + 1}:`, item.name || '-')}
          ${row('จำนวน:', item.quantity || '-')}
          ${row('ชื่อผู้ขอใช้:', requester)}
          ${row('วันที่ขอยืม:', item.date ? this.formatDate(item.date) : '-')}
          ${row('ช่วงเวลาที่ใช้:', `${item.since ? this.formatDate(item.since) : '-'} - ${item.uptodate ? this.formatDate(item.uptodate) : '-'}`)}
        </div>
      `;
    });

    Swal.fire({
      title: 'รายละเอียดอุปกรณ์',
      html: wrap('รายละเอียดอุปกรณ์', rowsHtml, true, group.booking_id),
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#3085d6',
      didOpen: () => {
        const btn = document.getElementById('pdf-btn');
        if (btn) btn.addEventListener('click', () => this.downloadBookingPdf(group.booking_id));
      }
    });
  }
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
}

  },
  async mounted() {
     window.addEventListener('resize', this.handleResize);
  this.handleResize();
    // 1. โหลด users ทั้งหมด
    try {
      const userRes = await axios.get(`${API_BASE}/api/users`);;
      this.userMap = {};
      userRes.data.forEach(u => {
        this.userMap[u.user_id] =
          (u.firstname && u.lastname)
            ? `${u.firstname} ${u.lastname}`
            : (u.name || u.user_id);
      });
    } catch (err) {
      this.userMap = {};
      console.error('โหลด users ไม่สำเร็จ:', err);
    }

    // 2. โหลด bookings approve_field แล้ว group แยก field/equipment (booking_id)
    try {
      const res = await axios.get(`${API_BASE}/api/history/approve_field`);;
      const bookings = res.data.map((h, idx) => ({
        id: h._id?.$oid || h._id || idx + 1,
        name: h.name || "-",
        requester: h.requester || "-",
        user_id: h.user_id || "-",
        booking_id: h.booking_id || "",
        type: h.type || "field",
        since: h.since || "-",
        uptodate: h.uptodate || "-",
        reason: h.reason || h.reasons || "-",
        zone: h.zone || "-",
        quantity: h.quantity || "-",
        date: h.date || "-",
        startTime: h.startTime || "",
        endTime: h.endTime || "",
      }));

      // 2.1 group: fields แต่ละรายการ, equipment ตาม booking_id
      const fields = bookings.filter(b => b.type === 'field').map(f => ({
        type: 'field',
        items: [f],
        booking_id: f.booking_id || ''  // เพิ่มบรรทัดนี้
      }));

      const equipmentsArr = bookings.filter(b => b.type === 'equipment');
      const equipGroups = {};
      equipmentsArr.forEach(eq => {
        const key = eq.booking_id || 'single_' + eq.id;
        if (!equipGroups[key]) equipGroups[key] = [];
        equipGroups[key].push(eq);
      });
      const equipmentGroups = Object.entries(equipGroups).map(([booking_id, items]) => ({
        type: 'equipment',
        booking_id,
        items
      }));

      // 2.2 รวมทั้งหมด
      this.grouped = [...fields, ...equipmentGroups];

    } catch (err) {
      this.grouped = [];
      console.error('โหลดข้อมูล booking ไม่สำเร็จ:', err);
    }

    await this.fetchAndGroup();
    // 3. โหลด notifications และ start polling
     this.lastSeenTimestamp = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0');
    await this.fetchNotifications();
    this.polling = setInterval(this.fetchNotifications, 30000);
    
    this.refreshTimer = setInterval(this.fetchAndGroup, 8000);
    this._onVisibility = () => { if (!document.hidden) this.fetchAndGroup(); };
    document.addEventListener('visibilitychange', this._onVisibility);

    // เพิ่ม event listener สำหรับคลิกข้างนอก dropdown
    document.addEventListener('mousedown', this.handleClickOutside);
  },
  beforeUnmount() {
    clearInterval(this.polling)
    document.removeEventListener('mousedown', this.handleClickOutside);
     window.removeEventListener('resize', this.handleResize);
  }
}
</script>


<style scoped>
.histbody{
  width: 100%;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  overflow-x: hidden;
}
.history-filter {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-bottom: 18px;
  margin-top: 0px;
  padding-left: 70px;
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
.hist-grid{
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 70px;
}
.hist-card{
  background-color: rgb(235, 235, 235);
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  padding: 1rem 1.5rem;
  width: 100%;
}
.hist-row {
  display: flex;
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
}
.status-group {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  justify-self: end;
}
.approve-btn {
  padding: 4px 10px;
  background-color: #80e479d8;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.3s;
}
.approve-btn:hover {
  background-color: #478a48;
}
.cancel-btn {
  padding: 4px 10px;
  background-color: #f54c4fd5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.3s;
  margin-left: 10px;
}
.cancel-btn:hover {
  background-color: #7a292d;
}
.detail-btn {
  padding: 4px 10px;
  background-color: #304674;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.3s;
}
.detail-btn:hover {
  background-color: #2953d1;
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
.approve-table tr:last-child td {
  border-bottom: none;
}




@media (max-width: 600px) {
 .item-name {
    white-space: normal !important;
    word-break: break-word !important;
    overflow: visible !important;
    text-overflow: unset !important;
    max-width: 100%;
    display: block !important;
    font-size: 1em;
    font-weight: 500;
    text-align: center;  /* <<--- บังคับกลาง */
    margin-bottom: 4px;  /* ระยะห่างด้านล่างเล็กน้อย */
  }

  .histbody {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14px 0 0 0 !important;
    width: 100vw;
    min-width: unset;
    overflow-x: auto !important;
  }
  .histbody > h1 {
    padding-left: 0 !important;
    width: 100vw;
    text-align: center !important;
    font-size: 1.35rem;
    margin-bottom: 16px;
  }
  .history-filter {
    justify-content: center !important;
    padding-left: 0 !important;
    width: 100vw;
    margin-bottom: 18px;
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
    flex-direction: column !important;   /* แยกบรรทัด */
    align-items: center !important;      /* ให้ทุกอันอยู่ตรงกลาง */
    min-width: unset !important;
    width: 100% !important;
    gap: 0.5rem;
    justify-content: center !important;
  }
}

.notification-backdrop{
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: transparent;
  z-index: 1001; /* ต้องต่ำกว่า .notification-dropdown */
}


</style>
<style>
@import '../css/style.css';
</style>