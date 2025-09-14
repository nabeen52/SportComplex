require('dotenv').config();
const fs = require('fs');
const connectDB = require('./db');
connectDB();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const axios = require('axios');
const mime = require('mime-types');
const path = require('path');
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

const returnsDir = path.join(__dirname, 'uploads', 'returns');
fs.mkdirSync(returnsDir, { recursive: true });

const uploadReturn = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// ฟังก์ชันส่งอีเมล
async function sendApproveEmail({ to, name, equipment, quantity }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: อนุมัติการยืมอุปกรณ์',
        html: `
            <div>
                <h2>รายการยืมอุปกรณ์ของคุณได้รับการอนุมัติแล้ว</h2>
                <p><b>ชื่อผู้ยืม:</b> ${name || '-'}</p>
                <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
                <p><b>จำนวน:</b> ${quantity || '-'}</p>
                <br>
                <p>กรุณาติดต่อรับอุปกรณ์ที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลไม่สำเร็จ:', err);
    }
}
async function getStaffEmails() {
    const staff = await User.find({ role: 'staff', email: { $exists: true, $ne: "" } });
    return staff.map(s => s.email);
}

// ดึงอีเมล admin ทุกคน
async function getAdminEmails() {
    const admins = await User.find({ role: 'admin', email: { $exists: true, $ne: "" } });
    return admins.map(s => s.email);
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
        <p><b>Booking ID:</b> ${booking_id || '-'}</p>
        <br>
        <p>กรุณาเข้าสู่ระบบศูนย์กีฬาเพื่ออนุมัติรายการนี้</p>
        <hr>
        <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
      </div>
    `;
    await transporter.sendMail({
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to: adminEmails,
        subject: 'แจ้งเตือน: มีรายการขอยืมอุปกรณ์รออนุมัติ (ยืมหลายวัน)',
        html
    });
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
        <p><b>Booking ID:</b> ${booking_id || '-'}</p>
        <br>
        <p>กรุณาเข้าสู่ระบบศูนย์กีฬาเพื่ออนุมัติรายการนี้</p>
        <hr>
        <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
      </div>
    `;
    await transporter.sendMail({
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to: staffEmails,
        subject: 'แจ้งเตือน: มีรายการขอยืมอุปกรณ์รออนุมัติ (ยืมวันเดียว)',
        html
    });
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
            <p><b>Booking ID:</b> ${booking_id || '-'}</p>
            <br>
            <p>กรุณาตรวจสอบและยืนยันการคืนที่ระบบศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
            <hr>
            <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
        </div>
    `;
    await transporter.sendMail({
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to: staff.email,
        subject: 'แจ้งเตือน: มีรายการคืนอุปกรณ์รอการยืนยัน',
        html
    });
}
// ฟังก์ชันส่งอีเมลแจ้ง user ว่า "ไม่ได้รับการอนุมัติการยืมอุปกรณ์"
async function sendDisapproveEquipmentEmail({ to, name, equipment, quantity }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: ไม่อนุมัติการยืมอุปกรณ์',
        html: `
            <div>
                <h2>รายการขอยืมอุปกรณ์ของคุณไม่ได้รับการอนุมัติ</h2>
                <p><b>ชื่อผู้ยืม:</b> ${name || '-'}</p>
                <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
                <p><b>จำนวน:</b> ${quantity || '-'}</p>
                <br>
                <p>หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลแจ้ง disapprove equipment ไม่สำเร็จ:', err);
    }
}
// ส่งอีเมลแจ้ง user ว่าคืนของสำเร็จแล้ว
async function sendReturnSuccessEmail({ to, name, equipment, quantity }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: คืนอุปกรณ์สำเร็จ',
        html: `
            <div>
                <h2>การคืนอุปกรณ์ของคุณสำเร็จ</h2>
                <p><b>ชื่อผู้คืน:</b> ${name || '-'}</p>
                <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
                <p><b>จำนวน:</b> ${quantity || '-'}</p>
                <br>
                <p>ขอบคุณที่ใช้บริการศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
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
        <p><b>วันที่:</b> ${since || '-'} ถึง ${uptodate || '-'}</p>
        <p><b>โซน:</b> ${zone || '-'}</p>
        <p><b>Booking ID:</b> ${booking_id || '-'}</p>
        <br>
        <p>กรุณาเข้าสู่ระบบศูนย์กีฬาเพื่ออนุมัติรายการนี้</p>
        <hr>
        <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
      </div>
    `;
    await transporter.sendMail({
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to: adminEmails,
        subject: 'แจ้งเตือน: มีรายการขออนุมัติใช้สนาม',
        html
    });
}
// ส่งอีเมลแจ้ง user ว่าได้รับการอนุมัติการขอใช้สนาม
async function sendApproveFieldEmail({ to, name, field, activity, since, uptodate, startTime, endTime }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: การจองสนามของคุณได้รับการอนุมัติ',
        html: `
            <div>
                <h2>รายการขอใช้สนามของคุณได้รับการอนุมัติ</h2>
                <p><b>ชื่อผู้ขอ:</b> ${name || '-'}</p>
                <p><b>สนาม:</b> ${field || '-'}</p>
                <p><b>กิจกรรม:</b> ${activity || '-'}</p>
                <p><b>วันที่:</b> ${since || '-'} ถึง ${uptodate || '-'}</p>
                <p><b>เวลา:</b> ${startTime || '-'} ถึง ${endTime || '-'}</p>
                <br>
                <p>ขอบคุณที่ใช้บริการศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลแจ้ง approve field ไม่สำเร็จ:', err);
    }
}
// ส่งอีเมลแจ้ง user ว่าไม่ได้รับการอนุมัติจองสนาม
async function sendDisapproveFieldEmail({ to, name, field, activity, since, uptodate, startTime, endTime }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: ไม่อนุมัติการขอใช้สนาม',
        html: `
            <div>
                <h2>รายการขอใช้สนามของคุณไม่ได้รับการอนุมัติ</h2>
                <p><b>ชื่อผู้ขอ:</b> ${name || '-'}</p>
                <p><b>สนาม:</b> ${field || '-'}</p>
                <p><b>กิจกรรม:</b> ${activity || '-'}</p>
                <p><b>วันที่:</b> ${since || '-'} ถึง ${uptodate || '-'}</p>
                <p><b>เวลา:</b> ${startTime || '-'} ถึง ${endTime || '-'}</p>
                <br>
                <p>หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลแจ้ง disapprove field ไม่สำเร็จ:', err);
    }
}
// ฟังก์ชันส่งอีเมลแจ้ง user ว่า "รายการขอใช้สนามของคุณถูกยกเลิก"
async function sendCancelFieldEmail({ to, name, field, activity, since, uptodate, startTime, endTime }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: การขอใช้สนามของคุณถูกยกเลิก',
        html: `
            <div>
                <h2>รายการขอใช้สนามของคุณถูกยกเลิก</h2>
                <p><b>ชื่อผู้ขอ:</b> ${name || '-'}</p>
                <p><b>สนาม:</b> ${field || '-'}</p>
                <p><b>กิจกรรม:</b> ${activity || '-'}</p>
                <p><b>วันที่:</b> ${since || '-'} ถึง ${uptodate || '-'}</p>
                <p><b>เวลา:</b> ${startTime || '-'} ถึง ${endTime || '-'}</p>
                <br>
                <p>หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลแจ้ง cancel field ไม่สำเร็จ:', err);
    }
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
// POST /api/history
app.post('/api/history', async (req, res) => {
    try {
        // ---------- helpers ----------
        const toDate = (v) => {
            if (!v) return null;
            const d = new Date(v);
            return isNaN(d) ? null : d;
        };
        const str = (v, d = '') => (v == null ? d : String(v).trim());
        const num = (v, d = 0) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : d;
        };
        const asArray = (v) => {
            if (v == null) return [];
            return Array.isArray(v) ? v : [v];
        };
        const toBool = (v) => {
            if (typeof v === 'boolean') return v;
            const s = str(v).toLowerCase();
            if (!s) return false;
            return ['1', 'true', 'yes', 'y', 'ใช่'].includes(s);
        };

        // ---------- normalize input ----------
        const user_id = str(req.body.user_id);
        const name = str(req.body.name);
        const zone = str(req.body.zone);
        const username_form = str(req.body.username_form);
        const id_form = str(req.body.id_form);
        const booking_id = str(req.body.booking_id);
        const agencyName = str(req.body.agency);
        const proxyStudentName = str(req.body.proxyStudentName);
        const proxyStudentId = str(req.body.proxyStudentId);

        const startTime = str(req.body.startTime || req.body.start_time);
        const endTime = str(req.body.endTime || req.body.end_time);

        const sinceDate = toDate(req.body.since);
        const uptodateDate = toDate(req.body.uptodate);
        const createdDate = toDate(req.body.date) || new Date();

        // ---------- NEW: ฟิลด์ที่อยากให้บันทึกเพิ่ม ----------
        const aw = str(req.body.aw);
        // map โทรศัพท์จากหลายชื่อ (number/phone -> tel)
        const tel = str(req.body.tel ?? req.body.number ?? req.body.phone ?? '');
        // map เหตุผลจากหลายชื่อ (reasons/reason)
        const reasons = str(req.body.reasons ?? req.body.reason ?? '');

        const utilityRequest = req.body.utilityRequest;
        const facilityRequest = req.body.facilityRequest;
        const restroom = req.body.restroom;

        const turnon_air = str(req.body.turnon_air);
        const turnoff_air = str(req.body.turnoff_air);
        const turnon_lights = str(req.body.turnon_lights);
        const turnoff_lights = str(req.body.turnoff_lights);
        const other = str(req.body.other);
        const amphitheater = str(req.body.amphitheater);
        const need_equipment = str(req.body.need_equipment);
        const participants = str(req.body.participants);
        const requesterName = str(req.body.requester);
        const no_receive = toBool(req.body.no_receive);
        const date_receive = toDate(req.body.date_receive);
        const receiver = str(req.body.receiver);
        const singleFileUrl = str(req.body.fileUrl);

        // ---------- type inference / auto-fix (เอนทางอุปกรณ์) ----------
        const rawType = str(req.body.type).toLowerCase();
        const hasQty = req.body.quantity !== undefined && Number.isFinite(Number(req.body.quantity));
        // สัญญาณว่าเป็นสนาม: มี start/end time หรือมีชื่อกิจกรรม (name_active)
        const fieldSignals = !!(startTime || endTime || str(req.body.name_active));

        let type = ['field', 'equipment'].includes(rawType) ? rawType : null;
        if (!type) {
            if (hasQty) type = 'equipment';
            else if (fieldSignals) type = 'field';
            else type = 'equipment'; // default ไปทางอุปกรณ์
        }

        // default quantity: field = 1, equipment = number(v)
        let quantity = type === 'field' ? 1 : num(req.body.quantity, 0);

        // ---------- basic required ----------
        if (!user_id || !name || !quantity || !str(req.body.status)) {
            return res.status(400).json({
                success: false,
                message: 'ข้อมูลไม่ครบ (user_id, name, quantity, status)'
            });
        }
        const status = str(req.body.status);

        // ---------- normalize attachments ----------
        let attachment = asArray(req.body.attachment);
        if (singleFileUrl) attachment.push(singleFileUrl);
        const fileName = asArray(req.body.fileName);
        const fileType = asArray(req.body.fileType);

        // booking PDF fields
        const bookingPdf = req.body.bookingPdf ?? null;
        const bookingPdfUrl = str(req.body.bookingPdfUrl || req.body.booking_pdf_url);

        // ===== ป้องกัน duplicate =====
        const duplicateCond = {
            user_id,
            name,
            status: 'pending',
            type,
            since: sinceDate || null,
            uptodate: uptodateDate || null,
            zone,
            startTime,
            endTime,
            booking_id,
            username_form,
            id_form
        };
        const exist = await History.findOne(duplicateCond);
        if (exist) {
            return res.status(409).json({
                success: false,
                message: 'พบรายการที่ยังไม่อนุมัติอยู่แล้ว',
                duplicate: exist
            });
        }

        // ===== บันทึกตาม type =====
        if (type === 'field') {
            const newHistory = new History({
                user_id,
                name,
                name_active: str(req.body.name_active),
                zone,
                since: sinceDate,
                uptodate: uptodateDate,
                startTime,
                endTime,
                status,
                type: 'field',
                attachment: attachment.length ? attachment : null,
                fileName: fileName.length ? fileName : null,
                fileType: fileType.length ? fileType : null,
                agency: agencyName,
                booking_id,
                date: createdDate,
                proxyStudentName,
                proxyStudentId,
                bookingPdf: bookingPdf || null,
                bookingPdfUrl: bookingPdfUrl || null,
                username_form,
                id_form,

                // fields ที่ persist เพิ่ม
                aw,
                tel,
                reasons,
                utilityRequest,
                facilityRequest,
                restroom,
                turnon_air,
                turnoff_air,
                turnon_lights,
                turnoff_lights,
                other,
                amphitheater,
                need_equipment,
                participants,
                requester: requesterName,
                no_receive,
                date_receive,
                receiver,
                fileUrl: singleFileUrl || undefined
            });
            await newHistory.save();

            if (agencyName) {
                const existField = await Information.findOne({ unit: agencyName, type: 'field' });
                if (!existField) await Information.create({ unit: agencyName, usage: 0, type: 'field' });
                const existEquip = await Information.findOne({ unit: agencyName, type: 'equipment' });
                if (!existEquip) await Information.create({ unit: agencyName, usage: 0, type: 'equipment' });
            }

            try {
                const user = await User.findOne({ user_id });
                const requester = user?.name || user?.email || user_id;
                await notifyAdminNewFieldBooking({
                    requester,
                    building: name,
                    activity: str(req.body.name_active),
                    since: sinceDate ? sinceDate.toISOString().slice(0, 10) : '',
                    uptodate: uptodateDate ? uptodateDate.toISOString().slice(0, 10) : '',
                    zone,
                    booking_id: booking_id || newHistory._id
                });
            } catch (mailErr) {
                console.error('[Send field-booking notify mail error]', mailErr.message);
            }

            return res.send({ success: true, history: newHistory });
        }

        // ===== equipment =====
        const newHistory = new History({
            user_id,
            name,
            quantity: num(req.body.quantity, 0),
            status,
            date: createdDate,
            since: sinceDate || null,
            uptodate: uptodateDate || null,
            type: 'equipment',
            attachment: attachment.length ? attachment : null,
            fileName: fileName.length ? fileName : null,
            fileType: fileType.length ? fileType : null,
            agency: agencyName,
            booking_id,
            bookingPdf: bookingPdf || null,
            bookingPdfUrl: bookingPdfUrl || null,
            username_form,
            id_form,

            // fields ที่ persist เพิ่ม
            aw,
            tel,            // ★ รับมาจาก tel/number/phone
            reasons,        // ★ รับมาจาก reasons/reason
            utilityRequest,
            facilityRequest,
            restroom,
            turnon_air,
            turnoff_air,
            turnon_lights,
            turnoff_lights,
            other,
            amphitheater,
            need_equipment,
            participants,
            requester: requesterName,
            no_receive,
            date_receive,
            receiver,
            fileUrl: singleFileUrl || undefined
        });
        await newHistory.save();

        if (newHistory.agency && newHistory.agency.trim() !== '') {
            await Information.findOneAndUpdate(
                { unit: newHistory.agency, type: 'equipment' },
                { $setOnInsert: { usage: 0 } },
                { upsert: true }
            );
        }

        if (status === 'pending') {
            const isOneDay =
                !sinceDate || !uptodateDate || sinceDate.toDateString() === uptodateDate?.toDateString();
            const user = await User.findOne({ user_id });
            const requester = user?.name || user?.email || user_id;

            const itemData = [{ name, quantity: num(req.body.quantity, 0) }];
            if (isOneDay) {
                await notifyStaffNewBorrow({ requester, items: itemData, booking_id });
            } else {
                await notifyAdminNewBorrow({ requester, items: itemData, booking_id });
            }
        }

        return res.send({ success: true, history: newHistory });
    } catch (err) {
        console.error('POST /api/history error:', err);
        res.status(500).send({ success: false, message: err.message });
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
        const staffId = req.body.staff_id;
        const condition = req.body.status || 'good';
        const remark = (req.body.remark || '').trim();

        // ⬇️ รองรับหลายชื่อฟิลด์จาก FE สำหรับไฟล์ PDF ที่แนบตอน "รับคืน"
        const pdfUrl = (req.body.bookingPdfUrl || req.body.booking_pdf_url || '').toString().trim();
        const pdfNameRaw = Array.isArray(req.body.pdfFileName) ? req.body.pdfFileName[0] : req.body.pdfFileName;
        const fileNameRaw = Array.isArray(req.body.fileName) ? req.body.fileName[0] : req.body.fileName;
        const pdfFileName = (pdfNameRaw || fileNameRaw || 'equipment_return.pdf').toString().trim();
        const fileTypeRaw = Array.isArray(req.body.fileType) ? req.body.fileType[0] : req.body.fileType;
        const pdfFileType = (fileTypeRaw || 'application/pdf').toString().trim();

        // ⬇️ ใหม่: รับข้อมูลฝั่ง "ผู้รับคืน"
        const receiverThaiRaw =
            (req.body.handoverReceiverThaiName ||
                req.body.receiverThaiName || // alias เผื่อฝั่ง FE
                '').toString().trim();

        const receiverDateRaw =
            (req.body.handoverReceiverDate ||
                req.body.receiverDate || // alias เผื่อฝั่ง FE
                '').toString().trim();

        const staff = staffId ? await User.findOne({ user_id: staffId }) : null;
        const old = await History.findById(req.params.id);
        if (!old) return res.status(404).send({ message: 'Not found' });

        // 1) คืนสต็อกเฉพาะรายการ "อุปกรณ์"
        if (old.type === 'equipment' && old.name && old.quantity) {
            await Equipment.updateOne(
                { name: (old.name || '').trim() },
                { $inc: { quantity: Math.abs(old.quantity) } }
            );
        }

        // 2) อัปเดตสถานะ + เมตา
        old.status = 'returned';
        old.returnedById = staffId || old.returnedById || '';
        old.returnedBy = (staff && staff.name) ? staff.name : (staffId || old.returnedBy || '');
        old.returnedAt = new Date();
        old.condition = condition;                // ต้องมีใน schema
        if (remark) old.remark = remark;

        // (ออปชัน) อัปเดตช่วงวัน ถ้า FE ส่งมา
        if (req.body.since) old.since = req.body.since;
        if (req.body.uptodate) old.uptodate = req.body.uptodate;

        // ถ้าส่งรูปคืนมาใหม่ ให้ทับ (คงค่าเดิมถ้าไม่ส่ง)
        if (req.body.returnPhoto) old.returnPhoto = req.body.returnPhoto;

        // 3) เก็บ “คำอธิบายผู้รับคืน”
        if (typeof req.body.handoverRemarkReceiver === 'string') {
            old.handoverRemarkReceiver = req.body.handoverRemarkReceiver.trim();
        } else if (remark && pdfUrl) {
            // ถ้าไม่ได้ส่งมาก็ fallback จาก remark (เฉพาะกรณีที่มี PDF แนบ)
            old.handoverRemarkReceiver = remark;
        }

        // 3.1) ใหม่: ชื่อไทยและวันที่ของ "ผู้รับคืน"
        if (receiverThaiRaw) old.handoverReceiverThaiName = receiverThaiRaw;
        if (receiverDateRaw) {
            const d = new Date(receiverDateRaw);
            old.handoverReceiverDate = isNaN(d) ? new Date() : d;
        } else if (!old.handoverReceiverDate) {
            // ถ้า FE ไม่ส่งมาเลย ให้ใช้เวลาปัจจุบันเป็นค่าเริ่มต้น
            old.handoverReceiverDate = new Date();
        }

        // 4) ถ้ามี PDF ใหม่จากฝั่งรับคืน -> set เป็นล่าสุด + แนบเข้า attachments แบบกันซ้ำ
        if (pdfUrl) {
            old.bookingPdfUrl = pdfUrl;  // ตัวหลักที่ UI ใช้อ่านล่าสุด

            // attachment
            if (!old.attachment) {
                old.attachment = [pdfUrl];
            } else if (Array.isArray(old.attachment)) {
                if (!old.attachment.includes(pdfUrl)) old.attachment.push(pdfUrl);
            } else if (typeof old.attachment === 'string') {
                old.attachment = old.attachment.trim()
                    ? (old.attachment === pdfUrl ? [old.attachment] : [old.attachment, pdfUrl])
                    : [pdfUrl];
            }

            // fileName
            if (!old.fileName) {
                old.fileName = [pdfFileName];
            } else if (Array.isArray(old.fileName)) {
                if (!old.fileName.includes(pdfFileName)) old.fileName.push(pdfFileName);
            } else if (typeof old.fileName === 'string') {
                old.fileName = old.fileName.trim()
                    ? (old.fileName === pdfFileName ? [old.fileName] : [old.fileName, pdfFileName])
                    : [pdfFileName];
            }

            // fileType
            if (!old.fileType) {
                old.fileType = [pdfFileType];
            } else if (Array.isArray(old.fileType)) {
                if (!old.fileType.includes(pdfFileType)) old.fileType.push(pdfFileType);
            } else if (typeof old.fileType === 'string') {
                old.fileType = old.fileType.trim()
                    ? (old.fileType === pdfFileType ? [old.fileType] : [old.fileType, pdfFileType])
                    : [pdfFileType];
            }
        }

        await old.save();

        // 5) ส่งอีเมลแจ้งผู้ใช้ว่าคืนของสำเร็จ
        try {
            const user = await User.findOne({ user_id: old.user_id });
            if (user?.email) {
                await sendReturnSuccessEmail({
                    to: user.email,
                    name: user.name || user.email || old.user_id,
                    equipment: old.name,
                    quantity: old.quantity
                });
            }
        } catch (mailErr) {
            console.error('send return mail error:', mailErr.message);
        }

        res.send(old);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});


