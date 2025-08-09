<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">Sport Complex MFU</p>
      </div>
      <nav class="nav-links">
        <router-link to="/" exact-active-class="active"><i class="pi pi-home"></i> Home</router-link>
        <router-link to="/booking_field" active-class="active"><i class="pi pi-map-marker"></i> Field</router-link>
        <router-link to="/booking_equipment" active-class="active"><i class="pi pi-box"></i> Equipment</router-link>
        <router-link to="/history" active-class="active"><i class="pi pi-history"></i> History</router-link>
      </nav>
    </aside>

    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <!-- แทนบรรทัดเดิมของกระดิ่ง -->
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
            <span v-if="products.length > 0" class="badge">{{ products.length }}</span>
          </router-link>
          <router-link to="/profile"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <div class="probody-flex">
        <!-- Left -->
        <div class="left-column">
          <img :src="currentImage" alt="Equipment" class="field-image" />
          <p class="equipment-label">{{ equipmentName }}</p>
        </div>

        <!-- Right -->
        <div class="right-column">
          <h2 class="field-title">Booking</h2>
          <div class="zone-selector">
            <p class="zone-label">Quantity</p>
            <select v-model="selectedQuantity" class="dropdown" :disabled="quantityOptions.length === 0">
              <option v-for="qty in quantityOptions" :key="qty" :value="qty">{{ qty }}</option>
            </select>
            <p class="remaining">Remaining Amount: {{ remainingAmount }}</p>
          </div>
          <button
            class="booking-btn"
            @click="addToCart"
            :disabled="!selectedQuantity || remainingAmount === 0"
          >
            <i class="pi pi-shopping-cart" style="margin-right: 8px"></i>
            ADD TO CART
          </button>
        </div>
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
import axios from 'axios'
import Swal from 'sweetalert2'

const API_BASE = import.meta.env.VITE_API_BASE

export default {
  data() {
    return {
      isSidebarClosed: false,
      selectedQuantity: null,
      remainingAmount: 0,
      equipmentName: '', // อุปกรณ์ที่เลือก
      equipmentImage: '', // รูปอุปกรณ์
      defaultImage: '/img/basketball.jpg',
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      userId: localStorage.getItem('user_id') || '',
      lastCheckedIds: new Set(),
      products: [],
      lastSeenTimestamp: 0,
      polling: null,
    };
  },
  computed: {
    currentImage() {
      return this.equipmentImage || this.defaultImage;
    },
    quantityOptions() {
      // ถ้าเหลือ 0 dropdown จะว่าง
      if (this.remainingAmount <= 0) return [];
      return Array.from({ length: this.remainingAmount }, (_, i) => i + 1);
    }
  },
  methods: {

     pruneOldNotifications() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 วันย้อนหลัง
    this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
  },

    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed;
    },
    async addToCart() {
  const userId = localStorage.getItem('user_id'); // ดึงใหม่ทุกครั้ง
  console.log("user_id from localStorage:", userId); // debug
  if (!userId) {
    Swal.fire('คุณยังไม่ได้เข้าสู่ระบบ', '', 'warning');
    return;
  }
  try {
    const resp = await axios.post(`${API_BASE}/api/cart`, {
      user_id: userId,
      name: this.equipmentName,
      quantity: this.selectedQuantity,
      image: this.currentImage
    });
    Swal.fire({
  title: 'เพิ่มลงตะกร้าแล้ว!',
  text: `เพิ่ม ${this.selectedQuantity} รายการสำเร็จ`,
  icon: 'success',
  timer: 1200,
  showConfirmButton: false
}).then(() => {
  this.$router.push('/cart');
});

  } catch (err) {
    console.log(err);
    Swal.fire('เกิดข้อผิดพลาด', err.response?.data?.message || 'ไม่สามารถเพิ่มลงตะกร้าได้', 'error');
  }
},

 async loadCart() {
    if (!this.userId) {
      this.products = []
      return
    }
    try {
      const res = await axios.get(`${API_BASE}/api/cart?user_id=${this.userId}`)
      this.products = res.data || []
    } catch (err) {
      this.products = []
    }
  },

    closeNotifications() {
    this.showNotifications = false
  },

    async fetchRemaining() {
      try {
        const res = await axios.get(`${API_BASE}/api/equipments`);
        const found = res.data.find(
          eq => eq.name === this.equipmentName
        );
        if (found) {
          this.remainingAmount = found.quantity || 0;
        } else {
          this.remainingAmount = 0;
        }
      } catch (e) {
        this.remainingAmount = 0;
      }
    },
    toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    this.lastSeenTimestamp = Date.now();
    localStorage.setItem('lastSeenTimestamp', String(this.lastSeenTimestamp));
    this.unreadCount = 0;
  }
},

  async fetchNotifications() {
  if (!this.userId) return;
  try {
    // ตัดเกิน 7 วันก่อนทุกครั้ง
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

      // ตัดเกิน 7 วันอีกรอบหลังรวม
      this.pruneOldNotifications();

      newNotis.forEach(item => this.lastCheckedIds.add(item._id));
    }

    // นับเฉพาะที่มาใหม่กว่าครั้งล่าสุดที่เปิดกระดิ่ง
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch (err) {
    // ignore
  }
},  
  },
  async mounted() {
  // เซ็ตเวลาอ่านล่าสุดจาก localStorage (ถ้าไม่เคยมีจะเป็น 0)
  this.lastSeenTimestamp = parseInt(localStorage.getItem('lastSeenTimestamp') || '0');

  // รับค่าจาก route เดิม
  this.equipmentName = this.$route.query.name || 'Basketball';
  this.equipmentImage = this.$route.query.image || this.defaultImage;

  // โหลดข้อมูล
  await this.fetchRemaining();
  await this.loadCart();

  // โหลดแจ้งเตือนครั้งแรก + ตั้ง polling เดียว
  await this.fetchNotifications();
  this.polling = setInterval(this.fetchNotifications, 30000);
},

