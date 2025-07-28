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
                <li v-for="(noti, idx) in notifications" :key="idx">{{ noti.message }}</li>
                <li v-if="notifications.length === 0">ไม่มีแจ้งเตือน</li>
              </ul>
            </div>
          </div>
          <router-link to="/profile_staff"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- แถบประกาศ -->
      <transition name="slide-down">
        <div class="announcement-bar" v-if="showAnnouncementBar">
          <i class="pi pi-megaphone announcement-icon"></i>
          <div class="announcement-bar-text">{{ announcement }}</div>
          <button class="close-announcement-btn" @click="showAnnouncementBar = false">
            <i class="pi pi-times" style="color: red;"></i>
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
            <button class="approve-btn" @click="approveGroup(group)" style="margin-right:10px;">อนุมัติ</button>
            <button class="cancel-btn" @click="cancelGroup(group)">ไม่อนุมัติ</button>
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
            <button class="return-btn" @click="returnGroup(group)">รับคืนอุปกรณ์</button>
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
            Tel. 053-917-7821 |
            Facebook: <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
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
      if (this.showNotifications) this.unreadCount = 0;
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
      const result = await Swal.fire({
        title: 'อนุมัติรายการนี้?',
        text: 'อนุมัติรายการยืมอุปกรณ์นี้?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'อนุมัติ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#50b053',
        cancelButtonColor: '#999'
      });
      if (result.isConfirmed) {
        const staffId = localStorage.getItem('user_id');
        try {
          await Promise.all(group.items.map(item =>
            axios.patch(`${API_BASE}/api/history/${item.id}/approve_equipment`, {
              staff_id: staffId
            })
          ));
          group.items.forEach(item => {
            item.status = 'Approved';
          });
          Swal.fire('Approved!', 'รายการทั้งหมดถูกอนุมัติ', 'success');
          this.fetchPendingEquipments();
        } catch (e) {
          Swal.fire('Error', e.message || 'Approve failed', 'error');
          console.error('Approve error:', e);
        }
      }
    },
    async cancelGroup(group) {
      const result = await Swal.fire({
        title: 'ไม่อนุมัติรายการ?',
        text: 'ไม่อนุมัติรายการยืมอุปกรณ์นี้?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ไม่อนุมัติ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ff4d4f',
        cancelButtonColor: '#999'
      });
      if (result.isConfirmed) {
        const staffId = localStorage.getItem('user_id');
        await Promise.all(group.items.map(item =>
          axios.patch(`${API_BASE}/api/history/${item.id}/disapprove_equipment`, {
            staff_id: staffId
          })
        ));
        group.items.forEach(item => {
          item.status = 'Disapproved';
        });
        Swal.fire('Cancelled!', 'รายการทั้งหมดถูกยกเลิก', 'error');
        this.fetchPendingEquipments();
      }
    },
    detailGroup(group) {
      let html = '<div style="text-align:left;">';
      group.items.forEach((item, i) => {
        html += `
          <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #bbb;">
            <b>อุปกรณ์ที่ ${i + 1}:</b> ${item.name || '-'}<br>
            <b>จำนวน:</b> ${item.quantity || '-'}<br>
            <b>ชื่อผู้ขอใช้:</b> ${this.usersMap[item.user_id] || item.requester || item.user_id || "-"}<br>
            <b>วันที่ขอยืม:</b> ${item.date ? new Date(item.date).toLocaleDateString() : '-'}<br>
          </div>
        `;
      });
      html += '</div>';
      Swal.fire({
        title: 'รายละเอียดรายการยืมอุปกรณ์',
        html,
        confirmButtonText: 'ปิด',
        confirmButtonColor: '#3085d6'
      });
    },
    async returnGroup(group) {
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
      <div id="remarkBox" style="margin-top:1em; display:none;">
        <input id="remarkInput" class="swal2-input" placeholder="กรุณากรอกหมายเหตุ" />
      </div>
    `,
    icon: 'question',
    input: null,
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
            radio.value === 'bad' && radio.checked ? 'block' : 'none';
        });
      });
    },
    willClose: () => {
      window.__showFullPhoto = undefined;
    }
  });

  if (!result) return;

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
          // ส่ง since กับ uptodate เพิ่มเติม
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
      title: 'สำเร็จ!',
      text: `คุณได้คืนอุปกรณ์กลุ่มนี้แล้ว`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
    this.fetchPendingEquipments();
  } catch {
    Swal.fire('Error', 'คืนอุปกรณ์ไม่สำเร็จ', 'error');
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
        const res = await axios.get(`${API_BASE}/api/equipments/pending`);
        const data = Array.isArray(res.data) ? res.data : [];
        const pendings = data.filter(item => !this.lastCheckedIds.has(item._id?.$oid || item._id));
        if (pendings.length) {
          const newMessages = pendings.map(item => ({
            id: item._id?.$oid || item._id,
            message: `มีรายการ '${item.name}' ที่รออนุมัติ`
          }));
          this.notifications = [...this.notifications, ...newMessages];
          pendings.forEach(item => this.lastCheckedIds.add(item._id?.$oid || item._id));
          this.unreadCount = this.notifications.length;
        }
      } catch (err) { }
    },
  },
  async mounted() {
    await this.fetchUsers();
    // await this.fetchPendingEquipments();

    this.fetchAllEquipments();
    try {
      const annRes = await axios.get(`${API_BASE}/api/announcement`);
      this.announcement = annRes.data?.announce || "";
      this.showAnnouncementBar = !!this.announcement;
    } catch (err) {
      this.announcement = "";
      this.showAnnouncementBar = false;
    }
    this.fetchNotifications();
    this.polling = setInterval(this.fetchNotifications, 30000);
     window.addEventListener('resize', this.checkMobile)
  },
  beforeUnmount() {
    clearInterval(this.polling)
    window.removeEventListener('resize', this.checkMobile)
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

/* แถบประกาศ */
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


</style>

<style>
@import '../css/style.css';
</style>