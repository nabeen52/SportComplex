<template>
  <div class="layout">
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
      @click="toggleSidebar"
    ></div>

    <div class="main">
      <!-- ✅ Topbar (responsive, ไม่ทับ, ไม่มีปุ่ม ×) -->
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

      <!-- แถบประกาศ -->
      <transition name="slide-down">
        <div class="announcement-bar" v-if="showAnnouncementBar">
          <span class="announcement-icon">
            <i class="pi pi-megaphone"></i>
          </span>
          <span class="announcement-bar-text">
            {{ announcement }}
          </span>
          <button class="close-announcement-btn" @click="showAnnouncementBar = false" aria-label="ปิดประกาศ">
            <span class="close-icon">
              <i class="pi pi-times"></i>
            </span>
          </button>
        </div>
      </transition>

      <div class="histbody">
        <h1 style="display: flex; justify-content: center;">อนุมัติการยืม/รับคืนอุปกรณ์</h1>

        <div class="table-container">
          <table class="equipment-table">
            <thead>
              <tr>
                <th>วันที่ทำรายการ</th>
                <th>รายการอุปกรณ์</th>
                <th>จำนวน</th>
                <th>การดำเนินการ</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in groupedEquipments" :key="group.booking_id">
                <tr>
                  <!-- วันที่ทำรายการ
                       - กลุ่มยืมหลายวัน (approved + มีผู้อนุมัติ): แสดง 'เวลาอนุมัติ'
                       - อื่น ๆ: ใช้วันที่ของ item แรกเหมือนเดิม -->
                  <td v-if="group.kind === 'multi-approved'">
                    {{ formatDateTimeThai(firstItem(group).approvedAt) }}
                  </td>
                  <td v-else>
                    {{ formatDate(group.items[0].date) }}
                  </td>

                  <!-- รวมชื่ออุปกรณ์ในกลุ่ม -->
                  <td>
                    <span v-for="(item, idx) in group.items" :key="item.id">
                      {{ item.name }}<span v-if="idx < group.items.length - 1">, </span>
                    </span>
                  </td>

                  <!-- รวมจำนวน -->
                  <td>
                    <span v-for="(item, idx) in group.items" :key="item.id">
                      {{ item.quantity }}<span v-if="idx < group.items.length - 1">, </span>
                    </span>
                  </td>

                  <!-- การกระทำ -->
                  <td>
                    <!-- ✅ กรณียืมหลายวัน (approved + มี approvedAt/By/ById): ปุ่ม 'ส่งมอบ' -->
                    <template v-if="group.kind === 'multi-approved'">
                      <button
                        class="approve-btn"
                        @click="handoverGroup(group)"
                        :disabled="processingGroups.has(group.booking_id)"
                        style="margin-right:10px;"
                      >
                        ส่งมอบ
                      </button>
                      <span
                        v-if="processingGroups.has(group.booking_id)"
                        style="margin-left:8px;font-size:.9rem;color:#555;"
                      >
                        กำลังดำเนินการ...
                      </span>
                    </template>

                    <!-- ของเดิม: pending ทั้งกลุ่ม -->
                    <template v-else-if="group.items.every(item => (item.status || '').toLowerCase() === 'pending')">
                      <div>
                        <button
                          class="approve-btn"
                          @click="approveGroup(group)"
                          :disabled="processingGroups.has(group.booking_id)"
                          style="margin-right:10px;"
                        >
                          อนุมัติ
                        </button>
                        <button
                          class="cancel-btn"
                          @click="cancelGroup(group)"
                          :disabled="processingGroups.has(group.booking_id)"
                        >
                          ไม่อนุมัติ
                        </button>
                        <span
                          v-if="processingGroups.has(group.booking_id)"
                          style="margin-left:8px;font-size:.9rem;color:#555;"
                        >
                          กำลังดำเนินการ...
                        </span>
                      </div>
                    </template>

                    <!-- ของเดิม: approved ทั้งกลุ่ม -->
                    <template v-else-if="group.items.every(item => (item.status || '').toLowerCase() === 'approved')">
                      <span class="status-bg status-approved">ถูกอนุมัติ</span>
                    </template>

                    <!-- ของเดิม: disapproved ทั้งกลุ่ม -->
                    <template v-else-if="group.items.every(item => (item.status || '').toLowerCase() === 'disapproved')">
                      <span class="status-bg status-disapproved">ไม่ถูกอนุมัติ</span>
                    </template>

                    <!-- ของเดิม: มี return-pending บางรายการ -->
                    <template v-else-if="group.items.some(item => (item.status || '').toLowerCase() === 'return-pending')">
                      <div>
                        <button
                          class="return-btn"
                          @click="returnGroup(group)"
                          :disabled="processingGroups.has(group.booking_id)"
                        >
                          รับคืนอุปกรณ์
                        </button>
                        <span
                          v-if="processingGroups.has(group.booking_id)"
                          style="margin-left:8px;font-size:.9rem;color:#555;"
                        >
                          กำลังดำเนินการ...
                        </span>
                      </div>
                    </template>

                    <!-- ของเดิม: มี returned แล้ว -->
                    <template v-else-if="group.items.some(item => (item.status || '').toLowerCase() === 'returned')">
                      <span class="status-bg status-returned">รับคืนอุปกรณ์แล้ว</span>
                    </template>
                  </td>

                  <!-- รายละเอียด -->
                  <td>
                    <button class="remark-btn" @click="detailGroup(group)">รายละเอียด</button>
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
            Sport Complex – Mae Fah Luง University |
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

axios.defaults.withCredentials = true

// ===== PDF constants (ให้เท่ากับหน้า approve_field) =====
const A4_WIDTH_PX   = 794;   // A4 ที่ 96dpi
const PDF_MARGIN_MM = 10;    // <<== ปรับให้เท่ากับ approve_field (เช่น 10 หรือ 12)
const WRAPPER_PADDING_PX = 0; // ใช้ 0 เพื่อไม่ซ้ำซ้อนกับ margin ของ jsPDF


// ===== helpers (อยู่นอก export default) =====

async function ensureHtml2pdf() {
  if (typeof window !== 'undefined' && window.html2pdf) return window.html2pdf;
  try {
    const mod = await import('html2pdf.js');
    return mod?.default || mod;
  } catch (_) { /* fallback */ }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
  return window.html2pdf;
}


