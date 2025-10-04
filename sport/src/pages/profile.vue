<template>
  <div class="layout">
    <!-- Sidebar ซ้าย -->
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

    <!-- overlay แค่ตอนมือถือ -->
    <div
      v-if="!isSidebarClosed && isMobile"
      class="sidebar-overlay"
      @click="isSidebarClosed = true"
    ></div>

    <!-- Content -->
    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>

        <div class="topbar-actions">
          <!-- กระดิ่งแจ้งเตือน -->
          <div style="position: relative;">
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

          <!-- Cart -->
          <router-link to="/cart" class="cart-link">
            <i class="pi pi-shopping-cart"></i>
            <span v-if="products.length > 0" class="badge">{{ products.length }}</span>
          </router-link>

          <!-- Profile -->
          <router-link to="/profile"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- Body -->
      <div class="probody">
        <div>
          <h1 style="padding-left: 50px;">Profile</h1>

          <div class="profile-scroll-container">
            <div class="profile-container">
              <div class="proinfo">
                <!-- Avatar -->
                <img :src="profileImageUrl" alt="profile" class="profile-img" @error="imgError" />

                <div class="profile-details" v-if="info">
                  <p>Username : {{ info.name }}</p>
                  <p>Thai name : {{ info.thaiName && info.thaiName.trim() ? info.thaiName : '—' }}</p>
                  <p>Email : {{ info.email }}</p>
                  <p>Phone : {{ info.phone || '-' }}</p>

                  <div class="signature-wrap">
                    <div class="signature-label">Signature :</div>
                    <template v-if="signatureImageUrl">
                      <img :src="signatureImageUrl" alt="signature" class="signature-img" @error="signatureError" />
                    </template>
                    <span v-else class="signature-empty">ยังไม่มีลายเซ็น</span>
                  </div>
                </div>

                <!-- ปุ่มแก้ไข: มุมขวาล่างของการ์ด -->
                <button class="card-edit-btn" @click="openEditSwal" title="เเก้ไขโปรไฟล์">
                  <i class="pi pi-pencil"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="logout-container">
          <button @click="logout" class="logout-btn">Logout</button>
        </div>
      </div>

      <!-- Footer -->
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

axios.defaults.withCredentials = true

const API_BASE = import.meta.env.VITE_API_BASE
const isMobile = ref(window.innerWidth <= 600)
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
  signaturePath: '',
  signature: '',
  thaiName: ''   // ✅ เพิ่มให้เหมือน staff
})

// ===== Notifications (user) =====
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = new Set()
const lastSeenTimestamp = ref(parseInt(localStorage.getItem('lastSeenTimestamp') || '0'))
let polling = null

// ===== Cart =====
const products = ref([])

// ===== Profile image =====
const profileImageUrl = computed(() => {
  if (!info.value || !info.value.picture) return '/img/user.png'
  return info.value.picture.startsWith('http') ? info.value.picture : API_BASE + info.value.picture
})
function imgError(e) { e.target.src = '/img/user.png' }

// ===== Signature image =====
const rawSignaturePath = computed(() =>
  (info.value?.signaturePath || info.value?.signature || '').trim()
)
const sigBust = ref(0)
const signatureImageUrl = computed(() => {
  const p = rawSignaturePath.value
  if (!p) return ''
  if (/^(https?:|data:|blob:)/i.test(p)) {
    return sigBust.value ? `${p}${p.includes('?') ? '&' : '?'}v=${sigBust.value}` : p
  }
  const base = (API_BASE || '').replace(/\/+$/, '')
  const path = p.startsWith('/') ? p : `/${p}`
  return `${base}${path}${sigBust.value ? `?v=${sigBust.value}` : ''}`
})
function signatureError(e) { e.target.style.display = 'none' }

