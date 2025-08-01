<template>
  <div class="layout" :class="{ 'sidebar-closed': isSidebarClosed }">
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
  v-if="!isSidebarClosed && isMobile" 
  class="sidebar-overlay" 
  @click="toggleSidebar"
></div>
    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
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

          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <div class="announcement-container">
        <div class="announcement">
          <div class="announcement-label-wrapper">
            <span class="announcement-label">Announcement!!!</span>
          </div>
          <div class="announcement-row">
            <textarea class="announcement-input" v-model="announcementInput" placeholder="...................."
              rows="2"></textarea>
            <div class="announcement-buttons-vertical">
              <button class="btn-add" @click="addAnnouncement">Add</button>
              <button class="btn-delete" @click="confirmDelete">Delete</button>
            </div>
          </div>
          <div v-if="latestAnnouncement" style="display: flex; align-items: flex-start; margin-top: 8px;">
            <b style="color: #166534; min-width: 120px; text-align: left; flex-shrink: 0;">ประกาศล่าสุด:</b>
            <div class="latest-announcement">{{ latestAnnouncement }}</div>
          </div>


        </div>
      </div>

      <div class="hero-row">
        <div>
          <p>*อัตราส่วนภาพควรเป็น 9:5 </p>
        </div>
        <div class="hero-wrapper">
          <img v-if="images.length && images[currentImageIndex]?.img" :src="images[currentImageIndex]?.img"
            class="hero-image" />
          <div v-else class="hero-image"
            style="display:flex;align-items:center;justify-content:center;background:#eee;">
            <span style="color:#999;">ไม่มีรูป</span>
          </div>
        </div>
        <button class="btn-edit-side" @click="handleEdit">Edit</button>
      </div>

      <div class="pagination">
        <button v-for="(img, index) in images" :key="img._id" @click="currentImageIndex = index"
          :class="{ active: currentImageIndex === index }">
          {{ index + 1 }}
        </button>
        <button @click="addImage" style="background-color: green; color: white;">+</button>
      </div>

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