app.patch('/api/history/:id/request-return', uploadReturn.single('attachment'), async (req, res) => {
    try {
        const oldRecord = await History.findById(req.params.id);
        if (!oldRecord) return res.status(404).json({ message: 'Not found' });

        // ---- รับไฟล์แนบจาก multipart/base64 ----
        let buffer, ext = 'jpg', mimeType = 'image/jpeg';
        if (req.file) {
            buffer = req.file.buffer;
            mimeType = req.file.mimetype || 'image/jpeg';
            ext = mime.extension(mimeType) || 'jpg';
        } else if (
            req.body &&
            req.body.attachment &&
            /^data:image\/(png|jpe?g);base64,/i.test(req.body.attachment)
        ) {
            const m = req.body.attachment.match(/^data:image\/(png|jpe?g);base64,/i);
            ext = (m && m[1] === 'jpeg') ? 'jpg' : (m && m[1]) || 'jpg';
            mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            buffer = Buffer.from(req.body.attachment.split(',')[1], 'base64');
        } else {
            return res.status(400).json({ error: 'No attachment provided' });
        }

        // ---- บันทึกรูปไปที่ /uploads/returns ----
        const fname = `return_${oldRecord.booking_id || oldRecord._id}_${Date.now()}.${ext}`;
        const fpath = path.join(returnsDir, fname);
        await fs.promises.writeFile(fpath, buffer);
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/returns/${fname}`;

        // ---- helper รวมค่า: ถ้า front ส่งมาก็ใช้ของ front, ถ้าไม่ส่งใช้ของเดิม ----
        const merged = (key, def = '') => (req.body[key] ?? oldRecord[key] ?? def);

        // ---- ฟิลด์ handover (คัดลอก/ผสาน) ----
        const handoverById = (req.body.handoverById ?? req.body.staff_id ?? oldRecord.handoverById ?? '');
        const handoverBy = (req.body.handoverBy ?? req.body.handover_by ?? oldRecord.handoverBy ?? '');
        const handoverAt = req.body.handoverAt
            ? new Date(req.body.handoverAt)
            : (oldRecord.handoverAt || null);
        const handoverRemarkSender = (
            req.body.handoverRemarkSender ??
            req.body.handover_remark_sender ??
            oldRecord.handoverRemarkSender ??
            ''
        );
        const handoverRemarkReceiver = (
            req.body.handoverRemarkReceiver ??
            req.body.handover_remark_receiver ??
            oldRecord.handoverRemarkReceiver ??
            ''
        );

        // ---- สร้างเอกสาร return-pending ใหม่ (copy meta ทั้งหมดที่จำเป็น) ----
        const returnRequest = new History({
            // ค่าหลัก
            user_id: oldRecord.user_id,
            name: oldRecord.name,
            type: oldRecord.type,
            quantity: oldRecord.quantity,
            status: 'return-pending',
            date: new Date(),
            booking_id: oldRecord.booking_id || null,

            // แนบไฟล์รูปคืน (array เสมอ)
            attachment: [fileUrl],
            fileName: [fname],
            fileType: [mimeType],
            returnPhoto: fileUrl,

            // ค่าที่ต้องการ "ติดไปด้วย"
            zone: merged('zone', oldRecord.zone || ''),
            agency: merged('agency', oldRecord.agency || ''),
            username_form: merged('username_form', oldRecord.username_form || ''),
            id_form: merged('id_form', oldRecord.id_form || ''),
            proxyStudentName: merged('proxyStudentName', oldRecord.proxyStudentName || ''),
            proxyStudentId: merged('proxyStudentId', oldRecord.proxyStudentId || ''),
            bookingPdf: merged('bookingPdf', oldRecord.bookingPdf || null),
            bookingPdfUrl: merged('bookingPdfUrl', oldRecord.bookingPdfUrl || null),
            name_active: merged('name_active', oldRecord.name_active || ''),
            startTime: merged('startTime', oldRecord.startTime || ''),
            endTime: merged('endTime', oldRecord.endTime || ''),
            remark: merged('remark', oldRecord.remark || ''),

            // ช่วงวันที่ยืม
            since: oldRecord.since || '',
            uptodate: oldRecord.uptodate || '',

            // คนอนุมัติเดิม
            approvedBy: oldRecord.approvedBy || '',
            approvedById: oldRecord.approvedById || '',

            // ✅ ข้อมูลการส่งมอบ (handover)
            handoverById,
            handoverBy,
            handoverAt,
            handoverRemarkSender,
            handoverRemarkReceiver,

            // timestamps อื่น ๆ
            updatedAt: new Date()
        });

        await returnRequest.save();

        // ---- แจ้งผู้อนุมัติเดิมให้ยืนยันการคืน ----
        try {
            const approverId = oldRecord.approvedById;
            const borrower = await User.findOne({ user_id: oldRecord.user_id });
            if (approverId) {
                await notifyApproverReturnPending({
                    approverId,
                    userName: borrower?.name || borrower?.email || borrower?.user_id || '',
                    equipment: oldRecord.name,
                    quantity: oldRecord.quantity,
                    booking_id: oldRecord.booking_id || ''
                });
            }
        } catch (mailErr) {
            console.error('[Send return-pending notify mail error]', mailErr.message);
        }

        return res.json({ success: true, doc: returnRequest });
    } catch (err) {
        console.error('request-return error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.patch('/api/history/:id/handover', async (req, res) => {
    try {
        const body = req.body || {};

        // รองรับทั้งชื่อเก่า/ใหม่จาก FE
        const handoverById = body.handoverById || body.staff_id || '';
        const handoverByName = body.handoverByName || body.thai_name || '';
        const handoverAt = body.handoverAt; // optional ISO
        const remarkSender = body.remarkSender || body.remark_sender || '';
        const remarkReceiver = body.remarkReceiver || body.remark_receiver || '';
        const booking_id = body.booking_id;

        // PDF (อัปโหลดจาก FE แล้วส่ง URL มากลับมา)
        const bookingPdfUrl = body.bookingPdfUrl || '';   // ✅ ใช้ตัวนี้แทนของเดิม
        const fileName = body.fileName;
        const fileType = body.fileType || 'application/pdf';

        // หาชื่อไทยจากตาราง users ถ้าไม่ได้ส่งชื่อมา
        let finalName = (handoverByName || '').trim();
        if (!finalName && handoverById) {
            const u = await User.findOne({ user_id: handoverById }).lean();
            finalName =
                (u?.thaiName && String(u.thaiName).trim()) ||
                (u?.name && String(u.name).trim()) ||
                String(handoverById);
        }

        // เอกสารที่จะอัปเดต
        const setDoc = {
            handoverById: handoverById || '',
            handoverBy: finalName || '',
            handoverAt: handoverAt ? new Date(handoverAt) : new Date(),
            ...(remarkSender ? { handoverRemarkSender: String(remarkSender).trim() } : {}),
            ...(remarkReceiver ? { handoverRemarkReceiver: String(remarkReceiver).trim() } : {}),

            // ✅ แทนที่ PDF เดิม
            ...(bookingPdfUrl ? { bookingPdfUrl: bookingPdfUrl, bookingPdf: bookingPdfUrl } : {}),
            ...(fileName ? { fileName: Array.isArray(fileName) ? fileName : [fileName] } : {}),
            ...(fileType ? { fileType: Array.isArray(fileType) ? fileType : [fileType] } : {}),
        };

        let matched = 0, modified = 0, docs = [];

        if (booking_id) {
            // อัปเดตทั้งกลุ่ม booking ที่เป็นอุปกรณ์ และยังสถานะอนุมัติอยู่
            const result = await History.updateMany(
                { type: 'equipment', booking_id: String(booking_id), status: { $in: ['approved', 'Approved'] } },
                { $set: setDoc }
            );
            matched = result.matchedCount ?? result.nMatched ?? 0;
            modified = result.modifiedCount ?? result.nModified ?? 0;

            docs = await History.find(
                { type: 'equipment', booking_id: String(booking_id) },
                { _id: 1, name: 1, booking_id: 1 }
            ).lean();
        } else {
            // อัปเดตรายการเดียว
            const updated = await History.findByIdAndUpdate(
                req.params.id,
                { $set: setDoc },
                { new: true }
            );
            if (!updated) return res.status(404).json({ message: 'Not found' });
            matched = modified = 1;
            docs = [{ _id: updated._id, name: updated.name, booking_id: updated.booking_id }];
        }

        res.json({
            success: true,
            matched, modified,
            handoverBy: { id: handoverById, name: finalName },
            items: docs
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
function isSingleDay(history) {
    // เอา key ที่ใช้จริงใน schema ด้วย (since/uptodate หรือ start_date/end_date)
    const s = history.since || history.start_date || (history.date ? history.date.toISOString().slice(0, 10) : '');
    const u = history.uptodate || history.end_date;
    if (!s) return true;     // ถ้าไม่มีวัน เรียกว่ายืมวันเดียวไปก่อน
    if (!u) return true;     // ถ้าไม่มีวันคืน ก็ถือว่าวันเดียว
    return s === u;
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

app.patch('/api/equipments/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await History.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );
        res.send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.patch('/api/history/:id/disapprove_equipment', async (req, res) => {
    try {
        const staffId = req.body.staff_id;
        const remark = (req.body.remark || '').trim(); // ✅ รับ remark

        const staff = await User.findOne({ user_id: staffId });
        const staffName = staff ? staff.name : staffId;

        const updateDoc = {
            status: 'disapproved',
            disapprovedBy: staffName,
            disapprovedById: staffId,
            disapprovedAt: new Date(),
        };
        if (remark) updateDoc.remark = remark; // ✅ บันทึกหมายเหตุ

        const updated = await History.findByIdAndUpdate(
            req.params.id,
            updateDoc,
            { new: true }
        );

        // ======== ส่งอีเมลแจ้ง user ว่าไม่ได้รับอนุมัติ (เหมือนเดิม) ========
        if (updated) {
            try {
                const user = await User.findOne({ user_id: updated.user_id });
                if (user && user.email) {
                    await sendDisapproveEquipmentEmail({
                        to: user.email,
                        name: user.name || user.email || updated.user_id,
                        equipment: updated.name,
                        quantity: updated.quantity
                        // ถ้าต้องการใส่ remark ในอีเมล ให้เพิ่มใน template ของเมลด้วย
                    });
                }
            } catch (mailErr) {
                console.error('ส่งเมลแจ้ง disapprove equipment ไม่สำเร็จ:', mailErr.message);
            }
        }

        res.send(updated);
    } catch (err) {
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
app.patch('/api/history/:id/cancel_field', async (req, res) => {
    console.log("cancel_field payload", req.body);

    try {
        const adminId = req.body.admin_id || ""; // ถ้าส่ง admin_id มาด้วย
        const admin = await User.findOne({ user_id: adminId });
        const adminName = admin ? admin.name : adminId;

        // ====== เพิ่มบรรทัดนี้ ======
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

        // ========= ส่งอีเมลแจ้ง user ว่าถูกยกเลิก =========
        try {
            // เช็คเฉพาะกรณีที่เดิมเป็น approved แล้วถูก cancel (ถ้าต้องการแจ้งทุกครั้ง ให้ลบบรรทัด if)
            if (oldHistory.status === 'approved') {
                const user = await User.findOne({ user_id: updated.user_id });
                if (user && user.email) {
                    await sendCancelFieldEmail({
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
            }
        } catch (mailErr) {
            console.error('ส่งเมลแจ้ง cancel field ไม่สำเร็จ:', mailErr.message);
        }
        // ========================================

        res.send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
// --------- PATCH APPROVE ------------
// --------- PATCH APPROVE (FIXED: deduct only once) ------------
app.patch('/api/history/:id/approve_equipment', async (req, res) => {
    try {
        const staffId = req.body.staff_id;
        if (!staffId) {
            return res.status(400).json({ success: false, message: "ต้องระบุ staff_id (user_id ของ admin/staff)" });
        }

        // ชื่อผู้อนุมัติ
        const staff = await User.findOne({ user_id: staffId });
        const staffName =
            (staff?.name && String(staff.name)) ||
            (staff?.email && String(staff.email)) ||
            String(staffId);

        // เอกสารเป้าหมาย
        const old = await History.findById(req.params.id);
        if (!old) return res.status(404).send({ message: 'Not found' });
        if (old.type !== 'equipment') {
            return res.status(400).json({ success: false, message: 'ไม่ใช่รายการอุปกรณ์' });
        }

        // === 1) เลือก "เฉพาะ pending" ที่จะอนุมัติในครั้งนี้ ===
        let pendingQuery;
        if (old.booking_id) {
            pendingQuery = {
                booking_id: String(old.booking_id),
                type: 'equipment',
                status: 'pending'
            };
        } else {
            pendingQuery = { _id: old._id, type: 'equipment', status: 'pending' };
        }

        // ดึงรายการที่ยัง pending (จะใช้คำนวนหักสต็อก/แนบไฟล์)
        const pendingItems = await History.find(pendingQuery).lean();

        // ถ้าไม่มีอะไรต้องอนุมัติแล้ว (เช่น เผลอกดซ้ำ) -> ส่ง 409 ให้ frontend ถือว่าสำเร็จแบบ idempotent
        if (!pendingItems.length) {
            return res.status(409).json({ success: true, message: 'already-approved-or-no-pending' });
        }

        const now = new Date();

        // ===== รองรับ URL ของ PDF ที่ FE ส่งมา (หลายชื่อฟิลด์) =====
        const pdfUrlRaw =
            (req.body.bookingPdfUrl ||
                req.body.booking_pdf_url ||
                req.body.fileUrl ||
                req.body.attachment ||
                '')
                .toString()
                .trim();

        // รองรับทั้ง string/array สำหรับชื่อไฟล์/ชนิดไฟล์
        const fnameRaw = Array.isArray(req.body.fileName) ? req.body.fileName[0] : req.body.fileName;
        const fileName = (typeof fnameRaw === 'string' && fnameRaw.trim()) ? fnameRaw.trim() : 'equipment.pdf';

        const ftypeRaw = Array.isArray(req.body.fileType) ? req.body.fileType[0] : req.body.fileType;
        const fileType = (typeof ftypeRaw === 'string' && ftypeRaw.trim()) ? ftypeRaw.trim() : 'application/pdf';

        // === 2) อัปเดตสถานะเฉพาะ pending -> approved + (ถ้ามี) บันทึก PDF ลง bookingPdfUrl ===
        const setDoc = {
            status: 'approved',
            approvedBy: staffName,
            approvedById: String(staffId),
            approvedAt: now
        };
        if (pdfUrlRaw) {
            setDoc.bookingPdfUrl = pdfUrlRaw;     // ฟิลด์หลัก
            setDoc.booking_pdf_url = pdfUrlRaw;   // alias สำหรับโค้ดเก่า
        }

        await History.updateMany(
            pendingQuery,
            { $set: setDoc }
        );

        // === 2.1) ถ้ามี pdfUrlRaw ให้แนบเข้า attachment/fileName/fileType แบบปลอดภัย (ชนิดฟิลด์อาจต่างกัน) ===
        if (pdfUrlRaw) {
            for (const h of pendingItems) {
                const doc = await History.findById(h._id);
                if (!doc) continue;

                let changed = false;

                // attachment
                if (!doc.attachment) {
                    doc.attachment = [pdfUrlRaw];
                    changed = true;
                } else if (Array.isArray(doc.attachment)) {
                    if (!doc.attachment.includes(pdfUrlRaw)) {
                        doc.attachment.push(pdfUrlRaw);
                        changed = true;
                    }
                } else if (typeof doc.attachment === 'string') {
                    if (!doc.attachment.trim()) {
                        doc.attachment = [pdfUrlRaw];
                        changed = true;
                    } else if (doc.attachment !== pdfUrlRaw) {
                        doc.attachment = [doc.attachment, pdfUrlRaw];
                        changed = true;
                    }
                }

                // fileName
                if (!doc.fileName) {
                    doc.fileName = [fileName];
                    changed = true;
                } else if (Array.isArray(doc.fileName)) {
                    if (!doc.fileName.includes(fileName)) {
                        doc.fileName.push(fileName);
                        changed = true;
                    }
                } else if (typeof doc.fileName === 'string') {
                    if (!doc.fileName.trim()) {
                        doc.fileName = [fileName];
                        changed = true;
                    } else if (doc.fileName !== fileName) {
                        doc.fileName = [doc.fileName, fileName];
                        changed = true;
                    }
                }

                // fileType
                if (!doc.fileType) {
                    doc.fileType = [fileType];
                    changed = true;
                } else if (Array.isArray(doc.fileType)) {
                    if (!doc.fileType.includes(fileType)) {
                        doc.fileType.push(fileType);
                        changed = true;
                    }
                } else if (typeof doc.fileType === 'string') {
                    if (!doc.fileType.trim()) {
                        doc.fileType = [fileType];
                        changed = true;
                    } else if (doc.fileType !== fileType) {
                        doc.fileType = [doc.fileType, fileType];
                        changed = true;
                    }
                }

                if (changed) await doc.save();
            }
        }

        // === 3) คำนวนยอดหักสต็อก "เฉพาะที่เพิ่งอนุมัติ" ===
        const usageUpdateMap = {}; // { 'ชื่ออุปกรณ์': จำนวนอนุมัติ }
        for (const h of pendingItems) {
            const equipName = (h.name || '').trim();
            const qty = Math.abs(Number(h.quantity) || 0);
            if (!equipName || !qty) continue;
            usageUpdateMap[equipName] = (usageUpdateMap[equipName] || 0) + qty;
        }

        // หักสต็อก + อัปเดต usageByMonthYear เฉพาะยอดของรอบนี้
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        for (const [equipName, usageQty] of Object.entries(usageUpdateMap)) {
            const equipment = await Equipment.findOne({ name: equipName });
            if (!equipment) continue;

            equipment.usageByMonthYear = equipment.usageByMonthYear || [];
            const found = equipment.usageByMonthYear.find(x => x.year === year && x.month === month);
            if (found) {
                found.usage += usageQty;
            } else {
                equipment.usageByMonthYear.push({ year, month, usage: usageQty });
            }

            equipment.quantity = (Number(equipment.quantity) || 0) - usageQty;
            if (equipment.quantity < 0) equipment.quantity = 0;

            equipment.usageCount = (Number(equipment.usageCount) || 0) + usageQty;
            equipment.markModified('usageByMonthYear');
            await equipment.save();
        }

        // === 4) ส่งเมลให้ผู้ใช้สรุปเฉพาะรายการที่อนุมัติในรอบนี้ ===
        try {
            const userId = pendingItems[0].user_id;
            let user = await User.findOne({ user_id: userId });
            if (!user) user = await User.findById(userId).catch(() => null);

            if (user?.email) {
                let listHtml = '<ul style="font-size:1.1em">';
                pendingItems.forEach((h, idx) => {
                    listHtml += `<li>${idx + 1}. ${h.name || '-'} (จำนวน: ${h.quantity || '-'})</li>`;
                });
                listHtml += '</ul>';

                await transporter.sendMail({
                    from: '"MFU Sport Complex" <your.email@gmail.com>',
                    to: user.email,
                    subject: 'แจ้งเตือน: อนุมัติการยืมอุปกรณ์',
                    html: `
            <div>
              <h2>รายการยืมอุปกรณ์ของคุณได้รับการอนุมัติแล้ว</h2>
              <p><b>ชื่อผู้ยืม:</b> ${user.firstname || user.name || user.email || ''}</p>
              ${listHtml}
              <p>กรุณาติดต่อรับอุปกรณ์ที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
              <hr>
              <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
          `
                });
            }
        } catch (mailErr) {
            console.error('send approve mail error:', mailErr.message);
        }

        // === 5) ส่งกลับเฉพาะสิ่งที่อนุมัติจริงในรอบนี้ ===
        return res.send({
            success: true,
            approved_by: { user_id: String(staffId), name: staffName },
            approved_count: pendingItems.length,
            deducted: usageUpdateMap,
            ...(pdfUrlRaw ? { bookingPdfUrl: pdfUrlRaw } : {})
        });

    } catch (err) {
        console.error('approve_equipment error:', err);
        res.status(500).send({ message: err.message });
    }
});

// Approve field booking
app.patch('/api/history/:id/approve_field', async (req, res) => {
    try {
        const { id } = req.params;

        const adminId = req.body.admin_id;
        const admin = await User.findOne({ user_id: adminId });
        const adminName = admin
            ? (admin.name || `${admin.firstname || ''} ${admin.lastname || ''}`.trim())
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

        // ⬇️ รับ URL PDF ใหม่ (รองรับชื่อเก่า ๆ ด้วย)
        const bodyPdfUrl = (req.body.bookingPdfUrl || req.body.booking_pdf_url || '').trim();

        // อนุมัติเฉพาะที่ยัง pending
        const cond = { _id: id, type: 'field', status: 'pending' };

        const updateSet = {
            status: 'pending',  // แนะนำให้เซ็ตสถานะให้ถูกต้อง
            approvedBy: adminName,
            approvedById: adminId,
            approvedAt: req.body.approvedAt ? new Date(req.body.approvedAt) : new Date(),
            ...(reasonAdmin ? { reason_admin: reasonAdmin } : {}),
            secretary_choice: secretaryChoice,

            thaiName_admin: fallbackThai,
            signaturePath_admin: fallbackSig,

            updatedAt: new Date(),
        };

        // ⬇️ ทับค่าลิงก์ PDF เดิมด้วยตัวล่าสุด
        if (bodyPdfUrl) {
            updateSet.bookingPdfUrl = bodyPdfUrl;

            // (ทางเลือก) เก็บเข้า attachment เป็นประวัติด้วยและกันซ้ำ
            // ถ้าไม่อยากเก็บประวัติ ให้ลบ block นี้ออกได้
            var updateOps = {
                $set: updateSet,
                $addToSet: { attachment: bodyPdfUrl }
            };
        } else {
            var updateOps = { $set: updateSet };
        }

        const updated = await History.findOneAndUpdate(cond, updateOps, { new: true });
        if (!updated) return res.status(404).send({ message: 'not found or not pending' });

        return res.send(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: err.message });
    }
});




app.patch('/api/history/:id/disapprove_field', async (req, res) => {
    try {
        const adminId = req.body.admin_id;
        const remark = (req.body.remark || '').trim();  // ✅ รับหมายเหตุ

        const admin = await User.findOne({ user_id: adminId });
        const adminName = admin ? admin.name : adminId;

        const updateDoc = {
            status: 'disapproved',
            disapprovedBy: adminName,
            disapprovedById: adminId,
            disapprovedAt: new Date(),                     // ✅ บันทึกเวลาไม่อนุมัติ
        };
        if (remark) updateDoc.remark = remark;           // ✅ บันทึกหมายเหตุ

        const updated = await History.findByIdAndUpdate(
            req.params.id,
            updateDoc,
            { new: true }
        );
        // (ออปชัน) ส่งอีเมลแจ้งผู้ใช้เหมือนโค้ดเดิมของคุณ
        if (updated) {
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
                        // ถ้าจะใส่ remark ในเนื้อเมล ให้ไปเพิ่มในเทมเพลตฟังก์ชันได้เลย
                    });
                }
            } catch (mailErr) {
                console.error('ส่งเมลแจ้ง disapprove field ไม่สำเร็จ:', mailErr.message);
            }
        }

        res.send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// == APPROVE (หัวหน้าศูนย์กีฬา) ==
app.patch('/api/history/:id/approve_field_super', async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสิทธิ์ผู้กดอนุมัติ
        const superId = req.body.admin_id;
        const superUser = await User.findOne({ user_id: superId });
        if (!superUser) return res.status(403).send({ message: 'forbidden' });

        const superName =
            superUser.name ||
            `${superUser.firstname || ''} ${superUser.lastname || ''}`.trim() ||
            superId;

        // ต้องเป็น field, ยัง pending, และ "ผ่านเลขาฯ" มาแล้ว
        const cond = {
            _id: id,
            type: 'field',
            status: 'pending',
            approvedById: { $exists: true, $ne: '' },
            approvedAt: { $exists: true }
        };

        // ✅ รับ URL PDF ใหม่จากหลายชื่อฟิลด์ (รวม fileUrl)
        const fileUrl = (req.body.bookingPdfUrl || req.body.booking_pdf_url || req.body.fileUrl || '').trim();
        const fileName = req.body.fileName;

        const updateSet = {
            status: 'approved',

            // meta ของหัวหน้า
            superApprovedBy: superName,
            superApprovedById: superId,
            superApprovedAt: new Date(),

            // กล่องเลือก/เหตุผล/ลายเซ็นของหัวหน้า
            to_vice_supervisor: !!req.body.to_vice_supervisor,
            for_consider_supervisor: !!req.body.for_consider_supervisor,
            other_checked_supervisor: !!req.body.other_checked_supervisor,
            reason_supervisor: req.body.reason_supervisor || '',

            thaiName_supervisor: req.body.thaiName_supervisor || '',
            signaturePath_supervisor: req.body.signaturePath_supervisor || '',
            approvedAt_supervisor: req.body.approvedAt_supervisor
                ? new Date(req.body.approvedAt_supervisor)
                : new Date(),

            // (เผื่ออยากเก็บแบบ object ไว้โชว์ใน UI)
            head_choice_supervisor: {
                to_vice_supervisor: !!(req.body.head_choice_supervisor?.to_vice_supervisor ?? req.body.to_vice_supervisor),
                for_consider_supervisor: !!(req.body.head_choice_supervisor?.for_consider_supervisor ?? req.body.for_consider_supervisor),
                other_checked_supervisor: !!(req.body.head_choice_supervisor?.other_checked_supervisor ?? req.body.other_checked_supervisor),
            },

            updatedAt: new Date(),
        };

        // ✅ บันทึก URL ของไฟล์ (ทั้งฟิลด์หลักและสำรองให้โค้ดเก่าใช้ได้)
        if (fileUrl) {
            updateSet.bookingPdfUrl = fileUrl;   // ฟิลด์หลัก
            updateSet.booking_pdf_url = fileUrl; // alias
            // แนบเข้า attachment เพื่อให้การอ่านย้อนหลังยังใช้งานได้
            updateSet.attachment = Array.isArray(req.body.attachment) && req.body.attachment.length
                ? req.body.attachment
                : [fileUrl];

            // เก็บชื่อไฟล์เป็น array ให้สอดคล้องกับ attachment
            if (fileName) {
                updateSet.fileName = Array.isArray(fileName) ? fileName : [fileName];
            }
        }

        const updated = await History.findOneAndUpdate(
            cond,
            { $set: updateSet },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).send({ message: 'not found, not pending, or not secretary-approved' });
        }

        // ===== side-effects หลังอนุมัติจริง =====
        let totalHours = 0;
        if (updated.since && updated.uptodate && updated.startTime && updated.endTime) {
            totalHours = calcTotalHours(updated.since, updated.uptodate, updated.startTime, updated.endTime);
        }

        if (updated.agency && String(updated.agency).trim() !== '') {
            const dt = new Date(updated.approvedAt || Date.now()); // ใช้เวลาที่เลขาฯ approve ครั้งแรก
            await Information.findOneAndUpdate(
                { unit: new RegExp('^' + String(updated.agency).trim() + '$', 'i'), type: 'field' },
                {
                    $push: {
                        usageByMonthYear: {
                            year: dt.getFullYear(),
                            month: dt.getMonth() + 1,
                            usage: 1,
                            hours: totalHours,
                            fieldName: updated.name || ''
                        }
                    },
                    $inc: { usage: 1 }
                },
                { upsert: true, new: true }
            );
        }

        // ส่งอีเมลแจ้งผู้ใช้
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
                    endTime: updated.endTime
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