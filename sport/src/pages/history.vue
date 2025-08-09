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
            >All</button>
            <button
              :class="['filter-btn', { active: filterType === 'field' }]"
              style="margin-left:8px"
              @click="filterType = 'field'"
            >Field</button>
            <button
              :class="['filter-btn', { active: filterType === 'equipment' }]"
              style="margin-left:8px"
              @click="filterType = 'equipment'"
            >Equipment</button>
          </div>


          <div class="table-x-scroll">
          <!-- ตารางแสดงผล -->
         <table class="history-table" style="width: 90%; margin: 0 auto; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">Date</th>
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">Type</th>
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">Name</th>
      
      <!-- <th style="border-bottom: 2px solid #ccc; padding: 8px;">จำนวน</th> -->
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">Time/Amount</th>
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">Status</th>
      <th style="border-bottom: 2px solid #ccc; padding: 8px;">Action</th>
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

      <!-- ประเภท -->
      <td style="padding: 8px; text-align: center; text-transform: capitalize;">
        {{ group.type }}
      </td>
      <!-- <td style="padding: 8px; text-align: center;">
        {{ typeLabel(group.type) }}
      </td> -->


      <td class="col-center" style="padding: 8px; max-width: 300px;">
  <template v-if="group.type === 'field'">
    <div style="text-align:center; width:100%;">{{ group.items[0].name }}</div>
  </template>
  <template v-else>
    <div style="text-align:center;">
      <!-- รวมชื่อและจำนวนใน 1 บรรทัด -->
      {{ group.items.map(item => item.name).join(', ') }}
    </div>
  </template>
</td>

    <!-- เวลา -->
      <td style="padding: 8px; text-align: center;">
  <template v-if="group.type === 'field'">
     {{ formatTimeRange(group.items[0].startTime, group.items[0].endTime) }}
  </template>
  <template v-else-if="group.type === 'equipment'">
    <span>
  {{ group.items.map(item => item.quantity || '-').join(', ') }}
</span>
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
            <button @click="prevPage" :disabled="currentPage === 1">Back</button>
            <span>Pages {{ currentPage }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
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
              :disabled="isSubmittingReturnPhoto"
              style="background: #22c55e; color: white; border: none; padding: 14px 48px; border-radius: 30px; font-weight: 700; font-size: 1.2rem; cursor: pointer;"
            >
              <span v-if="isSubmittingReturnPhoto">กำลังส่ง...</span>
  <span v-else>ส่งรูปคืน</span>
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
      lastSeenTimestamp: 0,
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
       isSubmittingReturnPhoto: false, // <<== ตัวแปรป้องกันการส่งซ้ำ
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

  // ถ้า booking_id เดียวกัน มี status 'returned' อย่างน้อย 1 ชิ้น ให้โชว์เฉพาะ 'returned' เท่านั้น
  Object.values(groupMap).forEach(group => {
    const hasReturned = group.items.some(item => (item.status || '').toLowerCase() === 'returned');
    if (hasReturned) {
      group.items = group.items.filter(item => (item.status || '').toLowerCase() === 'returned');
    }
  });

  

  // ฟังก์ชันเลือกวันที่ "ใหม่สุด" ของกลุ่ม (เหมือนเดิม)
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
     pruneOldNotifications() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 วันย้อนหลัง
    this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
  },
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

    typeLabel(t) {
    const s = (t || '').toLowerCase();
    if (s === 'equipment') return 'อุปกรณ์';
    if (s === 'field') return 'สนาม';
    return t || '-';
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
    toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.lastSeenTimestamp = Date.now();
      localStorage.setItem('lastSeenTimestamp', String(this.lastSeenTimestamp));
      this.unreadCount = 0;
    }
  },
   closeNotifications() { this.showNotifications = false },

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

