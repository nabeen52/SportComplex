<template>
  <div class="layout">
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">Sport Complex MFU</p>
      </div>
      <nav class="nav-links">
        <router-link to="/home_user" exact-active-class="active">
          <i class="pi pi-home"></i> Home
        </router-link>
        <router-link to="/booking_field" active-class="active">
          <i class="pi pi-map-marker"></i> Field
        </router-link>
        <router-link to="/booking_equipment" active-class="active">
          <i class="pi pi-box"></i> Equipment
        </router-link>
        <router-link to="/history" active-class="active">
          <i class="pi pi-history"></i> History
        </router-link>
      </nav>

    </aside>
<div
  v-if="!isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
></div>

    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <div>
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
                  :class="['notification-item', noti.type || '', { unread: idx === 0 }]"
                >
                  {{ noti.message }}
                </li>
                <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
              </ul>
            </div>
          </div>
          <router-link to="/cart" class="cart-link">
            <i class="pi pi-shopping-cart"></i>
            <span v-if="totalCartItems > 0" class="badge">{{ totalCartItems }}</span>
          </router-link>
          <router-link to="/profile"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <div style="background-color: #dbe9f4;">
        <!-- <transition name="slide-down">
          <div class="announcement-bar" v-if="showAnnouncementBar">
            <i class="pi pi-megaphone announcement-icon"></i>
            <div class="announcement-bar-text">{{ announcement }}</div>
            <button class="close-announcement-btn" @click="showAnnouncementBar = false">
              <i class="pi pi-times" style="color: red;"></i>
            </button>
          </div>
        </transition> -->

        <div class="histbody">
          <h1 style="padding-left: 50px; display: flex; justify-content: center;">History</h1>
          <div style="display:flex; justify-content:center; margin-bottom: 12px;">
            <button
              :class="['filter-btn', { active: filterType === 'all' }]"
              @click="filterType = 'all'"
            >ทั้งหมด</button>
            <button
              :class="['filter-btn', { active: filterType === 'field' }]"
              style="margin-left:8px"
              @click="filterType = 'field'"
            >สนาม</button>
            <button
              :class="['filter-btn', { active: filterType === 'equipment' }]"
              style="margin-left:8px"
              @click="filterType = 'equipment'"
            >อุปกรณ์</button>
          </div>


          <div class="table-x-scroll">
          <!-- ตารางแสดงผล -->
         <table class="history-table" style="width: 90%; margin: 0 auto; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">วันที่</th>
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">ประเภท</th>
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">ชื่อ</th>
      
      <!-- <th style="border-bottom: 2px solid #ccc; padding: 8px;">จำนวน</th> -->
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">เวลา/จำนวน</th>
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">สถานะ</th>
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">การกระทำ</th>
    </tr>
  </thead>
  <tbody>
    <tr
      v-for="(group, idx) in paginatedHistory"
      :key="group.type + '_' + (group.booking_id || idx)"
    >

      <td style="padding: 8px; text-align: center;">
        {{ formatDateOnly(group.items[0].date) }}
      </td>

      <td style="padding: 8px; text-align: center; text-transform: capitalize;">
        {{ group.type }}
      </td>

      <td class="col-center" style="padding: 8px; max-width: 300px;">
  <template v-if="group.type === 'field'">
    <div style="text-align:center; width:100%;">{{ group.items[0].name }}</div>
  </template>
  <template v-else>
    <div>
      <ul style="padding-left: 20px; margin: 0;">
        <li v-for="item in group.items" :key="item.id" style="font-size: 0.9rem; text-align:center;">
          {{ item.name }}
        </li>
      </ul>
    </div>
  </template>
</td>

      <td style="padding: 8px; text-align: center;">
  <template v-if="group.type === 'field'">
    เวลา: {{ formatTimeRange(group.items[0].startTime, group.items[0].endTime) }}
  </template>
  <template v-else-if="group.type === 'equipment'">
    <ul style="list-style:none; padding:0; margin:0;">
      <li v-for="item in group.items" :key="item.id">
        {{ item.quantity || '-' }}
      </li>
    </ul>
  </template>
