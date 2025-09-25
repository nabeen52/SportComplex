require('dotenv').config();
const fs = require('fs');
const connectDB = require('./db');
connectDB();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const favicon = require('serve-favicon');

// โฟลเดอร์ public ของ frontend (อยู่คนละโฟลเดอร์กับ backend)
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const axios = require('axios');
const mime = require('mime-types');

const multer = require('multer');
const storage = multer.memoryStorage();
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// Models
const Field = require('./models/field');
const User = require('./models/users');
const Equipment = require('./models/equipment');
const Cart = require('./models/cart');
const History = require('./models/history');
const Announcement = require('./models/announcement');
const BookingEquipment = require('./models/booking_equipment');
const ImgNews = require('./models/img_news');
const Information = require('./models/information');
const bcrypt = require('bcrypt');
const UploadFile = require('./models/upload_file');
const BookingField = require('./models/booking_field');
const app = express();
const ICON_PATH = path.resolve(
    'D:\\SportComplex\\SportComplex\\sport\\public\\img\\435-4359797_mae-fah-luang-university-logo-mae-fah-luang-removebg-preview.png'
);

// วางแถวบน ๆ หลัง app = express()
app.use(favicon(ICON_PATH, { maxAge: '10y' }));
app.get('/favicon.ico', (req, res) => res.sendFile(ICON_PATH));

const uploadRoot = path.join(__dirname, 'uploads');
const newsDir = path.join(uploadRoot, 'news');
if (!fs.existsSync(newsDir)) fs.mkdirSync(newsDir, { recursive: true });

const sanitize = (name) => name.replace(/[^\w.-]/g, '_');

const storageNews = multer.diskStorage({
    destination: (req, file, cb) => cb(null, newsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        cb(null, `${Date.now()}_${sanitize(base)}${ext}`);
    }
});

const uploadNews = multer({
    storage: storageNews,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const ok = ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file.originalname).toLowerCase());
        cb(ok ? null : new Error('Only images are allowed'), ok);
    }
});








const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || "YOUR_SUPER_SECRET";
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    }
});
// === Date format helpers (dd/mm/yyyy) ===
const pad2 = (n) => String(n).padStart(2, '0');
const toDate = (v) => (v instanceof Date ? v : new Date(v));
function formatDate(v) {
    if (!v) return '-';
    const d = toDate(v);
    if (isNaN(d)) return '-';
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatDateRange(since, uptodate) {
    return `${formatDate(since)}-${formatDate(uptodate)}`;
}

const returnsDir = path.join(__dirname, 'public', 'uploads', 'returns');
fs.mkdirSync(returnsDir, { recursive: true });

const uploadReturn = multer({ storage: multer.memoryStorage() });

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// ฟังก์ชันส่งอีเมล
async function sendApproveEmail({ to, name, equipment, quantity }) {
    if (!to) return;
    const html = `
    <div>
      <h2>รายการยืมอุปกรณ์ของคุณได้รับการอนุมัติแล้ว</h2>
      <p><b>ชื่อผู้ยืม:</b> ${name || '-'}</p>
      <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
      <p><b>จำนวน:</b> ${quantity || '-'}</p>
      <br>
      <p>กรุณาติดต่อรับอุปกรณ์ที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
    </div>`;
    try {
        return await sendBulk(to, 'แจ้งเตือน: อนุมัติการยืมอุปกรณ์', html);
    } catch (err) { console.error('ส่งเมลไม่สำเร็จ:', err); }
}

// ★ ดึงอีเมล staff/admin/super
async function getStaffEmails() {
    const staff = await User.find({ role: 'staff', email: { $exists: true, $ne: "" } });
    return staff.map(s => s.email);
}
async function getAdminEmails() {
    const admins = await User.find({ role: 'admin', email: { $exists: true, $ne: "" } });
    return admins.map(s => s.email);
}
async function getSuperEmails() {
    const supers = await User.find({ role: 'super', email: { $exists: true, $ne: "" } });
    return supers.map(s => s.email);
}

// ★ ตัวช่วยส่งเมลหลายคน + แปลงรายการเป็น HTML
// ใช้ค่าจาก ENV เป็นหลัก (ถ้าไม่ตั้ง MAIL_FROM จะ default = ชื่อ + MAIL_USER)
const FROM_ADDR =
    process.env.MAIL_FROM && process.env.MAIL_FROM.includes('<')
        ? process.env.MAIL_FROM
        : `"MFU Sport Complex" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`;

const listToHtml = (items = []) =>
    `<ul>${(items || []).map(it => `<li>${it.name || '-'} (จำนวน: ${it.quantity ?? '-'})</li>`).join('')}</ul>`;

async function sendBulk(toList, subject, html) {
    try {
        const to = Array.isArray(toList) ? [...new Set(toList.filter(Boolean))] : [toList];
        if (!to.length) return;
        await transporter.sendMail({ from: FROM_ADDR, to, subject, html });
    } catch (e) {
        console.error('[sendBulk mail error]', e);
    }
}

// ★ ชื่อแสดงผลผู้ใช้จาก user_id (ถ้าไม่มี thaiName ใช้ name/email)
async function getUserDisplayNameById(user_id) {
    try {
        const u = await User.findOne({ user_id });
        return u?.thaiName || u?.name || u?.email || user_id || '';
    } catch (_) { return user_id || ''; }
}

// แจ้งเตือน admin ทุกคนเมื่อมีรายการยืมอุปกรณ์ "หลายวัน"
async function notifyAdminNewBorrow({ requester, items, booking_id }) {
    const adminEmails = await getAdminEmails();
    if (!adminEmails.length) return;
    let itemList = items.map(it => `<li>${it.name} (จำนวน: ${it.quantity})</li>`).join("");
    const html = `
      <div>
        <h2>มีรายการขอยืมอุปกรณ์รออนุมัติ</h2>
        <p><b>ผู้ขอ:</b> ${requester}</p>
        <ul>${itemList}</ul>
        <br>
        <p>กรุณาเข้าสู่ระบบศูนย์กีฬาเพื่ออนุมัติรายการนี้</p>
        <hr>
        <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
      </div>
    `;
    await sendBulk(adminEmails, 'แจ้งเตือน: มีรายการขอยืมอุปกรณ์รออนุมัติ (ยืมหลายวัน)', html);
}
// แจ้งเตือน staff ทุกคนเมื่อมีรายการยืมอุปกรณ์วันเดียว
async function notifyStaffNewBorrow({ requester, items, booking_id }) {
    const staffEmails = await getStaffEmails();
    if (!staffEmails.length) return;
    let itemList = items.map(it => `<li>${it.name} (จำนวน: ${it.quantity})</li>`).join("");
    const html = `
      <div>
        <h2>มีรายการขอยืมอุปกรณ์รออนุมัติ</h2>
        <p><b>ผู้ขอ:</b> ${requester}</p>
        <ul>${itemList}</ul>
        <br>
        <p>กรุณาเข้าสู่ระบบศูนย์กีฬาเพื่ออนุมัติรายการนี้</p>
        <hr>
        <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
      </div>
    `;
    return await sendBulk(staffEmails, 'แจ้งเตือน: มีรายการขอยืมอุปกรณ์รออนุมัติ (ยืมวันเดียว)', html);
}
// Helper: ส่งอีเมลแจ้งเตือนคน approve ว่ามีรายการรอ confirm การคืน
async function notifyApproverReturnPending({ approverId, userName, equipment, quantity, booking_id }) {
    if (!approverId) return;
    const staff = await User.findOne({ user_id: approverId });
    if (!staff || !staff.email) return;
    const html = `
        <div>
            <h2>มีรายการคืนอุปกรณ์ที่รอการยืนยันการคืนจากคุณ</h2>
            <p><b>ชื่อผู้ยืม:</b> ${userName || '-'}</p>
            <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
            <p><b>จำนวน:</b> ${quantity || '-'}</p>
            <br>
            <p>กรุณาตรวจสอบและยืนยันการคืนที่ระบบศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
            <hr>
            <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
        </div>
    `;
    return await sendBulk(staff.email, 'แจ้งเตือน: มีรายการคืนอุปกรณ์รอการยืนยัน', html);
}
// ฟังก์ชันส่งอีเมลแจ้ง user ว่า "ไม่ได้รับการอนุมัติการยืมอุปกรณ์"
async function sendDisapproveEquipmentEmail({ to, name, equipment, quantity }) {
    if (!to) return;
    const html = `
    <div>
      <h2>รายการขอยืมอุปกรณ์ของคุณไม่ได้รับการอนุมัติ</h2>
      <p><b>ชื่อผู้ยืม:</b> ${name || '-'}</p>
      <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
      <p><b>จำนวน:</b> ${quantity || '-'}</p>
      <br>
      <p>หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
    </div>`;
    try {
        return await sendBulk(to, 'แจ้งเตือน: ไม่อนุมัติการยืมอุปกรณ์', html);
    } catch (err) { console.error('ส่งเมลแจ้ง disapprove equipment ไม่สำเร็จ:', err); }
}

// === อีเมลอนุมัติอุปกรณ์แบบ "วันเดียว" ส่งให้ผู้ใช้ทันที ไม่ต้องรอส่งมอบ ===
async function sendApproveEquipmentEmailImmediate({ to, name, itemsHtml, fileUrl }) {
    if (!to) return;
    const html = `
    <div>
      <h2>รายการยืมอุปกรณ์ของคุณได้รับการอนุมัติแล้ว</h2>
      <p><b>ชื่อผู้ยืม:</b> ${name || '-'}</p>
      ${itemsHtml || ''}
      <br>
      <p>โปรดติดต่อรับอุปกรณ์ที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวงในช่วงเวลาที่กำหนด</p>
      <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
    </div>
  `;
    try {
        return await sendBulk(to, 'แจ้งเตือน: อนุมัติการยืมอุปกรณ์ (ยืมวันเดียว)', html);
    } catch (err) {
        console.error('ส่งเมลอนุมัติ (วันเดียว) ไม่สำเร็จ:', err);
    }
}

// ส่งอีเมลแจ้ง user ว่าคืนของสำเร็จแล้ว
// ส่งอีเมลแจ้ง user ว่าคืนของสำเร็จแล้ว (FIXED)
async function sendReturnSuccessEmail({ to, name, equipment, quantity, fileUrl }) {
    if (!to) return;
    const html = `
    <div>
      <h2>การคืนอุปกรณ์ของคุณสำเร็จ</h2>
      <p><b>ชื่อผู้คืน:</b> ${name || '-'}</p>
      <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
      <p><b>จำนวน:</b> ${quantity || '-'}</p>
      ${fileUrl ? `<p><b>เอกสารรับคืน:</b> <a href="${fileUrl}" target="_blank" rel="noopener">เปิดไฟล์</a></p>` : ''}
      <br>
      <p>ขอบคุณที่ใช้บริการศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
      <hr>
      <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
    </div>
  `;
    try {
        return await sendBulk(to, 'แจ้งเตือน: คืนอุปกรณ์สำเร็จ', html);
    } catch (err) {
        console.error('ส่งเมลคืนของสำเร็จไม่สำเร็จ:', err);
    }
}

// แจ้งเตือน admin ทุกคนเมื่อมีรายการขอใช้สนามเข้ามาใหม่ (pending)
async function notifyAdminNewFieldBooking({ requester, building, activity, since, uptodate, zone, booking_id }) {
    const adminEmails = await getAdminEmails();
    if (!adminEmails.length) return;
    const html = `
  <div>
    <h2>มีรายการขออนุมัติใช้สนาม รอพิจารณา</h2>
    <p><b>ผู้ขอ:</b> ${requester || '-'}</p>
    <p><b>อาคาร/สนาม:</b> ${building || '-'}</p>
    <p><b>กิจกรรม:</b> ${activity || '-'}</p>
    <p><b>วันที่:</b> ${formatDateRange(since, uptodate)}</p>
    <p><b>โซน:</b> ${zone || '-'}</p>
    <br>
    <p>กรุณาเข้าสู่ระบบศูนย์กีฬาเพื่ออนุมัติรายการนี้</p>
    <hr>
    <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
  </div>
`;

    return await sendBulk(adminEmails, 'แจ้งเตือน: มีรายการขออนุมัติใช้สนาม', html);
}
// ส่งอีเมลแจ้ง user ว่าได้รับการอนุมัติการขอใช้สนาม
async function sendApproveFieldEmail({ to, name, field, activity, since, uptodate, startTime, endTime, fileUrl }) {
    if (!to) return;
    const html = `
  <div>
    <h2>รายการขอใช้สนามของคุณได้รับการอนุมัติ</h2>
    <p><b>ชื่อผู้ขอ:</b> ${name || '-'}</p>
    <p><b>สนาม:</b> ${field || '-'}</p>
    <p><b>กิจกรรม:</b> ${activity || '-'}</p>
    <p><b>วันที่:</b> ${formatDateRange(since, uptodate)}</p>
    <p><b>เวลา:</b> ${startTime || '-'} ถึง ${endTime || '-'}</p>
    ${fileUrl ? `<p><b>ไฟล์อนุมัติ:</b> <a href="${fileUrl}" target="_blank" rel="noopener">เปิดไฟล์</a></p>` : ''}
    <br>
    <p>ขอบคุณที่ใช้บริการศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
    <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
  </div>`;

    try {
        return await sendBulk(to, 'แจ้งเตือน: การจองสนามของคุณได้รับการอนุมัติ', html);
    } catch (err) { console.error('ส่งเมลแจ้ง approve field ไม่สำเร็จ:', err); }
}

// ส่งอีเมลแจ้ง user ว่าไม่ได้รับการอนุมัติจองสนาม
async function sendDisapproveFieldEmail({ to, name, field, activity, since, uptodate, startTime, endTime }) {
    if (!to) return;
    const html = `
  <div>
    <h2>รายการขอใช้สนามของคุณไม่ได้รับการอนุมัติ</h2>
    <p><b>ชื่อผู้ขอ:</b> ${name || '-'}</p>
    <p><b>สนาม:</b> ${field || '-'}</p>
    <p><b>กิจกรรม:</b> ${activity || '-'}</p>
    <p><b>วันที่:</b> ${formatDateRange(since, uptodate)}</p>
    <p><b>เวลา:</b> ${startTime || '-'} ถึง ${endTime || '-'}</p>
    <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
  </div>`;

    try {
        return await sendBulk(to, 'แจ้งเตือน: ไม่อนุมัติการขอใช้สนาม', html);
    } catch (err) { console.error('ส่งเมลแจ้ง disapprove field ไม่สำเร็จ:', err); }
}
// ฟังก์ชันส่งอีเมลแจ้ง user ว่า "รายการขอใช้สนามของคุณถูกยกเลิก"
async function sendCancelFieldEmail({ to, name, field, activity, since, uptodate, startTime, endTime }) {
    if (!to) return;
    const html = `
  <div>
    <h2>รายการขอใช้สนามของคุณถูกยกเลิก</h2>
    <p><b>ชื่อผู้ขอ:</b> ${name || '-'}</p>
    <p><b>สนาม:</b> ${field || '-'}</p>
    <p><b>กิจกรรม:</b> ${activity || '-'}</p>
    <p><b>วันที่:</b> ${formatDateRange(since, uptodate)}</p>
    <p><b>เวลา:</b> ${startTime || '-'} ถึง ${endTime || '-'}</p>
    <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
  </div>`;

    try {
        return await sendBulk(to, 'แจ้งเตือน: การขอใช้สนามของคุณถูกยกเลิก', html);
    } catch (err) { console.error('ส่งเมลแจ้ง cancel field ไม่สำเร็จ:', err); }
}
async function saveGoogleProfilePic(picUrl, userId) {
    try {
        const response = await axios.get(picUrl, { responseType: 'arraybuffer' });
        const imgPath = path.join(__dirname, 'uploads', `profile-${userId}.jpg`);
        fs.writeFileSync(imgPath, response.data);
        // Return url สำหรับ frontend
        return `/uploads/profile-${userId}.jpg`;
    } catch (e) {
        console.error('Download google profile error:', e.message);
        return null;
    }
}

// STEPPER
// role ชุด fallback
const FALLBACK_ROLE_SETS = {
    field: ['admin', 'super'],
    equipment: ['admin', 'staff'], // multi-day ใช้ชุดนี้
};

const toArr = (v) => Array.isArray(v) ? v : (v ? [v] : []);

function isEmptyLike(v) {
    const s = (v ?? '').toString().trim().toLowerCase();
    return !s || s === 'null' || s === 'undefined';
}
function isEquipmentOneDay(ctx = {}) {
    const t = String(ctx.type || 'equipment').toLowerCase();
    if (t !== 'equipment') return false;
    return isEmptyLike(ctx.since) && isEmptyLike(ctx.uptodate);
}

function clampOneDayStaffOnly(step, ctx) {
    const arr = Array.isArray(step) ? step : [];
    if (String(ctx?.type || '').toLowerCase() !== 'equipment') return arr;
    if (!isEquipmentOneDay(ctx)) return arr;
    const keep = arr.filter(s => String(s?.role || '').toLowerCase() === 'staff');
    // ถ้าไม่มี staff เลย ให้สร้างเปล่าไว้ 1 แถว
    return keep.length ? keep : [{ role: 'staff', approve: null }];
}

// ตรวจว่าเป็น “หลายวัน” หรือไม่ (ต้องมีทั้ง since และ uptodate ที่ไม่ว่าง)
function isMultiDayEquipment(type, since, uptodate) {
    const t = String(type || '').toLowerCase();
    if (t !== 'equipment') return false;
    const s = String(since || '').trim();
    const u = String(uptodate || '').trim();
    return !!(s && u);
}

// ดึงชุด role ตามชนิด + ระยะเวลา (วันเดียว/หลายวัน)
function getRequiredRolesFor(type, ctx) {
    const t = String(type || 'field').toLowerCase();
    if (t === 'equipment' && isEquipmentOneDay(ctx)) return ['staff']; // ← บังคับ

    if (History.ROLE_SETS && History.ROLE_SETS[t]) return History.ROLE_SETS[t];
    if (Array.isArray(History.ALLOWED_STEP_ROLES)) return History.ALLOWED_STEP_ROLES;
    const FALLBACK_ROLE_SETS = { field: ['admin', 'super'], equipment: ['admin', 'staff'] };
    return FALLBACK_ROLE_SETS[t] || ['admin'];
}

// ===== สรุปสถานะรวมจาก step (ใช้ approve) — อิง type + hasPeriod =====
function deriveStatusFromStep(stepArray, type, ctx) {
    const t = String(type || 'field').toLowerCase();
    const steps = Array.isArray(stepArray) ? stepArray : [];

    // ใครกดไม่อนุมัติ -> disapproved
    if (steps.some(s => s?.approve === false)) return 'disapproved';

    const map = new Map(steps.map(s => [String(s.role).toLowerCase(), s.approve]));

    if (t === 'equipment') {
        // ✅ one-day: ให้คง pending จนกว่าจัดการที่ flow ส่งมอบ/รับคืน
        if (isEquipmentOneDay(ctx)) return 'pending';

        // multi-day: admin ผ่านก็ approved
        if (map.get('admin') === true) return 'approved';
        return 'pending';
    }

    // field: ต้องครบทุก role ที่จำเป็น
    const reqRoles = getRequiredRolesFor(t, ctx);
    const allApproved = reqRoles.every(r => map.get(r) === true);
    return allApproved ? 'approved' : 'pending';
}

// ===== แปลง step จาก FE ให้เป็นรูปมาตรฐาน + เติม role ที่ขาด — อิง type + hasPeriod =====
function normalizeIncomingStep(stepArray, type, ctx) {
    const t = String(type || 'field').toLowerCase();

    // ⛔ บังคับกรณี one-day equipment → staff อย่างเดียว
    if (t === 'equipment' && isEquipmentOneDay(ctx)) {
        return [{ role: 'staff', approve: null }];
    }

    // (ของเดิม) ถ้าจะใช้ helper บนโมเดล ก็ใช้ได้กับเคสอื่นเท่านั้น
    if (typeof History.normalizeStepForType === 'function') {
        return History.normalizeStepForType(t, stepArray);
    }
    if (typeof History.withDefaultStep === 'function') {
        return History.withDefaultStep(stepArray);
    }

    // สร้างตาม role ที่จำเป็น
    const reqRoles = getRequiredRolesFor(type, ctx);
    const map = new Map();

    if (Array.isArray(stepArray)) {
        for (const s of stepArray) {
            const role = String(s?.role || '').toLowerCase().trim();
            if (!reqRoles.includes(role)) continue;      // ตัด role เกิน (เช่น admin ใน one-day)
            const approve = (typeof s?.approve === 'boolean')
                ? s.approve
                : (typeof s?.action === 'boolean' ? s.action : null);
            map.set(role, { role, approve });
        }
    }
    for (const r of reqRoles) {
        if (!map.has(r)) map.set(r, { role: r, approve: null });
    }
    return Array.from(map.values());
}

function getRequiredRolesForDoc(doc) {
    return getRequiredRolesFor(doc.type, doc);
}

// ===== อัปเดตผลของ role หนึ่ง (approve true/false) — ดู type + เอกสารวันเดียว/หลายวัน =====
async function updateHistoryStep(
    { id, role, approve, action, actorName = '', remark = '' },
    { syncStatus = true } = {}
) {
    const h = await History.findById(id);
    if (!h) throw new Error('History not found');

    const r = String(role || '').toLowerCase().trim();

    // ตรวจ role ที่อนุญาตตามชนิด/บริบทเอกสาร
    const reqRoles = getRequiredRolesForDoc(h);
    if (!reqRoles.includes(r)) throw new Error('Invalid role');

    // ทำให้ step เป็นรูปมาตรฐานก่อน
    let step = normalizeIncomingStep(h.step, h.type, h);
    const effApprove = (typeof approve === 'boolean') ? approve
        : (typeof action === 'boolean') ? action : null;

    const idx = step.findIndex(s => String(s.role || '').toLowerCase() === r);
    if (idx >= 0) step[idx].approve = effApprove;
    else step.push({ role: r, approve: effApprove });

    // ⛔ เคสอุปกรณ์ "วันเดียว": ล้างทุก role อื่นให้เหลือ staff เท่านั้น
    step = clampOneDayStaffOnly(step, h);
    h.step = step;

    // สถานะ
    if (String(h.type).toLowerCase() === 'equipment') {
        if (!isEquipmentOneDay(h)) {
            if (r === 'admin' && effApprove === true) h.status = 'approved';
            if (effApprove === false) h.status = 'disapproved';
        }
        // ถ้า one-day: ไม่ดันสถานะที่นี่ ปล่อยให้ route ภายนอกเซ็ต (เช่น approve_equipment)
    } else if (syncStatus) {
        h.status = deriveStatusFromStep(step, h.type, h);
    }

    await h.save();
    return h;
}


// ====== Return photo upload (unchanged) ======
const returnsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../public/uploads/return-photos');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const id = req.params.id || 'unknown';
        const ts = Date.now();
        const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
        cb(null, `return_${id}_${ts}${ext}`);
    }
});
const uploadReturnPhoto = multer({ storage: returnsStorage }).single('returnPhoto');

