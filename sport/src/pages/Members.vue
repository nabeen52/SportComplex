<template>
  <div class="layout" :class="{ 'sidebar-closed': isSidebarClosed }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/dashboard" exact-active-class="active">
          <i class="pi pi-chart-pie"></i> Dashboard
        </router-link>
        <router-link to="/home_admin" exact-active-class="active">
          <i class="pi pi-megaphone"></i> Edit News
        </router-link>
        <router-link to="/edit_field" active-class="active">
          <i class="pi pi-map-marker"></i> Edit Field
        </router-link>
        <router-link to="/edit_equipment" active-class="active">
          <i class="pi pi-clipboard"></i> Edit Equipment
        </router-link>
        <router-link to="/booking_field_admin" active-class="active">
          <i class="pi pi-map-marker"></i> Book Field
        </router-link>
        <router-link to="/approve_field" active-class="active">
          <i class="pi pi-verified"></i> Approve
        </router-link>
        <router-link to="/return_admin" active-class="active">
            <i class="pi pi-box"></i> Return
          </router-link>
        <router-link to="/members" active-class="active">
          <i class="pi pi-user-edit"></i> Member
        </router-link>
        <router-link to="/history_admin" active-class="active">
          <i class="pi pi-history"></i> History System
        </router-link>
      </nav>
    </aside>
<div
  v-if="isMobile && !isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
></div>
    <!-- Main Content -->
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

      
      <main class="content">
        <div class="title-row">
          <h2>Management</h2>
          <div class="filter-group">
            <button :class="['filter-btn', { active: filter === 'all' }]" @click="filter = 'all'">ทั้งหมด</button>
            <button :class="['filter-btn', { active: filter === 'Staff' }]" @click="filter = 'Staff'">Staff</button>
            <button :class="['filter-btn', { active: filter === 'Admin' }]" @click="filter = 'Admin'">Admin</button>
          </div>
          <button class="add-btn" @click="addMember">＋</button>
        </div>

        <!-- ตารางสมาชิก -->
        <div class="member-table-container">
          <table class="member-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>ตำแหน่ง</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(Member, index) in filteredMembers" :key="index">
                <td>{{ Member.id }}</td>
                <td>{{ Member.name }}</td>
                <td>
                  {{ Member.email }}
                  <span v-if="normalizeEmail(Member.email) === normalizeEmail(currentUserEmail)" style="color:blue;">(me)</span>
                </td>
                <td>{{ Member.position }}</td>
                <td>
                  <!-- ปุ่ม Edit -->
                  <button
                    class="edit-btn"
                    @click="editMember(index)"
                    v-if="normalizeEmail(Member.email) !== normalizeEmail(currentUserEmail)"
                  >Edit</button>
                  <span v-else style="color: #888; font-size: 0.95em;">(คุณ)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <!-- Footer -->
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
import axios from 'axios';
import Swal from 'sweetalert2';
axios.defaults.withCredentials = true;

