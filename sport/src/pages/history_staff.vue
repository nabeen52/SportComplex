<template>
  <div class="layout">
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/approve_equipment" exact-active-class="active">
          <i class="pi pi-home"></i> อนุมัติ/รับคืนอุปกรณ์
        </router-link>
        <router-link to="/equipment" active-class="active">
          <i class="pi pi-map-marker"></i> อุปกรณ์
        </router-link>
        <router-link to="/history_staff" active-class="active">
          <i class="pi pi-history"></i> ประวัติการทำรายการ
        </router-link>
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
          <router-link to="/profile_staff"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <div class="histbody">
        <h1 style="padding-left: 50px; display: flex; justify-content: center;">
          ประวัติการทำรายการ (Staff)
        </h1>

        <!-- ตัวกรองสถานะ -->
        <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 10px;">
          <button
            class="filter-btn"
            :class="{ 'active-filter': filterStatus === 'approved' }"
            @click="toggleFilter('approved')"
          >อนุมัติ</button>
          <button
            class="filter-btn"
            :class="{ 'active-filter': filterStatus === 'disapproved' }"
            @click="toggleFilter('disapproved')"
          >ไม่อนุมัติ</button>
          <button
            class="filter-btn"
            :class="{ 'active-filter': filterStatus === 'returned' }"
            @click="toggleFilter('returned')"
          >รับคืนอุปกรณ์แล้ว</button>
          <button
            class="filter-btn"
            v-if="filterStatus !== ''"
            @click="clearFilter"
          >ลบตัวกรอง</button>
        </div>

        <!-- ตาราง + แบ่งหน้า -->
        <div class="history-table-container">
          <table class="history-table">
            <thead>
              <tr>
                <th>วันที่ทำรายการ</th>
                <th>รายการอุปกรณ์</th>
                <th>จำนวน</th>
                <th>สถานะ</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              <!-- ✅ ใช้รายการที่แบ่งหน้ามาแล้ว -->
              <tr v-for="(group, gidx) in paginatedEquipmentHistories" :key="gidx">
                <td>{{ group[0].returnedAt ? formatDate(group[0].returnedAt) : formatDate(group[0].date) }}</td>

                <td style="text-align:left">
                  <span v-for="(it, idx) in getDisplayItems(group)" :key="it.id">
                    {{ it.name }}<span v-if="idx < getDisplayItems(group).length - 1">, </span>
                  </span>
                </td>

                <td>
                  <span v-for="(it, idx) in getDisplayItems(group)" :key="it.id">
                    {{ it.quantity }}<span v-if="idx < getDisplayItems(group).length - 1">, </span>
                  </span>
                </td>

                <td>
                  <span
                    v-if="group[0].status === 'approved'"
                    class="status-label status-approved"
                  >ถูกอนุมัติ</span>
                  <span
                    v-else-if="group[0].status === 'disapproved'"
                    class="status-label status-disapproved"
                  >ไม่ถูกอนุมัติ</span>
                  <span
                    v-else-if="group[0].status === 'return-pending'"
                    class="status-label status-return-pending"
                  >กำลังรอรับคืนอุปกรณ์</span>
                  <span
                    v-else-if="group[0].status === 'returned'"
                    class="status-label status-returned"
                  >รับคืนอุปกรณ์แล้ว</span>
                  <span v-else>{{ group[0].status }}</span>
                </td>

                <td>
                  <button class="remark-btn" @click="detailGroup(group)">รายละเอียด</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- แถบควบคุมหน้า -->
        <div class="pagination-control" style="margin-top: 12px;">
          <button @click="prevPage" :disabled="currentPage === 1">Back</button>
          <span>Pages {{ currentPage }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
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
      isMobile: window.innerWidth <= 600, // ★
      lastSeenTimestamp: 0,
      currentPage: 1,
      itemsPerPage: 5, 
    }
  },
  computed: {
  groupedEquipmentHistories() {
    const groups = {}
    // สร้าง Set เก็บ booking_id ที่มี returned
    const returnedBookingIds = new Set()

    this.histories.forEach(item => {
      if (item.type !== 'equipment') return
      // เก็บ booking_id ที่มี returned
      if ((item.status || '').toLowerCase() === 'returned') {
        returnedBookingIds.add(item.booking_id || 'no_booking')
      }
      const key = item.booking_id || 'no_booking'
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })

    // สร้าง array ใหม่
    let arr = Object.values(groups).sort((a, b) => {
      const da = new Date(a[0].returnedAt || a[0].date)
      const db = new Date(b[0].returnedAt || b[0].date)
      return db - da
    })

    // filter ตามสถานะ
    if (this.filterStatus) {
      arr = arr.filter(group => {
        const status = (group[0].status || '').toLowerCase()
        // ถ้า filter 'approved' และ booking_id มีใน returnedBookingIds → ไม่แสดง
        if (
          this.filterStatus === 'approved' &&
          returnedBookingIds.has(group[0].booking_id || 'no_booking')
        ) {
          return false
        }
        return status === this.filterStatus
      })
    }

    return arr
  },

  // จำนวนหน้าทั้งหมด
  totalPages() {
    const total = Math.ceil(this.groupedEquipmentHistories.length / this.itemsPerPage) || 1
    return total
  },

  // รายการที่จะแสดงในตารางของหน้าปัจจุบัน
  paginatedEquipmentHistories() {
    const start = (this.currentPage - 1) * this.itemsPerPage
    const end   = start + this.itemsPerPage
    return this.groupedEquipmentHistories.slice(start, end)
  },

},

  methods: {
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
  const returnedOnly = group.filter(it => (it.status || '').toLowerCase() === 'returned');
  return returnedOnly.length ? returnedOnly : group;
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
    // ถ้าย่อเป็น mobile แล้ว sidebar ควรปิดอัตโนมัติ
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
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // ตัดของเก่าทิ้งก่อน
    this.pruneOldNotifications();

    // ดึง pending สำหรับ staff
    const res = await axios.get(`${API_BASE}/api/equipments/pending`);
    const data = Array.isArray(res.data) ? res.data : [];

    // เอาเฉพาะ id ใหม่ที่ยังไม่เคยแจ้ง
    const fresh = data.filter(item => !this.lastCheckedIds.has(item._id?.$oid || item._id));

    if (fresh.length) {
      const newMessages = fresh.map(item => {
        const ts =
          item.updatedAt ? new Date(item.updatedAt).getTime() :
          item.createdAt ? new Date(item.createdAt).getTime() :
          item.date      ? new Date(item.date).getTime()      :
          Date.now();
        return {
          id: item._id?.$oid || item._id,
          type: 'pending',
          timestamp: ts,
          message: `มีรายการ '${item.name}' ที่รออนุมัติ`,
        };
      });

      // รวม + กันซ้ำ + เรียงล่าสุด
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      // ตัดทิ้งอีกครั้งหลังรวม
      this.pruneOldNotifications();

      // มาร์คว่าเคยเห็น id เหล่านี้แล้ว
      fresh.forEach(item => this.lastCheckedIds.add(item._id?.$oid || item._id));
    }

    // นับ unread เฉพาะที่ timestamp > lastSeenTimestamp
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch (err) {}
},

    detailGroup(group) {
  const esc = (s) => String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>');

  const fmtDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? '-' : dt.toLocaleDateString('th-TH', { year:'numeric', month:'2-digit', day:'2-digit' });
  };

  const statusTitle = (s = '') => {
    const m = (s || '').toLowerCase();
    if (m === 'approved') return 'ถูกอนุมัติ';
    if (m === 'pending') return 'รอดำเนินการ';
    if (m === 'returned') return 'รับคืนอุปกรณ์แล้ว';
    if (m === 'return-pending') return 'กำลังรอรับคืนอุปกรณ์';
    if (m === 'disapproved') return 'ไม่ถูกอนุมัติ';
    if (m === 'canceled' || m === 'cancel') return 'ยกเลิกแล้ว';
    return s || '-';
  };

  // ถ้าใน group มี 'returned' อย่างน้อย 1 รายการ → แสดงเฉพาะ returned
  const returnedOnly = group.filter(it => (it.status || '').toLowerCase() === 'returned');
  const itemsToShow = returnedOnly.length ? returnedOnly : group;

  const rows = itemsToShow.map((item, idx) => `
    <div class="label"><b>อุปกรณ์ที่ ${idx + 1}</b></div><div class="value">${esc(item.name)}</div>
    <div class="label"><b>จำนวน</b></div><div class="value">${esc(item.quantity)}</div>
    <div class="label"><b>ชื่อผู้ขอใช้</b></div><div class="value">${esc(item.requester || '-')}</div>
    <div class="label"><b>วันที่ขอยืม</b></div><div class="value">${esc(fmtDate(item.date))}</div>
    <div class="label"><b>สถานะ</b></div><div class="value">${esc(statusTitle(item.status))}</div>
    <div class="label"><b>วันที่คืน</b></div><div class="value">${esc(item.returnedAt ? fmtDate(item.returnedAt) : '-')}</div>
    <div class="label"><b>หมายเหตุ</b></div><div class="value">${esc(item.remark || '-')}</div>
    <div style="grid-column:1/-1;border-bottom:1px dashed #bbb;margin:8px 0;"></div>
  `).join('');

  const html = `
    <style>
      /* กริด 2 คอลัมน์: หัวข้อซ้าย (กว้างตามเนื้อ) + ค่าข้อมูลขวา (ยืด) */
      .swal-detail-grid{
        display:grid;
        grid-template-columns: max-content 1fr;
        column-gap: 16px;
        row-gap: 8px;
        align-items:start;
        font-size: 1rem;
        line-height: 1.6;
      }
      .swal-detail-grid .label{ text-align:left; }
      .swal-detail-grid .value{ text-align:left; }  /* ✅ ค่าข้อมูลชิดซ้าย */
      @media (max-width: 560px){
        .swal-detail-grid{ column-gap: 12px; }
      }
    </style>
    <div class="swal-detail-grid">${rows || `<div style="grid-column:1/-1">ไม่มีรายการ</div>`}</div>
  `;

  Swal.fire({
    title: 'รายละเอียดรายการ',
    html,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3085d6',
    width: 600
  });
}





  },
  async mounted() {
    
    try {
      const staffId = localStorage.getItem('user_id')
      const res = await axios.get(`${API_BASE}/api/history`)
      this.histories = res.data
        .filter(h =>
          h.type === 'equipment' && (
            h.approvedById === staffId ||
            h.disapprovedById === staffId ||
            h.returnedById === staffId
          )
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((h, idx) => ({
          id: h._id?.$oid || h._id || idx + 1,
          name: h.name,
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
          booking_id: h.booking_id || null,
          disapprovedAt: h.disapprovedAt || null,
        }))
    } catch (err) {
      this.histories = []
      console.error('โหลดข้อมูล history staff ไม่สำเร็จ:', err)
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
  groupedEquipmentHistories() {
    // ถ้าข้อมูลเปลี่ยนจนหน้าปัจจุบันเกินจำนวนหน้า ให้ดึงกลับมาหน้าสุดท้ายที่มี
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages
    }
  }
},

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
/* .status-label {
  width: 90px;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: flex-start;
} */
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
.remark-btn:hover {
  background-color: #4268a3;
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

.notification-dropdown {
  position: absolute;
  right: 0;
  top: 36px;
  background: white;
  box-shadow: 0 4px 24px rgba(70, 70, 70, 0.14);
  border-radius: 10px;
  width: 320px;        /* กว้างขึ้นเหมือน approve_equipment */
  max-width: 90vw;
  z-index: 1500;
  padding: 10px 0;
  margin-top: 6px;
  font-size: 1rem;
}
.notification-dropdown ul {
  padding: 0 18px;
  margin: 0;
}
.notification-dropdown li {
  list-style: none;
  padding: 10px 0;
  border-bottom: 1px solid #eaeaea;
  word-break: break-word;
}
.notification-dropdown li:last-child {
  border-bottom: none;
}
.notification-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  position: relative;
  margin-right: 8px;
}
.badge {
  position: absolute;
  top: 1px;
  right: 3px;
  background: #e11d48;
  color: white;
  border-radius: 8px;
  padding: 1px 8px;
  font-size: 0.83rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
  z-index: 10;
}

.notification-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent;
  z-index: 1400;
}


