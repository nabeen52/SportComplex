<template>
  <div class="layout" :class="{ 'sidebar-closed': isSidebarClosed }">
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link v-for="nav in navs" :key="nav.to" :to="nav.to" :exact-active-class="nav.exact ? 'active' : ''"
          active-class="active">
          <i :class="nav.icon"></i> {{ nav.label }}
        </router-link>
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
        :class="['notification-item', noti.type || '', { unread: noti.timestamp > lastSeenTimestamp }]"
      >
        {{ noti.message }}
      </li>
      <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
    </ul>
  </div>
</div>
          <router-link v-for="top in topbar" :key="top.to" :to="top.to"><i :class="top.icon"></i></router-link>
        </div>

      </header>
      <main class="content">
        <div class="title-row">
          <h2 style="color: #1e3a8a;">Edit Field</h2>
          <button class="add-field-btn" @click="addField"><i class="pi pi-plus"></i> Add Field</button>
        </div>
        <div class="field-container">
          <div v-for="(field, fIndex) in fields" :key="'field-' + fIndex" class="field-item"
            :class="{ 'zones-expanded': field.hasZone && field.showZones }">
            <div class="field-card">
              <div class="field-image-wrapper"><img class="field-image" :src="field.image" alt="field" /></div>
              <div class="field-content">
                <div class="field-main-info">
                  <h3 class="field-name">{{ field.name }}</h3>
                  <div class="field-controls">
                    <label class="toggle-switch">
                      <input type="checkbox" :checked="field.visible" @click.prevent="confirmToggle(fIndex)" />
                      <span class="toggle-slider"></span>
                    </label>
                    <button class="edit-field-btn" @click="editField(fIndex)">แก้ไข</button>
                  </div>
                </div>
                <template v-if="field.hasZone">
                  <div class="zone-section">
                    <div class="zone-header">
                      <span class="zone-count">จำนวนโซน: {{ field.zones.length }}</span>
                      <div class="zone-actions">
                        <button class="toggle-zones-btn" @click="toggleZone(fIndex)">{{ field.showZones ? 'ซ่อนโซน' :
                          'ดูโซนทั้งหมด' }}</button>
                        <button class="add-zone-btn" @click="addZone(fIndex)"><i class="pi pi-plus"></i></button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <div v-if="field.hasZone && field.showZones" class="zones-dropdown">
              <div class="zones-list">
                <div v-for="(zone, zIndex) in field.zones" :key="'zone-' + fIndex + '-' + zIndex" class="zone-item">
                  <div class="zone-number">{{ zIndex + 1 }}.</div>
                  <div class="zone-image-wrapper">
                    <img class="zone-image" :src="zone.image || field.image" alt="zone" />
                  </div>
                  <div class="zone-info">
                    <span class="zone-name">{{ zone.name }}</span>
                    <span class="zone-status">สถานะ: {{ zone.status }}</span>
                  </div>
                  <div class="zone-controls">
                    <label class="toggle-switch zone-toggle">
                      <input type="checkbox" :checked="zone.active" @click.prevent="toggleZoneStatus(fIndex, zIndex)" />
                      <span class="toggle-slider"></span>
                    </label>
                    <button class="edit-zone-btn" @click="editZone(fIndex, zIndex)">แก้ไข</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
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
<script>
import Swal from 'sweetalert2'
import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'