</td>
      <td style="padding: 8px; text-align: center;">
        <template v-if="group.items[0].status === 'Canceled'">
          <span class="canceled-status">🚫 Canceled</span>
        </template>
        <template v-else-if="group.items[0].status === 'Disapproved'">
          <span class="disapproved-status">❌ Disapproved</span>
        </template>
        <template v-else-if="group.items[0].status === 'Approved'">
          <span class="approved-status">✅ Approved</span>
        </template>
        <template v-else-if="group.items[0].status === 'Returned'">
          <span class="returned-status">👍 Returned</span>
        </template>
        <template v-else-if="group.items[0].status === 'Pending'">
          <span class="pending-status">⏳ Pending</span>
        </template>
        <template v-else-if="group.items[0].status === 'Return-pending'">
          <span class="return-pending-status">📦 Return-pending</span>
        </template>
        <template v-else>
          <span>{{ group.items[0].status }}</span>
        </template>
      </td>
      <td style="padding: 8px; text-align: center;">
        <button
          v-if="group.type === 'field' && group.items[0].status === 'Pending'"
          class="cancel-btn"
          @click="cancelItem(group.items[0].id)"
          style="margin-right: 4px;"
        >
          Cancel
        </button>
        <button
          v-if="group.type === 'equipment' && group.items.every(item => item.status === 'Pending')"
          class="cancel-btn"
          @click="cancelGroup(group)"
          style="margin-right: 4px;"
        >
          Cancel
        </button>
        <button class="remark-btn" @click="detailGroup(group)">Detail</button>
        <button
          v-if="showReturnButton(group)"
          class="return-btn"
          @click="returnItemGroup(group)"
          style="margin-left: 4px;"
        >
          Return
        </button>
      </td>
    </tr>
  </tbody>
</table>
</div>


          <div class="pagination-control" style="margin-top: 16px;">
            <button @click="prevPage" :disabled="currentPage === 1">ย้อนกลับ</button>
            <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages">ถัดไป</button>
          </div>
        </div>
      </div>

      <!-- ==== MODAL กล้อง ==== -->
      <div
        v-if="showCamera"
        style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: black; z-index: 2000; display: flex; align-items: center; justify-content: center;"
      >
        <video
          ref="cameraVideo"
          autoplay
          playsinline
          muted
          style="width: 100vw; height: 100vh; object-fit: contain; background: black;"
        ></video>
        <canvas ref="cameraCanvas" style="display: none;"></canvas>
        <div
          style="position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; gap: 20px;"
        >
          <button
            @click="takePhoto"
            style="background: #1d4ed8; color: white; border: none; padding: 14px 48px; border-radius: 30px; font-weight: 700; font-size: 1.2rem; cursor: pointer;"
          >
            ถ่ายรูป
          </button>
          <button
            @click="cancelCamera"
            style="background: #888; color: white; border: none; padding: 14px 48px; border-radius: 30px; font-weight: 700; font-size: 1.2rem; cursor: pointer;"
          >
            ยกเลิก
          </button>
        </div>
        <div
          v-if="cameraImage"
          style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: black; display: flex; align-items: center; justify-content: center;"
        >
          <img
            :src="cameraImage"
            alt="Photo"
            style="width: 100vw; height: 100vh; object-fit: contain; background: black;"
          />
          <div
            style="position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; gap: 24px;"
          >
            <button
              @click="submitReturnPhoto"
              style="background: #22c55e; color: white; border: none; padding: 14px 48px; border-radius: 30px; font-weight: 700; font-size: 1.2rem; cursor: pointer;"
            >
              ส่งรูปคืน
            </button>
            <button
              @click="retakePhoto"
              style="background: #888; color: white; border: none; padding: 14px 48px; border-radius: 30px; font-weight: 700; font-size: 1.2rem; cursor: pointer;"
            >
              ถ่ายใหม่
            </button>
          </div>
        </div>
      </div>
      <!-- END MODAL กล้อง fullscreen -->

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
import axios from 'axios'
import Swal from 'sweetalert2'
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// (ถ้าจะใช้ภาษาไทย ต้อง import Sarabun font ที่ bundle มาแล้วใน public หรือ assets ตามตัวอย่างด้านล่าง)
import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'


const API_BASE = import.meta.env.VITE_API_BASE