.history-table-container {
  overflow-x: auto;
  margin: 1rem 70px 2rem 70px;
}
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
.history-table th {
  background: #1e3a8a;
  color: #fff;
  font-weight: 600;
}
.history-table tr:last-child td {
  border-bottom: none;
}

.status-approved,
.status-returned,
.status-disapproved,
.status-pending,
.status-return-pending {
  display: inline-flex;           /* กรอบจะยาวตามข้อความ */
  align-items: center;
  justify-content: center;
  padding: 3px 18px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1rem;
  text-align: center;
  white-space: nowrap;            /* ไม่ตัดบรรทัด */
  box-sizing: border-box;
  border-width: 1.5px;
  border-style: solid;
}

.status-approved {
  background: #d0f8ce !important;
  color: #259b24 !important;
  border-color: #90caf9;
}
.status-returned {
  background: #e3f2fd !important;
  color: #1565c0 !important;
  border-color: #64b5f6;
}
.status-disapproved {
  background: #fff3cd !important;
  color: #e84e40 !important;
  border-color: #ffe082;
}
.status-pending {
  background: #e3f2fd !important;
  color: #1976d2 !important;
  border-color: #90caf9;
}
.status-return-pending {
  background: #f6d365 !important;
  color: #444 !important;
  border-color: #ffe082;
}

.filter-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1.5px solid #1e3a8a;
  cursor: pointer;
  background: white;
  color: #1e3a8a;
  transition: background-color 0.3s, color 0.3s;
}
.filter-btn.active-filter {
  background-color: #1e3a8a;
  color: white;
  font-weight: bold;
}
.filter-btn:not(.active-filter):hover {
  background-color: #1e3a8a;
  color: white;
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




</style>
<style>
@import '../css/style.css';
</style>