export default {
  name: 'FieldLayout',
  data() {
    return {
      
      isSidebarClosed: false,
      navs: [
        { to: "/dashboard", label: "แดชบอร์ด", icon: "pi pi-chart-pie", exact: true },
        { to: "/home_admin", label: "แก้ไขข่าว", icon: "pi pi-megaphone", exact: true },
        { to: "/edit_field", label: "แก้ไขสนาม", icon: "pi pi-map-marker" },
        { to: "/edit_equipment", label: "แก้ไขอุปกรณ์", icon: "pi pi-clipboard" },
        { to: "/booking_field_admin", label: "จองสนาม", icon: "pi pi-map-marker" },
        { to: "/approve_field", label: "อนุมัติ", icon: "pi pi-verified" },
        { to: "/return_admin", label: "รับคืนอุปกรณ์", icon: "pi pi-box" },
        { to: "/members", label: "พนักงาน/ผู้ดูแล", icon: "pi pi-user-edit" },
        { to: "/history_admin", label: "ระบบประวัติการทำรายการ", icon: "pi pi-history" }
      ],
      topbar: [
        { to: "/profile_admin", icon: "pi pi-user" }
      ],
      fields: [],
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
      isMobile: false,
      lastSeenTimestamp: 0, 
    }
  },
  async mounted() {
  this.checkMobile();
  window.addEventListener('resize', this.checkMobile);

  // โหลด last seen
  this.lastSeenTimestamp = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0');

  await this.loadFields();

  await this.fetchNotifications();
  this.polling = setInterval(this.fetchNotifications, 30000);

  document.addEventListener('mousedown', this.handleClickOutside);
},

  beforeUnmount() {
    clearInterval(this.polling);
    document.removeEventListener('mousedown', this.handleClickOutside);
    window.removeEventListener('resize', this.checkMobile)
  },
  methods: {
    toggleSidebar() { this.isSidebarClosed = !this.isSidebarClosed },
checkMobile() {
    this.isMobile = window.innerWidth <= 600
    if (!this.isMobile && !this.isSidebarClosed) {
      // ปิด overlay ถ้าออกจาก mobile
      this.isSidebarClosed = false
    }
  },
  toggleSidebar() {
    this.isSidebarClosed = !this.isSidebarClosed
  },
    // ===== Notification logic =====

    pruneOldNotifications() {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // เก็บ 7 วัน
      this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
    },


    toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    this.lastSeenTimestamp = Date.now();
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(this.lastSeenTimestamp));
    this.unreadCount = 0; // เคลียร์ badge เมื่อเปิด
  }
},
    closeNotifications() { this.showNotifications = false; },
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

      // รวม-ลบซ้ำตาม id แล้วเรียงใหม่ล่าสุดก่อน
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      this.pruneOldNotifications();
    }

    // badge = จำนวน noti ที่ timestamp > lastSeenTimestamp
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch {}
},

    // ===== Field & Zone logic =====
    getImageUrl(img) {
      if (!img) return '/img/default.png'
      if (img.startsWith('data:image/')) return img
      if (img.startsWith('/img/')) return img
      return `/img/${img}`
    },

    async confirmToggle(fIndex) {
      const field = this.fields[fIndex];
      const newStatus = !field.visible;
      const text = newStatus ? 'เปิดใช้งานสนามนี้?' : 'ปิดใช้งานสนามนี้?';
      const confirmButtonText = newStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน';

      const result = await Swal.fire({
        title: text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText: 'ยกเลิก',
        customClass: {
          popup: 'custom-swal-popup',
          confirmButton: 'custom-confirm-btn',
          cancelButton: 'custom-cancel-btn'
        }
      });

      if (result.isConfirmed) {
        try {
          await axios.patch(`${API_BASE}/api/fields/${field._id}`, { visible: newStatus });
          this.fields[fIndex].visible = newStatus;
          Swal.fire({
            title: 'สำเร็จ!',
            text: newStatus ? 'เปิดใช้งานสนามแล้ว' : 'ปิดใช้งานสนามแล้ว',
            icon: 'success',
            timer: 1200,
            showConfirmButton: false,
            customClass: { popup: 'custom-swal-popup' }
          });
        } catch (e) {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: e.response?.data?.message || e.message
          });
        }
      }
    },

    async loadFields() {
      try {
        const res = await axios.get(`${API_BASE}/api/fields`);
        this.fields = (res.data || []).map(f => ({
          ...f,
          visible: f.visible !== undefined ? f.visible : true,
          hasZone: f.hasZone !== undefined ? f.hasZone : false,
          zones: (f.zones || []).map(z => ({
            ...z,
            image: this.getImageUrl(z.image),
            active: z.active !== undefined ? z.active : true,
          })),
          image: this.getImageUrl(f.image),
          showZones: false,
        }));
        console.log('Loaded fields:', this.fields);
      } catch (err) {
        console.error('Error loading fields:', err);
        this.fields = [];
      }
    },

    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },

    fieldFormHtml({ name = '', visible = true, hasZone = false } = {}, isEdit = false) {
      return `
        <div class="swal-form">
          <div class="form-group"><label class="form-label">ชื่อสนาม : </label>
            <input type="text" id="name" class="swal2-input modern-input" value="${name || ''}" placeholder="กรอกชื่อสนาม"></div>
          <div class="form-group">
            <label class="form-label">เลือกรูปภาพ :</label>
            <input type="file" id="image" class="swal2-file modern-file" accept="image/*">
            <label class="form-label">${isEdit ? '*เลือกรูปภาพใหม่(ถ้าต้องการเปลี่ยน)' : ''}</label>
            <div class="file-info">*อัตราส่วนภาพควรเป็น 5:3</div>
          </div>
          <div class="form-group"><label class="form-label">สถานะ :</label>
            <select id="visible" class="swal2-select modern-select">
              <option value="true" ${visible ? 'selected' : ''}>เปิดใช้งาน</option>
              <option value="false" ${!visible ? 'selected' : ''}>ปิดใช้งาน</option>
            </select>
          </div>
           <br><div class="radio-group">
          <div class="form-group"><label class="form-label">โซน :</label>
              <label class="radio-label">
                <input type="radio" name="hasZone" value="false" ${!hasZone ? 'checked' : ''}><span class="radio-custom"></span>ไม่มีโซน
              </label>
              <label class="radio-label">
                <input type="radio" name="hasZone" value="true" ${hasZone ? 'checked' : ''}><span class="radio-custom"></span>มีโซน
              </label>
            </div>
          </div>
        </div>
      `
    },

    toggleZone(index) { this.fields[index].showZones = !this.fields[index].showZones },

    async addField() {
      const { value: form } = await Swal.fire({
        title: '<span class="swal-title">เพิ่มสนาม</span>',
        html: this.fieldFormHtml(),
        focusConfirm: false, showCancelButton: true, scrollbarPadding: false,
        confirmButtonText: '<i class="pi pi-check"></i> เพิ่มสนาม',
        cancelButtonText: '<i class="pi pi-times"></i> ยกเลิก',
        customClass: { popup: 'custom-swal-popup modern-popup', confirmButton: 'custom-confirm-btn', cancelButton: 'custom-cancel-btn' },
        preConfirm: async () => {
          const name = document.getElementById('name').value.trim();
          const file = document.getElementById('image').files[0];
          const visible = document.getElementById('visible').value === 'true';
          const hasZone = document.querySelector('input[name="hasZone"]:checked').value === 'true';
          if (!name) { Swal.showValidationMessage('กรุณากรอกชื่อสถานที่'); return false; }
          if (!file) { Swal.showValidationMessage('กรุณาเลือกรูปภาพ'); return false; }
          Swal.showLoading();
          const base64 = await this.fileToBase64(file);
          return { name, image: base64, visible, hasZone, zones: [] };
        }
      });
      if (form) {
        try {
          await axios.post(`${API_BASE}/api/fields`, form);
          await this.loadFields();
          Swal.fire({ title: 'สำเร็จ', text: 'เพิ่มสนามเรียบร้อยแล้ว', icon: 'success', customClass: { popup: 'custom-swal-popup' } });
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.response?.data?.message || error.message });
        }
      }
    },

    async editField(index) {
      const field = this.fields[index]
      const result = await Swal.fire({
        title: '<span class="swal-title">แก้ไขสนาม</span>',
        html: this.fieldFormHtml(field, true),
        showCancelButton: true, showDenyButton: true, scrollbarPadding: false,
        confirmButtonText: '<i class="pi pi-save"></i> บันทึก', denyButtonText: '<i class="pi pi-trash"></i> ลบ', cancelButtonText: '<i class="pi pi-times"></i> ยกเลิก',
        customClass: { popup: 'custom-swal-popup modern-popup', confirmButton: 'custom-confirm-btn', denyButton: 'custom-deny-btn', cancelButton: 'custom-cancel-btn' },
        preConfirm: async () => {
          const name = document.getElementById('name').value.trim()
          const file = document.getElementById('image').files[0]
          const visible = document.getElementById('visible').value === 'true'
          const hasZone = document.querySelector('input[name="hasZone"]:checked').value === 'true'
          if (!name) { Swal.showValidationMessage('กรุณากรอกชื่อสถานที่'); return false }
          let imageUrl = field.image
          if (file) {
            Swal.showLoading()
            imageUrl = await this.fileToBase64(file)
          }
          return { name, image: imageUrl, visible, hasZone }
        }
      })
      if (result.isConfirmed && result.value) {
        await axios.patch(`${API_BASE}/api/fields/${field._id}`, result.value)
        await this.loadFields()
        Swal.fire({ title: 'สำเร็จ', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', icon: 'success', customClass: { popup: 'custom-swal-popup' } })
      }
      if (result.isDenied) {
        const confirmDelete = await Swal.fire({
          title: 'ยืนยันการลบ', text: 'คุณแน่ใจหรือไม่ที่จะลบสนามนี้?', icon: 'warning', showCancelButton: true,
          confirmButtonText: '<i class="pi pi-check"></i> ยืนยัน', cancelButtonText: '<i class="pi pi-times"></i> ยกเลิก',
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-confirm-btn danger', cancelButton: 'custom-cancel-btn' }
        })
        if (confirmDelete.isConfirmed) {
          await axios.delete(`${API_BASE}/api/fields/${field._id}`)
          await this.loadFields()
          Swal.fire({ title: 'ลบแล้ว', text: 'ลบสนามเรียบร้อยแล้ว', icon: 'success', customClass: { popup: 'custom-swal-popup' } })
        }
      }
    },

    async addZone(fieldIndex) {
      const field = this.fields[fieldIndex]
      const { value: form } = await Swal.fire({
        title: '<span class="swal-title">เพิ่มโซน</span>',
        html: `
            <div class="swal-form">
              <div class="form-group"><label class="form-label">ชื่อโซน :</label>
                <input type="text" id="zoneName" class="swal2-input modern-input" placeholder="กรอกชื่อโซน"></div>
              <div class="form-group"><label class="form-label">เลือกรูปภาพ :</label>
                <input type="file" id="zoneImage" class="swal2-file modern-file" accept="image/*">
                <div class="file-info">*อัตราส่วนภาพควรเป็น 5:3</div>
              </div>
              <div class="form-group"><label class="form-label">สถานะ :</label>
                <select id="zoneStatus" class="swal2-select modern-select">
                  <option value="เปิด">เปิดใช้งาน</option>
                  <option value="ปิด">ปิดใช้งาน</option>
                </select>
              </div>
            </div>
          `,
        showCancelButton: true, scrollbarPadding: false,
        confirmButtonText: '<i class="pi pi-plus"></i> เพิ่มโซน',
        cancelButtonText: '<i class="pi pi-times"></i> ยกเลิก',
        customClass: { popup: 'custom-swal-popup modern-popup', confirmButton: 'custom-confirm-btn', cancelButton: 'custom-cancel-btn' },
        preConfirm: async () => {
          const zoneName = document.getElementById('zoneName').value.trim()
          const zoneStatus = document.getElementById('zoneStatus').value
          const zoneFile = document.getElementById('zoneImage').files[0]
          if (!zoneName) { Swal.showValidationMessage('กรุณากรอกชื่อโซน'); return false }
          if (!zoneFile) { Swal.showValidationMessage('กรุณาเลือกรูปภาพโซน'); return false }
          Swal.showLoading()
          const base64 = await this.fileToBase64(zoneFile)
          return { name: zoneName, status: zoneStatus, active: zoneStatus === 'เปิด', image: base64 }
        }
      })
      if (form) {
        await axios.patch(`${API_BASE}/api/fields/${field._id}`, { zones: [...field.zones, form], hasZone: true })
        await this.loadFields()
        Swal.fire({ title: 'สำเร็จ', text: 'เพิ่มโซนเรียบร้อยแล้ว', icon: 'success', customClass: { popup: 'custom-swal-popup' } })
      }
    },

    async editZone(fIndex, zIndex) {
      const field = this.fields[fIndex]
      const zone = field.zones[zIndex]
      const result = await Swal.fire({
        title: '<span class="swal-title">แก้ไขโซน</span>',
        html: `
            <div class="swal-form">
              <div class="form-group"><label class="form-label">ชื่อโซน :</label>
                <input type="text" id="zoneName" class="swal2-input modern-input" value="${zone.name}">
              </div>
              <div class="form-group"><div class="form-group"><label class="form-label">เลือกรูปภาพ :</label>
                <input type="file" id="zoneImage" class="swal2-file modern-file" accept="image/*">
                <div class="file-info">*เลือกรูปภาพใหม่(ถ้าต้องการเปลี่ยน)</div>
                <div class="file-info">*อัตราส่วนภาพควรเป็น 5:3</div>
              </div>
              <div class="form-group"><label class="form-label">สถานะ :</label>
                <select id="zoneStatus" class="swal2-select modern-select">
                  <option value="เปิด" ${zone.status === 'เปิด' ? 'selected' : ''}>เปิดใช้งาน</option>
                  <option value="ปิด" ${zone.status === 'ปิด' ? 'selected' : ''}>ปิดใช้งาน</option>
                </select>
              </div>
            </div>
          `,
        showCancelButton: true, showDenyButton: true, scrollbarPadding: false,
        confirmButtonText: '<i class="pi pi-save"></i> บันทึก', denyButtonText: '<i class="pi pi-trash"></i> ลบ', cancelButtonText: '<i class="pi pi-times"></i> ยกเลิก',
        customClass: { popup: 'custom-swal-popup modern-popup', confirmButton: 'custom-confirm-btn', denyButton: 'custom-deny-btn', cancelButton: 'custom-cancel-btn' },
        preConfirm: async () => {
          const zoneName = document.getElementById('zoneName').value.trim()
          const zoneStatus = document.getElementById('zoneStatus').value
          const zoneFile = document.getElementById('zoneImage').files[0]
          if (!zoneName) { Swal.showValidationMessage('กรุณากรอกชื่อโซน'); return false }
          let imageUrl = zone.image
          if (zoneFile) {
            Swal.showLoading()
            imageUrl = await this.fileToBase64(zoneFile)
          }
          return { name: zoneName, status: zoneStatus, active: zoneStatus === 'เปิด', image: imageUrl }
        }
      })
      if (result.isConfirmed && result.value) {
        const zones = [...field.zones]
        zones[zIndex] = result.value
        await axios.patch(`${API_BASE}/api/fields/${field._id}`, { zones })
        await this.loadFields()
        Swal.fire({ title: 'สำเร็จ', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', icon: 'success', customClass: { popup: 'custom-swal-popup' } })
      }
      if (result.isDenied) {
        const confirmDelete = await Swal.fire({
          title: 'ยืนยันการลบ', text: 'คุณแน่ใจหรือไม่ที่จะลบโซนนี้?', icon: 'warning', showCancelButton: true,
          confirmButtonText: '<i class="pi pi-check"></i> ยืนยัน', cancelButtonText: '<i class="pi pi-times"></i> ยกเลิก',
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-confirm-btn danger', cancelButton: 'custom-cancel-btn' }
        })
        if (confirmDelete.isConfirmed) {
          const zones = field.zones.filter((z, i) => i !== zIndex)
          await axios.patch(`${API_BASE}/api/fields/${field._id}`, { zones })
          await this.loadFields()
          Swal.fire({ title: 'ลบแล้ว', text: 'ลบโซนเรียบร้อยแล้ว', icon: 'success', customClass: { popup: 'custom-swal-popup' } })
        }
      }
    },

    async toggleZoneStatus(fieldIndex, zoneIndex) {
      const field = this.fields[fieldIndex]
      const zones = [...field.zones]
      const current = zones[zoneIndex].active
      const result = await Swal.fire({
        title: current ? 'ต้องการปิดใช้งานโซนนี้ใช่ไหม?' : 'ต้องการเปิดใช้งานโซนนี้ใช่ไหม?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        customClass: {
          popup: 'custom-swal-popup',
          confirmButton: 'custom-confirm-btn',
          cancelButton: 'custom-cancel-btn'
        }
      })
      if (result.isConfirmed) {
        zones[zoneIndex].active = !current
        zones[zoneIndex].status = zones[zoneIndex].active ? 'เปิด' : 'ปิด'
        await axios.patch(`${API_BASE}/api/fields/${field._id}`, { zones })
        await this.loadFields()
      }
    }
  }
}
</script>



<style scoped>
/* ----- Main layout/field list styles (เหมือนเดิม) ----- */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.content h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.add-field-btn {
  background: linear-gradient(135deg, #059669 0, #10b981 100%);
  color: #fff;
  border: none;
  padding: .75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: .5rem;
  transition: .2s;
  box-shadow: 0 2px 4px rgba(5, 150, 105, .3);
}

.add-field-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, .4);
}