function _escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, m => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
  ));
}
function _formatThaiDate(d = new Date()) {
  return d.toLocaleDateString('th-TH', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function buildEquipmentHandoverPDFHTML(ctx) {
  const esc = s => String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  const todayStr = new Intl.DateTimeFormat('th-TH-u-nu-latn', {
    timeZone: 'Asia/Bangkok', day:'2-digit', month:'2-digit', year:'numeric'
  }).format(new Date());

  // วันที่ฝั่ง "ผู้รับคืน" (ช่องขวา)
  const receiverDateStr = ctx.handoverReceiverDate
    ? new Intl.DateTimeFormat('th-TH-u-nu-latn', {
        timeZone: 'Asia/Bangkok', day:'2-digit', month:'2-digit', year:'numeric'
      }).format(new Date(ctx.handoverReceiverDate))
    : '........../........../..........';

  const splitRange = (s) => {
    if (!s) return ['-', '-'];
    const p = String(s).split(' - ');
    return [p[0] || '-', p[1] || '-'];
  };
  const [sinceStr, uptoStr] = splitRange(ctx.dateRange);

  const rows = (ctx.rows || []).map((r,i)=>`
    <tr>
      <td class="c">${r.idx ?? (i+1)}</td>
      <td class="l">${esc(r.name)}</td>
      <td class="c">${esc(r.quantity)}</td>
      <td class="l">${esc(r.remark || '-')}</td>
    </tr>`).join('');

  // กล่องหมายเหตุ ใช้คลาส eqp-remark เผื่อสไตล์เพิ่มเติมภายหลัง
  // const remarkBox = (text) => `
  //   <div class="eqp-remark"
  //        style="grid-column:1/-1; white-space:pre-wrap; min-height:96px; padding:8px 10px;
  //               border:1px solid #cfd5e6; border-radius:8px; font-size:15px; line-height:1.5;">
  //     ${esc(text || '')}
  //   </div>`;

  // พื้นที่ข้อความล้วน (ไม่มีกรอบ) สำหรับ PDF
  const remarkBox = (text) => `
    <div class="eqp-remark"
         style="grid-column:1/-1; white-space:pre-wrap; min-height:96px;
                margin:6px 0 10px; font-size:15px; line-height:1.5;">
      ${esc(text || '')}
    </div>`;

  return `
  <div class="eqp-preview" style="font-family:'THSarabunNew','Sarabun','Noto Sans Thai',system-ui,sans-serif; color:#111;">
    <div class="eqp-head" style="text-align:center; margin-bottom:48px;">
      <div class="t1" style="font-weight:700; font-size:20px;">แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</div>
      <div class="t2" style="font-size:14px; margin-top:2px;">โทร 0-5391-7820 และ 0-5391-7821 | E-mail: sport-complex@mfu.ac.th</div>
    </div>

    <div class="eqp-meta" style="display:flex; justify-content:flex-end; margin:18px 0 12px;">
      <div class="right" style="text-align:right; line-height:1.55;">
        <div>ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</div>
        <div>วันที่ทำรายการ ${esc(ctx.dateBorrow)}</div>
        <div>เวลาที่ทำรายการ ${esc(ctx.timeBorrow)}</div>
      </div>
    </div>

    <div class="date" style="margin-top:30px">วันที่ ${todayStr}</div>
    <div style="margin-top:20px">ส่วนที่1 สำหรับผู้ขอใช้บริการ</div>

    <section class="eqp-section eqp-section--par">
      <div class="eqp-par" style="font-size:16px; line-height:1.75; text-indent:2em; word-break:break-word; margin:12px 0 18px;">
        ข้าพเจ้า ${esc(ctx.requester)}
        รหัสนักศึกษา/รหัสพนักงาน ${esc(ctx.requesterId)}
        ${ctx.tel ? 'โทร ' + esc(ctx.tel) : ''}
        มีความประสงค์ขอยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ของศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง
        เพื่อใช้ในงาน ${esc(ctx.reason)} สถานที่ใช้งาน ${esc(ctx.location)}
        ระหว่างวันที่ ${esc(sinceStr)} ถึงวันที่ ${esc(uptoStr)}
        
      </div>
    </section>

    <section class="eqp-section eqp-section--table">
      <table class="eqp-table" style="width:100%; border-collapse:collapse; table-layout:fixed; font-size:15px; margin:14px 0 22px;">
        <thead>
          <tr>
            <th style="width:72px;background:#213555; color:#fff; border:1px solid #e6e9f2; padding:10px 14px; text-align:center; font-weight:700;">ลำดับ</th>
            <th style="background:#213555; color:#fff; border:1px solid #e6e9f2; padding:10px 14px; text-align:center; font-weight:700;">รายการ</th>
            <th style="width:100px;background:#213555; color:#fff; border:1px solid #e6e9f2; padding:10px 14px; text-align:center; font-weight:700;">จำนวน</th>
            <th style="width:260px;background:#213555; color:#fff; border:1px solid #e6e9f2; padding:10px 14px; text-align:center; font-weight:700;">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody style="white-space:normal; word-break:break-word; overflow-wrap:anywhere;">
          ${rows}
        </tbody>
      </table>
    </section>

    <div class="eqp-bottom">
      <!-- ลงชื่อผู้ยืม (จัดวันที่ให้อยู่ใต้เส้นเซ็นคอลัมน์กลาง) -->
      <div class="eqp-sign"
           style="margin:16px 0 6px; display:grid; grid-template-columns:auto 240px auto; column-gap:8px;
                  align-items:center; justify-content:end;">
        <span class="lab">ลงชื่อ</span>
        <span class="line" style="height:1.2em; border-bottom:1px dotted #666; display:flex; align-items:flex-end; justify-content:center;">
          <span class="name" style="padding:0 6px;">${esc(ctx.requester)}</span>
        </span>
        <span class="role">ผู้ยืม</span>
        <div class="date" style="grid-column:2; justify-self:center; margin-top:6px;">วันที่ ${todayStr}</div>
      </div>

      <!-- กล่องซ้าย/ขวา ใช้ Grid 3 คอลัมน์: label | เส้นเซ็น | role และให้ 'วันที่' อยู่คอลัมน์กลาง -->
      <div class="eqp-boxes" style="display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:16px; margin-top:18px;">
        <!-- ผู้ส่งมอบ -->
        <div class="box" style="border:1px solid #333; padding:12px 14px; min-height:176px; display:grid; grid-template-columns:auto 1fr auto; column-gap:8px;">
          <div class="title" style="grid-column:1/-1; font-weight:700; text-align:center; padding-bottom:6px; margin-bottom:10px; border-bottom:1px solid #9aa3b2;">
            ผลการดำเนินการ/ผลการปฏิบัติงาน
          </div>
          ${remarkBox(ctx.handoverRemarkSender)}
          <!-- แถวลายเซ็น (วางลูก 3 ชิ้นให้ตรง 3 คอลัมน์) -->
          <span class="lab">ลงชื่อ</span>
          <span class="dotfill" style="height:1.2em; border-bottom:1px dotted #666; display:flex; align-items:flex-end; justify-content:center;">
            <span class="filltext" style="background:#fff; padding:0 4px; line-height:1;">${esc(ctx.staffThaiName || '')}</span>
          </span>
          <span class="role">ผู้ส่งมอบ</span>
          <!-- วันที่อยู่คอลัมน์กลาง -->
          <div class="date" style="grid-column:2; justify-self:center; margin-top:8px;">วันที่ ${todayStr}</div>
        </div>

        <!-- ผู้รับคืน -->
        <div class="box" style="border:1px solid #333; padding:12px 14px; min-height:176px; display:grid; grid-template-columns:auto 1fr auto; column-gap:8px;">
          <div class="title" style="grid-column:1/-1; font-weight:700; text-align:center; padding-bottom:6px; margin-bottom:10px; border-bottom:1px solid #9aa3b2;">
            ผลการดำเนินการ/ผลการปฏิบัติงาน
          </div>
          ${remarkBox(ctx.handoverRemarkReceiver)}
          <span class="lab">ลงชื่อ</span>
          <span class="dotfill" style="height:1.2em; border-bottom:1px dotted #666; display:flex; align-items:flex-end; justify-content:center;">
            <span class="filltext" style="background:#fff; padding:0 4px; line-height:1;">
              ${esc(ctx.handoverReceiverThaiName || ctx.receiverThaiName || '')}
            </span>
          </span>
          <span class="role">ผู้รับคืน</span>
          <div class="date" style="grid-column:2; justify-self:center; margin-top:8px;">วันที่ ${receiverDateStr}</div>
        </div>
      </div>

      <div style="margin-top:20px">
        *หมายเหตุ หากอุปกรณ์/วัสดุ/ครุภัณฑ์ เกิดการชำรุดเสียหายในระหว่างที่ผู้ยืมเป็นผู้รับผิดชอบ
        ผู้ยืมจะต้องชดใช้ค่าเสียหายที่เกิดขึ้นทั้งหมด
      </div>
    </div>
  </div>`;
}



const INLINE_EQP_CSS = `
  .eqp-preview{ font-family:'THSarabunNew','Sarabun','Noto Sans Thai',system-ui,sans-serif; color:#111; }
  .eqp-head{ text-align:center; margin-bottom:48px; }
  .eqp-head .t1{ font-weight:700; font-size:20px; }
  .eqp-head .t2{ font-size:14px; margin-top:2px; }
  .eqp-meta{ display:flex; justify-content:flex-end; margin:18px 0 12px; }
  .eqp-meta .right{ text-align:right; line-height:1.55; }
  .eqp-par{ font-size:16px; line-height:1.75; text-indent:2em; word-break:break-word; margin:12px 0 18px; }

  .eqp-table{ width:100%; border-collapse:collapse; table-layout:fixed; font-size:15px; margin:14px 0 22px; }
  .eqp-table thead th{
    background:#213555; color:#fff; border:1px solid #e6e9f2; padding:10px 14px; text-align:center; font-weight:700;
  }
  .eqp-table tbody td{ border:1px solid #e6e9f2; padding:10px 14px; vertical-align:top; }
  .eqp-table td.c{ text-align:center; }
  .eqp-table td.l{ text-align:left; }
  .eqp-table th, .eqp-table td{ white-space:normal; word-break:break-word; overflow-wrap:anywhere; }

  .eqp-sign{ margin:16px 0 6px; display:flex; flex-direction:column; align-items:flex-end; text-align:right; }
  .eqp-sign .sig-line{ display:grid; grid-template-columns:auto 240px auto; align-items:center; column-gap:8px; }
  .eqp-sign .sig-line .line{ height:1.2em; border-bottom:1px dotted #666; display:flex; align-items:flex-end; justify-content:center; }
  .eqp-sign .sig-line .name{ padding:0 6px; background:transparent; }
  .eqp-sign .date{ margin-top:6px; }

  .eqp-boxes{ display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:16px; margin-top:18px; }
  .eqp-boxes .box{ border:1px solid #333; padding:12px 14px; min-height:176px; }
  .eqp-boxes .title{ font-weight:700; text-align:center; padding-bottom:6px; margin-bottom:10px; border-bottom:1px solid #9aa3b2; }
  .eqp-boxes .sign-inline{ display:grid; grid-template-columns:auto 1fr auto; column-gap:8px; align-items:center; margin-top:6px; }
  .eqp-boxes .dotfill{ height:1.2em; border-bottom:1px dotted #666; display:flex; align-items:flex-end; justify-content:center; }
  .eqp-boxes .date{ text-align:center; margin-top:8px; }

  .eqp-textarea{
    width:100%; min-height:96px; padding:8px 10px; border:1px solid #cfd5e6; border-radius:8px; font-size:15px; line-height:1.5;
    resize:vertical; outline:none; background:#fff;
  }
`;


async function _htmlToPdfBlob(html, filename = 'handover.pdf') {
  // รอ font โหลดครบก่อนแคปเจอร์
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch(_) {}
  }

  // สร้าง wrapper ที่ "ไม่ใส่ padding" แล้วให้ jsPDF เป็นตัวกำหนดระยะขอบเพียงตัวเดียว
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position:fixed','top:0','left:0','opacity:0','pointer-events:none',
    'background:#fff',
    `width:${A4_WIDTH_PX}px`,
    `padding:${WRAPPER_PADDING_PX}px`,
    'z-index:-1'
  ].join(';');

  wrapper.innerHTML = `
    <style>${INLINE_EQP_CSS}</style>
    <div id="print-root" style="background:#fff">${html}</div>
  `;
  document.body.appendChild(wrapper);

  const html2pdf = await ensureHtml2pdf();

  const opt = {
    // ให้ขอบกระดาษใช้ค่าเดียวกับ approve_field
    margin: [PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_MARGIN_MM],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: A4_WIDTH_PX,   // บังคับสเกลให้เท่ากันทุกหน้า
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css','legacy'] },
  };

  const worker = html2pdf().set(opt).from(wrapper.querySelector('#print-root'));
  await worker.toPdf();
  const blob = await worker.outputPdf('blob');

  document.body.removeChild(wrapper);
  return blob;
}



