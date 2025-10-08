<template>
  <div class="layout">
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
          <router-link to="/profile_super"><i class="pi pi-user"></i></router-link>
        </div>
      </header>
      <div class="histbody">
        <h1 style="padding-left: 50px; display: flex; justify-content: center;">Field Approve</h1>


        <!-- ตารางอนุมัติ (table) -->
        <div class="table-container">
          <table class="approve-table">
            <thead>
              <tr>
                <th>Transaction date</th>
                <th>Type</th>
                <th>Field</th>
                <th>Time</th>
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
                    <!-- <button class="cancel-btn" @click="cancelGroup(group)">ไม่อนุมัติ</button> -->
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
      userEmailById: {},
      isMobile: window.innerWidth <= 600,
      grouped: [],
      lastSeenTimestamp: 0,
      refreshTimer: null,
      _lastSnapshot: '',
      head_choice: null,
      head_reason: '',
      loggedThaiName:
        ((localStorage.getItem('firstname') || '') + ' ' + (localStorage.getItem('lastname') || '')).trim()
        || localStorage.getItem('name') || '-',
      loggedSignatureUrl: localStorage.getItem('signature_url') || '',

      thainame_admin:
      (localStorage.getItem('thainame_admin') ||
       `${(localStorage.getItem('firstname')||'')} ${(localStorage.getItem('lastname')||'')}`.trim() ||
       localStorage.getItem('name') || '-'),
      signaturePath_admin:
      (localStorage.getItem('signaturePath_admin') ||
       localStorage.getItem('signature_url') || ''),
       head_choice_supervisor: null,
        head_reason_supervisor: '',

    }
  },
  computed: {
    filteredGrouped() {
      if (this.filterType === 'all') return this.grouped
      return this.grouped.filter(g => g.type === this.filterType)
    }
  },
  methods: {

    // ========== บังคับ A4 หน้าเดียว ==========
// ========== บังคับ A4 หน้าเดียว + แก้ textarea เป็นข้อความก่อนแคปเจอร์ ==========
async _makeA4OnePageBlob(element) {
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }

  const MARGIN_MM = 10;

  const orig = {
    width: element.style.width, margin: element.style.margin, padding: element.style.padding,
    boxSizing: element.style.boxSizing, transform: element.style.transform,
    transformOrigin: element.style.transformOrigin, position: element.style.position,
    left: element.style.left, top: element.style.top, display: element.style.display,
  };

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, { width: '210mm', background: '#fff', display: 'block', padding: '0', margin: '0' });

  element.style.width = '190mm';
  element.style.margin = '10mm auto';
  element.style.padding = '0';
  element.style.boxSizing = 'border-box';
  element.style.transform = 'none';
  element.style.transformOrigin = 'top left';
  element.style.position = 'static';
  element.style.display  = 'block';

  const hadPrintClass = element.classList.contains('pdf-print');
  element.classList.add('pdf-print');

  const parent = element.parentNode;
  parent.insertBefore(wrapper, element);

  // clone for safe editing
  const clone = element.cloneNode(true);

  // sanitize target text nodes (remove "อื่นๆ" and colons) - same as before
  (function sanitizeTargetText(root) {
    const reOther = /(^|\s)อื่นๆ:?\s*/gi;
    const targets = [
      ['เลขานุการ','ศูนย์','กีฬา'],
      ['หัวหน้า','ศูนย์','กีฬา']
    ];
    const candidates = root.querySelectorAll('label, .chk, .mfu-box .row, .mfu-box .chk, .mfu-box label, span, div');
    candidates.forEach(node => {
      try {
        const fullText = (node.textContent || '').toString();
        if (!fullText.trim()) return;
        const lower = fullText.replace(/\s+/g,' ').toLowerCase();
        const matched = targets.some(kw => kw.every(k => lower.includes(k)));
        if (!matched) return;
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        const tnodes = [];
        let tn;
        while (tn = walker.nextNode()) tnodes.push(tn);
        tnodes.forEach(t => {
          try {
            let s = t.nodeValue || '';
            if (reOther.test(s)) s = s.replace(reOther, '$1');
            s = s.replace(/[:\uFE55]/g, ' ').replace(/\s+/g, ' ');
            if (s !== (t.nodeValue || '')) t.nodeValue = s;
          } catch(e){}
        });
      } catch(e){}
    });
  })(clone);

  // CSS to hide checkmarks/icons in clone while preserving layout
  const styleTag = document.createElement('style');
  styleTag.type = 'text/css';
  styleTag.textContent = `
    .pdf-temp-root input[type="checkbox"] { visibility: hidden !important; opacity: 0 !important; }
    .pdf-temp-root label::before, .pdf-temp-root label::after { display: none !important; content: none !important; }
    .pdf-temp-root label svg, .pdf-temp-root .chk svg, .pdf-temp-root .icon-check, .pdf-temp-root .tick { display: none !important; }
    .pdf-temp-root label, .pdf-temp-root .chk, .pdf-temp-root .checkbox { background-image: none !important; background: transparent !important; }
    .pdf-temp-root input[type="checkbox"] { display: inline-block !important; width: 16px; height: 16px; vertical-align: middle; }
  `;

  const cloneHolder = document.createElement('div');
  cloneHolder.className = 'pdf-temp-root';
  cloneHolder.style.width = '190mm';
  cloneHolder.style.margin = '10mm auto';
  cloneHolder.style.boxSizing = 'border-box';
  cloneHolder.style.padding = '0';
  cloneHolder.appendChild(styleTag);
  cloneHolder.appendChild(clone);

  // ---- Materialize controls on clone BUT replace input with text node DIV (avoid duplication) ----
  try {
    // textarea sizing
    clone.querySelectorAll('textarea').forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });

    const selectors = [
      'textarea',
      'input[type="text"]','input[type="search"]','input[type="email"]',
      'input[type="number"]','input[type="tel"]','input[type="url"]'
    ].join(',');

    clone.querySelectorAll(selectors).forEach(ctrl => {
      try {
        const val = (ctrl.value ?? '').toString();
        // If empty and not textarea: do nothing (keep original placeholder/layout)
        if (!val && ctrl.tagName !== 'TEXTAREA') return;

        // Create replacement DIV (text-only) with same computed style
        const repl = document.createElement('div');
        repl.className = 'pdf-ta-repl';
        repl.textContent = val;
        const cs = window.getComputedStyle(ctrl);
        Object.assign(repl.style, {
          whiteSpace: 'pre-wrap',
          wordBreak:  'break-word',
          lineHeight: cs.lineHeight,
          font:       cs.font,
          fontSize:   cs.fontSize,
          fontFamily: cs.fontFamily,
          color:      '#111',
          display:    (cs.display === 'inline') ? 'inline-block' : 'block',
          padding:    cs.padding,
          margin:     cs.margin,
          width:      cs.width,
          minHeight:  cs.height,
          border:     '0',
        });

        // Replace the input element itself with repl — this prevents duplication
        // If ctrl is inside label and other text nodes are present, replacing ctrl keeps other text nodes intact
        const parentEl = ctrl.parentNode;
        if (parentEl) {
          try {
            parentEl.replaceChild(repl, ctrl);
          } catch (e) {
            // fallback: hide ctrl and insert repl after (less ideal)
            try { ctrl.style.display = 'none'; parentEl.insertBefore(repl, ctrl.nextSibling); } catch(_) {}
          }
        } else {
          // if no parent (rare), just hide ctrl and insert repl nearby
          try { ctrl.style.display = 'none'; ctrl.parentNode && ctrl.parentNode.insertBefore(repl, ctrl.nextSibling); } catch(_) {}
        }
      } catch (e) {
        // ignore per-control errors
      }
    });
  } catch (e) {
    console.warn('materialize clone failed', e);
  }

  wrapper.appendChild(cloneHolder);

  // give browser a frame to layout
  await new Promise(r => requestAnimationFrame(r));

  const worker = html2pdf().set({
    html2canvas: {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      letterRendering: true
    }
  }).from(wrapper).toCanvas();

  const canvas = await worker.get('canvas');
  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const maxW = pageW - MARGIN_MM * 2;
  const maxH = pageH - MARGIN_MM * 2;
  const imgRatio = canvas.width / canvas.height;
  const boxRatio = maxW / maxH;
  let drawW, drawH;
  if (imgRatio > boxRatio) { drawW = maxW; drawH = drawW / imgRatio; }
  else { drawH = maxH; drawW = drawH * imgRatio; }
  const x = (pageW - drawW) / 2, y = (pageH - drawH) / 2;

  pdf.addImage(imgData, 'JPEG', x, y, drawW, drawH);
  const pdfBlob = pdf.output('blob');

  // cleanup
  try { wrapper.remove(); } catch(_) {}
  if (!hadPrintClass) element.classList.remove('pdf-print');
  Object.assign(element.style, orig);

  return pdfBlob;
},







