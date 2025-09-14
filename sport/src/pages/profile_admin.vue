<template>
  <div class="layout">
    <!-- Sidebar ทางซ้าย -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
         <router-link to="/dashboard" exact-active-class="active"><i class="pi pi-chart-pie"></i> แดชบอร์ด</router-link>
        <router-link to="/home_admin" exact-active-class="active"><i class="pi pi-megaphone"></i> แก้ไขข่าว</router-link>
        <router-link to="/edit_field" active-class="active"><i class="pi pi-map-marker"></i> แก้ไขสนาม</router-link>
        <router-link to="/edit_equipment" active-class="active"><i class="pi pi-clipboard"></i> แก้ไขอุปกรณ์ </router-link>
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> จองสนาม</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <!-- <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> รับคืนอุปกรณ์ </router-link> -->
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล </router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
      </nav>
    </aside>
<div
  v-if="isMobile && !isSidebarClosed"
  class="sidebar-overlay"
  @click="toggleSidebar"
></div>
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
        <li v-for="(noti, idx) in notifications" :key="idx">
          {{ noti.message }}
        </li>
        <li v-if="notifications.length === 0">ไม่มีแจ้งเตือน</li>
      </ul>
    </div>
  </div>
  <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
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
</div>

        </div>
        <!-- History -->
        <div>
          <h1 style="padding-left: 50px;">History</h1>
          <div class="profile-grid">
            <div class="profile-card" v-for="hist in paginatedHistory" :key="hist.id">
              <div class="profile-row">
                <span class="left">{{ hist.name }}</span>
                <span class="center" v-if="hist.type === 'field'">
                  เวลา : {{ hist.time }}
                </span>
                <span class="center" v-else-if="hist.type === 'equipment'">
                  จำนวน : {{ hist.quantity }}
                </span>
<span class="left status-group">
  <!-- สถานะ -->
  <span class="status-label">
    <template v-if="hist.status === 'Approved'">
       รายการถูกอนุมัติ
    </template>
    <template v-else-if="hist.status === 'Disapproved'">
       รายการไม่ถูกอนุมัติ
    </template>
    <template v-else-if="hist.status === 'Cancel'">
       รายการถูกยกเลิก
    </template>
    <template v-else-if="hist.status === 'Returned'">
       คืนของสำเร็จแล้ว
    </template>
    <template v-else-if="hist.status === 'Pending'">
       กำลังรออนุมัติ
    </template>
    <template v-else>
      {{ hist.status }}
    </template>
  </span>

  <!-- ปุ่ม -->
  <span class="action-buttons">
    <template v-if="hist.status === 'Pending'">
      <button class="cancel-btn" @click="cancelItem(hist.id)">Cancel</button>
    </template>
    <button class="remark-btn" @click="openDetail(hist)">Detail</button>
  </span>
</span>


              </div>
            </div>
          </div>
          <div class="pagination-control">
            <button @click="prevPage" :disabled="currentPage === 1">ย้อนกลับ</button>
            <span>หน้า {{ currentPage }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages">ถัดไป</button>
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
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Swal from 'sweetalert2'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const API_BASE = import.meta.env.VITE_API_BASE
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL

const router = useRouter()
const userStore = useUserStore()

/* =========================
   Reactive states
========================= */
const isMobile = ref(window.innerWidth <= 600)
const info = ref({
  id: "-",
  name: "-",
  email: "-",
  picture: null,
  phone: "",
  // รองรับทั้ง signaturePath และ signature
  signaturePath: "",
  signature: ""
})

const history = ref([])
const userMap = ref({})

const editId = ref(false)
const editUserId = ref('')

const canEditUserId = computed(() => {
  return info.value?.email?.toLowerCase().endsWith('@mfu.ac.th')
})

const profileImageUrl = computed(() => {
  if (!info.value || !info.value.picture) return '/img/user.png'
  if (info.value.picture.startsWith('http')) return info.value.picture
  return API_BASE + info.value.picture
})


function imgError(event) { event.target.src = '/img/user.png' }
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
const itemsPerPage = 5
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(history.value.length / itemsPerPage) || 1)
const paginatedHistory = computed(() => {
  const sorted = [...history.value].sort((a, b) => (b.sortAt || 0) - (a.sortAt || 0))
  const start = (currentPage.value - 1) * itemsPerPage
  return sorted.slice(start, start + itemsPerPage)
})

