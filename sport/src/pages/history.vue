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
            <table class="history-table" style="width: 90%; margin: 0 auto; border-collapse: collapse;">
              <colgroup>
                <col style="width:13%"><!-- Date -->
                <col style="width:15%"><!-- Type -->
                <col style="width:18%"><!-- Name -->
                <col style="width:15%"><!-- Time/Amount -->
                <col style="width:15%"><!-- Status -->
                <col style="width:15%"><!-- Action -->
              </colgroup>

              <thead>
                <tr>
                  <th style="border-bottom: 2px solid #ccc; padding: 8px;">Date</th>
                  <th style="border-bottom: 2px solid #ccc; padding: 8px;">Type</th>
                  <th class="name-col" style="border-bottom: 2px solid #ccc; padding: 8px;">Name</th>
                  <th style="border-bottom: 2px solid #ccc; padding: 8px;">Time/Amount</th>
                  <th class="status-head" style="border-bottom: 2px solid #ccc; padding: 8px;">Status</th>
                  <th class="action-head" style="border-bottom: 2px solid #ccc; padding: 8px;">Action</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(group, idx) in paginatedHistory"
                  :key="group.type + '_' + (group.booking_id || idx)"
                >
                  <!-- Date -->
                  <td style="padding: 8px; text-align: center;">
  {{ formatDateOnly(getGroupCreatedAt(group)) }}
</td>

                  <!-- Type -->
                  <td style="padding: 8px; text-align: center; text-transform: capitalize;">
                    {{ group.type }}
                  </td>

                  <!-- Name -->
                  <td class="name-cell" style="padding: 8px; max-width: 300px;">
                    <template v-if="group.type === 'field'">
                      {{ group.items[0].name }}
                    </template>
                    <template v-else>
                      {{ group.items.map(item => item.name).join(', ') }}
                    </template>
                  </td>

                  <!-- Time/Amount -->
                  <td style="padding: 8px; text-align: center;">
                    <template v-if="group.type === 'field'">
                      {{ formatTimeRange(group.items[0].startTime + ' น.', group.items[0].endTime + ' น.') }}
                    </template>
                    <template v-else-if="group.type === 'equipment'">
                      <span>{{ group.items.map(item => item.quantity || '-').join(', ') }}</span>
                    </template>
                  </td>

                  <!-- Status -->
                  <td class="status-cell">
                    <template v-if="group.items[0].status === 'Canceled'">
                      <span class="canceled-status">Cancelled</span>
                    </template>
                    <template v-else-if="group.items[0].status === 'Disapproved'">
                      <span class="disapproved-status">Disapproved</span>
                    </template>
                    <template v-else-if="group.items[0].status === 'Approved'">
                      <span class="approved-status">Approved</span>
                    </template>
                    <template v-else-if="group.items[0].status === 'Returned'">
                      <span class="returned-status">Returned</span>
                    </template>
                    <template v-else-if="group.items[0].status === 'Pending'">
                      <span class="pending-status">Pending</span>
                    </template>
                    <template v-else-if="group.items[0].status === 'Return-pending'">
                      <span class="return-pending-status">Return-pending</span>
                    </template>
                    <template v-else>
                      <span>{{ group.items[0].status }}</span>
                    </template>
                  </td>

                  <!-- Action: ช่องซ้าย = Cancel/Return (ช่องเดียวกัน), กลาง = Detail, ขวา = ที่ว่าง -->
                  <td class="action-cell">
                    <div class="action-grid">
                      <!-- ช่องที่ 1: Cancel หรือ Return -->
                      <template v-if="showCancelButton(group)">
                        <button class="cancel-btn" @click="cancelForGroup(group)">Cancel</button>
                      </template>
                      <template v-else-if="showReturnButton(group)">
                        <button class="return-btn" @click="returnItemGroup(group)">Return</button>
                      </template>
                      <span v-else class="btn-placeholder"></span>

                      <!-- ช่องที่ 2: Detail (อยู่ตรงกลางเสมอ) -->
                      <button class="remark-btn" @click="detailGroup(group)">Detail</button>

                      <!-- ช่องที่ 3: เว้นว่างคงตำแหน่ง -->
                      <span class="btn-placeholder"></span>
                    </div>
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
  v-if="cameraPreviewUrl"
  style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: black; display: flex; align-items: center; justify-content: center;"
