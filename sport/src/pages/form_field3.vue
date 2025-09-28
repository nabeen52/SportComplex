<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ closed: isSidebarClosed }">
      <div class="sidebar-header">
        <img src="/img/logo.png" alt="logo" class="logo" />
        <p class="sidebar-title">Sport Complex MFU</p>
      </div>
      <nav class="nav-links">
        <router-link to="/home_user" exact-active-class="active">
          <i class="pi pi-home"></i> Home
        </router-link>
        <router-link to="/booking_field" active-class="active">
          <i class="pi pi-map-marker"></i> Field
        </router-link>
        <router-link to="/booking_equipment" active-class="active">
          <i class="pi pi-box"></i> Equipment
        </router-link>
        <router-link to="/history" active-class="active">
          <i class="pi pi-history"></i> History
        </router-link>
      </nav>
    </aside>

    <div v-if="!isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>

    <!-- Main Content -->
    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
        <button class="menu-toggle" @click="toggleSidebar">☰</button>
        <div class="topbar-actions">
          <div>
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
                  :class="['notification-item', noti.type || '', { unread: idx === 0 }]"
                >
                  {{ noti.message }}
                </li>
                <li v-if="notifications.length === 0" class="no-noti">ไม่มีแจ้งเตือน</li>
              </ul>
            </div>
          </div>
          <router-link to="/cart" class="cart-link">
            <i class="pi pi-shopping-cart"></i>
            <span v-if="products.length > 0" class="badge">{{ products.length }}</span>
          </router-link>
          <router-link to="/profile"><i class="pi pi-user"></i></router-link>
        </div>
      </header>

      <!-- Stepper -->
      <div class="headStepper">
        <div class="stepper">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="step"
          >
            <div
              class="circle"
              :class="{ active: index === currentStep, completed: index < currentStep }"
              @click="goStep(index)"
              :style="{ cursor: canStepTo(index) ? 'pointer' : 'not-allowed', opacity: canStepTo(index) ? 1 : 0.5 }"
            ></div>
            <div class="label">{{ step }}</div>
            <div
              v-if="index < steps.length - 1"
              class="line"
              :class="{ filled: index < currentStep }"
            ></div>
          </div>
        </div>
      </div>

      <div class="scroll-x-container">
        <!-- Confirm Form -->
        <div class="form-container">
          <h1 class="title">ยืนยันข้อมูล</h1>
          <div id="pdf-section">
            <section id="uniform-lines">
            <div class="form-header">
              <h3>แบบฟอร์มขออนุมัติใช้สถานที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h3>
              <p><b>โทร: 0-5391-7820 และ 0-5391-7821 | E-mail: sport-complex@mfu.ac.th</b></p>
            </div>

            <!-- Header Info -->
            <div class="info-left">
              <span class="bold">ที่ อว.</span>
              <span class="line-field single-line">{{ info.aw }}</span>
              <span class="bold" style="margin-left: 50px;">วันที่</span>
              <span class="line-field single-line">{{ formatDateOnly(info.date) }}</span>
              <span class="bold" style="margin-left: 50px;">โทร</span>
              <span class="line-field single-line">{{ info.tel }}</span>
            </div>

            <!-- Detail Content -->
            <div class="form-row mt-15" style="margin-left: 0;">
              <span class="bold">เรื่อง</span><span>ขออนุมัติใช้สถานที่</span>
            </div>
            <div class="form-row mt-15" style="margin-left: 0px;">
              <span class="bold">เรียน</span><span>หัวหน้าศูนย์กีฬาฯ</span>
            </div>

            <div class="form-row mt-15" style="text-indent: 80px; text-align: left; line-height: 2.0;">
              ด้วย {{ info.agency }}
              จะดำเนินกิจกรรม/โครงการ {{ info.name_activity }}
              เหตุผลในการขอใช้เพื่อ {{ info.reasons }}
              ในวันที่ {{ formatDateOnly(info.since) }} ถึงวันที่ {{ formatDateOnly(info.uptodate) }}
              ช่วงเวลา {{ formatTimeTH(info.since_time) }} ถึงเวลา {{ formatTimeTH(info.until_thetime) }}
              จำนวนผู้เข้าร่วม {{ info.participants }} คน
              และเพื่อให้การดำเนินงานเป็นไปด้วยความเรียบร้อย จึงเรียนมาเพื่อขออนุมัติ ดังนี้
            </div>

         <!-- === Uniform spacing start (ข้อ 1 → หมายเหตุการแนบเอกสาร) === -->


  <!-- ข้อ 1 -->
<div class="form-row bold" style="margin-left: 0;">
  <span>1. ขออนุมัติใช้สถานที่</span>
</div>

<table class="util-table util-colon-align" style="margin-left:80px;">
  <colgroup>
    <col class="c-label" />
    <col class="c-colon" />
    <col />
  </colgroup>
  <tr>
    <td class="util-label">อาคาร</td>
    <td class="colon">:</td>
    <td class="restroom-text">
      {{ info.building && info.building.trim() !== '' ? info.building : '-' }}
    </td>
  </tr>
  <tr>
    <td class="util-label">พื้นที่/ห้อง</td>
    <td class="colon">:</td>
    <td class="restroom-text">
      {{ info.zone && info.zone.trim() !== '' ? info.zone : '-' }}
    </td>
  </tr>
</table>


<!-- ข้อ 2 -->
<!-- ข้อ 2 -->
<div class="form-row util-header" style="margin-left:0;">
  <span class="bold">2. ขออนุมัติใช้ระบบสาธารณูปโภค</span>

  <div class="util-choose">
    <span :class="['radio-print', { on: isYes(info.utilityRequest) }]"></span>
    <label style="margin-right: 18px;">เลือก</label>
    <span :class="['radio-print', { on: isNo(info.utilityRequest) }]"></span>
    <label>ไม่เลือก</label>
  </div>
</div>

<div v-if="isYes(info.utilityRequest)" class="util-wrap" style="margin-left:80px;">
  <table class="util-table util-colon-align">
    <colgroup>
      <col class="c-label" />
      <col class="c-colon" />
      <col class="c-time" />
      <col class="c-sep" />
      <col class="c-time" />
    </colgroup>

    <!-- 2.1 -->
   <tr>
  <td class="util-label">2.1 ไฟฟ้าส่องสว่าง</td>
  <td class="colon">:</td>
  <td class="time"><span class="since">ตั้งแต่</span> {{ formatTimeTH(info.turnon_lights) }}</td>
  <td class="sep"> - </td>
  <td class="time">{{ formatTimeTH(info.turnoff_lights) }}</td>
</tr>


    <!-- 2.2 ห้องสุขา -->
    <tr>
      <td class="util-label">2.2 ห้องสุขา</td>
      <td class="colon">:</td>
      <td class="restroom-text" colspan="3">
        {{ isYes(info.restroom) ? 'ต้องการใช้งาน' : (isNo(info.restroom) ? 'ไม่ต้องการใช้งาน' : '-') }}
      </td>
    </tr>
  </table>
</div>



  <div class="note-line">
    <span style="font-weight:bold; font-size: 15px;">
      *ต้องได้รับการอนุมัติจากรองอธิการบดีผู้กำกับดูแล และสำเนาเอกสารถึงฝ่ายอนุรักษ์พลังงาน
    </span>
  </div>

  <!-- ข้อ 3 -->
  <div class="form-row bold" style="margin-left: 0;">
    <span>3. ขออนุมัติรายการประกอบอาคาร</span>
    <span :class="['radio-print', { on: isYes(info.facilityRequest) }]" style="margin-left:8px;"></span>
    <label style="margin-right: 18px;">เลือก</label>
    <span :class="['radio-print', { on: isNo(info.facilityRequest) }]"></span>
    <label>ไม่เลือก</label>
  </div>

  <div v-if="isYes(info.facilityRequest)">
    <div class="form-row block-row" style="margin-left: 80px;">
      <span style="white-space: nowrap;">3.1 ดึงอัฒจันทร์ภายในอาคารเฉลิมพระเกียรติฯ :</span>
      <span class="line-field block-text force-inline">{{ info.amphitheater && info.amphitheater.trim() !== '' ? info.amphitheater : '-' }}</span>
    </div>
    <div class="form-row block-row" style="margin-left: 80px;">
      <span style="white-space: nowrap;">3.2 อุปกรณ์กีฬา (โปรดระบุรายการและจำนวน) :</span>
      <span class="line-field block-text force-inline">{{ info.need_equipment && info.need_equipment.trim() !== '' ? info.need_equipment : '-' }}</span>
    </div>
  </div>

  <div class="note-line">
    <span style="font-weight:bold; font-size: 15px;">
      ทั้งนี้ต้องแนบเอกสารโครงการหรือกิจกรรมที่ได้รับการอนุมัติแล้วพร้อมกำหนดการจัดกิจกรรม
    </span>
  </div>
  <div class="note-line">
    <span style="font-weight:bold; font-size: 15px;">
      หากเป็นการเรียนการสอน ต้องแนบตารางการเรียนการสอน (Class schedule) พร้อมทั้งรายชื่อนักศึกษา
    </span>
  </div>