export default {
  data() {
    return {
      isSidebarClosed: false,
      currentImageIndex: 0,
      images: [],
      announcementInput: "",
      latestAnnouncement: "",
      // === กระดิ่งแจ้งเตือน ===
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
     isMobile: window.innerWidth <= 600,
    };
  },
  async mounted() {
    document.addEventListener('mousedown', this.handleClickOutside)
    await this.reloadImages();
    await this.reloadAnnouncement();
    await this.fetchNotifications();
    this.polling = setInterval(this.fetchNotifications, 30000);
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() { // ถ้า Vue2 ให้ใช้ beforeDestroy
    clearInterval(this.polling);
    document.removeEventListener('mousedown', this.handleClickOutside);
     window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed;
    },
 handleResize() {
    this.isMobile = window.innerWidth <= 600
    // เมื่อจาก mobile → desktop ปิด sidebar ไปด้วย (กัน sidebar ค้าง)
    if (!this.isMobile) this.isSidebarClosed = false
  },
    // ---------------------------
    // ===== Notification ========
    // ---------------------------
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
      if (this.showNotifications) this.unreadCount = 0;
    },
    closeNotifications() {
      this.showNotifications = false
    },
    handleClickOutside(event) {
      const notifDropdown = document.querySelector('.notification-dropdown')
      const notifBtn = document.querySelector('.notification-btn')
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
        // ดึงรายการ pending ทั้งสนามและอุปกรณ์
        const res = await axios.get(`${API_BASE}/api/history/approve_field`);
        const data = Array.isArray(res.data) ? res.data : [];

        const pendings = data.filter(item =>
          item.status === 'pending' &&
          (item.type === 'field' || item.type === 'equipment') &&
          !this.lastCheckedIds.has(item._id?.$oid || item._id)
        );

        if (pendings.length) {
          const newMessages = pendings.map(item => {
            if (item.type === 'field') {
              return {
                id: item._id?.$oid || item._id,
                message: `สนาม '${item.name}' กำลังรอการอนุมัติ`
              };
            } else if (item.type === 'equipment') {
              return {
                id: item._id?.$oid || item._id,
                message: `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
              };
            }
          });

          this.notifications = [...this.notifications, ...newMessages];
          pendings.forEach(item => this.lastCheckedIds.add(item._id?.$oid || item._id));
          this.unreadCount = this.notifications.length;
        }
      } catch (err) {
        // ไม่ต้องแจ้ง error
      }
    },

    // ---------------------------
    // ====== Image News ========
    // ---------------------------
    async reloadImages() {
      try {
        const res = await axios.get(`${API_BASE}/api/img_news`);
        this.images = res.data;
        this.currentImageIndex = 0;
      } catch (err) {
        this.images = [];
      }
    },
    async addImage() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async e => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async ev => {
            try {
              const res = await axios.post(`${API_BASE}/api/img_news`, { img: ev.target.result });
              this.images.push(res.data.data);
              this.currentImageIndex = this.images.length - 1;
              Swal.fire('เพิ่มรูปภาพแล้ว!', '', 'success');
            } catch {
              Swal.fire('Error', 'เพิ่มภาพล้มเหลว', 'error');
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    },
    async handleEdit() {
      const imgObj = this.images[this.currentImageIndex];
      const imgId = imgObj._id;
      const result = await Swal.fire({
        title: 'คุณต้องการทำอะไรกับรูปภาพนี้?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'เลือกรูปจากไฟล์',
        denyButtonText: `ลบรูปนี้`,
        cancelButtonText: 'ยกเลิก'
      });
      if (result.isConfirmed) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async e => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = async ev => {
              const confirmRes = await Swal.fire({
                title: 'ยืนยันการแก้ไข',
                text: 'คุณต้องการเปลี่ยนรูปภาพนี้ใช่หรือไม่?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก'
              });
              if (confirmRes.isConfirmed) {
                try {
                  await axios.put(`${API_BASE}/api/img_news/${imgId}`, { img: ev.target.result });
                  this.images[this.currentImageIndex].img = ev.target.result;
                  Swal.fire('เปลี่ยนรูปภาพเรียบร้อยแล้ว!', '', 'success');
                } catch {
                  Swal.fire('Error', 'บันทึกภาพล้มเหลว', 'error');
                }
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else if (result.isDenied) {
        const delRes = await Swal.fire({
          title: 'คุณแน่ใจหรือไม่?',
          text: 'คุณต้องการลบรูปภาพนี้ใช่หรือไม่?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'ลบ',
          cancelButtonText: 'ยกเลิก'
        });
        if (delRes.isConfirmed) {
          try {
            await axios.delete(`${API_BASE}/api/img_news/${imgId}`);
            this.images.splice(this.currentImageIndex, 1);
            this.currentImageIndex = Math.max(0, this.currentImageIndex - 1);
            Swal.fire('ลบรูปภาพแล้ว', '', 'success');
          } catch {
            Swal.fire('Error', 'ลบภาพล้มเหลว', 'error');
          }
        }
      }
    },

    // ---------------------------
    // ==== Announcement ========
    // ---------------------------
    async reloadAnnouncement() {
      try {
        const res = await axios.get(`${API_BASE}/api/announcement`);
        this.latestAnnouncement = res.data?.announce || "";
      } catch (err) {
        this.latestAnnouncement = "";
      }
    },
    async addAnnouncement() {
      if (!this.announcementInput.trim()) {
        Swal.fire('กรุณาใส่ข้อความประกาศ', '', 'warning');
        return;
      }
      try {
        await axios.put(`${API_BASE}/api/announcement`, {
          announce: this.announcementInput
        });
        this.latestAnnouncement = this.announcementInput;
        this.announcementInput = "";
        Swal.fire('อัปเดตประกาศแล้ว!', '', 'success');
      } catch {
        Swal.fire('Error', 'บันทึกประกาศล้มเหลว', 'error');
      }
    },
    async confirmDelete() {
      const result = await Swal.fire({
        title: "ลบประกาศ?",
        text: "คุณต้องการลบประกาศนี้ใช่หรือไม่?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ลบ",
        cancelButtonText: "ยกเลิก"
      });
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_BASE}/api/announcement`);
          this.latestAnnouncement = "";
          Swal.fire('ลบประกาศเรียบร้อย!', '', 'success');
        } catch {
          Swal.fire('Error', 'ลบประกาศล้มเหลว', 'error');
        }
      }
    },
  }
};
</script>


<style scoped>
.announcement-container {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.announcement {
  width: 100%;
  max-width: 900px;
}
.announcement-label-wrapper {
  text-align: left;
  margin-bottom: 0.5rem;
}
.announcement-label {
  background: rgb(255, 231, 231);
  border: 2px solid red;
  color: rgb(255, 0, 0);
  font-weight: bold;
  border-radius: 20px;
  padding: 0.3rem 1rem;
  display: inline-block;
}
.announcement-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.announcement-input {
  /* ให้ padding รวมอยู่ใน width เลย ไม่ทำให้เนื้อหาล้น */
  box-sizing: border-box;

  /* ลด padding ซ้าย–ขวา ให้ข้อความเริ่มชิดขอบตามที่วงไว้ */
  padding: 0.5rem 0.8rem;
  /* 0.5rem บน–ล่าง, 0.8rem ซ้าย–ขวา */

  /* ความกว้างเต็ม container แต่ไม่เกิน 900px ตามก่อนหน้า */
  width: 100%;
  max-width: 700px;

  /* ส่วนอื่นๆ คงเดิม */
  border-radius: 5px;
  font-size: 1rem;
  line-height: 1.6;
  background: white;
  border: 1px solid #000;
  /* ถ้าชอบมีขอบดำ */
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
  resize: vertical;
  min-height: 2.5em;
  white-space: pre-wrap;
  word-break: break-word;
}
.announcement-buttons-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.btn-add,
.btn-delete {
  color: white;
  border: none;
  border-radius: 1rem;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
}
.btn-add {
  background-color: green;
}
.btn-delete {
  background-color: red;
}

.latest-announcement {
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  /* แปลง \n เป็น break line */
  word-break: break-word;
  overflow-wrap: anywhere;
  color: #166534;
  font-weight: bold;
}
.hero-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 2.5rem; /* เว้นช่องว่างให้ edit ข้างรูป */
}
.hero-image {
  width: 900px;
  height: 500px;
  object-fit: fill;
  border: 4px dashed #1e40af;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-radius: 18px;    /* <-- เพิ่มความโค้ง */
}
.btn-edit-side {
  background-color: #ff0000;
  color: white;
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 2.2rem;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.16);
  align-self: center;  /* ให้อยู่แนวเดียวกับรูป */
}
.hero-wrapper {
  position: relative;
}
.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}
.pagination button {
  margin: 0 4px;
  background-color: white;
  border: 1px solid gray;
  border-radius: 5px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}
.pagination button.active {
  background-color: #1e40af;
  color: white;
  font-weight: bold;
}
.image-upload-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 8px;
}
@media (max-width: 600px) {
  .main {
    min-width: 0;
    max-width: 100vw;
  }
  .sidebar-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.22);
    z-index: 2999;
  }
  .sidebar {
    z-index: 3000;
  }
  .hero-image {
    width: 95vw !important;
    max-width: 95vw;
    height: auto !important;
    aspect-ratio: 9 / 5;
    object-fit: contain !important;
    display: block;
    margin: 0 auto;
  }
  .hero-row {
    flex-direction: column;
    gap: 1rem;
  }

}

</style>

<style>
@import '../css/style.css';
</style>