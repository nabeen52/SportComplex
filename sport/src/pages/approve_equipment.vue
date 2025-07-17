<template>
  <div class="layout">
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/approve_equipment" exact-active-class="active">
          <i class="pi pi-home"></i> Approve
        </router-link>
        <router-link to="/equipment" active-class="active">
          <i class="pi pi-map-marker"></i> Equipment
        </router-link>
        <router-link to="/return" active-class="active">
          <i class="pi pi-box"></i> Return
        </router-link>
        <router-link to="/history_staff" active-class="active">
          <i class="pi pi-history"></i> History
        </router-link>
      </nav>
    </aside>

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
        <h1 style="padding-left: 50px; display: flex; justify-content: center;">Approve Equipment</h1>
        <div class="hist-grid">
          <div class="hist-card" v-for="group in groupedEquipments" :key="group.booking_id">
            <div class="hist-row" style="border-bottom:1px solid #eee;">
              <span class="item-name" style="font-weight:600;">
                รายการอุปกรณ์  
              </span>
              <span class="item-amount" style="font-size:0.9em;">
                
              </span>
              <span class="status-group">
                <button class="approve-btn" @click="approveGroup(group)">Approve</button>
                <button class="cancel-btn" @click="cancelGroup(group)">Cancel</button>
                <button class="remark-btn" @click="detailGroup(group)">Detail</button>
              </span>
            </div>
            <div v-for="(item, i) in group.items" :key="item.id" class="hist-row" style="border-bottom:1px dashed #ccc;">
              <span class="item-name">อุปกรณ์ที่ {{ i + 1 }}: {{ item.name }}</span>
              <span class="item-amount">จำนวน: {{ item.quantity }}</span>
              <span class="item-amount"></span>
            </div>
          </div>
        </div>
      </div>

      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel. 053-917-7821 | Facebook:
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
const API_BASE = import.meta.env.VITE_API_BASE


axios.defaults.withCredentials = true    // <------ **บรรทัดสำคัญ!**

export default {
  data() {
    return {
      isSidebarClosed: false,
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
      return this.equipmentGroups
    }
  },
  methods: {
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed
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

async fetchPendingEquipments() {
  try {
    
    const res = await axios.get(`${API_BASE}/api/equipments/pending`);
    const mapped = res.data.map((h, idx) => ({
      id: (typeof h._id === 'object' && h._id.$oid) ? h._id.$oid : h._id,
      name: h.name || "-",
      quantity: h.quantity || "-",
      user_id: h.user_id || "-",
      requester: h.requester || "-",
      date: h.date || "-",
      booking_id: h.booking_id || null,
      status: h.status || "Pending",
    }));

    // Group by booking_id
    const groups = {};
    mapped.forEach(item => {
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
    title: 'Approve ทั้งหมด?',
    text: 'อนุมัติรายการอุปกรณ์นี้ทั้งหมด?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Approve',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#50b053',
    cancelButtonColor: '#d9363e'
  });
  if (result.isConfirmed) {
    const staffId = localStorage.getItem('user_id');
    
    try {
      // DEBUG LOG
      console.log('Approving items:', group.items.map(i => i.id), 'staffId:', staffId);
      await Promise.all(group.items.map(item =>
        axios.patch(`${API_BASE}/api/history/${item.id}/approve_equipment`, {
          staff_id: staffId
        })
      ));
      this.equipmentGroups = this.equipmentGroups.filter(g => g !== group);
      Swal.fire('Approved!', 'รายการทั้งหมดถูกอนุมัติ', 'success');
    } catch (e) {
      Swal.fire('Error', e.message || 'Approve failed', 'error');
      console.error('Approve error:', e);
    }
  }
},


async cancelGroup(group) {
  const result = await Swal.fire({
    title: 'Cancel ทั้งหมด?',
    text: 'ยกเลิกรายการอุปกรณ์นี้ทั้งหมด?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Cancel All',
    cancelButtonText: 'Back',
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
    this.equipmentGroups = this.equipmentGroups.filter(g => g !== group);
    Swal.fire('Cancelled!', 'รายการทั้งหมดถูกยกเลิก', 'error');
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
    title: 'รายละเอียดรายการ',
    html,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3085d6'
  });
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
  await this.fetchPendingEquipments();
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
},

  beforeUnmount() {
    clearInterval(this.polling)
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
  background-color: #50b053;
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
  background-color: #d34346;
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

</style>

<style>
@import '../css/style.css';
</style>
