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
    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
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
          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>
      <div class="histbody">
        <h1 style="padding-left: 50px; display: flex; justify-content: center;">Approve Field / Equipment</h1>

        <!-- ปุ่มกรอง -->
        <div class="history-filter" style="display: flex; justify-content: center;">
          <button :class="{ active: filterType === 'all' }" @click="filterType = 'all'">ทั้งหมด</button>
          <button :class="{ active: filterType === 'field' }" @click="filterType = 'field'">สนาม</button>
          <button :class="{ active: filterType === 'equipment' }" @click="filterType = 'equipment'">อุปกรณ์</button>
        </div>

        <div class="hist-grid">
          <div
            class="hist-card"
            v-for="group in filteredGrouped"
            :key="group.type + '_' + (group.booking_id || group.items[0].id)"
          >
            <!-- Field -->
            <template v-if="group.type === 'field'">
              <div class="hist-row">
                <span class="item-name">{{ group.items[0].name }}</span>
                <span class="item-amount">
                  <template v-if="group.items[0].since && group.items[0].uptodate">
                    <template v-if="group.items[0].since === group.items[0].uptodate">
                      {{ formatDate(group.items[0].since) }}
                    </template>
                    <template v-else>
                      {{ formatDate(group.items[0].since) }} - {{ formatDate(group.items[0].uptodate) }}
                    </template>
                  </template>
                  <template v-else>-</template>
                </span>
                <span class="left status-group">
                  <button class="detail-btn" @click="detailGroup(group)">Detail</button>
                  <button class="approve-btn" @click="approveGroup(group)">Approve</button>
                  <button class="cancel-btn" @click="cancelGroup(group)">Cancel</button>
                </span>
              </div>
            </template>
            <!-- Equipment กลุ่ม booking_id เดียวกัน -->
            <template v-else>
              <div class="hist-row" style="border-bottom:1px solid #eee;">
                <span class="item-name" style="font-weight:600;">
                  รายการอุปกรณ์  
                </span>
                <span class="item-amount" style="font-size:0.9em;">
                 
                </span>
                <span class="status-group">
                  <button class="detail-btn" @click="detailGroup(group)">Detail</button>
                  <button class="approve-btn" @click="approveGroup(group)">Approve</button>
                  <button class="cancel-btn" @click="cancelGroup(group)">Cancel</button>
                </span>
              </div>
              <div v-for="(item, i) in group.items" :key="item.id" class="hist-row" style="border-bottom:1px dashed #ccc;">
                <span class="item-name">อุปกรณ์ที่ {{ i+1 }}: {{ item.name }}</span>
                <span class="item-amount">จำนวน: {{ item.quantity }}</span>
                <span class="item-amount"></span>
              </div>
            </template>
          </div>
        </div>
      </div>
      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel. 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
            Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
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
      grouped: []
    }
  },
  computed: {
    filteredGrouped() {
      if (this.filterType === 'all') return this.grouped
      return this.grouped.filter(g => g.type === this.filterType)
    }
  },
  methods: {
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
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
      if (this.showNotifications) this.unreadCount = 0;
    },
    closeNotifications() {
      this.showNotifications = false;
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
        // ดึงรายการ pending ทั้งสนามและอุปกรณ์
        const res = await axios.get(`${API_BASE}/api/history/approve_field`);
        const data = Array.isArray(res.data) ? res.data : [];

        const pendings = data.filter(item =>
          item.status === 'pending' &&
          (item.type === 'field' || item.type === 'equipment') &&
          !this.lastCheckedIds.has(item._id?.$oid || item._id)
        );

        if (pendings.length) {
          const newMessages = pendings.map(item => {
            if (item.type === 'field') {
              return {
                id: item._id?.$oid || item._id,
                message: `สนาม '${item.name}' กำลังรอการอนุมัติ`
              };
            } else if (item.type === 'equipment') {
              return {
                id: item._id?.$oid || item._id,
                message: `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
              };
            }
          });

          this.notifications = [...this.notifications, ...newMessages];
          pendings.forEach(item => this.lastCheckedIds.add(item._id?.$oid || item._id));
          this.unreadCount = this.notifications.length;
        }
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
    Swal.fire('Approved!', 'The booking has been approved.', 'success');
  }
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
        Swal.fire('Cancelled!', 'The booking has been cancelled.', 'error')
      }
    },
    detailGroup(group) {
  let html = '<div style="text-align:left;">'
  if (group.type === 'field') {
    group.items.forEach((item, i) => {
      html += `
        <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #bbb;">
          <b>ชื่อสนาม:</b> ${item.name || '-'}<br>
          <b>โซน:</b> ${(item.zone && item.zone !== '-' && item.zone !== '') ? item.zone : '-'}<br>

          <b>ชื่อผู้ขอใช้:</b> ${this.userMap[item.user_id] || item.requester || item.user_id || "-"}<br>
          <b>วันที่ขอใช้:</b> ${item.date ? this.formatDate(item.date) : '-'}<br>
          <b>ช่วงเวลาที่ใช้:</b> 
          ${item.since ? this.formatDate(item.since) : '-'} - 
          ${item.uptodate ? this.formatDate(item.uptodate) : '-'}<br>
        </div>
      `
    });
    // 👇👇 เพิ่มปุ่ม PDF
    html += `<div style="text-align:center; margin-top:16px;">
      <button id="pdf-btn" style="background:#213555;color:#fff;padding:6px 18px;border-radius:7px;border:none;cursor:pointer;">ดาวน์โหลด PDF</button>
    </div>`;
    Swal.fire({
      title: "รายละเอียดสนาม",
      html,
      confirmButtonText: "ปิด",
      confirmButtonColor: "#3085d6",
      didOpen: () => {
        document.getElementById('pdf-btn')?.addEventListener('click', () => {
          this.exportPdf(group.items[0]);
        });
      }
    });
  } else {
    // Equipment
    group.items.forEach((item, i) => {
      html += `
        <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #bbb;">
          <b>อุปกรณ์ที่ ${i + 1}:</b> ${item.name || '-'}<br>
          <b>จำนวน:</b> ${item.quantity || '-'}<br>
          <b>ชื่อผู้ขอใช้:</b> ${this.userMap[item.user_id] || item.requester || item.user_id || "-"}<br>
          <b>วันที่ขอยืม:</b> ${item.date ? this.formatDate(item.date) : '-'}<br>
          <b>ช่วงเวลาที่ใช้:</b> 
          ${item.since ? this.formatDate(item.since) : '-'} - 
          ${item.uptodate ? this.formatDate(item.uptodate) : '-'}<br>
        </div>
      `
    });
    // 👇👇 เพิ่มปุ่ม PDF
    html += `<div style="text-align:center; margin-top:16px;">
      <button id="pdf-btn" style="background:#213555;color:#fff;padding:6px 18px;border-radius:7px;border:none;cursor:pointer;">ดาวน์โหลด PDF</button>
    </div>`;
    Swal.fire({
      title: "รายละเอียดอุปกรณ์",
      html,
      confirmButtonText: "ปิด",
      confirmButtonColor: "#3085d6",
      didOpen: () => {
        document.getElementById('pdf-btn')?.addEventListener('click', () => {
          this.exportPdf(group.items[0]);
        });
      }
    });
  }
}
,

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
    Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการดาวน์โหลด PDF', 'error');
    console.error(err);
  }
},
  },
  async mounted() {
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
      }));

      // 2.1 group: fields แต่ละรายการ, equipment ตาม booking_id
      const fields = bookings.filter(b => b.type === 'field').map(f => ({
        type: 'field',
        items: [f]
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

    // 3. โหลด notifications และ start polling
    await this.fetchNotifications();
    this.polling = setInterval(this.fetchNotifications, 30000);

    // เพิ่ม event listener สำหรับคลิกข้างนอก dropdown
    document.addEventListener('mousedown', this.handleClickOutside);
  },
  beforeUnmount() {
    clearInterval(this.polling)
    document.removeEventListener('mousedown', this.handleClickOutside);
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
  background-color: #0cad00;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.3s;
}
.approve-btn:hover {
  background-color: #25cd28;
}
.cancel-btn {
  padding: 4px 10px;
  background-color: #d90004;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.3s;
}
.cancel-btn:hover {
  background-color: #d9363e;
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
</style>
<style>
@import '../css/style.css';
</style>
