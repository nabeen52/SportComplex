<template> 
  <div class="layout" :class="{ 'sidebar-closed': isSidebarClosed }">
    <!-- Sidebar -->
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
         <!-- <router-link to="/step" active-class="active"><i class="pi pi-sitemap"></i> แก้ไขขั้นตอนการอนุมัติ </router-link> -->
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> จองสนาม</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <router-link to="/agency_admin" active-class="active"><i class="pi pi-briefcase"></i> หน่วยงาน </router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล </router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
      </nav>
    </aside>

    <div v-if="isMobile && !isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>

    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <div style="position: relative; display: inline-block;">
            <div v-if="showNotifications" class="notification-backdrop" @click="closeNotifications"></div>

            <button class="notification-btn" @click="toggleNotifications">
              <i class="pi pi-bell"></i>
              <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
            </button>

            <div v-if="showNotifications" class="notification-dropdown">
              <ul>
                <li v-for="(noti, idx) in notifications.slice(0, 10)" :key="noti.id || idx"
                    :class="['notification-item', noti.type || '', { unread: noti.timestamp > lastSeenTimestamp }]">
                  {{ noti.message }}
                </li>
                <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
              </ul>
            </div>
          </div>
          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- Body -->
      <section class="content">
        <div class="content-head">
          <h2 class="page-title"> List of Department</h2>
          <div class="tools">
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="ค้นหาหน่วยงาน..."
            />
            <button class="btn primary" @click="openAddModal"><i class="pi pi-plus"></i> เพิ่มหน่วยงาน</button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="agency-table">
            <thead>
              <tr>
                <th style="width: 88px; text-align:center;">No.</th>
                <th>Department</th>
                <th style="width: 160px; text-align:center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ag, idx) in paginatedAgencies" :key="ag._id || ag.key">
               <td style="text-align:center;">{{ ag.seq }}</td>
                <td>{{ ag.agencyName || '—' }}</td>
                <td style="text-align:center;">
  <button class="btn warning sm" @click="openEditModal(ag)">
  <i class="pi pi-pencil"></i> แก้ไข
</button>
</td>

              </tr>
              <tr v-if="!loading && paginatedAgencies.length === 0">
                <td colspan="3" class="empty">ไม่พบข้อมูล</td>
              </tr>
              <tr v-if="loading">
                <td colspan="3" class="empty">กำลังโหลด...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="!loading && filteredAgencies.length">
          <div class="range">
            แสดง {{ rangeStart }}–{{ rangeEnd }} จาก {{ filteredAgencies.length }} รายชื่อ
          </div>
          <div class="pager">
            <button class="btn" :disabled="page<=1" @click="prevPage"><i class="pi pi-angle-left"></i> ก่อนหน้า</button>
            <button
              v-for="n in pageCount"
              :key="n"
              class="btn page-btn"
              :class="{ active: n===page }"
              @click="gotoPage(n)"
            >{{ n }}</button>
            <button class="btn" :disabled="page>=pageCount" @click="nextPage">ถัดไป <i class="pi pi-angle-right"></i></button>
          </div>
        </div>
      </section>

      <!-- Add Modal -->
      <div v-if="showAdd" class="modal-backdrop" @click.self="closeAddModal">
        <div class="modal">
          <h3>เพิ่มหน่วยงาน</h3>
          <div class="form-grid form-onecol">
            <label>ชื่อหน่วยงาน </label>
            <input v-model.trim="form.agencyName" type="text" placeholder="กรอกชื่อหน่วยงานที่ต้องการเพิ่ม" />
          </div>

          <div class="modal-actions">
            <button class="btn" @click="closeAddModal">ยกเลิก</button>
            <button class="btn primary" @click="saveAgency"><i class="pi pi-check"></i> บันทึก</button>
          </div>
        </div>
      </div>
<!-- Edit Modal -->
<div v-if="showEdit" class="modal-backdrop" @click.self="closeEditModal">
  <div class="modal">
    <h3>แก้ไขหน่วยงาน</h3>

    <div class="form-grid form-onecol">
      <label>ชื่อหน่วยงาน</label>
      <input v-model.trim="editForm.newName" type="text" placeholder="กรอกชื่อหน่วยงานใหม่" />
    </div>

    <div class="modal-actions" style="justify-content: space-between;">
      <button class="btn danger sm" @click="deleteFromEdit" :disabled="deleting">
  <i class="pi pi-trash"></i> ลบหน่วยงานนี้
