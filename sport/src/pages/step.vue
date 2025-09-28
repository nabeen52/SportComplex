<template>
  <div class="layout" :class="{ 'sidebar-closed': isSidebarClosed }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/dashboard" exact-active-class="active">
          <i class="pi pi-chart-pie"></i> แดชบอร์ด
        </router-link>
        <router-link to="/home_admin" exact-active-class="active">
          <i class="pi pi-megaphone"></i> แก้ไขข่าว
        </router-link>
        <router-link to="/edit_field" active-class="active">
          <i class="pi pi-map-marker"></i> แก้ไขสนาม
        </router-link>
        <router-link to="/edit_equipment" active-class="active">
          <i class="pi pi-clipboard"></i> แก้ไขอุปกรณ์
        </router-link>
         <router-link to="/step" active-class="active"><i class="pi pi-sitemap"></i> แก้ไขขั้นตอนการอนุมัติ </router-link>
        <router-link to="/booking_field_admin" active-class="active">
          <i class="pi pi-map-marker"></i> จองสนาม
        </router-link>
        <router-link to="/approve_field" active-class="active">
          <i class="pi pi-verified"></i> อนุมัติ
        </router-link>
        <router-link to="/agency_admin" active-class="active">
          <i class="pi pi-briefcase"></i> หน่วยงาน
        </router-link>
        <router-link to="/members" active-class="active">
          <i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล
        </router-link>
        <router-link to="/history_admin" active-class="active">
          <i class="pi pi-history"></i> ระบบประวัติการทำรายการ
        </router-link>
      </nav>
    </aside>

    <!-- Overlay (มือถือ) -->
    <div
      v-if="isMobile && !isSidebarClosed"
      class="sidebar-overlay"
      @click="toggleSidebar"
    ></div>

    <!-- Main Content -->
    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <div style="position: relative; display: inline-block;">
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
                  :class="[
                    'notification-item',
                    noti.type || '',
                    { unread: noti.timestamp > lastSeenTimestamp }
                  ]"
                >
                  {{ noti.message }}
                </li>
                <li v-if="notifications.length === 0" class="no-noti">
                  ไม่มีแจ้งเตือน
                </li>
              </ul>
            </div>
          </div>
          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- ================= MAIN CONTENT ================= -->
      <main class="content step-page">
  <!-- Field Section -->
  <section class="role-section">
    <h2>ขั้นตอนอนุมัติสนาม (Field)</h2>
    <div class="checkbox-group">
      <!-- <label><input type="checkbox" value="staff" v-model="selectedRoles.field" /> Staff</label> -->
      <label><input type="checkbox" value="admin" v-model="selectedRoles.field" /> Admin</label>
      <label><input type="checkbox" value="super" v-model="selectedRoles.field" /> Supervisor</label>
    </div>
  </section>

  <!-- One-Day Equipment Section -->
<section class="role-section">
  <h2>ขั้นตอนอนุมัติอุปกรณ์ยืมวันเดียว (Equipment – One Day)</h2>
  <div class="checkbox-group">
    <label><input type="checkbox" value="staff" v-model="selectedRoles.equipment_one_day" /> Staff</label>
    <label><input type="checkbox" value="admin" v-model="selectedRoles.equipment_one_day" /> Admin</label>
    <!-- <label><input type="checkbox" value="super" v-model="selectedRoles.equipment_one_day" /> Supervisor</label> -->
  </div>
</section>


  <!-- Equipment Section -->
  <!-- <section class="role-section">
    <h2>ขั้นตอนอนุมัติอุปกรณ์หลายวัน(Equipment)</h2>
    <div class="checkbox-group">
      <label><input type="checkbox" value="staff" v-model="selectedRoles.equipment" /> Staff</label>
      <label><input type="checkbox" value="admin" v-model="selectedRoles.equipment" /> Admin</label>
       <label><input type="checkbox" value="super" v-model="selectedRoles.equipment" /> Supervisor</label>
    </div>
  </section> -->

  <div class="save-wrap">
    <button class="save-btn" @click="saveRoles">บันทึก</button>
  </div>
</main>

      <!-- ================= END MAIN CONTENT ================= -->
      <!-- Footer -->
      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University | Tel: 0-5391-7820 and
            0-5391-7821 | Facebook:
            <a
              href="https://www.facebook.com/mfusportcomplex"
              target="_blank"
              >MFU Sports Complex Center</a
            >
            | Email:
            <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
          <p>
            © 2025 Center for Information Technology Services, Mae Fah Luang
            University. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>



<script>
import axios from 'axios';
import Swal from 'sweetalert2';
axios.defaults.withCredentials = true;

