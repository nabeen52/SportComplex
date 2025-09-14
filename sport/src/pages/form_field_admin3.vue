<template>
  <div class="layout">
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
        <!-- <router-link to="/return_admin" active-class="active"><i class="pi pi-box"></i> รับคืนอุปกรณ์ </router-link> -->
        <router-link to="/members" active-class="active"><i class="pi pi-user-edit"></i> พนักงาน/ผู้ดูแล </router-link>
        <router-link to="/history_admin" active-class="active"><i class="pi pi-history"></i> ระบบประวัติการทำรายการ</router-link>
      </nav>
    </aside>
<div v-if="!isSidebarClosed" class="sidebar-overlay" @click="toggleSidebar"></div>
    <!-- Main Content -->
    <div class="main">
      <!-- Topbar -->
      <header class="topbar">
  <button class="menu-toggle" @click="toggleSidebar">☰</button>
  <div class="topbar-actions">
    <!-- กระดิ่งแจ้งเตือน -->
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
              <span class="bold">เรียน</span><span>อธิการบดี</span>
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

  <div class="form-row block-row" style="margin-left: 80px;">
    <span>อาคาร :</span>
    <span class="line-field block-text">{{ info.building }}</span>
  </div>

  <div class="form-row block-row" style="margin-left: 80px;">
    <span>ตำแหน่งพื้นที่/ห้องที่ต้องการใช้ :</span>
    <span class="line-field block-text">
      {{ info.zone && info.zone.trim() !== '' ? info.zone : '-' }}
    </span>
  </div>

  <!-- ข้อ 2 -->
  <div class="form-row bold" style="margin-left: 0;">
    <span>2. ขออนุมัติใช้ระบบสาธารณูปโภค</span>
    <input type="radio" value="yes" :checked="isUtilityYes(info.utilityRequest)" disabled/>
    <label style="margin-right: 18px;">เลือก</label>
    <input type="radio" value="no" :checked="isUtilityNo(info.utilityRequest)" disabled/>
    <label>ไม่เลือก</label>
  </div>

  <!-- ตารางสาธารณูปโภค -->
  <div v-if="isUtilityYes(info.utilityRequest)" class="util-wrap" style="margin-left:80px;">
    <table class="util-table">
      <colgroup>
        <col class="c-label" />
        <col class="c-time" />
        <col class="c-sep" />
        <col class="c-time" />
      </colgroup>
      <tr>
        <td class="util-label">2.1 เปิดเครื่องปรับอากาศตั้งแต่ :</td>
        <td class="time">{{ formatTimeTH(info.turnon_air) }}</td>
        <td class="sep">ถึง</td>
        <td class="time">{{ formatTimeTH(info.turnoff_air) }}</td>
      </tr>
      <tr>
        <td class="util-label">2.2 ไฟฟ้าส่องสว่างตั้งแต่ :</td>
        <td class="time">{{ formatTimeTH(info.turnon_lights) }}</td>
        <td class="sep">ถึง</td>
        <td class="time">{{ formatTimeTH(info.turnoff_lights) }}</td>
      </tr>
      <tr>
        <td class="util-label">2.3 อื่นๆ :</td>
        <td class="other-value" colspan="3">
          {{ info.other && info.other.trim() !== '' ? info.other : '-' }}
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
    <input type="radio" value="yes" :checked="isFacilityYes(info.facilityRequest)" disabled/>
    <label style="margin-right: 18px;">เลือก</label>
    <input type="radio" value="no" :checked="isFacilityNo(info.facilityRequest)" disabled/>
    <label>ไม่เลือก</label>
  </div>

  <div v-if="isFacilityYes(info.facilityRequest)">
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


            <!-- ตารางเซ็นชื่อ 3 ช่อง (ด้านบน) -->
            <table class="sign-header-table">
              <tbody>
                <tr>
                  <td>
                    ลงชื่อ...........................................<br><br>
                    <span style=" white-space: nowrap;">
                                  ( {{ info.proxyStudentName || info.username_form || '-' }} )
                    </span>
                    <br><br>
                    นักศึกษา/ผู้รับผิดชอบ<br><br>
                    วันที่............/............/............
                  </td>
                  <td>
                    ลงชื่อ...........................................<br><br>
                    (.................................................)<br><br>
                    อาจารย์/ที่ปรึกษาโครงการ<br><br>
                    วันที่............/............/............
                  </td>
                  <td>
                    ลงชื่อ...........................................<br><br>
                    (.................................................)<br><br>
                    คณบดี/หัวหน้าหน่วยงาน<br><br>
                    วันที่............/............/............
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- ตารางเซ็นชื่อ 3 ช่อง (ด้านล่าง) -->
            <div class="avoid-break">
              <div class="form-row" style="padding-top: 10px;">
                <table class="approval-sign-table avoid-break">
                  <thead>
                    <tr>
                      <th>1. เลขานุการศูนย์กีฬาฯ</th>
                      <th>2. หัวหน้าศูนย์กีฬาฯ</th>
                      <th>3. อธิการบดี</th>
                    </tr>
                  </thead>
                  <tbody>
  <tr>
    <!-- ช่อง 1 -->
    <td>
      <div class="td-inner">
        <div class="checkbox-line">
          <input type="checkbox" id="chk1-1" disabled>
          <label for="chk1-1">เรียน หัวหน้าศูนย์กีฬาฯ</label>
        </div>
        <div class="checkbox-line">
          <input type="checkbox" id="chk1-2" disabled>
          <label for="chk1-2">เพื่อโปรดพิจารณา</label>
        </div>
        <div class="checkbox-line">
          <input type="checkbox" id="chk1-3" disabled>
          <label for="chk1-3">อื่นๆ</label>
          <span class="dot-line dot-line-custom"></span>
        </div>

        <div class="line-row">(<span class="dot-line short"></span>)</div>
        <div class="line-row"><span class="dot-line short"></span></div>
        <div class="date-row">วันที่ ............/............/............</div>
      </div>
    </td>

    <!-- ช่อง 2 -->
    <td>
      <div class="td-inner">
        <div class="checkbox-line">
          <input type="checkbox" id="chk2-1" disabled>
          <label for="chk2-1">เรียน รองอธิการบดี</label>
        </div>
        <div class="checkbox-line">
          <input type="checkbox" id="chk2-2" disabled>
          <label for="chk2-2">เพื่อโปรดพิจารณา</label>
        </div>
        <div class="checkbox-line">
          <input type="checkbox" id="chk2-3" disabled>
          <label for="chk2-3">อื่นๆ</label>
          <span class="dot-line dot-line-custom"></span>
        </div>

        <div class="line-row">(<span class="dot-line short"></span>)</div>
        <div class="line-row"><span class="dot-line short"></span></div>
        <div class="date-row">วันที่ ............/............/............</div>
      </div>
    </td>

    <!-- ช่อง 3 -->
    <td>
      <div class="td-inner">
        <div class="checkbox-line">
          <input type="checkbox" id="chk3-1" disabled>
          <label for="chk3-1">อนุมัติข้อ</label>
        </div>
        <div class="checkbox-line">
          <input type="checkbox" id="chk3-2" disabled>
          <label for="chk3-2">อื่นๆ</label>
          <span class="dot-line dot-line-custom"></span>
        </div>
        <!-- เติมช่องว่างให้ครบ 3 บรรทัดเหมือนคอลัมน์อื่น -->
        <div class="checkbox-line placeholder"></div>

        <div class="line-row">(<span class="dot-line short"></span>)</div>
        <div class="line-row"><span class="dot-line short"></span></div>
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