</button>
      <div style="display:flex; gap:10px;">
        <button class="btn sm" @click="closeEditModal">ยกเลิก</button>
<button class="btn primary sm" @click="saveEdit" :disabled="saving || !canSave">
  <i class="pi pi-check"></i> บันทึก
</button>
      </div>
    </div>
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

<script>
import axios from 'axios'
import Swal from 'sweetalert2'
axios.defaults.withCredentials = true;

const API_BASE = import.meta.env.VITE_API_BASE || '';
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp';

export default {
  name: 'AgencyAdmin',
  data() {
    return {
      // layout
      isSidebarClosed: false,
      isMobile: window.innerWidth <= 600,

      // notifications
      showNotifications: false,
      notifications: [],
      lastSeenTimestamp: 0,
      unreadCount: 0,

      // table/search
      searchQuery: '',
      rawItems: [],
      loading: false,

      // pagination
      page: 1,
      pageSize: 20,

      // add modal
      showAdd: false,
      form: { agencyName: '' },

      // polling id
      polling: null,

      showEdit: false,
editForm: { id: null, oldName: '', newName: '' },
saving: false,
deleting: false,

    }
  },
  computed: {
    // normalize + dedupe
    dedupedAgencies() {
  const arr = (this.rawItems || []).filter(x => (x.agencyName || '').trim() !== '')
  arr.forEach((item, idx) => { item.seq = idx + 1 })
  return arr
}
,
canSave() {
  const n = (this.editForm.newName || '').trim()
  return n && n.toLowerCase() !== (this.editForm.oldName || '').trim().toLowerCase()
}
,

    filteredAgencies() {
      const q = this.searchQuery.trim().toLowerCase()
      if (!q) return this.dedupedAgencies
      return this.dedupedAgencies.filter(x =>
        String(x.agencyName || '').toLowerCase().includes(q)
      )
    },
    pageCount() {
      return Math.max(1, Math.ceil(this.filteredAgencies.length / this.pageSize))
    },
    paginatedAgencies() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredAgencies.slice(start, start + this.pageSize)
    },
    rangeStart() {
      if (!this.filteredAgencies.length) return 0
      return (this.page - 1) * this.pageSize + 1
    },
    rangeEnd() {
      return Math.min(this.page * this.pageSize, this.filteredAgencies.length)
    }
  },
  watch: {
    searchQuery() {
      // ค้นหาใหม่ให้กลับไปหน้า 1
      this.page = 1
    }
  },
  mounted() {
    this.lastSeenTimestamp = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0')
    this.fetchAgencies().catch(() => {})
    this.fetchNotifications()
    this.polling = setInterval(this.fetchNotifications, 30000)
    document.addEventListener('mousedown', this.handleClickOutside)
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    if (this.polling) clearInterval(this.polling)
    document.removeEventListener('mousedown', this.handleClickOutside)
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    // ===== Layout / Noti =====
    toggleSidebar() { this.isSidebarClosed = !this.isSidebarClosed },
    handleResize() {
      this.isMobile = window.innerWidth <= 600
      if (!this.isMobile) this.isSidebarClosed = false
    },
    toggleNotifications() {
      this.showNotifications = !this.showNotifications
      if (this.showNotifications) {
        this.lastSeenTimestamp = Date.now()
        localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(this.lastSeenTimestamp))
        this.unreadCount = 0
      }
    },
    closeNotifications() { this.showNotifications = false },
    handleClickOutside(e) {
      const dd = document.querySelector('.notification-dropdown')
      const btn = document.querySelector('.notification-btn')
      if (dd && !dd.contains(e.target) && btn && !btn.contains(e.target)) {
        this.closeNotifications()
      }
    },
    pruneOldNotifications() {
      const cutoff = Date.now() - 7*24*60*60*1000
      this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff)
    },
    async fetchNotifications() {
      try {
        this.pruneOldNotifications()
        const res = await api.get('/api/history/approve_field')
        const data = Array.isArray(res.data) ? res.data : []
        const pendings = data.filter(x => x.status === 'pending' && (x.type === 'field' || x.type === 'equipment'))
        if (pendings.length) {
          const msgs = pendings.map(item => {
            const id = item._id?.$oid || item._id
            const ts =
              (item.updatedAt && new Date(item.updatedAt).getTime()) ??
              (item.createdAt && new Date(item.createdAt).getTime()) ??
              (item.date && new Date(item.date).getTime()) ?? Date.now()
            return {
              id,
              type: 'pending',
              timestamp: ts,
              message: item.type === 'field'
                ? `สนาม '${item.name}' กำลังรอการอนุมัติ`
                : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
            }
          })
          this.notifications = [...this.notifications, ...msgs]
            .filter((v, i, arr) => arr.findIndex(x => (x.id||i)===(v.id||i)) === i)
            .sort((a,b) => b.timestamp - a.timestamp)
          this.pruneOldNotifications()
        }
        this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length
      } catch {}
    },