async function _uploadPdfBlob(blob, filename) {
  const fd = new FormData();
  fd.append('file', new File([blob], filename, { type: 'application/pdf' }));
  const up = await axios.post(`${API_BASE}/api/upload`, fd, {   // ✅ ใส่ API_BASE
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return up.data?.fileUrl || up.data?.url;
}

export default {
  data() {
    return {
      isSidebarClosed: false,
      isMobile: window.innerWidth <= 600,
      announcement: "",
      showAnnouncementBar: false,
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      userId: localStorage.getItem('user_id') || '',
      lastCheckedIds: new Set(),
      usersMap: {},
      equipmentGroups: [],
      polling: null,
      pollingNotif: null,
      lastSeenTimestamp: 0,
       processingGroups: new Set(),
    }
  },
 computed: {
  groupedEquipments() {
    const isEmpty = (v) => v === undefined || v === null || v === "" || v === "null";
    const toLower = (s) => (s || "").toLowerCase();

    // เช็กว่าถูกส่งมอบแล้วหรือยัง
    const isHandedOver = (it) =>
      !isEmpty(it.handoverById) ||
      !isEmpty(it.handoverBy) ||
      !isEmpty(it.handoverAt) ||
      !isEmpty(it.handoverRemarkSender);

    // ----- single-day เดิม -----
    let singleGroups = (this.equipmentGroups || []).filter(group =>
      group.items.every(item =>
        (!item.agency || item.agency === "") &&
        isEmpty(item.since) && isEmpty(item.uptodate)
      )
    );
    singleGroups = singleGroups.filter(group =>
      !group.items.some(item => ["returned","disapproved"].includes(toLower(item.status)))
    );
    const idsWithReturnPending = new Set();
    singleGroups.forEach(g => {
      if (g.items.some(it => toLower(it.status) === "return-pending")) {
        idsWithReturnPending.add(g.booking_id);
      }
    });
    singleGroups = singleGroups.map(g => {
      if (idsWithReturnPending.has(g.booking_id)) {
        return { booking_id: g.booking_id, items: g.items.filter(it => toLower(it.status) === "return-pending"), kind: "single" };
      }
      return { booking_id: g.booking_id, items: g.items, kind: "single" };
    }).filter(g => g.items.length > 0);

    // ----- multi-day ที่ 'approved' และยังไม่ถูกส่งมอบ (ปุ่ม "ส่งมอบ") -----
    const multiApproved = (this.equipmentGroups || []).map(g => {
      const items = (g.items || []).filter(it => {
        const isEquip = toLower(it.type) !== "field";
        const approved = toLower(it.status) === "approved";
        const multiDay = !isEmpty(it.since) && !isEmpty(it.uptodate);
        const hasApprover = !isEmpty(it.approvedAt) && !isEmpty(it.approvedBy) && !isEmpty(it.approvedById);
        const notHandedOver = !isHandedOver(it);
        return isEquip && approved && multiDay && hasApprover && notHandedOver;
      });
      return { booking_id: g.booking_id, items, kind: "multi-approved" };
    }).filter(g => g.items.length > 0)
      .sort((a, b) => {
        const A = new Date(a.items[0]?.approvedAt || 0).getTime();
        const B = new Date(b.items[0]?.approvedAt || 0).getTime();
        return B - A;
      });

    // ===== ✅ ใหม่: multi-day ที่ 'return-pending' (ปุ่ม "รับคืนอุปกรณ์") =====
    const multiReturnPending = (this.equipmentGroups || []).map(g => {
      const items = (g.items || []).filter(it => {
        const isEquip = toLower(it.type) !== "field";
        const multiDay = !isEmpty(it.since) && !isEmpty(it.uptodate);
        const retPending = toLower(it.status) === "return-pending";
        return isEquip && multiDay && retPending;
      });
      return { booking_id: g.booking_id, items, kind: "multi-return-pending" };
    }).filter(g => g.items.length > 0)
      .sort((a, b) => {
        const A = new Date(a.items[0]?.updatedAt || a.items[0]?.uptodate || 0).getTime();
        const B = new Date(b.items[0]?.updatedAt || b.items[0]?.uptodate || 0).getTime();
        return B - A;
      });

    // รวมลำดับการโชว์: ส่งมอบ -> รอรับคืน (หลายวัน) -> เคส single
    let combined = [...multiApproved, ...multiReturnPending, ...singleGroups];

    if (this.filterStatus) {
      combined = combined.filter(group =>
        group.items.every(item => toLower(item.status) === this.filterStatus)
      );
    }
    return combined;
  },
},





  methods: {

    firstItem(group){
  return (group && group.items && group.items[0]) ? group.items[0] : {};
},
formatDateTimeThai(dateStr){
  if(!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const datePart = d.toLocaleDateString('th-TH', { year:'numeric', month:'2-digit', day:'2-digit' });
  const timePart = d.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', hour12:false });
  return `${datePart} ${timePart} น.`;
},

// ใน <script> ภายใต้ methods: (เพิ่มเมธอดใหม่)
// ใน <script> ภายใต้ methods:
async _buildEquipmentCtxFromGroup(group){
  const bookingId = group.booking_id || group.items?.[0]?.booking_id || null;

  // รวมจำนวนตามชื่ออุปกรณ์
  const mergedQty = new Map();
  (group.items || []).forEach(it => {
    const name = it?.name || '-';
    const q = Number(it?.quantity ?? 0) || 0;
    mergedQty.set(name, (mergedQty.get(name) || 0) + q);
  });

  let requester='-', requesterId='-', dateBorrow='-', timeBorrow='-', dateRange='-';
  let agency='-', reason='-', location='-', tel='';   // << ตั้งค่าเริ่มต้นว่างไว้ ไม่ให้แสดง "โทร -"
  const remarkMap = {};

  // helper เลือกค่าตามคีย์ที่มีจริง
  const pick = (obj, keys=[]) => {
    if (!obj) return '';
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
    }
    return '';
  };
  const pickFromList = (list, keys=[]) => {
    for (const row of (list || [])) {
      const v = pick(row, keys);
      if (v) return v;
    }
    return '';
  };

  if (bookingId){
    // 1) history → ชื่อผู้ยืม/รหัส/วันเวลา/ช่วงวัน (เอาเรคอร์ดล่าสุดของ booking นี้)
    const resH = await axios.get(`${API_BASE}/api/history`, { params: { booking_id: bookingId } });
    let list = Array.isArray(resH.data) ? resH.data : [];
    list = list
      .filter(h => String(h?.booking_id || '') === String(bookingId))
      .filter(h => (h?.type || '').toLowerCase() === 'equipment')
      .sort((a,b) => new Date(b.updatedAt || b.createdAt || b.date || 0) - new Date(a.updatedAt || a.createdAt || a.date || 0));

    const recUser = list.find(h => h?.username_form && String(h.username_form).trim());
    if (recUser) requester = String(recUser.username_form).trim();

    const recId = list.find(h => h?.id_form && String(h.id_form).trim());
    if (recId) requesterId = String(recId.id_form).trim();

    const recDate = list[0];
    if (recDate) {
      if (recDate.createdAt) {
        dateBorrow = this.formatDate(recDate.createdAt);
        const dt = new Date(recDate.createdAt);
        if (!isNaN(dt)) {
          timeBorrow = dt.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', hour12:false }) + ' น.';
        }
      } else if (recDate.date) {
        dateBorrow = this.formatDate(recDate.date);
      }
      const since = recDate?.since ? this.formatDate(recDate.since) : '-';
      const upto  = recDate?.uptodate ? this.formatDate(recDate.uptodate) : '-';
      dateRange = `${since} - ${upto}`;
    }

    // 2) booking_equipment → หน่วยงาน/เหตุผล/สถานที่/หมายเหตุรายการ
    const resB = await axios.get(`${API_BASE}/api/booking_equipment?id=${bookingId}`);
    const be = Array.isArray(resB.data) ? resB.data[0] : resB.data;
    if (be){
      agency   = pick(be, ['agency'])              || agency;
      reason   = pick(be, ['reason','purpose'])    || reason;
      location = pick(be, ['location'])            || location;

      if (Array.isArray(be.items)){
        be.items.forEach(i => { remarkMap[i.item_name] = i.remark || ''; });
      }
    }

    // 3) TEL: หาได้จากทั้ง booking_equipment และ history ด้วยหลายชื่อคีย์
    const telKeys = ['tel','phone','telephone','tel_form','telphone','contact_phone','contactTel','contact'];
    const telFromBe   = pick(be, telKeys);
    const telFromHist = pickFromList(list, telKeys);
    tel = telFromBe || telFromHist || '';

    // เติม fallback อื่น ๆ จาก history ถ้ายังว่าง
    if (!agency   || agency   === '-') agency   = pickFromList(list, ['agency','department','org','organization']) || agency;
    if (!reason   || reason   === '-') reason   = pickFromList(list, ['reasons','reason','purpose'])              || reason;
    if (!location || location === '-') location = pickFromList(list, ['location','place','place_use'])            || location;
  }

  const rows = Array.from(mergedQty.entries()).map(([name, qty], idx) => ({
    idx: idx + 1,
    name,
    quantity: qty,
    remark: remarkMap[name] || ''
  }));

  return { requester, requesterId, tel, agency, reason, location, dateBorrow, timeBorrow, dateRange, rows };
},










async handoverGroup(group) {
  const ctx = await this._buildEquipmentCtxFromGroup(group);

  // ชื่อไทยของ staff ที่ล็อกอิน (ผู้ส่งมอบ)
  const staffThaiName =
    (localStorage.getItem('thaiName') || '').trim() ||
    (this.usersMap[this.userId] || '').trim() ||
    '-';
  ctx.staffThaiName = staffThaiName;

  // พรีวิวฟอร์ม
  const htmlPreview = buildEquipmentApprovePreviewHTML(ctx);

  const ask = await Swal.fire({
    title: 'ยืนยันการส่งมอบอุปกรณ์',
    html: htmlPreview,
    width: 1100,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'ส่งมอบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#2baf2b',
    cancelButtonColor: '#999',
    customClass: { popup: 'swal-equip-approve' },
    preConfirm: () => {
      const remark1 = document.getElementById('handoverRemark1')?.value?.trim() || '';
      const remark2 = document.getElementById('handoverRemark2')?.value?.trim() || '';
      return { remarkSender: remark1, remarkReceiver: remark2 };
    }
  });
  if (!ask.isConfirmed) return;

  // สร้าง PDF จากข้อมูลที่กรอก
  const remarkSender = ask.value.remarkSender || '';
  const remarkReceiver = ask.value.remarkReceiver || '';

  const pdfCtx = {
    ...ctx,
    handoverRemarkSender: remarkSender,
    handoverRemarkReceiver: remarkReceiver,
    booking_id: group.booking_id, 
  };
  const pdfHtml = buildEquipmentHandoverPDFHTML(pdfCtx);
  const pdfName = `handover_${(group.booking_id || 'single')}_${Date.now()}.pdf`;

  try {
    this.processingGroups.add(group.booking_id);

    // gen + upload
    const pdfBlob = await _htmlToPdfBlob(pdfHtml, pdfName);
    const pdfUrl  = await _uploadPdfBlob(pdfBlob, pdfName);

    // payload บันทึกส่งมอบ
    const payload = {
      staff_id: this.userId,
      remark_sender: remarkSender,
      remark_receiver: remarkReceiver,
      thai_name: staffThaiName,
      bookingPdfUrl: pdfUrl,       // ✅ แทนที่ไฟล์ PDF เดิม
      fileName: pdfName,
      fileType: 'application/pdf'
    };

    if (group.booking_id && !String(group.booking_id).startsWith('single_')) {
      const targetId = group.items?.[0]?.id;
      await axios.patch(
        `${API_BASE}/api/history/${targetId}/handover`,  // ✅ ใส่ API_BASE
        { ...payload, booking_id: group.booking_id }
      );
    } else {
      await Promise.all((group.items || []).map(it =>
        axios.patch(`${API_BASE}/api/history/${it.id}/handover`, payload) // ✅ ใส่ API_BASE
      ));
    }

    await Swal.fire({ icon: 'success', title: 'ส่งมอบเรียบร้อย', timer: 1400, showConfirmButton: false });
    this.fetchAllEquipments?.();

  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'ส่งมอบไม่สำเร็จ', 'error');
  } finally {
    this.processingGroups.delete(group.booking_id);
  }
},



    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed
    },
    closeSidebarOnMobile() {
      if (this.isMobile) this.isSidebarClosed = true
    },

    checkMobile() {
      this.isMobile = window.innerWidth <= 600
      // Auto close sidebar เมื่อย่อหน้าจอเป็น mobile
      if (this.isMobile) this.isSidebarClosed = true
    },


    toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      // ✅ บันทึกเวลาอ่านล่าสุดแบบถาวร (ใช้ key แยกของ staff)
      this.lastSeenTimestamp = Date.now();
      localStorage.setItem('staff_lastSeenTimestamp', this.lastSeenTimestamp);
      this.unreadCount = 0;
    }
  },

  pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // ✅ 7 วันย้อนหลัง
  this.notifications = this.notifications.filter(n => (n?.timestamp ?? 0) >= cutoff);
},

    closeNotifications() {
      this.showNotifications = false
    },
    async fetchUsers() {
  try {
    const res = await axios.get(`${API_BASE}/api/users`);
    this.usersMap = {};
    res.data.forEach(u => {
      const id = u.user_id || u._id;
      const thai = (u.thaiName || '').trim();
      const enFull = [u.firstname, u.lastname].filter(Boolean).join(' ').trim();
      const fallback = (u.name || id || '').trim();

      // ✅ ใช้ชื่อไทยก่อน แล้วค่อยอังกฤษ จากนั้นค่อย fallback
      const display = thai || enFull || fallback;
      this.usersMap[id] = display;

      // ✅ เก็บชื่อของ staff คนปัจจุบันไว้ใน localStorage (กันกรณี usersMap ยังไม่โหลด)
      if (String(id) === String(this.userId)) {
        localStorage.setItem('thaiName', display);
      }
    });
  } catch (err) {
    this.usersMap = {};
  }
},

    formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })
},

    async fetchPendingEquipments() {
      try {
        // pending
        const pendingRes = await axios.get(`${API_BASE}/api/equipments/pending`);
        const pendingList = pendingRes.data.map((h) => ({
  id: h._id?.$oid || h._id,
  name: h.name || "-",
  quantity: h.quantity || "-",
  user_id: h.user_id || "-",
  requester: h.requester || "-",
  date: h.date || "-",
  booking_id: h.booking_id || null,
  status: h.status || "Pending",
  agency: h.agency ?? "",          // เพิ่ม!
  since: h.since ?? null,          // เพิ่ม!
  uptodate: h.uptodate ?? null,    // เพิ่ม!
  attachment: h.attachment || h.returnPhoto || null,
  fileName: h.fileName || null,
}));


        // return-pending
        const returnRes = await axios.get(`${API_BASE}/api/equipments/return-pending`);
        const returnList = returnRes.data.map((h) => ({
  id: h._id?.$oid || h._id,
  name: h.name || "-",
  quantity: h.quantity || "-",
  user_id: h.user_id || "-",
  requester: h.requester || "-",
  date: h.date || "-",
  booking_id: h.booking_id || null,
  status: "return-pending",
  agency: h.agency ?? "",          // เพิ่ม!
  since: h.since ?? null,          // เพิ่ม!
  uptodate: h.uptodate ?? null,    // เพิ่ม!
  attachment: h.attachment || h.returnPhoto || null,
  fileName: h.fileName || null,
}));


        const allList = [...pendingList, ...returnList];

        // group by booking_id
        const groups = {};
        allList.forEach(item => {
          const key = item.booking_id || 'single_' + item.id;
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        });
        this.equipmentGroups = Object.entries(groups).map(([booking_id, items]) => ({
          booking_id,
          items
        }));
      } catch (err) {
        this.equipmentGroups = [];
        console.error('โหลดข้อมูล booking ไม่สำเร็จ:', err);
      }
    },
    async approveGroup(group) {
  // กันกดย้ำขณะทำงาน
  if (this.processingGroups.has(group.booking_id)) return;

  const ask = await Swal.fire({
    title: 'อนุมัติรายการนี้',
    text: 'คุณต้องการอนุมัติรายการยืมอุปกรณ์นี้?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'อนุมัติ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#50b053',
    cancelButtonColor: '#999'
  });
  if (!ask.isConfirmed) return;

  const staffId = localStorage.getItem('user_id');
  this.processingGroups.add(group.booking_id);

  // ฟังก์ชันเช็คข้อความ error ที่ถือว่า "อนุมัติไปแล้ว" เพื่อทำงานแบบ idempotent
  const isAlreadyApprovedError = (err) => {
    const code = err?.response?.status;
    const msg  = (err?.response?.data?.message || err?.message || '').toLowerCase();
    return code === 409 ||
           (code === 400 && /already|approved|อนุมัติแล้ว|ซ้ำ/.test(msg));
  };

  try {
    // เอาเฉพาะที่ยัง pending
    const pendingItems = group.items.filter(
      it => (it.status || '').toLowerCase() === 'pending'
    );
    if (!pendingItems.length) {
      // ไม่มีอะไรต้องอนุมัติแล้ว (เช่น list รีเฟรชช้า)
      return;
    }

    // ✅ ยิงครั้งเดียวพอ: ให้ backend อนุมัติทั้ง booking_id
    // (กรณี single รายการ key จะเป็น 'single_<id>' ก็ยังยิงเพียงครั้งเดียวถูกต้อง)
    const target = pendingItems[0];

    try {
      await axios.patch(
        `${API_BASE}/api/history/${target.id}/approve_equipment`,
        { staff_id: staffId }
      );
    } catch (err) {
      // ถ้าอนุมัติไปแล้วจากการกดซ้ำ/รีเฟรชช้า ถือว่าสำเร็จเชิงตรรกะ
      if (!isAlreadyApprovedError(err)) throw err;
    }

    // อัปเดตสถานะฝั่ง UI ให้ทั้งกลุ่ม (เฉพาะที่เดิมเป็น pending)
    group.items.forEach(it => {
      if ((it.status || '').toLowerCase() === 'pending') {
        it.status = 'Approved';
      }
    });

    Swal.fire({
      title: 'สำเร็จ',
      text: 'รายการถูกอนุมัติแล้ว',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });

    // รีเฟรชข้อมูล
    this.fetchPendingEquipments?.();
    this.fetchAllEquipments?.();

  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'อนุมัติไม่สำเร็จ', 'error');
  } finally {
    this.processingGroups.delete(group.booking_id);
  }
}
,


    async cancelGroup(group) {
  const { value: remark } = await Swal.fire({
    title: 'ไม่อนุมัติรายการ',
    html: `
      <div style="text-align:center;margin-bottom:8px;">
        กรุณาระบุหมายเหตุที่ไม่อนุมัติ
      </div>
    `,
    input: 'textarea',
    inputAttributes: { 'aria-label': 'remark' },
    showCancelButton: true,
    confirmButtonText: 'ไม่อนุมัติ',
    cancelButtonText: 'ยกเลิก',
    inputPlaceholder: 'ระบุหมายเหตุ (จำเป็นต้องกรอก)',
    confirmButtonColor: '#ff4d4f',
    cancelButtonColor: '#999',
    preConfirm: (val) => {
      const v = (val || '').trim();
      if (!v) {
        Swal.showValidationMessage('กรุณากรอกหมายเหตุ');
        return false;
      }
      return v;
    }
  });

  if (remark === undefined) return; // กดยกเลิก

  const staffId = localStorage.getItem('user_id');

  try {
    await Promise.all(
      group.items.map(item =>
        axios.patch(`${API_BASE}/api/history/${item.id}/disapprove_equipment`, {
          staff_id: staffId,
          remark   // ✅ ส่ง remark ไปด้วย
        })
      )
    );

    // อัปเดตสถานะฝั่ง UI
    group.items.forEach(item => { item.status = 'Disapproved'; });

    await Swal.fire({
      icon: 'error',
      title: 'ดำเนินการสำเร็จ',
      text: 'ยกเลิกรายการเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false
    });

    this.fetchPendingEquipments(); // refresh รายการ
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'ไม่สามารถบันทึกการไม่อนุมัติได้', 'error');
  }
},

    detailGroup(group) {
  const esc = (s) =>
    String(s ?? '-')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  const fmtDate = (d) => {
    if (!d) return '-';
    const x = new Date(d);
    return isNaN(x) ? '-' : x.toLocaleDateString('th-TH', {year:'numeric',month:'2-digit',day:'2-digit'});
  };

  // ✅ แปลงสถานะเป็นภาษาไทย
  const statusTitle = (s='') => {
    const m = s.toLowerCase();
    if (m==='approved') return 'ถูกอนุมัติ';
    if (m==='disapproved') return 'ไม่ถูกอนุมัติ';
    if (m==='returned') return 'รับคืนอุปกรณ์แล้ว';
    if (m==='pending') return 'รอดำเนินการ';
    if (m==='return-pending') return 'รอรับคืน';
    return s || '-';
  };

  const hasPeriod = group.items.some(it => it.since || it.uptodate);

  const rows = group.items.map((it, idx) => {
    const requester = this.usersMap[it.user_id] || it.requester || it.user_id || '-';
    const photoSrc = it.attachment || it.returnPhoto || it.fileData || '';
    const photoCell = photoSrc
      ? `<img src="${photoSrc}" class="equip-thumb" alt="photo"
               onclick="window.__equipShowPhoto && window.__equipShowPhoto('${photoSrc}')"/>
         <div class="equip-thumb-hint">(คลิกเพื่อดูรูปเต็ม)</div>`
      : '-';

    return `
      <tr>
        <td class="td-center">${idx + 1}</td>
        <td>${esc(it.name)}</td>
        <td class="td-center">${esc(it.quantity ?? '-')}</td>
        <td>${esc(requester)}</td>
        <td class="td-center">${esc(it.user_id ?? '-')}</td>
        ${
          hasPeriod
            ? `<td class="td-center">${esc(fmtDate(it.since))}</td>
               <td class="td-center">${esc(fmtDate(it.uptodate))}</td>`
            : `<td class="td-center">${esc(fmtDate(it.date))}</td>`
        }
        <!-- ✅ ใช้ statusTitle แทน -->
        <td class="td-center">${esc(statusTitle(it.status))}</td>
        <td class="td-center">${photoCell}</td>
      </tr>
    `;
  }).join('');

  const cols = hasPeriod
    // #, Equipment, Amount, Requester, UserID, Since, Until, Status, Photo
    ? `<col style="width:5%"><col style="width:20%"><col style="width:8%">
       <col style="width:15%"><col style="width:12%"><col style="width:12%">
       <col style="width:10%"><col style="width:8%"><col style="width:10%">`
    // #, Equipment, Amount, Requester, UserID, Date, Status, Photo
    : `<col style="width:5%"><col style="width:22%"><col style="width:8%">
       <col style="width:18%"><col style="width:15%"><col style="width:12%">
       <col style="width:10%"><col style="width:10%">`;

  const head = hasPeriod
    ? `<tr>
         <th>ลำดับ</th><th>อุปกรณ์</th><th>จำนวน</th><th>ผู้ขอใช้</th>
         <th>รหัสนักศึกษา/พนักงาน</th><th>ตั้งแต่</th><th>ถึง</th>
         <th>สถานะ</th><th>รูป</th>
       </tr>`
    : `<tr>
         <th>ลำดับ</th><th>อุปกรณ์</th><th>จำนวน</th><th>ผู้ขอใช้</th>
         <th>รหัสนักศึกษา/พนักงาน</th><th>วันที่ยืม</th>
         <th>สถานะ</th><th>รูป</th>
       </tr>`;

  const html = `
    <div class="equip-table-wrap">
      <table class="equip-table">
        <colgroup>${cols}</colgroup>
        <thead>${head}</thead>
        <tbody>${rows || `<tr><td colspan="${hasPeriod?9:8}" class="td-center">ไม่มีรายการ</td></tr>`}</tbody>
      </table>
    </div>
  `;

  Swal.fire({
    title: 'รายละเอียดรายการยืมอุปกรณ์',
    html,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3085d6',
    customClass: { popup: 'equip-swal' },
    didOpen: () => {
      window.__equipShowPhoto = (src) => {
        const w = window.open('', '_blank');
        w.document.write(`
          <html><head><title>รูปอุปกรณ์</title>
          <style>
            body{background:#111;margin:0;display:flex;align-items:center;justify-content:center;height:100vh}
            img{max-width:100vw;max-height:100vh;object-fit:contain;border-radius:16px;box-shadow:0 8px 30px #0008}
          </style></head>
          <body onclick="window.close()"><img src="${src}"></body></html>
        `);
      };
    },
    willClose: () => { window.__equipShowPhoto = undefined; }
  });
},



    async returnGroup(group) {
  // กันกดย้ำ
  if (this.processingGroups.has(group.booking_id)) return;
  this.processingGroups.add(group.booking_id);

  const staffId = localStorage.getItem('user_id');

  // ==== เคสยืมหลายวันที่ "รอรับคืน" (multi-return-pending) ====
  if (group.kind === 'multi-return-pending') {
    try {
      // เตรียม context สำหรับพรีวิว/พิมพ์เอกสาร
      const ctx = await this._buildEquipmentCtxFromGroup(group);

      // ชื่อไทยผู้รับคืน + เวลา ISO ที่รับคืน
      const receiverThaiName =
        (localStorage.getItem('thaiName') || '').trim() ||
        (this.usersMap[this.userId] || '').trim() || '-';
      const receiverDateISO = new Date().toISOString();

      ctx.receiverThaiName = receiverThaiName;

      // ดึงข้อมูล "ผู้ส่งมอบ" ที่เคยบันทึกไว้
      const any = (group.items || []);
      ctx.handoverRemarkSender =
        any.find(it => (it.handoverRemarkSender || '').trim())?.handoverRemarkSender || '';
      ctx.handoverSenderName =
        any.find(it => (it.handoverBy || '').trim())?.handoverBy || '';
      ctx.handoverAt =
        any.find(it => it.handoverAt)?.handoverAt || null;

      // พรีวิว: ซ้ายอ่านอย่างเดียว/ขวาพิมพ์ได้ (ไม่มีช่อง damage แล้ว)
      const htmlPreview = buildEquipmentReturnPreviewHTML({
        ...ctx,
        booking_id: group.booking_id,
      });

      const ask = await Swal.fire({
        title: 'ยืนยันการรับคืนอุปกรณ์',
        html: htmlPreview,
        width: 1100,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'รับคืน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#03a9f4',
        cancelButtonColor: '#999',
        customClass: { popup: 'swal-equip-approve' },
        preConfirm: () => {
          const receiverRemark =
            document.getElementById('returnRemarkReceiver')?.value?.trim() || '';
          const status =
            document.querySelector('input[name="equipStatus"]:checked')?.value || 'good';
          // ✅ ไม่บังคับกรอกข้อความเมื่อเลือก "ไม่สมบูรณ์"
          return { status, finalRemark: receiverRemark };
        }
      });
      if (!ask.isConfirmed) {
        this.processingGroups.delete(group.booking_id);
        return;
      }

      // since/uptodate (ใช้จากรายการแรกที่มี)
      let since = null, uptodate = null;
      for (const item of group.items) {
        if (item.since && item.uptodate) { since = item.since; uptodate = item.uptodate; break; }
      }

      // === ทำ PDF (ช่องขวาจะใส่ชื่อ/วันที่ผู้รับคืน) ===
      const receiverRemark = ask.value.finalRemark || '';
      const pdfCtx = {
        ...ctx,
        handoverRemarkSender: ctx.handoverRemarkSender || '',
        handoverRemarkReceiver: receiverRemark,
        booking_id: group.booking_id,
        // ชื่อใต้เส้นจุดของ "ผู้ส่งมอบ" (จากครั้งส่งมอบเดิม)
        staffThaiName: ctx.handoverSenderName || (this.usersMap[this.userId] || ''),
        // ฝั่งผู้รับคืน
        handoverReceiverThaiName: receiverThaiName,
        handoverReceiverDate: receiverDateISO,
      };
      const pdfName = `handover_${(group.booking_id || 'single')}_${Date.now()}_returned.pdf`;
      const pdfHtml = buildEquipmentHandoverPDFHTML(pdfCtx);
      const pdfBlob = await _htmlToPdfBlob(pdfHtml, pdfName);
      const pdfUrl  = await _uploadPdfBlob(pdfBlob, pdfName);

      // ยิง PATCH คืนอุปกรณ์ให้ทุก item ในกลุ่ม พร้อมแนบลิงก์ PDF + ฟิลด์ใหม่
      await Promise.all(
        group.items.map(item =>
          axios.patch(`${API_BASE}/api/history/${item.id}/return`, {
            staff_id: staffId,
            status: ask.value.status,      // 'good' | 'bad'
            remark: receiverRemark,        // หมายเหตุผู้รับคืน
            attachment: item.attachment || item.returnPhoto || item.fileData,
            fileName: item.fileName,
            booking_id: item.booking_id || null,

            // ไฟล์ PDF ที่เพิ่งสร้าง
            bookingPdfUrl: pdfUrl,
            pdfFileName: pdfName,
            fileType: 'application/pdf',

            // ฟิลด์ฝั่งผู้รับคืน
            handoverReceiverThaiName: receiverThaiName,
            handoverReceiverDate: receiverDateISO,

            ...(since ? { since } : {}),
            ...(uptodate ? { uptodate } : {}),
          })
        )
      );

      // อัปเดต UI
      group.items.forEach(item => {
        item.status = 'Returned';
        if (since) item.since = since;
        if (uptodate) item.uptodate = uptodate;
      });

      await Swal.fire({
        title: 'สำเร็จ',
        text: 'รับคืนอุปกรณ์เรียบร้อย',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      this.fetchPendingEquipments?.();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'คืนอุปกรณ์ไม่สำเร็จ', 'error');
    } finally {
      this.processingGroups.delete(group.booking_id);
    }
    return; // ✅ จบเคสหลายวัน
  }

  // ==== เคสอื่น (single-day/ของเดิม) ====
  const itemWithPhoto = group.items.find(item => !!item.attachment || !!item.returnPhoto || !!item.fileData);
  const imgSrc =
    (itemWithPhoto && itemWithPhoto.returnPhoto) ||
    (itemWithPhoto && itemWithPhoto.attachment) ||
    (itemWithPhoto && itemWithPhoto.fileData);

  let photoHtml = '';
  if (imgSrc) {
    photoHtml = `
      <div style="text-align:center;margin-bottom:12px;">
        <img
          src="${imgSrc}"
          style="max-width:220px;max-height:170px;object-fit:contain;cursor:pointer;border-radius:10px;border:1.5px solid #bbb;"
          alt="รูปคืนอุปกรณ์"
          onclick="window.__showFullPhoto && window.__showFullPhoto()"
        />
        <div style="font-size:0.9em;color:#888;margin-top:0.4em;">คลิกที่รูปเพื่อดูแบบเต็มจอ</div>
      </div>`;
  } else {
    photoHtml = `<div style="text-align:center;color:#bbb;margin-bottom:12px;">ไม่มีรูปคืนอุปกรณ์แนบมา</div>`;
  }

  const { value: result } = await Swal.fire({
    title: 'ยืนยันการคืนอุปกรณ์ทั้งหมด?',
    html: `
      <div style="margin-bottom:8px;">
        ${photoHtml}
        <hr>
        คุณต้องการคืนอุปกรณ์ทั้งหมดนี้หรือไม่?<br>
        <span style="font-size:0.9em;color:#666;">(กรุณาเลือกสถานะและกรอกหมายเหตุ ถ้าหากอุปกรณ์ไม่สมบูรณ์)</span>
      </div>
      <div style="display:flex;justify-content:center;align-items:center;margin-bottom:8px;">
        <label style="margin-right:2em;"><input type="radio" name="equipStatus" value="good" checked> สมบูรณ์</label>
        <label><input type="radio" name="equipStatus" value="bad"> ไม่สมบูรณ์</label>
      </div>
      <div id="remarkBox" style="margin-top:1em; display:none; justify-content:center; align-items:center; width:100%;">
        <input id="remarkInput" class="swal2-input" placeholder="กรุณากรอกหมายเหตุ" />
      </div>`,
    icon: 'question',
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
        if (imgSrc) {
          const imgWin = window.open("", "_blank");
          imgWin.document.write(`
            <html><head><title>รูปคืนอุปกรณ์</title>
              <style>
                body { background:#111;margin:0;display:flex;align-items:center;justify-content:center;height:100vh;}
                img { max-width:100vw;max-height:100vh;object-fit:contain;border-radius:16px;box-shadow:0 8px 30px #0008;}
              </style></head>
              <body onclick="window.close()"><img src="${imgSrc}" alt="รูปคืนอุปกรณ์" /></body>
            </html>`);
        }
      };
      const radios = document.getElementsByName('equipStatus');
      radios.forEach(radio => {
        radio.addEventListener('change', () => {
          document.getElementById('remarkBox').style.display =
            radio.value === 'bad' && radio.checked ? 'flex' : 'none';
        });
      });
    },
    willClose: () => { window.__showFullPhoto = undefined; }
  });

  if (!result) {
    this.processingGroups.delete(group.booking_id);
    return;
  }

  // since/uptodate สำหรับ single/เดิม
  let since = null, uptodate = null;
  for (const item of group.items) {
    if (item.since && item.uptodate) { since = item.since; uptodate = item.uptodate; break; }
  }

  try {
    await Promise.all(
      group.items.map(item =>
        axios.patch(`${API_BASE}/api/history/${item.id}/return`, {
          staff_id: staffId,
          status: result.status,
          remark: result.remark,
          attachment: item.attachment || item.returnPhoto || item.fileData,
          fileName: item.fileName,
          booking_id: item.booking_id || null,
          ...(since ? { since } : {}),
          ...(uptodate ? { uptodate } : {}),
        })
      )
    );

    group.items.forEach(item => {
      item.status = 'Returned';
      if (since) item.since = since;
      if (uptodate) item.uptodate = uptodate;
    });

    Swal.fire({
      title: 'สำเร็จ',
      text: 'คุณได้คืนอุปกรณ์กลุ่มนี้แล้ว',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
    this.fetchPendingEquipments();
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'คืนอุปกรณ์ไม่สำเร็จ', 'error');
  } finally {
    this.processingGroups.delete(group.booking_id);
  }
},







    async fetchAllEquipments() {
  try {
    const res = await axios.get(`${API_BASE}/api/history`);
    const allList = res.data
      .filter(h => h.type !== 'field')
      .map(h => ({
        id: h._id?.$oid || h._id,
        name: h.name || "-",
        quantity: h.quantity || "-",
        user_id: h.user_id || "-",
        requester: h.requester || "-",
        date: h.date || "-",
        booking_id: h.booking_id || 'single_' + (h._id?.$oid || h._id),
        status: (h.status || "").toLowerCase(),
        agency: h.agency ?? "",
        since: h.since ?? null,
        uptodate: h.uptodate ?? null,
        updatedAt: h.updatedAt || h.updated_at || h.date || null,
        attachment: h.attachment || h.returnPhoto || null,
        fileName: h.fileName || null,
        type: h.type,

        approvedBy: h.approvedBy || h.approved_by || h.approvedStaffName || "",
        approvedById: h.approvedById || h.approved_by_id || h.approvedStaffId || "",
        approvedAt: h.approvedAt || h.approved_at || h.approvedDate || "",

        // ⬇️ ฟิลด์การส่งมอบ (เดิม)
        handoverById: h.handoverById || "",
        handoverBy: h.handoverBy || "",
        handoverAt: h.handoverAt || null,
        handoverRemarkSender: h.handoverRemarkSender || "",

        // ⬇️ ใหม่: ข้อมูลฝั่ง "ผู้รับคืน" (ช่องขวา)
        handoverRemarkReceiver: h.handoverRemarkReceiver || "",
        handoverReceiverThaiName: h.handoverReceiverThaiName || "",
        handoverReceiverDate: h.handoverReceiverDate || null,
      }));

    // group by booking_id
    const groups = {};
    allList.forEach(item => {
      const key = item.booking_id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    this.equipmentGroups = Object.entries(groups).map(([booking_id, items]) => ({
      booking_id,
      items
    }));
  } catch (err) {
    this.equipmentGroups = [];
    console.error('โหลดข้อมูล booking ไม่สำเร็จ:', err);
  }
},

    async fetchNotifications() {
  try {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // ✅ เก็บแค่ 7 วันล่าสุด

    // ล้างของเก่ากว่า 7 วัน ก่อน
    this.pruneOldNotifications();

    // ดึงงานที่ "รออนุมัติ" (สำหรับ staff)
    const res = await axios.get(`${API_BASE}/api/equipments/pending`);
    const data = Array.isArray(res.data) ? res.data : [];

    // คัดเฉพาะที่ยังไม่เคยแจ้ง (กันซ้ำด้วย lastCheckedIds)
    const fresh = data.filter(item => !this.lastCheckedIds.has(item._id?.$oid || item._id));

    if (fresh.length) {
      const newMessages = fresh.map(item => {
        const ts =
          item.updatedAt ? new Date(item.updatedAt).getTime() :
          item.createdAt ? new Date(item.createdAt).getTime() :
          item.date      ? new Date(item.date).getTime()      :
          Date.now();

        return {
          id: item._id?.$oid || item._id,
          type: 'pending',                       // สำหรับจัดสีสไตล์ ถ้าต้องการ
          timestamp: ts,
          message: `มีรายการ '${item.name}' ที่รออนุมัติ`,
        };
      });

      // รวม + กันซ้ำด้วย id + เรียงล่าสุดก่อน
      this.notifications = [...this.notifications, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp);

      // ตัดแจ้งเตือนที่เก่ากว่า 7 วันอีกรอบ (ป้องกันกรณี timestamp จาก backend เก่ามาก)
      this.pruneOldNotifications();

      // มาร์คว่าเคยเห็น item เหล่านี้แล้ว (กันเด้งซ้ำ)
      fresh.forEach(item => this.lastCheckedIds.add(item._id?.$oid || item._id));
    }

    // ✅ นับ unread เฉพาะที่ timestamp > lastSeenTimestamp (ข้ามหน้าเลขจะไม่กลับมา)
    this.unreadCount = this.notifications.filter(n => n.timestamp > this.lastSeenTimestamp).length;
  } catch (err) {
    // เงียบไว้เหมือนเดิม
  }
},

  },
  async mounted() {
  await this.fetchUsers();
  this.fetchAllEquipments();  // โหลดรอบแรกทันที
  this.lastSeenTimestamp = parseInt(localStorage.getItem('staff_lastSeenTimestamp') || '0');


  // ✅ โหลดข้อมูลใหม่ทุก 5 วินาที
  this.polling = setInterval(this.fetchAllEquipments, 5000);

  // ✅ โหลดประกาศ
  try {
    const annRes = await axios.get(`${API_BASE}/api/announcement`);
    this.announcement = annRes.data?.announce || "";
    this.showAnnouncementBar = !!this.announcement;
  } catch (err) {
    this.announcement = "";
    this.showAnnouncementBar = false;
  }

  // ✅ โหลดแจ้งเตือน
  this.fetchNotifications();
  this.pollingNotif = setInterval(this.fetchNotifications, 30000);

  window.addEventListener('resize', this.checkMobile);
},

  beforeUnmount() {
  clearInterval(this.polling);       // ✅ หยุด auto refresh
  clearInterval(this.pollingNotif);  // ✅ หยุดเช็คแจ้งเตือน
  window.removeEventListener('resize', this.checkMobile);
  },
}