export default {
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 5,
      isSidebarClosed: false,
      histories: [],
      announcement: "",
      showAnnouncementBar: false,
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      userId: localStorage.getItem('user_id') || '',
      lastCheckedIds: new Set(),
      polling: null,
      products: [],
      showCamera: false,
      cameraStream: null,
      cameraImage: null,
      returnGroupBookingId: null, // booking_id ของกลุ่มที่จะ return
      filterType: 'all', // 'all', 'field', 'equipment'
    }
  },
  
  computed: {
    totalPages() {
  return Math.ceil(this.filteredGroupedHistories.length / this.itemsPerPage);
},

groupedHistories() {
  const histories = this.histories || [];
  const groupMap = {};

  histories.forEach(item => {
    let groupKey = '';
    if (item.type === 'field') {
      groupKey = 'field_' + (item.booking_id || item.id);
    } else if (item.type === 'equipment') {
      groupKey = 'equipment_' + (item.booking_id || item.id);
    }
    if (!groupMap[groupKey]) {
      groupMap[groupKey] = {
        type: item.type,
        items: [],
        booking_id: item.booking_id,
      };
    }
    groupMap[groupKey].items.push(item);
  });

  // กรอง item ในแต่ละกลุ่ม: ถ้ามี returned ให้ตัด approved ทิ้ง
  Object.values(groupMap).forEach(group => {
    const hasReturned = group.items.some(item => item.status === 'Returned');
    if (hasReturned) {
      group.items = group.items.filter(item => item.status !== 'Approved');
    }
  });

  // ฟังก์ชันเลือกวันที่ "ใหม่สุด" ของกลุ่ม
  function getGroupLatestDate(group) {
    const dates = group.items.map(it =>
      new Date(
        it.updatedAt ||
        it.returnedAt ||
        it.approvedAt ||
        it.disapprovedAt ||
        it.createdAt ||
        it.end_date ||
        it.uptodate ||
        it.since ||
        it.date
      )
    ).filter(d => !isNaN(d));
    return dates.length ? Math.max(...dates.map(d => d.getTime())) : 0;
  }

  return Object.values(groupMap).sort((a, b) => getGroupLatestDate(b) - getGroupLatestDate(a));
},


paginatedHistory() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredGroupedHistories.slice(start, start + this.itemsPerPage);
  },

    totalCartItems() {
      return this.products.length;
    },
    filteredGroupedHistories() {
  // ใช้ createdAt (หรือ _id ถ้าไม่มี createdAt) เพื่อเรียง "ใหม่สุดไว้บน"
  function getGroupInsertTime(group) {
    // ในแต่ละกลุ่ม เอาวันที่ insert ใหม่สุด
    return Math.max(...(group.items || []).map(it =>
      it.createdAt
        ? new Date(it.createdAt).getTime()
        : (it._id
            ? new Date(parseInt(String(it._id).substring(0, 8), 16) * 1000).getTime()
            : 0)
    ));
  }

  // filter ตามประเภท (all, field, equipment)
  let arr = this.filterType === 'all'
    ? this.groupedHistories
    : this.groupedHistories.filter(g => g.type === this.filterType);

  // sort: "insert ใหม่สุด" อยู่บน
  return arr.slice().sort((a, b) => getGroupInsertTime(b) - getGroupInsertTime(a));
},

  },


  methods: {
    showFieldDate(history) {
      if (history.type === 'field') {
        if (history.since && history.uptodate) {
          return (
            this.formatDateOnly(history.since) +
            ' - ' +
            this.formatDateOnly(history.uptodate)
          );
        }
        if (history.date) return this.formatDateOnly(history.date);
      }
      return '-';
    },
    formatDateOnly(dateStr) {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },

     formatTime(timeStr) {
    if (!timeStr) return '-';
    // ถ้าเวลาเป็นรูปแบบ "HH:mm" อยู่แล้ว
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    // ถ้าเวลาเป็น string แบบอื่น ๆ เช่น "9:00:00" หรือ Date ISO string
    const date = new Date(`1970-01-01T${timeStr}`);
    if (!isNaN(date)) {
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return timeStr;
  },

  formatTimeRange(start, end) {
    const startFormatted = this.formatTime(start);
    const endFormatted = this.formatTime(end);
    if (startFormatted === '-' && endFormatted === '-') return '-';
    if (startFormatted !== '-' && endFormatted !== '-') {
      return `${startFormatted} - ${endFormatted}`;
    }
    return startFormatted !== '-' ? startFormatted : endFormatted;
  },


    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; },
    prevPage() { if (this.currentPage > 1) this.currentPage--; },
    toggleSidebar() { this.isSidebarClosed = !this.isSidebarClosed },
    toggleNotifications() { this.showNotifications = !this.showNotifications; if (this.showNotifications) this.unreadCount = 0 },
    async loadCart() {
      if (!this.userId) return;
      try { const res = await axios.get(`${API_BASE}/api/cart?user_id=${this.userId}`); this.products = res.data } catch { this.products = [] }
    },
    displayDate(history) {
      if (history.type === 'equipment' && history.date) {
        return this.formatDateOnly(history.date);
      }
      return '-';
    },

    addSortDateToHistories(histories) {
  return histories.map((h, idx) => {
    // รวมวันที่ที่เป็นไปได้ทุกแบบ
    const dateCandidates = [
      h.returnedAt,
      h.updatedAt,
      h.approvedAt,
      h.disapprovedAt,
      h.createdAt,
      h.end_date,
      h.uptodate,
      h.since,
      h.date,
    ].filter(Boolean);

    // หา date ที่ใหม่สุด (มากที่สุด)
    let sortDate = dateCandidates
      .map(d => new Date(d))
      .filter(d => d instanceof Date && !isNaN(d))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!sortDate) sortDate = new Date(0);

    return {
      ...h,
      id: h._id?.$oid || h._id || idx + 1,
      sortDate,
      // กรอก field ที่จำเป็นอื่น ๆ ต่อได้ตามโปรเจคคุณ
      status: this.statusLabel(h.status),
      requester: h.requester || '-',
      attachment: h.attachment || null,
      fileName: h.fileName || null,
      fileType: h.fileType || null,
      returnedBy: h.returnedBy || '-',
      remark: h.remark || '-',
      approvedBy: h.approvedBy || '-',
      disapprovedBy: h.disapprovedBy,
    };
  });
},



    async cancelGroup(group) {
      const confirmed = await Swal.fire({
        title: 'ยืนยันการยกเลิกทั้งหมด?',
        text: 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองอุปกรณ์นี้ทั้งหมด?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#9e9e9e',
        confirmButtonText: 'ใช่, ยกเลิก!',
        cancelButtonText: 'ไม่'
      });
      if (confirmed.isConfirmed) {
        try {
          await Promise.all(group.items.map(item =>
            axios.delete(`${API_BASE}/api/history/${item.id}`)
          ));
          this.histories = this.histories.filter(h => !group.items.some(i => i.id === h.id));
          Swal.fire('ยกเลิกแล้ว!', 'รายการของคุณถูกยกเลิกเรียบร้อยแล้ว', 'success');
        } catch (err) {
          Swal.fire('ผิดพลาด', 'ลบข้อมูลไม่สำเร็จ', 'error');
        }
      }
    },

    async cancelItem(itemId) {
  console.log("กำลังจะยกเลิก", itemId); // <-- เพิ่มตรงนี้
  const confirmed = await Swal.fire({
    title: 'ยืนยันการยกเลิกการจอง?',
        text: 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองสนาม?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ยกเลิก!',
        cancelButtonText: 'ไม่'
  });
  if (confirmed.isConfirmed) {
    try {
      await axios.delete(`${API_BASE}/api/history/${itemId}`);
      this.histories = this.histories.filter(h => h.id !== itemId);
      Swal.fire('ยกเลิกแล้ว!', 'รายการของคุณถูกยกเลิกเรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.log(err); // <-- ดู error
      Swal.fire('ผิดพลาด', 'ลบข้อมูลไม่สำเร็จ', 'error');
    }
  }
},

    detailGroup(group) {
  // ฟังก์ชันแปลงเวลาให้อยู่ในรูปแบบ HH:mm
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    const date = new Date(`1970-01-01T${timeStr}`);
    if (!isNaN(date)) {
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return timeStr;
  };

  // ฟังก์ชันแสดงช่วงเวลา start - end
  const formatTimeRange = (start, end) => {
    const startFormatted = formatTime(start);
    const endFormatted = formatTime(end);
    if (startFormatted === '-' && endFormatted === '-') return '-';
    if (startFormatted !== '-' && endFormatted !== '-') {
      return `${startFormatted} - ${endFormatted}`;
    }
    return startFormatted !== '-' ? startFormatted : endFormatted;
  };

  let html = '';

  if (group.type === 'field') {
    const item = group.items[0];
    const startTime = item.startTime || item.since_time || '';
    const endTime = item.endTime || item.until_thetime || '';

    const timeRange = formatTimeRange(startTime, endTime);

    html = `
      <div style="text-align:left;">
        <b>ชื่อสนาม:</b> ${item.name || '-'}<br>
        <b>ชื่อผู้ขอใช้:</b> ${item.requester || '-'}<br>
        <b>จองให้ผู้ใช้:</b> ${item.proxyStudentName || '-'}<br>
        <b>วันที่:</b> ${item.date ? new Date(item.date).toLocaleDateString() : '-'}<br>
        <b>เวลา:</b> ${timeRange}<br>
        <b>สถานะ:</b> ${item.status || '-'}
        ${item.status === 'Canceled' ? ' 🚫' : ''}
        <br>
        <button id="pdf-btn" class="pdfmake-btn" style="margin-top:10px;">ดาวน์โหลด PDF ฟอร์ม</button>
      </div>
    `;
  } else if (group.type === 'equipment') {
    const firstItem = group.items[0];

    // เช็คว่าเป็นการยืมวันเดียวไหม จาก since และ uptodate
    const isOneDayBorrow = (firstItem.since == null || firstItem.since === '') && (firstItem.uptodate == null || firstItem.uptodate === '');

    // แสดงปุ่ม PDF เฉพาะกรณีที่ไม่ใช่การยืมวันเดียว
    let showPdfButton = !isOneDayBorrow;

    // หาสถานะหลักที่จะแสดง (ถ้ามีหลายสถานะในกลุ่ม)
    let statusToShow = '';
    if (group.items.every(item => item.status === 'Return-pending')) {
      statusToShow = 'Return-pending';
    } else if (group.items.every(item => item.status === 'Returned')) {
      statusToShow = 'Returned';
    } else if (group.items.every(item => item.status === 'Approved')) {
      statusToShow = 'Approved';
    } else if (group.items.every(item => item.status === 'Pending')) {
      statusToShow = 'Pending';
    } else if (group.items.every(item => item.status === 'Disapproved')) {
      statusToShow = 'Disapproved';
    } else {
      const shown = group.items.filter(it => this.itemShowCondition(it, group));
      statusToShow = shown.length > 0 ? shown[0].status : '';
    }

    const shownItems = group.items.filter(item => item.status === statusToShow);

    html = '<div style="text-align:left;">';
    if (shownItems.length === 0) {
      html += `<div>ไม่มีรายการ</div>`;
    } else {
      shownItems.forEach((item, i) => {
        html += `
          <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #bbb;">
            <b>อุปกรณ์ที่ ${i + 1}:</b> ${item.name || '-'}<br>
            <b>จำนวน:</b> ${item.quantity || '-'}<br>
            <b>ชื่อผู้ขอใช้:</b> ${item.requester || '-'}<br>
            <b>วันที่ขอยืม:</b> ${item.date ? new Date(item.date).toLocaleDateString() : '-'}<br>
            <b>สถานะ:</b> ${item.status || '-'}<br>
            <b>วันที่คืน:</b> ${item.returnedAt ? this.formatDateOnly(item.returnedAt) : '-'}<br>
            ${
              (item.status === "Returned" || item.status === "Return-pending") && item.attachment
                ? `<div style="margin-top:6px;">
                    <img src="${item.attachment}" style="max-width:180px;max-height:120px;object-fit:contain;border-radius:10px;border:1.5px solid #bbb;cursor:pointer" 
                      onclick="window.__showFullReturnPhoto && window.__showFullReturnPhoto('${item.attachment}')">
                    <div style="font-size:0.9em;color:#888;margin-top:0.3em;">(คลิกที่รูปเพื่อดูแบบเต็มจอ)</div>
                  </div>`
                : ''
            }
          </div>
        `;
      });
    }
    if (showPdfButton) {
      html += `<button id="pdf-btn" class="pdfmake-btn" style="margin-top:10px;">ดาวน์โหลด PDF ฟอร์ม</button>`;
    }
    html += '</div>';
  }

  Swal.fire({
    title: 'รายละเอียดรายการ',
    html,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3085d6',
    didOpen: () => {
      // BIND CLICK ให้ปุ่ม PDF เฉพาะกรณีที่ปุ่มมีอยู่จริง
      const pdfBtn = document.getElementById('pdf-btn');
      if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
          this.exportPdf(group.items[0]);
        });
      }
      // ฟังก์ชันดูรูปเต็มจอ
      window.__showFullReturnPhoto = (img) => {
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
              <img src="${img}" alt="รูปคืนอุปกรณ์" />
            </body>
          </html>
        `);
      }
    },
    willClose: () => {
      window.__showFullReturnPhoto = undefined;
    }
  });
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
      doc.text('แบบฟอร์มขออนุมัติใช้สถานที่ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง', 80, 48);

      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11);
      doc.text('โทร 053-917820-1 | E-mail: sport-complex@mfu.ac.th', 180, 68);

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
        y += 20;
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
    async returnItemGroup(group) {
      this.showCamera = true;
      this.returnGroupBookingId = group.booking_id;
      await this.$nextTick();
      this.openCamera();
    },
    retakePhoto() {
      this.cameraImage = null;
      this.openCamera();
    },
    openCamera() {
      const video = this.$refs.cameraVideo;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
          this.cameraStream = stream;
          video.srcObject = stream;
        });
      }
    },
    takePhoto() {
      const video = this.$refs.cameraVideo;
      const canvas = this.$refs.cameraCanvas;
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.cameraImage = canvas.toDataURL('image/png');
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => track.stop());
        this.cameraStream = null;
      }
    },
    cancelCamera() {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => track.stop());
        this.cameraStream = null;
      }
      this.showCamera = false;
      this.cameraImage = null;
      this.returnGroupBookingId = null;
    },async submitReturnPhoto() {
      if (!this.cameraImage || !this.returnGroupBookingId) return;
      const ids = this.histories
        .filter(h => h.booking_id === this.returnGroupBookingId)
        .map(h => h.id);
      try {
        await Promise.all(
          ids.map(id =>
            axios.patch(
              `${API_BASE}/api/history/${id}/request-return`,
              {
                attachment: this.cameraImage,
                fileName: "return_photo.png",
                fileType: "image/png"
              }
            )
          )
        );
        this.histories = this.histories.map(h =>
          ids.includes(h.id) ? { ...h, status: 'Return-pending' } : h
        );
        this.showCamera = false;
        this.cameraImage = null;
        this.returnGroupBookingId = null;
        this.$swal('ส่งสำเร็จ!', 'ขอคืนอุปกรณ์เรียบร้อย', 'success');
      } catch (err) {
        this.$swal('ผิดพลาด', 'ส่งข้อมูลไม่สำเร็จ', 'error');
      }
    },

    async fetchNotifications() {
  if (!this.userId) return;
  try {
    const res = await axios.get(`${API_BASE}/api/history?user_id=${this.userId}`);
    const newNotis = res.data.filter(item =>
      (['approved', 'disapproved', 'cancel', 'canceled', 'returned'].includes((item.status || '').toLowerCase())) &&
      !this.lastCheckedIds.has(item._id)
    );
    if (newNotis.length) {
      const newMessages = newNotis.map(item => ({
  id: item._id,
  type: (item.status || '').toLowerCase(),
  // ลองเอา updatedAt, returnedAt, approvedAt หรือ date ที่ใหม่สุดมาใช้ (ต้องมีฟิลด์ใน DB)
  timestamp: item.returnedAt
    ? new Date(item.returnedAt).getTime()
    : item.updatedAt
    ? new Date(item.updatedAt).getTime()
    : item.approvedAt
    ? new Date(item.approvedAt).getTime()
    : item.date
    ? new Date(item.date).getTime()
    : Date.now(),
  message: `รายการ '${item.name}' ของคุณ${
    (item.status || '').toLowerCase() === 'approved'
      ? ' ได้รับการอนุมัติ'
      : (item.status || '').toLowerCase() === 'disapproved'
      ? ' ไม่ได้รับการอนุมัติ'
      : (item.status || '').toLowerCase() === 'cancel' || (item.status || '').toLowerCase() === 'canceled'
      ? ' ถูกยกเลิก'
      : (item.status || '').toLowerCase() === 'returned'
      ? ' คืนของสำเร็จแล้ว'
      : ''
  }`
}));


      // Merge, filter duplicates, sort ใหม่สุดอยู่บน
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      newNotis.forEach(item => this.lastCheckedIds.add(item._id));
      this.unreadCount = this.notifications.length;
    }
  } catch (err) {}
},  closeNotifications() {
    this.showNotifications = false
  },

    statusLabel(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved': return 'Approved';
    case 'pending': return 'Pending';
    case 'returned': return 'Returned';
    case 'return-pending': return 'Return-pending';
    case 'disapproved': return 'Disapproved';
    case 'canceled':
    case 'cancel':
      return 'Canceled';  
    default: return status;
  }
},
    showReturnButton(group) {
      // ปุ่ม Return เดียวต่อกลุ่ม: ทุกชิ้น approved และยังไม่มีตัวไหน return-pending หรือ returned
      return (
        group.type === 'equipment' &&
        group.items.length > 0 &&
        group.items.every(item => item.status === 'Approved') &&
        !group.items.some(item => item.status === 'Returned' || item.status === 'Return-pending')
      )
    },
    itemShowCondition(item, group) {
      // ถ้าในกลุ่มมีอุปกรณ์ที่มีสถานะ Return-pending หรือ Returned จะซ่อน Approved
      const groupHasReturned = group.items.some(it =>
        it.status === 'Return-pending' || it.status === 'Returned'
      );
      if (groupHasReturned) {
        return item.status !== 'Approved';
      }
      return true;
    }
  },
  async mounted() {
  try {
    const userId = localStorage.getItem('user_id');
    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`);
    // ใช้ฟังก์ชันแยกเพื่อความเรียบร้อย
    this.histories = this.addSortDateToHistories(res.data);
    this.currentPage = 1;
  } catch (err) {
    this.histories = [];
  }

  // โหลดประกาศ
  try {
    const annRes = await axios.get(`${API_BASE}/api/announcement`);
    this.announcement = annRes.data?.announce || "";
    this.showAnnouncementBar = !!this.announcement;
  } catch {
    this.announcement = "";
    this.showAnnouncementBar = false;
  }

  // โหลดแจ้งเตือนและตะกร้า
  this.fetchNotifications();
  this.polling = setInterval(this.fetchNotifications, 30000);

  await this.loadCart();
},
watch: {
  filterType() {
    this.currentPage = 1;
  }
},
  beforeUnmount() {
    clearInterval(this.polling);
  }


};
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: #333;
}
.hist-col {
  flex: 1;
  text-align: center;
  min-width: 100px;
}
.status-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.cancel-btn {
  padding: 4px 10px;
  background-color: #ff4d4f;
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
.return-btn {
  padding: 4px 10px;
  background-color: #03a9f4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.3s;
}
.return-btn:hover {
  background-color: #0277bd;
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
/* .remark-btn {
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
.remark-btn:hover {
  background-color: #4268a3;
} */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  transform: translateY(0%);
  opacity: 1;
}
.announcement-bar {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 3000;
  max-width: var(--announcement-width, 100vw);
  margin-left: auto;
  margin-right: auto;
  right: 0;
  background: linear-gradient(90deg, #ff0000 60%, #ffd6c0 100%);
  color: #ffffff;
  padding: 1rem 2rem;
  font-size: 1.15rem;
  font-weight: bold;
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  box-shadow: 0 4px 18px rgba(255, 80, 80, 0.13);
  border-radius: 12px;
}
.announcement-bar-text {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.close-announcement-btn {
  background: none;
  border: none;
  color: #bf0c0c;
  font-size: 1.5rem;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: color 0.15s;
}
.close-announcement-btn:hover {
  color: #222;
}
.canceled-status {
  color: #e63946;
  font-weight: bold;
  padding: 2px 12px;
  background: #fff0f0;
  border-radius: 10px;
  display: inline-block;
  font-size: 1rem;
}
.approved-status {
  color: #218838;
  font-weight: bold;
  padding: 2px 12px;
  background: #e0ffe5;
  border-radius: 10px;
  display: inline-block;
  font-size: 1rem;
}
.disapproved-status {
  color: #f39c12;
  font-weight: bold;
  padding: 2px 12px;
  background: #fff7e0;
  border-radius: 10px;
  display: inline-block;
  font-size: 1rem;
}
.returned-status {
  color: #1557b2;
  font-weight: bold;
  padding: 2px 12px;
  background: #e0f0ff;
  border-radius: 10px;
  display: inline-block;
  font-size: 1rem;
}
.pending-status {
  color: #0074d9;
  font-weight: bold;
  padding: 2px 12px;
  background: #e8f2ff;
  border-radius: 10px;
  display: inline-block;
  font-size: 1rem;
}
.return-pending-status {
  color: #bf7302;
  font-weight: bold;
  padding: 2px 12px;
  background: #fff5e0;
  border-radius: 10px;
  display: inline-block;
  font-size: 1rem;
}
.filter-btn {
  padding: 8px 24px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 20px;
  border: 2px solid #1976d2;
  background: #fff;
  color: #1976d2;
  margin: 0 4px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.filter-btn.active,
.filter-btn:hover {
  background: #1976d2;
  color: #fff;
}
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* เลื่อนลื่นบนมือถือ */
  /* ถ้าต้องการไม่ให้ขึ้น scrollbar ตลอดเวลา ให้ใส่: */
  /* scrollbar-width: thin; */ /* Firefox */
}

.table-wrapper table {
  min-width: 700px; /* หรือขนาดขั้นต่ำที่เหมาะสม */
  white-space: nowrap; /* หลีกเลี่ยงการ wrap */
}



/* ===== CSS แจ้งเตือนแบบ history ===== */
.notification-dropdown {
  position: absolute;
  right: 0;
  top: 38px;
  background: #fff;
  border-radius: 18px 0 18px 18px;
  box-shadow:
    0 8px 24px 0 rgba(27, 50, 98, 0.14),
    0 2px 4px 0 rgba(33, 125, 215, 0.06);
  min-width: 330px;
  max-width: 370px;
  max-height: 420px;
  overflow-y: auto;
  z-index: 1002;
  padding: 0;
  border: none;
  animation: fadeDown 0.22s;
}
@keyframes fadeDown {
  0% { opacity: 0; transform: translateY(-24px);}
  100% { opacity: 1; transform: translateY(0);}
}
.notification-dropdown ul {
  padding: 0;
  margin: 0;
  list-style: none;
}
.notification-dropdown li {
  background: linear-gradient(90deg, #f6fafd 88%, #e2e7f3 100%);
  margin: 0.2em 0.8em;
  padding: 0.85em 1.1em;
  border-radius: 12px;
  border: none;
  font-size: 1.07rem;
  font-weight: 500;
  color: #1e2c48;
  box-shadow: 0 2px 8px 0 rgba(85, 131, 255, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  cursor: default;
  transition: background 0.2s;
}
.notification-dropdown li:not(:last-child) {
  margin-bottom: 0.15em;
}
.notification-dropdown li::before {
  content: "🔔";
  font-size: 1.2em;
  margin-right: 7px;
  color: #1976d2;
  opacity: 0.80;
}
.notification-dropdown li.no-noti {
  background: #f2f3f6;
  color: #a7aab7;
  justify-content: center;
  font-style: italic;
}
.notification-dropdown::-webkit-scrollbar {
  width: 7px;
}
.notification-dropdown::-webkit-scrollbar-thumb {
  background: #e1e7f5;
  border-radius: 10px;
}
.notification-dropdown::-webkit-scrollbar-track {
  background: transparent;
}
.notification-item.approved {
  background: linear-gradient(90deg, #e9fbe7 85%, #cbffdb 100%);
  border-left: 4px solid #38b000;
  color: #228c22;
}
.notification-item.disapproved {
  background: linear-gradient(90deg, #ffeaea 85%, #ffd6d6 100%);
  border-left: 4px solid #ff6060;
  color: #b91423;
}
.notification-item.canceled,
.notification-item.cancel {
  background: linear-gradient(90deg, #f9d7d7 80%, #e26a6a 100%);
  border-left: 4px solid #bb2124;
  color: #91061a;
}
.notification-item.returned {
  background: linear-gradient(90deg, #e0f0ff 85%, #b6e0ff 100%);
  border-left: 4px solid #1976d2;
  color: #1976d2;
}
.notification-item {
  transition: background 0.3s, border-color 0.3s, color 0.3s;
}

.notification-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent;
  z-index: 1001; /* ต้องน้อยกว่า .notification-dropdown (1002) */
}

.history-table th,
.history-table td {
  border-bottom: 1px solid #ddd;
  padding: 8px;
  font-size: 0.95rem;
}

.history-table th {
  background-color: #1e3a8a;
  color: white;
  text-align: center;
}

.history-table tbody tr:hover {
  background-color: #f0f4ff;
}

.cancel-btn {
  padding: 4px 8px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.cancel-btn:hover {
  background-color: #d9363e;
}

.remark-btn {
  background-color: #213555;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 0.9rem;
}
.remark-btn:hover {
  background-color: #4268a3;
}

/* .return-btn {
  padding: 4px 8px;
  background-color: #1eac36;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.return-btn:hover {
  background-color: #178129;
} */

/* สถานะต่าง ๆ ให้อยู่ในตาราง */
.canceled-status,
.approved-status,
.disapproved-status,
.returned-status,
.pending-status,
.return-pending-status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 0.9rem;
}


.history-table {
  background-color: white; /* ใส่พื้นหลังสีขาวให้ตาราง */
  border-radius: 12px; /* เพิ่มมุมโค้งเพื่อให้สวยขึ้น */
  overflow: hidden; /* ซ่อนมุมที่เกิน */
  box-shadow: 0 4px 10px rgb(0 0 0 / 0.1); /* เงาเล็กน้อย */
}

.history-table tbody tr {
  background-color: white; /* พื้นหลังสีขาวแต่ละแถว */
}

.history-table td.col-center ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.history-table td.col-center li {
  text-align: center;
  width: 100%;
}

@media (max-width: 540px) {
  .table-x-scroll {
    /* บังคับ scrollbar แนวนอน */
    overflow-x: auto;
  }
  .history-table {
    min-width: 700px;
    white-space: nowrap;
  }
}


</style>

<style>
@import '../css/style.css';
</style>