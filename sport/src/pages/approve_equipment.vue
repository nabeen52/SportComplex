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
      @click="toggleSidebar"
    ></div>

    <div class="main">
      <!-- ✅ Topbar (responsive, ไม่ทับ, ไม่มีปุ่ม ×) -->
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

      <!-- แถบประกาศ -->
      <transition name="slide-down">
  <div class="announcement-bar" v-if="showAnnouncementBar">
    <span class="announcement-icon">
      <i class="pi pi-megaphone"></i>
    </span>
    <span class="announcement-bar-text">
      {{ announcement }}
    </span>
    <button class="close-announcement-btn" @click="showAnnouncementBar = false" aria-label="ปิดประกาศ">
      <span class="close-icon">
        <i class="pi pi-times"></i>
      </span>
    </button>
  </div>
</transition>

      

      <div class="histbody">
        <h1 style="display: flex; justify-content: center;">อนุมัติการยืม/รับคืนอุปกรณ์</h1>

        <div class="table-container">
          <table class="equipment-table">
            <thead>
  <tr>
    <th>วันที่ทำรายการ</th>
    <th>รายการอุปกรณ์</th>
    <th>จำนวน</th>
    <th>การกระทำ</th>
    <th>รายละเอียด</th>
  </tr>
</thead>
<tbody>
  <template v-for="group in groupedEquipments" :key="group.booking_id">
    <tr>
      <!-- วันที่ทำรายการ (เอาวันที่แรกใน group หรือเลือกตามที่ต้องการ) -->
      <td>{{ formatDate(group.items[0].date) }}</td>
      <!-- รวมชื่ออุปกรณ์ทั้งหมดใน group นี้ -->
      <td>
        <span v-for="(item, idx) in group.items" :key="item.id">
          {{ item.name }}<span v-if="idx < group.items.length - 1">, </span>
        </span>
      </td>
      <!-- รวมจำนวนทั้งหมด (หรือจะแยกตามชื่อก็ได้) -->
      <td>
        <span v-for="(item, idx) in group.items" :key="item.id">
          {{ item.quantity }}<span v-if="idx < group.items.length - 1">, </span>
        </span>
      </td>
      <td>
        <!-- แสดงปุ่มเหมือนเดิม (ไม่ต้องแก้) -->
        <template v-if="group.items.every(item => item.status?.toLowerCase() === 'pending')">
  <div>
    <button
      class="approve-btn"
      @click="approveGroup(group)"
      :disabled="processingGroups.has(group.booking_id)"  
      style="margin-right:10px;"
    >
      อนุมัติ
    </button>
    <button
      class="cancel-btn"
      @click="cancelGroup(group)"
      :disabled="processingGroups.has(group.booking_id)"  
    >
      ไม่อนุมัติ
    </button>

    <!-- ✅ ข้อความแจ้งกำลังประมวลผล -->
    <span
      v-if="processingGroups.has(group.booking_id)"
      style="margin-left:8px;font-size:.9rem;color:#555;"
    >
      กำลังดำเนินการ...
    </span>
  </div>
</template>



        <template v-else-if="group.items.every(item => item.status?.toLowerCase() === 'approved')">
          <span class="status-bg status-approved">ถูกอนุมัติ</span>
        </template>
        <template v-else-if="group.items.every(item => item.status?.toLowerCase() === 'disapproved')">
          <span class="status-bg status-disapproved">ไม่ถูกอนุมัติ</span>
        </template>

        <template v-else-if="group.items.some(item => item.status?.toLowerCase() === 'return-pending')">
  <div>
    <button
      class="return-btn"
      @click="returnGroup(group)"
      :disabled="processingGroups.has(group.booking_id)"
    >
      รับคืนอุปกรณ์
    </button>

    <!-- ✅ ข้อความกำลังดำเนินการ -->
    <span
      v-if="processingGroups.has(group.booking_id)"
      style="margin-left:8px;font-size:.9rem;color:#555;"
    >
      กำลังดำเนินการ...
    </span>
  </div>
</template>


        <template v-else-if="group.items.some(item => item.status?.toLowerCase() === 'returned')">
          <span class="status-bg status-returned">รับคืนอุปกรณ์แล้ว</span>
        </template>

      </td>
      <td>
        <button class="remark-btn" @click="detailGroup(group)">รายละเอียด</button>
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
const API_BASE = import.meta.env.VITE_API_BASE

axios.defaults.withCredentials = true