.field-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field-item {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .06);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: .3s;
}

.field-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, .12);
  transform: translateY(-2px);
}

.field-card {
  display: flex;
  padding: 1.5rem;
  gap: 1.5rem;
  align-items: flex-start;
}

.field-image-wrapper {
  flex-shrink: 0;
  width: 200px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .1);
  background: #fff;
}

.field-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .3s;
  background: #fff;
}

.field-image:hover {
  transform: scale(1.05);
}

.field-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-main-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.field-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.field-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #cbd5e1;
  transition: .3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .2);
}

input:checked+.toggle-slider {
  background: #10b981;
}

input:checked+.toggle-slider:before {
  transform: translateX(26px);
}

.edit-field-btn {
  background: linear-gradient(135deg, #3b82f6 0, #1d4ed8 100%);
  color: #fff;
  border: none;
  padding: .5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: .2s;
  font-size: .875rem;
}

.edit-field-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, .3);
}

.zone-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zone-count {
  font-weight: 500;
  color: #64748b;
  font-size: .875rem;
}

.zone-actions {
  display: flex;
  align-items: center;
  gap: .75rem;
}

.toggle-zones-btn {
  background: linear-gradient(135deg, #8b5cf6 0, #7c3aed 100%);
  color: #fff;
  border: none;
  padding: .5rem .875rem;
  border-radius: 6px;
  font-size: .875rem;
  font-weight: 500;
  cursor: pointer;
  transition: .2s;
}

.toggle-zones-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(139, 92, 246, .3);
}