/* =========================
   Notifications (bell)
========================= */
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())
let polling = null

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) unreadCount.value = 0
}

function closeNotifications() {
  showNotifications.value = false
}

function handleClickOutside(event) {
  const notifDropdown = document.querySelector('.notification-dropdown')
  const notifBtn = document.querySelector('.notification-btn')
  if (
    notifDropdown &&
    !notifDropdown.contains(event.target) &&
    notifBtn &&
    !notifBtn.contains(event.target)
  ) {
    closeNotifications()
  }
}

/* =========================
   Edit User ID
========================= */
function startEdit() {
  editUserId.value = info.value.id
  editId.value = true
}

function cancelEdit() {
  editId.value = false
}

async function saveUserId() {
  if (!editUserId.value.trim()) {
    Swal.fire('กรุณากรอก user id', '', 'warning')
    return
  }
  try {
    const res = await axios.patch(`${API_BASE}/api/users/update_id`, {
      old_user_id: info.value.id,
      new_user_id: editUserId.value.trim(),
    }, { withCredentials: true })

    if (res.data && res.data.success) {
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

/* =========================
   Cancel item
========================= */
async function cancelItem(id) {
  const confirmed = await Swal.fire({
    title: 'ยืนยันการยกเลิก?',
    text: 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'ใช่, ยกเลิก!',
    cancelButtonText: 'ไม่'
  });
  if (confirmed.isConfirmed) {
    try {
      await axios.delete(`${API_BASE}/api/history/${id}`);
      history.value = history.value.filter(h => h.id !== id);
      Swal.fire('ยกเลิกแล้ว!', 'รายการของคุณถูกยกเลิกเรียบร้อยแล้ว', 'success');
    } catch (err) {
      Swal.fire('ผิดพลาด', 'ลบข้อมูลไม่สำเร็จ', 'error');
    }
  }
}

/* =========================
   Helpers: dates & sorting
========================= */
function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return !isNaN(d) ? d.toLocaleDateString('th-TH') : '-'
}
function parseToDate(d) {
  if (!d) return null;
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y,m,dd] = s.split('-').map(Number);
    return new Date(y, m-1, dd);
  }
  const dt = new Date(s);
  return isNaN(dt) ? null : dt;
}
function isSameDay(a, b) {
  const A = parseToDate(a), B = parseToDate(b);
  if (!A || !B) return true;
  return A.getFullYear() === B.getFullYear()
      && A.getMonth() === B.getMonth()
      && A.getDate() === B.getDate();
}
function isMultiDayEquipment(item) {
  if ((item?.type || '').toLowerCase() !== 'equipment') return false;
  return !!item.since && !!item.uptodate && !isSameDay(item.since, item.uptodate);
}

// toMs & sortTimeOf ใช้จัดเรียง “ล่าสุด”
const toMs = (v) => {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};
const sortTimeOf = (h) =>
  Math.max(
    toMs(h.updatedAt),
    toMs(h.approvedAt),
    toMs(h.disapprovedAt),
    toMs(h.canceledAt),
    toMs(h.returnedAt),
    toMs(h.createdAt),
    toMs(h.date),
    toMs(h.since),
    toMs(h.uptodate)
  );

