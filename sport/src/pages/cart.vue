<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">Sport Complex MFU</p>
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

    <div
      v-if="!isSidebarClosed"
      class="sidebar-overlay"
      @click="toggleSidebar"
    ></div>

    <!-- Main Content -->
    <div class="main">
      <!-- Topbar -->
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
            <span v-if="products.length > 0" class="badge">{{ totalCartItems }}</span>
          </router-link>
          <router-link to="/profile"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <div style="background-color: #dbe9f4;">
        <div class="cartbody">
          <h1 class="cart-title">Cart</h1>

          <div class="cart-grid">
            <div class="cart-card" v-for="product in products" :key="product._id">
              <div class="cart-row">
                <img :src="product.image || '/img/default.png'" alt="img" class="cart-img" />
                <span class="cart-name">{{ product.name }}</span>
                <div class="cart-qty">
                  <button @click="changeQty(product, -1)" :disabled="product.quantity <= 1">-</button>
                  <span>{{ product.quantity }}</span>
                  <button
                    @click="changeQty(product, 1)"
                    :disabled="!canIncrement(product)"
                  >
                    +
                  </button>
                </div>
                <button class="cart-del-btn" @click="removeItem(product)">Delete</button>
              </div>
            </div>
          </div>

          <!-- ปุ่มกลับไปเลือกรายการ + Next -->
          <div class="btn-container">
            <!-- router-link ปุ่มกลับไปเลือกรายการ -->
            <router-link to="/booking_equipment" id="btnBackToSelect">
              Back to select items
            </router-link>

            <!-- ปุ่ม Next เดิม -->
            <button
              id="btnCheckout"
              :disabled="products.length === 0 || isSubmitting"
              @click="handleCheckout"
              :style="{
                opacity: (products.length === 0 || isSubmitting) ? 0.5 : 1,
                cursor: (products.length === 0 || isSubmitting) ? 'not-allowed' : 'pointer'
              }"
            >
              Next
            </button>

          </div>
        </div>
      </div>

      <div v-if="isSubmitting" class="submit-overlay">
        <div class="spinner"></div>
        <p class="submit-text">Sending request... Please wait a moment</p>
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


<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'
const API_BASE = import.meta.env.VITE_API_BASE

const router = useRouter()
const products = ref([])
const stockMap = ref({})
const isSidebarClosed = ref(false)
const announcement = ref("")

// Notification states
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const lastCheckedIds = new Set()
const lastSeenTimestamp = ref(parseInt(localStorage.getItem('lastSeenTimestamp') || '0'))
let polling = null

// ด้านบนของ <script setup> ร่วมกับตัวแปรอื่นๆ
const isSubmitting = ref(false)


// ดึงขั้นตอนอนุมัติสำหรับ "อุปกรณ์ยืมวันเดียว" จาก settings
async function fetchApprovalRolesOneDay() {
  try {
    const res = await axios.get(`${API_BASE}/api/settings/approval_roles`, { timeout: 15000 });
    const val = res?.data?.value || {};
    // รองรับชื่อคีย์หลายแบบเพื่อ backward-compat
    const roles = val.equipment_one_day || val.one_day || val.equipmentOneDay || [];
    // กรองให้เหลือเฉพาะ role ที่อนุญาตและ unique
    const ALLOWED = new Set(['staff', 'admin', 'super']);
    return Array.from(new Set((Array.isArray(roles) ? roles : [])
      .map(r => String(r || '').trim().toLowerCase())
      .filter(r => ALLOWED.has(r))));
  } catch {
    return []; // จะไป fallback เป็น ['staff'] ต่อ
  }
}

