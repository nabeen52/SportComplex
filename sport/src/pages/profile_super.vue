<template>
  <div class="layout">
    <!-- Sidebar ทางซ้าย -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/approve_field_super" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <router-link to="/history_super" active-class="active"><i class="pi pi-history"></i> ประวัติการทำรายการ</router-link>
      </nav>
    </aside>

    <div
      v-if="!isSidebarClosed && isMobile"
      class="sidebar-overlay"
      @click="isSidebarClosed = true"
    ></div>

    <!-- Content ทางขวา -->
    <div class="main">
      <!-- Topbar (Header เล็ก) -->
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
          <router-link to="/profile_super"><i class="pi pi-user"></i></router-link>
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
          <button @click="logout" class="logout-btn">ออกจากระบบ</button>
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

// ===== Notifications =====
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null
const lastSeenTimestamp = ref(0)

// ===== รูปโปรไฟล์ =====
const profileImageUrl = computed(() => {
  if (!info.value || !info.value.picture) return '/img/user.png'
  return info.value.picture.startsWith('http') ? info.value.picture : API_BASE + info.value.picture
})
function imgError(e) { e.target.src = '/img/user.png' }

// ===== ลายเซ็น (signature) =====
const rawSignaturePath = computed(() =>
  (info.value?.signaturePath || info.value?.signature || '').trim()
)
const sigBust = ref(0) // cache-busting
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

// ===== SweetAlert: Edit Phone + Signature =====
async function openEditSwal() {
  const currentSig = signatureImageUrl.value
  const html = `
    <div class="swal-edit-wrap">
      <input type="tel" id="swal-phone" class="swal2-input" placeholder="เบอร์โทร" value="${info.value.phone || ''}">
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
      const fileEl = document.getElementById('swal-signature')
      const previewEl = document.getElementById('swal-preview')
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

// ===== Sidebar & Mobile =====
function toggleSidebar() { isSidebarClosed.value = !isSidebarClosed.value }
function checkMobile() {
  isMobile.value = window.innerWidth <= 600
  if (isMobile.value) isSidebarClosed.value = true
}

// ===== Logout =====
async function logout() {
  const result = await Swal.fire({
    title: 'คุณต้องการออกจากระบบหรือไม่',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ใช่, ออกจากระบบ',
    cancelButtonText: 'ยกเลิก'
  })
  if (result.isConfirmed) {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'GET', credentials: 'include' })
    } catch {}
    localStorage.removeItem('jwt')
    localStorage.removeItem('user_id')
    try {
      const { useUserStore } = await import('@/stores/userStore')
      useUserStore().$reset?.()
    } catch {}
    window.location.href =
      'https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://localhost:5173/login'
  }
}

// ===== Notifications =====
function closeNotifications() { showNotifications.value = false }
function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('staff_lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}
function pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}
async function fetchNotifications() {
  try {
    pruneOldNotifications()
    const res = await axios.get(`${API_BASE}/api/equipments/pending`)
    const data = Array.isArray(res.data) ? res.data : []
    const fresh = data.filter(item => !lastCheckedIds.value.has(item._id?.$oid || item._id))
    if (fresh.length) {
      const newMessages = fresh.map(item => {
        const ts =
          item.updatedAt ? new Date(item.updatedAt).getTime() :
          item.createdAt ? new Date(item.createdAt).getTime() :
          item.date      ? new Date(item.date).getTime()      :
          Date.now()
        return {
          id: item._id?.$oid || item._id,
          type: 'pending',
          timestamp: ts,
          message: `มีรายการ '${item.name}' ที่รออนุมัติ`
        }
      })
      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp)
      pruneOldNotifications()
      fresh.forEach(item => lastCheckedIds.value.add(item._id?.$oid || item._id))
    }
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch {}
}

// ===== Lifecycle =====
onMounted(async () => {
  // โหลดโปรไฟล์ให้ครบ (รวม phone + signature)
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

  lastSeenTimestamp.value = parseInt(localStorage.getItem('staff_lastSeenTimestamp') || '0')
  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  window.addEventListener('resize', checkMobile)
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
  min-width: 360px; /* (เหมือนเวอร์ชันก่อน ๆ) */
}

.proinfo {
  position: relative;
  background-color: white;
  border-radius: 20px;
  padding: 30px 60px 30px 40px;
  display: flex;
  align-items: center; /* ให้รูปกับรายละเอียดวางกึ่งกลางแนวตั้ง */
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

/* ===== แจ้งเตือน ===== */
.notification-dropdown {
  position: absolute; right: 0; top: 36px; background: #fff;
  box-shadow: 0 4px 24px rgba(70,70,70,.14); border-radius: 10px;
  width: 320px; max-width: 90vw; z-index: 1500; padding: 10px 0; margin-top: 6px; font-size: 1rem;
}
.notification-dropdown ul { padding: 0 18px; margin: 0; }
.notification-dropdown li { list-style: none; padding: 10px 0; border-bottom: 1px solid #eaeaea; word-break: break-word; }
.notification-dropdown li:last-child { border-bottom: none; }
.notification-btn { background: none; border: none; cursor: pointer; font-size: 1.4rem; position: relative; margin-right: 8px; }
.badge {
  position: absolute; top: 1px; right: 3px; background: #e11d48; color: #fff;
  border-radius: 8px; padding: 1px 8px; font-size: .83rem; font-weight: bold; min-width: 20px; text-align: center; z-index: 10;
}
.notification-backdrop { position: fixed; inset: 0; background: transparent; z-index: 1400; }

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

/* SweetAlert preview */
.swal-edit-wrap{ width:100%; display:flex; flex-direction:column; align-items:center; }
.swal-preview{ margin-top:10px; display:flex; justify-content:center; width:100%; }
.swal-signature-img{
  max-width: 260px; max-height: 100px; object-fit: contain;
  border: 1px dashed #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 4px;
}
.swal-signature-empty{ color:#94a3b8; font-style:italic; }

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