// ===== Edit (Thai name + Phone + Signature) =====
async function openEditSwal() {
  const HONORIFICS = ['นาย','นาง','นางสาว']
  const rawThai = (info.value.thaiName || '').trim()
  const m = rawThai.match(/^(\S+)\s+(.*)$/)
  let prefillPrefix = '', prefillBare = rawThai
  if (m && HONORIFICS.includes(m[1])) {
    prefillPrefix = m[1]
    prefillBare = (m[2] || '').trim()
  }
  const currentSig = signatureImageUrl.value

  const html = `
    <div class="swal-profile">
      <h3 class="swal-profile-title">Edit Profile</h3>
      <div class="swal-row">
        <select id="swal-prefix" class="swal-field swal-select">
          <option value="">— โปรดระบุ —</option>
          ${HONORIFICS.map(o => `<option value="${o}" ${o===prefillPrefix?'selected':''}>${o}</option>`).join('')}
        </select>
        <input id="swal-thaiName-bare" type="text" class="swal-field"
               placeholder="ชื่อ-นามสกุล (ภาษาไทย)"
               value="${(prefillBare || '').replace(/"/g,'&quot;')}" />
      </div>
      <input id="swal-phone" type="tel" class="swal-field"
             placeholder="เบอร์โทรศัพท์ที่สามารถติดต่อได้(4-10 หลัก)"
             value="${info.value.phone || ''}" inputmode="numeric"
             minlength="4" maxlength="10" pattern="\\d{4,10}" />
      <input id="swal-signature" type="file" class="swal-file-native" accept="image/*" />
      <div id="swal-preview" class="swal-preview">
        ${currentSig
          ? `<img src="${currentSig}" class="swal-signature-img">`
          : `<span class="swal-signature-empty">ยังไม่มีลายเซ็น</span>`}
      </div>
    </div>
  `

  const { isConfirmed, value } = await Swal.fire({
    html,
    showCancelButton: true,
    confirmButtonText: 'Save',
    cancelButtonText: 'Cancel',
    width: 560,
    padding: 0,
    customClass: {
      popup: 'swal-profile-popup',
      confirmButton: 'swal-btn-save',
      cancelButton: 'swal-btn-cancel'
    },
    focusConfirm: false,
    didOpen: () => {
      const phoneEl = document.getElementById('swal-phone')
      const fileEl  = document.getElementById('swal-signature')
      const preview = document.getElementById('swal-preview')

      phoneEl?.addEventListener('input', () => {
        let v = (phoneEl.value || '').replace(/\D+/g, '')
        if (v.length > 10) v = v.slice(0, 10)
        phoneEl.value = v
      })
      fileEl?.addEventListener('change', () => {
        const f = fileEl.files?.[0]
        if (!f) { preview.innerHTML = `<span class="swal-signature-empty">ยังไม่มีลายเซ็น</span>`; return }
        const url = URL.createObjectURL(f)
        preview.innerHTML = `<img src="${url}" class="swal-signature-img">`
      })
    },
    preConfirm: () => {
      const prefixEl = document.getElementById('swal-prefix')
      const nameEl   = document.getElementById('swal-thaiName-bare')
      const phoneEl  = document.getElementById('swal-phone')
      const fileEl   = document.getElementById('swal-signature')

      const prefix = (prefixEl.value || '').trim()
      let bare    = (nameEl.value || '').trim()
      const first = bare.split(/\s+/)[0]
      if (['นาย','นาง','นางสาว'].includes(first)) bare = bare.replace(/^\S+\s*/, '').trim()

      const hasPrefix = !!prefix, hasBare = !!bare
      if (hasBare && !hasPrefix) { Swal.showValidationMessage('กรุณาเลือกคำนำหน้า'); return false }
      if (hasPrefix && !hasBare) { Swal.showValidationMessage('กรุณากรอกชื่อ-นามสกุล (ภาษาไทย)'); return false }

      const mergedThaiName = [prefix, bare].filter(Boolean).join(' ').trim()
      const phone = (phoneEl.value || '').trim()
      const file  = fileEl.files?.[0] || null

      const changedThai  = mergedThaiName !== (info.value.thaiName || '')
      const changedPhone = phone !== (info.value.phone || '')
      const changedSig   = !!file
      if (!changedThai && !changedPhone && !changedSig) {
        Swal.showValidationMessage('กรุณาแก้ไขอย่างน้อย 1 รายการ'); return false
      }
      if (changedPhone) {
        const d = phone.replace(/\D+/g,'')
        if (d.length > 0 && (d.length < 4 || d.length > 10)) {
          Swal.showValidationMessage('กรุณากรอกเบอร์ 4–10 หลัก'); return false
        }
      }
      return { mergedThaiName, phone, file, changedThai, changedPhone }
    }
  })

  if (!isConfirmed) return
  try {
    const { mergedThaiName, phone, file, changedThai, changedPhone } = value
    const fd = new FormData()
    if (changedThai)  fd.append('thaiName', mergedThaiName)
    if (changedPhone) fd.append('phone', phone)
    if (file)         fd.append('signature', file)

    const res = await axios.patch(`${API_BASE}/api/users/profile`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    })
    if (!res.data?.success || !res.data?.user) throw new Error(res.data?.message || 'อัปเดตไม่สำเร็จ')

    info.value.phone         = res.data.user.phone || ''
    info.value.signaturePath = res.data.user.signaturePath || res.data.user.signature || ''
    info.value.signature     = info.value.signaturePath
    info.value.thaiName      = res.data.user.thaiName || res.data.user.thai_name || ''
    sigBust.value = Date.now()

    Swal.fire({ icon:'success', title:'บันทึกสำเร็จ', showConfirmButton:false, timer:1200 })
  } catch (e) {
    Swal.fire('เกิดข้อผิดพลาด', e.response?.data?.message || e.message, 'error')
  }
}