async function reconcileCartWithStock({ showToast = true } = {}) {
  if (!Array.isArray(products.value) || !products.value.length) return;

  let changed = false;
  const updates = [];

  for (const p of products.value) {
    const avail = Number(stockMap.value[p.name] || 0);
    const current = Number(p.quantity || 0);

    // ถ้าสต็อกหมด → ลบออกจากตะกร้า
    if (avail <= 0 && current > 0) {
      updates.push(
        axios.delete(`${API_BASE}/api/cart/delete`, { data: { user_id: userId, name: p.name } })
      );
      changed = true;
      p.quantity = 0; // อัปเดตหน้า UI ทันที
      continue;
    }

    // ถ้าเกินสต็อก → หนีบให้เท่ากับสต็อก
    if (current > avail) {
      p.quantity = avail;
      updates.push(
        axios.put(`${API_BASE}/api/cart/update`, {
          user_id: userId,
          name: p.name,
          quantity: avail,
        })
      );
      changed = true;
    }

    // ถ้าติดลบ/ศูนย์ที่ไม่ถูกต้อง → หนีบขั้นต่ำเป็น 1 (ถ้าสต็อกมี)
    if (current < 1 && avail > 0) {
      p.quantity = 1;
      updates.push(
        axios.put(`${API_BASE}/api/cart/update`, {
          user_id: userId,
          name: p.name,
          quantity: 1,
        })
      );
      changed = true;
    }
  }

  if (updates.length) {
    try {
      await Promise.all(updates);
      // กรองรายการที่สต็อกหมดออกจากหน้า UI
      products.value = products.value.filter(p => p.quantity > 0);
      if (changed && showToast) {
        await Swal.fire({
          icon: 'info',
          title: 'ปรับจำนวนตามสต็อก',
          text: 'บางรายการถูกปรับไม่ให้เกินจำนวนที่มีอยู่',
          timer: 1400,
          showConfirmButton: false
        });
      }
    } catch (e) {
      // เงียบๆ ไปก่อนเพื่อไม่กวนผู้ใช้ แต่คุณจะ console.log ได้ถ้าต้องการ
    }
  }
}


function buildStepFromRoles(roles) {
  const nowISO = new Date().toISOString();
  return (Array.isArray(roles) ? roles : []).map(r => ({
    role: r,
    approve: null,
    createdAt: nowISO,
    updatedAt: nowISO,
  }));
}


function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

function pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}

async function fetchNotifications() {
  if (!userId) return
  try {
    // ตัดรายการเกิน 7 วันก่อนเสมอ
    pruneOldNotifications()

    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const newNotis = res.data.filter(item =>
      (['approved', 'disapproved', 'cancel', 'canceled', 'returned'].includes((item.status || '').toLowerCase())) &&
      !lastCheckedIds.has(item._id)
    )

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
      }))

      // รวม + กันซ้ำ + เรียงใหม่สุดอยู่บน
      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp)

      // ตัดแจ้งเตือนเกิน 7 วันหลังรวม
      pruneOldNotifications()

      newNotis.forEach(item => lastCheckedIds.add(item._id))
    }

    // นับ unread เฉพาะที่ใหม่กว่าครั้งล่าสุดที่เปิดกระดิ่ง
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch (err) {
    // ignore
  }
}

function closeNotifications() {
  showNotifications.value = false
}


// โหลดตะกร้าและสต็อก
async function loadCart() {
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch (err) {
    alert('โหลดข้อมูลไม่สำเร็จ: ' + err.message)
  }
}
async function loadStock() {
  try {
    const res = await axios.get(`${API_BASE}/api/equipments`)
    stockMap.value = res.data.reduce((map, eq) => {
      map[eq.name] = eq.quantity
      return map
    }, {})
  } catch {
    stockMap.value = {}
  }
}

function canIncrement(product) {
  const avail = stockMap.value[product.name] || 0
  return product.quantity < avail
}

async function changeQty(product, delta) {
  const newQty = product.quantity + delta
  if (newQty < 1) return
  const avail = stockMap.value[product.name] || 0
  if (newQty > avail) {
    Swal.fire('Exceeding stock quantity', `The quantity in stock is ${avail} `, 'warning')
    return
  }
  product.quantity = newQty
  try {
    await axios.put(`${API_BASE}/api/cart/update`, {
      user_id: userId,
      name: product.name,
      quantity: newQty
    })
  } catch (e) {
    product.quantity -= delta
    Swal.fire('An error occurred', 'Unable to update amount', 'error')
  }
}