const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const cleanRoles = (arr) =>
  Array.from(new Set(
    (Array.isArray(arr) ? arr : [])
      .map(r => String(r).trim().toLowerCase())
      .filter(r => r === 'staff' || r === 'admin' || r === 'super')
  ));

export default {
  data() {
    return {
      isSidebarClosed: false,
      filter: 'all',
      Members: [],
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
      isMobile: window.innerWidth <= 600,
      lastSeenTimestamp: 0,
      availableRoles: ["staff", "admin", "super"],
      selectedRoles: { field: [], equipment: [], equipment_one_day: [] },
      
        
    };
  },
  computed: {
    filteredMembers() {
      if (this.filter === 'all') return this.Members;
      return this.Members.filter(m => m.position === this.filter);
    },
    currentUserEmail() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        return user?.email || "";
      } catch {
        return "";
      }
    }
  },

  async mounted() {
  // โหลด timestamp ที่เคยเปิดดูแจ้งเตือนล่าสุด (สำหรับ badge)
  this.lastSeenTimestamp = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0') || 0;

  // ดึงข้อมูลเริ่มต้น (สมาชิก + แจ้งเตือน) พร้อมกัน
  await Promise.allSettled([
    this.loadMembers(),
    this.fetchNotifications()
  ]);

  // ตั้ง polling แจ้งเตือนทุก 30 วินาที
  this.polling = setInterval(this.fetchNotifications, 30000);

  // ตั้ง event listeners
  document.addEventListener('mousedown', this.handleClickOutside);
  window.addEventListener('resize', this.handleResize);
  this.handleResize(); // เซ็ต isMobile / sidebar ตามขนาดจอปัจจุบัน

  // โหลด roles ปัจจุบันจาก backend (แยก field / equipment หลายวัน / equipment วันเดียว)
  try {
    const res = await axios.get(`${API_BASE}/api/settings/approval_roles`, { timeout: 15000 });

    // backend ใหม่: { value: { field:[], equipment:[], equipment_one_day:[] } }
    // เผื่อกรณีเก่า ให้รองรับ alias: one_day / equipmentOneDay
    const raw =
      (res && res.data && typeof res.data.value === 'object')
        ? res.data.value
        : (res?.data || {});

    this.selectedRoles = {
      field:             cleanRoles(raw.field || []),
      equipment:         cleanRoles(raw.equipment || []),
      equipment_one_day: cleanRoles(raw.equipment_one_day || raw.one_day || raw.equipmentOneDay || []),
    };
  } catch (err) {
    console.error("โหลด approval_roles ไม่สำเร็จ:", err);
    this.selectedRoles = { field: [], equipment: [], equipment_one_day: [] };
  }

  // เคลียร์ localStorage เวอร์ชันเก่า (ถ้ามี)
  localStorage.removeItem("APPROVAL_ROLES");
},






  beforeUnmount() {
    if (this.polling) clearInterval(this.polling);
    document.removeEventListener('mousedown', this.handleClickOutside);
    window.removeEventListener('resize', this.handleResize);

  },
  methods: {

     // === methods.saveRoles() (แก้แล้ว) ===
  async saveRoles() {
  try {
    const roles = {
      field:             cleanRoles(this.selectedRoles.field),
      equipment:         cleanRoles(this.selectedRoles.equipment),
      equipment_one_day: cleanRoles(this.selectedRoles.equipment_one_day),
    };
    const resp = await axios.post(`${API_BASE}/api/settings/approval_roles`, roles);
    // backend ตอบ { value: {...} }
    const val = resp?.data?.value || roles;
    this.selectedRoles = {
      field:             cleanRoles(val.field || []),
      equipment:         cleanRoles(val.equipment || []),
      equipment_one_day: cleanRoles(val.equipment_one_day || []),
    };
    Swal.fire('บันทึกสำเร็จ', 'บันทึกขั้นตอนอนุมัติเรียบร้อยแล้ว', 'success');
  } catch (err) {
    Swal.fire('ผิดพลาด', 'บันทึกไม่สำเร็จ', 'error');
  }
},





    saveSteps() {
//   localStorage.setItem("APPROVAL_ROLES", JSON.stringify(this.selectedRoles));
//   Swal.fire("บันทึกสำเร็จ", "ขั้นตอนอนุมัติถูกบันทึกแล้ว", "success");
    },

    normalizeEmail(email) {
      return (email || '').trim().toLowerCase();
    },
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed;
    },
    toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    this.lastSeenTimestamp = Date.now();
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(this.lastSeenTimestamp));
    this.unreadCount = 0; // เคลียร์ทันที
  }
},
    handleResize() {
    this.isMobile = window.innerWidth <= 600;
    if (!this.isMobile) this.isSidebarClosed = false;
  },
    closeNotifications() { this.showNotifications = false; },

    pruneOldNotifications() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
    },

    handleClickOutside(event) {
      const notifDropdown = document.querySelector('.notification-dropdown');
      const notifBtn = document.querySelector('.notification-btn');
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
    this.pruneOldNotifications();

    const res = await axios.get(`${API_BASE}/api/history/approve_field`);
    const data = Array.isArray(res.data) ? res.data : [];

    const pendings = data.filter(item =>
      item.status === 'pending' &&
      (item.type === 'field' || item.type === 'equipment')
    );

    if (pendings.length) {
      const newMessages = pendings.map(item => {
        const id = item._id?.$oid || item._id;
        const ts =
          (item.updatedAt && new Date(item.updatedAt).getTime()) ??
          (item.createdAt && new Date(item.createdAt).getTime()) ??
          (item.date && new Date(item.date).getTime()) ??
          Date.now();

        return {
          id,
          type: 'pending',
          timestamp: ts,
          message: item.type === 'field'
            ? `สนาม '${item.name}' กำลังรอการอนุมัติ`
            : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
        };
      });

      // รวม + unique ตาม id + sort ล่าสุดมาก่อน
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      this.pruneOldNotifications();
    }

    // นับ unread จาก timestamp > lastSeenTimestamp (badge จะไม่กลับมาเอง)
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch {}
},
    async loadMembers() {
  try {
    const res = await axios.get(`${API_BASE}/api/members`);
    this.Members = res.data;
  } catch (e) {
    Swal.fire('เกิดข้อผิดพลาด', 'โหลดรายชื่อสมาชิกไม่สำเร็จ', 'error');
  }
},

    async addMember() {
  const { value: formValues } = await Swal.fire({
    title: 'เพิ่มสมาชิกจาก User',
    html: `
      <div class="form-grid">
        <input type="email" id="email" class="swal2-input col-left" placeholder="อีเมลผู้ใช้งาน (user)">
        <select id="position" class="swal2-input col-right">
          <option value="">เลือกตำแหน่ง</option>
          <option value="Staff">Staff</option>
          <option value="Admin">Admin</option>
          <option value="Super">Super</option>
        </select>

        <input type="text" id="thaiName" class="swal2-input col-span-2 extra" placeholder="ชื่อ-นามสกุล (ภาษาไทย)">
        <div class="file col-span-2 extra">
          <input type="file" id="signature" accept="image/*,.png,.jpg,.jpeg,.pdf" hidden>
          <button type="button" id="pickSig" class="file-btn">เลือกไฟล์ลายเซ็น</button>
          <span id="sigName" class="file-name">ยังไม่ได้เลือกไฟล์</span>
        </div>
    
      </div>
    `,
    customClass: { popup: 'member-swal' },
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'เลื่อนตำแหน่ง',
    cancelButtonText: 'ยกเลิก',
    didOpen: () => {
      const posEl = document.getElementById('position');
      const extras = document.querySelectorAll('.member-swal .extra');

      const showExtras = () => {
        const show = posEl.value === 'Admin' || posEl.value === 'Super';
        extras.forEach(el => (el.style.display = show ? '' : 'none'));
      };
      posEl.addEventListener('change', showExtras);
      showExtras();

      const fileInput = document.getElementById('signature');
      const pickBtn = document.getElementById('pickSig');
      const fileName = document.getElementById('sigName');
      pickBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        fileName.textContent = fileInput.files?.[0]?.name || 'ยังไม่ได้เลือกไฟล์';
      });
    },
    preConfirm: () => {
      const email = document.getElementById('email').value.trim();
      const position = document.getElementById('position').value;
      const needExtra = position === 'Admin' || position === 'Super';
      const thaiName = (document.getElementById('thaiName')?.value || '').trim();
      const signatureFile = document.getElementById('signature')?.files?.[0] || null;

      if (!email || !isValidEmail(email) || !position) {
        Swal.showValidationMessage('กรุณากรอกอีเมลที่ถูกต้องและเลือกตำแหน่ง');
        return false;
      }
      if (needExtra) {
        if (!thaiName) return Swal.showValidationMessage('กรุณากรอกชื่อ (ภาษาไทย)');
        if (!signatureFile) return Swal.showValidationMessage('กรุณาอัปโหลดไฟล์ลายเซ็น');
      }
      return { email, position, thaiName, signatureFile };
    }
  });

  if (!formValues) return;

  try {
    const check = await axios.get(`${API_BASE}/api/users/email/${encodeURIComponent(formValues.email)}`);
    if (!check.data || check.data.role !== 'user') {
      Swal.fire('ไม่พบผู้ใช้นี้ หรือไม่ใช่ user', '', 'error');
      return;
    }

    if (formValues.position === 'Staff') {
      await axios.patch(`${API_BASE}/api/members/${encodeURIComponent(formValues.email)}`, {
        email: formValues.email, position: 'Staff'
      });
    } else {
      const fd = new FormData();
      fd.append('email', formValues.email);
      fd.append('position', formValues.position);
      fd.append('thaiName', formValues.thaiName);
      fd.append('signature', formValues.signatureFile);
      await axios.post(`${API_BASE}/api/members/promote`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    await this.loadMembers();
    Swal.fire('เลื่อนตำแหน่งสำเร็จ', '', 'success');
  } catch (err) {
    Swal.fire('ผิดพลาด', err?.response?.data?.message || 'ไม่สามารถทำรายการได้', 'error');
  }
}
,

    async editMember(index) {
  const Member = this.Members[index];
  if (this.normalizeEmail(Member.email) === this.normalizeEmail(this.currentUserEmail)) {
    Swal.fire('คุณไม่สามารถแก้ไขข้อมูลตัวเองได้', '', 'warning');
    return;
  }

  // ==== ดึงค่าเดิมจาก backend ====
  let existingThaiName = '';
  let signatureUrl = '';
  try {
    const res = await axios.get(`${API_BASE}/api/users/email/${encodeURIComponent(Member.email)}`);
    const u = res.data || {};
    existingThaiName = u.thaiName || u.name_th || u.nameTh || '';         // เผื่อใช้คีย์อื่น
    signatureUrl = u.signaturePath || u.signatureUrl || '';               // path/url เก็บไฟล์เดิม
  } catch (e) {
    // ถ้าดึงไม่สำเร็จ ปล่อยค่าว่างไป
  }
  const esc = (s='') => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const fileName = signatureUrl ? signatureUrl.split('/').pop() : 'ยังไม่ได้เลือกไฟล์';
  // ทำลิงก์แบบ absolute ถ้าได้มาเป็น path
  const absSigUrl = signatureUrl
    ? (signatureUrl.startsWith('http') ? signatureUrl
       : `${API_BASE}${signatureUrl.startsWith('/') ? '' : '/'}${signatureUrl}`)
    : '';

  // ==== เปิด SweetAlert ====
  const { value: result, isConfirmed, isDenied } = await Swal.fire({
    title: 'แก้ไขสมาชิก',
    html: `
      <div class="form-grid">
        <input type="email" id="email" class="swal2-input col-left" placeholder="อีเมล" value="${esc(Member.email)}">
        <select id="position" class="swal2-input col-right">
          <option value="Staff" ${Member.position === 'Staff' ? 'selected' : ''}>Staff</option>
          <option value="Admin" ${Member.position === 'Admin' ? 'selected' : ''}>Admin</option>
          <option value="Super" ${Member.position === 'Super' ? 'selected' : ''}>Super</option>
        </select>

        <!-- ใส่ค่าเดิมของชื่อภาษาไทย และให้กว้าง 2 คอลัมน์ -->
        <input type="text" id="thaiName" class="swal2-input col-span-2 extra" placeholder="ชื่อ (ภาษาไทย)" value="${esc(existingThaiName)}">

        <!-- โชว์ชื่อไฟล์เดิม + ปุ่มเลือกไฟล์ใหม่ + ลิงก์ดูไฟล์เดิม -->
        <div class="file col-span-2 extra">
          <input type="file" id="signature" accept="image/*,.png,.jpg,.jpeg,.pdf" hidden>
          <button type="button" id="pickSig" class="file-btn">อัปเดตลายเซ็น</button>
          <span id="sigName" class="file-name">${esc(fileName)}</span>
          ${absSigUrl ? `<a href="${absSigUrl}" target="_blank" class="file-link">ดูไฟล์เดิม</a>` : ''}
        </div>
      </div>
    `,
    customClass: { popup: 'member-swal' },
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'บันทึก',
    denyButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    didOpen: () => {
      const posEl = document.getElementById('position');
      const extras = document.querySelectorAll('.member-swal .extra');
      const toggleExtras = () => {
        const show = posEl.value === 'Admin' || posEl.value === 'Super';
        extras.forEach(el => el.style.display = show ? '' : 'none');
      };
      posEl.addEventListener('change', toggleExtras);
      toggleExtras(); // โชว์ทันทีถ้าปัจจุบันเป็น Admin/Super

      // จัดการปุ่มเลือกไฟล์
      const fileInput = document.getElementById('signature');
      const pickBtn = document.getElementById('pickSig');
      const fileNameEl = document.getElementById('sigName');
      pickBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        fileNameEl.textContent = fileInput.files?.[0]?.name || '${esc(fileName)}';
      });
    },
    preConfirm: () => {
      const email = document.getElementById('email').value.trim();
      const position = document.getElementById('position').value;
      const thaiName = (document.getElementById('thaiName')?.value || '').trim();
      const signatureFile = document.getElementById('signature')?.files?.[0] || null;

      if (email !== Member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Swal.showValidationMessage('กรุณากรอกอีเมลที่ถูกต้อง');
        return false;
      }
      if (!position) {
        Swal.showValidationMessage('กรุณาเลือกตำแหน่ง');
        return false;
      }
      return { email, position, thaiName, signatureFile };
    }
  });

  // ==== ดำเนินการบันทึก/ลบ ====
  if (isConfirmed && result) {
    try {
      const oldEmail = Member.email;
      const wasPriv = Member.position === 'Admin' || Member.position === 'Super';
      const willPriv = result.position === 'Admin' || result.position === 'Super';

      if (!wasPriv && willPriv) {
        if (!result.thaiName) return Swal.fire('กรุณากรอกชื่อ (ภาษาไทย)', '', 'warning');
        if (!result.signatureFile) return Swal.fire('กรุณาอัปโหลดไฟล์ลายเซ็น', '', 'warning');
        const fd = new FormData();
        fd.append('oldEmail', oldEmail);
        fd.append('email', result.email);
        fd.append('position', result.position);
        fd.append('thaiName', result.thaiName);
        fd.append('signature', result.signatureFile);
        await axios.post(`${API_BASE}/api/members/promote`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (willPriv) {
        const fd = new FormData();
        fd.append('oldEmail', oldEmail);
        fd.append('email', result.email);
        fd.append('position', result.position);
        // ส่งเฉพาะฟิลด์ที่แก้
        if (result.thaiName)  fd.append('thaiName', result.thaiName);
        if (result.signatureFile) fd.append('signature', result.signatureFile);
        await axios.post(`${API_BASE}/api/members/update-privileged`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.patch(`${API_BASE}/api/members/${encodeURIComponent(oldEmail)}`, {
          email: result.email,
          position: result.position
        });
      }

      await this.loadMembers();
      Swal.fire('แก้ไขสำเร็จ', '', 'success');
    } catch (err) {
      Swal.fire('ผิดพลาด', err?.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  }

  if (isDenied) {
    const confirmDelete = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'ต้องการลบสมาชิกนี้หรือไม่ (จะกลับไปเป็น user ปกติ)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });
    if (confirmDelete.isConfirmed) {
      try {
        await axios.patch(`${API_BASE}/api/members/${encodeURIComponent(Member.email)}`, {
          email: Member.email, position: 'user'
        });
        await this.loadMembers();
        Swal.fire('เปลี่ยนสถานะเป็นผู้ใช้ทั่วไปแล้ว', '', 'success');
      } catch (err) {
        Swal.fire('ผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
      }
    }
  }
},
async openUserLookup() {
  try {
    Swal.fire({
      title: 'กำลังโหลดรายชื่อผู้ใช้...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const res = await axios.get(`${API_BASE}/api/users`, { timeout: 20000 });
    const users = Array.isArray(res.data) ? res.data : (res.data?.users || []);

    Swal.close();

    const html = this._buildUsersTableHTML(); // โครงเปล่า (tbody ว่าง)

    await Swal.fire({
      title: 'รายชื่อผู้ใช้ทั้งหมด',
      html,
      width: Math.min(window.innerWidth * 0.98, 1400),// <= กว้างขึ้น (สูงสุด ~1500px หรือ 96vw)        // กว้างขึ้น
      showConfirmButton: true,
      confirmButtonText: 'ปิด',
      customClass: { popup: 'user-table-swal' },
      didOpen: () => {
        const input   = document.getElementById('user-search');
        const tbody   = document.getElementById('user-tbody');
        const countEl = document.getElementById('user-count');
        const prevBtn = document.getElementById('user-prev');
        const nextBtn = document.getElementById('user-next');
        const pageInfo= document.getElementById('user-page-info');
        const getPhone = this._getUserPhone.bind(this);

        const pageSize = 10;
        let page = 1;
        let filtered = users;

        const esc   = this._escapeHtml.bind(this);
        const getId = this._getUserId.bind(this);
        const getDisp = this._getDisplayName.bind(this);
const getSearchNames = this._getSearchNames.bind(this);
        const getAv = this._getUserAvatar.bind(this);

       const rowHTML = (u) => {
  const id = String(getId(u) || '-');                 // ใช้เพื่อค้นหาเท่านั้น
  const displayName = String(getDisp(u) || '-');      // name ที่แสดง
  const searchNames = String(getSearchNames(u) || '');// ไทย/อังกฤษ สำหรับค้นหา
  const email = String(u.email || '-');
  const phone = String(getPhone(u) || '-');
  const role = String(u.role || '-');
  const img = getAv(u) || '';

  const dataText = esc([id, searchNames, email, phone, role].join(' '));

  const fallbackSvg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
      <rect width='100%' height='100%' fill='#e5e7eb'/>
      <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='#374151'>U</text>
    </svg>`
  );
  const fallbackUri = `data:image/svg+xml;utf8,${fallbackSvg}`;

  return `
    <tr data-text="${dataText}">
      <td class="col-img">
        <img src="${img || fallbackUri}" alt="" loading="lazy"
             onerror="this.onerror=null;this.src='${fallbackUri}'" />
      </td>
      <!-- ลบคอลัมน์ user_id ออก -->
      <td>${esc(displayName)}</td>
      <td>${esc(email)}</td>
      <td>${esc(phone)}</td>
      <td>${esc(role)}</td>
    </tr>
  `;
};


        const updateCount = () => {
          countEl.textContent = `ทั้งหมด ${filtered.length} รายการ`;
        };

        const render = () => {
          const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
          if (page > totalPages) page = totalPages;
          const start = (page - 1) * pageSize;
          const pageItems = filtered.slice(start, start + pageSize);
          tbody.innerHTML = pageItems.map(rowHTML).join('');
          pageInfo.textContent = `${page}/${totalPages}`;
          prevBtn.disabled = page <= 1;
          nextBtn.disabled = page >= totalPages;
          updateCount();
        };

        const doFilter = (term) => {
  const q = (term || '').trim().toLowerCase();
  filtered = users.filter(u => {
    const id = String(getId(u) || '');
    const allNames = String(getSearchNames(u) || '');
    const email = String(u.email || '');
    const phone = String(getPhone(u) || '');       // << NEW
    const role = String(u.role || '');
    return (id + ' ' + allNames + ' ' + email + ' ' + phone + ' ' + role)
            .toLowerCase()
            .includes(q);
  });
  page = 1;
  render();
};


        input.addEventListener('input', (e) => doFilter(e.target.value));
        prevBtn.addEventListener('click', () => { if (page > 1) { page--; render(); } });
        nextBtn.addEventListener('click', () => { page++; render(); });

        render();
      }
    });
  } catch (err) {
    try { Swal.close(); } catch {}
    Swal.fire('โหลดข้อมูลไม่สำเร็จ', err?.response?.data?.message || 'ไม่สามารถดึงรายชื่อผู้ใช้ได้', 'error');
  }
},
  }
};
</script>


<style scoped>

.add-btn {
  width: 60px;
  height: 60px;
  font-size: 24px;
  background-color: #1e3a8a;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.Member-name {
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
  margin-right: 1rem;
}
.Member-position {
  font-size: 1rem;
  margin-right: 1rem;
}
.edit-btn {
  background-color: #ff2424;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.content h2 {
  text-align: center;
  font-size: 1.8rem;
  color: #1e3a8a;
}
.add-btn {
  float: right;
  margin-bottom: 1rem;
}
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 0.5rem;
}
.filter-group {
  display: flex;
  gap: 0.5rem;
}
.filter-btn {
  padding: 0.4rem 1rem;
  border: none;
  background: #e2e8f0;
  color: #1e3a8a;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.filter-btn.active,
.filter-btn:hover {
  background: #1e3a8a;
  color: white;
}
.member-table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
}
.member-table {
  width: 100%;
  border-collapse: collapse;
  background: #f7f7fa;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
/* ใหม่ */
.member-table th, .member-table td {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}
.member-table th {
  background: #1e3a8a;
  color: #fff;
  font-weight: 600;
  text-align: center;       /* <- จัดหัวตารางให้อยู่ตรงกลาง */
  vertical-align: middle;
}
.member-table td {
  text-align: left;         /* เนื้อหายังคงชิดซ้ายเหมือนเดิม */
}
/* จัดกึ่งกลางคอลัมน์ Admin/Staff และ Actions */
.member-table td:nth-child(3),
.member-table td:nth-child(4) {
  text-align: center;
}

/* ขยับคอลัมน์ Name และ Email ไปทางขวาเพิ่มขึ้น */
.member-table td:nth-child(1),
.member-table td:nth-child(2) {
  padding-left: 2rem;   /* ปรับเป็น 1.5rem/2.5rem ได้ตามชอบ */
}

/* เผื่อปุ่ม Edit อยู่กลางเซลล์สวย ๆ */
.member-table td:nth-child(4) .edit-btn,
.member-table td:nth-child(4) span {
  display: inline-block;
}

.member-table tr:last-child td {
  border-bottom: none;
}
@media (max-width: 600px) {
  .content {
    padding: 0.8rem 0.3rem 0.5rem 0.3rem;
    width: 100vw;
  }
  .title-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
    margin-bottom: 0.7rem;
    padding-left: 0.1rem;
  }
  .content h2 {
    text-align: left;
    font-size: 1.1rem;
    margin-bottom: 0.1rem;
    color: #174178;
    font-weight: 700;
  }
  .top-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
  }
  .filter-group {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.3rem;
    justify-content: flex-start;
  }
  .filter-btn {
    padding: 0.25rem 0.7rem;
    font-size: 0.98em;
    border-radius: 8px;
  }
  .add-btn {
    width: 44px;
    height: 44px;
    font-size: 1.7em;
    margin: 0;
    border-radius: 50%;
    align-self: flex-end;
    box-shadow: 0 2px 10px #0001;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .member-table-container {
    width: 100vw !important;
    overflow-x: auto !important;
    padding: 0 0.1rem;
    margin-bottom: 1rem;
  }
  .member-table {
    min-width: 520px;
    width: max-content;
    font-size: 0.98em;
  }
}

.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 1100;
}
.sidebar {
  z-index: 1200;
}

.notification-backdrop{
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: transparent;
  z-index: 1001;
}
.notification-dropdown { position: absolute; right: 0; top: 38px; background: #fff; border-radius: 18px 0 18px 18px; box-shadow: 0 8px 24px 0 rgba(27, 50, 98, 0.14), 0 2px 4px 0 rgba(33, 125, 215, 0.06); min-width: 330px; max-width: 370px; max-height: 420px; overflow-y: auto; z-index: 1002; padding: 0; border: none; animation: fadeDown 0.22s; }

/* ===== Step Page Style ===== */
.step-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.role-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.role-section h2 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1e3a8a;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-group label {
  font-size: 1rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
}

.save-wrap {
  text-align: center;
  margin-top: 10px;
}

.save-btn {
  padding: 10px 28px;
  font-size: 1.05rem;
  background: #1e3a8a;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.save-btn:hover {
  background: #274cb0;
}

</style>


<style>
@import '../css/style.css';

/* ---- SweetAlert layout for Management forms ---- */
.swal2-popup.member-swal { padding: 26px 28px 22px; }

.member-swal .form-grid{
  display: grid;
  grid-template-columns: 1fr 180px; /* ซ้ายกว้าง ขวาแคบ */
  gap: 12px 16px;
  align-items: center;
}

.member-swal .col-left  { grid-column: 1 / 2; }
.member-swal .col-right { grid-column: 2 / 3; }
.member-swal .col-span-2{ grid-column: 1 / -1; }

.member-swal .swal2-input{
  width: 100%;
  margin: 0;
  height: 44px;
  box-sizing: border-box;
}
.member-swal select.swal2-input{
  height: 44px;
  padding-right: 28px;
}

.member-swal .file{
  display: flex;
  align-items: center;
  gap: 10px;
}
.member-swal .file-btn{
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: #1e3a8a;
  color: #fff;
  cursor: pointer;
}
.member-swal .file-name{
  font-size: 0.95rem;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member-swal .hint{
  color: #6b7280;
  margin-top: -4px;
}

@media (max-width: 520px){
  .member-swal .form-grid{ grid-template-columns: 1fr; }
  .member-swal .col-left,
  .member-swal .col-right,
  .member-swal .col-span-2{ grid-column: 1 / -1; }
}
/* ขยายช่องชื่อ + จัดกึ่งกลางส่วนไฟล์ */
.member-swal #thaiName{
  /* ช่องชื่อกว้างเต็ม 2 คอลัมน์แล้ว เพราะใช้ col-span-2 */
  height: 44px;
}

/* จัดกึ่งกลางบรรทัดไฟล์และข้อความ hint */
.member-swal .file{
  display: flex;
  align-items: center;
  justify-content: center;   /* <- ให้ปุ่ม + ชื่อไฟล์อยู่กลาง */
  gap: 10px;
}

.member-swal .hint{
  text-align: center;        /* <- ให้ข้อความ “แนบไฟล์...” อยู่กลาง */
  display: block;
}

/* จำกัดความกว้างคอมโพเนนต์พวกนี้ให้ดูบาลานซ์ และอยู่กลางกริด */
.member-swal #thaiName,
.member-swal .file,
.member-swal .hint{
  max-width: 400px;          /* ปรับได้ 520–640 ตามชอบ */
  width: 100%;
  justify-self: center;      /* center ภายใน grid */
}

@media (max-width: 520px){
  .member-swal #thaiName,
  .member-swal .file,
  .member-swal .hint{
    max-width: 100%;
  }
}
.member-swal .file-link{
  font-size: 0.92rem;
  text-decoration: underline;
  color: #1e3a8a;
}
/* ===== Users Lookup Modal (SweetAlert) ===== */
.user-table-swal { padding: 20px 20px 18px; }

.user-lookup .lookup-bar{
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.user-lookup .lookup-bar input{
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
}
.user-lookup .lookup-bar .count{
  font-size: 0.95rem;
  color: #6b7280;
  white-space: nowrap;
}

.user-lookup .lookup-wrap{
  max-height: 60vh;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.user-lookup .lookup-table{
  width: 100%;
  border-collapse: collapse;
  font-size: 0.96rem;
}
.user-lookup .lookup-table thead th{
  position: sticky;
  top: 0;
  background: #1e3a8a;
  color: #fff;
  text-align: center !important;
  padding: 10px 12px;
  z-index: 1;
}
.user-lookup .lookup-table tbody td{
  border-bottom: 1px solid #f1f5f9;
  padding: 10px 12px;
  vertical-align: middle;
}
.user-lookup .lookup-table tbody tr:hover{
  background: #f8fafc;
}

.user-lookup .col-img{
  width: 64px;
}
.user-lookup .col-img img{
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
/* โมดัลกว้างขึ้น + พื้นที่สูงขึ้น */
.user-table-swal { padding: 24px 24px 20px; }
.user-lookup .lookup-wrap{
  max-height: 72vh;         /* สูงขึ้น */
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
}

/* แถว/หัวตารางใหญ่ขึ้นอ่านง่าย */
.user-lookup .lookup-table thead th{
  position: sticky;
  top: 0;
  background: #1e3a8a;
  color: #fff;
  text-align: left;
  padding: 12px 14px;
  font-weight: 600;
  z-index: 1;
}
.user-lookup .lookup-table tbody td{
  border-bottom: 1px solid #f1f5f9;
  padding: 12px 14px;
  vertical-align: middle;
}

/* รูปใหญ่ขึ้น */
.user-lookup .col-img{ width: 72px; }
.user-lookup .col-img img{
  width: 48px;              /* เดิม 40px -> 48px */
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  /* กัน alt text โผล่เวลาโหลดรูปไม่สำเร็จ */
  font-size: 0;
  color: transparent;
}

/* แถบค้นหา */
.user-lookup .lookup-bar input{
  flex: 1;
  height: 44px;             /* สูงขึ้น */
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
}

/* ปุ่มเปลี่ยนหน้า */
.user-lookup .lookup-pagination{
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}
.user-lookup .page-btn{
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #e2e8f0;
  cursor: pointer;
}
.user-lookup .page-btn:disabled{
  opacity: 0.5;
  cursor: default;
}
.user-lookup .page-info{
  min-width: 72px;
  text-align: center;
  font-weight: 600;
}
/* ให้ตัว popup กว้างสุดได้ถึง 1500px หรือ 96vw */
.swal2-popup.user-table-swal{
  max-width: min(1400px, 98vw) !important; /* เดิม min(1000px, 96vw) */
}

/* เพิ่มความสูงพื้นที่เลื่อนของตาราง */
.user-lookup .lookup-wrap{
  max-height: 82vh; /* เดิม 72vh -> สูงขึ้น */
}

/* เผื่อบางธีมเว้น margin ในคอนเทนต์ของ Swal มากเกินไป */
.swal2-html-container{
  margin: 0 !important;
}
/* ===== Compact rows for Users Lookup ===== */

/* หัวตารางให้เตี้ยลง */
.user-lookup .lookup-table thead th{
  padding: 8px 10px !important;  /* เดิม 12px 14px */
}

/* แถวข้อมูลให้เตี้ยลง */
.user-lookup .lookup-table tbody td{
  padding: 6px 10px !important;  /* เดิม 12px 14px */
  line-height: 1.15;             /* บีบระยะบรรทัด */
}

/* ลดขนาดรูปให้พอดีแถวเตี้ยลง */
.user-lookup .col-img{ width: 56px; }       /* เดิม 72px */
.user-lookup .col-img img{
  width: 36px;                               /* เดิม 48px */
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

/* กันข้อความยาวทำให้แถวสูงขึ้น */
.user-lookup .lookup-table{
  table-layout: fixed;            /* สำคัญมาก */
  width: 100%;
}
.user-lookup .lookup-table td:nth-child(3),
.user-lookup .lookup-table td:nth-child(4){
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;                    /* ตัดด้วย … */
}
/* ==== Center everything in Users Lookup table ==== */
.user-lookup .lookup-table th,
.user-lookup .lookup-table td {
  text-align: center !important;
  vertical-align: middle;
}

/* รูปให้กึ่งกลางจริง ๆ (เพราะเป็น block) */
.user-lookup .col-img img{
  margin: 0 auto;
}

/* คงการบีบความสูงแถว/ตัดข้อความตามที่ทำไว้ */
.user-lookup .lookup-table {
  table-layout: fixed;
  width: 100%;
}
.user-lookup .lookup-table td:nth-child(3),
.user-lookup .lookup-table td:nth-child(4),
.user-lookup .lookup-table td:nth-child(5) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>