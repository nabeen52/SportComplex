<template>
  <div class="layout">
    <!-- Sidebar ทางซ้าย -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">Sport Complex MFU</p>
      </div>
      <nav class="nav-links">
        <router-link to="/home_user" exact-active-class="active"><i class="pi pi-home"></i> Home</router-link>
        <router-link to="/booking_field" active-class="active"><i class="pi pi-map-marker"></i> Field</router-link>
        <router-link to="/booking_equipment" active-class="active"><i class="pi pi-box"></i> Equipment</router-link>
        <router-link to="/history" active-class="active"><i class="pi pi-history"></i> History</router-link>
      </nav>
    </aside>

    <div
      v-if="!isSidebarClosed"
      class="sidebar-overlay"
      @click="toggleSidebar"
    ></div>

    <!-- Content -->
    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>

        <div class="topbar-actions">
          <!-- Notification bell -->
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

          <!-- Cart -->
          <router-link to="/cart" class="cart-link">
            <i class="pi pi-shopping-cart"></i>
            <span v-if="products.length > 0" class="badge">{{ products.length }}</span>
          </router-link>

          <!-- Profile link -->
          <router-link to="/profile"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- Body -->
      <div class="probody">
        <!-- Profile -->
        <div>
          <h1 style="padding-left: 50px;">Profile</h1>

          <div class="profile-container">
            <div class="proinfo">
  <!-- Avatar -->
  <img :src="profileImageUrl" alt="profile" class="profile-img" @error="imgError" />

  <div class="profile-details" v-if="info">
    <p>Username : {{ info.name }}</p>
    <p>Email : {{ info.email }}</p>
    <p>Phone : {{ info.phone || '-' }}</p>

    <div class="signature-wrap">
      <div class="signature-label">Signature :</div>
      <template v-if="info.signaturePath">
        <img :src="signatureImageUrl" alt="signature" class="signature-img" @error="signatureError" />
      </template>
      <span v-else class="signature-empty">ยังไม่มีลายเซ็น</span>
    </div>
  </div>

  <!-- ปุ่มแก้ไข: มุมขวาล่างของการ์ด -->
  <button class="card-edit-btn" @click="openEditSwal" title="Edit profile">
    <i class="pi pi-pencil"></i>
  </button>
</div>

          </div> <!-- /.profile-container -->
        </div>

        <div class="logout-container">
          <button @click="logout" class="logout-btn">Logout</button>
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

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE

// ===== Global =====
const products = ref([])
const isSidebarClosed = ref(false)
const router = useRouter()
const userId = localStorage.getItem('user_id') || ''

// ===== User info =====
const info = ref({
  id: '-',
  name: '-',
  email: '-',
  picture: null,
  phone: '',
  // รองรับได้ทั้ง signaturePath และ signature
  signaturePath: '',
  signature: ''
})

// option: แก้ user_id ได้เฉพาะโดเมน mfu
const editId = ref(false)
const editUserId = ref('')
const canEditUserId = computed(() => info.value?.email?.toLowerCase().endsWith('@mfu.ac.th'))

// ===== Notifications (ของเดิม) =====
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = new Set()
const lastSeenTimestamp = ref(parseInt(localStorage.getItem('lastSeenTimestamp') || '0'))
let polling = null

// ===== Images =====
const profileImageUrl = computed(() => {
  if (!info.value || !info.value.picture) return '/img/user.png'
  return info.value.picture.startsWith('http') ? info.value.picture : API_BASE + info.value.picture
})

// path ดิบของลายเซ็น (รองรับหลายชื่อ field)
const rawSignaturePath = computed(() =>
  (info.value?.signaturePath || info.value?.signature || '').trim()
)