/* =========================
   Fetch notifications (pending)
========================= */
async function fetchNotifications() {
  try {
    const res = await axios.get(`${API_BASE}/api/history/approve_field`)
    const data = Array.isArray(res.data) ? res.data : []
    const pendings = data.filter(item =>
      item.status === 'pending' &&
      (item.type === 'field' || item.type === 'equipment') &&
      !lastCheckedIds.value.has(item._id?.$oid || item._id)
    )
    if (pendings.length) {
      const newMessages = pendings.map(item => {
        if (item.type === 'field') {
          return {
            id: item._id?.$oid || item._id,
            message: `สนาม '${item.name}' กำลังรอการอนุมัติ`
          }
        } else if (item.type === 'equipment') {
          return {
            id: item._id?.$oid || item._id,
            message: `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
          }
        }
      })
      notifications.value = [...notifications.value, ...newMessages]
      pendings.forEach(item => lastCheckedIds.value.add(item._id?.$oid || item._id))
      unreadCount.value = notifications.value.length
    }
  } catch (err) {}
}
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
    title: 'Edit Profile',
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
    if (file) fd.append('signature', file) // ฝั่งหลังบ้านอ่าน field 'signature'

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


/* =========================
   Mount / Unmount
========================= */
onMounted(async () => {
  window.addEventListener('resize', handleResize)
  handleResize()
  document.addEventListener('mousedown', handleClickOutside)

  try {
    // 1) me
    const resMe = await axios.get(`${API_BASE}/api/me`, { withCredentials: true })
    if (resMe.data && resMe.data.user) {
      info.value = {
  id: resMe.data.user.user_id,
  name: resMe.data.user.name,
  email: resMe.data.user.email,
  picture: resMe.data.user.picture,
  phone: resMe.data.user.phone || '',
  signaturePath: resMe.data.user.signaturePath || resMe.data.user.signature || '',
  signature: resMe.data.user.signature || ''
}

    } else {
      info.value = { id: '-', name: '-', email: '-' }
      router.push('/login')
      return
    }

    // 2) users -> userMap
    try {
      const resUsers = await axios.get(`${API_BASE}/api/users`, { withCredentials: true })
      const map = {}
      if (Array.isArray(resUsers.data)) {
        resUsers.data.forEach(u => map[u.user_id] = u.name)
      }
      userMap.value = map
    } catch (e) {
      userMap.value = {}
    }

    // 3) histories (เกี่ยวข้องกับตัวเอง)
    const userId = info.value.id
    const resHistory = await axios.get(`${API_BASE}/api/history`, { withCredentials: true })
    let histories = resHistory.data

    let result = histories.filter(h =>
      h.user_id === userId ||
      h.approvedById === userId ||
      h.disapprovedById === userId ||
      h.canceledById === userId ||
      h.returnedById === userId
    )

    // unique
    let seen = new Set()
    let unique = []
    for (let h of result) {
      let id = h._id?.$oid || h._id
      if (!seen.has(id)) {
        seen.add(id)
        unique.push(h)
      }
    }

    // mapping แปลง field สำหรับแสดง และ “เพิ่มฟิลด์ที่ใช้ใน modal แบบ history”
    let mapped = unique.map((h, idx) => ({
      id: h._id?.$oid || h._id || idx + 1,
      type: h.type,
      name: h.name,
      time: h.type === "field" ? `${h.startTime || "-"} - ${h.endTime || "-"}` : "",
      quantity: h.type === "equipment" ? h.quantity : "",
      status: statusLabel(h.status),

      // ===== เพิ่มสำคัญ เพื่อให้แสดงผลเหมือนหน้า history =====
      booking_id: h.booking_id,
      remark: h.remark,
      startTime: h.startTime,
      endTime: h.endTime,
      attachment: h.attachment,
      bookingPdfUrl: h.bookingPdfUrl || h.booking_pdf_url, // เผื่อมีลิงก์ PDF ตรงๆ
      returnedAt: h.returnedAt,
      updatedAt: h.updatedAt,
      fileName: h.fileName,
      fileType: h.fileType,

      since: h.since,
      uptodate: h.uptodate,
      username_form: h.username_form,
      user_id: h.user_id,

      approvedBy: h.approvedBy,
      approvedById: h.approvedById,
      disapprovedBy: h.disapprovedBy,
      disapprovedById: h.disapprovedById,
      canceledBy: h.canceledBy,
      canceledById: h.canceledById,
      approvedAt: h.approvedAt,
      disapprovedAt: h.disapprovedAt,
      canceledAt: h.canceledAt,
      date: h.date,

      createdAt: h.createdAt,

      requester: userMap.value[h.user_id] || h.user_id || "-",

      // ใช้จัดเรียงล่าสุดเสมอ
      sortAt: sortTimeOf(h),
    }));

    // เรียงจากล่าสุด (คง logic ใกล้เคียงของเดิม)
    mapped = mapped.sort(
      (a, b) =>
        new Date(b.approvedAt || b.disapprovedAt || b.canceledAt || b.date || 0) -
        new Date(a.approvedAt || a.disapprovedAt || a.canceledAt || a.date || 0)
    )

    history.value = mapped
  } catch (err) {
    info.value = { id: '-', name: '-', email: '-' }
    history.value = []
    router.push('/login')
  }

  await fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  clearInterval(polling)
  window.removeEventListener('resize', handleResize)
})

/* =========================
   Status label
========================= */
function statusLabel(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved': return 'Approved'
    case 'pending': return 'Pending'
    case 'returned': return 'Returned'
    case 'disapproved': return 'Disapproved'
    case 'cancel': return 'Cancel'
    case 'canceled': return 'Cancel'
    default: return status
  }
}

/* =========================
   Pagination
========================= */
function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}
function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

/* =========================
   Logout
========================= */
async function logout() {
  const result = await Swal.fire({
    title: 'คุณต้องการออกจากระบบใช่หรือไม่',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ใช่, ออกจากระบบ',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'GET', credentials: 'include' });
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('jwt');
    localStorage.removeItem('user_id');
    if (userStore && userStore.$reset) userStore.$reset();
    window.location.href =
      `https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=${FRONTEND_URL}/login`;
  }
}

/* =========================
   Sidebar
========================= */
const isSidebarClosed = ref(false)
function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}
function handleResize() {
  isMobile.value = window.innerWidth <= 600
  if (!isMobile.value) isSidebarClosed.value = false
}

/* ============================================================
   ====== (ใหม่) DETAIL แบบหน้า history: openDetail() ======
   ============================================================ */

/* ---- Helpers ใช้ร่วมกับ modal แบบ history ---- */
function esc(s) {
  return String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>')
}
function formatDateOnly(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
function normalizePdfUrl(raw) {
  if (!raw) return null;
  let u = String(raw).trim();
  if (!/^https?:\/\//i.test(u)) {
    u = new URL(u.startsWith('/') ? u : `/${u}`, window.location.origin).href;
  }
  if (location.protocol === 'https:' && u.startsWith('http://')) {
    u = 'https://' + u.slice('http://'.length);
  }
  return u;
}
function pickPdfUrlFromGroupItems(items) {
  if (!Array.isArray(items)) return null;
  const hitDirect = items.find(h => h?.bookingPdfUrl || h?.booking_pdf_url);
  if (hitDirect) return hitDirect.bookingPdfUrl || hitDirect.booking_pdf_url;
  const hitAttach = items.find(h =>
    (Array.isArray(h?.attachment) && h.attachment.length > 0) ||
    (typeof h?.attachment === 'string' && h.attachment)
  );
  if (hitAttach) {
    return Array.isArray(hitAttach.attachment) ? hitAttach.attachment[0] : hitAttach.attachment;
  }
  const hitAlt = items.find(h => h?.pdfUrl || h?.pdf_url || h?.fileUrl);
  if (hitAlt) return hitAlt.pdfUrl || hitAlt.pdf_url || hitAlt.fileUrl;
  return null;
}
async function _downloadFromUrl(finalUrl, fallbackName) {
  const resp = await fetch(finalUrl, { credentials: 'include' });
  if (!resp.ok) throw new Error('DIRECT_DOWNLOAD_FAILED');
  const blob = await resp.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  // ชื่อไฟล์:
  let fname = fallbackName;
  try {
    const { pathname } = new URL(finalUrl);
    const name = decodeURIComponent(pathname.split('/').pop() || '');
    fname = name || fallbackName;
  } catch {}
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}
async function _downloadFromApi(bookingId) {
  try {
    const r1 = await axios.get(`${API_BASE}/api/history/pdf`, {
      params: { booking_id: bookingId }, responseType: 'blob'
    });
    const url = URL.createObjectURL(new Blob([r1.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = `booking_${bookingId}.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    return;
  } catch {}
  const r2 = await axios.get(`${API_BASE}/api/history/pdf/${bookingId}`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([r2.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url; a.download = `booking_${bookingId}.pdf`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
async function downloadPdfFromGroup(group) {
  try {
    const bookingId = group?.booking_id;
    if (!bookingId) { await Swal.fire('ผิดพลาด', 'ไม่พบ booking_id', 'error'); return; }
    const picked = pickPdfUrlFromGroupItems(group.items || []);
    const finalUrl = normalizePdfUrl(picked);
    if (finalUrl) {
      try { await _downloadFromUrl(finalUrl, `booking_${bookingId}.pdf`); return; }
      catch { await _downloadFromApi(bookingId); return; }
    }
    await _downloadFromApi(bookingId);
  } catch {
    await Swal.fire('ผิดพลาด', 'ไม่สามารถดาวน์โหลดไฟล์ได้', 'error');
  }
}

/* ---- เรนเดอร์ SweetAlert2 แบบหน้า history ---- */
function detailGroupLikeHistory(group) {
  const fmtDate = (d) => formatDateOnly(d);
  const fmtTime = (t) => {
    if (!t) return '-';
    const raw = String(t).trim().replace(/\s*น\.?$/, '');
    if (/^\d{1,2}:\d{2}$/.test(raw)) return `${raw} น.`;
    const dt = new Date(`1970-01-01T${raw}`);
    if (!isNaN(dt)) {
      const hhmm = dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${hhmm} น.`;
    }
    return `${raw} น.`;
  };
  const fmtTimeRange = (a,b)=>{
    const A = fmtTime(a), B = fmtTime(b);
    if (A==='-' && B==='-') return '-';
    if (A!=='-' && B!=='-') return `${A} - ${B}`;
    return A!=='-' ? A : B;
  };

  let html = '';

  if ((group?.type || '').toLowerCase() === 'field') {
    const it = group.items?.[0] || {};
    const startTime = it.startTime || it.since_time || '';
    const endTime   = it.endTime   || it.until_thetime || '';
    const timeRange = fmtTimeRange(startTime, endTime);

    html = `
      <div class="swal-table-wrap">
        <table class="swal-table">
          <colgroup>
            <col style="width:16%">
            <col style="width:22%">
            <col style="width:16%">
            <col style="width:16%">
            <col style="width:14%">
            <col style="width:16%">
          </colgroup>
          <thead>
            <tr>
              <th>Field</th>
              <th>Name</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${esc(it.name)}</td>
              <td>
                <div><b>Name:</b> ${esc(it.username_form || '-')}</div>
                <div><b>Book for:</b> ${esc(it.proxyStudentName || '-')}</div>
              </td>
              <td class="td-center">${esc(fmtDate(it.date))}</td>
              <td class="td-center">${esc(timeRange)}</td>
              <td class="td-center">${esc(it.status)}</td>
              <td>${esc(it.remark || '-')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="swal-actions">
        <button id="pdf-btn" class="pdfmake-btn">Download PDF form</button>
      </div>
    `;
  } else {
    // equipment
    let statusToShow = '';
    if (group.items.every(i => i.status === 'Return-pending')) statusToShow = 'Return-pending';
    else if (group.items.every(i => i.status === 'Returned'))   statusToShow = 'Returned';
    else if (group.items.every(i => i.status === 'Approved'))   statusToShow = 'Approved';
    else if (group.items.every(i => i.status === 'Pending'))    statusToShow = 'Pending';
    else if (group.items.every(i => i.status === 'Disapproved'))statusToShow = 'Disapproved';
    else statusToShow = (group.items[0]?.status || '');

    const shown = group.items.filter(i => i.status === statusToShow);
    const first = group.items[0] || {};
    const isOneDayBorrow = (!first.since && !first.uptodate);
    const showPdfButton  = !isOneDayBorrow;

    const rows = shown.map((it, idx) => {
      const retDate = it.returnedAt ? fmtDate(it.returnedAt) : '-';
      const borrowerName = it.username_form || group.items?.[0]?.username_form || it.requester || '-';
      const attArr = Array.isArray(it.attachment) ? it.attachment : (it.attachment ? [it.attachment] : []);
      const firstUrl = attArr[0] || null;
      const retPhotoCell =
        (['Returned','Return-pending'].includes(it.status) && firstUrl)
          ? `
            <img
              src="${firstUrl}"
              alt="return-photo"
              class="swal-thumb"
              onclick="window.__showFullReturnPhoto && window.__showFullReturnPhoto('${firstUrl}')"
            />
            <div class="swal-thumb-hint">(คลิกเพื่อดูรูปเต็ม)</div>
          `
          : '-';

      return `
        <tr>
          <td class="td-center">${esc(idx+1)}</td>
          <td>${esc(it.name)}</td>
          <td class="td-center">${esc(it.quantity ?? '-')}</td>
          <td>${esc(borrowerName)}</td>
          <td class="td-center">${esc(fmtDate(it.date))}</td>
          <td class="td-center">${esc(it.status)}</td>
          <td>${esc(it.remark || '-')}</td>
          <td class="td-center">${retDate}</td>
          <td class="td-center">${retPhotoCell}</td>
        </tr>
      `;
    }).join('');

    html = `
      <div class="swal-table-wrap">
        <table class="swal-table equip-table">
          <colgroup>
            <col style="width:6%">
            <col style="width:20%">
            <col style="width:9%">
            <col style="width:18%">
            <col style="width:11%">
            <col style="width:12%">
            <col style="width:14%">
            <col style="width:10%">
            <col style="width:10%">
          </colgroup>
          <thead>
            <tr>
              <th>No</th>
              <th>Equipment</th>
              <th>Amount</th>
              <th>Name</th>
              <th>Date</th>
              <th>Status</th>
              <th>Remark</th>
              <th>Return date</th>
              <th>Photo</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="9" class="td-center">ไม่มีรายการ</td></tr>`}
          </tbody>
        </table>
      </div>
      ${showPdfButton ? `<div class="swal-actions"><button id="pdf-btn" class="pdfmake-btn">Download PDF form</button></div>` : ``}
    `;
  }

  Swal.fire({
    title: 'Detail list',
    html,
    confirmButtonText: 'Close',
    confirmButtonColor: '#3085d6',
    customClass: { popup: 'hist-swal', title: 'hist-swal-title', htmlContainer: 'hist-swal-html' },
    didOpen: () => {
      const pdfBtn = document.getElementById('pdf-btn');
      if (pdfBtn) pdfBtn.addEventListener('click', () => downloadPdfFromGroup(group));

      // ตัวแสดงรูปเต็ม (เปิดซ้ำได้)
      window.__showFullReturnPhoto = (src) => {
        if (!src) return;
        Swal.fire({
          html: `
            <div class="img-viewer-wrap">
              <img src="${src}" alt="photo" class="img-viewer"/>
              <div class="img-viewer-actions">
                <a href="${src}" target="_blank" rel="noopener">เปิดในแท็บใหม่</a>
              </div>
            </div>
          `,
          showConfirmButton: false,
          showCloseButton: true,
          background: '#000',
          customClass: { popup: 'img-swal' }
        });
      };
    },
    willClose: () => { window.__showFullReturnPhoto = undefined; }
  });
}

/* ---- จุดเข้า: เรียกจากปุ่ม Detail ใน template ---- */
function openDetail(hist) {
  const all = history.value || [];
  let items = [];
  if (hist.booking_id) {
    items = all.filter(h => h.type === hist.type && h.booking_id === hist.booking_id);
  } else {
    items = [hist]; // ถ้าไม่มี booking_id ก็โชว์รายการเดียว
  }
  const group = { type: hist.type, booking_id: hist.booking_id, items };
  detailGroupLikeHistory(group);
}
</script>

<style scoped>

.probody{
    background-color: #ffffff;
    width: 100%;
    height: 100vh;
    padding: 20px;
    box-sizing: border-box;
    overflow-x: hidden;
}

.proinfo{
  position: relative;           /* << เพิ่มบรรทัดนี้ */
  background-color: rgb(235, 235, 235);
  border-radius: 20px;
  padding: 30px 40px;
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
  min-height: 160px;
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
.profile-details { color:#333; font-size: 1.07rem; padding-left: 12px; }
/* Signature UI */
.signature-wrap{ margin-top:10px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.signature-label{ font-weight:600; color:#334155; }
.signature-img{
  width: 220px; height: 80px; object-fit: contain;
  border: 1px dashed #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 6px;
}
.signature-empty{ color:#94a3b8; font-style: italic; }
.profile-container {
  padding: 1rem 70px;
}
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

/* จัดกลางใน SweetAlert (พรีวิวลายเซ็น) */
.swal-edit-wrap{ width:100%; display:flex; flex-direction:column; align-items:center; }
.swal-preview{ margin-top:10px; display:flex; justify-content:center; width:100%; }
.swal-signature-img{
  max-width: 260px; max-height: 100px; object-fit: contain;
  border: 1px dashed #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 4px;
}
.swal-signature-empty{ color:#94a3b8; font-style:italic; }

/* มือถือ */
@media (max-width: 768px) {
  .profile-container { padding: 1rem 15px; }
  .proinfo { width: 100%; max-width: 100%; padding: 20px; }
}
.profile-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 70px;
}

.profile-card {
  background-color: rgb(235, 235, 235);
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  padding: 1rem 1.5rem;
  width: 100%;
}

.profile-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: #333;
}

.left, .center, .right {
  flex: 1;
}

.left {
  text-align: left;
}

.center {
  text-align: center;
}

.status-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 260px;
}
.pending-status {
  /* สถานะอยู่ซ้ายสุด */
  flex-shrink: 0;
  margin-right: 16px;
}
.pending-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
  /* ทำให้ปุ่มไปขวาสุด */
}

.status-label {
  flex-shrink: 0;
  /* สถานะติดซ้าย */
}
.action-buttons {
  margin-left: auto;
  display: flex;
  gap: 8px;
  /* ปุ่มไปขวาสุด */
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
.logout-btn:hover {
  background: #dc2626;
}
.pagination-control {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px 0 8px 0;
  gap: 8px;
}
.pagination-control button {
  background: #1d4ed8;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.pagination-control button:disabled {
  background: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 4px 10px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}
.cancel-btn:hover {
  background-color: #d9363e;
}
.remark-btn {
  background-color: #213555;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 14px;
  cursor: pointer;
  margin-left: 8px;
  font-size: 0.95rem;
  transition: background 0.2s;
}
.remark-btn:hover {
  background-color: #4268a3;
}

.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.16);
  z-index: 1100;
}
.sidebar {
  z-index: 1200;
}

.edit-btn, .save-btn, .cancel-btn {
  margin-left: 8px;
  background: #f59e42;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 18px;
  cursor: pointer;
  transition: background 0.2s;
  min-width: 80px;
  min-height: 20px;
  box-sizing: border-box;
  outline: none;
  display: inline-block;
}

.save-btn { background: #22c55e; }
.save-btn:hover { background: #15803d; }

.cancel-btn { background: #ef4444; }
.cancel-btn:hover { background: #dc2626; }

.edit-btn { background: #f59e42; }
.edit-btn:hover { background: #ea580c; }

.editable-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.editable-row > * {
  white-space: nowrap;
}


@media (max-width: 600px) {
  .profile-container {
    overflow-x: auto;
    padding: 0 !important;
    margin-bottom: 8px;
    width: 100vw;
  }
  .proinfo {
  position: relative;
  background-color: white;
  border-radius: 20px;
  padding: 30px 60px 30px 40px;
  display: flex;
  align-items: center; /* center เหมือน profile.vue */
  gap: 2rem;
  width: 100%;
  min-height: 160px;
  overflow-x: auto;
  max-width: 100%;
}
  .profile-grid {
    padding: 0 2px !important;
  }
  .profile-card {
    padding: 1rem 1.5rem;
    margin-bottom: 8px;
    overflow-x: auto;
    width: 100vw;
    box-sizing: border-box;
  }
  .profile-row {
    min-width: 650px; /* ลองเพิ่มเป็น 650px ถ้ายังไม่พอ */
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .status-group {
    min-width: 180px;
    flex-shrink: 0;
  }
  .remark-btn {
    margin-left: 8px;
    white-space: nowrap;
  }
  .pending-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pending-row .remark-btn,
  .pending-row .cancel-btn {
    margin-left: 0;
    margin-right: 0;
  }
}

.notification-dropdown { position: absolute; right: 0; top: 38px; background: #fff; border-radius: 18px 0 18px 18px; box-shadow: 0 8px 24px 0 rgba(27, 50, 98, 0.14), 0 2px 4px 0 rgba(33, 125, 215, 0.06); min-width: 330px; max-width: 370px; max-height: 420px; overflow-y: auto; z-index: 1002; padding: 0; border: none; animation: fadeDown 0.22s; }

</style>
<style>
@import '../css/style.css';

/* ==== SweetAlert (โปรไฟล์) ให้กว้างขึ้นและรองรับตาราง ==== */
.swal2-popup.swal-wide{
  width: auto !important;
  max-width: min(1000px, 96vw) !important;
  padding: 26px 24px !important;
}
@supports (width: fit-content) {
  .swal2-popup.swal-wide{ width: fit-content !important; }
}

.swal2-popup .swal-detail-wrap{
  overflow-x: auto; /* ถ้าตารางกว้างกว่าหน้าจอ ให้เลื่อนแนวนอนได้ */
}

/* สไตล์ตาราง */
.swal2-popup .swal-detail-table{
  width: min(900px, 92vw);
  border-collapse: collapse;
  margin: 0 auto;
  font-size: 0.98rem;
}
.swal2-popup .swal-detail-table thead th{
  background:#213555;
  color:#fff;
  padding:8px 10px;
  border:1px solid #e6e9f2;
  text-align:center;
  font-weight:700;
}
.swal2-popup .swal-detail-table tbody td{
  border:1px solid #e6e9f2;
  padding:8px 10px;
  color:#1f2a44;
}
.swal2-popup .swal-detail-table tbody td.c{
  text-align:center;
}

/* กันชื่อผู้ขอใช้/ชื่อรายการยาว ตัดด้วยเลื่อนแนวนอนแทน */
.swal2-popup .swal-detail-table.items thead th:nth-child(2),
.swal2-popup .swal-detail-table.items tbody td:nth-child(2),
.swal2-popup .swal-detail-table.items thead th:nth-child(4),
.swal2-popup .swal-detail-table.items tbody td:nth-child(4){
  white-space: nowrap;
  word-break: normal;
}

/* เผื่อคอลัมน์ชื่อผู้ขอใช้ยาว */
.swal2-popup .swal-detail-table.items thead th:nth-child(4){ min-width: 220px; }
</style>

<style>
/* ===== SweetAlert modal แบบ history ===== */
.swal2-html-container{ text-align: left !important; margin: 0 !important; padding: 0 !important; }

.swal-table-wrap{
  max-width: 92vw; max-height: 70vh;
  overflow-x: auto; overflow-y: auto; padding: 6px 2px 0;
}
.hist-swal.swal2-popup{
  width: 96vw; max-width: 1500px; padding: 24px;
}
.hist-swal .swal2-title{ margin-bottom: 12px !important; }
.hist-swal .swal-table-wrap{ max-width: 96vw; max-height: 72vh; overflow: auto; padding: 6px 0 0; }

.swal-table{
  width: 100%; min-width: 780px;
  border-collapse: collapse; table-layout: auto;
  background: #fff; border-radius: 10px; overflow: hidden;
}
.swal-table thead th{
  background: #1e3a8a; color: #fff; padding: 10px 8px;
  font-weight: 700; font-size: 0.95rem; text-align: center;
  position: sticky; top: 0; z-index: 1;
}
.swal-table tbody td{
  border-bottom: 1px solid #e6e9f3; padding: 8px 10px;
  font-size: 0.95rem; vertical-align: top; word-break: break-word;
}
.swal-table tbody tr:hover{ background: #f7f9ff; }
.td-center{ text-align: center; }

/* รูปตัวอย่างใบคืน */
.swal-thumb{
  max-width: 120px; max-height: 85px; object-fit: contain;
  border: 1px solid #cfd5e6; border-radius: 8px; cursor: pointer; display: inline-block;
}
.swal-thumb-hint{ font-size: 0.8rem; color: #8a8fa3; margin-top: 4px; }

/* ปุ่มด้านล่าง */
.swal-actions{ margin-top: 10px; display: flex; justify-content: flex-end; }
.pdfmake-btn{
  background: #213555; color: #fff; border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer; font-weight: 600;
}
.pdfmake-btn:hover{ background:#4268a3; }

/* Viewer รูปเต็มจอ */
.img-swal.swal2-popup{ width: auto; max-width: 96vw; padding: 8px; background: #000; }
.img-swal .swal2-close{ color: #fff !important; top: 6px; right: 10px; }
.img-viewer-wrap{ display:flex; flex-direction:column; align-items:center; gap:8px; }
.img-viewer{ max-width: 92vw; max-height: 82vh; object-fit: contain; background: #000; display:block; }
.img-viewer-actions a{ color:#cfe3ff; text-decoration: underline; font-size: 0.95rem; }

/* จัดกลางบางคอลัมน์ในตารางอุปกรณ์ */
.hist-swal .equip-table th:nth-child(2),
.hist-swal .equip-table td:nth-child(2){ text-align: center; }
.hist-swal .equip-table th:nth-child(7),
.hist-swal .equip-table td:nth-child(7){ text-align: center; }

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