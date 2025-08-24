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
        <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> รับคืนอุปกรณ์ </router-link>
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
   <img :src="profileImageUrl" alt="profile" class="profile-img" @error="imgError" />
    <div class="profile-details" v-if="info">
      <p>Username : {{ info.name }}</p>
      <!-- <div class="editable-row">
        <span>ID :</span>
        <template v-if="!editId">
          <span>{{ info.id }}</span>
          <button
            v-if="canEditUserId"
            class="edit-btn"
            @click="startEdit"
          >แก้ไข</button>
        </template>
        <template v-else>
          <input v-model="editUserId" style="padding:6px 12px;font-size:1rem;border-radius:4px;border:1px solid #d1d5db;" />
          <button class="save-btn" @click="saveUserId">บันทึก</button>
          <button class="cancel-btn" @click="cancelEdit">ยกเลิก</button>
        </template>
      </div> -->
      <p>Email : {{ info.email }}</p>
    </div>
    <div v-else>
      Loading...
              </div>
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
      ✅ รายการถูกอนุมัติ
    </template>
    <template v-else-if="hist.status === 'Disapproved'">
      ❌ รายการไม่ถูกอนุมัติ
    </template>
    <template v-else-if="hist.status === 'Cancel'">
      🚫 รายการถูกยกเลิก
    </template>
    <template v-else-if="hist.status === 'Returned'">
      ✅ คืนของสำเร็จแล้ว
    </template>
    <template v-else-if="hist.status === 'Pending'">
      ⏳ กำลังรออนุมัติ
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
    <button class="remark-btn" @click="detailGroup([hist])">Detail</button>
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



const isMobile = ref(window.innerWidth <= 600)
const info = ref({ id: "-", name: "-", email: "-", picture: null })

const history = ref([])
const userMap = ref({}) // <<--- เพิ่ม userMap

const editId = ref(false)
const editUserId = ref('')

const canEditUserId = computed(() => {
  return info.value?.email?.toLowerCase().endsWith('@mfu.ac.th')
})


const profileImageUrl = computed(() => {
  if (!info.value || !info.value.picture) return '/img/user.png'
  // ถ้าขึ้นต้น http = ใช้ external URL, ถ้าไม่ใช่ = ต่อ API_BASE
  if (info.value.picture.startsWith('http')) return info.value.picture
  return API_BASE + info.value.picture
})
function imgError(event) { event.target.src = '/img/user.png' }


const itemsPerPage = 5
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(history.value.length / itemsPerPage) || 1)
const paginatedHistory = computed(() => {
  const sorted = [...history.value].sort((a, b) => (b.sortAt || 0) - (a.sortAt || 0))
  const start = (currentPage.value - 1) * itemsPerPage
  return sorted.slice(start, start + itemsPerPage)
})

// ==== กระดิ่งแจ้งเตือน ====
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
function detailGroup(items) {
  // กันอักขระพิเศษใน HTML
  const esc = (s) =>
    String(s ?? '-')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  // ครอบตารางให้เลื่อนได้
  const tableWrap = (innerHtml) => `
    <div class="swal-detail-wrap">
      ${innerHtml}
    </div>
  `;

  // ===== helper ภายในเฉพาะฟังก์ชันนี้ =====
  const parseToDate = (d) => {
    if (!d) return null;
    const s = String(d).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, dd] = s.split('-').map(Number);
      return new Date(y, m - 1, dd);
    }
    const dt = new Date(s);
    return isNaN(dt) ? null : dt;
  };
  const isSameDay = (a, b) => {
    const A = parseToDate(a),
      B = parseToDate(b);
    if (!A || !B) return true;
    return (
      A.getFullYear() === B.getFullYear() &&
      A.getMonth() === B.getMonth() &&
      A.getDate() === B.getDate()
    );
  };
  const isMultiDayEquipment = (it) => {
    if (String(it?.type || '').toLowerCase() !== 'equipment') return false;
    return !!it.since && !!it.uptodate && !isSameDay(it.since, it.uptodate);
  };
  // =======================================

  const type = (items?.[0]?.type || '').toLowerCase();

  if (type === 'field') {
    // ===== ตาราง FIELD =====
    const rows = items
      .map(
        (it, idx) => `
      <tr>
        <td class="c">${idx + 1}</td>
        <td>${esc(it.name)}</td>
        <td>${esc(it.requester || '-')}</td>
        <td class="c">${esc(it.date ? formatDate(it.date) : '-')}</td>
        <td class="c">${esc(it.time || '-')}</td>
        <td class="c">${esc(it.status || '-')}</td>
      </tr>
    `
      )
      .join('');

    const table = `
      <table class="swal-detail-table items">
        <thead>
          <tr>
            <th style="width:72px">ลำดับ</th>
            <th>ชื่อสนาม</th>
            <th>ผู้ขอใช้</th>
            <th style="width:120px">วันที่ขอใช้</th>
            <th style="width:120px">เวลา</th>
            <th style="width:120px">สถานะ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    Swal.fire({
      title: 'รายละเอียดสนาม',
      html: tableWrap(table),
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#3085d6',
      customClass: { popup: 'swal-wide' }
    });
  } else {
    // ===== ตาราง EQUIPMENT =====
    // เงื่อนไขชื่อผู้ขอใช้:
    //  - หลายวัน => ใช้ username_form
    //  - วันเดียว => ใช้ค่าเดิม (requester / user_id)
    const rows = items
      .map((it, idx) => {
        const displayName = isMultiDayEquipment(it)
          ? it.username_form || it.requester || it.user_id || '-'
          : it.requester || it.user_id || '-';

        return `
          <tr>
            <td class="c">${idx + 1}</td>
            <td>${esc(it.name)}</td>
            <td class="c">${esc(it.quantity || '-')}</td>
            <td>${esc(displayName)}</td>
            <td class="c">${esc(it.date ? formatDate(it.date) : '-')}</td>
            <td class="c">${esc(it.status || '-')}</td>
          </tr>
        `;
      })
      .join('');

    const table = `
      <table class="swal-detail-table items">
        <thead>
          <tr>
            <th style="width:72px">ลำดับ</th>
            <th>รายการ</th>
            <th style="width:90px">จำนวน</th>
            <th>ผู้ขอใช้</th>
            <th style="width:120px">วันที่ขอยืม</th>
            <th style="width:120px">สถานะ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    Swal.fire({
      title: 'รายละเอียดอุปกรณ์',
      html: tableWrap(table),
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#3085d6',
      customClass: { popup: 'swal-wide' }
    });
  }
}

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
  // ใช้เฉพาะ type 'equipment'
  if ((item?.type || '').toLowerCase() !== 'equipment') return false;
  return !!item.since && !!item.uptodate && !isSameDay(item.since, item.uptodate);
}

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