// เรียกจาก SweetAlert preview -> สร้าง/ดาวน์โหลด PDF 1 หน้า
async _downloadApprovePreviewPdf(group) {
  try {
    const p = Swal.getPopup();
    const formEl = p?.querySelector('.mfu-form'); // เนื้อหาพรีวิวที่ buildFieldFormPreviewV2 สร้าง
    if (!formEl) {
      Swal.fire('ผิดพลาด', 'ไม่พบเนื้อหาแบบฟอร์มสำหรับทำ PDF', 'error');
      return;
    }
    const blob = await this._makeA4OnePageBlob(formEl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const bid = group?.booking_id || group?.items?.[0]?.booking_id || 'preview';
    a.href = url;
    a.download = `field_form_${bid}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error(e);
    Swal.fire('ผิดพลาด', 'ไม่สามารถสร้างไฟล์ PDF ได้', 'error');
  }
},


    getMongoId(h) {
  const id = h?._id?.$oid || h?._id;
  if (!id) return '';                  // ถ้าไม่มีจริง ๆ ให้เป็นค่าว่างไปเลย
  return String(id);
},

    resolveSignUrl(raw) {
  if (!raw) return '';
  let u = String(raw).trim();
  if (/^data:image\//i.test(u)) return u;                 // base64
  if (/^(https?:|blob:)/i.test(u)) return u;               // URL เต็ม/Blob
  if (/^\/\//.test(u)) return window.location.protocol + u;

  const base = (API_BASE || window.location.origin).replace(/\/+$/,'');
  if (u.startsWith('/')) return base + u;                  // /uploads/...
  return base + '/' + u.replace(/^\.?\//,'');              // uploads/..., ./uploads/...
},
    // 👇 วางไว้ใน methods
  // ผ่อนเงื่อนไข: ถือว่า "ผ่านเลขาฯแล้ว" ถ้ามีสัญญาณใดสัญญาณหนึ่งด้านล่าง

  buildUserSigIndex(users = []) {
  const idx = {};
  const put = (k, v) => {
    const key = (k ?? '').toString().trim();
    if (key) idx[key] = v;
  };

  users.forEach(u => {
    const sig = this.resolveSignUrl(u?.signaturePath || u?.signature_url || '');
    if (!sig) return;

    // กุญแจที่มักใช้หาเจ้าของคำขอ
    put(u?.user_id, sig);
    put(u?.id_form, sig);
    put(u?.email,   sig);

    const fullname =
      ((u?.firstname || '') + ' ' + (u?.lastname || '')).trim() || u?.name || '';
    put(fullname, sig);
  });

  return idx; // คืน object สำหรับ map ค่าลายเซ็น
},


hasSecretaryMeta(h) {
  const hasBy   = typeof h?.approvedBy === 'string'
    ? h.approvedBy.trim() !== ''
    : !!h?.approvedBy;
  const hasById = typeof h?.approvedById === 'string'
    ? h.approvedById.trim() !== ''
    : !!h?.approvedById;
  const hasAt   = !!h?.approvedAt;
  return hasBy && hasById && hasAt;
},

hasAdminApprovedStep(h) {
  const steps = Array.isArray(h?.step) ? h.step : [];
  const admin = steps.find(s => String(s?.role).toLowerCase() === 'admin');
  const superv = steps.find(s => String(s?.role).toLowerCase() === 'super');
  const adminApproved = !!admin && admin.approve === true;
  const superNotApproved = !superv || superv.approve !== true;
  return adminApproved && superNotApproved;
},

// งานที่ "รอหัวหน้า" = field + status:pending + ผ่านเลขาฯแล้ว + (super ยังไม่อนุมัติ)
isSuperPending(h) {
  const typeOk = String(h?.type || '').toLowerCase() === 'field';

  // ดู step ก่อน: admin ผ่านแล้ว แต่ super ยัง
  const byStep = this.hasAdminApprovedStep(h) || this.hasSecretaryMeta(h);

  // สถานะที่ถือว่า "ปิดงานแล้ว"
  const finalStatuses = new Set(['approved','rejected','cancelled','canceled','returned','done','complete']);

  const st = String(h?.status || '').toLowerCase().trim();

  // ถ้าไม่มีสถานะ ให้ถือว่ายังเปิดอยู่
  const stillOpen = !st || !finalStatuses.has(st);

  return typeOk && byStep && stillOpen;
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
  if (!raw) return null;
  let u = String(raw).trim();
  if (u.startsWith('/')) u = new URL(u, window.location.origin).href;
  return u;
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

   // ===== methods: fetchAndGroup() =====
// ===== methods: fetchAndGroup() =====
async fetchAndGroup() {
  try {
    // โหลด users ครั้งแรกถ้ายังไม่มี (ชื่อ + ลายเซ็น)
    if (!Object.keys(this.userMap || {}).length) {
      const userRes = await axios.get(`${API_BASE}/api/users`);
      this.userMap = {};
      this.userSigMap = {};

      (userRes.data || []).forEach(u => {
        this.userMap[u.user_id] =
          (u.firstname && u.lastname)
            ? `${u.firstname} ${u.lastname}`
            : (u.name || u.user_id);

        const sig = this.resolveSignUrl(u.signaturePath || u.signature_url || '');
        this.userSigMap[u.user_id] = sig || '';
      });
    }

    // 1) ดึงข้อมูล “รอหัวหน้า” เท่านั้น
    const res  = await axios.get(`${API_BASE}/api/history/approve_field`, { params: { mode: 'super' } });
    const raw  = Array.isArray(res.data) ? res.data : [];

    // 2) เผื่อ safety อีกชั้น (กันหลุด) — กรองเฉพาะ field ที่ pending และผ่านเลขาฯ/แอดมินแล้ว
    const rawFiltered = raw.filter(h => this.isSuperPending(h));

    // 3) map ให้เป็นรูปแบบที่หน้าตารางใช้
    const bookings = rawFiltered.map(h => ({
      id:         this.getMongoId(h),
      type:       'field',
      booking_id: h.booking_id || '',

      // meta จดหมาย/หัวฟอร์ม
      aw:            h.aw ?? h.aw_no ?? h.reference ?? h.ref_no ?? '-',
      tel:           h.tel ?? h.phone ?? h.telephone ?? '-',
      agency:        h.agency ?? h.department ?? h.org ?? h.organization ?? '-',
      name_active:   h.name_active ?? '',
      name_activity: h.name_active ?? h.name_activity ?? h.activity ?? h.activity_name ?? h.project_name ?? '-',
      reasons:       h.reasons ?? h.reason ?? '-',

      // เวลา
      since_time:     h.since_time ?? h.startTime ?? '',
      until_thetime:  h.until_thetime ?? h.endTime   ?? '',

      // ข้อมูลสนาม
      name:       h.name ?? '-',
      zone:       h.zone ?? '-',
      requester:  h.requester ?? '-',
      user_id:    h.user_id ?? '-',
      username_form:     h.username_form || '-',
      id_form:           h.id_form || '-',
      proxyStudentName:  h.proxyStudentName || h.proxy_name || '',
      proxyStudentId:    h.proxyStudentId   || h.proxy_id   || '',

      date:      h.date ?? '-',
      since:     h.since ?? '-',
      uptodate:  h.uptodate ?? '-',
      startTime: h.startTime || '',
      endTime:   h.endTime   || '',

      participants:  h.participants ?? h.participant ?? h.participant_count
                   ?? h.numParticipants ?? h.num_participants ?? '-',

      status:    (h.status || '').toLowerCase(),

      // สาธารณูปโภค
      utilityRequest:  h.utilityRequest ?? h.utility_request ?? h.utilities ?? h.utility ?? '',
      turnon_air:      h.turnon_air ?? h.turnOnAir ?? h.air_on ?? '',
      turnoff_air:     h.turnoff_air ?? h.turnOffAir ?? h.air_off ?? '',
      turnon_lights:   h.turnon_lights ?? h.turnOnLights ?? h.light_on ?? '',
      turnoff_lights:  h.turnoff_lights ?? h.turnOffLights ?? h.light_off ?? '',
      restroom:        h.restroom ?? h.restroom_text ?? h.use_restroom ?? '',
      other:           h.other ?? h.other_text ?? '',

      // ✅ ห้องที่ต้องการใช้
      room_request:
      (h.room_request ?? h.roomRequest ??
      h.form?.room_request ?? h.form?.roomRequest ??
      h.booking_field?.room_request ?? h.booking_field?.roomRequest ?? ''),


      // รายการประกอบอาคาร
      facilityRequest: h.facilityRequest ?? h.facility_request ?? h.facility ?? '',
      amphitheater:    h.amphitheater ?? h.pull_grandstand ?? '',
      need_equipment:  h.need_equipment ?? h.sport_equipment ?? h.equipment ?? '',

      createdAt: h.createdAt?.$date || h.createdAt || h.created_at?.$date || h.created_at || null,
      updatedAt: h.updatedAt?.$date || h.updatedAt || h.updated_at?.$date || h.updated_at || null,

      // meta เลขาฯ
      approvedBy:       h.approvedBy,
      approvedById:     h.approvedById,
      approvedAt:       h.approvedAt,
      reason_admin:     h.reason_admin,
      secretary_choice: h.secretary_choice,

      // ชื่อ/ลายเซ็นเลขาฯ (กล่องที่ 1)
      secThaiName: h.thaiName_admin ?? h.thainame_admin ?? h.thaiName ?? h.approvedBy ?? '',
      secSignUrl:  h.signaturePath_admin ?? h.signaturePath ?? h.signature_url ?? '',
    }));

    // 4) จัดเป็นกลุ่ม field
    const fieldGroups = bookings.map(f => ({
      type: 'field',
      booking_id: f.booking_id || '',
      items: [f],
    }));

    // 5) เรียงล่าสุดก่อน
    const safeToTime = (v) => {
      if (!v) return 0;
      const s = String(v).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y,m,d] = s.split('-').map(Number);
        return new Date(y, m - 1, d).getTime() || 0;
      }
      const t = new Date(s).getTime();
      return isNaN(t) ? 0 : t;
    };
    fieldGroups.sort((A, B) => {
      const a0 = A.items?.[0] || {};
      const b0 = B.items?.[0] || {};
      const ta = safeToTime(a0.updatedAt) || safeToTime(a0.createdAt) || safeToTime(a0.date);
      const tb = safeToTime(b0.updatedAt) || safeToTime(b0.createdAt) || safeToTime(b0.date);
      return tb - ta;
    });

    // 6) set state เมื่อข้อมูลเปลี่ยน
    const snap = this._makeSnapshot(fieldGroups);
    if (snap !== this._lastSnapshot) {
      this.grouped = fieldGroups;
      this._lastSnapshot = snap;
    }
  } catch (err) {
    console.error('โหลด/จัดกลุ่มข้อมูลอนุมัติไม่สำเร็จ:', err);
  }
},







// ===== อนุมัติรายการ (สำหรับ SUPER) =====
async approveGroup(group) {
  const groupType = String(group.type || group.items?.[0]?.type || '').toLowerCase().trim();

  // ====== เตรียมชื่อ/ลายเซ็นหัวหน้า (super) ======
  let headThaiName = this.loggedThaiName || '';
  let headSignUrl  = this.resolveSignUrl(this.loggedSignatureUrl || '');
  try {
    const uid   = (localStorage.getItem('user_id') || '').trim();
    const email = (localStorage.getItem('email') || '').trim();
    const resAll = await axios.get(`${API_BASE}/api/users`);
    const users  = Array.isArray(resAll.data) ? resAll.data : [];

    const me = users.find(u => String(u.user_id || '').trim() === uid)
            || users.find(u => (u.email && String(u.email).trim() === email))
            || null;

    headThaiName = (me?.thaiName || me?.thainame
      || ((me?.firstname && me?.lastname) ? `${me.firstname} ${me.lastname}` : me?.name) || ''
    ).toString().trim() || headThaiName;

    headSignUrl = this.resolveSignUrl(me?.signaturePath || me?.signature_url || headSignUrl);
  } catch (_) { /* เงียบไว้ */ }

  // ====== เปิดพรีวิว (เฉพาะ field) เพื่อเลือก/กรอกก่อนอนุมัติ ======
  let uploadedUrl = '';
  if (groupType === 'field') {
    const it = group.items?.[0] || {};

    // ลายเซ็นผู้ยื่นคำขอจาก user_id / id_form
    const reqKey     = it.user_id || it.id_form || '';
    const reqSignUrl = this.resolveSignUrl(this.userSigMap?.[reqKey] || '');

    // HTML ฟอร์มพรีวิว
    const html = buildFieldFormPreviewV2(
      { ...it, approvedAt: it.approvedAt || it.updatedAt || it.createdAt },
      it.secThaiName || it.thaiName_admin || it.thainame_admin || it.approvedBy || '',
      this.resolveSignUrl(it.secSignUrl || it.signaturePath_admin || it.signaturePath || it.signature_url || ''),
      headThaiName,
      headSignUrl,
      reqSignUrl
    );

    // SweetAlert
    const result = await Swal.fire({
      title: "ยืนยันอนุมัติใช้งานสถานที่",
      html,
      width: 1100,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "ยืนยันอนุมัติ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#695CF7",
      customClass: { popup: "swal-form-approve", title: "swal-center-title", confirmButton: "btn-violet" },

      didOpen: () => {
        const p = Swal.getPopup();

        // เปิด element ฝั่งหัวหน้า
        ['head_to_vice','head_for_consider','head_other_chk','head_other_reason']
          .forEach(id => { const el = p.querySelector('#'+id); if (el) el.disabled = false; });

        const chkOther = p.querySelector('#head_other_chk');
        const boxOther = p.querySelector('#head_other_reason');

        // จำกัด 3 บรรทัด + 110 ตัวอักษร + auto-grow
        const capTo3Lines = () => {
          if (!boxOther) return;
          let v = (boxOther.value || '').replace(/\r/g,'');
          const parts = v.split('\n');
          if (parts.length > 3) boxOther.value = parts.slice(0, 3).join('\n');
        };
        const autoGrow = () => {
          if (!boxOther) return;
          boxOther.style.height = 'auto';
          const cs   = window.getComputedStyle(boxOther);
          const lh   = parseFloat(cs.lineHeight) || 22;
          const maxH = lh * 3;
          const h    = Math.min(boxOther.scrollHeight, maxH);
          boxOther.style.height = h + 'px';
          boxOther.style.overflowY = (boxOther.scrollHeight > maxH) ? 'auto' : 'hidden';
        };
        const ensureChecked = () => { if (chkOther && !chkOther.checked) chkOther.checked = true; };

        boxOther?.addEventListener('focus', ensureChecked);
        boxOther?.addEventListener('click', ensureChecked);
        boxOther?.addEventListener('input', () => {
          if (boxOther.value.length > 110) boxOther.value = boxOther.value.slice(0,110);
          capTo3Lines(); ensureChecked(); autoGrow();
        });

        capTo3Lines(); autoGrow();

        // ต้องติ๊ก "เห็นชอบ" ก่อนถึงกดยืนยันได้
        const okChk = p.querySelector('#head_to_vice');
        const syncConfirm = () => okChk?.checked ? Swal.enableConfirmButton() : Swal.disableConfirmButton();
        Swal.disableConfirmButton();
        okChk?.addEventListener('change', syncConfirm);
        syncConfirm();
      },

      preConfirm: () => {
        const p = Swal.getPopup();
        const q = (id) => p.querySelector('#'+id);

        if (!q('head_to_vice')?.checked) {
          Swal.showValidationMessage('กรุณากด "เห็นชอบ" ก่อนยืนยันอนุมัติ');
          return false;
        }

        const cap3 = s => (s || '').replace(/\r/g,'').split('\n').slice(0,3).join('\n');
        const rawOther = cap3(q('head_other_reason')?.value || '').slice(0,110).trim();
        const otherChecked = (q('head_other_chk')?.checked) || rawOther !== '';

        // เก็บไว้ใช้ตอนส่ง payload
        this.head_reason_supervisor = rawOther;
        this.head_choice_supervisor = {
          to_vice_supervisor:       true,
          for_consider_supervisor:  !!q('head_for_consider')?.checked,
          other_checked_supervisor:  otherChecked
        };
        return true;
      }
    });

    if (!result.isConfirmed) return;

    // ====== สร้าง/อัปโหลด PDF จากพรีวิว (ทำได้ก็ดี ไม่ได้ก็ไปต่อ) ======
    try {
      const p = Swal.getPopup();
      const formEl = p?.querySelector('.mfu-form');
      if (formEl) {
        const blob = await this._makeA4OnePageBlob(formEl);
        const bid  = group?.booking_id || it.booking_id || 'booking';
        const fd = new FormData();
        fd.append('file', blob, `field_form_${bid}.pdf`);
        const up = await axios.post(`${API_BASE}/api/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrl = up.data?.url || up.data?.path || '';
      }
    } catch (e) {
      console.warn('สร้าง/อัปโหลด PDF ไม่สำเร็จ (อนุมัติต่อได้):', e);
    }
  }

  // ===== ส่งอนุมัติไป backend =====
  const adminUserId = localStorage.getItem("user_id") || "";
  const approveDate = new Date().toISOString();

  // กันรายการซ้ำใน group.items
  const seen = new Set();
  const uniqItems = [];
  for (const it of (group.items || [])) {
    const key = String(it.id ?? it._id ?? "");
    if (key && !seen.has(key)) { seen.add(key); uniqItems.push(it); }
  }

  Swal.fire({ title: "กำลังดำเนินการ...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });

  const ok = [], fail = [];
  for (const item of uniqItems) {
    const isFieldItem = String(item.type || group.type).toLowerCase().trim() === "field";
    const url = isFieldItem
      ? `${API_BASE}/api/history/${item.id}/approve_field_super`
      : `${API_BASE}/api/history/${item.id}/approve_equipment`;

    // ✅ ระบุว่า super อนุมัติแล้วผ่าน step[] (และคง status: 'approved' ไว้ตามระบบเดิม)
    const payload = isFieldItem
      ? {
          admin_id: adminUserId,
          status: 'approved',

          to_vice_supervisor:       this.head_choice_supervisor?.to_vice_supervisor || false,
          for_consider_supervisor:  this.head_choice_supervisor?.for_consider_supervisor || false,
          other_checked_supervisor: this.head_choice_supervisor?.other_checked_supervisor || false,
          reason_supervisor:        this.head_reason_supervisor || '',

          thaiName_supervisor:      headThaiName || '',
          signaturePath_supervisor: headSignUrl  || '',
          approvedAt_supervisor:    approveDate,
          head_choice_supervisor: {
            to_vice_supervisor:       this.head_choice_supervisor?.to_vice_supervisor || false,
            for_consider_supervisor:  this.head_choice_supervisor?.for_consider_supervisor || false,
            other_checked_supervisor: this.head_choice_supervisor?.other_checked_supervisor || false
          },

          // 👇 สำคัญ: mark ว่า super อนุมัติแล้ว
          step: [{ role: 'super', approve: true, actedAt: approveDate }],

          ...(uploadedUrl ? { bookingPdfUrl: uploadedUrl } : {})
        }
      : { staff_id: adminUserId, status: 'approved', approvedAt: approveDate };

    try {
      const res = await axios.patch(url, payload, {
        headers: { "X-Idempotency-Key": `${item.id}-${item.booking_id || ""}-${approveDate}` }
      });
      ok.push({ item, res });
    } catch (err) {
      const code = err?.response?.status;
      const msg = (err?.response?.data?.message || "").toString();
      if (code === 409 || /already|อนุมัติแล้ว|processed|not pending/i.test(msg)) {
        ok.push({ item, res: { data: "skipped" } });
      } else {
        fail.push({ item, err });
      }
    }
  }

  // รีเฟรชตาราง
  try { await this.fetchAndGroup(); } catch (_) {}

  if (ok.length) {
  Swal.fire({
    icon: 'success',
    title: 'สำเร็จ',
    text: 'อนุมัติเรียบร้อยแล้ว',
    width: 520,                        // ← ปรับตัวเลขตามต้องการ
    customClass: {
    popup: 'swal-success-wide',      // ใช้อยู่แล้ว
    title: 'swal-center-title',      // จัดกลางหัวข้อ
    htmlContainer: 'swal-center-text'// จัดกลางข้อความบรรทัดล่าง
  }
  });
} else {
  const e = fail[0]?.err;
  const msg = e?.response?.data?.message || e?.message || "ไม่สามารถอนุมัติได้";
  const status = e?.response?.status;
  Swal.fire({
    icon: 'error',
    title: 'ผิดพลาด',
    text: `${msg}${status ? ` (รหัส ${status})` : ""}`,
    width: 520,
    customClass: { popup: 'swal-success-wide' }  // จะได้กว้างเท่ากัน
  });
}

},



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
    // ให้ตรงกับตาราง: ใช้ grouped ที่ผ่าน isSuperPending() จาก fetchAndGroup แล้ว
    if (!Array.isArray(this.grouped) || this.grouped.length === 0) {
      await this.fetchAndGroup();
    }

    const toTs = (v) => {
      if (!v) return 0;
      const s = String(v).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y,m,d] = s.split('-').map(Number);
        return new Date(y, m - 1, d).getTime() || 0;
      }
      const t = new Date(s).getTime();
      return isNaN(t) ? 0 : t;
    };

    // สร้าง noti จากกลุ่มที่ “เห็นในตาราง”
    const notis = (this.grouped || []).map(g => {
      const it = g.items?.[0] || {};
      const ts = toTs(it.updatedAt) || toTs(it.createdAt) || toTs(it.date) || Date.now();
      const zone = it.zone && it.zone !== '-' ? ` (โซน: ${it.zone})` : '';
      const timeStr = this.formatTimeRangeTH(it.startTime, it.endTime);
      const dayStr = it.since ? this.formatDate(it.since) : (it.date ? this.formatDate(it.date) : '-');

      let msg = `สนาม '${it.name || '-'}'${zone} รออนุมัติ`;
      

      return {
        id: `field_${g.booking_id || it.id || ts}`, // ให้ unique ต่อ booking
        type: 'field',
        timestamp: ts,
        message: msg
      };
    });

    // จัด unique + เรียงล่าสุดก่อน
    const seen = new Set();
    const unique = [];
    for (const n of notis) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      unique.push(n);
    }
    unique.sort((a, b) => b.timestamp - a.timestamp);

    // อัปเดต dropdown + badge
    this.notifications = unique;
    this.unreadCount = unique.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch (_) {
    // เงียบไว้ ไม่ต้องเด้ง error
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

  // ---------- helpers ภายใน ----------
  const pickUserId = (obj = {}) => String(obj.user_id || obj._user_id || '').trim();

  const buildEmailMap = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users`);
      const users = Array.isArray(res.data) ? res.data : [];
      return users.reduce((acc, u) => {
        const uid = String(u.user_id || '').trim();
        const em  = String(u.email   || '').trim();
        if (uid && em) acc[uid] = em;
        return acc;
      }, {});
    } catch (_) { return {}; }
  };

  const fetchHistoryList = async (bookingId) => {
    if (!bookingId) return [];
    try {
      const res = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
      const list = Array.isArray(res.data) ? res.data : [];
      return list
        .filter(h => String(h?.booking_id || '') === String(bookingId))
        .sort((a,b) => new Date(b.updatedAt || b.createdAt || b.date || 0) - new Date(a.updatedAt || a.createdAt || a.date || 0));
    } catch (_) { return []; }
  };

  const getEmailViaUsers = (uid, emailMap) => {
    const k = String(uid || '').trim();
    return (k && emailMap[k]) ? emailMap[k] : '';
  };
  // ------------------------------------

  // โหลด email map ครั้งเดียวสำหรับการเปิด dialog นี้
  const emailMap = await buildEmailMap();

  // ===== FIELD =====
  if (group.type === 'field') {
    const it = group.items?.[0] || {};
    const zone = (it.zone && it.zone !== '-' && it.zone !== '') ? it.zone : '-';
    const requesterBase = this.userMap[it.user_id] || it.requester || it.user_id || '-';
    const requester     = it.username_form || requesterBase;
    const bookingId     = group.booking_id || it.booking_id || '';

    // หา user_id จาก item; ถ้าไม่มี ค่อยไปดูใน history ของ booking เดียวกัน
    let uid = pickUserId(it);
    let histList = [];
    if (!uid && bookingId) {
      histList = await fetchHistoryList(bookingId);
      const rowWithUid = histList.find(h => pickUserId(h));
      uid = pickUserId(rowWithUid || {});
    }

    const email = getEmailViaUsers(uid, emailMap) || '-';

    const table = `
      <table class="swal-detail-table">
        <tbody>
          <tr><th>ชื่อสนาม</th><td>${esc(it.name || '-')}</td></tr>
          <tr><th>โซน</th><td>${esc(zone)}</td></tr>
          <tr><th>ชื่อผู้ขอใช้</th><td>${esc(requester)}</td></tr>
          <tr><th>อีเมล</th><td>${esc(email)}</td></tr>
          <tr>
            <th>วันที่ทำรายการ</th>
            <td><span class="nowrap">${it.date ? esc(this.formatDate(it.date)) : '-'}</span></td>
          </tr>
          <tr>
            <th>ช่วงวันที่ขอใช้</th>
            <td>
              <span class="nowrap">
                ${esc(it.since ? this.formatDate(it.since) : '-')} - ${esc(it.uptodate ? this.formatDate(it.uptodate) : '-')}
              </span>
            </td>
          </tr>
          <tr>
            <th>ช่วงเวลา</th>
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
  const btnPdf = document.getElementById('pdf-btn');
  if (btnPdf) btnPdf.addEventListener('click', () => this.openBookingPdf(group), { once: true });
  const btnAttach = document.getElementById('attach-btn');
  if (btnAttach) btnAttach.addEventListener('click', () => this.viewAttachment(group), { once: true });
}

    });
    return;
  }

  // ===== EQUIPMENT =====
  const bookingId = group.booking_id || group.items?.[0]?.booking_id || null;

  // รวมจำนวนต่อชื่ออุปกรณ์
  const merged = new Map();
  (group.items || []).forEach(it => {
    const name = it?.name || '-';
    const qty  = Number(it?.quantity ?? 0) || 0;
    merged.set(name, (merged.get(name) || 0) + qty);
  });

  // ค่าแสดงผล
  let requester = '-', requesterId = '-', requesterEmail = '-', dateBorrow = '-', dateRange = '-';

  // หา user_id และรายละเอียดอื่นจาก history
  let uid = pickUserId(group.items?.[0] || {});
  let list = [];
  if (bookingId) {
    list = await fetchHistoryList(bookingId);

    if (!uid) {
      const rowWithUid = list.find(h => pickUserId(h));
      uid = pickUserId(rowWithUid || {});
    }

    const anyRows = list.filter(h => (h?.type || '').toLowerCase() === 'equipment');
    const rows = anyRows.length ? anyRows : list;

    const recUser = rows.find(h => h?.username_form && String(h.username_form).trim());
    if (recUser) requester = String(recUser.username_form).trim();

    const recId = rows.find(h => h?.id_form && String(h.id_form).trim());
    if (recId) requesterId = String(recId.id_form).trim();

    const recDate = rows.find(h => h?.createdAt || h?.date || h?.since || h?.uptodate) || rows[0];
    if (recDate) {
      dateBorrow = recDate?.createdAt
        ? this.formatDate(recDate.createdAt)
        : (recDate?.date ? this.formatDate(recDate.date) : '-');
      const since = recDate?.since ? this.formatDate(recDate.since) : '-';
      const upto  = recDate?.uptodate ? this.formatDate(recDate.uptodate) : '-';
      dateRange   = `${since} - ${upto}`;
    }
  }
  requesterEmail = getEmailViaUsers(uid, emailMap) || '-';

  const rowsHtml = Array.from(merged.entries()).map(([name, qty], idx) => `
    <tr>
      <td class="c">${idx + 1}</td>
      <td class="col-name">${esc(name)}</td>
      <td class="c col-qty">${esc(qty)}</td>
      <td class="c col-id nowrap">${esc(requesterEmail)}</td>
      <td class="col-requester">${esc(requester)}</td>
      <td class="c nowrap">${esc(dateBorrow)}</td>
      <td class="c nowrap col-period" title="${esc(dateRange)}">${esc(dateRange)}</td>
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
    width: 1100,
    customClass: { popup: 'swal-equipment' },
    didOpen: () => {
      const btnPdf = document.getElementById('pdf-btn');
      if (btnPdf) btnPdf.addEventListener('click', () => this.downloadBookingPdf(group));
      const btnAttach = document.getElementById('attach-btn');
      if (btnAttach) btnAttach.addEventListener('click', () => this.viewAttachment(group));
    }
  });
},




// --- ใหม่: เปิดไฟล์ PDF ในแท็บใหม่ ---
// --- เปิดไฟล์ PDF ในแท็บใหม่ แค่ครั้งเดียว ---
async openBookingPdf(target) {
  const bookingId  = typeof target === 'string' ? target : (target?.booking_id || '');
  const typeFilter = typeof target === 'object' ? (target?.type || '') : '';

  if (!bookingId) {
    Swal.fire('ผิดพลาด','ไม่พบ booking_id สำหรับเปิดไฟล์ PDF','error');
    return;
  }

  try {
    const resHist = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
    let list = Array.isArray(resHist.data) ? resHist.data : [];
    list = list.filter(h => String(h?.booking_id || '') === String(bookingId));
    if (typeFilter) list = list.filter(h => (h?.type || '').toLowerCase() === typeFilter.toLowerCase());
    list.sort((a,b) => new Date(b.updatedAt || b.createdAt || b.date || 0) - new Date(a.updatedAt || a.createdAt || a.date || 0));

    const picked = this.pickPdfUrl(list);
    const rawUrl = this.normalizePdfUrl(picked);
    if (!rawUrl) {
      Swal.fire('ผิดพลาด','ไม่พบ URL ของไฟล์ PDF สำหรับรายการนี้','error');
      return;
    }

    // ใช้โปรโตคอลเดียวกับหน้าเว็บ เพื่อเลี่ยง mixed-content
    const u = new URL(rawUrl, window.location.origin);
    u.protocol = window.location.protocol;

    // เปิดด้วย anchor (เลี่ยงปัญหา window.open คืนค่า null เมื่อใช้ noopener)
    const a = document.createElement('a');
    a.href = u.href;
    a.target = '_blank';
    a.rel = 'noopener';      // หรือ 'noreferrer'
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

      const projectName = data.name_active || data.name_activity || data.activity || data.activity_name || data.project_name || '-';
      const projectLines = doc.splitTextToSize('จะดำเนินกิจกรรม / โครงการ ' + projectName, 500);
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
      const title = 'แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง';
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
      doc.text(`รหัสนักศึกษา/พนักงาน ${bookingData.user_id || '-'}`, leftMargin + 270, y);

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
// ===== lifecycle: mounted() =====
// ===== lifecycle: mounted() =====
async mounted() {
  // responsive
  window.addEventListener('resize', this.handleResize);
  this.handleResize();

  // 1) โหลด users (ชื่อ + ดัชนีลายเซ็นหลายคีย์)
  try {
    const userRes = await axios.get(`${API_BASE}/api/users`);
    const users = Array.isArray(userRes.data) ? userRes.data : [];

    this.userMap = {};
    users.forEach(u => {
      this.userMap[u.user_id] =
        (u.firstname && u.lastname)
          ? `${u.firstname} ${u.lastname}`
          : (u.name || u.user_id);
    });

    this.userSigMap = this.buildUserSigIndex(users);
  } catch (err) {
    this.userMap = {};
    this.userSigMap = {};
    console.error('โหลด users ไม่สำเร็จ:', err);
  }

  // 2) โหลดรอบแรกจาก /approve_field?mode=super (เฉพาะรายการ “รอหัวหน้า”)
  try {
    const res = await axios.get(`${API_BASE}/api/history/approve_field`, { params: { mode: 'super' } });
    const raw = Array.isArray(res.data) ? res.data : [];
    const rawFiltered = raw.filter(h => this.isSuperPending(h));

    const fieldGroups = rawFiltered.map(h => ({
      type: 'field',
      booking_id: h.booking_id || '',
      items: [{
        id:   this.getMongoId(h),
        type: 'field',

        booking_id: h.booking_id || '',

        // meta ฟอร์ม
        aw:            h.aw ?? h.aw_no ?? h.reference ?? h.ref_no ?? '-',
        tel:           h.tel ?? h.phone ?? h.telephone ?? '-',
        agency:        h.agency ?? h.department ?? h.org ?? h.organization ?? '-',
        name_active:   h.name_active ?? '',
        name_activity: h.name_active ?? h.name_activity ?? h.activity ?? h.activity_name ?? h.project_name ?? '-',
        reasons:       h.reasons ?? h.reason ?? '-',

        since_time:     h.since_time ?? h.startTime ?? '',
        until_thetime:  h.until_thetime ?? h.endTime   ?? '',

        // ข้อมูลสถานที่
        name:       h.name ?? '-',
        zone:       h.zone ?? '-',

        // ✅ ห้องที่ต้องการใช้ (แหล่งใดก็ได้)
        room_request:
          (h.room_request ?? h.roomRequest ??
           h.form?.room_request ?? h.form?.roomRequest ??
           h.booking_field?.room_request ?? h.booking_field?.roomRequest ?? ''),

        requester:  h.requester ?? '-',
        user_id:    h.user_id ?? '-',
        username_form:     h.username_form || '-',
        id_form:           h.id_form || '-',
        proxyStudentName:  h.proxyStudentName || h.proxy_name || '',
        proxyStudentId:    h.proxyStudentId   || h.proxy_id   || '',

        date:      h.date ?? '-',
        since:     h.since ?? '-',
        uptodate:  h.uptodate ?? '-',
        startTime: h.startTime || '',
        endTime:   h.endTime   || '',

        participants:  h.participants ?? h.participant ?? h.participant_count
                     ?? h.numParticipants ?? h.num_participants ?? '-',

        status:    (h.status || '').toLowerCase(),

        // สาธารณูปโภค + รายการประกอบอาคาร
        utilityRequest:  h.utilityRequest ?? h.utility_request ?? h.utilities ?? h.utility ?? '',
        turnon_air:      h.turnon_air ?? h.turnOnAir ?? h.air_on ?? '',
        turnoff_air:     h.turnoff_air ?? h.turnOffAir ?? h.air_off ?? '',
        turnon_lights:   h.turnon_lights ?? h.turnOnLights ?? h.light_on ?? '',
        turnoff_lights:  h.turnoff_lights ?? h.turnOffLights ?? h.light_off ?? '',
        restroom:        h.restroom ?? h.restroom_text ?? h.use_restroom ?? '',
        other:           h.other ?? h.other_text ?? '',

        facilityRequest: h.facilityRequest ?? h.facility_request ?? h.facility ?? '',
        amphitheater:    h.amphitheater ?? h.pull_grandstand ?? '',
        need_equipment:  h.need_equipment ?? h.sport_equipment ?? h.equipment ?? '',

        createdAt: h.createdAt?.$date || h.createdAt || h.created_at?.$date || h.created_at || null,
        updatedAt: h.updatedAt?.$date || h.updatedAt || h.updated_at?.$date || h.updated_at || null,

        // meta เลขาฯ
        approvedBy:       h.approvedBy,
        approvedById:     h.approvedById,
        approvedAt:       h.approvedAt,
        reason_admin:     h.reason_admin,
        secretary_choice: h.secretary_choice,

        secThaiName: h.thaiName_admin ?? h.thainame_admin ?? h.thaiName ?? h.approvedBy ?? '',
        secSignUrl:  h.signaturePath_admin ?? h.signaturePath ?? h.signature_url ?? '',
      }]
    }));

    // เรียงล่าสุดก่อน
    const safeToTime = (v) => {
      if (!v) return 0;
      const s = String(v).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y,m,d] = s.split('-').map(Number);
        return new Date(y, m - 1, d).getTime() || 0;
      }
      const t = new Date(s).getTime();
      return isNaN(t) ? 0 : t;
    };
    fieldGroups.sort((A, B) => {
      const a0 = A.items?.[0] || {};
      const b0 = B.items?.[0] || {};
      const ta = safeToTime(a0.updatedAt) || safeToTime(a0.createdAt) || safeToTime(a0.date);
      const tb = safeToTime(b0.updatedAt) || safeToTime(b0.createdAt) || safeToTime(b0.date);
      return tb - ta;
    });

    this.grouped = fieldGroups;
    this._lastSnapshot = this._makeSnapshot(fieldGroups);
  } catch (err) {
    this.grouped = [];
    console.error('โหลดข้อมูล booking ไม่สำเร็จ:', err);
  }

  // 3) sync ต่อเนื่อง (จะเรียกด้วย mode=super เสมอ)
  await this.fetchAndGroup();

  // 4) Notifications + Polling
  this.lastSeenTimestamp = parseInt(localStorage.getItem('admin_lastSeenTimestamp') || '0', 10) || 0;
  await this.fetchNotifications();
  this.polling = setInterval(this.fetchNotifications, 30000);

  // 5) รีเฟรช และ focus
  this.refreshTimer = setInterval(this.fetchAndGroup, 8000);
  this._onVisibility = () => { if (!document.hidden) this.fetchAndGroup(); };
  document.addEventListener('visibilitychange', this._onVisibility);

  // 6) ปิด dropdown เมื่อคลิคนอก
  document.addEventListener('mousedown', this.handleClickOutside);
},


  beforeUnmount() {
    clearInterval(this.polling)
    document.removeEventListener('mousedown', this.handleClickOutside);
     window.removeEventListener('resize', this.handleResize);
  }
}


// ===== Replace this in approve_field_super =====
function buildFieldFormPreviewV2(
  b = {},
  secThaiName = '',
  secSignUrl = '',
  headThaiName = '',
  headSignUrl = '',
  reqSignUrl = ''   // ลายเซ็น "ผู้ขอใช้"
) {
  const dash = v => {
    const s = (v ?? '').toString().trim();
    return s ? s : '-';
  };
  const d = v => (v ?? '-') + '';
  const fmtDate = s => {
    if (!s) return '-';
    const t = String(s).includes('T') ? String(s).split('T')[0] : String(s);
    const [y,m,dd] = t.split('-').map(Number);
    if(!y||!m||!dd) return t;
    return `${String(dd).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y+543}`;
  };
  const fmtTime = t => {
    if (!t) return '-';
    const s = String(t).trim().replace(/\s*น\.?$/i,'');
    return /^\d{1,2}:\d{2}/.test(s) ? `${s.slice(0,5)} น.` :
           /^\d{1,2}:\d{2}:\d{2}$/.test(s) ? `${s.slice(0,5)} น.` : `${s} น.`;
  };

  const fmtTimeFromDateLike = (v) => {
    if (!v) return '-';
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return '-'; // ไม่มีเวลา
    const d = new Date(s);
    if (isNaN(d)) return '-';
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.';
  };

    // 3.x ห้องที่ต้องการใช้ (รองรับทั้ง string และ array)
  const roomReqText = (() => {
    const v = b?.room_request;
    if (Array.isArray(v)) {
      const joined = v.map(x => (x ?? '').toString().trim()).filter(Boolean).join(', ');
      return joined || '-';
    }
    return dash(v);
  })();


  // เวลา ณ ตอนสร้างพรีวิว (ใช้กับหัวหน้า)
  const nowTHTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.';

  const tStart = b?.since_time || b?.startTime || '';
  const tEnd   = b?.until_thetime || b?.endTime   || '';

  const ynPack = (v, fallbackOn) => {
    const s = String(v ?? '').trim().toLowerCase();
    if (['yes','true','1','เลือก','อนุญาต','allow','allowed'].includes(s)) {
      return { yChar:'●', yOn:true,  nChar:'○', nOn:false };
    }
    if (['no','false','0','ไม่เลือก','ไม่อนุญาต','disallow','denied'].includes(s)) {
      return { yChar:'○', yOn:false, nChar:'●', nOn:true  };
    }
    if (fallbackOn === true)  return { yChar:'●', yOn:true,  nChar:'○', nOn:false };
    if (fallbackOn === false) return { yChar:'○', yOn:false, nChar:'●', nOn:true  };
    return { yChar:'○', yOn:false, nChar:'○', nOn:false };
  };

  const hasU = [b?.turnon_air,b?.turnoff_air,b?.turnon_lights,b?.turnoff_lights,b?.other]
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




  const sc = b?.secretary_choice || {};
  const sec_other_chk    = !!sc.other_checked;
  const sec_other_reason = d(b?.reason_admin).replace(/^-$/,'');

  const todayIso = new Date().toISOString().slice(0,10);
  const todayTH  = fmtDate(todayIso);

  // ใช้เช็กค่าว่าง/ขีด
const hasVal = (v) => {
  const s = String(v ?? '').trim();
  return !!(s && s !== '-');
};

// 2.1 ไฟฟ้าส่องสว่าง
const lightsText = (() => {
  const on  = (b?.turnon_lights ?? '').toString().trim();
  const off = (b?.turnoff_lights ?? '').toString().trim();
  if (!hasVal(on) && !hasVal(off)) return 'ไม่ต้องการใช้งาน';
  return `ตั้งแต่ ${fmtTime(on)} - ${fmtTime(off)}`;
})();

// แสดง “ดึงอัฒจันทร์…” เฉพาะอาคารเฉลิมพระเกียรติ 72 พรรษา
const showAmphiRow = (() => {
  const name = (b?.name ?? '').toString();
  const norm = name.replace(/\s+/g, '');
  return /เฉลิมพระเกียรติ?72พรรษา/.test(norm);
})();


  return `
  <div class="mfu-form">
    <style>
      /* ============ MFU Field Form (buildFieldFormPreviewV2) ============ */
.mfu-form{
  font-family:'THSarabunNew','Sarabun','Noto Sans Thai',system-ui,sans-serif;
  color:#111; line-height:1.35;
  -webkit-font-smoothing:antialiased; text-rendering:geometricPrecision;
  --other-text-yfix:3px; /* ปรับ baseline ของข้อความ “อื่นๆ” ให้เสมอ */
}

/* Header */
.mfu-head{ text-align:center; margin-bottom:10px; }
.mfu-title{ font-size:22px; font-weight:700; }
.mfu-sub{ font-size:14px; margin-top:4px; }

/* Meta line */
.mfu-meta{ display:flex; gap:18px; flex-wrap:wrap; font-size:16px; margin:10px 0 4px; }

/* Section blocks */
.mfu-sec{ margin-top:14px; font-size:16px; display:block; }
.mfu-sec h4{ margin:0; padding:0 0 10px; line-height:1.35; font-weight:700; }
.mfu-spacer{ height:8px; display:block; }
.mfu-par{ text-indent:2em; margin-top:6px; }

/* Bullet lists (ข้อ 1–3) */
.mfu-list{ list-style:none; margin:4px 0 0; padding:0; }
.mfu-list li{ padding:6px 0; border-bottom:1px dashed #e5e7eb; }
.mfu-list li:last-child{ border-bottom:0; }
.mfu-list b{ display:inline-block; min-width:210px; white-space:nowrap; color:#111; }

.mfu-list-loc li:first-child b{ min-width:130px; }
.mfu-list-util b{ width:165px; min-width:166px; }
.mfu-list li:first-child b{ min-width:60px; }

@media (max-width:720px){
  .mfu-list li:first-child b{ min-width:110px; }
}

/* Yes/No dots */
.mfu-yn{ margin:4px 0 6px; display:flex; gap:18px; }
.mfu-yn .choice{ display:inline-flex; align-items:center; gap:6px; font-size:16px; color:#374151; }
.mfu-yn .dot{ font-weight:700; font-size:18px; line-height:1; color:#9ca3af; }
.mfu-yn .choice.on{ color:#111; font-weight:700; }
.mfu-yn .choice.on .dot{ color:currentColor; }

/* === Two columns (เลขานุการ / หัวหน้า) === */
.mfu-boxes{
  display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px; margin-top:12px;
}
@media (max-width:720px){ .mfu-boxes{ grid-template-columns:1fr; } }

.mfu-box{
  border:1px solid #d1d5db; border-radius:12px; background:#fff;
  padding:12px 14px; min-height:200px; position:relative;

  /* ให้เนื้อหาด้านบน ส่วนลายเซ็นกองอยู่ล่าง */
  display:flex; flex-direction:column;
}
.mfu-box .sign-block{ margin-top:auto; padding-top:8px; }

.mfu-box.locked input[disabled],
.mfu-box.locked textarea[disabled]{ background:#fff !important; color:#111 !important; opacity:1 !important; }

.mfu-box h5{ margin:0 0 8px; font-size:16px; font-weight:700; text-align:center; }

/* แถวทั่วไปในกล่อง */
.mfu-box .row{
  display:flex; align-items:center; gap:8px; margin:10px 0; flex-wrap:nowrap;
}

/* ===== “อื่นๆ” ให้เสมอบรรทัดกับติ๊กถูก ===== */
.mfu-box .row label.chk{
  display:inline-flex;
  align-items:baseline;
  gap:6px;
  white-space:nowrap;
}

/* กล่องเลขาฯ: อื่นๆ จัด inline กับติ๊ก */
.mfu-box .row .other-inline{
  display:flex; align-items:baseline; gap:6px; flex:1; min-width:0; white-space:nowrap;
}
.mfu-box .row .other-inline > span{ line-height:1.35; }
.mfu-box .row .other-inline #sec_other_reason{
  position:relative; top:var(--other-text-yfix);
  display:inline-block; flex:1; min-width:0;
  white-space:normal; word-break:break-word;
}

/* แถว “อื่นๆ” ของหัวหน้า: ให้ชิดบน รองรับหลายบรรทัด */
.mfu-box .row.other-row{ align-items:baseline; }

/* Input / Textarea */
.mfu-input{ flex:1; min-width:0; padding:6px 8px; border:1px solid #cbd5e1; border-radius:6px; font:inherit; background:#fff; }
.mfu-input.autogrow{ overflow:hidden; resize:none; line-height:1.35; min-height:36px; }

/* Common helpers */
.row.center{ justify-content:center; }
.paren{ opacity:.85; }

/* Signature in box */
.mfu-box .sig-row{ position:relative; min-height:64px; display:grid; }
.mfu-box .sigimg{ position:absolute; top:8px; left:0; right:0; margin-left:auto; margin-right:auto; max-height:52px; width:auto; opacity:.95; pointer-events:none; }

/* ====== บังคับขนาดตัวอักษร “อื่นๆ” ให้เท่ากัน (ทั้งแสดงผลและตอนทำ PDF) ====== */
#sec_other_reason,
#head_other_reason,
.mfu-form.pdf-print #sec_other_reason,
.mfu-form.pdf-print #head_other_reason,
.pdf-ta-repl{
  font-size:16px !important;
  line-height:1.6 !important;
  -webkit-text-fill-color:#111 !important;
  color:#111 !important;
}

/* โหมดแคปเจอร์ PDF: เปลี่ยน textarea ให้ดูเหมือนข้อความปกติ */
.mfu-form.pdf-print #sec_other_reason,
.mfu-form.pdf-print #head_other_reason{
  border:0 !important; outline:0 !important; box-shadow:none !important;
  background:transparent !important; display:inline !important;
  width:auto !important; min-width:0 !important; height:auto !important;
  padding:0 !important; margin-left:6px !important; line-height:1.35 !important;
  vertical-align:baseline !important; white-space:normal; word-break:break-word;
}
.mfu-form.pdf-print .mfu-box .row{ align-items:baseline !important; }

/* กล่อง “อื่นๆ” ของเลขาฯ (โหมดปกติ) */
#sec_other_reason{
  border:0 !important; outline:0 !important; box-shadow:none !important;
  background:transparent !important; display:inline !important;
  width:auto !important; min-width:0 !important; height:auto !important;
  padding:0 !important; margin-left:6px !important; line-height:1.35 !important;
  vertical-align:baseline !important; white-space:normal; word-break:break-word;
}

/* === เพิ่มใหม่: จำกัด "อื่นๆ" ของหัวหน้าให้ไม่เกิน 3 บรรทัด === */
#head_other_reason{
  max-height: calc(1.6em * 3);     /* สูงสุด 3 บรรทัด (ตาม line-height 1.6) */
  overflow-y: auto !important;     /* เกินแล้วสกรอลล์ */
  resize: none !important;         /* ไม่ให้ลากยืด */
}

/* ===== ลายเซ็นผู้ขอใช้งาน (ชิดขวา + เส้นประ) ===== */
.mfu-sign{
  --sig-max:360px; --sig-gap:10px; --sig-label-w:54px;
  margin-top:8px; display:flex; flex-direction:column; align-items:flex-end;
}
.mfu-sign .sig-canvas{ position:relative; height:56px; max-width:var(--sig-max); width:100%; margin:0 0 6px auto; }
.mfu-sign .sig-canvas .sigimg{ position:absolute; left:50%; transform:translateX(-50%); bottom:-2px; max-height:46px; width:auto; opacity:.95; pointer-events:none; }
.mfu-sign .sigline{ display:flex; align-items:center; gap:var(--sig-gap); max-width:var(--sig-max); width:100%; margin:0 0 6px auto; }
.mfu-sign .sigline .label{ width:var(--sig-label-w); white-space:nowrap; }
.mfu-sign .sigline .dots{ flex:1; height:0; border-bottom:1.5px dotted #9ca3af; }
.mfu-sign .name,.mfu-sign .role,.mfu-sign .date{
  width:var(--sig-max); max-width:100%; margin-left:auto;
  padding-left:calc(var(--sig-label-w) + var(--sig-gap)); text-align:center;
}

/* ตัวแทน textarea/input ที่ถูกแทนก่อนแคปเจอร์ */
.pdf-ta-repl{
  white-space:pre-wrap;
  word-break:break-word;
  line-height:1.35;
  font:inherit;
  color:#111;
}

/* หมายเหตุใต้ข้อ 3.2 */
.mfu-note{
  font-size:13px;
  color:#111;
  margin:10px 0 0 0;
}

/* utilities */
.nobr{ white-space:nowrap; word-break:keep-all; }
.mfu-form.pdf-print .nobr{ white-space:nowrap !important; }

/* --- FIX: จับกลุ่มลายเซ็นให้อยู่ก้นกล่องเสมอ (สองคอลัมน์เท่ากัน) --- */
.mfu-box{ display:flex; flex-direction:column; }           /* มีอยู่แล้วก็ซ้ำได้ */
.mfu-box .row.sig-row{ margin-top:auto !important; }       /* ดันบล็อกลายเซ็นลงล่าง */
.mfu-box .row.sig-row ~ .row{ margin-top:6px; }            /* ระยะห่างใต้รูปเซ็นเล็กน้อย */


.mfu-list-loc b {
      display: inline-block;
      min-width: 90px;  /* ปรับตามต้องการ */
      white-space: nowrap;
      } 

      .mfu-tbl { border-collapse: collapse; margin-top:4px; }
      .mfu-tbl td { padding: 4px 6px; font-size:16px; vertical-align: top; }
      .mfu-tbl .lbl   { min-width: 140px; white-space: nowrap; font-weight:700; }
      .mfu-tbl .colon { width: 12px; text-align:center; }
      .mfu-tbl .val   { width:auto; }

      /* เดิมอยู่ท้าย <style> ของ buildFieldFormPreviewV2 */
/* เพิ่ม/แก้ใหม่ */
.mfu-tbl-loc .lbl {
  min-width: 90px;   /* ลดจาก 140px ให้แคบลง */
  white-space: nowrap;
  font-weight: 700;
}

/* ปรับขนาดฟอนต์เฉพาะตอนแสดงใน SweetAlert */
.swal2-html-container .mfu-form {
  font-size: 14px;       /* ลดลงจาก 16px */
  line-height: 1.3;
}

.swal2-html-container .mfu-title {
  font-size: 18px;       /* ลดหัวเรื่องลง */
}

.swal2-html-container .mfu-sec h4 {
  font-size: 15px;       /* ลดหัวข้อย่อยลง */
}

.swal2-html-container .mfu-tbl td {
  font-size: 14px;
}

.mfu-sign .date {
  font-size: 11px;
}

.mfu-box .row.center .date {
  font-size: 11px;
}
.mfu-box .row.center .date .time {
  font-size: 11px;
}

/* ✅ แก้ช่องห่างของ "อาคาร / พื้นที่ห้อง" */
.mfu-tbl-util .lbl {
  min-width: 60px !important;   /* ลดจาก 140px เหลือ 60px */
  width: auto !important;       /* ใช้ขนาดเท่าข้อความจริง */
}

.mfu-tbl-util .colon {
  width: 8px !important;        /* ลดจาก 12px */
  padding: 0 2px !important;    /* ลดช่องว่างซ้ายขวา */
}

.mfu-tbl-util .val {
  padding-left: 0 !important;   /* เอาช่องว่างออก ให้ชิดขึ้น */
}

.mfu-tbl-util td,
.mfu-tbl-loc td,
.mfu-tbl-fac td {
  vertical-align: middle !important;
}
    </style>

    <div class="mfu-head">
      <div class="mfu-title">แบบฟอร์มขออนุมัติใช้สถานที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</div>
      <div class="mfu-sub"><b>โทร: 0-5391-7820 และ 0-5391-7821 | E-mail: sport-complex@mfu.ac.th</b></div>
    </div>

    <div class="mfu-meta">
      <div><b>ที่ อว.</b> ${d(b?.aw)}</div>
      <div style = "padding-left: 50px"><b>วันที่</b> ${fmtDate(b?.date)}</div>
      <div style = "padding-left: 50px"><b>โทร</b> ${d(b?.tel)}</div>
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
  <table class="mfu-tbl mfu-tbl-util" style="margin-left:31px;">
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
      <tr>
        <td class="lbl"><b>3.3 ห้องที่ต้องการใช้</b></td>
        <td class="colon">:</td>
        <td class="val">${roomReqText}</td>
      </tr>
    ` : `
      <tr>
        <td class="lbl"><b>3.1 อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน)</b></td>
        <td class="colon">:</td>
        <td class="val">${dash(b?.need_equipment)}</td>
      </tr>
      <tr>
        <td class="lbl"><b>3.2 ห้องที่ต้องการใช้</b></td>
        <td class="colon">:</td>
        <td class="val">${roomReqText}</td>
      </tr>
    `}
  </table>

  <div class="mfu-note">
    ทั้งนี้ต้องแนบเอกสารโครงการหรือกิจกรรมที่ได้รับการอนุมัติแล้วพร้อมกำหนดการจัดกิจกรรมหากเป็นการเรียนการสอน <br>
    ต้องแนบตารางการเรียนการสอน (Class schedule) พร้อมทั้งรายชื่อนักศึกษา
  </div>
</div>


    <!-- ผู้ขอใช้ -->
    <div class="mfu-sign">
      <div class="sig-canvas">
        ${reqSignUrl ? `<img class="sigimg" src="${reqSignUrl}" alt="signature">` : ``}
      </div>
      <div class="sigline"><div class="label">ลงชื่อ</div><div class="dots"></div></div>
      <div class="name">( ${d(b?.username_form || b?.requester)} )</div>
      <div class="role">ผู้รับผิดชอบ</div>
      <div class="date">
         ${fmtDate(b?.createdAt || b?.date)}
        <span class="time"> ${fmtTimeFromDateLike(b?.createdAt || b?.date)}</span>
      </div>
    </div>

    <div class="mfu-boxes">
      <!-- กล่อง 1: เลขาฯ -->
      <div class="mfu-box locked">
        <h5>1. เลขานุการศูนย์กีฬา</h5>
        <div class="row">
          <label class="chk" style="padding-left: 30px"><span>เรียน หัวหน้าศูนย์กีฬาฯ</span></label>
        </div>
        <div class="row">
          <label class="chk other-inline">
            <input type="checkbox" id="sec_other_chk" ${sec_other_chk ? 'checked' : ''} disabled>
            <span class="nobr">อื่นๆ&nbsp;:</span>
            <span id="sec_other_reason" class="text">${sec_other_reason || ''}</span>
          </label>
        </div>

        <div class="row sig-row">
          ${secSignUrl ? `<img class="sigimg" src="${secSignUrl}" alt="signature">` : ``}
        </div>
        <div class="row"><span class="paren">(</span><span style="flex:1;text-align:center;">${d(secThaiName)}</span><span class="paren">)</span></div>
        <div class="row center">
          <span></span>
          <span class="date">
            ${fmtDate(b?.approvedAt || b?.createdAt || b?.date)}
            <span class="time"> ${fmtTimeFromDateLike(b?.approvedAt || b?.createdAt || b?.date)}</span>
          </span>
        </div>
      </div>

      <!-- กล่อง 2: หัวหน้า -->
      <div class="mfu-box">
        <h5>2. หัวหน้าศูนย์กีฬา</h5>
        <div class="row">
          <label class="chk"><input type="checkbox" id="head_to_vice"><span>เห็นชอบ</span></label>
        </div>

        <!-- อื่นๆ : textarea (จำกัด 3 บรรทัดด้วย CSS + คุมใน didOpen จาก approveGroup) -->
        <div class="row other-row">
          <label class="chk">
            <input type="checkbox" id="head_other_chk">
            <span class="nobr">อื่นๆ&nbsp;:</span>
          </label>
          <textarea id="head_other_reason"
                    class="mfu-input autogrow"
                    rows="1"
                    maxlength="110"
                    placeholder="โปรดระบุ"></textarea>
        </div>

        <div class="row sig-row">
          ${headSignUrl ? `<img class="sigimg" src="${headSignUrl}" alt="signature">` : ``}
        </div>
        <div class="row"><span class="paren">(</span><span style="flex:1;text-align:center;">${d(headThaiName)}</span><span class="paren">)</span></div>
        <div class="row center">
          <span></span>
          <span class="date">
            ${todayTH}
            <span class="time"> ${nowTHTime}</span>
          </span>
        </div>
      </div>

    </div>
  </div>`;
}
</script>


<style scoped>
/* ===== Layout & page ===== */
.histbody{
  width:100%;
  height:100vh;
  padding:20px;
  box-sizing:border-box;
  overflow-x:hidden;
}
.history-filter{
  display:flex; gap:10px; margin:0 0 18px; padding-left:70px;
}
.history-filter button{
  background:#f3f4f6; border:1.5px solid #a5b4fc; color:#213555;
  font-weight:600; padding:7px 22px; border-radius:10px; cursor:pointer;
  transition:background .16s;
}
.history-filter button.active,.history-filter button:hover{
  background:#1d4ed8; color:#fff; border-color:#1d4ed8;
}

.hist-grid{ display:flex; flex-direction:column; gap:1rem; padding:1rem 70px; }
.hist-card{ background:#ebebeb; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,.15); padding:1rem 1.5rem; width:100%; }
.hist-row{ display:flex; align-items:center; justify-content:space-between; gap:1rem; }
.item-name{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.status-group{ display:flex; gap:8px; justify-content:flex-end; }

.approve-btn,.cancel-btn,.detail-btn{
  padding:4px 10px; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:.8rem; transition:background-color .3s;
}
.approve-btn{ background:#80e479; } .approve-btn:hover{ background:#478a48; }
.cancel-btn{ background:#f54c4f; margin-left:10px; } .cancel-btn:hover{ background:#7a292d; }
.detail-btn{ background:#304674; } .detail-btn:hover{ background:#2953d1; }

/* ===== Sidebar overlay ===== */
.sidebar-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.16); z-index:1100; }
.sidebar{ z-index:1200; }

/* ===== Main table ===== */
.table-container{ padding:0 70px; overflow-x:auto; }
.approve-table{
  width:100%; border-collapse:collapse; background:#fff; border-radius:12px;
  box-shadow:0 2px 8px rgba(0,0,0,.08);
}
.approve-table th,.approve-table td{ padding:.75rem 1rem; text-align:center; border-bottom:1px solid #e2e8f0; }
.approve-table th{ background:#1e3a8a; color:#fff; font-weight:700; }
.approve-table tr:last-child td{ border-bottom:none; }

/* ===== Notifications ===== */
.notification-backdrop{ position:fixed; inset:0; background:transparent; z-index:1001; }
.notification-dropdown{
  position:absolute; right:0; top:38px; background:#fff; border-radius:18px 0 18px 18px;
  box-shadow:0 8px 24px rgba(27,50,98,.14),0 2px 4px rgba(33,125,215,.06);
  min-width:330px; max-width:370px; max-height:420px; overflow-y:auto; z-index:1002; padding:0; border:none;
}

/* ===== Mobile (<=600px) ===== */
@media (max-width:600px){
  .item-name{ white-space:normal !important; word-break:break-word !important; overflow:visible !important; text-overflow:unset !important; max-width:100%; display:block !important; font-weight:500; text-align:center; margin-bottom:4px; }
  .histbody{ display:flex; flex-direction:column; align-items:center; padding:14px 0 0 !important; width:100vw; overflow-x:auto !important; }
  .histbody>h1{ padding-left:0 !important; width:100vw; text-align:center !important; font-size:1.35rem; margin-bottom:16px; }
  .history-filter{ justify-content:center !important; padding-left:0 !important; width:100vw; margin-bottom:18px; }
  .hist-grid{ width:95vw; max-width:440px; padding:0; gap:1rem; align-items:center; }
  .hist-card{ min-width:95vw; max-width:440px; margin:0 auto; box-sizing:border-box; }
  .hist-row{ flex-direction:column !important; align-items:center !important; width:100% !important; gap:.5rem; justify-content:center !important; }

  /* ให้คอนเทนเนอร์เลื่อนแนวนอน */
  .table-container{
    padding: 0 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
  }

  /* บังคับความกว้างของตารางและไม่ให้คอลัมน์ห่อบรรทัด */
  .approve-table{
    width: max-content;     /* ไม่บีบให้เท่าหน้าจอ */
    min-width: 760px;       /* ปรับได้ตามที่เห็นเหมาะ */
    table-layout: fixed;    /* ช่วยกันคอลัมน์ซ้อน */
  }
  .approve-table th,
  .approve-table td{
    white-space: nowrap;    /* ❗ ไม่ให้ข้อความขึ้นบรรทัดใหม่ */
  }

  /* กำหนดความกว้างขั้นต่ำแต่ละคอลัมน์ (กันปุ่ม/เวลาแตกบรรทัด) */
  .approve-table th:nth-child(1), .approve-table td:nth-child(1){ /* Transaction date */
    min-width: 140px;
  }
  .approve-table th:nth-child(2), .approve-table td:nth-child(2){ /* Type */
    min-width: 90px;
  }
  .approve-table th:nth-child(3), .approve-table td:nth-child(3){ /* Field */
    min-width: 240px;
    max-width: 260px;       /* ถ้ายาวมากให้ตัดด้วย … */
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .approve-table th:nth-child(4), .approve-table td:nth-child(4){ /* Time */
    min-width: 140px;
  }
  .approve-table th:nth-child(5), .approve-table td:nth-child(5){ /* Actions */
    min-width: 180px;
  }
  .approve-table th:nth-child(6), .approve-table td:nth-child(6){ /* Detail */
    min-width: 120px;
  }

  /* กันปุ่มขึ้นบรรทัดใหม่ */
  .approve-btn,
  .cancel-btn,
  .detail-btn{
    white-space: nowrap;
    padding: 6px 10px;      /* ย่อ padding นิดหน่อยให้พอดีคอลัมน์ */
  }
}

/* กว้างขึ้นเฉพาะ sweetalert ของหน้าปัจจุบัน */
.swal2-popup.swal-success-wide{
  max-width: 520px !important;  /* ต้องมี !important เพื่อชนของ SweetAlert */
  width: 520px !important;
  padding: 24px 22px !important;
}

/* จัดกลางเฉพาะกล่องที่เราติดคลาส swal-success-wide */
.swal2-popup.swal-success-wide .swal2-title,
.swal2-popup.swal-success-wide .swal2-html-container{
  text-align: center !important;
}

/* ถ้ามี utility class อยู่แล้วก็โอเค */
.swal-center-title{ text-align:center !important; }
.swal-center-text { text-align:center !important; }

.swal-success-wide .swal2-icon{ 
  margin: 10px auto 6px !important; 
}
.swal-success-wide .swal2-title{ 
  text-align: center !important; 
}


</style>

<style>
@import '../css/style.css';

/* —— SweetAlert base —— */
.swal-center-text { text-align:center !important; }
.swal-center-title { text-align:center !important; }

/* ===== SweetAlert detail tables (ใช้กับปุ่ม "รายละเอียด") ===== */
.swal2-popup .swal-detail-wrap{
  max-width:min(1240px,96vw);
  overflow-x:auto;
}
.swal2-popup .swal-detail-actions{ text-align:center; margin-top:16px; }
.swal2-popup #pdf-btn,
.swal2-popup #attach-btn{
  background:#213555;color:#fff;padding:8px 18px;border-radius:8px;border:none;cursor:pointer;margin:0 6px;
}
.swal2-popup #attach-btn{ background:#3a7ca5; }

.swal2-popup .swal-detail-table{
  width:min(1200px,96vw); border-collapse:collapse; margin:0 auto; font-size:.98rem;
}
.swal2-popup .swal-detail-table tbody th{
  text-align:left; white-space:nowrap; background:#f7f9fc;
  border:1px solid #e6e9f2; padding:8px 12px; width:180px; font-weight:700; color:#1f2a44;
}
.swal2-popup .swal-detail-table tbody td{
  border:1px solid #e6e9f2; padding:8px 12px; color:#1f2a44; word-break:break-word;
}

/* ตารางอุปกรณ์ */
.swal2-popup .swal-detail-table.items thead th{
  background:#213555;color:#fff;padding:8px 10px;border:1px solid #e6e9f2;text-align:center;font-weight:700;
}
.swal2-popup .swal-detail-table.items tbody td{ border:1px solid #e6e9f2; padding:8px 10px; }
.swal2-popup .swal-detail-table.items tbody td.c{ text-align:center; }
.swal2-popup .swal-detail-table.items thead th:nth-child(1){ width:72px; }
.swal2-popup .swal-detail-table.items thead th:nth-child(3){ width:90px; }
.swal2-popup .swal-detail-table.items thead th:nth-child(5){ width:130px; }

/* dialog สำหรับรายละเอียดอุปกรณ์ */
.swal2-popup.swal-equipment{ max-width:1100px !important; padding:28px 26px !important; }
.swal2-popup.swal-equipment .swal-detail-wrap{ max-width:1080px; }
.swal2-popup.swal-equipment .swal-detail-table,
.swal2-popup.swal-equipment .swal-detail-table.items{ width:1080px; }

@media (max-width:600px){
  .swal2-popup.swal-wide{ max-width:96vw !important; }
  .swal2-popup .swal-detail-table,
  .swal2-popup .swal-detail-table.items{ width:94vw; }
  .swal2-popup .swal-detail-wrap{ overflow-x:auto; }
  .swal2-popup .swal-detail-table{ width:auto; min-width:540px; }
  .swal2-popup .swal-detail-table.items{ width:auto; min-width:640px; }
  .swal2-popup .swal-detail-table tbody th{ width:130px; }
}

/* ป้องกันวันที่/เวลาแตกบรรทัด */
.swal2-popup .nowrap{ white-space:nowrap !important; word-break:normal !important; }

/* ปรับความกว้างคอลัมน์รายการอุปกรณ์ (เหมือนหน้า approve_field) */
.swal2-popup .swal-detail-table.items{ table-layout:fixed; }
.swal2-popup .swal-detail-table.items th.col-name,
.swal2-popup .swal-detail-table.items td.col-name{
  width:140px; max-width:140px; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.swal2-popup .swal-detail-table.items th.col-qty,
.swal2-popup .swal-detail-table.items td.col-qty{ width:90px; }
.swal2-popup .swal-detail-table.items th.col-id,
.swal2-popup .swal-detail-table.items td.col-id{
  width:110px; max-width:72px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; vertical-align:middle;
}
.swal2-popup .swal-detail-table.items th.col-requester,
.swal2-popup .swal-detail-table.items td.col-requester{ min-width:240px; }
.swal2-popup .swal-detail-table.items th.col-period,
.swal2-popup .swal-detail-table.items td.col-period{
  width:160px; max-width:160px; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

@media (max-width:600px){
  .swal2-popup .swal-detail-table.items{ table-layout:auto; }
  .swal2-popup .swal-detail-table.items th.col-name,
  .swal2-popup .swal-detail-table.items td.col-name{ width:160px; max-width:160px; }
  .swal2-popup .swal-detail-table.items th.col-id,
  .swal2-popup .swal-detail-table.items td.col-id{ width:200px; max-width:90px; }
  .swal2-popup .swal-detail-table.items th.col-requester,
  .swal2-popup .swal-detail-table.items td.col-requester{ min-width:200px; }
  .swal2-popup .swal-detail-table.items th.col-period,
  .swal2-popup .swal-detail-table.items td.col-period{
    white-space:normal; word-break:break-word; overflow:visible; text-overflow:clip;
    width:auto; max-width:none; line-height:1.35;
  }
}

/* ====== SweetAlert “Approve form” (ให้หน้าตาเหมือน approve_field) ====== */
.swal2-popup.swal-form-approve{
  width:1000px !important;                 /* ใกล้เคียงขนาดในรูป1 */
  max-width:min(1000px, 98vw) !important;
  padding:24px 26px !important;
  border-radius:12px !important;
  box-shadow:0 12px 36px rgba(0,0,0,.18);
}
.swal2-popup.swal-form-approve .swal2-html-container{
  max-height:72vh; overflow:auto; margin:12px 0 0 !important;
}
.swal2-popup.swal-form-approve .swal2-actions{ margin:18px 0 0 !important; }

/* === MFU Approve (เนื้อใน SweetAlert จาก buildFieldFormPreviewV2) === */
.mfu-approve{
  font-family:'Sarabun','Noto Sans Thai',system-ui,sans-serif;
  color:#0f172a; line-height:1.55; font-size:15px;
}

/* แถบสรุปข้อมูลด้านบน — โทนเดียวกับ approve_field */
.mfu-approve .info-card{
  background:#f8fafc; border:1px solid #e5e7eb;
  border-radius:12px; padding:12px 14px; margin-bottom:14px;
}
.mfu-approve .info-title{
  font-weight:700; text-align:center; margin:0 0 8px; color:#111827;
}
.mfu-approve .info-grid{
  display:grid; grid-template-columns:1fr 1fr; gap:10px 18px;
}
.mfu-approve .info-grid > div{
  background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px;
}
.mfu-approve .label{ color:#475569; font-weight:600; margin-right:6px; white-space:nowrap; }
.mfu-approve .value{ color:#0f172a; }

/* 2 คอลัมน์ (เลขาฯ/หัวหน้า) */
.mfu-approve .cols{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.mfu-approve .col-box{
  background:#fff; border:1px solid #e5e7eb; border-radius:12px;
  padding:14px; min-height:220px;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,0.02);
}
.mfu-approve .col-box.locked{ background:#f5f7fb; }
.mfu-approve .col-head{ font-weight:700; text-align:center; margin-bottom:10px; font-size:16px; color:#0f172a; }
.mfu-approve .col-head .no{ margin-right:4px; }

.mfu-approve .check{ display:flex; align-items:center; gap:8px; margin:6px 0; color:#0f172a; }
.mfu-approve input[type="checkbox"]{ width:16px; height:16px; }

.mfu-approve .help{ font-size:12px; color:#64748b; margin:4px 0 6px; }

/* textarea */
.mfu-approve .textarea-wrap{ display:flex; align-items:flex-start; gap:8px; margin-top:4px; }
.mfu-approve .textarea-wrap textarea{
  flex:1; min-height:78px; border:1px solid #cbd5e1; border-radius:10px;
  padding:8px 10px; font:inherit; background:#fff; resize:vertical;
}
.mfu-approve .locked .textarea-wrap textarea{ background:#f1f5f9; }
.mfu-approve .edit-icon{ opacity:.35; margin-top:6px; }

/* ลายเซ็น */
.mfu-approve .sig-box{ margin-top:10px; text-align:center; color:#334155; }
.mfu-approve .sig-line{ margin:12px 0 4px; }
.mfu-approve .sig-note{ font-size:12px; opacity:.85; }
.mfu-approve .sig-date{ margin-top:6px; font-size:12px; }

/* ผู้อนุมัติ (ลายเซ็นรูปภาพ + ชื่อ) */
.mfu-approve .approver{
  display:flex; align-items:center; justify-content:flex-end; gap:10px;
  margin:8px 0 2px;
}
.mfu-approve .sig-image img{ max-height:40px; display:block; }
.mfu-approve .approver-name{ font-weight:700; color:#111827; }

/* บังคับสีปุ่มยืนยัน */
.swal2-popup .swal2-actions .swal2-styled.btn-violet {
  background-color: #695CF7 !important;
}


/* มือถือ: 1 คอลัมน์ */
@media (max-width: 700px){
  .mfu-approve .info-grid{ grid-template-columns:1fr; }
  .mfu-approve .cols{ grid-template-columns:1fr; }
}


</style>