function buildPublicUrl(req, relPath) {
    const base = `${req.protocol}://${req.get('host')}`;
    return relPath.startsWith('/') ? `${base}${relPath}` : `${base}/${relPath}`;
}

// ============ Multer + Static Uploads (upload file to ./uploads) ==========
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Accept-Ranges', 'bytes');
        }
    }
}));

app.set('trust proxy', 1);
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8010',
    'http://localhost:3000',
    'https://reserv-scc.mfu.ac.th',
    'https://reserv-scc.mfu.ac.th/',
    'http://reserv-scc.mfu.ac.th:8010',    // <--- เพิ่มอันนี้
    'https://reserv-scc.mfu.ac.th:8010'    // <--- และอันนี้
];
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json({ limit: '110mb' }));
app.use(express.urlencoded({ limit: '110mb', extended: true }));

//login oauth
app.use(session({
    secret: process.env.SESSION_SECRET || 'YOUR_SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',      // true เฉพาะ prod (https)
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // none เฉพาะ prod
        httpOnly: true,
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.mfu.ac.th' : undefined // ใส่ให้ตรง domain จริง
    }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.user_id));  // หรือ user._id ถ้า MongoDB
passport.deserializeUser(async (id, done) => {
    try {
        // หา user จริงจาก database (ควรใช้ user_id)
        const user = await User.findOne({ user_id: id });
        done(null, user);
    } catch (err) {
        done(err);
    }
});
// สร้าง user_id สำหรับโดเมน @mfu.ac.th ให้ยาว <= 10 และไม่ซ้ำ
async function generateUniqueMfuUserId(originalIdLike) {
    const MAX = 10;
    let base = String(originalIdLike || '').trim();
    if (!base) base = String(Date.now());
    base = base.slice(0, MAX); // ตัดความยาวพื้นฐานให้ <= 10

    // ถ้ายังไม่ชน ใช้ได้เลย
    if (!(await User.exists({ user_id: base }))) return base;

    // ถ้าชน: ลดฐานลง แล้วเติม suffix ให้รวมแล้วไม่เกิน 10
    // เริ่มจากตัดเหลือ 9 ตัว แล้วลองเติมตัวเลข/ตัวอักษร 1 ตัว
    let core = base.slice(0, MAX - 1);
    const candidates = [];
    for (let i = 0; i <= 9; i++) candidates.push(core + i);
    for (let c = 97; c <= 122; c++) candidates.push(core + String.fromCharCode(c)); // a-z

    for (const cand of candidates) {
        if (!(await User.exists({ user_id: cand }))) return cand;
    }

    // fallback แบบสุ่มภายใน 10 ตัว
    for (let i = 0; i < 50; i++) {
        const rand = Math.random().toString(36).slice(2, 2 + (MAX - core.length));
        const cand = (core + rand).slice(0, MAX);
        if (!(await User.exists({ user_id: cand }))) return cand;
    }

    // สุดท้ายจริงๆ
    return core.padEnd(MAX, '0');
}

passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value || '';
            const domainOk = email.endsWith('@mfu.ac.th') || email.endsWith('@lamduan.mfu.ac.th');

            console.log("Google Email Login:", email);
            if (!domainOk) {
                console.log("Reject email:", email);
                return done(null, false, { message: 'อนุญาตเฉพาะอีเมล @mfu.ac.th หรือ @lamduan.mfu.ac.th เท่านั้น' });
            }

            const isLamduan = email.endsWith('@lamduan.mfu.ac.th');
            const isMfu = email.endsWith('@mfu.ac.th');

            // url รูปจาก Google
            const profilePicUrl = profile._json?.picture || '';

            // หา user ตาม email ก่อน
            let user = await User.findOne({ email });

            // === คำนวณ user_id ตามโดเมน ===
            let desiredUserId = null;

            if (isLamduan) {
                // lamduan: เหมือนเดิม ใช้ส่วนหน้า @
                desiredUserId = email.split('@')[0];
            } else if (isMfu) {
                // mfu: “เซตเหมือนเดิม” = อิง profile.id แต่บังคับ ≤ 10 และไม่ซ้ำ
                // - ถ้ามี user เดิมอยู่แล้ว: **ไม่ทับค่าเดิม** (กัน data เปลี่ยน)
                // - ถ้ายังไม่มี: สร้างตามกติกา
                if (!user) {
                    desiredUserId = await generateUniqueMfuUserId(profile.id);
                }
            }

            // ดาวน์โหลด/บันทึกรูป (ชื่อไฟล์อิง user_id ที่จะใช้)
            // ถ้า user เดิมมี user_id อยู่แล้ว ใช้อันนั้นชื่อไฟล์ได้เลย
            const tmpUserIdForPic = desiredUserId || user?.user_id || profile.id || email.split('@')[0];
            let savedPicUrl = null;
            if (profilePicUrl) {
                savedPicUrl = await saveGoogleProfilePic(profilePicUrl, tmpUserIdForPic);
            }

            if (!user) {
                // สร้าง user ใหม่
                user = new User({
                    email,
                    name: profile.displayName,
                    user_id: desiredUserId || (isLamduan ? email.split('@')[0] : String(profile.id).slice(0, 10)),
                    role: 'user',
                    picture: savedPicUrl || profilePicUrl
                });

                // mfu: เผื่อกรณีซ้ำอีกชั้น (อยู่ดีๆ profile.id 10 ตัวซ้ำ)
                if (isMfu) {
                    if (await User.exists({ user_id: user.user_id })) {
                        user.user_id = await generateUniqueMfuUserId(profile.id);
                    }
                }

                await user.save();
            } else {
                // อัปเดตรูปเสมอ
                user.picture = savedPicUrl || profilePicUrl;

                // อัปเดต user_id เฉพาะ lamduan ให้ sync กับหน้า @ (ตามสเปคเดิม)
                if (isLamduan) {
                    const lamduanId = email.split('@')[0];
                    if (user.user_id !== lamduanId) {
                        user.user_id = lamduanId;
                    }
                }

                // mfu: **ไม่เปลี่ยน user_id เดิม** (คงค่าเดิมตามที่เคยมี)
                await user.save();
            }

            return done(null, user);
        } catch (error) {
            console.error("Google OAuth error:", error);
            return done(error, null);
        }
    }
));

function requireLogin(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    res.status(401).json({ success: false, message: 'Not logged in' });
}

function generateToken(user) {
    return jwt.sign({
        user_id: user.user_id,
        role: user.role // เพิ่ม field ที่อยากใช้
    }, SECRET, { expiresIn: '2h' });
}

// Middleware ตรวจ JWT
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.use('/api', (req, res, next) => {
    if (req.path === '/me') return next();
    requireLogin(req, res, next);
});

// ====== OAuth Routes ======
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account'  // <<< บังคับให้ Google ถามเลือกบัญชีใหม่ทุกครั้ง
    })
);
app.post('/auth/login', async (req, res) => {
    // ... ตรวจ user/pass ตามระบบเดิม
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    // ตรวจสอบรหัสผ่าน (ใส่ logic ตามระบบเดิม)
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid login" });
    }
    const token = generateToken(user);
    res.json({ token }); // ส่ง JWT กลับไป frontend
});

// ตัวอย่าง protect route:
app.get('/api/protected', authenticateJWT, (req, res) => {
    res.json({ message: "You are authenticated!", user: req.user });
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8010';
// =================== LOGOUT ===================
app.post('/api/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.status(200).json({ success: true });
        });
    });
});

// Express Route (เพิ่มเข้าไปใน app.js)
app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy(() => {
            // เปลี่ยน wreply= ให้เป็น url ที่กำหนดใน env
            const ssoLogoutUrl = `https://authsso.mfu.ac.th/adfs/ls/?wa=wsignout1.0&wreply=${encodeURIComponent(FRONTEND_URL + '/login?error=logout')}`;
            res.clearCookie('connect.sid');
            res.redirect(ssoLogoutUrl);
        });
    });
});

app.get('/auth/logout-google', (req, res) => {
    const next = encodeURIComponent(`${FRONTEND_URL}/login?error=logout`);
    res.redirect(
        `https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=${next}`
    );
});


app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${FRONTEND_URL}/login?error=not_mfu`,
        session: true
    }),
    (req, res) => {
        res.redirect(`${FRONTEND_URL}/login-success`);
    }
);

app.get('/api/me', (req, res) => {
    console.log("REQ USER:", req.user);
    try {
        if (req.user) {
            res.json({ loggedIn: true, user: req.user });
        } else {
            res.status(401).json({ loggedIn: false });
        }
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message || "Unknown error");
    }
});

function calcTotalHours(since, uptodate, startTime, endTime) {
    if (!since || !uptodate || !startTime || !endTime) return 0;
    const sinceDate = new Date(since);
    const uptodateDate = new Date(uptodate);
    if (isNaN(sinceDate) || isNaN(uptodateDate)) return 0;
    const oneDay = 1000 * 60 * 60 * 24;
    const numDays = Math.floor((uptodateDate - sinceDate) / oneDay) + 1;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    let hourPerDay = ((endHour + endMin / 60) - (startHour + startMin / 60));
    if (hourPerDay < 0) hourPerDay = 0;
    return +(numDays * hourPerDay).toFixed(2);

}

const bookingFieldUpload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './uploads/');
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ตัวเลือก (ถ้าจำเป็น): redirect ถ้ามี bookingPdfUrl
app.get('/api/history/pdfbyurl/:id', async (req, res) => {
    const doc = await History.findById(req.params.id).lean();
    if (!doc || !doc.bookingPdfUrl) return res.status(404).send('Not found');
    return res.redirect(doc.bookingPdfUrl);
});
// GET /api/history/booked?name=<building>&zone=<zone_optional>&from=YYYY-MM-DD&to=YYYY-MM-DD
app.get('/api/history/booked', async (req, res) => {
    try {
        const { name, zone, from, to } = req.query;
        if (!name) return res.status(400).json({ error: 'name (building) is required' });

        const fromDate = from ? new Date(from) : new Date();
        const toDate = to ? new Date(to) : new Date(Date.now() + 180 * 24 * 3600 * 1000); // default 180 วันข้างหน้า

        // เอาเฉพาะที่ “ซ้อนช่วงวัน” กันกับที่ขอ และสถานะ pending/approved
        const criteria = {
            type: 'field',
            name,
            status: { $in: ['pending', 'approved'] },
            since: { $lte: toDate },
            uptodate: { $gte: fromDate }
        };
        // ถ้ามีโซน ให้กรองตามโซน
        if (zone && zone !== '-' && zone !== '') criteria.zone = zone;

        const rows = await History.find(criteria)
            .select('since uptodate startTime endTime zone name')
            .lean();

        res.json(rows.map(r => ({
            since: new Date(r.since),
            uptodate: new Date(r.uptodate),
            startTime: r.startTime || '00:00',
            endTime: r.endTime || '23:59',
            zone: r.zone || ''
        })));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'server error' });
    }
});



// (ถ้ายังไม่ได้มี) ให้เสิร์ฟไฟล์ static ใน public
app.use(express.static(PUBLIC_DIR));



app.use('/uploads/signatures', express.static(path.join(__dirname, 'uploads', 'signatures')));

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);               // ใช้ absolute path
        },
        filename: function (req, file, cb) {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, unique + path.extname(file.originalname));
        }
    }),
    fileFilter: function (req, file, cb) {
        const allowed = ['.png', '.jpg', '.jpeg', '.pdf', '.xls', '.xlsx', '.doc', '.docx'];
        return allowed.includes(path.extname(file.originalname).toLowerCase())
            ? cb(null, true)
            : cb(new Error('Unsupported file type'), false);
    }
});


// -------- Promote Admin/Super --------
// === signatures uploader (allow .gif) ===
const signaturesDir = path.join(uploadRoot, 'signatures');
if (!fs.existsSync(signaturesDir)) fs.mkdirSync(signaturesDir, { recursive: true });

const extFromMime = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/gif': '.gif' };

const signatureStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, signaturesDir),
    filename: (req, file, cb) => {
        const ts = Date.now() + '-' + Math.round(Math.random() * 1e9);
        let ext = (path.extname(file.originalname || '') || '').toLowerCase();
        if (!ext) ext = extFromMime[file.mimetype] || '';
        cb(null, `${ts}${ext}`);
    }
});

const signatureUpload = multer({
    storage: signatureStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ok = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'].includes(file.mimetype);
        cb(ok ? null : new Error('รองรับเฉพาะไฟล์ภาพ png, jpg, jpeg, gif'), ok);
    }
});

app.post('/api/members/promote', signatureUpload.single('signature'), async (req, res) => {
    try {
        const { email, position, thaiName } = req.body || {};
        if (!email || !position || !['Admin', 'Super'].includes(position)) {
            return res.status(400).send({ message: 'ข้อมูลไม่ครบหรือ role ไม่ถูกต้อง' });
        }
        const user = await User.findOne({ email });
        if (!user) return res.status(404).send({ message: 'ไม่พบ user นี้' });

        user.role = position.toLowerCase();
        if (thaiName) user.thaiName = thaiName;
        if (req.file) user.signaturePath = `/uploads/signatures/${req.file.filename}`;

        await user.save();
        res.send({ success: true, data: user });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/members/update-privileged', signatureUpload.single('signature'), async (req, res) => {
    try {
        const { oldEmail, email, position, thaiName } = req.body || {};
        const user = await User.findOne({ email: oldEmail });
        if (!user) return res.status(404).send({ message: 'ไม่พบ user เดิม' });

        if (email) user.email = email;
        if (position) user.role = position.toLowerCase();
        if (thaiName) user.thaiName = thaiName;
        if (req.file) user.signaturePath = `/uploads/signatures/${req.file.filename}`;

        await user.save();
        res.send({ success: true, data: user });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});





app.post('/api/upload', (req, res, next) => {
    upload.single('file')(req, res, function (err) {
        if (err) {
            console.error('[Multer Error /api/upload]:', err);
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const relPath = `/uploads/${req.file.filename}`;
        const fullUrl = `${req.protocol}://${req.get('host')}${relPath}`;
        // ✅ ส่ง alias ให้ครบ ทั้งโค้ดเก่า/ใหม่ใช้ได้
        return res.json({
            success: true,
            fileUrl: fullUrl,
            url: fullUrl,                 // FE รุ่นเก่าที่อ่าน up.data.url จะทำงานได้
            path: relPath,
            filename: req.file.filename,
            mimetype: req.file.mimetype
        });
    });
});