// ===== Sidebar & Mobile =====
function toggleSidebar() { isSidebarClosed.value = !isSidebarClosed.value }
function checkMobile() {
  isMobile.value = window.innerWidth <= 600
  if (isMobile.value) isSidebarClosed.value = true
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

// ===== Notifications =====
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

// ===== Cart =====
async function loadCart() {
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch { products.value = [] }
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
        signature: res.data.user.signature || '',
        thaiName: res.data.user.thaiName || res.data.user.thai_name || ''
      }
    } else {
      router.push('/login'); return
    }
  } catch {
    router.push('/login'); return
  }

  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  window.addEventListener('resize', checkMobile)

  loadCart()
})

onUnmounted(() => {
  clearInterval(polling)
  window.removeEventListener('resize', checkMobile)
})
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

.profile-scroll-container {
  overflow-x: auto;
  padding: 0 70px;
  box-sizing: border-box;
}

.profile-container {
  padding: 1rem 0;
  min-width: 360px;
}

.proinfo {
  position: relative;
  background-color: white;
  border-radius: 20px;
  padding: 30px 60px 30px 40px;
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
  min-height: 160px;
  overflow-x: auto;
  max-width: 100%;
  box-sizing: border-box;
}

.profile-img {
  height: 120px;
  width: 120px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 1px 12px #e3e3e3;
  margin-right: 24px;
  align-self: center;
}

.profile-details {
  color: #333;
  font-size: 1.07rem;
  padding-left: 12px;
}