.add-zone-btn {
  background: linear-gradient(135deg, #f59e0b 0, #d97706 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;               /* เพิ่ม */
  align-items: center;          /* เพิ่ม */
  justify-content: center;      /* เพิ่ม */
  width: 38px;                  /* ปรับให้เป็นสี่เหลี่ยมจัตุรัส */
  height: 38px;
  padding: 0;                   /* reset */
  transition: .2s;
  font-size: 1.4rem;            /* ให้ + ใหญ่ขึ้น */
  box-sizing: border-box;
}
.add-zone-btn i {
  margin: 0 !important;         /* ลบ margin ออกถ้ามี */
  font-size: 1.35em;            /* เพิ่มขนาดถ้าต้องการ */
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-zone-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 158, 11, .3);
}

.zones-dropdown {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  padding: 1.5rem;
  animation: slideDown .3s;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.zones-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.zone-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .06);
  border: 1px solid #e2e8f0;
  transition: .2s;
}

.zone-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, .1);
  transform: translateY(-1px);
}

.zone-number {
  font-weight: 600;
  color: #64748b;
  min-width: 24px;
}

.zone-image-wrapper {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background: #fff;
}

.zone-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #fff;
}

.zone-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: .25rem;
}

.zone-name {
  font-weight: 500;
  color: #1e293b;
}