</section>
<!-- === Uniform spacing end === -->


           <!-- ตารางเซ็นชื่อ (เหลือ 1 ช่อง: นักศึกษา/ผู้รับผิดชอบ ชิดขวา) -->
<table class="sign-header-table single-right">
  <tbody>
    <tr>
      <td>

        <div class="sig-box">
  <!-- sign-line คงเดิม -->
  <div class="sign-line">
    <span class="sign-text">ลงชื่อ</span>
    <div class="signature-wrap">
      <template v-if="signatureUrl">
        <img :src="signatureUrl" alt="ลายเซ็น" class="signature-img" crossorigin="anonymous" @error="signatureUrl = ''" />
      </template>
      <template v-else>
        <span class="dot-line-inline">......................................</span>
      </template>
    </div>
    <span aria-hidden="true"></span>
  </div>

  <!-- ▼ ใช้บล็อคแทน <br /> เพื่อคุมระยะ -->
  <div class="sig-under">
    <div class="sig-name" style="padding-bottom: 8px;">( {{ info.proxyStudentName || info.username_form || '-' }} )</div>
    <div class="sig-role" style="padding-bottom: 8px;">ผู้รับผิดชอบ</div>
    <div class="sig-date">{{ nowTH }}</div>
  </div>
</div>

      </td>
    </tr>
  </tbody>
</table>



          <!-- ตารางเซ็นชื่อ 2 ช่อง (ด้านล่าง) -->
<div class="avoid-break">
  <div class="form-row" style="padding-top:10px;">
    <table class="approval-sign-table avoid-break two-cols">
      <thead>
        <tr>
          <th>1. เลขานุการศูนย์กีฬาฯ</th>
          <th>2. หัวหน้าศูนย์กีฬาฯ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <!-- กล่องที่ 1: เลขานุการศูนย์กีฬาฯ -->
          <td>
            <div class="td-inner">
             <div class="checkbox-line">
  <span class="box-print"></span>      <!-- เดิม: radio-print -->
  <label>เรียน หัวหน้าศูนย์กีฬาฯ</label>
</div>
<div class="checkbox-line">
  <span class="box-print"></span>      <!-- เดิม: radio-print -->
  <label>อื่นๆ</label>
  <span class="dot-line dot-line-custom"></span>
</div>

              <div class="line-row"><span class="dot-line"></span></div>
              <div class="line-row">(<span class="dot-line"></span>)</div>
              <div class="date-row">วันที่ ............/............/............</div>
            </div>
          </td>

          <!-- กล่องที่ 2: หัวหน้าศูนย์กีฬาฯ -->
          <td>
            <div class="td-inner">
            <!-- กล่องที่ 2: หัวหน้าศูนย์กีฬาฯ -->
<div class="checkbox-line">
  <span class="box-print"></span>      <!-- เดิม: radio-print -->
  <label>เห็นชอบ</label>
</div>
<div class="checkbox-line">
  <span class="box-print"></span>      <!-- เดิม: radio-print -->
  <label>อื่นๆ</label>
  <span class="dot-line dot-line-custom"></span>
</div>

              <div class="line-row"><span class="dot-line"></span></div>
              <div class="line-row">(<span class="dot-line"></span>)</div>
              <div class="date-row">วันที่ ............/............/............</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>


            <div style="margin-top:12px;">
              <span style="font-weight:bold; font-size: 15px;">
                หมายเหตุ: ให้นักศึกษา/ผู้รับผิดชอบแนบเอกสารโครงการหรือกำหนดการเพื่อประกอบการพิจารณา
              </span>
            </div>
</div>
            <!-- โชว์ไฟล์แนบ -->
            <div v-if="fileAttachments && fileAttachments.length > 0" class="form-row mt-30">
              <span>ไฟล์แนบ</span>
              <div class="attached-files-list">
                <div
                  v-for="(file, idx) in fileAttachments"
                  :key="idx"
                  class="attached-file-item"
                >
                  <a
                    :href="file.url"
                    target="_blank"
                    :download="file.fileName"
                  >
                    {{ file.fileName || 'ไฟล์แนบ' }}
                  </a>
                  <span v-if="file.size" style="color: #888; font-size:12px; margin-left:8px;">
                    ({{ file.size }} KB)
                  </span>
                </div>
              </div>
            </div>

            <div class="button-wrapper mt-30">
              <button id="btnBack" @click="goBack">Back</button>
              <button id="btnNext" @click="handleNext">Next</button>
            </div>
          </div>
        
      </div>

      <!-- Footer (moved inside .main) -->
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

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick  } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'
import html2pdf from 'html2pdf.js'

const API_BASE = import.meta.env.VITE_API_BASE


/* === helper: ตรวจ yes/no รองรับหลายรูปแบบ === */
const norm = v => (v ?? '').toString().trim().toLowerCase()
const YES_TOKENS = ['yes','เลือก','ต้องการ','true','1']
const NO_TOKENS  = ['no','ไม่เลือก','ไม่ต้องการ','false','0']
const isYes = v => YES_TOKENS.includes(norm(v))
const isNo  = v => NO_TOKENS.includes(norm(v))

// --------------- แจ้งเตือน -----------------
const showNotifications = ref(false)
const notifications = ref([])
const products = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const lastCheckedIds = new Set()
const lastSeenTimestamp = ref(parseInt(localStorage.getItem('lastSeenTimestamp') || '0'))
let polling = null

const signatureUrl = ref('')  // URL รูปลายเซ็นของผู้ยื่น

const REQUIRED_APPROVAL_ROLES = ['admin', 'super'];

function buildInitialStep(existingStep) {
  if (Array.isArray(existingStep) && existingStep.length > 0) {
    return existingStep.map(s => ({
      role: String(s?.role || '').toLowerCase(),
      action: (typeof s?.action === 'boolean') ? s.action : null
    })).filter(s => s.role); // กัน null/ค่าว่าง
  }
  return REQUIRED_APPROVAL_ROLES.map(r => ({ role: r, action: null }));
}

// แปลง path เป็น URL สมบูรณ์ (เหมือนหน้า approve_field)
function toAbsUrl(p) {
  if (!p) return ''
  const s = String(p)
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('/')) return `${API_BASE}${s}`
  return `${API_BASE}/${s}`
}

const todayTH = ref('')

function getTodayTH() {
  const now = new Date()
  const d = String(now.getDate()).padStart(2, '0')
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const y = String(now.getFullYear() + 543) // แปลงเป็น พ.ศ.
  return `${d}/${m}/${y}`
}

todayTH.value = getTodayTH()

// === Time stamp (วัน/เดือน/ปี พ.ศ. + เวลา) ===
const nowTH = ref('')

