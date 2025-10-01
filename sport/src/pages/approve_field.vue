<template>
  <div class="layout">
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
        <router-link to="/step" active-class="active"><i class="pi pi-sitemap"></i> แก้ไขขั้นตอนการอนุมัติ </router-link>
        <router-link to="/booking_field_admin" active-class="active"><i class="pi pi-map-marker"></i> จองสนาม</router-link>
        <router-link to="/approve_field" active-class="active"><i class="pi pi-verified"></i> อนุมัติ</router-link>
        <!-- <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> รับคืนอุปกรณ์ </router-link> -->
         <router-link to="/agency_admin" active-class="active"><i class="pi pi-briefcase"></i> หน่วยงาน </router-link>
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล </router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
      </nav>
    </aside>
    <div v-if="isMobile && !isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>
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
          <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
        </div>
      </header>
      <div class="histbody">
        <h1 style="padding-left: 50px; display: flex; justify-content: center;">Field/Equipment Approve</h1>

        <!-- ปุ่มกรอง -->
        <div class="history-filter" style="display: flex; justify-content: center;">
          <button :class="{ active: filterType === 'all' }" @click="filterType = 'all'">All</button>
          <button :class="{ active: filterType === 'field' }" @click="filterType = 'field'">Field</button>
          <button :class="{ active: filterType === 'equipment' }" @click="filterType = 'equipment'">Equipment</button>
        </div>

        <!-- ตารางอนุมัติ (table) -->
        <div class="table-container">
          <table class="approve-table">
            <thead>
              <tr>
                <th>Transaction date</th>
                <th>Type</th>
                <th>Field / Equipment</th>
                <th>Time / Amount</th>
                <th>Actions</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in filteredGrouped" :key="group.type + '_' + (group.booking_id || group.items[0].id)">
                <!-- สนาม -->
                <tr v-if="group.type === 'field'">
                  <td>{{ formatDate(group.items[0].createdAt || group.items[0].date) }}</td>
                  <td>สนาม</td>
                  <td>
                    {{ group.items[0].name }}
                    <template v-if="group.items[0].zone && group.items[0].zone !== '-' && group.items[0].zone !== ''">
                      (โซน: {{ group.items[0].zone }})
                    </template>
                  </td>
                  <td>
                    <!-- แสดงเวลา ถ้ามีข้อมูล -->
                    <template v-if="group.items[0].startTime && group.items[0].endTime">
                    {{ formatTimeRangeTH(group.items[0].startTime, group.items[0].endTime) }}

                  </template>
                    <template v-else>
                      -
                    </template>
                  </td>
                  <td>
                    <button class="approve-btn" @click="approveGroup(group)">อนุมัติ</button>
                    <button class="cancel-btn" @click="cancelGroup(group)">ไม่อนุมัติ</button>
                  </td>
                  <td>
                    <button class="detail-btn" @click="detailGroup(group)">รายละเอียด</button>
                  </td>
                </tr>

                <!-- อุปกรณ์ -->
                <tr v-else>
                  <td>{{ formatDate(group.items[0].createdAt || group.items[0].date) }}</td>
                  <td>อุปกรณ์</td>
                  <td>
                    <span v-for="(item, idx) in group.items" :key="item.id">
                      {{ item.name }}<span v-if="idx < group.items.length - 1">, </span>
                    </span>
                  </td>
                  <td>
                    <span v-for="(item, idx) in group.items" :key="item.id">
                      {{ item.quantity }}<span v-if="idx < group.items.length - 1">, </span>
                    </span>
                  </td>
                  <td>
                    <button class="approve-btn" @click="approveGroup(group)">อนุมัติ</button>
                    <button class="cancel-btn" @click="cancelGroup(group)">ไม่อนุมัติ</button>
                  </td>
                  <td>
                    <button class="detail-btn" @click="detailGroup(group)">รายละเอียด</button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

    <div
    id="pdf-capture-approve"
    style="position:fixed; left:-100000px; top:-100000px; width:0; height:0;"
    ></div>

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

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import html2pdf from 'html2pdf.js'


// (ฟอนต์ Sarabun ต้อง import JS ไฟล์ที่ bundle มาเอง!)
import '@/assets/fonts/Sarabun-Regular-normal.js'
import '@/assets/fonts/Sarabun-Bold-normal.js'

const API_BASE = import.meta.env.VITE_API_BASE
const ADMIN_LAST_SEEN_KEY = 'admin_lastSeenTimestamp'

export default {
  data() {
    return {
      isSidebarClosed: false,
      filterType: 'all',
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      lastCheckedIds: new Set(),
      polling: null,
      userMap: {},
      userSigMap: {},
      isMobile: window.innerWidth <= 600,
      grouped: [],
      lastSeenTimestamp: 0,
      refreshTimer: null,
      _lastSnapshot: '',
      reason_admin: '',
      secretary_choice: null,
      loggedThaiName: '',

      loggedSignatureUrl: '',  // ใช้แสดงผล (พรีวิว)
      loggedSignatureRaw: '',  // << ใช้ส่งเข้า DB

       usersEmailMap: {},
       _usersLoaded: false,

       // ====== ขนาด A4 (px @96dpi) และ helper แปลง DOM → PDF Blob ======
        A4_W: Math.round(210 * (96 / 25.4)),  // ~ 794
        A4_H: Math.round(297 * (96 / 25.4)),  // ~ 1123
        PAD_X: 12,
        PAD_Y: 12,
    }
  },
  computed: {
    filteredGrouped() {
      if (this.filterType === 'all') return this.grouped
      return this.grouped.filter(g => g.type === this.filterType)
    }
  },
  methods: {

    async fetchUsers() {
    const { data } = await axios.get('/api/users');
    // สร้าง 2 แมป: ทั้ง user ทั้งอีเมล
    this.userMap = Object.fromEntries(data.map(u => [String(u.user_id), u]));
    this.usersEmailMap = Object.fromEntries(
      data.map(u => [String(u.user_id), u.email || ''])
    );
    this._usersLoaded = true;
  },

   async ensureUsersLoaded() {
    if (!this._usersLoaded || !Object.keys(this.usersEmailMap).length) {
      await this.fetchUsers();
    }
  },

    // ถือว่า "อนุมัติครบจริง" อย่างไร
  isFullyApproved(item) {
  const typ = String(item?.type || '').toLowerCase();

  // ถ้าเป็นอุปกรณ์และ workflow มี admin ใน step → ต้องดูว่า admin อนุมัติแล้วจริงไหม
  if (typ === 'equipment' && this.hasRoleIn(item, 'admin')) {
    const arr = Array.isArray(item?.step) ? item.step
              : Array.isArray(item?.steps) ? item.steps
              : [];
    const admin = arr.find(s => String(s?.role || '').toLowerCase() === 'admin');
    return !!(admin && admin.approve === true);
  }

  // กรณีอื่น ๆ (เช่น field หรือ equipment ที่ไม่มี admin) ใช้เงื่อนไขเดิม
  const st = String(item?.status || '').toLowerCase();
  return this.isApprovedRec(item) || st === 'approved';
}
,
    // อุปกรณ์ "ยืมวันเดียว" = ไม่มี since/uptodate
isSingleDayItem(it) {
  const empty = (v) => v === undefined || v === null || v === "" || v === "null";
  return empty(it.since) && empty(it.uptodate);
},

// ใน step มี role ที่ระบุไหม
hasRoleIn(item, role) {
  const arr = Array.isArray(item?.step) ? item.step
            : Array.isArray(item?.steps) ? item.steps
            : [];
  const want = String(role || '').toLowerCase();
  return arr.some(s => String(s?.role || '').toLowerCase() === want);
},

// staff อนุมัติแล้วหรือยัง
isStaffApprovedInStep(item) {
  const arr = Array.isArray(item?.step) ? item.step
            : Array.isArray(item?.steps) ? item.steps
            : [];
  const ent = arr.find(s => String(s?.role || '').toLowerCase() === 'staff');
  return !!(ent && ent.approve === true);
},

// admin ยังไม่อนุมัติใช่ไหม
isAdminNotApprovedInStep(item) {
  const arr = Array.isArray(item?.step) ? item.step
            : Array.isArray(item?.steps) ? item.steps
            : [];
  const ent = arr.find(s => String(s?.role || '').toLowerCase() === 'admin');
  // ต้องมี admin ใน step และ approve ยังไม่ true
  return !!ent && ent.approve !== true;
},


    hasRoleInStep(item, role = 'admin') {
  const arr = Array.isArray(item?.step) ? item.step
            : Array.isArray(item?.steps) ? item.steps
            : [];
  const want = String(role).toLowerCase();
  return arr.some(s => String(s?.role || '').toLowerCase() === want);
},


    // สร้าง DOM ฟอร์มสนามสำหรับแคปเจอร์ PDF
// สร้าง DOM ฟอร์มสนามสำหรับแคปเจอร์ PDF (อัปเดตให้ใส่ค่า 'อื่นๆ' แบบ contenteditable)
_buildFieldPdfNode(b, secretary_choice = {}, reason_admin = '', secThaiName = '', secSignUrl = '') {
  const holder = document.createElement('div');
  holder.id = 'pdf-field';
  Object.assign(holder.style, {
    background: '#fff',
    color: '#111',
    fontFamily: `'THSarabunNew','Sarabun','Noto Sans Thai', Tahoma, sans-serif`,
    width: '190mm',
    margin: '10mm auto',
    boxSizing: 'border-box',
    padding: '0',
  });

  // ใช้เทมเพลตเดียวกับพรีวิว
  const reqKey = b.user_id || b.id_form || '';
  const reqSig = this.userSigMap?.[reqKey] || '';
  holder.innerHTML = buildFieldFormPreviewV2(b, secThaiName, secSignUrl, reqSig);

  // === เติมค่าที่เลือกใน dialog: “เลขานุการศูนย์กีฬา > อื่นๆ” ===
  const chk = holder.querySelector('#sec_other_chk');
  const box = holder.querySelector('#sec_other_reason');

  const wantOther =
    !!(secretary_choice && secretary_choice.other_checked) ||
    (!!reason_admin && String(reason_admin).trim() !== '');

  if (chk) chk.checked = wantOther;

  if (box) {
    // ให้มีค่าแน่ ๆ: ถ้าติ๊กแต่ไม่กรอก ให้เป็น '-'
    const text = wantOther ? ((reason_admin || '').trim() || '-') : '';

    // input/textarea
    if ('value' in box) box.value = text;

    // contenteditable div
    const isCE = box.isContentEditable || box.getAttribute('contenteditable') === 'true';
    if (isCE) {
      box.textContent = text;
      try { box.setAttribute('data-ph', ''); } catch (_){}
    } else if (!('value' in box)) {
      // element ธรรมดา
      box.textContent = text;
    }
  }

  // แช่แข็งฟอร์มให้เป็นตัวหนังสือก่อนจับภาพ
  if (typeof this._freezeFormForPdf === 'function') {
    this._freezeFormForPdf(holder);
  }

  return holder;
},

    // === สร้าง context สำหรับพรีวิวอนุมัติ "อุปกรณ์" ===
_buildEquipmentCtxFromGroup(group) {
  const items = Array.isArray(group?.items) ? group.items : [];
  const it0   = items[0] || {};

  // ชื่อผู้ยืม / รหัส / เบอร์
  const requester   = it0.username_form || it0.requester || it0.user_id || "-";
  const requesterId = it0.id_form || it0.user_id || "-";
  const tel         = it0.tel || "";

  // เหตุผล / สถานที่
  const reason   = it0.reason || it0.reasons || "";
  const location = it0.location || it0.place || (it0.zone && it0.zone !== "-" ? it0.zone : (it0.name || ""));

  // ช่วงวันที่ (dd/mm/yyyy - dd/mm/yyyy)
  const sinceStr  = it0.since    ? this.formatDate(it0.since)    : "-";
  const uptoStr   = it0.uptodate ? this.formatDate(it0.uptodate) : "-";
  const dateRange = `${sinceStr} - ${uptoStr}`;

  // แถวรายการ
  const rows = items.map((it, idx) => ({
    idx: idx + 1,
    name: it.name || "-",
    quantity: Number(it.quantity ?? 0) || 0,
    remark: it.remark || it.remarks || it.note || ""
  }));

  // วันที่/เวลามารับของ (ถ้ามี)
  const receive_date = it0.receive_date || it0.dateBorrow || "";
  const receive_time = it0.receive_time || it0.timeBorrow || "";

  // createdAt
  const pickCreatedAt = (o) =>
    (o?.createdAt && (o.createdAt.$date || o.createdAt)) ||
    (o?.created_at && (o.created_at.$date || o.created_at)) ||
    null;

  const createdAt =
    pickCreatedAt(it0) ||
    items.map(pickCreatedAt).find(Boolean) ||
    pickCreatedAt(group) ||
    null;

  // ✅ อีเมลจากคอลเลกชัน users ผ่าน user_id (ใช้แมปที่โหลดไว้ใน approveGroup)
  const user_id = String(group.user_id || it0.user_id || "");
  const email   = this.usersEmailMap?.[user_id] ?? group.email ?? it0.email ?? "";

  return {
    requester, requesterId, tel,
    reason, location, dateRange, rows,
    receive_date, receive_time,
    createdAt,
    items,

    user_id,
    email,
  };
},




_freezeFormForPdf(root) {
  if (!root) return;

  // checkbox -> ☑/☐
  root.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    const mark = document.createElement('span');
    mark.textContent = cb.checked ? '☑' : '☐';
    mark.style.display = 'inline-block';
    mark.style.minWidth = '1.1em';
    mark.style.marginRight = '8px';
    mark.style.fontSize = '16px';
    cb.replaceWith(mark);
  });

  // text input -> กล่องนิ่ง (ยกเว้นช่อง 'อื่นๆ' ให้เป็นตัวอักษรล้วน)
  root.querySelectorAll('input[type="text"]').forEach(inp => {
    const val = (inp.value || inp.getAttribute('value') || '').trim();
    const span = document.createElement('span');
    span.className = 'pdf-fake-input';

    if (inp.id === 'sec_other_reason' || inp.id === 'head_other_reason') {
      Object.assign(span.style, {
        display: 'inline',
        minWidth: '0',
        padding: '0',
        border: 'none',
        borderRadius: '0',
        background: 'transparent'
      });
    } else {
      Object.assign(span.style, {
        display: 'inline-block',
        minWidth: '220px',
        padding: '6px 8px',
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        background: '#f8fafc',
      });
    }
    span.textContent = val || ' ';
    inp.replaceWith(span);
  });

  // NEW: contenteditable / .mfu-ta -> ทำเป็น div นิ่ง
  root.querySelectorAll('[contenteditable="true"], .mfu-ta').forEach(el => {
    const text = (el.textContent || '').trim();
    const repl = document.createElement('div');
    repl.className = 'pdf-fake-input';

    // ช่อง 'อื่นๆ' ให้แสดง "ข้อความล้วน" ไม่มีกล่อง
    const plain = (el.id === 'sec_other_reason' || el.id === 'head_other_reason');

    if (plain) {
      Object.assign(repl.style, {
        display: 'inline',
        minWidth: '0',
        padding: '0',
        border: 'none',
        borderRadius: '0',
        background: 'transparent',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: '1.6',
      });
    } else {
      Object.assign(repl.style, {
        display: 'inline-block',
        minWidth: '220px',
        padding: '6px 8px',
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        background: '#f8fafc',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: '1.6',
      });
    }

    repl.textContent = text || (plain ? '' : ' ');
    el.replaceWith(repl);
  });
},

async _makeA4OnePageBlob(element) {
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }

  // --- เก็บ style เดิมไว้ ---
  const orig = {
    width: element.style.width, margin: element.style.margin, padding: element.style.padding,
    boxSizing: element.style.boxSizing, transform: element.style.transform, transformOrigin: element.style.transformOrigin,
    position: element.style.position, left: element.style.left, top: element.style.top, display: element.style.display
  };

  // wrapper กว้าง A4 (สูงตามเนื้อหา)
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, { width: '210mm', background: '#fff', display: 'block', padding: '0', margin: '0' });

  // คอนเทนต์กว้าง 190mm + margin 10mm (ให้มีขอบครั้งเดียวจาก DOM)
  element.style.width = '190mm';
  element.style.margin = '10mm auto';
  element.style.padding = '0';
  element.style.boxSizing = 'border-box';
  element.style.transform = 'none';
  element.style.transformOrigin = 'top left';
  element.style.position = 'static';
  element.style.display = 'block';

  const parent = element.parentNode;
  const next = element.nextSibling;
  parent.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  await new Promise(r => requestAnimationFrame(r));

  // ---- helper: ให้ URL เป็น absolute และ protocol เดียวกับหน้า ----
  const toAbsUrlSafe = (url) => {
    if (!url) return '';
    if (/^(data:|https?:)/i.test(url)) return url;
    const base = location.origin.replace(/^http:/, location.protocol); // ป้องกัน http/https ไม่ตรงกัน
    if (url.startsWith('/')) return base + url;
    return base + '/' + url.replace(/^\.\//,'');
  };

  // ---------- อินไลน์รูปลายเซ็นก่อนจับภาพ ----------
  try {
    const imgs = Array.from(wrapper.querySelectorAll('img.sigimg'));
    await Promise.all(imgs.map(async (img) => {
      // ตั้ง crossOrigin ให้ html2canvas วาดได้แบบไม่ taint
      try { img.setAttribute('crossorigin', 'anonymous'); } catch {}

      const raw = img.getAttribute('src') || '';
      if (!raw || /^data:/i.test(raw)) return; // ข้ามถ้าเป็น data: อยู่แล้ว

      const abs = toAbsUrlSafe(raw);

      // fetch แล้วอ่านเป็น blob -> dataURL
      try {
        const res = await fetch(abs, { mode: 'cors', credentials: 'omit', cache: 'no-cache' });
        if (!res.ok) throw new Error('fetch failed: ' + res.status + ' ' + abs);
        const blob = await res.blob();

        await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => { try { img.src = fr.result; resolve(); } catch (e) { reject(e); } };
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('inline signature failed', e);
      }
    }));

    // รอให้รูปทั้งหมดโหลดเสร็จก่อน
    await Promise.all(
      Array.from(wrapper.querySelectorAll('img'))
        .map(img => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))
    );
  } catch (e) {
    console.warn('inline images block error', e);
  }
  // --------------------------------------------------

  // DOM -> canvas
  const worker = html2pdf().set({
    html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff' }
  }).from(wrapper).toCanvas();

  const canvas = await worker.get('canvas');
  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  // วางรูปลง PDF แบบเต็มหน้า
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const imgRatio = canvas.width / canvas.height;
  const pageRatio = pageW / pageH;

  let drawW, drawH, offsetX = 0, offsetY = 0;
  if (imgRatio > pageRatio) {
    drawW = pageW;
    drawH = drawW / imgRatio;
    offsetY = (pageH - drawH) / 2;
  } else {
    drawH = pageH;
    drawW = drawH * imgRatio;
    offsetX = (pageW - drawW) / 2;
  }

  pdf.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH);

  const pdfBlob = pdf.output('blob');

  // คืน DOM
  if (next) parent.insertBefore(element, next); else parent.appendChild(element);
  wrapper.remove();
  Object.assign(element.style, orig);

  return pdfBlob;
},