// ====== HTML พรีวิวแบบเดียวกับหน้า approve_field (อุปกรณ์) ======

function buildEquipmentApprovePreviewHTML(ctx) {
  const esc = s => String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  const todayStr = new Intl.DateTimeFormat('th-TH-u-nu-latn', {
    timeZone: 'Asia/Bangkok', day:'2-digit', month:'2-digit', year:'numeric'
  }).format(new Date());

  const splitRange = (s) => {
    if (!s) return ['-', '-'];
    const p = String(s).split(' - ');
    return [p[0] || '-', p[1] || '-'];
  };
  const [sinceStr, uptoStr] = splitRange(ctx.dateRange);

  const rows = (ctx.rows || []).map((r,i)=>`
    <tr>
      <td class="c">${r.idx ?? (i+1)}</td>
      <td class="l">${esc(r.name)}</td>
      <td class="c">${esc(r.quantity)}</td>
      <td class="l">${esc(r.remark || '-')}</td>
    </tr>`).join('');

  return `
  <div class="eqp-preview">
    <div class="eqp-head">
      <div class="t1">แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</div>
      <div class="t2">โทร 0-5391-7820 และ 0-5391-7821 | E-mail: sport-complex@mfu.ac.th</div>
    </div>

    <div class="eqp-meta">
      <div class="right">
        <div>ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</div>
        <div>วันที่ทำรายการ ${esc(ctx.dateBorrow)}</div>
        <div>เวลาที่ทำรายการ ${esc(ctx.timeBorrow)}</div>
      </div>
    </div>

    <div class="date" style="margin-top:30px">วันที่ ${todayStr}</div>
    <div style="margin-top:20px">ส่วนที่1 สำหรับผู้ขอใช้บริการ</div>

    <section class="eqp-section eqp-section--par">
      <div class="eqp-par">
        ข้าพเจ้า ${esc(ctx.requester)}
       รหัสนักศึกษา/รหัสพนักงาน ${esc(ctx.requesterId)}
        ${ctx.tel ? 'โทร ' + esc(ctx.tel) : ''}
        มีความประสงค์ขอยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ของศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง
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
        <div class="date">วันที่ ${todayStr}</div>
      </div>

      <div class="eqp-boxes">
        <!-- กล่องซ้าย ผู้ส่งมอบ -->
        <div class="box">
          <div class="title">ผลการดำเนินการ/ผลการปฏิบัติงาน</div>
          <textarea id="handoverRemark1"
                    class="eqp-textarea"
                    rows="4"
                    placeholder="พิมพ์ผลการดำเนินการ/ผลการปฏิบัติงาน (ผู้ส่งมอบ) ที่นี่..."></textarea>

          <div class="sign-inline" style="margin-top:8px;">
            <span class="lab">ลงชื่อ</span>
            <span class="dotfill"><span class="filltext">${esc(ctx.staffThaiName || '')}</span></span>
            <span class="role">ผู้ส่งมอบ</span>
          </div>
          <div class="date">วันที่ ${todayStr}</div>
        </div>

        <!-- กล่องขวา ผู้รับคืน (พิมพ์ไม่ได้) -->
        <div class="box">
          <div class="title">ผลการดำเนินการ/ผลการปฏิบัติงาน</div>
          <textarea id="handoverRemark2"
                    class="eqp-textarea"
                    rows="4"
                    placeholder="พิมพ์ผลการดำเนินการ/ผลการปฏิบัติงาน (ผู้รับคืน) ที่นี่..."
                    readonly></textarea>

          <div class="sign-inline" style="margin-top:8px;">
            <span class="lab">ลงชื่อ</span>
            <span class="dotfill"></span>
            <span class="role">ผู้รับคืน</span>
          </div>
          <div class="date">วันที่........../........../..........</div>
        </div>
      </div>

      <div style="margin-top:20px">
        *หมายเหตุ หากอุปกรณ์/วัสดุ/ครุภัณฑ์ เกิดการชำรุดเสียหายในระหว่างที่ผู้ยืมเป็นผู้รับผิดชอบ
        ผู้ยืมจะต้องชดใช้ค่าเสียหายที่เกิดขึ้นทั้งหมด
      </div>
    </div>
  </div>`;
}