beforeUnmount() {
  if (this.polling) clearInterval(this.polling);
},
  watch: {
    equipmentName() {
      this.fetchRemaining();
    },
    remainingAmount(newVal) {
      if (newVal === 0) this.selectedQuantity = null;
    }
  },

  beforeUnmount() {
  clearInterval(this.polling);
}

  
};
</script>

<style scoped>
.probody-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 20px;
  background-color: #dbe9f4;
  box-sizing: border-box;
}

.left-column {
  flex: 1 1 60%;
  max-width: 60%;
  text-align: center;
}

.right-column {
  flex: 1 1 35%;
  max-width: 35%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 600px;
}

.field-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 10px;
  color: #304674;
}
.field-image {
  width: 450px;
  height: 540px;
  object-fit: cover !important;
  /* จาก cover เป็น contain */
  background: #fff;
  /* พื้นหลังขาว */
  border-radius: 12px;
  margin-bottom: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: inline-block;
}

.equipment-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #304674;
  margin-top: 5px;
}

.zone-selector {
  width: 100%;
  text-align: center;
  margin-bottom: 20px;
}

.zone-label {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.dropdown {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 10px;
}

.remaining {
  font-size: 1rem;
  color: #666;
  margin-bottom: 20px;
}

.booking-btn {
  margin-top: 10px;
  padding: 14px 48px;
  font-size: 1.2rem;
  border: none;
  background: #3e5280;
  color: white;
  border-radius: 999px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.booking-btn:disabled {
  background: #aaa;
  cursor: not-allowed;
  box-shadow: none;
}
.badge {
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  vertical-align: top;
  margin-left: 4px;
}
/* การเเจ้งเตือน   */
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

/* Optional: Effect for unread notification */
/* .notification-dropdown li.unread {
  background: linear-gradient(90deg, #f4eaff 60%, #d9e4ff 100%);
  border-left: 4px solid #8b5cf6;
} */

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
.notification-item {
  transition: background 0.3s, border-color 0.3s, color 0.3s;
}
.notification-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent;
  z-index: 1001; /* ต้องน้อยกว่า .notification-dropdown (1002) */
}




</style>

<style>
@import '../css/style.css';
</style>