export default {
  data() {
    return {
      isSidebarClosed: false,
      isMobile: window.innerWidth <= 600,
      announcement: "",
      showAnnouncementBar: false,
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      userId: localStorage.getItem('user_id') || '',
      lastCheckedIds: new Set(),
      usersMap: {},
      equipmentGroups: [],
      polling: null,
      pollingNotif: null,
      lastSeenTimestamp: 0,
       processingGroups: new Set(),
    }
  },
 computed: {
  groupedEquipments() {
    function isEmpty(val) {
      return val === undefined || val === null || val === "" || val === "null";
    }

    // กรองเฉพาะยืมวันเดียว
    let groups = this.equipmentGroups.filter(group =>
      group.items.every(item =>
        (!item.agency || item.agency === "") &&
        isEmpty(item.since) && isEmpty(item.uptodate)
      )
    );

    // *** ซ่อนทั้งกลุ่มถ้ามี returned หรือ disapproved ใน group.items ***
    groups = groups.filter(group =>
      !group.items.some(item =>
        ["returned", "disapproved"].includes((item.status || "").toLowerCase())
      )
    );

    // ส่วน return-pending เดิม
    const bookingIdsWithReturnPending = new Set();
    groups.forEach(group => {
      if (group.items.some(item => (item.status || '').toLowerCase() === 'return-pending')) {
        bookingIdsWithReturnPending.add(group.booking_id);
      }
    });

    groups = groups.map(group => {
      if (bookingIdsWithReturnPending.has(group.booking_id)) {
        const filteredItems = group.items.filter(item => (item.status || '').toLowerCase() === 'return-pending');
        return {
          booking_id: group.booking_id,
          items: filteredItems
        };
      }
      return group;
    }).filter(group => group.items.length > 0);

    // ฟิลเตอร์สถานะ (ถ้ามี)
    if (this.filterStatus) {
      groups = groups.filter(group =>
        group.items.every(item => (item.status || '').toLowerCase() === this.filterStatus)
      );
    }

    return groups;
  }
},





  methods: {
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed
    },
    closeSidebarOnMobile() {
      if (this.isMobile) this.isSidebarClosed = true
    },

    checkMobile() {
      this.isMobile = window.innerWidth <= 600
      // Auto close sidebar เมื่อย่อหน้าจอเป็น mobile
      if (this.isMobile) this.isSidebarClosed = true
    },


    toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      // ✅ บันทึกเวลาอ่านล่าสุดแบบถาวร (ใช้ key แยกของ staff)
      this.lastSeenTimestamp = Date.now();
      localStorage.setItem('staff_lastSeenTimestamp', this.lastSeenTimestamp);
      this.unreadCount = 0;
    }
  },

  pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // ✅ 7 วันย้อนหลัง
  this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
},

    closeNotifications() {
      this.showNotifications = false
    },
    async fetchUsers() {
      try {
        const res = await axios.get(`${API_BASE}/api/users`);
        this.usersMap = {};
        res.data.forEach(u => {
          this.usersMap[u.user_id || u._id] =
            (u.firstname && u.lastname)
              ? `${u.firstname} ${u.lastname}`
              : (u.name || u.user_id || u._id);
        });
      } catch (err) {
        this.usersMap = {};
      }
    },
    formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })
},

    async fetchPendingEquipments() {
      try {
        // pending
        const pendingRes = await axios.get(`${API_BASE}/api/equipments/pending`);
        const pendingList = pendingRes.data.map((h) => ({
  id: h._id?.$oid || h._id,
  name: h.name || "-",
  quantity: h.quantity || "-",
  user_id: h.user_id || "-",
  requester: h.requester || "-",
  date: h.date || "-",
  booking_id: h.booking_id || null,
  status: h.status || "Pending",
  agency: h.agency ?? "",          // เพิ่ม!
  since: h.since ?? null,          // เพิ่ม!
  uptodate: h.uptodate ?? null,    // เพิ่ม!
  attachment: h.attachment || h.returnPhoto || null,
  fileName: h.fileName || null,
}));


        // return-pending
        const returnRes = await axios.get(`${API_BASE}/api/equipments/return-pending`);
        const returnList = returnRes.data.map((h) => ({
  id: h._id?.$oid || h._id,
  name: h.name || "-",
  quantity: h.quantity || "-",
  user_id: h.user_id || "-",
  requester: h.requester || "-",
  date: h.date || "-",
  booking_id: h.booking_id || null,
  status: "return-pending",
  agency: h.agency ?? "",          // เพิ่ม!
  since: h.since ?? null,          // เพิ่ม!
  uptodate: h.uptodate ?? null,    // เพิ่ม!
  attachment: h.attachment || h.returnPhoto || null,
  fileName: h.fileName || null,
}));


        const allList = [...pendingList, ...returnList];

        // group by booking_id
        const groups = {};
        allList.forEach(item => {
          const key = item.booking_id || 'single_' + item.id;
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        });
        this.equipmentGroups = Object.entries(groups).map(([booking_id, items]) => ({
          booking_id,
          items
        }));
      } catch (err) {
        this.equipmentGroups = [];
        console.error('โหลดข้อมูล booking ไม่สำเร็จ:', err);
      }
    },
    async approveGroup(group) {
  // ✅ กันกดย้ำ: ถ้า group นี้กำลังประมวลผลอยู่ ให้ return ทันที
  if (this.processingGroups.has(group.booking_id)) return;

  const ask = await Swal.fire({
    title: 'อนุมัติรายการนี้',
    text: 'คุณต้องการอนุมัติรายการยืมอุปกรณ์นี้?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'อนุมัติ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#50b053',
    cancelButtonColor: '#999'
  });
  if (!ask.isConfirmed) return;

  const staffId = localStorage.getItem('user_id');

  // ✅ ล็อก group ไว้ก่อน กันยิงซ้ำ
  this.processingGroups.add(group.booking_id);

  const isAlreadyApprovedError = (err) => {
    const code = err?.response?.status;
    const msg  = (err?.response?.data?.message || err?.message || '').toLowerCase();
    return code === 409 ||
           (code === 400 && /already|approved|อนุมัติแล้ว|ซ้ำ/.test(msg));
  };

  try {
    // ✅ ยิงทีละ item เหมือนเดิม แต่ล็อกไว้แล้วจะไม่ถูกกดย้ำ
    const results = await Promise.allSettled(
      group.items.map(item =>
        axios.patch(`${API_BASE}/api/history/${item.id}/approve_equipment`, { staff_id: staffId })
          .then(() => ({ ok: true, item }))
          .catch(err => ({ ok: isAlreadyApprovedError(err), err, item }))
      )
    );

    const logicalSuccessIdx = [];
    const hardFailed = [];
    results.forEach((r, i) => {
      const payload = r.status === 'fulfilled' ? r.value : r.reason;
      if (payload.ok) logicalSuccessIdx.push(i);
      else hardFailed.push({ i, name: group.items[i]?.name, err: payload.err });
    });

    // อัปเดตสถานะฝั่ง UI สำหรับตัวที่สำเร็จ
    logicalSuccessIdx.forEach(i => { group.items[i].status = 'Approved'; });

    // ✅ ตรวจซ้ำจาก backend ว่าทั้งกลุ่มอนุมัติครบแล้วจริงหรือไม่
    const verifyAllApproved = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/history`);
        const all = Array.isArray(res.data) ? res.data : [];
        const items = all.filter(h =>
          h.type !== 'field' &&
          (h.booking_id || `single_${h._id?.$oid || h._id}`) === group.booking_id
        );
        if (items.length === 0) return logicalSuccessIdx.length > 0; // fallback
        return items.every(h => (h.status || '').toLowerCase() === 'approved');
      } catch {
        return logicalSuccessIdx.length > 0; // fallback เมื่อเช็คไม่ได้
      }
    };

    let allApproved = hardFailed.length === 0;
    if (!allApproved && logicalSuccessIdx.length > 0) {
      allApproved = await verifyAllApproved();
    }

    if (allApproved) {
      group.items.forEach(it => (it.status = 'Approved'));
      Swal.fire({
        title: 'สำเร็จ',
        text: 'รายการทั้งหมดถูกอนุมัติ',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } else if (logicalSuccessIdx.length > 0) {
      const failedNames = hardFailed.map(f => f.name || `#${f.i + 1}`).join(', ');
      Swal.fire({
        title: 'สำเร็จบางส่วน',
        html: `อนุมัติสำเร็จ ${logicalSuccessIdx.length} รายการ<br>ล้มเหลว ${hardFailed.length} รายการ<br><small>ที่ล้มเหลว: ${failedNames}</small>`,
        icon: 'warning'
      });
    } else {
      Swal.fire('Error', 'อนุมัติไม่สำเร็จ', 'error');
    }

    // ✅ รีเฟรชรายการหลังทำเสร็จ
    this.fetchPendingEquipments();
  } finally {
    // ✅ ปลดล็อก ไม่ว่าจะสำเร็จ/ล้มเหลว
    this.processingGroups.delete(group.booking_id);
  }
},


    async cancelGroup(group) {
  const { value: remark } = await Swal.fire({
    title: 'ไม่อนุมัติรายการ',
    html: `
      <div style="text-align:center;margin-bottom:8px;">
        กรุณาระบุหมายเหตุที่ไม่อนุมัติ
      </div>
    `,
    input: 'textarea',
    inputAttributes: { 'aria-label': 'remark' },
    showCancelButton: true,
    confirmButtonText: 'ไม่อนุมัติ',
    cancelButtonText: 'ยกเลิก',
    inputPlaceholder: 'ระบุหมายเหตุ (จำเป็นต้องกรอก)',
    confirmButtonColor: '#ff4d4f',
    cancelButtonColor: '#999',
    preConfirm: (val) => {
      const v = (val || '').trim();
      if (!v) {
        Swal.showValidationMessage('กรุณากรอกหมายเหตุ');
        return false;
      }
      return v;
    }
  });

  if (remark === undefined) return; // กดยกเลิก

  const staffId = localStorage.getItem('user_id');

  try {
    await Promise.all(
      group.items.map(item =>
        axios.patch(`${API_BASE}/api/history/${item.id}/disapprove_equipment`, {
          staff_id: staffId,
          remark   // ✅ ส่ง remark ไปด้วย
        })
      )
    );

    // อัปเดตสถานะฝั่ง UI
    group.items.forEach(item => { item.status = 'Disapproved'; });

    await Swal.fire({
      icon: 'error',
      title: 'ดำเนินการสำเร็จ',
      text: 'ยกเลิกรายการเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false
    });

    this.fetchPendingEquipments(); // refresh รายการ
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'ไม่สามารถบันทึกการไม่อนุมัติได้', 'error');
  }
},

    detailGroup(group) {
  const esc = (s) =>
    String(s ?? '-')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  const fmtDate = (d) => {
    if (!d) return '-';
    const x = new Date(d);
    return isNaN(x) ? '-' : x.toLocaleDateString('th-TH', {year:'numeric',month:'2-digit',day:'2-digit'});
  };

  // ✅ แปลงสถานะเป็นภาษาไทย
  const statusTitle = (s='') => {
    const m = s.toLowerCase();
    if (m==='approved') return 'ถูกอนุมัติ';
    if (m==='disapproved') return 'ไม่ถูกอนุมัติ';
    if (m==='returned') return 'รับคืนอุปกรณ์แล้ว';
    if (m==='pending') return 'รอดำเนินการ';
    if (m==='return-pending') return 'รอรับคืน';
    return s || '-';
  };

  const hasPeriod = group.items.some(it => it.since || it.uptodate);

  const rows = group.items.map((it, idx) => {
    const requester = this.usersMap[it.user_id] || it.requester || it.user_id || '-';
    const photoSrc = it.attachment || it.returnPhoto || it.fileData || '';
    const photoCell = photoSrc
      ? `<img src="${photoSrc}" class="equip-thumb" alt="photo"
               onclick="window.__equipShowPhoto && window.__equipShowPhoto('${photoSrc}')"/>
         <div class="equip-thumb-hint">(คลิกเพื่อดูรูปเต็ม)</div>`
      : '-';

    return `
      <tr>
        <td class="td-center">${idx + 1}</td>
        <td>${esc(it.name)}</td>
        <td class="td-center">${esc(it.quantity ?? '-')}</td>
        <td>${esc(requester)}</td>
        <td class="td-center">${esc(it.user_id ?? '-')}</td>
        ${
          hasPeriod
            ? `<td class="td-center">${esc(fmtDate(it.since))}</td>
               <td class="td-center">${esc(fmtDate(it.uptodate))}</td>`
            : `<td class="td-center">${esc(fmtDate(it.date))}</td>`
        }
        <!-- ✅ ใช้ statusTitle แทน -->
        <td class="td-center">${esc(statusTitle(it.status))}</td>
        <td class="td-center">${photoCell}</td>
      </tr>
    `;
  }).join('');

  const cols = hasPeriod
    // #, Equipment, Amount, Requester, UserID, Since, Until, Status, Photo
    ? `<col style="width:5%"><col style="width:20%"><col style="width:8%">
       <col style="width:15%"><col style="width:12%"><col style="width:12%">
       <col style="width:10%"><col style="width:8%"><col style="width:10%">`
    // #, Equipment, Amount, Requester, UserID, Date, Status, Photo
    : `<col style="width:5%"><col style="width:22%"><col style="width:8%">
       <col style="width:18%"><col style="width:15%"><col style="width:12%">
       <col style="width:10%"><col style="width:10%">`;

  const head = hasPeriod
    ? `<tr>
         <th>ลำดับ</th><th>อุปกรณ์</th><th>จำนวน</th><th>ผู้ขอใช้</th>
         <th>รหัสนักศึกษา/พนักงาน</th><th>ตั้งแต่</th><th>ถึง</th>
         <th>สถานะ</th><th>รูป</th>
       </tr>`
    : `<tr>
         <th>ลำดับ</th><th>อุปกรณ์</th><th>จำนวน</th><th>ผู้ขอใช้</th>
         <th>รหัสนักศึกษา/พนักงาน</th><th>วันที่ยืม</th>
         <th>สถานะ</th><th>รูป</th>
       </tr>`;

  const html = `
    <div class="equip-table-wrap">
      <table class="equip-table">
        <colgroup>${cols}</colgroup>
        <thead>${head}</thead>
        <tbody>${rows || `<tr><td colspan="${hasPeriod?9:8}" class="td-center">ไม่มีรายการ</td></tr>`}</tbody>
      </table>
    </div>
  `;

  Swal.fire({
    title: 'รายละเอียดรายการยืมอุปกรณ์',
    html,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3085d6',
    customClass: { popup: 'equip-swal' },
    didOpen: () => {
      window.__equipShowPhoto = (src) => {
        const w = window.open('', '_blank');
        w.document.write(`
          <html><head><title>รูปอุปกรณ์</title>
          <style>
            body{background:#111;margin:0;display:flex;align-items:center;justify-content:center;height:100vh}
            img{max-width:100vw;max-height:100vh;object-fit:contain;border-radius:16px;box-shadow:0 8px 30px #0008}
          </style></head>
          <body onclick="window.close()"><img src="${src}"></body></html>
        `);
      };
    },
    willClose: () => { window.__equipShowPhoto = undefined; }
  });
},



    async returnGroup(group) {
  // ✅ กันกดย้ำ
  if (this.processingGroups.has(group.booking_id)) return;
  this.processingGroups.add(group.booking_id);

  const staffId = localStorage.getItem('user_id');
  const itemWithPhoto = group.items.find(item => !!item.attachment || !!item.returnPhoto || !!item.fileData);
  const imgSrc =
    (itemWithPhoto && itemWithPhoto.returnPhoto) ||
    (itemWithPhoto && itemWithPhoto.attachment) ||
    (itemWithPhoto && itemWithPhoto.fileData);

  let photoHtml = '';
  if (imgSrc) {
    photoHtml = `
      <div style="text-align:center;margin-bottom:12px;">
        <img
          src="${imgSrc}"
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
    title: 'ยืนยันการคืนอุปกรณ์ทั้งหมด?',
    html: `
      <div style="margin-bottom:8px;">
        ${photoHtml}
        <hr>
        คุณต้องการคืนอุปกรณ์ทั้งหมดนี้หรือไม่?<br>
        <span style="font-size:0.9em;color:#666;">(กรุณาเลือกสถานะและกรอกหมายเหตุ ถ้าหากอุปกรณ์ไม่สมบูรณ์)</span>
      </div>
      <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 8px;">
        <label style="margin-right: 2em;">
          <input type="radio" name="equipStatus" value="good" checked> สมบูรณ์
        </label>
        <label>
          <input type="radio" name="equipStatus" value="bad"> ไม่สมบูรณ์
        </label>
      </div>
      <div id="remarkBox"
           style="margin-top:1em; display:none; justify-content:center; align-items:center; width:100%;">
        <input id="remarkInput" class="swal2-input" placeholder="กรุณากรอกหมายเหตุ" />
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'คืนอุปกรณ์',
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
        if (imgSrc) {
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
                <img src="${imgSrc}" alt="รูปคืนอุปกรณ์" />
              </body>
            </html>
          `);
        }
      };
      const radios = document.getElementsByName('equipStatus');
      radios.forEach(radio => {
        radio.addEventListener('change', () => {
          document.getElementById('remarkBox').style.display =
            radio.value === 'bad' && radio.checked ? 'flex' : 'none';
        });
      });
    },
    willClose: () => {
      window.__showFullPhoto = undefined;
    }
  });

  if (!result) {
    this.processingGroups.delete(group.booking_id);
    return;
  }

  // หา since กับ uptodate จาก item ที่มี (ถ้ามีมากกว่าหนึ่ง ใช้ตัวแรกที่เจอ)
  let since = null;
  let uptodate = null;
  for (const item of group.items) {
    if (item.since && item.uptodate) {
      since = item.since;
      uptodate = item.uptodate;
      break;
    }
  }

  try {
    await Promise.all(
      group.items.map(item =>
        axios.patch(`${API_BASE}/api/history/${item.id}/return`, {
          staff_id: staffId,
          status: result.status,
          remark: result.remark,
          attachment: item.attachment || item.returnPhoto || item.fileData,
          fileName: item.fileName,
          booking_id: item.booking_id || null,
          ...(since ? { since } : {}),
          ...(uptodate ? { uptodate } : {})
        })
      )
    );

    group.items.forEach(item => {
      item.status = 'Returned';
      if (since) item.since = since;
      if (uptodate) item.uptodate = uptodate;
    });

    Swal.fire({
      title: 'สำเร็จ',
      text: `คุณได้คืนอุปกรณ์กลุ่มนี้แล้ว`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });

    this.fetchPendingEquipments();
  } catch (err) {
    Swal.fire('Error', 'คืนอุปกรณ์ไม่สำเร็จ', 'error');
  } finally {
    // ✅ ปลดล็อกกลุ่มนี้ไม่ว่าจะสำเร็จหรือล้มเหลว
    this.processingGroups.delete(group.booking_id);
  }
},



    async fetchAllEquipments() {
  try {
    const res = await axios.get(`${API_BASE}/api/history`);
    const allList = res.data
  .filter(h => h.type !== 'field')
  .map(h => ({
    id: h._id?.$oid || h._id,
    name: h.name || "-",
    quantity: h.quantity || "-",
    user_id: h.user_id || "-",
    requester: h.requester || "-",
    date: h.date || "-",
    booking_id: h.booking_id || 'single_' + (h._id?.$oid || h._id),
    status: (h.status || "").toLowerCase(),
    agency: h.agency ?? "",          // เพิ่ม!
    since: h.since ?? null,          // เพิ่ม!
    uptodate: h.uptodate ?? null,    // เพิ่ม!
    updatedAt: h.updatedAt || h.updated_at || h.date || null,
    attachment: h.attachment || h.returnPhoto || null,
    fileName: h.fileName || null,
    type: h.type
  }));


    // group by booking_id
    const groups = {};
    allList.forEach(item => {
      const key = item.booking_id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    this.equipmentGroups = Object.entries(groups).map(([booking_id, items]) => ({
      booking_id,
      items
    }));
  } catch (err) {
    this.equipmentGroups = [];
    console.error('โหลดข้อมูล booking ไม่สำเร็จ:', err);
  }
},
    async fetchNotifications() {
  try {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // ✅ เก็บแค่ 7 วันล่าสุด

    // ล้างของเก่ากว่า 7 วัน ก่อน
    this.pruneOldNotifications();

    // ดึงงานที่ "รออนุมัติ" (สำหรับ staff)
    const res = await axios.get(`${API_BASE}/api/equipments/pending`);
    const data = Array.isArray(res.data) ? res.data : [];

    // คัดเฉพาะที่ยังไม่เคยแจ้ง (กันซ้ำด้วย lastCheckedIds)
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
          type: 'pending',                       // สำหรับจัดสีสไตล์ ถ้าต้องการ
          timestamp: ts,
          message: `มีรายการ '${item.name}' ที่รออนุมัติ`,
        };
      });

      // รวม + กันซ้ำด้วย id + เรียงล่าสุดก่อน
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      // ตัดแจ้งเตือนที่เก่ากว่า 7 วันอีกรอบ (ป้องกันกรณี timestamp จาก backend เก่ามาก)
      this.pruneOldNotifications();

      // มาร์คว่าเคยเห็น item เหล่านี้แล้ว (กันเด้งซ้ำ)
      fresh.forEach(item => this.lastCheckedIds.add(item._id?.$oid || item._id));
    }

    // ✅ นับ unread เฉพาะที่ timestamp > lastSeenTimestamp (ข้ามหน้าเลขจะไม่กลับมา)
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch (err) {
    // เงียบไว้เหมือนเดิม
  }
},

  },
  async mounted() {
  await this.fetchUsers();
  this.fetchAllEquipments();  // โหลดรอบแรกทันที
  this.lastSeenTimestamp = parseInt(localStorage.getItem('staff_lastSeenTimestamp') || '0');


  // ✅ โหลดข้อมูลใหม่ทุก 5 วินาที
  this.polling = setInterval(this.fetchAllEquipments, 5000);

  // ✅ โหลดประกาศ
  try {
    const annRes = await axios.get(`${API_BASE}/api/announcement`);
    this.announcement = annRes.data?.announce || "";
    this.showAnnouncementBar = !!this.announcement;
  } catch (err) {
    this.announcement = "";
    this.showAnnouncementBar = false;
  }

  // ✅ โหลดแจ้งเตือน
  this.fetchNotifications();
  this.pollingNotif = setInterval(this.fetchNotifications, 30000);

  window.addEventListener('resize', this.checkMobile);
},

  beforeUnmount() {
  clearInterval(this.polling);       // ✅ หยุด auto refresh
  clearInterval(this.pollingNotif);  // ✅ หยุดเช็คแจ้งเตือน
  window.removeEventListener('resize', this.checkMobile);
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
  grid-template-columns: 200px 80px auto;
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
.status-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.approve-btn {
  padding: 4px 10px;
  background-color: #2baf2b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: background-color 0.3s;
}
.approve-btn:hover {
  background-color: #42bd41;
}
.cancel-btn {
  padding: 4px 10px;
  background-color: #e84e40;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: background-color 0.3s;
}
.cancel-btn:hover {
  background-color: #d9363e;
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

/* Animation แถบประกาศ slide down */
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

/* ตัวแถบประกาศ */
.announcement-bar {
  display: flex;
  align-items: center;  
  gap: 1.2rem;
  width: 100%;
  max-width: 900px; 
  margin: 12px auto;
  background: #ffeaeac8; /* ชมพูอ่อนแบบ danger alert */
  color: #e53e3e;      /* ฟอนต์แดง */
  font-size: 1.15rem;
  font-weight: 500;
  border-radius: 12px;
  padding: 1rem 2rem;
   box-shadow: 0 4px 18px rgba(255, 80, 80, 0.13);
  border: 1.5px solid #fdb6b6;
  position: sticky;
  top: 60px;                  /* ระยะห่างจากขอบบน ปรับให้เท่ากับความสูง navbar */
  z-index: 900;               /* ให้อยู่เหนือเนื้อหา แต่ต่ำกว่า navbar */
}
.announcement-icon {
  width: 34px;
  height: 34px;
  min-width: 34px;
  min-height: 34px;
  background: #ff5a5f;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 7px;
  box-shadow: 0 1px 5px #ffbfc1a0;
  flex-shrink: 0;
}
.announcement-icon i {
  color: #fff !important;
  font-size: 1.3rem !important;
  margin-top: 1px;
}


.announcement-bar-text {
  flex: 1;
  display: flex;
  align-items: center;
  word-break: break-word;
   gap: 0.8rem;
  white-space: pre-wrap;   /* อันนี้สำคัญ */
  overflow-wrap: anywhere;
  font-size: 1.07rem;
  font-weight: 500;
  color: #e53e3e; /* ฟอนต์แดง */
}
.close-announcement-btn {
  margin-left: 12px;
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s;
  display: flex;
  align-items: center;
}
.close-icon {
  width: 32px;
  height: 32px;
  background: #ffe0e3; /* วงกลมจางๆ */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  box-shadow: 0 1px 6px #f6b4b833;
}

.close-icon i {
  color: #e53e3e !important;
  font-size: 1.28rem !important;
}

.close-announcement-btn:hover .close-icon {
  background: #ffd1d7;
  /* สามารถปรับเฉดเมื่อ hover */
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
.notification-dropdown {
  z-index: 1500;
}

.table-container {
  padding: 0 70px;
  overflow-x: auto;
}
.equipment-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.equipment-table th, .equipment-table td {
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}
.equipment-table th {
  background: #1e3a8a;
  color: #fff;
  font-weight: bold;
}
.equipment-table tr:last-child td {
  border-bottom: none;
}

.return-btn {
  padding: 4px 10px;
  background-color: #03a9f4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: background-color 0.3s;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.return-btn:hover{
  background-color: #0277bd;
}

.status-bg {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 8px;
}
.status-approved {
  background: #d0f8ce!important;    /* ฟ้าอ่อน */
  color: #259b24!important;         /* ฟ้าเข้ม */
  border: 1.5px solid #90caf9;
  border-radius: 20px;
  font-weight: bold;
  padding: 2px 18px;
  display: inline-block;
  min-width: 110px;
  text-align: center;
}

.status-returned {
  background: #e3f2fd !important;    /* ฟ้าอ่อน */
  color: #1565c0 !important;         /* น้ำเงินเข้ม */
  border: 1.5px solid #64b5f6;
  border-radius: 20px;
  font-weight: bold;
  padding: 2px 18px;
  display: inline-block;
  min-width: 110px;
  text-align: center;
}

.status-disapproved {
  background: #fff3cd !important;    /* เหลืองอ่อน */
  color: #e84e40 !important;         /* แดง/ส้ม */
  border: 1.5px solid #ffe082;
  border-radius: 20px;
  font-weight: bold;
  padding: 2px 18px;
  display: inline-block;
  min-width: 110px;
  text-align: center;
}

.status-pending {
  background: #e3f2fd !important;    /* ฟ้าอ่อน */
  color: #1976d2 !important;         /* ฟ้าเข้ม */
  border: 1.5px solid #90caf9;
  border-radius: 20px;
  font-weight: bold;
  padding: 2px 18px;
  display: inline-block;
  min-width: 110px;
  text-align: center;
}

.status-return-pending {
  background: #f6d365 !important; /* สีเหลืองจางๆ สำหรับ return-pending */
}

.approve-btn[disabled],
.cancel-btn[disabled]{
  opacity: .6;
  cursor: not-allowed;
}


</style>

<style>
@import '../css/style.css';

/* ===== SweetAlert เฉพาะหน้า approve_equipment ===== */
.equip-swal.swal2-popup{
  width: clamp(860px, 84vw, 1285px);
  max-width: 96vw;
  padding: 22px 24px 18px;
}
.equip-swal .swal2-html-container{
  text-align: left !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* ตารางใน SweetAlert */
.equip-swal .equip-table-wrap{
  max-width: 100%;
  max-height: 72vh;
  overflow: auto;
  padding-top: 6px;
}
.equip-swal .equip-table{
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;   /* ให้คอลัมน์ยืดหยุ่น */
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}
.equip-swal .equip-table thead th{
  background: #1e3a8a;
  color: #fff;
  font-weight: 700;
  padding: 10px 8px;
  text-align: center;
  position: sticky; top: 0; z-index: 1;
}
.equip-swal .equip-table td{
  padding: 8px 10px;
  border-bottom: 1px solid #e6e9f3;
  vertical-align: top;
  font-size: 0.95rem;
  white-space: normal;
  word-break: break-word;
}
.equip-swal .equip-table tbody tr:hover{
  background: #f7f9ff;
}
.equip-swal .td-center{ text-align: center; }

/* รูป thumbnail */
.equip-swal .equip-thumb{
  max-width: 120px;
  max-height: 85px;
  object-fit: contain;
  border: 1px solid #cfd5e6;
  border-radius: 8px;
  cursor: pointer;
  display: inline-block;
}
.equip-swal .equip-thumb-hint{
  font-size: 0.8rem;
  color: #8a8fa3;
  margin-top: 4px;
}

/* กัน "ลำดับ" ตกบรรทัด + กำหนดความกว้างขั้นต่ำของคอลัมน์แรก */
.equip-swal .equip-table thead th:first-child,
.equip-swal .equip-table tbody td:first-child {
  white-space: nowrap;     /* ไม่ตัดบรรทัด */
  min-width: 64px;         /* กันบีบจนต้องตัด */
}

/* ถ้าตารางยังบีบมาก ให้ลด padding เฉพาะหัวคอลัมน์แรกนิดหน่อย */
.equip-swal .equip-table thead th:first-child {
  padding-left: 6px;
  padding-right: 6px;
}
/* ✅ ขยายและจัดกลางช่องกรอกหมายเหตุใน SweetAlert */
/* กล่องครอบช่องกรอกให้กินเต็มความกว้างของ popup */
.equip-swal #remarkBox{
  width: 100%;
  padding: 0 16px;          /* กันชิดขอบนิดนึง */
  box-sizing: border-box;
  gap: 8px;
}

/* ขยาย input ให้เต็มความกว้างของ #remarkBox */
.equip-swal #remarkInput.swal2-input{
  width: 100% !important;
  max-width: 100% !important;  /* เดิมเป็น 720px */
  min-width: 0 !important;
  margin: 0 auto !important;
  flex: 1 1 auto;              /* เผื่ออยู่ใน flex container */
}

/* หน้าจอเล็กก็ยังเต็ม กว้างพอดี */
@media (max-width: 640px){
  .equip-swal #remarkInput.swal2-input{
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
  }
}


</style>