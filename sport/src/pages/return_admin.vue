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
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> จองสนาม</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> รับคืนอุปกรณ์ </router-link>
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
      <div class="histbody">
        <h1 style="display: flex; justify-content: center;">Return Pending Equipment</h1>

        <div class="table-container">
          <table class="approve-table">
            <thead>
              <tr>
                <th>Equipment Name</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in equipmentGroups" :key="group.booking_id || 'noid_' + group.items[0].id">
                <td style="text-align:center;">
                  <!-- รวมชื่ออุปกรณ์เป็น comma-separated -->
                  {{ group.items.map(i => i.name).join(', ') }}
                </td>
                <td>
                  <!-- รวมจำนวนทั้งหมด -->
                  {{ group.items.reduce((sum, i) => sum + i.amount, 0) }}
                </td>
                <td>
                  <button class="return-btn" @click="returnGroup(group)">Return</button>
                </td>
              </tr>
              <tr v-if="equipmentGroups.length === 0">
                <td colspan="3" style="color:#999; text-align:center;">
                  ไม่พบรายการยืมที่รอคืน
                </td>
              </tr>
            </tbody>
          </table>
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
import Swal from 'sweetalert2'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'
export default {
  data() {
    return {
      isSidebarClosed: false,
      equipments: [],
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
      isMobile: window.innerWidth <= 600,
      lastSeenTimestamp: 0,
    }
  },
  computed: {
    equipmentGroups() {
      // Group by booking_id
      const map = {};
      this.equipments.forEach(e => {
        const key = e.booking_id || `noid_${e.id}`;
        if (!map[key]) map[key] = { booking_id: e.booking_id, items: [] };
        map[key].items.push(e);
      });
      return Object.values(map);
    }
  },
  async mounted() {
  this.lastSeenTimestamp = parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0');

  await this.fetchEquipments();
  await this.fetchNotifications();

  this.polling = setInterval(async () => {
    await this.fetchEquipments();
    await this.fetchNotifications();
  }, 20000);

  document.addEventListener('mousedown', this.handleClickOutside);
  window.addEventListener('resize', this.handleResize);
  this.handleResize();
},

  beforeUnmount() {
    clearInterval(this.polling);
    document.removeEventListener('mousedown', this.handleClickOutside);
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed
    },
    formatNamesWithQty(items) {
  // รวมชื่อที่ซ้ำกันในกลุ่มเดียวกัน แล้วสรุปจำนวนต่อชื่อ
  // ได้ผลลัพธ์เป็น "ลูกบาส (2), ลูกฟุตบอล (1)" เป็นต้น
  const acc = new Map();
  for (const it of (items || [])) {
    const name = String(it?.name ?? '').trim();
    if (!name) continue;
    const qty = Number(it?.amount ?? it?.quantity ?? 0) || 0;
    acc.set(name, (acc.get(name) ?? 0) + qty);
  }
  return Array.from(acc.entries())
    .map(([n, q]) => `${n}${q ? ` (${q})` : ''}`)
    .join(', ');
},

sumQty(items) {
  return (items || []).reduce(
    (sum, it) => sum + (Number(it?.amount ?? it?.quantity ?? 0) || 0),
    0
  );
},

    toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.lastSeenTimestamp = Date.now();
      localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(this.lastSeenTimestamp));
      this.unreadCount = 0; // เคลียร์ทันที และจะไม่กลับมาเพราะคำนวณจาก timestamp
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
    async fetchEquipments() {
      try {
        const res = await axios.get(`${API_BASE}/api/equipments/return-pending`)
        this.equipments = (res.data || [])
          .filter(e =>
            e.since && e.uptodate &&
            String(e.since).trim() !== "" && String(e.uptodate).trim() !== ""
          )
          .map(e => ({
            id: e._id?.$oid || e._id,
            name: e.name,
            amount: e.quantity,
            booking_id: e.booking_id || null,
            returnPhoto: Array.isArray(e.returnPhoto) ? e.returnPhoto[0] : e.returnPhoto,
            fileData: e.attachment || null,
            fileName: e.fileName || null
          }))
      } catch (e) {
        this.equipments = []
        Swal.fire('Error', 'โหลดข้อมูลอุปกรณ์ล้มเหลว', 'error')
      }
    },
    async fetchNotifications() {
  try {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.pruneOldNotifications();

    // ดึง pending field/equipment
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
            : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`,
        };
      });

      // รวม + unique ตาม id + sort ล่าสุดอยู่บน
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      this.pruneOldNotifications();
    }

    // นับ unread จาก timestamp > lastSeenTimestamp (เหมือนทุกหน้าแอดมิน)
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch {}
},
    async returnGroup(group) {
      const staffId = localStorage.getItem('user_id');
      const itemWithPhoto = group.items.find(item => !!item.returnPhoto);

      let photoHtml = '';
      if (itemWithPhoto && itemWithPhoto.returnPhoto) {
        photoHtml = `
          <div style="text-align:center;margin-bottom:12px;">
            <img
              src="${itemWithPhoto.returnPhoto}"
              style="max-width:220px;max-height:170px;object-fit:contain;cursor:pointer;border-radius:10px;border:1.5px solid #bbb;"
              alt="รูปคืนอุปกรณ์"
              onclick="window.__showFullPhoto && window.__showFullPhoto()"
            />
            <div style="font-size:0.9em;color:#888;margin-top:0.4em;">คลิกที่รูปเพื่อดูแบบเต็มจอ</div>
          </div>
        `;
      } else {
        photoHtml = `<div style="text-align:center;color:#bbb;margin-bottom:12px;">ไม่มีรูปคืนอุปกรณ์แนบมา</div>`;
      }

      const { value: result } = await Swal.fire({
        title: 'ยืนยันการคืนอุปกรณ์ทั้งกลุ่ม?',
        html: `
          <div style="margin-bottom:8px;">
            ${photoHtml}
            <hr>
            คุณต้องการคืนอุปกรณ์ทั้งหมดนี้หรือไม่?<br>
            <span style="font-size:0.9em;color:#666;">(กรุณาเลือกสถานะ และกรอกหมายเหตุถ้าไม่สมบูรณ์)</span>
          </div>
          <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 8px;">
            <label style="margin-right: 2em;">
              <input type="radio" name="equipStatus" value="good" checked> สมบูรณ์
            </label>
            <label>
              <input type="radio" name="equipStatus" value="bad"> ไม่สมบูรณ์
            </label>
          </div>
          <div id="remarkBox" style="margin-top:1em; display:none;">
            <input id="remarkInput" class="swal2-input" placeholder="กรุณากรอกหมายเหตุ" />
          </div>
        `,
        icon: 'question',
        input: null,
        showCancelButton: true,
        confirmButtonText: 'คืนอุปกรณ์',
        cancelButtonText: 'ยกเลิก',
        focusConfirm: false,
        preConfirm: () => {
          const status = document.querySelector('input[name="equipStatus"]:checked').value;
          const remark = document.getElementById('remarkInput')?.value || "";
          if (status === 'bad' && !remark.trim()) {
            Swal.showValidationMessage('กรุณากรอกหมายเหตุหากอุปกรณ์ไม่สมบูรณ์');
            return false;
          }
          return { status, remark };
        },
        didOpen: () => {
          window.__showFullPhoto = () => {
            if (itemWithPhoto && itemWithPhoto.returnPhoto) {
              const imgWin = window.open("", "_blank");
              imgWin.document.write(`
                <html>
                  <head>
                    <title>รูปคืนอุปกรณ์</title>
                    <style>
                      body { background:#111;margin:0;display:flex;align-items:center;justify-content:center;height:100vh;}
                      img { max-width:100vw;max-height:100vh;object-fit:contain;border-radius:16px;box-shadow:0 8px 30px #0008;}
                    </style>
                  </head>
                  <body onclick="window.close()">
                    <img src="${itemWithPhoto.returnPhoto}" alt="รูปคืนอุปกรณ์" />
                  </body>
                </html>
              `);
            }
          };
          const radios = document.getElementsByName('equipStatus');
          radios.forEach(radio => {
            radio.addEventListener('change', () => {
              document.getElementById('remarkBox').style.display =
                radio.value === 'bad' && radio.checked ? 'block' : 'none';
            });
          });
        },
        willClose: () => {
          window.__showFullPhoto = undefined;
        }
      });

      if (!result) return;

      try {
        await Promise.all(
          group.items.map(item =>
            axios.patch(`${API_BASE}/api/history/${item.id}/return`, {
              staff_id: staffId,
              status: result.status,
              remark: result.remark,
              attachment: item.fileData,
              fileName: item.fileName,
              booking_id: item.booking_id || null
            })
          )
        );
        Swal.fire({
          title: 'สำเร็จ',
          text: `คุณได้คืนอุปกรณ์กลุ่มนี้แล้ว`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        // โหลดข้อมูลใหม่หลังจากคืนสำเร็จ
        await this.fetchEquipments();
      } catch {
        Swal.fire('Error', 'คืนอุปกรณ์ไม่สำเร็จ', 'error');
      }
    }
  }
}
</script>



<style scoped>
.histbody {
  width: 100%;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  overflow-x: hidden;
}
.hist-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 70px;
}
.hist-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  padding: 1rem 1.5rem;
  width: 100%;
}
.hist-row {
  display: grid;
  justify-content: space-between;
  grid-template-columns: 200px 80px auto;
  align-items: center;
  gap: 1rem;
}
.hist-row-desktop { grid-template-columns: 200px 1fr 80px; gap: 1rem; }
.hist-row-mobile { grid-template-columns: 1fr auto; gap: 0.6rem; }

.item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-amount {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
.return-btn {
  padding: 4px 10px;
  background-color: #1eac36;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.3s;
  max-width: 70px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.return-btn:hover{
  background-color: #178129;
}

.table-container {
  padding: 0 70px;
  overflow-x: auto;
}
.approve-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.approve-table th, .approve-table td {
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}
.approve-table th {
  background: #1e3a8a;
  color: #fff;
  font-weight: bold;
}
.approve-table tr:last-child td {
  border-bottom: none;
}
.return-btn {
  padding: 4px 10px;
  background-color: #1eac36;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.3s;
  max-width: 70px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.return-btn:hover{
  background-color: #178129;
}


@media (max-width: 600px) {
  .histbody {
    padding: 14px 0 0 0 !important;
    width: 100vw;
    min-width: unset;
    overflow-x: auto !important;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .hist-grid {
    min-width: 320px;
    width: 95vw;
    max-width: 440px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  .hist-card {
    min-width: 95vw;
    max-width: 440px;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .hist-row {
    display: grid !important;
    grid-template-columns: 1fr auto;
    align-items: center;
    min-width: 0 !important;
    width: 100% !important;
    gap: 0.6rem;
    flex-wrap: unset !important;
    overflow-x: unset !important;
  }
  .item-name {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
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

.notification-backdrop{
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: transparent;
  z-index: 1001; /* ต้องต่ำกว่า .notification-dropdown */
}

</style>

<style>
@import '../css/style.css';
</style>