openEditModal(ag) {
  this.editForm = {
    id: ag._id || null,
    oldName: ag.agencyName || '',
    newName: ag.agencyName || ''
  }
  this.showEdit = true
},
closeEditModal() { this.showEdit = false },

async saveEdit() {
  const newName = (this.editForm.newName || '').trim()
  if (!newName) {
    await Swal.fire({ title: 'กรุณากรอกชื่อหน่วยงาน', icon: 'info', confirmButtonText: 'ตกลง',
      customClass: { title: 'swal-title-center' } })
    return
  }
  this.saving = true
  try {
    // 1) พยายามอัปเดตแบบทั้งชุดตามชื่อเดิม (case-insensitive)
    try {
      await api.put(`/api/information/agencies/by-name/${encodeURIComponent(this.editForm.oldName)}`, {
        agency: newName
      })
    } catch {
      // 2) ถ้า API บนเซิร์ฟเวอร์ยังไม่มี ให้ fallback แก้ทีละเอกสารด้วย _id
      if (this.editForm.id) {
        await api.put(`/api/information/${this.editForm.id}`, { unit: newName })
      } else {
        throw new Error('ไม่มี API สำหรับแก้ไข และไม่มี _id ให้แก้ทีละรายการ')
      }
    }

    this.showEdit = false
    await Swal.fire({ title: 'บันทึกสำเร็จ', icon: 'success', timer: 1200, showConfirmButton: false,
      customClass: { title: 'swal-title-center' } })
    await this.fetchAgencies()
  } catch (err) {
    console.error('saveEdit failed', err)
    await Swal.fire({ title: 'บันทึกไม่สำเร็จ', text: 'กรุณาลองอีกครั้ง', icon: 'error', confirmButtonText: 'ตกลง',
      customClass: { title: 'swal-title-center' } })
  } finally {
    this.saving = false
  }
},

