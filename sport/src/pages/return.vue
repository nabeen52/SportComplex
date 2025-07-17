<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      </div>
      <nav class="nav-links">
        <router-link to="/approve_equipment" exact-active-class="active">
          <i class="pi pi-home"></i> Approve
        </router-link>
        <router-link to="/equipment" active-class="active">
          <i class="pi pi-map-marker"></i> Equipment
        </router-link>
        <router-link to="/return" active-class="active">
          <i class="pi pi-box"></i> Return
        </router-link>
        <router-link to="/history_staff" active-class="active">
          <i class="pi pi-history"></i> History
        </router-link>
      </nav>
    </aside>

    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <!-- กระดิ่งแจ้งเตือน -->
          <!-- ... -->
<div style="position: relative;">
  <!-- Backdrop: คลุมหน้าจอ ถ้า showNotifications -->
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
      <li v-for="(noti, idx) in notifications" :key="idx">
        {{ noti.message }}
      </li>
      <li v-if="notifications.length === 0">ไม่มีแจ้งเตือน</li>
    </ul>
  </div>
</div>

          <router-link to="/profile_staff"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <div class="announcement" v-if="announcement && announcement.trim()">
        <div class="announcement-text">
          {{ announcement }}
        </div>
      </div>
      <div class="histbody">
        <h1 style="padding-left: 50px; display: flex; justify-content: center;">Return Pending Equipment</h1>
        <div class="hist-grid">
          <div
            class="hist-card"
            v-for="(group, idx) in equipmentGroups"
            :key="group.booking_id || 'noid_' + idx"
          >
            <div class="hist-row" style="font-weight:600;">
              <span class="item-name">รายการอุปกรณ์ </span>
              <span class="item-amount"></span>
              <button class="return-btn" @click="returnGroup(group)">Return</button>
            </div>
            <div
              class="hist-row"
              v-for="(item, i) in group.items"
              :key="item.id"
              style="border-bottom:1px dashed #ccc;"
            >
              <span class="item-name">{{ item.name }}</span>
              <span class="item-amount">จำนวน: {{ item.amount }}</span>
            </div>
          </div>
        </div>
      </div>
      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel. 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
            Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import Swal from 'sweetalert2'
import axios from 'axios'


const API_BASE = import.meta.env.VITE_API_BASE

axios.defaults.withCredentials = true    // <------ บรรทัดสำคัญ!

const isSidebarClosed = ref(false)
const equipments = ref([]) // raw list (return-pending)
const announcement = ref("")

const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const lastCheckedIds = ref(new Set())

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) unreadCount.value = 0
}

function closeNotifications() {
  showNotifications.value = false
}

// ===================== fetchNotifications (fix credentials) ===================== //
async function fetchNotifications() {
  try {
    const res = await fetch(`${API_BASE}/api/equipments/pending`, {
      credentials: 'include'
    })
    const data = await res.json()
    const pendings = Array.isArray(data)
      ? data.filter(item => !lastCheckedIds.value.has(item._id?.$oid || item._id))
      : []
    if (pendings.length) {
      const newMessages = pendings.map(item => ({
        id: item._id?.$oid || item._id,
        message: `มีรายการ '${item.name}' ที่รออนุมัติ`
      }))
      notifications.value = [...notifications.value, ...newMessages]
      pendings.forEach(item => lastCheckedIds.value.add(item._id?.$oid || item._id))
      unreadCount.value = notifications.value.length
    }
  } catch (err) {}
}

// ===================== fetchEquipments (fix credentials) ===================== //
const fetchEquipments = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/equipments/return-pending`, {
      credentials: 'include'
    });
    const data = await res.json();

    equipments.value = (data || []).map(e => ({
      id: e._id?.$oid || e._id,
      name: e.name,
      amount: e.quantity,
      booking_id: e.booking_id || null,
      returnPhoto: Array.isArray(e.returnPhoto) ? e.returnPhoto[0] : e.returnPhoto,
      fileData: e.attachment || null,
      fileName: e.fileName || null
    }));
  } catch (err) {
    equipments.value = []
    Swal.fire('Error', 'โหลดข้อมูลอุปกรณ์ล้มเหลว', 'error')
  }
}

// ============== Group by booking_id ==============
const equipmentGroups = computed(() => {
  const map = {};
  equipments.value.forEach(e => {
    const key = e.booking_id || `noid_${e.id}`;
    if (!map[key]) map[key] = { booking_id: e.booking_id, items: [] };
    map[key].items.push(e);
  });
  return Object.values(map);
});

// ============== Return ทั้งกลุ่ม ==============
const returnGroup = async (group) => {
  const staffId = localStorage.getItem('user_id');

  // รูปเดียว (จาก item แรกที่มี returnPhoto ในกลุ่ม)
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
    // PATCH อุปกรณ์ทุกชิ้นใน group
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
      title: 'สำเร็จ!',
      text: `คุณได้คืนอุปกรณ์กลุ่มนี้แล้ว`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
    fetchEquipments();
  } catch {
    Swal.fire('Error', 'คืนอุปกรณ์ไม่สำเร็จ', 'error');
  }
};

onMounted(() => {
  fetchEquipments()
  fetchNotifications()
  const polling = setInterval(fetchNotifications, 30000)
  onBeforeUnmount(() => clearInterval(polling))
})
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

.notification-dropdown {
  position: absolute;
  right: 0;
  top: 36px;
  background: white;
  box-shadow: 0 4px 24px rgba(70, 70, 70, 0.14);
  border-radius: 10px;
  width: 320px;        /* กว้างขึ้นเหมือน approve_equipment */
  max-width: 90vw;
  z-index: 1500;
  padding: 10px 0;
  margin-top: 6px;
  font-size: 1rem;
}
.notification-dropdown ul {
  padding: 0 18px;
  margin: 0;
}
.notification-dropdown li {
  list-style: none;
  padding: 10px 0;
  border-bottom: 1px solid #eaeaea;
  word-break: break-word;
}
.notification-dropdown li:last-child {
  border-bottom: none;
}
.notification-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  position: relative;
  margin-right: 8px;
}
.badge {
  position: absolute;
  top: 1px;
  right: 3px;
  background: #e11d48;
  color: white;
  border-radius: 8px;
  padding: 1px 8px;
  font-size: 0.83rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
  z-index: 10;
}

.notification-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: transparent;
  z-index: 1400;  /* น้อยกว่า .notification-dropdown */
}

</style>
<style>
@import '../css/style.css';
</style>