const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default {
  data() {
    return {
      isSidebarClosed: false,
      filter: 'all',
      Members: [],
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
      isMobile: window.innerWidth <= 600,
      lastSeenTimestamp: 0,
    };
  },
  computed: {
    filteredMembers() {
      if (this.filter === 'all') return this.Members;
      return this.Members.filter(m => m.position === this.filter);
    },
    currentUserEmail() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        return user?.email || "";
      } catch {
        return "";
      }
    }
  },
  mounted() {
  this.lastSeenTimestamp = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0'); // << เพิ่ม

  this.loadMembers();
  this.fetchNotifications();
  this.polling = setInterval(this.fetchNotifications, 30000);

  document.addEventListener('mousedown', this.handleClickOutside);
  window.addEventListener('resize', this.handleResize);
  this.handleResize();
},

  beforeUnmount() {
    if (this.polling) clearInterval(this.polling);
    document.removeEventListener('mousedown', this.handleClickOutside);
    window.removeEventListener('resize', this.handleResize);

  },
  methods: {
    normalizeEmail(email) {
      return (email || '').trim().toLowerCase();
    },
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed;
    },
    toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    this.lastSeenTimestamp = Date.now();
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(this.lastSeenTimestamp));
    this.unreadCount = 0; // เคลียร์ทันที
  }
},
    handleResize() {
    this.isMobile = window.innerWidth <= 600;
    if (!this.isMobile) this.isSidebarClosed = false;
  },
    closeNotifications() { this.showNotifications = false; },

    pruneOldNotifications() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
    },

    handleClickOutside(event) {
      const notifDropdown = document.querySelector('.notification-dropdown');
      const notifBtn = document.querySelector('.notification-btn');
      if (
        notifDropdown &&
        !notifDropdown.contains(event.target) &&
        notifBtn &&
        !notifBtn.contains(event.target)
      ) {
        this.closeNotifications();
      }
    },
    async fetchNotifications() {
  try {
    this.pruneOldNotifications();

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
            : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
        };
      });

      // รวม + unique ตาม id + sort ล่าสุดมาก่อน
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      this.pruneOldNotifications();
    }

    // นับ unread จาก timestamp > lastSeenTimestamp (badge จะไม่กลับมาเอง)
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch {}
},
    async loadMembers() {
  try {
    const res = await axios.get(`${API_BASE}/api/members`);
    this.Members = res.data;
  } catch (e) {
    Swal.fire('เกิดข้อผิดพลาด', 'โหลดรายชื่อสมาชิกไม่สำเร็จ', 'error');
  }
},

    async addMember() {
      const { value: formValues } = await Swal.fire({
        title: 'เพิ่มสมาชิกจาก User',
        html:
          `<input type="email" id="email" class="swal2-input" placeholder="อีเมลผู้ใช้งาน (user)">
          <select id="position" class="swal2-input">
            <option value="">เลือกตำแหน่ง</option>
            <option value="Staff">Staff</option>
            <option value="Admin">Admin</option>
          </select>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'เลื่อนตำแหน่ง',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
          const email = document.getElementById('email').value.trim();
          const position = document.getElementById('position').value;
          if (!email || !isValidEmail(email) || !position) {
            Swal.showValidationMessage('กรุณากรอกอีเมลที่ถูกต้องและเลือกตำแหน่ง');
            return false;
          }
          return { email, position };
        }
      });

      if (formValues) {
        try {
          const check = await axios.get(`${API_BASE}/api/users/email/${encodeURIComponent(formValues.email)}`);
          if (!check.data || check.data.role !== 'user') {
            Swal.fire('ไม่พบผู้ใช้นี้ หรือไม่ใช่ user', '', 'error');
            return;
          }
          await axios.patch(`${API_BASE}/api/members/${encodeURIComponent(formValues.email)}`, formValues);
          await this.loadMembers();
          Swal.fire('เลื่อนตำแหน่งสำเร็จ!', '', 'success');
        } catch (err) {
          Swal.fire('ผิดพลาด', err.response?.data?.message || 'ไม่สามารถทำรายการได้', 'error');
        }
      }
    },
    async editMember(index) {
      const Member = this.Members[index];
      if (this.normalizeEmail(Member.email) === this.normalizeEmail(this.currentUserEmail)) {
        Swal.fire('คุณไม่สามารถแก้ไขข้อมูลตัวเองได้', '', 'warning');
        return;
      }
      const result = await Swal.fire({
        title: 'แก้ไขสมาชิก',
        html:
          `<input type="email" id="email" class="swal2-input" placeholder="อีเมล" value="${Member.email}">
          <select id="position" class="swal2-input">
            <option value="Staff" ${Member.position === 'Staff' ? 'selected' : ''}>Staff</option>
            <option value="Admin" ${Member.position === 'Admin' ? 'selected' : ''}>Admin</option>
          </select>`,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'บันทึก',
        denyButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
          const email = document.getElementById('email').value.trim();
          const position = document.getElementById('position').value;
          if (email !== Member.email && !isValidEmail(email)) {
            Swal.showValidationMessage('กรุณากรอกอีเมลที่ถูกต้อง');
            return false;
          }
          if (!position) {
            Swal.showValidationMessage('กรุณาเลือกตำแหน่ง');
            return false;
          }
          return { email, position };
        }
      });

      if (result.isConfirmed && result.value) {
        try {
          const oldEmail = Member.email;
          await axios.patch(`${API_BASE}/api/members/${encodeURIComponent(oldEmail)}`, result.value);
          this.Members[index] = { ...this.Members[index], ...result.value };
          Swal.fire('แก้ไขสำเร็จ!', '', 'success');
        } catch (err) {
          Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
        }
      }

      if (result.isDenied) {
        const confirmDelete = await Swal.fire({
          title: 'คุณแน่ใจหรือไม่?',
          text: 'ต้องการลบสมาชิกนี้หรือไม่ (จะกลับไปเป็น user ปกติ)',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'ใช่, ลบเลย',
          cancelButtonText: 'ยกเลิก'
        });

        if (confirmDelete.isConfirmed) {
          try {
            await axios.patch(`${API_BASE}/api/members/${encodeURIComponent(Member.email)}`, {
              email: Member.email,
              position: 'user'
            });
            await this.loadMembers();
            Swal.fire('เปลี่ยนสถานะเป็นผู้ใช้ทั่วไปแล้ว!', '', 'success');
          } catch (err) {
            Swal.fire('ผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
          }
        }
      }
    }
  }
};
</script>


<style scoped>
.add-btn {
  width: 60px;
  height: 60px;
  font-size: 24px;
  background-color: #1e3a8a;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.Member-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  background: rgb(230, 230, 230);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  gap: 5rem;
}
.Member-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.Member-name {
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
  margin-right: 1rem;
}
.Member-position {
  font-size: 1rem;
  margin-right: 1rem;
}
.edit-btn {
  background-color: #ff2424;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.content h2 {
  text-align: center;
  font-size: 1.8rem;
  color: #1e3a8a;
}
.add-btn {
  float: right;
  margin-bottom: 1rem;
}
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 0.5rem;
}
.filter-group {
  display: flex;
  gap: 0.5rem;
}
.filter-btn {
  padding: 0.4rem 1rem;
  border: none;
  background: #e2e8f0;
  color: #1e3a8a;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.filter-btn.active,
.filter-btn:hover {
  background: #1e3a8a;
  color: white;
}
.card-actions {
  margin-left: auto;
  display: flex;
  gap: 1rem;
  align-items: center;
}
.Member-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
}

.member-table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
}
.member-table {
  width: 100%;
  border-collapse: collapse;
  background: #f7f7fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.member-table th, .member-table td {
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}
.member-table th {
  background: #1e3a8a;
  color: #fff;
  font-weight: 600;
}
.member-table tr:last-child td {
  border-bottom: none;
}
@media (max-width: 600px) {
  .content {
    padding: 0.8rem 0.3rem 0.5rem 0.3rem;
    width: 100vw;
  }
  .title-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
    margin-bottom: 0.7rem;
    padding-left: 0.1rem;
  }
  .content h2 {
    text-align: left;
    font-size: 1.1rem;
    margin-bottom: 0.1rem;
    color: #174178;
    font-weight: 700;
  }
  .top-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
  }
  .filter-group {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.3rem;
    justify-content: flex-start;
  }
  .filter-btn {
    padding: 0.25rem 0.7rem;
    font-size: 0.98em;
    border-radius: 8px;
  }
  .add-btn {
    width: 44px;
    height: 44px;
    font-size: 1.7em;
    margin: 0;
    border-radius: 50%;
    align-self: flex-end;
    box-shadow: 0 2px 10px #0001;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .member-table-container {
    width: 100vw !important;
    overflow-x: auto !important;
    padding: 0 0.1rem;
    margin-bottom: 1rem;
  }
  .member-table {
    min-width: 520px;
    width: max-content;
    font-size: 0.98em;
  }
}

.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 1100;
}
.sidebar {
  z-index: 1200;
}

.notification-backdrop{
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: transparent;
  z-index: 1001;
}

</style>


<style>
@import '../css/style.css';
</style>