async reloadHistories() {
  try {
    const userId = localStorage.getItem('user_id');
    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`);
    this.histories = this.addSortDateToHistories(res.data);
    this.currentPage = 1;
  } catch (err) {
    this.histories = [];
  }
},
    async cancelGroup(group) {
  const confirmed = await Swal.fire({
    title: 'Confirm cancellations?',
    text: 'Are you sure you want to cancel all reservations for this list?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#9e9e9e',
    confirmButtonText: 'Yes',
    cancelButtonText: 'No'
  });
  if (confirmed.isConfirmed) {
    try {
      await Promise.all(group.items.map(item =>
        axios.delete(`${API_BASE}/api/history/${item.id}`)
      ));
      await this.reloadHistories(); // <<--- เพิ่มบรรทัดนี้
      Swal.fire('Cancelled!', '', 'success');
    } catch (err) {
      Swal.fire('Error', 'deletion failed', 'error');
    }
  }
},

    async cancelItem(itemId) {
  const confirmed = await Swal.fire({
    title: 'Confirm cancellation?',
    text: 'Are you sure you want to cancel your booking?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes',
    cancelButtonText: 'No'
  });
  if (confirmed.isConfirmed) {
    try {
      await axios.delete(`${API_BASE}/api/history/${itemId}`);
      await this.reloadHistories(); // <<--- เพิ่มบรรทัดนี้
      Swal.fire('Cancelled!', '', 'success');
    } catch (err) {
      Swal.fire('Error', 'deletion failed', 'error');
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
        <b>Field Name:</b> ${item.name || '-'}<br>
        <b>Name:</b> ${item.requester || '-'}<br>
        <b>Book for:</b> ${item.proxyStudentName || '-'}<br>
        <b>Date:</b> ${item.date ? new Date(item.date).toLocaleDateString() : '-'}<br>
        <b>เTime:</b> ${timeRange}<br>
        <b>Status:</b> ${item.status || '-'}
        ${item.status === 'Canceled' ? ' 🚫' : ''}
        <br>
        <button id="pdf-btn" class="pdfmake-btn" style="margin-top:10px;">Dowmload PDF form</button>
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
            <b>Equipment ${i + 1}:</b> ${item.name || '-'}<br>
            <b>Amount:</b> ${item.quantity || '-'}<br>
            <b>Name:</b> ${item.requester || '-'}<br>
            <b>Date:</b> ${item.date ? new Date(item.date).toLocaleDateString() : '-'}<br>
            <b>Status:</b> ${item.status || '-'}<br>
            <b>Return date:</b> ${item.returnedAt ? this.formatDateOnly(item.returnedAt) : '-'}<br>
            ${
              (item.status === "Returned" || item.status === "Return-pending") && item.attachment
                ? `<div style="margin-top:6px;">
                    <img src="${item.attachment}" style="max-width:180px;max-height:120px;object-fit:contain;border-radius:10px;border:1.5px solid #bbb;cursor:pointer" 
                      onclick="window.__showFullReturnPhoto && window.__showFullReturnPhoto('${item.attachment}')">
                    <div style="font-size:0.9em;color:#888;margin-top:0.3em;">(Click on the image to view it in full screen.)</div>
                  </div>`
                : ''
            }
          </div>
        `;
      });
    }
    if (showPdfButton) {
      html += `<button id="pdf-btn" class="pdfmake-btn" style="margin-top:10px;">Download PDF form</button>`;
    }
    html += '</div>';
  }

  Swal.fire({
    title: 'Detail list',
    html,
    confirmButtonText: 'Close',
    confirmButtonColor: '#3085d6',
    didOpen: () => {
      // BIND CLICK ให้ปุ่ม PDF เฉพาะกรณีที่ปุ่มมีอยู่จริง
     const pdfBtn = document.getElementById('pdf-btn');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        this.downloadBookingPdf(group.booking_id);
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
    },
    
    async submitReturnPhoto() {
  if (this.isSubmittingReturnPhoto) return;
  this.isSubmittingReturnPhoto = true;

  if (!this.cameraImage || !this.returnGroupBookingId) {
    this.isSubmittingReturnPhoto = false;
    return;
  }
  const ids = this.histories
    .filter(h => h.booking_id === this.returnGroupBookingId)
    .map(h => h.id);
  try {
    // PATCH ทุก id ที่ booking_id ตรงกัน
    if (ids.length > 0) {
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
    }
    this.showCamera = false;
    this.cameraImage = null;
    this.returnGroupBookingId = null;
    this.$swal('ส่งสำเร็จ!', 'ขอคืนอุปกรณ์เรียบร้อย', 'success');
  } catch (err) {
    this.$swal('ผิดพลาด', 'ส่งข้อมูลไม่สำเร็จ', 'error');
  }
  this.isSubmittingReturnPhoto = false;
},

    async fetchNotifications() {
  if (!this.userId) return;
  try {
    // ตัดของเก่าออกก่อนเสมอ
    this.pruneOldNotifications();

    const res = await axios.get(`${API_BASE}/api/history?user_id=${this.userId}`);
    const newNotis = res.data.filter(item =>
      (['approved', 'disapproved', 'cancel', 'canceled', 'returned']
        .includes((item.status || '').toLowerCase())) &&
      !this.lastCheckedIds.has(item._id)
    );

    if (newNotis.length) {
      const newMessages = newNotis.map(item => ({
        id: item._id,
        type: (item.status || '').toLowerCase(),
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

      // รวม + กันซ้ำ + เรียงใหม่สุดบน
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      // ตัดรายการที่เกิน 7 วันอีกรอบหลังรวม
      this.pruneOldNotifications();

      newNotis.forEach(item => this.lastCheckedIds.add(item._id));
    }

    // นับ unread เฉพาะที่ใหม่กว่าครั้งล่าสุดที่กดเปิดกระดิ่ง
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch (err) {
    // เงียบไว้เหมือนเดิม
  }
},
  
closeNotifications() {
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
     this.lastSeenTimestamp = parseInt(localStorage.getItem('lastSeenTimestamp') || '0');
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
  await this.fetchNotifications();
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