function getNowTH() {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyyTH = String(now.getFullYear() + 543)
  const HH = String(now.getHours()).padStart(2, '0')
  const MM = String(now.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyyTH} ${HH}:${MM} น.`
}

nowTH.value = getNowTH()

function pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 วัน
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('lastSeenTimestamp', String(lastSeenTimestamp.value))
    unreadCount.value = 0
  }
}

function closeNotifications() {
  showNotifications.value = false
}

const pdfFilename = 'แบบฟอร์มขออนุมัติใช้สถานที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง.pdf'

// ขนาด A4 ในหน่วย CSS px (อิง 96dpi)
const A4_W = Math.round(210 * (96 / 25.4)); // ≈ 794px
const A4_H = Math.round(297 * (96 / 25.4)); // ≈ 1123px

// ระยะขอบมาตรฐาน (ปรับได้ตามต้องการ)
const PAD_X = 12; // ซ้าย/ขวา px (~3 มม.)
const PAD_Y = 12; // บน/ล่าง px


async function makeA4OnePageBlob(element) {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready } catch (_) {}
  }

  const orig = {
    width: element.style.width,
    height: element.style.height,
    margin: element.style.margin,
    padding: element.style.padding,
    transform: element.style.transform,
    transformOrigin: element.style.transformOrigin,
    display: element.style.display,
  };

  // กรอบ A4
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    width: A4_W + 'px',
    height: A4_H + 'px',
    background: '#fff',
    padding: '0',
    margin: '0',
    position: 'relative',
    overflow: 'hidden',
  });

  // พื้นที่ใช้งานจริงหลังหักขอบ
  const innerW = A4_W - (2 * PAD_X);
  const innerH = A4_H - (2 * PAD_Y);

  element.classList.add('pdf-export', 'pdf-onepage');
  element.style.display = 'block';
  element.style.margin = '0 auto';
  element.style.padding = `${PAD_Y}px ${PAD_X}px`; // ให้ตรงกับตัวแปรบน
  element.style.width = innerW + 'px';             // เริ่มวัดด้วยความกว้างตาม innerW
  element.style.transformOrigin = 'top center';
  element.style.transform = 'scale(1)';

  const parent = element.parentNode;
  const next = element.nextSibling;
  parent.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  await nextTick(); // ถ้าใช้ Vue
  await new Promise(r => requestAnimationFrame(r));

  // ย่อให้พอดีความสูง A4
  let contentHeight = element.scrollHeight;
  let scale = Math.min(1, innerH / contentHeight);

  // ชดเชยความกว้าง: ขยายก่อน แล้วค่อยย่อ => หลังย่อจะกว้างพอดีกับ innerW
  if (scale < 1) {
    element.style.width = (innerW / scale) + 'px';
    await new Promise(r => requestAnimationFrame(r));
    contentHeight = element.scrollHeight;                // ความสูงใหม่หลังขยาย
    scale = Math.min(1, innerH / contentHeight);        // คำนวณสเกลอีกครั้ง
  }

  element.style.transform = `scale(${scale})`;
  await new Promise(r => requestAnimationFrame(r));

  const opt = {
    margin: 0,
    filename: pdfFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'px', format: [A4_W, A4_H], orientation: 'portrait' },
    pagebreak: { mode: [] }
  };

  const pdfBlob = await html2pdf().from(wrapper).set(opt).outputPdf('blob');

  // คืน DOM
  if (next) parent.insertBefore(element, next); else parent.appendChild(element);
  wrapper.remove();
  element.classList.remove('pdf-export', 'pdf-onepage');
  element.style.width = orig.width;
  element.style.height = orig.height;
  element.style.margin = orig.margin;
  element.style.padding = orig.padding;
  element.style.transform = orig.transform;
  element.style.transformOrigin = orig.transformOrigin;
  element.style.display = orig.display;

  return pdfBlob;
}

async function exportToPDF() {
  const element = document.getElementById('pdf-section');
  const pdfBlob = await makeA4OnePageBlob(element);

  // ให้ผู้ใช้ดาวน์โหลดไฟล์
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = pdfFilename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 80);
}

async function htmlToPdfBlob(elementId) {
  const element = document.getElementById(elementId);
  return await makeA4OnePageBlob(element);
}


async function uploadPdfBlob(pdfBlob) {
  const fd = new FormData()
  fd.append('file', pdfBlob, 'booking.pdf')
  const up = await axios.post(`${API_BASE}/api/upload`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return up.data?.fileUrl // สมมติ API คืน {fileUrl}
}


async function fetchNotifications() {
  if (!userId) return
  try {
    pruneOldNotifications()

    const res = await axios.get(`${API_BASE}/api/history?user_id=${userId}`)
    const newNotis = res.data.filter(item =>
      (['approved', 'disapproved', 'cancel', 'canceled', 'returned'].includes((item.status || '').toLowerCase())) &&
      !lastCheckedIds.has(item._id)
    )

    if (newNotis.length) {
      const newMessages = newNotis.map(item => ({
        id: item._id,
        type: (item.status || '').toLowerCase(),
        timestamp: item.returnedAt
          ? new Date(item.returnedAt).getTime()
          : item.updatedAt
          ? new Date(item.updatedAt).getTime()
          : item.approvedAt
          ? new Date(item.approvedAt).getTime()
          : item.date
          ? new Date(item.date).getTime()
          : Date.now(),
        message: `รายการ '${item.name}' ของคุณ${
          (item.status || '').toLowerCase() === 'approved'
            ? ' ได้รับการอนุมัติ'
            : (item.status || '').toLowerCase() === 'disapproved'
            ? ' ไม่ได้รับการอนุมัติ'
            : (item.status || '').toLowerCase() === 'cancel' || (item.status || '').toLowerCase() === 'canceled'
            ? ' ถูกยกเลิก'
            : (item.status || '').toLowerCase() === 'returned'
            ? ' คืนของสำเร็จแล้ว'
            : ''
        }`
      }))

      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .sort((a, b) => b.timestamp - a.timestamp)

      pruneOldNotifications()
      newNotis.forEach(item => lastCheckedIds.add(item._id))
    }

    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch (err) {
    // ignore
  }
}

async function loadCart() {
  const userId = localStorage.getItem('user_id') || ''
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE}/api/cart?user_id=${userId}`)
    products.value = res.data
  } catch (err) {
    products.value = []
  }
}
onMounted(() => {
  lastSeenTimestamp.value = parseInt(localStorage.getItem('lastSeenTimestamp') || '0')
  fetchNotifications()
  polling = setInterval(fetchNotifications, 30000)
  loadCart()
})

onBeforeUnmount(() => {
  if (polling) clearInterval(polling)
})

// -------------- Form Confirm + ดึงไฟล์แนบ ----------------
const info = ref({})
const fileAttachments = ref([])
const isSidebarClosed = ref(false)
const router = useRouter()

const steps = ['กรอกข้อมูล','ยืนยันข้อมูล','สำเร็จ']
const currentStep = ref(1)
const stepRoutes = ['/form_field', '/form_field3', '/form_field4']

function toggleSidebar() {
  isSidebarClosed.value = !isSidebarClosed.value
}
function canStepTo(idx) {
  return idx <= currentStep.value
}
function goStep(idx) {
  if (!canStepTo(idx) || idx === currentStep.value) return
  if (idx === 0) {
    router.push({ path: stepRoutes[0], query: { restore: 'true' } })
  } else {
    router.push(stepRoutes[idx])
  }
}
function goBack() {
  router.push({ path: '/form_field', query: { restore: 'true' } })
}
function formatDateOnly(dateTime) {
  if (!dateTime) return '-'
  let dateStr = dateTime
  if (typeof dateTime === 'string' && dateTime.includes('T')) {
    dateStr = dateTime.split('T')[0]
  }
  if (dateStr.includes('/')) return dateStr
  const [y, m, d] = dateStr.split('-')
  if (!y || !m || !d) return dateStr
  const buddhistYear = (parseInt(y) + 543).toString()
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${buddhistYear}`
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

onMounted(async () => {
  const tempFiles = Array.isArray(window._tempSelectedFiles) ? window._tempSelectedFiles : []
  for (const f of tempFiles) {
    fileAttachments.value.push({
      fileName: f.name || 'ไฟล์แนบ',
      url: '#',
      size: f.size ? Math.round(f.size / 1024) : null,
    })
  }
  const bookingId = localStorage.getItem('bookingId')
  if (!bookingId) {
    Swal.fire('ไม่พบ bookingId')
    return
  }
  try {
    const res = await axios.get(`${API_BASE}/api/booking_field/${bookingId}`)
    info.value = res.data

    // map เดิม (ไม่รื้อ)
    if (info.value.utilityRequest === 'เลือก') info.value.utilityRequest = 'yes'
    if (info.value.utilityRequest === 'ไม่เลือก') info.value.utilityRequest = 'no'
    if (info.value.facilityRequest === 'เลือก') info.value.facilityRequest = 'yes'
    if (info.value.facilityRequest === 'ไม่เลือก') info.value.facilityRequest = 'no'

    // ✅ normalize เพิ่มเติมให้แน่นอน
    info.value.utilityRequest  = isYes(info.value.utilityRequest)  ? 'yes' : (isNo(info.value.utilityRequest)  ? 'no' : '')
    info.value.restroom        = isYes(info.value.restroom)        ? 'yes' : (isNo(info.value.restroom)        ? 'no' : '')
    info.value.facilityRequest = isYes(info.value.facilityRequest) ? 'yes' : (isNo(info.value.facilityRequest) ? 'no' : '')

    if (info.value.user_id) {
      try {
        const userRes = await axios.get(`${API_BASE}/api/user/${info.value.user_id}`)
        info.value.requester = userRes.data.name || '-'
      } catch {
        info.value.requester = '-'
      }
    }

    if (info.value.files && info.value.files.length > 0) {
      for (const file of info.value.files) {
        fileAttachments.value.push({
          fileName: file.originalName || file.fileName || 'ไฟล์แนบ',
          url: file.fileUrl,
          size: file.size ? Math.round(file.size / 1024) : null,
        })
      }
    }

    if (info.value.user_id) {
  try {
    const userRes = await axios.get(`${API_BASE}/api/user/${info.value.user_id}`)
    info.value.requester = userRes.data.name || '-'

    // ✅ ดึงลายเซ็นจาก users.signaturePath
    const sigPath =
      userRes.data.signaturePath ||
      userRes.data.signature_url ||
      userRes.data.signature ||
      ''

    signatureUrl.value = sigPath ? toAbsUrl(sigPath) : ''
  } catch {
    info.value.requester = '-'
    signatureUrl.value = ''
  }
}




  } catch (err) {
    Swal.fire('ดึงข้อมูลไม่สำเร็จ')
    console.error(err)
  }
})

async function uploadTempFilesAndGetUrls() {
  const filesToUpload = Array.isArray(window._tempSelectedFiles) ? window._tempSelectedFiles : []
  if (!filesToUpload.length) return []
  const uploaded = []
  for (const f of filesToUpload) {
    const fd = new FormData()
    // ถ้า backend ของคุณต้องการ key 'files' ให้เปลี่ยนเป็น fd.append('files', f)
    fd.append('file', f)
    const up = await axios.post(`${API_BASE}/api/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (up.data?.fileUrl) {
      uploaded.push({
        url: up.data.fileUrl,
        fileName: f.name || up.data.fileName || 'attachment',
        fileType: f.type || up.data.mimetype || '',
        size: f.size || null,
      })
    }
  }
  return uploaded
}