>
  <img
    :src="cameraPreviewUrl"
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
      cameraPreviewUrl: null,   // ใช้โชว์รูปตัวอย่างบนจอ
      cameraBlob: null,
      returnGroupBookingId: null, // booking_id ของกลุ่มที่จะ return
      filterType: 'all', // 'all', 'field', 'equipment'
      isSubmittingReturnPhoto: false, // <<== ตัวแปรป้องกันการส่งซ้ำ
      refreshTimer: null,   // ⬅ ใช้ setInterval
      _lastSnapshot: '',
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

      // 1) ถ้ามี returned อย่างน้อย 1 ชิ้น ให้โชว์เฉพาะ returned
      Object.values(groupMap).forEach(group => {
        const hasReturned = group.items.some(it => (it.status || '').toLowerCase() === 'returned');
        if (hasReturned) {
          group.items = group.items.filter(it => (it.status || '').toLowerCase() === 'returned');
        }
      });

      // 2) ถ้ากลุ่มมีทั้ง approved และ return-pending ให้โชว์เฉพาะ return-pending
      Object.values(groupMap).forEach(group => {
        const statuses = group.items.map(it => (it.status || '').toLowerCase());
        const hasReturnPending = statuses.includes('return-pending');
        const hasApproved      = statuses.includes('approved');
        if (hasReturnPending && hasApproved) {
          group.items = group.items.filter(it => (it.status || '').toLowerCase() === 'return-pending');
        }
      });

      // ฟังก์ชันเลือกวันที่ใหม่สุดของกลุ่ม (ตามของเดิม)
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
getGroupCreatedAt(group) {
  // เลือก createdAt ที่ใหม่สุดภายในกลุ่ม เพื่อให้ตรงกับการ sort
  const dates = (group.items || [])
    .map(it => new Date(it.createdAt))
    .filter(d => d instanceof Date && !isNaN(d));

  if (!dates.length) return null; // ให้ formatDateOnly จัดการคืน '-'
  const latest = new Date(Math.max(...dates.map(d => d.getTime())));
  return latest; // formatDateOnly รองรับ Date object ได้
},

    buildReturnPayload(bookingId) {
  // ดึงรายการทั้งหมดของ booking นี้ (เลือกตัวที่อนุมัติไว้ก่อน)
  const items = (this.histories || []).filter(h => String(h.booking_id) === String(bookingId));
  const src = items.find(i => (i.status || '').toLowerCase() === 'approved') || items[0] || {};

  // ระวังคีย์สะกดต่างกันบ้าง เช่น proxyStudentId/ID
  const payload = {};
  const FIELDS = [
    'user_id', 'booking_id', 'type', 'zone', 'name',
    'since', 'uptodate', 'date', 'quantity',
    'requester', 'username_form',
    'proxyStudentName', 'proxyStudentId', 'proxyStudentID',
    'id_form', 'agency',
    'approvedBy', 'approvedById',
    'bookingPdfUrl', 'booking_pdf_url'
  ];
  FIELDS.forEach(k => {
    if (src[k] !== undefined && src[k] !== null && src[k] !== '') payload[k] = src[k];
  });

  // บังคับบางค่าให้มี
  if (!payload.type) payload.type = src.type || 'equipment';
  payload.status = 'Return-pending';     // เผื่อฝั่งแบ็กเอนด์อยากใช้ค่า status จาก client

  return payload;
},
    setStatusWidthToReturnPending() {
      this.$nextTick(() => {
        const root = this.$el || document;
        const rp = root.querySelector('.history-table .return-pending-status');

        let targetWidth = 0;
        if (rp) {
          targetWidth = rp.offsetWidth;
        } else {
          const all = Array.from(
            root.querySelectorAll('.history-table .status-cell span')
          );
          targetWidth = all.reduce((mx, el) => Math.max(mx, el.offsetWidth), 0);
        }

        if (targetWidth > 0) {
          document.documentElement.style.setProperty(
            '--status-w',
            `${Math.ceil(targetWidth)}px`
          );
        }
      });
    },

    // --- helpers เดิมคงไว้ ---
    normalizePdfUrl(raw) {
      if (!raw) return null;
      let u = String(raw).trim();

      // ทำ absolute ให้หมด
      if (!/^https?:\/\//i.test(u)) {
        u = new URL(u.startsWith('/') ? u : `/${u}`, window.location.origin).href;
      }
      // อัปเกรดเป็น https ถ้าหน้าเป็น https
      if (location.protocol === 'https:' && u.startsWith('http://')) {
        u = 'https://' + u.slice('http://'.length);
      }
      return u;
    },

    pickPdfUrlFromGroupItems(items) {
      if (!Array.isArray(items)) return null;

      // 1) ฟิลด์ตรง ๆ
      const hitDirect = items.find(h => h?.bookingPdfUrl || h?.booking_pdf_url);
      if (hitDirect) return hitDirect.bookingPdfUrl || hitDirect.booking_pdf_url;

      // 2) แนบไฟล์ (ทั้ง array และ string เดี่ยว)
      const hitAttach = items.find(h =>
        (Array.isArray(h?.attachment) && h.attachment.length > 0) ||
        (typeof h?.attachment === 'string' && h.attachment)
      );
      if (hitAttach) {
        return Array.isArray(hitAttach.attachment) ? hitAttach.attachment[0] : hitAttach.attachment;
      }

      // (เผื่อบางระบบใช้ฟิลด์อื่น)
      const hitAlt = items.find(h => h?.pdfUrl || h?.pdf_url || h?.fileUrl);
      if (hitAlt) return hitAlt.pdfUrl || hitAlt.pdf_url || hitAlt.fileUrl;

      return null;
    },

    pickPdfUrl(list) {
      if (!Array.isArray(list)) return null;
      const haveDirect = list.find(h => h?.bookingPdfUrl || h?.booking_pdf_url) || null;
      if (haveDirect) return haveDirect.bookingPdfUrl || haveDirect.booking_pdf_url || null;
      const haveAttach = list.find(h => Array.isArray(h?.attachment) && h.attachment[0]);
      return haveAttach ? haveAttach.attachment[0] : null;
    },

    getFileNameFromUrl(u, fallback = 'booking.pdf') {
      try {
        const { pathname } = new URL(u);
        const name = decodeURIComponent(pathname.split('/').pop() || '');
        return name || fallback;
      } catch { return fallback; }
    },

    async _downloadFromUrl(finalUrl, fallbackName) {
      const resp = await fetch(finalUrl, { credentials: 'include' });
      if (!resp.ok) throw new Error('DIRECT_DOWNLOAD_FAILED');
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = this.getFileNameFromUrl(finalUrl, fallbackName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    },

    async _downloadFromApi(bookingId) {
      // แบบ query
      try {
        const r1 = await axios.get(`${API_BASE}/api/history/pdf`, {
          params: { booking_id: bookingId },
          responseType: 'blob'
        });
        const url = URL.createObjectURL(new Blob([r1.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `booking_${bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      } catch {}

      // แบบ path
      const r2 = await axios.get(`${API_BASE}/api/history/pdf/${bookingId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r2.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking_${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },

    async downloadPdfFromGroup(group) {
      try {
        const bookingId = group?.booking_id;
        if (!bookingId) {
          await Swal.fire('ผิดพลาด', 'ไม่พบ booking_id', 'error');
          return;
        }

        // 1) ดึง URL จาก items ในกลุ่มที่แสดงบนหน้า
        const picked = this.pickPdfUrlFromGroupItems(group.items || []);
        const finalUrl = this.normalizePdfUrl(picked);

        // 2) ถ้ามี URL → ดาวน์โหลดตรง (บังคับเซฟไฟล์)
        if (finalUrl) {
          try {
            await this._downloadFromUrl(finalUrl, `booking_${bookingId}.pdf`);
            return;
          } catch {
            // 3) ถ้า URL ใช้ไม่ได้ (404/403/CORS) → fallback API
            await this._downloadFromApi(bookingId);
            return;
          }
        }

        // 4) ไม่มี URL ในกลุ่มเลย → fallback API
        await this._downloadFromApi(bookingId);
      } catch (e) {
        await Swal.fire('ผิดพลาด', 'ไม่สามารถดาวน์โหลดไฟล์ได้', 'error');
        console.error(e);
      }
    },

    // ====== ปุ่ม Download PDF form -> ใช้ logic เหมือน form_field4 ======
    async downloadBookingPdfLikeField4(bookingId, type) {
      try {
        if (!bookingId) {
          await Swal.fire('ผิดพลาด', 'ไม่พบ booking_id', 'error');
          return;
        }
        const { data } = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
        const list = (data || []).filter(h => String(h.booking_id) === String(bookingId) && (!type || h.type === type));
        const picked = this.pickPdfUrl(list);
        const finalUrl = this.normalizePdfUrl(picked);

        if (finalUrl) {
          try {
            await this._downloadFromUrl(finalUrl, `booking_${bookingId}.pdf`);
            return;
          } catch {
            await this._downloadFromApi(bookingId);
            return;
          }
        }

        await this._downloadFromApi(bookingId);
      } catch (e) {
        await Swal.fire('ผิดพลาด', 'ไม่สามารถดาวน์โหลดไฟล์ได้', 'error');
        console.error(e);
      }
    },

    showCancelButton(group) {
      if (group.type === 'field') {
        return group.items[0]?.status === 'Pending';
      }
      if (group.type === 'equipment') {
        return group.items.length > 0 && group.items.every(it => it.status === 'Pending');
      }
      return false;
    },

    cancelForGroup(group) {
      if (group.type === 'field') {
        return this.cancelItem(group.items[0].id);
      }
      if (group.type === 'equipment') {
        return this.cancelGroup(group);
      }
    },

    // เดิมมีอยู่แล้ว (ย้ำว่าให้คงไว้เหมือนเดิม)
    showReturnButton(group) {
      return (
        group.type === 'equipment' &&
        group.items.length > 0 &&
        group.items.every(item => item.status === 'Approved') &&
        !group.items.some(item => item.status === 'Returned' || item.status === 'Return-pending')
      );
    },

    _makeSnapshot(rows = []) {
      const lite = (rows || []).map(r => ({
        id: r.id || r._id,
        b: r.booking_id,
        t: r.type,
        n: r.name,
        s: (r.status || '').toLowerCase(),
        ra: r.returnedAt || '',
        ua: r.updatedAt || '',
        aa: r.approvedAt || '',
        da: r.disapprovedAt || '',
        ca: r.createdAt || '',
        q:  r.quantity || ''
      }));
      return JSON.stringify(lite);
    },

    esc (s) {
      return String(s ?? '-')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>')
    },

    async fetchAndRenderHistories() {
      try {
        const userId = localStorage.getItem('user_id');
        const { data } = await axios.get(`${API_BASE}/api/history?user_id=${userId}`);

        const next = this.addSortDateToHistories(data);

        const snap = this._makeSnapshot(next);
        if (snap !== this._lastSnapshot) {
          this.histories = next;
          this.currentPage = 1;
          this._lastSnapshot = snap;
        }
      } catch (e) {
        this.histories = [];
      }

      await this.$nextTick();
      this.setStatusWidthToReturnPending();
    },

    async reloadHistories() {
      await this.fetchAndRenderHistories();
      await this.$nextTick();
      this.setStatusWidthToReturnPending();
    },

    pruneOldNotifications() {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
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
          responseType: 'blob'
        });

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
      if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
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

        let sortDate = dateCandidates
          .map(d => new Date(d))
          .filter(d => d instanceof Date && !isNaN(d))
          .sort((a, b) => b.getTime() - a.getTime())[0];

        if (!sortDate) sortDate = new Date(0);

        return {
          ...h,
          id: h._id?.$oid || h._id || idx + 1,
          sortDate,
          status: this.statusLabel(h.status),
          requester: h.requester || '-',
          attachment: h.attachment || null,
          fileName: h.fileName || null,
          fileType: h.fileType || null,
          returnedBy: h.returnedBy || '-',
          remark: h.remark || '-',           // ใช้ remark ที่จะเอาไปโชว์ใน Detail
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
          Swal.fire('Cancelled', '', 'success');
        } catch (error) {
          Swal.fire('Error', 'Something went wrong', 'error');
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
          await this.fetchAndRenderHistories();
          Swal.fire('Cancelled', '', 'success');
        } catch (error) {
          Swal.fire('Error', 'Something went wrong', 'error');
        }
      }
    },

    // ====== แก้ไขแล้ว: เพิ่มคอลัมน์ Remark ในทั้ง field/equipment ======
    detailGroup(group) {
      const esc = this.esc;
      const fmtDate = (d) => this.formatDateOnly(d);
      const fmtTime = (t) => {
        if (!t) return '-';
        const raw = String(t).trim().replace(/\s*น\.?$/, '');
        if (/^\d{1,2}:\d{2}$/.test(raw)) return `${raw} น.`;
        const dt = new Date(`1970-01-01T${raw}`);
        if (!isNaN(dt)) {
          const hhmm = dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
          return `${hhmm} น.`;
        }
        return `${raw} น.`;
      };
      const fmtTimeRange = (a,b)=>{
        const A = fmtTime(a), B = fmtTime(b);
        if (A==='-' && B==='-') return '-';
        if (A!=='-' && B!=='-') return `${A} - ${B}`;
        return A!=='-' ? A : B;
      };
const fmtDateRange = (a, b) => {
  const A = fmtDate(a), B = fmtDate(b);
  if (A !== '-' && B !== '-') return `${A} - ${B}`;
  if (A !== '-') return A;
  if (B !== '-') return B;
  return '-';
};

      let html = '';

      if (group.type === 'field') {
        const it = group.items[0] || {};
        const startTime = it.startTime || it.since_time || '';
        const endTime   = it.endTime   || it.until_thetime || '';
        const timeRange = fmtTimeRange(startTime, endTime);
const dateCell =
  (it.since || it.uptodate)
    ? fmtDateRange(it.since, it.uptodate)   // ใช้ช่วง since - uptodate
    : fmtDate(it.date);                      // fallback เป็น date เดิม

        html = `
          <div class="swal-table-wrap">
            <table class="swal-table">
              <colgroup>
                <col style="width:16%">
                <col style="width:22%">
                <col style="width:16%">
                <col style="width:16%">
                <col style="width:14%">
                <col style="width:16%">  <!-- Remark -->
              </colgroup>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${esc(it.name)}</td>
                  <td>
                    <div><b>Name:</b> ${esc(it.username_form || '-')}</div>
                    <div><b>Book for:</b> ${esc(it.proxyStudentName || '-')}</div>
                  </td>
                  <td class="td-center">${esc(dateCell)}</td>
                  <td class="td-center">${esc(timeRange)}</td>
                  <td class="td-center">${esc(it.status)}</td>
                  <td>${esc(it.remark || '-')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="swal-actions">
            <button id="pdf-btn" class="pdfmake-btn">Download PDF form</button>
          </div>
        `;
      } else {
        // ===== equipment =====
        let statusToShow = '';
        if (group.items.every(i => i.status === 'Return-pending')) statusToShow = 'Return-pending';
        else if (group.items.every(i => i.status === 'Returned'))   statusToShow = 'Returned';
        else if (group.items.every(i => i.status === 'Approved'))   statusToShow = 'Approved';
        else if (group.items.every(i => i.status === 'Pending'))    statusToShow = 'Pending';
        else if (group.items.every(i => i.status === 'Disapproved'))statusToShow = 'Disapproved';
        else statusToShow = (group.items[0]?.status || '');

        const shown = group.items.filter(i => i.status === statusToShow);
        const first = group.items[0] || {};
        const isOneDayBorrow = (!first.since && !first.uptodate);
        const showPdfButton  = !isOneDayBorrow;

       const rows = shown.map((it, idx) => {
  const retDate = it.returnedAt ? fmtDate(it.returnedAt) : '-';

  const borrowerName =
    it.username_form ||
    (group.items?.[0]?.username_form) ||
    it.requester || '-';

  const attArr = Array.isArray(it.attachment)
    ? it.attachment
    : (it.attachment ? [it.attachment] : []);

  const firstUrl = attArr[0] || null;

  const retPhotoCell =
    (['Returned','Return-pending'].includes(it.status) && firstUrl)
      ? `
        <img
          src="${firstUrl}"
          alt="return-photo"
          class="swal-thumb"
          onclick="window.__showFullReturnPhoto && window.__showFullReturnPhoto('${firstUrl}')"
        />
        <div class="swal-thumb-hint">(คลิกเพื่อดูรูปเต็ม)</div>
      `
      : '-';

  // *** ใช้ since - uptodate ถ้ามี ไม่งั้น fallback เป็น date เดิม ***
  const dateCell = (it.since || it.uptodate)
    ? fmtDateRange(it.since, it.uptodate)
    : fmtDate(it.date);

  return `
    <tr>
      <td class="td-center">${esc(idx+1)}</td>
      <td>${esc(it.name)}</td>
      <td class="td-center">${esc(it.quantity ?? '-')}</td>
      <td>${esc(borrowerName)}</td>
      <td class="td-center">${esc(dateCell)}</td>
      <td class="td-center">${esc(it.status)}</td>
      <td>${esc(it.remark || '-')}</td>
      <td class="td-center">${retDate}</td>
      <td class="td-center">${retPhotoCell}</td>
    </tr>
  `;
}).join('');


        html = `
          <div class="swal-table-wrap">
            <table class="swal-table">
              <colgroup>
                <col style="width:6%">   <!-- No -->
                <col style="width:20%">  <!-- Equipment -->
                <col style="width:9%">   <!-- Amount -->
                <col style="width:18%">  <!-- Name -->
                <col style="width:11%">  <!-- Date -->
                <col style="width:12%">  <!-- Status -->
                <col style="width:14%">  <!-- Remark -->
                <col style="width:10%">  <!-- Return date -->
                <col style="width:10%">  <!-- Photo -->
              </colgroup>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Equipment</th>
                  <th>Amount</th>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remark</th>         <!-- NEW -->
                  <th>Return date</th>
                  <th>Photo</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td colspan="9" class="td-center">ไม่มีรายการ</td></tr>`}
              </tbody>
            </table>
          </div>
          ${showPdfButton ? `<div class="swal-actions"><button id="pdf-btn" class="pdfmake-btn">Download PDF form</button></div>` : ``}
        `;
      }

      Swal.fire({
        title: 'Detail list',
        html,
        confirmButtonText: 'Close',
        confirmButtonColor: '#3085d6',
        customClass: {
          popup: 'hist-swal',
          title: 'hist-swal-title',
          htmlContainer: 'hist-swal-html'
        },
        didOpen: () => {
          const pdfBtn = document.getElementById('pdf-btn');
          if (pdfBtn) pdfBtn.addEventListener('click', () => this.downloadPdfFromGroup(group));

          // ===== เพิ่มตัวแสดงรูปเต็ม =====
          window.__showFullReturnPhoto = (src) => {
            if (!src) return;
            Swal.fire({
              html: `
                <div class="img-viewer-wrap">
                  <img src="${src}" alt="photo" class="img-viewer"/>
                  <div class="img-viewer-actions">
                    <a href="${src}" target="_blank" rel="noopener">เปิดในแท็บใหม่</a>
                  </div>
                </div>
              `,
              showConfirmButton: false,
              showCloseButton: true,
              background: '#000',
              customClass: { popup: 'img-swal' }
            });
          };
        },
        willClose: () => { window.__showFullReturnPhoto = undefined; }
      });
    },

    async returnItemGroup(group) {
      this.showCamera = true;
      this.returnGroupBookingId = group.booking_id;
      await this.$nextTick();
      this.openCamera();
    },

    retakePhoto() {
      if (this.cameraPreviewUrl) {
        URL.revokeObjectURL(this.cameraPreviewUrl);
        this.cameraPreviewUrl = null;
      }
      this.cameraBlob = null;
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

    async takePhoto() {
      const video = this.$refs.cameraVideo;
      const canvas = this.$refs.cameraCanvas;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const canvasToBlob = () => new Promise((resolve) => {
        if (canvas.toBlob) {
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
        } else {
          const dataURL = canvas.toDataURL('image/jpeg', 0.92);
          const byteString = atob(dataURL.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          resolve(new Blob([ab], { type: 'image/jpeg' }));
        }
      });

      this.cameraBlob = await canvasToBlob();

      if (this.cameraPreviewUrl) URL.revokeObjectURL(this.cameraPreviewUrl);
      this.cameraPreviewUrl = URL.createObjectURL(this.cameraBlob);

      if (this.cameraStream) {
        try { this.cameraStream.getTracks().forEach(track => track.stop()); } catch {}
        this.cameraStream = null;
      }
    },

    cancelCamera() {
      try {
        if (this.cameraStream) {
          this.cameraStream.getTracks().forEach(track => track.stop());
          this.cameraStream = null;
        }
      } catch {}
      if (this.cameraPreviewUrl) {
        URL.revokeObjectURL(this.cameraPreviewUrl);
        this.cameraPreviewUrl = null;
      }
      this.cameraBlob = null;
      this.showCamera = false;
      this.returnGroupBookingId = null;
    },

    async submitReturnPhoto() {
  if (this.isSubmittingReturnPhoto) return;
  this.isSubmittingReturnPhoto = true;

  try {
    if (!this.cameraBlob || !this.returnGroupBookingId) {
      await Swal.fire('ผิดพลาด', 'ไม่พบรูปหรือหมายเลขรายการที่ต้องการคืน', 'error');
      return;
    }

    // id ของเอกสารที่จะเปลี่ยนสถานะเป็น return-pending
    const ids = (this.histories || [])
      .filter(h => String(h.booking_id) === String(this.returnGroupBookingId))
      .map(h => h.id);

    if (ids.length === 0) {
      await Swal.fire('ผิดพลาด', 'ไม่พบบันทึกในกลุ่มนี้', 'error');
      return;
    }

    // ดึง "ข้อมูลเดิม" ของรายการที่จะส่งแนบไปพร้อมรูป
    const meta = this.buildReturnPayload(this.returnGroupBookingId);

    const ts = Date.now();
    await Promise.all(ids.map(id => {
      const form = new FormData();
      // แนบรูป
      form.append('attachment', this.cameraBlob, `return_photo_${id}_${ts}.jpg`);
      // แนบฟิลด์ข้อมูลเดิม
      Object.entries(meta).forEach(([k, v]) => {
        form.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      });
      // ส่งไปยังแบ็กเอนด์
      return axios.patch(`${API_BASE}/api/history/${id}/request-return`, form);
    }));

    // ปิดกล้อง/ล้าง state
    if (this.cameraStream) {
      try { this.cameraStream.getTracks().forEach(t => t.stop()); } catch {}
      this.cameraStream = null;
    }
    if (this.cameraPreviewUrl) {
      URL.revokeObjectURL(this.cameraPreviewUrl);
      this.cameraPreviewUrl = null;
    }
    this.cameraBlob = null;
    this.showCamera = false;
    this.returnGroupBookingId = null;

    await this.fetchAndRenderHistories();
    await Swal.fire({
  title: 'ส่งคำขอสำเร็จ',
  html: 'ส่งคำขอคืนอุปกรณ์เรียบร้อย',
  icon: 'success',
  customClass: { htmlContainer: 'swal-center-text' }
});

  } catch (err) {
    console.error(err);
    await Swal.fire('ผิดพลาด', 'ส่งข้อมูลไม่สำเร็จ', 'error');
  } finally {
    this.isSubmittingReturnPhoto = false;
  }
}
,

    async fetchNotifications() {
      if (!this.userId) return;
      try {
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

          this.notifications = [...this.notifications, ...newMessages]
            .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
            .sort((a, b) => b.timestamp - a.timestamp);

          this.pruneOldNotifications();

          newNotis.forEach(item => this.lastCheckedIds.add(item._id));
        }

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
      return (
        group.type === 'equipment' &&
        group.items.length > 0 &&
        group.items.every(item => item.status === 'Approved') &&
        !group.items.some(item => item.status === 'Returned' || item.status === 'Return-pending')
      )
    },

    itemShowCondition(item, group) {
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
      this.lastSeenTimestamp = parseInt(localStorage.getItem('lastSeenTimestamp') || '0');
      this.histories = this.addSortDateToHistories(res.data);
      this.currentPage = 1;
    } catch (err) {
      this.histories = [];
    }

    try {
      const annRes = await axios.get(`${API_BASE}/api/announcement`);
      this.announcement = annRes.data?.announce || "";
      this.showAnnouncementBar = !!this.announcement;
    } catch {
      this.announcement = "";
      this.showAnnouncementBar = false;
    }

    try {
      this.lastSeenTimestamp = parseInt(localStorage.getItem('lastSeenTimestamp') || '0');
      await this.fetchAndRenderHistories();
    } catch {
      this.histories = [];
    }

    await this.fetchNotifications();
    this.polling = setInterval(this.fetchNotifications, 30000);
    await this.loadCart();

    this.refreshTimer = setInterval(this.fetchAndRenderHistories, 8000);
    this._onVisibility = () => { if (!document.hidden) this.fetchAndRenderHistories(); };
    document.addEventListener('visibilitychange', this._onVisibility);
  },

  watch: {
    filterType() {
      this.currentPage = 1;
      this.$nextTick(this.setStatusWidthToReturnPending);
    },
    paginatedHistory() {
      this.$nextTick(this.setStatusWidthToReturnPending);
    }
  },

  beforeUnmount() {
    clearInterval(this.polling);
    clearInterval(this.refreshTimer);
    document.removeEventListener('visibilitychange', this._onVisibility);
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
  color: #ff1900;
  font-weight: bold;
  padding: 2px 12px;
  background: #f1d1d1;
  border-radius: 10px;
  display: inline-block;
  font-size: 1rem;
}
.returned-status {
  color: #f5f5f5;
  font-weight: bold;
  padding: 2px 12px;
  background: #88898a;
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
/* NEW: ให้ข้อความในหัว/เซลล์ตารางของ SweetAlert ห่อบรรทัดได้ดี (รวม Remark) */
.history-table th,
.history-table td {
  word-break: break-word;       /* NEW */
}
:root { --status-w: auto; }

.canceled-status,
.approved-status,
.disapproved-status,
.returned-status,
.pending-status,
.return-pending-status {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: var(--status-w, auto);
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 0.95rem;
  white-space: nowrap;
  box-sizing: border-box;
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
    min-width: 1200px;
    white-space: nowrap;
  }
}
</style>

<style>
/* ----- ปรับกล่อง SweetAlert ----- */
.swal2-popup{
  width:auto;
  max-width:min(720px,92vw);
  padding:24px 26px 22px;
  font-family:inherit;
}
@supports (width:fit-content){ .swal2-popup{ width:fit-content; } }
.swal2-title{ margin-bottom:10px!important; }

/* ----- จัด 2 คอลัมน์: หัวข้อซ้าย-รายละเอียดขวา ----- */
/* ----- ปรับกล่อง SweetAlert: Detail list ----- */
/* === Force left align inside SweetAlert2 content === */
.swal2-html-container{
  text-align: left !important;   /* << เปลี่ยนจาก center เป็น left */
  margin: 0 !important;
  padding: 0 !important;
}

/* กริดรายละเอียด: ให้ตัวกริดเองไม่ถูก center */
.swal2-popup .swal-booking{
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 14px;
  row-gap: 8px;
  justify-items: start;          /* << ให้ทุก cell ชิดซ้าย */
  margin: 0 !important;          /* << ตัด auto-center ทิ้ง */
}

/* label + value ชิดซ้ายจริง ๆ */
.swal2-popup .swal-booking .label,
.swal2-popup .swal-booking .value{
  justify-self: start !important;
  text-align: left !important;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* (ถ้ามี) บรรทัดเต็มหน้ากว้าง */
.swal2-popup .swal-booking .full{ grid-column: 1 / -1; }


.history-table {
  table-layout: fixed;
}

/* หัวคอลัมน์ Name ให้ชิดซ้ายด้วย */
.history-table th.name-col {
  text-align: center !important;
  padding-left: 0;   /* เอา padding ซ้ายออก ไม่ให้หัวข้อเอียงไปซ้าย */
}

/* เซลล์ Name ชิดซ้าย + เว้นซ้ายเท่ากันทุกแถว */
.history-table td.name-cell {
  text-align: left !important;
  padding-left: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


/* ให้คอลัมน์ Action จัดปุ่มเป็น 3 ช่องคงที่ */
.action-cell { padding: 8px; text-align: center; }

.action-grid{
  display: inline-grid;
  grid-template-columns: 68px 84px 84px; /* Cancel | Detail | Return */
  align-items: center;
  column-gap: 8px;
  justify-content: center;
}

/* ทำให้ปุ่มทั้งสามกว้างเท่ากัน */
.action-grid .cancel-btn,
.action-grid .remark-btn,
.action-grid .return-btn,
.action-grid .btn-placeholder{
  width: var(--action-w);
  white-space: nowrap;
}

/* ช่องว่างหลอก: กินพื้นที่เท่าปุ่ม แต่ไม่มองเห็น */
.btn-placeholder{
  visibility: hidden;
  display: inline-block;
  height: 28px;       /* สูงพอกับปุ่ม ดูสวยขึ้น */
}

/* เพิ่มระยะห่างระหว่าง Status กับ Action */
.status-cell{
  text-align: center;
  padding: 8px 24px 8px 8px;   
}
.action-cell{
  text-align: center;
  padding: 8px 8px 8px 24px;   
}

/* ให้หัวข้อ Status อยู่กึ่งกลางคอลัมน์ */
.history-table th.status-head{
  text-align: center !important;
  padding-left: 0 !important;   /* ตัดระยะซ้ายออกเพื่อให้กึ่งกลางจริง */
}

/* คงข้อมูลในช่อง Status ให้ชิดซ้ายตามเดิม */
.history-table td.status-cell{
  text-align: center !important;
  padding-left: 16px !important;
}
/* NEW: ห่อบรรทัดในตาราง modal (Remark อาจยาว) */
.hist-swal .swal-table th,
.hist-swal .swal-table td {
  white-space: normal;          /* NEW */
  word-break: break-word;       /* NEW */
}

.history-table td.action-cell {
  padding-left:90px !important;  
}
</style>

<style>
@import '../css/style.css';

/* === SweetAlert content ให้ชิดซ้าย */
.swal2-html-container{
  text-align: left !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* === Wrapper ให้ตารางเลื่อนใน modal ได้ */
.swal-table-wrap{
  max-width: 92vw;
  max-height: 70vh;
  overflow-x: auto;
  overflow-y: auto;
  padding: 6px 2px 0;
}

/* === ตารางสไตล์ modal */
.swal-table{
  width: 100%;
  min-width: 780px;          /* กันแคบเกินไปในมือถือ */
  border-collapse: collapse;
  table-layout: fixed;       /* colgroup มีผลจริง */
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}

.swal-table thead th{
  background: #1e3a8a;       /* น้ำเงินเข้ม ให้ match ตารางหลัก */
  color: #fff;
  padding: 10px 8px;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1;
}

.swal-table tbody td{
  border-bottom: 1px solid #e6e9f3;
  padding: 8px 10px;
  font-size: 0.95rem;
  vertical-align: top;
  word-break: break-word;
}

.swal-table tbody tr:hover{
  background: #f7f9ff;
}

.td-center{ text-align: center; }

/* รูปตัวอย่างใบคืน */
.swal-thumb{
  max-width: 120px;
  max-height: 85px;
  object-fit: contain;
  border: 1px solid #cfd5e6;
  border-radius: 8px;
  cursor: pointer;
  display: inline-block;
}
.swal-thumb-hint{
  font-size: 0.8rem;
  color: #8a8fa3;
  margin-top: 4px;
}

/* ปุ่มด้านล่าง */
.swal-actions{
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
.pdfmake-btn{
  background: #213555;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
}
.pdfmake-btn:hover{ background:#4268a3; }

/* ===== SweetAlert เฉพาะหน้า History ===== */
.hist-swal.swal2-popup{
  /* กว้างขึ้น แต่ยัง responsive */
  width: 96vw;            /* เดิม 82vw */
  max-width: 1500px;      /* เดิม 1200px */
  padding: 24px;
}
/* ระยะห่างหัวเรื่องเล็กน้อย */
.hist-swal .swal2-title{
  margin-bottom: 12px !important;
}

/* ตัวห่อ table กว้างสุดเท่ากับตัว popup */
/*กว้างตาม popup และเลื่อนถ้าเนื้อหาเยอะ */
.hist-swal .swal-table-wrap{
  max-width: 96vw;
  max-height: 72vh;
  overflow: auto;
  padding: 6px 0 0;
}

/* ปรับตารางให้ไม่บังคับ min-width -> หายสกรอลล์แนวนอนบนเดสก์ท็อป */
.hist-swal .swal-table{
  width: 100%;
  table-layout: auto;     /* เดิมบังคับ fixed */
  min-width: 1100px;      /* กันเบียดหัวคอลัมน์ */
}
.hist-swal .swal-table thead th{
  white-space: nowrap;
}
/* ให้ข้อความห่อบรรทัดได้ ลดโอกาสล้นแนวนอน */
.hist-swal .swal-table th,
.hist-swal .swal-table td{
  white-space: normal;
  word-break: break-word;
}
/* จอใหญ่มาก ๆ ให้กว้างได้อีกนิด */
@media (min-width: 1536px){
  .hist-swal.swal2-popup{ max-width: 1680px; }
}
/* เฉพาะคอลัมน์ตัวเลข/สั้น ๆ ให้อยู่กลางสวย ๆ */
.hist-swal .td-center{ text-align: center; }

/* ปุ่มด้านล่างชิดขวาตามเดิม */
.hist-swal .swal-actions{
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

/* ==== Full image viewer for Detail === */
.img-swal.swal2-popup{
  width: auto;
  max-width: 96vw;
  padding: 8px;
  background: #000;
}
.img-swal .swal2-close{
  color: #fff !important;
  top: 6px;
  right: 10px;
}
.img-viewer-wrap{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:8px;
}
.img-viewer{
  max-width: 92vw;
  max-height: 82vh;
  object-fit: contain;
  background: #000;
  display:block;
}
.img-viewer-actions a{
  color:#cfe3ff;
  text-decoration: underline;
  font-size: 0.95rem;
}

.swal-center-text {
  text-align: center !important;
}


</style>