async _uploadPdfBlob(pdfBlob) {
  const fd = new FormData();
  fd.append('file', pdfBlob, 'booking.pdf');
  const up = await axios.post(`${API_BASE}/api/upload`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return up.data?.fileUrl || '';
},

// สร้าง DOM ฟอร์ม (เวอร์ชันพรีวิว) แล้วแช่แข็งค่าฟอร์มก่อนแคปเจอร์
_buildEquipmentPdfNode(ctx) {
  const holder = document.createElement('div');
  holder.id = 'pdf-eq';
  Object.assign(holder.style, {
    background: '#fff',
    color: '#111',
    fontFamily: `'THSarabunNew','Sarabun','Noto Sans Thai', Tahoma, sans-serif`,
    width: '190mm',
    margin: '10mm auto',
    boxSizing: 'border-box',
    padding: '0',
  });

  holder.innerHTML = buildEquipmentApprovePreviewHTML(ctx);

  const fix = document.createElement('style');
  fix.textContent = `
    #pdf-eq, #pdf-eq *{
      box-sizing:border-box;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }

    /* โครงหน้ากระดาษ */
    #pdf-eq .eqp-preview{
   display:block;
   --top-shift: 10mm;           /* ลดจาก 30mm → 10mm ให้ก้อนขยับขึ้น */
 }
    /* ยกเลิกตัวคั่นด้านบน (เดิมใช้ ::before) */
    #pdf-eq .eqp-preview::before{ content:none; display:none; }

    /* ให้หัวติดขอบบน แล้วใส่ช่องว่างไว้ "หลังหัวข้อ" */
    #pdf-eq .eqp-head{ margin-top:0; }
    #pdf-eq .eqp-head::after{
      content:"";
      display:block;
      height:var(--top-shift);
    }

    /* กลางหน้า + ส่วนล่างให้ชิดตาราง */
    #pdf-eq .eqp-mid{
      margin-top:6mm;
    }
    #pdf-eq .eqp-bottom{
      margin-top:12px;             /* เดิม auto → ดันลงล่าง ตอนนี้ให้ติดตาราง */
      padding-right:0;
    }

    /* ส่วนหัว/เมตา/ย่อหน้า */
    #pdf-eq .eqp-head{ text-align:center; margin-bottom:10px; }
    #pdf-eq .eqp-head .t1{ font-weight:700; font-size:20px; }
    #pdf-eq .eqp-head .t2{ font-size:14px; margin-top:2px; }

    #pdf-eq .eqp-meta{ margin:8px 0 12px; }  /* ลดระยะห่างด้านบนของ meta */
    #pdf-eq .eqp-meta .right{ text-align:right; line-height:1.5; }

    #pdf-eq .eqp-par{
      font-size:16px; line-height:1.75; text-indent:2em;
      word-break:break-word; margin:10px 0 16px;
    }

    /* ตารางรายการ */
    #pdf-eq .eqp-table{ margin: 12px 0 10px !important; }
    #pdf-eq .eqp-table thead th{
      background:#213555; color:#fff; border:1px solid #e6e9f2; padding:10px 14px; text-align:center; font-weight:700;
    }
    #pdf-eq .eqp-table tbody td{ border:1px solid #e6e9f2; padding:10px 14px; vertical-align:top; }
    #pdf-eq .eqp-table th,#pdf-eq .eqp-table td{
      white-space:normal !important; word-break:break-word !important; overflow-wrap:anywhere !important;
    }
    #pdf-eq .eqp-table td.c{ text-align:center; }
    #pdf-eq .eqp-table td.l{ text-align:left; }
    #pdf-eq .eqp-table thead th:nth-child(1){ width:18mm !important; }
    #pdf-eq .eqp-table thead th:nth-child(3){ width:22mm !important; }
    #pdf-eq .eqp-table thead th:nth-child(4){ width:60mm !important; }

    /* ลายเซ็นผู้ยืม */
    #pdf-eq .eqp-sign{ margin:30px 0 !important; }   /* ← ปรับเป็น 30px ทั้งบนและล่าง */
    #pdf-eq .eqp-sign .sig-line{
      display:grid; grid-template-columns:auto minmax(0, 60mm) auto; column-gap:8px; align-items:center;
    }
    #pdf-eq .eqp-sign .sig-line .line{
      min-width:0; height:1.2em; border-bottom:1px dotted #666;
      display:flex; align-items:flex-end; justify-content:center; overflow:hidden;
    }
    #pdf-eq .eqp-sign .sig-line .name{
      padding:0 6px; max-width:100%; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; background:transparent;
    }

    /* กล่อง 2 ช่อง */
    #pdf-eq .eqp-boxes{ margin-top: 8px !important; }
    #pdf-eq .eqp-boxes .box{ border:1px solid #333; padding:12px 14px; min-height:176px; overflow:hidden; }
    #pdf-eq .eqp-boxes .title{ font-weight:700; text-align:center; padding-bottom:6px; margin-bottom:10px; border-bottom:1px solid #9aa3b2; }
    #pdf-eq .eqp-boxes .line{ margin:10px 0; }
    #pdf-eq .eqp-boxes .sign-inline{ display:grid; grid-template-columns:auto 1fr auto; column-gap:8px; align-items:center; margin-top:6px; }
    #pdf-eq .eqp-boxes .sign-inline .dotfill{ height:1.2em; border-bottom:1px dotted #666; }
    #pdf-eq .eqp-boxes .date{ text-align:center; margin-top:8px; }

    #pdf-eq .eqp-sign{
  display: grid;
  grid-template-columns: auto 240px auto;  /* คอลัมน์กลางกว้างเท่าเส้นเซ็น */
  column-gap: 8px;
  align-items: center;
  justify-content: end;
  text-align: unset;
}
#pdf-eq .eqp-sign .sig-line{
  display: contents;   /* flatten ให้ lab/line/role เป็น grid item */
}
#pdf-eq .eqp-sign .date{
  grid-column: 2;       /* ให้อยู่ใต้คอลัมน์ของเส้นเซ็น */
  justify-self: center; /* จัดกลางภายใน 240px */
  margin-top: 6px;
}

  `;
  holder.appendChild(fix);

  if (typeof this._freezeFormForPdf === 'function') this._freezeFormForPdf(holder);
  return holder;
},



    // มีค่าแบบไม่ว่างหรือไม่
hasValue(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  return true; // number, boolean, object, date -> นับว่ามีค่า
},

// ถือว่า "อนุมัติแล้ว" ถ้ามีค่าอย่างน้อย 1 ใน 5 ฟิลด์
isApprovedRec(rec) {
  return this.hasValue(rec?.approvedAt) ||
         this.hasValue(rec?.approvedBy) ||
         this.hasValue(rec?.approvedById) ||
         this.hasValue(rec?.thaiName_admin) ||
         this.hasValue(rec?.signaturePath_admin);
},


    // แปลง string เป็น Date แบบปลอดภัย (กัน timezone เพี้ยนกรณี 'YYYY-MM-DD')
parseToDate(d) {
  if (!d) return null;
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, dd] = s.split('-').map(Number);
    return new Date(y, m - 1, dd);
  }
  const dt = new Date(s);
  return isNaN(dt) ? null : dt;
},


// เวลาแบบไทยต่อท้าย "น."
formatTimeTH(t) {
  if (!t) return '-';
  const s = String(t).trim().replace(/\s*น\.?$/i, ''); // ตัด "น." ที่อาจติดมาด้วย
  // รูปแบบ H:mm, HH:mm, หรือมีวินาที
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) {
    const hh = m[1].padStart(2, '0'), mm = m[2];
    return `${hh}:${mm} น.`;
  }
  // ลอง parse เป็น Date เวลา
  const dt = new Date(`1970-01-01T${s}`);
  if (!isNaN(dt)) {
    const hhmm = dt.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${hhmm} น.`;
  }
  return `${s} น.`; // กรณี string แปลก ๆ
},

// ช่วงเวลาแบบไทย
formatTimeRangeTH(a, b) {
  const A = this.formatTimeTH(a), B = this.formatTimeTH(b);
  if (A === '-' && B === '-') return '-';
  if (A !== '-' && B !== '-') return `${A} - ${B}`;
  return A !== '-' ? A : B;
},




    normalizePdfUrl(raw) {
  if (!raw) return '';
  const u = String(raw).trim();
  // data URL / absolute ก็ปล่อยไป
  if (/^data:/i.test(u) || /^https?:\/\//i.test(u)) return u;

  try {
    // ✅ root-relative หรือ relative ให้ยึด BASE ของ API (พอร์ตแบ็กเอนด์)
    const base = (API_BASE || '').endsWith('/') ? API_BASE : (API_BASE + '/');
    return new URL(u, base).href;
  } catch {
    return u; // เผื่อแปลไม่สำเร็จ
  }
},

pickThaiNameFromUser(u) {
  if (!u) return '';
  // ลองคีย์ที่พบบ่อย
  const direct = [
    'thaiName','thai_name','name_th','fullname_th',
    'fullNameThai','thaiFullName','thai_fullname'
  ].map(k => u[k]).find(v => v && String(v).trim());
  if (direct) return String(direct).trim();

  // ประกอบชื่อจาก first/last แบบไทย
  const firstKeys = ['firstname_th','firstNameTh','firstname_thai','first_name_th','firstthai'];
  const lastKeys  = ['lastname_th','lastNameTh','lastname_thai','last_name_th','lastthai'];
  const first = firstKeys.map(k => u[k]).find(v => v && String(v).trim()) || '';
  const last  = lastKeys .map(k => u[k]).find(v => v && String(v).trim()) || '';
  return [first,last].filter(Boolean).join(' ').trim();
},
pickSignatureFromUser(u) {
  if (!u) return '';
  const sig = [
    'signaturePath','signature_path','signatureUrl','signatureURL',
    'sign_url','signature','signPath','sign_file'
  ].map(k => u[k]).find(v => v && String(v).trim());
  return sig ? String(sig).trim() : '';
},




pickPdfUrl(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const direct = list.find(h => h?.bookingPdfUrl || h?.booking_pdf_url);
  if (direct) return direct.bookingPdfUrl || direct.booking_pdf_url;
  const attach = list.find(h => Array.isArray(h?.attachment) && h.attachment[0]);
  return attach ? attach.attachment[0] : null;
},

getFileNameFromUrl(u, fallback = 'booking.pdf') {
  try {
    const { pathname } = new URL(u);
    const name = decodeURIComponent(pathname.split('/').pop() || '');
    return name || fallback;
  } catch { return fallback; }
},

async downloadBlobUrl(fileUrl, fallbackName) {
  try {
    // ลองโหลดด้วย https ก่อน (กัน mixed content)
    let finalUrl = fileUrl;
    let resp = await fetch(finalUrl, { credentials: 'include' });
    // ถ้าไม่ ok และเป็น https ลอง downgrade กลับ http (เผื่อ path ยังไม่รองรับ https)
    if (!resp.ok && /^https:\/\//i.test(finalUrl)) {
      const httpUrl = 'http://' + finalUrl.slice('https://'.length);
      resp = await fetch(httpUrl, { credentials: 'include' });
      if (resp.ok) finalUrl = httpUrl;
    }
    if (!resp.ok) throw new Error('download failed');

    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = this.getFileNameFromUrl(finalUrl, fallbackName);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    Swal.fire('ผิดพลาด', 'ไม่สามารถดาวน์โหลดไฟล์ได้', 'error');
  }
},

// โหลด PDF ตรง ๆ แบบเดียวกับ form_field4
async downloadBookingPdf(target) {
  const bookingId  = typeof target === 'string' ? target : (target?.booking_id || '');
  const typeFilter = typeof target === 'object' ? (target?.type || '') : '';

  if (!bookingId) {
    Swal.fire('ผิดพลาด','ไม่พบ booking_id สำหรับดาวน์โหลด PDF','error');
    return;
  }

  try {
    // 1) ดึง history (บางระบบไม่รองรับ query -> จึงกรองเองเสมอ)
    const resHist = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
    let list = Array.isArray(resHist.data) ? resHist.data : [];

    // 2) กรองด้วย booking_id แบบเข้ม และ type (ถ้ามี)
    list = list.filter(h => String(h?.booking_id || '') === String(bookingId));
    if (typeFilter) list = list.filter(h => (h?.type || '').toLowerCase() === typeFilter.toLowerCase());

    // 3) เผื่อมีหลายเอกสาร: เอาอันล่าสุดสุดก่อน
    list.sort((a,b) => new Date(b.updatedAt || b.createdAt || b.date || 0) - new Date(a.updatedAt || a.createdAt || a.date || 0));

    const picked = this.pickPdfUrl(list);
    const rawUrl = this.normalizePdfUrl(picked);

    if (!rawUrl) {
      Swal.fire('ผิดพลาด','ไม่พบ URL ของไฟล์ PDF สำหรับรายการนี้','error');
      return;
    }

    // 4) พยายามโหลดด้วยโปรโตคอลเดิมก่อน
    try {
      const resp = await fetch(rawUrl, { credentials: 'include' });
      if (!resp.ok) throw new Error('not ok');
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = this.getFileNameFromUrl(rawUrl, `booking_${bookingId}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      return;
    } catch (_) {
      // 5) ถ้าเป็น https แล้วโหลดไม่ได้ → ลองเปิด http ในแท็บใหม่ (เลี่ยง mixed‑content บล็อก)
      if (/^https:\/\//i.test(rawUrl)) {
        const httpUrl = 'http://' + rawUrl.slice('https://'.length);
        window.open(httpUrl, '_blank', 'noopener');  // top‑level navigation -> ไม่โดนบล็อก
        return;
      }
      // ถ้าเดิมเป็น http แล้วพัง ลองอัพเกรด https ดู
      if (/^http:\/\//i.test(rawUrl)) {
        const httpsUrl = 'https://' + rawUrl.slice('http://'.length);
        window.open(httpsUrl, '_blank', 'noopener');
        return;
      }
      throw _;
    }
  } catch (err) {
    console.error('downloadBookingPdf error:', err);
    Swal.fire('ผิดพลาด','ดาวน์โหลด PDF ไม่สำเร็จ','error');
  }
},



     _makeSnapshot(groups) {
    // เก็บเฉพาะ field สำคัญ เพื่อตรวจเปลี่ยนแปลง
    const lite = groups.map(g => ({
      t: g.type,
      b: g.booking_id || '',
      items: g.items.map(it => ({
        id: it.id,
        name: it.name,
        qty: it.quantity,
        date: it.date,
        s: it.startTime, e: it.endTime,
        u: it.user_id
      }))
    }));
    return JSON.stringify(lite);
  },

   // โหลด/จัดกลุ่มข้อมูลที่ต้องอนุมัติ (Field + Equipment)
async fetchAndGroup() {
  try {
    // 1) users map
    if (!Object.keys(this.userMap || {}).length) {
      const userRes = await axios.get(`${API_BASE}/api/users`);
      this.userMap = {};
      (userRes.data || []).forEach(u => {
        this.userMap[u.user_id] =
          (u.firstname && u.lastname) ? `${u.firstname} ${u.lastname}` : (u.name || u.user_id);
      });
    }

    // 2) โหลดทั้งหมด
    const res = await axios.get(`${API_BASE}/api/history/approve_field`);
    const raw = Array.isArray(res.data) ? res.data : [];

    // 3) map field
    const bookings = raw.map((h, idx) => {
      const activityName =
        h.name_active || h.name_activity || h.activity || h.activity_name || h.project_name || "";

      return {
        id: h._id?.$oid || h._id || idx + 1,
        booking_id: h.booking_id ?? "",

        type: String(h.type || "field").toLowerCase(),
        name: h.name ?? "-",
        zone: h.zone ?? "-",
        quantity: h.quantity ?? "-",

        requester: h.requester ?? "-",
        username_form: h.username_form ?? "-",
        id_form: h.id_form ?? "-",
        user_id: h.user_id ?? "-",
        proxyStudentName: h.proxyStudentName || h.proxy_name || "",
        proxyStudentId:   h.proxyStudentId   || h.proxy_id   || "",

        date: h.date ?? "-",
        since: h.since ?? "-",
        uptodate: h.uptodate ?? "-",
        startTime: h.startTime || "",
        endTime: h.endTime || "",

        aw: h.aw || "",
        tel: h.tel || "",
        reasons: h.reasons || h.reason || "",
        utilityRequest: h.utilityRequest || "",
        facilityRequest: h.facilityRequest || "",
        turnon_air: h.turnon_air || "",
        turnoff_air: h.turnoff_air || "",
        turnon_lights: h.turnon_lights || "",
        turnoff_lights: h.turnoff_lights || "",
        other: h.other || "",
        amphitheater: h.amphitheater || "",
        need_equipment: h.need_equipment || "",
        participants: h.participants || "",
        agency: h.agency || "",
        name_active: activityName,
        name_activity: activityName,
        restroom: h.restroom || "",

        attachment: Array.isArray(h.attachment) ? h.attachment : [],
        fileName: Array.isArray(h.fileName) ? h.fileName : [],
        bookingPdfUrl: h.bookingPdfUrl || h.booking_pdf_url || null,

        status: String(h.status || '').toLowerCase(),
        createdAt: h.createdAt?.$date || h.createdAt || h.created_at?.$date || h.created_at || null,
        updatedAt: h.updatedAt?.$date || h.updatedAt || h.updated_at?.$date || h.updated_at || null,

        // อนุมัติ
        approvedAt: h.approvedAt?.$date || h.approvedAt || null,
        approvedBy: h.approvedBy || '',
        approvedById: h.approvedById || '',
        thaiName_admin: h.thaiName_admin || '',
        signaturePath_admin: h.signaturePath_admin || '',

        receive_date:  h.receive_date?.$date || h.receive_date || null,
        receive_time:  h.receive_time || null,

        // step/steps
        step: Array.isArray(h.step) ? h.step : (Array.isArray(h.steps) ? h.steps : []),
      };
    });

    // 4) de-dup
    const bookingsClean = Array.from(
      new Map(bookings.map(b => [String(b.id), b])).values()
    );

    // 5) ยังไม่อนุมัติ
    const pendingOnlyRaw = bookingsClean.filter(b => !this.isFullyApproved(b));

    // 6) คัดเฉพาะที่ควรให้โผล่ในหน้า admin (REQUIRED_ROLE = 'admin')
    const REQUIRED_ROLE = 'admin';
const pendingOnly = pendingOnlyRaw.filter(b => {
  if (b.type === 'field') {
    // สนาม: ตามเดิม (ให้เห็นเฉพาะที่มี role admin ใน step)
    return this.hasRoleInStep(b, REQUIRED_ROLE);
  }

  // อุปกรณ์:
  const isSingle = this.isSingleDayItem(b);
  if (!isSingle) {
    // หลายวัน: ตามเดิม (มี admin ใน step)
    return this.hasRoleInStep(b, REQUIRED_ROLE);
  }

  // ยืมวันเดียว: แสดงเมื่อ "staff อนุมัติแล้ว" และ "admin ยังไม่อนุมัติ"
  const hasStaff = this.hasRoleIn(b, 'staff');
  const hasAdmin = this.hasRoleIn(b, 'admin');
  const staffOk  = this.isStaffApprovedInStep(b);
  const adminWait = this.isAdminNotApprovedInStep(b);

  // (สำคัญ) ไม่ต้องเช็ค status ว่า pending เสมอ — บางแบ็กเอนด์เซ็ต approved ไปก่อน
  return hasStaff && hasAdmin && staffOk && adminWait;
});

    // 7) จัดกลุ่ม
    const fieldGroups = pendingOnly
      .filter(b => b.type === 'field')
      .map(f => ({ type: 'field', booking_id: f.booking_id || '', items: [f] }));

    const equipBuckets = {};
    pendingOnly
      .filter(b => b.type === 'equipment')
      .forEach(eq => {
        const key = eq.booking_id || ('single_' + eq.id);
        if (!equipBuckets[key]) equipBuckets[key] = [];
        equipBuckets[key].push(eq);
      });
    const equipmentGroups = Object.entries(equipBuckets).map(([booking_id, items]) => ({
      type: 'equipment',
      booking_id,
      items
    }));

    // 8) รวม + เรียงเวลา
    const combined = [...fieldGroups, ...equipmentGroups];

    const safeToTime = (v) => {
      if (!v) return 0;
      const s = String(v).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d).getTime() || 0;
      }
      const t = new Date(s).getTime();
      return isNaN(t) ? 0 : t;
    };
    combined.sort((A, B) => {
      const a0 = A.items?.[0] || {};
      const b0 = B.items?.[0] || {};
      const ta = safeToTime(a0.updatedAt) || safeToTime(a0.createdAt) || safeToTime(a0.date);
      const tb = safeToTime(b0.updatedAt) || safeToTime(b0.createdAt) || safeToTime(b0.date);
      return tb - ta;
    });

    // 9) อัปเดต state เมื่อเปลี่ยนจริง
    const snap = this._makeSnapshot(combined);
    if (snap !== this._lastSnapshot) {
      this.grouped = combined;
      this._lastSnapshot = snap;
    }
  } catch (err) {
    console.error('โหลด/จัดกลุ่มข้อมูลอนุมัติไม่สำเร็จ:', err);
  }
},