function buildEquipmentReturnPreviewHTML(ctx) {
  const esc = s => String(s ?? '-')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  const todayStr = new Intl.DateTimeFormat('th-TH-u-nu-latn', {
    timeZone: 'Asia/Bangkok', day:'2-digit', month:'2-digit', year:'numeric'
  }).format(new Date());

  const handoverDateStr = ctx.handoverAt
    ? new Intl.DateTimeFormat('th-TH-u-nu-latn', {
        timeZone: 'Asia/Bangkok', day:'2-digit', month:'2-digit', year:'numeric'
      }).format(new Date(ctx.handoverAt))
    : '........../........../..........';

  const splitRange = (s) => {
    if (!s) return ['-', '-'];
    const p = String(s).split(' - ');
    return [p[0] || '-', p[1] || '-'];
  };
  const [sinceStr, uptoStr] = splitRange(ctx.dateRange);

  const rows = (ctx.rows || []).map((r,i)=>`
    <tr>
      <td class="c">${r.idx ?? (i+1)}</td>
      <td class="l">${esc(r.name)}</td>
      <td class="c">${esc(r.quantity)}</td>
      <td class="l">${esc(r.remark || '-')}</td>
    </tr>`).join('');

  return `
  <div class="eqp-preview">
    <div class="eqp-head">
      <div class="t1">แบบฟอร์มการยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</div>
      <div class="t2">โทร 0-5391-7820 และ 0-5391-7821 | E-mail: sport-complex@mfu.ac.th</div>
    </div>

    <div class="eqp-meta">
      <div class="right">
        <div>ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</div>
        <div>วันที่ทำรายการ ${esc(ctx.dateBorrow)}</div>
        <div>เวลาที่ทำรายการ ${esc(ctx.timeBorrow)}</div>
      </div>
    </div>

    <div class="date" style="margin-top:30px">วันที่ ${todayStr}</div>
    <div style="margin-top:20px">ส่วนที่1 สำหรับผู้ขอใช้บริการ</div>

    <section class="eqp-section eqp-section--par">
      <div class="eqp-par">
        ข้าพเจ้า ${esc(ctx.requester)}
        รหัสนักศึกษา/รหัสพนักงาน ${esc(ctx.requesterId)}
        ${ctx.tel ? 'โทร ' + esc(ctx.tel) : ''}
        มีความประสงค์ขอยืมอุปกรณ์/วัสดุ/ครุภัณฑ์ ของศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง
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
      <!-- ลงชื่อผู้ยืม -->
      <div class="eqp-sign">
        <div class="sig sig-line">
          <span class="lab">ลงชื่อ</span>
          <span class="line"><span class="name">${esc(ctx.requester)}</span></span>
          <span class="role">ผู้ยืม</span>
        </div>
        <div class="date">วันที่ ${todayStr}</div>
      </div>

      <div class="eqp-boxes">
        <!-- ซ้าย: ผู้ส่งมอบ (อ่านอย่างเดียว) -->
        <div class="box">
          <div class="title">ผลการดำเนินการ/ผลการปฏิบัติงาน (ผู้ส่งมอบ)</div>
          <div class="eqp-textarea" style="white-space:pre-wrap;background:#f5f6fa;color:#333;cursor:not-allowed;">
            ${esc(ctx.handoverRemarkSender || '')}
          </div>
          <div class="sign-inline" style="margin-top:8px;">
            <span class="lab">ลงชื่อ</span>
            <span class="dotfill"><span class="filltext">${esc(ctx.handoverSenderName || '')}</span></span>
            <span class="role">ผู้ส่งมอบ</span>
          </div>
          <div class="date">วันที่ ${handoverDateStr}</div>
        </div>

        <!-- ขวา: ผู้รับคืน (พิมพ์ได้) -->
        <div class="box">
          <div class="title">ผลการดำเนินการ/ผลการปฏิบัติงาน (ผู้รับคืน)</div>
          <textarea id="returnRemarkReceiver"
                    class="eqp-textarea"
                    rows="4"
                    placeholder="พิมพ์ผลการดำเนินการ/ปัญหาขณะรับคืน ฯลฯ..."></textarea>
          <div class="sign-inline" style="margin-top:8px;">
            <span class="lab">ลงชื่อ</span>
            <span class="dotfill"><span class="filltext">${esc(ctx.receiverThaiName || '')}</span></span>
            <span class="role">ผู้รับคืน</span>
          </div>
          <div class="date">วันที่ ${todayStr}</div>
        </div>
      </div>

      <!-- ตัวเลือกสถานะความสมบูรณ์ (ไม่มีช่องกรอกรายละเอียดแล้ว) -->
      <div id="returnStatusBox" style="margin-top:14px; text-align:center;">
        <label style="margin-right:2em;">
          <input type="radio" name="equipStatus" value="good" checked> สมบูรณ์
        </label>
        <label>
          <input type="radio" name="equipStatus" value="bad"> ไม่สมบูรณ์
        </label>
      </div>
    </div>
  </div>`;
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
  grid-template-columns: 200px 80px auto;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
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
.status-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.approve-btn {
  padding: 4px 10px;
  background-color: #2baf2b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: background-color 0.3s;
}
.approve-btn:hover {
  background-color: #42bd41;
}
.cancel-btn {
  padding: 4px 10px;
  background-color: #e84e40;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: background-color 0.3s;
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

/* Animation แถบประกาศ slide down */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  transform: translateY(0%);
  opacity: 1;
}

/* ตัวแถบประกาศ */
.announcement-bar {
  display: flex;
  align-items: center;  
  gap: 1.2rem;
  width: 100%;
  max-width: 900px; 
  margin: 12px auto;
  background: #ffeaeac8; /* ชมพูอ่อนแบบ danger alert */
  color: #e53e3e;      /* ฟอนต์แดง */
  font-size: 1.15rem;
  font-weight: 500;
  border-radius: 12px;
  padding: 1rem 2rem;
   box-shadow: 0 4px 18px rgba(255, 80, 80, 0.13);
  border: 1.5px solid #fdb6b6;
  position: sticky;
  top: 60px;                  /* ระยะห่างจากขอบบน ปรับให้เท่ากับความสูง navbar */
  z-index: 900;               /* ให้อยู่เหนือเนื้อหา แต่ต่ำกว่า navbar */
}
.announcement-icon {
  width: 34px;
  height: 34px;
  min-width: 34px;
  min-height: 34px;
  background: #ff5a5f;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 7px;
  box-shadow: 0 1px 5px #ffbfc1a0;
  flex-shrink: 0;
}
.announcement-icon i {
  color: #fff !important;
  font-size: 1.3rem !important;
  margin-top: 1px;
}


.announcement-bar-text {
  flex: 1;
  display: flex;
  align-items: center;
  word-break: break-word;
   gap: 0.8rem;
  white-space: pre-wrap;   /* อันนี้สำคัญ */
  overflow-wrap: anywhere;
  font-size: 1.07rem;
  font-weight: 500;
  color: #e53e3e; /* ฟอนต์แดง */
}
.close-announcement-btn {
  margin-left: 12px;
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s;
  display: flex;
  align-items: center;
}
.close-icon {
  width: 32px;
  height: 32px;
  background: #ffe0e3; /* วงกลมจางๆ */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  box-shadow: 0 1px 6px #f6b4b833;
}

.close-icon i {
  color: #e53e3e !important;
  font-size: 1.28rem !important;
}

.close-announcement-btn:hover .close-icon {
  background: #ffd1d7;
  /* สามารถปรับเฉดเมื่อ hover */
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
  z-index: 1400;
}
.notification-dropdown {
  z-index: 1500;
}

.table-container {
  padding: 0 70px;
  overflow-x: auto;
}
.equipment-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.equipment-table th, .equipment-table td {
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}
.equipment-table th {
  background: #1e3a8a;
  color: #fff;
  font-weight: bold;
}
.equipment-table tr:last-child td {
  border-bottom: none;
}

.return-btn {
  padding: 4px 10px;
  background-color: #03a9f4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: background-color 0.3s;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.return-btn:hover{
  background-color: #0277bd;
}

.status-bg {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 8px;
}
.status-approved {
  background: #d0f8ce!important;    /* ฟ้าอ่อน */
  color: #259b24!important;         /* ฟ้าเข้ม */
  border: 1.5px solid #90caf9;
  border-radius: 20px;
  font-weight: bold;
  padding: 2px 18px;
  display: inline-block;
  min-width: 110px;
  text-align: center;
}

.status-returned {
  background: #e3f2fd !important;    /* ฟ้าอ่อน */
  color: #1565c0 !important;         /* น้ำเงินเข้ม */
  border: 1.5px solid #64b5f6;
  border-radius: 20px;
  font-weight: bold;
  padding: 2px 18px;
  display: inline-block;
  min-width: 110px;
  text-align: center;
}

.status-disapproved {
  background: #fff3cd !important;    /* เหลืองอ่อน */
  color: #e84e40 !important;         /* แดง/ส้ม */
  border: 1.5px solid #ffe082;
  border-radius: 20px;
  font-weight: bold;
  padding: 2px 18px;
  display: inline-block;
  min-width: 110px;
  text-align: center;
}

.status-pending {
  background: #e3f2fd !important;    /* ฟ้าอ่อน */
  color: #1976d2 !important;         /* ฟ้าเข้ม */
  border: 1.5px solid #90caf9;
  border-radius: 20px;
  font-weight: bold;
  padding: 2px 18px;
  display: inline-block;
  min-width: 110px;
  text-align: center;
}

.status-return-pending {
  background: #f6d365 !important; /* สีเหลืองจางๆ สำหรับ return-pending */
}

.approve-btn[disabled],
.cancel-btn[disabled]{
  opacity: .6;
  cursor: not-allowed;
}


</style>

<style>
@import '../css/style.css';

/* ===== SweetAlert เฉพาะหน้า approve_equipment ===== */
.equip-swal.swal2-popup{
  width: clamp(860px, 84vw, 1285px);
  max-width: 96vw;
  padding: 22px 24px 18px;
}
.equip-swal .swal2-html-container{
  text-align: left !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* ตารางใน SweetAlert */
.equip-swal .equip-table-wrap{
  max-width: 100%;
  max-height: 72vh;
  overflow: auto;
  padding-top: 6px;
}
.equip-swal .equip-table{
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;   /* ให้คอลัมน์ยืดหยุ่น */
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}
.equip-swal .equip-table thead th{
  background: #1e3a8a;
  color: #fff;
  font-weight: 700;
  padding: 10px 8px;
  text-align: center;
  position: sticky; top: 0; z-index: 1;
}
.equip-swal .equip-table td{
  padding: 8px 10px;
  border-bottom: 1px solid #e6e9f3;
  vertical-align: top;
  font-size: 0.95rem;
  white-space: normal;
  word-break: break-word;
}
.equip-swal .equip-table tbody tr:hover{
  background: #f7f9ff;
}
.equip-swal .td-center{ text-align: center; }

/* รูป thumbnail */
.equip-swal .equip-thumb{
  max-width: 120px;
  max-height: 85px;
  object-fit: contain;
  border: 1px solid #cfd5e6;
  border-radius: 8px;
  cursor: pointer;
  display: inline-block;
}
.equip-swal .equip-thumb-hint{
  font-size: 0.8rem;
  color: #8a8fa3;
  margin-top: 4px;
}

/* กัน "ลำดับ" ตกบรรทัด + กำหนดความกว้างขั้นต่ำของคอลัมน์แรก */
.equip-swal .equip-table thead th:first-child,
.equip-swal .equip-table tbody td:first-child {
  white-space: nowrap;     /* ไม่ตัดบรรทัด */
  min-width: 64px;         /* กันบีบจนต้องตัด */
}

/* ถ้าตารางยังบีบมาก ให้ลด padding เฉพาะหัวคอลัมน์แรกนิดหน่อย */
.equip-swal .equip-table thead th:first-child {
  padding-left: 6px;
  padding-right: 6px;
}
/* ✅ ขยายและจัดกลางช่องกรอกหมายเหตุใน SweetAlert */
/* กล่องครอบช่องกรอกให้กินเต็มความกว้างของ popup */
.equip-swal #remarkBox{
  width: 100%;
  padding: 0 16px;          /* กันชิดขอบนิดนึง */
  box-sizing: border-box;
  gap: 8px;
}

/* ขยาย input ให้เต็มความกว้างของ #remarkBox */
.equip-swal #remarkInput.swal2-input{
  width: 100% !important;
  max-width: 100% !important;  /* เดิมเป็น 720px */
  min-width: 0 !important;
  margin: 0 auto !important;
  flex: 1 1 auto;              /* เผื่ออยู่ใน flex container */
}