// --------------- แจ้งเตือน -----------------
const showNotifications = ref(false)
const notifications = ref([])
const products = ref([])
const unreadCount = ref(0)
const userId = localStorage.getItem('user_id') || ''
const lastCheckedIds = new Set()
const lastSeenTimestamp = ref(parseInt(localStorage.getItem('admin_lastSeenTimestamp') || '0'))
let polling = null

function pruneOldNotifications() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // เก็บแค่ 7 วัน
  notifications.value = notifications.value.filter(n => (n?.timestamp ?? 0) >= cutoff)
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    // เปิด dropdown → เคลียร์ badge
    lastSeenTimestamp.value = Date.now()
    localStorage.setItem('admin_lastSeenTimestamp', String(lastSeenTimestamp.value))
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
  try {
    pruneOldNotifications()
    const res = await axios.get(`${API_BASE}/api/history/approve_field`)
    const data = Array.isArray(res.data) ? res.data : []

    const pendings = data.filter(item =>
      item?.status === 'pending' &&
      (item?.type === 'field' || item?.type === 'equipment')
    )

    if (pendings.length) {
      const newMessages = pendings.map(item => {
        const id = item._id?.$oid || item._id
        const ts =
          (item.updatedAt && new Date(item.updatedAt).getTime()) ??
          (item.createdAt && new Date(item.createdAt).getTime()) ??
          (item.date && new Date(item.date).getTime()) ??
          Date.now()

        return {
          id,
          type: 'pending',
          timestamp: ts,
          message: item.type === 'field'
            ? `สนาม '${item.name}' กำลังรอการอนุมัติ`
            : `อุปกรณ์ '${item.name}' กำลังรอการอนุมัติ`
        }
      })

      notifications.value = [...notifications.value, ...newMessages]
        .filter((v, i, arr) => arr.findIndex(x => (x.id || i) === (v.id || i)) === i)
        .sort((a, b) => b.timestamp - a.timestamp)

      pruneOldNotifications()
    }

    // อัปเดตจำนวน unread
    unreadCount.value = notifications.value.filter(n => n.timestamp > lastSeenTimestamp.value).length
  } catch {
    /* error → เงียบไว้ */
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
const stepRoutes = ['/form_field_admin', '/form_field_admin3', '/form_field_admin4']

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
  router.push({ path: '/form_field_admin', query: { restore: 'true' } })
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

function isUtilityYes(val) { return val === 'yes' }
function isUtilityNo(val) { return val === 'no' }
function isFacilityYes(val) { return val === 'yes' }
function isFacilityNo(val) { return val === 'no' }

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

    if (info.value.utilityRequest === 'เลือก') info.value.utilityRequest = 'yes'
    if (info.value.utilityRequest === 'ไม่เลือก') info.value.utilityRequest = 'no'
    if (info.value.facilityRequest === 'เลือก') info.value.facilityRequest = 'yes'
    if (info.value.facilityRequest === 'ไม่เลือก') info.value.facilityRequest = 'no'

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

async function handleNext() {
  try {
    const bookingId = localStorage.getItem('bookingId')
    if (!bookingId) {
      Swal.fire('ไม่พบ bookingId'); return
    }

    // 1) สร้าง PDF (เลิก base64)
    const pdfBlob = await htmlToPdfBlob('pdf-section')

    // (ให้ผู้ใช้ดาวน์โหลดเหมือนเดิม)
    const url = window.URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = pdfFilename
    document.body.appendChild(link); link.click()
    setTimeout(() => { window.URL.revokeObjectURL(url); link.remove() }, 80)

    // 2) อัปโหลด PDF ไป storage → ได้ URL กลับมา
    const pdfUrl = await uploadPdfBlob(pdfBlob)

    // 3) (ออปชัน) อัปโหลด temp files ที่เพิ่งแนบ (ถ้ายัง)
    const hasTemp = Array.isArray(window._tempSelectedFiles) && window._tempSelectedFiles.length > 0
    const uploadedNow = hasTemp ? await uploadTempFilesAndGetUrls() : []

    // 4) รวมไฟล์ทั้งหมดให้เป็น URL ไม่ใช่ไฟล์จริงหรือ base64
    const bookingData = { ...info.value }
    const multerFiles = Array.isArray(bookingData.files) ? bookingData.files : []
    const allAttachments = [
      ...multerFiles.map(f => f.fileUrl || f.url).filter(Boolean),
      ...uploadedNow.map(f => f.url),
    ]
    const allFileNames = [
      ...multerFiles.map(f => f.originalName || f.fileName || 'ไฟล์แนบ'),
      ...uploadedNow.map(f => f.fileName || 'ไฟล์แนบ'),
    ]

    // 5) ส่ง /api/history โดย “ไม่” แนบ base64
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
      bookingPdfUrl: pdfUrl,     // ✅ ใช้ URL แทน base64
      username_form: bookingData.username_form || localStorage.getItem('username_form') || '',
      id_form:       bookingData.id_form       || localStorage.getItem('id_form')       || '',

    }

    await axios.post(`${API_BASE}/api/history`, payload)

    sessionStorage.removeItem('form_field_save')
    window._tempSelectedFiles = []
    localStorage.removeItem('username_form')
    localStorage.removeItem('id_form')
    router.push('/form_field_admin4')
  } catch (err) {
    if (err?.response?.status === 413) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์รวมใหญ่เกินไป',
        text: 'กรุณาลดจำนวน/ขนาดไฟล์ หรือบีบอัดก่อน แล้วลองอีกครั้ง',
      })
    } else if (err?.response?.status === 409) {
      Swal.fire({ icon: 'warning', title: 'คำขอซ้ำ', text: err.response.data.message || 'คุณมีรายการที่รออนุมัติอยู่แล้ว' })
    } else {
      Swal.fire('เกิดข้อผิดพลาดในการบันทึกข้อมูล', err?.response?.data?.message || err.message, 'error')
    }
    console.error(err)
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
  background: rgba(255, 255, 255, 0.85);   /* เดิม #fff -> ให้จางลง */
  backdrop-filter: blur(2px);               /* เพิ่มความละมุน (รองรับเบราว์เซอร์ส่วนใหญ่) */
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
  padding: 20px 20px 52px;   /* เดิม 20px -> เพิ่ม padding-bottom */
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
  top: 45px;                 /* ระยะห่างจากวงกลม ปรับได้ */
  left: calc(30px / 2);      /* 15px = ครึ่งของเส้นผ่านศูนย์กลางวงกลม */
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