async approveAll() {
  const targets = (this.filteredGrouped || []).filter(g =>
    (g.items || []).some(it => (it.status || 'pending') === 'pending' && !this.isApprovedRec(it))
  );
  if (!targets.length) {
    Swal.fire('ไม่มีรายการ', 'ไม่พบรายการที่อยู่ระหว่างรออนุมัติ', 'info');
    return;
  }

  const { isConfirmed } = await Swal.fire({
    title: 'ยืนยันอนุมัติทั้งหมด',
    html: `ต้องการอนุมัติ <b>${targets.length}</b> รายการใช่หรือไม่`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'อนุมัติทั้งหมด',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#10b981'
  });
  if (!isConfirmed) return;

  const adminUserId = localStorage.getItem('user_id') || '';
  const approvedAt = new Date().toISOString();

  Swal.fire({ title:'กำลังอนุมัติ...', didOpen:()=>Swal.showLoading(), allowOutsideClick:false });

  // host สำหรับ render PDF
  let pdfHost = document.getElementById('pdf-capture-approve');
  if (!pdfHost) {
    pdfHost = document.createElement('div');
    pdfHost.id = 'pdf-capture-approve';
    Object.assign(pdfHost.style, { position:'fixed', left:'-100000px', top:'-100000px', width:'0', height:'0' });
    document.body.appendChild(pdfHost);
  }

  // เก็บ URL PDF ต่อ booking_id ของ "อุปกรณ์"
  const eqPdfByBookingId = new Map();

  const seen = new Set();
  const tasks = [];

  for (const g of targets) {
    for (const it of g.items || []) {
      const key = String(it.id || it._id || '') || `${it.name}-${it.booking_id}-${it.startTime}-${it.endTime}`;
      if (seen.has(key)) continue; seen.add(key);

      const isField = String(it.type || g.type).toLowerCase() === 'field';
      const url = isField
        ? `${API_BASE}/api/history/${it.id}/approve_field`
        : `${API_BASE}/api/history/${it.id}/approve_equipment`;

      tasks.push((async () => {
        let payload = {};
        let pdfUrl = '';

        if (isField) {
          // Field → ทำ PDF ต่อรายการ
          try {
            const node = this._buildFieldPdfNode(
              it,
              this.secretary_choice || {},
              this.reason_admin || '',
              this.loggedThaiName || '',
              this.loggedSignatureUrl || ''
            );
            pdfHost.appendChild(node);
            const pdfBlob = await this._makeA4OnePageBlob(node);
            pdfUrl = await this._uploadPdfBlob(pdfBlob);
          } catch (e) {
            console.warn('bulk generate/upload pdf failed:', e);
          } finally {
            try { pdfHost.innerHTML = ''; } catch(_) {}
          }

          payload = {
            admin_id: adminUserId,
            approvedAt,
            reason_admin: this.reason_admin || '',
            secretary_choice: this.secretary_choice || {},
            thaiName_admin: this.loggedThaiName || '',
            signaturePath_admin: this.loggedSignatureUrl || '',
            bookingPdfUrl: pdfUrl || '',
            booking_pdf_url: pdfUrl || '',
            attachment: pdfUrl ? [pdfUrl] : []
          };
        } else {
          // อุปกรณ์ → ทำ PDF แค่ครั้งเดียวต่อ booking_id
          const bid = g.booking_id || it.booking_id || '';
          if (bid && !eqPdfByBookingId.has(bid)) {
            try {
              const ctx = await this._buildEquipmentCtxFromGroup(g);
              const node = this._buildEquipmentPdfNode(ctx);
              pdfHost.appendChild(node);
              const pdfBlob = await this._makeA4OnePageBlob(node);
              const upUrl = await this._uploadPdfBlob(pdfBlob);
              eqPdfByBookingId.set(bid, upUrl || '');
            } catch (e) {
              console.warn('bulk eq pdf failed:', e);
              eqPdfByBookingId.set(bid, '');
            } finally {
              try { pdfHost.innerHTML = ''; } catch(_) {}
            }
          }

          const u = bid ? (eqPdfByBookingId.get(bid) || '') : '';
          payload = {
            staff_id: adminUserId,
            approvedAt,
            bookingPdfUrl: u,
            booking_pdf_url: u,
            // attachment: u ? [u] : []
          };
        }

        const headers = { 'X-Idempotency-Key': `${key}-${approvedAt}` };
        return axios.patch(url, payload, { headers });
      })());
    }
  }

  const results = await Promise.allSettled(tasks);
  const failed = results.filter(r => r.status === 'rejected');

  try { await this.fetchAndGroup(); } catch(e){}

  if (!failed.length) {
  Swal.fire({
    icon: 'success',
    title: 'สำเร็จ',
    html: 'อนุมัติรายการทั้งหมดเรียบร้อย',
    width: 900,
    customClass: {
    popup: 'swal-success-wide',
    htmlContainer: 'swal-center-below',  // <-- ทำให้ข้อความอยู่กลางและต่ำลง
    title: 'swal-center-below'           // (ไม่ใส่ก็ได้ ถ้าอยากให้หัวข้อกลางด้วย)
  }
  });
} else {
  Swal.fire({
    icon: 'warning',
    title: 'สำเร็จบางส่วน',
    html: `อนุมัติสำเร็จ ${results.length - failed.length} รายการ, ล้มเหลว ${failed.length} รายการ`,
    width: 900,
    customClass: { popup: 'swal-success-wide' }
  });
}

},



// วางแทนที่เฉพาะฟังก์ชัน approveGroup ได้เลย
async approveGroup(group) {
  const groupType = String(group.type || group.items?.[0]?.type || "").toLowerCase().trim();
  const isField = groupType === "field";
  const isEquipment = groupType === "equipment";
  const MAX_CH = 110;

  // โหลด roles (optional)
  let selectedRoles = [];
  try {
    const rs = await axios.get(`${API_BASE}/api/settings/approval_roles`);
    selectedRoles = Array.isArray(rs.data?.value)
      ? rs.data.value.map(r => String(r).toLowerCase())
      : [];
  } catch (e) {
    console.warn("โหลด approval_roles ไม่สำเร็จ:", e);
  }

  // role ปัจจุบัน
  const currentRole =
    (localStorage.getItem("position") ||
     localStorage.getItem("role") ||
     "admin").toLowerCase();

  const buildBaseStep = () => selectedRoles.map(r => ({ role: r, approve: null }));

  // helper ตรวจค่าว่างและแปลงวันที่
  const norm = v => (v == null ? "" : String(v).trim());
  const isEmptyDate = v => {
    const s = norm(v).toLowerCase();
    return s === "" || s === "-" || s === "null" || s === "undefined";
  };
  const sameDay = (a, b) => {
    const da = this.parseToDate(norm(a));
    const db = this.parseToDate(norm(b));
    if (!da || !db || isNaN(+da) || isNaN(+db)) return false;
    return da.getFullYear()===db.getFullYear() &&
           da.getMonth()===db.getMonth() &&
           da.getDate()===db.getDate();
  };

  // reset ฟิลด์ที่ใช้กับสนาม
  this.secretary_choice = null;
  this.reason_admin = '';

  // ===== FIELD: ทำงานตามเดิม (พรีวิว + สร้าง PDF) =====
  if (isField) {
    const it = group.items?.[0] || {};
    const reqKey = it.user_id || it.id_form || '';
    const reqSig = this.userSigMap?.[reqKey] || '';
    const html = buildFieldFormPreviewV2(it, this.loggedThaiName, this.loggedSignatureUrl, reqSig);

    const result = await Swal.fire({
      title: "ยืนยันอนุมัติใช้งานสถานที่",
      html,
      width: 1100,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "ยืนยันอนุมัติ",
      cancelButtonText: "ยกเลิก",
      customClass: {
        popup: 'swal-form-approve',
        htmlContainer: 'swal-center-below',
        title: 'swal-center-below'
      },
      didOpen: () => {
        const p = Swal.getPopup();
        const chk = p.querySelector('#sec_other_chk');
        const box = p.querySelector('#sec_other_reason');
        if (!box) return;

        const ensureChecked = () => { if (chk && !chk.checked) chk.checked = true; };

        const isTextarea = ('value' in box);
        const getVal = el => isTextarea ? (el.value || '') : (el.textContent || '');
        const setVal = (el, v) => {
          if (isTextarea) el.value = v;
          else {
            el.textContent = v;
            try {
              const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
              const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
            } catch (_){}
          }
        };

        const clamp = () => {
          let v = getVal(box);
          if (v.length > MAX_CH) setVal(box, v.slice(0, MAX_CH));
        };

        box.addEventListener('keydown', (e) => {
          const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Tab','Enter'];
          if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
          const cur = getVal(box);
          let hasSelection = false;
          if (isTextarea) hasSelection = (box.selectionStart !== box.selectionEnd);
          else {
            const sel = window.getSelection();
            if (sel && sel.rangeCount) hasSelection = sel.toString().length > 0;
          }
          if (cur.length >= MAX_CH && !hasSelection) e.preventDefault();
        });

        box.addEventListener('focus', ensureChecked);
        box.addEventListener('input', () => { ensureChecked(); clamp(); });
        box.addEventListener('paste', () => setTimeout(() => { ensureChecked(); clamp(); }, 0));

        if (this.reason_admin) {
          setVal(box, String(this.reason_admin).slice(0, MAX_CH));
          if (chk) chk.checked = true;
        }
      },
      preConfirm: () => {
        const p = Swal.getPopup();
        const chk = p.querySelector('#sec_other_chk');
        const box = p.querySelector('#sec_other_reason');

        let val = '';
        if (box) val = ('value' in box) ? box.value : (box.textContent || '');
        const text = String(val || '').slice(0, MAX_CH).trim();
        const otherChecked = !!chk?.checked || text.length > 0;

        this.reason_admin = otherChecked ? text : '';
        this.secretary_choice = {
          to_head: !!p.querySelector('#sec_to_head')?.checked,
          for_consider: !!p.querySelector('#sec_for_consider')?.checked,
          other_checked: otherChecked
        };
        return true;
      }
    });
    if (!result.isConfirmed) return;

  } else {
    // ===== EQUIPMENT =====
    const items = Array.isArray(group.items) ? group.items : [];

    // ตรวจ "ยืมวันเดียว"
    const isSingleDay = items.every(it => {
      const s = norm(it.since), u = norm(it.uptodate);
      if (isEmptyDate(s) && isEmptyDate(u)) return true;
      if (!isEmptyDate(s) && !isEmptyDate(u) && sameDay(s, u)) return true;
      return false;
    });

    if (isSingleDay) {
      // ---- ยืมวันเดียว: SweetAlert สั้น ๆ ----
      const ask = await Swal.fire({
        title: 'ยืนยันอนุมัติยืมอุปกรณ์ (วันเดียว)',
        text: 'ต้องการอนุมัติรายการนี้ใช่ไหม?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'อนุมัติ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#999'
      });
      if (!ask.isConfirmed) return;

      const adminUserId = localStorage.getItem("user_id") || "";
      const approveDate = new Date().toISOString();
      Swal.fire({ title: "กำลังดำเนินการ...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });

      // กันซ้ำ
      const seen = new Set(), uniqItems = [];
      for (const it of items) {
        const key = String(it.id ?? it._id ?? "") || `${it.name}-${it.booking_id}-${it.startTime}-${it.endTime}`;
        if (!seen.has(key)) { seen.add(key); uniqItems.push(it); }
      }

      // step: จาก settings และติ๊กเฉพาะ role ผู้กด
      const baseStep = buildBaseStep();
      const step = baseStep.map(s => ({ ...s }));
      const meIdx = step.findIndex(s => s.role === currentRole);
      if (meIdx > -1) step[meIdx].approve = true;

      const results = await Promise.allSettled(uniqItems.map(item => {
        const url = `${API_BASE}/api/history/${item.id}/approve_equipment`;
        const headers = { "X-Idempotency-Key": `${item.id}-${item.booking_id || ""}-${approveDate}` };
        const payload = {
          admin_id: adminUserId,
          approvedAt: approveDate,
          step
        };
        return axios.patch(url, payload, { headers });
      }));

      const failed = results.filter(r => r.status === 'rejected');
      try { await this.fetchAndGroup(); } catch (_) {}

      if (!failed.length) {
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          html: 'อนุมัติเรียบร้อย',
          width: 900,
          customClass: {
            popup: 'swal-success-wide',
            htmlContainer: 'swal-center-below',
            title: 'swal-center-below'
          }
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'สำเร็จบางส่วน',
          html: `อนุมัติสำเร็จ ${results.length - failed.length} รายการ, ล้มเหลว ${failed.length} รายการ`,
          width: 900,
          customClass: { popup: 'swal-success-wide' }
        });
      }
      return;
    }

    // ---- ยืมหลายวัน: โหลด users → ทำ usersEmailMap ก่อนสร้าง ctx ----
    if (!this.usersEmailMap || !Object.keys(this.usersEmailMap).length) {
      try {
        const { data } = await axios.get(`${API_BASE}/api/users`);
        this.usersEmailMap = Object.fromEntries(
          (Array.isArray(data) ? data : []).map(u => [String(u.user_id), u.email || ""])
        );
      } catch (e) {
        console.warn("โหลด users สำหรับ usersEmailMap ไม่สำเร็จ:", e);
        this.usersEmailMap = this.usersEmailMap || {};
      }
    }

    const ctx = this._buildEquipmentCtxFromGroup(group);
    const html = buildEquipmentApprovePreviewHTML(ctx);

    const result = await Swal.fire({
      title: 'ยืนยันอนุมัติยืมอุปกรณ์',
      html,
      width: 1100,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันอนุมัติ',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'swal-equip-approve' }
    });
    if (!result.isConfirmed) return;

    let pdfHost = document.getElementById('pdf-capture-approve');
    if (!pdfHost) {
      pdfHost = document.createElement('div');
      pdfHost.id = 'pdf-capture-approve';
      Object.assign(pdfHost.style, { position:'fixed', left:'-100000px', top:'-100000px', width:'0', height:'0' });
      document.body.appendChild(pdfHost);
    }
    this.__eqPdfUrl = '';
    try {
      const node = this._buildEquipmentPdfNode(ctx);
      pdfHost.appendChild(node);
      const pdfBlob = await this._makeA4OnePageBlob(node);
      this.__eqPdfUrl = await this._uploadPdfBlob(pdfBlob);
    } catch (e) {
      console.warn('Generate/Upload equipment PDF failed:', e);
      this.__eqPdfUrl = '';
    } finally {
      try { pdfHost.innerHTML = ''; } catch(_) {}
    }
  }

  // ===== บันทึกอนุมัติ (สนาม + อุปกรณ์หลายวัน) =====
  const adminUserId = localStorage.getItem("user_id") || "";
  const approveDate = new Date().toISOString();
  Swal.fire({ title: "กำลังดำเนินการ...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });

  const seen = new Set(), uniqItems = [];
  for (const it of group.items || []) {
    const key = String(it.id ?? it._id ?? "") || `${it.name}-${it.booking_id}-${it.startTime}-${it.endTime}`;
    if (!seen.has(key)) { seen.add(key); uniqItems.push(it); }
  }

  let pdfHost = document.getElementById('pdf-capture-approve');
  if (!pdfHost) {
    pdfHost = document.createElement('div');
    pdfHost.id = 'pdf-capture-approve';
    Object.assign(pdfHost.style, { position:'fixed', left:'-100000px', top:'-100000px', width:'0', height:'0' });
    document.body.appendChild(pdfHost);
  }

  const ok = [], fail = [];
  for (const item of uniqItems) {
    const isFieldItem = String(item.type || group.type).toLowerCase() === "field";
    const url = isFieldItem
      ? `${API_BASE}/api/history/${item.id}/approve_field`
      : `${API_BASE}/api/history/${item.id}/approve_equipment`;

    const baseStep = buildBaseStep();
    const step = baseStep.map(s => ({ ...s }));
    const meIdx = step.findIndex(s => s.role === currentRole);
    if (meIdx > -1) step[meIdx].approve = true;

    let payload;

    if (isFieldItem) {
      // FIELD: gen+upload PDF รายการละ 1
      let pdfUrl = '';
      try {
        const node = this._buildFieldPdfNode(
          item,
          this.secretary_choice,
          this.reason_admin,
          this.loggedThaiName || '',
          this.loggedSignatureUrl || ''
        );
        const boxPdf = node.querySelector('#sec_other_reason') ||
                       node.querySelector('[name="sec_other_reason"]') ||
                       node.querySelector('.sec_other_reason');
        if (boxPdf) {
          const reason = String(this.reason_admin || '').slice(0, MAX_CH);
          if ('value' in boxPdf) boxPdf.value = reason;
          else {
            const repl = document.createElement('div');
            repl.className = 'mfu-input';
            repl.style.cssText = [
              'border:1px solid #cbd5e1','border-radius:6px','padding:6px 8px',
              'line-height:1.6','min-height:36px','white-space:pre-wrap',
              'word-break:break-word','overflow-wrap:anywhere'
            ].join(';');
            repl.textContent = reason || '-';
            boxPdf.replaceWith(repl);
          }
        }
        const chkPdf = node.querySelector('#sec_other_chk');
        if (chkPdf) chkPdf.checked = true;

        pdfHost.appendChild(node);
        const pdfBlob = await this._makeA4OnePageBlob(node);
        pdfUrl = await this._uploadPdfBlob(pdfBlob);
      } catch (e) {
        console.warn('Generate/Upload field PDF failed:', e);
      } finally {
        try { pdfHost.innerHTML = ''; } catch(_) {}
      }

      payload = {
        admin_id: adminUserId,
        approvedAt: approveDate,
        reason_admin: this.reason_admin || '',
        secretary_choice: this.secretary_choice || {},
        thaiName_admin: this.loggedThaiName || '',
        signaturePath_admin: this.loggedSignatureUrl || '',
        bookingPdfUrl: pdfUrl || '',
        booking_pdf_url: pdfUrl || '',
        step
      };
    } else {
      // อุปกรณ์ (เส้นทางนี้คือ “ยืมหลายวัน”)
      payload = {
        admin_id: adminUserId,
        approvedAt: approveDate,
        bookingPdfUrl: this.__eqPdfUrl || '',
        booking_pdf_url: this.__eqPdfUrl || '',
        step
      };
    }

    const headers = { "X-Idempotency-Key": `${item.id}-${item.booking_id || ""}-${approveDate}` };
    try {
      const res = await axios.patch(url, payload, { headers });
      ok.push({ item, res });
    } catch (err) {
      fail.push({ item, err });
    }
  }

  try { await this.fetchAndGroup(); } catch (_) {}

  if (ok.length) {
    Swal.fire({
      icon: 'success',
      title: 'สำเร็จ',
      html: isEquipment ? 'อนุมัติอุปกรณ์เรียบร้อย' : 'อนุมัติเรียบร้อยแล้ว',
      width: 900,
      customClass: {
        popup: 'swal-success-wide',
        htmlContainer: 'swal-center-below',
        title: 'swal-center-below'
      }
    });
  } else {
    const e = fail[0]?.err;
    const status = e?.response?.status;
    const msg = e?.response?.data?.message || e?.message || 'ไม่สามารถอนุมัติได้';
    Swal.fire({
      icon: 'error',
      title: 'ผิดพลาด',
      html: `${msg}${status ? ` (รหัส ${status})` : ''}`,
      width: 700
    });
  }
},


async cancelGroup(group) {
  // กล่องยืนยัน + ช่องกรอกหมายเหตุ (บังคับกรอก)
  const { isConfirmed, value } = await Swal.fire({
    title: 'ไม่อนุมัติรายการนี้',
    html: 'ยืนยันการไม่อนุมัติสำหรับรายการนี้',
    icon: 'warning',
    input: 'textarea',
    inputPlaceholder: 'ระบุหมายเหตุ (จำเป็นต้องกรอก)',
    inputAttributes: { 'aria-label': 'หมายเหตุ', rows: 4 },
    inputValidator: (v) => {
      if (!v || !v.trim()) return 'กรุณากรอกหมายเหตุ';
    },
    showCancelButton: true,
    confirmButtonText: 'ยืนยันไม่อนุมัติ',
    cancelButtonText: 'กลับ',
    confirmButtonColor: '#ff4d4f',
    cancelButtonColor: '#999',
    customClass: {
      htmlContainer: 'swal-center-text',
      title: 'swal-center-title',
    },
  });
  if (!isConfirmed) return;

  const remark = value.trim();

  // ผู้ปฏิเสธ
  const adminId = localStorage.getItem('user_id') || '';
  const adminName =
    (localStorage.getItem('firstname') && localStorage.getItem('lastname'))
      ? `${localStorage.getItem('firstname')} ${localStorage.getItem('lastname')}`
      : (localStorage.getItem('name') || this.userMap?.[adminId] || adminId);

  const disapprovedAt = new Date().toISOString();

  Swal.fire({
    title: 'กำลังดำเนินการ...',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  try {
    // ส่ง patch ให้ทุกแถวใน group (กรณี equipment มีหลายชิ้น)
    const calls = group.items.map(item => {
      const isField = (item.type || group.type) === 'field';
      const url = isField
        ? `${API_BASE}/api/history/${item.id}/disapprove_field`
        : `${API_BASE}/api/history/${item.id}/disapprove_equipment`;

      // แนบ remark ไปกับ payload ของทั้งสองประเภท
      const payload = isField
        ? {
            admin_id: adminId,
            disapprovedBy: adminName,   // เก็บชื่อผู้ปฏิเสธ (ไม่บังคับ ลบได้ถ้าไม่ต้องการ)
            disapprovedById: adminId,
            disapprovedAt,
            remark,                     // ⬅️ สำคัญ: เก็บหมายเหตุ
          }
        : {
            staff_id: adminId,
            disapprovedBy: adminName,   // ตามที่กำหนดสำหรับ equipment
            disapprovedById: adminId,
            disapprovedAt,
            remark,                     // ⬅️ สำคัญ: เก็บหมายเหตุ
          };

      return axios.patch(url, payload)
        .then(res => ({ ok: true, res, item }))
        .catch(err => ({ ok: false, err, item }));
    });

    const results = await Promise.all(calls);
    const ok = results.filter(r => r.ok);
    const fail = results.filter(r => !r.ok);

    try { await this.fetchAndGroup(); } catch (e) {}

    if (ok.length > 0) {
      Swal.fire('สำเร็จ', 'บันทึกการไม่อนุมัติเรียบร้อยแล้ว', 'success');
      if (fail.length) {
        console.warn('บางรายการไม่อนุมัติไม่สำเร็จ:', fail.map(f => ({
          id: f.item?.id,
          name: f.item?.name,
          status: f.err?.response?.status,
          msg: f.err?.response?.data?.message || f.err?.message
        })));
      }
    } else {
      const e = fail[0]?.err;
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'ไม่สามารถทำรายการไม่อนุมัติได้';
      Swal.fire('ผิดพลาด', `${msg}${status ? ` (รหัส ${status})` : ''}`, 'error');
    }
  } catch (err) {
    console.error('cancelGroup error:', err);
    Swal.fire('ผิดพลาด', 'ไม่สามารถทำรายการไม่อนุมัติได้', 'error');
  }
}
,


  // วันที่แบบไทย: วัน/เดือน/ปี พ.ศ. และใช้เลขอารบิก
formatDate(dateInput) {
  const d = this.parseToDate(dateInput);
  if (!d) return '-';
  return d.toLocaleDateString('th-TH-u-nu-latn', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }); // เช่น 23/08/2568
},


    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed
    },
     
    toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    this.lastSeenTimestamp = Date.now();
    localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(this.lastSeenTimestamp));
    this.unreadCount = 0; // เคลียร์ทันที และจะไม่กลับมาเพราะคำนวณจาก timestamp
  }
},
closeNotifications() { this.showNotifications = false; },

pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
},

    handleClickOutside(event) {
      const notifDropdown = document.querySelector('.notification-dropdown')
      const notifBtn = document.querySelector('.notification-btn')
      if (
        notifDropdown &&
        !notifDropdown.contains(event.target) &&
        notifBtn &&
        !notifBtn.contains(event.target)
      ) {
        this.closeNotifications()
      }
    },
    async fetchNotifications() {
  try {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.pruneOldNotifications();

    const res = await axios.get(`${API_BASE}/api/history/approve_field`);
    const data = Array.isArray(res.data) ? res.data : [];

    // role ที่ต้องการสำหรับ noti
    const REQUIRED_ROLE = 'admin';
    // ถ้าอยากอิงบทบาทผู้ล็อกอิน ให้ใช้:
    // const REQUIRED_ROLE = (localStorage.getItem('position') || localStorage.getItem('role') || 'admin').toLowerCase();

    // กรอง pending + type ถูกต้อง + step มี role ที่ต้องการ
    const pendings = data.filter(item =>
      String(item.status || '').toLowerCase() === 'pending' &&
      (String(item.type || '').toLowerCase() === 'field' || String(item.type || '').toLowerCase() === 'equipment') &&
      this.hasRoleInStep(item, REQUIRED_ROLE)
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
          message: String(item.type || '').toLowerCase() === 'field'
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

    // นับ unread จาก timestamp > lastSeenTimestamp
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch (err) {
    // เงียบได้ ไม่ต้องแจ้ง error
  }
},


handleResize() {
    this.isMobile = window.innerWidth <= 800;
    if (!this.isMobile) this.isSidebarClosed = false;
  },

  async viewAttachment(group) {
  try {
    const bookingId = group.booking_id;
    if (!bookingId) {
      Swal.fire('ผิดพลาด','ไม่พบ booking_id สำหรับดูไฟล์แนบ','error');
      return;
    }

    // 1) ดึง history ทั้งหมดของ booking_id นี้
    const resHist = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
    let list = Array.isArray(resHist.data) ? resHist.data : [];
    list = list.filter(h => String(h?.booking_id || '') === String(bookingId));

    // 2) รวมไฟล์แนบจากทุกแถว + map กับ fileName ตาม index
    const files = [];
    const seen = new Set(); // กันซ้ำโดย URL
    const safeName = (name, url) => {
      if (name && typeof name === 'string') return name;
      try {
        const { pathname } = new URL(url);
        const n = decodeURIComponent(pathname.split('/').pop() || '');
        return n || 'attachment';
      } catch {
        return 'attachment';
      }
    };

    list.forEach(h => {
      const atts = Array.isArray(h?.attachment) ? h.attachment : [];
      const names = Array.isArray(h?.fileName) ? h.fileName : [];
      atts.forEach((u, i) => {
        const url = this.normalizePdfUrl(u);
        if (!url) return;
        if (seen.has(url)) return;
        seen.add(url);
        files.push({
          url,
          name: safeName(names[i], url)
        });
      });
    });

    if (files.length === 0) {
      Swal.fire('ไม่มีไฟล์แนบ', 'ไม่พบไฟล์แนบสำหรับรายการนี้', 'warning');
      return;
    }

    // ถ้ามีไฟล์เดียว เปิดทันที
    if (files.length === 1) {
      window.open(files[0].url, '_blank', 'noopener');
      return;
    }

    // 3) แสดงรายการให้เลือกเปิด
    const itemHtml = files.map((f, idx) => `
      <li style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed #e5e7eb;">
        <div style="flex:1;word-break:break-word;text-align:left;">
          ${idx + 1}. ${f.name}
        </div>
        <div>
          <button class="open-attach" data-idx="${idx}"
            style="background:#3a7ca5;color:#fff;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;">
            เปิด
          </button>
        </div>
      </li>
    `).join('');

    Swal.fire({
      title: 'ไฟล์แนบทั้งหมด',
      html: `
        <div style="text-align:left;max-height:60vh;overflow:auto;padding:4px 2px;">
          <ul style="list-style:none;margin:0;padding:0;">
            ${itemHtml}
          </ul>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#3085d6',
      didOpen: () => {
        // bind ปุ่ม "เปิด" แต่ละรายการ
        document.querySelectorAll('.open-attach').forEach(btn => {
          btn.addEventListener('click', () => {
            const i = Number(btn.getAttribute('data-idx'));
            const f = files[i];
            if (f?.url) window.open(f.url, '_blank', 'noopener');
          });
        });
      }
    });
  } catch (err) {
    console.error('viewAttachment error:', err);
    Swal.fire('ผิดพลาด','ไม่สามารถดึงไฟล์แนบได้','error');
  }
},

isSameDay(a, b) {
  const A = this.parseToDate(a), B = this.parseToDate(b);
  if (!A || !B) return true; // ถ้าไม่มีวันครบ ถือว่าไม่หลายวัน
  return A.getFullYear() === B.getFullYear() &&
         A.getMonth() === B.getMonth() &&
         A.getDate() === B.getDate();
},
isMultiDayEquipment(item) {
  if (!item || (item.type || '').toLowerCase() !== 'equipment') return false;
  const A = this.parseToDate(item.since);
  const B = this.parseToDate(item.uptodate);
  if (!A || !B) return false;       // ต้องมีทั้ง since/uptodate ถึงนับหลายวัน
  return !this.isSameDay(A, B);     // ต่างวัน => หลายวัน
},



    
 async detailGroup(group) {
  const esc = (s) => String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');

  const tableWrap = (innerHtml, showPdf, showAttach) => `
    <div class="swal-detail-wrap">
      ${innerHtml}
      <div class="swal-detail-actions">
        ${showPdf ? `<button id="pdf-btn" type="button">ดูฟอร์ม PDF</button>` : ``}
        ${showAttach ? `<button id="attach-btn" type="button">ดูไฟล์แนบ</button>` : ``}
      </div>
    </div>
  `;

  // แปลง URL ให้เป็น http เสมอ (รองรับ path สัมพัทธ์ และ protocol-relative)
  const toHttpUrl = (u) => {
    const s = String(u || '').trim();
    if (!s) return '';
    if (/^\/\//.test(s)) return 'http:' + s; // //host/path -> http://host/path
    if (!/^https?:\/\//i.test(s)) {          // /uploads/.. หรือ uploads/..
      const { hostname, port } = window.location;
      const hostport = port ? `${hostname}:${port}` : hostname;
      const path = s.startsWith('/') ? s : '/' + s;
      return `http://${hostport}${path}`;
    }
    return s.replace(/^https:/i, 'http:');    // https:// -> http://
  };

  // ===== helper: ดึงอีเมลจาก users โดย "ต้อง" user_id ตรงเท่านั้น =====
  const resolveEmailByUserIdStrict = async (uid) => {
    const norm = (x) => String(x ?? '').trim();
    const key = norm(uid);
    if (!key) return '-';

    this.userEmailExact = this.userEmailExact || {};
    if (this.userEmailExact[key]) return this.userEmailExact[key];

    const tryUrls = [
      `${API_BASE}/api/users?user_id=${encodeURIComponent(key)}`,
      `${API_BASE}/api/users/by-userid/${encodeURIComponent(key)}`,
      `${API_BASE}/api/users/${encodeURIComponent(key)}`
    ];

    const pickExact = (data) => {
      if (Array.isArray(data)) return data.find(u => norm(u?.user_id) === key) || null;
      if (data && typeof data === 'object') return norm(data.user_id) === key ? data : null;
      return null;
    };

    for (const url of tryUrls) {
      try {
        const res = await axios.get(url);
        const user = pickExact(res?.data);
        if (user) {
          const email = norm(user.email || user.user_email || user.mail);
          if (email) {
            this.userEmailExact[key] = email;
            return email;
          }
        }
      } catch (_) { /* ignore, try next */ }
    }
    return '-';
  };

  // ===== Field =====
  if (group.type === 'field') {
    const it = group.items?.[0] || {};
    const zone = (it.zone && it.zone !== '-' && it.zone !== '') ? it.zone : '-';

    // ผู้ขอใช้
    const requesterBase = this.userMap?.[it.user_id] || it.requester || it.user_id || '-';
    const requester = it.username_form || requesterBase;

    // อีเมลจาก user_id เท่านั้น
    const uid = String(it.user_id || it._user_id || it.id_form || '').trim();
    const email = await resolveEmailByUserIdStrict(uid);

    const table = `
      <table class="swal-detail-table">
        <tbody>
          <tr><th>ชื่อสนาม</th><td>${esc(it.name || '-')}</td></tr>
          <tr><th>โซน</th><td>${esc(zone)}</td></tr>
          <tr><th>ชื่อผู้ขอใช้</th><td>${esc(requester)}</td></tr>
          <tr><th>อีเมล</th><td>${esc(email)}</td></tr>
          <tr><th>วันที่ทำรายการ</th>
            <td><span class="nowrap">${it.date ? esc(this.formatDate(it.date)) : '-'}</span></td>
          </tr>
          <tr><th>ช่วงวันที่ขอใช้</th>
            <td><span class="nowrap">
              ${esc(it.since ? this.formatDate(it.since) : '-')} - ${esc(it.uptodate ? this.formatDate(it.uptodate) : '-')}
            </span></td>
          </tr>
          <tr><th>ช่วงเวลา</th>
            <td><span class="nowrap">${esc(this.formatTimeRangeTH(it.startTime, it.endTime))}</span></td>
          </tr>
        </tbody>
      </table>
    `;

    Swal.fire({
      title: 'รายละเอียดสนาม',
      html: tableWrap(table, true, true),
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#3085d6',
      customClass: { popup: 'swal-wide' },
      didOpen: () => {
        // ปุ่ม PDF: เปิด "แท็บใหม่" แบบ http เท่านั้น และเปิดแค่ครั้งเดียว
        const btnPdf = document.getElementById('pdf-btn');
        if (btnPdf) {
          btnPdf.addEventListener('click', async (e) => {
            e.preventDefault(); e.stopPropagation();
            try {
              // หา URL จาก item/group ก่อน
              let url =
                it.bookingPdfUrl || it.pdfUrl || it.fileUrl ||
                group.bookingPdfUrl || group.fileUrl || '';

              // fallback: ค้นจาก history ด้วย booking_id
              if (!url) {
                const bookingId = group.booking_id || it.booking_id || it._id;
                if (bookingId) {
                  const res = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
                  const arr = Array.isArray(res.data) ? res.data : [];
                  // เอารายการ type 'field' ที่มีไฟล์ และล่าสุด
                  arr.sort((a,b) =>
                    new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
                  );
                  const rec = arr.find(r =>
                    String(r.type).toLowerCase() === 'field' &&
                    (r.bookingPdfUrl || r.fileUrl || r.pdfUrl)
                  );
                  url = rec?.bookingPdfUrl || rec?.fileUrl || rec?.pdfUrl || '';
                }
              }

              if (!url) {
                await Swal.fire('ไม่พบไฟล์ PDF', 'รายการนี้ยังไม่มีไฟล์แนบ PDF', 'warning');
                return;
              }

              const httpUrl = toHttpUrl(url); // บังคับ http
              const a = document.createElement('a');
              a.href = httpUrl;
              a.target = '_blank';
              a.rel = 'noopener';
              document.body.appendChild(a);
              a.click();      // เปิดแท็บใหม่ 1 ครั้ง
              a.remove();
            } catch (err) {
              console.error(err);
              Swal.fire('เปิดไฟล์ไม่ได้', 'เกิดข้อผิดพลาดระหว่างเปิดไฟล์ PDF', 'error');
            }
          }, { once: true }); // กันคลิกซ้ำแล้วเปิดหลายแท็บ
        }

        const btnAttach = document.getElementById('attach-btn');
        if (btnAttach) btnAttach.addEventListener('click', () => this.viewAttachment(group));
      }
    });

  } else {
    // ===== Equipment =====
    const bookingId = group.booking_id || group.items?.[0]?.booking_id || null;

    // รวมจำนวนต่อชื่ออุปกรณ์
    const merged = new Map();
    (group.items || []).forEach(it => {
      const name = it?.name || '-';
      const qty  = Number(it?.quantity ?? 0) || 0;
      merged.set(name, (merged.get(name) || 0) + qty);
    });

    // ค่าแสดงผล
    let requester      = '-';
    let requesterEmail = '-';
    let dateBorrow     = '-';
    let dateRange      = '-';

    // ใช้ user_id จาก history ของรายการแรก -> หาอีเมล
    const item0 = group.items?.[0] || {};
    const uid0  = String(item0.user_id || item0._user_id || item0.id_form || '').trim();
    requesterEmail = await resolveEmailByUserIdStrict(uid0);

    // ชื่อผู้ขอใช้ + วันที่ จาก history
    if (bookingId) {
      try {
        const res = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
        let list = Array.isArray(res.data) ? res.data : [];
        list = list
          .filter(h => String(h?.booking_id || '') === String(bookingId))
          .filter(h => (h?.type || '').toLowerCase() === 'equipment')
          .sort((a,b) => new Date(b.updatedAt || b.createdAt || b.date || 0) - new Date(a.updatedAt || a.createdAt || a.date || 0));

        const recUser = list.find(h => (h?.username_form || '').trim());
        if (recUser) requester = String(recUser.username_form).trim();

        const recDate = list.find(h => h?.createdAt || h?.date || h?.since || h?.uptodate) || list[0];
        if (recDate) {
          dateBorrow = recDate?.createdAt
            ? this.formatDate(recDate.createdAt)
            : (recDate?.date ? this.formatDate(recDate.date) : '-');

          const since = recDate?.since ? this.formatDate(recDate.since) : '-';
          const upto  = recDate?.uptodate ? this.formatDate(recDate.uptodate) : '-';
          dateRange   = `${since} - ${upto}`;
        }
      } catch (_) { /* ใช้ค่า default */ }
    }

    const rowsData = Array.from(merged.entries()).map(([name, qty], idx) => ({
      idx: idx + 1,
      name,
      quantity: qty,
      requester,
      requesterEmail,
      dateBorrow,
      dateRange
    }));

    const rowsHtml = rowsData.map(r => `
      <tr>
        <td class="c">${r.idx}</td>
        <td class="col-name">${esc(r.name)}</td>
        <td class="c col-qty">${esc(r.quantity)}</td>
        <td class="col-id">${esc(r.requesterEmail)}</td>
        <td class="col-requester">${esc(r.requester)}</td>
        <td class="c nowrap">${esc(r.dateBorrow)}</td>
        <td class="c col-period" title="${esc(r.dateRange)}">${esc(r.dateRange)}</td>
      </tr>
    `).join('');

    const table = `
      <table class="swal-detail-table items">
        <thead>
          <tr>
            <th style="width:64px">ลำดับ</th>
            <th class="col-name">รายการ</th>
            <th class="col-qty">จำนวน</th>
            <th class="col-id">อีเมล</th>
            <th class="col-requester">ผู้ขอใช้</th>
            <th style="width:120px">วันที่ทำรายการ</th>
            <th class="col-period">วันที่ขอยืม</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;

    Swal.fire({
      title: 'รายละเอียดอุปกรณ์',
      html: tableWrap(table, true, true),
      confirmButtonText: 'ปิด',
      confirmButtonColor: '#3085d6',
      width: 'auto',
      customClass: { popup: 'swal-equipment' },
      didOpen: () => {
        const btnPdf = document.getElementById('pdf-btn');
        if (btnPdf) btnPdf.addEventListener('click', () => this.downloadBookingPdf(group));
        const btnAttach = document.getElementById('attach-btn');
        if (btnAttach) btnAttach.addEventListener('click', () => this.viewAttachment(group));
      }
    });
  }
},

// --- ใหม่: เปิดไฟล์ PDF ในแท็บใหม่ ---
async openBookingPdf(target) {
  const bookingId  = typeof target === 'string' ? target : (target?.booking_id || '');
  const typeFilter = typeof target === 'object' ? (target?.type || '') : '';

  if (!bookingId) {
    Swal.fire('ผิดพลาด','ไม่พบ booking_id สำหรับเปิดไฟล์ PDF','error');
    return;
  }

  // helper: บังคับ http และรองรับทั้ง URL เต็ม/relative/protocol-relative
  const toHttpUrl = (u) => {
    const s = String(u || '').trim();
    if (!s) return '';
    if (/^\/\//.test(s)) return 'http:' + s;                    // //host/path -> http://host/path
    if (!/^https?:\/\//i.test(s)) {                              // /uploads/... หรือ uploads/...
      const { hostname, port } = window.location;
      const hostport = port ? `${hostname}:${port}` : hostname;
      const path = s.startsWith('/') ? s : '/' + s;
      return `http://${hostport}${path}`;
    }
    return s.replace(/^https:/i, 'http:');                       // https:// -> http://
  };

  try {
    // ดึง history แล้วคัด URL ของไฟล์
    const resHist = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
    let list = Array.isArray(resHist.data) ? resHist.data : [];
    list = list.filter(h => String(h?.booking_id || '') === String(bookingId));
    if (typeFilter) list = list.filter(h => (h?.type || '').toLowerCase() === typeFilter.toLowerCase());
    list.sort((a,b) => new Date(b.updatedAt || b.createdAt || b.date || 0) - new Date(a.updatedAt || a.createdAt || a.date || 0));

    const picked = this.pickPdfUrl(list);                        // สมมติคืน field: bookingPdfUrl/fileUrl/pdfUrl
    const rawUrl = this.normalizePdfUrl ? this.normalizePdfUrl(picked) : (picked || '');

    if (!rawUrl) {
      Swal.fire('ผิดพลาด','ไม่พบ URL ของไฟล์ PDF สำหรับรายการนี้','error');
      return;
    }

    // เปิด "แท็บใหม่" แบบ http เท่านั้น (ครั้งเดียว)
    const httpUrl = toHttpUrl(rawUrl);
    const a = document.createElement('a');
    a.href = httpUrl;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (err) {
    console.error('openBookingPdf error:', err);
    Swal.fire('ผิดพลาด','ไม่สามารถเปิดไฟล์ได้','error');
  }
},


     // ==== PDF DOWNLOAD BUTTON ====
  async  exportPdf(item) {
  // --------- ฟังก์ชันย่อยสำหรับ field ---------
  function toSafeDate(d) {
  if (!d) return null;
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y,m,dd] = s.split('-').map(Number);
    return new Date(y, m - 1, dd); // กัน timezone เพี้ยน
  }
  const dt = new Date(s);
  return isNaN(dt) ? null : dt;
}
function formatDate(date) {
  const d = toSafeDate(date);
  if (!d) return '-';
  return d.toLocaleDateString('th-TH-u-nu-latn', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}
  function formatTime(time) {
    if (!time) return '-';
    if (typeof time === 'string' && time.match(/^\d{2}:\d{2}/)) return time;
    const t = new Date(`2000-01-01T${time}`);
    if (!isNaN(t.getTime())) return t.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return time;
  }
  function checkY(doc, y, minY = 50, maxY = 780) {
    if (y > maxY) {
      doc.addPage();
      return minY;
    }
    return y;
  }
  function drawLines(doc, lines, x, y, lineHeight = 15, minY = 50, maxY = 780) {
    for (const line of lines) {
      y = checkY(doc, y, minY, maxY);
      doc.text(line, x, y);
      y += lineHeight;
    }
    return y;
  }

  const mainBookingId = item.booking_field_id || item.booking_equipment_id || item.booking_id;
  const mainId = item.id || item._id;
  if (!mainBookingId) {
    Swal.fire('ผิดพลาด', 'ไม่พบ booking_id สำหรับรายการนี้', 'error');
    return;
  }

  try {
    if (item.type === 'field') {
      // ------------------ FIELD (แบบใหม่) --------------------
      const res = await axios.get(`${API_BASE}/api/booking_field?id=${mainBookingId}`);
      let data;
      if (Array.isArray(res.data)) {
        data = res.data.find(d => String(d.booking_id) === String(mainBookingId));
        if (!data && mainId) {
          data = res.data.find(d => String(d._id) === String(mainId));
        }
        if (!data && res.data.length === 1) data = res.data[0];
      } else {
        data = res.data;
      }

      if (!data) {
        Swal.fire('ไม่พบข้อมูล', 'ไม่พบข้อมูลการจอง', 'warning');
        return;
      }

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFont('Sarabun');

     // ------- ใช้รูปแบบ field จาก form_field4 ---------
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(17);
      doc.text('แบบฟอร์มขออนุมัติใช้สถานที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง', 80, 48);

      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11);
      doc.text('โทร 053-917820-1 | E-mail: sport-complex@mfu.ac.th', 180, 68);

      doc.setFontSize(11);

doc.setFont('Sarabun', 'bold');
doc.setFontSize(12);

doc.setFont('Sarabun', 'normal');
doc.setFontSize(11);
doc.text(`ที่ อว. ${data.aw || '-'}`, 30, 100);     // ← จาก 45 → 30
doc.text(`วันที่ ${formatDate(data.date) || '-'}`, 230, 100);
doc.text(`โทร ${data.tel || '-'}`, 430, 100);


      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(12);
      doc.text('เรื่อง  ขออนุมัติใช้สถานที่', 25, 121);
      doc.text('เรียน  ผู้อำนวยการศูนย์กีฬา', 25, 146);

      doc.setFontSize(12);

      let y = 171;
      y = checkY(doc, y);
      const activityLines = doc.splitTextToSize('ด้วย ' + (data.agency || '-'), 500);
      y = drawLines(doc, activityLines, 55, y);

      const projectLines = doc.splitTextToSize('จะดำเนินกิจกรรม / โครงการ ' + (data.name_activity || '-'), 500);
      y = drawLines(doc, projectLines, 25, y);

      const reasonLabel = 'เหตุผลในการขอใช้คือ';
      const reasonValue = data.reasons || '-';
      y = checkY(doc, y);
      doc.text(reasonLabel, 25, y);
      y += 20;
      const reasonsLines = doc.splitTextToSize(reasonValue, 480);
      y = drawLines(doc, reasonsLines, 40, y);

      y = checkY(doc, y);
      doc.text(`ในวันที่ ${formatDate(data.since) || '-'}`, 25, y + 10);
      doc.text(`ถึงวันที่ ${formatDate(data.uptodate) || '-'}`, 175, y + 10);
      doc.text(`ตั้งแต่เวลา ${formatTime(data.since_time) || '-'} น.`, 325, y + 10);
      doc.text(`ถึงเวลา ${formatTime(data.until_thetime) || '-'} น.`, 475, y + 10);
      y += 30;

      y = checkY(doc, y);
      doc.text(`จำนวนผู้เข้าร่วม ${data.participants || '-'}`, 25, y);
      y += 25;

      y = checkY(doc, y);
      doc.text('และมีความประสงค์ขออนุญาตใช้ห้อง/สนาม ดังรายละเอียดต่อไปนี้', 25, y);
      y += 30;

      y = checkY(doc, y);
      doc.setFontSize(12);
      doc.setFont('Sarabun', 'bold');
      doc.text('1. ข้อมูลผู้ใช้สถานที่', 25, y);
      doc.setFont('Sarabun', 'normal');
      y += 25;

      const buildingLines = doc.splitTextToSize('อาคาร ' + (data.building || '-'), 200);
      const zoneLines = doc.splitTextToSize('ระบุหมายเลขพื้นที่/ห้องที่ต้องการใช้ ' + (data.zone || '-'), 250);
      y = checkY(doc, y);
      drawLines(doc, buildingLines, 55, y);
      drawLines(doc, zoneLines, 280, y);
      y += Math.max(buildingLines.length, zoneLines.length) * 15;

      y = checkY(doc, y);
      doc.setFont('Sarabun', 'bold');
      doc.text('2. ขออนุญาตใช้ระบบสาธารณูปโภค', 25, y + 10);
      doc.setFont('Sarabun', 'normal');
      y += 30;

      const airLines = doc.splitTextToSize(`เปิดเครื่องปรับอากาศตั้งแต่ ${data.turnon_air || '-'} น. ถึง ${data.turnoff_air || '-'} น. ( เฉพาะอาคารเฉลิมพระเกียรติฯ)`, 500);
      const lightLines = doc.splitTextToSize(`ไฟฟ้าส่องสว่างตั้งแต่ ${data.turnon_lights || '-'} น. ถึง ${data.turnoff_lights || '-'} น. ( เฉพาะอาคารเฉลิมพระเกียรติฯ)`, 500);
      y = drawLines(doc, airLines, 55, y);
      y = drawLines(doc, lightLines, 55, y);

      const otherLines = doc.splitTextToSize('อื่นๆ ' + (data.other || '-'), 480);
      y = drawLines(doc, otherLines, 55, y);

      y = checkY(doc, y);
      doc.setFont('Sarabun', 'bold');
      doc.text('3.ขออนุมัติรายการประกอบอาคาร', 25, y + 10);
      doc.setFont('Sarabun', 'normal');
      y += 25;

      const amphitheaterLines = doc.splitTextToSize('ดึงอัฒจันทร์ภายในอาคารเฉลิมพระเกียรติฯ ' + (data.amphitheater || '-'), 480);
      y = drawLines(doc, amphitheaterLines, 55, y + 10);

      const needEquipmentLines = doc.splitTextToSize('อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน) ' + (data.need_equipment || '-'), 480);
      y = drawLines(doc, needEquipmentLines, 55, y + 10);
      y += 25;
      // ----------------- เซ็นชื่อ ---------------------
      const signNameHeight = 45;
      if (y + signNameHeight > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        y = 50;
      }
      let signY = y;
      doc.setFontSize(12);
      doc.text('ลงชื่อ................................................', 25, signY);
      doc.text('ลงชื่อ................................................', 210, signY);
      doc.text('ลงชื่อ................................................', 395, signY);

      doc.text(`(  ${data.requester}  )`, 35, signY + 25);
      doc.text('(..................................................)', 220, signY + 25);
      doc.text('(..................................................)', 405, signY + 25);

      doc.text('นักศึกษา/ผู้รับผิดชอบ', 65, signY + 45);
      doc.text('อาจารย์/ที่ปรึกษาโครงการ', 235, signY + 45);
      doc.text('คณะ/หัวหน้าหน่วยงาน', 434, signY + 45);

      y = signY + 65; // กล่องกรอบล่าง
      // ----------------- กรอบล่าง ---------------------
      const signBoxHeight = 190;
      if (y + signBoxHeight > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        y = 50;
      }
      const boxY = y;
      const pageWidth2 = doc.internal.pageSize.getWidth();
      const boxWidth = (pageWidth2 - 40) / 3;
      const boxHeight = signBoxHeight;
      const marginLeft = 20;
      for (let i = 0; i < 3; i++) {
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(1);
        doc.rect(marginLeft + i * boxWidth, boxY, boxWidth, boxHeight);
      }

      let x1 = marginLeft;
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('1. เลขานุการศูนย์กีฬา', x1 + 28, boxY + 22);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11.5);
      doc.rect(x1 + 16, boxY + 40, 10, 10);
      doc.text('เรียน หัวหน้าศูนย์กีฬา', x1 + 16 + 14, boxY + 50);
      doc.rect(x1 + 16, boxY + 65, 10, 10);
      doc.text('เพื่อโปรดพิจารณา', x1 + 16 + 14, boxY + 75);
      doc.rect(x1 + 16, boxY + 90, 10, 10);
      doc.text('อื่นๆ ___________________________', x1 + 16 + 14, boxY + 100);
      doc.text('.......................................................', x1 + 12, boxY + 125);
      doc.text('(....................................................)', x1 + 12, boxY + 150);
      doc.text('วันที่ ..........................................', x1 + 16, boxY + 175);

      let x2 = marginLeft + boxWidth;
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('2. หัวหน้าศูนย์กีฬา', x2 + 40, boxY + 22);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11.5);
      doc.rect(x2 + 16, boxY + 40, 10, 10);
      doc.text('เรียนท่านรองอธิการบดี', x2 + 16 + 14, boxY + 50);
      doc.rect(x2 + 16, boxY + 65, 10, 10);
      doc.text('เพื่อโปรดพิจารณา', x2 + 16 + 14, boxY + 75);
      doc.rect(x2 + 16, boxY + 90, 10, 10);
      doc.text('อื่นๆ ___________________________', x2 + 16 + 14, boxY + 100);
      doc.text('.......................................................', x2 + 12, boxY + 125);
      doc.text('(....................................................)', x2 + 12, boxY + 150);
      doc.text('วันที่ ..........................................', x2 + 16, boxY + 175);

      let x3 = marginLeft + boxWidth * 2;
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('3. อธิการบดี', x3 + 60, boxY + 22);
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11.5);
      doc.rect(x3 + 16, boxY + 40, 10, 10);
      doc.text('อนุมัติข้อ', x3 + 16 + 14, boxY + 50);
      doc.rect(x3 + 16, boxY + 65, 10, 10);
      doc.text('อื่นๆ ___________________________', x3 + 16 + 14, boxY + 75);
      doc.text('.......................................................', x3 + 12, boxY + 100);
      doc.text('.......................................................', x3 + 12, boxY + 125);
      doc.text('(....................................................)', x3 + 12, boxY + 150);
      doc.text('วันที่ ..........................................', x3 + 16, boxY + 175);
      for (let i = 0; i < 3; i++) {
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(1);
        doc.line(marginLeft + i * boxWidth, boxY + 32, marginLeft + (i + 1) * boxWidth, boxY + 32);
      }
      doc.save('user_form.pdf');
      return;
    }
    // ------------------ EQUIPMENT (แบบเดิม) ------------------
    if (item.type === 'equipment') {
      const resBooking = await axios.get(`${API_BASE}/api/booking_equipment?id=${mainBookingId}`);
      const bookingData = Array.isArray(resBooking.data) ? resBooking.data[0] : resBooking.data;
      const itemRemarks = Array.isArray(bookingData.items)
        ? bookingData.items.map(i => ({
          name: i.item_name,
          remark: i.remark || ''
        }))
        : [];

      const historyRes = await axios.get(`${API_BASE}/api/history`);
      const allItems = historyRes.data
        .filter(d => String(d.booking_id) === String(mainBookingId))
        .filter(d => !d.status || d.status.toLowerCase() !== 'returned');

      const mergedItems = allItems.map((row, idx) => {
        const matched = itemRemarks.find(it => it.name === row.name);
        return {
          ...row,
          remark: matched ? matched.remark : '-'
        };
      });
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFont('Sarabun', 'normal');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      // Header
      doc.setFontSize(16);
      const title = 'แบบฟอร์มการยืมอุปกรณ์ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง';
      const subTitle = 'โทร 053-917820-1 E-mail sport-complex@mfu.ac.th';
      doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, 45);
      doc.setFontSize(11);
      doc.text(subTitle, (pageWidth - doc.getTextWidth(subTitle)) / 2, 69);

      // ส่วนหัวด้านขวา
      const headerRightX = pageWidth - 50;
      const headerLines = [
        "ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง",
        `วันที่ ${formatDate(bookingData.start_date || bookingData.since || bookingData.date) || '-'}`,
        `วันที่มารับของ ${formatDate(bookingData.receive_date) || '-'}`,
        `เวลาที่มารับของ ${formatTime(bookingData.receive_time) || '-'} น.`
      ];
      let headerY = 100;
      const lineSpacing = 20;
      headerLines.forEach(line => {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, headerRightX - textWidth, headerY);
        headerY += lineSpacing;
      });

      // ฟังก์ชันเช็ค y (ขึ้นหน้าใหม่ถ้าจำเป็น)
      function checkAddPage(nextY, space = 20) {
        if (nextY + space > pageHeight - 60) {
          doc.addPage();
          return 80;
        }
        return nextY;
      }

      // ข้อมูลรายละเอียด
      let y = headerY + 20;
      const leftMargin = 50;
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(12);

      // ข้อมูลทั่วไป
      y = checkAddPage(y, 16);
      doc.text(`ข้าพเจ้า ${bookingData.name || '-'}`, leftMargin, y);
      doc.text(`รหัสนักศึกษา/รหัสพนักงาน ${bookingData.user_id || '-'}`, leftMargin + 270, y);

      y += 28;
      y = checkAddPage(y, 16);
      doc.text(`หน่วยงาน ${bookingData.agency || '-'}`, leftMargin, y);

      // เหตุผล (ข้อความยาว)
      y += 28;
      const reasonText = `เหตุผลในการขอใช้เพื่อ: ${bookingData.reason || '-'}`;
      const reasonLines = doc.splitTextToSize(reasonText, pageWidth - 80);
      doc.setFontSize(12);
      for (const line of reasonLines) {
        y = checkAddPage(y, 16);
        doc.text(line, leftMargin - 20, y);
        y += 16;
      }

      y = checkAddPage(y, 16);
      doc.text(`สถานที่ใช้งาน: ${bookingData.location || '-'}`, leftMargin - 20, y);
      y += 25;
      y = checkAddPage(y, 16);

      doc.text(
        `ในวันที่ ${formatDate(bookingData.start_date || bookingData.since || bookingData.date) || '-'} ถึงวันที่ ${formatDate(bookingData.end_date || bookingData.uptodate) || '-'}`,
        leftMargin - 20, y
      );
      y += 25;
      y = checkAddPage(y, 16);

      doc.text(`โดยมีรายการดังต่อไปนี้`, leftMargin - 20, y);
      y += 25;

      // ตาราง (autoTable จะจัดการขึ้นหน้าให้เอง)
      autoTable(doc, {
        startY: y,
        head: [['ลำดับ', 'รายการ', 'จำนวน', 'หมายเหตุ']],
        body: mergedItems.map((row, idx) => [
          idx + 1,
          row.name || '-',
          row.quantity || '-',
          row.remark || '-'
        ]),
        headStyles: { fillColor: [40, 63, 125], textColor: 255, font: 'Sarabun', halign: 'center', fontSize: 11 },
        styles: { font: 'Sarabun', fontSize: 11, halign: 'center', cellPadding: 4 }
      });

      // กล่องลายเซ็น
      let signY = doc.lastAutoTable.finalY + 40;
      if (signY + 150 > pageHeight - 40) {
        doc.addPage();
        signY = 80;
      }
      const boxWidth = (pageWidth - 60) / 2;
      const boxHeight = 110;
      const marginLeft = 30;

      // Draw outer rectangles
      doc.setLineWidth(1);
      doc.setDrawColor(50, 50, 50);
      doc.rect(marginLeft, signY, boxWidth, boxHeight);
      doc.rect(marginLeft + boxWidth, signY, boxWidth, boxHeight);

      // Draw column titles
      doc.setFont('Sarabun', 'bold');
      doc.setFontSize(12);
      doc.text('ความคิดเห็น/คำสั่ง/ผลการพิจารณา', marginLeft + boxWidth / 2, signY + 18, { align: 'center' });
      doc.text('ผลการดำเนินการ/ผลการปฏิบัติงาน', marginLeft + boxWidth + boxWidth / 2, signY + 18, { align: 'center' });

      // Thin lines under headers
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.7);
      doc.line(marginLeft + 10, signY + 25, marginLeft + boxWidth - 10, signY + 25);
      doc.line(marginLeft + boxWidth + 10, signY + 25, marginLeft + 2 * boxWidth - 10, signY + 25);

      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11);

      // Left box lines
      doc.text('.................................................................', marginLeft + 17, signY + 40);
      doc.text('.................................................................', marginLeft + 17, signY + 54);
      doc.text('ลงชื่อ.............................................หัวหน้าส่วน', marginLeft + 17, signY + 70);
      doc.text('วันที่................./................./.................', marginLeft + 22, signY + 100);

      // Right box lines
      doc.text('.................................................................', marginLeft + boxWidth + 17, signY + 40);
      doc.text('.................................................................', marginLeft + boxWidth + 17, signY + 54);
      doc.text('ลงชื่อ.................................ผู้ปฏิบัติงาน/ผู้รับผิดชอบ', marginLeft + boxWidth + 17, signY + 70);
      doc.text('วันที่................./................./.................', marginLeft + boxWidth + 22, signY + 100);

      // ===== ลายเซ็นผู้ขอ (ชิดซ้าย ลดขนาด ชื่ออยู่บรรทัดถัดไป) =====
      const userName = bookingData.name || '-';
      const signX = marginLeft + boxWidth + 20;
      let signTextY = signY + boxHeight + 40;
      if (signTextY + 32 > pageHeight - 40) {
        doc.addPage();
        signTextY = 80;
      }
      const nameWidth = doc.getTextWidth(userName);
      const minParenWidth = 140;
      const parenWidth = Math.max(nameWidth + 20, minParenWidth);
      const parenDots = '.'.repeat(Math.round(parenWidth / doc.getTextWidth('.')));
      const parenText = `( ${parenDots} )`;
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(11);
      doc.text(`ลงชื่อ ${parenText}`, signX, signTextY, { align: 'left' });
      doc.setFont('Sarabun', 'normal');
      doc.setFontSize(12);
      doc.text(userName, signX + 35, signTextY + 16, { align: 'left' });

      doc.save('user_form.pdf');
      return;
    }

  } catch (err) {
    Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการดาวน์โหลด PDF', 'error');
    console.error(err);
  }
}
  },
  async mounted() {
  // responsive
  window.addEventListener('resize', this.handleResize);
  this.handleResize();
  try {
    const userRes = await axios.get(`${API_BASE}/api/users`);
    this.userMap = {};
    (userRes.data || []).forEach(u => {
      const displayName =
        (u.firstname && u.lastname)
          ? `${u.firstname} ${u.lastname}`
          : (u.name || u.user_id);
      this.userMap[u.user_id] = displayName;
    });
    // ✅ map ลายเซ็นของผู้ใช้ทุกคน (รองรับ signaturePath / signatureUrl / ฯลฯ)
    this.userSigMap = {};
    (userRes.data || []).forEach(u => {
      const raw = this.pickSignatureFromUser(u);    // ดึงจากหลายคีย์ เช่น signaturePath
      this.userSigMap[u.user_id] = this.normalizePdfUrl(raw || '');
    });
    // หา record ของคนที่ล็อกอินตอนนี้ (ไว้ตั้งชื่อ/ลายเซ็นของแอดมิน)
    const myId =
      localStorage.getItem('user_id') ||
      localStorage.getItem('id') ||
      '';
    const me = (userRes.data || []).find(
      u => String(u.user_id) === String(myId) || String(u.id) === String(myId)
    );
    // ✅ ชื่อไทยของผู้ล็อกอิน
    this.loggedThaiName =
      this.pickThaiNameFromUser(me) ||
      localStorage.getItem('thaiName') ||
      localStorage.getItem('thai_name') ||
      '';
    // ✅ ลายเซ็นของผู้ล็อกอิน (raw สำหรับเก็บ DB + url สำหรับแสดงผล)
    const rawSig =
      this.pickSignatureFromUser(me) ||
      localStorage.getItem('signaturePath') ||
      localStorage.getItem('signature_url') ||
      '';
    this.loggedSignatureRaw = rawSig || '';
    this.loggedSignatureUrl = this.normalizePdfUrl(rawSig);
    console.debug('approve_field/mounted', {
      myId,
      thaiName: this.loggedThaiName,
      sigUrl: this.loggedSignatureUrl
    });
  } catch (err) {
    console.error('โหลด users ไม่สำเร็จ:', err);
    this.userMap = {};
    this.userSigMap = {};
    this.loggedThaiName = '';
    this.loggedSignatureRaw = '';
    this.loggedSignatureUrl = '';
  }
  try {
    await this.fetchAndGroup();
  } catch (e) {
    console.error('fetchAndGroup @mounted ล้มเหลว:', e);
  }
  this.lastSeenTimestamp =
    parseInt(localStorage.getItem(ADMIN_LAST_SEEN_KEY) || '0', 10) || 0;

  try {
    await this.fetchNotifications();
  } catch (_) { /* เงียบได้ */ }

  this.polling = setInterval(this.fetchNotifications, 30000);
  this.refreshTimer = setInterval(this.fetchAndGroup, 8000);

  this._onVisibility = () => { if (!document.hidden) this.fetchAndGroup(); };
  document.addEventListener('visibilitychange', this._onVisibility);

  document.addEventListener('mousedown', this.handleClickOutside);
},
  beforeUnmount() {
    clearInterval(this.polling)
    document.removeEventListener('mousedown', this.handleClickOutside);
     window.removeEventListener('resize', this.handleResize);
  }
}