/* หน้าจอเล็กก็ยังเต็ม กว้างพอดี */
@media (max-width: 640px){
  .equip-swal #remarkInput.swal2-input{
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
  }
}


/* แสดง form ในปุ่มส่งมอบ */
/* ==== SweetAlert preivew ของ "ส่งมอบ" ให้เหมือน approve_field ==== */
.swal2-popup.swal-equip-approve{
  max-width:1100px !important;
  width:auto !important;
  padding:26px !important;
}

/* โครงฟอร์มอุปกรณ์ */
.eqp-preview{ font-family:'THSarabunNew','Sarabun','Noto Sans Thai', system-ui, sans-serif; color:#111; }
.eqp-head{ text-align:center; margin-bottom:18px; }
.eqp-head .t1{ font-weight:700; font-size:20px; }
.eqp-head .t2{ font-size:14px; margin-top:2px; }
.eqp-meta{ display:flex; justify-content:flex-end; margin:18px 0 12px; }
.eqp-meta .right{ text-align:right; line-height:1.55; }

.eqp-par{ font-size:16px; line-height:1.75; text-indent:2em; word-break:break-word; margin:12px 0 18px; }

/* ตาราง */
.eqp-table{ width:100%; border-collapse:collapse; table-layout:fixed; font-size:15px; margin:14px 0 22px; }
.eqp-table thead th{
  background:#213555; color:#fff; border:1px solid #e6e9f2; padding:10px 14px; text-align:center; font-weight:700;
  position:sticky; top:0; z-index:1;
}
.eqp-table tbody td{ border:1px solid #e6e9f2; padding:10px 14px; vertical-align:top; }
.eqp-table td.c{ text-align:center; }
.eqp-table td.l{ text-align:left; overflow:visible !important; text-overflow:clip !important; }
.eqp-table th, .eqp-table td{ white-space:normal !important; word-break:break-word !important; overflow-wrap:anywhere !important; }

/* ลายเซ็น + กล่อง */
.eqp-sign{ margin:16px 0 6px; display:flex; flex-direction:column; align-items:flex-end; text-align:right; }
.eqp-sign .sig-line{ display:grid; grid-template-columns:auto 240px auto; align-items:center; column-gap:8px; }
.eqp-sign .sig-line .line{ height:1.2em; border-bottom:1px dotted #666; display:flex; align-items:flex-end; justify-content:center; }
.eqp-sign .sig-line .name{ padding:0 6px; background:transparent; }
.eqp-sign .date{ margin-top:6px; }

.eqp-boxes{ display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px; margin-top:18px; }
.eqp-boxes .box{ border:1px solid #333; padding:12px 14px; min-height:176px; }
.eqp-boxes .title{ font-weight:700; text-align:center; padding-bottom:6px; margin-bottom:10px; border-bottom:1px solid #9aa3b2; }
.eqp-boxes .dotrow{ height:1.2em; border-bottom:1px dotted #666; margin:10px 0; }
.eqp-boxes .sign-inline{ display:grid; grid-template-columns:auto 1fr auto; column-gap:8px; align-items:center; margin-top:6px; }
.eqp-boxes .dotfill{ height:1.2em; border-bottom:1px dotted #666; }
.eqp-boxes .date{ text-align:center; margin-top:8px; }

.eqp-textarea{
  width:100%;
  min-height:96px;
  padding:8px 10px;
  border:1px solid #cfd5e6;
  border-radius:8px;
  font-size:15px;
  line-height:1.5;
  resize:vertical;
  outline:none;
  background:#fff;
}
.eqp-textarea:focus{
  border-color:#213555;
  box-shadow:0 0 0 2px rgba(33,53,85,.12);
}

/* พื้นหลังเทา+ห้ามพิมพ์ของ textarea ขวา */
.eqp-textarea[readonly]{
  background:#f5f6fa;
  color:#666;
  cursor:not-allowed;
}

/* ข้อความชื่อที่แสดงบนเส้นจุด */
.eqp-boxes .dotfill .filltext{
  display:inline-block;
  padding:0 4px;
}

.eqp-boxes .sign-inline .dotfill{
  display: flex;               /* เปลี่ยนจากค่าเดิมให้เป็น flex */
  align-items: flex-end;       /* ชิดเส้นล่าง */
  justify-content: center;     /* ⬅️ จัดกลางแนวนอน */
}

.eqp-boxes .sign-inline .dotfill .filltext{
  background: #fff;            /* กลบรอยเส้นปะใต้ตัวอักษรให้ชัด */
  padding: 0 4px;
  line-height: 1;
}

.swal-equip-approve .eqp-boxes .eqp-textarea{
  height: 140px !important;     /* ปรับเลขได้ตามต้องการ */
  min-height: 140px !important;
  resize: none;                  /* กันไม่ให้ลากแล้วสูงไม่เท่ากัน */
}





</style>