async function removeItem(product) {
  const result = await Swal.fire({
    title: 'Confirm deletion?',
    text: 'Do you want to remove this equipment from your cart?',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })
  if (!result.isConfirmed) return
  try {
    await axios.delete(`${API_BASE}/api/cart/delete`, { data: { user_id: userId, name: product.name } })
    products.value = products.value.filter(p => p._id !== product._id)
  } catch {
    Swal.fire('An error occurred', 'Unable to deleted', 'error')
  }
}

// คำนวนรวมจำนวนและส่งไปหน้า form_equipment
async function handleCheckout() {
  if (products.value.length === 0 || isSubmitting.value) return;

  // 1) รวมจำนวนอุปกรณ์ชื่อเดียวกันในตะกร้า
  const itemMap = {};
  products.value.forEach((p) => {
    itemMap[p.name] = (itemMap[p.name] || 0) + p.quantity;
  });

  // 2) จำกัดตามสต็อกปัจจุบัน
  const resultItems = Object.entries(itemMap)
    .map(([name, qty]) => ({
      name,
      quantity: Math.min(qty, stockMap.value[name] || 0),
    }))
    .filter(it => it.quantity > 0);

  if (resultItems.length === 0) {
    await Swal.fire('Out of stock', 'No available quantity to request.', 'warning');
    return;
  }

  // 3) เลือกแบบยืมวันเดียว / หลายวัน
  const { value: borrowType } = await Swal.fire({
    title: 'Do you want to borrow for one day or several days?',
    icon: 'question',
    input: 'radio',
    inputOptions: {
      oneDay: 'One day',
      multiDay: 'Several days',
    },
    inputValidator: (value) => (!value ? 'Please select one' : undefined),
    confirmButtonText: 'OK',
    showCancelButton: true,
    cancelButtonText: 'Cancel'
  });

  if (!borrowType) return;

  // 4) หลายวัน → ไปกรอกฟอร์ม
  if (borrowType === 'multiDay') {
    router.push({
      path: '/form_equipment',
      query: { items: JSON.stringify(resultItems) }
    });
    return;
  }

  // ---- จากนี้คือ "ยืมวันเดียว" ----
  const uid = localStorage.getItem('user_id') || '';
  if (!uid) {
    await Swal.fire({ icon: 'warning', title: 'Please log in before using', confirmButtonText: 'OK' });
    router.replace('/login');
    return;
  }

  const booking_id = `${Date.now()}_${uid}`;
  const nowISO = new Date().toISOString();

  // ดึง roles ของ one-day จาก settings
  let roles = [];
  try {
    roles = await fetchApprovalRolesOneDay(); // เช่น ['staff','admin']
  } catch (_) {
    roles = [];
  }
  if (!roles.length) roles = ['staff']; // fallback
  const stepArr = buildStepFromRoles(roles);

  // Payload พื้นฐาน
  const basePayload = {
    user_id: uid,
    type: 'equipment',
    status: 'pending',
    booking_id,
    date: nowISO,
    step: stepArr,
  };

  // แสดงสถานะกำลังส่ง + กันกดซ้ำ
  isSubmitting.value = true;

  try {
    // ส่ง 1 history ต่อ 1 รายการ
    await Promise.all(
      resultItems.map(item =>
        axios.post(`${API_BASE}/api/history`, {
          ...basePayload,
          name: item.name,
          quantity: item.quantity,
        })
      )
    );

    // เคลียร์ตะกร้า
    await axios.delete(`${API_BASE}/api/cart?user_id=${uid}`);
    products.value = [];

    await Swal.fire('Sent request successfully', '', 'success');
    router.push('/history');
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Unable to send request';
    await Swal.fire('An error occurred', msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
}



const totalCartItems = computed(() => {
  return products.value.length
})

onMounted(async () => {
  if (!userId) {
    await Swal.fire({
      icon: 'warning',
      title: 'You are not logged in',
      confirmButtonText: 'OK'
    });
    router.replace('/login');
    return;
  }

  await loadCart();
  await loadStock();

  // 🔒 หนีบจำนวนในตะกร้าให้ไม่เกินสต็อกทุกครั้งที่เข้าหน้านี้
  await reconcileCartWithStock({ showToast: false });

  try {
    const annRes = await axios.get(`${API_BASE}/api/announcement`)
    announcement.value = annRes.data?.announce || ""
  } catch {
    announcement.value = ""
  }
  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
});


onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
})