.zone-status {
  font-size: .875rem;
  color: #64748b;
}

.zone-controls {
  display: flex;
  align-items: center;
  gap: .75rem;
}

.zone-toggle {
  transform: scale(.8);
}

.edit-zone-btn {
  background: linear-gradient(135deg, #06b6d4 0, #0891b2 100%);
  color: #fff;
  border: none;
  padding: .375rem .75rem;
  border-radius: 4px;
  font-size: .75rem;
  font-weight: 500;
  cursor: pointer;
  transition: .2s;
}

.edit-zone-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(6, 182, 212, .3);
}

/* ----- SweetAlert2 Form & Popup ----- */
.custom-swal-popup {
  border-radius: 16px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, .25) !important;
}

.modern-popup {
  max-width: 430px !important;
  width: 96vw !important;
}

.swal-title {
  color: #1e293b !important;
  font-weight: 700 !important;
  font-size: 2rem !important;
  margin-bottom: .6em !important;
  text-align: center !important;
  letter-spacing: 0;
}

/* grid label+input Swal */
.swal-form {
  display: grid !important;
  grid-template-columns: 140px 1fr !important;/* ปรับ label ให้กว้างขึ้น */
  row-gap: 18px !important;
  column-gap: 18px !important;
  align-items: center !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.swal-form .radio-group {
  margin-top: 18px !important;
}

.form-group {
  display: contents !important;
}

.form-label {
  grid-column: 1 !important;
  text-align: right !important;
  font-weight: 500 !important;
  color: #374151 !important;
  font-size: 1.04rem !important;
  padding-right: 12px !important;
  margin-bottom: 0 !important;
  min-width: 0;
  white-space: nowrap !important;
}

.swal2-input,
.swal2-select,
.modern-input,
.modern-select,
.swal2-file,
.modern-file {
  grid-column: 2 !important;
  width: 100% !important;
  min-width: 0;
  margin-bottom: 0 !important;
  box-sizing: border-box !important;
}

.modern-input,
.modern-select {
  padding: .85rem !important;
  border: 2px solid #e5e7eb !important;
  border-radius: 5px !important;
  font-size: 1.02rem !important;
  background: #fff !important;
}

.modern-input:focus,
.modern-select:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, .10) !important;
  outline: none !important;
}

