<template>
  <div class="layout">
    <!-- Sidebar ทางซ้าย -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/approve_equipment" exact-active-class="active">
          <i class="pi pi-home"></i> อนุมัติ/รับคืนอุปกรณ์
        </router-link>
        <router-link to="/equipment" active-class="active">
          <i class="pi pi-map-marker"></i> อุปกรณ์
        </router-link>
        <router-link to="/history_staff" active-class="active">
          <i class="pi pi-history"></i> ประวัติการทำรายการ
        </router-link>
      </nav>
    </aside>

    <div
      v-if="!isSidebarClosed && isMobile"
      class="sidebar-overlay"
      @click="isSidebarClosed = true"
    ></div>

    <!-- Content ทางขวา -->
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

          <router-link to="/profile_staff"><i class="pi pi-user"></i></router-link>
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
  signature: '',
   thaiName: ''  
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
      <h3 class="swal-profile-title">แก้ไขโปรไฟล์</h3>

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

      <!-- ✅ ใช้ native file input เพียงตัวเดียว ให้หน้าตาเหมือนรูปที่สอง -->
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
    width: 560,                          // ← ให้พอดีกับรูปที่สอง
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
      headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true
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
        signature: res.data.user.signature || '',
        thaiName: res.data.user.thaiName || res.data.user.thai_name || '' 
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

/* ===== SWAL PROFILE (ให้เหมือนภาพ) ===== */
.swal-profile-popup.swal2-popup{
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,.18);
  overflow: hidden;
}

.swal-profile{
  padding: 26px 28px 18px;
}

.swal-profile-title{
  margin: 0 0 18px;
  font-size: 32px;             /* ขนาดใกล้ภาพ */
  font-weight: 700;
  text-align: center;
  color: #1f2937;
}

.swal-row{
  display: grid;
  grid-template-columns: 180px 1fr;  /* ซ้ายเป็น select, ขวาเป็นชื่อไทย */
  gap: 12px;
  margin-bottom: 12px;
}

.swal-field{
  width: 100%;
  height: 44px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 16px;
  background: #fff;
}

.swal-select{
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 7l5 5 5-5' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
}

/* ช่องเบอร์โทร */
#swal-phone{
  margin-bottom: 12px;
}

/* แถวเลือกไฟล์ “เลือกไฟล์ | ไม่ได้เลือกไฟล์ใด” */





/* พรีวิวลายเซ็น */
.swal-preview{
  display: flex;
  justify-content: center;
  margin-top: 8px;
}
.swal-signature-img{
  width: 220px;
  height: 88px;
  object-fit: contain;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  border-radius: 8px;
  padding: 6px;
}
.swal-signature-empty{
  color:#94a3b8; font-style:italic;
}

/* ปุ่ม */
.swal-btn-save{
  background:#6366f1 !important;       /* สีม่วงในภาพตัวอย่าง */
  border-radius: 8px !important;
  padding: 10px 22px !important;
  font-weight: 700 !important;
}
.swal-btn-save:hover{ filter: brightness(0.95); }

.swal-btn-cancel{
  background:#6b7280 !important;        /* เทา */
  border-radius: 8px !important;
  padding: 10px 22px !important;
  font-weight: 700 !important;
  margin-left: 10px !important;
  color:#fff !important;
}
/* ==== ทำให้ input[type=file] แบบ native แสดงเหมือนรูปที่สอง ==== */
.swal-file-native{
  width: 100%;
  margin: 8px 0 6px;
  /* ให้ดู clean ขึ้นเล็กน้อย แต่ยังคงลุค native (ปุ่ม "เลือกไฟล์" + ข้อความ) */
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 6px;     /* อาจไม่ส่งผลกับบางเบราว์เซอร์ แต่ไม่เป็นไร */
  background: #fff;
  font-size: 15px;
}

/* ปรับโทนอินพุตให้ละมุนแบบรูป */
.swal-field{
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #111827;
}
.swal-field::placeholder{ color:#9ca3af; }

/* หัวข้อใหญ่แบบรูปที่สอง */
.swal-profile-title{
  font-size: 40px;
  font-weight: 800;
  text-align: center;
  margin: 10px 0 18px;
}

/* ปุ่ม Save/Cancel สีตรงตัวอย่าง */
.swal-btn-save{
  background:#6366f1 !important;
  border-radius:8px !important;
  padding:10px 22px !important;
  font-weight:700 !important;
}
.swal-btn-cancel{
  background:#6b7280 !important;
  color:#fff !important;
  border-radius:8px !important;
  padding:10px 22px !important;
  font-weight:700 !important;
  margin-left:10px !important;
}

</style>