app.post('/api/uploads', (req, res, next) => {
    upload.array('files', 20)(req, res, function (err) {
        if (err) {
            console.error('[Multer Error /api/uploads]:', err);
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }
        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
        const fileUrls = req.files.map(f => baseUrl + f.filename);
        return res.json({ success: true, fileUrls });
    });
});
// ==================== Health Check ====================
app.get('/', (req, res) => res.send('Backend is running!'));

// ==================== Register / Login ====================
app.post('/api/register', (req, res) => {
    res.send({ success: true, message: 'Register completed' });
});

app.post('/api/login', async (req, res) => {
    try {
        let { username, password } = req.body || {};
        if (!username || !password)
            return res.status(400).json({ success: false, message: 'Username/Password required' });

        username = String(username).trim();
        const user = await User.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });
        if (!user) return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });

        const token = generateToken(user);
        res.json({ success: true, token, user_id: user.user_id, role: user.role, name: user.name });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// ==================== User APIs ====================
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.send(users);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.get('/api/users/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.userId });
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.send(user);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.get('/api/users/email/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.send(user);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ==== อัปเดตโปรไฟล์ของผู้ใช้ปัจจุบัน (phone + ลายเซ็นไฟล์) ====
app.patch('/api/users/profile', signatureUpload.single('signature'), async (req, res) => {
    try {
        // ต้อง login แล้วเท่านั้น (มีอยู่ใน app.use('/api', requireLogin) อยู่แล้ว)
        const uid = req.user?.user_id;
        if (!uid) return res.status(401).json({ success: false, message: 'Not logged in' });

        const update = {};
        if (typeof req.body.phone === 'string') {
            update.phone = req.body.phone.trim();
        }
        if (req.file) {
            update.signaturePath = `/uploads/signatures/${req.file.filename}`; // เก็บเป็น path (ไม่ใช่ base64)
        }

        const user = await User.findOneAndUpdate(
            { user_id: uid },
            { $set: update },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// === เพิ่ม API ดูชื่อจาก user_id ===
app.get('/api/user/:user_id', async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id });
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.send({
            name: user.name,
            user_id: user.user_id,
            thaiName: user.thaiName || '',
            picture: user.picture || '',
            signaturePath: user.signaturePath || null
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ==================== Field CRUD ====================
app.get('/api/fields', async (req, res) => {
    try {
        const fields = await Field.find();
        res.send(fields);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.post('/api/fields', async (req, res) => {
    try {
        const { name, image, visible, hasZone, zones } = req.body;
        const field = new Field({
            name,
            image,
            visible,
            hasZone,
            zones: hasZone ? (zones || []) : []
        });
        await field.save();
        res.send({ success: true, data: field });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.patch('/api/fields/:id', async (req, res) => {
    try {
        const updateFields = {};
        ['name', 'image', 'visible', 'hasZone', 'zones'].forEach(key => {
            if (req.body[key] !== undefined) updateFields[key] = req.body[key];
        });
        const updated = await Field.findByIdAndUpdate(req.params.id, updateFields, { new: true });
        if (!updated) return res.status(404).send({ success: false, message: 'ไม่พบสนาม' });
        res.send({ success: true, data: updated });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.delete('/api/fields/:id', async (req, res) => {
    try {
        const deleted = await Field.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).send({ message: 'ไม่พบสนาม' });
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.post('/api/fields/:fieldId/zones', async (req, res) => {
    try {
        const { name, image, status, active } = req.body;
        const field = await Field.findById(req.params.fieldId);
        if (!field) return res.status(404).send({ message: 'ไม่พบสนาม' });
        field.hasZone = true;
        field.zones.push({ name, image, status, active });
        await field.save();
        res.send({ success: true, data: field });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.patch('/api/fields/:fieldId/zones/:zoneIndex', async (req, res) => {
    try {
        const field = await Field.findById(req.params.fieldId);
        if (!field) return res.status(404).send({ message: 'ไม่พบสนาม' });
        const z = parseInt(req.params.zoneIndex);
        if (!field.zones[z]) return res.status(404).send({ message: 'ไม่พบโซน' });
        ['name', 'image', 'status', 'active'].forEach(key => {
            if (req.body[key] !== undefined) field.zones[z][key] = req.body[key];
        });
        await field.save();
        res.send({ success: true, data: field });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.delete('/api/fields/:fieldId/zones/:zoneIndex', async (req, res) => {
    try {
        const field = await Field.findById(req.params.fieldId);
        if (!field) return res.status(404).send({ message: 'ไม่พบสนาม' });
        const z = parseInt(req.params.zoneIndex);
        if (!field.zones[z]) return res.status(404).send({ message: 'ไม่พบโซน' });
        field.zones.splice(z, 1);
        await field.save();
        res.send({ success: true, data: field });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ==================== Equipment CRUD ====================
app.get('/api/equipments', async (req, res) => {
    try {
        const equipments = await Equipment.find();
        res.send(equipments);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.post('/api/equipments', async (req, res) => {
    try {
        const { name, quantity, image, visible } = req.body;
        const equipment = new Equipment({ name, quantity, image, visible });
        await equipment.save();
        res.send({ success: true, data: equipment });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});
app.patch('/api/equipments/:id', async (req, res) => {
    try {
        const updateFields = {};
        if (req.body.quantity !== undefined) updateFields.quantity = req.body.quantity;
        if (req.body.name !== undefined) updateFields.name = req.body.name;
        if (req.body.image !== undefined) updateFields.image = req.body.image;
        if (req.body.visible !== undefined) updateFields.visible = req.body.visible;
        const updated = await Equipment.findByIdAndUpdate(req.params.id, updateFields, { new: true });
        if (!updated) return res.status(404).send({ success: false, message: 'ไม่พบอุปกรณ์' });
        res.send({ success: true, data: updated });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});
app.delete('/api/equipments/:id', async (req, res) => {
    try {
        const deleted = await Equipment.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).send({ success: false, message: 'ไม่พบอุปกรณ์' });
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

// ==================== Cart CRUD ====================
app.get('/api/cart', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).send({ message: "user_id is required" });
        }
        const cart = await Cart.find({ user_id });
        res.send(cart);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.post('/api/cart', async (req, res) => {
    try {
        const { user_id, name, quantity, image } = req.body;
        if (!user_id || !name || !quantity) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
        }
        // **ถ้ามีอยู่แล้วให้ update ปริมาณ**
        let cartItem = await Cart.findOne({ user_id, name });
        if (cartItem) {
            cartItem.quantity += Number(quantity);
            await cartItem.save();
        } else {
            cartItem = new Cart({ user_id, name, quantity, image });
            await cartItem.save();
        }
        res.send({ success: true, message: 'Added to cart', cartItem });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

app.delete('/api/cart', async (req, res) => {
    try {
        const user_id = req.body?.user_id || req.query?.user_id;
        if (user_id) {
            await Cart.deleteMany({ user_id });
        } else {
            await Cart.deleteMany({});
        }
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.put('/api/cart/update', async (req, res) => {
    const { user_id, name, quantity } = req.body;
    try {
        await Cart.updateOne({ user_id, name }, { $set: { quantity } });
        res.sendStatus(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.delete('/api/cart/delete', async (req, res) => {
    const { user_id, name } = req.body;
    try {
        await Cart.deleteOne({ user_id, name });
        res.sendStatus(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.patch('/api/users/update_id', async (req, res) => {
    try {
        const { old_user_id, new_user_id } = req.body;
        if (!old_user_id || !new_user_id) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ user_id เดิมและใหม่' });
        }

        // หา user เดิม
        const user = await User.findOne({ user_id: old_user_id });
        if (!user) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
        }

        // เช็คว่า user_id ใหม่ ซ้ำกับคนอื่นไหม
        const exist = await User.findOne({ user_id: new_user_id });
        if (exist) {
            return res.status(400).json({ success: false, message: 'user_id นี้ถูกใช้ไปแล้ว' });
        }

        // อัปเดต user_id
        user.user_id = new_user_id;
        await user.save();

        res.json({ success: true, message: 'อัปเดต user_id สำเร็จ', user });
    } catch (err) {
        console.error('Update user_id error:', err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
    }
});
// ==================== History (Borrow/Return/Approve/Disapprove) ====================
// ================== POST /api/history ==================

// ============ CREATE HISTORY ============
// ============ CREATE HISTORY ============
// ============ CREATE HISTORY ============
app.post('/api/history', async (req, res) => {
    try {
        const body = req.body || {};
        const type = String(body.type || 'field').toLowerCase();

        // helpers เฉพาะ route
        const toArr = (v) => Array.isArray(v) ? v : (v ? [v] : []);
        const isEmptyLike = (v) => {
            const s = (v ?? '').toString().trim().toLowerCase();
            return !s || s === 'null' || s === 'undefined';
        };
        const keepStaffOnly = [{ role: 'staff', approve: null }];

        // one-day (equipment) → บังคับให้มีแค่ role 'staff'
        const step =
            (type === 'equipment' && isEquipmentOneDay(body))
                ? keepStaffOnly
                : normalizeIncomingStep(body.step, type, body);

        const status = body.status || deriveStatusFromStep(step, type, body) || 'pending';

        const doc = await History.create({
            user_id: body.user_id,
            type,
            status,
            name: body.name,
            name_active: body.name_active,
            zone: body.zone,
            since: isEmptyLike(body.since) ? null : body.since,
            uptodate: isEmptyLike(body.uptodate) ? null : body.uptodate,
            startTime: body.startTime || '',
            endTime: body.endTime || '',
            quantity: body.quantity,
            date: body.date ? new Date(body.date) : new Date(),
            agency: body.agency || '',
            booking_id: body.booking_id || null,
            attachment: toArr(body.attachment),
            fileName: toArr(body.fileName),
            fileType: toArr(body.fileType),
            fileUrl: body.fileUrl || '',
            bookingPdfUrl: body.bookingPdfUrl || '',
            bookingPdf: body.bookingPdf || null,
            proxyStudentName: body.proxyStudentName || '',
            proxyStudentId: body.proxyStudentId || '',
            username_form: body.username_form || '',
            id_form: body.id_form || '',
            utilityRequest: body.utilityRequest || '',
            facilityRequest: body.facilityRequest || '',
            turnon_air: body.turnon_air || '',
            turnoff_air: body.turnoff_air || '',
            turnon_lights: body.turnon_lights || '',
            turnoff_lights: body.turnoff_lights || '',
            amphitheater: body.amphitheater || '',
            need_equipment: body.need_equipment || '',
            other: body.other || '',
            aw: body.aw || '',
            tel: body.tel || '',
            reasons: body.reasons || '',
            participants: body.participants || '',
            requester: body.requester || '',
            no_receive: body.no_receive || '',
            date_receive: body.date_receive || null,
            receiver: body.receiver || '',
            restroom: body.restroom || '',
            receive_date: body.receive_date || null,
            receive_time: body.receive_time || '',
            createdAt_old: body.createdAt_old || null,
            reason_admin: body.reason_admin || '',
            secretary_choice: {
                to_head: !!(body.secretary_choice?.to_head),
                for_consider: !!(body.secretary_choice?.for_consider),
                other_checked: !!(body.secretary_choice?.other_checked),
            },
            thaiName_admin: body.thaiName_admin || '',
            signaturePath_admin: body.signaturePath_admin || '',
            superApprovedBy: body.superApprovedBy || '',
            superApprovedById: body.superApprovedById || '',
            superApprovedAt: body.superApprovedAt || null,
            to_vice_supervisor: !!body.to_vice_supervisor,
            for_consider_supervisor: !!body.for_consider_supervisor,
            other_checked_supervisor: !!body.other_checked_supervisor,
            reason_supervisor: body.reason_supervisor || '',
            thaiName_supervisor: body.thaiName_supervisor || '',
            signaturePath_supervisor: body.signaturePath_supervisor || '',
            approvedAt_supervisor: body.approvedAt_supervisor || null,
            head_choice_supervisor: {
                to_vice_supervisor: !!(body.head_choice_supervisor?.to_vice_supervisor),
                for_consider_supervisor: !!(body.head_choice_supervisor?.for_consider_supervisor),
                other_checked_supervisor: !!(body.head_choice_supervisor?.other_checked_supervisor),
            },
            handoverById: body.handoverById || '',
            handoverBy: body.handoverBy || '',
            handoverAt: body.handoverAt || null,
            handoverRemarkSender: body.handoverRemarkSender || '',
            handoverRemarkReceiver: body.handoverRemarkReceiver || '',
            handoverReceiverThaiName: body.handoverReceiverThaiName || '',
            handoverReceiverDate: body.handoverReceiverDate || null,
            condition: body.condition || '',
            returnPhoto: body.returnPhoto || null,
            step,
        });

        // บังคับ one-day ให้เหลือ staff อย่างเดียว (กัน hook เก่า)
        if (type === 'equipment' && isEquipmentOneDay(body)) {
            const onlyStaff =
                Array.isArray(doc.step) &&
                doc.step.length === 1 &&
                String(doc.step[0]?.role).toLowerCase() === 'staff';
            if (!onlyStaff) {
                await History.updateOne({ _id: doc._id }, { $set: { step: keepStaffOnly } });
                doc.step = keepStaffOnly;
            }
        }

        // === ส่งเมลแจ้งเตือนตามชนิดคำขอ (ย้ายมาก่อนการตอบกลับ) ===
        try {
            const requesterName = await getUserDisplayNameById(doc.user_id);
            if (doc.type === 'field') {
                await notifyAdminNewFieldBooking({
                    requester: requesterName,
                    building: doc.name,
                    activity: doc.name_active,
                    since: doc.since,
                    uptodate: doc.uptodate,
                    zone: doc.zone,
                    booking_id: doc.booking_id
                });
            } else if (doc.type === 'equipment') {
                const items = [{ name: doc.name, quantity: doc.quantity }];
                if (isSingleDay(doc)) {
                    // วันเดียว → แจ้ง staff
                    await notifyStaffNewBorrow({ requester: requesterName, items, booking_id: doc.booking_id });
                } else {
                    // หลายวัน → แจ้ง admin (แก้ปัญหาอีเมลไม่เข้า)
                    await notifyAdminNewBorrow({ requester: requesterName, items, booking_id: doc.booking_id });
                }
            }
        } catch (mailErr) {
            console.error('notify on create history error:', mailErr);
        }

        // ✅ ค่อยตอบกลับหลังส่งเมล
        return res.status(201).json(doc);
    } catch (err) {
        console.error('POST /api/history error:', err);
        return res.status(400).json({ message: err.message || 'Create history failed' });
    }
});








// ================== PATCH /api/history/:id/step ==================
// body: { role?: string, approve?: true|false|null, action?: true|false|null, remark?: string, syncStatus?: boolean }
app.patch('/api/history/:id/step', async (req, res) => {
    try {
        const id = req.params.id;

        // รองรับทั้ง approve (ใหม่) และ action (เก่า)
        const approve = (typeof req.body.approve === 'boolean')
            ? req.body.approve
            : (typeof req.body.action === 'boolean' ? req.body.action : null);

        const remark = typeof req.body.remark === 'string' ? req.body.remark : '';
        const syncStatus = req.body.syncStatus !== false; // default true

        const actorRole = String(req.body.role || (req.user?.role || '')).toLowerCase();
        const actorName = (req.user?.name || req.user?.email || req.user?.user_id || '').toString();

        const updated = await updateHistoryStep({
            id,
            role: actorRole,
            approve,        // ✅ ใช้ approve
            actorName,
            remark
        }, { syncStatus });

        res.json(updated);
    } catch (err) {
        console.error('PATCH /api/history/:id/step error:', err);
        res.status(400).json({ message: err.message || 'Update step failed' });
    }
});




app.get('/api/history', async (req, res) => {
    try {
        const filter = {};
        if (req.query.user_id) filter.user_id = req.query.user_id;
        if (req.query.booking_id) filter.booking_id = req.query.booking_id;

        const histories = await History.find(filter).lean();
        console.log("All histories:", histories.map(h => ({ name: h.name, user_id: h.user_id, type: h.type, status: h.status })));

        const userIds = histories.map(h => h.user_id);
        const users = await User.find({ user_id: { $in: userIds } }).lean();
        const userMap = {};
        users.forEach(u => userMap[u.user_id] = u.name);

        histories.forEach(h => {
            // สร้าง timestamp จาก ObjectId (แบบ new)
            const timestamp = new mongoose.Types.ObjectId(h._id).getTimestamp();

            let sortDate;
            if (h.type === 'field' && h.date && h.startTime) {
                sortDate = new Date(`${h.date}T${h.startTime}`);
            } else if (h.approvedAt) {
                sortDate = new Date(h.approvedAt);
            } else {
                sortDate = timestamp;
            }

            h.sortDate = sortDate;
            h.requester = userMap[h.user_id] || h.user_id;

            // ✅ เลือกลิงก์เดียวที่เปิดได้จริง ใส่ไว้ที่ h.fileUrl
            if (h.bookingPdfUrl && typeof h.bookingPdfUrl === 'string' && h.bookingPdfUrl.trim()) {
                h.fileUrl = h.bookingPdfUrl;
            } else if (Array.isArray(h.attachment) && h.attachment.length && typeof h.attachment[0] === 'string') {
                h.fileUrl = h.attachment[0];
            } else if (typeof h.attachment === 'string' && h.attachment.trim()) {
                h.fileUrl = h.attachment;
            } else {
                h.fileUrl = null;
            }
        });

        // เรียงจากใหม่ไปเก่า โดยใช้ sortDate รวมทั้งสนามและอุปกรณ์
        histories.sort((a, b) => b.sortDate - a.sortDate);

        res.send(histories);
    } catch (err) {
        console.error('Error in /api/history:', err);
        res.status(500).send({ message: err.message });
    }
});


app.delete('/api/history/:id', async (req, res) => {
    try {
        const deleted = await History.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).send({ message: 'Not found' });
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
// == Return equipment (keep ALL original fields) ==
app.patch('/api/history/:id/return', async (req, res) => {
    try {
        const id = req.params.id;

        // ===== payload จาก FE =====
        const staffId = String(req.body.staff_id || '').trim();
        const condition = String(req.body.condition || req.body.status || 'good').toLowerCase();
        const remark = String(req.body.remark || '').trim();

        // ฝั่งผู้รับคืน
        const receiverThaiName = String(req.body.handoverReceiverThaiName || req.body.receiverThaiName || '').trim();
        const receiverDateStr = String(req.body.handoverReceiverDate || req.body.receiverDate || '').trim();

        // PDF (เก็บเฉพาะช่อง PDF, ไม่ยุ่งกับ attachment เดิม)
        const pdfUrl = String(req.body.bookingPdfUrl || req.body.booking_pdf_url || '').trim();
        const pdfFileName =
            (Array.isArray(req.body.pdfFileName) ? req.body.pdfFileName[0] : req.body.pdfFileName) ||
            (Array.isArray(req.body.fileName) ? req.body.fileName[0] : req.body.fileName) ||
            'equipment_return.pdf';
        const pdfFileType =
            (Array.isArray(req.body.fileType) ? req.body.fileType[0] : req.body.fileType) ||
            'application/pdf';

        // ===== โหลดเอกสาร =====
        const doc = await History.findById(id);
        if (!doc) return res.status(404).json({ message: 'Not found' });

        // idempotent: ถ้า returned แล้วให้จบ (กันบวกสต็อกซ้ำ)
        if ((doc.status || '').toLowerCase() === 'returned') {
            return res.status(200).json(doc);
        }

        // ===== บวกสต็อกคืน (เฉพาะอุปกรณ์) =====
        if ((doc.type || '').toLowerCase() === 'equipment' && doc.name && doc.quantity) {
            await Equipment.updateOne(
                { name: (doc.name || '').trim() },
                { $inc: { quantity: Math.abs(Number(doc.quantity) || 0) } }
            );
        }

        // ชื่อผู้รับคืน (staff)
        let returnedBy = staffId;
        if (staffId) {
            const staff = await User.findOne({ user_id: staffId });
            returnedBy = (staff && (staff.thaiName || staff.name)) || staffId;
        }

        const now = new Date();
        const receiverDate = receiverDateStr
            ? (isNaN(new Date(receiverDateStr)) ? now : new Date(receiverDateStr))
            : now;

        // ===== เตรียม $set (ไม่แตะ attachment/fileName/fileType เดิม) =====
        const set = {
            status: 'returned',             // << บังคับเป็น returned
            condition,                      // 'good' | 'bad'
            returnedById: staffId || doc.returnedById || '',
            returnedBy: returnedBy || doc.returnedBy || '',
            returnedAt: now,

            // 🟢 หมายเหตุฝั่งผู้รับคืน
            ...(remark ? { handoverRemarkReceiver: remark, remark } : {}),

            // หลายวัน (ถ้า FE ส่งมาให้ย้ำกลับ)
            ...(req.body.since ? { since: req.body.since } : {}),
            ...(req.body.uptodate ? { uptodate: req.body.uptodate } : {}),

            // single-day (ถ้า FE ส่งรูปใหม่มา)
            ...(req.body.returnPhoto ? { returnPhoto: req.body.returnPhoto } : {}),

            // ผู้รับคืน
            ...(receiverThaiName ? { handoverReceiverThaiName: receiverThaiName } : {}),
            handoverReceiverDate: receiverDate,

            // เก็บเฉพาะช่อง PDF ล่าสุด
            ...(pdfUrl ? { bookingPdfUrl: pdfUrl, pdfFileName, pdfFileType } : {}),

            // ✅ step ให้มีเฉพาะ staff และ approve แล้ว
            step: [{
                role: 'staff',
                approve: true,
                approvedAt: now,
                updatedAt: now,
                ...(staffId ? { staffId } : {})
            }],

            updatedAt: now
        };

        const saved = await History.findByIdAndUpdate(id, { $set: set }, { new: true });

        // ===== แจ้งผู้ยืม (ถ้ามีอีเมล) =====
        try {
            const user = await User.findOne({ user_id: saved.user_id });
            if (user?.email) {
                await sendReturnSuccessEmail({
                    to: user.email,
                    name: user.thaiName || user.name || user.email || saved.user_id,
                    equipment: saved.name,
                    quantity: saved.quantity,
                     fileUrl: saved.bookingPdfUrl || ''   // << แนบลิงก์ไฟล์รับคืนถ้ามี
                });
            }
        } catch (mailErr) {
            console.error('[send return mail error]', mailErr.message);
        }

        return res.json(saved);
    } catch (err) {
        console.error('request /return error:', err);
        return res.status(500).json({ message: err.message || 'Server error' });
    }
});



// === สร้างคำขอคืน: สร้างเอกสารใหม่ (ไม่แก้ของเดิม) ===
app.patch('/api/history/:id/request-return', uploadReturn.single('returnPhoto'), async (req, res) => {
    try {
        const oldRecord = await History.findById(req.params.id);
        if (!oldRecord) return res.status(404).json({ message: 'Not found' });

        // ต้องเป็นอุปกรณ์เท่านั้น
        const t = String(oldRecord.type || '').toLowerCase();
        if (t !== 'equipment') {
            return res.status(400).json({ message: 'ไม่ใช่รายการอุปกรณ์' });
        }

        // ---- รับรูปคืนจาก multipart หรือ base64 ----
        let buffer, ext = 'jpg', mimeType = 'image/jpeg';

        if (req.file && req.file.buffer) {
            buffer = req.file.buffer;
            mimeType = req.file.mimetype || 'image/jpeg';
            ext = mime.extension(mimeType) || 'jpg';
        } else if (req.body && typeof req.body.returnPhoto === 'string' &&
            /^data:image\/(png|jpe?g);base64,/i.test(req.body.returnPhoto)) {
            const m = req.body.returnPhoto.match(/^data:image\/(png|jpe?g);base64,/i);
            ext = (m && m[1] === 'jpeg') ? 'jpg' : (m && m[1]) || 'jpg';
            mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            buffer = Buffer.from(req.body.returnPhoto.split(',')[1], 'base64');
        } else {
            return res.status(400).json({ error: 'No return photo provided' });
        }

        // ---- เซฟไฟล์ลง /public/uploads/returns ----
        await fs.promises.mkdir(returnsDir, { recursive: true });
        const fname = `return_${oldRecord.booking_id || oldRecord._id}_${Date.now()}.${ext}`;
        const fpath = path.join(returnsDir, fname);
        await fs.promises.writeFile(fpath, buffer);
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/returns/${fname}`;

        // ---- helper ----
        const toArr = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []);
        const pick = (k, def = '') => (req.body[k] ?? oldRecord[k] ?? def);

        // คงไฟล์เดิม (ถ้ามี)
        const oldAttachment = toArr(oldRecord.attachment);
        const oldFileName = toArr(oldRecord.fileName);
        const oldFileType = toArr(oldRecord.fileType);

        // createdAt เดิม (รับจาก FE เป็น createdAt_old ได้ หรือคงของเดิม)
        let createdAtOld = null;
        if (req.body.createdAt_old) {
            const d = new Date(req.body.createdAt_old);
            if (!isNaN(d)) createdAtOld = d;
        } else if (oldRecord.createdAt) {
            createdAtOld = new Date(oldRecord.createdAt);
        }

        // ฟิลด์ handover (ถ้ามี)
        const handoverById = req.body.handoverById ?? req.body.staff_id ?? oldRecord.handoverById ?? '';
        const handoverBy = req.body.handoverBy ?? req.body.handover_by ?? oldRecord.handoverBy ?? '';
        const handoverRemarkSender = req.body.handoverRemarkSender ?? req.body.handover_remark_sender ?? oldRecord.handoverRemarkSender ?? '';
        const handoverRemarkReceiver = req.body.handoverRemarkReceiver ?? req.body.handover_remark_receiver ?? oldRecord.handoverRemarkReceiver ?? '';
        const handoverAt = req.body.handoverAt ? new Date(req.body.handoverAt) : (oldRecord.handoverAt || null);

        // ---- เตรียมเอกสารใหม่ (บังคับสถานะ + step ตามโจทย์) ----
        const now = new Date();
        const docData = {
            user_id: oldRecord.user_id,
            booking_id: oldRecord.booking_id || null,
            type: 'equipment',
            name: oldRecord.name,
            quantity: oldRecord.quantity,

            date: now,
            since: oldRecord.since || null,
            uptodate: oldRecord.uptodate || null,
            startTime: oldRecord.startTime || '',
            endTime: oldRecord.endTime || '',

            // <<<< สำคัญ
            status: 'return-pending',
            step: [{ role: 'staff', approve: null }],   // มีแค่ staff เท่านั้น

            // คงไฟล์เดิม
            ...(oldAttachment.length ? { attachment: oldAttachment } : {}),
            ...(oldFileName.length ? { fileName: oldFileName } : {}),
            ...(oldFileType.length ? { fileType: oldFileType } : {}),

            // เก็บรูปคืนที่เพิ่งถ่าย
            returnPhoto: fileUrl,

            createdAt_old: createdAtOld,

            zone: pick('zone'),
            agency: pick('agency'),
            username_form: pick('username_form'),
            id_form: pick('id_form'),
            proxyStudentName: pick('proxyStudentName'),
            proxyStudentId: pick('proxyStudentId'),
            bookingPdf: pick('bookingPdf', null),
            bookingPdfUrl: pick('bookingPdfUrl', null),
            name_active: pick('name_active'),
            remark: pick('remark', ''),

            // ผู้อนุมัติเดิม (ไว้ดูย้อนหลัง)
            approvedBy: oldRecord.approvedBy || '',
            approvedById: oldRecord.approvedById || '',

            // ข้อมูลการส่งมอบ (ถ้ามี)
            handoverById,
            handoverBy,
            handoverAt,
            handoverRemarkSender,
            handoverRemarkReceiver,

            // ข้าม middleware ของ Mongoose -> ใส่ timestamps เอง
            createdAt: now,
            updatedAt: now
        };

        // ⬇ ใช้ insertOne เพื่อ "ข้าม" pre-save hooks ที่อาจเปลี่ยน status/step
        const ins = await History.collection.insertOne(docData);
        const newDoc = await History.findById(ins.insertedId);

        // แจ้ง staff ทั้งหมดให้ตรวจรับคืน
        try {
            const staffEmails = await getStaffEmails();
            if (staffEmails.length) {
                const borrower = await User.findOne({ user_id: oldRecord.user_id });
                const userName = borrower?.thaiName || borrower?.name || borrower?.email || borrower?.user_id || '';
                const itemsHtml = listToHtml([{ name: oldRecord.name, quantity: oldRecord.quantity }]);
                await sendBulk(
                    staffEmails,
                    'แจ้งเตือน: มีรายการคืนอุปกรณ์รอการยืนยัน',
                    `
            <div>
              <h2>มีรายการคืนอุปกรณ์รอการยืนยัน</h2>
              <p><b>ชื่อผู้คืน:</b> ${userName}</p>
              ${itemsHtml}
              <p><b>หลักฐานภาพถ่าย:</b> <a href="${newDoc.returnPhoto}" target="_blank" rel="noopener">เปิดดูรูป</a></p>
              <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
            </div>
          `
                );
            }
        } catch (mailErr) {
            console.error('[notify staff on return-pending] error:', mailErr.message);
        }

        return res.status(201).json({ success: true, doc: newDoc });
    } catch (err) {
        console.error('request-return error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});



// ================== PATCH /api/history/:id/handover ==================
app.patch('/api/history/:id/handover', async (req, res) => {
    try {
        const body = req.body || {};

        const handoverById = (body.handoverById || body.staff_id || '').toString().trim();
        const handoverByName = (body.handoverByName || body.thai_name || '').toString().trim();
        const handoverAt = body.handoverAt;
        const remarkSender = (body.remarkSender || body.remark_sender || '').toString().trim();
        const remarkReceiver = (body.remarkReceiver || body.remark_receiver || '').toString().trim();
        const booking_id = body.booking_id ? String(body.booking_id) : null;

        const bookingPdfUrl = (body.bookingPdfUrl || '').toString().trim();

        let finalName = handoverByName;
        if (!finalName && handoverById) {
            const u = await User.findOne({ user_id: handoverById }).lean();
            finalName =
                (u?.thaiName && String(u.thaiName).trim()) ||
                (u?.name && String(u.name).trim()) ||
                handoverById;
        }

        const setDoc = {
            handoverById: handoverById || '',
            handoverBy: finalName || '',
            handoverAt: handoverAt ? new Date(handoverAt) : new Date(),
            ...(remarkSender ? { handoverRemarkSender: remarkSender } : {}),
            ...(remarkReceiver ? { handoverRemarkReceiver: remarkReceiver } : {}),
            ...(bookingPdfUrl
                ? {
                    bookingPdfUrl: bookingPdfUrl,
                    bookingPdf: bookingPdfUrl,
                    booking_pdf_url: bookingPdfUrl,
                }
                : {}),
        };

        let matched = 0,
            modified = 0,
            docs = [];

        if (booking_id) {
            const result = await History.updateMany(
                { type: 'equipment', booking_id, status: { $in: ['approved', 'Approved'] } },
                { $set: setDoc }
            );
            matched = result.matchedCount ?? result.nMatched ?? 0;
            modified = result.modifiedCount ?? result.nModified ?? 0;

            const affected = await History.find(
                { type: 'equipment', booking_id },
                { _id: 1, name: 1, quantity: 1, user_id: 1 }
            ).lean();
            docs = affected;

            // ✅ อัปเดต step: staff ส่งมอบแล้ว
            for (const h of affected) {
                try {
                    await updateHistoryStep(
                        { id: h._id, role: 'staff', approve: true, actorName: finalName },
                        { syncStatus: true }
                    );
                } catch (e) {
                    console.error(`update step staff handover ${h._id} error:`, e.message);
                }
            }
        } else {
            const updated = await History.findByIdAndUpdate(
                req.params.id,
                { $set: setDoc },
                { new: true }
            );
            if (!updated) return res.status(404).json({ message: 'Not found' });
            matched = modified = 1;

            // 👈 เติม user_id ด้วย เพื่อใช้ร่วมกับเคส booking_id ได้
            docs = [
                {
                    _id: updated._id,
                    name: updated.name,
                    quantity: updated.quantity,
                    booking_id: updated.booking_id,
                    user_id: updated.user_id,
                },
            ];

            try {
                await updateHistoryStep(
                    { id: updated._id, role: 'staff', approve: true, actorName: finalName },
                    { syncStatus: true }
                );
            } catch (e) {
                console.error(`update step staff handover single ${updated._id} error:`, e.message);
            }
        }

        // ===== ส่งอีเมลถึงผู้ยืมว่า "ส่งมอบแล้ว" (ทำงานทั้งสองเคส) =====
        try {
            const borrowerUserId =
                docs?.[0]?.user_id ||
                (await History.findById(req.params.id).lean())?.user_id ||
                null;

            const itemsForMail = docs.map((d) => ({ name: d.name, quantity: d.quantity }));

            if (borrowerUserId) {
                const borrower = await User.findOne({ user_id: borrowerUserId }).lean();
                if (borrower?.email) {
                    const borrowerName =
                        borrower?.thaiName || borrower?.name || borrower?.email || borrower?.user_id || '';
                    const itemsHtml = listToHtml(itemsForMail);

                    await sendBulk(
                        borrower.email,
                        'แจ้งเตือน: เจ้าหน้าที่ได้ส่งมอบอุปกรณ์ให้คุณแล้ว',
                        `
            <div>
              <h2>สถานะการยืมอุปกรณ์: ส่งมอบเรียบร้อย</h2>
              <p><b>ผู้รับมอบ:</b> ${borrowerName}</p>
              ${itemsHtml}
              ${bookingPdfUrl ? `<p><b>เอกสาร:</b> <a href="${bookingPdfUrl}" target="_blank" rel="noopener">เปิดไฟล์</a></p>` : ''}
              <p style="margin-top:10px;">กรุณาตรวจสอบอุปกรณ์และเก็บรักษาอย่างเหมาะสม</p>
              <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
            </div>
            `
                    );
                }
            }
        } catch (mailErr) {
            console.error('handover: send mail to borrower error:', mailErr.message);
        }

        return res.json({
            success: true,
            matched,
            modified,
            handoverBy: { id: handoverById, name: finalName },
            items: docs,
        });
    } catch (err) {
        console.error('handover error:', err);
        res.status(500).json({ message: err.message });
    }
});




app.get('/api/history/file/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fileIdx = Number(req.query.fileIdx || 0);

        // 1. หา History ก่อน
        let history = await History.findById(id);

        // 2. ถ้าไม่เจอ History ให้หา BookingEquipment
        if (!history) {
            // ถ้ากดดาวน์โหลดจากหน้าอุปกรณ์บางทีจะเป็น booking_id ของ BookingEquipment
            let equip = await BookingEquipment.findById(id);
            if (!equip) equip = await BookingEquipment.findOne({ booking_id: id });
            if (equip && equip.attachedFiles && equip.attachedFiles[fileIdx]) {
                const file = equip.attachedFiles[fileIdx];
                // กรณีไฟล์ upload จริง
                if (file.fileUrl && file.fileUrl.startsWith('http')) {
                    return res.redirect(file.fileUrl);
                }
                // base64 แบบแนบมา
                let base64Data = file.base64 || file.fileData;
                let mimeType = file.mimeType || 'application/octet-stream';
                let fileName = file.fileName || file.originalName || 'attachment';
                if (base64Data && base64Data.startsWith('data:')) {
                    // ตัด prefix data:mimetype;base64,
                    mimeType = base64Data.substring(5, base64Data.indexOf(';'));
                    base64Data = base64Data.split(',')[1];
                }
                const buffer = Buffer.from(base64Data, 'base64');
                res.setHeader('Content-Type', mimeType);
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                return res.end(buffer);
            }
            return res.status(404).send('No file data');
        }

        // 3. หาไฟล์แนบจาก History (แบบ array หรือเดี่ยว)
        let fileData = Array.isArray(history.attachment) ? history.attachment[fileIdx] : history.attachment;
        let fileType = Array.isArray(history.fileType) ? history.fileType[fileIdx] : history.fileType || 'application/octet-stream';
        let fileName = Array.isArray(history.fileName) ? history.fileName[fileIdx] : history.fileName || 'attachment';

        if (!fileData) return res.status(404).send('No file data');

        // ถ้าเป็น URL (เช่น "/uploads/xxx.pdf" หรือ "http://...")
        // ✅ NEW: ถ้าเป็น URL เต็ม หรือเป็นพาธ /uploads ให้ redirect/stream ออกไปเลย
        if (typeof fileData === 'string') {
            if (/^https?:\/\//i.test(fileData)) {
                const proxied = `${req.protocol}://${req.get('host')}/file-proxy/pdf?url=${encodeURIComponent(fileData)}`;
                return res.redirect(proxied);
            }
            if (fileData.startsWith('/uploads/')) {
                // เสิร์ฟจาก static ของตัวเอง (ถ้า static ของคุณตั้ง header ถูกอยู่)
                const full = `${req.protocol}://${req.get('host')}${fileData}`;
                // หรือจะผ่าน proxy ให้เหมือนกันก็ได้:
                // const proxied = `${req.protocol}://${req.get('host')}/file-proxy/pdf?url=${encodeURIComponent(full)}`;
                return res.redirect(full);
            }
        }
        // ถ้าเป็น base64
        let base64Data = fileData;
        if (base64Data.startsWith('data:')) {
            if (!fileType || fileType === 'application/octet-stream') {
                fileType = base64Data.substring(5, base64Data.indexOf(';'));
            }
            base64Data = base64Data.split(',')[1];
        }
        const buf = Buffer.from(base64Data, 'base64');

        const inlineTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
        const dispositionType = inlineTypes.includes(fileType) ? 'inline' : 'attachment';
        res.setHeader('Content-Type', fileType);
        res.setHeader('Content-Disposition', `${dispositionType}; filename="${fileName}"`);
        res.end(buf);
    } catch (e) {
        res.status(500).send('Invalid base64 or server error');
    }
});

// ===== PDF Proxy (fix header) =====
app.get('/file-proxy/pdf', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send('Missing url');

        // ป้องกัน SSRF: อนุญาตเฉพาะโดเมนที่ไว้ใจได้
        const allowHost = ['reserv-scc.mfu.ac.th'];
        const u = new URL(url);
        if (!allowHost.includes(u.hostname)) return res.status(403).send('Forbidden host');

        const resp = await axios.get(url, { responseType: 'stream' });

        // บังคับ header ให้ viewer ของ Chrome ทำงาน
        res.setHeader('Content-Type', 'application/pdf');
        if (resp.headers['content-length']) {
            res.setHeader('Content-Length', resp.headers['content-length']);
        }
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        resp.data.pipe(res);
    } catch (err) {
        console.error('[file-proxy/pdf] error:', err.message);
        res.status(502).send('Failed to fetch PDF');
    }
});
// ยืมวันเดียว
app.post('/api/history/singleday', async (req, res) => {
    try {
        const { user_id, items, status, borrowDate } = req.body
        if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' })
        }
        const savedItems = []
        for (const item of items) {
            const newHistory = new History({
                user_id,
                name: item.name,
                quantity: item.quantity,
                status,
                date: borrowDate ? new Date(borrowDate) : new Date(),
                type: 'equipment',
                agency: item.agency || ''   // ต้องส่งมาแต่ละชิ้น
            });
            await newHistory.save();

            // เพิ่ม usage ให้กับ Information type:equipment
            if (newHistory.agency && newHistory.agency.trim() !== "") {
                await Information.findOneAndUpdate(
                    { unit: newHistory.agency, type: 'equipment' },
                    { $inc: { usage: 1 } },
                    { upsert: true }
                );
            }
            savedItems.push(newHistory)
        }

        res.json({ success: true, items: savedItems })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

// === CANCEL (single item) ===
app.post('/api/history/:id/cancel', async (req, res) => {
    try {
        const id = req.params.id;

        const actorRole = (req.user?.role || '').toLowerCase();
        const canceledBy = String(req.body.canceled_by || '').toLowerCase();
        const isUserCancel = canceledBy === 'user' || actorRole === 'user';

        // รับเหตุผล/หมายเหตุจาก FE (รองรับทั้ง remark และ reason)
        const remarkText = (typeof req.body.remark === 'string'
            ? req.body.remark
            : (typeof req.body.reason === 'string' ? req.body.reason : '')
        ).trim();

        const before = await History.findById(id);
        if (!before) return res.status(404).json({ message: 'Not found' });

        // ===== FIELD =====
        if (before.type === 'field') {
            const adminId = req.user?.user_id || req.body.admin_id || '';
            const admin = await User.findOne({ user_id: adminId });
            const adminName = admin ? admin.name : adminId;

            const setObj = {
                status: 'cancel',
                canceledBy: adminName,
                canceledById: adminId,
                canceledAt: new Date(),
            };
            // เก็บ remark (และ reason สำรองระบบเก่า) ก็ต่อเมื่อผู้ใช้พิมพ์มา
            if (remarkText) {
                setObj.remark = remarkText;
                setObj.reason = remarkText;
            }

            const updated = await History.findByIdAndUpdate(id, setObj, { new: true });

            // ===== ส่งเมลเหมือนเดิม =====
            try {
                const requesterDisp = await getUserDisplayNameById(updated.user_id);
                const when = `
  <p><b>วันที่:</b> ${formatDateRange(updated.since, updated.uptodate)}</p>
  <p><b>เวลา:</b> ${(updated.startTime || '-')} ถึง ${(updated.endTime || '-')}</p>
`;


                const wasSecApproved = isUserCancel && (before?.status === 'pending') && !!before?.approvedById;

                if (wasSecApproved) {
                    const [superEmails, adminEmails] = await Promise.all([getSuperEmails(), getAdminEmails()]);
                    const toList = [...new Set([...(superEmails || []), ...(adminEmails || [])])];

                    await sendBulk(
                        toList,
                        `แจ้งเตือน: คำขอใช้สนามของ ${requesterDisp} ถูกยกเลิกแล้ว (หลังเลขาฯ อนุมัติ)`,
                        `
      <div>
        <h2>คำขอใช้สนามที่รออนุมัติถูกยกเลิกแล้ว</h2>
        <p><b>ผู้ยกเลิก:</b> ${requesterDisp}</p>
        <p><b>สนาม:</b> ${updated.name || '-'}</p>
        <p><b>กิจกรรม:</b> ${updated.name_active || '-'}</p>
        ${when}
        <p style="margin-top:10px;">หมายเหตุ: เลขาฯ อนุมัติแล้ว แต่ผู้ใช้ยกเลิกก่อนหัวหน้าศูนย์กีฬาอนุมัติ</p>
        <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
      </div>
      `
                    );
                } else if (isUserCancel) {
                    const adminEmails = await getAdminEmails();
                    await sendBulk(
                        adminEmails,
                        `แจ้งเตือน: คำขอใช้สนามของ ${requesterDisp} ถูกยกเลิกแล้ว`,
                        `
      <div>
        <h2>คำขอใช้สนามถูกยกเลิกแล้ว</h2>
        <p><b>ผู้ยกเลิก:</b> ${requesterDisp}</p>
        <p><b>สนาม:</b> ${updated.name || '-'}</p>
        <p><b>กิจกรรม:</b> ${updated.name_active || '-'}</p>
        ${when}
        <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
      </div>
      `
                    );
                }
            } catch (mailErr) {
                console.error('cancel_field notify error:', mailErr.message);
            }

            return res.json({ success: true, data: updated });
        }

        // ===== EQUIPMENT (ยกเลิกเดี่ยว) =====
        const setObj = {
            status: 'cancel',
            canceledAt: new Date(),
            ...(req.user?.user_id ? { canceledById: req.user.user_id } : {}),
        };
        // เก็บ remark (และ reason) ที่ผู้ใช้พิมพ์มา
        if (remarkText || req.body.remark !== undefined || req.body.reason !== undefined) {
            setObj.remark = remarkText;          // เก็บหลัก
            setObj.reason = remarkText;          // สำรองให้โค้ดเดิมที่ยังอ่าน reason
        }

        const updated = await History.findByIdAndUpdate(id, setObj, { new: true });

        // ==== ส่งเมลตามกติกาเดิม ====
        try {
            const wasApproved = String(before.status).toLowerCase() === 'approved';
            const single = isSingleDay(before);
            const borrowerName = await getUserDisplayNameById(before.user_id);
            const borrower = await User.findOne({ user_id: before.user_id });
            const itemsHtml = listToHtml([{ name: before.name, quantity: before.quantity }]);

            if (single && isUserCancel) {
                const staffEmails = await getStaffEmails();
                await sendBulk(
                    staffEmails,
                    `แจ้งเตือน: คำขอยืมอุปกรณ์ของ ${borrowerName} ถูกยกเลิกแล้ว (ยืมวันเดียว)`,
                    `
            <div>
              <h2>คำขอยืมอุปกรณ์ถูกยกเลิกแล้ว</h2>
              <p><b>ผู้ยกเลิก:</b> ${borrowerName}</p>
              ${itemsHtml}
              <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
            </div>
          `
                );
            }

            if (!single && isUserCancel && !wasApproved) {
                const adminEmails = await getAdminEmails();
                await sendBulk(
                    adminEmails,
                    `แจ้งเตือน: คำขอยืมอุปกรณ์ของ ${borrowerName} ถูกยกเลิกแล้ว (ยืมหลายวัน)`,
                    `
            <div>
              <h2>คำขอยืมอุปกรณ์ถูกยกเลิกแล้ว</h2>
              <p><b>ผู้ยกเลิก:</b> ${borrowerName}</p>
              ${itemsHtml}
              <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
            </div>
          `
                );
            }

            if (!single && isUserCancel && wasApproved) {
                const staffEmails = await getStaffEmails();
                await sendBulk(
                    staffEmails,
                    `แจ้งเตือน: คำขอยืมอุปกรณ์ของ ${borrowerName} ที่รอการส่งมอบถูกยกเลิกแล้ว`,
                    `
            <div>
              <h2>คำขอยืมอุปกรณ์ที่รอการส่งมอบถูกยกเลิกแล้ว</h2>
              <p><b>ผู้ยกเลิก:</b> ${borrowerName}</p>
              ${itemsHtml}
              <p style="margin-top:10px;">สถานะเดิม: อนุมัติแล้ว (รอการส่งมอบ)</p>
              <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
            </div>
          `
                );
            }

            if (borrower?.email && isUserCancel) {
                await sendBulk(
                    borrower.email,
                    'แจ้งเตือน: ระบบได้ยกเลิกรายการยืมอุปกรณ์ของคุณแล้ว',
                    `
            <div>
              <h2>ยกเลิกรายการยืมอุปกรณ์สำเร็จ</h2>
              <p><b>ผู้ยกเลิก:</b> ${borrowerName}</p>
              ${itemsHtml}
              <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
            </div>
          `
                );
            }
        } catch (mailErr) {
            console.error('cancel(equipment) mail error:', mailErr.message);
        }

        return res.json({ success: true, data: updated });
    } catch (err) {
        console.error('POST /api/history/:id/cancel error:', err);
        res.status(500).json({ message: err.message });
    }
});


// === CANCEL (whole booking) ===
app.post('/api/history/booking/:bookingId/cancel', async (req, res) => {
    try {
        const bookingId = String(req.params.bookingId || '').trim();
        if (!bookingId) return res.status(400).json({ message: 'bookingId required' });

        const actorRole = (req.user?.role || '').toLowerCase();
        const canceledBy = String(req.body.canceled_by || '').toLowerCase();
        const isUserCancel = canceledBy === 'user' || actorRole === 'user';

        // รับ remark/reason จาก FE เพื่อบันทึกลงทุกแถวใน booking เดียวกัน
        const remarkText = (typeof req.body.remark === 'string'
            ? req.body.remark
            : (typeof req.body.reason === 'string' ? req.body.reason : '')
        ).trim();

        // ดึงเฉพาะอุปกรณ์ที่ยัง Pending/Approved (ไม่สนตัวพิมพ์)
        const statusInPA = { $in: [/^pending$/i, /^approved$/i] };

        const docs = await History.find({
            type: 'equipment',
            booking_id: bookingId,
            status: statusInPA
        }).lean();

        if (!docs.length) {
            return res.status(404).json({ message: 'no pending/approved items in this booking' });
        }

        const wasApproved = docs.some(d => String(d.status).toLowerCase() === 'approved');
        const single = isSingleDay(docs[0]);
        const borrower = await User.findOne({ user_id: docs[0].user_id });
        const borrowerName = await getUserDisplayNameById(docs[0].user_id);

        // อัปเดตสถานะทั้งหมด + เก็บ remark/reason
        const setObj = {
            status: 'cancel',
            canceledAt: new Date(),
            ...(req.user?.user_id ? { canceledById: req.user.user_id } : {}),
        };
        if (remarkText || req.body.remark !== undefined || req.body.reason !== undefined) {
            setObj.remark = remarkText;
            setObj.reason = remarkText;
        }

        await History.updateMany(
            { type: 'equipment', booking_id: bookingId, status: statusInPA },
            { $set: setObj }
        );

        const items = docs.map(d => ({ name: d.name, quantity: d.quantity }));
        const itemsHtml = listToHtml(items);

        // ==== ส่งเมลตามกติกาเดิม ====
        try {
            if (single && isUserCancel) {
                const staffEmails = await getStaffEmails();
                await sendBulk(
                    staffEmails,
                    `แจ้งเตือน: คำขอยืมอุปกรณ์ของ ${borrowerName} ถูกยกเลิกแล้ว (ยืมวันเดียว)`,
                    `
            <div>
              <h2>คำขอยืมอุปกรณ์ถูกยกเลิก</h2>
              <p><b>ผู้ยกเลิก:</b> ${borrowerName}</p>
              ${itemsHtml}
              <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
            </div>
          `
                );
            }

            if (!single && isUserCancel && !wasApproved) {
                const adminEmails = await getAdminEmails();
                await sendBulk(
                    adminEmails,
                    `แจ้งเตือน: คำขอยืมอุปกรณ์ของ ${borrowerName} ถูกยกเลิกแล้ว (ยืมหลายวัน)`,
                    `
            <div>
              <h2>คำขอยืมอุปกรณ์ถูกยกเลิก</h2>
              <p><b>ผู้ยกเลิก:</b> ${borrowerName}</p>
              ${itemsHtml}
              <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
            </div>
          `
                );
            }

            if (!single && isUserCancel && wasApproved) {
                const staffEmails = await getStaffEmails();
                await sendBulk(
                    staffEmails,
                    `แจ้งเตือน: คำขอยืมอุปกรณ์ของ ${borrowerName} ที่รอการส่งมอบถูกยกเลิกแล้ว`,
                    `
            <div>
              <h2>คำขอยืมอุปกรณ์ที่รอการส่งมอบถูกยกเลิก</h2>
              <p><b>ผู้ยกเลิก:</b> ${borrowerName}</p>
              ${itemsHtml}
              <p style="margin-top:10px;">สถานะเดิม: มีบางรายการอนุมัติแล้ว (รอการส่งมอบ)</p>
              <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
            </div>
          `
                );
            }

            if (borrower?.email && isUserCancel) {
                await sendBulk(
                    borrower.email,
                    'แจ้งเตือน: ระบบได้ยกเลิกรายการยืมอุปกรณ์ของคุณแล้ว',
                    `
            <div>
              <h2>ยกเลิกรายการยืมอุปกรณ์สำเร็จ</h2>
              <p><b>ผู้ยกเลิก:</b> ${borrowerName}</p>
              ${itemsHtml}
              <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
            </div>
          `
                );
            }
        } catch (mailErr) {
            console.error('booking-cancel mail error:', mailErr.message);
        }

        return res.json({ success: true, canceled: docs.length });
    } catch (err) {
        console.error('POST /api/history/booking/:bookingId/cancel error:', err);
        res.status(500).json({ message: err.message });
    }
});



// API: ดึงรายการอุปกรณ์ที่รอคืน (return-pending)
app.get('/api/equipments/return-pending', async (req, res) => {
    try {
        // 1. ดึงรายการที่ return-pending ทั้งหมด จาก History
        const pendings = await History.find({ type: 'equipment', status: 'return-pending' }).lean();

        // 2. รวบรวม booking_id ทั้งหมดที่พบในรายการ pending
        const bookingIds = pendings.map(item => item.booking_id).filter(Boolean);

        // 3. ดึงรายการที่ถูก approved ที่ booking_id ตรงกัน (เพื่อ join since/uptodate)
        const approveds = await History.find({
            type: 'equipment',
            status: 'approved',
            booking_id: { $in: bookingIds }
        }).lean();

        // 4. สร้าง Map จาก booking_id -> ข้อมูล approved
        const approvedMap = {};
        approveds.forEach(a => {
            if (a.booking_id) approvedMap[String(a.booking_id)] = a;
        });

        // 5. join ข้อมูล since/uptodate และคืนค่า
        const results = pendings.map(p => {
            const approved = approvedMap[String(p.booking_id)];
            return {
                ...p,
                since: approved?.since || "",
                uptodate: approved?.uptodate || "",
                approvedBy: p.approvedBy || approved?.approvedBy || '',
                approvedById: p.approvedById || approved?.approvedById || ''
            };
        });

        // DEBUG LOG (ดูว่ามีข้อมูลหรือไม่)
        // console.log("return-pending results:", results);

        res.send(results);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
// === Helper: เช็คว่ายืมวันเดียวหรือหลายวัน ===
// helper แยกวันเดียว/หลายวัน
// === Helper: เช็คว่ายืมวันเดียวหรือหลายวัน (เวอร์ชันแก้บั๊ก) ===
function isSingleDay(history) {
    const ymd = (v) => {
        if (!v) return '';
        const d = v instanceof Date ? v : new Date(v);
        if (isNaN(d)) return '';
        return d.toISOString().slice(0, 10);
    };
    // รองรับเคสเก่า ๆ ที่เคยใช้ชื่อฟิลด์ไม่ตรงกัน
    const s = ymd(history.since || history.start_date || history.date);
    const u = ymd(history.uptodate || history.end_date || history.date);
    // ถ้าไม่มีอย่างใดอย่างหนึ่ง ถือว่า "วันเดียว" เพื่อไม่บล็อค flow
    return !s || !u || s === u;
}

app.get('/api/equipments/pending', async (req, res) => {
    try {
        const items = await History.find({ type: 'equipment', status: 'pending' });
        // เฉพาะยืมวันเดียว (isSingleDay = true)
        const singleDayItems = items.filter(isSingleDay);
        res.send(singleDayItems);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.get('/api/equipments/approve-list', async (req, res) => {
    try {
        // คืนทั้ง pending, approved, disapproved, return-pending, returned
        const items = await History.find({
            type: 'equipment',
            status: { $in: ['pending', 'approved', 'disapproved', 'return-pending', 'returned'] }
        }).sort({ date: -1 });
        res.send(items);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// PATCH /api/equipments/:id/status
app.patch('/api/equipments/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        // อ่านเอกสารเดิมก่อน
        const before = await History.findById(req.params.id);
        if (!before) return res.status(404).send({ message: 'Not found' });

        // อัปเดตสถานะ
        const updated = await History.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );

        // ถ้าไม่ใช่การ “ยกเลิก” ก็จบ
        const isCancelStatus = ['cancel', 'canceled', 'cancelled'].includes(String(status).toLowerCase());
        if (!isCancelStatus) {
            return res.send(updated);
        }

        // ===== กติกาเมลยกเลิก =====
        const wasApproved = String(before.status).toLowerCase() === 'approved';
        const single = isSingleDay(before);
        const borrowerName = await getUserDisplayNameById(before.user_id);
        const borrower = await User.findOne({ user_id: before.user_id });
        const items = [{ name: before.name, quantity: before.quantity }];
        const itemsHtml = listToHtml(items);
        const bookingIdForMail = before.booking_id || '';

        // ระบุ “ใครเป็นคนกดยกเลิก”: ต้องเป็น user เท่านั้นจึงยิงเมลตามที่สเปคขอ
        const actorRole = (req.user?.role || '').toLowerCase();
        const canceledBy = String(req.body.canceled_by || '').toLowerCase(); // FE ส่ง 'user' มาได้
        const isUserCancel = canceledBy === 'user' || actorRole === 'user';

        // (A) ยืม "วันเดียว" ผู้ใช้กดยกเลิก -> แจ้ง staff ทุกคน
        if (single && isUserCancel) {
            const staffEmails = await getStaffEmails();
            await sendBulk(
                staffEmails,
                `แจ้งเตือน: คำขอยืมอุปกรณ์ของ ${borrowerName} ถูกยกเลิกแล้ว (ยืมวันเดียว)`,
                `
        <div>
          <h2>คำขอยืมอุปกรณ์ของ ${borrowerName} ถูกยกเลิกแล้ว</h2>
          ${itemsHtml}
          <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
        </div>
        `
            );
        }

        // (B) ยืม "หลายวัน" ผู้ใช้กดยกเลิก (ยังไม่ approved) -> แจ้ง admin ทุกคน
        if (!single && isUserCancel && !wasApproved) {
            const adminEmails = await getAdminEmails();
            await sendBulk(
                adminEmails,
                `แจ้งเตือน: คำขอยืมอุปกรณ์ของ ${borrowerName} ถูกยกเลิกแล้ว (ยืมหลายวัน)`,
                `
        <div>
          <h2>คำขอยืมอุปกรณ์ของ ${borrowerName} ถูกยกเลิกแล้ว</h2>
          ${itemsHtml}
          <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
        </div>
        `
            );
        }

        // (C) ยืม "หลายวัน" ถูกอนุมัติแล้ว (รอส่งมอบ) แต่ผู้ใช้กดยกเลิก -> แจ้ง staff ทุกคน
        if (!single && isUserCancel && wasApproved) {
            const staffEmails = await getStaffEmails();
            await sendBulk(
                staffEmails,
                `แจ้งเตือน: คำขอยืมอุปกรณ์ของ ${borrowerName} ที่รอการส่งมอบถูกยกเลิกแล้ว`,
                `
        <div>
          <h2>คำขอยืมอุปกรณ์ที่รอการส่งมอบถูกยกเลิกแล้ว</h2>
          <p><b>ผู้ยกเลิก:</b> ${borrowerName}</p>
          ${itemsHtml}
          <p style="margin-top:10px;">สถานะเดิม: อนุมัติแล้ว (รอการส่งมอบ)</p>
          <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
        </div>
        `
            );
        }

        // (ออปชัน) แจ้งผู้ใช้ด้วยว่าระบบยกเลิกเสร็จแล้ว
        if (borrower?.email && isUserCancel) {
            await sendBulk(
                borrower.email,
                'แจ้งเตือน: ระบบได้ยกเลิกรายการยืมอุปกรณ์ของคุณแล้ว',
                `
        <div>
          <h2>ยกเลิกรายการยืมอุปกรณ์สำเร็จ</h2>
          ${itemsHtml}
          <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
        </div>
        `
            );
        }

        res.send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});



// ================== PATCH /api/history/:id/disapprove_equipment ==================
app.patch('/api/history/:id/disapprove_equipment', async (req, res) => {
    try {
        const staffId = req.body.staff_id;
        const remark = (req.body.remark || '').trim();

        const staff = await User.findOne({ user_id: staffId });
        const staffName = staff ? staff.name : staffId;

        const updated = await History.findByIdAndUpdate(
            req.params.id,
            {
                status: 'disapproved',
                disapprovedBy: staffName,
                disapprovedById: staffId,
                disapprovedAt: new Date(),
                ...(remark ? { remark } : {})
            },
            { new: true }
        );

        if (updated) {
            // ✅ step: admin ไม่อนุมัติ (approve=false) สำหรับ equipment
            try {
                await updateHistoryStep(
                    { id: updated._id, role: 'admin', approve: false, actorName: staffName, remark },
                    { syncStatus: true } // สถานะรวมจะเป็น disapproved
                );
            } catch (e) {
                console.error('update step (disapprove_equipment) error:', e.message);
            }

            // ส่งเมลแจ้งผู้ใช้ (คงโค้ดเดิมของคุณ)
            try {
                const user = await User.findOne({ user_id: updated.user_id });
                if (user && user.email) {
                    await sendDisapproveEquipmentEmail({
                        to: user.email,
                        name: user.name || user.email || updated.user_id,
                        equipment: updated.name,
                        quantity: updated.quantity
                    });
                }
            } catch (mailErr) {
                console.error('ส่งเมลแจ้ง disapprove equipment ไม่สำเร็จ:', mailErr.message);
            }
        }

        res.send(updated);
    } catch (err) {
        console.error('PATCH /api/history/:id/disapprove_equipment error:', err);
        res.status(500).send({ message: err.message });
    }
});

// ========== Approve/Disapprove Field ==========
app.get('/api/history/approve_field', async (req, res) => {
    try {
        // 1. เอาทั้ง field และ equipment (pending)
        const all = await History.find({
            status: 'pending',
            $or: [
                { type: 'field' },
                { type: 'equipment' }
            ]
        }).lean();

        // 2. เหลือเฉพาะ field หรือ equipment ที่ยืมหลายวัน
        const multiDayItems = all.filter(f =>
            (f.type === 'field') ||
            (f.type === 'equipment' && !isSingleDay(f))
        );

        // 3. join user name
        const userIds = multiDayItems.map(f => f.user_id);
        const users = await User.find({ user_id: { $in: userIds } }).lean();
        const userMap = {};
        users.forEach(u => userMap[u.user_id] = u.name);

        const result = multiDayItems.map(f => ({
            ...f,
            requester_name: userMap[f.user_id] || f.user_id,
            booking_id: f.booking_id ? f.booking_id.toString() : "",
        }));
        res.send(result);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// Cancel field booking (admin/staff ยกเลิก)
// PATCH /api/history/:id/cancel_field
// PATCH /api/history/:id/cancel_field
app.patch('/api/history/:id/cancel_field', async (req, res) => {
    try {
        const adminId = req.body.admin_id || "";
        const admin = await User.findOne({ user_id: adminId });
        const adminName = admin ? admin.name : adminId;

        const oldHistory = await History.findById(req.params.id);
        const remark = (req.body.remark || '').trim();

        const updated = await History.findByIdAndUpdate(
            req.params.id,
            {
                status: 'cancel',
                canceledBy: adminName,
                canceledById: adminId,
                canceledAt: new Date(),
                ...(remark ? { remark } : {})
            },
            { new: true }
        );
        if (!updated) return res.status(404).send({ message: "ไม่พบรายการ" });

        try {
            const actorRole = (req.user?.role || '').toLowerCase();
            const canceledBy = String(req.body.canceled_by || '').toLowerCase();
            const isUserCancel = canceledBy === 'user' || actorRole === 'user';
            const requesterDisp = await getUserDisplayNameById(updated.user_id);
            const when = `
  <p><b>วันที่:</b> ${formatDateRange(updated.since, updated.uptodate)}</p>
  <p><b>เวลา:</b> ${(updated.startTime || '-')} ถึง ${(updated.endTime || '-')}</p>
`;


            // ใช้ oldHistory (อ่านมาก่อน cancel) เพื่อเช็คว่าเลขาฯ อนุมัติไว้แล้วหรือยัง
            const wasSecApproved = isUserCancel && (oldHistory?.status === 'pending') && !!oldHistory?.approvedById;

            if (wasSecApproved) {
                // ✅ เลขาฯ อนุมัติแล้ว แต่ผู้ใช้ยกเลิก -> แจ้ง super + admin
                const [superEmails, adminEmails] = await Promise.all([getSuperEmails(), getAdminEmails()]);
                const toList = [...new Set([...(superEmails || []), ...(adminEmails || [])])];

                await sendBulk(
                    toList,
                    `แจ้งเตือน: คำขอใช้สนามของ ${requesterDisp} ถูกยกเลิกแล้ว (หลังเลขาฯ อนุมัติ)`,
                    `
      <div>
        <h2>คำขอใช้สนามที่รออนุมัติถูกยกเลิกแล้ว</h2>
        <p><b>ผู้ยกเลิก:</b> ${requesterDisp}</p>
        <p><b>สนาม:</b> ${updated.name || '-'}</p>
        <p><b>กิจกรรม:</b> ${updated.name_active || '-'}</p>
        ${when}
        
        <p style="margin-top:10px;">หมายเหตุ: เลขาฯ อนุมัติแล้ว แต่ผู้ใช้ยกเลิกก่อนหัวหน้าศูนย์กีฬาอนุมัติ</p>
        <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
      </div>
      `
                );
            } else if (isUserCancel) {
                // เดิม: ผู้ใช้ยกเลิก (ยังไม่ผ่านเลขาฯ) -> แจ้ง admin อย่างเดียว
                const adminEmails = await getAdminEmails();
                await sendBulk(
                    adminEmails,
                    `แจ้งเตือน: คำขอใช้สนามของ ${requesterDisp} ถูกยกเลิกแล้ว`,
                    `
      <div>
        <h2>คำขอใช้สนามถูกยกเลิกแล้ว</h2>
        <p><b>ผู้ยกเลิก:</b> ${requesterDisp}</p>
        <p><b>สนาม:</b> ${updated.name || '-'}</p>
        <p><b>กิจกรรม:</b> ${updated.name_active || '-'}</p>
        ${when}
        <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
      </div>
      `
                );
            }
        } catch (mailErr) {
            console.error('cancel_field notify error:', mailErr.message);
        }


        res.send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});



// --------- PATCH APPROVE ------------
// ================== PATCH /api/history/:id/approve_equipment ==================
app.patch('/api/history/:id/approve_equipment', async (req, res) => {
    try {
        // 0) ผู้กดอนุมัติ (รองรับทั้ง admin_id / staff_id)
        const actorId = req.body.admin_id || req.body.staff_id;
        if (!actorId) {
            return res.status(400).json({ success: false, message: 'ต้องระบุ admin_id หรือ staff_id' });
        }
        const actor = await User.findOne({ user_id: String(actorId) });
        const actorName =
            (actor?.thaiName && String(actor.thaiName)) ||
            (actor?.name && String(actor.name)) ||
            (actor?.email && String(actor.email)) ||
            String(actorId);

        // 1) โหลดเอกสารต้นทาง + ตรวจว่าเป็นอุปกรณ์
        const seed = await History.findById(req.params.id);
        if (!seed) return res.status(404).json({ success: false, message: 'not found' });
        if (String(seed.type).toLowerCase() !== 'equipment') {
            return res.status(400).json({ success: false, message: 'ไม่ใช่รายการอุปกรณ์' });
        }

        // ระบุว่าเป็น “วันเดียว” ไหม
        const isOneDay = isEquipmentOneDay(seed);

        // กลุ่มรายการ pending ใน booking เดียวกัน (ถ้ามี)
        const pendingQuery = seed.booking_id
            ? { type: 'equipment', booking_id: String(seed.booking_id), status: { $in: ['pending', 'Pending'] } }
            : { _id: seed._id, type: 'equipment', status: { $in: ['pending', 'Pending'] } };

        const pendingItems = await History.find(pendingQuery).lean();
        if (!pendingItems.length) {
            return res.status(409).json({ success: true, message: 'already-approved-or-no-pending' });
        }

        const now = new Date();

        // 2) เซ็ต approved + เก็บ PDF ถ้ามี
        const pdfUrl =
            [req.body.bookingPdfUrl, req.body.booking_pdf_url, req.body.fileUrl]
                .map(v => (typeof v === 'string' ? v.trim() : ''))
                .find(Boolean) || '';

        const baseSet = {
            status: 'approved',
            approvedBy: actorName,
            approvedById: String(actorId),
            approvedAt: now,
            ...(pdfUrl ? { bookingPdfUrl: pdfUrl, booking_pdf_url: pdfUrl } : {}),
        };
        await History.updateMany(pendingQuery, { $set: baseSet });

        // 2.1 แนบไฟล์ (optional)
        const attachments = Array.isArray(req.body.attachment)
            ? req.body.attachment.filter(u => typeof u === 'string' && u.trim())
            : (typeof req.body.attachment === 'string' && req.body.attachment.trim()
                ? [req.body.attachment.trim()]
                : []);
        const fileNames = Array.isArray(req.body.fileName) ? req.body.fileName : [];
        const fileTypes = Array.isArray(req.body.fileType) ? req.body.fileType : [];

        if (attachments.length || fileNames.length || fileTypes.length) {
            for (const it of pendingItems) {
                const doc = await History.findById(it._id);
                if (!doc) continue;
                let changed = false;

                if (attachments.length) {
                    doc.attachment = Array.isArray(doc.attachment) ? doc.attachment : (doc.attachment ? [doc.attachment] : []);
                    for (const u of attachments) if (!doc.attachment.includes(u)) { doc.attachment.push(u); changed = true; }
                }
                if (fileNames.length) {
                    doc.fileName = Array.isArray(doc.fileName) ? doc.fileName : (doc.fileName ? [doc.fileName] : []);
                    for (const n of fileNames) {
                        const name = (typeof n === 'string' ? n.trim() : '');
                        if (name && !doc.fileName.includes(name)) { doc.fileName.push(name); changed = true; }
                    }
                }
                if (fileTypes.length) {
                    doc.fileType = Array.isArray(doc.fileType) ? doc.fileType : (doc.fileType ? [doc.fileType] : []);
                    for (const t of fileTypes) {
                        const typ = (typeof t === 'string' ? t.trim() : '');
                        if (typ && !doc.fileType.includes(typ)) { doc.fileType.push(typ); changed = true; }
                    }
                }
                if (changed) await doc.save();
            }
        }

        // 3) อัปเดต step
        const ids = pendingItems.map(x => x._id);

        if (isOneDay) {
            // ✅ วันเดียว → บังคับ step ให้เหลือเฉพาะ staff และอนุมัติ = true
            await History.updateMany(
                { _id: { $in: ids } },
                {
                    $pull: { step: { role: 'admin' } }, // กัน admin ติดมาจาก hook/ของเก่า
                }
            );
            await History.updateMany(
                { _id: { $in: ids } },
                {
                    $set: {
                        step: [
                            { role: 'staff', approve: true, createdAt: now, updatedAt: now }
                        ]
                    }
                }
            );
        } else {
            // หลายวัน → ให้ admin เป็นคนอนุมัติใน step
            for (const it of ids) {
                try {
                    await updateHistoryStep(
                        { id: it, role: 'admin', approve: true, actorName },
                        { syncStatus: false }
                    );
                } catch (e) {
                    console.error('update step (approve_equipment) error:', e.message);
                }
            }
        }

        // 3.1 ย้ำสถานะ approved ให้ชัวร์
        await History.updateMany(
            { _id: { $in: ids } },
            { $set: { status: 'approved' } }
        );

        // 4) หักสต็อก/บันทึก usage
        const usageMap = {};
        for (const it of pendingItems) {
            const nm = (it.name || '').trim();
            const qty = Math.abs(Number(it.quantity) || 0);
            if (!nm || !qty) continue;
            usageMap[nm] = (usageMap[nm] || 0) + qty;
        }
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        for (const [equipName, usageQty] of Object.entries(usageMap)) {
            const equipment = await Equipment.findOne({ name: equipName });
            if (!equipment) continue;

            equipment.usageByMonthYear = equipment.usageByMonthYear || [];
            const found = equipment.usageByMonthYear.find(x => x.year === year && x.month === month);
            if (found) found.usage += usageQty;
            else equipment.usageByMonthYear.push({ year, month, usage: usageQty });

            equipment.quantity = (Number(equipment.quantity) || 0) - usageQty;
            if (equipment.quantity < 0) equipment.quantity = 0;

            equipment.usageCount = (Number(equipment.usageCount) || 0) + usageQty;
            equipment.markModified('usageByMonthYear');
            await equipment.save();
        }

        // 5) ส่งเมล (คงเดิม)
        // 5) ส่งเมล (แยกตามวันเดียว/หลายวัน)
        try {
            const borrowerId = pendingItems[0]?.user_id;
            let borrower = await User.findOne({ user_id: borrowerId });
            if (!borrower) borrower = await User.findById(borrowerId).catch(() => null);

            const itemsHtml = listToHtml(pendingItems);

            if (isOneDay) {
                // ✅ ยืมวันเดียว: ส่งเมลอนุมัติให้ผู้ใช้ทันที และไม่แจ้ง staff ว่ารอส่งมอบ
                if (borrower?.email) {
                    await sendApproveEquipmentEmailImmediate({
                        to: borrower.email,
                        name: borrower?.thaiName || borrower?.name || borrower?.email || borrower?.user_id || '',
                        itemsHtml,
                        fileUrl: pdfUrl || ''
                    });
                }
            } else {
                // 🟡 ยืมหลายวัน: พฤติกรรมเดิม — แจ้งผู้ใช้ว่า "รอการส่งมอบ" และแจ้ง staff
                if (borrower?.email) {
                    await sendBulk(
                        borrower.email,
                        'แจ้งเตือน: อนุมัติคำขอยืมอุปกรณ์แล้ว (รอการส่งมอบ)',
                        `
        <div>
          <h2>อนุมัติคำขอยืมอุปกรณ์ของคุณแล้ว</h2>
          <p><b>ชื่อผู้ยืม:</b> ${borrower?.thaiName || borrower?.name || borrower?.email || borrower?.user_id || ''}</p>
          ${itemsHtml}
          <p style="margin-top:10px;">สถานะปัจจุบัน: <b>รอการส่งมอบ</b></p>
          <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
        </div>
        `
                    );
                }

                const staffEmails = await getStaffEmails();
                if (staffEmails.length) {
                    const borrowerName = borrower?.thaiName || borrower?.name || borrower?.email || borrower?.user_id || borrowerId || '';
                    await sendBulk(
                        staffEmails,
                        'แจ้งเตือน: มีรายการอุปกรณ์รอการส่งมอบ',
                        `
        <div>
          <h2>มีรายการอุปกรณ์รอการส่งมอบ</h2>
          <p><b>ผู้ยืม:</b> ${borrowerName}</p>
          ${itemsHtml}
          <p style="margin-top:10px;">สถานะ: <b>รอการส่งมอบ</b></p>
          <hr><p style="font-size:0.95em;color:#888;">Sport Complex – MFU</p>
        </div>
        `
                    );
                }
            }
        } catch (mailErr) {
            console.error('approve_equipment notify mail error:', mailErr.message);
        }


        // 6) ตอบกลับ
        return res.send({
            success: true,
            approved_by: { user_id: String(actorId), name: actorName },
            approved_count: pendingItems.length,
            ...(pdfUrl ? { bookingPdfUrl: pdfUrl } : {})
        });
    } catch (err) {
        console.error('approve_equipment error:', err);
        res.status(500).send({ message: err.message });
    }
});








// Approve field booking
// ================== PATCH /api/history/:id/approve_field ==================
app.patch('/api/history/:id/approve_field', async (req, res) => {
    try {
        const { id } = req.params;

        const adminId = req.body.admin_id;
        const admin = await User.findOne({ user_id: adminId });
        const adminName = admin
            ? (admin.name || `${admin?.firstname || ''} ${admin?.lastname || ''}`.trim())
            : adminId;

        const reasonAdmin = typeof req.body.reason_admin === 'string'
            ? req.body.reason_admin.trim() : '';

        const sc = req.body.secretary_choice || {};
        const secretaryChoice = {
            to_head: !!sc.to_head,
            for_consider: !!sc.for_consider,
            other_checked: !!sc.other_checked,
        };

        const bodyThai = (req.body.thaiName_admin || req.body.thaiName || '').trim();
        const bodySig = (req.body.signaturePath_admin || req.body.signaturePath || '').trim();

        const fallbackThai =
            bodyThai ||
            admin?.thaiName_admin || admin?.thaiName || admin?.thai_name ||
            `${admin?.firstname_th || ''} ${admin?.lastname_th || ''}`.trim() || '';

        const fallbackSig =
            bodySig ||
            admin?.signaturePath_admin || admin?.signaturePath ||
            admin?.signature_path || admin?.signatureUrl || '';

        const bodyPdfUrl = (req.body.bookingPdfUrl || req.body.booking_pdf_url || '').trim();

        // เฉพาะ field ที่ยัง pending
        const cond = { _id: id, type: 'field', status: 'pending' };

        const updateSet = {
            status: 'pending', // คง pending จนกว่า super จะกด
            approvedBy: adminName,
            approvedById: adminId,
            approvedAt: req.body.approvedAt ? new Date(req.body.approvedAt) : new Date(),
            ...(reasonAdmin ? { reason_admin: reasonAdmin } : {}),
            secretary_choice: secretaryChoice,
            thaiName_admin: fallbackThai,
            signaturePath_admin: fallbackSig,
            updatedAt: new Date(),
        };
        if (bodyPdfUrl) {
            updateSet.bookingPdfUrl = bodyPdfUrl;
            updateSet.booking_pdf_url = bodyPdfUrl;
        }

        let updated = await History.findOneAndUpdate(cond, { $set: updateSet }, { new: true });
        if (!updated) return res.status(404).send({ message: 'not found or not pending' });

        // ✅ step: admin อนุมัติ (approve=true)
        try {
            await updateHistoryStep(
                {
                    id,
                    role: 'admin',
                    approve: true,
                    actorName: adminName,
                    remark: reasonAdmin || ''
                },
                { syncStatus: true } // จะยังเป็น 'pending' เพราะ super ยังไม่ครบ
            );
            updated = await History.findById(id);
        } catch (e) {
            console.error('update step (approve_field) error:', e.message);
        }

        // แจ้ง super ต่อ…
        try {
            if (updated) {
                const superEmails = await getSuperEmails();
                if (superEmails.length) {
                    await sendBulk(
                        superEmails,
                        'แจ้งเตือน: มีรายการขอใช้สนามรออนุมัติ (ถึงหัวหน้าศูนย์กีฬา)',
                        `
            <div>
              <h2>มีรายการขอใช้สนามรออนุมัติ</h2>
              <p><b>ผู้ขอ:</b> ${await getUserDisplayNameById(updated.user_id)}</p>
              <p><b>สนาม:</b> ${updated.name || '-'}</p>
              <p><b>กิจกรรม:</b> ${updated.name_active || '-'}</p>
              <p><b>วันที่:</b> ${formatDateRange(updated.since, updated.uptodate)}</p>
              <p><b>เวลา:</b> ${(updated.startTime || '-')} ถึง ${(updated.endTime || '-')}</p>
              <p><b>โซน:</b> ${updated.zone || '-'}</p>
            </div>`
                    );
                }
            }
        } catch (mailErr) {
            console.error('notify super (approve_field) error:', mailErr.message);
        }

        return res.send(updated);
    } catch (err) {
        console.error('PATCH /api/history/:id/approve_field error:', err);
        return res.status(500).send({ message: err.message });
    }
});





// ================== PATCH /api/history/:id/disapprove_field ==================
app.patch('/api/history/:id/disapprove_field', async (req, res) => {
    try {
        const adminId = req.body.admin_id;
        const remark = (req.body.remark || '').trim();

        const admin = await User.findOne({ user_id: adminId });
        const adminName = admin ? (admin.name || `${admin?.firstname || ''} ${admin?.lastname || ''}`.trim()) : adminId;

        let updated = await History.findByIdAndUpdate(
            req.params.id,
            {
                status: 'disapproved',
                disapprovedBy: adminName,
                disapprovedById: adminId,
                disapprovedAt: new Date(),
                ...(remark ? { remark } : {}),
                updatedAt: new Date(),
            },
            { new: true }
        );
        if (!updated) return res.status(404).send({ message: 'not found' });

        // ✅ step: admin ไม่อนุมัติ (approve=false)
        try {
            await updateHistoryStep(
                { id: req.params.id, role: 'admin', approve: false, actorName: adminName, remark: remark || '' },
                { syncStatus: true } // สถานะรวมจะเป็น disapproved
            );
            updated = await History.findById(req.params.id);
        } catch (e) {
            console.error('update step (disapprove_field) error:', e.message);
        }

        // ส่งอีเมลผู้ใช้ (เดิม)
        try {
            const user = await User.findOne({ user_id: updated.user_id });
            if (user && user.email) {
                await sendDisapproveFieldEmail({
                    to: user.email,
                    name: user.name || user.email || updated.user_id,
                    field: updated.name,
                    activity: updated.name_active,
                    since: updated.since,
                    uptodate: updated.uptodate,
                    startTime: updated.startTime,
                    endTime: updated.endTime
                });
            }
        } catch (mailErr) {
            console.error('ส่งเมลแจ้ง disapprove field ไม่สำเร็จ:', mailErr.message);
        }

        res.send(updated);
    } catch (err) {
        console.error('PATCH /api/history/:id/disapprove_field error:', err);
        res.status(500).send({ message: err.message });
    }
});


// == APPROVE (หัวหน้าศูนย์กีฬา) ==
// ================== PATCH /api/history/:id/approve_field_super ==================
app.patch('/api/history/:id/approve_field_super', async (req, res) => {
    try {
        const { id } = req.params;

        const superId = req.body.admin_id;
        const superUser = await User.findOne({ user_id: superId });
        if (!superUser) return res.status(403).send({ message: 'forbidden' });

        const superName =
            superUser.name ||
            `${superUser.firstname || ''} ${superUser.lastname || ''}`.trim() ||
            superId;

        // ต้องเป็น field, ยัง pending และผ่าน admin มาแล้ว
        const cond = {
            _id: id,
            type: 'field',
            status: 'pending',
            approvedById: { $exists: true, $ne: '' },
            approvedAt: { $exists: true },
        };

        const fileUrl = (req.body.bookingPdfUrl || req.body.booking_pdf_url || req.body.fileUrl || '').trim();

        delete req.body.attachment;
        delete req.body.fileName;

        const updateSet = {
            status: 'approved',
            superApprovedBy: superName,
            superApprovedById: superId,
            superApprovedAt: new Date(),
            to_vice_supervisor: !!req.body.to_vice_supervisor,
            for_consider_supervisor: !!req.body.for_consider_supervisor,
            other_checked_supervisor: !!req.body.other_checked_supervisor,
            reason_supervisor: req.body.reason_supervisor || '',
            thaiName_supervisor: req.body.thaiName_supervisor || '',
            signaturePath_supervisor: req.body.signaturePath_supervisor || '',
            approvedAt_supervisor: req.body.approvedAt_supervisor
                ? new Date(req.body.approvedAt_supervisor)
                : new Date(),
            head_choice_supervisor: {
                to_vice_supervisor: !!(req.body.head_choice_supervisor?.to_vice_supervisor ?? req.body.to_vice_supervisor),
                for_consider_supervisor: !!(req.body.head_choice_supervisor?.for_consider_supervisor ?? req.body.for_consider_supervisor),
                other_checked_supervisor: !!(req.body.head_choice_supervisor?.other_checked_supervisor ?? req.body.other_checked_supervisor),
            },
            updatedAt: new Date(),
        };
        if (fileUrl) {
            updateSet.bookingPdfUrl = fileUrl;
            updateSet.booking_pdf_url = fileUrl;
        }

        let updated = await History.findOneAndUpdate(cond, { $set: updateSet }, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).send({ message: 'not found, not pending, or not secretary-approved' });
        }

        // ✅ step: super อนุมัติ (approve=true)
        try {
            await updateHistoryStep(
                { id, role: 'super', approve: true, actorName: superName, remark: req.body.reason_supervisor || '' },
                { syncStatus: true } // ครบ admin+super -> approved
            );
            updated = await History.findById(id);
        } catch (e) {
            console.error('update step (approve_field_super) error:', e.message);
        }

        // side-effects/ส่งอีเมล (เดิม) …
        try {
            const user = await User.findOne({ user_id: updated.user_id });
            if (user?.email) {
                await sendApproveFieldEmail({
                    to: user.email,
                    name: user.name || user.email || user.user_id,
                    field: updated.name,
                    activity: updated.name_active,
                    since: updated.since,
                    uptodate: updated.uptodate,
                    startTime: updated.startTime,
                    endTime: updated.endTime,
                    fileUrl: updated.bookingPdfUrl || ''   // แนบลิงก์ไฟล์ถ้ามี
                });
            }
        } catch (mailErr) {
            console.error('ส่งเมลแจ้ง approve field ไม่สำเร็จ:', mailErr.message);
        }

        return res.send(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: err.message });
    }
});





// ==================== Announcement (News) ====================
app.put('/api/announcement', async (req, res) => {
    try {
        const ann = await Announcement.findOneAndUpdate(
            {},
            { announce: req.body.announce },
            { upsert: true, new: true }
        );
        res.send(ann);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.get('/api/announcement', async (req, res) => {
    try {
        const ann = await Announcement.findOne({}).sort({ _id: -1 });
        res.send(ann || { announce: "" });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.delete('/api/announcement', async (req, res) => {
    try {
        await Announcement.deleteMany({});
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
// ==================== Booking Equipment (form data) ====================
app.post('/api/booking_equipment', async (req, res) => {
    try {

        const data = req.body;
        const booking = new BookingEquipment({
            ...data,
            attachedFiles: data.attachedFiles || []
        });
        await booking.save();

        // เพิ่มโค้ดนี้เพื่อ sync booking_id = _id (ครั้งแรก)
        if (!booking.booking_id) {
            booking.booking_id = booking._id.toString();
            await booking.save();
        }

        // ... เดิม
        const agencyName = (data.agency || '').trim();
        if (agencyName && agencyName !== "อื่นๆ") {
            const exist = await Information.findOne({ unit: agencyName, type: "equipment" });
            if (!exist) {
                await Information.create({ unit: agencyName, type: "equipment", usage: 0 });
            }
        }

        res.send({ success: true, booking });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});
app.get('/api/booking_equipment', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).json({ message: 'Missing id' });
        const booking = await BookingEquipment.findById(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json([booking]);  // คืน array เช่นกัน (เหมือนไฟล์ที่สอง)
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
app.get('/api/booking_equipment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // หาได้ทั้ง booking_id และ _id
        const booking = await BookingEquipment.findOne({
            $or: [
                { _id: id },
                { booking_id: id }
            ]
        });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// =================== Booking Equipment Borrow API (ใช้ BookingEquipment) ===================
app.get('/api/booking_equipment_borrow', async (req, res) => {
    try {
        const list = await BookingEquipment.find();
        res.json(list);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
// ======================= BookingField CRUD ============================
app.post('/api/booking_field', upload.array('files', 10), async (req, res) => {
    try {
        // -- เก็บไฟล์ที่ upload มา --
        let filesArr = [];
        if (req.files && req.files.length) {
            filesArr = req.files.map(file => ({
                fileName: file.filename,
                originalName: file.originalname,
                fileUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
                mimetype: file.mimetype,
                size: file.size
            }));
        }

        // -- helper: แปลง string เป็น Date (หรือ null) --
        const parseDate = (v) => (v ? new Date(v) : null);
        const norm = v => (v ?? '').toString().trim().toLowerCase();
        const yesTokens = new Set(['yes', 'เลือก', 'ต้องการ', 'true', '1']);
        const noTokens = new Set(['no', 'ไม่เลือก', 'ไม่ต้องการ', 'false', '0']);
        const toYesNo = v => yesTokens.has(norm(v)) ? 'yes' : (noTokens.has(norm(v)) ? 'no' : '');

        // -- เก็บข้อมูลจาก form (req.body) --
        const bookingData = {
            aw: req.body.aw,
            date: parseDate(req.body.date),
            tel: req.body.tel,
            agency: req.body.agency,
            name_activity: req.body.name_activity,
            reasons: req.body.reasons,
            since: parseDate(req.body.since),
            uptodate: parseDate(req.body.uptodate),
            since_time: req.body.since_time,
            until_thetime: req.body.until_thetime,
            participants: req.body.participants,
            requester: req.body.requester,
            building: req.body.building,
            zone: req.body.zone,
            need: req.body.need,
            needless: req.body.needless,
            turnon_air: req.body.turnon_air,
            turnoff_air: req.body.turnoff_air,
            turnon_lights: req.body.turnon_lights,
            turnoff_lights: req.body.turnoff_lights,
            other: req.body.other,
            amphitheater: req.body.amphitheater,
            need_equipment: req.body.need_equipment,
            user_id: req.body.user_id,
            files: filesArr,
            no_receive: req.body.no_receive,
            date_receive: parseDate(req.body.date_receive),
            receiver: req.body.receiver,
            uploadFiles: req.body.uploadFiles || [],
            utilityRequest: req.body.utilityRequest,
            facilityRequest: req.body.facilityRequest,
            proxyStudentName: req.body.proxyStudentName,   // <--- แก้ตรงนี้!
            proxyStudentId: req.body.proxyStudentId,       // <--- แก้ตรงนี้!
            username_form: req.body.username_form || '',
            id_form: req.body.id_form || '',
            utilityRequest: toYesNo(req.body.utilityRequest),
            facilityRequest: toYesNo(req.body.facilityRequest),
            restroom: toYesNo(req.body.restroom),

        };
        // -- สร้าง booking ใหม่ใน DB --
        const booking = await BookingField.create(bookingData);

        // -- เพิ่ม booking_id ถ้ายังไม่มี --
        if (!booking.booking_id) {
            booking.booking_id = booking._id.toString();
            await booking.save();
        }

        res.json({ bookingId: booking._id, booking_id: booking.booking_id });
    } catch (err) {
        console.error('Create booking_field error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});
// GET: ข้อมูล booking_field ตาม id (พร้อมไฟล์แนบ)
app.get('/api/booking_field/:id', async (req, res) => {
    try {
        const booking = await BookingField.findById(req.params.id).lean();
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/booking_field', async (req, res) => {
    try {
        const bookings = await BookingField.find();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ตัวอย่าง flow การสร้าง booking + history
app.post('/api/booking_field_and_history', async (req, res) => {
    try {
        // 1) สร้าง booking_field
        const booking = await BookingField.create(req.body);

        // 2) สร้าง history (fix zone)
        const newHistory = new History({
            user_id: req.body.user_id,
            name: req.body.building || req.body.name,
            name_active: req.body.name_activity,
            zone: req.body.zone,                     // <-- แก้ตรงนี้
            since: req.body.since,
            uptodate: req.body.uptodate,
            startTime: req.body.since_time,
            endTime: req.body.until_thetime,
            status: 'pending',
            type: 'field',
            agency: req.body.agency || '',
            booking_id: booking._id,
            username_form: req.body.username_form || '',
            id_form: req.body.id_form || ''
        });
        await newHistory.save();

        res.send({ success: true, booking, history: newHistory });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

// ================== UploadFile API (base64 style) ==================
app.post('/api/upload_file', async (req, res) => {
    try {
        const { fileName, fileData, user_id } = req.body;
        if (!fileName || !fileData) return res.status(400).send({ message: 'ข้อมูลไม่ครบ' });
        const upload = new UploadFile({
            fileName,
            fileData,
            user_id: user_id || null,
        });
        await upload.save();
        res.send({ success: true, message: 'บันทึกไฟล์สำเร็จ', id: upload._id });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});
app.get('/api/upload_file', async (req, res) => {
    try {
        const files = await UploadFile.find().sort({ uploadedAt: -1 });
        res.send(files);
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});
app.get('/api/uploadfile/:id', async (req, res) => {
    const file = await UploadFile.findById(req.params.id);
    if (!file) return res.status(404).send('File not found');
    let base64Data = file.fileData;
    if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
    }
    const buffer = Buffer.from(base64Data, 'base64');
    res.set('Content-Type', file.mimetype || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.send(buffer);
});

// ==================== News Image API ====================
app.get('/api/img_news', async (req, res) => {
    try {
        const rows = await ImgNews.find({}, { img_url: 1, order: 1, createdAt: 1 })
            .sort({ order: 1, createdAt: 1, _id: 1 })   // เก่าก่อน=ซ้าย, ใหม่ทีหลัง=ขวา
            .lean();
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST: อัปโหลดรูปใหม่ (multipart/form-data, field name = "image")
app.post('/api/img_news', uploadNews.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'no file' });
        const relPath = `/uploads/news/${req.file.filename}`;
        const created = await ImgNews.create({ img_url: relPath });
        const base = `${req.protocol}://${req.get('host')}`;
        res.json({ success: true, data: { _id: created._id, img_url: `${base}${relPath}` } });
    } catch (e) {
        console.error('POST /api/img_news error:', e);
        res.status(500).json({ error: 'cannot create image' });
    }
});
// PUT: แทนที่ไฟล์รูปของรายการเดิม
app.put('/api/img_news/:id', uploadNews.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const doc = await ImgNews.findById(id);
        if (!doc) return res.status(404).json({ error: 'not found' });

        // ไม่มีไฟล์ใหม่ -> คืนค่าปัจจุบัน
        if (!req.file) {
            const base = `${req.protocol}://${req.get('host')}`;
            return res.json({ success: true, data: { _id: doc._id, img_url: doc.img_url ? `${base}${doc.img_url}` : '' } });
        }

        // ลบไฟล์เก่า (ถ้าเป็นไฟล์ใน /uploads)
        if (doc.img_url && doc.img_url.startsWith('/uploads/')) {
            const oldAbs = path.join(__dirname, doc.img_url);
            try { if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs); } catch (_) { }
        }

        const relPath = `/uploads/news/${req.file.filename}`;
        doc.img_url = relPath;
        // ไม่ใช้ base64 แล้ว
        if (doc.img) doc.img = undefined;
        await doc.save();

        const base = `${req.protocol}://${req.get('host')}`;
        res.json({ success: true, data: { _id: doc._id, img_url: `${base}${relPath}` } });
    } catch (e) {
        console.error('PUT /api/img_news/:id error:', e);
        res.status(500).json({ error: 'cannot update image' });
    }
});

// DELETE: ลบเอกสาร + ไฟล์จริง
app.delete('/api/img_news/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const doc = await ImgNews.findById(id);
        if (!doc) return res.status(404).json({ error: 'not found' });

        if (doc.img_url && doc.img_url.startsWith('/uploads/')) {
            const abs = path.join(__dirname, doc.img_url);
            try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch (_) { }
        }

        await ImgNews.deleteOne({ _id: id });
        res.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/img_news/:id error:', e);
        res.status(500).json({ error: 'cannot delete image' });
    }
});

// ==================== Members API ====================
app.post('/api/members', async (req, res) => {
    try {
        const { email, position } = req.body;
        if (!email || !position) return res.status(400).send({ message: 'ข้อมูลไม่ครบ' });
        // หา user เดิม
        const user = await User.findOne({ email });
        if (user) {
            user.role = position.toLowerCase();
            await user.save();
            res.send({ success: true, data: user });
        } else {
            return res.status(404).send({ message: 'ไม่พบ user นี้ในระบบ' });
        }
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.get('/api/members', async (req, res) => {
    try {
        const members = await User.find(
            { role: { $in: ['staff', 'admin', 'super'] } }, // เพิ่ม super
            { email: 1, role: 1, user_id: 1, name: 1, thaiName: 1, _id: 0, signaturePath: 1 }
        );
        const mapRole = (role) => role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        res.send(
            members.map(m => ({
                id: m.user_id,
                name: m.name,
                thaiName: m.thaiName || '',
                email: m.email,
                position: mapRole(m.role),
                signaturePath: m.signaturePath || null
            }))
        );
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});


app.patch('/api/members/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const { email: newEmail, position } = req.body;
        let newRole = position ? position.toLowerCase() : undefined;
        const updateObj = {};
        if (newEmail) updateObj.email = newEmail;
        if (newRole) updateObj.role = newRole;
        const updated = await User.findOneAndUpdate(
            { email: email },
            updateObj,
            { new: true }
        );
        if (!updated) return res.status(404).send({ message: "Member not found" });
        res.send({ success: true, data: updated });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.delete('/api/members/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const deleted = await User.findOneAndDelete({ email });
        if (!deleted) return res.status(404).send({ message: "Member not found" });
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});


app.post('/api/members/update-privileged', upload.single('signature'), async (req, res) => {
    try {
        const { oldEmail, email, position, thaiName } = req.body;
        const user = await User.findOne({ email: oldEmail });
        if (!user) return res.status(404).send({ message: 'ไม่พบ user เดิม' });

        if (email) user.email = email;
        if (position) user.role = position.toLowerCase();
        if (thaiName) user.thaiName = thaiName;
        if (req.file) {
            user.signaturePath = `/uploads/signatures/${req.file.filename}`;
        }
        await user.save();

        res.send({ success: true, data: user });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});



// ==================== Dashboard/Information ====================
// ===== Helper: ปลอดภัยเวลาอ่านฟิลด์ว่าง/ไม่ตรง schema =====
const toStr = v => (v == null ? '' : String(v));
const pickFirst = (...vals) => vals.find(x => toStr(x).trim() !== '') || '';

// ===== GET: รายชื่อหน่วยงานแบบไม่ซ้ำ =====
// อิงจาก collection 'information' ของคุณที่สร้างจากหลายจุดในระบบ (มีทั้ง type: 'field' / 'equipment')
// เราจะ group ตาม 'unit' (ไม่สน type) แล้วดึงข้อมูลติดต่อ (code/phone/email) ที่ไม่ว่างตัวใดตัวหนึ่งออกมา
app.get('/api/information/agencies', async (req, res) => {
    try {
        const InformationCol = mongoose.connection.collection('information');

        const pipeline = [
            {
                $addFields: {
                    unitNorm: { $toLower: { $ifNull: ['$unit', ''] } },
                    codeNorm: { $ifNull: ['$code', ''] },
                    phoneNorm: { $ifNull: ['$phone', ''] },
                    emailNorm: { $ifNull: ['$email', ''] },

                    // เวลาที่แถวนี้ "ถูกสร้างครั้งแรก"
                    // ถ้าไม่มี createdAt ให้ fallback เป็นวันที่จาก ObjectId
                    firstSeen: {
                        $ifNull: [
                            '$createdAt',
                            { $toDate: '$_id' }
                        ]
                    }
                }
            },
            { $match: { unitNorm: { $ne: '' } } },

            // จัดเรียงก่อน group เพื่อให้ $first ได้ “ตัวที่เก่าสุด” ของหน่วยงานนั้น
            { $sort: { unitNorm: 1, firstSeen: 1, _id: 1 } },

            // group ตามหน่วยงาน เลือก “ตัวแรกสุด” = หน่วยงานถูกพบครั้งแรกเมื่อไหร่
            {
                $group: {
                    _id: '$unitNorm',
                    unit: { $first: '$unit' },
                    code: { $first: '$codeNorm' },
                    phone: { $first: '$phoneNorm' },
                    email: { $first: '$emailNorm' },
                    firstSeen: { $first: '$firstSeen' },
                    firstId: { $first: '$_id' } // ไว้ใช้เป็นตัวกันชนกรณีเวลาเท่ากัน
                }
            },

            // *** ห้าม sort ตามชื่อ *** ให้ sort ตามเวลาที่ถูกพบครั้งแรกแทน
            { $sort: { firstSeen: 1, firstId: 1 } }
        ];

        const rows = await InformationCol.aggregate(pipeline).toArray();

        const items = rows.map((r) => ({
            _id: r.firstId,
            agencyName: r.unit || '',
            code: r.code || '',
            phone: r.phone || '',
            email: r.email || ''
        }));

        res.json(items);
    } catch (err) {
        console.error('GET /api/information/agencies error:', err);
        res.status(500).json({ message: 'server error' });
    }
});


// ===== POST: เพิ่มหน่วยงานใหม่ =====
// จะสร้างเอกสาร 2 แถว (type: 'field' และ 'equipment') ให้หน่วยงานนั้น
app.post('/api/information', async (req, res) => {
    try {
        const agency = toStr(req.body.agency || req.body.agencyName).trim();
        const code = toStr(req.body.code).trim();
        const phone = toStr(req.body.phone).trim();
        const email = toStr(req.body.email).trim();

        if (!agency) return res.status(400).json({ message: 'agency (ชื่อหน่วยงาน) is required' });

        // ป้องกันสร้างซ้ำแบบตรงๆ (ถ้ามีอยู่แล้วใน type ใด type หนึ่ง)
        const exists = await Information.findOne({ unit: new RegExp('^' + agency + '$', 'i') });
        if (exists) {
            // อนุญาตก็ได้ แต่แจ้งเตือนว่าเคยมี จะยังสร้างอีกชุดให้ครบคู่ type
            // ถ้าอยากบังคับไม่ให้ซ้ำเลย ให้ return 409 ตรงนี้
            // return res.status(409).json({ message: 'หน่วยงานนี้มีอยู่แล้ว' });
        }

        const baseDoc = { unit: agency, code, phone, email, usage: 0, usageByMonthYear: [] };
        const docs = await Information.insertMany([
            { ...baseDoc, type: 'field', createdAt: new Date() },
            { ...baseDoc, type: 'equipment', createdAt: new Date() }
        ]);

        res.status(201).json({ success: true, items: docs });
    } catch (err) {
        console.error('POST /api/information error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ===== DELETE: ลบทั้งชุดหน่วยงานตามชื่อ (case-insensitive) =====
app.delete('/api/information/agencies/by-name/:name', async (req, res) => {
    try {
        const name = toStr(req.params.name).trim();
        if (!name) return res.status(400).json({ message: 'name is required' });

        const regex = new RegExp('^' + name + '$', 'i');
        const result = await Information.deleteMany({ unit: regex });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
        console.error('DELETE /api/information/agencies/by-name error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ===== DELETE: ลบเอกสารเดียวตาม _id (fallback) =====
app.delete('/api/information/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Information.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
        if (!result.deletedCount) return res.status(404).json({ message: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/information/:id error:', err);
        res.status(500).json({ message: err.message });
    }
});
// ===== PUT: เปลี่ยนชื่อหน่วยงานทั้งชุด (case-insensitive) =====
app.put('/api/information/agencies/by-name/:name', async (req, res) => {
    try {
        const oldName = String(req.params.name || '').trim();
        const newName = String(req.body.agency || req.body.agencyName || req.body.unit || '').trim();
        if (!oldName || !newName) return res.status(400).json({ message: 'old/new name required' });

        const result = await Information.updateMany(
            { unit: new RegExp('^' + oldName + '$', 'i') },
            { $set: { unit: newName, updatedAt: new Date() } }
        );
        res.json({
            success: true,
            matchedCount: result.matchedCount ?? result.n,
            modifiedCount: result.modifiedCount ?? result.nModified
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// ===== PUT: เปลี่ยนชื่อหน่วยงานทีละรายการตาม _id (fallback) =====
app.put('/api/information/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const newName = String(req.body.agency || req.body.agencyName || req.body.unit || '').trim();
        if (!newName) return res.status(400).json({ message: 'unit (new name) is required' });

        const result = await Information.updateOne(
            { _id: new mongoose.Types.ObjectId(id) },
            { $set: { unit: newName, updatedAt: new Date() } }
        );
        const matched = result.matchedCount ?? result.n ?? 0;
        if (!matched) return res.status(404).json({ message: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.get('/api/information', async (req, res) => {
    try {
        const filter = {};
        if (req.query.type) {
            filter.type = req.query.type;
        }
        const infos = await Information.find(filter);
        res.json(infos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/information/increase-usage', async (req, res) => {
    const { unit } = req.body
    if (!unit) return res.status(400).json({ success: false, message: 'unit required' })
    try {
        // อัปเดต usage ตาม unit (ชื่อหน่วยงาน)
        const info = await Information.findOneAndUpdate(
            { unit },
            { $inc: { usage: 1 } },
            { new: true }
        )
        if (!info) return res.status(404).json({ success: false, message: 'not found' })
        res.json({ success: true, info })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

app.post('/api/information/aggregate-usage', async (req, res) => {
    try {
        // ลบ usageByMonthYear เดิม
        await Information.updateMany({}, { $set: { usageByMonthYear: [] } });

        // Field
        const fieldHistory = await History.find({ type: 'field', status: 'approved', approvedAt: { $exists: true } });
        const fieldMap = {};
        fieldHistory.forEach(item => {
            if (!item.agency || !item.approvedAt) return;
            const dt = new Date(item.approvedAt);
            const year = dt.getFullYear();
            const month = dt.getMonth() + 1;
            const key = `${item.agency}|field|${year}|${month}`;
            if (!fieldMap[key]) fieldMap[key] = { unit: item.agency, type: 'field', year, month, usage: 0 };
            fieldMap[key].usage += 1;
        });

        // Equipment
        const equipHistory = await History.find({ type: 'equipment', status: 'approved', approvedAt: { $exists: true } });
        const equipMap = {};
        equipHistory.forEach(item => {
            if (!item.agency || !item.approvedAt) return;
            const dt = new Date(item.approvedAt);
            const year = dt.getFullYear();
            const month = dt.getMonth() + 1;
            const key = `${item.agency}|equipment|${year}|${month}`;
            if (!equipMap[key]) equipMap[key] = { unit: item.agency, type: 'equipment', year, month, usage: 0 };
            equipMap[key].usage += 1;
        });

        // รวม field/equipment
        const all = [...Object.values(fieldMap), ...Object.values(equipMap)];

        // รวม usageByMonthYear ตามหน่วยงานและ type
        const agencyMap = {};
        for (const item of all) {
            const key = `${item.unit}|${item.type}`;
            if (!agencyMap[key]) agencyMap[key] = { unit: item.unit, type: item.type, usageByMonthYear: [] };
            agencyMap[key].usageByMonthYear.push({
                year: item.year,
                month: item.month,
                usage: item.usage
            });
        }

        // อัปเดต usageByMonthYear ใหม่ทั้งหมด
        for (const key in agencyMap) {
            const data = agencyMap[key];
            await Information.findOneAndUpdate(
                { unit: data.unit, type: data.type },
                { $set: { usageByMonthYear: data.usageByMonthYear } },
                { upsert: true }
            );
        }

        // รวม usage
        for (const info of await Information.find()) {
            let sum = 0;
            if (info.usageByMonthYear && info.usageByMonthYear.length) {
                sum = info.usageByMonthYear.reduce((s, u) => s + u.usage, 0);
            }
            info.usage = sum;
            await info.save();
        }

        res.json({ success: true, message: "Aggregated usageByMonthYear updated." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
app.post('/api/booking_equipment_and_history', async (req, res) => {
    try {
        // 1. สร้าง booking อุปกรณ์ (BookingEquipment)
        const booking = await BookingEquipment.create(req.body); // booking._id

        // 2. สร้าง history อุปกรณ์ (History)
        const newHistory = await History.create({
            user_id: req.body.user_id,
            name: req.body.name,
            quantity: req.body.quantity,
            status: req.body.status,
            date: req.body.since ? req.body.since : new Date(),
            since: req.body.since || '',
            uptodate: req.body.uptodate || '',
            type: 'equipment',
            agency: req.body.agency || '',
            booking_id: booking._id,
            username_form: req.body.username_form || '',
            id_form: req.body.id_form || '',
        });

        // 3. คัดลอกไฟล์แนบจาก booking.attachedFiles มาใส่ history.attachment
        if (booking.attachedFiles && booking.attachedFiles.length) {
            const attachments = [];
            const fileNames = [];
            const fileTypes = [];
            booking.attachedFiles.forEach(f => {
                attachments.push(f.fileUrl || f.base64 || "");
                fileNames.push(f.originalName || f.fileName || "attachment");
                fileTypes.push(f.mimetype || "application/octet-stream");
            });
            await History.findByIdAndUpdate(newHistory._id, {
                attachment: attachments,
                fileName: fileNames,
                fileType: fileTypes
            });
        }

        res.send({ success: true, booking, history: newHistory });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});
// GET: ไฟล์แนบทีละไฟล์ จาก id ของ history และ index ของไฟล์ใน array
app.get('/api/history/:id/file/:idx', async (req, res) => {
    try {
        const historyItem = await History.findById(req.params.id);
        const idx = parseInt(req.params.idx, 10);
        if (!historyItem || !historyItem.attachment || !historyItem.attachment[idx]) {
            return res.status(404).send('File not found');
        }
        const base64Data = historyItem.attachment[idx];
        // ⭐️ ใส่ default แบบนี้
        const mimeType = (historyItem.fileType && historyItem.fileType[idx]) || historyItem.fileType || 'application/octet-stream';
        const fileName = (historyItem.fileName && historyItem.fileName[idx]) || 'download';

        const fileBuffer = Buffer.from(base64Data, 'base64');
        res.set('Content-Type', mimeType || 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(fileBuffer);
    } catch (error) {
        res.status(500).send(error.message);
    }
});
app.post('/api/booking_field_upload', bookingFieldUpload.array('files'), async (req, res) => {
    try {
        const data = req.body;
        // convert files info
        const files = (req.files || []).map(file => ({
            originalName: file.originalname,
            fileName: file.filename,
            fileUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype
        }));

        const booking = await BookingField.create({
            ...data,
            files, // save files array
            agency: data.agency,
            zone: data.zone,
            // ... add fields as needed
            user_id: data.user_id
        });

        res.json({ bookingId: booking._id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// ========== Start server ==========
const PORT = process.env.PORT || 8021;
app.listen(PORT, () => console.log('Backend running on port', PORT));