.swal2-file,
.modern-file {
  padding: .7rem !important;
  border: 2px dashed #d1d5db !important;
  border-radius: 8px !important;
  background: #f9fafb !important;
  cursor: pointer !important;
  transition: .2s !important;
}

.modern-file:hover {
  border-color: #9ca3af !important;
  background: #f3f4f6 !important;
}

.file-info {
  grid-column: 2 !important;
  font-size: .84rem !important;
  color: #6b7280 !important;
  margin-top: .1rem !important;
  font-style: italic !important;
  padding-left: 2px !important;
}

/* radio */
.radio-group {
  grid-column: 2 !important;
  display: flex !important;
  gap: 22px !important;
  align-items: center !important;
  
}

.radio-label {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  cursor: pointer !important;
  font-size: 1rem !important;
  color: #374151 !important;
}

.radio-label input[type="radio"] {
  display: none !important;
}

.radio-custom {
  width: 18px !important;
  height: 18px !important;
  border: 2px solid #d1d5db !important;
  border-radius: 50% !important;
  position: relative !important;
  transition: .2s !important;
  margin-right: 2px !important;
}

.radio-label input[type="radio"]:checked+.radio-custom {
  border-color: #3b82f6 !important;
  background: #3b82f6 !important;
}

.radio-label input[type="radio"]:checked+.radio-custom::after {
  content: '' !important;
  position: absolute !important;
  top: 2px !important;
  left: 2px !important;
  width: 10px !important;
  height: 10px !important;
  border-radius: 50% !important;
  background: #fff !important;
}