function preferFilled(baseObj = {}, overrideObj = {}) {
  // รวม object โดยให้ค่าที่ "มีจริง" (ไม่ null/undefined/'' ) จาก override ชนะ
  const out = { ...baseObj }
  for (const [k, v] of Object.entries(overrideObj || {})) {
    const isFilled = v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '')
    if (isFilled) out[k] = v
  }
  return out
}

function normalizeYesNo(v) {
  if (v === 'เลือก' || v === true || v === 'true' || v === 'yes') return 'yes'
  if (v === 'ไม่เลือก' || v === false || v === 'false' || v === 'no') return 'no'
  return (typeof v === 'string') ? v : ''
}

function normTime(t) {
  // รับได้ทั้ง "HH:mm", "HH:mm:ss", หรือ string อื่น ๆ
  if (!t) return ''
  if (typeof t !== 'string') return String(t)
  return t.slice(0,5)
}




async function handleNext() {
  try {
    nowTH.value = getNowTH(); // อัปเดตไทม์แสตมป์ก่อนทำ PDF

    const bookingId = localStorage.getItem('bookingId');
    if (!bookingId) {
      Swal.fire('ไม่พบ bookingId');
      return;
    }

    // 0) รวม draft กับข้อมูลที่โหลดมา
    const draft = (() => {
      try { return JSON.parse(sessionStorage.getItem('form_field_save') || 'null') || {}; }
      catch { return {}; }
    })();
    let bookingData = preferFilled(info.value || {}, draft || {});

    // 1) normalize yes/no + เวลา
    bookingData.utilityRequest  = normalizeYesNo(bookingData.utilityRequest);
    bookingData.restroom        = normalizeYesNo(bookingData.restroom);
    bookingData.facilityRequest = normalizeYesNo(bookingData.facilityRequest);
    const norm = (t) => (t && String(t).trim()) || '';
    bookingData.turnon_air      = norm(bookingData.turnon_air);
    bookingData.turnoff_air     = norm(bookingData.turnoff_air);
    bookingData.turnon_lights   = norm(bookingData.turnon_lights);
    bookingData.turnoff_lights  = norm(bookingData.turnoff_lights);
    bookingData.since_time      = norm(bookingData.since_time);
    bookingData.until_thetime   = norm(bookingData.until_thetime);

    // 2) โหลด step จาก settings → ใช้เฉพาะ value.field
    const cleanRoles = (arr) =>
      Array.from(new Set(
        (Array.isArray(arr) ? arr : [])
          .map(r => String(r || '').trim().toLowerCase())
          .filter(r => r === 'staff' || r === 'admin' || r === 'super')
      ));
    let stepArray = [];
    try {
      const resStep = await axios.get(`${API_BASE}/api/settings/approval_roles`);
      const value = resStep?.data?.value || {};             // { field: [...], equipment: [...] }
      const roles = Array.isArray(value.field) ? value.field : [];
      stepArray = cleanRoles(roles).map(r => ({ role: r, approve: null }));
    } catch (e) {
      console.warn('โหลด approval_roles (field) ไม่สำเร็จ:', e);
      stepArray = [];
    }

    // 3) ทำ PDF 1 หน้า + อัปโหลด
    const pdfBlob = await htmlToPdfBlob('pdf-section');
    const pdfUrl  = await uploadPdfBlob(pdfBlob);

    // 4) อัปโหลดไฟล์แนบ (ถ้ามี) + รวมไฟล์
    const hasTemp     = Array.isArray(window._tempSelectedFiles) && window._tempSelectedFiles.length > 0;
    const uploadedNow = hasTemp ? await uploadTempFilesAndGetUrls() : [];
    const multerFiles = Array.isArray(bookingData.files) ? bookingData.files : [];
    const allAttachments = [
      ...multerFiles.map(f => f.fileUrl || f.url).filter(Boolean),
      ...uploadedNow.map(f => f.url),
    ];
    const allFileNames = [
      ...multerFiles.map(f => f.originalName || f.fileName || 'ไฟล์แนบ'),
      ...uploadedNow.map(f => f.fileName || 'ไฟล์แนบ'),
    ];

    // 5) payload – แนบ step ที่ดึงมาจาก settings (field)
    const payload = {
      user_id: bookingData.user_id,
      name: bookingData.building,
      name_active: bookingData.name_activity,
      zone: bookingData.zone,
      since: bookingData.since,
      uptodate: bookingData.uptodate,
      startTime: bookingData.since_time,
      endTime: bookingData.until_thetime,
      status: 'pending',
      type: 'field',
      agency: bookingData.agency,
      booking_id: bookingId,
      attachment: allAttachments,
      fileName: allFileNames,
      date: new Date(),
      proxyStudentName: bookingData.proxyStudentName || '',
      proxyStudentId: bookingData.proxyStudentId || '',
      bookingPdfUrl: pdfUrl,
      username_form: bookingData.username_form || localStorage.getItem('username_form') || '',
      id_form:       bookingData.id_form       || localStorage.getItem('id_form')       || '',

      step: stepArray, // ⬅⬅ สำคัญ

      // อื่น ๆ
      utilityRequest:  bookingData.utilityRequest || '',
      restroom:        bookingData.restroom || '',
      facilityRequest: bookingData.facilityRequest || '',
      turnon_air:      bookingData.turnon_air || '',
      turnoff_air:     bookingData.turnoff_air || '',
      turnon_lights:   bookingData.turnon_lights || '',
      turnoff_lights:  bookingData.turnoff_lights || '',
      other:           bookingData.other || '',
      amphitheater:    bookingData.amphitheater || '',
      need_equipment:  bookingData.need_equipment || '',
      aw:              bookingData.aw || '',
      tel:             bookingData.tel || '',
      reasons:         bookingData.reasons || '',
      participants:    bookingData.participants || '',
      requester:       bookingData.requester || '',
      no_receive:      bookingData.no_receive || '',
      date_receive:    bookingData.date_receive || null,
      receiver:        bookingData.receiver || '',
      fileUrl:         bookingData.fileUrl || '',
    };

    await axios.post(`${API_BASE}/api/history`, payload);

    // 6) เคลียร์และไปหน้าถัดไป
    sessionStorage.removeItem('form_field_save');
    window._tempSelectedFiles = [];
    localStorage.removeItem('username_form');
    localStorage.removeItem('id_form');
    router.push('/form_field4');
  } catch (err) {
    if (err?.response?.status === 413) {
      Swal.fire({ icon: 'error', title: 'ไฟล์รวมใหญ่เกินไป', text: 'กรุณาลดจำนวน/ขนาดไฟล์ หรือบีบอัดก่อน แล้วลองอีกครั้ง' });
    } else if (err?.response?.status === 409) {
      Swal.fire({ icon: 'warning', title: 'คำขอซ้ำ', text: err.response.data.message || 'คุณมีรายการที่รออนุมัติอยู่แล้ว' });
    } else {
      Swal.fire('เกิดข้อผิดพลาดในการบันทึกข้อมูล', err?.response?.data?.message || err.message, 'error');
    }
    console.error(err);
  }
}