const sigBust = ref(0) // cache-busting
const signatureImageUrl = computed(() => {
  const p = rawSignaturePath.value
  if (!p) return ''
  // รองรับ http(s), data, blob
  if (/^(https?:|data:|blob:)/i.test(p)) {
    return sigBust.value ? `${p}${p.includes('?') ? '&' : '?'}v=${sigBust.value}` : p
  }
  const base = (API_BASE || '').replace(/\/+$/, '')
  const path = p.startsWith('/') ? p : `/${p}`
  return `${base}${path}${sigBust.value ? `?v=${sigBust.value}` : ''}`
})

function imgError(e) { e.target.src = '/img/user.png' }
function signatureError(e) { e.target.style.display = 'none' }

// ===== SweetAlert edit (Phone + Signature) =====
async function openEditSwal() {
  const currentSig = signatureImageUrl.value
  const html = `
    <div class="swal-edit-wrap">
      <input
        type="tel"
        id="swal-phone"
        class="swal2-input"
        placeholder="เบอร์โทร (4–10 หลัก)"
        value="${info.value.phone || ''}"
        inputmode="numeric"
        minlength="4"
        maxlength="10"
        pattern="\\d{4,10}"
      >
      <input type="file" id="swal-signature" class="swal2-file" accept="image/*" style="margin-top:6px;">
      <div id="swal-preview" class="swal-preview">
        ${currentSig
          ? `<img src="${currentSig}" class="swal-signature-img">`
          : `<span class="swal-signature-empty">ยังไม่มีลายเซ็น</span>`}
      </div>
    </div>
  `
  const { isConfirmed, value } = await Swal.fire({
    title: 'เเก้ไขโปรไฟล์',
    html,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Save',
    cancelButtonText: 'Cancel',
    width: 560,
    customClass: { popup: 'swal-center-popup' },
    didOpen: () => {
      const phoneEl = document.getElementById('swal-phone')
      const fileEl = document.getElementById('swal-signature')
      const previewEl = document.getElementById('swal-preview')

      // บังคับให้เป็นเลขล้วน และตัดให้ไม่เกิน 10 หลักขณะพิมพ์
      phoneEl?.addEventListener('input', () => {
        let v = (phoneEl.value || '').replace(/\D+/g, '') // keep digits only
        if (v.length > 10) v = v.slice(0, 10)             // hard cap 10
        phoneEl.value = v
      })

      fileEl?.addEventListener('change', () => {
        const f = fileEl.files?.[0]
        if (!f) {
          previewEl.innerHTML = `<span class="swal-signature-empty">ยังไม่มีลายเซ็น</span>`
          return
        }
        const url = URL.createObjectURL(f)
        previewEl.innerHTML = `<img src="${url}" class="swal-signature-img">`
      })
    },
    preConfirm: () => {
      const phone = (document.getElementById('swal-phone')?.value || '').trim()
      const file = document.getElementById('swal-signature')?.files?.[0] || null

      const hasPhoneChange = phone !== (info.value.phone || '')
      const hasSignature = !!file

      if (!hasPhoneChange && !hasSignature) {
        Swal.showValidationMessage('ใส่เบอร์ใหม่หรืออัปโหลดลายเซ็นอย่างน้อย 1 อย่าง')
        return false
      }

      // ตรวจความยาวเบอร์: 4–10 หลัก (เฉพาะกรณีมีการเปลี่ยนแปลงเบอร์)
      if (hasPhoneChange) {
        const digitsOnly = phone.replace(/\D+/g, '')
        if (digitsOnly.length > 0 && (digitsOnly.length < 4 || digitsOnly.length > 10)) {
          Swal.showValidationMessage('กรุณากรอกเบอร์ 4–10 หลัก')
          return false
        }
      }

      return { phone, file }
    }
  })
  if (!isConfirmed) return
  const { phone, file } = value

  try {
    const fd = new FormData()
    if (phone !== (info.value.phone || '')) fd.append('phone', phone)
    if (file) fd.append('signature', file) // ฝั่งหลังบ้านอ่านจาก field 'signature'

    const res = await axios.patch(`${API_BASE}/api/users/profile`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    })

    if (res.data?.success && res.data?.user) {
      info.value.phone = res.data.user.phone || ''
      info.value.signaturePath = res.data.user.signaturePath || res.data.user.signature || ''
      info.value.signature = info.value.signaturePath
      sigBust.value = Date.now()
      Swal.fire('บันทึกสำเร็จ', '', 'success')
    } else {
      throw new Error(res.data?.message || 'อัปเดตไม่สำเร็จ')
    }
  } catch (e) {
    Swal.fire('เกิดข้อผิดพลาด', e.response?.data?.message || e.message, 'error')
  }
}