function toAbsUrl(u) {
  if (!u) return '';
  if (/^(data:|blob:|https?:|file:)/i.test(u)) return u;
  const a = document.createElement('a');
  a.href = u.startsWith('/') ? u : '/' + u;
  return a.href;
}


// --- Field detail popup helpers (module-scope) ---
function buildFieldFormPreviewV2(
  b = {},
  secThaiName = '',
  secSignUrl = '',
  reqSignUrl = '',
  secApprovedAt
) {
  // --- helpers ---
  const toAbsUrlLocal = (url) => {
    if (typeof toAbsUrl === 'function') return toAbsUrl(url);
    if (!url) return '';
    if (/^(data:|https?:)/i.test(url)) return url;
    const base = location.origin.replace(/^http:/, location.protocol);
    if (url.startsWith('/')) return base + url;
    return base + '/' + url.replace(/^\.\//, '');
  };
  const dash = v => { const s = (v ?? '').toString().trim(); return s ? s : '-'; };
  const d = v => (v ?? '-') + '';
  const fmtDate = s => {
    if (!s) return '-';
    const t = String(s).includes('T') ? String(s).split('T')[0] : String(s);
    const [y, m, dd] = t.split('-').map(Number);
    if (!y || !m || !dd) return t;
    return `${String(dd).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y + 543}`;
  };
  const fmtTime = t => {
    if (!t) return '-';
    const s = String(t).trim().replace(/\s*น\.?$/i, '');
    return /^\d{1,2}:\d{2}/.test(s) ? `${s.slice(0,5)} น.` :
           /^\d{1,2}:\d{2}:\d{2}$/.test(s) ? `${s.slice(0,5)} น.` : `${s} น.`;
  };
  const fmtDateTimeTH = (x) => {
    const dd = x instanceof Date ? x : new Date(x ?? Date.now());
    const date = new Intl.DateTimeFormat('th-TH-u-nu-latn', {
      timeZone: 'Asia/Bangkok', day:'2-digit', month:'2-digit', year:'numeric'
    }).format(dd);
    const time = new Intl.DateTimeFormat('th-TH-u-nu-latn', {
      timeZone: 'Asia/Bangkok', hour:'2-digit', minute:'2-digit', hour12:false
    }).format(dd);
    return `${date} ${time} น.`;
  };
  const _fmtDateLocal = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()+543}`;
  const fmtDateTimeLocal = s => {
    if (!s) return '-';
    const dd = new Date(String(s).trim());
    if (isNaN(dd)) return '-';
    return `${_fmtDateLocal(dd)} ${String(dd.getHours()).padStart(2,'0')}:${String(dd.getMinutes()).padStart(2,'0')} น.`;
  };

  const tStart = b?.since_time || b?.startTime || '';
  const tEnd   = b?.until_thetime || b?.endTime   || '';

  const ynPack = (v, fallbackOn) => {
    const s = String(v ?? '').trim().toLowerCase();
    if (['yes','true','1','เลือก','อนุญาต','allow','allowed'].includes(s)) return { yChar:'●', yOn:true,  nChar:'○', nOn:false };
    if (['no','false','0','ไม่เลือก','ไม่อนุญาต','disallow','denied'].includes(s)) return { yChar:'○', yOn:false, nChar:'●', nOn:true  };
    if (fallbackOn === true)  return { yChar:'●', yOn:true,  nChar:'○', nOn:false };
    if (fallbackOn === false) return { yChar:'○', yOn:false, nChar:'●', nOn:true  };
    return { yChar:'○', yOn:false, nChar:'○', nOn:false };
  };

  const hasU = [b?.turnon_air,b?.turnoff_air,b?.turnon_lights,b?.turnoff_lights,b?.other,b?.restroom]
    .some(v => String(v ?? '').trim() && String(v ?? '').trim() !== '-');
  const hasF = [b?.amphitheater,b?.need_equipment]
    .some(v => String(v ?? '').trim() && String(v ?? '').trim() !== '-');

  const u = ynPack(b?.utilityRequest,  hasU ? true : undefined);
  const f = ynPack(b?.facilityRequest, hasF ? true : undefined);

  // 2.2 สุขา – ค่าว่างให้ถือว่า "ไม่ต้องการใช้งาน"
const restroomText = (() => {
  // เอา restroom_text มาก่อน ถ้าไม่มีค่อยใช้ restroom
  const rawInput = (b?.restroom_text ?? b?.restroom ?? '').toString().trim();
  const raw = rawInput.toLowerCase();

  // ค่าว่าง -> ไม่ต้องการใช้งาน
  if (!raw) return 'ไม่ต้องการใช้งาน';

  // ต้องการใช้งาน
  if (['yes','true','1','y','use','ใช้','ใช้งาน','ต้องการ','ต้องการใช้งาน'].includes(raw)) {
    return 'ต้องการใช้งาน';
  }
  // ไม่ต้องการใช้งาน (รวม no/false/0/ข้อความไทย)
  if (['no','false','0','n','not use','ไม่ใช้','ไม่ใช้งาน','ไม่ต้องการ','ไม่ต้องการใช้งาน'].includes(raw)) {
    return 'ไม่ต้องการใช้งาน';
  }
  // ค่าอื่น ๆ แสดงตามที่ส่งมา
  return rawInput;
})();


  // ใช้เฉพาะช่อง 2.1
const lightsText = (() => {
  const on  = (b?.turnon_lights ?? '').toString().trim();
  const off = (b?.turnoff_lights ?? '').toString().trim();
  const empty = (s) => !s || s === '-';
  if (empty(on) && empty(off)) return 'ไม่ต้องการใช้งาน';
  return `ตั้งแต่ ${fmtTime(on)} - ${fmtTime(off)}`;
})();

const showAmphiRow = (() => {
  const name = (b?.name ?? '').toString();
  // ปรับให้ทนต่อช่องว่าง/รูปแบบพิมพ์
  const norm = name.replace(/\s+/g, '');
  return /เฉลิมพระเกียรติ?72พรรษา/.test(norm);
})();


  const secNow = secApprovedAt ? new Date(secApprovedAt) : new Date();

  return `
  <div class="mfu-form">
    <style>
      .mfu-form{ font-family:'THSarabunNew','Sarabun','Noto Sans Thai',system-ui,sans-serif; color:#111; line-height:1.35; font-size:14px; }
      .mfu-head{text-align:center;margin-bottom:10px;}
      .mfu-title{font-size:22px;font-weight:700;}
      .mfu-sub{font-size:14px;margin-top:4px;}
      .mfu-meta{display:flex;gap:18px;flex-wrap:wrap;font-size:14px;margin:10px 0 4px;}
      .mfu-sec{margin-top:14px;font-size:14px;display:block;}
      .mfu-sec h4{margin:0;padding:0 0 10px;line-height:1.35;font-weight:700;}
      .mfu-par{text-indent:2em;margin-top:6px;}
      .mfu-list{list-style:none;margin:4px 0 0;padding:0;}
      .mfu-list li{padding:6px 0;border-bottom:1px dashed #e5e7eb;}
      .mfu-list li:first-child,.mfu-list li:last-child{border-bottom:0;}
      .mfu-list b{display:inline-block;min-width:100px;white-space:nowrap;color:#111;}
      .mfu-list-util b{width:165px;min-width:166px;}
      .mfu-yn{margin:4px 0 6px;display:flex;gap:18px;}
      .mfu-yn .choice{display:inline-flex;align-items:center;gap:6px;font-size:16px;color:#374151;}
      .mfu-yn .dot{font-weight:700;font-size:18px;line-height:1;color:#9ca3af;}
      .mfu-yn .choice.on{color:#111;font-weight:700;}
      .mfu-yn .choice.on .dot{color:currentColor;}
      .mfu-boxes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px;}
      @media (max-width:720px){.mfu-boxes{grid-template-columns:1fr;}}
      .mfu-box{border:1px solid #333;padding:10px 12px;min-height:200px;position:relative; font-size:14px; }
      .mfu-box h5{margin:0 0 8px;font-size:16px;font-weight:700;text-align:center;}
      .mfu-box .row{ display:flex; align-items:baseline; gap:8px; min-height:36px; flex-wrap:nowrap; }
      .mfu-box .chk{ display:flex; align-items:center; gap:8px; cursor:pointer; white-space:nowrap; }
      .mfu-box input[type="checkbox"]{ width:16px; height:16px; cursor:pointer; }
      .mfu-input{flex:1;min-width:0;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;font:inherit;}
      .mfu-ta{ display:inline-block; width:auto; min-height:36px; line-height:1.6; white-space:pre-wrap; word-break:break-word; overflow-wrap:anywhere; flex:1; min-width:0; }
      .mfu-ta:empty:before{ content: attr(data-ph); opacity:.5; }
      .mfu-box .sig-row{ position:relative; height:56px; display:flex; align-items:flex-end; }
      .mfu-box .sigimg{ position:absolute; left:0; right:0; margin:0 auto; bottom:4px; max-height:48px; width:auto; opacity:.95; pointer-events:none; }
      .mfu-box .fill{ flex:1; border-bottom:1px dotted #444; height:1.15em; transform:translateY(-2px); }
      .mfu-box .fill.full{ width:100%; }
      .mfu-box .paren{ margin:0 4px; }
      .mfu-box .sig-row + .row{ margin-top:0; align-items:center; }
      .mfu-note{margin-top:8px;font-size:14px;opacity:.9;}
      .mfu-sign{ display:flex; justify-content:flex-end; padding-right:20px; margin-top:10px; }
      .mfu-sign.mfu-signline{ --sign-width: clamp(210px,36vw,260px); display:grid; grid-template-columns:auto var(--sign-width); column-gap:6px; align-items:center; margin-left:auto; text-align:right; }
      .mfu-sign.mfu-signline .lab{ white-space:nowrap; }
      .mfu-sign.mfu-signline .dots{ height:1.15em; border-bottom:1px dotted #888; position:relative; }
      .mfu-sign.mfu-signline .sigimg{ position:absolute; top:-34px; left:0; right:0; margin:0 auto; max-height:48px; width:auto; opacity:.95; pointer-events:none; }
      .mfu-sign.mfu-signline .name,.mfu-sign.mfu-signline .role{ grid-column:2; text-align:center; display:block; margin-top:6px; }
      .mfu-sign.mfu-signline .date{ 
        grid-column:2; 
        text-align:center; 
        display:block; 
        margin-top:6px; 
        font-size:11px;  
      }

      .mfu-box .row.center{ justify-content: center; }
      .mfu-box .row.center .date{ 
        text-align: center; 
        display: inline-block; 
        font-size:11px;  
      }
      .mfu-box .paren-row{ justify-content: center; }
      .mfu-box .sig-row.spacer{ height:56px; }
      .limit-3lines{ max-height: calc(1.6em * 3); overflow: hidden; }
      .mfu-list-loc b { display:inline-block; min-width: 90px; white-space: nowrap; } 
      .mfu-tbl { border-collapse: collapse; margin-top:4px; }
      .mfu-tbl td { padding: 4px 6px; font-size:14px; vertical-align: top; }
      .mfu-tbl .lbl   { min-width: 80px; white-space: nowrap; font-weight:700; }
      .mfu-tbl .colon { width: 10px; text-align:center; }
      .mfu-tbl .val   { width:auto; padding-left:4px; }
    </style>

    <div class="mfu-head">
      <div class="mfu-title">แบบฟอร์มขออนุมัติใช้สถานที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</div>
      <div class="mfu-sub"><b>โทร: 0-5391-7820 และ 0-5391-7821 | E-mail: sport-complex@mfu.ac.th</b></div>
    </div>

    <div class="mfu-meta">
      <div><b>ที่ อว.</b> ${d(b?.aw)}</div>
      <div><b>วันที่</b> ${fmtDate(b?.date)}</div>
      <div><b>โทร</b> ${d(b?.tel)}</div>
    </div>

    <div class="mfu-sec">
      <div><b>เรื่อง</b> ขออนุมัติใช้สถานที่</div>
      <div><b>เรียน</b> อธิการบดี</div>
      <div class="mfu-par">
        ด้วย ${d(b?.agency)} จะดำเนินกิจกรรม/โครงการ ${d(b?.name_active || b?.name_activity || b?.activity || b?.activity_name || b?.project_name)} เหตุผลในการขอใช้เพื่อ ${d(b?.reasons)}
        ในวันที่ ${fmtDate(b?.since)} ถึงวันที่ ${fmtDate(b?.uptodate)}
        ตั้งแต่เวลา ${fmtTime(tStart)} ถึง ${fmtTime(tEnd)}
        จำนวนผู้เข้าร่วม ${d(b?.participants)} คน
      </div>
    </div>

    <div class="mfu-sec">
      <h4>1. ขออนุมัติใช้สถานที่</h4>
      <table class="mfu-tbl mfu-tbl-loc" style="margin-left:31px;">
        <tr>
          <td class="lbl"><b>อาคาร</b></td>
          <td class="colon">:</td>
          <td class="val">${d(b?.name)}</td>
        </tr>
        <tr>
          <td class="lbl"><b>พื้นที่/ห้อง</b></td>
          <td class="colon">:</td>
          <td class="val">${dash(b?.zone)}</td>
        </tr>
      </table>
    </div>

    <div class="mfu-sec">
      <h4>2. ขออนุญาตใช้ระบบสาธารณูปโภค</h4>
      <div class="mfu-yn">
        <span class="choice yes ${u.yOn ? 'on' : ''}"><span class="dot">${u.yChar}</span> เลือก</span>
        <span class="choice no  ${u.nOn ? 'on' : ''}"><span class="dot">${u.nChar}</span> ไม่เลือก</span>
      </div>
      <table class="mfu-tbl mfu-tbl-util" style="margin-left:31px;">
        <tr>
          <td class="lbl"><b>2.1 ไฟฟ้าส่องสว่าง</b></td>
          <td class="colon">:</td>
          <td class="val">${lightsText}</td>
        </tr>
        <tr>
          <td class="lbl"><b>2.2 สุขา</b></td>
          <td class="colon">:</td>
          <td class="val">${restroomText}</td>
        </tr>
      </table>

      <div class="mfu-note">
        *ต้องได้รับการอนุมัติจากรองอธิการบดีผู้กำกับดูแล และสำเนาเอกสารถึงฝ่ายอนุรักษ์พลังงาน
      </div>
    </div>

    <div class="mfu-sec">
      <h4>3. ขออนุมัติรายการประกอบอาคาร</h4>
      <div class="mfu-yn">
        <span class="choice ${f.yOn ? 'on' : ''}"><span class="dot">${f.yOn ? '●' : '○'}</span> เลือก</span>
        <span class="choice ${f.nOn ? 'on' : ''}"><span class="dot">${f.nOn ? '●' : '○'}</span> ไม่เลือก</span>
      </div>
      <table class="mfu-tbl mfu-tbl-fac" style="margin-left:31px;">
        ${showAmphiRow ? `
          <tr>
            <td class="lbl"><b>3.1 ดึงอัฒจันทร์ภายในอาคารเฉลิมพระเกียรติฯ</b></td>
            <td class="colon">:</td>
            <td class="val">${dash(b?.amphitheater)}</td>
          </tr>
          <tr>
            <td class="lbl"><b>3.2 อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน)</b></td>
            <td class="colon">:</td>
            <td class="val">${dash(b?.need_equipment)}</td>
          </tr>
        ` : `
          <tr>
            <td class="lbl"><b>3.1 อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน)</b></td>
            <td class="colon">:</td>
            <td class="val">${dash(b?.need_equipment)}</td>
          </tr>
        `}
      </table>

      <div class="mfu-note">
        ทั้งนี้ต้องแนบเอกสารโครงการหรือกิจกรรมที่ได้รับการอนุมัติแล้วพร้อมกำหนดการจัดกิจกรรมหากเป็นการเรียนการสอน <br>
        ต้องแนบตารางการเรียนการสอน (Class schedule) พร้อมทั้งรายชื่อนักศึกษา
      </div>
    </div>

    <!-- ลายเซ็นผู้ยื่นคำขอ -->
    <div class="mfu-sign mfu-signline" style="margin-top: 50px">
      <span class="lab">ลงชื่อ</span>
      <span class="dots">
        ${reqSignUrl ? `<img class="sigimg" src="${toAbsUrlLocal(reqSignUrl)}" alt="signature">` : ``}
      </span>
      <span class="name">( ${d(b?.username_form || b?.requester)} )</span>
      <span class="role">ผู้รับผิดชอบ</span>
      <span class="date">${fmtDateTimeLocal(b?.createdAt || b?.date)}</span>
    </div>

    <div class="mfu-boxes">
      <div class="mfu-box">
        <h5>1. เลขานุการศูนย์กีฬา</h5>
        <div class="row">
          <label class="chk" style="padding-left:30px"><span>เรียน หัวหน้าศูนย์กีฬาฯ</span></label>
        </div>

        <div class="row">
          <label class="chk">
            <input type="checkbox" id="sec_other_chk" />
            <span>อื่นๆ : </span>
          </label>
          <div id="sec_other_reason"
               class="mfu-input mfu-ta limit-3lines"
               contenteditable="true"
               data-ph="โปรดระบุ"
               oninput="(function(el){
                 var h=el.innerHTML;
                 h=h.replace(/<div><br><\/div>/gi,'\n')
                    .replace(/<div>/gi,'\n')
                    .replace(/<\/div>/gi,'')
                    .replace(/<br\s*\/?>/gi,'\n')
                    .replace(/&nbsp;/gi,' ')
                    .replace(/<[^>]+>/g,'');
                 h=h.replace(/\r/g,'');
                 var lines=h.split('\n').slice(0,3);
                 var text=lines.join('\n');
                 if(text.length>255) text=text.slice(0,255);
                 if(el.innerText!==text){
                   el.innerText=text;
                   var r=document.createRange(); r.selectNodeContents(el); r.collapse(false);
                   var s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
                 }
               })(this)"
               onkeydown="if(event.key==='Enter'){var v=(this.innerText||'').replace(/\r/g,''); if(v.split('\n').length>=3){event.preventDefault();}}"
               onpaste="setTimeout(()=>{this.dispatchEvent(new Event('input'));},0)"></div>
        </div>

        <div class="row sig-row">
          ${secSignUrl ? `<img class="sigimg" src="${toAbsUrlLocal(secSignUrl)}" alt="signature">` : ``}
        </div>
        <div class="row paren-row"><span class="paren">(</span><span style="flex:1;text-align:center;">${(secThaiName ?? '-') + ''}</span><span class="paren">)</span></div>
        <div class="row center"><span></span><span class="date">${fmtDateTimeTH(secNow)}</span></div>
      </div>

      <div class="mfu-box">
        <h5>2. หัวหน้าศูนย์กีฬา</h5>
        <div class="row">
          <label class="chk"><input type="checkbox" id="head_to_vice" disabled /><span>เห็นชอบ</span></label>
        </div>

        <div class="row">
  <label class="chk">
    <input type="checkbox" id="head_other_chk" disabled />
    <span>อื่นๆ :</span>
  </label>

  <textarea id="head_other_reason"
            class="mfu-input limit-3lines"
            placeholder="โปรดระบุ"
            rows="1"
            disabled
            style="resize:none;"
            oninput="var v=this.value.replace(/\r/g,''); v=v.split('\n').slice(0,3).join('\n'); if(v.length>255)v=v.slice(0,255); if(v!==this.value)this.value=v;"
            onkeydown="if(event.key==='Enter' && (this.value.split('\n').length>=3)){event.preventDefault();}"
            onpaste="setTimeout(()=>{var v=this.value.replace(/\r/g,''); v=v.split('\n').slice(0,3).join('\n'); if(v.length>255)v=v.slice(0,255); if(v!==this.value)this.value=v;},0)">
  </textarea>
</div>


        <div class="row sig-row spacer"></div>
        <div class="row paren-row"><span class="paren">(</span><span style="flex:1;text-align:center;"></span><span class="paren">)</span></div>
        <div class="row center"><span></span><span class="date"></span></div>
      </div>
    </div>
  </div>`;
}


// === Equipment approve preview (HTML แสดงใน Swal) ===
function buildEquipmentApprovePreviewHTML(ctx) {
  const esc = (s) => String(s ?? "-")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");

  // ===== helpers =====
  const toDate = (v) => {
    if (!v) return null;
    const x = v && v.$date ? v.$date : v;
    const d = x instanceof Date ? x : new Date(x);
    return isNaN(d) ? null : d;
  };
  const fmtDateTH = (v) => {
    const d = toDate(v);
    if (!d) return "-";
    return new Intl.DateTimeFormat("th-TH-u-nu-latn", {
      timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit", year: "numeric",
    }).format(d);
  };
  const fmtTimeTH = (t) => {
    if (!t) return "-";
    const s = String(t).trim().replace(/\s*น\.?$/i, "");
    if (/^\d{1,2}:\d{2}/.test(s)) return `${s.slice(0,5)} น.`;
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) return `${s.slice(0,5)} น.`;
    return `${s} น.`;
  };
  const fmtTH = (d) => ({
    date: new Intl.DateTimeFormat("th-TH-u-nu-latn", {
      timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit", year: "numeric",
    }).format(d),
    time: new Intl.DateTimeFormat("th-TH-u-nu-latn", {
      timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(d),
  });

  // ✅ เลือกป้าย "รหัส..." ตามอีเมลของผู้ยืม
  // รองรับหลายชื่อฟิลด์ที่อาจถูกส่งมาใน ctx
  const getIdLabel = () => {
    const email =
      ctx.email ||
      ctx.userEmail ||
      ctx.requesterEmail ||
      (ctx.usersEmailMap && ctx.user_id && ctx.usersEmailMap[ctx.user_id]) ||
      (ctx.user && ctx.user.email) ||
      "";

    if (/@mfu\.ac\.th$/i.test(email)) return "รหัสพนักงาน";
    if (/@lamduan\.mfu\.ac\.th$/i.test(email)) return "รหัสนักศึกษา";
    return "รหัสนักศึกษา/รหัสพนักงาน"; // เผื่อกรณีหาอีเมลไม่เจอ
  };
  const idLabel = getIdLabel();

  // วันนี้ (หัวฟอร์ม)
  const { date: dateTH } = fmtTH(new Date());

  // วันที่/เวลาที่ใต้เส้นเซ็นผู้ยืม
  const createdCandidates = [
    ctx.createdAt, ctx.created_at, ctx.createAt, ctx.created,
    ctx.items && ctx.items[0] && ctx.items[0].createdAt,
    ctx.items && ctx.items[0] && ctx.items[0].created_at
  ];
  let sigDate = null;
  for (const c of createdCandidates) { sigDate = toDate(c); if (sigDate) break; }
  const sigFmt = sigDate ? fmtTH(sigDate) : null;
  const sigDateTimeTH = sigFmt ? `${sigFmt.date} ${sigFmt.time} น.` : "-";

  // ช่วงวันที่ใช้งานจาก ctx.dateRange ("A - B")
  const splitRange = (s) => {
    if (!s) return ["-","-"];
    const p = String(s).split(" - ");
    return [p[0] || "-", p[1] || "-"];
  };
  const [sinceStr, uptoStr] = splitRange(ctx.dateRange);

  // แถวรายการ
  const rows = (ctx.rows || []).map(r => `
    <tr>
      <td class="c">${r.idx}</td>
      <td class="c">${esc(r.name)}</td>
      <td class="c">${esc(r.quantity)}</td>
      <td class="c">${esc(r.remark || "-")}</td>
    </tr>
  `).join("");

  // วันที่/เวลามารับของ
  const showReceiveDate = ctx.receive_date ? fmtDateTH(ctx.receive_date) : (ctx.dateBorrow || "-");
  const showReceiveTime = ctx.receive_time ? fmtTimeTH(ctx.receive_time) : (ctx.timeBorrow || "-");

  return `
  <div class="eqp-preview">
    <!-- หัวเรื่อง -->
    <div class="eqp-head">
      <div class="t1">แบบฟอร์มการยืมอุปกรณ์ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</div>
      <div class="t2">โทร 0-5391-7820 และ 0-5391-7821 | E-mail: sport-complex@mfu.ac.th</div>
    </div>

    <!-- ✅ ย้ายบล็อกขวานี้ลงมาบรรทัดถัดไป ไม่ใช้ absolute อีกต่อไป -->
    <div class="eqp-meta">
      <div class="right-meta">
        <div>ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</div>
        <div>วันที่มารับของ ${esc(showReceiveDate)}</div>
        <div>เวลาที่มารับของ ${esc(showReceiveTime)}</div>
      </div>
    </div>

    <div class="date" style="margin-top:30px">วันที่ ${dateTH}</div>
    <div style="margin-top:20px">สำหรับผู้ขอใช้บริการ</div>

    <section class="eqp-section eqp-section--par">
      <div class="eqp-par">
        ข้าพเจ้า ${esc(ctx.requester)}
        ${idLabel} ${esc(ctx.requesterId)}
        ${ctx.tel ? 'โทร ' + esc(ctx.tel) : ''}
        มีความประสงค์ขอยืมอุปกรณ์ของศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง
        เพื่อใช้ในงาน ${esc(ctx.reason)} สถานที่ใช้งาน ${esc(ctx.location)}
        ระหว่างวันที่ ${esc(sinceStr)} ถึงวันที่ ${esc(uptoStr)}
      </div>
    </section>

    <section class="eqp-section eqp-section--table">
      <table class="eqp-table">
        <thead>
          <tr>
            <th style="width:72px">ลำดับ</th>
            <th>รายการ</th>
            <th style="width:100px">จำนวน</th>
            <th style="width:260px">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>

    <div class="eqp-bottom">
      <div class="eqp-sign">
        <div class="sig sig-line">
          <span class="lab">ลงชื่อ</span>
          <span class="line"><span class="name">${esc(ctx.requester)}</span></span>
          <span class="role">ผู้ยืม</span>
        </div>
        <div class="date">${sigDateTimeTH}</div>
      </div>

      <div class="eqp-boxes">
        <div class="box">
          <div class="title">ผลการดำเนินการ/ผลการปฏิบัติงาน</div>
          <div class="dotrow"></div>
          <div class="dotrow"></div>
          <div class="sign-inline">
            <span class="lab">ลงชื่อ</span>
            <span class="dotfill"></span>
            <span class="role">ผู้ส่งมอบ</span>
          </div>
          <div class="date">........../........../..........</div>
        </div>

        <div class="box">
          <div class="title">ผลการดำเนินการ/ผลการปฏิบัติงาน</div>
          <div class="dotrow"></div>
          <div class="dotrow"></div>
          <div class="sign-inline">
            <span class="lab">ลงชื่อ</span>
            <span class="dotfill"></span>
            <span class="role">ผู้รับคืน</span>
          </div>
          <div class="date">........../........../..........</div>
        </div>
      </div>

      <div style="margin-top:20px">
        *หมายเหตุ หากอุปกรณ์เกิดการชำรุดเสียหายในระหว่างที่ผู้ยืมเป็นผู้รับผิดชอบ
        ผู้ยืมจะต้องชดใช้ค่าเสียหายที่เกิดขึ้นทั้งหมด
      </div>
    </div>

    <style>
      .eqp-head{ text-align:center; margin-bottom: 8px; }
      .eqp-head .t1{ font-weight:700; font-size:20px; }
      .eqp-head .t2{ font-size:14px; margin-top:2px; }
      .eqp-meta{ display:flex; justify-content:flex-end; margin: 8px 0 12px; }
      .eqp-meta .right-meta{ text-align:right; line-height:1.55; }
      .eqp-table{ width:100%; border-collapse:collapse; table-layout:fixed; }
      .eqp-table th,.eqp-table td{ border:1px solid #ccc; padding:8px 10px; text-align:center;
        vertical-align:middle; word-break:break-word; white-space:normal; }
      .eqp-table thead th{ font-weight:600; }
      .eqp-table tbody tr{ height:40px; }
      .eqp-sign{ display:grid; grid-template-columns:auto 240px auto; column-gap:8px; align-items:center; justify-content:end; text-align:unset; }
      .eqp-sign .sig-line{ display:contents; }
      .eqp-sign .sig-line .line{ height:1.2em; border-bottom:1px dotted #666; display:flex; align-items:flex-end; justify-content:center; }
      .eqp-sign .sig-line .name{ padding:0 6px; background:transparent; }
      .eqp-sign .date{ grid-column:2; justify-self:center; margin-top:6px; font-size:12px; line-height:1.2; }
      .eqp-boxes{ display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:18px; }
      .eqp-boxes .box{ border:1px solid #ccc; padding:12px; min-height:160px; }
      .eqp-boxes .title{ font-weight:600; margin-bottom:10px; text-align:center; }
      .eqp-boxes .dotrow{ border-bottom:1px dotted #777; height:1.6em; margin:8px 0; }
      .sign-inline{ display:flex; align-items:center; gap:6px; margin-top:10px; }
      .sign-inline .dotfill{ flex:1; border-bottom:1px dotted #666; height:1.2em; }
    </style>
  </div>`;
}
</script>
<!-- ===== GLOBAL (ไม่ scoped): วางแทนที่บล็อก <style> เดิมได้เลย ===== -->
<style>
@import '../css/style.css';

/* ===== Theme tokens (global) ===== */
:root{
  --c-primary:#1d4ed8; --c-primary-900:#1e3a8a;
  --c-accent:#213555;  --c-accent-2:#3a7ca5;
  --c-muted:#f3f4f6;   --c-surface:#ffffff; --c-card:#ebebeb;
  --c-danger:#f54c4f;  --c-danger-900:#7a292d;
  --c-success:#80e479; --c-success-900:#478a48;
  --c-border:#e6e9f2;  --c-border-2:#e2e8f0;
  --shadow-1:0 2px 8px rgba(0,0,0,.08);
  --shadow-2:0 4px 10px rgba(0,0,0,.15);
  --radius-sm:6px; --radius-md:10px; --radius-lg:12px;
  --thai-font:'THSarabunNew','Sarabun','Noto Sans Thai',system-ui,sans-serif;

  /* ความกว้างสูงสุดของ popup รายละเอียดอุปกรณ์ */
  --eqp-max: min(1400px, 98vw);
}

/* ===== Helpers ===== */
.swal-center-text,.swal-center-title{ text-align:center !important; }
.swal2-textarea{ min-height:110px !important; }

/* ===== SweetAlert: โครงฐาน ===== */
.swal2-popup .swal2-html-container{ overflow-x:hidden !important; }
.swal2-popup .swal-detail-wrap{ max-width:min(1240px,96vw); overflow-x:visible !important; }
.swal2-popup .swal-detail-actions{ text-align:center; margin-top:16px; }
.swal2-popup #pdf-btn,
.swal2-popup #attach-btn{
  background:var(--c-accent); color:#fff; padding:8px 18px; border-radius:8px; border:none; cursor:pointer; margin:0 6px;
}
.swal2-popup #attach-btn{ background:var(--c-accent-2); }

/* ===== ตารางทั่วไปใน Swal (2 คอลัมน์) ===== */
.swal2-popup .swal-detail-table{
  width:min(1200px,96vw); margin:0 auto; border-collapse:collapse; font-size:.98rem;
}
.swal2-popup .swal-detail-table tbody th{
  text-align:left; white-space:nowrap; background:#f7f9fc; border:1px solid var(--c-border);
  padding:8px 12px; width:180px; font-weight:700; color:#1f2a44;
}
.swal2-popup .swal-detail-table tbody td{
  border:1px solid var(--c-border); padding:8px 12px; color:#1f2a44; word-break:break-word;
}

/* ===== ตาราง “อุปกรณ์” ===== */
.swal2-popup .swal-detail-table.items{ table-layout:auto; width:100%; }
.swal2-popup .swal-detail-table.items thead th{
  background:var(--c-accent); color:#fff; padding:8px 10px; border:1px solid var(--c-border); text-align:center; font-weight:700;
}
.swal2-popup .swal-detail-table.items tbody td{ border:1px solid var(--c-border); padding:8px 10px; }
.swal2-popup .swal-detail-table.items td.c{ text-align:center; }

/* พรีเซ็ตคอลัมน์ (ไม่ซ้อนกันแล้ว) */
.swal2-popup .swal-detail-table.items th.col-name,
.swal2-popup .swal-detail-table.items td.col-name{ width:160px; max-width:160px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.swal2-popup .swal-detail-table.items th.col-qty,
.swal2-popup .swal-detail-table.items td.col-qty{ width:90px; }

.swal2-popup .swal-detail-table.items th.col-requester,
.swal2-popup .swal-detail-table.items td.col-requester{ min-width:200px; }

.swal2-popup .swal-detail-table.items th.col-period,
.swal2-popup .swal-detail-table.items td.col-period{
  /* ให้เห็นครบและยอมตัดบรรทัดเมื่อพื้นที่ไม่พอ */
  white-space:normal; word-break:break-word; overflow-wrap:anywhere;
}

/* ช่อง “อีเมล” — แสดงครบ ไม่ซ่อน ไม่ถูก .nowrap บังคับ */
.swal2-popup .swal-detail-table.items th.col-id,
.swal2-popup .swal-detail-table.items td.col-id,
.swal2-popup .swal-detail-table.items td.col-id.nowrap{
  width:clamp(280px,30vw,560px);
  max-width:none;
  white-space:normal !important;   /* ทับ .nowrap ที่อื่น */
  word-break:break-word;
  overflow-wrap:anywhere;
  text-overflow:clip;
  text-align:center;
}

/* ===== ขนาด popup (ใช้กฎเดียว ไม่ทับกัน) ===== */
.swal2-popup.swal-wide,
.swal2-popup.swal-form-approve,
.swal2-popup.swal-equip-approve{
  width:auto !important; max-width:min(1100px,98vw) !important; padding:26px !important; border-radius:var(--radius-lg) !important;
}

/* เฉพาะ “อุปกรณ์” — กว้างขึ้น */
.swal2-popup.swal-equipment{
  width:auto !important;
  max-width:var(--eqp-max) !important;
  padding:26px !important;
  border-radius:var(--radius-lg) !important;
  overflow:hidden !important; /* กันแถบเลื่อนแนวนอน */
}

/* M/L breakpoint */
@media (min-width:601px){
  .swal2-popup.swal-wide{ max-width:920px !important; padding:24px 18px !important; }
  .swal2-popup .swal-detail-wrap{ max-width:920px; }
  .swal2-popup .swal-detail-table,
  .swal2-popup .swal-detail-table.items{ width:920px; }
}

/* Mobile */
@media (max-width:600px){
  .swal2-popup.swal-wide,
  .swal2-popup.swal-equipment{ max-width:96vw !important; width:auto !important; }

  .swal2-popup .swal-detail-table.items th.col-name,
  .swal2-popup .swal-detail-table.items td.col-name{ width:150px; max-width:150px; }

  .swal2-popup .swal-detail-table.items th.col-id,
  .swal2-popup .swal-detail-table.items td.col-id{ width:auto; }
}

/* ===== Utilities (คงไว้ แต่รู้ว่าถูก override เฉพาะคอลัมน์อีเมล) ===== */
.swal2-popup .nowrap{ white-space:nowrap !important; word-break:normal !important; }

/* ===== MFU approve (คงของเดิม, ไม่แตะ) ===== */
.swal2-popup.swal-form-approve .swal2-html-container{ max-height:70vh; overflow:auto; margin:10px 0 0 !important; }
.swal2-popup.swal-form-approve .swal2-actions{ margin:18px 0 0 !important; }
.swal2-popup.swal-form-approve .mfu-form .mfu-list li.tight b{ min-width:60px !important; }

/* GLOBAL (ไม่ scoped) */
/* ใช้เฉพาะ success popup ของ approve_field */
.swal-success-wide .swal2-html-container{
  width: 100%;
  display: flex;              /* จัดกลางแนวนอนด้วย flex */
  justify-content: center;
  text-align: center !important;
  margin: 8px auto 0 !important; /* ขยับลงเล็กน้อยตามที่ต้องการ */
}
.swal-success-wide .swal2-title{
  text-align: center !important;
}


</style>


<!-- ===== SCOPED: ทำให้ตรงกับกฎหลัก และตัดส่วนที่ซ้ำ/ขัดกัน ===== -->
<style scoped>
/* Layout */
.histbody{ width:100%; height:100vh; padding:20px; box-sizing:border-box; overflow-x:hidden; }
.history-filter{ display:flex; gap:10px; margin:0 0 18px; padding-left:70px; }
.hist-grid{ display:flex; flex-direction:column; gap:1rem; padding:1rem 70px; }
.hist-card{ background:var(--c-card); border-radius:var(--radius-lg); box-shadow:var(--shadow-2); padding:1rem 1.5rem; width:100%; }
.hist-row{ display:flex; align-items:center; justify-content:space-between; gap:1rem; }
.item-name{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.status-group{ display:flex; gap:8px; justify-content:flex-end; }

/* Buttons */
.history-filter button,
.approve-btn,.cancel-btn,.detail-btn{
  font-weight:600; padding:7px 22px; border-radius:var(--radius-md); cursor:pointer;
  transition:background .2s,color .2s,border-color .2s;
  border:1.5px solid var(--c-border); background:var(--c-muted); color:var(--c-accent);
}
.history-filter button.active,
.history-filter button:hover{ background:var(--c-primary); color:#fff; border-color:var(--c-primary); }

.approve-btn,.cancel-btn,.detail-btn{ padding:4px 10px; font-size:.8rem; border:0; color:#fff; border-radius:var(--radius-sm); }
.approve-btn{ background:var(--c-success); } .approve-btn:hover{ background:var(--c-success-900); }
.cancel-btn{ background:var(--c-danger); margin-left:10px; } .cancel-btn:hover{ background:var(--c-danger-900); }
.detail-btn{ background:#304674; } .detail-btn:hover{ background:#2953d1; }

/* Overlay & Sidebar */
.sidebar-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.16); z-index:1100; }
.sidebar{ z-index:1200; }

/* Main table */
.table-container{ padding:0 70px; overflow-x:auto; }
.approve-table{
  width:100%; border-collapse:collapse; background:#fff; border-radius:var(--radius-lg);
  box-shadow:var(--shadow-1);
}
.approve-table th,.approve-table td{ padding:.75rem 1rem; text-align:center; border:1px solid var(--c-border); }
.approve-table th{ background:var(--c-primary-900); color:#fff; font-weight:700; }
.approve-table tr:last-child td{ border-bottom:none; }

/* MFU form */
.mfu-form{ font-family:var(--thai-font); color:#111; line-height:1.35; }
.mfu-head{ text-align:center; margin-bottom:10px; }
.mfu-title{ font-size:22px; font-weight:700; }
.mfu-sub{ font-size:14px; margin-top:4px; }
.mfu-meta{ display:flex; gap:18px; flex-wrap:wrap; font-size:16px; margin:10px 0 4px; }
.mfu-sec{ margin-top:12px; font-size:16px; }
.mfu-sec h4{ margin:0 0 6px; font-weight:700; }
.mfu-par{ text-indent:2em; margin-top:6px; }
.mfu-kv{ display:grid; grid-template-columns:200px 1fr; border:1px solid var(--c-border); border-bottom:0; }
.mfu-kv>div{ padding:8px 10px; border-bottom:1px solid var(--c-border); white-space:normal; word-break:break-word; overflow-wrap:anywhere; line-height:1.5; }
.mfu-kv .k{ background:#f7f9fc; font-weight:700; white-space:nowrap; }
.mfu-yn{ margin:6px 0 2px; } .mfu-yn span{ margin-right:18px; }

/* Sign */
.mfu-signrow{ display:flex; gap:24px; justify-content:space-between; margin-top:14px; }
.mfu-sign{ flex:1; }
.mfu-dots{ display:inline-block; min-width:210px; border-bottom:1px dotted #888; transform:translateY(-3px); }

/* Approve form overrides */
.swal2-popup.swal-form-approve .mfu-form{ --kv-left:250px; }
.swal2-popup.swal-form-approve .mfu-form .mfu-kv{ display:grid !important; grid-template-columns:var(--kv-left) 1fr !important; }
.swal2-popup.swal-form-approve .mfu-form .mfu-kv>div{ padding:10px 12px; line-height:1.6; }
.swal2-popup.swal-form-approve .mfu-form .mfu-yn{ margin:8px 0 6px; }
@media (max-width:900px){ .swal2-popup.swal-form-approve .mfu-form{ --kv-left:180px; } }
@media (max-width:600px){ .swal2-popup.swal-form-approve .mfu-form{ --kv-left:150px; } }
.swal2-popup.swal-form-approve .mfu-form .mfu-sign{ width:auto !important; text-align:right !important; align-self:flex-end !important; }
.swal2-popup.swal-form-approve .mfu-form .mfu-sign.mfu-signline{
  --sign-width: clamp(210px,36vw,260px);
  display:grid !important; width:fit-content; grid-template-columns:auto var(--sign-width);
  column-gap:6px; align-items:center; margin-left:auto !important; text-align:right;
}
.swal2-popup.swal-form-approve .mfu-form .mfu-sign.mfu-signline .lab{ white-space:nowrap; }
.swal2-popup.swal-form-approve .mfu-form .mfu-sign.mfu-signline .dots{ height:1.15em; border-bottom:1px dotted #888; }
.swal2-popup.swal-form-approve .mfu-form .mfu-sign.mfu-signline .name,
.swal2-popup.swal-form-approve .mfu-form .mfu-sign.mfu-signline .role{ grid-column:2; text-align:center; margin-top:6px; }

/* Boxes */
.mfu-boxes{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
.mfu-box{ border:1px solid #333; padding:12px 14px; min-height:170px; position:relative; }
.mfu-box h5{ margin:0 0 8px; font-size:16px; font-weight:700; text-align:center; }
.mfu-box .line{ margin:10px 0; }
.mfu-note{ margin-top:8px; font-size:14px; opacity:.9; }
.mfu-box .chk{ display:flex; align-items:center; gap:8px; cursor:pointer; }
.mfu-box input[type="checkbox"]{ width:16px; height:16px; cursor:pointer; }
.mfu-box .mfu-input{ flex:1; min-width:0; padding:6px 8px; border:1px solid #cbd5e1; border-radius:6px; font:inherit; }
.mfu-box .row{ display:flex; align-items:center; gap:8px; min-height:36px; }
.mfu-box .sig-row{ min-height:56px; }
.mfu-box .fill{ flex:1; border-bottom:1px dotted #444; height:1.15em; transform:translateY(-2px); }
.mfu-box .fill.full{ width:100%; }
.mfu-box .paren{ margin:0 4px; }

/* Boxes in Swal (2 cols, mobile 1 col) */
.swal2-popup.swal-form-approve .mfu-form .mfu-boxes{ display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:12px !important; }
@media (max-width:700px){ .swal2-popup.swal-form-approve .mfu-form .mfu-boxes{ grid-template-columns:1fr !important; } }

/* Equipment preview/sign */
.eqp-preview{ font-family:var(--thai-font); color:#111; }
.eqp-head{ text-align:center; margin-bottom:8px; }
.eqp-head .t1{ font-weight:700; font-size:20px; }
.eqp-head .t2{ font-size:14px; margin-top:2px; }
.eqp-user{ font-size:16px; line-height:1.6; margin:10px 0 12px; }
.eqp-user>div{ margin:2px 0; }
.eqp-par{ font-size:16px; line-height:1.75; text-indent:2em; word-break:break-word; margin:12px 0 18px; }

.eqp-table{ width:100%; border-collapse:collapse; table-layout:fixed; font-size:15px; margin:14px 0 22px; }
.eqp-table thead th{ background:var(--c-accent); color:#fff; border:1px solid var(--c-border); padding:10px 14px; text-align:center; font-weight:700; }
.eqp-table tbody td{ border:1px solid var(--c-border); padding:10px 14px; }
.eqp-table th,.eqp-table td{ white-space:normal !important; word-break:break-word !important; overflow-wrap:anywhere !important; vertical-align:top; }
.eqp-table td.c{ text-align:center; }
.eqp-table td.l{ text-align:left; overflow:visible !important; text-overflow:clip !important; }
.eqp-table thead th:nth-child(1){ width:18mm; }
.eqp-table thead th:nth-child(3){ width:22mm; }
.eqp-table thead th:nth-child(4){ width:60mm; }

/* Sign block in Swal */
.eqp-sign{ margin:16px 0 6px; display:flex; flex-direction:column; align-items:flex-end; text-align:right; }
.eqp-sign .sig{ text-align:right; line-height:1.6; }
.eqp-sign .sig-line{ display:grid; grid-template-columns:auto 240px auto; align-items:center; column-gap:8px; }
.eqp-sign .sig-line .line{ height:1.2em; border-bottom:1px dotted #666; display:flex; align-items:flex-end; justify-content:center; }
.eqp-sign .sig-line .name{ padding:0 6px; background:transparent; }
.eqp-sign .date{ margin-top:6px; }
.swal2-popup .eqp-sign{ display:grid !important; grid-template-columns:auto 240px auto !important; column-gap:8px !important; align-items:center !important; justify-content:end !important; text-align:unset !important; }
.swal2-popup .eqp-sign .sig-line{ display:contents !important; }
.swal2-popup .eqp-sign .date{ grid-column:2 !important; justify-self:center !important; margin-top:6px; }

/* (อาศัยกฎคอลัมน์จากบล็อกหลักแล้ว ไม่ต้องประกาศซ้ำ) */

/* Mobile */
@media (max-width:600px){
  .item-name{ white-space:normal !important; word-break:break-word !important; overflow:visible !important; text-overflow:unset !important; max-width:100%; display:block !important; font-weight:500; text-align:center; margin-bottom:4px; }
  .histbody{ display:flex; flex-direction:column; align-items:center; padding:14px 0 0 !important; width:100vw; overflow-x:auto !important; }
  .histbody>h1{ padding-left:0 !important; width:100vw; text-align:center !important; font-size:1.35rem; margin-bottom:16px; }
  .history-filter{ justify-content:center !important; padding-left:0 !important; width:100vw; margin-bottom:18px; }
  .hist-grid{ width:95vw; max-width:440px; padding:0; gap:1rem; align-items:center; }
  .hist-card{ min-width:95vw; max-width:440px; margin:0 auto; box-sizing:border-box; }
  .hist-row{ flex-direction:column !important; align-items:center !important; width:100% !important; gap:.5rem; justify-content:center !important; }
}

/* จุดเฉพาะกิจ */
.mfu-box #head_other_reason{ border:none !important; background:transparent !important; padding:0 !important; min-width:0 !important; box-shadow:none !important; }
.mfu-box .row{ align-items:baseline; flex-wrap:nowrap; }
.mfu-ta{ display:inline-block; width:auto; flex:1; min-width:0; }
.mfu-box .chk{ white-space:nowrap; }
.mfu-box .sig-row{ height:56px; display:flex; align-items:flex-end; }
.mfu-box .sig-row + .row{ margin-top:0; align-items:center; }

/* === SweetAlert: success popup ให้กว้างขึ้น === */
.swal-success-wide.swal2-popup{
  max-width: 900px !important;   /* กว้างขึ้นจากค่าเริ่มต้น ~32em */
  width: 900px !important;        /* เผื่อบางธีมอิง width */
}
@media (max-width: 980px){
  .swal-success-wide.swal2-popup{ max-width: 92vw !important; width: 92vw !important; }
}

/* จัดข้อความ HTML ของ SweetAlert ให้อยู่กลาง และเลื่อนลงนิด */
.swal-center-below{ 
  text-align: center !important;
  margin: 8px auto 0 !important;   /* ดันลงด้านล่างเล็กน้อย */
  width: 100%;
}



/* ให้ไอคอนกับหัวข้อมีระยะห่างที่พอดี */
.swal-success-wide .swal2-icon{ margin: 10px auto 6px !important; }

.swal-success-wide .swal2-title{ text-align: center !important; }

</style>