// ===============================

// คืนค่า ms ของวันที่ ถ้าไม่มี/พาร์สไม่ได้ = 0
const toMs = (v) => {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};
// เวลาที่ใช้จัดเรียง (หยิบค่าที่ “ล่าสุด” จากหลาย ๆ ช่อง)
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


onMounted(async () => {
   window.addEventListener('resize', handleResize)
  handleResize()
  document.addEventListener('mousedown', handleClickOutside)
  try {
    // 1. ดึงข้อมูล user login ปัจจุบัน (session จริง)
    const resMe = await axios.get(`${API_BASE}/api/me`, { withCredentials: true })
    if (resMe.data && resMe.data.user) {
      info.value = {
        id: resMe.data.user.user_id,
        name: resMe.data.user.name,
        email: resMe.data.user.email,
         picture: resMe.data.user.picture
      }
    } else {
      info.value = { id: '-', name: '-', email: '-' }
      router.push('/login')
      return
    }

    // 2. ดึง user ทั้งหมดมาสร้าง userMap (user_id => name)
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

    // 3. โหลดประวัติทั้งหมด
    const userId = info.value.id
    const resHistory = await axios.get(`${API_BASE}/api/history`, { withCredentials: true })
    let histories = resHistory.data

    // กรองเฉพาะประวัติที่ตัวเองเป็นคนขอ หรือเป็นคน approve/disapprove/cancel
    let result = histories.filter(h =>
   h.user_id === userId ||
   h.approvedById === userId ||
   h.disapprovedById === userId ||
   h.canceledById === userId ||
   h.returnedById === userId
 )

    // ลบซ้ำ
    let seen = new Set()
    let unique = []
    for (let h of result) {
      let id = h._id?.$oid || h._id
      if (!seen.has(id)) {
        seen.add(id)
        unique.push(h)
      }
    }

    // map ข้อมูลสำหรับแสดงผล
    let mapped = unique.map((h, idx) => ({
  id: h._id?.$oid || h._id || idx + 1,
  type: h.type,
  name: h.name,
  time: h.type === "field" ? `${h.startTime || "-"} - ${h.endTime || "-"}` : "",
  quantity: h.type === "equipment" ? h.quantity : "",
  status: statusLabel(h.status),

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

  requester: userMap.value[h.user_id] || h.user_id || "-",

  // ใช้จัดเรียงล่าสุดเสมอ
  sortAt: sortTimeOf(h),
}));



    // เรียงจากล่าสุด
    mapped = mapped.sort((a, b) => new Date(b.approvedAt || b.disapprovedAt || b.canceledAt || b.date || 0) - new Date(a.approvedAt || a.disapprovedAt || a.canceledAt || a.date || 0))

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

function statusLabel(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved': return 'Approved'
    case 'pending': return 'Pending'
    case 'returned': return 'Returned'
    case 'disapproved': return 'Disapproved'
    case 'cancel': return 'Cancel'
    default: return status
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}
function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

async function logout() {
  const result = await Swal.fire({
    title: 'คุณต้องการออกจากระบบใช่หรือไม่',
    // text: "คุณต้องการออกจากระบบใช่หรือไม่",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ใช่, ออกจากระบบ',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'GET',
        credentials: 'include'
      });
    } catch (err) {
      // error ก็ ignore ได้
    }
    localStorage.removeItem('jwt');
    localStorage.removeItem('user_id');
    if (userStore && userStore.$reset) userStore.$reset();

    window.location.href =
      `https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=${FRONTEND_URL}/login`;
  }
}

const isSidebarClosed = ref(false)
function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

function handleResize() {
  isMobile.value = window.innerWidth <= 600
  if (!isMobile.value) isSidebarClosed.value = false
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
}
.profile-details {
  color: #333;
  font-size: 1rem;
  padding-left: 12px;
}
.profile-container {
  padding: 1rem 70px;
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
    min-width: 370px;
    width: max-content;
    padding: 20px 20px;
    box-sizing: border-box;
    overflow-x: auto;
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