async deleteFromEdit() {
  const res = await Swal.fire({
    title: 'ยืนยันการลบ?', html: `ต้องการลบหน่วยงานนี้ใช่หรือไม่`, icon: 'warning',
    showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#e53935',
    customClass: { title: 'swal-title-center' }
  })
  if (!res.isConfirmed) return

  this.deleting = true
  try {
    let usedBulk = false
    if (this.editForm.oldName) {
      try {
        await api.delete(`/api/information/agencies/by-name/${encodeURIComponent(this.editForm.oldName)}`)
        usedBulk = true
      } catch {}
    }
    if (!usedBulk && this.editForm.id) {
      await api.delete(`/api/information/${this.editForm.id}`)
    }

    this.showEdit = false
    await this.fetchAgencies()
    await Swal.fire({ title: 'ลบแล้ว', icon: 'success', timer: 1200, showConfirmButton: false,
      customClass: { title: 'swal-title-center' } })
  } catch (err) {
    console.error('deleteFromEdit failed', err)
    await Swal.fire({ title: 'ลบไม่สำเร็จ', text: 'กรุณาลองอีกครั้ง', icon: 'error', confirmButtonText: 'ตกลง',
      customClass: { title: 'swal-title-center' } })
  } finally {
    this.deleting = false
  }
}
,
    // ===== Data =====
    async fetchAgencies() {
      this.loading = true
      try {
        const { data } = await api.get('/api/information/agencies')
        this.rawItems = Array.isArray(data) ? data : []
        const items = Array.isArray(data) ? data : (data?.items || [])
        this.rawItems = items
      } catch (err) {
        console.error('fetchAgencies failed', err)
        this.rawItems = []
      } finally {
        this.loading = false
        // กันกรณีอยู่หน้าสุดท้ายแล้วข้อมูลหายจน page เกิน
        this.page = Math.min(this.page, this.pageCount)
      }
    },

    // ===== Pagination =====
    gotoPage(n) {
      if (n < 1 || n > this.pageCount) return
      this.page = n
    },
    nextPage() { this.gotoPage(this.page + 1) },
    prevPage() { this.gotoPage(this.page - 1) },

    // ===== Add =====
    openAddModal() {
      this.form = { agencyName: '' }
      this.showAdd = true
    },
    closeAddModal() { this.showAdd = false },

    async saveAgency() {
      const name = this.form.agencyName.trim()
      if (!name) {
        await Swal.fire({
          title: 'กรุณากรอกชื่อหน่วยงาน',
          icon: 'info',
          confirmButtonText: 'ตกลง',
          customClass: { title: 'swal-title-center' }
        })
        return
      }
      try {
        await api.post('/api/information', { agency: name })
        this.showAdd = false
        await Swal.fire({
          title: 'บันทึกสำเร็จ',
          icon: 'success',
          timer: 1300,
          showConfirmButton: false,
          customClass: { title: 'swal-title-center' }
        })
        await this.fetchAgencies()
      } catch (err) {
        console.error('saveAgency failed', err)
        await Swal.fire({
          title: 'บันทึกไม่สำเร็จ',
          text: 'กรุณาลองอีกครั้ง',
          icon: 'error',
          confirmButtonText: 'ตกลง',
          customClass: { title: 'swal-title-center' }
        })
      }
    },

    // ===== Delete with SweetAlert2 =====
    async confirmDelete(ag) {
      const res = await Swal.fire({
        title: 'ยืนยันการลบ?',
        html: `ต้องการลบหน่วยงานนี้ใช่หรือไม่`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#e53935',
        customClass: { title: 'swal-title-center' }
      })
      if (!res.isConfirmed) return

      try {
        let usedBulk = false
        if (ag.agencyName) {
          try {
            await api.delete(`/api/information/agencies/by-name/${encodeURIComponent(ag.agencyName)}`)
            usedBulk = true
          } catch {}
        }
        if (!usedBulk) {
          await api.delete(`/api/information/${ag._id}`)
        }
        await this.fetchAgencies()
        await Swal.fire({
          title: 'ลบแล้ว',
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
          customClass: { title: 'swal-title-center' }
        })
      } catch (err) {
        console.error('delete failed', err)
        await Swal.fire({
          title: 'ลบไม่สำเร็จ',
          text: 'กรุณาลองอีกครั้ง',
          icon: 'error',
          confirmButtonText: 'ตกลง',
          customClass: { title: 'swal-title-center' }
        })
      }
    }
  }
}
</script>

<style scoped>
/* ===== Base layout ===== */
.content { padding: 20px; }
.content-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 12px;
}
.page-title { margin: 0; font-size: 20px; font-weight: 700; }
.tools { display: flex; gap: 12px; align-items: center; }