/* คุมความกว้างคอลัมน์คงเดิม */
.util-table col.c-label { width: 240px; }
.util-table col.c-time  { width: 76px; }
.util-table col.c-sep   { width: 34px; }

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
.sign-inner-item input[type="checkbox"] { accent-color: #222; margin-right: 5px; }
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
.checkbox-line input[type="checkbox"] { width: 17px; height: 17px; accent-color: #444; margin: 0 4px 0 0; }
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

.pdf-export {
  /* padding: 18px !important;  <-- ลบ */
  font-size: 16px !important;
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
.approval-sign-table td { padding: 0; }              /* คุมช่องให้เหมือนกัน */
.td-inner{
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 230px;                                     /* เท่าเดิมของคุณ */
  padding: 12px;
  box-sizing: border-box;
}

/* บรรทัด checkbox – ให้สูงคงที่และไม่ตัดบรรทัด */
.checkbox-line{
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;          /* ความสูงเท่ากัน */
  margin: 0 0 8px 0;         /* ระยะห่างด้านล่างเท่ากัน */
  white-space: nowrap;       /* กันข้อความขึ้นบรรทัดใหม่ */
}
.checkbox-line.placeholder{ visibility: hidden; }     /* กินที่แต่ไม่เห็น */

.checkbox-line input[type="checkbox"]{
  width: 17px; height: 17px; margin: 0 4px 0 0; accent-color:#444;
}
.checkbox-line label{ font-size: 15px; }

/* แถวเส้นบรรทัดทั้งสอง (ตรงที่คุณขีดเส้นแดงแถวที่ 1 และ 2) */
.line-row{
  display: flex;
  align-items: center;
  height: 22px;              /* ความสูงคงที่ */
  margin: 6px 0;             /* ระยะบน-ล่างเท่ากัน */
}

/* แถว “วันที่ …/…/…” (เส้นแดงแถวล่างสุด) */
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
.pdf-onepage {
  /* padding: 20px !important;  <-- ลบหรือคอมเมนต์ทิ้ง */
  background: #fff !important;
  box-sizing: border-box;
}

/* กรอบจับภาพ A4 (สร้างตอน export เท่านั้น) */
.a4-capture-wrapper {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* กันข้อความทับกันระหว่างสเกล (โดยเฉพาะฟอนต์ไทย) */
#pdf-section, #pdf-section * {
  line-height: 1.35;            /* ค่าเนียน ๆ สำหรับ TH Sarabun */
}

/* ย่อหน้า “ด้วย …” ให้หายเสี่ยงเกยเวลา scale ลง */
#pdf-section .form-row[style*="text-indent"] {
  line-height: 1.6 !important;  /* เดิม 2.0 ก็ได้ แต่ 1.6 พอดีพื้นที่กว่า */
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
  /* ปรับระยะห่างระหว่างบรรทัดที่นี่ (8–12px แล้วแต่ชอบ) */
  --line-gap: 10px;
  line-height: 1.35; /* ให้เข้ากับ TH Sarabun ที่ตั้งไว้ */
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

/* ตารางยูทิลิตีให้สูงคงที่ทุกแถว เหมือน “บรรทัด” หนึ่งบรรทัด */
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

</style>


<style>
@import '../css/style.css';
</style>