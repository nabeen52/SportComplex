<template>
  <div class="layout">
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
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

      <!-- แถบประกาศ -->
      <transition name="slide-down">
        <div class="announcement-bar" v-if="showAnnouncementBar">
          <span class="announcement-bar-text">
            <i class="pi pi-megaphone"></i>
            {{ announcement }}
          </span>
          <button class="close-announcement-btn" @click="showAnnouncementBar = false">
            <i class="pi pi-times" style="color: red;"></i>
          </button>
        </div>
      </transition>

      <section class="hero">
        <div class="carousel-container" v-if="images.length > 0">
          <button class="carousel-btn left" @click="prevImage">❮</button>
          <img :src="images[currentImage]?.img" class="hero-image" alt="สนามกีฬา" />
          <button class="carousel-btn right" @click="nextImage">❯</button>
        </div>
        <div v-else style="text-align:center; padding:2rem; color:gray;">ไม่มีรูปภาพ</div>
      </section>

      <div class="title-group">
        <h2 class="section-title-en">Booking System</h2>
        <h2 class="section-title-th">ระบบจองสนาม/ยืมอุปกรณ์</h2>
      </div>

      <div class="card-grid">
        <router-link to="/booking_field" class="card">
          <img src="/img/icons/field.png" />
          <h4 style="font-size: 30px;">FIELD</h4>
          <p style="font-size: 20px; color: #1e3a8a; font-weight: bold;">จองสนาม</p>
        </router-link>
        <router-link to="/booking_equipment" class="card">
          <img src="/img/icons/equipment.png" />
          <h4 style="font-size: 30px;">EQUIPMENT</h4>
          <p style="font-size: 20px; color: #1e3a8a; font-weight: bold">ยืมอุปกรณ์</p>
        </router-link>
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

const API_BASE = import.meta.env.VITE_API_BASE

export default {
  data() {
    return {
      isSidebarClosed: false,
      currentImage: 0,
      images: [],
      intervalId: null,
      announcement: "",
      showAnnouncementBar: false,
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      userId: '',
      lastCheckedIds: new Set(),
      polling: null,
      products: [],
    }
  },
  computed: {
    totalCartItems() {
      return this.products.length
    }
  },
  watch: {
    userId(val) {
      if (!val) {
        this.$router.push('/login')
      }
    }
  },
  async mounted() {
    // ------- บรรทัดสำคัญ (ต้องมี) ---------
    axios.defaults.withCredentials = true

    this.setUserIdFromLocalStorage()
    if (!this.userId) {
      this.$router.push('/login')
      return
    }
    this.startAutoPlay()

    // โหลดประกาศ
    try {
      const res = await axios.get(`${API_BASE}/api/announcement`)
      const ann = res.data?.announce?.trim() || ""
      this.announcement = ann
      this.showAnnouncementBar = !!ann
    } catch {
      this.announcement = ""
      this.showAnnouncementBar = false
    }

    // โหลดรูป carousel
    try {
      const imgRes = await axios.get(`${API_BASE}/api/img_news`)
      this.images = imgRes.data.length ? imgRes.data : []
      this.currentImage = 0
    } catch {
      this.images = []
    }

    // โหลดตะกร้าสินค้า
    await this.loadCart()

    // โหลดแจ้งเตือน
    await this.fetchNotifications()
    this.polling = setInterval(this.fetchNotifications, 30000)

    // ตั้ง watcher ฟังการเปลี่ยน localStorage (กรณี login/logout)
    window.addEventListener('storage', this.setUserIdFromLocalStorage)
  },
  beforeUnmount() {
    clearInterval(this.intervalId)
    if (this.polling) clearInterval(this.polling)
    window.removeEventListener('storage', this.setUserIdFromLocalStorage)
  },
  methods: {
    setUserIdFromLocalStorage() {
      let userId = localStorage.getItem('user_id')
      if (!userId && localStorage.getItem('user')) {
        try {
          userId = JSON.parse(localStorage.getItem('user')).user_id
        } catch {}
      }
      this.userId = userId || ''
    },
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed
    },
    toggleNotifications() {
      this.showNotifications = !this.showNotifications
      if (this.showNotifications) {
        this.unreadCount = 0
      }
    },
    async fetchNotifications() {
      if (!this.userId) return;
      try {
        const res = await axios.get(`${API_BASE}/api/history?user_id=${this.userId}`);
        const newNotis = res.data.filter(item =>
          (['approved', 'disapproved', 'cancel', 'canceled', 'returned'].includes((item.status || '').toLowerCase())) &&
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

          // Merge, filter duplicates, sort ใหม่สุดอยู่บน
          this.notifications = [...this.notifications, ...newMessages]
            .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
            .sort((a, b) => b.timestamp - a.timestamp);

          newNotis.forEach(item => this.lastCheckedIds.add(item._id));
          this.unreadCount = this.notifications.length;
        }
      } catch (err) {}
    },
    closeNotifications() {
      this.showNotifications = false
    },
    nextImage() {
      if (!this.images.length) return
      this.currentImage = (this.currentImage + 1) % this.images.length
      this.resetAutoPlay()
    },
    prevImage() {
      if (!this.images.length) return
      this.currentImage = (this.currentImage - 1 + this.images.length) % this.images.length
      this.resetAutoPlay()
    },
    startAutoPlay() {
      this.intervalId = setInterval(() => {
        if (this.images.length) {
          this.currentImage = (this.currentImage + 1) % this.images.length
        }
      }, 3000)
    },
    resetAutoPlay() {
      clearInterval(this.intervalId)
      this.startAutoPlay()
    },
    async loadCart() {
      try {
        const res = await axios.get(`${API_BASE}/api/cart?user_id=${this.userId}`)
        this.products = res.data
      } catch (err) {
        this.products = []
      }
    }
  }
}
</script>