// ===== user_id update (option เดิม) =====
async function saveUserId() {
  if (!editUserId.value.trim()) {
    Swal.fire('กรุณากรอก user id', '', 'warning')
    return
  }
  try {
    const res = await axios.patch(`${API_BASE}/api/users/update_id`, {
      old_user_id: info.value.id,
      new_user_id: editUserId.value.trim()
    }, { withCredentials: true })

    if (res.data?.success) {
      info.value.id = editUserId.value.trim()
      Swal.fire('บันทึกสำเร็จ', '', 'success')
      editId.value = false
    } else {
      Swal.fire('เกิดข้อผิดพลาด', res.data?.message || '', 'error')
    }
  } catch (e) {
    Swal.fire('เกิดข้อผิดพลาด', e.response?.data?.message || e.message, 'error')
  }
}

// ===== Layout =====
function toggleSidebar() { isSidebarClosed.value = !isSidebarClosed.value }

// ===== Cart =====
async function loadCart() {
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch { products.value = [] }
}

// ===== Logout =====
async function logout() {
  const result = await Swal.fire({
    title: 'Log out',
    text: 'Do you want to log out?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes',
    cancelButtonText: 'No'
  })
  if (result.isConfirmed) {
    try { await fetch(`${API_BASE}/auth/logout`, { method: 'GET', credentials: 'include' }) } catch {}
    localStorage.removeItem('jwt'); localStorage.removeItem('user_id')
    try {
      const { useUserStore } = await import('@/stores/userStore')
      useUserStore().$reset?.()
    } catch {}
    window.location.href =
      'https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://localhost:5173/login'
  }
}

// ===== Notifications (ของเดิม) =====
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
function closeNotifications() { showNotifications.value = false }

async function fetchNotifications() {
  if (!userId) return
  try {
    pruneOldNotifications()
    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const newNotis = res.data.filter(item =>
      (['approved', 'disapproved', 'cancel', 'canceled', 'returned']
        .includes((item.status || '').toLowerCase())) &&
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
          (item.status || '').toLowerCase() === 'approved' ? ' ได้รับการอนุมัติ' :
          (item.status || '').toLowerCase() === 'disapproved' ? ' ไม่ได้รับการอนุมัติ' :
          (item.status || '').toLowerCase() === 'cancel' || (item.status || '').toLowerCase() === 'canceled' ? ' ถูกยกเลิก' :
          (item.status || '').toLowerCase() === 'returned' ? ' คืนของสำเร็จแล้ว' : ''
        }`
      }))
      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp)
      pruneOldNotifications()
      newNotis.forEach(item => lastCheckedIds.add(item._id))
    }
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch {}
}

// ===== Lifecycle =====
onMounted(async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/me`, { withCredentials: true })
    if (res.data && res.data.user) {
      info.value = {
        id: res.data.user.user_id,
        name: res.data.user.name,
        email: res.data.user.email,
        picture: res.data.user.picture,
        phone: res.data.user.phone || '',
        signaturePath: res.data.user.signaturePath || res.data.user.signature || '',
        signature: res.data.user.signature || ''
      }
    } else {
      router.push('/login'); return
    }
  } catch {
    router.push('/login'); return
  }

  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  fetchNotifications()
  setInterval(fetchNotifications, 30000)
  loadCart()
})