/* เว้นระยะด้านล่างแต่ละบรรทัด */
.swal-form>.form-group:not(:last-child) {
  margin-bottom: 0 !important;
}

/* SweetAlert2 ปุ่ม */
.custom-confirm-btn {
  background: linear-gradient(135deg, #6366f1 0, #818cf8 100%) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  padding: .8rem 1.6rem !important;
  font-size: 1.08rem !important;
  margin-right: 8px !important;
  transition: .2s !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.custom-confirm-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, .25) !important;
}

.custom-confirm-btn.danger,
.custom-deny-btn {
  background: linear-gradient(135deg, #ef4444 0, #dc2626 100%) !important;
}

.custom-deny-btn {
  color: #fff !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  padding: .8rem 1.6rem !important;
  font-size: 1.08rem !important;
  margin-right: 8px !important;
  transition: .2s !important;
}

.custom-deny-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, .25) !important;
}

.custom-cancel-btn {
  background: linear-gradient(135deg, #6b7280 0, #4b5563 100%) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  padding: .8rem 1.6rem !important;
  font-size: 1.08rem !important;
  transition: .2s !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.custom-cancel-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(75, 85, 99, .25) !important;
}

.swal2-popup {
  max-width: 96vw !important;
  width: auto !important;
  overflow-x: hidden !important;
  box-sizing: border-box !important;
  padding-bottom: 20px !important;
}

.swal2-html-container {
  max-width: 100% !important;
  overflow-x: hidden !important;
  box-sizing: border-box !important;
}
@media (max-width: 600px) {
   .title-row {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    /* ไม่ต้องมี overflow-x: auto */
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e2e8f0;
  }
  .add-field-btn {
    flex-shrink: 0;   /* ปุ่มไม่ย่อ */
    /* อาจเพิ่ม margin-left หรือปรับขนาดปุ่มเล็กลงในจอเล็ก */
    font-size: 1rem;
    padding: .6rem 1.2rem;
    min-width: 100px;
  }
  .content {
    width: 100vw !important;
    min-width: 0 !important;
    box-sizing: border-box;
    overflow-x: visible !important; /* สำคัญ ห้าม auto/hide เดี๋ยวจะไปบีบปุ่ม */
  }
  .field-container {
    flex-direction: column !important;
    gap: 1.2rem;
  }
  .field-item {
    width: 100%;
    max-width: 100vw;
    border-radius: 12px;
    overflow: visible;
  }
  .field-card {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    /* ไม่ต้อง set min-width */
  }
  .field-content {
    min-width: 400px; /* ปรับค่าตามเนื้อหาที่อาจจะล้น */
  }
}

.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.28);
  z-index: 2999;
}

.notification-backdrop{
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: transparent;
  z-index: 1001;
}

</style>

<style>
@import '../css/style.css';
</style>