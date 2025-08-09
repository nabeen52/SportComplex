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
          <div style="position: relative;">
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
          <h2>Equipment</h2>
          <button class="add-btn" @click="addEquipment">＋</button>
        </div>
        <div class="card-list">
          <div class="equipment-card" v-for="(equipment, index) in equipments" :key="equipment._id || index">
            <img class="equipment-img" :src="equipment.image" alt="field" />
            <div class="equipment-info">
              <div class="equipment-row">
                <p class="equipment-name"><strong>{{ equipment.name }}</strong></p>
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                  <p class="equipment-amount">จำนวน: {{ equipment.quantity }}</p>
                  <!-- Toggle Switch -->
                  <label class="switch" @click.prevent="confirmToggle(index)">
                    <input type="checkbox" :checked="equipment.visible" readonly>
                    <span class="slider round"></span>
                  </label>
                  <!-- แสดงสถานะ -->
                  <span style="margin-left: 8px;">
                    <span v-if="equipment.visible" style="color: green;">เปิด</span>
                    <span v-else style="color: gray;">ปิด</span>
                  </span>
                </div>
              </div>
            </div>
            <div style="margin-left: auto; display: flex; gap: 1.5rem; align-items: center;">
              <button class="edit-btn" @click="editEquipment(index)">Edit</button>
            </div>
          </div>

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
import Swal from 'sweetalert2';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp' // ใช้คีย์เดียวทุกหน้าแอดมิน


export default {
  data() {
    return {
      isSidebarClosed: false,
      isMobile: false,
      equipments: [],
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
      lastSeenTimestamp: 0,
    };
  },
  methods: {
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed;
    },
checkMobile() {
    this.isMobile = window.innerWidth <= 600
  },
  toggleSidebar() {
    this.isSidebarClosed = !this.isSidebarClosed
  },
    // ===== ฟังก์ชันกระดิ่ง =====
    toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    this.lastSeenTimestamp = Date.now();
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(this.lastSeenTimestamp));
    this.unreadCount = 0; // เคลียร์ทันที และจะไม่กลับมาเพราะคำนวณจาก timestamp
  }
},

pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
},

    closeNotifications() {
      this.showNotifications = false;
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
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
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

      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      this.pruneOldNotifications();
    }

    // นับเฉพาะที่ใหม่กว่าเวลาอ่านล่าสุด
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch (e) {}
},

    async confirmToggle(index) {
      const result = await Swal.fire({
        title: 'คุณต้องการเปลี่ยนสถานะการแสดงผล?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ใช่',
        cancelButtonText: 'ยกเลิก'
      });
      if (result.isConfirmed) {
        this.equipments[index].visible = !this.equipments[index].visible;
        // อัปเดตไป backend ด้วย ถ้าต้องการ
        try {
          const id = this.equipments[index]._id;
          await axios.patch(`${API_BASE}/api/equipments/${id}`, {
            visible: this.equipments[index].visible
          });
        } catch (e) {
          Swal.fire('ผิดพลาด', 'อัปเดตสถานะล้มเหลว', 'error');
        }
      }
    },
    async addEquipment() {
      const { value: formValues } = await Swal.fire({
        title: 'เพิ่มอุปกรณ์',
        html: `
  <input type="text" id="name" class="swal2-input" placeholder="ชื่ออุปกรณ์">
  <input type="number" id="quantity" class="swal2-input" placeholder="จำนวน" min="0">
  <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
  <label for="image" style=" margin-bottom:1px; margin-top:4px;">เลือกรูปภาพอุปกรณ์</label>
  <input 
    type="file"
    id="image"
    class="swal2-file"
    accept="image/*"
    style="margin-bottom:8px; margin-top:6px; display:block;"
  >
 <small style="color:#555; font-style:italic;">* อัตราส่วนภาพควรเป็น 5:6 </small>
<div style="
  display: inline-flex; 
  align-items: center; 
  margin-top: 5px;
  margin-left: auto;
  margin-right: auto;
">
  <label for="visible" 
    style="white-space: nowrap; margin-right: 4px; font-size: 18px; min-width: 55px; text-align: right;">
    สถานะ :
  </label>
  <select id="visible" 
    class="swal2-select" 
    style="
      width: 72px !important;
      min-width: 0 !important;
      padding-left: 2px !important;
      padding-right: 18px !important;
      box-sizing: border-box;
      font-size: 18px;
      margin-left: 0 !important;
    ">
    <option value="true">เปิด</option>
    <option value="false">ปิด</option>
  </select>
</div>







  </div>
`
,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'เพิ่ม',
        cancelButtonText: 'ยกเลิก',
        preConfirm: async () => {
          const name = document.getElementById('name').value.trim();
          const quantity = document.getElementById('quantity').value;
          const fileInput = document.getElementById('image');
          const visible = document.getElementById('visible').value === 'true';

          if (!name || quantity === '' || parseInt(quantity) < 0) {
            Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบ และจำนวนต้องไม่ติดลบ');
            return false;
          }
          if (!fileInput.files[0]) {
            Swal.showValidationMessage('กรุณาเลือกรูปภาพ');
            return false;
          }
          // แปลงเป็น base64
          const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });
          const imageBase64 = await toBase64(fileInput.files[0]);

          return {
            name,
            quantity: parseInt(quantity),
            image: imageBase64,
            visible
          };
        }
      });

      if (formValues) {
        try {
          const res = await axios.post(`${API_BASE}/api/equipments`, formValues);
          if (res.data.success) {
            this.equipments.push(res.data.data);
            Swal.fire('เพิ่มสำเร็จ!', '', 'success');
          }
        } catch (err) {
          Swal.fire('ผิดพลาด!', err.response?.data?.message || err.message, 'error');
        }
      }
    },
    async editEquipment(index) {
      const equipment = this.equipments[index];
      const result = await Swal.fire({
        title: 'แก้ไขอุปกรณ์',
        html: `
  <input type="text" id="name" class="swal2-input" placeholder="ชื่ออุปกรณ์" value="${equipment.name}">
  <input type="number" id="quantity" class="swal2-input" placeholder="จำนวน" min="0" value="${equipment.quantity}">
  <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
  <label for="image" style=" margin-bottom:1px; margin-top:4px;">เลือกรูปภาพใหม่ (ถ้าต้องการเปลี่ยน)</label>
  <input 
    type="file"
    id="image"
    class="swal2-file"
    accept="image/*"
    style="margin-bottom:8px; margin-top:6px; display:block;"
  >
 <small style="color:#555; font-style:italic;">* อัตราส่วนภาพควรเป็น 5:6 </small>
<div style="
  display: inline-flex; 
  align-items: center; 
  margin-top: 5px;
  margin-left: auto;
  margin-right: auto;
">
  <label for="visible" 
    style="white-space: nowrap; margin-right: 4px; font-size: 18px; min-width: 55px; text-align: right;">
    สถานะ :
  </label>
  <select id="visible" 
    class="swal2-select" 
    style="
      width: 72px !important;
      min-width: 0 !important;
      padding-left: 2px !important;
      padding-right: 18px !important;
      box-sizing: border-box;
      font-size: 18px;
      margin-left: 0 !important;
    ">
    <option value="true" ${equipment.visible ? 'selected' : ''}>เปิด</option>
          <option value="false" ${!equipment.visible ? 'selected' : ''}>ปิด</option>
  </select>
</div> 
</div>
    `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'บันทึก',
        denyButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        preConfirm: async () => {
          const nameVal = document.getElementById('name').value;
          const quantityVal = document.getElementById('quantity').value;
          const fileInput = document.getElementById('image');
          const visibleVal = document.getElementById('visible').value === 'true';

          if (nameVal.trim() === '' || quantityVal === '' || parseInt(quantityVal) < 0) {
            Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบ และจำนวนต้องไม่ติดลบ');
            return false;
          }
          let imageToSave = equipment.image;
          if (fileInput.files[0]) {
            const toBase64 = file => new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result);
              reader.onerror = error => reject(error);
            });
            imageToSave = await toBase64(fileInput.files[0]);
          }

          return {
            name: nameVal,
            quantity: parseInt(quantityVal),
            image: imageToSave,
            visible: visibleVal
          };
        }
      });

      if (result.isConfirmed && result.value) {
        // PATCH ไป backend
        try {
          const id = equipment._id;
          const res = await axios.patch(`${API_BASE}/api/equipments/${id}`, result.value);
          if (res.data.success) {
            this.equipments[index] = res.data.data;
            Swal.fire('แก้ไขสำเร็จ!', '', 'success');
          }
        } catch (err) {
          Swal.fire('ผิดพลาด!', err.response?.data?.message || err.message, 'error');
        }
      }

      if (result.isDenied) {
        // DELETE ไป backend
        try {
          const id = equipment._id;
          await axios.delete(`${API_BASE}/api/equipments/${id}`);
          this.equipments.splice(index, 1);
          Swal.fire('ลบแล้ว!', '', 'success');
        } catch (err) {
          Swal.fire('ผิดพลาด!', err.response?.data?.message || err.message, 'error');
        }
      }
    }
  },
  async mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    try {
      const res = await axios.get(`${API_BASE}/api/equipments`);
      this.equipments = res.data;
    } catch (e) {
      console.error(e);
      this.equipments = [];
    }

     this.lastSeenTimestamp = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0');
    await this.fetchNotifications();
    this.polling = setInterval(this.fetchNotifications, 30000);

    document.addEventListener('mousedown', this.handleClickOutside);
  },
  beforeUnmount() {
  if (this.polling) clearInterval(this.polling);
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
  float: right;
  margin-bottom: 1rem;
}
.card-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.equipment-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  background: rgb(255, 255, 255);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  gap: 5rem;
}
.equipment-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.equipment-img {
  width: 150px;
  height: 180px;
  object-fit: cover;
  /* เดิม cover ให้เปลี่ยนเป็น contain */
  background: #fff;
  /* เพิ่มพื้นหลังขาว */
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  display: block;
}
.equipment-name {
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
  margin-right: 50rem;
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
.switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
input:checked + .slider {
  background-color: #4dff20;
}
input:checked + .slider::before {
  transform: translateX(18px);
}
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.card-actions {
  margin-left: auto;
  display: flex;
  gap: 1rem;
  align-items: center;
}
.equipment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.equipment-name {
  margin-right: 1rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: #4dff20;
}

input:checked+.slider:before {
  transform: translateX(18px);
}

.swal2-select {
  min-width: 0 !important;
  width: 72px !important;
  padding-left: 2px !important;
  padding-right: 18px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  box-sizing: border-box !important;
}

@media (max-width: 600px) {
  .main, .content {
    width: 100vw !important;
    min-width: 0 !important;
    overflow-x: visible !important;
  }
  .title-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-width: 0;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    box-sizing: border-box;
    /* ไม่มี overflow-x */
  }
  .add-btn {
    width: 46px !important;
    height: 46px !important;
    font-size: 1.3rem !important;
    min-width: 0 !important;
    border-radius: 50%;
    margin-bottom: 0;
    margin-left: 8px;
    flex-shrink: 0;
    float: none;
    /* กำหนดไว้ใน flex ไม่ต้อง float */
  }
  .card-list {
    gap: 0.8rem !important;
  }
  .equipment-card {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap !important;
    align-items: flex-start;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: 0.7rem;
    gap: 1.2rem;
    width: 100%;
    min-width: 320px;
    max-width: 100vw;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .equipment-img {
    width: 92px !important;
    height: 112px !important;
    min-width: 92px !important;
    min-height: 112px !important;
    border-radius: 7px !important;
    margin-right: 0.6rem !important;
  }
  .equipment-info, .equipment-row {
    flex-direction: column !important;
    align-items: flex-start !important;
    min-width: 180px;
    gap: 0.5rem;
  }
  .equipment-name {
    font-size: 1rem;
    padding: 0.2rem;
    margin-right: 0 !important;
  }
}
.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  z-index: 1999; /* ต้องน้อยกว่า sidebar */
}
</style>

<style>
@import '../css/style.css';
</style>