onUnmounted(() => clearInterval(polling))
</script>




<style scoped>
.probody {
  background-color: #dbe9f4;
  width: 100%;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  overflow-x: hidden;
}
.proinfo {
  position: relative;
  background-color: white;
  border-radius: 20px;
  padding: 30px 60px 30px 40px;
  display: flex;
  align-items: center; /* <-- เปลี่ยนจาก flex-start เป็น center */
  gap: 2rem;
  width: 100%;
  min-height: 160px;
  overflow-x: auto;
  max-width: 100%;
}

.profile-img {
  height: 120px;
  width: 120px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 1px 12px #e3e3e3;
  margin-right: 24px;
  align-self: center; /* เพิ่มบรรทัดนี้ */
}
.profile-details {
  color: #333;
  font-size: 1.07rem;
  padding-left: 12px;
}
.profile-container { padding: 1rem 70px; }
.profile-grid { display: flex; flex-direction: column; gap: 1rem; padding: 1rem 70px; }
.profile-card { background-color: white; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); padding: 1rem 1.5rem; width: 100%; }
.profile-row { display: flex; justify-content: space-between; align-items: center; font-size: 1rem; color: #333; }
.left, .center, .right { flex: 1; }
.center { text-align: center; }

.logout-container { display: flex; justify-content: flex-end; margin: 0px 70px 20px 0px; }
.logout-btn { background: #ef4444; color: #fff; border: none; border-radius: 8px; padding: 8px 18px; font-weight: 600; margin-top: 16px; cursor: pointer; transition: background 0.2s; }
.logout-btn:hover { background: #dc2626; }

/* ===== แจ้งเตือน (ของเดิม) ===== */
.notification-dropdown {
  position: absolute; right: 0; top: 38px; background: #fff; border-radius: 18px 0 18px 18px;
  box-shadow: 0 8px 24px 0 rgba(27,50,98,0.14), 0 2px 4px 0 rgba(33,125,215,0.06);
  min-width: 330px; max-width: 370px; max-height: 420px; overflow-y: auto; z-index: 1002; padding: 0; border: none; animation: fadeDown 0.22s;
}
@keyframes fadeDown { 0%{opacity:0; transform:translateY(-24px);} 100%{opacity:1; transform:translateY(0);} }
.notification-dropdown ul { padding: 0; margin: 0; list-style: none; }
.notification-dropdown li {
  background: linear-gradient(90deg, #f6fafd 88%, #e2e7f3 100%);
  margin: 0.2em 0.8em; padding: 0.85em 1.1em; border-radius: 12px; border: none; font-size: 1.07rem; font-weight: 500; color: #1e2c48;
  box-shadow: 0 2px 8px 0 rgba(85,131,255,0.06); display: flex; align-items: flex-start; gap: 10px; position: relative; cursor: default; transition: background 0.2s;
}
.notification-dropdown li:not(:last-child){ margin-bottom: 0.15em; }
.notification-dropdown li::before{ content:"🔔"; font-size:1.2em; margin-right:7px; color:#1976d2; opacity:.80; }
.notification-dropdown li.no-noti{ background:#f2f3f6; color:#a7aab7; justify-content:center; font-style:italic; }
.notification-dropdown::-webkit-scrollbar{ width:7px; }
.notification-dropdown::-webkit-scrollbar-thumb{ background:#e1e7f5; border-radius:10px; }
.notification-dropdown::-webkit-scrollbar-track{ background:transparent; }
.notification-item.approved{ background:linear-gradient(90deg,#e9fbe7 85%,#cbffdb 100%); border-left:4px solid #38b000; color:#228c22; }
.notification-item.disapproved{ background:linear-gradient(90deg,#ffeaea 85%,#ffd6d6 100%); border-left:4px solid #ff6060; color:#b91423; }
.notification-item.canceled, .notification-item.cancel{ background:linear-gradient(90deg,#f9d7d7 80%,#e26a6a 100%); border-left:4px solid #bb2124; color:#91061a; }
.notification-item.returned{ background:linear-gradient(90deg,#e0f0ff 85%,#b6e0ff 100%); border-left:4px solid #1976d2; color:#1976d2; }
.notification-item{ transition: background .3s, border-color .3s, color .3s; }
.notification-backdrop{ position:fixed; inset:0; background:transparent; z-index:1001; }

/* ===== ปุ่ม ===== */
.edit-btn, .save-btn, .cancel-btn {
  margin-left: 8px; background: #f59e42; color:#fff; border:none; border-radius:6px; padding:6px 18px;
  cursor:pointer; transition: background 0.2s; min-width:80px; min-height:20px; box-sizing:border-box; display:inline-block;
}
.save-btn { background:#22c55e; } .save-btn:hover{ background:#15803d; }
.cancel-btn { background:#ef4444; } .cancel-btn:hover{ background:#dc2626; }
.edit-btn:hover { background:#ea580c; }

.editable-row{ display:flex; align-items:center; gap:12px; flex-wrap:nowrap; margin-top:10px; }
.field-label{ width:90px; color:#334155; font-weight:600; }
.input{ padding:8px 12px; border:1px solid #e5e7eb; border-radius:8px; outline:none; min-width:260px; }

.edit-actions{ margin-top:12px; }

/* Signature UI */
.signature-wrap{ margin-top:10px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.signature-label{ font-weight:600; color:#334155; }
.signature-img{
  width: 220px; height: 80px; object-fit: contain;
  border: 1px dashed #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 6px;
}
.signature-empty{ color:#94a3b8; font-style: italic; }
.signature-preview{ margin-top:8px; }

/* สำหรับจอมือถือ */
@media (max-width: 768px) {
  .profile-container { padding: 1rem 15px; }
  .proinfo { width: 100%; max-width: 100%; padding: 20px; }
  .logout-container { margin: 10px 15px 20px 0; display:flex; justify-content:flex-end; }
}

.fab-edit{
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  border: none;
  background: #f59e42;
  color: #fff;
  font-size: 20px;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 20px rgba(0,0,0,.18), 0 6px 12px rgba(0,0,0,.12);
  cursor: pointer;
  z-index: 1010;
}
.fab-edit:hover{ background:#ea580c; }
/* ปุ่ม Edit ในการ์ด (ขวาล่าง) */
.card-edit-btn{
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  border: none;
  background: #f59e42;
  color: #fff;
  font-size: 18px;
  display: grid;
  place-items: center;
 
  cursor: pointer;
}
.card-edit-btn:hover{ background:#ea580c; }

/* จัดกลางใน SweetAlert */
.swal-center{ display:flex !important; flex-direction:column; align-items:center; }
.swal-edit-wrap{ width:100%; display:flex; flex-direction:column; align-items:center; }
.swal-preview{ margin-top:10px; display:flex; justify-content:center; width:100%; }
.swal-signature-img{
  max-width: 260px; max-height: 100px; object-fit: contain;
  border: 1px dashed #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 4px;
}
.swal-signature-empty{ color:#94a3b8; font-style:italic; }
</style>

<style>
@import '../css/style.css';

/* จัด SweetAlert ให้อยู่กึ่งกลางและให้พรีวิวอยู่กลางจริง ๆ */
.swal-center-popup .swal2-html-container{
  display:flex;
  flex-direction:column;
  align-items:center;
}
.swal-edit-wrap{ width:100%; display:flex; flex-direction:column; align-items:center; }
.swal-preview{ margin-top:10px; display:flex; justify-content:center; width:100%; }
.swal-signature-img{
  max-width:260px; max-height:100px; object-fit:contain;
  border:1px dashed #cbd5e1; background:#f8fafc; border-radius:6px; padding:4px;
}
.swal-signature-empty{ color:#94a3b8; font-style:italic; }

</style>