/* ===== Search ===== */
.search-input {
  width: 320px; max-width: 44vw; padding: 8px 10px;
  border: 1px solid #dcdcdc; border-radius: 10px; outline: none;
}
.search-input:focus { border-color: #9c27b0; box-shadow: 0 0 0 3px rgba(156,39,176,.12); }

/* ===== Table ===== */
.table-wrapper { background: #fff; border: 1px solid #eee; border-radius: 14px; overflow: auto; }
.agency-table { width: 100%; border-collapse: collapse; }
.agency-table thead th {
  background: #1e3a8a; color: #fff; position: sticky; top: 0; z-index: 1;
  text-align: center; padding: 10px 12px; border-bottom: 1px solid #eee; font-weight: 700;
}
.agency-table tbody td {
  padding: 6px 10px;
  border-bottom: 1px solid #f1f1f1;
  line-height: 1.2;
  font-size: 14px;
}
.agency-table tbody td:nth-child(2) { text-align: left; }
.agency-table tbody tr:hover { background: #f8fafc; }
.empty { text-align: center; padding: 14px; color: #777; }

/* ===== Buttons ===== */
.btn {
  appearance: none; border: 1px solid #dcdcdc; background: #fff;
  padding: 6px 10px; border-radius: 10px; cursor: pointer; transition: .15s; font-size: 14px;
}
.btn:hover { transform: translateY(-1px); }
.btn.primary { border-color: #9c27b0; background: #9c27b0; color: #fff; }
.btn.danger  { border-color: #e53935; background: #e53935; color: #fff; }
.btn.warning { border-color: #fb8c00; background: #fb8c00; color: #fff; }
.btn.warning:hover { filter: brightness(0.95); transform: translateY(-1px); }
.btn:disabled { opacity: .6; cursor: not-allowed; }

/* ขนาดเล็กสำหรับ แก้ไข/ลบ/ยกเลิก/บันทึก */
.btn.sm {
  padding: 4px 8px;
  font-size: 13px;
  border-radius: 8px;
  line-height: 1.25;
}
.btn.sm i { font-size: 13px; line-height: 1; }

/* ===== Modal ===== */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.35);
  display: grid; place-items: center; z-index: 50;
}
.modal { width: 480px; max-width: calc(100vw - 32px); background: #fff;
  border-radius: 14px; padding: 18px; border: 1px solid #eee; }
.modal h3 { margin: 0 0 12px; text-align: center; }
.form-grid { display: grid; gap: 10px 12px; }
.form-onecol { grid-template-columns: 1fr; }
.form-grid input {
  width: 100%; padding: 8px 10px; border: 1px solid #dcdcdc; border-radius: 10px;
}
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }

/* ===== Pagination (fixed Thai diacritics clipping) ===== */
.pagination {
  margin-top: 10px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.pagination .range { text-align: center; }

/* แถวปุ่ม */
.pagination .pager {
  display: flex; gap: 8px; align-items: center; justify-content: center;
  --nav-btn-w: 84px;     /* ความกว้างปุ่ม ก่อนหน้า/ถัดไป ให้เท่ากัน */
  --nav-font: 14px;
}

/* กัน browser บางตัวครอปวรรณยุกต์ */
button.btn { overflow: visible !important; }

/* ปุ่มทั้งหมดในเพจเจอร์ (เลขหน้า + ก่อนหน้า/ถัดไป) */
.pagination .pager > .btn,
.pagination .pager > .page-btn {
  display: inline-flex; align-items: center; justify-content: center;
  font-size: var(--nav-font);
  line-height: 1.6 !important;     /* สูงพอสำหรับวรรณยุกต์ไทย */
  height: auto !important;          /* ห้ามล็อกความสูงตายตัว */
  min-height: calc(1em + 12px);     /* กันหัวไม่ชนขอบ */
  padding: 6px 12px;
  white-space: nowrap;
  border-radius: 10px;
}

/* ปุ่มนำทาง (มีไอคอน) */
.pagination .pager > .btn:not(.page-btn) {
  position: relative;
  min-width: var(--nav-btn-w);      /* ให้กว้างเท่ากัน */
  padding-left: 28px;               /* เผื่อพื้นที่ไอคอน */
  padding-right: 28px;
}

/* จัดไอคอนให้อยู่กลางแนวตั้ง */
.pagination .pager > .btn:not(.page-btn) i {
  position: absolute; top: 50%; transform: translateY(-50%);
  line-height: 1; pointer-events: none; font-size: 14px;
}
.pagination .pager > .btn:not(.page-btn) i.pi-angle-left  { left: 10px; }
.pagination .pager > .btn:not(.page-btn) i.pi-angle-right { right: 10px; }

/* หน้าที่กำลังใช้งาน */
.pagination .pager > .page-btn.active {
  background: #1e3a8a; border-color: #1e3a8a; color: #fff;
}

/* ===== Page title tweak ===== */
.content-head .page-title {
  font-size: 28px; font-weight: 800; color: #1e3a8a; line-height: 1.2; margin: 0;
}
@media (max-width: 768px) {
  .tools { width: 100%; }
  .search-input { flex: 1; width: auto; max-width: 100%; }
  .content-head .page-title { font-size: 22px; }
}

/* ===== Overlay stacking ===== */
.sidebar-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.18); z-index:1100; }
.sidebar { z-index:1200; }
</style>


<!-- Global styles for SweetAlert2 (อยู่นอก scoped เพื่อให้มีผลกับ swal) -->
<style>
.swal-title-center { text-align: center !important; }
</style>