<style scoped>
.cart-icon {
  color: #facc15;
}

.bell-icon {
  color: #ff0e32;
}

.profile-icon {
  color: #22c55e;
}

.hero {
  text-align: center;
  margin: 1rem 0;
}

.hero-image {
  width: 100%;
  max-width: 900px;
  aspect-ratio: 18/10;  /* 900/500 */
  height: auto;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: block;
  opacity: 0;
  border-radius: 18px;
  margin: auto;
  transition: opacity 0.8s ease-in-out;
}
.hero-image[src] {
  opacity: 1;
}
.carousel-container {
  width: 100%;
  max-width: 900px;
  margin: auto;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
@media (max-width: 1024px) {
  .hero-image {
    max-width: 98vw;
    aspect-ratio: 18/10;
  }
}

.title-group {
  text-align: center;
  margin: 1rem 0;
  margin-top: 2rem;
}

.section-title-en {
  font-size: 1.5rem;
  color: #1e40af;
  font-weight: bold;
  margin-bottom: 0.2rem;
}

.section-title-th {
  font-size: 1rem;
  color: #1e3a8a;
  font-weight: normal;
}

.card-grid {
  display: flex;
  justify-content: center;
  gap: 5rem;
  flex-wrap: wrap;
  margin-bottom: 20rem;
}

.card {
  width: 300px;
  height: 300px;
  background-color: white;
  border-radius: 2rem;
  text-align: center;
  padding: 1.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  text-decoration: none;
  color: black;
  margin-top: 1rem;
}

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.25);
}

.card img {
  width: 180px;
  margin-bottom: 0.5rem;
}

.carousel-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 60rem;
  margin: auto;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.412);
  width: 50px;
  height: 50px;
  font-size: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 2;
  background: transparent;
  transition: background 0.2s;
}

.carousel-btn:hover {
  color: rgba(0, 0, 0, 0.662);
  background: rgba(255, 255, 255, 0.742);
}

.carousel-btn.left {
  left: 35px;
  font-size: 2rem;
}

.carousel-btn.right {
  right: 35px;
  font-size: 2rem;
}

/* Animation ของแถบ */
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
  position: fixed;
  left: 0;
  top: 0;
  z-index: 3000;
  width: px;
  max-width: var(--announcement-width);
  margin-left: auto;
  margin-right: auto;
  left: 0;
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
    /* แปลง \n เป็น break line ตามที่พิมพ์ไว้ */
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
@media (max-width: 540px) {
  .notification-dropdown {
    min-width: 220px;
    max-width: 99vw;
  }
  .notification-dropdown li {
    font-size: 0.99rem;
    padding: 0.7em 0.7em;
  }
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