.logout-container {
  display: flex;
  justify-content: flex-end;
  margin: 0px 70px 20px 0px;
}
.logout-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-weight: 600;
  margin-top: 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.logout-btn:hover { background: #dc2626; }

/* ===== แจ้งเตือน (เหมือนของเดิม) ===== */
.notification-dropdown {
  position: absolute;
  right: 0;
  top: 38px;
  background: #fff;
  border-radius: 18px 0 18px 18px;
  box-shadow: 0 8px 24px 0 rgba(27,50,98,0.14), 0 2px 4px 0 rgba(33,125,215,0.06);
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
  0% { opacity: 0; transform: translateY(-24px); }
  100% { opacity: 1; transform: translateY(0); }
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
  box-shadow: 0 2px 8px 0 rgba(85,131,255,0.06);
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
  color: #f59e0b;     /* เหลืองอ่อนแบบรูปเดิม */
  opacity: .95;
}

.notification-dropdown li.no-noti {
  background: #f2f3f6;
  color: #a7aab7;
  justify-content: center;
  font-style: italic;
}

.notification-dropdown::-webkit-scrollbar { width: 7px; }
.notification-dropdown::-webkit-scrollbar-thumb { background: #e1e7f5; border-radius: 10px; }
.notification-dropdown::-webkit-scrollbar-track { background: transparent; }

/* โทนตามสถานะ + แถบสีซ้าย (แบบเดิม) */
.notification-item.approved{
  background: linear-gradient(90deg,#e9fbe7 85%,#cbffdb 100%);
  color:#228c22;
  border-left:4px solid #38b000;
}
.notification-item.disapproved{
  background: linear-gradient(90deg,#ffeaea 85%,#ffd6d6 100%);
  color:#b91423;
  border-left:4px solid #ff6060;
}
.notification-item.canceled,
.notification-item.cancel{
  background: linear-gradient(90deg,#f9d7d7 80%,#e26a6a 100%);
  color:#91061a;
  border-left:4px solid #bb2124;
}
.notification-item.returned{
  background: linear-gradient(90deg,#e0f0ff 85%,#b6e0ff 100%);
  color:#1976d2;
  border-left:4px solid #1976d2;
}

/* ปุ่ม/แบดจ์ด้านบนให้วางเหมือนเดิม */
.notification-btn {
  background: none; border: none; cursor: pointer;
  font-size: 1.4rem; position: relative;
}
.badge{
  position: absolute; top: -8px; right: -10px;
  min-width: 18px; height: 18px; padding: 0 6px;
  border-radius: 999px; display: flex; align-items: center; justify-content: center;
  font-size: 11px; line-height: 1; background: #ff1a1a; color:#fff;
  border: 2px solid #243b6a; /* ให้กลืนกับสีพื้น topbar */
}
.notification-backdrop{ position:fixed; inset:0; background:transparent; z-index:1001; }


/* สีพื้นหลังตามสถานะ (เหมือนฝั่ง staff) */
.notification-item.approved{ background:linear-gradient(90deg,#e9fbe7 85%,#cbffdb 100%); border-left:4px solid #38b000; color:#228c22; }
.notification-item.disapproved{ background:linear-gradient(90deg,#ffeaea 85%,#ffd6d6 100%); border-left:4px solid #ff6060; color:#b91423; }
.notification-item.canceled, .notification-item.cancel{ background:linear-gradient(90deg,#f9d7d7 80%,#e26a6a 100%); border-left:4px solid #bb2124; color:#91061a; }
.notification-item.returned{ background:linear-gradient(90deg,#e0f0ff 85%,#b6e0ff 100%); border-left:4px solid #1976d2; color:#1976d2; }

/* Signature UI */
.signature-wrap{ margin-top:10px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.signature-label{ font-weight:600; color:#334155; }
.signature-img{
  width: 220px; height: 80px; object-fit: contain;
  border: 1px dashed #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 6px;
}
.signature-empty{ color:#94a3b8; font-style: italic; }

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

/* มือถือ */
@media (max-width: 768px) {
  .profile-scroll-container { padding: 0 15px; }
  .profile-container { padding: 1rem 15px; }
  .proinfo { width: 100%; max-width: 100%; padding: 20px; }
  .logout-container { margin: 10px 15px 20px 0; display:flex; justify-content:flex-end; }
}
</style>

<style>
@import '../css/style.css';

/* ===== SweetAlert สไตล์เดียวกับ staff ===== */
.swal-profile-popup.swal2-popup{
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,.18);
  overflow: hidden;
}
.swal-profile{ padding: 26px 28px 18px; }
.swal-profile-title{
  font-size: 40px; font-weight: 800; text-align: center; margin: 10px 0 18px; color:#1f2937;
}
.swal-row{
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.swal-field{
  width: 100%;
  height: 44px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 16px;
  background: #f8fafc;
  color:#111827;
}
.swal-field::placeholder{ color:#9ca3af; }
.swal-select{
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 7l5 5 5-5' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; background-size: 16px;
}
/* โทรศัพท์ */
#swal-phone{ margin-bottom: 12px; }

/* พรีวิวลายเซ็น */
.swal-preview{ display:flex; justify-content:center; margin-top:8px; }
.swal-signature-img{
  width: 220px; height: 88px; object-fit: contain;
  border: 1px dashed #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 6px;
}
.swal-signature-empty{ color:#94a3b8; font-style:italic; }

/* ปุ่ม */
.swal-btn-save{
  background:#6366f1 !important; border-radius:8px !important; padding:10px 22px !important; font-weight:700 !important;
}
.swal-btn-cancel{
  background:#6b7280 !important; color:#fff !important; border-radius:8px !important; padding:10px 22px !important; font-weight:700 !important; margin-left:10px !important;
}

/* input[type=file] แบบ native ให้สะอาด */
.swal-file-native{
  width: 100%;
  margin: 8px 0 6px;
  border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px; background: #fff; font-size: 15px;
}
</style>