function formatTimeTH(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '-'
  let t = timeStr.trim().slice(0, 5)
  if (!/^\d{2}:\d{2}$/.test(t)) return timeStr + ' น.'
  return t + ' น.'
}
</script>

<style scoped>
.headStepper {
  position: sticky;
  top: 60px;
  z-index: 10;
  width: 90%;
  max-width: 900px;
  margin: 0 auto 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .1);
}
.stepper{ padding: 20px; border-radius: 20px; }

/* ไม่ต้องมี spacer แล้ว */
.headStepper-spacer{ display:none; }

/* กันคอนเทนต์โดนบาร์ทับด้านบนครั้งเดียวพอ */
.main{ padding-top: calc(var(--topbar-h)); }


/* เพิ่มพื้นที่ด้านล่างเพื่อให้ label อยู่ “ในกรอบ” */
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 20px 52px;
  border-radius: 20px;
}
.step{
  position: relative;
  display: flex;
  align-items: center;
}
.avoid-break, .approval-sign-table, .sign-header-table {
  page-break-inside: avoid;
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  -webkit-break-inside: avoid;
  -moz-break-inside: avoid;
}
.circle {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: #ccc;
  transition: background .3s;
  cursor: pointer;
}
.circle.active { background: #ff4d4f; }
.circle.completed { background: #ff4d4f; opacity: .5; }
/* จัด label ให้อยู่กึ่งกลางวงกลมและไม่เอียงไปทางซ้าย */
.label{
  position: absolute;
  top: 45px;
  left: calc(30px / 2);
  transform: translateX(-50%);
  font-size: 12px;
  white-space: nowrap;
  text-align: center;
}


.line {
  width: 80px; height: 4px;
  background: #ccc; margin: 0 5px;
  transition: background .3s;
}
.line.filled { background: #ff4d4f; }

/* Form */
.title { text-align: center; margin-bottom: 20px; }
.form-container {
  background: #fff;
  margin: 30px auto;
  padding: 40px;
  width: 90%; max-width: 900px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.form-header { text-align: center; margin-bottom: 20px; }
.info-left {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 0px;
  flex-wrap: wrap;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.form-row-title { font-weight: bold; margin-bottom: 10px; }
.mt-30 { margin-top: 30px; }
.mt-15 { margin-top: 15px; }
.bold { font-weight: bold; }
.line-field {
  padding: 0 6px;
  min-width: 50px;
  height: auto;
  min-height: 20px;
  max-width: 650px;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: block;
  line-height: 1.5em;
}

/* ===== แนวตารางของหัวข้อ 2 (Utility) ===== */
.util-table {
  border-collapse: collapse;
  table-layout: fixed;
}
.util-table td {
  padding: 0 4px;
  height: 26px;
  vertical-align: middle;
  font-size: 15px;
}
.util-table .util-label { white-space: nowrap; }

/* ให้ค่าเวลาเริ่มชิดซ้ายตรงกับแถว "อื่นๆ" */
.util-table .time {
  white-space: nowrap;
  text-align: left;
  padding-left: 0;
}
.util-table .sep { text-align: center; }

/* ค่าในแถว "อื่นๆ" */
.util-table .other-value {
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
  padding-left: 0;
}
/* ===== ปรับคอลัมน์และระยะหลัง ":" ให้แคบลง + จัดจุดเริ่มข้อความหลัง ":" ให้ตรงกัน ===== */
.util-table.util-colon-align col.c-label { width: 200px !important; } /* เดิม ~230–240 → แคบลง */
.util-table.util-colon-align col.c-colon { width: 8px !important; }   /* ช่อง ":" ให้เล็กลง */

.util-table.util-colon-align td.colon { 
  text-align: center; 
  padding: 0 2px !important;          /* ลด padding รอบ ":" */
}

/* จุดเริ่ม “ข้อความหลัง :” ให้คงที่ทั้ง 2.1 และ 2.2 */
.util-table.util-colon-align td.time,
.util-table.util-colon-align td.restroom-text{
  padding-left: 2px !important;       /* ตัวเลข/คำ “ตั้งแต่” และคำ “ต้องการใช้งาน” เริ่มบรรทัดเดียวกัน */
  text-indent: 0 !important;
  margin-left: 0 !important;
}

/* ถ้าตัว “ต” แถวล่างยังเหลื่อมซ้ายเล็กน้อย ให้จูนเพิ่มทีละ 1–2px ตรงนี้ */
.util-table.util-colon-align td.restroom-text{
  padding-left: 3px !important;       /* ลอง 3px เพื่อให้ “ต” ล่างตรงกับ “ต” บนแบบรูปลูกศร */
}

/* (คงไว้) เว้นระยะเล็กน้อยหลังคำว่า “ตั้งแต่” */
.util-table.util-colon-align .time .since{ margin-right:4px; }

/* คุมความกว้างคอลัมน์คงเดิม */
.util-table col.c-label { width: 240px; }
.util-table col.c-time  { width: 76px; }
.util-table col.c-sep   { width: 34px; }
/* --- Utilities (ข้อ 2): จัด ":" ให้ตรงกันทุกบรรทัด + ชิดบน --- */
.util-table.util-colon-align {
  border-collapse: collapse;
  table-layout: fixed;
}
.util-table.util-colon-align td {
  padding: 0 4px;
  height: 24px;
  vertical-align: top;        /* ยึดตำแหน่งด้านบน */
  font-size: 15px;
}

/* คุมความกว้างคอลัมน์ (ปรับ c-label ได้ตามสายตาให้เหมือนตัวอย่าง) */
.util-table.util-colon-align col.c-label { width: 230px; }  /* ถ้ายังไม่พอดี ลอง 220–240px */
.util-table.util-colon-align col.c-colon { width: 12px; }
.util-table.util-colon-align col.c-time  { width: 74px; }
.util-table.util-colon-align col.c-sep   { width: 34px; }

.util-table.util-colon-align td.util-label { white-space: nowrap; }
.util-table.util-colon-align td.colon      { text-align: center; padding: 0; }
.util-table.util-colon-align td.sep        { text-align: center; white-space: nowrap; }
.util-table.util-colon-align td.time       { white-space: nowrap; }
.util-table.util-colon-align td.restroom-text { white-space: nowrap; padding-left: 0; }

.util-table.util-colon-align td { vertical-align: top; } /* ยึดด้านบนไว้ตามที่ต้องการ */
.util-table.util-colon-align .time .since { margin-right: 4px; } /* เว้นระยะคำ “ตั้งแต่” */

.attached-files-list {
  margin-top: 8px;
  max-height: 140px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f9fafb;
  padding: 6px 16px;
}
.attached-file-item {
  font-size: 14px;
  color: #26577C;
  padding: 3px 0;
  border-bottom: 1px solid #eee;
  white-space: normal;
  word-break: break-all;
}
.attached-file-item:last-child { border-bottom: none; }
.attached-file-item a { color: #048ace; text-decoration: underline; word-break: break-all; }

/* --- Signature Section & Tables (unchanged) --- */
.signatures-row { display: flex; justify-content: space-between; gap: 20px; margin: 38px 0 12px 0; }
.signature-box { flex: 1 1 0; padding: 0px; margin: 0 2px; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; background: none; box-shadow: none; }
.sign-label { font-size: 14px; margin-bottom: 1px; margin-top: 0; }
.sign-role { font-size: 13px; margin-bottom: 2px; margin-top: 2px; }
.sign-date { font-size: 13px; margin-bottom: 4px; margin-top: 0; }
.sign-inner-box { width: 100%; border: 1px solid #222; margin-top: 7px; padding: 8px 9px 7px 9px; font-size: 14px; background: none; box-shadow: none; }
.sign-inner-title { font-weight: bold; margin-bottom: 4px; }
.sign-inner-item { display: flex; align-items: center; font-size: 14px; gap: 7px; margin-bottom: 1px; }
.sign-inner-item input[type="checkbox"] { accent-color: #333; margin-right: 5px; } /* ทำให้ติ๊กสีเทาเข้มขึ้น */
.sign-dotline { display: inline-block; min-width: 80px; font-size: 14px; border-bottom: none; letter-spacing: 2px; vertical-align: bottom; }
.sign-inner-blank { margin: 7px 0 3px 0; }
.sign-inner-title { font-weight: bold; margin-bottom: 4px; position: relative; padding-bottom: 0; }
.sign-underline { border-bottom: 1px solid #222; width: 500px ; margin-left: 0px; margin-right: 0px; margin-top: 2px; }

.approval-table { width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 24px; }
.approval-table th, .approval-table td { border: 1px solid #000; padding: 10px 8px; font-size: 15px; text-align: left; vertical-align: top; word-break: break-word; overflow-wrap: break-word; }
.approval-table th { background: #f7f7f7; font-weight: bold; text-align: center; }

.approval-sign-table { width: 100%; border-collapse: collapse; table-layout: fixed; background: #fff; margin-bottom: 16px; }
.approval-sign-table th, .approval-sign-table td { border: 1px solid #222; font-size: 16px; vertical-align: top; padding: 0; text-align: left; }
.approval-sign-table th { text-align: center; background: #f8f9fa; font-weight: bold; font-size: 16.5px; padding: 10px 0; }
.approval-sign-table td { height: 230px; }

.td-inner { display: flex; flex-direction: column; justify-content: flex-start; height: 100%; padding: 12px 12px 10px 12px; box-sizing: border-box; }

.checkbox-line { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; min-height: 26px; }
.checkbox-line input[type="checkbox"] { width: 17px; height: 17px; accent-color: #333; margin: 0 4px 0 0; } /* เทาเข้ม */
.checkbox-line label { font-size: 15px; user-select: none; }

.dot-line { display: inline-block; width: 98%; border-bottom: 1px dotted #222; height: 15px; margin: 9px 0 0 0; min-width: 60px; vertical-align: middle; }
.dot-line.short { width: 90%; min-width: 70px; }
.dot-line.mid { width: 65px; }
.dot-line.date { width: 170px; min-width: 100px; border-bottom: 1px dotted #222; }

.sign-space { margin: 16px 0 0 0; font-size: 15px; min-height: 22px; display: flex; align-items: center; gap: 7px; }

/* ตารางเซ็นชื่อบน */
.sign-header-table { width: 100%; border-collapse: collapse; margin-top: 16px; table-layout: fixed; }
.sign-header-table td { padding: 14px 10px 12px 10px; font-size: 16px; text-align: center; vertical-align: top; word-break: break-word; width: 33.33%; }

/* ปุ่ม Back & Next */
.button-wrapper { display: flex; justify-content: space-between; gap: 16px; margin-top: 30px; }
#btnBack, #btnNext { font-size: 1rem; font-weight: 500; padding: .55rem 1.5rem; border: none; border-radius: 8px; outline: none; cursor: pointer; transition: background 0.22s, color 0.22s, box-shadow 0.22s; box-shadow: 0 1px 6px 0 rgba(0,0,0,0.07); }
#btnBack { padding: 0.5rem 1rem; background-color: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; }
#btnNext { background: #007bff; color: #fff; }
#btnBack:hover { background-color: #5a6268; }

/* ===== CSS แจ้งเตือนแบบ history ===== */
.notification-dropdown { position: absolute; right: 0; top: 38px; background: #fff; border-radius: 18px 0 18px 18px; box-shadow: 0 8px 24px 0 rgba(27, 50, 98, 0.14), 0 2px 4px 0 rgba(33, 125, 215, 0.06); min-width: 330px; max-width: 370px; max-height: 420px; overflow-y: auto; z-index: 1002; padding: 0; border: none; animation: fadeDown 0.22s; }
@keyframes fadeDown { 0% { opacity: 0; transform: translateY(-24px);} 100% { opacity: 1; transform: translateY(0);} }
.notification-dropdown ul { padding: 0; margin: 0; list-style: none; }
.notification-dropdown li { background: linear-gradient(90deg, #f6fafd 88%, #e2e7f3 100%); margin: 0.2em 0.8em; padding: 0.85em 1.1em; border-radius: 12px; border: none; font-size: 1.07rem; font-weight: 500; color: #1e2c48; box-shadow: 0 2px 8px 0 rgba(85, 131, 255, 0.06); display: flex; align-items: flex-start; gap: 10px; position: relative; cursor: default; transition: background 0.2s; }
.notification-dropdown li:not(:last-child) { margin-bottom: 0.15em; }
.notification-dropdown li::before { content: "🔔"; font-size: 1.2em; margin-right: 7px; color: #1976d2; opacity: 0.80; }
.notification-dropdown li.no-noti { background: #f2f3f6; color: #a7aab7; justify-content: center; font-style: italic; }
.notification-dropdown::-webkit-scrollbar { width: 7px; }
.notification-dropdown::-webkit-scrollbar-thumb { background: #e1e7f5; border-radius: 10px; }
.notification-dropdown::-webkit-scrollbar-track { background: transparent; }
.notification-item.approved { background: linear-gradient(90deg, #e9fbe7 85%, #cbffdb 100%); border-left: 4px solid #38b000; color: #228c22; }
.notification-item.disapproved { background: linear-gradient(90deg, #ffeaea 85%, #ffd6d6 100%); border-left: 4px solid #ff6060; color: #b91423; }
.notification-item.canceled, .notification-item.cancel { background: linear-gradient(90deg, #f9d7d7 80%, #e26a6a 100%); border-left: 4px solid #bb2124; color: #91061a; }
.notification-item.returned { background: linear-gradient(90deg, #e0f0ff 85%, #b6e0ff 100%); border-left: 4px solid #1976d2; color: #1976d2; }
.notification-item { transition: background 0.3s, border-color 0.3s, color 0.3s; }

.notification-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: transparent; z-index: 1001; }

@media (max-width: 540px) {
  .scroll-x-container { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100vw; padding: 0; }
  .form-container { min-width: 900px; width: 900px; max-width: 900px; padding: 16px 24px !important; border-radius: 10px !important; box-sizing: border-box; }
}

.force-inline { display: inline-block !important; min-width: unset !important; max-width: unset !important; width: auto !important; white-space: nowrap !important; vertical-align: middle; }

.utility-row { display: flex; align-items: center; gap: 12px; margin-left: 80px; margin-bottom: 5px; min-height: 28px; white-space: nowrap; }
.utility-label { display: inline-block; font-size: 15px; min-width: 170px; text-align: right; margin-right: 8px; font-weight: normal; }
.utility-time { display: inline-block; min-width: 54px; text-align: center; background: none; border-bottom: none !important; margin: 0 3px; font-size: 15px; font-family: inherit; }
.utility-between { margin: 0 3px; font-size: 15px; }
.utility-other-center { font-size: 15px; text-align: center; }
.dot-line-custom { flex: 1 1 0; border-bottom: 1.5px dotted #222; min-width: 80px; margin-left: 8px; margin-right: 6px; height: 16px; display: inline-block; }

/* radio ปลอมสำหรับ PDF + หน้าจอ (ให้จางลง) */
/* กล่องสี่เหลี่ยมสำหรับติ๊ก (เหมือนตัวอย่าง) */
.box-print{
  display:inline-block;
  width:14px; height:14px;
  border:2px solid #444;
  border-radius:2px;         /* <-- สี่เหลี่ยม */
  margin-right:6px;
  vertical-align:middle;
}
.box-print.on::after{
  content:'';
  display:block;
  width:8px; height:8px;
  background:#666;           /* สีติ๊กด้านใน */
  margin:1px auto;
}

.pdf-export {
  font-size: 16px !important;
}
.pdf-export h1,
.pdf-export h2,
.pdf-export h3 {
  font-size: 18px !important;
}
/* ใช้ TH Sarabun New กับทุกข้อความภายในบล็อกฟอร์ม pdf-section */
#pdf-section, #pdf-section * {
  font-family: 'THSarabunNew', 'Sarabun', 'Noto Sans Thai', Tahoma, sans-serif !important;
  letter-spacing: 0; /* ให้ระยะอักษรถูกต้องในภาษาไทย */
}

/* เลือกน้ำหนักตัวหนาให้คมสวย */
#pdf-section .bold,
#pdf-section b,
#pdf-section strong,
#pdf-section th {
  font-weight: 700;
}
/* ทำให้ 3 เส้นล่าง “เรียงแถว” ตรงกันทั้งสามช่อง */
.approval-sign-table td { padding: 0; }
.td-inner{
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 230px;
  padding: 12px;
  box-sizing: border-box;
}

/* บรรทัด checkbox – ให้สูงคงที่และไม่ตัดบรรทัด */
.checkbox-line{
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  margin: 0 0 8px 0;
  white-space: nowrap;
}
.checkbox-line.placeholder{ visibility: hidden; }

.checkbox-line input[type="checkbox"]{
  width: 17px; height: 17px; margin: 0 4px 0 0; accent-color:#333; /* เทาเข้ม */
}
.checkbox-line label{ font-size: 15px; }

/* แถวเส้นบรรทัดทั้งสอง */
.line-row{
  display: flex;
  align-items: center;
  height: 22px;
  margin: 6px 0;
}

/* แถว “วันที่ …/…/…” */
.date-row{
  display: flex;
  align-items: center;
  height: 22px;
  margin-top: 6px;
}

/* เส้นจุดเดิมของคุณ */
.dot-line{ display:inline-block; width:98%; border-bottom:1px dotted #222; height:15px; min-width:60px; vertical-align:middle; }
.dot-line.short{ width:90%; min-width:70px; }
.dot-line-custom{ flex:1 1 0; border-bottom:1.5px dotted #222; min-width:80px; margin-left:8px; margin-right:6px; height:16px; display:inline-block; }
/* ขณะ export: บังคับกรอบให้เท่ากับหน้า A4 และเผื่อระยะหายใจ */
.pdf-onepage { background: #fff !important; box-sizing: border-box; }

/* กรอบจับภาพ A4 (สร้างตอน export เท่านั้น) */
.a4-capture-wrapper {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* กันข้อความทับกันระหว่างสเกล (โดยเฉพาะฟอนต์ไทย) */
#pdf-section, #pdf-section * {
  line-height: 1.35;
}

/* ย่อหน้า “ด้วย …” */
#pdf-section .form-row[style*="text-indent"] {
  line-height: 1.6 !important;
}

</style>

<style>
@font-face{
  font-family: 'THSarabunNew';
  src: url('/fonts/THSarabunNew.woff2') format('woff2'),
       url('/fonts/THSarabunNew.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face{
  font-family: 'THSarabunNew';
  src: url('/fonts/THSarabunNew-Italic.woff2') format('woff2'),
       url('/fonts/THSarabunNew-Italic.woff') format('woff');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face{
  font-family: 'THSarabunNew';
  src: url('/fonts/THSarabunNew-Bold.woff2') format('woff2'),
       url('/fonts/THSarabunNew-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face{
  font-family: 'THSarabunNew';
  src: url('/fonts/THSarabunNew-BoldItalic.woff2') format('woff2'),
       url('/fonts/THSarabunNew-BoldItalic.woff') format('woff');
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}

/* === Uniform line spacing for Section 1 → Notes === */
#uniform-lines {
  --line-gap: 10px;
  line-height: 1.35;
}

/* ให้ทุกบรรทัดหลักในช่วงนี้มีช่องไฟเท่ากัน */
#uniform-lines .form-row,
#uniform-lines .block-row,
#uniform-lines .util-wrap,
#uniform-lines .note-line {
  margin-top: var(--line-gap) !important;
  margin-bottom: 0 !important;
}

/* บรรทัดแรกของช่วง ไม่ต้องมีช่องไฟบน */
#uniform-lines .form-row.bold:first-of-type {
  margin-top: 0 !important;
}

/* รักษาระยะร่นซ้ายเดิมของบล็อกย่อย */
#uniform-lines .block-row[style*="margin-left: 80px"] {
  margin-left: 80px !important;
}

/* ตารางยูทิลิตีให้สูงคงที่ทุกแถว */
#uniform-lines .util-table {
  margin-top: var(--line-gap) !important;
}
#uniform-lines .util-table td {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  height: 26px !important;
  vertical-align: middle;
}

/* กันช่องไฟหนาไปจากคลาสเก่า (เช่น mt-30/mt-15) */
#uniform-lines .mt-30,
#uniform-lines .mt-15 {
  margin-top: var(--line-gap) !important;
}

/* หัวข้อหนาให้ความสูงบรรทัดเท่ากัน */
#uniform-lines .bold { line-height: 1.35; }
/* ให้ทั้ง 2.1 และ 2.2 ใช้ฟอนต์/ขนาดเท่ากัน */
.util-table td,
.util-table label,
.util-table .restroom-opt {
  font-size: 15px !important;
  line-height: 1.35;
}

/* จัดระยะช่องวิทยุของห้องสุขาให้พอดี */
.util-table .restroom-cell {
  text-align: left;
}
.util-table .restroom-opt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.util-table .restroom-opt input[type="radio"] {
  margin: 0;
}
/* radio ปลอม: ให้จุดเลือก "จางลง" กว่าเดิม */
.radio-print{
  display:inline-block;
  width:14px; height:14px;
  border:2px solid #444;           /* เส้นวงเป็นเทาเข้ม ไม่ดำสนิท */
  border-radius:50%;
  margin-right:6px;
  vertical-align:middle;
}
.radio-print.on::after{
  content:'';
  display:block;
  width:8px; height:8px;
  background:#666;                 /* ✅ ให้จุดด้านใน "จางลง" กว่า #333/#000 */
  border-radius:50%;
  margin:1px auto;
}

/* จุดดำใน checkbox ของตารางล่าง ให้เข้มขึ้นเล็กน้อย */
.checkbox-line input[type="checkbox"]{
  accent-color:#333;               /* ✅ เทาเข้มขึ้น */
}
/* ทำให้บล็อกเซ็นชื่อเดียวชิดขวา */
.sign-header-table.single-right td{
  width: 100%;
  text-align: right !important;   /* ชนะกติกาเดิมที่ตั้งไว้เป็น center */
  padding-right: 0px;            /* ปรับระยะขอบขวานิดหน่อย */
}

/* กล่องด้านในให้จัดข้อความกึ่งกลาง แต่ทั้งกล่องวางชิดขวา */
.sign-header-table.single-right .sig-box{
  display: inline-block;
  text-align: center;
  min-width: 320px;               /* ให้กล่องกว้างพอดูสวย (ปรับได้) */
}
.sign-header-table td {
  padding: 14px 10px 12px 10px;
  font-size: 16px;
  text-align: center;
  vertical-align: top;
  word-break: break-word;
  width: 100%;           /* จาก 33.33%/50% → 100% เพราะเหลือ 1 ช่อง */
}
/* ตารางอนุมัติ (2 กล่อง) */
.approval-sign-table.two-cols th,
.approval-sign-table.two-cols td { width: 50%; }

/* วงกลมวิทยุปลอม (ใช้ของเดิมได้ ถ้ามีแล้วข้ามได้) */
.radio-print{
  display:inline-block;width:14px;height:14px;border:2px solid #444;border-radius:50%;
  margin-right:6px;vertical-align:middle;
}
.radio-print.on::after{
  content:'';display:block;width:8px;height:8px;background:#666;border-radius:50%;margin:1px auto;
}
/* จัดบรรทัดวันที่ให้อยู่กึ่งกลางในกล่อง */
.approval-sign-table .date-row{
  justify-content: center !important;  /* จัดกลางแนวนอน */
  text-align: center !important;
  margin-top: 4px !important;          /* ลดช่องว่างเหนือบรรทัดวันที่นิดนึง */
}

/* ==== ลดช่องว่างใต้บรรทัดวันที่ในตารางอนุมัติ ==== */

/* ไม่ล็อกความสูงเซลล์อีกต่อไป */
.approval-sign-table td{
  height: auto !important;
}

/* ไม่ล็อกความสูงกล่องด้านใน และกำหนดแค่ขั้นต่ำ */
.approval-sign-table .td-inner{
  height: auto !important;      /* override ที่เคยตั้ง 230px */
  min-height: 160px;            /* ปรับเลขนี้ 150–170 ตามชอบ */
  padding-bottom: 2px !important;
}

/* จัดบรรทัดวันที่ให้อยู่กึ่งกลางและชิดขึ้นอีก */
.approval-sign-table .date-row{
  justify-content: center !important;
  margin-top: 2px !important;
  margin-bottom: 0 !important;
}

/* ลดช่องไฟของเส้นก่อนหน้า */
.approval-sign-table .line-row{
  margin: 2px 0 !important;
}

/* ลดช่องไฟของแถว checkbox ด้านบนเล็กน้อย (ถ้าต้องการ) */
.approval-sign-table .checkbox-line{
  margin-bottom: 6px !important;
}
/* ขยับบรรทัดวงเล็บลงจากบรรทัดเส้นข้างบน */
.approval-sign-table .td-inner .line-row + .line-row{
  margin-top: 10px !important;   /* ปรับได้ 6–14px ตามต้องการ */
}

/* ถ้ารู้สึกว่าไปชิดกับ "วันที่" เกินไป ให้เว้นด้านบนของบรรทัดวันที่เล็กน้อย */
.approval-sign-table .date-row{
  margin-top: 15px !important;
}
/* เพิ่มช่องว่างใต้บรรทัด "วันที่" ให้ห่างจากเส้นกรอบล่าง */
.approval-sign-table .td-inner{
  padding-bottom: 12px !important;   /* เดิมคุณตั้งไว้ 2px → ปรับตามที่ต้องการ */
}

/* ถ้ายังรู้สึกชิดอยู่ เพิ่มระยะที่ตัวบรรทัดวันที่ด้วย */
.approval-sign-table .date-row{
  margin-bottom: 6px !important;     /* ปรับ 4–10px ได้ตามชอบ */
}
/* 1) ลดความกว้างคอลัมน์ข้อความด้านซ้าย → เวลาเลยชิด ":" มากขึ้น */
.util-table col.c-label { 
  width: 180px !important;   /* เดิม 240px — ปรับ 200–215 ได้ตามชอบ */
}

/* 2) ลดช่องว่างหลัง ":" ของเซลล์ซ้ายสุดให้แทบไม่มี */
.util-table td.util-label {
  padding-right: 0px !important;   /* จะเอา 0px ก็ได้ถ้าอยากชิดสุด */
}

/* 3) ให้บรรทัด "ห้องสุขา" เริ่มตรงแนวเดียวกับคอลัมน์เวลา (เหมือนเวลาบรรทัดบน) */
.util-table .restroom-cell {
  padding-left: 0 !important;      /* เดิมมี padding-left 4px จากกฎรวมของ td */
}
/* ใช้กับทั้งตอนแสดงบนจอและตอน export */
#pdf-section { 
  font-size: 15px !important;
}

/* ถ้าเก็บกฎนี้ไว้ ให้ปรับเป็น 15 ให้เท่ากัน */
.pdf-export {
  font-size: 18px !important;   /* เดิม 16px */
}

/* บังคับให้ข้อความทั่วไปในฟอร์มสืบทอดขนาดจาก #pdf-section */
#pdf-section .form-row,
#pdf-section .block-row,
#pdf-section .note-line,
#pdf-section label,
#pdf-section span,
#pdf-section p,
#pdf-section .line-field,
#pdf-section .util-table td,
#pdf-section .util-table .sep,
#pdf-section .util-label {
  font-size: inherit !important;
}

/* หัวข้อให้ใหญ่กว่าหน่อยตามเดิม */
#pdf-section h3 { font-size: 20px !important; }
/* === Tighten 2.1 / 2.2 spacing === */
#pdf-section .util-table.util-colon-align{
  table-layout: auto !important;           /* ให้คอลัมน์หดตามเนื้อหา */
  border-collapse: collapse;
}

#pdf-section .util-table.util-colon-align col.c-label{ 
  width: 1px !important;                    /* บังคับให้แคบสุด – ชิดข้อความ */
}
#pdf-section .util-table.util-colon-align col.c-colon{ 
  width: 10px !important;                   /* ช่อง ":" เล็ก ๆ พอ */
}
#pdf-section .util-table.util-colon-align col.c-time{ 
  width: 74px !important;                   /* คงความกว้างเวลาตามเดิม */
}
#pdf-section .util-table.util-colon-align col.c-sep{ 
  width: 24px !important;                   /* ลดคั่นกลางนิดหน่อย */
}

#pdf-section .util-table.util-colon-align td.util-label{ 
  padding-right: 2px !important;            /* ลดช่องก่อน ":" */
  white-space: nowrap;
}
#pdf-section .util-table.util-colon-align td.colon{
  padding: 0 2px !important;                /* ":" ชิดพอดี */
  text-align: center;
}
#pdf-section .util-table.util-colon-align td.time,
#pdf-section .util-table.util-colon-align td.restroom-text{
  padding-left: 0 !important;               /* ข้อความหลัง ":" เริ่มทันที */
  white-space: nowrap;
}
#pdf-section .util-table.util-colon-align .time .since{
  margin-right: 4px;                         /* เว้นหลังคำว่า “ตั้งแต่” เล็กน้อย */
}

/* รูปลายเซ็นบนบรรทัด "ลงชื่อ" */
.sign-line {
  --sign-gap: 20px;                 /* ← ปรับระยะห่างคำว่า “ลงชื่อ” กับลายเซ็นที่นี่ */
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  column-gap: var(--sign-gap);
  white-space: nowrap;
  width: 100%;
  text-align: center;   
}

.sign-text{
  justify-self: end;                /* “ลงชื่อ” ชิดขวาของคอลัมน์ซ้าย */
}

.signature-wrap{
  justify-self: center;             /* รูปลายเซ็น/เส้นจุด อยู่คอลัมน์กลาง */
  display: inline-block;
}

.signature-img {
  height: 48px;
  display: inline-block;
  vertical-align: bottom;
  max-width: 260px;
  object-fit: contain;
}

.dot-line-inline {
   display: inline-block;
  min-width: 240px;
}
/* ลดขนาดไทม์แสตมป์ใต้ลายเซ็น */
#pdf-section .sig-under .sig-date { 
  font-size: 13px !important;   /* ลอง 12–13px ตามชอบ */
  line-height: 1.2;
}

/* ขณะ export (มี .pdf-export ครอบ) ให้เล็กเท่าเดิม */
.pdf-export .sig-under .sig-date {
  font-size: 13px !important;
  line-height: 1.2;
}
/* ชิดขวาสุดภายในพื้นที่เอกสาร */
.sign-header-table.single-right td{
  padding-right: 0 !important;
}
.sign-header-table.single-right .sig-box{
  display: block !important;
  margin-left: auto !important;   /* ดันไปชิดขวา */
  margin-right: 0 !important;
  padding-right: 0 !important;
}

/* ลดช่องว่างคำว่า "ลงชื่อ" กับเส้นจุด/ลายเซ็น */
.sign-line{
  --sign-gap: 8px !important;     /* เดิม 20px → แน่นขึ้น (ปรับได้ 4–12px) */
  column-gap: var(--sign-gap) !important;
}
.sign-text{ margin-right: 0 !important; }
.signature-wrap{ margin-left: 0 !important; }

/* ถ้าเส้นจุดยาวไป ทำให้เริ่มใกล้ "ลงชื่อ" ขึ้นอีกนิด */
.dot-line-inline{
  min-width: 200px !important;    /* เดิม 240px → ปรับตามสายตา 180–220 ก็ได้ */
}

/* ตารางเซ็นชื่อ (แบบมีช่องเดียว) */
.sign-header-table.single-right td {
  width: 100%;
  text-align: right !important;   /* ดันกล่องไปขวาสุด */
  padding-right: 0 !important;
}

/* กล่องลายเซ็น → ยกไปชิดขวา แต่ข้อความภายในยัง center */
.sign-header-table.single-right .sig-box {
  display: block !important;
  margin-left: auto !important;   /* ✅ ดันไปชิดขวา */
  margin-right: 0 !important;
  text-align: center !important;  /* ✅ ภายในยัง center */
  min-width: 320px;               /* กำหนดความกว้างพอเหมาะ (ปรับได้) */
}
/* ===== บังคับบล็อกเซ็นชื่อเดียวไปชิดขวาสุด ===== */
.sign-header-table.single-right {
  width: 100%;
}

.sign-header-table.single-right td {
  text-align: right !important;   /* ดันคอลัมน์ไปขวาสุด */
  padding-right: 0 !important;
}

.sign-header-table.single-right .sig-box {
  display: inline-block !important; /* ใช้ inline-block แทน block */
  text-align: center !important;    /* ภายในยัง center */
  margin-left: auto !important;     /* ดันไปขวา */
  margin-right: 0 !important;
  min-width: 300px;                 /* กำหนดความกว้างพอดี */
}
/* ✅ ดันบล็อกเซ็นชื่อไปขอบขวาสุด */
.sign-header-table.single-right td {
  padding-right: 0 !important;   /* ไม่เหลือช่องว่างด้านขวา */
}

.sign-header-table.single-right .sig-box {
  margin-left: auto !important;  /* ดันไปขวาสุด */
  margin-right: 0 !important;
  text-align: center !important; /* ภายในยังจัดกึ่งกลาง */
  min-width: 280px;              /* ปรับกว้างตามสายตา */
}

/* ถ้าอยากให้แทบจะติดขอบกระดาษจริง ๆ */
#pdf-section .sign-header-table.single-right .sig-box {
  padding-right: 0 !important;
  transform: translateX(10px);   /* ปรับ +5 ถึง +15px เพื่อเลื่อนเพิ่ม */
}
/* ===== ดันกล่องเซ็นชื่อไปชิดขวาสุดแบบสุด ๆ ===== */
.sign-header-table.single-right td {
  padding-right: 0 !important;
}

.sign-header-table.single-right .sig-box {
  margin-left: auto !important;
  margin-right: 0 !important;
  text-align: center !important;
  min-width: 280px;
  transform: translateX(30px);   /* ✅ เลื่อนเพิ่มไปทางขวาอีก (ปรับเลขได้ 10–50px) */
}

</style>


<style>
@import '../css/style.css';
</style>