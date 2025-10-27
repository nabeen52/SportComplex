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
                <!-- <td>{{ group[0].returnedAt ? formatDate(group[0].returnedAt) : formatDate(group[0].date) }}</td> -->
                 <td>{{ displayGroupDate(group) }}</td>

                <td style="text-align:left">
                  {{ joinUniqueItemNames(group) }}
                </td>


                <td>{{ joinAggregatedTotals(group) }}</td>


                <td>
  <span
    v-if="groupStatus(group) === 'returned'"
    class="status-label status-returned"
  >รับคืนอุปกรณ์แล้ว</span>

  <span
    v-else-if="groupStatus(group) === 'handedover'"
    class="status-label status-handedover"
  >ถูกส่งมอบ</span>

  <span
    v-else-if="groupStatus(group) === 'approved'"
    class="status-label status-approved"
  >ถูกอนุมัติ</span>

  <span
    v-else-if="groupStatus(group) === 'disapproved'"
    class="status-label status-disapproved"
  >ไม่ถูกอนุมัติ</span>

  <span v-else>{{ groupStatus(group) }}</span>
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
      staffId: (localStorage.getItem('user_id') || '').trim(),
      userEmailCache: {},
      usersMap: {},
      usersEmailMap: {},
      usersPhoneMap: {},
    }
  },
  computed: {
  groupedEquipmentHistories() {
  const groups = {};
  const returnedBookingIds = new Set();

  this.histories.forEach(item => {
    if (item.type !== 'equipment') return;

    // ข้ามรายการที่เป็น return-pending ไปเลย
    const st = (item.status || '').toLowerCase();
    if (st === 'return-pending') return;

    if (st === 'returned') {
      returnedBookingIds.add(item.booking_id || 'no_booking');
    }

    const key = item.booking_id || 'no_booking';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  // ลบ group ที่ว่าง แล้วเรียงกลุ่มตาม: handoverAt > returnedAt > date
  let arr = Object.values(groups)
    .filter(g => g.length > 0)
    .sort((a, b) => {
      const da = new Date(a[0].handoverAt || a[0].returnedAt || a[0].date || 0);
      const db = new Date(b[0].handoverAt || b[0].returnedAt || b[0].date || 0);
      return db - da;
    });

  // filter ตามปุ่มสถานะ
  if (this.filterStatus) {
    arr = arr.filter(group => {
      const status = (group[0].status || '').toLowerCase();

      // โหมดกรอง "ส่งมอบแล้ว": ถ้ากลุ่มมีใครสักคนที่มีข้อมูล handover → แสดง
      if (this.filterStatus === 'handedover') {
        return group.some(it => it.handoverAt || it.handoverBy || it.handoverById);
      }

      // ถ้า filter 'approved' และ booking นี้มี 'returned' แล้ว → ไม่แสดง
      if (this.filterStatus === 'approved' &&
          returnedBookingIds.has(group[0].booking_id || 'no_booking')) {
        return false;
      }
      return status === this.filterStatus;
    });
  }

  // อนุญาตเฉพาะกลุ่มที่สถานะหัวเป็น approved/disapproved/returned
  // หรือกำลังอยู่โหมดกรอง handedover
  const allow = new Set(['approved', 'disapproved', 'returned', 'handedover']);
  arr = arr.filter(group => {
    const st = (group[0].status || '').toLowerCase();
    return allow.has(st) || (this.filterStatus === 'handedover');
  });

  return arr;
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
    hasHandover(group) {
  // true ถ้าในกลุ่มมีรายการที่มีข้อมูลการส่งมอบ
  return (group || []).some(it => it.handoverAt || it.handoverBy || it.handoverById);
},

groupStatus(group) {
  if (!Array.isArray(group) || group.length === 0) return '';
  const me = (this.staffId || '').trim();

  // ถ้าฉันเป็นคนรับคืน → ชนะทุกอย่าง
  const returnedByMe = group.some(it =>
    String(it.returnedById || '').trim() === me &&
    String(it.status || '').toLowerCase() === 'returned'
  );
  if (returnedByMe) return 'returned';

  // ถ้าฉันเป็นคนส่งมอบ → ลำดับถัดมา
  const handedOverByMe = group.some(it =>
    String(it.handoverById || '').trim() === me
  );
  if (handedOverByMe) return 'handedover';

  // อย่างอื่น: ใช้สถานะของรายการแรก
  return String(group[0].status || '').toLowerCase();
},


displayGroupDate(group) {
  // แสดงวันที่สำคัญของกลุ่ม: handoverAt > returnedAt > approvedAt > date
  const pick = (g, k) => (g.find(it => it[k]) || {})[k];
  const d =
    pick(group, 'handoverAt') ||
    pick(group, 'returnedAt') ||
    pick(group, 'approvedAt') ||
    (group[0] && group[0].date);

  return this.formatDate(d);
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

  effectiveStatusForMe(it) {
  const me = (this.staffId || '').trim();
  const st = String(it.status || '').toLowerCase();
  const by = (v) => String(v || '').trim() === me;

  if (st === 'returned'   && by(it.returnedById))   return 'returned';
  // ส่งมอบ: จะนับเป็น "handedover" ก็ต่อเมื่อเราเป็นคนส่งมอบ
  if (st === 'approved'   && (it.handoverAt || it.handoverBy || it.handoverById) && by(it.handoverById)) return 'handedover';
  if (st === 'approved'   && by(it.approvedById))   return 'approved';
  if (st === 'disapproved'&& by(it.disapprovedById))return 'disapproved';
  return null;
},

getDisplayItems(group) {
  return (group || []).filter(
    it => String(it.status || '').toLowerCase() !== 'return-pending'
  );
},

itemsForRow(group) {
  const cleaned = this.getDisplayItems(group);

  // จับคู่ action ที่เราเป็นคนทำ
  const myItems = cleaned
    .map(it => ({ it, eff: this.effectiveStatusForMe(it) }))
    .filter(x => !!x.eff);

  // สถานะที่จะใช้เป็นป้ายของแถว (returned / handedover / approved / disapproved)
  const rowStatus = this.groupStatus(group);
  if (!rowStatus) return cleaned;

  // ถ้าเรามี action จริง ให้ใช้เฉพาะที่สถานะตรงกับป้ายแถว
  if (myItems.length) {
    return myItems
      .filter(x => x.eff === rowStatus)
      .map(x => x.it);
  }

  // ไม่ใช่งานเรา → เลือกจาก cleaned ให้ตรงกับป้ายแถว
  return cleaned.filter(it => {
    const st = String(it.status || '').toLowerCase();
    if (rowStatus === 'handedover') {
      // งานส่งมอบอาจเก็บในแถวที่ status=approved แต่มี handover*
      return !!(it.handoverAt || it.handoverBy || it.handoverById);
    }
    return st === rowStatus;
  });
},

aggregateRowItems(group) {
  const items = this.itemsForRow(group);
  const order = [];
  const map = new Map(); // key(lowerName) -> { name, total }

  for (const it of items) {
    const rawName = String(it?.name ?? '').trim();
    if (!rawName) continue;

    const key = rawName.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { name: rawName, total: 0 });
      order.push(key);
    }

    let qty = Number(it?.quantity ?? 0);
    if (!Number.isFinite(qty)) qty = parseFloat(it?.quantity) || 0;
    map.get(key).total += qty;
  }

  return order.map(k => ({ key: k, ...map.get(k) }));
},

// รวมอุปกรณ์ในกลุ่มตาม "ชื่อ" เดียวกัน และบวกจำนวนให้เรียบร้อย
// คืนเป็นอาเรย์ที่รักษาลำดับการพบชื่อครั้งแรก เช่น [{ name:'ลูกฟุตบอล', total: 3 }, ...]
aggregateItems(group) {
  const items = this.getDisplayItems(group);
  const order = [];
  const map = new Map(); // key(lower) -> { name, total }

  for (const it of items) {
    const rawName = String(it?.name ?? '').trim();
    if (!rawName) continue;

    const key = rawName.toLowerCase();   // normalize ชื่อ
    if (!map.has(key)) {
      map.set(key, { name: rawName, total: 0 });
      order.push(key);
    }

    let qty = Number(it?.quantity ?? 0);
    if (!Number.isFinite(qty)) qty = parseFloat(it?.quantity) || 0;
    map.get(key).total += qty;
  }

  return order.map(k => ({ key: k, ...map.get(k) }));
},

// ใช้ตัวรวมเดียวกันสำหรับชื่อ (ให้ชื่อ-จำนวนเรียงตรงกัน)
joinUniqueItemNames(group) {
  return this.aggregateRowItems(group).map(x => x.name).join(', ');
},

// สตริงจำนวนที่รวมแล้ว ให้ตรงกับลำดับชื่อ
joinAggregatedTotals(group) {
  return this.aggregateRowItems(group).map(x => x.total).join(', ');
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




   // สรุปสถานะของ "กลุ่มรายการ" ให้สัมพันธ์กับผู้ใช้ปัจจุบัน
groupStatus(group) {
  if (!Array.isArray(group) || group.length === 0) return '';
  const me = (this.staffId || '').trim();

  // ถ้าฉันเป็นคนรับคืน → ชนะทุกอย่าง
  const returnedByMe = group.some(it =>
    String(it.returnedById || '').trim() === me &&
    String(it.status || '').toLowerCase() === 'returned'
  );
  if (returnedByMe) return 'returned';

  // ถ้าฉันเป็นคนส่งมอบ → ลำดับถัดมา
  const handedOverByMe = group.some(it =>
    String(it.handoverById || '').trim() === me
  );
  if (handedOverByMe) return 'handedover';

  // อย่างอื่น: ใช้สถานะของรายการแรก
  return String(group[0].status || '').toLowerCase();
},

// คืนรายการในกลุ่ม (ตัดเฉพาะ return-pending ออก) เพื่อใช้แสดงในตาราง
getDisplayItems(group) {
  return (group || []).filter(
    it => String(it.status || '').toLowerCase() !== 'return-pending'
  );
},

// คืนชื่ออุปกรณ์แบบ "ไม่ซ้ำ" ตามลำดับที่ปรากฏในกลุ่ม
getUniqueItemNames(group) {
  const items = this.getDisplayItems(group);
  const seen = new Set();
  const unique = [];
  for (const it of items) {
    const name = String(it?.name ?? '').trim();
    if (!name) continue;
    const key = name.toLowerCase(); // ให้ "ไม่เป๊ปซี่" กับ "ไม่เป๊ปซี่ " ถือว่าอันเดียวกัน
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(name);
    }
  }
  return unique;
},

// สำหรับโชว์ในตาราง: รวมเป็นสตริงเดียว "ชื่อA, ชื่อB, ชื่อC"
joinUniqueItemNames(group) {
  return this.getUniqueItemNames(group).join(', ');
},

// ดึงอีเมลจาก payload รูปแบบต่าง ๆ ให้รองรับหลาย API shape
pickEmailPayload(respData, wantId) {
  const d = respData;
  if (!d) return null;

  // ตรง ๆ
  if (typeof d === 'string' && d.includes('@')) return d;
  if (d.email) return d.email;
  if (d.user?.email) return d.user.email;
  if (d.data?.email) return d.data.email;
  if (d.profile?.email) return d.profile.email;

  // เป็นอาร์เรย์
  if (Array.isArray(d)) {
    const hit = d.find(x =>
      String(x?.user_id ?? x?.id ?? x?._id ?? '').trim() === String(wantId).trim()
    );
    if (hit?.email) return hit.email;
    if (d[0]?.email) return d[0].email;
  }
  return null;
},

// พยายามเรียกหลาย endpoint จนกว่าจะพบอีเมล (กันความต่างของ backend)
async resolveEmailByUserId(userId) {
  const id = String(userId || '').trim();
  if (!id) return '-';
  if (this.userEmailCache[id]) return this.userEmailCache[id];

  const base = (import.meta.env?.VITE_API_BASE || '').replace(/\/+$/,'');
  const candidates = [
    `${base}/api/users/${encodeURIComponent(id)}`,
    `${base}/api/user/${encodeURIComponent(id)}`,
    `${base}/api/users/info/${encodeURIComponent(id)}`,
    `${base}/api/users?user_id=${encodeURIComponent(id)}`,
    `${base}/api/user?user_id=${encodeURIComponent(id)}`,
  ];

  for (const url of candidates) {
    try {
      const res = await axios.get(url);
      const email = this.pickEmailPayload(res?.data, id);
      if (email) {
        this.userEmailCache = { ...this.userEmailCache, [id]: email };
        return email;
      }
    } catch (e) { /* เงียบไว้ ลองตัวถัดไป */ }
  }
  this.userEmailCache = { ...this.userEmailCache, [id]: '-' };
  return '-';
},

// ดึงอีเมลเป็นชุดให้ครบก่อนแสดง
async fetchEmailsForUserIds(ids = []) {
  const todo = [...new Set(ids.map(v => String(v || '').trim()).filter(Boolean))]
    .filter(id => !this.userEmailCache[id]);
  await Promise.all(todo.map(id => this.resolveEmailByUserId(id)));
},

// ---- รูป: ตัวช่วยคัดกรอง/แปลง URL ให้ปลอดภัย ----
// === รูป: ตัวช่วยคัดกรอง/แปลง URL ให้ปลอดภัย ===
hasImageExt(s) {
  return /\.(jpe?g|png|webp|gif|bmp|svg|heic|heif|tiff?)($|\?)/i.test(String(s || '').split('#')[0]);
},

isValidImageLike(val) {
  if (!val) return false;

  // string ตรง ๆ
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s || s === '-' || /^null$/i.test(s) || /^undefined$/i.test(s)) return false;
    if (s === '/' || s === './' || s === '../') return false;
    if (/^data:image\//i.test(s)) return true;                 // data URL
    return this.hasImageExt(s);                                // ต้องเป็นไฟล์รูปจริง
  }

  // object ที่มี key ทั่วไปของ URL
  if (typeof val === 'object') {
    const cand = val.url || val.src || val.imageUrl || val.Location || val.path || val.filePath || val.key || '';
    return this.isValidImageLike(cand);
  }

  return false;
},

toUrlSafe(val) {
  // รับทั้ง string และ object (จะดึง url/src/... ให้อัตโนมัติ)
  if (!this.isValidImageLike(val)) return null;
  const s0 = (typeof val === 'object')
    ? (val.url || val.src || val.imageUrl || val.Location || val.path || val.filePath || val.key || '')
    : String(val).trim();

  if (/^(data:image\/|https?:\/\/|\/\/)/i.test(s0)) return s0; // ใช้ได้เลย
  const base = (import.meta.env?.VITE_API_BASE || '').replace(/\/+$/, '');
  const local = s0.replace(/^\/+/, '');
  return base ? `${base}/${local}` : `/${local}`;
},

pickFirstImage(...candidates) {
  const flat = candidates.flat(3);
  for (const c of flat) {
    if (c == null) continue;

    if (Array.isArray(c)) {
      for (const x of c) {
        const u = this.toUrlSafe(x);
        if (u) return u;
      }
    } else {
      const u = this.toUrlSafe(c);
      if (u) return u;
    }
  }
  return null;
},

 async fetchUsers() {
  try {
    const res = await axios.get(`${API_BASE}/api/users`);
    this.usersMap = {};
    this.usersEmailMap = {};
    this.usersPhoneMap = {};

    (Array.isArray(res.data) ? res.data : []).forEach(u => {
      const id = String(u.user_id || '').trim();
      if (!id) return;

      const thai = (u.thaiName || '').trim();
      const enFull = [u.firstname, u.lastname].filter(Boolean).join(' ').trim();
      const fallback = (u.name || id || '').trim();
      this.usersMap[id] = thai || enFull || fallback || '-';

      const email = String(u.email || '').trim();
      this.usersEmailMap[id] = email || '-';

      const phone = String(u.phone || u.tel || '').trim();
      this.usersPhoneMap[id] = phone || '-';

      // เก็บชื่อเราไว้ใน localStorage ด้วย
      if (String(id) === String(this.staffId)) {
        localStorage.setItem('thaiName', this.usersMap[id]);
      }
    });
  } catch (err) {
    this.usersMap = {};
    this.usersEmailMap = {};
    this.usersPhoneMap = {};
  }
},



async detailGroup(group) {
  const esc = (s) => String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>');
  const fmtDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? '-' : dt.toLocaleDateString('th-TH', {year:'numeric',month:'2-digit',day:'2-digit'});
  };
  const statusTitle = (s='') => {
    const m = String(s || '').toLowerCase();
    if (m === 'handedover' || m === 'handover') return 'ถูกส่งมอบ';
    if (m === 'approved')   return 'ถูกอนุมัติ';
    if (m === 'returned')   return 'รับคืนอุปกรณ์แล้ว';
    if (m === 'disapproved')return 'ไม่ถูกอนุมัติ';
    if (m === 'pending')    return 'รอดำเนินการ';
    if (m === 'canceled' || m === 'cancel') return 'ยกเลิกแล้ว';
    return s || '-';
  };

  const me = (this.staffId || '').trim();
  const byMe = (v) => String(v || '').trim() === me;
  const keyOf = (it) => `${String(it.user_id||'').trim()}||${String(it.name||'').trim().toLowerCase()}`;

  const cleaned = (group || []).filter(
    it => String(it.status || '').toLowerCase() !== 'return-pending'
  );

  const myItems = cleaned.filter(it => {
    const st = String(it.status || '').toLowerCase();
    if (st === 'returned')     return byMe(it.returnedById);
    if (st === 'disapproved')  return byMe(it.disapprovedById);
    if (st === 'approved') {
      if (it.handoverAt || it.handoverBy || it.handoverById) return byMe(it.handoverById);
      return byMe(it.approvedById);
    }
    return false;
  });

  let itemsToShow;
  if (myItems.length) {
    const returnedCount = new Map();
    for (const it of myItems) {
      const st = String(it.status || '').toLowerCase();
      if (st === 'returned' && byMe(it.returnedById)) {
        const k = keyOf(it);
        returnedCount.set(k, (returnedCount.get(k) || 0) + 1);
      }
    }

    const reduceApprovedIfReturned = (it) => {
      const st = String(it.status || '').toLowerCase();
      const isMyHandover = st==='approved' && (it.handoverAt || it.handoverBy || it.handoverById) && byMe(it.handoverById);
      const isMyApprove  = st==='approved' && byMe(it.approvedById) && !isMyHandover;

      if (isMyHandover || isMyApprove) {
        const k = keyOf(it);
        const c = returnedCount.get(k) || 0;
        if (c > 0) {
          returnedCount.set(k, c - 1);
          return false;
        }
      }
      return true;
    };

    itemsToShow = myItems.filter(reduceApprovedIfReturned);
  } else {
    itemsToShow = cleaned;
  }

  const ids = itemsToShow.map(it => it.user_id).filter(Boolean);
  await this.fetchEmailsForUserIds(ids);

  const anyHandover = itemsToShow.find(it =>
    (it.handoverAt || it.handoverBy || it.handoverById) &&
    byMe(it.handoverById) &&
    it.bookingPdfUrl
  );

  // ✅ เพิ่มส่วนแสดงเบอร์โทร
  const rows = itemsToShow.map((item, idx) => {
    const st = String(item.status || '').toLowerCase();

    let stForShow = st;
    if (st === 'returned' && byMe(item.returnedById)) stForShow = 'returned';
    else if (st === 'approved' && (item.handoverAt || item.handoverBy || item.handoverById) && byMe(item.handoverById)) stForShow = 'handedover';
    else if (st === 'approved' && byMe(item.approvedById)) stForShow = 'approved';
    else if (st === 'disapproved' && byMe(item.disapprovedById)) stForShow = 'disapproved';

    const email = this.userEmailCache[String(item.user_id || '').trim()] || '-';
    const phone = this.usersPhoneMap?.[String(item.user_id || '').trim()] || '-';


    const imgUrl = this.pickFirstImage(
      item.returnPhoto, item.returnImage, item.return_photo, item.returnPhotos,
      item.attachment, item.returnAttachment,
      item.attachments, item.images,
      item.image, item.photo
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
        <td>${esc(email)}</td>
        <td>${esc(phone)}</td> <!-- ✅ แสดงเบอร์โทร -->
        <td>${esc(fmtDate(item.date))}</td>
        <td>${esc(statusTitle(stForShow))}</td>
        <td>${esc(item.returnedAt ? fmtDate(item.returnedAt) : '-')}</td>
        <td style="text-align:center">${photoCell}</td>
        <td class="swal-remark">${esc(item.remark || '-')}</td>
      </tr>`;
  }).join('');

  const pdfFooter = anyHandover ? `
    <div class="mfu-pdf-btn-footer"
         style="width:100%; margin-top:10px; display:flex; justify-content:flex-end;">
      <a class="mfu-pdf-btn mfu-pdf-btn--sm"
         href="${anyHandover.bookingPdfUrl}"
         target="_blank" rel="noopener noreferrer">
        เปิดฟอร์ม PDF
      </a>
    </div>` : '';

  const GAP  = 24;
  const MAXW = 1500; // ✅ เพิ่มความกว้างนิดหน่อยเพื่อรองรับคอลัมน์ใหม่
  const popupW = Math.min(Math.max(window.innerWidth - GAP*2, 360), MAXW);

  Swal.fire({
    title: 'รายละเอียดรายการ',
    html: `
      <div class="swal-table-wrap">
        <table class="swal-table">
          <thead>
            <tr>
              <th style="width:60px;text-align:center">ลำดับ</th>
              <th>อุปกรณ์</th>
              <th style="width:90px;text-align:center">จำนวน</th>
              <th style="width:160px">ผู้ขอใช้</th>
              <th style="width:160px">อีเมล</th>
              <th style="width:120px">เบอร์โทร</th> <!-- ✅ เพิ่มหัวคอลัมน์ -->
              <th style="width:120px">วันที่ขอยืม</th>
              <th style="width:150px">สถานะ</th>
              <th style="width:130px">วันที่คืน</th>
              <th style="width:150px;text-align:center">รูป</th>
              <th style="width:160px">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="11" style="text-align:center">ไม่มีรายการ</td></tr>`}</tbody>
        </table>
      </div>
      ${pdfFooter}
    `,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3085d6',
    width: popupW + 'px',
    customClass: { container: 'mfu-swal-center', popup: 'mfu-swal', htmlContainer: 'mfu-swal-body' },
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
}

  },
  async mounted () {
  try {
    const staffId = (localStorage.getItem('user_id') || '').trim()
    const res = await axios.get(`${API_BASE}/api/history`)
    const list = Array.isArray(res.data) ? res.data : []

    // ✅ รวมงานที่ staff คนนี้ “ส่งมอบ” ด้วย (handoverById)
    const same = v => String(v || '').trim() === staffId
    this.histories = list
      .filter(h =>
        h.type === 'equipment' && (
          same(h.approvedById) ||
          same(h.disapprovedById) ||
          same(h.returnedById)   ||
          same(h.handoverById)   // << เพิ่มตรงนี้
        )
      )
      // เรียงตามเวลาสำคัญ: ส่งมอบ > รับคืน > อนุมัติ > วันที่ยืม
      .sort((a, b) => {
        const da = new Date(a.handoverAt || a.returnedAt || a.approvedAt || a.date || 0).getTime()
        const db = new Date(b.handoverAt || b.returnedAt || b.approvedAt || b.date || 0).getTime()
        return db - da
      })
      .map((h, idx) => ({
  id: h._id?.$oid || h._id || idx + 1,
  name: h.name,
  quantity: h.quantity,
  status: h.status,
  type: h.type,
  requester: h.requester,
  user_id: h.user_id || '-',
  date: h.date,
  booking_id: h.booking_id || null,
  remark: h.remark,

  approvedBy: h.approvedBy,
  approvedById: h.approvedById,
  approvedAt: h.approvedAt,
  disapprovedBy: h.disapprovedBy,
  disapprovedById: h.disapprovedById,
  disapprovedAt: h.disapprovedAt || null,
  returnedBy: h.returnedBy,
  returnedById: h.returnedById,
  returnedAt: h.returnedAt,

  handoverBy: h.handoverBy || '',
  handoverById: h.handoverById || '',
  handoverAt: h.handoverAt || null,
  handoverRemarkSender: h.handoverRemarkSender || '',
  handoverRemarkReceiver: h.handoverRemarkReceiver || '',
  handoverReceiverThaiName: h.handoverReceiverThaiName || '',

  bookingPdfUrl: h.bookingPdfUrl || h.booking_pdf_url || h.handoverPdfUrl || null,

  // ✅ เก็บรูป "รับคืน" โดยเฉพาะ
  returnPhoto:
    h.returnPhoto ||
    h.return_photo ||
    (Array.isArray(h.returnPhotos) ? h.returnPhotos[0] : null) ||
    h.returnImage || null,

  // ✅ รูปอื่น ๆ (แนบ, ระหว่างยืม ฯลฯ)
  attachment:
    h.attachment ||
    h.returnAttachment ||
    (Array.isArray(h.attachments) ? h.attachments[0] : null) ||
    (Array.isArray(h.images) ? h.images[0] : null) ||
    h.image || h.photo || null,
}))

  } catch (err) {
    this.histories = []
    console.error('โหลดข้อมูล history staff ไม่สำเร็จ:', err)
  }

  // (ส่วนประกาศ / แจ้งเตือน / resize เหมือนเดิมของคุณ)
  try {
    const annRes = await axios.get(`${API_BASE}/api/announcement`)
    this.announcement = annRes.data?.announce || ""
    this.showAnnouncementBar = !!this.announcement
  } catch (err) {
    this.announcement = ""
    this.showAnnouncementBar = false
  }
  this.lastSeenTimestamp = parseInt(localStorage.getItem('staff_lastSeenTimestamp') || '0', 10)
  await this.fetchNotifications()
  this.polling = setInterval(this.fetchNotifications, 30000)
  window.addEventListener('resize', this.checkMobile)
  this.fetchUsers();
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
:root { --status-pill-width: 180px; }  /* ปรับได้ 170–190px ตามสายตา */

.status-label{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 180px;          /* กำหนดความกว้างคงที่ */
  min-width: 180px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 1rem;
  white-space: nowrap;
  box-sizing: border-box;
  border-width: 1.5px;
  border-style: solid;
  text-align: center;
  flex: 0 0 180px;       /* กันการหดตัวใน flex/inline-flex */
}

.status-approved   { background:#d0f8ce !important; color:#259b24 !important; border-color:#90caf9; }
.status-returned   { background:#e3f2fd !important; color:#1565c0 !important; border-color:#64b5f6; }
.status-disapproved{ background:#fff3cd !important; color:#e84e40 !important; border-color:#ffe082; }
.status-pending    { background:#e3f2fd !important; color:#1976d2 !important; border-color:#90caf9; }
.status-return-pending { background:#f6d365 !important; color:#444 !important; border-color:#ffe082; }

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

@media (max-width: 420px){
  .status-label{ width:auto; min-width:140px; flex:0 0 auto; }
}

@media (max-width: 640px){
  /* 1) ให้คอนเทนเนอร์กว้างขึ้นบนมือถือ และเลื่อนได้ */
  .histbody{ padding: 12px 0; }
  .history-table-container{
    margin: 8px 8px 14px;         /* เดิม 70px ทำให้แคบเกินไป */
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* 2) บังคับให้ตารางมีความกว้างขั้นต่ำ แล้วค่อยเลื่อนแนวนอน */
  .history-table{
    min-width: 760px;             /* ปรับได้ 720–900 ตามถนัด */
    table-layout: fixed;          /* ให้คอลัมน์คุมพื้นที่ดีขึ้น */
  }

  /* 3) จูนขนาดฟอนต์/ระยะห่างเล็กน้อย */
  .history-table th,
  .history-table td{
    padding: 8px 10px;
    font-size: .92rem;
  }

  /* 4) กำหนดสัดส่วนคอลัมน์ให้พอดีสายตา */
  .history-table th:nth-child(1),
  .history-table td:nth-child(1){ min-width: 110px; }   /* วันที่ */
  .history-table th:nth-child(2),
  .history-table td:nth-child(2){
    min-width: 240px; text-align: left;  /* รายการอุปกรณ์ */
    white-space: normal; word-break: break-word;
  }
  .history-table th:nth-child(3),
  .history-table td:nth-child(3){ min-width: 80px;  }   /* จำนวน */
  .history-table th:nth-child(4),
  .history-table td:nth-child(4){ min-width: 170px; }   /* สถานะ */
  .history-table th:nth-child(5),
  .history-table td:nth-child(5){ min-width: 110px; }   /* รายละเอียด */

  /* 5) ป้ายสถานะให้สั้นลงหน่อยบนจอแคบ */
  .status-label{
    width: 150px; min-width: 150px;
    height: 28px; font-size: .9rem; flex: 0 0 150px;
  }

  /* (ทางเลือก) เอา padding ซ้ายของหัวข้อที่ใส่ inline style ออก */
  .histbody h1{ padding-left: 0 !important; font-size: 1.1rem; }
}

.status-handedover{
  background:#e8f5e9 !important;
  color:#2e7d32 !important;
  border-color:#a5d6a7 !important;
}

.status-handedover{
  background:#e8f5e9 !important;
  color:#2e7d32 !important;
  border-color:#a5d6a7 !important;
}

</style>
<style>
@import '../css/style.css';

/* === SweetAlert (global) === */
.mfu-swal{                      /* ตัว popup */
  max-width: none !important;   /* เอาขีดจำกัด 1000px เดิมออก */
  width: 100% !important;       /* กว้างเท่าค่าที่ตั้งจาก JS */
  font-size: 1rem;
}
.mfu-swal-body{ text-align: left; }

.swal2-container.mfu-swal-center{
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;         /* ตัด padding ของ container ที่อาจชดเชย scrollbar */
}

.swal2-container.mfu-swal-center .swal2-popup{
  margin: 0 !important;
}

/* ตารางด้านใน: ให้พอดีกรอบ ไม่ต้องเลื่อน */
.mfu-swal .swal-table-wrap{
  max-height: 70vh;
  overflow: auto;              /* เผื่อรายการแถวเยอะให้เลื่อนแนวตั้งได้ */
}
.mfu-swal .swal-table{
  width: 100%;
  min-width: 0;                /* 🔥 สำคัญ: เอา min-width 1250px ออก */
  table-layout: auto;
}

/* คอลัมน์ชื่ออุปกรณ์ให้อยู่บรรทัดเดียวตามต้องการ */
.mfu-swal .swal-table th:nth-child(2),
.mfu-swal .swal-table td:nth-child(2),
.mfu-swal .swal-table .nowrap{
  white-space: nowrap;
  word-break: keep-all;
}

/* จอแคบมากๆ ลด padding ตัวอักษรลงนิดเพื่อไม่ล้น */
@media (max-width: 1280px){
  .mfu-swal .swal-table th,
  .mfu-swal .swal-table td{ padding: 8px 10px; }
}

/* ปุ่ม PDF ใน SweetAlert ให้หน้าตาแบบปุ่มดาวน์โหลด */
.mfu-swal .mfu-pdf-btn-wrap{
  margin-top: 8px;
}

.mfu-swal .mfu-pdf-btn{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: #1e3a8a;            /* น้ำเงินเดียวกับหัวตาราง */
  color: #fff !important;
  text-decoration: none !important;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(0,0,0,0.08);
  transition: background .2s, transform .02s, box-shadow .2s;
  user-select: none;
}

.mfu-swal .mfu-pdf-btn:hover{
  background: #153eaa;
}

.mfu-swal .mfu-pdf-btn:active{
  transform: translateY(1px);
  box-shadow: 0 1px 0 rgba(0,0,0,0.12);
}

.mfu-swal .mfu-pdf-btn .pi{
  font-size: 1rem;
  line-height: 1;
}

/* จัดข้อความในคอลัมน์ "หมายเหตุ" ให้อยู่ตรงกลางทั้งแนวนอนและแนวตั้ง */
.mfu-swal .swal-table td.swal-remark{
  text-align: center;
  vertical-align: middle;
  white-space: pre-wrap;       /* ถ้ามีขึ้นบรรทัดใหม่จะยังแสดงถูก */
}

/* เผื่อกรณีลืมใส่คลาสหรือมีป๊อปอัปเก่าๆ: จัดคอลัมน์สุดท้าย (หมายเหตุ) ให้เป็นกลางด้วย */
.mfu-swal .swal-table th:last-child,
.mfu-swal .swal-table td:last-child{
  text-align: center;
  vertical-align: middle;
}

/* ให้ช่อง "หมายเหตุ" ชิดบน + จัดกลางแนวนอน */
.mfu-swal .swal-table td.swal-remark{
  vertical-align: top !important;
  text-align: center;
  white-space: pre-wrap;
  word-break: break-word;
  /* (ไม่บังคับ) ยกนิด ๆ ให้ดูชิดบนชัดขึ้น */
  padding-top: 6px;
}

/* ถ้ากฎเดิมบังคับคอลัมน์สุดท้ายให้ middle อยู่ ให้ทับด้วย top */
.mfu-swal .swal-table td:last-child{
  vertical-align: top !important;
  text-align: center; /* ต้องการกลางแนวนอน */
}


</style>