</script>

<style scoped>
.cartbody {
  width: 100%;
  min-height: 70vh;
  padding: 20px;
  box-sizing: border-box;
  overflow-x: hidden;
}
.cart-title {
  display: flex;
  justify-content: center;
  padding-left: 0;
}
.cart-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 70px;
}
.cart-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  padding: 1rem 1.5rem;
  width: 100%;
}
.cart-row {
  display: flex;
  align-items: center;
  gap: 2rem;

  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}

.cart-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
}
.cart-name {
  flex: 1 1 200px;
}
.cart-qty {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cart-qty button {
  width: 28px;
  height: 28px;
  font-size: 1.2rem;
  border: 1px solid #ccc;
  background: #f6f6f6;
  border-radius: 50%;
  cursor: pointer;
}
.cart-qty button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.cart-qty span {
  min-width: 32px;
  text-align: center;
  font-weight: bold;
}
.cart-del-btn {
  background: #ff7272;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 5px 14px;
  cursor: pointer;
  font-size: 1rem;
}
.btn-container {
  text-align: right;
  padding: 0 70px;
  margin-top: 1rem;
}
#btnCheckout {
  color: white;
  background-color: rgb(45, 122, 255);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 20px;
  border: none;
  padding: 10px 40px;
  cursor: pointer;
  font-size: 1.2rem;
}
.cart-link {
  position: relative;
  display: inline-block;
  color: inherit;
}
.cart-link .badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: red;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  padding: 2px 6px;
  font-weight: bold;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  pointer-events: none;
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

.notification-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent;
  z-index: 1001; /* ต้องน้อยกว่า .notification-dropdown (1002) */
}

#btnBackToSelect {
  display: inline-block;
  text-align: center;
  color: white;
  background-color: #6c757d;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 20px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 1.1rem;
  text-decoration: none; /* เอาเส้นใต้ลิงก์ออก */
  margin-right: 10px;
}

#btnBackToSelect:hover {
  background-color: #5a6268;
}

/* ปรับ layout ปุ่มในมือถือ */
@media (max-width: 480px) {
  .btn-container {
    display: flex;
    flex-direction: column;  /* วางปุ่ม Back/Next คนละบรรทัด */
    align-items: center;
    gap: 12px;               /* ระยะห่างระหว่างปุ่ม */
    padding: 0 20px;
    text-align: center;
  }

  #btnBackToSelect,
  #btnCheckout {
    width: 100%;             /* ปุ่มเต็มบรรทัดในมือถือ */
    max-width: 320px;        /* จำกัดความกว้างไม่ให้ยาวเกิน */
  }
}

.submit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000; /* สูงกว่ากระดิ่ง/ป๊อปอัพของหน้า */
  backdrop-filter: blur(2px);
  pointer-events: all; /* บล็อกการคลิกทุกอย่างด้านหลัง */
}

.spinner {
  width: 56px;
  height: 56px;
  border: 5px solid #e5eaf3;
  border-top-color: #2d7aff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin-bottom: 12px;
}

.submit-text {
  font-size: 1.05rem;
  color: #1e2c48;
  font-weight: 600;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}




</style>
<style>
@import '../css/style.css';
</style>